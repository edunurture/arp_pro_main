import React, { useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'

import { ArpButton, ArpToastStack } from '../../components/common'
import { IA_PHASE_KEYS, saveIAWorkflowPhase } from '../../services/iaWorkflowService'
import IAWorkflowScopeBanner from './IAWorkflowScopeBanner'

const PHASE_2_KEY = 'arp.evaluation.ia.phase2.schedule.draft.v1'
const PHASE_3_KEY = 'arp.evaluation.ia.phase3.validation.draft.v1'

const IAConflictValidationPhase3 = () => {
  const phase2 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_2_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])

  const [toast, setToast] = useState(null)
  const [status, setStatus] = useState('DRAFT')
  const [notes, setNotes] = useState('')
  const [slots, setSlots] = useState(Array.isArray(phase2.slots) ? phase2.slots : [])
  const [courses, setCourses] = useState(
    Array.isArray(phase2.courses)
      ? phase2.courses.map((x) => ({
          ...x,
          conflict: String(x.conflict || ''),
          conflictType: String(x.conflict || '').trim() ? 'HARD' : '',
          resolvedBy: '',
        }))
      : [],
  )

  const phase2Ready = String(phase2.status || '') === 'READY_FOR_PHASE_3'
  const workflowScope = phase2.workflowScope || phase2 || {}

  const showToast = (type, message) => {
    setToast({
      type,
      message,
      autohide: type === 'success',
      delay: 4500,
    })
  }

  const slotById = useMemo(
    () => Object.fromEntries(slots.map((slot) => [slot.id, slot])),
    [slots],
  )

  const recalculateConflicts = (list) => {
    return list.map((course) => {
      if (!course.slotId) {
        return {
          ...course,
          conflict: 'Unassigned Course',
          conflictType: 'HARD',
        }
      }

      const slot = slotById[course.slotId]
      if (!slot) {
        return {
          ...course,
          conflict: 'Invalid Slot',
          conflictType: 'HARD',
        }
      }

      const sameSlot = list.filter((x) => x.id !== course.id && x.slotId === course.slotId)
      const seatUsed = sameSlot.reduce((sum, x) => sum + Number(x.students || 0), 0) + Number(course.students || 0)
      if (seatUsed > Number(slot.capacity || 0)) {
        return {
          ...course,
          conflict: 'Venue Capacity Exceeded',
          conflictType: 'HARD',
        }
      }

      const facultyClash = sameSlot.some((x) => x.faculty === course.faculty)
      if (facultyClash) {
        return {
          ...course,
          conflict: 'Faculty Clash',
          conflictType: 'HARD',
        }
      }

      return {
        ...course,
        conflict: '',
        conflictType: '',
      }
    })
  }

  const onRecheck = () => {
    setCourses((prev) => recalculateConflicts(prev))
    showToast('info', 'Conflict recheck completed.')
  }

  const onChangeCourseSlot = (courseId, slotId) => {
    setCourses((prev) => {
      const next = prev.map((course) =>
        course.id === courseId
          ? {
              ...course,
              slotId,
              resolvedBy: 'Manual',
            }
          : course,
      )
      return recalculateConflicts(next)
    })
  }

  const unresolvedHard = useMemo(
    () => courses.filter((x) => String(x.conflictType) === 'HARD').length,
    [courses],
  )

  const unresolvedSoft = useMemo(
    () => courses.filter((x) => String(x.conflictType) === 'SOFT').length,
    [courses],
  )

  const onSaveDraft = () => {
    const payload = {
      status: 'DRAFT',
      notes,
      slots,
      courses,
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_3_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        const wf = phase2.workflowScope || {}
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_3_VALIDATION, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          programmeId: wf.programmeId || '',
          examName: wf.examName || wf.iaCycle || '',
          iaCycle: wf.iaCycle || '',
          workflowStatus: 'DRAFT',
          payload: {
            workflowScope: wf,
            notes,
            slots,
            courses,
            status: 'DRAFT',
          },
        })
      } catch {
        // Retain local draft when API save fails.
      }
    })()
    setStatus('DRAFT')
    showToast('success', 'Phase 3 draft saved.')
  }

  const onSubmitPhase3 = () => {
    if (unresolvedHard > 0) {
      showToast('danger', 'Resolve all hard conflicts before submitting Phase 3.')
      return
    }
    const payload = {
      status: 'READY_FOR_PHASE_4',
      notes,
      slots,
      courses,
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_3_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        const wf = phase2.workflowScope || {}
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_3_VALIDATION, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          programmeId: wf.programmeId || '',
          examName: wf.examName || wf.iaCycle || '',
          iaCycle: wf.iaCycle || '',
          workflowStatus: 'READY_FOR_PHASE_4',
          payload: {
            workflowScope: wf,
            notes,
            slots,
            courses,
            status: 'READY_FOR_PHASE_4',
          },
        })
      } catch {
        // Retain local submit state when API save fails.
      }
    })()
    setStatus('READY_FOR_PHASE_4')
    showToast('success', 'Phase 3 completed. Ready for publish phase.')
  }

  return (
    <CRow>
      <CCol xs={12}>
        <ArpToastStack toast={toast} onClose={() => setToast(null)} />
        <IAWorkflowScopeBanner scope={workflowScope} />
        {!phase2Ready ? (
          <CAlert color="warning" className="mb-3">
            Phase 2 is not submitted yet. Complete schedule planning (`READY_FOR_PHASE_3`) before finalizing validation.
          </CAlert>
        ) : null}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT - PHASE 3 CONFLICT VALIDATION</strong>
            <div className="d-flex gap-2">
              <CBadge color={phase2Ready ? 'success' : 'warning'}>
                Phase 2: {phase2Ready ? 'READY' : 'PENDING'}
              </CBadge>
              <CBadge color={status === 'READY_FOR_PHASE_4' ? 'success' : 'secondary'}>
                {status === 'READY_FOR_PHASE_4' ? 'READY FOR PHASE 4' : 'DRAFT'}
              </CBadge>
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel>Hard Conflicts</CFormLabel>
                <CFormInput value={String(unresolvedHard)} disabled />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Soft Conflicts</CFormLabel>
                <CFormInput value={String(unresolvedSoft)} disabled />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Total Courses</CFormLabel>
                <CFormInput value={String(courses.length)} disabled />
              </CCol>
              <CCol md={3} className="d-flex align-items-end">
                <ArpButton label="Recheck Conflicts" icon="search" color="info" onClick={onRecheck} />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Conflict Resolution Grid</strong>
          </CCardHeader>
          <CCardBody>
            <CTable responsive hover align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Course Code</CTableHeaderCell>
                  <CTableHeaderCell>Course Name</CTableHeaderCell>
                  <CTableHeaderCell>Students</CTableHeaderCell>
                  <CTableHeaderCell>Faculty</CTableHeaderCell>
                  <CTableHeaderCell>Current Slot</CTableHeaderCell>
                  <CTableHeaderCell>Reassign Slot</CTableHeaderCell>
                  <CTableHeaderCell>Conflict</CTableHeaderCell>
                  <CTableHeaderCell>Type</CTableHeaderCell>
                  <CTableHeaderCell>Resolved By</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {courses.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center text-muted py-4">
                      No schedule data found from Phase 2.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  courses.map((course) => (
                    <CTableRow key={course.id}>
                      <CTableDataCell>{course.code}</CTableDataCell>
                      <CTableDataCell>{course.name}</CTableDataCell>
                      <CTableDataCell>{course.students}</CTableDataCell>
                      <CTableDataCell>{course.faculty}</CTableDataCell>
                      <CTableDataCell>
                        {course.slotId
                          ? `${slotById[course.slotId]?.date || ''} ${slotById[course.slotId]?.session || ''} (${slotById[course.slotId]?.venue || ''})`
                          : 'Not Assigned'}
                      </CTableDataCell>
                      <CTableDataCell style={{ minWidth: 220 }}>
                        <CFormSelect
                          value={course.slotId || ''}
                          onChange={(e) => onChangeCourseSlot(course.id, e.target.value)}
                        >
                          <option value="">Select Slot</option>
                          {slots.map((slot) => (
                            <option key={slot.id} value={slot.id}>
                              {slot.date} {slot.session} {slot.startTime}-{slot.endTime} ({slot.venue})
                            </option>
                          ))}
                        </CFormSelect>
                      </CTableDataCell>
                      <CTableDataCell>
                        {course.conflict ? <CBadge color="danger">{course.conflict}</CBadge> : <CBadge color="success">No Conflict</CBadge>}
                      </CTableDataCell>
                      <CTableDataCell>
                        {course.conflictType ? <CBadge color="danger">{course.conflictType}</CBadge> : <CBadge color="secondary">-</CBadge>}
                      </CTableDataCell>
                      <CTableDataCell>{course.resolvedBy || '-'}</CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader><strong>Phase 3 Actions</strong></CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2}><CFormLabel>Validation Notes</CFormLabel></CCol>
              <CCol md={10}>
                <CFormInput
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Remarks about conflict handling for audit."
                />
              </CCol>
              <CCol xs={12} className="d-flex justify-content-end gap-2">
                <ArpButton label="Save Draft" icon="save" color="secondary" onClick={onSaveDraft} />
                <ArpButton label="Submit Phase 3" icon="submit" color="success" onClick={onSubmitPhase3} />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default IAConflictValidationPhase3
