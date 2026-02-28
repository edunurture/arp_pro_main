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
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CProgress,
  CProgressBar,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'
import { ArpButton, ArpDataTable } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear, semesterPatternFromSemester } from '../../services/lmsService'

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
  fromDate: '',
  toDate: '',
}

const statusColor = (status) => {
  const s = String(status || '').toUpperCase()
  if (s === 'COMPLETED') return 'success'
  if (s === 'ON TRACK') return 'info'
  if (s === 'DELAYED') return 'warning'
  if (s === 'CRITICAL') return 'danger'
  if (s === 'IN PROGRESS') return 'warning'
  if (s === 'PENDING') return 'secondary'
  return 'light'
}

const progressColor = (value) => {
  if (value >= 100) return 'success'
  if (value > 0) return 'warning'
  return 'secondary'
}

const SyllabusCompletion = () => {
  const [form, setForm] = useState(initialForm)
  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [faculties, setFaculties] = useState([])

  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [summaryRows, setSummaryRows] = useState([])
  const [summaryMeta, setSummaryMeta] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    pendingCourses: 0,
    totalPlannedHours: 0,
    totalCompletedHours: 0,
    totalBacklogHours: 0,
    overallCompletionPercent: 0,
  })

  const [selectedCourseOfferingId, setSelectedCourseOfferingId] = useState('')
  const [sessionRows, setSessionRows] = useState([])
  const [sessionMeta, setSessionMeta] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    completionPercent: 0,
  })
  const [selectedSessionKeys, setSelectedSessionKeys] = useState(() => new Set())
  const [deviationReason, setDeviationReason] = useState('LEAVE')
  const [deviationRemarks, setDeviationRemarks] = useState('')
  const [recoveryForm, setRecoveryForm] = useState({
    sessionDate: todayIso(),
    sessionHours: '1.00',
    lectureTopic: '',
    remarks: '',
  })

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
  const selectedSemesterPattern = useMemo(
    () => String(semesterPatternFromSemester(form.semester) || '').toUpperCase(),
    [form.semester],
  )
  const filteredAcademicYears = useMemo(() => {
    if (!selectedSemesterPattern) return academicYears
    return academicYears.filter((x) => {
      const cat = String(x?.semesterCategory || '').toUpperCase().trim()
      if (!cat) return true
      return cat === selectedSemesterPattern
    })
  }, [academicYears, selectedSemesterPattern])
  const semesterParityMismatch = useMemo(() => {
    if (!selectedAcademicYear || !selectedSemesterPattern) return false
    const cat = String(selectedAcademicYear?.semesterCategory || '').toUpperCase().trim()
    if (!cat) return false
    return cat !== selectedSemesterPattern
  }, [selectedAcademicYear, selectedSemesterPattern])
  const semesterOptions = useMemo(() => semesterOptionsFromAcademicYear(selectedAcademicYear), [selectedAcademicYear])
  const selectedCourse = useMemo(
    () => summaryRows.find((x) => String(x.courseOfferingId) === String(selectedCourseOfferingId)) || null,
    [summaryRows, selectedCourseOfferingId],
  )

  React.useEffect(() => {
    ;(async () => {
      try {
        setInstitutions(await lmsService.listInstitutions())
      } catch {
        setError('Failed to load institutions')
      }
    })()
  }, [])

  const resetGridState = () => {
    setSummaryRows([])
    setSummaryMeta({
      totalCourses: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      pendingCourses: 0,
      totalPlannedHours: 0,
      totalCompletedHours: 0,
      totalBacklogHours: 0,
      overallCompletionPercent: 0,
    })
    setSelectedCourseOfferingId('')
    setSessionRows([])
    setSessionMeta({
      total: 0,
      completed: 0,
      pending: 0,
      completionPercent: 0,
    })
    setSelectedSessionKeys(new Set())
  }

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
      resetGridState()
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
      resetGridState()
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
      resetGridState()
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
      resetGridState()
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

    if (key === 'semester') {
      setForm((p) => {
        const next = { ...p, semester: value }
        const expected = String(semesterPatternFromSemester(value) || '').toUpperCase()
        const selectedAy = academicYears.find((x) => String(x.id) === String(p.academicYearId)) || null
        const ayCat = String(selectedAy?.semesterCategory || '').toUpperCase().trim()
        if (selectedAy && expected && ayCat && ayCat !== expected) {
          next.academicYearId = ''
          next.facultyId = ''
          setFaculties([])
          resetGridState()
          setInfo(`Academic Year reset. Semester ${value} requires ${expected} category Academic Year.`)
        }
        return next
      })
      return
    }
    setForm((p) => ({ ...p, [key]: value }))
    if (key !== 'fromDate' && key !== 'toDate') resetGridState()
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
    if (semesterParityMismatch) {
      setError(
        `Selected Academic Year category does not match Semester parity. Choose ${
          selectedSemesterPattern || '-'
        } category Academic Year.`,
      )
      return false
    }
    if ((form.fromDate && !form.toDate) || (!form.fromDate && form.toDate)) {
      setError('Choose both From and To date for range filter')
      return false
    }
    if (form.fromDate && form.toDate && form.fromDate > form.toDate) {
      setError('From Date should be before or equal to To Date')
      return false
    }
    return true
  }

  const loadSummary = async () => {
    if (!validateScope()) return false
    try {
      setLoadingSummary(true)
      setError('')
      const res = await lmsService.getSyllabusCompletionSummary(scope, {
        facultyId: form.facultyId,
        ...(form.fromDate && form.toDate ? { fromDate: form.fromDate, toDate: form.toDate } : {}),
      })
      const rows = Array.isArray(res?.data) ? res.data : []
      setSummaryRows(rows)
      setSummaryMeta({
        totalCourses: Number(res?.meta?.totalCourses || 0),
        completedCourses: Number(res?.meta?.completedCourses || 0),
        inProgressCourses: Number(res?.meta?.inProgressCourses || 0),
        pendingCourses: Number(res?.meta?.pendingCourses || 0),
        totalPlannedHours: Number(res?.meta?.totalPlannedHours || 0),
        totalCompletedHours: Number(res?.meta?.totalCompletedHours || 0),
        totalBacklogHours: Number(res?.meta?.totalBacklogHours || 0),
        overallCompletionPercent: Number(res?.meta?.overallCompletionPercent || 0),
      })
      if (!rows.length) {
        let scopeHint = ''
        try {
          const scopes = await lmsService.getFacultyLectureScopes({
            institutionId: form.institutionId,
            academicYearId: form.academicYearId,
            facultyId: form.facultyId,
          })
          const list = Array.isArray(scopes) ? scopes : []
          if (list.length) {
            const exact = list.find(
              (x) =>
                String(x?.programmeId || '') === String(form.programmeId || '') &&
                String(x?.regulationId || '') === String(form.regulationId || '') &&
                String(x?.batchId || '') === String(form.batchId || '') &&
                String(x?.semester || '') === String(form.semester || ''),
            )
            if (!exact) {
              const labels = list
                .slice(0, 4)
                .map((x) => `${x?.programmeCode || '-'} | ${x?.regulationCode || '-'} | Sem-${x?.semester || '-'} | ${x?.batchName || '-'}`)
                .join(' ; ')
              scopeHint = ` Available scopes for this faculty/year: ${labels}${list.length > 4 ? ' ...' : ''}`
            }
          }
        } catch {
          // Ignore hint failures; base message still shown.
        }
        setInfo(`No syllabus sessions found for selected scope.${scopeHint}`)
      }
      return true
    } catch (err) {
      setSummaryRows([])
      setSummaryMeta({
        totalCourses: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        pendingCourses: 0,
        totalPlannedHours: 0,
        totalCompletedHours: 0,
        totalBacklogHours: 0,
        overallCompletionPercent: 0,
      })
      setError(err?.response?.data?.error || 'Failed to load syllabus completion summary')
      return false
    } finally {
      setLoadingSummary(false)
    }
  }

  const loadSessions = async (courseOfferingId) => {
    if (!courseOfferingId) return
    try {
      setLoadingSessions(true)
      setError('')
      const res = await lmsService.getSyllabusCompletionSessions(courseOfferingId, scope, {
        facultyId: form.facultyId,
        ...(form.fromDate && form.toDate ? { fromDate: form.fromDate, toDate: form.toDate } : {}),
      })
      const rows = Array.isArray(res?.data) ? res.data : []
      setSessionRows(rows)
      setSessionMeta({
        total: Number(res?.meta?.total || 0),
        completed: Number(res?.meta?.completed || 0),
        pending: Number(res?.meta?.pending || 0),
        completionPercent: Number(res?.meta?.completionPercent || 0),
      })
      setSelectedSessionKeys(new Set(rows.filter((x) => x.teachingStatus === 'COMPLETED').map((x) => x.key)))
    } catch (err) {
      setSessionRows([])
      setSessionMeta({
        total: 0,
        completed: 0,
        pending: 0,
        completionPercent: 0,
      })
      setSelectedSessionKeys(new Set())
      setError(err?.response?.data?.error || 'Failed to load session tracker')
    } finally {
      setLoadingSessions(false)
    }
  }

  const onSearch = async (e) => {
    e?.preventDefault?.()
    setInfo('')
    setSelectedCourseOfferingId('')
    setSessionRows([])
    setSelectedSessionKeys(new Set())
    await loadSummary()
  }

  const onViewSessions = async () => {
    if (!selectedCourseOfferingId) {
      setError('Select a course from summary table')
      return
    }
    await loadSessions(selectedCourseOfferingId)
  }

  const onToggleSession = (rowKey) => {
    setSelectedSessionKeys((prev) => {
      const next = new Set(prev)
      if (next.has(rowKey)) next.delete(rowKey)
      else next.add(rowKey)
      return next
    })
  }

  const onToggleAll = () => {
    setSelectedSessionKeys((prev) => {
      if (prev.size === sessionRows.length) return new Set()
      return new Set(sessionRows.map((x) => x.key))
    })
  }

  const applyCompletionStatus = async (markCompleted) => {
    if (!selectedCourseOfferingId) {
      setError('Select a course from summary table')
      return
    }
    const selected = sessionRows.filter((x) => selectedSessionKeys.has(x.key))
    if (!selected.length) {
      setError('Select at least one session row')
      return
    }
    if (!markCompleted) {
      const reason = String(deviationReason || '').trim()
      const remarks = String(deviationRemarks || '').trim()
      if (!reason) {
        setError('Deviation reason is required when marking pending')
        return
      }
      if (reason === 'OTHER' && !remarks) {
        setError('Remarks are required when deviation reason is Other')
        return
      }
    }

    try {
      setSaving(true)
      setError('')
      setInfo('')
      await Promise.all(
        selected.map((row) =>
          lmsService.upsertLectureSession(row.entryId, scope, {
            facultyId: form.facultyId,
            date: row.sessionDate || todayIso(),
            teachingStatus: markCompleted ? 'COMPLETED' : 'NOT_COMPLETED',
            attendanceStatus: 'NOT_TAKEN',
            actualLectureTitle: markCompleted
              ? String(row.lectureTopic || row.scheduledTopic || selectedCourse?.courseTitle || 'Lecture').slice(0, 200)
              : '',
            lectureAidsUsed: markCompleted ? 'Board / Presentation' : '',
            lectureReferences: '',
            deviationReason: markCompleted ? '' : deviationReason,
            deviationRemarks: markCompleted ? '' : deviationRemarks,
          }),
        ),
      )
      setInfo(markCompleted ? 'Selected sessions marked as completed' : 'Selected sessions reset to pending')
      await Promise.all([loadSummary(), loadSessions(selectedCourseOfferingId)])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update selected sessions')
    } finally {
      setSaving(false)
    }
  }

  const onAddRecoverySession = async () => {
    if (!selectedCourseOfferingId) {
      setError('Select a course from summary table')
      return
    }
    const sessionDate = String(recoveryForm.sessionDate || '').trim()
    const sessionHours = Number(recoveryForm.sessionHours)
    const lectureTopic = String(recoveryForm.lectureTopic || '').trim()
    const remarks = String(recoveryForm.remarks || '').trim()

    if (!sessionDate) {
      setError('Recovery date is required')
      return
    }
    if (!Number.isFinite(sessionHours) || sessionHours <= 0 || sessionHours > 8) {
      setError('Recovery hours must be between 0.01 and 8')
      return
    }
    if (!lectureTopic) {
      setError('Recovery topic is required')
      return
    }

    try {
      setSaving(true)
      setError('')
      setInfo('')
      await lmsService.createSyllabusRecoverySession(selectedCourseOfferingId, scope, {
        facultyId: form.facultyId,
        sessionDate,
        sessionHours,
        lectureTopic,
        deviationRemarks: remarks,
      })
      setInfo('Recovery class added and counted in completion')
      setRecoveryForm((p) => ({ ...p, lectureTopic: '', remarks: '' }))
      await Promise.all([loadSummary(), loadSessions(selectedCourseOfferingId)])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to add recovery class')
    } finally {
      setSaving(false)
    }
  }

  const isAllSelected = sessionRows.length > 0 && selectedSessionKeys.size === sessionRows.length

  return (
    <CRow className="syllabus-completion-page">
      <CCol xs={12}>
        <style>
          {`
            .syllabus-completion-page .syllabus-hero {
              border: 0;
              background:
                radial-gradient(1200px 380px at 5% -10%, rgba(32, 201, 151, 0.18), transparent 45%),
                radial-gradient(1000px 340px at 100% 0%, rgba(13, 110, 253, 0.15), transparent 42%),
                linear-gradient(120deg, #0f172a, #111827 55%, #1f2937);
              color: #f8fafc;
            }
            .syllabus-completion-page .metric-card {
              border: 0;
              box-shadow: 0 8px 24px rgba(17, 24, 39, 0.08);
            }
            .syllabus-completion-page .metric-value {
              font-size: 1.45rem;
              font-weight: 700;
              line-height: 1;
            }
            .syllabus-completion-page .metric-label {
              color: #6b7280;
              font-size: 0.76rem;
              text-transform: uppercase;
              letter-spacing: 0.03em;
            }
            .syllabus-completion-page .summary-table tbody tr {
              transition: background-color 0.2s ease;
            }
            .syllabus-completion-page .summary-table tbody tr:hover {
              background-color: #f8fafc;
            }
            .syllabus-completion-page .summary-table tbody tr.active {
              box-shadow: inset 3px 0 0 #0d6efd;
              background-color: #eff6ff;
            }
          `}
        </style>

        <CCard className="syllabus-hero mb-3">
          <CCardBody>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h4 className="mb-1">Syllabus Completion</h4>
                <div className="text-medium-emphasis">
                  Professionally computed from course plan hours and completed lecture sessions.
                </div>
              </div>
              <div>
                <CBadge color="light" textColor="dark">
                  Overall Progress: {summaryMeta.overallCompletionPercent.toFixed(2)}%
                </CBadge>
              </div>
            </div>
          </CCardBody>
        </CCard>

        {error ? <CAlert color="danger">{error}</CAlert> : null}
        {info ? <CAlert color="success">{info}</CAlert> : null}
        {semesterParityMismatch ? (
          <CAlert color="warning">
            Academic Year category mismatch. Selected semester belongs to <strong>{selectedSemesterPattern}</strong> pattern,
            but chosen Academic Year is <strong>{String(selectedAcademicYear?.semesterCategory || '-')}</strong>.
          </CAlert>
        ) : null}

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Scope and Filters</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSearch}>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Institution</CFormLabel>
                  <CFormSelect value={form.institutionId} onChange={onChange('institutionId')}>
                    <option value="">Select</option>
                    {institutions.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Department</CFormLabel>
                  <CFormSelect value={form.departmentId} onChange={onChange('departmentId')}>
                    <option value="">Select</option>
                    {departments.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.departmentName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Programme</CFormLabel>
                  <CFormSelect value={form.programmeId} onChange={onChange('programmeId')}>
                    <option value="">Select</option>
                    {programmes.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.programmeCode} - {x.programmeName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Regulation</CFormLabel>
                  <CFormSelect value={form.regulationId} onChange={onChange('regulationId')}>
                    <option value="">Select</option>
                    {regulations.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.regulationCode}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                  <CFormSelect value={form.academicYearId} onChange={onChange('academicYearId')}>
                    <option value="">Select</option>
                    {filteredAcademicYears.map((x) => {
                      const base = String(x.academicYearLabel || x.academicYear || '').trim()
                      const cat = String(x?.semesterCategory || '').toUpperCase().trim()
                      const withCat = cat && !base.toUpperCase().includes(`(${cat})`) ? `${base} (${cat})` : base
                      return (
                        <option key={x.id} value={x.id}>
                          {withCat}
                        </option>
                      )
                    })}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Batch</CFormLabel>
                  <CFormSelect value={form.batchId} onChange={onChange('batchId')}>
                    <option value="">Select</option>
                    {batches.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.batchName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Semester</CFormLabel>
                  <CFormSelect value={form.semester} onChange={onChange('semester')}>
                    <option value="">Select</option>
                    {semesterOptions.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Faculty</CFormLabel>
                  <CFormSelect value={form.facultyId} onChange={onChange('facultyId')}>
                    <option value="">Select</option>
                    {faculties.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.facultyCode} - {x.facultyName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>From Date (Optional)</CFormLabel>
                  <CFormInput type="date" value={form.fromDate} onChange={onChange('fromDate')} max={todayIso()} />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>To Date (Optional)</CFormLabel>
                  <CFormInput type="date" value={form.toDate} onChange={onChange('toDate')} max={todayIso()} />
                </CCol>
              </CRow>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <ArpButton label="Search" icon="search" color="info" onClick={onSearch} />
                <ArpButton
                  label="Clear"
                  icon="cancel"
                  color="secondary"
                  onClick={() => {
                    setForm(initialForm)
                    setDepartments([])
                    setProgrammes([])
                    setRegulations([])
                    setAcademicYears([])
                    setBatches([])
                    setFaculties([])
                    resetGridState()
                    setError('')
                    setInfo('')
                  }}
                />
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        <CRow className="g-3 mb-3">
          <CCol md={3}>
            <CCard className="metric-card">
              <CCardBody>
                <div className="metric-label">Total Courses</div>
                <div className="metric-value">{summaryMeta.totalCourses}</div>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={3}>
            <CCard className="metric-card">
              <CCardBody>
                <div className="metric-label">Completed</div>
                <div className="metric-value text-success">{summaryMeta.completedCourses}</div>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={3}>
            <CCard className="metric-card">
              <CCardBody>
                <div className="metric-label">In Progress</div>
                <div className="metric-value text-warning">{summaryMeta.inProgressCourses}</div>
              </CCardBody>
            </CCard>
          </CCol>
          <CCol md={3}>
            <CCard className="metric-card">
              <CCardBody>
                <div className="metric-label">Backlog Hours</div>
                <div className="metric-value text-danger">{summaryMeta.totalBacklogHours.toFixed(2)}</div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Syllabus Completion Details</strong>
            <div className="d-flex gap-2">
              <ArpButton
                label="View Sessions"
                icon="view"
                color="info"
                onClick={onViewSessions}
                disabled={!selectedCourseOfferingId || loadingSessions}
              />
            </div>
          </CCardHeader>
          <CCardBody>
            <ArpDataTable
              className="summary-table"
              title="Syllabus Completion Details"
              rows={summaryRows}
              rowKey="courseOfferingId"
              loading={loadingSummary}
              columns={[
                {
                  key: 'course',
                  label: 'Course',
                  sortable: true,
                  render: (r) => (
                    <>
                      <div className="fw-semibold">{r.courseCode || '-'}</div>
                      <div className="text-medium-emphasis small">{r.courseTitle || '-'}</div>
                      <div className="text-medium-emphasis small">
                        {r.className || '-'} {r.classLabel ? `(${r.classLabel})` : ''}
                      </div>
                    </>
                  ),
                },
                { key: 'plannedHours', label: 'Plan Total', sortable: true, sortType: 'number', render: (r) => Number(r.plannedHours || 0).toFixed(2) },
                { key: 'plannedTillDate', label: 'Planned Till Date', sortable: true, sortType: 'number', render: (r) => Number(r.plannedTillDate || 0).toFixed(2) },
                { key: 'completedTillDate', label: 'Completed Till Date', sortable: true, sortType: 'number', render: (r) => Number(r.completedTillDate || 0).toFixed(2) },
                {
                  key: 'backlogHours',
                  label: 'Backlog',
                  sortable: true,
                  sortType: 'number',
                  render: (r) => (
                    <span className={Number(r.backlogHours || 0) > 0 ? 'text-danger fw-semibold' : ''}>
                      {Number(r.backlogHours || 0).toFixed(2)}
                    </span>
                  ),
                },
                { key: 'recoveryHoursPerWeek', label: 'Recovery/Wk', sortable: true, sortType: 'number', render: (r) => Number(r.recoveryHoursPerWeek || 0).toFixed(2) },
                {
                  key: 'sessions',
                  label: 'Sessions',
                  sortable: false,
                  render: (r) => `${Number(r.completedSessions || 0)} / ${Number(r.plannedSessions || 0)}`,
                },
                {
                  key: 'completion',
                  label: 'Completion',
                  sortable: true,
                  sortType: 'number',
                  render: (r) => (
                    <>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>{Number(r.completionPercent || 0).toFixed(2)}%</span>
                        <span className="text-medium-emphasis">{r.latestCompletionDate || '-'}</span>
                      </div>
                      <CProgress height={10}>
                        <CProgressBar value={Number(r.completionPercent || 0)} color={progressColor(Number(r.completionPercent || 0))} />
                      </CProgress>
                    </>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  sortable: true,
                  render: (r) => <CBadge color={statusColor(r.status)}>{r.status}</CBadge>,
                },
              ]}
              selection={{
                type: 'radio',
                selected: selectedCourseOfferingId,
                key: 'courseOfferingId',
                name: 'selected-course',
                onChange: (value) => {
                  setSelectedCourseOfferingId(value)
                  loadSessions(value)
                },
              }}
              emptyText="No records"
            />
          </CCardBody>
        </CCard>

        {selectedCourse ? (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>
                Session Tracker: {selectedCourse.courseCode} - {selectedCourse.courseTitle}
              </strong>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <CFormSelect
                  value={deviationReason}
                  onChange={(e) => setDeviationReason(e.target.value)}
                  style={{ width: 170 }}
                  disabled={saving}
                >
                  <option value="LEAVE">Leave</option>
                  <option value="ON_DUTY">On Duty</option>
                  <option value="EXAM_DUTY">Exam Duty</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="OTHER">Other</option>
                </CFormSelect>
                <CFormInput
                  value={deviationRemarks}
                  onChange={(e) => setDeviationRemarks(e.target.value)}
                  placeholder="Deviation remarks (optional)"
                  style={{ width: 220 }}
                  disabled={saving}
                />
                <CButton color="success" disabled={!selectedSessionKeys.size || saving} onClick={() => applyCompletionStatus(true)}>
                  Mark Completed
                </CButton>
                <CButton color="secondary" disabled={!selectedSessionKeys.size || saving} onClick={() => applyCompletionStatus(false)}>
                  Reset Pending
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              <CRow className="g-2 mb-3">
                <CCol md={3}>
                  <CFormLabel className="mb-1">Special Class Date</CFormLabel>
                  <CFormInput
                    type="date"
                    value={recoveryForm.sessionDate}
                    onChange={(e) => setRecoveryForm((p) => ({ ...p, sessionDate: e.target.value }))}
                    max={todayIso()}
                    disabled={saving}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel className="mb-1">Hours</CFormLabel>
                  <CFormInput
                    type="number"
                    min={0.25}
                    max={8}
                    step={0.25}
                    value={recoveryForm.sessionHours}
                    onChange={(e) => setRecoveryForm((p) => ({ ...p, sessionHours: e.target.value }))}
                    disabled={saving}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel className="mb-1">Recovery Topic</CFormLabel>
                  <CFormInput
                    value={recoveryForm.lectureTopic}
                    onChange={(e) => setRecoveryForm((p) => ({ ...p, lectureTopic: e.target.value }))}
                    placeholder="Special class topic covered"
                    disabled={saving}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel className="mb-1">Remarks</CFormLabel>
                  <CFormInput
                    value={recoveryForm.remarks}
                    onChange={(e) => setRecoveryForm((p) => ({ ...p, remarks: e.target.value }))}
                    placeholder="Optional notes"
                    disabled={saving}
                  />
                </CCol>
                <CCol xs={12} className="d-flex justify-content-end">
                  <CButton color="primary" disabled={saving} onClick={onAddRecoverySession}>
                    Add Special Class
                  </CButton>
                </CCol>
              </CRow>

              <div className="d-flex flex-wrap gap-3 mb-3">
                <CBadge color="info">Total: {sessionMeta.total}</CBadge>
                <CBadge color="success">Completed: {sessionMeta.completed}</CBadge>
                <CBadge color="secondary">Pending: {sessionMeta.pending}</CBadge>
                <CBadge color="dark">Completion: {sessionMeta.completionPercent.toFixed(2)}%</CBadge>
              </div>

              {loadingSessions ? (
                <div className="text-center py-4">
                  <CSpinner />
                </div>
              ) : (
                <CTable bordered hover responsive align="middle">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 56 }}>
                        <CFormCheck checked={isAllSelected} onChange={onToggleAll} />
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 130 }}>Date</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 100 }}>Day Order</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 140 }}>Hour</CTableHeaderCell>
                      <CTableHeaderCell>Planned Topic</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 130 }}>Status</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 130 }}>Deviation</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 180 }}>Remarks</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 140 }}>Completion Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {!sessionRows.length ? (
                      <CTableRow>
                        <CTableDataCell colSpan={9} className="text-center text-medium-emphasis py-4">
                          No sessions found
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      sessionRows.map((r) => (
                        <CTableRow key={r.key}>
                          <CTableDataCell>
                            <CFormCheck
                              checked={selectedSessionKeys.has(r.key)}
                              onChange={() => onToggleSession(r.key)}
                            />
                          </CTableDataCell>
                          <CTableDataCell>{r.sessionDate || '-'}</CTableDataCell>
                          <CTableDataCell>{r.dayOrder || '-'}</CTableDataCell>
                          <CTableDataCell>
                            {r.isRecovery ? 'Recovery' : r.hourLabel ? `Hour ${r.hourLabel}` : '-'} ({r.timeFrom || '-'} -{' '}
                            {r.timeTo || '-'}) {r.sessionHours ? `[${Number(r.sessionHours).toFixed(2)}h]` : ''}
                          </CTableDataCell>
                          <CTableDataCell>
                            <div>{r.lectureTopic || r.scheduledTopic || '-'}</div>
                            {r.isRecovery ? <CBadge color="primary">Recovery</CBadge> : null}
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={r.teachingStatus === 'COMPLETED' ? 'success' : 'secondary'}>
                              {r.teachingStatus === 'COMPLETED' ? 'Completed' : 'Pending'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>{r.deviationReason || '-'}</CTableDataCell>
                          <CTableDataCell>{r.deviationRemarks || '-'}</CTableDataCell>
                          <CTableDataCell>{r.completionDate || '-'}</CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        ) : null}
      </CCol>
    </CRow>
  )
}

export default SyllabusCompletion
