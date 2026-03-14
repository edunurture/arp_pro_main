import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
} from '@coreui/react-pro'

import { ArpButton, useArpToast } from '../../components/common'
import api from '../../services/apiClient'
import { IA_PHASE_KEYS, saveIAWorkflowPhase } from '../../services/iaWorkflowService'
import IARecordsAdmin from './IARecordsAdmin'

const phaseLocalKeys = {
  PHASE_1_SETUP: 'arp.evaluation.ia.phase1.setup.draft.v2',
  PHASE_2_SCHEDULE: 'arp.evaluation.ia.phase2.schedule.draft.v2',
  PHASE_3_VALIDATION: 'arp.evaluation.ia.phase3.validation.draft.v2',
  PHASE_4_PUBLISH: 'arp.evaluation.ia.phase4.publish.draft.v2',
  PHASE_5_OPERATIONS: 'arp.evaluation.ia.phase5.operations.draft.v2',
  PHASE_6_MARK_ENTRY: 'arp.evaluation.ia.phase6.mark-entry.draft.v2',
  PHASE_7_RESULT_ANALYSIS: 'arp.evaluation.ia.phase7.result-analysis.draft.v2',
  PHASE_8_INTERNAL_MARK_STATEMENT: 'arp.evaluation.ia.phase8.internal-mark-statement.draft.v2',
}

const ACTIVE_BUNDLE_KEY = 'arp.evaluation.ia.active-bundle.v2'

const INITIAL_SCOPE = {
  institutionId: '',
  academicYearId: '',
  workspaceType: 'SINGLE',
  scopeMode: 'SINGLE',
  chosenSemester: '',
  chosenSemesters: [],
  programmeId: '',
  programmeIds: [],
  iaCycle: '',
}

const PHASE_1_DEFAULTS = {
  semesterCategory: '',
  bundlePreset: 'MANUAL',
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

const toText = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) {
    const items = value
      .map((item) => toText(item, ''))
      .filter((item) => String(item || '').trim())
    return items.length > 0 ? items.join(', ') : fallback
  }
  if (typeof value === 'object') {
    if (typeof value.toISOString === 'function') {
      try {
        return value.toISOString()
      } catch {
        return fallback
      }
    }
    if (typeof value.label === 'string' && value.label.trim()) return value.label
    if (typeof value.name === 'string' && value.name.trim()) return value.name
    if (typeof value.value === 'string' && value.value.trim()) return value.value
    return fallback
  }
  return fallback
}

const buildProgrammeScopeKey = (scopeMode, programmeId, programmeIds) => {
  if (scopeMode === 'ALL') return '__ALL__'
  if (scopeMode === 'MULTIPLE') {
    const ids = [...new Set((programmeIds || []).map((item) => String(item).trim()).filter(Boolean))].sort()
    if (ids.length === 0) return ''
    return `__MULTI__:${ids.join(',')}`
  }
  return String(programmeId || '').trim()
}

