import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CBadge,
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
} from '@coreui/react-pro'

import { ArpButton, ArpDataTable, ArpIconButton, useArpToast } from '../../components/common'
import api from '../../services/apiClient'
import { getIAOperationRoster, getIAWorkflowPhase, IA_PHASE_KEYS, saveIAWorkflowPhase } from '../../services/iaWorkflowService'
import IAWorkflowScopeBanner from './IAWorkflowScopeBanner'

const PHASE_4_KEY = 'arp.evaluation.ia.phase4.publish.draft.v2'
const PHASE_5_KEY = 'arp.evaluation.ia.phase5.operations.draft.v2'
const PHASE_6_KEY = 'arp.evaluation.ia.phase6.mark-entry.draft.v2'
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

const buildCourseRows = (opsRows = []) =>
  opsRows
    .filter(
      (row) =>
        String(row.operationStatus || '').toUpperCase() === 'COMPLETED' &&
        String(row.iaDecision || '').toUpperCase() === 'SCHEDULED',
    )
    .map((row) => ({
      courseId: row.id,
      courseCode: row.code || '-',
      courseName: row.name || '-',
      programmeId: row.programmeId || '',
      programmeCode: row.programmeCode || '',
      programmeName: row.programmeName || '',
      semester: row.semester || '',
      totalStudents: Number(row.students || 0),
      status: 'PENDING',
      rosterSource: Array.isArray(row.studentRoster) && row.studentRoster.length > 0 ? 'PHASE5' : 'MISSING',
      students: (Array.isArray(row.studentRoster) ? row.studentRoster : []).map((student) => ({
        studentId: student.studentId,
        registerNumber: student.registerNumber || '',
        firstName: student.firstName || '',
        attendanceStatus: student.attendanceStatus || 'PRESENT',
        malpracticeRemark: student.malpracticeRemark || '',
        mark: student.attendanceStatus === 'ABSENT' || student.attendanceStatus === 'MALPRACTICE' ? '' : '',
        result:
          student.attendanceStatus === 'ABSENT'
            ? 'ABSENT'
            : student.attendanceStatus === 'MALPRACTICE'
              ? 'MALPRACTICE'
              : '',
        remarks: '',
      })),
    }))

const hasAnyStudents = (courseRows = []) =>
  courseRows.some((course) => Array.isArray(course.students) && course.students.length > 0)

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

