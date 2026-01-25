import React, { useCallback, useState } from 'react'
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

const PlacementOffers = () => {
  const [academicYear, setAcademicYear] = useState('')
  const [showValidation, setShowValidation] = useState(false)
  const [showOfferCard, setShowOfferCard] = useState(false)
  const [showDocumentCard, setShowDocumentCard] = useState(false)

  const [driveDate, setDriveDate] = useState('')
  const [company, setCompany] = useState('')
  const [programme, setProgramme] = useState('')
  const [className, setClassName] = useState('')
  const [regNo, setRegNo] = useState('')
  const [studentName, setStudentName] = useState('')
  const [designation, setDesignation] = useState('')
  const [ctcPerYear, setCtcPerYear] = useState('')

  const [docRows, setDocRows] = useState([
    { id: 1, selected: true, category: '', file: null, fileLog: '' },
  ])

  const handleSearch = useCallback(() => {
    if (!academicYear) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    setShowOfferCard(true)
    setShowDocumentCard(true)
  }, [academicYear])

  const handleAdd = useCallback(() => {
    handleSearch()
  }, [handleSearch])

  const handleCancelMain = useCallback(() => {
    setAcademicYear('')
    setShowValidation(false)
    setShowOfferCard(false)
    setShowDocumentCard(false)
  }, [])

  const populateStudentName = useCallback((value) => {
    if (value === '10MCA01') {
      setStudentName('John Doe')
    } else if (value === '10MCA02') {
      setStudentName('Jane Smith')
    } else {
      setStudentName('')
    }
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

  const onSave = useCallback(() => {
    console.log('Saved placement offer')
  }, [])

  const onCancel = useCallback(() => {
    setShowOfferCard(false)
    setShowDocumentCard(false)
  }, [])

  return (
    <CardShell
      title="Placement Offers"
      breadcrumb={[
        { label: 'Setup', path: '/setup' },
        { label: 'Placements – Offers' },
      ]}
    >
      {/* Header Buttons */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>PLACEMENTS – OFFERS</strong>
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
                <CButton size="sm" color="secondary" type="button" onClick={handleCancelMain}>
                  Cancel
                </CButton>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* UPLOAD OFFER / APPOINTMENT ORDERS */}
      {showOfferCard && (
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>UPLOAD OFFER / APPOINTMENT ORDERS</strong>
            <div className="d-flex gap-2">
              <CircleIconButton title="Edit" color="primary" icon={cilPencil} onClick={() => {}} />
              <CircleIconButton title="Delete" color="danger" icon={cilTrash} onClick={() => {}} />
              <CircleIconButton title="Upload" color="secondary" icon={cilCloudUpload} onClick={() => {}} />
              <CircleIconButton title="Download" color="success" icon={cilCloudDownload} onClick={() => {}} />
              <CircleIconButton title="Print" color="dark" icon={cilPrint} onClick={() => {}} />
            </div>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3 mb-3 align-items-center">
                <CCol md={3}><CFormLabel className="mb-0">Choose Drive Date</CFormLabel></CCol>
                <CCol md={3}><CFormInput type="date" value={driveDate} onChange={(e) => setDriveDate(e.target.value)} /></CCol>
                <CCol md={3}><CFormLabel className="mb-0">Choose Company</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={company} onChange={(e) => setCompany(e.target.value)}>
                    <option value="">Select Company</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="g-3 mb-3 align-items-center">
                <CCol md={3}><CFormLabel className="mb-0">Choose Programme</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={programme} onChange={(e) => setProgramme(e.target.value)}>
                    <option value="">Select Programme</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}><CFormLabel className="mb-0">Choose Class</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={className} onChange={(e) => setClassName(e.target.value)}>
                    <option value="">Select Class</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="g-3 mb-3 align-items-center">
                <CCol md={3}><CFormLabel className="mb-0">Choose Register Number</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={regNo}
                    onChange={(e) => {
                      setRegNo(e.target.value)
                      populateStudentName(e.target.value)
                    }}
                  >
                    <option value="">Select Reg. No.</option>
                    <option value="10MCA01">10MCA01</option>
                    <option value="10MCA02">10MCA02</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}><CFormLabel className="mb-0">Student Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={studentName} disabled /></CCol>
              </CRow>

              <CRow className="g-3 mb-3 align-items-center">
                <CCol md={3}><CFormLabel className="mb-0">Designation</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={designation} onChange={(e) => setDesignation(e.target.value)} /></CCol>
                <CCol md={3}><CFormLabel className="mb-0">CTC Per Year</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={ctcPerYear} onChange={(e) => setCtcPerYear(e.target.value)} /></CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      )}

      {/* Document Uploads */}
      {showDocumentCard && (
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>DOCUMENT UPLOADS</strong>
            <div className="d-flex gap-2">
              <CircleIconButton title="View" color="info" icon={cilMagnifyingGlass} onClick={() => {}} />
              <CircleIconButton title="Download" color="success" icon={cilCloudDownload} onClick={() => {}} />
            </div>
          </CCardHeader>
          <CCardBody>
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead style={{ backgroundColor: '#7f7f7f', color: '#ffffff' }}>
                  <tr>
                    <th>Select</th>
                    <th>Document Category</th>
                    <th>Upload Document</th>
                    <th>File Log</th>
                    <th>Action</th>
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
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null
                            updateDocRow(r.id, {
                              file,
                              fileLog: file ? file.name : '',
                            })
                          }}
                        />
                      </td>
                      <td>
                        <CFormInput value={r.fileLog} readOnly />
                      </td>
                      <td>
                        {idx === 0 ? (
                          <CButton size="sm" color="success" type="button" onClick={addDocRow}>
                            +
                          </CButton>
                        ) : (
                          <CButton
                            size="sm"
                            color="danger"
                            type="button"
                            onClick={() => removeDocRow(r.id)}
                          >
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
              <CButton size="sm" color="primary" type="button" onClick={onSave}>
                Save
              </CButton>
              <CButton size="sm" color="secondary" type="button" onClick={onCancel}>
                Cancel
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}
    </CardShell>
  )
}

export default PlacementOffers
