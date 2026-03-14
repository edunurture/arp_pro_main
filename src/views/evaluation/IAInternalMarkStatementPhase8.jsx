import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
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
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'

import api from '../../services/apiClient'
import { ArpButton, ArpDataTable, ArpIconButton, useArpToast } from '../../components/common'
import { getIAMarkStatementConfig, getIAPhase8Statement, getIAWorkflowPhase, IA_PHASE_KEYS, saveIAMarkStatementConfig, saveIAWorkflowPhase } from '../../services/iaWorkflowService'

const PHASE_1_KEY = 'arp.evaluation.ia.phase1.setup.draft.v2'
const PHASE_4_KEY = 'arp.evaluation.ia.phase4.publish.draft.v2'
const PHASE_6_KEY = 'arp.evaluation.ia.phase6.mark-entry.draft.v2'
const PHASE_7_KEY = 'arp.evaluation.ia.phase7.result-analysis.draft.v2'
const PHASE_8_KEY = 'arp.evaluation.ia.phase8.internal-mark-statement.draft.v2'
const ACTIVE_BUNDLE_KEY = 'arp.evaluation.ia.active-bundle.v2'

const DEFAULT_MARK_STATEMENT_COLUMNS = [
  ['serial_no', 'S.No.', 1, true],
  ['register_no', 'Register No.', 2, true],
  ['student_name', 'Student Name', 3, true],
  ['internal_total', 'Internal Total', 90, true],
  ['result', 'Result', 91, true],
  ['remarks', 'Remarks', 92, true],
]

const componentColumnKey = (name) =>
  `component:${String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`

const componentConvertedColumnKey = (name) =>
  `component_conv:${String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`

const buildDefaultColumns = (availableComponentColumns = []) => [
  ...DEFAULT_MARK_STATEMENT_COLUMNS.slice(0, 3),
  ...availableComponentColumns.map((column, index) => [
    column.columnKey,
    column.columnLabel,
    10 + index,
    true,
  ]),
  ...DEFAULT_MARK_STATEMENT_COLUMNS.slice(3),
]

const mergeAvailableComponentColumns = (configColumns = [], mappedComponents = []) => {
  const merged = new Map()
  ;(Array.isArray(configColumns) ? configColumns : []).forEach((column) => {
    const key = String(column?.columnKey || '').trim()
    if (!key) return
    merged.set(key.toLowerCase(), {
      columnKey: key,
      columnLabel: column?.columnLabel || key,
    })
  })
  ;(Array.isArray(mappedComponents) ? mappedComponents : []).forEach((component) => {
    const examName = String(component?.examination || '').trim()
    if (!examName) return
    const rawColumnKey = componentColumnKey(examName)
    const convColumnKey = componentConvertedColumnKey(examName)
    if (!merged.has(rawColumnKey.toLowerCase())) {
      merged.set(rawColumnKey.toLowerCase(), {
        columnKey: rawColumnKey,
        columnLabel: examName,
      })
    }
    if (!merged.has(convColumnKey.toLowerCase())) {
      merged.set(convColumnKey.toLowerCase(), {
        columnKey: convColumnKey,
        columnLabel: `${examName} (Conv.)`,
      })
    }
  })
  return Array.from(merged.values())
}

const normalizeSemesterList = (values) =>
  [...new Set((Array.isArray(values) ? values : []).map((value) => String(value || '').trim()).filter(Boolean))]

const hasSemesterScope = (workflowScope = {}) =>
  Boolean(String(workflowScope?.chosenSemester || '').trim()) ||
  normalizeSemesterList(workflowScope?.chosenSemesters).length > 0

const pad2 = (value) => String(value).padStart(2, '0')
const formatDate = (value) => {
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

const buildDefaultMarkStatementConfig = (availableComponentColumns = [], assessmentCode = '') => ({
  configName: assessmentCode ? `${assessmentCode} Internal Mark Statement` : 'Internal Assessment Mark Statement',
  assessmentCode,
  roundingRule: 'DECIMAL',
  decimalPlaces: 2,
  absentIndicator: 'AB',
  showPageNumber: true,
  reportPaperSize: 'A4',
  pageOrientation: 'PORTRAIT',
  signatoryMode: 'NAME_SIGNATURE',
  customSignatories: ['', '', ''],
  availableComponentColumns,
  columns: buildDefaultColumns(availableComponentColumns).map(([columnKey, columnLabel, displayOrder, isEnabled]) => ({
    columnKey,
    columnLabel,
    displayOrder,
    isEnabled,
  })),
})

const normalizeMarkStatementConfig = (config = {}, mappedComponents = []) => {
  const availableComponentColumns = mergeAvailableComponentColumns(config.availableComponentColumns, mappedComponents)
  const base = buildDefaultMarkStatementConfig(availableComponentColumns, String(config.assessmentCode || '').trim())
  const byKey = new Map((Array.isArray(config.columns) ? config.columns : []).map((row) => [String(row.columnKey || '').trim().toLowerCase(), row]))
  return {
    ...base,
    ...config,
    signatoryMode: String(config.signatoryMode || base.signatoryMode || 'NAME_SIGNATURE'),
    customSignatories: Array.isArray(config.customSignatories)
      ? [
          String(config.customSignatories[0] || ''),
          String(config.customSignatories[1] || ''),
          String(config.customSignatories[2] || ''),
        ]
      : base.customSignatories,
    columns: buildDefaultColumns(availableComponentColumns).map(([columnKey, columnLabel, displayOrder, isEnabled]) => {
      const row = byKey.get(columnKey.toLowerCase()) || {}
      return {
        columnKey,
        columnLabel: row.columnLabel || columnLabel,
        displayOrder: Number.isFinite(Number(row.displayOrder)) ? Number(row.displayOrder) : displayOrder,
        isEnabled: row.isEnabled === undefined ? isEnabled : Boolean(row.isEnabled),
      }
    }).sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder)),
  }
}

const mappedComponentNames = (mappedComponents = []) =>
  [...new Set((Array.isArray(mappedComponents) ? mappedComponents : []).map((component) => String(component?.examination || '').trim()).filter(Boolean))]

