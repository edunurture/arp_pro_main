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

/**
 * Local fallback circle icon button (Department.js style):
 * - white icon in colored circular button
 * - tooltip included
 * NOTE: If your project has a common IconCircleButton that works, you can replace this.
 */
const CircleIconButton = ({ title, color = 'primary', icon, onClick }) => (
  <CTooltip content={title} placement="top">
    <CButton
      type="button"
      color={color}
      className="rounded-circle d-inline-flex align-items-center justify-content-center"
      style={{ width: 36, height: 36, padding: 0 }}
      onClick={onClick}
    >
      <CIcon icon={icon} />
    </CButton>
  </CTooltip>
)

const CompanyDetails = () => {
  // Header actions
  const [academicYearEnabled, setAcademicYearEnabled] = useState(false)

  // Card visibility states (HTML parity)
  const [showAddCompanyCard, setShowAddCompanyCard] = useState(false)
  const [showCompanyTableCard, setShowCompanyTableCard] = useState(false)

  // Filters
  const [academicYear, setAcademicYear] = useState('')

  // Add Company Form
  const [companyName, setCompanyName] = useState('')
  const [location, setLocation] = useState('')
  const [companyType, setCompanyType] = useState('')
  const [hrName, setHrName] = useState('')
  const [email, setEmail] = useState('')
  const [contactNo, setContactNo] = useState('')

  // Mock table data (ready for API integration)
  const tableRows = useMemo(
    () => [
      {
        id: 1,
        companyName: 'XXX - XXX',
        location: 'XXX - XXX',
        companyType: 'XXX - XXX',
        hrName: 'XXX - XXX',
        email: 'XXX - XXX',
        contactNo: 'XXX - XXX',
      },
      {
        id: 2,
        companyName: 'XXX - XXX',
        location: 'XXX - XXX',
        companyType: 'XXX - XXX',
        hrName: 'XXX - XXX',
        email: 'XXX - XXX',
        contactNo: 'XXX - XXX',
      },
    ],
    [],
  )

  const onAddNew = useCallback(() => {
    // HTML: enableAcademicYear()
    setAcademicYearEnabled(true)
  }, [])

  const onHeaderView = useCallback(() => {
    // Placeholder: wire actual view behavior
    // eslint-disable-next-line no-console
    console.log('View clicked')
  }, [])

  const onHeaderDownloadTemplate = useCallback(() => {
    // Placeholder: wire actual template download
    // eslint-disable-next-line no-console
    console.log('Download Template clicked')
  }, [])

  const onSearch = useCallback(() => {
    // HTML: showAddCompanyCard()
    setShowAddCompanyCard(true)
  }, [])

  const onReset = useCallback(() => {
    setAcademicYear('')
  }, [])

  const onCancel = useCallback(() => {
    // Cancels/hides downstream cards
    setAcademicYear('')
    setAcademicYearEnabled(false)
    setShowAddCompanyCard(false)
    setShowCompanyTableCard(false)

    // Reset add company fields
    setCompanyName('')
    setLocation('')
    setCompanyType('')
    setHrName('')
    setEmail('')
    setContactNo('')
  }, [])

  const onAddCompanySave = useCallback(() => {
    // HTML: showCompanyDetailsCard()
    setShowCompanyTableCard(true)
  }, [])

  const onAddCompanyCancel = useCallback(() => {
    setShowAddCompanyCard(false)
  }, [])

  // Toolbar (circle icons) actions – placeholders
  const onEdit = useCallback(() => console.log('Edit'), [])
  const onDelete = useCallback(() => console.log('Delete'), [])
  const onUpload = useCallback(() => console.log('Upload'), [])
  const onDownload = useCallback(() => console.log('Download'), [])
  const onPrint = useCallback(() => console.log('Print'), [])

  return (
    <CardShell
      title="Company Details"
      breadcrumb={[
        { label: 'Setup', path: '/setup' },
        { label: 'Company Details' },
      ]}
    >
      {/* Top header row buttons (same row, right aligned) */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Company Details</strong>
          <div className="d-flex gap-2">
            <CButton color="primary" size="sm" type="button" onClick={onAddNew}>
              Add New
            </CButton>
            <CButton color="secondary" size="sm" type="button" onClick={onHeaderView}>
              View
            </CButton>
            <CButton color="success" size="sm" type="button" onClick={onHeaderDownloadTemplate}>
              Download Template
            </CButton>
          </div>
        </CCardHeader>
      </CCard>

      {/* CARD 1: Placements - Company Database */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Placements - Company Database</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3 align-items-end">
              <CCol md={2}>
                <CFormLabel>Academic Year</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  id="academicYear"
                  disabled={!academicYearEnabled}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                >
                  <option value="">Select Academic Year</option>
                  <option value="2025-26">2025 – 26</option>
                  <option value="2026-27">2026 – 27</option>
                </CFormSelect>
              </CCol>

              <CCol md={2} />

              <CCol md={4} className="d-flex justify-content-end gap-2">
                <CButton color="success" size="sm" type="button" onClick={onSearch}>
                  Search
                </CButton>
                <CButton color="primary" size="sm" type="button" onClick={onReset}>
                  Reset
                </CButton>
                <CButton color="danger" size="sm" type="button" onClick={onCancel}>
                  Cancel
                </CButton>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* CARD 2: Add Company Details (hidden until Search) */}
      {showAddCompanyCard && (
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Add Company Details</strong>

            {/* Toolbar icons (colored circles) */}
            <div className="d-flex gap-2">
              <CircleIconButton title="Edit" color="primary" icon={cilPencil} onClick={onEdit} />
              <CircleIconButton title="Delete" color="danger" icon={cilTrash} onClick={onDelete} />
              <CircleIconButton title="Upload" color="success" icon={cilCloudUpload} onClick={onUpload} />
              <CircleIconButton title="Download" color="info" icon={cilCloudDownload} onClick={onDownload} />
              <CircleIconButton title="Print" color="warning" icon={cilPrint} onClick={onPrint} />
            </div>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={2}>
                  <CFormLabel>Company Name</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Location</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput value={location} onChange={(e) => setLocation(e.target.value)} />
                </CCol>

                {/* Row 2 */}
                <CCol md={2}>
                  <CFormLabel>Type of the Company</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput value={companyType} onChange={(e) => setCompanyType(e.target.value)} />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>HR/Contact Person Name</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput value={hrName} onChange={(e) => setHrName(e.target.value)} />
                </CCol>

                {/* Row 3 */}
                <CCol md={2}>
                  <CFormLabel>Email Id</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Contact Number</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput value={contactNo} onChange={(e) => setContactNo(e.target.value)} />
                </CCol>
              </CRow>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <CButton color="success" size="sm" type="button" onClick={onAddCompanySave}>
                  Save
                </CButton>
                <CButton color="secondary" size="sm" type="button" onClick={onAddCompanyCancel}>
                  Cancel
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      )}

      {/* CARD 3: Company Details Table (hidden until Save) */}
      {showCompanyTableCard && (
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Company Details</strong>
            {/* Optional quick action icon (safe alternative to 'eye') */}
            <CTooltip content="View" placement="top">
              <CButton color="link" className="p-0" type="button" onClick={onHeaderView}>
                <CIcon icon={cilMagnifyingGlass} />
              </CButton>
            </CTooltip>
          </CCardHeader>
          <CCardBody>
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Location</th>
                    <th>Type of the Company</th>
                    <th>HR/Contact Person Name</th>
                    <th>Email Id.</th>
                    <th>Contact Number</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.companyName}</td>
                      <td>{r.location}</td>
                      <td>{r.companyType}</td>
                      <td>{r.hrName}</td>
                      <td>{r.email}</td>
                      <td>{r.contactNo}</td>
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

export default CompanyDetails
