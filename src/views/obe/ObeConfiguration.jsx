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
 * OBE Configuration (Single Page)
 * - Strict 3-card ARP structure (Header Action Card, Form Card, Table Card)
 * - Uses ArpButton / ArpIconButton for actions
 * - CoreUI table (no plain <table>)
 * - Search + Page Size + Circle action icons in ONE row (table header)
 *
 * Notes:
 * - Demo in-memory state only. Hook API calls later in onSave... handlers.
 * - No inline CSS (only CoreUI utility classes).
 */

const initialAcademic = {
  academicYear: '',
}

const initialStatusRows = [
  {
    id: 1,
    regulation: '23 – 2AA',
    programme: 'B.Com',
    visionMission: 'Pending',
    peo: 'Pending',
    po: 'Pending',
    pso: 'Pending',
    taxonomy: 'Pending',
    correlation: 'Pending',
    mapAssessment: 'Pending',
  },
  {
    id: 2,
    regulation: '23 – 2AC',
    programme: 'B.Com (CA)',
    visionMission: 'Pending',
    peo: 'Pending',
    po: 'Pending',
    pso: 'Pending',
    taxonomy: 'Pending',
    correlation: 'Pending',
    mapAssessment: 'Pending',
  },
]

const normalize = (v) =>
  String(v ?? '')
    .toLowerCase()
    .trim()

