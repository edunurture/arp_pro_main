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
  CInputGroup,
  CInputGroupText,
  CFormInput,
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
  scoreType: '', // 'CGPA Score' | 'Criteria Wise' | 'Metric Wise'
}

const SSRCGPAScore = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [form, setForm] = useState(initialForm)
  const [criteria, setCriteria] = useState('') // used only for Criteria Wise / Metric Wise

  const [activeTable, setActiveTable] = useState('') // 'cgpa' | 'criteria' | 'metric'

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: '', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

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

  // -----------------------------
  // Dummy datasets
  // -----------------------------
  const cgpaRows = useMemo(
    () => [
      { id: 1, criteriaNo: 'I', description: 'Curricular Aspects', weightage: 100, wgp: 780, gpa: 7.8 },
      { id: 2, criteriaNo: 'II', description: 'Teaching-Learning and Evaluation', weightage: 150, wgp: 1125, gpa: 7.5 },
      { id: 3, criteriaNo: 'III', description: 'Research, Innovations and Extension', weightage: 200, wgp: 1540, gpa: 7.7 },
      { id: 4, criteriaNo: 'IV', description: 'Infrastructure and Learning Resources', weightage: 100, wgp: 760, gpa: 7.6 },
      { id: 5, criteriaNo: 'V', description: 'Student Support and Progression', weightage: 100, wgp: 740, gpa: 7.4 },
      { id: 6, criteriaNo: 'VI', description: 'Governance, Leadership and Management', weightage: 80, wgp: 600, gpa: 7.5 },
      { id: 7, criteriaNo: 'VII', description: 'Institutional Values and Best Practices', weightage: 70, wgp: 525, gpa: 7.5 },
    ],
    [],
  )

  const criteriaWiseRows = useMemo(
    () => [
      { id: 101, ki: 'KI-1', description: 'Key Indicator 1', weightage: 30, totalMarks: 90, wgpa: 7.5, wgp: 225 },
      { id: 102, ki: 'KI-2', description: 'Key Indicator 2', weightage: 40, totalMarks: 120, wgpa: 7.8, wgp: 312 },
      { id: 103, ki: 'KI-3', description: 'Key Indicator 3', weightage: 30, totalMarks: 80, wgpa: 7.2, wgp: 216 },
      { id: 104, ki: 'KI-4', description: 'Key Indicator 4', weightage: 20, totalMarks: 60, wgpa: 7.6, wgp: 152 },
      { id: 105, ki: 'KI-5', description: 'Key Indicator 5', weightage: 25, totalMarks: 70, wgpa: 7.4, wgp: 185 },
      { id: 106, ki: 'KI-6', description: 'Key Indicator 6', weightage: 15, totalMarks: 50, wgpa: 7.0, wgp: 105 },
      { id: 107, ki: 'KI-7', description: 'Key Indicator 7', weightage: 10, totalMarks: 40, wgpa: 7.2, wgp: 72 },
    ],
    [],
  )

  const metricWiseRows = useMemo(
    () => [
      { id: 201, mno: '1.1', description: 'Metric 1.1', weightage: 10, totalMarks: 30, wgpa: 7.5, wgp: 75 },
      { id: 202, mno: '1.2', description: 'Metric 1.2', weightage: 15, totalMarks: 40, wgpa: 7.4, wgp: 111 },
      { id: 203, mno: '1.3', description: 'Metric 1.3', weightage: 20, totalMarks: 55, wgpa: 7.6, wgp: 152 },
      { id: 204, mno: '1.4', description: 'Metric 1.4', weightage: 25, totalMarks: 70, wgpa: 7.8, wgp: 195 },
      { id: 205, mno: '1.5', description: 'Metric 1.5', weightage: 10, totalMarks: 25, wgpa: 7.2, wgp: 72 },
      { id: 206, mno: '1.6', description: 'Metric 1.6', weightage: 10, totalMarks: 20, wgpa: 7.0, wgp: 70 },
      { id: 207, mno: '1.7', description: 'Metric 1.7', weightage: 10, totalMarks: 30, wgpa: 7.4, wgp: 74 },
    ],
    [],
  )

  // Dataset picker by active table
  const allRows = useMemo(() => {
    if (activeTable === 'criteria') return criteriaWiseRows
    if (activeTable === 'metric') return metricWiseRows
    return cgpaRows
  }, [activeTable, cgpaRows, criteriaWiseRows, metricWiseRows])

  // Filter + sort + paginate (table toolbar)
  const filteredSorted = useMemo(() => {
    const q = normalize(search)
    let data = allRows

    if (q) data = allRows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) => normalize(a?.[key]).localeCompare(normalize(b?.[key])))
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [allRows, search, sort])

  useEffect(() => {
    setPage(1)
  }, [search, pageSize, activeTable])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const pageRows = useMemo(
    () => filteredSorted.slice(startIdx, endIdx),
    [filteredSorted, startIdx, endIdx],
  )

  // Totals / overall grade (dummy)
  const cgpaTotals = useMemo(() => {
    const w = cgpaRows.reduce((a, r) => a + (Number(r.weightage) || 0), 0)
    const wgp = cgpaRows.reduce((a, r) => a + (Number(r.wgp) || 0), 0)
    const avg = w ? wgp / w : 0
    return { w, wgp, gpa: Number(avg).toFixed(2), overallGrade: 'A+' }
  }, [cgpaRows])

  const criteriaTotals = useMemo(() => {
    const w = criteriaWiseRows.reduce((a, r) => a + (Number(r.weightage) || 0), 0)
    const tm = criteriaWiseRows.reduce((a, r) => a + (Number(r.totalMarks) || 0), 0)
    const wgpa = criteriaWiseRows.reduce((a, r) => a + (Number(r.wgpa) || 0), 0)
    const wgp = criteriaWiseRows.reduce((a, r) => a + (Number(r.wgp) || 0), 0)
    return { w, tm, wgpa: Number(wgpa).toFixed(2), wgp }
  }, [criteriaWiseRows])

  const metricTotals = useMemo(() => {
    const w = metricWiseRows.reduce((a, r) => a + (Number(r.weightage) || 0), 0)
    const tm = metricWiseRows.reduce((a, r) => a + (Number(r.totalMarks) || 0), 0)
    const wgpa = metricWiseRows.reduce((a, r) => a + (Number(r.wgpa) || 0), 0)
    const wgp = metricWiseRows.reduce((a, r) => a + (Number(r.wgp) || 0), 0)
    return { w, tm, wgpa: Number(wgpa).toFixed(2), wgp }
  }, [metricWiseRows])

  // -----------------------------
  // Actions
  // -----------------------------
  const onAddNew = () => {
    setIsEdit(true)
    setSelectedId(null)
    setSearch('')
    setSort({ key: '', dir: 'asc' })
    setPage(1)
    setPageSize(10)
    setForm(initialForm)
    setCriteria('')
    setActiveTable('')
  }

  const onViewMode = () => setIsEdit(false)

  const onReset = () => {
    setForm(initialForm)
    setCriteria('')
    setSelectedId(null)
    setSearch('')
    setActiveTable('')
  }

  const onCancel = () => {
    setForm(initialForm)
    setCriteria('')
    setSelectedId(null)
    setSearch('')
    setActiveTable('')
    setIsEdit(false)
  }

  const onSearchClick = () => {
    if (!form.scoreType) return
    if (form.scoreType === 'CGPA Score') {
      setActiveTable('cgpa')
      return
    }
    if (form.scoreType === 'Criteria Wise') {
      setActiveTable('criteria')
      return
    }
    if (form.scoreType === 'Metric Wise') {
      setActiveTable('metric')
    }
  }

  const onPrint = () => {
    // Hook your print logic here
    window.print?.()
  }

  const onDownload = () => {
    // Hook your download logic here
    window.open('/templates/SSR_CGPA_Score_Template.xlsx', '_blank')
  }

  const onViewRow = () => {
    // Hook your view logic here
  }

  const onEditRow = () => {
    if (!selectedId) return
    setIsEdit(true)
  }

  const onDeleteRow = () => {
    if (!selectedId) return
    // eslint-disable-next-line no-alert
    alert('Delete action placeholder')
  }

  // Criteria selector shown only for Criteria Wise / Metric Wise tables
  const showCriteriaSelector = activeTable === 'criteria' || activeTable === 'metric'

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

        {/* B) Form Card */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Quality Indicator Frameworks (QIF)</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              {/* Phase 1 updated: Choose Criteria (Score Type) */}
              <div className="d-flex align-items-center gap-3 flex-nowrap" style={{ overflowX: 'auto' }}>
                <div style={{ minWidth: 140 }}>
                  <CFormLabel className="mb-0">Choose Criteria</CFormLabel>
                </div>

                <div style={{ minWidth: 220 }}>
                  <CFormSelect
                    value={form.scoreType}
                    onChange={(e) => setForm({ scoreType: e.target.value })}
                    disabled={!isEdit}
                  >
                    <option value="">Select</option>
                    <option value="CGPA Score">CGPA Score</option>
                    <option value="Criteria Wise">Criteria Wise</option>
                    <option value="Metric Wise">Metric Wise</option>
                  </CFormSelect>
                </div>
              </div>

              {/* Buttons row (Right aligned) */}
              <div className="d-flex justify-content-end gap-2 mt-3">
                <ArpButton label="Search" icon="search" color="info" onClick={onSearchClick} />
                <ArpButton label="Reset" icon="reset" color="warning" onClick={onReset} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        {/* C) Table Card (based on selection) */}
        {activeTable && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>
                {activeTable === 'cgpa'
                  ? 'CGPA Score'
                  : activeTable === 'criteria'
                    ? 'Criteria Wise Score'
                    : 'Metric Wise Score'}
              </strong>

              <div className="d-flex gap-2">
                <ArpButton label="Print" icon="print" color="secondary" onClick={onPrint} />
                <ArpButton label="Download" icon="download" color="danger" onClick={onDownload} />
              </div>
            </CCardHeader>

            <CCardBody>
              {/* Before table for Criteria Wise / Metric Wise */}
              {showCriteriaSelector && (
                <div
                  className="d-flex align-items-center justify-content-between gap-3 flex-nowrap mb-3"
                  style={{ overflowX: 'auto' }}
                >
                  <div className="d-flex align-items-center gap-2 flex-nowrap">
                    <div style={{ minWidth: 120 }}>
                      <CFormLabel className="mb-0">Choose Criteria</CFormLabel>
                    </div>
                    <div style={{ minWidth: 140 }}>
                      <CFormSelect value={criteria} onChange={(e) => setCriteria(e.target.value)} disabled={!isEdit}>
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
                  </div>

                  <div className="text-muted small">
                    {criteria ? `Showing ${activeTable === 'criteria' ? 'Key Indicators' : 'Metrics'} for Criteria ${criteria}` : ''}
                  </div>
                </div>
              )}

              {/* Toolbar row (ARP standard) */}
              <div className="d-flex align-items-center gap-2 flex-nowrap mb-2" style={{ overflowX: 'auto' }}>
                <CInputGroup style={{ maxWidth: 320 }}>
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
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

              {/* Tables */}
              {activeTable === 'cgpa' && (
                <CTable bordered hover responsive align="middle">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 56 }}></CTableHeaderCell>

                      <CTableHeaderCell role="button" onClick={() => sortToggle('criteriaNo')}>
                        Criteria No{sortIndicator('criteriaNo')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('description')}>
                        Description{sortIndicator('description')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('weightage')}>
                        Weightage{sortIndicator('weightage')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('wgp')}>
                        Weighted Grade Point{sortIndicator('wgp')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('gpa')}>
                        Grade Point Average{sortIndicator('gpa')}
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {pageRows.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={6} className="text-center py-4">
                          No records found
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      pageRows.map((r) => (
                        <CTableRow key={r.id} active={selectedId === r.id}>
                          <CTableDataCell>
                            <CFormCheck
                              type="radio"
                              name="ssr-cgpa-row"
                              checked={selectedId === r.id}
                              onChange={() => setSelectedId(r.id)}
                              aria-label={`Select row ${r.id}`}
                            />
                          </CTableDataCell>

                          <CTableDataCell>{r.criteriaNo}</CTableDataCell>
                          <CTableDataCell>{r.description}</CTableDataCell>
                          <CTableDataCell>{r.weightage}</CTableDataCell>
                          <CTableDataCell>{r.wgp}</CTableDataCell>
                          <CTableDataCell>{r.gpa}</CTableDataCell>
                        </CTableRow>
                      ))
                    )}

                    {/* Row 9: Total (first two columns merged) */}
                    <CTableRow className="fw-semibold">
                      <CTableDataCell></CTableDataCell>
                      <CTableDataCell colSpan={2}>Total</CTableDataCell>
                      <CTableDataCell>{cgpaTotals.w}</CTableDataCell>
                      <CTableDataCell>{cgpaTotals.wgp}</CTableDataCell>
                      <CTableDataCell>{cgpaTotals.gpa}</CTableDataCell>
                    </CTableRow>

                    {/* Row 10: Overall Grade */}
                    <CTableRow className="fw-semibold">
                      <CTableDataCell></CTableDataCell>
                      <CTableDataCell colSpan={3}></CTableDataCell>
                      <CTableDataCell>Overall Grade</CTableDataCell>
                      <CTableDataCell>{cgpaTotals.overallGrade}</CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>
              )}

              {activeTable === 'criteria' && (
                <CTable bordered hover responsive align="middle">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 56 }}></CTableHeaderCell>

                      <CTableHeaderCell role="button" onClick={() => sortToggle('ki')}>
                        KI{sortIndicator('ki')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('description')}>
                        Description{sortIndicator('description')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('weightage')}>
                        Weightage{sortIndicator('weightage')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('totalMarks')}>
                        Total Marks{sortIndicator('totalMarks')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('wgpa')}>
                        Weighted Grade Point Average{sortIndicator('wgpa')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('wgp')}>
                        Weighted Grade Point{sortIndicator('wgp')}
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {pageRows.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={7} className="text-center py-4">
                          No records found
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      pageRows.map((r) => (
                        <CTableRow key={r.id} active={selectedId === r.id}>
                          <CTableDataCell>
                            <CFormCheck
                              type="radio"
                              name="ssr-criteria-row"
                              checked={selectedId === r.id}
                              onChange={() => setSelectedId(r.id)}
                              aria-label={`Select row ${r.id}`}
                            />
                          </CTableDataCell>

                          <CTableDataCell>{r.ki}</CTableDataCell>
                          <CTableDataCell>{r.description}</CTableDataCell>
                          <CTableDataCell>{r.weightage}</CTableDataCell>
                          <CTableDataCell>{r.totalMarks}</CTableDataCell>
                          <CTableDataCell>{r.wgpa}</CTableDataCell>
                          <CTableDataCell>{r.wgp}</CTableDataCell>
                        </CTableRow>
                      ))
                    )}

                    {/* Row 9: Total */}
                    <CTableRow className="fw-semibold">
                      <CTableDataCell></CTableDataCell>
                      <CTableDataCell colSpan={2}>Total</CTableDataCell>
                      <CTableDataCell>{criteriaTotals.w}</CTableDataCell>
                      <CTableDataCell>{criteriaTotals.tm}</CTableDataCell>
                      <CTableDataCell>{criteriaTotals.wgpa}</CTableDataCell>
                      <CTableDataCell>{criteriaTotals.wgp}</CTableDataCell>
                    </CTableRow>

                    {/* Row 10: Total (as per prompt) */}
                    <CTableRow className="fw-semibold">
                      <CTableDataCell></CTableDataCell>
                      <CTableDataCell colSpan={2}>Total</CTableDataCell>
                      <CTableDataCell>{criteriaTotals.w}</CTableDataCell>
                      <CTableDataCell>{criteriaTotals.tm}</CTableDataCell>
                      <CTableDataCell>{criteriaTotals.wgpa}</CTableDataCell>
                      <CTableDataCell>{criteriaTotals.wgp}</CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>
              )}

              {activeTable === 'metric' && (
                <CTable bordered hover responsive align="middle">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 56 }}></CTableHeaderCell>

                      <CTableHeaderCell role="button" onClick={() => sortToggle('mno')}>
                        M.No{sortIndicator('mno')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('description')}>
                        Description{sortIndicator('description')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('weightage')}>
                        Weightage{sortIndicator('weightage')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('totalMarks')}>
                        Total Marks{sortIndicator('totalMarks')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('wgpa')}>
                        Weighted Grade Point Average{sortIndicator('wgpa')}
                      </CTableHeaderCell>
                      <CTableHeaderCell role="button" onClick={() => sortToggle('wgp')}>
                        Weighted Grade Point{sortIndicator('wgp')}
                      </CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>

                  <CTableBody>
                    {pageRows.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={7} className="text-center py-4">
                          No records found
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      pageRows.map((r) => (
                        <CTableRow key={r.id} active={selectedId === r.id}>
                          <CTableDataCell>
                            <CFormCheck
                              type="radio"
                              name="ssr-metric-row"
                              checked={selectedId === r.id}
                              onChange={() => setSelectedId(r.id)}
                              aria-label={`Select row ${r.id}`}
                            />
                          </CTableDataCell>

                          <CTableDataCell>{r.mno}</CTableDataCell>
                          <CTableDataCell>{r.description}</CTableDataCell>
                          <CTableDataCell>{r.weightage}</CTableDataCell>
                          <CTableDataCell>{r.totalMarks}</CTableDataCell>
                          <CTableDataCell>{r.wgpa}</CTableDataCell>
                          <CTableDataCell>{r.wgp}</CTableDataCell>
                        </CTableRow>
                      ))
                    )}

                    {/* Row 9: Total */}
                    <CTableRow className="fw-semibold">
                      <CTableDataCell></CTableDataCell>
                      <CTableDataCell colSpan={2}>Total</CTableDataCell>
                      <CTableDataCell>{metricTotals.w}</CTableDataCell>
                      <CTableDataCell>{metricTotals.tm}</CTableDataCell>
                      <CTableDataCell>{metricTotals.wgpa}</CTableDataCell>
                      <CTableDataCell>{metricTotals.wgp}</CTableDataCell>
                    </CTableRow>

                    {/* Row 10: Total (as per prompt) */}
                    <CTableRow className="fw-semibold">
                      <CTableDataCell></CTableDataCell>
                      <CTableDataCell colSpan={2}>Total</CTableDataCell>
                      <CTableDataCell>{metricTotals.w}</CTableDataCell>
                      <CTableDataCell>{metricTotals.tm}</CTableDataCell>
                      <CTableDataCell>{metricTotals.wgpa}</CTableDataCell>
                      <CTableDataCell>{metricTotals.wgp}</CTableDataCell>
                    </CTableRow>
                  </CTableBody>
                </CTable>
              )}

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
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default SSRCGPAScore
