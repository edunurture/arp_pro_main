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

const initialAcademic = {
  academicYear: '',
  semester: '',
  programmeCode: '',
  programmeName: '',
}

const initialQbForm = {
  questionBankId: '',
  questionFormatId: '',
  uploadFile: null,
  mode: '',
}

const programmeMap = {
  N6MCA: 'Master of Computer Applications',
  N6MBA: 'Master of Business Administration',
}

const QuestionBank = () => {
  // ======= Phase / UI State =======
  const [isEdit, setIsEdit] = useState(false) // for QB form editability
  const [showCourses, setShowCourses] = useState(false)
  const [showQbForm, setShowQbForm] = useState(false)
  const [showQbDetails, setShowQbDetails] = useState(false)

  // Selection
  const [selectedCourseKey, setSelectedCourseKey] = useState(null)
  const [selectedDetailKey, setSelectedDetailKey] = useState(null)

  // Academic selection
  const [acad, setAcad] = useState(initialAcademic)

  // QB form
  const [qb, setQb] = useState(initialQbForm)
  const fileRef = useRef(null)

  // Table UX state (Courses)
  const [courseSearch, setCourseSearch] = useState('')
  const [coursePageSize, setCoursePageSize] = useState(10)
  const [coursePage, setCoursePage] = useState(1)
  const [courseSort, setCourseSort] = useState({ key: 'course', dir: 'asc' })
  const [loadingCourses] = useState(false)

  // Table UX state (QB Details)
  const [detailSearch, setDetailSearch] = useState('')
  const [detailPageSize, setDetailPageSize] = useState(10)
  const [detailPage, setDetailPage] = useState(1)
  const [detailSort, setDetailSort] = useState({ key: 'course', dir: 'asc' })
  const [loadingDetails] = useState(false)

  // ======= Demo Data (replace with API later) =======
  const courseRows = useMemo(
    () => [
      {
        key: 'BCom-1-23-2AA-11T',
        programme: 'B.Com',
        semester: '1',
        course: '23-2AA-11T - Language – I',
        status: 'Question Bank Not Uploaded',
      },
      {
        key: 'BCom-1-23-2AA-12E',
        programme: 'B.Com',
        semester: '1',
        course: '23-2AA-12E - English – I',
        status: 'Question Bank Not Uploaded',
      },
    ],
    [],
  )

  const detailRows = useMemo(
    () => [
      {
        key: 'D-23-2AA-11T',
        course: '23-2AA-11T - Language – I',
        questionBankId: 'CIA – TEST – 1',
        questionFormat: 'CIA Test ID',
      },
      {
        key: 'D-23-2AA-12E',
        course: '23-2AA-12E - English – I',
        questionBankId: 'CIA Test – 2',
        questionFormat: 'CIA Test ID',
      },
    ],
    [],
  )

  // ======= Helpers =======
  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const sortToggle = (stateSetter) => (key) => {
    stateSetter((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    })
  }

  const sortIndicator = (sortState, key) => {
    if (sortState.key !== key) return ''
    return sortState.dir === 'asc' ? ' ▲' : ' ▼'
  }

  // ======= Academic selection behaviors =======
  const onAcadChange = (key) => (e) => {
    const val = e.target.value
    setAcad((p) => ({ ...p, [key]: val }))
    if (key === 'programmeCode') {
      setAcad((p) => ({ ...p, programmeCode: val, programmeName: programmeMap[val] || '' }))
    }
  }

  const onSearchCourses = () => {
    setShowCourses(true)
    setShowQbForm(false)
    setShowQbDetails(false)
    setSelectedCourseKey(null)
    setSelectedDetailKey(null)
  }

  const onAcadCancel = () => {
    setAcad(initialAcademic)
    setShowCourses(false)
    setShowQbForm(false)
    setShowQbDetails(false)
    setSelectedCourseKey(null)
    setSelectedDetailKey(null)
    setIsEdit(false)
    setQb(initialQbForm)
  }

  // ======= Header Actions (Course list) =======
  const onAddNew = () => {
    if (!selectedCourseKey) return
    setShowQbForm(true)
    setShowQbDetails(false)
    setIsEdit(true)
    setQb((p) => ({ ...p, uploadFile: null }))
  }

  const onView = () => {
    if (!selectedCourseKey) return
    setShowQbDetails(true)
    setShowQbForm(false)
    setIsEdit(false)
  }

  const onEdit = () => {
    if (!selectedCourseKey) return
    setShowQbForm(true)
    setShowQbDetails(false)
    setIsEdit(true)
  }

  const onDelete = () => {
    // Hook delete logic here
  }

  // ======= QB Form =======
  const onQbChange = (key) => (e) => setQb((p) => ({ ...p, [key]: e.target.value }))

  const onModeSelect = (mode) => {
    setQb((p) => ({ ...p, mode }))
  }

  const onUploadClick = () => fileRef.current?.click()
  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQb((p) => ({ ...p, uploadFile: file }))
    e.target.value = ''
  }

  const onDownloadTemplate = () => {
    // Adjust template path if needed
    window.open('/templates/ARP_QB_Template.xlsx', '_blank')
  }

  const onQbCancel = () => {
    setShowQbForm(false)
    setIsEdit(false)
    setQb(initialQbForm)
  }

  const onQbSave = (e) => {
    e.preventDefault()
    // Hook save API here
    setIsEdit(false)
    setShowQbForm(false)
    setShowQbDetails(true)
  }

  // ======= Courses table: Filter / Sort / Pagination =======
  useEffect(() => {
    setCoursePage(1)
  }, [courseSearch, coursePageSize])

  const filteredSortedCourses = useMemo(() => {
    const q = normalize(courseSearch)
    let data = courseRows

    if (q) {
      data = courseRows.filter((r) =>
        [r.programme, r.semester, r.course, r.status].map(normalize).join(' ').includes(q),
      )
    }

    const { key, dir } = courseSort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) =>
      normalize(a?.[key]).localeCompare(normalize(b?.[key]), undefined, { sensitivity: 'base' }),
    )
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [courseRows, courseSearch, courseSort])

  const courseTotal = filteredSortedCourses.length
  const courseTotalPages = Math.max(1, Math.ceil(courseTotal / coursePageSize))
  const courseSafePage = Math.min(coursePage, courseTotalPages)
  const courseStartIdx = courseTotal === 0 ? 0 : (courseSafePage - 1) * coursePageSize
  const courseEndIdx = Math.min(courseStartIdx + coursePageSize, courseTotal)
  const coursePageRows = useMemo(
    () => filteredSortedCourses.slice(courseStartIdx, courseEndIdx),
    [filteredSortedCourses, courseStartIdx, courseEndIdx],
  )

  // ======= Details table: Filter / Sort / Pagination =======
  useEffect(() => {
    setDetailPage(1)
  }, [detailSearch, detailPageSize])

  const filteredSortedDetails = useMemo(() => {
    const q = normalize(detailSearch)
    let data = detailRows

    if (q) {
      data = detailRows.filter((r) =>
        [r.course, r.questionBankId, r.questionFormat].map(normalize).join(' ').includes(q),
      )
    }

    const { key, dir } = detailSort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) =>
      normalize(a?.[key]).localeCompare(normalize(b?.[key]), undefined, { sensitivity: 'base' }),
    )
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [detailRows, detailSearch, detailSort])

  const detailTotal = filteredSortedDetails.length
  const detailTotalPages = Math.max(1, Math.ceil(detailTotal / detailPageSize))
  const detailSafePage = Math.min(detailPage, detailTotalPages)
  const detailStartIdx = detailTotal === 0 ? 0 : (detailSafePage - 1) * detailPageSize
  const detailEndIdx = Math.min(detailStartIdx + detailPageSize, detailTotal)
  const detailPageRows = useMemo(
    () => filteredSortedDetails.slice(detailStartIdx, detailEndIdx),
    [filteredSortedDetails, detailStartIdx, detailEndIdx],
  )

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>QUESTION BANK</strong>

            <div className="d-flex gap-2">
              <ArpButton
                label="Add New"
                icon="add"
                color="purple"
                onClick={onAddNew}
                disabled={!showCourses || !selectedCourseKey}
                title="Add Question Bank"
              />
              <ArpButton
                label="View"
                icon="view"
                color="purple"
                onClick={onView}
                disabled={!showCourses || !selectedCourseKey}
                title="View Question Bank"
              />
              <ArpButton
                label="Edit"
                icon="edit"
                color="primary"
                onClick={onEdit}
                disabled={!showCourses || !selectedCourseKey}
                title="Edit Question Bank"
              />
              <ArpButton
                label="Delete"
                icon="delete"
                color="danger"
                onClick={onDelete}
                disabled={!showCourses || !selectedCourseKey}
                title="Delete Question Bank"
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD (Academic Selection) ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Academic Selection Form</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={(e) => e.preventDefault()}>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.academicYear} onChange={onAcadChange('academicYear')}>
                    <option value="">Select</option>
                    <option value="2025 – 26">2025 – 26</option>
                    <option value="2026 – 27">2026 – 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.semester} onChange={onAcadChange('semester')}>
                    <option value="">Select</option>
                    <option value="Sem – 1">Sem – 1</option>
                    <option value="Sem – 3">Sem – 3</option>
                    <option value="Sem – 5">Sem – 5</option>
                  </CFormSelect>
                </CCol>

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={acad.programmeCode} onChange={onAcadChange('programmeCode')}>
                    <option value="">Select</option>
                    <option value="N6MCA">N6MCA</option>
                    <option value="N6MBA">N6MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={acad.programmeName} disabled />
                </CCol>

                {/* Actions */}
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Search" icon="view" color="primary" type="button" onClick={onSearchCourses} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onAcadCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD (Course List) ================= */}
        {showCourses && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>OBE Mark Entry for the Courses</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                <CFormInput
                  size="sm"
                  placeholder="Search..."
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  style={{ width: 260, flex: '0 0 auto' }}
                />

                <CFormSelect
                  size="sm"
                  value={coursePageSize}
                  onChange={(e) => setCoursePageSize(Number(e.target.value))}
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
                    color="purple"
                    title="Add Question Bank"
                    onClick={onAddNew}
                    disabled={!selectedCourseKey}
                  />
                  <ArpIconButton
                    icon="view"
                    color="purple"
                    title="View"
                    onClick={onView}
                    disabled={!selectedCourseKey}
                  />
                  <ArpIconButton
                    icon="edit"
                    color="info"
                    title="Edit"
                    onClick={onEdit}
                    disabled={!selectedCourseKey}
                  />
                  <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedCourseKey} />
                </div>
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle(setCourseSort)('programme')}>
                      Programme{sortIndicator(courseSort, 'programme')}
                    </CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle(setCourseSort)('semester')}>
                      Semester{sortIndicator(courseSort, 'semester')}
                    </CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle(setCourseSort)('course')}>
                      Course Code with Name{sortIndicator(courseSort, 'course')}
                    </CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle(setCourseSort)('status')}>
                      Status of Question Bank{sortIndicator(courseSort, 'status')}
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {loadingCourses ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center py-4">
                        <CSpinner size="sm" className="me-2" />
                        Loading...
                      </CTableDataCell>
                    </CTableRow>
                  ) : coursePageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center py-4">
                        No records found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    coursePageRows.map((r) => (
                      <CTableRow key={r.key}>
                        <CTableDataCell className="text-center">
                          <input
                            type="radio"
                            name="courseRow"
                            checked={selectedCourseKey === r.key}
                            onChange={() => setSelectedCourseKey(r.key)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>{r.programme}</CTableDataCell>
                        <CTableDataCell className="text-center">{r.semester}</CTableDataCell>
                        <CTableDataCell>{r.course}</CTableDataCell>
                        <CTableDataCell>{r.status}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end mt-2">
                <CPagination size="sm" className="mb-0">
                  <CPaginationItem disabled={courseSafePage <= 1} onClick={() => setCoursePage(1)}>
                    «
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={courseSafePage <= 1}
                    onClick={() => setCoursePage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </CPaginationItem>

                  {Array.from({ length: courseTotalPages })
                    .slice(Math.max(0, courseSafePage - 3), Math.min(courseTotalPages, courseSafePage + 2))
                    .map((_, i) => {
                      const pageNumber = Math.max(1, courseSafePage - 2) + i
                      if (pageNumber > courseTotalPages) return null
                      return (
                        <CPaginationItem
                          key={pageNumber}
                          active={pageNumber === courseSafePage}
                          onClick={() => setCoursePage(pageNumber)}
                        >
                          {pageNumber}
                        </CPaginationItem>
                      )
                    })}

                  <CPaginationItem
                    disabled={courseSafePage >= courseTotalPages}
                    onClick={() => setCoursePage((p) => Math.min(courseTotalPages, p + 1))}
                  >
                    ›
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={courseSafePage >= courseTotalPages}
                    onClick={() => setCoursePage(courseTotalPages)}
                  >
                    »
                  </CPaginationItem>
                </CPagination>
              </div>
            </CCardBody>
          </CCard>
        )}

        {/* ================= FORM CARD (Add / Edit Question Bank) ================= */}
        {showQbForm && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Question Bank Entry</strong>
            </CCardHeader>

            <CCardBody>
              <CForm onSubmit={onQbSave}>
                <CRow className="g-3">
                  {/* Row 1 */}
                  <CCol md={3}>
                    <CFormLabel>Question Mode</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <CFormSelect value={qb.mode} onChange={onQbChange('mode')} disabled={!isEdit}>
                      <option value="">Select</option>
                      <option value="Using Template">Using Template</option>
                      <option value="Using Editor">Using Editor</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Question Bank ID</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <CFormInput value={qb.questionBankId} onChange={onQbChange('questionBankId')} disabled={!isEdit} />
                  </CCol>

                  {/* Row 2 */}
                  <CCol md={3}>
                    <CFormLabel>Choose Question Format ID</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <CFormSelect value={qb.questionFormatId} onChange={onQbChange('questionFormatId')} disabled={!isEdit}>
                      <option value="">Select</option>
                      <option value="CIA Format">CIA Format</option>
                      <option value="Model">Model</option>
                      <option value="Sem">Sem</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Download Question Template</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <ArpButton
                      label="Download"
                      icon="download"
                      color="danger"
                      type="button"
                      onClick={onDownloadTemplate}
                      disabled={!isEdit}
                      title="Download Template"
                    />
                  </CCol>

                  {/* Row 3 */}
                  <CCol md={3}>
                    <CFormLabel>Upload Questions</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onFileChange} />
                    <ArpButton
                      label="Upload"
                      icon="upload"
                      color="info"
                      type="button"
                      onClick={onUploadClick}
                      disabled={!isEdit}
                      title="Upload Questions"
                    />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Selected File</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <CFormInput value={qb.uploadFile?.name || ''} disabled />
                  </CCol>

                  {/* Actions */}
                  <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                    <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} title="Save" />
                    <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onQbCancel} title="Cancel" />
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        )}

        {/* ================= TABLE CARD (Question Bank Details) ================= */}
        {showQbDetails && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Question Bank Details</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                <CFormInput
                  size="sm"
                  placeholder="Search..."
                  value={detailSearch}
                  onChange={(e) => setDetailSearch(e.target.value)}
                  style={{ width: 260, flex: '0 0 auto' }}
                />

                <CFormSelect
                  size="sm"
                  value={detailPageSize}
                  onChange={(e) => setDetailPageSize(Number(e.target.value))}
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
                    disabled={!selectedDetailKey}
                  />
                  <ArpIconButton
                    icon="edit"
                    color="info"
                    title="Edit"
                    disabled={!selectedDetailKey}
                  />
                  <ArpIconButton
                    icon="download"
                    color="danger"
                    title="Download"
                    disabled={!selectedDetailKey}
                  />
                  <ArpIconButton
                    icon="delete"
                    color="danger"
                    title="Delete"
                    disabled={!selectedDetailKey}
                  />
                </div>
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle(setDetailSort)('course')}>
                      Course Code with Name{sortIndicator(detailSort, 'course')}
                    </CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle(setDetailSort)('questionBankId')}>
                      Question Bank ID{sortIndicator(detailSort, 'questionBankId')}
                    </CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle(setDetailSort)('questionFormat')}>
                      Question Format{sortIndicator(detailSort, 'questionFormat')}
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {loadingDetails ? (
                    <CTableRow>
                      <CTableDataCell colSpan={4} className="text-center py-4">
                        <CSpinner size="sm" className="me-2" />
                        Loading...
                      </CTableDataCell>
                    </CTableRow>
                  ) : detailPageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={4} className="text-center py-4">
                        No records found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    detailPageRows.map((r) => (
                      <CTableRow key={r.key}>
                        <CTableDataCell className="text-center">
                          <input
                            type="radio"
                            name="qbDetailRow"
                            checked={selectedDetailKey === r.key}
                            onChange={() => setSelectedDetailKey(r.key)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>{r.course}</CTableDataCell>
                        <CTableDataCell>{r.questionBankId}</CTableDataCell>
                        <CTableDataCell>{r.questionFormat}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end mt-2">
                <CPagination size="sm" className="mb-0">
                  <CPaginationItem disabled={detailSafePage <= 1} onClick={() => setDetailPage(1)}>
                    «
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={detailSafePage <= 1}
                    onClick={() => setDetailPage((p) => Math.max(1, p - 1))}
                  >
                    ‹
                  </CPaginationItem>

                  {Array.from({ length: detailTotalPages })
                    .slice(Math.max(0, detailSafePage - 3), Math.min(detailTotalPages, detailSafePage + 2))
                    .map((_, i) => {
                      const pageNumber = Math.max(1, detailSafePage - 2) + i
                      if (pageNumber > detailTotalPages) return null
                      return (
                        <CPaginationItem
                          key={pageNumber}
                          active={pageNumber === detailSafePage}
                          onClick={() => setDetailPage(pageNumber)}
                        >
                          {pageNumber}
                        </CPaginationItem>
                      )
                    })}

                  <CPaginationItem
                    disabled={detailSafePage >= detailTotalPages}
                    onClick={() => setDetailPage((p) => Math.min(detailTotalPages, p + 1))}
                  >
                    ›
                  </CPaginationItem>
                  <CPaginationItem
                    disabled={detailSafePage >= detailTotalPages}
                    onClick={() => setDetailPage(detailTotalPages)}
                  >
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

export default QuestionBank