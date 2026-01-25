import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'

import { ArpButton, ArpIconButton, ArpPagination } from '../../components/common'

const initialForm = {
  academicYear: '',
  department: '',
  activity: '',

  // Phase 4 fields
  programmeName: '',
  implementationDate: '',
  studentsEnrolled: '',
  agencies: '',
}

const TABLE_ROWS = [
  { id: 1, programme: 'Competitive Exams Coaching – Batch A', status: 'Active' },
  { id: 2, programme: 'Career Counseling Workshop – Semester 1', status: 'Active' },
  { id: 3, programme: 'Competitive Exams – Mock Test Series', status: 'Inactive' },
  { id: 4, programme: 'Career Counseling – Resume & Interview', status: 'Active' },
  { id: 5, programme: 'Competitive Exams Guidance – Orientation', status: 'Active' },
]

const ACTIVITY_OPTIONS = ['Competitive Examinations', 'Career Counseling']

// ----- Document Upload Table Logic (as per ResearchActivities.jsx pattern) -----
const makeEmptyDocRow = () => ({
  id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
  docCategory: '',
  file: null,
  fileLog: '',
})

const ensureRowsHaveTrailingAddRow = (rows) => {
  if (!rows || rows.length === 0) return [makeEmptyDocRow()]
  return rows
}

const normalize = (v) =>
  String(v ?? '')
    .toLowerCase()
    .trim()

