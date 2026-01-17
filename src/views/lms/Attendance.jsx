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
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CTooltip,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilSave, cilX, cilCheckCircle } from '@coreui/icons'

/**
 * AttendanceConfiguration_full.js
 * Converted from attendance.html (no jQuery, no DOM injection)
 * 3-stage flow:
 * 1) Search Filters
 * 2) Timetable Grid (Record Attendance per slot)
 * 3) Attendance Entry (P/A/OD/L/LA with column + row logic)
 *
 * NOTE: Replace mock data + API hooks as needed.
 */

const STATUSES = ['P', 'A', 'OD', 'L', 'LA']

const CircleBtn = ({ color = 'primary', title, icon, onClick, disabled }) => (
  <CButton
    color={color}
    className="rounded-circle d-inline-flex align-items-center justify-content-center"
    style={{ width: 36, height: 36, padding: 0 }}
    onClick={onClick}
    disabled={disabled}
    title={title}
    type="button"
  >
    <CIcon icon={icon} size="sm" />
  </CButton>
)

const AttendanceConfiguration = () => {
  // stage control
  const [showTimetable, setShowTimetable] = useState(false)
  const [showAttendance, setShowAttendance] = useState(false)

  // selected slot for attendance
  const [selectedSlot, setSelectedSlot] = useState(null) // { dayOrder, hour, courseCode, courseName, facultyId, facultyName }

  // filters (mock)
  const [filters, setFilters] = useState({
    academicYear: '',
    semester: '',
    programmeCode: '',
    programmeName: 'Automatically Fetched',
    courseName: '',
    faculty: '',
    className: '',
    attendanceDate: '',
  })

  // mock timetable data (Day Order x Hours)
  const timetable = useMemo(() => {
    const days = [
      { dayOrder: 'I', label: 'Day Order - I' },
      { dayOrder: 'II', label: 'Day Order - II' },
      { dayOrder: 'III', label: 'Day Order - III' },
      { dayOrder: 'IV', label: 'Day Order - IV' },
      { dayOrder: 'V', label: 'Day Order - V' },
    ]
    const hours = ['1', '2', '3', '4', '5', '6']
    return { days, hours }
  }, [])

  const slotMeta = useMemo(
    () => ({
      courseCode: '23-2AA-11T',
      courseName: 'Language - I',
      facultyId: '23KCAS01',
      facultyName: 'Dr. M. Elamparithi',
      attendanceStatus: 'Attendance not Recorded',
    }),
    [],
  )

  // mock students
  const students = useMemo(
    () => [
      { id: '22MCA001', name: 'Student 1' },
      { id: '22MCA002', name: 'Student 2' },
      { id: '22MCA003', name: 'Student 3' },
      { id: '22MCA004', name: 'Student 4' },
      { id: '22MCA005', name: 'Student 5' },
    ],
    [],
  )

  // attendance state: { [studentId]: 'P'|'A'|'OD'|'L'|'LA'|null }
  const [attendance, setAttendance] = useState({})

  // helper: set exactly one status per student
  const setStudentStatus = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status,
    }))
  }

  // column select: set all students to status
  const setColumnStatus = (status) => {
    const next = {}
    students.forEach((s) => {
      next[s.id] = status
    })
    setAttendance(next)
  }

  // compute totals + percentage (based on P vs total)
  const totals = useMemo(() => {
    let P = 0
    let A = 0
    let OD = 0
    let L = 0
    let LA = 0
    students.forEach((s) => {
      const v = attendance[s.id]
      if (v === 'P') P += 1
      if (v === 'A') A += 1
      if (v === 'OD') OD += 1
      if (v === 'L') L += 1
      if (v === 'LA') LA += 1
    })
    const total = students.length
    const pct = total ? Math.round((P / total) * 100) : 0
    return { total, P, A, OD, L, LA, pct }
  }, [attendance, students])

  const resetAll = () => {
    setShowTimetable(false)
    setShowAttendance(false)
    setSelectedSlot(null)
    setAttendance({})
    setFilters((f) => ({
      ...f,
      academicYear: '',
      semester: '',
      programmeCode: '',
      programmeName: 'Automatically Fetched',
      courseName: '',
      faculty: '',
      className: '',
      attendanceDate: '',
    }))
  }

  const onSearch = (e) => {
    e?.preventDefault?.()
    setShowTimetable(true)
    setShowAttendance(false)
    setSelectedSlot(null)
    setAttendance({})
  }

  const onRecordAttendance = (dayOrder, hour) => {
    const slot = {
      dayOrder,
      hour,
      courseCode: slotMeta.courseCode,
      courseName: slotMeta.courseName,
      facultyId: slotMeta.facultyId,
      facultyName: slotMeta.facultyName,
    }
    setSelectedSlot(slot)
    setShowAttendance(true)
    setAttendance({}) // fresh per slot
  }

  const onSaveAttendance = () => {
    // TODO: Replace with API call
    // payload example:
    // { filters, slot: selectedSlot, attendance }
    // For now, just keep state.
    // You can show a toast here in your project.
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>ATTENDANCE</strong>
          </CCardHeader>
        </CCard>

        {/* FILTER FORM */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Course Selection</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSearch}>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={filters.academicYear}
                    onChange={(e) => setFilters((p) => ({ ...p, academicYear: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="2025-26">2025 - 26</option>
                    <option value="2026-27">2026 - 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={filters.semester}
                    onChange={(e) => setFilters((p) => ({ ...p, semester: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="Sem-1">Sem - 1</option>
                    <option value="Sem-3">Sem - 3</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={filters.programmeCode}
                    onChange={(e) => setFilters((p) => ({ ...p, programmeCode: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="N6MCA">N6MCA</option>
                    <option value="N6MBA">N6MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput value={filters.programmeName} disabled />
                </CCol>

                <CCol md={3}><CFormLabel>Course Name</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={filters.courseName}
                    onChange={(e) => setFilters((p) => ({ ...p, courseName: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="Language-I">Language - I</option>
                    <option value="English-I">English - I</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Faculty</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={filters.faculty}
                    onChange={(e) => setFilters((p) => ({ ...p, faculty: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="23KCAS01">23KCAS01 - Dr. M. Elamparithi</option>
                    <option value="23KCAS02">23KCAS02 - Dr. M. Senthil</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Class</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={filters.className}
                    onChange={(e) => setFilters((p) => ({ ...p, className: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="I-MCA-A">I MCA - A</option>
                    <option value="I-MBA-A">I MBA - A</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Attendance Date</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput
                    type="date"
                    value={filters.attendanceDate}
                    onChange={(e) => setFilters((p) => ({ ...p, attendanceDate: e.target.value }))}
                  />
                </CCol>

                <CCol md={12} className="d-flex justify-content-end gap-2 mt-2">
                  <CButton color="primary" type="submit" className="d-inline-flex align-items-center gap-2">
                    <CIcon icon={cilSearch} />
                    Search
                  </CButton>
                  <CButton color="secondary" type="button" onClick={resetAll} className="d-inline-flex align-items-center gap-2">
                    <CIcon icon={cilX} />
                    Cancel
                  </CButton>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* TIMETABLE GRID */}
        {showTimetable && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Time Table</strong>
              {selectedSlot && (
                <CBadge color="info">
                  Selected: Day {selectedSlot.dayOrder} | Hour {selectedSlot.hour}
                </CBadge>
              )}
            </CCardHeader>
            <CCardBody>
              <CTable bordered responsive align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 160 }}>Day Order</CTableHeaderCell>
                    {timetable.hours.map((h) => (
                      <CTableHeaderCell key={h}>Hour {h}</CTableHeaderCell>
                    ))}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {timetable.days.map((d) => (
                    <CTableRow key={d.dayOrder}>
                      <CTableDataCell>
                        <CFormInput value={d.label} disabled />
                      </CTableDataCell>
                      {timetable.hours.map((h) => (
                        <CTableDataCell key={h}>
                          <CTooltip
                            placement="top"
                            content={`${slotMeta.courseName} | ${slotMeta.facultyId} - ${slotMeta.facultyName} | ${slotMeta.attendanceStatus}`}
                          >
                            <div className="d-flex flex-column gap-2">
                              <CDropdown>
                                <CDropdownToggle color="light" size="sm">
                                  {slotMeta.courseCode}
                                </CDropdownToggle>
                                <CDropdownMenu>
                                  <CDropdownItem
                                    onClick={() => onRecordAttendance(d.dayOrder, h)}
                                  >
                                    Record Attendance
                                  </CDropdownItem>
                                </CDropdownMenu>
                              </CDropdown>
                              <CButton
                                size="sm"
                                color="primary"
                                variant="outline"
                                onClick={() => onRecordAttendance(d.dayOrder, h)}
                              >
                                Record
                              </CButton>
                            </div>
                          </CTooltip>
                        </CTableDataCell>
                      ))}
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* ATTENDANCE ENTRY */}
        {showAttendance && (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <strong>Attendance Entry</strong>
                {selectedSlot && (
                  <CBadge color="secondary">
                    Day {selectedSlot.dayOrder} | Hour {selectedSlot.hour} | {selectedSlot.courseCode}
                  </CBadge>
                )}
                <CBadge color="light" className="text-dark">
                  Total: <strong>P</strong> : {totals.P} &nbsp;|&nbsp; <strong>A</strong> : {totals.A} &nbsp;|&nbsp; {totals.pct}%
                </CBadge>
              </div>

              <div className="d-flex gap-2">
                <CircleBtn color="success" title="Save" icon={cilSave} onClick={onSaveAttendance} />
                <CircleBtn
                  color="secondary"
                  title="Close"
                  icon={cilX}
                  onClick={() => {
                    setShowAttendance(false)
                    setSelectedSlot(null)
                    setAttendance({})
                  }}
                />
              </div>
            </CCardHeader>

            <CCardBody>
              {/* Column Quick Select */}
              <div className="d-flex align-items-center flex-wrap gap-3 mb-3">
                <CBadge color="info">Overall Attendance Details</CBadge>
                {STATUSES.map((s) => (
                  <CFormCheck
                    key={s}
                    type="checkbox"
                    id={`col-${s}`}
                    label={s}
                    checked={
                      students.length > 0 &&
                      students.every((st) => attendance[st.id] === s)
                    }
                    onChange={() => setColumnStatus(s)}
                  />
                ))}
              </div>

              <CTable bordered hover responsive align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 60 }}>S.No</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 140 }}>Register No</CTableHeaderCell>
                    <CTableHeaderCell>Student Name</CTableHeaderCell>
                    {STATUSES.map((s) => (
                      <CTableHeaderCell key={s} style={{ width: 80 }} className="text-center">
                        {s}
                      </CTableHeaderCell>
                    ))}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {students.map((st, idx) => (
                    <CTableRow key={st.id}>
                      <CTableDataCell>{idx + 1}</CTableDataCell>
                      <CTableDataCell>{st.id}</CTableDataCell>
                      <CTableDataCell className="d-flex align-items-center gap-2">
                        <span>{st.name}</span>
                        {attendance[st.id] && (
                          <CBadge color="success" className="d-inline-flex align-items-center gap-1">
                            <CIcon icon={cilCheckCircle} size="sm" /> {attendance[st.id]}
                          </CBadge>
                        )}
                      </CTableDataCell>

                      {STATUSES.map((s) => (
                        <CTableDataCell key={s} className="text-center">
                          <CFormCheck
                            type="checkbox"
                            checked={attendance[st.id] === s}
                            onChange={() => setStudentStatus(st.id, s)}
                          />
                        </CTableDataCell>
                      ))}
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default AttendanceConfiguration
