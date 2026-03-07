import React, { useEffect, useMemo, useState } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTooltip,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilList } from '@coreui/icons'

import { ArpButton, ArpToastStack } from '../../components/common'
import { getIAOperationRoster, getIAWorkflowPhase, IA_PHASE_KEYS, saveIAWorkflowPhase } from '../../services/iaWorkflowService'
import IAWorkflowScopeBanner from './IAWorkflowScopeBanner'

const PHASE_4_KEY = 'arp.evaluation.ia.phase4.publish.draft.v1'
const PHASE_5_KEY = 'arp.evaluation.ia.phase5.operations.draft.v1'

const buildInitialOpsRows = (courses = []) =>
  courses.map((course) => ({
    ...course,
    presentCount: Number(course.students || 0),
    absentCount: 0,
    malpracticeCount: 0,
    studentRoster: [],
    operationStatus: 'PENDING',
  }))

const getOperationRowValidation = (row) => {
  const errors = []
  const totalStudents = Number(row?.students || 0)
  const presentCount = Number(row?.presentCount || 0)
  const absentCount = Number(row?.absentCount || 0)
  const malpracticeCount = Number(row?.malpracticeCount || 0)
  const roster = Array.isArray(row?.studentRoster) ? row.studentRoster : []
  const hasRoster = roster.length > 0

  if (presentCount < 0 || absentCount < 0 || malpracticeCount < 0) {
    errors.push('Attendance counts cannot be negative.')
  }

  if (presentCount + absentCount !== totalStudents) {
    errors.push('Present and absent counts must match total student strength.')
  }

  if (malpracticeCount > presentCount) {
    errors.push('Malpractice count cannot exceed present count.')
  }

  if (hasRoster) {
    const counts = {
      present: roster.filter((student) => String(student.attendanceStatus || 'PRESENT') === 'PRESENT').length,
      absent: roster.filter((student) => String(student.attendanceStatus || 'PRESENT') === 'ABSENT').length,
      malpractice: roster.filter((student) => String(student.attendanceStatus || 'PRESENT') === 'MALPRACTICE').length,
    }

    if (roster.length !== totalStudents) {
      errors.push('Saved roster count must match total student strength.')
    }

    if (counts.present !== presentCount || counts.absent !== absentCount || counts.malpractice !== malpracticeCount) {
      errors.push('Saved roster does not match attendance summary counts.')
    }

    const missingMalpracticeRemarks = roster.filter(
      (student) =>
        String(student.attendanceStatus || 'PRESENT') === 'MALPRACTICE' &&
        !String(student.malpracticeRemark || '').trim(),
    ).length

    if (missingMalpracticeRemarks > 0) {
      errors.push('Malpractice remark is required for all malpractice-marked students.')
    }
  }

  return {
    valid: errors.length === 0,
    hasRoster,
    errors,
  }
}

