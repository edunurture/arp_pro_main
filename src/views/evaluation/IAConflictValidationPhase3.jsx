import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
} from '@coreui/react-pro'

import { ArpButton, ArpDataTable, useArpToast } from '../../components/common'
import { IA_PHASE_KEYS, getIAWorkflowPhase, saveIAWorkflowPhase } from '../../services/iaWorkflowService'
import IAWorkflowScopeBanner from './IAWorkflowScopeBanner'

const PHASE_1_KEY = 'arp.evaluation.ia.phase1.setup.draft.v2'
const PHASE_2_KEY = 'arp.evaluation.ia.phase2.schedule.draft.v2'
const PHASE_3_KEY = 'arp.evaluation.ia.phase3.validation.draft.v2'
const ACTIVE_BUNDLE_KEY = 'arp.evaluation.ia.active-bundle.v2'

const normalizeSemesterList = (values) =>
  [...new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  )]

const bundleScopeMatches = (bundle = null, phase = {}) => {
  if (!bundle) return false
  const activeSemesters = normalizeSemesterList(bundle?.chosenSemesters || []).join(',')
  const phaseSemesters = normalizeSemesterList(phase?.chosenSemesters || phase?.workflowScope?.chosenSemesters || []).join(',')
  return (
    String(bundle?.institutionId || '') === String(phase?.institutionId || phase?.workflowScope?.institutionId || '') &&
    String(bundle?.academicYearId || '') === String(phase?.academicYearId || phase?.workflowScope?.academicYearId || '') &&
    String(bundle?.programmeId || '') === String(phase?.programmeId || phase?.workflowScope?.programmeId || '') &&
    String(bundle?.iaCycle || bundle?.examName || '') === String(phase?.iaCycle || phase?.examName || phase?.workflowScope?.iaCycle || phase?.workflowScope?.examName || '') &&
    String(bundle?.workspaceType || 'SINGLE') === String(phase?.workspaceType || phase?.workflowScope?.workspaceType || 'SINGLE') &&
    activeSemesters === phaseSemesters
  )
}

const resolveWorkflowScope = (phase1 = {}, phase2 = {}, activeBundle = null) => ({
  institutionId:
    activeBundle?.institutionId ||
    phase2?.workflowScope?.institutionId ||
    phase2?.institutionId ||
    phase1?.institutionId ||
    '',
  institutionName:
    activeBundle?.institutionName ||
    phase2?.workflowScope?.institutionName ||
    phase2?.institutionName ||
    phase1?.institutionName ||
    '',
  academicYearId:
    activeBundle?.academicYearId ||
    phase2?.workflowScope?.academicYearId ||
    phase2?.academicYearId ||
    phase1?.academicYearId ||
    '',
  academicYearLabel:
    activeBundle?.academicYearLabel ||
    phase2?.workflowScope?.academicYearLabel ||
    phase2?.academicYearLabel ||
    phase1?.academicYearLabel ||
    '',
  semesterCategory:
    activeBundle?.semesterCategory ||
    phase2?.workflowScope?.semesterCategory ||
    phase2?.semesterCategory ||
    phase1?.semesterCategory ||
    '',
  chosenSemester:
    activeBundle?.chosenSemester ||
    phase2?.workflowScope?.chosenSemester ||
    phase2?.chosenSemester ||
    phase1?.chosenSemester ||
    '',
  chosenSemesters: normalizeSemesterList(
    activeBundle?.chosenSemesters ||
    phase2?.workflowScope?.chosenSemesters ||
    phase2?.chosenSemesters ||
    phase1?.chosenSemesters ||
    [],
  ),
  programmeId:
    activeBundle?.programmeId ||
    phase2?.workflowScope?.programmeId ||
    phase2?.programmeId ||
    phase1?.programmeScopeKey ||
    phase1?.programmeId ||
    '',
  programmeIds:
    Array.isArray(activeBundle?.programmeIds) && activeBundle.programmeIds.length > 0
      ? activeBundle.programmeIds
      : Array.isArray(phase2?.workflowScope?.programmeIds) && phase2.workflowScope.programmeIds.length > 0
        ? phase2.workflowScope.programmeIds
        : Array.isArray(phase2?.programmeIds) && phase2.programmeIds.length > 0
          ? phase2.programmeIds
          : Array.isArray(phase1?.programmeIds)
            ? phase1.programmeIds
            : [],
  workspaceType:
    activeBundle?.workspaceType ||
    phase2?.workflowScope?.workspaceType ||
    phase2?.workspaceType ||
    phase1?.workspaceType ||
    'SINGLE',
  bundlePreset:
    activeBundle?.bundlePreset ||
    phase2?.workflowScope?.bundlePreset ||
    phase2?.bundlePreset ||
    phase1?.bundlePreset ||
    'MANUAL',
  examName:
    activeBundle?.examName ||
    activeBundle?.iaCycle ||
    phase2?.workflowScope?.examName ||
    phase2?.workflowScope?.iaCycle ||
    phase2?.examName ||
    phase2?.iaCycle ||
    phase1?.examName ||
    phase1?.iaCycle ||
    '',
  iaCycle:
    activeBundle?.iaCycle ||
    activeBundle?.examName ||
    phase2?.workflowScope?.iaCycle ||
    phase2?.workflowScope?.examName ||
    phase2?.iaCycle ||
    phase2?.examName ||
    phase1?.iaCycle ||
    phase1?.examName ||
    '',
})

