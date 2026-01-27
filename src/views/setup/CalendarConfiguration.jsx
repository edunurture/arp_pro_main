import React, { useMemo, useRef, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * CalendarConfiguration.jsx (ARP CoreUI React Pro Standard)
 * - Strict 3-card layout: Header Action Card + Form Card + Table Card (ArpDataTable)
 * - Uses ArpDataTable for Search + Page Size + Sorting + Pagination + Selection
 * - Removes manual search/pagination/safePage logic and ArpPagination usage
 * - No direct @coreui/icons imports (no CIcon/cilSearch)
 * - Preserves form fields and upload behavior
 * - Demo rows only. Hook API where indicated.
 */

const initialForm = {
  academicYear: '',
  semesterPattern: '',
  status: 'Calendar Data Not Uploaded',
}

export default function CalendarConfiguration() {
  // ARP mandatory state pattern
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)

  const fileRef = useRef(null)

  // Demo rows (replace with API later)
  const [rows, setRows] = useState([
    { id: 1, academicYear: '2025 - 26', semesterPattern: 'Odd', uploadedOn: '2025-06-10', status: 'Uploaded' },
    { id: 2, academicYear: '2025 - 26', semesterPattern: 'Even', uploadedOn: '2025-12-05', status: 'Uploaded' },
  ])

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setIsEdit(true)
    setSelectedId(null)
    setForm(initialForm)
  }

  const onCancel = () => {
    setIsEdit(false)
    setForm(initialForm)
  }

  const onUploadClick = () => fileRef.current?.click()

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Hook upload handler here
    // Example: uploadCalendar(file, form).then(refresh)
    setForm((p) => ({ ...p, status: 'File Selected' }))
    e.target.value = ''
  }

  const onSave = () => {
    if (!isEdit) return
    // Hook save handler here
    // For demo: mark status and exit edit mode
    setForm((p) => ({ ...p, status: 'Calendar Data Uploaded' }))
    setIsEdit(false)
  }

  /* =========================
     TABLE ACTIONS
  ========================== */

  const selectedRow = rows.find((r) => String(r.id) === String(selectedId)) || null

  const onView = () => {
    if (!selectedRow) return
    alert(
      `Academic Year: ${selectedRow.academicYear}\nSemester Pattern: ${selectedRow.semesterPattern}\nUploaded On: ${selectedRow.uploadedOn}\nStatus: ${selectedRow.status}`,
    )
  }

  const onEdit = () => {
    if (!selectedRow) return
    setIsEdit(true)
    setForm((p) => ({
      ...p,
      academicYear: selectedRow.academicYear ?? '',
      semesterPattern: selectedRow.semesterPattern ?? '',
      status: selectedRow.status ?? 'Uploaded',
    }))
  }

  const onDelete = () => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to delete this calendar upload record?')
    if (!ok) return
    // Hook API delete here
    setRows((prev) => prev.filter((r) => String(r.id) !== String(selectedRow.id)))
    setSelectedId(null)
  }

  /* =========================
     ArpDataTable CONFIG
  ========================== */

  const columns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true, width: 140, align: 'center' },
      { key: 'semesterPattern', label: 'Semester Pattern', sortable: true, width: 150, align: 'center' },
      { key: 'uploadedOn', label: 'Uploaded On', sortable: true, width: 150, align: 'center' },
      { key: 'status', label: 'Status', sortable: true, width: 140, align: 'center' },
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
            <strong>CALENDAR CONFIGURATION</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="Download Template" icon="download" color="danger" href="/templates/ARP_T07_Calendar_Template.xlsx" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ===================== B) FORM CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Calendar Data to be Upload for</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYear} onChange={onChange('academicYear')} disabled={!isEdit}>
                    <option value="">Select Academic Year</option>
                    <option>2025 - 26</option>
                    <option>2026 - 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Semester Pattern</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semesterPattern} onChange={onChange('semesterPattern')} disabled={!isEdit}>
                    <option value="">Select Semester Pattern</option>
                    <option>Odd</option>
                    <option>Even</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Status</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.status} disabled />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Upload Calendar Data</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center gap-2">
                  <ArpButton
                    label="Upload Calendar Data"
                    icon="upload"
                    color="primary"
                    onClick={onUploadClick}
                    disabled={!isEdit}
                  />
                  <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onFileChange} />
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Save" icon="save" color="success" type="button" onClick={onSave} disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ===================== C) TABLE CARD (ArpDataTable) ===================== */}
        <ArpDataTable
          title="CALENDAR DETAILS"
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
            name: 'calendarSelect',
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
