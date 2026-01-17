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
 * OBE Attainment (React + CoreUI) — Option A
 * - Status table stays visible
 * - Clicking View shows Attainment Details section BELOW the status table
 * - Academic Selection: final row Search + Reset aligned right
 * - Status header row: Search + Page Size + circle icons (View/Delete)
 *
 * NOTE: Demo data only; wire API later.
 */

const normalize = (v) =>
  String(v ?? '')
    .toLowerCase()
    .trim()

const initialSelection = {
  academicYear: '',
  semester: '',
  programmeCode: '',
  programmeName: '',
  courseCode: '',
  courseName: '',
}

const demoStatusRows = [
  {
    id: 1,
    monthYear: 'Dec 2025',
    examName: 'CIA I',
    examDate: '12/12/2025',
    maxMarks: 100,
  },
  {
    id: 2,
    monthYear: 'Dec 2025',
    examName: 'End Semester',
    examDate: '20/12/2025',
    maxMarks: 100,
  },
]

// Demo “details” row structure derived from the HTML
const demoMeta = {
  acYear: '2025 – 26',
  sem: 'III',
  programme: 'B.Sc (CS)',
  monthYear: 'Dec 2025',
  conductionMode: 'Offline',
  dateSession: '12/12/2025 – Fore Noon',
}

const demoAttainmentRows = [
  { co: 'CO1', max: 20, students: 45, obtainedPct: 72, level: '3' },
  { co: 'CO2', max: 20, students: 41, obtainedPct: 68, level: '3' },
  { co: 'CO3', max: 20, students: 38, obtainedPct: 63, level: '2' },
  { co: 'CO4', max: 20, students: 30, obtainedPct: 50, level: '2' },
  { co: 'CO5', max: 20, students: 22, obtainedPct: 37, level: '1' },
]

const ObeAttainment = () => {
  // ===== Academic selection =====
  const [selection, setSelection] = useState(initialSelection)
  const [searched, setSearched] = useState(false)

  // ===== Status table UX =====
  const [rows] = useState(demoStatusRows)
  const [selectedId, setSelectedId] = useState(null)
  const [tableSearch, setTableSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // ===== Details section (Option A) =====
  const [showDetails, setShowDetails] = useState(false)
  const [activeReport, setActiveReport] = useState(null)

  // ===== dropdowns =====
  const years = useMemo(() => ['2025 – 26', '2026 – 27'], [])
  const semesters = useMemo(() => ['I', 'II', 'III', 'IV', 'V', 'VI'], [])
  const programmeCodes = useMemo(() => ['B.COM', 'BBA', 'B.SC(CS)'], [])
  const courseCodes = useMemo(() => ['23CMA101', '23CCA102'], [])

  const onSelectionChange = (key) => (e) => {
    const val = e.target.value
    setSelection((p) => {
      const next = { ...p, [key]: val }

      // demo auto-fill
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
    setShowDetails(false)
    setActiveReport(null)
  }

  const resetSelection = () => {
    setSelection(initialSelection)
    setSearched(false)
    setSelectedId(null)
    setShowDetails(false)
    setActiveReport(null)
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

  // ===== Actions =====
  const onView = () => {
    if (!selectedId) return
    const report = rows.find((r) => r.id === selectedId) || null
    setActiveReport(report)
    setShowDetails(true)
  }

  const onDelete = () => {
    // TODO: wire API delete (demo: no-op)
  }

  const closeDetails = () => {
    setShowDetails(false)
    setActiveReport(null)
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>OBE ATTAINMENT</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={() => {}} title="Add New" />
              <ArpButton label="Edit" icon="edit" color="primary" onClick={() => {}} disabled={!selectedId} title="Edit Selected" />
              <ArpButton label="View" icon="view" color="info" onClick={onView} disabled={!selectedId} title="View Selected" />
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

                {/* Row 3 */}
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
            <strong>OBE Attainment Report</strong>

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

              <div className="d-flex gap-2 align-items-center flex-nowrap">
                <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                  <CTableHeaderCell>Month &amp; Year of Examination</CTableHeaderCell>
                  <CTableHeaderCell>Name of the Examination</CTableHeaderCell>
                  <CTableHeaderCell>Date of Examination</CTableHeaderCell>
                  <CTableHeaderCell>Maximum Marks</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {searched ? (
                  pageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center py-4">
                        No records found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    pageRows.map((r) => (
                      <CTableRow key={r.id}>
                        <CTableDataCell className="text-center">
                          <CFormCheck
                            type="radio"
                            name="attRow"
                            checked={selectedId === r.id}
                            onChange={() => setSelectedId(r.id)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>{r.monthYear}</CTableDataCell>
                        <CTableDataCell>{r.examName}</CTableDataCell>
                        <CTableDataCell>{r.examDate}</CTableDataCell>
                        <CTableDataCell>{r.maxMarks}</CTableDataCell>
                      </CTableRow>
                    ))
                  )
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan={5} className="text-center py-4">
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

        {/* ================= DETAILS SECTION (Below Status Table) ================= */}
        {showDetails && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>OBE Attainment Report Details</strong>
              <ArpButton label="Close" icon="cancel" color="secondary" type="button" onClick={closeDetails} title="Close" />
            </CCardHeader>

            <CCardBody>
              {/* Meta table */}
              <CTable bordered responsive align="middle" className="mb-3">
                <CTableBody>
                  <CTableRow>
                    <CTableHeaderCell>AC Year</CTableHeaderCell>
                    <CTableDataCell>{demoMeta.acYear}</CTableDataCell>
                    <CTableHeaderCell>Sem</CTableHeaderCell>
                    <CTableDataCell>{demoMeta.sem}</CTableDataCell>
                    <CTableHeaderCell>Programme</CTableHeaderCell>
                    <CTableDataCell>{demoMeta.programme}</CTableDataCell>
                  </CTableRow>
                  <CTableRow>
                    <CTableHeaderCell>Month &amp; Year</CTableHeaderCell>
                    <CTableDataCell>{activeReport?.monthYear || demoMeta.monthYear}</CTableDataCell>
                    <CTableHeaderCell>Conduction Mode</CTableHeaderCell>
                    <CTableDataCell>{demoMeta.conductionMode}</CTableDataCell>
                    <CTableHeaderCell>Date &amp; Session</CTableHeaderCell>
                    <CTableDataCell>{demoMeta.dateSession}</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>

              {/* Attainment table */}
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Course Outcomes</CTableHeaderCell>
                    <CTableHeaderCell>Max. Marks in QP</CTableHeaderCell>
                    <CTableHeaderCell>No. of Students Scored</CTableHeaderCell>
                    <CTableHeaderCell>Obtained Percentage</CTableHeaderCell>
                    <CTableHeaderCell>Attainment Level</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {demoAttainmentRows.map((r) => (
                    <CTableRow key={r.co}>
                      <CTableDataCell>{r.co}</CTableDataCell>
                      <CTableDataCell>{r.max}</CTableDataCell>
                      <CTableDataCell>{r.students}</CTableDataCell>
                      <CTableDataCell>{r.obtainedPct}%</CTableDataCell>
                      <CTableDataCell>{r.level}</CTableDataCell>
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

export default ObeAttainment
