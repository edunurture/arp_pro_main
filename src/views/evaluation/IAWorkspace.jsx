import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormLabel,
  CFormSelect,
  CRow,
} from '@coreui/react-pro'

import { ArpButton, ArpToastStack } from '../../components/common'
import api from '../../services/apiClient'
import { getIAWorkflowBundle } from '../../services/iaWorkflowService'

const phaseCards = [
  { key: 'PHASE_1_SETUP', label: 'Phase 1 - Setup', path: '/evaluation/ia/setup' },
  { key: 'PHASE_2_SCHEDULE', label: 'Phase 2 - Schedule Planning', path: '/evaluation/ia/schedule-planning' },
  { key: 'PHASE_3_VALIDATION', label: 'Phase 3 - Conflict Validation', path: '/evaluation/ia/conflict-validation' },
  { key: 'PHASE_4_PUBLISH', label: 'Phase 4 - Publish', path: '/evaluation/ia/publish' },
  { key: 'PHASE_5_OPERATIONS', label: 'Phase 5 - Operations', path: '/evaluation/ia/operations' },
  { key: 'PHASE_6_MARK_ENTRY', label: 'Phase 6 - Mark Entry', path: '/evaluation/ia/mark-entry' },
  { key: 'PHASE_7_RESULT_ANALYSIS', label: 'Phase 7 - Result Analysis', path: '/evaluation/ia/result-analysis' },
]

const phaseLocalKeys = {
  PHASE_1_SETUP: 'arp.evaluation.ia.phase1.setup.draft.v1',
  PHASE_2_SCHEDULE: 'arp.evaluation.ia.phase2.schedule.draft.v1',
  PHASE_3_VALIDATION: 'arp.evaluation.ia.phase3.validation.draft.v1',
  PHASE_4_PUBLISH: 'arp.evaluation.ia.phase4.publish.draft.v1',
  PHASE_5_OPERATIONS: 'arp.evaluation.ia.phase5.operations.draft.v1',
  PHASE_6_MARK_ENTRY: 'arp.evaluation.ia.phase6.mark-entry.draft.v1',
  PHASE_7_RESULT_ANALYSIS: 'arp.evaluation.ia.phase7.result-analysis.draft.v1',
}

