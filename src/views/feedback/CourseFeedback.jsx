import React, { useState } from 'react'
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
import { CardShell, ArpButton } from '../../components/common'

// Dummy dropdowns from original HTML (replace with API later)
const dummy = {
  academicYear: ['2025 - 26', '2026 - 27'],
  academicPattern: ['Pattern A', 'Pattern B', 'Pattern B'],
  semester: ['Odd', 'Even', 'Summer'],
  programmeCode: ['MCA', 'BCA', 'BSc CS'],
  programme: [
    'Master of Computer Applications',
    'Bachelor of Computer Applications',
    'B.Sc. Computer Science',
  ],
  course: [
    'MCA101 - Programming Fundamentals',
    'MCA102 - Database Management Systems',
    'MCA103 - Data Structures',
  ],
}

const initialConfig = {
  academicYear: '',
  academicPattern: '',
  semester: '',
  programmeCode: '',
  programme: '',
  course: '',
}

const rows = [
  {
    courseCode: 'MCA101',
    courseName: 'Programming Fundamentals',
    feedbackId: 'FB101',
    feedbackTitle: '1st Internal Feedback',
    status: 'Pending',
  },
  {
    courseCode: 'MCA102',
    courseName: 'Database Management Systems',
    feedbackId: 'FB102',
    feedbackTitle: 'Mid-Sem Feedback',
    status: 'Pending',
  },
  {
    courseCode: 'MCA103',
    courseName: 'Data Structures',
    feedbackId: 'FB103',
    feedbackTitle: 'End-Sem Feedback',
    status: 'Pending',
  },
]

const CourseFeedback = () => {
  const [config, setConfig] = useState(initialConfig)
  const [showTable, setShowTable] = useState(false)
  const [selected, setSelected] = useState({})

  const onConfigChange = (k) => (e) =>
    setConfig((p) => ({ ...p, [k]: e.target.value }))

  const onSearch = () => {
    setShowTable(true)
  }

  const toggleRow = (code) => {
    setSelected((p) => ({ ...p, [code]: !p[code] }))
  }

  const onPublish = (row) => {
    console.log('Publish', row)
  }

  return (
    <CardShell title="Course Feedback" breadcrumb={['Setup', 'Course Feedback']}>
      {/* Configuration Selection Card */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Configuration Selection</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3 align-items-center">
              <CCol md={3}>
                <CFormLabel className="mb-0">Academic Year</CFormLabel>
              </CCol>
              <CCol md={3}>
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

              <CCol md={3}>
                <CFormLabel className="mb-0">Academic Pattern</CFormLabel>
              </CCol>
              <CCol md={3}>
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

              <CCol md={3}>
                <CFormLabel className="mb-0">Semester</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={config.semester}
                  onChange={onConfigChange('semester')}
                >
                  <option value="">Select</option>
                  {dummy.semester.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Programme Code</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={config.programmeCode}
                  onChange={onConfigChange('programmeCode')}
                >
                  <option value="">Select</option>
                  {dummy.programmeCode.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Programme</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={config.programme}
                  onChange={onConfigChange('programme')}
                >
                  <option value="">Select</option>
                  {dummy.programme.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Course Code & Name</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={config.course}
                  onChange={onConfigChange('course')}
                >
                  <option value="">Select</option>
                  {dummy.course.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol xs={12} className="d-flex justify-content-end mt-2">
                <ArpButton
                  label="Search"
                  icon="search"
                  color="primary"
                  onClick={onSearch}
                />
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* List of Courses Card */}
      {showTable && (
        <CCard>
          <CCardHeader>
            <strong>List of Courses</strong>
          </CCardHeader>
          <CCardBody>
            <CTable bordered hover responsive className="text-center align-middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Selection</CTableHeaderCell>
                  <CTableHeaderCell>Course Code</CTableHeaderCell>
                  <CTableHeaderCell>Course Name</CTableHeaderCell>
                  <CTableHeaderCell>Feedback ID</CTableHeaderCell>
                  <CTableHeaderCell>Feedback Title</CTableHeaderCell>
                  <CTableHeaderCell>Publish to Portal</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {rows.map((r) => (
                  <CTableRow key={r.courseCode}>
                    <CTableDataCell>
                      <input
                        type="checkbox"
                        checked={!!selected[r.courseCode]}
                        onChange={() => toggleRow(r.courseCode)}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{r.courseCode}</CTableDataCell>
                    <CTableDataCell>{r.courseName}</CTableDataCell>
                    <CTableDataCell>{r.feedbackId}</CTableDataCell>
                    <CTableDataCell>{r.feedbackTitle}</CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        size="sm"
                        color="success"
                        onClick={() => onPublish(r)}
                      >
                        Publish
                      </CButton>
                    </CTableDataCell>
                    <CTableDataCell>{r.status}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}
    </CardShell>
  )
}

export default CourseFeedback
