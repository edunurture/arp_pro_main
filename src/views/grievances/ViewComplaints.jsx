import React, { useCallback, useMemo, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormSelect,
  CButton,
  CTooltip,
} from '@coreui/react-pro'
import { CIcon } from '@coreui/icons-react'
// IMPORTANT: Do NOT use cilEye (not exported in your installed @coreui/icons build)
import { cilCloudDownload, cilCloudUpload, cilMagnifyingGlass } from '@coreui/icons'

import CardShell from '../../components/common/CardShell'
import ArpActionToolbar from '../../components/common/ArpActionToolbar'
import ArpPagination from '../../components/common/ArpPagination'

/**
 * Local fallback circle icon button:
 * - Uses CoreUI primitives only
 * - Avoids relying on a barrel export (you had export errors)
 */
const CircleIconButton = ({ title, color = 'primary', icon, onClick }) => (
  <CTooltip content={title} placement="top">
    <CButton
      type="button"
      color={color}
      className="rounded-circle d-inline-flex align-items-center justify-content-center"
      style={{ width: 35, height: 35, padding: 0 }}
      onClick={onClick}
    >
      <CIcon icon={icon} />
    </CButton>
  </CTooltip>
)

const ViewComplaints = () => {
  const [academicYear, setAcademicYear] = useState('')
  const [category, setCategory] = useState('')
  const [showDetails, setShowDetails] = useState(false)

  const rows = useMemo(
    () => [
      {
        id: 1,
        regNo: '1001',
        name: 'John Doe',
        date: '2025-01-15',
        fileLog: 'Log A',
        atrStatus: 'ATR Pending',
      },
      {
        id: 2,
        regNo: '1002',
        name: 'Jane Smith',
        date: '2025-01-20',
        fileLog: 'Log B',
        atrStatus: 'ATR Uploaded',
      },
    ],
    [],
  )

  const handleSearch = useCallback(() => {
    setShowDetails(true)
  }, [])

  const handleReset = useCallback(() => {
    setAcademicYear('')
    setCategory('')
    setShowDetails(false)
  }, [])

  const onViewComplaint = useCallback((row) => {
    // TODO: hook API / file open
    // eslint-disable-next-line no-console
    console.log('View complaint:', row)
  }, [])

  const onUploadATR = useCallback((row) => {
    // TODO: open upload modal / file picker flow
    // eslint-disable-next-line no-console
    console.log('Upload ATR:', row)
  }, [])

  const onViewATR = useCallback((row) => {
    // TODO: open ATR viewer
    // eslint-disable-next-line no-console
    console.log('View ATR:', row)
  }, [])

  const onDownloadATR = useCallback((row) => {
    // TODO: download ATR
    // eslint-disable-next-line no-console
    console.log('Download ATR:', row)
  }, [])

  return (
    <CardShell
      title="View Complaints"
      breadcrumb={[
        { label: 'Setup', path: '/setup' },
        { label: 'View Complaints' },
      ]}
    >
      {/* Card: Academic Selection Form */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Academic Selection Form</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3 align-items-end">
              <CCol md={3}>
                <CFormLabel>Academic Year</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
                  <option value="">Select</option>
                  <option value="2026-27">2026 – 27</option>
                  <option value="2025-26">2025 – 26</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Choose Category</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select</option>
                  <option value="Anti-Ragging">Anti – Ragging</option>
                  <option value="Sexual Harassment">Sexual Harassment</option>
                  <option value="Examination Grievances">Examination Grievances</option>
                  <option value="Other Grievances">Other Grievances</option>
                </CFormSelect>
              </CCol>

              <CCol md={12} className="d-flex justify-content-end">
                <ArpActionToolbar onSearch={handleSearch} onReset={handleReset} hideAddNew />
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* Card: Details */}
      {showDetails && (
        <CCard className="mt-3">
          <CCardHeader>
            <strong>DETAILS OF GRIEVANCES AND ACTION TAKEN REPORTS</strong>
          </CCardHeader>
          <CCardBody>
            <div className="table-responsive">
              <table className="table table-striped table-bordered">
                <thead>
                  <tr>
                    <th>Reg. No.</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th className="text-center">View Complaints</th>
                    <th className="text-center">Upload ATR</th>
                    <th>File Log</th>
                    <th>ATR Status</th>
                    <th className="text-center">ATR - Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.regNo}</td>
                      <td>{r.name}</td>
                      <td>{r.date}</td>
                      <td className="text-center">
                        <CTooltip content="Download Complaint" placement="top">
                          <CButton
                            type="button"
                            color="link"
                            className="p-0"
                            onClick={() => onViewComplaint(r)}
                          >
                            <CIcon icon={cilCloudDownload} />
                          </CButton>
                        </CTooltip>
                      </td>
                      <td className="text-center">
                        <CTooltip content="Upload ATR" placement="top">
                          <CButton
                            type="button"
                            color="link"
                            className="p-0"
                            onClick={() => onUploadATR(r)}
                          >
                            <CIcon icon={cilCloudUpload} />
                          </CButton>
                        </CTooltip>
                      </td>
                      <td>{r.fileLog}</td>
                      <td>{r.atrStatus}</td>
                      <td className="text-center">
                        <div className="d-inline-flex gap-2">
                          {/* View icon: use cilMagnifyingGlass instead of cilEye */}
                          <CircleIconButton
                            title="View ATR"
                            color="success"
                            icon={cilMagnifyingGlass}
                            onClick={() => onViewATR(r)}
                          />
                          <CircleIconButton
                            title="Download ATR"
                            color="primary"
                            icon={cilCloudDownload}
                            onClick={() => onDownloadATR(r)}
                          />
                        </div>
                      </td>
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

export default ViewComplaints
