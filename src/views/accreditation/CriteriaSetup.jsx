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

const initialForm = {
  manualId: '',
  institutionCategory: '',
  criteriaNo: '',
  criteriaName: '',
  noOfKIs: '',
  noOfQNMs: '',
  noOfQLMs: '',
  totalMetrics: '',
  totalWeightages: '',
  totalMarks: '',
}

const CriteriaSetup = () => {
  const tableRef = useRef(null)

  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState(initialForm)

  // Mock table data (hook API later)
  const [rows, setRows] = useState([
    { id: 'C001', criteriaNo: 'C001', name: 'Teaching Learning', kis: '5', qlms: '3', qnms: '2', totalWeightage: '100' },
    { id: 'C002', criteriaNo: 'C002', name: 'Research', kis: '4', qlms: '2', qnms: '2', totalWeightage: '80' },
    { id: 'C003', criteriaNo: 'C003', name: 'Extension', kis: '3', qlms: '1', qnms: '2', totalWeightage: '60' },
  ])

  const [selectedId, setSelectedId] = useState(null)

  // Table UX
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'criteriaNo', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading] = useState(false)

  const scrollToTable = () => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  // Header actions
  const onAddNew = () => {
    setIsEdit(true)
    setForm(initialForm)
    setSelectedId(null)
  }

  const onView = () => {
    scrollToTable()
  }

  const onUpload = () => {
    // hook file upload modal later
  }

  const onDownload = () => {
    // hook template download later
  }

  // Table actions
  const getSelectedRow = () => rows.find((r) => r.id === selectedId) || null

  const onTableAdd = () => onAddNew()

  const onTableView = () => {
    const r = getSelectedRow()
    if (!r) return
    // Show minimal view in the form card (HTML "View" behavior)
    setForm((p) => ({
      ...p,
      criteriaNo: r.criteriaNo || '',
      criteriaName: r.name || '',
      noOfKIs: r.kis || '',
      noOfQLMs: r.qlms || '',
      noOfQNMs: r.qnms || '',
      totalWeightages: r.totalWeightage || '',
    }))
    setIsEdit(false)
  }

  const onTableEdit = () => {
    const r = getSelectedRow()
    if (!r) return
    setIsEdit(true)
    setForm((p) => ({
      ...p,
      criteriaNo: r.criteriaNo || '',
      criteriaName: r.name || '',
      noOfKIs: r.kis || '',
      noOfQLMs: r.qlms || '',
      noOfQNMs: r.qnms || '',
      totalWeightages: r.totalWeightage || '',
    }))
  }

  const onTableDelete = () => {
    if (!selectedId) return
    const next = rows.filter((r) => r.id !== selectedId)
    setRows(next)
    setSelectedId(next[0]?.id ?? null)
  }

  const validate = () => {
    const required = [
      'manualId',
      'institutionCategory',
      'criteriaNo',
      'criteriaName',
      'noOfKIs',
      'noOfQNMs',
      'noOfQLMs',
      'totalMetrics',
      'totalWeightages',
      'totalMarks',
    ]
    return required.every((k) => String(form[k] ?? '').trim())
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!validate()) return

    const id = String(form.criteriaNo).trim()
    const nextRow = {
      id,
      criteriaNo: id,
      name: form.criteriaName,
      kis: form.noOfKIs,
      qlms: form.noOfQLMs,
      qnms: form.noOfQNMs,
      totalWeightage: form.totalWeightages,
    }

    setRows((prev) => {
      const exists = prev.find((r) => r.id === id)
      if (exists) return prev.map((r) => (r.id === id ? nextRow : r))
      return [nextRow, ...prev]
    })

    setSelectedId(id)
    setIsEdit(false)
    scrollToTable()
  }

  const onCancel = () => {
    setForm(initialForm)
    setIsEdit(false)
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
        [r.criteriaNo, r.name, r.kis, r.qlms, r.qnms, r.totalWeightage].map(normalize).join(' ').includes(q),
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
            <strong>CRITERIA SETUP</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton label="Upload" icon="upload" color="info" onClick={onUpload} title="Upload" />
              <ArpButton label="Download Template" icon="download" color="danger" onClick={onDownload} title="Download Template" />
              <ArpButton label="View" icon="view" color="primary" onClick={onView} title="View" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>ADD CRITERIA</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={3}>
                  <CFormLabel>Choose Manual ID</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.manualId} onChange={onChange('manualId')} disabled={!isEdit} required>
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
                    value={form.institutionCategory}
                    onChange={onChange('institutionCategory')}
                    disabled={!isEdit}
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

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Criteria Number</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.criteriaNo}
                    onChange={onChange('criteriaNo')}
                    disabled={!isEdit}
                    required
                    placeholder="Enter Criteria Number"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Criteria Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.criteriaName}
                    onChange={onChange('criteriaName')}
                    disabled={!isEdit}
                    required
                    placeholder="Enter Criteria Name"
                  />
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Number of Key Indicators</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.noOfKIs}
                    onChange={onChange('noOfKIs')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Number of QNMs</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.noOfQNMs}
                    onChange={onChange('noOfQNMs')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                {/* Row 4 */}
                <CCol md={3}>
                  <CFormLabel>Number of QLMs</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.noOfQLMs}
                    onChange={onChange('noOfQLMs')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Total Metrics</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.totalMetrics}
                    onChange={onChange('totalMetrics')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                {/* Row 5 */}
                <CCol md={3}>
                  <CFormLabel>Total Weightages</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.totalWeightages}
                    onChange={onChange('totalWeightages')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Total Marks</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.totalMarks}
                    onChange={onChange('totalMarks')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                {/* Save / Cancel */}
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} title="Save" />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} title="Cancel" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD ================= */}
        <CCard className="mb-3" ref={tableRef}>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>CRITERIA DETAILS</strong>

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
                <ArpIconButton icon="add" color="success" title="Add" onClick={onTableAdd} />
                <ArpIconButton icon="view" color="purple" title="View" onClick={onTableView} disabled={!selectedId} />
                <ArpIconButton icon="edit" color="info" title="Edit" onClick={onTableEdit} disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onTableDelete} disabled={!selectedId} />
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

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('name')}>
                    Name{sortIndicator('name')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ width: 120, cursor: 'pointer' }} onClick={() => sortToggle('kis')}>
                    No. of KIs{sortIndicator('kis')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ width: 120, cursor: 'pointer' }} onClick={() => sortToggle('qlms')}>
                    No. of QLMs{sortIndicator('qlms')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ width: 120, cursor: 'pointer' }} onClick={() => sortToggle('qnms')}>
                    No. of QNMs{sortIndicator('qnms')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ width: 160, cursor: 'pointer' }} onClick={() => sortToggle('totalWeightage')}>
                    Total Weightage{sortIndicator('totalWeightage')}
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {loading ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center py-4">
                      <CSpinner size="sm" className="me-2" />
                      Loading...
                    </CTableDataCell>
                  </CTableRow>
                ) : pageRows.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center py-4">
                      No records found.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <input
                          type="radio"
                          name="criteriaRow"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell className="text-center">{r.criteriaNo}</CTableDataCell>
                      <CTableDataCell>{r.name}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.kis}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.qlms}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.qnms}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.totalWeightage}</CTableDataCell>
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
      </CCol>
    </CRow>
  )
}

export default CriteriaSetup
