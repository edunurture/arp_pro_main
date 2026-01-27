import React, { useMemo, useRef, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * AssessmentSetupConfiguration.jsx (ARP CoreUI React Pro Standard)
 * Converted from assessment_setup.html and updated to ARP standards:
 * - 3-card layout (Header → Form → Table)
 * - Add New enables form fields
 * - Upload Assessment Code via hidden file input
 * - Status auto-updates on file select
 * - Uses ArpDataTable (Search + Page Size + Sorting + Pagination + Selection)
 * - No direct @coreui/icons imports (no CIcon/cilSearch)
 * - No ArpPagination/manual pagination/search logic
 */

const initialForm = {
  academicYear: '',
  semesterPattern: 'Odd',
  programmeCode: '',
  programme: '',
  status: 'Assessment Code Not Uploaded',
}

const programmeMap = {
  N26MBA: 'Master of Business Administration',
  N27MCA: 'Master of Computer Applications',
}

export default function AssessmentSetupConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState(initialForm)

  const [selectedId, setSelectedId] = useState(null)

  const fileRef = useRef(null)

  // Demo list rows (replace with API)
  const [rows, setRows] = useState([
    {
      id: 1,
      programmeCode: 'MCA',
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
      programmeCode: 'M.Com',
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
     Header / Form actions
  ========================== */

  const onAddNew = () => {
    setIsEdit(true)
    setForm(initialForm)
    setSelectedId(null)
  }

  const onCancel = () => {
    setIsEdit(false)
    setForm(initialForm)
  }

  const onChange = (key) => (e) => {
    const value = e.target.value
    setForm((p) => {
      if (key === 'programmeCode') {
        return {
          ...p,
          programmeCode: value,
          programme: programmeMap[value] || '',
        }
      }
      return { ...p, [key]: value }
    })
  }

  const onUploadClick = () => fileRef.current?.click()

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setForm((p) => ({ ...p, status: 'Assessment Code Uploaded' }))
    } else {
      setForm((p) => ({ ...p, status: 'Assessment Code Not Uploaded' }))
    }
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!isEdit) return

    if (!form.academicYear || !form.programmeCode) {
      alert('Please select Academic Year and Programme Code.')
      return
    }
    if (form.status !== 'Assessment Code Uploaded') {
      alert('Please upload Assessment Code file before saving.')
      return
    }

    // Hook API save here (form + file)
    alert('Saved successfully (demo).')
    setIsEdit(false)
    setForm(initialForm)
  }

  /* =========================
     List actions (ArpDataTable)
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
    // Hook API load details here
    alert('Edit clicked (demo).')
  }

  const onDelete = () => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to delete this record?')
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
      { key: 'programmeCode', label: 'Program Code', sortable: true, width: 140, align: 'center' },
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
    <div className="d-flex gap-2 flex-nowrap align-items-center">
      <ArpIconButton icon="view" color="purple" title="View Record" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" title="Edit Record" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" title="Delete Record" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>CIA ASSESSMENT CODE SETUP</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton
                label="Download Template"
                icon="download"
                color="danger"
                href="/assets/datatemplates/Data_Template1.xlsx"
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Continuous Internal Assessment Code Upload for</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYear} onChange={onChange('academicYear')} disabled={!isEdit}>
                    <option value="">Select Academic Year</option>
                    <option value="2025-26">2025-26</option>
                    <option value="2026-27">2026-27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Semester Pattern</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semesterPattern} onChange={onChange('semesterPattern')} disabled={!isEdit}>
                    <option value="Odd">Odd</option>
                    <option value="Even">Even</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeCode} onChange={onChange('programmeCode')} disabled={!isEdit}>
                    <option value="">Select Programme Code</option>
                    <option value="N26MBA">N26MBA</option>
                    <option value="N27MCA">N27MCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.programme || '-'} disabled />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Upload Assessment Codes</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <ArpButton
                    label="Upload Assessment Code"
                    icon="upload"
                    color="primary"
                    onClick={onUploadClick}
                    disabled={!isEdit}
                  />
                  <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onFileChange} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Status</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.status} disabled />
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD (ArpDataTable) ================= */}
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
            name: 'assessSel',
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
