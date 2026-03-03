import React, { useEffect, useState } from 'react'
import {
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
} from '@coreui/react-pro'

import { ArpButton, ArpDataTable, ArpIconButton } from '../../components/common'
import api, { API_BASE } from '../../services/apiClient'
import QuestionRichEditor from '../../components/evaluation/QuestionRichEditor'

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const initialHeader = {
  questionBankId: '',
  examinationId: '',
  examinationName: '',
  questionBankName: '',
  questionModelId: '',
  status: '',
}

const defaultEditor = {
  questionNo: '',
  unitNo: '',
  questionType: 'DESCRIPTIVE',
  questionHtml: '',
  questionLatex: '',
  languageCode: 'en',
  difficulty: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: '',
}

const QuestionBank = () => {
  const [toast, setToast] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [institutionId, setInstitutionId] = useState('')
  const [courses, setCourses] = useState([])
  const [allScopeCourses, setAllScopeCourses] = useState([])
  const [semesterOptions, setSemesterOptions] = useState([])
  const [scope, setScope] = useState({
    departmentId: '',
    programmeId: '',
    semester: '',
    courseOfferingId: '',
  })

  const [meta, setMeta] = useState({ examinations: [], questionModels: [], units: [] })
  const [header, setHeader] = useState(initialHeader)
  const [sectionsPlan, setSectionsPlan] = useState([])
  const [accordionActive, setAccordionActive] = useState('')
  const [sectionRows, setSectionRows] = useState({})
  const [sectionSelection, setSectionSelection] = useState({})
  const [editors, setEditors] = useState({})
  const [preparationMode, setPreparationMode] = useState('EDITOR')
  const [uploadFile, setUploadFile] = useState(null)

  const [banksRows, setBanksRows] = useState([])
  const [selectedBankRowId, setSelectedBankRowId] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const showToast = (color, message) => {
    setToast({ color, message })
    window.setTimeout(() => setToast(null), 4000)
  }

  const setEditor = (sectionId, patch) => {
    setEditors((prev) => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] || defaultEditor), ...patch },
    }))
  }

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/api/setup/institution')
      const list = unwrapList(res)
      setInstitutions(list)
      if (list.length) setInstitutionId(list[0].id)
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to load institutions')
    }
  }

  const loadCoursesByProgramme = async (instId, programmeId) => {
    if (!instId || !programmeId) {
      setAllScopeCourses([])
      setCourses([])
      setSemesterOptions([])
      return
    }
    try {
      const res = await api.get('/api/evaluation/question-bank/courses', {
        params: {
          institutionId: instId,
          programmeId,
        },
      })
      const rows = unwrapList(res)
      setAllScopeCourses(rows)
      const sems = [...new Set(rows.map((r) => String(r.semester || '')).filter(Boolean))]
        .sort((a, b) => Number(a) - Number(b))
      setSemesterOptions(sems)
      setCourses(rows)
      setScope((p) => ({
        ...p,
        semester: sems.includes(String(p.semester || '')) ? p.semester : '',
        courseOfferingId:
          rows.some((x) => String(x.courseOfferingId) === String(p.courseOfferingId))
            ? p.courseOfferingId
            : '',
      }))
    } catch (err) {
      setCourses([])
      showToast('danger', err?.response?.data?.error || 'Failed to load courses')
    }
  }

  const loadDepartments = async (instId) => {
    if (!instId) return setDepartments([])
    try {
      const res = await api.get('/api/setup/department')
      const rows = unwrapList(res).filter((d) => String(d.institutionId) === String(instId))
      setDepartments(rows)
    } catch {
      setDepartments([])
    }
  }

  const loadProgrammes = async (instId, deptId = '') => {
    if (!instId) return setProgrammes([])
    try {
      const res = await api.get('/api/setup/programme')
      let rows = unwrapList(res).filter((p) => String(p.institutionId) === String(instId))
      if (deptId) rows = rows.filter((p) => String(p.departmentId) === String(deptId))
      setProgrammes(rows)
    } catch {
      setProgrammes([])
    }
  }

  const loadMeta = async (instId, courseOfferingId) => {
    if (!instId || !courseOfferingId) return
    try {
      const res = await api.get('/api/evaluation/question-bank/meta', {
        params: { institutionId: instId, courseOfferingId },
      })
      setMeta(res?.data?.data || { examinations: [], questionModels: [], units: [] })
    } catch (err) {
      setMeta({ examinations: [], questionModels: [], units: [] })
      showToast('danger', err?.response?.data?.error || 'Failed to load metadata')
    }
  }

  const loadBanks = async (instId, courseOfferingId) => {
    if (!instId || !courseOfferingId) return
    setLoading(true)
    try {
      const res = await api.get('/api/evaluation/question-bank/banks', {
        params: { institutionId: instId, courseOfferingId },
      })
      setBanksRows(unwrapList(res))
      setSelectedBankRowId('')
    } catch (err) {
      setBanksRows([])
      showToast('danger', err?.response?.data?.error || 'Failed to load question banks')
    } finally {
      setLoading(false)
    }
  }

  const loadModelSections = async (questionModelId) => {
    if (!questionModelId) {
      setSectionsPlan([])
      return
    }
    try {
      const res = await api.get(`/api/evaluation/question-bank/models/${questionModelId}/sections`)
      const sections = unwrapList(res).map((s) => ({
        ...s,
        targetCount: s.requiredCount,
        filledCount: 0,
      }))
      setSectionsPlan(sections)
      setEditors({})
      setSectionRows({})
      setSectionSelection({})
      setAccordionActive('')
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to load model sections')
    }
  }

  const loadBankDetails = async (questionBankId) => {
    try {
      const res = await api.get(`/api/evaluation/question-bank/banks/${questionBankId}`)
      const data = res?.data?.data
      if (!data) return
      setHeader({
        questionBankId: data.questionBankId,
        examinationId: data.examinationName,
        examinationName: data.examinationName,
        questionBankName: data.questionBankName,
        questionModelId: data.questionModelId,
        status: data.status,
      })
      setSectionsPlan(data.sectionsPlan || [])
      setEditors({})
      setSectionRows({})
      setSectionSelection({})
      setUploadFile(null)
      setSelectedBankRowId(questionBankId)
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to load question bank details')
    }
  }

  const loadSectionQuestions = async (sectionId) => {
    if (!header.questionBankId || !sectionId) return
    try {
      const res = await api.get(`/api/evaluation/question-bank/banks/${header.questionBankId}/sections/${sectionId}/questions`)
      const data = res?.data?.data || { rows: [], section: null }
      setSectionRows((p) => ({ ...p, [sectionId]: data.rows || [] }))
      setSectionsPlan((prev) =>
        prev.map((s) =>
          s.sectionId === sectionId
            ? { ...s, filledCount: (data.rows || []).length }
            : s,
        ),
      )
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to load section questions')
    }
  }

  useEffect(() => {
    loadInstitutions()
  }, [])

  useEffect(() => {
    setHeader(initialHeader)
    setSectionsPlan([])
    setSectionRows({})
    setSectionSelection({})
    setEditors({})
    setScope({ departmentId: '', programmeId: '', semester: '', courseOfferingId: '' })
    if (institutionId) {
      loadDepartments(institutionId)
      loadProgrammes(institutionId, '')
    }
  }, [institutionId])

  useEffect(() => {
    if (!institutionId) return
    loadProgrammes(institutionId, scope.departmentId || '')
    setScope((p) => ({ ...p, programmeId: '', semester: '', courseOfferingId: '' }))
    setAllScopeCourses([])
    setSemesterOptions([])
    setCourses([])
  }, [scope.departmentId])

  useEffect(() => {
    if (!institutionId || !scope.programmeId) {
      setAllScopeCourses([])
      setSemesterOptions([])
      setCourses([])
      setScope((p) => ({ ...p, semester: '', courseOfferingId: '' }))
      return
    }
    loadCoursesByProgramme(institutionId, scope.programmeId)
  }, [institutionId, scope.programmeId])

  useEffect(() => {
    if (!scope.semester) {
      setCourses(allScopeCourses)
      setScope((p) => ({ ...p, courseOfferingId: '' }))
      return
    }
    const filtered = allScopeCourses.filter((r) => String(r.semester) === String(scope.semester))
    setCourses(filtered)
    if (!filtered.some((x) => String(x.courseOfferingId) === String(scope.courseOfferingId))) {
      setScope((p) => ({ ...p, courseOfferingId: '' }))
    }
  }, [scope.semester, allScopeCourses])

  const onScopeSearch = async () => {
    if (!institutionId) return showToast('danger', 'Choose Institution')
    if (!scope.departmentId) return showToast('danger', 'Choose Department')
    if (!scope.programmeId) return showToast('danger', 'Choose Programme')
    if (!scope.semester) return showToast('danger', 'Choose Semester')
    if (!scope.courseOfferingId) return showToast('danger', 'Choose Course')
    await loadMeta(institutionId, scope.courseOfferingId)
    await loadBanks(institutionId, scope.courseOfferingId)
    setHeader(initialHeader)
    setSectionsPlan([])
    setSectionRows({})
    setSectionSelection({})
    setEditors({})
    setSelectedBankRowId('')
  }

  useEffect(() => {
    if (institutionId && scope.courseOfferingId) {
      loadMeta(institutionId, scope.courseOfferingId)
      loadBanks(institutionId, scope.courseOfferingId)
    }
  }, [institutionId, scope.courseOfferingId])

  const onAddNew = () => {
    setHeader(initialHeader)
    setSectionsPlan([])
    setSectionRows({})
    setSectionSelection({})
    setEditors({})
    setPreparationMode('EDITOR')
    setUploadFile(null)
    setSelectedBankRowId('')
  }

  const onReset = () => {
    if (!header.questionBankId) return onAddNew()
    loadBankDetails(header.questionBankId)
  }

  const onSaveHeader = async () => {
    if (!institutionId || !scope.courseOfferingId) return showToast('danger', 'Institution/Course is required')
    if (!header.examinationName) return showToast('danger', 'Choose examination')
    if (!header.questionBankName) return showToast('danger', 'Enter Question Bank Name')
    if (!header.questionModelId) return showToast('danger', 'Choose Question Model')
    if (!sectionsPlan.length) return showToast('danger', 'Sections are required')

    const invalid = sectionsPlan.find((s) => Number(s.targetCount || 0) < Number(s.requiredCount || 0))
    if (invalid) return showToast('danger', `${invalid.sectionLabel}: target must be >= required`)

    setSaving(true)
    try {
      const payload = {
        questionBankId: header.questionBankId || undefined,
        institutionId,
        courseOfferingId: scope.courseOfferingId,
        examinationId: header.examinationId || header.examinationName,
        examinationName: header.examinationName,
        questionBankName: header.questionBankName,
        questionModelId: header.questionModelId,
        sectionsPlan: sectionsPlan.map((s) => ({
          sectionId: s.sectionId,
          targetCount: Number(s.targetCount),
        })),
      }
      const res = await api.post('/api/evaluation/question-bank/banks', payload)
      const qbId = res?.data?.data?.questionBankId
      if (!qbId) throw new Error('questionBankId missing')
      setHeader((p) => ({ ...p, questionBankId: qbId, status: 'DRAFT' }))
      await loadBankDetails(qbId)
      await loadBanks(institutionId, scope.courseOfferingId)
      showToast('success', 'Question bank header saved')
    } catch (err) {
      showToast('danger', err?.response?.data?.error || err?.message || 'Failed to save header')
    } finally {
      setSaving(false)
    }
  }

  const onSelectQuestionNo = async (sectionId, questionNo) => {
    setEditor(sectionId, { questionNo })
    if (!header.questionBankId || !sectionId || !questionNo) return
    try {
      const res = await api.get(`/api/evaluation/question-bank/banks/${header.questionBankId}/sections/${sectionId}/questions/${questionNo}`)
      const row = res?.data?.data
      if (!row) {
        setEditor(sectionId, {
          unitNo: meta?.units?.[0]?.value ? String(meta.units[0].value) : '',
          questionType: 'DESCRIPTIVE',
          questionHtml: '',
          questionLatex: '',
          languageCode: 'en',
          difficulty: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctOption: '',
        })
        return
      }
      const opts = Array.isArray(row.optionsJson) ? row.optionsJson : []
      const correct = row?.answerKeyJson?.correct || ''
      setEditor(sectionId, {
        questionNo: String(row.questionNo || questionNo),
        unitNo: row.unitNo == null ? '' : String(row.unitNo),
        questionType: row.questionType || (opts.length ? 'MCQ' : 'DESCRIPTIVE'),
        questionHtml: row.questionHtml || row.questionText || '',
        questionLatex: row.questionLatex || '',
        languageCode: row.languageCode || 'en',
        difficulty: row.difficulty || '',
        optionA: opts[0] || '',
        optionB: opts[1] || '',
        optionC: opts[2] || '',
        optionD: opts[3] || '',
        correctOption: correct || '',
      })
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to load question')
    }
  }

  const onSaveQuestion = async (section) => {
    const ed = editors[section.sectionId] || defaultEditor
    if (!header.questionBankId) return showToast('danger', 'Save header first')
    if (!ed.questionNo) return showToast('danger', 'Choose Question Number')
    if (!ed.questionHtml) return showToast('danger', 'Enter question content')
    if (ed.questionType === 'MCQ' && (!ed.optionA || !ed.optionB || !ed.optionC || !ed.optionD || !ed.correctOption)) {
      return showToast('danger', 'MCQ requires options A-D and correct option')
    }
    try {
      await api.put(
        `/api/evaluation/question-bank/banks/${header.questionBankId}/sections/${section.sectionId}/questions/${ed.questionNo}`,
        {
          unitNo: ed.unitNo ? Number(ed.unitNo) : null,
          questionType: ed.questionType,
          questionHtml: ed.questionHtml,
          questionText: ed.questionHtml,
          questionLatex: ed.questionLatex || null,
          languageCode: ed.languageCode || 'en',
          difficulty: ed.difficulty || null,
          optionsJson: ed.questionType === 'MCQ' ? [ed.optionA, ed.optionB, ed.optionC, ed.optionD] : null,
          answerKeyJson: ed.questionType === 'MCQ' ? { correct: ed.correctOption } : null,
        },
      )
      await loadSectionQuestions(section.sectionId)
      showToast('success', 'Question saved')
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to save question')
    }
  }

  const onDownloadTemplate = () => {
    if (!header.questionModelId) return showToast('danger', 'Choose Question Model first')
    const base = API_BASE || ''
    window.open(
      `${base}/api/evaluation/question-bank/template/download?questionModelId=${encodeURIComponent(header.questionModelId)}`,
      '_blank',
    )
  }

  const onUploadTemplate = async () => {
    if (!header.questionBankId) return showToast('danger', 'Save header first')
    if (!uploadFile) return showToast('danger', 'Choose upload file')
    try {
      const fd = new FormData()
      fd.append('file', uploadFile)
      const res = await api.post(`/api/evaluation/question-bank/${header.questionBankId}/questions/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const d = res?.data?.data || {}
      const inserted = Number(d.inserted || 0)
      const failed = Number(d.failed || 0)
      if (failed > 0) {
        showToast('warning', `Upload completed with errors. Inserted: ${inserted}, Failed: ${failed}`)
      } else {
        showToast('success', `Upload completed. Inserted: ${inserted}`)
      }
      setUploadFile(null)
      await loadBankDetails(header.questionBankId)
      for (const s of sectionsPlan) {
        await loadSectionQuestions(s.sectionId)
      }
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to upload template')
    }
  }

  const onDeleteQuestionRow = async (sectionId) => {
    const row = (sectionRows[sectionId] || []).find((x) => String(x.id) === String(sectionSelection[sectionId] || ''))
    if (!row) return
    const ok = window.confirm('Delete selected question?')
    if (!ok) return
    try {
      await api.delete(`/api/evaluation/question-bank/banks/${header.questionBankId}/sections/${sectionId}/questions/${row.questionNo}`)
      await loadSectionQuestions(sectionId)
      setSectionSelection((p) => ({ ...p, [sectionId]: '' }))
      showToast('success', 'Question deleted')
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to delete question')
    }
  }

  const sectionActions = (sectionId) => {
    const row = (sectionRows[sectionId] || []).find((x) => String(x.id) === String(sectionSelection[sectionId] || ''))
    return (
      <div className="d-flex gap-2">
        <ArpIconButton
          icon="view"
          color="purple"
          disabled={!row}
          onClick={() => {
            if (!row) return
            const w = window.open('', '_blank')
            if (!w) return
            w.document.write(`<html><body style="font-family:Arial;padding:16px;">${row.questionHtml || row.questionText || ''}</body></html>`)
            w.document.close()
          }}
        />
        <ArpIconButton
          icon="edit"
          color="info"
          disabled={!row}
          onClick={() => {
            if (!row) return
            onSelectQuestionNo(sectionId, row.questionNo)
          }}
        />
        <ArpIconButton icon="delete" color="danger" disabled={!row} onClick={() => onDeleteQuestionRow(sectionId)} />
      </div>
    )
  }

  const onComplete = async () => {
    if (!header.questionBankId) return
    try {
      await api.post(`/api/evaluation/question-bank/banks/${header.questionBankId}/complete`)
      showToast('success', 'Question bank completed')
      await loadBankDetails(header.questionBankId)
      await loadBanks(institutionId, scope.courseOfferingId)
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to complete bank')
    }
  }

  const onPublish = async () => {
    if (!header.questionBankId) return
    try {
      await api.post(`/api/evaluation/question-bank/banks/${header.questionBankId}/publish`)
      showToast('success', 'Question bank published')
      await loadBankDetails(header.questionBankId)
      await loadBanks(institutionId, scope.courseOfferingId)
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to publish bank')
    }
  }

  const onBankDelete = async () => {
    if (!selectedBankRowId) return
    const ok = window.confirm('Delete selected question bank?')
    if (!ok) return
    try {
      await api.delete(`/api/evaluation/question-bank/banks/${selectedBankRowId}`)
      showToast('success', 'Question bank deleted')
      onAddNew()
      await loadBanks(institutionId, scope.courseOfferingId)
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to delete question bank')
    }
  }

  const openBankDownload = (ext) => {
    if (!selectedBankRowId) return
    const base = API_BASE || ''
    window.open(`${base}/api/evaluation/question-bank/banks/${selectedBankRowId}/download.${ext}`, '_blank')
  }

  return (
    <CRow>
      <CCol xs={12}>
        {toast && <CAlert color={toast.color}>{toast.message}</CAlert>}

        <CCard className="mb-3">
          <CCardHeader>
            <strong>QUESTION BANK PREPARATION</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2} className="d-flex align-items-center">
                <CFormLabel>Institution</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
                  <option value="">Select</option>
                  {institutions.map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2} className="d-flex align-items-center">
                <CFormLabel>Department</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.departmentId}
                  onChange={(e) => setScope((p) => ({ ...p, departmentId: e.target.value }))}
                >
                  <option value="">Select</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.departmentCode} - {d.departmentName}</option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={2} className="d-flex align-items-center">
                <CFormLabel>Programme Code with Programme</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.programmeId}
                  onChange={(e) => setScope((p) => ({ ...p, programmeId: e.target.value }))}
                >
                  <option value="">Select</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>{p.programmeCode} - {p.programmeName}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2} className="d-flex align-items-center">
                <CFormLabel>Semester</CFormLabel>
              </CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.semester}
                  onChange={(e) => setScope((p) => ({ ...p, semester: e.target.value }))}
                  disabled={!scope.programmeId}
                >
                  <option value="">Select</option>
                  {semesterOptions.map((n) => (
                    <option key={n} value={String(n)}>Sem {n}</option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={2} className="d-flex align-items-center">
                <CFormLabel>Course</CFormLabel>
              </CCol>
              <CCol md={8}>
                <CFormSelect
                  value={scope.courseOfferingId}
                  onChange={(e) => setScope((p) => ({ ...p, courseOfferingId: e.target.value }))}
                  disabled={!scope.programmeId || !scope.semester}
                >
                  <option value="">Select</option>
                  {courses.map((c) => (
                    <option key={c.courseOfferingId} value={c.courseOfferingId}>
                      {c.courseCode} - {c.courseName} ({c.programmeCode}, Sem {c.semester})
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2} className="d-flex align-items-stretch">
                <ArpButton label="Search" icon="search" color="primary" type="button" onClick={onScopeSearch} />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Question Bank Header</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" type="button" onClick={onAddNew} />
              <ArpButton label="Reset" icon="reset" color="secondary" type="button" onClick={onReset} />
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={4}>
                <CFormLabel>Name of Examination</CFormLabel>
                <CFormSelect
                  value={header.examinationName}
                  onChange={(e) => {
                    const v = e.target.value
                    setHeader((p) => ({ ...p, examinationId: v, examinationName: v }))
                  }}
                >
                  <option value="">Select</option>
                  {(meta.examinations || []).map((x) => (
                    <option key={x.id} value={x.name || x.id}>{x.name || x.id}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>Question Bank Name</CFormLabel>
                <CFormInput
                  value={header.questionBankName}
                  onChange={(e) => setHeader((p) => ({ ...p, questionBankName: e.target.value }))}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Question Model</CFormLabel>
                <CFormSelect
                  value={header.questionModelId}
                  onChange={(e) => {
                    const modelId = e.target.value
                    setHeader((p) => ({ ...p, questionModelId: modelId }))
                    loadModelSections(modelId)
                  }}
                >
                  <option value="">Select</option>
                  {(meta.questionModels || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.questionPaperId} ({m.examPattern})
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>

            {sectionsPlan.length > 0 && (
              <div className="mt-3">
                <ArpDataTable
                  title="Section Plan"
                  rows={sectionsPlan}
                  rowKey="sectionId"
                  columns={[
                    { key: 'sectionLabel', label: 'Section', sortable: true },
                    { key: 'requiredCount', label: 'Model Required', sortable: true, align: 'center', sortType: 'number' },
                    {
                      key: 'targetCount',
                      label: 'QB Target Questions',
                      sortable: false,
                      render: (r) => (
                        <CFormInput
                          type="number"
                          min={r.requiredCount || 0}
                          value={r.targetCount}
                          onChange={(e) => {
                            const v = Number(e.target.value || 0)
                            setSectionsPlan((prev) =>
                              prev.map((x) => (x.sectionId === r.sectionId ? { ...x, targetCount: v } : x)),
                            )
                          }}
                        />
                      ),
                    },
                    { key: 'markEach', label: 'Marks (Auto)', sortable: true, align: 'center', sortType: 'number' },
                    { key: 'filledCount', label: 'Prepared', sortable: true, align: 'center', sortType: 'number' },
                  ]}
                />
                <div className="d-flex align-items-center justify-content-between gap-3 mt-3">
                  <div className="small text-body-secondary">Question Bank prepared by</div>
                  <CFormSelect
                    value={preparationMode}
                    onChange={(e) => setPreparationMode(e.target.value)}
                    style={{ width: 260 }}
                  >
                    <option value="UPLOAD">By Upload Template</option>
                    <option value="EDITOR">Using Editor</option>
                  </CFormSelect>
                </div>

                {preparationMode === 'UPLOAD' && (
                  <CCard className="mt-3">
                    <CCardHeader>
                      <strong>Upload Question Bank Template</strong>
                    </CCardHeader>
                    <CCardBody>
                      {!header.questionBankId && (
                        <CAlert color="warning" className="mb-3">
                          Save Header first to enable upload. Template download is available now.
                        </CAlert>
                      )}
                      <CRow className="g-3">
                        <CCol md={3}>
                          <CFormLabel>Download Template</CFormLabel>
                          <div>
                            <ArpButton label="Download" icon="download" color="danger" type="button" onClick={onDownloadTemplate} />
                          </div>
                        </CCol>
                        <CCol md={6}>
                          <CFormLabel>Upload Template</CFormLabel>
                          <CFormInput
                            type="file"
                            accept=".xlsx,.xls"
                            disabled={!header.questionBankId}
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          />
                        </CCol>
                        <CCol md={3} className="d-flex align-items-end">
                          <ArpButton
                            label="Upload Questions"
                            icon="upload"
                            color="primary"
                            type="button"
                            disabled={!header.questionBankId}
                            onClick={onUploadTemplate}
                          />
                        </CCol>
                      </CRow>
                    </CCardBody>
                  </CCard>
                )}
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-2">
              <ArpButton label={saving ? 'Saving...' : 'Save Header'} icon="save" color="success" type="button" onClick={onSaveHeader} disabled={saving} />
              {header.questionBankId ? (
                <>
                  <ArpButton label="Complete" icon="save" color="primary" type="button" onClick={onComplete} />
                  <ArpButton label="Publish" icon="publish" color="danger" type="button" onClick={onPublish} />
                </>
              ) : null}
            </div>
          </CCardBody>
        </CCard>

        {sectionsPlan.length > 0 && preparationMode === 'EDITOR' && (
          <CCard className="mb-3">
            <CCardHeader><strong>Section-wise Question Entry</strong></CCardHeader>
            <CCardBody>
              <>
              {!header.questionBankId && (
                <CAlert color="warning" className="mb-3">
                  Save Header first to start editor question entry.
                </CAlert>
              )}
              <CAccordion activeItemKey={accordionActive} onChange={(k) => setAccordionActive(k)}>
                {sectionsPlan.map((section) => {
                  const ed = editors[section.sectionId] || defaultEditor
                  const questionNoOptions = Array.from({ length: Number(section.targetCount || 0) }, (_, i) => i + 1)
                  return (
                    <CAccordionItem itemKey={section.sectionId} key={section.sectionId}>
                      <CAccordionHeader
                        onClick={() => {
                          if (!header.questionBankId) return
                          loadSectionQuestions(section.sectionId)
                        }}
                      >
                        {section.sectionLabel} | Required: {section.requiredCount} | Target: {section.targetCount} | Marks: {section.markEach}
                      </CAccordionHeader>
                      <CAccordionBody>
                        <CRow className="g-3">
                          <CCol md={3}>
                            <CFormLabel>Choose Question Number</CFormLabel>
                            <CFormSelect
                              value={ed.questionNo || ''}
                              disabled={!header.questionBankId}
                              onChange={(e) => onSelectQuestionNo(section.sectionId, e.target.value)}
                            >
                              <option value="">Select</option>
                              {questionNoOptions.map((n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </CFormSelect>
                          </CCol>
                          <CCol md={2}>
                            <CFormLabel>Marks</CFormLabel>
                            <CFormInput value={section.markEach} disabled />
                          </CCol>
                          <CCol md={2}>
                            <CFormLabel>Unit</CFormLabel>
                            <CFormSelect
                              disabled={!header.questionBankId}
                              value={ed.unitNo || ''}
                              onChange={(e) => setEditor(section.sectionId, { unitNo: e.target.value })}
                            >
                              <option value="">Select Unit</option>
                              {(meta.units || []).map((u) => (
                                <option key={u.value} value={u.value}>{u.label}</option>
                              ))}
                            </CFormSelect>
                          </CCol>
                          <CCol md={2}>
                            <CFormLabel>Type</CFormLabel>
                            <CFormSelect
                              value={ed.questionType}
                              disabled={!header.questionBankId}
                              onChange={(e) => setEditor(section.sectionId, { questionType: e.target.value })}
                            >
                              <option value="DESCRIPTIVE">Descriptive</option>
                              <option value="MCQ">MCQ</option>
                            </CFormSelect>
                          </CCol>
                          <CCol md={3}>
                            <CFormLabel>Language</CFormLabel>
                            <CFormSelect
                              value={ed.languageCode || 'en'}
                              disabled={!header.questionBankId}
                              onChange={(e) => setEditor(section.sectionId, { languageCode: e.target.value })}
                            >
                              <option value="en">English</option>
                              <option value="ta">Tamil</option>
                              <option value="ml">Malayalam</option>
                              <option value="te">Telugu</option>
                              <option value="hi">Hindi</option>
                              <option value="kn">Kannada</option>
                            </CFormSelect>
                          </CCol>
                          <CCol md={12}>
                            <CFormLabel>Question (Editor)</CFormLabel>
                            <QuestionRichEditor
                              value={ed.questionHtml || ''}
                              onChange={(v) => setEditor(section.sectionId, { questionHtml: v })}
                              height={200}
                              disabled={!header.questionBankId}
                            />
                          </CCol>
                          <CCol md={12}>
                            <CFormLabel>Question LaTeX</CFormLabel>
                            <CFormInput
                              disabled={!header.questionBankId}
                              value={ed.questionLatex || ''}
                              onChange={(e) => setEditor(section.sectionId, { questionLatex: e.target.value })}
                            />
                          </CCol>
                          {ed.questionType === 'MCQ' ? (
                            <>
                              <CCol md={3}><CFormLabel>Option A</CFormLabel><CFormInput disabled={!header.questionBankId} value={ed.optionA || ''} onChange={(e) => setEditor(section.sectionId, { optionA: e.target.value })} /></CCol>
                              <CCol md={3}><CFormLabel>Option B</CFormLabel><CFormInput disabled={!header.questionBankId} value={ed.optionB || ''} onChange={(e) => setEditor(section.sectionId, { optionB: e.target.value })} /></CCol>
                              <CCol md={3}><CFormLabel>Option C</CFormLabel><CFormInput disabled={!header.questionBankId} value={ed.optionC || ''} onChange={(e) => setEditor(section.sectionId, { optionC: e.target.value })} /></CCol>
                              <CCol md={3}><CFormLabel>Option D</CFormLabel><CFormInput disabled={!header.questionBankId} value={ed.optionD || ''} onChange={(e) => setEditor(section.sectionId, { optionD: e.target.value })} /></CCol>
                              <CCol md={3}>
                                <CFormLabel>Correct</CFormLabel>
                                <CFormSelect disabled={!header.questionBankId} value={ed.correctOption || ''} onChange={(e) => setEditor(section.sectionId, { correctOption: e.target.value })}>
                                  <option value="">Select</option>
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                  <option value="D">D</option>
                                </CFormSelect>
                              </CCol>
                            </>
                          ) : null}
                          <CCol xs={12} className="d-flex justify-content-end">
                            <ArpButton
                              label="Add Question"
                              icon="add"
                              color="success"
                              type="button"
                              disabled={!header.questionBankId}
                              onClick={() => onSaveQuestion(section)}
                            />
                          </CCol>
                        </CRow>

                        <div className="mt-3">
                          <ArpDataTable
                            title={`${section.sectionLabel} Questions`}
                            rows={sectionRows[section.sectionId] || []}
                            rowKey="id"
                            columns={[
                              { key: 'questionNo', label: 'Question No', sortable: true, align: 'center', sortType: 'number', width: 120 },
                              { key: 'marks', label: 'Marks', sortable: true, align: 'center', sortType: 'number', width: 100 },
                              { key: 'unitNo', label: 'Unit', sortable: true, align: 'center', sortType: 'number', width: 90 },
                              {
                                key: 'preview',
                                label: 'Preview',
                                render: (r) => (r.questionText || r.questionHtml || '').replace(/<[^>]*>/g, '').slice(0, 140),
                              },
                            ]}
                            selection={{
                              type: 'radio',
                              selected: sectionSelection[section.sectionId] || '',
                              key: 'id',
                              onChange: (id) => setSectionSelection((p) => ({ ...p, [section.sectionId]: id })),
                            }}
                            headerActions={sectionActions(section.sectionId)}
                          />
                        </div>
                      </CAccordionBody>
                    </CAccordionItem>
                  )
                })}
              </CAccordion>
              </>
            </CCardBody>
          </CCard>
        )}

        <ArpDataTable
          title="Saved Question Banks"
          rows={banksRows}
          rowKey="questionBankId"
          loading={loading}
          columns={[
            { key: 'questionBankName', label: 'Question Bank Name', sortable: true },
            { key: 'examinationName', label: 'Examination', sortable: true },
            { key: 'status', label: 'Status', sortable: true, align: 'center', width: 120 },
            { key: 'completionText', label: 'Section Completion', sortable: false },
          ]}
          selection={{
            type: 'radio',
            selected: selectedBankRowId,
            key: 'questionBankId',
            onChange: (id) => setSelectedBankRowId(id),
          }}
          headerActions={
            <div className="d-flex gap-2">
              <ArpIconButton icon="view" color="purple" title="View" disabled={!selectedBankRowId} onClick={() => loadBankDetails(selectedBankRowId)} />
              <ArpIconButton icon="edit" color="info" title="Edit" disabled={!selectedBankRowId} onClick={() => loadBankDetails(selectedBankRowId)} />
              <ArpIconButton icon="delete" color="danger" title="Delete" disabled={!selectedBankRowId} onClick={onBankDelete} />
              <ArpIconButton icon="download" color="primary" title="Download XLSX" disabled={!selectedBankRowId} onClick={() => openBankDownload('xlsx')} />
              <ArpIconButton icon="download" color="info" title="Download Word" disabled={!selectedBankRowId} onClick={() => openBankDownload('doc')} />
              <ArpIconButton icon="download" color="warning" title="Download PDF" disabled={!selectedBankRowId} onClick={() => openBankDownload('pdf')} />
              <ArpIconButton
                icon="print"
                color="secondary"
                title="Print"
                disabled={!selectedBankRowId}
                onClick={() => {
                  const base = API_BASE || ''
                  window.open(`${base}/api/evaluation/question-bank/banks/${selectedBankRowId}/print`, '_blank')
                }}
              />
            </div>
          }
        />
      </CCol>
    </CRow>
  )
}

export default QuestionBank
