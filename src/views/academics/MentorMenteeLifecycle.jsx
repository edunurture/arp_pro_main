import React, { useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
} from '@coreui/react-pro'
import { ArpButton, ArpDataTable, ArpIconButton } from '../../components/common'
import { academicsService } from '../../services/academicsService'
import { lmsService } from '../../services/lmsService'

const issueOptions = ['ACADEMIC', 'PSYCHOLOGICAL', 'ATTENDANCE', 'FINANCIAL', 'BEHAVIOURAL', 'OTHER']
const statusOptions = ['OPEN', 'IN_PROGRESS', 'CLOSED']

const MentorMenteeLifecycle = () => {
  const [filters, setFilters] = useState({ department: '', semester: '', risk: '' })
  const [mentorForm, setMentorForm] = useState({
    institutionId: '',
    departmentId: '',
    academicYearId: '',
    facultyId: '',
    maxMentees: 20,
  })
  const [menteeScope, setMenteeScope] = useState({
    institutionId: '',
    departmentId: '',
    programmeId: '',
    classId: '',
  })
  const [meetingForm, setMeetingForm] = useState({
    mentorId: '',
    menteeId: '',
    issueType: 'ACADEMIC',
    summary: '',
    actionPlan: '',
    followUpDate: '',
    status: 'OPEN',
  })

  const [mentors, setMentors] = useState([])
  const [mentees, setMentees] = useState([])
  const [meetings, setMeetings] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [faculties, setFaculties] = useState([])
  const [mDepartments, setMDepartments] = useState([])
  const [mProgrammes, setMProgrammes] = useState([])
  const [mClasses, setMClasses] = useState([])
  const [candidateStudents, setCandidateStudents] = useState([])
  const [summary, setSummary] = useState({
    mentors: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    totalSessions: 0,
    escalatedSessions: 0,
    openSessions: 0,
    inProgressSessions: 0,
    closedSessions: 0,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState('')
  const [selectedMenteeId, setSelectedMenteeId] = useState('')
  const [assignEditMode, setAssignEditMode] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const mentorNameMap = useMemo(() => new Map(mentors.map((m) => [m.id, m.mentorName || m.name])), [mentors])
  const menteeNameMap = useMemo(() => new Map(mentees.map((m) => [m.id, m.studentName])), [mentees])
  const departmentOptions = useMemo(() => {
    const set = new Set()
    mentors.forEach((x) => x?.department && set.add(String(x.department)))
    mentees.forEach((x) => x?.department && set.add(String(x.department)))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [mentors, mentees])
  const semesterOptions = useMemo(() => {
    const set = new Set()
    mentees.forEach((x) => x?.semester && set.add(String(x.semester)))
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [mentees])
  const sessionMentees = useMemo(
    () => (meetingForm.mentorId ? mentees.filter((m) => String(m.mentorId || '') === String(meetingForm.mentorId)) : []),
    [mentees, meetingForm.mentorId],
  )

  const loadAll = async () => {
    setLoading(true)
    setError('')
    try {
      const [mtrs, mtes, sess, report] = await Promise.all([
        academicsService.listMentors({ department: filters.department || undefined }),
        academicsService.listMentees({
          department: filters.department || undefined,
          semester: filters.semester || undefined,
          risk: filters.risk || undefined,
        }),
        academicsService.listSessions(),
        academicsService.getSummaryReport(),
      ])
      setMentors(Array.isArray(mtrs) ? mtrs : [])
      setMentees(Array.isArray(mtes) ? mtes : [])
      setMeetings(Array.isArray(sess) ? sess : [])
      setSummary(report?.summary || {
        mentors: 0,
        highRisk: 0,
        mediumRisk: 0,
        lowRisk: 0,
        totalSessions: 0,
        escalatedSessions: 0,
        openSessions: 0,
        inProgressSessions: 0,
        closedSessions: 0,
      })
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load mentor-mentee data')
    } finally {
      setLoading(false)
    }
  }

  const loadInstitutionScope = async () => {
    try {
      const rows = await lmsService.listInstitutions()
      setInstitutions(Array.isArray(rows) ? rows : [])
    } catch {
      setInstitutions([])
    }
  }

  React.useEffect(() => {
    loadAll()
    loadInstitutionScope()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (selectedMeetingId && !meetings.some((x) => String(x.id) === String(selectedMeetingId))) {
      setSelectedMeetingId('')
    }
  }, [meetings, selectedMeetingId])

  React.useEffect(() => {
    if (selectedMenteeId && !mentees.some((x) => String(x.id) === String(selectedMenteeId))) {
      setSelectedMenteeId('')
      setAssignEditMode(false)
    }
  }, [mentees, selectedMenteeId])

  const onMentorScopeChange = (key) => async (e) => {
    const value = e.target.value
    setMentorForm((p) => ({ ...p, [key]: value }))

    if (key === 'institutionId') {
      setMentorForm({ institutionId: value, departmentId: '', academicYearId: '', facultyId: '', maxMentees: 20 })
      setDepartments([])
      setAcademicYears([])
      setFaculties([])
      if (!value) return
      try {
        const [d, ay] = await Promise.all([
          lmsService.listDepartments(value),
          lmsService.listAcademicYears(value),
        ])
        setDepartments(Array.isArray(d) ? d : [])
        setAcademicYears(Array.isArray(ay) ? ay : [])
      } catch {
        setError('Failed to load institution scope')
      }
      return
    }

    if (key === 'departmentId' || key === 'academicYearId') {
      const next = {
        ...mentorForm,
        [key]: value,
      }
      const institutionId = key === 'institutionId' ? value : next.institutionId
      const departmentId = key === 'departmentId' ? value : next.departmentId
      const academicYearId = key === 'academicYearId' ? value : next.academicYearId
      setMentorForm((p) => ({ ...p, [key]: value, facultyId: '' }))
      setFaculties([])
      if (!institutionId || !departmentId || !academicYearId) return
      try {
        const f = await lmsService.listFaculties({ institutionId, departmentId, academicYearId })
        setFaculties(Array.isArray(f) ? f : [])
      } catch {
        setError('Failed to load faculties')
      }
    }
  }

  const onMenteeScopeChange = (key) => async (e) => {
    const value = e.target.value
    setMenteeScope((p) => ({ ...p, [key]: value }))

    if (key === 'institutionId') {
      setMenteeScope({
        institutionId: value,
        departmentId: '',
        programmeId: '',
        classId: '',
      })
      setMDepartments([])
      setMProgrammes([])
      setMClasses([])
      setCandidateStudents([])
      if (!value) return
      try {
        const d = await lmsService.listDepartments(value)
        setMDepartments(Array.isArray(d) ? d : [])
      } catch {
        setError('Failed to load mentee institution scope')
      }
      return
    }

    if (key === 'departmentId') {
      setMenteeScope((p) => ({ ...p, departmentId: value, programmeId: '', classId: '' }))
      setMProgrammes([])
      setMClasses([])
      setCandidateStudents([])
      if (!value || !menteeScope.institutionId) return
      try {
        const rows = await lmsService.listProgrammes(menteeScope.institutionId, value)
        setMProgrammes(Array.isArray(rows) ? rows : [])
      } catch {
        setError('Failed to load mentee programmes')
      }
      return
    }

    if (key === 'programmeId') {
      setMenteeScope((p) => ({ ...p, programmeId: value, classId: '' }))
      setMClasses([])
      setCandidateStudents([])
      if (!value || !menteeScope.institutionId || !menteeScope.departmentId) return
      try {
        const rows = await lmsService.listClasses({
          institutionId: menteeScope.institutionId,
          departmentId: menteeScope.departmentId,
          programmeId: value,
        })
        setMClasses(Array.isArray(rows) ? rows : [])
      } catch {
        setError('Failed to load classes')
      }
      return
    }

    if (key === 'classId') {
      setMenteeScope((p) => ({ ...p, classId: value }))
      setCandidateStudents([])
    }
  }

  const loadClassStudents = async () => {
    if (!menteeScope.classId) return setError('Select class to load students')
    try {
      setLoading(true)
      setError('')
      const rows = await academicsService.listStudentsForMentee({}, menteeScope.classId)
      setCandidateStudents((Array.isArray(rows) ? rows : []).map((x) => ({ ...x, selected: false, baselineRisk: 'LOW' })))
    } catch (e) {
      const apiErr = e?.response?.data
      setError(
        apiErr?.error && apiErr?.details
          ? `${apiErr.error}: ${apiErr.details}`
          : apiErr?.error || apiErr?.details || e?.message || 'Failed to load class students',
      )
    } finally {
      setLoading(false)
    }
  }

  const saveSelectedStudentsAsMentees = async () => {
    const selected = candidateStudents.filter((x) => x.selected)
    if (!selected.length) return setError('Select at least one student')
    try {
      setSaving(true)
      setError('')
      await academicsService.createMenteesFromStudents({
        classId: menteeScope.classId,
        students: selected.map((s) => ({ studentId: s.studentId, baselineRisk: s.baselineRisk })),
      })
      setInfo('Selected class students added as mentees')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save selected students as mentees')
    } finally {
      setSaving(false)
    }
  }

  const addMentor = async () => {
    if (!mentorForm.facultyId) return
    try {
      setSaving(true)
      setError('')
      await academicsService.createMentor({
        facultyId: mentorForm.facultyId,
        maxMentees: Number(mentorForm.maxMentees) || 20,
      })
      setMentorForm((p) => ({ ...p, facultyId: '', maxMentees: 20 }))
      setInfo('Mentor added')
      await loadAll()
    } catch (e) {
      const apiErr = e?.response?.data
      setError(
        apiErr?.error && apiErr?.details
          ? `${apiErr.error}: ${apiErr.details}`
          : apiErr?.error || apiErr?.details || e?.message || 'Failed to add mentor',
      )
    } finally {
      setSaving(false)
    }
  }

  const assignMentor = async (menteeId, mentorId) => {
    if (!menteeId || !mentorId) return
    try {
      setSaving(true)
      setError('')
      await academicsService.assignMentor({ menteeId, mentorId })
      setAssignEditMode(false)
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to assign mentor')
    } finally {
      setSaving(false)
    }
  }

  const saveMeeting = async () => {
    if (!meetingForm.mentorId || !meetingForm.menteeId || !meetingForm.summary) return
    try {
      setSaving(true)
      setError('')
      await academicsService.createSession(meetingForm)
      setMeetingForm({
        mentorId: '',
        menteeId: '',
        issueType: 'ACADEMIC',
        summary: '',
        actionPlan: '',
        followUpDate: '',
        status: 'OPEN',
      })
      setInfo('Session saved')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save session')
    } finally {
      setSaving(false)
    }
  }

  const escalateMeeting = async (id, target) => {
    try {
      setSaving(true)
      setError('')
      await academicsService.escalateSession(id, target)
      setInfo(`Escalated to ${target}`)
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to escalate session')
    } finally {
      setSaving(false)
    }
  }

  const viewMeeting = () => {
    const row = meetings.find((x) => String(x.id) === String(selectedMeetingId))
    if (!row) return setError('Select a session log row to view')
    setMeetingForm((p) => ({
      ...p,
      mentorId: row.mentorId || '',
      menteeId: row.menteeId || '',
      issueType: row.issueType || 'ACADEMIC',
      summary: row.summary || '',
      actionPlan: row.actionPlan || '',
      followUpDate: row.followUpDate || '',
      status: row.status || 'OPEN',
    }))
    setInfo('Loaded selected session record into form')
  }

  const menteeCols = [
    { key: 'registerNo', label: 'Reg No' },
    { key: 'studentName', label: 'Student' },
    { key: 'className', label: 'Class' },
    { key: 'semester', label: 'Sem' },
    {
      key: 'baselineRisk',
      label: 'Risk',
      render: (r) => <CBadge color={r.baselineRisk === 'HIGH' ? 'danger' : r.baselineRisk === 'MEDIUM' ? 'warning' : 'success'}>{r.baselineRisk}</CBadge>,
    },
    { key: 'mentorName', label: 'Mentor', render: (r) => r.mentorName || '-' },
    {
      key: 'assign',
      label: 'Assign/Reassign',
      render: (r) => (
        <CFormSelect
          size="sm"
          value={r.mentorId || ''}
          disabled={!assignEditMode || String(selectedMenteeId) !== String(r.id)}
          onChange={(e) => assignMentor(r.id, e.target.value)}
        >
          <option value="">Select Mentor</option>
          {mentors.map((m) => (
            <option key={m.id} value={m.id}>
              {m.mentorCode} - {m.mentorName}
            </option>
          ))}
        </CFormSelect>
      ),
    },
  ]

  const meetingCols = [
    { key: 'createdOn', label: 'Date' },
    { key: 'mentorName', label: 'Mentor', render: (r) => `${r.mentorCode || ''} ${r.mentorName || mentorNameMap.get(r.mentorId) || '-'}` },
    { key: 'studentName', label: 'Mentee', render: (r) => `${r.registerNo || ''} ${r.studentName || menteeNameMap.get(r.menteeId) || '-'}` },
    { key: 'issueType', label: 'Issue' },
    { key: 'summary', label: 'Summary' },
    {
      key: 'status',
      label: 'Status',
      render: (r) => <CBadge color={r.status === 'CLOSED' ? 'success' : r.status === 'IN_PROGRESS' ? 'info' : 'warning'}>{r.status}</CBadge>,
    },
    { key: 'escalation', label: 'Escalation', render: (r) => (r.escalation === 'NONE' ? '-' : r.escalation) },
  ]

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Mentor-Mentee Lifecycle System (NAAC 2.3.2)</strong>
            <div className="d-flex gap-2">
              <ArpButton icon="reset" label="Load Data" color="primary" className="text-white" style={{ color: '#fff' }} onClick={loadAll} disabled={loading} />
              <CBadge color="danger">High Risk: {summary.highRisk || 0}</CBadge>
              <CBadge color="warning">Medium Risk: {summary.mediumRisk || 0}</CBadge>
              <CBadge color="success">Low Risk: {summary.lowRisk || 0}</CBadge>
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel>Department Filter</CFormLabel>
                <CFormSelect value={filters.department} onChange={(e) => setFilters((p) => ({ ...p, department: e.target.value }))}>
                  <option value="">All</option>
                  {departmentOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Semester Filter</CFormLabel>
                <CFormSelect value={filters.semester} onChange={(e) => setFilters((p) => ({ ...p, semester: e.target.value }))}>
                  <option value="">All</option>
                  {semesterOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}><CFormLabel>Risk Filter</CFormLabel><CFormSelect value={filters.risk} onChange={(e) => setFilters((p) => ({ ...p, risk: e.target.value }))}><option value="">All</option><option value="HIGH">HIGH</option><option value="MEDIUM">MEDIUM</option><option value="LOW">LOW</option></CFormSelect></CCol>
              <CCol md={3} className="d-flex align-items-end"><ArpButton icon="search" label="Apply Filters" color="info" className="text-white" style={{ color: '#fff' }} onClick={loadAll} disabled={loading} /></CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {error ? <CAlert color="danger">{error}</CAlert> : null}
        {info ? <CAlert color="info">{info}</CAlert> : null}

        <CCard className="mb-3">
          <CCardHeader><strong>1. Mentor Registry</strong></CCardHeader>
          <CCardBody>
            <CRow className="g-3 mb-3">
              <CCol md={2}><CFormLabel>Institution</CFormLabel><CFormSelect value={mentorForm.institutionId} onChange={onMentorScopeChange('institutionId')}><option value="">Select</option>{institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</CFormSelect></CCol>
              <CCol md={2}><CFormLabel>Department</CFormLabel><CFormSelect value={mentorForm.departmentId} onChange={onMentorScopeChange('departmentId')}><option value="">Select</option>{departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}</CFormSelect></CCol>
              <CCol md={2}><CFormLabel>Academic Year</CFormLabel><CFormSelect value={mentorForm.academicYearId} onChange={onMentorScopeChange('academicYearId')}><option value="">Select</option>{academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Faculty</CFormLabel><CFormSelect value={mentorForm.facultyId} onChange={onMentorScopeChange('facultyId')}><option value="">Select</option>{faculties.map((x) => <option key={x.id} value={x.id}>{x.facultyCode || x.id} - {x.facultyName || x.firstName || 'Faculty'}</option>)}</CFormSelect></CCol>
              <CCol md={2}><CFormLabel>Max Mentees</CFormLabel><CFormInput type="number" min={1} value={mentorForm.maxMentees} onChange={(e) => setMentorForm((p) => ({ ...p, maxMentees: e.target.value }))} /></CCol>
              <CCol md={1} className="d-flex align-items-end"><ArpIconButton icon="add" color="primary" title="Add Mentor" onClick={addMentor} disabled={saving} /></CCol>
            </CRow>
            <ArpDataTable
              title="Mentors"
              rows={mentors}
              rowKey="id"
              columns={[
                { key: 'mentorCode', label: 'Mentor Code' },
                { key: 'mentorName', label: 'Name' },
                { key: 'department', label: 'Department' },
                { key: 'maxMentees', label: 'Capacity' },
                { key: 'activeMentees', label: 'Assigned' },
              ]}
              pageSizeOptions={[5, 10]}
              defaultPageSize={5}
            />
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>2. Mentee Enrollment & Allocation</strong></CCardHeader>
          <CCardBody>
            <CRow className="g-3 mb-3">
              <CCol md={2}><CFormLabel>Institution</CFormLabel><CFormSelect value={menteeScope.institutionId} onChange={onMenteeScopeChange('institutionId')}><option value="">Select</option>{institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</CFormSelect></CCol>
              <CCol md={2}><CFormLabel>Department</CFormLabel><CFormSelect value={menteeScope.departmentId} onChange={onMenteeScopeChange('departmentId')}><option value="">Select</option>{mDepartments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}</CFormSelect></CCol>
              <CCol md={2}><CFormLabel>Programme</CFormLabel><CFormSelect value={menteeScope.programmeId} onChange={onMenteeScopeChange('programmeId')}><option value="">Select</option>{mProgrammes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode} - {x.programmeName}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Class</CFormLabel><CFormSelect value={menteeScope.classId} onChange={onMenteeScopeChange('classId')}><option value="">Select</option>{mClasses.map((x) => <option key={x.id} value={x.id}>{x.className} {x.classLabel ? `(${x.classLabel})` : ''}</option>)}</CFormSelect></CCol>
              <CCol md={5} className="d-flex align-items-end justify-content-end gap-2">
                <ArpButton icon="search" label="Load Class Students" color="info" className="text-white" style={{ color: '#fff' }} onClick={loadClassStudents} disabled={loading} />
                <ArpButton icon="add" label="Add Selected as Mentees" color="primary" className="text-white" style={{ color: '#fff' }} onClick={saveSelectedStudentsAsMentees} disabled={saving} />
              </CCol>
            </CRow>
            <ArpDataTable
              title="Class Students (Select to onboard as mentees)"
              rows={candidateStudents}
              rowKey="studentId"
              columns={[
                {
                  key: 'selected',
                  label: 'Select',
                  render: (r) => (
                    <input
                      type="checkbox"
                      checked={Boolean(r.selected)}
                      onChange={(e) =>
                        setCandidateStudents((p) =>
                          p.map((x) => (x.studentId === r.studentId ? { ...x, selected: e.target.checked } : x)),
                        )
                      }
                    />
                  ),
                },
                { key: 'registerNo', label: 'Reg No' },
                { key: 'studentName', label: 'Student' },
                { key: 'className', label: 'Class' },
                {
                  key: 'baselineRisk',
                  label: 'Risk',
                  render: (r) => (
                    <CFormSelect
                      size="sm"
                      value={r.baselineRisk || 'LOW'}
                      onChange={(e) =>
                        setCandidateStudents((p) =>
                          p.map((x) => (x.studentId === r.studentId ? { ...x, baselineRisk: e.target.value } : x)),
                        )
                      }
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </CFormSelect>
                  ),
                },
              ]}
              pageSizeOptions={[5, 10, 20]}
              defaultPageSize={10}
              searchable
            />
            <ArpDataTable
              title="Mentees"
              rows={mentees}
              rowKey="id"
              columns={menteeCols}
              pageSizeOptions={[5, 10, 20]}
              defaultPageSize={10}
              searchable
              headerActions={
                <ArpIconButton
                  icon="edit"
                  color="info"
                  title={assignEditMode ? 'Assignment Edit Enabled' : 'Enable Assign/Reassign Edit'}
                  onClick={() => {
                    if (!selectedMenteeId) return setError('Select a mentee row to edit assignment')
                    setAssignEditMode((p) => !p)
                  }}
                  disabled={saving || !selectedMenteeId}
                />
              }
              selection={{
                type: 'radio',
                selected: selectedMenteeId,
                onChange: (id) => {
                  setSelectedMenteeId(id)
                  setAssignEditMode(false)
                },
                key: 'id',
                headerLabel: 'Select',
                width: 70,
                name: 'menteeSelect',
              }}
            />
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>3. Session, Intervention & Escalation</strong></CCardHeader>
          <CCardBody>
            <CRow className="g-3 mb-3">
              <CCol md={2}><CFormLabel>Mentor</CFormLabel><CFormSelect value={meetingForm.mentorId} onChange={(e) => setMeetingForm((p) => ({ ...p, mentorId: e.target.value, menteeId: '' }))}><option value="">Select</option>{mentors.map((m) => <option key={m.id} value={m.id}>{m.mentorCode} - {m.mentorName}</option>)}</CFormSelect></CCol>
              <CCol md={2}><CFormLabel>Mentee</CFormLabel><CFormSelect value={meetingForm.menteeId} onChange={(e) => setMeetingForm((p) => ({ ...p, menteeId: e.target.value }))}><option value="">{meetingForm.mentorId ? 'Select' : 'Select Mentor First'}</option>{sessionMentees.map((m) => <option key={m.id} value={m.id}>{m.registerNo} - {m.studentName}</option>)}</CFormSelect></CCol>
              <CCol md={2}><CFormLabel>Issue</CFormLabel><CFormSelect value={meetingForm.issueType} onChange={(e) => setMeetingForm((p) => ({ ...p, issueType: e.target.value }))}>{issueOptions.map((x) => <option key={x}>{x}</option>)}</CFormSelect></CCol>
              <CCol md={2}><CFormLabel>Status</CFormLabel><CFormSelect value={meetingForm.status} onChange={(e) => setMeetingForm((p) => ({ ...p, status: e.target.value }))}>{statusOptions.map((x) => <option key={x}>{x}</option>)}</CFormSelect></CCol>
              <CCol md={2}><CFormLabel>Follow-up Date</CFormLabel><CFormInput type="date" value={meetingForm.followUpDate} onChange={(e) => setMeetingForm((p) => ({ ...p, followUpDate: e.target.value }))} /></CCol>
              <CCol md={6}><CFormLabel>Session Summary</CFormLabel><CFormInput value={meetingForm.summary} onChange={(e) => setMeetingForm((p) => ({ ...p, summary: e.target.value }))} /></CCol>
              <CCol md={6}><CFormLabel>Action Plan / Intervention</CFormLabel><CFormInput value={meetingForm.actionPlan} onChange={(e) => setMeetingForm((p) => ({ ...p, actionPlan: e.target.value }))} /></CCol>
              <CCol md={12} className="text-end"><ArpButton icon="save" label="Save Session" color="primary" className="text-white" style={{ color: '#fff' }} onClick={saveMeeting} disabled={saving} /></CCol>
            </CRow>
            <ArpDataTable
              title="Mentor Session Log"
              rows={meetings}
              rowKey="id"
              columns={meetingCols}
              pageSizeOptions={[5, 10, 20]}
              defaultPageSize={10}
              searchable
              headerActions={
                <div className="d-flex gap-2">
                  <ArpIconButton
                    icon="view"
                    color="primary"
                    title="View Session"
                    onClick={viewMeeting}
                    disabled={saving || !selectedMeetingId}
                  />
                  <ArpIconButton
                    icon="upload"
                    color="warning"
                    title="Escalate to Counselor"
                    onClick={() => selectedMeetingId && escalateMeeting(selectedMeetingId, 'COUNSELOR')}
                    disabled={saving || !selectedMeetingId}
                  />
                  <ArpIconButton
                    icon="chart"
                    color="danger"
                    title="Escalate to HoD"
                    onClick={() => selectedMeetingId && escalateMeeting(selectedMeetingId, 'HOD')}
                    disabled={saving || !selectedMeetingId}
                  />
                </div>
              }
              selection={{
                type: 'radio',
                selected: selectedMeetingId,
                onChange: setSelectedMeetingId,
                key: 'id',
                headerLabel: 'Select',
                width: 70,
                name: 'mentorSessionSelect',
              }}
            />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default MentorMenteeLifecycle
