import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
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

const defaultForwardTarget = 'HOD'
const forwardTargets = ['HOD', 'DIRECTOR', 'DEAN', 'PRINCIPAL']
const entryModes = {
  upload: 'UPLOAD',
  direct: 'DIRECT',
}
const sectionKeys = {
  prerequisites: 'prerequisites',
  courseObjectives: 'courseObjectives',
  unitContent: 'unitContent',
  unitPlan: 'unitPlan',
  textbooks: 'textbooks',
  referenceBooks: 'referenceBooks',
  onlineReferences: 'onlineReferences',
}
const sectionOptions = [
  { key: sectionKeys.prerequisites, label: 'Pre-requisites' },
  { key: sectionKeys.courseObjectives, label: 'Course Objectives' },
  { key: sectionKeys.unitContent, label: 'Chapter Headings' },
  { key: sectionKeys.unitPlan, label: 'Unit wise Course Plan' },
  { key: sectionKeys.textbooks, label: 'Textbooks' },
  { key: sectionKeys.referenceBooks, label: 'Reference Books' },
  { key: sectionKeys.onlineReferences, label: 'Online References' },
]

const toStringList = (value) => {
  if (Array.isArray(value)) return value.map((x) => String(x || '')).filter((x) => x.trim().length > 0)
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|;/)
      .map((x) => x.trim())
      .filter(Boolean)
  }
  return []
}

const toPlanSeed = (units = []) =>
  units.map((u) => ({
    unitNumber: Number(u.unitNumber),
    totalHours: Number(u.totalHours),
    chapterHeading: u.chapterHeading || '',
    topics: [{ topicIndex: 1, topic: u.chapterHeading || `Unit ${u.unitNumber} Topic`, hours: Number(u.totalHours) }],
  }))

const mergePlanUnitsWithContentUnits = (planUnits = [], contentUnits = []) => {
  const contentByUnit = new Map(contentUnits.map((unit) => [String(unit?.unitNumber), unit]))
  const merged = (Array.isArray(planUnits) ? planUnits : []).map((unit) => {
    const contentUnit = contentByUnit.get(String(unit?.unitNumber))
    return {
      ...unit,
      totalHours: Number(unit?.totalHours ?? contentUnit?.totalHours ?? 0),
      chapterHeading: unit?.chapterHeading || contentUnit?.chapterHeading || '',
    }
  })

  const existingUnitNumbers = new Set(merged.map((unit) => String(unit?.unitNumber)))
  const missingUnits = (Array.isArray(contentUnits) ? contentUnits : [])
    .filter((unit) => !existingUnitNumbers.has(String(unit?.unitNumber)))
    .map((unit) => ({
      unitNumber: Number(unit.unitNumber),
      totalHours: Number(unit.totalHours),
      chapterHeading: unit.chapterHeading || '',
      topics: [{ topicIndex: 1, topic: unit.chapterHeading || `Unit ${unit.unitNumber} Topic`, hours: Number(unit.totalHours) }],
    }))

  return [...merged, ...missingUnits].sort((left, right) => Number(left?.unitNumber || 0) - Number(right?.unitNumber || 0))
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

const fileNameFromHeader = (header, fallback) => {
  const txt = String(header || '')
  const match = txt.match(/filename="?([^"]+)"?/i)
  return (match && match[1]) || fallback
}

const entryModeLabel = (value) => (value === 'TEMPLATE_UPLOAD' ? 'Template Upload' : 'Direct Entry')
const contentStatusLabel = (row) => row?.status || 'NOT_STARTED'
const mergeAllotmentsWithContents = (allotments = [], contents = []) => {
  const contentByOfferingFaculty = new Map(
    (Array.isArray(contents) ? contents : []).map((row) => [`${row.courseOfferingId}::${row.facultyId}`, row]),
  )

  return (Array.isArray(allotments) ? allotments : []).map((allotment) => {
    const matched = contentByOfferingFaculty.get(`${allotment.courseOfferingId}::${allotment.facultyId}`)
    return {
      rowKey: matched?.id || `${allotment.courseOfferingId}::${allotment.facultyId}`,
      id: matched?.id || '',
      courseOfferingId: allotment.courseOfferingId,
      facultyId: allotment.facultyId,
      courseCode: matched?.courseCode || allotment.courseCode || '',
      courseName: matched?.courseName || allotment.courseName || '',
      facultyCode: matched?.facultyCode || allotment.facultyCode || '',
      facultyName: matched?.facultyName || allotment.facultyName || '',
      entryMode: matched?.entryMode || '',
      status: matched?.status || 'NOT_STARTED',
      unitCount: matched?.unitCount || 0,
      totalLectureHours: matched?.totalLectureHours || 0,
      uploadedFileName: matched?.uploadedFileName || '',
      updatedAt: matched?.updatedAt || allotment?.updatedAt || '',
      canOpen: Boolean(matched?.id),
    }
  })
}

