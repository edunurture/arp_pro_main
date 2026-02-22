import React, { useEffect, useMemo, useState } from 'react'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'
import api from '../../services/apiClient'

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

const toNullableInt = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

const normalizeExamPattern = (v) => {
  const raw = String(v ?? '').trim().toUpperCase()
  if (raw === 'OBE' || raw === 'OBE PATTERN') return 'OBE Pattern'
  if (raw === 'NON_OBE' || raw === 'NON-OBE PATTERN') return 'Non-OBE Pattern'
  return ''
}

const isPatternDisabledForType = (questionType) => String(questionType || '').trim() === 'Descriptive - Answer Any'

export default function QuestionModelConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [institutions, setInstitutions] = useState([])
  const [institutionId, setInstitutionId] = useState('')

  const [examPattern, setExamPattern] = useState('')
  const [questionPaperId, setQuestionPaperId] = useState('')
  const [modelName, setModelName] = useState('')
  const [sections, setSections] = useState([])

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (type, message) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4500)
  }

  const sectionTotal = (s) => numberOrZero(s.totalQuestions) * numberOrZero(s.markEach)
  const grandTotal = () => sections.reduce((sum, s) => sum + sectionTotal(s), 0)

  const addSection = () => setSections((prev) => [...prev, createSection()])
  const updateSection = (id, key, value) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)))
  const toggleMinimize = (id) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, minimized: !s.minimized } : s)))
  const toggleFullscreen = (id) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, fullscreen: !s.fullscreen } : s)))
  const closeSection = (id) => setSections((prev) => prev.filter((s) => s.id !== id))
  const onQuestionTypeChange = (id, value) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              questionType: value,
              pattern: isPatternDisabledForType(value) ? '' : s.pattern || 'i',
            }
          : s,
      ),
    )
  }

  const resetForm = () => {
    setExamPattern('')
    setQuestionPaperId('')
    setModelName('')
    setSections([])
  }

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/api/setup/institution')
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
      setInstitutions(list)
      if (list.length > 0 && !institutionId) setInstitutionId(list[0].id)
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load institutions'
      showToast('danger', msg)
    }
  }

  const mapApiToRow = (row) => {
    const mappedPattern = normalizeExamPattern(row?.examPattern || row?.examinationPattern)
    const totalMarks = Array.isArray(row?.sections)
      ? row.sections.reduce((sum, s) => sum + numberOrZero(s.totalQuestions) * numberOrZero(s.markEach), 0)
      : 0
    return {
      ...row,
      id: row.id,
      examPattern: mappedPattern,
      modelName: row.modelName || `Question Model - ${row.questionPaperId || ''}`.trim(),
      totalMarks,
      status: row.status === false ? 'Inactive' : 'Active',
    }
  }

  const loadQuestionModels = async (instId) => {
    if (!instId) {
      setRows([])
      return
    }
    setLoading(true)
    try {
      const res = await api.get('/api/setup/question-model', { params: { institutionId: instId } })
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
      setRows(list.map(mapApiToRow))
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load question models'
      showToast('danger', msg)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstitutions()
  }, [])

  useEffect(() => {
    loadQuestionModels(institutionId)
    setSelectedId(null)
    setIsEdit(false)
    resetForm()
  }, [institutionId])

  const selectedRow = rows.find((r) => String(r.id) === String(selectedId)) || null

  const onAddNew = () => {
    if (!institutionId) return showToast('danger', 'Please configure Institution first')
    setIsEdit(true)
    setSelectedId(null)
    resetForm()
  }

  const onCancel = () => {
    setIsEdit(false)
    resetForm()
  }

  const onView = () => {
    if (!selectedRow) return
    setIsEdit(false)
    setExamPattern(selectedRow.examPattern || '')
    setQuestionPaperId(selectedRow.questionPaperId || '')
    setModelName(selectedRow.modelName || '')
    const loadedSections = Array.isArray(selectedRow.sections)
      ? selectedRow.sections.map((s) =>
          createSection({
            id: s.id || uid(),
            header: s.header || '',
            nomenclature: s.nomenclature || '',
            description: s.description || '',
            questionType: s.questionType || '',
            maximumMarks: s.maximumMarks ?? '',
            pattern: s.pattern || '',
            totalQuestions: s.totalQuestions ?? '',
            markEach: s.markEach ?? '',
            minimized: false,
            fullscreen: false,
          }),
        )
      : []
    setSections(loadedSections)
  }

  const onEdit = () => {
    if (!selectedRow) return
    setIsEdit(true)
    setExamPattern(selectedRow.examPattern || '')
    setQuestionPaperId(selectedRow.questionPaperId || '')
    setModelName(selectedRow.modelName || '')
    const loadedSections = Array.isArray(selectedRow.sections)
      ? selectedRow.sections.map((s) =>
          createSection({
            id: s.id || uid(),
            header: s.header || '',
            nomenclature: s.nomenclature || '',
            description: s.description || '',
            questionType: s.questionType || '',
            maximumMarks: s.maximumMarks ?? '',
            pattern: s.pattern || 'i',
            totalQuestions: s.totalQuestions ?? '',
            markEach: s.markEach ?? '',
          }),
        )
      : []
    setSections(loadedSections.length ? loadedSections : [createSection()])
  }

  const onDelete = async () => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to delete this Question Model?')
    if (!ok) return
    try {
      await api.delete(`/api/setup/question-model/${selectedRow.id}`)
      showToast('success', 'Question Model deleted successfully')
      setSelectedId(null)
      await loadQuestionModels(institutionId)
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to delete question model'
      showToast('danger', msg)
    }
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (!isEdit) return

    if (!institutionId) return showToast('danger', 'Institution is required')
    if (!examPattern || !questionPaperId) return showToast('danger', 'Please choose Examination Pattern and enter Question Paper ID.')
    if (sections.length === 0) return showToast('danger', 'Please add at least one Section using the "+" button.')

    const sectionMissing = sections.some((s) => !String(s.header || '').trim() || !String(s.nomenclature || '').trim())
    if (sectionMissing) return showToast('danger', 'Each section must have Section Header and Nomenclature.')

    const payload = {
      institutionId,
      examPattern,
      questionPaperId: String(questionPaperId).trim(),
      modelName: modelName?.trim() || null,
      sections: sections.map((s) => ({
        header: String(s.header || '').trim(),
        nomenclature: String(s.nomenclature || '').trim(),
        description: String(s.description || '').trim(),
        questionType: String(s.questionType || '').trim(),
        maximumMarks: toNullableInt(s.maximumMarks),
        pattern: String(s.pattern || '').trim(),
        totalQuestions: toNullableInt(s.totalQuestions),
        markEach: toNullableInt(s.markEach),
      })),
    }

    setSaving(true)
    try {
      if (selectedId) {
        await api.put(`/api/setup/question-model/${selectedId}`, payload)
        showToast('success', 'Question Model updated successfully')
      } else {
        await api.post('/api/setup/question-model', payload)
        showToast('success', 'Question Model created successfully')
      }
      setIsEdit(false)
      resetForm()
      await loadQuestionModels(institutionId)
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to save question model'
      showToast('danger', msg)
    } finally {
      setSaving(false)
    }
  }

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

        {toast && (
          <CAlert color={toast.type} className="mb-3">
            {toast.message}
          </CAlert>
        )}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>QUESTION MODEL CONFIGURATION</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
            </div>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Examination Pattern</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3 align-items-center">
                <CCol md={3}>
                  <CFormLabel>Institution</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
                    <option value="">Select Institution</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

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
                <CCol md={3}>
                  <CFormInput value={questionPaperId} onChange={(e) => setQuestionPaperId(e.target.value)} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Model Name</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={modelName} onChange={(e) => setModelName(e.target.value)} disabled={!isEdit} placeholder="Optional" />
                </CCol>
                <CCol md={6} />

                <CCol md={3}>
                  <CFormLabel>Grand Total</CFormLabel>
                </CCol>
                <CCol md={3} className="d-flex align-items-center">
                  <strong>{grandTotal()}</strong>
                </CCol>
                <CCol md={6} />

                <CCol xs={12} className="d-flex justify-content-between align-items-center">
                  <ArpButton label="+Add Section" color="success" type="button" onClick={addSection} disabled={!isEdit} />
                  <div className="d-flex gap-2">
                    <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit || saving} />
                    <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                  </div>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {sections.map((s, index) => (
          <CCard key={s.id} className={`mb-3 ${s.fullscreen ? 'arp-section-fullscreen' : ''}`}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>{`Add Section ${index + 1}`}</strong>

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
                    <CFormSelect value={s.questionType} onChange={(e) => onQuestionTypeChange(s.id, e.target.value)} disabled={!isEdit}>
                      <option value="">Select QP Type</option>
                      <option value="Multiple Choice Questions (MCQ)">Multiple Choice Questions (MCQ)</option>
                      <option value="Descriptive - Answer Any">Descriptive - Answer Any</option>
                      <option value="Descriptive - Either (Or)">Descriptive - Either (Or)</option>
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
                    <CFormSelect
                      value={s.pattern}
                      onChange={(e) => updateSection(s.id, 'pattern', e.target.value)}
                      disabled={!isEdit || isPatternDisabledForType(s.questionType)}
                    >
                      <option value="">N/A</option>
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

        <ArpDataTable
          title="QUESTION MODEL LIST"
          rows={rows}
          columns={columns}
          loading={loading}
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
