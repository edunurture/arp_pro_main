import React, { useMemo, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * QuestionModelConfiguration.jsx (ARP CoreUI React Pro Standard) - Updated based on question_models.html
 *
 * HTML alignment incorporated:
 * - Top action: "Add New"
 * - Form: Choose Examination Pattern (OBE / Non-OBE) + Question Paper ID + "+" add section
 * - Sections are individual cards titled "Add Section" with header icons:
 *     Maximize / Minimize / Close (implemented using ArpIconButton icons that exist in ARP)
 * - Save / Cancel buttons aligned right
 *
 * ARP rules preserved:
 * - No direct @coreui/icons imports
 * - ArpDataTable for list table (search/page-size/pagination inside)
 */

const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`

const createSection = (overrides = {}) => ({
  id: uid(),
  header: '',
  nomenclature: '',
  description: '',
  questionType: '',
  maximumMarks: '',
  pattern: 'i',
  totalQuestions: '',
  markEach: '',
  minimized: false,
  fullscreen: false,
  ...overrides,
})

const numberOrZero = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export default function QuestionModelConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // Form fields based on HTML
  const [examPattern, setExamPattern] = useState('') // OBE Pattern / Non-OBE Pattern
  const [questionPaperId, setQuestionPaperId] = useState('')

  // Optional (kept for listing clarity)
  const [modelName, setModelName] = useState('')

  const [sections, setSections] = useState([])

  // Demo list rows (replace with API)
  const [rows, setRows] = useState([
    { id: 1, examPattern: 'OBE Pattern', questionPaperId: 'QP-OBE-001', modelName: 'Model - 1', totalMarks: 100, status: 'Active' },
    { id: 2, examPattern: 'Non-OBE Pattern', questionPaperId: 'QP-NOBE-002', modelName: 'Model - 2', totalMarks: 50, status: 'Active' },
  ])

  /* =========================
     SECTION HELPERS (HTML BEHAVIOR)
  ========================== */

  const addSection = () => setSections((prev) => [...prev, createSection()])

  const updateSection = (id, key, value) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)))
  }

  const toggleMinimize = (id) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, minimized: !s.minimized } : s)))

  const toggleFullscreen = (id) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, fullscreen: !s.fullscreen } : s)))

  const closeSection = (id) => setSections((prev) => prev.filter((s) => s.id !== id))

  const sectionTotal = (s) => numberOrZero(s.totalQuestions) * numberOrZero(s.markEach)

  const grandTotal = () => sections.reduce((sum, s) => sum + sectionTotal(s), 0)

  /* =========================
     HEADER / FORM ACTIONS
  ========================== */

  const onAddNew = () => {
    setIsEdit(true)
    setSelectedId(null)
    setExamPattern('')
    setQuestionPaperId('')
    setModelName('')
    setSections([])
  }

  const onCancel = () => {
    setIsEdit(false)
    setExamPattern('')
    setQuestionPaperId('')
    setModelName('')
    setSections([])
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!isEdit) return

    if (!examPattern || !questionPaperId) {
      alert('Please choose Examination Pattern and enter Question Paper ID.')
      return
    }
    if (sections.length === 0) {
      alert('Please add at least one Section using the "+" button.')
      return
    }

    const next = {
      id: selectedId ?? Date.now(),
      examPattern,
      questionPaperId,
      modelName: modelName || `Question Model - ${questionPaperId}`,
      totalMarks: grandTotal(),
      status: 'Active',
    }

    // Hook API save here
    setRows((prev) => {
      const exists = prev.some((r) => String(r.id) === String(next.id))
      return exists ? prev.map((r) => (String(r.id) === String(next.id) ? next : r)) : [next, ...prev]
    })

    setSelectedId(next.id)
    setIsEdit(false)
    setExamPattern('')
    setQuestionPaperId('')
    setModelName('')
    setSections([])
  }

  /* =========================
     LIST ACTIONS (ArpDataTable)
  ========================== */

  const selectedRow = rows.find((r) => String(r.id) === String(selectedId)) || null

  const onView = () => {
    if (!selectedRow) return
    alert(
      `Exam Pattern: ${selectedRow.examPattern}\nQuestion Paper ID: ${selectedRow.questionPaperId}\nModel Name: ${selectedRow.modelName}\nTotal Marks: ${selectedRow.totalMarks}\nStatus: ${selectedRow.status}`,
    )
  }

  const onEdit = () => {
    if (!selectedRow) return
    setIsEdit(true)
    setExamPattern(selectedRow.examPattern || '')
    setQuestionPaperId(selectedRow.questionPaperId || '')
    setModelName(selectedRow.modelName || '')
    // In real app: load sections from API
    setSections([createSection()])
  }

  const onDelete = () => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to delete this Question Model?')
    if (!ok) return
    setRows((prev) => prev.filter((r) => String(r.id) !== String(selectedRow.id)))
    setSelectedId(null)
  }

  /* =========================
     ArpDataTable CONFIG
  ========================== */

  const columns = useMemo(
    () => [
      { key: 'examPattern', label: 'Examination Pattern', sortable: true, width: 170 },
      { key: 'questionPaperId', label: 'Question Paper ID', sortable: true, width: 170, align: 'center' },
      { key: 'modelName', label: 'Model Name', sortable: true },
      { key: 'totalMarks', label: 'Total Marks', sortable: true, width: 130, align: 'center', sortType: 'number' },
      { key: 'status', label: 'Status', sortable: true, width: 110, align: 'center' },
    ],
    [],
  )

  const headerActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        {/* Small CSS to emulate HTML section maximize/minimize feel */}
        <style>{`
          .arp-section-fullscreen {
            position: fixed;
            inset: 20px;
            z-index: 1060;
            width: auto !important;
            height: auto !important;
            overflow: auto;
            box-shadow: 0 0 0 9999px rgba(0,0,0,.25);
          }
        `}</style>

        {/* ===================== A) HEADER ACTION CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>QUESTION MODEL CONFIGURATION</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
            </div>
          </CCardHeader>
        </CCard>

        {/* ===================== B) FORM CARD ===================== */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Examination Pattern</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3 align-items-center">
                <CCol md={3}>
                  <CFormLabel>Choose Examination Pattern</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={examPattern} onChange={(e) => setExamPattern(e.target.value)} disabled={!isEdit}>
                    <option value="">Select Pattern</option>
                    <option value="OBE Pattern">OBE Pattern</option>
                    <option value="Non-OBE Pattern">Non-OBE Pattern</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Question Paper ID</CFormLabel>
                </CCol>
                <CCol md={2}>
                  <CFormInput value={questionPaperId} onChange={(e) => setQuestionPaperId(e.target.value)} disabled={!isEdit} />
                </CCol>

                {/* "+" button as in HTML */}
                <CCol md={1} className="text-center">
                  <ArpIconButton icon="add" color="success" title="Add Section" onClick={addSection} disabled={!isEdit} />
                </CCol>

                {/* Optional model name */}
                <CCol md={3}>
                  <CFormLabel>Model Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={modelName} onChange={(e) => setModelName(e.target.value)} disabled={!isEdit} placeholder="Optional" />
                </CCol>

                <CCol md={6} />

                {/* Save/Cancel aligned right */}
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ===================== Sections Container (as HTML injected cards) ===================== */}
        {sections.map((s, index) => (
          <CCard key={s.id} className={`mb-3 ${s.fullscreen ? 'arp-section-fullscreen' : ''}`}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>{`Add Section ${index + 1}`}</strong>

              {/* HTML shows maximize/minimize/close icons in header.
                  Using ARP-safe icons:
                  - Maximize: "view" (fullscreen toggle)
                  - Minimize: "edit" (collapse toggle)
                  - Close: "delete" (remove)
              */}
              <div className="d-flex gap-2">
                <ArpIconButton
                  icon="view"
                  color="primary"
                  title={s.fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  onClick={() => toggleFullscreen(s.id)}
                  disabled={!isEdit}
                />
                <ArpIconButton
                  icon="edit"
                  color="info"
                  title={s.minimized ? 'Expand' : 'Minimize'}
                  onClick={() => toggleMinimize(s.id)}
                  disabled={!isEdit}
                />
                <ArpIconButton icon="delete" color="danger" title="Close Section" onClick={() => closeSection(s.id)} disabled={!isEdit} />
              </div>
            </CCardHeader>

            {!s.minimized && (
              <CCardBody>
                <CRow className="g-3">
                  <CCol md={3}>
                    <CFormLabel>Section Header</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <CFormInput value={s.header} onChange={(e) => updateSection(s.id, 'header', e.target.value)} disabled={!isEdit} />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Nomenclature</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <CFormInput value={s.nomenclature} onChange={(e) => updateSection(s.id, 'nomenclature', e.target.value)} disabled={!isEdit} />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Section Description</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <CFormInput value={s.description} onChange={(e) => updateSection(s.id, 'description', e.target.value)} disabled={!isEdit} />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Question Type</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <CFormSelect value={s.questionType} onChange={(e) => updateSection(s.id, 'questionType', e.target.value)} disabled={!isEdit}>
                      <option value="">Select QP Type</option>
                      <option value="Multiple Choice Questions (MCQ)">Multiple Choice Questions (MCQ)</option>
                      <option value="Descriptive – Answer Any">Descriptive – Answer Any</option>
                      <option value="Descriptive – Either (Or)">Descriptive – Either (Or)</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Maximum Marks</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <CFormInput type="number" min={0} value={s.maximumMarks} onChange={(e) => updateSection(s.id, 'maximumMarks', e.target.value)} disabled={!isEdit} />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Pattern</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <CFormSelect value={s.pattern} onChange={(e) => updateSection(s.id, 'pattern', e.target.value)} disabled={!isEdit}>
                      <option value="i">i</option>
                      <option value="(i)">(i)</option>
                      <option value="(a)">(a)</option>
                      <option value="(A)">(A)</option>
                      <option value="(I)">(I)</option>
                      <option value="(1)">(1)</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Total Questions</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <CFormInput type="number" min={0} value={s.totalQuestions} onChange={(e) => updateSection(s.id, 'totalQuestions', e.target.value)} disabled={!isEdit} />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Mark of Each Question</CFormLabel>
                  </CCol>
                  <CCol md={3}>
                    <CFormInput type="number" min={0} value={s.markEach} onChange={(e) => updateSection(s.id, 'markEach', e.target.value)} disabled={!isEdit} />
                  </CCol>

                  <CCol md={3}>
                    <CFormLabel>Section Total</CFormLabel>
                  </CCol>
                  <CCol md={3} className="d-flex align-items-center">
                    <strong>{sectionTotal(s)}</strong>
                  </CCol>
                </CRow>
              </CCardBody>
            )}
          </CCard>
        ))}

        {/* ===================== C) TABLE CARD (ArpDataTable) ===================== */}
        <ArpDataTable
          title="QUESTION MODEL LIST"
          rows={rows}
          columns={columns}
          loading={false}
          headerActions={headerActions}
          selection={{
            type: 'radio',
            selected: selectedId,
            onChange: (value) => setSelectedId(value),
            key: 'id',
            headerLabel: 'Select',
            width: 60,
            name: 'questionModelSelect',
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          defaultPageSize={10}
          searchable
          searchPlaceholder="Search..."
          rowKey="id"
        />
      </CCol>
    </CRow>
  )
}
