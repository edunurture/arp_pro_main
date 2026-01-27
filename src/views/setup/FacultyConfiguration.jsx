import React, { useMemo, useRef, useState } from 'react'
import { CCard, CCardHeader, CCardBody, CRow, CCol, CForm, CFormLabel, CFormInput, CFormSelect } from '@coreui/react-pro'
import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

const initialForm = {
  academicYear: '',
  semesterPattern: '',
  status: 'Faculty Data Not Uploaded',
}

export default function FacultyConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [selectedId, setSelectedId] = useState(null)
  const fileRef = useRef(null)

  const [rows, setRows] = useState([
    { id: 1, facultyId: 'FAC001', facultyName: 'XXX - XXX', designation: 'Assistant Professor', department: 'Computer Science', gender: 'Male', mobile: 'XXXXXXXXXX' },
    { id: 2, facultyId: 'FAC002', facultyName: 'XXX - XXX', designation: 'Associate Professor', department: 'Management', gender: 'Female', mobile: 'XXXXXXXXXX' },
  ])

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))
  const onAddNew = () => { setIsEdit(true); setForm(initialForm); setSelectedId(null) }
  const onCancel = () => { setIsEdit(false); setForm(initialForm) }
  const onUploadClick = () => fileRef.current?.click()

  const onDelete = () => {
    if (!selectedId) return
    setRows((p)=>p.filter(r=>r.id!==selectedId))
    setSelectedId(null)
  }

  const columns = useMemo(()=>[
    { key:'facultyId', label:'Faculty ID', sortable:true, width:140, align:'center'},
    { key:'facultyName', label:'Faculty Name', sortable:true, width:220},
    { key:'designation', label:'Designation', sortable:true, width:180},
    { key:'department', label:'Department', sortable:true, width:180},
    { key:'gender', label:'Gender', sortable:true, width:120, align:'center'},
    { key:'mobile', label:'Mobile', sortable:true, width:160, align:'center'},
  ],[])

  const headerActions=(
    <div className="d-flex gap-2">
      <ArpIconButton icon="view" color="purple" disabled={!selectedId}/>
      <ArpIconButton icon="edit" color="info" disabled={!selectedId}/>
      <ArpIconButton icon="delete" color="danger" disabled={!selectedId} onClick={onDelete}/>
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>FACULTY CONFIGURATION</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew}/>
              <ArpButton label="Download Template" icon="download" color="danger" href="/templates/ARP_T06_Faculty_Template.xlsx"/>
            </div>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Faculty Data to be Upload for</strong></CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYear} onChange={onChange('academicYear')} disabled={!isEdit}>
                    <option value="">Select Academic Year</option>
                    <option>2025 – 26</option><option>2026 – 27</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}><CFormLabel>Semester Pattern</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semesterPattern} onChange={onChange('semesterPattern')} disabled={!isEdit}>
                    <option value="">Select Pattern</option><option>Odd</option><option>Even</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}><CFormLabel>Status</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.status} disabled/></CCol>
                <CCol md={3}><CFormLabel>Upload Faculty Data</CFormLabel></CCol>
                <CCol md={3}>
                  <ArpButton label="Upload Faculty Data" icon="upload" color="primary" onClick={onUploadClick} disabled={!isEdit}/>
                  <input ref={fileRef} type="file" style={{display:'none'}}/>
                </CCol>
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Save" icon="save" color="success" disabled={!isEdit}/>
                  <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel}/>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        <ArpDataTable
          title="FACULTY DETAILS"
          rows={rows}
          columns={columns}
          headerActions={headerActions}
          selection={{type:'radio', selected:selectedId, onChange:(v)=>setSelectedId(v), key:'id', headerLabel:'Select', width:60, name:'facultySelect'}}
          pageSizeOptions={[5,10,20,50]}
          defaultPageSize={10}
          searchable
          rowKey="id"
        />
      </CCol>
    </CRow>
  )
}
