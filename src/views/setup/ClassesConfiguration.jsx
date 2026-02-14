import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'
import api from '../../services/apiClient'

const initialScope = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
}

const initialForm = {
  className: '',
  classLabel: '',
  strength: '',
  roomNumber: '',
  capacity: '',
  buildingName: '',
  blockLabel: '',
}

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

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

export default function ClassesConfiguration() {
  const [scope, setScope] = useState(initialScope)
  const [form, setForm] = useState(initialForm)
  const [isEdit, setIsEdit] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])

  const [rows, setRows] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loadingMasters, setLoadingMasters] = useState(false)
  const [loadingRows, setLoadingRows] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState(null)
  const [importSummary, setImportSummary] = useState(null)
  const fileRef = useRef(null)

  const showMessage = (type, text) => setMessage({ type, text })
  const scopeReady = useMemo(
    () => Boolean(scope.institutionId && scope.departmentId && scope.programmeId),
    [scope],
  )

  const resetForm = () => {
    setForm(initialForm)
    setIsEdit(false)
    setEditingId(null)
  }

  const clearTableState = () => {
    setRows([])
    setSelectedId(null)
    resetForm()
  }

  const loadInstitutions = async () => {
    setLoadingMasters(true)
    try {
      const res = await api.get('/api/setup/institution')
      setInstitutions(unwrapList(res))
    } catch (e) {
      setInstitutions([])
      showMessage('danger', e?.response?.data?.message || 'Failed to load institutions')
    } finally {
      setLoadingMasters(false)
    }
  }

  const loadDepartments = async (institutionId) => {
    try {
      const res = await api.get('/api/setup/department', { params: { institutionId } })
      setDepartments(unwrapList(res))
    } catch {
      setDepartments([])
    }
  }

  const loadProgrammes = async (institutionId, departmentId) => {
    try {
      const res = await api.get('/api/setup/programme')
      const all = unwrapList(res)
      setProgrammes(
        all.filter(
          (p) =>
            String(p.institutionId) === String(institutionId) &&
            String(p.departmentId) === String(departmentId),
        ),
      )
    } catch {
      setProgrammes([])
    }
  }

  useEffect(() => {
    loadInstitutions()
  }, [])

  useEffect(() => {
    if (!scope.institutionId) {
      setDepartments([])
      setProgrammes([])
      return
    }
    setScope((s) => ({ ...s, departmentId: '', programmeId: '' }))
    clearTableState()
    loadDepartments(scope.institutionId)
  }, [scope.institutionId])

  useEffect(() => {
    if (!scope.institutionId || !scope.departmentId) {
      setProgrammes([])
      return
    }
    setScope((s) => ({ ...s, programmeId: '' }))
    clearTableState()
    loadProgrammes(scope.institutionId, scope.departmentId)
  }, [scope.departmentId])

  const loadClasses = async () => {
    if (!scopeReady) return showMessage('danger', 'Please complete scope before search.')
    setLoadingRows(true)
    try {
      const res = await api.get('/api/setup/class', {
        params: {
          institutionId: scope.institutionId,
          departmentId: scope.departmentId,
          programmeId: scope.programmeId,
        },
      })
      setRows(unwrapList(res))
      setSelectedId(null)
      resetForm()
    } catch (e) {
      setRows([])
      showMessage('danger', e?.response?.data?.error || 'Failed to load classes')
    } finally {
      setLoadingRows(false)
    }
  }

  const onCancelScope = () => {
    clearTableState()
    setMessage(null)
  }

  const loadSelectedToForm = (mode) => {
    const row = rows.find((r) => String(r.id) === String(selectedId))
    if (!row) return
    setForm({
      className: row.className || '',
      classLabel: row.classLabel || '',
      strength: row.strength ?? '',
      roomNumber: row.roomNumber || '',
      capacity: row.capacity ?? '',
      buildingName: row.buildingName || '',
      blockLabel: row.blockLabel || '',
    })
    setEditingId(row.id)
    setIsEdit(mode === 'EDIT')
  }

  const onAddNew = () => {
    if (!scopeReady) return showMessage('danger', 'Complete scope and click Search before adding class.')
    setSelectedId(null)
    setEditingId(null)
    setIsEdit(true)
    setForm(initialForm)
  }

  const onView = () => {
    if (!selectedId) return
    loadSelectedToForm('VIEW')
  }

  const onEdit = () => {
    if (!selectedId) return
    loadSelectedToForm('EDIT')
  }

  const onDelete = async () => {
    if (!selectedId) return
    if (!window.confirm('Delete selected class?')) return
    try {
      await api.delete(`/api/setup/class/${selectedId}`)
      showMessage('success', 'Class deleted successfully.')
      await loadClasses()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to delete class')
    }
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (!form.className.trim()) return showMessage('danger', 'Class Name is required')
    if (!form.classLabel.trim()) return showMessage('danger', 'Section is required')
    if (!form.strength && form.strength !== 0) return showMessage('danger', 'Class Strength is required')

    setSaving(true)
    try {
      const payload = {
        institutionId: scope.institutionId,
        departmentId: scope.departmentId,
        programmeId: scope.programmeId,
        className: form.className,
        classLabel: form.classLabel,
        strength: form.strength,
        roomNumber: form.roomNumber,
        capacity: form.capacity || null,
        buildingName: form.buildingName,
        blockLabel: form.blockLabel,
      }

      if (editingId) await api.put(`/api/setup/class/${editingId}`, payload)
      else await api.post('/api/setup/class', payload)

      showMessage('success', 'Class saved successfully.')
      resetForm()
      await loadClasses()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to save class')
    } finally {
      setSaving(false)
    }
  }

  const onDownloadTemplate = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete scope before downloading template.')
    try {
      const institution = institutions.find((x) => String(x.id) === String(scope.institutionId))
      const department = departments.find((x) => String(x.id) === String(scope.departmentId))
      const programme = programmes.find((x) => String(x.id) === String(scope.programmeId))

      const res = await api.get('/api/setup/class/template', {
        params: {
          institutionId: scope.institutionId,
          departmentId: scope.departmentId,
          programmeId: scope.programmeId,
          institutionName: institution?.code ? `${institution.code} - ${institution.name}` : institution?.name || '',
          departmentName: department?.departmentCode ? `${department.departmentCode} - ${department.departmentName}` : department?.departmentName || '',
          programmeCode: programme?.programmeCode || '',
        },
        responseType: 'blob',
      })
      downloadBlob(res.data, 'Classes_and_Sections_Template.xlsx')
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to download class template')
    }
  }

  const onExport = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete scope before export.')
    try {
      const institution = institutions.find((x) => String(x.id) === String(scope.institutionId))
      const department = departments.find((x) => String(x.id) === String(scope.departmentId))

      const res = await api.get('/api/setup/class/export', {
        params: {
          institutionId: scope.institutionId,
          departmentId: scope.departmentId,
          programmeId: scope.programmeId,
          institutionName: institution?.code ? `${institution.code} - ${institution.name}` : institution?.name || '',
          departmentName: department?.departmentCode ? `${department.departmentCode} - ${department.departmentName}` : department?.departmentName || '',
        },
        responseType: 'blob',
      })
      downloadBlob(res.data, 'Classes_and_Sections_Export.xlsx')
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to export classes')
    }
  }

  const onImport = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete scope before import.')
    const file = fileRef.current?.files?.[0]
    if (!file) return showMessage('danger', 'Choose an Excel file first.')
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/api/setup/class/import', fd, {
        params: {
          institutionId: scope.institutionId,
          departmentId: scope.departmentId,
          programmeId: scope.programmeId,
        },
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
        validateStatus: (status) => status >= 200 && status < 500,
      })

      const contentType = res.headers?.['content-type'] || ''
      if (contentType.includes('application/json')) {
        const text = await res.data.text()
        const data = JSON.parse(text)
        setImportSummary(data?.data || null)
        showMessage('success', data?.message || 'Class import completed successfully.')
        if (fileRef.current) fileRef.current.value = ''
        await loadClasses()
        return
      }

      if (res.status >= 400) {
        downloadBlob(res.data, 'Classes_Import_Errors.xlsx')
        showMessage('danger', 'Import completed with errors (error sheet downloaded)')
        return
      }

      showMessage('success', 'Class import completed successfully.')
      if (fileRef.current) fileRef.current.value = ''
      await loadClasses()
    } catch {
      showMessage('danger', 'Failed to import classes')
    } finally {
      setImporting(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'programme',
        label: 'Programme',
        sortable: true,
        render: (r) => r?.programme?.programmeCode || '-',
      },
      { key: 'className', label: 'Class Name', sortable: true },
      { key: 'classLabel', label: 'Section', sortable: true, width: 90, align: 'center' },
      { key: 'strength', label: 'Strength', sortable: true, width: 100, align: 'center' },
      { key: 'roomNumber', label: 'Room Number', sortable: true, width: 120, align: 'center' },
      { key: 'buildingName', label: 'Building', sortable: true },
      { key: 'blockLabel', label: 'Block', sortable: true, width: 90, align: 'center' },
    ],
    [],
  )

  const tableActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        {message ? <CAlert color={message.type}>{message.text}</CAlert> : null}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>CLASSES SETUP</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="Export" icon="download" color="info" onClick={onExport} disabled={!scopeReady} />
            </div>
          </CCardHeader>
          <CCardBody>
            {loadingMasters ? (
              <div className="d-flex align-items-center gap-2">
                <CSpinner size="sm" />
                <span>Loading masters...</span>
              </div>
            ) : (
              <CForm>
                <CRow className="g-3">
                  <CCol md={2}><CFormLabel>Institution</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect value={scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, institutionId: e.target.value }))}>
                      <option value="">Select Institution</option>
                      {institutions.map((x) => <option key={x.id} value={x.id}>{x.code ? `${x.code} - ${x.name}` : x.name}</option>)}
                    </CFormSelect>
                  </CCol>

                  <CCol md={2}><CFormLabel>Department</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect value={scope.departmentId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, departmentId: e.target.value }))}>
                      <option value="">Select Department</option>
                      {departments.map((x) => <option key={x.id} value={x.id}>{x.departmentCode ? `${x.departmentCode} - ${x.departmentName}` : x.departmentName}</option>)}
                    </CFormSelect>
                  </CCol>

                  <CCol md={2}><CFormLabel>Programme</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect value={scope.programmeId} disabled={!scope.departmentId} onChange={(e) => setScope((s) => ({ ...s, programmeId: e.target.value }))}>
                      <option value="">Select Programme</option>
                      {programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode ? `${x.programmeCode} - ${x.programmeName}` : x.programmeName}</option>)}
                    </CFormSelect>
                  </CCol>

                  <CCol xs={12} className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2 align-items-center">
                      <ArpButton
                        label="Download Template"
                        icon="download"
                        color="secondary"
                        onClick={onDownloadTemplate}
                        disabled={!scopeReady}
                        className="text-nowrap"
                      />
                      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="form-control" style={{ maxWidth: 320 }} />
                      <ArpButton
                        label={importing ? 'Importing...' : 'Import Excel'}
                        icon="upload"
                        color="warning"
                        onClick={onImport}
                        disabled={importing || !scopeReady}
                        className="text-nowrap"
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <ArpButton label={loadingRows ? 'Searching...' : 'Search'} icon="search" color="info" onClick={loadClasses} disabled={loadingRows || !scopeReady} />
                      <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelScope} />
                    </div>
                  </CCol>
                </CRow>
              </CForm>
            )}
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Class Details</strong></CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Class Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.className} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))} /></CCol>

                <CCol md={3}><CFormLabel>Section</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.classLabel} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, classLabel: e.target.value }))} /></CCol>

                <CCol md={3}><CFormLabel>Class Strength</CFormLabel></CCol>
                <CCol md={3}><CFormInput type="number" value={form.strength} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, strength: e.target.value }))} /></CCol>

                <CCol md={3}><CFormLabel>Room Number</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.roomNumber} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))} /></CCol>

                <CCol md={3}><CFormLabel>Building Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.buildingName} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, buildingName: e.target.value }))} /></CCol>

                <CCol md={3}><CFormLabel>Block</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.blockLabel} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, blockLabel: e.target.value }))} /></CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  {isEdit ? <ArpButton label={saving ? 'Saving...' : 'Save'} icon="save" color="success" type="submit" disabled={saving} /> : null}
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={resetForm} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {importSummary ? (
          <CAlert color="info">
            Imported Rows: {importSummary.rows ?? 0}, Upserted: {importSummary.upserted ?? 0}
          </CAlert>
        ) : null}

        <ArpDataTable
          title="Classes and Sections"
          rows={rows}
          columns={columns}
          loading={loadingRows}
          headerActions={tableActions}
          rowKey="id"
          selection={{
            type: 'radio',
            selected: selectedId,
            onChange: (id) => setSelectedId(id),
            key: 'id',
            headerLabel: 'Select',
            width: 60,
            name: 'classRow',
          }}
        />
      </CCol>
    </CRow>
  )
}
