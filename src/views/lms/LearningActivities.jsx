
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
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
} from '@coreui/react-pro'
import { ArpButton, ArpDataTable, ArpIconButton } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'

const todayIso = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const initialScope = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
}
const initialConvert = {
  sessionDate: todayIso(),
  facultyId: '',
  activityCategoryId: '',
  classTimetableEntryId: '',
  title: '',
  description: '',
  remarks: '',
  learningMethodType: '',
  ictTools: '',
  onlineResourceLinks: '',
  studentCountPlanned: '',
  studentCountParticipated: '',
  learningOutcome: '',
  impactSummary: '',
}
const initialEdit = {
  id: '',
  activityCategoryId: '',
  title: '',
  description: '',
  remarks: '',
  status: 'true',
  learningMethodType: '',
  ictTools: '',
  onlineResourceLinks: '',
  studentCountPlanned: '',
  studentCountParticipated: '',
  learningOutcome: '',
  impactSummary: '',
  naacReady: 'false',
}
const initialEvidenceForm = {
  evidenceType: 'DOCUMENT',
  externalLink: '',
  remarks: '',
  file: null,
}
const sourceBadge = (src) => (String(src || '').toUpperCase() === 'SPECIAL_HOUR' ? 'info' : 'primary')
const methodLabel = (v) =>
  ({
    EXPERIENTIAL: 'Experiential',
    PARTICIPATIVE: 'Participative',
    PROBLEM_SOLVING: 'Problem Solving',
    BLENDED: 'Blended',
  }[String(v || '').toUpperCase()] || '-')
