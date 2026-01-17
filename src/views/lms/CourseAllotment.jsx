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
import { ArpButton, ArpIconButton, TableToolbar } from '../../components/common'

/**
 * Converted from course_allotment.html
 * ARP Standard:
 * - 3-card layout (Header → Form → Details Table)
 * - Search shows allocation details table
 * - Upload via hidden file input
 * - Search + Page Size + Circle Action Icons in ONE row
 */

const initialForm = {
  academicYear: '',
  programmeCode: '',
  programmeName: '',
  semester: '',
  status: 'Courses are not uploaded',
}

const CourseAllotmentConfiguration = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [form, setForm] = useState(initialForm)

  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const uploadRef = useRef(null)

  const rows = [
    { id: 1, code: 'Code 1', name: 'Course 1', fid: 'F001', fname: 'Dr. Smith', chapters: 10, hours: 4 },
    { id: 2, code: 'Code 2', name: 'Course 2', fid: 'F002', fname: 'Dr. Johnson', chapters: 12, hours: 3 },
  ]

  const onAddNew = () => {
    setIsEdit(true)
    setForm(initialForm)
    setShowDetails(false)
  }

  const onChange = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }))
  }

  const onSearch = () => {
    setShowDetails(true)
  }

  const normalize = (v) => String(v ?? '').toLowerCase().trim()

  const filtered = useMemo(() => {
    const q = normalize(search)
    if (!q) return rows
    return rows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))
  }, [search])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>COURSE ALLOTMENT</strong>
            <ArpButton
              label="Download Template"
              icon="download"
              color="danger"
              href="/assets/templates/ARP_T08_Course_Allocation_Template.xlsx"
            />
          </CCardHeader>
        </CCard>

        {/* FORM */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Course Allotment</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYear} onChange={onChange('academicYear')}>
                    <option>Select Academic Year</option>
                    <option>2025 – 26</option>
                    <option>2026 – 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeCode} onChange={onChange('programmeCode')}>
                    <option>Select Programme Code</option>
                    <option>26MCA</option>
                    <option>27MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput value={form.programmeName || '-'} disabled />
                </CCol>

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')}>
                    <option>Select Semester</option>
                    <option>Sem – 1</option>
                    <option>Sem – 3</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Status of the Course</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput value={form.status} disabled />
                </CCol>

                <CCol md={3}><CFormLabel>Action</CFormLabel></CCol>
                <CCol md={3} className="d-flex gap-2">
                  <ArpButton label="Search" icon="search" color="primary" onClick={onSearch} />
                  <ArpButton label="Upload" icon="upload" color="success" onClick={() => uploadRef.current?.click()} />
                  <input ref={uploadRef} type="file" style={{ display: 'none' }} />
                  <ArpButton label="Reset" icon="reset" color="secondary" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* DETAILS TABLE */}
        {showDetails && (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Course Allocation Details</strong>

              <TableToolbar
                search={search}
                onSearchChange={(e) => setSearch(e.target.value)}
                pageSize={pageSize}
                onPageSizeChange={(e) => setPageSize(Number(e.target.value))}
                pageSizeOptions={[5, 10, 20]}
                actions={
                  <>
                    <ArpIconButton icon="add" color="success" />
                    <ArpIconButton icon="edit" color="warning" />
                    <ArpIconButton icon="view" color="info" />
                    <ArpIconButton icon="delete" color="danger" />
                  </>
                }
              />
            </CCardHeader>

            <CCardBody>
              <CTable bordered hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    <CTableHeaderCell>Faculty ID</CTableHeaderCell>
                    <CTableHeaderCell>Faculty Name</CTableHeaderCell>
                    <CTableHeaderCell>Chapters</CTableHeaderCell>
                    <CTableHeaderCell>Hours / Week</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell>
                        <CFormCheck
                          type="radio"
                          name="courseSel"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.code}</CTableDataCell>
                      <CTableDataCell>{r.name}</CTableDataCell>
                      <CTableDataCell>{r.fid}</CTableDataCell>
                      <CTableDataCell>{r.fname}</CTableDataCell>
                      <CTableDataCell>{r.chapters}</CTableDataCell>
                      <CTableDataCell>{r.hours}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end mt-2">
                <CPagination size="sm">
                  <CPaginationItem disabled={safePage <= 1}>«</CPaginationItem>
                  <CPaginationItem active>1</CPaginationItem>
                  <CPaginationItem disabled={safePage >= totalPages}>»</CPaginationItem>
                </CPagination>
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default CourseAllotmentConfiguration
