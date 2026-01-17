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
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import Chart from 'chart.js/auto'

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
  '21MCALT1': 'Advanced Java',
  '21MBALT2': 'Business Analytics',
}

const ResultAnalysis = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const [acad, setAcad] = useState(initialAcademic)
  const [search, setSearch] = useState('')
  const [reportType, setReportType] = useState('Consolidated Report')

  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  const rows = useMemo(
    () => [
      {
        key: '21MCALT1',
        courseCode: '21MCALT1',
        courseName: 'Advanced Java',
        qpCode: 'QP123',
        dateSession: '12-Apr-2025, FN',
        passPct: 85,
      },
      {
        key: '21MBALT2',
        courseCode: '21MBALT2',
        courseName: 'Business Analytics',
        qpCode: 'QP456',
        dateSession: '13-Apr-2025, AN',
        passPct: 92,
      },
    ],
    [],
  )

  const normalize = (v) => String(v ?? '').toLowerCase().trim()

  const filteredRows = useMemo(() => {
    const q = normalize(search)
    if (!q) return rows
    return rows.filter((r) =>
      [r.courseCode, r.courseName, r.qpCode, r.dateSession].map(normalize).join(' ').includes(q),
    )
  }, [rows, search])

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

  const onAddNew = () => {
    setIsEdit(true)
    setShowResult(false)
  }

  const onView = () => {
    setShowResult(true)
  }

  const onSearch = () => {
    setShowResult(true)
  }

  const onCancel = () => {
    setAcad(initialAcademic)
    setIsEdit(false)
    setShowResult(false)
    destroyChart()
  }

  const destroyChart = () => {
    if (chartInstance.current) {
      chartInstance.current.destroy()
      chartInstance.current = null
    }
  }

  const generateChart = () => {
    destroyChart()
    const ctx = chartRef.current
    if (!ctx) return

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.courseName),
        datasets: [
          {
            label: 'Pass Percentage',
            data: rows.map((r) => r.passPct),
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 100 },
        },
      },
    })
  }

  useEffect(() => {
    return () => destroyChart()
  }, [])

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>RESULT ANALYSIS</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="primary" onClick={onAddNew} />
              <ArpButton label="View" icon="view" color="secondary" onClick={onView} />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Academic Selection Form</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={(e) => e.preventDefault()}>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.academicYear} onChange={onAcadChange('academicYear')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="2025 – 26">2025 – 26</option>
                    <option value="2026 – 27">2026 – 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect
                    multiple
                    value={acad.semester}
                    onChange={onAcadChange('semester')}
                    disabled={!isEdit}
                  >
                    <option value="Sem – 1">Sem – 1</option>
                    <option value="Sem – 3">Sem – 3</option>
                    <option value="Sem – 5">Sem – 5</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Month &amp; Year of Examination</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput type="month" value={acad.examMonthYear} onChange={onAcadChange('examMonthYear')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}><CFormLabel>Name of the Examination</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.examName} onChange={onAcadChange('examName')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="CIA Test – 1">CIA Test – 1</option>
                    <option value="CIA Test – 2">CIA Test – 2</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.programme} onChange={onAcadChange('programme')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={acad.programmeCode} disabled /></CCol>

                <CCol md={3}><CFormLabel>Course Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.courseCode} onChange={onAcadChange('courseCode')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="21MCALT1">21MCALT1</option>
                    <option value="21MBALT2">21MBALT2</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Course Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={acad.courseName} disabled /></CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Search" icon="view" color="primary" type="button" onClick={onSearch} disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= RESULT ANALYSIS ================= */}
        {showResult && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Result Analysis</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                <CFormInput
                  size="sm"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 220, flex: '0 0 auto' }}
                />

                <CFormSelect
                  size="sm"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  style={{ width: 220, flex: '0 0 auto' }}
                >
                  <option>Consolidated Report</option>
                  <option>Report Category – 1</option>
                  <option>Report Category – 2</option>
                </CFormSelect>

                <ArpIconButton icon="chart" color="primary" title="Generate Chart" onClick={generateChart} />
                <ArpIconButton icon="download" color="success" title="Download" />
                <ArpIconButton icon="print" color="danger" title="Print" />
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive bordered>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    <CTableHeaderCell>QP Code</CTableHeaderCell>
                    <CTableHeaderCell>Date &amp; Session</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredRows.map((r) => (
                    <CTableRow key={r.key}>
                      <CTableDataCell><input type="checkbox" /></CTableDataCell>
                      <CTableDataCell>{r.courseCode}</CTableDataCell>
                      <CTableDataCell>{r.courseName}</CTableDataCell>
                      <CTableDataCell>{r.qpCode}</CTableDataCell>
                      <CTableDataCell>{r.dateSession}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <canvas ref={chartRef} className="mt-4" style={{ maxWidth: '100%' }} />
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default ResultAnalysis