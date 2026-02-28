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

const STATUS_OPTIONS = ['P', 'A', 'OD', 'L', 'LA']

const todayIso = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const initialForm = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
  facultyId: '',
  date: todayIso(),
}

const AttendanceConfiguration = () => {
  const [form, setForm] = useState(initialForm)
  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [faculties, setFaculties] = useState([])

  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [roster, setRoster] = useState([])
  const [reportRows, setReportRows] = useState([])
  const [reportMeta, setReportMeta] = useState({
    totalSessions: 0,
    totalStudents: 0,
    shortageCount: 0,
    threshold: 75,
  })

  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

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

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(form.academicYearId)) || null,
    [academicYears, form.academicYearId],
  )
  const semesterOptions = useMemo(() => semesterOptionsFromAcademicYear(selectedAcademicYear), [selectedAcademicYear])

  const rosterSummary = useMemo(() => {
    const total = roster.length
    const counts = { P: 0, A: 0, OD: 0, L: 0, LA: 0 }
    roster.forEach((x) => {
      if (counts[x.attendanceCode] !== undefined) counts[x.attendanceCode] += 1
    })
    const presentLike = counts.P + counts.OD + counts.L
    const percentage = total ? Math.round((presentLike / total) * 10000) / 100 : 0
    return { total, ...counts, percentage }
  }, [roster])

  React.useEffect(() => {
    ;(async () => {
      try {
        setInstitutions(await lmsService.listInstitutions())
      } catch {
        setError('Failed to load institutions')
      }
    })()
  }, [])

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
        facultyId: '',
      }))
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      setFaculties([])
      setSessions([])
      setSelectedSession(null)
      setRoster([])
      setReportRows([])
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
      setForm((p) => ({ ...p, departmentId: value, programmeId: '', regulationId: '', facultyId: '' }))
      setProgrammes([])
      setRegulations([])
      setFaculties([])
      setSessions([])
      setSelectedSession(null)
      setRoster([])
      setReportRows([])
      if (!value || !form.institutionId) return
      try {
        setProgrammes(await lmsService.listProgrammes(form.institutionId, value))
      } catch {
        setError('Failed to load programmes')
      }
      return
    }

    if (key === 'programmeId') {
      setForm((p) => ({ ...p, programmeId: value, regulationId: '' }))
      setRegulations([])
      setSessions([])
      setSelectedSession(null)
      setRoster([])
      setReportRows([])
      if (!value || !form.institutionId) return
      try {
        setRegulations(await lmsService.listRegulations(form.institutionId, value))
      } catch {
        setError('Failed to load regulations')
      }
      return
    }

    if (key === 'academicYearId') {
      setForm((p) => ({ ...p, academicYearId: value, semester: '', facultyId: '' }))
      setFaculties([])
      setSessions([])
      setSelectedSession(null)
      setRoster([])
      setReportRows([])
      if (!form.institutionId || !form.departmentId || !value) return
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

    setForm((p) => ({ ...p, [key]: value }))
  }

  const validateScope = () => {
    if (!form.institutionId || !form.departmentId || !form.programmeId || !form.regulationId) {
      setError('Select Institution, Department, Programme and Regulation')
      return false
    }
    if (!form.academicYearId || !form.batchId || !form.semester) {
      setError('Select Academic Year, Batch and Semester')
      return false
    }
    if (!form.facultyId) {
      setError('Select faculty')
      return false
    }
    if (!form.date) {
      setError('Select attendance date')
      return false
    }
    return true
  }

  const onSearchSessions = async (e) => {
    e?.preventDefault?.()
    setError('')
    setInfo('')
    if (!validateScope()) return

    try {
      setLoadingSessions(true)
      setSelectedSession(null)
      setRoster([])
      setReportRows([])
      const rows = await lmsService.getFacultyLectureSchedule(scope, {
        facultyId: form.facultyId,
        view: 'date',
        date: form.date,
      })
      setSessions(Array.isArray(rows) ? rows : [])
      if (!rows?.length) setInfo('No lecture sessions found for selected date')
    } catch (err) {
      setSessions([])
      setError(err?.response?.data?.error || 'Failed to load lecture sessions')
    } finally {
      setLoadingSessions(false)
    }
  }

  const loadCourseReport = async (session) => {
    if (!session?.courseOfferingId) return
    try {
      const report = await lmsService.getAttendanceCourseReport(scope, {
        courseOfferingId: session.courseOfferingId,
        classId: session.classId,
        facultyId: form.facultyId,
        date: session.sessionDate || form.date,
        threshold: 75,
      })
      const meta = report?.meta || {}
      setReportRows(Array.isArray(report?.rows) ? report.rows : [])
      setReportMeta({
        totalSessions: Number(meta?.totalSessions || report?.totalSessions || 0),
        totalStudents: Number(meta?.totalStudents || report?.totalStudents || 0),
        shortageCount: Number(meta?.shortageCount || report?.shortageCount || 0),
        threshold: Number(report?.filters?.threshold || report?.threshold || 75),
      })
    } catch {
      setReportRows([])
      setReportMeta({
        totalSessions: 0,
        totalStudents: 0,
        shortageCount: 0,
        threshold: 75,
      })
    }
  }

  const onSelectSession = async (session) => {
    setError('')
    setInfo('')
    setSelectedSession(session)
    setRoster([])
    try {
      setLoadingRoster(true)
      const data = await lmsService.getLectureAttendanceRoster(session.id, scope, {
        facultyId: form.facultyId,
        date: session.sessionDate || form.date,
      })
      setRoster(Array.isArray(data?.students) ? data.students : [])
      await loadCourseReport(session)
    } catch (err) {
      setRoster([])
      setError(err?.response?.data?.error || 'Failed to load attendance roster')
    } finally {
      setLoadingRoster(false)
    }
  }

  const setAllStatus = (status) => {
    setRoster((prev) => prev.map((x) => ({ ...x, attendanceCode: status })))
  }

  const setRowStatus = (studentId, status) => {
    setRoster((prev) =>
      prev.map((x) => (String(x.studentId) === String(studentId) ? { ...x, attendanceCode: status } : x)),
    )
  }

  const onSave = async () => {
    setError('')
    setInfo('')
    if (!selectedSession?.id) {
      setError('Select a lecture session first')
      return
    }
    if (!roster.length) {
      setError('No students found to mark attendance')
      return
    }
    try {
      setSaving(true)
      await lmsService.saveLectureAttendance(selectedSession.id, scope, {
        facultyId: form.facultyId,
        date: selectedSession.sessionDate || form.date,
        entries: roster.map((x) => ({
          studentId: x.studentId,
          attendanceCode: x.attendanceCode,
          remarks: x.remarks || '',
        })),
      })
      setInfo('Attendance saved successfully')
      await Promise.all([onSelectSession(selectedSession), onSearchSessions()])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Attendance</strong>
          </CCardHeader>
        </CCard>

        {error ? <CAlert color="danger">{error}</CAlert> : null}
        {info ? <CAlert color="success">{info}</CAlert> : null}

        <CCard className="mb-3">
          <CCardHeader><strong>Lecture Scope</strong></CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSearchSessions}>
              <CRow className="g-3">
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

                <CCol md={3}><CFormLabel>Faculty</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.facultyId} onChange={onChange('facultyId')}>
                    <option value="">Select</option>
                    {faculties.map((x) => <option key={x.id} value={x.id}>{x.facultyCode} - {x.facultyName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Date</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput type="date" value={form.date} onChange={onChange('date')} />
                </CCol>

                <CCol md={12} className="text-end">
                  <ArpButton label="Search Sessions" icon="search" color="primary" type="submit" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Lecture Sessions</strong>
            {loadingSessions ? <CSpinner size="sm" /> : <CBadge color="primary">Total: {sessions.length}</CBadge>}
          </CCardHeader>
          <CCardBody>
            <CTable bordered hover responsive small>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Hour</CTableHeaderCell>
                  <CTableHeaderCell>Course</CTableHeaderCell>
                  <CTableHeaderCell>Class</CTableHeaderCell>
                  <CTableHeaderCell>Attendance</CTableHeaderCell>
                  <CTableHeaderCell>Action</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {sessions.length ? sessions.map((x) => (
                  <CTableRow key={`${x.id}-${x.sessionDate}-${x.hourLabel}`}>
                    <CTableDataCell>{x.sessionDate || '-'}</CTableDataCell>
                    <CTableDataCell>{x.hourLabel ? `Hour ${x.hourLabel}` : '-'} ({x.timeFrom || '-'} - {x.timeTo || '-'})</CTableDataCell>
                    <CTableDataCell>{x.courseCode} - {x.courseTitle}</CTableDataCell>
                    <CTableDataCell>{x.className || '-'} {x.classLabel ? `(${x.classLabel})` : ''}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={String(x.attendanceStatus || '').toUpperCase() === 'TAKEN' ? 'success' : 'secondary'}>
                        {x.attendanceStatus || 'NOT_TAKEN'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton size="sm" color="primary" onClick={() => onSelectSession(x)}>Mark Attendance</CButton>
                    </CTableDataCell>
                  </CTableRow>
                )) : (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center">No sessions</CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>

        {selectedSession ? (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <strong>Attendance Entry</strong>
                <CBadge color="info">{selectedSession.courseCode} | {selectedSession.sessionDate} | Hour {selectedSession.hourLabel || '-'}</CBadge>
                <CBadge color="primary">P: {rosterSummary.P}</CBadge>
                <CBadge color="danger">A: {rosterSummary.A}</CBadge>
                <CBadge color="warning">OD/L/LA: {rosterSummary.OD + rosterSummary.L + rosterSummary.LA}</CBadge>
                <CBadge color="dark">Present %: {rosterSummary.percentage}</CBadge>
              </div>
              <div className="d-flex align-items-center gap-2">
                {loadingRoster ? <CSpinner size="sm" /> : null}
                <CButton size="sm" color="success" onClick={onSave} disabled={saving || loadingRoster}>
                  {saving ? <CSpinner size="sm" /> : 'Save Attendance'}
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {STATUS_OPTIONS.map((code) => (
                  <CButton key={code} size="sm" color="secondary" variant="outline" onClick={() => setAllStatus(code)}>
                    Set All {code}
                  </CButton>
                ))}
              </div>

              <CTable bordered hover responsive small>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>S.No</CTableHeaderCell>
                    <CTableHeaderCell>Register No</CTableHeaderCell>
                    <CTableHeaderCell>Student</CTableHeaderCell>
                    {STATUS_OPTIONS.map((code) => <CTableHeaderCell key={code} className="text-center">{code}</CTableHeaderCell>)}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {roster.length ? roster.map((st, index) => (
                    <CTableRow key={st.studentId}>
                      <CTableDataCell>{index + 1}</CTableDataCell>
                      <CTableDataCell>{st.registerNumber || '-'}</CTableDataCell>
                      <CTableDataCell>{st.studentName || '-'}</CTableDataCell>
                      {STATUS_OPTIONS.map((code) => (
                        <CTableDataCell key={code} className="text-center">
                          <CButton
                            size="sm"
                            color={st.attendanceCode === code ? 'primary' : 'light'}
                            variant={st.attendanceCode === code ? undefined : 'outline'}
                            onClick={() => setRowStatus(st.studentId, code)}
                          >
                            {code}
                          </CButton>
                        </CTableDataCell>
                      ))}
                    </CTableRow>
                  )) : (
                    <CTableRow>
                      <CTableDataCell colSpan={8} className="text-center">No students in roster</CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        ) : null}

        {selectedSession ? (
          <CCard>
            <CCardHeader className="d-flex flex-wrap gap-2 align-items-center">
              <strong>Attendance Report</strong>
              <CBadge color="primary">Sessions: {reportMeta.totalSessions}</CBadge>
              <CBadge color="info">Students: {reportMeta.totalStudents}</CBadge>
              <CBadge color={reportMeta.shortageCount ? 'danger' : 'success'}>
                Shortage (&lt;{reportMeta.threshold}%): {reportMeta.shortageCount}
              </CBadge>
            </CCardHeader>
            <CCardBody>
              <CTable bordered responsive small>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Register No</CTableHeaderCell>
                    <CTableHeaderCell>Student</CTableHeaderCell>
                    <CTableHeaderCell>Total Sessions</CTableHeaderCell>
                    <CTableHeaderCell>Present</CTableHeaderCell>
                    <CTableHeaderCell>Absent</CTableHeaderCell>
                    <CTableHeaderCell>OD</CTableHeaderCell>
                    <CTableHeaderCell>Late</CTableHeaderCell>
                    <CTableHeaderCell>Late Absent</CTableHeaderCell>
                    <CTableHeaderCell>Attendance %</CTableHeaderCell>
                    <CTableHeaderCell>Alert</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {reportRows.length ? reportRows.map((x) => (
                    <CTableRow key={x.studentId}>
                      <CTableDataCell>{x.registerNumber || '-'}</CTableDataCell>
                      <CTableDataCell>{x.studentName || '-'}</CTableDataCell>
                      <CTableDataCell>{x.totalSessions || 0}</CTableDataCell>
                      <CTableDataCell>{x.present || 0}</CTableDataCell>
                      <CTableDataCell>{x.absent || 0}</CTableDataCell>
                      <CTableDataCell>{x.onDuty || 0}</CTableDataCell>
                      <CTableDataCell>{x.late || 0}</CTableDataCell>
                      <CTableDataCell>{x.lateAbsent || 0}</CTableDataCell>
                      <CTableDataCell>{x.percentage || 0}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={x.shortage ? 'danger' : 'success'}>
                          {x.shortage ? 'Shortage' : 'OK'}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  )) : (
                    <CTableRow>
                      <CTableDataCell colSpan={10} className="text-center">No report data</CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        ) : null}
      </CCol>
    </CRow>
  )
}

export default AttendanceConfiguration
