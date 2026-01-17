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

const FacultyProfile = () => {
  const [showList, setShowList] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const rows = useMemo(
    () => [
      {
        id: 1,
        code: '10MCA01',
        name: 'Dr. Priya G',
        designation: 'Assistant Professor',
        contact: '9994027264',
        email: 'Priya_g@gmail.com',
        experience: '12 Years',
        status: 'Active',
      },
      {
        id: 2,
        code: '10MCA02',
        name: 'Dr. Kumar R',
        designation: 'Associate Professor',
        contact: '9898989898',
        email: 'kumar_r@gmail.com',
        experience: '15 Years',
        status: 'Active',
      },
    ],
    [],
  )

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return rows
    return rows.filter((r) => Object.values(r).join(' ').toLowerCase().includes(q))
  }, [rows, search])

  const totalRows = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const currentPage = Math.min(page, totalPages)

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, currentPage, pageSize])

  const onSearch = () => {
    setShowList(true)
    setSelectedId(null)
    setPage(1)
  }

  const onCancel = () => {
    setShowList(false)
    setSelectedId(null)
    setSearch('')
    setPageSize(10)
    setPage(1)
  }

  return (
    <>
      {/* Header Card */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Faculty Profile</strong>
        </CCardHeader>
      </CCard>

      {/* Search Form */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Faculty Profile</strong>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-3">
            <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
            <CCol md={3}>
              <CFormSelect>
                <option>Select</option>
                <option>2025 - 26</option>
                <option>2026 - 27</option>
              </CFormSelect>
            </CCol>

            <CCol md={3}><CFormLabel>Choose Department</CFormLabel></CCol>
            <CCol md={3}>
              <CFormSelect>
                <option>Select</option>
                <option>Commerce</option>
                <option>Computer Science</option>
              </CFormSelect>
            </CCol>

            <CCol md={3}><CFormLabel>Faculty Code</CFormLabel></CCol>
            <CCol md={3}>
              <CFormInput placeholder="Search Faculty Code" />
            </CCol>

            <CCol md={3}><CFormLabel>Faculty Name</CFormLabel></CCol>
            <CCol md={3}>
              <CFormInput placeholder="Search Faculty Name" />
            </CCol>

            <CCol xs={12} className="d-flex justify-content-end gap-2 flex-wrap mt-2">
              <ArpButton label="Search" icon="search" color="primary" onClick={onSearch} />
              <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Faculty List */}
      {showList && (
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Faculty List</strong>

            <div className="d-flex align-items-center gap-2 flex-nowrap">
              <CFormInput
                size="sm"
                placeholder="Search..."
                style={{ width: 220 }}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
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
              >
                {[5, 10, 25, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </CFormSelect>

              <CTooltip content="View Profile">
                <span className="d-inline-block">
                  <ArpIconButton icon="view" color="primary" disabled={!selectedId} />
                </span>
              </CTooltip>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable bordered responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Faculty Code</CTableHeaderCell>
                  <CTableHeaderCell>Faculty Name</CTableHeaderCell>
                  <CTableHeaderCell>Designation</CTableHeaderCell>
                  <CTableHeaderCell>Contact No</CTableHeaderCell>
                  <CTableHeaderCell>Email Id</CTableHeaderCell>
                  <CTableHeaderCell>Experience</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {pagedRows.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell className="text-center">
                      <CFormCheck
                        type="radio"
                        name="selectFaculty"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{r.code}</CTableDataCell>
                    <CTableDataCell>{r.name}</CTableDataCell>
                    <CTableDataCell>{r.designation}</CTableDataCell>
                    <CTableDataCell>{r.contact}</CTableDataCell>
                    <CTableDataCell>{r.email}</CTableDataCell>
                    <CTableDataCell>{r.experience}</CTableDataCell>
                    <CTableDataCell>{r.status}</CTableDataCell>
                  </CTableRow>
                ))}

                {pagedRows.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center text-muted py-4">
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
    </>
  )
}

export default FacultyProfile
