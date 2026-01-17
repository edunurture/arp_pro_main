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
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CFormCheck,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react-pro'

import { ArpButton } from '../../components/common'

/**
 * OBE Attainment – Overall Report (React + CoreUI) — Option A
 * - Academic Selection with exam multi-select (Select All + individual)
 * - "Attainment Report" shows CO-wise matrix table BELOW selection card
 * - "Download Report" downloads the SAME matrix (client-side CSV)
 * - "Close" hides the report table
 *
 * NOTE: Demo data; wire API later.
 */

const initialSelection = {
  academicYear: '',
  semester: '',
  programmeCode: '',
  programmeName: '',
  courseCode: '',
  courseName: '',
}

const CO_HEADERS = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5']

const DEMO_EXAMS = [
  'CIA Test – 1',
  'CIA Test – 2',
]

const makeDemoMatrix = (examNames) => {
  // demo: empty values; keep string so it can be displayed & exported
  const matrix = {}
  examNames.forEach((ex) => {
    matrix[ex] = {}
    CO_HEADERS.forEach((co) => (matrix[ex][co] = ''))
  })
  return matrix
}

const toCsv = (headers, rows) => {
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`
  const out = []
  out.push(headers.map(esc).join(','))
  rows.forEach((r) => out.push(r.map(esc).join(',')))
  return out.join('\n')
}

const downloadText = (filename, content, mime = 'text/csv;charset=utf-8') => {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const ObeAttainmentOverallReport = () => {
  // ===== selection =====
  const [selection, setSelection] = useState(initialSelection)

  // ===== exam multi-select =====
  const [examOpen, setExamOpen] = useState(false)
  const [selectedExams, setSelectedExams] = useState(() => [...DEMO_EXAMS])

  // ===== report state =====
  const [showReport, setShowReport] = useState(false)
  const [matrix, setMatrix] = useState(() => makeDemoMatrix(DEMO_EXAMS))

  // ===== dropdowns =====
  const years = useMemo(() => ['2025 – 26', '2026 – 27'], [])
  const semesters = useMemo(() => ['Sem – 1', 'Sem – 3', 'Sem – 5'], [])
  const programmeCodes = useMemo(() => ['N6MCA', 'N6MBA'], [])
  const courseCodes = useMemo(() => ["'23-2AA-11T", '23-2AA-12E'], [])

  const onSelectionChange = (key) => (e) => {
    const val = e.target.value
    setSelection((p) => {
      const next = { ...p, [key]: val }
      if (key === 'programmeCode') {
        next.programmeName = val === 'N6MCA' ? 'MCA' : val === 'N6MBA' ? 'MBA' : ''
      }
      if (key === 'courseCode') {
        next.courseName = val ? 'Selected Course' : ''
      }
      return next
    })
  }

  const resetSelection = () => {
    setSelection(initialSelection)
    setSelectedExams([...DEMO_EXAMS])
    setShowReport(false)
    setMatrix(makeDemoMatrix(DEMO_EXAMS))
  }

  const isAllSelected = selectedExams.length === DEMO_EXAMS.length

  const toggleSelectAll = () => {
    setSelectedExams((prev) => (prev.length === DEMO_EXAMS.length ? [] : [...DEMO_EXAMS]))
  }

  const toggleExam = (exam) => () => {
    setSelectedExams((prev) => (prev.includes(exam) ? prev.filter((x) => x !== exam) : [...prev, exam]))
  }

  // Keep matrix in sync if user changes exam selection (only when report is shown or on demand)
  useEffect(() => {
    setMatrix((prev) => {
      const next = { ...prev }
      // add missing exams
      selectedExams.forEach((ex) => {
        if (!next[ex]) {
          next[ex] = {}
          CO_HEADERS.forEach((co) => (next[ex][co] = ''))
        }
      })
      // remove unselected exams
      Object.keys(next).forEach((ex) => {
        if (!selectedExams.includes(ex)) delete next[ex]
      })
      return next
    })
  }, [selectedExams])

  const openReport = (e) => {
    e.preventDefault()
    setShowReport(true)
  }

  const closeReport = () => setShowReport(false)

  const downloadReport = (e) => {
    e.preventDefault()
    const headers = ['Name of the Examination', ...CO_HEADERS]
    const rows = (selectedExams.length ? selectedExams : DEMO_EXAMS).map((ex) => [
      ex,
      ...CO_HEADERS.map((co) => matrix?.[ex]?.[co] ?? ''),
    ])
    const csv = toCsv(headers, rows)
    downloadText('obe_attainment_overall_report.csv', csv)
  }

  const examButtonText = selectedExams.length
    ? `${selectedExams.length} selected`
    : 'Select Examination(s)'

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>OBE ATTAINMENT – OVERALL REPORT</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Attainment Report" icon="view" color="info" type="button" onClick={openReport} title="Attainment Report" />
              <ArpButton label="Download Report" icon="download" color="success" type="button" onClick={downloadReport} title="Download Report" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= ACADEMIC SELECTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Academic Selection</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={openReport}>
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

                {/* Row 4: Exam multi-select */}
                <CCol md={3}>
                  <CFormLabel>Name of the Examination</CFormLabel>
                </CCol>
                <CCol md={9}>
                  <CDropdown visible={examOpen} onHide={() => setExamOpen(false)}>
                    <CDropdownToggle
                      color="light"
                      className="w-100 text-start"
                      onClick={() => setExamOpen((p) => !p)}
                    >
                      {examButtonText}
                    </CDropdownToggle>

                    <CDropdownMenu className="w-100 p-2" style={{ maxHeight: 260, overflow: 'auto' }}>
                      <CDropdownItem className="px-2">
                        <CFormCheck
                          id="selectAllExams"
                          label="Select All"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                        />
                      </CDropdownItem>
                      <div className="dropdown-divider" />
                      {DEMO_EXAMS.map((ex) => (
                        <CDropdownItem key={ex} className="px-2">
                          <CFormCheck
                            id={`ex-${ex}`}
                            label={ex}
                            checked={selectedExams.includes(ex)}
                            onChange={toggleExam(ex)}
                          />
                        </CDropdownItem>
                      ))}
                    </CDropdownMenu>
                  </CDropdown>
                </CCol>

                {/* Final row: Action buttons aligned right */}
                <CCol md={6} />
                <CCol md={6} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Attainment Report" icon="view" color="info" type="submit" title="Attainment Report" />
                  <ArpButton label="Download Report" icon="download" color="success" type="button" onClick={downloadReport} title="Download Report" />
                  <ArpButton label="Reset" icon="reset" color="warning" type="button" onClick={resetSelection} title="Reset" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= REPORT TABLE (Below Selection) ================= */}
        {showReport && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>OBE Attainment – Overall Report</strong>
              <ArpButton label="Close" icon="cancel" color="secondary" type="button" onClick={closeReport} title="Close" />
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ minWidth: 220 }}>Name of the Examination</CTableHeaderCell>
                    {CO_HEADERS.map((co) => (
                      <CTableHeaderCell key={co} style={{ width: 110 }}>
                        {co}
                      </CTableHeaderCell>
                    ))}
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {(selectedExams.length ? selectedExams : DEMO_EXAMS).map((ex) => (
                    <CTableRow key={ex}>
                      <CTableDataCell>{ex}</CTableDataCell>
                      {CO_HEADERS.map((co) => (
                        <CTableDataCell key={co}>{matrix?.[ex]?.[co] ?? ''}</CTableDataCell>
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

export default ObeAttainmentOverallReport
