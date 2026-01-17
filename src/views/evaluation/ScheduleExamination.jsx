import React, { useEffect, useMemo, useState } from 'react'
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
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'

const initialViewForm = {
  academicYear: '',
  semester: '',
  examMonthYear: '',
  examName: '',
  programme: '',
  courseScope: '',
}

const ScheduleExamination = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [viewForm, setViewForm] = useState(initialViewForm)

  // table UX
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const rows = useMemo(
    () => [
      {
        id: 1,
        courseCode: '23-2AA-13A',
        courseName: 'Core I - Principles of Accountancy',
        date: '01-06-2025',
        session: 'FN',
        start: '09:00',
        end: '09:45',
        mode: 'Offline',
        duration: '45 mins',
      },
    ],
    [],
  )

  const onViewChange = (key) => (e) =>
    setViewForm((p) => ({ ...p, [key]: e.target.value }))

  // header actions
  const onAddNew = () => {
    setIsEdit(true)
  }

  // form actions
  const onSearch = (e) => {
    e.preventDefault()
    setShowTable(true)
  }

  const onCancel = () => {
    setViewForm(initialViewForm)
    setShowTable(false)
    setSelectedId(null)
    setIsEdit(false)
  }

  // pagination
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const startIdx = (page - 1) * pageSize
  const pageRows = rows.slice(startIdx, startIdx + pageSize)

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>SCHEDULE EXAMINATION</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="primary" onClick={onAddNew} />
              <ArpButton label="Download Template" icon="download" color="success" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Schedule of Examination</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSearch}>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={viewForm.academicYear} onChange={onViewChange('academicYear')}>
                    <option value="">Select</option>
                    <option value="2025-26">2025 – 26</option>
                    <option value="2026-27">2026 – 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={viewForm.semester} onChange={onViewChange('semester')}>
                    <option value="">Select</option>
                    <option value="Sem-1">Sem – 1</option>
                    <option value="Sem-3">Sem – 3</option>
                    <option value="Sem-5">Sem – 5</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Month & Year of Examination</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput type="month" value={viewForm.examMonthYear} onChange={onViewChange('examMonthYear')} />
                </CCol>

                <CCol md={3}><CFormLabel>Name of the Examination</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={viewForm.examName} onChange={onViewChange('examName')}>
                    <option value="">Select</option>
                    <option value="CIA-1">CIA Test – 1</option>
                    <option value="CIA-2">CIA Test – 2</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={viewForm.programme} onChange={onViewChange('programme')}>
                    <option value="">Select</option>
                    <option value="MBA">MBA</option>
                    <option value="MCA">MCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Course Code with Name</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={viewForm.courseScope} onChange={onViewChange('courseScope')}>
                    <option value="">Select</option>
                    <option value="all">All Courses</option>
                    <option value="individual">Individual Courses</option>
                  </CFormSelect>
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Search" icon="view" color="primary" type="submit" />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD ================= */}
        {showTable && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Examination Schedule</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap">
                <CFormInput
                  size="sm"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 240 }}
                />
                <CFormSelect
                  size="sm"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ width: 110 }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </CFormSelect>

                <ArpIconButton icon="edit" color="primary" disabled={!selectedId} />
                <ArpIconButton icon="view" color="info" disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" disabled={!selectedId} />
                <ArpIconButton icon="download" color="success" disabled={!selectedId} />
                <ArpIconButton icon="print" color="secondary" disabled={!selectedId} />
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Session</CTableHeaderCell>
                    <CTableHeaderCell>Start Time</CTableHeaderCell>
                    <CTableHeaderCell>End Time</CTableHeaderCell>
                    <CTableHeaderCell>Mode</CTableHeaderCell>
                    <CTableHeaderCell>Duration</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <input
                          type="radio"
                          name="selectRow"
                          checked={selectedId === r.id}
                          onChange={() => setSelectedId(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.courseCode}</CTableDataCell>
                      <CTableDataCell>{r.courseName}</CTableDataCell>
                      <CTableDataCell>{r.date}</CTableDataCell>
                      <CTableDataCell>{r.session}</CTableDataCell>
                      <CTableDataCell>{r.start}</CTableDataCell>
                      <CTableDataCell>{r.end}</CTableDataCell>
                      <CTableDataCell>{r.mode}</CTableDataCell>
                      <CTableDataCell>{r.duration}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end mt-2">
                <CPagination size="sm">
                  <CPaginationItem disabled={page === 1} onClick={() => setPage(page - 1)}>‹</CPaginationItem>
                  <CPaginationItem active>{page}</CPaginationItem>
                  <CPaginationItem disabled={page === totalPages} onClick={() => setPage(page + 1)}>›</CPaginationItem>
                </CPagination>
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default ScheduleExamination