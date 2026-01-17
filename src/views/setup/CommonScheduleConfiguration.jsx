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
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CPagination,
  CPaginationItem,
  CDropdown,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import { ArpButton, ArpIconButton } from '../../components/common'

/**
 * Converted from common_schedule.html
 * - Add New enables form fields (default disabled)
 * - Save reveals table and inserts a row
 * - Programmes + Classes are multi-select checkbox dropdowns
 * - Table header keeps Search + Page Size + circle action icons in ONE row
 */

const initialForm = {
  academicYear: '',
  semester: '',
  faculty: '',
  courseCode: '',
  courseName: '',
  scheduleName: '',
}

function MultiSelectDropdown({
  label = 'Select',
  options = [],
  value = [],
  onChange,
  disabled,
  size = 'sm',
  width = 280,
}) {
  const selectedLabel = value.length ? value.join(' | ') : label

  const toggleValue = (opt) => {
    if (!onChange) return
    if (value.includes(opt)) onChange(value.filter((x) => x !== opt))
    else onChange([...value, opt])
  }

  return (
    <CDropdown autoClose="outside">
      <CDropdownToggle
        color="light"
        size={size}
        disabled={disabled}
        className="w-100 text-start d-flex align-items-center justify-content-between"
        style={{ width, minWidth: width }}
      >
        <span className="text-truncate" style={{ maxWidth: width - 38 }} title={selectedLabel}>
          {selectedLabel}
        </span>
        <span className="ms-2">▾</span>
      </CDropdownToggle>

      <CDropdownMenu style={{ maxHeight: 240, overflowY: 'auto', minWidth: width }}>
        {options.map((opt) => (
          <div key={opt} className="px-3 py-1">
            <CFormCheck
              id={`${label}-${opt}`}
              label={opt}
              checked={value.includes(opt)}
              onChange={() => toggleValue(opt)}
              disabled={disabled}
            />
          </div>
        ))}
        {options.length === 0 && <div className="px-3 py-2 text-muted">No options</div>}
      </CDropdownMenu>
    </CDropdown>
  )
}