const toNumberOrUndefined = (v) => {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

const LearningActivities = () => {
  const [scope, setScope] = useState(initialScope)
  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [faculties, setFaculties] = useState([])
  const [categories, setCategories] = useState([])
  const [lectureSlots, setLectureSlots] = useState([])
  const [activities, setActivities] = useState([])
  const [convertForm, setConvertForm] = useState(initialConvert)
  const [editForm, setEditForm] = useState(initialEdit)
  const [selectedActivityId, setSelectedActivityId] = useState(null)
  const [evidences, setEvidences] = useState([])
  const [evidenceForm, setEvidenceForm] = useState(initialEvidenceForm)
  const [naacReport, setNaacReport] = useState(null)
  const [editReadOnly, setEditReadOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [editOpen, setEditOpen] = useState(false)

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(scope.academicYearId)) || null,
    [academicYears, scope.academicYearId],
  )
  const semesterOptions = useMemo(() => semesterOptionsFromAcademicYear(selectedAcademicYear), [selectedAcademicYear])
  const scopeReady = useMemo(
    () =>
      Boolean(
        scope.institutionId &&
          scope.departmentId &&
          scope.programmeId &&
          scope.regulationId &&
          scope.academicYearId &&
          scope.batchId &&
          scope.semester,
      ),
    [scope],
  )
  const canLoadLectureSlots = useMemo(
    () => Boolean(scopeReady && convertForm.facultyId && convertForm.sessionDate),
    [scopeReady, convertForm.facultyId, convertForm.sessionDate],
  )
  const selectedActivity = useMemo(
    () => activities.find((x) => String(x.id) === String(selectedActivityId)) || null,
    [activities, selectedActivityId],
  )

  React.useEffect(() => {
    ;(async () => {
      try {
        const [ins, cats] = await Promise.all([lmsService.listInstitutions(), lmsService.listActivityCategories()])
        setInstitutions(ins)
        setCategories(cats)
      } catch {
        setError('Failed to load initial activities configuration')
      }
    })()
  }, [])

  const validScope = () => {
    if (!scope.institutionId || !scope.departmentId || !scope.programmeId || !scope.regulationId) {
      setError('Select Institution, Department, Programme and Regulation')
      return false
    }
    if (!scope.academicYearId || !scope.batchId || !scope.semester) {
      setError('Select Academic Year, Batch and Semester')
      return false
    }
    return true
  }

  const reloadActivities = async () => {
    if (!validScope()) return
    setLoading(true)
    try {
      const rows = await lmsService.listActivities(scope, { facultyId: convertForm.facultyId || undefined })
      setActivities(Array.isArray(rows) ? rows : [])
      setSelectedActivityId(null)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load activities')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const loadNaacReport = async () => {
    if (!validScope()) return
    try {
      const report = await lmsService.getActivityNaac231Report(scope, {
        facultyId: convertForm.facultyId || undefined,
      })
      setNaacReport(report || null)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load NAAC 2.3.1 report')
      setNaacReport(null)
    }
  }

  const loadLectureSlots = async (sessionDate = convertForm.sessionDate, facultyId = convertForm.facultyId) => {
    if (!validScope()) return
    if (!sessionDate || !facultyId) return
    try {
      const rows = await lmsService.listActivityLectureSlots(scope, { sessionDate, facultyId })
      setLectureSlots(Array.isArray(rows) ? rows : [])
    } catch {
      setLectureSlots([])
      setError('Failed to load lecture slots')
    }
  }

  const loadEvidences = async (activityId) => {
    if (!activityId || !validScope()) return
    try {
      const rows = await lmsService.listActivityEvidences(activityId, scope)
      setEvidences(Array.isArray(rows) ? rows : [])
    } catch {
      setEvidences([])
      setError('Failed to load evidences')
    }
  }

  const onScopeChange = (key) => async (e) => {
    const value = e.target.value
    setError('')
    setInfo('')

    if (key === 'institutionId') {
      setScope({ ...initialScope, institutionId: value })
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      setFaculties([])
      setActivities([])
      setLectureSlots([])
      setConvertForm(initialConvert)
      setNaacReport(null)
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
      setScope((p) => ({ ...p, departmentId: value, programmeId: '', regulationId: '' }))
      setProgrammes([])
      setRegulations([])
      setFaculties([])
      if (!value || !scope.institutionId) return
      try {
        setProgrammes(await lmsService.listProgrammes(scope.institutionId, value))
        if (scope.academicYearId) {
          setFaculties(
            await lmsService.listFaculties({
              institutionId: scope.institutionId,
              departmentId: value,
              academicYearId: scope.academicYearId,
            }),
          )
        }
      } catch {
        setError('Failed to load department scope data')
      }
      return
    }

    if (key === 'programmeId') {
      setScope((p) => ({ ...p, programmeId: value, regulationId: '' }))
      setRegulations([])
      if (!value || !scope.institutionId) return
      try {
        setRegulations(await lmsService.listRegulations(scope.institutionId, value))
      } catch {
        setError('Failed to load regulation options')
      }
      return
    }

    if (key === 'academicYearId') {
      setScope((p) => ({ ...p, academicYearId: value, semester: '' }))
      setFaculties([])
      if (!value || !scope.institutionId || !scope.departmentId) return
      try {
        setFaculties(
          await lmsService.listFaculties({
            institutionId: scope.institutionId,
            departmentId: scope.departmentId,
            academicYearId: value,
          }),
        )
      } catch {
        setError('Failed to load faculties')
      }
      return
    }

    setScope((p) => ({ ...p, [key]: value }))
  }
  const onConvertChange = (key) => async (e) => {
    const value = key === 'file' ? e.target.files?.[0] || null : e.target.value
    setConvertForm((p) => ({ ...p, [key]: value }))
    if (key === 'sessionDate') {
      setConvertForm((p) => ({ ...p, sessionDate: value, classTimetableEntryId: '' }))
      await loadLectureSlots(value, convertForm.facultyId)
      return
    }
    if (key === 'facultyId') {
      setConvertForm((p) => ({ ...p, facultyId: value, classTimetableEntryId: '' }))
      await loadLectureSlots(convertForm.sessionDate, value)
    }
  }

  const onConvertLecture = async () => {
    setError('')
    setInfo('')
    if (!validScope()) return
    if (!convertForm.sessionDate || !convertForm.facultyId || !convertForm.activityCategoryId || !convertForm.classTimetableEntryId) {
      setError('Select faculty, session date, activity category and lecture slot')
      return
    }
    try {
      setSaving(true)
      await lmsService.convertLectureToActivity(scope, {
        ...convertForm,
        studentCountPlanned: toNumberOrUndefined(convertForm.studentCountPlanned),
        studentCountParticipated: toNumberOrUndefined(convertForm.studentCountParticipated),
      })
      setInfo('Lecture hour converted to activity successfully')
      await reloadActivities()
      await loadLectureSlots(convertForm.sessionDate, convertForm.facultyId)
      await loadNaacReport()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to convert lecture hour')
    } finally {
      setSaving(false)
    }
  }

  const fillEditForm = (row) => {
    setEditForm({
      id: row.id,
      activityCategoryId: row.activityCategoryId || '',
      title: row.title || '',
      description: row.description || '',
      remarks: row.remarks || '',
      status: String(Boolean(row.status)),
      learningMethodType: row.learningMethodType || '',
      ictTools: row.ictTools || '',
      onlineResourceLinks: row.onlineResourceLinks || '',
      studentCountPlanned: row.studentCountPlanned ?? '',
      studentCountParticipated: row.studentCountParticipated ?? '',
      learningOutcome: row.learningOutcome || '',
      impactSummary: row.impactSummary || '',
      naacReady: String(Boolean(row.naacReady)),
    })
  }

  const openEdit = async (row) => {
    fillEditForm(row)
    setEditReadOnly(false)
    setEvidenceForm(initialEvidenceForm)
    setEditOpen(true)
    await loadEvidences(row.id)
  }

  const openView = async (row) => {
    fillEditForm(row)
    setEditReadOnly(true)
    setEvidenceForm(initialEvidenceForm)
    setEditOpen(true)
    await loadEvidences(row.id)
  }

  const onUpdateActivity = async () => {
    if (!editForm.id || editReadOnly) return
    try {
      setSaving(true)
      setError('')
      await lmsService.updateActivity(editForm.id, scope, {
        activityCategoryId: editForm.activityCategoryId,
        title: editForm.title,
        description: editForm.description,
        remarks: editForm.remarks,
        status: editForm.status === 'true',
        learningMethodType: editForm.learningMethodType || undefined,
        ictTools: editForm.ictTools || undefined,
        onlineResourceLinks: editForm.onlineResourceLinks || undefined,
        studentCountPlanned: toNumberOrUndefined(editForm.studentCountPlanned),
        studentCountParticipated: toNumberOrUndefined(editForm.studentCountParticipated),
        learningOutcome: editForm.learningOutcome || undefined,
        impactSummary: editForm.impactSummary || undefined,
        naacReady: editForm.naacReady === 'true',
      })
      setInfo('Activity updated successfully')
      await reloadActivities()
      await loadEvidences(editForm.id)
      await loadNaacReport()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update activity')
    } finally {
      setSaving(false)
    }
  }

  const onAddEvidence = async () => {
    if (!editForm.id || editReadOnly) return
    try {
      setSaving(true)
      setError('')
      await lmsService.createActivityEvidence(editForm.id, scope, evidenceForm)
      setEvidenceForm(initialEvidenceForm)
      await loadEvidences(editForm.id)
      await reloadActivities()
      await loadNaacReport()
      setInfo('Evidence added')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to add evidence')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteEvidence = async (row) => {
    if (!editForm.id || editReadOnly) return
    const ok = window.confirm('Delete this evidence?')
    if (!ok) return
    try {
      setSaving(true)
      await lmsService.deleteActivityEvidence(editForm.id, row.id, scope)
      await loadEvidences(editForm.id)
      await reloadActivities()
      await loadNaacReport()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete evidence')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteActivity = async (row) => {
    const ok = window.confirm('Delete this activity?')
    if (!ok) return
    try {
      setSaving(true)
      setError('')
      await lmsService.deleteActivity(row.id, scope)
      setInfo('Activity deleted successfully')
      await reloadActivities()
      await loadNaacReport()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete activity')
    } finally {
      setSaving(false)
    }
  }

  const activityColumns = useMemo(
    () => [
      { key: 'sessionDate', label: 'Date', sortable: true, width: 130 },
      { key: 'sourceType', label: 'Source', sortable: true, width: 150, render: (r) => <CBadge color={sourceBadge(r.sourceType)}>{r.sourceType}</CBadge> },
      { key: 'activityCategoryName', label: 'Category', sortable: true, width: 190 },
      { key: 'learningMethodType', label: 'Method', sortable: true, width: 170, render: (r) => methodLabel(r.learningMethodType) },
      { key: 'facultyName', label: 'Faculty', sortable: true, width: 210, render: (r) => `${r.facultyCode || '-'} ${r.facultyName ? `- ${r.facultyName}` : ''}` },
      { key: 'time', label: 'Time', sortable: false, width: 150, render: (r) => `${r.startTime || '-'} - ${r.endTime || '-'}` },
      { key: 'evidenceCount', label: 'Evidences', sortable: true, width: 110, render: (r) => Number(r.evidenceCount || 0) },
      { key: 'naacReady', label: 'NAAC Ready', sortable: true, width: 120, render: (r) => <CBadge color={r.naacReady ? 'success' : 'secondary'}>{r.naacReady ? 'Yes' : 'No'}</CBadge> },
      { key: 'status', label: 'Status', sortable: true, width: 110, render: (r) => <CBadge color={r.status ? 'success' : 'secondary'}>{r.status ? 'Active' : 'Inactive'}</CBadge> },
    ],
    [],
  )
  const reportMethodColumns = useMemo(
    () => [
      { key: 'learningMethodType', label: 'Method', render: (r) => methodLabel(r.learningMethodType) },
      { key: 'count', label: 'Activities' },
    ],
    [],
  )
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Learning Activities - Faculty Lecture Conversion</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Load Activities" icon="search" color="primary" onClick={reloadActivities} disabled={loading || !scopeReady} />
              <ArpButton label="Load NAAC 2.3.1" icon="view" color="warning" onClick={loadNaacReport} disabled={loading || !scopeReady} />
              <ArpButton
                label="Load Lecture Slots"
                icon="view"
                color="info"
                onClick={() => {
                  if (!scopeReady) return setError('Select full academic scope before loading lecture slots')
                  if (!convertForm.facultyId) return setError('Select faculty to load lecture slots')
                  if (!convertForm.sessionDate) return setError('Select lecture date to load lecture slots')
                  setError('')
                  loadLectureSlots()
                }}
                disabled={loading || !canLoadLectureSlots}
              />
            </div>
          </CCardHeader>
          <CCardBody>
            <CForm><CRow className="g-3">
              <CCol md={3}><CFormLabel>Institution</CFormLabel><CFormSelect value={scope.institutionId} onChange={onScopeChange('institutionId')}><option value="">Select</option>{institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Department</CFormLabel><CFormSelect value={scope.departmentId} onChange={onScopeChange('departmentId')}><option value="">Select</option>{departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Programme</CFormLabel><CFormSelect value={scope.programmeId} onChange={onScopeChange('programmeId')}><option value="">Select</option>{programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode} - {x.programmeName}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Regulation</CFormLabel><CFormSelect value={scope.regulationId} onChange={onScopeChange('regulationId')}><option value="">Select</option>{regulations.map((x) => <option key={x.id} value={x.id}>{x.regulationCode}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Academic Year</CFormLabel><CFormSelect value={scope.academicYearId} onChange={onScopeChange('academicYearId')}><option value="">Select</option>{academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Batch</CFormLabel><CFormSelect value={scope.batchId} onChange={onScopeChange('batchId')}><option value="">Select</option>{batches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Semester</CFormLabel><CFormSelect value={scope.semester} onChange={onScopeChange('semester')}><option value="">Select</option>{semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</CFormSelect></CCol>
            </CRow></CForm>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Convert Faculty Lecture Hour to Activity</strong></CCardHeader>
          <CCardBody><CRow className="g-3">
            <CCol md={3}><CFormLabel>Faculty</CFormLabel><CFormSelect value={convertForm.facultyId} onChange={onConvertChange('facultyId')}><option value="">Select</option>{faculties.map((x) => <option key={x.id} value={x.id}>{x.facultyCode} - {x.facultyName}</option>)}</CFormSelect></CCol>
            <CCol md={3}><CFormLabel>Lecture Date</CFormLabel><CFormInput type="date" value={convertForm.sessionDate} onChange={onConvertChange('sessionDate')} /></CCol>
            <CCol md={3}><CFormLabel>Activity Category</CFormLabel><CFormSelect value={convertForm.activityCategoryId} onChange={onConvertChange('activityCategoryId')}><option value="">Select</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</CFormSelect></CCol>
            <CCol md={3}><CFormLabel>Lecture Hour Slot</CFormLabel><CFormSelect value={convertForm.classTimetableEntryId} onChange={onConvertChange('classTimetableEntryId')}><option value="">Select</option>{lectureSlots.map((s) => <option key={s.classTimetableEntryId} value={s.classTimetableEntryId}>{s.className} {s.classLabel ? `(${s.classLabel})` : ''} | {s.timeFrom} - {s.timeTo}</option>)}</CFormSelect></CCol>
            <CCol md={3}><CFormLabel>Learning Method</CFormLabel><CFormSelect value={convertForm.learningMethodType} onChange={onConvertChange('learningMethodType')}><option value="">Select</option><option value="EXPERIENTIAL">Experiential</option><option value="PARTICIPATIVE">Participative</option><option value="PROBLEM_SOLVING">Problem Solving</option><option value="BLENDED">Blended</option></CFormSelect></CCol>
            <CCol md={3}><CFormLabel>Student Planned</CFormLabel><CFormInput type="number" min={0} value={convertForm.studentCountPlanned} onChange={onConvertChange('studentCountPlanned')} /></CCol>
            <CCol md={3}><CFormLabel>Student Participated</CFormLabel><CFormInput type="number" min={0} value={convertForm.studentCountParticipated} onChange={onConvertChange('studentCountParticipated')} /></CCol>
            <CCol md={3}><CFormLabel>Title</CFormLabel><CFormInput value={convertForm.title} onChange={onConvertChange('title')} /></CCol>
            <CCol md={6}><CFormLabel>ICT Tools Used</CFormLabel><CFormInput value={convertForm.ictTools} onChange={onConvertChange('ictTools')} placeholder="LMS, Zoom, Smart Board..." /></CCol>
            <CCol md={6}><CFormLabel>Online Resource Links (comma/new line)</CFormLabel><CFormInput value={convertForm.onlineResourceLinks} onChange={onConvertChange('onlineResourceLinks')} /></CCol>
            <CCol md={6}><CFormLabel>Learning Outcome</CFormLabel><CFormInput value={convertForm.learningOutcome} onChange={onConvertChange('learningOutcome')} /></CCol>
            <CCol md={6}><CFormLabel>Impact Summary</CFormLabel><CFormInput value={convertForm.impactSummary} onChange={onConvertChange('impactSummary')} /></CCol>
            <CCol md={6}><CFormLabel>Description</CFormLabel><CFormInput value={convertForm.description} onChange={onConvertChange('description')} /></CCol>
            <CCol md={6}><CFormLabel>Remarks</CFormLabel><CFormInput value={convertForm.remarks} onChange={onConvertChange('remarks')} /></CCol>
            <CCol xs={12} className="text-end"><ArpButton label="Convert Lecture Hour" icon="submit" color="primary" onClick={onConvertLecture} disabled={saving} /></CCol>
          </CRow></CCardBody>
        </CCard>

        {error ? <CAlert color="danger">{error}</CAlert> : null}
        {info ? <CAlert color="info">{info}</CAlert> : null}

        {naacReport?.summary ? (
          <CCard className="mb-3">
            <CCardHeader><strong>NAAC 2.3.1 Summary</strong></CCardHeader>
            <CCardBody>
              <CRow className="g-2 mb-3">
                <CCol md={2}><CBadge color="primary">Total: {naacReport.summary.totalActivities}</CBadge></CCol>
                <CCol md={2}><CBadge color="info">Student-Centric: {naacReport.summary.studentCentricActivities}</CBadge></CCol>
                <CCol md={2}><CBadge color="warning">ICT Enabled: {naacReport.summary.withIctEnabledTools}</CBadge></CCol>
                <CCol md={2}><CBadge color="success">With Evidence: {naacReport.summary.withEvidence}</CBadge></CCol>
                <CCol md={2}><CBadge color="dark">NAAC Ready: {naacReport.summary.naacReadyActivities}</CBadge></CCol>
                <CCol md={2}><CBadge color="secondary">Avg Participation: {naacReport.summary.averageParticipationPct}%</CBadge></CCol>
              </CRow>
              <ArpDataTable title="Method Breakdown" rows={naacReport.methodBreakdown || []} columns={reportMethodColumns} rowKey="learningMethodType" pageSizeOptions={[5, 10]} defaultPageSize={5} />
            </CCardBody>
          </CCard>
        ) : null}

        <ArpDataTable
          title="Converted Activities"
          rows={activities}
          columns={activityColumns}
          rowKey="id"
          loading={loading}
          searchable
          searchPlaceholder="Search converted activities..."
          pageSizeOptions={[5, 10, 20, 50]}
          defaultPageSize={10}
          headerActions={
            <div className="d-flex gap-2">
              <ArpIconButton icon="view" color="purple" title="View" onClick={() => selectedActivity && openView(selectedActivity)} disabled={!selectedActivity || saving} />
              <ArpIconButton icon="edit" color="info" title="Edit" onClick={() => selectedActivity && openEdit(selectedActivity)} disabled={!selectedActivity || saving} />
              <ArpIconButton icon="delete" color="danger" title="Delete" onClick={() => selectedActivity && onDeleteActivity(selectedActivity)} disabled={!selectedActivity || saving} />
            </div>
          }
          selection={{ type: 'radio', selected: selectedActivityId, onChange: (value) => setSelectedActivityId(value), key: 'id', headerLabel: 'Select', width: 70, name: 'convertedActivitySelect' }}
          emptyText="No activities found"
        />

        <CModal visible={editOpen} onClose={() => setEditOpen(false)} size="xl">
          <CModalHeader><CModalTitle>{editReadOnly ? 'View Activity' : 'Edit Activity'} (NAAC 2.3.1)</CModalTitle></CModalHeader>
          <CModalBody>
            <CRow className="g-3">
              <CCol md={4}><CFormLabel>Category</CFormLabel><CFormSelect disabled={editReadOnly} value={editForm.activityCategoryId} onChange={(e) => setEditForm((p) => ({ ...p, activityCategoryId: e.target.value }))}><option value="">Select</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</CFormSelect></CCol>
              <CCol md={4}><CFormLabel>Learning Method</CFormLabel><CFormSelect disabled={editReadOnly} value={editForm.learningMethodType} onChange={(e) => setEditForm((p) => ({ ...p, learningMethodType: e.target.value }))}><option value="">Select</option><option value="EXPERIENTIAL">Experiential</option><option value="PARTICIPATIVE">Participative</option><option value="PROBLEM_SOLVING">Problem Solving</option><option value="BLENDED">Blended</option></CFormSelect></CCol>
              <CCol md={4}><CFormLabel>Status</CFormLabel><CFormSelect disabled={editReadOnly} value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}><option value="true">Active</option><option value="false">Inactive</option></CFormSelect></CCol>
              <CCol md={6}><CFormLabel>Title</CFormLabel><CFormInput disabled={editReadOnly} value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} /></CCol>
              <CCol md={6}><CFormLabel>Description</CFormLabel><CFormInput disabled={editReadOnly} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} /></CCol>
              <CCol md={6}><CFormLabel>ICT Tools Used</CFormLabel><CFormInput disabled={editReadOnly} value={editForm.ictTools} onChange={(e) => setEditForm((p) => ({ ...p, ictTools: e.target.value }))} /></CCol>
              <CCol md={6}><CFormLabel>Online Resource Links</CFormLabel><CFormInput disabled={editReadOnly} value={editForm.onlineResourceLinks} onChange={(e) => setEditForm((p) => ({ ...p, onlineResourceLinks: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>Student Planned</CFormLabel><CFormInput disabled={editReadOnly} type="number" min={0} value={editForm.studentCountPlanned} onChange={(e) => setEditForm((p) => ({ ...p, studentCountPlanned: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>Student Participated</CFormLabel><CFormInput disabled={editReadOnly} type="number" min={0} value={editForm.studentCountParticipated} onChange={(e) => setEditForm((p) => ({ ...p, studentCountParticipated: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>NAAC Ready</CFormLabel><CFormSelect disabled={editReadOnly} value={editForm.naacReady} onChange={(e) => setEditForm((p) => ({ ...p, naacReady: e.target.value }))}><option value="false">No</option><option value="true">Yes</option></CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Remarks</CFormLabel><CFormInput disabled={editReadOnly} value={editForm.remarks} onChange={(e) => setEditForm((p) => ({ ...p, remarks: e.target.value }))} /></CCol>
              <CCol md={6}><CFormLabel>Learning Outcome</CFormLabel><CFormInput disabled={editReadOnly} value={editForm.learningOutcome} onChange={(e) => setEditForm((p) => ({ ...p, learningOutcome: e.target.value }))} /></CCol>
              <CCol md={6}><CFormLabel>Impact Summary</CFormLabel><CFormInput disabled={editReadOnly} value={editForm.impactSummary} onChange={(e) => setEditForm((p) => ({ ...p, impactSummary: e.target.value }))} /></CCol>
            </CRow>

            <hr />
            <h6>Evidence Records</h6>
            {!editReadOnly ? (
              <CRow className="g-2 align-items-end mb-2">
                <CCol md={2}><CFormLabel>Type</CFormLabel><CFormSelect value={evidenceForm.evidenceType} onChange={(e) => setEvidenceForm((p) => ({ ...p, evidenceType: e.target.value }))}><option value="DOCUMENT">Document</option><option value="PHOTO">Photo</option><option value="VIDEO">Video</option><option value="LINK">Link</option></CFormSelect></CCol>
                <CCol md={4}><CFormLabel>External Link</CFormLabel><CFormInput value={evidenceForm.externalLink} onChange={(e) => setEvidenceForm((p) => ({ ...p, externalLink: e.target.value }))} /></CCol>
                <CCol md={3}><CFormLabel>Remarks</CFormLabel><CFormInput value={evidenceForm.remarks} onChange={(e) => setEvidenceForm((p) => ({ ...p, remarks: e.target.value }))} /></CCol>
                <CCol md={2}><CFormLabel>File</CFormLabel><CFormInput type="file" onChange={(e) => setEvidenceForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></CCol>
                <CCol md={1}><ArpButton label="Add" color="primary" onClick={onAddEvidence} disabled={saving} /></CCol>
              </CRow>
            ) : null}
            <ArpDataTable
              title="Evidences"
              rows={evidences}
              rowKey="id"
              pageSizeOptions={[5, 10]}
              defaultPageSize={5}
              columns={[
                { key: 'evidenceType', label: 'Type' },
                { key: 'fileName', label: 'File', render: (r) => r.filePath ? <a href={r.filePath} target="_blank" rel="noreferrer">{r.fileName || 'Open'}</a> : '-' },
                { key: 'externalLink', label: 'Link', render: (r) => r.externalLink ? <a href={r.externalLink} target="_blank" rel="noreferrer">Open</a> : '-' },
                { key: 'remarks', label: 'Remarks' },
                { key: 'actions', label: 'Action', render: (r) => !editReadOnly ? <ArpIconButton icon="delete" color="danger" title="Delete" onClick={() => onDeleteEvidence(r)} disabled={saving} /> : null },
              ]}
            />
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setEditOpen(false)}>Close</CButton>
            {!editReadOnly ? <CButton color="primary" onClick={onUpdateActivity} disabled={saving}>Save</CButton> : null}
          </CModalFooter>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default LearningActivities
