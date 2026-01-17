import React, { useCallback, useMemo, useState } from 'react'
import {
  cilPlus,
  cilMinus,
  cilPencil,
  cilMagnifyingGlass,
  cilTrash,
  cilCloudUpload,
  cilCloudDownload,
  cilPrint,} from '@coreui/icons'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CButton,
  CTable,
  CTableBody,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTableDataCell,
  CBadge,
} from '@coreui/react-pro'

// ARP common components (existing in your project)
import CardShell from 'src/components/common/CardShell'
import FormRow from 'src/components/common/FormRow'
import ArpActionToolbar from 'src/components/common/ArpActionToolbar'
import IconCircleButton from 'src/components/common/IconCircleButton'

/**
 * ResearchActivitiesBank.jsx
 * Converted from: research_activities_bank.html
 *
 * Notes:
 * - Uses mock / stub handlers for View/Download/Upload/Edit/Delete actions (alert/console).
 * - Uses state-driven rendering to match the HTML phase flow.
 */

const CATEGORY_LABELS = [
  'Seed Money',
  'Research Award',
  'Research Grant',
  'Consultancy Projects',
  'Research Publications',
  'Book Publications',
]

const categoryToKey = (label) =>
  (label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const makeEmptyDocRow = () => ({
  id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
  docCategory: '',
  file: null,
  fileLog: '',
})

const ensureRowsHaveTrailingAddRow = (rows) => {
  // We model the HTML behavior by always keeping a trailing "add" row.
  // Clicking "+" on the last row converts it into a removable row and appends a new "+" row.
  if (!rows || rows.length === 0) return [makeEmptyDocRow()]
  return rows
}

const ResearchActivitiesBank = () => {
  // Phase 1: Academic selection
  const [academicDisabled, setAcademicDisabled] = useState(true)
  const [academicYear, setAcademicYear] = useState('')
  const [department, setDepartment] = useState('')

  // Phase 2: Research Activities card visibility
  const [showActivities, setShowActivities] = useState(false)

  // Phase 2: Activity category selection (for opening Phase 3+ forms)
  const [activityCategory, setActivityCategory] = useState('')

  // Phase 3+: active category form (only one visible at a time)
  const [activeCategory, setActiveCategory] = useState('') // label

  // Per-category form state (minimal fields + document table rows)
  const initialCategoryState = useMemo(() => {
    const obj = {}
    CATEGORY_LABELS.forEach((label) => {
      obj[categoryToKey(label)] = {
        // minimal form data per category (extend later with API integration)
        formData: {},
        docs: ensureRowsHaveTrailingAddRow([makeEmptyDocRow()]),
      }
    })
    return obj
  }, [])

  const [categoryState, setCategoryState] = useState(initialCategoryState)

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear()
    const years = []
    for (let y = now; y >= now - 50; y -= 1) years.push(String(y))
    return years
  }, [])

  const academicYearOptions = useMemo(() => ['2025 – 26', '2026 – 27'], [])

  const departmentOptions = useMemo(() => ['Computer Science', 'Commerce', 'Management'], [])

  const resetAllCategoryForms = useCallback(() => {
    setActiveCategory('')
    setActivityCategory('')
    setCategoryState((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => {
        next[k] = {
          ...next[k],
          formData: {},
          docs: ensureRowsHaveTrailingAddRow([makeEmptyDocRow()]),
        }
      })
      return next
    })
  }, [])

  // --- Toolbar handlers (stubs) ---
  const handleTemplateDownload = useCallback((name) => {
    // Replace with real download logic when backend is wired.
    alert(`Downloading template: ${name}`)
  }, [])

  const handleAddNew = useCallback(() => {
    setAcademicDisabled(false)
  }, [])

  const handleSearch = useCallback(() => {
    setShowActivities(true)
  }, [])

  const handleCancel = useCallback(() => {
    // Match HTML: disable academic inputs + hide activities + hide all category forms
    setAcademicDisabled(true)
    setShowActivities(false)
    setAcademicYear('')
    setDepartment('')
    resetAllCategoryForms()
  }, [resetAllCategoryForms])

  const openCategoryForm = useCallback(
    (label) => {
      if (!label) return
      setActiveCategory(label)
      const key = categoryToKey(label)
      setCategoryState((prev) => {
        const cur = prev[key]
        if (!cur) return prev
        // Ensure there is at least one doc row
        if (!cur.docs || cur.docs.length === 0) {
          return { ...prev, [key]: { ...cur, docs: ensureRowsHaveTrailingAddRow([makeEmptyDocRow()]) } }
        }
        return prev
      })
      // Scroll behavior in HTML is smooth; here we rely on natural layout.
      // If needed, you can add refs later.
    },
    [setCategoryState],
  )

  const handleAddActivity = useCallback(() => {
    if (!activityCategory) {
      alert('Please choose an activity category.')
      return
    }
    openCategoryForm(activityCategory)
  }, [activityCategory, openCategoryForm])

  // --- Document table operations (per category) ---
  const updateDocRow = useCallback((catKey, rowId, patch) => {
    setCategoryState((prev) => {
      const cur = prev[catKey]
      if (!cur) return prev
      const docs = (cur.docs || []).map((r) => (r.id === rowId ? { ...r, ...patch } : r))
      return { ...prev, [catKey]: { ...cur, docs } }
    })
  }, [])

  const addDocRowFromPlus = useCallback((catKey, rowId) => {
    setCategoryState((prev) => {
      const cur = prev[catKey]
      if (!cur) return prev
      const docs = [...(cur.docs || [])]
      const idx = docs.findIndex((r) => r.id === rowId)
      if (idx === -1) return prev

      const isLast = idx === docs.length - 1
      if (!isLast) {
        // For non-last rows, treat as remove
        docs.splice(idx, 1)
        return { ...prev, [catKey]: { ...cur, docs: docs.length ? docs : [makeEmptyDocRow()] } }
      }

      // HTML behavior: last "+" becomes removable "-" and a new "+" row is appended.
      // We implement by appending a new empty row. Existing rows are always removable except the last.
      docs.push(makeEmptyDocRow())
      return { ...prev, [catKey]: { ...cur, docs } }
    })
  }, [])

  const closeCategoryForm = useCallback(() => {
    setActiveCategory('')
  }, [])

  // --- Top toolbar actions (stubs) ---
  const handleTopView = useCallback((scope) => {
    alert(`View clicked for ${scope}.`)
  }, [])

  const handleTopDownload = useCallback((scope) => {
    alert(`Download clicked for ${scope}.`)
  }, [])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  // --- Rendering helpers ---
  const activeCategoryKey = useMemo(() => categoryToKey(activeCategory), [activeCategory])
  const activeDocs = useMemo(() => {
    if (!activeCategoryKey) return []
    return categoryState[activeCategoryKey]?.docs || []
  }, [activeCategoryKey, categoryState])

  const contextText = useMemo(() => {
    const yr = academicYear || '—'
    const dept = department || '—'
    return `Year: ${yr} · Dept: ${dept}`
  }, [academicYear, department])

  const renderDocTable = (catKey, tableIdLabel) => {
    const rows = categoryState[catKey]?.docs || []
    return (
      <>
        <div className="d-flex justify-content-end align-items-center gap-2 mb-2">
          <IconCircleButton
            color="primary"
            icon={cilMagnifyingGlass}
            title={`View ${tableIdLabel}`}
            onClick={() => handleTopView(tableIdLabel)}
          />
          <IconCircleButton
            color="success"
            icon={cilCloudDownload}
            title={`Download ${tableIdLabel}`}
            onClick={() => handleTopDownload(tableIdLabel)}
          />
        </div>

        <div className="table-responsive">
          <CTable align="middle" hover>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Document Category</CTableHeaderCell>
                <CTableHeaderCell>Upload Document</CTableHeaderCell>
                <CTableHeaderCell>File Log</CTableHeaderCell>
                <CTableHeaderCell className="text-end">Action</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {rows.map((r, idx) => {
                const isLast = idx === rows.length - 1
                return (
                  <CTableRow key={r.id}>
                    <CTableDataCell style={{ minWidth: 220 }}>
                      <CFormInput
                        value={r.docCategory}
                        placeholder="Enter category"
                        onChange={(e) => updateDocRow(catKey, r.id, { docCategory: e.target.value })}
                      />
                    </CTableDataCell>
                    <CTableDataCell style={{ minWidth: 220 }}>
                      <CFormInput
                        type="file"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null
                          updateDocRow(catKey, r.id, {
                            file: f,
                            fileLog: f ? `Selected: ${f.name}` : '',
                          })
                        }}
                      />
                    </CTableDataCell>
                    <CTableDataCell style={{ minWidth: 240 }}>
                      <CFormInput value={r.fileLog} placeholder="Generated file log" readOnly />
                    </CTableDataCell>
                    <CTableDataCell className="text-end" style={{ width: 120 }}>
                      <IconCircleButton
                        color={isLast ? 'success' : 'danger'}
                        icon={isLast ? cilPlus : cilMinus}
                        title={isLast ? 'Add Row' : 'Remove Row'}
                        onClick={() => addDocRowFromPlus(catKey, r.id)}
                      />
                    </CTableDataCell>
                  </CTableRow>
                )
              })}
            </CTableBody>
          </CTable>
        </div>
      </>
    )
  }

  const renderCategoryForm = () => {
    if (!activeCategory) return null

    const catKey = activeCategoryKey
    const label = activeCategory

    // Category-specific minimal fields from HTML (kept API-ready; extend later)
    const fieldsByCategory = {
      seed_money: [
        { label: 'Choose Year', type: 'select', options: yearOptions, name: 'year' },
        { label: 'Seed Money Amount', type: 'text', name: 'amount', placeholder: 'Amount' },
        { label: 'Project Name', type: 'text', name: 'projectName' },
        { label: 'Project Description', type: 'text', name: 'projectDescription' },
        { label: 'Duration of the Project', type: 'text', name: 'duration' },
        { label: 'Collaborating Agency', type: 'text', name: 'agency' },
      ],
      research_award: [
        { label: 'Choose Year', type: 'select', options: yearOptions, name: 'year' },
        { label: 'Name of the Award', type: 'text', name: 'awardName' },
        { label: 'Type (Or) Level', type: 'select', options: ['State', 'National', 'International'], name: 'level' },
        { label: 'Award Agency', type: 'text', name: 'awardAgency' },
      ],
      research_grant: [
        { label: 'Name of the Project / Endowments / Chairs', type: 'text', name: 'projectName' },
        { label: 'Name of the Principal Investigator / Co – Investigator', type: 'text', name: 'investigator' },
        { label: 'Name of the Funding Agency', type: 'text', name: 'fundingAgency' },
        { label: 'Type', type: 'select', options: ['Government', 'Non - Government'], name: 'type' },
        { label: 'Department of Principal Investigator', type: 'select', options: ['Commerce', 'Computer Science'], name: 'piDept' },
        { label: 'Year of the Award', type: 'select', options: yearOptions, name: 'awardYear' },
        { label: 'Funds Provided', type: 'text', name: 'funds' },
        { label: 'Duration of the Project', type: 'text', name: 'duration' },
      ],
      consultancy_projects: [
        { label: 'Year', type: 'select', options: yearOptions, name: 'year' },
        { label: 'Type', type: 'text', name: 'type' },
        { label: 'Name of the Project / Corporate Training Program', type: 'text', name: 'projectName' },
        { label: 'Consultancy / Sponsoring Agency', type: 'text', name: 'agency' },
        { label: 'Revenue Generated', type: 'text', name: 'revenue' },
        { label: 'Number of Trainee', type: 'text', name: 'trainees' },
        { label: 'Funds Provided', type: 'text', name: 'funds' },
        { label: 'Duration of Consultancy', type: 'text', name: 'duration' },
      ],
      research_publications: [
        { label: 'Title of the Paper', type: 'text', name: 'paperTitle' },
        { label: 'Name of the Author', type: 'text', name: 'authorName' },
        { label: 'Department', type: 'select', options: ['Commerce', 'Management', 'Computer Science'], name: 'dept' },
        { label: 'Name of the Journal', type: 'text', name: 'journalName' },
        { label: 'Year of Publication', type: 'select', options: yearOptions, name: 'year' },
        { label: 'ISSN Number', type: 'text', name: 'issn' },
        { label: 'Category', type: 'text', name: 'category' },
        { label: 'Is Listed in UGC CARE List?', type: 'select', options: ['Yes', 'No'], name: 'ugcCare' },
      ],
      book_publications: [
        { label: 'Publication Type', type: 'text', name: 'publicationType' },
        { label: 'Title of the Book', type: 'text', name: 'bookTitle' },
        { label: 'ISSN Number', type: 'text', name: 'issn' },
        { label: 'Name of the Publisher', type: 'text', name: 'publisher' },
        { label: 'Year of Publication', type: 'select', options: yearOptions, name: 'year' },
        { label: 'Remarks if Any', type: 'text', name: 'remarks' },
      ],
    }

    const fields = fieldsByCategory[catKey] || []

    const formData = categoryState[catKey]?.formData || {}

    const setFormField = (name, value) => {
      setCategoryState((prev) => {
        const cur = prev[catKey]
        if (!cur) return prev
        return { ...prev, [catKey]: { ...cur, formData: { ...(cur.formData || {}), [name]: value } } }
      })
    }

    const handleSave = () => {
      // Replace with API integration
      console.log('SAVE', { category: label, academicYear, department, formData, docs: categoryState[catKey]?.docs || [] })
      alert(`Saved (stub): ${label}`)
    }

    const handleCancelForm = () => {
      // Cancel inside form: reset fields + keep card visible (HTML resets form inputs)
      setCategoryState((prev) => {
        const cur = prev[catKey]
        if (!cur) return prev
        return {
          ...prev,
          [catKey]: { ...cur, formData: {}, docs: ensureRowsHaveTrailingAddRow([makeEmptyDocRow()]) },
        }
      })
    }

    return (
      <CCard className="mb-4">
        <CCardHeader className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0">{`Add ${label} Details`}</h5>
          </div>
          <div className="d-flex align-items-center gap-2">
            <CBadge color="secondary">{`Category: ${label}`}</CBadge>
          </div>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3 align-items-center">
              {fields.map((f, i) => (
                <React.Fragment key={`${f.name}-${i}`}>
                  <CCol md={3}>
                    <CFormLabel>{f.label}</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    {f.type === 'select' ? (
                      <CFormSelect
                        value={formData[f.name] || ''}
                        onChange={(e) => setFormField(f.name, e.target.value)}
                      >
                        <option value="">{f.options?.[0] === 'Select' ? 'Select' : 'Select'}</option>
                        {(f.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </CFormSelect>
                    ) : (
                      <CFormInput
                        type="text"
                        value={formData[f.name] || ''}
                        placeholder={f.placeholder || ''}
                        onChange={(e) => setFormField(f.name, e.target.value)}
                      />
                    )}
                  </CCol>
                </React.Fragment>
              ))}
            </CRow>

            <div className="mt-3">{renderDocTable(catKey, `tbl_${catKey}`)}</div>

            <div className="d-flex justify-content-end gap-2 mt-3 flex-wrap">
              <CButton color="success" size="sm" onClick={handleSave}>
                Save
              </CButton>
              <CButton color="secondary" size="sm" onClick={closeCategoryForm}>
                Close
              </CButton>
              <CButton color="danger" variant="outline" size="sm" onClick={handleCancelForm}>
                Cancel
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>
    )
  }

  return (
    <CardShell title="Research Activity" breadcrumbItems={["Setup", "Research Activity"]}>
      {/* Top header actions (Add New + Download Template) */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0">Research Activity</h5>
          </div>
          <div className="d-flex align-items-center gap-2">
            <CButton color="primary" size="sm" onClick={handleAddNew}>
              + Add New
            </CButton>

            <CDropdown alignment="end">
              <CDropdownToggle color="secondary" size="sm">
                Download Template
              </CDropdownToggle>
              <CDropdownMenu>
                {CATEGORY_LABELS.map((c) => (
                  <CDropdownItem key={c} onClick={() => handleTemplateDownload(c)}>
                    {c}
                  </CDropdownItem>
                ))}
              </CDropdownMenu>
            </CDropdown>
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
            <CRow className="g-3 align-items-center">
              <CCol md={3}>
                <CFormLabel>Academic Year</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={academicYear}
                  disabled={academicDisabled}
                  onChange={(e) => setAcademicYear(e.target.value)}
                >
                  <option value="">Select</option>
                  {academicYearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Choose Department</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={department}
                  disabled={academicDisabled}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">Select</option>
                  {departmentOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <CButton color="success" size="sm" onClick={handleSearch}>
                Search
              </CButton>
              <CButton color="secondary" size="sm" onClick={handleCancel}>
                Cancel
              </CButton>
            </div>
          </CForm>
        </CCardBody>
      </CCard>

      {/* Phase 2: Research Activities */}
      {showActivities && (
        <CCard className="mb-4">
          <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex flex-column">
              <h5 className="mb-0">Research Activities</h5>
              <small className="text-medium-emphasis">{contextText}</small>
            </div>

            {/* Right actions (circle icons) */}
            <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap">
              <IconCircleButton color="success" icon={cilPlus} title="Add" onClick={handleAddActivity} />
              <IconCircleButton
                color="warning"
                icon={cilPencil}
                title="Edit"
                onClick={() => alert('Edit clicked (stub).')}
              />
              <IconCircleButton
                color="info"
                icon={cilMagnifyingGlass}
                title="View"
                onClick={() => alert('View clicked (stub).')}
              />
              <IconCircleButton
                color="danger"
                icon={cilTrash}
                title="Delete"
                onClick={() => alert('Delete clicked (stub).')}
              />
              <IconCircleButton
                color="primary"
                icon={cilCloudUpload}
                title="Upload"
                onClick={() => alert('Upload clicked (stub).')}
              />
              <IconCircleButton
                color="secondary"
                icon={cilCloudDownload}
                title="Download"
                onClick={() => alert('Download clicked (stub).')}
              />
              <IconCircleButton color="dark" icon={cilPrint} title="Print" onClick={handlePrint} />
            </div>
          </CCardHeader>

          <CCardBody>
          <CCardBody>
            <CRow className="g-3 align-items-center mb-2">
              <CCol md={3}>
                <CFormLabel>Faculty Code</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput disabled value="Automatic Fetch" />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Faculty Name</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect disabled value="Automatic Fetch">
                  <option>Automatic Fetch</option>
                </CFormSelect>
              </CCol>
            </CRow>

            <CRow className="g-3 align-items-center">
              <CCol md={3}>
                <CFormLabel>Designation</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput disabled value="Automatic Fetch" />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Choose Activity Category</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={activityCategory} onChange={(e) => setActivityCategory(e.target.value)}>
                  <option value="">Select</option>
                  {CATEGORY_LABELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
          </CCardBody>
</CCardBody>
        </CCard>
      )}

      {/* Phase 3+: Category form */}
      {renderCategoryForm()}
    </CardShell>
  )
}

export default ResearchActivitiesBank
