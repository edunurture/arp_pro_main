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
  CFormTextarea,
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
} from '@coreui/icons'
const ARP_ICONS = {
  SEARCH: cilSearch,
  USER: cilUser,
  VIEW: cilZoom,
}
import { ArpButton, ArpPagination } from '../../components/common'

/**
 * Student Profile (converted from basic_profile.html)
 * - Multi-phase flow: Find -> List -> Profile -> Category
 * - Uses CoreUI Pro + existing ARP common components where safe (ArpButton, ArpPagination)
 * - Mock data is kept API-ready
 */

const studentsSeed = [
  {
    reg: '23MCA01',
    name: 'AJISH .A',
    gender: 'Male',
    sem: '3',
    programme: 'MCA',
    klass: 'I-MCA',
    section: 'A',
    status: 'Active',
    email: 'ajisha2023@gmail.com',
    yearSpan: '2023 – 24',
    basic: {
      regno: '23MCA01',
      fname: 'AJISH',
      lname: 'A',
      dob: '2003-05-16',
      gender: 'Male',
      email: 'ajisha2023@gmail.com',
      alt_email: 'ajish.alt@example.com',
      contact: '+91 90000 11111',
      whatsapp: '+91 90000 11111',
      religious: 'Hindu',
      communal: 'OBC',
      citizen: 'Indian',
      blood: 'O+',
      address: '123, Example Street, Chennai',
    },
    personal: {
      mtongue: 'Tamil',
      state: 'Tamil Nadu',
      country: 'India',
      fname: 'Anand',
      fmobile: '+91 9xxxx xxxxx',
      mname: 'Lakshmi',
      mmobile: '+91 9xxxx xxxxx',
      gname: 'Ravi',
      gmobile: '+91 9xxxx xxxxx',
      focc: 'Engineer',
      mocc: 'Teacher',
      income: '₹7,50,000',
      aadhaar: 'XXXX-XXXX-1234',
      dl: 'TN01-2020-0000000',
    },
    institute: {
      admno: 'ADM2023-001',
      admdate: '2023-07-10',
      programme: 'MCA',
      branch: 'Computer Applications',
      year: '1',
      batch: '2023-2025',
      sem: '3',
      dept: 'CA',
      tutor: 'Dr. Menon',
      tutor_mobile: '+91 9xxxx xxxxx',
      status: 'Active',
      nss: 'Yes',
      ncc: 'No',
      scholar: 'No',
    },
    education: {
      sslc_pct: '92%',
      pg_deg: '—',
      pg_pct: '—',
      pg_branch: '—',
      sslc_school: 'Govt. HSS',
      pg_yop: '—',
      hsc_pct: '90%',
      hsc_yop: '2021',
      hsc_group: 'CS-Maths',
      pg_inst: '—',
      hsc_school: 'Govt. HSS',
      pg_uni: '—',
      sslc_yop: '2019',
      pg_class: '—',
      ug_deg: 'B.Sc. CS',
      mphil_deg: '—',
      ug_branch: 'Computer Science',
      mphil_branch: '—',
      ug_pct: '82%',
      mphil_yop: '—',
      ug_inst: 'ABC College',
      mphil_inst: '—',
      ug_uni: 'XYZ University',
      mphil_uni: '—',
      ug_yop: '2023',
      mphil_pct: '—',
      ug_class: 'First Class',
      mphil_class: '—',
    },
    other: {
      acct: 'XXXX1234',
      transport: 'No',
      bankname: 'State Bank of India',
      id1: 'Mole on left wrist',
      branch: 'Adyar',
      id2: '—',
      accname: 'AJISH A',
      passport: '—',
      ifsc: 'SBIN0000001',
      issue_date: '—',
      micr: '600002007',
      visa: '—',
      upi: 'ajish@okaxis',
      issue_date2: '—',
      hostler: 'No',
      valid_upto: '—',
    },
  },
  {
    reg: '23MBA07',
    name: 'PRIYA .S',
    gender: 'Female',
    sem: '1',
    programme: 'MBA',
    klass: 'I-MBA',
    section: 'B',
    status: 'Active',
    email: 'priya.s@example.com',
    yearSpan: '2023 – 24',
    basic: {
      regno: '23MBA07',
      fname: 'PRIYA',
      lname: 'S',
      dob: '2004-02-10',
      gender: 'Female',
      email: 'priya.s@example.com',
      alt_email: 'priya.alt@example.com',
      contact: '+91 95555 22222',
      whatsapp: '+91 95555 22222',
      religious: 'Hindu',
      communal: 'OBC',
      citizen: 'Indian',
      blood: 'B+',
      address: '45, Park Road, Coimbatore',
    },
    personal: {
      mtongue: 'Tamil',
      state: 'Tamil Nadu',
      country: 'India',
      fname: 'Suresh',
      fmobile: '+91 9xxxx xxxxx',
      mname: 'Meera',
      mmobile: '+91 9xxxx xxxxx',
      gname: '—',
      gmobile: '—',
      focc: 'Business',
      mocc: 'Homemaker',
      income: '₹9,00,000',
      aadhaar: 'XXXX-XXXX-5678',
      dl: '—',
    },
    institute: {
      admno: 'ADM2023-032',
      admdate: '2023-07-12',
      programme: 'MBA',
      branch: 'Management',
      year: '1',
      batch: '2023-2025',
      sem: '1',
      dept: 'MBA',
      tutor: 'Prof. Rao',
      tutor_mobile: '+91 9xxxx xxxxx',
      status: 'Active',
      nss: 'No',
      ncc: 'No',
      scholar: 'Yes',
    },
    education: {
      sslc_pct: '95%',
      pg_deg: '—',
      pg_pct: '—',
      pg_branch: '—',
      sslc_school: "St. Mary's",
      pg_yop: '—',
      hsc_pct: '93%',
      hsc_yop: '2022',
      hsc_group: 'Commerce',
      pg_inst: '—',
      hsc_school: "St. Mary's",
      pg_uni: '—',
      sslc_yop: '2020',
      pg_class: '—',
      ug_deg: 'B.Com',
      mphil_deg: '—',
      ug_branch: 'Commerce',
      mphil_branch: '—',
      ug_pct: '84%',
      mphil_yop: '—',
      ug_inst: 'DEF College',
      mphil_inst: '—',
      ug_uni: 'UVW University',
      mphil_uni: '—',
      ug_yop: '2023',
      mphil_pct: '—',
      ug_class: 'First Class',
      mphil_class: '—',
    },
    other: {
      acct: 'XXXX9876',
      transport: 'Yes',
      bankname: 'HDFC Bank',
      id1: 'Birthmark on neck',
      branch: 'RS Puram',
      id2: '—',
      accname: 'PRIYA S',
      passport: 'P1234567',
      ifsc: 'HDFC0000123',
      issue_date: '2022-08-01',
      micr: '641240002',
      visa: '—',
      upi: 'priyas@okicici',
      issue_date2: '—',
      hostler: 'Yes',
      valid_upto: '2027-08-01',
    },
  },
]

