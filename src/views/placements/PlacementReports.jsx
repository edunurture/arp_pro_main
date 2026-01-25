import React, { useCallback, useMemo, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CTooltip,
  CFormText,
} from '@coreui/react-pro'
import { CIcon } from '@coreui/icons-react'
import {
  cilCloudDownload,
  cilCloudUpload,
  cilPencil,
  cilPrint,
  cilTrash,
  cilMagnifyingGlass,
} from '@coreui/icons'

import CardShell from '../../components/common/CardShell'

const CircleIconButton = ({ title, color = 'primary', icon, onClick }) => (
  <CTooltip content={title} placement="top">
    <CButton
      type="button"
      color={color}
      className="rounded-circle d-inline-flex align-items-center justify-content-center"
      style={{ width: 34, height: 34, padding: 0 }}
      onClick={onClick}
    >
      <CIcon icon={icon} />
    </CButton>
  </CTooltip>
)

const PlacementReports = () => {
  const [academicYear, setAcademicYear] = useState('')
  const [driveDate, setDriveDate] = useState('')
  const [driveTitle, setDriveTitle] = useState('')

  const [academicEnabled, setAcademicEnabled] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [showReports, setShowReports] = useState(false)

  const tableRows = useMemo(
    () => [
      {
        id: 1,
        programme: 'MBA',
        className: 'A',
        regNo: '10MBA01',
        name: 'John Doe',
        company: 'Company A',
        designation: 'Analyst',
        ctc: '5 LPA',
      },
      {
        id: 2,
        programme: 'MCA',
        className: 'B',
        regNo: '10MCA02',
        name: 'Jane Smith',
        company: 'Company B',
        designation: 'Developer',
        ctc: '6 LPA',
      },
      {
        id: 3,
        programme: 'MBA',
        className: 'A',
        regNo: '10MBA03',
        name: 'Rahul Kumar',
        company: 'Company C',
        designation: 'Manager',
        ctc: '7 LPA',
      },
      {
        id: 4,
        programme: 'MCA',
        className: 'B',
        regNo: '10MCA04',
        name: 'Priya Das',
        company: 'Company A',
        designation: 'Tester',
        ctc: '4.5 LPA',
      },
      {
        id: 5,
        programme: 'MBA',
        className: 'C',
        regNo: '10MBA05',
        name: 'Karan Mehta',
        company: 'Company D',
        designation: 'Consultant',
        ctc: '8 LPA',
      },
    ],
    [],
  )

  const enableAcademicSelection = useCallback(() => {
    setAcademicEnabled(true)
  }, [])

  const handleSearch = useCallback(() => {
    if (!academicYear || !driveDate || !driveTitle) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    setShowReports(true)
  }, [academicYear, driveDate, driveTitle])

  const handleAdd = useCallback(() => {
    handleSearch()
  }, [handleSearch])

  const handleCancelMain = useCallback(() => {
    setAcademicYear('')
    setDriveDate('')
    setDriveTitle('')
    setAcademicEnabled(false)
    setShowValidation(false)
    setShowReports(false)
  }, [])

  return (
    <CardShell
      title="Placement Reports"
      breadcrumb={[
        { label: 'Setup', path: '/setup' },
        { label: 'Placement – Reports' },
      ]}
    >
      {/* Header Buttons */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>PLACEMENTS – REPORTS</strong>
          <div className="d-flex gap-2">
            <CButton size="sm" color="primary" type="button" onClick={enableAcademicSelection}>
              Add New
            </CButton>
            <CButton size="sm" color="secondary" type="button">
              View
            </CButton>
            <CButton size="sm" color="success" type="button">
              Download Template
            </CButton>
          </div>
        </CCardHeader>
      </CCard>

      {/* Academic Selection Form */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Academic Selection Form</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel>Academic Year</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  disabled={!academicEnabled}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                >
                  <option value="">Select Academic Year</option>
                  <option value="2025-26">2025 – 26</option>
                  <option value="2026-27">2026 – 27</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Choose Drive Date</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  disabled={!academicEnabled}
                  value={driveDate}
                  onChange={(e) => setDriveDate(e.target.value)}
                >
                  <option value="">Select Date</option>
                  <option value="2025-02-10">10-02-2025</option>
                  <option value="2025-03-15">15-03-2025</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Choose Drive Title</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  disabled={!academicEnabled}
                  value={driveTitle}
                  onChange={(e) => setDriveTitle(e.target.value)}
                >
                  <option value="">Select Title</option>
                  <option value="Drive A">Drive A</option>
                  <option value="Drive B">Drive B</option>
                </CFormSelect>
              </CCol>

              <CCol md={3} />
              <CCol md={3} className="d-flex justify-content-end align-items-end gap-2">
                <CButton size="sm" color="primary" type="button" disabled={!academicEnabled} onClick={handleSearch}>
                  Search
                </CButton>
                <CButton size="sm" color="success" type="button" disabled={!academicEnabled} onClick={handleAdd}>
                  Add
                </CButton>
                <CButton size="sm" color="secondary" type="button" disabled={!academicEnabled} onClick={handleCancelMain}>
                  Cancel
                </CButton>
              </CCol>
            </CRow>

            {showValidation && (
              <CRow className="mt-2">
                <CCol>
                  <CFormText className="text-danger">
                    Please select Academic Year, Drive Date, and Drive Title.
                  </CFormText>
                </CCol>
              </CRow>
            )}
          </CForm>
        </CCardBody>
      </CCard>

      {/* Placement Reports Card */}
      {showReports && (
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>PLACEMENTS - REPORTS</strong>
            <div className="d-flex gap-2">
              <CircleIconButton title="Edit" color="primary" icon={cilPencil} onClick={() => {}} />
              <CircleIconButton title="Delete" color="danger" icon={cilTrash} onClick={() => {}} />
              <CircleIconButton title="Upload" color="secondary" icon={cilCloudUpload} onClick={() => {}} />
              <CircleIconButton title="Download" color="success" icon={cilCloudDownload} onClick={() => {}} />
              <CircleIconButton title="Print" color="dark" icon={cilPrint} onClick={() => {}} />
            </div>
          </CCardHeader>

          <CCardBody>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead style={{ backgroundColor: '#7f7f7f', color: '#ffffff' }}>
                  <tr>
                    <th>Select</th>
                    <th>Programme</th>
                    <th>Class</th>
                    <th>Register Number</th>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Designation</th>
                    <th>CTC</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => (
                    <tr key={r.id}>
                      <td className="text-center">
                        <input type="radio" name="placement_select" />
                      </td>
                      <td>{r.programme}</td>
                      <td>{r.className}</td>
                      <td>{r.regNo}</td>
                      <td>{r.name}</td>
                      <td>{r.company}</td>
                      <td>{r.designation}</td>
                      <td>{r.ctc}</td>
                      <td className="text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <CircleIconButton title="View" color="info" icon={cilMagnifyingGlass} onClick={() => {}} />
                          <CircleIconButton title="Download" color="success" icon={cilCloudDownload} onClick={() => {}} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CCardBody>
        </CCard>
      )}
    </CardShell>
  )
}

export default PlacementReports
