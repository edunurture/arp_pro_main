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
import {
  cilSearch,
  cilUser,
  cilZoom,
  cilPencil,
  cilCloudDownload,
  cilPrint,
} from '@coreui/icons'

import { ArpButton, ArpPagination, ArpIconButton } from '../../components/common'
import { lmsService, resolveMediaUrl } from '../../services/lmsService'
import './student-info-theme.css'

/**
 * Student Extra Curricular Activities (converted from student_extra_curricular.html)
 * Sidebar: Setup > Student Extra Curricular
 *
 * Flow (same as HTML):
 * Phase 1: Find Students
 * Phase 2: List of Students (radio select + View Profile)
 * Phase 3: Student Profile (choose profile category -> View)
 * Phase 4: Sports Activities (global view -> Sports Documents)
 * Phase 5: Cultural Activities (global view -> Cultural Documents)
 */

const ARP_ICONS = {
  SEARCH: cilSearch,
  USER: cilUser,
  VIEW: cilZoom,
  EDIT: cilPencil,
  DOWNLOAD: cilCloudDownload,
  PRINT: cilPrint,}

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
  { reg: '23MCA01', name: 'AJISH .A', gender: 'Male', sem: '3', programme: 'MCA', klass: 'I-MCA', section: 'A', status: 'Active' },
  { reg: '23MCA02', name: 'PRIYA .K', gender: 'Female', sem: '3', programme: 'MCA', klass: 'I-MCA', section: 'B', status: 'Active' },
  { reg: '23MBA11', name: 'RAHUL .S', gender: 'Male', sem: '1', programme: 'MBA', klass: 'I-MBA', section: 'A', status: 'On Leave' },
]

const sportsSeed = [
  { id: 'sports-1', year: '2024', sem: '3', sport: 'Football', event: 'Inter-College Cup', level: 'Zonal', start: '2024-01-10', end: '2024-01-12' },
  { id: 'sports-2', year: '2024', sem: '2', sport: 'Badminton', event: 'Shuttle Fest', level: 'District', start: '2024-02-03', end: '2024-02-03' },
  { id: 'sports-3', year: '2023', sem: '1', sport: 'Athletics', event: '100m Sprint', level: 'College', start: '2023-09-18', end: '2023-09-18' },
]

const culturalSeed = [
  { id: 'cult-1', year: '2025', sem: '3', cultural: 'Solo Singing', event: 'Voice of Campus', level: 'College', start: '2025-08-01', end: '2025-08-01' },
  { id: 'cult-2', year: '2024', sem: '2', cultural: 'Group Dance', event: 'Rhythm Fest', level: 'Zonal', start: '2024-10-10', end: '2024-10-10' },
  { id: 'cult-3', year: '2023', sem: '1', cultural: 'Dramatics', event: 'Stagecraft', level: 'District', start: '2023-11-21', end: '2023-11-21' },
]

const docCategories = ['Category -1', 'Category -2', 'Category -3']

