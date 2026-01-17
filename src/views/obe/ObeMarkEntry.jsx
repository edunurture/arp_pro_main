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
  CFormCheck,
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

/**
 * OBE Mark Entry (React + CoreUI) — Option A
 * - Status table remains visible
 * - Clicking "Mark Entry" shows Mark Entry section BELOW Status table
 * - Student Mark Entry section shows BELOW Mark Entry section
 * - Academic Selection: final row has Search + Reset aligned right
 * - Status header row: Search + Page Size + Mark Entry button + circle icon buttons
 *
 * NOTE: In-memory demo state. Wire API later.
 */

const normalize = (v) =>
  String(v ?? '')
    .toLowerCase()
    .trim()

const initialSelection = {
  academicYear: '',
  semester: '',
  examMonthYear: '',
  examName: '',
  programmeCode: '',
  programmeName: '',
  courseCode: '',
  courseName: '',
}

const demoStatusRows = [
  {
    id: 1,
    courseCode: '23CMA101',
    courseName: 'Business Mathematics',
    qpCode: 'QP-101',
    dateSession: '17/12/2023 – Fore Noon',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    status: 'Pending',
  },
  {
    id: 2,
    courseCode: '23CCA102',
    courseName: 'Programming in C',
    qpCode: 'QP-102',
    dateSession: '18/12/2023 – After Noon',
    startTime: '02:00 PM',
    endTime: '05:00 PM',
    status: 'Completed',
  },
]

// Question-wise template (demo)
const demoQuestions = [
  { q: 'Q1', max: 10, co: 'CO1', k: 'K2' },
  { q: 'Q2', max: 10, co: 'CO1', k: 'K3' },
  { q: 'Q3', max: 10, co: 'CO2', k: 'K2' },
  { q: 'Q4', max: 10, co: 'CO3', k: 'K4' },
  { q: 'Q5', max: 10, co: 'CO4', k: 'K3' },
]

// Student marks (demo)
const demoStudents = [
  { id: 1, regNo: '23UCS001', name: 'Student A' },
  { id: 2, regNo: '23UCS002', name: 'Student B' },
]

