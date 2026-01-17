import React, { useState } from 'react'
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
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CInputGroup,
  CInputGroupText,
  CPagination,
  CPaginationItem,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import { ArpButton, ArpIconButton } from '../../components/common'

/**
 * Converted from timetable.html
 * - Add New enables form
 * - Dynamic add/remove timetable rows
 * - Search + page size + action icons in ONE row
 */

const emptyRow = () => ({
  timeFrom: '',
  timeTo: '',
  nomenclature: '',
  isInterval: 'No',
  priority: '',
})

const TimetableConfiguration = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [shiftId, setShiftId] = useState('')
  const [shiftName, setShiftName] = useState('')
  const [rows, setRows] = useState([emptyRow()])

  const [tableData] = useState([
    {
      id: 1,
      programmeCode: 'MCA',
      programme: 'Master of Computer Applications',
      semester: '2016',
      batch: 'Yes',
      regNo: 'XXX - XXX',
      name: 'XXX - XXX',
      className: 'XXX - XXX',
      label: 'XXX - XXX',
    },
  ])

  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const addRow = () => setRows((prev) => [...prev, emptyRow()])
  const removeRow = (idx) => setRows((prev) => prev.filter((_, i) => i !== idx))

  const updateRow = (idx, key, value) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)),
    )
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>TIMETABLE CONFIGURATION</strong>
            <ArpButton label="Add New" icon="add" color="purple" onClick={() => setIsEdit(true)} />
          </CCardHeader>
        </CCard>

        {/* FORM */}
        <CCard className="mb-3">
          <CCardHeader><strong>Add Timetable</strong></CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="mb-3">
                <CCol md={2}><CFormLabel>Shift Id</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput value={shiftId} onChange={(e) => setShiftId(e.target.value)} disabled={!isEdit} />
                </CCol>
                <CCol md={2}><CFormLabel>Shift Name</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput value={shiftName} onChange={(e) => setShiftName(e.target.value)} disabled={!isEdit} />
                </CCol>
              </CRow>

              <CRow className="fw-bold mb-2">
                <CCol md={2}>Time From</CCol>
                <CCol md={2}>Time To</CCol>
                <CCol md={3}>Nomenclature</CCol>
                <CCol md={2}>Is Interval</CCol>
                <CCol md={2}>Priority</CCol>
                <CCol md={1} className="text-center">Action</CCol>
              </CRow>

              {rows.map((r, idx) => (
                <CRow key={idx} className="mb-2 align-items-center">
                  <CCol md={2}>
                    <CFormInput type="time" value={r.timeFrom} disabled={!isEdit}
                      onChange={(e) => updateRow(idx, 'timeFrom', e.target.value)} />
                  </CCol>
                  <CCol md={2}>
                    <CFormInput type="time" value={r.timeTo} disabled={!isEdit}
                      onChange={(e) => updateRow(idx, 'timeTo', e.target.value)} />
                  </CCol>
                  <CCol md={3}>
                    <CFormInput value={r.nomenclature} disabled={!isEdit}
                      onChange={(e) => updateRow(idx, 'nomenclature', e.target.value)} />
                  </CCol>
                  <CCol md={2}>
                    <CFormSelect value={r.isInterval} disabled={!isEdit}
                      onChange={(e) => updateRow(idx, 'isInterval', e.target.value)}>
                      <option>No</option>
                      <option>Yes</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={2}>
                    <CFormInput type="number" value={r.priority} disabled={!isEdit}
                      onChange={(e) => updateRow(idx, 'priority', e.target.value)} />
                  </CCol>
                  <CCol md={1} className="text-center">
                    {idx === rows.length - 1 ? (
                      <CButton size="sm" color="success" disabled={!isEdit} onClick={addRow}>+</CButton>
                    ) : (
                      <CButton size="sm" color="danger" disabled={!isEdit} onClick={() => removeRow(idx)}>-</CButton>
                    )}
                  </CCol>
                </CRow>
              ))}

              <div className="d-flex justify-content-end gap-2 mt-3">
                <ArpButton label="Save" icon="save" color="success" disabled={!isEdit} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={() => setIsEdit(false)} />
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        {/* TABLE */}
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Student Details</strong>
            <div className="d-flex align-items-center gap-2 flex-nowrap">
              <CInputGroup size="sm" style={{ width: 260 }}>
                <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                <CFormInput placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </CInputGroup>
              <CFormSelect size="sm" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ width: 120 }}>
                {[5, 10, 20].map((n) => <option key={n} value={n}>{n} / page</option>)}
              </CFormSelect>
              <div className="d-flex gap-2">
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
                {tableData.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell>
                      <CFormCheck type="radio" name="ttSel" checked={selectedId === r.id} onChange={() => setSelectedId(r.id)} />
                    </CTableDataCell>
                    <CTableDataCell>{r.programmeCode}</CTableDataCell>
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
                <CPaginationItem disabled>{'«'}</CPaginationItem>
                <CPaginationItem active>1</CPaginationItem>
                <CPaginationItem>{'»'}</CPaginationItem>
              </CPagination>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default TimetableConfiguration
