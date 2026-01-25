import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CFormCheck,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'

import { ArpButton, ArpIconButton, ArpPagination } from '../../components/common'

const initialForm = {
  academicYear: '',
  category: '',
}

const AccreditationReports = () => {
  // ARP standard state pattern
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [form, setForm] = useState(initialForm)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'reportId', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Visibility
  const [showTable, setShowTable] = useState(false)

  // Demo rows (hook API later)
  const rows = useMemo(
    () => [
      { id: 1, reportId: 'ACR001', reportName: 'NAAC Self Study Report' },
      { id: 2, reportId: 'ACR002', reportName: 'NBA Programme Accreditation Report' },
      { id: 3, reportId: 'ACR003', reportName: 'NIRF Ranking Submission Report' },
      { id: 4, reportId: 'ACR004', reportName: 'NAAC AQAR Report' },
      { id: 5, reportId: 'ACR005', reportName: 'NBA SAR Document Report' },
    ],
    [],
  )

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const selectedRow = useMemo(
    () => rows.find((r) => r.id === selectedId) || null,
    [rows, selectedId],
  )

  const onFormChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const sortToggle = (key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    })
  }

  const sortIndicator = (key) => {
    if (sort.key !== key) return ''
    return sort.dir === 'asc' ? ' ▲' : ' ▼'
  }

  const filteredSorted = useMemo(() => {
    const q = normalize(search)
    let data = rows

    if (q) {
      data = rows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))
    }

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) =>
      normalize(a?.[key]).localeCompare(normalize(b?.[key])),
    )
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [rows, search, sort])

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)

  const pageRows = useMemo(
    () => filteredSorted.slice(startIdx, endIdx),
    [filteredSorted, startIdx, endIdx],
  )

  // Header actions
  const onAddNew = () => {
    setIsEdit(true)
    setShowTable(false)
    setSelectedId(null)
    setForm(initialForm)
    // Hook your API here
  }

  const onView = () => {
    // View button loads the table directly (read-only)
    setIsEdit(false)
    setShowTable(true)
    // Hook your API here
  }

  // Form actions
  const onSearchReports = () => {
    setShowTable(true)
    // Hook your API here
  }

  const onResetForm = () => {
    setForm(initialForm)
  }

  const onCancelForm = () => {
    setForm(initialForm)
    setIsEdit(false)
    setShowTable(false)
    setSelectedId(null)
  }

  // Table action buttons
  const onActionView = () => {
    if (!selectedRow) return
    // Report preview page
    window.open(`/reports/accreditation/${selectedRow.reportId}`, '_blank')
  }

  const onActionPrint = () => {
    if (!selectedRow) return
    // Print-friendly preview page (hook print behavior in preview page)
    window.open(`/reports/accreditation/${selectedRow.reportId}?print=1`, '_blank')
  }

  const onActionDownload = () => {
    if (!selectedRow) return
    // Static file path (replace with your actual static location)
    window.open(`/static/accreditation-reports/${selectedRow.reportId}.pdf`, '_blank')
  }

  const onActionDelete = () => {
    if (!selectedRow) return
    // Hook your API here
    // eslint-disable-next-line no-alert
    alert(`Delete action (demo): ${selectedRow.reportId}`)
  }

  const actionDisabled = !selectedId

  return (
    <CRow>
      <CCol xs={12}>
        {/* A) Header Action Card (Top) */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>ACCREDITATION REPORTS</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="View" icon="view" color="info" onClick={onView} />
            </div>
          </CCardHeader>
        </CCard>

        {/* B) Form Card */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Accreditation Reports</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
                {/* Row 1 / Col 1-4 */}
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.academicYear}
                    onChange={onFormChange('academicYear')}
                    disabled={!isEdit}
                  >
                    <option value="">Select</option>
                    <option value="2025-26">2025 – 26</option>
                    <option value="2026-27">2026 – 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Category</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.category}
                    onChange={onFormChange('category')}
                    disabled={!isEdit}
                  >
                    <option value="">Select</option>
                    <option value="NAAC">NAAC</option>
                    <option value="NBA">NBA</option>
                    <option value="NIRF">NIRF</option>
                  </CFormSelect>
                </CCol>

                {/* Buttons below form - right aligned */}
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Search" icon="search" color="info" onClick={onSearchReports} />
                  <ArpButton label="Reset" icon="reset" color="warning" onClick={onResetForm} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelForm} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* C) Table Card */}
        {showTable && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Reports to be Generated for</strong>

              {/* ARP Toolbar: Search + Page size + Circle action buttons (one row, no wrap) */}
              <div className="d-flex align-items-center gap-2 flex-nowrap overflow-auto">
                <CInputGroup size="sm" style={{ minWidth: 240 }}>
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </CInputGroup>

                <CFormSelect
                  size="sm"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ width: 110 }}
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </CFormSelect>

                <ArpIconButton icon="view" title="View" onClick={onActionView} disabled={actionDisabled} />
                <ArpIconButton icon="print" title="Print" onClick={onActionPrint} disabled={actionDisabled} />
                <ArpIconButton
                  icon="download"
                  title="Download"
                  onClick={onActionDownload}
                  disabled={actionDisabled}
                />
                <ArpIconButton icon="delete" title="Delete" onClick={onActionDelete} disabled={actionDisabled} />
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>

                    <CTableHeaderCell role="button" onClick={() => sortToggle('reportId')}>
                      Report Id{sortIndicator('reportId')}
                    </CTableHeaderCell>

                    <CTableHeaderCell role="button" onClick={() => sortToggle('reportName')}>
                      Name of the Report{sortIndicator('reportName')}
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {pageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={3} className="text-center">
                        No records found
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    pageRows.map((r) => (
                      <CTableRow key={r.id} active={r.id === selectedId}>
                        <CTableDataCell>
                          <CFormCheck
                            type="radio"
                            name="accreditationReportsSelect"
                            checked={r.id === selectedId}
                            onChange={() => setSelectedId(r.id)}
                          />
                        </CTableDataCell>

                        <CTableDataCell>{r.reportId}</CTableDataCell>
                        <CTableDataCell>{r.reportName}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end mt-2">
                <ArpPagination
                  size="sm"
                  align="end"
                  page={safePage}
                  pageSize={pageSize}
                  total={total}
                  onPageChange={setPage}
                  prevText="Previous"
                  nextText="Next"
                />
              </div>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default AccreditationReports
