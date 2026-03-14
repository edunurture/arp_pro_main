import React, { useEffect, useMemo, useState } from 'react'
import { CCard, CCardBody, CCol, CRow } from '@coreui/react-pro'

import api from '../../services/apiClient'

const PHASE_1_KEY = 'arp.evaluation.ia.phase1.setup.draft.v2'
const ACTIVE_BUNDLE_KEY = 'arp.evaluation.ia.active-bundle.v2'

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const toText = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item || '').trim()).filter(Boolean)
    return items.length > 0 ? items.join(', ') : fallback
  }
  return String(value)
}

const formatExamMonthYear = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return '-'
  const match = raw.match(/^(\d{4})-(\d{2})$/)
  if (!match) return raw
  const dt = new Date(`${match[1]}-${match[2]}-01T00:00:00`)
  if (Number.isNaN(dt.getTime())) return raw
  return dt.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

const labelValue = (label, value) => (
  <div>
    <div className="small text-medium-emphasis">{label}</div>
    <div className="fw-semibold text-nowrap">{value || '-'}</div>
  </div>
)

const IAWorkflowScopeBanner = ({ scope }) => {
  const activeBundle = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(ACTIVE_BUNDLE_KEY) || 'null')
    } catch {
      return null
    }
  }, [])

  const phase1 = useMemo(() => {
    try {
      if (!activeBundle) return {}
      return JSON.parse(window.sessionStorage.getItem(PHASE_1_KEY) || '{}')
    } catch {
      return {}
    }
  }, [activeBundle])

  const mergedScope = {
    institutionId: scope?.institutionId || phase1?.institutionId || '',
    institutionName: scope?.institutionName || phase1?.institutionName || '',
    academicYearId: scope?.academicYearId || phase1?.academicYearId || '',
    academicYearLabel: scope?.academicYearLabel || phase1?.academicYearLabel || '',
    semesterCategory: scope?.semesterCategory || phase1?.semesterCategory || '',
    workspaceType: scope?.workspaceType || phase1?.workspaceType || '',
    chosenSemester: scope?.chosenSemester || phase1?.chosenSemester || '',
    chosenSemesters:
      scope?.chosenSemesters ||
      scope?.workflowScope?.chosenSemesters ||
      phase1?.chosenSemesters ||
      [],
    examMonthYear:
      scope?.examMonthYear ||
      scope?.workflowScope?.examMonthYear ||
      phase1?.examMonthYear ||
      '',
    examWindowName: scope?.examWindowName || phase1?.examWindowName || '',
    iaCycle: scope?.iaCycle || scope?.examName || phase1?.iaCycle || phase1?.examName || '',
  }

  const semesterText = toText(
    Array.isArray(mergedScope.chosenSemesters) && mergedScope.chosenSemesters.length > 0
      ? mergedScope.chosenSemesters
      : mergedScope.chosenSemester,
    '-',
  )

  const [institutionName, setInstitutionName] = useState(mergedScope.institutionName || '')
  const [academicYearLabel, setAcademicYearLabel] = useState(mergedScope.academicYearLabel || '')

  useEffect(() => {
    if (mergedScope.institutionName || !mergedScope.institutionId) return
    ;(async () => {
      try {
        const res = await api.get('/api/setup/institution')
        const list = unwrapList(res)
        const row = list.find((item) => String(item.id) === String(mergedScope.institutionId))
        if (row?.name) setInstitutionName(row.name)
      } catch {
        // keep fallback
      }
    })()
  }, [mergedScope.institutionId, mergedScope.institutionName])

  useEffect(() => {
    if (mergedScope.academicYearLabel || !mergedScope.institutionId || !mergedScope.academicYearId) return
    ;(async () => {
      try {
        const res = await api.get('/api/setup/academic-year', {
          headers: { 'x-institution-id': mergedScope.institutionId },
        })
        const list = unwrapList(res)
        const row = list.find((item) => String(item.id) === String(mergedScope.academicYearId))
        const label =
          row?.academicYear ||
          row?.academicYearName ||
          row?.label ||
          row?.name ||
          row?.code ||
          row?.id ||
          ''
        if (label) setAcademicYearLabel(String(label))
      } catch {
        // keep fallback
      }
    })()
  }, [mergedScope.academicYearId, mergedScope.academicYearLabel, mergedScope.institutionId])

  return (
    <CCard className="mb-3 border-info">
      <CCardBody>
        <CRow className="g-3 align-items-center">
          <CCol md={3}>{labelValue('Institution', institutionName || mergedScope.institutionId || '-')}</CCol>
          <CCol md={3}>
            {labelValue(
              'Academic Year / Semester',
              `${academicYearLabel || mergedScope.academicYearId || '-'}${
                mergedScope.semesterCategory ? ` / ${mergedScope.semesterCategory}` : ''
              } / ${semesterText}`,
            )}
          </CCol>
          <CCol md={2}>{labelValue('Workspace', mergedScope.workspaceType || 'SINGLE')}</CCol>
          <CCol md={2}>{labelValue('Examination', mergedScope.iaCycle || '-')}</CCol>
          <CCol md={2}>
            {labelValue(
              'Exam Month & Year',
              mergedScope.examMonthYear
                ? formatExamMonthYear(mergedScope.examMonthYear)
                : (mergedScope.examWindowName || '-'),
            )}
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  )
}

export default IAWorkflowScopeBanner
