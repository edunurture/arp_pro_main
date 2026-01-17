import React, { useCallback, useMemo, useState } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'

import {
  cilPlus,
  cilPencil,
  cilMagnifyingGlass,
  cilTrash,
  cilCloudDownload,
} from '@coreui/icons'

// ARP common components (existing in your project)
import CardShell from 'src/components/common/CardShell'
import IconCircleButton from 'src/components/common/IconCircleButton'

/**
 * ResearchExtension.jsx
 * Converted from: research_extension.html
 *
 * Behaviors replicated (from HTML):
 * - "Add New" enables Academic Year dropdown
 * - Search shows "Extension Activity" card
 * - Add (circle icon) shows "Add Extension Details" card
 * - Close hides Add Extension Details card
 * - Document table supports + row add and row removal (like addDocRow/removeDocRow in HTML)
 *
 * Notes:
 * - Uses mock data and stub handlers for View/Edit/Delete actions (alert/console).
 * - Uses CoreUI icons compatible with your setup (no cilEye).
 */

const makeDocRow = (isPlusRow = true) => ({
  id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
  docCategory: '',
  file: null,
  fileLog: '—',
  isPlusRow,
})

const ResearchExtension = () => {
  // Phase 1: Academic selection (HTML: Academic Year disabled initially)
  const [enabled, setEnabled] = useState(false)
  const [academicYear, setAcademicYear] = useState('2025 – 26')

  // Phase 2: Extension Activity card (hidden until Search)
  const [showActivity, setShowActivity] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState('')

  // Phase 3: Add Extension Details card (hidden until Add icon)
  const [showDetails, setShowDetails] = useState(false)

  const [detailsForm, setDetailsForm] = useState({
    activityName: '',
    awardName: '',
    awardingBody: '',
    awardYear: '',
    publicationYear: '',
    remarks: '',
  })

  // Documents inside details card
  const [selectedDocId, setSelectedDocId] = useState('')
  const [docRows, setDocRows] = useState([makeDocRow(true)])

  const academicYearOptions = useMemo(() => ['2025 – 26', '2026 – 27'], [])

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear()
    const years = []
    for (let y = now; y >= now - 10; y -= 1) years.push(String(y))
    return years
  }, [])

  // Mock table data (HTML has empty rows; we provide placeholders)
  const activityRows = useMemo(
    () => [
      { id: '1', dept: 'Computer Science', prog: 'B.Sc CS', status: 'Active' },
      { id: '2', dept: 'Commerce', prog: 'B.Com', status: 'Planned' },
      { id: '3', dept: 'Management', prog: 'BBA', status: 'Completed' },
      { id: '4', dept: 'Tamil', prog: 'B.A Tamil', status: 'Active' },
      { id: '5', dept: 'Physics', prog: 'B.Sc Physics', status: 'Planned' },
    ],
    [],
  )

  const resetAll = useCallback(() => {
    setEnabled(false)
    setAcademicYear('2025 – 26')
    setShowActivity(false)
    setSelectedActivityId('')
    setShowDetails(false)
    setDetailsForm({
      activityName: '',
      awardName: '',
      awardingBody: '',
      awardYear: '',
      publicationYear: '',
      remarks: '',
    })
    setSelectedDocId('')
    setDocRows([makeDocRow(true)])
  }, [])

  // --- Phase 1 handlers ---
  const handleAddNew = useCallback(() => {
    setEnabled(true)
  }, [])

  const handleSearch = useCallback(() => {
    if (!enabled) return
    setShowActivity(true)
  }, [enabled])

  const handleReset = useCallback(() => {
    // HTML reset button resets form controls (keep enabled state)
    setAcademicYear('2025 – 26')
  }, [])

  const handleCancel = useCallback(() => {
    // HTML Cancel resets and hides downstream cards
    resetAll()
  }, [resetAll])

  // --- Activity card icon handlers ---
  const handleAddDetails = useCallback(() => {
    if (!showActivity) return
    setShowDetails(true)
  }, [showActivity])

  const handleEdit = useCallback(() => alert('Edit clicked (stub).'), [])
  const handleView = useCallback(() => alert('View clicked (stub).'), [])
  const handleDelete = useCallback(() => alert('Delete clicked (stub).'), [])

  // --- Details form handlers ---
  const setField = (k, v) => setDetailsForm((p) => ({ ...p, [k]: v }))

  const handleCloseDetails = useCallback(() => {
    setShowDetails(false)
  }, [])

  const handleCancelDetails = useCallback(() => {
    setDetailsForm({
      activityName: '',
      awardName: '',
      awardingBody: '',
      awardYear: '',
      publicationYear: '',
      remarks: '',
    })
    setSelectedDocId('')
    setDocRows([makeDocRow(true)])
  }, [])

  const handleSaveDetails = useCallback(() => {
    console.log('SAVE (stub)', { academicYear, selectedActivityId, detailsForm, docRows })
    alert('Saved (stub).')
  }, [academicYear, selectedActivityId, detailsForm, docRows])

  // --- Docs table behavior (+ -> append new plus row, minus/remove -> delete row) ---
  const updateDocRow = useCallback((rowId, patch) => {
    setDocRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)))
  }, [])

  const togglePlusMinus = useCallback((rowId) => {
    setDocRows((prev) => {
      const rows = [...prev]
      const idx = rows.findIndex((r) => r.id === rowId)
      if (idx === -1) return prev

      const row = rows[idx]
      if (row.isPlusRow) {
        // Convert current plus row to removable row, then append a new plus row
        rows[idx] = { ...row, isPlusRow: false }
        rows.push(makeDocRow(true))
        return rows
      }
      // removable row -> remove
      rows.splice(idx, 1)
      return rows.length ? rows : [makeDocRow(true)]
    })
  }, [])

  const handleDocView = useCallback(() => alert('View documents (stub).'), [])
  const handleDocDownload = useCallback(() => alert('Download documents (stub).'), [])

  return (
    <CardShell title="Research Extension" breadcrumbItems={["Setup", "Research Extension"]}>
      {/* Top header actions (Add New + View) */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h5 className="mb-0">Research Extension</h5>
          <div className="d-flex align-items-center gap-2">
            <CButton color="primary" size="sm" onClick={handleAddNew}>
              Add New
            </CButton>
            <CButton color="secondary" size="sm" onClick={() => alert('Top View (stub).')}>
              View
            </CButton>
          </div>
        </CCardHeader>
      </CCard>

      {/* Phase 1: Academic Selection */}
      <CCard className="mb-4">
        <CCardHeader>
          <h5 className="mb-0">Academic Selection</h5>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3 align-items-end">
              <CCol md={3}>
                <CFormLabel className="mb-0">Academic Year</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  id="academicYear"
                  disabled={!enabled}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                >
                  {academicYearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6} className="d-flex gap-2 justify-content-end flex-wrap">
                <CButton color="primary" size="sm" disabled={!enabled} onClick={handleSearch}>
                  Search
                </CButton>
                <CButton
                  size="sm"
                  style={{ backgroundColor: '#b8860b', borderColor: '#b8860b', color: 'white' }}
                  disabled={!enabled}
                  onClick={handleReset}
                >
                  Reset
                </CButton>
                <CButton color="secondary" size="sm" onClick={handleCancel}>
                  Cancel
                </CButton>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* Phase 2: Extension Activity */}
      {showActivity && (
        <CCard className="mb-4" id="extensionActivityCard">
          <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h5 className="mb-0">Extension Activity</h5>

            <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
              <IconCircleButton color="primary" icon={cilPlus} title="Add" onClick={handleAddDetails} />
              <IconCircleButton color="secondary" icon={cilPencil} title="Edit" onClick={handleEdit} />
              <IconCircleButton
                color="info"
                icon={cilMagnifyingGlass}
                title="View"
                onClick={handleView}
              />
              <IconCircleButton color="danger" icon={cilTrash} title="Delete" onClick={handleDelete} />
            </div>
          </CCardHeader>

          <CCardBody>
            <div className="table-responsive">
              <CTable bordered align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 80 }} className="text-center">
                      Select
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '25%' }}>Department</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '35%' }}>Programme</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: '30%' }}>Status of Extension Activities</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {activityRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="selectRow"
                          checked={selectedActivityId === r.id}
                          onChange={() => setSelectedActivityId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.dept}</CTableDataCell>
                      <CTableDataCell>{r.prog}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={r.status === 'Active' ? 'success' : r.status === 'Completed' ? 'secondary' : 'warning'}>
                          {r.status}
                        </CBadge>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* Phase 3: Add Extension Details */}
      {showDetails && (
        <CCard className="mb-5" id="extensionDetailsCard">
          <CCardHeader>
            <h5 className="mb-0">Add Extension Details</h5>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3 align-items-center">
                <CCol md={3}>
                  <CFormLabel>Name of the Activity</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={detailsForm.activityName} onChange={(e) => setField('activityName', e.target.value)} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Name of the Award</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={detailsForm.awardName} onChange={(e) => setField('awardName', e.target.value)} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Name of the Awarding</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={detailsForm.awardingBody} onChange={(e) => setField('awardingBody', e.target.value)} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Year of Award</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={detailsForm.awardYear} onChange={(e) => setField('awardYear', e.target.value)}>
                    <option value="">Select</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Year of Publication</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={detailsForm.publicationYear}
                    onChange={(e) => setField('publicationYear', e.target.value)}
                  >
                    <option value="">Select</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Remarks if any</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={detailsForm.remarks} onChange={(e) => setField('remarks', e.target.value)} />
                </CCol>
              </CRow>

              <div className="d-flex justify-content-end mb-2 mt-3 gap-2">
                <IconCircleButton color="info" icon={cilMagnifyingGlass} title="View" onClick={handleDocView} />
                <IconCircleButton color="success" icon={cilCloudDownload} title="Download" onClick={handleDocDownload} />
              </div>

              <div className="table-responsive mt-2">
                <CTable bordered align="middle">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Document Category</CTableHeaderCell>
                      <CTableHeaderCell>Upload Document</CTableHeaderCell>
                      <CTableHeaderCell>File Log</CTableHeaderCell>
                      <CTableHeaderCell className="text-center" style={{ width: 110 }}>
                        Action
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {docRows.map((r) => (
                      <CTableRow key={r.id}>
                        <CTableDataCell style={{ minWidth: 220 }}>
                          <CFormInput
                            value={r.docCategory}
                            onChange={(e) => updateDocRow(r.id, { docCategory: e.target.value })}
                          />
                        </CTableDataCell>
                        <CTableDataCell style={{ minWidth: 220 }}>
                          <CFormInput
                            type="file"
                            onChange={(e) => {
                              const f = e.target.files?.[0] || null
                              updateDocRow(r.id, {
                                file: f,
                                fileLog: f ? `${new Date().toLocaleString()} – ${f.name}` : '—',
                              })
                            }}
                          />
                        </CTableDataCell>
                        <CTableDataCell className="text-medium-emphasis" style={{ minWidth: 240 }}>
                          {r.fileLog || '—'}
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <IconCircleButton
                            color={r.isPlusRow ? 'success' : 'danger'}
                            icon={r.isPlusRow ? cilPlus : cilTrash}
                            title={r.isPlusRow ? 'Add Row' : 'Remove Row'}
                            onClick={() => togglePlusMinus(r.id)}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3 flex-wrap">
                <CButton color="primary" size="sm" onClick={handleSaveDetails}>
                  Save
                </CButton>
                <CButton color="secondary" size="sm" onClick={handleCloseDetails}>
                  Close
                </CButton>
                <CButton color="danger" size="sm" onClick={handleCancelDetails}>
                  Cancel
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      )}
    </CardShell>
  )
}

export default ResearchExtension
