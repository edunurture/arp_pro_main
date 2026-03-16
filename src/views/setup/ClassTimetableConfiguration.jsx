import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilXCircle } from '@coreui/icons'
import { ArpButton, useArpToast } from '../../components/common'
import api from '../../services/apiClient'

const initialScope = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  semesterCategory: '',
  batchId: '',
  semester: '',
}

const defaultDayOptions = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]

const periodTypes = ['THEORY', 'LAB', 'ELECTIVE', 'BREAK', 'ACTIVITY']

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const normalizeSemesterList = (value) => {
  const source = Array.isArray(value) ? value : String(value ?? '').match(/\d+/g) || []
  return Array.from(
    new Set(
      source
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  ).sort((a, b) => a - b)
}

const buildAnnualAcademicYears = (items = []) => {
  const grouped = new Map()

  items.forEach((row) => {
    const key = `${row?.institutionId || ''}::${row?.academicYear || ''}`
    const current = grouped.get(key) || {
      id: row?.id || '',
      institutionId: row?.institutionId || '',
      academicYear: row?.academicYear || '',
      academicYearLabel: row?.academicYear || '',
      oddAcademicYearId: '',
      evenAcademicYearId: '',
      oddChosenSemesters: [],
      evenChosenSemesters: [],
    }

    const category = String(row?.semesterCategory || '').toUpperCase().trim()
    if (category === 'ODD') {
      current.oddAcademicYearId = row?.id || ''
      current.oddChosenSemesters = normalizeSemesterList(row?.chosenSemesters)
      current.id = current.id || row?.id || ''
    }
    if (category === 'EVEN') {
      current.evenAcademicYearId = row?.id || ''
      current.evenChosenSemesters = normalizeSemesterList(row?.chosenSemesters)
      if (!current.oddAcademicYearId) current.id = row?.id || current.id
    }

    grouped.set(key, current)
  })

  return Array.from(grouped.values()).sort((left, right) =>
    String(right?.academicYear || '').localeCompare(String(left?.academicYear || '')),
  )
}

const dedupeAnnualAcademicYears = (items = []) => {
  const grouped = new Map()

  items.forEach((row) => {
    const key = `${row?.institutionId || ''}::${row?.academicYearLabel || row?.academicYear || ''}`
    const current = grouped.get(key) || {
      ...row,
      oddChosenSemesters: normalizeSemesterList(row?.oddChosenSemesters),
      evenChosenSemesters: normalizeSemesterList(row?.evenChosenSemesters),
    }

    if (!current.id && row?.id) current.id = row.id
    if (!current.oddAcademicYearId && row?.oddAcademicYearId) current.oddAcademicYearId = row.oddAcademicYearId
    if (!current.evenAcademicYearId && row?.evenAcademicYearId) current.evenAcademicYearId = row.evenAcademicYearId
    current.oddChosenSemesters = normalizeSemesterList([
      ...(Array.isArray(current.oddChosenSemesters) ? current.oddChosenSemesters : []),
      ...(Array.isArray(row?.oddChosenSemesters) ? row.oddChosenSemesters : []),
    ])
    current.evenChosenSemesters = normalizeSemesterList([
      ...(Array.isArray(current.evenChosenSemesters) ? current.evenChosenSemesters : []),
      ...(Array.isArray(row?.evenChosenSemesters) ? row.evenChosenSemesters : []),
    ])

    grouped.set(key, current)
  })

  return Array.from(grouped.values()).sort((left, right) =>
    String(right?.academicYearLabel || right?.academicYear || '').localeCompare(
      String(left?.academicYearLabel || left?.academicYear || ''),
    ),
  )
}

const normalizePattern = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .trim()

const createEntry = (overrides = {}) => ({
  dayOfWeek: 1,
  timetableSlotId: '',
  periodType: 'THEORY',
  courseOfferingId: '',
  facultyId: '',
  roomClassId: '',
  title: '',
  notes: '',
  ...overrides,
})

const buildCellKey = (day, slotId) => `${day}|${slotId}`
const isBreakSlot = (slot) =>
  Boolean(slot?.isInterval) ||
  /break/i.test(String(slot?.nomenclature || '')) ||
  /break/i.test(String(slot?.shiftName || ''))
const TIMETABLE_MODES = {
  MANUAL: 'MANUAL',
  AUTOMATIC: 'AUTOMATIC',
}

export default function ClassTimetableConfiguration() {
  const [scope, setScope] = useState(initialScope)
  const [loadingScope, setLoadingScope] = useState(false)
  const [loadingClass, setLoadingClass] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [mappedSemesters, setMappedSemesters] = useState([])

  const [slotMasters, setSlotMasters] = useState([])
  const [classes, setClasses] = useState([])
  const [courseOfferings, setCourseOfferings] = useState([])
  const [courseAllotments, setCourseAllotments] = useState([])
  const [faculties, setFaculties] = useState([])
  const [roomClasses, setRoomClasses] = useState([])

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedTimetableId, setSelectedTimetableId] = useState('')
  const [entries, setEntries] = useState([])
  const [versionNo, setVersionNo] = useState(0)
  const [isPublished, setIsPublished] = useState(false)
  const [conflicts, setConflicts] = useState([])

  const [dayMode, setDayMode] = useState('DAY_PATTERN')
  const [dayOptions, setDayOptions] = useState(defaultDayOptions)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorModel, setEditorModel] = useState(createEntry())
  const [timetableMode, setTimetableMode] = useState(TIMETABLE_MODES.MANUAL)
  const toast = useArpToast()

  const showToast = (type, message) => {
    if (!message) return
    toast.show({
      color: type,
      title:
        type === 'success'
          ? 'Success'
          : type === 'warning'
            ? 'Attention'
            : type === 'info'
              ? 'Info'
              : 'Error',
      message,
      delay: type === 'danger' ? 7000 : 4500,
    })
  }

  const scopeReady = useMemo(
    () =>
      Boolean(
        scope.institutionId &&
          scope.departmentId &&
          scope.programmeId &&
          scope.regulationId &&
          scope.academicYearId &&
          scope.semesterCategory &&
          scope.batchId &&
          scope.semester,
      ),
    [scope],
  )

  const scopeParams = useMemo(
    () => ({
      ...scope,
      academicYearId: scope.academicYearId,
    }),
    [scope],
  )

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(scope.academicYearId)) || null,
    [academicYears, scope.academicYearId],
  )

  const resolvedAcademicYearId = useMemo(() => {
    if (scope.semesterCategory === 'EVEN') {
      return selectedAcademicYear?.evenAcademicYearId || scope.academicYearId
    }
    if (scope.semesterCategory === 'ODD') {
      return selectedAcademicYear?.oddAcademicYearId || scope.academicYearId
    }
    return scope.academicYearId
  }, [scope.academicYearId, scope.semesterCategory, selectedAcademicYear])

  const semesterCategoryOptions = useMemo(() => {
    const out = []
    if (Array.isArray(selectedAcademicYear?.oddChosenSemesters) && selectedAcademicYear.oddChosenSemesters.length) {
      out.push('ODD')
    }
    if (Array.isArray(selectedAcademicYear?.evenChosenSemesters) && selectedAcademicYear.evenChosenSemesters.length) {
      out.push('EVEN')
    }
    if (!out.length) {
      if (mappedSemesters.some((n) => Number(n) % 2 === 1)) out.push('ODD')
      if (mappedSemesters.some((n) => Number(n) % 2 === 0)) out.push('EVEN')
    }
    return out
  }, [mappedSemesters, selectedAcademicYear])

  const semesterOptions = useMemo(() => {
    const category = String(scope.semesterCategory || '').toUpperCase().trim()
    if (category === 'ODD') {
      const mappedOdd = mappedSemesters.filter((n) => Number(n) % 2 === 1)
      if (mappedOdd.length) return mappedOdd
      return Array.isArray(selectedAcademicYear?.oddChosenSemesters) ? selectedAcademicYear.oddChosenSemesters : []
    }
    if (category === 'EVEN') {
      const mappedEven = mappedSemesters.filter((n) => Number(n) % 2 === 0)
      if (mappedEven.length) return mappedEven
      return Array.isArray(selectedAcademicYear?.evenChosenSemesters) ? selectedAcademicYear.evenChosenSemesters : []
    }
    return []
  }, [mappedSemesters, scope.semesterCategory, selectedAcademicYear])

  const selectedTimetable = useMemo(
    () => slotMasters.find((x) => String(x.id) === String(selectedTimetableId)) || null,
    [slotMasters, selectedTimetableId],
  )

  const slotColumns = useMemo(() => {
    const slots = Array.isArray(selectedTimetable?.slots) ? selectedTimetable.slots : []
    return [...slots].sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0))
  }, [selectedTimetable])

  const entryMap = useMemo(() => {
    const map = new Map()
    entries.forEach((e) => map.set(buildCellKey(Number(e.dayOfWeek), String(e.timetableSlotId)), e))
    return map
  }, [entries])

  const conflictMap = useMemo(() => {
    const map = new Map()
    conflicts.forEach((conflict, index) => {
      const key = buildCellKey(Number(conflict?.dayOfWeek || 0), String(conflict?.timetableSlotId || ''))
      if (key === '0|') return
      const list = map.get(key) || []
      list.push({ ...conflict, _index: index })
      map.set(key, list)
    })
    return map
  }, [conflicts])

  const selectedClass = useMemo(
    () => classes.find((x) => String(x.classId) === String(selectedClassId)) || null,
    [classes, selectedClassId],
  )

  const facultyById = useMemo(
    () => new Map(faculties.map((f) => [String(f.id), f])),
    [faculties],
  )

  const offeringById = useMemo(
    () => new Map(courseOfferings.map((o) => [String(o.id), o])),
    [courseOfferings],
  )

  const allottedFacultyByOffering = useMemo(() => {
    const byCourse = new Map()
    courseAllotments.forEach((row) => {
      const courseId = String(row?.courseId || '')
      const facultyId = String(row?.facultyId || '')
      if (!courseId || !facultyId) return
      if (!byCourse.has(courseId)) byCourse.set(courseId, new Map())
      byCourse.get(courseId).set(facultyId, {
        id: row.facultyId,
        facultyCode: row.facultyCode || '',
        facultyName: row.facultyName || '',
      })
    })

    const byOffering = new Map()
    courseOfferings.forEach((off) => {
      const courseId = String(off?.courseId || '')
      byOffering.set(String(off.id), Array.from((byCourse.get(courseId) || new Map()).values()))
    })
    return byOffering
  }, [courseAllotments, courseOfferings])

  const autoAllocationPlans = useMemo(() => {
    const byCourse = new Map()
    courseAllotments.forEach((row) => {
      const courseId = String(row?.courseId || '')
      const facultyId = String(row?.facultyId || '')
      const hoursAllocated = Number(row?.hoursAllocated || 0)
      if (!courseId || !facultyId || !Number.isFinite(hoursAllocated) || hoursAllocated <= 0) return
      if (!byCourse.has(courseId)) byCourse.set(courseId, [])
      byCourse.get(courseId).push({
        courseId,
        facultyId,
        facultyCode: row?.facultyCode || '',
        facultyName: row?.facultyName || '',
        hoursAllocated,
      })
    })

    return courseOfferings
      .map((off, index) => {
        const courseId = String(off?.courseId || '')
        const plans = byCourse.get(courseId) || []
        const totalHours = plans.reduce((sum, plan) => sum + Number(plan.hoursAllocated || 0), 0)
        const primaryPlan = plans[0] || null
        return {
          id: `AUTO_${off?.id || index + 1}`,
          courseOfferingId: off?.id || '',
          courseId,
          courseCode: off?.course?.courseCode || '',
          courseTitle: off?.course?.courseTitle || '',
          periodType: String(off?.course?.courseType || off?.course?.courseCategory || 'THEORY').toUpperCase(),
          hoursRemaining: totalHours,
          facultyId: primaryPlan?.facultyId || '',
          facultyCode: primaryPlan?.facultyCode || '',
          facultyName: primaryPlan?.facultyName || '',
        }
      })
      .filter((item) => item.courseOfferingId && item.facultyId && Number(item.hoursRemaining || 0) > 0)
  }, [courseAllotments, courseOfferings])

  const editorFacultyOptions = useMemo(() => {
    if (editorModel.periodType === 'BREAK') return []
    if (editorModel.periodType === 'ACTIVITY') return faculties
    return allottedFacultyByOffering.get(String(editorModel.courseOfferingId || '')) || []
  }, [editorModel.periodType, editorModel.courseOfferingId, faculties, allottedFacultyByOffering])

  const deriveDayConfig = (rows = []) => {
    const active = (Array.isArray(rows) ? rows : []).filter((x) => x && x.isActive !== false)
    const dayPatternRows = active.filter((x) => normalizePattern(x?.calendarPattern).includes('DAY_PATTERN'))
    if (dayPatternRows.length) {
      const dayNames = [
        ...new Set(
          dayPatternRows
            .flatMap((x) => String(x?.day || '').split(','))
            .map((x) => x.trim())
            .filter(Boolean),
        ),
      ]
      if (dayNames.length) {
        return { mode: 'DAY_PATTERN', options: dayNames.map((d, i) => ({ value: i + 1, label: d })) }
      }
      return { mode: 'DAY_PATTERN', options: defaultDayOptions }
    }

    const dayOrderRows = active.filter((x) => normalizePattern(x?.calendarPattern).includes('DAY_ORDER'))
    if (dayOrderRows.length) {
      const mins = dayOrderRows.map((x) => Number(x?.minimumDayOrder)).filter((n) => Number.isFinite(n))
      const maxs = dayOrderRows.map((x) => Number(x?.maxDayOrder)).filter((n) => Number.isFinite(n))
      const min = mins.length ? Math.min(...mins) : 1
      const max = maxs.length ? Math.max(...maxs) : Math.max(min, 6)
      return {
        mode: 'DAY_ORDER_PATTERN',
        options: Array.from({ length: max - min + 1 }, (_, i) => ({ value: min + i, label: String(min + i) })),
      }
    }

    return {
      mode: 'DAY_ORDER_PATTERN',
      options: Array.from({ length: 6 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
    }
  }

  const resetScopeData = () => {
    setSlotMasters([])
    setClasses([])
    setCourseOfferings([])
    setCourseAllotments([])
    setFaculties([])
    setRoomClasses([])
    setSelectedClassId('')
    setSelectedTimetableId('')
    setEntries([])
    setVersionNo(0)
    setIsPublished(false)
    setConflicts([])
  }

  const loadScopeData = async () => {
    if (!scopeReady) return
    setLoadingScope(true)
    setConflicts([])
    try {
      const [ttRes, classRes, offerRes, allotRes, facultyRes, roomRes, patternRes] = await Promise.all([
        api.get('/api/setup/timetable', { params: scopeParams }),
        api.get('/api/setup/class-timetable/classes', { params: scopeParams }),
        api.get('/api/setup/course-offering', { params: scopeParams }),
        api.get('/api/setup/course-offering/allotment/details', { params: scopeParams }),
        api.get('/api/setup/faculty', {
          params: { institutionId: scope.institutionId, academicYearId: scope.academicYearId },
        }),
        api.get('/api/setup/class', {
          params: {
            institutionId: scope.institutionId,
            departmentId: scope.departmentId,
            programmeId: scope.programmeId,
          },
        }),
        api.get('/api/setup/academic-calendar-pattern'),
      ])

      const timetableRows = unwrapList(ttRes)
      setSlotMasters(timetableRows)
      setSelectedTimetableId((prev) =>
        timetableRows.some((x) => String(x.id) === String(prev)) ? prev : timetableRows[0]?.id || '',
      )
      setClasses(unwrapList(classRes))
      setCourseOfferings(unwrapList(offerRes))
      setCourseAllotments(unwrapList(allotRes))
      setFaculties(unwrapList(facultyRes))
      setRoomClasses(unwrapList(roomRes))

      const patterns = unwrapList(patternRes).filter(
        (x) => String(x?.academicYearId || '') === String(resolvedAcademicYearId),
      )
      const dayConfig = deriveDayConfig(patterns)
      setDayMode(dayConfig.mode)
      setDayOptions(dayConfig.options)

      if (!timetableRows.length) {
        showToast(
          'warning',
          ttRes?.data?.message || 'No Slot Master Timetable found for selected scope. Complete Timetable Setup first.',
        )
      }
      showToast('success', 'Scope loaded successfully')
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to load scope')
      resetScopeData()
    } finally {
      setLoadingScope(false)
    }
  }

  const loadClassTimetable = async (classId) => {
    if (!classId || !scopeReady) return
    setLoadingClass(true)
    try {
      const res = await api.get(`/api/setup/class-timetable/${classId}`, { params: scopeParams })
      const data = res?.data?.data || {}

      setSelectedTimetableId(data?.timetableId || '')
      setVersionNo(Number(data?.versionNo || 0))
      setIsPublished(!!data?.isPublished)
      setEntries(
        (Array.isArray(data?.entries) ? data.entries : []).map((e) =>
          createEntry({
            dayOfWeek:
              dayMode === 'DAY_ORDER_PATTERN'
                ? Number(e.dayOrder || e.dayOfWeek || 1)
                : Number(e.dayOfWeek || 1),
            timetableSlotId: e.timetableSlotId || '',
            periodType: e.periodType || 'THEORY',
            courseOfferingId: e.courseOfferingId || '',
            facultyId: e.facultyId || '',
            roomClassId: e.roomClassId || '',
            title: e.title || '',
            notes: e.notes || '',
          }),
        ),
      )
      setConflicts([])
    } catch (e) {
      setEntries([])
      setVersionNo(0)
      setIsPublished(false)
      showToast('danger', e?.response?.data?.error || 'Failed to load class timetable')
    } finally {
      setLoadingClass(false)
    }
  }

  const buildPayload = () => ({
    ...scopeParams,
    timetableId: selectedTimetableId,
    entries: entries.map((e) => ({
      dayOfWeek: Number(e.dayOfWeek),
      dayOrder: dayMode === 'DAY_ORDER_PATTERN' ? Number(e.dayOfWeek) : null,
      timetableSlotId: String(e.timetableSlotId || '').trim(),
      periodType: String(e.periodType || '').trim(),
      courseOfferingId: String(e.courseOfferingId || '').trim() || null,
      facultyId: String(e.facultyId || '').trim() || null,
      roomClassId: String(e.roomClassId || '').trim() || null,
      title: String(e.title || '').trim() || null,
      notes: String(e.notes || '').trim() || null,
    })),
  })

  const onValidate = async () => {
    if (!scopeReady || !selectedClassId || !selectedTimetableId) return
    setValidating(true)
    try {
      const res = await api.post(`/api/setup/class-timetable/${selectedClassId}/validate`, buildPayload())
      setConflicts(res?.data?.data?.conflicts || [])
      showToast((res?.data?.data?.conflictCount || 0) > 0 ? 'warning' : 'success', 'Validation completed')
    } catch (e) {
      setConflicts(e?.response?.data?.details?.conflicts || [])
      showToast('danger', e?.response?.data?.error || 'Validation failed')
    } finally {
      setValidating(false)
    }
  }

  const onSave = async () => {
    if (!scopeReady || !selectedClassId || !selectedTimetableId) return
    setSaving(true)
    try {
      const res = await api.post(`/api/setup/class-timetable/${selectedClassId}`, buildPayload())
      setVersionNo(Number(res?.data?.data?.versionNo || 0))
      setIsPublished(!!res?.data?.data?.isPublished)
      setConflicts([])
      showToast('success', res?.data?.message || 'Saved successfully')
      await loadScopeData()
      await loadClassTimetable(selectedClassId)
    } catch (e) {
      setConflicts(e?.response?.data?.details?.conflicts || [])
      showToast('danger', e?.response?.data?.error || 'Failed to save timetable')
    } finally {
      setSaving(false)
    }
  }

  const onPublishToggle = async () => {
    if (!scopeReady || !selectedClassId) return
    setPublishing(true)
    try {
      const endpoint = isPublished ? 'unpublish' : 'publish'
      await api.post(`/api/setup/class-timetable/${selectedClassId}/${endpoint}`, scopeParams)
      setIsPublished((prev) => !prev)
      showToast('success', isPublished ? 'Unpublished' : 'Published')
      await loadScopeData()
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to update publish status')
    } finally {
      setPublishing(false)
    }
  }

  const openEditor = (day, slotId) => {
    const existing = entryMap.get(buildCellKey(Number(day), String(slotId)))
    setEditorModel(existing ? { ...existing } : createEntry({ dayOfWeek: Number(day), timetableSlotId: String(slotId) }))
    setEditorOpen(true)
  }

  const saveEditor = () => {
    const model = { ...editorModel }
    if (model.periodType === 'BREAK') {
      model.courseOfferingId = ''
      model.facultyId = ''
      model.title = ''
    }
    if (model.periodType === 'ACTIVITY') model.courseOfferingId = ''

    const key = buildCellKey(Number(model.dayOfWeek), String(model.timetableSlotId))
    setEntries((prev) => [...prev.filter((x) => buildCellKey(Number(x.dayOfWeek), String(x.timetableSlotId)) !== key), model])
    setEditorOpen(false)
  }

  const clearEditorSlot = () => {
    const key = buildCellKey(Number(editorModel.dayOfWeek), String(editorModel.timetableSlotId))
    setEntries((prev) => prev.filter((x) => buildCellKey(Number(x.dayOfWeek), String(x.timetableSlotId)) !== key))
    setEditorOpen(false)
  }

  const onAutoGenerateDraft = () => {
    if (!selectedTimetableId || !slotColumns.length) {
      showToast('danger', 'Load Scope and choose Slot Master Timetable before auto generating')
      return
    }
    if (!selectedClassId) {
      showToast('danger', 'Select a class before auto generating timetable')
      return
    }

    const nonBreakSlots = slotColumns.filter((slot) => !isBreakSlot(slot))
    if (!nonBreakSlots.length || !dayOptions.length) {
      showToast('danger', 'No schedulable slots found in selected timetable')
      return
    }

    const plans = autoAllocationPlans
      .map((plan) => ({ ...plan }))
      .filter((plan) => Number(plan.hoursRemaining || 0) > 0)

    if (!plans.length) {
      showToast('warning', 'No course allotment hours found to generate automatic timetable draft')
      return
    }

    const generated = []
    const perDayCourseSet = new Map()
    const perDayLastCourse = new Map()
    const totalTarget = dayOptions.length * nonBreakSlots.length

    const sortPlans = () => {
      plans.sort((left, right) => {
        const diff = Number(right.hoursRemaining || 0) - Number(left.hoursRemaining || 0)
        if (diff !== 0) return diff
        return String(left.courseCode || left.courseTitle || '').localeCompare(String(right.courseCode || right.courseTitle || ''))
      })
    }

    sortPlans()

    for (const day of dayOptions) {
      const dayKey = Number(day.value)
      perDayCourseSet.set(dayKey, new Set())
      perDayLastCourse.set(dayKey, '')

      for (const slot of nonBreakSlots) {
        if (!plans.some((plan) => Number(plan.hoursRemaining || 0) > 0)) break

        sortPlans()
        const usedToday = perDayCourseSet.get(dayKey) || new Set()
        const lastCourseId = perDayLastCourse.get(dayKey) || ''

        let chosen =
          plans.find(
            (plan) =>
              Number(plan.hoursRemaining || 0) > 0 &&
              String(plan.courseId) !== String(lastCourseId) &&
              !usedToday.has(String(plan.courseId)),
          ) ||
          plans.find(
            (plan) => Number(plan.hoursRemaining || 0) > 0 && String(plan.courseId) !== String(lastCourseId),
          ) ||
          plans.find((plan) => Number(plan.hoursRemaining || 0) > 0) ||
          null

        if (!chosen) continue

        generated.push(
          createEntry({
            dayOfWeek: dayKey,
            timetableSlotId: String(slot.id),
            periodType: ['THEORY', 'LAB', 'ELECTIVE', 'ACTIVITY'].includes(chosen.periodType)
              ? chosen.periodType
              : 'THEORY',
            courseOfferingId: chosen.courseOfferingId,
            facultyId: chosen.facultyId,
            roomClassId: '',
            title: chosen.courseTitle || chosen.courseCode || '',
            notes: 'Auto-generated draft',
          }),
        )

        chosen.hoursRemaining = Number(chosen.hoursRemaining || 0) - 1
        usedToday.add(String(chosen.courseId))
        perDayLastCourse.set(dayKey, String(chosen.courseId))
      }
    }

    if (!generated.length) {
      showToast('warning', 'Unable to generate timetable draft from current course allocation data')
      return
    }

    setEntries(generated)
    setConflicts([])
    showToast(
      'success',
      `Automatic draft generated for ${generated.length} slot(s) out of ${totalTarget}. Review, validate, and save before publish.`,
    )
  }

  const getCellHoverText = (slotEntry) => {
    if (!slotEntry) return 'Not Scheduled'
    const offering = offeringById.get(String(slotEntry.courseOfferingId || ''))
    const courseName = offering?.course?.courseTitle || offering?.course?.courseCode || '-'
    const faculty = facultyById.get(String(slotEntry.facultyId || ''))
    const facultyName = faculty?.facultyName || '-'
    return `Course: ${courseName} | Faculty: ${facultyName}`
  }

  const getConflictLabel = (dayValue, slotId) => {
    const list = conflictMap.get(buildCellKey(Number(dayValue), String(slotId))) || []
    if (!list.length) return ''
    if (list.some((item) => String(item.type || '').toUpperCase().includes('FACULTY'))) return 'Faculty Conflict'
    if (list.some((item) => String(item.type || '').toUpperCase().includes('ROOM'))) return 'Room Conflict'
    return 'Conflict'
  }

  const getDayLabel = (dayValue) => {
    const found = dayOptions.find((item) => Number(item.value) === Number(dayValue))
    return found?.label || String(dayValue || '-')
  }

  const getSlotLabel = (slotId) => {
    const found = slotColumns.find((item) => String(item.id) === String(slotId))
    return found?.nomenclature || found?.shiftName || `Slot ${String(slotId || '-')}`
  }

  useEffect(() => {
    ;(async () => {
      try {
        setInstitutions(unwrapList(await api.get('/api/setup/institution')))
      } catch {
        setInstitutions([])
      }
    })()
  }, [])

  useEffect(() => {
    setScope((s) => ({
      ...s,
      departmentId: '',
      programmeId: '',
      regulationId: '',
      academicYearId: '',
      semesterCategory: '',
      batchId: '',
      semester: '',
    }))
    setDepartments([])
    setAcademicYears([])
    setBatches([])
    setProgrammes([])
    setRegulations([])
    setMappedSemesters([])
    resetScopeData()
    if (!scope.institutionId) return

    ;(async () => {
      const [d, y, b] = await Promise.all([
        api.get('/api/setup/department', { params: { institutionId: scope.institutionId } }),
        api.get('/api/setup/academic-year', {
          headers: { 'x-institution-id': scope.institutionId },
          params: { institutionId: scope.institutionId, view: 'annual' },
        }),
        api.get('/api/setup/batch', { params: { institutionId: scope.institutionId } }),
      ])
      setDepartments(unwrapList(d))
      const annualRows = unwrapList(y)
      setAcademicYears(
        annualRows.length
          ? dedupeAnnualAcademicYears(annualRows)
          : buildAnnualAcademicYears(
              unwrapList(
                await api.get('/api/setup/academic-year', {
                  headers: { 'x-institution-id': scope.institutionId },
                }),
              ),
            ),
      )
      setBatches(unwrapList(b))
    })().catch(() => {})
  }, [scope.institutionId])

  useEffect(() => {
    setScope((s) => ({ ...s, programmeId: '', regulationId: '', semesterCategory: '', semester: '' }))
    setProgrammes([])
    setRegulations([])
    setMappedSemesters([])
    resetScopeData()
    if (!scope.institutionId || !scope.departmentId) return

    api
      .get('/api/setup/programme')
      .then((res) => {
        const all = unwrapList(res)
        setProgrammes(
          all.filter(
            (p) =>
              String(p.institutionId) === String(scope.institutionId) &&
              String(p.departmentId) === String(scope.departmentId),
          ),
        )
      })
      .catch(() => setProgrammes([]))
  }, [scope.institutionId, scope.departmentId])

  useEffect(() => {
    setScope((s) => ({ ...s, regulationId: '', semesterCategory: '', semester: '' }))
    setRegulations([])
    setMappedSemesters([])
    resetScopeData()
    if (!scope.institutionId || !scope.programmeId) return

    api
      .get('/api/setup/regulation', {
        params: { institutionId: scope.institutionId, programmeId: scope.programmeId },
      })
      .then((res) => setRegulations(unwrapList(res)))
      .catch(() => setRegulations([]))
  }, [scope.institutionId, scope.programmeId])

  useEffect(() => {
    setScope((s) => ({ ...s, semesterCategory: '', semester: '' }))
    setMappedSemesters([])
    resetScopeData()
    if (
      !scope.institutionId ||
      !scope.departmentId ||
      !scope.programmeId ||
      !scope.regulationId ||
      !scope.academicYearId ||
      !scope.batchId
    ) {
      return
    }

    api
      .get('/api/setup/regulation-map', {
        params: {
          institutionId: scope.institutionId,
          departmentId: scope.departmentId,
          programmeId: scope.programmeId,
          regulationId: scope.regulationId,
          academicYearIds: [selectedAcademicYear?.oddAcademicYearId, selectedAcademicYear?.evenAcademicYearId].filter(Boolean).join(','),
          batchId: scope.batchId,
        },
      })
      .then((res) => {
        const semesters = [...new Set(unwrapList(res).map((x) => Number(x.semester)).filter(Number.isFinite))]
        setMappedSemesters(semesters.sort((a, b) => a - b))
      })
      .catch(() => setMappedSemesters([]))
  }, [
    scope.institutionId,
    scope.departmentId,
    scope.programmeId,
    scope.regulationId,
    scope.academicYearId,
    scope.batchId,
    selectedAcademicYear,
  ])

  useEffect(() => {
    if (!semesterCategoryOptions.includes(scope.semesterCategory)) {
      setScope((s) => ({ ...s, semesterCategory: '', semester: '' }))
    }
  }, [scope.semesterCategory, semesterCategoryOptions])

  useEffect(() => {
    if (scope.semester && !semesterOptions.includes(Number(scope.semester))) {
      setScope((s) => ({ ...s, semester: '' }))
    }
  }, [semesterOptions, scope.semester])

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>CLASS-WISE TIMETABLE</strong>
            <div className="d-flex gap-2">
              <ArpButton label={loadingScope ? 'Loading...' : 'Load Scope'} icon="search" color="info" onClick={loadScopeData} disabled={!scopeReady || loadingScope} />
              {timetableMode === TIMETABLE_MODES.MANUAL ? (
                <>
                  <ArpButton label={validating ? 'Validating...' : 'Validate'} icon="view" color="warning" onClick={onValidate} disabled={!selectedClassId || !selectedTimetableId || validating} />
                  <ArpButton label={saving ? 'Saving...' : 'Save'} icon="save" color="success" onClick={onSave} disabled={!selectedClassId || !selectedTimetableId || saving} />
                  <ArpButton
                    label={publishing ? 'Updating...' : isPublished ? 'Unpublish' : 'Publish'}
                    icon="send"
                    color={isPublished ? 'secondary' : 'primary'}
                    onClick={onPublishToggle}
                    disabled={!selectedClassId || publishing}
                  />
                </>
              ) : (
                <>
                  <ArpButton
                    label="Auto Generate Draft"
                    icon="add"
                    color="primary"
                    onClick={onAutoGenerateDraft}
                    disabled={!selectedClassId || !selectedTimetableId}
                  />
                  <ArpButton label={validating ? 'Validating...' : 'Validate'} icon="view" color="warning" onClick={onValidate} disabled={!selectedClassId || !selectedTimetableId || validating} />
                  <ArpButton label={saving ? 'Saving...' : 'Save'} icon="save" color="success" onClick={onSave} disabled={!selectedClassId || !selectedTimetableId || saving} />
                  <ArpButton
                    label={publishing ? 'Updating...' : isPublished ? 'Unpublish' : 'Publish'}
                    icon="send"
                    color={isPublished ? 'secondary' : 'primary'}
                    onClick={onPublishToggle}
                    disabled={!selectedClassId || publishing}
                  />
                </>
              )}
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}><CFormLabel>Institution</CFormLabel><CFormSelect value={scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, institutionId: e.target.value }))}><option value="">Select Institution</option>{institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Department</CFormLabel><CFormSelect value={scope.departmentId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, departmentId: e.target.value }))}><option value="">Select Department</option>{departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Programme</CFormLabel><CFormSelect value={scope.programmeId} disabled={!scope.departmentId} onChange={(e) => setScope((s) => ({ ...s, programmeId: e.target.value }))}><option value="">Select Programme</option>{programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode} - {x.programmeName}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Regulation</CFormLabel><CFormSelect value={scope.regulationId} disabled={!scope.programmeId} onChange={(e) => setScope((s) => ({ ...s, regulationId: e.target.value }))}><option value="">Select Regulation</option>{regulations.map((x) => <option key={x.id} value={x.id}>{x.regulationCode}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Academic Year</CFormLabel><CFormSelect value={scope.academicYearId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, academicYearId: e.target.value, semesterCategory: '', semester: '' }))}><option value="">Select Academic Year</option>{academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Admission Batch</CFormLabel><CFormSelect value={scope.batchId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, batchId: e.target.value }))}><option value="">Select Admission Batch</option>{batches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}</CFormSelect></CCol>
              <CCol md={3}>
                <CFormLabel>Semester Category</CFormLabel>
                <CFormSelect value={scope.semesterCategory} disabled={!scope.academicYearId} onChange={(e) => setScope((s) => ({ ...s, semesterCategory: e.target.value, semester: '' }))}>
                  <option value="">{scope.academicYearId ? 'Select Semester Category' : 'Select Academic Year'}</option>
                  {semesterCategoryOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Choose Semester</CFormLabel>
                <CFormSelect value={scope.semester} disabled={!scope.batchId || !scope.regulationId || !scope.academicYearId || !scope.semesterCategory} onChange={(e) => setScope((s) => ({ ...s, semester: e.target.value }))}>
                  <option value="">{scope.semesterCategory ? 'Select Semester' : 'Select Semester Category'}</option>
                  {semesterOptions.map((sem) => <option key={sem} value={String(sem)}>{sem}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Slot Master Timetable</CFormLabel>
                <CFormSelect value={selectedTimetableId} onChange={(e) => setSelectedTimetableId(e.target.value)} disabled={!slotMasters.length}>
                  <option value="">Select Timetable</option>
                  {slotMasters.map((x) => <option key={x.id} value={x.id}>{x.timetableName}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Timetable Mode</CFormLabel>
                <CFormSelect value={timetableMode} onChange={(e) => setTimetableMode(e.target.value)}>
                  <option value={TIMETABLE_MODES.MANUAL}>Manual Timetable</option>
                  <option value={TIMETABLE_MODES.AUTOMATIC}>Automatic Timetable</option>
                </CFormSelect>
              </CCol>
              <CCol md={9} className="d-flex align-items-end">
                <small className="text-muted">
                  Manual Timetable remains the default. Automatic Timetable is an optional institutional mode and should generate draft entries only before review and publish.
                </small>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Classes</strong></CCardHeader>
          <CCardBody>
            {loadingClass ? <div className="d-flex align-items-center gap-2"><CSpinner size="sm" /><span>Loading class timetable...</span></div> : null}
            <div className="d-flex gap-2 flex-wrap">
              {classes.map((c) => (
                <button
                  key={c.classId}
                  type="button"
                  className={`btn ${String(selectedClassId) === String(c.classId) ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={async () => {
                    setSelectedClassId(c.classId)
                    await loadClassTimetable(c.classId)
                  }}
                >
                  <div className="text-start">
                    <div>{c.className} {c.classLabel || ''}</div>
                    <small>{c.published ? 'Published' : 'Draft'} | Entries: {c.entriesCount || 0}</small>
                  </div>
                </button>
              ))}
            </div>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>{selectedClass ? `${selectedClass.className} ${selectedClass.classLabel || ''}` : 'Timetable Matrix'}</strong>
            <div className="d-flex gap-3">
              <span>Mode: {timetableMode === TIMETABLE_MODES.AUTOMATIC ? 'Automatic' : 'Manual'}</span>
              <span>Version: {versionNo}</span>
              <span>Status: {isPublished ? 'Published' : 'Draft'}</span>
            </div>
          </CCardHeader>
          <CCardBody>
            {timetableMode === TIMETABLE_MODES.AUTOMATIC ? (
              <CAlert color="info" className="mb-3">
                <strong>Automatic Timetable</strong>
                <div className="mt-2">
                  This optional mode is intended for institutions willing to use automatic draft generation. The existing manual timetable flow remains unchanged and is still the default mode.
                </div>
                <div className="mt-2">
                  Recommended flow: choose scope, load slot master, choose class, use <strong>Auto Generate Draft</strong>, review the generated entries, then validate and publish after confirmation.
                </div>
              </CAlert>
            ) : null}

            {!selectedClassId ? (
              <div className="text-medium-emphasis">Select a class to schedule.</div>
            ) : !selectedTimetableId || !slotColumns.length ? (
              <div className="text-medium-emphasis">Select Slot Master Timetable (available after Load Scope).</div>
            ) : (
              <div className="table-responsive" style={{ minHeight: '65vh' }}>
                <table className="table table-bordered align-middle text-center">
                  <thead>
                    <tr>
                      <th style={{ width: 90, minWidth: 90 }}>Day Order / Time</th>
                      {slotColumns.map((slot) => {
                        const breakCol = isBreakSlot(slot)
                        const shortName = breakCol
                          ? 'Break'
                          : String(slot?.nomenclature || slot?.shiftName || `H${slot?.priority || ''}`)
                        const timeText = `${slot?.timeFrom || ''} - ${slot?.timeTo || ''}`.trim()
                        return (
                          <th
                            key={slot.id}
                            style={{
                              width: breakCol ? 60 : 110,
                              minWidth: breakCol ? 60 : 110,
                              backgroundColor: breakCol ? '#fff3cd' : undefined,
                              borderColor: breakCol ? '#f1d58a' : undefined,
                            }}
                          >
                            <div>{shortName}</div>
                            <small className="text-medium-emphasis">{timeText}</small>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {dayOptions.map((day) => (
                      <tr key={day.value}>
                        <th style={{ width: 90, minWidth: 90 }}>{day.value}</th>
                        {slotColumns.map((slot) => {
                          if (isBreakSlot(slot)) {
                            return (
                              <td
                                key={slot.id}
                                style={{
                                  width: 60,
                                  minWidth: 60,
                                  backgroundColor: '#fff3cd',
                                  borderColor: '#f1d58a',
                                  fontWeight: 600,
                                }}
                              >
                                Break
                              </td>
                            )
                          }

                          const slotEntry = entryMap.get(buildCellKey(Number(day.value), String(slot.id)))
                          const scheduled = !!slotEntry
                          const cellConflicts = conflictMap.get(buildCellKey(Number(day.value), String(slot.id))) || []
                          const hasConflict = cellConflicts.length > 0
                          const titleText = slotEntry?.title || (slotEntry?.periodType === 'BREAK' ? 'Break' : 'Scheduled')

                          return (
                            <td
                              key={slot.id}
                              style={{
                                backgroundColor: hasConflict ? '#fdeaea' : scheduled ? '#eaf2fb' : '#ffffff',
                                borderColor: hasConflict ? '#e08b8b' : scheduled ? '#b9d0ea' : undefined,
                                boxShadow: hasConflict ? 'inset 0 0 0 2px #dc3545' : undefined,
                              }}
                            >
                              <button
                                type="button"
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={() => openEditor(day.value, slot.id)}
                                title={
                                  hasConflict
                                    ? `${getConflictLabel(day.value, slot.id)} | ${cellConflicts.map((item) => item.message || item.type || 'Conflict').join(' ; ')}`
                                    : getCellHoverText(slotEntry)
                                }
                              >
                                <div className="d-flex flex-column align-items-center">
                                  <CIcon icon={scheduled ? cilCheckCircle : cilXCircle} size="xl" className={hasConflict ? 'text-danger' : scheduled ? 'text-success' : 'text-medium-emphasis'} />
                                  {hasConflict ? (
                                    <small className="mt-1 fw-semibold text-danger">{getConflictLabel(day.value, slot.id)}</small>
                                  ) : null}
                                  <small className="mt-1 fw-semibold">{scheduled ? titleText : 'Not Scheduled'}</small>
                                </div>
                              </button>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CCardBody>
        </CCard>

        {conflicts.length ? (
          <CAlert color="warning" className="mt-3">
            <strong>Conflicts ({conflicts.length})</strong>
            <ul className="mb-0">
              {conflicts.map((c, i) => (
                <li key={i}>
                  [{c.type}] {c.message || 'Conflict'}
                  {c?.dayOfWeek || c?.timetableSlotId
                    ? ` - Day ${getDayLabel(c.dayOfWeek)} / ${getSlotLabel(c.timetableSlotId)}`
                    : ''}
                </li>
              ))}
            </ul>
          </CAlert>
        ) : null}
      </CCol>

      <CModal visible={editorOpen} onClose={() => setEditorOpen(false)} size="lg" alignment="center">
        <CModalHeader><CModalTitle>Allocate Slot</CModalTitle></CModalHeader>
        <CModalBody>
          <CRow className="g-3">
            <CCol md={4}><CFormLabel>Course Type</CFormLabel><CFormSelect value={editorModel.periodType} onChange={(e) => setEditorModel((m) => ({ ...m, periodType: e.target.value, courseOfferingId: e.target.value === 'ACTIVITY' || e.target.value === 'BREAK' ? '' : m.courseOfferingId, facultyId: e.target.value === 'BREAK' ? '' : m.facultyId }))}>{periodTypes.map((p) => <option key={p} value={p}>{p}</option>)}</CFormSelect></CCol>
            <CCol md={8}>
              <CFormLabel>{editorModel.periodType === 'ACTIVITY' ? 'Activity Name' : 'Course'}</CFormLabel>
              {editorModel.periodType === 'ACTIVITY' ? (
                <CFormInput value={editorModel.title} onChange={(e) => setEditorModel((m) => ({ ...m, title: e.target.value }))} placeholder="Library / Sports / Activity" />
              ) : (
                <CFormSelect value={editorModel.courseOfferingId} disabled={editorModel.periodType === 'BREAK'} onChange={(e) => setEditorModel((m) => ({ ...m, courseOfferingId: e.target.value, facultyId: '' }))}>
                  <option value="">Select Course</option>
                  {courseOfferings.map((c) => <option key={c.id} value={c.id}>{c.course?.courseCode || ''} - {c.course?.courseTitle || ''}</option>)}
                </CFormSelect>
              )}
            </CCol>
            <CCol md={6}><CFormLabel>Faculty</CFormLabel><CFormSelect value={editorModel.facultyId} disabled={editorModel.periodType === 'BREAK' || (editorModel.periodType !== 'ACTIVITY' && !editorModel.courseOfferingId)} onChange={(e) => setEditorModel((m) => ({ ...m, facultyId: e.target.value }))}><option value="">Select Faculty</option>{editorFacultyOptions.map((f) => <option key={f.id} value={f.id}>{f.facultyCode || ''} - {f.facultyName || ''}</option>)}</CFormSelect></CCol>
            <CCol md={6}><CFormLabel>Room</CFormLabel><CFormSelect value={editorModel.roomClassId} onChange={(e) => setEditorModel((m) => ({ ...m, roomClassId: e.target.value }))}><option value="">Select Room</option>{roomClasses.map((r) => <option key={r.id} value={r.id}>{r.className} {r.classLabel || ''} ({r.roomNumber || '-'})</option>)}</CFormSelect></CCol>
            <CCol md={6}><CFormLabel>Display Title</CFormLabel><CFormInput value={editorModel.title} disabled={editorModel.periodType === 'ACTIVITY'} onChange={(e) => setEditorModel((m) => ({ ...m, title: e.target.value }))} /></CCol>
            <CCol md={6}><CFormLabel>Notes</CFormLabel><CFormInput value={editorModel.notes} onChange={(e) => setEditorModel((m) => ({ ...m, notes: e.target.value }))} /></CCol>
          </CRow>
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between">
          <ArpButton label="Not Scheduled" color="danger" onClick={clearEditorSlot} />
          <div className="d-flex gap-2">
            <ArpButton label="Cancel" color="secondary" onClick={() => setEditorOpen(false)} />
            <ArpButton label="Save Slot" color="primary" onClick={saveEditor} />
          </div>
        </CModalFooter>
      </CModal>
    </CRow>
  )
}
