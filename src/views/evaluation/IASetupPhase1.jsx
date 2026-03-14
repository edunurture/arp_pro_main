import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CRow,
} from '@coreui/react-pro'

import { ArpButton, useArpToast } from '../../components/common'
import api from '../../services/apiClient'
import { IA_PHASE_KEYS, getIAWorkflowPhase, saveIAWorkflowPhase } from '../../services/iaWorkflowService'
import IAWorkflowScopeBanner from './IAWorkflowScopeBanner'

const DRAFT_KEY = 'arp.evaluation.ia.phase1.setup.draft.v2'
const ACTIVE_BUNDLE_KEY = 'arp.evaluation.ia.active-bundle.v2'

const initialForm = {
  institutionId: '',
  academicYearId: '',
  semesterCategory: '',
  workspaceType: 'SINGLE',
  bundlePreset: 'MANUAL',
  chosenSemester: '',
  chosenSemesters: [],
  scopeMode: 'SINGLE',
  programmeId: '',
  programmeIds: [],
  includeAllProgrammes: false,
  programmeScopeKey: '',
  examName: '',
  iaCycle: '',
  examWindowName: '',
  examMonthYear: '',
  windowStartDate: '',
  windowEndDate: '',
  slotDurationMinutes: '',
  fnStartTime: '09:00',
  anStartTime: '13:30',
  courseSelectionMode: 'all',
  instructions: '',
  ruleNoStudentClash: true,
  ruleNoFacultyClash: true,
  ruleMinGapEnabled: true,
  minGapHours: '24',
  status: 'DRAFT',
}

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const requiredFieldLabels = {
  institutionId: 'Institution',
  academicYearId: 'Academic Year',
  iaCycle: 'Name of the Examination',
  examWindowName: 'Exam Window Name',
  examMonthYear: 'Exam Month & Year',
  windowStartDate: 'Window Start Date',
  windowEndDate: 'Window End Date',
  slotDurationMinutes: 'Slot Duration',
  fnStartTime: 'FN Start Time',
  anStartTime: 'AN Start Time',
}

const BUNDLE_PRESET_VALUES = {
  MANUAL: 'MANUAL',
  ODD: 'ODD',
  EVEN: 'EVEN',
}

const normalizeSemesterList = (values) =>
  [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => Number(String(value).trim()))
      .filter((value) => Number.isFinite(value) && value > 0),
  )].sort((a, b) => a - b)

const derivePresetSemesters = (preset, availableSemesters) => {
  if (preset === BUNDLE_PRESET_VALUES.ODD) return availableSemesters.filter((semester) => semester % 2 === 1)
  if (preset === BUNDLE_PRESET_VALUES.EVEN) return availableSemesters.filter((semester) => semester % 2 === 0)
  return []
}

const buildLegacySemester = (workspaceType, chosenSemester, chosenSemesters) => {
  if (workspaceType === 'BUNDLE') {
    return String(normalizeSemesterList(chosenSemesters)[0] || '')
  }
  return String(chosenSemester || '').trim()
}

const hasLockedScope = (form) =>
  Boolean(String(form.institutionId || '').trim()) &&
  Boolean(String(form.academicYearId || '').trim()) &&
  Boolean(String(form.workspaceType || '').trim()) &&
  Boolean(String(form.iaCycle || form.examName || '').trim()) &&
  (
    (form.workspaceType === 'BUNDLE' && normalizeSemesterList(form.chosenSemesters).length > 0) ||
    (form.workspaceType !== 'BUNDLE' && Boolean(String(form.chosenSemester || '').trim()))
  ) &&
  (
    form.scopeMode === 'ALL' ||
    (form.scopeMode === 'MULTIPLE' && Array.isArray(form.programmeIds) && form.programmeIds.length > 0) ||
    (form.scopeMode === 'SINGLE' && Boolean(String(form.programmeId || '').trim()))
  )

const bundleScopeMatches = (bundle = null, phase = {}) => {
  if (!bundle) return false
  const activeSemesters = normalizeSemesterList(bundle?.chosenSemesters || []).join(',')
  const phaseSemesters = normalizeSemesterList(phase?.chosenSemesters || phase?.workflowScope?.chosenSemesters || []).join(',')
  return (
    String(bundle?.institutionId || '') === String(phase?.institutionId || phase?.workflowScope?.institutionId || '') &&
    String(bundle?.academicYearId || '') === String(phase?.academicYearId || phase?.workflowScope?.academicYearId || '') &&
    String(bundle?.programmeId || '') === String(phase?.programmeScopeKey || phase?.programmeId || phase?.workflowScope?.programmeId || '') &&
    String(bundle?.iaCycle || bundle?.examName || '') === String(phase?.iaCycle || phase?.examName || phase?.workflowScope?.iaCycle || phase?.workflowScope?.examName || '') &&
    String(bundle?.workspaceType || 'SINGLE') === String(phase?.workspaceType || phase?.workflowScope?.workspaceType || 'SINGLE') &&
    activeSemesters === phaseSemesters
  )
}

