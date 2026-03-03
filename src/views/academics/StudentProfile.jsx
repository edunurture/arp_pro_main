import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CFormLabel,
  CFormSelect,
  CFormInput,
  CFormCheck,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CTooltip,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import { lmsService } from '../../services/lmsService'
import '../studprofile/student-info-theme.css'

const StudentProfile = () => {
  const navigate = useNavigate()
  // Matches HTML: Advanced Search toggles extra fields; Search reveals list
  const [isAdvanced, setIsAdvanced] = useState(false)
  const [showList, setShowList] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [form, setForm] = useState({
    registerNumber: '',
    studentName: '',
    academicYear: '',
    semester: '',
    department: '',
    programme: '',
    className: '',
    section: '',
  })

  const [listSearch, setListSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const [rows, setRows] = useState([])
  const [academicYearOptions, setAcademicYearOptions] = useState([])
  const [semesterOptions, setSemesterOptions] = useState([])
  const [departmentOptions, setDepartmentOptions] = useState([])
  const [programmeOptions, setProgrammeOptions] = useState([])
  const [classOptions, setClassOptions] = useState([])
  const [sectionOptions, setSectionOptions] = useState([])

  const filteredRows = useMemo(() => {
    const q = (listSearch || '').toLowerCase().trim()
    if (!q) return rows
    return rows.filter((r) => Object.values(r).join(' ').toLowerCase().includes(q))
  }, [rows, listSearch])

  const totalRows = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, currentPage, pageSize])
  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const applyOptions = (meta) => {
    const opts = meta?.options || {}
    setAcademicYearOptions(Array.isArray(opts.academicYears) ? opts.academicYears : [])
    setSemesterOptions(Array.isArray(opts.semesters) ? opts.semesters : [])
    setDepartmentOptions(Array.isArray(opts.departments) ? opts.departments : [])
    setProgrammeOptions(Array.isArray(opts.programmes) ? opts.programmes : [])
    setClassOptions(Array.isArray(opts.classes) ? opts.classes : [])
    setSectionOptions(Array.isArray(opts.sections) ? opts.sections : [])
  }

  const onSearch = async () => {
    try {
      const payload = await lmsService.getStudentProfilesSearchData({
        registerNumber: form.registerNumber,
        firstName: form.studentName,
        academicYear: form.academicYear,
        semester: form.semester,
        department: form.department,
        programme: form.programme,
        className: form.className,
        section: form.section,
      })
      const data = Array.isArray(payload?.data) ? payload.data : []
      applyOptions(payload?.meta)
      setRows(
        data.map((r, idx) => ({
          id: r.regNo || r.reg || r.registerNumber || r.id || idx + 1,
          className: r.className || r.klass || '',
          section: r.section || '',
          regNo: r.regNo || r.reg || r.registerNumber || '',
          name: r.name || r.firstName || '',
          gender: r.gender || '',
          mobile: r.mobile || r.contact || '',
          email: r.email || '',
          status: r.status || 'Active',
          programmeCode: r.programmeCode || '',
          programmeName: r.programmeName || '',
          programmeDisplay:
            r.programmeCode && r.programmeName && r.programmeCode !== r.programmeName
              ? `${r.programmeCode} - ${r.programmeName}`
              : r.programmeCode || r.programmeName || r.programme || '',
        })),
      )
    } catch {
      setRows([])
    }
    // HTML showStudentList()
    setShowList(true)
    setSelectedId(null)
    setPage(1)
  }

  const onViewSelected = () => {
    const selected = rows.find((r) => String(r.id) === String(selectedId))
    const registerNumber = String(selected?.regNo || '').trim()
    if (!registerNumber) return
    navigate(`/student-profile/basic-profile?registerNumber=${encodeURIComponent(registerNumber)}`, {
      state: { registerNumber },
    })
  }

  const onCancel = () => {
    setForm({
      registerNumber: '',
      studentName: '',
      academicYear: '',
      semester: '',
      department: '',
      programme: '',
      className: '',
      section: '',
    })
    setIsAdvanced(false)
    setShowList(false)
    setSelectedId(null)
    setListSearch('')
    setPageSize(10)
    setPage(1)
  }

  useEffect(() => {
    const bootstrapSearchOptions = async () => {
      try {
        const payload = await lmsService.getStudentProfilesSearchData({})
        applyOptions(payload?.meta)
      } catch {
        setAcademicYearOptions([])
        setSemesterOptions([])
        setDepartmentOptions([])
        setProgrammeOptions([])
        setClassOptions([])
        setSectionOptions([])
      }
    }
    bootstrapSearchOptions()
  }, [])

  return (
    <div className="student-info-screen">
      {/* 1) Header Action Card */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Student Profile</strong>
          <div className="d-flex gap-2">
            <ArpButton
              label={isAdvanced ? 'Hide Advanced' : 'Advanced Search'}
              icon="search"
              color="success"
              onClick={() => setIsAdvanced((v) => !v)}
            />
          </div>
        </CCardHeader>
      </CCard>

      {/* 2) Search Form Card */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Student Profile</strong>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-3">
            {/* Basic fields (always visible) */}
            <CCol md={3}>
              <CFormLabel>Register Number</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormInput
                value={form.registerNumber}
                onChange={onChange('registerNumber')}
                placeholder="Register No (Or) Roll Number"
              />
            </CCol>

            <CCol md={3}>
              <CFormLabel>Student Name</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormInput
                value={form.studentName}
                onChange={onChange('studentName')}
                placeholder="Enter the Student Name"
              />
            </CCol>

            {/* Advanced fields (toggle) */}
            {isAdvanced && (
              <>
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYear} onChange={onChange('academicYear')}>
                    <option value="">Select</option>
                    {academicYearOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')}>
                    <option value="">Select</option>
                    {semesterOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Department</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.department} onChange={onChange('department')}>
                    <option value="">Select Department</option>
                    {departmentOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programme} onChange={onChange('programme')}>
                    <option value="">Select</option>
                    {programmeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Class Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.className} onChange={onChange('className')}>
                    <option value="">Select</option>
                    {classOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Section</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.section} onChange={onChange('section')}>
                    <option value="">Select</option>
                    {sectionOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </>
            )}

            {/* Actions */}
            <CCol xs={12} className="d-flex justify-content-end gap-2 flex-wrap mt-2">
              <ArpButton label="Search" icon="search" color="primary" type="button" onClick={onSearch} />
              <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* 3) Student List Card (shown after Search) */}
      {showList && (
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Student List</strong>

            {/* HTML layout: View Profile circle on left + search input */}
            <div className="d-flex align-items-center gap-2 flex-nowrap">
              <CFormInput
                size="sm"
                placeholder="Search..."
                style={{ width: 220 }}
                value={listSearch}
                onChange={(e) => {
                  setListSearch(e.target.value)
                  setPage(1)
                }}
              />

              <CFormSelect
                size="sm"
                style={{ width: 110 }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                title="Page size"
              >
                {[5, 10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </CFormSelect>

              <CTooltip content="View Profile">
                <span className="d-inline-block">
                  <ArpIconButton icon="view" color="primary" disabled={!selectedId} onClick={onViewSelected} />
                </span>
              </CTooltip>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable bordered responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Class</CTableHeaderCell>
                  <CTableHeaderCell>Section</CTableHeaderCell>
                  <CTableHeaderCell>Reg. Number</CTableHeaderCell>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Gender</CTableHeaderCell>
                  <CTableHeaderCell>Mob. Number</CTableHeaderCell>
                  <CTableHeaderCell>E-Mail ID</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {pagedRows.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell className="text-center">
                      <CFormCheck
                        type="radio"
                        name="selectStudentProfile"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                      />
                    </CTableDataCell>

                    {/* Keep readonly-input feel from HTML */}
                    <CTableDataCell>
                      <CFormInput size="sm" value={r.className} readOnly className="bg-light" />
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormInput size="sm" value={r.section} readOnly className="bg-light" />
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormInput size="sm" value={r.regNo} readOnly className="bg-light" />
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormInput size="sm" value={r.name} readOnly className="bg-light" />
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormInput size="sm" value={r.gender} readOnly className="bg-light" />
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormInput size="sm" value={r.mobile || 'XX'} readOnly className="bg-light" />
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormInput size="sm" value={r.email || 'XX'} readOnly className="bg-light" />
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormInput size="sm" value={r.status} readOnly className="bg-light" />
                    </CTableDataCell>
                  </CTableRow>
                ))}

                {filteredRows.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center text-muted py-4">
                      No records found
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>

            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
              <div className="text-muted">
                Showing {(totalRows === 0) ? 0 : ((currentPage - 1) * pageSize + 1)}–
                {Math.min(currentPage * pageSize, totalRows)} of {totalRows}
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>

                <span className="text-muted">
                  Page {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </CCardBody>
        </CCard>
      )}
    </div>
  )
}

export default StudentProfile

