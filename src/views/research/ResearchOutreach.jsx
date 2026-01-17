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

import CardShell from 'src/components/common/CardShell'
import IconCircleButton from 'src/components/common/IconCircleButton'

/**
 * ResearchOutreach.jsx
 * Converted from: research_outreach.html
 *
 * Workflow (matches HTML):
 * 1) Add New enables Academic Year
 * 2) Search shows Outreach Activity card (table + toolbar)
 * 3) Add icon shows Research Activity header + Add Outreach Activity form
 * 4) Document table supports + row add and row removal
 *
 * Notes:
 * - Uses mock data and stub handlers for Edit/View/Delete actions.
 * - Uses CoreUI icons compatible with your setup (no cilEye).
 */

const makeDocRow = (isPlusRow = true) => ({
  id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
  docCategory: '',
  file: null,
  fileLog: '—',
  isPlusRow,
})

const ResearchOutreach = () => {
  // Phase 1: Academic selection
  const [enabled, setEnabled] = useState(false)
  const [academicYear, setAcademicYear] = useState('2025 – 26')

  // Phase 2: Outreach Activity card (hidden until Search)
  const [showOutreachTable, setShowOutreachTable] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedRowId, setSelectedRowId] = useState('')
  const [pageSize, setPageSize] = useState('10')

  // Phase 3+: Add Outreach workflow
  const [showResearchHeader, setShowResearchHeader] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const [form, setForm] = useState({
    activityName: '',
    agency: '',
    schemeName: '',
    yearOfActivity: '',
    students: '',
    remarks: '',
  })

  const [docRows, setDocRows] = useState([makeDocRow(true)])

  const academicYearOptions = useMemo(() => ['2025 – 26', '2026 – 27'], [])

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear()
    const years = []
    for (let y = now; y >= now - 10; y -= 1) years.push(String(y))
    return years
  }, [])

  const studentOptions = useMemo(() => Array.from({ length: 200 }, (_, i) => String(i + 1)), [])

  // Mock table data for outreach activity
  const outreachRows = useMemo(
    () => [
      { id: '1', dept: 'Computer Science', prog: 'B.Sc CS', status: 'Active' },
      { id: '2', dept: 'Commerce', prog: 'B.Com', status: 'Planned' },
      { id: '3', dept: 'Management', prog: 'BBA', status: 'Completed' },
      { id: '4', dept: 'English', prog: 'B.A English', status: 'Active' },
    ],
    [],
  )

  const resetAll = useCallback(() => {
    setEnabled(false)
    setAcademicYear('2025 – 26')
    setShowOutreachTable(false)
    setSearchText('')
    setSelectedRowId('')
    setShowResearchHeader(false)
    setShowAddForm(false)
    setForm({
      activityName: '',
      agency: '',
      schemeName: '',
      yearOfActivity: '',
      students: '',
      remarks: '',
    })
    setDocRows([makeDocRow(true)])
  }, [])

  // Phase 1 handlers
  const handleAddNew = useCallback(() => setEnabled(true), [])

  const handleSearch = useCallback(() => {
    if (!enabled) return
    setShowOutreachTable(true)
  }, [enabled])

  const handleReset = useCallback(() => {
    setAcademicYear('2025 – 26')
    setSearchText('')
  }, [])

  const handleCancel = useCallback(() => {
    resetAll()
  }, [resetAll])

  // Table toolbar handlers (stubs)
  const handleEdit = useCallback(() => alert('Edit clicked (stub).'), [])
  const handleView = useCallback(() => alert('View clicked (stub).'), [])
  const handleDelete = useCallback(() => alert('Delete clicked (stub).'), [])

  const handleAdd = useCallback(() => {
    if (!showOutreachTable) return
    setShowResearchHeader(true)
    setShowAddForm(true)
  }, [showOutreachTable])

  // Form handlers
  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = useCallback(() => {
    console.log('SAVE (stub)', { academicYear, selectedRowId, form, docRows })
    alert('Saved (stub).')
  }, [academicYear, selectedRowId, form, docRows])

  const handleClose = useCallback(() => {
    setShowAddForm(false)
    setShowResearchHeader(false)
  }, [])

  const handleCancelForm = useCallback(() => {
    setForm({
      activityName: '',
      agency: '',
      schemeName: '',
      yearOfActivity: '',
      students: '',
      remarks: '',
    })
    setDocRows([makeDocRow(true)])
  }, [])

  // Documents behavior (+ -> append new row; remove -> delete row)
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
        rows[idx] = { ...row, isPlusRow: false }
        rows.push(makeDocRow(true))
        return rows
      }
      rows.splice(idx, 1)
      return rows.length ? rows : [makeDocRow(true)]
    })
  }, [])

  const handleDocView = useCallback(() => alert('View documents (stub).'), [])
  const handleDocDownload = useCallback(() => alert('Download documents (stub).'), [])

  return (
    <CardShell title="Outreach Programme" breadcrumbItems={["Setup", "Research", "Outreach Programme"]}>
            {/* Header actions */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h5 className="mb-0">Research Activity – Outreach Programme</h5>
          <div className="d-flex align-items-center gap-2">
            <CButton color="primary" size="sm" onClick={handleAddNew}>
              Add New
            </CButton>
            <CButton color="secondary" size="sm" onClick={() => alert('View clicked (stub).')}>
              View
            </CButton>
          </div>
        </CCardHeader>
      </CCard>

      {/* Academic Selection */}
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
                <CFormSelect disabled={!enabled} value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
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

      {/* Outreach Activity Table */}
      {showOutreachTable && (
        <CCard className="mb-4">
          <CCardHeader>
            <CRow className="w-100 align-items-center g-2">
              <CCol md={3}>
                <h5 className="mb-0">Outreach Activity</h5>
              </CCol>

              <CCol md={4}>
                <CFormInput
                  placeholder="Search"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </CCol>

              <CCol md={2}>
                <CFormSelect value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </CFormSelect>
              </CCol>

              <CCol md={3} className="d-flex justify-content-end gap-2 flex-wrap">
                <IconCircleButton color="primary" icon={cilPlus} title="Add" onClick={handleAdd} />
                <IconCircleButton color="secondary" icon={cilPencil} title="Edit" onClick={handleEdit} />
                <IconCircleButton color="info" icon={cilMagnifyingGlass} title="View" onClick={handleView} />
                <IconCircleButton color="danger" icon={cilTrash} title="Delete" onClick={handleDelete} />
              </CCol>
            </CRow>
          </CCardHeader>

          <CCardBody>
            <div className="table-responsive">
              <CTable bordered align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 80 }} className="text-center">
                      Select
                    </CTableHeaderCell>
                    <CTableHeaderCell>Department</CTableHeaderCell>
                    <CTableHeaderCell>Programme</CTableHeaderCell>
                    <CTableHeaderCell>Status of Extension / Outreach Activities</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {outreachRows
                    .filter((r) => {
                      const q = searchText.trim().toLowerCase()
                      if (!q) return true
                      return (
                        r.dept.toLowerCase().includes(q) ||
                        r.prog.toLowerCase().includes(q) ||
                        r.status.toLowerCase().includes(q)
                      )
                    })
                    .slice(0, Number(pageSize))
                    .map((r) => (
                      <CTableRow key={r.id}>
                        <CTableDataCell className="text-center">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="selectOutreach"
                            checked={selectedRowId === r.id}
                            onChange={() => setSelectedRowId(r.id)}
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

      {/* Research Activity Header (after Add) */}
      {showResearchHeader && (
        <CCard className="mb-4">
          <CCardHeader>
            <h5 className="mb-0">Research Activity</h5>
          </CCardHeader>
          <CCardBody>
            <div className="table-responsive">
              <CTable bordered align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Department</CTableHeaderCell>
                    <CTableHeaderCell>Programme</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell>{outreachRows.find((x) => x.id === selectedRowId)?.dept || '—'}</CTableDataCell>
                    <CTableDataCell>{outreachRows.find((x) => x.id === selectedRowId)?.prog || '—'}</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* Add Outreach Activity Form */}
      {showAddForm && (
        <CCard className="mb-5">
          <CCardHeader>
            <h5 className="mb-0">Add Outreach Activity</h5>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3 align-items-center">
                <CCol md={3}>
                  <CFormLabel>Name of the Activity</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.activityName} onChange={(e) => setField('activityName', e.target.value)} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Organizing / Collaborating Agency</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.agency} onChange={(e) => setField('agency', e.target.value)} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Name of the Scheme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.schemeName} onChange={(e) => setField('schemeName', e.target.value)} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Year of Activity</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.yearOfActivity} onChange={(e) => setField('yearOfActivity', e.target.value)}>
                    <option value="">Select</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>No. of Students</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.students} onChange={(e) => setField('students', e.target.value)}>
                    <option value="">Select</option>
                    {studentOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Remarks</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.remarks} onChange={(e) => setField('remarks', e.target.value)} />
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
                          <CFormInput value={r.docCategory} onChange={(e) => updateDocRow(r.id, { docCategory: e.target.value })} />
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
                <CButton color="primary" size="sm" onClick={handleSave}>
                  Save
                </CButton>
                <CButton color="secondary" size="sm" onClick={handleClose}>
                  Close
                </CButton>
                <CButton color="danger" size="sm" onClick={handleCancelForm}>
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

export default ResearchOutreach