const withEditableDisplayOrders = (config = {}, blankOrders = false) => ({
  ...config,
  columns: (Array.isArray(config.columns) ? config.columns : []).map((column, index) => ({
    ...column,
    originalIndex: Number.isFinite(Number(column.originalIndex)) ? Number(column.originalIndex) : index,
    displayOrder:
      blankOrders
        ? ''
        : (column.displayOrder === '' || column.displayOrder === null || column.displayOrder === undefined
            ? ''
            : column.displayOrder),
  })),
})

const applyRoundingRule = (value, config) => {
  if (value === '' || value === null || value === undefined) return ''
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  const rule = String(config?.roundingRule || 'DECIMAL').toUpperCase()
  if (rule === 'ROUND') return Math.round(numeric)
  if (rule === 'INTEGER') return Math.trunc(numeric)
  const places = Number.isFinite(Number(config?.decimalPlaces)) ? Number(config.decimalPlaces) : 2
  return Number(numeric.toFixed(places))
}

const buildConfiguredStatementArtifacts = ({ statementRows = [], mappedComponents = [], config = {} }) => {
  const nextConfig = normalizeMarkStatementConfig(config, mappedComponents)
  const componentKeyMap = Object.fromEntries(
    mappedComponents.flatMap((component) => ([
      [componentColumnKey(component.examination), { cacIndex: component.cacIndex, mode: 'raw' }],
      [componentConvertedColumnKey(component.examination), { cacIndex: component.cacIndex, mode: 'conv' }],
    ])),
  )
  const enabledColumns = nextConfig.columns.filter((column) => column.isEnabled)
  const rows = statementRows.map((row) => {
    const nextRow = {}
    enabledColumns.forEach((column) => {
      const key = column.columnKey
      if (key === 'serial_no') nextRow[key] = row.serialNumber || row.sno || row.serialNo || ''
      else if (key === 'register_no') nextRow[key] = row.registerNumber || '-'
      else if (key === 'student_name') nextRow[key] = row.studentName || '-'
      else if (key === 'internal_total') {
        const raw = row.internalTotal
        nextRow[key] = row.result === 'ABSENT' && (raw === '' || raw === null || raw === undefined)
          ? (nextConfig.absentIndicator || 'AB')
          : (raw === '' || raw === null || raw === undefined ? '' : applyRoundingRule(raw, nextConfig))
      } else if (key === 'result') nextRow[key] = row.result || '-'
        else if (key === 'remarks') nextRow[key] = row.remarks || '-'
        else {
          const componentMeta = componentKeyMap[key]
          const componentAttendance = componentMeta ? String(row[`attendance_${componentMeta.cacIndex}`] || '').trim().toUpperCase() : ''
          const componentResult = componentMeta ? String(row[`result_${componentMeta.cacIndex}`] || '').trim().toUpperCase() : ''
          const showAbsentIndicator =
            componentMeta &&
            (componentAttendance === 'ABSENT' || componentResult === 'ABSENT')
          const value =
            componentMeta?.mode === 'conv'
              ? row[`conv_${componentMeta.cacIndex}`]
              : componentMeta?.mode === 'raw'
                ? row[`raw_${componentMeta.cacIndex}`]
                : ''
          nextRow[key] =
            showAbsentIndicator && (value === '' || value === null || value === undefined)
              ? (nextConfig.absentIndicator || 'AB')
              : (value === '' || value === null || value === undefined ? '' : applyRoundingRule(value, nextConfig))
        }
    })
    return nextRow
  }).map((row, index) => ({
    ...row,
    serial_no: row.serial_no === '' || row.serial_no === null || row.serial_no === undefined ? index + 1 : row.serial_no,
  }))
  const columns = enabledColumns.map((column) => ({
    key: column.columnKey,
    label: column.columnLabel,
    sortable: true,
    sortType: 'string',
  }))
  return { config: nextConfig, rows, columns, enabledColumns }
}

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
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
})

const tile = (label, value) => (
  <div>
    <div className="small text-medium-emphasis">{label}</div>
    <div className="fw-semibold">{value || '-'}</div>
  </div>
)