const IAConflictValidationPhase3 = () => {
  const navigate = useNavigate()
  const phase1 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_1_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])
  const phase2 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_2_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])
  const activeBundle = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(ACTIVE_BUNDLE_KEY) || 'null')
    } catch {
      return null
    }
  }, [])
  const hasActiveBundle = useMemo(
    () =>
      Boolean(
        String(activeBundle?.institutionId || '').trim() &&
        String(activeBundle?.academicYearId || '').trim() &&
        String(activeBundle?.programmeId || '').trim() &&
        String(activeBundle?.iaCycle || activeBundle?.examName || '').trim(),
      ),
    [activeBundle],
  )
  const phase3Draft = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_3_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])

  const toast = useArpToast()
  const [status, setStatus] = useState('DRAFT')
  const [notes, setNotes] = useState('')
  const [slots, setSlots] = useState([])
  const [courses, setCourses] = useState([])
  const [editMode, setEditMode] = useState(false)

  const phase2Ready = String(phase2.status || '') === 'READY_FOR_PHASE_3'
  const phaseSubmitted = String(status || '').toUpperCase() === 'READY_FOR_PHASE_4'
  const phaseLocked = phaseSubmitted && !editMode
  const workflowScope = resolveWorkflowScope(phase1, phase2, activeBundle)

  useEffect(() => {
    if (hasActiveBundle) return
    navigate('/evaluation/ia/workspace', {
      replace: true,
      state: { workspaceNotice: 'Select or create an IA Workspace first.' },
    })
  }, [hasActiveBundle, navigate])

  useEffect(() => {
    if (!hasActiveBundle) return
    let ignore = false
    ;(async () => {
      const localOkay = bundleScopeMatches(activeBundle, phase3Draft)
      let nextStatus = localOkay ? phase3Draft?.status || 'DRAFT' : 'DRAFT'
      let nextNotes = localOkay ? phase3Draft?.notes || '' : ''
      let nextSlots = localOkay && Array.isArray(phase3Draft?.slots) ? phase3Draft.slots : Array.isArray(phase2.slots) ? phase2.slots : []
      let nextCourses = localOkay && Array.isArray(phase3Draft?.courses)
        ? phase3Draft.courses.map((x) => ({
            ...x,
            conflict: String(x.conflict || ''),
            conflictType: String(x.conflictType || (String(x.conflict || '').trim() ? 'HARD' : '')),
            resolvedBy: String(x.resolvedBy || ''),
          }))
        : Array.isArray(phase2.courses)
          ? phase2.courses.map((x) => ({
              ...x,
              conflict: String(x.conflict || ''),
              conflictType: String(x.conflict || '').trim() ? 'HARD' : '',
              resolvedBy: '',
            }))
          : []
      try {
        const remote = await getIAWorkflowPhase(IA_PHASE_KEYS.PHASE_3_VALIDATION, {
          institutionId: activeBundle.institutionId || '',
          academicYearId: activeBundle.academicYearId || '',
          chosenSemester: activeBundle.chosenSemester || '',
          chosenSemesters: normalizeSemesterList(activeBundle.chosenSemesters || []),
          programmeId: activeBundle.programmeId || '',
          iaCycle: activeBundle.iaCycle || activeBundle.examName || '',
          examName: activeBundle.examName || activeBundle.iaCycle || '',
        })
        const payload = remote?.payload && typeof remote.payload === 'object' ? remote.payload : null
        if (payload) {
          nextStatus = remote.workflowStatus || payload.status || nextStatus
          nextNotes = payload.notes || nextNotes
          nextSlots = Array.isArray(payload.slots) ? payload.slots : nextSlots
          nextCourses = Array.isArray(payload.courses)
            ? payload.courses.map((x) => ({
                ...x,
                conflict: String(x.conflict || ''),
                conflictType: String(x.conflictType || (String(x.conflict || '').trim() ? 'HARD' : '')),
                resolvedBy: String(x.resolvedBy || ''),
              }))
            : nextCourses
        }
      } catch {
        // keep fallback state
      }
      if (ignore) return
      setStatus(nextStatus)
      setNotes(nextNotes)
      setSlots(nextSlots)
      setCourses(nextCourses)
    })()
    return () => { ignore = true }
  }, [activeBundle, hasActiveBundle, phase2, phase3Draft])

  const showToast = (type, message) => {
    toast.show({
      type,
      message,
      autohide: type === 'success',
      delay: 4500,
    })
  }

  const slotById = useMemo(
    () => Object.fromEntries(slots.map((slot) => [slot.id, slot])),
    [slots],
  )

  const recalculateConflicts = (list) => {
    return list.map((course) => {
      if (String(course.iaDecision || 'SCHEDULED').toUpperCase() !== 'SCHEDULED') {
        return {
          ...course,
          conflict: '',
          conflictType: '',
        }
      }
      if (!course.slotId) {
        return {
          ...course,
          conflict: 'Unassigned Course',
          conflictType: 'HARD',
        }
      }

      const slot = slotById[course.slotId]
      if (!slot) {
        return {
          ...course,
          conflict: 'Invalid Slot',
          conflictType: 'HARD',
        }
      }

      const sameSlot = list.filter((x) => x.id !== course.id && x.slotId === course.slotId)
      const seatUsed = sameSlot.reduce((sum, x) => sum + Number(x.students || 0), 0) + Number(course.students || 0)
      if (seatUsed > Number(slot.capacity || 0)) {
        return {
          ...course,
          conflict: 'Venue Capacity Exceeded',
          conflictType: 'HARD',
        }
      }

      const facultyClash = sameSlot.some((x) => x.faculty === course.faculty)
      if (facultyClash) {
        return {
          ...course,
          conflict: 'Faculty Clash',
          conflictType: 'HARD',
        }
      }

      return {
        ...course,
        conflict: '',
        conflictType: '',
      }
    })
  }

  const onRecheck = () => {
    setCourses((prev) => recalculateConflicts(prev))
    showToast('info', 'Conflict recheck completed.')
  }

  const onChangeCourseSlot = (courseId, slotId) => {
    setCourses((prev) => {
      const next = prev.map((course) =>
        course.id === courseId
          ? {
              ...course,
              slotId,
              resolvedBy: 'Manual',
            }
          : course,
      )
      return recalculateConflicts(next)
    })
  }

  const unresolvedHard = useMemo(
    () => courses.filter((x) => String(x.conflictType) === 'HARD').length,
    [courses],
  )

  const unresolvedSoft = useMemo(
    () => courses.filter((x) => String(x.conflictType) === 'SOFT').length,
    [courses],
  )
  const conflictTableColumns = useMemo(
    () => [
      { key: 'code', label: 'Course Code', sortable: true, sortType: 'string' },
      { key: 'name', label: 'Course Name', sortable: true, sortType: 'string' },
      { key: 'students', label: 'Students', sortable: true, sortType: 'number', align: 'right' },
      { key: 'faculty', label: 'Faculty', sortable: true, sortType: 'string' },
      { key: 'currentSlotDisplay', label: 'Current Slot', sortable: true, sortType: 'string' },
      { key: 'reassignSlot', label: 'Reassign Slot' },
      { key: 'conflictDisplay', label: 'Conflict', sortable: true, sortType: 'string' },
      { key: 'conflictType', label: 'Type', sortable: true, sortType: 'string', align: 'center' },
      { key: 'resolvedBy', label: 'Resolved By', sortable: true, sortType: 'string' },
    ],
    [],
  )
  const conflictTableRows = useMemo(
    () => courses.map((course) => ({
      ...course,
      currentSlotDisplay: course.slotId
        ? `${slotById[course.slotId]?.date || ''} ${slotById[course.slotId]?.session || ''} (${slotById[course.slotId]?.venue || ''})`
        : 'Not Assigned',
      reassignSlot: '',
      conflictDisplay: course.conflict || 'No Conflict',
    })),
    [courses, slotById],
  )

  const onSaveDraft = () => {
    const payload = {
      status: 'DRAFT',
      notes,
      slots,
      courses,
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_3_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        const wf = resolveWorkflowScope(phase1, phase2, activeBundle)
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_3_VALIDATION, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          chosenSemesters: normalizeSemesterList(wf.chosenSemesters),
          programmeId: wf.programmeId || '',
          programmeIds: Array.isArray(wf.programmeIds) ? wf.programmeIds : [],
          workspaceType: wf.workspaceType || 'SINGLE',
          bundlePreset: wf.bundlePreset || 'MANUAL',
          examName: wf.examName || wf.iaCycle || '',
          iaCycle: wf.iaCycle || '',
          workflowStatus: 'DRAFT',
          payload: {
            workflowScope: wf,
            notes,
            slots,
            courses,
            status: 'DRAFT',
          },
        })
      } catch {
        // Retain local draft when API save fails.
      }
    })()
    setStatus('DRAFT')
    showToast('success', 'Phase 3 draft saved.')
  }

  const onSubmitPhase3 = () => {
    if (unresolvedHard > 0) {
      showToast('danger', 'Resolve all hard conflicts before submitting Phase 3.')
      return
    }
    const payload = {
      status: 'READY_FOR_PHASE_4',
      notes,
      slots,
      courses,
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_3_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        const wf = resolveWorkflowScope(phase1, phase2, activeBundle)
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_3_VALIDATION, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          chosenSemesters: normalizeSemesterList(wf.chosenSemesters),
          programmeId: wf.programmeId || '',
          programmeIds: Array.isArray(wf.programmeIds) ? wf.programmeIds : [],
          workspaceType: wf.workspaceType || 'SINGLE',
          bundlePreset: wf.bundlePreset || 'MANUAL',
          examName: wf.examName || wf.iaCycle || '',
          iaCycle: wf.iaCycle || '',
          workflowStatus: 'READY_FOR_PHASE_4',
          payload: {
            workflowScope: wf,
            notes,
            slots,
            courses,
            status: 'READY_FOR_PHASE_4',
          },
        })
      } catch {
        // Retain local submit state when API save fails.
      }
    })()
    setStatus('READY_FOR_PHASE_4')
    setEditMode(false)
    showToast('success', 'Phase 3 completed. Ready for publish phase.')
  }

  return (
    <CRow>
      <CCol xs={12}>
        <IAWorkflowScopeBanner scope={workflowScope} />
        {!phase2Ready ? (
          <CAlert color="warning" className="mb-3">
            Phase 2 is not submitted yet. Complete schedule planning (`READY_FOR_PHASE_3`) before finalizing validation.
          </CAlert>
        ) : null}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT - PHASE 3 CONFLICT VALIDATION</strong>
            <div className="d-flex gap-2">
              <CBadge color={phase2Ready ? 'success' : 'warning'}>
                Phase 2: {phase2Ready ? 'READY' : 'PENDING'}
              </CBadge>
              <CBadge color={status === 'READY_FOR_PHASE_4' ? 'success' : 'secondary'}>
                {status === 'READY_FOR_PHASE_4' ? 'READY FOR PHASE 4' : 'DRAFT'}
              </CBadge>
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel>Hard Conflicts</CFormLabel>
                <CFormInput value={String(unresolvedHard)} disabled />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Soft Conflicts</CFormLabel>
                <CFormInput value={String(unresolvedSoft)} disabled />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Total Courses</CFormLabel>
                <CFormInput value={String(courses.length)} disabled />
              </CCol>
              <CCol md={3} className="d-flex align-items-end">
                <ArpButton label="Recheck Conflicts" icon="search" color="info" onClick={onRecheck} disabled={phaseLocked} />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Conflict Resolution Grid</strong>
          </CCardHeader>
          <CCardBody>
            {phaseLocked ? (
              <CAlert color="info" className="mb-3">
                Phase 3 is submitted and locked. Use Enable Edit to revise this bundle, or continue with Phase 4.
              </CAlert>
            ) : null}
            <ArpDataTable
              title="Conflict Resolution Grid"
              rows={conflictTableRows}
              columns={conflictTableColumns}
              searchable={false}
              defaultPageSize={10}
              pageSizeOptions={[10, 25, 50, 100]}
              emptyText="No schedule data found from Phase 2."
              scopedColumns={{
                reassignSlot: (course) => (
                  <div style={{ minWidth: 220 }}>
                    <CFormSelect
                      value={course.slotId || ''}
                      onChange={(e) => onChangeCourseSlot(course.id, e.target.value)}
                      disabled={phaseLocked}
                    >
                      <option value="">Select Slot</option>
                      {slots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.date} {slot.session} {slot.startTime}-{slot.endTime} ({slot.venue})
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                ),
                conflictDisplay: (course) => (
                  course.conflict ? <CBadge color="danger">{course.conflict}</CBadge> : <CBadge color="success">No Conflict</CBadge>
                ),
                conflictType: (course) => (
                  course.conflictType ? <CBadge color="danger">{course.conflictType}</CBadge> : <CBadge color="secondary">-</CBadge>
                ),
              }}
            />
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader><strong>Phase 3 Actions</strong></CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2}><CFormLabel>Validation Notes</CFormLabel></CCol>
              <CCol md={10}>
                <CFormInput
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Remarks about conflict handling for audit."
                  disabled={phaseLocked}
                />
              </CCol>
              <CCol xs={12} className="d-flex justify-content-end gap-2">
                {phaseLocked ? (
                  <>
                    <ArpButton
                      label="Enable Edit"
                      icon="edit"
                      color="warning"
                      onClick={() => setEditMode(true)}
                      disabled={!phase2Ready}
                    />
                    <ArpButton
                      label="Go to Workspace Console"
                      icon="view"
                      color="secondary"
                      onClick={() => navigate('/evaluation/ia/workspace')}
                    />
                  </>
                ) : (
                  <>
                    <ArpButton label="Save Draft" icon="save" color="secondary" onClick={onSaveDraft} />
                    <ArpButton label="Submit Phase 3" icon="submit" color="success" onClick={onSubmitPhase3} />
                  </>
                )}
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default IAConflictValidationPhase3
