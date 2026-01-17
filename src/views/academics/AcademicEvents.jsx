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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'

const AcademicEvents = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [showList, setShowList] = useState(false)
  const [showDocForm, setShowDocForm] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [docRows, setDocRows] = useState([{ id: 1 }])

  const rows = useMemo(
    () => [
      {
        id: 1,
        year: '2025 – 26',
        sem: 'Sem – 1',
        from: '27/03/25',
        to: '28/03/25',
        category: 'International Conference',
        title: 'AI & Machine Learning',
        participants: 120,
      },
    ],
    [],
  )

  const onSaveEvent = () => {
    setShowList(true)
    setIsEdit(false)
  }

  const openAddDocumentForm = () => {
    setDocRows([{ id: Date.now() }])
    setShowDocForm(true)
  }

  const addRow = () => {
    setDocRows((prev) => [...prev, { id: Date.now() }])
  }

  const removeRow = (id) => {
    setDocRows((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Academic Events</strong>
          <ArpButton label="Add New" icon="add" color="purple" onClick={() => setIsEdit(true)} />
        </CCardHeader>
      </CCard>

      <CCard className="mb-3">
        <CCardHeader>
          <strong>Academic Selection Form</strong>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-3">
            <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
            <CCol md={3}><CFormSelect disabled={!isEdit} /></CCol>
            <CCol md={3}><CFormLabel>Semester</CFormLabel></CCol>
            <CCol md={3}><CFormSelect disabled={!isEdit} /></CCol>

            <CCol md={3}><CFormLabel>Department</CFormLabel></CCol>
            <CCol md={3}><CFormSelect disabled={!isEdit} /></CCol>
            <CCol md={3}><CFormLabel>Event Title</CFormLabel></CCol>
            <CCol md={3}><CFormInput disabled={!isEdit} /></CCol>

            <CCol md={3}><CFormLabel>Date From</CFormLabel></CCol>
            <CCol md={3}><CFormInput type="date" disabled={!isEdit} /></CCol>
            <CCol md={3}><CFormLabel>Date To</CFormLabel></CCol>
            <CCol md={3}><CFormInput type="date" disabled={!isEdit} /></CCol>

            <CCol md={3}><CFormLabel>Event Category</CFormLabel></CCol>
            <CCol md={3}><CFormSelect disabled={!isEdit} /></CCol>
            <CCol md={3}><CFormLabel>No of Participants</CFormLabel></CCol>
            <CCol md={3}><CFormInput disabled={!isEdit} /></CCol>

            <CCol xs={12} className="d-flex justify-content-end gap-2 flex-wrap">
              <ArpButton label="Save" icon="save" color="primary" onClick={onSaveEvent} />
              <ArpButton label="Cancel" icon="cancel" color="secondary" />
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {showList && (
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Academic Events</strong>
            <div className="d-flex align-items-center gap-2">
              <CTooltip content="Add Document">
                <span>
                  <button
                    type="button"
                    className="btn btn-success btn-sm rounded-circle text-white"
                    style={{ width: 38, height: 38 }}
                    onClick={openAddDocumentForm}
                  >
                    +
                  </button>
                </span>
              </CTooltip>

              <ArpIconButton icon="edit" color="warning" disabled={!selectedId} />
              <ArpIconButton icon="view" color="info" disabled={!selectedId} />
              <ArpIconButton icon="delete" color="danger" disabled={!selectedId} />
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable bordered>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Academic Year</CTableHeaderCell>
                  <CTableHeaderCell>Semester</CTableHeaderCell>
                  <CTableHeaderCell>Date From</CTableHeaderCell>
                  <CTableHeaderCell>Date To</CTableHeaderCell>
                  <CTableHeaderCell>Category</CTableHeaderCell>
                  <CTableHeaderCell>Title</CTableHeaderCell>
                  <CTableHeaderCell>No of Participants</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {rows.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell>
                      <CFormCheck type="radio" name="selectEvent" onChange={() => setSelectedId(r.id)} />
                    </CTableDataCell>
                    <CTableDataCell>{r.year}</CTableDataCell>
                    <CTableDataCell>{r.sem}</CTableDataCell>
                    <CTableDataCell>{r.from}</CTableDataCell>
                    <CTableDataCell>{r.to}</CTableDataCell>
                    <CTableDataCell>{r.category}</CTableDataCell>
                    <CTableDataCell>{r.title}</CTableDataCell>
                    <CTableDataCell>{r.participants}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}

      <CModal visible={showDocForm} size="lg" onClose={() => setShowDocForm(false)}>
        <CModalHeader><CModalTitle>Add Document</CModalTitle></CModalHeader>
        <CModalBody>
          {docRows.map((r, idx) => (
            <CRow className="g-2 mb-2" key={r.id}>
              <CCol md={3}><CFormInput /></CCol>
              <CCol md={3}><CFormInput type="file" /></CCol>
              <CCol md={4}><CFormInput readOnly /></CCol>
              <CCol md={2}>
                <button
                  className={`btn btn-sm ${idx === docRows.length - 1 ? 'btn-success' : 'btn-danger'}`}
                  onClick={() => idx === docRows.length - 1 ? addRow() : removeRow(r.id)}
                >
                  {idx === docRows.length - 1 ? '+' : '-'}
                </button>
              </CCol>
            </CRow>
          ))}
        </CModalBody>
        <CModalFooter>
          <ArpButton label="Save" icon="save" color="primary" onClick={() => setShowDocForm(false)} />
          <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={() => setShowDocForm(false)} />
        </CModalFooter>
      </CModal>
    </>
  )
}

export default AcademicEvents
