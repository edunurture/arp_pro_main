import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  semester: '',
  examMonthYear: '',
  examName: '',
  programme: '',
  onlineDate: '',
}

const OnlineExamination = () => {
  // ===== Phase control =====
  const [isEdit, setIsEdit] = useState(false) // Add New enables form
  const [showSchedule, setShowSchedule] = useState(false) // Phase 2
  const [showUpload, setShowUpload] = useState(false) // Phase 3

  // ===== selections =====
  const [selectedScheduleKey, setSelectedScheduleKey] = useState(null)
  const [selectedStudentKeys, setSelectedStudentKeys] = useState({}) // checkbox selection per row

  // ===== forms =====
  const [acad, setAcad] = useState(initialAcademic)

  // ===== stop clock =====
  const [stopClock, setStopClock] = useState('--:--:--')
  const clockRef = useRef(null)

  // ===== Table UX: schedule =====
  const [scheduleSearch, setScheduleSearch] = useState('')
  const [schedulePageSize, setSchedulePageSize] = useState(10)
  const [schedulePage, setSchedulePage] = useState(1)

  // ===== Table UX: upload =====
  const [uploadSearch, setUploadSearch] = useState('')
  const [uploadPageSize, setUploadPageSize] = useState(10)
  const [uploadPage, setUploadPage] = useState(1)

  // ===== Demo data (replace with API later) =====
  const scheduleRows = useMemo(
    () => [
      {
        key: 'CS101',
        courseCode: 'CS101',
        courseName: 'Computer Basics',
        qpCode: 'QP1001',
        dateSession: '2025-04-20 / FN',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        mode: 'Online',
      },
    ],
    [],
  )

  const uploadRows = useMemo(
    () => [
      {
        key: 'REG001',
        regNo: 'REG001',
        name: 'John Doe',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
      },
    ],
    [],
  )

  // ===== Helpers =====
  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  // ===== Academic selection behaviors =====
  const onAcadChange = (key) => (e) => setAcad((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setIsEdit(true)
    setShowSchedule(false)
    setShowUpload(false)
    setSelectedScheduleKey(null)
    setSelectedStudentKeys({})
  }

  const onView = () => {
    setShowSchedule(true)
    setShowUpload(false)
  }

  const onSearch = () => {
    setShowSchedule(true)
    setShowUpload(false)
  }

  const onCancel = () => {
    setIsEdit(false)
    setShowSchedule(false)
    setShowUpload(false)
    setSelectedScheduleKey(null)
    setSelectedStudentKeys({})
    setAcad(initialAcademic)
    stopClockStop()
  }

  // ===== Phase 3: open upload section =====
  const openUpload = (scheduleKey) => {
    setSelectedScheduleKey(scheduleKey)
    setShowUpload(true)
    stopClockStart()
  }

  // ===== Stop clock =====
  const stopClockStart = () => {
    stopClockStop()
    const tick = () => {
      const now = new Date()
      setStopClock(now.toLocaleTimeString())
    }
    tick()
    clockRef.current = setInterval(tick, 1000)
  }

  const stopClockStop = () => {
    if (clockRef.current) {
      clearInterval(clockRef.current)
      clockRef.current = null
    }
    setStopClock('--:--:--')
  }

  useEffect(() => {
    return () => stopClockStop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== Schedule table: filter + pagination =====
  useEffect(() => setSchedulePage(1), [scheduleSearch, schedulePageSize])
  const filteredSchedule = useMemo(() => {
    const q = normalize(scheduleSearch)
    if (!q) return scheduleRows
    return scheduleRows.filter((r) =>
      [r.courseCode, r.courseName, r.qpCode, r.dateSession, r.mode].map(normalize).join(' ').includes(q),
    )
  }, [scheduleRows, scheduleSearch])

  const scheduleTotalPages = Math.max(1, Math.ceil(filteredSchedule.length / schedulePageSize))
  const scheduleSafePage = Math.min(schedulePage, scheduleTotalPages)
  const scheduleStart = (scheduleSafePage - 1) * schedulePageSize
  const schedulePageRows = filteredSchedule.slice(scheduleStart, scheduleStart + schedulePageSize)

  // ===== Upload table: filter + pagination =====
  useEffect(() => setUploadPage(1), [uploadSearch, uploadPageSize])
  const filteredUpload = useMemo(() => {
    const q = normalize(uploadSearch)
    if (!q) return uploadRows
    return uploadRows.filter((r) => [r.regNo, r.name, r.startTime, r.endTime].map(normalize).join(' ').includes(q))
  }, [uploadRows, uploadSearch])

  const uploadTotalPages = Math.max(1, Math.ceil(filteredUpload.length / uploadPageSize))
  const uploadSafePage = Math.min(uploadPage, uploadTotalPages)
  const uploadStart = (uploadSafePage - 1) * uploadPageSize
  const uploadPageRows = filteredUpload.slice(uploadStart, uploadStart + uploadPageSize)

  // ===== Upload actions =====
  const onToggleStudent = (key) => (e) => {
    const checked = e.target.checked
    setSelectedStudentKeys((p) => ({ ...p, [key]: checked }))
  }

  const onDownloadQp = (studentKey) => {
    // Hook download
  }

  const onUploadAnswer = (studentKey, file) => {
    // Hook upload
  }

  const onBeginExam = () => {
    // Hook begin
  }

  const onEndExam = () => {
    // Hook end
    stopClockStop()
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>ONLINE EXAMINATION</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="primary" onClick={onAddNew} title="Add New" />
              <ArpButton label="View" icon="view" color="secondary" onClick={onView} title="View" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD (Academic Selection) ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Academic Selection Form</strong>
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
                    <option value="2025 - 26">2025 - 26</option>
                    <option value="2026 - 27">2026 - 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.semester} onChange={onAcadChange('semester')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Sem - 1">Sem - 1</option>
                    <option value="Sem - 3">Sem - 3</option>
                    <option value="Sem - 5">Sem - 5</option>
                  </CFormSelect>
                </CCol>

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Month &amp; Year of Examination</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput type="month" value={acad.examMonthYear} onChange={onAcadChange('examMonthYear')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Name of the Examination</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.examName} onChange={onAcadChange('examName')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="CIA Test - 1">CIA Test - 1</option>
                    <option value="CIA Test - 2">CIA Test - 2</option>
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
                  <CFormLabel>Online Examination Date</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput type="date" value={acad.onlineDate} onChange={onAcadChange('onlineDate')} disabled={!isEdit} />
                </CCol>

                {/* Actions */}
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Search" icon="view" color="primary" type="button" onClick={onSearch} disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD (Phase 2: Schedule) ================= */}
        {showSchedule && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Online Examination Schedule</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                <CFormInput
                  size="sm"
                  placeholder="Search..."
                  value={scheduleSearch}
                  onChange={(e) => setScheduleSearch(e.target.value)}
                  style={{ width: 260, flex: '0 0 auto' }}
                />
                <CFormSelect
                  size="sm"
                  value={schedulePageSize}
                  onChange={(e) => setSchedulePageSize(Number(e.target.value))}
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
                    <CTableHeaderCell>Conduction Mode</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 90 }} className="text-center">
                      Action
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {schedulePageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={9} className="text-center py-4">
                        No records found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    schedulePageRows.map((r) => (
                      <CTableRow key={r.key}>
                        <CTableDataCell className="text-center">
                          <input
                            type="radio"
                            name="scheduleRow"
                            checked={selectedScheduleKey === r.key}
                            onChange={() => setSelectedScheduleKey(r.key)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>{r.courseCode}</CTableDataCell>
                        <CTableDataCell>{r.courseName}</CTableDataCell>
                        <CTableDataCell>{r.qpCode}</CTableDataCell>
                        <CTableDataCell>{r.dateSession}</CTableDataCell>
                        <CTableDataCell>{r.startTime}</CTableDataCell>
                        <CTableDataCell>{r.endTime}</CTableDataCell>
                        <CTableDataCell>{r.mode}</CTableDataCell>
                        <CTableDataCell className="text-center">
                          <ArpIconButton
                            icon="upload"
                            color="primary"
                            title="Open Upload"
                            onClick={() => openUpload(r.key)}
                            disabled={!selectedScheduleKey || selectedScheduleKey !== r.key}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end mt-2">
                <CPagination size="sm" className="mb-0">
                  <CPaginationItem disabled={scheduleSafePage <= 1} onClick={() => setSchedulePage(1)}>
                    «
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={scheduleSafePage <= 1}
                    onClick={() => setSchedulePage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </CPaginationItem>

                  <CPaginationItem active>{scheduleSafePage}</CPaginationItem>

                  <CPaginationItem
                    disabled={scheduleSafePage >= scheduleTotalPages}
                    onClick={() => setSchedulePage((p) => Math.min(scheduleTotalPages, p + 1))}
                  >
                    ›
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={scheduleSafePage >= scheduleTotalPages}
                    onClick={() => setSchedulePage(scheduleTotalPages)}
                  >
                    »
                  </CPaginationItem>
                </CPagination>
              </div>
            </CCardBody>
          </CCard>
        )}

        {/* ================= TABLE CARD (Phase 3: Upload & Submit Mode) ================= */}
        {showUpload && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Upload &amp; Submit Mode</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                <strong>Stop Clock:&nbsp;</strong>
                <span style={{ flex: '0 0 auto' }}>{stopClock}</span>

                <CFormInput
                  size="sm"
                  placeholder="Search..."
                  value={uploadSearch}
                  onChange={(e) => setUploadSearch(e.target.value)}
                  style={{ width: 260, flex: '0 0 auto' }}
                />

                <CFormSelect
                  size="sm"
                  value={uploadPageSize}
                  onChange={(e) => setUploadPageSize(Number(e.target.value))}
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
                    <CTableHeaderCell style={{ width: 70 }} className="text-center">
                      Select
                    </CTableHeaderCell>
                    <CTableHeaderCell>Reg. No.</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Start Time</CTableHeaderCell>
                    <CTableHeaderCell>End Time</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 140 }} className="text-center">
                      QP Download
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 220 }}>Upload Answer Script</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 140 }} className="text-center">
                      Action
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {uploadPageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={8} className="text-center py-4">
                        No records found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    uploadPageRows.map((r) => (
                      <CTableRow key={r.key}>
                        <CTableDataCell className="text-center">
                          <input type="checkbox" checked={!!selectedStudentKeys[r.key]} onChange={onToggleStudent(r.key)} />
                        </CTableDataCell>
                        <CTableDataCell>{r.regNo}</CTableDataCell>
                        <CTableDataCell>{r.name}</CTableDataCell>
                        <CTableDataCell>{r.startTime}</CTableDataCell>
                        <CTableDataCell>{r.endTime}</CTableDataCell>
                        <CTableDataCell className="text-center">
                          <ArpButton
                            label="Download"
                            icon="download"
                            color="primary"
                            type="button"
                            onClick={() => onDownloadQp(r.key)}
                            disabled={!selectedStudentKeys[r.key]}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormInput
                            type="file"
                            size="sm"
                            disabled={!selectedStudentKeys[r.key]}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              onUploadAnswer(r.key, file)
                              e.target.value = ''
                            }}
                          />
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <ArpIconButton
                              icon="download"
                              color="success"
                              title="Download"
                              onClick={() => onDownloadQp(r.key)}
                              disabled={!selectedStudentKeys[r.key]}
                            />
                            <ArpIconButton
                              icon="view"
                              color="info"
                              title="Preview"
                              disabled={!selectedStudentKeys[r.key]}
                            />
                          </div>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-between align-items-center mt-2">
                <div className="d-flex gap-2">
                  <ArpButton label="Begin Exam" icon="save" color="primary" type="button" onClick={onBeginExam} />
                  <ArpButton label="End Exam" icon="cancel" color="danger" type="button" onClick={onEndExam} />
                </div>

                <CPagination size="sm" className="mb-0">
                  <CPaginationItem disabled={uploadSafePage <= 1} onClick={() => setUploadPage(1)}>
                    «
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={uploadSafePage <= 1}
                    onClick={() => setUploadPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </CPaginationItem>

                  <CPaginationItem active>{uploadSafePage}</CPaginationItem>

                  <CPaginationItem
                    disabled={uploadSafePage >= uploadTotalPages}
                    onClick={() => setUploadPage((p) => Math.min(uploadTotalPages, p + 1))}
                  >
                    ›
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={uploadSafePage >= uploadTotalPages}
                    onClick={() => setUploadPage(uploadTotalPages)}
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

export default OnlineExamination