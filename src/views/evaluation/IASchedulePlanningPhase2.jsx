import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormCheck,
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

import { ArpButton, ArpDataTable, useArpToast } from '../../components/common'
import {
  IA_PHASE_KEYS,
  getIACourseResources,
  getIASlotResources,
  getIAWorkflowPhase,
  saveIAWorkflowPhase,
} from '../../services/iaWorkflowService'
import IAWorkflowScopeBanner from './IAWorkflowScopeBanner'

const PHASE_1_KEY = 'arp.evaluation.ia.phase1.setup.draft.v2'
const PHASE_2_KEY = 'arp.evaluation.ia.phase2.schedule.draft.v2'
const ACTIVE_BUNDLE_KEY = 'arp.evaluation.ia.active-bundle.v2'

const normalizeSemesterList = (values) =>
  [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => Number(String(value).trim()))
      .filter((value) => Number.isFinite(value) && value > 0),
  )].sort((a, b) => a - b)

const normalizeStringList = (values) =>
  [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  )].sort()

const bundleScopeMatches = (bundle = null, phase = {}) => {
  if (!bundle) return false
  const workflowScope = phase?.workflowScope || {}
  const activeSemesters = normalizeSemesterList(bundle?.chosenSemesters || []).join(',')
  const phaseSemesters = normalizeSemesterList(phase?.chosenSemesters || workflowScope?.chosenSemesters || []).join(',')
  return (
    String(bundle?.institutionId || '') === String(phase?.institutionId || workflowScope?.institutionId || '') &&
    String(bundle?.academicYearId || '') === String(phase?.academicYearId || workflowScope?.academicYearId || '') &&
    String(bundle?.programmeId || '') === String(phase?.programmeScopeKey || phase?.programmeId || workflowScope?.programmeId || '') &&
    String(bundle?.iaCycle || bundle?.examName || '') === String(phase?.iaCycle || phase?.examName || workflowScope?.iaCycle || workflowScope?.examName || '') &&
    String(bundle?.workspaceType || 'SINGLE') === String(phase?.workspaceType || workflowScope?.workspaceType || 'SINGLE') &&
    activeSemesters === phaseSemesters
  )
}