const IAOperationsPhase5 = () => {
  const phase4 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_4_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])

  const phase4Published = String(phase4.status || '') === 'PUBLISHED'
  const workflowScope = phase4.workflowScope || phase4 || {}
  const snapshotCourses = Array.isArray(phase4?.snapshot?.courses) ? phase4.snapshot.courses : []
  const snapshotSlots = Array.isArray(phase4?.snapshot?.slots) ? phase4.snapshot.slots : []
  const slotById = useMemo(
    () => Object.fromEntries(snapshotSlots.map((slot) => [slot.id, slot])),
    [snapshotSlots],
  )

  const [toast, setToast] = useState(null)
  const [status, setStatus] = useState('OPS_IN_PROGRESS')
  const [dayFilter, setDayFilter] = useState('')
  const [courseKey, setCourseKey] = useState('')
  const [rosterModalOpen, setRosterModalOpen] = useState(false)
  const [rosterCourseId, setRosterCourseId] = useState('')
  const [rosterLoading, setRosterLoading] = useState(false)
  const [rosterSearch, setRosterSearch] = useState('')
  const [rosterFilter, setRosterFilter] = useState('ALL')
  const [opsRows, setOpsRows] = useState(() => buildInitialOpsRows(snapshotCourses))
  const [reschedule, setReschedule] = useState({
    courseId: '',
    reason: '',
    newDate: '',
    newSession: 'FN',
    newStartTime: '',
    newEndTime: '',
    newVenue: '',
    approvedBy: '',
  })
  const isAdminUser = useMemo(() => {
    if (typeof window === 'undefined') return false
    const path = String(window.location?.pathname || '').toLowerCase()
    const hash = String(window.location?.hash || '').toLowerCase()
    const search = String(window.location?.search || '').toLowerCase()
    const candidateKeys = ['arp.user', 'user', 'authUser', 'currentUser']
    const fromStorage = candidateKeys.some((key) => {
      const raw = window.sessionStorage.getItem(key) || window.localStorage.getItem(key)
      if (!raw) return false
      try {
        const obj = JSON.parse(raw)
        const roleText = String(obj?.role || obj?.userRole || obj?.roleCode || obj?.designation || '').toLowerCase()
        return roleText.includes('admin') || roleText.includes('controller')
      } catch {
        const plain = String(raw || '').toLowerCase()
        return plain.includes('admin') || plain.includes('controller')
      }
    })
    return (
      path.includes('/evaluation/ia/role/admin') ||
      hash.includes('/evaluation/ia/role/admin') ||
      search.includes('role=admin') ||
      fromStorage
    )
  }, [])

  const showToast = (type, message) => {
    setToast({
      type,
      message,
      autohide: type === 'success',
      delay: 4500,
    })
  }

  useEffect(() => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(PHASE_5_KEY) || '{}')
      if (saved && typeof saved === 'object') {
        if (String(saved.status || '').trim()) setStatus(String(saved.status))
        if (Array.isArray(saved.rows) && saved.rows.length > 0) setOpsRows(saved.rows)
        if (saved.reschedule && typeof saved.reschedule === 'object') {
          setReschedule((prev) => ({ ...prev, ...saved.reschedule }))
        }
      }
    } catch {
      // ignore invalid local phase 5 draft
    }
  }, [])

  useEffect(() => {
    const wf = phase4.workflowScope || {}
    if (!wf.institutionId || !wf.academicYearId || !wf.chosenSemester || !wf.programmeId || !(wf.iaCycle || wf.examName)) {
      return
    }
    ;(async () => {
      try {
        const remote = await getIAWorkflowPhase(IA_PHASE_KEYS.PHASE_5_OPERATIONS, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          programmeId: wf.programmeId || '',
          iaCycle: wf.iaCycle || wf.examName || '',
          examName: wf.examName || wf.iaCycle || '',
        })
        const payload = remote?.payload && typeof remote.payload === 'object' ? remote.payload : null
        if (!payload) return
        if (String(remote?.workflowStatus || payload.status || '').trim()) {
          setStatus(String(remote.workflowStatus || payload.status))
        }
        if (Array.isArray(payload.rows) && payload.rows.length > 0) {
          setOpsRows(payload.rows)
        }
        if (payload.reschedule && typeof payload.reschedule === 'object') {
          setReschedule((prev) => ({ ...prev, ...payload.reschedule }))
        }
      } catch {
        // keep local/session state when remote phase 5 is unavailable
      }
    })()
  }, [phase4])

  const filteredRows = useMemo(() => {
    return opsRows.filter((row) => {
      const slot = slotById[row.slotId]
      const byDay = dayFilter ? String(slot?.date || '') === dayFilter : true
      const byCourse = courseKey ? String(row.id) === courseKey : true
      return byDay && byCourse
    })
  }, [opsRows, slotById, dayFilter, courseKey])

  const activeRosterRow = useMemo(
    () => opsRows.find((row) => String(row.id) === String(rosterCourseId)) || null,
    [opsRows, rosterCourseId],
  )

  const visibleRosterStudents = useMemo(() => {
    const rows = Array.isArray(activeRosterRow?.studentRoster) ? activeRosterRow.studentRoster : []
    return rows.filter((student) => {
      const matchesSearch = rosterSearch
        ? String(student.registerNumber || '').toLowerCase().includes(rosterSearch.toLowerCase()) ||
          String(student.firstName || '').toLowerCase().includes(rosterSearch.toLowerCase())
        : true
      const matchesFilter = rosterFilter === 'ALL' ? true : String(student.attendanceStatus || 'PRESENT') === rosterFilter
      return matchesSearch && matchesFilter
    })
  }, [activeRosterRow, rosterSearch, rosterFilter])

  const computeRosterCounts = (roster = []) => {
    const presentCount = roster.filter((x) => String(x.attendanceStatus || 'PRESENT') === 'PRESENT').length
    const absentCount = roster.filter((x) => String(x.attendanceStatus || 'PRESENT') === 'ABSENT').length
    const malpracticeCount = roster.filter((x) => String(x.attendanceStatus || 'PRESENT') === 'MALPRACTICE').length
    return { presentCount, absentCount, malpracticeCount }
  }

  const getInvalidRows = (rows = opsRows) =>
    rows
      .map((row) => ({ row, validation: getOperationRowValidation(row) }))
      .filter(({ validation }) => !validation.valid)

  const syncRosterToRow = (row, roster) => {
    const { presentCount, absentCount, malpracticeCount } = computeRosterCounts(roster)
    return {
      ...row,
      studentRoster: roster,
      presentCount,
      absentCount,
      malpracticeCount,
      students: roster.length || row.students,
      operationStatus: row.operationStatus === 'RESCHEDULED' ? 'RESCHEDULED' : 'ATTENDANCE_UPDATED',
    }
  }

  const openRosterModal = async (row) => {
    setRosterCourseId(row.id)
    setRosterSearch('')
    setRosterFilter('ALL')
    setRosterModalOpen(true)
    if (Array.isArray(row.studentRoster) && row.studentRoster.length > 0) return
    setRosterLoading(true)
    try {
      const data = await getIAOperationRoster({ courseOfferingId: row.id })
      const students = Array.isArray(data?.students)
        ? data.students.map((student) => ({
            ...student,
            attendanceStatus: 'PRESENT',
            malpracticeRemark: '',
          }))
        : []
      setOpsRows((prev) =>
        prev.map((x) => (String(x.id) === String(row.id) ? syncRosterToRow(x, students) : x)),
      )
    } catch {
      showToast('danger', 'Unable to load student roster for selected course.')
    } finally {
      setRosterLoading(false)
    }
  }

  const onRosterStatusChange = (studentId, attendanceStatus) => {
    setOpsRows((prev) =>
      prev.map((row) => {
        if (String(row.id) !== String(rosterCourseId) || status === 'READY_FOR_EVALUATION_FLOW') return row
        const nextRoster = (row.studentRoster || []).map((student) =>
          String(student.studentId) === String(studentId)
            ? {
                ...student,
                attendanceStatus,
                malpracticeRemark: attendanceStatus === 'MALPRACTICE' ? student.malpracticeRemark || '' : '',
              }
            : student,
        )
        return syncRosterToRow(row, nextRoster)
      }),
    )
  }

  const onRosterCheckboxChange = (studentId, targetStatus, checked) => {
    if (!checked) {
      if (targetStatus !== 'PRESENT') return
      onRosterStatusChange(studentId, 'PRESENT')
      return
    }
    onRosterStatusChange(studentId, targetStatus)
  }

  const onRosterRemarkChange = (studentId, malpracticeRemark) => {
    setOpsRows((prev) =>
      prev.map((row) => {
        if (String(row.id) !== String(rosterCourseId) || status === 'READY_FOR_EVALUATION_FLOW') return row
        const nextRoster = (row.studentRoster || []).map((student) =>
          String(student.studentId) === String(studentId)
            ? { ...student, malpracticeRemark }
            : student,
        )
        return syncRosterToRow(row, nextRoster)
      }),
    )
  }

  const onCountChange = (id, key, value) => {
    const numeric = Math.max(0, Number(value || 0))
    setOpsRows((prev) =>
      prev.map((row) => {
        if (row.id !== id || status === 'READY_FOR_EVALUATION_FLOW') return row
        if (Array.isArray(row.studentRoster) && row.studentRoster.length > 0) return row
        const next = { ...row, [key]: numeric }
        const total = Number(next.students || 0)
        if (key === 'presentCount') next.absentCount = Math.max(0, total - numeric)
        if (key === 'absentCount') next.presentCount = Math.max(0, total - numeric)
        if (next.malpracticeCount > next.presentCount) next.malpracticeCount = next.presentCount
        next.operationStatus = 'ATTENDANCE_UPDATED'
        return next
      }),
    )
  }

  const onMarkCompleted = (id) => {
    const targetRow = opsRows.find((row) => String(row.id) === String(id))
    const validation = getOperationRowValidation(targetRow)
    if (!validation.hasRoster) {
      showToast('danger', 'Load and save student-wise attendance through Mark Students before completing the course.')
      return
    }
    if (!validation.valid) {
      showToast('danger', validation.errors[0] || 'Attendance validation failed for selected course.')
      return
    }
    setOpsRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        return { ...row, operationStatus: 'COMPLETED' }
      }),
    )
    showToast('info', 'Course operation marked completed.')
  }

  const onSaveDraft = () => {
    const invalidCompletedRows = opsRows.filter((row) => {
      if (row.operationStatus !== 'COMPLETED') return false
      return !getOperationRowValidation(row).valid
    })
    if (invalidCompletedRows.length > 0) {
      showToast(
        'danger',
        `Cannot save draft. ${invalidCompletedRows.length} completed course(s) still have attendance validation errors.`,
      )
      return
    }
    const payload = {
      status,
      rows: opsRows,
      reschedule,
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_5_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        const wf = phase4.workflowScope || {}
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_5_OPERATIONS, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          programmeId: wf.programmeId || '',
          examName: wf.examName || wf.iaCycle || '',
          iaCycle: wf.iaCycle || '',
          workflowStatus: status,
          payload: {
            workflowScope: wf,
            ...payload,
          },
        })
      } catch {
        // Retain local draft when API save fails.
      }
    })()
    showToast('success', 'Phase 5 operations draft saved.')
  }

  const onApplyReschedule = () => {
    if (!reschedule.courseId || !reschedule.reason || !reschedule.newDate || !reschedule.newVenue) {
      showToast('danger', 'Select course, reason, new date and new venue for reschedule.')
      return
    }
    setOpsRows((prev) =>
      prev.map((row) => {
        if (row.id !== reschedule.courseId) return row
        return {
          ...row,
          operationStatus: 'RESCHEDULED',
          rescheduleMeta: { ...reschedule },
        }
      }),
    )
    showToast('warning', 'Emergency reschedule applied for selected course.')
  }

  const onClosePhase5 = () => {
    const pending = opsRows.filter((row) => row.operationStatus !== 'COMPLETED' && row.operationStatus !== 'RESCHEDULED').length
    if (pending > 0) {
      showToast('danger', `Cannot close phase. ${pending} course operation(s) still pending.`)
      return
    }
    const invalidCompletedRows = opsRows
      .filter((row) => row.operationStatus === 'COMPLETED')
      .map((row) => ({ row, validation: getOperationRowValidation(row) }))
      .filter(({ validation }) => !validation.valid)
    if (invalidCompletedRows.length > 0) {
      showToast(
        'danger',
        `Cannot close phase. ${invalidCompletedRows.length} completed course(s) still have attendance validation errors.`,
      )
      return
    }
    const payload = {
      status: 'READY_FOR_EVALUATION_FLOW',
      rows: opsRows,
      reschedule,
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_5_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        const wf = phase4.workflowScope || {}
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_5_OPERATIONS, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          programmeId: wf.programmeId || '',
          examName: wf.examName || wf.iaCycle || '',
          iaCycle: wf.iaCycle || '',
          workflowStatus: 'READY_FOR_EVALUATION_FLOW',
          payload: {
            workflowScope: wf,
            ...payload,
          },
        })
      } catch {
        // Retain local close state when API save fails.
      }
    })()
    setStatus('READY_FOR_EVALUATION_FLOW')
    showToast('success', 'Phase 5 completed and closed.')
  }

  const onReopenPhase5 = () => {
    if (!isAdminUser) {
      showToast('danger', 'Only Admin can reopen a closed Phase 5.')
      return
    }
    const payload = {
      status: 'OPS_IN_PROGRESS',
      rows: opsRows,
      reschedule,
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_5_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        const wf = phase4.workflowScope || {}
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_5_OPERATIONS, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          programmeId: wf.programmeId || '',
          examName: wf.examName || wf.iaCycle || '',
          iaCycle: wf.iaCycle || '',
          workflowStatus: 'OPS_IN_PROGRESS',
          payload: {
            workflowScope: wf,
            ...payload,
          },
        })
      } catch {
        // Retain local reopen state when API save fails.
      }
    })()
    setStatus('OPS_IN_PROGRESS')
    showToast('warning', 'Phase 5 reopened for correction.')
  }

  const uniqueDates = [...new Set(snapshotSlots.map((slot) => slot.date))]

  return (
    <CRow>
      <CCol xs={12}>
        <ArpToastStack toast={toast} onClose={() => setToast(null)} />
        <IAWorkflowScopeBanner scope={workflowScope} />
        {!phase4Published ? (
          <div className="alert alert-warning mb-3">
            Phase 4 is not published yet. Publish schedule before running day-of operations.
          </div>
        ) : null}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT - PHASE 5 OPERATIONS</strong>
            <div className="d-flex gap-2">
              <CBadge color={phase4Published ? 'success' : 'warning'}>
                Phase 4: {phase4Published ? 'PUBLISHED' : 'PENDING'}
              </CBadge>
              <CBadge color={status === 'READY_FOR_EVALUATION_FLOW' ? 'success' : 'info'}>
                {status}
              </CBadge>
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2}><CFormLabel>Filter by Date</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
                  <option value="">All Dates</option>
                  {uniqueDates.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>Filter by Course</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={courseKey} onChange={(e) => setCourseKey(e.target.value)}>
                  <option value="">All Courses</option>
                  {opsRows.map((row) => (
                    <option key={row.id} value={row.id}>{row.code} - {row.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Attendance and Exam Day Status</strong></CCardHeader>
          <CCardBody>
            <div className="d-flex justify-content-end mb-2">
              <small className="text-muted">
                SOP sequence: Mark Students, Complete Course, then Close Phase 5.
              </small>
            </div>
            <CTable responsive hover align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Course</CTableHeaderCell>
                  <CTableHeaderCell>Date/Session</CTableHeaderCell>
                  <CTableHeaderCell>Venue</CTableHeaderCell>
                  <CTableHeaderCell>Total</CTableHeaderCell>
                  <CTableHeaderCell>Present</CTableHeaderCell>
                  <CTableHeaderCell>Absent</CTableHeaderCell>
                  <CTableHeaderCell>Malpractice</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredRows.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center text-muted py-4">
                      No operation records for selected filters.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filteredRows.map((row) => {
                    const slot = slotById[row.slotId]
                    const validation = getOperationRowValidation(row)
                    return (
                      <CTableRow key={row.id}>
                        <CTableDataCell>{row.code} - {row.name}</CTableDataCell>
                        <CTableDataCell>{slot?.date || '-'} {slot?.session || '-'}</CTableDataCell>
                        <CTableDataCell>{slot?.venue || '-'}</CTableDataCell>
                        <CTableDataCell>{row.students}</CTableDataCell>
                        <CTableDataCell style={{ maxWidth: 110 }}>
                          <CFormInput
                            type="number"
                            min={0}
                            value={row.presentCount}
                            disabled={status === 'READY_FOR_EVALUATION_FLOW' || (Array.isArray(row.studentRoster) && row.studentRoster.length > 0)}
                            onChange={(e) => onCountChange(row.id, 'presentCount', e.target.value)}
                          />
                        </CTableDataCell>
                        <CTableDataCell style={{ maxWidth: 110 }}>
                          <CFormInput
                            type="number"
                            min={0}
                            value={row.absentCount}
                            disabled={status === 'READY_FOR_EVALUATION_FLOW' || (Array.isArray(row.studentRoster) && row.studentRoster.length > 0)}
                            onChange={(e) => onCountChange(row.id, 'absentCount', e.target.value)}
                          />
                        </CTableDataCell>
                        <CTableDataCell style={{ maxWidth: 110 }}>
                          <CFormInput
                            type="number"
                            min={0}
                            value={row.malpracticeCount}
                            disabled={status === 'READY_FOR_EVALUATION_FLOW' || (Array.isArray(row.studentRoster) && row.studentRoster.length > 0)}
                            onChange={(e) => onCountChange(row.id, 'malpracticeCount', e.target.value)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex flex-column gap-1">
                            <div className="d-flex gap-1 flex-wrap">
                              <CBadge color={row.operationStatus === 'COMPLETED' ? 'success' : row.operationStatus === 'RESCHEDULED' ? 'warning' : 'secondary'}>
                                {row.operationStatus}
                              </CBadge>
                              <CBadge color={validation.valid ? 'success' : 'danger'}>
                                {validation.valid ? 'VALID' : 'INVALID'}
                              </CBadge>
                            </div>
                            {!validation.valid ? (
                              <small className="text-danger">
                                {validation.errors[0]}
                              </small>
                            ) : null}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div className="d-flex gap-2">
                            <CTooltip content="Mark Students" placement="top">
                              <span className="d-inline-block">
                                <CButton
                                  type="button"
                                  color="info"
                                  size="sm"
                                  className="rounded-circle text-white"
                                  style={{ width: 34, height: 34 }}
                                  onClick={() => openRosterModal(row)}
                                  disabled={status === 'READY_FOR_EVALUATION_FLOW'}
                                  aria-label="Mark Students"
                                >
                                  <CIcon icon={cilList} size="sm" />
                                </CButton>
                              </span>
                            </CTooltip>
                            <CTooltip content="Complete" placement="top">
                              <span className="d-inline-block">
                                <CButton
                                  type="button"
                                  color="success"
                                  size="sm"
                                  className="rounded-circle text-white"
                                  style={{ width: 34, height: 34 }}
                                  onClick={() => onMarkCompleted(row.id)}
                                  disabled={status === 'READY_FOR_EVALUATION_FLOW'}
                                  aria-label="Complete"
                                >
                                  <CIcon icon={cilCheckCircle} size="sm" />
                                </CButton>
                              </span>
                            </CTooltip>
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Emergency Reschedule</strong></CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2}><CFormLabel>Course</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={reschedule.courseId} onChange={(e) => setReschedule((p) => ({ ...p, courseId: e.target.value }))}>
                  <option value="">Select Course</option>
                  {opsRows.map((row) => (
                    <option key={row.id} value={row.id}>{row.code} - {row.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>Reason</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput value={reschedule.reason} onChange={(e) => setReschedule((p) => ({ ...p, reason: e.target.value }))} />
              </CCol>
              <CCol md={2}><CFormLabel>New Date</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput type="date" value={reschedule.newDate} onChange={(e) => setReschedule((p) => ({ ...p, newDate: e.target.value }))} />
              </CCol>
              <CCol md={2}><CFormLabel>New Session</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={reschedule.newSession} onChange={(e) => setReschedule((p) => ({ ...p, newSession: e.target.value }))}>
                  <option value="FN">FN</option>
                  <option value="AN">AN</option>
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>New Start Time</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput type="time" value={reschedule.newStartTime} onChange={(e) => setReschedule((p) => ({ ...p, newStartTime: e.target.value }))} />
              </CCol>
              <CCol md={2}><CFormLabel>New End Time</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput type="time" value={reschedule.newEndTime} onChange={(e) => setReschedule((p) => ({ ...p, newEndTime: e.target.value }))} />
              </CCol>
              <CCol md={2}><CFormLabel>New Venue</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput value={reschedule.newVenue} onChange={(e) => setReschedule((p) => ({ ...p, newVenue: e.target.value }))} />
              </CCol>
              <CCol md={2}><CFormLabel>Approved By</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput value={reschedule.approvedBy} onChange={(e) => setReschedule((p) => ({ ...p, approvedBy: e.target.value }))} />
              </CCol>
              <CCol xs={12}>
                <CFormCheck
                  label="I confirm the reschedule communication will be sent to all affected users."
                  checked={Boolean(reschedule.approvedBy)}
                  readOnly
                />
              </CCol>
            </CRow>
            <div className="d-flex justify-content-end mt-3">
              <ArpButton label="Apply Reschedule" icon="edit" color="warning" onClick={onApplyReschedule} />
            </div>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader><strong>Phase 5 Actions</strong></CCardHeader>
          <CCardBody>
            {getInvalidRows().length > 0 ? (
              <div className="alert alert-warning mb-3">
                {getInvalidRows().length} course record(s) currently have attendance validation issues. Correct them before completion or phase close.
              </div>
            ) : null}
            {status === 'READY_FOR_EVALUATION_FLOW' ? (
              <div className="alert alert-success mb-3">
                Phase 5 is closed. Attendance rows are now read-only.
              </div>
            ) : null}
            <div className="d-flex justify-content-end gap-2">
            <ArpButton label="Save Draft" icon="save" color="secondary" onClick={onSaveDraft} />
            {status === 'READY_FOR_EVALUATION_FLOW' ? (
              <ArpButton
                label="Reopen Phase 5"
                icon="edit"
                color="warning"
                onClick={onReopenPhase5}
                disabled={!isAdminUser}
              />
            ) : (
              <ArpButton label="Close Phase 5" icon="submit" color="success" onClick={onClosePhase5} />
            )}
            </div>
          </CCardBody>
        </CCard>

        <CModal size="xl" visible={rosterModalOpen} onClose={() => setRosterModalOpen(false)}>
          <CModalHeader>
            <CModalTitle>
              Student Attendance Marking
              {activeRosterRow ? ` - ${activeRosterRow.code} - ${activeRosterRow.name}` : ''}
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow className="g-3 mb-3">
              <CCol md={4}>
                <CFormLabel>Search Student</CFormLabel>
                <CFormInput value={rosterSearch} onChange={(e) => setRosterSearch(e.target.value)} placeholder="Register No / Name" />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Filter Status</CFormLabel>
                <CFormSelect value={rosterFilter} onChange={(e) => setRosterFilter(e.target.value)}>
                  <option value="ALL">All</option>
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="MALPRACTICE">Malpractice</option>
                </CFormSelect>
              </CCol>
              <CCol md={5} className="d-flex align-items-end justify-content-end">
                {activeRosterRow ? (
                  <div className="d-flex gap-2 flex-wrap">
                    <CBadge color="success">Present: {activeRosterRow.presentCount}</CBadge>
                    <CBadge color="warning">Absent: {activeRosterRow.absentCount}</CBadge>
                    <CBadge color="danger">Malpractice: {activeRosterRow.malpracticeCount}</CBadge>
                  </div>
                ) : null}
              </CCol>
            </CRow>

            {rosterLoading ? <div className="text-muted">Loading student roster...</div> : null}
            <CTable responsive hover align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Register No</CTableHeaderCell>
                  <CTableHeaderCell>Student Name</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">P</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">A</CTableHeaderCell>
                  <CTableHeaderCell className="text-center">M</CTableHeaderCell>
                  <CTableHeaderCell>Malpractice Remark</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {!rosterLoading && visibleRosterStudents.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center text-muted py-4">
                      No students found for selected course.
                    </CTableDataCell>
                  </CTableRow>
                ) : null}
                {visibleRosterStudents.map((student) => (
                  <CTableRow key={student.studentId}>
                    <CTableDataCell>{student.registerNumber || '-'}</CTableDataCell>
                    <CTableDataCell>{student.firstName || '-'}</CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CFormCheck
                        checked={String(student.attendanceStatus || 'PRESENT') === 'PRESENT'}
                        disabled={status === 'READY_FOR_EVALUATION_FLOW'}
                        onChange={(e) => onRosterCheckboxChange(student.studentId, 'PRESENT', e.target.checked)}
                      />
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CFormCheck
                        checked={String(student.attendanceStatus || 'PRESENT') === 'ABSENT'}
                        disabled={status === 'READY_FOR_EVALUATION_FLOW'}
                        onChange={(e) => onRosterCheckboxChange(student.studentId, 'ABSENT', e.target.checked)}
                      />
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CFormCheck
                        checked={String(student.attendanceStatus || 'PRESENT') === 'MALPRACTICE'}
                        disabled={status === 'READY_FOR_EVALUATION_FLOW'}
                        onChange={(e) => onRosterCheckboxChange(student.studentId, 'MALPRACTICE', e.target.checked)}
                      />
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormInput
                        value={student.malpracticeRemark || ''}
                        disabled={status === 'READY_FOR_EVALUATION_FLOW' || String(student.attendanceStatus || '') !== 'MALPRACTICE'}
                        onChange={(e) => onRosterRemarkChange(student.studentId, e.target.value)}
                        placeholder="Remark for malpractice case"
                      />
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CModalBody>
          <CModalFooter className="d-flex justify-content-end gap-2">
            <ArpButton label="Close" icon="cancel" color="dark" onClick={() => setRosterModalOpen(false)} />
          </CModalFooter>
        </CModal>

      </CCol>
    </CRow>
  )
}

export default IAOperationsPhase5
