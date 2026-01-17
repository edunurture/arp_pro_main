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
  expertName: '',
  designation: '',
  experienceYears: '',
  institutionName: '',
  email: '',
  contactNumber: '',
  naacAssessor: '',
  profileFileName: '',
}

const ExpertPanelSetup = () => {
  const tableRef = useRef(null)
  const profileInputRef = useRef(null)

  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState(initialForm)

  // Mock table data (hook API later)
  const [rows, setRows] = useState([
    {
      id: 'EXP001',
      expertName: 'Dr. S. Kumar',
      designation: 'Professor',
      experienceYears: '18',
      institutionName: 'ABC University',
      email: 'kumar@example.com',
      contactNumber: '9876543210',
      naacAssessor: 'Yes',
      profileFileName: 'profile_kumar.pdf',
    },
    {
      id: 'EXP002',
      expertName: 'Ms. R. Priya',
      designation: 'Industry Expert',
      experienceYears: '10',
      institutionName: 'XYZ Pvt Ltd',
      email: 'priya@example.com',
      contactNumber: '9123456780',
      naacAssessor: 'No',
      profileFileName: '',
    },
  ])

  const [selectedId, setSelectedId] = useState(null)

  // Table UX
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'expertName', dir: 'asc' })
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

  // Upload profile
  const openProfilePicker = () => profileInputRef.current?.click?.()
  const onProfileSelected = (file) => {
    setForm((p) => ({ ...p, profileFileName: file?.name || '' }))
  }

  // Table actions
  const getSelectedRow = () => rows.find((r) => r.id === selectedId) || null

  const onTableView = () => {
    const r = getSelectedRow()
    if (!r) return
    setForm((p) => ({
      ...p,
      expertName: r.expertName || '',
      designation: r.designation || '',
      experienceYears: r.experienceYears || '',
      institutionName: r.institutionName || '',
      email: r.email || '',
      contactNumber: r.contactNumber || '',
      naacAssessor: r.naacAssessor || '',
      profileFileName: r.profileFileName || '',
    }))
    setIsEdit(false)
  }

  const onTableEdit = () => {
    const r = getSelectedRow()
    if (!r) return
    setIsEdit(true)
    setForm((p) => ({
      ...p,
      expertName: r.expertName || '',
      designation: r.designation || '',
      experienceYears: r.experienceYears || '',
      institutionName: r.institutionName || '',
      email: r.email || '',
      contactNumber: r.contactNumber || '',
      naacAssessor: r.naacAssessor || '',
      profileFileName: r.profileFileName || '',
    }))
  }

  const onDownload = () => {
    // hook file download later (profile file)
  }

  const onDelete = () => {
    if (!selectedId) return
    const next = rows.filter((r) => r.id !== selectedId)
    setRows(next)
    setSelectedId(next[0]?.id ?? null)
  }

  const validate = () => {
    const required = [
      'manualId',
      'institutionCategory',
      'expertName',
      'designation',
      'experienceYears',
      'institutionName',
      'email',
      'contactNumber',
      'naacAssessor',
    ]
    if (!required.every((k) => String(form[k] ?? '').trim())) return false
    return true
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!validate()) return

    const id =
      selectedId ||
      `EXP-${String(form.expertName).trim().replace(/\s+/g, '-').toUpperCase()}-${String(Date.now()).slice(-5)}`

    const nextRow = {
      id,
      expertName: form.expertName,
      designation: form.designation,
      experienceYears: form.experienceYears,
      institutionName: form.institutionName,
      email: form.email,
      contactNumber: form.contactNumber,
      naacAssessor: form.naacAssessor,
      profileFileName: form.profileFileName,
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
        [r.expertName, r.designation, r.experienceYears, r.institutionName, r.email, r.contactNumber]
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
            <strong>EXPERT PANEL</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton label="View" icon="view" color="primary" onClick={onView} title="View" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>ADD PANEL OF EXPERTS</strong>
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
                  <CFormLabel>Expert Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.expertName} onChange={onChange('expertName')} disabled={!isEdit} required />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Designation</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.designation} onChange={onChange('designation')} disabled={!isEdit} required />
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Year of Experience</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    min={0}
                    value={form.experienceYears}
                    onChange={onChange('experienceYears')}
                    disabled={!isEdit}
                    required
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Institution Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.institutionName}
                    onChange={onChange('institutionName')}
                    disabled={!isEdit}
                    required
                  />
                </CCol>

                {/* Row 4 */}
                <CCol md={3}>
                  <CFormLabel>E-Mail ID</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput type="email" value={form.email} onChange={onChange('email')} disabled={!isEdit} required />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Contact Number</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.contactNumber}
                    onChange={onChange('contactNumber')}
                    disabled={!isEdit}
                    required
                  />
                </CCol>

                {/* Row 5 */}
                <CCol md={3}>
                  <CFormLabel>NAAC Assessor</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.naacAssessor}
                    onChange={onChange('naacAssessor')}
                    disabled={!isEdit}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Upload Profile</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <div className="d-flex align-items-center gap-2">
                    <ArpButton
                      label="Upload"
                      icon="upload"
                      color="warning"
                      type="button"
                      title="Upload Profile"
                      disabled={!isEdit}
                      onClick={openProfilePicker}
                    />
                    <small className="text-muted" title={form.profileFileName}>
                      {form.profileFileName ? form.profileFileName : 'No file chosen'}
                    </small>

                    <input
                      type="file"
                      style={{ display: 'none' }}
                      ref={profileInputRef}
                      onChange={(e) => onProfileSelected(e.target.files?.[0])}
                    />
                  </div>
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
            <strong>PANEL OF EXPERTS</strong>

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
                <ArpIconButton icon="view" color="purple" title="View" onClick={onTableView} disabled={!selectedId} />
                <ArpIconButton icon="edit" color="warning" title="Edit" onClick={onTableEdit} disabled={!selectedId} />
                <ArpIconButton icon="download" color="success" title="Download" onClick={onDownload} disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('expertName')}>
                    Expert Name{sortIndicator('expertName')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('designation')}>
                    Designation{sortIndicator('designation')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ width: 160, cursor: 'pointer' }} onClick={() => sortToggle('experienceYears')}>
                    Year of Experience{sortIndicator('experienceYears')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('institutionName')}>
                    Institution Name{sortIndicator('institutionName')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('email')}>
                    E-Mail ID{sortIndicator('email')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ width: 160, cursor: 'pointer' }} onClick={() => sortToggle('contactNumber')}>
                    Contact Number{sortIndicator('contactNumber')}
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
                          name="expertRow"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>

                      <CTableDataCell>{r.expertName}</CTableDataCell>
                      <CTableDataCell>{r.designation}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.experienceYears}</CTableDataCell>
                      <CTableDataCell>{r.institutionName}</CTableDataCell>
                      <CTableDataCell>{r.email}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.contactNumber}</CTableDataCell>
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

export default ExpertPanelSetup
