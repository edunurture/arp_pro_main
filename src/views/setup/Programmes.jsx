import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'
import api from '../../services/apiClient'

import {
  CCard,
  CCardHeader,
  CCardBody,
  CAlert,
  CSpinner,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormCheck,
  CBadge,
  CProgress,
  CProgressBar
} from '@coreui/react-pro'

/**
 * Programmes.jsx (ARP Standard) - Department.jsx Pattern
 *
 * ✅ Buttons EXACTLY like Department.jsx:
 *   Header action buttons:
 *     - Add New (ArpButton label+icon)
 *     - View/Edit/Delete (ArpIconButton)
 *
 * ✅ Excel section EXACTLY like Department.jsx:
 *   - Download Template (ArpButton)
 *   - File input (inline)
 *   - Import Excel (ArpButton)
 *
 * CRUD:
 *   GET    /api/setup/programme
 *   POST   /api/setup/programme
 *   PUT    /api/setup/programme/:id
 *   DELETE /api/setup/programme/:id
 *
 * Excel:
 *   GET    /api/setup/programme/template
 *   POST   /api/setup/programme/import
 */

const initialForm = {
  institutionId: '',
  departmentId: '',
  programmeCode: '',
  programmeName: '',
  offeringMode: '',
  branchOfStudy: '',
  graduationCategory: '',
  yearOfIntroduction: '',
  sanctionedIntake: '',
  affiliationStatus: '',
  accreditationStatus: '',
  programmeStatus: '',
  totalSemesters: '',
  totalCredits: '',
  totalMaxMarks: '',
  isActive: true,
}

const enumOptions = {
  offeringMode: [
    { value: '', label: 'Select' },
    { value: 'REGULAR', label: 'Regular' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'DISTANCE', label: 'Distance' },
    { value: 'ONLINE', label: 'Online' },
  ],
  graduationCategory: [
    { value: '', label: 'Select' },
    { value: 'UG', label: 'UG' },
    { value: 'PG', label: 'PG' },
    { value: 'DIPLOMA', label: 'Diploma' },
    { value: 'PHD', label: 'PhD' },
    { value: 'CERTIFICATE', label: 'Certificate' },
    { value: 'OTHERS', label: 'Others' },
  ],
  affiliationStatus: [
    { value: '', label: 'Select' },
    { value: 'AFFILIATED', label: 'Affiliated' },
    { value: 'AUTONOMOUS', label: 'Autonomous' },
    { value: 'DEEMED', label: 'Deemed' },
  ],
  accreditationStatus: [
    { value: '', label: 'Select' },
    { value: 'ACCREDITED', label: 'Accredited' },
    { value: 'NOT_ACCREDITED', label: 'Not Accredited' },
    { value: 'APPLIED', label: 'Applied' },
  ],
  programmeStatus: [
    { value: '', label: 'Select' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'CLOSED', label: 'Closed' },
  ],
}

const toIntOrEmpty = (v) => (v === null || v === undefined ? '' : String(v))

const toPayload = (form) => ({
  institutionId: String(form.institutionId || '').trim(),
  departmentId: String(form.departmentId || '').trim(),
  programmeCode: String(form.programmeCode || '').trim(),
  programmeName: String(form.programmeName || '').trim(),

  offeringMode: form.offeringMode || null,
  branchOfStudy: String(form.branchOfStudy || '').trim() || null,
  graduationCategory: form.graduationCategory || null,
  yearOfIntroduction: form.yearOfIntroduction === '' ? null : Number(form.yearOfIntroduction),
  sanctionedIntake: form.sanctionedIntake === '' ? null : Number(form.sanctionedIntake),

  affiliationStatus: form.affiliationStatus || null,
  accreditationStatus: form.accreditationStatus || null,
  programmeStatus: form.programmeStatus || null,

  totalSemesters: form.totalSemesters === '' ? null : Number(form.totalSemesters),
  totalCredits: form.totalCredits === '' ? null : Number(form.totalCredits),
  totalMaxMarks: form.totalMaxMarks === '' ? null : Number(form.totalMaxMarks),

  isActive: form.isActive !== false,
})

