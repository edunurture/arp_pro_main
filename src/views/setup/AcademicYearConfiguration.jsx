import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  CAlert,
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
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * AcademicYearConfiguration.jsx (ARP CoreUI React Pro Standard)
 * ✅ End-to-End Integrated:
 * - Academic Year CRUD (API + DB)
 * - Academic Calendar Pattern CRUD (API + DB)
 * - Template Download buttons (backend Excel templates)
 *
 * Backend endpoints used:
 * - /api/setup/academic-year
 * - /api/setup/academic-calendar-pattern
 * - /api/setup/institution (to resolve institutionId)
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const initialAyForm = {
  academicYear: '',
  academicPattern: '', // SEMESTER | TRIMESTER | ANNUAL
  // New (as per Academic Year Configuration.xlsx)
  semesterCategory: '', // ODD | EVEN
  semesterBeginDate: '',
  semesterEndDate: '',
  chosenSemesters: [], // number[]
  // Existing
  startDate: '',
  endDate: '',
  semesters: '', // numberOfSemesters (optional - can be derived)
}

const initialCalForm = {
  academicYearId: '',
  // New type (Day Order Pattern / Day Pattern)
  calendarPatternType: '', // DAY_ORDER_PATTERN | DAY_PATTERN
  // Day Order Pattern
  minDayOrder: '',
  maxDayOrder: '',
  // Day Pattern
  chosenDays: [], // string[]
  // Backward compatible field (optional)
  calendarPattern: '',
  day: '',
}