const docsPairs = [
  ['Application', 'Signature'],
  ['National ID', 'Service Certificate'],
  ['SSLC Mark Statement', 'Community Certificate'],
  ['HSC Mark Statement', 'Entrance Score Card'],
  ['UG Consolidate', 'No Objection Certificate'],
  ['UG Provisional/Degree', 'ID Card'],
  ['PG Consolidate', 'Driving License'],
  ['PG Provisional / Degree', 'PAN Card'],
  ['M.Phil. Consolidate', 'Passbook'],
  ['M.Phil. Degree', 'Single Child Certificate'],
  ['Photo', 'DIVAGON Certificate'],
  ['Transfer Certificate', 'Scholarship Certificate'],
  ['Migration Certificate', 'Other Documents'],
]

const CATEGORIES = [
  'Basic Information',
  'Personal Information',
  'Institute Information',
  'Education Information',
  'Other Information',
  'View Documents',
]

const circleBtnStyle = {
  width: 32,
  height: 32,
  padding: 0,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const badgeColor = (status) => (status === 'Active' ? 'success' : 'secondary')

const StudentProfile = () => {
  // Phase 1 inputs
  const [searchReg, setSearchReg] = useState('')
  const [programme, setProgramme] = useState('')
  const [klass, setKlass] = useState('')
  const [section, setSection] = useState('')

  // Data + selection
  const [students] = useState(studentsSeed)
  const [selectedReg, setSelectedReg] = useState(null)

  // Phase visibility
  const [showStudents, setShowStudents] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showCategory, setShowCategory] = useState(false)

  // Category
  const [category, setCategory] = useState(CATEGORIES[0])
  const [activeCategory, setActiveCategory] = useState(null)

  // Edit mode (demo: read-only like HTML)
  const [isEdit] = useState(false)

  // Documents
  const [selectedDoc, setSelectedDoc] = useState(null)

  // Students list pagination (lightweight, API-ready)
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

  const onFindStudents = () => {
    setShowStudents(true)
    setShowProfile(false)
    setShowCategory(false)
    setActiveCategory(null)
    setSelectedReg(null)
    setSelectedDoc(null)
    setPage(1)
  }

  const onViewProfile = () => {
    if (!selectedReg) return
    setShowProfile(true)
    setShowCategory(false)
    setActiveCategory(null)
  }

  const onViewCategory = () => {
    if (!selectedReg) return
    setShowCategory(true)
    setActiveCategory(category)
    setSelectedDoc(null)
  }

  const onCloseCategory = () => {
    setActiveCategory(null)
    // keep cardCategory visible, but hide the section
  }

  const onPrint = () => window.print()
  const onDownload = () => window.alert('Preparing download... (demo)')
  const onEdit = () => window.alert('Fields are read-only in this demo')
  const onSave = () => window.alert('Saved (demo)')
  const onCancel = () => setActiveCategory(null)

  const programmes = useMemo(() => ['MBA', 'MCA'], [])
  const classes = useMemo(() => ['I-MBA', 'I-MCA'], [])
  const sections = useMemo(() => ['A', 'B'], [])

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= FIND STUDENTS ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Find Students</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={(e) => e.preventDefault()}>
              <CRow className="g-3 align-items-center">
                <CCol xs={12} md={2}>
                  <CFormLabel className="mb-0">Search</CFormLabel>
                </CCol>
                <CCol xs={12} md={4}>
                  <CFormInput
                    value={searchReg}
                    onChange={(e) => setSearchReg(e.target.value)}
                    placeholder="Register Number"
                  />
                </CCol>

                <CCol xs={12} md={2}>
                  <CFormLabel className="mb-0">Programme</CFormLabel>
                </CCol>
                <CCol xs={12} md={4}>
                  <CFormSelect value={programme} onChange={(e) => setProgramme(e.target.value)}>
                    <option value="">Programme</option>
                    {programmes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} md={2}>
                  <CFormLabel className="mb-0">Class</CFormLabel>
                </CCol>
                <CCol xs={12} md={4}>
                  <CFormSelect value={klass} onChange={(e) => setKlass(e.target.value)}>
                    <option value="">Class</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} md={2}>
                  <CFormLabel className="mb-0">Section</CFormLabel>
                </CCol>
                <CCol xs={12} md={4}>
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

        {/* ================= LIST OF STUDENTS ================= */}
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
              <CTable hover responsive align="middle">
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

        {/* ================= STUDENT PROFILE ================= */}
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
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop"
                        alt="avatar"
                        style={{
                          width: 120,
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '4px solid #e9ecef',
                        }}
                      />
                    </CTableDataCell>

                    <CTableDataCell className="fw-bold">{selectedStudent.name}</CTableDataCell>

                    <CTableDataCell colSpan={5} className="text-end">
                      <div className="d-flex justify-content-end gap-2 flex-wrap">
