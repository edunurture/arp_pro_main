import React, { useEffect, useMemo, useState } from 'react'
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
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react-pro'

import { ArpButton, ArpDataTable, ArpIconButton } from '../../components/common'
import { academicsService } from '../../services/academicsService'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'

const EVENT_STATUS = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'SCHEDULED',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
  'CLOSED',
]

const DOC_TYPES = [
  'BROCHURE',
  'CIRCULAR',
  'ATTENDANCE',
  'PHOTOS',
  'REPORT',
  'FEEDBACK',
  'CERTIFICATE',
  'MOU',
  'MEDIA_CLIPPING',
  'OTHER',
]

const MODE_OPTIONS = ['OFFLINE', 'ONLINE', 'HYBRID']

const initialForm = {
  title: '',
  category: '',
  subCategory: '',
  institutionId: '',
  academicYearId: '',
  departmentId: '',
  programmeId: '',
  semester: '',
  coordinatorFacultyId: '',
  organizerUnit: '',
  startDate: '',
  endDate: '',
  venue: '',
  mode: 'OFFLINE',
  plannedParticipants: '',
  actualParticipants: '',
  budgetPlanned: '',
  budgetApproved: '',
  budgetActual: '',
  expectedOutcomes: '',
  actualOutcomes: '',
  feedbackCollected: 'false',
  feedbackScore: '',
  status: 'DRAFT',
  statusRemarks: '',
}

const initialDocForm = {
  docType: 'OTHER',
  title: '',
  description: '',
  evidenceDate: '',
  tags: '',
  file: null,
}

const toIntOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

const toNumOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const statusColor = (status) => {
  if (status === 'CLOSED') return 'success'
  if (status === 'COMPLETED') return 'info'
  if (status === 'CANCELLED') return 'danger'
  if (status === 'ONGOING') return 'warning'
  return 'secondary'
}

