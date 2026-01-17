import React, { useMemo, useState } from 'react'
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

const WardProfile = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)

  const rows = useMemo(
    () => [
      {
        id: 1,
        batch: '2023-26',
        regNo: '23CS001',
        studentName: 'Student A',
        contactNumber: '9876543210',
        email: 'studenta@mail.com',
        parentNumber: '9123456780',
        status: 'Active',
      },
      {
        id: 2,
        batch: '2023-26',
        regNo: '23CS002',
        studentName: 'Student B',
        contactNumber: '9876543220',
        email: 'studentb@mail.com',
        parentNumber: '9123456790',
        status: 'Active',
      },
    ],
    [],
  )

  const filteredRows = useMemo(() => {
    const q = (search || '').toLowerCase().trim()
    if (!q) return rows
    return rows.filter((r) =>
      [
        r.batch,
        r.regNo,
        r.studentName,
        r.contactNumber,
        r.email,
        r.parentNumber,
        r.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [rows, search])

  const onAddNew = () => {
    setIsEdit(true)
    setShowTable(false)
    setSelectedId(null)
  }

  const onCancel = () => {
    setIsEdit(false)
    setShowTable(false)
    setSelectedId(null)
    setSearch('')
    setPageSize(10)
  }

  return (
    <>
      {/* 1) Header Action Card */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Ward Profile</strong>
          <div className="d-flex gap-2">
            <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
            <ArpButton
              label="Edit"
              icon="edit"
              color="primary"
              disabled={!selectedId}
              onClick={() => setIsEdit(true)}
            />
            <ArpButton label="Upload" icon="upload" color="info" disabled={!selectedId} />
            <ArpButton label="Download Template" icon="download" color="danger" />
          </div>
        </CCardHeader>
      </CCard>

      {/* 2) Form Card */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>View Ward Profile</strong>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-3">
            <CCol md={3}>
              <CFormLabel>Academic Year</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormSelect disabled={!isEdit}>
                <option>Select Academic Year</option>
                <option>2025 - 26</option>
                <option>2026 - 27</option>
              </CFormSelect>
            </CCol>

            <CCol md={3}>
              <CFormLabel>Semester</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormSelect disabled={!isEdit}>
                <option>Choose Semester</option>
                <option>Sem - 1</option>
                <option>Sem - 3</option>
              </CFormSelect>
            </CCol>

            <CCol md={3}>
              <CFormLabel>Department</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormSelect disabled={!isEdit}>
                <option>Select Department</option>
                <option>Computer Science</option>
                <option>Commerce</option>
              </CFormSelect>
            </CCol>

            <CCol md={3}>
              <CFormLabel>Faculty</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormSelect disabled={!isEdit}>
                <option>Choose Faculty</option>
                <option>G. Priya</option>
                <option>T. Sruthi</option>
              </CFormSelect>
            </CCol>

            {/* Search / Cancel (bottom-right only) */}
            <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
              <ArpButton
                label="Search"
                icon="search"
                color="primary"
                type="button"
                onClick={() => setShowTable(true)}
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
        </CCardBody>
      </CCard>

      {/* 3) Table Card */}
      {showTable && (
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Ward Student List</strong>

            {/* Search + Page Size + Circle Icon (single no-wrap row) */}
            <div className="d-flex align-items-center gap-2 flex-nowrap">
              <CFormInput
                size="sm"
                placeholder="Search..."
                style={{ width: 220 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <CFormSelect
                size="sm"
                style={{ width: 110 }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                title="Page size"
              >
                {[5, 10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </CFormSelect>

              <CTooltip content="View Ward Profile">
                <span className="d-inline-block">
                  <ArpIconButton icon="view" color="primary" disabled={!selectedId} title="View" />
                </span>
              </CTooltip>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Batch</CTableHeaderCell>
                  <CTableHeaderCell>Reg. No</CTableHeaderCell>
                  <CTableHeaderCell>Student Name</CTableHeaderCell>
                  <CTableHeaderCell>Contact Number</CTableHeaderCell>
                  <CTableHeaderCell>E-Mail ID</CTableHeaderCell>
                  <CTableHeaderCell>Parent Number</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredRows.slice(0, pageSize).map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell className="text-center">
                      <CFormCheck
                        type="radio"
                        name="selectWardProfile"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{r.batch}</CTableDataCell>
                    <CTableDataCell>{r.regNo}</CTableDataCell>
                    <CTableDataCell>{r.studentName}</CTableDataCell>
                    <CTableDataCell>{r.contactNumber}</CTableDataCell>
                    <CTableDataCell>{r.email}</CTableDataCell>
                    <CTableDataCell>{r.parentNumber}</CTableDataCell>
                    <CTableDataCell>{r.status}</CTableDataCell>
                  </CTableRow>
                ))}

                {filteredRows.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center text-muted py-4">
                      No records found
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}
    </>
  )
}

export default WardProfile
