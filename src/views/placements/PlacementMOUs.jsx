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
      style={{ width: 36, height: 36, padding: 0 }}
      onClick={onClick}
    >
      <CIcon icon={icon} />
    </CButton>
  </CTooltip>
)

const PlacementMOUs = () => {
  const [academicYear, setAcademicYear] = useState('')
  const [showAddMou, setShowAddMou] = useState(false)
  const [showDocuments, setShowDocuments] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

  const [orgName, setOrgName] = useState('')
  const [address, setAddress] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactNo, setContactNo] = useState('')
  const [scope, setScope] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const [docRows, setDocRows] = useState([
    { id: 1, selected: true, category: '', file: null, fileLog: '' },
  ])

  const handleSearch = useCallback(() => {
    // HTML had no explicit search logic. In ARP flow, Search should reveal the working area after filters.
    if (!academicYear) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    setShowAddMou(true)
    setShowDocuments(true)
  }, [academicYear])

  const handleAdd = useCallback(() => {
    // HTML: showMouForm()
    if (!academicYear) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    setShowAddMou(true)
    setShowDocuments(true)
  }, [academicYear])

  const handleCancel = useCallback(() => {
    setAcademicYear('')
    setShowValidation(false)
    setShowAddMou(false)
    setShowDocuments(false)

    setOrgName('')
    setAddress('')
    setContactPerson('')
    setContactNo('')
    setScope('')
    setFromDate('')
    setToDate('')

    setDocRows([{ id: 1, selected: true, category: '', file: null, fileLog: '' }])
  }, [])

  const addDocRow = useCallback(() => {
    setDocRows((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((r) => r.id)) + 1 : 1
      return [...prev, { id: nextId, selected: false, category: '', file: null, fileLog: '' }]
    })
  }, [])

  const removeDocRow = useCallback((rowId) => {
    setDocRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== rowId) : prev))
  }, [])

  const setSelectedDocRow = useCallback((rowId) => {
    setDocRows((prev) => prev.map((r) => ({ ...r, selected: r.id === rowId })))
  }, [])

  const updateDocRow = useCallback((rowId, patch) => {
    setDocRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)))
  }, [])

  const onSaveDocuments = useCallback(() => {
    // TODO: API integration
    // eslint-disable-next-line no-console
    console.log('Save documents:', docRows)
  }, [docRows])

  const onCancelDocuments = useCallback(() => {
    // keep card open but reset rows (common ARP UX)
    setDocRows([{ id: 1, selected: true, category: '', file: null, fileLog: '' }])
  }, [])

  return (
    <CardShell
      title="Placement MOUs"
      breadcrumb={[
        { label: 'Setup', path: '/setup' },
        { label: 'Placement MOUs' },
      ]}
    >
      {/* Header Buttons */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Placement MOUs</strong>
          <div className="d-flex gap-2">
            <CButton size="sm" color="primary" type="button">
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
          <strong>ACADEMIC SELECTION FORM</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3 align-items-center">
              <CCol md={3}>
                <CFormLabel className="mb-0">Academic Year</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                >
                  <option value="">Select Academic Year</option>
                  <option value="2025-26">2025 – 26</option>
                  <option value="2026-27">2026 – 27</option>
                </CFormSelect>
                {showValidation && !academicYear && (
                  <CFormText className="text-danger">Please select Academic Year.</CFormText>
                )}
              </CCol>
              <CCol md={3} />
              <CCol md={3} className="d-flex gap-2">
                <CButton size="sm" color="primary" type="button" onClick={handleSearch}>
                  Search
                </CButton>
                <CButton size="sm" color="success" type="button" onClick={handleAdd}>
                  Add
                </CButton>
                <CButton size="sm" color="secondary" type="button" onClick={handleCancel}>
                  Cancel
                </CButton>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* Add MOUs */}
      {showAddMou && (
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>ADD MOUs</strong>
            <div className="d-flex gap-2">
              <CircleIconButton title="Edit" color="primary" icon={cilPencil} onClick={() => {}} />
              <CircleIconButton title="Delete" color="danger" icon={cilTrash} onClick={() => {}} />
              <CircleIconButton title="Upload" color="secondary" icon={cilCloudUpload} onClick={() => {}} />
              <CircleIconButton title="Download" color="success" icon={cilCloudDownload} onClick={() => {}} />
              <CircleIconButton title="Print" color="warning" icon={cilPrint} onClick={() => {}} />
            </div>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3 mb-3 align-items-center">
                <CCol md={3}><CFormLabel className="mb-0">Organization Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={orgName} onChange={(e) => setOrgName(e.target.value)} /></CCol>
                <CCol md={3}><CFormLabel className="mb-0">Address</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={address} onChange={(e) => setAddress(e.target.value)} /></CCol>
              </CRow>

              <CRow className="g-3 mb-3 align-items-center">
                <CCol md={3}><CFormLabel className="mb-0">Contact Person Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} /></CCol>
                <CCol md={3}><CFormLabel className="mb-0">Contact Number</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={contactNo} onChange={(e) => setContactNo(e.target.value)} /></CCol>
              </CRow>

              <CRow className="g-3 mb-3 align-items-center">
                <CCol md={3}><CFormLabel className="mb-0">Scope of MOU</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={scope} onChange={(e) => setScope(e.target.value)} /></CCol>
                <CCol md={3}><CFormLabel className="mb-0">From Date</CFormLabel></CCol>
                <CCol md={3} className="d-flex gap-2 align-items-center">
                  <CFormInput placeholder="dd/mm/yyyy" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  <span className="text-muted">To</span>
                  <CFormInput placeholder="dd/mm/yyyy" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      )}

      {/* Document Uploads */}
      {showDocuments && (
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Document Uploads</strong>
            <div className="d-flex gap-2">
              <CircleIconButton title="View" color="info" icon={cilMagnifyingGlass} onClick={() => {}} />
              <CircleIconButton title="Download" color="success" icon={cilCloudDownload} onClick={() => {}} />
            </div>
          </CCardHeader>
          <CCardBody>
            <div className="table-responsive">
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th style={{ width: 70 }} className="text-center">Select</th>
                    <th>Document Category</th>
                    <th>Upload Document</th>
                    <th>File Log</th>
                    <th style={{ width: 110 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {docRows.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="text-center">
                        <input
                          type="radio"
                          name="docSelect"
                          checked={r.selected}
                          onChange={() => setSelectedDocRow(r.id)}
                        />
                      </td>
                      <td>
                        <CFormInput
                          value={r.category}
                          onChange={(e) => updateDocRow(r.id, { category: e.target.value })}
                        />
                      </td>
                      <td>
                        <CFormInput
                          type="file"
                          onChange={(e) => updateDocRow(r.id, { file: e.target.files?.[0] ?? null })}
                        />
                      </td>
                      <td>
                        <CFormInput value={r.fileLog} readOnly />
                      </td>
                      <td className="action-icons">
                        {idx === 0 ? (
                          <CButton size="sm" color="success" type="button" onClick={addDocRow}>
                            +
                          </CButton>
                        ) : (
                          <CButton size="sm" color="danger" type="button" onClick={() => removeDocRow(r.id)}>
                            -
                          </CButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <CButton size="sm" color="primary" type="button" onClick={onSaveDocuments}>
                Save
              </CButton>
              <CButton size="sm" color="secondary" type="button" onClick={onCancelDocuments}>
                Cancel
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}
    </CardShell>
  )
}

export default PlacementMOUs
