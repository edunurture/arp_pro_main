import React, { useEffect, useMemo, useState } from 'react'
import { CCard, CCardBody, CCol, CRow } from '@coreui/react-pro'

import api from '../../services/apiClient'

const PHASE_1_KEY = 'arp.evaluation.ia.phase1.setup.draft.v1'

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const labelValue = (label, value) => (
  <div>
    <div className="small text-medium-emphasis">{label}</div>
    <div className="fw-semibold text-nowrap">{value || '-'}</div>
  </div>
)

const IAWorkflowScopeBanner = ({ scope }) => {
  const phase1 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_1_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])

  const mergedScope = {
    institutionId: scope?.institutionId || phase1?.institutionId || '',
    institutionName: scope?.institutionName || phase1?.institutionName || '',
    academicYearId: scope?.academicYearId || phase1?.academicYearId || '',
    academicYearLabel: scope?.academicYearLabel || phase1?.academicYearLabel || '',
    semesterCategory: scope?.semesterCategory || phase1?.semesterCategory || '',
    chosenSemester: scope?.chosenSemester || phase1?.chosenSemester || '',
    examWindowName: scope?.examWindowName || phase1?.examWindowName || '',
    iaCycle: scope?.iaCycle || scope?.examName || phase1?.iaCycle || phase1?.examName || '',
  }

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
          <CCol md={4}>{labelValue('Institution', institutionName || mergedScope.institutionId || '-')}</CCol>
          <CCol md={3}>
            {labelValue(
              'Academic Year / Semester',
              `${academicYearLabel || mergedScope.academicYearId || '-'}${
                mergedScope.semesterCategory ? ` / ${mergedScope.semesterCategory}` : ''
              }`,
            )}
          </CCol>
          <CCol md={2}>{labelValue('Examination', mergedScope.iaCycle || '-')}</CCol>
          <CCol md={3}>{labelValue('Exam Month & Year', mergedScope.examWindowName || '-')}</CCol>
        </CRow>
      </CCardBody>
    </CCard>
  )
}

export default IAWorkflowScopeBanner