</div>
                    </CTableDataCell>
                  </CTableRow>

                  <CTableRow>
                    <CTableDataCell>
                      {selectedStudent.reg} | {selectedStudent.programme} | {selectedStudent.sem} SEM |{' '}
                      {selectedStudent.yearSpan}
                    </CTableDataCell>
                    <CTableDataCell colSpan={5}></CTableDataCell>
                  </CTableRow>

                  <CTableRow>
                    <CTableDataCell>
                      {selectedStudent.email}
                      {' | '}
                      {selectedStudent.basic?.contact || ''}
                    </CTableDataCell>

                    <CTableDataCell colSpan={2} className="fw-semibold">
                      Choose Profile Category
                    </CTableDataCell>

                    <CTableDataCell colSpan={2}>
                      <CFormSelect
                        size="sm"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        title="Choose Profile Category"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
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

        {/* ================= PROFILE CATEGORY ================= */}
        {showCategory && selectedStudent && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Profile Category</strong>
            </CCardHeader>

            <CCardBody>
              {!activeCategory ? (
                <div className="text-medium-emphasis">Choose a category and click View.</div>
              ) : (
                <>
                  {/* BASIC INFORMATION */}
                  {activeCategory === 'Basic Information' && (
                    <>
                      <h6 className="mb-3">Basic Information</h6>
                      <CRow className="g-3">
                        <CCol md={3}>
                          <CFormLabel>Register Number</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.regno} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>First Name</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.fname} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Last Name</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.lname} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Date of Birth</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.dob} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Gender</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.gender} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>E – Mail ID</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.email} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Alternative E-Mail ID</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.alt_email} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Contact Number</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.contact} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>WhatsApp Number</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.whatsapp} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Religious</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.religious} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Communal Category</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.communal} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Citizen</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.citizen} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Blood Group</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.basic.blood} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Address</CFormLabel>
                        </CCol>
                        <CCol md={9}>
                          <CFormTextarea value={selectedStudent.basic.address} rows={2} disabled />
                        </CCol>

                        <CCol xs={12} className="d-flex justify-content-end">
                          <CButton color="secondary" onClick={onCloseCategory}>
                            Close
                          </CButton>
                        </CCol>
                      </CRow>
                    </>
                  )}

                  {/* PERSONAL INFORMATION */}
                  {activeCategory === 'Personal Information' && (
                    <>
                      <h6 className="mb-3">Personal Information</h6>
                      <CRow className="g-3">
                        <CCol md={3}>
                          <CFormLabel>Mother Tongue</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.mtongue} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>State</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.state} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Country</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.country} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Father Name</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.fname} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Father Mobile Number</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.fmobile} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Mother Name</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.mname} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Mother Mobile Number</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.mmobile} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Guardian Name</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.gname} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Guardian Mobile Number</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.gmobile} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Father Occupation</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.focc} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Mother Occupation</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.mocc} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Annual Income</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.income} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>AADHAAR Number</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.aadhaar} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Driving License Number</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.personal.dl} disabled />
                        </CCol>

                        <CCol xs={12} className="d-flex justify-content-end">
                          <CButton color="secondary" onClick={onCloseCategory}>
                            Close
                          </CButton>
                        </CCol>
                      </CRow>
                    </>
                  )}

                  {/* INSTITUTE INFORMATION */}
                  {activeCategory === 'Institute Information' && (
                    <>
                      <h6 className="mb-3">Institute Information</h6>
                      <CRow className="g-3">
                        <CCol md={3}>
                          <CFormLabel>Admission Number</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.admno} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Admission Date</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.admdate} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Programme</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.programme} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Branch</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.branch} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Year</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.year} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Batch</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.batch} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Current Semester</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.sem} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Department</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.dept} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Tutor Name</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.tutor} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Tutor Mobile Number</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.tutor_mobile} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Student Status</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.status} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>NSS (Yes/No)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.nss} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>NCC (Yes/No)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.ncc} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Scholarship (Yes/No)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.institute.scholar} disabled />
                        </CCol>

                        <CCol xs={12} className="d-flex justify-content-end">
                          <CButton color="secondary" onClick={onCloseCategory}>
                            Close
                          </CButton>
                        </CCol>
                      </CRow>
                    </>
                  )}

                  {/* EDUCATION INFORMATION */}
                  {activeCategory === 'Education Information' && (
                    <>
                      <h6 className="mb-3">Education Information</h6>
                      <CRow className="g-3">
                        <CCol md={3}>
                          <CFormLabel>SSLC Percentage</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.sslc_pct} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>PG Degree</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.pg_deg} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>PG Percentage</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.pg_pct} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>PG Branch</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.pg_branch} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>SSLC School Name</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.sslc_school} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Year of Passing (PG)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.pg_yop} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>HSC Percentage</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.hsc_pct} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Year of Passing (HSC)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.hsc_yop} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>HSC Group</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.hsc_group} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>PG Institution</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.pg_inst} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>HSC School Name</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.hsc_school} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>PG University</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.pg_uni} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Year of Passing (SSLC)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.sslc_yop} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>PG Obtained Class/CGPA</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.pg_class} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>UG Degree</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.ug_deg} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>M.Phil. Degree</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.mphil_deg} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>UG Branch</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.ug_branch} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>M.Phil. Branch</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.mphil_branch} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>UG Percentage</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.ug_pct} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Year of Passing (M.Phil.)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.mphil_yop} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>UG Institution</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.ug_inst} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>M.Phil. Institution</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.mphil_inst} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>UG University</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.ug_uni} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>M.Phil. University</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.mphil_uni} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Year of Passing (UG)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.ug_yop} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>M.Phil. Percentage</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.mphil_pct} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Obtained Class/CGPA (UG)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.ug_class} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>M.Phil. Obtained Class</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.education.mphil_class} disabled />
                        </CCol>

                        <CCol xs={12} className="d-flex justify-content-end">
                          <CButton color="secondary" onClick={onCloseCategory}>
                            Close
                          </CButton>
                        </CCol>
                      </CRow>
                    </>
                  )}

                  {/* OTHER INFORMATION */}
                  {activeCategory === 'Other Information' && (
                    <>
                      <h6 className="mb-3">Other Information</h6>
                      <CRow className="g-3">
                        <CCol md={3}>
                          <CFormLabel>Bank Account No</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.acct} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Avail Transport (Yes/No)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.transport} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Bank Name</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.bankname} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>ID Mark 1</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.id1} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Branch Name</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.branch} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>ID Mark 2</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.id2} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Account Name</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.accname} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Passport No</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.passport} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>IFSC Code</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.ifsc} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Date of Issue</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.issue_date} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>MICR Code</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.micr} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>VISA Number</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.visa} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>UPI ID</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.upi} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Issue Date</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.issue_date2} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Is Hostler (Yes/No)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.hostler} disabled />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Valid Up To</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={selectedStudent.other.valid_upto} disabled />
                        </CCol>

                        <CCol xs={12} className="d-flex justify-content-end">
                          <CButton color="secondary" onClick={onCloseCategory}>
                            Close
                          </CButton>
                        </CCol>
                      </CRow>
                    </>
                  )}

                  {/* VIEW DOCUMENTS */}
                  {activeCategory === 'View Documents' && (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">View Documents</h6>
                        <div className="d-flex gap-2">
                          <CButton color="primary" size="sm" style={circleBtnStyle} title="View">
                            <CIcon icon={ARP_ICONS.VIEW} />
                          </CButton>
</div>
                      </div>

                      <CTable bordered responsive align="middle" className="mb-2">
                        <CTableHead color="light">
                          <CTableRow>
                            <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>
                            <CTableHeaderCell>Document</CTableHeaderCell>
                            <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>
                            <CTableHeaderCell>Document</CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {docsPairs.map(([left, right]) => (
                            <CTableRow key={`${left}-${right}`}>
                              <CTableDataCell className="text-center">
                                <input
                                  type="radio"
                                  name="docSelect"
                                  checked={selectedDoc === left}
                                  onChange={() => setSelectedDoc(left)}
                                />
                              </CTableDataCell>
                              <CTableDataCell>{left}</CTableDataCell>
                              <CTableDataCell className="text-center">
                                <input
                                  type="radio"
                                  name="docSelect"
                                  checked={selectedDoc === right}
                                  onChange={() => setSelectedDoc(right)}
                                />
                              </CTableDataCell>
                              <CTableDataCell>{right}</CTableDataCell>
                            </CTableRow>
                          ))}
                        </CTableBody>
                      </CTable>

                      <div className="d-flex justify-content-end">
                        <CButton color="secondary" onClick={onCloseCategory}>
                          Close
                        </CButton>
                      </div>
                    </>
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default StudentProfile
