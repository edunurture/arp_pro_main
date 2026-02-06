import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'
import { CCard, CCardHeader, CCardBody, CAlert, CBadge, CSpinner, CProgress, CProgressBar, CRow, CCol, CForm, CFormLabel, CFormInput, CFormSelect, CFormTextarea } from '@coreui/react-pro'

const api = axios.create({ baseURL: '', headers: { 'Content-Type': 'application/json' } })

const initialForm = {
  institutionId: '',
  departmentCode: '',
  departmentName: '',
  yearEstablished: '',
  nbaAccredited: false,
  nbaValidUpto: '',
  objectives: '',
  vision: '',
  mission: '',
  goals: '',
  status: true,
  isActive: true,
}

const Department = () => {
  const [institutions, setInstitutions] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [toast, setToast] = useState(null)

  // Import / Preview
  const fileRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importSummary, setImportSummary] = useState(null)

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    const arr = []
    for (let y = 2000; y <= current + 10; y++) arr.push(String(y))
    return arr
  }, [])

  const showToast = (type, message) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4500)
  }

  const safeNumberOrNull = (v) => {
    if (v === '' || v === null || v === undefined) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/api/setup/institution')
      setInstitutions(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      showToast('danger', 'Failed to load Institution list')
    }
  }

  const loadDepartments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/setup/department')
      setRows(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstitutions()
    loadDepartments()
  }, [])

  const validateForm = () => {
    if (!form.institutionId) return 'Institution is required'
    if (!form.departmentCode?.trim()) return 'Department Code is required'
    if (!form.departmentName?.trim()) return 'Department Name is required'
    return null
  }

  const onChange = (key) => (e) => {
    let value = e?.target?.value
    if (key === 'nbaAccredited') value = value === 'Yes'
    if (key === 'status' || key === 'isActive') value = value === 'Active'
    setForm((p) => ({ ...p, [key]: value }))
  }

  const onAddNew = () => { setSelectedId(null); setForm(initialForm); setIsEdit(true) }

  const onView = () => {
    const selected = rows.find((r) => r.id === selectedId)
    if (!selected) return
    setForm({
      institutionId: selected.institutionId || '',
      departmentCode: selected.departmentCode || '',
      departmentName: selected.departmentName || '',
      yearEstablished: selected.yearEstablished ?? '',
      nbaAccredited: !!selected.nbaAccredited,
      nbaValidUpto: selected.nbaValidUpto ?? '',
      objectives: selected.objectives || '',
      vision: selected.vision || '',
      mission: selected.mission || '',
      goals: selected.goals || '',
      status: selected.status !== false,
      isActive: selected.isActive !== false,
    })
    setIsEdit(false)
  }

  const onEdit = () => { if (!selectedId) return; onView(); setIsEdit(true) }
  const onCancel = () => { setForm(initialForm); setIsEdit(false) }

  const onSave = async (e) => {
    e.preventDefault()
    const err = validateForm()
    if (err) return showToast('danger', err)
    setSaving(true)
    try {
      const payload = {
        ...form,
        yearEstablished: safeNumberOrNull(form.yearEstablished),
        nbaValidUpto: safeNumberOrNull(form.nbaValidUpto),
        nbaAccredited: !!form.nbaAccredited,
        status: !!form.status,
        isActive: !!form.isActive,
      }
      if (selectedId) await api.put(`/api/setup/department/${selectedId}`, payload)
      else await api.post('/api/setup/department', payload)
      showToast('success', 'Saved Successfully')
      setIsEdit(false)
      await loadDepartments()
    } catch (e2) {
      showToast('danger', e2?.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!selectedId) return
    if (!window.confirm('Delete this Department record?')) return
    try {
      await api.delete(`/api/setup/department/${selectedId}`)
      showToast('success', 'Deleted Successfully')
      setSelectedId(null)
      await loadDepartments()
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Delete failed')
    }
  }

  const downloadTemplate = async () => {
    try {
      const res = await axios.get('/api/setup/department/template', { responseType: 'blob' })
      const blob = new Blob([res.data], { type: res.headers['content-type'] })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'departments_template_with_institution.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      showToast('danger', 'Template download failed')
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
      const res = await axios.post('/api/setup/department/import/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setPreviewData(res.data)
      showToast('success', 'Preview generated')
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Preview failed')
    } finally {
      setPreviewLoading(false)
    }
  }

  const downloadErrorReport = async () => {
    if (!importSummary?.errors?.length) return
    try {
      const mod = await import('exceljs')
      const ExcelJS = mod.default || mod
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Import Errors')
      ws.addRow(['Row Number', 'Error'])
      ws.getRow(1).font = { bold: true }
      importSummary.errors.forEach((e) => ws.addRow([e.row, e.error]))
      ws.columns = [{ width: 14 }, { width: 90 }]
      ws.views = [{ state: 'frozen', ySplit: 1 }]
      const buf = await wb.xlsx.writeBuffer()
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'department_import_errors.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      showToast('danger', 'Error report download failed. Install exceljs in frontend.')
    }
  }

  const onImportExcel = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return showToast('danger', 'Please choose an Excel file')
    if ((previewData?.failed ?? 0) > 0) return showToast('danger', 'Fix preview errors before importing')

    setImporting(true)
    setImportProgress(10)
    setImportSummary(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      setImportProgress(35)
      const res = await axios.post('/api/setup/department/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setImportProgress(90)
      setImportSummary(res.data)
      setImportProgress(100)
      showToast('success', 'Excel imported successfully')
      if (fileRef.current) fileRef.current.value = ''
      setFileName('')
      setPreviewData(null)
      await loadDepartments()
    } catch (err) {
      setImportProgress(0)
      setImportSummary(err?.response?.data || null)
      showToast('danger', err?.response?.data?.error || 'Import failed')
    } finally {
      setTimeout(() => setImporting(false), 300)
    }
  }

  const mainColumns = useMemo(() => ([
    { key: 'institution', label: 'Institution' },
    { key: 'departmentCode', label: 'Department Code' },
    { key: 'departmentName', label: 'Department Name' },
    { key: 'yearEstablished', label: 'Year' },
    { key: 'nbaAccredited', label: 'NBA' },
    { key: 'status', label: 'Status' },
    { key: 'isActive', label: 'Active' },
  ]), [])

  const mappedRows = useMemo(() => rows.map((r) => {
    const instName = r?.institution?.name
    const instCode = r?.institution?.code
    return {
      ...r,
      institution: instCode && instName ? `${instCode} - ${instName}` : r.institutionId,
      nbaAccredited: r.nbaAccredited ? 'Yes' : 'No',
      status: r.status ? 'Active' : 'Inactive',
      isActive: r.isActive ? 'Active' : 'Inactive',
    }
  }), [rows])

  const previewColumns = useMemo(() => ([
    { key: 'rowNumber', label: 'Row' },
    { key: 'institutionCode', label: 'Institution Code' },
    { key: 'institutionName', label: 'Institution Name' },
    { key: 'departmentCode', label: 'Dept Code' },
    { key: 'departmentName', label: 'Dept Name' },
    { key: 'action', label: 'Action' },
    { key: 'reason', label: 'Reason' },
  ]), [])

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>DEPARTMENT SETUP</strong>
          <div className="d-flex gap-2">
            <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
            <ArpIconButton icon="view" color="purple" onClick={onView} disabled={!selectedId} />
            <ArpIconButton icon="edit" color="info" onClick={onEdit} disabled={!selectedId} />
            <ArpIconButton icon="delete" color="danger" onClick={onDelete} disabled={!selectedId} />
          </div>
        </CCardHeader>

        <CCardBody>
          {toast && <CAlert color={toast.type} className="mb-3">{toast.message}</CAlert>}

          {/* Template + Preview + Import */}
          <CCard className="mb-3 border-0">
            <CCardBody className="p-0">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <ArpButton label="Download Template" icon="download" color="secondary" onClick={downloadTemplate} />
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="form-control" style={{ maxWidth: 360 }} onChange={onChooseFile} />
                <ArpButton label={importing ? 'Importing...' : 'Import Excel'} icon="upload" color="success" onClick={onImportExcel}
                  disabled={importing || previewLoading || !fileName || (previewData?.failed ?? 0) > 0} />
                {(previewLoading || importing) && <CSpinner size="sm" />}
              </div>

              {fileName && <div className="mt-2 small text-muted">Selected: <strong>{fileName}</strong></div>}

              {previewData && (
                <div className="mt-2">
                  <CBadge color="success" className="me-2">Inserts: {previewData.inserts ?? 0}</CBadge>
                  <CBadge color="info" className="me-2">Updates: {previewData.updates ?? 0}</CBadge>
                  <CBadge color="danger" className="me-2">Errors: {previewData.failed ?? 0}</CBadge>
                </div>
              )}

              {importing && <div className="mt-2"><CProgress><CProgressBar value={importProgress} /></CProgress></div>}

              {importSummary && (
                <div className="mt-2">
                  <CBadge color="success" className="me-2">Inserted: {importSummary.inserted ?? 0}</CBadge>
                  <CBadge color="info" className="me-2">Updated: {importSummary.updated ?? 0}</CBadge>
                  <CBadge color="danger" className="me-2">Failed: {importSummary.failed ?? 0}</CBadge>
                  {!!importSummary?.errors?.length && (
                    <ArpButton className="ms-2" label="Download Error Report" icon="download" color="danger" onClick={downloadErrorReport} />
                  )}
                </div>
              )}
            </CCardBody>
          </CCard>

          {previewData?.preview?.length ? (
            <div className="mb-3">
              <ArpDataTable title="Bulk Import Preview" rows={previewData.preview} columns={previewColumns} loading={previewLoading} />
            </div>
          ) : null}

          {/* Form */}
          <CForm onSubmit={onSave}>
            <CRow className="g-3">
              <CCol md={3}><CFormLabel>Institution</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.institutionId} onChange={onChange('institutionId')} disabled={!isEdit}>
                  <option value="">Select</option>
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>{i.code ? `${i.code} - ${i.name}` : i.name}</option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Department Code</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.departmentCode} onChange={onChange('departmentCode')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>Department Name</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.departmentName} onChange={onChange('departmentName')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>Year Established</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.yearEstablished} onChange={onChange('yearEstablished')} disabled={!isEdit}>
                  <option value="">Select</option>
                  {years.map((y) => (<option key={y} value={y}>{y}</option>))}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>NBA Accredited</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.nbaAccredited ? 'Yes' : 'No'} onChange={onChange('nbaAccredited')} disabled={!isEdit}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Objectives</CFormLabel></CCol>
              <CCol md={3}>
                <CFormTextarea rows={2} value={form.objectives} onChange={onChange('objectives')} disabled={!isEdit} />
              </CCol>

              <CCol md={3}><CFormLabel>Vision</CFormLabel></CCol>
              <CCol md={3}>
                <CFormTextarea rows={2} value={form.vision} onChange={onChange('vision')} disabled={!isEdit} />
              </CCol>

              <CCol md={3}><CFormLabel>Mission</CFormLabel></CCol>
              <CCol md={3}>
                <CFormTextarea rows={2} value={form.mission} onChange={onChange('mission')} disabled={!isEdit} />
              </CCol>

              <CCol md={3}><CFormLabel>Goals</CFormLabel></CCol>
              <CCol md={3}>
                <CFormTextarea rows={2} value={form.goals} onChange={onChange('goals')} disabled={!isEdit} />
              </CCol>

              <CCol xs={12} className="d-flex justify-content-end gap-2">
                <ArpButton label={saving ? 'Saving...' : 'Save'} icon="save" color="success" type="submit" disabled={!isEdit || saving} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      <ArpDataTable title="Department Details" rows={mappedRows} columns={mainColumns} loading={loading}
        selection={{ type: 'radio', selected: selectedId, onChange: (id) => setSelectedId(id), key: 'id' }} />
    </>
  )
}

export default Department