const AcademicEvents = () => {
  const [rows, setRows] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [isEdit, setIsEdit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [form, setForm] = useState(initialForm)

  const [categories, setCategories] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [faculties, setFaculties] = useState([])

  const [filters, setFilters] = useState({
    category: '',
    status: '',
    academicYearId: '',
    departmentId: '',
    programmeId: '',
    search: '',
  })

  const [showDocModal, setShowDocModal] = useState(false)
  const [docRows, setDocRows] = useState([])
  const [docLoading, setDocLoading] = useState(false)
  const [docSaving, setDocSaving] = useState(false)
  const [docForm, setDocForm] = useState(initialDocForm)
  const semesterOptions = useMemo(() => {
    const ay = academicYears.find((x) => String(x.id) === String(form.academicYearId))
    const fromAy = semesterOptionsFromAcademicYear(ay)
    if (Array.isArray(fromAy) && fromAy.length) return fromAy
    return Array.from({ length: 8 }, (_, i) => ({ value: String(i + 1), label: `Sem - ${i + 1}` }))
  }, [academicYears, form.academicYearId])

  const loadEvents = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await academicsService.listAcademicEvents(filters)
      setRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setRows([])
      setError(e?.response?.data?.error || 'Failed to load academic events')
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async (eventId) => {
    if (!eventId) return
    setDocLoading(true)
    try {
      const data = await academicsService.listAcademicEventDocuments(eventId)
      setDocRows(Array.isArray(data) ? data : [])
    } catch (e) {
      setDocRows([])
      setError(e?.response?.data?.error || 'Failed to load evidence documents')
    } finally {
      setDocLoading(false)
    }
  }

  const loadMasterData = async () => {
    try {
      const [cats, insts] = await Promise.all([
        academicsService.listEventCategories(),
        lmsService.listInstitutions(),
      ])
      setCategories(Array.isArray(cats) ? cats : [])
      setInstitutions(Array.isArray(insts) ? insts : [])
    } catch {
      setCategories([])
      setInstitutions([])
    }
  }

  useEffect(() => {
    loadMasterData()
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedId && !rows.some((x) => String(x.id) === String(selectedId))) {
      setSelectedId('')
      setIsEdit(false)
    }
  }, [rows, selectedId])

  const loadInstitutionScopedMasters = async (institutionId) => {
    if (!institutionId) {
      setAcademicYears([])
      setDepartments([])
      setProgrammes([])
      setFaculties([])
      return
    }
    try {
      const [aYears, deps] = await Promise.all([
        lmsService.listAcademicYears(institutionId),
        lmsService.listDepartments(institutionId),
      ])
      setAcademicYears(Array.isArray(aYears) ? aYears : [])
      setDepartments(Array.isArray(deps) ? deps : [])
    } catch {
      setAcademicYears([])
      setDepartments([])
    }
  }

  const onInstitutionChange = async (value) => {
    setForm((p) => ({
      ...p,
      institutionId: value,
      academicYearId: '',
      departmentId: '',
      programmeId: '',
      coordinatorFacultyId: '',
    }))
    setProgrammes([])
    setFaculties([])
    await loadInstitutionScopedMasters(value)
  }

  const onDepartmentChange = async (value) => {
    setForm((p) => ({
      ...p,
      departmentId: value,
      programmeId: '',
      coordinatorFacultyId: '',
    }))
    setProgrammes([])
    setFaculties([])
    if (!value || !form.institutionId) return
    try {
      const [progs, facs] = await Promise.all([
        lmsService.listProgrammes(form.institutionId, value),
        lmsService.listFaculties({
          institutionId: form.institutionId,
          departmentId: value,
          academicYearId: form.academicYearId || '',
        }),
      ])
      setProgrammes(Array.isArray(progs) ? progs : [])
      setFaculties(Array.isArray(facs) ? facs : [])
    } catch {
      setProgrammes([])
      setFaculties([])
    }
  }

  const onAcademicYearChange = async (value) => {
    setForm((p) => ({ ...p, academicYearId: value, semester: '', coordinatorFacultyId: '' }))
    if (!form.institutionId || !form.departmentId) return
    try {
      const facs = await lmsService.listFaculties({
        institutionId: form.institutionId,
        departmentId: form.departmentId,
        academicYearId: value,
      })
      setFaculties(Array.isArray(facs) ? facs : [])
    } catch {
      setFaculties([])
    }
  }

  useEffect(() => {
    if (!form.academicYearId) return
    const validValues = new Set((semesterOptions || []).map((x) => String(x.value)))
    if (form.semester && !validValues.has(String(form.semester))) {
      setForm((p) => ({ ...p, semester: '' }))
    }
  }, [form.academicYearId, form.semester, semesterOptions])

  const resetForm = () => {
    setForm(initialForm)
    setIsEdit(false)
    setError('')
    setInfo('')
  }

  const onAddNew = () => {
    setSelectedId('')
    setForm(initialForm)
    setIsEdit(true)
    setInfo('')
    setError('')
  }

  const mapRowToForm = (row) => ({
    ...initialForm,
    title: row?.title || '',
    category: row?.category || '',
    subCategory: row?.subCategory || '',
    institutionId: row?.institutionId || '',
    academicYearId: row?.academicYearId || '',
    departmentId: row?.departmentId || '',
    programmeId: row?.programmeId || '',
    semester: row?.semester ? String(row.semester) : '',
    coordinatorFacultyId: row?.coordinatorFacultyId || '',
    organizerUnit: row?.organizerUnit || '',
    startDate: row?.startDate || '',
    endDate: row?.endDate || '',
    venue: row?.venue || '',
    mode: row?.mode || 'OFFLINE',
    plannedParticipants: row?.plannedParticipants ?? '',
    actualParticipants: row?.actualParticipants ?? '',
    budgetPlanned: row?.budgetPlanned ?? '',
    budgetApproved: row?.budgetApproved ?? '',
    budgetActual: row?.budgetActual ?? '',
    expectedOutcomes: row?.expectedOutcomes || '',
    actualOutcomes: row?.actualOutcomes || '',
    feedbackCollected: String(Boolean(row?.feedbackCollected)),
    feedbackScore: row?.feedbackScore ?? '',
    status: row?.status || 'DRAFT',
    statusRemarks: row?.statusRemarks || '',
  })

  const onView = async () => {
    if (!selectedId) return setError('Select a row first')
    try {
      setLoading(true)
      const row = await academicsService.getAcademicEventById(selectedId)
      await loadInstitutionScopedMasters(row?.institutionId || '')
      if (row?.institutionId && row?.departmentId) {
        const [progs, facs] = await Promise.all([
          lmsService.listProgrammes(row.institutionId, row.departmentId),
          lmsService.listFaculties({
            institutionId: row.institutionId,
            departmentId: row.departmentId,
            academicYearId: row.academicYearId || '',
          }),
        ])
        setProgrammes(Array.isArray(progs) ? progs : [])
        setFaculties(Array.isArray(facs) ? facs : [])
      }
      setForm(mapRowToForm(row))
      setIsEdit(false)
      setInfo('Loaded selected event')
      setError('')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load selected event')
    } finally {
      setLoading(false)
    }
  }

  const onEdit = async () => {
    if (!selectedId) return setError('Select a row first')
    await onView()
    setIsEdit(true)
  }

  const onDelete = async () => {
    if (!selectedId) return setError('Select a row first')
    if (!window.confirm('Delete selected academic event?')) return
    try {
      setSaving(true)
      await academicsService.deleteAcademicEvent(selectedId)
      setInfo('Academic event deleted')
      setSelectedId('')
      await loadEvents()
      resetForm()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete event')
    } finally {
      setSaving(false)
    }
  }

  const onSave = async () => {
    try {
      setSaving(true)
      setError('')
      const payload = {
        ...form,
        semester: toIntOrNull(form.semester),
        plannedParticipants: toIntOrNull(form.plannedParticipants),
        actualParticipants: toIntOrNull(form.actualParticipants),
        budgetPlanned: toNumOrNull(form.budgetPlanned),
        budgetApproved: toNumOrNull(form.budgetApproved),
        budgetActual: toNumOrNull(form.budgetActual),
        feedbackScore: toNumOrNull(form.feedbackScore),
        feedbackCollected: String(form.feedbackCollected) === 'true',
      }

      if (selectedId) {
        await academicsService.updateAcademicEvent(selectedId, payload)
        setInfo('Academic event updated')
      } else {
        await academicsService.createAcademicEvent(payload)
        setInfo('Academic event created')
      }

      setIsEdit(false)
      await loadEvents()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save academic event')
    } finally {
      setSaving(false)
    }
  }

  const openDocumentModal = async () => {
    if (!selectedId) return setError('Select an event row first')
    setDocForm(initialDocForm)
    setShowDocModal(true)
    await loadDocuments(selectedId)
  }

  const onUploadDoc = async () => {
    if (!selectedId) return
    if (!docForm.title) return setError('Document title is required')
    if (!docForm.file) return setError('Choose a file to upload')

    try {
      setDocSaving(true)
      setError('')
      await academicsService.createAcademicEventDocument(selectedId, docForm)
      setInfo('Evidence uploaded')
      setDocForm(initialDocForm)
      await loadDocuments(selectedId)
      await loadEvents()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to upload evidence')
    } finally {
      setDocSaving(false)
    }
  }

  const onDeleteDoc = async (docId) => {
    if (!selectedId || !docId) return
    if (!window.confirm('Delete selected evidence?')) return
    try {
      await academicsService.deleteAcademicEventDocument(selectedId, docId)
      setInfo('Evidence deleted')
      await loadDocuments(selectedId)
      await loadEvents()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete evidence')
    }
  }

  const columns = useMemo(
    () => [
      { key: 'eventCode', label: 'Event Code', sortable: true, width: 150 },
      { key: 'title', label: 'Title', sortable: true, width: 260 },
      { key: 'category', label: 'Category', sortable: true, width: 150 },
      { key: 'academicYear', label: 'Academic Year', sortable: true, width: 130 },
      { key: 'departmentName', label: 'Department', sortable: true, width: 170 },
      { key: 'semester', label: 'Sem', sortable: true, width: 80, align: 'center' },
      { key: 'startDate', label: 'From', sortable: true, width: 110, align: 'center' },
      { key: 'endDate', label: 'To', sortable: true, width: 110, align: 'center' },
      { key: 'actualParticipants', label: 'Participants', sortable: true, width: 110, align: 'center' },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        width: 120,
        render: (r) => <CBadge color={statusColor(r.status)}>{r.status}</CBadge>,
      },
      { key: 'evidenceCount', label: 'Evidence', sortable: true, width: 90, align: 'center' },
    ],
    [],
  )

  return (
    <CRow>
      <CCol xs={12}>
        {error ? <CAlert color="danger">{error}</CAlert> : null}
        {info ? <CAlert color="info">{info}</CAlert> : null}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Academic Events</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpIconButton icon="view" color="primary" title="View" onClick={onView} disabled={!selectedId || loading} />
              <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId || loading} />
              <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId || saving} />
              <ArpIconButton icon="upload" color="success" title="Evidence" onClick={openDocumentModal} disabled={!selectedId} />
            </div>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Event Form</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}><CFormLabel>Institution</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect
                  value={form.institutionId}
                  disabled={!isEdit}
                  onChange={(e) => onInstitutionChange(e.target.value)}
                >
                  <option value="">Select</option>
                  {institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect
                  value={form.academicYearId}
                  disabled={!isEdit}
                  onChange={(e) => onAcademicYearChange(e.target.value)}
                >
                  <option value="">Select</option>
                  {academicYears.map((x) => (
                    <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Department</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect
                  value={form.departmentId}
                  disabled={!isEdit}
                  onChange={(e) => onDepartmentChange(e.target.value)}
                >
                  <option value="">Select</option>
                  {departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}><CFormLabel>Programme</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect
                  value={form.programmeId}
                  disabled={!isEdit}
                  onChange={(e) => setForm((p) => ({ ...p, programmeId: e.target.value }))}
                >
                  <option value="">Select</option>
                  {programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeName}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Category</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect
                  value={form.category}
                  disabled={!isEdit}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  <option value="">Select</option>
                  {categories.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}><CFormLabel>Status</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect
                  value={form.status}
                  disabled={!isEdit}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  {EVENT_STATUS.map((x) => <option key={x} value={x}>{x}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Title</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.title} disabled={!isEdit} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>Subcategory</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.subCategory} disabled={!isEdit} onChange={(e) => setForm((p) => ({ ...p, subCategory: e.target.value }))} /></CCol>

              <CCol md={3}><CFormLabel>Date From</CFormLabel></CCol>
              <CCol md={3}><CFormInput type="date" value={form.startDate} disabled={!isEdit} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>Date To</CFormLabel></CCol>
              <CCol md={3}><CFormInput type="date" value={form.endDate} disabled={!isEdit} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} /></CCol>

              <CCol md={3}><CFormLabel>Semester</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect
                  value={form.semester}
                  disabled={!isEdit}
                  onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
                >
                  <option value="">Select</option>
                  {semesterOptions.map((x) => (
                    <option key={x.value} value={x.value}>{x.label}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}><CFormLabel>Mode</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect
                  value={form.mode}
                  disabled={!isEdit}
                  onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))}
                >
                  {MODE_OPTIONS.map((x) => <option key={x} value={x}>{x}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Venue</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.venue} disabled={!isEdit} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>Coordinator</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect
                  value={form.coordinatorFacultyId}
                  disabled={!isEdit}
                  onChange={(e) => setForm((p) => ({ ...p, coordinatorFacultyId: e.target.value }))}
                >
                  <option value="">Select</option>
                  {faculties.map((x) => <option key={x.id} value={x.id}>{x.facultyCode} - {x.facultyName}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Planned Participants</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.plannedParticipants} disabled={!isEdit} onChange={(e) => setForm((p) => ({ ...p, plannedParticipants: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>Actual Participants</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.actualParticipants} disabled={!isEdit} onChange={(e) => setForm((p) => ({ ...p, actualParticipants: e.target.value }))} /></CCol>

              <CCol md={3}><CFormLabel>Expected Outcomes</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.expectedOutcomes} disabled={!isEdit} onChange={(e) => setForm((p) => ({ ...p, expectedOutcomes: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>Actual Outcomes</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.actualOutcomes} disabled={!isEdit} onChange={(e) => setForm((p) => ({ ...p, actualOutcomes: e.target.value }))} /></CCol>

              <CCol xs={12} className="d-flex justify-content-end gap-2">
                <ArpButton label="Save" icon="save" color="primary" onClick={onSave} disabled={!isEdit || saving} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={resetForm} />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Filters</strong></CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2}>
                <CFormLabel>Category</CFormLabel>
                <CFormSelect value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
                  <option value="">All</option>
                  {categories.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormLabel>Status</CFormLabel>
                <CFormSelect value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}>
                  <option value="">All</option>
                  {EVENT_STATUS.map((x) => <option key={x} value={x}>{x}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormLabel>Academic Year</CFormLabel>
                <CFormSelect value={filters.academicYearId} onChange={(e) => setFilters((p) => ({ ...p, academicYearId: e.target.value }))}>
                  <option value="">All</option>
                  {academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormLabel>Department</CFormLabel>
                <CFormSelect value={filters.departmentId} onChange={(e) => setFilters((p) => ({ ...p, departmentId: e.target.value }))}>
                  <option value="">All</option>
                  {departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormLabel>Programme</CFormLabel>
                <CFormSelect value={filters.programmeId} onChange={(e) => setFilters((p) => ({ ...p, programmeId: e.target.value }))}>
                  <option value="">All</option>
                  {programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeName}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormLabel>Search</CFormLabel>
                <CFormInput value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
              </CCol>
              <CCol xs={12} className="d-flex justify-content-end">
                <ArpButton label="Apply Filters" icon="search" color="info" onClick={loadEvents} />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {loading ? (
          <div className="d-flex align-items-center gap-2 mb-2">
            <CSpinner size="sm" />
            <span>Loading academic events...</span>
          </div>
        ) : null}

        <ArpDataTable
          title="Academic Event Register"
          rows={rows}
          rowKey="id"
          columns={columns}
          loading={loading}
          headerActions={
            <div className="d-flex gap-2">
              <ArpIconButton icon="view" color="primary" title="View" onClick={onView} disabled={!selectedId || loading} />
              <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId || loading} />
              <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId || saving} />
              <ArpIconButton icon="upload" color="success" title="Evidence" onClick={openDocumentModal} disabled={!selectedId} />
            </div>
          }
          selection={{
            type: 'radio',
            selected: selectedId,
            onChange: setSelectedId,
            key: 'id',
            headerLabel: 'Select',
            width: 70,
            name: 'academicEventSelect',
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          defaultPageSize={10}
          searchable
        />

        <CModal visible={showDocModal} size="xl" onClose={() => setShowDocModal(false)}>
          <CModalHeader>
            <CModalTitle>Evidence Documents</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow className="g-3 mb-3">
              <CCol md={2}>
                <CFormLabel>Type</CFormLabel>
                <CFormSelect value={docForm.docType} onChange={(e) => setDocForm((p) => ({ ...p, docType: e.target.value }))}>
                  {DOC_TYPES.map((x) => <option key={x} value={x}>{x}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Title</CFormLabel>
                <CFormInput value={docForm.title} onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))} />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Description</CFormLabel>
                <CFormInput value={docForm.description} onChange={(e) => setDocForm((p) => ({ ...p, description: e.target.value }))} />
              </CCol>
              <CCol md={2}>
                <CFormLabel>Date</CFormLabel>
                <CFormInput type="date" value={docForm.evidenceDate} onChange={(e) => setDocForm((p) => ({ ...p, evidenceDate: e.target.value }))} />
              </CCol>
              <CCol md={2}>
                <CFormLabel>Tags</CFormLabel>
                <CFormInput value={docForm.tags} onChange={(e) => setDocForm((p) => ({ ...p, tags: e.target.value }))} />
              </CCol>
              <CCol md={10}>
                <CFormLabel>File</CFormLabel>
                <CFormInput type="file" onChange={(e) => setDocForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} />
              </CCol>
              <CCol md={2} className="d-flex align-items-end">
                <ArpButton
                  label={docSaving ? 'Uploading...' : 'Upload'}
                  icon="upload"
                  color="primary"
                  onClick={onUploadDoc}
                  disabled={docSaving}
                />
              </CCol>
            </CRow>

            {docLoading ? (
              <div className="d-flex align-items-center gap-2 mb-2">
                <CSpinner size="sm" />
                <span>Loading evidence...</span>
              </div>
            ) : null}

            <ArpDataTable
              title="Evidence List"
              rows={docRows}
              rowKey="id"
              columns={[
                { key: 'docType', label: 'Type', sortable: true, width: 130 },
                { key: 'title', label: 'Title', sortable: true, width: 230 },
                { key: 'evidenceDate', label: 'Date', sortable: true, width: 110, align: 'center' },
                { key: 'fileName', label: 'File', sortable: true, width: 260 },
                { key: 'tags', label: 'Tags', sortable: true, width: 150 },
                {
                  key: 'action',
                  label: 'Action',
                  width: 100,
                  align: 'center',
                  render: (r) => (
                    <ArpIconButton
                      icon="delete"
                      color="danger"
                      title="Delete"
                      onClick={() => onDeleteDoc(r.id)}
                    />
                  ),
                },
              ]}
              loading={docLoading}
              pageSizeOptions={[5, 10, 20]}
              defaultPageSize={5}
              searchable
            />
          </CModalBody>
          <CModalFooter>
            <ArpButton label="Close" icon="cancel" color="secondary" onClick={() => setShowDocModal(false)} />
          </CModalFooter>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default AcademicEvents
