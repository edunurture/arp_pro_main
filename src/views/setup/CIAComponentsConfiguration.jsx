import React, { useMemo, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormCheck, CFormInput, CFormLabel, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * CIAComponentsConfiguration.jsx (ARP CoreUI React Pro Standard) - Updated based on cia_components.html
 *
 * Matches HTML layout/behavior:
 * - Top header title: "Continuous Internal Assessment (CIA) Configurations"
 * - Header actions: Add New + Download Template
 * - Form Card 1: "Add Internal Examination Components" with dynamic rows:
 *     Component Id | Examination Type | Name of the Examination | Action(+ / -)
 *   - Only last row shows "+"; previous rows show "delete" (ARP-safe)
 * - Form Card 2: "Add Computation Values" with switches (checkboxes)
 * - Save / Cancel aligned right
 * - Bottom list: "Student Details" represented via ArpDataTable with search + circle icon actions
 *
 * ARP rules preserved:
 * - No direct @coreui/icons imports
 * - No ArpPagination/manual search logic in module
 */

const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`

const createExamRow = (overrides = {}) => ({
  id: uid(),
  componentId: '',
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

export default function CIAComponentsConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // Dynamic Internal Examination Components
  const [examRows, setExamRows] = useState([createExamRow()])

  // Computation switches
  const [compute, setCompute] = useState(initialCompute)

  // Demo list rows (the HTML calls this "Student Details" table)
  const [rows, setRows] = useState([
    {
      id: 1,
      programCode: 'MCA',
      programme: 'Master of Computer Applications',
      semester: '2016',
      batch: 'Yes',
      regNo: 'XXX - XXX',
      name: 'XXX - XXX',
      className: 'XXX - XXX',
      label: 'XXX - XXX',
    },
    {
      id: 2,
      programCode: 'M.Com',
      programme: 'Master of Commerce',
      semester: '2016',
      batch: 'No',
      regNo: 'XXX - XXX',
      name: 'XXX - XXX',
      className: 'XXX - XXX',
      label: 'XXX - XXX',
    },
  ])

  /* =========================
     Dynamic row handlers (HTML add-row / remove-row)
  ========================== */

  const addRowAfter = (index) => {
    setExamRows((prev) => {
      const next = [...prev]
      next.splice(index + 1, 0, createExamRow())
      return next
    })
  }

  const removeRowAt = (index) => {
    setExamRows((prev) => {
      if (prev.length <= 1) return prev
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }

  const updateExamRow = (id, key, value) => {
    setExamRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  }

  const resetForm = () => {
    setExamRows([createExamRow()])
    setCompute(initialCompute)
  }

  /* =========================
     Header actions
  ========================== */

  const onAddNew = () => {
    setIsEdit(true)
    resetForm()
  }

  const onCancel = () => {
    setIsEdit(false)
    resetForm()
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!isEdit) return

    // Minimal validation: at least one row with something typed
    const hasAny = examRows.some((r) => r.componentId || r.examType || r.examName)
    if (!hasAny) {
      alert('Please enter at least one Internal Examination Component.')
      return
    }

    // Hook API save here (components + compute)
    setIsEdit(false)
    alert('Saved successfully (demo).')
    resetForm()
  }

  /* =========================
     List (ArpDataTable) actions
  ========================== */

  const selectedRow = rows.find((r) => String(r.id) === String(selectedId)) || null

  const onView = () => {
    if (!selectedRow) return
    alert(
      `Programme: ${selectedRow.programme}\nReg. No.: ${selectedRow.regNo}\nName: ${selectedRow.name}\nSemester: ${selectedRow.semester}`,
    )
  }

  const onEdit = () => {
    if (!selectedRow) return
    alert('Edit clicked (demo).')
  }

  const onDelete = () => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to delete this record?')
    if (!ok) return
    setRows((prev) => prev.filter((r) => String(r.id) !== String(selectedRow.id)))
    setSelectedId(null)
  }

  /* =========================
     ArpDataTable config (matches HTML "Student Details")
  ========================== */

  const columns = useMemo(
    () => [
      { key: 'programCode', label: 'Program Code', sortable: true, width: 140, align: 'center' },
      { key: 'programme', label: 'Programme', sortable: true },
      { key: 'semester', label: 'Semester', sortable: true, width: 120, align: 'center' },
      { key: 'batch', label: 'Batch', sortable: true, width: 110, align: 'center' },
      { key: 'regNo', label: 'Reg. No.', sortable: true, width: 160, align: 'center' },
      { key: 'name', label: 'Name', sortable: true, width: 160 },
      { key: 'className', label: 'Class', sortable: true, width: 140, align: 'center' },
      { key: 'label', label: 'Label', sortable: true, width: 140, align: 'center' },
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
            <strong>Continuous Internal Assessment (CIA) Configurations</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton
                label="Download Template"
                icon="download"
                color="danger"
                href="/assets/templates/ARP_T10_CIA_Component_Template.xlsx"
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* ===================== B1) FORM CARD - INTERNAL EXAM COMPONENTS ===================== */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Add Internal Examination Components</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: 220 }}>Component Id</th>
                      <th style={{ width: 260 }}>Examination Type</th>
                      <th>Name of the Examination</th>
                      <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examRows.map((r, idx) => {
                      const isLast = idx === examRows.length - 1
                      const icon = isLast ? 'add' : 'delete'
                      const color = isLast ? 'success' : 'danger'
                      const title = isLast ? 'Add Row' : 'Remove Row'
                      const onClick = isLast ? () => addRowAfter(idx) : () => removeRowAt(idx)

                      return (
                        <tr key={r.id}>
                          <td>
                            <CFormInput
                              value={r.componentId}
                              onChange={(e) => updateExamRow(r.id, 'componentId', e.target.value)}
                              disabled={!isEdit}
                              placeholder="Component Id"
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
                            <ArpIconButton
                              icon={icon}
                              color={color}
                              title={title}
                              onClick={onClick}
                              disabled={!isEdit || (!isLast && examRows.length <= 1)}
                            />
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

        {/* ===================== B2) FORM CARD - COMPUTATION VALUES ===================== */}
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
                  <CFormCheck checked={compute.total} onChange={(e) => setCompute((p) => ({ ...p, total: e.target.checked }))} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Best of Two</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center">
                  <CFormCheck checked={compute.bestOfTwo} onChange={(e) => setCompute((p) => ({ ...p, bestOfTwo: e.target.checked }))} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Best of Three</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center">
                  <CFormCheck checked={compute.bestOfThree} onChange={(e) => setCompute((p) => ({ ...p, bestOfThree: e.target.checked }))} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Average</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center">
                  <CFormCheck checked={compute.average} onChange={(e) => setCompute((p) => ({ ...p, average: e.target.checked }))} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Convert Into</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center">
                  <CFormCheck checked={compute.convertInto} onChange={(e) => setCompute((p) => ({ ...p, convertInto: e.target.checked }))} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Round Off</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center">
                  <CFormCheck checked={compute.roundOff} onChange={(e) => setCompute((p) => ({ ...p, roundOff: e.target.checked }))} disabled={!isEdit} />
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

        {/* ===================== C) TABLE CARD (ArpDataTable) ===================== */}
        <ArpDataTable
          title="STUDENT DETAILS"
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
            name: 'ciaStudentSelect',
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
