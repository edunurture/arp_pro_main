import React, { useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'
import { ArpButton } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'

const REPORT_TYPES = [
  { value: 'CLASS_WISE', label: 'Class-wise Attendance' },
  { value: 'COURSE_WISE', label: 'Course-wise Attendance' },
]

const initialForm = {
  reportType: 'CLASS_WISE',
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
  classId: '',
  courseOfferingId: '',
  facultyId: '',
  fromDate: '',
  toDate: '',
  threshold: '75',
}

const toCsvCell = (value) => {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('\n') || text.includes('"')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

const AcademicReports = () => {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({
    reportType: '',
    className: '',
    classLabel: '',
    courseCode: '',
    courseTitle: '',
    totalSessions: 0,
    totalStudents: 0,
    shortageCount: 0,
  })

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [classes, setClasses] = useState([])
  const [courseOfferings, setCourseOfferings] = useState([])
  const [faculties, setFaculties] = useState([])

  React.useEffect(() => {
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
  const semesterOptions = useMemo(() => semesterOptionsFromAcademicYear(selectedAcademicYear), [selectedAcademicYear])

  const scope = useMemo(
    () => ({
      institutionId: form.institutionId,
      departmentId: form.departmentId,
      programmeId: form.programmeId,
      regulationId: form.regulationId,
      academicYearId: form.academicYearId,
      batchId: form.batchId,
      semester: form.semester,
    }),
    [form],
  )

  const onChange = (key) => async (e) => {
    const value = e.target.value
    setError('')
    setInfo('')

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
        courseOfferingId: '',
        facultyId: '',
      }))
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      setClasses([])
      setCourseOfferings([])
      setFaculties([])
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
        courseOfferingId: '',
        facultyId: '',
      }))
      setProgrammes([])
      setRegulations([])
      setClasses([])
      setCourseOfferings([])
      setFaculties([])
      if (!value || !form.institutionId) return
      try {
        setProgrammes(await lmsService.listProgrammes(form.institutionId, value))
      } catch {
        setError('Failed to load programmes')
      }
      return
    }

    if (key === 'programmeId') {
      setForm((p) => ({ ...p, programmeId: value, regulationId: '', classId: '', courseOfferingId: '' }))
      setRegulations([])
      setClasses([])
      setCourseOfferings([])
      if (!value || !form.institutionId) return
      try {
        const [reg, cls] = await Promise.all([
          lmsService.listRegulations(form.institutionId, value),
          lmsService.listClasses({
            institutionId: form.institutionId,
            departmentId: form.departmentId,
            programmeId: value,
          }),
        ])
        setRegulations(reg)
        setClasses(cls)
      } catch {
        setError('Failed to load programme scope')
      }
      return
    }

    if (key === 'academicYearId') {
      setForm((p) => ({ ...p, academicYearId: value, semester: '', courseOfferingId: '', facultyId: '' }))
      setCourseOfferings([])
      setFaculties([])
      if (!value || !form.institutionId || !form.departmentId) return
      try {
        setFaculties(
          await lmsService.listFaculties({
            institutionId: form.institutionId,
            departmentId: form.departmentId,
            academicYearId: value,
          }),
        )
      } catch {
        setError('Failed to load faculties')
      }
      return
    }

    if (key === 'semester') {
      setForm((p) => ({ ...p, semester: value, courseOfferingId: '' }))
      setCourseOfferings([])
      if (!value) return
      const nextScope = {
        institutionId: form.institutionId,
        departmentId: form.departmentId,
        programmeId: form.programmeId,
        regulationId: form.regulationId,
        academicYearId: form.academicYearId,
        batchId: form.batchId,
        semester: value,
      }
      if (!nextScope.institutionId || !nextScope.programmeId || !nextScope.regulationId || !nextScope.academicYearId || !nextScope.batchId) {
        return
      }
      try {
        setCourseOfferings(await lmsService.listCourseOfferings(nextScope))
      } catch {
        setError('Failed to load course offerings')
      }
      return
    }

    if (key === 'reportType') {
      setForm((p) => ({ ...p, reportType: value }))
      return
    }

    setForm((p) => ({ ...p, [key]: value }))
  }

  const onReset = () => {
    setForm(initialForm)
    setRows([])
    setMeta({
      reportType: '',
      className: '',
      classLabel: '',
      courseCode: '',
      courseTitle: '',
      totalSessions: 0,
      totalStudents: 0,
      shortageCount: 0,
    })
    setError('')
    setInfo('')
  }

  const validate = () => {
    if (!form.institutionId || !form.departmentId || !form.programmeId || !form.regulationId) {
      setError('Select Institution, Department, Programme and Regulation')
      return false
    }
    if (!form.academicYearId || !form.batchId || !form.semester) {
      setError('Select Academic Year, Batch and Semester')
      return false
    }
    if (form.reportType === 'CLASS_WISE' && !form.classId) {
      setError('Class is required for class-wise report')
      return false
    }
    if (form.reportType === 'COURSE_WISE' && !form.courseOfferingId) {
      setError('Course is required for course-wise report')
      return false
    }
    if (form.fromDate && form.toDate && form.fromDate > form.toDate) {
      setError('From Date must be less than or equal to To Date')
      return false
    }
    return true
  }

  const onSearch = async (e) => {
    e?.preventDefault?.()
    setError('')
    setInfo('')
    if (!validate()) return

    const params = {
      ...(form.facultyId ? { facultyId: form.facultyId } : {}),
      ...(form.fromDate ? { fromDate: form.fromDate } : {}),
      ...(form.toDate ? { toDate: form.toDate } : {}),
      threshold: form.threshold || '75',
      ...(form.classId ? { classId: form.classId } : {}),
      ...(form.courseOfferingId ? { courseOfferingId: form.courseOfferingId } : {}),
    }

    try {
      setLoading(true)
      const report =
        form.reportType === 'CLASS_WISE'
          ? await lmsService.getAttendanceClassWiseReport(scope, params)
          : await lmsService.getAttendanceCourseWiseReport(scope, params)

      const list = Array.isArray(report?.rows) ? report.rows : []
      const m = report?.meta || {}
      setRows(list)
      setMeta({
        reportType: report?.reportType || form.reportType,
        className: m?.className || '',
        classLabel: m?.classLabel || '',
        courseCode: m?.courseCode || '',
        courseTitle: m?.courseTitle || '',
        totalSessions: Number(m?.totalSessions || 0),
        totalStudents: Number(m?.totalStudents || 0),
        shortageCount: Number(m?.shortageCount || 0),
      })
      if (!list.length) setInfo('No records found for selected filters')
    } catch (err) {
      setRows([])
      setMeta({
        reportType: '',
        className: '',
        classLabel: '',
        courseCode: '',
        courseTitle: '',
        totalSessions: 0,
        totalStudents: 0,
        shortageCount: 0,
      })
      setError(err?.response?.data?.error || 'Failed to load attendance report')
    } finally {
      setLoading(false)
    }
  }

  const onExportCsv = () => {
    if (!rows.length) return
    const headers = [
      'Register Number',
      'Student Name',
      'Total Sessions',
      'Present',
      'Absent',
      'On Duty',
      'Late',
      'Late Absent',
      'Attendance %',
      'Status',
    ]

    const lines = [headers.map(toCsvCell).join(',')]
    rows.forEach((r) => {
      lines.push(
        [
          r.registerNumber,
          r.studentName,
          r.totalSessions,
          r.present,
          r.absent,
          r.onDuty,
          r.late,
          r.lateAbsent,
          r.percentage,
          r.shortage ? 'Shortage' : 'OK',
        ]
          .map(toCsvCell)
          .join(','),
      )
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${form.reportType === 'CLASS_WISE' ? 'class-wise' : 'course-wise'}-attendance-report.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  const onPrint = () => window.print()

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader>
            <strong>ACADEMIC REPORTS - ADMIN ATTENDANCE</strong>
          </CCardHeader>
        </CCard>

        {error ? <CAlert color="danger">{error}</CAlert> : null}
        {info ? <CAlert color="info">{info}</CAlert> : null}

        <CCard className="mb-3">
          <CCardHeader><strong>Filters</strong></CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSearch}>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Choose Category</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.reportType} onChange={onChange('reportType')}>
                    {REPORT_TYPES.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Institution</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.institutionId} onChange={onChange('institutionId')}>
                    <option value="">Select</option>
                    {institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Department</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.departmentId} onChange={onChange('departmentId')}>
                    <option value="">Select</option>
                    {departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeId} onChange={onChange('programmeId')}>
                    <option value="">Select</option>
                    {programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode} - {x.programmeName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Regulation</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.regulationId} onChange={onChange('regulationId')}>
                    <option value="">Select</option>
                    {regulations.map((x) => <option key={x.id} value={x.id}>{x.regulationCode}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYearId} onChange={onChange('academicYearId')}>
                    <option value="">Select</option>
                    {academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Batch</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.batchId} onChange={onChange('batchId')}>
                    <option value="">Select</option>
                    {batches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')}>
                    <option value="">Select</option>
                    {semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Class</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.classId} onChange={onChange('classId')}>
                    <option value="">Select</option>
                    {classes.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.className}{x.classLabel ? ` (${x.classLabel})` : ''}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Course</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.courseOfferingId} onChange={onChange('courseOfferingId')}>
                    <option value="">Select</option>
                    {courseOfferings.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.course?.courseCode || x.courseCode} - {x.course?.courseTitle || x.courseTitle}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Faculty (Optional)</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.facultyId} onChange={onChange('facultyId')}>
                    <option value="">All</option>
                    {faculties.map((x) => <option key={x.id} value={x.id}>{x.facultyCode} - {x.facultyName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>From Date</CFormLabel></CCol>
                <CCol md={3}><CFormInput type="date" value={form.fromDate} onChange={onChange('fromDate')} /></CCol>

                <CCol md={3}><CFormLabel>To Date</CFormLabel></CCol>
                <CCol md={3}><CFormInput type="date" value={form.toDate} onChange={onChange('toDate')} /></CCol>

                <CCol md={3}><CFormLabel>Threshold %</CFormLabel></CCol>
                <CCol md={3}><CFormInput type="number" min={0} max={100} value={form.threshold} onChange={onChange('threshold')} /></CCol>

                <CCol md={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Search" icon="search" color="primary" type="submit" />
                  <ArpButton label="Reset" icon="reset" color="warning" onClick={onReset} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <strong>Attendance Report Details</strong>
              {meta.reportType ? <CBadge color="primary">{meta.reportType}</CBadge> : null}
              {meta.className ? <CBadge color="info">Class: {meta.className}{meta.classLabel ? ` (${meta.classLabel})` : ''}</CBadge> : null}
              {meta.courseCode ? <CBadge color="info">Course: {meta.courseCode} - {meta.courseTitle}</CBadge> : null}
              <CBadge color="dark">Sessions: {meta.totalSessions}</CBadge>
              <CBadge color="secondary">Students: {meta.totalStudents}</CBadge>
              <CBadge color={meta.shortageCount ? 'danger' : 'success'}>Shortage: {meta.shortageCount}</CBadge>
            </div>
            <div className="d-flex align-items-center gap-2">
              {loading ? <CSpinner size="sm" /> : null}
              <CButton size="sm" color="secondary" onClick={onPrint} disabled={!rows.length}>Print</CButton>
              <CButton size="sm" color="success" onClick={onExportCsv} disabled={!rows.length}>Export CSV</CButton>
            </div>
          </CCardHeader>
          <CCardBody>
            <CTable bordered responsive hover small>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Register No</CTableHeaderCell>
                  <CTableHeaderCell>Student Name</CTableHeaderCell>
                  <CTableHeaderCell>Total Sessions</CTableHeaderCell>
                  <CTableHeaderCell>Present</CTableHeaderCell>
                  <CTableHeaderCell>Absent</CTableHeaderCell>
                  <CTableHeaderCell>OD</CTableHeaderCell>
                  <CTableHeaderCell>Late</CTableHeaderCell>
                  <CTableHeaderCell>Late Absent</CTableHeaderCell>
                  <CTableHeaderCell>Attendance %</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {rows.length ? rows.map((r) => (
                  <CTableRow key={r.studentId}>
                    <CTableDataCell>{r.registerNumber || '-'}</CTableDataCell>
                    <CTableDataCell>{r.studentName || '-'}</CTableDataCell>
                    <CTableDataCell>{r.totalSessions || 0}</CTableDataCell>
                    <CTableDataCell>{r.present || 0}</CTableDataCell>
                    <CTableDataCell>{r.absent || 0}</CTableDataCell>
                    <CTableDataCell>{r.onDuty || 0}</CTableDataCell>
                    <CTableDataCell>{r.late || 0}</CTableDataCell>
                    <CTableDataCell>{r.lateAbsent || 0}</CTableDataCell>
                    <CTableDataCell>{r.percentage || 0}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={r.shortage ? 'danger' : 'success'}>
                        {r.shortage ? 'Shortage' : 'OK'}
                      </CBadge>
                    </CTableDataCell>
                  </CTableRow>
                )) : (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center">No data</CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default AcademicReports
