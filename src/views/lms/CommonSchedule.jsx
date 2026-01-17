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
import { ArpButton, ArpIconButton } from '../../components/common'

const CommonScheduleConfiguration = () => {
  const [enabled, setEnabled] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)

  const rows = useMemo(
    () => [
      {
        id: 1,
        semester: 'Sem-1',
        faculty: 'Dr. Priya',
        schedule: 'UG Commerce Tamil',
        code: '23-13A-LT1',
        name: 'Language – 1 Tamil',
        classes: 'I BCom | I BCA | I BBA',
      },
      {
        id: 2,
        semester: 'Sem-1',
        faculty: 'Mr. N. Sampath Kumar',
        schedule: 'UG Commerce English',
        code: '23-13A-LT2',
        name: 'Language – 2 English',
        classes: 'I BCom | I BCA | I BBA',
      },
    ],
    [],
  )

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>COMMON SCHEDULE</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="primary" onClick={() => setEnabled(true)} />
              <ArpButton label="View" icon="view" color="success" />
            </div>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Common Schedule</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect disabled={!enabled}>
                    <option>Select Academic Year</option>
                    <option>2025 – 26</option>
                    <option>2026 – 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Choose Programmes</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect multiple disabled={!enabled}>
                    <option>N6MCA</option>
                    <option>N6MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect disabled={!enabled}>
                    <option>Select Semester</option>
                    <option>Sem-1</option>
                    <option>Sem-3</option>
                    <option>Sem-5</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Choose Faculty</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect disabled={!enabled}>
                    <option>Select Faculty</option>
                    <option>Dr. M. Elamparithi</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Common Course Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput disabled={!enabled} />
                </CCol>

                <CCol md={3}><CFormLabel>Common Course Name</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput disabled={!enabled} />
                </CCol>

                <CCol md={3}><CFormLabel>Select Classes</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect multiple disabled={!enabled}>
                    <option>I B.Com</option>
                    <option>I BBA</option>
                    <option>I BCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Combined Schedule Name</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput disabled={!enabled} />
                </CCol>

                <CCol md={12} className="d-flex justify-content-end gap-2 mt-3">
                  <ArpButton
                    label="Save"
                    icon="save"
                    color="primary"
                    disabled={!enabled}
                    onClick={() => setShowTable(true)}
                  />
                  <ArpButton
                    label="Cancel"
                    icon="cancel"
                    color="secondary"
                    onClick={() => {
                      setEnabled(false)
                      setShowTable(false)
                      setSelectedRow(null)
                    }}
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {showTable && (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Common Schedule Details</strong>
              <div className="d-flex gap-2">
                <ArpIconButton icon="edit" color="success" disabled={!selectedRow} />
                <ArpIconButton icon="delete" color="danger" disabled={!selectedRow} />
              </div>
            </CCardHeader>
            <CCardBody>
              <CTable bordered responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Semester</CTableHeaderCell>
                    <CTableHeaderCell>Faculty Name</CTableHeaderCell>
                    <CTableHeaderCell>Schedule Name</CTableHeaderCell>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    <CTableHeaderCell>Selected Classes</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {rows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell>
                        <CFormCheck
                          type="radio"
                          name="csSel"
                          checked={selectedRow === r.id}
                          onChange={() => setSelectedRow(r.id)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.semester}</CTableDataCell>
                      <CTableDataCell>{r.faculty}</CTableDataCell>
                      <CTableDataCell>{r.schedule}</CTableDataCell>
                      <CTableDataCell>{r.code}</CTableDataCell>
                      <CTableDataCell>{r.name}</CTableDataCell>
                      <CTableDataCell>{r.classes}</CTableDataCell>
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

export default CommonScheduleConfiguration
