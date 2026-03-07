import React, { useEffect, useMemo, useState } from 'react'
import {
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormCheck,
  CFormLabel,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'

import { ArpButton, ArpToastStack } from '../../components/common'
import {
  IA_PHASE_KEYS,
  getIACourseResources,
  getIASlotResources,
  saveIAWorkflowPhase,
} from '../../services/iaWorkflowService'
import IAWorkflowScopeBanner from './IAWorkflowScopeBanner'

const PHASE_1_KEY = 'arp.evaluation.ia.phase1.setup.draft.v1'
const PHASE_2_KEY = 'arp.evaluation.ia.phase2.schedule.draft.v1'

const IASchedulePlanningPhase2 = () => {
  const phase1 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_1_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])

  const [toast, setToast] = useState(null)
  const [scope, setScope] = useState({
    fromDate: phase1.windowStartDate || '',
    toDate: phase1.windowEndDate || '',
    mode: 'OFFLINE',
    venueType: 'CLASSROOM',
  })
  const [slots, setSlots] = useState([])
  const [courses, setCourses] = useState([])
  const [status, setStatus] = useState('DRAFT')
  const [slotLoading, setSlotLoading] = useState(false)
  const [courseLoading, setCourseLoading] = useState(false)
  const [bulkSlotId, setBulkSlotId] = useState('')
  const [onlyShowAvailableSlots, setOnlyShowAvailableSlots] = useState(false)

  const phase1Ready = String(phase1.status || '') === 'READY_FOR_PHASE_2'

  useEffect(() => {
    const fetchSlots = async () => {
      if (!phase1.institutionId || !scope.fromDate || !scope.toDate) {
        setSlots([])
        return
      }
      setSlotLoading(true)
      try {
        const data = await getIASlotResources({
          institutionId: phase1.institutionId,
          fromDate: scope.fromDate,
          toDate: scope.toDate,
          slotDurationHours: phase1.slotDurationMinutes || '',
          fnStartTime: phase1.fnStartTime || '',
          anStartTime: phase1.anStartTime || '',
        })
        const remoteSlots = Array.isArray(data?.slots) ? data.slots : []
        setSlots(remoteSlots)
      } catch {
        setSlots([])
        showToast('warning', 'Unable to load real slot/venue data from server.')
      } finally {
        setSlotLoading(false)
      }
    }
    fetchSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase1.institutionId, scope.fromDate, scope.toDate])

  useEffect(() => {
    const fetchCourses = async () => {
      if (!phase1.institutionId || !phase1.academicYearId) {
        setCourses([])
        return
      }
      const scopeProgrammeId = phase1.programmeScopeKey || phase1.programmeId || ''
      setCourseLoading(true)
      try {
        const list = await getIACourseResources({
          institutionId: phase1.institutionId,
          academicYearId: phase1.academicYearId,
          programmeId: scopeProgrammeId,
          scopeMode: phase1.scopeMode || 'SINGLE',
          programmeIds: Array.isArray(phase1.programmeIds) ? phase1.programmeIds.join(',') : '',
          chosenSemester: phase1.chosenSemester || '',
        })
        const rows = Array.isArray(list) ? list : []
        setCourses((prev) => {
          const prevById = new Map(prev.map((x) => [x.id, x]))
          return rows.map((r) => {
            const old = prevById.get(r.id)
            return {
              id: r.id,
              programmeId: r.programmeId || old?.programmeId || '',
              code: r.courseCode,
              name: r.courseName,
              programmeCode:
                r.programmeCode ||
                r.programCode ||
                r.programme_code ||
                r?.programme?.programmeCode ||
                old?.programmeCode ||
                '',
              programmeName:
                r.programmeName ||
                r.programName ||
                r.programme_name ||
                r?.programme?.programmeName ||
                old?.programmeName ||
                '',
              semester:
                r.semester ||
                r.semesterNumber ||
                r.chosenSemester ||
                r.currentSemester ||
                old?.semester ||
                phase1.chosenSemester ||
                '',
              students: Number(r.students || 0),
              faculty: r.facultyCode || r.facultyName || 'UNASSIGNED',
              slotId: old?.slotId || '',
              conflict: old?.conflict || '',
            }
          })
        })
      } catch {
        setCourses([])
        showToast('warning', 'Unable to load real course allocation data from server.')
      } finally {
        setCourseLoading(false)
      }
    }
    fetchCourses()
  }, [phase1.institutionId, phase1.academicYearId, phase1.programmeId, phase1.programmeScopeKey, phase1.scopeMode, phase1.programmeIds, phase1.chosenSemester])

  const showToast = (type, message) => {
    setToast({
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

  const usedSeatsBySlot = useMemo(() => {
    const map = {}
    courses.forEach((course) => {
      if (!course.slotId) return
      map[course.slotId] = (map[course.slotId] || 0) + Number(course.students || 0)
    })
    return map
  }, [courses])

  const computeCourseConflict = (course, proposedSlotId, list = courses) => {
    if (!proposedSlotId) return ''
    const slot = slotById[proposedSlotId]
    if (!slot) return 'Invalid Slot'

    const seatsAlready = list
      .filter((x) => x.id !== course.id && x.slotId === proposedSlotId)
      .reduce((sum, x) => sum + Number(x.students || 0), 0)
    if (seatsAlready + Number(course.students || 0) > Number(slot.capacity || 0)) return 'Venue Capacity Exceeded'

    const facultyClash = list.some((x) => x.id !== course.id && x.slotId === proposedSlotId && x.faculty === course.faculty)
    if (facultyClash) return 'Faculty Clash'

    return ''
  }

  const assignCourseToSlot = (courseId, slotId) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course
        return {
          ...course,
          slotId,
          conflict: computeCourseConflict(course, slotId, prev),
        }
      }),
    )
  }

  const getCourseSlotAvailability = (course, slotId, list = courses) => {
    if (!slotId) return { available: true, reason: '' }
    const reason = computeCourseConflict(course, slotId, list)
    return { available: !reason, reason }
  }

  const getSelectableSlotsForCourse = (course) => {
    if (!onlyShowAvailableSlots) return slots
    return slots.filter((slot) => {
      if (course.slotId === slot.id) return true
      return getCourseSlotAvailability(course, slot.id).available
    })
  }

  const onBulkAssignToUnassigned = () => {
    if (!bulkSlotId) {
      showToast('warning', 'Select a date-session slot for bulk assign.')
      return
    }
    let assigned = 0
    let skipped = 0
    setCourses((prev) => {
      const next = [...prev]
      for (let i = 0; i < next.length; i += 1) {
        const course = next[i]
        if (course.slotId) continue
        const reason = computeCourseConflict(course, bulkSlotId, next)
        if (reason) {
          next[i] = { ...course, conflict: reason }
          skipped += 1
        } else {
          next[i] = { ...course, slotId: bulkSlotId, conflict: '' }
          assigned += 1
        }
      }
      return next
    })
    showToast('info', `Bulk assign finished. Assigned: ${assigned}, Skipped: ${skipped}`)
  }

  const onAutoAssign = () => {
    const next = [...courses]
    next.forEach((course) => {
      const possible = slots.find((slot) => {
        const seatsAlready = next
          .filter((x) => x.id !== course.id && x.slotId === slot.id)
          .reduce((sum, x) => sum + Number(x.students || 0), 0)
        const capacityOkay = seatsAlready + Number(course.students || 0) <= Number(slot.capacity || 0)
        const facultyFree = !next.some(
          (x) => x.id !== course.id && x.slotId === slot.id && x.faculty === course.faculty,
        )
        return capacityOkay && facultyFree
      })
      course.slotId = possible?.id || ''
      course.conflict = possible ? '' : 'No Feasible Slot'
    })
    setCourses(next)
    showToast('info', 'Auto assignment completed.')
  }

  const onClearAllocations = () => {
    setCourses((prev) => prev.map((course) => ({ ...course, slotId: '', conflict: '' })))
    showToast('warning', 'All allocations cleared.')
  }

  const conflictCount = useMemo(
    () => courses.filter((course) => String(course.conflict || '').trim()).length,
    [courses],
  )

  const unassignedCount = useMemo(
    () => courses.filter((course) => !course.slotId).length,
    [courses],
  )

  const onSaveDraft = () => {
    const payload = { scope, slots, courses, status: 'DRAFT', updatedAt: new Date().toISOString() }
    window.sessionStorage.setItem(PHASE_2_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        const scopeProgrammeId = phase1.programmeScopeKey || phase1.programmeId || ''
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_2_SCHEDULE, {
          institutionId: phase1.institutionId || '',
          academicYearId: phase1.academicYearId || '',
          chosenSemester: phase1.chosenSemester || '',
          programmeId: scopeProgrammeId,
          examName: phase1.examName || phase1.iaCycle || '',
          iaCycle: phase1.iaCycle || '',
          workflowStatus: 'DRAFT',
          payload: {
            workflowScope: {
              institutionId: phase1.institutionId || '',
              academicYearId: phase1.academicYearId || '',
              chosenSemester: phase1.chosenSemester || '',
              programmeId: scopeProgrammeId,
              scopeMode: phase1.scopeMode || 'SINGLE',
              programmeIds: Array.isArray(phase1.programmeIds) ? phase1.programmeIds : [],
              examName: phase1.examName || phase1.iaCycle || '',
              iaCycle: phase1.iaCycle || '',
            },
            scope,
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
    showToast('success', 'Phase 2 draft saved.')
  }

  const onSubmitPhase2 = () => {
    if (unassignedCount > 0) {
      showToast('danger', `Assign all courses before submit. Pending: ${unassignedCount}`)
      return
    }
    if (conflictCount > 0) {
      showToast('danger', 'Resolve conflicts before submit.')
      return
    }
    const payload = {
      scope,
      slots,
      courses,
      status: 'READY_FOR_PHASE_3',
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_2_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        const scopeProgrammeId = phase1.programmeScopeKey || phase1.programmeId || ''
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_2_SCHEDULE, {
          institutionId: phase1.institutionId || '',
          academicYearId: phase1.academicYearId || '',
          chosenSemester: phase1.chosenSemester || '',
          programmeId: scopeProgrammeId,
          examName: phase1.examName || phase1.iaCycle || '',
          iaCycle: phase1.iaCycle || '',
          workflowStatus: 'READY_FOR_PHASE_3',
          payload: {
            workflowScope: {
              institutionId: phase1.institutionId || '',
              academicYearId: phase1.academicYearId || '',
              chosenSemester: phase1.chosenSemester || '',
              programmeId: scopeProgrammeId,
              scopeMode: phase1.scopeMode || 'SINGLE',
              programmeIds: Array.isArray(phase1.programmeIds) ? phase1.programmeIds : [],
              examName: phase1.examName || phase1.iaCycle || '',
              iaCycle: phase1.iaCycle || '',
            },
            scope,
            slots,
            courses,
            status: 'READY_FOR_PHASE_3',
          },
        })
      } catch {
        // Retain local submit state when API save fails.
      }
    })()
    setStatus('READY_FOR_PHASE_3')
    showToast('success', 'Phase 2 completed. Ready for conflict validation.')
  }

  return (
    <CRow>
      <CCol xs={12}>
        <ArpToastStack toast={toast} onClose={() => setToast(null)} />
        <IAWorkflowScopeBanner scope={phase1} />
        {!phase1Ready ? (
          <CAlert color="warning" className="mb-3">
            Phase 1 is not submitted yet. Complete IA Setup (`READY_FOR_PHASE_2`) before finalizing schedule planning.
          </CAlert>
        ) : null}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT - PHASE 2 SCHEDULE PLANNING</strong>
            <div className="d-flex gap-2">
              <CBadge color={phase1Ready ? 'success' : 'warning'}>
                Phase 1: {phase1Ready ? 'READY' : 'PENDING'}
              </CBadge>
              <CBadge color={status === 'READY_FOR_PHASE_3' ? 'success' : 'secondary'}>
                {status === 'READY_FOR_PHASE_3' ? 'READY FOR PHASE 3' : 'DRAFT'}
              </CBadge>
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2}><CFormLabel>Exam Window</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput value={phase1.examWindowName || '-'} disabled />
              </CCol>
              <CCol md={2}><CFormLabel>Name of the Examination</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput value={phase1.examName || phase1.iaCycle || '-'} disabled />
              </CCol>
              <CCol md={2}><CFormLabel>From Date</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput
                  type="date"
                  value={scope.fromDate}
                  onChange={(e) => setScope((prev) => ({ ...prev, fromDate: e.target.value }))}
                />
              </CCol>
              <CCol md={2}><CFormLabel>To Date</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput
                  type="date"
                  value={scope.toDate}
                  onChange={(e) => setScope((prev) => ({ ...prev, toDate: e.target.value }))}
                />
              </CCol>
              <CCol md={2}><CFormLabel>Mode</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.mode}
                  onChange={(e) => setScope((prev) => ({ ...prev, mode: e.target.value }))}
                >
                  <option value="OFFLINE">Offline</option>
                  <option value="ONLINE">Online</option>
                  <option value="HYBRID">Hybrid</option>
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>Venue Type</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={scope.venueType}
                  onChange={(e) => setScope((prev) => ({ ...prev, venueType: e.target.value }))}
                >
                  <option value="CLASSROOM">Classroom</option>
                  <option value="LAB">Lab</option>
                  <option value="HALL">Hall</option>
                </CFormSelect>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardBody>
            <CAccordion alwaysOpen activeItemKey={2}>
              <CAccordionItem itemKey={1}>
                <CAccordionHeader>
                  <div className="d-flex justify-content-between w-100 pe-2 align-items-center">
                    <strong>Slots and Venue Capacity (Reference)</strong>
                    <div className="d-flex gap-2">
                      <CBadge color="info">Slots: {slots.length}</CBadge>
                    </div>
                  </div>
                </CAccordionHeader>
                <CAccordionBody>
                  {slotLoading ? <div className="text-muted mb-2">Loading slots and venues...</div> : null}
                  <CTable responsive hover align="middle">
                    <CTableHead color="light">
                      <CTableRow>
                        <CTableHeaderCell>Date</CTableHeaderCell>
                        <CTableHeaderCell>Session</CTableHeaderCell>
                        <CTableHeaderCell>Start</CTableHeaderCell>
                        <CTableHeaderCell>End</CTableHeaderCell>
                        <CTableHeaderCell>Venue</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Capacity</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Used</CTableHeaderCell>
                        <CTableHeaderCell className="text-end">Balance</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {slots.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell colSpan={8} className="text-center text-muted py-4">
                            No slot/venue data found for selected date range.
                          </CTableDataCell>
                        </CTableRow>
                      ) : null}
                      {slots.map((slot) => {
                        const used = Number(usedSeatsBySlot[slot.id] || 0)
                        const balance = Number(slot.capacity || 0) - used
                        return (
                          <CTableRow key={slot.id}>
                            <CTableDataCell>{slot.date}</CTableDataCell>
                            <CTableDataCell>{slot.session}</CTableDataCell>
                            <CTableDataCell>{slot.startTime}</CTableDataCell>
                            <CTableDataCell>{slot.endTime}</CTableDataCell>
                            <CTableDataCell>{slot.venue}</CTableDataCell>
                            <CTableDataCell className="text-end">{slot.capacity}</CTableDataCell>
                            <CTableDataCell className="text-end">{used}</CTableDataCell>
                            <CTableDataCell className={`text-end ${balance < 0 ? 'text-danger fw-semibold' : ''}`}>
                              {balance}
                            </CTableDataCell>
                          </CTableRow>
                        )
                      })}
                    </CTableBody>
                  </CTable>
                </CAccordionBody>
              </CAccordionItem>

              <CAccordionItem itemKey={2}>
                <CAccordionHeader>
                  <div className="d-flex justify-content-between w-100 pe-2 align-items-center">
                    <strong>Course Allocation</strong>
                    <div className="d-flex gap-2">
                      <CBadge color={conflictCount > 0 ? 'danger' : 'success'}>Conflicts: {conflictCount}</CBadge>
                      <CBadge color={unassignedCount > 0 ? 'warning' : 'success'}>Unassigned: {unassignedCount}</CBadge>
                    </div>
                  </div>
                </CAccordionHeader>
                <CAccordionBody>
                  <div className="d-flex gap-2 mb-3">
                    <ArpButton label="Auto Assign" icon="search" color="info" onClick={onAutoAssign} />
                    <ArpButton label="Clear Allocations" icon="reset" color="warning" onClick={onClearAllocations} />
                  </div>
                  <CRow className="g-2 mb-3 align-items-end">
                    <CCol md={6} lg={5}>
                      <CFormLabel>Bulk Assign Slot (Unassigned Courses)</CFormLabel>
                      <CFormSelect value={bulkSlotId} onChange={(e) => setBulkSlotId(e.target.value)}>
                        <option value="">Select Date - Session</option>
                        {slots.map((slot) => (
                          <option key={slot.id} value={slot.id}>
                            {slot.date} - {slot.session} ({slot.startTime}-{slot.endTime}) [{slot.venue}]
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                    <CCol md={3} lg={3}>
                      <ArpButton
                        label="Assign Unassigned"
                        icon="submit"
                        color="primary"
                        onClick={onBulkAssignToUnassigned}
                      />
                    </CCol>
                    <CCol md={3} lg={4}>
                      <CFormCheck
                        id="only-available-slots"
                        label="Only show available slots in row dropdowns"
                        checked={onlyShowAvailableSlots}
                        onChange={(e) => setOnlyShowAvailableSlots(e.target.checked)}
                      />
                    </CCol>
                  </CRow>
                  {courseLoading ? <div className="text-muted mb-2">Loading courses...</div> : null}
                  <CTable responsive hover align="middle">
                    <CTableHead color="light">
                      <CTableRow>
                        <CTableHeaderCell style={{ position: 'sticky', top: 0, zIndex: 2 }}>Course Code</CTableHeaderCell>
                        <CTableHeaderCell style={{ position: 'sticky', top: 0, zIndex: 2 }}>Course Name</CTableHeaderCell>
                        <CTableHeaderCell style={{ position: 'sticky', top: 0, zIndex: 2 }}>Students</CTableHeaderCell>
                        <CTableHeaderCell style={{ position: 'sticky', top: 0, zIndex: 2 }}>Faculty</CTableHeaderCell>
                        <CTableHeaderCell style={{ position: 'sticky', top: 0, zIndex: 2 }}>Assigned Slot (Date - Session)</CTableHeaderCell>
                        <CTableHeaderCell style={{ position: 'sticky', top: 0, zIndex: 2 }}>Conflict</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {courses.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell colSpan={6} className="text-center text-muted py-4">
                            No course data found for selected IA scope.
                          </CTableDataCell>
                        </CTableRow>
                      ) : null}
                      {courses.map((course) => (
                        <CTableRow key={course.id}>
                          <CTableDataCell>{course.code}</CTableDataCell>
                          <CTableDataCell>{course.name}</CTableDataCell>
                          <CTableDataCell>{course.students}</CTableDataCell>
                          <CTableDataCell>{course.faculty}</CTableDataCell>
                          <CTableDataCell style={{ minWidth: 320 }}>
                            <CFormSelect
                              value={course.slotId || ''}
                              onChange={(e) => assignCourseToSlot(course.id, e.target.value)}
                            >
                              <option value="">Select Date - Session</option>
                              {getSelectableSlotsForCourse(course).map((slot) => {
                                const { available, reason } = getCourseSlotAvailability(course, slot.id)
                                return (
                                <option key={slot.id} value={slot.id} disabled={!available && course.slotId !== slot.id}>
                                  {slot.date} - {slot.session} ({slot.startTime}-{slot.endTime}) [{slot.venue}]
                                  {!available && course.slotId !== slot.id ? ` - ${reason}` : ''}
                                </option>
                                )
                              })}
                            </CFormSelect>
                          </CTableDataCell>
                          <CTableDataCell>
                            {course.conflict ? (
                              <CBadge color="danger">{course.conflict}</CBadge>
                            ) : (
                              <CBadge color={course.slotId ? 'success' : 'secondary'}>
                                {course.slotId ? 'OK' : 'Pending'}
                              </CBadge>
                            )}
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </CAccordionBody>
              </CAccordionItem>
            </CAccordion>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader><strong>Phase 2 Actions</strong></CCardHeader>
          <CCardBody className="d-flex justify-content-end gap-2">
            <ArpButton label="Save Draft" icon="save" color="secondary" onClick={onSaveDraft} />
            <ArpButton label="Submit Phase 2" icon="submit" color="success" onClick={onSubmitPhase2} />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default IASchedulePlanningPhase2
