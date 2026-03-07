import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CRow,
} from '@coreui/react-pro'

import { ArpButton, ArpToastStack } from '../../components/common'
import api from '../../services/apiClient'
import { IA_PHASE_KEYS, getIAWorkflowPhase, saveIAWorkflowPhase } from '../../services/iaWorkflowService'
import IAWorkflowScopeBanner from './IAWorkflowScopeBanner'

const DRAFT_KEY = 'arp.evaluation.ia.phase1.setup.draft.v1'

const initialForm = {
  institutionId: '',
  academicYearId: '',
  semesterCategory: '',
  chosenSemester: '',
  scopeMode: 'SINGLE',
  programmeId: '',
  programmeIds: [],
  programmeScopeKey: '',
  examName: '',
  iaCycle: '',
  examWindowName: '',
  examMonthYear: '',
  windowStartDate: '',
  windowEndDate: '',
  slotDurationMinutes: '',
  fnStartTime: '09:00',
  anStartTime: '13:30',
  courseSelectionMode: 'all',
  instructions: '',
  ruleNoStudentClash: true,
  ruleNoFacultyClash: true,
  ruleMinGapEnabled: true,
  minGapHours: '24',
  status: 'DRAFT',
}

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const requiredFieldLabels = {
  institutionId: 'Institution',
  academicYearId: 'Academic Year',
  chosenSemester: 'Chosen Semester',
  iaCycle: 'Name of the Examination',
  examWindowName: 'Exam Window Name',
  examMonthYear: 'Exam Month & Year',
  windowStartDate: 'Window Start Date',
  windowEndDate: 'Window End Date',
  slotDurationMinutes: 'Slot Duration',
  fnStartTime: 'FN Start Time',
  anStartTime: 'AN Start Time',
}

