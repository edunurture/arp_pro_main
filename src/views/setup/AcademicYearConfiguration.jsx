import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
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

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const initialAyForm = {
  academicYear: '',
  academicPattern: '', // SEMESTER | TRIMESTER | ANNUAL
  semesterCategory: '', // ODD | EVEN
  semesterBeginDate: '',
  semesterEndDate: '',
  chosenSemesters: [], // number[]
  startDate: '',
  endDate: '',
  semesters: '', // numberOfSemesters
}

const initialCalForm = {
  academicYearId: '',
  calendarPatternType: '', // DAY_ORDER_PATTERN | DAY_PATTERN
  minDayOrder: '',
  maxDayOrder: '',
  chosenDays: [], // string[]
  calendarPattern: '',
  day: '',
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const normalizeAcademicYear = (value) =>
  String(value || '')
    .trim()
    .replace(/\s*-\s*/, ' - ')

export default function AcademicYearConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [mode, setMode] = useState(null) // 'AY' | 'CAL' | null
  const [editingId, setEditingId] = useState(null)

  const [ayForm, setAyForm] = useState(initialAyForm)
  const [calForm, setCalForm] = useState(initialCalForm)

  const [selectedAyId, setSelectedAyId] = useState(null)
  const [selectedCalId, setSelectedCalId] = useState(null)

  const [institutions, setInstitutions] = useState([])
  const [institutionId, setInstitutionId] = useState('')

  const [ayRows, setAyRows] = useState([])
  const [calRows, setCalRows] = useState([])

  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ type: '', msg: '' })
  const [copyOpen, setCopyOpen] = useState(false)
  const [copyForm, setCopyForm] = useState({
    sourceAcademicYearId: '',
    targetAcademicYearId: '',
    regulationMaps: true,
    courseOfferings: true,
    calendarPatterns: false,
  })

  const isAyMode = mode === 'AY'
  const isCalMode = mode === 'CAL'

  const api = axios.create({ baseURL: API_BASE })

  const showAlert = (type, msg) => {
    setAlert({ type, msg })
    window.clearTimeout(showAlert._t)
    showAlert._t = window.setTimeout(() => setAlert({ type: '', msg: '' }), 2500)
  }

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
      const list = Array.isArray(payload?.data) ? payload.data : []
      setInstitutions(list)
      const firstId = list?.[0]?.id || ''
      if (firstId && !institutionId) setInstitutionId(String(firstId))
      return { list, firstId }
    } catch (e) {
      console.error(e)
      setInstitutions([])
      showAlert('danger', 'Unable to load Institutions.')
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
      if (inst) await loadAcademicYears(inst)
      else setAyRows([])
      await loadCalendarPatterns()
    } catch (e) {
      console.error(e)
      showAlert('danger', 'Failed to load master data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    if (institutionId) loadAcademicYears(institutionId)
  }, [institutionId])

  // ---------------------------
  // Selection Logic
  // ---------------------------
  const handleAySelection = (id) => {
    // Toggle logic: If clicking the selected one, deselect it
    const newId = String(selectedAyId) === String(id) ? null : String(id)
    setSelectedAyId(newId)
    if (newId) {
      setSelectedCalId(null) // Mutually exclusive tables
      setSelectedId(newId)
    } else {
      setSelectedId(null)
    }
  }

  const handleCalSelection = (id) => {
    const newId = String(selectedCalId) === String(id) ? null : String(id)
    setSelectedCalId(newId)
    if (newId) {
      setSelectedAyId(null) // Mutually exclusive tables
      setSelectedId(newId)
    } else {
      setSelectedId(null)
    }
  }

  // ---------------------------
  // Unified Actions
  // ---------------------------
  const hasSelection = selectedAyId || selectedCalId

  const handleCommonView = () => {
    if (selectedAyId) onViewAy()
    else if (selectedCalId) onViewCal()
  }

  const handleCommonEdit = () => {
    if (selectedAyId) onEditAy()
    else if (selectedCalId) onEditCal()
  }

  const handleCommonDelete = () => {
    if (selectedAyId) onDeleteAy()
    else if (selectedCalId) onDeleteCal()
  }

  // ---------------------------
  // Actions: Add
  // ---------------------------
  const startAddAy = () => {
    setMode('AY')
    setIsEdit(true)
    setEditingId(null)
    setAyForm(initialAyForm)
    setSelectedAyId(null)
    setSelectedCalId(null)
  }

  const startAddCal = () => {
    setMode('CAL')
    setIsEdit(true)
    setEditingId(null)
    setCalForm(initialCalForm)
    setSelectedAyId(null)
    setSelectedCalId(null)
  }

  const onCancel = () => resetForm()

  const onCopyConfig = async () => {
    const sourceAcademicYearId = String(copyForm.sourceAcademicYearId || '').trim()
    const targetAcademicYearId = String(copyForm.targetAcademicYearId || '').trim()
    const hasAnyOption = copyForm.regulationMaps || copyForm.courseOfferings || copyForm.calendarPatterns

    if (!institutionId) return showAlert('danger', 'Institution is required')
    if (!sourceAcademicYearId || !targetAcademicYearId) {
      return showAlert('danger', 'Select both Source and Target Academic Year')
    }
    if (sourceAcademicYearId === targetAcademicYearId) {
      return showAlert('danger', 'Source and Target Academic Year cannot be the same')
    }
    if (!hasAnyOption) return showAlert('danger', 'Select at least one configuration to copy')

    setLoading(true)
    try {
      const res = await api.post(
        '/api/setup/academic-year/copy-config',
        {
          sourceAcademicYearId,
          targetAcademicYearId,
          options: {
            regulationMaps: !!copyForm.regulationMaps,
            courseOfferings: !!copyForm.courseOfferings,
            calendarPatterns: !!copyForm.calendarPatterns,
          },
        },
        { headers: { 'x-institution-id': institutionId } },
      )
      const summary = res?.data?.data?.summary || {}
      const rm = summary?.regulationMaps || {}
      const co = summary?.courseOfferings || {}
      const cal = summary?.calendarPatterns || {}
      showAlert(
        'success',
        `Copied successfully. RM: ${rm.created || 0} created, ${rm.reused || 0} reused | CO: ${co.created || 0} created, ${co.updated || 0} updated | CAL: ${cal.created || 0} created`,
      )
      setCopyOpen(false)
      setCopyForm({
        sourceAcademicYearId: '',
        targetAcademicYearId: '',
        regulationMaps: true,
        courseOfferings: true,
        calendarPatterns: false,
      })
      await loadAll()
    } catch (e) {
      showAlert('danger', e?.response?.data?.error || 'Copy failed')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------
  // Save (API)
  // ---------------------------
  const validateAyForm = () => {
    const errs = []
    if (!ayForm.academicYear?.trim()) errs.push('Academic Year is required')
    if (ayForm.academicYear?.trim() && !/^\d{4}\s*-\s*\d{4}$/.test(ayForm.academicYear.trim())) {
      errs.push('Academic Year must be in format: YYYY - YYYY')
    }
    if (!ayForm.semesterCategory) errs.push('Semester Category (ODD/EVEN) is required')
    if (!ayForm.semesterBeginDate) errs.push('Semester Begin Date is required')
    if (!ayForm.semesterEndDate) errs.push('Semester End Date is required')
    if (
      ayForm.semesterBeginDate &&
      ayForm.semesterEndDate &&
      ayForm.semesterBeginDate > ayForm.semesterEndDate
    )
      errs.push('Semester Begin Date must be before Semester End Date')

    const chosen = Array.isArray(ayForm.chosenSemesters) ? ayForm.chosenSemesters : []
    if (!chosen.length) errs.push('Choose Semesters is required')

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
      if (Number(calForm.minDayOrder) > Number(calForm.maxDayOrder))
        errs.push('Minimum Day Order must be <= Maximum Day Order')
    }
    if (t === 'DAY_PATTERN') {
      if (!calForm.chosenDays?.length) errs.push('Choose Days is required for Day Pattern')
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
          setLoading(false)
          return
        }

        const normalizedAcademicYear = normalizeAcademicYear(ayForm.academicYear)
        const duplicateAy = ayRows.find(
          (r) =>
            normalizeAcademicYear(r?.academicYear) === normalizedAcademicYear &&
            String(r?.semesterCategory || '') === String(ayForm.semesterCategory || '') &&
            String(r?.id) !== String(editingId || ''),
        )
        if (duplicateAy) {
          showAlert('danger', 'Academic Year already exists for selected Semester Category')
          setLoading(false)
          return
        }

        const payload = {
          institutionId,
          academicYear: normalizedAcademicYear,
          semesterCategory: ayForm.semesterCategory,
          semesterBeginDate: ayForm.semesterBeginDate,
          semesterEndDate: ayForm.semesterEndDate,
          chosenSemesters: ayForm.chosenSemesters,
          academicPattern: ayForm.academicPattern,
          numberOfSemesters: ayForm.semesters ? Number(ayForm.semesters) : null,
          startDate: ayForm.startDate || null,
          endDate: ayForm.endDate || null,
        }

        if (editingId) {
          await api.put(`/api/setup/academic-year/${editingId}`, payload, {
            headers: { 'x-institution-id': institutionId },
          })
          showAlert('success', 'Academic Year updated')
        } else {
          await api.post('/api/setup/academic-year', payload, {
            headers: { 'x-institution-id': institutionId },
          })
          showAlert('success', 'Academic Year created')
        }
        await loadAcademicYears(institutionId)
      }

      if (mode === 'CAL') {
        const errs = validateCalForm()
        if (errs.length) {
          showAlert('danger', errs[0])
          setLoading(false)
          return
        }

        const payload = {
          academicYearId: calForm.academicYearId,
          calendarPattern: calForm.calendarPatternType,
          minimumDayOrder: calForm.minDayOrder ? Number(calForm.minDayOrder) : null,
          maxDayOrder: calForm.maxDayOrder ? Number(calForm.maxDayOrder) : null,
          chosenDays: calForm.chosenDays,
          day: calForm.calendarPatternType === 'DAY_PATTERN' ? calForm.chosenDays.join(', ') : null,
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
      const status = Number(e2?.response?.status || 0)
      if (status === 409) {
        showAlert(
          'danger',
          e2?.response?.data?.error || 'Academic Year already exists for selected Semester Category',
        )
      } else {
        showAlert('danger', e2?.response?.data?.error || 'Save failed')
      }
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------
  // View/Edit (AY)
  // ---------------------------
  const onViewAy = () => {
    if (!selectedAyId) {
      showAlert('danger', 'Select an Academic Year row first')
      return
    }
    const row = ayRows.find((r) => String(r.id) === String(selectedAyId))
    if (!row) {
      showAlert('danger', 'Selected Academic Year is not available in current list')
      return
    }
    setMode('AY')
    setIsEdit(false)
    setEditingId(String(row.id))
    setAyForm({
      academicYear: row.academicYear ?? '',
      academicPattern: row.academicPattern ?? '',
      semesterCategory: row.semesterCategory ?? '',
      semesterBeginDate: row.semesterBeginDate ? row.semesterBeginDate.slice(0, 10) : '',
      semesterEndDate: row.semesterEndDate ? row.semesterEndDate.slice(0, 10) : '',
      chosenSemesters: Array.isArray(row.chosenSemesters)
        ? row.chosenSemesters
        : String(row.chosenSemesters || '')
            .split(',')
            .map(Number)
            .filter((n) => n),
      startDate: row.startDate ?? '',
      endDate: row.endDate ?? '',
      semesters: row.semesters ?? '',
    })
  }
  const onEditAy = () => {
    onViewAy()
    setIsEdit(true)
  }
  const onDeleteAy = async () => {
    if (!selectedAyId) return
    if (!window.confirm('Are you sure you want to delete this Academic Year?')) return
    setLoading(true)
    try {
      await api.delete(`/api/setup/academic-year/${selectedAyId}`)
      showAlert('success', 'Academic Year deleted')
      setSelectedAyId(null)
      setSelectedId(null)
      await loadAcademicYears(institutionId)
    } catch (e) {
      console.error(e)
      showAlert('danger', e?.response?.data?.error || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------
  // View/Edit (CAL)
  // ---------------------------
  const onViewCal = () => {
    if (!selectedCalId) return
    const row = calRows.find((r) => String(r.id) === String(selectedCalId))
    if (!row) return
    setMode('CAL')
    setIsEdit(false)
    setEditingId(String(row.id))
    const type = row.calendarPattern?.includes('DAY_ORDER') ? 'DAY_ORDER_PATTERN' : 'DAY_PATTERN'
    setCalForm({
      academicYearId: row.academicYearId ?? '',
      calendarPatternType: type,
      minDayOrder: row.minimumDayOrder ?? '',
      maxDayOrder: row.maxDayOrder ?? '',
      chosenDays: row.day ? row.day.split(',').map((s) => s.trim()) : [],
      calendarPattern: row.calendarPattern ?? '',
      day: row.day ?? '',
    })
  }
  const onEditCal = () => {
    onViewCal()
    setIsEdit(true)
  }
  const onDeleteCal = async () => {
    if (!selectedCalId) return
    if (!window.confirm('Are you sure you want to delete this Calendar Pattern?')) return
    setLoading(true)
    try {
      await api.delete(`/api/setup/academic-calendar-pattern/${selectedCalId}`)
      showAlert('success', 'Calendar Pattern deleted')
      setSelectedCalId(null)
      setSelectedId(null)
      await loadCalendarPatterns()
    } catch (e) {
      console.error(e)
      showAlert('danger', e?.response?.data?.error || 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------
  // Helpers for Render
  // ---------------------------
  const toggleSemester = (val) => {
    setAyForm((p) => {
      const list = p.chosenSemesters.includes(val)
        ? p.chosenSemesters.filter((x) => x !== val)
        : [...p.chosenSemesters, val].sort((a, b) => a - b)
      return { ...p, chosenSemesters: list }
    })
  }

  const toggleDay = (val) => {
    setCalForm((p) => {
      const list = p.chosenDays.includes(val)
        ? p.chosenDays.filter((x) => x !== val)
        : [...p.chosenDays, val]
      return { ...p, chosenDays: list }
    })
  }

  // ---------------------------
  // Render
  // ---------------------------

  const commonActionButtons = (
    <div className="d-flex gap-2">
      <ArpIconButton
        icon="view"
        color="purple"
        title="View"
        onClick={handleCommonView}
        disabled={!hasSelection}
      />
      <ArpIconButton
        icon="edit"
        color="info"
        title="Edit"
        onClick={handleCommonEdit}
        disabled={!hasSelection}
      />
      <ArpIconButton
        icon="delete"
        color="danger"
        title="Delete"
        onClick={handleCommonDelete}
        disabled={!hasSelection}
      />
    </div>
  )

  // Standard ArpDataTable Columns (Selection is now handled via props)
  const ayColumns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true },
      { key: 'semesterCategory', label: 'Category', sortable: true },
      { key: 'semesterBeginDate', label: 'Sem Begin', width: 120 },
      { key: 'semesterEndDate', label: 'Sem End', width: 120 },
    ],
    [],
  )

  const calColumns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true },
      { key: 'calendarPattern', label: 'Pattern', sortable: true },
      { key: 'minimumDayOrder', label: 'Min Day', sortable: true },
      { key: 'day', label: 'Days', sortable: true },
    ],
    [],
  )

  return (
    <>
      {alert.msg ? (
        <CAlert color={alert.type || 'info'} dismissible onClose={() => setAlert({ type: '', msg: '' })}>
          {alert.msg}
        </CAlert>
      ) : null}

      {/* Top Card: Actions & Institution */}
      <CCard className="mb-3">
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <strong>ACADEMIC YEAR CONFIGURATION</strong>
            {commonActionButtons}
          </div>

          <div className="d-flex gap-2 align-items-center flex-wrap">
            <ArpButton label="Add Academic Year" icon="add" color="purple" onClick={startAddAy} />
            <ArpButton label="Add Calendar Pattern" icon="add" color="info" onClick={startAddCal} />
            <ArpButton
              label={copyOpen ? 'Close Copy' : 'Copy ODD/EVEN Config'}
              icon={copyOpen ? 'cancel' : 'save'}
              color="secondary"
              onClick={() => setCopyOpen((p) => !p)}
            />
          </div>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-3 align-items-center">
            <CCol md={6}>
              <CFormLabel className="mb-0">Institution</CFormLabel>
              <CFormSelect
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                disabled={loading || !institutions.length}
              >
                {institutions.length ? (
                  <option value="">-- Select Institution --</option>
                ) : (
                  <option value="">No Institution Available</option>
                )}
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.code} - {i.name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>
          {copyOpen ? (
            <>
              <hr />
              <CRow className="g-3 align-items-end">
                <CCol md={4}>
                  <CFormLabel>Source Academic Year</CFormLabel>
                  <CFormSelect
                    value={copyForm.sourceAcademicYearId}
                    onChange={(e) => setCopyForm((p) => ({ ...p, sourceAcademicYearId: e.target.value }))}
                    disabled={loading}
                  >
                    <option value="">-- Select Source --</option>
                    {ayRows.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.academicYearLabel || `${a.academicYear}${a.semesterCategory ? ` (${a.semesterCategory})` : ''}`}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Target Academic Year</CFormLabel>
                  <CFormSelect
                    value={copyForm.targetAcademicYearId}
                    onChange={(e) => setCopyForm((p) => ({ ...p, targetAcademicYearId: e.target.value }))}
                    disabled={loading}
                  >
                    <option value="">-- Select Target --</option>
                    {ayRows.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.academicYearLabel || `${a.academicYear}${a.semesterCategory ? ` (${a.semesterCategory})` : ''}`}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4} className="d-flex gap-3 flex-wrap">
                  <CFormCheck
                    label="Regulation Maps"
                    checked={copyForm.regulationMaps}
                    onChange={(e) => setCopyForm((p) => ({ ...p, regulationMaps: e.target.checked }))}
                    disabled={loading}
                  />
                  <CFormCheck
                    label="Course Offerings"
                    checked={copyForm.courseOfferings}
                    onChange={(e) => setCopyForm((p) => ({ ...p, courseOfferings: e.target.checked }))}
                    disabled={loading}
                  />
                  <CFormCheck
                    label="Calendar Patterns"
                    checked={copyForm.calendarPatterns}
                    onChange={(e) => setCopyForm((p) => ({ ...p, calendarPatterns: e.target.checked }))}
                    disabled={loading}
                  />
                </CCol>
                <CCol xs={12} className="d-flex justify-content-end">
                  <ArpButton label="Copy Configuration" icon="save" color="success" onClick={onCopyConfig} disabled={loading} />
                </CCol>
              </CRow>
            </>
          ) : null}
        </CCardBody>
      </CCard>

      {/* Detail Forms */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>
            {isAyMode
              ? 'ACADEMIC YEAR DETAILS'
              : isCalMode
                ? 'ACADEMIC CALENDAR PATTERN DETAILS'
                : 'SELECT AN ACTION'}
          </strong>
        </CCardHeader>
        <CCardBody>
          {!mode ? (
            <div className="text-muted">Select "Add" or select a record to "View/Edit".</div>
          ) : (
            <CForm onSubmit={onSave}>
              {/* === ACADEMIC YEAR FORM === */}
              {isAyMode && (
                <>
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel>Academic Year *</CFormLabel>
                    </CCol>
                    <CCol md={9}>
                      <CFormInput
                        value={ayForm.academicYear}
                        onChange={(e) => setAyForm({ ...ayForm, academicYear: e.target.value })}
                        disabled={!isEdit}
                        placeholder="2023 - 2024"
                      />
                    </CCol>
                  </CRow>
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel>Semester Category *</CFormLabel>
                    </CCol>
                    <CCol md={9}>
                      <CFormSelect
                        value={ayForm.semesterCategory}
                        onChange={(e) => setAyForm({ ...ayForm, semesterCategory: e.target.value })}
                        disabled={!isEdit}
                      >
                        <option value="">-- Select --</option>
                        <option value="ODD">ODD</option>
                        <option value="EVEN">EVEN</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel>Semester Begin Date *</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="date"
                        value={ayForm.semesterBeginDate}
                        onChange={(e) =>
                          setAyForm({ ...ayForm, semesterBeginDate: e.target.value })
                        }
                        disabled={!isEdit}
                      />
                    </CCol>
                    <CCol md={3}>
                      <CFormLabel>Semester End Date *</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="date"
                        value={ayForm.semesterEndDate}
                        onChange={(e) => setAyForm({ ...ayForm, semesterEndDate: e.target.value })}
                        disabled={!isEdit}
                      />
                    </CCol>
                  </CRow>
                  {ayForm.semesterCategory && (
                    <CRow className="g-3 mb-2">
                      <CCol md={3}>
                        <CFormLabel>Choose Semesters *</CFormLabel>
                      </CCol>
                      <CCol md={9} className="d-flex gap-3">
                        {(ayForm.semesterCategory === 'ODD' ? [1, 3, 5, 7] : [2, 4, 6, 8]).map(
                          (sem) => (
                            <CFormCheck
                              key={sem}
                              id={`sem-${sem}`}
                              label={`Sem ${sem}`}
                              checked={ayForm.chosenSemesters.includes(sem)}
                              onChange={() => toggleSemester(sem)}
                              disabled={!isEdit}
                            />
                          ),
                        )}
                      </CCol>
                    </CRow>
                  )}
                  {/* Optional Legacy Fields */}
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel>Academic Pattern</CFormLabel>
                    </CCol>
                    <CCol md={9}>
                      <CFormSelect
                        value={ayForm.academicPattern}
                        onChange={(e) => setAyForm({ ...ayForm, academicPattern: e.target.value })}
                        disabled={!isEdit}
                      >
                        <option value="">-- Select --</option>
                        <option value="SEMESTER">Semester</option>
                        <option value="TRIMESTER">Trimester</option>
                        <option value="ANNUAL">Annual</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>
                </>
              )}

              {/* === CALENDAR PATTERN FORM === */}
              {isCalMode && (
                <>
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel>Academic Year *</CFormLabel>
                    </CCol>
                    <CCol md={9}>
                      <CFormSelect
                        value={calForm.academicYearId}
                        onChange={(e) => setCalForm({ ...calForm, academicYearId: e.target.value })}
                        disabled={!isEdit}
                      >
                        <option value="">-- Select --</option>
                        {ayRows.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.academicYearLabel || `${a.academicYear}${a.semesterCategory ? ` (${a.semesterCategory})` : ''}`}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                  </CRow>
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel>Calendar Pattern *</CFormLabel>
                    </CCol>
                    <CCol md={9}>
                      <CFormSelect
                        value={calForm.calendarPatternType}
                        onChange={(e) =>
                          setCalForm({ ...calForm, calendarPatternType: e.target.value })
                        }
                        disabled={!isEdit}
                      >
                        <option value="">-- Select --</option>
                        <option value="DAY_ORDER_PATTERN">Day Order Pattern</option>
                        <option value="DAY_PATTERN">Day Pattern</option>
                      </CFormSelect>
                    </CCol>
                  </CRow>

                  {calForm.calendarPatternType === 'DAY_ORDER_PATTERN' && (
                    <CRow className="g-3 mb-2">
                      <CCol md={3}>
                        <CFormLabel>Minimum Day Order</CFormLabel>
                      </CCol>
                      <CCol md={3}>
                        <CFormInput
                          type="number"
                          value={calForm.minDayOrder}
                          onChange={(e) => setCalForm({ ...calForm, minDayOrder: e.target.value })}
                          disabled={!isEdit}
                        />
                      </CCol>
                      <CCol md={3}>
                        <CFormLabel>Maximum Day Order</CFormLabel>
                      </CCol>
                      <CCol md={3}>
                        <CFormInput
                          type="number"
                          value={calForm.maxDayOrder}
                          onChange={(e) => setCalForm({ ...calForm, maxDayOrder: e.target.value })}
                          disabled={!isEdit}
                        />
                      </CCol>
                    </CRow>
                  )}

                  {calForm.calendarPatternType === 'DAY_PATTERN' && (
                    <CRow className="g-3 mb-2">
                      <CCol md={3}>
                        <CFormLabel>Choose Days</CFormLabel>
                      </CCol>
                      <CCol md={9} className="d-flex flex-wrap gap-3">
                        {DAYS_OF_WEEK.map((d) => (
                          <CFormCheck
                            key={d}
                            id={`day-${d}`}
                            label={d}
                            checked={calForm.chosenDays.includes(d)}
                            onChange={() => toggleDay(d)}
                            disabled={!isEdit}
                          />
                        ))}
                      </CCol>
                    </CRow>
                  )}
                </>
              )}

              <div className="d-flex justify-content-end gap-2 mt-3">
                <ArpButton
                  label="Save"
                  type="submit"
                  icon="save"
                  color="success"
                  disabled={loading}
                />
                <ArpButton label="Cancel" icon="cancel" color="danger" onClick={onCancel} />
              </div>
            </CForm>
          )}
        </CCardBody>
      </CCard>

      {/* ArpDataTable: Academic Year List */}
      <ArpDataTable
        title="ACADEMIC YEAR LIST"
        rows={ayRows}
        columns={ayColumns}
        loading={loading}
        rowKey="id"
        selection={{
          type: 'radio',
          selected: selectedAyId,
          onChange: (val) => handleAySelection(val),
          key: 'id',
          headerLabel: 'Select',
          name: 'aySelectionGroup',
        }}
      />

      {/* ArpDataTable: Calendar Pattern List */}
      <ArpDataTable
        title="ACADEMIC CALENDAR PATTERN LIST"
        rows={calRows}
        columns={calColumns}
        loading={loading}
        rowKey="id"
        selection={{
          type: 'radio',
          selected: selectedCalId,
          onChange: (val) => handleCalSelection(val),
          key: 'id',
          headerLabel: 'Select',
          name: 'calSelectionGroup',
        }}
      />
    </>
  )
}
