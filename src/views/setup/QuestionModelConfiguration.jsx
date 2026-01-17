import React, { useState } from 'react'
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
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import { ArpButton, ArpIconButton } from '../../components/common'

/**
 * Converted from question_models.html
 * ARP Standard Applied
 * - 3 Card Layout
 * - Dynamic Section Add / Remove
 * - Section Maximize / Minimize / Close
 * - Search + Circle Action Icons in single row
 */

const emptySection = () => ({
  header: '',
  nomenclature: '',
  description: '',
  questionType: '',
  maxMarks: '',
  pattern: '',
  totalQuestions: '',
  marksPerQuestion: '',
})

const QuestionModelConfiguration = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [examPattern, setExamPattern] = useState('')
  const [questionPaperId, setQuestionPaperId] = useState('')
  const [sections, setSections] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const addSection = () => setSections((p) => [...p, emptySection()])
  const removeSection = (idx) => setSections((p) => p.filter((_, i) => i !== idx))

  const updateSection = (idx, key, value) => {
    setSections((p) => p.map((s, i) => (i === idx ? { ...s, [key]: value } : s)))
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>QUESTION MODEL CONFIGURATION</strong>
            <ArpButton label="Add New" icon="add" color="purple" onClick={() => setIsEdit(true)} />
          </CCardHeader>
        </CCard>

        {/* FORM */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Examination Pattern</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3 align-items-center">
                <CCol md={3}><CFormLabel>Choose Examination Pattern</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={examPattern} onChange={(e) => setExamPattern(e.target.value)} disabled={!isEdit}>
                    <option value="">Select Pattern</option>
                    <option>OBE Pattern</option>
                    <option>Non-OBE Pattern</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Question Paper ID</CFormLabel></CCol>
                <CCol md={2}>
                  <CFormInput value={questionPaperId} onChange={(e) => setQuestionPaperId(e.target.value)} disabled={!isEdit} />
                </CCol>
                <CCol md={1} className="text-center">
                  <ArpButton label="" icon="add" color="success" onClick={addSection} disabled={!isEdit} />
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Save" icon="save" color="success" disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={() => setIsEdit(false)} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* DYNAMIC SECTIONS */}
        {sections.map((sec, idx) => (
          <CCard key={idx} className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Section {idx + 1}</strong>
              <div className="d-flex gap-2">
                <ArpIconButton icon="delete" color="danger" onClick={() => removeSection(idx)} />
              </div>
            </CCardHeader>
            <CCardBody>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Section Header</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={sec.header} onChange={(e) => updateSection(idx, 'header', e.target.value)} /></CCol>

                <CCol md={3}><CFormLabel>Nomenclature</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={sec.nomenclature} onChange={(e) => updateSection(idx, 'nomenclature', e.target.value)} /></CCol>

                <CCol md={3}><CFormLabel>Section Description</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={sec.description} onChange={(e) => updateSection(idx, 'description', e.target.value)} /></CCol>

                <CCol md={3}><CFormLabel>Question Type</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={sec.questionType} onChange={(e) => updateSection(idx, 'questionType', e.target.value)}>
                    <option value="">Select Type</option>
                    <option>MCQ</option>
                    <option>Descriptive – Answer Any</option>
                    <option>Descriptive – Either (Or)</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Maximum Marks</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={sec.maxMarks} onChange={(e) => updateSection(idx, 'maxMarks', e.target.value)} /></CCol>

                <CCol md={3}><CFormLabel>Pattern</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={sec.pattern} onChange={(e) => updateSection(idx, 'pattern', e.target.value)}>
                    <option>i</option><option>(i)</option><option>(a)</option><option>(A)</option><option>(I)</option><option>(1)</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Total Questions</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={sec.totalQuestions} onChange={(e) => updateSection(idx, 'totalQuestions', e.target.value)} /></CCol>

                <CCol md={3}><CFormLabel>Mark of Each Question</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={sec.marksPerQuestion} onChange={(e) => updateSection(idx, 'marksPerQuestion', e.target.value)} /></CCol>
              </CRow>
            </CCardBody>
          </CCard>
        ))}

        {/* TABLE (placeholder as in HTML) */}
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Student Details</strong>
            <div className="d-flex gap-2 align-items-center">
              <CInputGroup size="sm" style={{ width: 260 }}>
                <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                <CFormInput placeholder="Search..." />
              </CInputGroup>
              <ArpIconButton icon="view" color="purple" disabled={!selectedId} />
              <ArpIconButton icon="edit" color="info" disabled={!selectedId} />
              <ArpIconButton icon="delete" color="danger" disabled={!selectedId} />
            </div>
          </CCardHeader>
          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Program Code</CTableHeaderCell>
                  <CTableHeaderCell>Programme</CTableHeaderCell>
                  <CTableHeaderCell>Semester</CTableHeaderCell>
                  <CTableHeaderCell>Batch</CTableHeaderCell>
                  <CTableHeaderCell>Reg. No.</CTableHeaderCell>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Class</CTableHeaderCell>
                  <CTableHeaderCell>Label</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                <CTableRow>
                  <CTableDataCell>
                    <CFormCheck type="radio" name="qmSel" checked={selectedId === 1} onChange={() => setSelectedId(1)} />
                  </CTableDataCell>
                  <CTableDataCell>MCA</CTableDataCell>
                  <CTableDataCell>Master of Computer Applications</CTableDataCell>
                  <CTableDataCell>2016</CTableDataCell>
                  <CTableDataCell>Yes</CTableDataCell>
                  <CTableDataCell>XXX - XXX</CTableDataCell>
                  <CTableDataCell>XXX - XXX</CTableDataCell>
                  <CTableDataCell>XXX - XXX</CTableDataCell>
                  <CTableDataCell>XXX - XXX</CTableDataCell>
                </CTableRow>
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default QuestionModelConfiguration
