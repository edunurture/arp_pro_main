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
const KEY_INDICATORS = ['KI01', 'KI02', 'KI03']
const YEARS = ['2021-22', '2022-23', '2023-24', '2024-25', '2025-26']

const normalize = (v) =>
  String(v ?? '')
    .toLowerCase()
    .trim()

const initialSelection = {
  manualId: '',
  institutionCategory: '',
  keyIndicator: '',
}

const DocumentsSetup = () => {
  const statusRef = useRef(null)
  const uploadsRef = useRef(null)

  const modelFileRef = useRef({})
  const suggestedFileRef = useRef({})

  // Phase 1 (selection)
  const [isEntryEnabled, setIsEntryEnabled] = useState(false)
  const [selection, setSelection] = useState(initialSelection)

  // Phase visibility
  const [showStatus, setShowStatus] = useState(false)
  const [showUploads, setShowUploads] = useState(false)

  // Phase 2 (status table)
  const [selectedMetricId, setSelectedMetricId] = useState(null)

  const [statusRows, setStatusRows] = useState([
    { id: 'ST001', criteriaNo: 'C001', keyIndicator: 'KI01', metricNumber: '1.1', status: 'Pending' },
    { id: 'ST002', criteriaNo: 'C001', keyIndicator: 'KI01', metricNumber: '1.2', status: 'Uploaded' },
    { id: 'ST003', criteriaNo: 'C002', keyIndicator: 'KI02', metricNumber: '2.1', status: 'Pending' },
  ])

  // Phase 3 (uploads table)
  const [uploadRows, setUploadRows] = useState([
    { id: 'DOC001', documentName: 'Minutes of Meeting', requiredYear: '', modelFileName: '', suggestedFileName: '' },
    { id: 'DOC002', documentName: 'Photo Evidence', requiredYear: '', modelFileName: '', suggestedFileName: '' },
    { id: 'DOC003', documentName: 'Attendance Sheet', requiredYear: '', modelFileName: '', suggestedFileName: '' },
  ])

  // Phase 2 table UX
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'criteriaNo', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading] = useState(false)

  const scrollToStatus = () => statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const scrollToUploads = () => uploadsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const onSelChange = (k) => (e) => setSelection((p) => ({ ...p, [k]: e.target.value }))

  // Card 1 actions
  const onAddNew = () => {
    setIsEntryEnabled(true)
    setSelection(initialSelection)
    setShowStatus(false)
    setShowUploads(false)
    setSelectedMetricId(null)
    setSearch('')
  }

  const onView = () => {
    setShowStatus(true)
    setShowUploads(false)
    scrollToStatus()
  }

  // Phase 1 actions
  const onSearch = (e) => {
    e.preventDefault()
    if (!selection.manualId || !selection.institutionCategory || !selection.keyIndicator) return
    setShowStatus(true)
    setShowUploads(false)
    scrollToStatus()
  }

  const onCancelSelection = () => {
    setSelection(initialSelection)
    setIsEntryEnabled(false)
    setShowStatus(false)
    setShowUploads(false)
    setSelectedMetricId(null)
    setSearch('')
  }

  // Phase 2 actions
  const getSelectedStatusRow = () => statusRows.find((r) => r.id === selectedMetricId) || null

  const onStatusAdd = () => {
    const r = getSelectedStatusRow()
    if (!r) return
    setShowUploads(true)
    scrollToUploads()
  }

  const onStatusView = () => {
    const r = getSelectedStatusRow()
    if (!r) return
    // just open uploads in view mode (kept same; hook modal later if needed)
    setShowUploads(true)
    scrollToUploads()
  }

  const onStatusEdit = () => {
    const r = getSelectedStatusRow()
    if (!r) return
    setShowUploads(true)
    scrollToUploads()
  }

  const onStatusDelete = () => {
    if (!selectedMetricId) return
    const next = statusRows.filter((r) => r.id !== selectedMetricId)
    setStatusRows(next)
    setSelectedMetricId(next[0]?.id ?? null)
    setShowUploads(false)
  }

  // Phase 3 (uploads)
  const openModelPicker = (rowId) => modelFileRef.current?.[rowId]?.click?.()
  const openSuggestedPicker = (rowId) => suggestedFileRef.current?.[rowId]?.click?.()

  const onYearChange = (rowId, year) => {
    setUploadRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, requiredYear: year } : r)))
  }

  const onModelFileChange = (rowId, file) => {
    setUploadRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, modelFileName: file?.name || '' } : r)),
    )
  }

  const onSuggestedFileChange = (rowId, file) => {
    setUploadRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, suggestedFileName: file?.name || '' } : r)),
    )
  }

  const onUploadsSave = () => {
    // hook API later - update status to Uploaded
    if (!selectedMetricId) return
    setStatusRows((prev) => prev.map((r) => (r.id === selectedMetricId ? { ...r, status: 'Uploaded' } : r)))
    setShowUploads(false)
  }

  const onUploadsCancel = () => {
    setShowUploads(false)
  }

  // Phase 2 sort/search/paging
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
    let data = statusRows

    // optional filter by keyIndicator from selection
    if (selection.keyIndicator) data = data.filter((r) => r.keyIndicator === selection.keyIndicator)

    if (q) {
      data = data.filter((r) =>
        [r.criteriaNo, r.keyIndicator, r.metricNumber, r.status].map(normalize).join(' ').includes(q),
      )
    }

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) =>
      normalize(a?.[key]).localeCompare(normalize(b?.[key]), undefined, { sensitivity: 'base' }),
    )
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [statusRows, search, sort, selection.keyIndicator])

  useEffect(() => setPage(1), [search, pageSize, selection.keyIndicator])

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
            <strong>DOCUMENTS SETUP</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton label="View" icon="view" color="primary" onClick={onView} title="View" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= PHASE 1: SELECTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>ADD METRIC WISE DOCUMENTS</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSearch}>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Choose Manual ID</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={selection.manualId} onChange={onSelChange('manualId')} disabled={!isEntryEnabled} required>
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
                    value={selection.institutionCategory}
                    onChange={onSelChange('institutionCategory')}
                    disabled={!isEntryEnabled}
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

                <CCol md={3}>
                  <CFormLabel>Choose Key Indicator (KI)</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={selection.keyIndicator} onChange={onSelChange('keyIndicator')} disabled={!isEntryEnabled} required>
                    <option value="">Select</option>
                    {KEY_INDICATORS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={6} />

                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Search" icon="search" color="info" type="submit" title="Search" disabled={!isEntryEnabled} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancelSelection} title="Cancel" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= PHASE 2: STATUS TABLE ================= */}
        {showStatus && (
          <CCard className="mb-3" ref={statusRef}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>STATUS FOR METRIC WISE DOCUMENTS</strong>

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
                  <ArpIconButton icon="add" color="success" title="Add" onClick={onStatusAdd} disabled={!selectedMetricId} />
                  <ArpIconButton icon="view" color="purple" title="View" onClick={onStatusView} disabled={!selectedMetricId} />
                  <ArpIconButton icon="edit" color="warning" title="Edit" onClick={onStatusEdit} disabled={!selectedMetricId} />
                  <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onStatusDelete} disabled={!selectedMetricId} />
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
                    <CTableHeaderCell style={{ width: 180, cursor: 'pointer' }} onClick={() => sortToggle('status')}>
                      Status{sortIndicator('status')}
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
                            name="statusRow"
                            checked={selectedMetricId === r.id}
                            onChange={() => setSelectedMetricId(r.id)}
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
        )}

        {/* ================= PHASE 3: UPLOADS TABLE (BELOW STATUS) ================= */}
        {showUploads && (
          <CCard className="mb-3" ref={uploadsRef}>
            <CCardHeader>
              <strong>DOCUMENTS UPLOADS</strong>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 260 }}>Document Name</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 160 }}>Required Year</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 260 }}>Upload Model Document</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 280 }}>Upload Suggested Document</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {uploadRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell>{r.documentName}</CTableDataCell>

                      <CTableDataCell>
                        <CFormSelect value={r.requiredYear} onChange={(e) => onYearChange(r.id, e.target.value)}>
                          <option value="">Select</option>
                          {YEARS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </CFormSelect>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="d-flex align-items-center gap-2">
                          <ArpButton
                            label="Upload"
                            icon="upload"
                            color="warning"
                            type="button"
                            title="Upload Model Document"
                            onClick={() => openModelPicker(r.id)}
                          />
                          <small className="text-muted" title={r.modelFileName}>
                            {r.modelFileName ? r.modelFileName : 'No file chosen'}
                          </small>

                          <input
                            type="file"
                            style={{ display: 'none' }}
                            ref={(el) => {
                              modelFileRef.current[r.id] = el
                            }}
                            onChange={(e) => onModelFileChange(r.id, e.target.files?.[0])}
                          />
                        </div>
                      </CTableDataCell>

                      <CTableDataCell>
                        <div className="d-flex align-items-center gap-2">
                          <ArpButton
                            label="Upload"
                            icon="upload"
                            color="warning"
                            type="button"
                            title="Upload Suggested Document"
                            onClick={() => openSuggestedPicker(r.id)}
                          />
                          <small className="text-muted" title={r.suggestedFileName}>
                            {r.suggestedFileName ? r.suggestedFileName : 'No file chosen'}
                          </small>

                          <input
                            type="file"
                            style={{ display: 'none' }}
                            ref={(el) => {
                              suggestedFileRef.current[r.id] = el
                            }}
                            onChange={(e) => onSuggestedFileChange(r.id, e.target.files?.[0])}
                          />
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <ArpButton label="Save" icon="save" color="success" type="button" onClick={onUploadsSave} title="Save" />
                <ArpButton
                  label="Cancel"
                  icon="cancel"
                  color="secondary"
                  type="button"
                  onClick={onUploadsCancel}
                  title="Cancel"
                />
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default DocumentsSetup
