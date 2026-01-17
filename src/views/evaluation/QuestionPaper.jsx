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

import { ArpButton, ArpIconButton } from '../../components/common'

const programmeMap = {
  N6MCA: 'Master of Computer Applications',
  N6MBA: 'Master of Business Administration',
}

const courseMap = {
  '23-2AA-11T': 'Language – I',
  '23-2AA-12E': 'Language – II',
}

const initialForm = {
  academicYear: '',
  semester: '',
  examMonthYear: '',
  examName: '',
  programmeCode: '',
  programme: '',
  courseCode: '',
  courseName: '',
  questionPaperCode: '',
  chooseQpFromQb: '',
}

const QuestionPaper = () => {
  // Form enable/disable (Add New toggles this)
  const [isEdit, setIsEdit] = useState(false)

  // Show / hide table section (View / Save toggles this)
  const [showTable, setShowTable] = useState(false)

  // Selection
  const [selectedKey, setSelectedKey] = useState(null)

  // Form data
  const [form, setForm] = useState(initialForm)

  // ===== Table UX state =====
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState({ key: 'courseCode', dir: 'asc' })
  const [loading] = useState(false)

  // ===== Demo rows (replace with API) =====
  const [rows] = useState([
    {
      key: '23-2AA-11T',
      courseCode: '23-2AA-11T',
      courseName: 'Language – I',
      status: 'QP Not Generated',
      qpCode: '',
    },
    {
      key: '23-2AA-12E',
      courseCode: '23-2AA-12E',
      courseName: 'Language – II',
      status: 'QP Not Generated',
      qpCode: '',
    },
  ])

  const onChange = (key) => (e) => {
    const val = e.target.value
    setForm((p) => ({ ...p, [key]: val }))

    if (key === 'programmeCode') {
      setForm((p) => ({ ...p, programmeCode: val, programme: programmeMap[val] || '' }))
    }

    if (key === 'courseCode') {
      setForm((p) => ({ ...p, courseCode: val, courseName: courseMap[val] || '' }))
    }
  }

  // ===== Header actions =====
  const onAddNew = () => {
    setIsEdit(true)
    setShowTable(false)
    setSelectedKey(null)
  }

  const onView = () => {
    setShowTable(true)
  }

  const onCancel = () => {
    setIsEdit(false)
    setShowTable(false)
    setSelectedKey(null)
    setForm(initialForm)
  }

  const onSave = (e) => {
    e.preventDefault()
    // Hook API save here
    setIsEdit(false)
    setShowTable(true)
  }

  // ===== Table helpers =====
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
      data = rows.filter((r) =>
        [r.courseCode, r.courseName, r.status, r.qpCode].map(normalize).join(' ').includes(q),
      )
    }

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) =>
      normalize(a?.[key]).localeCompare(normalize(b?.[key]), undefined, { sensitivity: 'base' }),
    )
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [rows, search, sort])

  // Reset to page 1 when search/pageSize changes
  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const pageRows = useMemo(() => filteredSorted.slice(startIdx, endIdx), [filteredSorted, startIdx, endIdx])

  // ===== Table action icons =====
  const onTableAdd = () => {
    // For Question Paper page: treat + as “Generate QP” for selected course
    if (!selectedKey) return
    setIsEdit(true)
  }

  const onTableEdit = () => {
    if (!selectedKey) return
    setIsEdit(true)
  }

  const onTableView = () => {
    if (!selectedKey) return
    // Hook view behavior here
  }

  const onTableDownload = () => {
    if (!selectedKey) return
    // Hook download logic here
  }

  const onTableDelete = () => {
    if (!selectedKey) return
    // Hook delete logic here
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>QUESTION PAPER</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton label="View" icon="view" color="primary" onClick={onView} title="View" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Question Paper</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYear} onChange={onChange('academicYear')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="2025 – 26">2025 – 26</option>
                    <option value="2026 – 27">2026 – 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Sem – 1">Sem – 1</option>
                    <option value="Sem – 3">Sem – 3</option>
                    <option value="Sem – 5">Sem – 5</option>
                  </CFormSelect>
                </CCol>

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Month &amp; Year of Examination</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.examMonthYear} onChange={onChange('examMonthYear')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Aug – 2024">Aug – 2024</option>
                    <option value="Dec – 2024">Dec – 2024</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Name of the Examination</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.examName} onChange={onChange('examName')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="CIA Test 1">CIA Test 1</option>
                    <option value="CIA Test 2">CIA Test 2</option>
                  </CFormSelect>
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeCode} onChange={onChange('programmeCode')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="N6MBA">N6MBA</option>
                    <option value="N6MCA">N6MCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.programme} disabled />
                </CCol>

                {/* Row 4 */}
                <CCol md={3}>
                  <CFormLabel>Course Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.courseCode} onChange={onChange('courseCode')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="23-2AA-11T">23-2AA-11T</option>
                    <option value="23-2AA-12E">23-2AA-12E</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Course Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.courseName} disabled />
                </CCol>

                {/* Row 5 */}
                <CCol md={3}>
                  <CFormLabel>Question Paper Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.questionPaperCode}
                    onChange={onChange('questionPaperCode')}
                    disabled={!isEdit}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose QP from Question Bank</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.chooseQpFromQb} onChange={onChange('chooseQpFromQb')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="CIA Test – 1">CIA Test – 1</option>
                    <option value="CIA Test – 2">CIA Test – 2</option>
                  </CFormSelect>
                </CCol>

                {/* Save / Cancel */}
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} title="Save" />
                  <ArpButton label="Cancel" icon="cancel" color="danger" type="button" onClick={onCancel} disabled={!isEdit} title="Cancel" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD ================= */}
        {showTable && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>OBE Mark Entry for the Courses</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                <CFormInput
                  size="sm"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 260, flex: '0 0 auto' }}
                />

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
                    icon="add"
                    color="success"
                    title="Add"
                    onClick={onTableAdd}
                    disabled={!selectedKey}
                  />
                  <ArpIconButton
                    icon="view"
                    color="info"
                    title="View"
                    onClick={onTableView}
                    disabled={!selectedKey}
                  />
                  <ArpIconButton
                    icon="edit"
                    color="warning"
                    title="Edit"
                    onClick={onTableEdit}
                    disabled={!selectedKey}
                  />
                  <ArpIconButton
                    icon="download"
                    color="success"
                    title="Download"
                    onClick={onTableDownload}
                    disabled={!selectedKey}
                  />
                  <ArpIconButton
                    icon="delete"
                    color="danger"
                    title="Delete"
                    onClick={onTableDelete}
                    disabled={!selectedKey}
                  />
                </div>
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('courseCode')}>
                      Course Code{sortIndicator('courseCode')}
                    </CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('courseName')}>
                      Course Name{sortIndicator('courseName')}
                    </CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('status')}>
                      Status of Question Paper{sortIndicator('status')}
                    </CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('qpCode')}>
                      QP Code{sortIndicator('qpCode')}
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
                      <CTableRow key={r.key}>
                        <CTableDataCell className="text-center">
                          <input
                            type="radio"
                            name="qpRow"
                            checked={selectedKey === r.key}
                            onChange={() => setSelectedKey(r.key)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>{r.courseCode}</CTableDataCell>
                        <CTableDataCell>{r.courseName}</CTableDataCell>
                        <CTableDataCell>{r.status}</CTableDataCell>
                        <CTableDataCell>{r.qpCode}</CTableDataCell>
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
        )}
      </CCol>
    </CRow>
  )
}

export default QuestionPaper