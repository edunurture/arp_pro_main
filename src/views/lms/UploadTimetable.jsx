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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import { ArpButton, ArpIconButton, TableToolbar } from '../../components/common'

/**
 * Upload Timetable Configuration
 * Converted from upload_timetable.html
 * ARP Standard – 3 Card Layout
 */

const UploadTimetableConfiguration = () => {
  const [showDetails, setShowDetails] = useState(false)
  const [showView, setShowView] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [selectedId, setSelectedId] = useState(null)

  const uploadRef = useRef(null)

  const rows = [
    { id: 1, class: 'I MCA - A', semester: 'Sem 1', status: 'Uploaded' },
    { id: 2, class: 'I MBA - A', semester: 'Sem 1', status: 'Not Uploaded' },
  ]

  const filtered = useMemo(() => {
    if (!search) return rows
    return rows.filter((r) =>
      Object.values(r).join(' ').toLowerCase().includes(search.toLowerCase()),
    )
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>UPLOAD TIMETABLE</strong>
            <ArpButton
              label="Download Template"
              icon="download"
              color="danger"
              href="/assets/templates/ARP_T09_Upload_Timetable.xlsx"
            />
          </CCardHeader>
        </CCard>

        {/* FORM */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Upload Timetable For</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>2025 - 26</option>
                    <option>2026 - 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>Sem - 1</option>
                    <option>Sem - 3</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>26MCA</option>
                    <option>26MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value="Automatically Fetched" disabled /></CCol>

                <CCol md={3}><CFormLabel>Class Name</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>I MCA</option>
                    <option>I MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Class Label</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>A</option>
                    <option>B</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Status</CFormLabel></CCol>
                <CCol md={3}><CFormInput value="Automatically Fetched" disabled /></CCol>

                <CCol md={3}><CFormLabel>Action</CFormLabel></CCol>
                <CCol md={3} className="d-flex gap-2">
                  <ArpButton label="Search" icon="search" color="primary" onClick={() => setShowDetails(true)} />
                  <ArpButton label="Upload" icon="upload" color="success" onClick={() => uploadRef.current?.click()} />
                  <input ref={uploadRef} type="file" style={{ display: 'none' }} />
                  <ArpButton label="Reset" icon="reset" color="secondary" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* DETAILS */}
        {showDetails && !showView && (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Timetable Details</strong>

              <TableToolbar
                search={search}
                onSearchChange={(e) => setSearch(e.target.value)}
                pageSize={pageSize}
                onPageSizeChange={(e) => setPageSize(Number(e.target.value))}
                pageSizeOptions={[5, 10, 20]}
                actions={
                  <>
                    <ArpIconButton icon="view" color="info" onClick={() => setShowView(true)} disabled={!selectedId} />
                    <ArpIconButton icon="delete" color="danger" disabled={!selectedId} />
                  </>
                }
              />
            </CCardHeader>

            <CCardBody>
              <CTable bordered hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Class</CTableHeaderCell>
                    <CTableHeaderCell>Semester</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell>
                        <CFormCheck type="radio" checked={selectedId === r.id} onChange={() => setSelectedId(r.id)} />
                      </CTableDataCell>
                      <CTableDataCell>{r.class}</CTableDataCell>
                      <CTableDataCell>{r.semester}</CTableDataCell>
                      <CTableDataCell>{r.status}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end mt-2">
                <CPagination size="sm">
                  <CPaginationItem disabled>«</CPaginationItem>
                  <CPaginationItem active>1</CPaginationItem>
                  <CPaginationItem disabled>»</CPaginationItem>
                </CPagination>
              </div>
            </CCardBody>
          </CCard>
        )}

        {/* VIEW TIMETABLE */}
        {showView && (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>View Timetable</strong>
              <ArpButton label="Back" icon="arrow-left" color="secondary" onClick={() => setShowView(false)} />
            </CCardHeader>
            <CCardBody>
              <CTable bordered>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Hour</CTableHeaderCell>
                    <CTableHeaderCell>Monday</CTableHeaderCell>
                    <CTableHeaderCell>Tuesday</CTableHeaderCell>
                    <CTableHeaderCell>Wednesday</CTableHeaderCell>
                    <CTableHeaderCell>Thursday</CTableHeaderCell>
                    <CTableHeaderCell>Friday</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell>1</CTableDataCell>
                    <CTableDataCell onClick={() => setShowModal(true)}>Maths</CTableDataCell>
                    <CTableDataCell>OS</CTableDataCell>
                    <CTableDataCell>DBMS</CTableDataCell>
                    <CTableDataCell>SE</CTableDataCell>
                    <CTableDataCell>Java</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* MODAL */}
        <CModal visible={showModal} onClose={() => setShowModal(false)}>
          <CModalHeader>
            <CModalTitle>Timetable Slot Details</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p><strong>Course:</strong> Mathematics</p>
            <p><strong>Faculty:</strong> Dr. Kumar</p>
            <p><strong>Time:</strong> 9:00 – 10:00</p>
          </CModalBody>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default UploadTimetableConfiguration
