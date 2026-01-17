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
  CDateRangePicker,
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
 * ResearchInnovation.jsx
 * Converted from: research_innovation.html
 *
 * Key Behaviors replicated:
 * - Add New enables Academic Year + toolbar icons
 * - Search shows Activity table
 * - Add icon shows Add Form
 * - Save & Add Document shows Document Upload section
 * - Docs table supports + -> - and appending a new trailing row
 *
 * Notes:
 * - Uses mock data and stub handlers for View/Download/Edit/Delete (alert/console).
 * - Uses CoreUI icons that are broadly available (no cilEye).
 */

const makeDocRow = () => ({
  id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
  docCategory: '',
  file: null,
  fileLog: '—',
  isPlusRow: true, // UI state: plus row at the end
})

const ResearchInnovation = () => {
  // Phase 1 (initially disabled like HTML)
  const [enabled, setEnabled] = useState(false)
  const [academicYear, setAcademicYear] = useState('')
  const [searchText, setSearchText] = useState('')

  // Phase 2: Activity table
  const [showActivity, setShowActivity] = useState(false)
  const [selectedActivityId, setSelectedActivityId] = useState('')

  // Phase 3: Add form
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({
    year: '',
    workshopName: '',
    participants: '',
    dateFrom: '',
    dateTo: '',
    reportUrl: '',
    iprDate: '',
  })

  // Phase 4: Document upload
  const [showDocs, setShowDocs] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState('')
  const [docRows, setDocRows] = useState([makeDocRow()])

  const academicYearOptions = useMemo(() => ['2025 – 26', '2026 – 27'], [])

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear()
    const years = []
    for (let y = now + 2; y >= now - 10; y -= 1) years.push(String(y))
    return years
  }, [])

  const participantOptions = useMemo(() => Array.from({ length: 100 }, (_, i) => String(i + 1)), [])

  // Mock activity rows (as in HTML sample)
  const activityRows = useMemo(
    () => [
      { id: '1', dept: 'Computer Science', prog: 'B.Tech CSE', status: 'Active' },
      { id: '2', dept: 'Mechanical', prog: 'B.E. Mech', status: 'Completed' },
      { id: '3', dept: 'Management', prog: 'MBA', status: 'Planned' },
    ],
    [],
  )

  const resetAll = useCallback(() => {
    setEnabled(false)
    setAcademicYear('')
    setSearchText('')
    setShowActivity(false)
    setSelectedActivityId('')
    setShowAddForm(false)
    setAddForm({
      year: '',
      workshopName: '',
      participants: '',
      dateFrom: '',
      dateTo: '',
      reportUrl: '',
      iprDate: '',
    })
    setShowDocs(false)
    setSelectedDocId('')
    setDocRows([makeDocRow()])
  }, [])

  // --- Phase 1 handlers ---
  const handleAddNew = useCallback(() => {
    setEnabled(true)
  }, [])

  const handleSearch = useCallback(() => {
    setShowActivity(true)
  }, [])

  const handleReset = useCallback(() => {
    setAcademicYear('')
    setSearchText('')
  }, [])

  const handleCancel = useCallback(() => {
    // HTML: disables and hides sections
    resetAll()
  }, [resetAll])

  // --- Toolbar icon handlers (stubs) ---
  const handleAddIcon = useCallback(() => {
    if (!enabled) return
    setShowAddForm(true)
  }, [enabled])

  const handleEditIcon = useCallback(() => {
    if (!enabled) return
    alert('Edit clicked (stub).')
  }, [enabled])

  const handleViewIcon = useCallback(() => {
    if (!enabled) return
    alert('View clicked (stub).')
  }, [enabled])

  const handleDeleteIcon = useCallback(() => {
    if (!enabled) return
    alert('Delete clicked (stub).')
  }, [enabled])

  const handleDownloadTemplate = useCallback(() => {
    alert('Download Template clicked (stub).')
  }, [])

  // --- Add form handlers ---
  const setAddField = (k, v) => setAddForm((p) => ({ ...p, [k]: v }))

  const handleCancelAddForm = useCallback(() => {
    // HTML: clears add form inputs (keeps section visible)
    setAddForm({
      year: '',
      workshopName: '',
      participants: '',
      dateFrom: '',
      dateTo: '',
      reportUrl: '',
      iprDate: '',
    })
  }, [])

  const handleSaveAddDoc = useCallback(() => {
    // HTML: shows docs and seeds first row if empty
    setShowDocs(true)
    setDocRows((rows) => (rows && rows.length ? rows : [makeDocRow()]))
  }, [])

  // --- Docs table behavior (+ -> - and append new row) ---
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
        // Convert current to minus, append a new plus row (like HTML)
        rows[idx] = { ...row, isPlusRow: false }
        rows.push(makeDocRow())
        return rows
      }
      // Minus row: remove it
      rows.splice(idx, 1)
      return rows.length ? rows : [makeDocRow()]
    })
  }, [])

  const handleDocCancel = useCallback(() => {
    // HTML: clears table and hides docs
    setDocRows([makeDocRow()])
    setShowDocs(false)
    setSelectedDocId('')
  }, [])

  const handleDocClose = useCallback(() => {
    // HTML: Close hides add form
    setShowAddForm(false)
  }, [])

  const handleDocSave = useCallback(() => {
    console.log('DOC SAVE (stub)', { academicYear, addForm, docRows })
    alert('Documents saved (demo).')
  }, [academicYear, addForm, docRows])

  const handleDocView = useCallback(() => alert('View documents (stub).'), [])
  const handleDocDownload = useCallback(() => alert('Download documents (stub).'), [])

  return (
    <CardShell title="Research Innovation" breadcrumbItems={["Setup", "Research Innovation"]}>
      {/* Top header actions (Add New + View + Download Template) */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0">Research Innovation</h5>
          </div>
          <div className="d-flex align-items-center gap-2">
            <CButton color="primary" size="sm" onClick={handleAddNew}>
              Add New
            </CButton>
            <CButton color="secondary" size="sm" onClick={() => alert('Top View (stub).')}>
              View
            </CButton>
            <CButton color="success" size="sm" onClick={handleDownloadTemplate}>
              Download Template
            </CButton>
          </div>
        </CCardHeader>
      </CCard>

      {/* Phase 1: Academic Selection Form */}
      <CCard className="mb-4">
        <CCardHeader>
          <h5 className="mb-0">Academic Selection Form</h5>
        </CCardHeader>
        <CCardBody>
          <CForm>
            {/* 3-column layout like HTML: Label, Select, Buttons */}
            <CRow className="g-3 align-items-end">
              <CCol md={4}>
                <CFormLabel className="required">Academic Year</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  disabled={!enabled}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                >
                  <option value="">Select</option>
                  {academicYearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={4} className="d-flex gap-2 justify-content-md-start justify-content-between flex-wrap">
                <CButton color="primary" size="sm" disabled={!enabled} onClick={handleSearch}>
                  Search
                </CButton>
                <CButton color="secondary" size="sm" disabled={!enabled} onClick={handleReset}>
                  Reset
                </CButton>
                <CButton color="danger" size="sm" onClick={handleCancel}>
                  Cancel
                </CButton>
              </CCol>
            </CRow>

            {/* Toolbar row (Search input + circle icons) */}
            <CRow className="g-3 align-items-center mt-4">
              <CCol md={8}>
                <div className="input-group">
                  <CFormInput
                    disabled={!enabled}
                    placeholder="Search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </CCol>
              <CCol md={4} className="d-flex justify-content-md-end gap-2 flex-wrap">
                <IconCircleButton
                  color="success"
                  icon={cilPlus}
                  title="Add"
                  disabled={!enabled}
                  onClick={handleAddIcon}
                />
                <IconCircleButton
                  color="warning"
                  icon={cilPencil}
                  title="Edit"
                  disabled={!enabled}
                  onClick={handleEditIcon}
                />
                <IconCircleButton
                  color="secondary"
                  icon={cilMagnifyingGlass}
                  title="View"
                  disabled={!enabled}
                  onClick={handleViewIcon}
                />
                <IconCircleButton
                  color="danger"
                  icon={cilTrash}
                  title="Delete"
                  disabled={!enabled}
                  onClick={handleDeleteIcon}
                />
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* Phase 2: Innovation and Eco System Activity */}
      {showActivity && (
        <CCard className="mb-4">
          <CCardHeader>
            <h5 className="mb-0">Innovation and Eco System Activity</h5>
          </CCardHeader>
          <CCardBody>
            <div className="table-responsive">
              <CTable bordered align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 60 }} className="text-center">
                      Select
                    </CTableHeaderCell>
                    <CTableHeaderCell>Department</CTableHeaderCell>
                    <CTableHeaderCell>Programme</CTableHeaderCell>
                    <CTableHeaderCell>Status of Innovation and Eco System Activities</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {activityRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="activitySelect"
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

      {/* Phase 3: Add Innovation and Eco System Form */}
      {showAddForm && (
        <CCard className="mb-4">
          <CCardHeader>
            <h5 className="mb-0">
              Add Innovation and Eco System (Workshops / Seminar on Research Methodology)
            </h5>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3 align-items-center">
                <CCol md={3}>
                  <CFormLabel>Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={addForm.year} onChange={(e) => setAddField('year', e.target.value)}>
                    <option value="">Select Year</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Name of the Workshop / Seminar</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={addForm.workshopName}
                    placeholder="Enter the workshop/Seminar"
                    onChange={(e) => setAddField('workshopName', e.target.value)}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Number of Participants</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={addForm.participants}
                    onChange={(e) => setAddField('participants', e.target.value)}
                  >
                    <option value="">Select</option>
                    {participantOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Date From – To</CFormLabel>
                </CCol>
                
                <CCol md={3}>
                  <CDateRangePicker
                    startDate={addForm.dateFrom}
                    endDate={addForm.dateTo}
                    onStartDateChange={(date) => setAddField('dateFrom', date)}
                    onEndDateChange={(date) => setAddField('dateTo', date)}
                    ranges={{
                      Today: [new Date(), new Date()],
                      Yesterday: [
                        new Date(new Date().setDate(new Date().getDate() - 1)),
                        new Date(new Date().setDate(new Date().getDate() - 1)),
                      ],
                      'Last 7 Days': [
                        new Date(new Date().setDate(new Date().getDate() - 6)),
                        new Date(),
                      ],
                      'Last 30 Days': [
                        new Date(new Date().setDate(new Date().getDate() - 29)),
                        new Date(),
                      ],
                      'This Month': [
                        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
                      ],
                      'Last Month': [
                        new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                        new Date(new Date().getFullYear(), new Date().getMonth(), 0),
                      ],
                    }}
                    placeholder="Select date range"
                  />
                </CCol>


                <CCol md={3}>
                  <CFormLabel>Link to the Activity Report on the Website</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="url"
                    value={addForm.reportUrl}
                    placeholder="enter the website url"
                    onChange={(e) => setAddField('reportUrl', e.target.value)}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Date of Establishment of IPR Cell</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput type="date" value={addForm.iprDate} onChange={(e) => setAddField('iprDate', e.target.value)} />
                </CCol>
              </CRow>

              <div className="d-flex justify-content-end gap-2 mt-4 flex-wrap">
                <CButton color="primary" size="sm" onClick={handleSaveAddDoc}>
                  Save &amp; Add Document
                </CButton>
                <CButton color="secondary" size="sm" onClick={handleCancelAddForm}>
                  Cancel
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      )}

      {/* Phase 4: Document Upload */}
      {showDocs && (
        <CCard className="mb-5">
          <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h5 className="mb-0">Document Upload</h5>
            <div className="d-flex align-items-center gap-2">
              <IconCircleButton color="secondary" icon={cilMagnifyingGlass} title="View" onClick={handleDocView} />
              <IconCircleButton color="success" icon={cilCloudDownload} title="Download" onClick={handleDocDownload} />
            </div>
          </CCardHeader>
          <CCardBody>
            <div className="table-responsive">
              <CTable bordered align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 60 }} className="text-center">
                      Select
                    </CTableHeaderCell>
                    <CTableHeaderCell>Document Category</CTableHeaderCell>
                    <CTableHeaderCell>Upload Document</CTableHeaderCell>
                    <CTableHeaderCell>File log</CTableHeaderCell>
                    <CTableHeaderCell className="text-center" style={{ width: 100 }}>
                      Action
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {docRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="docSelect"
                          checked={selectedDocId === r.id}
                          onChange={() => setSelectedDocId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell style={{ minWidth: 220 }}>
                        <CFormInput
                          value={r.docCategory}
                          placeholder="Enter category"
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
                      <CTableDataCell className="text-medium-emphasis" style={{ minWidth: 220 }}>
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
              <CButton color="primary" size="sm" onClick={handleDocSave}>
                Save
              </CButton>
              <CButton color="secondary" size="sm" onClick={handleDocClose}>
                Close
              </CButton>
              <CButton color="danger" size="sm" onClick={handleDocCancel}>
                Cancel
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}
    </CardShell>
  )
}

export default ResearchInnovation