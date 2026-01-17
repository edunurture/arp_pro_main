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
const CRITERIA_NUMBERS = ['C001', 'C002', 'C003']
const KEY_INDICATORS = ['KI01', 'KI02', 'KI03']
const INPUT_FORMATS = ['Text', 'Number', 'Date', 'File', 'Dropdown']
const LABEL_IDS = ['LBL01', 'LBL02', 'LBL03']

const normalize = (v) =>
  String(v ?? '')
    .toLowerCase()
    .trim()

const initialForm = {
  manualId: '',
  institutionCategory: '',
  criteriaNo: '',
  keyIndicator: '',
  metricNumber: '',
  metricDescription: '',
  category: '',
  weightage: '',
  marks: '',
  subMetricPresent: '',
  noOfSubMetrics: '',
  inputDataFormat: '',
  labelId: '',
  formulaPresent: '',
  dataTemplateAvailable: '',
  sopAvailable: '',
}

const MetricSetup = () => {
  const tableRef = useRef(null)

  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState(initialForm)

  // Mock table data (hook API later)
  const [rows, setRows] = useState([
    {
      id: 'MTR001',
      criteriaNo: 'C001',
      kiMetricNo: 'KI01-1.1',
      description: 'Student Enrollment',
      category: 'QNM',
      weightage: '10',
      subMetric: 'No',
      formula: 'Yes',
      dataTemplate: 'Yes',
    },
    {
      id: 'MTR002',
      criteriaNo: 'C002',
      kiMetricNo: 'KI02-2.3',
      description: 'Research Grants',
      category: 'QLM',
      weightage: '15',
      subMetric: 'Yes',
      formula: 'No',
      dataTemplate: 'No',
    },
    {
      id: 'MTR003',
      criteriaNo: 'C003',
      kiMetricNo: 'KI03-3.2',
      description: 'Extension Activities',
      category: 'QLM',
      weightage: '12',
      subMetric: 'NA',
      formula: 'No',
      dataTemplate: 'Yes',
    },
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
    // hook upload logic later
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
    // Populate minimal fields that map to table columns
    setForm((p) => ({
      ...p,
      criteriaNo: r.criteriaNo || '',
      metricDescription: r.description || '',
      category: r.category || '',
      weightage: r.weightage || '',
      subMetricPresent: r.subMetric || '',
      formulaPresent: r.formula || '',
      dataTemplateAvailable: r.dataTemplate || '',
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
      metricDescription: r.description || '',
      category: r.category || '',
      weightage: r.weightage || '',
      subMetricPresent: r.subMetric || '',
      formulaPresent: r.formula || '',
      dataTemplateAvailable: r.dataTemplate || '',
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
      'keyIndicator',
      'metricNumber',
      'metricDescription',
      'category',
      'weightage',
      'marks',
      'subMetricPresent',
      'inputDataFormat',
      'labelId',
      'formulaPresent',
      'dataTemplateAvailable',
      'sopAvailable',
    ]
    // noOfSubMetrics required only when Submetric Present is YES
    const baseOk = required.every((k) => String(form[k] ?? '').trim())
    if (!baseOk) return false
    if (String(form.subMetricPresent).toUpperCase() === 'YES') {
      return String(form.noOfSubMetrics ?? '').trim() !== ''
    }
    return true
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!validate()) return

    const id = String(form.metricNumber).trim() || `MTR-${Date.now()}`
    const kiMetricNo = `${form.keyIndicator}-${form.metricNumber}`

    const nextRow = {
      id,
      criteriaNo: form.criteriaNo,
      kiMetricNo,
      description: form.metricDescription,
      category: form.category,
      weightage: form.weightage,
      subMetric: form.subMetricPresent,
      formula: form.formulaPresent,
      dataTemplate: form.dataTemplateAvailable,
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
        [r.criteriaNo, r.kiMetricNo, r.description, r.category, r.weightage, r.subMetric, r.formula, r.dataTemplate]
          .map(normalize)
          .join(' ')
          .includes(q),
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
            <strong>METRIC SETUP</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton label="Upload" icon="upload" color="info" onClick={onUpload} title="Upload" />
              <ArpButton
                label="Download Template"
                icon="download"
                color="danger"
                onClick={onDownload}
                title="Download Template"
              />
              <ArpButton label="View" icon="view" color="primary" onClick={onView} title="View" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>METRIC SETUP</strong>
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
                  <CFormLabel>Choose Criteria Number</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.criteriaNo} onChange={onChange('criteriaNo')} disabled={!isEdit} required>
                    <option value="">Select</option>
                    {CRITERIA_NUMBERS.map((v) => (
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
                  <CFormSelect
                    value={form.keyIndicator}
                    onChange={onChange('keyIndicator')}
                    disabled={!isEdit}
                    required
                  >
                    <option value="">Select</option>
                    {KEY_INDICATORS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Metric Number</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.metricNumber}
                    onChange={onChange('metricNumber')}
                    disabled={!isEdit}
                    required
                    placeholder="Enter Metric Number"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Metric Description</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.metricDescription}
                    onChange={onChange('metricDescription')}
                    disabled={!isEdit}
                    required
                    placeholder="Enter Metric Description"
                  />
                </CCol>

                {/* Row 4 */}
                <CCol md={3}>
                  <CFormLabel>Choose Category</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.category} onChange={onChange('category')} disabled={!isEdit} required>
                    <option value="">Select</option>
                    <option value="QLM">QLM</option>
                    <option value="QNM">QNM</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Weightage</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.weightage}
                    onChange={onChange('weightage')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                {/* Row 5 */}
                <CCol md={3}>
                  <CFormLabel>Marks</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.marks}
                    onChange={onChange('marks')}
                    disabled={!isEdit}
                    required
                    placeholder="0"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Submetric Present</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.subMetricPresent}
                    onChange={onChange('subMetricPresent')}
                    disabled={!isEdit}
                    required
                  >
                    <option value="">Select</option>
                    <option value="NA">NA</option>
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </CFormSelect>
                </CCol>

                {/* Row 6 */}
                <CCol md={3}>
                  <CFormLabel>Number of Sub Metrics</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.noOfSubMetrics}
                    onChange={onChange('noOfSubMetrics')}
                    disabled={!isEdit || String(form.subMetricPresent).toUpperCase() !== 'YES'}
                    required={String(form.subMetricPresent).toUpperCase() === 'YES'}
                    placeholder="0"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Input Data Format</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.inputDataFormat}
                    onChange={onChange('inputDataFormat')}
                    disabled={!isEdit}
                    required
                  >
                    <option value="">Select</option>
                    {INPUT_FORMATS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 7 */}
                <CCol md={3}>
                  <CFormLabel>Choose Label ID</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.labelId} onChange={onChange('labelId')} disabled={!isEdit} required>
                    <option value="">Select</option>
                    {LABEL_IDS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Formula Present?</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.formulaPresent}
                    onChange={onChange('formulaPresent')}
                    disabled={!isEdit}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </CFormSelect>
                </CCol>

                {/* Row 8 */}
                <CCol md={3}>
                  <CFormLabel>Data Template Available?</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.dataTemplateAvailable}
                    onChange={onChange('dataTemplateAvailable')}
                    disabled={!isEdit}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>SOP Available?</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.sopAvailable} onChange={onChange('sopAvailable')} disabled={!isEdit} required>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </CFormSelect>
                </CCol>

                {/* Save / Cancel */}
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} title="Save" />
                  <ArpButton
                    label="Cancel"
                    icon="cancel"
                    color="secondary"
                    type="button"
                    onClick={onCancel}
                    title="Cancel"
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD ================= */}
        <CCard className="mb-3" ref={tableRef}>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>METRIC DETAILS</strong>

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

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('kiMetricNo')}>
                    KI Metric No{sortIndicator('kiMetricNo')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('description')}>
                    Description{sortIndicator('description')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ width: 110, cursor: 'pointer' }} onClick={() => sortToggle('category')}>
                    Category{sortIndicator('category')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ width: 110, cursor: 'pointer' }} onClick={() => sortToggle('weightage')}>
                    Weightage{sortIndicator('weightage')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ width: 120, cursor: 'pointer' }} onClick={() => sortToggle('subMetric')}>
                    Sub Metric{sortIndicator('subMetric')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ width: 110, cursor: 'pointer' }} onClick={() => sortToggle('formula')}>
                    Formula{sortIndicator('formula')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ width: 140, cursor: 'pointer' }} onClick={() => sortToggle('dataTemplate')}>
                    Data Template{sortIndicator('dataTemplate')}
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {loading ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center py-4">
                      <CSpinner size="sm" className="me-2" />
                      Loading...
                    </CTableDataCell>
                  </CTableRow>
                ) : pageRows.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center py-4">
                      No records found.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <input
                          type="radio"
                          name="metricRow"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell className="text-center">{r.criteriaNo}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.kiMetricNo}</CTableDataCell>
                      <CTableDataCell>{r.description}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.category}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.weightage}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.subMetric}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.formula}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.dataTemplate}</CTableDataCell>
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

export default MetricSetup