const IASchedulePlanningPhase2 = () => {
  const navigate = useNavigate()
  const phase1 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_1_KEY) || '{}')
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
  const phase2Draft = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_2_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])

  const toast = useArpToast()
  const [phase1Data, setPhase1Data] = useState(phase1)
  const [scope, setScope] = useState({
    fromDate: phase1Data.windowStartDate || '',
    toDate: phase1Data.windowEndDate || '',
    mode: 'OFFLINE',
    venueType: 'CLASSROOM',
  })
  const [slots, setSlots] = useState([])
  const [courses, setCourses] = useState([])
  const [status, setStatus] = useState('DRAFT')
  const [slotLoading, setSlotLoading] = useState(false)
  const [courseLoading, setCourseLoading] = useState(false)
  const [bulkSlotId, setBulkSlotId] = useState('')
  const [onlyShowAvailableSlots, setOnlyShowAvailableSlots] = useState(false)
  const [programmeFilter, setProgrammeFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [editMode, setEditMode] = useState(false)

  const phase1Ready = String(phase1Data.status || '') === 'READY_FOR_PHASE_2'
  const phaseSubmitted = String(status || '').toUpperCase() === 'READY_FOR_PHASE_3'
  const phaseLocked = phaseSubmitted && !editMode
  const resolvedChosenSemesters = useMemo(() => {
    const active = normalizeSemesterList(activeBundle?.chosenSemesters || []).map(String)
    if (active.length > 0) return active
    return normalizeSemesterList(phase1Data.chosenSemesters || []).map(String)
  }, [activeBundle, phase1Data.chosenSemesters])
  const resolvedProgrammeIds = useMemo(() => {
    const active = normalizeStringList(activeBundle?.programmeIds || [])
    if (active.length > 0) return active
    return normalizeStringList(phase1Data.programmeIds || [])
  }, [activeBundle, phase1Data.programmeIds])
  const resolvedProgrammeId = useMemo(
    () => String(
      activeBundle?.programmeId ||
      phase1Data.programmeScopeKey ||
      phase1Data.programmeId ||
      '',
    ).trim(),
    [activeBundle, phase1Data.programmeId, phase1Data.programmeScopeKey],
  )
  const resolvedScopeMode = String(
    activeBundle?.scopeMode ||
    phase1Data.scopeMode ||
    'SINGLE',
  ).trim()
  const resolvedWorkspaceType = String(
    activeBundle?.workspaceType ||
    phase1Data.workspaceType ||
    'SINGLE',
  ).trim()
  const resolvedBundlePreset = String(
    activeBundle?.bundlePreset ||
    phase1Data.bundlePreset ||
    'MANUAL',
  ).trim()
  const resolvedExamName = String(
    activeBundle?.iaCycle ||
    activeBundle?.examName ||
    phase1Data.examName ||
    phase1Data.iaCycle ||
    '',
  ).trim()
  const resolvedLegacySemester = String(
    activeBundle?.chosenSemester ||
    phase1Data.chosenSemester ||
    resolvedChosenSemesters[0] ||
    '',
  ).trim()
  const courseQuerySemester = resolvedWorkspaceType === 'BUNDLE' ? '' : resolvedLegacySemester
  const scopeMatchesActiveBundle = useMemo(() => {
    if (!hasActiveBundle) return false
    const sameInstitution = String(activeBundle.institutionId || '') === String(phase1Data.institutionId || '')
    const sameAcademicYear = String(activeBundle.academicYearId || '') === String(phase1Data.academicYearId || '')
    const sameProgramme = String(activeBundle.programmeId || '') === String(phase1Data.programmeScopeKey || phase1Data.programmeId || '')
    const sameExam = String(activeBundle.iaCycle || activeBundle.examName || '') === String(phase1Data.iaCycle || phase1Data.examName || '')
    const sameWorkspaceType = String(activeBundle.workspaceType || 'SINGLE') === String(phase1Data.workspaceType || 'SINGLE')
    const activeSemesters = normalizeSemesterList(activeBundle.chosenSemesters || []).join(',')
    const phase1Semesters = normalizeSemesterList(phase1Data.chosenSemesters || []).join(',')
    const sameSemesters = activeSemesters === phase1Semesters
    return sameInstitution && sameAcademicYear && sameProgramme && sameExam && sameWorkspaceType && sameSemesters
  }, [activeBundle, hasActiveBundle, phase1Data])

  useEffect(() => {
    if (hasActiveBundle && scopeMatchesActiveBundle) return
    navigate('/evaluation/ia/workspace', {
      replace: true,
      state: { workspaceNotice: 'Select or create an IA Workspace first.' },
    })
  }, [hasActiveBundle, scopeMatchesActiveBundle, navigate])

  useEffect(() => {
    if (!hasActiveBundle) return
    let ignore = false
    ;(async () => {
      const fallbackPhase1 = bundleScopeMatches(activeBundle, phase1)
        ? phase1
        : {
            institutionId: activeBundle.institutionId || '',
            academicYearId: activeBundle.academicYearId || '',
            workspaceType: activeBundle.workspaceType || 'SINGLE',
            chosenSemester: activeBundle.chosenSemester || '',
            chosenSemesters: normalizeSemesterList(activeBundle.chosenSemesters || []).map(String),
            programmeId: activeBundle.programmeId || '',
            programmeScopeKey: activeBundle.programmeId || '',
            programmeIds: normalizeStringList(activeBundle.programmeIds || []),
            iaCycle: activeBundle.iaCycle || activeBundle.examName || '',
            examName: activeBundle.examName || activeBundle.iaCycle || '',
            workflowScope: {
              institutionId: activeBundle.institutionId || '',
              academicYearId: activeBundle.academicYearId || '',
              workspaceType: activeBundle.workspaceType || 'SINGLE',
              chosenSemester: activeBundle.chosenSemester || '',
              chosenSemesters: normalizeSemesterList(activeBundle.chosenSemesters || []).map(String),
              programmeId: activeBundle.programmeId || '',
              programmeIds: normalizeStringList(activeBundle.programmeIds || []),
              iaCycle: activeBundle.iaCycle || activeBundle.examName || '',
              examName: activeBundle.examName || activeBundle.iaCycle || '',
            },
          }
      const nextPhase1 = { ...fallbackPhase1 }
      try {
        const remotePhase1 = await getIAWorkflowPhase(IA_PHASE_KEYS.PHASE_1_SETUP, {
          institutionId: activeBundle.institutionId || '',
          academicYearId: activeBundle.academicYearId || '',
          chosenSemester: activeBundle.chosenSemester || '',
          chosenSemesters: normalizeSemesterList(activeBundle.chosenSemesters || []).map(String),
          programmeId: activeBundle.programmeId || '',
          iaCycle: activeBundle.iaCycle || activeBundle.examName || '',
          examName: activeBundle.examName || activeBundle.iaCycle || '',
        })
        const phase1Payload = remotePhase1?.payload && typeof remotePhase1.payload === 'object' ? remotePhase1.payload : null
        if (phase1Payload) Object.assign(nextPhase1, phase1Payload)
        if (remotePhase1?.workflowStatus || remotePhase1?.status) {
          nextPhase1.status = remotePhase1.workflowStatus || remotePhase1.status
        }
      } catch {
        // keep session fallback
      }

      nextPhase1.institutionId = nextPhase1.institutionId || activeBundle.institutionId || ''
      nextPhase1.academicYearId = nextPhase1.academicYearId || activeBundle.academicYearId || ''
      nextPhase1.workspaceType = nextPhase1.workspaceType || activeBundle.workspaceType || 'SINGLE'
      nextPhase1.iaCycle = nextPhase1.iaCycle || activeBundle.iaCycle || activeBundle.examName || ''
      nextPhase1.examName = nextPhase1.examName || activeBundle.examName || activeBundle.iaCycle || ''
      nextPhase1.chosenSemester = nextPhase1.chosenSemester || activeBundle.chosenSemester || ''
      nextPhase1.chosenSemesters =
        normalizeSemesterList(nextPhase1.chosenSemesters || activeBundle.chosenSemesters || []).map(String)
      nextPhase1.programmeId = nextPhase1.programmeId || activeBundle.programmeId || ''
      nextPhase1.programmeScopeKey = nextPhase1.programmeScopeKey || nextPhase1.programmeId

      let nextScope = {
        fromDate: nextPhase1.windowStartDate || '',
        toDate: nextPhase1.windowEndDate || '',
        mode: 'OFFLINE',
        venueType: 'CLASSROOM',
      }
      let nextSlots = []
      let nextCourses = []
      let nextStatus = 'DRAFT'

      const localDraftScope = phase2Draft?.workflowScope || phase2Draft?.payload?.workflowScope || {}
      if (bundleScopeMatches(activeBundle, localDraftScope)) {
        nextScope = {
          fromDate: phase2Draft?.scope?.fromDate || nextScope.fromDate,
          toDate: phase2Draft?.scope?.toDate || nextScope.toDate,
          mode: phase2Draft?.scope?.mode || nextScope.mode,
          venueType: phase2Draft?.scope?.venueType || nextScope.venueType,
        }
        nextSlots = Array.isArray(phase2Draft?.slots) ? phase2Draft.slots : []
        nextCourses = Array.isArray(phase2Draft?.courses) ? phase2Draft.courses : []
        nextStatus = phase2Draft?.status || 'DRAFT'
      }

      try {
        const remotePhase2 = await getIAWorkflowPhase(IA_PHASE_KEYS.PHASE_2_SCHEDULE, {
          institutionId: activeBundle.institutionId || '',
          academicYearId: activeBundle.academicYearId || '',
          chosenSemester: activeBundle.chosenSemester || '',
          chosenSemesters: normalizeSemesterList(activeBundle.chosenSemesters || []).map(String),
          programmeId: activeBundle.programmeId || '',
          iaCycle: activeBundle.iaCycle || activeBundle.examName || '',
          examName: activeBundle.examName || activeBundle.iaCycle || '',
        })
        const phase2Payload = remotePhase2?.payload && typeof remotePhase2.payload === 'object' ? remotePhase2.payload : null
        if (phase2Payload) {
          nextScope = {
            fromDate: phase2Payload?.scope?.fromDate || nextScope.fromDate,
            toDate: phase2Payload?.scope?.toDate || nextScope.toDate,
            mode: phase2Payload?.scope?.mode || nextScope.mode,
            venueType: phase2Payload?.scope?.venueType || nextScope.venueType,
          }
          nextSlots = Array.isArray(phase2Payload?.slots) ? phase2Payload.slots : nextSlots
          nextCourses = Array.isArray(phase2Payload?.courses) ? phase2Payload.courses : nextCourses
          nextStatus = remotePhase2?.workflowStatus || phase2Payload?.status || nextStatus
        }
      } catch {
        // keep local/session fallback
      }

      if (ignore) return
      setPhase1Data(nextPhase1)
      setScope(nextScope)
      setSlots((prev) => (Array.isArray(nextSlots) && nextSlots.length > 0 ? nextSlots : prev))
      setCourses(nextCourses)
      setStatus(nextStatus)
    })()

    return () => {
      ignore = true
    }
  }, [activeBundle, hasActiveBundle, phase1, phase2Draft])

  useEffect(() => {
    const fetchSlots = async () => {
      if (!phase1Data.institutionId || !scope.fromDate || !scope.toDate) {
        if (slots.length > 0) return
        setSlots([])
        return
      }
      setSlotLoading(true)
      try {
        const data = await getIASlotResources({
          institutionId: phase1Data.institutionId,
          fromDate: scope.fromDate,
          toDate: scope.toDate,
          slotDurationHours: Number(phase1Data.slotDurationMinutes || 0) > 0
            ? Number(phase1Data.slotDurationMinutes) / 60
            : '',
          fnStartTime: phase1Data.fnStartTime || '',
          anStartTime: phase1Data.anStartTime || '',
        })
        const remoteSlots = Array.isArray(data?.slots) ? data.slots : []
        setSlots(remoteSlots)
      } catch {
        setSlots([])
        showToast('warning', 'Unable to load real slot/venue data from server.')
      } finally {
        setSlotLoading(false)
      }
    }
    fetchSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase1Data.institutionId, phase1Data.slotDurationMinutes, phase1Data.fnStartTime, phase1Data.anStartTime, scope.fromDate, scope.toDate])

  useEffect(() => {
    const fetchCourses = async () => {
      if (!phase1Data.institutionId || !phase1Data.academicYearId) {
        setCourses([])
        return
      }
      setCourseLoading(true)
      try {
        const list = await getIACourseResources({
          institutionId: phase1Data.institutionId,
          academicYearId: phase1Data.academicYearId,
          programmeId: resolvedProgrammeId,
          scopeMode: resolvedScopeMode,
          workspaceType: resolvedWorkspaceType,
          programmeIds: resolvedProgrammeIds.join(','),
          chosenSemester: courseQuerySemester,
          chosenSemesters: resolvedChosenSemesters.join(','),
          bundlePreset: resolvedBundlePreset,
        })
        const rows = Array.isArray(list) ? list : []
        setCourses((prev) => {
          const prevById = new Map(prev.map((x) => [x.id, x]))
          return rows.map((r) => {
            const old = prevById.get(r.id)
            const iaDecision = String(old?.iaDecision || 'SCHEDULED').toUpperCase()
            return {
              id: r.id,
              programmeId: r.programmeId || old?.programmeId || '',
              code: r.courseCode,
              name: r.courseName,
              programmeCode:
                r.programmeCode ||
                r.programCode ||
                r.programme_code ||
                r?.programme?.programmeCode ||
                old?.programmeCode ||
                '',
              programmeName:
                r.programmeName ||
                r.programName ||
                r.programme_name ||
                r?.programme?.programmeName ||
                old?.programmeName ||
                '',
              semester:
                r.semester ||
                r.semesterNumber ||
                r.chosenSemester ||
                r.currentSemester ||
                old?.semester ||
                resolvedChosenSemesters[0] ||
                resolvedLegacySemester ||
                '',
              students: Number(r.students || 0),
              faculty: r.facultyCode || r.facultyName || 'UNASSIGNED',
              slotId: old?.slotId || '',
              conflict: iaDecision === 'SCHEDULED' ? old?.conflict || '' : '',
              iaDecision,
              iaExclusionReason: old?.iaExclusionReason || '',
              iaExclusionRemark: old?.iaExclusionRemark || '',
            }
          })
        })
      } catch {
        setCourses([])
        showToast('warning', 'Unable to load real course allocation data from server.')
      } finally {
        setCourseLoading(false)
      }
    }
    fetchCourses()
  }, [phase1Data.institutionId, phase1Data.academicYearId, resolvedProgrammeId, resolvedScopeMode, resolvedWorkspaceType, resolvedBundlePreset, resolvedProgrammeIds, resolvedLegacySemester, resolvedChosenSemesters, courseQuerySemester])

  const showToast = (type, message) => {
    toast.show({
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

  const usedSeatsBySlot = useMemo(() => {
    const map = {}
    courses.forEach((course) => {
      if (!course.slotId || String(course.iaDecision || 'SCHEDULED').toUpperCase() !== 'SCHEDULED') return
      map[course.slotId] = (map[course.slotId] || 0) + Number(course.students || 0)
    })
    return map
  }, [courses])

  const computeCourseConflict = (course, proposedSlotId, list = courses) => {
    if (String(course.iaDecision || 'SCHEDULED').toUpperCase() !== 'SCHEDULED') return ''
    if (!proposedSlotId) return ''
    const slot = slotById[proposedSlotId]
    if (!slot) return 'Invalid Slot'

    const seatsAlready = list
      .filter((x) =>
        x.id !== course.id &&
        x.slotId === proposedSlotId &&
        String(x.iaDecision || 'SCHEDULED').toUpperCase() === 'SCHEDULED',
      )
      .reduce((sum, x) => sum + Number(x.students || 0), 0)
    if (seatsAlready + Number(course.students || 0) > Number(slot.capacity || 0)) return 'Venue Capacity Exceeded'

    const facultyClash = list.some((x) =>
      x.id !== course.id &&
      x.slotId === proposedSlotId &&
      x.faculty === course.faculty &&
      String(x.iaDecision || 'SCHEDULED').toUpperCase() === 'SCHEDULED',
    )
    if (facultyClash) return 'Faculty Clash'

    return ''
  }

  const assignCourseToSlot = (courseId, slotId) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course
        if (String(course.iaDecision || 'SCHEDULED').toUpperCase() !== 'SCHEDULED') {
          return { ...course, slotId: '', conflict: '' }
        }
        return {
          ...course,
          slotId,
          conflict: computeCourseConflict(course, slotId, prev),
        }
      }),
    )
  }

  const getCourseSlotAvailability = (course, slotId, list = courses) => {
    if (!slotId) return { available: true, reason: '' }
    const reason = computeCourseConflict(course, slotId, list)
    return { available: !reason, reason }
  }

  const getSelectableSlotsForCourse = (course) => {
    if (!onlyShowAvailableSlots) return slots
    return slots.filter((slot) => {
      if (course.slotId === slot.id) return true
      return getCourseSlotAvailability(course, slot.id).available
    })
  }

  const onBulkAssignToUnassigned = () => {
    if (!bulkSlotId) {
      showToast('warning', 'Select a date-session slot for bulk assign.')
      return
    }
    let assigned = 0
    let skipped = 0
    setCourses((prev) => {
      const next = [...prev]
      for (let i = 0; i < next.length; i += 1) {
        const course = next[i]
        if (String(course.iaDecision || 'SCHEDULED').toUpperCase() !== 'SCHEDULED') continue
        if (course.slotId) continue
        const reason = computeCourseConflict(course, bulkSlotId, next)
        if (reason) {
          next[i] = { ...course, conflict: reason }
          skipped += 1
        } else {
          next[i] = { ...course, slotId: bulkSlotId, conflict: '' }
          assigned += 1
        }
      }
      return next
    })
    showToast('info', `Bulk assign finished. Assigned: ${assigned}, Skipped: ${skipped}`)
  }

  const onAutoAssign = () => {
    const next = [...courses]
    next.forEach((course) => {
      if (String(course.iaDecision || 'SCHEDULED').toUpperCase() !== 'SCHEDULED') {
        course.slotId = ''
        course.conflict = ''
        return
      }
      const possible = slots.find((slot) => {
        const seatsAlready = next
          .filter((x) =>
            x.id !== course.id &&
            x.slotId === slot.id &&
            String(x.iaDecision || 'SCHEDULED').toUpperCase() === 'SCHEDULED',
          )
          .reduce((sum, x) => sum + Number(x.students || 0), 0)
        const capacityOkay = seatsAlready + Number(course.students || 0) <= Number(slot.capacity || 0)
        const facultyFree = !next.some(
          (x) =>
            x.id !== course.id &&
            x.slotId === slot.id &&
            x.faculty === course.faculty &&
            String(x.iaDecision || 'SCHEDULED').toUpperCase() === 'SCHEDULED',
        )
        return capacityOkay && facultyFree
      })
      course.slotId = possible?.id || ''
      course.conflict = possible ? '' : 'No Feasible Slot'
    })
    setCourses(next)
    showToast('info', 'Auto assignment completed.')
  }

  const onClearAllocations = () => {
    setCourses((prev) =>
      prev.map((course) => ({
        ...course,
        slotId: '',
        conflict: '',
      })),
    )
    showToast('warning', 'All allocations cleared.')
  }

  const scheduledCourses = useMemo(
    () => courses.filter((course) => String(course.iaDecision || 'SCHEDULED').toUpperCase() === 'SCHEDULED'),
    [courses],
  )
  const conflictCount = useMemo(
    () => scheduledCourses.filter((course) => String(course.conflict || '').trim()).length,
    [scheduledCourses],
  )

  const unassignedCount = useMemo(
    () => scheduledCourses.filter((course) => !course.slotId).length,
    [scheduledCourses],
  )
  const programmeOptions = useMemo(() => {
    const map = new Map()
    courses.forEach((course) => {
      const value = String(course.programmeId || '').trim()
      const programmeCode = String(course.programmeCode || '').trim()
      const programmeName = String(course.programmeName || '').trim()
      const label = [programmeCode, programmeName].filter(Boolean).join(' - ') || value
      if (value && label && !map.has(value)) {
        map.set(value, { value, label })
      }
    })
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [courses])
  const semesterOptions = useMemo(
    () => [...new Set(
      courses
        .map((course) => String(course.semester || '').trim())
        .filter(Boolean),
    )].sort((a, b) => Number(a) - Number(b)),
    [courses],
  )
  const visibleCourses = useMemo(
    () => courses.filter((course) => {
      const programmeMatch = !programmeFilter || String(course.programmeId || '').trim() === programmeFilter
      const semesterMatch = !semesterFilter || String(course.semester || '').trim() === semesterFilter
      return programmeMatch && semesterMatch
    }),
    [courses, programmeFilter, semesterFilter],
  )
  const visibleConflictCount = useMemo(
    () => visibleCourses.filter((course) => String(course.iaDecision || 'SCHEDULED').toUpperCase() === 'SCHEDULED' && String(course.conflict || '').trim()).length,
    [visibleCourses],
  )
  const visibleUnassignedCount = useMemo(
    () => visibleCourses.filter((course) => String(course.iaDecision || 'SCHEDULED').toUpperCase() === 'SCHEDULED' && !course.slotId).length,
    [visibleCourses],
  )
  const semesterSummary = useMemo(() => {
    const counts = courses.reduce((acc, course) => {
      const key = String(course.semester || '-').trim() || '-'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([semester, count]) => `Semester ${semester}: ${count}`)
      .join(' | ')
  }, [courses])
  const courseTableColumns = useMemo(
    () => [
      { key: 'programmeDisplay', label: 'Programme', sortable: true, sortType: 'string' },
      { key: 'semester', label: 'Semester', sortable: true, sortType: 'number', align: 'center' },
      { key: 'code', label: 'Course Code', sortable: true, sortType: 'string' },
      { key: 'name', label: 'Course Name', sortable: true, sortType: 'string' },
      { key: 'iaDecision', label: 'IA Decision', sortable: true, sortType: 'string' },
      { key: 'iaReasonRemark', label: 'Reason / Remark' },
      { key: 'students', label: 'Students', sortable: true, sortType: 'number', align: 'right' },
      { key: 'slotAssignment', label: 'Assigned Slot (Date - Session)' },
      { key: 'conflictDisplay', label: 'Conflict', sortable: true, sortType: 'string', align: 'center' },
    ],
    [],
  )
  const courseTableRows = useMemo(
    () => visibleCourses.map((course) => ({
      ...course,
      programmeDisplay: [course.programmeCode, course.programmeName].filter(Boolean).join(' - ') || '-',
      iaReasonRemark: '',
      slotAssignment: '',
      conflictDisplay:
        String(course.iaDecision || 'SCHEDULED').toUpperCase() !== 'SCHEDULED'
          ? 'Excluded'
          : course.conflict
            ? course.conflict
            : course.slotId
              ? 'OK'
              : 'Pending',
    })),
    [visibleCourses],
  )

  const updateCourseDecision = (courseId, iaDecision) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course
        const nextDecision = String(iaDecision || 'SCHEDULED').toUpperCase()
        if (nextDecision === 'EXCLUDED') {
          return {
            ...course,
            iaDecision: 'EXCLUDED',
            slotId: '',
            conflict: '',
          }
        }
        return {
          ...course,
          iaDecision: 'SCHEDULED',
          iaExclusionReason: '',
          iaExclusionRemark: '',
          conflict: course.slotId ? computeCourseConflict({ ...course, iaDecision: 'SCHEDULED' }, course.slotId, prev) : '',
        }
      }),
    )
  }

  const updateCourseExclusionMeta = (courseId, key, value) => {
    setCourses((prev) =>
      prev.map((course) => (course.id === courseId ? { ...course, [key]: value } : course)),
    )
  }

  const onSaveDraft = () => {
    const payload = {
      workflowScope: {
        institutionId: phase1Data.institutionId || '',
        academicYearId: phase1Data.academicYearId || '',
        chosenSemester: resolvedLegacySemester,
        chosenSemesters: resolvedChosenSemesters,
        programmeId: resolvedProgrammeId,
        scopeMode: resolvedScopeMode,
        programmeIds: resolvedProgrammeIds,
        workspaceType: resolvedWorkspaceType,
        bundlePreset: resolvedBundlePreset,
        examName: resolvedExamName,
        iaCycle: resolvedExamName,
      },
      scope,
      slots,
      courses,
      status: 'DRAFT',
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_2_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_2_SCHEDULE, {
          institutionId: phase1Data.institutionId || '',
          academicYearId: phase1Data.academicYearId || '',
          chosenSemester: resolvedLegacySemester,
          chosenSemesters: resolvedChosenSemesters,
          programmeId: resolvedProgrammeId,
          programmeIds: resolvedProgrammeIds,
          workspaceType: resolvedWorkspaceType,
          bundlePreset: resolvedBundlePreset,
          examName: resolvedExamName,
          iaCycle: resolvedExamName,
          workflowStatus: 'DRAFT',
          payload: {
            workflowScope: {
              institutionId: phase1Data.institutionId || '',
              academicYearId: phase1Data.academicYearId || '',
              chosenSemester: resolvedLegacySemester,
              chosenSemesters: resolvedChosenSemesters,
              programmeId: resolvedProgrammeId,
              scopeMode: resolvedScopeMode,
              programmeIds: resolvedProgrammeIds,
              workspaceType: resolvedWorkspaceType,
              bundlePreset: resolvedBundlePreset,
              examName: resolvedExamName,
              iaCycle: resolvedExamName,
            },
            scope,
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
    showToast('success', 'Phase 2 draft saved.')
  }

  const onSubmitPhase2 = () => {
    const invalidExcluded = courses.filter((course) =>
      String(course.iaDecision || 'SCHEDULED').toUpperCase() === 'EXCLUDED' &&
      !String(course.iaExclusionReason || '').trim(),
    )
    if (invalidExcluded.length > 0) {
      showToast('danger', 'Select a reason for all excluded courses before submit.')
      return
    }
    if (unassignedCount > 0) {
      showToast('danger', `Assign all courses before submit. Pending: ${unassignedCount}`)
      return
    }
    if (conflictCount > 0) {
      showToast('danger', 'Resolve conflicts before submit.')
      return
    }
    const payload = {
      workflowScope: {
        institutionId: phase1Data.institutionId || '',
        academicYearId: phase1Data.academicYearId || '',
        chosenSemester: resolvedLegacySemester,
        chosenSemesters: resolvedChosenSemesters,
        programmeId: resolvedProgrammeId,
        scopeMode: resolvedScopeMode,
        programmeIds: resolvedProgrammeIds,
        workspaceType: resolvedWorkspaceType,
        bundlePreset: resolvedBundlePreset,
        examName: resolvedExamName,
        iaCycle: resolvedExamName,
      },
      scope,
      slots,
      courses,
      status: 'READY_FOR_PHASE_3',
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_2_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_2_SCHEDULE, {
          institutionId: phase1Data.institutionId || '',
          academicYearId: phase1Data.academicYearId || '',
          chosenSemester: resolvedLegacySemester,
          chosenSemesters: resolvedChosenSemesters,
          programmeId: resolvedProgrammeId,
          programmeIds: resolvedProgrammeIds,
          workspaceType: resolvedWorkspaceType,
          bundlePreset: resolvedBundlePreset,
          examName: resolvedExamName,
          iaCycle: resolvedExamName,
          workflowStatus: 'READY_FOR_PHASE_3',
          payload: {
            workflowScope: {
              institutionId: phase1Data.institutionId || '',
              academicYearId: phase1Data.academicYearId || '',
              chosenSemester: resolvedLegacySemester,
              chosenSemesters: resolvedChosenSemesters,
              programmeId: resolvedProgrammeId,
              scopeMode: resolvedScopeMode,
              programmeIds: resolvedProgrammeIds,
              workspaceType: resolvedWorkspaceType,
              bundlePreset: resolvedBundlePreset,
              examName: resolvedExamName,
              iaCycle: resolvedExamName,
            },
            scope,
            slots,
            courses,
            status: 'READY_FOR_PHASE_3',
          },
        })
      } catch {
        // Retain local submit state when API save fails.
      }
    })()
    setStatus('READY_FOR_PHASE_3')
    setEditMode(false)
    showToast('success', 'Phase 2 completed. Ready for conflict validation.')
  }

  return (
    <CRow>
      <CCol xs={12}>
        <IAWorkflowScopeBanner scope={phase1Data} />
        {!phase1Ready ? (
          <CAlert color="warning" className="mb-3">
            Phase 1 is not submitted yet. Complete IA Setup (`READY_FOR_PHASE_2`) before finalizing schedule planning.
          </CAlert>
        ) : null}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT - PHASE 2 SCHEDULE PLANNING</strong>
            <div className="d-flex gap-2">
              <CBadge color={phase1Ready ? 'success' : 'warning'}>
                Phase 1: {phase1Ready ? 'READY' : 'PENDING'}
              </CBadge>
              <CBadge color={status === 'READY_FOR_PHASE_3' ? 'success' : 'secondary'}>
                {status === 'READY_FOR_PHASE_3' ? 'READY FOR PHASE 3' : 'DRAFT'}
              </CBadge>
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2}><CFormLabel>Exam Window</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput value={phase1Data.examWindowName || '-'} disabled />
              </CCol>
              <CCol md={2}><CFormLabel>Name of the Examination</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput value={phase1Data.examName || phase1Data.iaCycle || '-'} disabled />
              </CCol>
              <CCol md={2}><CFormLabel>From Date</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput
                  type="date"
                  value={scope.fromDate}
                  onChange={(e) => setScope((prev) => ({ ...prev, fromDate: e.target.value }))}
                  disabled
                />
              </CCol>
              <CCol md={2}><CFormLabel>To Date</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput
                  type="date"
                  value={scope.toDate}
                  onChange={(e) => setScope((prev) => ({ ...prev, toDate: e.target.value }))}
                  disabled
                />
              </CCol>
              <CCol md={2}><CFormLabel>Mode</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.mode}
                  onChange={(e) => setScope((prev) => ({ ...prev, mode: e.target.value }))}
                  disabled={phaseLocked}
                >
                  <option value="OFFLINE">Offline</option>
                  <option value="ONLINE">Online</option>
                  <option value="HYBRID">Hybrid</option>
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>Venue Type</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.venueType}
                  onChange={(e) => setScope((prev) => ({ ...prev, venueType: e.target.value }))}
                  disabled={phaseLocked}
                >
                  <option value="CLASSROOM">Classroom</option>
                  <option value="LAB">Lab</option>
                  <option value="HALL">Hall</option>
                </CFormSelect>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardBody>
            <CAccordion alwaysOpen activeItemKey={2}>
              <CAccordionItem itemKey={1}>
                <CAccordionHeader>
                  <div className="d-flex justify-content-between w-100 pe-2 align-items-center">
                    <strong>Slots and Venue Capacity (Reference)</strong>
                    <div className="d-flex gap-2">
                      <CBadge color="info">Slots: {slots.length}</CBadge>
                    </div>
                  </div>
                </CAccordionHeader>
                <CAccordionBody>
                  {phaseLocked ? (
                    <CAlert color="info" className="mb-3">
                      Phase 2 is submitted and locked. Use Enable Edit to revise this bundle, or continue with Phase 3.
                    </CAlert>
                  ) : null}
                  {slotLoading ? <div className="text-muted mb-2">Loading slots and venues...</div> : null}
                  <CTable responsive hover align="middle">
                    <CTableHead color="light">
                      <CTableRow>
                        <CTableHeaderCell>Date</CTableHeaderCell>
                        <CTableHeaderCell>Session</CTableHeaderCell>
                        <CTableHeaderCell>Start</CTableHeaderCell>
                        <CTableHeaderCell>End</CTableHeaderCell>
                        <CTableHeaderCell>Venue</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Capacity</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Used</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Balance</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {slots.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell colSpan={8} className="text-center text-muted py-4">
                            No slot/venue data found for selected date range.
                          </CTableDataCell>
                        </CTableRow>
                      ) : null}
                      {slots.map((slot) => {
                        const used = Number(usedSeatsBySlot[slot.id] || 0)
                        const balance = Number(slot.capacity || 0) - used
                        return (
                          <CTableRow key={slot.id}>
                            <CTableDataCell>{slot.date}</CTableDataCell>
                            <CTableDataCell>{slot.session}</CTableDataCell>
                            <CTableDataCell>{slot.startTime}</CTableDataCell>
                            <CTableDataCell>{slot.endTime}</CTableDataCell>
                            <CTableDataCell>{slot.venue}</CTableDataCell>
                            <CTableDataCell className="text-end">{slot.capacity}</CTableDataCell>
                            <CTableDataCell className="text-end">{used}</CTableDataCell>
                            <CTableDataCell className={`text-end ${balance < 0 ? 'text-danger fw-semibold' : ''}`}>
                              {balance}
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
                    </CTableBody>
                  </CTable>
                </CAccordionBody>
              </CAccordionItem>

              <CAccordionItem itemKey={2}>
                <CAccordionHeader>
                  <div className="d-flex justify-content-between w-100 pe-2 align-items-center">
                    <strong>Course Allocation</strong>
                    <div className="d-flex gap-2">
                      {semesterSummary ? <CBadge color="info">{semesterSummary}</CBadge> : null}
                      <CBadge color={visibleConflictCount > 0 ? 'danger' : 'success'}>Conflicts: {visibleConflictCount}</CBadge>
                      <CBadge color={visibleUnassignedCount > 0 ? 'warning' : 'success'}>Unassigned: {visibleUnassignedCount}</CBadge>
                    </div>
                  </div>
                </CAccordionHeader>
                <CAccordionBody>
                  <div className="d-flex gap-2 mb-3">
                    <ArpButton label="Auto Assign" icon="search" color="info" onClick={onAutoAssign} disabled={phaseLocked} />
                    <ArpButton label="Clear Allocations" icon="reset" color="warning" onClick={onClearAllocations} disabled={phaseLocked} />
                  </div>
                  <CRow className="g-2 mb-3 align-items-end">
                    <CCol md={4} lg={3}>
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
                    <CCol md={3} lg={2}>
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
                    <CCol md={5} lg={4}>
                      <CFormLabel>Bulk Assign Slot (Unassigned Courses)</CFormLabel>
                      <CFormSelect value={bulkSlotId} onChange={(e) => setBulkSlotId(e.target.value)} disabled={phaseLocked}>
                        <option value="">Select Date - Session</option>
                        {slots.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.date} - {slot.session} ({slot.startTime}-{slot.endTime}) [{slot.venue}]
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                    <CCol md={3} lg={2}>
                      <ArpButton
                        label="Assign Unassigned"
                        icon="submit"
                        color="primary"
                        onClick={onBulkAssignToUnassigned}
                        disabled={phaseLocked}
                      />
                    </CCol>
                    <CCol md={12} lg={12}>
                      <CFormCheck
                        id="only-available-slots"
                        label="Only show available slots in row dropdowns"
                        checked={onlyShowAvailableSlots}
                        onChange={(e) => setOnlyShowAvailableSlots(e.target.checked)}
                        disabled={phaseLocked}
                      />
                    </CCol>
                  </CRow>
                  <ArpDataTable
                    title="Course Allocation Table"
                    rows={courseTableRows}
                    columns={courseTableColumns}
                    loading={courseLoading}
                    searchable={false}
                    defaultPageSize={10}
                    pageSizeOptions={[10, 25, 50, 100]}
                    emptyText="No course data found for the current filters."
                    scopedColumns={{
                      iaDecision: (course) => (
                        <div style={{ minWidth: 190 }}>
                          <CFormSelect
                            value={course.iaDecision || 'SCHEDULED'}
                            onChange={(e) => updateCourseDecision(course.id, e.target.value)}
                            disabled={phaseLocked}
                          >
                            <option value="SCHEDULED">Scheduled for IA</option>
                            <option value="EXCLUDED">Not Scheduled for IA</option>
                          </CFormSelect>
                        </div>
                      ),
                      iaReasonRemark: (course) => (
                        <div style={{ minWidth: 260 }}>
                          {String(course.iaDecision || 'SCHEDULED').toUpperCase() === 'EXCLUDED' ? (
                            <div className="d-flex flex-column gap-2">
                              <CFormSelect
                                value={course.iaExclusionReason || ''}
                                onChange={(e) => updateCourseExclusionMeta(course.id, 'iaExclusionReason', e.target.value)}
                                disabled={phaseLocked}
                              >
                                <option value="">Select Reason</option>
                                <option value="ESE_ONLY">ESE Only Course</option>
                                <option value="NO_IA">No IA for this Course</option>
                                <option value="PRACTICAL_ONLY">Practical Only</option>
                                <option value="PROJECT_VIVA">Project / Viva</option>
                                <option value="INSTITUTION_DECISION">Institution Decision</option>
                                <option value="OTHER">Other</option>
                              </CFormSelect>
                              <CFormInput
                                value={course.iaExclusionRemark || ''}
                                placeholder="Enter remark"
                                onChange={(e) => updateCourseExclusionMeta(course.id, 'iaExclusionRemark', e.target.value)}
                                disabled={phaseLocked}
                              />
                            </div>
                          ) : (
                            <span className="text-muted">Included for IA scheduling</span>
                          )}
                        </div>
                      ),
                      slotAssignment: (course) => (
                        <div style={{ minWidth: 320 }}>
                          <CFormSelect
                            value={course.slotId || ''}
                            onChange={(e) => assignCourseToSlot(course.id, e.target.value)}
                            disabled={phaseLocked || String(course.iaDecision || 'SCHEDULED').toUpperCase() !== 'SCHEDULED'}
                          >
                            <option value="">Select Date - Session</option>
                            {getSelectableSlotsForCourse(course).map((slot) => {
                              const { available, reason } = getCourseSlotAvailability(course, slot.id)
                              return (
                                <option key={slot.id} value={slot.id} disabled={!available && course.slotId !== slot.id}>
                                  {slot.date} - {slot.session} ({slot.startTime}-{slot.endTime}) [{slot.venue}]
                                  {!available && course.slotId !== slot.id ? ` - ${reason}` : ''}
                                </option>
                              )
                            })}
                          </CFormSelect>
                        </div>
                      ),
                      conflictDisplay: (course) => (
                        String(course.iaDecision || 'SCHEDULED').toUpperCase() !== 'SCHEDULED' ? (
                          <CBadge color="secondary">Excluded</CBadge>
                        ) : course.conflict ? (
                          <CBadge color="danger">{course.conflict}</CBadge>
                        ) : (
                          <CBadge color={course.slotId ? 'success' : 'secondary'}>
                            {course.slotId ? 'OK' : 'Pending'}
                          </CBadge>
                        )
                      ),
                    }}
                  />
                </CAccordionBody>
              </CAccordionItem>
            </CAccordion>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader><strong>Phase 2 Actions</strong></CCardHeader>
          <CCardBody className="d-flex justify-content-end gap-2">
            {phaseLocked ? (
              <>
                <ArpButton
                  label="Enable Edit"
                  icon="edit"
                  color="warning"
                  onClick={() => setEditMode(true)}
                  disabled={!phase1Ready || !scopeMatchesActiveBundle}
                />
                <ArpButton
                  label="Go to Workspace Console"
                  icon="view"
                  color="secondary"
                  onClick={() => navigate('/evaluation/ia/workspace')}
                />
              </>
            ) : (
              <>
                <ArpButton label="Save Draft" icon="save" color="secondary" onClick={onSaveDraft} disabled={!phase1Ready || !scopeMatchesActiveBundle} />
                <ArpButton label="Submit Phase 2" icon="submit" color="success" onClick={onSubmitPhase2} disabled={!phase1Ready || !scopeMatchesActiveBundle} />
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default IASchedulePlanningPhase2
