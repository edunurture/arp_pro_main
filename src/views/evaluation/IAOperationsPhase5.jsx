import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

import { ArpButton, ArpDataTable, useArpToast } from '../../components/common'
import { getIAOperationRoster, getIAWorkflowPhase, IA_PHASE_KEYS, saveIAWorkflowPhase } from '../../services/iaWorkflowService'
import IAWorkflowScopeBanner from './IAWorkflowScopeBanner'

const PHASE_4_KEY = 'arp.evaluation.ia.phase4.publish.draft.v2'
const PHASE_5_KEY = 'arp.evaluation.ia.phase5.operations.draft.v2'
const PHASE_1_KEY = 'arp.evaluation.ia.phase1.setup.draft.v2'
const ACTIVE_BUNDLE_KEY = 'arp.evaluation.ia.active-bundle.v2'

const normalizeSemesterList = (values) =>
  [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  )]

const bundleScopeMatches = (bundle = null, phase = {}) => {
  if (!bundle) return false
  const activeSemesters = normalizeSemesterList(bundle?.chosenSemesters || []).join(',')
  const phaseSemesters = normalizeSemesterList(phase?.chosenSemesters || phase?.workflowScope?.chosenSemesters || []).join(',')
  return (
    String(bundle?.institutionId || '') === String(phase?.institutionId || phase?.workflowScope?.institutionId || '') &&
    String(bundle?.academicYearId || '') === String(phase?.academicYearId || phase?.workflowScope?.academicYearId || '') &&
    String(bundle?.programmeId || '') === String(phase?.programmeId || phase?.workflowScope?.programmeId || '') &&
    String(bundle?.iaCycle || bundle?.examName || '') === String(phase?.iaCycle || phase?.examName || phase?.workflowScope?.iaCycle || phase?.workflowScope?.examName || '') &&
    activeSemesters === phaseSemesters
  )
}

const hasSemesterScope = (workflowScope = {}) =>
  Boolean(String(workflowScope?.chosenSemester || '').trim()) || normalizeSemesterList(workflowScope?.chosenSemesters).length > 0

