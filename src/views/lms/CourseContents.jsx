import React, { useMemo, useRef, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CProgress,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import { ArpButton, ArpIconButton } from '../../components/common'

/**
 * Course Contents Configuration
 * Converted from course_contents.html
 * ARP Standard – Upload + View Course Contents
 */

const CourseContentsConfiguration = () => {
  const [showDetails, setShowDetails] = useState(false)
  const [showCourseView, setShowCourseView] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef(null)

  const rows = [
    {
      id: 1,
      code: '23-2AA-11T',
      name: 'Language - I',
      facultyId: '23KCAS01',
      faculty: 'Dr. M. Elamparithi',
      dept: 'Department of Tamil',
      status: 'Contents not Uploaded',
    },
    {
      id: 2,
      code: '23-2AA-11T',
      name: 'English - I',
      facultyId: '23KCAS02',
      faculty: 'Dr. M. Senthil',
      dept: 'Department of English',
      status: 'Contents not Uploaded',
    },
  ]

  const filtered = useMemo(() => {
    if (!search) return rows
    return rows.filter((r) =>
      Object.values(r).join(' ').toLowerCase().includes(search.toLowerCase()),
    )
  }, [search])

  const startUpload = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          return 100
        }
        return p + 10
      })
    }, 300)
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>COURSE CONTENTS</strong>
            <ArpButton
              label="Download Template"
              icon="download"
              color="danger"
              href="/assets/templates/ARP_T11_Course_Contents.xlsx"
            />
          </CCardHeader>
        </CCard>

        {/* FORM */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Upload Course Contents for</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>Select Academic Year</option>
                    <option>2025 - 2026</option>
                    <option>2026 - 2027</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>Select Semester</option>
                    <option>Sem - 1</option>
                    <option>Sem - 3</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>Select Programme Code</option>
                    <option>N6MCA</option>
                    <option>N6MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={6} className="d-flex justify-content-end gap-2">
                  <ArpButton
                    label="Search"
                    icon="search"
                    color="success"
                    onClick={() => setShowDetails(true)}
                  />
                  <ArpButton label="Reset" icon="reset" color="secondary" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* DETAILS TABLE */}
        {showDetails && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Details for Uploaded Course Contents</strong>
              <div className="d-flex gap-2">
                <ArpIconButton icon="upload" color="primary" onClick={() => setShowUploadModal(true)} />
                <ArpIconButton icon="view" color="secondary" onClick={() => setShowCourseView(true)} disabled={!selectedId} />
                <ArpIconButton icon="edit" color="success" disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" disabled={!selectedId} />
              </div>
            </CCardHeader>
            <CCardBody>
              <CInputGroup size="sm" className="mb-2" style={{ maxWidth: 300 }}>
                <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                <CFormInput placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
              </CInputGroup>

              <CTable bordered hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    <CTableHeaderCell>Faculty ID</CTableHeaderCell>
                    <CTableHeaderCell>Faculty Name</CTableHeaderCell>
                    <CTableHeaderCell>Department</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filtered.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell>
                        <CFormCheck
                          type="radio"
                          name="ccSel"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.code}</CTableDataCell>
                      <CTableDataCell>{r.name}</CTableDataCell>
                      <CTableDataCell>{r.facultyId}</CTableDataCell>
                      <CTableDataCell>{r.faculty}</CTableDataCell>
                      <CTableDataCell>{r.dept}</CTableDataCell>
                      <CTableDataCell>{r.status}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* UPLOAD MODAL */}
        <CModal visible={showUploadModal} onClose={() => setShowUploadModal(false)}>
          <CModalHeader>
            <CModalTitle>Upload File</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CInputGroup className="mb-3">
              <CFormInput placeholder="No file chosen" readOnly />
              <ArpButton label="Choose File" onClick={() => fileRef.current?.click()} />
              <input ref={fileRef} type="file" hidden />
            </CInputGroup>
            <ArpButton label="Upload" icon="upload" color="primary" onClick={startUpload} />
            <CProgress className="mt-3" value={progress} />
          </CModalBody>
        </CModal>

        {/* COURSE VIEW */}
        {showCourseView && (
          <CCard>
            <CCardHeader>
              <strong>Course Details – Hours per Week</strong>
            </CCardHeader>
            <CCardBody>
              <CTable bordered>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    <CTableHeaderCell>Lecture</CTableHeaderCell>
                    <CTableHeaderCell>Tutorial</CTableHeaderCell>
                    <CTableHeaderCell>Practical</CTableHeaderCell>
                    <CTableHeaderCell>Total Hours</CTableHeaderCell>
                    <CTableHeaderCell>Chapters</CTableHeaderCell>
                    <CTableHeaderCell>Credit</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell>23-2AA-13A</CTableDataCell>
                    <CTableDataCell>Core – I: Principles of Accountancy</CTableDataCell>
                    <CTableDataCell>4</CTableDataCell>
                    <CTableDataCell>1</CTableDataCell>
                    <CTableDataCell>1</CTableDataCell>
                    <CTableDataCell>6</CTableDataCell>
                    <CTableDataCell>5</CTableDataCell>
                    <CTableDataCell>4</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default CourseContentsConfiguration