const CommonScheduleConfiguration = () => {
  // Form enabled only after Add New (matches HTML) fileciteturn8file0
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState(initialForm)

  const [selectedProgrammes, setSelectedProgrammes] = useState([])
  const [selectedClasses, setSelectedClasses] = useState([])

  // Table visibility (Save shows table, like HTML)
  const [tableVisible, setTableVisible] = useState(false)

  // Table toolbar + selection
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Upload placeholder ref (not used now, kept for consistency)
  const fileRef = useRef(null)

  // Dropdown data (replace with API)
  const academicYears = ['2025 – 26', '2026 – 27']
  const programmes = ['N6MCA', 'N6MBA']
  const semesters = ['Sem-1', 'Sem-3', 'Sem-5']
  const faculties = ['Dr. M. Elamparithi', 'Dr. Priya', 'Mr. N. Sampath Kumar']
  const classes = ['I B.Com.', 'I BBA', 'I BCA']

  // Table data (starts with 2 demo rows from HTML) fileciteturn8file0
  const [rows, setRows] = useState([
    {
      id: 1,
      semester: '1',
      faculty: 'Dr. Priya',
      scheduleName: 'UG Commerce Tamil',
      courseCode: '23-13A-LT1',
      courseName: 'Language – 1 Tamil',
      classes: ['I BCom', 'I BCA', 'I BBA'],
      programmes: ['N6MCA'],
    },
    {
      id: 2,
      semester: '1',
      faculty: 'Mr. N. Sampath Kumar',
      scheduleName: 'UG Commerce English',
      courseCode: '23-13A-LT2',
      courseName: 'Language – 2 English',
      classes: ['I BCom', 'I BCA', 'I BBA'],
      programmes: ['N6MBA'],
    },
  ])

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setIsEdit(true)
    setForm(initialForm)
    setSelectedProgrammes([])
    setSelectedClasses([])
    setSelectedId(null)
  }

  const onCancel = () => {
    setIsEdit(false)
    setForm(initialForm)
    setSelectedProgrammes([])
    setSelectedClasses([])
    setSelectedId(null)
    // keep table as-is; if you want to hide it on cancel, uncomment:
    // setTableVisible(false)
  }

  const onSave = () => {
    // Basic validation (minimal; align with your workflow)
    if (!form.academicYear || !form.semester || !form.faculty || !form.courseCode || !form.courseName || !form.scheduleName) {
      // you can replace with toast/validation UI
      alert('Please fill all required fields.')
      return
    }
    if (selectedProgrammes.length === 0) {
      alert('Please choose Programmes.')
      return
    }
    if (selectedClasses.length === 0) {
      alert('Please select Classes.')
      return
    }

    const next = {
      id: Date.now(),
      semester: form.semester,
      faculty: form.faculty,
      scheduleName: form.scheduleName,
      courseCode: form.courseCode,
      courseName: form.courseName,
      classes: selectedClasses,
      programmes: selectedProgrammes,
    }

    setRows((prev) => [next, ...prev])
    setTableVisible(true)
    setIsEdit(false)
    setSelectedId(next.id)
    setForm(initialForm)
    setSelectedProgrammes([])
    setSelectedClasses([])
  }

  const selectedRow = useMemo(() => rows.find((r) => r.id === selectedId) || null, [rows, selectedId])

  const onView = () => {
    if (!selectedRow) return
    alert(
      `Schedule: ${selectedRow.scheduleName}\nSemester: ${selectedRow.semester}\nFaculty: ${selectedRow.faculty}\nCourse: ${selectedRow.courseCode} - ${selectedRow.courseName}\nClasses: ${selectedRow.classes.join(' | ')}`,
    )
  }

  const onEdit = () => {
    if (!selectedRow) return
    setIsEdit(true)
    setForm({
      academicYear: form.academicYear || '', // not stored in table; keep as current selection
      semester: selectedRow.semester || '',
      faculty: selectedRow.faculty || '',
      courseCode: selectedRow.courseCode || '',
      courseName: selectedRow.courseName || '',
      scheduleName: selectedRow.scheduleName || '',
    })
    setSelectedClasses(selectedRow.classes || [])
    setSelectedProgrammes(selectedRow.programmes || [])
  }

  const onDelete = () => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to delete this schedule?')
    if (!ok) return
    setRows((prev) => prev.filter((r) => r.id !== selectedRow.id))
    setSelectedId(null)
  }

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const filtered = useMemo(() => {
    const q = normalize(search)
    if (!q) return rows
    return rows.filter((r) =>
      [
        r.semester,
        r.faculty,
        r.scheduleName,
        r.courseCode,
        r.courseName,
        (r.classes || []).join(' '),
        (r.programmes || []).join(' '),
      ]
        .map(normalize)
        .join(' ')
        .includes(q),
    )
  }, [rows, search])

  // Reset page when search/pageSize changes
  useEffect(() => setPage(1), [search, pageSize])

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
            <strong>COMMON SCHEDULE</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton label="View" icon="view" color="primary" onClick={onView} disabled={!selectedId} title="View" />
            </div>

            {/* keep hidden file input for future upload use */}
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={() => {}} />
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Common Schedule</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
                {/* Row 1 */}
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
                  <CFormLabel>Choose Programmes</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <MultiSelectDropdown
                    label="Select Programmes"
                    options={programmes}
                    value={selectedProgrammes}
                    onChange={setSelectedProgrammes}
                    disabled={!isEdit}
                    width={260}
                  />
                </CCol>

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
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

                <CCol md={3}>
                  <CFormLabel>Choose Faculty</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.faculty} onChange={onChange('faculty')} disabled={!isEdit}>
                    <option value="">Select Faculty</option>
                    {faculties.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Common Course Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.courseCode} onChange={onChange('courseCode')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Common Course Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.courseName} onChange={onChange('courseName')} disabled={!isEdit} />
                </CCol>

                {/* Row 4 */}
                <CCol md={3}>
                  <CFormLabel>Select Classes</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <MultiSelectDropdown
                    label="Select Classes"
                    options={classes}
                    value={selectedClasses}
                    onChange={setSelectedClasses}
                    disabled={!isEdit}
                    width={260}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Combined Schedule Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.scheduleName} onChange={onChange('scheduleName')} disabled={!isEdit} />
                </CCol>

                {/* Save/Cancel aligned right */}
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Save" icon="save" color="primary" type="button" onClick={onSave} disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD ================= */}
        {tableVisible && (
          <CCard className="mb-3">
            {/* ✅ ONE ROW: Search + Page size + action icons */}
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Common Schedule List</strong>

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
                    <CTableHeaderCell>Semester</CTableHeaderCell>
                    <CTableHeaderCell>Faculty Name</CTableHeaderCell>
                    <CTableHeaderCell>Schedule Name</CTableHeaderCell>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    <CTableHeaderCell>Selected Classes</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <CFormCheck
                          type="radio"
                          name="commonScheduleSelect"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.semester}</CTableDataCell>
                      <CTableDataCell>{r.faculty}</CTableDataCell>
                      <CTableDataCell>{r.scheduleName}</CTableDataCell>
                      <CTableDataCell>{r.courseCode}</CTableDataCell>
                      <CTableDataCell>{r.courseName}</CTableDataCell>
                      <CTableDataCell>{(r.classes || []).join(' | ')}</CTableDataCell>
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

export default CommonScheduleConfiguration
