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
} from '@coreui/react-pro'
import { CardShell, ArpButton } from '../../components/common'

// Dummy dropdowns copied from the original HTML page (replace with API later)
const dummy = {
  academicYear: ['2025 - 26', '2026 - 27'],
  academicPattern: ['Pattern A', 'Pattern B', 'Pattern C'],
  feedbackId: ['FB-001', 'FB-002', 'FB-003'],
  feedbackTitle: ['General Feedback', 'Course Feedback', 'Facility Feedback'],
  feedbackFrom: ['Student', 'Parent', 'Faculty'],
  ratingType: ['Stars', 'Scale', 'Yes/No'],
  ratingScale: ['1-5', '1-10', 'Poor-Good-Excellent'],
  remarks: ['Mandatory', 'Optional'],
  ifCourseFeedback: ['Yes', 'No'],
  semester: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
  programmeCode: ['BSC-CS', 'BCA', 'BA-ENG'],
  programme: ['B.Sc Computer Science', 'BCA', 'B.A English'],
  courseCode: ['CS101', 'CS205', 'ENG110'],
  courseName: ['Programming Basics', 'Data Structures', 'Communication Skills'],
}

const initialConfig = { academicYear: '', academicPattern: '' }

const initialFeedback = {
  feedbackId: '',
  feedbackTitle: '',
  feedbackFrom: '',
  ratingType: '',
  ratingScale: '',
  remarks: '',
  ifCourseFeedback: '',
  semester: '',
  programmeCode: '',
  programme: '',
  courseCode: '',
  courseName: '',
}

const initialRatingScale = {
  ratingType1: '',
  ratingType2: '',
  ratingValue1: '',
  ratingValue2: '',
  description1: '',
  description2: '',
}

const FeedbackConfiguration = () => {
  const [config, setConfig] = useState(initialConfig)
  const [feedback, setFeedback] = useState(initialFeedback)
  const [ratingScale, setRatingScale] = useState(initialRatingScale)

  const onConfigChange = (k) => (e) => setConfig((p) => ({ ...p, [k]: e.target.value }))
  const onFeedbackChange = (k) => (e) => setFeedback((p) => ({ ...p, [k]: e.target.value }))
  const onRatingScaleChange = (k) => (e) => setRatingScale((p) => ({ ...p, [k]: e.target.value }))

  // Button handlers (hook API later)
  const onSearchConfig = () => console.log('btnSearchConfig clicked', config)
  const onAddNewConfig = () => {
    console.log('btnAddNewConfig clicked')
    setFeedback(initialFeedback)
  }

  const onSaveFeedback = () => console.log('btnSaveFeedback clicked', feedback)
  const onCancelFeedback = () => {
    console.log('btnCancelFeedback clicked')
    setFeedback(initialFeedback)
  }

  const onSaveRatingScale = () => console.log('btnSaveRatingScale clicked', ratingScale)
  const onCancelRatingScale = () => {
    console.log('btnCancelRatingScale clicked')
    setRatingScale(initialRatingScale)
  }

  return (
    <CardShell title="Feedback Configuration" breadcrumb={['Setup', 'Student Feedback Configuration']}>
      {/* Card 1: Configuration Selection */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Configuration Selection</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3 align-items-center">
              <CCol md={3}>
                <CFormLabel className="mb-0">Academic Year</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={config.academicYear} onChange={onConfigChange('academicYear')}>
                  <option value="">Select</option>
                  {dummy.academicYear.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Academic Pattern</CFormLabel>
              </CCol>
              <CCol md={3}>
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

              <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                <ArpButton label="Search" icon="search" color="primary" onClick={onSearchConfig} />
                <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNewConfig} />
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* Card 2: Feedback Configuration */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>Feedback Configuration</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3 align-items-center">
              <CCol md={3}>
                <CFormLabel className="mb-0">Feedback ID</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={feedback.feedbackId} onChange={onFeedbackChange('feedbackId')}>
                  <option value="">Select</option>
                  {dummy.feedbackId.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Feedback Title</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={feedback.feedbackTitle}
                  onChange={onFeedbackChange('feedbackTitle')}
                >
                  <option value="">Select</option>
                  {dummy.feedbackTitle.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Feedback From</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={feedback.feedbackFrom}
                  onChange={onFeedbackChange('feedbackFrom')}
                >
                  <option value="">Select</option>
                  {dummy.feedbackFrom.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Rating Type</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={feedback.ratingType} onChange={onFeedbackChange('ratingType')}>
                  <option value="">Select</option>
                  {dummy.ratingType.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Rating Scale</CFormLabel>
              </CCol>
              <CCol md={3}>
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

              <CCol md={3}>
                <CFormLabel className="mb-0">Remarks</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={feedback.remarks} onChange={onFeedbackChange('remarks')}>
                  <option value="">Select</option>
                  {dummy.remarks.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">If Course Feedback</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={feedback.ifCourseFeedback}
                  onChange={onFeedbackChange('ifCourseFeedback')}
                >
                  <option value="">Select</option>
                  {dummy.ifCourseFeedback.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Semester</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={feedback.semester} onChange={onFeedbackChange('semester')}>
                  <option value="">Select</option>
                  {dummy.semester.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Programme Code</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={feedback.programmeCode}
                  onChange={onFeedbackChange('programmeCode')}
                >
                  <option value="">Select</option>
                  {dummy.programmeCode.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Programme</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={feedback.programme} onChange={onFeedbackChange('programme')}>
                  <option value="">Select</option>
                  {dummy.programme.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Course Code</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={feedback.courseCode} onChange={onFeedbackChange('courseCode')}>
                  <option value="">Select</option>
                  {dummy.courseCode.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Course Name</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={feedback.courseName} onChange={onFeedbackChange('courseName')}>
                  <option value="">Select</option>
                  {dummy.courseName.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                <ArpButton label="Save" icon="save" color="success" onClick={onSaveFeedback} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelFeedback} />
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* Card 3: Rating Scale Configuration */}
      <CCard>
        <CCardHeader>
          <strong>Rating Scale Configuration</strong>
        </CCardHeader>
        <CCardBody>
          <CForm>
            <CRow className="g-3 align-items-center">
              <CCol md={3}>
                <CFormLabel className="mb-0">Rating Type</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={ratingScale.ratingType1}
                  onChange={onRatingScaleChange('ratingType1')}
                >
                  <option value="">Select</option>
                  {dummy.ratingType.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Rating Type</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={ratingScale.ratingType2}
                  onChange={onRatingScaleChange('ratingType2')}
                >
                  <option value="">Select</option>
                  {dummy.ratingType.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Rating Value</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput
                  value={ratingScale.ratingValue1}
                  onChange={onRatingScaleChange('ratingValue1')}
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Rating Value</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput
                  value={ratingScale.ratingValue2}
                  onChange={onRatingScaleChange('ratingValue2')}
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Description</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput
                  value={ratingScale.description1}
                  onChange={onRatingScaleChange('description1')}
                />
              </CCol>

              <CCol md={3}>
                <CFormLabel className="mb-0">Description</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput
                  value={ratingScale.description2}
                  onChange={onRatingScaleChange('description2')}
                />
              </CCol>

              <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                <ArpButton label="Save" icon="save" color="success" onClick={onSaveRatingScale} />
                <ArpButton
                  label="Cancel"
                  icon="cancel"
                  color="secondary"
                  onClick={onCancelRatingScale}
                />
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>
    </CardShell>
  )
}

export default FeedbackConfiguration
