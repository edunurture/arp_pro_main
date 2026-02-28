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

export default function ClassTimetableConfiguration() {
  const [scope, setScope] = useState(initialScope)
  const [message, setMessage] = useState(null)
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

  const showMessage = (type, text) => setMessage({ type, text })

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

  const scopeParams = useMemo(() => ({ ...scope }), [scope])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(scope.academicYearId)) || null,
    [academicYears, scope.academicYearId],
  )

  const semesterOptions = useMemo(() => {
    const category = String(selectedAcademicYear?.semesterCategory || '').toUpperCase().trim()
    if (category === 'ODD') return mappedSemesters.filter((n) => Number(n) % 2 === 1)
    if (category === 'EVEN') return mappedSemesters.filter((n) => Number(n) % 2 === 0)
    return mappedSemesters
  }, [mappedSemesters, selectedAcademicYear])

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

      setSlotMasters(unwrapList(ttRes))
      setClasses(unwrapList(classRes))
      setCourseOfferings(unwrapList(offerRes))
      setCourseAllotments(unwrapList(allotRes))
      setFaculties(unwrapList(facultyRes))
      setRoomClasses(unwrapList(roomRes))

      const patterns = unwrapList(patternRes).filter(
        (x) => String(x?.academicYearId || '') === String(scope.academicYearId),
      )
      const dayConfig = deriveDayConfig(patterns)
      setDayMode(dayConfig.mode)
      setDayOptions(dayConfig.options)

      showMessage('success', 'Scope loaded successfully')
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to load scope')
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
      showMessage('danger', e?.response?.data?.error || 'Failed to load class timetable')
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
      showMessage((res?.data?.data?.conflictCount || 0) > 0 ? 'warning' : 'success', 'Validation completed')
    } catch (e) {
      setConflicts(e?.response?.data?.details?.conflicts || [])
      showMessage('danger', e?.response?.data?.error || 'Validation failed')
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
      showMessage('success', res?.data?.message || 'Saved successfully')
      await loadScopeData()
      await loadClassTimetable(selectedClassId)
    } catch (e) {
      setConflicts(e?.response?.data?.details?.conflicts || [])
      showMessage('danger', e?.response?.data?.error || 'Failed to save timetable')
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
      showMessage('success', isPublished ? 'Unpublished' : 'Published')
      await loadScopeData()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to update publish status')
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

  const getCellHoverText = (slotEntry) => {
    if (!slotEntry) return 'Not Scheduled'
    const offering = offeringById.get(String(slotEntry.courseOfferingId || ''))
    const courseName = offering?.course?.courseTitle || offering?.course?.courseCode || '-'
    const faculty = facultyById.get(String(slotEntry.facultyId || ''))
    const facultyName = faculty?.facultyName || '-'
    return `Course: ${courseName} | Faculty: ${facultyName}`
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
        api.get('/api/setup/academic-year', { headers: { 'x-institution-id': scope.institutionId } }),
        api.get('/api/setup/batch', { params: { institutionId: scope.institutionId } }),
      ])
      setDepartments(unwrapList(d))
      setAcademicYears(unwrapList(y))
      setBatches(unwrapList(b))
    })().catch(() => {})
  }, [scope.institutionId])

  useEffect(() => {
    setScope((s) => ({ ...s, programmeId: '', regulationId: '', semester: '' }))
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
    setScope((s) => ({ ...s, regulationId: '', semester: '' }))
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
    setScope((s) => ({ ...s, semester: '' }))
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
          academicYearId: scope.academicYearId,
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
  ])

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
              <ArpButton label={validating ? 'Validating...' : 'Validate'} icon="view" color="warning" onClick={onValidate} disabled={!selectedClassId || !selectedTimetableId || validating} />
              <ArpButton label={saving ? 'Saving...' : 'Save'} icon="save" color="success" onClick={onSave} disabled={!selectedClassId || !selectedTimetableId || saving} />
              <ArpButton
                label={publishing ? 'Updating...' : isPublished ? 'Unpublish' : 'Publish'}
                icon="send"
                color={isPublished ? 'secondary' : 'primary'}
                onClick={onPublishToggle}
                disabled={!selectedClassId || publishing}
              />
            </div>
          </CCardHeader>
          <CCardBody>
            {message ? <CAlert color={message.type}>{message.text}</CAlert> : null}
            <CRow className="g-3">
              <CCol md={3}><CFormLabel>Institution</CFormLabel><CFormSelect value={scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, institutionId: e.target.value }))}><option value="">Select Institution</option>{institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Department</CFormLabel><CFormSelect value={scope.departmentId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, departmentId: e.target.value }))}><option value="">Select Department</option>{departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Programme</CFormLabel><CFormSelect value={scope.programmeId} disabled={!scope.departmentId} onChange={(e) => setScope((s) => ({ ...s, programmeId: e.target.value }))}><option value="">Select Programme</option>{programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode} - {x.programmeName}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Regulation</CFormLabel><CFormSelect value={scope.regulationId} disabled={!scope.programmeId} onChange={(e) => setScope((s) => ({ ...s, regulationId: e.target.value }))}><option value="">Select Regulation</option>{regulations.map((x) => <option key={x.id} value={x.id}>{x.regulationCode}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Academic Year</CFormLabel><CFormSelect value={scope.academicYearId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, academicYearId: e.target.value }))}><option value="">Select Academic Year</option>{academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Batch</CFormLabel><CFormSelect value={scope.batchId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, batchId: e.target.value }))}><option value="">Select Batch</option>{batches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}</CFormSelect></CCol>
              <CCol md={3}>
                <CFormLabel>Semester</CFormLabel>
                <CFormSelect value={scope.semester} disabled={!scope.batchId || !scope.regulationId || !scope.academicYearId} onChange={(e) => setScope((s) => ({ ...s, semester: e.target.value }))}>
                  <option value="">Select Semester</option>
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
              <span>Version: {versionNo}</span>
              <span>Status: {isPublished ? 'Published' : 'Draft'}</span>
            </div>
          </CCardHeader>
          <CCardBody>
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
                          const titleText = slotEntry?.title || (slotEntry?.periodType === 'BREAK' ? 'Break' : 'Scheduled')

                          return (
                            <td
                              key={slot.id}
                              style={{
                                backgroundColor: scheduled ? '#eaf2fb' : '#ffffff',
                                borderColor: scheduled ? '#b9d0ea' : undefined,
                              }}
                            >
                              <button
                                type="button"
                                className="btn btn-link p-0 text-decoration-none"
                                onClick={() => openEditor(day.value, slot.id)}
                                title={getCellHoverText(slotEntry)}
                              >
                                <div className="d-flex flex-column align-items-center">
                                  <CIcon icon={scheduled ? cilCheckCircle : cilXCircle} size="xl" className={scheduled ? 'text-success' : 'text-medium-emphasis'} />
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
              {conflicts.map((c, i) => <li key={i}>[{c.type}] {c.message || 'Conflict'}</li>)}
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