const CourseContentsConfiguration = () => {
  const toast = useArpToast()
  const [scope, setScope] = useState(emptyScope)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [startingDirect, setStartingDirect] = useState(false)
  const [entryMode, setEntryMode] = useState(entryModes.upload)
  const [selectedRowKey, setSelectedRowKey] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [contentsRows, setContentsRows] = useState([])
  const [allotmentRows, setAllotmentRows] = useState([])
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [contentUnits, setContentUnits] = useState([])
  const [planUnits, setPlanUnits] = useState([])
  const [forwardTarget, setForwardTarget] = useState(defaultForwardTarget)
  const [file, setFile] = useState(null)
  const [dashboardRows, setDashboardRows] = useState([])
  const [activeSection, setActiveSection] = useState(sectionKeys.prerequisites)
  const [editingSections, setEditingSections] = useState({
    [sectionKeys.prerequisites]: false,
    [sectionKeys.courseObjectives]: false,
    [sectionKeys.unitContent]: false,
    [sectionKeys.unitPlan]: false,
    [sectionKeys.textbooks]: false,
    [sectionKeys.referenceBooks]: false,
    [sectionKeys.onlineReferences]: false,
  })
  const [selectedRows, setSelectedRows] = useState({
    [sectionKeys.prerequisites]: -1,
    [sectionKeys.courseObjectives]: -1,
    [sectionKeys.unitContent]: -1,
    [sectionKeys.unitPlan]: -1,
    [sectionKeys.textbooks]: -1,
    [sectionKeys.referenceBooks]: -1,
    [sectionKeys.onlineReferences]: -1,
  })
  const [prerequisiteRows, setPrerequisiteRows] = useState([])
  const [courseObjectiveRows, setCourseObjectiveRows] = useState([])
  const [textbookRows, setTextbookRows] = useState([])
  const [referenceBookRows, setReferenceBookRows] = useState([])
  const [onlineReferenceRows, setOnlineReferenceRows] = useState([])
  const [selectedPlanUnit, setSelectedPlanUnit] = useState('')
  const [selectedPlanTopicRow, setSelectedPlanTopicRow] = useState(-1)

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [regulations, setRegulations] = useState([])
  const [batches, setBatches] = useState([])
  const [faculties, setFaculties] = useState([])
  const [courseOfferings, setCourseOfferings] = useState([])

  const showToast = (color, message, title = 'Course Contents', options = {}) => {
    toast.show({
      color,
      title,
      message,
      ...options,
    })
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

    if (key === 'institutionId') {
      setScope((p) => ({ ...emptyScope, institutionId: value }))
      setDepartments([])
      setProgrammes([])
      setAcademicYears([])
      setRegulations([])
      setBatches([])
      setFaculties([])
      setCourseOfferings([])
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
      return
    }
  }

  const normalizedCourseOfferingIdForSearch =
    scope.courseOfferingId && scope.courseOfferingId !== 'ALL' ? scope.courseOfferingId : ''

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
  }, [scope.institutionId, scope.programmeId, scope.academicYearId, scope.regulationId, scope.batchId, scope.semesterCategory, scope.semester, scope.facultyId, resolvedAcademicYearId, toast])

  const loadRows = async () => {
    try {
      setLoading(true)
      const [existingRows, dashboardStatus] = await Promise.all([
        lmsService.listCourseContents({
          ...scope,
          academicYearId: resolvedAcademicYearId,
          courseOfferingId: normalizedCourseOfferingIdForSearch,
        }),
        lmsService.getCourseContentsDashboardStatus({
          ...scope,
          academicYearId: resolvedAcademicYearId,
          courseOfferingId: normalizedCourseOfferingIdForSearch,
          role: scope.facultyId ? 'FACULTY' : 'HOD',
          facultyId: scope.facultyId,
        }),
      ])
      const filteredAllotments = allotmentRows.filter((row) => {
        const facultyMatch = !scope.facultyId || String(row.facultyId || '') === String(scope.facultyId)
        const courseMatch =
          !normalizedCourseOfferingIdForSearch || String(row.courseOfferingId || '') === String(normalizedCourseOfferingIdForSearch)
        return facultyMatch && courseMatch
      })
      const rows = mergeAllotmentsWithContents(filteredAllotments, existingRows)
      setContentsRows(rows)
      setDashboardRows(dashboardStatus)
      setSelectedRowKey('')
      setSelectedId('')
      setSelectedDetail(null)
      setContentUnits([])
      setPlanUnits([])
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to load course contents')
    } finally {
      setLoading(false)
    }
  }

  const onDownloadTemplate = async () => {
    if (!scope.courseOfferingId || scope.courseOfferingId === 'ALL') {
      showToast('warning', 'Select the offered course before downloading template')
      return
    }
    try {
      const res = await lmsService.downloadCourseContentsTemplate(scope.courseOfferingId)
      const filename = fileNameFromHeader(res?.headers?.['content-disposition'], 'Course_Contents_Template.xlsx')
      downloadBlob(res.data, filename, res?.headers?.['content-type'])
    } catch {
      showToast('danger', 'Failed to download template')
    }
  }

  const onUpload = async () => {
    if (!scope.courseOfferingId || scope.courseOfferingId === 'ALL' || !scope.facultyId || !file) {
      showToast('warning', 'Select faculty, course offering and file')
      return
    }
    try {
      setUploading(true)
      await lmsService.importCourseContents({ courseOfferingId: scope.courseOfferingId, facultyId: scope.facultyId, file })
      showToast('success', 'Course contents uploaded')
      setFile(null)
      await loadRows()
    } catch (e) {
      const ct = String(e?.response?.headers?.['content-type'] || '').toLowerCase()
      const cd = String(e?.response?.headers?.['content-disposition'] || '')
      const data = e?.response?.data
      if (data instanceof Blob && (ct.includes('spreadsheetml') || ct.includes('application/vnd.ms-excel') || cd.toLowerCase().includes('attachment'))) {
        downloadBlob(data, fileNameFromHeader(cd, 'Course_Contents_Import_Errors.xlsx'), ct)
        showToast('danger', 'Upload failed. Error report downloaded.', 'Course Contents', { autohide: false })
      } else if (data instanceof Blob) {
        try {
          const txt = await data.text()
          const parsed = txt ? JSON.parse(txt) : null
          showToast('danger', parsed?.error || parsed?.message || 'Upload failed')
        } catch {
          showToast('danger', 'Upload failed')
        }
      } else {
        showToast('danger', e?.response?.data?.error || 'Upload failed')
      }
    } finally {
      setUploading(false)
    }
  }

  const onStartDirectEntry = async () => {
    if (!scope.courseOfferingId || scope.courseOfferingId === 'ALL' || !scope.facultyId) {
      showToast('warning', 'Select faculty and course offering')
      return
    }
    try {
      setStartingDirect(true)
      const detailSeed = await lmsService.createDirectCourseContent({
        courseOfferingId: scope.courseOfferingId,
        facultyId: scope.facultyId,
      })
      await loadRows()
      await openDetail(detailSeed.id)
      setActiveSection(sectionKeys.unitContent)
      setEditingSections((p) => ({ ...p, [sectionKeys.unitContent]: true }))
      showToast('success', 'Direct entry is ready')
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to start direct entry')
    } finally {
      setStartingDirect(false)
    }
  }

  const openDetail = async (id) => {
    try {
      const detail = await lmsService.getCourseContentById(id)
      const matchedRow = contentsRows.find((row) => String(row.id) === String(id))
      setSelectedRowKey(matchedRow?.rowKey || id)
      setSelectedId(id)
      setSelectedDetail(detail)
      const contentDetailUnits = detail?.units || []
      setContentUnits(contentDetailUnits)
      const units = detail?.plan?.units?.length
        ? mergePlanUnitsWithContentUnits(detail.plan.units, contentDetailUnits)
        : toPlanSeed(contentDetailUnits)
      setPlanUnits(units)
      setSelectedPlanUnit(units?.length ? String(units[0].unitNumber) : '')
      setSelectedPlanTopicRow(-1)
      setPrerequisiteRows(toStringList(detail?.metadata?.prerequisites))
      setCourseObjectiveRows(toStringList(detail?.metadata?.courseObjectives))
      setTextbookRows(toStringList(detail?.metadata?.textbooks))
      setReferenceBookRows(toStringList(detail?.metadata?.referenceBooks))
      setOnlineReferenceRows(toStringList(detail?.metadata?.onlineReferences))
      setEditingSections({
        [sectionKeys.prerequisites]: false,
        [sectionKeys.courseObjectives]: false,
        [sectionKeys.unitContent]: false,
        [sectionKeys.unitPlan]: false,
        [sectionKeys.textbooks]: false,
        [sectionKeys.referenceBooks]: false,
        [sectionKeys.onlineReferences]: false,
      })
      setSelectedRows({
        [sectionKeys.prerequisites]: -1,
        [sectionKeys.courseObjectives]: -1,
        [sectionKeys.unitContent]: -1,
        [sectionKeys.unitPlan]: -1,
        [sectionKeys.textbooks]: -1,
        [sectionKeys.referenceBooks]: -1,
        [sectionKeys.onlineReferences]: -1,
      })
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to load details')
    }
  }

  useEffect(() => {
    if (!selectedId) return
    ;(async () => {
      await openDetail(selectedId)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  useEffect(() => {
    if (!scope.institutionId || !scope.programmeId || !scope.academicYearId || !scope.regulationId || !scope.semesterCategory || !scope.semester) return
    if (!allotmentRows.length && !scope.facultyId && !normalizedCourseOfferingIdForSearch) {
      setContentsRows([])
      return
    }
    ;(async () => {
      await loadRows()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allotmentRows, scope.facultyId, normalizedCourseOfferingIdForSearch, scope.semester])

  useEffect(() => {
    if (!planUnits.length) {
      setSelectedPlanUnit('')
      return
    }
    const exists = planUnits.some((u) => String(u?.unitNumber) === String(selectedPlanUnit))
    if (!exists) {
      setSelectedPlanUnit(String(planUnits[0].unitNumber))
      setSelectedPlanTopicRow(-1)
    }
  }, [planUnits, selectedPlanUnit])

  const savePlan = async () => {
    if (!selectedDetail?.id || !scope.facultyId) return
    try {
      await lmsService.saveCoursePlan(selectedDetail.id, { facultyId: scope.facultyId, units: planUnits })
      showToast('success', 'Course plan saved')
      await openDetail(selectedDetail.id)
      await loadRows()
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to save course plan')
    }
  }

  const buildContentPayload = () => ({
    syllabusVersion: selectedDetail?.metadata?.syllabusVersion || '',
    prerequisites: prerequisiteRows.join('\n'),
    credits: selectedDetail?.metadata?.credits,
    lectureHours: selectedDetail?.metadata?.lectureHours,
    tutorialHours: selectedDetail?.metadata?.tutorialHours,
    practicalHours: selectedDetail?.metadata?.practicalHours,
    courseObjectives: courseObjectiveRows.filter((x) => String(x || '').trim().length > 0),
    textbooks: textbookRows.filter((x) => String(x || '').trim().length > 0),
    referenceBooks: referenceBookRows.filter((x) => String(x || '').trim().length > 0),
    onlineReferences: onlineReferenceRows.filter((x) => String(x || '').trim().length > 0),
    units: contentUnits,
  })

  const saveContent = async () => {
    if (!selectedDetail?.id) return
    try {
      await lmsService.updateCourseContent(selectedDetail.id, buildContentPayload())
      showToast('success', 'Course content updated')
      await openDetail(selectedDetail.id)
      await loadRows()
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to update course content')
    }
  }

  const submitPlan = async () => {
    if (!selectedDetail?.id || !scope.facultyId) return
    try {
      await lmsService.submitCoursePlan(selectedDetail.id, scope.facultyId)
      showToast('success', 'Course plan submitted')
      await openDetail(selectedDetail.id)
      await loadRows()
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Submit failed')
    }
  }

  const forwardPlan = async () => {
    if (!selectedDetail?.id || !scope.facultyId) return
    try {
      await lmsService.forwardCoursePlan(selectedDetail.id, scope.facultyId, forwardTarget)
      showToast('success', `Course plan forwarded to ${forwardTarget}`)
      await openDetail(selectedDetail.id)
      await loadRows()
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Forward failed')
    }
  }

  const onDelete = async () => {
    if (!selectedId) return
    try {
      await lmsService.deleteCourseContent(selectedId)
      showToast('success', 'Course content deleted')
      await loadRows()
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Delete failed')
    }
  }

  const onExport = async (format, type = 'both') => {
    if (!selectedId) return
    try {
      const res = await lmsService.exportCourseContent(selectedId, format, type)
      const fallback = `Course_Content.${format}`
      downloadBlob(res.data, fileNameFromHeader(res?.headers?.['content-disposition'], fallback), res?.headers?.['content-type'])
    } catch {
      showToast('danger', `Failed to export ${format.toUpperCase()}`)
    }
  }

  const setSectionEditing = (key, value) => {
    setEditingSections((p) => ({ ...p, [key]: value }))
  }

  const addListRow = (key) => {
    if (key === sectionKeys.prerequisites) {
      setPrerequisiteRows((p) => [...p, ''])
      setSelectedRows((p) => ({ ...p, [key]: prerequisiteRows.length }))
    } else if (key === sectionKeys.courseObjectives) {
      setCourseObjectiveRows((p) => [...p, ''])
      setSelectedRows((p) => ({ ...p, [key]: courseObjectiveRows.length }))
    } else if (key === sectionKeys.textbooks) {
      setTextbookRows((p) => [...p, ''])
      setSelectedRows((p) => ({ ...p, [key]: textbookRows.length }))
    } else if (key === sectionKeys.referenceBooks) {
      setReferenceBookRows((p) => [...p, ''])
      setSelectedRows((p) => ({ ...p, [key]: referenceBookRows.length }))
    } else if (key === sectionKeys.onlineReferences) {
      setOnlineReferenceRows((p) => [...p, ''])
      setSelectedRows((p) => ({ ...p, [key]: onlineReferenceRows.length }))
    }
  }

  const deleteListRow = (key) => {
    const selected = selectedRows[key]
    if (selected < 0) return
    if (key === sectionKeys.prerequisites) {
      setPrerequisiteRows((p) => p.filter((_, i) => i !== selected))
    } else if (key === sectionKeys.courseObjectives) {
      setCourseObjectiveRows((p) => p.filter((_, i) => i !== selected))
    } else if (key === sectionKeys.textbooks) {
      setTextbookRows((p) => p.filter((_, i) => i !== selected))
    } else if (key === sectionKeys.referenceBooks) {
      setReferenceBookRows((p) => p.filter((_, i) => i !== selected))
    } else if (key === sectionKeys.onlineReferences) {
      setOnlineReferenceRows((p) => p.filter((_, i) => i !== selected))
    }
    setSelectedRows((p) => ({ ...p, [key]: -1 }))
  }

  const onSectionAdd = () => {
    const key = activeSection
    setSectionEditing(key, true)
    if (key === sectionKeys.unitContent) {
      const next = (contentUnits.reduce((m, u) => Math.max(m, Number(u?.unitNumber || 0)), 0) || 0) + 1
      setContentUnits((p) => [...p, { unitNumber: next, totalHours: 0, chapterHeading: '' }])
      setSelectedRows((p) => ({ ...p, [key]: contentUnits.length }))
      return
    }
    if (key === sectionKeys.unitPlan) {
      const next = (planUnits.reduce((m, u) => Math.max(m, Number(u?.unitNumber || 0)), 0) || 0) + 1
      setPlanUnits((p) => [
        ...p,
        { unitNumber: next, totalHours: 0, chapterHeading: '', topics: [{ topicIndex: 1, topic: '', hours: 0 }] },
      ])
      setSelectedPlanUnit(String(next))
      setSelectedPlanTopicRow(-1)
      return
    }
    addListRow(key)
  }

  const onSectionEdit = () => {
    setSectionEditing(activeSection, true)
  }

  const onSectionDelete = () => {
    const key = activeSection
    if (key === sectionKeys.unitContent) {
      const selected = selectedRows[key]
      if (selected < 0) return
      setContentUnits((p) =>
        p
          .filter((_, i) => i !== selected)
          .map((x, i) => ({ ...x, unitNumber: i + 1 })),
      )
      setSelectedRows((p) => ({ ...p, [key]: -1 }))
      return
    }
    if (key === sectionKeys.unitPlan) {
      if (!selectedPlanUnit) return
      setPlanUnits((p) =>
        p
          .filter((u) => String(u?.unitNumber) !== String(selectedPlanUnit))
          .map((x, i) => ({ ...x, unitNumber: i + 1 })),
      )
      setSelectedPlanTopicRow(-1)
      return
    }
    deleteListRow(key)
  }

  const saveActiveSection = async () => {
    if (activeSection === sectionKeys.unitPlan) {
      await savePlan()
    } else {
      await saveContent()
    }
  }

  const saveDraft = async () => {
    if (!selectedDetail?.id || !scope.facultyId) return
    try {
      await lmsService.updateCourseContent(selectedDetail.id, buildContentPayload())
      await lmsService.saveCoursePlan(selectedDetail.id, { facultyId: scope.facultyId, units: planUnits })
      showToast('success', 'Course content and plan saved as draft')
      await openDetail(selectedDetail.id)
      await loadRows()
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to save draft')
    }
  }

  const selectedPlanUnitIndex = planUnits.findIndex((u) => String(u?.unitNumber) === String(selectedPlanUnit))
  const selectedPlanUnitEntry = selectedPlanUnitIndex >= 0 ? planUnits[selectedPlanUnitIndex] : null

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>COURSE CONTENTS AND COURSE PLAN</strong>
            <div className="d-flex gap-2">
              <ArpButton
                label="Download Template"
                icon="download"
                color="secondary"
                onClick={onDownloadTemplate}
              />
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              {/* Row 1 */}
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

              {/* Row 2 */}
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

              {/* Row 3 */}
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

              {/* Row 4 */}
              <CCol md={3}><CFormLabel>Semester Category</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect
                  value={scope.semesterCategory}
                  onChange={onScope('semesterCategory')}
                  disabled={!scope.academicYearId || semesterCategoryOptions.length === 1}
                >
                  <option value="">Select Semester Category</option>
                  {semesterCategoryOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.semester} onChange={onScope('semester')} disabled={!scope.semesterCategory}>
                  <option value="">Select Semester</option>
                  {semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                </CFormSelect>
              </CCol>

              {/* Row 5 */}
              <CCol md={3}><CFormLabel>Choose Faculty</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.facultyId} onChange={onScope('facultyId')}>
                  <option value="">Select Faculty</option>
                  {faculties.map((x) => <option key={x.id} value={x.id}>{x.facultyCode} - {x.facultyName}</option>)}
                </CFormSelect>
              </CCol>

              {/* Row 6 */}
              <CCol md={3}><CFormLabel>Course Offering</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={scope.courseOfferingId} onChange={onScope('courseOfferingId')}>
                  <option value="">Select Course Offering</option>
                  <option value="ALL">All Courses</option>
                  {courseOfferings.map((x) => <option key={x.id} value={x.id}>{x.course?.courseCode} - {x.course?.courseTitle}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={entryMode} onChange={(e) => setEntryMode(e.target.value)}>
                  <option value={entryModes.upload}>Upload via Template</option>
                  <option value={entryModes.direct}>Enter Directly</option>
                </CFormSelect>
              </CCol>
              <CCol md={9}>
                <div className="d-flex gap-2 align-items-center flex-wrap">
                  <ArpButton
                    label={loading ? 'Searching...' : 'Search'}
                    icon="search"
                    color="primary"
                    onClick={loadRows}
                    disabled={loading}
                    style={{ whiteSpace: 'nowrap', minWidth: 110 }}
                  />
                  {entryMode === entryModes.upload ? (
                    <>
                      <div style={{ flex: '1 1 320px', minWidth: 280 }}>
                        <CFormInput type="file" accept=".xlsx,.xlsm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                      </div>
                      <ArpButton
                        label={uploading ? 'Uploading...' : 'Upload'}
                        icon="upload"
                        color="success"
                        onClick={onUpload}
                        disabled={uploading}
                        style={{ whiteSpace: 'nowrap', minWidth: 110 }}
                      />
                    </>
                  ) : (
                    <ArpButton
                      label={startingDirect ? 'Opening...' : 'Enter Directly'}
                      icon="add"
                      color="success"
                      onClick={onStartDirectEntry}
                      disabled={startingDirect}
                      style={{ whiteSpace: 'nowrap', minWidth: 130 }}
                    />
                  )}
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <ArpDataTable
          className="mb-3"
          title="Course Contents"
          rows={contentsRows}
          rowKey="rowKey"
          columns={[
            { key: 'course', label: 'Course', sortable: true, render: (r) => `${r.courseCode || '-'} - ${r.courseName || '-'}` },
            { key: 'faculty', label: 'Faculty', sortable: true, render: (r) => `${r.facultyCode || '-'} - ${r.facultyName || '-'}` },
            { key: 'entryMode', label: 'Entry Mode', sortable: true, render: (r) => (r.entryMode ? entryModeLabel(r.entryMode) : '-') },
            { key: 'status', label: 'Status', sortable: true, render: (r) => contentStatusLabel(r) },
            { key: 'unitCount', label: 'Units', sortable: true, sortType: 'number' },
            { key: 'totalLectureHours', label: 'Total Hours', sortable: true, sortType: 'number' },
          ]}
          selection={{
            type: 'radio',
            selected: selectedRowKey,
            key: 'rowKey',
            name: 'cc',
            onChange: (value) => {
              const selectedRow = contentsRows.find((row) => String(row.rowKey) === String(value))
              setSelectedRowKey(value)
              setSelectedId(selectedRow?.id || '')
            },
            headerLabel: 'Select',
          }}
          headerActions={
            <>
              <ArpIconButton icon="view" color="info" disabled={!selectedId} onClick={() => openDetail(selectedId)} />
              <ArpIconButton icon="delete" color="danger" disabled={!selectedId} onClick={onDelete} />
              <ArpIconButton icon="download" color="secondary" disabled={!selectedId} onClick={() => onExport('xlsx', 'both')} />
              <ArpButton label="DOC" color="secondary" disabled={!selectedId} onClick={() => onExport('doc', 'both')} />
              <ArpButton label="PDF" color="secondary" disabled={!selectedId} onClick={() => onExport('pdf', 'both')} />
              <ArpButton label="Print" color="secondary" disabled={!selectedId} onClick={() => window.print()} />
            </>
          }
        />

        {selectedDetail ? (
          <CCard className="mb-3">
            <CCardHeader><strong>Course Plan (Strict Validation Enabled)</strong></CCardHeader>
            <CCardBody>
              <div className="mb-3">
                <strong>Course Meta Data</strong>
                <CRow className="g-3 mt-1">
                  <CCol md={4}>
                    <CFormLabel>Course Code</CFormLabel>
                    <CFormInput value={selectedDetail?.courseCode || ''} disabled />
                  </CCol>
                  <CCol md={8}>
                    <CFormLabel>Course Name</CFormLabel>
                    <CFormInput value={selectedDetail?.courseName || ''} disabled />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>Credits</CFormLabel>
                    <CFormInput
                      type="number"
                      value={selectedDetail?.metadata?.credits ?? ''}
                      onChange={(e) =>
                        setSelectedDetail((p) => ({
                          ...p,
                          metadata: { ...(p?.metadata || {}), credits: Number(e.target.value || 0) },
                        }))
                      }
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>Lecture Hours</CFormLabel>
                    <CFormInput
                      type="number"
                      value={selectedDetail?.metadata?.lectureHours ?? ''}
                      onChange={(e) =>
                        setSelectedDetail((p) => ({
                          ...p,
                          metadata: { ...(p?.metadata || {}), lectureHours: Number(e.target.value || 0) },
                        }))
                      }
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>Tutorial Hours</CFormLabel>
                    <CFormInput
                      type="number"
                      value={selectedDetail?.metadata?.tutorialHours ?? ''}
                      onChange={(e) =>
                        setSelectedDetail((p) => ({
                          ...p,
                          metadata: { ...(p?.metadata || {}), tutorialHours: Number(e.target.value || 0) },
                        }))
                      }
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>Practical Hours</CFormLabel>
                    <CFormInput
                      type="number"
                      value={selectedDetail?.metadata?.practicalHours ?? ''}
                      onChange={(e) =>
                        setSelectedDetail((p) => ({
                          ...p,
                          metadata: { ...(p?.metadata || {}), practicalHours: Number(e.target.value || 0) },
                        }))
                      }
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>Total Number of Hours</CFormLabel>
                    <CFormInput
                      type="number"
                      value={
                        selectedDetail?.metadata?.totalLectureHours ??
                        contentUnits.reduce((acc, u) => acc + Number(u?.totalHours || 0), 0)
                      }
                      disabled
                    />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>Syllabus Version</CFormLabel>
                    <CFormInput
                      value={selectedDetail?.metadata?.syllabusVersion || ''}
                      onChange={(e) =>
                        setSelectedDetail((p) => ({
                          ...p,
                          metadata: { ...(p?.metadata || {}), syllabusVersion: e.target.value },
                        }))
                      }
                    />
                  </CCol>
                </CRow>
              </div>

              <div className="mb-3">
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {sectionOptions.map((x) => (
                    <ArpButton
                      key={x.key}
                      label={x.label}
                      color={activeSection === x.key ? 'primary' : 'secondary'}
                      onClick={() => setActiveSection(x.key)}
                    />
                  ))}
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <strong>{sectionOptions.find((x) => x.key === activeSection)?.label}</strong>
                  {activeSection !== sectionKeys.unitPlan ? (
                    <div className="d-flex gap-2">
                      <ArpIconButton icon="add" color="success" title="Add" onClick={onSectionAdd} />
                      <ArpIconButton icon="edit" color="warning" title="Edit" onClick={onSectionEdit} />
                      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onSectionDelete} />
                    </div>
                  ) : null}
                </div>
              </div>

              {activeSection === sectionKeys.prerequisites ? (
                <CTable bordered small responsive className="mb-3">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                      <CTableHeaderCell>Pre-requisite</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {prerequisiteRows.map((row, i) => (
                      <CTableRow key={`pr-${i}`}>
                        <CTableDataCell>
                          <input
                            type="radio"
                            name="prereq-row"
                            checked={selectedRows[sectionKeys.prerequisites] === i}
                            onChange={() => setSelectedRows((p) => ({ ...p, [sectionKeys.prerequisites]: i }))}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormInput
                            value={row}
                            disabled={!editingSections[sectionKeys.prerequisites]}
                            onChange={(e) => setPrerequisiteRows((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : null}

              {activeSection === sectionKeys.courseObjectives ? (
                <CTable bordered small responsive className="mb-3">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                      <CTableHeaderCell>Course Objective</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {courseObjectiveRows.map((row, i) => (
                      <CTableRow key={`co-${i}`}>
                        <CTableDataCell>
                          <input
                            type="radio"
                            name="course-objective-row"
                            checked={selectedRows[sectionKeys.courseObjectives] === i}
                            onChange={() => setSelectedRows((p) => ({ ...p, [sectionKeys.courseObjectives]: i }))}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormInput
                            value={row}
                            disabled={!editingSections[sectionKeys.courseObjectives]}
                            onChange={(e) => setCourseObjectiveRows((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : null}

              {activeSection === sectionKeys.unitContent ? (
                <CTable bordered small responsive className="mb-3">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                      <CTableHeaderCell>Unit</CTableHeaderCell>
                      <CTableHeaderCell>Total Hours</CTableHeaderCell>
                      <CTableHeaderCell>Chapter Heading</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {contentUnits.map((u, i) => (
                      <CTableRow key={`cu-${u.unitNumber}`}>
                        <CTableDataCell>
                          <input
                            type="radio"
                            name="unit-content-row"
                            checked={selectedRows[sectionKeys.unitContent] === i}
                            onChange={() => setSelectedRows((p) => ({ ...p, [sectionKeys.unitContent]: i }))}
                          />
                        </CTableDataCell>
                        <CTableDataCell><CFormInput value={u.unitNumber} disabled /></CTableDataCell>
                        <CTableDataCell>
                          <CFormInput
                            type="number"
                            value={u.totalHours}
                            disabled={!editingSections[sectionKeys.unitContent]}
                            onChange={(e) => setContentUnits((p) => p.map((x, idx) => (idx === i ? { ...x, totalHours: Number(e.target.value || 0) } : x)))}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormInput
                            value={u.chapterHeading || ''}
                            disabled={!editingSections[sectionKeys.unitContent]}
                            onChange={(e) => setContentUnits((p) => p.map((x, idx) => (idx === i ? { ...x, chapterHeading: e.target.value } : x)))}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : null}

              {activeSection === sectionKeys.unitPlan ? (
                <div className="mb-3">
                  {selectedDetail?.plan?.validation?.valid === false ? (
                    <CAlert color="warning">
                      {selectedDetail.plan.validation.errors.join(' | ')}
                    </CAlert>
                  ) : null}
                  <CRow className="g-3">
                    <CCol md={4}>
                      <CFormLabel>Unit Number</CFormLabel>
                      <CFormSelect
                        value={selectedPlanUnit}
                        onChange={(e) => {
                          setSelectedPlanUnit(e.target.value)
                          setSelectedPlanTopicRow(-1)
                        }}
                      >
                        <option value="">Select Unit</option>
                        {planUnits.map((u) => (
                          <option key={`unit-opt-${u.unitNumber}`} value={String(u.unitNumber)}>
                            {u.unitNumber}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                    <CCol md={8} />

                    {selectedPlanUnitEntry ? (
                      <>
                        <CCol md={2}><CFormLabel>Unit</CFormLabel><CFormInput value={selectedPlanUnitEntry.unitNumber} disabled /></CCol>
                        <CCol md={2}>
                          <CFormLabel>Hours</CFormLabel>
                          <CFormInput
                            type="number"
                            value={selectedPlanUnitEntry.totalHours}
                            disabled={!editingSections[sectionKeys.unitPlan]}
                            onChange={(e) =>
                              setPlanUnits((p) =>
                                p.map((x, idx) =>
                                  idx === selectedPlanUnitIndex ? { ...x, totalHours: Number(e.target.value || 0) } : x,
                                ),
                              )
                            }
                          />
                        </CCol>
                        <CCol md={8}>
                          <CFormLabel>Chapter Heading</CFormLabel>
                          <CFormInput
                            value={selectedPlanUnitEntry.chapterHeading || ''}
                            disabled={!editingSections[sectionKeys.unitPlan]}
                            onChange={(e) =>
                              setPlanUnits((p) =>
                                p.map((x, idx) =>
                                  idx === selectedPlanUnitIndex ? { ...x, chapterHeading: e.target.value } : x,
                                ),
                              )
                            }
                          />
                        </CCol>
                        <CCol md={12}>
                          <div className="d-flex justify-content-between mb-2">
                            <strong>Topics</strong>
                            <div className="d-flex gap-2">
                              <ArpIconButton
                                icon="add"
                                color="success"
                                title="Add Topic"
                                disabled={!editingSections[sectionKeys.unitPlan] || !selectedPlanUnitEntry}
                                onClick={() =>
                                  setPlanUnits((p) =>
                                    p.map((x, idx) =>
                                      idx === selectedPlanUnitIndex
                                        ? {
                                            ...x,
                                            topics: [
                                              ...(x.topics || []),
                                              { topicIndex: (x.topics || []).length + 1, topic: '', hours: 0 },
                                            ],
                                          }
                                        : x,
                                    ),
                                  )
                                }
                              />
                              <ArpIconButton
                                icon="edit"
                                color="warning"
                                title="Edit Topics"
                                onClick={onSectionEdit}
                              />
                              <ArpIconButton
                                icon="delete"
                                color="danger"
                                title="Delete Topic"
                                disabled={!editingSections[sectionKeys.unitPlan] || selectedPlanTopicRow < 0}
                                onClick={() =>
                                  setPlanUnits((p) =>
                                    p.map((x, idx) =>
                                      idx === selectedPlanUnitIndex
                                        ? {
                                            ...x,
                                            topics: (x.topics || [])
                                              .filter((_, rowIdx) => rowIdx !== selectedPlanTopicRow)
                                              .map((topic, rowIdx) => ({ ...topic, topicIndex: rowIdx + 1 })),
                                          }
                                        : x,
                                    ),
                                  )
                                }
                              />
                            </div>
                          </div>
                          <CTable bordered small responsive>
                            <CTableHead>
                              <CTableRow>
                                <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                                <CTableHeaderCell style={{ width: 140 }}>Topic Index</CTableHeaderCell>
                                <CTableHeaderCell>Topic</CTableHeaderCell>
                                <CTableHeaderCell style={{ width: 120 }}>Hours</CTableHeaderCell>
                              </CTableRow>
                            </CTableHead>
                            <CTableBody>
                              {(selectedPlanUnitEntry.topics || []).map((t, ti) => (
                                <CTableRow key={`t-${selectedPlanUnitEntry.unitNumber}-${ti}`}>
                                  <CTableDataCell>
                                    <input
                                      type="radio"
                                      name="selected-topic-row"
                                      checked={selectedPlanTopicRow === ti}
                                      onChange={() => setSelectedPlanTopicRow(ti)}
                                    />
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CFormInput
                                      type="number"
                                      value={t.topicIndex}
                                      disabled={!editingSections[sectionKeys.unitPlan]}
                                      onChange={(e) =>
                                        setPlanUnits((p) =>
                                          p.map((x, xIdx) =>
                                            xIdx === selectedPlanUnitIndex
                                              ? {
                                                  ...x,
                                                  topics: x.topics.map((tt, ttIdx) =>
                                                    ttIdx === ti ? { ...tt, topicIndex: Number(e.target.value || 0) } : tt,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        )
                                      }
                                    />
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CFormInput
                                      value={t.topic}
                                      disabled={!editingSections[sectionKeys.unitPlan]}
                                      onChange={(e) =>
                                        setPlanUnits((p) =>
                                          p.map((x, xIdx) =>
                                            xIdx === selectedPlanUnitIndex
                                              ? {
                                                  ...x,
                                                  topics: x.topics.map((tt, ttIdx) =>
                                                    ttIdx === ti ? { ...tt, topic: e.target.value } : tt,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        )
                                      }
                                    />
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CFormInput
                                      type="number"
                                      value={t.hours}
                                      disabled={!editingSections[sectionKeys.unitPlan]}
                                      onChange={(e) =>
                                        setPlanUnits((p) =>
                                          p.map((x, xIdx) =>
                                            xIdx === selectedPlanUnitIndex
                                              ? {
                                                  ...x,
                                                  topics: x.topics.map((tt, ttIdx) =>
                                                    ttIdx === ti ? { ...tt, hours: Number(e.target.value || 0) } : tt,
                                                  ),
                                                }
                                              : x,
                                          ),
                                        )
                                      }
                                    />
                                  </CTableDataCell>
                                </CTableRow>
                              ))}
                            </CTableBody>
                          </CTable>
                        </CCol>
                      </>
                    ) : (
                      <CCol md={12}>
                        <CAlert color="info" className="mb-0">Select a unit number to view and edit course plan details.</CAlert>
                      </CCol>
                    )}
                  </CRow>
                </div>
              ) : null}

              {activeSection === sectionKeys.textbooks ? (
                <CTable bordered small responsive className="mb-3">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                      <CTableHeaderCell>Textbook</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {textbookRows.map((row, i) => (
                      <CTableRow key={`tb-${i}`}>
                        <CTableDataCell>
                          <input
                            type="radio"
                            name="textbook-row"
                            checked={selectedRows[sectionKeys.textbooks] === i}
                            onChange={() => setSelectedRows((p) => ({ ...p, [sectionKeys.textbooks]: i }))}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormInput
                            value={row}
                            disabled={!editingSections[sectionKeys.textbooks]}
                            onChange={(e) => setTextbookRows((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : null}

              {activeSection === sectionKeys.referenceBooks ? (
                <CTable bordered small responsive className="mb-3">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                      <CTableHeaderCell>Reference Book</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {referenceBookRows.map((row, i) => (
                      <CTableRow key={`rb-${i}`}>
                        <CTableDataCell>
                          <input
                            type="radio"
                            name="reference-book-row"
                            checked={selectedRows[sectionKeys.referenceBooks] === i}
                            onChange={() => setSelectedRows((p) => ({ ...p, [sectionKeys.referenceBooks]: i }))}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormInput
                            value={row}
                            disabled={!editingSections[sectionKeys.referenceBooks]}
                            onChange={(e) => setReferenceBookRows((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : null}

              {activeSection === sectionKeys.onlineReferences ? (
                <CTable bordered small responsive className="mb-3">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                      <CTableHeaderCell>Online Reference</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {onlineReferenceRows.map((row, i) => (
                      <CTableRow key={`or-${i}`}>
                        <CTableDataCell>
                          <input
                            type="radio"
                            name="online-reference-row"
                            checked={selectedRows[sectionKeys.onlineReferences] === i}
                            onChange={() => setSelectedRows((p) => ({ ...p, [sectionKeys.onlineReferences]: i }))}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormInput
                            value={row}
                            disabled={!editingSections[sectionKeys.onlineReferences]}
                            onChange={(e) => setOnlineReferenceRows((p) => p.map((x, idx) => (idx === i ? e.target.value : x)))}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : null}

              <CRow className="g-3">
                <CCol md={12} className="d-flex gap-2 justify-content-end">
                  <ArpButton label="Save Section" color="secondary" onClick={saveActiveSection} />
                  <ArpButton label="Save Draft" color="success" onClick={saveDraft} />
                  <ArpButton label="Save Plan" color="success" onClick={savePlan} />
                  <ArpButton label="Submit Plan" color="primary" onClick={submitPlan} />
                  <CFormSelect style={{ width: 180 }} value={forwardTarget} onChange={(e) => setForwardTarget(e.target.value)}>
                    {forwardTargets.map((x) => <option key={x} value={x}>{x}</option>)}
                  </CFormSelect>
                  <ArpButton label="Forward Plan" color="warning" onClick={forwardPlan} />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        ) : null}

        <ArpDataTable
          className=""
          title="Dashboard Status (Faculty / Authorities)"
          rows={dashboardRows}
          rowKey="contentId"
          columns={[
            { key: 'course', label: 'Course', sortable: true, render: (r) => `${r.courseCode || '-'} - ${r.courseName || '-'}` },
            { key: 'faculty', label: 'Faculty', sortable: true, render: (r) => `${r.facultyCode || '-'} - ${r.facultyName || '-'}` },
            { key: 'entryMode', label: 'Entry Mode', sortable: true, render: (r) => entryModeLabel(r.entryMode) },
            { key: 'contentStatus', label: 'Content Status', sortable: true },
            { key: 'planStatus', label: 'Plan Status', sortable: true },
            { key: 'forwardedTo', label: 'Forwarded To', sortable: true, render: (r) => r.forwardedTo || '-' },
            { key: 'validation', label: 'Validation', sortable: true, render: (r) => (r.strictValidationPassed ? 'Passed' : 'Pending/Failed') },
          ]}
        />
      </CCol>
    </CRow>
  )
}

export default CourseContentsConfiguration
