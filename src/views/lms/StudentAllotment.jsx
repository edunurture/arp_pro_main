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
import { ArpButton } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'

const initialForm = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
  programmeName: '',
  classId: '',
  className: '',
  classLabel: '',
  courseCode: '',
  courseName: '',
  status: 'Automatically Fetched',
}

const StudentAllotmentConfiguration = () => {
  const [allotmentMode, setAllotmentMode] = useState('COURSE_WISE')
  const [form, setForm] = useState(initialForm)
  const [showDetails, setShowDetails] = useState(false)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [selectAll, setSelectAll] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [classes, setClasses] = useState([])
  const [offerings, setOfferings] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        setInstitutions(await lmsService.listInstitutions())
      } catch {
        setError('Failed to load institutions')
      }
    })()
  }, [])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(form.academicYearId)) || null,
    [academicYears, form.academicYearId],
  )

  const semesterOptions = useMemo(
    () => semesterOptionsFromAcademicYear(selectedAcademicYear),
    [selectedAcademicYear],
  )

  const classLabelOptions = useMemo(() => {
    const values = Array.from(new Set(classes.map((x) => String(x.classLabel || '').trim()).filter(Boolean)))
    return values.sort()
  }, [classes])

  const onChange = (key) => async (e) => {
    const value = e.target.value
    setError('')
    setSuccess('')

    if (key === 'allotmentMode') {
      setAllotmentMode(value)
      if (value === 'ALL_COURSES') {
        setForm((p) => ({ ...p, courseCode: '', courseName: 'All Courses' }))
      } else {
        setForm((p) => ({ ...p, courseName: '' }))
      }
      return
    }

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
        classId: '',
        className: '',
        classLabel: '',
        courseCode: '',
        courseName: '',
        programmeName: '',
      }))
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      setClasses([])
      setOfferings([])
      if (!value) return

      try {
        const [d, ay, b] = await Promise.all([
          lmsService.listDepartments(value),
          lmsService.listAcademicYears(value),
          lmsService.listBatches(value),
        ])
        setDepartments(d)
        setAcademicYears(ay)
        setBatches(b)
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
        classId: '',
        className: '',
        classLabel: '',
        courseCode: '',
        courseName: '',
        programmeName: '',
      }))
      setProgrammes([])
      setRegulations([])
      setClasses([])
      setOfferings([])
      if (!value || !form.institutionId) return

      try {
        setProgrammes(await lmsService.listProgrammes(form.institutionId, value))
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
        classId: '',
        className: '',
        classLabel: '',
        courseCode: '',
        courseName: '',
        programmeName: chosen?.programmeName || '',
      }))
      setRegulations([])
      setClasses([])
      setOfferings([])
      if (!value || !form.institutionId || !form.departmentId) return

      try {
        const [r, c] = await Promise.all([
          lmsService.listRegulations(form.institutionId, value),
          lmsService.listClasses({ institutionId: form.institutionId, departmentId: form.departmentId, programmeId: value }),
        ])
        setRegulations(r)
        setClasses(c)
      } catch {
        setError('Failed to load programme scope')
      }
      return
    }

    if (key === 'classId') {
      const chosen = classes.find((x) => String(x.id) === String(value))
      setForm((p) => ({ ...p, classId: value, className: chosen?.className || '', classLabel: chosen?.classLabel || '' }))
      return
    }

    if (key === 'courseCode') {
      const chosen = offerings.find((x) => String(x.course?.courseCode) === String(value))
      setForm((p) => ({ ...p, courseCode: value, courseName: chosen?.course?.courseTitle || '' }))
      return
    }

    setForm((p) => ({ ...p, [key]: value }))
  }

  useEffect(() => {
    ;(async () => {
      if (!form.institutionId || !form.academicYearId || !form.programmeId || !form.regulationId || !form.semester) {
        setOfferings([])
        return
      }
      try {
        const data = await lmsService.listCourseOfferings({
          institutionId: form.institutionId,
          academicYearId: form.academicYearId,
          programmeId: form.programmeId,
          regulationId: form.regulationId,
          batchId: form.batchId,
          semester: form.semester,
        })
        setOfferings(data)
      } catch {
        setOfferings([])
      }
    })()
  }, [form.institutionId, form.academicYearId, form.programmeId, form.regulationId, form.batchId, form.semester])

  const onSearch = async () => {
    if (!form.institutionId || !form.departmentId || !form.programmeId || !form.regulationId || !form.academicYearId || !form.batchId || !form.semester) {
      setError('Select full scope: Institution, Department, Programme, Regulation, Academic Year, Batch and Semester')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      const data = await lmsService.listStudents({
        institutionId: form.institutionId,
        departmentId: form.departmentId,
        programmeId: form.programmeId,
        regulationId: form.regulationId,
        academicYearId: form.academicYearId,
        batchId: form.batchId,
        semester: form.semester,
        className: form.className,
        section: form.classLabel,
      })

      let allotmentSet = new Set()
      const scope = {
        institutionId: form.institutionId,
        departmentId: form.departmentId,
        programmeId: form.programmeId,
        regulationId: form.regulationId,
        academicYearId: form.academicYearId,
        batchId: form.batchId,
        semester: form.semester,
      }
      if (allotmentMode === 'COURSE_WISE' && form.courseCode) {
        const allotments = await lmsService.listStudentAllotments({
          ...scope,
          courseCode: form.courseCode,
        })
        allotmentSet = new Set(allotments.map((x) => String(x.studentId)))
      }
      if (allotmentMode === 'ALL_COURSES') {
        const allotments = await lmsService.listStudentAllotmentsAllCourses(scope)
        allotmentSet = new Set(allotments.map((x) => String(x.studentId)))
      }

      const mapped = data
        .map((x) => ({
          id: x.id,
          studentId: x.studentId,
          batch: x.batch || '-',
          regNo: x.registerNumber,
          name: x.firstName,
          selected: allotmentSet.has(String(x.studentId)),
        }))

      setRows(mapped)
      setShowDetails(true)
      const allSelected = mapped.length > 0 && mapped.every((x) => x.selected)
      setSelectAll(allSelected)
      setForm((p) => ({
        ...p,
        status: !mapped.length
          ? 'No students found'
          : allotmentMode === 'COURSE_WISE' && form.courseCode
            ? 'Student allotment loaded'
            : allotmentMode === 'ALL_COURSES'
              ? 'Students loaded for all courses'
              : 'Students loaded',
      }))
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const onReset = () => {
    setAllotmentMode('COURSE_WISE')
    setForm(initialForm)
    setShowDetails(false)
    setRows([])
    setSearch('')
    setSelectAll(false)
    setPage(1)
    setDepartments([])
    setProgrammes([])
    setRegulations([])
    setAcademicYears([])
    setBatches([])
    setClasses([])
    setOfferings([])
    setError('')
    setSuccess('')
  }

  const onAllotment = async () => {
    if (allotmentMode === 'COURSE_WISE' && !form.courseCode) {
      setError('Select Course Code to save student allotment')
      return
    }
    const selectedStudentIds = rows.filter((x) => x.selected).map((x) => x.studentId)
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const scope = {
        institutionId: form.institutionId,
        departmentId: form.departmentId,
        programmeId: form.programmeId,
        regulationId: form.regulationId,
        academicYearId: form.academicYearId,
        batchId: form.batchId,
        semester: form.semester,
      }

      if (allotmentMode === 'ALL_COURSES') {
        const ok = window.confirm('Apply selected students to all courses in this scope?')
        if (!ok) return
        await lmsService.syncStudentAllotmentsAllCourses(scope, {
          studentIds: selectedStudentIds,
        })
      } else {
        await lmsService.syncStudentAllotments(scope, {
          courseCode: form.courseCode,
          studentIds: selectedStudentIds,
        })
      }
      setSuccess(
        allotmentMode === 'ALL_COURSES'
          ? 'Student allotment saved successfully for all courses'
          : 'Student allotment saved successfully',
      )
      setForm((p) => ({
        ...p,
        status: selectedStudentIds.length
          ? allotmentMode === 'ALL_COURSES'
            ? 'Student allotment done for all courses'
            : 'Student allotment done'
          : 'No students allotted',
      }))
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save student allotment')
    } finally {
      setSaving(false)
    }
  }

  const toggleSelectAll = () => {
    const next = !selectAll
    setSelectAll(next)
    setRows((p) => p.map((r) => ({ ...r, selected: next })))
  }

  const toggleRow = (id) => {
    setRows((p) => p.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)))
  }

  useEffect(() => {
    setSelectAll(rows.length > 0 && rows.every((r) => r.selected))
  }, [rows])

  const filtered = useMemo(() => {
    const q = String(search).toLowerCase().trim()
    if (!q) return rows
    return rows.filter((r) => `${r.regNo} ${r.name}`.toLowerCase().includes(q))
  }, [rows, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader>
            <strong>STUDENT ALLOTMENT</strong>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Student Allotment</strong>
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

                <CCol md={3}><CFormLabel>Batch</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.batchId} onChange={onChange('batchId')}>
                    <option value="">Select Batch</option>
                    {batches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')}>
                    <option value="">Select Semester</option>
                    {semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.programmeName || '-'} disabled /></CCol>

                <CCol md={3}><CFormLabel>Class Name</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.classId} onChange={onChange('classId')}>
                    <option value="">Select Class Name</option>
                    {classes.map((x) => <option key={x.id} value={x.id}>{x.className} {x.classLabel ? `- ${x.classLabel}` : ''}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Select Class Label</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.classLabel} onChange={onChange('classLabel')}>
                    <option value="">Select Class Label</option>
                    {classLabelOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Allotment Scope</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={allotmentMode} onChange={onChange('allotmentMode')}>
                    <option value="COURSE_WISE">Course Wise</option>
                    <option value="ALL_COURSES">All Courses</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Course Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.courseCode}
                    onChange={onChange('courseCode')}
                    disabled={allotmentMode === 'ALL_COURSES'}
                  >
                    <option value="">Select Course Code</option>
                    {offerings.map((x) => (
                      <option key={x.id} value={x.course?.courseCode || ''}>{x.course?.courseCode || '-'}</option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Course Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={allotmentMode === 'ALL_COURSES' ? 'All Courses' : form.courseName || '-'} disabled /></CCol>

                <CCol md={3}><CFormLabel>Status</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.status} disabled /></CCol>

                <CCol md={3}><CFormLabel>Action</CFormLabel></CCol>
                <CCol md={3} className="d-flex gap-2 justify-content-end">
                  <ArpButton label={loading ? 'Loading...' : 'Search'} icon="search" color="primary" onClick={onSearch} disabled={loading} />
                  <ArpButton label="Reset" icon="reset" color="secondary" onClick={onReset} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {showDetails && (
          <CCard>
            <CCardHeader>
              <strong>Student Allotment Details</strong>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex justify-content-between mb-2">
                <CFormInput
                  placeholder="Search by Register Number or Name"
                  style={{ maxWidth: 320 }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <CFormCheck
                  label="Select All Students"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                />
              </div>

              <CTable bordered hover size="sm">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Batch</CTableHeaderCell>
                    <CTableHeaderCell>Register Number</CTableHeaderCell>
                    <CTableHeaderCell>Student Name</CTableHeaderCell>
                    <CTableHeaderCell>Enrollment</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell>{r.batch}</CTableDataCell>
                      <CTableDataCell>{r.regNo}</CTableDataCell>
                      <CTableDataCell>{r.name}</CTableDataCell>
                      <CTableDataCell>
                        <CFormCheck checked={r.selected} onChange={() => toggleRow(r.id)} />
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

                <div className="d-flex justify-content-between align-items-center mt-2">
                  <div className="d-flex gap-2">
                  <ArpButton
                    label={saving ? 'Saving...' : allotmentMode === 'ALL_COURSES' ? 'Allot to All Courses' : 'Allotment'}
                    icon="check"
                    color="success"
                    onClick={onAllotment}
                    disabled={saving}
                  />
                  <ArpButton label="Reset" icon="reset" color="secondary" onClick={onReset} />
                  <ArpButton label="Cancel" icon="cancel" color="danger" onClick={() => setShowDetails(false)} />
                  </div>

                <CPagination size="sm">
                  <CPaginationItem disabled={safePage <= 1} onClick={() => setPage(1)}>Prev</CPaginationItem>
                  <CPaginationItem active>{safePage}</CPaginationItem>
                  <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>Next</CPaginationItem>
                </CPagination>
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default StudentAllotmentConfiguration
