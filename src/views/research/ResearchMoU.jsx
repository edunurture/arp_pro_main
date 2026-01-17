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
 * ResearchMoU.jsx
 * Converted from: research_mous.html
 *
 * Workflow:
 * 1) Add New enables Academic Year
 * 2) Search shows MoU Activities card (table + toolbar)
 * 3) Add icon shows Add MoU Details form + Document Upload
 * 4) Document table supports + row add and row removal (keeps trailing + row)
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

const ResearchMoU = () => {
  // Phase 1: Academic selection
  const [enabled, setEnabled] = useState(false)
  const [academicYear, setAcademicYear] = useState('2025 – 26')

  // Phase 2: MoU Activities list (after Search)
  const [showActivities, setShowActivities] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState('')

  // Phase 3: Add MoU Details (after Add icon)
  const [showDetails, setShowDetails] = useState(false)

  const [form, setForm] = useState({
    organization: '',
    category: '',
    yearOfSigning: '',
    duration: '',
    activities: '',
    participants: '',
  })

  const [docRows, setDocRows] = useState([makeDocRow(true)])

  const academicYearOptions = useMemo(() => ['2025 – 26', '2026 – 27'], [])

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear()
    const years = []
    for (let y = now; y >= now - 10; y -= 1) years.push(String(y))
    return years
  }, [])

  // Mock activities list rows
  const rows = useMemo(
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
    setShowActivities(false)
    setSelectedRowId('')
    setShowDetails(false)
    setForm({
      organization: '',
      category: '',
      yearOfSigning: '',
      duration: '',
      activities: '',
      participants: '',
    })
    setDocRows([makeDocRow(true)])
  }, [])

  // Phase 1 handlers
  const handleAddNew = useCallback(() => setEnabled(true), [])
  const handleSearch = useCallback(() => {
    if (!enabled) return
    setShowActivities(true)
  }, [enabled])
  const handleReset = useCallback(() => setAcademicYear('2025 – 26'), [])
  const handleCancel = useCallback(() => resetAll(), [resetAll])

  // Activities toolbar handlers (stubs)
  const handleAdd = useCallback(() => {
    if (!showActivities) return
    setShowDetails(true)
  }, [showActivities])

  const handleEdit = useCallback(() => alert('Edit clicked (stub).'), [])
  const handleView = useCallback(() => alert('View clicked (stub).'), [])
  const handleDelete = useCallback(() => alert('Delete clicked (stub).'), [])

  // Form handlers
  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const handleSave = useCallback(() => {
    console.log('SAVE (stub)', { academicYear, selectedRowId, form, docRows })
    alert('Saved (stub).')
  }, [academicYear, selectedRowId, form, docRows])

  const handleClose = useCallback(() => setShowDetails(false), [])
  const handleCancelForm = useCallback(() => {
    setForm({
      organization: '',
      category: '',
      yearOfSigning: '',
      duration: '',
      activities: '',
      participants: '',
    })
    setDocRows([makeDocRow(true)])
  }, [])

  // Documents logic
  const updateDocRow = useCallback((rowId, patch) => {
    setDocRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)))
  }, [])

  const togglePlusMinus = useCallback((rowId) => {
    setDocRows((prev) => {
      const next = [...prev]
      const idx = next.findIndex((r) => r.id === rowId)
      if (idx === -1) return prev

      const row = next[idx]
      if (row.isPlusRow) {
        next[idx] = { ...row, isPlusRow: false }
        next.push(makeDocRow(true))
        return next
      }
      next.splice(idx, 1)
      return next.length ? next : [makeDocRow(true)]
    })
  }, [])

  const handleDocView = useCallback(() => alert('View documents (stub).'), [])
  const handleDocDownload = useCallback(() => alert('Download documents (stub).'), [])

  const selectedDept = useMemo(() => rows.find((x) => x.id === selectedRowId)?.dept || '—', [rows, selectedRowId])
  const selectedProg = useMemo(() => rows.find((x) => x.id === selectedRowId)?.prog || '—', [rows, selectedRowId])

  return (
    <CardShell title="Research MoU" breadcrumbItems={["Setup", "Research", "Research MoU"]}>
      {/* Header actions */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h5 className="mb-0">Research MoU</h5>
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

      {/* Phase 1: Academic Selection */}
      <CCard className="mb-4">
        <CCardHeader>
          <h5 className="mb-0">MoU Filters</h5>
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

      {/* Phase 2: MoU Activities */}
      {showActivities && (
        <CCard className="mb-4">
          <CCardHeader>
            <CRow className="w-100 align-items-center g-2">
              <CCol md={8}>
                <h5 className="mb-0">MOU ACTIVITIES</h5>
              </CCol>
              <CCol md={4} className="d-flex justify-content-end gap-2 flex-wrap">
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
                    <CTableHeaderCell>Status of MoU Activities</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {rows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="selectMou"
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

      {/* Phase 3: Add MoU Details */}
      {showDetails && (
        <CCard className="mb-5">
          <CCardHeader>
            <h5 className="mb-0">Add MoU Details</h5>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CCard className="mb-3 border-0">
                <CCardBody className="p-0">
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
                          <CTableDataCell>{selectedDept}</CTableDataCell>
                          <CTableDataCell>{selectedProg}</CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>
                  </div>
                </CCardBody>
              </CCard>

              <CRow className="g-3 align-items-center">
                <CCol md={3}>
                  <CFormLabel>Organization with MoU</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.organization} onChange={(e) => setField('organization', e.target.value)} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Institution / Industry / Corporate</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.category} onChange={(e) => setField('category', e.target.value)} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Year of Signing</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.yearOfSigning} onChange={(e) => setField('yearOfSigning', e.target.value)}>
                    <option value="">Select</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Duration</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.duration} onChange={(e) => setField('duration', e.target.value)} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Activities</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.activities} onChange={(e) => setField('activities', e.target.value)} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Participants</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.participants} onChange={(e) => setField('participants', e.target.value)} />
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

export default ResearchMoU
