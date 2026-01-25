import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  CFormCheck,
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
  criteria: '',
  keyIndicator: '',
  metricType: '',
}

const SSRIntrospection = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [form, setForm] = useState(initialForm)

  const [showTable, setShowTable] = useState(false)

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'mno', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const uploadRef = useRef(null)

  const criteriaDescription = useMemo(() => {
    if (!form.criteria) return '—'
    const map = {
      I: 'Curricular Aspects',
      II: 'Teaching-Learning and Evaluation',
      III: 'Research, Innovations and Extension',
      IV: 'Infrastructure and Learning Resources',
      V: 'Student Support and Progression',
      VI: 'Governance, Leadership and Management',
      VII: 'Institutional Values and Best Practices',
    }
    return map[form.criteria] || '—'
  }, [form.criteria])

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const rows = useMemo(
    () => [
      {
        id: 1,
        mno: '1.1',
        smno: '1.1.1',
        mtype: 'QLM',
        wgt: '10',
        responseValue: 'Yes',
        benchmark: '80%',
        expectedWgt: '8',
        expertComments: 'Meets benchmark',
      },
      {
        id: 2,
        mno: '1.2',
        smno: '1.2.1',
        mtype: 'QNM',
        wgt: '15',
        responseValue: '72%',
        benchmark: '75%',
        expectedWgt: '11',
        expertComments: 'Close to benchmark',
      },
      {
        id: 3,
        mno: '1.3',
        smno: '1.3.2',
        mtype: 'QLM',
        wgt: '20',
        responseValue: 'Partially',
        benchmark: 'Full compliance',
        expectedWgt: '14',
        expertComments: 'Needs improvement',
      },
      {
        id: 4,
        mno: '1.4',
        smno: '1.4.1',
        mtype: 'QNM',
        wgt: '25',
        responseValue: '88%',
        benchmark: '85%',
        expectedWgt: '21',
        expertComments: 'Above benchmark',
      },
    ],
    [],
  )

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

  const pageRows = useMemo(
    () => filteredSorted.slice(startIdx, endIdx),
    [filteredSorted, startIdx, endIdx],
  )

  const totals = useMemo(() => {
    const sumWgt = rows.reduce((acc, r) => acc + (Number(r.wgt) || 0), 0)
    const sumExpected = rows.reduce((acc, r) => acc + (Number(r.expectedWgt) || 0), 0)
    const totalMarks = sumExpected // placeholder
    const cgpaScore = sumWgt ? ((sumExpected / sumWgt) * 10).toFixed(2) : '0.00' // placeholder
    return { sumWgt, totalMarks, cgpaScore }
  }, [rows])

  const onFormChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setIsEdit(true)
    setSelectedId(null)
    setShowTable(false)
    setSearch('')
    setForm(initialForm)
  }

  const onViewMode = () => {
    setIsEdit(false)
  }

  const onSearch = () => {
    const hasAny = Boolean(form.criteria || form.keyIndicator || form.metricType)
    if (!hasAny) return
    setShowTable(true)
  }

  const onReset = () => {
    setForm(initialForm)
    setSelectedId(null)
    setSearch('')
    setShowTable(false)
  }

  const onCancel = () => {
    setForm(initialForm)
    setSelectedId(null)
    setShowTable(false)
    setIsEdit(false)
  }

  const onPrint = () => {
    // Hook your print logic here
    window.print?.()
  }

  const onDownload = () => {
    // Hook your download logic here
    window.open('/templates/SSR_Introspection_Template.xlsx', '_blank')
  }

  const onUploadClick = () => uploadRef.current?.click()

  const onViewRow = () => {
    // Hook your view action here
    setIsEdit(false)
  }

  const onEditRow = () => {
    // Hook your edit action here
    if (!selectedId) return
    setIsEdit(true)
  }

  const onDeleteRow = () => {
    // Hook your delete action here
    if (!selectedId) return
    // eslint-disable-next-line no-alert
    alert('Delete action placeholder')
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* A) Header Action Card (Top) */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>QUALITY INDICATOR FRAMEWORKS (QIF)</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="View" icon="view" color="info" onClick={onViewMode} />
            </div>
          </CCardHeader>
        </CCard>

        {/* B) Form Card (Configuration / Entry) */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Quality Indicator Frameworks (QIF)</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              {/* Phase 1: 1 Row × 7 Columns (single row; overflowX for small screens) */}
              <div
                className="d-flex align-items-center gap-3 flex-nowrap"
                style={{ overflowX: 'auto' }}
              >
                {/* 1) Label: Choose Criteria */}
                <div style={{ minWidth: 130 }}>
                  <CFormLabel className="mb-0">Choose Criteria</CFormLabel>
                </div>

                {/* 2) Select: Criteria */}
                <div style={{ minWidth: 120 }}>
                  <CFormSelect value={form.criteria} onChange={onFormChange('criteria')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                    <option value="V">V</option>
                    <option value="VI">VI</option>
                    <option value="VII">VII</option>
                  </CFormSelect>
                </div>

                {/* 3) Label: Criteria Description */}
                <div style={{ minWidth: 150 }}>
                  <CFormLabel className="mb-0">Criteria Description</CFormLabel>
                </div>

                {/* 4) Label value: <Criteria Description> */}
                <div style={{ minWidth: 260 }}>
                  <div className="fw-semibold text-truncate" title={criteriaDescription}>
                    {criteriaDescription}
                  </div>
                </div>

                {/* 5) Label: Key Indicator */}
                <div style={{ minWidth: 105 }}>
                  <CFormLabel className="mb-0">Key Indicator</CFormLabel>
                </div>

                {/* 6) Select: Key Indicator */}
                <div style={{ minWidth: 160 }}>
                  <CFormSelect
                    value={form.keyIndicator}
                    onChange={onFormChange('keyIndicator')}
                    disabled={!isEdit}
                  >
                    <option value="">Select Key Indicator</option>
                    <option value="KI-1">KI – 1</option>
                    <option value="KI-2">KI – 2</option>
                    <option value="KI-3">KI – 3</option>
                  </CFormSelect>
                </div>

                {/* 7) Label: Choose Metric Type */}
                <div style={{ minWidth: 150 }}>
                  <CFormLabel className="mb-0">Choose Metric Type</CFormLabel>
                </div>

                {/* 8) Select: Metric Type */}
                <div style={{ minWidth: 120 }}>
                  <CFormSelect
                    value={form.metricType}
                    onChange={onFormChange('metricType')}
                    disabled={!isEdit}
                  >
                    <option value="">Select</option>
                    <option value="QLM">QLM</option>
                    <option value="QNM">QNM</option>
                  </CFormSelect>
                </div>
              </div>

              {/* Buttons row (Right aligned) */}
              <div className="d-flex justify-content-end gap-2 mt-3">
                <ArpButton label="Search" icon="search" color="info" onClick={onSearch} />
                <ArpButton label="Reset" icon="reset" color="warning" onClick={onReset} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        {/* C) Table Card (Details + toolbar + table + pagination) */}
        {showTable && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Key Indicator Description | Total Weightage</strong>

              <div className="d-flex gap-2">
                <ArpButton label="Print" icon="print" color="secondary" onClick={onPrint} />
                <ArpButton label="Download" icon="download" color="danger" onClick={onDownload} />
                {/* Optional upload hook if you need later */}
                <input
                  type="file"
                  ref={uploadRef}
                  style={{ display: 'none' }}
                  onChange={() => {
                    // Hook your upload logic here
                  }}
                />
                <span style={{ display: 'none' }}>
                  <ArpButton label="Upload" icon="upload" color="info" onClick={onUploadClick} />
                </span>
              </div>
            </CCardHeader>

            <CCardBody>
              {/* Toolbar row (no wrap) */}
              <div className="d-flex align-items-center gap-2 flex-nowrap mb-2" style={{ overflowX: 'auto' }}>
                <CInputGroup style={{ maxWidth: 320 }}>
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput
                    placeholder="Search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </CInputGroup>

                <CFormSelect
                  size="sm"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ width: 110 }}
                  aria-label="Page size"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </CFormSelect>

                <div className="d-flex align-items-center gap-2 flex-nowrap ms-auto">
                  <ArpIconButton icon="view" title="View" onClick={onViewRow} disabled={!selectedId} />
                  <ArpIconButton icon="edit" title="Edit" onClick={onEditRow} disabled={!selectedId} />
                  <ArpIconButton icon="delete" title="Delete" onClick={onDeleteRow} disabled={!selectedId} />
                </div>
              </div>

              <CTable bordered hover responsive align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 56 }}></CTableHeaderCell>

                    <CTableHeaderCell role="button" onClick={() => sortToggle('mno')}>
                      M.No.{sortIndicator('mno')}
                    </CTableHeaderCell>
                    <CTableHeaderCell role="button" onClick={() => sortToggle('smno')}>
                      S.M.N.O{sortIndicator('smno')}
                    </CTableHeaderCell>
                    <CTableHeaderCell role="button" onClick={() => sortToggle('mtype')}>
                      M.Type{sortIndicator('mtype')}
                    </CTableHeaderCell>
                    <CTableHeaderCell role="button" onClick={() => sortToggle('wgt')}>
                      WGT{sortIndicator('wgt')}
                    </CTableHeaderCell>
                    <CTableHeaderCell role="button" onClick={() => sortToggle('responseValue')}>
                      Response Value{sortIndicator('responseValue')}
                    </CTableHeaderCell>
                    <CTableHeaderCell role="button" onClick={() => sortToggle('benchmark')}>
                      Benchmark{sortIndicator('benchmark')}
                    </CTableHeaderCell>
                    <CTableHeaderCell role="button" onClick={() => sortToggle('expectedWgt')}>
                      Expected WGT{sortIndicator('expectedWgt')}
                    </CTableHeaderCell>
                    <CTableHeaderCell role="button" onClick={() => sortToggle('expertComments')}>
                      Expert Comments{sortIndicator('expertComments')}
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {pageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={9} className="text-center py-4">
                        No records found
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    pageRows.map((r) => (
                      <CTableRow key={r.id} active={selectedId === r.id}>
                        <CTableDataCell>
                          <CFormCheck
                            type="radio"
                            name="ssr-introspection-row"
                            checked={selectedId === r.id}
                            onChange={() => setSelectedId(r.id)}
                            aria-label={`Select row ${r.id}`}
                          />
                        </CTableDataCell>

                        <CTableDataCell>{r.mno}</CTableDataCell>
                        <CTableDataCell>{r.smno}</CTableDataCell>
                        <CTableDataCell>{r.mtype}</CTableDataCell>
                        <CTableDataCell>{r.wgt}</CTableDataCell>
                        <CTableDataCell>{r.responseValue}</CTableDataCell>
                        <CTableDataCell>{r.benchmark}</CTableDataCell>
                        <CTableDataCell>{r.expectedWgt}</CTableDataCell>
                        <CTableDataCell>{r.expertComments}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              <div className="mt-2">
                <ArpPagination
                  size="sm"
                  align="end"
                  page={safePage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  prevText="Previous"
                  nextText="Next"
                />
              </div>

              {/* Totals grid (left aligned) */}
              <CRow className="g-3 mt-3">
                <CCol md={3}>
                  <CFormLabel>Total Weightage</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={totals.sumWgt} disabled />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Total Marks</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={totals.totalMarks} disabled />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>CGPA Score</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={totals.cgpaScore} disabled />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default SSRIntrospection
