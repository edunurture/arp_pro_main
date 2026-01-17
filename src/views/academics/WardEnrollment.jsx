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

const WardEnrollment = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)

  const rows = useMemo(
    () => [
      {
        id: 1,
        faculty: 'KCAS01 – Ms. P. Priya',
        designation: 'Assistant Professor',
        department: 'Commerce',
        status: 'Ward Enrollment is Pending',
      },
      {
        id: 2,
        faculty: 'KCAS01 – Ms. T. Sruthi',
        designation: 'Assistant Professor',
        department: 'Commerce',
        status: 'Ward Enrollment is Pending',
      },
    ],
    [],
  )

  const filteredRows = useMemo(() => {
    const q = (search || '').toLowerCase().trim()
    if (!q) return rows
    return rows.filter((r) =>
      [r.faculty, r.designation, r.department, r.status].join(' ').toLowerCase().includes(q),
    )
  }, [rows, search])

  const onAddNew = () => {
    setIsEdit(true)
    setShowTable(false)
    setSelectedId(null)
  }

  const onSearch = () => {
    setShowTable(true)
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
          <strong>Ward Enrollment</strong>
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
          <strong>Tutor Ward Enrollment</strong>
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

            <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
              <ArpButton label="Search" icon="search" color="primary" type="button" onClick={onSearch} />
              <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* 3) Table Card */}
      {showTable && (
        <CCard>
          {/* ✅ Search + Page Size + Circle Icons in ONE no-wrap row (ClassesConfiguration.js pattern) */}
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Ward Enrollment Details</strong>

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

              <div className="d-flex gap-2 flex-nowrap">
                <CTooltip content="Upload">
                  <span className="d-inline-block">
                    <ArpIconButton icon="upload" color="success" disabled={!selectedId} title="Upload" />
                  </span>
                </CTooltip>

                <CTooltip content="Download">
                  <span className="d-inline-block">
                    <ArpIconButton icon="download" color="primary" disabled={!selectedId} title="Download" />
                  </span>
                </CTooltip>

                <CTooltip content="View">
                  <span className="d-inline-block">
                    <ArpIconButton icon="view" color="primary" disabled={!selectedId} title="View" />
                  </span>
                </CTooltip>

                <CTooltip content="Edit">
                  <span className="d-inline-block">
                    <ArpIconButton icon="edit" color="info" disabled={!selectedId} title="Edit" />
                  </span>
                </CTooltip>

                <CTooltip content="Delete">
                  <span className="d-inline-block">
                    <ArpIconButton icon="delete" color="danger" disabled={!selectedId} title="Delete" />
                  </span>
                </CTooltip>
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Faculty Id / Name</CTableHeaderCell>
                  <CTableHeaderCell>Designation</CTableHeaderCell>
                  <CTableHeaderCell>Department</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredRows.slice(0, pageSize).map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell className="text-center">
                      <CFormCheck
                        type="radio"
                        name="selectWardEnrollment"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{r.faculty}</CTableDataCell>
                    <CTableDataCell>{r.designation}</CTableDataCell>
                    <CTableDataCell>{r.department}</CTableDataCell>
                    <CTableDataCell>{r.status}</CTableDataCell>
                  </CTableRow>
                ))}

                {filteredRows.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={5} className="text-center text-muted py-4">
                      No records found
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>

            {/* Save / Cancel (bottom-right only) */}
            <div className="d-flex justify-content-end gap-2 mt-3">
              <ArpButton label="Save" icon="save" color="success" type="button" disabled={!isEdit} />
              <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
            </div>
          </CCardBody>
        </CCard>
      )}
    </>
  )
}

export default WardEnrollment
