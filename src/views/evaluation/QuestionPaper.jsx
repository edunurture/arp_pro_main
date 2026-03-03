import React, { useEffect, useMemo, useState } from 'react'
import {
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CTooltip,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilArrowTop, cilArrowBottom, cilMinus } from '@coreui/icons'

import { ArpButton, ArpDataTable, ArpIconButton } from '../../components/common'
import api, { API_BASE } from '../../services/apiClient'

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const initialFilters = {
  programmeId: '',
  semester: '',
}

const initialPaperMeta = {
  paperId: '',
  questionPaperCode: '',
  examName: '',
  timeDuration: '',
  examSession: 'FORENOON',
  maximumMarks: '',
  paperSize: 'A4',
  registerNumber: '',
  showRegisterNumber: true,
  questionBankId: '',
  questionModelId: '',
}

const initialCompose = {
  sections: [],
  programmeCode: '',
  programmeName: '',
  batchYear: '',
  status: 'DRAFT',
}

const normalizeText = (v) => String(v ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

const ActionIconButton = ({ title, icon, color = 'secondary', disabled = false, onClick }) => (
  <CTooltip content={title} placement="top">
    <span className="d-inline-block">
      <CButton
        type="button"
        color={color}
        size="sm"
        className="rounded-circle d-inline-flex align-items-center justify-content-center text-white"
        style={{ width: 30, height: 30 }}
        disabled={disabled}
        onClick={onClick}
      >
        <CIcon icon={icon} size="sm" />
      </CButton>
    </span>
  </CTooltip>
)

const QuestionPaper = () => {
  const [toast, setToast] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const [institutionId, setInstitutionId] = useState('')
  const [programmes, setProgrammes] = useState([])

  const [filters, setFilters] = useState(initialFilters)
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)

  const [banks, setBanks] = useState([])
  const [examinationOptions, setExaminationOptions] = useState([])
  const [papers, setPapers] = useState([])
  const [selectedPaperId, setSelectedPaperId] = useState('')

  const [paperMeta, setPaperMeta] = useState(initialPaperMeta)
  const [compose, setCompose] = useState(initialCompose)

  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingCompose, setLoadingCompose] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewGate, setPreviewGate] = useState({})
  const [activeSectionKey, setActiveSectionKey] = useState('')

  const showToast = (color, message) => {
    setToast({ color, message })
    window.setTimeout(() => setToast(null), 4500)
  }

  const isLocked = useMemo(() => compose.status === 'LOCKED', [compose.status])

  const selectedBank = useMemo(
    () => banks.find((b) => String(b.id) === String(paperMeta.questionBankId)) || null,
    [banks, paperMeta.questionBankId],
  )

  const selectedPaperRow = useMemo(
    () => papers.find((p) => String(p.id) === String(selectedPaperId)) || null,
    [papers, selectedPaperId],
  )

  const setSectionSelectedIds = (sectionId, ids) => {
    setCompose((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((s) =>
        String(s.sectionId) === String(sectionId)
          ? { ...s, selectedQuestionIds: ids }
          : s,
      ),
    }))
  }

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/api/setup/institution')
      const list = unwrapList(res)
      setInstitutions(list)
      if (list.length && !institutionId) setInstitutionId(list[0].id)
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to load institutions')
    }
  }

  const loadProgrammes = async (instId) => {
    if (!instId) return setProgrammes([])
    try {
      const res = await api.get('/api/setup/programme')
      const list = unwrapList(res).filter((x) => String(x.institutionId) === String(instId))
      setProgrammes(list)
    } catch {
      setProgrammes([])
    }
  }

  const loadCourses = async () => {
    if (!institutionId) return
    setLoadingCourses(true)
    try {
      const res = await api.get('/api/evaluation/question-bank/courses', {
        params: {
          institutionId,
          programmeId: filters.programmeId || '',
          semester: filters.semester || '',
        },
      })
      setCourses(unwrapList(res))
      setSelectedCourse(null)
      setBanks([])
      setPapers([])
      setSelectedPaperId('')
      setPaperMeta(initialPaperMeta)
      setCompose(initialCompose)
    } catch (err) {
      setCourses([])
      showToast('danger', err?.response?.data?.error || 'Failed to load courses')
    } finally {
      setLoadingCourses(false)
    }
  }

  const loadBanks = async (courseOfferingId) => {
    if (!institutionId || !courseOfferingId) return
    try {
      const res = await api.get('/api/evaluation/question-bank', {
        params: { institutionId, courseOfferingId },
      })
      const list = unwrapList(res)
      setBanks(list)
      setPaperMeta((prev) => ({
        ...prev,
        questionBankId: list[0]?.id || '',
        questionModelId: list[0]?.questionModelId || '',
        examName: prev.examName || list[0]?.examName || '',
      }))
      return list
    } catch {
      setBanks([])
      setPaperMeta((prev) => ({ ...prev, questionBankId: '', questionModelId: '' }))
      return []
    }
  }

  const loadPapers = async (courseOfferingId) => {
    if (!institutionId || !courseOfferingId) return
    try {
      const res = await api.get('/api/evaluation/question-paper', {
        params: { institutionId, courseOfferingId },
      })
      setPapers(unwrapList(res))
      setSelectedPaperId('')
    } catch {
      setPapers([])
      setSelectedPaperId('')
    }
  }

  const loadExaminations = async (courseOfferingId) => {
    if (!institutionId || !courseOfferingId) {
      setExaminationOptions([])
      return []
    }
    try {
      const res = await api.get('/api/evaluation/question-bank/meta', {
        params: { institutionId, courseOfferingId },
      })
      const rows = Array.isArray(res?.data?.data?.examinations) ? res.data.data.examinations : []
      const mapped = rows
        .map((x) => String(x?.name || x?.id || '').trim())
        .filter(Boolean)
      setExaminationOptions([...new Set(mapped)])
      return mapped
    } catch {
      setExaminationOptions([])
      return []
    }
  }

  const loadModelSectionsFallback = async (questionModelId) => {
    if (!questionModelId) return []
    try {
      const res = await api.get(`/api/evaluation/question-bank/models/${questionModelId}/sections`)
      const rows = unwrapList(res)
      return rows.map((s) => ({
        sectionId: s.sectionId,
        sectionLabel: s.sectionLabel,
        nomenclature: String(s.sectionLabel || '').split(' - ')[0] || '',
        description: '',
        questionType: '',
        pattern: '',
        totalQuestions: Number(s.requiredCount || 0),
        markEach: Number(s.markEach || 0),
        maximumMarks: Number(s.requiredCount || 0) * Number(s.markEach || 0),
        availableQuestions: [],
        selectedQuestionIds: [],
      }))
    } catch {
      return []
    }
  }

  const loadComposeData = async ({ questionBankId = '', paperId = '', courseOfferingIdOverride = '' }) => {
    const effectiveCourseOfferingId = courseOfferingIdOverride || selectedCourse?.courseOfferingId
    if (!institutionId || !effectiveCourseOfferingId) return
    if (!questionBankId && !paperId) return
    const bankByArg = banks.find((b) => String(b.id) === String(questionBankId))

    setLoadingCompose(true)
    try {
      const res = await api.get('/api/evaluation/question-paper/compose-data', {
        params: {
          institutionId,
          courseOfferingId: effectiveCourseOfferingId,
          questionBankId: questionBankId || undefined,
          paperId: paperId || undefined,
        },
      })
      const data = res?.data?.data || {}
      const fallbackModelId = data.questionModelId || bankByArg?.questionModelId || selectedBank?.questionModelId || paperMeta.questionModelId || ''
      const resolvedSections =
        Array.isArray(data.sections) && data.sections.length
          ? data.sections
          : await loadModelSectionsFallback(fallbackModelId)
      setPaperMeta((prev) => ({
        ...prev,
        paperId: data.paperId || '',
        questionPaperCode: data.questionPaperCode || '',
        examName: data.examName || prev.examName || '',
        timeDuration: data.timeDuration || '',
        examSession: data.examSession || 'FORENOON',
        maximumMarks: data.maximumMarks || '',
        paperSize: data.paperSize || 'A4',
        registerNumber: data.registerNumber || '',
        showRegisterNumber: data.showRegisterNumber !== false,
        questionBankId: data.questionBankId || questionBankId || '',
        questionModelId: data.questionModelId || '',
      }))
      setCompose({
        sections: resolvedSections,
        programmeCode: data.programmeCode || '',
        programmeName: data.programmeName || '',
        batchYear: data.batchYear || '',
        status: data.status || 'DRAFT',
      })
      if (!resolvedSections.length) {
        showToast('warning', 'No sections came from Question Bank. Verify Question Model sections are configured.')
      }
    } catch (err) {
      const backendError = err?.response?.data?.error
      const backendDetails = err?.response?.data?.details
      const detailsText = typeof backendDetails === 'string' ? backendDetails : ''
      showToast('danger', `${backendError || 'Failed to load question bank sections'}${detailsText ? `: ${detailsText}` : ''}`)
      setCompose(initialCompose)
    } finally {
      setLoadingCompose(false)
    }
  }

  useEffect(() => {
    loadInstitutions()
  }, [])

  useEffect(() => {
    setFilters(initialFilters)
    setCourses([])
    setSelectedCourse(null)
    setBanks([])
    setPapers([])
    setSelectedPaperId('')
    setPaperMeta(initialPaperMeta)
    setCompose(initialCompose)
    loadProgrammes(institutionId)
  }, [institutionId])

  useEffect(() => {
    if ((compose.sections || []).length > 0) {
      setActiveSectionKey(String(compose.sections[0].sectionId))
    } else {
      setActiveSectionKey('')
    }
  }, [compose.sections])

  const onCourseSelected = async (course) => {
    setSelectedCourse(course)
    setPaperMeta(initialPaperMeta)
    setCompose(initialCompose)
    setSelectedPaperId('')
    setExaminationOptions([])
    const loadedBanks = (await loadBanks(course.courseOfferingId)) || []
    await loadExaminations(course.courseOfferingId)
    await loadPapers(course.courseOfferingId)
    if (loadedBanks[0]?.id) {
      await loadComposeData({ questionBankId: loadedBanks[0].id, courseOfferingIdOverride: course.courseOfferingId })
    }
  }

  const onBankChanged = async (bankId) => {
    const bank = banks.find((b) => String(b.id) === String(bankId))
    setPaperMeta((prev) => ({
      ...prev,
      paperId: '',
      questionBankId: bankId,
      questionModelId: bank?.questionModelId || '',
      examName: bank?.examName || prev.examName,
    }))
    setCompose(initialCompose)
    if (selectedCourse?.courseOfferingId) {
      await loadExaminations(selectedCourse.courseOfferingId)
    }
    if (bankId) await loadComposeData({ questionBankId: bankId })
  }

  const addQuestionToSection = (sectionId, questionId) => {
    if (isLocked) return
    setCompose((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((s) => {
        if (String(s.sectionId) !== String(sectionId)) return s
        const existing = Array.isArray(s.selectedQuestionIds) ? s.selectedQuestionIds : []
        if (existing.includes(questionId)) return s
        return { ...s, selectedQuestionIds: [...existing, questionId] }
      }),
    }))
  }

  const removeQuestionFromSection = (sectionId, questionId) => {
    if (isLocked) return
    setCompose((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((s) => {
        if (String(s.sectionId) !== String(sectionId)) return s
        const existing = Array.isArray(s.selectedQuestionIds) ? s.selectedQuestionIds : []
        return { ...s, selectedQuestionIds: existing.filter((x) => String(x) !== String(questionId)) }
      }),
    }))
  }

  const moveQuestion = (sectionId, questionId, direction) => {
    if (isLocked) return
    setCompose((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((s) => {
        if (String(s.sectionId) !== String(sectionId)) return s
        const arr = Array.isArray(s.selectedQuestionIds) ? [...s.selectedQuestionIds] : []
        const idx = arr.findIndex((x) => String(x) === String(questionId))
        if (idx < 0) return s
        const next = direction === 'up' ? idx - 1 : idx + 1
        if (next < 0 || next >= arr.length) return s
        const tmp = arr[idx]
        arr[idx] = arr[next]
        arr[next] = tmp
        return { ...s, selectedQuestionIds: arr }
      }),
    }))
  }

  const swapQuestion = (sectionId, sourceQuestionId, targetQuestionId) => {
    if (isLocked) return
    if (!sourceQuestionId || !targetQuestionId || String(sourceQuestionId) === String(targetQuestionId)) return
    setCompose((prev) => ({
      ...prev,
      sections: (prev.sections || []).map((s) => {
        if (String(s.sectionId) !== String(sectionId)) return s
        const arr = Array.isArray(s.selectedQuestionIds) ? [...s.selectedQuestionIds] : []
        const a = arr.findIndex((x) => String(x) === String(sourceQuestionId))
        const b = arr.findIndex((x) => String(x) === String(targetQuestionId))
        if (a < 0 || b < 0) return s
        const tmp = arr[a]
        arr[a] = arr[b]
        arr[b] = tmp
        return { ...s, selectedQuestionIds: arr }
      }),
    }))
  }

  const validateBeforeSave = () => {
    if (!institutionId) return 'Institution is required'
    if (!selectedCourse?.courseOfferingId) return 'Select one course'
    if (!paperMeta.questionBankId) return 'Question bank is required'
    if (!paperMeta.questionPaperCode) return 'Question paper code is required'
    if (!paperMeta.examName) return 'Exam name is required'
    if (!paperMeta.timeDuration) return 'Time duration is required'
    if (!paperMeta.examSession) return 'Session is required'
    if (!paperMeta.maximumMarks || Number(paperMeta.maximumMarks) <= 0) return 'Maximum marks is required'
    if (!paperMeta.paperSize) return 'Paper size is required'
    if (!compose.sections?.length) return 'No sections available to build paper'

    for (const s of compose.sections) {
      const selectedCount = (s.selectedQuestionIds || []).length
      const requiredCount = Number(s.totalQuestions || 0)
      if (selectedCount !== requiredCount) {
        return `${s.sectionLabel} requires ${requiredCount} questions, selected ${selectedCount}`
      }
      const isEitherOr = String(s.questionType || s.pattern || '').toUpperCase().replace(/\s+/g, '').includes('EITHEROR')
      if (isEitherOr && selectedCount % 2 !== 0) {
        return `${s.sectionLabel}: Either-Or section requires even count`
      }
    }

    return ''
  }

  const onSave = async () => {
    const err = validateBeforeSave()
    if (err) return showToast('danger', err)

    setSaving(true)
    try {
      const payload = {
        institutionId,
        paperId: paperMeta.paperId || undefined,
        courseOfferingId: selectedCourse.courseOfferingId,
        questionModelId: paperMeta.questionModelId || selectedBank?.questionModelId,
        questionBankId: paperMeta.questionBankId,
        questionPaperCode: paperMeta.questionPaperCode,
        examName: paperMeta.examName,
        timeDuration: paperMeta.timeDuration,
        examSession: paperMeta.examSession,
        maximumMarks: Number(paperMeta.maximumMarks),
        paperSize: paperMeta.paperSize,
        registerNumber: paperMeta.registerNumber,
        showRegisterNumber: paperMeta.showRegisterNumber !== false,
        sections: (compose.sections || []).map((s) => ({
          sectionId: s.sectionId,
          questionIds: s.selectedQuestionIds || [],
        })),
      }

      const res = await api.post('/api/evaluation/question-paper/save', payload)
      const savedId = res?.data?.data?.id
      if (savedId) {
        setPaperMeta((prev) => ({ ...prev, paperId: savedId }))
      }
      showToast('success', 'Question paper saved')
      await loadPapers(selectedCourse.courseOfferingId)
      if (savedId) setSelectedPaperId(savedId)
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to save question paper'
      const details = e?.response?.data?.details
      if (Array.isArray(details) && details.length) {
        const first = details[0]
        showToast('danger', `${msg}: ${first.section || first.sectionId} - ${first.error}`)
      } else {
        showToast('danger', msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const onFinalize = async () => {
    if (!paperMeta.paperId) return showToast('danger', 'Save paper before finalize')
    try {
      await api.post(`/api/evaluation/question-paper/${paperMeta.paperId}/finalize`)
      setCompose((prev) => ({ ...prev, status: 'LOCKED' }))
      showToast('success', 'Question paper finalized')
      await loadPapers(selectedCourse.courseOfferingId)
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to finalize question paper')
    }
  }

  const onPreview = () => {
    if (!paperMeta.paperId) return showToast('danger', 'Save paper before preview')
    const base = API_BASE || ''
    window.open(`${base}/api/evaluation/question-paper/${paperMeta.paperId}/preview`, '_blank')
    setPreviewGate((prev) => ({ ...prev, [paperMeta.paperId]: true }))
  }

  const onDownload = (paperId, format) => {
    const row = papers.find((x) => String(x.id) === String(paperId))
    const canDownload = previewGate[paperId] || !!row?.previewedAt
    if (!canDownload) {
      return showToast('warning', 'Preview is mandatory before download')
    }
    const base = API_BASE || ''
    const suffix = format === 'pdf' ? 'download.pdf' : format === 'doc' ? 'download.doc' : 'download.xlsx'
    window.open(`${base}/api/evaluation/question-paper/${paperId}/${suffix}`, '_blank')
  }

  const onDeletePaper = async (paperId) => {
    if (!paperId) return
    const ok = window.confirm('Delete selected question paper?')
    if (!ok) return
    try {
      await api.delete(`/api/evaluation/question-paper/${paperId}`)
      showToast('success', 'Question paper deleted')
      await loadPapers(selectedCourse.courseOfferingId)
      if (String(paperMeta.paperId) === String(paperId)) {
        setPaperMeta(initialPaperMeta)
        setCompose(initialCompose)
      }
      setSelectedPaperId('')
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to delete question paper')
    }
  }

  const onEditSavedPaper = async (paperId) => {
    const row = papers.find((x) => String(x.id) === String(paperId))
    if (!row) return
    setPaperMeta((prev) => ({
      ...prev,
      paperId: row.id,
      questionPaperCode: row.questionPaperCode || '',
      examName: row.examName || '',
      timeDuration: row.timeDuration || '',
      examSession: row.examSession || 'FORENOON',
      maximumMarks: row.maximumMarks || '',
      paperSize: row.paperSize || 'A4',
      registerNumber: row.registerNumber || '',
      showRegisterNumber: row.showRegisterNumber !== false,
      questionBankId: row.questionBankId || prev.questionBankId,
      questionModelId: row.questionModelId || prev.questionModelId,
    }))
    await loadComposeData({ paperId: row.id })
    setSelectedPaperId(row.id)
  }

  const sectionSelectedRows = (section) => {
    const selected = section.selectedQuestionIds || []
    const map = new Map((section.availableQuestions || []).map((q) => [String(q.id), q]))
    return selected.map((id) => ({ id, ...(map.get(String(id)) || { id, questionText: 'Question not found' }) }))
  }

  return (
    <CRow>
      <CCol xs={12}>
        {toast && <CAlert color={toast.color}>{toast.message}</CAlert>}

        <CCard className="mb-3">
          <CCardHeader><strong>Question Paper Scope</strong></CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={4}>
                <CFormLabel>Institution</CFormLabel>
                <CFormSelect value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
                  <option value="">Select</option>
                  {institutions.map((x) => (
                    <option key={x.id} value={x.id}>{x.name}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>Programme</CFormLabel>
                <CFormSelect value={filters.programmeId} onChange={(e) => setFilters((p) => ({ ...p, programmeId: e.target.value }))}>
                  <option value="">All</option>
                  {programmes.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.programmeCode} - {x.programmeName}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormLabel>Semester</CFormLabel>
                <CFormSelect value={filters.semester} onChange={(e) => setFilters((p) => ({ ...p, semester: e.target.value }))}>
                  <option value="">All</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={2} className="d-flex align-items-end">
                <ArpButton label={loadingCourses ? 'Loading...' : 'Search'} icon="search" color="primary" type="button" onClick={loadCourses} />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        {courses.length > 0 && (
          <CCard className="mb-3">
            <CCardHeader><strong>Course Selection</strong></CCardHeader>
            <CCardBody>
              <CTable hover responsive>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Programme</CTableHeaderCell>
                    <CTableHeaderCell>Semester</CTableHeaderCell>
                    <CTableHeaderCell>Course</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {courses.map((r) => (
                    <CTableRow key={r.courseOfferingId}>
                      <CTableDataCell>
                        <input
                          type="radio"
                          name="qpCourse"
                          checked={selectedCourse?.courseOfferingId === r.courseOfferingId}
                          onChange={() => onCourseSelected(r)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{r.programmeCode} - {r.programmeName}</CTableDataCell>
                      <CTableDataCell>{r.semester}</CTableDataCell>
                      <CTableDataCell>{r.courseCode} - {r.courseName}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {selectedCourse && (
          <CCard className="mb-3">
            <CCardHeader><strong>Question Paper Details</strong></CCardHeader>
            <CCardBody>
              <CForm>
                <CRow className="g-3">
                  <CCol md={4}>
                    <CFormLabel>Choose QP from Question Bank</CFormLabel>
                    <CFormSelect value={paperMeta.questionBankId} onChange={(e) => onBankChanged(e.target.value)} disabled={isLocked}>
                      <option value="">Select</option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.questionBankCode} - {b.examName} ({b.questionCount} questions)
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Question Paper Code</CFormLabel>
                    <CFormInput value={paperMeta.questionPaperCode} onChange={(e) => setPaperMeta((p) => ({ ...p, questionPaperCode: e.target.value }))} disabled={isLocked} />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Name of Examination</CFormLabel>
                    <CFormSelect
                      value={paperMeta.examName}
                      onChange={(e) => setPaperMeta((p) => ({ ...p, examName: e.target.value }))}
                      disabled={isLocked}
                    >
                      <option value="">Select</option>
                      {examinationOptions.map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                      {paperMeta.examName && !examinationOptions.includes(paperMeta.examName) ? (
                        <option value={paperMeta.examName}>{paperMeta.examName}</option>
                      ) : null}
                    </CFormSelect>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Time Duration</CFormLabel>
                    <CFormInput value={paperMeta.timeDuration} onChange={(e) => setPaperMeta((p) => ({ ...p, timeDuration: e.target.value }))} disabled={isLocked} />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Session</CFormLabel>
                    <CFormSelect value={paperMeta.examSession} onChange={(e) => setPaperMeta((p) => ({ ...p, examSession: e.target.value }))} disabled={isLocked}>
                      <option value="FORENOON">Fore Noon</option>
                      <option value="AFTERNOON">Afternoon</option>
                    </CFormSelect>
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Maximum Marks</CFormLabel>
                    <CFormInput type="number" min={1} value={paperMeta.maximumMarks} onChange={(e) => setPaperMeta((p) => ({ ...p, maximumMarks: e.target.value }))} disabled={isLocked} />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Question Paper Size</CFormLabel>
                    <CFormSelect value={paperMeta.paperSize} onChange={(e) => setPaperMeta((p) => ({ ...p, paperSize: e.target.value }))} disabled={isLocked}>
                      {['A2', 'A3', 'A4', 'A5', 'Legal', 'Letter'].map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={8}>
                    <CFormLabel>Register Number</CFormLabel>
                    <CFormInput value={paperMeta.registerNumber} onChange={(e) => setPaperMeta((p) => ({ ...p, registerNumber: e.target.value }))} disabled={isLocked} />
                  </CCol>
                  <CCol md={4} className="d-flex align-items-end">
                    <CFormCheck
                      id="showRegisterNo"
                      label="Display Register Number in Paper"
                      checked={paperMeta.showRegisterNumber !== false}
                      onChange={(e) => setPaperMeta((p) => ({ ...p, showRegisterNumber: e.target.checked }))}
                      disabled={isLocked}
                    />
                  </CCol>
                </CRow>

              </CForm>
            </CCardBody>
          </CCard>
        )}

        {selectedCourse && (compose.sections || []).length > 0 && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Section-wise Question Paper Assembly</strong>
              <div className="d-flex gap-2">
                {!isLocked && (
                  <ArpButton
                    label={saving ? 'Saving...' : 'Save'}
                    icon="save"
                    color="success"
                    type="button"
                    disabled={saving || loadingCompose}
                    onClick={onSave}
                  />
                )}
                {!isLocked && (
                  <ArpButton
                    label="Finalize"
                    icon="submit"
                    color="danger"
                    type="button"
                    disabled={!paperMeta.paperId}
                    onClick={onFinalize}
                  />
                )}
                <ArpButton
                  label="Preview"
                  icon="view"
                  color="primary"
                  type="button"
                  disabled={!paperMeta.paperId}
                  onClick={onPreview}
                />
              </div>
            </CCardHeader>
            <CCardBody>
              {loadingCompose ? (
                <div>Loading sections...</div>
              ) : (
                <CAccordion activeItemKey={activeSectionKey} onChange={(k) => setActiveSectionKey(String(k || ''))}>
                  {(compose.sections || []).map((section) => {
                    const selectedRows = sectionSelectedRows(section)
                    return (
                      <CAccordionItem itemKey={String(section.sectionId)} key={section.sectionId}>
                        <CAccordionHeader>
                          <div className="d-flex flex-wrap align-items-center gap-3">
                            <strong>{section.sectionLabel}</strong>
                            <span className="small text-body-secondary">Type: {section.questionType || '-'}</span>
                            <span className="small text-body-secondary">Required: {section.totalQuestions}</span>
                            <span className="small text-body-secondary">Selected: {(section.selectedQuestionIds || []).length}</span>
                            <span className="small text-body-secondary">Marks each: {section.markEach}</span>
                          </div>
                        </CAccordionHeader>
                        <CAccordionBody>
                          <CRow className="g-3">
                            <CCol md={6}>
                              <h6>Question Bank (Section)</h6>
                              <CTable bordered hover responsive>
                                <CTableHead color="light">
                                  <CTableRow>
                                    <CTableHeaderCell style={{ width: 90 }}>No</CTableHeaderCell>
                                    <CTableHeaderCell>Question</CTableHeaderCell>
                                    <CTableHeaderCell style={{ width: 80 }}>Marks</CTableHeaderCell>
                                    <CTableHeaderCell style={{ width: 70 }}>Add</CTableHeaderCell>
                                  </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                  {(section.availableQuestions || []).map((q) => {
                                    const already = (section.selectedQuestionIds || []).includes(q.id)
                                    return (
                                      <CTableRow key={q.id}>
                                        <CTableDataCell>{q.questionNo || '-'}</CTableDataCell>
                                        <CTableDataCell title={normalizeText(q.questionText || q.questionHtml || '')}>
                                          {normalizeText(q.questionText || q.questionHtml || '').slice(0, 120)}
                                        </CTableDataCell>
                                        <CTableDataCell className="text-center">{q.marks}</CTableDataCell>
                                        <CTableDataCell className="text-center">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            disabled={isLocked || already || (section.selectedQuestionIds || []).length >= Number(section.totalQuestions || 0)}
                                            onClick={() => addQuestionToSection(section.sectionId, q.id)}
                                          >
                                            +
                                          </button>
                                        </CTableDataCell>
                                      </CTableRow>
                                    )
                                  })}
                                </CTableBody>
                              </CTable>
                            </CCol>

                            <CCol md={6}>
                              <h6>Question Paper (Flexible Mode)</h6>
                              <CTable bordered hover responsive>
                                <CTableHead color="light">
                                  <CTableRow>
                                    <CTableHeaderCell style={{ width: 70 }}>Order</CTableHeaderCell>
                                    <CTableHeaderCell>Question</CTableHeaderCell>
                                    <CTableHeaderCell style={{ width: 200 }}>Actions</CTableHeaderCell>
                                  </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                  {selectedRows.map((q, idx) => (
                                    <CTableRow key={`${section.sectionId}_${q.id}`}>
                                      <CTableDataCell>{idx + 1}</CTableDataCell>
                                      <CTableDataCell title={normalizeText(q.questionText || q.questionHtml || '')}>
                                        {normalizeText(q.questionText || q.questionHtml || '').slice(0, 120)}
                                      </CTableDataCell>
                                      <CTableDataCell>
                                        <div className="d-flex gap-1 align-items-center">
                                          <ActionIconButton
                                            title="Move Up"
                                            icon={cilArrowTop}
                                            color="success"
                                            disabled={isLocked || idx === 0}
                                            onClick={() => moveQuestion(section.sectionId, q.id, 'up')}
                                          />
                                          <ActionIconButton
                                            title="Move Down"
                                            icon={cilArrowBottom}
                                            color="info"
                                            disabled={isLocked || idx === selectedRows.length - 1}
                                            onClick={() => moveQuestion(section.sectionId, q.id, 'down')}
                                          />
                                          <ActionIconButton
                                            title="Delete"
                                            icon={cilMinus}
                                            color="danger"
                                            disabled={isLocked}
                                            onClick={() => removeQuestionFromSection(section.sectionId, q.id)}
                                          />
                                        </div>
                                        <div className="d-flex gap-1 mt-1">
                                          <CFormSelect
                                            size="sm"
                                            value=""
                                            onChange={(e) => {
                                              if (!e.target.value) return
                                              swapQuestion(section.sectionId, q.id, e.target.value)
                                              e.target.value = ''
                                            }}
                                            disabled={isLocked || selectedRows.length < 2}
                                          >
                                            <option value="">Swap With</option>
                                            {selectedRows
                                              .filter((x) => String(x.id) !== String(q.id))
                                              .map((x, j) => (
                                                <option key={x.id} value={x.id}>Position {j + 1}</option>
                                              ))}
                                          </CFormSelect>
                                        </div>
                                      </CTableDataCell>
                                    </CTableRow>
                                  ))}
                                  {!selectedRows.length && (
                                    <CTableRow>
                                      <CTableDataCell colSpan={3} className="text-center">No questions selected for this section.</CTableDataCell>
                                    </CTableRow>
                                  )}
                                </CTableBody>
                              </CTable>
                            </CCol>
                          </CRow>
                        </CAccordionBody>
                      </CAccordionItem>
                    )
                  })}
                </CAccordion>
              )}
            </CCardBody>
          </CCard>
        )}

        {selectedCourse && (
          <ArpDataTable
            title="Saved Question Papers (ArpDataTable)"
            rows={papers}
            rowKey="id"
            columns={[
              { key: 'questionPaperCode', label: 'Paper Code', sortable: true },
              { key: 'examName', label: 'Exam Name', sortable: true },
              { key: 'status', label: 'Status', sortable: true, align: 'center', width: 110 },
              { key: 'questionCount', label: 'Questions', sortable: true, align: 'center', sortType: 'number', width: 110 },
              { key: 'paperSize', label: 'Size', sortable: true, align: 'center', width: 100 },
              { key: 'timeDuration', label: 'Duration', sortable: true, align: 'center', width: 120 },
            ]}
            selection={{
              type: 'radio',
              selected: selectedPaperId,
              key: 'id',
              onChange: (id) => setSelectedPaperId(id),
            }}
            headerActions={
              <div className="d-flex gap-2">
                <ArpIconButton
                  icon="view"
                  color="purple"
                  title="View"
                  disabled={!selectedPaperId}
                  onClick={() => onEditSavedPaper(selectedPaperId)}
                />
                <ArpIconButton
                  icon="edit"
                  color="info"
                  title="Edit"
                  disabled={!selectedPaperId}
                  onClick={() => onEditSavedPaper(selectedPaperId)}
                />
                <ArpIconButton
                  icon="download"
                  color="primary"
                  title="Download XLSX"
                  disabled={!selectedPaperId}
                  onClick={() => onDownload(selectedPaperId, 'xlsx')}
                />
                <ArpIconButton
                  icon="download"
                  color="info"
                  title="Download DOC"
                  disabled={!selectedPaperId}
                  onClick={() => onDownload(selectedPaperId, 'doc')}
                />
                <ArpIconButton
                  icon="download"
                  color="warning"
                  title="Download PDF"
                  disabled={!selectedPaperId}
                  onClick={() => onDownload(selectedPaperId, 'pdf')}
                />
                <ArpIconButton
                  icon="delete"
                  color="danger"
                  title="Delete"
                  disabled={!selectedPaperId || selectedPaperRow?.status === 'LOCKED'}
                  onClick={() => onDeletePaper(selectedPaperId)}
                />
              </div>
            }
          />
        )}
      </CCol>
    </CRow>
  )
}

export default QuestionPaper
