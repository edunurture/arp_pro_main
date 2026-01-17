import React, { useMemo, useState, useEffect } from 'react'
import { ArpButton } from '../../components/common'

import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CPagination,
  CPaginationItem,
  CSpinner,
} from '@coreui/react-pro'

const initialForm = {
  name: '',
  year: '',
  type: '',
  category: '',
  address: '',
  district: '',
  state: 'Tamil Nadu',
  pincode: '',
  affiliatedUniversity: '',
  autonomous: '',
  accredited: '',
  accreditedBy: '',
}

const Institution = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(1)
  const [form, setForm] = useState(initialForm)

  // Table UX state
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1) // 1-based
  const [sort, setSort] = useState({ key: 'id', dir: 'asc' }) // dir: 'asc' | 'desc'
  const [loading, setLoading] = useState(false)

  // Year dropdown: 2000 → current year
  const years = useMemo(() => {
    const current = new Date().getFullYear()
    const arr = []
    for (let y = 2000; y <= current; y++) arr.push(String(y))
    return arr
  }, [])

  // Sample rows (replace later with API)
  const [rows] = useState([
    {
      id: 1,
      name: 'ABC College of Arts and Science College',
      year: '2016',
      type: 'Arts and Science College',
      category: 'Private Self-Financing',
      address: 'Pollachi',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '642001',
    },
  ])

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setForm(initialForm)
    setSelectedId(null)
    setIsEdit(true)
  }

  const onEdit = () => {
    const selected = rows.find((r) => r.id === selectedId)
    if (!selected) return
    setForm((p) => ({
      ...p,
      name: selected.name || '',
      year: selected.year || '',
      type: selected.type || '',
      category: selected.category || '',
      address: selected.address || '',
      district: selected.district || '',
      state: selected.state || 'Tamil Nadu',
      pincode: selected.pincode || '',
    }))
    setIsEdit(true)
  }

  const onCancel = () => setIsEdit(false)

  const onSave = (e) => {
    e.preventDefault()
    // Later: API call
    setIsEdit(false)
  }

  // Reset paging when search/pageSize changes
  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  // Helpers
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

  // Filter + Sort
  const filteredSorted = useMemo(() => {
    const q = normalize(search)
    let data = rows

    if (q) {
      data = rows.filter((r) => {
        const hay = [
          r.id,
          r.name,
          r.year,
          r.type,
          r.category,
          r.address,
          r.district,
          r.state,
          r.pincode,
        ]
          .map(normalize)
          .join(' ')
        return hay.includes(q)
      })
    }

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) => {
      const av = a?.[key]
      const bv = b?.[key]

      // numeric compare for id/year if they look numeric
      const an = Number(av)
      const bn = Number(bv)
      const bothNumeric = !Number.isNaN(an) && !Number.isNaN(bn) && av !== '' && bv !== ''

      if (bothNumeric) {
        return an - bn
      }
      return String(av ?? '').localeCompare(String(bv ?? ''), undefined, { sensitivity: 'base' })
    })

    return dir === 'asc' ? sorted : sorted.reverse()
  }, [rows, search, sort])

  // Pagination
  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)

  const pageRows = useMemo(() => {
    return filteredSorted.slice(startIdx, endIdx)
  }, [filteredSorted, startIdx, endIdx])

  // Keep page in range if totalPages shrinks
  useEffect(() => {
    if (page !== safePage) setPage(safePage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages])

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER ACTIONS */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INSTITUTION SETUP</strong>

            <div className="d-flex gap-2">
              <ArpButton
                label="Add New"
                icon="add"
                color="purple"
                onClick={onAddNew}
                title="Add New Record"
              />

              <ArpButton
                label="Edit"
                icon="edit"
                color="primary"
                onClick={onEdit}
                disabled={!selectedId}
                title="Edit Selected Record"
              />

              <ArpButton
                label="Delete"
                icon="delete"
                color="danger"
                disabled={!selectedId}
                title="Delete Selected Record"
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* INSTITUTION CONFIGURATION (Form) */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Institution Configuration</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={3}>
                  <CFormLabel>Name of the Institution</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.name} onChange={onChange('name')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Year of Establishment</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.year} onChange={onChange('year')} disabled={!isEdit}>
                    <option value="">Select</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Type of Institution</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.type} onChange={onChange('type')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Arts & Science College">Arts &amp; Science College</option>
                    <option value="Engineering College">Engineering College</option>
                    <option value="Health Science Institutions">Health Science Institutions</option>
                    <option value="Deemed to be University">Deemed to be University</option>
                    <option value="University">University</option>
                    <option value="Polytechnic">Polytechnic</option>
                    <option value="ITI">ITI</option>
                    <option value="School">School</option>
                    <option value="Others">Others</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Institution Category</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.category}
                    onChange={onChange('category')}
                    disabled={!isEdit}
                  />
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Address</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.address}
                    onChange={onChange('address')}
                    disabled={!isEdit}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>District</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.district}
                    onChange={onChange('district')}
                    disabled={!isEdit}
                  />
                </CCol>

                {/* Row 4 */}
                <CCol md={3}>
                  <CFormLabel>State</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.state} onChange={onChange('state')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Pincode</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.pincode}
                    onChange={onChange('pincode')}
                    disabled={!isEdit}
                  />
                </CCol>

                {/* Row 5 */}
                <CCol md={3}>
                  <CFormLabel>Affiliated University</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.affiliatedUniversity}
                    onChange={onChange('affiliatedUniversity')}
                    disabled={!isEdit}
                  >
                    <option value="">Select</option>
                    <option value="Anna University">Anna University</option>
                    <option value="University of Madras">University of Madras</option>
                    <option value="Bharathiar University">Bharathiar University</option>
                    <option value="Bharathidasan University">Bharathidasan University</option>
                    <option value="Alagappa University">Alagappa University</option>
                    <option value="Others">Others</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Whether Autonomous Granted?</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.autonomous}
                    onChange={onChange('autonomous')}
                    disabled={!isEdit}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </CFormSelect>
                </CCol>

                {/* Row 6 */}
                <CCol md={3}>
                  <CFormLabel>Whether Institution got accreditation?</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.accredited}
                    onChange={onChange('accredited')}
                    disabled={!isEdit}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Accredited By</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.accreditedBy}
                    onChange={onChange('accreditedBy')}
                    disabled={!isEdit}
                  >
                    <option value="">Select</option>
                    <option value="NAAC">NAAC</option>
                    <option value="NBA">NBA</option>
                    <option value="Others">Others</option>
                  </CFormSelect>
                </CCol>

                {/* Actions */}
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton
                    label="Save"
                    icon="save"
                    color="success"
                    type="submit"
                    disabled={!isEdit}
                    title="Save"
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

        {/* INSTITUTION DETAILS TABLE */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <strong>Institution Details</strong>

            {/* Search + Page size */}
            <div className="d-flex align-items-center gap-2">
              <CFormInput
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 260 }}
              />

              <CFormSelect
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{ width: 120 }}
                title="Rows per page"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </CFormSelect>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable bordered striped hover responsive className="mb-2">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>

                  <CTableHeaderCell
                    style={{ width: 80, cursor: 'pointer' }}
                    onClick={() => sortToggle('id')}
                    title="Sort by ID"
                  >
                    ID{sortIndicator('id')}
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{ cursor: 'pointer' }}
                    onClick={() => sortToggle('name')}
                    title="Sort by Name"
                  >
                    Name{sortIndicator('name')}
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{ width: 90, cursor: 'pointer' }}
                    onClick={() => sortToggle('year')}
                    title="Sort by Year"
                  >
                    Year{sortIndicator('year')}
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{ cursor: 'pointer' }}
                    onClick={() => sortToggle('type')}
                    title="Sort by Type"
                  >
                    Type{sortIndicator('type')}
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{ cursor: 'pointer' }}
                    onClick={() => sortToggle('category')}
                    title="Sort by Category"
                  >
                    Category{sortIndicator('category')}
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{ cursor: 'pointer' }}
                    onClick={() => sortToggle('address')}
                    title="Sort by Address"
                  >
                    Address{sortIndicator('address')}
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{ cursor: 'pointer' }}
                    onClick={() => sortToggle('district')}
                    title="Sort by District"
                  >
                    District{sortIndicator('district')}
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{ cursor: 'pointer' }}
                    onClick={() => sortToggle('state')}
                    title="Sort by State"
                  >
                    State{sortIndicator('state')}
                  </CTableHeaderCell>

                  <CTableHeaderCell
                    style={{ width: 110, cursor: 'pointer' }}
                    onClick={() => sortToggle('pincode')}
                    title="Sort by Pincode"
                  >
                    Pincode{sortIndicator('pincode')}
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {loading ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center py-4">
                      <CSpinner size="sm" className="me-2" />
                      Loading...
                    </CTableDataCell>
                  </CTableRow>
                ) : pageRows.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center py-4">
                      No records found.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <input
                          type="radio"
                          name="institutionRow"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell className="text-center">{r.id}</CTableDataCell>
                      <CTableDataCell>{r.name}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.year}</CTableDataCell>
                      <CTableDataCell>{r.type}</CTableDataCell>
                      <CTableDataCell>{r.category}</CTableDataCell>
                      <CTableDataCell>{r.address}</CTableDataCell>
                      <CTableDataCell>{r.district}</CTableDataCell>
                      <CTableDataCell>{r.state}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.pincode}</CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>

            {/* Footer: Showing + Pagination */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="small text-medium-emphasis">
                {total === 0 ? 'Showing 0–0 of 0' : `Showing ${startIdx + 1}–${endIdx} of ${total}`}
              </div>

              <CPagination align="end" className="mb-0">
                <CPaginationItem
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </CPaginationItem>

                {/* Simple page window */}
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
                  Next
                </CPaginationItem>
              </CPagination>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Institution
