import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormLabel,
  CFormSelect,
  CRow,
} from '@coreui/react-pro'

import { ArpButton, ArpDataTable, ArpIconButton, ArpToastStack } from '../../components/common'
import api from '../../services/apiClient'
import { deleteIAWorkflowBundle, listIAWorkflowRecords } from '../../services/iaWorkflowService'
import { resolveCurrentIARole } from './iaRoleAccess'

const phaseLocalKeys = {
  PHASE_1_SETUP: 'arp.evaluation.ia.phase1.setup.draft.v1',
  PHASE_2_SCHEDULE: 'arp.evaluation.ia.phase2.schedule.draft.v1',
  PHASE_3_VALIDATION: 'arp.evaluation.ia.phase3.validation.draft.v1',
  PHASE_4_PUBLISH: 'arp.evaluation.ia.phase4.publish.draft.v1',
  PHASE_5_OPERATIONS: 'arp.evaluation.ia.phase5.operations.draft.v1',
  PHASE_6_MARK_ENTRY: 'arp.evaluation.ia.phase6.mark-entry.draft.v1',
  PHASE_7_RESULT_ANALYSIS: 'arp.evaluation.ia.phase7.result-analysis.draft.v1',
}

const phasePaths = {
  PHASE_1_SETUP: '/evaluation/ia/setup',
  PHASE_2_SCHEDULE: '/evaluation/ia/schedule-planning',
  PHASE_3_VALIDATION: '/evaluation/ia/conflict-validation',
  PHASE_4_PUBLISH: '/evaluation/ia/publish',
  PHASE_5_OPERATIONS: '/evaluation/ia/operations',
  PHASE_6_MARK_ENTRY: '/evaluation/ia/mark-entry',
  PHASE_7_RESULT_ANALYSIS: '/evaluation/ia/result-analysis',
}

const statusColor = (status) => {
  const s = String(status || '').toUpperCase()
  if (!s) return 'secondary'
  if (s.includes('READY') || s === 'PUBLISHED' || s === 'READY_FOR_EVALUATION_FLOW' || s === 'IA_RESULT_ANALYSIS_COMPLETED') return 'success'
  if (s === 'DRAFT' || s.includes('PROGRESS')) return 'warning'
  return 'info'
}

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const escapeHtml = (input) =>
  String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatDateDDMMYYYY = (value) => {
  const raw = String(value || '').trim()
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  return raw || '-'
}

const toText = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) {
    const items = value
      .map((item) => toText(item, ''))
      .filter((item) => String(item || '').trim())
    return items.length > 0 ? items.join(', ') : fallback
  }
  if (typeof value === 'object') {
    if (typeof value.toISOString === 'function') {
      try {
        return value.toISOString()
      } catch {
        return fallback
      }
    }
    if (typeof value.label === 'string' && value.label.trim()) return value.label
    if (typeof value.name === 'string' && value.name.trim()) return value.name
    if (typeof value.value === 'string' && value.value.trim()) return value.value
    return fallback
  }
  return fallback
}

