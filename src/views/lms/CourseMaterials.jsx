import React, { useEffect, useMemo, useState } from 'react'
import {
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'
import { ArpButton, ArpDataTable, ArpIconButton, useArpToast } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'
import { API_BASE } from '../../services/apiClient'

const emptyScope = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  semesterCategory: '',
  batchId: '',
  semester: '',
  facultyId: '',
  courseOfferingId: '',
}

const fileNameFromHeader = (header, fallback) => {
  const txt = String(header || '')
  const match = txt.match(/filename="?([^"]+)"?/i)
  return (match && match[1]) || fallback
}

const downloadBlob = (data, filename, contentType) => {
  const blob = new Blob([data], { type: contentType || 'application/octet-stream' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

const backendOrigin = (() => {
  const base = String(API_BASE || '').trim()
  const explicitUploadBase = String(import.meta.env.VITE_UPLOAD_BASE_URL || '').trim().replace(/\/$/, '')
  if (explicitUploadBase) return explicitUploadBase
  try {
    const url = new URL(base, window.location.origin)
    // If API base is relative (same frontend origin), use backend default port for uploads.
    if (!/^https?:\/\//i.test(base) && ['3000', '5173', '4173'].includes(url.port)) {
      return `${url.protocol}//${url.hostname}:4000`
    }
    return url.origin
  } catch {
    if (['3000', '5173', '4173'].includes(window.location.port)) {
      return `${window.location.protocol}//${window.location.hostname}:4000`
    }
    return window.location.origin
  }
})()

const toBrowserOpenableUrl = (target) => {
  const t = String(target || '').trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  if (t.startsWith('/uploads/')) return `${backendOrigin}${t}`
  if (t.startsWith('/')) return `${window.location.origin}${t}`
  return t
}

const mergeAllotmentsWithMaterials = (allotments = [], materials = []) => {
  const materialByOfferingFaculty = new Map(
    (Array.isArray(materials) ? materials : []).map((row) => [`${row.courseOfferingId}::${row.facultyId}`, row]),
  )

  return (Array.isArray(allotments) ? allotments : []).map((allotment) => {
    const matched = materialByOfferingFaculty.get(`${allotment.courseOfferingId}::${allotment.facultyId}`)
    return {
      rowKey: matched?.courseContentId || `${allotment.courseOfferingId}::${allotment.facultyId}`,
      courseContentId: matched?.courseContentId || '',
      courseMaterialId: matched?.courseMaterialId || '',
      courseOfferingId: allotment.courseOfferingId,
      facultyId: allotment.facultyId || '',
      facultyCode: matched?.facultyCode || allotment.facultyCode || '',
      facultyName: matched?.facultyName || allotment.facultyName || '',
      courseCode: matched?.courseCode || allotment.courseCode || '',
      courseName: matched?.courseName || allotment.courseName || '',
      unitCount: matched?.unitCount || 0,
      totalLectureHours: matched?.totalLectureHours || 0,
      status: matched?.status || 'Materials not Uploaded',
      itemCount: matched?.itemCount || 0,
      canOpen: Boolean(matched?.courseContentId),
    }
  })
}

const CourseMaterialsConfiguration = () => {
  const toast = useArpToast()
  const [scope, setScope] = useState(emptyScope)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [regulations, setRegulations] = useState([])
  const [batches, setBatches] = useState([])
  const [faculties, setFaculties] = useState([])
  const [courseOfferings, setCourseOfferings] = useState([])

  const [rows, setRows] = useState([])
  const [selectedRowKey, setSelectedRowKey] = useState('')
  const [allotmentRows, setAllotmentRows] = useState([])
  const [selectedCourseContentId, setSelectedCourseContentId] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [selectedTopicKey, setSelectedTopicKey] = useState('')
  const [detail, setDetail] = useState(null)

  const [unitNumber, setUnitNumber] = useState('')
  const [topicIndex, setTopicIndex] = useState('')
  const [materialHeading, setMaterialHeading] = useState('')
  const [resourceCategory, setResourceCategory] = useState('')
  const [resourceType, setResourceType] = useState('FILE')
  const [resourceUrl, setResourceUrl] = useState('')
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState(null)

  const showToast = (color, message, title = 'Course Materials', options = {}) => {
    toast.show({
      color,
      title,
      message,
      ...options,
    })
  }

  const resetLoadedState = () => {
    setRows([])
    setSelectedRowKey('')
    setSelectedCourseContentId('')
    setSelectedItemId('')
    setSelectedTopicKey('')
    setDetail(null)
    setUnitNumber('')
    setTopicIndex('')
    setMaterialHeading('')
    setResourceCategory('')
    setResourceType('FILE')
    setResourceUrl('')
    setRemarks('')
    setFile(null)
  }

  const validateFile = (f) => {
    if (!f) return ''
    const name = String(f.name || '').toLowerCase()
    const isImage = /\.(jpg|jpeg|png)$/.test(name)
    const isDoc = /\.(pdf|ppt|pptx|doc|docx|xls|xlsx)$/.test(name)
    if (!isImage && !isDoc) return 'Allowed files: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG'
    const max = isImage ? 5 * 1024 * 1024 : 25 * 1024 * 1024
    if (Number(f.size || 0) > max) return isImage ? 'Image file size must be 5 MB or less' : 'Document file size must be 25 MB or less'
    return ''
  }

  useEffect(() => {
    ;(async () => {
      try {
        setInstitutions(await lmsService.listInstitutions())
      } catch {
        showToast('danger', 'Failed to load institutions')
      }
    })()
  }, [toast])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(scope.academicYearId)) || null,
    [academicYears, scope.academicYearId],
  )
  const semesterCategoryOptions = useMemo(() => {
    if (!selectedAcademicYear) return []

    const options = []
    if (Array.isArray(selectedAcademicYear?.oddChosenSemesters) && selectedAcademicYear.oddChosenSemesters.length > 0) {
      options.push('ODD')
    }
    if (Array.isArray(selectedAcademicYear?.evenChosenSemesters) && selectedAcademicYear.evenChosenSemesters.length > 0) {
      options.push('EVEN')
    }
    if (options.length === 0) {
      const totalSemesters = Number(selectedAcademicYear?.semesters)
      if (Number.isFinite(totalSemesters) && totalSemesters > 0) {
        options.push('ODD', 'EVEN')
      }
    }
    return options
  }, [selectedAcademicYear])
  const resolvedAcademicYearId = useMemo(() => {
    const category = String(scope.semesterCategory || '').toUpperCase().trim()
    if (category === 'EVEN') return selectedAcademicYear?.evenAcademicYearId || scope.academicYearId
    if (category === 'ODD') return selectedAcademicYear?.oddAcademicYearId || scope.academicYearId
    return scope.academicYearId
  }, [scope.academicYearId, scope.semesterCategory, selectedAcademicYear])
  const semesterOptions = useMemo(
    () => semesterOptionsFromAcademicYear(selectedAcademicYear, scope.semesterCategory),
    [selectedAcademicYear, scope.semesterCategory],
  )

  const onScope = (key) => async (e) => {
    const value = e.target.value
    setScope((p) => ({ ...p, [key]: value }))
    resetLoadedState()

    if (key === 'institutionId') {
      setScope((p) => ({ ...emptyScope, institutionId: value }))
      setDepartments([])
      setProgrammes([])
      setAcademicYears([])
      setRegulations([])
      setBatches([])
      setFaculties([])
      setCourseOfferings([])
      setAllotmentRows([])
      if (!value) return
      try {
        const [d, ay] = await Promise.all([lmsService.listDepartments(value), lmsService.listAcademicYears(value)])
        setDepartments(d)
        setAcademicYears(ay)
      } catch {
        showToast('danger', 'Failed to load institution scope')
      }
      return
    }

    if (key === 'departmentId') {
      setScope((p) => ({
        ...p,
        departmentId: value,
        programmeId: '',
        regulationId: '',
        batchId: '',
        semesterCategory: '',
        semester: '',
        courseOfferingId: '',
        facultyId: '',
      }))
      setProgrammes([])
      setRegulations([])
      setBatches([])
      setCourseOfferings([])
      setFaculties([])
      setAllotmentRows([])
      if (!scope.institutionId || !value) return
      try {
        setProgrammes(await lmsService.listProgrammes(scope.institutionId, value))
      } catch {
        showToast('danger', 'Failed to load programmes')
      }
      return
    }

    if (key === 'programmeId' || key === 'academicYearId') {
      const institutionId = scope.institutionId
      const programmeId = key === 'programmeId' ? value : scope.programmeId
      const academicYearId = key === 'academicYearId' ? value : scope.academicYearId
      const selectedYear =
        (key === 'academicYearId'
          ? academicYears.find((x) => String(x.id) === String(value))
          : selectedAcademicYear) || null
      const academicYearIds = [selectedYear?.oddAcademicYearId, selectedYear?.evenAcademicYearId].filter(Boolean)
      setScope((p) => ({
        ...p,
        [key]: value,
        regulationId: '',
        batchId: '',
        semesterCategory: '',
        semester: '',
        courseOfferingId: '',
      }))
      setRegulations([])
      setBatches([])
      setCourseOfferings([])
      setAllotmentRows([])
      if (!institutionId || !programmeId || !academicYearId) return
      try {
        const mapped = await lmsService.listRegulationMaps({
          institutionId,
          programmeId,
          ...(academicYearIds.length ? { academicYearIds } : { academicYearId }),
        })
        setRegulations(Array.from(new Map(mapped.map((m) => [m.regulationId, { id: m.regulationId, label: m.regulationCode || '-' }])).values()))
        setBatches(Array.from(new Map(mapped.map((m) => [m.batchId, { id: m.batchId, label: m.batch || '-' }])).values()))
      } catch {
        showToast('danger', 'Failed to load regulations/batches')
      }
      return
    }

    if (key === 'facultyId') {
      setScope((p) => ({ ...p, facultyId: value, courseOfferingId: '' }))
      setCourseOfferings([])
      return
    }

    if (key === 'academicYearId') return

    if (key === 'semesterCategory') {
      setScope((p) => ({ ...p, semesterCategory: value, semester: '', courseOfferingId: '' }))
      setCourseOfferings([])
      return
    }

    if (key === 'semester' || key === 'batchId' || key === 'regulationId') {
      setScope((p) => ({ ...p, [key]: value, courseOfferingId: '' }))
      setCourseOfferings([])
    }
  }

  useEffect(() => {
    ;(async () => {
      if (!scope.institutionId || !scope.academicYearId) return
      try {
        setFaculties(await lmsService.listFaculties({ institutionId: scope.institutionId, departmentId: scope.departmentId, academicYearId: scope.academicYearId }))
      } catch {
        setFaculties([])
        showToast('danger', 'Failed to load faculties')
      }
    })()
  }, [scope.institutionId, scope.departmentId, scope.academicYearId, toast])

  useEffect(() => {
    setScope((p) => {
      const nextCategory = semesterCategoryOptions.includes(p.semesterCategory)
        ? p.semesterCategory
        : semesterCategoryOptions[0] || ''
      const allowedSemesters = semesterOptions.map((x) => String(x.value))
      const nextSemester = allowedSemesters.includes(String(p.semester || '')) ? p.semester : ''
      if (p.semesterCategory === nextCategory && String(p.semester || '') === String(nextSemester || '')) return p
      return { ...p, semesterCategory: nextCategory, semester: nextSemester, courseOfferingId: '' }
    })
  }, [semesterCategoryOptions, semesterOptions])

  useEffect(() => {
    ;(async () => {
      if (!scope.institutionId || !scope.programmeId || !scope.academicYearId || !scope.regulationId || !scope.semesterCategory || !scope.semester) {
        setAllotmentRows([])
        setCourseOfferings([])
        return
      }
      try {
        const details = await lmsService.listCourseAllotmentDetails({
          ...scope,
          academicYearId: resolvedAcademicYearId,
        })
        setAllotmentRows(details)
        const filtered = scope.facultyId
          ? details.filter((x) => String(x.facultyId || '') === String(scope.facultyId))
          : details
        const offerings = Array.from(
          new Map(
            filtered.map((x) => [
              String(x.courseOfferingId),
              {
                id: x.courseOfferingId,
                course: {
                  courseCode: x.courseCode || '',
                  courseTitle: x.courseName || '',
                },
              },
            ]),
          ).values(),
        )
        setCourseOfferings(offerings)
      } catch {
        setAllotmentRows([])
        setCourseOfferings([])
        showToast('danger', 'Failed to load course offerings')
      }
    })()
  }, [scope.institutionId, scope.programmeId, scope.academicYearId, scope.regulationId, scope.batchId, scope.semesterCategory, scope.semester, resolvedAcademicYearId, toast])

  const normalizedCourseOfferingIdForSearch =
    scope.courseOfferingId && scope.courseOfferingId !== 'ALL' ? scope.courseOfferingId : ''

  const loadRows = async () => {
    if (!scope.semesterCategory) {
      showToast('warning', 'Select Semester Category')
      return
    }
    try {
      setLoading(true)
      const data = await lmsService.listCourseMaterials({
        ...scope,
        academicYearId: resolvedAcademicYearId,
        courseOfferingId: normalizedCourseOfferingIdForSearch,
      })
      const filteredAllotments = allotmentRows.filter((row) => {
        const facultyMatch = !scope.facultyId || String(row.facultyId || '') === String(scope.facultyId)
        const courseMatch =
          !normalizedCourseOfferingIdForSearch || String(row.courseOfferingId || '') === String(normalizedCourseOfferingIdForSearch)
        return facultyMatch && courseMatch
      })
      setRows(mergeAllotmentsWithMaterials(filteredAllotments, data || []))
      setSelectedRowKey('')
      setSelectedCourseContentId('')
      setDetail(null)
      setSelectedItemId('')
      setSelectedTopicKey('')
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to load course materials')
    } finally {
      setLoading(false)
    }
  }

  const openDetail = async (courseContentId) => {
    if (!courseContentId) {
      showToast('warning', 'Course contents are not available for the selected row')
      return
    }
    try {
      const d = await lmsService.getCourseMaterialByCourseContentId(courseContentId)
      setDetail(d)
      const matchedRow = rows.find((row) => String(row.courseContentId) === String(courseContentId))
      setSelectedRowKey(matchedRow?.rowKey || courseContentId)
      setSelectedCourseContentId(courseContentId)
      setSelectedItemId('')
      const firstUnit = (d?.planUnits || [])[0]?.unitNumber
      const firstTopic = (d?.planUnits || [])[0]?.topics?.[0]
      setUnitNumber(firstUnit ? String(firstUnit) : '')
      setTopicIndex(firstTopic?.topicIndex ? String(firstTopic.topicIndex) : '')
      setSelectedTopicKey(firstUnit && firstTopic?.topicIndex ? `${firstUnit}-${firstTopic.topicIndex}` : '')
      setMaterialHeading('')
      setResourceCategory('')
      setResourceType('FILE')
      setResourceUrl('')
      setRemarks('')
      setFile(null)
      showToast(
        'info',
        'Documents: up to 25 MB. Images: up to 5 MB. Use URL for video resources.',
        'Course Materials Instructions',
      )
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to load material details')
    }
  }

  const topicRows = useMemo(() => {
    if (!detail) return []
    const items = detail.items || []
    return (detail.planUnits || []).flatMap((u) =>
      (u.topics || []).map((t) => {
        const topicItems = items.filter((x) => Number(x.unitNumber) === Number(u.unitNumber) && Number(x.topicIndex) === Number(t.topicIndex))
        return {
          key: `${u.unitNumber}-${t.topicIndex}`,
          unitNumber: u.unitNumber,
          chapterHeading: u.chapterHeading || '',
          topicIndex: t.topicIndex,
          topic: t.topic || '',
          hours: t.hours || 0,
          status: topicItems.length > 0 ? 'Uploaded' : 'Not Uploaded',
          count: topicItems.length,
          items: topicItems,
        }
      }),
    )
  }, [detail])

  const selectedTopic = useMemo(
    () => topicRows.find((x) => x.key === selectedTopicKey) || null,
    [topicRows, selectedTopicKey],
  )
  const unitOptions = useMemo(
    () =>
      Array.from(new Set(topicRows.map((x) => Number(x.unitNumber))))
        .sort((a, b) => a - b)
        .map((x) => String(x)),
    [topicRows],
  )
  const topicsForSelectedUnit = useMemo(
    () => topicRows.filter((x) => String(x.unitNumber) === String(unitNumber)),
    [topicRows, unitNumber],
  )

  const saveItem = async () => {
    if (!selectedCourseContentId || !scope.facultyId) {
      showToast('warning', 'Select a course row and faculty')
      return
    }
    if (!selectedTopic || !materialHeading) {
      showToast('warning', 'Select topic and enter material heading')
      return
    }
    if (resourceType === 'FILE' && !file) {
      showToast('warning', 'Choose a file for FILE type')
      return
    }
    if (resourceType === 'FILE' && file) {
      const fileErr = validateFile(file)
      if (fileErr) {
        showToast('warning', fileErr)
        return
      }
    }
    if (resourceType === 'URL' && !resourceUrl) {
      showToast('warning', 'Provide URL for URL type')
      return
    }
    try {
      setSaving(true)
      await lmsService.saveCourseMaterialItem(selectedCourseContentId, {
        facultyId: scope.facultyId,
        itemId: selectedItemId || '',
        unitNumber: selectedTopic.unitNumber,
        topicIndex: selectedTopic.topicIndex,
        materialHeading,
        resourceCategory,
        resourceType,
        resourceUrl,
        remarks,
        file,
      })
      showToast('success', selectedItemId ? 'Material updated successfully' : 'Material saved successfully')
      await refreshDetailPreserve()
      await loadRows()
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to save material')
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async () => {
    if (!selectedItemId || !scope.facultyId) {
      showToast('warning', 'Select a material to delete')
      return
    }
    try {
      await lmsService.deleteCourseMaterialItem(selectedItemId, scope.facultyId)
      showToast('warning', 'Material deleted successfully')
      await refreshDetailPreserve({ keepSelectedItem: false })
      await loadRows()
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to delete material')
    }
  }

  const exportMaterials = async () => {
    if (!selectedCourseContentId) return
    try {
      const res = await lmsService.exportCourseMaterials(selectedCourseContentId)
      downloadBlob(
        res.data,
        fileNameFromHeader(res?.headers?.['content-disposition'], 'Course_Materials.xlsx'),
        res?.headers?.['content-type'],
      )
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to export course materials')
    }
  }

  const onPickItem = (item) => {
    setSelectedItemId(item.id)
    setUnitNumber(String(item.unitNumber || ''))
    setTopicIndex(item.topicIndex ? String(item.topicIndex) : '')
    setSelectedTopicKey(item.topicIndex ? `${item.unitNumber}-${item.topicIndex}` : '')
    setMaterialHeading(item.materialHeading || '')
    setResourceCategory(item.resourceCategory || '')
    setResourceType(item.resourceType || 'FILE')
    setResourceUrl(item.resourceUrl || '')
    setRemarks(item.remarks || '')
    setFile(null)
  }

  const onViewMaterial = (item) => {
    const rawTarget = item.resourceType === 'URL' ? item.resourceUrl : item.filePath
    const target = toBrowserOpenableUrl(rawTarget)
    if (target) window.open(target, '_blank', 'noopener,noreferrer')
  }

  const onDownloadMaterial = (item) => {
    const rawTarget = item.resourceType === 'URL' ? item.resourceUrl : item.filePath
    const target = toBrowserOpenableUrl(rawTarget)
    if (!target) return
    const a = document.createElement('a')
    a.href = target
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    if (item.resourceType !== 'URL') a.download = item.fileName || 'course-material'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const resetMaterialForm = () => {
    setSelectedItemId('')
    setMaterialHeading('')
    setResourceCategory('')
    setResourceType('FILE')
    setResourceUrl('')
    setRemarks('')
    setFile(null)
  }

  const closeDetail = () => {
    setDetail(null)
    setSelectedItemId('')
    setSelectedTopicKey('')
    setUnitNumber('')
    setTopicIndex('')
    resetMaterialForm()
  }

  const refreshDetailPreserve = async ({ keepSelectedItem = true } = {}) => {
    const d = await lmsService.getCourseMaterialByCourseContentId(selectedCourseContentId)
    setDetail(d)

    const topicKeys = (d?.planUnits || []).flatMap((u) => (u.topics || []).map((t) => `${u.unitNumber}-${t.topicIndex}`))
    const fallbackKey = topicKeys[0] || ''
    const nextKey = selectedTopicKey && topicKeys.includes(selectedTopicKey) ? selectedTopicKey : fallbackKey
    const [nextUnit, nextTopic] = String(nextKey || '').split('-')

    setSelectedTopicKey(nextKey)
    setUnitNumber(nextUnit || '')
    setTopicIndex(nextTopic || '')

    const keepItem =
      keepSelectedItem &&
      selectedItemId &&
      (d?.items || []).some((x) => String(x.id) === String(selectedItemId))
        ? selectedItemId
        : ''
    setSelectedItemId(keepItem)
  }

  const startAddForTopic = (tr) => {
    setSelectedTopicKey(tr.key)
    setUnitNumber(String(tr.unitNumber))
    setTopicIndex(String(tr.topicIndex))
    resetMaterialForm()
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>COURSE MATERIALS</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}><CFormLabel>Institution</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.institutionId} onChange={onScope('institutionId')}>
                  <option value="">Select Institution</option>
                  {institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.academicYearId} onChange={onScope('academicYearId')}>
                  <option value="">Select Academic Year</option>
                  {academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Department</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.departmentId} onChange={onScope('departmentId')}>
                  <option value="">Select Department</option>
                  {departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}><CFormLabel>Programme</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.programmeId} onChange={onScope('programmeId')}>
                  <option value="">Select Programme</option>
                  {programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode} - {x.programmeName}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Regulation</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.regulationId} onChange={onScope('regulationId')}>
                  <option value="">Select Regulation</option>
                  {regulations.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}><CFormLabel>Batch</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.batchId} onChange={onScope('batchId')}>
                  <option value="">Select Batch</option>
                  {batches.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Semester Category</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.semesterCategory} onChange={onScope('semesterCategory')}>
                  <option value="">{scope.academicYearId ? 'Select Semester Category' : 'Select Academic Year'}</option>
                  {semesterCategoryOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.semester} onChange={onScope('semester')}>
                  <option value="">{scope.semesterCategory ? 'Select Semester' : 'Select Semester Category'}</option>
                  {semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}><CFormLabel>Choose Faculty</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.facultyId} onChange={onScope('facultyId')}>
                  <option value="">Select Faculty</option>
                  {faculties.map((x) => <option key={x.id} value={x.id}>{x.facultyCode} - {x.facultyName}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Course Offering</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.courseOfferingId} onChange={onScope('courseOfferingId')}>
                  <option value="">Select Course</option>
                  <option value="ALL">All Courses</option>
                  {courseOfferings.map((x) => <option key={x.id} value={x.id}>{x.course?.courseCode} - {x.course?.courseTitle}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={6} className="d-flex align-items-end justify-content-end">
                <ArpButton
                  label={loading ? 'Searching...' : 'Search'}
                  icon="search"
                  color="primary"
                  onClick={loadRows}
                  disabled={loading}
                />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <ArpDataTable
          className="mb-3"
          title="Details for Uploaded Course Materials"
          rows={rows}
          rowKey="courseContentId"
          columns={[
            { key: 'course', label: 'Course', sortable: true, render: (r) => `${r.courseCode || '-'} - ${r.courseName || '-'}` },
            { key: 'faculty', label: 'Faculty', sortable: true, render: (r) => `${r.facultyCode || '-'} - ${r.facultyName || '-'}` },
            { key: 'status', label: 'Status', sortable: true },
            { key: 'unitCount', label: 'Units', sortable: true, sortType: 'number' },
            { key: 'itemCount', label: 'Materials Count', sortable: true, sortType: 'number' },
          ]}
          selection={{
            type: 'radio',
            selected: selectedRowKey,
            key: 'rowKey',
            name: 'matSel',
            onChange: (value) => {
              const selectedRow = rows.find((row) => String(row.rowKey) === String(value))
              setSelectedRowKey(value)
              setSelectedCourseContentId(selectedRow?.courseContentId || '')
            },
            headerLabel: 'Select',
          }}
          headerActions={
            <>
              <ArpIconButton icon="view" color="info" disabled={!selectedCourseContentId} onClick={() => openDetail(selectedCourseContentId)} />
              <ArpIconButton icon="download" color="secondary" disabled={!selectedCourseContentId} onClick={exportMaterials} />
            </>
          }
        />

        {detail ? (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Course Materials</strong>
              <div className="d-flex gap-2">
                <ArpButton
                  label="Instructions"
                  color="info"
                  icon="view"
                  onClick={() =>
                    showToast(
                      'info',
                      'Documents: up to 25 MB. Images: up to 5 MB. Use URL for video resources.',
                      'Course Materials Instructions',
                    )
                  }
                />
                <ArpButton label="Close" color="secondary" onClick={closeDetail} />
              </div>
            </CCardHeader>
            <CCardBody>
              <CRow className="g-3 mb-3">
                <CCol md={3}>
                  <CFormLabel>Unit Number</CFormLabel>
                  <CFormSelect
                    value={unitNumber || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setUnitNumber(val)
                      const firstTopic = topicRows.find((x) => String(x.unitNumber) === String(val))
                      if (firstTopic) {
                        setSelectedTopicKey(firstTopic.key)
                        setTopicIndex(String(firstTopic.topicIndex))
                      } else {
                        setSelectedTopicKey('')
                        setTopicIndex('')
                      }
                      setSelectedItemId('')
                    }}
                  >
                    <option value="">Select Unit</option>
                    {unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
                  </CFormSelect>
                </CCol>
                <CCol md={5}>
                  <CFormLabel>Chapter Heading</CFormLabel>
                  <CFormInput
                    value={selectedTopic?.chapterHeading || ''}
                    disabled
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Topic Index</CFormLabel>
                  <CFormInput value={topicIndex || ''} disabled />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Status</CFormLabel>
                  <CFormInput value={selectedTopic?.status || detail.materialStatus || 'DRAFT'} disabled />
                </CCol>
              </CRow>

              <CAccordion alwaysOpen activeItemKey={selectedTopicKey ? [selectedTopicKey] : []}>
                {topicsForSelectedUnit.map((tr) => {
                  const selectedTopicItem = tr.items.find((x) => String(x.id) === String(selectedItemId)) || null
                  const isTopicSelected = selectedTopicKey === tr.key
                  return (
                    <CAccordionItem itemKey={tr.key} key={tr.key}>
                      <CAccordionHeader onClick={() => {
                        setSelectedTopicKey(tr.key)
                        setTopicIndex(String(tr.topicIndex))
                      }}
                      >
                        <div className="d-flex w-100 justify-content-between align-items-center pe-2">
                          <div>
                            <strong>{tr.topicIndex} - {tr.topic}</strong>
                            <div className="small text-medium-emphasis">
                              {tr.chapterHeading || '-'} | Hours: {tr.hours}
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <CBadge color={tr.status === 'Uploaded' ? 'success' : 'warning'}>{tr.status}</CBadge>
                            <CBadge color="secondary">{tr.count} materials</CBadge>
                            <ArpIconButton
                              icon="add"
                              color="success"
                              title="Add Material"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                startAddForTopic(tr)
                              }}
                            />
                            <ArpIconButton
                              icon="view"
                              color="info"
                              title="View Selected Material"
                              disabled={!selectedTopicItem && !tr.items.length}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const item = selectedTopicItem || tr.items[0]
                                if (item) onViewMaterial(item)
                              }}
                            />
                          </div>
                        </div>
                      </CAccordionHeader>
                      <CAccordionBody>
                        <CRow className="g-3 mb-3">
                          <CCol md={4}>
                            <CFormLabel>Material Heading</CFormLabel>
                            <CFormInput
                              value={isTopicSelected ? materialHeading : ''}
                              onChange={(e) => {
                                if (!isTopicSelected) {
                                  setSelectedTopicKey(tr.key)
                                  setUnitNumber(String(tr.unitNumber))
                                  setTopicIndex(String(tr.topicIndex))
                                  resetMaterialForm()
                                }
                                setMaterialHeading(e.target.value)
                              }}
                            />
                          </CCol>
                          <CCol md={2}>
                            <CFormLabel>Resource Category</CFormLabel>
                            <CFormInput
                              value={isTopicSelected ? resourceCategory : ''}
                              onChange={(e) => {
                                if (!isTopicSelected) {
                                  setSelectedTopicKey(tr.key)
                                  setUnitNumber(String(tr.unitNumber))
                                  setTopicIndex(String(tr.topicIndex))
                                  resetMaterialForm()
                                }
                                setResourceCategory(e.target.value)
                              }}
                            />
                          </CCol>
                          <CCol md={2}>
                            <CFormLabel>Resource Type</CFormLabel>
                            <CFormSelect
                              value={isTopicSelected ? resourceType : 'FILE'}
                              onChange={(e) => {
                                if (!isTopicSelected) {
                                  setSelectedTopicKey(tr.key)
                                  setUnitNumber(String(tr.unitNumber))
                                  setTopicIndex(String(tr.topicIndex))
                                  resetMaterialForm()
                                }
                                setResourceType(e.target.value)
                              }}
                            >
                              <option value="FILE">FILE</option>
                              <option value="URL">URL</option>
                            </CFormSelect>
                          </CCol>
                          <CCol md={4}>
                            {(isTopicSelected ? resourceType : 'FILE') === 'URL' ? (
                              <>
                                <CFormLabel>Resource URL</CFormLabel>
                                <CFormInput
                                  value={isTopicSelected ? resourceUrl : ''}
                                  onChange={(e) => {
                                    if (!isTopicSelected) {
                                      setSelectedTopicKey(tr.key)
                                      setUnitNumber(String(tr.unitNumber))
                                      setTopicIndex(String(tr.topicIndex))
                                      resetMaterialForm()
                                    }
                                    setResourceUrl(e.target.value)
                                  }}
                                />
                              </>
                            ) : (
                              <>
                                <CFormLabel>Choose File</CFormLabel>
                                <CFormInput
                                  type="file"
                                  accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    if (!isTopicSelected) {
                                      setSelectedTopicKey(tr.key)
                                      setUnitNumber(String(tr.unitNumber))
                                      setTopicIndex(String(tr.topicIndex))
                                      resetMaterialForm()
                                    }
                                    setFile(e.target.files?.[0] || null)
                                  }}
                                />
                              </>
                            )}
                          </CCol>
                          <CCol md={8}>
                            <CFormLabel>Remarks</CFormLabel>
                            <CFormInput
                              value={isTopicSelected ? remarks : ''}
                              onChange={(e) => {
                                if (!isTopicSelected) {
                                  setSelectedTopicKey(tr.key)
                                  setUnitNumber(String(tr.unitNumber))
                                  setTopicIndex(String(tr.topicIndex))
                                  resetMaterialForm()
                                }
                                setRemarks(e.target.value)
                              }}
                            />
                          </CCol>
                          <CCol md={4} className="d-flex align-items-end justify-content-end gap-2">
                            <ArpButton
                              label={saving ? 'Saving...' : (selectedItemId && isTopicSelected ? 'Update Material' : 'Save Material')}
                              color="success"
                              onClick={() => {
                                if (!isTopicSelected) {
                                  startAddForTopic(tr)
                                  return
                                }
                                saveItem()
                              }}
                              disabled={saving}
                            />
                            <ArpButton label="Clear" color="secondary" onClick={resetMaterialForm} />
                            <ArpIconButton
                              icon="delete"
                              color="danger"
                              title="Delete Selected Material"
                              disabled={!selectedTopicItem}
                              onClick={deleteItem}
                            />
                          </CCol>
                        </CRow>

                        <CTable bordered hover responsive>
                          <CTableHead>
                            <CTableRow>
                              <CTableHeaderCell>Select</CTableHeaderCell>
                              <CTableHeaderCell>Material Heading</CTableHeaderCell>
                              <CTableHeaderCell>Type</CTableHeaderCell>
                              <CTableHeaderCell>URL / File</CTableHeaderCell>
                              <CTableHeaderCell>Actions</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {tr.items.map((x) => (
                              <CTableRow key={x.id}>
                                <CTableDataCell>
                                  <input
                                    type="radio"
                                    name={`itemSel-${tr.key}`}
                                    checked={String(selectedItemId) === String(x.id)}
                                    onChange={() => onPickItem(x)}
                                  />
                                </CTableDataCell>
                                <CTableDataCell>{x.materialHeading}</CTableDataCell>
                                <CTableDataCell>{x.resourceType}</CTableDataCell>
                                <CTableDataCell>{x.resourceType === 'URL' ? (x.resourceUrl || '-') : (x.fileName || '-')}</CTableDataCell>
                                <CTableDataCell>
                                  <div className="d-flex gap-2">
                                    <ArpIconButton icon="view" color="info" title="View Material" onClick={() => onViewMaterial(x)} />
                                    <ArpIconButton icon="download" color="secondary" title="Download Material" onClick={() => onDownloadMaterial(x)} />
                                  </div>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                            {!tr.items.length ? (
                              <CTableRow>
                                <CTableDataCell colSpan={5} className="text-center text-medium-emphasis">
                                  No materials uploaded for this topic
                                </CTableDataCell>
                              </CTableRow>
                            ) : null}
                          </CTableBody>
                        </CTable>
                      </CAccordionBody>
                    </CAccordionItem>
                  )
                })}
              </CAccordion>
            </CCardBody>
          </CCard>
        ) : null}
      </CCol>
    </CRow>
  )
}

export default CourseMaterialsConfiguration
