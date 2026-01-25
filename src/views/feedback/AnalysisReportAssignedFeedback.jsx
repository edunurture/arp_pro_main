import React, { useEffect, useRef, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormSelect,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
} from '@coreui/react-pro'
import { CardShell, ArpButton, ArpIconButton } from '../../components/common'
import { cilPrint, cilCloudDownload } from '@coreui/icons'
import { CIcon } from '@coreui/icons-react'
import Chart from 'chart.js/auto'

const dummy = {
  academicYear: ['2025 - 26', '2026 - 27'],
  academicPattern: ['Choice Based Credit System', 'Non-CBCS'],
}

const rows = [
  {
    id: 1,
    feedbackId: 'FB101',
    feedbackTitle: 'Programming Fundamentals',
    feedbackFrom: 'Student',
    dateFrom: '01-01-2025',
    dateTo: '10-01-2025',
    status: 'Pending',
  },
  {
    id: 2,
    feedbackId: 'FB102',
    feedbackTitle: 'Database Management Systems',
    feedbackFrom: 'Student',
    dateFrom: '05-02-2025',
    dateTo: '15-02-2025',
    status: 'Completed',
  },
  {
    id: 3,
    feedbackId: 'FB103',
    feedbackTitle: 'Data Structures',
    feedbackFrom: 'Student',
    dateFrom: '20-03-2025',
    dateTo: '30-03-2025',
    status: 'Pending',
  },
]

