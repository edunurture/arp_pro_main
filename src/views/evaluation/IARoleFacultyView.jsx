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

const IARoleFacultyView = () => {
  const state = loadIAPhaseState()
  const slots = Array.isArray(state.phase4?.snapshot?.slots) ? state.phase4.snapshot.slots : []
  const courses = Array.isArray(state.phase4?.snapshot?.courses) ? state.phase4.snapshot.courses : []
  const slotById = Object.fromEntries(slots.map((s) => [s.id, s]))

  let facultyCode = ''
  if (typeof window !== 'undefined') {
    const p1 = new URLSearchParams(window.location.search || '')
    const hash = String(window.location.hash || '')
    const p2 = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '')
    facultyCode = String(p1.get('faculty') || p2.get('faculty') || '').trim()
  }

  const scoped = facultyCode
    ? courses.filter((c) => String(c.faculty || '').toLowerCase().includes(facultyCode.toLowerCase()))
    : courses

  return (
    <IARoleGuard expectedRole="FACULTY" minStage={4} title="IA - Faculty View">
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>IA - FACULTY VIEW</strong>
              <CBadge color="primary">Role: FACULTY</CBadge>
            </CCardHeader>
            <CCardBody>
              <div className="mb-2 text-muted">
                {facultyCode ? `Scoped to faculty filter: ${facultyCode}` : 'Showing all faculty assignments (no faculty filter provided).'}
              </div>
              <CTable responsive hover align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Course</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Session</CTableHeaderCell>
                    <CTableHeaderCell>Venue</CTableHeaderCell>
                    <CTableHeaderCell>Students</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {scoped.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center text-muted py-4">
                        No published course allocations available.
                      </CTableDataCell>
                    </CTableRow>
                  ) : scoped.map((c) => {
                    const slot = slotById[c.slotId] || {}
                    return (
                      <CTableRow key={c.id}>
                        <CTableDataCell>{c.code} - {c.name}</CTableDataCell>
                        <CTableDataCell>{slot.date || '-'}</CTableDataCell>
                        <CTableDataCell>{slot.session || '-'}</CTableDataCell>
                        <CTableDataCell>{slot.venue || '-'}</CTableDataCell>
                        <CTableDataCell>{c.students || 0}</CTableDataCell>
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

export default IARoleFacultyView
