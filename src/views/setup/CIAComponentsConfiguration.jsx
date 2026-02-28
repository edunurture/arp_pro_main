import React, { useEffect, useRef, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormCheck, CFormInput, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import api from '../../services/apiClient'

/**
 * CIAComponentsConfiguration.jsx (ARP CoreUI React Pro Standard) - Updated based on cia_components.html
 *
 * Matches HTML layout/behavior:
 * - Top header title: "Continuous Internal Assessment (CIA) Configurations"
 * - Header actions: Title only
 * - Scope row actions: Download Template + Choose File + Import Excel + Search
 * - Form Card 1: "Add Internal Examination Components" with dynamic rows:
 *     Select | Examination Type | Name of the Examination | Action(Add Row)
 * - Form Card 2: "Add Computation Values" with switches (checkboxes)
 * - Save / Cancel aligned right
 * ARP rules preserved:
 * - No direct @coreui/icons imports
 * - No ArpPagination/manual search logic in module
 */

const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`

const createExamRow = (overrides = {}) => ({
  id: uid(),
  examType: '',
  examName: '',
  ...overrides,
})

const initialCompute = {
  total: false,
  bestOfTwo: false,
  bestOfThree: false,
  average: false,
  convertInto: false,
  roundOff: false,
}

const initialScope = {
  institutionId: '',
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

const toErrorReportBlob = (details) => {
  const lines = Array.isArray(details) ? details : [String(details || 'Import failed')]
  return new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
}

const mapApiRowsToUiRows = (components = []) =>
  (Array.isArray(components) ? components : []).map((x) => ({
    id: x.id || uid(),
    examType: String(x.examType || '').trim(),
    examName: String(x.examName || '').trim(),
  }))

export default function CIAComponentsConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [scope, setScope] = useState(initialScope)
  const [institutions, setInstitutions] = useState([])
  const [importing, setImporting] = useState(false)
  const [loadingComponents, setLoadingComponents] = useState(false)
  const [examSearch, setExamSearch] = useState('')
  const fileRef = useRef(null)

  // Dynamic Internal Examination Components
  const [examRows, setExamRows] = useState([createExamRow()])
  const [selectedExamRowId, setSelectedExamRowId] = useState('')

  // Computation switches
  const [compute, setCompute] = useState(initialCompute)

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const res = await api.get('/api/setup/institution')
        setInstitutions(unwrapList(res))
      } catch {
        setInstitutions([])
      }
    }
    loadInstitutions()
  }, [])

  useEffect(() => {
    if (!selectedExamRowId && examRows.length > 0) {
      setSelectedExamRowId(examRows[0].id)
    }
  }, [examRows, selectedExamRowId])

  const loadCIAComponents = async (institutionId) => {
    if (!institutionId) return
    setLoadingComponents(true)
    try {
      setExamSearch('')
      const res = await api.get('/api/setup/cia-components', { params: { institutionId } })
      const data = res?.data?.data || {}
      const nextRows = mapApiRowsToUiRows(data.components)
      if (nextRows.length > 0) {
        setExamRows(nextRows)
        setSelectedExamRowId(nextRows[0].id)
        setIsEdit(false)
      } else {
        const firstRow = createExamRow()
        setExamRows([firstRow])
        setSelectedExamRowId(firstRow.id)
        setIsEdit(true)
      }
      setCompute((prev) => ({
        ...prev,
        bestOfTwo: Boolean(data?.compute?.bestOfTwo),
        bestOfThree: Boolean(data?.compute?.bestOfThree),
        average: Boolean(data?.compute?.average),
        roundOff: Boolean(data?.compute?.roundOff),
        total: Boolean(data?.compute?.totalComponents),
        convertInto: Boolean(data?.compute?.convertInto),
      }))
    } catch {
      const firstRow = createExamRow()
      setExamRows([firstRow])
      setSelectedExamRowId(firstRow.id)
      setIsEdit(true)
    } finally {
      setLoadingComponents(false)
    }
  }

  useEffect(() => {
    if (!scope.institutionId) {
      setExamSearch('')
      const firstRow = createExamRow()
      setExamRows([firstRow])
      setSelectedExamRowId(firstRow.id)
      setCompute(initialCompute)
      setIsEdit(false)
      return
    }
    loadCIAComponents(scope.institutionId)
  }, [scope.institutionId])

  /* =========================
     Dynamic row handlers (HTML add-row / remove-row)
  ========================== */

  const addRowAfter = (index) => {
    setExamRows((prev) => {
      const next = [...prev]
      const newRow = createExamRow()
      next.splice(index + 1, 0, newRow)
      setSelectedExamRowId(newRow.id)
      return next
    })
  }

  const removeRowAt = (index) => {
    setExamRows((prev) => {
      if (prev.length <= 1) return prev
      const next = [...prev]
      const removed = next[index]
      next.splice(index, 1)
      if (String(removed?.id) === String(selectedExamRowId)) {
        setSelectedExamRowId(next[0]?.id || '')
      }
      return next
    })
  }

  const updateExamRow = (id, key, value) => {
    setExamRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  }

  const selectedExamRow = examRows.find((r) => String(r.id) === String(selectedExamRowId)) || null
  const selectedExamRowIndex = examRows.findIndex((r) => String(r.id) === String(selectedExamRowId))
  const filteredExamRows = examRows.filter((r) =>
    String(r.examName || '')
      .toLowerCase()
      .includes(String(examSearch || '').toLowerCase()),
  )

  const onViewSelectedExamRow = () => {
    if (!selectedExamRow) return
    const row = selectedExamRow
    alert(`Examination Type: ${row.examType || '-'}\nName of the Examination: ${row.examName || '-'}`)
  }

  const onEditSelectedExamRow = () => {
    if (!selectedExamRow) {
      alert('Please select a row first.')
      return
    }
    if (!scope.institutionId) {
      alert('Please select Institution in Scope of Selection.')
      return
    }
    setIsEdit(true)
  }

  const onDeleteSelectedExamRow = () => {
    if (!selectedExamRow) {
      alert('Please select a row first.')
      return
    }
    if (!isEdit) return
    removeRowAt(selectedExamRowIndex)
  }

  const onDownloadAllExamComponents = async () => {
    if (!scope.institutionId) {
      alert('Please select Institution in Scope of Selection.')
      return
    }
    try {
      const res = await api.get('/api/setup/cia-components/export', {
        params: { institutionId: scope.institutionId },
        responseType: 'blob',
      })
      downloadBlob(res.data, 'CIA_Components_Export.xlsx')
    } catch {
      alert('Failed to download Examination Components.')
    }
  }

  const resetForm = () => {
    const firstRow = createExamRow()
    setExamRows([firstRow])
    setSelectedExamRowId(firstRow.id)
    setCompute(initialCompute)
  }

  /* =========================
     Header actions
  ========================== */

  const onCancel = async () => {
    setIsEdit(false)
    if (scope.institutionId) {
      await loadCIAComponents(scope.institutionId)
      return
    }
    resetForm()
  }

  const onSearchScope = async () => {
    if (!scope.institutionId) {
      alert('Please select Institution in Scope of Selection.')
      return
    }
    await loadCIAComponents(scope.institutionId)
  }

  const onDownloadTemplate = async () => {
    if (!scope.institutionId) {
      alert('Please select Institution in Scope of Selection.')
      return
    }
    try {
      const res = await api.get('/api/setup/cia-components/template', { responseType: 'blob' })
      downloadBlob(res.data, 'CIA_Components_Template.xlsx')
    } catch {
      alert('Failed to download template.')
    }
  }

  const onImport = async () => {
    if (!scope.institutionId) {
      alert('Please select Institution in Scope of Selection.')
      return
    }
    const file = fileRef.current?.files?.[0]
    if (!file) {
      alert('Choose an Excel file first.')
      return
    }

    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('institutionId', scope.institutionId)

      const res = await api.post('/api/setup/cia-components/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
        validateStatus: (status) => status >= 200 && status < 500,
      })

      const contentType = res.headers?.['content-type'] || ''
      if (contentType.includes('application/json')) {
        const text = await res.data.text()
        const data = JSON.parse(text || '{}')
        if (res.status >= 400) {
          const reportBlob = toErrorReportBlob(data?.details || data?.error || 'Import failed')
          downloadBlob(reportBlob, 'CIA_Components_Import_Errors.txt')
          alert(data?.error || 'Import failed. Error report downloaded.')
          return
        }
        await loadCIAComponents(scope.institutionId)
        alert(data?.message || 'CIA Components imported successfully.')
        if (fileRef.current) fileRef.current.value = ''
        return
      }

      if (res.status >= 400) {
        downloadBlob(res.data, 'CIA_Components_Import_Errors.xlsx')
        alert('Import completed with errors. Error report downloaded.')
        return
      }

      await loadCIAComponents(scope.institutionId)
      alert('CIA Components imported successfully.')
      if (fileRef.current) fileRef.current.value = ''
    } catch {
      alert('Failed to import excel.')
    } finally {
      setImporting(false)
    }
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (!isEdit) return
    if (!scope.institutionId) {
      alert('Please select Institution in Scope of Selection.')
      return
    }

    const normalizedRows = examRows
      .map((r) => ({
        examType: String(r.examType || '').trim(),
        examName: String(r.examName || '').trim(),
      }))
      .filter((r) => r.examType || r.examName)

    if (normalizedRows.length === 0) {
      alert('Please enter at least one Internal Examination Component.')
      return
    }

    const hasIncomplete = normalizedRows.some((r) => !r.examType || !r.examName)
    if (hasIncomplete) {
      alert('Both Examination Type and Name of the Examination are required for each entered row.')
      return
    }

    try {
      await api.post('/api/setup/cia-components', {
        institutionId: scope.institutionId,
        components: normalizedRows,
        compute: {
          bestOfTwo: compute.bestOfTwo,
          bestOfThree: compute.bestOfThree,
          average: compute.average,
          roundOff: compute.roundOff,
          totalComponents: compute.total ? normalizedRows.length : null,
          convertInto: compute.convertInto ? 1 : null,
        },
      })
      await loadCIAComponents(scope.institutionId)
      setIsEdit(false)
      alert('Saved successfully.')
    } catch (err) {
      const error = err?.response?.data?.error || 'Failed to save CIA Components.'
      const details = err?.response?.data?.details
      const detailText = Array.isArray(details) ? `\n${details.join('\n')}` : details ? `\n${details}` : ''
      alert(`${error}${detailText}`)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* ===================== A) HEADER ACTION CARD ===================== */}
        <CCard className="mb-3 arp-cia-components-compute">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Continuous Internal Assessment (CIA) Configurations</strong>
          </CCardHeader>
        </CCard>

        {/* ===================== B) SCOPE OF SELECTION ===================== */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Scope of Selection</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel>Institution</CFormLabel>
              </CCol>
              <CCol md={5}>
                <CFormSelect value={scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, institutionId: e.target.value }))}>
                  <option value="">Select Institution</option>
                  {institutions.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <ArpButton
                  label={loadingComponents ? 'Searching...' : 'Search'}
                  icon="search"
                  color="info"
                  onClick={onSearchScope}
                  disabled={!scope.institutionId || loadingComponents}
                />
              </CCol>
              <CCol xs={12}>
                <div className="d-flex gap-2 align-items-center flex-wrap">
                  <ArpButton label="Download Template" icon="download" color="secondary" onClick={onDownloadTemplate} disabled={!scope.institutionId} />
                  <input ref={fileRef} type="file" accept=".xlsx,.xls" className="form-control" style={{ maxWidth: 320 }} />
                  <ArpButton label={importing ? 'Importing...' : 'Import Excel'} icon="upload" color="primary" onClick={onImport} disabled={!scope.institutionId || importing} />
                  {loadingComponents ? <small className="text-muted">Loading components...</small> : null}
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {/* ===================== C1) FORM CARD - INTERNAL EXAM COMPONENTS ===================== */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Add Internal Examination Components</strong>
            <div className="d-flex gap-2 align-items-center">
              <CFormInput
                placeholder="Search Name of the Examination"
                value={examSearch}
                onChange={(e) => setExamSearch(e.target.value)}
                style={{ minWidth: 260 }}
              />
              <ArpIconButton icon="view" color="purple" title="View Selected Row" onClick={onViewSelectedExamRow} disabled={!selectedExamRow} />
              <ArpIconButton icon="edit" color="info" title="Edit Selected Row" onClick={onEditSelectedExamRow} disabled={!selectedExamRow} />
              <ArpIconButton
                icon="delete"
                color="danger"
                title="Delete Selected Row"
                onClick={onDeleteSelectedExamRow}
                disabled={!selectedExamRow || !isEdit || examRows.length <= 1}
              />
              <ArpIconButton
                icon="download"
                color="warning"
                title="Download Examination Components"
                onClick={onDownloadAllExamComponents}
                disabled={!scope.institutionId}
              />
            </div>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 70, textAlign: 'center' }}>Select</th>
                      <th style={{ width: 260 }}>Examination Type</th>
                      <th>Name of the Examination</th>
                      <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExamRows.map((r) => {
                      const idx = examRows.findIndex((x) => String(x.id) === String(r.id))
                      const isLast = idx === examRows.length - 1
                      const icon = isLast ? 'add' : 'delete'
                      const color = isLast ? 'success' : 'danger'
                      const title = isLast ? 'Add Row' : 'Remove Row'
                      const onClick = isLast ? () => addRowAfter(idx) : () => removeRowAt(idx)

                      return (
                        <tr key={r.id}>
                          <td className="text-center">
                            <CFormCheck
                              type="radio"
                              name="ciaComponentRowSelect"
                              checked={String(selectedExamRowId) === String(r.id)}
                              onChange={() => setSelectedExamRowId(r.id)}
                            />
                          </td>
                          <td>
                            <CFormInput
                              value={r.examType}
                              onChange={(e) => updateExamRow(r.id, 'examType', e.target.value)}
                              disabled={!isEdit}
                              placeholder="Examination Type"
                            />
                          </td>
                          <td>
                            <CFormInput
                              value={r.examName}
                              onChange={(e) => updateExamRow(r.id, 'examName', e.target.value)}
                              disabled={!isEdit}
                              placeholder="Name of the Examination"
                            />
                          </td>
                          <td className="text-center">
                            {isLast ? <ArpIconButton icon={icon} color={color} title={title} onClick={onClick} disabled={!isEdit} /> : null}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ===================== C2) FORM CARD - COMPUTATION VALUES ===================== */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Add Computation Values</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Total</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center">
                  <CFormCheck className="arp-checkbox-black" checked={compute.total} onChange={(e) => setCompute((p) => ({ ...p, total: e.target.checked }))} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Best of Two</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center">
                  <CFormCheck className="arp-checkbox-black" checked={compute.bestOfTwo} onChange={(e) => setCompute((p) => ({ ...p, bestOfTwo: e.target.checked }))} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Best of Three</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center">
                  <CFormCheck className="arp-checkbox-black" checked={compute.bestOfThree} onChange={(e) => setCompute((p) => ({ ...p, bestOfThree: e.target.checked }))} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Average</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center">
                  <CFormCheck className="arp-checkbox-black" checked={compute.average} onChange={(e) => setCompute((p) => ({ ...p, average: e.target.checked }))} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Convert Into</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center">
                  <CFormCheck className="arp-checkbox-black" checked={compute.convertInto} onChange={(e) => setCompute((p) => ({ ...p, convertInto: e.target.checked }))} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Round Off</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center">
                  <CFormCheck className="arp-checkbox-black" checked={compute.roundOff} onChange={(e) => setCompute((p) => ({ ...p, roundOff: e.target.checked }))} disabled={!isEdit} />
                </CCol>

                {/* Buttons (match HTML placement; ARP colors) */}
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}