const IASetupPhase1 = () => {
  const [form, setForm] = useState(initialForm)
  const [institutions, setInstitutions] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [examNameOptions, setExamNameOptions] = useState([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const programmeScrollRef = useRef(null)

  const showToast = (type, message) => {
    setToast({
      type,
      message,
      autohide: type === 'success',
      delay: 4500,
    })
  }

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }
  const buildProgrammeScopeKey = (scopeMode, programmeId, programmeIds) => {
    if (scopeMode === 'ALL') return '__ALL__'
    if (scopeMode === 'MULTIPLE') {
      const ids = [...new Set((programmeIds || []).map((x) => String(x).trim()).filter(Boolean))].sort()
      if (ids.length === 0) return ''
      return `__MULTI__:${ids.join(',')}`
    }
    return String(programmeId || '').trim()
  }

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/api/setup/institution')
      const list = unwrapList(res)
      setInstitutions(list)
      if (!form.institutionId && list.length > 0) {
        setField('institutionId', String(list[0].id))
      }
    } catch {
      setInstitutions([])
    }
  }

  const loadAcademicYears = async (institutionId) => {
    if (!institutionId) return setAcademicYears([])
    try {
      const res = await api.get('/api/setup/academic-year', {
        headers: { 'x-institution-id': institutionId },
      })
      setAcademicYears(unwrapList(res))
    } catch {
      setAcademicYears([])
    }
  }

  const loadProgrammes = async (institutionId) => {
    if (!institutionId) return setProgrammes([])
    try {
      const res = await api.get('/api/setup/programme')
      const list = unwrapList(res).filter((x) => String(x.institutionId) === String(institutionId))
      setProgrammes(list)
    } catch {
      setProgrammes([])
    }
  }

  const loadExamNames = async (institutionId) => {
    if (!institutionId) return setExamNameOptions([])
    try {
      const res = await api.get('/api/setup/cia-components', {
        params: { institutionId },
      })
      const rows = Array.isArray(res?.data?.data?.components) ? res.data.data.components : []
      const opts = [...new Set(rows.map((x) => String(x?.examName || '').trim()).filter(Boolean))]
      setExamNameOptions(opts)
    } catch {
      setExamNameOptions([])
    }
  }

  useEffect(() => {
    const saved = window.sessionStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setForm((prev) => ({ ...prev, ...parsed }))
      } catch {
        // Ignore invalid draft payload.
      }
    }
    ;(async () => {
      try {
        const remote = await getIAWorkflowPhase(IA_PHASE_KEYS.PHASE_1_SETUP, {})
        if (remote?.payload && typeof remote.payload === 'object') {
          setForm((prev) => ({
            ...prev,
            ...remote.payload,
            scopeMode: remote.payload?.scopeMode || 'SINGLE',
            programmeIds: Array.isArray(remote.payload?.programmeIds)
              ? remote.payload.programmeIds
              : [],
            programmeScopeKey:
              remote.payload?.programmeScopeKey || remote.programmeId || prev.programmeScopeKey,
            programmeId:
              remote.payload?.programmeId || remote.programmeId || prev.programmeId,
            examName: remote.payload?.examName || remote.payload?.iaCycle || prev.examName,
            iaCycle: remote.payload?.iaCycle || remote.payload?.examName || prev.iaCycle,
            status: remote.workflowStatus || remote.payload.status || prev.status,
          }))
        }
      } catch {
        // Keep session/local state as fallback.
      }
    })()
    loadInstitutions()
  }, [])

  useEffect(() => {
    if (!form.institutionId) return
    loadAcademicYears(form.institutionId)
    loadProgrammes(form.institutionId)
    loadExamNames(form.institutionId)
  }, [form.institutionId])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(form.academicYearId)) || null,
    [academicYears, form.academicYearId],
  )

  const chosenSemesterOptions = useMemo(() => {
    if (!selectedAcademicYear) return []
    const fromChosen = Array.isArray(selectedAcademicYear?.chosenSemesters)
      ? selectedAcademicYear.chosenSemesters
      : typeof selectedAcademicYear?.chosenSemesters === 'string'
        ? selectedAcademicYear.chosenSemesters.split(',')
        : []
    return [...new Set(
      fromChosen.map((v) => Number(String(v).trim())).filter((n) => Number.isFinite(n) && n > 0),
    )].sort((a, b) => a - b)
  }, [selectedAcademicYear])

  useEffect(() => {
    const semesterCategory = String(selectedAcademicYear?.semesterCategory || '').toUpperCase()
    setForm((prev) => {
      const hasSemester = chosenSemesterOptions.some((s) => String(s) === String(prev.chosenSemester))
      return {
        ...prev,
        semesterCategory,
        chosenSemester: hasSemester ? prev.chosenSemester : '',
      }
    })
  }, [selectedAcademicYear, chosenSemesterOptions])

  const validationErrors = useMemo(() => {
    const errors = []
    Object.keys(requiredFieldLabels).forEach((key) => {
      if (!String(form[key] || '').trim()) errors.push(requiredFieldLabels[key])
    })
    if (form.scopeMode === 'SINGLE' && !String(form.programmeId || '').trim()) {
      errors.push('Programme')
    }
    if (form.scopeMode === 'MULTIPLE' && (!Array.isArray(form.programmeIds) || form.programmeIds.length === 0)) {
      errors.push('At least one Programme (Multiple mode)')
    }
    if (form.windowStartDate && form.windowEndDate && form.windowEndDate < form.windowStartDate) {
      errors.push('Window End Date must be after Window Start Date')
    }
    const slotHours = Number(form.slotDurationMinutes)
    if (!Number.isFinite(slotHours) || slotHours <= 0) {
      errors.push('Slot Duration should be greater than 0 hour')
    }
    if (form.ruleMinGapEnabled) {
      const minGap = Number(form.minGapHours)
      if (!Number.isFinite(minGap) || minGap <= 0) errors.push('Minimum Gap (Hours) should be greater than 0')
    }
    return errors
  }, [form])

  const completion = useMemo(() => {
    const requiredKeys = Object.keys(requiredFieldLabels)
    const done = requiredKeys.filter((key) => String(form[key] || '').trim()).length
    return Math.round((done / requiredKeys.length) * 100)
  }, [form])

  const onSaveDraft = async () => {
    setSaving(true)
    try {
      const programmeScopeKey = buildProgrammeScopeKey(form.scopeMode, form.programmeId, form.programmeIds)
      const updatedAt = new Date().toISOString()
      const institutionName =
        institutions.find((x) => String(x.id) === String(form.institutionId))?.name || ''
      const academicYearLabel =
        academicYears.find((x) => String(x.id) === String(form.academicYearId))?.academicYear ||
        academicYears.find((x) => String(x.id) === String(form.academicYearId))?.academicYearName ||
        ''
      const payload = {
        ...form,
        programmeScopeKey,
        examName: form.examName || form.iaCycle,
        iaCycle: form.iaCycle || form.examName,
        institutionName,
        academicYearLabel,
        workflowScope: {
          institutionId: form.institutionId,
          institutionName,
          academicYearId: form.academicYearId,
          academicYearLabel,
          semesterCategory: form.semesterCategory,
          chosenSemester: form.chosenSemester,
          examWindowName: form.examWindowName,
          programmeId: programmeScopeKey,
          examName: form.examName || form.iaCycle,
          iaCycle: form.iaCycle || form.examName,
        },
        status: 'DRAFT',
        versionNo: '1',
        updatedAt,
      }
      window.sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(payload),
      )
      setField('status', 'DRAFT')
      try {
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_1_SETUP, {
          institutionId: form.institutionId,
          academicYearId: form.academicYearId,
          chosenSemester: form.chosenSemester,
          programmeId: programmeScopeKey,
          examName: form.examName || form.iaCycle,
          iaCycle: form.iaCycle,
          workflowStatus: 'DRAFT',
          versionNo: 1,
          payload,
        })
      } catch {
        // Local draft remains available even when API save fails.
      }
      showToast('success', 'Phase 1 draft saved.')
    } finally {
      setSaving(false)
    }
  }

  const onSubmitPhase = async () => {
    if (validationErrors.length > 0) {
      showToast('danger', `Please complete required fields: ${validationErrors[0]}`)
      return
    }
    setSaving(true)
    try {
      const programmeScopeKey = buildProgrammeScopeKey(form.scopeMode, form.programmeId, form.programmeIds)
      const updatedAt = new Date().toISOString()
      const institutionName =
        institutions.find((x) => String(x.id) === String(form.institutionId))?.name || ''
      const academicYearLabel =
        academicYears.find((x) => String(x.id) === String(form.academicYearId))?.academicYear ||
        academicYears.find((x) => String(x.id) === String(form.academicYearId))?.academicYearName ||
        ''
      const payload = {
        ...form,
        programmeScopeKey,
        examName: form.examName || form.iaCycle,
        iaCycle: form.iaCycle || form.examName,
        institutionName,
        academicYearLabel,
        workflowScope: {
          institutionId: form.institutionId,
          institutionName,
          academicYearId: form.academicYearId,
          academicYearLabel,
          semesterCategory: form.semesterCategory,
          chosenSemester: form.chosenSemester,
          examWindowName: form.examWindowName,
          programmeId: programmeScopeKey,
          examName: form.examName || form.iaCycle,
          iaCycle: form.iaCycle || form.examName,
        },
        status: 'READY_FOR_PHASE_2',
        versionNo: '1',
        updatedAt,
      }
      window.sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(payload),
      )
      setField('status', 'READY_FOR_PHASE_2')
      try {
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_1_SETUP, {
          institutionId: form.institutionId,
          academicYearId: form.academicYearId,
          chosenSemester: form.chosenSemester,
          programmeId: programmeScopeKey,
          examName: form.examName || form.iaCycle,
          iaCycle: form.iaCycle,
          workflowStatus: 'READY_FOR_PHASE_2',
          versionNo: 1,
          payload,
        })
      } catch {
        // Local submit state remains available even when API save fails.
      }
      showToast('success', 'Phase 1 completed. Ready for Phase 2 schedule planning.')
    } finally {
      setSaving(false)
    }
  }

  const onReset = () => {
    window.sessionStorage.removeItem(DRAFT_KEY)
    setForm(initialForm)
    showToast('warning', 'Draft cleared.')
  }

  return (
    <CRow>
      <CCol xs={12}>
        <ArpToastStack toast={toast} onClose={() => setToast(null)} />
        <IAWorkflowScopeBanner scope={form} />

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT - PHASE 1 SETUP</strong>
            <div className="d-flex align-items-center gap-2">
              <CBadge color={form.status === 'READY_FOR_PHASE_2' ? 'success' : 'secondary'}>
                {form.status === 'READY_FOR_PHASE_2' ? 'READY FOR PHASE 2' : 'DRAFT'}
              </CBadge>
              <CBadge color={completion === 100 ? 'success' : 'warning'}>
                Completion: {completion}%
              </CBadge>
            </div>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={2}><CFormLabel>Institution *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={form.institutionId}
                    onChange={(e) => {
                      const institutionId = e.target.value
                      setForm((prev) => ({
                        ...prev,
                        institutionId,
                        academicYearId: '',
                        semesterCategory: '',
                        chosenSemester: '',
                        scopeMode: 'SINGLE',
                        programmeId: '',
                        programmeIds: [],
                        programmeScopeKey: '',
                        examName: '',
                        iaCycle: '',
                      }))
                    }}
                  >
                    <option value="">Select Institution</option>
                    {institutions.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Academic Year *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={form.academicYearId}
                    onChange={(e) => setField('academicYearId', e.target.value)}
                    disabled={!form.institutionId}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.academicYearLabel || x.academicYear || x.id}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Semester Category</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput value={form.semesterCategory || '-'} disabled />
                </CCol>

                <CCol md={2}><CFormLabel>Choose Semester *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={form.chosenSemester}
                    onChange={(e) => setField('chosenSemester', e.target.value)}
                    disabled={!form.academicYearId}
                  >
                    <option value="">Choose Semester</option>
                    {chosenSemesterOptions.map((x) => (
                      <option key={x} value={String(x)}>
                        {x}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Programme Scope *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={form.scopeMode}
                    disabled={!form.institutionId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        scopeMode: e.target.value,
                        programmeId: '',
                        programmeIds: [],
                        programmeScopeKey: '',
                      }))
                    }
                  >
                    <option value="SINGLE">Single Programme</option>
                    <option value="MULTIPLE">Multiple Programmes</option>
                    <option value="ALL">All Programmes</option>
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Programme *</CFormLabel></CCol>
                <CCol md={4}>
                  {form.scopeMode === 'SINGLE' ? (
                    <CFormSelect
                      value={form.programmeId}
                      onChange={(e) => setField('programmeId', e.target.value)}
                      disabled={!form.institutionId}
                    >
                      <option value="">Select Programme</option>
                      {programmes.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.programmeCode} - {x.programmeName}
                        </option>
                      ))}
                    </CFormSelect>
                  ) : null}
                  {form.scopeMode === 'MULTIPLE' ? (
                    <div
                      ref={programmeScrollRef}
                      className="border rounded p-2"
                      style={{ maxHeight: 160, overflowY: 'auto' }}
                    >
                      {programmes.length === 0 ? (
                        <div className="text-muted small">No programmes found</div>
                      ) : (
                        programmes.map((x) => (
                          <CFormCheck
                            key={x.id}
                            type="checkbox"
                            className="mb-1"
                            label={`${x.programmeCode} - ${x.programmeName}`}
                            checked={Array.isArray(form.programmeIds) && form.programmeIds.includes(x.id)}
                            onChange={(e) => {
                              const scrollTop = programmeScrollRef.current
                                ? programmeScrollRef.current.scrollTop
                                : 0
                              setForm((prev) => {
                                const current = Array.isArray(prev.programmeIds) ? prev.programmeIds : []
                                const next = e.target.checked
                                  ? [...new Set([...current, x.id])]
                                  : current.filter((id) => String(id) !== String(x.id))
                                return { ...prev, programmeIds: next }
                              })
                              window.requestAnimationFrame(() => {
                                if (programmeScrollRef.current) {
                                  programmeScrollRef.current.scrollTop = scrollTop
                                }
                              })
                            }}
                          />
                        ))
                      )}
                    </div>
                  ) : null}
                  {form.scopeMode === 'ALL' ? (
                    <CFormInput value={`All Programmes (${programmes.length})`} disabled />
                  ) : null}
                </CCol>

                <CCol md={2}><CFormLabel>Name of the Examination *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={form.iaCycle}
                    disabled={!form.institutionId}
                    onChange={(e) => {
                      setField('iaCycle', e.target.value)
                      setField('examName', e.target.value)
                    }}
                  >
                    <option value="">Select Name of the Examination</option>
                    {examNameOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Exam Window Name *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    value={form.examWindowName}
                    onChange={(e) => setField('examWindowName', e.target.value)}
                    placeholder="Example: IA 1 - April 2026"
                  />
                </CCol>

                <CCol md={2}><CFormLabel>Exam Month & Year *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="month"
                    value={form.examMonthYear}
                    onChange={(e) => setField('examMonthYear', e.target.value)}
                  />
                </CCol>

                <CCol md={2}><CFormLabel>Window Start Date *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="date"
                    value={form.windowStartDate}
                    onChange={(e) => setField('windowStartDate', e.target.value)}
                  />
                </CCol>

                <CCol md={2}><CFormLabel>Window End Date *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="date"
                    value={form.windowEndDate}
                    onChange={(e) => setField('windowEndDate', e.target.value)}
                  />
                </CCol>

                <CCol md={2}><CFormLabel>Slot Duration (Hours) *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="text"
                    inputMode="numeric"
                    value={form.slotDurationMinutes}
                    onChange={(e) => setField('slotDurationMinutes', String(e.target.value || '').replace(/\D/g, ''))}
                    placeholder="Enter duration in hour(s)"
                  />
                </CCol>

                <CCol md={2}><CFormLabel>FN Start Time *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="time"
                    value={form.fnStartTime}
                    onChange={(e) => setField('fnStartTime', e.target.value)}
                  />
                </CCol>

                <CCol md={2}><CFormLabel>AN Start Time *</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="time"
                    value={form.anStartTime}
                    onChange={(e) => setField('anStartTime', e.target.value)}
                  />
                </CCol>

                <CCol md={2}><CFormLabel>Course Selection</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={form.courseSelectionMode}
                    onChange={(e) => setField('courseSelectionMode', e.target.value)}
                  >
                    <option value="all">All Eligible Courses</option>
                    <option value="manual">Manual Course Selection</option>
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Rules</CFormLabel></CCol>
                <CCol md={10}>
                  <div className="d-flex flex-wrap gap-4">
                    <CFormCheck
                      type="checkbox"
                      label="No Student Clash"
                      checked={form.ruleNoStudentClash}
                      onChange={(e) => setField('ruleNoStudentClash', e.target.checked)}
                    />
                    <CFormCheck
                      type="checkbox"
                      label="No Faculty Clash"
                      checked={form.ruleNoFacultyClash}
                      onChange={(e) => setField('ruleNoFacultyClash', e.target.checked)}
                    />
                    <CFormCheck
                      type="checkbox"
                      label="Minimum Gap Between Papers"
                      checked={form.ruleMinGapEnabled}
                      onChange={(e) => setField('ruleMinGapEnabled', e.target.checked)}
                    />
                  </div>
                </CCol>

                <CCol md={2}><CFormLabel>Minimum Gap (Hours)</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormInput
                    type="number"
                    min={1}
                    value={form.minGapHours}
                    onChange={(e) => setField('minGapHours', e.target.value)}
                    disabled={!form.ruleMinGapEnabled}
                  />
                </CCol>

                <CCol md={2}><CFormLabel>Instructions</CFormLabel></CCol>
                <CCol md={10}>
                  <CFormTextarea
                    rows={3}
                    value={form.instructions}
                    onChange={(e) => setField('instructions', e.target.value)}
                    placeholder="Instructions for students/faculty for this IA exam window."
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Phase 1 Actions</strong>
            {validationErrors.length > 0 ? (
              <small className="text-danger">{validationErrors.length} validation item(s) pending</small>
            ) : (
              <small className="text-success">All required fields completed</small>
            )}
          </CCardHeader>
          <CCardBody className="d-flex justify-content-end gap-2">
            <ArpButton
              label={saving ? 'Saving...' : 'Save Draft'}
              icon="save"
              color="secondary"
              onClick={onSaveDraft}
              disabled={saving}
            />
            <ArpButton label="Clear" icon="reset" color="warning" onClick={onReset} disabled={saving} />
            <ArpButton
              label={saving ? 'Submitting...' : 'Submit Phase 1'}
              icon="submit"
              color="success"
              onClick={onSubmitPhase}
              disabled={saving}
            />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default IASetupPhase1