const IARecordsAdmin = () => {
  const navigate = useNavigate()
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState([])
  const [selectedBundleKey, setSelectedBundleKey] = useState('')
  const [institutions, setInstitutions] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [iaCycleOptions, setIaCycleOptions] = useState([])
  const [scope, setScope] = useState({
    institutionId: '',
    academicYearId: '',
    chosenSemester: '',
    programmeId: '',
    iaCycle: '',
  })

  const isAdminUser = resolveCurrentIARole() === 'ADMIN'

  const showToast = (type, message) => {
    setToast({
      type,
      message,
      autohide: type === 'success',
      delay: 4500,
    })
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/api/setup/institution')
        setInstitutions(unwrapList(res))
      } catch {
        setInstitutions([])
      }
    })()
  }, [])

  useEffect(() => {
    if (!scope.institutionId) {
      setAcademicYears([])
      setProgrammes([])
      setIaCycleOptions([])
      return
    }
    ;(async () => {
      try {
        const ayRes = await api.get('/api/setup/academic-year', {
          headers: { 'x-institution-id': scope.institutionId },
        })
        setAcademicYears(unwrapList(ayRes))
      } catch {
        setAcademicYears([])
      }
      try {
        const pRes = await api.get('/api/setup/programme')
        const rows = unwrapList(pRes).filter((x) => String(x.institutionId) === String(scope.institutionId))
        setProgrammes(rows)
      } catch {
        setProgrammes([])
      }
      try {
        const cRes = await api.get('/api/setup/cia-components', { params: { institutionId: scope.institutionId } })
        const rows = Array.isArray(cRes?.data?.data?.components) ? cRes.data.data.components : []
        const options = [...new Set(rows.map((x) => String(x?.examName || '').trim()).filter(Boolean))]
          .map((name) => ({ value: name, label: name }))
        setIaCycleOptions(options)
      } catch {
        setIaCycleOptions([])
      }
    })()
  }, [scope.institutionId])

  const loadRecords = async () => {
    if (!isAdminUser) return
    setLoading(true)
    try {
      const rows = await listIAWorkflowRecords(scope)
      setRecords(Array.isArray(rows) ? rows : [])
    } catch {
      setRecords([])
      showToast('danger', 'Unable to load IA workflow bundles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.institutionId, scope.academicYearId, scope.chosenSemester, scope.programmeId, scope.iaCycle, isAdminUser])

  const groupedBundles = useMemo(() => {
    const map = new Map()
    records.forEach((record) => {
      const key = [
        toText(record.institutionId, ''),
        toText(record.academicYearId, ''),
        toText(record.chosenSemester, ''),
        toText(record.programmeId, ''),
        toText(record.iaCycle, ''),
      ].join('|')
      if (!map.has(key)) {
        map.set(key, {
          key,
          institutionId: toText(record.institutionId, ''),
          academicYearId: toText(record.academicYearId, ''),
          chosenSemester: toText(record.chosenSemester, ''),
          programmeId: toText(record.programmeId, ''),
          iaCycle: toText(record.iaCycle, ''),
          phases: {},
          updatedAt: toText(record.updatedAt, ''),
        })
      }
      const bundle = map.get(key)
      bundle.phases[record.phaseKey] = record
      if (String(toText(record.updatedAt, '')) > String(bundle.updatedAt || '')) {
        bundle.updatedAt = toText(record.updatedAt, '')
      }
    })
    return [...map.values()].sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
  }, [records])

  useEffect(() => {
    if (!groupedBundles.length) {
      setSelectedBundleKey('')
      return
    }
    if (!groupedBundles.some((bundle) => bundle.key === selectedBundleKey)) {
      setSelectedBundleKey(groupedBundles[0].key)
    }
  }, [groupedBundles, selectedBundleKey])

  const institutionNameById = useMemo(
    () => Object.fromEntries(institutions.map((x) => [String(x.id), x.name || x.id])),
    [institutions],
  )

  const programmeNameById = useMemo(
    () => Object.fromEntries(programmes.map((x) => [String(x.id), `${x.programmeCode || ''} - ${x.programmeName || ''}`.trim()])),
    [programmes],
  )

  const formatProgrammeScope = (bundle) => {
    const raw = toText(bundle?.programmeId, '')
    if (!raw) return 'All Programmes'
    if (raw === '__ALL__') return 'All Programmes'
    if (raw.startsWith('__MULTI__:')) return 'Multiple Programmes'
    return programmeNameById[raw] || raw
  }

  const selectedBundle = useMemo(
    () => groupedBundles.find((bundle) => bundle.key === selectedBundleKey) || null,
    [groupedBundles, selectedBundleKey],
  )

  const bundleRows = useMemo(
    () => groupedBundles.map((bundle) => ({
      ...bundle,
      academicYearSemesterText: `${
        toText(bundle.phases.PHASE_1_SETUP?.payload?.academicYearLabel, '') ||
        toText(bundle.phases.PHASE_1_SETUP?.payload?.workflowScope?.academicYearLabel, '') ||
        toText(bundle.academicYearId)
      }${
        (
          toText(bundle.phases.PHASE_1_SETUP?.payload?.semesterCategory, '') ||
          toText(bundle.phases.PHASE_1_SETUP?.payload?.workflowScope?.semesterCategory, '')
        )
          ? ` / ${
              toText(bundle.phases.PHASE_1_SETUP?.payload?.semesterCategory, '') ||
              toText(bundle.phases.PHASE_1_SETUP?.payload?.workflowScope?.semesterCategory, '')
            }`
          : ''
      }`,
      examWindowText:
        toText(bundle.phases.PHASE_1_SETUP?.payload?.examWindowName, '') ||
        toText(bundle.phases.PHASE_1_SETUP?.payload?.workflowScope?.examWindowName, '') ||
        '-',
      programmeScopeLabel: formatProgrammeScope(bundle),
      updatedAtText: toText(bundle.updatedAt),
      phase1Status: toText(bundle.phases.PHASE_1_SETUP?.workflowStatus),
      phase2Status: toText(bundle.phases.PHASE_2_SCHEDULE?.workflowStatus),
      phase3Status: toText(bundle.phases.PHASE_3_VALIDATION?.workflowStatus),
      phase4Status: toText(bundle.phases.PHASE_4_PUBLISH?.workflowStatus),
      phase5Status: toText(bundle.phases.PHASE_5_OPERATIONS?.workflowStatus),
      phase6Status: toText(bundle.phases.PHASE_6_MARK_ENTRY?.workflowStatus),
      phase7Status: toText(bundle.phases.PHASE_7_RESULT_ANALYSIS?.workflowStatus),
      iaCycleText: toText(bundle.iaCycle),
      semesterText: toText(bundle.chosenSemester),
    })),
    [groupedBundles],
  )

  const bundleColumns = useMemo(
    () => [
      { key: 'iaCycleText', label: 'Examination', sortable: true, sortType: 'string' },
      { key: 'examWindowText', label: 'Exam Month & Year', sortable: true, sortType: 'string' },
      { key: 'academicYearSemesterText', label: 'Academic Year / Semester', sortable: true, sortType: 'string' },
      { key: 'programmeScopeLabel', label: 'Programme', sortable: true, sortType: 'string' },
      { key: 'semesterText', label: 'Semester', sortable: true, sortType: 'string', align: 'center', width: 100 },
      {
        key: 'phase1Status',
        label: 'P1',
        align: 'center',
        width: 100,
        render: (row) => <CBadge color={statusColor(row.phase1Status)}>{row.phase1Status}</CBadge>,
      },
      {
        key: 'phase2Status',
        label: 'P2',
        align: 'center',
        width: 100,
        render: (row) => <CBadge color={statusColor(row.phase2Status)}>{row.phase2Status}</CBadge>,
      },
      {
        key: 'phase3Status',
        label: 'P3',
        align: 'center',
        width: 100,
        render: (row) => <CBadge color={statusColor(row.phase3Status)}>{row.phase3Status}</CBadge>,
      },
      {
        key: 'phase4Status',
        label: 'P4',
        align: 'center',
        width: 100,
        render: (row) => <CBadge color={statusColor(row.phase4Status)}>{row.phase4Status}</CBadge>,
      },
      {
        key: 'phase5Status',
        label: 'P5',
        align: 'center',
        width: 100,
        render: (row) => <CBadge color={statusColor(row.phase5Status)}>{row.phase5Status}</CBadge>,
      },
      {
        key: 'phase6Status',
        label: 'P6',
        align: 'center',
        width: 100,
        render: (row) => <CBadge color={statusColor(row.phase6Status)}>{row.phase6Status}</CBadge>,
      },
      {
        key: 'phase7Status',
        label: 'P7',
        align: 'center',
        width: 120,
        render: (row) => <CBadge color={statusColor(row.phase7Status)}>{row.phase7Status}</CBadge>,
      },
      { key: 'updatedAtText', label: 'Updated At', sortable: true, sortType: 'string', width: 190 },
    ],
    [],
  )

  const openBundle = (bundle) => {
    const lastPhase = ['PHASE_7_RESULT_ANALYSIS', 'PHASE_6_MARK_ENTRY', 'PHASE_5_OPERATIONS', 'PHASE_4_PUBLISH', 'PHASE_3_VALIDATION', 'PHASE_2_SCHEDULE', 'PHASE_1_SETUP']
      .find((phaseKey) => Boolean(bundle.phases[phaseKey]))
    const target = bundle.phases[lastPhase || 'PHASE_1_SETUP']
    if (!target) return

    Object.entries(bundle.phases).forEach(([phaseKey, record]) => {
      const localKey = phaseLocalKeys[phaseKey]
      if (!localKey) return
      window.sessionStorage.setItem(localKey, JSON.stringify({
        ...(record.payload || {}),
        status: record.payload?.status || record.workflowStatus || 'DRAFT',
      }))
    })

    const workflowScope = target.payload?.workflowScope || {}
    window.sessionStorage.setItem(
      phaseLocalKeys.PHASE_1_SETUP,
      JSON.stringify({
        ...workflowScope,
        institutionId: bundle.institutionId || workflowScope.institutionId || '',
        academicYearId: bundle.academicYearId || workflowScope.academicYearId || '',
        chosenSemester: bundle.chosenSemester || workflowScope.chosenSemester || '',
        programmeId: bundle.programmeId || workflowScope.programmeId || '',
        programmeScopeKey: bundle.programmeId || workflowScope.programmeId || '',
        iaCycle: bundle.iaCycle || workflowScope.iaCycle || workflowScope.examName || '',
        examName: bundle.iaCycle || workflowScope.examName || workflowScope.iaCycle || '',
      }),
    )

    navigate(phasePaths[lastPhase || 'PHASE_1_SETUP'])
  }

  const downloadBundle = (bundle) => {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `IA_Bundle_${bundle.iaCycle || 'Record'}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const onDeleteBundle = async (bundle) => {
    const ok = window.confirm(`Delete complete IA bundle for ${bundle.iaCycle || '-'}?`)
    if (!ok) return
    try {
      await deleteIAWorkflowBundle({
        institutionId: bundle.institutionId,
        academicYearId: bundle.academicYearId,
        chosenSemester: bundle.chosenSemester,
        programmeId: bundle.programmeId,
        iaCycle: bundle.iaCycle,
      })
      showToast('success', 'IA workflow bundle deleted.')
      loadRecords()
    } catch {
      showToast('danger', 'Unable to delete IA workflow bundle.')
    }
  }

  const buildScheduleRows = (bundle) => {
    const phase4 = bundle.phases.PHASE_4_PUBLISH?.payload || {}
    const phase3 = bundle.phases.PHASE_3_VALIDATION?.payload || {}
    const slots = Array.isArray(phase4?.snapshot?.slots) ? phase4.snapshot.slots : Array.isArray(phase3?.slots) ? phase3.slots : []
    const courses = Array.isArray(phase4?.snapshot?.courses) ? phase4.snapshot.courses : Array.isArray(phase3?.courses) ? phase3.courses : []
    const slotById = Object.fromEntries(slots.map((slot) => [String(slot.id), slot]))
    const sessionOrder = { FN: 1, AN: 2 }
    return courses
      .map((course) => {
        const slot = slotById[String(course.slotId || '')] || {}
        const programmeLabel = course.programmeCode && course.programmeName
          ? `${course.programmeCode} - ${course.programmeName}`
          : programmeNameById[String(course.programmeId || bundle.programmeId || '')] || '-'
        return {
          courseCode: course.code || '-',
          courseName: course.name || '-',
          programme: programmeLabel,
          semester: course.semester || bundle.chosenSemester || '-',
          date: slot.date || '-',
          session: slot.session || '-',
          time: slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : '-',
          venue: slot.venue || '-',
          strength: Number(course.students || 0),
          sortDate: String(slot.date || ''),
          sortSession: Number(sessionOrder[String(slot.session || '').toUpperCase()] || 99),
          sortStart: String(slot.startTime || ''),
        }
      })
      .sort((a, b) => {
        if (a.sortDate !== b.sortDate) return a.sortDate.localeCompare(b.sortDate)
        if (a.sortSession !== b.sortSession) return a.sortSession - b.sortSession
        return a.sortStart.localeCompare(b.sortStart)
      })
  }

  const printScheduleReport = (bundle) => {
    const phase4 = bundle.phases.PHASE_4_PUBLISH?.payload || {}
    const rows = buildScheduleRows(bundle)
    if (rows.length === 0) {
      showToast('warning', 'No schedule data available in selected bundle.')
      return
    }
    const institutionName = institutionNameById[String(bundle.institutionId || '')] || bundle.institutionId || 'Institution'
    const publishDate = formatDateDDMMYYYY(phase4.publishDate)
    const signatoryName = phase4.signatoryName || ''
    const signatoryDesignation = phase4.signatoryDesignation || 'Authorized Signatory (Examination)'
    const principalName = phase4.principalName || ''
    const principalDesignation = phase4.principalDesignation || 'Principal'
    const officialSealText = phase4.officialSealText || 'Official Seal'
    const bodyRows = rows.map((row, idx) => `
      <tr>
        <td style="border:1px solid #cbd5e1;padding:6px;text-align:center;">${idx + 1}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;">${escapeHtml(row.courseCode)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;">${escapeHtml(row.courseName)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;">${escapeHtml(row.programme)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;text-align:center;">${escapeHtml(row.semester)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;text-align:center;">${escapeHtml(row.date)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;text-align:center;">${escapeHtml(row.session)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;text-align:center;">${escapeHtml(row.time)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;">${escapeHtml(row.venue)}</td>
        <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;">${row.strength}</td>
      </tr>
    `).join('')
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>IA Schedule Report</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { font-family: Arial, sans-serif; margin: 16px; color:#111827; counter-reset: page 1; }
    .title { text-align:center; font-size:20px; font-weight:700; margin-bottom:6px; }
    .subtitle { text-align:center; font-size:15px; font-weight:600; margin-bottom:4px; }
    .meta-center { text-align:center; font-size:13px; margin: 2px 0; }
    .meta-right { text-align:right; font-size:13px; margin: 2px 0 8px; }
    table { width:100%; border-collapse:collapse; font-size:12px; }
    th { border:1px solid #94a3b8; background:#f1f5f9; padding:6px; text-align:left; }
    .sig-wrap { margin-top: 32px; display:flex; justify-content:space-between; gap:20px; }
    .sig { width:32%; text-align:center; font-size:12px; }
    .line { border-top:1px solid #334155; margin:30px 0 6px; }
    .page-number { position: fixed; bottom: 2mm; left:0; right:0; text-align:center; font-size:11px; color:#374151; }
    .page-number:after { content: "Page " counter(page); }
  </style>
</head>
<body>
  <div class="title">${escapeHtml(institutionName)}</div>
  <div class="subtitle">Internal Assessment Examination Schedule</div>
  <div class="meta-center"><strong>Examination:</strong> ${escapeHtml(bundle.iaCycle || '-')}</div>
  <div class="meta-center"><strong>Academic Year:</strong> ${escapeHtml(bundle.academicYearId || '-')}</div>
  <div class="meta-right"><strong>Publish Date:</strong> ${escapeHtml(publishDate)}</div>
  <table>
    <thead>
      <tr>
        <th style="width:50px;text-align:center;">S.No</th>
        <th style="width:110px;">Course Code</th>
        <th>Course Name</th>
        <th style="width:180px;">Programme</th>
        <th style="width:80px;text-align:center;">Semester</th>
        <th style="width:100px;">Date</th>
        <th style="width:70px;">Session</th>
        <th style="width:110px;">Time</th>
        <th style="width:100px;">Venue</th>
        <th style="width:70px;text-align:right;">Strength</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="sig-wrap">
    <div class="sig"><div class="line"></div><div><strong>${escapeHtml(signatoryName || ' ')}</strong></div><div>${escapeHtml(signatoryDesignation)}</div></div>
    <div class="sig"><div class="line"></div><div><strong>${escapeHtml(principalName || ' ')}</strong></div><div>${escapeHtml(principalDesignation)}</div></div>
    <div class="sig"><div class="line"></div><div><strong>${escapeHtml(officialSealText)}</strong></div><div>Institution Seal</div></div>
  </div>
  <div class="page-number"></div>
</body>
</html>`
    const win = window.open('', '_blank', 'noopener,noreferrer')
    if (!win) {
      showToast('warning', 'Unable to open print preview window.')
      return
    }
    win.document.open()
    win.document.write(html)
    win.document.close()
    window.setTimeout(() => {
      win.focus()
      win.print()
    }, 250)
  }

  const downloadOperationsWorkbook = async (bundle) => {
    const phase5 = bundle.phases.PHASE_5_OPERATIONS?.payload || {}
    const rows = Array.isArray(phase5.rows) ? phase5.rows : []
    if (rows.length === 0) {
      showToast('warning', 'No Phase 5 operations data available in selected bundle.')
      return
    }
    try {
      const mod = await import('xlsx')
      const XLSX = mod?.default || mod
      const summary = rows.map((row) => ({
        'Course Code': row.code || '',
        'Course Name': row.name || '',
        Total: Number(row.students || 0),
        Present: Number(row.presentCount || 0),
        Absent: Number(row.absentCount || 0),
        Malpractice: Number(row.malpracticeCount || 0),
        Status: row.operationStatus || '',
        Locked: row.attendanceLocked ? 'Yes' : 'No',
      }))
      const roster = rows.flatMap((row) =>
        (Array.isArray(row.studentRoster) ? row.studentRoster : []).map((student) => ({
          'Course Code': row.code || '',
          'Course Name': row.name || '',
          'Register No': student.registerNumber || '',
          'Student Name': student.firstName || '',
          Attendance: student.attendanceStatus || 'PRESENT',
          'Malpractice Remark': student.malpracticeRemark || '',
        })),
      )
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Operations Summary')
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(roster.length > 0 ? roster : [{ Info: 'No student-level roster saved' }]),
        'Student Roster',
      )
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `IA_Operations_${bundle.iaCycle || 'Bundle'}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showToast('success', 'Phase 5 operations workbook downloaded.')
    } catch {
      showToast('danger', 'Unable to generate operations workbook.')
    }
  }

  if (!isAdminUser) {
    return (
      <CRow>
        <CCol xs={12}>
          <div className="alert alert-danger mb-0">Admin role is required to access IA Records Console.</div>
        </CCol>
      </CRow>
    )
  }

  return (
    <CRow>
      <CCol xs={12}>
        <ArpToastStack toast={toast} onClose={() => setToast(null)} />

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>IA RECORDS CONSOLE</strong>
            <CBadge color="dark">Admin Only</CBadge>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2}><CFormLabel>Institution</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={scope.institutionId} onChange={(e) => setScope((p) => ({ ...p, institutionId: e.target.value, academicYearId: '', programmeId: '' }))}>
                  <option value="">All Institutions</option>
                  {institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>Academic Year</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={scope.academicYearId} onChange={(e) => setScope((p) => ({ ...p, academicYearId: e.target.value }))}>
                  <option value="">All Academic Years</option>
                  {academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear || x.id}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>Semester</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={scope.chosenSemester} onChange={(e) => setScope((p) => ({ ...p, chosenSemester: e.target.value }))}>
                  <option value="">All Semesters</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={String(s)}>{String(s)}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>Programme</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={scope.programmeId} onChange={(e) => setScope((p) => ({ ...p, programmeId: e.target.value }))}>
                  <option value="">All Programmes</option>
                  {programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode} - {x.programmeName}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>Examination</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={scope.iaCycle} onChange={(e) => setScope((p) => ({ ...p, iaCycle: e.target.value }))}>
                  <option value="">All Examinations</option>
                  {iaCycleOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                </CFormSelect>
              </CCol>
              <CCol xs={12} className="d-flex justify-content-end">
                <ArpButton label="Refresh" icon="search" color="info" onClick={loadRecords} />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Saved IA Bundles</strong>
            <CBadge color="info">Bundles: {groupedBundles.length}</CBadge>
          </CCardHeader>
          <CCardBody>
            <ArpDataTable
              title="Saved IA Bundles"
              rows={bundleRows}
              columns={bundleColumns}
              rowKey="key"
              loading={loading}
              defaultPageSize={10}
              pageSizeOptions={[10, 20, 50, 100]}
              searchPlaceholder="Search bundles..."
              emptyText="No IA bundles found for selected filters."
              selection={{
                type: 'radio',
                selected: selectedBundleKey,
                onChange: (value) => setSelectedBundleKey(String(value || '')),
                key: 'key',
                headerLabel: 'Select',
                width: 70,
                name: 'iaBundleSelect',
              }}
              headerActions={
                <>
                  <ArpIconButton
                    icon="view"
                    color="info"
                    title="Open Selected Bundle for Edit / Update"
                    disabled={!selectedBundle}
                    onClick={() => selectedBundle && openBundle(selectedBundle)}
                  />
                  <ArpIconButton
                    icon="print"
                    color="secondary"
                    title="Print Phase 4 Schedule Report"
                    disabled={!selectedBundle}
                    onClick={() => selectedBundle && printScheduleReport(selectedBundle)}
                  />
                  <ArpIconButton
                    icon="chart"
                    color="primary"
                    title="Download Phase 5 Operations Workbook"
                    disabled={!selectedBundle}
                    onClick={() => selectedBundle && downloadOperationsWorkbook(selectedBundle)}
                  />
                  <ArpIconButton
                    icon="download"
                    color="success"
                    title="Download Selected Bundle JSON"
                    disabled={!selectedBundle}
                    onClick={() => selectedBundle && downloadBundle(selectedBundle)}
                  />
                  <ArpIconButton
                    icon="delete"
                    color="danger"
                    title="Delete Selected Bundle"
                    disabled={!selectedBundle}
                    onClick={() => selectedBundle && onDeleteBundle(selectedBundle)}
                  />
                </>
              }
            />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default IARecordsAdmin