const StudentExtraCurricular = () => {
  // Phase 1 (Search filters)
  const [searchReg, setSearchReg] = useState('')
  const [programme, setProgramme] = useState('')
  const [klass, setKlass] = useState('')
  const [section, setSection] = useState('')

  // Mock data
  const [students, setStudents] = useState(studentsSeed)
  const [sportsRows, setSportsRows] = useState(sportsSeed)
  const [culturalRows, setCulturalRows] = useState(culturalSeed)

  // Selection
  const [selectedReg, setSelectedReg] = useState(null)
  const [selectedSportId, setSelectedSportId] = useState(null)
  const [selectedCulturalId, setSelectedCulturalId] = useState(null)

  // Phase visibility
  const [showStudents, setShowStudents] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  // Category view
  const [profileCategory, setProfileCategory] = useState('Sports Activities')
  const [activeCategory, setActiveCategory] = useState(null) // 'Sports Activities' | 'Cultural Activities' | null

  // Documents cards
  const [showSportsDocs, setShowSportsDocs] = useState(false)
  const [showCulturalDocs, setShowCulturalDocs] = useState(false)
  const [sportsDocCategory, setSportsDocCategory] = useState(docCategories[0])
  const [culturalDocCategory, setCulturalDocCategory] = useState(docCategories[0])
  const [sportsDocSearch, setSportsDocSearch] = useState('')
  const [culturalDocSearch, setCulturalDocSearch] = useState('')
  const sportsDocCategories = useMemo(
    () => [...new Set([...docCategories, ...sportsRows.map((r) => r.documentCategory).filter(Boolean)])],
    [sportsRows],
  )
  const culturalDocCategories = useMemo(
    () => [...new Set([...docCategories, ...culturalRows.map((r) => r.documentCategory).filter(Boolean)])],
    [culturalRows],
  )
  const filteredSportsDocs = useMemo(
    () => {
      const q = String(sportsDocSearch || '').trim().toLowerCase()
      return sportsRows.filter((r) => {
        if (sportsDocCategory && r.documentCategory !== sportsDocCategory) return false
        if (!q) return true
        const name = String(r.fileName || `${r.sport || 'Activity'} - Document`).toLowerCase()
        return name.includes(q)
      })
    },
    [sportsRows, sportsDocCategory, sportsDocSearch],
  )
  const filteredCulturalDocs = useMemo(
    () => {
      const q = String(culturalDocSearch || '').trim().toLowerCase()
      return culturalRows.filter((r) => {
        if (culturalDocCategory && r.documentCategory !== culturalDocCategory) return false
        if (!q) return true
        const name = String(r.fileName || `${r.cultural || 'Activity'} - Document`).toLowerCase()
        return name.includes(q)
      })
    },
    [culturalRows, culturalDocCategory, culturalDocSearch],
  )
  const sportsDocPairs = useMemo(() => {
    const out = []
    for (let i = 0; i < filteredSportsDocs.length; i += 2) out.push([filteredSportsDocs[i], filteredSportsDocs[i + 1] || null])
    return out
  }, [filteredSportsDocs])
  const culturalDocPairs = useMemo(() => {
    const out = []
    for (let i = 0; i < filteredCulturalDocs.length; i += 2) out.push([filteredCulturalDocs[i], filteredCulturalDocs[i + 1] || null])
    return out
  }, [filteredCulturalDocs])

  // Phase 2 pagination (API-ready)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filteredStudents = useMemo(() => {
    const q = String(searchReg || '').trim().toLowerCase()
    return students.filter((s) => {
      if (programme && s.programme !== programme) return false
      if (klass && s.klass !== klass) return false
      if (section && s.section !== section) return false
      if (q && !String(s.reg).toLowerCase().includes(q)) return false
      return true
    })
  }, [students, searchReg, programme, klass, section])

  const total = filteredStudents.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const pageRows = useMemo(() => filteredStudents.slice(startIdx, endIdx), [filteredStudents, startIdx, endIdx])

  const selectedStudent = useMemo(
    () => students.find((s) => s.reg === selectedReg) || null,
    [students, selectedReg],
  )

  const yearSpan = useMemo(() => {
    const y = new Date().getFullYear()
    return `${y - 1} – ${String(y).slice(2)}`
  }, [])

  // ---------- Handlers (mirror HTML script behavior) ----------
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
          contact: r.contact || r.mobile || '',
        })),
      )
    } catch {
      setStudents([])
    }
    setShowStudents(true)
    setShowProfile(false)
    setActiveCategory(null)
    setShowSportsDocs(false)
    setShowCulturalDocs(false)
    setSelectedReg(null)
    setSelectedSportId(null)
    setSelectedCulturalId(null)
    setPage(1)
  }

  const onViewProfile = () => {
    if (!selectedReg) {
      window.alert('Please select a student first.')
      return
    }
    setShowProfile(true)
    setActiveCategory(null)
    setShowSportsDocs(false)
    setShowCulturalDocs(false)
  }

  const onCancelProfile = () => {
    setShowProfile(false)
    setActiveCategory(null)
    setShowSportsDocs(false)
    setShowCulturalDocs(false)
  }

  const onViewCategory = async () => {
    if (!selectedReg) {
      window.alert('Please select a student first.')
      return
    }
    try {
      const payload = await lmsService.getStudentProfileExtraCurricular(
        selectedReg,
        profileCategory === 'Sports Activities' ? 'SPORTS' : 'CULTURAL',
      )
      const records = Array.isArray(payload?.records) ? payload.records : []
      if (profileCategory === 'Sports Activities') {
        const rows = records.map((r) => ({
            id: r.id,
            year: r.year,
            sem: r.sem,
            sport: r.activityName,
            event: r.event,
            level: r.level,
            start: r.start,
            end: r.end,
            documentCategory: r.documentCategory || 'Category -1',
            filePath: r.filePath || '',
            fileName: r.fileName || '',
          }))
        setSportsRows(rows)
        setSelectedSportId(rows[0]?.id || null)
        setSportsDocCategory(rows[0]?.documentCategory || docCategories[0])
      } else {
        const rows = records.map((r) => ({
            id: r.id,
            year: r.year,
            sem: r.sem,
            cultural: r.activityName,
            event: r.event,
            level: r.level,
            start: r.start,
            end: r.end,
            documentCategory: r.documentCategory || 'Category -1',
            filePath: r.filePath || '',
            fileName: r.fileName || '',
          }))
        setCulturalRows(rows)
        setSelectedCulturalId(rows[0]?.id || null)
        setCulturalDocCategory(rows[0]?.documentCategory || docCategories[0])
      }
    } catch {
      if (profileCategory === 'Sports Activities') {
        setSportsRows(sportsSeed)
        setSelectedSportId(sportsSeed[0]?.id || null)
        setSportsDocCategory(sportsSeed[0]?.documentCategory || docCategories[0])
      } else {
        setCulturalRows(culturalSeed)
        setSelectedCulturalId(culturalSeed[0]?.id || null)
        setCulturalDocCategory(culturalSeed[0]?.documentCategory || docCategories[0])
      }
    }
    setActiveCategory(profileCategory)
    setShowSportsDocs(false)
    setShowCulturalDocs(false)
  }

  const onSportsGlobalView = () => setShowSportsDocs(true)
  const onCulturalGlobalView = () => setShowCulturalDocs(true)
  const onCloseSportsDocs = () => setShowSportsDocs(false)
  const onCloseCulturalDocs = () => setShowCulturalDocs(false)

  const onEdit = () => window.alert('Edit (demo)')
  const openExtraDocument = async (kind, action = 'view', explicitRecord = null) => {
    const rows = kind === 'sports' ? sportsRows : culturalRows
    const selectedId = kind === 'sports' ? selectedSportId : selectedCulturalId
    const selectedCategory = kind === 'sports' ? sportsDocCategory : culturalDocCategory
    const selected = rows.find((r) => String(r.id) === String(selectedId))
    const byCategory = rows.find((r) => String(r.documentCategory || '') === String(selectedCategory || ''))
    const record = explicitRecord || selected || byCategory || rows[0] || null
    if (!record?.id) {
      window.alert('Please select an activity record first.')
      return
    }
    try {
      const meta = await lmsService.getStudentProfileRecordDocument('extra', record.id)
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
  const onPrint = () => window.print()
  const programmes = useMemo(() => [...new Set(students.map((s) => s.programme).filter(Boolean))], [students])
  const classes = useMemo(() => [...new Set(students.map((s) => s.klass).filter(Boolean))], [students])
  const sections = useMemo(() => [...new Set(students.map((s) => s.section).filter(Boolean))], [students])

  return (
    <CRow className="student-info-screen">
      <CCol xs={12}>
        {/* ================= PHASE 1: EXTRA CURRICULAR ACTIVITIES (FIND) ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Extra Curricular Activities</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={(e) => e.preventDefault()}>
              {/* 4-column layout (label/control pairs) */}
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

              {/* Toolbar (search + page size + action) */}
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

                <CButton
                  color="secondary"
                  size="sm"
                  disabled={!selectedReg}
                  onClick={onViewProfile}
                  title="View Profile"
                >
                  <CIcon icon={ARP_ICONS.USER} className="me-2" />
                  View Profile
                </CButton>
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle" className="mb-2">
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
                            name="selStudent"
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
                        alt="Student"
                        style={avatarStyle}
                      />
                    </CTableDataCell>

                    <CTableDataCell className="fw-bold fs-5">{selectedStudent.name}</CTableDataCell>

                    <CTableDataCell colSpan={5} className="text-end">
                      {/* Actions removed as per requirement */}
                    </CTableDataCell>
                  </CTableRow>

                  <CTableRow>
                    <CTableDataCell>
                      {safeText(selectedStudent.reg)} | {programmeDisplayText(selectedStudent)} |{' '}
                      {currentClassSectionSemText(selectedStudent)} | {safeText(selectedStudent.yearSpan || yearSpan)}
                    </CTableDataCell>
                    <CTableDataCell colSpan={5}></CTableDataCell>
                  </CTableRow>

                  <CTableRow>
                    <CTableDataCell>
                      {safeText(selectedStudent.email)} | {safeText(selectedStudent.contact)}
                    </CTableDataCell>

                    <CTableDataCell colSpan={2} className="fw-semibold">
                      Choose Profile Category
                    </CTableDataCell>

                    <CTableDataCell colSpan={2}>
                      <CFormSelect
                        size="sm"
                        value={profileCategory}
                        onChange={(e) => setProfileCategory(e.target.value)}
                        title="Choose Profile Category"
                      >
                        <option>Sports Activities</option>
                        <option>Cultural Activities</option>
                      </CFormSelect>
                    </CTableDataCell>

                    <CTableDataCell>
                      <CButton color="primary" size="sm" className="w-100" onClick={onViewCategory}>
                        View
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* ================= PHASE 4: SPORTS ACTIVITIES ================= */}
        {showProfile && activeCategory === 'Sports Activities' && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Sports Activities</strong>
            </CCardHeader>

            <CCardBody>
              <div className="d-flex justify-content-end mb-2">
                <CButton color="primary" size="sm" style={circleBtnStyle} title="View Documents" onClick={onSportsGlobalView}>
                  <CIcon icon={ARP_ICONS.VIEW} />
                </CButton>
              </div>

              <CTable hover responsive align="middle" className="mb-0">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>
                    <CTableHeaderCell>Year</CTableHeaderCell>
                    <CTableHeaderCell>Sem</CTableHeaderCell>
                    <CTableHeaderCell>Name of the Sport</CTableHeaderCell>
                    <CTableHeaderCell>Event Name</CTableHeaderCell>
                    <CTableHeaderCell>Level</CTableHeaderCell>
                    <CTableHeaderCell>Start Date</CTableHeaderCell>
                    <CTableHeaderCell>End Date</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {sportsRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <input
                          type="radio"
                          name="selSport"
                          checked={selectedSportId === r.id}
                          onChange={() => setSelectedSportId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.year}</CTableDataCell>
                      <CTableDataCell>{r.sem}</CTableDataCell>
                      <CTableDataCell>{r.sport}</CTableDataCell>
                      <CTableDataCell>{r.event}</CTableDataCell>
                      <CTableDataCell>{r.level}</CTableDataCell>
                      <CTableDataCell>{r.start}</CTableDataCell>
                      <CTableDataCell>{r.end}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* SPORTS DOCUMENTS CARD */}
        {showProfile && activeCategory === 'Sports Activities' && showSportsDocs && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Sports Documents</strong>
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
                  <CFormSelect value={sportsDocCategory} onChange={(e) => setSportsDocCategory(e.target.value)}>
                    {sportsDocCategories.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} md={6} className="d-flex gap-2 align-items-center">
                  <ArpIconButton icon="view" color="primary" size={32} onClick={() => openExtraDocument('sports', 'view')} />
                  <ArpIconButton icon="download" color="success" size={32} onClick={() => openExtraDocument('sports', 'download')} />
                  <ArpIconButton icon="print" color="warning" size={32} onClick={() => openExtraDocument('sports', 'print')} />
                </CCol>
              </CRow>
              <CRow className="g-2 align-items-center mt-2">
                <CCol xs={12}>
                  <CFormInput
                    value={sportsDocSearch}
                    onChange={(e) => setSportsDocSearch(e.target.value)}
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
                  {sportsDocPairs.map(([left, right], idx) => (
                    <CTableRow key={`sports-doc-pair-${idx}`}>
                      <CTableDataCell className="text-center">
                        {left ? (
                          <input
                            type="radio"
                            name="sportsDocSelect"
                            checked={selectedSportId === left.id}
                            onChange={() => setSelectedSportId(left.id)}
                          />
                        ) : null}
                      </CTableDataCell>
                      <CTableDataCell>
                        {left ? safeText(left.fileName || `${left.sport || 'Activity'} - Document`) : ''}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        {right ? (
                          <input
                            type="radio"
                            name="sportsDocSelect"
                            checked={selectedSportId === right.id}
                            onChange={() => setSelectedSportId(right.id)}
                          />
                        ) : null}
                      </CTableDataCell>
                      <CTableDataCell>
                        {right ? safeText(right.fileName || `${right.sport || 'Activity'} - Document`) : ''}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="text-end mt-3">
                <CButton color="secondary" variant="outline" size="sm" onClick={onCloseSportsDocs}>
                  Close
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        )}

        {/* ================= PHASE 5: CULTURAL ACTIVITIES ================= */}
        {showProfile && activeCategory === 'Cultural Activities' && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Cultural Activities</strong>
            </CCardHeader>

            <CCardBody>
              <div className="d-flex justify-content-end mb-2">
                <CButton
                  color="primary"
                  size="sm"
                  style={circleBtnStyle}
                  title="View Documents"
                  onClick={onCulturalGlobalView}
                >
                  <CIcon icon={ARP_ICONS.VIEW} />
                </CButton>
              </div>

              <CTable hover responsive align="middle" className="mb-0">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>
                    <CTableHeaderCell>Year</CTableHeaderCell>
                    <CTableHeaderCell>Sem</CTableHeaderCell>
                    <CTableHeaderCell>Name of the Cultural</CTableHeaderCell>
                    <CTableHeaderCell>Event Name</CTableHeaderCell>
                    <CTableHeaderCell>Level</CTableHeaderCell>
                    <CTableHeaderCell>Start Date</CTableHeaderCell>
                    <CTableHeaderCell>End Date</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {culturalRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <input
                          type="radio"
                          name="selCultural"
                          checked={selectedCulturalId === r.id}
                          onChange={() => setSelectedCulturalId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.year}</CTableDataCell>
                      <CTableDataCell>{r.sem}</CTableDataCell>
                      <CTableDataCell>{r.cultural}</CTableDataCell>
                      <CTableDataCell>{r.event}</CTableDataCell>
                      <CTableDataCell>{r.level}</CTableDataCell>
                      <CTableDataCell>{r.start}</CTableDataCell>
                      <CTableDataCell>{r.end}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* CULTURAL DOCUMENTS CARD */}
        {showProfile && activeCategory === 'Cultural Activities' && showCulturalDocs && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Cultural Documents</strong>
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
                  <CFormSelect value={culturalDocCategory} onChange={(e) => setCulturalDocCategory(e.target.value)}>
                    {culturalDocCategories.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} md={6} className="d-flex gap-2 align-items-center">
                  <ArpIconButton icon="view" color="primary" size={32} onClick={() => openExtraDocument('cultural', 'view')} />
                  <ArpIconButton icon="download" color="success" size={32} onClick={() => openExtraDocument('cultural', 'download')} />
                  <ArpIconButton icon="print" color="warning" size={32} onClick={() => openExtraDocument('cultural', 'print')} />
                </CCol>
              </CRow>
              <CRow className="g-2 align-items-center mt-2">
                <CCol xs={12}>
                  <CFormInput
                    value={culturalDocSearch}
                    onChange={(e) => setCulturalDocSearch(e.target.value)}
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
                  {culturalDocPairs.map(([left, right], idx) => (
                    <CTableRow key={`cultural-doc-pair-${idx}`}>
                      <CTableDataCell className="text-center">
                        {left ? (
                          <input
                            type="radio"
                            name="culturalDocSelect"
                            checked={selectedCulturalId === left.id}
                            onChange={() => setSelectedCulturalId(left.id)}
                          />
                        ) : null}
                      </CTableDataCell>
                      <CTableDataCell>
                        {left ? safeText(left.fileName || `${left.cultural || 'Activity'} - Document`) : ''}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        {right ? (
                          <input
                            type="radio"
                            name="culturalDocSelect"
                            checked={selectedCulturalId === right.id}
                            onChange={() => setSelectedCulturalId(right.id)}
                          />
                        ) : null}
                      </CTableDataCell>
                      <CTableDataCell>
                        {right ? safeText(right.fileName || `${right.cultural || 'Activity'} - Document`) : ''}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="text-end mt-3">
                <CButton color="secondary" variant="outline" size="sm" onClick={onCloseCulturalDocs}>
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

export default StudentExtraCurricular
