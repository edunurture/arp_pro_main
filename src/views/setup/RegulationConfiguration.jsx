import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CRow,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * RegulationConfiguration.jsx (ARP CoreUI React Pro Standard)
 * ✅ Backend-connected:
 * - Batch CRUD (GET/POST/PUT/DELETE)
 * - Regulation CRUD (GET/POST/PUT/DELETE)
 * - Masters: Institution, Programme
 *
 * Notes:
 * - "Regulation Start Year" uses Option-2 (Start year only dropdown)
 * - Tables switch by mode:
 *    - Add Batch -> Batch Details table
 *    - Add Regulation -> Regulation Details table
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

const initialBatchForm = {
  batchName: '',
  description: '',
}
const initialRegForm = {
  programmeId: '',
  regulationCode: '',
  regulationYear: '', // start year only (Option-2)
  description: '',
  isActive: 'Yes',
}

const unwrapArray = (res) => {
  const d = res?.data
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.data)) return d.data
  if (Array.isArray(d?.rows)) return d.rows
  return []
}

const makeToastError =
  (e) => e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Something went wrong'
const normalizeText = (v) => String(v ?? '').trim().toLowerCase()

export default function RegulationConfiguration() {
  // masters
  const [institutions, setInstitutions] = useState([])
  const [institutionId, setInstitutionId] = useState('')

  // Derived institution object for display (e.g., Institution Code in templates)
  const selectedInstitution = useMemo(
    () => institutions.find((i) => String(i.id) === String(institutionId)) || null,
    [institutions, institutionId],
  )
  const [programmes, setProgrammes] = useState([])

  // data lists
  const [batches, setBatches] = useState([])
  const [rows, setRows] = useState([]) // regulations

  // selection
  const [selectedRegId, setSelectedRegId] = useState(null)
  const [selectedBatchId, setSelectedBatchId] = useState(null)

  // mode + edit
  const [mode, setMode] = useState(null) // null | 'BATCH' | 'REG'
  const [editingBatchId, setEditingBatchId] = useState(null)
  const [editingRegId, setEditingRegId] = useState(null)
  const [isEdit, setIsEdit] = useState(false)

  // forms
  const [batchForm, setBatchForm] = useState(initialBatchForm)
  const [regForm, setRegForm] = useState(initialRegForm)
  const selectedProgramme = useMemo(
    () => programmes.find((p) => String(p.id) === String(regForm.programmeId)) || null,
    [programmes, regForm.programmeId],
  )

  // ui states
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null) // { type, message }

  // Excel Import (Regulation) - Import only (no preview)
  const [excelFile, setExcelFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const fileRef = React.useRef(null)
  const [excelKey, setExcelKey] = useState(1)
  const [importing, setImporting] = useState(false)


  const yearOptions = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const list = []
    for (let i = y - 10; i <= y + 10; i++) list.push(i)
    return list
  }, [])

  const showToast = (type, message) => {
    setToast({ type, message })
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), 3500)
  }

  const resetAll = () => {
    setIsEdit(false)
    setEditingBatchId(null)
    setEditingRegId(null)
    setBatchForm(initialBatchForm)
    setRegForm(initialRegForm)
    setSelectedRegId(null)
    setSelectedBatchId(null)
    setMode(null)
  }

  // -----------------------
  // LOADERS
  // -----------------------
  const loadInstitutions = async () => {
    const res = await api.get('/api/setup/institution')
    const list = unwrapArray(res)
    setInstitutions(list)
    if (!institutionId && list?.[0]?.id) setInstitutionId(list[0].id)
    return list
  }

  const loadProgrammes = async (instId) => {
    // some backends require institutionId; pass when available
    const res = await api.get('/api/setup/programme', { params: instId ? { institutionId: instId } : undefined })
    setProgrammes(unwrapArray(res))
  }

  const loadBatches = async (instId) => {
    const res = await api.get('/api/setup/batch', { params: instId ? { institutionId: instId } : undefined })
    setBatches(unwrapArray(res))
  }

  const loadRegulations = async (instId) => {
    const res = await api.get('/api/setup/regulation', { params: instId ? { institutionId: instId } : undefined })
    setRows(unwrapArray(res))
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const instList = await loadInstitutions()
        const instId = institutionId || instList?.[0]?.id || ''
        if (instId) {
          await Promise.all([loadProgrammes(instId), loadBatches(instId), loadRegulations(instId)])
        } else {
          setProgrammes([])
          setBatches([])
          setRows([])
        }
      } catch (e) {
        console.error(e)
        showToast('danger', makeToastError(e))
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // reload when institution changes
  useEffect(() => {
    if (!institutionId) return
    const run = async () => {
      setLoading(true)
      try {
        await Promise.all([loadProgrammes(institutionId), loadBatches(institutionId), loadRegulations(institutionId)])
        // clear selections on institution change
        setSelectedBatchId(null)
        setSelectedRegId(null)
      } catch (e) {
        console.error(e)
        showToast('danger', makeToastError(e))
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionId])

  // -----------------------
  // ACTIONS
  // -----------------------
  const onAddBatch = () => {
    setMode('BATCH')
    setIsEdit(true)
    setEditingBatchId(null)
    setBatchForm(initialBatchForm)
    setSelectedBatchId(null)
    setToast(null)
  }

  const onAddRegulation = () => {
    setMode('REG')
    setIsEdit(true)
    setEditingRegId(null)
    setRegForm(initialRegForm)
    setSelectedRegId(null)
    setToast(null)
  }

  const onBatchView = () => {
    const row = batches?.find((r) => String(r?.id) === String(selectedBatchId))
    if (!row) return
    setMode('BATCH')
    setIsEdit(false)
    setEditingBatchId(row.id)
    setBatchForm({
      batchName: row.batchName || '',
      description: row.description || '',
    })
  }

  const onBatchEdit = () => {
    const row = batches?.find((r) => String(r?.id) === String(selectedBatchId))
    if (!row) return
    setMode('BATCH')
    setIsEdit(true)
    setEditingBatchId(row.id)
    setBatchForm({
      batchName: row.batchName || '',
      description: row.description || '',
    })
  }

  const onBatchDelete = () => {
    if (!selectedBatchId) return
    if (!window.confirm('Delete selected batch?')) return

    const run = async () => {
      setLoading(true)
      try {
        await api.delete(`/api/setup/batch/${selectedBatchId}`)
        showToast('success', 'Batch deleted successfully')
        await loadBatches(institutionId)
        setSelectedBatchId(null)
      } catch (e) {
        console.error(e)
        showToast('danger', makeToastError(e))
      } finally {
        setLoading(false)
      }
    }
    run()
  }

  const onRegView = () => {
    const row = rows?.find((r) => String(r?.id) === String(selectedRegId))
    if (!row) return
    setMode('REG')
    setIsEdit(false)
    setEditingRegId(row.id)
    setRegForm({
      programmeId: row?.programmeId || row?.programme?.id || '',
      regulationCode: row?.regulationCode || '',
      regulationYear: row?.regulationYear ? String(row.regulationYear) : '',
      description: row?.description || '',
      isActive: row?.isActive === false ? 'No' : 'Yes',
    })
  }

  const onRegEdit = () => {
    const row = rows?.find((r) => String(r?.id) === String(selectedRegId))
    if (!row) return
    setMode('REG')
    setIsEdit(true)
    setEditingRegId(row.id)
    setRegForm({
      programmeId: row?.programmeId || row?.programme?.id || '',
      regulationCode: row?.regulationCode || '',
      regulationYear: row?.regulationYear ? String(row.regulationYear) : '',
      description: row?.description || '',
      isActive: row?.isActive === false ? 'No' : 'Yes',
    })
  }

  const onRegDelete = () => {
    if (!selectedRegId) return
    if (!window.confirm('Delete selected regulation?')) return

    const run = async () => {
      setLoading(true)
      try {
        const res = await api.delete(`/api/setup/regulation/${selectedRegId}`)
        const msg = res?.data?.message || 'Regulation deleted successfully'
        showToast(res?.data?.softDeleted ? 'warning' : 'success', msg)
        await loadRegulations(institutionId)
        setSelectedRegId(null)
      } catch (e) {
        console.error(e)
        showToast('danger', makeToastError(e))
      } finally {
        setLoading(false)
      }
    }
    run()
  }

  const validateBatch = () => {
    if (!batchForm.batchName?.trim()) return 'Batch Name is required'
    return null
  }

  const validateReg = () => {
    if (!regForm.programmeId) return 'Programme is required'
    if (!regForm.regulationCode?.trim()) return 'Regulation Code is required'
    if (!regForm.regulationYear) return 'Regulation Start Year is required'
    return null
  }

  const onSave = () => {
    if (!institutionId) {
      showToast('danger', 'Institution is required')
      return
    }

    const run = async () => {
      setSaving(true)
      try {
        if (mode === 'BATCH') {
          const err = validateBatch()
          if (err) {
            showToast('danger', err)
            return
          }

          const normalizedBatchName = normalizeText(batchForm.batchName)
          const duplicate = (Array.isArray(batches) ? batches : []).some(
            (b) =>
              normalizeText(b?.batchName) === normalizedBatchName &&
              String(b?.id || '') !== String(editingBatchId || ''),
          )
          if (duplicate) {
            showToast('danger', 'Batch Name already exists for this institution')
            return
          }

          const payload = {
            institutionId,
            batchName: batchForm.batchName?.trim() || '',
            description: batchForm.description?.trim() || '',
            status: true,
            isActive: true,
          }

          if (editingBatchId) {
            await api.put(`/api/setup/batch/${editingBatchId}`, payload)
            showToast('success', 'Batch updated successfully')
          } else {
            await api.post('/api/setup/batch', payload)
            showToast('success', 'Batch saved successfully')
          }

          await loadBatches(institutionId)
          resetAll()
          return
        }

        if (mode === 'REG') {
          const err = validateReg()
          if (err) {
            showToast('danger', err)
            return
          }

          const payload = {
            institutionId,
            programmeId: regForm.programmeId,
            regulationCode: regForm.regulationCode?.trim(),
            regulationYear: Number(regForm.regulationYear) || null, // start year only
            description: regForm.description?.trim() || '',
            status: true,
            isActive: regForm.isActive === 'Yes',
          }

          if (editingRegId) {
            await api.put(`/api/setup/regulation/${editingRegId}`, payload)
            showToast('success', 'Regulation updated successfully')
          } else {
            await api.post('/api/setup/regulation', payload)
            showToast('success', 'Regulation saved successfully')
          }

          await loadRegulations(institutionId)
          resetAll()
          return
        }

        showToast('danger', 'Click Add Batch or Add Regulation to begin')
      } catch (e) {
        console.error(e)
        showToast('danger', makeToastError(e))
      } finally {
        setSaving(false)
      }
    }

    run()
  }

  const onCancel = () => resetAll()

  // -----------------------
  // EXCEL (REGULATION) - Import Only
  // -----------------------
  const downloadRegulationTemplate = async () => {
    try {
      if (!institutionId) {
        showToast('danger', 'Institution is required')
        return
      }

      const res = await axios.get(`${API_BASE}/api/setup/regulation/template`, {
        params: { institutionId },
        responseType: 'blob',
        validateStatus: () => true,
      })

      const ct = res?.headers?.['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      const blob = new Blob([res.data], { type: ct })
      const a = document.createElement('a')
      a.href = window.URL.createObjectURL(blob)
      a.download = 'Regulation_Template.xlsx'
      a.click()
      window.URL.revokeObjectURL(a.href)
      showToast('success', 'Template downloaded')
    } catch (e) {
      console.error(e)
      showToast('danger', makeToastError(e))
    }
  }

  const importRegulationExcel = async () => {
    if (!institutionId) {
      showToast('danger', 'Institution is required')
      return
    }
    if (!excelFile) {
      showToast('danger', 'Please choose an Excel file')
      return
    }

    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', excelFile)
      fd.append('institutionId', institutionId)

      const res = await axios.post(`${API_BASE}/api/setup/regulation/import`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob', // success json or error excel
        validateStatus: () => true,
      })

      const ct = res?.headers?.['content-type'] || ''
      const isExcel =
        ct.includes('application/vnd.openxmlformats-officedocument') ||
        ct.includes('application/vnd.ms-excel')

      if (isExcel || res.status === 422) {
        const blob = new Blob([res.data], {
          type: ct || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const a = document.createElement('a')
        a.href = window.URL.createObjectURL(blob)
        a.download = 'Regulation_Import_Errors.xlsx'
        a.click()
        window.URL.revokeObjectURL(a.href)
        showToast('danger', 'Import completed with errors (downloaded error sheet)')
      } else {
        // Parse JSON (returned as blob)
        let msg = 'Import completed'
        try {
          const text = await res.data.text()
          const json = JSON.parse(text)
          if (json?.success) {
            msg = json?.message || msg
            showToast('success', msg)
          } else {
            msg = json?.error || json?.message || msg
            showToast('danger', msg)
          }
        } catch {
          showToast('success', msg)
        }
      }

      await loadRegulations(institutionId)
      setExcelFile(null)
      setExcelKey((k) => k + 1)
    } catch (e) {
      console.error(e)
      showToast('danger', makeToastError(e))
    } finally {
      setImporting(false)
    }
  }

  // Excel choose file (Department.jsx-style)
  const onChooseFile = (e) => {
    const f = e?.target?.files?.[0] || null
    setExcelFile(f)
    setFileName(f?.name || '')
  }



  // -----------------------
  // TABLE CONFIG
  // -----------------------
  const regColumns = useMemo(
    () => [
      { key: 'regulationCode', label: 'Regulation Code', sortable: true, width: 160 },
      { key: 'regulationYear', label: 'Regulation Start Year', sortable: true, width: 190, align: 'center' },
      {
        key: 'programme',
        label: 'Programme',
        sortable: true,
        width: 280,
        render: (row) => {
          if (row?.programme?.programmeName) return row.programme.programmeName
          if (row?.programmeName) return row.programmeName
          const pid = String(row?.programmeId || row?.programme?.id || '')
          const matched = programmes.find((p) => String(p?.id) === pid)
          if (matched?.programmeName) return matched.programmeName
          return '-'
        },
      },
      { key: 'description', label: 'Description', sortable: true },
    ],
    [programmes],
  )

  const batchColumns = useMemo(
    () => [
      { key: 'batchName', label: 'Batch Name', sortable: true, width: 180 },
      { key: 'description', label: 'Description', sortable: true },
    ],
    [],
  )

  // Download Regulation Details (Condition 3)
  async function downloadRegulationDetails() {
    try {
      if (!rows || rows.length === 0) return

      // ✅ Export must match the Excel template columns (in the same order)
      const TEMPLATE_HEADERS = [
        'Institution Code',
        'Programme Code',
        
        'Regulation Code',
        'Regulation Start Year',
        'Description',
        'Is Active (Yes/No)',
      ]

      const tryParseJSON = (v) => {
        if (typeof v !== 'string') return null
        const s = v.trim()
        if (!s.startsWith('{') && !s.startsWith('[')) return null
        try {
          return JSON.parse(s)
        } catch {
          return null
        }
      }

      const getProgrammeCode = (r) => {
        // common shapes: r.programmeCode, r.programme.programmeCode, r.programme as JSON string
        if (r?.programmeCode) return String(r.programmeCode)
        const p = r?.programme
        if (p?.programmeCode) return String(p.programmeCode)
        const parsed = tryParseJSON(p)
        if (parsed?.programmeCode) return String(parsed.programmeCode)
        if (parsed?.code) return String(parsed.code)
        return ''
      }

      const getInstitutionCode = (r) => {
        // Usually export is within a selected institution in UI
        if (selectedInstitution?.code) return String(selectedInstitution.code)
        if (r?.institutionCode) return String(r.institutionCode)
        if (r?.institution?.code) return String(r.institution.code)
        const parsed = tryParseJSON(r?.institution)
        if (parsed?.code) return String(parsed.code)
        return ''
      }

      const getYesNo = (v) => {
        if (v === true) return 'Yes'
        if (v === false) return 'No'
        if (typeof v === 'string') {
          const s = v.trim().toLowerCase()
          if (s === 'yes' || s === 'y' || s === 'true' || s === '1') return 'Yes'
          if (s === 'no' || s === 'n' || s === 'false' || s === '0') return 'No'
        }
        if (typeof v === 'number') return v === 1 ? 'Yes' : v === 0 ? 'No' : ''
        return ''
      }

      const dataRows = rows.map((r) => [
        getInstitutionCode(r),
        getProgrammeCode(r),
        r?.regulationCode ?? r?.code ?? '',
        r?.regulationYear ?? r?.regulationStartYear ?? r?.year ?? '',
        r?.description ?? '',
        getYesNo(r?.isActive ?? r?.active),
      ])

      // Prefer ExcelJS if installed, otherwise fallback to SheetJS (xlsx)
      try {
        const ExcelJSModule = await import('exceljs')
        const ExcelJS = ExcelJSModule?.default || ExcelJSModule

        const wb = new ExcelJS.Workbook()
        const ws = wb.addWorksheet('Regulation Details')

        ws.addRow(TEMPLATE_HEADERS)
        ws.getRow(1).font = { bold: true }

        dataRows.forEach((arr) => ws.addRow(arr))

        // Auto width (simple)
        ws.columns.forEach((col) => {
          let maxLen = 10
          col.eachCell({ includeEmpty: true }, (cell) => {
            const v = cell.value ?? ''
            const len = String(v).length
            if (len > maxLen) maxLen = len
          })
          col.width = Math.min(Math.max(maxLen + 2, 12), 60)
        })

        const buffer = await wb.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'Regulation_Details.xlsx'
        a.click()
        URL.revokeObjectURL(url)
        return
      } catch (eExcelJS) {
        // ignore and try xlsx
      }

      const XLSXModule = await import('xlsx')
      const XLSX = XLSXModule?.default || XLSXModule

      const aoa = [TEMPLATE_HEADERS, ...dataRows]
      const ws = XLSX.utils.aoa_to_sheet(aoa)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Regulation Details')

      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([out], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Regulation_Details.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      const msg =
        e?.message ||
        'Excel export library not found. Please install either "exceljs" or "xlsx" in arp_admin.'
      setToast({ type: 'danger', message: msg })
    }

  }

  const regHeaderActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onRegView} disabled={!selectedRegId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onRegEdit} disabled={!selectedRegId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onRegDelete} disabled={!selectedRegId} />
      <ArpIconButton icon="download" color="secondary" title="Download" onClick={downloadRegulationDetails} disabled={!rows || rows.length === 0} />
    </div>
  )


  const batchHeaderActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onBatchView} disabled={!selectedBatchId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onBatchEdit} disabled={!selectedBatchId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onBatchDelete} disabled={!selectedBatchId} />
    </div>
  )

  // -----------------------
  // RENDER
  // -----------------------
  
  // Download Regulation Details (Condition 3)

  return (
    <CRow>
      <CCol xs={12}>
        {toast && (
          <CAlert color={toast.type} className="mb-3">
            {toast.message}
          </CAlert>
        )}

        {/* ===================== A) HEADER ACTION CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex align-items-center justify-content-between">
            <strong>Regulation Configuration</strong>
            <div className="d-flex gap-2 align-items-center">
              <ArpButton
                icon="add"
                label="Add Batch"
                color="purple"
                onClick={onAddBatch}
                disabled={saving || loading}
              />
              <ArpButton
                icon="add"
                label="Add Regulation"
                color="info"
                onClick={onAddRegulation}
                disabled={saving || loading}
              />
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={4}>
                <CFormLabel>Institution</CFormLabel>
                <CFormSelect
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                  disabled={saving || loading}
                >
                  {institutions?.length === 0 ? (
                    <option value="">No Institutions</option>
                  ) : (
                    institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.code ? `${i.code} - ${i.name}` : i.name}
                      </option>
                    ))
                  )}
                </CFormSelect>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* ===================== B) FORM CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>
              {mode === 'BATCH'
                ? 'Batch Details'
                : mode === 'REG'
                  ? 'Regulation Details'
                  : 'Details'}
            </strong>
          </CCardHeader>
          <CCardBody>
            {mode === null && (
              <div className="text-muted">
                Click <strong>Add Batch</strong> or <strong>Add Regulation</strong> to begin.
              </div>
            )}

            {mode === 'BATCH' && (
              <CForm>
                <CRow className="g-3">
                  <CCol md={4}>
                    <CFormLabel>Batch Name</CFormLabel>
                    <CFormInput
                      value={batchForm.batchName}
                      onChange={(e) => setBatchForm((p) => ({ ...p, batchName: e.target.value }))}
                      placeholder="Enter Batch Name"
                      disabled={!isEdit || saving || loading}
                    />
                  </CCol>
                  <CCol md={8}>
                    <CFormLabel>Batch Description</CFormLabel>
                    <CFormTextarea
                      value={batchForm.description}
                      onChange={(e) => setBatchForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Enter Batch Description"
                      disabled={!isEdit || saving || loading}
                      rows={2}
                    />
                  </CCol>
                </CRow>

                <CRow className="mt-3">
                  <CCol className="d-flex justify-content-end gap-2">
                    <ArpButton
                      icon="save"
                      color="success"
                      label={editingBatchId ? 'Update' : 'Save'}
                      onClick={onSave}
                      disabled={!isEdit || saving || loading}
                    />
                    <ArpButton
                      icon="cancel"
                      color="secondary"
                      label="Cancel"
                      onClick={onCancel}
                      disabled={saving || loading}
                    />
                  </CCol>
                </CRow>
              </CForm>
            )}

            {mode === 'REG' && (
              <CForm>
                <CRow className="g-3">
                  {/* Template-aligned fields (Regulation_Template.xlsx) */}
                  <CCol md={4}>
                    <CFormLabel>Institution Code</CFormLabel>
                    <CFormInput value={selectedInstitution?.code || ''} disabled />
                  </CCol>

                  <CCol md={4}>
                    <CFormLabel>Programme Code</CFormLabel>
                    <CFormSelect
                      value={regForm.programmeId}
                      onChange={(e) => setRegForm((p) => ({ ...p, programmeId: e.target.value }))}
                      disabled={!isEdit || saving || loading}
                    >
                      <option value="">Select Programme Code</option>
                      {programmes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.programmeCode || '-'}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={4}>
                    <CFormLabel>Programme Name</CFormLabel>
                    <CFormInput value={selectedProgramme?.programmeName || ''} disabled />
                  </CCol>

                  <CCol md={4}>
                    <CFormLabel>Regulation Code</CFormLabel>
                    <CFormInput
                      value={regForm.regulationCode}
                      onChange={(e) => setRegForm((p) => ({ ...p, regulationCode: e.target.value }))}
                      disabled={!isEdit || saving || loading}
                    />
                  </CCol>

                  <CCol md={4}>
                    <CFormLabel>Regulation Start Year</CFormLabel>
                    <CFormSelect
                      value={regForm.regulationYear}
                      onChange={(e) => setRegForm((p) => ({ ...p, regulationYear: e.target.value }))}
                      disabled={!isEdit || saving || loading}
                    >
                      <option value="">Select Year</option>
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={4}>
                    <CFormLabel>Is Active (Yes/No)</CFormLabel>
                    <CFormSelect
                      value={regForm.isActive}
                      onChange={(e) => setRegForm((p) => ({ ...p, isActive: e.target.value }))}
                      disabled={!isEdit || saving || loading}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={12}>
                    <CFormLabel>Description</CFormLabel>
                    <CFormInput
                      value={regForm.description}
                      onChange={(e) => setRegForm((p) => ({ ...p, description: e.target.value }))}
                      disabled={!isEdit || saving || loading}
                    />
                  </CCol>
                </CRow>


                {/* Excel Import (Regulation) - Import Only */}

                <CRow className="mt-3">
                  <CCol className="d-flex justify-content-end gap-2">
                    <ArpButton
                      icon="save"
                      color="success"
                      label={editingRegId ? 'Update' : 'Save'}
                      onClick={onSave}
                      disabled={!isEdit || saving || loading}
                    />
                    <ArpButton
                      icon="cancel"
                      color="secondary"
                      label="Cancel"
                      onClick={onCancel}
                      disabled={saving || loading}
                    />
                  </CCol>
                </CRow>
              </CForm>
            )}
          </CCardBody>
        </CCard>

        {/* ===================== C) TABLES (ArpDataTable) ===================== */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex align-items-center justify-content-between">
            <strong>Batch Details</strong>
          </CCardHeader>
          <CCardBody>

            <ArpDataTable

              title="BATCH DETAILS"
              rows={batches}
              columns={batchColumns}
              loading={loading}
              headerActions={batchHeaderActions}
              selection={{
                type: 'radio',
                selected: selectedBatchId,
                onChange: (value) => setSelectedBatchId(value),
                key: 'id',
                headerLabel: 'Select',
                width: 60,
                name: 'batch_select',
              }}
              pageSizeOptions={[5, 10, 20, 50]}
              defaultPageSize={10}
              searchable
              searchPlaceholder="Search Batch Name / Description..."
              rowKey="id"
            />
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex align-items-center justify-content-between">
            <strong>Regulation Details</strong>
          </CCardHeader>
          <CCardBody>
            <CCard className="mb-3 border-0">
              <CCardBody className="p-0">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <ArpButton
                    label="Download Template"
                    icon="download"
                    color="secondary"
                    onClick={downloadRegulationTemplate}
                    disabled={!institutionId || loading || saving || importing}
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="form-control"
                    style={{ maxWidth: 360 }}
                    onChange={onChooseFile}
                    disabled={!institutionId || loading || saving || importing}
                  />
                  <ArpButton
                    label={importing ? 'Importing...' : 'Import Excel'}
                    icon="upload"
                    color="success"
                    onClick={importRegulationExcel}
                    disabled={importing || loading || saving || !fileName || !institutionId}
                  />
                  {(importing || loading) && <CSpinner size="sm" />}
                </div>
              </CCardBody>
            </CCard>

            <ArpDataTable
              title="REGULATION DETAILS"
              rows={rows}
              columns={regColumns}
              loading={loading}
              headerActions={regHeaderActions}
              selection={{
                type: 'radio',
                selected: selectedRegId,
                onChange: (value) => setSelectedRegId(value),
                key: 'id',
                headerLabel: 'Select',
                width: 60,
                name: 'reg_select',
              }}
              pageSizeOptions={[5, 10, 20, 50]}
              defaultPageSize={10}
              searchable
              searchPlaceholder="Search..."
              rowKey="id"
            />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}
