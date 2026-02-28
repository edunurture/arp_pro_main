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
  CSpinner,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'
import api from '../../services/apiClient'

const ALL_VALUE = '__ALL__'

const initialScope = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
}

const createShiftRow = (overrides = {}) => ({
  timeIndex: '',
  fromTime: '',
  toTime: '',
  shortName: '',
  isBreak: false,
  sequence: '',
  shiftId: '',
  ...overrides,
})

const createMappingDraft = (overrides = {}) => ({
  scopeType: 'INSTITUTION',
  department: ALL_VALUE,
  programme: ALL_VALUE,
  shiftTemplateId: '',
  effectiveFrom: '',
  ...overrides,
})

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const toScopeParams = (scope) => ({
  institutionId: scope.institutionId,
  departmentId: scope.departmentId,
  programmeId: scope.programmeId,
  regulationId: scope.regulationId,
  academicYearId: scope.academicYearId,
  batchId: scope.batchId,
  semester: scope.semester,
})

const scopeTypeLabel = (x) =>
  x === 'INSTITUTION' ? 'All Departments' : x === 'DEPARTMENT' ? 'Department-wise' : 'Programme-wise'

export default function TimetableConfiguration() {
  const [activeTab, setActiveTab] = useState('SHIFT_MASTER')
  const [message, setMessage] = useState(null)

  const [scope, setScope] = useState(initialScope)
  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [mappedSemesters, setMappedSemesters] = useState([])

  const [loadingRows, setLoadingRows] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mappingActionLoading, setMappingActionLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const [templateName, setTemplateName] = useState('')
  const [shiftRows, setShiftRows] = useState([createShiftRow({ sequence: '1' })])
  const [shiftTemplates, setShiftTemplates] = useState([])

  const [mappingDraft, setMappingDraft] = useState(createMappingDraft())
  const [editingMappingId, setEditingMappingId] = useState('')
  const [mappings, setMappings] = useState([])
  const [conflicts, setConflicts] = useState([])

  const mappingScopeReady = useMemo(
    () => Boolean(scope.institutionId && scope.academicYearId),
    [scope.institutionId, scope.academicYearId],
  )

  const selectedRow = useMemo(
    () => shiftTemplates.find((r) => String(r.id) === String(selectedId)) || null,
    [shiftTemplates, selectedId],
  )

  const shiftTemplateOptions = useMemo(
    () => shiftTemplates.map((x) => ({ id: x.id, label: x.timetableName })),
    [shiftTemplates],
  )

  const mappingSummary = useMemo(() => {
    const total = mappings.length
    const published = mappings.filter((x) => String(x.status || '').toUpperCase() === 'PUBLISHED').length
    return { total, published, draft: total - published, conflicts: conflicts.length }
  }, [mappings, conflicts])
  const departmentNameById = useMemo(
    () => new Map(departments.map((d) => [String(d.id), d.departmentName])),
    [departments],
  )
  const programmeNameById = useMemo(
    () => new Map(programmes.map((p) => [String(p.id), `${p.programmeCode} - ${p.programmeName}`])),
    [programmes],
  )

  const showMessage = (type, text) => setMessage({ type, text })
  const resetMappingDraft = () => {
    setMappingDraft(createMappingDraft())
    setEditingMappingId('')
  }

  const resetEditor = () => {
    setIsEdit(false)
    setEditingId(null)
    setTemplateName('')
    setShiftRows([createShiftRow({ sequence: '1' })])
  }

  const loadTimetables = async (silent = false) => {
    setLoadingRows(true)
    try {
      const res = await api.get('/api/setup/timetable/template-master', { params: toScopeParams(scope) })
      setShiftTemplates(unwrapList(res))
      setSelectedId(null)
      if (!silent) showMessage('success', 'Shift schedules loaded')
    } catch (e) {
      setShiftTemplates([])
      showMessage('danger', e?.response?.data?.error || 'Failed to load shift schedules')
    } finally {
      setLoadingRows(false)
    }
  }

  const loadMappings = async (silent = false) => {
    if (!mappingScopeReady) {
      setMappings([])
      return
    }
    try {
      const res = await api.get('/api/setup/timetable/mappings', { params: toScopeParams(scope) })
      setMappings(unwrapList(res))
      if (!silent) showMessage('success', 'Scope mappings loaded')
    } catch (e) {
      setMappings([])
      if (!silent) showMessage('danger', e?.response?.data?.error || 'Failed to load scope mappings')
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/api/setup/institution')
        setInstitutions(unwrapList(res))
      } catch {
        setInstitutions([])
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!scope.institutionId) return
      try {
        const [depRes, ayRes, batchRes] = await Promise.all([
          api.get('/api/setup/department', { params: { institutionId: scope.institutionId } }),
          api.get('/api/setup/academic-year', { headers: { 'x-institution-id': scope.institutionId } }),
          api.get('/api/setup/batch', { params: { institutionId: scope.institutionId } }),
        ])
        setDepartments(unwrapList(depRes))
        setAcademicYears(unwrapList(ayRes))
        setBatches(unwrapList(batchRes))
      } catch {
        setDepartments([])
        setAcademicYears([])
        setBatches([])
      }
    })()
  }, [scope.institutionId])

  useEffect(() => {
    ;(async () => {
      if (!scope.institutionId) return
      try {
        const res = await api.get('/api/setup/programme')
        const all = unwrapList(res)
        setProgrammes(
          all.filter(
            (x) =>
              String(x.institutionId) === String(scope.institutionId),
          ),
        )
      } catch {
        setProgrammes([])
      }
    })()
  }, [scope.institutionId])

  useEffect(() => {
    ;(async () => {
      if (!scope.institutionId || !scope.programmeId) return
      try {
        const res = await api.get('/api/setup/regulation', {
          params: { institutionId: scope.institutionId, programmeId: scope.programmeId },
        })
        setRegulations(unwrapList(res))
      } catch {
        setRegulations([])
      }
    })()
  }, [scope.institutionId, scope.programmeId])

  useEffect(() => {
    ;(async () => {
      if (
        !scope.institutionId ||
        !scope.departmentId ||
        !scope.programmeId ||
        !scope.regulationId ||
        !scope.academicYearId ||
        !scope.batchId
      ) {
        setMappedSemesters([])
        return
      }
      try {
        const res = await api.get('/api/setup/regulation-map', {
          params: {
            institutionId: scope.institutionId,
            departmentId: scope.departmentId,
            programmeId: scope.programmeId,
            regulationId: scope.regulationId,
            academicYearId: scope.academicYearId,
            batchId: scope.batchId,
          },
        })
        const sems = unwrapList(res)
          .filter((x) => String(x?.status || '').toLowerCase() === 'map done')
          .map((x) => Number(x.semester))
          .filter((x) => Number.isFinite(x))
        setMappedSemesters([...new Set(sems)].sort((a, b) => a - b))
      } catch {
        setMappedSemesters([])
      }
    })()
  }, [scope.institutionId, scope.departmentId, scope.programmeId, scope.regulationId, scope.academicYearId, scope.batchId])

  useEffect(() => {
    loadTimetables(true)
    if (mappingScopeReady) loadMappings(true)
    else setMappings([])
  }, [mappingScopeReady, scope.institutionId, scope.departmentId, scope.programmeId, scope.regulationId, scope.academicYearId, scope.batchId, scope.semester])

  const onAddNew = () => {
    setIsEdit(true)
    setEditingId(null)
    setSelectedId(null)
    setTemplateName('')
    setShiftRows([createShiftRow({ sequence: '1' })])
  }

  const addShiftRow = () => setShiftRows((prev) => [...prev, createShiftRow({ sequence: String(prev.length + 1) })])
  const removeShiftRow = (index) =>
    setShiftRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  const updateShiftRow = (index, key, value) =>
    setShiftRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)))

  const fillEditor = (row, editMode) => {
    if (!row) return
    setTemplateName(row.timetableName || '')
    const mappedSlots =
      Array.isArray(row.slots) && row.slots.length
        ? row.slots.map((s, idx) =>
            createShiftRow({
              shiftId: s.shiftId || '',
              timeIndex: s.shiftName || '',
              fromTime: s.timeFrom || '',
              toTime: s.timeTo || '',
              shortName: s.nomenclature || '',
              isBreak: !!s.isInterval,
              sequence: String(s.priority ?? idx + 1),
            }),
          )
        : [createShiftRow({ sequence: '1' })]

    setShiftRows(mappedSlots)
    setEditingId(editMode ? row.id : null)
    setIsEdit(!!editMode)
  }

  const onView = () => fillEditor(selectedRow, false)
  const onEdit = () => fillEditor(selectedRow, true)

  const onDelete = async () => {
    if (!selectedRow) return
    try {
      await api.delete(`/api/setup/timetable/template-master/${selectedRow.id}`)
      showMessage('success', 'Shift schedule deleted')
      await loadTimetables()
      resetEditor()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to delete shift schedule')
    }
  }

  const onSaveTemplate = async (e) => {
    e.preventDefault()
    if (!templateName.trim()) return showMessage('danger', 'Shift Template Name is required')

    const payload = {
      ...toScopeParams(scope),
      timetableName: templateName.trim(),
      slots: shiftRows.map((r, i) => ({
        shiftId: String(r.shiftId || `S${i + 1}`).trim(),
        shiftName: String(r.timeIndex || `Hour - ${i + 1}`).trim(),
        timeFrom: String(r.fromTime || '').trim(),
        timeTo: String(r.toTime || '').trim(),
        nomenclature: String(r.shortName || '').trim(),
        isInterval: !!r.isBreak,
        priority: Number(r.sequence || i + 1),
      })),
    }

    setSaving(true)
    try {
      if (editingId) await api.put(`/api/setup/timetable/template-master/${editingId}`, payload)
      else await api.post('/api/setup/timetable/template-master', payload)
      showMessage('success', 'Shift schedule saved')
      await loadTimetables()
      resetEditor()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to save shift schedule')
    } finally {
      setSaving(false)
    }
  }

  const onChangeScopeType = (scopeType) => {
    setMappingDraft((prev) => ({
      ...prev,
      scopeType,
      department: scopeType === 'INSTITUTION' ? ALL_VALUE : '',
      programme: scopeType === 'PROGRAMME' ? '' : ALL_VALUE,
    }))
  }

  const onAddMapping = async () => {
    if (!mappingScopeReady) return showMessage('danger', 'Select Institution and Academic Year first')
    if (!mappingDraft.shiftTemplateId || !mappingDraft.effectiveFrom) {
      return showMessage('danger', 'Mapped Shift Template and Effective From are required')
    }
    if (mappingDraft.scopeType === 'DEPARTMENT' && !mappingDraft.department) {
      return showMessage('danger', 'Select Department for Department-wise mapping')
    }
    if (mappingDraft.scopeType === 'PROGRAMME' && !mappingDraft.programme) {
      return showMessage('danger', 'Select Programme for Programme-wise mapping')
    }

    setMappingActionLoading(true)
    try {
      const payload = {
        ...toScopeParams(scope),
        scopeType: mappingDraft.scopeType,
        departmentId: mappingDraft.department,
        programmeId: mappingDraft.programme,
        semester: ALL_VALUE,
        shiftTemplateId: mappingDraft.shiftTemplateId,
        effectiveFrom: mappingDraft.effectiveFrom,
      }
      if (editingMappingId) await api.put(`/api/setup/timetable/mappings/${editingMappingId}`, payload)
      else await api.post('/api/setup/timetable/mappings', payload)
      setConflicts([])
      await loadMappings(true)
      showMessage('success', editingMappingId ? 'Mapping updated' : 'Mapping row added')
      resetMappingDraft()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to save mapping')
    } finally {
      setMappingActionLoading(false)
    }
  }

  const onEditMapping = (row) => {
    if (!row) return
    setEditingMappingId(String(row.id || ''))
    setMappingDraft({
      scopeType: row.scopeType || 'INSTITUTION',
      department: row.departmentId || ALL_VALUE,
      programme: row.programmeId || ALL_VALUE,
      shiftTemplateId: row.shiftTemplateId || '',
      effectiveFrom: row.effectiveFrom ? String(row.effectiveFrom).slice(0, 10) : '',
    })
  }

  const onDeleteMapping = async (row) => {
    if (!row?.id) return
    setMappingActionLoading(true)
    try {
      await api.delete(`/api/setup/timetable/mappings/${row.id}`, {
        data: toScopeParams(scope),
      })
      await loadMappings(true)
      if (String(editingMappingId) === String(row.id)) resetMappingDraft()
      showMessage('success', 'Mapping deleted')
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to delete mapping')
    } finally {
      setMappingActionLoading(false)
    }
  }

  const onUnpublishMapping = async (row) => {
    if (!row?.id) return
    setMappingActionLoading(true)
    try {
      await api.post(`/api/setup/timetable/mappings/${row.id}/unpublish`, toScopeParams(scope))
      await loadMappings(true)
      showMessage('success', 'Mapping unpublished')
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to unpublish mapping')
    } finally {
      setMappingActionLoading(false)
    }
  }

  const buildMappingsPayload = () => ({
    ...toScopeParams(scope),
  })

  const onValidateMappings = async () => {
    if (!mappingScopeReady) return showMessage('danger', 'Select Institution and Academic Year first')
    if (!mappings.length) return showMessage('danger', 'No mapping rows to validate')
    setMappingActionLoading(true)
    try {
      const res = await api.post('/api/setup/timetable/mappings/validate', buildMappingsPayload())
      const nextConflicts = Array.isArray(res?.data?.data?.conflicts) ? res.data.data.conflicts : []
      setConflicts(nextConflicts)
      showMessage(
        nextConflicts.length ? 'warning' : 'success',
        nextConflicts.length ? `Validation found ${nextConflicts.length} conflict(s)` : 'Validation passed',
      )
    } catch (e) {
      const nextConflicts = e?.response?.data?.details?.conflicts || []
      setConflicts(nextConflicts)
      showMessage('danger', e?.response?.data?.error || 'Failed to validate mappings')
    } finally {
      setMappingActionLoading(false)
    }
  }

  const onPublish = async () => {
    if (!mappingScopeReady) return showMessage('danger', 'Select Institution and Academic Year first')
    if (conflicts.length) return showMessage('danger', 'Resolve conflicts before publish')
    if (!mappings.length) return showMessage('danger', 'No mapping rows to publish')
    setMappingActionLoading(true)
    try {
      const res = await api.post('/api/setup/timetable/mappings/publish', buildMappingsPayload())
      setConflicts([])
      await Promise.all([loadTimetables(true), loadMappings(true)])
      showMessage('success', res?.data?.message || 'Mappings published')
      setActiveTab('REVIEW_PUBLISH')
    } catch (e) {
      const nextConflicts = e?.response?.data?.details?.conflicts || []
      setConflicts(nextConflicts)
      showMessage('danger', e?.response?.data?.error || 'Failed to publish mappings')
    } finally {
      setMappingActionLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      { key: 'timetableName', label: 'Shift Template', sortable: true },
      { key: 'shifts', label: 'Slots', sortable: true, width: 90, align: 'center', sortType: 'number' },
      { key: 'status', label: 'Status', sortable: true, width: 100, align: 'center' },
    ],
    [],
  )

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>TIMETABLE CONFIGURATION</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New Template" icon="add" color="purple" onClick={onAddNew} />
            </div>
          </CCardHeader>
        </CCard>

        {message ? <CAlert color={message.type}>{message.text}</CAlert> : null}

        <CCard className="mb-3">
          <CCardBody className="d-flex gap-2 flex-wrap">
            <button className={`btn ${activeTab === 'SHIFT_MASTER' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('SHIFT_MASTER')}>1. Shift Master</button>
            <button className={`btn ${activeTab === 'SCOPE_MAPPING' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('SCOPE_MAPPING')}>2. Scope Mapping</button>
            <button className={`btn ${activeTab === 'REVIEW_PUBLISH' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('REVIEW_PUBLISH')}>3. Review & Publish</button>
          </CCardBody>
        </CCard>

        {activeTab === 'SHIFT_MASTER' && (
          <>
            <CCard className="mb-3">
              <CCardHeader><strong>Shift Master</strong></CCardHeader>
              <CCardBody>
                <CForm onSubmit={onSaveTemplate}>
                  <CRow className="g-3 mb-3">
                    <CCol md={4}><CFormLabel>Shift Template Name</CFormLabel><CFormInput value={templateName} onChange={(e) => setTemplateName(e.target.value)} disabled={!isEdit} placeholder="General Shift" /></CCol>
                  </CRow>

                  <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                      <thead>
                        <tr><th>Action</th><th>Time Index</th><th>From Time</th><th>To Time</th><th>Short Name</th><th>Is Break</th><th>Sequence</th></tr>
                      </thead>
                      <tbody>
                        {shiftRows.map((r, idx) => (
                          <tr key={idx}>
                            <td className="text-center"><ArpIconButton icon={idx === shiftRows.length - 1 ? 'add' : 'delete'} color={idx === shiftRows.length - 1 ? 'success' : 'danger'} onClick={() => (idx === shiftRows.length - 1 ? addShiftRow() : removeShiftRow(idx))} disabled={!isEdit} /></td>
                            <td><CFormInput value={r.timeIndex} onChange={(e) => updateShiftRow(idx, 'timeIndex', e.target.value)} disabled={!isEdit} /></td>
                            <td><CFormInput type="time" value={r.fromTime} onChange={(e) => updateShiftRow(idx, 'fromTime', e.target.value)} disabled={!isEdit} /></td>
                            <td><CFormInput type="time" value={r.toTime} onChange={(e) => updateShiftRow(idx, 'toTime', e.target.value)} disabled={!isEdit} /></td>
                            <td><CFormInput value={r.shortName} onChange={(e) => updateShiftRow(idx, 'shortName', e.target.value)} disabled={!isEdit} /></td>
                            <td className="text-center"><CFormCheck checked={!!r.isBreak} onChange={(e) => updateShiftRow(idx, 'isBreak', e.target.checked)} disabled={!isEdit} /></td>
                            <td><CFormInput type="number" value={r.sequence} onChange={(e) => updateShiftRow(idx, 'sequence', e.target.value)} disabled={!isEdit || !!r.isBreak} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <ArpButton label={saving ? 'Saving...' : 'Save Template'} icon="save" color="success" type="submit" disabled={!isEdit || saving} />
                    <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={resetEditor} />
                  </div>
                </CForm>
              </CCardBody>
            </CCard>

            <ArpDataTable
              title="SHIFT TEMPLATE LIST"
              rows={shiftTemplates}
              columns={columns}
              loading={loadingRows}
              loadingComponent={<div className="d-flex align-items-center gap-2"><CSpinner size="sm" /><span>Loading...</span></div>}
              headerActions={<div className="d-flex gap-2"><ArpIconButton icon="view" color="purple" onClick={onView} disabled={!selectedId} /><ArpIconButton icon="edit" color="info" onClick={onEdit} disabled={!selectedId} /><ArpIconButton icon="delete" color="danger" onClick={onDelete} disabled={!selectedId} /></div>}
              selection={{ type: 'radio', selected: selectedId, onChange: setSelectedId, key: 'id', headerLabel: 'Select', width: 60, name: 'shiftSelect' }}
              pageSizeOptions={[5, 10, 20, 50]}
              defaultPageSize={10}
              searchable
              rowKey="id"
            />
          </>
        )}

        {activeTab === 'SCOPE_MAPPING' && (
          <>
            <CCard className="mb-3">
              <CCardHeader><strong>Scope Mapping</strong></CCardHeader>
              <CCardBody>
                <CRow className="g-3">
                  <CCol md={3}>
                    <CFormLabel>Institution</CFormLabel>
                    <CFormSelect value={scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, institutionId: e.target.value }))}>
                      <option value="">Select Institution</option>
                      {institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </CFormSelect>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Academic Year</CFormLabel>
                    <CFormSelect value={scope.academicYearId} onChange={(e) => setScope((s) => ({ ...s, academicYearId: e.target.value }))}>
                      <option value="">Select Academic Year</option>
                      {academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}
                    </CFormSelect>
                  </CCol>
                  <CCol md={6} className="d-flex align-items-end">
                    <small className="text-muted">Scope mapping supports Institution-wise, Department-wise, and Programme-wise assignment.</small>
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Apply Scope</CFormLabel>
                    <CFormSelect value={mappingDraft.scopeType} onChange={(e) => onChangeScopeType(e.target.value)}>
                      <option value="INSTITUTION">All Departments (Institution-wide)</option>
                      <option value="DEPARTMENT">Department-wise</option>
                      <option value="PROGRAMME">Programme-wise</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Department</CFormLabel>
                    <CFormSelect value={mappingDraft.department} disabled={mappingDraft.scopeType === 'INSTITUTION'} onChange={(e) => setMappingDraft((s) => ({ ...s, department: e.target.value }))}>
                      <option value="">Select Department</option>
                      <option value={ALL_VALUE}>All Departments</option>
                      {departments.map((d) => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
                    </CFormSelect>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Programme</CFormLabel>
                    <CFormSelect value={mappingDraft.programme} disabled={mappingDraft.scopeType !== 'PROGRAMME'} onChange={(e) => setMappingDraft((s) => ({ ...s, programme: e.target.value }))}>
                      <option value="">Select Programme</option>
                      <option value={ALL_VALUE}>All Programmes</option>
                      {programmes
                        .filter((p) =>
                          !mappingDraft.department || mappingDraft.department === ALL_VALUE
                            ? true
                            : String(p.departmentId) === String(mappingDraft.department),
                        )
                        .map((p) => <option key={p.id} value={p.id}>{p.programmeCode} - {p.programmeName}</option>)}
                    </CFormSelect>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Mapped Shift Template</CFormLabel>
                    <CFormSelect value={mappingDraft.shiftTemplateId} onChange={(e) => setMappingDraft((s) => ({ ...s, shiftTemplateId: e.target.value }))}>
                      <option value="">Select Template</option>
                      {shiftTemplateOptions.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </CFormSelect>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Effective From</CFormLabel>
                    <CFormInput type="date" value={mappingDraft.effectiveFrom} onChange={(e) => setMappingDraft((s) => ({ ...s, effectiveFrom: e.target.value }))} />
                  </CCol>
                  <CCol md={5} className="d-flex align-items-end gap-2">
                    <ArpButton label={editingMappingId ? 'Update Mapping' : 'Add Mapping'} icon="add" color="info" onClick={onAddMapping} disabled={mappingActionLoading} />
                    <ArpButton label="Clear" icon="cancel" color="secondary" onClick={resetMappingDraft} disabled={mappingActionLoading} />
                    <ArpButton label={mappingActionLoading ? 'Validating...' : 'Validate'} icon="view" color="warning" onClick={onValidateMappings} disabled={mappingActionLoading} />
                    <ArpButton label={mappingActionLoading ? 'Publishing...' : 'Publish'} icon="send" color="success" onClick={onPublish} disabled={mappingActionLoading} />
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            <CCard>
              <CCardHeader><strong>Mapping Table</strong></CCardHeader>
              <CCardBody>
                <div className="table-responsive">
                  <table className="table table-bordered align-middle">
                    <thead>
                      <tr>
                        <th>Scope Type</th>
                        <th>Department</th>
                        <th>Programme</th>
                        <th>Mapped Shift Template</th>
                        <th>Effective From</th>
                        <th>Version</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mappings.length === 0 ? (
                        <tr><td colSpan={8} className="text-center text-muted">No mappings added</td></tr>
                      ) : (
                        mappings.map((m) => (
                          <tr key={m.id}>
                            <td>{scopeTypeLabel(m.scopeType)}</td>
                            <td>{(m.department || m.departmentId) === ALL_VALUE ? 'All Departments' : departmentNameById.get(String(m.department || m.departmentId)) || m.department || m.departmentId || '-'}</td>
                            <td>{(m.programme || m.programmeId) === ALL_VALUE ? 'All Programmes' : programmeNameById.get(String(m.programme || m.programmeId)) || m.programme || m.programmeId || '-'}</td>
                            <td>{shiftTemplates.find((x) => String(x.id) === String(m.shiftTemplateId))?.timetableName || '-'}</td>
                            <td>{m.effectiveFrom}</td>
                            <td>{m.versionNo || 1}</td>
                            <td>{String(m.status || '').toUpperCase() === 'PUBLISHED' ? 'Published' : 'Draft'}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <ArpButton label="Edit" color="info" onClick={() => onEditMapping(m)} />
                                <ArpButton label="Delete" color="danger" onClick={() => onDeleteMapping(m)} />
                                {String(m.status || '').toUpperCase() === 'PUBLISHED' ? (
                                  <ArpButton label="Unpublish" color="secondary" onClick={() => onUnpublishMapping(m)} />
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CCardBody>
            </CCard>
          </>
        )}

        {activeTab === 'REVIEW_PUBLISH' && (
          <>
            <CRow className="g-3 mb-3">
              <CCol md={3}><CCard><CCardBody><div className="text-muted">Total</div><div className="fs-4 fw-bold">{mappingSummary.total}</div></CCardBody></CCard></CCol>
              <CCol md={3}><CCard><CCardBody><div className="text-muted">Published</div><div className="fs-4 fw-bold text-success">{mappingSummary.published}</div></CCardBody></CCard></CCol>
              <CCol md={3}><CCard><CCardBody><div className="text-muted">Draft</div><div className="fs-4 fw-bold text-warning">{mappingSummary.draft}</div></CCardBody></CCard></CCol>
              <CCol md={3}><CCard><CCardBody><div className="text-muted">Conflicts</div><div className="fs-4 fw-bold text-danger">{mappingSummary.conflicts}</div></CCardBody></CCard></CCol>
            </CRow>

            <CCard>
              <CCardHeader><strong>Validation Findings</strong></CCardHeader>
              <CCardBody>
                {conflicts.length === 0 ? (
                  <CAlert color="success" className="mb-0">No conflicts found.</CAlert>
                ) : (
                  <ul className="mb-0">
                    {conflicts.map((c) => <li key={c.id}>{c.message} ({c.id})</li>)}
                  </ul>
                )}
              </CCardBody>
            </CCard>
          </>
        )}
      </CCol>
    </CRow>
  )
}
