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
  cgpaFrom: '',
  cgpaTo: '',
  letterGrade: '',
  status: '',
}

const GradeSetup = () => {
  const tableRef = useRef(null)

  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState(initialForm)

  // Mock table data (hook API later)
  const [rows, setRows] = useState([
    { id: 'G001', cgpaFrom: '9.0', cgpaTo: '10.0', letterGrade: 'O', status: 'Active' },
    { id: 'G002', cgpaFrom: '8.0', cgpaTo: '8.9', letterGrade: 'A+', status: 'Active' },
    { id: 'G003', cgpaFrom: '7.0', cgpaTo: '7.9', letterGrade: 'A', status: 'Active' },
    { id: 'G004', cgpaFrom: '6.0', cgpaTo: '6.9', letterGrade: 'B+', status: 'Inactive' },
  ])

  const [selectedId, setSelectedId] = useState(null)

  // Table UX
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'cgpaFrom', dir: 'asc' })
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

  const onTableAdd = () => onAddNew()

  const onTableView = () => {
    const r = getSelectedRow()
    if (!r) return
    setForm((p) => ({
      ...p,
      cgpaFrom: r.cgpaFrom || '',
      cgpaTo: r.cgpaTo || '',
      letterGrade: r.letterGrade || '',
      status: r.status || '',
    }))
    setIsEdit(false)
  }

  const onTableEdit = () => {
    const r = getSelectedRow()
    if (!r) return
    setIsEdit(true)
    setForm((p) => ({
      ...p,
      cgpaFrom: r.cgpaFrom || '',
      cgpaTo: r.cgpaTo || '',
      letterGrade: r.letterGrade || '',
      status: r.status || '',
    }))
  }

  const onTableDelete = () => {
    if (!selectedId) return
    const next = rows.filter((r) => r.id !== selectedId)
    setRows(next)
    setSelectedId(next[0]?.id ?? null)
  }

  const validate = () => {
    const required = ['manualId', 'institutionCategory', 'cgpaFrom', 'cgpaTo', 'letterGrade', 'status']
    if (!required.every((k) => String(form[k] ?? '').trim())) return false

    const from = Number(form.cgpaFrom)
    const to = Number(form.cgpaTo)
    if (Number.isNaN(from) || Number.isNaN(to)) return false
    if (from > to) return false

    return true
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!validate()) return

    const id = `${String(form.letterGrade).trim()}-${String(form.cgpaFrom).trim()}-${String(form.cgpaTo).trim()}`
    const nextRow = {
      id,
      cgpaFrom: form.cgpaFrom,
      cgpaTo: form.cgpaTo,
      letterGrade: form.letterGrade,
      status: form.status,
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
      data = rows.filter((r) => [r.cgpaFrom, r.cgpaTo, r.letterGrade, r.status].map(normalize).join(' ').includes(q))
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
            <strong>GRADE SETUP</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton label="View" icon="view" color="primary" onClick={onView} title="View" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>ADD GRADES</strong>
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
                  <CFormLabel>CGPA Range From</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    step="0.1"
                    min={0}
                    max={10}
                    value={form.cgpaFrom}
                    onChange={onChange('cgpaFrom')}
                    disabled={!isEdit}
                    required
                    placeholder="0.0"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>CGPA Range To</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    step="0.1"
                    min={0}
                    max={10}
                    value={form.cgpaTo}
                    onChange={onChange('cgpaTo')}
                    disabled={!isEdit}
                    required
                    placeholder="0.0"
                  />
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Letter Grade</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.letterGrade}
                    onChange={onChange('letterGrade')}
                    disabled={!isEdit}
                    required
                    placeholder="Enter Letter Grade"
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Status</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.status} onChange={onChange('status')} disabled={!isEdit} required>
                    <option value="">Select</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
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
            <strong>GRADE DETAILS</strong>

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
                <ArpIconButton icon="edit" color="warning" title="Edit" onClick={onTableEdit} disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onTableDelete} disabled={!selectedId} />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>
                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('cgpaFrom')}>
                    CGPA Range From{sortIndicator('cgpaFrom')}
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('cgpaTo')}>
                    CGPA Range To{sortIndicator('cgpaTo')}
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('letterGrade')}>
                    Letter Grade{sortIndicator('letterGrade')}
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ width: 140, cursor: 'pointer' }} onClick={() => sortToggle('status')}>
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
                          name="gradeRow"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell className="text-center">{r.cgpaFrom}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.cgpaTo}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.letterGrade}</CTableDataCell>
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
      </CCol>
    </CRow>
  )
}

export default GradeSetup
