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
const EP_CRITERIA = [
  { id: 'EP001', label: 'EP001' },
  { id: 'EP002', label: 'EP002' },
  { id: 'EP003', label: 'EP003' },
]
const LABEL_IDS = ['LBL01', 'LBL02', 'LBL03']
const INPUT_FORMATS = ['Text', 'Number', 'Date']

const normalize = (v) =>
  String(v ?? '')
    .toLowerCase()
    .trim()

const initialForm = {
  manualId: '',
  epCriteriaNo: '',
  metricNumber: '',
  metricDescription: '',
  labelId: '',
  inputFormat: '',
  formulaPresent: '',
}

const AddEpMetrics = () => {
  const tableRef = useRef(null)

  // Mode
  const [isEdit, setIsEdit] = useState(false)

  // Form
  const [form, setForm] = useState(initialForm)

  // Table data (mock; hook your API later)
  const [rows, setRows] = useState([
    { id: 'EP001', epCriteriaNo: 'EP001', criteriaDescription: 'Academic Performance', totalMetricItems: '5' },
    { id: 'EP002', epCriteriaNo: 'EP002', criteriaDescription: 'add ep metrics', totalMetricItems: '3' },
    { id: 'EP003', epCriteriaNo: 'EP003', criteriaDescription: 'Research Activity', totalMetricItems: '4' },
  ])

  // Selection
  const [selectedId, setSelectedId] = useState(null)

  // Table UX
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'epCriteriaNo', dir: 'asc' })
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

  // Table actions
  const getSelectedRow = () => rows.find((r) => r.id === selectedId) || null

  const onTableAdd = () => {
    setIsEdit(true)
    setForm(initialForm)
    setSelectedId(null)
  }

  const onTableEdit = () => {
    const r = getSelectedRow()
    if (!r) return
    setIsEdit(true)
    // Only fields available in HTML page form; keep other fields blank
    setForm((p) => ({
      ...p,
      epCriteriaNo: r.epCriteriaNo || '',
      metricDescription: r.criteriaDescription || '',
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
      'epCriteriaNo',
      'metricNumber',
      'metricDescription',
      'labelId',
      'inputFormat',
      'formulaPresent',
    ]
    return required.every((k) => String(form[k] ?? '').trim())
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!validate()) return

    // Demo behavior: Upsert a row at EP criteria level (matches HTML's table sample)
    setRows((prev) => {
      const key = String(form.epCriteriaNo).trim()
      const exists = prev.find((r) => r.id === key)
      const nextRow = {
        id: key,
        epCriteriaNo: key,
        criteriaDescription: form.metricDescription,
        totalMetricItems: prev.find((r) => r.id === key)?.totalMetricItems ?? '1',
      }
      if (exists) return prev.map((r) => (r.id === key ? nextRow : r))
      return [nextRow, ...prev]
    })

    setSelectedId(String(form.epCriteriaNo).trim())
    setIsEdit(false)
    scrollToTable()
  }

  const onCancel = () => {
    setForm(initialForm)
    setIsEdit(false)
  }

  // Sorting / filtering
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
            <strong>ADD EP METRICS</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton label="View" icon="view" color="info" onClick={onView} title="View" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>ADD METRICS FOR EXTENDED PROFILE (EP)</strong>
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
                  <CFormLabel>Choose EP Criteria Number</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.epCriteriaNo} onChange={onChange('epCriteriaNo')} disabled={!isEdit} required>
                    <option value="">Select</option>
                    {EP_CRITERIA.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 2 */}
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

                {/* Row 3 */}
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
                  <CFormLabel>Choose Input Data Format</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.inputFormat} onChange={onChange('inputFormat')} disabled={!isEdit} required>
                    <option value="">Select</option>
                    {INPUT_FORMATS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 4 */}
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

                <CCol md={3}>
                  <CFormLabel>Upload EP - Data Template</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <ArpButton
                    label="Upload"
                    icon="upload"
                    color="secondary"
                    type="button"
                    disabled={!isEdit}
                    title="Upload EP - Data Template"
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
            <strong>METRICS FOR EXTENDED PROFILE</strong>

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

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('epCriteriaNo')}>
                    EP - Criteria Number{sortIndicator('epCriteriaNo')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('criteriaDescription')}>
                    Criteria Description{sortIndicator('criteriaDescription')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ width: 180, cursor: 'pointer' }} onClick={() => sortToggle('totalMetricItems')}>
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
                          name="epMetricRow"
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

export default AddEpMetrics
