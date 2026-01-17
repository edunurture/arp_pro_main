import React, { useMemo, useState } from 'react'
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
  CButton,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilMagnifyingGlass, cilTrash, cilSearch, cilPencil } from '@coreui/icons'
import { ArpButton } from '../../components/common'

/**
 * Converted from lecture_schedule.html
 * ARP + LMS Standard – Lecture Schedule
 */

const CircleBtn = ({ icon, color = 'secondary', title, onClick }) => (
  <CButton
    color={color}
    className="rounded-circle d-inline-flex align-items-center justify-content-center me-2"
    style={{ width: 36, height: 36, padding: 0 }}
    title={title}
    onClick={onClick}
  >
    <CIcon icon={icon} size="sm" />
  </CButton>
)

const LectureScheduleConfiguration = () => {
  const [showSchedule, setShowSchedule] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showAddLecture, setShowAddLecture] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [selectedNote, setSelectedNote] = useState(null)
  const [search, setSearch] = useState('')

  const schedules = useMemo(
    () => [
      {
        id: 1,
        code: '23-2AA-11T',
        name: 'Language - I',
        facultyId: '23KCAS01',
        faculty: 'Dr. G. Priya',
        dept: 'Department of Tamil',
        status: 'Course Not Scheduled',
      },
      {
        id: 2,
        code: '23-2AA-12E',
        name: 'English - I',
        facultyId: '23KCAS02',
        faculty: 'Dr. R. Prabhakaran',
        dept: 'Department of English',
        status: 'Course Scheduled',
      },
    ],
    [],
  )

  const notes = useMemo(
    () => [
      {
        id: 1,
        date: '01/12/2023',
        dayOrder: 'I',
        hour: '1',
        unit: 'Unit – I',
        topic: 'Introduction of Principles of Accountancy',
        status: 'Lecture Note is Pending',
      },
      {
        id: 2,
        date: '01/12/2023',
        dayOrder: 'I',
        hour: '3',
        unit: 'Unit – I',
        topic: 'Books of Original Entry',
        status: 'Lecture Note is Pending',
      },
    ],
    [],
  )

  const filteredNotes = notes.filter((n) =>
    Object.values(n).join(' ').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>LECTURE SCHEDULE</strong>
          </CCardHeader>
        </CCard>

        {/* FILTER FORM */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Lecture to be Scheduled for</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>Select Academic Year</option>
                    <option>2025 – 26</option>
                    <option>2026 – 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>Choose Semester</option>
                    <option>Sem – 1</option>
                    <option>Sem – 3</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Programme Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>Select Programme Code</option>
                    <option>N6MCA</option>
                    <option>N6MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput disabled />
                </CCol>

                <CCol md={12} className="text-end">
                  <ArpButton
                    label="Search"
                    icon="search"
                    color="primary"
                    onClick={() => setShowSchedule(true)}
                  />
                  <ArpButton
                    label="Cancel"
                    icon="cancel"
                    color="secondary"
                    className="ms-2"
                    onClick={() => {
                      setShowSchedule(false)
                      setShowNotes(false)
                      setShowAddLecture(false)
                    }}
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* SCHEDULE TABLE */}
        {showSchedule && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Schedule</strong>
              <div>
                <CircleBtn
                  icon={cilPlus}
                  color="success"
                  title="Add Schedule"
                  onClick={() => setShowNotes(true)}
                />
                <CircleBtn icon={cilMagnifyingGlass} color="info" title="View" />
                <CircleBtn icon={cilTrash} color="danger" title="Delete" />
              </div>
            </CCardHeader>
            <CCardBody>
              <CTable bordered responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    <CTableHeaderCell>Faculty Id</CTableHeaderCell>
                    <CTableHeaderCell>Faculty Name</CTableHeaderCell>
                    <CTableHeaderCell>Department</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {schedules.map((s) => (
                    <CTableRow key={s.id}>
                      <CTableDataCell>
                        <CFormCheck
                          type="radio"
                          name="schedule"
                          checked={selectedSchedule === s.id}
                          onChange={() => setSelectedSchedule(s.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{s.code}</CTableDataCell>
                      <CTableDataCell>{s.name}</CTableDataCell>
                      <CTableDataCell>{s.facultyId}</CTableDataCell>
                      <CTableDataCell>{s.faculty}</CTableDataCell>
                      <CTableDataCell>{s.dept}</CTableDataCell>
                      <CTableDataCell>{s.status}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* LECTURE NOTES */}
        {showNotes && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <strong>Lecture Note</strong>
                <CircleBtn icon={cilPlus} color="success" onClick={() => setShowAddLecture(true)} />
                <CircleBtn icon={cilPencil} color="primary" />
                <CircleBtn icon={cilMagnifyingGlass} color="info" />
                <CircleBtn icon={cilTrash} color="danger" />
              </div>
              <CInputGroup size="sm" style={{ width: 260 }}>
                <CFormInput
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
              </CInputGroup>
            </CCardHeader>
            <CCardBody>
              <CTable bordered responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Day Order</CTableHeaderCell>
                    <CTableHeaderCell>Hour</CTableHeaderCell>
                    <CTableHeaderCell>Choose Chapter</CTableHeaderCell>
                    <CTableHeaderCell>Lecture Topic</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredNotes.map((n) => (
                    <CTableRow key={n.id}>
                      <CTableDataCell>
                        <CFormCheck
                          type="radio"
                          name="lecture"
                          checked={selectedNote === n.id}
                          onChange={() => setSelectedNote(n.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{n.date}</CTableDataCell>
                      <CTableDataCell>{n.dayOrder}</CTableDataCell>
                      <CTableDataCell>{n.hour}</CTableDataCell>
                      <CTableDataCell>
                        <CFormSelect>
                          <option>{n.unit}</option>
                        </CFormSelect>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CFormSelect>
                          <option>{n.topic}</option>
                        </CFormSelect>
                      </CTableDataCell>
                      <CTableDataCell>{n.status}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="text-end mt-3">
                <ArpButton label="Save" icon="save" color="success" />
                <ArpButton label="Cancel" icon="cancel" color="secondary" className="ms-2" />
              </div>
            </CCardBody>
          </CCard>
        )}

        {/* ADD LECTURE */}
        {showAddLecture && (
          <CCard>
            <CCardHeader>
              <strong>Add Lecture Form</strong>
            </CCardHeader>
            <CCardBody>
              <CRow className="g-3">
                <CCol md={4}>
                  <CFormLabel>Title of the Lecture</CFormLabel>
                  <CFormInput />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Lecture Aids</CFormLabel>
                  <CFormSelect>
                    <option>Select Lecture Aids</option>
                    <option>ICT Tools</option>
                    <option>Concept Map</option>
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Lecture Reference</CFormLabel>
                  <CFormInput />
                </CCol>
              </CRow>

              <div className="text-end mt-3">
                <ArpButton label="Save" icon="save" color="success" />
                <ArpButton
                  label="Cancel"
                  icon="cancel"
                  color="secondary"
                  className="ms-2"
                  onClick={() => setShowAddLecture(false)}
                />
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default LectureScheduleConfiguration