const ObeMarkEntry = () => {
  // ===== Academic selection =====
  const [selection, setSelection] = useState(initialSelection)
  const [searched, setSearched] = useState(false)

  // ===== Status table UX =====
  const [rows] = useState(demoStatusRows)
  const [selectedId, setSelectedId] = useState(null)
  const [tableSearch, setTableSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // ===== Show/hide sections (Option A) =====
  const [showMarkEntry, setShowMarkEntry] = useState(false)
  const [showStudentEntry, setShowStudentEntry] = useState(false)

  // ===== Mark Entry state =====
  const [questionRows, setQuestionRows] = useState(demoQuestions)

  // Student marks: { studentId: { Q1: value, ... } }
  const [studentMarks, setStudentMarks] = useState(() => {
    const init = {}
    demoStudents.forEach((s) => {
      init[s.id] = {}
      demoQuestions.forEach((q) => (init[s.id][q.q] = ''))
    })
    return init
  })

  // ===== dropdowns =====
  const years = useMemo(() => ['2025 – 26', '2026 – 27'], [])
  const semesters = useMemo(() => ['I', 'II', 'III', 'IV', 'V', 'VI'], [])
  const examNames = useMemo(() => ['CIA I', 'CIA II', 'CIA III', 'Model Exam', 'End Semester'], [])
  const programmeCodes = useMemo(() => ['B.COM', 'BBA', 'B.SC(CS)'], [])
  const courseCodes = useMemo(() => ['23CMA101', '23CCA102'], [])

  const onSelectionChange = (key) => (e) => {
    const val = e.target.value
    setSelection((p) => {
      const next = { ...p, [key]: val }

      // Demo auto-fill: programme name and course name
      if (key === 'programmeCode') {
        next.programmeName =
          val === 'B.COM' ? 'B.Com' : val === 'BBA' ? 'BBA' : val === 'B.SC(CS)' ? 'B.Sc (CS)' : ''
      }
      if (key === 'courseCode') {
        next.courseName = val === '23CMA101' ? 'Business Mathematics' : val === '23CCA102' ? 'Programming in C' : ''
      }
      return next
    })
  }

  const onSearch = (e) => {
    e.preventDefault()
    setSearched(true)
    setSelectedId(null)
    setShowMarkEntry(false)
    setShowStudentEntry(false)
  }

  const resetSelection = () => {
    setSelection(initialSelection)
    setSearched(false)
    setSelectedId(null)
    setShowMarkEntry(false)
    setShowStudentEntry(false)
  }

  // ===== Status table filtering/pagination =====
  const filtered = useMemo(() => {
    const q = normalize(tableSearch)
    if (!q) return rows
    return rows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))
  }, [rows, tableSearch])

  useEffect(() => setPage(1), [tableSearch, pageSize])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const pageRows = useMemo(() => filtered.slice(startIdx, endIdx), [filtered, startIdx, endIdx])

  // ===== Mark Entry handlers (demo) =====
  const openMarkEntry = () => {
    setSearched(true)
    setShowMarkEntry(true)
    setShowStudentEntry(false)
  }

  const openStudentEntry = () => {
    setShowStudentEntry(true)
  }

  const updateStudentMark = (studentId, qKey) => (e) => {
    const val = e.target.value
    setStudentMarks((p) => ({
      ...p,
      [studentId]: { ...(p[studentId] || {}), [qKey]: val },
    }))
  }

  const saveMarkEntry = () => {
    // TODO: API save
    // For now just keep state
    setShowStudentEntry(true)
  }

  const cancelMarkEntry = () => {
    setShowMarkEntry(false)
    setShowStudentEntry(false)
  }

  const resetMarkEntry = () => {
setQuestionRows(demoQuestions)
    // reset student marks
    const init = {}
    demoStudents.forEach((s) => {
      init[s.id] = {}
      demoQuestions.forEach((q) => (init[s.id][q.q] = ''))
    })
    setStudentMarks(init)
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>OBE MARK ENTRY</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={() => {}} title="Add New" />
              <ArpButton label="Edit" icon="edit" color="primary" onClick={() => {}} disabled={!selectedId} title="Edit Selected" />
              <ArpButton label="View" icon="view" color="info" onClick={() => {}} disabled={!selectedId} title="View Selected" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= ACADEMIC SELECTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Academic Selection</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSearch}>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={selection.academicYear} onChange={onSelectionChange('academicYear')}>
                    <option value="">Select</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={selection.semester} onChange={onSelectionChange('semester')}>
                    <option value="">Select</option>
                    {semesters.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Month &amp; Year of Examination</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    placeholder="MM/YYYY"
                    value={selection.examMonthYear}
                    onChange={onSelectionChange('examMonthYear')}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Name of the Examination</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={selection.examName} onChange={onSelectionChange('examName')}>
                    <option value="">Select</option>
                    {examNames.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={selection.programmeCode} onChange={onSelectionChange('programmeCode')}>
                    <option value="">Select</option>
                    {programmeCodes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={selection.programmeName} readOnly />
                </CCol>

                {/* Row 4 */}
                <CCol md={3}>
                  <CFormLabel>Course Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={selection.courseCode} onChange={onSelectionChange('courseCode')}>
                    <option value="">Select</option>
                    {courseCodes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Course Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={selection.courseName} readOnly />
                </CCol>

                {/* Final row: Search + Reset aligned right */}
                <CCol md={6} />
                <CCol md={6} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Search" icon="search" color="primary" type="submit" title="Search" />
                  <ArpButton label="Reset" icon="reset" color="warning" type="button" onClick={resetSelection} title="Reset" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= STATUS TABLE CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Status of OBE Mark Entry</strong>

            <div className="d-flex align-items-center gap-2 flex-nowrap">
              <CFormInput
                size="sm"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search..."
                title="Search"
              />

              <CFormSelect
                size="sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                title="Rows per page"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </CFormSelect>

              <ArpButton
                label="Mark Entry"
                icon="edit"
                color="info"
                type="button"
                onClick={openMarkEntry}
                disabled={!selectedId}
                title="Open Mark Entry"
                className="text-nowrap"
              />

              <div className="d-flex gap-2 align-items-center flex-nowrap">
                <ArpIconButton icon="view" color="purple" title="View" onClick={() => {}} disabled={!selectedId} />
                <ArpIconButton icon="edit" color="info" title="Edit" onClick={() => {}} disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" title="Delete" disabled={!selectedId} />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                  <CTableHeaderCell>Course Code</CTableHeaderCell>
                  <CTableHeaderCell>Course Name</CTableHeaderCell>
                  <CTableHeaderCell>QP Code</CTableHeaderCell>
                  <CTableHeaderCell>Date &amp; Session</CTableHeaderCell>
                  <CTableHeaderCell>Start - Time</CTableHeaderCell>
                  <CTableHeaderCell>End – Time</CTableHeaderCell>
                  <CTableHeaderCell>OBE Mark Entry Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {searched ? (
                  pageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={8} className="text-center py-4">
                        No records found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    pageRows.map((r) => (
                      <CTableRow key={r.id}>
                        <CTableDataCell className="text-center">
                          <CFormCheck
                            type="radio"
                            name="obeMarkRow"
                            checked={selectedId === r.id}
                            onChange={() => setSelectedId(r.id)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>{r.courseCode}</CTableDataCell>
                        <CTableDataCell>{r.courseName}</CTableDataCell>
                        <CTableDataCell>{r.qpCode}</CTableDataCell>
                        <CTableDataCell>{r.dateSession}</CTableDataCell>
                        <CTableDataCell>{r.startTime}</CTableDataCell>
                        <CTableDataCell>{r.endTime}</CTableDataCell>
                        <CTableDataCell>{r.status}</CTableDataCell>
                      </CTableRow>
                    ))
                  )
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center py-4">
                      Please search to view records.
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>

            <div className="d-flex justify-content-end mt-2">
              <CPagination size="sm" className="mb-0">
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage(1)}>
                  «
                </CPaginationItem>
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ‹
                </CPaginationItem>

                {Array.from({ length: totalPages })
                  .slice(Math.max(0, safePage - 3), Math.min(totalPages, safePage + 2))
                  .map((_, i) => {
                    const pageNumber = Math.max(1, safePage - 2) + i
                    if (pageNumber > totalPages) return null
                    return (
                      <CPaginationItem
                        key={pageNumber}
                        active={pageNumber === safePage}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </CPaginationItem>
                    )
                  })}

                <CPaginationItem
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </CPaginationItem>
                <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>
                  »
                </CPaginationItem>
              </CPagination>
            </div>
          </CCardBody>
        </CCard>

        {/* ================= MARK ENTRY SECTION (Below Status Table) ================= */}
        {showMarkEntry && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>OBE Mark Entry</strong>
              <div className="d-flex gap-2">
                <ArpButton
                  label="Student Mark Entry"
                  icon="view"
                  color="primary"
                  type="button"
                  onClick={openStudentEntry}
                  title="Open Student Mark Entry"
                />
                <ArpButton
                  label="Download Template"
                  icon="download"
                  color="info"
                  type="button"
                  onClick={() => {}}
                  title="Download Question-wise Template"
                />
                <ArpButton
                  label="Upload Marks"
                  icon="upload"
                  color="warning"
                  type="button"
                  onClick={() => {}}
                  title="Upload OBE Marks"
                />
              </div>
            </CCardHeader>

            <CCardBody>
              <CRow className="g-3">
                <CCol xs={12}>
                  <CTable hover responsive align="middle">
                    <CTableHead color="light">
                      <CTableRow>
                        <CTableHeaderCell>Questions</CTableHeaderCell>
                        <CTableHeaderCell>Max</CTableHeaderCell>
                        <CTableHeaderCell>Course Outcomes</CTableHeaderCell>
                        <CTableHeaderCell>Blooms Taxonomy</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {questionRows.map((r) => (
                        <CTableRow key={r.q}>
                          <CTableDataCell>{r.q}</CTableDataCell>
                          <CTableDataCell>{r.max}</CTableDataCell>
                          <CTableDataCell>{r.co}</CTableDataCell>
                          <CTableDataCell>{r.k}</CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        )}

        {/* ================= STUDENT MARK ENTRY SECTION (Below Mark Entry) ================= */}
        {showMarkEntry && showStudentEntry && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Student Mark Entry</strong>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 140 }}>Reg No</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: 180 }}>Student Name</CTableHeaderCell>
                    {questionRows.map((q) => (
                      <CTableHeaderCell key={q.q} style={{ width: 90 }}>
                        {q.q}
                      </CTableHeaderCell>
                    ))}
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {demoStudents.map((s) => (
                    <CTableRow key={s.id}>
                      <CTableDataCell>{s.regNo}</CTableDataCell>
                      <CTableDataCell>{s.name}</CTableDataCell>
                      {questionRows.map((q) => (
                        <CTableDataCell key={q.q}>
                          <CFormInput
                            size="sm"
                            value={studentMarks?.[s.id]?.[q.q] ?? ''}
                            onChange={updateStudentMark(s.id, q.q)}
                            placeholder="0"
                          />
                        </CTableDataCell>
                      ))}
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end gap-2 mt-2">
                <ArpButton label="Save" icon="save" color="success" type="button" onClick={() => {}} title="Save Student Marks" />
                <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={() => setShowStudentEntry(false)} title="Cancel" />
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default ObeMarkEntry
