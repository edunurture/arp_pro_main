import React, { useMemo, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'

const SubmitSSR = () => {
  const [selectedId, setSelectedId] = useState(null)

  const rows = useMemo(
    () => [
      { id: 1, section: 'PROFILE OF SSR', status: 'Completed', remarks: 'OK' },
      { id: 2, section: 'EXTENDED PROFILE', status: 'Completed', remarks: 'OK' },
      { id: 3, section: 'QIF – CRITERIA – 1 : CURRICULAR ASPECTS', status: 'Pending', remarks: 'Need review' },
      { id: 4, section: 'QIF – CRITERIA – 2 : TEACHING – LEARNING & EVALUATION', status: 'Pending', remarks: 'Need review' },
      { id: 5, section: 'QIF – CRITERIA – 3 : RESEARCH, INNOVATION & EXTENSION', status: 'Completed', remarks: 'OK' },
      { id: 6, section: 'QIF – CRITERIA – 4 : INFRASTRUCTURE & LEARNING RESOURCES', status: 'Pending', remarks: 'Incomplete data' },
      { id: 7, section: 'QIF – CRITERIA – 5 : STUDENT SUPPORT SYSTEMS', status: 'Completed', remarks: 'OK' },
      { id: 8, section: 'QIF – CRITERIA – 6 : GOVERNENCE, LEADERSHIP & MANAGEMENT', status: 'Pending', remarks: 'Need approval' },
      { id: 9, section: 'QIF – CRITERIA – 7 : INSTITUTIONAL VALUES & BEST PRACTICES', status: 'Completed', remarks: 'OK' },
      { id: 10, section: 'EXECUTIVE SUMMARY', status: 'Pending', remarks: 'Draft' },
    ],
    [],
  )

  const onViewSection = (id) => {
    setSelectedId(id)
    // Hook your navigation/view logic here
    // Example: navigate(`/ams/section/${id}`)
  }

  const onPreviewSSR = () => {
    // Hook your preview logic here
    // Example: open PDF preview
  }

  const onSubmitSSR = () => {
    // Hook your submit logic here
  }

  const onPublishSSR = () => {
    // Hook your publish logic here
  }

  const onDownloadSSR = () => {
    // Hook your download logic here
    window.open('/templates/SSR_Submission_Package.zip', '_blank')
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* Table Card */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>SUBMIT SSR</strong>
          </CCardHeader>

          <CCardBody>
            <CTable bordered hover responsive align="middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{ width: 70 }}>S.No.</CTableHeaderCell>
                  <CTableHeaderCell>SSR Sections</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: 140 }}>Status</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: 180 }}>Remarks</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: 90 }} className="text-center">
                    Action
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {rows.map((r, idx) => (
                  <CTableRow key={r.id} active={selectedId === r.id}>
                    <CTableDataCell>{idx + 1}</CTableDataCell>
                    <CTableDataCell>{r.section}</CTableDataCell>
                    <CTableDataCell>{r.status}</CTableDataCell>
                    <CTableDataCell>{r.remarks}</CTableDataCell>
                    <CTableDataCell className="text-center">
                      <ArpIconButton icon="view" title="View" onClick={() => onViewSection(r.id)} />
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>

        {/* Phase 2: SSR – CGPA Score action bar */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>SSR – CGPA Score</strong>
          </CCardHeader>

          <CCardBody>
            <div
              className="d-flex align-items-center gap-4 flex-nowrap"
              style={{ overflowX: 'auto' }}
            >
              <div className="d-flex align-items-center gap-2 flex-nowrap">
                <div className="fw-semibold" style={{ minWidth: 90 }}>
                  Preview SSR
                </div>
                <ArpButton label="View" icon="view" color="info" onClick={onPreviewSSR} />
              </div>

              <div className="d-flex align-items-center gap-2 flex-nowrap">
                <div className="fw-semibold" style={{ minWidth: 80 }}>
                  Submit SSR
                </div>
                <ArpButton label="Submit" icon="submit" color="success" onClick={onSubmitSSR} />
              </div>

              <div className="d-flex align-items-center gap-2 flex-nowrap">
                <div className="fw-semibold" style={{ minWidth: 80 }}>
                  Publish SSR
                </div>
                <ArpButton label="Publish" icon="publish" color="warning" onClick={onPublishSSR} />
              </div>

              <div className="d-flex align-items-center gap-2 flex-nowrap ms-auto">
                <div className="fw-semibold" style={{ minWidth: 95 }}>
                  Download SSR
                </div>
                <ArpButton label="Download" icon="download" color="danger" onClick={onDownloadSSR} />
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default SubmitSSR
