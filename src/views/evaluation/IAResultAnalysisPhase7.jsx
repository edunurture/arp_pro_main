import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormLabel,
  CFormSelect,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
} from '@coreui/react-pro'
import Chart from 'chart.js/auto'

import { ArpButton, ArpDataTable, ArpIconButton, useArpToast } from '../../components/common'
import api from '../../services/apiClient'
import { getIAWorkflowPhase, IA_PHASE_KEYS, saveIAWorkflowPhase } from '../../services/iaWorkflowService'
import IAWorkflowScopeBanner from './IAWorkflowScopeBanner'

const PHASE_1_KEY = 'arp.evaluation.ia.phase1.setup.draft.v2'
const PHASE_4_KEY = 'arp.evaluation.ia.phase4.publish.draft.v2'
const PHASE_5_KEY = 'arp.evaluation.ia.phase5.operations.draft.v2'
const PHASE_6_KEY = 'arp.evaluation.ia.phase6.mark-entry.draft.v2'
const PHASE_7_KEY = 'arp.evaluation.ia.phase7.result-analysis.draft.v2'
const ACTIVE_BUNDLE_KEY = 'arp.evaluation.ia.active-bundle.v2'
const REPORT_CATEGORY_CATEGORY_1 = 'CATEGORY_1'

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

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null
  const next = Number(value)
  return Number.isFinite(next) ? next : null
}

const pad2 = (value) => String(value).padStart(2, '0')

const formatMonthYear = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return '-'
  const match = raw.match(/^(\d{4})-(\d{2})$/)
  if (match) return `${match[2]}-${match[1]}`
  const dt = new Date(raw)
  if (Number.isNaN(dt.getTime())) return raw
  return `${pad2(dt.getMonth() + 1)}-${dt.getFullYear()}`
}

const formatExamDate = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return '-'
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return `${match[3]}-${match[2]}-${match[1]}`
  const dt = new Date(raw)
  if (Number.isNaN(dt.getTime())) return raw
  return `${pad2(dt.getDate())}-${pad2(dt.getMonth() + 1)}-${dt.getFullYear()}`
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

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

