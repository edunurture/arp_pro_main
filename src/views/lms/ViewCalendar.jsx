import React, { useMemo, useState } from 'react'
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
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
} from '@coreui/react-pro'
import { ArpButton } from '../../components/common'

/**
 * Converted from view_calendar.html
 * ARP Standard – View Calendar
 */

const ViewCalendarConfiguration = () => {
  const [showCalendar, setShowCalendar] = useState(false)

  const rows = useMemo(
    () => [
      {
        id: 1,
        date: '18 July 2022',
        day: 'Monday',
        dayOrder: 'I',
        particulars: 'Odd Semester Begins (II & III Years)',
        workingDays: 1,
        event: 'CDC Meeting Scheduled',
      },
      {
        id: 2,
        date: '19 July 2022',
        day: 'Tuesday',
        dayOrder: 'II',
        particulars: 'MCA - Orientation Programme',
        workingDays: 2,
        event: 'IQAC Meeting Scheduled',
      },
    ],
    [],
  )

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>VIEW CALENDAR</strong>
          </CCardHeader>
        </CCard>

        {/* FILTER FORM */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>View Calendar</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>Select Academic Year</option>
                    <option>2025 - 2026</option>
                    <option>2026 - 2027</option>
                    <option>2027 - 2028</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect>
                    <option>Select Semester</option>
                    <option>Sem - 1</option>
                    <option>Sem - 3</option>
                    <option>Sem - 5</option>
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
                    label="View Calendar"
                    icon="view"
                    color="success"
                    onClick={() => setShowCalendar(true)}
                  />
                  <ArpButton
                    label="Reset"
                    icon="reset"
                    color="secondary"
                    className="ms-2"
                    onClick={() => setShowCalendar(false)}
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* CALENDAR TABLE */}
        {showCalendar && (
          <CCard>
            <CCardHeader>
              <strong>Calendar</strong>
            </CCardHeader>
            <CCardBody>
              <CTable bordered hover responsive>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Day</CTableHeaderCell>
                    <CTableHeaderCell>Day Order</CTableHeaderCell>
                    <CTableHeaderCell>Particulars</CTableHeaderCell>
                    <CTableHeaderCell>No. of Working Days</CTableHeaderCell>
                    <CTableHeaderCell>Event Description</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {rows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell>
                        <CFormCheck type="radio" name="calSel" />
                      </CTableDataCell>
                      <CTableDataCell>{r.date}</CTableDataCell>
                      <CTableDataCell>{r.day}</CTableDataCell>
                      <CTableDataCell>{r.dayOrder}</CTableDataCell>
                      <CTableDataCell>{r.particulars}</CTableDataCell>
                      <CTableDataCell>{r.workingDays}</CTableDataCell>
                      <CTableDataCell>{r.event}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default ViewCalendarConfiguration