export default function AcademicYearConfiguration() {
  // ARP mandatory state pattern
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // local mode for which form is active
  const [mode, setMode] = useState(null) // 'AY' | 'CAL' | null
  const [editingId, setEditingId] = useState(null)

  // forms
  const [ayForm, setAyForm] = useState(initialAyForm)
  const [calForm, setCalForm] = useState(initialCalForm)

  // table selections
  const [selectedAyId, setSelectedAyId] = useState(null)
  const [selectedCalId, setSelectedCalId] = useState(null)

  // master data
  const [institutions, setInstitutions] = useState([])
  const [institutionId, setInstitutionId] = useState('')

  // table rows
  const [ayRows, setAyRows] = useState([])
  const [calRows, setCalRows] = useState([])

  // loading + alerts
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ type: '', msg: '' })

  const isAyMode = mode === 'AY'
  const isCalMode = mode === 'CAL'

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    // auto-hide after a short time
    window.clearTimeout(showAlert._t)
    showAlert._t = window.setTimeout(() => setAlert({ type: '', msg: '' }), 2500)
  }

  const api = axios.create({
    baseURL: API_BASE,
  })

  const resetForm = () => {
    setAyForm(initialAyForm)
    setCalForm(initialCalForm)
    setEditingId(null)
    setIsEdit(false)
    setMode(null)
  }

  // ---------------------------
  // Loaders
  // ---------------------------
  
  
  const loadInstitutions = async () => {
    try {
      const res = await api.get('/api/setup/institution')
      const payload = res?.data

      // Support many response shapes:
      // 1) { success: true, data: [...] }
      // 2) { data: [...] }
      // 3) { success: true, data: { data: [...] } }
      // 4) { success: true, data: { items: [...] } } / { rows: [...] }
      // 5) [...]
      const list =
        Array.isArray(payload?.data) ? payload.data :
        Array.isArray(payload?.data?.data) ? payload.data.data :
        Array.isArray(payload?.data?.items) ? payload.data.items :
        Array.isArray(payload?.data?.rows) ? payload.data.rows :
        Array.isArray(payload?.institutions) ? payload.institutions :
        Array.isArray(payload) ? payload :
        []

      setInstitutions(list)

      const first = list?.[0] || null
      const firstId = first ? String(first.id ?? first.institutionId ?? first.institution_id ?? '') : ''

      // Pick first institution by default (common in single-tenant dev)
      if (firstId && !institutionId) setInstitutionId(firstId)

      return { list, firstId }
    } catch (e) {
      console.error(e)
      setInstitutions([])
      // Show a meaningful message (helps when baseURL/CORS is wrong)
      showAlert('danger', e?.response?.data?.message || 'Unable to load Institutions. Check backend URL / CORS.')
      return { list: [], firstId: '' }
    }
  }

  const loadAcademicYears = async (instId) => {
    const headers = instId ? { 'x-institution-id': instId } : undefined
    const res = await api.get('/api/setup/academic-year', { headers })
    setAyRows(res?.data?.data ?? [])
  }

  const loadCalendarPatterns = async () => {
    const res = await api.get('/api/setup/academic-calendar-pattern')
    setCalRows(res?.data?.data ?? [])
  }

  
  const loadAll = async () => {
    setLoading(true)
    try {
      const { firstId } = await loadInstitutions()
      const inst = String(institutionId || firstId || '')
      if (inst) {
        await loadAcademicYears(inst)
      } else {
        setAyRows([])
      }
      await loadCalendarPatterns()
    } catch (e) {
      console.error(e)
      showAlert('danger', e?.response?.data?.message || 'Failed to load Academic Year master data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // reload AY list when institution changes
  useEffect(() => {
    if (!institutionId) return
    ;(async () => {
      try {
        await loadAcademicYears(institutionId)
      } catch (e) {
        console.error(e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId])

  // ---------------------------
  // Actions: Add
  // ---------------------------
  const startAddAy = () => {
    setMode('AY')
    setIsEdit(true)
    setEditingId(null)
    setAyForm(initialAyForm)
  }

  const startAddCal = () => {
    setMode('CAL')
    setIsEdit(true)
    setEditingId(null)
    setCalForm(initialCalForm)
  }

  const onCancel = () => resetForm()

  // ---------------------------
  // Save (API)
  // ---------------------------
  
  const validateAyForm = () => {
    const errs = []
    if (!ayForm.academicYear?.trim()) errs.push('Academic Year is required')
    if (!ayForm.semesterCategory) errs.push('Semester Category (ODD/EVEN) is required')
    if (!ayForm.semesterBeginDate) errs.push('Semester Begin Date is required')
    if (!ayForm.semesterEndDate) errs.push('Semester End Date is required')
    if (ayForm.semesterBeginDate && ayForm.semesterEndDate && ayForm.semesterBeginDate > ayForm.semesterEndDate)
      errs.push('Semester Begin Date must be before Semester End Date')

    // Choose Semesters validation
    const chosen = Array.isArray(ayForm.chosenSemesters) ? ayForm.chosenSemesters : []
    if (!chosen.length) errs.push('Choose Semesters is required')

    const cat = String(ayForm.semesterCategory || '').toUpperCase()
    if (chosen.length) {
      const invalid = chosen.some((n) => {
        const v = Number(n)
        if (!Number.isFinite(v) || v <= 0 || !Number.isInteger(v)) return True
        if (cat === 'ODD') return v % 2 === 0
        if (cat === 'EVEN') return v % 2 !== 0
        return False
      })
      if (invalid) errs.push(`Choose Semesters must match ${cat} category`)
    }

    // Optional existing fields
    if (ayForm.startDate && ayForm.endDate && ayForm.startDate > ayForm.endDate) errs.push('Start Date must be before End Date')
    if (ayForm.semesters && Number(ayForm.semesters) <= 0) errs.push('Semesters must be a positive number')

    return errs
  }

  
  const validateCalForm = () => {
    const errs = []
    if (!calForm.academicYearId) errs.push('Academic Year is required')
    if (!calForm.calendarPatternType) errs.push('Calendar Pattern is required')

    const t = String(calForm.calendarPatternType || '')
    if (t === 'DAY_ORDER_PATTERN') {
      if (!calForm.minDayOrder) errs.push('Minimum Day Order is required')
      if (!calForm.maxDayOrder) errs.push('Maximum Day Order is required')
      if (calForm.minDayOrder && Number(calForm.minDayOrder) <= 0) errs.push('Minimum Day Order must be a positive number')
      if (calForm.maxDayOrder && Number(calForm.maxDayOrder) <= 0) errs.push('Maximum Day Order must be a positive number')
      if (calForm.minDayOrder && calForm.maxDayOrder && Number(calForm.minDayOrder) > Number(calForm.maxDayOrder))
        errs.push('Minimum Day Order must be <= Maximum Day Order')
    }

if (t === 'DAY_PATTERN') {
      const days = Array.isArray(calForm.chosenDays) ? calForm.chosenDays : []
      if (!days.length) errs.push('Choose Days is required for Day Pattern')
    }

    return errs
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (!isEdit || !mode) return

    setLoading(true)
    try {
      if (mode === 'AY') {
        const errs = validateAyForm()
        if (errs.length) {
          showAlert('danger', errs[0])
          return
        }

        const payload = {
          institutionId,
          academicYear: ayForm.academicYear.trim(),

          // New fields
          semesterCategory: ayForm.semesterCategory || null,
          semesterBeginDate: ayForm.semesterBeginDate || null,
          semesterEndDate: ayForm.semesterEndDate || null,
          chosenSemesters: Array.isArray(ayForm.chosenSemesters)
            ? ayForm.chosenSemesters.map((n) => Number(n)).filter((n) => Number.isFinite(n))
            : [],

          // Existing (optional)
          academicPattern: ayForm.academicPattern || null,
          numberOfSemesters: ayForm.semesters ? Number(ayForm.semesters) : null,
          startDate: ayForm.startDate || null,
          endDate: ayForm.endDate || null,
        }

if (editingId) {
          await api.put(`/api/setup/academic-year/${editingId}`, payload, { headers: { 'x-institution-id': institutionId } })
          showAlert('success', 'Academic Year updated')
        } else {
          await api.post('/api/setup/academic-year', payload, { headers: { 'x-institution-id': institutionId } })
          showAlert('success', 'Academic Year created')
        }

        await loadAcademicYears(institutionId)
      }

if (mode === 'CAL') {
        const errs = validateCalForm()
        if (errs.length) {
          showAlert('danger', errs[0])
          return
        }

        const payload = {
          academicYearId: calForm.academicYearId,

          // New type + conditional fields
          calendarPatternType: calForm.calendarPatternType,
          minDayOrder: calForm.minDayOrder ? Number(calForm.minDayOrder) : null,
          maxDayOrder: calForm.maxDayOrder ? Number(calForm.maxDayOrder) : null,
          chosenDays: Array.isArray(calForm.chosenDays) ? calForm.chosenDays : [],

          // Backward compatibility
          calendarPattern: calForm.calendarPatternType || calForm.calendarPattern || null,
          day: calForm.day || null,
        }

if (editingId) {
          await api.put(`/api/setup/academic-calendar-pattern/${editingId}`, payload)
          showAlert('success', 'Calendar Pattern updated')
        } else {
          await api.post('/api/setup/academic-calendar-pattern', payload)
          showAlert('success', 'Calendar Pattern created')
        }

        await loadCalendarPatterns()
      }

      resetForm()
    } catch (e2) {
      console.error(e2)
      const msg = e2?.response?.data?.error || e2?.response?.data?.message || 'Save failed'
      showAlert('danger', msg)
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------
  // View/Edit/Delete (AY)
  // ---------------------------
  const onViewAy = () => {
    if (!selectedAyId) return
    const row = ayRows.find((r) => String(r.id) === String(selectedAyId))
    if (!row) return
    setMode('AY')
    setIsEdit(false)
    setEditingId(String(row.id))
    setAyForm({
      academicYear: row.academicYear ?? '',
      academicPattern: row.academicPattern ?? '',
      startDate: row.startDate ?? '',
      endDate: row.endDate ?? '',
      semesters: row.semesters ?? '',
    })
  }

  const onEditAy = () => {
    if (!selectedAyId) return
    const row = ayRows.find((r) => String(r.id) === String(selectedAyId))
    if (!row) return
    setMode('AY')
    setIsEdit(true)
    setEditingId(String(row.id))
    setAyForm({
      academicYear: row.academicYear ?? '',
      academicPattern: row.academicPattern ?? '',
      startDate: row.startDate ?? '',
      endDate: row.endDate ?? '',
      semesters: row.semesters ?? '',
    })
  }

  const onDeleteAy = async () => {
    if (!selectedAyId) return
    setLoading(true)
    try {
      await api.delete(`/api/setup/academic-year/${selectedAyId}`)
      showAlert('success', 'Academic Year deleted')
      setSelectedAyId(null)
      if (String(selectedId) === String(selectedAyId)) setSelectedId(null)
      resetForm()
      await loadAcademicYears(institutionId)
    } catch (e) {
      console.error(e)
      showAlert('danger', e?.response?.data?.error || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------
  // View/Edit/Delete (CAL)
  // ---------------------------
  const onViewCal = () => {
    if (!selectedCalId) return
    const row = calRows.find((r) => String(r.id) === String(selectedCalId))
    if (!row) return
    setMode('CAL')
    setIsEdit(false)
    setEditingId(String(row.id))
    setCalForm({
      academicYearId: row.academicYearId ?? '',
      calendarPattern: row.calendarPattern ?? '',
      minDayOrder: row.minimumDayOrder ?? '',
      day: row.day ?? '',
    })
  }

  const onEditCal = () => {
    if (!selectedCalId) return
    const row = calRows.find((r) => String(r.id) === String(selectedCalId))
    if (!row) return
    setMode('CAL')
    setIsEdit(true)
    setEditingId(String(row.id))
    setCalForm({
      academicYearId: row.academicYearId ?? '',
      calendarPattern: row.calendarPattern ?? '',
      minDayOrder: row.minimumDayOrder ?? '',
      day: row.day ?? '',
    })
  }

  const onDeleteCal = async () => {
    if (!selectedCalId) return
    setLoading(true)
    try {
      await api.delete(`/api/setup/academic-calendar-pattern/${selectedCalId}`)
      showAlert('success', 'Calendar Pattern deleted')
      setSelectedCalId(null)
      if (String(selectedId) === String(selectedCalId)) setSelectedId(null)
      resetForm()
      await loadCalendarPatterns()
    } catch (e) {
      console.error(e)
      showAlert('danger', e?.response?.data?.error || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------
  // Templates
  // ---------------------------
  const downloadAyTemplate = () => {
    window.open(`${API_BASE}/api/setup/academic-year/template`, '_blank')
  }
  const downloadCalTemplate = () => {
    window.open(`${API_BASE}/api/setup/academic-calendar-pattern/template`, '_blank')
  }

  /* =========================
     TABLE CONFIGS (ArpDataTable)
  ========================== */

  const ayColumns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true },
      { key: 'academicPattern', label: 'Academic Pattern', sortable: true },
      { key: 'startDate', label: 'Start Date', sortable: true, width: 140, align: 'center' },
      { key: 'endDate', label: 'End Date', sortable: true, width: 140, align: 'center' },
      { key: 'semesters', label: 'Semesters', sortable: true, width: 110, align: 'center', sortType: 'number' },
    ],
    [],
  )

  const calColumns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true },
      { key: 'calendarPattern', label: 'Calendar Pattern', sortable: true },
      { key: 'minimumDayOrder', label: 'Min Day Order', sortable: true, width: 140, align: 'center', sortType: 'number' },
      { key: 'day', label: 'Day', sortable: true, width: 160 },
    ],
    [],
  )

  const ayHeaderActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onViewAy} disabled={!selectedAyId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEditAy} disabled={!selectedAyId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDeleteAy} disabled={!selectedAyId} />
    </div>
  )

  const calHeaderActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onViewCal} disabled={!selectedCalId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEditCal} disabled={!selectedCalId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDeleteCal} disabled={!selectedCalId} />
    </div>
  )

  return (
    <>
      {/* ===================== A) HEADER ACTION CARD ===================== */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>ACADEMIC YEAR CONFIGURATION</strong>

          <div className="d-flex gap-2 align-items-center">
            <ArpButton label="Add Academic Year" icon="add" color="purple" onClick={startAddAy} />
            <ArpButton label="Add Calendar Pattern" icon="add" color="info" onClick={startAddCal} />
            <ArpButton label="AY Template" icon="download" color="success" onClick={downloadAyTemplate} />
            <ArpButton label="Calendar Template" icon="download" color="success" onClick={downloadCalTemplate} />
          </div>
        </CCardHeader>

        <CCardBody>
          {alert?.msg ? (
            <CAlert color={alert.type || 'info'} className="mb-2">
              {alert.msg}
            </CAlert>
          ) : null}

          <CRow className="g-3 align-items-center">
            <CCol md={6}>
              <CFormLabel className="mb-0">Institution</CFormLabel>
              <CFormSelect value={institutionId} onChange={(e) => setInstitutionId(e.target.value)} disabled={loading ? true : !institutions?.length}>
                {institutions?.length ? <option value="">-- Select Institution --</option> : <option value="">No Institution Available</option>}
                {institutions?.map((i) => (
                  <option key={i.id ?? i.institutionId ?? i.institution_id} value={i.id ?? i.institutionId ?? i.institution_id}>
                    {i.code} - {i.name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={6} className="d-flex justify-content-end">
              {loading ? (
                <div className="d-flex align-items-center gap-2">
                  <CSpinner size="sm" />
                  <span>Loading...</span>
                </div>
              ) : null}
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ===================== B) FORM CARD ===================== */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>
            {isAyMode ? 'ACADEMIC YEAR DETAILS' : isCalMode ? 'ACADEMIC CALENDAR PATTERN DETAILS' : 'SELECT AN ACTION (ADD / VIEW / EDIT)'}
          </strong>
        </CCardHeader>

        <CCardBody>
          {!mode ? (
            <div className="text-muted">Click “Add Academic Year” or “Add Calendar Pattern” to begin.</div>
          ) : (
            <CForm onSubmit={onSave}>
              {isAyMode ? (
                <>
                  {/* Row 1 */}
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel className="col-form-label">Academic Year *</CFormLabel>
                    </CCol>
                    <CCol md={9}>
                      <CFormInput
                        value={ayForm.academicYear}
                        onChange={(e) => setAyForm((p) => ({ ...p, academicYear: e.target.value }))}
                        placeholder="2025 - 2026"
                        disabled={!isEdit}
                      />
                    </CCol>
                  </CRow>

                  {/* Row 2 */}
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel className="col-form-label">Academic Pattern *</CFormLabel>
                    </CCol>
                    <CCol md={9}>
                      <CFormSelect
                        value={ayForm.academicPattern}
                        onChange={(e) => setAyForm((p) => ({ ...p, academicPattern: e.target.value }))}
                        disabled={!isEdit}
                      >
                        <option value="">-- Select --</option>
                        <option value="SEMESTER">Semester</option>
                        <option value="TRIMESTER">Trimester</option>
                        <option value="ANNUAL">Annual</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  {/* Row 3 */}
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel className="col-form-label">Start Date</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="date"
                        value={ayForm.startDate}
                        onChange={(e) => setAyForm((p) => ({ ...p, startDate: e.target.value }))}
                        disabled={!isEdit}
                      />
                    </CCol>

                    <CCol md={3}>
                      <CFormLabel className="col-form-label">End Date</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="date"
                        value={ayForm.endDate}
                        onChange={(e) => setAyForm((p) => ({ ...p, endDate: e.target.value }))}
                        disabled={!isEdit}
                      />
                    </CCol>
                  </CRow>

                  {/* Row 4 */}
                  <CRow className="g-3">
                    <CCol md={3}>
                      <CFormLabel className="col-form-label">Semesters</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="number"
                        min={1}
                        value={ayForm.semesters}
                        onChange={(e) => setAyForm((p) => ({ ...p, semesters: e.target.value }))}
                        placeholder="2"
                        disabled={!isEdit}
                      />
                    </CCol>
                  </CRow>
                </>
              ) : null}

              {isCalMode ? (
                <>
                  {/* Row 1 */}
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel className="col-form-label">Academic Year *</CFormLabel>
                    </CCol>
                    <CCol md={9}>
                      <CFormSelect
                        value={calForm.academicYearId}
                        onChange={(e) => setCalForm((p) => ({ ...p, academicYearId: e.target.value }))}
                        disabled={!isEdit}
                      >
                        <option value="">-- Select --</option>
                        {ayRows.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.academicYear}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  {/* Row 2 */}
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel className="col-form-label">Calendar Pattern *</CFormLabel>
                    </CCol>
                    <CCol md={9}>
                      <CFormSelect
                        value={calForm.calendarPatternType}
                        onChange={(e) => setCalForm((p) => ({ ...p, calendarPatternType: e.target.value }))}
                        disabled={!isEdit}
                      >
                        <option value="">-- Select --</option>
                        <option value="DAY_ORDER_PATTERN">Day Order Pattern</option>
                        <option value="DAY_PATTERN">Day Pattern</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  {/* Row 3 */}
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel className="col-form-label">Min Day Order</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="number"
                        min={1}
                        value={calForm.minDayOrder}
                        onChange={(e) => setCalForm((p) => ({ ...p, minDayOrder: e.target.value }))}
                        disabled={!isEdit}
                      />
                    </CCol>
                  </CRow>
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel className="col-form-label">Maximum Day Order</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="number"
                        min={1}
                        value={calForm.maxDayOrder}
                        onChange={(e) => setCalForm((p) => ({ ...p, maxDayOrder: e.target.value }))}
                        disabled={!isEdit || calForm.calendarPatternType !== 'DAY_ORDER_PATTERN'}
                      />
                    </CCol>
                  </CRow>


                  {/* Row 4 */}
                  <CRow className="g-3">
                    <CCol md={3}>
                      <CFormLabel className="col-form-label">
                        Choose Days {String(calForm.calendarPatternType || '').toLowerCase().includes('week') ? '*' : ''}
                      </CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormSelect
                        value={calForm.chosenDays}
                        onChange={(e) => setCalForm((p) => ({ ...p, chosenDays: Array.from(e.target.selectedOptions).map(o => o.value) }))}
                        multiple
                        disabled={!isEdit || calForm.calendarPatternType !== 'DAY_PATTERN'}
                      >
                        <option value="">-- Select --</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>
                </>
              ) : null}

              <div className="d-flex justify-content-end gap-2 mt-4">
                {isEdit ? (
                  <ArpButton type="submit" label={editingId ? 'Update' : 'Save'} icon="save" color="success" disabled={loading} />
                ) : null}
                <ArpButton label="Cancel" icon="close" color="danger" onClick={onCancel} />
              </div>
            </CForm>
          )}
        </CCardBody>
      </CCard>

      {/* ===================== C) TABLE CARD(S) ===================== */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>ACADEMIC YEAR LIST</strong>
          {ayHeaderActions}
        </CCardHeader>

        <CCardBody>
          <ArpDataTable
            columns={ayColumns}
            rows={ayRows}
            rowKey="id"
            selectable
            selectedRowId={selectedAyId}
            onSelectionChange={(id) => {
              setSelectedAyId(id)
              setSelectedId(id)
            }}
          />
        </CCardBody>
      </CCard>

      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>ACADEMIC CALENDAR PATTERN LIST</strong>
          {calHeaderActions}
        </CCardHeader>

        <CCardBody>
          <ArpDataTable
            columns={calColumns}
            rows={calRows}
            rowKey="id"
            selectable
            selectedRowId={selectedCalId}
            onSelectionChange={(id) => {
              setSelectedCalId(id)
              setSelectedId(id)
            }}
          />
        </CCardBody>
      </CCard>
    </>
  )
}