import React, { useState } from 'react'
import {
  CCard, CCardHeader, CCardBody,
  CRow, CCol,
  CForm, CFormLabel, CFormSelect, CFormInput,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell
} from '@coreui/react-pro'
import { ArpButton } from '../../components/common'

const initialSelection = {
  academicYear: '',
  semester: '',
  programmeCode: '',
  programmeName: '',
}

const DEMO_ROWS = [
  { code: '23-2AA-11T', name: 'Language – I', po: Array(8).fill('') },
  { code: '23-2AA-12E', name: 'Language – II', po: Array(8).fill('') },
]

const ObeArticulationMatrix = () => {
  const [selection, setSelection] = useState(initialSelection)
  const [showMatrix, setShowMatrix] = useState(false)

  const onChange = (k) => (e) => {
    const v = e.target.value
    setSelection(p => ({
      ...p,
      [k]: v,
      ...(k === 'programmeCode'
        ? { programmeName: v === 'N6MCA' ? 'MCA' : v === 'N6MBA' ? 'MBA' : '' }
        : {})
    }))
  }

  const onSearch = (e) => {
    e.preventDefault()
    setShowMatrix(true)
  }

  const onReset = () => {
    setSelection(initialSelection)
    setShowMatrix(false)
  }

  const downloadReport = () => {
    const header = ['Course Code','Course Name', ...Array.from({length:8},(_,i)=>`PO${i+1}`)]
    const rows = DEMO_ROWS.map(r => [r.code, r.name, ...r.po])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'obe_articulation_matrix.csv'
    a.click()
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader>
            <strong>OBE ARTICULATION MATRIX</strong>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Academic Selection</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSearch}>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={selection.academicYear} onChange={onChange('academicYear')}>
                    <option value="">Select</option>
                    <option>2025 – 26</option>
                    <option>2026 – 27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={selection.semester} onChange={onChange('semester')}>
                    <option value="">Select</option>
                    <option>Sem – 1</option>
                    <option>Sem – 3</option>
                    <option>Sem – 5</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={selection.programmeCode} onChange={onChange('programmeCode')}>
                    <option value="">Select</option>
                    <option>N6MCA</option>
                    <option>N6MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={selection.programmeName} readOnly /></CCol>

                <CCol md={6} />
                <CCol md={6} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Search" icon="search" type="submit" />
                  <ArpButton label="Reset" icon="reset" color="secondary" type="button" onClick={onReset} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {showMatrix && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>OBE Articulation Matrix</strong>
              <div className="d-flex gap-2">
                <ArpButton label="Download Report" icon="download" color="success" onClick={downloadReport} />
                <ArpButton label="Close" icon="cancel" color="danger" onClick={() => setShowMatrix(false)} />
              </div>
            </CCardHeader>
            <CCardBody>
              <CTable bordered responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    {Array.from({length:8},(_,i)=>(
                      <CTableHeaderCell key={i}>PO{i+1}</CTableHeaderCell>
                    ))}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {DEMO_ROWS.map((r,i)=>(
                    <CTableRow key={i}>
                      <CTableDataCell>{r.code}</CTableDataCell>
                      <CTableDataCell>{r.name}</CTableDataCell>
                      {r.po.map((v,j)=>(
                        <CTableDataCell key={j}>
                          <CFormInput size="sm" value={v} readOnly />
                        </CTableDataCell>
                      ))}
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

export default ObeArticulationMatrix