const resolveWorkflowScope = (phase1 = {}, phase4 = {}, activeBundle = null) => ({
  institutionId:
    activeBundle?.institutionId ||
    phase4?.workflowScope?.institutionId ||
    phase4?.institutionId ||
    phase1?.institutionId ||
    '',
  institutionName:
    activeBundle?.institutionName ||
    phase4?.workflowScope?.institutionName ||
    phase4?.institutionName ||
    phase1?.institutionName ||
    '',
  academicYearId:
    activeBundle?.academicYearId ||
    phase4?.workflowScope?.academicYearId ||
    phase4?.academicYearId ||
    phase1?.academicYearId ||
    '',
  academicYearLabel:
    activeBundle?.academicYearLabel ||
    phase4?.workflowScope?.academicYearLabel ||
    phase4?.academicYearLabel ||
    phase1?.academicYearLabel ||
    '',
  semesterCategory:
    activeBundle?.semesterCategory ||
    phase4?.workflowScope?.semesterCategory ||
    phase4?.semesterCategory ||
    phase1?.semesterCategory ||
    '',
  chosenSemester:
    activeBundle?.chosenSemester ||
    phase4?.workflowScope?.chosenSemester ||
    phase4?.chosenSemester ||
    phase1?.chosenSemester ||
    '',
  chosenSemesters: normalizeSemesterList(
    activeBundle?.chosenSemesters ||
    phase4?.workflowScope?.chosenSemesters ||
    phase4?.chosenSemesters ||
    phase1?.chosenSemesters ||
    [],
  ),
  programmeId:
    activeBundle?.programmeId ||
    phase4?.workflowScope?.programmeId ||
    phase4?.programmeId ||
    phase1?.programmeScopeKey ||
    phase1?.programmeId ||
    '',
  programmeIds:
    Array.isArray(activeBundle?.programmeIds) && activeBundle.programmeIds.length > 0
      ? activeBundle.programmeIds
      : Array.isArray(phase4?.workflowScope?.programmeIds) && phase4.workflowScope.programmeIds.length > 0
        ? phase4.workflowScope.programmeIds
        : Array.isArray(phase4?.programmeIds) && phase4.programmeIds.length > 0
          ? phase4.programmeIds
          : Array.isArray(phase1?.programmeIds)
            ? phase1.programmeIds
            : [],
  workspaceType:
    activeBundle?.workspaceType ||
    phase4?.workflowScope?.workspaceType ||
    phase4?.workspaceType ||
    phase1?.workspaceType ||
    'SINGLE',
  bundlePreset:
    activeBundle?.bundlePreset ||
    phase4?.workflowScope?.bundlePreset ||
    phase4?.bundlePreset ||
    phase1?.bundlePreset ||
    'MANUAL',
  examName:
    activeBundle?.examName ||
    activeBundle?.iaCycle ||
    phase4?.workflowScope?.examName ||
    phase4?.workflowScope?.iaCycle ||
    phase4?.examName ||
    phase4?.iaCycle ||
    phase1?.examName ||
    phase1?.iaCycle ||
    '',
  iaCycle:
    activeBundle?.iaCycle ||
    activeBundle?.examName ||
    phase4?.workflowScope?.iaCycle ||
    phase4?.workflowScope?.examName ||
    phase4?.iaCycle ||
    phase4?.examName ||
    phase1?.iaCycle ||
    phase1?.examName ||
    '',
  examWindowName:
    phase4?.workflowScope?.examWindowName ||
    phase4?.examWindowName ||
    phase1?.examWindowName ||
    '',
  examMonthYear:
    activeBundle?.examMonthYear ||
    phase4?.workflowScope?.examMonthYear ||
    phase4?.examMonthYear ||
    phase1?.examMonthYear ||
    '',
})

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
  const navigate = useNavigate()
  const phase1 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_1_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])
  const phase4 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_4_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])
  const activeBundle = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(ACTIVE_BUNDLE_KEY) || 'null')
    } catch {
      return null
    }
  }, [])
  const hasActiveBundle = useMemo(
    () =>
      Boolean(
        String(activeBundle?.institutionId || '').trim() &&
        String(activeBundle?.academicYearId || '').trim() &&
        String(activeBundle?.programmeId || '').trim() &&
        String(activeBundle?.iaCycle || activeBundle?.examName || '').trim(),
      ),
    [activeBundle],
  )

  const phase4Published = String(phase4.status || '') === 'PUBLISHED'
  const workflowScope = useMemo(
    () => resolveWorkflowScope(phase1, phase4, activeBundle),
    [phase1, phase4, activeBundle],
  )
  const snapshotCourses = Array.isArray(phase4?.snapshot?.courses) ? phase4.snapshot.courses : []
  const snapshotSlots = Array.isArray(phase4?.snapshot?.slots) ? phase4.snapshot.slots : []
  const slotById = useMemo(
    () => Object.fromEntries(snapshotSlots.map((slot) => [slot.id, slot])),
    [snapshotSlots],
  )

  const toast = useArpToast()
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
  const [editMode, setEditMode] = useState(false)
  const phaseLocked = status === 'READY_FOR_EVALUATION_FLOW' && !editMode
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
    toast.show({
      type,
      message,
      autohide: type === 'success',
      delay: 4500,
    })
  }

  useEffect(() => {
    if (hasActiveBundle) return
    navigate('/evaluation/ia/workspace', {
      replace: true,
      state: { workspaceNotice: 'Select or create an IA Workspace first.' },
    })
  }, [hasActiveBundle, navigate])

  useEffect(() => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(PHASE_5_KEY) || '{}')
      if (saved && typeof saved === 'object' && bundleScopeMatches(activeBundle, saved)) {
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
    const wf = workflowScope
    if (!wf.institutionId || !wf.academicYearId || !hasSemesterScope(wf) || !wf.programmeId || !(wf.iaCycle || wf.examName)) {
      return
    }
    ;(async () => {
      try {
        const remote = await getIAWorkflowPhase(IA_PHASE_KEYS.PHASE_5_OPERATIONS, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          chosenSemesters: normalizeSemesterList(wf.chosenSemesters),
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
  }, [workflowScope])

  const filteredRows = useMemo(() => {
    return opsRows.filter((row) => {
      const slot = slotById[row.slotId]
      const byDay = dayFilter ? String(slot?.date || '') === dayFilter : true
      const byCourse = courseKey ? String(row.id) === courseKey : true
      return byDay && byCourse
    })
  }, [opsRows, slotById, dayFilter, courseKey])
  const opsTableColumns = useMemo(
    () => [
      { key: 'courseDisplay', label: 'Course', sortable: true, sortType: 'string' },
      { key: 'dateSessionDisplay', label: 'Date/Session', sortable: true, sortType: 'string' },
      { key: 'venueDisplay', label: 'Venue', sortable: true, sortType: 'string' },
      { key: 'students', label: 'Total', sortable: true, sortType: 'number', align: 'right' },
      { key: 'presentCount', label: 'Present', align: 'center', width: 96 },
      { key: 'absentCount', label: 'Absent', align: 'center', width: 96 },
      { key: 'malpracticeCount', label: 'Malpractice', align: 'center', width: 128 },
      { key: 'statusDisplay', label: 'Status' },
      { key: 'actions', label: 'Actions', align: 'center', width: 120 },
    ],
    [],
  )
  const opsTableRows = useMemo(
    () => filteredRows.map((row) => {
      const slot = slotById[row.slotId]
      const validation = getOperationRowValidation(row)
      return {
        ...row,
        courseDisplay: `${row.code} - ${row.name}`,
        dateSessionDisplay: `${slot?.date || '-'} ${slot?.session || '-'}`.trim(),
        venueDisplay: slot?.venue || '-',
        statusDisplay: validation.valid ? 'VALID' : 'INVALID',
        rowValidation: validation,
      }
    }),
    [filteredRows, slotById],
  )

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
        const wf = resolveWorkflowScope(phase1, phase4, activeBundle)
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_5_OPERATIONS, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          chosenSemesters: normalizeSemesterList(wf.chosenSemesters),
          programmeId: wf.programmeId || '',
          programmeIds: Array.isArray(wf.programmeIds) ? wf.programmeIds : [],
          workspaceType: wf.workspaceType || 'SINGLE',
          bundlePreset: wf.bundlePreset || 'MANUAL',
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
        const wf = resolveWorkflowScope(phase1, phase4, activeBundle)
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_5_OPERATIONS, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          chosenSemesters: normalizeSemesterList(wf.chosenSemesters),
          programmeId: wf.programmeId || '',
          programmeIds: Array.isArray(wf.programmeIds) ? wf.programmeIds : [],
          workspaceType: wf.workspaceType || 'SINGLE',
          bundlePreset: wf.bundlePreset || 'MANUAL',
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
    setEditMode(false)
    showToast('success', 'Phase 5 completed and closed.')
  }

  const uniqueDates = [...new Set(snapshotSlots.map((slot) => slot.date))]

  return (
    <CRow>
      <CCol xs={12}>
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
                <CFormSelect value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} disabled={phaseLocked}>
                  <option value="">All Dates</option>
                  {uniqueDates.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>Filter by Course</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={courseKey} onChange={(e) => setCourseKey(e.target.value)} disabled={phaseLocked}>
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
            <ArpDataTable
              title="Attendance and Exam Day Status"
              rows={opsTableRows}
              columns={opsTableColumns}
              searchable={false}
              defaultPageSize={10}
              pageSizeOptions={[10, 25, 50, 100]}
              emptyText="No operation records for selected filters."
              scopedColumns={{
                presentCount: (row) => (
                  <div style={{ minWidth: 88 }}>
                    <CFormInput
                      type="number"
                      min={0}
                      value={row.presentCount}
                      style={{ minWidth: 78 }}
                      disabled={phaseLocked || (Array.isArray(row.studentRoster) && row.studentRoster.length > 0)}
                      onChange={(e) => onCountChange(row.id, 'presentCount', e.target.value)}
                    />
                  </div>
                ),
                absentCount: (row) => (
                  <div style={{ minWidth: 88 }}>
                    <CFormInput
                      type="number"
                      min={0}
                      value={row.absentCount}
                      style={{ minWidth: 78 }}
                      disabled={phaseLocked || (Array.isArray(row.studentRoster) && row.studentRoster.length > 0)}
                      onChange={(e) => onCountChange(row.id, 'absentCount', e.target.value)}
                    />
                  </div>
                ),
                malpracticeCount: (row) => (
                  <div style={{ minWidth: 96 }}>
                    <CFormInput
                      type="number"
                      min={0}
                      value={row.malpracticeCount}
                      style={{ minWidth: 88 }}
                      disabled={phaseLocked || (Array.isArray(row.studentRoster) && row.studentRoster.length > 0)}
                      onChange={(e) => onCountChange(row.id, 'malpracticeCount', e.target.value)}
                    />
                  </div>
                ),
                statusDisplay: (row) => (
                  <div className="d-flex flex-column gap-1">
                    <div className="d-flex gap-1 flex-wrap">
                      <CBadge color={row.operationStatus === 'COMPLETED' ? 'success' : row.operationStatus === 'RESCHEDULED' ? 'warning' : 'secondary'}>
                        {row.operationStatus}
                      </CBadge>
                      <CBadge color={row.rowValidation?.valid ? 'success' : 'danger'}>
                        {row.rowValidation?.valid ? 'VALID' : 'INVALID'}
                      </CBadge>
                    </div>
                    {!row.rowValidation?.valid ? (
                      <small className="text-danger">{row.rowValidation?.errors?.[0]}</small>
                    ) : null}
                  </div>
                ),
                actions: (row) => (
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
                          disabled={phaseLocked}
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
                          disabled={phaseLocked}
                          aria-label="Complete"
                        >
                          <CIcon icon={cilCheckCircle} size="sm" />
                        </CButton>
                      </span>
                    </CTooltip>
                  </div>
                ),
              }}
            />
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Emergency Reschedule</strong></CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2}><CFormLabel>Course</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={reschedule.courseId} onChange={(e) => setReschedule((p) => ({ ...p, courseId: e.target.value }))} disabled={phaseLocked}>
                  <option value="">Select Course</option>
                  {opsRows.map((row) => (
                    <option key={row.id} value={row.id}>{row.code} - {row.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>Reason</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput value={reschedule.reason} onChange={(e) => setReschedule((p) => ({ ...p, reason: e.target.value }))} disabled={phaseLocked} />
              </CCol>
              <CCol md={2}><CFormLabel>New Date</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput type="date" value={reschedule.newDate} onChange={(e) => setReschedule((p) => ({ ...p, newDate: e.target.value }))} disabled={phaseLocked} />
              </CCol>
              <CCol md={2}><CFormLabel>New Session</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={reschedule.newSession} onChange={(e) => setReschedule((p) => ({ ...p, newSession: e.target.value }))} disabled={phaseLocked}>
                  <option value="FN">FN</option>
                  <option value="AN">AN</option>
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>New Start Time</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput type="time" value={reschedule.newStartTime} onChange={(e) => setReschedule((p) => ({ ...p, newStartTime: e.target.value }))} disabled={phaseLocked} />
              </CCol>
              <CCol md={2}><CFormLabel>New End Time</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput type="time" value={reschedule.newEndTime} onChange={(e) => setReschedule((p) => ({ ...p, newEndTime: e.target.value }))} disabled={phaseLocked} />
              </CCol>
              <CCol md={2}><CFormLabel>New Venue</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput value={reschedule.newVenue} onChange={(e) => setReschedule((p) => ({ ...p, newVenue: e.target.value }))} disabled={phaseLocked} />
              </CCol>
              <CCol md={2}><CFormLabel>Approved By</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput value={reschedule.approvedBy} onChange={(e) => setReschedule((p) => ({ ...p, approvedBy: e.target.value }))} disabled={phaseLocked} />
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
              <ArpButton label="Apply Reschedule" icon="edit" color="warning" onClick={onApplyReschedule} disabled={phaseLocked} />
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
                Phase 5 is closed and locked. Use Enable Edit to revise this bundle.
              </div>
            ) : null}
            <div className="d-flex justify-content-end gap-2">
            {phaseLocked ? (
              <>
                <ArpButton
                  label="Enable Edit"
                  icon="edit"
                  color="warning"
                  onClick={() => setEditMode(true)}
                />
                <ArpButton label="Go to Workspace Console" icon="view" color="secondary" onClick={() => navigate('/evaluation/ia/workspace')} />
              </>
            ) : (
              <>
                <ArpButton label="Save Draft" icon="save" color="secondary" onClick={onSaveDraft} />
                <ArpButton label="Close Phase 5" icon="submit" color="success" onClick={onClosePhase5} />
              </>
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
