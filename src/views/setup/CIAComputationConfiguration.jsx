import React, { useMemo, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * CIAComputationConfiguration.jsx (ARP CoreUI React Pro Standard)
 * Updated to match cia_computation.html UI/behavior:
 * - Header title: "CIA Computation" + Add New
 * - Form card title: "CIA Computation Code Generate for"
 * - Inputs: Academic Year (select), CIA Assessment Code (text)
 * - Dynamic table: CAC Index (A, B, C...), Examination (select), Min/Max (integer, allow negatives)
 *   - Last row shows "+" (add); previous rows show delete (equivalent to "-" in HTML)
 *   - CAC Index is auto re-indexed after add/delete
 * - Fields are disabled until Add New is clicked
 * - Bottom list: "Computation Codes" using ArpDataTable with Search + circle action icons
 *
 * ARP rules preserved:
 * - No direct @coreui/icons imports
 * - No ArpPagination/manual search/paging in this module
 */

const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`

const letterIndex = (i) => String.fromCharCode(65 + i) // A, B, C...

const sanitizeInt = (value) => {
  // Keep digits and a single leading '-'
  const v = String(value ?? '')
    .replace(/[^\d-]/g, '')
    .replace(/(?!^)-/g, '')
  return v
}

const createRow = (overrides = {}) => ({
  id: uid(),
  examination: '',
  minMarks: '0',
  maxMarks: '0',
  ...overrides,
})

export default function CIAComputationConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // Form header inputs
  const [academicYear, setAcademicYear] = useState('')
  const [ciaAssessmentCode, setCiaAssessmentCode] = useState('')

  // Dynamic CAC rows
  const [cacRows, setCacRows] = useState([createRow()])

  // Demo list rows (replace with API)
  const [rows, setRows] = useState([
    { id: 1, academicYear: '2025 - 26', ciaAssessmentCode: 'CAC-001', exams: 2, status: 'Active' },
    { id: 2, academicYear: '2026 - 27', ciaAssessmentCode: 'CAC-002', exams: 3, status: 'Active' },
  ])

  /* =========================
     Dynamic table handlers
  ========================== */

  const addRowAfter = (index) => {
    setCacRows((prev) => {
      const next = [...prev]
      next.splice(index + 1, 0, createRow())
      return next
    })
  }

  const removeRowAt = (index) => {
    setCacRows((prev) => {
      if (prev.length <= 1) return prev
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }

  const updateRow = (id, key, value) => {
    setCacRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  }

  const resetForm = () => {
    setAcademicYear('')
    setCiaAssessmentCode('')
    setCacRows([createRow()])
  }

  /* =========================
     Header / Form actions
  ========================== */

  const onAddNew = () => {
    setIsEdit(true)
    setSelectedId(null)
    resetForm()
  }

  const onCancel = () => {
    setIsEdit(false)
    resetForm()
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!isEdit) return

    if (!academicYear || !ciaAssessmentCode) {
      alert('Please select Academic Year and enter CIA Assessment Code.')
      return
    }

    // Optional: minimal row validation
    const hasAnyExam = cacRows.some((r) => r.examination)
    if (!hasAnyExam) {
      alert('Please select at least one Examination.')
      return
    }

    const next = {
      id: selectedId ?? Date.now(),
      academicYear,
      ciaAssessmentCode,
      exams: cacRows.length,
      status: 'Active',
    }

    // Hook API save here
    setRows((prev) => {
      const exists = prev.some((r) => String(r.id) === String(next.id))
      return exists ? prev.map((r) => (String(r.id) === String(next.id) ? next : r)) : [next, ...prev]
    })

    setSelectedId(next.id)
    setIsEdit(false)
    resetForm()
  }

  /* =========================
     List actions (ArpDataTable)
  ========================== */

  const selectedRow = rows.find((r) => String(r.id) === String(selectedId)) || null

  const onView = () => {
    if (!selectedRow) return
    alert(
      `Academic Year: ${selectedRow.academicYear}\nCIA Assessment Code: ${selectedRow.ciaAssessmentCode}\nNo. of Exams: ${selectedRow.exams}\nStatus: ${selectedRow.status}`,
    )
  }

  const onEdit = () => {
    if (!selectedRow) return
    // Hook API load details here
    setIsEdit(true)
    setAcademicYear(selectedRow.academicYear || '')
    setCiaAssessmentCode(selectedRow.ciaAssessmentCode || '')
    setCacRows(Array.from({ length: Math.max(1, Number(selectedRow.exams || 1)) }, () => createRow()))
  }

  const onDelete = () => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to delete this computation code?')
    if (!ok) return
    // Hook API delete here
    setRows((prev) => prev.filter((r) => String(r.id) !== String(selectedRow.id)))
    setSelectedId(null)
  }

  /* =========================
     ArpDataTable config
  ========================== */

  const columns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true, width: 160, align: 'center' },
      { key: 'ciaAssessmentCode', label: 'CIA Assessment Code', sortable: true, width: 190, align: 'center' },
      { key: 'exams', label: 'No. of Exams', sortable: true, width: 130, align: 'center', sortType: 'number' },
      { key: 'status', label: 'Status', sortable: true, width: 120, align: 'center' },
    ],
    [],
  )

  const headerActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View Record" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" title="Edit Record" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" title="Delete Record" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        {/* ===================== A) HEADER ACTION CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>CIA Computation</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
            </div>
          </CCardHeader>
        </CCard>

        {/* ===================== B) FORM CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>CIA Computation Code Generate for</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} disabled={!isEdit}>
                    <option value="">Select Academic Year</option>
                    <option value="2025 - 26">2025 - 26</option>
                    <option value="2026 - 27">2026 - 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>CIA Assessment Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={ciaAssessmentCode} onChange={(e) => setCiaAssessmentCode(e.target.value)} disabled={!isEdit} />
                </CCol>

                {/* Dynamic Table */}
                <CCol xs={12} className="mt-2">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle mb-2" id="dynamicTable">
                      <thead>
                        <tr>
                          <th style={{ width: 120, textAlign: 'center' }}>CAC Index</th>
                          <th>Name of the Examination</th>
                          <th style={{ width: 180, textAlign: 'center' }}>Minimum Marks</th>
                          <th style={{ width: 180, textAlign: 'center' }}>Maximum Marks</th>
                          <th style={{ width: 90, textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cacRows.map((r, idx) => {
                          const isLast = idx === cacRows.length - 1
                          const icon = isLast ? 'add' : 'delete'
                          const color = isLast ? 'success' : 'danger'
                          const title = isLast ? 'Add Row' : 'Remove Row'
                          const onClick = isLast ? () => addRowAfter(idx) : () => removeRowAt(idx)

                          return (
                            <tr key={r.id}>
                              <td className="text-center">
                                <strong>{letterIndex(idx)}</strong>
                              </td>

                              <td>
                                <CFormSelect
                                  value={r.examination}
                                  onChange={(e) => updateRow(r.id, 'examination', e.target.value)}
                                  disabled={!isEdit}
                                >
                                  <option value="">Select Examination</option>
                                  <option value="CIA Test - 1">CIA Test - 1</option>
                                  <option value="CIA Test - 2">CIA Test - 2</option>
                                  <option value="CIA Test - 3">CIA Test - 3</option>
                                </CFormSelect>
                              </td>

                              <td>
                                <CFormInput
                                  type="number"
                                  step="1"
                                  inputMode="numeric"
                                  pattern="-?\d*"
                                  value={r.minMarks}
                                  onChange={(e) => updateRow(r.id, 'minMarks', sanitizeInt(e.target.value))}
                                  disabled={!isEdit}
                                />
                              </td>

                              <td>
                                <CFormInput
                                  type="number"
                                  step="1"
                                  inputMode="numeric"
                                  pattern="-?\d*"
                                  value={r.maxMarks}
                                  onChange={(e) => updateRow(r.id, 'maxMarks', sanitizeInt(e.target.value))}
                                  disabled={!isEdit}
                                />
                              </td>

                              <td className="text-center">
                                <ArpIconButton icon={icon} color={color} title={title} onClick={onClick} disabled={!isEdit || (!isLast && cacRows.length <= 1)} />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CCol>

                {/* Buttons */}
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ===================== C) LIST CARD (ArpDataTable) ===================== */}
        <ArpDataTable
          title="COMPUTATION CODES"
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
            name: 'ciaComputationSelect',
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