const buildCategory1Html = ({
  scope,
  institutionMeta,
  course,
  schedule,
  assessment,
  students,
  signatoryMode,
  customSignatories,
  includeToolbar = false,
}) => {
  const affiliation =
    institutionMeta?.affiliatedUniversity ||
    institutionMeta?.category ||
    institutionMeta?.state ||
    '-'
  const maxMarks = assessment?.maximumMarks ?? '-'
  const examDate = formatExamDate(schedule?.date)
  const programmeLabel = [course?.programmeCode, course?.programmeName].filter(Boolean).join(' - ') || '-'
  const academicSemesterLabel = [
    scope?.academicYearLabel || '-',
    scope?.semesterCategory || '-',
    course?.semester || '-',
  ].join(' | ')
  const studentRows = Array.isArray(students) ? students : []
  const signatories =
    signatoryMode === 'NAME_SIGNATURE'
      ? ['Signature']
      : signatoryMode === 'HOD_DEAN_PRINCIPAL'
        ? ['HoD', 'Dean', 'Principal']
        : signatoryMode === 'HOD_DIRECTOR_PRINCIPAL'
          ? ['HoD', 'Director', 'Principal']
          : (Array.isArray(customSignatories) ? customSignatories : []).map((row) => String(row || '').trim()).filter(Boolean)
  const bodyRows = studentRows.length
    ? studentRows
        .map(
          (student, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(student.registerNumber || '-')}</td>
          <td>${escapeHtml(student.firstName || '-')}</td>
          <td>${escapeHtml(student.mark === '' || student.mark === null || student.mark === undefined ? '-' : student.mark)}</td>
          <td>${escapeHtml(student.result || '-')}</td>
        </tr>`,
        )
        .join('')
    : '<tr><td colspan="5" style="text-align:center;">No student records available.</td></tr>'
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Course wise Student Mark List</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
    .toolbar { margin-bottom: 16px; display: flex; gap: 8px; }
    .btn { padding: 8px 12px; border: 1px solid #999; background: #f5f5f5; cursor: pointer; }
    .institution-line { text-align: center; font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .affiliation-line { text-align: center; font-size: 14px; margin-bottom: 12px; }
    h1 { margin: 0 0 14px; font-size: 20px; text-align: center; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 10px 18px; margin-bottom: 18px; }
    .meta div { padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background: #f0f2f5; }
    .footer { margin-top: 24px; display: grid; grid-template-columns: repeat(${Math.max(signatories.length, 1)}, minmax(180px, 1fr)); gap: 20px; align-items: end; }
    .signature { min-width: 180px; text-align: center; }
    .footer.single-signature { grid-template-columns: 1fr; justify-items: end; }
    .page { font-size: 12px; color: #555; text-align: center; margin-top: 12px; }
    @media print {
      .toolbar { display: none; }
      body { padding: 12px; }
    }
  </style>
</head>
<body>
  ${includeToolbar ? '<div class="toolbar"><button class="btn" onclick="window.print()">Print</button><button class="btn" onclick="window.close()">Close</button></div>' : ''}
  <div class="institution-line">${escapeHtml(scope?.institutionName || '-')}</div>
  <div class="affiliation-line">Affiliated to ${escapeHtml(affiliation)}</div>
  <h1>Mark Statement</h1>
  <div class="meta">
    <div><strong>Programme:</strong> ${escapeHtml(programmeLabel)}</div>
    <div><strong>AY and Semester:</strong> ${escapeHtml(academicSemesterLabel)}</div>
    <div><strong>Name of the Examination:</strong> ${escapeHtml(scope?.examName || scope?.iaCycle || '-')}</div>
    <div><strong>Month & Year of Examination:</strong> ${escapeHtml(formatMonthYear(scope?.examMonthYear))}</div>
    <div><strong>Date of Examination:</strong> ${escapeHtml(examDate)}</div>
    <div><strong>Course:</strong> ${escapeHtml(`${course?.courseCode || '-'} - ${course?.courseName || '-'}`)}</div>
    <div><strong>Maximum Marks:</strong> ${escapeHtml(maxMarks)}</div>
    <div><strong>Category:</strong> Course Wise Statement</div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 60px;">S.No.</th>
        <th style="width: 140px;">Reg. No.</th>
        <th>Name</th>
        <th style="width: 140px;">Marks Obtained</th>
        <th style="width: 120px;">Results</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer ${signatories.length === 1 ? 'single-signature' : ''}">
    ${signatories.length > 0
      ? signatories
          .map(
            (label) => `
      <div class="signature">
        <div style="height:32px;"></div>
        <div>${escapeHtml(label)}</div>
      </div>`,
          )
          .join('')
      : `
      <div class="signature">
        <div style="height:32px;"></div>
        <div>Name and Signature</div>
      </div>`}
  </div>
  <div class="page">Page 1</div>
</body>
</html>`
}

const buildCategory1ExportRows = (students = []) =>
  students.map((student, index) => ({
    'S.No.': index + 1,
    'Reg. No.': student.registerNumber || '-',
    Name: student.firstName || '-',
    'Marks Obtained':
      student.mark === '' || student.mark === null || student.mark === undefined ? '-' : student.mark,
    Results: student.result || '-',
  }))

const buildResultAnalysisHtml = ({ selectedRow, overallSummary, scope, includeToolbar = false }) => `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>IA Result Analysis</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
    .toolbar { margin-bottom: 16px; display: flex; gap: 8px; }
    .btn { padding: 8px 12px; border: 1px solid #999; background: #f5f5f5; cursor: pointer; }
    h1 { margin: 0 0 16px; font-size: 22px; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 10px 18px; margin-bottom: 18px; }
    .meta div { padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f0f2f5; }
    .summary { margin-top: 18px; display: grid; grid-template-columns: repeat(3, minmax(160px, 1fr)); gap: 10px; }
    .summary div { padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: #fafafa; }
    @media print { .toolbar { display: none; } body { padding: 12px; } }
  </style>
</head>
<body>
  ${includeToolbar ? '<div class="toolbar"><button class="btn" onclick="window.print()">Print</button><button class="btn" onclick="window.close()">Close</button></div>' : ''}
  <h1>IA Result Analysis</h1>
  <div class="meta">
    <div><strong>Examination:</strong> ${scope?.examName || scope?.iaCycle || '-'}</div>
    <div><strong>Workspace:</strong> ${scope?.workspaceType || '-'}</div>
    <div><strong>Programme:</strong> ${[selectedRow?.programmeCode, selectedRow?.programmeName].filter(Boolean).join(' - ') || '-'}</div>
    <div><strong>Semester:</strong> ${selectedRow?.semester || '-'}</div>
    <div><strong>Course Code:</strong> ${selectedRow?.courseCode || '-'}</div>
    <div><strong>Course Name:</strong> ${selectedRow?.courseName || '-'}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Total</th>
        <th>Pass</th>
        <th>Fail</th>
        <th>Reappear</th>
        <th>Absent</th>
        <th>Malpractice</th>
        <th>Highest</th>
        <th>Lowest</th>
        <th>Average</th>
        <th>Pass %</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${selectedRow?.total ?? 0}</td>
        <td>${selectedRow?.passCount ?? 0}</td>
        <td>${selectedRow?.failCount ?? 0}</td>
        <td>${selectedRow?.reappearCount ?? 0}</td>
        <td>${selectedRow?.absentCount ?? 0}</td>
        <td>${selectedRow?.malpracticeCount ?? 0}</td>
        <td>${selectedRow?.highest ?? 0}</td>
        <td>${selectedRow?.lowest ?? 0}</td>
        <td>${selectedRow?.average ?? 0}</td>
        <td>${selectedRow?.passPercentage ?? 0}</td>
      </tr>
    </tbody>
  </table>
  <div class="summary">
    <div><strong>Total Students:</strong> ${overallSummary?.totalStudents ?? 0}</div>
    <div><strong>Total Pass:</strong> ${overallSummary?.totalPass ?? 0}</div>
    <div><strong>Overall Pass %:</strong> ${overallSummary?.overallPassPct ?? 0}</div>
  </div>
</body>
</html>`

const buildResultAnalysisRowsHtml = ({ rows, overallSummary, scope, includeToolbar = false }) => `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>IA Result Analysis</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #222; }
    .toolbar { margin-bottom: 16px; display: flex; gap: 8px; }
    .btn { padding: 8px 12px; border: 1px solid #999; background: #f5f5f5; cursor: pointer; }
    h1 { margin: 0 0 16px; font-size: 22px; }
    .meta { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 10px 18px; margin-bottom: 18px; }
    .meta div { padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f0f2f5; }
    .summary { margin-top: 18px; display: grid; grid-template-columns: repeat(3, minmax(160px, 1fr)); gap: 10px; }
    .summary div { padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: #fafafa; }
    @media print { .toolbar { display: none; } body { padding: 12px; } }
  </style>
</head>
<body>
  ${includeToolbar ? '<div class="toolbar"><button class="btn" onclick="window.print()">Print</button><button class="btn" onclick="window.close()">Close</button></div>' : ''}
  <h1>IA Result Analysis</h1>
  <div class="meta">
    <div><strong>Examination:</strong> ${scope?.examName || scope?.iaCycle || '-'}</div>
    <div><strong>Workspace:</strong> ${scope?.workspaceType || '-'}</div>
    <div><strong>Programme Filter:</strong> ${scope?.programmeLabel || 'All Matching Programmes'}</div>
    <div><strong>Semester Filter:</strong> ${scope?.semesterLabel || 'All Matching Semesters'}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Course Code</th>
        <th>Course Name</th>
        <th>Total</th>
        <th>Pass</th>
        <th>Fail</th>
        <th>Reappear</th>
        <th>Absent</th>
        <th>Malpractice</th>
        <th>Highest</th>
        <th>Lowest</th>
        <th>Average</th>
        <th>Pass %</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((row) => `
      <tr>
        <td>${row.courseCode || '-'}</td>
        <td>${row.courseName || '-'}</td>
        <td>${row.total ?? 0}</td>
        <td>${row.passCount ?? 0}</td>
        <td>${row.failCount ?? 0}</td>
        <td>${row.reappearCount ?? 0}</td>
        <td>${row.absentCount ?? 0}</td>
        <td>${row.malpracticeCount ?? 0}</td>
        <td>${row.highest ?? 0}</td>
        <td>${row.lowest ?? 0}</td>
        <td>${row.average ?? 0}</td>
        <td>${row.passPercentage ?? 0}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="summary">
    <div><strong>Total Students:</strong> ${overallSummary?.totalStudents ?? 0}</div>
    <div><strong>Total Pass:</strong> ${overallSummary?.totalPass ?? 0}</div>
    <div><strong>Overall Pass %:</strong> ${overallSummary?.overallPassPct ?? 0}</div>
  </div>
</body>
</html>`

const buildExportRows = (rows = []) =>
  rows.map((row) => ({
    Programme: [row.programmeCode, row.programmeName].filter(Boolean).join(' - ') || '-',
    Semester: row.semester ? `Semester ${row.semester}` : '-',
    'Course Code': row.courseCode || '-',
    'Course Name': row.courseName || '-',
    Total: Number(row.total || 0),
    Pass: Number(row.passCount || 0),
    Fail: Number(row.failCount || 0),
    Reappear: Number(row.reappearCount || 0),
    Absent: Number(row.absentCount || 0),
    Malpractice: Number(row.malpracticeCount || 0),
    Highest: Number(row.highest || 0),
    Lowest: Number(row.lowest || 0),
    Average: Number(row.average || 0),
    'Pass %': Number(row.passPercentage || 0),
  }))

const computeAnalysisRows = (courseRows = []) =>
  courseRows.map((course) => {
    const students = Array.isArray(course.students) ? course.students : []
    const presentStudents = students.filter((s) => s.attendanceStatus === 'PRESENT' && String(s.mark || '').trim() !== '')
    const passCount = students.filter((s) => s.result === 'PASS').length
    const failCount = students.filter((s) => s.result === 'FAIL').length
    const reappearCount = students.filter((s) => s.result === 'REAPPEAR').length
    const absentCount = students.filter((s) => s.result === 'ABSENT').length
    const malpracticeCount = students.filter((s) => s.result === 'MALPRACTICE').length
    const marks = presentStudents.map((s) => Number(s.mark || 0)).filter((n) => Number.isFinite(n))
    const total = students.length
    const average = marks.length > 0 ? (marks.reduce((a, b) => a + b, 0) / marks.length) : 0
    return {
      courseId: course.courseId,
      courseCode: course.courseCode || '-',
      courseName: course.courseName || '-',
      programmeId: course.programmeId || '',
      programmeCode: course.programmeCode || '',
      programmeName: course.programmeName || '',
      semester: String(course.semester || '').trim(),
      courseStatus: String(course.status || '').trim() || 'PENDING',
      total,
      passCount,
      failCount,
      reappearCount,
      absentCount,
      malpracticeCount,
      highest: marks.length > 0 ? Math.max(...marks) : 0,
      lowest: marks.length > 0 ? Math.min(...marks) : 0,
      average: Number(average.toFixed(2)),
      passPercentage: total > 0 ? Number(((passCount / total) * 100).toFixed(2)) : 0,
    }
  })

const IAResultAnalysisPhase7 = () => {
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

  const phase6 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_6_KEY) || '{}')
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
  const [programmeFilter, setProgrammeFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [courseStatusFilter, setCourseStatusFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [reportCategory, setReportCategory] = useState(REPORT_CATEGORY_CATEGORY_1)
  const [signatoryMode, setSignatoryMode] = useState('NAME_SIGNATURE')
  const [customSignatories, setCustomSignatories] = useState(['', '', ''])
  const [tablePageSize, setTablePageSize] = useState(10)
  const [analysisRows, setAnalysisRows] = useState(() => computeAnalysisRows(phase6.courseRows || []))
  const [editMode, setEditMode] = useState(false)
  const [institutionMeta, setInstitutionMeta] = useState({})
  const [computationRows, setComputationRows] = useState([])
  const [assessmentMappingsByScope, setAssessmentMappingsByScope] = useState({})
  const [viewVisible, setViewVisible] = useState(false)
  const [printVisible, setPrintVisible] = useState(false)
  const [chartVisible, setChartVisible] = useState(false)
  const [printHtml, setPrintHtml] = useState('')
  const [chartType, setChartType] = useState('bar')
  const chartCanvasRef = useRef(null)
  const chartInstanceRef = useRef(null)
  const printFrameRef = useRef(null)
  const workflowScope = useMemo(
    () => resolveWorkflowScope(phase1, phase4, activeBundle),
    [phase1, phase4, activeBundle],
  )
  const phaseLocked = status === 'IA_RESULT_ANALYSIS_COMPLETED' && !editMode

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
      const saved = JSON.parse(window.sessionStorage.getItem(PHASE_7_KEY) || '{}')
      if (saved && typeof saved === 'object' && bundleScopeMatches(activeBundle, saved)) {
        if (String(saved.status || '').trim()) setStatus(String(saved.status))
        if (Array.isArray(saved.analysisRows) && saved.analysisRows.length > 0) setAnalysisRows(saved.analysisRows)
        if (String(saved.reportCategory || '').trim()) setReportCategory(String(saved.reportCategory))
        if (String(saved.signatoryMode || '').trim()) setSignatoryMode(String(saved.signatoryMode))
        if (Array.isArray(saved.customSignatories)) {
          setCustomSignatories([
            String(saved.customSignatories[0] || ''),
            String(saved.customSignatories[1] || ''),
            String(saved.customSignatories[2] || ''),
          ])
        }
      }
    } catch {
      // ignore invalid local draft
    }
  }, [])

  useEffect(() => {
    const institutionId = String(workflowScope?.institutionId || '').trim()
    if (!institutionId) {
      setInstitutionMeta({})
      setComputationRows([])
      return
    }
    ;(async () => {
      try {
        const [institutionRes, computationRes] = await Promise.all([
          api.get('/api/setup/institution'),
          api.get('/api/setup/cia-computations', { params: { institutionId } }),
        ])
        const institutions = Array.isArray(institutionRes?.data?.data)
          ? institutionRes.data.data
          : Array.isArray(institutionRes?.data)
            ? institutionRes.data
            : []
        setInstitutionMeta(institutions.find((row) => String(row.id) === institutionId) || {})
        const computations = Array.isArray(computationRes?.data?.data)
          ? computationRes.data.data
          : Array.isArray(computationRes?.data)
            ? computationRes.data
            : []
        setComputationRows(computations)
      } catch {
        setInstitutionMeta({})
        setComputationRows([])
      }
    })()
  }, [workflowScope?.institutionId])

  useEffect(() => {
    const institutionId = String(workflowScope?.institutionId || '').trim()
    const academicYearId = String(workflowScope?.academicYearId || '').trim()
    const semesterCategory = String(workflowScope?.semesterCategory || '').trim()
    if (!institutionId || !academicYearId || !semesterCategory) {
      setAssessmentMappingsByScope({})
      return
    }
    const targets = Array.from(
      new Set(
        (phase6.courseRows || [])
          .map((row) => `${String(row.programmeId || '').trim()}|${String(row.semester || '').trim()}`)
          .filter((key) => key !== '|'),
      ),
    )
    if (targets.length === 0) {
      setAssessmentMappingsByScope({})
      return
    }
    ;(async () => {
      try {
        const entries = await Promise.all(
          targets.map(async (key) => {
            const [programmeId, chosenSemester] = key.split('|')
            const res = await api.get('/api/setup/assessment-setup', {
              params: {
                institutionId,
                academicYearId,
                semesterCategory,
                programmeId,
                chosenSemester,
              },
            })
            const rows = Array.isArray(res?.data?.data)
              ? res.data.data
              : Array.isArray(res?.data)
                ? res.data
                : []
            return [key, rows]
          }),
        )
        setAssessmentMappingsByScope(Object.fromEntries(entries))
      } catch {
        setAssessmentMappingsByScope({})
      }
    })()
  }, [phase6.courseRows, workflowScope?.academicYearId, workflowScope?.institutionId, workflowScope?.semesterCategory])

  useEffect(() => {
    const wf = workflowScope || {}
    if (!wf.institutionId || !wf.academicYearId || !hasSemesterScope(wf) || !wf.programmeId || !(wf.iaCycle || wf.examName)) {
      return
    }
    ;(async () => {
      try {
        const remote = await getIAWorkflowPhase(IA_PHASE_KEYS.PHASE_7_RESULT_ANALYSIS, {
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
        if (Array.isArray(payload.analysisRows) && payload.analysisRows.length > 0) {
          setAnalysisRows(payload.analysisRows)
        }
      } catch {
        // keep local/session state
      }
    })()
  }, [workflowScope])

  const programmeOptions = useMemo(
    () =>
      [...new Map(
        analysisRows
          .filter((row) => row.programmeId || row.programmeCode || row.programmeName)
          .map((row) => [
            String(row.programmeId || row.programmeCode || row.programmeName),
            {
              value: String(row.programmeId || row.programmeCode || row.programmeName),
              label: [row.programmeCode, row.programmeName].filter(Boolean).join(' - ') || row.programmeCode || row.programmeName,
            },
          ]),
      ).values()],
    [analysisRows],
  )

  const semesterOptions = useMemo(
    () =>
      [...new Set(analysisRows.map((row) => String(row.semester || '').trim()).filter(Boolean))]
        .sort((a, b) => Number(a) - Number(b)),
    [analysisRows],
  )

  const filteredRows = useMemo(
    () =>
      analysisRows.filter((row) => {
        if (programmeFilter && String(row.programmeId || row.programmeCode || row.programmeName) !== String(programmeFilter)) return false
        if (semesterFilter && String(row.semester || '') !== String(semesterFilter)) return false
        if (courseStatusFilter && String(row.courseStatus || '') !== String(courseStatusFilter)) return false
        return true
      }),
    [analysisRows, programmeFilter, semesterFilter, courseStatusFilter],
  )

  const courseOptions = useMemo(
    () =>
      filteredRows.map((row) => ({
        value: String(row.courseId),
        label: `${row.courseCode} - ${row.courseName}`,
      })),
    [filteredRows],
  )

  const visibleRows = useMemo(() => {
    if (!courseFilter) return filteredRows
    return filteredRows.filter((row) => String(row.courseId) === String(courseFilter))
  }, [filteredRows, courseFilter])

  const selectedRow = useMemo(
    () => analysisRows.find((row) => String(row.courseId) === String(courseFilter)) || null,
    [analysisRows, courseFilter],
  )
  const selectedCourseRow = useMemo(
    () => (Array.isArray(phase6.courseRows) ? phase6.courseRows.find((row) => String(row.courseId) === String(courseFilter)) : null) || null,
    [phase6.courseRows, courseFilter],
  )
  const publishedSlots = useMemo(
    () => phase4?.snapshot?.slots || phase4?.slots || [],
    [phase4],
  )
  const publishedCourses = useMemo(
    () => phase4?.snapshot?.courses || phase4?.courses || [],
    [phase4],
  )
  const slotById = useMemo(
    () => Object.fromEntries((Array.isArray(publishedSlots) ? publishedSlots : []).map((slot) => [slot.id, slot])),
    [publishedSlots],
  )
  const selectedCourseSchedule = useMemo(() => {
    const phase5Row = Array.isArray(phase5?.rows)
      ? phase5.rows.find((row) => String(row.id) === String(courseFilter))
      : null
    const phase4Course = Array.isArray(publishedCourses)
      ? publishedCourses.find((row) => String(row.id) === String(courseFilter))
      : null
    const slot = slotById[phase5Row?.slotId || phase4Course?.slotId] || {}
    return {
      date: phase5Row?.date || phase4Course?.date || slot?.date || '',
      session: phase5Row?.session || phase4Course?.session || slot?.session || '',
      time: phase5Row?.time || phase4Course?.time || (slot?.startTime && slot?.endTime ? `${slot.startTime} - ${slot.endTime}` : ''),
      venue: phase5Row?.venue || phase4Course?.venue || slot?.venue || '',
    }
  }, [courseFilter, phase5?.rows, publishedCourses, slotById])
  const selectedCourseAssessment = useMemo(() => {
    if (!selectedCourseRow) return null
    const institutionId = String(workflowScope?.institutionId || '').trim()
    const academicYearId = String(workflowScope?.academicYearId || '').trim()
    const semesterCategory = String(workflowScope?.semesterCategory || '').trim()
    const programmeId = String(selectedCourseRow?.programmeId || '').trim()
    const chosenSemester = String(selectedCourseRow?.semester || '').trim()
    const examName = String(workflowScope?.examName || workflowScope?.iaCycle || '').trim()
    const scopeKey = [institutionId, academicYearId, semesterCategory, programmeId, chosenSemester].join('|')
    const mappingRows = assessmentMappingsByScope[`${programmeId}|${chosenSemester}`] || assessmentMappingsByScope[scopeKey] || []
    const mappingRow =
      mappingRows.find((row) => String(row.courseOfferingId || '').trim() === String(selectedCourseRow.courseId || '').trim()) ||
      mappingRows.find((row) => String(row.courseCode || '').trim() === String(selectedCourseRow.courseCode || '').trim()) ||
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
      maximumMarks: matchedComponent?.maxMarks ?? mappingRow?.cia ?? null,
      minimumMarks: matchedComponent?.minMarks ?? mappingRow?.minimumCIA ?? null,
      source: matchedComponent ? 'COMPONENT_MAPPING' : mappingRow ? 'COURSE_CIA_FALLBACK' : 'UNAVAILABLE',
    }
  }, [assessmentMappingsByScope, computationRows, selectedCourseRow, workflowScope?.academicYearId, workflowScope?.examName, workflowScope?.iaCycle, workflowScope?.institutionId, workflowScope?.semesterCategory])

  const exportRows = useMemo(() => (courseFilter && selectedRow ? [selectedRow] : visibleRows), [courseFilter, selectedRow, visibleRows])

  const exportSummary = useMemo(() => {
    const totalStudents = exportRows.reduce((sum, row) => sum + Number(row.total || 0), 0)
    const totalPass = exportRows.reduce((sum, row) => sum + Number(row.passCount || 0), 0)
    const totalFail = exportRows.reduce((sum, row) => sum + Number(row.failCount || 0), 0)
    const totalReappear = exportRows.reduce((sum, row) => sum + Number(row.reappearCount || 0), 0)
    const totalAbsent = exportRows.reduce((sum, row) => sum + Number(row.absentCount || 0), 0)
    const totalMalpractice = exportRows.reduce((sum, row) => sum + Number(row.malpracticeCount || 0), 0)
    const overallPassPct = totalStudents > 0 ? Number(((totalPass / totalStudents) * 100).toFixed(2)) : 0
    return { totalStudents, totalPass, totalFail, totalReappear, totalAbsent, totalMalpractice, overallPassPct }
  }, [exportRows])

  const ensureCategory1Course = () => {
    if (reportCategory !== REPORT_CATEGORY_CATEGORY_1) return true
    if (!courseFilter || !selectedCourseRow) {
      showToast('danger', 'Select one course to generate Category 1 report.')
      return false
    }
    return true
  }

  const chartTitle = useMemo(() => {
    if (courseFilter && selectedRow) {
      return `${selectedRow.courseCode} - ${selectedRow.courseName}`
    }
    const programmeLabel =
      programmeOptions.find((option) => String(option.value) === String(programmeFilter))?.label || 'All Matching Programmes'
    const semesterLabel = semesterFilter ? `Semester ${semesterFilter}` : 'All Matching Semesters'
    return `${programmeLabel} | ${semesterLabel}`
  }, [courseFilter, selectedRow, programmeOptions, programmeFilter, semesterFilter])

  useEffect(() => {
    if (!chartVisible || !exportRows.length) return
    const renderChart = () => {
      const canvas = chartCanvasRef.current
      if (!canvas) return
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
      const chartLabel =
        courseFilter && selectedRow
          ? `${selectedRow.courseCode} - Result Split`
          : 'All Matching Courses - Result Split'
      chartInstanceRef.current = new Chart(canvas, {
        type: chartType,
        data: {
          labels: ['Pass', 'Fail', 'Reappear', 'Absent', 'Malpractice'],
          datasets: [
            {
              label: chartLabel,
              data: [
                Number(exportSummary.totalPass || 0),
                Number(exportSummary.totalFail || 0),
                Number(exportSummary.totalReappear || 0),
                Number(exportSummary.totalAbsent || 0),
                Number(exportSummary.totalMalpractice || 0),
              ],
              backgroundColor: ['#2eb85c', '#e55353', '#f9b115', '#6c757d', '#321fdb'],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: chartTitle,
            },
            legend: {
              display: true,
            },
          },
          scales: chartType === 'bar'
            ? { y: { beginAtZero: true, precision: 0 } }
            : undefined,
        },
      })
    }
    const timer = window.setTimeout(renderChart, 120)
    return () => {
      window.clearTimeout(timer)
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
    }
  }, [chartVisible, chartType, chartTitle, courseFilter, exportRows, exportSummary, selectedRow])

  const analysisColumns = useMemo(
    () => [
      { key: 'courseCode', label: 'Course Code', sortable: true, sortType: 'string' },
      { key: 'courseName', label: 'Course Name', sortable: true, sortType: 'string' },
      { key: 'total', label: 'Total', sortable: true, sortType: 'number', align: 'right' },
      { key: 'passCount', label: 'Pass', sortable: true, sortType: 'number', align: 'right' },
      { key: 'failCount', label: 'Fail', sortable: true, sortType: 'number', align: 'right' },
      { key: 'reappearCount', label: 'Reappear', sortable: true, sortType: 'number', align: 'right' },
      { key: 'absentCount', label: 'Absent', sortable: true, sortType: 'number', align: 'right' },
      { key: 'malpracticeCount', label: 'Malpractice', sortable: true, sortType: 'number', align: 'right' },
      { key: 'highest', label: 'Highest', sortable: true, sortType: 'number', align: 'right' },
      { key: 'lowest', label: 'Lowest', sortable: true, sortType: 'number', align: 'right' },
      { key: 'average', label: 'Average', sortable: true, sortType: 'number', align: 'right' },
      { key: 'passPercentage', label: 'Pass %', sortable: true, sortType: 'number', align: 'right' },
    ],
    [],
  )

  const overallSummary = useMemo(() => {
    const totalStudents = analysisRows.reduce((sum, row) => sum + Number(row.total || 0), 0)
    const totalPass = analysisRows.reduce((sum, row) => sum + Number(row.passCount || 0), 0)
    const totalFail = analysisRows.reduce((sum, row) => sum + Number(row.failCount || 0), 0)
    const totalReappear = analysisRows.reduce((sum, row) => sum + Number(row.reappearCount || 0), 0)
    const totalAbsent = analysisRows.reduce((sum, row) => sum + Number(row.absentCount || 0), 0)
    const totalMalpractice = analysisRows.reduce((sum, row) => sum + Number(row.malpracticeCount || 0), 0)
    const overallPassPct = totalStudents > 0 ? Number(((totalPass / totalStudents) * 100).toFixed(2)) : 0
    return { totalStudents, totalPass, totalFail, totalReappear, totalAbsent, totalMalpractice, overallPassPct }
  }, [analysisRows])

  const persist = async (nextStatus) => {
    const payload = {
      status: nextStatus,
      analysisRows,
      summary: overallSummary,
      reportCategory,
      signatoryMode,
      customSignatories,
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_7_KEY, JSON.stringify(payload))
    try {
      const wf = workflowScope || {}
      await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_7_RESULT_ANALYSIS, {
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
    await persist(status === 'IA_RESULT_ANALYSIS_COMPLETED' ? 'IA_RESULT_ANALYSIS_COMPLETED' : 'DRAFT')
    showToast('success', 'Phase 7 result analysis draft saved.')
  }

  const onClosePhase7 = async () => {
    if (analysisRows.length === 0) {
      showToast('danger', 'No IA mark entry records available for result analysis.')
      return
    }
    await persist('IA_RESULT_ANALYSIS_COMPLETED')
    setEditMode(false)
    showToast('success', 'Phase 7 result analysis completed.')
  }

  const downloadXlsx = async () => {
    if (!ensureCategory1Course()) return
    try {
      const mod = await import('xlsx')
      const XLSX = mod?.default || mod
      const wb = XLSX.utils.book_new()
      const reportContext = [
        { Field: 'Institution', Value: workflowScope?.institutionName || '-' },
        { Field: 'Academic Year', Value: workflowScope?.academicYearLabel || phase1?.academicYearLabel || '-' },
        { Field: 'Examination', Value: workflowScope?.examName || workflowScope?.iaCycle || '-' },
        { Field: 'Month & Year of Examination', Value: workflowScope?.examMonthYear || '-' },
        { Field: 'Date of Examination', Value: selectedCourseSchedule?.date || '-' },
        { Field: 'Course', Value: `${selectedCourseRow?.courseCode || '-'} - ${selectedCourseRow?.courseName || '-'}` },
        { Field: 'Maximum Marks', Value: selectedCourseAssessment?.maximumMarks ?? '-' },
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportContext), 'Report Context')
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(buildCategory1ExportRows(selectedCourseRow?.students || [])),
        'Student Mark List',
      )
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'IA_Result_Analysis.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showToast('success', 'IA result analysis workbook downloaded.')
    } catch {
      showToast('danger', 'Unable to generate IA result analysis workbook.')
    }
  }

  const onViewAnalysis = () => {
    if (!ensureCategory1Course()) return
    setPrintHtml(
      buildCategory1Html({
        scope: workflowScope,
        institutionMeta,
        course: selectedCourseRow,
        schedule: selectedCourseSchedule,
        assessment: selectedCourseAssessment,
        students: selectedCourseRow?.students || [],
        signatoryMode,
        customSignatories,
      }),
    )
    setViewVisible(true)
  }

  const onDownloadWord = () => {
    if (!ensureCategory1Course()) return
    try {
      const html = buildCategory1Html({
        scope: workflowScope,
        institutionMeta,
        course: selectedCourseRow,
        schedule: selectedCourseSchedule,
        assessment: selectedCourseAssessment,
        students: selectedCourseRow?.students || [],
        signatoryMode,
        customSignatories,
      })
      const blob = new Blob([html], { type: 'application/msword' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedRow.courseCode || 'IA_Result_Analysis'}.doc`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showToast('success', 'Word document exported.')
    } catch {
      showToast('danger', 'Unable to generate the Word document.')
    }
  }

  const onDownloadPdf = () => {
    if (!ensureCategory1Course()) return
    setPrintHtml(
      buildCategory1Html({
        scope: workflowScope,
        institutionMeta,
        course: selectedCourseRow,
        schedule: selectedCourseSchedule,
        assessment: selectedCourseAssessment,
        students: selectedCourseRow?.students || [],
        signatoryMode,
        customSignatories,
        includeToolbar: true,
      }),
    )
    setPrintVisible(true)
    showToast('info', 'Use the preview to print or save as PDF.')
  }

  const onPrintPreview = () => {
    if (!ensureCategory1Course()) return
    setPrintHtml(
      buildCategory1Html({
        scope: workflowScope,
        institutionMeta,
        course: selectedCourseRow,
        schedule: selectedCourseSchedule,
        assessment: selectedCourseAssessment,
        students: selectedCourseRow?.students || [],
        signatoryMode,
        customSignatories,
        includeToolbar: true,
      }),
    )
    setPrintVisible(true)
  }

  const onChartRepresentation = () => {
    if (exportRows.length === 0) {
      showToast('danger', 'No matching result analysis rows are available.')
      return
    }
    setChartVisible(true)
  }

  const downloadChartImage = () => {
    const canvas = chartCanvasRef.current
    if (!canvas) {
      showToast('danger', 'Chart is not ready for download.')
      return
    }
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'IA_Result_Analysis_Chart.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const tableHeaderActions = (
    <>
      <ArpIconButton icon="view" color="info" title="View" onClick={onViewAnalysis} disabled={!courseFilter} />
      <ArpIconButton icon="download" color="success" title="Download XLSX" onClick={downloadXlsx} disabled={!courseFilter} />
      <ArpIconButton icon="download" color="primary" title="Download Word Document" onClick={onDownloadWord} disabled={!courseFilter} />
      <ArpIconButton icon="download" color="warning" title="Download PDF Document" onClick={onDownloadPdf} disabled={!courseFilter} />
      <ArpIconButton icon="print" color="secondary" title="Print with Preview" onClick={onPrintPreview} disabled={!courseFilter} />
      <ArpIconButton icon="chart" color="dark" title="Chart Representation" onClick={onChartRepresentation} disabled={!courseFilter} />
    </>
  )

  return (
    <CRow>
      <CCol xs={12}>
        <IAWorkflowScopeBanner scope={workflowScope} />

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT - PHASE 7 RESULT ANALYSIS</strong>
            <CBadge color={status === 'IA_RESULT_ANALYSIS_COMPLETED' ? 'success' : 'info'}>{status}</CBadge>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel>Filter by Programme</CFormLabel>
                <CFormSelect value={programmeFilter} onChange={(e) => { setProgrammeFilter(e.target.value); setCourseFilter('') }} disabled={phaseLocked}>
                  <option value="">All Programmes</option>
                  {programmeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormLabel>Filter by Semester</CFormLabel>
                <CFormSelect value={semesterFilter} onChange={(e) => { setSemesterFilter(e.target.value); setCourseFilter('') }} disabled={phaseLocked}>
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
                <CFormSelect value={courseStatusFilter} onChange={(e) => { setCourseStatusFilter(e.target.value); setCourseFilter('') }} disabled={phaseLocked}>
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Filter by Course</CFormLabel>
                <CFormSelect value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} disabled={phaseLocked}>
                  <option value="">All Matching Courses</option>
                  {courseOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormLabel>Report Category</CFormLabel>
                <CFormSelect value={reportCategory} onChange={(e) => setReportCategory(e.target.value)} disabled={phaseLocked}>
                  <option value={REPORT_CATEGORY_CATEGORY_1}>Mark Statement - 1</option>
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Signatory Format</CFormLabel>
                <CFormSelect value={signatoryMode} onChange={(e) => setSignatoryMode(e.target.value)} disabled={phaseLocked}>
                  <option value="NAME_SIGNATURE">Name and Signature</option>
                  <option value="HOD_DEAN_PRINCIPAL">HoD / Dean / Principal</option>
                  <option value="HOD_DIRECTOR_PRINCIPAL">HoD / Director / Principal</option>
                  <option value="CUSTOM">Custom</option>
                </CFormSelect>
              </CCol>
              <CCol md={12} className="d-flex align-items-end justify-content-end gap-2">
                <CBadge color="dark">Students: {overallSummary.totalStudents}</CBadge>
                <CBadge color="success">Pass %: {overallSummary.overallPassPct}</CBadge>
              </CCol>
              {signatoryMode === 'CUSTOM' ? (
                <>
                  <CCol md={4}>
                    <CFormLabel>Custom Signatory 1</CFormLabel>
                    <CFormInput
                      value={customSignatories[0] || ''}
                      onChange={(e) => setCustomSignatories((prev) => [e.target.value, prev[1] || '', prev[2] || ''])}
                      disabled={phaseLocked}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Custom Signatory 2</CFormLabel>
                    <CFormInput
                      value={customSignatories[1] || ''}
                      onChange={(e) => setCustomSignatories((prev) => [prev[0] || '', e.target.value, prev[2] || ''])}
                      disabled={phaseLocked}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Custom Signatory 3</CFormLabel>
                    <CFormInput
                      value={customSignatories[2] || ''}
                      onChange={(e) => setCustomSignatories((prev) => [prev[0] || '', prev[1] || '', e.target.value])}
                      disabled={phaseLocked}
                    />
                  </CCol>
                </>
              ) : null}
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Course-wise Result Analysis</strong>
            <div className="d-flex align-items-center gap-2">
              <CFormSelect
                value={tablePageSize}
                onChange={(e) => setTablePageSize(Number(e.target.value))}
                style={{ width: 130 }}
                title="Rows per page"
                aria-label="Rows per page"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </CFormSelect>
              {tableHeaderActions}
            </div>
          </CCardHeader>
          <CCardBody>
            <ArpDataTable
              rows={visibleRows}
              columns={analysisColumns}
              rowKey="courseId"
              pageSize={tablePageSize}
              onPageSizeChange={setTablePageSize}
              defaultPageSize={10}
              pageSizeOptions={[10, 20, 50, 100]}
              searchable={false}
              showPageSizeControl={false}
              emptyText="No IA result analysis rows available."
            />
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader><strong>Phase 7 Actions</strong></CCardHeader>
          <CCardBody className="d-flex justify-content-end gap-2">
            {phaseLocked ? (
              <>
                <ArpButton label="Enable Edit" icon="edit" color="warning" onClick={() => setEditMode(true)} />
                <ArpButton label="Go to Workspace Console" icon="view" color="secondary" onClick={() => navigate('/evaluation/ia/workspace')} />
              </>
            ) : (
              <>
                <ArpButton label="Save Draft" icon="save" color="secondary" onClick={onSaveDraft} />
                <ArpButton label="Close Phase 7" icon="submit" color="success" onClick={onClosePhase7} />
              </>
            )}
          </CCardBody>
        </CCard>

        <CModal visible={viewVisible} onClose={() => setViewVisible(false)} size="lg">
          <CModalHeader closeButton>
            <CModalTitle>Category 1 Report Preview</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <iframe
              title="Category 1 Report Preview"
              style={{ width: '100%', minHeight: '70vh', border: '1px solid #ddd' }}
              srcDoc={printHtml}
            />
          </CModalBody>
          <CModalFooter>
            <ArpButton label="Close" icon="cancel" color="secondary" onClick={() => setViewVisible(false)} />
          </CModalFooter>
        </CModal>

        <CModal visible={printVisible} onClose={() => setPrintVisible(false)} size="xl">
          <CModalHeader closeButton>
            <CModalTitle>Result Analysis Print Preview</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <iframe
              ref={printFrameRef}
              title="Result Analysis Print Preview"
              style={{ width: '100%', minHeight: '70vh', border: '1px solid #ddd' }}
              srcDoc={printHtml}
            />
          </CModalBody>
          <CModalFooter>
            <ArpButton label="Print" icon="print" color="primary" onClick={() => printFrameRef.current?.contentWindow?.print()} />
            <ArpButton label="Close" icon="cancel" color="secondary" onClick={() => setPrintVisible(false)} />
          </CModalFooter>
        </CModal>

        <CModal visible={chartVisible} onClose={() => setChartVisible(false)} size="lg">
          <CModalHeader closeButton>
            <CModalTitle>Result Analysis Chart</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow className="g-3 mb-3">
              <CCol md={6}>
                <CFormLabel>Chart Title</CFormLabel>
                <CFormInput value={chartTitle} disabled />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Chart Type</CFormLabel>
                <CFormSelect value={chartType} onChange={(e) => setChartType(e.target.value)}>
                  <option value="bar">Bar</option>
                  <option value="pie">Pie</option>
                  <option value="doughnut">Doughnut</option>
                </CFormSelect>
              </CCol>
            </CRow>
            <div style={{ minHeight: 380, position: 'relative' }}>
              <canvas ref={chartCanvasRef} />
            </div>
          </CModalBody>
          <CModalFooter>
            <ArpButton label="Download Chart" icon="download" color="primary" onClick={downloadChartImage} />
            <ArpButton label="Close" icon="cancel" color="secondary" onClick={() => setChartVisible(false)} />
          </CModalFooter>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default IAResultAnalysisPhase7
