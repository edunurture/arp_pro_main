import React, { useState, useCallback } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormSelect,
  CFormLabel,
  CButton,
} from '@coreui/react-pro'
import CardShell from '../../components/common/CardShell'
import ArpActionToolbar from '../../components/common/ArpActionToolbar'
import ArpPagination from '../../components/common/ArpPagination'
import { cilCloudDownload } from '@coreui/icons'
import { CIcon } from '@coreui/icons-react'

const mockStudents = [
  { id: 1, regNo: '1001', name: 'John Doe', contact: '9876543210', status: 'Affidavit Pending' },
  { id: 2, regNo: '1002', name: 'Jane Smith', contact: '8765432109', status: 'Affidavit Uploaded' },
  { id: 3, regNo: '1003', name: 'Ali Khan', contact: '7654321098', status: 'Affidavit Pending' },
  { id: 4, regNo: '1004', name: 'Maria Lee', contact: '6543210987', status: 'Affidavit Uploaded' },
]

const ViewAffidavits = () => {
  const [academicYear, setAcademicYear] = useState('')
  const [programme, setProgramme] = useState('')
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [showTable, setShowTable] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const handleSearch = useCallback(() => {
    setShowTable(true)
  }, [])

  const handleReset = useCallback(() => {
    setAcademicYear('')
    setProgramme('')
    setClassName('')
    setSection('')
    setSelectedStudent(null)
    setShowTable(false)
  }, [])

  return (
    <CardShell
      title="View Affidavits"
      breadcrumb={[
        { label: 'Setup', path: '/setup' },
        { label: 'View Affidavits' },
      ]}
    >
      {/* Card 1: Academic Selection Form */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Academic Selection Form</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="mb-3 align-items-center">
              <CCol md={2} className="mb-2">
                <CFormLabel className="mb-0">Academic Year</CFormLabel>
              </CCol>
              <CCol md={4} className="mb-2">
                <CFormSelect value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                  <option value="">Select</option>
                  <option value="2025-26">2025 – 26</option>
                  <option value="2026-27">2026 – 27</option>
                </CFormSelect>
              </CCol>

              <CCol md={2} className="mb-2">
                <CFormLabel className="mb-0">Choose Programme</CFormLabel>
              </CCol>
              <CCol md={4} className="mb-2">
                <CFormSelect value={programme} onChange={(e) => setProgramme(e.target.value)}>
                  <option value="">Select</option>
                  <option value="MBA">MBA</option>
                  <option value="MCA">MCA</option>
                </CFormSelect>
              </CCol>
            </CRow>

            <CRow className="mb-3 align-items-center">
              <CCol md={2} className="mb-2">
                <CFormLabel className="mb-0">Choose Class Name</CFormLabel>
              </CCol>
              <CCol md={4} className="mb-2">
                <CFormSelect value={className} onChange={(e) => setClassName(e.target.value)}>
                  <option value="">Select</option>
                  <option value="I-MCA">I – MCA</option>
                  <option value="I-MBA">I – MBA</option>
                </CFormSelect>
              </CCol>

              <CCol md={2} className="mb-2">
                <CFormLabel className="mb-0">Section</CFormLabel>
              </CCol>
              <CCol md={4} className="mb-2">
                <CFormSelect value={section} onChange={(e) => setSection(e.target.value)}>
                  <option value="">Select</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </CFormSelect>
              </CCol>
            </CRow>

            {/* Uses your standard Search/Reset toolbar */}
            <ArpActionToolbar onSearch={handleSearch} onReset={handleReset} hideAddNew />
          </CForm>
        </CCardBody>
      </CCard>

      {/* Card 2: Affidavit Table */}
      {showTable && (
        <CCard className="mt-3">
          <CCardHeader>
            <strong>Details of Student / Parent Anti–Ragging Affidavit</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="mb-2">
              <CCol className="d-flex justify-content-end gap-2">
                <CButton size="sm" color="primary" type="button">
                  <CIcon icon={cilCloudDownload} className="me-1" />
                  Student Affidavit
                </CButton>
                <CButton size="sm" color="success" type="button">
                  <CIcon icon={cilCloudDownload} className="me-1" />
                  Parent Affidavit
                </CButton>
              </CCol>
            </CRow>

            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Select</th>
                    <th>Reg. No.</th>
                    <th>Name</th>
                    <th>Contact Number</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockStudents.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <input
                          type="radio"
                          name="selectedStudent"
                          checked={selectedStudent === s.id}
                          onChange={() => setSelectedStudent(s.id)}
                        />
                      </td>
                      <td>{s.regNo}</td>
                      <td>{s.name}</td>
                      <td>{s.contact}</td>
                      <td>{s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ArpPagination />
          </CCardBody>
        </CCard>
      )}
    </CardShell>
  )
}

export default ViewAffidavits
