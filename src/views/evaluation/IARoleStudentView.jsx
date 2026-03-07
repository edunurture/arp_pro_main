import React from 'react'
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

import IARoleGuard from './IARoleGuard'
import { loadIAPhaseState } from './iaRoleAccess'

const IARoleStudentView = () => {
  const state = loadIAPhaseState()
  const slots = Array.isArray(state.phase4?.snapshot?.slots) ? state.phase4.snapshot.slots : []
  const courses = Array.isArray(state.phase4?.snapshot?.courses) ? state.phase4.snapshot.courses : []
  const opsRows = Array.isArray(state.phase5?.rows) ? state.phase5.rows : []
  const slotById = Object.fromEntries(slots.map((s) => [s.id, s]))
  const opsByCourseId = Object.fromEntries(opsRows.map((r) => [r.id, r]))

  return (
    <IARoleGuard expectedRole="STUDENT" minStage={4} title="IA - Student View">
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>IA - STUDENT VIEW</strong>
              <CBadge color="secondary">Role: STUDENT</CBadge>
            </CCardHeader>
            <CCardBody>
              <CTable responsive hover align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Course</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Session</CTableHeaderCell>
                    <CTableHeaderCell>Venue</CTableHeaderCell>
                    <CTableHeaderCell>Exam Day Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {courses.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center text-muted py-4">
                        IA timetable is not published yet.
                      </CTableDataCell>
                    </CTableRow>
                  ) : courses.map((c) => {
                    const slot = slotById[c.slotId] || {}
                    const ops = opsByCourseId[c.id] || {}
                    const status = String(ops.operationStatus || 'SCHEDULED')
                    return (
                      <CTableRow key={c.id}>
                        <CTableDataCell>{c.code} - {c.name}</CTableDataCell>
                        <CTableDataCell>{slot.date || '-'}</CTableDataCell>
                        <CTableDataCell>{slot.session || '-'}</CTableDataCell>
                        <CTableDataCell>{slot.venue || '-'}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={status === 'COMPLETED' ? 'success' : status === 'RESCHEDULED' ? 'warning' : 'info'}>
                            {status}
                          </CBadge>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </IARoleGuard>
  )
}

export default IARoleStudentView