const IASetupPhase1 = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [scopeLocked, setScopeLocked] = useState(false)
  const [activeBundle, setActiveBundle] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [examNameOptions, setExamNameOptions] = useState([])
  const [saving, setSaving] = useState(false)
  const toast = useArpToast()
  const [editMode, setEditMode] = useState(false)
  const programmeScrollRef = useRef(null)
  const phaseSubmitted = String(form.status || '').toUpperCase() === 'READY_FOR_PHASE_2'
  const phaseLocked = phaseSubmitted && !editMode

  const showToast = (type, message) => {
    toast.show({
      type,
      message,
      autohide: type === 'success',
      delay: 4500,
    })
  }

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  const buildProgrammeScopeKey = (scopeMode, programmeId, programmeIds) => {
    if (scopeMode === 'ALL') return '__ALL__'
    if (scopeMode === 'MULTIPLE') {
      const ids = [...new Set((programmeIds || []).map((x) => String(x).trim()).filter(Boolean))].sort()
      if (ids.length === 0) return ''
      return `__MULTI__:${ids.join(',')}`
    }
    return String(programmeId || '').trim()
  }
  const toggleSemester = (semester, checked) => {
    setForm((prev) => {
      const current = normalizeSemesterList(prev.chosenSemesters)
      const next = checked
        ? normalizeSemesterList([...current, semester])
        : current.filter((value) => Number(value) !== Number(semester))
      return {
        ...prev,
        chosenSemesters: next.map(String),
      }
    })
  }

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/api/setup/institution')
      const list = unwrapList(res)
      setInstitutions(list)
      if (!form.institutionId && list.length > 0) {
        setField('institutionId', String(list[0].id))
      }
    } catch {
      setInstitutions([])
    }
  }

  const loadAcademicYears = async (institutionId) => {
    if (!institutionId) return setAcademicYears([])
    try {
      const res = await api.get('/api/setup/academic-year', {
        headers: { 'x-institution-id': institutionId },
      })
      setAcademicYears(unwrapList(res))
    } catch {
      setAcademicYears([])
    }
  }

  const loadProgrammes = async (institutionId) => {
    if (!institutionId) return setProgrammes([])
    try {
      const res = await api.get('/api/setup/programme')
      const list = unwrapList(res).filter((x) => String(x.institutionId) === String(institutionId))
      setProgrammes(list)
    } catch {
      setProgrammes([])
    }
  }

  const loadExamNames = async (institutionId) => {
    if (!institutionId) return setExamNameOptions([])
    try {
      const res = await api.get('/api/setup/cia-components', {
        params: { institutionId },
      })
      const rows = Array.isArray(res?.data?.data?.components) ? res.data.data.components : []
      const opts = [...new Set(rows.map((x) => String(x?.examName || '').trim()).filter(Boolean))]
      setExamNameOptions(opts)
    } catch {
      setExamNameOptions([])
    }
  }

  useEffect(() => {
    const activeBundleRaw = window.sessionStorage.getItem(ACTIVE_BUNDLE_KEY)
    if (!activeBundleRaw) {
      window.sessionStorage.removeItem(DRAFT_KEY)
      navigate('/evaluation/ia/workspace', {
        replace: true,
        state: { workspaceNotice: 'Select or create an IA Workspace first.' },
      })
      return
    }
    try {
      setActiveBundle(JSON.parse(activeBundleRaw))
    } catch {
      setActiveBundle(null)
    }
    const saved = window.sessionStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const parsedBundle = JSON.parse(activeBundleRaw)
        if (bundleScopeMatches(parsedBundle, parsed)) {
          setForm((prev) => ({ ...prev, ...parsed }))
          if (hasLockedScope(parsed)) setScopeLocked(true)
        }
      } catch {
        // Ignore invalid draft payload.
      }
    }
    ;(async () => {
      try {
        const active = JSON.parse(activeBundleRaw)
        const remote = await getIAWorkflowPhase(IA_PHASE_KEYS.PHASE_1_SETUP, {
          institutionId: active?.institutionId || '',
          academicYearId: active?.academicYearId || '',
          chosenSemester: active?.chosenSemester || '',
          chosenSemesters: normalizeSemesterList(active?.chosenSemesters || []).map(String),
          programmeId: active?.programmeId || '',
          iaCycle: active?.iaCycle || active?.examName || '',
          examName: active?.examName || active?.iaCycle || '',
        })
        if (remote?.payload && typeof remote.payload === 'object') {
          const payload = remote.payload
          const chosenSemesters = normalizeSemesterList(
            Array.isArray(payload?.chosenSemesters)
              ? payload.chosenSemesters
              : payload?.workflowScope?.chosenSemesters,
          ).map(String)
          setForm((prev) => ({
            ...prev,
            ...payload,
            workspaceType: payload?.workspaceType || payload?.workflowScope?.workspaceType || 'SINGLE',
            bundlePreset: payload?.bundlePreset || payload?.workflowScope?.bundlePreset || 'MANUAL',
            scopeMode:
              payload?.programmeScopeKey === '__ALL__' ||
              payload?.programmeId === '__ALL__' ||
              payload?.workflowScope?.programmeId === '__ALL__'
                ? 'ALL'
                : payload?.scopeMode || 'SINGLE',
            chosenSemesters,
            includeAllProgrammes:
              payload?.programmeScopeKey === '__ALL__' ||
              payload?.programmeId === '__ALL__' ||
              payload?.workflowScope?.programmeId === '__ALL__' ||
              Boolean(payload?.includeAllProgrammes),
            programmeIds: Array.isArray(payload?.programmeIds)
              ? payload.programmeIds
              : [],
            programmeScopeKey:
              payload?.programmeScopeKey || remote.programmeId || prev.programmeScopeKey,
            programmeId:
              payload?.programmeId || remote.programmeId || prev.programmeId,
            examName: payload?.examName || payload?.iaCycle || prev.examName,
            iaCycle: payload?.iaCycle || payload?.examName || prev.iaCycle,
            status: remote.workflowStatus || remote.payload.status || prev.status,
          }))
          if (hasLockedScope(payload)) setScopeLocked(true)
        } else if (active) {
          setForm((prev) => ({
            ...prev,
            institutionId: active.institutionId || prev.institutionId,
            institutionName: active.institutionName || prev.institutionName,
            academicYearId: active.academicYearId || prev.academicYearId,
            academicYearLabel: active.academicYearLabel || prev.academicYearLabel,
            semesterCategory: active.semesterCategory || prev.semesterCategory,
            workspaceType: active.workspaceType || prev.workspaceType,
            bundlePreset: active.bundlePreset || prev.bundlePreset,
            chosenSemester: active.chosenSemester || prev.chosenSemester,
            chosenSemesters: normalizeSemesterList(active.chosenSemesters || []).map(String),
            programmeId: active.programmeId || prev.programmeId,
            programmeIds: Array.isArray(active.programmeIds) ? active.programmeIds : prev.programmeIds,
            programmeScopeKey: active.programmeId || prev.programmeScopeKey,
            examName: active.examName || active.iaCycle || prev.examName,
            iaCycle: active.iaCycle || active.examName || prev.iaCycle,
          }))
          setScopeLocked(true)
        }
      } catch {
        // Keep session/local state as fallback.
      }
    })()
    loadInstitutions()
  }, [])

  const resolveActiveScope = () => {
    const chosenSemestersFromActive = Array.isArray(activeBundle?.chosenSemesters)
      ? activeBundle.chosenSemesters.map(String).filter(Boolean)
      : []
    const chosenSemesters = chosenSemestersFromActive.length > 0
      ? chosenSemestersFromActive
      : form.workspaceType === 'BUNDLE'
        ? normalizeSemesterList(form.chosenSemesters).map(String)
        : normalizeSemesterList([form.chosenSemester]).map(String)
    const scopeMode = activeBundle?.programmeId === '__ALL__'
      ? 'ALL'
      : String(activeBundle?.workspaceType || form.workspaceType).toUpperCase() === 'BUNDLE' && Array.isArray(activeBundle?.programmeIds) && activeBundle.programmeIds.length > 1
        ? 'MULTIPLE'
        : form.scopeMode
    const includeAllProgrammes = activeBundle?.programmeId === '__ALL__' || form.includeAllProgrammes
    const resolvedProgrammeIds = includeAllProgrammes
      ? programmes.map((programme) => String(programme.id))
      : Array.isArray(activeBundle?.programmeIds) && activeBundle.programmeIds.length > 0
        ? activeBundle.programmeIds.map(String)
        : Array.isArray(form.programmeIds)
          ? form.programmeIds.map(String)
          : []
    const programmeScopeKey = String(activeBundle?.programmeId || '').trim()
      || buildProgrammeScopeKey(scopeMode, form.programmeId, resolvedProgrammeIds)
    const legacyChosenSemester = String(activeBundle?.chosenSemester || '').trim()
      || buildLegacySemester(form.workspaceType, form.chosenSemester, chosenSemesters)

    return {
      scopeMode,
      includeAllProgrammes,
      resolvedProgrammeIds,
      programmeScopeKey,
      chosenSemesters,
      legacyChosenSemester,
      workspaceType: activeBundle?.workspaceType || form.workspaceType,
    }
  }

  const resolvedValidationScope = useMemo(() => resolveActiveScope(), [activeBundle, form, programmes])

  useEffect(() => {
    if (!form.institutionId) return
    loadAcademicYears(form.institutionId)
    loadProgrammes(form.institutionId)
    loadExamNames(form.institutionId)
  }, [form.institutionId])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(form.academicYearId)) || null,
    [academicYears, form.academicYearId],
  )

  const chosenSemesterOptions = useMemo(() => {
    if (!selectedAcademicYear) return []
    const fromChosen = Array.isArray(selectedAcademicYear?.chosenSemesters)
      ? selectedAcademicYear.chosenSemesters
      : typeof selectedAcademicYear?.chosenSemesters === 'string'
        ? selectedAcademicYear.chosenSemesters.split(',')
        : []
    return [...new Set(
      fromChosen.map((v) => Number(String(v).trim())).filter((n) => Number.isFinite(n) && n > 0),
    )].sort((a, b) => a - b)
  }, [selectedAcademicYear])

  useEffect(() => {
    const semesterCategory = String(selectedAcademicYear?.semesterCategory || '').toUpperCase()
    setForm((prev) => {
      const normalizedChosenSemesters = normalizeSemesterList(prev.chosenSemesters)
        .filter((semester) => chosenSemesterOptions.includes(semester))
        .map(String)
      const hasSemester = chosenSemesterOptions.some((s) => String(s) === String(prev.chosenSemester))
      const nextPresetSemesters =
        prev.workspaceType === 'BUNDLE' && prev.bundlePreset !== BUNDLE_PRESET_VALUES.MANUAL
          ? derivePresetSemesters(prev.bundlePreset, chosenSemesterOptions).map(String)
          : normalizedChosenSemesters
      const nextChosenSemester = buildLegacySemester(
        prev.workspaceType,
        hasSemester ? prev.chosenSemester : '',
        nextPresetSemesters,
      )
      return {
        ...prev,
        semesterCategory,
        chosenSemester: nextChosenSemester,
        chosenSemesters: nextPresetSemesters,
      }
    })
  }, [selectedAcademicYear, chosenSemesterOptions])

  const validationErrors = useMemo(() => {
    const errors = []
    Object.keys(requiredFieldLabels).forEach((key) => {
      if (!String(form[key] || '').trim()) errors.push(requiredFieldLabels[key])
    })
    if (form.workspaceType === 'SINGLE' && !String(form.chosenSemester || '').trim()) {
      errors.push('Chosen Semester')
    }
    if (form.workspaceType === 'BUNDLE' && normalizeSemesterList(resolvedValidationScope.chosenSemesters).length === 0) {
      errors.push('At least one Semester (Bundle mode)')
    }
    if (form.workspaceType === 'SINGLE' && form.scopeMode === 'SINGLE' && !String(form.programmeId || '').trim()) {
      errors.push('Programme')
    }
    if (
      form.workspaceType === 'SINGLE' &&
      form.scopeMode === 'MULTIPLE' &&
      (!Array.isArray(form.programmeIds) || form.programmeIds.length === 0)
    ) {
      errors.push('At least one Programme (Multiple mode)')
    }
    if (
      form.workspaceType === 'BUNDLE' &&
      !resolvedValidationScope.includeAllProgrammes &&
      (!Array.isArray(resolvedValidationScope.resolvedProgrammeIds) || resolvedValidationScope.resolvedProgrammeIds.length === 0)
    ) {
      errors.push('At least one Programme (Bundle mode)')
    }
    if (form.workspaceType === 'BUNDLE' && form.bundlePreset === BUNDLE_PRESET_VALUES.ODD) {
      const invalid = normalizeSemesterList(resolvedValidationScope.chosenSemesters).some((semester) => semester % 2 === 0)
      if (invalid) errors.push('Bundle semesters must be odd')
    }
    if (form.workspaceType === 'BUNDLE' && form.bundlePreset === BUNDLE_PRESET_VALUES.EVEN) {
      const invalid = normalizeSemesterList(resolvedValidationScope.chosenSemesters).some((semester) => semester % 2 !== 0)
      if (invalid) errors.push('Bundle semesters must be even')
    }
    if (form.windowStartDate && form.windowEndDate && form.windowEndDate < form.windowStartDate) {
      errors.push('Window End Date must be after Window Start Date')
    }
    const slotHours = Number(form.slotDurationMinutes)
    if (!Number.isFinite(slotHours) || slotHours <= 0) {
      errors.push('Slot Duration should be greater than 0 hour')
    }
    if (form.ruleMinGapEnabled) {
      const minGap = Number(form.minGapHours)
      if (!Number.isFinite(minGap) || minGap <= 0) errors.push('Minimum Gap (Hours) should be greater than 0')
    }
    return errors
  }, [form, resolvedValidationScope])

  const completion = useMemo(() => {
    const requiredKeys = Object.keys(requiredFieldLabels)
    const dynamicRequired = [...requiredKeys]
    dynamicRequired.push(form.workspaceType === 'BUNDLE' ? '__chosenSemesters__' : '__chosenSemester__')
    dynamicRequired.push('__programmeScope__')
    const done = dynamicRequired.filter((key) => {
      if (key === '__chosenSemester__') return Boolean(String(form.chosenSemester || '').trim())
      if (key === '__chosenSemesters__') return normalizeSemesterList(form.chosenSemesters).length > 0
      if (key === '__programmeScope__') {
        if (form.workspaceType === 'BUNDLE') {
          return form.includeAllProgrammes || (Array.isArray(form.programmeIds) && form.programmeIds.length > 0)
        }
        if (form.scopeMode === 'ALL') return true
        if (form.scopeMode === 'MULTIPLE') return Array.isArray(form.programmeIds) && form.programmeIds.length > 0
        return Boolean(String(form.programmeId || '').trim())
      }
      return Boolean(String(form[key] || '').trim())
    }).length
    return Math.round((done / dynamicRequired.length) * 100)
  }, [form])

  const onSaveDraft = async () => {
    setSaving(true)
    try {
      const activeScope = resolveActiveScope()
      const resolvedProgrammeIds = activeScope.resolvedProgrammeIds
      const effectiveScopeMode = activeScope.scopeMode
      const programmeScopeKey = activeScope.programmeScopeKey
      const resolvedChosenSemesters = activeScope.chosenSemesters
      const legacyChosenSemester = activeScope.legacyChosenSemester
      const updatedAt = new Date().toISOString()
      const institutionName =
        institutions.find((x) => String(x.id) === String(form.institutionId))?.name || ''
      const academicYearLabel =
        academicYears.find((x) => String(x.id) === String(form.academicYearId))?.academicYear ||
        academicYears.find((x) => String(x.id) === String(form.academicYearId))?.academicYearName ||
        ''
      const payload = {
        ...form,
        workspaceType: activeScope.workspaceType,
        bundlePreset: activeScope.workspaceType === 'BUNDLE' ? form.bundlePreset : 'MANUAL',
        scopeMode: effectiveScopeMode,
        includeAllProgrammes: activeScope.workspaceType === 'BUNDLE' ? activeScope.includeAllProgrammes : false,
        programmeScopeKey,
        programmeIds: resolvedProgrammeIds,
        examName: form.examName || form.iaCycle,
        iaCycle: form.iaCycle || form.examName,
        chosenSemester: legacyChosenSemester,
        chosenSemesters: resolvedChosenSemesters,
        institutionName,
        academicYearLabel,
        workflowScope: {
          institutionId: form.institutionId,
          institutionName,
          academicYearId: form.academicYearId,
          academicYearLabel,
          semesterCategory: form.semesterCategory,
          workspaceType: activeScope.workspaceType,
          bundlePreset: activeScope.workspaceType === 'BUNDLE' ? form.bundlePreset : 'MANUAL',
          chosenSemester: legacyChosenSemester,
          chosenSemesters: resolvedChosenSemesters,
          examWindowName: form.examWindowName,
          programmeId: programmeScopeKey,
          programmeIds: resolvedProgrammeIds,
          scopeMode: effectiveScopeMode,
          examName: form.examName || form.iaCycle,
          iaCycle: form.iaCycle || form.examName,
        },
        status: 'DRAFT',
        versionNo: '1',
        updatedAt,
      }
      window.sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(payload),
      )
      setField('status', 'DRAFT')
      try {
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_1_SETUP, {
          institutionId: form.institutionId,
          academicYearId: form.academicYearId,
          chosenSemester: legacyChosenSemester,
          chosenSemesters: resolvedChosenSemesters,
          programmeId: programmeScopeKey,
          programmeIds: resolvedProgrammeIds,
          workspaceType: activeScope.workspaceType,
          bundlePreset: activeScope.workspaceType === 'BUNDLE' ? form.bundlePreset : 'MANUAL',
          scopeMode: effectiveScopeMode,
          examName: form.examName || form.iaCycle,
          iaCycle: form.iaCycle,
          workflowStatus: 'DRAFT',
          versionNo: 1,
          payload,
        })
      } catch {
        // Local draft remains available even when API save fails.
      }
      showToast('success', 'Phase 1 draft saved.')
    } finally {
      setSaving(false)
    }
  }

  const onSubmitPhase = async () => {
    if (validationErrors.length > 0) {
      showToast('danger', `Please complete required fields: ${validationErrors[0]}`)
      return
    }
    setSaving(true)
    try {
      const activeScope = resolveActiveScope()
      const resolvedProgrammeIds = activeScope.resolvedProgrammeIds
      const effectiveScopeMode = activeScope.scopeMode
      const programmeScopeKey = activeScope.programmeScopeKey
      const resolvedChosenSemesters = activeScope.chosenSemesters
      const legacyChosenSemester = activeScope.legacyChosenSemester
      const updatedAt = new Date().toISOString()
      const institutionName =
        institutions.find((x) => String(x.id) === String(form.institutionId))?.name || ''
      const academicYearLabel =
        academicYears.find((x) => String(x.id) === String(form.academicYearId))?.academicYear ||
        academicYears.find((x) => String(x.id) === String(form.academicYearId))?.academicYearName ||
        ''
      const payload = {
        ...form,
        workspaceType: activeScope.workspaceType,
        bundlePreset: activeScope.workspaceType === 'BUNDLE' ? form.bundlePreset : 'MANUAL',
        scopeMode: effectiveScopeMode,
        includeAllProgrammes: activeScope.workspaceType === 'BUNDLE' ? activeScope.includeAllProgrammes : false,
        programmeScopeKey,
        programmeIds: resolvedProgrammeIds,
        examName: form.examName || form.iaCycle,
        iaCycle: form.iaCycle || form.examName,
        chosenSemester: legacyChosenSemester,
        chosenSemesters: resolvedChosenSemesters,
        institutionName,
        academicYearLabel,
        workflowScope: {
          institutionId: form.institutionId,
          institutionName,
          academicYearId: form.academicYearId,
          academicYearLabel,
          semesterCategory: form.semesterCategory,
          workspaceType: activeScope.workspaceType,
          bundlePreset: activeScope.workspaceType === 'BUNDLE' ? form.bundlePreset : 'MANUAL',
          chosenSemester: legacyChosenSemester,
          chosenSemesters: resolvedChosenSemesters,
          examWindowName: form.examWindowName,
          programmeId: programmeScopeKey,
          programmeIds: resolvedProgrammeIds,
          scopeMode: effectiveScopeMode,
          examName: form.examName || form.iaCycle,
          iaCycle: form.iaCycle || form.examName,
        },
        status: 'READY_FOR_PHASE_2',
        versionNo: '1',
        updatedAt,
      }
      window.sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(payload),
      )
      setField('status', 'READY_FOR_PHASE_2')
      setEditMode(false)
      try {
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_1_SETUP, {
          institutionId: form.institutionId,
          academicYearId: form.academicYearId,
          chosenSemester: legacyChosenSemester,
          chosenSemesters: resolvedChosenSemesters,
          programmeId: programmeScopeKey,
          programmeIds: resolvedProgrammeIds,
          workspaceType: activeScope.workspaceType,
          bundlePreset: activeScope.workspaceType === 'BUNDLE' ? form.bundlePreset : 'MANUAL',
          scopeMode: effectiveScopeMode,
          examName: form.examName || form.iaCycle,
          iaCycle: form.iaCycle,
          workflowStatus: 'READY_FOR_PHASE_2',
          versionNo: 1,
          payload,
        })
      } catch {
        // Local submit state remains available even when API save fails.
      }
      showToast('success', 'Phase 1 completed. Ready for Phase 2 schedule planning.')
    } finally {
      setSaving(false)
    }
  }

  const onReset = () => {
    window.sessionStorage.removeItem(DRAFT_KEY)
    setForm(initialForm)
    setScopeLocked(false)
    setEditMode(false)
    showToast('warning', 'Draft cleared.')
  }

  return (
    <CRow>
      <CCol xs={12}>
        <IAWorkflowScopeBanner scope={form} />

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT - PHASE 1 SETUP</strong>
            <div className="d-flex align-items-center gap-2">
              <CBadge color={form.status === 'READY_FOR_PHASE_2' ? 'success' : 'secondary'}>
                {form.status === 'READY_FOR_PHASE_2' ? 'READY FOR PHASE 2' : 'DRAFT'}
              </CBadge>
              <CBadge color={completion === 100 ? 'success' : 'warning'}>
                Completion: {completion}%
              </CBadge>
            </div>
          </CCardHeader>
          <CCardBody>
            {scopeLocked ? (
              <div className="alert alert-info">
                Workspace scope is already selected from IA Workspace. Institution, academic year, workspace type,
                semester scope, and programme scope are locked here.
              </div>
            ) : null}
            {phaseLocked ? (
              <div className="alert alert-success">
                Phase 1 is submitted and locked. Use Enable Edit to revise this bundle, or continue with Phase 2.
              </div>
            ) : null}
            <CForm>
              <CRow className="g-3">
                <CCol md={2}><CFormLabel>Institution *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={form.institutionId}
                    disabled={scopeLocked}
                    onChange={(e) => {
                      const institutionId = e.target.value
                      setForm((prev) => ({
                        ...prev,
                        institutionId,
                        academicYearId: '',
                        semesterCategory: '',
                        workspaceType: 'SINGLE',
                        bundlePreset: 'MANUAL',
                        chosenSemester: '',
                        chosenSemesters: [],
                        scopeMode: 'SINGLE',
                        programmeId: '',
                        programmeIds: [],
                        includeAllProgrammes: false,
                        programmeScopeKey: '',
                        examName: '',
                        iaCycle: '',
                      }))
                    }}
                  >
                    <option value="">Select Institution</option>
                    {institutions.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Academic Year *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={form.academicYearId}
                    disabled={!form.institutionId || scopeLocked}
                    onChange={(e) => setField('academicYearId', e.target.value)}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.academicYearLabel || x.academicYear || x.id}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Semester Category</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput value={form.semesterCategory || '-'} disabled />
                </CCol>

                <CCol md={2}><CFormLabel>Choose Semester *</CFormLabel></CCol>
                <CCol md={4}>
                  {form.workspaceType === 'SINGLE' ? (
                    <CFormSelect
                      value={form.chosenSemester}
                      onChange={(e) => setField('chosenSemester', e.target.value)}
                      disabled={!form.academicYearId || scopeLocked}
                    >
                      <option value="">Choose Semester</option>
                      {chosenSemesterOptions.map((x) => (
                        <option key={x} value={String(x)}>
                          {x}
                        </option>
                      ))}
                    </CFormSelect>
                  ) : (
                    <div className="border rounded p-2" style={{ maxHeight: 160, overflowY: 'auto' }}>
                      {chosenSemesterOptions.length === 0 ? (
                        <div className="text-muted small">No semesters available</div>
                      ) : (
                        chosenSemesterOptions.map((x) => (
                          <CFormCheck
                            key={x}
                            type="checkbox"
                            className="mb-1"
                            label={`Semester ${x}`}
                            checked={normalizeSemesterList(form.chosenSemesters).includes(Number(x))}
                            onChange={(e) => toggleSemester(x, e.target.checked)}
                            disabled={!form.academicYearId || scopeLocked || phaseLocked || form.bundlePreset !== BUNDLE_PRESET_VALUES.MANUAL}
                          />
                        ))
                      )}
                    </div>
                  )}
                </CCol>

                <CCol md={2}><CFormLabel>Workspace Type *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={form.workspaceType}
                    disabled={!form.institutionId || scopeLocked || phaseLocked}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        workspaceType: e.target.value,
                        bundlePreset: e.target.value === 'BUNDLE' ? prev.bundlePreset : 'MANUAL',
                        chosenSemester: e.target.value === 'SINGLE' ? prev.chosenSemester : buildLegacySemester('BUNDLE', '', prev.chosenSemesters),
                        chosenSemesters: e.target.value === 'BUNDLE'
                          ? (prev.bundlePreset !== BUNDLE_PRESET_VALUES.MANUAL
                            ? derivePresetSemesters(prev.bundlePreset, chosenSemesterOptions).map(String)
                            : normalizeSemesterList(prev.chosenSemesters).map(String))
                          : normalizeSemesterList([prev.chosenSemester]).map(String),
                        scopeMode: e.target.value === 'BUNDLE' ? 'MULTIPLE' : 'SINGLE',
                        programmeId: '',
                        programmeIds: [],
                        includeAllProgrammes: false,
                        programmeScopeKey: '',
                      }))
                    }
                  >
                    <option value="SINGLE">Single Workspace</option>
                    <option value="BUNDLE">Bundle Workspace</option>
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>{form.workspaceType === 'BUNDLE' ? 'Bundle Preset' : 'Programme Scope *'}</CFormLabel></CCol>
                <CCol md={4}>
                  {form.workspaceType === 'SINGLE' ? (
                    <CFormSelect
                      value={form.scopeMode}
                      disabled={!form.institutionId || scopeLocked || phaseLocked}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          scopeMode: e.target.value,
                          programmeId: '',
                          programmeIds: [],
                          programmeScopeKey: '',
                        }))
                      }
                    >
                      <option value="SINGLE">Single Programme</option>
                      <option value="MULTIPLE">Multiple Programmes</option>
                      <option value="ALL">All Programmes</option>
                    </CFormSelect>
                  ) : (
                    <CFormSelect
                      value={form.bundlePreset}
                      disabled={!form.institutionId || scopeLocked || phaseLocked}
                      onChange={(e) =>
                        setForm((prev) => {
                          const nextPreset = e.target.value
                          const presetSemesters = nextPreset === BUNDLE_PRESET_VALUES.MANUAL
                            ? normalizeSemesterList(prev.chosenSemesters).map(String)
                            : derivePresetSemesters(nextPreset, chosenSemesterOptions).map(String)
                          return {
                            ...prev,
                            bundlePreset: nextPreset,
                            chosenSemesters: presetSemesters,
                            chosenSemester: buildLegacySemester('BUNDLE', '', presetSemesters),
                          }
                        })
                      }
                    >
                      <option value="MANUAL">Manual</option>
                      <option value="ODD">Odd Semester Bundle</option>
                      <option value="EVEN">Even Semester Bundle</option>
                    </CFormSelect>
                  )}
                </CCol>

                <CCol md={2}><CFormLabel>Programme *</CFormLabel></CCol>
                <CCol md={4}>
                  {form.workspaceType === 'SINGLE' && form.scopeMode === 'SINGLE' ? (
                    <CFormSelect
                      value={form.programmeId}
                      onChange={(e) => setField('programmeId', e.target.value)}
                      disabled={!form.institutionId || scopeLocked || phaseLocked}
                    >
                      <option value="">Select Programme</option>
                      {programmes.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.programmeCode} - {x.programmeName}
                        </option>
                      ))}
                    </CFormSelect>
                  ) : null}
                  {(form.workspaceType === 'BUNDLE' || form.scopeMode === 'MULTIPLE') ? (
                    <div
                      ref={programmeScrollRef}
                      className="border rounded p-2"
                      style={{ maxHeight: 160, overflowY: 'auto' }}
                    >
                      {programmes.length === 0 ? (
                        <div className="text-muted small">No programmes found</div>
                      ) : (
                        programmes.map((x) => (
                          <CFormCheck
                            key={x.id}
                            type="checkbox"
                            className="mb-1"
                            label={`${x.programmeCode} - ${x.programmeName}`}
                            checked={Array.isArray(form.programmeIds) && form.programmeIds.map(String).includes(String(x.id))}
                            disabled={scopeLocked || phaseLocked || (form.workspaceType === 'BUNDLE' && form.includeAllProgrammes)}
                            onChange={(e) => {
                              const scrollTop = programmeScrollRef.current
                                ? programmeScrollRef.current.scrollTop
                                : 0
                              setForm((prev) => {
                                const current = Array.isArray(prev.programmeIds) ? prev.programmeIds : []
                                const next = e.target.checked
                                  ? [...new Set([...current, x.id])]
                                  : current.filter((id) => String(id) !== String(x.id))
                                return { ...prev, programmeIds: next }
                              })
                              window.requestAnimationFrame(() => {
                                if (programmeScrollRef.current) {
                                  programmeScrollRef.current.scrollTop = scrollTop
                                }
                              })
                            }}
                          />
                        ))
                      )}
                    </div>
                  ) : null}
                  {form.workspaceType === 'SINGLE' && form.scopeMode === 'ALL' ? (
                    <CFormInput value={`All Programmes (${programmes.length})`} disabled />
                  ) : null}
                  {form.workspaceType === 'BUNDLE' ? (
                    <div className="mt-2">
                      <CFormCheck
                        type="checkbox"
                        label="Include All Programmes"
                        checked={form.includeAllProgrammes}
                        disabled={scopeLocked || phaseLocked}
                        onChange={(e) => setField('includeAllProgrammes', e.target.checked)}
                      />
                    </div>
                  ) : null}
                </CCol>

                <CCol md={2}><CFormLabel>Name of the Examination *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={form.iaCycle}
                    disabled={!form.institutionId || scopeLocked || phaseLocked}
                    onChange={(e) => {
                      setField('iaCycle', e.target.value)
                      setField('examName', e.target.value)
                    }}
                  >
                    <option value="">Select Name of the Examination</option>
                    {examNameOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Exam Window Name *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    value={form.examWindowName}
                    disabled={phaseLocked}
                    onChange={(e) => setField('examWindowName', e.target.value)}
                    placeholder="Example: IA 1 - April 2026"
                  />
                </CCol>

                <CCol md={2}><CFormLabel>Exam Month & Year *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="month"
                    value={form.examMonthYear}
                    disabled={phaseLocked}
                    onChange={(e) => setField('examMonthYear', e.target.value)}
                  />
                </CCol>

                <CCol md={2}><CFormLabel>Window Start Date *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="date"
                    value={form.windowStartDate}
                    disabled={phaseLocked}
                    onChange={(e) => setField('windowStartDate', e.target.value)}
                  />
                </CCol>

                <CCol md={2}><CFormLabel>Window End Date *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="date"
                    value={form.windowEndDate}
                    disabled={phaseLocked}
                    onChange={(e) => setField('windowEndDate', e.target.value)}
                  />
                </CCol>

                <CCol md={2}><CFormLabel>Slot Duration (Hours) *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="text"
                    inputMode="numeric"
                    value={form.slotDurationMinutes}
                    disabled={phaseLocked}
                    onChange={(e) => setField('slotDurationMinutes', String(e.target.value || '').replace(/\D/g, ''))}
                    placeholder="Enter duration in hour(s)"
                  />
                </CCol>

                <CCol md={2}><CFormLabel>FN Start Time *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="time"
                    value={form.fnStartTime}
                    disabled={phaseLocked}
                    onChange={(e) => setField('fnStartTime', e.target.value)}
                  />
                </CCol>

                <CCol md={2}><CFormLabel>AN Start Time *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="time"
                    value={form.anStartTime}
                    disabled={phaseLocked}
                    onChange={(e) => setField('anStartTime', e.target.value)}
                  />
                </CCol>

                <CCol md={2}><CFormLabel>Course Selection</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={form.courseSelectionMode}
                    disabled={phaseLocked}
                    onChange={(e) => setField('courseSelectionMode', e.target.value)}
                  >
                    <option value="all">All Eligible Courses</option>
                    <option value="manual">Manual Course Selection</option>
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Rules</CFormLabel></CCol>
                <CCol md={10}>
                  <div className="d-flex flex-wrap gap-4">
                    <CFormCheck
                      type="checkbox"
                      label="No Student Clash"
                      checked={form.ruleNoStudentClash}
                      disabled={phaseLocked}
                      onChange={(e) => setField('ruleNoStudentClash', e.target.checked)}
                    />
                    <CFormCheck
                      type="checkbox"
                      label="No Faculty Clash"
                      checked={form.ruleNoFacultyClash}
                      disabled={phaseLocked}
                      onChange={(e) => setField('ruleNoFacultyClash', e.target.checked)}
                    />
                    <CFormCheck
                      type="checkbox"
                      label="Minimum Gap Between Papers"
                      checked={form.ruleMinGapEnabled}
                      disabled={phaseLocked}
                      onChange={(e) => setField('ruleMinGapEnabled', e.target.checked)}
                    />
                  </div>
                </CCol>

                <CCol md={2}><CFormLabel>Minimum Gap (Hours)</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="number"
                    min={1}
                    value={form.minGapHours}
                    disabled={phaseLocked || !form.ruleMinGapEnabled}
                    onChange={(e) => setField('minGapHours', e.target.value)}
                  />
                </CCol>

                <CCol md={2}><CFormLabel>Instructions</CFormLabel></CCol>
                <CCol md={10}>
                  <CFormTextarea
                    rows={3}
                    value={form.instructions}
                    disabled={phaseLocked}
                    onChange={(e) => setField('instructions', e.target.value)}
                    placeholder="Instructions for students/faculty for this IA exam window."
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Phase 1 Actions</strong>
            {validationErrors.length > 0 ? (
              <small className="text-danger">{validationErrors.length} validation item(s) pending</small>
            ) : (
              <small className="text-success">All required fields completed</small>
            )}
          </CCardHeader>
          <CCardBody className="d-flex justify-content-end gap-2">
            {phaseLocked ? (
              <>
                <ArpButton
                  label="Enable Edit"
                  icon="view"
                  color="warning"
                  onClick={() => setEditMode(true)}
                />
                <ArpButton
                  label="Go to Workspace Console"
                  icon="view"
                  color="primary"
                  onClick={() => navigate('/evaluation/ia/workspace')}
                />
              </>
            ) : (
              <>
                <ArpButton
                  label={saving ? 'Saving...' : 'Save Draft'}
                  icon="save"
                  color="secondary"
                  onClick={onSaveDraft}
                  disabled={saving}
                />
                <ArpButton label="Clear" icon="reset" color="warning" onClick={onReset} disabled={saving} />
                <ArpButton
                  label={saving ? 'Submitting...' : 'Submit Phase 1'}
                  icon="submit"
                  color="success"
                  onClick={onSubmitPhase}
                  disabled={saving}
                />
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default IASetupPhase1
