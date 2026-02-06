import React, { useMemo, useRef, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton, ArpDataTable } from '../../components/common'

const initialForm = {
  manualId: '',
  institutionCategory: '',
  manualDescription: '',
  monthYear: '',

  numCriteria: '',
  numKeyIndicators: '',
  numQlms: '',
  numQnms: '',

  totalMetrics: '',
  totalWeightages: '',
  totalMarks: '',
  optionalMetrics: '',
}

const INST_CATEGORIES = [
  'University',
  'Arts & Science College',
  'Engineering College',
  'Health Science Institutions',
  'Deemed to be University',
  'Polytechnic',
  'ITI',
  'School',
  'Others',
]

const fmtMonthYear = (v) => {
  // input type=month => YYYY-MM
  if (!v) return ''
  const parts = String(v).split('-')
  if (parts.length !== 2) return v
  return `${parts[1]}/${parts[0]}`
}

export default function AddManual() {
  const tableRef = useRef(null)

  // ARP State pattern (mandatory)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)

  // Demo rows (replace with API later)
  const [rows, setRows] = useState([])
  const loading = false

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const scrollToTable = () => {
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const validateForm = () => {
    const requiredKeys = [
      'manualId',
      'institutionCategory',
      'manualDescription',
      'monthYear',
      'numCriteria',
      'numKeyIndicators',
      'numQlms',
      'numQnms',
      'totalMetrics',
      'totalWeightages',
      'totalMarks',
      'optionalMetrics',
    ]
    for (const k of requiredKeys) {
      if (!String(form[k] ?? '').trim()) return false
    }
    return true
  }

  const getSelectedRow = () => rows.find((r) => r.id === selectedId)

  const onAddNew = () => {
    setForm(initialForm)
    setSelectedId(null)
    setIsEdit(true)
  }

  const onHeaderView = () => {
    // Header View button: jump to table card (details)
    scrollToTable()
  }

  const onCancel = () => {
    // ARP rule: Cancel restores previous selected row OR resets initialForm
    const r = getSelectedRow()
    if (r) {
      setForm((p) => ({
        ...p,
        manualId: r.manualId || '',
        institutionCategory: r.institutionCategory || '',
        manualDescription: r.manualDescription || '',
        monthYear: r.monthYear || '',

        numCriteria: r.totalCriterias || '',
        totalMetrics: r.totalMetrics || '',
        totalWeightages: r.totalWeightages || '',
      }))
      setIsEdit(false)
      return
    }

    setForm(initialForm)
    setSelectedId(null)
    setIsEdit(false)
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const newRow = {
      id: String(form.manualId).trim(),
      manualId: String(form.manualId).trim(),
      institutionCategory: String(form.institutionCategory || ''),
      manualDescription: String(form.manualDescription || ''),
      monthYear: String(form.monthYear || ''),
      monthYearLabel: fmtMonthYear(form.monthYear),

      totalCriterias: String(form.numCriteria || ''),
      totalMetrics: String(form.totalMetrics || ''),
      totalWeightages: String(form.totalWeightages || ''),
    }

    // Upsert by id
    setRows((prev) => {
      const exists = prev.some((x) => x.id === newRow.id)
      const next = exists ? prev.map((x) => (x.id === newRow.id ? newRow : x)) : [newRow, ...prev]
      return next
    })

    setSelectedId(newRow.id)
    setIsEdit(false)
    scrollToTable()
  }

  const onView = () => {
    const r = getSelectedRow()
    if (!r) return

    setForm((p) => ({
      ...p,
      manualId: r.manualId || '',
      institutionCategory: r.institutionCategory || '',
      manualDescription: r.manualDescription || '',
      monthYear: r.monthYear || '',

      // Map back to form fields (keep other fields untouched)
      numCriteria: r.totalCriterias || p.numCriteria,
      totalMetrics: r.totalMetrics || p.totalMetrics,
      totalWeightages: r.totalWeightages || p.totalWeightages,
    }))
    setIsEdit(false)
  }

  const onEdit = () => {
    const r = getSelectedRow()
    if (!r) return

    setForm((p) => ({
      ...p,
      manualId: r.manualId || '',
      institutionCategory: r.institutionCategory || '',
      manualDescription: r.manualDescription || '',
      monthYear: r.monthYear || '',

      numCriteria: r.totalCriterias || p.numCriteria,
      totalMetrics: r.totalMetrics || p.totalMetrics,
      totalWeightages: r.totalWeightages || p.totalWeightages,
    }))
    setIsEdit(true)
  }

  const onDelete = () => {
    if (!selectedId) return
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== selectedId)
      const nextSelected = next[0]?.id ?? null
      setSelectedId(nextSelected)
      return next
    })
  }

  const columns = useMemo(
    () => [
      { key: 'manualId', label: 'Manual ID', sortable: true, width: 140 },
      { key: 'institutionCategory', label: 'Institution Category', sortable: true, width: 220 },
      { key: 'monthYearLabel', label: 'Month & Year', sortable: true, width: 140, align: 'center' },
      { key: 'totalMetrics', label: 'Total Metrics', sortable: true, width: 140, align: 'center', sortType: 'number' },
      { key: 'totalCriterias', label: 'Total Criterias', sortable: true, width: 150, align: 'center', sortType: 'number' },
      { key: 'totalWeightages', label: 'Total Weightages', sortable: true, width: 170, align: 'center', sortType: 'number' },
      { key: 'manualDescription', label: 'Manual Description', sortable: true },
    ],
    [],
  )

  const tableActions = (
    <>
      <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
    </>
  )

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>ADD MANUAL</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton
                label="View"
                icon="view"
                color="primary"
                onClick={onHeaderView}
                disabled={rows.length === 0}
                title="View Added Manual Details"
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Add Manual</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={3}>
                  <CFormLabel>Manual ID</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.manualId}
                    onChange={onChange('manualId')}
                    disabled={!isEdit}
                    required
                    placeholder="Enter Manual ID"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Institution Category</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.institutionCategory}
                    onChange={onChange('institutionCategory')}
                    disabled={!isEdit}
                    required
                  >
                    <option value="">Select</option>
                    {INST_CATEGORIES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Manual Description</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.manualDescription}
                    onChange={onChange('manualDescription')}
                    disabled={!isEdit}
                    required
                    placeholder="Enter Manual Description"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Month &amp; Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput type="month" value={form.monthYear} onChange={onChange('monthYear')} disabled={!isEdit} required />
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Number of Criteria</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.numCriteria}
                    onChange={onChange('numCriteria')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Number of Key Indicators</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.numKeyIndicators}
                    onChange={onChange('numKeyIndicators')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                {/* Row 4 */}
                <CCol md={3}>
                  <CFormLabel>Number of QLMs</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.numQlms}
                    onChange={onChange('numQlms')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Number of QNMs</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.numQnms}
                    onChange={onChange('numQnms')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                {/* Row 5 */}
                <CCol md={3}>
                  <CFormLabel>Total Metrics</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.totalMetrics}
                    onChange={onChange('totalMetrics')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Total Weightages</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.totalWeightages}
                    onChange={onChange('totalWeightages')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                {/* Row 6 */}
                <CCol md={3}>
                  <CFormLabel>Total Marks</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.totalMarks}
                    onChange={onChange('totalMarks')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Optional Metrics</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.optionalMetrics} onChange={onChange('optionalMetrics')} disabled={!isEdit} required>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </CFormSelect>
                </CCol>

                {/* Save / Cancel (ARP rules) */}
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" title="Save" disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} title="Cancel" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD (ArpDataTable) ================= */}
        <div ref={tableRef}>
          <ArpDataTable
            title="Added Manual Details"
            rows={rows}
            columns={columns}
            loading={loading}
            headerActions={tableActions}
            selection={{
              type: 'radio',
              selected: selectedId,
              key: 'id',
              name: 'manualRow',
              headerLabel: 'Select',
              width: 60,
              onChange: (value) => setSelectedId(value),
            }}
            pageSizeOptions={[5, 10, 20, 50]}
            defaultPageSize={10}
            searchable
            searchPlaceholder="Search..."
            rowKey="id"
          />
        </div>
      </CCol>
    </CRow>
  )
}
