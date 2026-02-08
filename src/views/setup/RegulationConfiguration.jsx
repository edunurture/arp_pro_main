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
}

const unwrapArray = (res) => {
  const d = res?.data
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.data)) return d.data
  if (Array.isArray(d?.rows)) return d.rows
  return []
}

const makeToastError = (e) => e?.response?.data?.message || e?.message || 'Something went wrong'

export default function RegulationConfiguration() {
  // masters
  const [institutions, setInstitutions] = useState([])
  const [institutionId, setInstitutionId] = useState('')
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

  // ui states
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null) // { type, message }

  // excel import (Regulation)
  const [excelFile, setExcelFile] = useState(null)
  const [excelKey, setExcelKey] = useState(0) // reset file input
  const [previewRows, setPreviewRows] = useState([])
  const [previewErrors, setPreviewErrors] = useState([])
  const [previewSummary, setPreviewSummary] = useState(null) // { totalRows, validRows, invalidRows }
  const [previewing, setPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)

  const yearOptions = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const list = []
    for (let i = y - 10; i <= y + 10; i++) list.push(i)
    return list
  }, [])


  const previewColumns = useMemo(() => {
    if (!previewRows || previewRows.length === 0) return []
    const first = previewRows[0] || {}
    return Object.keys(first).map((k) => ({
      key: k,
      label: k
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, (c) => c.toUpperCase()),
    }))
  }, [previewRows])

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
    setExcelFile(null)
    setExcelKey((k) => k + 1)
    setPreviewRows([])
    setPreviewErrors([])
    setPreviewSummary(null)
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


  // -----------------------
  // EXCEL IMPORT (REGULATION)
  const downloadRegulationTemplate = async () => {
    if (!institutionId) {
      showToast('danger', 'Institution is required')
      return
    }

    try {
      // Prefer backend-generated template
      const url = `${API_BASE}/api/setup/regulation/template?institutionId=${institutionId}`
      window.open(url, '_blank')
      showToast('success', 'Template download started')
    } catch (e) {
      console.error(e)
      showToast('danger', 'Template download failed')
    }
  }

  const previewRegulationExcel = async () => {
    if (!institutionId) {
      showToast('danger', 'Institution is required')
      return
    }
    if (!excelFile) {
      showToast('danger', 'Please choose an Excel file')
      return
    }

    setPreviewing(true)
    try {
      const fd = new FormData()
      fd.append('file', excelFile)
      fd.append('institutionId', institutionId)

      const res = await axios.post(`${API_BASE}/api/setup/regulation/preview`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Expected (recommended):
      // { rows: [...], errors: [...], summary: { totalRows, validRows, invalidRows } }
      const data = res?.data || {}
      setPreviewRows(Array.isArray(data.rows) ? data.rows : [])
      setPreviewErrors(Array.isArray(data.errors) ? data.errors : [])
      setPreviewSummary(data.summary || null)

      if ((data.errors || []).length) {
        showToast('danger', 'Preview completed with errors')
      } else {
        showToast('success', 'Preview successful')
      }
    } catch (e) {
      console.error(e)
      setPreviewRows([])
      setPreviewErrors([])
      setPreviewSummary(null)
      showToast('danger', e?.response?.data?.message || 'Preview failed')
    } finally {
      setPreviewing(false)
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
        responseType: 'blob', // backend may return error excel as blob
        validateStatus: () => true,
      })

      const ct = res?.headers?.['content-type'] || ''
      const isExcel =
        ct.includes('application/vnd.openxmlformats-officedocument') ||
        ct.includes('application/vnd.ms-excel')

      if (isExcel) {
        // error sheet or result sheet
        const blob = new Blob([res.data], { type: ct })
        const a = document.createElement('a')
        a.href = window.URL.createObjectURL(blob)
        a.download = 'Regulation_Import_Errors.xlsx'
        a.click()
        window.URL.revokeObjectURL(a.href)
        showToast('danger', 'Import completed with errors (downloaded error sheet)')
      } else {
        // try parse json blob
        let msg = 'Import completed'
        try {
          const text = await res.data.text()
          const json = JSON.parse(text)
          msg = json?.message || msg
          if (json?.errors?.length) {
            showToast('danger', msg)
          } else {
            showToast('success', msg)
          }
        } catch {
          showToast('success', msg)
        }
      }

      await loadRegulations(institutionId)
      // clear file + preview
      setExcelFile(null)
      setExcelKey((k) => k + 1)
      setPreviewRows([])
      setPreviewErrors([])
      setPreviewSummary(null)
    } catch (e) {
      console.error(e)
      showToast('danger', e?.response?.data?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
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
      batchName: row.batchName || row.name || '',
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
      batchName: row.batchName || row.name || '',
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
    })
  }

  const onRegDelete = () => {
    if (!selectedRegId) return
    if (!window.confirm('Delete selected regulation?')) return

    const run = async () => {
      setLoading(true)
      try {
        await api.delete(`/api/setup/regulation/${selectedRegId}`)
        showToast('success', 'Regulation deleted successfully')
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

          const payload = {
            institutionId,
            batchName: batchForm.batchName?.trim(),
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
            isActive: true,
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
          const p = row?.programme
          if (!p) return row?.programmeName || '-'
          return `${p?.programmeCode || ''} - ${p?.programmeName || ''}`.trim() || '-'
        },
      },
      { key: 'description', label: 'Description', sortable: true },
    ],
    [],
  )

  const batchColumns = useMemo(
    () => [
      { key: 'batchName', label: 'Batch Name', sortable: true, width: 220 },
      { key: 'description', label: 'Description', sortable: true },
    ],
    [],
  )

  const regHeaderActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onRegView} disabled={!selectedRegId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onRegEdit} disabled={!selectedRegId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onRegDelete} disabled={!selectedRegId} />
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
            <div className="d-flex gap-2 align-items-center flex-wrap">
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
                  <CCol md={6}>
                    <CFormLabel>Batch Name</CFormLabel>
                    <CFormInput
                      value={batchForm.batchName}
                      onChange={(e) => setBatchForm((p) => ({ ...p, batchName: e.target.value }))}
                      placeholder="Enter batch name"
                      disabled={!isEdit || saving || loading}
                    />
                  </CCol>
                  <CCol md={6}>
                    <CFormLabel>Description</CFormLabel>
                    <CFormTextarea
                      value={batchForm.description}
                      onChange={(e) => setBatchForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Enter description"
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
                  <CCol md={4}>
                    <CFormLabel>Programme</CFormLabel>
                    <CFormSelect
                      value={regForm.programmeId}
                      onChange={(e) => setRegForm((p) => ({ ...p, programmeId: e.target.value }))}
                      disabled={!isEdit || saving || loading}
                    >
                      <option value="">Select Programme</option>
                      {programmes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.programmeCode
                            ? `${p.programmeCode} - ${p.programmeName}`
                            : p.programmeName}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={4}>
                    <CFormLabel>Regulation Code</CFormLabel>
                    <CFormInput
                      value={regForm.regulationCode}
                      onChange={(e) =>
                        setRegForm((p) => ({ ...p, regulationCode: e.target.value }))
                      }
                      placeholder="e.g., R26"
                      disabled={!isEdit || saving || loading}
                    />
                  </CCol>

                  <CCol md={4}>
                    <CFormLabel>Regulation Start Year</CFormLabel>
                    <CFormSelect
                      value={regForm.regulationYear}
                      onChange={(e) =>
                        setRegForm((p) => ({ ...p, regulationYear: e.target.value }))
                      }
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

                  <CCol md={12}>
                    <CFormLabel>Description</CFormLabel>
                    <CFormTextarea
                      value={regForm.description}
                      onChange={(e) => setRegForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Enter description"
                      disabled={!isEdit || saving || loading}
                      rows={2}
                    />
                  </CCol>
                </CRow>

                  {/* Excel Import Framework (Regulation) */}
                  <CRow className="mt-3">
                    <CCol md={12}>
                      <div className="d-flex flex-wrap gap-2 align-items-end">
                        <ArpButton
                          color="secondary"
                          variant="outline"
                          label="Download Template"
                          onClick={downloadRegulationTemplate}
                          disabled={saving || loading || previewing || importing}
                        />

                        <div style={{ minWidth: 260 }}>
                          <CFormLabel className="mb-1">Upload Excel</CFormLabel>
                          <CFormInput
                            key={excelKey}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                            disabled={saving || loading || previewing || importing}
                          />
                        </div>

                        <ArpButton
                          color="info"
                          label={previewing ? 'Previewing...' : 'Preview'}
                          onClick={previewRegulationExcel}
                          disabled={!excelFile || saving || loading || previewing || importing}
                        />

                        <ArpButton
                          color="success"
                          label={importing ? 'Importing...' : 'Import Excel'}
                          onClick={importRegulationExcel}
                          disabled={!excelFile || saving || loading || previewing || importing}
                        />
                      </div>

                      {(previewSummary || (previewErrors && previewErrors.length > 0)) && (
                        <div className="mt-2">
                          {previewSummary && (
                            <small className="text-muted">
                              Total: {previewSummary.totalRows ?? '-'} | Valid:{' '}
                              {previewSummary.validRows ?? '-'} | Invalid:{' '}
                              {previewSummary.invalidRows ?? '-'}
                            </small>
                          )}
                          {previewErrors && previewErrors.length > 0 && (
                            <CAlert color="danger" className="mt-2 mb-0">
                              Preview found {previewErrors.length} error row(s). Please fix and re-upload.
                            </CAlert>
                          )}
                        </div>
                      )}
                    </CCol>
                  </CRow>

                  {/* Preview Table */}
                  {previewRows && previewRows.length > 0 && (
                    <div className="mt-3">
                      <ArpDataTable
                        title="REGULATION EXCEL PREVIEW"
                        rows={previewRows}
                        columns={previewColumns}
                        loading={previewing}
                        searchable={true}
                        pageSizeOptions={[5, 10, 20]}
                        defaultPageSize={5}
                      />
                    </div>
                  )}

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
              searchPlaceholder="Search..."
              rowKey="id"
            />
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex align-items-center justify-content-between">
            <strong>Regulation Details</strong>
          </CCardHeader>
          <CCardBody>
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
