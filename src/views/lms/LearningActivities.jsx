import React, { useMemo, useState, useEffect } from 'react'
import { ArpButton, ArpIconButton } from '../../components/common'

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
  CFormCheck,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CPagination,
  CPaginationItem,
} from '@coreui/react-pro'

const initialForm = {
  academicYear: '',
  semester: '',
  programmeCode: '',
  programmeName: '',
  courseName: '',
  faculty: '',
  className: '',
  classLabel: '',
}

const LearningActivities = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)

  // Table UX
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  // Sample rows (replace with API later)
  const [rows] = useState([
    {
      id: 1,
      date: '25/03/25',
      topic: 'Research Methodology',
      methodology: 'Participative Learning',
      activity: 'Group Discussion',
      remarks: 'Scheduled',
    },
  ])

  const onChange = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setForm(initialForm)
    setSelectedId(null)
    setIsEdit(true)
  }

  const onEdit = () => {
    if (!selectedId) return
    setIsEdit(true)
  }

  const onCancel = () => setIsEdit(false)

  const onSave = (e) => {
    e.preventDefault()
    setIsEdit(false)
  }

  // Search filter
  const filteredRows = useMemo(() => {
    if (!search) return rows
    return rows.filter((r) =>
      Object.values(r).join(' ').toLowerCase().includes(search.toLowerCase()),
    )
  }, [rows, search])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const pageRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  return (
    <CRow>
      <CCol xs={12}>
        {/* 1️⃣ HEADER ACTION CARD */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>LEARNING ACTIVITIES</strong>

            <div className="d-flex gap-2">
              <ArpButton
                label="Add New"
                icon="add"
                color="purple"
                onClick={onAddNew}
              />
              <ArpButton
                label="Edit"
                icon="edit"
                color="primary"
                onClick={onEdit}
                disabled={!selectedId}
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* 2️⃣ FORM CARD */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Learning Activities Configuration</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    disabled={!isEdit}
                    value={form.academicYear}
                    onChange={onChange('academicYear')}
                  >
                    <option value="">Select</option>
                    <option value="2025-26">2025-26</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    disabled={!isEdit}
                    value={form.semester}
                    onChange={onChange('semester')}
                  >
                    <option value="">Select</option>
                    <option value="Sem-1">Sem-1</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    disabled={!isEdit}
                    value={form.programmeCode}
                    onChange={onChange('programmeCode')}
                  >
                    <option value="">Select</option>
                    <option value="N6MCA">N6MCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    disabled
                    value={form.programmeName}
                  />
                </CCol>

                {/* SAVE / CANCEL */}
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton
                    label="Save"
                    icon="save"
                    color="success"
                    type="submit"
                    disabled={!isEdit}
                  />
                  <ArpButton
                    label="Cancel"
                    icon="cancel"
                    color="secondary"
                    type="button"
                    onClick={onCancel}
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* 3️⃣ TABLE CARD */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Learning Activities Details</strong>

            <div className="d-flex align-items-center gap-2">
              <CFormInput
                size="sm"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <CFormSelect
                size="sm"
                style={{ width: 110 }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
              </CFormSelect>

              <ArpIconButton icon="view" color="primary" disabled={!selectedId} />
              <ArpIconButton icon="edit" color="info" disabled={!selectedId} />
              <ArpIconButton icon="delete" color="danger" disabled={!selectedId} />
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Topic</CTableHeaderCell>
                  <CTableHeaderCell>Methodology</CTableHeaderCell>
                  <CTableHeaderCell>Activity</CTableHeaderCell>
                  <CTableHeaderCell>Remarks</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {pageRows.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell>
                      <CFormCheck
                        type="radio"
                        name="row"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{r.date}</CTableDataCell>
                    <CTableDataCell>{r.topic}</CTableDataCell>
                    <CTableDataCell>{r.methodology}</CTableDataCell>
                    <CTableDataCell>{r.activity}</CTableDataCell>
                    <CTableDataCell>{r.remarks}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>

            <CPagination align="end" className="mt-2">
              <CPaginationItem
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </CPaginationItem>
              <CPaginationItem
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </CPaginationItem>
            </CPagination>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default LearningActivities