const CompetitiveExaminations = () => {
  // ARP state pattern
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [form, setForm] = useState(initialForm)

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'programme', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Phase visibility
  // Phase 1: Academic Selection (always shown as Form Card)
  // Phase 2: Table Card (shown after Search)
  // Phase 3/4: Additional cards shown BELOW Phase 2
  const [showTable, setShowTable] = useState(false)
  const [showPhase3, setShowPhase3] = useState(false)
  const [showPhase4, setShowPhase4] = useState(false)

  // Document upload rows (used in phase 4)
  const [docs, setDocs] = useState(ensureRowsHaveTrailingAddRow([makeEmptyDocRow()]))

  // Optional upload ref (kept to match ARP prompt patterns)
  const uploadRef = useRef(null)

  const academicYearOptions = useMemo(() => ['2025 – 26', '2026 – 27'], [])
  const departmentOptions = useMemo(() => ['Computer Science', 'Commerce', 'Management'], [])

  const rows = useMemo(() => TABLE_ROWS, [])

  const sortToggle = (key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    })
  }

  const sortIndicator = (key) => {
    if (sort.key !== key) return ''
    return sort.dir === 'asc' ? ' ▲' : ' ▼'
  }

  const filteredSorted = useMemo(() => {
    const q = normalize(search)
    let data = rows

    if (q) data = rows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) => normalize(a?.[key]).localeCompare(normalize(b?.[key])))
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [rows, search, sort])

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const pageRows = useMemo(() => filteredSorted.slice(startIdx, endIdx), [filteredSorted, startIdx, endIdx])

  // ----- Form helpers -----
  const setField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const resetPhase34 = () => {
    setShowPhase3(false)
    setShowPhase4(false)
    setForm((p) => ({
      ...p,
      activity: '',
      programmeName: '',
      implementationDate: '',
      studentsEnrolled: '',
      agencies: '',
    }))
    setDocs(ensureRowsHaveTrailingAddRow([makeEmptyDocRow()]))
  }

  const onAddNew = () => {
    setIsEdit(true)
    setSelectedId(null)
    setShowTable(false)
    resetPhase34()
    setSearch('')
    setSort({ key: 'programme', dir: 'asc' })
    setPage(1)
    setPageSize(10)
    setForm(initialForm)
  }

  const onView = () => {
    setIsEdit(false)
    setShowTable(true)
    resetPhase34()
  }

  // Phase 1 buttons
  const onSearchPhase1 = () => {
    setShowTable(true)
    resetPhase34()
  }

  const onResetPhase1 = () => {
    setForm((p) => ({ ...p, academicYear: '', department: '' }))
  }

  const onCancelPhase1 = () => {
    setIsEdit(false)
    setSelectedId(null)
    setShowTable(false)
    resetPhase34()
    setForm(initialForm)
  }

  // Phase 2 actions
  const canRowActions = !!selectedId

  const onPlus = () => {
    if (!selectedId) return
    setIsEdit(true)
    setShowPhase3(true)
    setShowPhase4(false)

    // Keep selected programme into form for downstream phases
    const selectedRow = rows.find((r) => r.id === selectedId)
    setForm((p) => ({
      ...p,
      activity: '',
      programmeName: selectedRow?.programme || '',
    }))
  }

  const onEdit = () => {
    if (!selectedId) return
    setIsEdit(true)
    setShowPhase3(false)
    setShowPhase4(true)
  }

  const onViewRow = () => {
    if (!selectedId) return
    setIsEdit(false)
    setShowPhase3(false)
    setShowPhase4(true)
  }

  const onDelete = () => {
    if (!selectedId) return
    // Hook your API here
    // eslint-disable-next-line no-alert
    alert('Delete clicked (stub).')
  }

  // Phase 3 buttons
  const onSearchPhase3 = () => {
    if (!form.activity) return
    setShowPhase4(true)
  }

  const onResetPhase3 = () => {
    setForm((p) => ({ ...p, activity: '' }))
  }

  const onCancelPhase3 = () => {
    setShowPhase3(false)
    setShowPhase4(false)
  }

  // Phase 4 buttons
  const onSavePhase4 = () => {
    // Hook your API here
    // eslint-disable-next-line no-console
    console.log('SAVE Competitive Examinations (stub)', {
      academicYear: form.academicYear,
      department: form.department,
      selectedProgrammeId: selectedId,
      activity: form.activity,
      programmeName: form.programmeName,
      implementationDate: form.implementationDate,
      studentsEnrolled: form.studentsEnrolled,
      agencies: form.agencies,
      docs,
    })

    setIsEdit(false)
    setShowPhase3(false)
    setShowPhase4(false)
    // eslint-disable-next-line no-alert
    alert('Saved (stub).')
  }

  const onClosePhase4 = () => {
    setIsEdit(false)
    setShowPhase3(false)
    setShowPhase4(false)
  }

  const onCancelPhase4 = () => {
    setForm((p) => ({
      ...p,
      activity: '',
      programmeName: '',
      implementationDate: '',
      studentsEnrolled: '',
      agencies: '',
    }))
    setDocs(ensureRowsHaveTrailingAddRow([makeEmptyDocRow()]))
  }

  // ----- Document upload handlers -----
  const updateDocRow = (rowId, patch) => {
    setDocs((prev) => prev.map((r) => (r.id === rowId ? { ...r, ...patch } : r)))
  }

  const addDocRowFromPlus = (rowId) => {
    setDocs((prev) => {
      const next = [...(prev || [])]
      const idx = next.findIndex((r) => r.id === rowId)
      if (idx === -1) return prev

      const isLast = idx === next.length - 1
      if (!isLast) {
        next.splice(idx, 1)
        return next.length ? next : [makeEmptyDocRow()]
      }

      next.push(makeEmptyDocRow())
      return next
    })
  }

  const selectedProgramme = useMemo(() => rows.find((r) => r.id === selectedId) || null, [rows, selectedId])

  // ----- Render helpers -----
  const renderPhase1Form = () => (
    <CForm>
      <CRow className="g-3 align-items-center">
        <CCol md={3}>
          <CFormLabel>Academic Year</CFormLabel>
        </CCol>
        <CCol md={3}>
          <CFormSelect value={form.academicYear} onChange={setField('academicYear')} disabled={!isEdit}>
            <option value="">Select</option>
            {academicYearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </CFormSelect>
        </CCol>

        <CCol md={3}>
          <CFormLabel>Choose Department</CFormLabel>
        </CCol>
        <CCol md={3}>
          <CFormSelect value={form.department} onChange={setField('department')} disabled={!isEdit}>
            <option value="">Select</option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </CFormSelect>
        </CCol>

        <CCol xs={12} className="d-flex justify-content-end gap-2">
          <ArpButton label="Search" icon="search" color="info" onClick={onSearchPhase1} />
          <ArpButton label="Reset" icon="reset" color="warning" onClick={onResetPhase1} />
          <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelPhase1} />
        </CCol>
      </CRow>
    </CForm>
  )

  const renderPhase3Form = () => (
    <CForm>
      <CRow className="g-3 align-items-center">
        <CCol md={3}>
          <CFormLabel>Department</CFormLabel>
        </CCol>
        <CCol md={3}>
          <CFormInput value={form.department || ''} readOnly />
        </CCol>

        <CCol md={3}>
          <CFormLabel>Programme</CFormLabel>
        </CCol>
        <CCol md={3}>
          <CFormInput value={selectedProgramme?.programme || ''} readOnly />
        </CCol>

        <CCol md={3}>
          <CFormLabel>Choose Activity</CFormLabel>
        </CCol>
        <CCol md={3}>
          <CFormSelect value={form.activity} onChange={setField('activity')} disabled={!isEdit}>
            <option value="">Select</option>
            {ACTIVITY_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </CFormSelect>
        </CCol>

        <CCol md={6} className="d-flex justify-content-end gap-2">
          <ArpButton label="Search" icon="search" color="info" onClick={onSearchPhase3} />
          <ArpButton label="Reset" icon="reset" color="warning" onClick={onResetPhase3} />
          <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelPhase3} />
        </CCol>
      </CRow>
    </CForm>
  )

  const renderDocTable = () => (
    <div className="table-responsive mt-3">
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
          {docs.map((r, idx) => {
            const isLast = idx === docs.length - 1
            return (
              <CTableRow key={r.id}>
                <CTableDataCell style={{ minWidth: 220 }}>
                  <CFormInput
                    value={r.docCategory}
                    placeholder="Enter category"
                    onChange={(e) => updateDocRow(r.id, { docCategory: e.target.value })}
                    disabled={!isEdit}
                  />
                </CTableDataCell>

                <CTableDataCell style={{ minWidth: 240 }}>
                  <CFormInput
                    type="file"
                    disabled={!isEdit}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null
                      updateDocRow(r.id, { file: f, fileLog: f ? `Selected: ${f.name}` : '' })
                    }}
                  />
                </CTableDataCell>

                <CTableDataCell style={{ minWidth: 240 }}>
                  <CFormInput value={r.fileLog} placeholder="Generated file log" readOnly />
                </CTableDataCell>

                <CTableDataCell className="text-end" style={{ width: 120 }}>
                  <ArpIconButton
                    icon={isLast ? 'add' : 'delete'}
                    color={isLast ? 'success' : 'danger'}
                    disabled={!isEdit}
                    title={isLast ? 'Add Row' : 'Remove Row'}
                    onClick={() => addDocRowFromPlus(r.id)}
                  />
                </CTableDataCell>
              </CTableRow>
            )
          })}
        </CTableBody>
      </CTable>
    </div>
  )

  const renderPhase4Form = () => (
    <>
      <CForm>
        <CRow className="g-3 align-items-center">
          <CCol md={3}>
            <CFormLabel>Name of the Programme</CFormLabel>
          </CCol>
          <CCol md={3}>
            <CFormInput value={form.programmeName} onChange={setField('programmeName')} disabled={!isEdit} />
          </CCol>

          <CCol md={3}>
            <CFormLabel>Date of Implementation</CFormLabel>
          </CCol>
          <CCol md={3}>
            <CFormInput
              type="date"
              value={form.implementationDate}
              onChange={setField('implementationDate')}
              disabled={!isEdit}
            />
          </CCol>

          <CCol md={3}>
            <CFormLabel>Number of Students Enrolled</CFormLabel>
          </CCol>
          <CCol md={3}>
            <CFormInput
              type="number"
              min="0"
              step="1"
              value={form.studentsEnrolled}
              onChange={(e) => setForm((p) => ({ ...p, studentsEnrolled: e.target.value }))}
              disabled={!isEdit}
              placeholder="Count only"
            />
          </CCol>

          <CCol md={3}>
            <CFormLabel>Name of the Agencies / Consultants Involved with Contact Details*</CFormLabel>
          </CCol>
          <CCol md={3}>
            <CFormInput value={form.agencies} onChange={setField('agencies')} disabled={!isEdit} />
          </CCol>
        </CRow>
      </CForm>

      {renderDocTable()}

      <div className="d-flex justify-content-end gap-2 mt-3 flex-wrap">
        {isEdit && <ArpButton label="Save" icon="save" color="success" onClick={onSavePhase4} />}
        <ArpButton label="Close" icon="cancel" color="secondary" onClick={onClosePhase4} />
        <ArpButton label="Cancel" icon="cancel" color="danger" onClick={onCancelPhase4} />
      </div>
    </>
  )

  return (
    <CRow>
      <CCol xs={12}>
        {/* A) Header Action Card (Top) */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>STUDENT SUPPORT – GUIDANCE FOR COMPETITIVE EXAMINATIONS</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="View" icon="view" color="info" onClick={onView} />
            </div>
          </CCardHeader>
        </CCard>

        {/* B) Form Card (Phase 1 always) */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Student Support – Guidance for Competitive Examinations</strong>
          </CCardHeader>
          <CCardBody>{renderPhase1Form()}</CCardBody>
        </CCard>

        {/* C) Table Card (Phase 2) */}
        {showTable && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Guidance for Competitive Examinations</strong>

              <div
                className="d-flex align-items-center gap-2 flex-nowrap"
                style={{ overflowX: 'auto', maxWidth: '100%' }}
              >
                {/* Search input with icon */}
                <div style={{ minWidth: 220 }}>
                  <CInputGroup size="sm">
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                    <CFormInput placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </CInputGroup>
                </div>

                {/* Page size */}
                <CFormSelect
                  size="sm"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ width: 110 }}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}/page
                    </option>
                  ))}
                </CFormSelect>

                {/* Action circle buttons */}
                <ArpIconButton icon="add" color="success" title="Add" disabled={!canRowActions} onClick={onPlus} />
                <ArpIconButton icon="edit" color="warning" title="Edit" disabled={!canRowActions} onClick={onEdit} />
                <ArpIconButton icon="view" color="info" title="View" disabled={!canRowActions} onClick={onViewRow} />
                <ArpIconButton
                  icon="delete"
                  color="danger"
                  title="Delete"
                  disabled={!canRowActions}
                  onClick={onDelete}
                />
              </div>
            </CCardHeader>

            <CCardBody>
              <div className="table-responsive">
                <CTable align="middle" hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('programme')} style={{ userSelect: 'none' }}>
                        Programme{sortIndicator('programme')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('status')} style={{ userSelect: 'none' }}>
                        Status of Competitive Examinations Programme{sortIndicator('status')}
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {pageRows.map((r) => (
                      <CTableRow key={r.id}>
                        <CTableDataCell>
                          <input
                            type="radio"
                            name="competitiveExamsSelect"
                            checked={selectedId === r.id}
                            onChange={() => {
                              setSelectedId(r.id)
                              setForm((p) => ({ ...p, programmeName: r.programme }))
                            }}
                          />
                        </CTableDataCell>
                        <CTableDataCell>{r.programme}</CTableDataCell>
                        <CTableDataCell>{r.status}</CTableDataCell>
                      </CTableRow>
                    ))}

                    {pageRows.length === 0 && (
                      <CTableRow>
                        <CTableDataCell colSpan={3} className="text-center text-medium-emphasis">
                          No records found
                        </CTableDataCell>
                      </CTableRow>
                    )}
                  </CTableBody>
                </CTable>
              </div>

              <div className="d-flex justify-content-end mt-2">
                <ArpPagination
                  size="sm"
                  align="end"
                  page={safePage}
                  totalPages={totalPages}
                  onChange={setPage}
                  prevText="Previous"
                  nextText="Next"
                />
              </div>

              {/* Hidden upload input (kept for future extension) */}
              <input ref={uploadRef} type="file" style={{ display: 'none' }} />
            </CCardBody>
          </CCard>
        )}

        {/* Phase 3 card - displayed BELOW Phase 2 */}
        {showTable && showPhase3 && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Guidance for Competitive Examination and Skill Enhancement / Career Counseling</strong>
            </CCardHeader>
            <CCardBody>{renderPhase3Form()}</CCardBody>
          </CCard>
        )}

        {/* Phase 4 card - displayed BELOW Phase 2 (and below Phase 3 if visible) */}
        {showTable && showPhase4 && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Add Capacity Development And Skill Enhancement Activities</strong>
            </CCardHeader>
            <CCardBody>{renderPhase4Form()}</CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default CompetitiveExaminations
