import React, { useMemo, useRef, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * RegulationMapConfiguration.jsx (ARP CoreUI React Pro Standard)
 * - Strict 3-card layout: Header Action Card + Form Card + Table Card (ArpDataTable)
 * - Uses ArpDataTable for Search + Page Size + Sorting + Pagination + Selection
 * - No manual search/pagination logic inside the module
 * - No direct @coreui/icons imports (no CIcon/cilSearch)
 * - Demo rows only. Hook API where indicated.
 */

const initialForm = {
  academicYear: '',
  regulationCode: '',
  programmeCode: '',
  programme: '',
  batch: '',
  semester: '',
}

export default function RegulationMapConfiguration() {
  // ARP mandatory state pattern
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)

  // Optional: show table after Search click (matches typical "Search" intent)
  const [tableVisible, setTableVisible] = useState(true)

  // Upload ref (kept for future use)
  const fileRef = useRef(null)

  // Sample dropdown values (replace with API)
  const academicYears = ['2025 - 26', '2026 - 27']
  const regulationCodes = ['N26', 'N27', 'REG25-26']
  const programmeCodes = ['26MBA', '27MCA', '26MCA', '27MBA']
  const programmes = ['MBA', 'MCA']
  const batches = ['2025 - 26', '2026 - 27']
  const semesters = ['Sem-1', 'Sem-3', 'Sem-5']

  // Sample rows (replace with API)
  const [rows, setRows] = useState([
    {
      id: 1,
      academicYear: '2025 - 26',
      regulationCode: 'N26',
      programmeCode: '26MCA',
      programme: 'MCA',
      batch: '2025 - 26',
      status: 'Map Pending',
    },
    {
      id: 2,
      academicYear: '2025 - 26',
      regulationCode: 'N27',
      programmeCode: '27MBA',
      programme: 'MBA',
      batch: '2026 - 27',
      status: 'Map Done',
    },
  ])

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  /* =========================
     HEADER / FORM ACTIONS
  ========================== */

  const onAddNew = () => {
    setIsEdit(true)
    setForm(initialForm)
    setSelectedId(null)
    // keep table visibility as-is
  }

  const onCancel = () => {
    setIsEdit(false)
    setForm(initialForm)
    setSelectedId(null)
    // keep table visible; change to false if you want to hide
    // setTableVisible(false)
  }

  const onSearch = () => {
    // Hook API call here (based on selected filters)
    // Example:
    // fetchMappingStatus(form).then(setRows)
    setTableVisible(true)
  }

  /* =========================
     TABLE ACTIONS
  ========================== */

  const selectedRow = rows.find((r) => String(r.id) === String(selectedId)) || null

  const onView = () => {
    if (!selectedRow) return
    // Hook view logic (modal/page) here
    // Example: open modal with selectedRow
  }

  const onEdit = () => {
    if (!selectedRow) return
    // Hook edit logic (load row into form) here
    // Typically you may allow editing mapping in another screen
  }

  const onDelete = () => {
    if (!selectedRow) return
    // Hook delete logic here
    // For demo, remove row
    setRows((prev) => prev.filter((r) => String(r.id) !== String(selectedRow.id)))
    setSelectedId(null)
  }

  /* =========================
     ArpDataTable CONFIG
  ========================== */

  const columns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true, width: 140 },
      { key: 'regulationCode', label: 'Regulation Code', sortable: true, width: 140, align: 'center' },
      { key: 'programmeCode', label: 'Programme Code', sortable: true, width: 150, align: 'center' },
      { key: 'programme', label: 'Programme', sortable: true, width: 120, align: 'center' },
      { key: 'batch', label: 'Batch', sortable: true, width: 140, align: 'center' },
      { key: 'status', label: 'Map Status', sortable: true, width: 140, align: 'center' },
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
            <strong>REGULATIONS MAP CONFIGURATIONS</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
            </div>
          </CCardHeader>
        </CCard>

        {/* ===================== B) FORM CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Map Courses to Curriculum Regulation</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
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
                  <CFormLabel>Select Regulation Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.regulationCode} onChange={onChange('regulationCode')} disabled={!isEdit}>
                    <option value="">Select Regulation Code</option>
                    {regulationCodes.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeCode} onChange={onChange('programmeCode')} disabled={!isEdit}>
                    <option value="">Select Programme Code</option>
                    {programmeCodes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Select Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programme} onChange={onChange('programme')} disabled={!isEdit}>
                    <option value="">Select Programme</option>
                    {programmes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Select Batches</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.batch} onChange={onChange('batch')} disabled={!isEdit}>
                    <option value="">Select Batches</option>
                    {batches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Select Semester</CFormLabel>
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

                {/* Actions */}
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton
                    label="Search"
                    icon="search"
                    color="primary"
                    type="button"
                    onClick={onSearch}
                    disabled={!isEdit}
                    title="Search"
                  />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} title="Cancel" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ===================== C) TABLE CARD (ArpDataTable) ===================== */}
        {tableVisible && (
          <ArpDataTable
            title="STATUS OF MAP REGULATION"
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
              name: 'mapRegSelect',
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