const statusColor = (status) => {
  const s = String(status || '').toUpperCase()
  if (!s) return 'secondary'
  if (s.includes('READY') || s === 'PUBLISHED' || s === 'COMPLETED' || s === 'IA_RESULT_ANALYSIS_COMPLETED') return 'success'
  if (s === 'DRAFT' || s.includes('PROGRESS')) return 'warning'
  return 'info'
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

const IAWorkspace = () => {
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)
  const [bundle, setBundle] = useState({})
  const [institutions, setInstitutions] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [iaCycleOptions, setIaCycleOptions] = useState([])
  const [scope, setScope] = useState({
    institutionId: '',
    academicYearId: '',
    chosenSemester: '',
    programmeId: '',
    iaCycle: '',
  })

  useEffect(() => {
    try {
      const p1 = JSON.parse(window.sessionStorage.getItem(phaseLocalKeys.PHASE_1_SETUP) || '{}')
      setScope((prev) => ({
        ...prev,
        institutionId: p1.institutionId || '',
        academicYearId: p1.academicYearId || '',
        chosenSemester: p1.chosenSemester || '',
        programmeId: p1.programmeScopeKey || p1.programmeId || '',
        iaCycle: p1.examName || p1.iaCycle || '',
      }))
    } catch {
      // Keep default scope.
    }
  }, [])

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
    }))
  }, [scope.academicYearId, chosenSemesterOptions])

  const showToast = (type, message) => {
    setToast({
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
    setBundle({})
    setScope({
      institutionId: '',
      academicYearId: '',
      chosenSemester: '',
      programmeId: '',
      iaCycle: '',
    })
    showToast('warning', 'All local IA draft data cleared from this browser session.')
  }

  const readLocalStatus = (phaseKey) => {
    try {
      const raw = window.sessionStorage.getItem(phaseLocalKeys[phaseKey] || '')
      if (!raw) return ''
      const obj = JSON.parse(raw)
      return obj?.status || ''
    } catch {
      return ''
    }
  }

  const readLocalPhaseMeta = (phaseKey) => {
    try {
      const raw = window.sessionStorage.getItem(phaseLocalKeys[phaseKey] || '')
      if (!raw) return {}
      const obj = JSON.parse(raw)
      const statusText = toText(obj?.status, '')
      return {
        versionNo: obj?.versionNo || obj?.version || (statusText && statusText !== 'NOT_STARTED' ? '1' : ''),
        updatedAt:
          obj?.updatedAt ||
          obj?.publishedAt ||
          obj?.submittedAt ||
          obj?.effectiveFrom ||
          obj?.publishDate ||
          '',
      }
    } catch {
      return {}
    }
  }

  const loadBundle = async () => {
    try {
      const remote = await getIAWorkflowBundle(scope)
      setBundle(remote || {})
      showToast('success', 'Workspace refreshed from server.')
    } catch {
      showToast('warning', 'Server data unavailable. Showing local draft status.')
    }
  }

  useEffect(() => {
    if (!scope.institutionId || !scope.academicYearId || !scope.chosenSemester || !scope.programmeId || !scope.iaCycle) return
    loadBundle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.institutionId, scope.academicYearId, scope.chosenSemester, scope.programmeId, scope.iaCycle])

  const computed = useMemo(() => {
    return phaseCards.map((p) => {
      const remote = bundle?.[p.key]
      const localMeta = readLocalPhaseMeta(p.key)
      const status = remote?.status || readLocalStatus(p.key) || 'NOT_STARTED'
      const normalizedStatus = toText(status, 'NOT_STARTED')
      const resolvedVersion = remote?.versionNo ?? localMeta.versionNo ?? (normalizedStatus !== 'NOT_STARTED' ? '1' : '')
      const resolvedUpdatedAt = remote?.updatedAt ?? localMeta.updatedAt ?? ''
      return {
        ...p,
        status: normalizedStatus,
        versionNo: toText(resolvedVersion),
        updatedAt: toText(resolvedUpdatedAt),
      }
    })
  }, [bundle])

  const completedCount = computed.filter((x) => {
    const s = String(x.status || '').toUpperCase()
    return s.includes('READY') || s === 'PUBLISHED' || s === 'READY_FOR_EVALUATION_FLOW' || s === 'IA_RESULT_ANALYSIS_COMPLETED'
  }).length

  return (
    <CRow>
      <CCol xs={12}>
        <ArpToastStack toast={toast} onClose={() => setToast(null)} />

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT WORKSPACE</strong>
            <CBadge color={completedCount === 5 ? 'success' : 'info'}>
              Progress: {completedCount}/5
            </CBadge>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2}><CFormLabel>Institution</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.institutionId}
                  onChange={(e) =>
                    setScope((p) => ({
                      ...p,
                      institutionId: e.target.value,
                      academicYearId: '',
                      chosenSemester: '',
                      programmeId: '',
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
                  disabled={!scope.institutionId}
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

              <CCol md={2}><CFormLabel>Semester</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.chosenSemester}
                  disabled={!scope.academicYearId}
                  onChange={(e) => setScope((p) => ({ ...p, chosenSemester: e.target.value }))}
                >
                  <option value="">Select Semester</option>
                  {chosenSemesterOptions.map((s) => (
                    <option key={s} value={String(s)}>{String(s)}</option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={2}><CFormLabel>Programme</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.programmeId}
                  disabled={!scope.institutionId}
                  onChange={(e) => setScope((p) => ({ ...p, programmeId: e.target.value }))}
                >
                  <option value="">Select Programme</option>
                  {programmes.map((x) => (
                    <option key={String(x.id)} value={String(x.id)}>
                      {`${toText(x.programmeCode, '')}${x.programmeCode && x.programmeName ? ' - ' : ''}${toText(x.programmeName, '')}`.trim() || toText(x.id)}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={2}><CFormLabel>Name of the Examination</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.iaCycle}
                  disabled={!scope.institutionId}
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
                  <ArpButton label="Reset Local IA Drafts" icon="cancel" color="warning" onClick={onResetLocalIADrafts} />
                  <ArpButton label="Refresh Workspace" icon="search" color="info" onClick={loadBundle} />
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CRow className="g-3">
          {computed.map((phase) => (
            <CCol md={6} lg={4} key={phase.key}>
              <CCard className="h-100">
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <strong>{toText(phase.label)}</strong>
                  <CBadge color={statusColor(phase.status)}>{toText(phase.status)}</CBadge>
                </CCardHeader>
                <CCardBody className="d-flex flex-column gap-2">
                  <small>Version: {toText(phase.versionNo)}</small>
                  <small>Updated At: {toText(phase.updatedAt)}</small>
                  <div className="mt-auto d-flex justify-content-end">
                    <ArpButton label="Open Phase" icon="view" color="primary" onClick={() => navigate(phase.path)} />
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
        </CRow>
      </CCol>
    </CRow>
  )
}

export default IAWorkspace