const getStudentValidation = (student, maximumMarks, minimumMarks) => {
  const attendance = String(student?.attendanceStatus || '').toUpperCase()
  const markValue = toNumberOrNull(student?.mark)
  const errors = []
  const hasMarkInput = String(student?.mark || '').trim() !== ''

  if (attendance === 'ABSENT') {
    if (hasMarkInput) errors.push('Absent student cannot have marks')
    return { invalid: errors.length > 0, errors }
  }

  if (attendance === 'MALPRACTICE') {
    if (hasMarkInput) errors.push('Malpractice student cannot have marks')
    return { invalid: errors.length > 0, errors }
  }

  if (attendance === 'PRESENT') {
    if (!hasMarkInput) return { invalid: false, errors: [] }
    if (markValue === null) {
      errors.push('Mark must be numeric')
      return { invalid: true, errors }
    }
    if (markValue < 0) errors.push('Mark cannot be negative')
    if (maximumMarks !== null && markValue > maximumMarks) errors.push(`Maximum allowed is ${maximumMarks}`)
  }

  return { invalid: errors.length > 0, errors }
}

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
  chosenSemesters:
    normalizeSemesterList(
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

const IAMarkEntryPhase6 = () => {
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

  const phase5 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_5_KEY) || '{}')
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

  const toast = useArpToast()
  const [status, setStatus] = useState('DRAFT')
  const [courseRows, setCourseRows] = useState(() => buildCourseRows(phase5.rows || []))
  const [programmeFilter, setProgrammeFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [courseStatusFilter, setCourseStatusFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [entryMode, setEntryMode] = useState('EDIT')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [pendingPrint, setPendingPrint] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [computationRows, setComputationRows] = useState([])
  const [assessmentMappingsByScope, setAssessmentMappingsByScope] = useState({})
  const workflowScope = useMemo(
    () => resolveWorkflowScope(phase1, phase4, activeBundle),
    [activeBundle, phase1, phase4],
  )
  const previewFrameRef = useRef(null)
  const markInputRefs = useRef(new Map())

  const showToast = (type, message) => {
    toast.show({ type, message, autohide: type === 'success', delay: 4500 })
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
      const saved = JSON.parse(window.sessionStorage.getItem(PHASE_6_KEY) || '{}')
      if (saved && typeof saved === 'object' && bundleScopeMatches(activeBundle, saved)) {
        if (String(saved.status || '').trim()) setStatus(String(saved.status))
        if (Array.isArray(saved.courseRows) && saved.courseRows.length > 0) setCourseRows(saved.courseRows)
      }
    } catch {
      // ignore invalid local draft
    }
  }, [])

  useEffect(() => {
    const institutionId = String(workflowScope?.institutionId || '').trim()
    if (!institutionId) return
    ;(async () => {
      try {
        const res = await api.get('/api/setup/cia-computations', {
          params: { institutionId },
        })
        setComputationRows(unwrapList(res))
      } catch {
        setComputationRows([])
      }
    })()
  }, [workflowScope?.institutionId])

  useEffect(() => {
    const wf = workflowScope || {}
    if (!wf.institutionId || !wf.academicYearId || !hasSemesterScope(wf) || !wf.programmeId || !(wf.iaCycle || wf.examName)) {
      return
    }
    ;(async () => {
      try {
        const remote = await getIAWorkflowPhase(IA_PHASE_KEYS.PHASE_6_MARK_ENTRY, {
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
        if (Array.isArray(payload.courseRows) && payload.courseRows.length > 0) {
          setCourseRows(payload.courseRows)
        }
      } catch {
        // keep local/session state
      }
    })()
  }, [workflowScope])

  useEffect(() => {
    if (hasAnyStudents(courseRows) || courseRows.length === 0) return
    ;(async () => {
      try {
        const enriched = await Promise.all(
          courseRows.map(async (course) => {
            try {
              const data = await getIAOperationRoster({ courseOfferingId: course.courseId })
              const students = Array.isArray(data?.students)
                ? data.students.map((student) => ({
                    studentId: student.studentId,
                    registerNumber: student.registerNumber || '',
                    firstName: student.firstName || '',
                    attendanceStatus: 'PRESENT',
                    malpracticeRemark: '',
                    mark: '',
                    result: '',
                    remarks: '',
                  }))
                : []
              return {
                ...course,
                rosterSource: students.length > 0 ? 'BACKEND_FALLBACK' : 'MISSING',
                totalStudents: students.length || course.totalStudents,
                students,
              }
            } catch {
              return course
            }
          }),
        )
        setCourseRows(enriched)
        if (enriched.some((course) => course.rosterSource === 'BACKEND_FALLBACK')) {
          showToast(
            'warning',
            'Phase 5 saved roster was missing for some courses. Phase 6 loaded student list from backend as fallback.',
          )
        }
      } catch {
        showToast('warning', 'Unable to auto-load student roster for some courses in Phase 6.')
      }
    })()
  }, [courseRows])

  const programmeOptions = useMemo(() => {
    const map = new Map()
    courseRows.forEach((course) => {
      const programmeId = String(course.programmeId || '').trim()
      const programmeCode = String(course.programmeCode || '').trim()
      const programmeName = String(course.programmeName || '').trim()
      const label = [programmeCode, programmeName].filter(Boolean).join(' - ') || programmeId
      if (programmeId && !map.has(programmeId)) {
        map.set(programmeId, { value: programmeId, label })
      }
    })
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [courseRows])

  const semesterOptions = useMemo(
    () => [...new Set(
      courseRows
        .map((course) => String(course.semester || '').trim())
        .filter(Boolean),
    )].sort((a, b) => Number(a) - Number(b)),
    [courseRows],
  )

  const filteredCourseList = useMemo(
    () => courseRows.filter((row) => {
      const programmeMatch = !programmeFilter || String(row.programmeId || '').trim() === programmeFilter
      const semesterMatch = !semesterFilter || String(row.semester || '').trim() === semesterFilter
      const statusMatch = !courseStatusFilter || String(row.status || '').toUpperCase() === courseStatusFilter
      return programmeMatch && semesterMatch && statusMatch
    }),
    [courseRows, programmeFilter, semesterFilter, courseStatusFilter],
  )

  const filteredCourses = useMemo(() => {
    if (!courseFilter) return filteredCourseList
    return filteredCourseList.filter((row) => String(row.courseId) === String(courseFilter))
  }, [filteredCourseList, courseFilter])

  useEffect(() => {
    if (!filteredCourseList.length) {
      if (courseRows.length > 0 && courseStatusFilter) {
        setCourseStatusFilter('')
        setCourseFilter('')
        return
      }
      if (courseFilter) setCourseFilter('')
      return
    }
    if (!courseFilter || !filteredCourseList.some((row) => String(row.courseId) === String(courseFilter))) {
      setCourseFilter(String(filteredCourseList[0].courseId))
    }
  }, [filteredCourseList, courseFilter, courseRows.length, courseStatusFilter])

  const currentCourse = useMemo(
    () => filteredCourses[0] || null,
    [filteredCourses],
  )

  useEffect(() => {
    const institutionId = String(workflowScope?.institutionId || '').trim()
    const academicYearId = String(workflowScope?.academicYearId || '').trim()
    const semesterCategory = String(workflowScope?.semesterCategory || '').trim()
    const programmeId = String(currentCourse?.programmeId || '').trim()
    const chosenSemester = String(currentCourse?.semester || '').trim()
    if (!institutionId || !academicYearId || !programmeId || !chosenSemester) return
    const scopeKey = [institutionId, academicYearId, semesterCategory, programmeId, chosenSemester].join('|')
    if (assessmentMappingsByScope[scopeKey]) return
    ;(async () => {
      try {
        const res = await api.get('/api/setup/assessment-setup', {
          params: {
            institutionId,
            academicYearId,
            semesterCategory,
            chosenSemester,
            programmeId,
          },
        })
        setAssessmentMappingsByScope((prev) => ({
          ...prev,
          [scopeKey]: unwrapList(res),
        }))
      } catch {
        setAssessmentMappingsByScope((prev) => ({
          ...prev,
          [scopeKey]: [],
        }))
      }
    })()
  }, [
    assessmentMappingsByScope,
    currentCourse?.programmeId,
    currentCourse?.semester,
    workflowScope?.academicYearId,
    workflowScope?.institutionId,
    workflowScope?.semesterCategory,
  ])

  const currentCourseAssessment = useMemo(() => {
    if (!currentCourse) return null
    const institutionId = String(workflowScope?.institutionId || '').trim()
    const academicYearId = String(workflowScope?.academicYearId || '').trim()
    const semesterCategory = String(workflowScope?.semesterCategory || '').trim()
    const programmeId = String(currentCourse?.programmeId || '').trim()
    const chosenSemester = String(currentCourse?.semester || '').trim()
    const examName = String(workflowScope?.examName || workflowScope?.iaCycle || '').trim()
    const scopeKey = [institutionId, academicYearId, semesterCategory, programmeId, chosenSemester].join('|')
    const mappingRows = assessmentMappingsByScope[scopeKey] || []
    const mappingRow =
      mappingRows.find((row) => String(row.courseOfferingId || '').trim() === String(currentCourse.courseId || '').trim()) ||
      mappingRows.find((row) => String(row.courseCode || '').trim() === String(currentCourse.courseCode || '').trim()) ||
      null
    const computation =
      computationRows.find((row) => String(row.id || '').trim() === String(mappingRow?.ciaComputationId || '').trim()) || null
    const matchedComponent =
      (Array.isArray(computation?.components) ? computation.components : []).find(
        (row) => String(row.examination || '').trim().toLowerCase() === examName.toLowerCase(),
      ) || null
    return {
      examinationName: matchedComponent?.examination || examName || '-',
      ciaAssessmentCode: computation?.ciaAssessmentCode || mappingRow?.ciaAssessmentCode || '-',
      maximumMarks:
        matchedComponent?.maxMarks ?? mappingRow?.cia ?? null,
      minimumMarks:
        matchedComponent?.minMarks ?? mappingRow?.minimumCIA ?? null,
      contributionMax:
        matchedComponent?.contributionMax ?? null,
      source: matchedComponent ? 'COMPONENT_MAPPING' : mappingRow ? 'COURSE_CIA_FALLBACK' : 'UNAVAILABLE',
    }
  }, [
    assessmentMappingsByScope,
    computationRows,
    currentCourse,
    workflowScope?.academicYearId,
    workflowScope?.examName,
    workflowScope?.iaCycle,
    workflowScope?.institutionId,
    workflowScope?.semesterCategory,
  ])

  const phaseLocked = status === 'READY_FOR_PHASE_7' && !editMode
  const isReadOnly = phaseLocked || entryMode === 'VIEW'
  const currentMaximumMarks = toNumberOrNull(currentCourseAssessment?.maximumMarks)
  const currentMinimumMarks = toNumberOrNull(currentCourseAssessment?.minimumMarks)
  const currentCourseValidation = useMemo(() => {
    const map = new Map()
    ;(currentCourse?.students || []).forEach((student) => {
      map.set(String(student.studentId), getStudentValidation(student, currentMaximumMarks, currentMinimumMarks))
    })
    return map
  }, [currentCourse, currentMaximumMarks, currentMinimumMarks])

  useEffect(() => {
    if (phaseLocked) {
      setEntryMode('VIEW')
      return
    }
    setEntryMode('EDIT')
  }, [phaseLocked, currentCourse?.courseId])

  const setStudentField = (courseId, studentId, key, value) => {
    setCourseRows((prev) =>
      prev.map((course) => {
        if (String(course.courseId) !== String(courseId) || phaseLocked) return course
        const students = (course.students || []).map((student) => {
          if (String(student.studentId) !== String(studentId)) return student
          const next = { ...student, [key]: value }
          if (key === 'mark') {
            const markValue = toNumberOrNull(value)
            if (student.attendanceStatus === 'ABSENT') {
              next.mark = ''
              next.result = 'ABSENT'
              return next
            }
            if (student.attendanceStatus === 'MALPRACTICE') {
              next.mark = ''
              next.result = 'MALPRACTICE'
              return next
            }
            if (markValue === null) {
              next.result = ''
              return next
            }
            if (currentMinimumMarks !== null) {
              next.result = markValue >= currentMinimumMarks ? 'PASS' : 'FAIL'
            }
          }
          return next
        })
        return {
          ...course,
          students,
          status: course.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
        }
      }),
    )
  }

  const focusRelativeMarkInput = (studentId, direction = 1) => {
    const students = Array.isArray(currentCourse?.students) ? currentCourse.students : []
    const eligibleIds = students
      .filter((student) => String(student.attendanceStatus || '').toUpperCase() === 'PRESENT')
      .map((student) => String(student.studentId))
    const currentIndex = eligibleIds.findIndex((id) => id === String(studentId))
    if (currentIndex === -1) return
    const nextIndex = currentIndex + direction
    if (nextIndex < 0 || nextIndex >= eligibleIds.length) return
    const nextInput = markInputRefs.current.get(eligibleIds[nextIndex])
    if (nextInput && typeof nextInput.focus === 'function') {
      nextInput.focus()
      nextInput.select?.()
    }
  }

  const setStudentResult = (courseId, studentId, resultValue, checked) => {
    setCourseRows((prev) =>
      prev.map((course) => {
        if (String(course.courseId) !== String(courseId) || phaseLocked) return course
        const students = (course.students || []).map((student) => {
          if (String(student.studentId) !== String(studentId)) return student
          if (student.attendanceStatus !== 'PRESENT') return student
          if (currentMinimumMarks !== null) return student
          return {
            ...student,
            result: checked ? resultValue : '',
          }
        })
        return {
          ...course,
          students,
          status: course.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
        }
      }),
    )
  }

  const validateCourseForSubmission = (course) => {
    const invalidRange = (course.students || []).some((student) => {
      if (student.attendanceStatus !== 'PRESENT') return false
      const markValue = toNumberOrNull(student.mark)
      if (markValue === null) return false
      if (markValue < 0) return true
      if (currentMaximumMarks !== null && markValue > currentMaximumMarks) return true
      return false
    })
    if (invalidRange) return `Entered marks exceed the allowed range for ${course.courseCode}.`

    const missingMark = (course.students || []).some(
      (student) => student.attendanceStatus === 'PRESENT' && String(student.mark || '').trim() === '',
    )
    if (missingMark) return `Enter marks for all present students in ${course.courseCode}.`

    const invalidAbsentMark = (course.students || []).some(
      (student) =>
        (student.attendanceStatus === 'ABSENT' || student.attendanceStatus === 'MALPRACTICE') &&
        String(student.mark || '').trim() !== '',
    )
    if (invalidAbsentMark) return `Absent or malpractice students cannot have marks in ${course.courseCode}.`

    const missingResult = (course.students || []).some(
      (student) => student.attendanceStatus === 'PRESENT' && !String(student.result || '').trim(),
    )
    if (missingResult) return `Select P, F or R for all present students in ${course.courseCode}.`

    return ''
  }

  const onSubmitCurrentCourse = async () => {
    if (!currentCourse) {
      showToast('warning', 'Select a course to submit marks.')
      return
    }
    const error = validateCourseForSubmission(currentCourse)
    if (error) {
      showToast('danger', error)
      return
    }
    const nextCourseRows = courseRows.map((course) =>
      String(course.courseId) === String(currentCourse.courseId)
        ? { ...course, status: 'COMPLETED' }
        : course,
    )
    setCourseRows(nextCourseRows)
    const payload = {
      status: status === 'READY_FOR_PHASE_7' ? 'READY_FOR_PHASE_7' : 'DRAFT',
      courseRows: nextCourseRows,
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_6_KEY, JSON.stringify(payload))
    try {
      const wf = workflowScope || {}
      await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_6_MARK_ENTRY, {
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
        workflowStatus: payload.status,
        versionNo: 1,
        payload: {
          workflowScope: wf,
          ...payload,
        },
      })
    } catch {
      // keep local/session state
    }
    setEntryMode('VIEW')
    showToast('success', `Marks submitted for ${currentCourse.courseCode}.`)
  }

  const persist = async (nextStatus) => {
    const payload = {
      status: nextStatus,
      courseRows,
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_6_KEY, JSON.stringify(payload))
    try {
      const wf = workflowScope || {}
      await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_6_MARK_ENTRY, {
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
        workflowStatus: nextStatus,
        versionNo: 1,
        payload: {
          workflowScope: wf,
          ...payload,
        },
      })
    } catch {
      // keep local state
    }
    setStatus(nextStatus)
  }

  const onSaveDraft = async () => {
    await persist(status === 'READY_FOR_PHASE_7' ? 'READY_FOR_PHASE_7' : 'DRAFT')
    showToast('success', 'Phase 6 mark entry draft saved.')
  }

  const onDownloadCurrentCourse = async () => {
    if (!currentCourse) {
      showToast('warning', 'Select a course to download mark entry.')
      return
    }
    try {
      const mod = await import('xlsx')
      const XLSX = mod?.default || mod
      const rows = (currentCourse.students || []).map((student) => ({
        'Register No': student.registerNumber || '',
        'Student Name': student.firstName || '',
        Attendance: student.attendanceStatus || '',
        Mark: student.mark || '',
        Result: student.result || '',
        Remarks: student.remarks || student.malpracticeRemark || '',
      }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{ Info: 'No student rows available' }]),
        'Mark Entry',
      )
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `IA_Mark_Entry_${currentCourse.courseCode || 'Course'}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showToast('success', 'Selected course mark entry downloaded.')
    } catch {
      showToast('danger', 'Unable to generate mark entry workbook.')
    }
  }

  const escapeHtml = (input) =>
    String(input ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const buildCourseReportHtml = ({ includeToolbar = true } = {}) => {
    if (!currentCourse) return ''
    const institutionName = workflowScope?.institutionName || workflowScope?.institutionId || 'Institution'
    const academicYear = workflowScope?.academicYearLabel || workflowScope?.academicYearId || '-'
    const semester = normalizeSemesterList(workflowScope?.chosenSemesters).join(', ') || workflowScope?.chosenSemester || workflowScope?.semesterCategory || '-'
    const examination = workflowScope?.examName || workflowScope?.iaCycle || '-'
    const examMonthYear = workflowScope?.examWindowName || '-'
    const maxMarks = currentCourseAssessment?.maximumMarks ?? '-'
    const minMarks = currentCourseAssessment?.minimumMarks ?? '-'
    const ciaAssessmentCode = currentCourseAssessment?.ciaAssessmentCode || '-'
    const studentsHtml = (currentCourse.students || []).length === 0
      ? '<tr><td colspan="8" style="text-align:center;padding:12px;color:#6b7280;">No student rows available.</td></tr>'
      : (currentCourse.students || [])
          .map((student, idx) => `
            <tr>
              <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${idx + 1}</td>
              <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(student.registerNumber || '-')}</td>
              <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(student.firstName || '-')}</td>
              <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${escapeHtml(student.attendanceStatus || '-')}</td>
              <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${escapeHtml(student.mark || '-')}</td>
              <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${student.result === 'PASS' ? 'Yes' : ''}</td>
              <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${student.result === 'FAIL' ? 'Yes' : ''}</td>
              <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${student.result === 'REAPPEAR' ? 'Yes' : ''}</td>
            </tr>
          `)
          .join('')

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>IA_Mark_Entry</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: Arial, sans-serif; margin: 20px; color:#111827; counter-reset: page 1; }
    .title { text-align:center; font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .subtitle { text-align:center; font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .meta-center { text-align:center; margin: 2px 0; font-size: 13px; }
    .meta-grid { margin: 10px 0 12px; display:grid; grid-template-columns: repeat(2, 1fr); gap: 6px 18px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { border:1px solid #9ca3af; background:#f3f4f6; padding:6px; text-align:left; }
    td { border:1px solid #d1d5db; padding:6px; }
    .toolbar { margin-bottom: 14px; display:flex; gap:8px; }
    .btn { border:1px solid #4b5563; background:#fff; padding:6px 10px; cursor:pointer; border-radius:4px; }
    .sig-wrap { margin-top: 38px; display:flex; justify-content:space-between; gap:24px; }
    .sig { width:32%; text-align:center; font-size: 12px; }
    .line { border-top:1px solid #374151; margin: 30px 0 6px; }
    .page-number {
      position: fixed;
      bottom: 2mm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 11px;
      color: #374151;
    }
    .page-number:after { content: "Page " counter(page); }
    @media print { .toolbar { display:none; } body { margin: 10mm; } }
  </style>
</head>
<body>
  ${includeToolbar ? '<div class="toolbar"><button class="btn" onclick="window.print()">Print</button><button class="btn" onclick="window.close()">Close</button></div>' : ''}
  <div class="title">${escapeHtml(institutionName)}</div>
  <div class="subtitle">Internal Assessment Mark Entry Register</div>
  <div class="meta-center"><strong>Examination:</strong> ${escapeHtml(examination)}</div>
  <div class="meta-center"><strong>Academic Year / Semester:</strong> ${escapeHtml(academicYear)} / ${escapeHtml(semester)}</div>
  <div class="meta-center"><strong>Exam Month & Year:</strong> ${escapeHtml(examMonthYear)}</div>
  <div class="meta-grid">
    <div><strong>Course Code:</strong> ${escapeHtml(currentCourse.courseCode || '-')}</div>
    <div><strong>Course Name:</strong> ${escapeHtml(currentCourse.courseName || '-')}</div>
    <div><strong>CIA Assessment Code:</strong> ${escapeHtml(ciaAssessmentCode)}</div>
    <div><strong>Maximum Marks:</strong> ${escapeHtml(maxMarks)}</div>
    <div><strong>Minimum Marks:</strong> ${escapeHtml(minMarks)}</div>
    <div><strong>Total Students:</strong> ${escapeHtml(currentCourse.students.length || 0)}</div>
    <div><strong>Roster Source:</strong> ${escapeHtml(currentCourse.rosterSource || '-')}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:50px;text-align:center;">S.No</th>
        <th style="width:120px;">Register No</th>
        <th>Student Name</th>
        <th style="width:110px;text-align:center;">Attendance</th>
        <th style="width:80px;text-align:center;">Mark</th>
        <th style="width:60px;text-align:center;">P</th>
        <th style="width:60px;text-align:center;">F</th>
        <th style="width:60px;text-align:center;">R</th>
      </tr>
    </thead>
    <tbody>${studentsHtml}</tbody>
  </table>
  <div class="sig-wrap">
    <div class="sig">
      <div class="line"></div>
      <div><strong>Course Faculty</strong></div>
    </div>
    <div class="sig">
      <div class="line"></div>
      <div><strong>HOD / Coordinator</strong></div>
    </div>
    <div class="sig">
      <div class="line"></div>
      <div><strong>IQAC / Accreditation Record</strong></div>
    </div>
  </div>
  <div class="page-number"></div>
</body>
</html>`
  }

  const openCoursePreview = () => {
    if (!currentCourse) {
      showToast('warning', 'Select a course to preview mark entry.')
      return
    }
    setPreviewHtml(buildCourseReportHtml({ includeToolbar: false }))
    setPreviewOpen(true)
  }

  const printCourseReport = () => {
    if (!currentCourse) {
      showToast('warning', 'Select a course to print mark entry.')
      return
    }
    setPreviewHtml(buildCourseReportHtml({ includeToolbar: false }))
    setPreviewOpen(true)
    setPendingPrint(true)
  }

  useEffect(() => {
    if (!previewOpen || !pendingPrint) return
    const frame = previewFrameRef.current
    if (!frame) return
    const timer = window.setTimeout(() => {
      try {
        frame.contentWindow?.focus()
        frame.contentWindow?.print()
      } catch {
        showToast('warning', 'Unable to start print from preview.')
      } finally {
        setPendingPrint(false)
      }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [pendingPrint, previewOpen])

  const onClosePhase6 = async () => {
    const pending = courseRows.filter((course) => course.status !== 'COMPLETED').length
    if (pending > 0) {
      showToast('danger', `Complete all course mark entries before closing Phase 6. Pending: ${pending}`)
      return
    }
    await persist('READY_FOR_PHASE_7')
    setEditMode(false)
    showToast('success', 'Phase 6 completed. Ready for Phase 7 result analysis.')
  }

  const studentColumns = useMemo(
    () => [
      { key: 'registerNumber', label: 'Register No', sortable: true, sortType: 'string' },
      { key: 'firstName', label: 'Student Name', sortable: true, sortType: 'string' },
      {
        key: 'attendanceStatus',
        label: 'Attendance',
        sortable: true,
        sortType: 'string',
        render: (row) => (
          <CBadge
            color={
              row.attendanceStatus === 'PRESENT'
                ? 'success'
                : row.attendanceStatus === 'ABSENT'
                  ? 'warning'
                  : 'danger'
            }
          >
            {row.attendanceStatus || '-'}
          </CBadge>
        ),
      },
      {
        key: 'mark',
        label: 'Mark',
        align: 'center',
        render: (row) => {
          const validation = currentCourseValidation.get(String(row.studentId))
          return (
            <div>
              <CFormInput
                ref={(node) => {
                  const key = String(row.studentId)
                  if (node) markInputRefs.current.set(key, node)
                  else markInputRefs.current.delete(key)
                }}
                type="number"
                min={0}
                max={Number.isFinite(Number(currentCourseAssessment?.maximumMarks)) ? Number(currentCourseAssessment.maximumMarks) : undefined}
                value={row.mark}
                invalid={Boolean(validation?.invalid && row.attendanceStatus === 'PRESENT')}
                disabled={isReadOnly || row.attendanceStatus !== 'PRESENT'}
                onChange={(e) => setStudentField(currentCourse?.courseId, row.studentId, 'mark', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    focusRelativeMarkInput(row.studentId, 1)
                  }
                }}
              />
              {validation?.invalid ? (
                <small className="text-danger d-block mt-1">{validation.errors[0]}</small>
              ) : null}
            </div>
          )
        },
      },
      {
        key: 'passFlag',
        label: 'P',
        align: 'center',
        render: (row) => (
          <CFormCheck
            checked={row.result === 'PASS'}
            disabled={isReadOnly || row.attendanceStatus !== 'PRESENT' || currentMinimumMarks !== null}
            onChange={(e) => setStudentResult(currentCourse?.courseId, row.studentId, 'PASS', e.target.checked)}
          />
        ),
      },
      {
        key: 'failFlag',
        label: 'F',
        align: 'center',
        render: (row) => (
          <CFormCheck
            checked={row.result === 'FAIL'}
            disabled={isReadOnly || row.attendanceStatus !== 'PRESENT' || currentMinimumMarks !== null}
            onChange={(e) => setStudentResult(currentCourse?.courseId, row.studentId, 'FAIL', e.target.checked)}
          />
        ),
      },
      {
        key: 'reappearFlag',
        label: 'R',
        align: 'center',
        render: (row) => (
          <CFormCheck
            checked={row.result === 'REAPPEAR'}
            disabled={isReadOnly || row.attendanceStatus !== 'PRESENT' || currentMinimumMarks !== null}
            onChange={(e) => setStudentResult(currentCourse?.courseId, row.studentId, 'REAPPEAR', e.target.checked)}
          />
        ),
      },
      {
        key: 'remarks',
        label: 'Remarks',
        render: (row) => (
          <CFormInput
            value={row.remarks || ''}
            disabled={isReadOnly}
            onChange={(e) => setStudentField(currentCourse?.courseId, row.studentId, 'remarks', e.target.value)}
            placeholder={row.attendanceStatus === 'MALPRACTICE' ? row.malpracticeRemark || 'Malpractice' : 'Optional'}
          />
        ),
      },
    ],
    [currentCourse?.courseId, currentCourseAssessment?.maximumMarks, currentCourseValidation, currentMinimumMarks, isReadOnly],
  )

  return (
    <CRow>
      <CCol xs={12}>
        <IAWorkflowScopeBanner scope={workflowScope} />

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT - PHASE 6 MARK ENTRY</strong>
            <CBadge color={status === 'READY_FOR_PHASE_7' ? 'success' : 'info'}>{status}</CBadge>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel>Filter by Programme</CFormLabel>
                <CFormSelect value={programmeFilter} onChange={(e) => setProgrammeFilter(e.target.value)} disabled={phaseLocked}>
                  <option value="">All Programmes</option>
                  {programmeOptions.map((programme) => (
                    <option key={programme.value} value={programme.value}>
                      {programme.label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormLabel>Filter by Semester</CFormLabel>
                <CFormSelect value={semesterFilter} onChange={(e) => setSemesterFilter(e.target.value)} disabled={phaseLocked}>
                  <option value="">All Semesters</option>
                  {semesterOptions.map((semester) => (
                    <option key={semester} value={semester}>
                      Semester {semester}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormLabel>Filter by Status</CFormLabel>
                <CFormSelect value={courseStatusFilter} onChange={(e) => setCourseStatusFilter(e.target.value)} disabled={phaseLocked}>
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="MARK_ENTRY_UPDATED">Updated</option>
                </CFormSelect>
              </CCol>
              <CCol md={5}>
                <CFormLabel>Filter by Course</CFormLabel>
                <CFormSelect value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} disabled={phaseLocked}>
                  <option value="">All Matching Courses</option>
                  {filteredCourseList.map((course) => (
                    <option key={course.courseId} value={course.courseId}>
                      {course.courseCode} - {course.courseName}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={12} className="d-flex align-items-end justify-content-end">
                <small className="text-muted">
                  Phase 6 uses only Phase 5 completed courses with saved student attendance.
                </small>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {filteredCourses.length === 0 ? (
          <CCard>
            <CCardBody className="text-muted">
              No completed Phase 5 courses with roster data are available for IA mark entry.
            </CCardBody>
          </CCard>
        ) : currentCourse ? (
          <>
            <CCard className="mb-3">
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <strong>{currentCourse.courseCode} - {currentCourse.courseName}</strong>
                <div className="d-flex gap-2">
                  <CBadge color={currentCourse.status === 'COMPLETED' ? 'success' : 'warning'}>
                    {currentCourse.status}
                  </CBadge>
                  <CBadge color="info">Students: {currentCourse.students.length}</CBadge>
                  <CBadge color={entryMode === 'EDIT' ? 'warning' : 'secondary'}>
                    Mode: {entryMode}
                  </CBadge>
                  <CBadge color={currentCourse.rosterSource === 'PHASE5' ? 'success' : currentCourse.rosterSource === 'BACKEND_FALLBACK' ? 'warning' : 'danger'}>
                    {currentCourse.rosterSource === 'PHASE5' ? 'Roster: Phase 5' : currentCourse.rosterSource === 'BACKEND_FALLBACK' ? 'Roster: Backend Fallback' : 'Roster Missing'}
                  </CBadge>
                </div>
              </CCardHeader>
              <CCardBody>
                <CRow className="g-3 mb-3">
                  <CCol md={3}>
                    <CFormLabel>Examination Name</CFormLabel>
                    <CFormInput value={currentCourseAssessment?.examinationName || (workflowScope?.examName || workflowScope?.iaCycle || '-')} disabled />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>CIA Assessment Code</CFormLabel>
                    <CFormInput value={currentCourseAssessment?.ciaAssessmentCode || '-'} disabled />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>Maximum Marks</CFormLabel>
                    <CFormInput value={currentCourseAssessment?.maximumMarks ?? '-'} disabled />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>Minimum Marks</CFormLabel>
                    <CFormInput value={currentCourseAssessment?.minimumMarks ?? '-'} disabled />
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>Source</CFormLabel>
                    <CFormInput
                      value={
                        currentCourseAssessment?.source === 'COMPONENT_MAPPING'
                          ? 'Component Mapping'
                          : currentCourseAssessment?.source === 'COURSE_CIA_FALLBACK'
                            ? 'Course CIA Fallback'
                            : 'Not Available'
                      }
                      disabled
                    />
                  </CCol>
                </CRow>
                <ArpDataTable
                  title="Student Mark Entry"
                  rows={Array.isArray(currentCourse.students) ? currentCourse.students : []}
                  columns={studentColumns}
                  rowKey="studentId"
                  defaultPageSize={10}
                  pageSizeOptions={[10, 20, 50, 100]}
                  searchPlaceholder="Search students..."
                  emptyText="No students available for the selected course."
                  headerActions={
                    <div className="d-flex gap-2">
                      <ArpIconButton icon="view" color="info" title="View" onClick={() => setEntryMode('VIEW')} disabled={!currentCourse} />
                      <ArpIconButton
                        icon="edit"
                        color="warning"
                        title="Edit"
                        onClick={() => setEntryMode('EDIT')}
                        disabled={!currentCourse || phaseLocked}
                      />
                      <ArpIconButton
                        icon="preview"
                        color="secondary"
                        title="Preview"
                        onClick={openCoursePreview}
                        disabled={!currentCourse}
                      />
                      <ArpIconButton icon="print" color="dark" title="Print" onClick={printCourseReport} disabled={!currentCourse} />
                      <ArpIconButton icon="download" color="primary" title="Download" onClick={onDownloadCurrentCourse} disabled={!currentCourse} />
                    </div>
                  }
                />
                <div className="d-flex justify-content-end gap-2">
                  <ArpButton
                    label="Submit Marks"
                    icon="submit"
                    color="success"
                    onClick={onSubmitCurrentCourse}
                    disabled={!currentCourse || phaseLocked}
                  />
                </div>
              </CCardBody>
            </CCard>
          </>
        ) : null}

        <CCard>
          <CCardHeader><strong>Phase 6 Actions</strong></CCardHeader>
          <CCardBody className="d-flex justify-content-end gap-2">
            {phaseLocked ? (
              <>
                <ArpButton label="Enable Edit" icon="edit" color="warning" onClick={() => setEditMode(true)} />
                <ArpButton label="Go to Workspace Console" icon="view" color="secondary" onClick={() => navigate('/evaluation/ia/workspace')} />
              </>
            ) : (
              <>
                <ArpButton label="Save Draft" icon="save" color="secondary" onClick={onSaveDraft} />
                <ArpButton label="Close Phase 6" icon="submit" color="success" onClick={onClosePhase6} />
              </>
            )}
          </CCardBody>
        </CCard>

        <CModal size="xl" visible={previewOpen} onClose={() => setPreviewOpen(false)}>
        <CModalHeader>
          <CModalTitle>IA Mark Entry Preview</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <iframe ref={previewFrameRef} title="IA Mark Entry Preview" srcDoc={previewHtml} style={{ width: '100%', minHeight: '75vh', border: 0 }} />
        </CModalBody>
          <CModalFooter className="d-flex justify-content-end gap-2">
            <ArpButton label="Close" icon="cancel" color="dark" onClick={() => setPreviewOpen(false)} />
            <ArpButton label="Print" icon="print" color="primary" onClick={printCourseReport} />
          </CModalFooter>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default IAMarkEntryPhase6