const ObeConfiguration = () => {
  // ========= Form enable/disable =========
  const [isEdit, setIsEdit] = useState(false)

  // ========= Phase 1: Academic selection =========
  const [academic, setAcademic] = useState(initialAcademic)
  const [searched, setSearched] = useState(false)
  const [showConfiguration, setShowConfiguration] = useState(false)

  // ========= Table UX =========
  const [rows] = useState(initialStatusRows)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1) // 1-based
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState({ key: 'regulation', dir: 'asc' })

  // ========= Accordion =========
  const [openSection, setOpenSection] = useState('visionMission') // default open

  // ========= Section states (demo only) =========
  // Vision/Mission
  const [vmRows, setVmRows] = useState([{ vision: '', mission: '' }])
  const [vmSaved, setVmSaved] = useState([]) // array of {vision, mission}

  // PEO/PO/PSO
  const [peoRows, setPeoRows] = useState([{ text: '' }])
  const [peoSaved, setPeoSaved] = useState([])

  const [poRows, setPoRows] = useState([{ text: '' }])
  const [poSaved, setPoSaved] = useState([])

  const [psoRows, setPsoRows] = useState([{ text: '' }])
  const [psoSaved, setPsoSaved] = useState([])

  // Taxonomy
  const [taxonomyDomains, setTaxonomyDomains] = useState({
    cognitive: false,
    psychomotor: false,
    affective: false,
  })
  const [taxonomyValues, setTaxonomyValues] = useState({
    remembering: '',
    understanding: '',
    applying: '',
    analyzing: '',
    evaluating: '',
    creating: '',
    perception: '',
    set: '',
    guidedResponse: '',
    mechanism: '',
    completeOverResponse: '',
    adaption: '',
    organization: '',
    receiving: '',
    responding: '',
    valuing: '',
    organizing: '',
    internationalizing: '',
  })

  // Correlation
  const [correlationRows, setCorrelationRows] = useState([{ parameter: '', index: '', value: '' }])
  const [correlationLocked, setCorrelationLocked] = useState(false)

  // Map & Assessment
  const [mapRows, setMapRows] = useState([
    { id: 1, label: 'PEO – PO Mapping', checked: false, remarks: '' },
    { id: 2, label: 'CO – PO Mapping', checked: false, remarks: '' },
    { id: 3, label: 'CO – PSO Mapping', checked: false, remarks: '' },
    { id: 4, label: 'Direct Assessment Method', checked: false, remarks: '' },
    { id: 5, label: 'Indirect Assessment Method', checked: false, remarks: '' },
  ])
  const [mapLocked, setMapLocked] = useState(false)

  // ========= Years dropdown =========
  const years = useMemo(() => {
    const arr = []
    // Keep it simple: offer the same as HTML, but you can expand later
    arr.push('2025 – 26', '2026 – 27')
    return arr
  }, [])

  // ========= Sorting / filtering =========
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

    if (q) {
      data = rows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))
    }

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) =>
      normalize(a?.[key]).localeCompare(normalize(b?.[key]), undefined, { sensitivity: 'base' }),
    )

    return dir === 'asc' ? sorted : sorted.reverse()
  }, [rows, search, sort])

  // reset to page 1 when search/pageSize changes
  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)

  const pageRows = useMemo(() => filteredSorted.slice(startIdx, endIdx), [filteredSorted, startIdx, endIdx])

  // ========= Handlers =========
  const onAcademicChange = (key) => (e) => setAcademic((p) => ({ ...p, [key]: e.target.value }))

  const onSearch = (e) => {
    e.preventDefault()
    setSearched(true)
    setShowConfiguration(false)
    setSelectedId(null)
    setIsEdit(false)
  }

  const onShowConfiguration = () => {
    // Show configuration section (rendered below Status card)
    setSearched(true)
    setShowConfiguration(false)
    setShowConfiguration(true)
    setOpenSection('visionMission')
    // Enable editing only when user clicks Edit icons inside accordion
    setIsEdit(false)
  }


  const onAddNew = () => {
    // Enable edit for the configuration forms
    setIsEdit(true)
  }

  const onView = () => {
    // In a real app, fetch selected row configuration and populate states
    setIsEdit(false)
  }

  const onEdit = () => {
    if (!selectedId) return
    setIsEdit(true)
  }

  const onCancel = () => {
    setIsEdit(false)
  }

  // ========= Accordion =========
  const toggleSection = (key) => {
    setOpenSection((prev) => (prev === key ? '' : key))
  }

  // ========= Vision/Mission =========
  const updateVmRow = (idx, key) => (e) => {
    const value = e.target.value
    setVmRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)))
  }

  const addVmRow = () => setVmRows((p) => [...p, { vision: '', mission: '' }])
  const removeVmRow = (idx) => setVmRows((p) => (p.length <= 1 ? p : p.filter((_, i) => i !== idx)))

  const saveVisionMission = () => {
    setVmSaved(vmRows.map((r) => ({ ...r })))
    setIsEdit(false)
  }

  // ========= PEO/PO/PSO generic =========
  const addTextRow = (setter) => setter((p) => [...p, { text: '' }])
  const removeTextRow = (setter, idx) =>
    setter((p) => (p.length <= 1 ? p : p.filter((_, i) => i !== idx)))

  const updateTextRow = (setter, idx) => (e) => {
    const value = e.target.value
    setter((p) => p.map((r, i) => (i === idx ? { ...r, text: value } : r)))
  }

  const saveTextRows = (rowsState, saver) => {
    saver(rowsState.map((r) => ({ ...r })))
    setIsEdit(false)
  }

  // ========= Taxonomy =========
  const onTaxDomain = (key) => (e) => {
    const checked = e.target.checked
    setTaxonomyDomains((p) => ({ ...p, [key]: checked }))
  }

  const onTaxValue = (key) => (e) => setTaxonomyValues((p) => ({ ...p, [key]: e.target.value }))

  const taxonomyEnabled = (domainKey) => taxonomyDomains?.[domainKey] && isEdit

  const saveTaxonomy = () => {
    setIsEdit(false)
  }

  // ========= Correlation =========
  const updateCorrelation = (idx, key) => (e) => {
    const value = e.target.value
    setCorrelationRows((p) => p.map((r, i) => (i === idx ? { ...r, [key]: value } : r)))
  }

  const addCorrelationRow = () =>
    setCorrelationRows((p) => [...p, { parameter: '', index: '', value: '' }])

  const removeCorrelationRow = (idx) =>
    setCorrelationRows((p) => (p.length <= 1 ? p : p.filter((_, i) => i !== idx)))

  const saveCorrelation = () => {
    setCorrelationLocked(true)
    setIsEdit(false)
  }

  const editCorrelation = () => {
    setCorrelationLocked(false)
    setIsEdit(true)
  }

  // ========= Map & Assessment =========
  const toggleMapChecked = (id) => (e) => {
    const checked = e.target.checked
    setMapRows((p) => p.map((r) => (r.id === id ? { ...r, checked } : r)))
  }

  const updateMapRemarks = (id) => (e) => {
    const remarks = e.target.value
    setMapRows((p) => p.map((r) => (r.id === id ? { ...r, remarks } : r)))
  }

  const saveMap = () => {
    setMapLocked(true)
    setIsEdit(false)
  }

  const editMap = () => {
    setMapLocked(false)
    setIsEdit(true)
  }

  const selectedRow = useMemo(() => rows.find((r) => r.id === selectedId) || null, [rows, selectedId])

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>OBE CONFIGURATION</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton
                label="Edit"
                icon="edit"
                color="primary"
                onClick={onEdit}
                disabled={!selectedId}
                title="Edit Selected"
              />
              <ArpButton
                label="View"
                icon="view"
                color="info"
                onClick={onView}
                disabled={!selectedId}
                title="View Selected"
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>OBE Configuration</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSearch}>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={academic.academicYear} onChange={onAcademicChange('academicYear')}>
                    <option value="">Select</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3} />
                <CCol md={3} className="d-flex justify-content-end">
                  <ArpButton label="Search" icon="search" color="primary" type="submit" title="Search" />
                </CCol>
