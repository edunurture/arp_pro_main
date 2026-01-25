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
  CButton,
} from '@coreui/react-pro'
import { CardShell, ArpButton } from '../../components/common'

// Dummy data from original HTML (replace with API later)
const dummy = {
  academicYear: ['2025 - 26', '2026 - 27'],
  academicPattern: ['Pattern 1', 'Pattern 2'],
  feedbackId: ['FB101', 'FB102'],
  ratingType: ['Type 1', 'Type 2'],
  ratingScale: ['Scale 1', 'Scale 2'],
  remarks: ['None'],
  questionnaireStatus: ['Available'],
  feedbackFrom: ['Select', 'Student', 'Parent', 'Faculty'],

  department: ['CSE'],
  programmeCode: ['Automatic'],
  programme: ['MCA'],
  class: ['I-MCA'],
  section: ['A'],
  semester: ['III'],
  facultyId: ['All', '7544', '2345', '2334', '5345'],
  facultyName: ['All Faculty', 'Faculty 1', 'Faculty 2', 'Faculty 3'],
}

const initialConfig = {
  academicYear: '',
  academicPattern: '',
  feedbackId: '',
}

const initialFeedback = {
  feedbackId: 'Automatic',
  feedbackTitle: 'Automatic',
  ratingType: '',
  ratingScale: '',
  remarks: '',
  questionnaireStatus: '',
  feedbackFrom: '',
}

const initialAssigned = {
  department: '',
  programmeCode: 'Automatic',
  programme: '',
  class: '',
  section: '',
  semester: '',
  dateFrom: '',
  dateTo: '',
  instruction: '',
  facultyId: '',
  facultyName: '',
}

