import React, { useEffect, useMemo, useState } from 'react'
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
  CFormCheck,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'

/**
 * ARP STANDARD
 * - Grid: label md=3 + control md=3 (Institution.js pattern)
 * - Icons only via props (no @coreui/icons import here)
 */
const InternalAssessmentAssignments = ({ icons }) => {
  const [showTrack, setShowTrack] = useState(false)
  const [showView, setShowView] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const [form, setForm] = useState({
    academicYear: '',
    semester: '',
    programmeCode: '',
    programmeName: '',
    courseName: '',
    faculty: '',
    className: '',
    classLabel: '',
  })

  const onChange = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const safeIcons = useMemo(
    () => ({
      add: icons?.add ?? null,
      edit: icons?.edit ?? null,
      view: icons?.view ?? null,
      delete: icons?.delete ?? null,
    }),
    [icons],
  )

  useEffect(() => {
    if (import.meta?.env?.DEV && (!icons || !icons.add)) {
      // eslint-disable-next-line no-console
      console.warn('[InternalAssessmentAssignments] icons prop missing.')
    }
  }, [icons])

  const IconOrText = ({ icon, fallback }) =>
    icon ? <CIcon icon={icon} /> : <span style={{ fontWeight: 700 }}>{fallback}</span>

  return (
    <>
      {/* Academic Selection */}
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Assignments for Internal Assessment</strong>
        </CCardHeader>
        <CCardBody>
          <CForm onSubmit={(e) => { e.preventDefault(); setShowTrack(true) }}>
            <CRow className="g-3">
              <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.academicYear} onChange={onChange('academicYear')}>
                  <option value="">Select Academic Year</option>
                  <option>2025 – 26</option>
                  <option>2026 – 27</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.semester} onChange={onChange('semester')}>
                  <option>Sem - 1</option>
                  <option>Sem - 3</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.programmeCode} onChange={onChange('programmeCode')}>
                  <option value="">Select Programme Code</option>
                  <option value="N6MCA">N6MCA</option>
                  <option value="N6MBA">N6MBA</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
              <CCol md={3}>
                <CFormInput readOnly value={form.programmeName} />
              </CCol>

              <CCol md={3}><CFormLabel>Course Name</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.courseName} onChange={onChange('courseName')}>
                  <option>N6MCA</option>
                  <option>N6MBA</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Choose Faculty</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.faculty} onChange={onChange('faculty')}>
                  <option>Priya .G</option>
                  <option>Sruthi .T</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Class Name</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.className} onChange={onChange('className')}>
                  <option>I B.Com</option>
                  <option>I BBA</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Class Label</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.classLabel} onChange={onChange('classLabel')}>
                  <option>A</option>
                  <option>B</option>
                </CFormSelect>
              </CCol>

              <CCol xs={12} className="d-flex justify-content-end gap-2">
                <CButton type="submit" color="primary">Search</CButton>
                <CButton type="button" color="secondary" onClick={() => setShowTrack(false)}>Cancel</CButton>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* Track Assignments */}
      {showTrack && (
        <CCard className="mb-4">
          <CCardBody>
            <div className="d-flex gap-2 mb-2">
              <CButton color="success" shape="rounded-pill" onClick={() => setShowModal(true)}>
                <IconOrText icon={safeIcons.add} fallback="+" />
              </CButton>
              <CButton color="warning" shape="rounded-pill">
                <IconOrText icon={safeIcons.edit} fallback="E" />
              </CButton>
              <CButton color="info" shape="rounded-pill" onClick={() => setShowView(true)}>
                <IconOrText icon={safeIcons.view} fallback="V" />
              </CButton>
              <CButton color="danger" shape="rounded-pill">
                <IconOrText icon={safeIcons.delete} fallback="D" />
              </CButton>
            </div>

            <CTable bordered>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Assignment Date</CTableHeaderCell>
                  <CTableHeaderCell>Title</CTableHeaderCell>
                  <CTableHeaderCell>Submission Date</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <CTableRow>
                  <CTableDataCell><input type="radio" name="iaAssign" /></CTableDataCell>
                  <CTableDataCell>25/03/25</CTableDataCell>
                  <CTableDataCell>Assignment – 1</CTableDataCell>
                  <CTableDataCell>27/03/25</CTableDataCell>
                  <CTableDataCell>Submitted</CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}

      {/* Add Assignment Modal */}
      <CModal visible={showModal} onClose={() => setShowModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Add Internal Assessment Assignment</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CRow className="g-3">
            <CCol md={3}><CFormLabel>Select IA Component</CFormLabel></CCol>
            <CCol md={3}>
              <CFormSelect>
                <option>CIA Test - 1</option>
                <option>CIA Test - 2</option>
                <option>Model</option>
              </CFormSelect>
            </CCol>

            <CCol md={3}><CFormLabel>Assignment Title</CFormLabel></CCol>
            <CCol md={3}><CFormInput /></CCol>

            <CCol md={3}><CFormLabel>Date of Assessment</CFormLabel></CCol>
            <CCol md={3}><CFormInput type="date" /></CCol>

            <CCol md={3}><CFormLabel>Upload Assignment</CFormLabel></CCol>
            <CCol md={3}><CFormInput type="file" /></CCol>

            <CCol md={3}><CFormLabel>Last Date for Submission</CFormLabel></CCol>
            <CCol md={3}><CFormInput type="date" /></CCol>

            <CCol md={3}><CFormLabel>Allow Late Submission</CFormLabel></CCol>
            <CCol md={3}>
              <div className="d-flex gap-3">
                <CFormCheck type="radio" name="late" label="Yes" />
                <CFormCheck type="radio" name="late" label="No" defaultChecked />
              </div>
            </CCol>

            <CCol md={3}><CFormLabel>Instruction Remarks</CFormLabel></CCol>
            <CCol md={3}><CFormInput /></CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={() => setShowModal(false)}>Save</CButton>
          <CButton color="secondary" onClick={() => setShowModal(false)}>Cancel</CButton>
        </CModalFooter>
      </CModal>

      {/* View Submissions */}
      {showView && (
        <CCard>
          <CCardHeader>
            <strong>Internal Assessment Submissions</strong>
          </CCardHeader>
          <CCardBody>
            <CTable bordered>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Reg.No</CTableHeaderCell>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Title</CTableHeaderCell>
                  <CTableHeaderCell>Submission Date</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Marks</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <CTableRow>
                  <CTableDataCell>23CA001</CTableDataCell>
                  <CTableDataCell>Archana .D</CTableDataCell>
                  <CTableDataCell>Assignment – 1</CTableDataCell>
                  <CTableDataCell>27/03/25</CTableDataCell>
                  <CTableDataCell>Submitted</CTableDataCell>
                  <CTableDataCell><CFormInput size="sm" /></CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>

            <div className="text-end">
              <CButton color="secondary" onClick={() => setShowView(false)}>Close</CButton>
            </div>
          </CCardBody>
        </CCard>
      )}
    </>
  )
}

export default InternalAssessmentAssignments
