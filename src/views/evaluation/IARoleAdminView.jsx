import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'

import { ArpButton } from '../../components/common'
import IARoleGuard from './IARoleGuard'
import { loadIAPhaseState } from './iaRoleAccess'

const statusColor = (status) => {
  const s = String(status || '').toUpperCase()
  if (s === 'PUBLISHED' || s.includes('READY')) return 'success'
  if (s === 'DRAFT' || s.includes('PROGRESS')) return 'warning'
  if (!s) return 'secondary'
  return 'info'
}

const IARoleAdminView = () => {
  const navigate = useNavigate()
  const state = loadIAPhaseState()
  const rows = [
    { phase: 'Phase 1 - Setup', status: state.phase1?.status || 'NOT_STARTED', path: '/evaluation/ia/setup' },
    { phase: 'Phase 2 - Schedule Planning', status: state.phase2?.status || 'NOT_STARTED', path: '/evaluation/ia/schedule-planning' },
    { phase: 'Phase 3 - Conflict Validation', status: state.phase3?.status || 'NOT_STARTED', path: '/evaluation/ia/conflict-validation' },
    { phase: 'Phase 4 - Publish', status: state.phase4?.status || 'NOT_STARTED', path: '/evaluation/ia/publish' },
    { phase: 'Phase 5 - Operations', status: state.phase5?.status || 'NOT_STARTED', path: '/evaluation/ia/operations' },
  ]

  return (
    <IARoleGuard expectedRole="ADMIN" minStage={0} title="IA - Admin Oversight View">
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>IA - ADMIN OVERSIGHT</strong>
              <CBadge color="dark">Role: ADMIN</CBadge>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <ArpButton label="Workspace" icon="view" color="info" onClick={() => navigate('/evaluation/ia/workspace')} />
                <ArpButton label="Publish" icon="publish" color="success" onClick={() => navigate('/evaluation/ia/publish')} />
                <ArpButton label="Operations" icon="view" color="warning" onClick={() => navigate('/evaluation/ia/operations')} />
              </div>
              <CTable responsive hover align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>IA Phase</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Action</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {rows.map((r) => (
                    <CTableRow key={r.phase}>
                      <CTableDataCell>{r.phase}</CTableDataCell>
                      <CTableDataCell><CBadge color={statusColor(r.status)}>{r.status}</CBadge></CTableDataCell>
                      <CTableDataCell>
                        <ArpButton label="Open" icon="view" color="secondary" onClick={() => navigate(r.path)} />
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </IARoleGuard>
  )
}

export default IARoleAdminView
