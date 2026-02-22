import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CDropdown,
  CDropdownMenu,
  CDropdownToggle,
  CForm,
  CFormCheck,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * RegulationMapConfiguration.jsx (ARP CoreUI React Pro Standard)
 *
 * ✅ Backend integrated (Option A behavior enforced via RegulationMap table):
 * - One Batch can follow ONLY one Regulation for given (Institution, AcademicYear, Programme, Semester)
 * - If students are already mapped for that tuple, backend blocks update/unmap unless override=true
 *
 * Backend endpoints used:
 * - GET    /api/setup/institution                      (resolve default institutionId)
 * - GET    /api/setup/academic-year?institutionId=...
 * - GET    /api/setup/programme
 * - GET    /api/setup/batch?institutionId=...
 * - GET    /api/setup/regulation
 * - GET    /api/setup/regulation-map?...
 * - POST   /api/setup/regulation-map
 * - DELETE /api/setup/regulation-map/:id?override=false|true
 *
 * Notes:
 * - This screen stores IDs in form state (academicYearId/programmeId/batchId/regulationId)
 * - Semester is stored as number (1,2,3...)
 */

const initialForm = {
  academicYearId: '',
  programmeId: '',
  batchId: '',
  regulationId: '',
  semesterPattern: 'ALL',
  semesterList: [],
}

const unwrapList = (res) => res?.data?.data ?? res?.data ?? []