const IAWorkspace = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useArpToast()
  const [recordsRefreshSignal, setRecordsRefreshSignal] = useState(0)
  const [creationOpen, setCreationOpen] = useState(false)
  const [activeBundle, setActiveBundle] = useState(null)
  const [workspaceNotice, setWorkspaceNotice] = useState('')
  const [institutions, setInstitutions] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [iaCycleOptions, setIaCycleOptions] = useState([])
  const [scope, setScope] = useState(INITIAL_SCOPE)

  useEffect(() => {
    try {
      const active = JSON.parse(window.sessionStorage.getItem(ACTIVE_BUNDLE_KEY) || 'null')
      const source =
        active && String(active.institutionId || '').trim()
          ? {
              institutionId: active.institutionId || '',
              academicYearId: active.academicYearId || '',
              workspaceType: active.workspaceType || 'SINGLE',
              scopeMode:
                active.programmeId === '__ALL__'
                  ? 'ALL'
                  : Array.isArray(active.programmeIds) && active.programmeIds.length > 1
                    ? 'MULTIPLE'
                    : 'SINGLE',
              chosenSemester: active.chosenSemester || '',
              chosenSemesters: Array.isArray(active.chosenSemesters) ? active.chosenSemesters : [],
              programmeId:
                active.programmeId === '__ALL__' || (Array.isArray(active.programmeIds) && active.programmeIds.length > 1)
                  ? ''
                  : (active.programmeId || ''),
              programmeIds: Array.isArray(active.programmeIds) ? active.programmeIds : [],
              iaCycle: active.examName || active.iaCycle || '',
            }
          : INITIAL_SCOPE
      setScope((prev) => ({
        ...prev,
        institutionId: source.institutionId || '',
        academicYearId: source.academicYearId || '',
        workspaceType: source.workspaceType || 'SINGLE',
        scopeMode:
          source.programmeScopeKey === '__ALL__' || source.programmeId === '__ALL__'
            ? 'ALL'
            : source.scopeMode || (source.workspaceType === 'BUNDLE' ? 'MULTIPLE' : 'SINGLE'),
        chosenSemester: source.chosenSemester || '',
        chosenSemesters: Array.isArray(source.chosenSemesters) ? source.chosenSemesters : [],
        programmeId:
          (source.programmeScopeKey === '__ALL__' || source.programmeId === '__ALL__')
            ? ''
            : source.scopeMode === 'SINGLE'
            ? (source.programmeId || '')
            : '',
        programmeIds: Array.isArray(source.programmeIds) ? source.programmeIds : [],
        iaCycle: source.examName || source.iaCycle || '',
      }))
      setActiveBundle(active)
    } catch {
      // Keep default scope.
    }
  }, [])

  useEffect(() => {
    const nextNotice = String(location.state?.workspaceNotice || '').trim()
    if (!nextNotice) return
    setWorkspaceNotice(nextNotice)
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.pathname, location.state, navigate])

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
    if (!scope.institutionId) {
      setAcademicYears([])
      setProgrammes([])
      setIaCycleOptions([])
      return
    }
    ;(async () => {
      try {
        const ayRes = await api.get('/api/setup/academic-year', {
          headers: { 'x-institution-id': scope.institutionId },
        })
        setAcademicYears(unwrapList(ayRes))
      } catch {
        setAcademicYears([])
      }
      try {
        const pRes = await api.get('/api/setup/programme')
        const list = unwrapList(pRes).filter((x) => String(x.institutionId) === String(scope.institutionId))
        setProgrammes(list)
      } catch {
        setProgrammes([])
      }
      try {
        const cRes = await api.get('/api/setup/cia-components', {
          params: { institutionId: scope.institutionId },
        })
        const rows = Array.isArray(cRes?.data?.data?.components) ? cRes.data.data.components : []
        const dynamic = [...new Set(rows.map((x) => String(x?.examName || '').trim()).filter(Boolean))]
          .map((name) => ({ value: name, label: name }))
        setIaCycleOptions(dynamic)
      } catch {
        setIaCycleOptions([])
      }
    })()
  }, [scope.institutionId])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(scope.academicYearId)) || null,
    [academicYears, scope.academicYearId],
  )
  const semesterCategoryText = useMemo(
    () => toText(selectedAcademicYear?.semesterCategory, ''),
    [selectedAcademicYear],
  )

  const chosenSemesterOptions = useMemo(() => {
    if (!selectedAcademicYear) return []
    const src = Array.isArray(selectedAcademicYear?.chosenSemesters)
      ? selectedAcademicYear.chosenSemesters
      : typeof selectedAcademicYear?.chosenSemesters === 'string'
        ? selectedAcademicYear.chosenSemesters.split(',')
        : []
    return [...new Set(
      src.map((v) => Number(String(v).trim())).filter((n) => Number.isFinite(n) && n > 0),
    )].sort((a, b) => a - b)
  }, [selectedAcademicYear])

  const resolvedIaCycleOptions = useMemo(() => {
    if (iaCycleOptions.length > 0) return iaCycleOptions
    return []
  }, [iaCycleOptions])

  useEffect(() => {
    if (!scope.academicYearId) return
    setScope((prev) => ({
      ...prev,
      chosenSemester: chosenSemesterOptions.some((x) => String(x) === String(prev.chosenSemester))
        ? prev.chosenSemester
        : '',
      chosenSemesters: Array.isArray(prev.chosenSemesters)
        ? prev.chosenSemesters.filter((semester) =>
            chosenSemesterOptions.some((option) => String(option) === String(semester)),
          )
        : [],
    }))
  }, [scope.academicYearId, chosenSemesterOptions])

  const resolvedProgrammeScopeKey = useMemo(
    () => buildProgrammeScopeKey(scope.scopeMode, scope.programmeId, scope.programmeIds),
    [scope.scopeMode, scope.programmeId, scope.programmeIds],
  )

  const showToast = (type, message) => {
    toast.show({
      type,
      message,
      autohide: type === 'success',
      delay: 4500,
    })
  }

  const onResetLocalIADrafts = () => {
    Object.values(phaseLocalKeys).forEach((key) => {
      window.sessionStorage.removeItem(key)
    })
    window.sessionStorage.removeItem(ACTIVE_BUNDLE_KEY)
    setScope({
      institutionId: '',
      academicYearId: '',
      workspaceType: 'SINGLE',
      scopeMode: 'SINGLE',
      chosenSemester: '',
      chosenSemesters: [],
      programmeId: '',
      programmeIds: [],
      iaCycle: '',
    })
    setActiveBundle(null)
    showToast('warning', 'All local IA draft data cleared from this browser session.')
  }

  const loadBundle = async () => {
    setRecordsRefreshSignal((value) => value + 1)
    showToast('success', 'Workspace list refreshed.')
  }

  const validateWorkspaceScope = () => {
    if (!scope.institutionId) return 'Select Institution'
    if (!scope.academicYearId) return 'Select Academic Year'
    if (!scope.iaCycle) return 'Select Name of the Examination'
    if (scope.workspaceType === 'BUNDLE') {
      if (!Array.isArray(scope.chosenSemesters) || scope.chosenSemesters.length === 0) {
        return 'Select Semester Scope'
      }
    } else if (!scope.chosenSemester) {
      return 'Select Semester Scope'
    }
    if (!resolvedProgrammeScopeKey) return 'Select Programme Scope'
    return ''
  }

  const buildPhase1WorkspacePayload = () => {
    const selectedAcademicYearRow = academicYears.find((row) => String(row.id) === String(scope.academicYearId)) || null
    const institutionRow = institutions.find((row) => String(row.id) === String(scope.institutionId)) || null
    const chosenSemesters = scope.workspaceType === 'BUNDLE'
      ? (Array.isArray(scope.chosenSemesters) ? scope.chosenSemesters.map(String) : [])
      : (scope.chosenSemester ? [String(scope.chosenSemester)] : [])
    return {
      ...PHASE_1_DEFAULTS,
      institutionId: scope.institutionId,
      institutionName: toText(institutionRow?.name, ''),
      academicYearId: scope.academicYearId,
      academicYearLabel: toText(
        selectedAcademicYearRow?.academicYearLabel,
        toText(selectedAcademicYearRow?.academicYear, ''),
      ),
      semesterCategory: toText(selectedAcademicYearRow?.semesterCategory, ''),
      workspaceType: scope.workspaceType,
      scopeMode: scope.scopeMode,
      includeAllProgrammes: scope.scopeMode === 'ALL',
      chosenSemester: scope.chosenSemester,
      chosenSemesters,
      programmeId: scope.scopeMode === 'SINGLE' ? scope.programmeId : '',
      programmeIds:
        scope.scopeMode === 'ALL'
          ? programmes.map((programme) => String(programme.id))
          : Array.isArray(scope.programmeIds)
            ? scope.programmeIds.map(String)
            : [],
      programmeScopeKey: resolvedProgrammeScopeKey,
      examName: scope.iaCycle,
      iaCycle: scope.iaCycle,
      workflowScope: {
        institutionId: scope.institutionId,
        institutionName: toText(institutionRow?.name, ''),
        academicYearId: scope.academicYearId,
        academicYearLabel: toText(
          selectedAcademicYearRow?.academicYearLabel,
          toText(selectedAcademicYearRow?.academicYear, ''),
        ),
        semesterCategory: toText(selectedAcademicYearRow?.semesterCategory, ''),
        workspaceType: scope.workspaceType,
        scopeMode: scope.scopeMode,
        chosenSemester: scope.chosenSemester,
        chosenSemesters,
        programmeId: resolvedProgrammeScopeKey,
        programmeIds:
          scope.scopeMode === 'ALL'
            ? programmes.map((programme) => String(programme.id))
            : Array.isArray(scope.programmeIds)
              ? scope.programmeIds.map(String)
              : [],
        examName: scope.iaCycle,
        iaCycle: scope.iaCycle,
        examWindowName: '',
      },
      updatedAt: new Date().toISOString(),
      versionNo: '1',
    }
  }

  const syncWorkspaceToPhase1Session = () => {
    const error = validateWorkspaceScope()
    if (error) return { ok: false, error }
    const payload = buildPhase1WorkspacePayload()
    const existing = (() => {
      try {
        return JSON.parse(window.sessionStorage.getItem(phaseLocalKeys.PHASE_1_SETUP) || '{}')
      } catch {
        return {}
      }
    })()
    const merged = {
      ...payload,
      ...existing,
      institutionId: payload.institutionId,
      institutionName: payload.institutionName,
      academicYearId: payload.academicYearId,
      academicYearLabel: payload.academicYearLabel,
      semesterCategory: payload.semesterCategory,
      workspaceType: payload.workspaceType,
      scopeMode: payload.scopeMode,
      chosenSemester: payload.chosenSemester,
      chosenSemesters: payload.chosenSemesters,
      programmeId: payload.programmeId,
      programmeIds: payload.programmeIds,
      programmeScopeKey: payload.programmeScopeKey,
      examName: payload.examName,
      iaCycle: payload.iaCycle,
      workflowScope: payload.workflowScope,
    }
    window.sessionStorage.setItem(phaseLocalKeys.PHASE_1_SETUP, JSON.stringify(merged))
    const nextActiveBundle = {
      key: `${payload.institutionId}|${payload.academicYearId}|${payload.chosenSemester}|${payload.programmeScopeKey}|${payload.iaCycle}`,
      institutionId: payload.institutionId,
      academicYearId: payload.academicYearId,
      chosenSemester: payload.chosenSemester,
      chosenSemesters: payload.chosenSemesters,
      workspaceType: payload.workspaceType,
      programmeId: payload.programmeScopeKey,
      programmeIds: payload.programmeIds,
      iaCycle: payload.iaCycle,
      examName: payload.examName,
      lastPhase: 'PHASE_1_SETUP',
      status: payload.status || 'DRAFT',
    }
    window.sessionStorage.setItem(ACTIVE_BUNDLE_KEY, JSON.stringify(nextActiveBundle))
    setActiveBundle(nextActiveBundle)
    return { ok: true, payload: merged }
  }

  const onSaveWorkspace = async () => {
    const error = validateWorkspaceScope()
    if (error) {
      showToast('warning', error)
      return
    }
    const payload = buildPhase1WorkspacePayload()
    window.sessionStorage.setItem(phaseLocalKeys.PHASE_1_SETUP, JSON.stringify(payload))
    try {
      await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_1_SETUP, {
        institutionId: payload.institutionId,
        academicYearId: payload.academicYearId,
        chosenSemester: payload.chosenSemester,
        chosenSemesters: payload.chosenSemesters,
        programmeId: payload.programmeScopeKey,
        programmeIds: payload.programmeIds,
        workspaceType: payload.workspaceType,
        bundlePreset: payload.bundlePreset,
        scopeMode: payload.scopeMode,
        examName: payload.examName,
        iaCycle: payload.iaCycle,
        workflowStatus: 'DRAFT',
        versionNo: 1,
        payload,
      })
      setRecordsRefreshSignal((value) => value + 1)
      setCreationOpen(false)
      syncWorkspaceToPhase1Session()
      showToast('success', 'Workspace saved. You can open Phase 1 now.')
    } catch {
      setRecordsRefreshSignal((value) => value + 1)
      syncWorkspaceToPhase1Session()
      showToast('warning', 'Workspace saved locally. Server save is unavailable.')
    }
  }

  const onOpenPhase1 = () => {
    const result = syncWorkspaceToPhase1Session()
    if (!result.ok) {
      showToast('warning', result.error)
      return
    }
    navigate('/evaluation/ia/setup')
  }

  const onCloseActiveBundle = () => {
    Object.values(phaseLocalKeys).forEach((key) => {
      window.sessionStorage.removeItem(key)
    })
    window.sessionStorage.removeItem(ACTIVE_BUNDLE_KEY)
    setActiveBundle(null)
    setScope(INITIAL_SCOPE)
    setCreationOpen(false)
    showToast('info', 'Active IA bundle closed. Select or create a workspace to continue.')
  }

  useEffect(() => {
    const hasSemester = scope.workspaceType === 'BUNDLE'
      ? Array.isArray(scope.chosenSemesters) && scope.chosenSemesters.length > 0
      : Boolean(scope.chosenSemester)
    if (!scope.institutionId || !scope.academicYearId || !hasSemester || !resolvedProgrammeScopeKey || !scope.iaCycle) return
    setRecordsRefreshSignal((value) => value + 1)
  }, [scope.institutionId, scope.academicYearId, scope.workspaceType, scope.chosenSemester, scope.chosenSemesters, resolvedProgrammeScopeKey, scope.iaCycle])

  return (
    <CRow>
      <CCol xs={12}>
        {workspaceNotice ? (
          <CAlert color="info" dismissible onClose={() => setWorkspaceNotice('')}>
            {workspaceNotice}
          </CAlert>
        ) : null}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>IA WORKSPACE CONSOLE</strong>
            <div className="d-flex gap-2">
              {activeBundle ? (
                <ArpButton label="Close Active Bundle" icon="cancel" color="warning" onClick={onCloseActiveBundle} />
              ) : null}
              <ArpButton
                label={creationOpen ? 'Close Workspace Form' : 'Add New Workspace'}
                icon={creationOpen ? 'cancel' : 'add'}
                color={creationOpen ? 'warning' : 'primary'}
                onClick={() => setCreationOpen((value) => !value)}
              />
            </div>
          </CCardHeader>
          <CCardBody>
            <div className={`alert mb-0 ${activeBundle ? 'alert-success' : 'alert-secondary'}`}>
              {activeBundle
                ? `Active Bundle Open: ${toText(activeBundle.examName || activeBundle.iaCycle, '-')}, ${toText(activeBundle.workspaceType, 'SINGLE')}, Semester ${toText(activeBundle.chosenSemesters, toText(activeBundle.chosenSemester, '-'))}`
                : 'Active Bundle Closed: select an existing bundle or add a new workspace to continue.'}
            </div>
          </CCardBody>
        </CCard>

        {creationOpen ? (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Add New Workspace</strong>
              <ArpButton label="Close" icon="cancel" color="warning" onClick={() => setCreationOpen(false)} />
            </CCardHeader>
            <CCardBody>
              <CRow className="g-3">
              <CCol md={2}><CFormLabel>Institution</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.institutionId}
                  disabled={!creationOpen}
                  onChange={(e) =>
                    setScope((p) => ({
                      ...p,
                      institutionId: e.target.value,
                      academicYearId: '',
                      workspaceType: 'SINGLE',
                      scopeMode: 'SINGLE',
                      chosenSemester: '',
                      chosenSemesters: [],
                      programmeId: '',
                      programmeIds: [],
                    }))
                  }
                >
                  <option value="">Select Institution</option>
                  {institutions.map((x) => (
                    <option key={String(x.id)} value={String(x.id)}>{toText(x.name, toText(x.id))}</option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={2}><CFormLabel>Academic Year</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.academicYearId}
                  disabled={!scope.institutionId || !creationOpen}
                  onChange={(e) => setScope((p) => ({ ...p, academicYearId: e.target.value }))}
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map((x) => (
                    <option key={String(x.id)} value={String(x.id)}>
                      {toText(x.academicYearLabel, toText(x.academicYear, toText(x.id)))}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={2}><CFormLabel>Semester Category</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={semesterCategoryText} disabled>
                  <option value="">{semesterCategoryText || 'Select Academic Year'}</option>
                </CFormSelect>
              </CCol>

              <CCol md={2}><CFormLabel>Workspace Type</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.workspaceType}
                  disabled={!creationOpen}
                  onChange={(e) =>
                    setScope((p) => ({
                      ...p,
                      workspaceType: e.target.value,
                      scopeMode: e.target.value === 'BUNDLE' ? 'MULTIPLE' : 'SINGLE',
                      chosenSemester: '',
                      chosenSemesters: [],
                      programmeId: '',
                      programmeIds: [],
                    }))
                  }
                >
                  <option value="SINGLE">Single Workspace</option>
                  <option value="BUNDLE">Bundle Workspace</option>
                </CFormSelect>
              </CCol>

              <CCol md={2}><CFormLabel>Semester Scope</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.workspaceType === 'BUNDLE' ? (scope.chosenSemesters || []).join(',') : scope.chosenSemester}
                  disabled={!scope.academicYearId || !creationOpen}
                  onChange={(e) =>
                    setScope((p) => ({
                      ...p,
                      chosenSemester: p.workspaceType === 'BUNDLE' ? String(e.target.value || '').split(',')[0] || '' : e.target.value,
                      chosenSemesters: p.workspaceType === 'BUNDLE'
                        ? String(e.target.value || '').split(',').filter(Boolean)
                        : (e.target.value ? [e.target.value] : []),
                    }))
                  }
                >
                  <option value="">Select Semester Scope</option>
                  {scope.workspaceType === 'BUNDLE'
                    ? [
                        { value: '1,3,5', label: 'Odd Bundle (1, 3, 5)' },
                        { value: '2,4,6', label: 'Even Bundle (2, 4, 6)' },
                      ].map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))
                    : chosenSemesterOptions.map((s) => (
                        <option key={s} value={String(s)}>{String(s)}</option>
                      ))}
                </CFormSelect>
              </CCol>

              <CCol md={2}><CFormLabel>Programme Scope</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.scopeMode}
                  disabled={!scope.institutionId || !creationOpen}
                  onChange={(e) =>
                    setScope((p) => ({
                      ...p,
                      scopeMode: e.target.value,
                      programmeId: '',
                      programmeIds: [],
                    }))
                  }
                >
                  <option value="SINGLE">Single Programme</option>
                  <option value="MULTIPLE">Multiple Programmes</option>
                  <option value="ALL">All Programmes</option>
                </CFormSelect>
              </CCol>

              <CCol md={2}><CFormLabel>Programme</CFormLabel></CCol>
              <CCol md={4}>
                {scope.scopeMode === 'SINGLE' ? (
                  <CFormSelect
                    value={scope.programmeId}
                    disabled={!scope.institutionId || !creationOpen}
                    onChange={(e) => setScope((p) => ({ ...p, programmeId: e.target.value }))}
                  >
                    <option value="">Select Programme</option>
                    {programmes.map((x) => (
                      <option key={String(x.id)} value={String(x.id)}>
                        {`${toText(x.programmeCode, '')}${x.programmeCode && x.programmeName ? ' - ' : ''}${toText(x.programmeName, '')}`.trim() || toText(x.id)}
                      </option>
                    ))}
                  </CFormSelect>
                ) : null}
                {scope.scopeMode === 'MULTIPLE' ? (
                  <div className="border rounded p-2" style={{ maxHeight: 160, overflowY: 'auto' }}>
                    {programmes.length === 0 ? (
                      <div className="text-muted small">No programmes found</div>
                    ) : (
                      programmes.map((programme) => (
                        <CFormCheck
                          key={String(programme.id)}
                          type="checkbox"
                          className="mb-1"
                          label={`${toText(programme.programmeCode, '')}${programme.programmeCode && programme.programmeName ? ' - ' : ''}${toText(programme.programmeName, '')}`.trim() || toText(programme.id)}
                          checked={Array.isArray(scope.programmeIds) && scope.programmeIds.map(String).includes(String(programme.id))}
                          disabled={!creationOpen}
                          onChange={(e) =>
                            setScope((prev) => {
                              const current = Array.isArray(prev.programmeIds) ? prev.programmeIds.map(String) : []
                              const next = e.target.checked
                                ? [...new Set([...current, String(programme.id)])]
                                : current.filter((id) => id !== String(programme.id))
                              return { ...prev, programmeIds: next }
                            })
                          }
                        />
                      ))
                    )}
                  </div>
                ) : null}
                {scope.scopeMode === 'ALL' ? (
                  <CFormInput value={`All Programmes (${programmes.length})`} disabled />
                ) : null}
              </CCol>

              <CCol md={2}><CFormLabel>Name of the Examination</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.iaCycle}
                  disabled={!scope.institutionId || !creationOpen}
                  onChange={(e) => setScope((p) => ({ ...p, iaCycle: e.target.value }))}
                >
                  <option value="">Select Name of the Examination</option>
                  {resolvedIaCycleOptions.map((opt) => (
                    <option key={toText(opt.value, '')} value={toText(opt.value, '')}>
                      {toText(opt.label, toText(opt.value))}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol xs={12} className="d-flex justify-content-end">
                <div className="d-flex gap-2">
                  <ArpButton label="Save Workspace" icon="save" color="primary" onClick={onSaveWorkspace} />
                  <ArpButton label="Open Phase 1" icon="view" color="success" onClick={onOpenPhase1} />
                  <ArpButton label="Reset Local IA Drafts" icon="cancel" color="warning" onClick={onResetLocalIADrafts} />
                  <ArpButton label="Refresh Workspace" icon="search" color="info" onClick={loadBundle} />
                </div>
              </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        ) : null}

        <IARecordsAdmin
          embedded
          forceAdmin
          refreshSignal={recordsRefreshSignal}
          onBundleActivated={(bundleInfo) => setActiveBundle(bundleInfo)}
        />
      </CCol>
    </CRow>
  )
}

export default IAWorkspace
