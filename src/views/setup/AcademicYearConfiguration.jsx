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

import { ArpButton, ArpIconButton, useArpToast } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const initialAyForm = {
  academicYear: '',
  academicPattern: '', // SEMESTER | TRIMESTER | ANNUAL
  startDate: '',
  endDate: '',
  semesters: '', // numberOfSemesters
  oddEnabled: true,
  oddSemesterBeginDate: '',
  oddSemesterEndDate: '',
  oddChosenSemesters: [1, 3, 5, 7],
  evenEnabled: true,
  evenSemesterBeginDate: '',
  evenSemesterEndDate: '',
  evenChosenSemesters: [2, 4, 6, 8],
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
  const toast = useArpToast()

  const showAlert = (type, msg) => {
    toast.show({
      type,
      message: msg,
      autohide: type === 'success',
      delay: 2500,
    })
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
    const res = await api.get('/api/setup/academic-year', { headers, params: { view: 'annual' } })
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
          annualMode: true,
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
    if (!ayForm.startDate) errs.push('Academic Year Start Date is required')
    if (!ayForm.endDate) errs.push('Academic Year End Date is required')
    if (ayForm.startDate && ayForm.endDate && ayForm.startDate > ayForm.endDate) {
      errs.push('Academic Year Start Date must be before End Date')
    }

    if (!ayForm.oddEnabled && !ayForm.evenEnabled) errs.push('Enable at least one term configuration')
    if (ayForm.oddEnabled) {
      if (!ayForm.oddSemesterBeginDate) errs.push('ODD Semester Begin Date is required')
      if (!ayForm.oddSemesterEndDate) errs.push('ODD Semester End Date is required')
      if (
        ayForm.oddSemesterBeginDate &&
        ayForm.oddSemesterEndDate &&
        ayForm.oddSemesterBeginDate > ayForm.oddSemesterEndDate
      ) {
        errs.push('ODD Semester Begin Date must be before End Date')
      }
      if (!Array.isArray(ayForm.oddChosenSemesters) || !ayForm.oddChosenSemesters.length) {
        errs.push('Choose at least one ODD semester')
      }
    }
    if (ayForm.evenEnabled) {
      if (!ayForm.evenSemesterBeginDate) errs.push('EVEN Semester Begin Date is required')
      if (!ayForm.evenSemesterEndDate) errs.push('EVEN Semester End Date is required')
      if (
        ayForm.evenSemesterBeginDate &&
        ayForm.evenSemesterEndDate &&
        ayForm.evenSemesterBeginDate > ayForm.evenSemesterEndDate
      ) {
        errs.push('EVEN Semester Begin Date must be before End Date')
      }
      if (!Array.isArray(ayForm.evenChosenSemesters) || !ayForm.evenChosenSemesters.length) {
        errs.push('Choose at least one EVEN semester')
      }
    }

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
            String(r?.id) !== String(editingId || ''),
        )
        if (duplicateAy) {
          showAlert('danger', 'Academic Year already exists')
          setLoading(false)
          return
        }

        const payload = {
          institutionId,
          academicYear: normalizedAcademicYear,
          academicPattern: ayForm.academicPattern,
          numberOfSemesters: ayForm.semesters ? Number(ayForm.semesters) : null,
          startDate: ayForm.startDate,
          endDate: ayForm.endDate,
          annualMode: true,
          termConfigurations: [
            ...(ayForm.oddEnabled
              ? [
                  {
                    semesterCategory: 'ODD',
                    semesterBeginDate: ayForm.oddSemesterBeginDate,
                    semesterEndDate: ayForm.oddSemesterEndDate,
                    chosenSemesters: ayForm.oddChosenSemesters,
                  },
                ]
              : []),
            ...(ayForm.evenEnabled
              ? [
                  {
                    semesterCategory: 'EVEN',
                    semesterBeginDate: ayForm.evenSemesterBeginDate,
                    semesterEndDate: ayForm.evenSemesterEndDate,
                    chosenSemesters: ayForm.evenChosenSemesters,
                  },
                ]
              : []),
          ],
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
          e2?.response?.data?.error || 'Academic Year already exists',
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
      startDate: row.startDate ?? '',
      endDate: row.endDate ?? '',
      semesters: row.semesters ?? '',
      oddEnabled: !!row.oddAcademicYearId,
      oddSemesterBeginDate: row.oddSemesterBeginDate ?? '',
      oddSemesterEndDate: row.oddSemesterEndDate ?? '',
      oddChosenSemesters: Array.isArray(row.oddChosenSemesters) ? row.oddChosenSemesters : [],
      evenEnabled: !!row.evenAcademicYearId,
      evenSemesterBeginDate: row.evenSemesterBeginDate ?? '',
      evenSemesterEndDate: row.evenSemesterEndDate ?? '',
      evenChosenSemesters: Array.isArray(row.evenChosenSemesters) ? row.evenChosenSemesters : [],
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
      await api.delete(`/api/setup/academic-year/${selectedAyId}`, { params: { mode: 'annual' } })
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
  const toggleSemester = (termKey, val) => {
    setAyForm((p) => {
      const key = termKey === 'EVEN' ? 'evenChosenSemesters' : 'oddChosenSemesters'
      const current = Array.isArray(p[key]) ? p[key] : []
      const list = current.includes(val)
        ? current.filter((x) => x !== val)
        : [...current, val].sort((a, b) => a - b)
      return { ...p, [key]: list }
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
      { key: 'startDate', label: 'Year Begin', width: 120 },
      { key: 'endDate', label: 'Year End', width: 120 },
      {
        key: 'oddTerm',
        label: 'Odd Term',
        render: (row) =>
          row?.oddAcademicYearId
            ? `${row?.oddSemesterBeginDate || '-'} to ${row?.oddSemesterEndDate || '-'}`
            : '-',
      },
      {
        key: 'evenTerm',
        label: 'Even Term',
        render: (row) =>
          row?.evenAcademicYearId
            ? `${row?.evenSemesterBeginDate || '-'} to ${row?.evenSemesterEndDate || '-'}`
            : '-',
      },
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
              <CAlert color="info" className="mb-3">
                Regulation Maps and Course Offerings are copied using Admission Batch logic for the target Academic Year. The target semester is re-derived from Target Academic Year + Admission Batch instead of copying the old semester number directly.
              </CAlert>
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
                        {a.academicYearLabel || a.academicYear}
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
                        {a.academicYearLabel || a.academicYear}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4} className="d-flex gap-3 flex-wrap">
                  <CFormCheck
                    label="Regulation Maps (Derived)"
                    checked={copyForm.regulationMaps}
                    onChange={(e) => setCopyForm((p) => ({ ...p, regulationMaps: e.target.checked }))}
                    disabled={loading}
                  />
                  <CFormCheck
                    label="Course Offerings (Derived)"
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
                      <CFormLabel>Academic Year Start Date *</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="date"
                        value={ayForm.startDate}
                        onChange={(e) => setAyForm({ ...ayForm, startDate: e.target.value })}
                        disabled={!isEdit}
                      />
                    </CCol>
                    <CCol md={3}>
                      <CFormLabel>Academic Year End Date *</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="date"
                        value={ayForm.endDate}
                        onChange={(e) => setAyForm({ ...ayForm, endDate: e.target.value })}
                        disabled={!isEdit}
                      />
                    </CCol>
                  </CRow>
                  <CRow className="g-3 mb-2">
                    <CCol md={3}>
                      <CFormLabel>ODD Term</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormCheck
                        label="Enable ODD Term"
                        checked={ayForm.oddEnabled}
                        onChange={(e) => setAyForm({ ...ayForm, oddEnabled: e.target.checked })}
                        disabled={!isEdit}
                      />
                    </CCol>
                    <CCol md={3}>
                      <CFormLabel>EVEN Term</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormCheck
                        label="Enable EVEN Term"
                        checked={ayForm.evenEnabled}
                        onChange={(e) => setAyForm({ ...ayForm, evenEnabled: e.target.checked })}
                        disabled={!isEdit}
                      />
                    </CCol>
                  </CRow>
                  {ayForm.oddEnabled && (
                    <CRow className="g-3 mb-2">
                      <CCol md={3}>
                        <CFormLabel>ODD Term Dates *</CFormLabel>
                      </CCol>
                      <CCol md={3}>
                        <CFormInput
                          type="date"
                          value={ayForm.oddSemesterBeginDate}
                          onChange={(e) => setAyForm({ ...ayForm, oddSemesterBeginDate: e.target.value })}
                          disabled={!isEdit}
                        />
                      </CCol>
                      <CCol md={3}>
                        <CFormInput
                          type="date"
                          value={ayForm.oddSemesterEndDate}
                          onChange={(e) => setAyForm({ ...ayForm, oddSemesterEndDate: e.target.value })}
                          disabled={!isEdit}
                        />
                      </CCol>
                      <CCol md={3} className="d-flex gap-3 flex-wrap">
                        {[1, 3, 5, 7].map((sem) => (
                          <CFormCheck
                            key={`odd-${sem}`}
                            id={`odd-sem-${sem}`}
                            label={`Sem ${sem}`}
                            checked={ayForm.oddChosenSemesters.includes(sem)}
                            onChange={() => toggleSemester('ODD', sem)}
                            disabled={!isEdit}
                          />
                        ))}
                      </CCol>
                    </CRow>
                  )}
                  {ayForm.evenEnabled && (
                    <CRow className="g-3 mb-2">
                      <CCol md={3}>
                        <CFormLabel>EVEN Term Dates *</CFormLabel>
                      </CCol>
                      <CCol md={3}>
                        <CFormInput
                          type="date"
                          value={ayForm.evenSemesterBeginDate}
                          onChange={(e) => setAyForm({ ...ayForm, evenSemesterBeginDate: e.target.value })}
                          disabled={!isEdit}
                        />
                      </CCol>
                      <CCol md={3}>
                        <CFormInput
                          type="date"
                          value={ayForm.evenSemesterEndDate}
                          onChange={(e) => setAyForm({ ...ayForm, evenSemesterEndDate: e.target.value })}
                          disabled={!isEdit}
                        />
                      </CCol>
                      <CCol md={3} className="d-flex gap-3 flex-wrap">
                        {[2, 4, 6, 8].map((sem) => (
                          <CFormCheck
                            key={`even-${sem}`}
                            id={`even-sem-${sem}`}
                            label={`Sem ${sem}`}
                            checked={ayForm.evenChosenSemesters.includes(sem)}
                            onChange={() => toggleSemester('EVEN', sem)}
                            disabled={!isEdit}
                          />
                        ))}
                      </CCol>
                    </CRow>
                  )}
                  <CRow className="g-3 mb-2">
                    <CCol xs={12}>
                      <small className="text-muted">
                        Define one June-May Academic Year here. Configure ODD and EVEN term windows inside the same year.
                      </small>
                    </CCol>
                  </CRow>
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
                            {a.academicYearLabel || a.academicYear}
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