const buildStatementHtml = ({ workflowScope, institutionMeta, selectedCourse, selectedSchedule, statementConfig, mappedComponents, displayColumns, displayRows }) => {
  const affiliation = institutionMeta?.affiliatedUniversity
    ? `Affiliated to ${institutionMeta.affiliatedUniversity}${institutionMeta?.district ? `, ${institutionMeta.district}` : ''}`
    : '-'
  const paperSize = String(statementConfig?.reportPaperSize || 'A4').toUpperCase()
  const pageOrientation = String(statementConfig?.pageOrientation || 'PORTRAIT').toUpperCase()
  const maximumMarks = (Array.isArray(mappedComponents) ? mappedComponents : []).reduce((sum, component) => {
    const value = Number(component?.contributionMax)
    return Number.isFinite(value) ? sum + value : sum
  }, 0)
  const signatories =
    statementConfig?.signatoryMode === 'NAME_SIGNATURE'
      ? ['Name and Signature']
      : statementConfig?.signatoryMode === 'HOD_DEAN_PRINCIPAL'
        ? ['HoD', 'Dean', 'Principal']
        : statementConfig?.signatoryMode === 'HOD_DIRECTOR_PRINCIPAL'
          ? ['HoD', 'Director', 'Principal']
          : (Array.isArray(statementConfig?.customSignatories) ? statementConfig.customSignatories : [])
              .map((row) => String(row || '').trim())
              .filter(Boolean)
  const isCenteredColumn = (key) =>
    !['register_no', 'student_name', 'remarks'].includes(String(key || '').trim().toLowerCase())

  const headers = displayColumns
    .map((column) => `<th class="${isCenteredColumn(column.key) ? 'align-center' : 'align-left'}">${escapeHtml(column.label)}</th>`)
    .join('')
  const bodyRows = displayRows.length
    ? displayRows
        .map((row, index) => {
          const cells = displayColumns
            .map((column) => `<td class="${isCenteredColumn(column.key) ? 'align-center' : 'align-left'}">${escapeHtml(row[column.key] === '' ? '-' : (row[column.key] ?? '-'))}</td>`)
            .join('')
          return `<tr>${cells}</tr>`
        })
        .join('')
    : '<tr><td colspan="99" style="text-align:center;">No statement rows available.</td></tr>'

  return `<!doctype html><html><head><meta charset="utf-8" /><title>Internal Assessment Mark Statement</title><style>
  @page { size: ${paperSize} ${pageOrientation === 'LANDSCAPE' ? 'landscape' : 'portrait'}; margin: 16mm 14mm 24mm 14mm; }
  body { font-family: Arial, sans-serif; padding: 0; color: #222; margin: 0; }
  .page-shell { min-height: calc(100vh - 40mm); position: relative; padding-bottom: 42px; }
  .inst, .aff, h1 { text-align: center; margin: 0; }
  .inst { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .aff { font-size: 14px; margin-bottom: 10px; }
  h1 { font-size: 20px; margin-bottom: 14px; }
  .meta { display: grid; grid-template-columns: repeat(2, minmax(240px, 1fr)); gap: 10px 16px; margin-bottom: 14px; }
  .meta div { border: 1px solid #ddd; border-radius: 6px; padding: 8px 10px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; }
  .align-left { text-align: left; }
  .align-center { text-align: center; }
  th { background: #f2f4f7; }
  thead { display: table-header-group; }
  tbody { display: table-row-group; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  .footer { margin-top: 24px; display: grid; grid-template-columns: repeat(${Math.max(signatories.length, 1)}, minmax(180px, 1fr)); gap: 20px; align-items: end; }
  .signature { min-width: 180px; text-align: center; font-size: 12px; }
  .footer.single-signature { grid-template-columns: 1fr; justify-items: end; }
  .page-footer { position: fixed; left: 0; right: 0; bottom: 6mm; text-align: center; font-size: 12px; }
  @media print {
    body { padding: 0; }
    .page-shell { min-height: auto; padding-bottom: 0; }
    table { page-break-after: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
  }
  @media screen { body { padding: 18px; } .page-shell { min-height: auto; padding-bottom: 0; } .page-footer { position: static; margin-top: 12px; } }
  </style></head><body>
  <div class="page-shell">
  <div class="inst">${escapeHtml(workflowScope?.institutionName || '-')}</div>
  <div class="aff">${escapeHtml(affiliation)}</div>
  <h1>Internal Assessment Mark Statement</h1>
  <div class="meta">
    <div><strong>Programme:</strong> ${escapeHtml([selectedCourse?.programmeCode, selectedCourse?.programmeName].filter(Boolean).join(' - ') || '-')}</div>
    <div><strong>AY and Semester:</strong> ${escapeHtml([workflowScope?.academicYearLabel || '-', workflowScope?.semesterCategory || '-', selectedCourse?.semester || '-'].join(' | '))}</div>
    <div><strong>Base Bundle:</strong> ${escapeHtml(workflowScope?.examName || workflowScope?.iaCycle || '-')}</div>
    <div><strong>Date of Examination:</strong> ${escapeHtml(formatDate(selectedSchedule?.date))}</div>
    <div><strong>Course:</strong> ${escapeHtml(`${selectedCourse?.courseCode || '-'} - ${selectedCourse?.courseName || '-'}`)}</div>
    <div><strong>Maximum Marks:</strong> ${escapeHtml(maximumMarks ? Number(maximumMarks.toFixed(3)) : '-')}</div>
  </div>
  <table><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>
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
  </div>
  ${statementConfig?.showPageNumber === false ? '' : '<div class="page-footer">Page 1</div>'}
  </body></html>`
}

