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
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilUser, cilZoom, cilCloudDownload } from '@coreui/icons'
import { ArpButton, ArpPagination } from '../../components/common'

/**
 * Student Placements (converted from student_placements.html)
 * Breadcrumb: Home > Setup > Student Placements
 *
 * HTML behavior replicated:
 * - Find Students -> shows List of Students
 * - View Profile -> shows Student Profile
 * - Close Profile -> hides Profile, Placement, Docs
 * - View Placement -> shows Placement Details
 * - Global View (eye) -> shows View Documents card
 * - Close Docs -> hides View Documents card
 */

const ARP_ICONS = {
  SEARCH: cilSearch,
  USER: cilUser,
  VIEW: cilZoom,
  DOWNLOAD: cilCloudDownload,
}

const circleBtnStyle = {
  width: 32,
  height: 32,
  padding: 0,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const avatarStyle = {
  width: 120,
  height: 120,
  objectFit: 'cover',
  borderRadius: '50%',
  border: '4px solid #e9ecef',
}

const badgeColor = (status) => (status === 'Active' ? 'success' : 'secondary')

const studentsSeed = [
  {
    reg: '23MCA01',
    name: 'AJISH .A',
    gender: 'Male',
    sem: 'III',
    programme: 'MCA',
    klass: 'I-MCA',
    section: 'A',
    status: 'Active',
    email: 'ajisha2023@gmail.com',
    yearSpan: '2023 – 24',
    contact: '+91 99940 27264',
  },
  {
    reg: '23MBA02',
    name: 'NEHA .R',
    gender: 'Female',
    sem: 'III',
    programme: 'MBA',
    klass: 'I-MBA',
    section: 'B',
    status: 'Active',
    email: 'nehar2023@gmail.com',
    yearSpan: '2023 – 24',
    contact: '+91 98888 11111',
  },
]

const placementsSeed = [
  {
    id: 'pl-1',
    year: '2024',
    sem: 'III',
    company: 'TCS',
    position: 'Software Engineer',
    salary: '6 LPA',
    joining: '10/06/2024',
    validUpto: '31/12/2024',
  },
  {
    id: 'pl-2',
    year: '2024',
    sem: 'IV',
    company: 'Infosys',
    position: 'Analyst',
    salary: '5.5 LPA',
    joining: '20/07/2024',
    validUpto: '31/12/2024',
  },
  {
    id: 'pl-3',
    year: '2025',
    sem: 'V',
    company: 'Wipro',
    position: 'Project Engineer',
    salary: '6.5 LPA',
    joining: '15/01/2025',
    validUpto: '30/06/2025',
  },
]

const docCategories = ['Category -1', 'Category -2', 'Category -3']

const StudentPlacements = () => {
  // Phase 1 filters
  const [searchReg, setSearchReg] = useState('')
  const [programme, setProgramme] = useState('')
  const [klass, setKlass] = useState('')
  const [section, setSection] = useState('')

  // Phase visibility
  const [showStudents, setShowStudents] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showPlacement, setShowPlacement] = useState(false)
  const [showDocs, setShowDocs] = useState(false)

  // Selections
  const [selectedReg, setSelectedReg] = useState(null)
  const [selectedPlacementId, setSelectedPlacementId] = useState(null)
  const [docCategory, setDocCategory] = useState(docCategories[0])

  // Pagination (students list)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const programmes = useMemo(() => ['MBA', 'MCA'], [])
  const classes = useMemo(() => ['I-MBA', 'I-MCA'], [])
  const sections = useMemo(() => ['A', 'B'], [])

  const filteredStudents = useMemo(() => {
    const q = String(searchReg || '').trim().toLowerCase()
    return studentsSeed.filter((s) => {
      if (programme && s.programme !== programme) return false
      if (klass && s.klass !== klass) return false
      if (section && s.section !== section) return false
      if (q && !String(s.reg).toLowerCase().includes(q)) return false
      return true
    })
  }, [searchReg, programme, klass, section])

  const total = filteredStudents.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const pageRows = useMemo(() => filteredStudents.slice(startIdx, endIdx), [filteredStudents, startIdx, endIdx])

  const selectedStudent = useMemo(
    () => studentsSeed.find((s) => s.reg === selectedReg) || null,
    [selectedReg],
  )

  // ---------- Handlers (mirror HTML script) ----------
  const onFindStudents = () => {
    setShowStudents(true)
    setShowProfile(false)
    setShowPlacement(false)
    setShowDocs(false)
    setSelectedReg(null)
    setSelectedPlacementId(null)
    setPage(1)
  }

  const onViewProfile = () => {
    if (!selectedReg) {
      window.alert('Please select a student first.')
      return
    }
    setShowProfile(true)
    setShowPlacement(false)
    setShowDocs(false)
  }

  const onCloseProfile = () => {
    setShowProfile(false)
    setShowPlacement(false)
    setShowDocs(false)
  }

  const onViewPlacement = () => {
    if (!selectedReg) {
      window.alert('Please select a student first.')
      return
    }
    setShowPlacement(true)
    setShowDocs(false)
  }

  const onGlobalDocsView = () => setShowDocs(true)
  const onCloseDocs = () => setShowDocs(false)
  const onDownload = () => window.alert('Download (demo)')

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= PHASE 1: STUDENT PLACEMENT SEARCH ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Student Placement Search</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={(e) => e.preventDefault()}>
              <CRow className="g-3 align-items-center">
                <CCol xs={12} md={3}>
                  <CFormLabel className="mb-0">Register Number</CFormLabel>
                </CCol>
                <CCol xs={12} md={3}>
                  <CFormInput value={searchReg} onChange={(e) => setSearchReg(e.target.value)} placeholder="Register Number" />
                </CCol>

                <CCol xs={12} md={3}>
                  <CFormLabel className="mb-0">Programme</CFormLabel>
                </CCol>
                <CCol xs={12} md={3}>
                  <CFormSelect value={programme} onChange={(e) => setProgramme(e.target.value)}>
                    <option value="">Programme</option>
                    {programmes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} md={3}>
                  <CFormLabel className="mb-0">Class</CFormLabel>
                </CCol>
                <CCol xs={12} md={3}>
                  <CFormSelect value={klass} onChange={(e) => setKlass(e.target.value)}>
                    <option value="">Class</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} md={3}>
                  <CFormLabel className="mb-0">Section</CFormLabel>
                </CCol>
                <CCol xs={12} md={3}>
                  <CFormSelect value={section} onChange={(e) => setSection(e.target.value)}>
                    <option value="">Section</option>
                    {sections.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end">
                  <ArpButton label="Find Students" icon="search" color="primary" onClick={onFindStudents} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= PHASE 2: LIST OF STUDENTS ================= */}
        {showStudents && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>List of Students</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                <CInputGroup size="sm" style={{ width: 260, flex: '0 0 auto' }}>
                  <CInputGroupText>
                    <CIcon icon={ARP_ICONS.SEARCH} />
                  </CInputGroupText>
                  <CFormInput
                    value={searchReg}
                    onChange={(e) => {
                      setSearchReg(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Search Reg No..."
                  />
                </CInputGroup>

                <CFormSelect
                  size="sm"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  style={{ width: 120, flex: '0 0 auto' }}
                  title="Rows per page"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </CFormSelect>

                <CButton color="success" size="sm" disabled={!selectedReg} onClick={onViewProfile}>
                  <CIcon icon={ARP_ICONS.USER} className="me-2" />
                  View Profile
                </CButton>
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle" className="mb-2 text-center">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>
                    <CTableHeaderCell>Reg. No.</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Gender</CTableHeaderCell>
                    <CTableHeaderCell>Semester</CTableHeaderCell>
                    <CTableHeaderCell>Programme</CTableHeaderCell>
                    <CTableHeaderCell>Class</CTableHeaderCell>
                    <CTableHeaderCell>Section</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {pageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={9} className="text-center py-4">
                        No records found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    pageRows.map((s) => (
                      <CTableRow key={s.reg}>
                        <CTableDataCell className="text-center">
                          <input
                            type="radio"
                            name="studentSelect"
                            checked={selectedReg === s.reg}
                            onChange={() => setSelectedReg(s.reg)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>{s.reg}</CTableDataCell>
                        <CTableDataCell>{s.name}</CTableDataCell>
                        <CTableDataCell>{s.gender}</CTableDataCell>
                        <CTableDataCell>{s.sem}</CTableDataCell>
                        <CTableDataCell>{s.programme}</CTableDataCell>
                        <CTableDataCell>{s.klass}</CTableDataCell>
                        <CTableDataCell>{s.section}</CTableDataCell>
                        <CTableDataCell>
                          <span className={`badge bg-${badgeColor(s.status)}`}>{s.status}</span>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              <ArpPagination
                page={safePage}
                totalPages={totalPages}
                onChange={setPage}
                size="sm"
                align="end"
                prevText="Previous"
                nextText="Next"
              />
            </CCardBody>
          </CCard>
        )}

        {/* ================= PHASE 3: STUDENT PROFILE ================= */}
        {showProfile && selectedStudent && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Student Profile</strong>
            </CCardHeader>

            <CCardBody>
              <CTable responsive align="middle" className="mb-0">
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell rowSpan={3} className="text-center" style={{ width: 160 }}>
                      <img
                        src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=300&q=80"
                        alt="avatar"
                        style={avatarStyle}
                      />
                    </CTableDataCell>

                    <CTableDataCell className="fw-bold">{selectedStudent.name}</CTableDataCell>

                    <CTableDataCell colSpan={5} />
                  </CTableRow>

                  <CTableRow>
                    <CTableDataCell>
                      {selectedStudent.reg} | {selectedStudent.programme} | {selectedStudent.sem} | {selectedStudent.yearSpan}
                    </CTableDataCell>
                    <CTableDataCell colSpan={5}></CTableDataCell>
                  </CTableRow>

                  <CTableRow>
                    <CTableDataCell>
                      {selectedStudent.email} | {selectedStudent.contact}
                    </CTableDataCell>
                    <CTableDataCell colSpan={4}></CTableDataCell>
                    <CTableDataCell className="text-center">
                      <CButton color="info" size="sm" onClick={onViewPlacement}>
                        View Placement
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* ================= PHASE 4: PLACEMENT DETAILS ================= */}
        {showPlacement && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Placement Details</strong>
            </CCardHeader>

            <CCardBody>
              <div className="d-flex justify-content-end mb-2">
                <CButton color="primary" size="sm" style={circleBtnStyle} title="View Documents" onClick={onGlobalDocsView}>
                  <CIcon icon={ARP_ICONS.VIEW} />
                </CButton>
              </div>

              <CTable hover responsive align="middle" className="mb-0 text-center">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>
                    <CTableHeaderCell>Year</CTableHeaderCell>
                    <CTableHeaderCell>Sem</CTableHeaderCell>
                    <CTableHeaderCell>Name of the Company</CTableHeaderCell>
                    <CTableHeaderCell>Offer Position</CTableHeaderCell>
                    <CTableHeaderCell>Salary</CTableHeaderCell>
                    <CTableHeaderCell>Joining Date</CTableHeaderCell>
                    <CTableHeaderCell>Offer Valid Up To</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {placementsSeed.map((p) => (
                    <CTableRow key={p.id}>
                      <CTableDataCell className="text-center">
                        <input
                          type="radio"
                          name="placementSelect"
                          checked={selectedPlacementId === p.id}
                          onChange={() => setSelectedPlacementId(p.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{p.year}</CTableDataCell>
                      <CTableDataCell>{p.sem}</CTableDataCell>
                      <CTableDataCell>{p.company}</CTableDataCell>
                      <CTableDataCell>{p.position}</CTableDataCell>
                      <CTableDataCell>{p.salary}</CTableDataCell>
                      <CTableDataCell>{p.joining}</CTableDataCell>
                      <CTableDataCell>{p.validUpto}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* ================= VIEW DOCUMENTS ================= */}
        {showPlacement && showDocs && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>View Documents</strong>
            </CCardHeader>
            <CCardBody>
              <CRow className="fw-semibold mb-2">
                <CCol xs={12} md={6}>
                  Document Category
                </CCol>
                <CCol xs={12} md={6}>
                  View / Download Document
                </CCol>
              </CRow>

              <CRow className="g-2 align-items-center">
                <CCol xs={12} md={6}>
                  <CFormSelect value={docCategory} onChange={(e) => setDocCategory(e.target.value)}>
                    {docCategories.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} md={6} className="d-flex gap-3 align-items-center">
                  <CButton color="primary" style={circleBtnStyle} title="View" onClick={() => window.alert('View (demo)')}>
                    <CIcon icon={ARP_ICONS.VIEW} />
                  </CButton>
                  <CButton color="success" style={circleBtnStyle} title="Download" onClick={onDownload}>
                    <CIcon icon={ARP_ICONS.DOWNLOAD} />
                  </CButton>
                </CCol>
              </CRow>

              <div className="text-end mt-3">
                <CButton color="danger" size="sm" onClick={onCloseDocs}>
                  Close
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default StudentPlacements