export default function RegulationMapConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [institutionId, setInstitutionId] = useState('')

  const [form, setForm] = useState(initialForm)

  const [academicYears, setAcademicYears] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [batches, setBatches] = useState([])
  const [regulations, setRegulations] = useState([])

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState(null) // {type:'success'|'danger'|'warning', message:''}

  // Upload ref (reserved for future use)
  const fileRef = useRef(null)

  const showToast = (type, message) => {
    setToast({ type, message })
    // auto clear
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), 3500)
  }

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))


  const onSemesterPatternChange = (e) => {
    const pat = e.target.value
    setForm((p) => {
      const nextList = normalizeSemesterSelection(pat, p.semesterList)
      // If user chose ODD/EVEN and nothing selected yet, auto-select all allowed for faster mapping
      const autoList =
        (pat === 'ODD' || pat === 'EVEN') && nextList.length === 0 ? getAllowedSemesters(pat) : nextList
      return { ...p, semesterPattern: pat, semesterList: autoList }
    })
  }

  const toggleSemester = (n) => {
    setForm((p) => {
      const allowed = new Set(getAllowedSemesters(p.semesterPattern))
      if (!allowed.has(n)) return p
      const set = new Set(p.semesterList || [])
      if (set.has(n)) set.delete(n)
      else set.add(n)
      return { ...p, semesterList: Array.from(set).sort((a, b) => a - b) }
    })
  }

  const clearSemesters = () => setForm((p) => ({ ...p, semesterList: [] }))

  const selectAllAllowedSemesters = () =>
    setForm((p) => ({ ...p, semesterList: getAllowedSemesters(p.semesterPattern) }))

  const selectedSemesterLabel = useMemo(() => {
    const list = Array.isArray(form.semesterList) ? form.semesterList : []
    if (!list.length) return 'Select Semester(s)'
    return `Selected: ${list.map((n) => `Sem-${n}`).join(', ')}`
  }, [form.semesterList])


  const toSemesterInt = (v) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }


  const getProgrammeMaxSemesters = () => {
    const pid = form.programmeId
    if (!pid) return 8
    const p = programmes.find((x) => String(x.id) === String(pid))
    const raw =
      p?.totalSemesters ??
      p?.totalSemester ??
      p?.noOfSemesters ??
      p?.semesters ??
      p?.durationSemesters ??
      8
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : 8
  }

  const getAllowedSemesters = (pattern) => {
    const max = getProgrammeMaxSemesters()
    const all = Array.from({ length: max }, (_, i) => i + 1)
    const pat = String(pattern || 'ALL').toUpperCase()

    if (pat === 'ODD') return all.filter((n) => n % 2 === 1)
    if (pat === 'EVEN') return all.filter((n) => n % 2 === 0)
    // ALL or CUSTOM -> show all
    return all
  }

  const normalizeSemesterSelection = (pattern, list) => {
    const allowed = new Set(getAllowedSemesters(pattern))
    const out = (Array.isArray(list) ? list : [])
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n) && allowed.has(n))
    // de-dup + sort
    return Array.from(new Set(out)).sort((a, b) => a - b)
  }


  /* =========================
     LOADERS
  ========================== */

  const loadInstitutionId = async () => {
    const res = await axios.get('/api/setup/institution')
    const list = unwrapList(res)
    const first = Array.isArray(list) ? list[0] : null
    return first?.id || ''
  }

  const loadAcademicYears = async (instId) => {
    const res = await axios.get('/api/setup/academic-year', { params: { institutionId: instId } })
    const list = unwrapList(res)
    setAcademicYears(Array.isArray(list) ? list : [])
  }

  const loadProgrammes = async (instId) => {
    const res = await axios.get('/api/setup/programme', {
      params: instId ? { institutionId: instId } : undefined,
    })
    const list = unwrapList(res)
    setProgrammes(Array.isArray(list) ? list : [])
  }

  const loadBatches = async (instId) => {
    const res = await axios.get('/api/setup/batch', { params: { institutionId: instId } })
    const list = unwrapList(res)
    setBatches(Array.isArray(list) ? list : [])
  }

  const loadRegulations = async (instId) => {
    const res = await axios.get('/api/setup/regulation', {
      params: instId ? { institutionId: instId } : undefined,
    })
    const list = unwrapList(res)
    setRegulations(Array.isArray(list) ? list : [])
  }

  const loadMappings = async (params = {}) => {
    setLoading(true)
    try {
      const res = await axios.get('/api/setup/regulation-map', { params })
      const list = unwrapList(res)
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      console.error(e)
      showToast('danger', e?.response?.data?.error || e.message || 'Failed to load mappings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const instId = await loadInstitutionId()
        setInstitutionId(instId)

        await Promise.all([
          loadAcademicYears(instId),
          loadProgrammes(instId),
          loadBatches(instId),
          loadRegulations(instId),
        ])

        // initial table load (institutionId filter is recommended)
        if (instId) await loadMappings({ institutionId: instId })
        else await loadMappings()
      } catch (e) {
        console.error(e)
        showToast('danger', e?.response?.data?.error || e.message || 'Failed to initialize')
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* =========================
     HEADER / FORM ACTIONS
  ========================== */

  const onAddNew = () => {
    setIsEdit(true)
    setForm(initialForm)
    setSelectedId(null)
  }

  const onCancel = () => {
    setIsEdit(false)
    setForm(initialForm)
    setSelectedId(null)
  }

  const onSearch = async () => {
    // Filter table based on dropdown selections (optional fields)
    const params = {
      ...(institutionId ? { institutionId } : {}),
      ...(form.academicYearId ? { academicYearId: form.academicYearId } : {}),
      ...(form.programmeId ? { programmeId: form.programmeId } : {}),
      ...(form.batchId ? { batchId: form.batchId } : {}),
      ...(form.regulationId ? { regulationId: form.regulationId } : {}),
      ...(Array.isArray(form.semesterList) && form.semesterList.length === 1
        ? { semester: form.semesterList[0] }
        : {}),
    }
    await loadMappings(params)
  }

  const onSave = async (override = false) => {
    const semesterList = normalizeSemesterSelection(form.semesterPattern, form.semesterList)

    if (!institutionId) return showToast('danger', 'Institution is not available. Please create an Institution first.')
    if (!form.academicYearId) return showToast('danger', 'Academic Year is required')
    if (!form.programmeId) return showToast('danger', 'Programme is required')
    if (!form.batchId) return showToast('danger', 'Batch is required')
    if (!form.regulationId) return showToast('danger', 'Regulation Code is required')
    if (!semesterList.length) return showToast('danger', 'At least one Semester must be selected')

    setSaving(true)
    try {
      const res = await axios.post('/api/setup/regulation-map', {
        institutionId,
        academicYearId: form.academicYearId,
        programmeId: form.programmeId,
        batchId: form.batchId,
        regulationId: form.regulationId,
        semesterPattern: form.semesterPattern,
        semesterList,
        override,
      })

      const mapped = res?.data?.mappedSemesters || semesterList
      const msgPrefix = override ? 'Mapping updated with override' : 'Mapping saved successfully'
      showToast('success', mapped?.length > 1 ? `${msgPrefix} (${mapped.length} semesters)` : msgPrefix)

      setIsEdit(false)
      setSelectedId(null)

      // Refresh table using current filters (so user sees what they searched)
      await onSearch()
    } catch (e) {
      const status = e?.response?.status
      const msg = e?.response?.data?.error || e.message || 'Save failed'

      if (status === 409) {
        const blocked = e?.response?.data?.blockedSemesters
        const extra = Array.isArray(blocked) && blocked.length ? `
Blocked Semesters: ${blocked.map((n) => `Sem-${n}`).join(', ')}` : ''
        const ok = window.confirm(`${msg}${extra}

Do you want to override and force update?`)
        if (ok) return await onSave(true)
        showToast('warning', msg)
        return
      }

      showToast('danger', msg)
    } finally {
      setSaving(false)
    }
  }


  /* =========================
     TABLE ACTIONS
  ========================== */

  const selectedRow = rows.find((r) => String(r.id) === String(selectedId)) || null

  const onView = () => {
    if (!selectedRow) return
    // View just loads into form but keeps disabled
    setForm({
      academicYearId: selectedRow.academicYearId || '',
      programmeId: selectedRow.programmeId || '',
      batchId: selectedRow.batchId || '',
      regulationId: selectedRow.regulationId || '',
      semesterPattern: 'CUSTOM',
      semesterList: selectedRow.semester ? [Number(selectedRow.semester)] : [],
    })
    setIsEdit(false)
  }

  const onEdit = () => {
    if (!selectedRow) return
    setForm({
      academicYearId: selectedRow.academicYearId || '',
      programmeId: selectedRow.programmeId || '',
      batchId: selectedRow.batchId || '',
      regulationId: selectedRow.regulationId || '',
      semesterPattern: 'CUSTOM',
      semesterList: selectedRow.semester ? [Number(selectedRow.semester)] : [],
    })
    setIsEdit(true)
  }

  const onDelete = async (override = false) => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to unmap this regulation from the selected batch?')
    if (!ok) return

    setSaving(true)
    try {
      await axios.delete(`/api/setup/regulation-map/${selectedRow.id}`, { params: { override } })
      showToast('success', override ? 'Unmapped with override' : 'Unmapped successfully')
      setSelectedId(null)
      await onSearch()
    } catch (e) {
      const status = e?.response?.status
      const msg = e?.response?.data?.error || e.message || 'Delete failed'

      if (status === 409) {
        const ok2 = window.confirm(`${msg}\n\nDo you want to override and force unmap?`)
        if (ok2) return await onDelete(true)
        showToast('warning', msg)
        return
      }

      showToast('danger', msg)
    } finally {
      setSaving(false)
    }
  }

  /* =========================
     ArpDataTable CONFIG
  ========================== */

  const columns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true, width: 140 },
      { key: 'regulationCode', label: 'Regulation Code', sortable: true, width: 140, align: 'center' },
      { key: 'programmeCode', label: 'Programme Code', sortable: true, width: 150, align: 'center' },
      { key: 'programme', label: 'Programme', sortable: true, width: 160, align: 'center' },
      { key: 'batch', label: 'Batch', sortable: true, width: 160, align: 'center' },
      { key: 'semester', label: 'Semester', sortable: true, width: 110, align: 'center' },
      { key: 'status', label: 'Map Status', sortable: true, width: 140, align: 'center' },
    ],
    [],
  )

  const headerActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId || saving} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId || saving} />
      <ArpIconButton icon="delete" color="danger" title="Unmap" onClick={() => onDelete(false)} disabled={!selectedId || saving} />
    </div>
  )

  const formDisabled = !isEdit || saving || loading

  return (
    <CRow>
      <CCol xs={12}>
        {/* Toast / Alert */}
        {toast && (
          <CAlert color={toast.type} className="mb-3">
            {toast.message}
          </CAlert>
        )}

        {/* ===================== A) HEADER ACTION CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>REGULATIONS MAP CONFIGURATIONS</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" disabled={saving || loading} />
            </div>
          </CCardHeader>
        </CCard>

        {/* ===================== B) FORM CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Map Regulation to Batch</strong>
            {(loading || saving) && (
              <div className="d-flex align-items-center gap-2">
                <CSpinner size="sm" />
                <span className="text-muted">{saving ? 'Saving...' : 'Loading...'}</span>
              </div>
            )}
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYearId} onChange={onChange('academicYearId')} disabled={formDisabled}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.academicYearLabel || `${y.academicYear}${y.semesterCategory ? ` (${y.semesterCategory})` : ''}`}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeId} onChange={onChange('programmeId')} disabled={formDisabled}>
                    <option value="">Select Programme</option>
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.programmeCode} - {p.programmeName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Batch</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.batchId} onChange={onChange('batchId')} disabled={formDisabled}>
                    <option value="">Select Batch</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batchName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Regulation Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.regulationId} onChange={onChange('regulationId')} disabled={formDisabled}>
                    <option value="">Select Regulation Code</option>
                    {regulations
                      // Optional: if a programme is selected, show only regulations of that programme
                      .filter((r) => (form.programmeId ? String(r.programmeId) === String(form.programmeId) : true))
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.regulationCode}
                        </option>
                      ))}
                  </CFormSelect>
                </CCol>

                
                <CCol md={3}>
                  <CFormLabel>Semester Pattern</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.semesterPattern}
                    onChange={onSemesterPatternChange}
                    disabled={formDisabled || !form.programmeId}
                  >
                    <option value="ALL">All</option>
                    <option value="ODD">Odd</option>
                    <option value="EVEN">Even</option>
                    <option value="CUSTOM">Custom</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Semesters</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CDropdown className="w-100" autoClose="outside">
                    <CDropdownToggle
                      color="light"
                      className="w-100 text-start d-flex justify-content-between align-items-center"
                      disabled={formDisabled || !form.programmeId}
                    >
                      <span className="text-truncate">{selectedSemesterLabel}</span>
                      <span className="ms-2">▾</span>
                    </CDropdownToggle>
                    <CDropdownMenu className="w-100 p-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
                      <div className="d-flex justify-content-between gap-2 mb-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={selectAllAllowedSemesters}
                          disabled={formDisabled || !form.programmeId}
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={clearSemesters}
                          disabled={formDisabled || !form.programmeId}
                        >
                          Clear
                        </button>
                      </div>

                      {getAllowedSemesters(form.semesterPattern).map((n) => (
                        <div key={n} className="px-1 py-1">
                          <CFormCheck
                            id={`sem_${n}`}
                            label={`Sem-${n}`}
                            checked={Array.isArray(form.semesterList) && form.semesterList.includes(n)}
                            onChange={() => toggleSemester(n)}
                            disabled={formDisabled}
                          />
                        </div>
                      ))}
                    </CDropdownMenu>
                  </CDropdown>
                </CCol>
{/* Actions */}
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton
                    label="Search"
                    icon="search"
                    color="primary"
                    type="button"
                    onClick={onSearch}
                    disabled={saving || loading}
                    title="Search"
                  />
                  <ArpButton
                    label="Save"
                    icon="save"
                    color="success"
                    type="button"
                    onClick={() => onSave(false)}
                    disabled={!isEdit || saving || loading}
                    title="Save"
                  />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} disabled={saving || loading} title="Cancel" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ===================== C) TABLE CARD (ArpDataTable) ===================== */}
        <ArpDataTable
          title="STATUS OF MAP REGULATION"
          rows={rows}
          columns={columns}
          loading={loading}
          headerActions={headerActions}
          selection={{
            type: 'radio',
            selected: selectedId,
            onChange: (value) => setSelectedId(value),
            key: 'id',
            headerLabel: 'Select',
            width: 60,
            name: 'mapRegSelect',
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          defaultPageSize={10}
          searchable
          searchPlaceholder="Search..."
          rowKey="id"
        />
      </CCol>
    </CRow>
  )
}
