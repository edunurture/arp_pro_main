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
  CFormTextarea,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

const initialForm = {
  deptCode: '',
  deptName: '',
  estYear: '',
  nbaAccredited: '',
  objectives: '',
  vision: '',
  mission: '',
  goal: '',
}

const Department = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedCode, setSelectedCode] = useState(null)
  const [form, setForm] = useState(initialForm)

  // Loading placeholder (replace with API later)
  const [loading] = useState(false)

  // Upload ref
  const fileRef = useRef(null)

  // Demo rows (replace with API later)
  const [rows] = useState([
    {
      deptCode: 'MCA',
      deptName: 'Master of Computer Applications',
      estYear: '2016',
      nbaAccredited: 'Yes',
      objectives: 'XXX - XXX',
      vision: 'XXX - XXX',
      mission: 'XXX - XXX',
      goal: 'XXX - XXX',
    },
    {
      deptCode: 'M.Com',
      deptName: 'Master of Commerce',
      estYear: '2016',
      nbaAccredited: 'No',
      objectives: 'XXX - XXX',
      vision: 'XXX - XXX',
      mission: 'XXX - XXX',
      goal: 'XXX - XXX',
    },
  ])

  // Years dropdown
  const years = useMemo(() => {
    const current = new Date().getFullYear()
    const arr = []
    for (let y = 2000; y <= current; y++) arr.push(String(y))
    return arr
  }, [])

  // Form actions
  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setSelectedCode(null)
    setForm(initialForm)
    setIsEdit(true)
  }

  const onView = () => {
    const selected = rows.find((r) => r.deptCode === selectedCode)
    if (!selected) return
    setForm({ ...selected })
    setIsEdit(false)
  }

  const onEdit = () => {
    const selected = rows.find((r) => r.deptCode === selectedCode)
    if (!selected) return
    setForm({ ...selected })
    setIsEdit(true)
  }

  const onCancel = () => setIsEdit(false)

  const onSave = (e) => {
    e.preventDefault()
    // Hook your API save here
    setIsEdit(false)
  }

  // Upload / Download
  const onUploadClick = () => fileRef.current?.click()
  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Hook your upload handler here
    e.target.value = ''
  }

  const onDownloadTemplate = () => {
    // Adjust template path if needed
    window.open('/templates/ARP_T01_Dept_Data_Template.xlsx', '_blank')
  }

  const columns = useMemo(
    () => [
      { key: 'deptCode', label: 'Department Code', sortable: true, width: 170 },
      { key: 'deptName', label: 'Department Name', sortable: true },
      { key: 'estYear', label: 'Year of Establishments', sortable: true, width: 170, align: 'center', sortType: 'number' },
      { key: 'nbaAccredited', label: 'NBA Accreditation', sortable: true, width: 160, align: 'center' },
      { key: 'objectives', label: 'Objectives', sortable: true },
      { key: 'vision', label: 'Vision', sortable: true },
      { key: 'mission', label: 'Mission', sortable: true },
      { key: 'goal', label: 'Goal', sortable: true },
    ],
    [],
  )

  const tableActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedCode} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedCode} />
      <ArpIconButton icon="delete" color="danger" title="Delete" disabled={!selectedCode} />
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>DEPARTMENT SETUP</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />

              <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onFileChange} />

              <ArpButton label="Upload" icon="upload" color="info" onClick={onUploadClick} />
              <ArpButton label="Download Template" icon="download" color="danger" onClick={onDownloadTemplate} />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Department Configuration</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={3}>
                  <CFormLabel>Department Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.deptCode} onChange={onChange('deptCode')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Department Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.deptName} onChange={onChange('deptName')} disabled={!isEdit} />
                </CCol>

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Year of Establishment</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.estYear} onChange={onChange('estYear')} disabled={!isEdit}>
                    <option value="">Select</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Whether Accredited by NBA</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.nbaAccredited} onChange={onChange('nbaAccredited')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </CFormSelect>
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Objectives</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormTextarea value={form.objectives} onChange={onChange('objectives')} rows={5} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Vision</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormTextarea value={form.vision} onChange={onChange('vision')} rows={5} disabled={!isEdit} />
                </CCol>

                {/* Row 4 */}
                <CCol md={3}>
                  <CFormLabel>Mission</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormTextarea value={form.mission} onChange={onChange('mission')} rows={5} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Goal</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormTextarea value={form.goal} onChange={onChange('goal')} rows={5} disabled={!isEdit} />
                </CCol>

                {/* Save / Cancel */}
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE (ArpDataTable Standard) ================= */}
        <ArpDataTable
          title="Department Details"
          rows={rows}
          columns={columns}
          loading={loading}
          searchable
          searchPlaceholder="Search..."
          pageSizeOptions={[5, 10, 20, 50]}
          defaultPageSize={10}
          rowKey="deptCode"
          headerActions={tableActions}
          selection={{
            type: 'radio',
            selected: selectedCode,
            onChange: (code) => setSelectedCode(code),
            key: 'deptCode',
            headerLabel: 'Select',
            width: 60,
            name: 'deptRow',
          }}
        />
      </CCol>
    </CRow>
  )
}

export default Department