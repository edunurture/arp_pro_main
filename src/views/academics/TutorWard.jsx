
import React, { useState } from 'react'
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

import ArpButton from '../../components/common/ArpButton'
import ArpIconButton from '../../components/common/ArpIconButton'

const TutorWard = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const onSearch = () => {
    setShowTable(true)
  }

  const onCancel = () => {
    setIsEdit(false)
    setShowTable(false)
    setSelectedId(null)
  }

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Tutor Ward</strong>
          <div className="d-flex gap-2">
            <ArpButton label="Add New" icon="add" color="purple" onClick={() => setIsEdit(true)} />
            <ArpButton label="Edit" icon="edit" color="primary" disabled={!selectedId} onClick={() => setIsEdit(true)} />
            <ArpButton label="Upload" icon="upload" color="info" disabled={!selectedId} />
            <ArpButton label="Download Template" icon="download" color="danger" />
          </div>
        </CCardHeader>
      </CCard>

      <CCard className="mb-3">
        <CCardHeader>
          <strong>Tutor Ward Allotment</strong>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-3">
            <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
            <CCol md={3}>
              <CFormSelect disabled={!isEdit}>
                <option>Select Academic Year</option>
                <option>2025 - 26</option>
                <option>2026 - 27</option>
              </CFormSelect>
            </CCol>
            <CCol md={3}><CFormLabel>Semester</CFormLabel></CCol>
            <CCol md={3}>
              <CFormSelect disabled={!isEdit}>
                <option>Choose Semester</option>
                <option>Sem - 1</option>
                <option>Sem - 3</option>
              </CFormSelect>
            </CCol>
          </CRow>

          <CCol xs={12} className="d-flex justify-content-end gap-2 mt-3">
            <ArpButton label="Search" icon="search" color="primary" type="button" onClick={onSearch} />
            <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
          </CCol>
        </CCardBody>
      </CCard>

      {showTable && (
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Tutor Ward Details</strong>
            <div className="d-flex align-items-center gap-2 flex-nowrap">
              <CFormInput size="sm" placeholder="Search..." />
              <CFormSelect size="sm" style={{ width: 110 }}>
                <option>10</option>
                <option>25</option>
              </CFormSelect>
                            <CTooltip content="Upload"><span className="d-inline-block"><ArpIconButton icon="upload" color="success" disabled={!selectedId} /></span></CTooltip>
              <CTooltip content="Download"><span className="d-inline-block"><ArpIconButton icon="download" color="primary" disabled={!selectedId} /></span></CTooltip>
<CTooltip content="View"><span className="d-inline-block"><ArpIconButton icon="view" color="primary" disabled={!selectedId} /></span></CTooltip>
              <CTooltip content="Edit"><span className="d-inline-block"><ArpIconButton icon="edit" color="info" disabled={!selectedId} /></span></CTooltip>
              <CTooltip content="Delete"><span className="d-inline-block"><ArpIconButton icon="delete" color="danger" disabled={!selectedId} /></span></CTooltip>
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
                <CTableRow>
                  <CTableDataCell><CFormCheck type="radio" name="select" onChange={() => setSelectedId(1)} /></CTableDataCell>
                  <CTableDataCell>KCAS01 – Ms. P. Priya</CTableDataCell>
                  <CTableDataCell>Assistant Professor</CTableDataCell>
                  <CTableDataCell>Commerce</CTableDataCell>
                  <CTableDataCell>Order Not Uploaded</CTableDataCell>
                </CTableRow>
                <CTableRow>
                  <CTableDataCell><CFormCheck type="radio" name="select" onChange={() => setSelectedId(2)} /></CTableDataCell>
                  <CTableDataCell>KCAS02 – Ms. T. Sruthi</CTableDataCell>
                  <CTableDataCell>Assistant Professor</CTableDataCell>
                  <CTableDataCell>Commerce</CTableDataCell>
                  <CTableDataCell>Order Not Uploaded</CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}
    </>
  )
}

export default TutorWard
