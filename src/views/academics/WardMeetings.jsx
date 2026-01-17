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

const WardMeetings = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [showTable, setShowTable] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [template, setTemplate] = useState('')

  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)

  // Modal state (matches HTML openModal() behavior)
  const [docModalVisible, setDocModalVisible] = useState(false)
  const [docRows, setDocRows] = useState([
    { id: 1, category: '', file: null, fileLog: '' },
  ])

  const rows = useMemo(
    () => [
      {
        id: 1,
        academicYear: '2025 - 26',
        semester: 'Sem - 1',
        faculty: 'Ms. P. Priya',
        department: 'Commerce',
        title: 'Parent Interaction',
        datetime: '2025-07-10 10:30 AM',
        status: 'Completed',
      },
      {
        id: 2,
        academicYear: '2025 - 26',
        semester: 'Sem - 3',
        faculty: 'Ms. T. Sruthi',
        department: 'Commerce',
        title: 'Student Counseling',
        datetime: '2025-08-05 02:00 PM',
        status: 'Scheduled',
      },
    ],
    [],
  )

  const filteredRows = useMemo(() => {
    const q = (search || '').toLowerCase().trim()
    if (!q) return rows
    return rows.filter((r) => Object.values(r).join(' ').toLowerCase().includes(q))
  }, [rows, search])

  const onSave = () => {
    setIsEdit(false)
    setShowTable(true) // HTML: Save reveals allotmentSection
  }

  const onCancel = () => {
    setIsEdit(false)
    setShowTable(false)
    setSelectedId(null)
    setSearch('')
    setPageSize(10)
    setTemplate('')
    setDocModalVisible(false)
    setDocRows([{ id: 1, category: '', file: null, fileLog: '' }])
  }

  const openDocModal = () => {
    // HTML openModal(): clears rows and creates a fresh first row
    setDocRows([{ id: 1, category: '', file: null, fileLog: '' }])
    setDocModalVisible(true)
  }

  const updateRow = (id, patch) => {
    setDocRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const addRow = () => {
    setDocRows((prev) => [...prev, { id: Date.now(), category: '', file: null, fileLog: '' }])
  }

  const removeRow = (id) => {
    setDocRows((prev) => prev.filter((r) => r.id !== id))
  }

  const templateOptions = [
    'Meeting Agenda',
    'Meeting Circular',
    'Minutes of the Meetings',
    'Action Taken Reports',
    'Supporting Documents',
  ]

  return (
    <>
      {/* 1) Ward Meetings Card Header */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Ward Meetings</strong>

          <div className="d-flex align-items-center gap-2 flex-nowrap">
            {/* +Add New (top header) */}
            <ArpButton
              label="Add New"
              icon="add"
              color="success"
              onClick={() => setIsEdit(true)}
            />

            {/* Template dropdown */}
            <CFormSelect
              size="sm"
              style={{ width: 220 }}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              <option value="">Select Template</option>
              {templateOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </CFormSelect>

            {/* Download Template */}
            <CTooltip content={template ? 'Download Template' : 'Please choose a template first'}>
              <span className="d-inline-block">
                <ArpButton label="Download Template" icon="download" color="danger" disabled={!template} />
              </span>
            </CTooltip>
          </div>
        </CCardHeader>
      </CCard>

      {/* 2) Form Card */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Ward Meeting Entry</strong>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-3">
            <CCol md={3}>
              <CFormLabel>Academic Year</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormSelect disabled={!isEdit}>
                <option>Select Academic Year</option>
                <option>2025 - 26</option>
                <option>2026 - 27</option>
              </CFormSelect>
            </CCol>

            <CCol md={3}>
              <CFormLabel>Semester</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormSelect disabled={!isEdit}>
                <option>Select Semester</option>
                <option>Sem - 1</option>
                <option>Sem - 3</option>
              </CFormSelect>
            </CCol>

            <CCol md={3}>
              <CFormLabel>Department</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormSelect disabled={!isEdit}>
                <option>Select Department</option>
                <option>Commerce</option>
                <option>Computer Science</option>
              </CFormSelect>
            </CCol>

            <CCol md={3}>
              <CFormLabel>Meeting Date</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormInput type="date" disabled={!isEdit} />
            </CCol>

            <CCol md={3}>
              <CFormLabel>Meeting Time</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormInput type="time" disabled={!isEdit} />
            </CCol>

            <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
              <ArpButton label="Save" icon="save" color="success" onClick={onSave} />
              <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* 3) Ward Meetings List (shows after Save) */}
      {showTable && (
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Ward Meetings List</strong>

            <div className="d-flex align-items-center gap-2 flex-nowrap">
              <CFormInput
                size="sm"
                placeholder="Search..."
                style={{ width: 220 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <CFormSelect
                size="sm"
                style={{ width: 110 }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[5, 10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </CFormSelect>

              {/* + circle icon (HTML: opens modal) */}
              <CTooltip content="Add New">
                <span className="d-inline-block">
                  <button
                    type="button"
                    className="btn btn-success btn-sm rounded-circle text-white"
                    style={{
                      width: 40,
                      height: 40,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                      fontSize: 18,
                      fontWeight: 700,
                    }}
                    onClick={openDocModal}
                    title="Add New"
                  >
                    +
                  </button>
                </span>
              </CTooltip>

              <CTooltip content="View Documents">
                <span className="d-inline-block">
                  <ArpIconButton icon="view" color="primary" disabled={!selectedId} />
                </span>
              </CTooltip>

              <CTooltip content="Edit Documents">
                <span className="d-inline-block">
                  <ArpIconButton icon="edit" color="info" disabled={!selectedId} />
                </span>
              </CTooltip>

              <CTooltip content="Delete Documents">
                <span className="d-inline-block">
                  <ArpIconButton icon="delete" color="danger" disabled={!selectedId} />
                </span>
              </CTooltip>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Academic Year</CTableHeaderCell>
                  <CTableHeaderCell>Semester</CTableHeaderCell>
                  <CTableHeaderCell>Faculty</CTableHeaderCell>
                  <CTableHeaderCell>Department</CTableHeaderCell>
                  <CTableHeaderCell>Meeting Title</CTableHeaderCell>
                  <CTableHeaderCell>Meeting Date & Time</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {filteredRows.slice(0, pageSize).map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell className="text-center">
                      <CFormCheck
                        type="radio"
                        name="selectWardMeeting"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{r.academicYear}</CTableDataCell>
                    <CTableDataCell>{r.semester}</CTableDataCell>
                    <CTableDataCell>{r.faculty}</CTableDataCell>
                    <CTableDataCell>{r.department}</CTableDataCell>
                    <CTableDataCell>{r.title}</CTableDataCell>
                    <CTableDataCell>{r.datetime}</CTableDataCell>
                    <CTableDataCell>{r.status}</CTableDataCell>
                  </CTableRow>
                ))}

                {filteredRows.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={8} className="text-center text-muted py-4">
                      No records found
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}

      {/* Upload Documents Modal (HTML: docModal) */}
      <CModal
        alignment="center"
        size="lg"
        visible={docModalVisible}
        onClose={() => setDocModalVisible(false)}
      >
        <CModalHeader>
          <CModalTitle>Upload Documents</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <div className="mb-2 fw-semibold">Upload Supporting Documents</div>

          {docRows.map((r, idx) => {
            const isLast = idx === docRows.length - 1
            return (
              <CRow className="g-2 align-items-center mb-2" key={r.id}>
                <CCol md={3}>
                  <CFormSelect
                    value={r.category}
                    onChange={(e) => updateRow(r.id, { category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {templateOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormInput
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null
                      const log =
                        f
                          ? `${f.name} (${(f.size / 1024).toFixed(1)} KB, ${f.type || 'file'})`
                          : ''
                      updateRow(r.id, { file: f, fileLog: log })
                    }}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormInput value={r.fileLog} readOnly placeholder="File name with size and type" />
                </CCol>

                <CCol md={2} className="text-center">
                  <button
                    type="button"
                    className={`btn btn-sm ${isLast ? 'btn-success' : 'btn-danger'}`}
                    onClick={() => (isLast ? addRow() : removeRow(r.id))}
                    title={isLast ? 'Add' : 'Remove'}
                    style={{ width: 36, height: 36, padding: 0 }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1, color: '#fff' }}>
                      {isLast ? '+' : '−'}
                    </span>
                  </button>
                </CCol>
              </CRow>
            )
          })}
        </CModalBody>

        <CModalFooter>
          <ArpButton
            label="Save"
            icon="save"
            color="success"
            onClick={() => setDocModalVisible(false)}
          />
          <ArpButton
            label="Close"
            icon="cancel"
            color="secondary"
            onClick={() => setDocModalVisible(false)}
          />
        </CModalFooter>
      </CModal>
    </>
  )
}

export default WardMeetings
