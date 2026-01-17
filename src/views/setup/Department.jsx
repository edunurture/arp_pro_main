import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  CFormTextarea,
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'

import { ArpButton, ArpIconButton, ArpPagination } from '../../components/common'
const initialForm = {
  deptCode: '',
  deptName: '',
  estYear: '',
  nbaAccredited: '',
  objectives: '',
  vision: '',
  mission: '',
  goal: '',
}

const Department = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedCode, setSelectedCode] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(initialForm)

  // Sorting
  const [sort, setSort] = useState({ key: 'deptCode', dir: 'asc' })

  // Pagination
  const [page, setPage] = useState(1) // 1-based
  const [pageSize, setPageSize] = useState(10)

  // Loading placeholder (replace with API later)
  const [loading] = useState(false)

  // Upload ref
  const fileRef = useRef(null)

  // Demo rows (replace with API later)
  const [rows] = useState([
    {
      deptCode: 'MCA',
      deptName: 'Master of Computer Applications',
      estYear: '2016',
      nbaAccredited: 'Yes',
      objectives: 'XXX - XXX',
      vision: 'XXX - XXX',
      mission: 'XXX - XXX',
      goal: 'XXX - XXX',
    },
    {
      deptCode: 'M.Com',
      deptName: 'Master of Commerce',
      estYear: '2016',
      nbaAccredited: 'No',
      objectives: 'XXX - XXX',
      vision: 'XXX - XXX',
      mission: 'XXX - XXX',
      goal: 'XXX - XXX',
    },
  ])

  // Years dropdown
  const years = useMemo(() => {
    const current = new Date().getFullYear()
    const arr = []
    for (let y = 2000; y <= current; y++) arr.push(String(y))
    return arr
  }, [])

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

  const filteredSorted = useMemo(() => {
    const q = normalize(search)
    let data = rows

    if (q) {
      data = rows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))
    }

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) =>
      normalize(a?.[key]).localeCompare(normalize(b?.[key]), undefined, { sensitivity: 'base' }),
    )

    return dir === 'asc' ? sorted : sorted.reverse()
  }, [rows, search, sort])

  // Reset to page 1 when search or pageSize changes
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

  // Form actions
  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setSelectedCode(null)
    setForm(initialForm)
    setIsEdit(true)
  }

  const onView = () => {
    const selected = rows.find((r) => r.deptCode === selectedCode)
    if (!selected) return
    setForm({ ...selected })
    setIsEdit(false)
  }

  const onEdit = () => {
    const selected = rows.find((r) => r.deptCode === selectedCode)
    if (!selected) return
    setForm({ ...selected })
    setIsEdit(true)
  }

  const onCancel = () => setIsEdit(false)

  const onSave = (e) => {
    e.preventDefault()
    // Hook your API save here
    setIsEdit(false)
  }

  // Upload / Download
  const onUploadClick = () => fileRef.current?.click()
  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Hook your upload handler here
    e.target.value = ''
  }

  const onDownloadTemplate = () => {
    // Adjust template path if needed
    window.open('/templates/ARP_T01_Dept_Data_Template.xlsx', '_blank')
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>DEPARTMENT SETUP</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />

              <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onFileChange} />

              <ArpButton label="Upload" icon="upload" color="info" onClick={onUploadClick} />
              <ArpButton
                label="Download Template"
                icon="download"
                color="danger"
                onClick={onDownloadTemplate}
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Department Configuration</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={3}>
                  <CFormLabel>Department Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.deptCode} onChange={onChange('deptCode')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Department Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.deptName} onChange={onChange('deptName')} disabled={!isEdit} />
                </CCol>

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Year of Establishment</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.estYear} onChange={onChange('estYear')} disabled={!isEdit}>
                    <option value="">Select</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Whether Accredited by NBA</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.nbaAccredited}
                    onChange={onChange('nbaAccredited')}
                    disabled={!isEdit}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </CFormSelect>
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Objectives</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormTextarea
                    value={form.objectives}
                    onChange={onChange('objectives')}
                    rows={5}
                    disabled={!isEdit}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Vision</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormTextarea value={form.vision} onChange={onChange('vision')} rows={5} disabled={!isEdit} />
                </CCol>

                {/* Row 4 */}
                <CCol md={3}>
                  <CFormLabel>Mission</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormTextarea value={form.mission} onChange={onChange('mission')} rows={5} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Goal</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormTextarea value={form.goal} onChange={onChange('goal')} rows={5} disabled={!isEdit} />
                </CCol>

                {/* Save / Cancel */}
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD ================= */}
        <CCard className="mb-3">
          {/* ✅ All in ONE ROW: Search + Page size + action icons */}
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Department Details</strong>

            <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
              <CInputGroup size="sm" style={{ width: 280, flex: '0 0 auto' }}>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                />
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
                <ArpIconButton
                  icon="view"
                  color="purple"
                  title="View"
                  onClick={onView}
                  disabled={!selectedCode}
                />
                <ArpIconButton
                  icon="edit"
                  color="info"
                  title="Edit"
                  onClick={onEdit}
                  disabled={!selectedCode}
                />
                <ArpIconButton icon="delete" color="danger" title="Delete" disabled={!selectedCode} />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('deptCode')}>
                    Department Code{sortIndicator('deptCode')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('deptName')}>
                    Department Name{sortIndicator('deptName')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('estYear')}>
                    Year of Establishments{sortIndicator('estYear')}
                  </CTableHeaderCell>

                  <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('nbaAccredited')}>
                    NBA Accreditation{sortIndicator('nbaAccredited')}
                  </CTableHeaderCell>

                  <CTableHeaderCell>Objectives</CTableHeaderCell>
                  <CTableHeaderCell>Vision</CTableHeaderCell>
                  <CTableHeaderCell>Mission</CTableHeaderCell>
                  <CTableHeaderCell>Goal</CTableHeaderCell>
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
                    <CTableRow key={r.deptCode}>
                      <CTableDataCell className="text-center">
                        <input
                          type="radio"
                          name="deptRow"
                          checked={selectedCode === r.deptCode}
                          onChange={() => setSelectedCode(r.deptCode)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.deptCode}</CTableDataCell>
                      <CTableDataCell>{r.deptName}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.estYear}</CTableDataCell>
                      <CTableDataCell className="text-center">{r.nbaAccredited}</CTableDataCell>
                      <CTableDataCell>{r.objectives}</CTableDataCell>
                      <CTableDataCell>{r.vision}</CTableDataCell>
                      <CTableDataCell>{r.mission}</CTableDataCell>
                      <CTableDataCell>{r.goal}</CTableDataCell>
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>

            {/* ✅ ARP Pagination (Reusable Component) */}
            <ArpPagination
              page={safePage}
              totalPages={totalPages}
              onChange={setPage}
              size="sm"
              align="end"
              prevText="Previous"
              nextText="Next"
            />
</CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Department
