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
 * NOTE (ARP standard):
 * - Do NOT import @coreui/icons in pages.
 * - Icons must be provided via props from a central icon registry (e.g., src/icons.js).
 */
const LearningActivities = ({ icons }) => {
  const [showProgrammeActions, setShowProgrammeActions] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Form state (optional; can be wired to API later)
  const [form, setForm] = useState({
    academicYear: '',
    semester: '',
    programmeCode: '',
    programmeName: '',
    courseName: '',
    faculty: '',
    className: '',
    classLabel: '',
    advancedLearners: [],
    slowLearners: [],
  })

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onMultiChange = (key) => (e) => {
    const selected = Array.from(e.target.selectedOptions).map((o) => o.value)
    setForm((p) => ({ ...p, [key]: selected }))
  }

  // Safe icons map (prevents crash if icons prop is missing)
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
    if (import.meta?.env?.DEV && (!icons || !icons.add || !icons.edit || !icons.view || !icons.delete)) {
      // eslint-disable-next-line no-console
      console.warn(
        '[LearningActivities] Missing icons prop. Pass icons like { add, edit, view, delete } from your central icons registry.',
      )
    }
  }, [icons])

  const IconOrText = ({ icon, fallback }) =>
    icon ? <CIcon icon={icon} /> : <span style={{ fontWeight: 700 }}>{fallback}</span>

  const onSaveAcademic = (e) => {
    e.preventDefault()
    setShowProgrammeActions(true)
  }

  return (
    <>
      {/* Academic Selection (GRID like Institution.js: label md=3 + control md=3) */}
      <CCard className="mb-4">
        <CCardHeader>
          <strong>Activities for Learners (Slow / Advanced)</strong>
        </CCardHeader>

        <CCardBody>
          <CForm onSubmit={onSaveAcademic}>
            <CRow className="g-3">
              {/* Row 1 */}
              <CCol md={3}>
                <CFormLabel>Academic Year</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.academicYear} onChange={onChange('academicYear')}>
                  <option value="">Select Academic Year</option>
                  <option value="2025-26">2025 – 26</option>
                  <option value="2026-27">2026 – 27</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Choose Semester</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.semester} onChange={onChange('semester')}>
                  <option value="">Choose Semester</option>
                  <option value="Sem-1">Sem – 1</option>
                  <option value="Sem-3">Sem – 3</option>
                </CFormSelect>
              </CCol>

              {/* Row 2 */}
              <CCol md={3}>
                <CFormLabel>Choose Programme Code</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.programmeCode} onChange={onChange('programmeCode')}>
                  <option value="">Select Programme Code</option>
                  <option value="N6MCA">N6MCA</option>
                  <option value="N6MBA">N6MBA</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Programme Name</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput value={form.programmeName} readOnly placeholder="Auto" />
              </CCol>

              {/* Row 3 */}
              <CCol md={3}>
                <CFormLabel>Course Name</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.courseName} onChange={onChange('courseName')}>
                  <option value="">Select Course Name</option>
                  <option value="Course-1">Course – 1</option>
                  <option value="Course-2">Course – 2</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Choose Faculty</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.faculty} onChange={onChange('faculty')}>
                  <option value="">Select Faculty</option>
                  <option value="Priya.G">Priya .G</option>
                  <option value="Sruthi.T">Sruthi .T</option>
                </CFormSelect>
              </CCol>

              {/* Row 4 */}
              <CCol md={3}>
                <CFormLabel>Class Name</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.className} onChange={onChange('className')}>
                  <option value="">Select Class Name</option>
                  <option value="I-BCOM">I B.Com</option>
                  <option value="I-BBA">I BBA</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Class Label</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.classLabel} onChange={onChange('classLabel')}>
                  <option value="">Select Label</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </CFormSelect>
              </CCol>

              {/* Row 5 (Multi-selects as grid-aligned equivalents for checkbox dropdowns) */}
              <CCol md={3}>
                <CFormLabel>Choose Advanced Learners</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  multiple
                  value={form.advancedLearners}
                  onChange={onMultiChange('advancedLearners')}
                  title="Hold Ctrl/⌘ to select multiple"
                >
                  <option value="10MCA01">10MCA01 K. Akilan</option>
                  <option value="10MCA02">10MCA02 E. Athiyan</option>
                  <option value="10MCA03">10MCA03 E. Aadhirai</option>
                  <option value="10MCA04">10MCA04 M. Elam Parithi</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Choose Slow Learners</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  multiple
                  value={form.slowLearners}
                  onChange={onMultiChange('slowLearners')}
                  title="Hold Ctrl/⌘ to select multiple"
                >
                  <option value="10MCA01">10MCA01 K. Akilan</option>
                  <option value="10MCA02">10MCA02 E. Athiyan</option>
                  <option value="10MCA03">10MCA03 E. Aadhirai</option>
                  <option value="10MCA04">10MCA04 M. Elam Parithi</option>
                </CFormSelect>
              </CCol>

              {/* Actions */}
              <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                <CButton color="primary" type="submit">
                  Save
                </CButton>
                <CButton
                  color="secondary"
                  type="button"
                  onClick={() => {
                    setShowProgrammeActions(false)
                    setShowModal(false)
                    setShowDetails(false)
                  }}
                >
                  Cancel
                </CButton>
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* Programme Action Icons */}
      {showProgrammeActions && (
        <CCard className="mb-4">
          <CCardBody>
            <div className="d-flex gap-2">
              <CButton color="success" shape="rounded-pill" onClick={() => setShowModal(true)} title="Add">
                <IconOrText icon={safeIcons.add} fallback="+" />
              </CButton>

              <CButton color="warning" shape="rounded-pill" title="Edit">
                <IconOrText icon={safeIcons.edit} fallback="E" />
              </CButton>

              <CButton color="info" shape="rounded-pill" title="View">
                <IconOrText icon={safeIcons.view} fallback="V" />
              </CButton>

              <CButton color="danger" shape="rounded-pill" title="Delete">
                <IconOrText icon={safeIcons.delete} fallback="D" />
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* Add Programme Modal */}
      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>
          <CModalTitle>Programmes for Learners</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <CRow className="g-3">
            <CCol md={6}>
              <CFormInput type="date" label="Select Date" />
            </CCol>
            <CCol md={6}>
              <CFormSelect label="Learner Type">
                <option>Advanced Learners</option>
                <option>Slow Learners</option>
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormInput label="Title of the Activity" />
            </CCol>

            <CCol md={6}>
              <CFormInput type="file" label="Upload Supporting Documents" />
            </CCol>

            <CCol md={6}>
              <CFormSelect label="Status">
                <option>Not Scheduled</option>
                <option>Scheduled</option>
                <option>Completed</option>
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormInput label="Faculty Note" />
            </CCol>
          </CRow>
        </CModalBody>

        <CModalFooter>
          <CButton
            color="primary"
            onClick={() => {
              setShowDetails(true)
              setShowModal(false)
            }}
          >
            Save
          </CButton>
          <CButton color="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Programme Details Table */}
      {showDetails && (
        <CCard>
          <CCardHeader>
            <strong>Learners Programme Details</strong>
          </CCardHeader>

          <CCardBody>
            <CTable bordered>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{ width: 70 }}>Select</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Learner Type</CTableHeaderCell>
                  <CTableHeaderCell>Title</CTableHeaderCell>
                  <CTableHeaderCell>Document</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Faculty Note</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                <CTableRow>
                  <CTableDataCell className="text-center">
                    <input type="radio" name="selectRow" />
                  </CTableDataCell>
                  <CTableDataCell>25/03/2025</CTableDataCell>
                  <CTableDataCell>Slow Learner</CTableDataCell>
                  <CTableDataCell>Assignment</CTableDataCell>
                  <CTableDataCell>
                    <CButton size="sm" variant="outline">
                      View
                    </CButton>
                  </CTableDataCell>
                  <CTableDataCell>Completed</CTableDataCell>
                  <CTableDataCell>Conducted on 25th March 2025</CTableDataCell>
                </CTableRow>

                <CTableRow>
                  <CTableDataCell className="text-center">
                    <input type="radio" name="selectRow" />
                  </CTableDataCell>
                  <CTableDataCell>26/03/2025</CTableDataCell>
                  <CTableDataCell>Advanced Learner</CTableDataCell>
                  <CTableDataCell>Assignment</CTableDataCell>
                  <CTableDataCell>
                    <CButton size="sm" variant="outline">
                      View
                    </CButton>
                  </CTableDataCell>
                  <CTableDataCell>Completed</CTableDataCell>
                  <CTableDataCell>Conducted on 26th March 2025</CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}
    </>
  )
}

export default LearningActivities
