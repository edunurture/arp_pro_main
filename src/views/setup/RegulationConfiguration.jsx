import React, { useMemo, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CFormTextarea, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * RegulationConfiguration.jsx (ARP CoreUI React Pro Standard)
 * - Strict 3-card layout: Header Action Card + Form Card + Table Card (ArpDataTable)
 * - Uses ArpDataTable for Search + Page Size + Sorting + Pagination + Selection
 * - No direct @coreui/icons imports
 * - Demo rows only. Hook API where indicated.
 */

const initialBatchForm = {
  batchName: '',
  description: '',
}

const initialRegForm = {
  regulationCode: '',
  regulationYear: '',
  programmeCode: '',
  description: '',
}

export default function RegulationConfiguration() {
  // ARP mandatory state pattern
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // local mode for which form is active
  const [mode, setMode] = useState(null) // 'BATCH' | 'REG' | null
  const [editingId, setEditingId] = useState(null)

  // forms
  const [batchForm, setBatchForm] = useState(initialBatchForm)
  const [regForm, setRegForm] = useState(initialRegForm)

  // Table rows (demo)
  const [rows, setRows] = useState([
    {
      id: 1,
      regulationCode: 'N26',
      regulationYear: '2026',
      programme: 'MCA',
      description: 'Admitted the AY 2026',
    },
  ])

  const isBatchMode = mode === 'BATCH'
  const isRegMode = mode === 'REG'

  const resetAll = () => {
    setBatchForm(initialBatchForm)
    setRegForm(initialRegForm)
    setMode(null)
    setIsEdit(false)
    setEditingId(null)
  }

  /* =========================
     HEADER ACTIONS
  ========================== */

  const onAddBatch = () => {
    setMode('BATCH')
    setIsEdit(true)
    setEditingId(null)
    setBatchForm(initialBatchForm)
  }

  const onAddRegulation = () => {
    setMode('REG')
    setIsEdit(true)
    setEditingId(null)
    setRegForm(initialRegForm)
  }

  /* =========================
     FORM HANDLERS
  ========================== */

  const onBatchChange = (key) => (e) => setBatchForm((p) => ({ ...p, [key]: e.target.value }))
  const onRegChange = (key) => (e) => setRegForm((p) => ({ ...p, [key]: e.target.value }))

  const onCancel = () => {
    // ARP: Cancel returns to view mode and clears form
    resetAll()
  }

  const upsert = (prev, row) => {
    const idx = prev.findIndex((r) => String(r.id) === String(row.id))
    if (idx === -1) return [row, ...prev]
    const next = [...prev]
    next[idx] = row
    return next
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!isEdit || !mode) return

    if (mode === 'BATCH') {
      // No batch table in original HTML. Save is form-only.
      // Hook your API save here
      resetAll()
      return
    }

    if (mode === 'REG') {
      const id = editingId ?? `REG-${Date.now()}`

      const programme = regForm.programmeCode ? regForm.programmeCode.replace(/^\d+\-/, '') : ''
      const year = regForm.regulationYear || ''

      const row = {
        id,
        regulationCode: regForm.regulationCode || '',
        regulationYear: year,
        programme,
        description: regForm.description || '',
      }

      // Hook your API save here
      setRows((prev) => upsert(prev, row))
      setSelectedId(id)
      resetAll()
    }
  }

  /* =========================
     TABLE ACTIONS (Regulation Details)
  ========================== */

  const selectedRow = rows.find((r) => String(r.id) === String(selectedId)) || null

  const onView = () => {
    if (!selectedRow) return
    setMode('REG')
    setIsEdit(false)
    setEditingId(String(selectedRow.id))
    setRegForm({
      regulationCode: selectedRow.regulationCode ?? '',
      regulationYear: selectedRow.regulationYear ?? '',
      programmeCode: selectedRow.programme ? `26-${selectedRow.programme}` : '', // demo mapping
      description: selectedRow.description ?? '',
    })
  }

  const onEdit = () => {
    if (!selectedRow) return
    setMode('REG')
    setIsEdit(true)
    setEditingId(String(selectedRow.id))
    setRegForm({
      regulationCode: selectedRow.regulationCode ?? '',
      regulationYear: selectedRow.regulationYear ?? '',
      programmeCode: selectedRow.programme ? `26-${selectedRow.programme}` : '', // demo mapping
      description: selectedRow.description ?? '',
    })
  }

  const onDelete = () => {
    if (!selectedRow) return
    // Hook your API delete here
    setRows((prev) => prev.filter((r) => String(r.id) !== String(selectedRow.id)))
    setSelectedId(null)
    resetAll()
  }

  /* =========================
     ArpDataTable CONFIG
  ========================== */

  const columns = useMemo(
    () => [
      { key: 'regulationCode', label: 'Regulation Code', sortable: true, width: 160 },
      { key: 'regulationYear', label: 'Year of Regulation', sortable: true, width: 170, align: 'center' },
      { key: 'programme', label: 'Programme', sortable: true, width: 130, align: 'center' },
      { key: 'description', label: 'Description', sortable: true },
    ],
    [],
  )

  const headerActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        {/* ===================== A) HEADER ACTION CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>REGULATION SETUP</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add Batch" icon="add" color="info" onClick={onAddBatch} />
              <ArpButton label="Add Regulation" icon="add" color="purple" onClick={onAddRegulation} />
            </div>
          </CCardHeader>
        </CCard>

        {/* ===================== B) FORM CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>
              {mode === 'BATCH' ? 'Batch Configuration' : mode === 'REG' ? 'Regulation Configuration' : 'Configuration'}
            </strong>
          </CCardHeader>

          <CCardBody>
            {!mode ? (
              <div className="text-medium-emphasis">
                Click <strong>Add Batch</strong> or <strong>Add Regulation</strong> to begin.
              </div>
            ) : (
              <CForm onSubmit={onSave}>
                <CRow className="g-3">
                  {/* ================= BATCH FORM ================= */}
                  {isBatchMode && (
                    <>
                      <CCol md={3}>
                        <CFormLabel>Name of the Batch</CFormLabel>
                      </CCol>
                      <CCol md={9}>
                        <CFormInput value={batchForm.batchName} onChange={onBatchChange('batchName')} disabled={!isEdit} />
                      </CCol>

                      <CCol md={3}>
                        <CFormLabel>Description</CFormLabel>
                      </CCol>
                      <CCol md={9}>
                        <CFormTextarea
                          rows={5}
                          value={batchForm.description}
                          onChange={onBatchChange('description')}
                          disabled={!isEdit}
                        />
                      </CCol>
                    </>
                  )}

                  {/* ================= REGULATION FORM ================= */}
                  {isRegMode && (
                    <>
                      <CCol md={3}>
                        <CFormLabel>Regulation Code</CFormLabel>
                      </CCol>
                      <CCol md={3}>
                        <CFormInput
                          value={regForm.regulationCode}
                          onChange={onRegChange('regulationCode')}
                          disabled={!isEdit}
                        />
                      </CCol>

                      <CCol md={3}>
                        <CFormLabel>Year of Regulation</CFormLabel>
                      </CCol>
                      <CCol md={3}>
                        <CFormSelect
                          value={regForm.regulationYear}
                          onChange={onRegChange('regulationYear')}
                          disabled={!isEdit}
                        >
                          <option value="">Select</option>
                          <option value="2025 - 2026">2025 - 2026</option>
                          <option value="2026 - 2027">2026 - 2027</option>
                        </CFormSelect>
                      </CCol>

                      <CCol md={3}>
                        <CFormLabel>Programme Code</CFormLabel>
                      </CCol>
                      <CCol md={3}>
                        <CFormSelect
                          value={regForm.programmeCode}
                          onChange={onRegChange('programmeCode')}
                          disabled={!isEdit}
                        >
                          <option value="">Select</option>
                          <option value="26-MBA">26-MBA</option>
                          <option value="26-MCA">26-MCA</option>
                        </CFormSelect>
                      </CCol>

                      <CCol md={3}>
                        <CFormLabel>Description</CFormLabel>
                      </CCol>
                      <CCol md={3}>
                        <CFormTextarea
                          rows={2}
                          value={regForm.description}
                          onChange={onRegChange('description')}
                          disabled={!isEdit}
                        />
                      </CCol>
                    </>
                  )}

                  {/* ================= BUTTONS (ARP) ================= */}
                  <CCol xs={12} className="d-flex justify-content-end gap-2">
                    {isEdit && <ArpButton label={editingId ? 'Update' : 'Save'} icon="save" color="success" type="submit" />}
                    <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                  </CCol>
                </CRow>
              </CForm>
            )}
          </CCardBody>
        </CCard>

        {/* ===================== C) TABLE CARD (ArpDataTable) ===================== */}
        <ArpDataTable
          title="REGULATION DETAILS"
          rows={rows}
          columns={columns}
          loading={false}
          headerActions={headerActions}
          selection={{
            type: 'radio',
            selected: selectedId,
            onChange: (value) => setSelectedId(value),
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
      </CCol>
    </CRow>
  )
}