const IAInternalMarkStatementPhase8 = () => {
  const navigate = useNavigate()

  const phase1 = useMemo(() => {
    try { return JSON.parse(window.sessionStorage.getItem(PHASE_1_KEY) || '{}') } catch { return {} }
  }, [])
  const phase4 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_4_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])
  const phase6 = useMemo(() => {
    try { return JSON.parse(window.sessionStorage.getItem(PHASE_6_KEY) || '{}') } catch { return {} }
  }, [])
  const phase7 = useMemo(() => {
    try { return JSON.parse(window.sessionStorage.getItem(PHASE_7_KEY) || '{}') } catch { return {} }
  }, [])
  const activeBundle = useMemo(() => {
    try { return JSON.parse(window.sessionStorage.getItem(ACTIVE_BUNDLE_KEY) || 'null') } catch { return null }
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

  const workflowScope = useMemo(() => resolveWorkflowScope(phase1, phase4, activeBundle), [phase1, phase4, activeBundle])

  const toast = useArpToast()
  const [status, setStatus] = useState('DRAFT')
  const [programmeFilter, setProgrammeFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [tablePageSize, setTablePageSize] = useState(10)
  const [institutionMeta, setInstitutionMeta] = useState({})
  const [statementConfig, setStatementConfig] = useState(buildDefaultMarkStatementConfig())
  const [savingStatementConfig, setSavingStatementConfig] = useState(false)
  const [configAccordionVisible, setConfigAccordionVisible] = useState(false)
  const [statementData, setStatementData] = useState(null)
  const [loadingStatement, setLoadingStatement] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const previewFrameRef = useRef(null)

  const phaseLocked = status === 'INTERNAL_MARK_STATEMENT_COMPLETED'
  const markEntryReady = String(phase6?.status || '').toUpperCase() === 'READY_FOR_PHASE_7'
  const hasPhase6Data = Array.isArray(phase6?.courseRows) && phase6.courseRows.length > 0
  const courseRows = Array.isArray(phase6?.courseRows) ? phase6.courseRows : []
  const showToast = (type, message) => toast.show({ type, message, autohide: type === 'success', delay: 4500 })
  useEffect(() => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(PHASE_8_KEY) || '{}')
      if (saved?.status) setStatus(String(saved.status))
      if (saved?.programmeFilter) setProgrammeFilter(String(saved.programmeFilter))
      if (saved?.semesterFilter) setSemesterFilter(String(saved.semesterFilter))
      if (saved?.courseFilter) setCourseFilter(String(saved.courseFilter))
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!hasActiveBundle) {
      navigate('/evaluation/ia/workspace', {
        replace: true,
        state: { workspaceNotice: 'Select or create an IA Workspace first.' },
      })
      return
    }
    if (!markEntryReady && !hasPhase6Data) {
      showToast('warning', 'Phase 8 can open in partial mode, but no Phase 6 mark-entry data is available yet for the active scope.')
    }
  }, [hasActiveBundle, hasPhase6Data, markEntryReady, navigate])

  useEffect(() => {
    const wf = workflowScope || {}
    if (!wf.institutionId || !wf.academicYearId || !hasSemesterScope(wf) || !wf.programmeId) return
    ;(async () => {
      try {
        const remote = await getIAWorkflowPhase(IA_PHASE_KEYS.PHASE_8_INTERNAL_MARK_STATEMENT, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          chosenSemesters: normalizeSemesterList(wf.chosenSemesters),
          programmeId: wf.programmeId || '',
          iaCycle: wf.iaCycle || wf.examName || '',
          examName: wf.examName || wf.iaCycle || '',
        })
        const payload = remote?.payload && typeof remote.payload === 'object' ? remote.payload : null
        if (payload?.status) setStatus(String(payload.status))
        if (payload?.programmeFilter) setProgrammeFilter(String(payload.programmeFilter))
        if (payload?.semesterFilter) setSemesterFilter(String(payload.semesterFilter))
        if (payload?.courseFilter) setCourseFilter(String(payload.courseFilter))
      } catch {
        // keep session state
      }
    })()
  }, [workflowScope])

  useEffect(() => {
    const institutionId = String(workflowScope?.institutionId || '').trim()
    if (!institutionId) return
    ;(async () => {
      try {
        const institutionRes = await api.get('/api/setup/institution')
        const institutions = unwrapList(institutionRes)
        setInstitutionMeta(institutions.find((row) => String(row.id) === institutionId) || {})
      } catch {
        setInstitutionMeta({})
      }
    })()
  }, [workflowScope?.institutionId])

  const programmeOptions = useMemo(
    () =>
      [...new Map(
        courseRows
          .filter((row) => row.programmeId || row.programmeCode || row.programmeName)
          .map((row) => [
            String(row.programmeId || row.programmeCode || row.programmeName),
            {
              value: String(row.programmeId || row.programmeCode || row.programmeName),
              label: [row.programmeCode, row.programmeName].filter(Boolean).join(' - ') || row.programmeCode || row.programmeName,
            },
          ]),
      ).values()],
    [courseRows],
  )

  const semesterOptions = useMemo(
    () => [...new Set(courseRows.map((row) => String(row.semester || '').trim()).filter(Boolean))].sort((a, b) => Number(a) - Number(b)),
    [courseRows],
  )

  const filteredCourses = useMemo(
    () =>
      courseRows.filter((row) => {
        if (programmeFilter && String(row.programmeId || row.programmeCode || row.programmeName) !== String(programmeFilter)) return false
        if (semesterFilter && String(row.semester || '') !== String(semesterFilter)) return false
        return true
      }),
    [courseRows, programmeFilter, semesterFilter],
  )

  const courseOptions = useMemo(
    () => filteredCourses.map((row) => ({ value: String(row.courseId), label: `${row.courseCode} - ${row.courseName}` })),
    [filteredCourses],
  )

  const selectedCourse = useMemo(
    () => courseRows.find((row) => String(row.courseId) === String(courseFilter)) || null,
    [courseRows, courseFilter],
  )

  useEffect(() => {
    if (!selectedCourse) {
      setStatementData(null)
      return
    }
    const wf = workflowScope || {}
    if (!wf.institutionId || !wf.academicYearId || !wf.semesterCategory) return
    ;(async () => {
      try {
        setLoadingStatement(true)
        const data = await getIAPhase8Statement({
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          semesterCategory: wf.semesterCategory || '',
          programmeId: selectedCourse.programmeId || '',
          chosenSemester: selectedCourse.semester || '',
          courseId: selectedCourse.courseId || '',
          courseCode: selectedCourse.courseCode || '',
        })
        setStatementData(data || null)
      } catch {
        setStatementData(null)
        showToast('danger', 'Unable to compute the internal assessment mark statement.')
      } finally {
        setLoadingStatement(false)
      }
    })()
  }, [selectedCourse, workflowScope])

  const selectedPublishedSchedule = useMemo(() => {
    const publishedCourses = phase4?.snapshot?.courses || phase4?.courses || []
    const publishedSlots = phase4?.snapshot?.slots || phase4?.slots || []
    const slotById = Object.fromEntries((Array.isArray(publishedSlots) ? publishedSlots : []).map((slot) => [slot.id, slot]))
    const publishedCourse = (Array.isArray(publishedCourses) ? publishedCourses : []).find((row) => String(row.id) === String(courseFilter))
    const slot = slotById[publishedCourse?.slotId] || {}
    return { date: slot?.date || '', session: slot?.session || '', time: slot?.startTime && slot?.endTime ? `${slot.startTime} - ${slot.endTime}` : '' }
  }, [phase4, courseFilter])

  const mappedComponents = useMemo(
    () => (Array.isArray(statementData?.mappedComponents) ? statementData.mappedComponents : []),
    [statementData?.mappedComponents],
  )
  const sourceBundles = useMemo(
    () => (Array.isArray(statementData?.sourceBundles) ? statementData.sourceBundles : []),
    [statementData?.sourceBundles],
  )
  const statementRows = useMemo(
    () => (Array.isArray(statementData?.statementRows) ? statementData.statementRows : []),
    [statementData?.statementRows],
  )
  const statementSummary = statementData?.statementSummary || { total: 0, completed: 0, partial: 0, pending: 0, mappingMissing: 0 }
  const validation = statementData?.validation || { status: 'PENDING', message: 'Select one course to compute the internal mark statement.' }
  const selectedCourseMeta = statementData?.course
    ? { ...statementData.course, assessmentCode: statementData.assessmentCode || '-' }
    : selectedCourse
      ? { ...selectedCourse, assessmentCode: '-' }
      : null

  useEffect(() => {
    const institutionId = String(workflowScope?.institutionId || '').trim()
    const assessmentCode = String(selectedCourseMeta?.assessmentCode || '').trim()
    const componentNames = mappedComponentNames(mappedComponents)
    if (!institutionId || !assessmentCode) {
      setStatementConfig(withEditableDisplayOrders(buildDefaultMarkStatementConfig(
        mergeAvailableComponentColumns([], mappedComponents),
        assessmentCode,
      ), true))
      return
    }
    ;(async () => {
      try {
        const data = await getIAMarkStatementConfig({ institutionId, assessmentCode, componentNames })
        const normalized = normalizeMarkStatementConfig(data || { assessmentCode }, mappedComponents)
        if (!data?.signatoryMode && phase7?.signatoryMode) normalized.signatoryMode = String(phase7.signatoryMode)
        if ((!Array.isArray(data?.customSignatories) || data.customSignatories.length === 0) && Array.isArray(phase7?.customSignatories)) {
          normalized.customSignatories = [
            String(phase7.customSignatories[0] || ''),
            String(phase7.customSignatories[1] || ''),
            String(phase7.customSignatories[2] || ''),
          ]
        }
        setStatementConfig(withEditableDisplayOrders(normalized, !data?.id))
      } catch {
        const fallback = buildDefaultMarkStatementConfig(
          mergeAvailableComponentColumns([], mappedComponents),
          assessmentCode,
        )
        if (phase7?.signatoryMode) fallback.signatoryMode = String(phase7.signatoryMode)
        if (Array.isArray(phase7?.customSignatories)) {
          fallback.customSignatories = [
            String(phase7.customSignatories[0] || ''),
            String(phase7.customSignatories[1] || ''),
            String(phase7.customSignatories[2] || ''),
          ]
        }
        setStatementConfig(withEditableDisplayOrders(fallback, true))
      }
    })()
  }, [workflowScope?.institutionId, selectedCourseMeta?.assessmentCode, mappedComponents, phase7])

  useEffect(() => {
    if (!selectedCourseMeta) {
      setConfigAccordionVisible(false)
    }
  }, [selectedCourseMeta])

  const configuredArtifacts = useMemo(
    () => buildConfiguredStatementArtifacts({ statementRows, mappedComponents, config: statementConfig }),
    [statementRows, mappedComponents, statementConfig],
  )
  const displayRows = configuredArtifacts.rows
  const statementColumns = configuredArtifacts.columns

  const sourceRows = useMemo(
    () =>
      sourceBundles.map((row) => ({
        componentIndex: row.componentIndex,
        examName: row.examName,
        sourceType: row.sourceType === 'LMS_ASSIGNMENT' ? 'LMS Assignment' : 'IA Bundle',
        sourceTitle: row.sourceTitle || '-',
        maxMarks: row.maxMarks,
        contributionMax: row.contributionMax,
        sourceBundleStatus: row.sourceBundleStatus,
        studentCount: row.studentCount,
        updatedAt: row.updatedAt ? formatDate(row.updatedAt) : '-',
      })),
    [sourceBundles],
  )

  const sourceColumns = useMemo(
    () => [
      { key: 'componentIndex', label: 'CAC', sortable: true, sortType: 'string' },
      { key: 'examName', label: 'Mapped Examination', sortable: true, sortType: 'string' },
      { key: 'sourceType', label: 'Source Type', sortable: true, sortType: 'string' },
      { key: 'sourceTitle', label: 'Source Name', sortable: true, sortType: 'string' },
      { key: 'maxMarks', label: 'Max Marks', sortable: true, sortType: 'number', align: 'right' },
      { key: 'contributionMax', label: 'Contribution Max', sortable: true, sortType: 'number', align: 'right' },
      { key: 'sourceBundleStatus', label: 'Source Bundle', sortable: true, sortType: 'string' },
      { key: 'studentCount', label: 'Students', sortable: true, sortType: 'number', align: 'right' },
      { key: 'updatedAt', label: 'Updated', sortable: true, sortType: 'string' },
    ],
    [],
  )

  const configColumns = useMemo(
    () =>
      [...(Array.isArray(statementConfig.columns) ? statementConfig.columns : [])].sort((a, b) => {
        const aHas = String(a.displayOrder ?? '').trim() !== ''
        const bHas = String(b.displayOrder ?? '').trim() !== ''
        if (aHas && bHas) return Number(a.displayOrder) - Number(b.displayOrder)
        if (aHas) return -1
        if (bHas) return 1
        return Number(a.originalIndex ?? 0) - Number(b.originalIndex ?? 0)
      }),
    [statementConfig.columns],
  )

  const updateConfigColumn = (columnKey, patch) => {
    setStatementConfig((prev) => ({
      ...prev,
      columns: (prev.columns || []).map((column) =>
        String(column.columnKey) === String(columnKey) ? { ...column, ...patch } : column,
      ),
    }))
  }

  const onSaveStatementConfig = async () => {
    const institutionId = String(workflowScope?.institutionId || '').trim()
    const assessmentCode = String(selectedCourseMeta?.assessmentCode || '').trim()
    if (!institutionId || !assessmentCode) {
      showToast('danger', 'Select one course to configure the mark statement.')
      return
    }
    setSavingStatementConfig(true)
    try {
      const payload = normalizeMarkStatementConfig({
        ...statementConfig,
        institutionId,
        assessmentCode,
        componentNames: mappedComponentNames(mappedComponents),
        configName: statementConfig?.configName || `${assessmentCode} Internal Mark Statement`,
      }, mappedComponents)
      const saved = await saveIAMarkStatementConfig(payload)
      setStatementConfig(withEditableDisplayOrders(normalizeMarkStatementConfig(saved || payload, mappedComponents), false))
      showToast('success', 'Phase 8 mark statement configuration saved.')
    } catch {
      showToast('danger', 'Unable to save Phase 8 mark statement configuration.')
    } finally {
      setSavingStatementConfig(false)
    }
  }

  const persist = async (nextStatus) => {
    const payload = {
      status: nextStatus,
      programmeFilter,
      semesterFilter,
      courseFilter,
      selectedCourse: selectedCourseMeta,
      mappedComponents,
      sourceBundles,
      statementRows,
      statementSummary,
      validation,
      statementConfig,
      computationScope: {
        baseBundleExam: workflowScope?.examName || workflowScope?.iaCycle || '',
        sourceExamNames: sourceBundles.map((row) => row.examName),
      },
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_8_KEY, JSON.stringify(payload))
    try {
      const wf = workflowScope || {}
      await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_8_INTERNAL_MARK_STATEMENT, {
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
        payload: { workflowScope: wf, ...payload },
      })
    } catch {
      // keep local state
    }
    setStatus(nextStatus)
  }

  const ensureSelectedCourse = () => {
    if (!selectedCourseMeta) {
      showToast('danger', 'Select one course to continue.')
      return false
    }
    return true
  }

  const onSaveDraft = async () => {
    await persist(status === 'INTERNAL_MARK_STATEMENT_COMPLETED' ? 'INTERNAL_MARK_STATEMENT_COMPLETED' : 'DRAFT')
    showToast('success', 'Phase 8 internal mark statement draft saved.')
  }

  const onClosePhase8 = async () => {
    if (!ensureSelectedCourse()) return
    if (String(validation?.status || '').toUpperCase() !== 'COMPLETED') {
      showToast('danger', validation?.message || 'Mapped bundles are not fully available for computation.')
      return
    }
    if (statementRows.length === 0 || statementRows.some((row) => row.statementStatus !== 'COMPLETED')) {
      showToast('danger', 'Every student row must reach COMPLETED before closing Phase 8.')
      return
    }
    await persist('INTERNAL_MARK_STATEMENT_COMPLETED')
    showToast('success', 'Phase 8 internal mark statement completed.')
  }

  const onView = () => {
    if (!ensureSelectedCourse()) return
    setPreviewHtml(buildStatementHtml({
      workflowScope,
      institutionMeta,
      selectedCourse: selectedCourseMeta,
      selectedSchedule: selectedPublishedSchedule,
      statementConfig,
      mappedComponents,
      displayColumns: statementColumns,
      displayRows,
    }))
    setPreviewVisible(true)
  }

  const onPrint = () => {
    if (!ensureSelectedCourse()) return
    onView()
  }

  const onDownloadWord = () => {
    if (!ensureSelectedCourse()) return
    const html = buildStatementHtml({
      workflowScope,
      institutionMeta,
      selectedCourse: selectedCourseMeta,
      selectedSchedule: selectedPublishedSchedule,
      statementConfig,
      mappedComponents,
      displayColumns: statementColumns,
      displayRows,
    })
    const blob = new Blob([html], { type: 'application/msword' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedCourseMeta.courseCode || 'IA_Internal_Mark_Statement'}.doc`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const onDownloadXlsx = async () => {
    if (!ensureSelectedCourse()) return
    try {
      const mod = await import('xlsx')
      const XLSX = mod?.default || mod
      const wb = XLSX.utils.book_new()
      const context = [
        { Field: 'Institution', Value: workflowScope?.institutionName || '-' },
        { Field: 'Academic Year', Value: workflowScope?.academicYearLabel || '-' },
        { Field: 'Base Bundle', Value: workflowScope?.examName || workflowScope?.iaCycle || '-' },
        { Field: 'Course', Value: `${selectedCourseMeta?.courseCode || '-'} - ${selectedCourseMeta?.courseName || '-'}` },
        { Field: 'Assessment Code', Value: selectedCourseMeta?.assessmentCode || '-' },
        { Field: 'Rounding Rule', Value: statementConfig?.roundingRule || '-' },
        { Field: 'Absent Indicator', Value: statementConfig?.absentIndicator || '-' },
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(context), 'Report Context')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sourceRows.length > 0 ? sourceRows : [{ Info: 'No source bundles available' }]), 'Source Bundles')
      const exportRows = displayRows.length > 0
        ? displayRows.map((row) =>
            Object.fromEntries(statementColumns.map((column) => [column.label, row[column.key] === '' ? '-' : (row[column.key] ?? '-')]))
          )
        : [{ Info: 'No statement rows available' }]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportRows), 'Mark Statement')
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'IA_Internal_Mark_Statement.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      showToast('danger', 'Unable to generate mark statement workbook.')
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3 border-info">
          <CCardBody>
            <CRow className="g-3 align-items-center">
              <CCol md={3}>{tile('Institution', workflowScope?.institutionName || workflowScope?.institutionId || '-')}</CCol>
              <CCol md={3}>{tile('Academic Year / Semester', `${workflowScope?.academicYearLabel || workflowScope?.academicYearId || '-'}${workflowScope?.semesterCategory ? ` / ${workflowScope.semesterCategory}` : ''} / ${(normalizeSemesterList(workflowScope?.chosenSemesters).join(', ') || workflowScope?.chosenSemester || '-')}`)}</CCol>
              <CCol md={2}>{tile('Workspace', workflowScope?.workspaceType || 'SINGLE')}</CCol>
              <CCol md={2}>{tile('Base Bundle', workflowScope?.examName || workflowScope?.iaCycle || '-')}</CCol>
              <CCol md={2}>{tile('Phase 8 Status', status)}</CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT - PHASE 8 INTERNAL MARK STATEMENT</strong>
            <CBadge color={status === 'INTERNAL_MARK_STATEMENT_COMPLETED' ? 'success' : 'info'}>{status}</CBadge>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel>Filter by Programme</CFormLabel>
                <CFormSelect value={programmeFilter} onChange={(e) => { setProgrammeFilter(e.target.value); setCourseFilter('') }} disabled={phaseLocked}>
                  <option value="">All Programmes</option>
                  {programmeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormLabel>Filter by Semester</CFormLabel>
                <CFormSelect value={semesterFilter} onChange={(e) => { setSemesterFilter(e.target.value); setCourseFilter('') }} disabled={phaseLocked}>
                  <option value="">All Semesters</option>
                  {semesterOptions.map((semester) => <option key={semester} value={semester}>{semester}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>Filter by Course</CFormLabel>
                <CFormSelect value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} disabled={phaseLocked}>
                  <option value="">Select Course</option>
                  {courseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Assessment Code</CFormLabel>
                <CFormInput value={selectedCourseMeta?.assessmentCode || '-'} disabled />
              </CCol>
              <CCol md={12}>
                <div className="d-flex flex-wrap gap-2">
                  <CBadge color="dark">Students: {statementSummary.total}</CBadge>
                  <CBadge color="success">Completed: {statementSummary.completed}</CBadge>
                  <CBadge color="warning">Partial: {statementSummary.partial}</CBadge>
                  <CBadge color="secondary">Pending: {statementSummary.pending}</CBadge>
                  <CBadge color="danger">Mapping Missing: {statementSummary.mappingMissing}</CBadge>
                  <CBadge color={String(validation?.status || '').toUpperCase() === 'COMPLETED' ? 'success' : 'warning'}>Validation: {validation?.status || 'PENDING'}</CBadge>
                </div>
                <div className="small text-medium-emphasis mt-2">{validation?.message || 'Select one course to compute the internal mark statement.'}</div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Computation Scope</strong>
            {loadingStatement ? <CBadge color="info">Computing...</CBadge> : null}
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}>{tile('Course', selectedCourseMeta ? `${selectedCourseMeta.courseCode} - ${selectedCourseMeta.courseName}` : '-')}</CCol>
              <CCol md={3}>{tile('Programme', selectedCourseMeta ? [selectedCourseMeta.programmeCode, selectedCourseMeta.programmeName].filter(Boolean).join(' - ') : '-')}</CCol>
              <CCol md={2}>{tile('Semester', selectedCourseMeta?.semester || '-')}</CCol>
              <CCol md={2}>{tile('Mapped Components', mappedComponents.length || 0)}</CCol>
              <CCol md={2}>{tile('Source Bundles Found', sourceBundles.filter((row) => row.hasSourceBundle).length)}</CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Mapped Source Bundles</strong></CCardHeader>
          <CCardBody>
            <ArpDataTable rows={sourceRows} columns={sourceColumns} rowKey="componentIndex" pageSize={10} showPageSizeControl={false} searchable={false} emptyText="Select a course to resolve mapped examination bundles." />
          </CCardBody>
        </CCard>

        <CAccordion className="mb-3" activeItemKey={configAccordionVisible ? 1 : undefined} alwaysOpen>
          <CAccordionItem itemKey={1}>
            <CAccordionHeader onClick={() => setConfigAccordionVisible((prev) => !prev)}>
              <div className="d-flex w-100 justify-content-between align-items-center pe-3">
                <strong>Phase 8 Mark Statement Configuration</strong>
                <span className="small text-medium-emphasis">
                  {selectedCourseMeta?.assessmentCode ? `Pattern: ${selectedCourseMeta.assessmentCode}` : 'Select a course to configure'}
                </span>
              </div>
            </CAccordionHeader>
            <CAccordionBody>
              <div className="d-flex justify-content-end mb-3">
                <ArpButton
                  label={savingStatementConfig ? 'Saving...' : 'Save Configuration'}
                  icon="save"
                  color="primary"
                  onClick={onSaveStatementConfig}
                  disabled={savingStatementConfig || !selectedCourseMeta}
                />
              </div>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Assessment Code</CFormLabel>
                  <CFormInput value={selectedCourseMeta?.assessmentCode || '-'} disabled />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Rounding Rule</CFormLabel>
                  <CFormSelect
                    value={statementConfig.roundingRule || 'DECIMAL'}
                    onChange={(e) => setStatementConfig((prev) => ({ ...prev, roundingRule: e.target.value }))}
                    disabled={!selectedCourseMeta}
                  >
                    <option value="DECIMAL">Decimal</option>
                    <option value="ROUND">Rounded</option>
                    <option value="INTEGER">Integer Only</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Decimal Places</CFormLabel>
                  <CFormInput
                    type="number"
                    min="0"
                    max="4"
                    value={statementConfig.decimalPlaces ?? 2}
                    onChange={(e) => setStatementConfig((prev) => ({ ...prev, decimalPlaces: e.target.value }))}
                    disabled={!selectedCourseMeta || String(statementConfig.roundingRule || 'DECIMAL').toUpperCase() !== 'DECIMAL'}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Absent Indicator</CFormLabel>
                  <CFormInput
                    value={statementConfig.absentIndicator || ''}
                    onChange={(e) => setStatementConfig((prev) => ({ ...prev, absentIndicator: e.target.value }))}
                    disabled={!selectedCourseMeta}
                  />
                </CCol>
                <CCol md={2} className="d-flex align-items-end">
                  <CFormCheck
                    label="Show Page Number"
                    checked={Boolean(statementConfig.showPageNumber)}
                    onChange={(e) => setStatementConfig((prev) => ({ ...prev, showPageNumber: e.target.checked }))}
                    disabled={!selectedCourseMeta}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Paper Size</CFormLabel>
                  <CFormSelect
                    value={statementConfig.reportPaperSize || 'A4'}
                    onChange={(e) => setStatementConfig((prev) => ({ ...prev, reportPaperSize: e.target.value }))}
                    disabled={!selectedCourseMeta}
                  >
                    <option value="A4">A4</option>
                    <option value="LETTER">Letter</option>
                    <option value="LEGAL">Legal</option>
                    <option value="A3">A3</option>
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Orientation</CFormLabel>
                  <CFormSelect
                    value={statementConfig.pageOrientation || 'PORTRAIT'}
                    onChange={(e) => setStatementConfig((prev) => ({ ...prev, pageOrientation: e.target.value }))}
                    disabled={!selectedCourseMeta}
                  >
                    <option value="PORTRAIT">Portrait</option>
                    <option value="LANDSCAPE">Landscape</option>
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Signatory Format</CFormLabel>
                  <CFormSelect
                    value={statementConfig.signatoryMode || 'NAME_SIGNATURE'}
                    onChange={(e) => setStatementConfig((prev) => ({ ...prev, signatoryMode: e.target.value }))}
                    disabled={!selectedCourseMeta}
                  >
                    <option value="NAME_SIGNATURE">Name and Signature</option>
                    <option value="HOD_DEAN_PRINCIPAL">HoD / Dean / Principal</option>
                    <option value="HOD_DIRECTOR_PRINCIPAL">HoD / Director / Principal</option>
                    <option value="CUSTOM">Custom</option>
                  </CFormSelect>
                </CCol>
                {String(statementConfig.signatoryMode || '') === 'CUSTOM' ? (
                  <>
                    <CCol md={4}>
                      <CFormLabel>Custom Signatory 1</CFormLabel>
                      <CFormInput
                        value={statementConfig.customSignatories?.[0] || ''}
                        onChange={(e) => setStatementConfig((prev) => ({
                          ...prev,
                          customSignatories: [e.target.value, prev.customSignatories?.[1] || '', prev.customSignatories?.[2] || ''],
                        }))}
                        disabled={!selectedCourseMeta}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel>Custom Signatory 2</CFormLabel>
                      <CFormInput
                        value={statementConfig.customSignatories?.[1] || ''}
                        onChange={(e) => setStatementConfig((prev) => ({
                          ...prev,
                          customSignatories: [prev.customSignatories?.[0] || '', e.target.value, prev.customSignatories?.[2] || ''],
                        }))}
                        disabled={!selectedCourseMeta}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel>Custom Signatory 3</CFormLabel>
                      <CFormInput
                        value={statementConfig.customSignatories?.[2] || ''}
                        onChange={(e) => setStatementConfig((prev) => ({
                          ...prev,
                          customSignatories: [prev.customSignatories?.[0] || '', prev.customSignatories?.[1] || '', e.target.value],
                        }))}
                        disabled={!selectedCourseMeta}
                      />
                    </CCol>
                  </>
                ) : null}
                <CCol md={12}>
                  <CTable bordered hover responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell style={{ width: 90 }}>Enable</CTableHeaderCell>
                        <CTableHeaderCell>Column Key</CTableHeaderCell>
                        <CTableHeaderCell>Column Label</CTableHeaderCell>
                        <CTableHeaderCell style={{ width: 140 }}>Display Order</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {configColumns.map((column) => (
                        <CTableRow key={column.columnKey}>
                          <CTableDataCell>
                            <CFormCheck
                              checked={Boolean(column.isEnabled)}
                              onChange={(e) => updateConfigColumn(column.columnKey, { isEnabled: e.target.checked })}
                              disabled={!selectedCourseMeta}
                            />
                          </CTableDataCell>
                          <CTableDataCell>{column.columnKey}</CTableDataCell>
                          <CTableDataCell>
                            <CFormInput
                              value={column.columnLabel || ''}
                              onChange={(e) => updateConfigColumn(column.columnKey, { columnLabel: e.target.value })}
                              disabled={!selectedCourseMeta}
                            />
                          </CTableDataCell>
                          <CTableDataCell>
                            <CFormInput
                              type="number"
                              min="1"
                              value={column.displayOrder ?? ''}
                              onChange={(e) => updateConfigColumn(column.columnKey, { displayOrder: e.target.value })}
                              disabled={!selectedCourseMeta}
                            />
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                      {configColumns.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell colSpan={4} className="text-center text-medium-emphasis">
                            Select a course to configure mapped mark statement columns.
                          </CTableDataCell>
                        </CTableRow>
                      ) : null}
                    </CTableBody>
                  </CTable>
                </CCol>
              </CRow>
            </CAccordionBody>
          </CAccordionItem>
        </CAccordion>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Internal Assessment Mark Statement</strong>
            <div className="d-flex align-items-center gap-2">
              <CFormSelect value={tablePageSize} onChange={(e) => setTablePageSize(Number(e.target.value))} style={{ width: 130 }}>
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </CFormSelect>
              <ArpIconButton icon="view" color="info" title="View" onClick={onView} disabled={!courseFilter} />
              <ArpIconButton icon="download" color="success" title="Download XLSX" onClick={onDownloadXlsx} disabled={!courseFilter} />
              <ArpIconButton icon="download" color="primary" title="Download Word Document" onClick={onDownloadWord} disabled={!courseFilter} />
              <ArpIconButton icon="print" color="secondary" title="Print with Preview" onClick={onPrint} disabled={!courseFilter} />
            </div>
          </CCardHeader>
          <CCardBody>
            <ArpDataTable rows={displayRows} columns={statementColumns} rowKey="studentId" pageSize={tablePageSize} onPageSizeChange={setTablePageSize} showPageSizeControl={false} searchable={false} emptyText="Select a course to compute the internal mark statement." />
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader><strong>Phase 8 Actions</strong></CCardHeader>
          <CCardBody className="d-flex justify-content-end gap-2">
            <ArpButton label="Save Draft" icon="save" color="secondary" onClick={onSaveDraft} />
            <ArpButton label="Close Phase 8" icon="submit" color="success" onClick={onClosePhase8} />
          </CCardBody>
        </CCard>

        <CModal visible={previewVisible} onClose={() => setPreviewVisible(false)} size="xl">
          <CModalHeader closeButton>
            <CModalTitle>Internal Mark Statement Preview</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <iframe ref={previewFrameRef} title="Internal Mark Statement Preview" style={{ width: '100%', minHeight: '70vh', border: '1px solid #ddd' }} srcDoc={previewHtml} />
          </CModalBody>
          <CModalFooter>
            <ArpButton label="Print" icon="print" color="primary" onClick={() => previewFrameRef.current?.contentWindow?.print()} />
            <ArpButton label="Close" icon="cancel" color="secondary" onClick={() => setPreviewVisible(false)} />
          </CModalFooter>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default IAInternalMarkStatementPhase8
