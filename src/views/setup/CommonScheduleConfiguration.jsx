import React, { useMemo, useRef, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CDropdown,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * CommonScheduleConfiguration.jsx (ARP CoreUI React Pro Standard)
 * - Strict 3-card layout: Header Action Card + Form Card + Table Card (ArpDataTable)
 * - Uses ArpDataTable for Search + Page Size + Sorting + Pagination + Selection
 * - No manual search/pagination logic inside the module
 * - No direct @coreui/icons imports (no CIcon/cilSearch)
 * - Multi-select dropdowns for Programmes and Classes retained (checkbox dropdown)
 * - Demo rows only. Hook API where indicated.
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

export default function CommonScheduleConfiguration() {
  // ARP mandatory state pattern
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)

  const [selectedProgrammes, setSelectedProgrammes] = useState([])
  const [selectedClasses, setSelectedClasses] = useState([])

  // Table visibility: matches original UX (Save shows table); you can keep true by default if you want
  const [tableVisible, setTableVisible] = useState(false)

  // Upload placeholder ref (not used now, kept for consistency)
  const fileRef = useRef(null)

  // Dropdown data (replace with API)
  const academicYears = ['2025 – 26', '2026 – 27']
  const programmes = ['N6MCA', 'N6MBA']
  const semesters = ['Sem-1', 'Sem-3', 'Sem-5']
  const faculties = ['Dr. M. Elamparithi', 'Dr. Priya', 'Mr. N. Sampath Kumar']
  const classes = ['I B.Com.', 'I BBA', 'I BCA']

  // Table data (demo rows)
  const [rows, setRows] = useState([
    {
      id: 1,
      semester: 'Sem-1',
      faculty: 'Dr. Priya',
      scheduleName: 'UG Commerce Tamil',
      courseCode: '23-13A-LT1',
      courseName: 'Language – 1 Tamil',
      classes: ['I BCom', 'I BCA', 'I BBA'],
      programmes: ['N6MCA'],
    },
    {
      id: 2,
      semester: 'Sem-1',
      faculty: 'Mr. N. Sampath Kumar',
      scheduleName: 'UG Commerce English',
      courseCode: '23-13A-LT2',
      courseName: 'Language – 2 English',
      classes: ['I BCom', 'I BCA', 'I BBA'],
      programmes: ['N6MBA'],
    },
  ])

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const resetForm = () => {
    setForm(initialForm)
    setSelectedProgrammes([])
    setSelectedClasses([])
  }

  const onAddNew = () => {
    setIsEdit(true)
    resetForm()
    setSelectedId(null)
  }

  const onCancel = () => {
    setIsEdit(false)
    resetForm()
    setSelectedId(null)
    // keep table as-is; if you want to hide it on cancel, uncomment:
    // setTableVisible(false)
  }

  const onSave = () => {
    if (!form.academicYear || !form.semester || !form.faculty || !form.courseCode || !form.courseName || !form.scheduleName) {
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

    // Hook API save here
    setRows((prev) => [next, ...prev])
    setTableVisible(true)
    setIsEdit(false)
    setSelectedId(next.id)
    resetForm()
  }

  /* =========================
     TABLE ACTIONS
  ========================== */

  const selectedRow = rows.find((r) => String(r.id) === String(selectedId)) || null

  const onView = () => {
    if (!selectedRow) return
    alert(
      `Schedule: ${selectedRow.scheduleName}\nSemester: ${selectedRow.semester}\nFaculty: ${selectedRow.faculty}\nCourse: ${selectedRow.courseCode} - ${selectedRow.courseName}\nClasses: ${(selectedRow.classes || []).join(
        ' | ',
      )}\nProgrammes: ${(selectedRow.programmes || []).join(' | ')}`,
    )
  }

  const onEdit = () => {
    if (!selectedRow) return
    setIsEdit(true)
    setForm((p) => ({
      ...p,
      academicYear: form.academicYear || '',
      semester: selectedRow.semester || '',
      faculty: selectedRow.faculty || '',
      courseCode: selectedRow.courseCode || '',
      courseName: selectedRow.courseName || '',
      scheduleName: selectedRow.scheduleName || '',
    }))
    setSelectedClasses(selectedRow.classes || [])
    setSelectedProgrammes(selectedRow.programmes || [])
  }

  const onDelete = () => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to delete this schedule?')
    if (!ok) return
    // Hook API delete here
    setRows((prev) => prev.filter((r) => String(r.id) !== String(selectedRow.id)))
    setSelectedId(null)
  }

  /* =========================
     ArpDataTable CONFIG
  ========================== */

  const columns = useMemo(
    () => [
      { key: 'semester', label: 'Semester', sortable: true, width: 110, align: 'center' },
      { key: 'faculty', label: 'Faculty Name', sortable: true, width: 220 },
      { key: 'scheduleName', label: 'Schedule Name', sortable: true, width: 220 },
      { key: 'courseCode', label: 'Course Code', sortable: true, width: 160, align: 'center' },
      { key: 'courseName', label: 'Course Name', sortable: true },
      {
        key: 'classes',
        label: 'Selected Classes',
        sortable: true,
        render: (row) => (row?.classes ? row.classes.join(' | ') : ''),
      },
    ],
    [],
  )

  const headerActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        {/* ===================== A) HEADER ACTION CARD ===================== */}
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

        {/* ===================== B) FORM CARD ===================== */}
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
                  <ArpButton label="Save" icon="save" color="success" type="button" onClick={onSave} disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ===================== C) TABLE CARD (ArpDataTable) ===================== */}
        {tableVisible && (
          <ArpDataTable
            title="COMMON SCHEDULE LIST"
            rows={rows}
            columns={columns}
            loading={false}
            headerActions={headerActions}
            selection={{
              type: 'radio',
              selected: selectedId,
              onChange: (value) => setSelectedId(value),
              key: 'id',
              headerLabel: 'Select',
              width: 60,
              name: 'commonScheduleSelect',
            }}
            pageSizeOptions={[5, 10, 20, 50]}
            defaultPageSize={10}
            searchable
            searchPlaceholder="Search..."
            rowKey="id"
          />
        )}
      </CCol>
    </CRow>
  )
}
