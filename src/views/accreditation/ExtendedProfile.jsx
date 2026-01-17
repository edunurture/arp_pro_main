import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CPagination,
  CPaginationItem,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'

import { ArpButton, ArpIconButton } from '../../components/common'

const MANUAL_IDS = ['MAN001', 'MAN002', 'MAN003']

const normalize = (v) =>
  String(v ?? '')
    .toLowerCase()
    .trim()

const initialSearch = { manualId: '' }

const initialForm = {
  epCriteriaNo: '',
  criteriaDescription: '',
  totalMetricItems: '',
}

const ExtendedProfile = () => {
  const tableRef = useRef(null)

  // Modes
  // search: choose manual + search (reveals list)
  // add/edit: criteria form enabled
  // view: list visible (default after search)
  const [mode, setMode] = useState('search')
  const [isEdit, setIsEdit] = useState(false)

  // Search selection
  const [searchForm, setSearchForm] = useState(initialSearch)
  const [searched, setSearched] = useState(false)

  // Data (replace with API later)
  const [rows, setRows] = useState([
    { id: 'EP01', epCriteriaNo: 'EP01', criteriaDescription: 'Infrastructure Facilities', totalMetricItems: '10' },
    { id: 'EP02', epCriteriaNo: 'EP02', criteriaDescription: 'Faculty Strength', totalMetricItems: '8' },
    { id: 'EP03', epCriteriaNo: 'EP03', criteriaDescription: 'Student Support', totalMetricItems: '6' },
  ])

  // Selection
  const [selectedId, setSelectedId] = useState(null)

  // Form
  const [form, setForm] = useState(initialForm)

  // Table UX
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'epCriteriaNo', dir: 'asc' })
  const [page, setPage] = useState(1) // 1-based
  const [pageSize, setPageSize] = useState(10)
  const [loading] = useState(false)

  const onSearchChange = (k) => (e) => setSearchForm((p) => ({ ...p, [k]: e.target.value }))
  const onFormChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const scrollToTable = () => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Header actions
  const onAddNew = () => {
    setMode('add')
    setIsEdit(true)
    setForm(initialForm)
    setSelectedId(null)
    if (!searched) setSearched(true)
    scrollToTable()
  }

  const onView = () => {
    setMode('view')
    setIsEdit(false)
    if (!searched) setSearched(true)
    scrollToTable()
  }

  // Phase-1 actions (Search / Cancel)
  const onSearchSubmit = (e) => {
    e.preventDefault()
    if (!searchForm.manualId) return
    setSearched(true)
    setMode('view')
    setIsEdit(false)
    scrollToTable()
  }

  const onCancelSearch = () => {
    setSearchForm(initialSearch)
    setSearched(false)
    setMode('search')
    setIsEdit(false)
    setSelectedId(null)
    setForm(initialForm)
  }

  // Table actions
  const getSelectedRow = () => rows.find((r) => r.id === selectedId) || null

  const onAddCriteria = () => {
    setMode('add')
    setIsEdit(true)
    setForm(initialForm)
    setSelectedId(null)
  }

  const onEditCriteria = () => {
    const r = getSelectedRow()
    if (!r) return
    setMode('edit')
    setIsEdit(true)
    setForm({
      epCriteriaNo: r.epCriteriaNo || '',
      criteriaDescription: r.criteriaDescription || '',
      totalMetricItems: r.totalMetricItems || '',
    })
  }

  const onDeleteCriteria = () => {
    if (!selectedId) return
    const next = rows.filter((r) => r.id !== selectedId)
    setRows(next)
    setSelectedId(next[0]?.id ?? null)
    setIsEdit(false)
    setMode('view')
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!form.epCriteriaNo || !form.criteriaDescription || !form.totalMetricItems) return

    setRows((prev) => {
      const exists = prev.find((r) => r.id === form.epCriteriaNo)
      if (exists) {
        return prev.map((r) =>
          r.id === form.epCriteriaNo
            ? { ...r, ...form, id: form.epCriteriaNo }
            : r,
        )
      }
      return [{ ...form, id: form.epCriteriaNo }, ...prev]
    })

    setSelectedId(form.epCriteriaNo)
    setIsEdit(false)
    setMode('view')
  }

  const onCancelForm = () => {
    setIsEdit(false)
    setMode('view')
    setForm(initialForm)
  }

  // Table filtering/sorting
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
      data = rows.filter((r) =>
        [r.epCriteriaNo, r.criteriaDescription, r.totalMetricItems].map(normalize).join(' ').includes(q),
      )
    }

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) =>
      normalize(a?.[key]).localeCompare(normalize(b?.[key]), undefined, { sensitivity: 'base' }),
    )
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [rows, search, sort])

  // Reset paging when search/pageSize changes
  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)

  const pageRows = useMemo(() => filteredSorted.slice(startIdx, endIdx), [filteredSorted, startIdx, endIdx])

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages])

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>EXTENDED PROFILE</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton label="View" icon="view" color="info" onClick={onView} title="View" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>
              {mode === 'add' || mode === 'edit' ? 'Add Extended Profile - Criteria' : 'Extended Profile'}
            </strong>
          </CCardHeader>

          <CCardBody>
            {/* Phase 1 (Search) */}
            <CForm onSubmit={onSearchSubmit}>
              <CRow className="g-3 align-items-center">
                <CCol md={3}>
                  <CFormLabel>Choose Manual ID</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={searchForm.manualId} onChange={onSearchChange('manualId')} required>
                    <option value="">Select</option>
                    {MANUAL_IDS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3} />
                <CCol md={3} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Search" icon="view" color="primary" type="submit" title="Search" />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancelSearch} title="Cancel" />
                </CCol>
              </CRow>
            </CForm>

            {/* Criteria Form (enabled only when add/edit) */}
            {(mode === 'add' || mode === 'edit') ? (
              <div className="mt-3">
                <CForm onSubmit={onSave}>
                  <CRow className="g-3">
                    <CCol md={3}>
                      <CFormLabel>EP - Criteria Number</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput value={form.epCriteriaNo} onChange={onFormChange('epCriteriaNo')} disabled={!isEdit} required />
                    </CCol>

                    <CCol md={3}>
                      <CFormLabel>Total Metric Items</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="number"
                        min={0}
                        value={form.totalMetricItems}
                        onChange={onFormChange('totalMetricItems')}
                        disabled={!isEdit}
                        required
                      />
                    </CCol>

                    <CCol md={3}>
                      <CFormLabel>Criteria Description</CFormLabel>
                    </CCol>
                    <CCol md={9}>
                      <CFormInput value={form.criteriaDescription} onChange={onFormChange('criteriaDescription')} disabled={!isEdit} required />
                    </CCol>

                    <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                      <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} title="Save" />
                      <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancelForm} title="Cancel" />
                    </CCol>
                  </CRow>
                </CForm>
              </div>
            ) : null}
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD ================= */}
        <CCard className="mb-3" ref={tableRef}>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Extended Profile Criteria</strong>

            <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
              <CInputGroup size="sm" style={{ width: 280, flex: '0 0 auto' }}>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
              </CInputGroup>

              <CFormSelect
                size="sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{ width: 120, flex: '0 0 auto' }}
                title="Rows per page"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </CFormSelect>

              <div className="d-flex gap-2 align-items-center flex-nowrap" style={{ flex: '0 0 auto' }}>
                <ArpIconButton icon="add" color="success" title="Add" onClick={onAddCriteria} disabled={!searched} />
                <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEditCriteria} disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDeleteCriteria} disabled={!selectedId} />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            {!searched ? (
              <div className="text-medium-emphasis">Select a Manual ID and click Search to view criteria.</div>
            ) : (
              <>
                <CTable hover responsive align="middle">
                  <CTableHead color="light">
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>

                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('epCriteriaNo')}>
                        EP - Criteria No{sortIndicator('epCriteriaNo')}
                      </CTableHeaderCell>

                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('criteriaDescription')}>
                        Criteria Description{sortIndicator('criteriaDescription')}
                      </CTableHeaderCell>

                      <CTableHeaderCell style={{ width: 170, cursor: 'pointer' }} onClick={() => sortToggle('totalMetricItems')}>
                        Total Metric Items{sortIndicator('totalMetricItems')}
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {loading ? (
                      <CTableRow>
                        <CTableDataCell colSpan={4} className="text-center py-4">
                          <CSpinner size="sm" className="me-2" />
                          Loading...
                        </CTableDataCell>
                      </CTableRow>
                    ) : pageRows.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={4} className="text-center py-4">
                          No records found.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      pageRows.map((r) => (
                        <CTableRow key={r.id}>
                          <CTableDataCell className="text-center">
                            <input
                              type="radio"
                              name="epRow"
                              checked={selectedId === r.id}
                              onChange={() => setSelectedId(r.id)}
                            />
                          </CTableDataCell>
                          <CTableDataCell className="text-center">{r.epCriteriaNo}</CTableDataCell>
                          <CTableDataCell>{r.criteriaDescription}</CTableDataCell>
                          <CTableDataCell className="text-center">{r.totalMetricItems}</CTableDataCell>
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

                    <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                      ›
                    </CPaginationItem>
                    <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>
                      »
                    </CPaginationItem>
                  </CPagination>
                </div>
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ExtendedProfile
