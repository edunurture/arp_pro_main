import React, { useMemo, useState } from 'react'
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
import { ArpButton } from '../../components/common'

/**
 * Converted from student_allotment.html
 * ARP Standard:
 * - 3-card layout (Header → Form → Details)
 * - Search shows Student Allotment Details
 * - Select All + row checkboxes
 * - Allotment / Reset / Cancel actions
 */

const initialForm = {
  academicYear: '',
  semester: '',
  programmeCode: '',
  programmeName: '',
  className: '',
  classLabel: '',
  courseCode: '',
  courseName: '',
  status: 'Automatically Fetched',
}

const StudentAllotmentConfiguration = () => {
  const [form, setForm] = useState(initialForm)
  const [showDetails, setShowDetails] = useState(false)

  const [search, setSearch] = useState('')
  const [selectAll, setSelectAll] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const students = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i + 1,
        batch: `Batch ${i + 1}`,
        regNo: `REG00${i + 1}`,
        name: `Student ${i + 1}`,
        selected: false,
      })),
    [],
  )

  const [rows, setRows] = useState(students)

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onSearch = () => setShowDetails(true)

  const onReset = () => {
    setForm(initialForm)
    setShowDetails(false)
    setRows(students)
    setSelectAll(false)
  }

  const toggleSelectAll = () => {
    const next = !selectAll
    setSelectAll(next)
    setRows((p) => p.map((r) => ({ ...r, selected: next })))
  }

  const toggleRow = (id) => {
    setRows((p) => p.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return rows
    return rows.filter((r) => `${r.regNo} ${r.name}`.toLowerCase().includes(q))
  }, [rows, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>STUDENT ALLOTMENT</strong>
          </CCardHeader>
        </CCard>

        {/* FORM */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Student Allotment</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYear} onChange={onChange('academicYear')}>
                    <option>Select Academic Year</option>
                    <option>2025 - 2026</option>
                    <option>2026 - 2027</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')}>
                    <option>Select Semester</option>
                    <option>Sem - 1</option>
                    <option>Sem - 3</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeCode} onChange={onChange('programmeCode')}>
                    <option>Select Programme Code</option>
                    <option>25MCA</option>
                    <option>25MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value="Automatically Fetched" disabled /></CCol>

                <CCol md={3}><CFormLabel>Class Name</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.className} onChange={onChange('className')}>
                    <option>Select Class Name</option>
                    <option>I - MCA</option>
                    <option>I - MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Select Class Label</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.classLabel} onChange={onChange('classLabel')}>
                    <option>Select Class Label</option>
                    <option>A</option>
                    <option>B</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Course Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.courseCode} onChange={onChange('courseCode')}>
                    <option>Select Course Code</option>
                    <option>26MCALT01</option>
                    <option>26MCALT02</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Course Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value="Automatically Fetched" disabled /></CCol>

                <CCol md={3}><CFormLabel>Status</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.status} disabled /></CCol>

                <CCol md={3}><CFormLabel>Action</CFormLabel></CCol>
                <CCol md={3} className="d-flex gap-2 justify-content-end">
                  <ArpButton label="Search" icon="search" color="primary" onClick={onSearch} />
                  <ArpButton label="Reset" icon="reset" color="secondary" onClick={onReset} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* DETAILS */}
        {showDetails && (
          <CCard>
            <CCardHeader>
              <strong>Student Allotment Details</strong>
            </CCardHeader>
            <CCardBody>
              <div className="d-flex justify-content-between mb-2">
                <CFormInput
                  placeholder="Search by Register Number or Name"
                  style={{ maxWidth: 320 }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <CFormCheck
                  label="Select All Students"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                />
              </div>

              <CTable bordered hover size="sm">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Batch</CTableHeaderCell>
                    <CTableHeaderCell>Register Number</CTableHeaderCell>
                    <CTableHeaderCell>Student Name</CTableHeaderCell>
                    <CTableHeaderCell>Enrollment</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell>{r.batch}</CTableDataCell>
                      <CTableDataCell>{r.regNo}</CTableDataCell>
                      <CTableDataCell>{r.name}</CTableDataCell>
                      <CTableDataCell>
                        <CFormCheck checked={r.selected} onChange={() => toggleRow(r.id)} />
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-between align-items-center mt-2">
                <div className="d-flex gap-2">
                  <ArpButton label="Allotment" icon="check" color="success" />
                  <ArpButton label="Reset" icon="reset" color="secondary" onClick={onReset} />
                  <ArpButton label="Cancel" icon="cancel" color="danger" onClick={() => setShowDetails(false)} />
                </div>

                <CPagination size="sm">
                  <CPaginationItem disabled={safePage <= 1} onClick={() => setPage(1)}>«</CPaginationItem>
                  <CPaginationItem active>{safePage}</CPaginationItem>
                  <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>»</CPaginationItem>
                </CPagination>
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default StudentAllotmentConfiguration
