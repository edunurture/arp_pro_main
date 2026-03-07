import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CAlert, CBadge, CCard, CCardBody, CCardHeader } from '@coreui/react-pro'

import { ArpButton } from '../../components/common'
import {
  getRoleDescription,
  getWorkflowStage,
  hasRequiredStage,
  loadIAPhaseState,
  resolveCurrentIARole,
} from './iaRoleAccess'

const IARoleGuard = ({ expectedRole, minStage = 0, title, children }) => {
  const navigate = useNavigate()
  const currentRole = resolveCurrentIARole()
  const state = loadIAPhaseState()
  const currentStage = getWorkflowStage(state)
  const stageOk = hasRequiredStage(state, minStage)
  const roleOk = Boolean(currentRole) && (currentRole === expectedRole || currentRole === 'ADMIN')

  const goRole = (role) => {
    const roleKey = String(role || '').toLowerCase()
    const rolePath = roleKey === 'admin'
      ? '/evaluation/ia/role/admin'
      : roleKey === 'dept-coordinator'
        ? '/evaluation/ia/role/dept-coordinator'
        : roleKey === 'faculty'
          ? '/evaluation/ia/role/faculty'
          : '/evaluation/ia/role/student'
    const next = `${rolePath}?role=${roleKey}`
    navigate(next)
  }

  if (!currentRole) {
    return (
      <CCard>
        <CCardHeader><strong>{title}</strong></CCardHeader>
        <CCardBody>
          <CAlert color="warning" className="mb-3">
            IA role is not resolved. Open this screen with a role context.
          </CAlert>
          <div className="d-flex gap-2 flex-wrap">
            <ArpButton label="Admin" icon="view" color="dark" onClick={() => goRole('admin')} />
            <ArpButton label="Dept Coordinator" icon="view" color="info" onClick={() => goRole('dept-coordinator')} />
            <ArpButton label="Faculty" icon="view" color="primary" onClick={() => goRole('faculty')} />
            <ArpButton label="Student" icon="view" color="secondary" onClick={() => goRole('student')} />
          </div>
        </CCardBody>
      </CCard>
    )
  }

  if (!roleOk) {
    return (
      <CCard>
        <CCardHeader><strong>{title}</strong></CCardHeader>
        <CCardBody>
          <CAlert color="danger">
            Access denied for current role.
          </CAlert>
          <CBadge color="dark" className="mb-2">Current Role: {currentRole}</CBadge>
          <div className="text-muted">{getRoleDescription(currentRole)}</div>
        </CCardBody>
      </CCard>
    )
  }

  if (!stageOk) {
    return (
      <CCard>
        <CCardHeader><strong>{title}</strong></CCardHeader>
        <CCardBody>
          <CAlert color="warning">
            Required workflow stage is not reached yet for this role view.
          </CAlert>
          <CBadge color="info">Current Workflow Stage: {currentStage}</CBadge>
        </CCardBody>
      </CCard>
    )
  }

  return children
}

export default IARoleGuard
