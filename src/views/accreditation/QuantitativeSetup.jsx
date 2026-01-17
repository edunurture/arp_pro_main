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
const INST_CATEGORIES = [
  'University',
  'Arts & Science College',
  'Engineering College',
  'Health Science Institutions',
  'Deemed to be University',
  'Polytechnic',
  'ITI',
  'School',
  'Others',
]

const normalize = (v) =>
  String(v ?? '')
    .toLowerCase()
    .trim()

const initialSearch = {
  manualId: '',
  institutionCategory: '',
}

const QuantitativeSetup = () => {
  const tableRef = useRef(null)

  // Search state
  const [searchForm, setSearchForm] = useState(initialSearch)
  const [showTable, setShowTable] = useState(false)

  // Selection
  const [selectedId, setSelectedId] = useState(null)

  // Table data (mock; hook API later)
  const [rows, setRows] = useState([
    { id: 'QNM001', criteriaNo: 'C001', keyIndicator: 'KI01', metricNumber: '1.1', status: 'Pending' },
    { id: 'QNM002', criteriaNo: 'C001', keyIndicator: 'KI01', metricNumber: '1.2', status: 'Uploaded' },
    { id: 'QNM003', criteriaNo: 'C002', keyIndicator: 'KI02', metricNumber: '2.1', status: 'Pending' },
  ])

  // Table UX
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'criteriaNo', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading] = useState(false)

  const scrollToTable = () => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const onSearchChange = (k) => (e) => setSearchForm((p) => ({ ...p, [k]: e.target.value }))

  // Header actions
  const onAddNew = () => {
    // In HTML, mostly table operations; keep for ARP standard
    setShowTable(true)
    scrollToTable()
  }

  const onView = () => {
    setShowTable(true)
    scrollToTable()
  }

  // Search card actions
  const onSearch = (e) => {
    e.preventDefault()
    if (!String(searchForm.manualId).trim() || !String(searchForm.institutionCategory).trim()) return
    setShowTable(true)
    scrollToTable()
  }

  const onCancelSearch = () => {
    setSearchForm(initialSearch)
    setShowTable(false)
    setSelectedId(null)
    setSearch('')
  }

  // Table toolbar actions (placeholders for API integration)
  const onUpload = () => {
    // open upload modal later
  }
  const onRowView = () => {
    // open view modal later
  }
  const onEdit = () => {
    // open edit modal later
  }
  const onDownload = () => {
    // download selected template later
  }
  const onDelete = () => {
    if (!selectedId) return
    const next = rows.filter((r) => r.id !== selectedId)
    setRows(next)
    setSelectedId(next[0]?.id ?? null)
  }

  // Footer actions
  const onSave = () => {
    // In HTML, save likely confirms status updates; placeholder
  }
  const onCancelTable = () => {
    setShowTable(false)
    setSelectedId(null)
  }

  // Sort/search/paging
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
        [r.criteriaNo, r.keyIndicator, r.metricNumber, r.status].map(normalize).join(' ').includes(q),
      )
    }

    const { key, dir } = sort || {}
    if (!key) return data

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
            <strong>QUANTITATIVE SETUP</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton label="View" icon="view" color="primary" onClick={onView} title="View" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= SEARCH CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>SEARCH</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSearch}>
              <CRow className="g-3">
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

                <CCol md={3}>
                  <CFormLabel>Institution Category</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={searchForm.institutionCategory}
                    onChange={onSearchChange('institutionCategory')}
                    required
                  >
                    <option value="">Select</option>
                    {INST_CATEGORIES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Search" icon="search" color="info" type="submit" title="Search" />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancelSearch} title="Cancel" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD ================= */}
        {showTable && (
          <CCard className="mb-3" ref={tableRef}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>UPLOAD QUANTITATIVE DATA TEMPLATE</strong>

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
                  <ArpIconButton icon="upload" color="info" title="Upload" onClick={onUpload} disabled={!selectedId} />
                  <ArpIconButton icon="view" color="purple" title="View" onClick={onRowView} disabled={!selectedId} />
                  <ArpIconButton icon="edit" color="warning" title="Edit" onClick={onEdit} disabled={!selectedId} />
                  <ArpIconButton icon="download" color="success" title="Download" onClick={onDownload} disabled={!selectedId} />
                  <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
                </div>
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>
                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('criteriaNo')}>
                      Criteria No{sortIndicator('criteriaNo')}
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('keyIndicator')}>
                      Key Indicator{sortIndicator('keyIndicator')}
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('metricNumber')}>
                      Metric Number{sortIndicator('metricNumber')}
                    </CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 220, cursor: 'pointer' }} onClick={() => sortToggle('status')}>
                      Status of Data Template{sortIndicator('status')}
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center py-4">
                        <CSpinner size="sm" className="me-2" />
                        Loading...
                      </CTableDataCell>
                    </CTableRow>
                  ) : pageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center py-4">
                        No records found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    pageRows.map((r) => (
                      <CTableRow key={r.id}>
                        <CTableDataCell className="text-center">
                          <input
                            type="radio"
                            name="qnmRow"
                            checked={selectedId === r.id}
                            onChange={() => setSelectedId(r.id)}
                          />
                        </CTableDataCell>
                        <CTableDataCell className="text-center">{r.criteriaNo}</CTableDataCell>
                        <CTableDataCell className="text-center">{r.keyIndicator}</CTableDataCell>
                        <CTableDataCell className="text-center">{r.metricNumber}</CTableDataCell>
                        <CTableDataCell className="text-center">{r.status}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="d-flex gap-2">
                  <ArpButton label="Save" icon="save" color="success" type="button" title="Save" onClick={onSave} />
                  <ArpButton
                    label="Cancel"
                    icon="cancel"
                    color="secondary"
                    type="button"
                    title="Cancel"
                    onClick={onCancelTable}
                  />
                </div>

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
        )}
      </CCol>
    </CRow>
  )
}

export default QuantitativeSetup
