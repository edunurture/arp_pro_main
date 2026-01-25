import React, { useMemo, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormCheck,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'

import { ArpButton } from '../../components/common'

const initialForm = {
  academicYear: '',
  semester: '',
  programmeCode: '',
  programmeName: '',
}

const PROGRAMME_NAME_MAP = {
  N6MCA: 'Master of Computer Applications (MCA)',
  N6MBA: 'Master of Business Administration (MBA)',
}

const SyllabusCompletion = () => {
  // Header actions
  const [isEdit, setIsEdit] = useState(false)

  // Phase 1
  const [form, setForm] = useState(initialForm)

  // Phase 2 + 3 visibility
  const [showSyllabusTable, setShowSyllabusTable] = useState(false)
  const [showCompletionTable, setShowCompletionTable] = useState(false)

  // Row selection
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [selectedCompletionId, setSelectedCompletionId] = useState(null)

  // -----------------------------
  // Dummy Data (Phase 2)
  // -----------------------------
  const syllabusRows = useMemo(
    () => [
      {
        id: 1,
        courseCode: 'CS501',
        courseName: 'Data Structures',
        facultyId: 'F101',
        facultyName: 'Dr. Anand',
        status: 'Pending',
      },
      {
        id: 2,
        courseCode: 'CS502',
        courseName: 'Database Systems',
        facultyId: 'F102',
        facultyName: 'Dr. Meena',
        status: 'In Progress',
      },
      {
        id: 3,
        courseCode: 'CS503',
        courseName: 'Operating Systems',
        facultyId: 'F103',
        facultyName: 'Dr. Ravi',
        status: 'Completed',
      },
      {
        id: 4,
        courseCode: 'CS504',
        courseName: 'Computer Networks',
        facultyId: 'F104',
        facultyName: 'Dr. Priya',
        status: 'Pending',
      },
      {
        id: 5,
        courseCode: 'CS505',
        courseName: 'Software Engineering',
        facultyId: 'F105',
        facultyName: 'Dr. Karthik',
        status: 'In Progress',
      },
    ],
    [],
  )

  // -----------------------------
  // Dummy Data (Phase 3)
  // -----------------------------
  const completionRows = useMemo(
    () => [
      {
        id: 1,
        date: '2026-01-10',
        dayOrder: 'Day – 1',
        hour: '1',
        chapter: 'Unit – I',
        lectureTopic: 'Introduction & Overview',
        completionDate: '',
      },
      {
        id: 2,
        date: '2026-01-11',
        dayOrder: 'Day – 2',
        hour: '2',
        chapter: 'Unit – II',
        lectureTopic: 'Core Concepts',
        completionDate: '',
      },
      {
        id: 3,
        date: '2026-01-12',
        dayOrder: 'Day – 3',
        hour: '3',
        chapter: 'Unit – III',
        lectureTopic: 'Worked Examples',
        completionDate: '',
      },
      {
        id: 4,
        date: '2026-01-13',
        dayOrder: 'Day – 4',
        hour: '4',
        chapter: 'Unit – IV',
        lectureTopic: 'Applications',
        completionDate: '',
      },
      {
        id: 5,
        date: '2026-01-14',
        dayOrder: 'Day – 5',
        hour: '5',
        chapter: 'Unit – V',
        lectureTopic: 'Revision & Assessment',
        completionDate: '',
      },
    ],
    [],
  )

  const [completionEdits, setCompletionEdits] = useState(() =>
    completionRows.map((r) => ({ ...r })),
  )

  // -----------------------------
  // Handlers
  // -----------------------------
  const onAddNew = () => {
    setIsEdit(true)
    setForm(initialForm)
    setShowSyllabusTable(false)
    setShowCompletionTable(false)
    setSelectedCourseId(null)
    setSelectedCompletionId(null)
  }

  const onViewMode = () => {
    setIsEdit(false)
  }

  const setField = (key) => (e) => {
    const value = e.target.value
    if (key === 'programmeCode') {
      setForm((prev) => ({
        ...prev,
        programmeCode: value,
        programmeName: PROGRAMME_NAME_MAP[value] || '',
      }))
      return
    }
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSearch = () => {
    if (!form.academicYear || !form.semester || !form.programmeCode) return
    setShowSyllabusTable(true)
    setShowCompletionTable(false)
    setSelectedCourseId(null)
    setSelectedCompletionId(null)
  }

  const onCancel = () => {
    setIsEdit(false)
    setForm(initialForm)
    setShowSyllabusTable(false)
    setShowCompletionTable(false)
    setSelectedCourseId(null)
    setSelectedCompletionId(null)
  }

  const onCompleteSyllabus = () => {
    if (!selectedCourseId) return
    setShowCompletionTable(true)
    setSelectedCompletionId(null)
  }

  const onViewCompletion = () => {
    if (!selectedCourseId) return
    setShowCompletionTable(true)
  }

  const onDeleteCompletion = () => {
    if (!selectedCourseId) return
    // eslint-disable-next-line no-alert
    alert('Delete Completion (placeholder)')
  }

  const onCompletionDateChange = (id) => (e) => {
    const value = e.target.value
    setCompletionEdits((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completionDate: value } : r)),
    )
  }

  const onSaveCompletion = () => {
    // eslint-disable-next-line no-alert
    alert('Save Completion (placeholder)')
  }

  const onCancelCompletion = () => {
    setShowCompletionTable(false)
    setSelectedCompletionId(null)
    setCompletionEdits(completionRows.map((r) => ({ ...r })))
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* Header Action Card */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Syllabus Completion</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="View" icon="view" color="info" onClick={onViewMode} />
            </div>
          </CCardHeader>
        </CCard>

        {/* Phase 1: Form Card */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Syllabus to be Completed for</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                  <CFormSelect
                    value={form.academicYear}
                    onChange={setField('academicYear')}
                    disabled={!isEdit}
                  >
                    <option value="">Select</option>
                    <option value="2025-26">2025–26</option>
                    <option value="2026-27">2026–27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                  <CFormSelect value={form.semester} onChange={setField('semester')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Sem-1">Sem – 1</option>
                    <option value="Sem-3">Sem – 3</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Programme Code</CFormLabel>
                  <CFormSelect
                    value={form.programmeCode}
                    onChange={setField('programmeCode')}
                    disabled={!isEdit}
                  >
                    <option value="">Select</option>
                    <option value="N6MCA">N6MCA</option>
                    <option value="N6MBA">N6MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Name</CFormLabel>
                  <CFormInput value={form.programmeName} readOnly placeholder="Programme Name" />
                </CCol>
              </CRow>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <ArpButton label="Search" icon="search" color="info" onClick={onSearch} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        {/* Phase 2: Syllabus Table */}
        {showSyllabusTable && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Syllabus Completion Details</strong>

              <div className="d-flex gap-2">
                <ArpButton
                  label="Complete Syllabus"
                  icon="save"
                  color="success"
                  onClick={onCompleteSyllabus}
                  disabled={!selectedCourseId}
                />
                <ArpButton
                  label="View Completion"
                  icon="view"
                  color="info"
                  onClick={onViewCompletion}
                  disabled={!selectedCourseId}
                />
                <ArpButton
                  label="Delete Completion"
                  icon="delete"
                  color="danger"
                  onClick={onDeleteCompletion}
                  disabled={!selectedCourseId}
                />
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable bordered hover responsive align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 56 }}></CTableHeaderCell>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    <CTableHeaderCell>Faculty ID</CTableHeaderCell>
                    <CTableHeaderCell>Faculty Name</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 140 }}>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {syllabusRows.map((r) => (
                    <CTableRow key={r.id} active={selectedCourseId === r.id}>
                      <CTableDataCell>
                        <CFormCheck
                          type="radio"
                          name="syllabus-row"
                          checked={selectedCourseId === r.id}
                          onChange={() => setSelectedCourseId(r.id)}
                          aria-label={`Select course ${r.courseCode}`}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.courseCode}</CTableDataCell>
                      <CTableDataCell>{r.courseName}</CTableDataCell>
                      <CTableDataCell>{r.facultyId}</CTableDataCell>
                      <CTableDataCell>{r.facultyName}</CTableDataCell>
                      <CTableDataCell>{r.status}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* Phase 3: Completion Entry Table */}
        {showCompletionTable && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Complete Syllabus Entry</strong>
            </CCardHeader>

            <CCardBody>
              <CTable bordered hover responsive align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 56 }}></CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 130 }}>Date</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 140 }}>Day Order</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 90 }}>Hour</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 170 }}>Choose Chapter</CTableHeaderCell>
                    <CTableHeaderCell>Lecture Topic</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 170 }}>Completion Date</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {completionEdits.map((r) => (
                    <CTableRow key={r.id} active={selectedCompletionId === r.id}>
                      <CTableDataCell>
                        <CFormCheck
                          type="radio"
                          name="completion-row"
                          checked={selectedCompletionId === r.id}
                          onChange={() => setSelectedCompletionId(r.id)}
                          aria-label={`Select row ${r.id}`}
                        />
                      </CTableDataCell>

                      <CTableDataCell>{r.date}</CTableDataCell>
                      <CTableDataCell>{r.dayOrder}</CTableDataCell>
                      <CTableDataCell>{r.hour}</CTableDataCell>

                      <CTableDataCell>
                        <CFormSelect value={r.chapter} disabled>
                          <option value="Unit – I">Unit – I</option>
                          <option value="Unit – II">Unit – II</option>
                          <option value="Unit – III">Unit – III</option>
                          <option value="Unit – IV">Unit – IV</option>
                          <option value="Unit – V">Unit – V</option>
                        </CFormSelect>
                      </CTableDataCell>

                      <CTableDataCell>{r.lectureTopic}</CTableDataCell>

                      <CTableDataCell>
                        <CFormInput
                          type="date"
                          value={r.completionDate}
                          onChange={onCompletionDateChange(r.id)}
                          disabled={!isEdit}
                        />
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <ArpButton label="Save" icon="save" color="success" onClick={onSaveCompletion} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelCompletion} />
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default SyllabusCompletion
