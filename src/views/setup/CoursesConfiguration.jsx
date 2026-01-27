import React, { useMemo, useRef, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * CoursesConfiguration.jsx (ARP CoreUI React Pro Standard)
 * - Strict 3-card layout: Header Action Card + Form Card + Table Card (ArpDataTable)
 * - Uses ArpDataTable for Search + Page Size + Sorting + Pagination + Selection
 * - No manual search/pagination logic inside the module
 * - No direct @coreui/icons imports
 * - Demo rows only. Hook API where indicated.
 */

const initialForm = {
  courseCode: '',
  courseTitle: '',
  department: '',
  programme: '',
  regulation: '',
  semester: '',
  courseType: '',
  courseCategory: '',
  credits: '',
  contactHours: '',
  status: 'Active',
}

export default function CoursesConfiguration() {
  // ARP mandatory state pattern
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)

  // Upload input ref
  const fileRef = useRef(null)

  // Template download URL (adjust to your actual public path)
  const TEMPLATE_URL = '/templates/ARP_T04_Courses_Template.xlsx'

  // Demo rows (replace with API later)
  const [rows, setRows] = useState([
    {
      id: 1,
      courseCode: 'CA6101',
      courseTitle: 'Data Structures',
      department: 'Computer Applications',
      programme: 'MCA',
      regulation: '2026',
      semester: 'Sem-1',
      courseType: 'Core',
      courseCategory: 'Theory',
      credits: 4,
      contactHours: 4,
      status: 'Active',
    },
    {
      id: 2,
      courseCode: 'CA6102',
      courseTitle: 'Database Management Systems',
      department: 'Computer Applications',
      programme: 'MCA',
      regulation: '2026',
      semester: 'Sem-1',
      courseType: 'Core',
      courseCategory: 'Theory',
      credits: 4,
      contactHours: 4,
      status: 'Active',
    },
  ])

  /* =========================
     FORM HANDLERS
  ========================== */

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const resetForm = () => setForm(initialForm)

  const onAddNew = () => {
    resetForm()
    setSelectedId(null)
    setIsEdit(true)
  }

  const loadSelectedToForm = () => {
    const selected = rows.find((r) => String(r.id) === String(selectedId))
    if (!selected) return false

    setForm({
      courseCode: selected.courseCode ?? '',
      courseTitle: selected.courseTitle ?? '',
      department: selected.department ?? '',
      programme: selected.programme ?? '',
      regulation: selected.regulation ?? '',
      semester: selected.semester ?? '',
      courseType: selected.courseType ?? '',
      courseCategory: selected.courseCategory ?? '',
      credits: selected.credits ?? '',
      contactHours: selected.contactHours ?? '',
      status: selected.status ?? 'Active',
    })

    return true
  }

  const onView = () => {
    if (!selectedId) return
    if (!loadSelectedToForm()) return
    setIsEdit(false)
  }

  const onEdit = () => {
    if (!selectedId) return
    if (!loadSelectedToForm()) return
    setIsEdit(true)
  }

  const onCancel = () => {
    setIsEdit(false)
    resetForm()
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!isEdit) return

    const newRow = {
      id: selectedId ?? Date.now(),
      courseCode: form.courseCode || '—',
      courseTitle: form.courseTitle || '—',
      department: form.department || '—',
      programme: form.programme || '—',
      regulation: form.regulation || '—',
      semester: form.semester || '—',
      courseType: form.courseType || '—',
      courseCategory: form.courseCategory || '—',
      credits: form.credits === '' ? '—' : Number(form.credits),
      contactHours: form.contactHours === '' ? '—' : Number(form.contactHours),
      status: form.status || 'Active',
    }

    // Hook your API save here
    setRows((prev) => {
      const exists = prev.some((r) => String(r.id) === String(newRow.id))
      return exists ? prev.map((r) => (String(r.id) === String(newRow.id) ? newRow : r)) : [newRow, ...prev]
    })

    setSelectedId(newRow.id)
    setIsEdit(false)
    resetForm()
  }

  const onDelete = () => {
    if (!selectedId) return
    // Hook your API delete here
    setRows((prev) => prev.filter((r) => String(r.id) !== String(selectedId)))
    setSelectedId(null)
    setIsEdit(false)
    resetForm()
  }

  /* =========================
     UPLOAD / DOWNLOAD
  ========================== */

  const onUploadClick = () => fileRef.current?.click()

  const onFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Hook your upload handler here
    e.target.value = ''
  }

  const onDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = TEMPLATE_URL
    link.download = 'ARP_T04_Courses_Template.xlsx'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  /* =========================
     ArpDataTable CONFIG
  ========================== */

  const columns = useMemo(
    () => [
      { key: 'courseCode', label: 'Course Code', sortable: true, width: 140 },
      { key: 'courseTitle', label: 'Course Title', sortable: true },
      { key: 'department', label: 'Department', sortable: true, width: 200 },
      { key: 'programme', label: 'Programme', sortable: true, width: 120, align: 'center' },
      { key: 'regulation', label: 'Regulation', sortable: true, width: 120, align: 'center' },
      { key: 'semester', label: 'Semester', sortable: true, width: 110, align: 'center' },
      { key: 'courseType', label: 'Type', sortable: true, width: 110, align: 'center' },
      { key: 'courseCategory', label: 'Category', sortable: true, width: 130, align: 'center' },
      { key: 'credits', label: 'Credits', sortable: true, width: 110, align: 'center', sortType: 'number' },
      { key: 'contactHours', label: 'Contact Hrs', sortable: true, width: 130, align: 'center', sortType: 'number' },
      { key: 'status', label: 'Status', sortable: true, width: 110, align: 'center' },
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
            <strong>COURSES SETUP</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton label="Upload" icon="upload" color="info" onClick={onUploadClick} title="Upload" />
              <ArpButton
                label="Download Template"
                icon="download"
                color="danger"
                onClick={onDownloadTemplate}
                title="Download Template"
              />
            </div>

            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onFileSelected} />
          </CCardHeader>
        </CCard>

        {/* ===================== B) FORM CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Course Configuration</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Course Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.courseCode} onChange={onChange('courseCode')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Course Title</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.courseTitle} onChange={onChange('courseTitle')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Select Department</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.department} onChange={onChange('department')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Management">Management</option>
                    <option value="Computer Applications">Computer Applications</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Select Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programme} onChange={onChange('programme')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="MBA">MBA</option>
                    <option value="MCA">MCA</option>
                    <option value="BCA">BCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Regulation Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.regulation} onChange={onChange('regulation')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Sem-1">Sem-1</option>
                    <option value="Sem-2">Sem-2</option>
                    <option value="Sem-3">Sem-3</option>
                    <option value="Sem-4">Sem-4</option>
                    <option value="Sem-5">Sem-5</option>
                    <option value="Sem-6">Sem-6</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Course Type</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.courseType} onChange={onChange('courseType')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="Allied">Allied</option>
                    <option value="Open Elective">Open Elective</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Course Category</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.courseCategory} onChange={onChange('courseCategory')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Theory">Theory</option>
                    <option value="Practical">Practical</option>
                    <option value="Project">Project</option>
                    <option value="Internship">Internship</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Credits</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.credits}
                    onChange={onChange('credits')}
                    disabled={!isEdit}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Contact Hours</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.contactHours}
                    onChange={onChange('contactHours')}
                    disabled={!isEdit}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Status</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.status} onChange={onChange('status')} disabled={!isEdit}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </CFormSelect>
                </CCol>

                {/* Actions */}
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  {isEdit && <ArpButton label="Save" icon="save" color="success" type="submit" title="Save" />}
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} title="Cancel" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ===================== C) TABLE CARD (ArpDataTable) ===================== */}
        <ArpDataTable
          title="COURSES DETAILS"
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
            name: 'courseSelect',
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
