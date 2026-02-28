
import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
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
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import { ArpButton, ArpDataTable } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'

const initialForm = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
  programmeName: '',
  classId: '',
  facultyId: '',
}

const VIEW_TYPES = {
  CLASS: 'CLASS',
  FACULTY: 'FACULTY',
  DAY_WISE: 'DAY_WISE',
  WEEKLY: 'WEEKLY',
  ADJUSTMENT_REPORT: 'ADJUSTMENT_REPORT',
}

const LEAVE_TYPE_OPTIONS = ['LEAVE', 'ON_DUTY', 'MATERNITY', 'OTHER']

const normalizePattern = (value) =>
  String(value || '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .trim()

const pad2 = (n) => String(n).padStart(2, '0')
const isoFromDate = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
const parseIsoDate = (value) => {
  const txt = String(value || '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(txt)) return null
  const dt = new Date(`${txt}T00:00:00`)
  return Number.isNaN(dt.getTime()) ? null : dt
}
const weekdayIndexFromIso = (value) => {
  const dt = parseIsoDate(value)
  if (!dt) return null
  const day = dt.getDay()
  return day === 0 ? 7 : day
}
const inIsoRange = (dateIso, startIso, endIso) => {
  const d = parseIsoDate(dateIso)
  const s = parseIsoDate(startIso)
  const e = parseIsoDate(endIso)
  if (!d || !s || !e) return false
  return d.getTime() >= s.getTime() && d.getTime() <= e.getTime()
}

const dateListBetween = (startIso, endIso) => {
  const s = parseIsoDate(startIso)
  const e = parseIsoDate(endIso)
  if (!s || !e || s.getTime() > e.getTime()) return []
  const out = []
  const cursor = new Date(s)
  while (cursor.getTime() <= e.getTime()) {
    out.push(isoFromDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

const downloadBlob = (blob, filename) => {
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(href)
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const buildPreviewHtml = ({ title, subtitle, columns, rows }) => {
  const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('')
  const body = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${escapeHtml(r[c.key])}</td>`).join('')}</tr>`)
    .join('')

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; color: #1f2937; }
    h2 { margin: 0 0 8px; }
    p { margin: 0 0 16px; color: #4b5563; }
    .actions { margin-bottom: 12px; }
    button { padding: 8px 14px; border: 0; background: #0d6efd; color: #fff; border-radius: 4px; cursor: pointer; margin-right: 8px; }
    button.secondary { background: #6c757d; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; font-size: 12px; }
    th { background: #f3f4f6; }
    @media print { .actions { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <h2>${escapeHtml(title)}</h2>
  <p>${escapeHtml(subtitle)}</p>
  <div class="actions">
    <button onclick="window.print()">Print</button>
    <button class="secondary" onclick="if (window.opener) { window.close() } else { history.back() }">Close Preview</button>
  </div>
  <table><thead><tr>${head}</tr></thead><tbody>${body || '<tr><td colspan="99">No data</td></tr>'}</tbody></table>
</body>
</html>`
}

const openPreviewDocument = (html, setError) => {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800')
  if (win) {
    win.document.open()
    win.document.write(html)
    win.document.close()
    return true
  }
  try {
    downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), 'Timetable_Preview.html')
    setError('Popup blocked. Downloaded preview file instead. Open it and use Print/Save as PDF.')
    return true
  } catch {
    setError('Unable to open preview. Please allow popups and try again.')
    return false
  }
}

const buildAdjustmentMap = (rows = []) => {
  const map = new Map()
  rows.forEach((x) => {
    const key = `${String(x.date || '').trim()}|${String(x.timetableSlotId || '').trim()}`
    if (key !== '|') map.set(key, x)
  })
  return map
}
const ViewTimetableConfiguration = () => {
  const todayIso = useMemo(() => isoFromDate(new Date()), [])
  const [form, setForm] = useState(initialForm)
  const [viewType, setViewType] = useState(VIEW_TYPES.CLASS)
  const [showTimetable, setShowTimetable] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [classes, setClasses] = useState([])
  const [faculties, setFaculties] = useState([])
  const [allFaculties, setAllFaculties] = useState([])
  const [classTimetable, setClassTimetable] = useState(null)
  const [facultyRows, setFacultyRows] = useState([])
  const [dayMode, setDayMode] = useState('DAY_PATTERN')
  const [dayOptionsMap, setDayOptionsMap] = useState(new Map())
  const [dayDate, setDayDate] = useState(todayIso)
  const [weekStart, setWeekStart] = useState(todayIso)
  const [weekEnd, setWeekEnd] = useState(todayIso)
  const [downloadFormat, setDownloadFormat] = useState('XLSX')
  const [loading, setLoading] = useState(false)
  const [adjustmentLoading, setAdjustmentLoading] = useState(false)
  const [error, setError] = useState('')

  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustSource, setAdjustSource] = useState(null)
  const [adjustForm, setAdjustForm] = useState({ leaveType: 'LEAVE', leaveReason: '', replacementFacultyId: '' })
  const [savingAdjustment, setSavingAdjustment] = useState(false)

  const [adjustmentRows, setAdjustmentRows] = useState([])
  const [adjustmentSummary, setAdjustmentSummary] = useState({ totalAdjustedHours: 0, totalClassesAffected: 0, totalReplacementFaculty: 0 })

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])

  const scope = useMemo(
    () => ({
      institutionId: form.institutionId,
      academicYearId: form.academicYearId,
      departmentId: form.departmentId,
      programmeId: form.programmeId,
      regulationId: form.regulationId,
      batchId: form.batchId,
      semester: form.semester,
    }),
    [form],
  )

  useEffect(() => {
    ;(async () => {
      try {
        setInstitutions(await lmsService.listInstitutions())
      } catch {
        setError('Failed to load institutions')
      }
    })()
  }, [])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(form.academicYearId)) || null,
    [academicYears, form.academicYearId],
  )
  const semesterOptions = useMemo(() => semesterOptionsFromAcademicYear(selectedAcademicYear), [selectedAcademicYear])

  const timetable = useMemo(() => rows[0] || null, [rows])
  const classEntries = useMemo(() => classTimetable?.entries || [], [classTimetable])
  const hasClassEntries = useMemo(() => Boolean(classTimetable?.isPublished && classEntries.length > 0), [classTimetable, classEntries])
  const dayLabel = useMemo(() => (dayMode === 'DAY_ORDER_PATTERN' ? 'Day Order' : 'Day'), [dayMode])

  const filteredSlots = useMemo(() => {
    const slots = timetable?.slots || []
    if (viewType === VIEW_TYPES.CLASS) return slots
    const q = String(search).toLowerCase().trim()
    if (!q) return slots
    return slots.filter((x) => Object.values(x).join(' ').toLowerCase().includes(q))
  }, [timetable, search, viewType])

  const filteredClassEntries = useMemo(() => {
    if (viewType === VIEW_TYPES.CLASS) return classEntries
    const q = String(search).toLowerCase().trim()
    if (!q) return classEntries
    return classEntries.filter((x) => Object.values(x).join(' ').toLowerCase().includes(q))
  }, [classEntries, search, viewType])

  const filteredFacultyEntries = useMemo(() => {
    const q = String(search).toLowerCase().trim()
    if (!q) return facultyRows
    return facultyRows.filter((x) => Object.values(x).join(' ').toLowerCase().includes(q))
  }, [facultyRows, search])

  const dayWiseEntries = useMemo(() => {
    const weekday = weekdayIndexFromIso(dayDate)
    const rowsToFilter = classEntries.filter((x) => {
      const dates = Array.isArray(x.calendarDates) ? x.calendarDates : []
      if (dates.length) return dates.includes(dayDate)
      return Number(x.dayOfWeek || 0) === Number(weekday || 0)
    })
    const q = String(search).toLowerCase().trim()
    if (!q) return rowsToFilter
    return rowsToFilter.filter((x) => Object.values(x).join(' ').toLowerCase().includes(q))
  }, [classEntries, dayDate, search])

  const weeklyEntries = useMemo(() => {
    const rowsToFilter = classEntries.filter((x) => {
      const dates = Array.isArray(x.calendarDates) ? x.calendarDates : []
      if (dates.length) return dates.some((d) => inIsoRange(d, weekStart, weekEnd))
      const weekday = Number(x.dayOfWeek || 0)
      return dateListBetween(weekStart, weekEnd).some((d) => weekdayIndexFromIso(d) === weekday)
    })
    const q = String(search).toLowerCase().trim()
    if (!q) return rowsToFilter
    return rowsToFilter.filter((x) => Object.values(x).join(' ').toLowerCase().includes(q))
  }, [classEntries, weekStart, weekEnd, search])

  const adjustmentMap = useMemo(() => buildAdjustmentMap(adjustmentRows), [adjustmentRows])
  const onChange = (key) => async (e) => {
    const value = e.target.value
    setError('')

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
        programmeName: '',
        classId: '',
        facultyId: '',
      }))
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      setFaculties([])
      setAllFaculties([])
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
      setForm((p) => ({ ...p, departmentId: value, programmeId: '', regulationId: '', programmeName: '', classId: '', facultyId: '' }))
      setProgrammes([])
      setRegulations([])
      setFaculties([])
      if (!value || !form.institutionId) return
      try {
        setProgrammes(await lmsService.listProgrammes(form.institutionId, value))
      } catch {
        setError('Failed to load programmes')
      }
      return
    }

    if (key === 'programmeId') {
      const chosen = programmes.find((x) => String(x.id) === String(value))
      setForm((p) => ({ ...p, programmeId: value, regulationId: '', programmeName: chosen?.programmeName || '', classId: '', facultyId: '' }))
      setRegulations([])
      if (!value || !form.institutionId) return
      try {
        setRegulations(await lmsService.listRegulations(form.institutionId, value))
      } catch {
        setError('Failed to load regulations')
      }
      return
    }

    setForm((p) => ({ ...p, [key]: value }))
  }

  const onSearch = async () => {
    if (!form.institutionId || !form.academicYearId) {
      setError('Select at least Institution and Academic Year')
      return
    }
    try {
      setLoading(true)
      setError('')
      const [data, classRows, patterns, facultyList, allFacultyList] = await Promise.all([
        lmsService.listTimetables(scope),
        lmsService.listClassTimetableClasses(scope),
        lmsService.listAcademicCalendarPatterns(),
        lmsService.listFaculties({
          institutionId: form.institutionId,
          departmentId: form.departmentId,
          academicYearId: form.academicYearId,
        }),
        lmsService.listFaculties({
          institutionId: form.institutionId,
          departmentId: '',
          academicYearId: form.academicYearId,
        }),
      ])
      setRows(data)
      setClasses(classRows)
      setFaculties(facultyList)
      setAllFaculties(allFacultyList)

      const classId = classRows.some((x) => String(x.classId) === String(form.classId)) ? form.classId : classRows[0]?.classId || ''
      const facultyId = facultyList.some((x) => String(x.id) === String(form.facultyId)) ? form.facultyId : facultyList[0]?.id || ''
      setForm((p) => ({ ...p, classId, facultyId }))

      const ayPatterns = patterns.filter((x) => String(x?.academicYearId || '') === String(form.academicYearId))
      const sourcePatterns = ayPatterns.length ? ayPatterns : patterns
      const dayPatternRow = sourcePatterns.find((x) => normalizePattern(x?.calendarPattern).includes('DAY_PATTERN'))
      if (dayPatternRow) {
        const dayNames = String(dayPatternRow.day || '').split(',').map((d) => d.trim()).filter(Boolean)
        setDayMode('DAY_PATTERN')
        setDayOptionsMap(new Map(dayNames.map((name, idx) => [idx + 1, name])))
      } else {
        const orderRow = sourcePatterns.find((x) => normalizePattern(x?.calendarPattern).includes('DAY_ORDER'))
        const min = Number(orderRow?.minimumDayOrder || 1)
        const max = Number(orderRow?.maxDayOrder || Math.max(min, 6))
        const mapped = new Map()
        for (let i = min; i <= max; i += 1) mapped.set(i, String(i))
        setDayMode('DAY_ORDER_PATTERN')
        setDayOptionsMap(mapped)
      }

      if (!ayPatterns.length) setError('No Calendar Pattern found for selected Academic Year. Showing fallback Day Order mode.')
      setShowTimetable(true)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      if (!showTimetable || !form.classId) {
        setClassTimetable(null)
        return
      }
      try {
        setClassTimetable(await lmsService.getClassTimetableByClass(form.classId, scope))
      } catch {
        setClassTimetable(null)
      }
    })()
  }, [showTimetable, form.classId, scope])

  useEffect(() => {
    ;(async () => {
      if (!showTimetable || !form.facultyId) {
        setFacultyRows([])
        return
      }
      try {
        const data = await lmsService.getFacultyTimetableView(form.facultyId, scope)
        setFacultyRows(Array.isArray(data) ? data : [])
      } catch {
        setFacultyRows([])
      }
    })()
  }, [showTimetable, form.facultyId, scope])

  useEffect(() => {
    ;(async () => {
      if (!showTimetable || !form.classId) {
        setAdjustmentRows([])
        setAdjustmentSummary({ totalAdjustedHours: 0, totalClassesAffected: 0, totalReplacementFaculty: 0 })
        return
      }

      const needsAdjustments = [VIEW_TYPES.DAY_WISE, VIEW_TYPES.WEEKLY, VIEW_TYPES.ADJUSTMENT_REPORT].includes(viewType)
      if (!needsAdjustments) {
        setAdjustmentRows([])
        return
      }

      const filters =
        viewType === VIEW_TYPES.DAY_WISE
          ? { classId: form.classId, dateFrom: dayDate, dateTo: dayDate }
          : viewType === VIEW_TYPES.WEEKLY
            ? { classId: form.classId, dateFrom: weekStart, dateTo: weekEnd }
            : { classId: form.classId, dateFrom: weekStart, dateTo: weekEnd }

      try {
        setAdjustmentLoading(true)
        const res = await lmsService.listClassAdjustments(scope, filters)
        setAdjustmentRows(Array.isArray(res) ? res : [])
      } catch {
        setAdjustmentRows([])
      } finally {
        setAdjustmentLoading(false)
      }
    })()
  }, [showTimetable, form.classId, dayDate, weekStart, weekEnd, viewType, scope])
  const adjustmentSummaryComputed = useMemo(() => ({
    totalAdjustedHours: adjustmentRows.length,
    totalClassesAffected: new Set(adjustmentRows.map((x) => x.classId)).size,
    totalReplacementFaculty: new Set(adjustmentRows.map((x) => x.replacementFacultyId).filter(Boolean)).size,
  }), [adjustmentRows])

  const datedDayRows = useMemo(() => {
    return dayWiseEntries.map((entry) => {
      const key = `${dayDate}|${String(entry.timetableSlotId || '')}`
      const adj = adjustmentMap.get(key)
      return {
        ...entry,
        displayDate: dayDate,
        adjusted: !!adj,
        adjustment: adj || null,
        effectiveFacultyCode: adj?.replacementFacultyCode || entry.facultyCode,
        effectiveFacultyName: adj?.replacementFacultyName || entry.facultyName,
      }
    })
  }, [dayWiseEntries, dayDate, adjustmentMap])

  const datedWeeklyRows = useMemo(() => {
    const allDates = dateListBetween(weekStart, weekEnd)
    const out = []
    weeklyEntries.forEach((entry) => {
      const mapped = Array.isArray(entry.calendarDates) ? entry.calendarDates.filter((d) => inIsoRange(d, weekStart, weekEnd)) : []
      const dates = mapped.length
        ? mapped
        : allDates.filter((d) => Number(entry.dayOfWeek || 0) === Number(weekdayIndexFromIso(d) || 0))

      dates.forEach((d, idx) => {
        const key = `${d}|${String(entry.timetableSlotId || '')}`
        const adj = adjustmentMap.get(key)
        out.push({
          ...entry,
          id: `${entry.id}_${d}_${idx}`,
          displayDate: d,
          adjusted: !!adj,
          adjustment: adj || null,
          effectiveFacultyCode: adj?.replacementFacultyCode || entry.facultyCode,
          effectiveFacultyName: adj?.replacementFacultyName || entry.facultyName,
        })
      })
    })
    return out
  }, [weeklyEntries, weekStart, weekEnd, adjustmentMap])

  const reportRows = useMemo(() => {
    const q = String(search).toLowerCase().trim()
    if (!q) return adjustmentRows
    return adjustmentRows.filter((x) => Object.values(x).join(' ').toLowerCase().includes(q))
  }, [adjustmentRows, search])

  const activeColumns = useMemo(() => {
    if (viewType === VIEW_TYPES.CLASS) {
      if (hasClassEntries) {
        return [
          { key: 'day', label: dayLabel },
          { key: 'slot', label: 'Slot' },
          { key: 'time', label: 'Time' },
          { key: 'course', label: 'Course' },
          { key: 'faculty', label: 'Faculty' },
          { key: 'room', label: 'Room' },
          { key: 'type', label: 'Type' },
        ]
      }
      return [
        { key: 'slot', label: 'Slot' },
        { key: 'shift', label: 'Shift' },
        { key: 'time', label: 'Time' },
        { key: 'nomenclature', label: 'Nomenclature' },
      ]
    }
    if (viewType === VIEW_TYPES.FACULTY) {
      return [
        { key: 'day', label: dayLabel },
        { key: 'slot', label: 'Slot' },
        { key: 'time', label: 'Time' },
        { key: 'class', label: 'Class' },
        { key: 'course', label: 'Course' },
        { key: 'type', label: 'Type' },
      ]
    }
    if (viewType === VIEW_TYPES.ADJUSTMENT_REPORT) {
      return [
        { key: 'date', label: 'Date' },
        { key: 'class', label: 'Class' },
        { key: 'slot', label: 'Hour' },
        { key: 'course', label: 'Course' },
        { key: 'originalFaculty', label: 'Original Faculty' },
        { key: 'replacementFaculty', label: 'Replacement Faculty' },
        { key: 'leaveType', label: 'Leave Type' },
        { key: 'permissions', label: 'Permissions' },
      ]
    }

    return [
      { key: 'date', label: 'Date' },
      { key: 'day', label: dayLabel },
      { key: 'slot', label: 'Slot' },
      { key: 'time', label: 'Time' },
      { key: 'course', label: 'Course' },
      { key: 'faculty', label: 'Faculty' },
      { key: 'room', label: 'Room' },
      { key: 'type', label: 'Type' },
      { key: 'adjustment', label: 'Adjustment' },
      ...(viewType === VIEW_TYPES.DAY_WISE ? [{ key: 'actions', label: 'Actions', exportable: false }] : []),
    ]
  }, [viewType, hasClassEntries, dayLabel])

  const activeRows = useMemo(() => {
    if (viewType === VIEW_TYPES.CLASS) {
      if (hasClassEntries) {
        return filteredClassEntries.map((s) => ({
          id: s.id,
          day:
            dayOptionsMap.get(Number(s.dayOrder || s.dayOfWeek)) ||
            (dayMode === 'DAY_ORDER_PATTERN' ? `${Number(s.dayOrder || s.dayOfWeek || 0)}` : `Day ${Number(s.dayOfWeek || 0)}`),
          slot: s.slot?.priority ?? '-',
          time: `${s.slot?.timeFrom || '-'} - ${s.slot?.timeTo || '-'}`,
          course: (s.courseCode || '-') + (s.courseTitle ? ` - ${s.courseTitle}` : ''),
          faculty: (s.facultyCode || '-') + (s.facultyName ? ` - ${s.facultyName}` : ''),
          room: s.roomNumber || '-',
          type: s.periodType || '-',
          _raw: s,
        }))
      }
      return filteredSlots.map((s) => ({ id: s.id, slot: s.priority, shift: s.shiftName, time: `${s.timeFrom} - ${s.timeTo}`, nomenclature: s.nomenclature, _raw: s }))
    }

    if (viewType === VIEW_TYPES.FACULTY) {
      return filteredFacultyEntries.map((s) => ({
        id: s.id,
        day:
          dayOptionsMap.get(Number(s.dayOrder || s.dayOfWeek)) ||
          (dayMode === 'DAY_ORDER_PATTERN' ? `${Number(s.dayOrder || s.dayOfWeek || 0)}` : `Day ${Number(s.dayOfWeek || 0)}`),
        slot: s.slot?.priority ?? '-',
        time: `${s.slot?.timeFrom || '-'} - ${s.slot?.timeTo || '-'}`,
        class: `${s.className || '-'} ${s.classLabel || ''}`.trim(),
        course: (s.courseCode || '-') + (s.courseTitle ? ` - ${s.courseTitle}` : ''),
        type: s.periodType || '-',
        _raw: s,
      }))
    }

    if (viewType === VIEW_TYPES.ADJUSTMENT_REPORT) {
      return reportRows.map((r) => ({
        id: r.id,
        date: r.date || '-',
        class: `${r.className || '-'} ${r.classLabel || ''}`.trim(),
        slot: `${r.slot?.priority ?? '-'} (${r.slot?.timeFrom || '-'} - ${r.slot?.timeTo || '-'})`,
        course: (r.courseCode || '-') + (r.courseTitle ? ` - ${r.courseTitle}` : ''),
        originalFaculty: (r.originalFacultyCode || '-') + (r.originalFacultyName ? ` - ${r.originalFacultyName}` : ''),
        replacementFaculty: (r.replacementFacultyCode || '-') + (r.replacementFacultyName ? ` - ${r.replacementFacultyName}` : ''),
        leaveType: r.leaveType || '-',
        permissions: Array.isArray(r.permissionsGranted) ? r.permissionsGranted.join(', ') : '-',
        _raw: r,
      }))
    }

    const source = viewType === VIEW_TYPES.DAY_WISE ? datedDayRows : datedWeeklyRows
    return source.map((s) => ({
      id: s.id,
      date: s.displayDate || '-',
      day:
        dayOptionsMap.get(Number(s.dayOrder || s.dayOfWeek)) ||
        (dayMode === 'DAY_ORDER_PATTERN' ? `${Number(s.dayOrder || s.dayOfWeek || 0)}` : `Day ${Number(s.dayOfWeek || 0)}`),
      slot: s.slot?.priority ?? '-',
      time: `${s.slot?.timeFrom || '-'} - ${s.slot?.timeTo || '-'}`,
      course: (s.courseCode || '-') + (s.courseTitle ? ` - ${s.courseTitle}` : ''),
      faculty: (s.effectiveFacultyCode || '-') + (s.effectiveFacultyName ? ` - ${s.effectiveFacultyName}` : ''),
      room: s.roomNumber || '-',
      type: s.periodType || '-',
      adjustment: s.adjusted ? `${s.adjustment?.leaveType || 'ADJUSTED'}: ${s.adjustment?.originalFacultyCode || '-'} -> ${s.adjustment?.replacementFacultyCode || '-'}` : 'Normal',
      actions: s.adjusted ? 'Remove Adjustment' : 'Adjust Hour',
      isAdjusted: s.adjusted,
      _raw: s,
    }))
  }, [
    viewType,
    hasClassEntries,
    filteredClassEntries,
    filteredSlots,
    filteredFacultyEntries,
    dayMode,
    dayOptionsMap,
    datedDayRows,
    datedWeeklyRows,
    reportRows,
  ])
  const scopeSubtitle = useMemo(() => {
    if (!timetable) return '-'
    return `${timetable.academicYear || '-'} | ${timetable.programmeCode || '-'} | ${timetable.semester ? `Sem - ${timetable.semester}` : '-'}`
  }, [timetable])

  const selectedViewLabel = useMemo(() => {
    if (viewType === VIEW_TYPES.CLASS) return 'Class Timetable'
    if (viewType === VIEW_TYPES.FACULTY) return 'Faculty Timetable'
    if (viewType === VIEW_TYPES.DAY_WISE) return `Day-wise Timetable (${dayDate || '-'})`
    if (viewType === VIEW_TYPES.WEEKLY) return `Weekly Timetable (${weekStart || '-'} to ${weekEnd || '-'})`
    return `Class Adjustment Report (${weekStart || '-'} to ${weekEnd || '-'})`
  }, [viewType, dayDate, weekStart, weekEnd])

  const onOpenAdjustModal = (rowRaw) => {
    const originalFacultyId = rowRaw?.facultyId || ''
    const preferred = allFaculties.find((f) => String(f.id) !== String(originalFacultyId))
    setAdjustSource(rowRaw)
    setAdjustForm({
      leaveType: 'LEAVE',
      leaveReason: '',
      replacementFacultyId: preferred?.id || '',
    })
    setShowAdjustModal(true)
  }

  const onSaveAdjustment = async () => {
    if (!adjustSource?.id || !adjustSource?.timetableSlotId || !adjustForm.replacementFacultyId || !dayDate) {
      setError('Choose replacement faculty and valid day-wise class hour')
      return
    }
    try {
      setSavingAdjustment(true)
      setError('')
      await lmsService.createClassAdjustment(scope, {
        classId: form.classId,
        classTimetableEntryId: adjustSource.id,
        timetableSlotId: adjustSource.timetableSlotId,
        replacementFacultyId: adjustForm.replacementFacultyId,
        leaveType: adjustForm.leaveType,
        leaveReason: adjustForm.leaveReason,
        date: dayDate,
      })
      setShowAdjustModal(false)
      const fresh = await lmsService.listClassAdjustments(scope, { classId: form.classId, dateFrom: dayDate, dateTo: dayDate })
      setAdjustmentRows(Array.isArray(fresh) ? fresh : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save class adjustment')
    } finally {
      setSavingAdjustment(false)
    }
  }

  const onDeleteAdjustment = async (adjustmentId) => {
    if (!adjustmentId) return
    if (!window.confirm('Remove this class adjustment?')) return
    try {
      await lmsService.deleteClassAdjustment(adjustmentId, scope)
      const fresh = await lmsService.listClassAdjustments(scope, {
        classId: form.classId,
        dateFrom: viewType === VIEW_TYPES.DAY_WISE ? dayDate : weekStart,
        dateTo: viewType === VIEW_TYPES.DAY_WISE ? dayDate : weekEnd,
      })
      setAdjustmentRows(Array.isArray(fresh) ? fresh : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to remove class adjustment')
    }
  }

  const onDownload = async () => {
    try {
      const exportCols = activeColumns.filter((x) => x.exportable !== false)
      const exportRows = activeRows.map((row) =>
        exportCols.reduce((acc, col) => {
          acc[col.label] = row[col.key] ?? ''
          return acc
        }, {}),
      )

      if (downloadFormat === 'XLSX') {
        const mod = await import('xlsx')
        const XLSX = mod.default ?? mod
        const ws = XLSX.utils.json_to_sheet(exportRows.length ? exportRows : [{}])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Timetable')
        const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${viewType}_Report.xlsx`)
        return
      }

      const html = buildPreviewHtml({ title: selectedViewLabel, subtitle: scopeSubtitle, columns: exportCols, rows: activeRows })
      if (downloadFormat === 'DOC') {
        downloadBlob(new Blob([html], { type: 'application/msword;charset=utf-8' }), `${viewType}_Report.doc`)
        return
      }
      openPreviewDocument(html, setError)
    } catch {
      setError('Failed to download data')
    }
  }

  const onPrint = () => {
    const cols = activeColumns.filter((x) => x.exportable !== false)
    const html = buildPreviewHtml({ title: selectedViewLabel, subtitle: scopeSubtitle, columns: cols, rows: activeRows })
    openPreviewDocument(html, setError)
  }
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader>
            <strong>View Timetable</strong>
          </CCardHeader>
          <CCardBody>
            {error ? <CAlert color="danger">{error}</CAlert> : null}
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Institution</CFormLabel></CCol>
                <CCol md={3}><CFormSelect value={form.institutionId} onChange={onChange('institutionId')}><option value="">Select Institution</option>{institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</CFormSelect></CCol>

                <CCol md={3}><CFormLabel>Department</CFormLabel></CCol>
                <CCol md={3}><CFormSelect value={form.departmentId} onChange={onChange('departmentId')}><option value="">All Departments</option>{departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}</CFormSelect></CCol>

                <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
                <CCol md={3}><CFormSelect value={form.programmeId} onChange={onChange('programmeId')}><option value="">All Programmes</option>{programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode}</option>)}</CFormSelect></CCol>

                <CCol md={3}><CFormLabel>Regulation</CFormLabel></CCol>
                <CCol md={3}><CFormSelect value={form.regulationId} onChange={onChange('regulationId')}><option value="">All Regulations</option>{regulations.map((x) => <option key={x.id} value={x.id}>{x.regulationCode}</option>)}</CFormSelect></CCol>

                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}><CFormSelect value={form.academicYearId} onChange={onChange('academicYearId')}><option value="">Select Academic Year</option>{academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || `${x.academicYear}${x.semesterCategory ? ` (${x.semesterCategory})` : ''}`}</option>)}</CFormSelect></CCol>

                <CCol md={3}><CFormLabel>Batch</CFormLabel></CCol>
                <CCol md={3}><CFormSelect value={form.batchId} onChange={onChange('batchId')}><option value="">All Batches</option>{batches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}</CFormSelect></CCol>

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}><CFormSelect value={form.semester} onChange={onChange('semester')}><option value="">All Semesters</option>{semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</CFormSelect></CCol>

                <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.programmeName || '-'} disabled /></CCol>

                <CCol md={3}><CFormLabel>View Type</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={viewType} onChange={(e) => setViewType(e.target.value)}>
                    <option value={VIEW_TYPES.CLASS}>Class Timetable</option>
                    <option value={VIEW_TYPES.FACULTY}>Individual Faculty Timetable</option>
                    <option value={VIEW_TYPES.DAY_WISE}>Day-wise Timetable</option>
                    <option value={VIEW_TYPES.WEEKLY}>Weekly Timetable</option>
                    <option value={VIEW_TYPES.ADJUSTMENT_REPORT}>Class Adjustment Report</option>
                  </CFormSelect>
                </CCol>

                {(viewType !== VIEW_TYPES.FACULTY) ? (
                  <>
                    <CCol md={3}><CFormLabel>Class</CFormLabel></CCol>
                    <CCol md={3}><CFormSelect value={form.classId} onChange={onChange('classId')} disabled={!classes.length}><option value="">Select Class</option>{classes.map((c) => <option key={c.classId} value={c.classId}>{c.className} {c.classLabel || ''}</option>)}</CFormSelect></CCol>
                  </>
                ) : null}

                {viewType === VIEW_TYPES.FACULTY ? (
                  <>
                    <CCol md={3}><CFormLabel>Faculty</CFormLabel></CCol>
                    <CCol md={3}><CFormSelect value={form.facultyId} onChange={onChange('facultyId')} disabled={!faculties.length}><option value="">Select Faculty</option>{faculties.map((f) => <option key={f.id} value={f.id}>{(f.facultyCode || '-') + (f.facultyName ? ` - ${f.facultyName}` : '')}</option>)}</CFormSelect></CCol>
                  </>
                ) : null}

                {viewType === VIEW_TYPES.DAY_WISE ? (<><CCol md={3}><CFormLabel>Date</CFormLabel></CCol><CCol md={3}><CFormInput type="date" value={dayDate} onChange={(e) => setDayDate(e.target.value)} /></CCol></>) : null}
                {(viewType === VIEW_TYPES.WEEKLY || viewType === VIEW_TYPES.ADJUSTMENT_REPORT) ? (<><CCol md={3}><CFormLabel>From Date</CFormLabel></CCol><CCol md={3}><CFormInput type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} /></CCol><CCol md={3}><CFormLabel>To Date</CFormLabel></CCol><CCol md={3}><CFormInput type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} /></CCol></>) : null}

                <CCol md={3}><CFormLabel>Action</CFormLabel></CCol>
                <CCol md={9} className="d-flex flex-wrap gap-2">
                  <ArpButton label={loading ? 'Loading...' : 'Search'} icon="search" color="primary" onClick={onSearch} disabled={loading} />
                  <CFormSelect value={downloadFormat} onChange={(e) => setDownloadFormat(e.target.value)} style={{ maxWidth: 140 }} disabled={!showTimetable}><option value="XLSX">XLSX</option><option value="DOC">DOC</option><option value="PDF">PDF</option></CFormSelect>
                  <ArpButton label="Download" icon="download" color="success" onClick={onDownload} disabled={!showTimetable} />
                  <ArpButton label="Print" icon="print" color="secondary" onClick={onPrint} disabled={!showTimetable} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {showTimetable && timetable ? (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div className="d-flex gap-3 flex-wrap">
                <strong>{selectedViewLabel}</strong>
                <strong>{scopeSubtitle}</strong>
                {viewType === VIEW_TYPES.ADJUSTMENT_REPORT ? (
                  <CBadge color="info">Adjusted Hours: {adjustmentSummaryComputed.totalAdjustedHours}</CBadge>
                ) : null}
              </div>
            </CCardHeader>
            <CCardBody>
              {viewType !== VIEW_TYPES.CLASS ? (
                <CInputGroup size="sm" className="mb-2" style={{ maxWidth: 280 }}>
                  <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                  <CFormInput placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
                </CInputGroup>
              ) : null}

              {adjustmentLoading ? <div className="mb-2 d-flex align-items-center gap-2"><CSpinner size="sm" /><span>Loading adjustment details...</span></div> : null}
              {viewType === VIEW_TYPES.DAY_WISE ? <CAlert color="info" className="mb-2">Click <strong>Adjust Hour</strong> to assign temporary replacement faculty for this date. Adjusted rows are highlighted.</CAlert> : null}

              {viewType === VIEW_TYPES.CLASS ? (
                <ArpDataTable
                  className=""
                  title={selectedViewLabel}
                  rows={activeRows}
                  columns={activeColumns.map((col) => ({ ...col, sortable: true }))}
                  searchable={true}
                  searchPlaceholder="Search class timetable..."
                  rowKey="id"
                  scopedColumns={{
                    time: (row) => (
                      <button
                        type="button"
                        className="btn btn-link p-0 text-decoration-none"
                        onClick={() => {
                          setSelectedSlot(row._raw || null)
                          setShowModal(true)
                        }}
                      >
                        {row.time || '-'}
                      </button>
                    ),
                  }}
                />
              ) : (
                <CTable bordered responsive>
                  <CTableHead><CTableRow>{activeColumns.map((col) => <CTableHeaderCell key={col.key}>{col.label}</CTableHeaderCell>)}</CTableRow></CTableHead>
                  <CTableBody>
                    {activeRows.map((r) => (
                      <CTableRow key={r.id} style={r.isAdjusted ? { backgroundColor: '#fff3cd' } : undefined}>
                        {activeColumns.map((col) => (
                          <CTableDataCell key={`${r.id}_${col.key}`} onClick={col.key === 'time' ? () => { setSelectedSlot(r._raw || null); setShowModal(true) } : undefined} className={col.key === 'time' ? 'text-primary' : ''} style={col.key === 'time' ? { cursor: 'pointer' } : undefined}>
                            {col.key === 'actions' && viewType === VIEW_TYPES.DAY_WISE ? (
                              r.isAdjusted
                                ? <ArpButton label="Remove" icon="delete" color="danger" onClick={() => onDeleteAdjustment(r._raw?.adjustment?.id)} />
                                : <ArpButton label="Adjust Hour" icon="edit" color="warning" onClick={() => onOpenAdjustModal(r._raw)} />
                            ) : (
                              r[col.key] ?? '-'
                            )}
                          </CTableDataCell>
                        ))}
                      </CTableRow>
                    ))}
                    {!activeRows.length ? <CTableRow><CTableDataCell colSpan={activeColumns.length} className="text-center text-medium-emphasis">No records found</CTableDataCell></CTableRow> : null}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        ) : null}
        <CModal visible={showModal} onClose={() => setShowModal(false)}>
          <CModalHeader><CModalTitle>Timetable Slot Detail</CModalTitle></CModalHeader>
          <CModalBody>
            <p><strong>{dayLabel}:</strong> {dayOptionsMap.get(Number(selectedSlot?.dayOrder || selectedSlot?.dayOfWeek)) || (dayMode === 'DAY_ORDER_PATTERN' ? `${Number(selectedSlot?.dayOrder || selectedSlot?.dayOfWeek || 0)}` : `Day ${Number(selectedSlot?.dayOfWeek || 0)}`)}</p>
            <p><strong>Date:</strong> {selectedSlot?.displayDate || selectedSlot?.date || '-'}</p>
            <p><strong>Time:</strong> {selectedSlot ? `${selectedSlot?.slot?.timeFrom || selectedSlot?.timeFrom || '-'} - ${selectedSlot?.slot?.timeTo || selectedSlot?.timeTo || '-'}` : '-'}</p>
            <p><strong>Course:</strong> {(selectedSlot?.courseCode || '-') + (selectedSlot?.courseTitle ? ` - ${selectedSlot?.courseTitle}` : '')}</p>
            <p><strong>Faculty:</strong> {(selectedSlot?.effectiveFacultyCode || selectedSlot?.facultyCode || '-') + ((selectedSlot?.effectiveFacultyName || selectedSlot?.facultyName) ? ` - ${selectedSlot?.effectiveFacultyName || selectedSlot?.facultyName}` : '')}</p>
            {selectedSlot?.adjustment ? <p><strong>Adjustment:</strong> {selectedSlot.adjustment.leaveType} ({selectedSlot.adjustment.originalFacultyCode} to {selectedSlot.adjustment.replacementFacultyCode})</p> : null}
          </CModalBody>
        </CModal>

        <CModal visible={showAdjustModal} onClose={() => setShowAdjustModal(false)}>
          <CModalHeader><CModalTitle>Adjust Class Hour</CModalTitle></CModalHeader>
          <CModalBody>
            <p><strong>Date:</strong> {dayDate || '-'}</p>
            <p><strong>Hour:</strong> {adjustSource?.slot?.priority ?? '-'} ({adjustSource?.slot?.timeFrom || '-'} - {adjustSource?.slot?.timeTo || '-'})</p>
            <p><strong>Original Faculty:</strong> {(adjustSource?.facultyCode || '-') + (adjustSource?.facultyName ? ` - ${adjustSource?.facultyName}` : '')}</p>

            <CRow className="g-3">
              <CCol md={4}><CFormLabel>Leave Type</CFormLabel></CCol>
              <CCol md={8}><CFormSelect value={adjustForm.leaveType} onChange={(e) => setAdjustForm((p) => ({ ...p, leaveType: e.target.value }))}>{LEAVE_TYPE_OPTIONS.map((x) => <option key={x} value={x}>{x}</option>)}</CFormSelect></CCol>

              <CCol md={4}><CFormLabel>Leave Reason</CFormLabel></CCol>
              <CCol md={8}><CFormInput value={adjustForm.leaveReason} onChange={(e) => setAdjustForm((p) => ({ ...p, leaveReason: e.target.value }))} placeholder="Optional" /></CCol>

              <CCol md={4}><CFormLabel>Replacement Faculty</CFormLabel></CCol>
              <CCol md={8}>
                <CFormSelect value={adjustForm.replacementFacultyId} onChange={(e) => setAdjustForm((p) => ({ ...p, replacementFacultyId: e.target.value }))}>
                  <option value="">Select Faculty</option>
                  {allFaculties.filter((f) => String(f.id) !== String(adjustSource?.facultyId)).map((f) => <option key={f.id} value={f.id}>{(f.facultyCode || '-') + (f.facultyName ? ` - ${f.facultyName}` : '')}{f.departmentName ? ` (${f.departmentName})` : ''}</option>)}
                </CFormSelect>
              </CCol>
            </CRow>

            <CAlert color="success" className="mt-3 mb-0">
              Replacement faculty will receive temporary permissions for this class on {dayDate}: Attendance, Mark Entry, CIA Entry, and Class Activity.
            </CAlert>

            <div className="mt-3 d-flex gap-2">
              <ArpButton label={savingAdjustment ? 'Saving...' : 'Save Adjustment'} icon="save" color="success" onClick={onSaveAdjustment} disabled={savingAdjustment} />
              <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={() => setShowAdjustModal(false)} />
            </div>
          </CModalBody>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default ViewTimetableConfiguration
