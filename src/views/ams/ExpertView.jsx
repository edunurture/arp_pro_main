import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'

import { ArpButton, ArpIconButton, ArpPagination } from '../../components/common'

/**
 * ExpertView.jsx
 * Accreditation Management System (AMS) — Expert View
 * CoreUI React Pro + ARP Standard (Department.jsx style)
 */

const criteriaOptions = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
const keyIndicatorOptions = ['KI - 1', 'KI - 2', 'KI - 3']
const metricTypeOptions = ['QLM', 'QNM']

const criteriaDescMap = {
  I: 'Criteria I - Curricular Aspects',
  II: 'Criteria II - Teaching-Learning and Evaluation',
  III: 'Criteria III - Research, Innovations and Extension',
  IV: 'Criteria IV - Infrastructure and Learning Resources',
  V: 'Criteria V - Student Support and Progression',
  VI: 'Criteria VI - Governance, Leadership and Management',
  VII: 'Criteria VII - Institutional Values and Best Practices',
}

const initialForm = {
  criteria: '',
  keyIndicator: '',
  metricType: '',
}

const ExpertView = () => {
  // ARP standard states
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // Phase 1 form
  const [form, setForm] = useState(initialForm)
  const criteriaDesc = useMemo(() => criteriaDescMap?.[form.criteria] || '<Criteria Description>', [form.criteria])

  // Phase 2 table visibility
  const [showTable, setShowTable] = useState(false)

  // Table card controls (Department.jsx pattern)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'mNo', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dummy rows in local state (editable columns expectedWgt + expertComments)
  const [rows, setRows] = useState(() => [
    {
      id: 1,
      mNo: '1',
      smNo: '1.1',
      mType: 'QLM',
      wgt: '10',
      responseValue: '8',
      benchMark: '7',
      expectedWgt: '',
      expertComments: '',
    },
    {
      id: 2,
      mNo: '1',
      smNo: '1.2',
      mType: 'QNM',
      wgt: '15',
      responseValue: '12',
      benchMark: '10',
      expectedWgt: '',
      expertComments: '',
    },
    {
      id: 3,
      mNo: '2',
      smNo: '2.1',
      mType: 'QLM',
      wgt: '20',
      responseValue: '18',
      benchMark: '16',
      expectedWgt: '',
      expertComments: '',
    },
    {
      id: 4,
      mNo: '2',
      smNo: '2.2',
      mType: 'QNM',
      wgt: '25',
      responseValue: '20',
      benchMark: '22',
      expectedWgt: '',
      expertComments: '',
    },
    {
      id: 5,
      mNo: '3',
      smNo: '3.1',
      mType: 'QLM',
      wgt: '30',
      responseValue: '28',
      benchMark: '25',
      expectedWgt: '',
      expertComments: '',
    },
  ])

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const onFormChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  // ---------- Header actions ----------
  const onAddNew = () => {
    setIsEdit(true)
    setSelectedId(null)
    setForm(initialForm)
    setShowTable(false)
    setSearch('')
    setSort({ key: 'mNo', dir: 'asc' })
    setPage(1)
    setPageSize(10)
  }

  const onView = () => {
    setIsEdit(false)
    setShowTable(true)
  }

  // ---------- Phase 1 buttons ----------
  const onSearch = () => {
    const anyFilled = Boolean(form.criteria || form.keyIndicator || form.metricType)
    if (!anyFilled) return
    setShowTable(true)
  }

  const onReset = () => {
    setForm(initialForm)
    setShowTable(false)
    setSelectedId(null)
    setSearch('')
  }

  const onCancel = () => {
    setForm(initialForm)
    setShowTable(false)
    setSelectedId(null)
    setIsEdit(false)
    setSearch('')
  }

  // ---------- Sorting helpers ----------
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

  // ---------- Filter + sort ----------
  const filteredSorted = useMemo(() => {
    const q = normalize(search)
    let data = rows

    // Filter also by Phase 1 inputs (criteria/keyIndicator/metricType) using dummy matching logic
    const mt = normalize(form.metricType)
    if (mt) data = data.filter((r) => normalize(r.mType) === mt)

    if (q) data = data.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) => normalize(a?.[key]).localeCompare(normalize(b?.[key])))
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [rows, search, sort, form.metricType])

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)

  const pageRows = useMemo(() => filteredSorted.slice(startIdx, endIdx), [filteredSorted, startIdx, endIdx])

  // ---------- Editable cells ----------
  const onRowChange = (rowId, key) => (e) => {
    const value = e?.target?.value ?? ''
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)))
  }

  // ---------- Header action buttons (table card) ----------
  const onViewSelected = () => {
    // Hook your view action here
  }
  const onEditSelected = () => {
    // Hook your edit action here
  }
  const onDeleteSelected = () => {
    // Hook your delete action here
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* CARD A — Header Action Card */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>QUALITY INDICATOR FRAMEWORKS (QIF)</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="View" icon="view" color="info" onClick={onView} />
            </div>
          </CCardHeader>
        </CCard>

        {/* CARD B — Phase 1: QIF Form */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Quality Indicator Frameworks (QIF)</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3 align-items-center">
                <CCol md={2}>
                  <CFormLabel>Choose Criteria</CFormLabel>
                </CCol>
                <CCol md={2}>
                  <CFormSelect value={form.criteria} onChange={onFormChange('criteria')} disabled={!isEdit}>
                    <option value="">Select</option>
                    {criteriaOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel className="text-medium-emphasis">{criteriaDesc}</CFormLabel>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Key Indicator</CFormLabel>
                </CCol>
                <CCol md={1}>
                  <CFormSelect value={form.keyIndicator} onChange={onFormChange('keyIndicator')} disabled={!isEdit}>
                    <option value="">Select</option>
                    {keyIndicatorOptions.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={1}>
                  <CFormLabel>Choose Metric Type</CFormLabel>
                </CCol>
                <CCol md={2}>
                  <CFormSelect value={form.metricType} onChange={onFormChange('metricType')} disabled={!isEdit}>
                    <option value="">Select</option>
                    {metricTypeOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Search" icon="search" color="info" onClick={onSearch} />
                  <ArpButton label="Reset" icon="reset" color="warning" onClick={onReset} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* CARD C — Phase 2: Expert View Table */}
        {showTable && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Key Indicator | Total Weightage</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                {/* Search */}
                <CInputGroup size="sm" style={{ width: 260 }}>
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </CInputGroup>

                {/* Page size */}
                <CFormSelect
                  size="sm"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ width: 90 }}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </CFormSelect>

                {/* ARP standard action circle buttons */}
                <div className="d-flex align-items-center gap-2 flex-nowrap">
                  <ArpIconButton icon="view" color="info" tooltip="View" onClick={onViewSelected} disabled={!selectedId} />
                  <ArpIconButton icon="edit" color="warning" tooltip="Edit" onClick={onEditSelected} disabled={!selectedId} />
                  <ArpIconButton icon="delete" color="danger" tooltip="Delete" onClick={onDeleteSelected} disabled={!selectedId} />
                </div>
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive bordered className="mb-2">
                <CTableHead>
                  <CTableRow>
                    {/* ARP standard selection column */}
                    <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>

                    <CTableHeaderCell role="button" onClick={() => sortToggle('mNo')}>
                      M. No.{sortIndicator('mNo')}
                    </CTableHeaderCell>
                    <CTableHeaderCell role="button" onClick={() => sortToggle('smNo')}>
                      S. M. No.{sortIndicator('smNo')}
                    </CTableHeaderCell>
                    <CTableHeaderCell role="button" onClick={() => sortToggle('mType')}>
                      M. Type{sortIndicator('mType')}
                    </CTableHeaderCell>
                    <CTableHeaderCell role="button" onClick={() => sortToggle('wgt')}>
                      WGT{sortIndicator('wgt')}
                    </CTableHeaderCell>
                    <CTableHeaderCell role="button" onClick={() => sortToggle('responseValue')}>
                      Response Value{sortIndicator('responseValue')}
                    </CTableHeaderCell>
                    <CTableHeaderCell role="button" onClick={() => sortToggle('benchMark')}>
                      Bench Mark{sortIndicator('benchMark')}
                    </CTableHeaderCell>

                    {/* As per spec: 7th col textbox */}
                    <CTableHeaderCell>Expected WGT</CTableHeaderCell>

                    {/* As per spec: circle icon view */}
                    <CTableHeaderCell className="text-center" style={{ width: 90 }}>
                      Action
                    </CTableHeaderCell>

                    {/* As per spec: textbox */}
                    <CTableHeaderCell>Expert Comments</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {pageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={10} className="text-center text-medium-emphasis">
                        No records found
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    pageRows.map((r) => (
                      <CTableRow key={r.id} active={selectedId === r.id}>
                        <CTableDataCell>
                          <CFormCheck
                            type="radio"
                            name="expertSelect"
                            checked={selectedId === r.id}
                            onChange={() => setSelectedId(r.id)}
                          />
                        </CTableDataCell>

                        <CTableDataCell>{r.mNo}</CTableDataCell>
                        <CTableDataCell>{r.smNo}</CTableDataCell>
                        <CTableDataCell>{r.mType}</CTableDataCell>
                        <CTableDataCell>{r.wgt}</CTableDataCell>
                        <CTableDataCell>{r.responseValue}</CTableDataCell>
                        <CTableDataCell>{r.benchMark}</CTableDataCell>

                        <CTableDataCell style={{ minWidth: 140 }}>
                          <CFormInput
                            value={r.expectedWgt}
                            onChange={onRowChange(r.id, 'expectedWgt')}
                            placeholder="Enter"
                            disabled={!isEdit}
                          />
                        </CTableDataCell>

                        <CTableDataCell className="text-center">
                          <ArpIconButton icon="view" color="info" tooltip="View" onClick={() => {}} />
                        </CTableDataCell>

                        <CTableDataCell style={{ minWidth: 220 }}>
                          <CFormInput
                            value={r.expertComments}
                            onChange={onRowChange(r.id, 'expertComments')}
                            placeholder="Enter comments"
                            disabled={!isEdit}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              
              <div className="d-flex justify-content-end gap-2 my-3">
                <ArpButton label="Save" icon="save" color="success" onClick={() => {}} disabled={!isEdit} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
              </div>
<ArpPagination
                size="sm"
                align="end"
                page={safePage}
                totalPages={totalPages}
                onChange={setPage}
                prevText="Previous"
                nextText="Next"
              />
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default ExpertView
