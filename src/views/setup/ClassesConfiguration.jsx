import React, { useMemo, useRef, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * ClassesConfiguration.jsx (ARP CoreUI React Pro Standard)
 * Source: User provided "CoursesConfiguration.jsx" (actually Classes Setup module)
 *
 * - Strict 3-card layout: Header Action Card + Form Card + Table Card (ArpDataTable)
 * - Uses ArpDataTable for Search + Page Size + Sorting + Pagination + Selection
 * - No manual search / pagination / safePage logic inside the module
 * - No ArpPagination usage
 * - Demo rows only. Hook API where indicated.
 */

const initialForm = {
  className: '',
  classLabel: '',
  department: '',
  programme: '',
  semester: '',
  strength: '',
  roomNumber: '',
  capacity: '',
  buildingName: '',
  blockLabel: '',
}

export default function ClassesConfiguration() {
  // ARP mandatory state pattern
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)

  // Upload input ref
  const fileRef = useRef(null)

  // Template download URL (adjust to your actual public path)
  const TEMPLATE_URL = '/templates/ARP_T03_Classes_Template.xlsx'

  // Sample rows (replace with API later)
  const [rows, setRows] = useState([
    {
      id: 1,
      classLabel: 'I-MCA',
      department: 'Computer Applications',
      programme: 'MCA',
      semester: 'Sem-I',
      strength: 57,
      roomNumber: 'A101',
      capacity: 60,
      block: 'A-Block',
    },
    {
      id: 2,
      classLabel: 'II-MCA',
      department: 'Computer Applications',
      programme: 'MCA',
      semester: 'Sem-I',
      strength: 58,
      roomNumber: 'A102',
      capacity: 60,
      block: 'A-Block',
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

    setForm((p) => ({
      ...p,
      className: p.className || '',
      classLabel: selected.classLabel || '',
      department: selected.department || '',
      programme: selected.programme || '',
      semester: selected.semester || '',
      strength: selected.strength ?? '',
      roomNumber: selected.roomNumber || '',
      capacity: selected.capacity ?? '',
      buildingName: p.buildingName || '',
      blockLabel: selected.block || '',
    }))

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
      classLabel: form.classLabel || '—',
      department: form.department || '—',
      programme: form.programme || '—',
      semester: form.semester || '—',
      strength: form.strength === '' ? '—' : form.strength,
      roomNumber: form.roomNumber || '—',
      capacity: form.capacity === '' ? '—' : form.capacity,
      block: form.blockLabel || '—',
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
    link.download = 'ARP_T03_Classes_Template.xlsx'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  /* =========================
     ArpDataTable CONFIG
  ========================== */

  const columns = useMemo(
    () => [
      { key: 'classLabel', label: 'Class Label', sortable: true, width: 140 },
      { key: 'department', label: 'Department', sortable: true },
      { key: 'programme', label: 'Programme', sortable: true, width: 120 },
      { key: 'semester', label: 'Semester', sortable: true, width: 110, align: 'center' },
      { key: 'strength', label: 'Strength', sortable: true, width: 110, align: 'center', sortType: 'number' },
      { key: 'roomNumber', label: 'Room Number', sortable: true, width: 130, align: 'center' },
      { key: 'capacity', label: 'Capacity', sortable: true, width: 110, align: 'center', sortType: 'number' },
      { key: 'block', label: 'Block', sortable: true, width: 140 },
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
            <strong>CLASSES SETUP</strong>

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
            <strong>Classes Configuration</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Name of the Class</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.className} onChange={onChange('className')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Class Label</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.classLabel} onChange={onChange('classLabel')} disabled={!isEdit} />
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
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Sem-1">Sem-1</option>
                    <option value="Sem-3">Sem-3</option>
                    <option value="Sem-5">Sem-5</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Strength of the Students</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.strength}
                    onChange={onChange('strength')}
                    disabled={!isEdit}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Classroom Number</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.roomNumber} onChange={onChange('roomNumber')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Maximum Capacity</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.capacity}
                    onChange={onChange('capacity')}
                    disabled={!isEdit}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Name of the Building</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.buildingName} onChange={onChange('buildingName')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Block Label</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.blockLabel} onChange={onChange('blockLabel')} disabled={!isEdit} />
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
          title="CLASSES DETAILS"
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
            name: 'classSelect',
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
