
import React, { useMemo, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormInput,
  CFormSelect,
  CFormLabel,
} from '@coreui/react-pro'

import CardShell from 'src/components/common/CardShell'
import ArpActionToolbar from 'src/components/common/ArpActionToolbar'
import IconCircleButton from 'src/components/common/IconCircleButton'

const avatarStyle = {
  width: 120,
  height: 120,
  objectFit: 'cover',
  borderRadius: '50%',
  border: '4px solid #e9ecef',
}

const docCategories = ['Category -1', 'Category -2', 'Category -3']

const StudentProgression = () => {
  // Phase visibility
  const [showList, setShowList] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showProgression, setShowProgression] = useState(false)
  const [showDocument, setShowDocument] = useState(false)

  // Find Students filters (API-ready)
  const [filters, setFilters] = useState({
    regNo: '',
    programme: '',
    className: '',
    section: '',
  })

  const onFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }))

  // Selections
  const [selectedReg, setSelectedReg] = useState(null)
  const [docCategory, setDocCategory] = useState(docCategories[0])

  const studentsSeed = useMemo(
    () => [
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
        name: 'ANU B',
        gender: 'Female',
        sem: 'III',
        programme: 'MBA',
        klass: 'I-MBA',
        section: 'B',
        status: 'Active',
        email: 'anub2023@gmail.com',
        yearSpan: '2023 – 24',
        contact: '+91 98888 11111',
      },
    ],
    [],
  )

  const progressionSeed = useMemo(
    () => [
      { inst: 'XYZ University', join: '01-08-2024', addr: 'Chennai', prog: 'M.Tech', comp: '01-05-2026' },
      { inst: 'ABC Institute', join: '10-07-2024', addr: 'Coimbatore', prog: 'MBA', comp: '30-04-2026' },
      { inst: 'Global College', join: '15-07-2024', addr: 'Bengaluru', prog: 'MS', comp: '15-05-2026' },
    ],
    [],
  )

  const filteredStudents = useMemo(() => {
    const q = String(filters.regNo || '').trim().toLowerCase()
    return studentsSeed.filter((s) => {
      if (filters.programme && s.programme !== filters.programme) return false
      if (filters.className && s.klass !== filters.className) return false
      if (filters.section && s.section !== filters.section) return false
      if (q && !String(s.reg).toLowerCase().includes(q)) return false
      return true
    })
  }, [filters, studentsSeed])

  const selectedStudent = useMemo(() => studentsSeed.find((s) => s.reg === selectedReg) || null, [studentsSeed, selectedReg])

  // ---------- Handlers (mirror HTML behavior) ----------
  const onSearch = () => {
    setShowList(true)
    setShowProfile(false)
    setShowProgression(false)
    setShowDocument(false)
    setSelectedReg(null)
  }

  const onReset = () => {
    setFilters({ regNo: '', programme: '', className: '', section: '' })
  }

  const onViewProfile = () => {
    if (!selectedReg) {
      window.alert('Please select a student first.')
      return
    }
    setShowProfile(true)
    setShowProgression(false)
    setShowDocument(false)
  }

  const onViewProgression = () => {
    if (!selectedReg) {
      window.alert('Please select a student first.')
      return
    }
    setShowProgression(true)
    setShowDocument(false)
  }

  return (
    <CardShell title="Student Progression" breadcrumb={['Setup', 'Student Progression']}>
      {/* Find Students */}
      <CCard className="mb-3">
        <CCardHeader>Find Students</CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="align-items-center mb-3">
              <CCol md={2}>
                <CFormLabel htmlFor="sp-regNo" className="mb-0">
                  Register Number
                </CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormInput
                  id="sp-regNo"
                  placeholder="Register Number"
                  value={filters.regNo}
                  onChange={(e) => onFilterChange('regNo', e.target.value)}
                />
              </CCol>

              <CCol md={2}>
                <CFormLabel htmlFor="sp-programme" className="mb-0">
                  Programme
                </CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  id="sp-programme"
                  value={filters.programme}
                  onChange={(e) => onFilterChange('programme', e.target.value)}
                  options={[
                    { label: 'Programme', value: '' },
                    { label: 'MBA', value: 'MBA' },
                    { label: 'MCA', value: 'MCA' },
                  ]}
                />
              </CCol>
            </CRow>

            <CRow className="align-items-center mb-3">
              <CCol md={2}>
                <CFormLabel htmlFor="sp-class" className="mb-0">
                  Class
                </CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  id="sp-class"
                  value={filters.className}
                  onChange={(e) => onFilterChange('className', e.target.value)}
                  options={[
                    { label: 'Class', value: '' },
                    { label: 'I-MBA', value: 'I-MBA' },
                    { label: 'I-MCA', value: 'I-MCA' },
                  ]}
                />
              </CCol>

              <CCol md={2}>
                <CFormLabel htmlFor="sp-section" className="mb-0">
                  Section
                </CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  id="sp-section"
                  value={filters.section}
                  onChange={(e) => onFilterChange('section', e.target.value)}
                  options={[
                    { label: 'Section', value: '' },
                    { label: 'A', value: 'A' },
                    { label: 'B', value: 'B' },
                  ]}
                />
              </CCol>
            </CRow>

            <ArpActionToolbar onSearch={onSearch} onReset={onReset} />
          </CForm>
        </CCardBody>
      </CCard>

      {/* List of Students */}
      {showList && (
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>List of Students</strong>
            <CButton size="sm" color="success" disabled={!selectedReg} onClick={onViewProfile}>
              View Profile
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CTable bordered hover responsive align="middle" className="mb-0 text-center">
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
                {filteredStudents.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center py-4">
                      No records found.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  filteredStudents.map((s) => (
                    <CTableRow key={s.reg}>
                      <CTableDataCell className="text-center">
                        <input
                          type="radio"
                          name="sp-studentSelect"
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
                      <CTableDataCell>{s.status}</CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}

      {/* Student Profile (MATCHED to StudentPlacements.jsx style) */}
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
                    <CButton color="info" size="sm" onClick={onViewProgression}>
                      View Progression
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}

      {/* Progression Details */}
      {showProgression && (
        <CCard>
          <CCardHeader>
            <strong>Progression Details</strong>
          </CCardHeader>
          <CCardBody>
            <div className="d-flex justify-content-end mb-2">
              <IconCircleButton icon="cilEye" tooltip="View Documents" onClick={() => setShowDocument(true)} />
            </div>

            <CTable bordered hover responsive align="middle" className="mb-0 text-center">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>
                  <CTableHeaderCell>Institute Name</CTableHeaderCell>
                  <CTableHeaderCell>Date of Joining</CTableHeaderCell>
                  <CTableHeaderCell>Institute Address</CTableHeaderCell>
                  <CTableHeaderCell>Higher Study Programme</CTableHeaderCell>
                  <CTableHeaderCell>Date of Completion</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {progressionSeed.map((p, idx) => (
                  <CTableRow key={`${p.inst}-${idx}`}>
                    <CTableDataCell className="text-center">
                      <input type="radio" name="sp-progressionSelect" defaultChecked={idx === 0} />
                    </CTableDataCell>
                    <CTableDataCell>{p.inst}</CTableDataCell>
                    <CTableDataCell>{p.join}</CTableDataCell>
                    <CTableDataCell>{p.addr}</CTableDataCell>
                    <CTableDataCell>{p.prog}</CTableDataCell>
                    <CTableDataCell>{p.comp}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>

            {/* View Document */}
            {showDocument && (
              <CCard className="mt-3">
                <CCardHeader>
                  <strong>View Document</strong>
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
                      <CButton
                        color="primary"
                        style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
                        title="View"
                        onClick={() => window.alert('View (demo)')}
                      >
                        <IconCircleButton icon="cilEye" tooltip="View" />
                      </CButton>
                      <CButton
                        color="success"
                        style={{ width: 32, height: 32, padding: 0, borderRadius: '50%' }}
                        title="Download"
                        onClick={() => window.alert('Download (demo)')}
                      >
                        <IconCircleButton icon="cilCloudDownload" tooltip="Download" />
                      </CButton>
                    </CCol>
                  </CRow>

                  <div className="text-end mt-3">
                    <CButton color="danger" size="sm" onClick={() => setShowDocument(false)}>
                      Close
                    </CButton>
                  </div>
                </CCardBody>
              </CCard>
            )}
          </CCardBody>
        </CCard>
      )}
    </CardShell>
  )
}

export default StudentProgression
