import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
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
  CPagination,
  CPaginationItem,
} from '@coreui/react-pro'
import { ArpButton, ArpIconButton, TableToolbar } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'

const initialForm = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
  courseOfferingId: '',
  programmeName: '',
  semesterCategory: '',
  status: 'Course Allotment not done',
}

const CourseAllotmentConfiguration = () => {
  const [form, setForm] = useState(initialForm)
  const [showDetails, setShowDetails] = useState(false)
  const [rows, setRows] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [faculties, setFaculties] = useState([])
  const [allotmentMode, setAllotmentMode] = useState('')
  const [savingAllotment, setSavingAllotment] = useState(false)
  const [facultySearch, setFacultySearch] = useState('')
  const [allotmentForm, setAllotmentForm] = useState({
    courseId: '',
    facultyId: '',
    originalFacultyId: '',
    chaptersAllocated: '',
    hoursAllocated: '',
  })

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [regulationMaps, setRegulationMaps] = useState([])
  const [batches, setBatches] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        const rowsData = await lmsService.listInstitutions()
        setInstitutions(rowsData)
      } catch {
        setError('Failed to load institutions')
      }
    })()
  }, [])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(form.academicYearId)) || null,
    [academicYears, form.academicYearId],
  )

  const filteredBatches = useMemo(() => {
    if (!form.regulationId) return batches
    const ids = new Set(
      regulationMaps
        .filter((x) => String(x.regulationId) === String(form.regulationId))
        .map((x) => x.batchId),
    )
    return batches.filter((x) => ids.has(x.id))
  }, [batches, regulationMaps, form.regulationId])

  const semesterOptions = useMemo(
    () => {
      const fromMap = regulationMaps
        .filter((x) => !form.regulationId || String(x.regulationId) === String(form.regulationId))
        .filter((x) => !form.batchId || String(x.batchId) === String(form.batchId))
        .map((x) => Number(x.semester))
        .filter((x) => Number.isFinite(x) && x > 0)

      const unique = Array.from(new Set(fromMap)).sort((a, b) => a - b)
      if (unique.length) return unique.map((x) => ({ value: String(x), label: `Sem - ${x}` }))

      return semesterOptionsFromAcademicYear(selectedAcademicYear)
    },
    [regulationMaps, form.regulationId, form.batchId, selectedAcademicYear],
  )

  const scopeReadyForTemplate = useMemo(
    () =>
      Boolean(
        form.institutionId &&
          form.academicYearId &&
          form.programmeId &&
          form.regulationId &&
          form.semester,
      ),
    [form.institutionId, form.academicYearId, form.programmeId, form.regulationId, form.semester],
  )

  const selectedRow = useMemo(
    () => rows.find((r) => String(r.id) === String(selectedId)) || null,
    [rows, selectedId],
  )

  const filteredFacultyOptions = useMemo(() => {
    const q = String(facultySearch).trim().toLowerCase()
    if (!q) return faculties
    return faculties.filter((f) =>
      `${f.facultyCode || ''} ${f.facultyName || ''}`.toLowerCase().includes(q),
    )
  }, [faculties, facultySearch])

  useEffect(() => {
    setForm((p) => ({ ...p, semesterCategory: selectedAcademicYear?.semesterCategory || '' }))
  }, [selectedAcademicYear])

  useEffect(() => {
    ;(async () => {
      if (!form.institutionId || !form.departmentId || !form.academicYearId) {
        setFaculties([])
        return
      }
      try {
        const list = await lmsService.listFaculties({
          institutionId: form.institutionId,
          departmentId: form.departmentId,
          academicYearId: form.academicYearId,
        })
        setFaculties(list)
      } catch {
        setFaculties([])
      }
    })()
  }, [form.institutionId, form.departmentId, form.academicYearId])

  const loadRegulationMapScope = async (institutionId, academicYearId, programmeId) => {
    if (!institutionId || !academicYearId || !programmeId) {
      setRegulations([])
      setBatches([])
      setRegulationMaps([])
      return
    }
    const mapped = await lmsService.listRegulationMaps({ institutionId, academicYearId, programmeId })
    setRegulationMaps(mapped)

    const regMap = new Map()
    const batchMap = new Map()
    mapped.forEach((x) => {
      if (x.regulationId) regMap.set(String(x.regulationId), { id: x.regulationId, regulationCode: x.regulationCode || '-' })
      if (x.batchId) batchMap.set(String(x.batchId), { id: x.batchId, batchName: x.batch || '-' })
    })

    setRegulations(Array.from(regMap.values()))
    setBatches(Array.from(batchMap.values()))
  }

  const loadCoursesForScope = async (scope) => {
    const required = ['institutionId', 'academicYearId', 'programmeId', 'regulationId', 'semester']
    if (required.some((k) => !scope[k])) {
      setCourses([])
      setForm((p) => ({ ...p, status: 'Course Allotment not done' }))
      return []
    }

    const data = await lmsService.listCourseOfferings({
      institutionId: scope.institutionId,
      academicYearId: scope.academicYearId,
      programmeId: scope.programmeId,
      regulationId: scope.regulationId,
      batchId: scope.batchId,
      semester: scope.semester,
    })

    const mapped = data.map((x, idx) => ({
      id: x.id,
      courseId: x.courseId,
      code: x.course?.courseCode || '-',
      name: x.course?.courseTitle || '-',
      fid: '-',
      fname: '-',
      chapters: x.course?.totalUnits ?? '-',
      hours: x.course?.totalHours ?? '-',
      order: x.courseOrder ?? idx + 1,
    }))

    setCourses(mapped)
    setForm((p) => ({ ...p, status: 'Course Allotment not done' }))
    return mapped
  }

  const onChange = (key) => async (e) => {
    const value = e.target.value
    setError('')
    setSuccess('')

    if (key === 'institutionId') {
      setForm((p) => ({
        ...p,
        institutionId: value,
        departmentId: '',
        programmeId: '',
        regulationId: '',
        academicYearId: '',
        batchId: '',
        semester: '',
        courseOfferingId: '',
        programmeName: '',
        semesterCategory: '',
        status: 'Course Allotment not done',
      }))
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setRegulationMaps([])
      setBatches([])
      setCourses([])
      setRows([])
      setAllotmentMode('')
      if (!value) return
      try {
        const [d, ay] = await Promise.all([lmsService.listDepartments(value), lmsService.listAcademicYears(value)])
        setDepartments(d)
        setAcademicYears(ay)
      } catch {
        setError('Failed to load institution scope')
      }
      return
    }

    if (key === 'departmentId') {
      setForm((p) => ({
        ...p,
        departmentId: value,
        programmeId: '',
        regulationId: '',
        batchId: '',
        semester: '',
        courseOfferingId: '',
        programmeName: '',
      }))
      setProgrammes([])
      setRegulations([])
      setRegulationMaps([])
      setBatches([])
      setCourses([])
      setRows([])
      setAllotmentMode('')
      if (!value || !form.institutionId) return
      try {
        const p = await lmsService.listProgrammes(form.institutionId, value)
        setProgrammes(p)
      } catch {
        setError('Failed to load programmes')
      }
      return
    }

    if (key === 'programmeId') {
      const chosen = programmes.find((x) => String(x.id) === String(value))
      setForm((p) => ({
        ...p,
        programmeId: value,
        regulationId: '',
        batchId: '',
        semester: '',
        courseOfferingId: '',
        programmeName: chosen?.programmeName || '',
      }))
      setRegulations([])
      setRegulationMaps([])
      setBatches([])
      setCourses([])
      setRows([])
      setAllotmentMode('')
      if (!value || !form.institutionId || !form.academicYearId) return
      try {
        await loadRegulationMapScope(form.institutionId, form.academicYearId, value)
      } catch {
        setError('Failed to load regulation map scope')
      }
      return
    }

    if (key === 'academicYearId') {
      setForm((p) => ({
        ...p,
        academicYearId: value,
        regulationId: '',
        batchId: '',
        semester: '',
        courseOfferingId: '',
      }))
      setRegulations([])
      setRegulationMaps([])
      setBatches([])
      setCourses([])
      setRows([])
      setAllotmentMode('')
      if (!value || !form.institutionId || !form.programmeId) return
      try {
        await loadRegulationMapScope(form.institutionId, value, form.programmeId)
      } catch {
        setError('Failed to load regulation map scope')
      }
      return
    }

    if (key === 'regulationId') {
      setForm((p) => ({ ...p, regulationId: value, batchId: '', semester: '', courseOfferingId: '' }))
      setCourses([])
      setRows([])
      setAllotmentMode('')
      return
    }

    if (key === 'batchId' || key === 'semester') {
      setForm((p) => ({ ...p, [key]: value, courseOfferingId: '' }))
      setRows([])
      setAllotmentMode('')
      return
    }

    setForm((p) => ({ ...p, [key]: value }))
  }

  useEffect(() => {
    ;(async () => {
      try {
        await loadCoursesForScope(form)
      } catch {
        setCourses([])
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.institutionId, form.academicYearId, form.programmeId, form.regulationId, form.batchId, form.semester])

  const onSearch = async () => {
    if (!form.institutionId || !form.academicYearId || !form.programmeId || !form.regulationId || !form.semester) {
      setError('Select Institution, Department, Programme, Regulation, Academic Year and Semester')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      const mapped = await loadCoursesForScope(form)
      const details = await lmsService.listCourseAllotmentDetails(buildImportScope())
      const detailRows = details.map((x, idx) => ({
        id: x.id || `${x.courseId || idx + 1}::${x.facultyId || ''}`,
        courseId: x.courseId || '',
        courseOfferingId: x.courseOfferingId || '',
        code: x.courseCode || '-',
        name: x.courseName || '-',
        fid: x.facultyCode || '-',
        fname: x.facultyName || '-',
        facultyId: x.facultyId || '',
        chapters: x.chaptersAllocated ?? '-',
        hours: x.hoursAllocated ?? '-',
      }))
      let list = detailRows
      if (form.courseOfferingId) {
        const chosenCourse = mapped.find((x) => String(x.id) === String(form.courseOfferingId))
        if (chosenCourse?.courseId) {
          list = detailRows.filter((x) => String(x.courseId) === String(chosenCourse.courseId))
        } else {
          list = detailRows.filter((x) => String(x.courseOfferingId) === String(form.courseOfferingId))
        }
      }
      setRows(list)
      const hasAllotment = list.some((x) => x.facultyId)
      setForm((p) => ({ ...p, status: hasAllotment ? 'Course Allotment done' : 'Course Allotment not done' }))
      setShowDetails(true)
      setSelectedId(null)
      setAllotmentMode('')
      if (!mapped.length) setForm((p) => ({ ...p, status: 'Course Allotment not done' }))
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load course allotment')
    } finally {
      setLoading(false)
    }
  }

  const onReset = () => {
    setForm(initialForm)
    setShowDetails(false)
    setRows([])
    setCourses([])
    setSelectedId(null)
    setSearch('')
    setPage(1)
    setSuccess('')
    setDepartments([])
    setProgrammes([])
    setRegulations([])
    setRegulationMaps([])
    setAcademicYears([])
    setBatches([])
    setError('')
    setAllotmentMode('')
    setAllotmentForm({
      courseId: '',
      facultyId: '',
      originalFacultyId: '',
      chaptersAllocated: '',
      hoursAllocated: '',
    })
  }

  const onAddNew = () => {
    setForm(initialForm)
    setRows([])
    setCourses([])
    setShowDetails(false)
    setSelectedId(null)
    setSearch('')
    setPage(1)
    setError('')
    setSuccess('')
    setAllotmentMode('')
    setAllotmentForm({
      courseId: '',
      facultyId: '',
      originalFacultyId: '',
      chaptersAllocated: '',
      hoursAllocated: '',
    })
  }

  const downloadBufferAsFile = (buffer, filename, contentType) => {
    const blob = new Blob([buffer], {
      type: contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const filenameFromContentDisposition = (headerValue, fallback) => {
    const txt = String(headerValue || '')
    const m = txt.match(/filename="?([^"]+)"?/i)
    return (m && m[1]) || fallback
  }

  const parseApiErrorMessage = async (e, fallback) => {
    const data = e?.response?.data
    if (!data) return fallback
    try {
      if (typeof Blob !== 'undefined' && data instanceof Blob) {
        const txt = await data.text()
        const j = txt ? JSON.parse(txt) : null
        return j?.error || j?.message || txt || fallback
      }
      if (data instanceof ArrayBuffer) {
        const txt = new TextDecoder('utf-8').decode(data)
        const j = txt ? JSON.parse(txt) : null
        return j?.error || j?.message || txt || fallback
      }
      if (typeof data === 'string') {
        try {
          const j = JSON.parse(data)
          return j?.error || j?.message || fallback
        } catch {
          return data || fallback
        }
      }
      if (typeof data === 'object') return data?.error || data?.message || fallback
      return fallback
    } catch {
      return fallback
    }
  }

  const buildImportScope = () => ({
    institutionId: form.institutionId,
    academicYearId: form.academicYearId,
    programmeId: form.programmeId,
    regulationId: form.regulationId,
    batchId: form.batchId,
    semester: form.semester,
  })

  const onAddAllocation = () => {
    if (!scopeReadyForTemplate) {
      setError('Select scope before adding course allotment')
      return
    }
    setError('')
    setSuccess('')
    setAllotmentMode('ADD')
    setFacultySearch('')
    setAllotmentForm({
      courseId: '',
      facultyId: '',
      originalFacultyId: '',
      chaptersAllocated: '',
      hoursAllocated: '',
    })
  }

  const onViewAllocation = () => {
    if (!selectedRow) return
    setAllotmentMode('VIEW')
    setFacultySearch('')
    setAllotmentForm({
      courseId: selectedRow.courseId || '',
      facultyId: selectedRow.facultyId || '',
      originalFacultyId: selectedRow.facultyId || '',
      chaptersAllocated: selectedRow.chapters === '-' ? '' : String(selectedRow.chapters || ''),
      hoursAllocated: selectedRow.hours === '-' ? '' : String(selectedRow.hours || ''),
    })
  }

  const onEditAllocation = () => {
    if (!selectedRow) return
    setAllotmentMode('EDIT')
    setFacultySearch('')
    setAllotmentForm({
      courseId: selectedRow.courseId || '',
      facultyId: selectedRow.facultyId || '',
      originalFacultyId: selectedRow.facultyId || '',
      chaptersAllocated: selectedRow.chapters === '-' ? '' : String(selectedRow.chapters || ''),
      hoursAllocated: selectedRow.hours === '-' ? '' : String(selectedRow.hours || ''),
    })
  }

  const onDeleteAllocation = async () => {
    if (!selectedRow?.courseId || !selectedRow?.facultyId) return
    if (!window.confirm('Delete selected course allotment?')) return
    try {
      setError('')
      setSuccess('')
      await lmsService.deleteCourseAllotment(buildImportScope(), selectedRow.courseId, selectedRow.facultyId)
      setSuccess('Course allotment deleted successfully')
      await onSearch()
    } catch (e) {
      const msg = await parseApiErrorMessage(e, 'Failed to delete course allotment')
      setError(msg)
    }
  }

  const onSaveAllocation = async () => {
    if (!allotmentForm.courseId) {
      setError('Select course')
      return
    }
    if (!allotmentForm.facultyId) {
      setError('Select faculty')
      return
    }
    const chapters = String(allotmentForm.chaptersAllocated || '').trim()
    const hours = String(allotmentForm.hoursAllocated || '').trim()
    if (chapters && Number.isNaN(Number(chapters))) {
      setError('No of Chapters Allocated must be numeric')
      return
    }
    if (hours && Number.isNaN(Number(hours))) {
      setError('No of Hours Allocated must be numeric')
      return
    }
    try {
      setSavingAllotment(true)
      setError('')
      setSuccess('')
      const scope = buildImportScope()
      if (allotmentMode === 'EDIT') {
        await lmsService.updateCourseAllotment(scope, allotmentForm.courseId, {
          courseId: allotmentForm.courseId,
          facultyId: allotmentForm.facultyId,
          originalFacultyId: allotmentForm.originalFacultyId || allotmentForm.facultyId,
          chaptersAllocated: chapters,
          hoursAllocated: hours,
        })
      } else {
        await lmsService.saveCourseAllotment(scope, {
          courseId: allotmentForm.courseId,
          facultyId: allotmentForm.facultyId,
          chaptersAllocated: chapters,
          hoursAllocated: hours,
        })
      }
      setSuccess('Course allotment record saved successfully')
      setForm((p) => ({ ...p, status: 'Course Allotment done' }))
      setAllotmentMode('')
      setFacultySearch('')
      setAllotmentForm({
        courseId: '',
        facultyId: '',
        originalFacultyId: '',
        chaptersAllocated: '',
        hoursAllocated: '',
      })
      await onSearch()
    } catch (e) {
      const msg = await parseApiErrorMessage(e, 'Failed to save course allotment')
      setError(msg)
    } finally {
      setSavingAllotment(false)
    }
  }

  const onExportAllotments = async () => {
    if (!scopeReadyForTemplate) {
      setError('Select scope to download course allotment details')
      return
    }
    try {
      setError('')
      setSuccess('')
      const scope = buildImportScope()
      const res = await lmsService.exportCourseAllotmentDetails(scope)
      const filename = filenameFromContentDisposition(
        res?.headers?.['content-disposition'],
        `Course_Allotment_Details_Sem_${scope.semester}.xlsx`,
      )
      downloadBufferAsFile(res.data, filename, res?.headers?.['content-type'])
    } catch (e) {
      const msg = await parseApiErrorMessage(e, 'Failed to export course allotment details')
      setError(msg)
    }
  }

  const filtered = useMemo(() => {
    const q = String(search).toLowerCase().trim()
    if (!q) return rows
    return rows.filter((r) => Object.values(r).join(' ').toLowerCase().includes(q))
  }, [rows, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>COURSE ALLOTMENT</strong>
            <div className="d-flex gap-2">
              <ArpButton label="AddNew" icon="add" color="purple" onClick={onAddNew} />
            </div>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Course Allotment</strong>
          </CCardHeader>
          <CCardBody>
            {error ? <CAlert color="danger">{error}</CAlert> : null}
            {success ? <CAlert color="success">{success}</CAlert> : null}
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Institution</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.institutionId} onChange={onChange('institutionId')}>
                    <option value="">Select Institution</option>
                    {institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYearId} onChange={onChange('academicYearId')}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.academicYearLabel || `${x.academicYear}${x.semesterCategory ? ` (${x.semesterCategory})` : ''}`}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Department</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.departmentId} onChange={onChange('departmentId')}>
                    <option value="">Select Department</option>
                    {departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeId} onChange={onChange('programmeId')}>
                    <option value="">Select Programme Code</option>
                    {programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Regulation</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.regulationId} onChange={onChange('regulationId')}>
                    <option value="">Select Regulation</option>
                    {regulations.map((x) => <option key={x.id} value={x.id}>{x.regulationCode}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Batch</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.batchId} onChange={onChange('batchId')}>
                    <option value="">All Batches</option>
                    {filteredBatches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.programmeName || '-'} disabled /></CCol>

                <CCol md={3}><CFormLabel>Semester Category</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.semesterCategory || '-'} disabled /></CCol>

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')}>
                    <option value="">Select Semester</option>
                    {semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Courses</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.courseOfferingId} onChange={onChange('courseOfferingId')}>
                    <option value="">All Courses</option>
                    {courses.map((x) => <option key={x.id} value={x.id}>{x.code} - {x.name}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Status of Course Allotment</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.status} disabled /></CCol>

                <CCol md={3}><CFormLabel>Action</CFormLabel></CCol>
                <CCol md={3} className="d-flex gap-2">
                  <ArpButton label={loading ? 'Loading...' : 'Search'} icon="search" color="primary" onClick={onSearch} disabled={loading} />
                  <ArpButton label="Reset" icon="reset" color="secondary" onClick={onReset} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {showDetails && (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Course Allocation Details</strong>

              <TableToolbar
                search={search}
                onSearchChange={(e) => setSearch(e.target.value)}
                pageSize={pageSize}
                onPageSizeChange={(e) => setPageSize(Number(e.target.value))}
                pageSizeOptions={[5, 10, 20]}
                actions={
                  <>
                    <ArpIconButton icon="add" color="success" onClick={onAddAllocation} />
                    <ArpIconButton icon="edit" color="warning" disabled={!selectedId} onClick={onEditAllocation} />
                    <ArpIconButton icon="view" color="info" disabled={!selectedId} onClick={onViewAllocation} />
                    <ArpIconButton icon="delete" color="danger" disabled={!selectedId} onClick={onDeleteAllocation} />
                    <ArpIconButton icon="download" color="secondary" onClick={onExportAllotments} />
                  </>
                }
              />
            </CCardHeader>

            <CCardBody>
              <CTable bordered hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    <CTableHeaderCell>Faculty ID</CTableHeaderCell>
                    <CTableHeaderCell>Faculty Name</CTableHeaderCell>
                    <CTableHeaderCell>Chapters</CTableHeaderCell>
                    <CTableHeaderCell>Hours</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell>
                        <CFormCheck
                          type="radio"
                          name="courseSel"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.code}</CTableDataCell>
                      <CTableDataCell>{r.name}</CTableDataCell>
                      <CTableDataCell>{r.fid}</CTableDataCell>
                      <CTableDataCell>{r.fname}</CTableDataCell>
                      <CTableDataCell>{r.chapters}</CTableDataCell>
                      <CTableDataCell>{r.hours}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end mt-2">
                <CPagination size="sm">
                  <CPaginationItem disabled={safePage <= 1} onClick={() => setPage(1)}>Prev</CPaginationItem>
                  <CPaginationItem active>{safePage}</CPaginationItem>
                  <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>Next</CPaginationItem>
                </CPagination>
              </div>
            </CCardBody>
          </CCard>
        )}

        {showDetails && allotmentMode ? (
          <CCard className="mt-3">
            <CCardHeader>
              <strong>
                {allotmentMode === 'ADD'
                  ? 'Add Course Allotment'
                  : allotmentMode === 'EDIT'
                    ? 'Edit Course Allotment'
                    : 'View Course Allotment'}
              </strong>
            </CCardHeader>
            <CCardBody>
              <CForm>
                <CRow className="g-3">
                  <CCol md={3}><CFormLabel>Course</CFormLabel></CCol>
                  <CCol md={3}>
                    <CFormSelect
                      value={allotmentForm.courseId}
                      disabled={allotmentMode !== 'ADD'}
                      onChange={(e) => setAllotmentForm((p) => ({ ...p, courseId: e.target.value }))}
                    >
                      <option value="">Select Course</option>
                      {courses.map((x) => <option key={x.courseId || x.id} value={x.courseId || x.id}>{x.code} - {x.name}</option>)}
                    </CFormSelect>
                  </CCol>

                  <CCol md={3}><CFormLabel>Faculty</CFormLabel></CCol>
                  <CCol md={3}>
                    <CFormInput
                      className="mb-2"
                      placeholder="Search faculty code or name"
                      value={facultySearch}
                      disabled={allotmentMode === 'VIEW'}
                      onChange={(e) => setFacultySearch(e.target.value)}
                    />
                    <CFormSelect
                      value={allotmentForm.facultyId}
                      disabled={allotmentMode === 'VIEW'}
                      onChange={(e) => setAllotmentForm((p) => ({ ...p, facultyId: e.target.value }))}
                    >
                      <option value="">Select Faculty</option>
                      {filteredFacultyOptions.map((x) => <option key={x.id} value={x.id}>{x.facultyCode} - {x.facultyName}</option>)}
                    </CFormSelect>
                  </CCol>

                  <CCol md={3}><CFormLabel>No of Chapters Allocated</CFormLabel></CCol>
                  <CCol md={3}>
                    <CFormInput
                      type="number"
                      value={allotmentForm.chaptersAllocated}
                      disabled={allotmentMode === 'VIEW'}
                      onChange={(e) => setAllotmentForm((p) => ({ ...p, chaptersAllocated: e.target.value }))}
                    />
                  </CCol>

                  <CCol md={3}><CFormLabel>No of Hours Allocated</CFormLabel></CCol>
                  <CCol md={3}>
                    <CFormInput
                      type="number"
                      value={allotmentForm.hoursAllocated}
                      disabled={allotmentMode === 'VIEW'}
                      onChange={(e) => setAllotmentForm((p) => ({ ...p, hoursAllocated: e.target.value }))}
                    />
                  </CCol>

                  <CCol md={12} className="d-flex justify-content-end gap-2">
                    {allotmentMode === 'VIEW' ? null : (
                      <ArpButton
                        label={savingAllotment ? 'Saving...' : 'Save'}
                        icon="save"
                        color="success"
                        onClick={onSaveAllocation}
                        disabled={savingAllotment}
                      />
                    )}
                    <ArpButton
                      label="Cancel"
                      icon="cancel"
                      color="secondary"
                      onClick={() => {
                        setAllotmentMode('')
                        setFacultySearch('')
                        setAllotmentForm({
                          courseId: '',
                          facultyId: '',
                          originalFacultyId: '',
                          chaptersAllocated: '',
                          hoursAllocated: '',
                        })
                      }}
                    />
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        ) : null}
      </CCol>
    </CRow>
  )
}

export default CourseAllotmentConfiguration
