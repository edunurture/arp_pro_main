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
      style={{ width: 32, height: 32, padding: 0 }}
      onClick={onClick}
    >
      <CIcon icon={icon} />
    </CButton>
  </CTooltip>
)

const PlacementSchedule = () => {
  const [academicYear, setAcademicYear] = useState('')
  const [academicYearEnabled, setAcademicYearEnabled] = useState(false)
  const [showSection, setShowSection] = useState(false)
  const [showValidation, setShowValidation] = useState(false)

  const [month, setMonth] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [programme, setProgramme] = useState('')
  const [activity, setActivity] = useState('')
  const [mouFlag, setMouFlag] = useState('')
  const [mouOrg, setMouOrg] = useState('')

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
    if (!academicYear) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    setShowSection(true)
  }, [academicYear])

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

  const savePlacement = useCallback(() => {
    if (!academicYear || !month || !fromDate || !toDate) {
      alert('Please fill Academic Year, Month, From Date and To Date.')
      return
    }
    // eslint-disable-next-line no-console
    console.log('Saved placement schedule')
  }, [academicYear, month, fromDate, toDate])

  const cancelPlacement = useCallback(() => {
    setShowSection(false)
    setMonth('')
    setFromDate('')
    setToDate('')
    setProgramme('')
    setActivity('')
    setMouFlag('')
    setMouOrg('')
    setDocRows([{ id: 1, selected: true, category: '', file: null, fileLog: '' }])
  }, [])

  return (
    <CardShell
      title="Placement Schedule"
      breadcrumb={[
        { label: 'Setup', path: '/setup' },
        { label: 'Placement Schedule' },
      ]}
    >
      {/* Header Buttons */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>PLACEMENTS – PLACEMENT SCHEDULE / CALENDAR</strong>
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
          <strong>ADD SCHEDULE</strong>
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

      {/* Placement Section */}
      {showSection && (
        <>
          {/* Add Schedule Card */}
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>ADD SCHEDULE</strong>
              <div className="d-flex gap-2">
                <CircleIconButton title="Edit" color="primary" icon={cilPencil} onClick={() => {}} />
                <CircleIconButton title="Delete" color="danger" icon={cilTrash} onClick={() => {}} />
                <CircleIconButton title="Upload" color="info" icon={cilCloudUpload} onClick={() => {}} />
                <CircleIconButton title="Download" color="success" icon={cilCloudDownload} onClick={() => {}} />
                <CircleIconButton title="Print" color="dark" icon={cilPrint} onClick={() => window.print()} />
              </div>
            </CCardHeader>
            <CCardBody>
              <CForm>
                <CRow className="g-3 mb-3 align-items-center">
                  <CCol md={3}><CFormLabel className="mb-0">Choose Month</CFormLabel></CCol>
                  <CCol md={3}>
                    <CFormSelect value={month} onChange={(e) => setMonth(e.target.value)}>
                      <option value="">Select Month</option>
                      <option>January</option>
                      <option>February</option>
                      <option>March</option>
                      <option>April</option>
                      <option>May</option>
                      <option>June</option>
                      <option>July</option>
                      <option>August</option>
                      <option>September</option>
                      <option>October</option>
                      <option>November</option>
                      <option>December</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={3}><CFormLabel className="mb-0">From Date</CFormLabel></CCol>
                  <CCol md={3}><CFormInput type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></CCol>
                </CRow>

                <CRow className="g-3 mb-3 align-items-center">
                  <CCol md={3}><CFormLabel className="mb-0">To Date</CFormLabel></CCol>
                  <CCol md={3}><CFormInput type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></CCol>
                  <CCol md={3}><CFormLabel className="mb-0">Choose Programme</CFormLabel></CCol>
                  <CCol md={3}><CFormInput value={programme} onChange={(e) => setProgramme(e.target.value)} /></CCol>
                </CRow>

                <CRow className="g-3 mb-3 align-items-center">
                  <CCol md={3}><CFormLabel className="mb-0">Placement Activity</CFormLabel></CCol>
                  <CCol md={3}><CFormInput value={activity} onChange={(e) => setActivity(e.target.value)} /></CCol>
                  <CCol md={3}><CFormLabel className="mb-0">Organized Through MOU?</CFormLabel></CCol>
                  <CCol md={3}>
                    <CFormSelect value={mouFlag} onChange={(e) => setMouFlag(e.target.value)}>
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </CFormSelect>
                  </CCol>
                </CRow>

                <CRow className="g-3 mb-3 align-items-center">
                  <CCol md={3}><CFormLabel className="mb-0">Choose MOU Organization</CFormLabel></CCol>
                  <CCol md={3}><CFormInput value={mouOrg} onChange={(e) => setMouOrg(e.target.value)} /></CCol>
                  <CCol md={3} />
                  <CCol md={3} />
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
                <table className="table table-bordered align-middle">
                  <thead style={{ backgroundColor: '#7f7f7f', color: '#ffffff' }}>
                    <tr>
                      <th style={{ width: '10%' }}>Select</th>
                      <th style={{ width: '25%' }}>Document Category</th>
                      <th style={{ width: '35%' }}>Upload Document</th>
                      <th style={{ width: '25%' }}>File Log</th>
                      <th style={{ width: '15%' }}>Action</th>
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
                <CButton size="sm" color="primary" type="button" onClick={savePlacement}>
                  Save
                </CButton>
                <CButton size="sm" color="secondary" type="button" onClick={cancelPlacement}>
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

export default PlacementSchedule