</CRow>
            </CForm>

            {/* Configuration accordion shown only after Search */}
            

          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD ================= */}
        <CCard className="mb-3">
          {/* ✅ All in ONE ROW: Search + Page size + action icons */}
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Status of OBE Configuration</strong>

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
                label="OBE Configuration"
                icon="view"
                color="info"
                type="button"
                onClick={onShowConfiguration}
                disabled={!selectedId}
                title="Open OBE Configuration"
                className="text-nowrap"
              />

              <div className="d-flex gap-2 align-items-center flex-nowrap">
                <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId} />
                <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" title="Delete" disabled={!selectedId} />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('regulation')}>
                    Regulation{sortIndicator('regulation')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('programme')}>
                    Programme{sortIndicator('programme')}
                  </CTableHeaderCell>

                  <CTableHeaderCell>Vision - Mission</CTableHeaderCell>
                  <CTableHeaderCell>PEO</CTableHeaderCell>
                  <CTableHeaderCell>PO</CTableHeaderCell>
                  <CTableHeaderCell>PSO</CTableHeaderCell>
                  <CTableHeaderCell>Taxonomy</CTableHeaderCell>
                  <CTableHeaderCell>Correlation</CTableHeaderCell>
                  <CTableHeaderCell>Map &amp; Assessment</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {pageRows.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center py-4">
                      No records found.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <CFormCheck
                          type="radio"
                          name="obeRow"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.regulation}</CTableDataCell>
                      <CTableDataCell>{r.programme}</CTableDataCell>
                      <CTableDataCell>{r.visionMission}</CTableDataCell>
                      <CTableDataCell>{r.peo}</CTableDataCell>
                      <CTableDataCell>{r.po}</CTableDataCell>
                      <CTableDataCell>{r.pso}</CTableDataCell>
                      <CTableDataCell>{r.taxonomy}</CTableDataCell>
                      <CTableDataCell>{r.correlation}</CTableDataCell>
                      <CTableDataCell>{r.mapAssessment}</CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>

            {/* Pagination (CoursesConfiguration-style window) */}
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
              <>
                <div className="mt-3 small text-medium-emphasis">
                  {selectedRow
                    ? `Selected: ${selectedRow.regulation} / ${selectedRow.programme}`
                    : 'Select a row in the list below to work on configuration.'}
                </div>

                <div className="mt-3">
                  {/* ===== Accordion (single-open) ===== */}
                  <div className="d-grid gap-2">
                    {/* Vision & Mission */}
                    <div>
                      <button
                        type="button"
                        className={`btn w-100 text-start ${openSection === 'visionMission' ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => toggleSection('visionMission')}
                      >
                        Vision &amp; Mission Entry
                      </button>

                      {openSection === 'visionMission' && (
                        <div className="border rounded-bottom p-3">
                          <CRow className="g-3">
                            <CCol xs={12}>
                              <strong>Vision and Mission Entry</strong>
                            </CCol>

                            <CCol xs={12}>
                              <CTable hover responsive align="middle">
                                <CTableHead color="light">
                                  <CTableRow>
                                    <CTableHeaderCell>Vision Statement</CTableHeaderCell>
                                    <CTableHeaderCell>Mission Statement</CTableHeaderCell>
                                    <CTableHeaderCell style={{ width: 120 }}>Action</CTableHeaderCell>
                                  </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                  {vmRows.map((r, idx) => (
                                    <CTableRow key={idx}>
                                      <CTableDataCell>
                                        <CFormTextarea
                                          rows={2}
                                          value={r.vision}
                                          onChange={updateVmRow(idx, 'vision')}
                                          disabled={!isEdit}
                                        />
                                      </CTableDataCell>
                                      <CTableDataCell>
                                        <CFormTextarea
                                          rows={2}
                                          value={r.mission}
                                          onChange={updateVmRow(idx, 'mission')}
                                          disabled={!isEdit}
                                        />
                                      </CTableDataCell>
                                      <CTableDataCell className="text-center">
                                        <div className="d-flex justify-content-center gap-2">
                                          <button
                                            type="button"
                                            className="btn btn-success btn-sm"
                                            onClick={addVmRow}
                                            disabled={!isEdit}
                                            title="Add Row"
                                          >
                                            +
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={() => removeVmRow(idx)}
                                            disabled={!isEdit}
                                            title="Remove Row"
                                          >
                                            -
                                          </button>
                                        </div>
                                      </CTableDataCell>
                                    </CTableRow>
                                  ))}
                                </CTableBody>
                              </CTable>
                            </CCol>

                            {/* Saved preview table */}
                            {vmSaved.length > 0 && (
                              <CCol xs={12} className="mt-2">
                                <div className="d-flex justify-content-between align-items-center">
                                  <strong>Vision and Mission Statement</strong>
                                  <div className="d-flex gap-2">
                                    <ArpIconButton
                                      icon="edit"
                                      color="info"
                                      title="Edit"
                                      onClick={() => setIsEdit(true)}
                                    />
                                    <ArpIconButton
                                      icon="delete"
                                      color="danger"
                                      title="Delete"
                                      onClick={() => setVmSaved([])}
                                      disabled={!isEdit}
                                    />
                                  </div>
                                </div>

                                <CTable hover responsive align="middle" className="mt-2">
                                  <CTableHead color="light">
                                    <CTableRow>
                                      <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                                      <CTableHeaderCell style={{ width: 90 }}>Index</CTableHeaderCell>
                                      <CTableHeaderCell>Vision Statement</CTableHeaderCell>
                                      <CTableHeaderCell style={{ width: 90 }}>Index</CTableHeaderCell>
                                      <CTableHeaderCell>Mission Statement</CTableHeaderCell>
                                    </CTableRow>
                                  </CTableHead>
                                  <CTableBody>
                                    {vmSaved.map((x, i) => (
                                      <CTableRow key={i}>
                                        <CTableDataCell className="text-center">
                                          <CFormCheck type="radio" name="vmSaved" />
                                        </CTableDataCell>
                                        <CTableDataCell>{`V${i + 1}`}</CTableDataCell>
                                        <CTableDataCell>{x.vision}</CTableDataCell>
                                        <CTableDataCell>{`M${i + 1}`}</CTableDataCell>
                                        <CTableDataCell>{x.mission}</CTableDataCell>
                                      </CTableRow>
                                    ))}
                                  </CTableBody>
                                </CTable>
                              </CCol>
                            )}
                          </CRow>
                        </div>
                      )}
                    </div>

                    {/* PEO */}
                    <div>
                      <button
                        type="button"
                        className={`btn w-100 text-start ${openSection === 'peo' ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => toggleSection('peo')}
                      >
                        Programme Educational Objectives (PEOs)
                      </button>

                      {openSection === 'peo' && (
                        <div className="border rounded-bottom p-3">
                          <CRow className="g-3">
                            <CCol xs={12}>
                              <strong>Programme Educational Objectives (PEOs)</strong>
                            </CCol>

                            <CCol xs={12}>
                              <CTable hover responsive align="middle">
                                <CTableHead color="light">
                                  <CTableRow>
                                    <CTableHeaderCell>PEO Statement</CTableHeaderCell>
                                    <CTableHeaderCell style={{ width: 120 }}>Action</CTableHeaderCell>
                                  </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                  {peoRows.map((r, idx) => (
                                    <CTableRow key={idx}>
                                      <CTableDataCell>
                                        <CFormTextarea
                                          rows={2}
                                          value={r.text}
                                          onChange={updateTextRow(setPeoRows, idx)}
                                          disabled={!isEdit}
                                        />
                                      </CTableDataCell>
                                      <CTableDataCell className="text-center">
                                        <div className="d-flex justify-content-center gap-2">
                                          <button
                                            type="button"
                                            className="btn btn-success btn-sm"
                                            onClick={() => addTextRow(setPeoRows)}
                                            disabled={!isEdit}
                                            title="Add Row"
                                          >
                                            +
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={() => removeTextRow(setPeoRows, idx)}
                                            disabled={!isEdit}
                                            title="Remove Row"
                                          >
                                            -
                                          </button>
                                        </div>
                                      </CTableDataCell>
                                    </CTableRow>
                                  ))}
                                </CTableBody>
                              </CTable>
                            </CCol>

                            {peoSaved.length > 0 && (
                              <CCol xs={12}>
                                <div className="d-flex justify-content-between align-items-center">
                                  <strong>Programme Educational Objectives (PEO)</strong>
                                  <div className="d-flex gap-2">
                                    <ArpIconButton
                                      icon="edit"
                                      color="info"
                                      title="Edit"
                                      onClick={() => setIsEdit(true)}
                                    />
                                    <ArpIconButton
                                      icon="delete"
                                      color="danger"
                                      title="Delete"
                                      onClick={() => setPeoSaved([])}
                                      disabled={!isEdit}
                                    />
                                  </div>
                                </div>

                                <CTable hover responsive align="middle" className="mt-2">
                                  <CTableHead color="light">
                                    <CTableRow>
                                      <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                                      <CTableHeaderCell style={{ width: 110 }}>Index</CTableHeaderCell>
                                      <CTableHeaderCell>PEO Statement</CTableHeaderCell>
                                    </CTableRow>
                                  </CTableHead>
                                  <CTableBody>
                                    {peoSaved.map((x, i) => (
                                      <CTableRow key={i}>
                                        <CTableDataCell className="text-center">
                                          <CFormCheck type="radio" name="peoSaved" />
                                        </CTableDataCell>
                                        <CTableDataCell>{`PEO${i + 1}`}</CTableDataCell>
                                        <CTableDataCell>{x.text}</CTableDataCell>
                                      </CTableRow>
                                    ))}
                                  </CTableBody>
                                </CTable>
                              </CCol>
                            )}
                          </CRow>
                        </div>
                      )}
                    </div>

                    {/* PO */}
                    <div>
                      <button
                        type="button"
                        className={`btn w-100 text-start ${openSection === 'po' ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => toggleSection('po')}
                      >
                        Programme Outcomes (POs)
                      </button>

                      {openSection === 'po' && (
                        <div className="border rounded-bottom p-3">
                          <CRow className="g-3">
                            <CCol xs={12}>
                              <strong>Programme Outcomes (POs)</strong>
                            </CCol>

                            <CCol xs={12}>
                              <CTable hover responsive align="middle">
                                <CTableHead color="light">
                                  <CTableRow>
                                    <CTableHeaderCell>PO Statement</CTableHeaderCell>
                                    <CTableHeaderCell style={{ width: 120 }}>Action</CTableHeaderCell>
                                  </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                  {poRows.map((r, idx) => (
                                    <CTableRow key={idx}>
                                      <CTableDataCell>
                                        <CFormTextarea
                                          rows={2}
                                          value={r.text}
                                          onChange={updateTextRow(setPoRows, idx)}
                                          disabled={!isEdit}
                                        />
                                      </CTableDataCell>
                                      <CTableDataCell className="text-center">
                                        <div className="d-flex justify-content-center gap-2">
                                          <button
                                            type="button"
                                            className="btn btn-success btn-sm"
                                            onClick={() => addTextRow(setPoRows)}
                                            disabled={!isEdit}
                                            title="Add Row"
                                          >
                                            +
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={() => removeTextRow(setPoRows, idx)}
                                            disabled={!isEdit}
                                            title="Remove Row"
                                          >
                                            -
                                          </button>
                                        </div>
                                      </CTableDataCell>
                                    </CTableRow>
                                  ))}
                                </CTableBody>
                              </CTable>
                            </CCol>

                            {poSaved.length > 0 && (
                              <CCol xs={12}>
                                <div className="d-flex justify-content-between align-items-center">
                                  <strong>Programme Outcomes (PO)</strong>
                                  <div className="d-flex gap-2">
                                    <ArpIconButton
                                      icon="edit"
                                      color="info"
                                      title="Edit"
                                      onClick={() => setIsEdit(true)}
                                    />
                                    <ArpIconButton
                                      icon="delete"
                                      color="danger"
                                      title="Delete"
                                      onClick={() => setPoSaved([])}
                                      disabled={!isEdit}
                                    />
                                  </div>
                                </div>

                                <CTable hover responsive align="middle" className="mt-2">
                                  <CTableHead color="light">
                                    <CTableRow>
                                      <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                                      <CTableHeaderCell style={{ width: 90 }}>Index</CTableHeaderCell>
                                      <CTableHeaderCell>PO Statement</CTableHeaderCell>
                                    </CTableRow>
                                  </CTableHead>
                                  <CTableBody>
                                    {poSaved.map((x, i) => (
                                      <CTableRow key={i}>
                                        <CTableDataCell className="text-center">
                                          <CFormCheck type="radio" name="poSaved" />
                                        </CTableDataCell>
                                        <CTableDataCell>{`PO${i + 1}`}</CTableDataCell>
                                        <CTableDataCell>{x.text}</CTableDataCell>
                                      </CTableRow>
                                    ))}
                                  </CTableBody>
                                </CTable>
                              </CCol>
                            )}
                          </CRow>
                        </div>
                      )}
                    </div>

                    {/* PSO */}
                    <div>
                      <button
                        type="button"
                        className={`btn w-100 text-start ${openSection === 'pso' ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => toggleSection('pso')}
                      >
                        Programme Specific Outcomes (PSOs)
                      </button>

                      {openSection === 'pso' && (
                        <div className="border rounded-bottom p-3">
                          <CRow className="g-3">
                            <CCol xs={12}>
                              <strong>Programme Specific Outcomes (PSO) Entry</strong>
                            </CCol>

                            <CCol xs={12}>
                              <CTable hover responsive align="middle">
                                <CTableHead color="light">
                                  <CTableRow>
                                    <CTableHeaderCell>PSO Statement</CTableHeaderCell>
                                    <CTableHeaderCell style={{ width: 120 }}>Action</CTableHeaderCell>
                                  </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                  {psoRows.map((r, idx) => (
                                    <CTableRow key={idx}>
                                      <CTableDataCell>
                                        <CFormTextarea
                                          rows={2}
                                          value={r.text}
                                          onChange={updateTextRow(setPsoRows, idx)}
                                          disabled={!isEdit}
                                        />
                                      </CTableDataCell>
                                      <CTableDataCell className="text-center">
                                        <div className="d-flex justify-content-center gap-2">
                                          <button
                                            type="button"
                                            className="btn btn-success btn-sm"
                                            onClick={() => addTextRow(setPsoRows)}
                                            disabled={!isEdit}
                                            title="Add Row"
                                          >
                                            +
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={() => removeTextRow(setPsoRows, idx)}
                                            disabled={!isEdit}
                                            title="Remove Row"
                                          >
                                            -
                                          </button>
                                        </div>
                                      </CTableDataCell>
                                    </CTableRow>
                                  ))}
                                </CTableBody>
                              </CTable>
                            </CCol>

                            {psoSaved.length > 0 && (
                              <CCol xs={12}>
                                <div className="d-flex justify-content-between align-items-center">
                                  <strong>Programme Specific Outcomes (PSO)</strong>
                                  <div className="d-flex gap-2">
                                    <ArpIconButton
                                      icon="edit"
                                      color="info"
                                      title="Edit"
                                      onClick={() => setIsEdit(true)}
                                    />
                                    <ArpIconButton
                                      icon="delete"
                                      color="danger"
                                      title="Delete"
                                      onClick={() => setPsoSaved([])}
                                      disabled={!isEdit}
                                    />
                                  </div>
                                </div>

                                <CTable hover responsive align="middle" className="mt-2">
                                  <CTableHead color="light">
                                    <CTableRow>
                                      <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                                      <CTableHeaderCell style={{ width: 100 }}>Index</CTableHeaderCell>
                                      <CTableHeaderCell>PSO Statement</CTableHeaderCell>
                                    </CTableRow>
                                  </CTableHead>
                                  <CTableBody>
                                    {psoSaved.map((x, i) => (
                                      <CTableRow key={i}>
                                        <CTableDataCell className="text-center">
                                          <CFormCheck type="radio" name="psoSaved" />
                                        </CTableDataCell>
                                        <CTableDataCell>{`PSO${i + 1}`}</CTableDataCell>
                                        <CTableDataCell>{x.text}</CTableDataCell>
                                      </CTableRow>
                                    ))}
                                  </CTableBody>
                                </CTable>
                              </CCol>
                            )}
                          </CRow>
                        </div>
                      )}
                    </div>

                    {/* Taxonomy */}
                    <div>
                      <button
                        type="button"
                        className={`btn w-100 text-start ${openSection === 'taxonomy' ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => toggleSection('taxonomy')}
                      >
                        Taxonomy Configuration Entry
                      </button>

                      {openSection === 'taxonomy' && (
                        <div className="border rounded-bottom p-3">
                          <CRow className="g-3">
                            <CCol xs={12}>
                              <strong>Taxonomy Configuration Entry</strong>
                            </CCol>

                            {/* Domain selection row (3 pairs) */}
                            <CCol md={3}>
                              <CFormLabel>Choose Domain</CFormLabel>
                            </CCol>
                            <CCol md={3} className="d-flex align-items-center">
                              <CFormCheck
                                id="cognitive"
                                label="Cognitive"
                                checked={taxonomyDomains.cognitive}
                                onChange={onTaxDomain('cognitive')}
                                disabled={!isEdit}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Choose Domain</CFormLabel>
                            </CCol>
                            <CCol md={3} className="d-flex align-items-center">
                              <CFormCheck
                                id="psychomotor"
                                label="Psychomotor"
                                checked={taxonomyDomains.psychomotor}
                                onChange={onTaxDomain('psychomotor')}
                                disabled={!isEdit}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Choose Domain</CFormLabel>
                            </CCol>
                            <CCol md={3} className="d-flex align-items-center">
                              <CFormCheck
                                id="affective"
                                label="Affective"
                                checked={taxonomyDomains.affective}
                                onChange={onTaxDomain('affective')}
                                disabled={!isEdit}
                              />
                            </CCol>

                            {/* Cognitive / Psychomotor / Affective mapping - 3 pairs per row */}
                            <CCol md={3}>
                              <CFormLabel>Remembering</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.remembering}
                                onChange={onTaxValue('remembering')}
                                disabled={!taxonomyEnabled('cognitive')}
                              />
                            </CCol>
                            <CCol md={3}>
                              <CFormLabel>Perception</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.perception}
                                onChange={onTaxValue('perception')}
                                disabled={!taxonomyEnabled('psychomotor')}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Receiving</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.receiving}
                                onChange={onTaxValue('receiving')}
                                disabled={!taxonomyEnabled('affective')}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Understanding</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.understanding}
                                onChange={onTaxValue('understanding')}
                                disabled={!taxonomyEnabled('cognitive')}
                              />
                            </CCol>
                            <CCol md={3}>
                              <CFormLabel>SET</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.set}
                                onChange={onTaxValue('set')}
                                disabled={!taxonomyEnabled('psychomotor')}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Responding</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.responding}
                                onChange={onTaxValue('responding')}
                                disabled={!taxonomyEnabled('affective')}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Applying</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.applying}
                                onChange={onTaxValue('applying')}
                                disabled={!taxonomyEnabled('cognitive')}
                              />
                            </CCol>
                            <CCol md={3}>
                              <CFormLabel>Guided Response</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.guidedResponse}
                                onChange={onTaxValue('guidedResponse')}
                                disabled={!taxonomyEnabled('psychomotor')}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Valuing</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.valuing}
                                onChange={onTaxValue('valuing')}
                                disabled={!taxonomyEnabled('affective')}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Analyzing</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.analyzing}
                                onChange={onTaxValue('analyzing')}
                                disabled={!taxonomyEnabled('cognitive')}
                              />
                            </CCol>
                            <CCol md={3}>
                              <CFormLabel>Mechanism</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.mechanism}
                                onChange={onTaxValue('mechanism')}
                                disabled={!taxonomyEnabled('psychomotor')}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Organizing</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.organizing}
                                onChange={onTaxValue('organizing')}
                                disabled={!taxonomyEnabled('affective')}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Evaluating</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.evaluating}
                                onChange={onTaxValue('evaluating')}
                                disabled={!taxonomyEnabled('cognitive')}
                              />
                            </CCol>
                            <CCol md={3}>
                              <CFormLabel>Complete Over Response</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.completeOverResponse}
                                onChange={onTaxValue('completeOverResponse')}
                                disabled={!taxonomyEnabled('psychomotor')}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Internationalizing</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.internationalizing}
                                onChange={onTaxValue('internationalizing')}
                                disabled={!taxonomyEnabled('affective')}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Creating</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.creating}
                                onChange={onTaxValue('creating')}
                                disabled={!taxonomyEnabled('cognitive')}
                              />
                            </CCol>
                            <CCol md={3}>
                              <CFormLabel>Adaption</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.adaption}
                                onChange={onTaxValue('adaption')}
                                disabled={!taxonomyEnabled('psychomotor')}
                              />
                            </CCol>

                            <CCol md={3}>
                              <CFormLabel>Organization</CFormLabel>
                            </CCol>
                            <CCol md={3}>
                              <CFormInput
                                value={taxonomyValues.organization}
                                onChange={onTaxValue('organization')}
                                disabled={!taxonomyEnabled('psychomotor')}
                              />
                            </CCol>
                          </CRow>
                        </div>
                      )}
                    </div>

                    {/* Correlation */}
                    <div>
                      <button
                        type="button"
                        className={`btn w-100 text-start ${openSection === 'correlation' ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => toggleSection('correlation')}
                      >
                        Correlation Configuration Entry
                      </button>

                      {openSection === 'correlation' && (
                        <div className="border rounded-bottom p-3">
                          <CRow className="g-3">
                            <CCol xs={12} className="d-flex justify-content-between align-items-center">
                              <strong>Correlation Configuration Entry</strong>
                              <div className="d-flex gap-2">
                                <ArpButton
                                  label="Edit"
                                  icon="edit"
                                  color="primary"
                                  type="button"
                                  onClick={editCorrelation}
                                  title="Edit"
                                />
                              </div>
                            </CCol>

                            <CCol xs={12}>
                              <CTable hover responsive align="middle">
                                <CTableHead color="light">
                                  <CTableRow>
                                    <CTableHeaderCell>Parameter</CTableHeaderCell>
                                    <CTableHeaderCell style={{ width: 160 }}>Index</CTableHeaderCell>
                                    <CTableHeaderCell style={{ width: 180 }}>Value</CTableHeaderCell>
                                    <CTableHeaderCell style={{ width: 120 }}>Action</CTableHeaderCell>
                                  </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                  {correlationRows.map((r, idx) => (
                                    <CTableRow key={idx}>
                                      <CTableDataCell>
                                        <CFormInput
                                          value={r.parameter}
                                          onChange={updateCorrelation(idx, 'parameter')}
                                          disabled={!isEdit || correlationLocked}
                                        />
                                      </CTableDataCell>
                                      <CTableDataCell>
                                        <CFormInput
                                          value={r.index}
                                          onChange={updateCorrelation(idx, 'index')}
                                          disabled={!isEdit || correlationLocked}
                                        />
                                      </CTableDataCell>
                                      <CTableDataCell>
                                        <CFormInput
                                          value={r.value}
                                          onChange={updateCorrelation(idx, 'value')}
                                          disabled={!isEdit || correlationLocked}
                                        />
                                      </CTableDataCell>
                                      <CTableDataCell className="text-center">
                                        <div className="d-flex justify-content-center gap-2">
                                          <button
                                            type="button"
                                            className="btn btn-success btn-sm"
                                            onClick={addCorrelationRow}
                                            disabled={!isEdit || correlationLocked}
                                            title="Add Row"
                                          >
                                            +
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={() => removeCorrelationRow(idx)}
                                            disabled={!isEdit || correlationLocked}
                                            title="Remove Row"
                                          >
                                            -
                                          </button>
                                        </div>
                                      </CTableDataCell>
                                    </CTableRow>
                                  ))}
                                </CTableBody>
                              </CTable>
                            </CCol>
                          </CRow>
                        </div>
                      )}
                    </div>

                    {/* Map & Assessment */}
                    <div>
                      <button
                        type="button"
                        className={`btn w-100 text-start ${openSection === 'mapAssessment' ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => toggleSection('mapAssessment')}
                      >
                        Map &amp; Assessment Configuration Entry
                      </button>

                      {openSection === 'mapAssessment' && (
                        <div className="border rounded-bottom p-3">
                          <CRow className="g-3">
                            <CCol xs={12} className="d-flex justify-content-between align-items-center">
                              <strong>Map &amp; Assessment Configuration Entry</strong>
                              <div className="d-flex gap-2">
                                <ArpButton
                                  label="Edit"
                                  icon="edit"
                                  color="primary"
                                  type="button"
                                  onClick={editMap}
                                  title="Edit"
                                />
                              </div>
                            </CCol>

                            <CCol xs={12}>
                              <CTable hover responsive align="middle">
                                <CTableHead color="light">
                                  <CTableRow>
                                    <CTableHeaderCell style={{ width: 90 }}>Select</CTableHeaderCell>
                                    <CTableHeaderCell>Parameters</CTableHeaderCell>
                                    <CTableHeaderCell style={{ width: 320 }}>Remarks</CTableHeaderCell>
                                  </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                  {mapRows.map((r) => (
                                    <CTableRow key={r.id}>
                                      <CTableDataCell className="text-center">
                                        <CFormCheck
                                          type="checkbox"
                                          checked={r.checked}
                                          onChange={toggleMapChecked(r.id)}
                                          disabled={!isEdit || mapLocked}
                                        />
                                      </CTableDataCell>
                                      <CTableDataCell>{r.label}</CTableDataCell>
                                      <CTableDataCell>
                                        <CFormInput
                                          value={r.remarks}
                                          onChange={updateMapRemarks(r.id)}
                                          disabled={!isEdit || mapLocked}
                                        />
                                      </CTableDataCell>
                                    </CTableRow>
                                  ))}
                                </CTableBody>
                              </CTable>
                            </CCol>
                          </CRow>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

      </CCol>
    </CRow>
  )
}

export default ObeConfiguration
