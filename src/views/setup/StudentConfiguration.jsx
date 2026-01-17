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
 * Converted from student.html
 * - 3-card ARP layout
 * - Add New enables form
 * - Upload button triggers file input
 * - Table header: Search + Page Size + Circle Action Icons (ONE ROW)
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

const StudentConfiguration = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState(initialForm)

  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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
      console.log('Selected file:', e.target.files[0].name)
    }
  }

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

        {/* FORM CARD */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Students Data to be Upload for</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYear} onChange={onChange('academicYear')} disabled={!isEdit}>
                    <option value="">Select Academic Year</option>
                    <option>2025 - 26</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Semester Pattern</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semesterPattern} onChange={onChange('semesterPattern')} disabled={!isEdit}>
                    <option value="">Select Semester Pattern</option>
                    <option>Odd</option>
                    <option>Even</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeCode} onChange={onChange('programmeCode')} disabled={!isEdit}>
                    <option value="">Select Programme Code</option>
                    <option>N26MBA</option>
                    <option>N27MCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput value={form.programme} disabled />
                </CCol>

                <CCol md={3}><CFormLabel>Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')} disabled={!isEdit}>
                    <option value="">Select Semester</option>
                    <option>Sem-1</option>
                    <option>Sem-3</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Batch</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.batch} onChange={onChange('batch')} disabled={!isEdit}>
                    <option value="">Select Batch</option>
                    <option>2025 - 26</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Class</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.className} onChange={onChange('className')} disabled={!isEdit}>
                    <option value="">Select Class</option>
                    <option>I - MBA</option>
                    <option>I - MCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Class Label</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.classLabel} onChange={onChange('classLabel')} disabled={!isEdit}>
                    <option value="">Select Section</option>
                    <option>A</option>
                    <option>B</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Upload Student Data Table</CFormLabel></CCol>
                <CCol md={3}>
                  <ArpButton label="Upload Student Data" icon="upload" color="primary" onClick={onUploadClick} disabled={!isEdit} />
                  <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onFileChange} />
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Save" icon="save" color="success" type="button" onClick={() => {}} disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* TABLE CARD */}
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Student Details</strong>

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
                  <CTableHeaderCell>Programme Code</CTableHeaderCell>
                  <CTableHeaderCell>Programme</CTableHeaderCell>
                  <CTableHeaderCell>Semester</CTableHeaderCell>
                  <CTableHeaderCell>Batch</CTableHeaderCell>
                  <CTableHeaderCell>Reg. No</CTableHeaderCell>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Class</CTableHeaderCell>
                  <CTableHeaderCell>Label</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {pageRows.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell>
                      <CFormCheck type="radio" name="studentSelect" checked={selectedId === r.id} onChange={() => setSelectedId(r.id)} />
                    </CTableDataCell>
                    <CTableDataCell>{r.programmeCode}</CTableDataCell>
                    <CTableDataCell>{r.programme}</CTableDataCell>
                    <CTableDataCell>{r.semester}</CTableDataCell>
                    <CTableDataCell>{r.batch}</CTableDataCell>
                    <CTableDataCell>{r.regNo}</CTableDataCell>
                    <CTableDataCell>{r.name}</CTableDataCell>
                    <CTableDataCell>{r.className}</CTableDataCell>
                    <CTableDataCell>{r.label}</CTableDataCell>
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

export default StudentConfiguration