const AnalysisReportAssignedFeedback = () => {
  const [config, setConfig] = useState({ academicYear: '', academicPattern: '' })
  const [showList, setShowList] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const pieRef = useRef(null)
  const barRef = useRef(null)

  const onConfigChange = (k) => (e) => setConfig((p) => ({ ...p, [k]: e.target.value }))

  const onSearch = () => {
    setShowList(true)
    setShowReport(false)
  }

  const onViewReport = () => {
    setShowReport(true)
  }

  useEffect(() => {
    if (showReport) {
      if (pieRef.current) {
        new Chart(pieRef.current, {
          type: 'pie',
          data: {
            labels: ['1st Qtr', '2nd Qtr', '3rd Qtr', '4th Qtr'],
            datasets: [
              {
                data: [60, 25, 8, 7],
                backgroundColor: ['#00b0f0', '#0070c0', '#00b0a0', '#00b050'],
                borderColor: '#f8fafc',
                borderWidth: 3,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
          },
        })
      }

      if (barRef.current) {
        new Chart(barRef.current, {
          type: 'bar',
          data: {
            labels: ['Category 1', 'Category 2', 'Category 3', 'Category 4'],
            datasets: [
              { label: 'Series 1', data: [4.2, 4.3, 3.4, 4.5], backgroundColor: '#00b0f0' },
              { label: 'Series 2', data: [2.3, 2.5, 1.7, 2.7], backgroundColor: '#0070c0' },
              { label: 'Series 3', data: [2.0, 2.0, 3.0, 5.0], backgroundColor: '#00b050' },
            ],
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true, max: 6, ticks: { stepSize: 1 } },
              x: { grid: { display: false } },
            },
            plugins: { legend: { display: false } },
          },
        })
      }
    }
  }, [showReport])

  return (
    <CardShell
      title="Analysis Report - Assigned Feedback"
      breadcrumb={['Setup', 'Assigned Feedback']}
    >
      {/* Configuration Selection */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Configuration Selection</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3 align-items-center">
              <CCol md={2}>
                <CFormLabel>Academic Year</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  value={config.academicYear}
                  onChange={onConfigChange('academicYear')}
                >
                  <option value="">Select</option>
                  {dummy.academicYear.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={2}>
                <CFormLabel>Academic Pattern</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  value={config.academicPattern}
                  onChange={onConfigChange('academicPattern')}
                >
                  <option value="">Select</option>
                  {dummy.academicPattern.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol xs={12} className="d-flex justify-content-end">
                <ArpButton label="Search" icon="search" color="primary" onClick={onSearch} />
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* List of Feedbacks */}
      {showList && (
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>List of Feedbacks</strong>
            <div className="d-flex gap-2">
              <ArpIconButton icon={cilPrint} color="primary" tooltip="Print" />
              <ArpIconButton icon={cilCloudDownload} color="success" tooltip="Download" />
            </div>
          </CCardHeader>
          <CCardBody>
            <CTable bordered hover responsive className="text-center">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Selection</CTableHeaderCell>
                  <CTableHeaderCell>Feedback ID</CTableHeaderCell>
                  <CTableHeaderCell>Feedback Title</CTableHeaderCell>
                  <CTableHeaderCell>Feedback From</CTableHeaderCell>
                  <CTableHeaderCell>Date From</CTableHeaderCell>
                  <CTableHeaderCell>Date To</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Analysis Report</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {rows.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell>
                      <input type="checkbox" />
                    </CTableDataCell>
                    <CTableDataCell>{r.feedbackId}</CTableDataCell>
                    <CTableDataCell>{r.feedbackTitle}</CTableDataCell>
                    <CTableDataCell>{r.feedbackFrom}</CTableDataCell>
                    <CTableDataCell>{r.dateFrom}</CTableDataCell>
                    <CTableDataCell>{r.dateTo}</CTableDataCell>
                    <CTableDataCell>{r.status}</CTableDataCell>
                    <CTableDataCell>
                      <CButton size="sm" color="info" onClick={onViewReport}>
                        View
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}

      {/* Feedback Analysis Report */}
      {showReport && (
        <CCard>
          <CCardHeader>
            <strong>Feedback Analysis Report</strong>
          </CCardHeader>
          <CCardBody>
            <CTable bordered hover responsive className="text-center mb-3">
              <CTableBody>
                <CTableRow>
                  <CTableHeaderCell colSpan={6} className="text-center bg-secondary text-white">
                    Report On (Feedback Title) | Total Number of Responses = 80 | Responses in
                    Percentage (%)
                  </CTableHeaderCell>
                </CTableRow>
                <CTableRow className="bg-secondary text-white">
                  <CTableHeaderCell>Q. No.</CTableHeaderCell>
                  <CTableHeaderCell>Scale-1</CTableHeaderCell>
                  <CTableHeaderCell>Scale-2</CTableHeaderCell>
                  <CTableHeaderCell>Scale-3</CTableHeaderCell>
                  <CTableHeaderCell>Scale-4</CTableHeaderCell>
                  <CTableHeaderCell>Scale-5</CTableHeaderCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell>Q1</CTableDataCell>
                  <CTableDataCell>10%</CTableDataCell>
                  <CTableDataCell>15%</CTableDataCell>
                  <CTableDataCell>25%</CTableDataCell>
                  <CTableDataCell>30%</CTableDataCell>
                  <CTableDataCell>20%</CTableDataCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell>Q2</CTableDataCell>
                  <CTableDataCell>12%</CTableDataCell>
                  <CTableDataCell>10%</CTableDataCell>
                  <CTableDataCell>30%</CTableDataCell>
                  <CTableDataCell>28%</CTableDataCell>
                  <CTableDataCell>20%</CTableDataCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell></CTableDataCell>
                  <CTableDataCell colSpan={5} className="text-center">
                    <strong>Overall Rating (%) - 79%</strong>
                  </CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>

            <CRow className="mt-4">
              <CCol md={5}>
                <div className="chart-wrapper-arp">
                  <h5 className="text-center">Report</h5>
                  <canvas ref={pieRef} />
                </div>
              </CCol>
              <CCol md={7}>
                <div className="chart-wrapper-arp">
                  <h5 className="text-center">Chart Title</h5>
                  <canvas ref={barRef} />
                </div>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      )}
    </CardShell>
  )
}

export default AnalysisReportAssignedFeedback
