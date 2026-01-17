import React, { useEffect, useMemo, useState } from 'react'
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
  CPagination,
  CPaginationItem,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'

const initialAcademic = {
  academicYear: '',
  semester: [],
  examMonthYear: '',
  examName: '',
  programme: '',
  programmeCode: '',
  courseCode: '',
  courseName: '',
}

const programmeCodeMap = {
  MCA: 'MCA101',
  MBA: 'MBA102',
}

const courseNameMap = {
  '21MCALT1': 'Advanced Logic',
  '21MBALT2': 'Business Tools',
}

const CiaMarkEntry = () => {
  // ===== Stage control =====
  const [isEdit, setIsEdit] = useState(false) // Add New enables academic form
  const [showStatus, setShowStatus] = useState(false) // Mark Entry Status
  const [showStudents, setShowStudents] = useState(false) // Student list mark entry

  // ===== Academic selection =====
  const [acad, setAcad] = useState(initialAcademic)

  // ===== Selections =====
  const [selectedStatusKey, setSelectedStatusKey] = useState(null)

  // ===== Status table UX =====
  const [statusSearch, setStatusSearch] = useState('')
  const [statusPageSize, setStatusPageSize] = useState(10)
  const [statusPage, setStatusPage] = useState(1)

  // ===== Student table UX =====
  const [studentSearch, setStudentSearch] = useState('')
  const [studentPageSize, setStudentPageSize] = useState(10)
  const [studentPage, setStudentPage] = useState(1)

  // ===== Data (demo; replace with API later) =====
  const statusRows = useMemo(
    () => [
      {
        key: '21MCALT1',
        courseCode: '21MCALT1',
        courseName: 'Advanced Logic',
        qpCode: 'QP123',
        dateSession: '2025-05-15 AM',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        markStatus: 'Pending',
      },
      {
        key: '21MBALT2',
        courseCode: '21MBALT2',
        courseName: 'Business Tools',
        qpCode: 'QP456',
        dateSession: '2025-05-16 PM',
        startTime: '2:00 PM',
        endTime: '4:00 PM',
        markStatus: 'Completed',
      },
    ],
    [],
  )

  const initialStudentState = useMemo(
    () => [
      { key: '23CA001', regNo: '23CA001', name: 'ARCHANA .D', mark: '', result: '', remarks: '' },
      { key: '23CA002', regNo: '23CA002', name: 'RAMESH K', mark: '', result: '', remarks: '' },
      { key: '23CA003', regNo: '23CA003', name: 'SANDHYA T', mark: '', result: '', remarks: '' },
      { key: '23CA004', regNo: '23CA004', name: 'KARTHIK N', mark: '', result: '', remarks: '' },
    ],
    [],
  )

  const [students, setStudents] = useState(initialStudentState)

  // ===== Helpers =====
  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const onAcadChange = (key) => (e) => {
    const val = e.target.value

    if (key === 'semester') {
      const selected = Array.from(e.target.selectedOptions).map((o) => o.value)
      setAcad((p) => ({ ...p, semester: selected }))
      return
    }

    setAcad((p) => ({ ...p, [key]: val }))

    if (key === 'programme') {
      setAcad((p) => ({
        ...p,
        programme: val,
        programmeCode: programmeCodeMap[val] || '',
      }))
    }

    if (key === 'courseCode') {
      setAcad((p) => ({
        ...p,
        courseCode: val,
        courseName: courseNameMap[val] || '',
      }))
    }
  }

  // ===== Header actions =====
  const onAddNew = () => {
    setIsEdit(true)
    setShowStatus(false)
    setShowStudents(false)
    setSelectedStatusKey(null)
  }

  const onView = () => {
    setShowStatus(true)
    setShowStudents(false)
  }

  // ===== Form actions =====
  const onSearch = () => {
    setShowStatus(true)
    setShowStudents(false)
  }

  const onCancel = () => {
    setAcad(initialAcademic)
    setIsEdit(false)
    setShowStatus(false)
    setShowStudents(false)
    setSelectedStatusKey(null)
    setStudents(initialStudentState)
  }

  // ===== Status action (🔗 in HTML) =====
  const openStudentList = (statusKey) => {
    setSelectedStatusKey(statusKey)
    setShowStudents(true)
  }

  // ===== Status table: filter + pagination =====
  useEffect(() => setStatusPage(1), [statusSearch, statusPageSize])

  const filteredStatus = useMemo(() => {
    const q = normalize(statusSearch)
    if (!q) return statusRows
    return statusRows.filter((r) =>
      [r.courseCode, r.courseName, r.qpCode, r.dateSession, r.markStatus].map(normalize).join(' ').includes(q),
    )
  }, [statusRows, statusSearch])

  const statusTotalPages = Math.max(1, Math.ceil(filteredStatus.length / statusPageSize))
  const statusSafePage = Math.min(statusPage, statusTotalPages)
  const statusStart = (statusSafePage - 1) * statusPageSize
  const statusPageRows = filteredStatus.slice(statusStart, statusStart + statusPageSize)

  // ===== Student table: filter + pagination =====
  useEffect(() => setStudentPage(1), [studentSearch, studentPageSize])

  const filteredStudents = useMemo(() => {
    const q = normalize(studentSearch)
    if (!q) return students
    return students.filter((r) => [r.regNo, r.name].map(normalize).join(' ').includes(q))
  }, [students, studentSearch])

  const studentTotalPages = Math.max(1, Math.ceil(filteredStudents.length / studentPageSize))
  const studentSafePage = Math.min(studentPage, studentTotalPages)
  const studentStart = (studentSafePage - 1) * studentPageSize
  const studentPageRows = filteredStudents.slice(studentStart, studentStart + studentPageSize)

  // ===== Mark Entry rules =====
  const setMark = (key, value) => {
    // allow empty while typing; enforce 0-100
    if (value === '') {
      setStudents((p) => p.map((s) => (s.key === key ? { ...s, mark: '' } : s)))
      return
    }
    const v = Number(value)
    if (Number.isNaN(v)) return
    const safe = Math.max(0, Math.min(100, Math.trunc(v)))
    setStudents((p) => p.map((s) => (s.key === key ? { ...s, mark: String(safe) } : s)))
  }

  // Pass/Fail/Absent mutually exclusive => store in result: 'PASS' | 'FAIL' | 'ABSENT' | ''
  const setResult = (key, result) => {
    setStudents((p) => p.map((s) => (s.key === key ? { ...s, result } : s)))
  }

  const setRemarks = (key, remarks) => {
    setStudents((p) => p.map((s) => (s.key === key ? { ...s, remarks } : s)))
  }

  // ===== Student action buttons =====
  const onStudentSave = () => {
    // Hook API submit here
  }

  const onStudentCancel = () => {
    setShowStudents(false)
    setStudents(initialStudentState)
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>CIA MARK ENTRY</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="primary" onClick={onAddNew} title="Add New" />
              <ArpButton label="View" icon="view" color="secondary" onClick={onView} title="View" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD (Academic Mark Entry) ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Academic Mark Entry</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={(e) => e.preventDefault()}>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.academicYear} onChange={onAcadChange('academicYear')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="2025 – 26">2025 – 26</option>
                    <option value="2026 – 27">2026 – 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    multiple
                    value={acad.semester}
                    onChange={onAcadChange('semester')}
                    disabled={!isEdit}
                    title="Choose Semester"
                  >
                    <option value="Sem – 1">Sem – 1</option>
                    <option value="Sem – 3">Sem – 3</option>
                    <option value="Sem – 5">Sem – 5</option>
                  </CFormSelect>
                </CCol>

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Month &amp; Year of Examination</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.examMonthYear} onChange={onAcadChange('examMonthYear')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="May 2025">May 2025</option>
                    <option value="Nov 2025">Nov 2025</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Name of the Examination</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.examName} onChange={onAcadChange('examName')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="CIA Test – 1">CIA Test – 1</option>
                    <option value="CIA Test – 2">CIA Test – 2</option>
                  </CFormSelect>
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.programme} onChange={onAcadChange('programme')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={acad.programmeCode} disabled />
                </CCol>

                {/* Row 4 */}
                <CCol md={3}>
                  <CFormLabel>Course Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.courseCode} onChange={onAcadChange('courseCode')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="21MCALT1">21MCALT1</option>
                    <option value="21MBALT2">21MBALT2</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Course Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={acad.courseName} disabled />
                </CCol>

                {/* Actions */}
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton
                    label="Search"
                    icon="view"
                    color="primary"
                    type="button"
                    onClick={onSearch}
                    disabled={!isEdit}
                    title="Search"
                  />
                  <ArpButton
                    label="Cancel"
                    icon="cancel"
                    color="secondary"
                    type="button"
                    onClick={onCancel}
                    title="Cancel"
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD (Mark Entry Status) ================= */}
        {showStatus && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Mark Entry Status</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                <CFormInput
                  size="sm"
                  placeholder="Search..."
                  value={statusSearch}
                  onChange={(e) => setStatusSearch(e.target.value)}
                  style={{ width: 260, flex: '0 0 auto' }}
                />
                <CFormSelect
                  size="sm"
                  value={statusPageSize}
                  onChange={(e) => setStatusPageSize(Number(e.target.value))}
                  style={{ width: 120, flex: '0 0 auto' }}
                  title="Rows per page"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </CFormSelect>
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    <CTableHeaderCell>QP Code</CTableHeaderCell>
                    <CTableHeaderCell>Date &amp; Session</CTableHeaderCell>
                    <CTableHeaderCell>Start Time</CTableHeaderCell>
                    <CTableHeaderCell>End Time</CTableHeaderCell>
                    <CTableHeaderCell>Mark Entry Status</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 90 }} className="text-center">
                      Action
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {statusPageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={9} className="text-center py-4">
                        No records found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    statusPageRows.map((r) => (
                      <CTableRow key={r.key}>
                        <CTableDataCell className="text-center">
                          <input
                            type="radio"
                            name="statusRow"
                            checked={selectedStatusKey === r.key}
                            onChange={() => setSelectedStatusKey(r.key)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>{r.courseCode}</CTableDataCell>
                        <CTableDataCell>{r.courseName}</CTableDataCell>
                        <CTableDataCell>{r.qpCode}</CTableDataCell>
                        <CTableDataCell>{r.dateSession}</CTableDataCell>
                        <CTableDataCell>{r.startTime}</CTableDataCell>
                        <CTableDataCell>{r.endTime}</CTableDataCell>
                        <CTableDataCell>{r.markStatus}</CTableDataCell>
                        <CTableDataCell className="text-center">
                          <ArpIconButton
                            icon="upload"
                            color="primary"
                            title="Open Mark Entry"
                            onClick={() => openStudentList(r.key)}
                            disabled={!selectedStatusKey || selectedStatusKey !== r.key}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end mt-2">
                <CPagination size="sm" className="mb-0">
                  <CPaginationItem disabled={statusSafePage <= 1} onClick={() => setStatusPage(1)}>
                    «
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={statusSafePage <= 1}
                    onClick={() => setStatusPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </CPaginationItem>
                  <CPaginationItem active>{statusSafePage}</CPaginationItem>
                  <CPaginationItem
                    disabled={statusSafePage >= statusTotalPages}
                    onClick={() => setStatusPage((p) => Math.min(statusTotalPages, p + 1))}
                  >
                    ›
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={statusSafePage >= statusTotalPages}
                    onClick={() => setStatusPage(statusTotalPages)}
                  >
                    »
                  </CPaginationItem>
                </CPagination>
              </div>
            </CCardBody>
          </CCard>
        )}

        {/* ================= TABLE CARD (Students Mark Entry) ================= */}
        {showStudents && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Mark Entry – List of Students</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                <CFormInput
                  size="sm"
                  placeholder="Search..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ width: 220, flex: '0 0 auto' }}
                />

                <CFormSelect
                  size="sm"
                  value={studentPageSize}
                  onChange={(e) => setStudentPageSize(Number(e.target.value))}
                  style={{ width: 120, flex: '0 0 auto' }}
                  title="Rows per page"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </CFormSelect>

                <div className="d-flex gap-2 align-items-center flex-nowrap" style={{ flex: '0 0 auto' }}>
                  <ArpIconButton icon="add" color="success" title="Add" />
                  <ArpIconButton icon="upload" color="info" title="Upload" />
                  <ArpIconButton icon="edit" color="warning" title="Edit" />
                  <ArpIconButton icon="download" color="primary" title="Download" />
                  <ArpIconButton icon="print" color="secondary" title="Print" />
                </div>
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Reg. No.</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 140 }}>Mark Entry</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 80 }} className="text-center">
                      Pass
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 80 }} className="text-center">
                      Fail
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 90 }} className="text-center">
                      Absent
                    </CTableHeaderCell>
                    <CTableHeaderCell>Remarks</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {studentPageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center py-4">
                        No records found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    studentPageRows.map((s) => (
                      <CTableRow key={s.key}>
                        <CTableDataCell>{s.regNo}</CTableDataCell>
                        <CTableDataCell>{s.name}</CTableDataCell>
                        <CTableDataCell>
                          <CFormInput
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={s.mark}
                            onChange={(e) => setMark(s.key, e.target.value)}
                          />
                        </CTableDataCell>

                        <CTableDataCell className="text-center">
                          <input
                            type="checkbox"
                            checked={s.result === 'PASS'}
                            onChange={(e) => setResult(s.key, e.target.checked ? 'PASS' : '')}
                            disabled={s.result !== '' && s.result !== 'PASS'}
                          />
                        </CTableDataCell>

                        <CTableDataCell className="text-center">
                          <input
                            type="checkbox"
                            checked={s.result === 'FAIL'}
                            onChange={(e) => setResult(s.key, e.target.checked ? 'FAIL' : '')}
                            disabled={s.result !== '' && s.result !== 'FAIL'}
                          />
                        </CTableDataCell>

                        <CTableDataCell className="text-center">
                          <input
                            type="checkbox"
                            checked={s.result === 'ABSENT'}
                            onChange={(e) => setResult(s.key, e.target.checked ? 'ABSENT' : '')}
                            disabled={s.result !== '' && s.result !== 'ABSENT'}
                          />
                        </CTableDataCell>

                        <CTableDataCell>
                          <CFormInput value={s.remarks} onChange={(e) => setRemarks(s.key, e.target.value)} />
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-between align-items-center mt-2">
                <div className="d-flex gap-2">
                  <ArpButton label="Save" icon="save" color="success" type="button" onClick={onStudentSave} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onStudentCancel} />
                </div>

                <CPagination size="sm" className="mb-0">
                  <CPaginationItem disabled={studentSafePage <= 1} onClick={() => setStudentPage(1)}>
                    «
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={studentSafePage <= 1}
                    onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </CPaginationItem>
                  <CPaginationItem active>{studentSafePage}</CPaginationItem>
                  <CPaginationItem
                    disabled={studentSafePage >= studentTotalPages}
                    onClick={() => setStudentPage((p) => Math.min(studentTotalPages, p + 1))}
                  >
                    ›
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={studentSafePage >= studentTotalPages}
                    onClick={() => setStudentPage(studentTotalPages)}
                  >
                    »
                  </CPaginationItem>
                </CPagination>
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default CiaMarkEntry