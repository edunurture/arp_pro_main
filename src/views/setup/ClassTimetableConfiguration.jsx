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
  CRow,
  CSpinner,
} from '@coreui/react-pro'
import { ArpButton } from '../../components/common'
import api from '../../services/apiClient'

const initialScope = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
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

export default function ClassTimetableConfiguration() {
  const [scope, setScope] = useState(initialScope)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
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
  const [entries, setEntries] = useState([createEntry()])
  const [isPublished, setIsPublished] = useState(false)
  const [versionNo, setVersionNo] = useState(0)
  const [conflicts, setConflicts] = useState([])
  const [dayMode, setDayMode] = useState('DAY_PATTERN')
  const [dayOptions, setDayOptions] = useState(defaultDayOptions)

  const scopeReady = useMemo(
    () =>
      Boolean(
        scope.institutionId &&
          scope.departmentId &&
          scope.programmeId &&
          scope.regulationId &&
          scope.academicYearId &&
          scope.batchId &&
          scope.semester,
      ),
    [scope],
  )

  const scopeParams = useMemo(
    () => ({
      institutionId: scope.institutionId,
      departmentId: scope.departmentId,
      programmeId: scope.programmeId,
      regulationId: scope.regulationId,
      academicYearId: scope.academicYearId,
      batchId: scope.batchId,
      semester: scope.semester,
    }),
    [scope],
  )

  const selectedClass = useMemo(
    () => classes.find((x) => String(x.classId) === String(selectedClassId)) || null,
    [classes, selectedClassId],
  )

  const slotOptions = useMemo(() => {
    const row = slotMasters.find((x) => String(x.id) === String(selectedTimetableId))
    return (row?.slots || []).map((s) => ({
      value: s.id,
      label: `P${s.priority} | ${s.timeFrom}-${s.timeTo} | ${s.shiftName}`,
    }))
  }, [slotMasters, selectedTimetableId])

  const facultyById = useMemo(
    () => new Map(faculties.map((f) => [String(f.id), f])),
    [faculties],
  )

  const allottedFacultyByOffering = useMemo(() => {
    const byCourseId = new Map()
    courseAllotments.forEach((row) => {
      const courseId = String(row?.courseId || '')
      const facultyId = String(row?.facultyId || '')
      if (!courseId || !facultyId) return
      if (!byCourseId.has(courseId)) byCourseId.set(courseId, new Map())
      const bucket = byCourseId.get(courseId)
      if (!bucket.has(facultyId)) {
        bucket.set(facultyId, {
          id: row.facultyId,
          facultyCode: row.facultyCode || '',
          facultyName: row.facultyName || '',
        })
      }
    })

    const byOffering = new Map()
    courseOfferings.forEach((off) => {
      const offeringId = String(off?.id || '')
      const courseId = String(off?.courseId || '')
      if (!offeringId || !courseId) return
      const values = byCourseId.has(courseId) ? Array.from(byCourseId.get(courseId).values()) : []
      byOffering.set(offeringId, values)
    })
    return byOffering
  }, [courseAllotments, courseOfferings])

  const dayLabel = useMemo(() => (dayMode === 'DAY_ORDER_PATTERN' ? 'Day Order' : 'Day'), [dayMode])

  const showMessage = (type, text) => setMessage({ type, text })

  const clearEditor = () => {
    setEntries([createEntry()])
    setIsPublished(false)
    setVersionNo(0)
    setConflicts([])
  }

  const parseDayList = (text) =>
    String(text || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)

  const normalizePattern = (value) =>
    String(value || '')
      .toUpperCase()
      .replace(/[\s-]+/g, '_')
      .trim()

  const deriveDayConfig = (rows = []) => {
    const list = Array.isArray(rows) ? rows : []
    const active = list.filter((x) => x && x.isActive !== false)

    const dayPatternRows = active.filter((x) => normalizePattern(x?.calendarPattern).includes('DAY_PATTERN'))
    if (dayPatternRows.length) {
      const dayNames = [
        ...new Set(
          dayPatternRows
            .flatMap((x) => parseDayList(x?.day))
            .map((x) => x.replace(/\s+/g, ' ').trim())
            .filter(Boolean),
        ),
      ]
      if (dayNames.length) {
        return {
          mode: 'DAY_PATTERN',
          options: dayNames.map((d, idx) => ({ value: idx + 1, label: d })),
        }
      }
      return { mode: 'DAY_PATTERN', options: defaultDayOptions }
    }

    const dayOrderRows = active.filter((x) => normalizePattern(x?.calendarPattern).includes('DAY_ORDER'))
    if (dayOrderRows.length) {
      const mins = dayOrderRows.map((x) => Number(x?.minimumDayOrder)).filter((n) => Number.isFinite(n))
      const maxs = dayOrderRows.map((x) => Number(x?.maxDayOrder)).filter((n) => Number.isFinite(n))
      const min = mins.length ? Math.min(...mins) : 1
      const max = maxs.length ? Math.max(...maxs) : Math.max(min, 6)
      const safeMin = Math.max(1, min)
      const safeMax = Math.max(safeMin, max)
      const options = Array.from({ length: safeMax - safeMin + 1 }, (_, i) => safeMin + i).map((n) => ({
        value: n,
        label: String(n),
      }))
      return { mode: 'DAY_ORDER_PATTERN', options }
    }

    return {
      mode: 'DAY_ORDER_PATTERN',
      options: Array.from({ length: 6 }, (_, i) => i + 1).map((n) => ({
        value: n,
        label: String(n),
      })),
    }
  }

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/api/setup/institution')
      setInstitutions(unwrapList(res))
    } catch {
      setInstitutions([])
      showMessage('danger', 'Failed to load institutions')
    }
  }

  const loadDepartments = async (institutionId) => {
    try {
      const res = await api.get('/api/setup/department', { params: { institutionId } })
      setDepartments(unwrapList(res))
    } catch {
      setDepartments([])
    }
  }

  const loadProgrammes = async (institutionId, departmentId) => {
    try {
      const res = await api.get('/api/setup/programme')
      const all = unwrapList(res)
      setProgrammes(
        all.filter(
          (p) =>
            String(p.institutionId) === String(institutionId) &&
            String(p.departmentId) === String(departmentId),
        ),
      )
    } catch {
      setProgrammes([])
    }
  }

  const loadRegulations = async (institutionId, programmeId) => {
    try {
      const res = await api.get('/api/setup/regulation', { params: { institutionId, programmeId } })
      setRegulations(unwrapList(res))
    } catch {
      setRegulations([])
    }
  }

  const loadAcademicYears = async (institutionId) => {
    try {
      const res = await api.get('/api/setup/academic-year', {
        headers: { 'x-institution-id': institutionId },
      })
      setAcademicYears(unwrapList(res))
    } catch {
      setAcademicYears([])
    }
  }

  const loadBatches = async (institutionId) => {
    try {
      const res = await api.get('/api/setup/batch', { params: { institutionId } })
      setBatches(unwrapList(res))
    } catch {
      setBatches([])
    }
  }

  const loadMappedSemesters = async (params) => {
    try {
      const res = await api.get('/api/setup/regulation-map', { params })
      const maps = unwrapList(res).filter((m) => String(m?.status || '').toLowerCase() === 'map done')
      const sems = [...new Set(maps.map((m) => Number(m?.semester)).filter((n) => Number.isFinite(n)))].sort(
        (a, b) => a - b,
      )
      setMappedSemesters(sems)
    } catch {
      setMappedSemesters([])
    }
  }

  const loadScopeData = async () => {
    if (!scopeReady) return
    setLoading(true)
    setConflicts([])
    try {
      const [ttRes, classRes, offerRes, allotRes, facultyRes, roomRes, calPatternRes] = await Promise.all([
        api.get('/api/setup/timetable', { params: scopeParams }),
        api.get('/api/setup/class-timetable/classes', { params: scopeParams }),
        api.get('/api/setup/course-offering', { params: scopeParams }),
        api.get('/api/setup/course-offering/allotment/details', { params: scopeParams }),
        api.get('/api/setup/faculty', {
          params: {
            institutionId: scope.institutionId,
            departmentId: scope.departmentId,
            academicYearId: scope.academicYearId,
          },
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

      const tts = unwrapList(ttRes)
      setSlotMasters(tts)
      if (!selectedTimetableId && tts.length) setSelectedTimetableId(tts[0].id)

      setClasses(unwrapList(classRes))
      setCourseOfferings(unwrapList(offerRes))
      setCourseAllotments(unwrapList(allotRes))
      setFaculties(unwrapList(facultyRes))
      setRoomClasses(unwrapList(roomRes))
      const allPatterns = unwrapList(calPatternRes)
      const patterns = allPatterns.filter((x) => String(x?.academicYearId || '') === String(scope.academicYearId))
      const usingFallback = patterns.length === 0
      const config = deriveDayConfig(usingFallback ? allPatterns : patterns)
      setDayMode(config.mode)
      setDayOptions(config.options)
      setEntries((prev) => {
        const first = config.options?.[0]?.value || 1
        return prev.map((x) => ({ ...x, dayOfWeek: Number(x.dayOfWeek || first) }))
      })
      if (usingFallback) {
        showMessage(
          'warning',
          'No Calendar Pattern found for selected Academic Year. Loaded fallback Day Order from available configuration.',
        )
      } else {
        showMessage('success', 'Class-wise timetable scope loaded')
      }
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to load scope data')
      setSlotMasters([])
      setClasses([])
      setCourseOfferings([])
      setCourseAllotments([])
      setFaculties([])
      setRoomClasses([])
      setDayMode('DAY_PATTERN')
      setDayOptions(defaultDayOptions)
    } finally {
      setLoading(false)
    }
  }

  const loadClassTimetable = async (classId) => {
    if (!classId || !scopeReady) return
    try {
      const res = await api.get(`/api/setup/class-timetable/${classId}`, { params: scopeParams })
      const data = res?.data?.data || null
      if (!data) return clearEditor()

      setSelectedTimetableId(data.timetableId || selectedTimetableId || '')
      setVersionNo(Number(data.versionNo || 0))
      setIsPublished(!!data.isPublished)
      const list = Array.isArray(data.entries) ? data.entries : []
      setEntries(
        list.length
          ? list.map((e) =>
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
            )
          : [createEntry()],
      )
      setConflicts([])
    } catch (e) {
      clearEditor()
      showMessage('danger', e?.response?.data?.error || 'Failed to load selected class timetable')
    }
  }

  useEffect(() => {
    loadInstitutions()
  }, [])

  useEffect(() => {
    setScope((s) => ({
      ...s,
      departmentId: '',
      programmeId: '',
      regulationId: '',
      academicYearId: '',
      batchId: '',
      semester: '',
    }))
    setDepartments([])
    setProgrammes([])
    setRegulations([])
    setAcademicYears([])
    setBatches([])
    setMappedSemesters([])
    setSelectedClassId('')
    setSelectedTimetableId('')
    clearEditor()
    if (!scope.institutionId) return
    loadDepartments(scope.institutionId)
    loadAcademicYears(scope.institutionId)
    loadBatches(scope.institutionId)
  }, [scope.institutionId])

  useEffect(() => {
    setScope((s) => ({ ...s, programmeId: '', regulationId: '', semester: '' }))
    setProgrammes([])
    setRegulations([])
    setMappedSemesters([])
    setSelectedClassId('')
    clearEditor()
    if (!scope.institutionId || !scope.departmentId) return
    loadProgrammes(scope.institutionId, scope.departmentId)
  }, [scope.departmentId])

  useEffect(() => {
    setScope((s) => ({ ...s, regulationId: '', semester: '' }))
    setRegulations([])
    setMappedSemesters([])
    setSelectedClassId('')
    clearEditor()
    if (!scope.institutionId || !scope.programmeId) return
    loadRegulations(scope.institutionId, scope.programmeId)
  }, [scope.programmeId])

  useEffect(() => {
    setScope((s) => ({ ...s, semester: '' }))
    setMappedSemesters([])
    setSelectedClassId('')
    clearEditor()
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
    loadMappedSemesters({
      institutionId: scope.institutionId,
      departmentId: scope.departmentId,
      programmeId: scope.programmeId,
      regulationId: scope.regulationId,
      academicYearId: scope.academicYearId,
      batchId: scope.batchId,
    })
  }, [
    scope.institutionId,
    scope.departmentId,
    scope.programmeId,
    scope.regulationId,
    scope.academicYearId,
    scope.batchId,
  ])

  const onSelectClass = async (classId) => {
    setSelectedClassId(classId)
    await loadClassTimetable(classId)
  }

  const updateEntry = (idx, key, value) => {
    setEntries((prev) => {
      const next = [...prev]
      const current = { ...next[idx], [key]: value }

      if (key === 'periodType' && value === 'BREAK') {
        current.courseOfferingId = ''
        current.facultyId = ''
      }

      if (key === 'courseOfferingId') {
        const allowed = allottedFacultyByOffering.get(String(value || '')) || []
        const allowedSet = new Set(allowed.map((f) => String(f.id)))
        if (!allowedSet.has(String(current.facultyId || ''))) {
          current.facultyId = ''
        }
      }

      next[idx] = current
      return next
    })
  }

  const facultyOptionsForEntry = (entry) => {
    if (entry.periodType === 'BREAK') return []
    const selectedId = String(entry.facultyId || '')
    const fromAllotment = allottedFacultyByOffering.get(String(entry.courseOfferingId || '')) || []
    const options = fromAllotment.map((f) => ({
      id: f.id,
      facultyCode: f.facultyCode || '',
      facultyName: f.facultyName || '',
    }))

    if (selectedId && !options.some((x) => String(x.id) === selectedId)) {
      const selected = facultyById.get(selectedId)
      if (selected) {
        options.push({
          id: selected.id,
          facultyCode: selected.facultyCode || '',
          facultyName: `${selected.facultyName || ''} (Replacement)`,
        })
      }
    }
    return options
  }

  const addEntry = () => setEntries((prev) => [...prev, createEntry()])
  const removeEntry = (idx) =>
    setEntries((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))

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
    if (!scopeReady || !selectedClassId) return showMessage('danger', 'Select scope and class first')
    if (!selectedTimetableId) return showMessage('danger', 'Select timetable (slot master) first')
    setValidating(true)
    try {
      const res = await api.post(`/api/setup/class-timetable/${selectedClassId}/validate`, buildPayload())
      setConflicts(res?.data?.data?.conflicts || [])
      if ((res?.data?.data?.conflictCount || 0) > 0) {
        showMessage('warning', 'Validation completed with conflicts')
      } else {
        showMessage('success', 'Validation passed')
      }
    } catch (e) {
      const c = e?.response?.data?.details?.conflicts || []
      setConflicts(c)
      showMessage('danger', e?.response?.data?.error || 'Validation failed')
    } finally {
      setValidating(false)
    }
  }

  const onSave = async () => {
    if (!scopeReady || !selectedClassId) return showMessage('danger', 'Select scope and class first')
    if (!selectedTimetableId) return showMessage('danger', 'Select timetable (slot master) first')
    setSaving(true)
    try {
      const res = await api.post(`/api/setup/class-timetable/${selectedClassId}`, buildPayload())
      setVersionNo(Number(res?.data?.data?.versionNo || versionNo))
      setIsPublished(!!res?.data?.data?.isPublished)
      setConflicts([])
      showMessage('success', res?.data?.message || 'Class timetable saved')
      await loadScopeData()
    } catch (e) {
      const c = e?.response?.data?.details?.conflicts || []
      setConflicts(c)
      showMessage('danger', e?.response?.data?.error || 'Failed to save class timetable')
    } finally {
      setSaving(false)
    }
  }

  const onPublishToggle = async (nextPublished) => {
    if (!scopeReady || !selectedClassId) return showMessage('danger', 'Select class first')
    setPublishing(true)
    try {
      const endpoint = nextPublished ? 'publish' : 'unpublish'
      await api.post(`/api/setup/class-timetable/${selectedClassId}/${endpoint}`, scopeParams)
      setIsPublished(nextPublished)
      showMessage('success', nextPublished ? 'Class timetable published' : 'Class timetable unpublished')
      await loadScopeData()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to update publish status')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>CLASS-WISE TIMETABLE</strong>
            <div className="d-flex gap-2">
              <ArpButton label={loading ? 'Loading...' : 'Load Scope'} icon="search" color="info" onClick={loadScopeData} disabled={!scopeReady || loading} />
              <ArpButton label={validating ? 'Validating...' : 'Validate'} icon="view" color="warning" onClick={onValidate} disabled={!scopeReady || !selectedClassId || validating} />
              <ArpButton label={saving ? 'Saving...' : 'Save'} icon="save" color="success" onClick={onSave} disabled={!scopeReady || !selectedClassId || saving} />
              <ArpButton
                label={publishing ? 'Updating...' : isPublished ? 'Unpublish' : 'Publish'}
                icon="send"
                color={isPublished ? 'secondary' : 'primary'}
                onClick={() => onPublishToggle(!isPublished)}
                disabled={!scopeReady || !selectedClassId || publishing}
              />
            </div>
          </CCardHeader>
          <CCardBody>
            {message ? <CAlert color={message.type}>{message.text}</CAlert> : null}
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel>Institution</CFormLabel>
                <CFormSelect value={scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, institutionId: e.target.value }))}>
                  <option value="">Select Institution</option>
                  {institutions.map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Department</CFormLabel>
                <CFormSelect value={scope.departmentId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, departmentId: e.target.value }))}>
                  <option value="">Select Department</option>
                  {departments.map((x) => (
                    <option key={x.id} value={x.id}>{x.departmentName}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Programme</CFormLabel>
                <CFormSelect value={scope.programmeId} disabled={!scope.departmentId} onChange={(e) => setScope((s) => ({ ...s, programmeId: e.target.value }))}>
                  <option value="">Select Programme</option>
                  {programmes.map((x) => (
                    <option key={x.id} value={x.id}>{x.programmeCode} - {x.programmeName}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Regulation</CFormLabel>
                <CFormSelect value={scope.regulationId} disabled={!scope.programmeId} onChange={(e) => setScope((s) => ({ ...s, regulationId: e.target.value }))}>
                  <option value="">Select Regulation</option>
                  {regulations.map((x) => (
                    <option key={x.id} value={x.id}>{x.regulationCode}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Academic Year</CFormLabel>
                <CFormSelect value={scope.academicYearId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, academicYearId: e.target.value }))}>
                  <option value="">Select Academic Year</option>
                  {academicYears.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.academicYearLabel || `${x.academicYear}${x.semesterCategory ? ` (${x.semesterCategory})` : ''}`}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Batch</CFormLabel>
                <CFormSelect value={scope.batchId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, batchId: e.target.value }))}>
                  <option value="">Select Batch</option>
                  {batches.map((x) => (
                    <option key={x.id} value={x.id}>{x.batchName}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Semester</CFormLabel>
                <CFormSelect value={scope.semester} disabled={!scope.batchId || !scope.regulationId || !scope.academicYearId} onChange={(e) => setScope((s) => ({ ...s, semester: e.target.value }))}>
                  <option value="">Select Semester</option>
                  {mappedSemesters.map((sem) => (
                    <option key={sem} value={String(sem)}>{sem}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Slot Master Timetable</CFormLabel>
                <CFormSelect value={selectedTimetableId} disabled={!slotMasters.length} onChange={(e) => setSelectedTimetableId(e.target.value)}>
                  <option value="">Select Timetable</option>
                  {slotMasters.map((x) => (
                    <option key={x.id} value={x.id}>{x.timetableName}</option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CRow className="g-3">
          <CCol md={4}>
            <CCard className="mb-3">
              <CCardHeader>
                <strong>Classes</strong>
              </CCardHeader>
              <CCardBody style={{ maxHeight: 540, overflow: 'auto' }}>
                {loading ? (
                  <div className="d-flex align-items-center gap-2">
                    <CSpinner size="sm" />
                    <span>Loading classes...</span>
                  </div>
                ) : classes.length ? (
                  <div className="list-group">
                    {classes.map((c) => (
                      <button
                        key={c.classId}
                        type="button"
                        className={`list-group-item list-group-item-action ${String(selectedClassId) === String(c.classId) ? 'active' : ''}`}
                        onClick={() => onSelectClass(c.classId)}
                      >
                        <div className="d-flex justify-content-between">
                          <strong>{c.className} {c.classLabel || ''}</strong>
                          <span>{c.published ? 'Published' : 'Draft'}</span>
                        </div>
                        <small>Entries: {c.entriesCount || 0}</small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-medium-emphasis">No classes available for selected scope.</div>
                )}
              </CCardBody>
            </CCard>
          </CCol>

          <CCol md={8}>
            <CCard className="mb-3">
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <strong>
                  {selectedClass ? `Editor: ${selectedClass.className} ${selectedClass.classLabel || ''}` : 'Editor'}
                </strong>
                <div className="d-flex gap-3">
                  <span>Version: {versionNo}</span>
                  <span>Status: {isPublished ? 'Published' : 'Draft'}</span>
                </div>
              </CCardHeader>
              <CCardBody>
                {!selectedClassId ? (
                  <div className="text-medium-emphasis">Select a class to edit timetable.</div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-bordered align-middle">
                        <thead>
                          <tr>
                            <th style={{ width: 64 }}>#</th>
                            <th style={{ width: 120 }}>{dayLabel}</th>
                            <th style={{ minWidth: 220 }}>Slot</th>
                            <th style={{ width: 130 }}>Type</th>
                            <th style={{ minWidth: 220 }}>Course</th>
                            <th style={{ minWidth: 200 }}>Faculty</th>
                            <th style={{ minWidth: 180 }}>Room</th>
                            <th style={{ minWidth: 160 }}>Title</th>
                            <th style={{ minWidth: 160 }}>Notes</th>
                            <th style={{ width: 90 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((e, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td>
                                <CFormSelect value={String(e.dayOfWeek)} onChange={(ev) => updateEntry(idx, 'dayOfWeek', Number(ev.target.value))}>
                                  {dayOptions.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                  ))}
                                </CFormSelect>
                              </td>
                              <td>
                                <CFormSelect value={e.timetableSlotId} onChange={(ev) => updateEntry(idx, 'timetableSlotId', ev.target.value)}>
                                  <option value="">Select Slot</option>
                                  {slotOptions.map((s) => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                  ))}
                                </CFormSelect>
                              </td>
                              <td>
                                <CFormSelect value={e.periodType} onChange={(ev) => updateEntry(idx, 'periodType', ev.target.value)}>
                                  {periodTypes.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                  ))}
                                </CFormSelect>
                              </td>
                              <td>
                                <CFormSelect value={e.courseOfferingId} disabled={e.periodType === 'BREAK'} onChange={(ev) => updateEntry(idx, 'courseOfferingId', ev.target.value)}>
                                  <option value="">Select Course</option>
                                  {courseOfferings.map((c) => (
                                    <option key={c.id} value={c.id}>{c.course?.courseCode || ''} - {c.course?.courseTitle || ''}</option>
                                  ))}
                                </CFormSelect>
                              </td>
                              <td>
                                <CFormSelect
                                  value={e.facultyId}
                                  disabled={e.periodType === 'BREAK' || !e.courseOfferingId}
                                  onChange={(ev) => updateEntry(idx, 'facultyId', ev.target.value)}
                                >
                                  <option value="">Select Faculty</option>
                                  {facultyOptionsForEntry(e).map((f) => (
                                    <option key={f.id} value={f.id}>{f.facultyCode} - {f.facultyName}</option>
                                  ))}
                                </CFormSelect>
                              </td>
                              <td>
                                <CFormSelect value={e.roomClassId} onChange={(ev) => updateEntry(idx, 'roomClassId', ev.target.value)}>
                                  <option value="">Select Room</option>
                                  {roomClasses.map((r) => (
                                    <option key={r.id} value={r.id}>{r.className} {r.classLabel || ''} ({r.roomNumber || '-'})</option>
                                  ))}
                                </CFormSelect>
                              </td>
                              <td>
                                <CFormInput value={e.title} onChange={(ev) => updateEntry(idx, 'title', ev.target.value)} />
                              </td>
                              <td>
                                <CFormInput value={e.notes} onChange={(ev) => updateEntry(idx, 'notes', ev.target.value)} />
                              </td>
                              <td>
                                <ArpButton label="Del" color="danger" onClick={() => removeEntry(idx)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <ArpButton label="Add Entry" icon="add" color="secondary" onClick={addEntry} />
                  </>
                )}
              </CCardBody>
            </CCard>

            {conflicts.length ? (
              <CAlert color="warning">
                <strong>Conflicts ({conflicts.length})</strong>
                <ul className="mb-0">
                  {conflicts.map((c, idx) => (
                    <li key={idx}>
                      [{c.type}] {c.message || 'Conflict'}
                    </li>
                  ))}
                </ul>
              </CAlert>
            ) : null}
          </CCol>
        </CRow>
      </CCol>
    </CRow>
  )
}
