import React, { useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
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
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'
import { ArpButton } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'

const todayIso = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const initialForm = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
  facultyId: '',
  view: 'today',
  date: todayIso(),
  fromDate: todayIso(),
  toDate: todayIso(),
  dayOfWeek: '',
  dayOrder: '',
}

const VIEW_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'date', label: 'Date-wise' },
  { value: 'dateRange', label: 'Date Range' },
  { value: 'day', label: 'Day-wise' },
  { value: 'dayOrder', label: 'Day Order-wise' },
]

const MODE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'FACULTY_PREVIEW', label: 'Faculty Preview' },
]

const DEFAULT_DAY_OPTIONS = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
]

const normalizePattern = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .trim()

const pad2 = (n) => String(Number(n) || 0).padStart(2, '0')

const parseTimeTo24 = (value) => {
  let text = String(value || '').trim().toUpperCase()
  if (!text) return null

  // Normalize values like "09:15:00+05:30", "09:15:00Z", "09:15:00 IST"
  text = text.replace(/\s+[A-Z]{2,6}$/g, '')
  if (text.endsWith('Z')) text = text.slice(0, -1)
  if (/^\d{1,2}:\d{2}(:\d{2})?[+-]\d{2}:\d{2}$/.test(text)) text = text.slice(0, text.indexOf('+'))
  if (/^\d{1,2}:\d{2}(:\d{2})?-\d{2}:\d{2}$/.test(text)) text = text.slice(0, text.lastIndexOf('-'))

  const ampm = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/)
  if (ampm) {
    let h = Number(ampm[1] || 0)
    const m = Number(ampm[2] || 0)
    const s = Number(ampm[3] || 0)
    const meridiem = ampm[4]
    if (meridiem === 'AM') h = h === 12 ? 0 : h
    if (meridiem === 'PM') h = h === 12 ? 12 : h + 12
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
  }

  const hm = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!hm) return null
  const h = Number(hm[1] || 0)
  const m = Number(hm[2] || 0)
  const s = Number(hm[3] || 0)
  if (h > 23 || m > 59 || s > 59) return null
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

