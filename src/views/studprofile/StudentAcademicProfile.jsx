
import React, { useMemo, useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilUser } from '@coreui/icons'

import CardShell from 'src/components/common/CardShell'
import IconCircleButton from 'src/components/common/IconCircleButton'

/**
 * Student Academic Profile (Up to Phase 4)
 * - Phase 4 Completed:
 *   Attendance + CIA + Project + Internship + Training + Seminar + Competitive Exams + Awards/Medals
 *   + Paper Presentation + Paper Publication + Membership + MOOCs + Value Added Courses + Add On Courses
 *   + Certificate / Diploma
 */
const StudentAcademicProfile = () => {
  // Phase visibility
  const [showPhase2, setShowPhase2] = useState(false)
  const [showPhase3, setShowPhase3] = useState(false)
  const [showPhase4, setShowPhase4] = useState(false)

  // Phase 1 filters
  const [regNo, setRegNo] = useState('')
  const [programme, setProgramme] = useState('')
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')

  // Phase 2 selection
  const [selectedStudentId, setSelectedStudentId] = useState('23MCA01')

  // Phase 3 category
  const [category, setCategory] = useState('')

  const categoryTitleMap = {
    attendance: 'Attendance Details',
    cia: 'Continuous Internal Assessment Marks',
    project: 'Project Details',
    internship: 'Internship Details',
    training: 'Training Program',
    seminar: 'Seminar Participation',
    competitive: 'Competitive Exams',
    awards: 'Awards / Medals',
    'paper-presentation': 'Paper Presentation',
    'paper-publications': 'Paper Publications',
    membership: 'Membership',
    moocs: 'MOOCs',
    vac: 'Value Added Courses',
    addon: 'Add On Courses',
    certificate: 'Certificate / Diploma',
  }

  const students = useMemo(
    () => [
      { id: '23MCA01', name: 'AJISH A', email: 'ajisha2023@gmail.com', contact: '+91 90000 11111', photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop', gender: 'M', sem: 3, prog: 'MCA', cls: 'I-MCA', sec: 'A', status: 'Active' },
      { id: '23MCA02', name: 'DEMO STUDENT', email: 'demo.student@example.com', contact: '+91 95555 22222', photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=400&auto=format&fit=crop', gender: 'F', sem: 3, prog: 'MCA', cls: 'I-MCA', sec: 'A', status: 'Active' },
    ],
    [],
  )

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0],
    [students, selectedStudentId],
  )

  // Phase 4: CIA mock rows
  const ciaRows = useMemo(
    () => [
      { code: 'MC101', name: 'DS', cia1: 18, cia2: 19, cia3: 20, assignment: 10, seminar: 10, total: 77 },
      { code: 'MC102', name: 'OS', cia1: 17, cia2: 18, cia3: 19, assignment: 9, seminar: 9, total: 72 },
    ],
    [],
  )

  // Phase 4: Project mock rows
  const projectRows = useMemo(
    () => [
      {
        year: 2024,
        semester: 3,
        courseName: 'Mini Project',
        organization: 'ABC Tech',
        projectTitle: 'Portal Dev',
        startDate: '01-01-2024',
        endDate: '31-03-2024',
      },
    ],
    [],
  )

  // Phase 4: Internship mock rows
  const internshipRows = useMemo(
    () => [
      {
        year: 2024,
        semester: 3,
        course: 'Internship',
        organization: 'ABC Corp',
        title: 'Web Intern',
        startDate: '01-05-2024',
        endDate: '31-05-2024',
      },
    ],
    [],
  )

  // Phase 4: Training Program mock rows
  const trainingRows = useMemo(
    () => [
      {
        year: 2024,
        semester: 3,
        trainingName: 'Full Stack Training',
        organizer: 'EduNurture',
        duration: '30 Hours',
        startDate: '10-06-2024',
        endDate: '20-06-2024',
      },
    ],
    [],
  )

  // Phase 4: Seminar Participation mock rows
  const seminarRows = useMemo(
    () => [
      {
        year: 2024,
        semester: 3,
        seminarTitle: 'AI & Cloud Security',
        organizer: 'XYZ College',
        participationType: 'Participant',
        date: '15-07-2024',
        venue: 'Auditorium',
      },
    ],
    [],
  )

  // Phase 4: Competitive Exams mock rows
  const competitiveRows = useMemo(
    () => [
      {
        year: 2024,
        examName: 'GATE',
        registrationNo: 'GATE2024-12345',
        score: '560',
        qualified: 'Yes',
        examDate: '11-02-2024',
      },
    ],
    [],
  )

  // Phase 4: Awards / Medals mock rows
  const awardsRows = useMemo(
    () => [
      {
        year: 2024,
        awardName: 'Best Performer',
        eventName: 'Tech Fest',
        level: 'State',
        position: '1st',
        date: '05-08-2024',
      },
    ],
    [],
  )

  // Phase 4: Paper Presentation mock rows
  const paperPresentationRows = useMemo(
    () => [
      {
        year: 2024,
        semester: 3,
        title: 'AI-Driven Cloud Security',
        event: 'National Conference on Emerging Tech',
        organizer: 'ABC University',
        level: 'National',
        award: 'Best Paper',
        date: '18-09-2024',
      },
    ],
    [],
  )

  // Phase 4: Paper Publications mock rows
  const paperPublicationRows = useMemo(
    () => [
      {
        year: 2024,
        semester: 3,
        title: 'AI-Enhanced Cloud Security Framework',
        journal: 'International Journal of Cloud Computing',
        publisher: 'IJCC Publisher',
        issn: '2456-1234',
        doi: '10.1234/ijcc.2024.001',
        publicationDate: '10-10-2024',
      },
    ],
    [],
  )

  // Phase 4: Membership mock rows
  const membershipRows = useMemo(
    () => [
      {
        year: 2024,
        membershipType: 'Professional Body',
        organization: 'IEEE',
        membershipId: 'IEEE-123456',
        validityFrom: '01-01-2024',
        validityTo: '31-12-2024',
      },
    ],
    [],
  )

  // Phase 4: MOOCs mock rows
  const moocsRows = useMemo(
    () => [
      {
        year: 2024,
        semester: 3,
        courseName: 'Introduction to Machine Learning',
        platform: 'NPTEL',
        duration: '12 Weeks',
        score: '78%',
        certificateId: 'NPTEL-ML-2024-7788',
        completionDate: '30-11-2024',
      },
    ],
    [],
  )

  // Phase 4: Value Added Courses mock rows
  const vacRows = useMemo(
    () => [
      {
        year: 2024,
        semester: 3,
        courseName: 'Advanced Excel for Analytics',
        organizer: 'College VAC Cell',
        duration: '20 Hours',
        grade: 'A',
        completionDate: '12-12-2024',
      },
    ],
    [],
  )

  // Phase 4: Add On Courses mock rows
  const addonRows = useMemo(
    () => [
      {
        year: 2024,
        semester: 3,
        courseName: 'Spoken English',
        organizer: 'Language Lab',
        duration: '30 Hours',
        grade: 'A+',
        completionDate: '22-12-2024',
      },
    ],
    [],
  )

  // Phase 4: Certificate / Diploma mock rows
  const certificateRows = useMemo(
    () => [
      {
        year: 2024,
        semester: 3,
        programType: 'Certificate',
        courseName: 'Python for Data Science',
        institute: 'Coursera / IBM',
        duration: '40 Hours',
        certificateNo: 'PY-DS-2024-0099',
        completionDate: '15-12-2024',
      },
      {
        year: 2024,
        semester: 3,
        programType: 'Diploma',
        courseName: 'Diploma in Web Development',
        institute: 'ABC Institute',
        duration: '6 Months',
        certificateNo: 'DWD-2024-1188',
        completionDate: '30-12-2024',
      },
    ],
    [],
  )

  const onFindStudents = (e) => {
    e.preventDefault()
    setShowPhase2(true)
    setShowPhase3(false)
    setShowPhase4(false)
    setCategory('')
  }

  const onViewProfile = () => {
    if (!selectedStudentId) return
    setShowPhase3(true)
    setShowPhase4(false)
    setCategory('')
  }

  const onViewCategory = () => {
    if (!category) return
    setShowPhase4(true)
  }

  const onClosePhase4 = () => setShowPhase4(false)

  const onReset = () => {
    setRegNo('')
    setProgramme('')
    setClassName('')
    setSection('')
    setShowPhase2(false)
    setShowPhase3(false)
    setShowPhase4(false)
    setSelectedStudentId('23MCA01')
    setCategory('')
  }

  return (
    <CardShell
      title="Academic Profile"
      breadcrumbs={[
        { label: 'Home', to: '/' },
        { label: 'Setup' },
        { label: 'Student Academic Profile' },
      ]}
    >
      {/* Phase 1: Find Students */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Find Students</strong>
        </CCardHeader>
        <CCardBody>
          <CForm onSubmit={onFindStudents}>
            <CRow className="g-3 align-items-center">
              <CCol md={2}>
                <CFormLabel className="mb-0">Register Number</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormInput size="sm" value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="Register Number" />
              </CCol>

              <CCol md={2}>
                <CFormLabel className="mb-0">Programme</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect size="sm" value={programme} onChange={(e) => setProgramme(e.target.value)}>
                  <option value="">Programme</option>
                  <option value="MBA">MBA</option>
                  <option value="MCA">MCA</option>
                </CFormSelect>
              </CCol>
            </CRow>

            <CRow className="g-3 align-items-center mt-1">
              <CCol md={2}>
                <CFormLabel className="mb-0">Class</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect size="sm" value={className} onChange={(e) => setClassName(e.target.value)}>
                  <option value="">Class</option>
                  <option value="I-MBA">I-MBA</option>
                  <option value="I-MCA">I-MCA</option>
                </CFormSelect>
              </CCol>

              <CCol md={2}>
                <CFormLabel className="mb-0">Section</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect size="sm" value={section} onChange={(e) => setSection(e.target.value)}>
                  <option value="">Section</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </CFormSelect>
              </CCol>
            </CRow>

            <div className="text-end mt-3">
              <CButton type="submit" size="sm" color="primary" className="me-2">
                <CIcon icon={cilSearch} className="me-1" />
                Find Students
              </CButton>
              <CButton type="button" size="sm" color="secondary" variant="outline" onClick={onReset}>
                Reset
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>

      {/* Phase 2: List of Students */}
      {showPhase2 && (
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>List of Students</strong>
            <CButton size="sm" color="success" onClick={onViewProfile}>
              View Profile
            </CButton>
          </CCardHeader>
          <CCardBody>
            <CTable bordered striped small responsive className="mb-0">
              <CTableHead>
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
                {students.map((s) => (
                  <CTableRow key={s.id}>
                    <CTableDataCell className="text-center">
                      <input type="radio" name="selectedStudent" checked={selectedStudentId === s.id} onChange={() => setSelectedStudentId(s.id)} />
                    </CTableDataCell>
                    <CTableDataCell>{s.id}</CTableDataCell>
                    <CTableDataCell>{s.name}</CTableDataCell>
                    <CTableDataCell>{s.gender}</CTableDataCell>
                    <CTableDataCell>{s.sem}</CTableDataCell>
                    <CTableDataCell>{s.prog}</CTableDataCell>
                    <CTableDataCell>{s.cls}</CTableDataCell>
                    <CTableDataCell>{s.sec}</CTableDataCell>
                    <CTableDataCell>{s.status}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}
      {/* Phase 3: Student Profile */}
      {showPhase3 && (
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
                      src={
                        selectedStudent?.photoUrl ||
                        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop'
                      }
                      alt="student"
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: '50%',
                        border: '4px solid #e9ecef',
                      }}
                    />
                  </CTableDataCell>

                  <CTableDataCell className="fw-bold">{selectedStudent?.name}</CTableDataCell>
                  <CTableDataCell colSpan={6}></CTableDataCell>
                </CTableRow>

                <CTableRow>
                  <CTableDataCell>
                    {selectedStudent?.id} | {selectedStudent?.prog} | {selectedStudent?.sem} SEM | 2023 - 24
                  </CTableDataCell>
                  <CTableDataCell colSpan={6}></CTableDataCell>
                </CTableRow>

                <CTableRow>
                  <CTableDataCell className="text-muted small">
                    {/* Optional contact/email fields can be wired to API later */}
                    {selectedStudent?.email || ''} {selectedStudent?.email ? ' | ' : ''}
                    {selectedStudent?.contact || ''}
                  </CTableDataCell>

                  <CTableDataCell colSpan={2} className="fw-semibold">
                    Choose Profile Category
                  </CTableDataCell>

                  <CTableDataCell colSpan={2}>
                    <CFormSelect
                      size="sm"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value)
                        setShowPhase4(false)
                      }}
                      title="Choose Profile Category"
                    >
                      <option value="">-- Select --</option>
                      <option value="attendance">Attendance</option>
                      <option value="cia">CIA Marks</option>
                      <option value="project">Project</option>
                      <option value="internship">Internship</option>
                      <option value="training">Training Program</option>
                      <option value="seminar">Seminar Participation</option>
                      <option value="competitive">Competitive Exams</option>
                      <option value="awards">Awards/Medals</option>
                      <option value="paper-presentation">Paper Presentation</option>
                      <option value="paper-publications">Paper Publication</option>
                      <option value="membership">Membership</option>
                      <option value="moocs">MOOCs</option>
                      <option value="vac">Value Added Courses</option>
                      <option value="addon">Add On Courses</option>
                      <option value="certificate">Certificate / Diploma</option>
                    </CFormSelect>
                  </CTableDataCell>

                  <CTableDataCell style={{ width: 140 }}>
                    <CButton size="sm" color="primary" className="w-100" disabled={!category} onClick={onViewCategory}>
                      View
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}
      {/* Phase 4: Category Details */}
      {showPhase3 && showPhase4 && (
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>{categoryTitleMap[category] || 'Category Details'}</strong>
          </CCardHeader>

          <CCardBody>
            {/* Attendance */}
            {category === 'attendance' && (
              <>
                <CRow className="g-3 mb-3">
                  <CCol md={6}>
                    <CCard className="h-100">
                      <CCardHeader className="py-2">
                        <strong style={{ fontSize: 12 }}>Monthly Attendance Reports</strong>
                      </CCardHeader>
                      <CCardBody>
                        <div
                          style={{
                            height: 230,
                            border: '1px dashed #cfd4da',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            color: '#6c757d',
                          }}
                        >
                          Monthly Attendance Chart Area
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>

                  <CCol md={6}>
                    <CCard className="h-100">
                      <CCardHeader className="py-2 d-flex justify-content-between align-items-center">
                        <strong style={{ fontSize: 12 }}>Hourly Attendance Reports</strong>

                        <div style={{ fontSize: 12 }} className="text-muted">
                          <span className="me-3 d-inline-flex align-items-center">
                            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#26a69a', display: 'inline-block', marginRight: 6 }} />
                            Present
                          </span>

                          <span className="d-inline-flex align-items-center">
                            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ff5b5b', display: 'inline-block', marginRight: 6 }} />
                            Absent
                          </span>
                        </div>
                      </CCardHeader>

                      <CCardBody>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gridAutoRows: 24, gap: 4, fontSize: 9 }}>
                          {Array.from({ length: 30 }).map((_, idx) => {
                            const isAbsent = idx % 9 === 0
                            return (
                              <div
                                key={idx}
                                style={{
                                  borderRadius: 3,
                                  textAlign: 'center',
                                  lineHeight: '24px',
                                  background: isAbsent ? '#ff5b5b' : '#26a69a',
                                  color: '#fff',
                                }}
                                title={isAbsent ? 'Absent' : 'Present'}
                              >
                                {`H${(idx % 6) + 1}`}
                              </div>
                            )
                          })}
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                </CRow>

                <CRow className="g-3">
                  <CCol md={6}>
                    <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                      Monthly Attendance
                    </div>

                    <CTable bordered small responsive className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Month</CTableHeaderCell>
                          <CTableHeaderCell>Working Days</CTableHeaderCell>
                          <CTableHeaderCell>Present</CTableHeaderCell>
                          <CTableHeaderCell>%</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        <CTableRow>
                          <CTableDataCell>Jan</CTableDataCell>
                          <CTableDataCell>22</CTableDataCell>
                          <CTableDataCell>21</CTableDataCell>
                          <CTableDataCell>95%</CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>Feb</CTableDataCell>
                          <CTableDataCell>20</CTableDataCell>
                          <CTableDataCell>19</CTableDataCell>
                          <CTableDataCell>95%</CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>
                  </CCol>

                  <CCol md={6}>
                    <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                      Hourly Attendance
                    </div>

                    <CTable bordered small responsive className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Date</CTableHeaderCell>
                          <CTableHeaderCell>Course</CTableHeaderCell>
                          <CTableHeaderCell>Hours Present</CTableHeaderCell>
                          <CTableHeaderCell>Total Hours</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        <CTableRow>
                          <CTableDataCell>01-02-2025</CTableDataCell>
                          <CTableDataCell>DS</CTableDataCell>
                          <CTableDataCell>4</CTableDataCell>
                          <CTableDataCell>4</CTableDataCell>
                        </CTableRow>
                        <CTableRow>
                          <CTableDataCell>02-02-2025</CTableDataCell>
                          <CTableDataCell>OS</CTableDataCell>
                          <CTableDataCell>3</CTableDataCell>
                          <CTableDataCell>4</CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>
                  </CCol>
                </CRow>
              </>
            )}

            {/* CIA Marks */}
            {category === 'cia' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Continuous Internal Assessment Marks
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Course Code</CTableHeaderCell>
                      <CTableHeaderCell>Course Name</CTableHeaderCell>
                      <CTableHeaderCell>CIA 1</CTableHeaderCell>
                      <CTableHeaderCell>CIA 2</CTableHeaderCell>
                      <CTableHeaderCell>CIA 3</CTableHeaderCell>
                      <CTableHeaderCell>Assignment</CTableHeaderCell>
                      <CTableHeaderCell>Seminar</CTableHeaderCell>
                      <CTableHeaderCell>Total</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {ciaRows.map((r) => (
                      <CTableRow key={r.code}>
                        <CTableDataCell>{r.code}</CTableDataCell>
                        <CTableDataCell>{r.name}</CTableDataCell>
                        <CTableDataCell>{r.cia1}</CTableDataCell>
                        <CTableDataCell>{r.cia2}</CTableDataCell>
                        <CTableDataCell>{r.cia3}</CTableDataCell>
                        <CTableDataCell>{r.assignment}</CTableDataCell>
                        <CTableDataCell>{r.seminar}</CTableDataCell>
                        <CTableDataCell>{r.total}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Project */}
            {category === 'project' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Project Details
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Semester</CTableHeaderCell>
                      <CTableHeaderCell>Course Name</CTableHeaderCell>
                      <CTableHeaderCell>Organization</CTableHeaderCell>
                      <CTableHeaderCell>Project Title</CTableHeaderCell>
                      <CTableHeaderCell>Start Date</CTableHeaderCell>
                      <CTableHeaderCell>End Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {projectRows.map((p, idx) => (
                      <CTableRow key={`${p.year}-${idx}`}>
                        <CTableDataCell>{p.year}</CTableDataCell>
                        <CTableDataCell>{p.semester}</CTableDataCell>
                        <CTableDataCell>{p.courseName}</CTableDataCell>
                        <CTableDataCell>{p.organization}</CTableDataCell>
                        <CTableDataCell>{p.projectTitle}</CTableDataCell>
                        <CTableDataCell>{p.startDate}</CTableDataCell>
                        <CTableDataCell>{p.endDate}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Internship */}
            {category === 'internship' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Internship Details
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Semester</CTableHeaderCell>
                      <CTableHeaderCell>Course</CTableHeaderCell>
                      <CTableHeaderCell>Organization</CTableHeaderCell>
                      <CTableHeaderCell>Title</CTableHeaderCell>
                      <CTableHeaderCell>Start Date</CTableHeaderCell>
                      <CTableHeaderCell>End Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {internshipRows.map((r, idx) => (
                      <CTableRow key={`${r.year}-${idx}`}>
                        <CTableDataCell>{r.year}</CTableDataCell>
                        <CTableDataCell>{r.semester}</CTableDataCell>
                        <CTableDataCell>{r.course}</CTableDataCell>
                        <CTableDataCell>{r.organization}</CTableDataCell>
                        <CTableDataCell>{r.title}</CTableDataCell>
                        <CTableDataCell>{r.startDate}</CTableDataCell>
                        <CTableDataCell>{r.endDate}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Training */}
            {category === 'training' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Training Program
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Semester</CTableHeaderCell>
                      <CTableHeaderCell>Training Name</CTableHeaderCell>
                      <CTableHeaderCell>Organizer</CTableHeaderCell>
                      <CTableHeaderCell>Duration</CTableHeaderCell>
                      <CTableHeaderCell>Start Date</CTableHeaderCell>
                      <CTableHeaderCell>End Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {trainingRows.map((t, idx) => (
                      <CTableRow key={`${t.year}-${idx}`}>
                        <CTableDataCell>{t.year}</CTableDataCell>
                        <CTableDataCell>{t.semester}</CTableDataCell>
                        <CTableDataCell>{t.trainingName}</CTableDataCell>
                        <CTableDataCell>{t.organizer}</CTableDataCell>
                        <CTableDataCell>{t.duration}</CTableDataCell>
                        <CTableDataCell>{t.startDate}</CTableDataCell>
                        <CTableDataCell>{t.endDate}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Seminar */}
            {category === 'seminar' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Seminar Participation
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Semester</CTableHeaderCell>
                      <CTableHeaderCell>Seminar Title</CTableHeaderCell>
                      <CTableHeaderCell>Organizer</CTableHeaderCell>
                      <CTableHeaderCell>Type</CTableHeaderCell>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                      <CTableHeaderCell>Venue</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {seminarRows.map((s, idx) => (
                      <CTableRow key={`${s.year}-${idx}`}>
                        <CTableDataCell>{s.year}</CTableDataCell>
                        <CTableDataCell>{s.semester}</CTableDataCell>
                        <CTableDataCell>{s.seminarTitle}</CTableDataCell>
                        <CTableDataCell>{s.organizer}</CTableDataCell>
                        <CTableDataCell>{s.participationType}</CTableDataCell>
                        <CTableDataCell>{s.date}</CTableDataCell>
                        <CTableDataCell>{s.venue}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Competitive Exams */}
            {category === 'competitive' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Competitive Exams
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Exam Name</CTableHeaderCell>
                      <CTableHeaderCell>Registration No.</CTableHeaderCell>
                      <CTableHeaderCell>Score</CTableHeaderCell>
                      <CTableHeaderCell>Qualified</CTableHeaderCell>
                      <CTableHeaderCell>Exam Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {competitiveRows.map((c, idx) => (
                      <CTableRow key={`${c.year}-${idx}`}>
                        <CTableDataCell>{c.year}</CTableDataCell>
                        <CTableDataCell>{c.examName}</CTableDataCell>
                        <CTableDataCell>{c.registrationNo}</CTableDataCell>
                        <CTableDataCell>{c.score}</CTableDataCell>
                        <CTableDataCell>{c.qualified}</CTableDataCell>
                        <CTableDataCell>{c.examDate}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Awards / Medals */}
            {category === 'awards' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Awards / Medals
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Award / Medal</CTableHeaderCell>
                      <CTableHeaderCell>Event</CTableHeaderCell>
                      <CTableHeaderCell>Level</CTableHeaderCell>
                      <CTableHeaderCell>Position</CTableHeaderCell>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {awardsRows.map((a, idx) => (
                      <CTableRow key={`${a.year}-${idx}`}>
                        <CTableDataCell>{a.year}</CTableDataCell>
                        <CTableDataCell>{a.awardName}</CTableDataCell>
                        <CTableDataCell>{a.eventName}</CTableDataCell>
                        <CTableDataCell>{a.level}</CTableDataCell>
                        <CTableDataCell>{a.position}</CTableDataCell>
                        <CTableDataCell>{a.date}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Paper Presentation */}
            {category === 'paper-presentation' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Paper Presentation
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Semester</CTableHeaderCell>
                      <CTableHeaderCell>Paper Title</CTableHeaderCell>
                      <CTableHeaderCell>Event / Conference</CTableHeaderCell>
                      <CTableHeaderCell>Organizer</CTableHeaderCell>
                      <CTableHeaderCell>Level</CTableHeaderCell>
                      <CTableHeaderCell>Award</CTableHeaderCell>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paperPresentationRows.map((p, idx) => (
                      <CTableRow key={`${p.year}-${idx}`}>
                        <CTableDataCell>{p.year}</CTableDataCell>
                        <CTableDataCell>{p.semester}</CTableDataCell>
                        <CTableDataCell>{p.title}</CTableDataCell>
                        <CTableDataCell>{p.event}</CTableDataCell>
                        <CTableDataCell>{p.organizer}</CTableDataCell>
                        <CTableDataCell>{p.level}</CTableDataCell>
                        <CTableDataCell>{p.award}</CTableDataCell>
                        <CTableDataCell>{p.date}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Paper Publications */}
            {category === 'paper-publications' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Paper Publications
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Semester</CTableHeaderCell>
                      <CTableHeaderCell>Paper Title</CTableHeaderCell>
                      <CTableHeaderCell>Journal / Conference</CTableHeaderCell>
                      <CTableHeaderCell>Publisher</CTableHeaderCell>
                      <CTableHeaderCell>ISSN</CTableHeaderCell>
                      <CTableHeaderCell>DOI</CTableHeaderCell>
                      <CTableHeaderCell>Publication Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paperPublicationRows.map((p, idx) => (
                      <CTableRow key={`${p.year}-${idx}`}>
                        <CTableDataCell>{p.year}</CTableDataCell>
                        <CTableDataCell>{p.semester}</CTableDataCell>
                        <CTableDataCell>{p.title}</CTableDataCell>
                        <CTableDataCell>{p.journal}</CTableDataCell>
                        <CTableDataCell>{p.publisher}</CTableDataCell>
                        <CTableDataCell>{p.issn}</CTableDataCell>
                        <CTableDataCell>{p.doi}</CTableDataCell>
                        <CTableDataCell>{p.publicationDate}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Membership */}
            {category === 'membership' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Membership
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Type</CTableHeaderCell>
                      <CTableHeaderCell>Organization</CTableHeaderCell>
                      <CTableHeaderCell>Membership ID</CTableHeaderCell>
                      <CTableHeaderCell>Valid From</CTableHeaderCell>
                      <CTableHeaderCell>Valid To</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {membershipRows.map((m, idx) => (
                      <CTableRow key={`${m.year}-${idx}`}>
                        <CTableDataCell>{m.year}</CTableDataCell>
                        <CTableDataCell>{m.membershipType}</CTableDataCell>
                        <CTableDataCell>{m.organization}</CTableDataCell>
                        <CTableDataCell>{m.membershipId}</CTableDataCell>
                        <CTableDataCell>{m.validityFrom}</CTableDataCell>
                        <CTableDataCell>{m.validityTo}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* MOOCs */}
            {category === 'moocs' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  MOOCs
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Semester</CTableHeaderCell>
                      <CTableHeaderCell>Course Name</CTableHeaderCell>
                      <CTableHeaderCell>Platform</CTableHeaderCell>
                      <CTableHeaderCell>Duration</CTableHeaderCell>
                      <CTableHeaderCell>Score</CTableHeaderCell>
                      <CTableHeaderCell>Certificate ID</CTableHeaderCell>
                      <CTableHeaderCell>Completion Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {moocsRows.map((m, idx) => (
                      <CTableRow key={`${m.year}-${idx}`}>
                        <CTableDataCell>{m.year}</CTableDataCell>
                        <CTableDataCell>{m.semester}</CTableDataCell>
                        <CTableDataCell>{m.courseName}</CTableDataCell>
                        <CTableDataCell>{m.platform}</CTableDataCell>
                        <CTableDataCell>{m.duration}</CTableDataCell>
                        <CTableDataCell>{m.score}</CTableDataCell>
                        <CTableDataCell>{m.certificateId}</CTableDataCell>
                        <CTableDataCell>{m.completionDate}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Value Added Courses */}
            {category === 'vac' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Value Added Courses
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Semester</CTableHeaderCell>
                      <CTableHeaderCell>Course Name</CTableHeaderCell>
                      <CTableHeaderCell>Organizer</CTableHeaderCell>
                      <CTableHeaderCell>Duration</CTableHeaderCell>
                      <CTableHeaderCell>Grade</CTableHeaderCell>
                      <CTableHeaderCell>Completion Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {vacRows.map((v, idx) => (
                      <CTableRow key={`${v.year}-${idx}`}>
                        <CTableDataCell>{v.year}</CTableDataCell>
                        <CTableDataCell>{v.semester}</CTableDataCell>
                        <CTableDataCell>{v.courseName}</CTableDataCell>
                        <CTableDataCell>{v.organizer}</CTableDataCell>
                        <CTableDataCell>{v.duration}</CTableDataCell>
                        <CTableDataCell>{v.grade}</CTableDataCell>
                        <CTableDataCell>{v.completionDate}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Add On Courses */}
            {category === 'addon' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Add On Courses
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Semester</CTableHeaderCell>
                      <CTableHeaderCell>Course Name</CTableHeaderCell>
                      <CTableHeaderCell>Organizer</CTableHeaderCell>
                      <CTableHeaderCell>Duration</CTableHeaderCell>
                      <CTableHeaderCell>Grade</CTableHeaderCell>
                      <CTableHeaderCell>Completion Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {addonRows.map((a, idx) => (
                      <CTableRow key={`${a.year}-${idx}`}>
                        <CTableDataCell>{a.year}</CTableDataCell>
                        <CTableDataCell>{a.semester}</CTableDataCell>
                        <CTableDataCell>{a.courseName}</CTableDataCell>
                        <CTableDataCell>{a.organizer}</CTableDataCell>
                        <CTableDataCell>{a.duration}</CTableDataCell>
                        <CTableDataCell>{a.grade}</CTableDataCell>
                        <CTableDataCell>{a.completionDate}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Certificate / Diploma (Completed) */}
            {category === 'certificate' && (
              <>
                <div className="fw-semibold mb-2" style={{ fontSize: 12 }}>
                  Certificate / Diploma
                </div>

                <CTable bordered small responsive className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Year</CTableHeaderCell>
                      <CTableHeaderCell>Semester</CTableHeaderCell>
                      <CTableHeaderCell>Type</CTableHeaderCell>
                      <CTableHeaderCell>Course / Program</CTableHeaderCell>
                      <CTableHeaderCell>Institute</CTableHeaderCell>
                      <CTableHeaderCell>Duration</CTableHeaderCell>
                      <CTableHeaderCell>Certificate No.</CTableHeaderCell>
                      <CTableHeaderCell>Completion Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {certificateRows.map((c, idx) => (
                      <CTableRow key={`${c.year}-${idx}`}>
                        <CTableDataCell>{c.year}</CTableDataCell>
                        <CTableDataCell>{c.semester}</CTableDataCell>
                        <CTableDataCell>{c.programType}</CTableDataCell>
                        <CTableDataCell>{c.courseName}</CTableDataCell>
                        <CTableDataCell>{c.institute}</CTableDataCell>
                        <CTableDataCell>{c.duration}</CTableDataCell>
                        <CTableDataCell>{c.certificateNo}</CTableDataCell>
                        <CTableDataCell>{c.completionDate}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </>
            )}

            {/* Close */}
            <div className="text-end mt-3">
              <CButton size="sm" color="secondary" variant="outline" onClick={onClosePhase4}>
                Close
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}
    </CardShell>
  )
}

export default StudentAcademicProfile
