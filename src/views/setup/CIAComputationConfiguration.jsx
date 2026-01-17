import React, { useMemo, useState } from 'react'
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
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import { ArpButton, ArpIconButton } from '../../components/common'

/**
 * Converted from cia_computation.html
 * ARP Standard:
 * - 3-card layout (Header → Form → Table)
 * - Add New enables form fields
 * - Dynamic add/remove computation rows (A, B, C...)
 * - Search + Page Size + Circle Action Icons in ONE row
 */

const emptyRow = () => ({
  exam: '',
  minMarks: 0,
  maxMarks: 0,
})

const CIAComputationConfiguration = () => {
  const [isEdit, setIsEdit] = useState(false)

  const [academicYear, setAcademicYear] = useState('')
  const [ciaCode, setCiaCode] = useState('')
  const [rows, setRows] = useState([emptyRow()])

  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const tableData = [
    {
      id: 1,
      programCode: 'XXX',
      programme: 'XXX',
      semester: 'XXX',
      batch: 'No',
      regNo: 'XXX - XXX',
      name: 'XXX - XXX',
      className: 'XXX - XXX',
      label: 'XXX - XXX',
    },
  ]

  const addRow = () => setRows((p) => [...p, emptyRow()])
  const removeRow = (idx) => setRows((p) => p.filter((_, i) => i !== idx))

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const filtered = useMemo(() => {
    const q = normalize(search)
    if (!q) return tableData
    return tableData.filter((r) =>
      Object.values(r).map(normalize).join(' ').includes(q),
    )
  }, [search])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * pageSize
  const pageRows = filtered.slice(startIdx, startIdx + pageSize)

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>CIA COMPUTATION</strong>
            <ArpButton label="Add New" icon="add" color="purple" onClick={() => setIsEdit(true)} />
          </CCardHeader>
        </CCard>

        {/* ================= FORM ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>CIA Computation Code Generate for</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3 mb-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                  <CFormSelect value={academicYear} disabled={!isEdit} onChange={(e) => setAcademicYear(e.target.value)}>
                    <option value="">Select</option>
                    <option>2025 – 26</option>
                    <option>2026 – 27</option>
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>CIA Assessment Code</CFormLabel>
                  <CFormInput value={ciaCode} disabled={!isEdit} onChange={(e) => setCiaCode(e.target.value)} />
                </CCol>
              </CRow>

              <CTable bordered responsive align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>CAC Index</CTableHeaderCell>
                    <CTableHeaderCell>Name of the Examination</CTableHeaderCell>
                    <CTableHeaderCell>Minimum Marks</CTableHeaderCell>
                    <CTableHeaderCell>Maximum Marks</CTableHeaderCell>
                    <CTableHeaderCell>Action</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {rows.map((r, idx) => (
                    <CTableRow key={idx}>
                      <CTableDataCell>{String.fromCharCode(65 + idx)}</CTableDataCell>
                      <CTableDataCell>
                        <CFormSelect disabled={!isEdit}>
                          <option>Select Examination</option>
                          <option>CIA Test – 1</option>
                          <option>CIA Test – 2</option>
                        </CFormSelect>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CFormInput type="number" value={r.minMarks} disabled={!isEdit} />
                      </CTableDataCell>
                      <CTableDataCell>
                        <CFormInput type="number" value={r.maxMarks} disabled={!isEdit} />
                      </CTableDataCell>
                      <CTableDataCell>
                        {idx === rows.length - 1 ? (
                          <ArpButton label="" icon="add" color="success" onClick={addRow} disabled={!isEdit} />
                        ) : (
                          <ArpButton label="" icon="delete" color="danger" onClick={() => removeRow(idx)} disabled={!isEdit} />
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <ArpButton label="Save" icon="save" color="success" disabled={!isEdit} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={() => setIsEdit(false)} />
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= TABLE ================= */}
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Computation Codes</strong>

            <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
              <CInputGroup size="sm" style={{ width: 280 }}>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
              </CInputGroup>

              <CFormSelect size="sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ width: 120 }}>
                {[5, 10, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </CFormSelect>

              <div className="d-flex gap-2 flex-nowrap">
                <ArpIconButton icon="view" color="purple" disabled={!selectedId} />
                <ArpIconButton icon="edit" color="info" disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" disabled={!selectedId} />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Program Code</CTableHeaderCell>
                  <CTableHeaderCell>Programme</CTableHeaderCell>
                  <CTableHeaderCell>Semester</CTableHeaderCell>
                  <CTableHeaderCell>Batch</CTableHeaderCell>
                  <CTableHeaderCell>Reg. No.</CTableHeaderCell>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Class</CTableHeaderCell>
                  <CTableHeaderCell>Label</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {pageRows.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell>
                      <CFormCheck
                        type="radio"
                        name="ciaCompSel"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{r.programCode}</CTableDataCell>
                    <CTableDataCell>{r.programme}</CTableDataCell>
                    <CTableDataCell>{r.semester}</CTableDataCell>
                    <CTableDataCell>{r.batch}</CTableDataCell>
                    <CTableDataCell>{r.regNo}</CTableDataCell>
                    <CTableDataCell>{r.name}</CTableDataCell>
                    <CTableDataCell>{r.className}</CTableDataCell>
                    <CTableDataCell>{r.label}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>

            <div className="d-flex justify-content-end mt-2">
              <CPagination size="sm">
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage(1)}>
                  «
                </CPaginationItem>
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ‹
                </CPaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <CPaginationItem key={i + 1} active={safePage === i + 1} onClick={() => setPage(i + 1)}>
                    {i + 1}
                  </CPaginationItem>
                ))}
                <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  ›
                </CPaginationItem>
                <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>
                  »
                </CPaginationItem>
              </CPagination>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default CIAComputationConfiguration
