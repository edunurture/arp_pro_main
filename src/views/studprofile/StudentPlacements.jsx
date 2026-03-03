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
import { ArpButton, ArpPagination, ArpIconButton } from '../../components/common'
import { lmsService, resolveMediaUrl } from '../../services/lmsService'
import './student-info-theme.css'

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
const safeText = (v) => {
  const text = String(v ?? '').trim()
  return text || 'XX'
}
const programmeDisplayText = (s) => {
  const code = String(s?.programmeCode || s?.programme || '').trim()
  const name = String(s?.programmeName || '').trim()
  if (code && name && code.toLowerCase() !== name.toLowerCase()) return `${code} - ${name}`
  return safeText(code || name)
}
const currentClassSectionSemText = (s) => {
  const klass = String(s?.klass || '').trim()
  const section = String(s?.section || '').trim()
  const sem = String(s?.sem || '').trim()
  const classSection = [klass, section].filter(Boolean).join(' - ')
  return [classSection || 'XX', sem ? `Sem ${sem}` : 'Sem XX'].join(' | ')
}

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
  const [docSearch, setDocSearch] = useState('')

  // Pagination (students list)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [students, setStudents] = useState(studentsSeed)
  const [placementRows, setPlacementRows] = useState(placementsSeed)

  const programmes = useMemo(() => [...new Set(students.map((s) => s.programme).filter(Boolean))], [students])
  const classes = useMemo(() => [...new Set(students.map((s) => s.klass).filter(Boolean))], [students])
  const sections = useMemo(() => [...new Set(students.map((s) => s.section).filter(Boolean))], [students])

  const filteredStudents = useMemo(() => {
    const q = String(searchReg || '').trim().toLowerCase()
    return students.filter((s) => {
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

  const selectedStudent = useMemo(() => students.find((s) => s.reg === selectedReg) || null, [students, selectedReg])
  const selectedPlacement = useMemo(
    () => placementRows.find((p) => String(p.id) === String(selectedPlacementId)) || null,
    [placementRows, selectedPlacementId],
  )
  const placementDocCategories = useMemo(
    () => [...new Set([...docCategories, ...placementRows.map((p) => p.documentCategory).filter(Boolean)])],
    [placementRows],
  )
  const filteredPlacementDocs = useMemo(
    () => {
      const q = String(docSearch || '').trim().toLowerCase()
      return placementRows.filter((r) => {
        if (docCategory && r.documentCategory !== docCategory) return false
        if (!q) return true
        const name = String(r.fileName || `${r.company || 'Placement'} - Document`).toLowerCase()
        return name.includes(q)
      })
    },
    [placementRows, docCategory, docSearch],
  )
  const placementDocPairs = useMemo(() => {
    const out = []
    for (let i = 0; i < filteredPlacementDocs.length; i += 2) out.push([filteredPlacementDocs[i], filteredPlacementDocs[i + 1] || null])
    return out
  }, [filteredPlacementDocs])

  // ---------- Handlers (mirror HTML script) ----------
  const onFindStudents = async () => {
    try {
      const rows = await lmsService.listStudentProfiles({
        registerNumber: searchReg,
        programme,
        className: klass,
        section,
      })
      setStudents(
        rows.map((r) => ({
          reg: r.reg || r.regNo || r.registerNumber || '',
          name: r.name || r.firstName || '',
          gender: r.gender || '',
          sem: r.sem || r.semester || '',
          programme: r.programme || '',
          programmeCode: r.programmeCode || r.programme || '',
          programmeName: r.programmeName || '',
          klass: r.klass || r.className || '',
          section: r.section || '',
          status: r.status || 'Active',
          email: r.email || '',
          yearSpan: r.yearSpan || '',
          contact: r.contact || r.mobile || '',
        })),
      )
    } catch {
      setStudents([])
    }
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

  const onViewPlacement = async () => {
    if (!selectedReg) {
      window.alert('Please select a student first.')
      return
    }
    try {
      const payload = await lmsService.getStudentProfilePlacements(selectedReg)
      const rows = Array.isArray(payload?.records) && payload.records.length ? payload.records : placementsSeed
      setPlacementRows(rows)
      setSelectedPlacementId(rows[0]?.id || null)
      setDocCategory(rows[0]?.documentCategory || docCategories[0])
    } catch {
      setPlacementRows(placementsSeed)
      setSelectedPlacementId(placementsSeed[0]?.id || null)
      setDocCategory(placementsSeed[0]?.documentCategory || docCategories[0])
    }
    setShowPlacement(true)
    setShowDocs(false)
  }

  const onGlobalDocsView = () => setShowDocs(true)
  const onCloseDocs = () => setShowDocs(false)
  const resolvePlacementDocumentRecord = () => {
    if (selectedPlacement?.id) return selectedPlacement
    const byCategory = placementRows.find((r) => String(r.documentCategory || '') === String(docCategory || ''))
    return byCategory || placementRows[0] || null
  }

  const openPlacementDocument = async (action = 'view', explicitRecord = null) => {
    const record = explicitRecord || resolvePlacementDocumentRecord()
    if (!record?.id) {
      window.alert('Please select a placement record first.')
      return
    }
    try {
      const meta = await lmsService.getStudentProfileRecordDocument('placements', record.id)
      const url = resolveMediaUrl(meta?.filePath || record.filePath)
      if (!url) {
        window.alert('No document available for the selected record.')
        return
      }
      if (action === 'download') {
        const link = document.createElement('a')
        link.href = url
        link.download = meta?.fileName || record.fileName || 'document'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
      if (action === 'print') {
        const win = window.open(url, '_blank', 'noopener,noreferrer')
        if (win) {
          win.onload = () => win.print()
        }
        return
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      window.alert('Failed to load document metadata.')
    }
  }

  return (
    <CRow className="student-info-screen">
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
                        <CTableDataCell>{programmeDisplayText(s)}</CTableDataCell>
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
                      {safeText(selectedStudent.reg)} | {programmeDisplayText(selectedStudent)} |{' '}
                      {currentClassSectionSemText(selectedStudent)} | {safeText(selectedStudent.yearSpan)}
                    </CTableDataCell>
                    <CTableDataCell colSpan={5}></CTableDataCell>
                  </CTableRow>

                  <CTableRow>
                    <CTableDataCell>
                      {safeText(selectedStudent.email)} | {safeText(selectedStudent.contact)}
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
                  {placementRows.map((p) => (
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
                  View / Download / Print
                </CCol>
              </CRow>

              <CRow className="g-2 align-items-center">
                <CCol xs={12} md={6}>
                  <CFormSelect value={docCategory} onChange={(e) => setDocCategory(e.target.value)}>
                    {placementDocCategories.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} md={6} className="d-flex gap-2 align-items-center">
                  <ArpIconButton icon="view" color="primary" size={32} onClick={() => openPlacementDocument('view')} />
                  <ArpIconButton icon="download" color="success" size={32} onClick={() => openPlacementDocument('download')} />
                  <ArpIconButton icon="print" color="warning" size={32} onClick={() => openPlacementDocument('print')} />
                </CCol>
              </CRow>
              <CRow className="g-2 align-items-center mt-2">
                <CCol xs={12}>
                  <CFormInput
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="Search document..."
                  />
                </CCol>
              </CRow>

              <CTable bordered responsive align="middle" className="mt-3">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>
                    <CTableHeaderCell>Document</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>
                    <CTableHeaderCell>Document</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {placementDocPairs.map(([left, right], idx) => (
                    <CTableRow key={`placement-doc-pair-${idx}`}>
                      <CTableDataCell className="text-center">
                        {left ? (
                          <input
                            type="radio"
                            name="placementDocSelect"
                            checked={selectedPlacementId === left.id}
                            onChange={() => setSelectedPlacementId(left.id)}
                          />
                        ) : null}
                      </CTableDataCell>
                      <CTableDataCell>
                        {left ? safeText(left.fileName || `${left.company || 'Placement'} - Document`) : ''}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        {right ? (
                          <input
                            type="radio"
                            name="placementDocSelect"
                            checked={selectedPlacementId === right.id}
                            onChange={() => setSelectedPlacementId(right.id)}
                          />
                        ) : null}
                      </CTableDataCell>
                      <CTableDataCell>
                        {right ? safeText(right.fileName || `${right.company || 'Placement'} - Document`) : ''}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

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