const AssignFeedback = () => {
  const [config, setConfig] = useState(initialConfig)
  const [feedback, setFeedback] = useState(initialFeedback)
  const [assigned, setAssigned] = useState(initialAssigned)

  const [showPhase2, setShowPhase2] = useState(false)
  const [assignedType, setAssignedType] = useState(null) // Student | Parent | Faculty

  const onConfigChange = (k) => (e) => setConfig((p) => ({ ...p, [k]: e.target.value }))
  const onFeedbackChange = (k) => (e) => {
    const val = e.target.value
    setFeedback((p) => ({ ...p, [k]: val }))

    if (k === 'feedbackFrom') {
      setAssignedType(null) // reset phase 3/4/5 when changed
    }
  }

  const onAssignedChange = (k) => (e) => setAssigned((p) => ({ ...p, [k]: e.target.value }))

  const onSearch = () => {
    setShowPhase2(true)
  }

  const onAssignedTo = () => {
    if (!feedback.feedbackFrom || feedback.feedbackFrom === 'Select') return
    setAssignedType(feedback.feedbackFrom)
  }

  const onCancelAssigned = () => {
    setAssigned(initialAssigned)
    setAssignedType(null)
  }

  const onPublish = () => {
    console.log('Publish feedback', { config, feedback, assignedType, assigned })
  }

  const isViewEnabled = feedback.feedbackFrom && feedback.feedbackFrom !== 'Select'

  return (
    <CardShell title="Assign Feedback" breadcrumb={['Setup', 'Assign Feedback']}>
      {/* PHASE 1: CONFIGURATION SELECTION */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Configuration Selection</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3 align-items-center">
              <CCol md={2}>
                <CFormLabel>Academic Year</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect value={config.academicYear} onChange={onConfigChange('academicYear')}>
                  <option value="">Select</option>
                  {dummy.academicYear.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={2}>
                <CFormLabel>Academic Pattern</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  value={config.academicPattern}
                  onChange={onConfigChange('academicPattern')}
                >
                  <option value="">Select</option>
                  {dummy.academicPattern.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={2}>
                <CFormLabel>Feedback ID</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect value={config.feedbackId} onChange={onConfigChange('feedbackId')}>
                  <option value="">Select</option>
                  {dummy.feedbackId.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol xs={12} className="d-flex justify-content-end">
                <ArpButton label="Search" icon="search" color="primary" onClick={onSearch} />
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* PHASE 2: FEEDBACK */}
      {showPhase2 && (
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Feedback</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3 align-items-center">
                <CCol md={2}>
                  <CFormLabel>Feedback ID</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput value={feedback.feedbackId} disabled />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Feedback Title</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput value={feedback.feedbackTitle} disabled />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Rating Type</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={feedback.ratingType}
                    onChange={onFeedbackChange('ratingType')}
                  >
                    <option value="">Select</option>
                    {dummy.ratingType.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Rating Scale</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={feedback.ratingScale}
                    onChange={onFeedbackChange('ratingScale')}
                  >
                    <option value="">Select</option>
                    {dummy.ratingScale.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Remarks</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect value={feedback.remarks} onChange={onFeedbackChange('remarks')}>
                    <option value="">Select</option>
                    {dummy.remarks.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Questionnaire Status</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={feedback.questionnaireStatus}
                    onChange={onFeedbackChange('questionnaireStatus')}
                  >
                    <option value="">Select</option>
                    {dummy.questionnaireStatus.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Feedback From</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={feedback.feedbackFrom}
                    onChange={onFeedbackChange('feedbackFrom')}
                  >
                    {dummy.feedbackFrom.map((v) => (
                      <option key={v} value={v === 'Select' ? '' : v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>View Questionnaire</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CButton size="sm" color="info" disabled={!isViewEnabled}>
                    View
                  </CButton>
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end">
                  <ArpButton
                    label="Assigned To"
                    icon="add"
                    color="success"
                    onClick={onAssignedTo}
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      )}

      {/* PHASE 3: STUDENT FEEDBACK ASSIGNED TO */}
      {assignedType === 'Student' && (
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Student Feedback Assigned To</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3 align-items-center">
                <CCol md={2}>
                  <CFormLabel>Department</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={assigned.department}
                    onChange={onAssignedChange('department')}
                  >
                    {dummy.department.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput value={assigned.programmeCode} disabled />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Programme</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={assigned.programme}
                    onChange={onAssignedChange('programme')}
                  >
                    {dummy.programme.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Class</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect value={assigned.class} onChange={onAssignedChange('class')}>
                    {dummy.class.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Section</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect value={assigned.section} onChange={onAssignedChange('section')}>
                    {dummy.section.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Date From</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    type="date"
                    value={assigned.dateFrom}
                    onChange={onAssignedChange('dateFrom')}
                  />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Date To</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    type="date"
                    value={assigned.dateTo}
                    onChange={onAssignedChange('dateTo')}
                  />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Instruction (If Any)</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    value={assigned.instruction}
                    onChange={onAssignedChange('instruction')}
                  />
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton
                    label="Cancel"
                    icon="cancel"
                    color="danger"
                    onClick={onCancelAssigned}
                  />
                  <ArpButton label="Publish" icon="upload" color="primary" onClick={onPublish} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      )}

      {/* PHASE 4: PARENT FEEDBACK ASSIGNED TO */}
      {assignedType === 'Parent' && (
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Parent Feedback Assigned To</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3 align-items-center">
                <CCol md={2}>
                  <CFormLabel>Department</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={assigned.department}
                    onChange={onAssignedChange('department')}
                  >
                    {dummy.department.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Programme Code</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput value={assigned.programmeCode} disabled />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Programme</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={assigned.programme}
                    onChange={onAssignedChange('programme')}
                  >
                    {dummy.programme.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Semester</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={assigned.semester}
                    onChange={onAssignedChange('semester')}
                  >
                    {dummy.semester.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Date From</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    type="date"
                    value={assigned.dateFrom}
                    onChange={onAssignedChange('dateFrom')}
                  />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Date To</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    type="date"
                    value={assigned.dateTo}
                    onChange={onAssignedChange('dateTo')}
                  />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Instruction (If Any)</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    value={assigned.instruction}
                    onChange={onAssignedChange('instruction')}
                  />
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton
                    label="Cancel"
                    icon="cancel"
                    color="danger"
                    onClick={onCancelAssigned}
                  />
                  <ArpButton label="Publish" icon="upload" color="primary" onClick={onPublish} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      )}

      {/* PHASE 5: FACULTY FEEDBACK ASSIGNED TO */}
      {assignedType === 'Faculty' && (
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Faculty Feedback Assigned To</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3 align-items-center">
                <CCol md={2}>
                  <CFormLabel>Department</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={assigned.department}
                    onChange={onAssignedChange('department')}
                  >
                    {dummy.department.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Faculty ID</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={assigned.facultyId}
                    onChange={onAssignedChange('facultyId')}
                  >
                    {dummy.facultyId.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Faculty Name</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={assigned.facultyName}
                    onChange={onAssignedChange('facultyName')}
                  >
                    {dummy.facultyName.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Date From</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    type="date"
                    value={assigned.dateFrom}
                    onChange={onAssignedChange('dateFrom')}
                  />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Date To</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    type="date"
                    value={assigned.dateTo}
                    onChange={onAssignedChange('dateTo')}
                  />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Instruction (If Any)</CFormLabel>
                </CCol>
                <CCol md={4}>
                  <CFormInput
                    value={assigned.instruction}
                    onChange={onAssignedChange('instruction')}
                  />
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton
                    label="Cancel"
                    icon="cancel"
                    color="danger"
                    onClick={onCancelAssigned}
                  />
                  <ArpButton label="Publish" icon="upload" color="primary" onClick={onPublish} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      )}
    </CardShell>
  )
}

export default AssignFeedback
