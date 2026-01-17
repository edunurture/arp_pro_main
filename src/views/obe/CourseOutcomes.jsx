import React, { useEffect, useMemo, useState } from 'react'
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
  CFormTextarea,
  CFormCheck,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CPagination,
  CPaginationItem,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'

/**
 * Course Outcomes Configuration (React + CoreUI)
 * - Strict 3-card ARP structure (Header Action Card, Academic Selection Card, Status Table Card)
 * - Status header row: Search + Page Size + "CO Configuration" button + Circle Icon Buttons
 * - CO Configuration accordion section renders BELOW the Status table card
 * - Accordion headers: Edit/Delete circle icons
 * - Each accordion ends with bottom-right Save + Cancel + Reset buttons
 *
 * NOTE: In-memory demo state only. Wire API later.
 */

const normalize = (v) =>
  String(v ?? '')
    .toLowerCase()
    .trim()

const initialSelection = {
  academicYear: '',
  semester: '',
  programmeCode: '',
  programme: '',
}

const initialRows = [
  {
    id: 1,
    courseCode: '23CMA101',
    courseName: 'Business Mathematics',
    courseOutcomes: 'Pending',
    coPoMapping: 'Pending',
    attainmentWeightage: 'Pending',
  },
  {
    id: 2,
    courseCode: '23CCA102',
    courseName: 'Programming in C',
    courseOutcomes: 'Pending',
    coPoMapping: 'Pending',
    attainmentWeightage: 'Pending',
  },
]