const Programmes = () => {
  // masters
  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])

  // table
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // form
  // form mode: VIEW (disabled) | NEW | EDIT
  const [formMode, setFormMode] = useState('VIEW')
  const [form, setForm] = useState(initialForm)
  const [toast, setToast] = useState(null)

  // Import / Preview (Department.jsx pattern)
  const fileRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importSummary, setImportSummary] = useState(null)

  const [exporting, setExporting] = useState(false)

  const showToast = (type, message) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4500)
  }



  const downloadBase64Excel = (base64, filename = 'Programme_Import_Errors.xlsx') => {
    try {
      if (!base64) return
      const byteChars = atob(base64)
      const byteNumbers = new Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
      const blob = new Blob([new Uint8Array(byteNumbers)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      // ignore download errors
    }
  }

  const unwrapArray = (res) => {
    const d = res?.data

    // ARP standard: { success:true, data: [...] }
    if (d && typeof d === 'object' && Object.prototype.hasOwnProperty.call(d, 'success')) {
      const inner = d.data

      if (Array.isArray(inner)) return inner

      // Some controllers may wrap list inside an object: { data:{ rows:[...] } } etc.
      if (inner && typeof inner === 'object') {
        if (Array.isArray(inner.rows)) return inner.rows
        if (Array.isArray(inner.items)) return inner.items
        if (Array.isArray(inner.programmes)) return inner.programmes
        if (Array.isArray(inner.departments)) return inner.departments
        if (Array.isArray(inner.institutions)) return inner.institutions
        if (Array.isArray(inner.data)) return inner.data
      }

      return []
    }

    // Plain array response
    return Array.isArray(d) ? d : []
  }


  const digitsOnly = (value, maxLen) => {
    const s = String(value ?? '').replace(/\D/g, '')
    return typeof maxLen === 'number' ? s.slice(0, maxLen) : s
  }

  const setNumericField = (field, value, maxLen) => {
    setForm((f) => ({ ...f, [field]: digitsOnly(value, maxLen) }))
  }

  const clampYear = (value) => {
    if (!value) return ''
    const y = Number(value)
    if (!Number.isFinite(y)) return ''
    if (y < 1900) return '1900'
    if (y > 2100) return '2100'
    return String(y)
  }


  const isFormEnabled = formMode === 'NEW' || formMode === 'EDIT'

  const resetForm = () => {
    setForm(initialForm)
    setFormMode('VIEW')
    setSelectedId(null)
  }

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/api/setup/institution')
      setInstitutions(unwrapArray(res))
    } catch {
      showToast('warning', 'Unable to load Institutions list')
    }
  }

  const loadDepartments = async () => {
    try {
      const res = await api.get('/api/setup/department')
      setDepartments(unwrapArray(res))
    } catch {
      showToast('warning', 'Unable to load Departments list')
    }
  }

  const loadProgrammes = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/setup/programme')
      setRows(unwrapArray(res))
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to load Programmes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstitutions()
    loadDepartments()
    loadProgrammes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validateForm = () => {
    if (!String(form.institutionId || '').trim()) return 'Institution is required'
    if (!String(form.departmentId || '').trim()) return 'Department is required'
    if (!String(form.programmeCode || '').trim()) return 'Programme Code is required'
    if (!String(form.programmeName || '').trim()) return 'Programme Name is required'
    // Numeric validations (ARP)
    if (form.yearOfIntroduction && String(form.yearOfIntroduction).length !== 4) return 'Year of Introduction must be a 4-digit year'
    const nums = [
      ['Sanctioned Intake', form.sanctionedIntake],
      ['Total Semesters', form.totalSemesters],
      ['Total Credits', form.totalCredits],
      ['Total Max Marks', form.totalMaxMarks],
    ]
    for (const [label, v] of nums) {
      if (v === '' || v === null || v === undefined) continue
      if (!/^\d+$/.test(String(v))) return `${label} must be numbers only`
    }
    return null
  }

  // -----------------------
  // Header Actions (Department style)
  // -----------------------
  const onAddNew = () => {
    setForm(initialForm)
    setFormMode('NEW')
    setSelectedId(null)
  }

  const onView = () => {
    if (!selectedId) return showToast('warning', 'Please select a row')
    const selected = rows.find((r) => r.id === selectedId)
    if (!selected) return showToast('warning', 'Selected row not found')

    setForm({
      institutionId: selected.institutionId || '',
      departmentId: selected.departmentId || '',
      programmeCode: selected.programmeCode || '',
      programmeName: selected.programmeName || '',
      offeringMode: selected.offeringMode || '',
      branchOfStudy: selected.branchOfStudy || '',
      graduationCategory: selected.graduationCategory || '',
      yearOfIntroduction: toIntOrEmpty(selected.yearOfIntroduction),
      sanctionedIntake: toIntOrEmpty(selected.sanctionedIntake),
      affiliationStatus: selected.affiliationStatus || '',
      accreditationStatus: selected.accreditationStatus || '',
      programmeStatus: selected.programmeStatus || '',
      totalSemesters: toIntOrEmpty(selected.totalSemesters),
      totalCredits: toIntOrEmpty(selected.totalCredits),
      totalMaxMarks: toIntOrEmpty(selected.totalMaxMarks),
      isActive: selected.isActive !== false,
    })

    setFormMode('VIEW')

    setFormMode('VIEW')
  }


  // Auto-load form on radio select (as requested)
  const onSelectRow = (id) => {
    setSelectedId(id)
    const selected = rows.find((r) => r.id === id)
    if (!selected) return

    setForm({
      institutionId: selected.institutionId || '',
      departmentId: selected.departmentId || '',
      programmeCode: selected.programmeCode || '',
      programmeName: selected.programmeName || '',
      offeringMode: selected.offeringMode || '',
      branchOfStudy: selected.branchOfStudy || '',
      graduationCategory: selected.graduationCategory || '',
      yearOfIntroduction: toIntOrEmpty(selected.yearOfIntroduction),
      sanctionedIntake: toIntOrEmpty(selected.sanctionedIntake),
      affiliationStatus: selected.affiliationStatus || '',
      accreditationStatus: selected.accreditationStatus || '',
      programmeStatus: selected.programmeStatus || '',
      totalSemesters: toIntOrEmpty(selected.totalSemesters),
      totalCredits: toIntOrEmpty(selected.totalCredits),
      totalMaxMarks: toIntOrEmpty(selected.totalMaxMarks),
      isActive: selected.isActive !== false,
    })

    setFormMode('VIEW') // default is view mode; click Edit icon to enable editing
  }


  const onEdit = () => {
    if (!selectedId) return showToast('warning', 'Please select a row')
    onView()
    setFormMode('EDIT')
  }

  const onDelete = async () => {
    if (!selectedId) return showToast('warning', 'Please select a row')

    const ok = window.confirm('Are you sure you want to delete this Programme?')
    if (!ok) return

    try {
      setSaving(true)
      await api.delete(`/api/setup/programme/${selectedId}`)
      showToast('success', 'Deleted successfully')
      await loadProgrammes()
      resetForm()
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  // -----------------------
  // Save/Cancel (form)
  // -----------------------
  const onCancel = () => resetForm()

  const onSave = async (e) => {
    e.preventDefault()
    const err = validateForm()
    if (err) return showToast('danger', err)

    const payload = toPayload(form)

    try {
      setSaving(true)
      if (formMode === 'EDIT' && selectedId) {
        await api.put(`/api/setup/programme/${selectedId}`, payload)
        showToast('success', 'Updated successfully')
      } else {
        await api.post('/api/setup/programme', payload)
        showToast('success', 'Saved successfully')
      }

      await loadProgrammes()
      setFormMode('VIEW')
    } catch (e2) {
      showToast('danger', e2?.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // -----------------------
  // Excel Import (Department.jsx pattern)
  // -----------------------
  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

const downloadTemplate = async () => {
  try {
    const res = await api.get('/api/setup/programme/template', {
      params: { ts: Date.now() },
      responseType: 'blob',
    })

    const blob = new Blob([res.data], {
      type:
        res.headers?.['content-type'] ||
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    downloadBlob(
      blob,
      `Programme_Template_${new Date().toISOString().slice(0, 10)}.xlsx`,
    )
    showToast('success', 'Template downloaded')
  } catch (e) {
    console.error(e)
    showToast(
      'danger',
      e?.response?.data?.message || e?.response?.data?.error || 'Template download failed',
    )
  }
}

  // Export Programme Details (Excel via backend; CSV fallback)
  const downloadTextFile = (content, filename, mime = 'text/csv;charset=utf-8;') => {
    const blob = new Blob([content], { type: mime })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const csvEscape = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    const needsQuote = /[",\n\r]/.test(s)
    const escaped = s.replace(/"/g, '""')
    return needsQuote ? `"${escaped}"` : escaped
  }

  const exportProgrammeDetails = async () => {
    try {
      setExporting(true)

      // ✅ Preferred: backend-generated Excel export
      const res = await api.get('/api/setup/programme/export', {
        params: { ts: Date.now() },
        responseType: 'blob',
      })

      const blob = new Blob([res.data], {
        type:
          res.headers?.['content-type'] ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      downloadBlob(
        blob,
        `Programme_Details_${new Date().toISOString().slice(0, 10)}.xlsx`,
      )
      showToast('success', 'Programme details exported')
    } catch (err) {
      // ✅ Fallback: client-side CSV (opens in Excel)
      try {
        const headers = [
          'Programme Code',
          'Programme Name',
          'Institution',
          'Department',
          'Status',
          'Active',
        ]

        const lines = (rows || []).map((r) => [
          csvEscape(r?.programmeCode),
          csvEscape(r?.programmeName),
          csvEscape(r?.institution?.name),
          csvEscape(r?.department?.departmentName),
          csvEscape(r?.programmeStatus),
          csvEscape(r?.isActive === false ? 'No' : 'Yes'),
        ])

        const csv = [headers.map(csvEscape).join(','), ...lines.map((l) => l.join(','))].join('\n')

        downloadTextFile(
          csv,
          `Programme_Details_${new Date().toISOString().slice(0, 10)}.csv`,
        )

        const msg =
          err?.response?.status === 404
            ? 'Export API not found. Downloaded CSV instead.'
            : 'Export failed. Downloaded CSV instead.'
        showToast('warning', msg)
      } catch (e2) {
        console.error(e2)
        showToast('danger', err?.response?.data?.error || 'Export failed')
      }
    } finally {
      setExporting(false)
    }
  }




  const onChooseFile = async (e) => {
    const file = e.target.files?.[0]
    setFileName(file?.name || '')
    setPreviewData(null)
    setImportSummary(null)
    if (!file) return

    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (!['xlsx', 'xls'].includes(ext)) {
      showToast('danger', 'Please choose .xlsx or .xls file')
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setPreviewLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      // ✅ Preview endpoint (recommended)
      const res = await api.post('/api/setup/programme/import/preview', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setPreviewData(res.data)
      showToast('success', 'Preview generated')
    } catch (err) {
      // Backward compatibility: some backends may not have preview endpoint yet
      showToast(
        'danger',
        err?.response?.status === 404
          ? 'Preview API not available (backend missing: /api/setup/programme/import/preview)'
          : err?.response?.data?.error || 'Preview failed',
      )
    } finally {
      setPreviewLoading(false)
    }
  }

  // Download preview errors (backend-generated first; fallback to ExcelJS in frontend)
  const downloadPreviewErrors = async () => {
    try {
      const file = fileRef.current?.files?.[0]
      if (!file) return showToast('danger', 'Please choose an Excel file')

      const fd = new FormData()
      fd.append('file', file)

      const res = await api.post('/api/setup/programme/import/preview?download=errors', fd, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const blob = new Blob([res.data], {
        type:
          res.headers?.['content-type'] ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      downloadBlob(blob, 'programme_preview_errors.xlsx')
    } catch (e) {
      // Frontend fallback
      try {
        const errs = previewData?.errors?.length
          ? previewData.errors
          : (previewData?.preview || [])
              .filter(
                (r) =>
                  String(r.action || '').toLowerCase() === 'error' ||
                  String(r.action || '').toLowerCase() === 'failed',
              )
              .map((r) => ({ rowNumber: r.rowNumber, reason: r.reason || 'Validation error' }))

        if (!errs?.length) return showToast('danger', 'No preview errors to download')

        const mod = await import('exceljs')
        const ExcelJS = mod.default || mod
        const wb = new ExcelJS.Workbook()
        const ws = wb.addWorksheet('Preview Errors')
        ws.addRow(['Row Number', 'Error'])
        ws.getRow(1).font = { bold: true }
        errs.forEach((er) => ws.addRow([er.row ?? er.rowNumber ?? '', er.error ?? er.reason ?? '']))
        ws.columns = [{ width: 14 }, { width: 90 }]
        ws.views = [{ state: 'frozen', ySplit: 1 }]
        const buf = await wb.xlsx.writeBuffer()
        downloadBlob(
          new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
          'programme_preview_errors.xlsx',
        )
      } catch (e2) {
        console.error(e2)
        showToast('danger', 'Preview error download failed (install exceljs OR enable backend error download).')
      }
    }
  }

  // Download import errors (backend first; fallback to ExcelJS)
  const downloadErrorReport = async () => {
    try {
      const file = fileRef.current?.files?.[0]
      if (!file) {
        if (!importSummary?.errors?.length) return showToast('danger', 'No import errors to download')
        throw new Error('NO_FILE_FOR_BACKEND_DOWNLOAD')
      }

      const fd = new FormData()
      fd.append('file', file)

      const res = await api.post('/api/setup/programme/import?download=errors', fd, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const blob = new Blob([res.data], {
        type:
          res.headers?.['content-type'] ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      downloadBlob(blob, 'programme_import_errors.xlsx')
    } catch (e) {
      // Frontend fallback
      try {
        if (!importSummary?.errors?.length) return showToast('danger', 'No import errors to download')

        const mod = await import('exceljs')
        const ExcelJS = mod.default || mod
        const wb = new ExcelJS.Workbook()
        const ws = wb.addWorksheet('Import Errors')
        ws.addRow(['Row Number', 'Error'])
        ws.getRow(1).font = { bold: true }
        importSummary.errors.forEach((er) => ws.addRow([er.row ?? er.rowNumber ?? '', er.error ?? er.reason ?? '']))
        ws.columns = [{ width: 14 }, { width: 90 }]
        ws.views = [{ state: 'frozen', ySplit: 1 }]
        const buf = await wb.xlsx.writeBuffer()
        downloadBlob(
          new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
          'programme_import_errors.xlsx',
        )
      } catch (e2) {
        console.error(e2)
        showToast('danger', 'Import error download failed (install exceljs OR enable backend error download).')
      }
    }
  }

  const onImportExcel = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return showToast('danger', 'Please choose an Excel file')

    // If preview is available, block import when there are errors
    if ((previewData?.failed ?? 0) > 0) return showToast('danger', 'Fix preview errors before importing')

    setImporting(true)
    setImportProgress(10)
    setImportSummary(null)

    try {
      const fd = new FormData()
      fd.append('file', file)

      setImportProgress(35)
      const res = await api.post('/api/setup/programme/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setImportProgress(90)

      // Backward compatibility: your previous backend returned { success:false, errorFileBase64 }
      if (res?.data?.success === false) {
        // if backend already sends an error workbook (base64), trigger download
        if (res?.data?.errorFileBase64) {
          // keep your old helper (base64 workbook download)
          downloadBase64Excel(res.data.errorFileBase64, res.data.errorFileName || 'programme_import_errors.xlsx')
        }
        setImportSummary(res.data)
        showToast('warning', res?.data?.error || 'Import completed with errors')
        setImportProgress(100)
        await loadProgrammes()
        return
      }

      setImportSummary(res.data)
      setImportProgress(100)
      showToast('success', res?.data?.message || 'Excel imported successfully')

      if (fileRef.current) fileRef.current.value = ''
      setFileName('')
      setPreviewData(null)

      await loadProgrammes()
    } catch (err) {
      setImportProgress(0)
      setImportSummary(err?.response?.data || null)

      const data = err?.response?.data
      if (data?.errorFileBase64) {
        downloadBase64Excel(data.errorFileBase64, data.errorFileName || 'programme_import_errors.xlsx')
        showToast('warning', data?.error || 'Import completed with errors')
        await loadProgrammes()
      } else {
        showToast(
          'danger',
          err?.response?.status === 404
            ? 'Import API not available (backend missing: /api/setup/programme/import)'
            : data?.error || 'Import failed',
        )
      }
    } finally {
      setTimeout(() => setImporting(false), 250)
    }
  }

  const previewColumns = useMemo(
    () => [
      { key: 'rowNumber', label: 'Row' },
      { key: 'institutionCode', label: 'Institution Code' },
      { key: 'departmentCode', label: 'Department Code' },
      { key: 'programmeCode', label: 'Programme Code' },
      { key: 'programmeName', label: 'Programme Name' },
      { key: 'action', label: 'Action' },
      { key: 'reason', label: 'Reason' },
    ],
    [],
  )

  const columns = useMemo(
    () => [
      { key: 'programmeCode', label: 'Programme Code' },
      { key: 'programmeName', label: 'Programme Name' },
      { key: 'institution', label: 'Institution', render: (row) => row?.institution?.name || '-' },
      {
        key: 'department',
        label: 'Department',
        render: (row) => row?.department?.departmentName || '-',
      },
      { key: 'programmeStatus', label: 'Status', render: (row) => row?.programmeStatus || '-' },
      { key: 'isActive', label: 'Active', render: (row) => (row?.isActive === false ? 'No' : 'Yes') },
    ],
    [],
  )


  const tableActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  // Grid helper: md=3 label + md=3 input (2 fields per row)
  const LabelCol = ({ children }) => (
    <CCol md={3} className="d-flex align-items-center">
      <CFormLabel className="mb-0">{children}</CFormLabel>
    </CCol>
  )
  const InputCol = ({ children }) => <CCol md={3}>{children}</CCol>

  return (
    <React.Fragment>
<CCard className="mb-3">
        <CCardHeader>
          <div className="d-flex flex-column gap-2">
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <strong>ADD PROGRAMME</strong>

              <div className="d-flex gap-2 align-items-center">
                <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
                <ArpIconButton icon="download" color="secondary" title="Export Data" onClick={exportProgrammeDetails} disabled={exporting || loading || rows?.length === 0} />
                <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId} />
                <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
              </div>
            </div>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              <ArpButton label="Download Template" icon="download" color="secondary" onClick={downloadTemplate} />

              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="form-control"
                style={{ maxWidth: 320 }}
                onChange={onChooseFile}
              />

              <ArpButton
                label={importing ? 'Importing...' : 'Import Excel'}
                icon="upload"
                color="success"
                onClick={onImportExcel}
                disabled={importing || previewLoading || !fileName || (previewData?.failed ?? 0) > 0}
              />

              {(previewLoading || importing) && <CSpinner size="sm" />}
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          {toast && (
            <CAlert color={toast.type} className="mb-3">
              {toast.message}
            </CAlert>
          )}

          
          {/* Excel Preview Status */}
          {fileName && (
            <div className="mb-2 small text-muted">
              Selected: <strong>{fileName}</strong>
            </div>
          )}

          {previewData && (
            <div className="mb-2">
              <CBadge color="success" className="me-2">
                Inserts: {previewData.inserts ?? 0}
              </CBadge>
              <CBadge color="info" className="me-2">
                Updates: {previewData.updates ?? 0}
              </CBadge>
              <CBadge color="danger" className="me-2">
                Errors: {previewData.failed ?? 0}
              </CBadge>

              {!!(previewData?.failed ?? 0) && (
                <ArpButton
                  className="ms-2"
                  label="Download Preview Errors"
                  icon="download"
                  color="danger"
                  onClick={downloadPreviewErrors}
                />
              )}
            </div>
          )}

          {importing && (
            <div className="mb-2">
              <CProgress>
                <CProgressBar value={importProgress} />
              </CProgress>
            </div>
          )}

          {importSummary && (
            <div className="mb-2">
              <CBadge color="success" className="me-2">
                Inserted: {importSummary.inserted ?? 0}
              </CBadge>
              <CBadge color="info" className="me-2">
                Updated: {importSummary.updated ?? 0}
              </CBadge>
              <CBadge color="danger" className="me-2">
                Failed: {importSummary.failed ?? 0}
              </CBadge>

              {!!importSummary?.errors?.length && (
                <ArpButton
                  className="ms-2"
                  label="Download Error Report"
                  icon="download"
                  color="danger"
                  onClick={downloadErrorReport}
                />
              )}
            </div>
          )}

          {previewData?.preview?.length ? (
            <div className="mb-3">
              <ArpDataTable
                title="Bulk Import Preview"
                rows={previewData.preview}
                columns={previewColumns}
                loading={previewLoading}
              />
            </div>
          ) : null}

<CForm onSubmit={onSave}>
            <CRow className="g-3">
              <LabelCol>Institution *</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.institutionId}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, institutionId: e.target.value }))}
                >
                  <option value="">Select</option>
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Department *</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.departmentId}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                >
                  <option value="">Select</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.departmentName} ({d.departmentCode})
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Programme Code *</LabelCol>
              <InputCol>
                <CFormInput
                  value={form.programmeCode}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, programmeCode: e.target.value }))}
                />
              </InputCol>

              <LabelCol>Programme Name *</LabelCol>
              <InputCol>
                <CFormInput
                  value={form.programmeName}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, programmeName: e.target.value }))}
                />
              </InputCol>

              <LabelCol>Offering Mode</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.offeringMode}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, offeringMode: e.target.value }))}
                >
                  {enumOptions.offeringMode.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Graduation Category</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.graduationCategory}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, graduationCategory: e.target.value }))}
                >
                  {enumOptions.graduationCategory.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Branch of Study</LabelCol>
              <InputCol>
                <CFormInput
                  value={form.branchOfStudy}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, branchOfStudy: e.target.value }))}
                />
              </InputCol>

              <LabelCol>Year of Introduction</LabelCol>
              <InputCol>
                <CFormInput
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="YYYY"
                  maxLength={4}
                  value={form.yearOfIntroduction}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setNumericField('yearOfIntroduction', e.target.value, 4)}
                  onBlur={() => setForm((f) => ({ ...f, yearOfIntroduction: clampYear(f.yearOfIntroduction) }))}
                />
              </InputCol>

              <LabelCol>Sanctioned Intake</LabelCol>
              <InputCol>
                <CFormInput
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.sanctionedIntake}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setNumericField('sanctionedIntake', e.target.value)}
                />
              </InputCol>

              <LabelCol>Affiliation Status</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.affiliationStatus}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, affiliationStatus: e.target.value }))}
                >
                  {enumOptions.affiliationStatus.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Accreditation Status</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.accreditationStatus}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, accreditationStatus: e.target.value }))}
                >
                  {enumOptions.accreditationStatus.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Programme Status</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.programmeStatus}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, programmeStatus: e.target.value }))}
                >
                  {enumOptions.programmeStatus.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Total Semesters</LabelCol>
              <InputCol>
                <CFormInput
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.totalSemesters}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setNumericField('totalSemesters', e.target.value)}
                />
              </InputCol>

              <LabelCol>Total Credits</LabelCol>
              <InputCol>
                <CFormInput
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.totalCredits}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setNumericField('totalCredits', e.target.value)}
                />
              </InputCol>

              <LabelCol>Total Max Marks</LabelCol>
              <InputCol>
                <CFormInput
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.totalMaxMarks}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setNumericField('totalMaxMarks', e.target.value)}
                />
              </InputCol>

              <LabelCol>Active</LabelCol>
              <InputCol>
                <CFormCheck
                  label="Is Active"
                  checked={form.isActive !== false}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              </InputCol>
            </CRow>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <ArpButton
                label={saving ? 'Saving...' : 'Save'}
                icon="save"
                color="success"
                type="submit"
                disabled={saving || !isFormEnabled}
              />
              <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} disabled={saving || !isFormEnabled} />
              {saving && <CSpinner size="sm" />}
            </div>
          </CForm>
        </CCardBody>
      </CCard>

            <div className="mb-3">
        <ArpDataTable
                    title="Programme Details"
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    searchable
                    searchPlaceholder="Search..."
                    pageSizeOptions={[5, 10, 20, 50]}
                    defaultPageSize={10}
                    rowKey="id"
                    headerActions={tableActions}
                    selection={{
                      type: 'radio',
                      selected: selectedId,
                      onChange: (id) => onSelectRow(id),
                      key: 'id',
                      headerLabel: 'Select',
                      width: 60,
                      name: 'programmeRow',
                    }}
                  />
      </div>
    </React.Fragment>
  )
}

export default Programmes
