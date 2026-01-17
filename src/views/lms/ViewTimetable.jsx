import React, { useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import { ArpButton } from '../../components/common'

/**
 * Converted from View_timetable.html
 * Fix applied: Header now includes Download Template button (ARP standard)
 */

const ViewTimetableConfiguration = () => {
  const [showTimetable, setShowTimetable] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>VIEW TIMETABLE</strong>
            <ArpButton
              label="Download Template"
              icon="download"
              color="danger"
              href="/assets/templates/ARP_T09_Upload_Timetable.xlsx"
            />
          </CCardHeader>
        </CCard>

        {/* FILTER FORM */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>View Timetable</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option value="">Select Academic Year</option>
                    <option>2025 - 26</option>
                    <option>2026 - 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option value="">Select Semester</option>
                    <option>Sem - 1</option>
                    <option>Sem - 3</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option value="">Select Programme Code</option>
                    <option>25BCom</option>
                    <option>25MCA</option>
                    <option>25MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value="Automatically Fetched" disabled />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Class Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option value="">Select Class</option>
                    <option>I - B.Com</option>
                    <option>I - MCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Class Label</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option value="">Select Label</option>
                    <option>A</option>
                    <option>B</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Status</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value="Automatically Fetched" disabled />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Action</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <ArpButton
                    label="Search"
                    icon="search"
                    color="primary"
                    onClick={() => setShowTimetable(true)}
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* TIMETABLE VIEW */}
        {showTimetable && (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div className="d-flex gap-3 flex-wrap">
                <strong>2025 - 26</strong>
                <strong>B.Com</strong>
                <strong>Sem - 1</strong>
              </div>
              <div className="d-flex gap-3 flex-wrap">
                <strong>I - B.Com</strong>
                <strong>A</strong>
              </div>
            </CCardHeader>

            <CCardBody>
              <CInputGroup size="sm" className="mb-2" style={{ maxWidth: 280 }}>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CInputGroup>

              <CTable bordered responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Day / Hour</CTableHeaderCell>
                    <CTableHeaderCell>Hour 1</CTableHeaderCell>
                    <CTableHeaderCell>Hour 2</CTableHeaderCell>
                    <CTableHeaderCell>Hour 3</CTableHeaderCell>
                    <CTableHeaderCell>Hour 4</CTableHeaderCell>
                    <CTableHeaderCell>Hour 5</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow>
                    <CTableDataCell>I</CTableDataCell>
                    <CTableDataCell
                      onClick={() => setShowModal(true)}
                      className="text-primary"
                      style={{ cursor: 'pointer' }}
                    >
                      23-2AA-12E
                    </CTableDataCell>
                    <CTableDataCell>23-2AA-11T</CTableDataCell>
                    <CTableDataCell>23-2AA-11T</CTableDataCell>
                    <CTableDataCell>23-2AA-11T</CTableDataCell>
                    <CTableDataCell>23-2AA-11T</CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* MODAL */}
        <CModal visible={showModal} onClose={() => setShowModal(false)}>
          <CModalHeader>
            <CModalTitle>Class Activity</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <ul className="mb-0">
              <li>
                <a href="#">Record Attendance</a>
              </li>
              <li>
                <a href="#">Make Online Classes</a>
              </li>
              <li>
                <a href="#">Class Adjustment</a>
              </li>
              <li>
                <a href="#">Learning Activity</a>
              </li>
            </ul>
          </CModalBody>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default ViewTimetableConfiguration
