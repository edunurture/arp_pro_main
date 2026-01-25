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

const PlacementDrives = () => {
  const [academicYear, setAcademicYear] = useState('')
  const [academicYearEnabled, setAcademicYearEnabled] = useState(false)
  const [showSection, setShowSection] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

  const [driveDate, setDriveDate] = useState('')
  const [driveTitle, setDriveTitle] = useState('')
  const [driveCategory, setDriveCategory] = useState('')
  const [companies, setCompanies] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [maxCtc, setMaxCtc] = useState('')
  const [noToRecruit, setNoToRecruit] = useState('')
  const [eligibleProgrammes, setEligibleProgrammes] = useState('')

  const [docRows, setDocRows] = useState([
    { id: 1, selected: true, category: '', file: null, fileLog: '' },
  ])

  const enableAcademicYear = useCallback(() => {
    setAcademicYearEnabled(true)
  }, [])

  const handleSearch = useCallback(() => {
    if (!academicYear) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    setShowSection(true)
  }, [academicYear])

  const handleAdd = useCallback(() => {
    handleSearch()
  }, [handleSearch])

  const handleCancelMain = useCallback(() => {
    setAcademicYear('')
    setAcademicYearEnabled(false)
    setShowValidation(false)
    setShowSection(false)
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
    // TODO: integrate API
    console.log('Saved placement drive')
  }, [])

  const onCancel = useCallback(() => {
    setShowSection(false)
  }, [])

  return (
    <CardShell
      title="Placement Drives"
      breadcrumb={[
        { label: 'Setup', path: '/setup' },
        { label: 'Placements - Drives' },
      ]}
    >
      {/* Header Buttons */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>PLACEMENTS – DRIVES</strong>
          <div className="d-flex gap-2">
            <CButton size="sm" color="primary" type="button" onClick={enableAcademicYear}>
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

      {/* Academic Selection */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Placement Drives</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3 align-items-center">
              <CCol md={3}>
                <CFormLabel className="mb-0">Academic Year</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  disabled={!academicYearEnabled}
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

      {/* ADD PLACEMENT DRIVES */}
      {showSection && (
        <>
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>ADD PLACEMENT DRIVES</strong>
              <div className="d-flex gap-2">
                <CircleIconButton title="Edit" color="primary" icon={cilPencil} onClick={() => {}} />
                <CircleIconButton title="Delete" color="danger" icon={cilTrash} onClick={() => {}} />
                <CircleIconButton title="Upload" color="info" icon={cilCloudUpload} onClick={() => {}} />
                <CircleIconButton title="Download" color="success" icon={cilCloudDownload} onClick={() => {}} />
                <CircleIconButton title="Print" color="warning" icon={cilPrint} onClick={() => {}} />
              </div>
            </CCardHeader>
            <CCardBody>
              <CForm>
                <CRow className="g-3 mb-3">
                  <CCol md={2}><CFormLabel>Choose Drive Date</CFormLabel></CCol>
                  <CCol md={4}><CFormInput type="date" value={driveDate} onChange={(e) => setDriveDate(e.target.value)} /></CCol>
                  <CCol md={2}><CFormLabel>Drive Title</CFormLabel></CCol>
                  <CCol md={4}><CFormInput value={driveTitle} onChange={(e) => setDriveTitle(e.target.value)} /></CCol>
                </CRow>

                <CRow className="g-3 mb-3">
                  <CCol md={2}><CFormLabel>Drive Category</CFormLabel></CCol>
                  <CCol md={4}><CFormInput value={driveCategory} onChange={(e) => setDriveCategory(e.target.value)} /></CCol>
                  <CCol md={2}><CFormLabel>Select Companies</CFormLabel></CCol>
                  <CCol md={4}><CFormInput value={companies} onChange={(e) => setCompanies(e.target.value)} /></CCol>
                </CRow>

                <CRow className="g-3 mb-3">
                  <CCol md={2}><CFormLabel>Job Description</CFormLabel></CCol>
                  <CCol md={4}><CFormInput value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} /></CCol>
                  <CCol md={2}><CFormLabel>Maximum CTC</CFormLabel></CCol>
                  <CCol md={4}><CFormInput value={maxCtc} onChange={(e) => setMaxCtc(e.target.value)} /></CCol>
                </CRow>

                <CRow className="g-3 mb-3">
                  <CCol md={2}><CFormLabel>Number to be Recruit</CFormLabel></CCol>
                  <CCol md={4}><CFormInput value={noToRecruit} onChange={(e) => setNoToRecruit(e.target.value)} /></CCol>
                  <CCol md={2}><CFormLabel>Eligible Programmes</CFormLabel></CCol>
                  <CCol md={4}><CFormInput value={eligibleProgrammes} onChange={(e) => setEligibleProgrammes(e.target.value)} /></CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>

          {/* Document Uploads */}
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
                <table className="table table-bordered">
                  <thead>
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
        </>
      )}
    </CardShell>
  )
}

export default PlacementDrives