const timeToMinutes = (value) => {
  const t = parseTimeTo24(value)
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const getInitials = (value) => {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'NA'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

const parseIsoDate = (iso) => {
  const text = String(iso || '').trim()
  if (!text) return null
  const d = new Date(`${text}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

const toIsoLocal = (d) => {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const startOfWeekSunday = (d) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() - x.getDay())
  return x
}

const addDays = (d, n) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() + n)
  return x
}

const formatWeekTitle = (weekStartIso) => {
  const start = parseIsoDate(weekStartIso)
  if (!start) return '-'
  const end = addDays(start, 6)
  const month1 = start.toLocaleDateString('en-US', { month: 'short' })
  const month2 = end.toLocaleDateString('en-US', { month: 'short' })
  if (month1 === month2) return `${month1} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`
  return `${month1} ${start.getDate()} - ${month2} ${end.getDate()}, ${end.getFullYear()}`
}

const dayNameShort = (iso) => {
  const d = parseIsoDate(iso)
  if (!d) return '-'
  return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
}

const utcOffsetLabel = () => {
  const mins = -new Date().getTimezoneOffset()
  const sign = mins >= 0 ? '+' : '-'
  const abs = Math.abs(mins)
  const h = String(Math.floor(abs / 60)).padStart(2, '0')
  const m = String(abs % 60).padStart(2, '0')
  return `GMT ${sign}${h}${m}`
}

const statusColor = (status) => {
  const value = String(status || '').toUpperCase()
  if (value === 'COMPLETED') return 'success'
  if (value === 'NOT_COMPLETED') return 'warning'
  if (value === 'PENDING') return 'secondary'
  if (value === 'MARKED') return 'info'
  if (value === 'NOT_TAKEN') return 'secondary'
  return 'light'
}

const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB')
}

const LectureScheduleConfiguration = () => {
  const [mode, setMode] = useState('ADMIN')
  const [form, setForm] = useState(initialForm)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [faculties, setFaculties] = useState([])
  const [facultyScopes, setFacultyScopes] = useState([])
  const [selectedFacultyScopeId, setSelectedFacultyScopeId] = useState('')
  const [dayOptions, setDayOptions] = useState(DEFAULT_DAY_OPTIONS)
  const [dayOrderOptions, setDayOrderOptions] = useState(
    Array.from({ length: 7 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
  )

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('edit')
  const [selected, setSelected] = useState(null)
  const [detailsLayout, setDetailsLayout] = useState('calendar')
  const [weekStartIso, setWeekStartIso] = useState('')
  const [updateForm, setUpdateForm] = useState({
    teachingStatus: 'COMPLETED',
    actualLectureTitle: '',
    lectureAidsUsed: '',
    lectureReferences: '',
  })

  const adminScope = useMemo(
    () => ({
      institutionId: form.institutionId,
      departmentId: form.departmentId,
      programmeId: form.programmeId,
      regulationId: form.regulationId,
      academicYearId: form.academicYearId,
      batchId: form.batchId,
      semester: form.semester,
    }),
    [form],
  )

  const selectedFacultyScope = useMemo(
    () => facultyScopes.find((x) => String(x.id) === String(selectedFacultyScopeId)) || null,
    [facultyScopes, selectedFacultyScopeId],
  )

  const scope = useMemo(() => {
    if (mode !== 'FACULTY_PREVIEW') return adminScope
    return selectedFacultyScope
      ? {
          institutionId: selectedFacultyScope.institutionId,
          departmentId: selectedFacultyScope.departmentId,
          programmeId: selectedFacultyScope.programmeId,
          regulationId: selectedFacultyScope.regulationId,
          academicYearId: selectedFacultyScope.academicYearId,
          batchId: selectedFacultyScope.batchId,
          semester: selectedFacultyScope.semester,
        }
      : adminScope
  }, [mode, adminScope, selectedFacultyScope])

  React.useEffect(() => {
    ;(async () => {
      try {
        setInstitutions(await lmsService.listInstitutions())
      } catch {
        setError('Failed to load institutions')
      }
    })()
  }, [])

  React.useEffect(() => {
    if (mode !== 'FACULTY_PREVIEW') return
    ;(async () => {
      await loadFacultyPreviewScopes({
        institutionId: form.institutionId,
        academicYearId: form.academicYearId,
        facultyId: form.facultyId,
      })
    })()
  }, [mode, form.institutionId, form.academicYearId, form.facultyId])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(form.academicYearId)) || null,
    [academicYears, form.academicYearId],
  )
  const semesterOptions = useMemo(() => semesterOptionsFromAcademicYear(selectedAcademicYear), [selectedAcademicYear])

  const loadCalendarFilterOptions = async (academicYearId) => {
    if (!academicYearId) {
      setDayOptions(DEFAULT_DAY_OPTIONS)
      setDayOrderOptions(Array.from({ length: 7 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })))
      return
    }
    try {
      const rows = await lmsService.listAcademicCalendarPatterns()
      const filtered = (Array.isArray(rows) ? rows : []).filter((x) => String(x?.academicYearId || '') === String(academicYearId))
      const source = filtered.length ? filtered : rows

      const dayPattern = source.find((x) => normalizePattern(x?.calendarPattern).includes('DAY_PATTERN'))
      if (dayPattern?.day) {
        const map = {
          monday: '1',
          mon: '1',
          tuesday: '2',
          tue: '2',
          wednesday: '3',
          wed: '3',
          thursday: '4',
          thu: '4',
          friday: '5',
          fri: '5',
          saturday: '6',
          sat: '6',
          sunday: '7',
          sun: '7',
        }
        const parsed = String(dayPattern.day)
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean)
          .map((name) => ({ value: map[String(name).toLowerCase()] || '', label: name }))
          .filter((x) => x.value)
        if (parsed.length) setDayOptions(parsed)
        else setDayOptions(DEFAULT_DAY_OPTIONS)
      } else {
        setDayOptions(DEFAULT_DAY_OPTIONS)
      }

      const orderPattern = source.find((x) => normalizePattern(x?.calendarPattern).includes('DAY_ORDER'))
      const min = Number(orderPattern?.minimumDayOrder || 1)
      const max = Number(orderPattern?.maxDayOrder || Math.max(min, 7))
      const options = []
      for (let i = min; i <= max; i += 1) options.push({ value: String(i), label: String(i) })
      setDayOrderOptions(options.length ? options : Array.from({ length: 7 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })))
    } catch {
      setDayOptions(DEFAULT_DAY_OPTIONS)
      setDayOrderOptions(Array.from({ length: 7 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })))
    }
  }

  const loadFacultyPreviewScopes = async ({ institutionId, academicYearId, facultyId }) => {
    if (!institutionId || !academicYearId || !facultyId) {
      setFacultyScopes([])
      setSelectedFacultyScopeId('')
      return
    }
    try {
      const scopes = await lmsService.getFacultyLectureScopes({ institutionId, academicYearId, facultyId })
      const list = Array.isArray(scopes) ? scopes : []
      setFacultyScopes(list)
      setSelectedFacultyScopeId(list[0]?.id || '')
    } catch {
      setFacultyScopes([])
      setSelectedFacultyScopeId('')
      setError('Failed to resolve faculty active scope')
    }
  }

  const onChange = (key) => async (e) => {
    const value = e.target.value
    setError('')
    setInfo('')

    if (key === 'mode') {
      setMode(value)
      setRows([])
      setFacultyScopes([])
      setSelectedFacultyScopeId('')
      return
    }

    if (key === 'institutionId') {
      setForm((p) => ({
        ...p,
        institutionId: value,
        departmentId: '',
        programmeId: '',
        regulationId: '',
        academicYearId: '',
        batchId: '',
        semester: '',
        facultyId: '',
      }))
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      setFaculties([])
      setFacultyScopes([])
      setSelectedFacultyScopeId('')
      setDayOptions(DEFAULT_DAY_OPTIONS)
      setDayOrderOptions(Array.from({ length: 7 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })))
      if (!value) return
      try {
        const [d, ay, b] = await Promise.all([
          lmsService.listDepartments(value),
          lmsService.listAcademicYears(value),
          lmsService.listBatches(value),
        ])
        setDepartments(d)
        setAcademicYears(ay)
        setBatches(b)
      } catch {
        setError('Failed to load institution scope')
      }
      return
    }

    if (key === 'departmentId') {
      setForm((p) => ({ ...p, departmentId: value, programmeId: '', regulationId: '', facultyId: '' }))
      setProgrammes([])
      setRegulations([])
      setFaculties([])
      if (!value || !form.institutionId) return
      try {
        const p = await lmsService.listProgrammes(form.institutionId, value)
        setProgrammes(p)
      } catch {
        setError('Failed to load programmes')
      }

      if (!form.academicYearId) return

      try {
        const f = await lmsService.listFaculties({
          institutionId: form.institutionId,
          departmentId: value,
          academicYearId: form.academicYearId,
        })
        setFaculties(f)
      } catch {
        setError('Failed to load faculties')
      }
      return
    }

    if (key === 'programmeId') {
      setForm((p) => ({ ...p, programmeId: value, regulationId: '' }))
      setRegulations([])
      if (!value || !form.institutionId) return
      try {
        setRegulations(await lmsService.listRegulations(form.institutionId, value))
      } catch {
        setError('Failed to load regulations')
      }
      return
    }

    if (key === 'academicYearId') {
      setForm((p) => ({ ...p, academicYearId: value, semester: '', facultyId: '' }))
      setFacultyScopes([])
      setSelectedFacultyScopeId('')
      await loadCalendarFilterOptions(value)
      if (!form.institutionId) return
      try {
        setFaculties(
          await lmsService.listFaculties({
            institutionId: form.institutionId,
            departmentId: mode === 'FACULTY_PREVIEW' ? '' : form.departmentId,
            academicYearId: value,
          }),
        )
      } catch {
        setError('Failed to load faculties')
      }
      return
    }

    if (key === 'facultyId') {
      setForm((p) => ({ ...p, facultyId: value }))
      if (mode === 'FACULTY_PREVIEW') {
        await loadFacultyPreviewScopes({
          institutionId: form.institutionId,
          academicYearId: form.academicYearId,
          facultyId: value,
        })
      }
      return
    }

    setForm((p) => ({ ...p, [key]: value }))
  }

  const onSearch = async (e) => {
    e?.preventDefault?.()
    setError('')
    setInfo('')
    if (mode === 'ADMIN') {
      if (!form.institutionId || !form.departmentId || !form.programmeId || !form.regulationId || !form.academicYearId || !form.batchId || !form.semester) {
        setError('Select full academic scope before searching')
        return
      }
    } else {
      if (!form.institutionId || !form.academicYearId) {
        setError('Select Institution and Academic Year')
        return
      }
      if (!selectedFacultyScopeId) {
        setError('No active timetable scope found for selected faculty')
        return
      }
    }
    if (!form.facultyId) {
      setError('Select faculty')
      return
    }
    if (form.view === 'date' && !form.date) {
      setError('Choose date for date-wise view')
      return
    }
    if (form.view === 'dateRange' && (!form.fromDate || !form.toDate)) {
      setError('Choose from and to dates for date range view')
      return
    }
    if (form.view === 'dateRange' && form.fromDate > form.toDate) {
      setError('From date must be less than or equal to To date')
      return
    }
    if (form.view === 'day' && !form.dayOfWeek) {
      setError('Choose day for day-wise view')
      return
    }
    if (form.view === 'dayOrder' && !form.dayOrder) {
      setError('Choose day order for day-order-wise view')
      return
    }

    const filters = {
      facultyId: form.facultyId,
      view: form.view,
      ...(form.view === 'date' ? { date: form.date } : {}),
      ...(form.view === 'dateRange' ? { fromDate: form.fromDate, toDate: form.toDate } : {}),
      ...(form.view === 'day' ? { dayOfWeek: form.dayOfWeek } : {}),
      ...(form.view === 'dayOrder' ? { dayOrder: form.dayOrder } : {}),
    }

    try {
      setLoading(true)
      const data = await lmsService.getFacultyLectureSchedule(scope, filters)
      setRows(Array.isArray(data) ? data : [])
      if (!Array.isArray(data) || !data.length) setInfo('No lecture schedule found for selected filter')
    } catch (err) {
      setRows([])
      setError(err?.response?.data?.error || 'Failed to load lecture schedule')
    } finally {
      setLoading(false)
    }
  }

  const openSessionModal = async (row, mode = 'edit') => {
    if (!row?.id || !row?.sessionDate) {
      setError('Session date is required to view/edit details')
      return
    }
    try {
      setError('')
      setInfo('')
      const session = await lmsService.getLectureSession(row.id, scope, {
        facultyId: form.facultyId,
        date: row.sessionDate,
      })
      setSelected(row)
      setModalMode(mode)
      setUpdateForm({
        teachingStatus: session?.teachingStatus || row.teachingStatus || 'COMPLETED',
        actualLectureTitle: session?.actualLectureTitle || row.actualLectureTitle || '',
        lectureAidsUsed: session?.lectureAidsUsed || row.lectureAidsUsed || '',
        lectureReferences: session?.lectureReferences || row.lectureReferences || '',
      })
      setShowModal(true)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load lecture session')
    }
  }

  const onSaveUpdate = async () => {
    if (!selected?.id) return
    try {
      setSaving(true)
      setError('')
      setInfo('')
      await lmsService.upsertLectureSession(selected.id, scope, {
        facultyId: form.facultyId,
        date: selected.sessionDate || form.date || todayIso(),
        teachingStatus: updateForm.teachingStatus,
        actualLectureTitle: updateForm.actualLectureTitle,
        lectureAidsUsed: updateForm.lectureAidsUsed,
        lectureReferences: updateForm.lectureReferences,
      })
      setShowModal(false)
      await onSearch()
      setInfo('Lecture session updated successfully')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update lecture session')
    } finally {
      setSaving(false)
    }
  }

  const onAttendancePlaceholder = async (row) => {
    if (!row?.id) return
    try {
      setError('')
      const res = await lmsService.triggerLectureAttendancePlaceholder(row.id, scope, {
        facultyId: form.facultyId,
        date: row.sessionDate || form.date || todayIso(),
      })
      setInfo(res?.data?.message || 'Attendance module not active yet.')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to open attendance placeholder')
    }
  }

  const onDeleteSession = async (row) => {
    if (!row?.id || !row?.sessionDate) {
      setError('Session date is required to delete')
      return
    }
    if (!window.confirm('Delete saved lecture details for this session?')) return
    try {
      setError('')
      setInfo('')
      await lmsService.deleteLectureSession(row.id, scope, {
        facultyId: form.facultyId,
        date: row.sessionDate,
      })
      await onSearch()
      setInfo('Lecture session deleted successfully')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete lecture session')
    }
  }

  const summary = useMemo(() => {
    const total = rows.length
    const completed = rows.filter((x) => String(x?.teachingStatus || '').toUpperCase() === 'COMPLETED').length
    const notCompleted = rows.filter((x) => String(x?.teachingStatus || '').toUpperCase() === 'NOT_COMPLETED').length
    const attendanceMarked = rows.filter((x) => String(x?.attendanceStatus || '').toUpperCase() === 'MARKED').length
    return { total, completed, notCompleted, attendanceMarked }
  }, [rows])

  const selectedFaculty = useMemo(
    () => faculties.find((x) => String(x?.id) === String(form.facultyId)) || null,
    [faculties, form.facultyId],
  )

  const institutionName = useMemo(
    () => institutions.find((x) => String(x?.id) === String(form.institutionId))?.name || '-',
    [institutions, form.institutionId],
  )

  const activeScopeLabel = useMemo(() => {
    if (mode === 'FACULTY_PREVIEW' && selectedFacultyScope?.label) return selectedFacultyScope.label
    const batchName = batches.find((x) => String(x?.id) === String(form.batchId))?.batchName || '-'
    const sem = form.semester || '-'
    return `Sem-${sem} | Batch: ${batchName}`
  }, [mode, selectedFacultyScope, batches, form.batchId, form.semester])

  React.useEffect(() => {
    const anchor = rows[0]?.sessionDate || form.date || form.fromDate || todayIso()
    const parsed = parseIsoDate(anchor)
    if (!parsed) return
    setWeekStartIso(toIsoLocal(startOfWeekSunday(parsed)))
  }, [rows, form.date, form.fromDate])

  const weekDays = useMemo(() => {
    const start = parseIsoDate(weekStartIso) || startOfWeekSunday(new Date())
    return Array.from({ length: 7 }, (_, i) => toIsoLocal(addDays(start, i)))
  }, [weekStartIso])

  const slotRows = useMemo(() => {
    const weekSet = new Set(weekDays)
    const inWeek = rows.filter((x) => weekSet.has(String(x?.sessionDate || '')))

    const keyOf = (x) => `${x?.timeFrom || ''}|${x?.timeTo || ''}|${x?.hourLabel || ''}`
    const map = new Map()
    inWeek.forEach((x) => {
      const key = keyOf(x)
      if (map.has(key)) return
      map.set(key, {
        key,
        hourLabel: x?.hourLabel,
        timeFrom: x?.timeFrom || '',
        timeTo: x?.timeTo || '',
        periodType: x?.periodType || '',
      })
    })

    return Array.from(map.values()).sort((a, b) => {
      const ta = timeToMinutes(a.timeFrom) ?? 9999
      const tb = timeToMinutes(b.timeFrom) ?? 9999
      if (ta !== tb) return ta - tb
      return Number(a.hourLabel || 0) - Number(b.hourLabel || 0)
    })
  }, [rows, weekDays])

  const cellRowsBySlotDay = useMemo(() => {
    const keyOf = (x) => `${x?.timeFrom || ''}|${x?.timeTo || ''}|${x?.hourLabel || ''}`
    const out = new Map()
    rows.forEach((x) => {
      const slotKey = keyOf(x)
      const dayKey = String(x?.sessionDate || '')
      const fullKey = `${slotKey}|${dayKey}`
      const list = out.get(fullKey) || []
      list.push(x)
      out.set(fullKey, list)
    })
    return out
  }, [rows])

  return (
    <CRow className="lecture-schedule-page">
      <CCol xs={12}>
        <style>
          {`
            .lecture-schedule-page .faculty-context-card .profile-chip {
              width: 44px;
              height: 44px;
              border-radius: 9999px;
              background: #e9ecef;
              color: #495057;
              font-weight: 700;
              display: inline-flex;
              align-items: center;
              justify-content: center;
            }
            .lecture-schedule-page .ls-meta-label {
              color: #6c757d;
              font-size: 0.78rem;
              margin-right: 4px;
            }
            .lecture-schedule-page .ls-meta-value {
              font-weight: 600;
              margin-right: 16px;
            }
            .lecture-schedule-page .ls-matrix-wrap {
              border: 1px solid var(--cui-border-color);
              border-radius: 8px;
              overflow: auto;
            }
            .lecture-schedule-page .ls-nav-btn {
              min-width: 38px;
              font-size: 1.2rem;
              line-height: 1;
              padding-top: 0.25rem;
              padding-bottom: 0.25rem;
            }
            .lecture-schedule-page .ls-week-title {
              font-size: 1.35rem;
              font-weight: 700;
              color: #244064;
            }
            .lecture-schedule-page .ls-time-col {
              min-width: 170px;
              position: sticky;
              left: 0;
              z-index: 3;
              background: var(--cui-card-bg);
            }
            .lecture-schedule-page .ls-time-head {
              font-weight: 700;
              color: #243b53;
            }
            .lecture-schedule-page .ls-day-head {
              min-width: 165px;
              text-align: center;
              color: #617a99;
              font-size: 0.85rem;
            }
            .lecture-schedule-page .ls-day-head .date {
              font-size: 1.6rem;
              color: #1f3350;
              line-height: 1;
              margin-top: 4px;
            }
            .lecture-schedule-page .ls-day-head.is-today {
              background: #4f76e0;
              color: #d9e5ff;
            }
            .lecture-schedule-page .ls-day-head.is-today .date {
              color: #ffffff;
            }
            .lecture-schedule-page .ls-slot-label {
              font-weight: 700;
              color: #293a58;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 150px;
            }
            .lecture-schedule-page .ls-slot-time {
              color: #7a8ca8;
              margin-top: 2px;
            }
            .lecture-schedule-page .ls-cell {
              min-height: 110px;
              vertical-align: top;
              background: #fbfcfe;
            }
            .lecture-schedule-page .ls-item {
              padding: 6px 8px;
              border-radius: 8px;
              border-left: 3px solid #7189a8;
              background: #f7f9fc;
            }
            .lecture-schedule-page .ls-item + .ls-item {
              margin-top: 6px;
            }
            .lecture-schedule-page .ls-item.completed {
              border-left-color: #198754;
            }
            .lecture-schedule-page .ls-item.not-completed {
              border-left-color: #fd7e14;
            }
            .lecture-schedule-page .ls-item-title {
              font-weight: 700;
              color: #1f3350;
              line-height: 1.2;
            }
            .lecture-schedule-page .ls-item-sub {
              margin-top: 2px;
              color: #334e68;
              line-height: 1.2;
            }
            .lecture-schedule-page .ls-item-edit {
              border: 0;
              background: transparent;
              color: #0d6efd;
              font-size: 0.72rem;
              font-weight: 600;
              padding: 0;
              opacity: 0;
              cursor: pointer;
            }
            .lecture-schedule-page .ls-item:hover .ls-item-edit {
              opacity: 1;
            }
            .lecture-schedule-page .ls-table-scroll {
              max-height: 70vh;
              overflow: auto;
            }
            .lecture-schedule-page .ls-sticky-head th {
              position: sticky;
              top: 0;
              z-index: 1;
              background: var(--cui-card-cap-bg);
            }
          `}
        </style>
        <CCard className="mb-3">
          <CCardHeader>
            <strong>LECTURE SCHEDULE</strong>
          </CCardHeader>
        </CCard>

        {error ? <CAlert color="danger">{error}</CAlert> : null}
        {info ? <CAlert color="info">{info}</CAlert> : null}

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Filters</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSearch}>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Mode</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={mode} onChange={onChange('mode')}>
                    {MODE_OPTIONS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Institution</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.institutionId} onChange={onChange('institutionId')}>
                    <option value="">Select</option>
                    {institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </CFormSelect>
                </CCol>

                {mode === 'ADMIN' ? (
                  <>
                    <CCol md={3}><CFormLabel>Department</CFormLabel></CCol>
                    <CCol md={3}>
                      <CFormSelect value={form.departmentId} onChange={onChange('departmentId')}>
                        <option value="">Select</option>
                        {departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}
                      </CFormSelect>
                    </CCol>

                    <CCol md={3}><CFormLabel>Programme</CFormLabel></CCol>
                    <CCol md={3}>
                      <CFormSelect value={form.programmeId} onChange={onChange('programmeId')}>
                        <option value="">Select</option>
                        {programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode} - {x.programmeName}</option>)}
                      </CFormSelect>
                    </CCol>

                    <CCol md={3}><CFormLabel>Regulation</CFormLabel></CCol>
                    <CCol md={3}>
                      <CFormSelect value={form.regulationId} onChange={onChange('regulationId')}>
                        <option value="">Select</option>
                        {regulations.map((x) => <option key={x.id} value={x.id}>{x.regulationCode}</option>)}
                      </CFormSelect>
                    </CCol>
                  </>
                ) : null}

                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYearId} onChange={onChange('academicYearId')}>
                    <option value="">Select</option>
                    {academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}
                  </CFormSelect>
                </CCol>

                {mode === 'ADMIN' ? (
                  <>
                    <CCol md={3}><CFormLabel>Batch</CFormLabel></CCol>
                    <CCol md={3}>
                      <CFormSelect value={form.batchId} onChange={onChange('batchId')}>
                        <option value="">Select</option>
                        {batches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}
                      </CFormSelect>
                    </CCol>

                    <CCol md={3}><CFormLabel>Semester</CFormLabel></CCol>
                    <CCol md={3}>
                      <CFormSelect value={form.semester} onChange={onChange('semester')}>
                        <option value="">Select</option>
                        {semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                      </CFormSelect>
                    </CCol>
                  </>
                ) : null}

                <CCol md={3}><CFormLabel>Faculty</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.facultyId} onChange={onChange('facultyId')}>
                    <option value="">Select</option>
                    {faculties.map((x) => <option key={x.id} value={x.id}>{x.facultyCode} - {x.facultyName}</option>)}
                  </CFormSelect>
                </CCol>

                {mode === 'FACULTY_PREVIEW' ? (
                  <>
                    <CCol md={3}><CFormLabel>Active Scope</CFormLabel></CCol>
                    <CCol md={3}>
                      <CFormSelect
                        value={selectedFacultyScopeId}
                        onChange={(e) => setSelectedFacultyScopeId(e.target.value)}
                      >
                        <option value="">Select</option>
                        {facultyScopes.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.label}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                  </>
                ) : null}

                <CCol md={3}><CFormLabel>View</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.view} onChange={onChange('view')}>
                    {VIEW_OPTIONS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                  </CFormSelect>
                </CCol>

                {form.view === 'date' ? (
                  <>
                    <CCol md={3}><CFormLabel>Date</CFormLabel></CCol>
                    <CCol md={3}><CFormInput type="date" value={form.date} onChange={onChange('date')} /></CCol>
                  </>
                ) : null}

                {form.view === 'dateRange' ? (
                  <>
                    <CCol md={3}><CFormLabel>From Date</CFormLabel></CCol>
                    <CCol md={3}><CFormInput type="date" value={form.fromDate} onChange={onChange('fromDate')} /></CCol>
                    <CCol md={3}><CFormLabel>To Date</CFormLabel></CCol>
                    <CCol md={3}><CFormInput type="date" value={form.toDate} onChange={onChange('toDate')} /></CCol>
                  </>
                ) : null}

                {form.view === 'day' ? (
                  <>
                    <CCol md={3}><CFormLabel>Day</CFormLabel></CCol>
                    <CCol md={3}>
                      <CFormSelect value={form.dayOfWeek} onChange={onChange('dayOfWeek')}>
                        <option value="">Select</option>
                        {dayOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                      </CFormSelect>
                    </CCol>
                  </>
                ) : null}

                {form.view === 'dayOrder' ? (
                  <>
                    <CCol md={3}><CFormLabel>Day Order</CFormLabel></CCol>
                    <CCol md={3}>
                      <CFormSelect value={form.dayOrder} onChange={onChange('dayOrder')}>
                        <option value="">Select</option>
                        {dayOrderOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                      </CFormSelect>
                    </CCol>
                  </>
                ) : null}

                <CCol md={12} className="text-end">
                  <ArpButton label="Search" icon="search" color="primary" type="submit" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {form.facultyId ? (
          <CCard className="mb-3 faculty-context-card">
            <CCardBody>
              <div className="d-flex flex-wrap justify-content-between gap-3 align-items-start">
                <div className="d-flex align-items-start gap-3">
                  <div className="profile-chip">{getInitials(selectedFaculty?.facultyName || rows[0]?.facultyName)}</div>
                  <div>
                    <div className="fw-semibold fs-5">{selectedFaculty?.facultyName || rows[0]?.facultyName || '-'}</div>
                    <div className="mt-1">
                      <span className="ls-meta-label">Faculty ID:</span>
                      <span className="ls-meta-value">{selectedFaculty?.facultyCode || rows[0]?.facultyCode || '-'}</span>
                      <span className="ls-meta-label">Department:</span>
                      <span className="ls-meta-value">{selectedFaculty?.departmentName || '-'}</span>
                      <span className="ls-meta-label">Designation:</span>
                      <span className="ls-meta-value">{selectedFaculty?.designation || '-'}</span>
                    </div>
                    <div className="mt-1">
                      <span className="ls-meta-label">Institution:</span>
                      <span className="ls-meta-value">{institutionName}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <CBadge color="dark">Active Scope: {activeScopeLabel}</CBadge>
                </div>
              </div>
            </CCardBody>
          </CCard>
        ) : null}

        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <strong>Lecture Schedule Details</strong>
              <CBadge color="primary">Total: {summary.total}</CBadge>
              <CBadge color="success">Completed: {summary.completed}</CBadge>
              <CBadge color="warning">Not Completed: {summary.notCompleted}</CBadge>
              <CBadge color="info">Attendance Marked: {summary.attendanceMarked}</CBadge>
            </div>
            <div className="d-flex align-items-center gap-2">
              <CButton
                size="sm"
                color={detailsLayout === 'calendar' ? 'primary' : 'light'}
                variant={detailsLayout === 'calendar' ? undefined : 'outline'}
                onClick={() => setDetailsLayout('calendar')}
              >
                Week View
              </CButton>
              <CButton
                size="sm"
                color={detailsLayout === 'list' ? 'primary' : 'light'}
                variant={detailsLayout === 'list' ? undefined : 'outline'}
                onClick={() => setDetailsLayout('list')}
              >
                List View
              </CButton>
              {loading ? <CSpinner size="sm" /> : null}
            </div>
          </CCardHeader>
          <CCardBody>
            {detailsLayout === 'calendar' ? (
              <>
                <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                  <CButton
                    type="button"
                    color="light"
                    className="ls-nav-btn"
                    onClick={() => {
                      const s = parseIsoDate(weekStartIso) || startOfWeekSunday(new Date())
                      setWeekStartIso(toIsoLocal(addDays(s, -7)))
                    }}
                  >
                    ‹
                  </CButton>
                  <div className="ls-week-title">{formatWeekTitle(weekStartIso)}</div>
                  <CButton
                    type="button"
                    color="light"
                    className="ls-nav-btn"
                    onClick={() => {
                      const s = parseIsoDate(weekStartIso) || startOfWeekSunday(new Date())
                      setWeekStartIso(toIsoLocal(addDays(s, 7)))
                    }}
                  >
                    ›
                  </CButton>
                </div>

                <div className="ls-matrix-wrap">
                  <CTable bordered responsive className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell className="ls-time-col ls-time-head text-center">{utcOffsetLabel()}</CTableHeaderCell>
                        {weekDays.map((day) => {
                          const isToday = day === todayIso()
                          return (
                            <CTableHeaderCell key={day} className={`ls-day-head ${isToday ? 'is-today' : ''}`}>
                              <div>{dayNameShort(day)}</div>
                              <div className="date">{parseIsoDate(day)?.getDate() || '-'}</div>
                            </CTableHeaderCell>
                          )
                        })}
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {slotRows.length ? slotRows.map((slot) => (
                        <CTableRow key={slot.key}>
                          <CTableDataCell className="ls-time-col">
                            <div className="ls-slot-label">{slot.periodType || (slot.hourLabel ? `Hour ${slot.hourLabel}` : 'Period')}</div>
                            <div className="ls-slot-time">{slot.timeFrom || '-'} - {slot.timeTo || '-'}</div>
                          </CTableDataCell>
                          {weekDays.map((day) => {
                            const list = cellRowsBySlotDay.get(`${slot.key}|${day}`) || []
                            return (
                              <CTableDataCell key={`${slot.key}-${day}`} className="ls-cell">
                                {list.map((r) => (
                                  <div
                                    key={`${r.id}-${r.sessionDate}-${r.courseCode}`}
                                    className={`ls-item ${String(r.teachingStatus || '').toUpperCase() === 'COMPLETED' ? 'completed' : 'not-completed'}`}
                                  >
                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                      <div className="ls-item-title">
                                        {(r.courseCode || '-')} | {(r.programmeCode || '-')} | SEM-{scope?.semester || '-'}
                                      </div>
                                      <button type="button" className="ls-item-edit" onClick={() => openSessionModal(r, 'edit')}>
                                        Edit
                                      </button>
                                    </div>
                                    <div className="ls-item-sub">{r.className || r.classLabel || '-'}</div>
                                    <div className="ls-item-sub">{r.courseTitle || '-'}</div>
                                  </div>
                                ))}
                              </CTableDataCell>
                            )
                          })}
                        </CTableRow>
                      )) : (
                        <CTableRow>
                          <CTableDataCell colSpan={8} className="text-center py-4">No schedule in this week</CTableDataCell>
                        </CTableRow>
                      )}
                    </CTableBody>
                  </CTable>
                </div>
              </>
            ) : (
              <div className="ls-table-scroll">
                <CTable bordered hover responsive small>
                  <CTableHead className="ls-sticky-head">
                    <CTableRow>
                      <CTableHeaderCell>Faculty</CTableHeaderCell>
                      <CTableHeaderCell>Programme</CTableHeaderCell>
                      <CTableHeaderCell>Class Name</CTableHeaderCell>
                      <CTableHeaderCell>Section</CTableHeaderCell>
                      <CTableHeaderCell>Course</CTableHeaderCell>
                      <CTableHeaderCell>Day Order</CTableHeaderCell>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                      <CTableHeaderCell>Hour</CTableHeaderCell>
                      <CTableHeaderCell>Topic</CTableHeaderCell>
                      <CTableHeaderCell>Teaching</CTableHeaderCell>
                      <CTableHeaderCell>Attendance</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {rows.length ? rows.map((r) => (
                      <CTableRow key={`${r.id}-${r.sessionDate || 'na'}`}>
                        <CTableDataCell>{r.facultyCode} - {r.facultyName}</CTableDataCell>
                        <CTableDataCell>{r.programmeCode} - {r.programmeName}</CTableDataCell>
                        <CTableDataCell>{String(r.className || '').trim() || '-'}</CTableDataCell>
                        <CTableDataCell>{String(r.section || r.classLabel || '').trim() || '-'}</CTableDataCell>
                        <CTableDataCell>{r.courseCode} - {r.courseTitle}</CTableDataCell>
                        <CTableDataCell>{r.dayOrder ?? '-'}</CTableDataCell>
                        <CTableDataCell>{formatDate(r.sessionDate)}</CTableDataCell>
                        <CTableDataCell>{r.hourLabel ? `Hour ${r.hourLabel}` : '-'} ({r.timeFrom || '-'} - {r.timeTo || '-'})</CTableDataCell>
                        <CTableDataCell>{r.scheduledTopic || '-'}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={statusColor(r.teachingStatus)}>{r.teachingStatus || '-'}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={statusColor(r.attendanceStatus)}>{r.attendanceStatus || '-'}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButton size="sm" color="info" className="me-2 mb-1" onClick={() => openSessionModal(r, 'view')}>
                            View
                          </CButton>
                          <CButton size="sm" color="primary" className="me-2 mb-1" onClick={() => openSessionModal(r, 'edit')}>
                            Edit
                          </CButton>
                          <CButton size="sm" color="danger" className="me-2 mb-1" onClick={() => onDeleteSession(r)}>
                            Delete
                          </CButton>
                          <CButton size="sm" color="secondary" className="mb-1" onClick={() => onAttendancePlaceholder(r)}>
                            Attendance
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )) : (
                      <CTableRow>
                        <CTableDataCell colSpan={12} className="text-center">No data</CTableDataCell>
                      </CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </div>
            )}
          </CCardBody>
        </CCard>

        <CModal visible={showModal} onClose={() => setShowModal(false)}>
          <CModalHeader>
            <CModalTitle>{modalMode === 'view' ? 'View Lecture Details' : 'Post-Lecture Update'}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow className="g-3">
              <CCol md={12}>
                <CFormLabel>Teaching Status</CFormLabel>
                <CFormSelect
                  value={updateForm.teachingStatus}
                  onChange={(e) => setUpdateForm((p) => ({ ...p, teachingStatus: e.target.value }))}
                  disabled={modalMode === 'view'}
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="NOT_COMPLETED">Not Completed</option>
                </CFormSelect>
              </CCol>
              <CCol md={12}>
                <CFormLabel>Title of the Lecture</CFormLabel>
                <CFormInput
                  value={updateForm.actualLectureTitle}
                  onChange={(e) => setUpdateForm((p) => ({ ...p, actualLectureTitle: e.target.value }))}
                  disabled={modalMode === 'view'}
                />
              </CCol>
              <CCol md={12}>
                <CFormLabel>Lecture Aids Used</CFormLabel>
                <CFormInput
                  value={updateForm.lectureAidsUsed}
                  onChange={(e) => setUpdateForm((p) => ({ ...p, lectureAidsUsed: e.target.value }))}
                  disabled={modalMode === 'view'}
                />
              </CCol>
              <CCol md={12}>
                <CFormLabel>Lecture References (Optional)</CFormLabel>
                <CFormInput
                  value={updateForm.lectureReferences}
                  onChange={(e) => setUpdateForm((p) => ({ ...p, lectureReferences: e.target.value }))}
                  disabled={modalMode === 'view'}
                />
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowModal(false)}>Cancel</CButton>
            {modalMode === 'edit' ? (
              <CButton color="success" onClick={onSaveUpdate} disabled={saving}>
                {saving ? <CSpinner size="sm" /> : 'Save'}
              </CButton>
            ) : null}
          </CModalFooter>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default LectureScheduleConfiguration
