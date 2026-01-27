import React, { useMemo, useRef, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * StudentConfiguration.jsx (ARP CoreUI React Pro Standard)
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
  programmeCode: '',
  programme: '',
  semester: '',
  batch: '',
  className: '',
  classLabel: '',
}

export default function StudentConfiguration() {
  // ARP mandatory state pattern
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)

  const fileRef = useRef(null)

  const [rows, setRows] = useState([
    {
      id: 1,
      programmeCode: 'MCA',
      programme: 'Master of Computer Applications',
      semester: 'Sem-1',
      batch: '2025-26',
      regNo: 'REG001',
      name: 'Student One',
      className: 'I - MCA',
      label: 'A',
    },
    {
      id: 2,
      programmeCode: 'MBA',
      programme: 'Master of Business Administration',
      semester: 'Sem-1',
      batch: '2025-26',
      regNo: 'REG002',
      name: 'Student Two',
      className: 'I - MBA',
      label: 'B',
    },
  ])

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setIsEdit(true)
    setForm(initialForm)
    setSelectedId(null)
  }

  const onCancel = () => {
    setIsEdit(false)
    setForm(initialForm)
  }

  const onUploadClick = () => fileRef.current?.click()

  const onFileChange = (e) => {
    if (e.target.files?.length) {
      // Hook upload handler here
      // console.log('Selected file:', e.target.files[0].name)
      e.target.value = ''
    }
  }

  const onSave = () => {
    // Hook "save mapping / upload meta" handler here
    // For now, just disable edit and keep form reset behavior consistent
    setIsEdit(false)
    // If you want to clear form after save:
    // setForm(initialForm)
  }

  /* =========================
     TABLE ACTIONS
  ========================== */

  const selectedRow = rows.find((r) => String(r.id) === String(selectedId)) || null

  const onView = () => {
    if (!selectedRow) return
    alert(
      `Reg No: ${selectedRow.regNo}\nName: ${selectedRow.name}\nProgramme: ${selectedRow.programmeCode} - ${selectedRow.programme}\nSemester: ${selectedRow.semester}\nBatch: ${selectedRow.batch}\nClass: ${selectedRow.className}\nLabel: ${selectedRow.label}`,
    )
  }

  const onEdit = () => {
    if (!selectedRow) return
    // Hook edit logic here (open edit modal/page)
  }

  const onDelete = () => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to delete this student record?')
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
      { key: 'programmeCode', label: 'Programme Code', sortable: true, width: 140, align: 'center' },
      { key: 'programme', label: 'Programme', sortable: true, width: 260 },
      { key: 'semester', label: 'Semester', sortable: true, width: 110, align: 'center' },
      { key: 'batch', label: 'Batch', sortable: true, width: 120, align: 'center' },
      { key: 'regNo', label: 'Reg. No', sortable: true, width: 140, align: 'center' },
      { key: 'name', label: 'Name', sortable: true, width: 220 },
      { key: 'className', label: 'Class', sortable: true, width: 140, align: 'center' },
      { key: 'label', label: 'Label', sortable: true, width: 110, align: 'center' },
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
            <strong>STUDENTS CONFIGURATION</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton
                label="Download Template"
                icon="download"
                color="danger"
                href="/templates/ARP_T05_Student_Template.xlsx"
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* ===================== B) FORM CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Students Data to be Upload for</strong>
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
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeCode} onChange={onChange('programmeCode')} disabled={!isEdit}>
                    <option value="">Select Programme Code</option>
                    <option>N26MBA</option>
                    <option>N27MCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.programme} disabled />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')} disabled={!isEdit}>
                    <option value="">Select Semester</option>
                    <option>Sem-1</option>
                    <option>Sem-3</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Batch</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.batch} onChange={onChange('batch')} disabled={!isEdit}>
                    <option value="">Select Batch</option>
                    <option>2025 - 26</option>
                    <option>2026 - 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Class</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.className} onChange={onChange('className')} disabled={!isEdit}>
                    <option value="">Select Class</option>
                    <option>I - MBA</option>
                    <option>I - MCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Class Label</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.classLabel} onChange={onChange('classLabel')} disabled={!isEdit}>
                    <option value="">Select Section</option>
                    <option>A</option>
                    <option>B</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Upload Student Data Table</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center gap-2">
                  <ArpButton
                    label="Upload Student Data"
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
            name: 'studentSelect',
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
