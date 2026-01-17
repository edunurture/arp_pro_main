import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CPagination,
  CPaginationItem,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import { ArpButton, ArpIconButton } from '../../components/common'

/**
 * Converted from faculty.html
 * ARP Standard:
 * - 3 card layout
 * - Add New enables form
 * - Upload button triggers file input
 * - Search + Page size + Circle action icons in ONE row
 */

const initialForm = {
  academicYear: '',
  semesterPattern: '',
  status: 'Faculty Data Not Uploaded',
}

const FacultyConfiguration = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState(initialForm)

  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fileRef = useRef(null)

  const [rows] = useState([
    {
      id: 1,
      facultyId: 'FAC001',
      facultyName: 'XXX - XXX',
      designation: 'Assistant Professor',
      department: 'Computer Science',
      gender: 'Male',
      mobile: 'XXXXXXXXXX',
    },
    {
      id: 2,
      facultyId: 'FAC002',
      facultyName: 'XXX - XXX',
      designation: 'Associate Professor',
      department: 'Management',
      gender: 'Female',
      mobile: 'XXXXXXXXXX',
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

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const filtered = useMemo(() => {
    const q = normalize(search)
    if (!q) return rows
    return rows.filter((r) =>
      Object.values(r).map(normalize).join(' ').includes(q),
    )
  }, [rows, search])

  useEffect(() => setPage(1), [search, pageSize])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * pageSize
  const pageRows = filtered.slice(startIdx, startIdx + pageSize)

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER ACTION CARD */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>FACULTY CONFIGURATION</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton
                label="Download Template"
                icon="download"
                color="danger"
                href="/templates/ARP_T06_Faculty_Template.xlsx"
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* FORM CARD */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Faculty Data to be Upload for</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYear} onChange={onChange('academicYear')} disabled={!isEdit}>
                    <option value="">Select Academic Year</option>
                    <option>2025 – 26</option>
                    <option>2026 – 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Semester Pattern</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semesterPattern} onChange={onChange('semesterPattern')} disabled={!isEdit}>
                    <option value="">Select Pattern</option>
                    <option>Odd</option>
                    <option>Even</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Status</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput value={form.status} disabled />
                </CCol>

                <CCol md={3}><CFormLabel>Upload Faculty Data</CFormLabel></CCol>
                <CCol md={3}>
                  <ArpButton
                    label="Upload Faculty Data"
                    icon="upload"
                    color="primary"
                    onClick={onUploadClick}
                    disabled={!isEdit}
                  />
                  <input ref={fileRef} type="file" style={{ display: 'none' }} />
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Save" icon="save" color="success" disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* TABLE CARD */}
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Faculty Details</strong>

            <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
              <CInputGroup size="sm" style={{ width: 280 }}>
                <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                <CFormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
              </CInputGroup>

              <CFormSelect size="sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ width: 120 }}>
                {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </CFormSelect>

              <div className="d-flex gap-2 flex-nowrap">
                <ArpIconButton icon="view" color="purple" disabled={!selectedId} />
                <ArpIconButton icon="edit" color="info" disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" disabled={!selectedId} />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Faculty ID</CTableHeaderCell>
                  <CTableHeaderCell>Faculty Name</CTableHeaderCell>
                  <CTableHeaderCell>Designation</CTableHeaderCell>
                  <CTableHeaderCell>Department</CTableHeaderCell>
                  <CTableHeaderCell>Gender</CTableHeaderCell>
                  <CTableHeaderCell>Mobile No</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {pageRows.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell>
                      <CFormCheck type="radio" name="facultySelect" checked={selectedId === r.id} onChange={() => setSelectedId(r.id)} />
                    </CTableDataCell>
                    <CTableDataCell>{r.facultyId}</CTableDataCell>
                    <CTableDataCell>{r.facultyName}</CTableDataCell>
                    <CTableDataCell>{r.designation}</CTableDataCell>
                    <CTableDataCell>{r.department}</CTableDataCell>
                    <CTableDataCell>{r.gender}</CTableDataCell>
                    <CTableDataCell>{r.mobile}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>

            <div className="d-flex justify-content-end mt-2">
              <CPagination size="sm">
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage(1)}>«</CPaginationItem>
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹</CPaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <CPaginationItem key={i+1} active={safePage === i+1} onClick={() => setPage(i+1)}>{i+1}</CPaginationItem>
                ))}
                <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>›</CPaginationItem>
                <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>»</CPaginationItem>
              </CPagination>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default FacultyConfiguration
