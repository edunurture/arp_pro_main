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
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CPagination,
  CPaginationItem,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'

import { ArpButton, ArpIconButton } from '../../components/common'

const initialForm = {
  academicYear: '',
  regulationCode: '',
  programmeCode: '',
  programme: '',
  batch: '',
  semester: '',
}

const RegulationMapConfiguration = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState(initialForm)

  // Table UX (same standard as Courses/Department)
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1) // 1-based
  const [pageSize, setPageSize] = useState(10)

  // Optional: show table after Search (matches HTML "Search" intent)
  const [tableVisible, setTableVisible] = useState(true)

  // Upload ref (if later needed)
  const fileRef = useRef(null)

  // Sample dropdown values (replace with API)
  const academicYears = ['2025 - 26', '2026 - 27']
  const regulationCodes = ['N26', 'N27', 'REG25-26']
  const programmeCodes = ['26MBA', '27MCA', '26MCA', '27MBA']
  const programmes = ['MBA', 'MCA']
  const batches = ['2025 - 26', '2026 - 27']
  const semesters = ['Sem-1', 'Sem-3', 'Sem-5']

  // Sample table rows (replace with API)
  const [rows] = useState([
    {
      id: 1,
      academicYear: '2025 - 26',
      regulationCode: 'N26',
      programmeCode: '26MCA',
      programme: 'MCA',
      batch: '2025 - 26',
      status: 'Map Pending',
    },
    {
      id: 2,
      academicYear: '2025 - 26',
      regulationCode: 'N27',
      programmeCode: '27MBA',
      programme: 'MBA',
      batch: '2026 - 27',
      status: 'Map Done',
    },
  ])

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setIsEdit(true)
    setForm(initialForm)
    setSelectedId(null)
  }

  const onCancel = () => {
    setIsEdit(false)
    setForm(initialForm)
    setSelectedId(null)
    // keep table visible; you can set false if you want to hide
    // setTableVisible(false)
  }

  const onSearch = () => {
    // Hook API call here (based on selected filters)
    setTableVisible(true)
    // Reset paging when searching new criteria
    setPage(1)
  }

  const onView = () => {
    // Hook view logic (modal/page) here
    console.log('View selected row id:', selectedId)
  }

  const onEdit = () => {
    // Hook edit logic (load row into form) here
    console.log('Edit selected row id:', selectedId)
  }

  const onDelete = () => {
    // Hook delete logic here
    console.log('Delete selected row id:', selectedId)
  }

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const filtered = useMemo(() => {
    const q = normalize(search)
    if (!q) return rows
    return rows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))
  }, [rows, search])

  // Reset to first page when pageSize/search changes
  useEffect(() => setPage(1), [pageSize, search])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const pageRows = useMemo(() => filtered.slice(startIdx, endIdx), [filtered, startIdx, endIdx])

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>REGULATIONS MAP CONFIGURATIONS</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Map Courses to Curriculum Regulation</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYear} onChange={onChange('academicYear')} disabled={!isEdit}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Select Regulation Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.regulationCode}
                    onChange={onChange('regulationCode')}
                    disabled={!isEdit}
                  >
                    <option value="">Select Regulation Code</option>
                    {regulationCodes.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeCode} onChange={onChange('programmeCode')} disabled={!isEdit}>
                    <option value="">Select Programme Code</option>
                    {programmeCodes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Select Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programme} onChange={onChange('programme')} disabled={!isEdit}>
                    <option value="">Select Programme</option>
                    {programmes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Select Batches</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.batch} onChange={onChange('batch')} disabled={!isEdit}>
                    <option value="">Select Batches</option>
                    {batches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Select Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')} disabled={!isEdit}>
                    <option value="">Select Semester</option>
                    {semesters.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Actions */}
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton
                    label="Search"
                    icon="search"
                    color="primary"
                    type="button"
                    onClick={onSearch}
                    disabled={!isEdit}
                    title="Search"
                  />
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
        {tableVisible && (
          <CCard className="mb-3">
            {/* ✅ ONE ROW: Search + Page Size + Action Icons */}
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Status of Map Regulation</strong>

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
                      {n} / page
                    </option>
                  ))}
                </CFormSelect>

                <div className="d-flex gap-2 align-items-center flex-nowrap" style={{ flex: '0 0 auto' }}>
                  <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId} />
                  <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId} />
                  <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
                </div>
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>
                    <CTableHeaderCell>Academic Year</CTableHeaderCell>
                    <CTableHeaderCell>Regulation Code</CTableHeaderCell>
                    <CTableHeaderCell>Programme Code</CTableHeaderCell>
                    <CTableHeaderCell>Programme</CTableHeaderCell>
                    <CTableHeaderCell>Batch</CTableHeaderCell>
                    <CTableHeaderCell>Map Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <CFormCheck
                          type="radio"
                          name="mapRegSelect"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.academicYear}</CTableDataCell>
                      <CTableDataCell>{r.regulationCode}</CTableDataCell>
                      <CTableDataCell>{r.programmeCode}</CTableDataCell>
                      <CTableDataCell>{r.programme}</CTableDataCell>
                      <CTableDataCell>{r.batch}</CTableDataCell>
                      <CTableDataCell>{r.status}</CTableDataCell>
                    </CTableRow>
                  ))}

                  {pageRows.length === 0 && (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center text-muted py-4">
                        No records found
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>

              {/* ✅ CoursesConfiguration-style pagination */}
              <div className="d-flex justify-content-end mt-2">
                <CPagination size="sm" className="mb-0">
                  <CPaginationItem disabled={safePage <= 1} onClick={() => setPage(1)}>
                    «
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
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

export default RegulationMapConfiguration