const CourseOutcomesConfiguration = () => {
  // ===== Academic selection =====
  const [selection, setSelection] = useState(initialSelection)
  const [searched, setSearched] = useState(false)

  // ===== Status table UX =====
  const [rows] = useState(initialRows)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1) // 1-based
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState({ key: 'courseCode', dir: 'asc' })

  // ===== Configuration visibility =====
  const [showConfiguration, setShowConfiguration] = useState(false)

  // ===== Accordion UX =====
  const [openSection, setOpenSection] = useState('addCO')
  const [isEdit, setIsEdit] = useState(false)

  // ===== Add Course Outcomes state =====
  const [coRows, setCoRows] = useState([{ index: 'CO1', statement: '' }])
  const [coSaved, setCoSaved] = useState([])

  // ===== CO-PO mapping state (simple matrix-like rows) =====
  const [coPoRows, setCoPoRows] = useState([{ co: 'CO1', po: 'PO1', level: '' }])
  const [coPoSaved, setCoPoSaved] = useState([])

  // ===== CO-PSO mapping state =====
  const [coPsoRows, setCoPsoRows] = useState([{ co: 'CO1', pso: 'PSO1', level: '' }])
  const [coPsoSaved, setCoPsoSaved] = useState([])

  // ===== Attainment weightage state =====
  const [weightage, setWeightage] = useState({ direct: '', indirect: '' })
  const [weightageSaved, setWeightageSaved] = useState(null)

  // ===== dropdowns =====
  const years = useMemo(() => ['2025 – 26', '2026 – 27'], [])
  const semesters = useMemo(() => ['I', 'II', 'III', 'IV', 'V', 'VI'], [])
  const programmeCodes = useMemo(() => ['B.COM', 'B.COM(CA)', 'BBA', 'B.SC(CS)'], [])

  const onSelectionChange = (key) => (e) => {
    const val = e.target.value
    setSelection((p) => {
      const next = { ...p, [key]: val }
      // demo auto-fill programme based on code
      if (key === 'programmeCode') {
        next.programme =
          val === 'B.COM'
            ? 'B.Com'
            : val === 'B.COM(CA)'
              ? 'B.Com (CA)'
              : val === 'BBA'
                ? 'BBA'
                : val === 'B.SC(CS)'
                  ? 'B.Sc (CS)'
                  : ''
      }
      return next
    })
  }

  const onSearch = (e) => {
    e.preventDefault()
    setSearched(true)
    setShowConfiguration(false)
    setSelectedId(null)
    setIsEdit(false)
  }

  const resetSelection = () => {
    setSelection(initialSelection)
    setSearched(false)
    setShowConfiguration(false)
    setSelectedId(null)
    setIsEdit(false)
  }

  const onShowConfiguration = () => {
    setSearched(true)
    setShowConfiguration(true)
    setOpenSection('addCO')
    setIsEdit(false)
  }

  const toggleSection = (key) => setOpenSection((p) => (p === key ? '' : key))

  const cancelSectionEdit = () => setIsEdit(false)

  // ===== Sorting/Filtering/Pagination =====
  const sortToggle = (key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    })
  }
  const sortIndicator = (key) => (sort.key !== key ? '' : sort.dir === 'asc' ? ' ▲' : ' ▼')

  const filteredSorted = useMemo(() => {
    const q = normalize(search)
    let data = rows
    if (q) {
      data = rows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))
    }
    const { key, dir } = sort || {}
    const sorted = [...data].sort((a, b) =>
      normalize(a?.[key]).localeCompare(normalize(b?.[key]), undefined, { sensitivity: 'base' }),
    )
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [rows, search, sort])

  useEffect(() => setPage(1), [search, pageSize])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const pageRows = useMemo(() => filteredSorted.slice(startIdx, endIdx), [filteredSorted, startIdx, endIdx])

  // ===== Section handlers: Add CO =====
  const addCoRow = () =>
    setCoRows((p) => {
      const nextIdx = p.length + 1
      return [...p, { index: `CO${nextIdx}`, statement: '' }]
    })
  const removeCoRow = (idx) => setCoRows((p) => (p.length <= 1 ? p : p.filter((_, i) => i !== idx)))
  const updateCoRow = (idx, key) => (e) => {
    const value = e.target.value
    setCoRows((p) => p.map((r, i) => (i === idx ? { ...r, [key]: value } : r)))
  }
  const saveCo = () => {
    setCoSaved(coRows.map((r) => ({ ...r })))
    setIsEdit(false)
  }
  const resetCo = () => {
    setCoRows([{ index: 'CO1', statement: '' }])
    setCoSaved([])
    setIsEdit(false)
  }

  // ===== CO-PO mapping =====
  const addCoPoRow = () => setCoPoRows((p) => [...p, { co: `CO${p.length + 1}`, po: 'PO1', level: '' }])
  const removeCoPoRow = (idx) => setCoPoRows((p) => (p.length <= 1 ? p : p.filter((_, i) => i !== idx)))
  const updateCoPoRow = (idx, key) => (e) => {
    const value = e.target.value
    setCoPoRows((p) => p.map((r, i) => (i === idx ? { ...r, [key]: value } : r)))
  }
  const saveCoPo = () => {
    setCoPoSaved(coPoRows.map((r) => ({ ...r })))
    setIsEdit(false)
  }
  const resetCoPo = () => {
    setCoPoRows([{ co: 'CO1', po: 'PO1', level: '' }])
    setCoPoSaved([])
    setIsEdit(false)
  }

  // ===== CO-PSO mapping =====
  const addCoPsoRow = () => setCoPsoRows((p) => [...p, { co: `CO${p.length + 1}`, pso: 'PSO1', level: '' }])
  const removeCoPsoRow = (idx) => setCoPsoRows((p) => (p.length <= 1 ? p : p.filter((_, i) => i !== idx)))
  const updateCoPsoRow = (idx, key) => (e) => {
    const value = e.target.value
    setCoPsoRows((p) => p.map((r, i) => (i === idx ? { ...r, [key]: value } : r)))
  }
  const saveCoPso = () => {
    setCoPsoSaved(coPsoRows.map((r) => ({ ...r })))
    setIsEdit(false)
  }
  const resetCoPso = () => {
    setCoPsoRows([{ co: 'CO1', pso: 'PSO1', level: '' }])
    setCoPsoSaved([])
    setIsEdit(false)
  }

  // ===== Attainment weightage =====
  const updateWeightage = (key) => (e) => setWeightage((p) => ({ ...p, [key]: e.target.value }))
  const saveWeightage = () => {
    setWeightageSaved({ ...weightage })
    setIsEdit(false)
  }
  const resetWeightage = () => {
    setWeightage({ direct: '', indirect: '' })
    setWeightageSaved(null)
    setIsEdit(false)
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>COURSE OUTCOMES CONFIGURATION</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={() => setIsEdit(true)} title="Add New" />
              <ArpButton label="Edit" icon="edit" color="primary" onClick={() => setIsEdit(true)} disabled={!selectedId} title="Edit Selected" />
              <ArpButton label="View" icon="view" color="info" onClick={() => setIsEdit(false)} disabled={!selectedId} title="View Selected" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= ACADEMIC SELECTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Academic Selection</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSearch}>
              <CRow className="g-3">
                {/* Row 1: Academic Year */}
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={selection.academicYear} onChange={onSelectionChange('academicYear')}>
                    <option value="">Select</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 1: Semester */}
                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-end gap-2">
                  <CFormSelect value={selection.semester} onChange={onSelectionChange('semester')}>
                    <option value="">Select</option>
                    {semesters.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </CFormSelect>

                  {/* Search near dropdown (as per ARP UX) */}
                  
                </CCol>

                {/* Row 2: Programme Code */}
                <CCol md={3}>
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={selection.programmeCode} onChange={onSelectionChange('programmeCode')}>
                    <option value="">Select</option>
                    {programmeCodes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 2: Programme */}
                <CCol md={3}>
                  <CFormLabel>Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={selection.programme} readOnly />
                </CCol>

                {/* Final row: Search + Reset aligned right */}
                <CCol md={6} />
                <CCol md={6} className="d-flex justify-content-end gap-2">
                  
                  
                  <ArpButton
                    label="Search"
                    icon="search"
                    color="primary"
                    type="submit"
                    title="Search"
                  />
                  <ArpButton
                    label="Reset"
                    icon="reset"
                    color="warning"
                    type="button"
                    onClick={resetSelection}
                    title="Reset"
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= STATUS TABLE CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Status of CO Configurations</strong>

            <div className="d-flex align-items-center gap-2 flex-nowrap">
              <CFormInput
                size="sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                title="Search"
              />

              <CFormSelect
                size="sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                title="Rows per page"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </CFormSelect>

              <ArpButton
                label="CO Configuration"
                icon="view"
                color="info"
                type="button"
                onClick={onShowConfiguration}
                disabled={!selectedId}
                title="Open CO Configuration"
                className="text-nowrap"
              />

              <div className="d-flex gap-2 align-items-center flex-nowrap">
                <ArpIconButton icon="view" color="purple" title="View" onClick={() => setIsEdit(false)} disabled={!selectedId} />
                <ArpIconButton icon="edit" color="info" title="Edit" onClick={() => setIsEdit(true)} disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" title="Delete" disabled={!selectedId} />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('courseCode')}>
                    Course Code{sortIndicator('courseCode')}
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('courseName')}>
                    Course Name{sortIndicator('courseName')}
                  </CTableHeaderCell>
                  <CTableHeaderCell>Course Outcomes</CTableHeaderCell>
                  <CTableHeaderCell>CO – PO Mapping</CTableHeaderCell>
                  <CTableHeaderCell>CO Attainment Weightage</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {pageRows.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={6} className="text-center py-4">
                      No records found.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <CFormCheck
                          type="radio"
                          name="coRow"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.courseCode}</CTableDataCell>
                      <CTableDataCell>{r.courseName}</CTableDataCell>
                      <CTableDataCell>{r.courseOutcomes}</CTableDataCell>
                      <CTableDataCell>{r.coPoMapping}</CTableDataCell>
                      <CTableDataCell>{r.attainmentWeightage}</CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>

            <div className="d-flex justify-content-end mt-2">
              <CPagination size="sm" className="mb-0">
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage(1)}>
                  «
                </CPaginationItem>
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ‹
                </CPaginationItem>

                {Array.from({ length: totalPages })
                  .slice(Math.max(0, safePage - 3), Math.min(totalPages, safePage + 2))
                  .map((_, i) => {
                    const pageNumber = Math.max(1, safePage - 2) + i
                    if (pageNumber > totalPages) return null
                    return (
                      <CPaginationItem
                        key={pageNumber}
                        active={pageNumber === safePage}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </CPaginationItem>
                    )
                  })}

                <CPaginationItem
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </CPaginationItem>
                <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>
                  »
                </CPaginationItem>
              </CPagination>
            </div>
          </CCardBody>
        </CCard>

        {/* ================= CONFIGURATION SECTION (Below Status Table) ================= */}
        {showConfiguration && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>CO Configuration</strong>
            </CCardHeader>
            <CCardBody>
              <div className="d-grid gap-2">
                {/* ===== Add Course Outcomes ===== */}
                <div>
                  <button
                    type="button"
                    className={`btn w-100 text-start ${openSection === 'addCO' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => toggleSection('addCO')}
                  >
                    Add Course Outcomes
                  </button>

                  {openSection === 'addCO' && (
                    <div className="border rounded-bottom p-3">
                      <CRow className="g-3">
                        <CCol xs={12} className="d-flex justify-content-between align-items-center">
                          <strong>Add Course Outcomes</strong>
                          <div className="d-flex gap-2">
                            <ArpIconButton icon="edit" color="info" title="Edit" onClick={() => setIsEdit(true)} />
                            <ArpIconButton icon="delete" color="danger" title="Delete" onClick={resetCo} disabled={!isEdit} />
                          </div>
                        </CCol>

                        <CCol xs={12} className="small text-medium-emphasis">
                          On Successful Completion of this course, Students will be able to:
                        </CCol>

                        <CCol xs={12}>
                          <CTable hover responsive align="middle">
                            <CTableHead color="light">
                              <CTableRow>
                                <CTableHeaderCell style={{ width: 110 }}>Index</CTableHeaderCell>
                                <CTableHeaderCell>CO Statement</CTableHeaderCell>
                                <CTableHeaderCell style={{ width: 120 }}>Action</CTableHeaderCell>
                              </CTableRow>
                            </CTableHead>
                            <CTableBody>
                              {coRows.map((r, idx) => (
                                <CTableRow key={idx}>
                                  <CTableDataCell>{r.index}</CTableDataCell>
                                  <CTableDataCell>
                                    <CFormTextarea
                                      rows={2}
                                      value={r.statement}
                                      onChange={updateCoRow(idx, 'statement')}
                                      disabled={!isEdit}
                                    />
                                  </CTableDataCell>
                                  <CTableDataCell className="text-center">
                                    <div className="d-flex justify-content-center gap-2">
                                      <button type="button" className="btn btn-success btn-sm" onClick={addCoRow} disabled={!isEdit} title="Add Row">
                                        +
                                      </button>
                                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCoRow(idx)} disabled={!isEdit} title="Remove Row">
                                        -
                                      </button>
                                    </div>
                                  </CTableDataCell>
                                </CTableRow>
                              ))}
                            </CTableBody>
                          </CTable>
                        </CCol>

                        {coSaved.length > 0 && (
                          <CCol xs={12}>
                            <strong>Saved Course Outcomes</strong>
                            <CTable hover responsive align="middle" className="mt-2">
                              <CTableHead color="light">
                                <CTableRow>
                                  <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                                  <CTableHeaderCell style={{ width: 110 }}>Index</CTableHeaderCell>
                                  <CTableHeaderCell>CO Statement</CTableHeaderCell>
                                </CTableRow>
                              </CTableHead>
                              <CTableBody>
                                {coSaved.map((x, i) => (
                                  <CTableRow key={i}>
                                    <CTableDataCell className="text-center">
                                      <CFormCheck type="radio" name="coSaved" />
                                    </CTableDataCell>
                                    <CTableDataCell>{x.index}</CTableDataCell>
                                    <CTableDataCell>{x.statement}</CTableDataCell>
                                  </CTableRow>
                                ))}
                              </CTableBody>
                            </CTable>
                          </CCol>
                        )}

                        <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                          <ArpButton label="Save" icon="save" color="success" type="button" onClick={saveCo} disabled={!isEdit} title="Save" />
                          <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={cancelSectionEdit} title="Cancel" />
                          <ArpButton label="Reset" icon="reset" color="warning" type="button" onClick={resetCo} title="Reset" />
                        </CCol>
                      </CRow>
                    </div>
                  )}
                </div>

                {/* ===== CO-PO Mapping ===== */}
                <div>
                  <button
                    type="button"
                    className={`btn w-100 text-start ${openSection === 'copomapping' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => toggleSection('copomapping')}
                  >
                    CO – PO Mapping
                  </button>

                  {openSection === 'copomapping' && (
                    <div className="border rounded-bottom p-3">
                      <CRow className="g-3">
                        <CCol xs={12} className="d-flex justify-content-between align-items-center">
                          <strong>CO – PO Mapping</strong>
                          <div className="d-flex gap-2">
                            <ArpIconButton icon="edit" color="info" title="Edit" onClick={() => setIsEdit(true)} />
                            <ArpIconButton icon="delete" color="danger" title="Delete" onClick={resetCoPo} disabled={!isEdit} />
                          </div>
                        </CCol>

                        <CCol xs={12}>
                          <CTable hover responsive align="middle">
                            <CTableHead color="light">
                              <CTableRow>
                                <CTableHeaderCell style={{ width: 110 }}>CO</CTableHeaderCell>
                                <CTableHeaderCell style={{ width: 120 }}>PO</CTableHeaderCell>
                                <CTableHeaderCell style={{ width: 180 }}>Level</CTableHeaderCell>
                                <CTableHeaderCell style={{ width: 120 }}>Action</CTableHeaderCell>
                              </CTableRow>
                            </CTableHead>
                            <CTableBody>
                              {coPoRows.map((r, idx) => (
                                <CTableRow key={idx}>
                                  <CTableDataCell>
                                    <CFormInput value={r.co} onChange={updateCoPoRow(idx, 'co')} disabled={!isEdit} />
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CFormInput value={r.po} onChange={updateCoPoRow(idx, 'po')} disabled={!isEdit} />
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CFormInput value={r.level} onChange={updateCoPoRow(idx, 'level')} disabled={!isEdit} />
                                  </CTableDataCell>
                                  <CTableDataCell className="text-center">
                                    <div className="d-flex justify-content-center gap-2">
                                      <button type="button" className="btn btn-success btn-sm" onClick={addCoPoRow} disabled={!isEdit} title="Add Row">
                                        +
                                      </button>
                                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCoPoRow(idx)} disabled={!isEdit} title="Remove Row">
                                        -
                                      </button>
                                    </div>
                                  </CTableDataCell>
                                </CTableRow>
                              ))}
                            </CTableBody>
                          </CTable>
                        </CCol>

                        {coPoSaved.length > 0 && (
                          <CCol xs={12}>
                            <strong>Saved CO – PO Mapping</strong>
                            <CTable hover responsive align="middle" className="mt-2">
                              <CTableHead color="light">
                                <CTableRow>
                                  <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                                  <CTableHeaderCell style={{ width: 110 }}>CO</CTableHeaderCell>
                                  <CTableHeaderCell style={{ width: 120 }}>PO</CTableHeaderCell>
                                  <CTableHeaderCell style={{ width: 180 }}>Level</CTableHeaderCell>
                                </CTableRow>
                              </CTableHead>
                              <CTableBody>
                                {coPoSaved.map((x, i) => (
                                  <CTableRow key={i}>
                                    <CTableDataCell className="text-center">
                                      <CFormCheck type="radio" name="coposaved" />
                                    </CTableDataCell>
                                    <CTableDataCell>{x.co}</CTableDataCell>
                                    <CTableDataCell>{x.po}</CTableDataCell>
                                    <CTableDataCell>{x.level}</CTableDataCell>
                                  </CTableRow>
                                ))}
                              </CTableBody>
                            </CTable>
                          </CCol>
                        )}

                        <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                          <ArpButton label="Save" icon="save" color="success" type="button" onClick={saveCoPo} disabled={!isEdit} title="Save" />
                          <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={cancelSectionEdit} title="Cancel" />
                          <ArpButton label="Reset" icon="reset" color="warning" type="button" onClick={resetCoPo} title="Reset" />
                        </CCol>
                      </CRow>
                    </div>
                  )}
                </div>

                {/* ===== CO-PSO Mapping ===== */}
                <div>
                  <button
                    type="button"
                    className={`btn w-100 text-start ${openSection === 'copsomapping' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => toggleSection('copsomapping')}
                  >
                    CO – PSO Mapping
                  </button>

                  {openSection === 'copsomapping' && (
                    <div className="border rounded-bottom p-3">
                      <CRow className="g-3">
                        <CCol xs={12} className="d-flex justify-content-between align-items-center">
                          <strong>CO – PSO Mapping</strong>
                          <div className="d-flex gap-2">
                            <ArpIconButton icon="edit" color="info" title="Edit" onClick={() => setIsEdit(true)} />
                            <ArpIconButton icon="delete" color="danger" title="Delete" onClick={resetCoPso} disabled={!isEdit} />
                          </div>
                        </CCol>

                        <CCol xs={12}>
                          <CTable hover responsive align="middle">
                            <CTableHead color="light">
                              <CTableRow>
                                <CTableHeaderCell style={{ width: 110 }}>CO</CTableHeaderCell>
                                <CTableHeaderCell style={{ width: 120 }}>PSO</CTableHeaderCell>
                                <CTableHeaderCell style={{ width: 180 }}>Level</CTableHeaderCell>
                                <CTableHeaderCell style={{ width: 120 }}>Action</CTableHeaderCell>
                              </CTableRow>
                            </CTableHead>
                            <CTableBody>
                              {coPsoRows.map((r, idx) => (
                                <CTableRow key={idx}>
                                  <CTableDataCell>
                                    <CFormInput value={r.co} onChange={updateCoPsoRow(idx, 'co')} disabled={!isEdit} />
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CFormInput value={r.pso} onChange={updateCoPsoRow(idx, 'pso')} disabled={!isEdit} />
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <CFormInput value={r.level} onChange={updateCoPsoRow(idx, 'level')} disabled={!isEdit} />
                                  </CTableDataCell>
                                  <CTableDataCell className="text-center">
                                    <div className="d-flex justify-content-center gap-2">
                                      <button type="button" className="btn btn-success btn-sm" onClick={addCoPsoRow} disabled={!isEdit} title="Add Row">
                                        +
                                      </button>
                                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeCoPsoRow(idx)} disabled={!isEdit} title="Remove Row">
                                        -
                                      </button>
                                    </div>
                                  </CTableDataCell>
                                </CTableRow>
                              ))}
                            </CTableBody>
                          </CTable>
                        </CCol>

                        {coPsoSaved.length > 0 && (
                          <CCol xs={12}>
                            <strong>Saved CO – PSO Mapping</strong>
                            <CTable hover responsive align="middle" className="mt-2">
                              <CTableHead color="light">
                                <CTableRow>
                                  <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                                  <CTableHeaderCell style={{ width: 110 }}>CO</CTableHeaderCell>
                                  <CTableHeaderCell style={{ width: 120 }}>PSO</CTableHeaderCell>
                                  <CTableHeaderCell style={{ width: 180 }}>Level</CTableHeaderCell>
                                </CTableRow>
                              </CTableHead>
                              <CTableBody>
                                {coPsoSaved.map((x, i) => (
                                  <CTableRow key={i}>
                                    <CTableDataCell className="text-center">
                                      <CFormCheck type="radio" name="copsosaved" />
                                    </CTableDataCell>
                                    <CTableDataCell>{x.co}</CTableDataCell>
                                    <CTableDataCell>{x.pso}</CTableDataCell>
                                    <CTableDataCell>{x.level}</CTableDataCell>
                                  </CTableRow>
                                ))}
                              </CTableBody>
                            </CTable>
                          </CCol>
                        )}

                        <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                          <ArpButton label="Save" icon="save" color="success" type="button" onClick={saveCoPso} disabled={!isEdit} title="Save" />
                          <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={cancelSectionEdit} title="Cancel" />
                          <ArpButton label="Reset" icon="reset" color="warning" type="button" onClick={resetCoPso} title="Reset" />
                        </CCol>
                      </CRow>
                    </div>
                  )}
                </div>

                {/* ===== Attainment Weightage ===== */}
                <div>
                  <button
                    type="button"
                    className={`btn w-100 text-start ${openSection === 'attainment' ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => toggleSection('attainment')}
                  >
                    Attainment Weightage
                  </button>

                  {openSection === 'attainment' && (
                    <div className="border rounded-bottom p-3">
                      <CRow className="g-3">
                        <CCol xs={12} className="d-flex justify-content-between align-items-center">
                          <strong>CO Attainment Weightage</strong>
                          <div className="d-flex gap-2">
                            <ArpIconButton icon="edit" color="info" title="Edit" onClick={() => setIsEdit(true)} />
                            <ArpIconButton icon="delete" color="danger" title="Delete" onClick={resetWeightage} disabled={!isEdit} />
                          </div>
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Direct (%)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={weightage.direct} onChange={updateWeightage('direct')} disabled={!isEdit} />
                        </CCol>

                        <CCol md={3}>
                          <CFormLabel>Indirect (%)</CFormLabel>
                        </CCol>
                        <CCol md={3}>
                          <CFormInput value={weightage.indirect} onChange={updateWeightage('indirect')} disabled={!isEdit} />
                        </CCol>

                        {weightageSaved && (
                          <CCol xs={12}>
                            <strong>Saved Weightage</strong>
                            <CTable hover responsive align="middle" className="mt-2">
                              <CTableHead color="light">
                                <CTableRow>
                                  <CTableHeaderCell style={{ width: 120 }}>Direct (%)</CTableHeaderCell>
                                  <CTableHeaderCell style={{ width: 120 }}>Indirect (%)</CTableHeaderCell>
                                </CTableRow>
                              </CTableHead>
                              <CTableBody>
                                <CTableRow>
                                  <CTableDataCell>{weightageSaved.direct}</CTableDataCell>
                                  <CTableDataCell>{weightageSaved.indirect}</CTableDataCell>
                                </CTableRow>
                              </CTableBody>
                            </CTable>
                          </CCol>
                        )}

                        <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                          <ArpButton label="Save" icon="save" color="success" type="button" onClick={saveWeightage} disabled={!isEdit} title="Save" />
                          <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={cancelSectionEdit} title="Cancel" />
                          <ArpButton label="Reset" icon="reset" color="warning" type="button" onClick={resetWeightage} title="Reset" />
                        </CCol>
                      </CRow>
                    </div>
                  )}
                </div>
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default CourseOutcomesConfiguration
