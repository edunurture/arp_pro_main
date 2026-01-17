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
  CButton,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilCloudDownload, cilExternalLink, cilPrint } from '@coreui/icons'
import { ArpButton, ArpIconButton } from '../../components/common'

/**
 * Converted from course_materials.html
 * Fix applied: Download/Open/Print are now CoreUI circle icon buttons (always visible)
 */

const CircleIcon = ({ icon, color = 'secondary', title, onClick }) => (
  <CButton
    color={color}
    className="rounded-circle d-inline-flex align-items-center justify-content-center"
    style={{ width: 40, height: 40, padding: 0 }}
    title={title}
    onClick={onClick}
    type="button"
  >
    <CIcon icon={icon} />
  </CButton>
)

const CourseMaterialsConfiguration = () => {
  const [showDetails, setShowDetails] = useState(false)
  const [showCourseMaterials, setShowCourseMaterials] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showViewMaterials, setShowViewMaterials] = useState(false)

  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [progress, setProgress] = useState(0)
  const fileRef = useRef(null)

  const rows = [
    {
      id: 1,
      courseCode: '23-2AA-11T',
      courseName: 'Language - I',
      facultyId: '23KCAS01',
      facultyName: 'Dr. M. Elamparithi',
      department: 'Department of Tamil',
      status: 'Materials not Uploaded',
    },
    {
      id: 2,
      courseCode: '23-2AA-11T',
      courseName: 'English - I',
      facultyId: '23KCAS02',
      facultyName: 'Dr. M. Senthil',
      department: 'Department of English',
      status: 'Materials not Uploaded',
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
            <strong>COURSE MATERIALS</strong>
            <ArpButton
              label="Download Template"
              icon="download"
              color="danger"
              href="/assets/templates/ARP_T12_Course_Materials.xlsx"
            />
          </CCardHeader>
        </CCard>

        {/* FILTER FORM */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Upload Course Materials for</strong>
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
                  <ArpButton label="Search" icon="search" color="success" onClick={() => setShowDetails(true)} />
                  <ArpButton
                    label="Reset"
                    icon="reset"
                    color="secondary"
                    onClick={() => {
                      setShowDetails(false)
                      setShowCourseMaterials(false)
                      setShowViewMaterials(false)
                      setSelectedId(null)
                      setSearch('')
                    }}
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* DETAILS TABLE */}
        {showDetails && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Details for Uploaded Course Materials</strong>
              <div className="d-flex gap-2">
                <ArpIconButton icon="upload" color="primary" onClick={() => setShowUploadModal(true)} />
                <ArpIconButton
                  icon="view"
                  color="secondary"
                  disabled={!selectedId}
                  onClick={() => {
                    setShowCourseMaterials(true)
                    setShowViewMaterials(true)
                  }}
                />
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
                          name="cmSel"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.courseCode}</CTableDataCell>
                      <CTableDataCell>{r.courseName}</CTableDataCell>
                      <CTableDataCell>{r.facultyId}</CTableDataCell>
                      <CTableDataCell>{r.facultyName}</CTableDataCell>
                      <CTableDataCell>{r.department}</CTableDataCell>
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

        {/* COURSE MATERIALS VIEW */}
        {showCourseMaterials && (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Course Materials</strong>
              <ArpButton
                label="Back"
                icon="arrow-left"
                color="secondary"
                onClick={() => {
                  setShowCourseMaterials(false)
                  setShowViewMaterials(false)
                }}
              />
            </CCardHeader>
            <CCardBody>
              <CTable bordered>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Choose Chapter</CTableHeaderCell>
                    <CTableHeaderCell>Choose Chapter Heading</CTableHeaderCell>
                    <CTableHeaderCell>Select Topic</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                    <CTableHeaderCell>Add</CTableHeaderCell>
                    <CTableHeaderCell>View</CTableHeaderCell>
                    <CTableHeaderCell>Delete</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell>
                      <CFormSelect>
                        <option>Unit - I</option>
                        <option>Unit - II</option>
                        <option>Unit - III</option>
                      </CFormSelect>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormSelect>
                        <option>Introduction</option>
                        <option>Classification</option>
                      </CFormSelect>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormSelect>
                        <option>Select Topic</option>
                        <option>Introduction of Principles of Accountancy</option>
                      </CFormSelect>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormInput value="Course Materials not uploaded" disabled className="text-danger" />
                    </CTableDataCell>
                    <CTableDataCell>
                      <ArpIconButton icon="add" color="success" onClick={() => setShowUploadModal(true)} />
                    </CTableDataCell>
                    <CTableDataCell>
                      <ArpIconButton icon="view" color="primary" onClick={() => setShowViewMaterials(true)} />
                    </CTableDataCell>
                    <CTableDataCell>
                      <ArpIconButton icon="delete" color="danger" />
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>

              {/* VIEW MATERIALS PANEL */}
              {showViewMaterials && (
                <CCard className="mt-3">
                  <CCardHeader className="d-flex justify-content-between align-items-center">
                    <strong>View Materials</strong>
                    <div className="d-flex gap-2">
                      <CircleIcon icon={cilCloudDownload} color="danger" title="Download" />
                      <CircleIcon icon={cilExternalLink} color="secondary" title="Open" />
                      <CircleIcon icon={cilPrint} color="info" title="Print" />
                    </div>
                  </CCardHeader>
                  <CCardBody>
                    <CTable bordered responsive>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Select</CTableHeaderCell>
                          <CTableHeaderCell>Material Heading</CTableHeaderCell>
                          <CTableHeaderCell>Resource Category</CTableHeaderCell>
                          <CTableHeaderCell>URL Reference</CTableHeaderCell>
                          <CTableHeaderCell>File Log</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        <CTableRow>
                          <CTableDataCell><CFormCheck type="radio" name="matSel" /></CTableDataCell>
                          <CTableDataCell><CFormInput value="Sample Material" disabled /></CTableDataCell>
                          <CTableDataCell><CFormInput value="e-PG Pathsala" disabled /></CTableDataCell>
                          <CTableDataCell><CFormInput value="http://example.com" disabled /></CTableDataCell>
                          <CTableDataCell><CFormInput value="Uploaded" disabled /></CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>
                  </CCardBody>
                </CCard>
              )}
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default CourseMaterialsConfiguration
