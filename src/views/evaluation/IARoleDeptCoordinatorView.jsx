import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
} from '@coreui/react-pro'

import { ArpButton } from '../../components/common'
import IARoleGuard from './IARoleGuard'
import { loadIAPhaseState } from './iaRoleAccess'

const IARoleDeptCoordinatorView = () => {
  const navigate = useNavigate()
  const state = loadIAPhaseState()
  const p2Courses = Array.isArray(state.phase2?.courses) ? state.phase2.courses : []
  const p3Courses = Array.isArray(state.phase3?.courses) ? state.phase3.courses : []
  const p5Rows = Array.isArray(state.phase5?.rows) ? state.phase5.rows : []

  const unassigned = p2Courses.filter((x) => !x.slotId).length
  const conflicts = p3Courses.filter((x) => String(x.conflict || '').trim()).length
  const opsPending = p5Rows.filter((x) => String(x.operationStatus || '').toUpperCase() !== 'COMPLETED' && String(x.operationStatus || '').toUpperCase() !== 'RESCHEDULED').length

  return (
    <IARoleGuard expectedRole="DEPT_COORDINATOR" minStage={2} title="IA - Department Coordinator View">
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>IA - DEPARTMENT COORDINATOR VIEW</strong>
              <CBadge color="info">Role: DEPT_COORDINATOR</CBadge>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex gap-3 flex-wrap mb-3">
                <CBadge color={unassigned > 0 ? 'warning' : 'success'}>Unassigned Courses: {unassigned}</CBadge>
                <CBadge color={conflicts > 0 ? 'danger' : 'success'}>Conflicts: {conflicts}</CBadge>
                <CBadge color={opsPending > 0 ? 'warning' : 'success'}>Ops Pending: {opsPending}</CBadge>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <ArpButton label="Schedule Planning" icon="view" color="info" onClick={() => navigate('/evaluation/ia/schedule-planning')} />
                <ArpButton label="Conflict Validation" icon="view" color="warning" onClick={() => navigate('/evaluation/ia/conflict-validation')} />
                <ArpButton label="Operations" icon="view" color="secondary" onClick={() => navigate('/evaluation/ia/operations')} />
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </IARoleGuard>
  )
}

export default IARoleDeptCoordinatorView
