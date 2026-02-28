import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'
import { ArpButton, ArpIconButton } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'

const initialScope = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
  facultyId: '',
  classId: '',
  courseOfferingId: '',
  iaOnly: false,
}

const initialForm = {
  title: '',
  description: '',
  assignmentDate: '',
  lastDate: '',
  instructionRemarks: '',
  allowLateSubmission: false,
  isIALinked: false,
  ciaComputationId: '',
  iaComponentLabel: '',
  maxMarks: '',
  status: true,
  file: null,
}

const toDateValue = (v) => {
  if (!v) return ''
  const text = String(v)
  return text.length >= 10 ? text.slice(0, 10) : text
}

const Assignments = () => {
  const [scope, setScope] = useState(initialScope)

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [faculties, setFaculties] = useState([])
  const [classes, setClasses] = useState([])
  const [courseOfferings, setCourseOfferings] = useState([])
  const [assessmentCodes, setAssessmentCodes] = useState([])
  const [ciaComputations, setCiaComputations] = useState([])
  const [mappedCiaComputationId, setMappedCiaComputationId] = useState('')

  const [assignments, setAssignments] = useState([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [submissions, setSubmissions] = useState(null)
  const [scoreRows, setScoreRows] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(initialForm)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(scope.academicYearId)) || null,
    [academicYears, scope.academicYearId],
  )
  const semesterOptions = useMemo(
    () => semesterOptionsFromAcademicYear(selectedAcademicYear),
    [selectedAcademicYear],
  )
  const selectedAssignment = useMemo(
    () => assignments.find((x) => String(x.id) === String(selectedAssignmentId)) || null,
    [assignments, selectedAssignmentId],
  )
  const ciaAssessmentCodeOptions = useMemo(() => {
    if (!mappedCiaComputationId) return assessmentCodes
    const filtered = assessmentCodes.filter((x) => String(x.id) === String(mappedCiaComputationId))
    return filtered.length ? filtered : assessmentCodes
  }, [assessmentCodes, mappedCiaComputationId])
  const iaComponentOptions = useMemo(() => {
    const selected = ciaComputations.find((x) => String(x.id) === String(form.ciaComputationId))
    const rows = Array.isArray(selected?.components) ? selected.components : []
    return Array.from(
      new Set(
        rows
          .map((c) => String(c?.examination || '').trim())
          .filter((name) => /assignment/i.test(name))
          .filter(Boolean),
      ),
    )
  }, [ciaComputations, form.ciaComputationId])

  useEffect(() => {
    ;(async () => {
      try {
        setInstitutions(await lmsService.listInstitutions())
      } catch {
        setError('Failed to load institutions')
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      if (!scope.institutionId) return
      try {
        const codes = await lmsService.listAssessmentCodes(scope.institutionId)
        setAssessmentCodes(codes)
      } catch {
        setAssessmentCodes([])
      }
      try {
        const computations = await lmsService.listCIAComputations(scope.institutionId)
        setCiaComputations(computations)
      } catch {
        setCiaComputations([])
      }
    })()
  }, [scope.institutionId])

  useEffect(() => {
    if (!form.isIALinked) return
    if (!form.iaComponentLabel) return
    if (!iaComponentOptions.length) return
    if (!iaComponentOptions.includes(form.iaComponentLabel)) {
      setForm((p) => ({ ...p, iaComponentLabel: '' }))
    }
  }, [form.isIALinked, form.iaComponentLabel, iaComponentOptions])

  useEffect(() => {
    ;(async () => {
      if (!scope.institutionId || !scope.departmentId || !scope.academicYearId) return
      try {
        setFaculties(
          await lmsService.listFaculties({
            institutionId: scope.institutionId,
            departmentId: scope.departmentId,
            academicYearId: scope.academicYearId,
          }),
        )
      } catch {
        setFaculties([])
      }
    })()
  }, [scope.institutionId, scope.departmentId, scope.academicYearId])

  useEffect(() => {
    ;(async () => {
      if (!scope.institutionId || !scope.departmentId || !scope.programmeId) return
      try {
        setClasses(
          await lmsService.listClasses({
            institutionId: scope.institutionId,
            departmentId: scope.departmentId,
            programmeId: scope.programmeId,
          }),
        )
      } catch {
        setClasses([])
      }
    })()
  }, [scope.institutionId, scope.departmentId, scope.programmeId])

  useEffect(() => {
    ;(async () => {
      if (!scope.institutionId || !scope.programmeId || !scope.academicYearId) return
      try {
        const mapped = await lmsService.listRegulationMaps({
          institutionId: scope.institutionId,
          programmeId: scope.programmeId,
          academicYearId: scope.academicYearId,
        })
        setRegulations(Array.from(new Map(mapped.map((m) => [m.regulationId, { id: m.regulationId, label: m.regulationCode || '-' }])).values()))
        setBatches(Array.from(new Map(mapped.map((m) => [m.batchId, { id: m.batchId, label: m.batch || '-' }])).values()))
      } catch {
        setRegulations([])
        setBatches([])
      }
    })()
  }, [scope.institutionId, scope.programmeId, scope.academicYearId])

  useEffect(() => {
    ;(async () => {
      if (!scope.institutionId || !scope.programmeId || !scope.academicYearId || !scope.regulationId || !scope.semester) return
      try {
        setCourseOfferings(await lmsService.listCourseOfferings(scope))
      } catch {
        setCourseOfferings([])
      }
    })()
  }, [
    scope.institutionId,
    scope.programmeId,
    scope.academicYearId,
    scope.regulationId,
    scope.batchId,
    scope.semester,
  ])

  const onScopeChange = (key) => async (e) => {
    const value = key === 'iaOnly' ? e.target.checked : e.target.value
    setError('')
    setSuccess('')

    if (key === 'institutionId') {
      setScope({ ...initialScope, institutionId: value })
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      setFaculties([])
      setClasses([])
      setCourseOfferings([])
      if (!value) return
      try {
        const [d, ay, b] = await Promise.all([
          lmsService.listDepartments(value),
          lmsService.listAcademicYears(value),
          lmsService.listBatches(value),
        ])
        setDepartments(d)
        setAcademicYears(ay)
        setBatches(b)
      } catch {
        setError('Failed to load institution scope')
      }
      return
    }

    if (key === 'departmentId') {
      setScope((p) => ({
        ...p,
        departmentId: value,
        programmeId: '',
        regulationId: '',
        batchId: '',
        semester: '',
        facultyId: '',
        classId: '',
        courseOfferingId: '',
      }))
      setProgrammes([])
      setRegulations([])
      setFaculties([])
      setClasses([])
      setCourseOfferings([])
      if (!value || !scope.institutionId) return
      try {
        setProgrammes(await lmsService.listProgrammes(scope.institutionId, value))
      } catch {
        setError('Failed to load programmes')
      }
      return
    }

    if (key === 'programmeId') {
      setScope((p) => ({
        ...p,
        programmeId: value,
        regulationId: '',
        batchId: '',
        semester: '',
        classId: '',
        courseOfferingId: '',
      }))
      setRegulations([])
      setClasses([])
      setCourseOfferings([])
      return
    }

    if (key === 'academicYearId') {
      setScope((p) => ({ ...p, academicYearId: value, semester: '', facultyId: '', courseOfferingId: '' }))
      setCourseOfferings([])
      return
    }

    if (key === 'regulationId' || key === 'batchId' || key === 'semester') {
      setScope((p) => ({ ...p, [key]: value, courseOfferingId: '' }))
      return
    }

    setScope((p) => ({ ...p, [key]: value }))
  }

  const ensureScope = () => {
    if (!scope.institutionId || !scope.departmentId || !scope.programmeId || !scope.regulationId) {
      setError('Select Institution, Department, Programme and Regulation')
      return false
    }
    if (!scope.academicYearId || !scope.batchId || !scope.semester) {
      setError('Select Academic Year, Batch and Semester')
      return false
    }
    return true
  }

  const searchAssignments = async () => {
    if (!ensureScope()) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const data = await lmsService.listAssignments(scope, {
        facultyId: scope.facultyId || undefined,
        classId: scope.classId || undefined,
        courseOfferingId: scope.courseOfferingId || undefined,
        iaOnly: scope.iaOnly || undefined,
      })
      setAssignments(Array.isArray(data) ? data : [])
      setSelectedAssignmentId('')
      setSubmissions(null)
      setScoreRows([])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load assignments')
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    if (scope.institutionId) {
      ;(async () => {
        if (!assessmentCodes.length) {
          try {
            setAssessmentCodes(await lmsService.listAssessmentCodes(scope.institutionId))
          } catch {
            // ignore
          }
        }
        if (!ciaComputations.length) {
          try {
            setCiaComputations(await lmsService.listCIAComputations(scope.institutionId))
          } catch {
            // ignore
          }
        }
      })()
    }
    setEditingId('')
    setMappedCiaComputationId('')
    setForm({
      ...initialForm,
      assignmentDate: new Date().toISOString().slice(0, 10),
      lastDate: new Date().toISOString().slice(0, 10),
      status: true,
    })
    setModalOpen(true)
  }

  const openEdit = () => {
    if (!selectedAssignment) return
    if (scope.institutionId) {
      ;(async () => {
        if (!assessmentCodes.length) {
          try {
            setAssessmentCodes(await lmsService.listAssessmentCodes(scope.institutionId))
          } catch {
            // ignore
          }
        }
        if (!ciaComputations.length) {
          try {
            setCiaComputations(await lmsService.listCIAComputations(scope.institutionId))
          } catch {
            // ignore
          }
        }
      })()
    }
    setEditingId(selectedAssignment.id)
    setMappedCiaComputationId(selectedAssignment.ciaComputationId || '')
    setForm({
      title: selectedAssignment.title || '',
      description: selectedAssignment.description || '',
      assignmentDate: toDateValue(selectedAssignment.assignmentDate),
      lastDate: toDateValue(selectedAssignment.lastDate),
      instructionRemarks: selectedAssignment.instructionRemarks || '',
      allowLateSubmission: Boolean(selectedAssignment.allowLateSubmission),
      isIALinked: Boolean(selectedAssignment.isIALinked),
      ciaComputationId: selectedAssignment.ciaComputationId || '',
      iaComponentLabel: selectedAssignment.iaComponentLabel || '',
      maxMarks: selectedAssignment.maxMarks ?? '',
      status: Boolean(selectedAssignment.status),
      file: null,
    })
    setModalOpen(true)
  }

  const saveAssignment = async () => {
    if (!ensureScope()) return
    if (!scope.classId || !scope.courseOfferingId || !scope.facultyId) {
      setError('Select faculty, class and course offering')
      return
    }
    if (!form.title || !form.assignmentDate || !form.lastDate) {
      setError('Title, Assignment Date and Last Date are required')
      return
    }
    if (form.isIALinked && !form.maxMarks) {
      setError('Max Marks is required for IA linked assignment')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        classId: scope.classId,
        courseOfferingId: scope.courseOfferingId,
        facultyId: scope.facultyId,
        title: form.title,
        description: form.description,
        assignmentDate: form.assignmentDate,
        lastDate: form.lastDate,
        instructionRemarks: form.instructionRemarks,
        allowLateSubmission: form.allowLateSubmission,
        isIALinked: form.isIALinked,
        ciaComputationId: form.ciaComputationId || '',
        iaComponentLabel: form.iaComponentLabel || '',
        maxMarks: form.maxMarks,
        status: form.status,
        file: form.file,
      }
      if (editingId) {
        await lmsService.updateAssignment(editingId, scope, payload)
        setSuccess('Assignment updated successfully')
      } else {
        await lmsService.createAssignment(scope, payload)
        setSuccess('Assignment created successfully')
      }
      setModalOpen(false)
      await searchAssignments()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save assignment')
    } finally {
      setSaving(false)
    }
  }

  const removeAssignment = async () => {
    if (!selectedAssignment) return
    if (!window.confirm('Delete selected assignment?')) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await lmsService.deleteAssignment(selectedAssignment.id, scope)
      setSuccess('Assignment deleted successfully')
      await searchAssignments()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete assignment')
    } finally {
      setSaving(false)
    }
  }

  const loadSubmissions = async () => {
    if (!selectedAssignment) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const data = await lmsService.getAssignmentSubmissions(selectedAssignment.id)
      setSubmissions(data)
      setScoreRows(
        (data?.students || []).map((s) => ({
          studentId: s.studentId,
          score: s.score ?? '',
          scoreRemarks: s.scoreRemarks || '',
        })),
      )
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load submissions')
      setSubmissions(null)
      setScoreRows([])
    } finally {
      setLoading(false)
    }
  }

  const setScoreCell = (studentId, key, value) => {
    setScoreRows((prev) =>
      prev.map((r) => (String(r.studentId) === String(studentId) ? { ...r, [key]: value } : r)),
    )
  }

  const saveScores = async () => {
    if (!selectedAssignment) return
    if (!selectedAssignment.isIALinked) {
      setError('Marks entry is available only for IA linked assignments')
      return
    }
    const facultyId = selectedAssignment.facultyId || scope.facultyId
    if (!facultyId) {
      setError('Faculty is required to save marks')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await lmsService.saveAssignmentScores(selectedAssignment.id, {
        facultyId,
        scores: scoreRows,
      })
      setSuccess('Marks saved successfully')
      await loadSubmissions()
      await searchAssignments()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save marks')
    } finally {
      setSaving(false)
    }
  }

  const resolveMappedCIAForSelectedCourse = async () => {
    if (!scope.institutionId || !scope.academicYearId || !scope.programmeId || !scope.semester || !scope.courseOfferingId) return ''
    const semesterCategory = String(selectedAcademicYear?.semesterCategory || '').toUpperCase()
    if (!semesterCategory) return ''
    try {
      const rows = await lmsService.listAssessmentMappings({
        institutionId: scope.institutionId,
        academicYearId: scope.academicYearId,
        semesterCategory,
        chosenSemester: scope.semester,
        programmeId: scope.programmeId,
      })
      const hit = rows.find((r) => String(r.courseOfferingId) === String(scope.courseOfferingId))
      const mapped = String(hit?.ciaComputationId || '')
      setMappedCiaComputationId(mapped)
      return mapped
    } catch {
      setMappedCiaComputationId('')
      return ''
    }
  }

  useEffect(() => {
    if (!modalOpen || !form.isIALinked) return
    if (form.ciaComputationId) return
    ;(async () => {
      const mapped = await resolveMappedCIAForSelectedCourse()
      if (mapped) {
        setForm((p) => ({ ...p, ciaComputationId: mapped, iaComponentLabel: '' }))
      }
    })()
  }, [
    modalOpen,
    form.isIALinked,
    form.ciaComputationId,
    scope.institutionId,
    scope.academicYearId,
    scope.programmeId,
    scope.semester,
    scope.courseOfferingId,
    selectedAcademicYear,
  ])

  useEffect(() => {
    if (!modalOpen || !form.isIALinked) return
    if (mappedCiaComputationId) return
    setMappedCiaComputationId('')
  }, [modalOpen, form.isIALinked, mappedCiaComputationId])

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader><strong>Assignments</strong></CCardHeader>
          <CCardBody>
            {error ? <CAlert color="danger">{error}</CAlert> : null}
            {success ? <CAlert color="success">{success}</CAlert> : null}

            <CRow className="g-3">
              <CCol md={3}><CFormLabel>Institution</CFormLabel></CCol>
              <CCol md={3}><CFormSelect value={scope.institutionId} onChange={onScopeChange('institutionId')}><option value="">Select</option>{institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
              <CCol md={3}><CFormSelect value={scope.academicYearId} onChange={onScopeChange('academicYearId')}><option value="">Select</option>{academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Department</CFormLabel></CCol>
              <CCol md={3}><CFormSelect value={scope.departmentId} onChange={onScopeChange('departmentId')}><option value="">Select</option>{departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Programme</CFormLabel></CCol>
              <CCol md={3}><CFormSelect value={scope.programmeId} onChange={onScopeChange('programmeId')}><option value="">Select</option>{programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode} - {x.programmeName}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Regulation</CFormLabel></CCol>
              <CCol md={3}><CFormSelect value={scope.regulationId} onChange={onScopeChange('regulationId')}><option value="">Select</option>{regulations.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Batch</CFormLabel></CCol>
              <CCol md={3}><CFormSelect value={scope.batchId} onChange={onScopeChange('batchId')}><option value="">Select</option>{batches.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Semester</CFormLabel></CCol>
              <CCol md={3}><CFormSelect value={scope.semester} onChange={onScopeChange('semester')}><option value="">Select</option>{semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Faculty</CFormLabel></CCol>
              <CCol md={3}><CFormSelect value={scope.facultyId} onChange={onScopeChange('facultyId')}><option value="">All</option>{faculties.map((x) => <option key={x.id} value={x.id}>{x.facultyCode} - {x.facultyName}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Class</CFormLabel></CCol>
              <CCol md={3}><CFormSelect value={scope.classId} onChange={onScopeChange('classId')}><option value="">All</option>{classes.map((x) => <option key={x.id} value={x.id}>{x.className} {x.classLabel ? `(${x.classLabel})` : ''}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>Course Offering</CFormLabel></CCol>
              <CCol md={3}><CFormSelect value={scope.courseOfferingId} onChange={onScopeChange('courseOfferingId')}><option value="">All</option>{courseOfferings.map((x) => <option key={x.id} value={x.id}>{x.course?.courseCode} - {x.course?.courseTitle}</option>)}</CFormSelect></CCol>
              <CCol md={3}><CFormLabel>IA Linked Only</CFormLabel></CCol>
              <CCol md={3} className="d-flex align-items-center">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={scope.iaOnly}
                  onChange={(e) => setScope((p) => ({ ...p, iaOnly: e.target.checked }))}
                  style={{
                    backgroundColor: scope.iaOnly ? '#6c757d' : '#e9ecef',
                    borderColor: scope.iaOnly ? '#6c757d' : '#adb5bd',
                    cursor: 'pointer',
                    opacity: 1,
                  }}
                />
              </CCol>
              <CCol md={3} className="d-flex align-items-end justify-content-end gap-2">
                <ArpIconButton icon="view" color="primary" title={loading ? 'Loading...' : 'Search'} onClick={searchAssignments} disabled={loading} />
                <ArpIconButton icon="add" color="success" title="Add" onClick={openCreate} />
                <ArpIconButton icon="edit" color="warning" title="Edit" onClick={openEdit} disabled={!selectedAssignment} />
                <ArpIconButton icon="delete" color="danger" title="Delete" onClick={removeAssignment} disabled={!selectedAssignment || saving} />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Tracked Assignments</strong></CCardHeader>
          <CCardBody>
            <CTable bordered hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Title</CTableHeaderCell>
                  <CTableHeaderCell>Class</CTableHeaderCell>
                  <CTableHeaderCell>Course</CTableHeaderCell>
                  <CTableHeaderCell>Faculty</CTableHeaderCell>
                  <CTableHeaderCell>Due Date</CTableHeaderCell>
                  <CTableHeaderCell>IA</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                  <CTableHeaderCell>Submissions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {assignments.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell>
                      <input type="radio" name="assignmentSel" checked={String(selectedAssignmentId) === String(r.id)} onChange={() => setSelectedAssignmentId(r.id)} />
                    </CTableDataCell>
                    <CTableDataCell>{toDateValue(r.assignmentDate)}</CTableDataCell>
                    <CTableDataCell>{r.title}</CTableDataCell>
                    <CTableDataCell>{r.className} {r.classLabel ? `(${r.classLabel})` : ''}</CTableDataCell>
                    <CTableDataCell>{r.courseCode} - {r.courseTitle}</CTableDataCell>
                    <CTableDataCell>{r.facultyCode} - {r.facultyName}</CTableDataCell>
                    <CTableDataCell>{toDateValue(r.lastDate)}</CTableDataCell>
                    <CTableDataCell>{r.isIALinked ? <CBadge color="info">IA</CBadge> : <CBadge color="secondary">General</CBadge>}</CTableDataCell>
                    <CTableDataCell>{r.status ? <CBadge color="success">Active</CBadge> : <CBadge color="secondary">Inactive</CBadge>}</CTableDataCell>
                    <CTableDataCell>{r.scoredCount || 0} / {r.submissionCount || 0}</CTableDataCell>
                  </CTableRow>
                ))}
                {!assignments.length ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center text-medium-emphasis">No assignments found</CTableDataCell>
                  </CTableRow>
                ) : null}
              </CTableBody>
            </CTable>
            <div className="d-flex justify-content-end">
              <ArpButton label="View Submissions / Mark Entry" icon="view" color="dark" onClick={loadSubmissions} disabled={!selectedAssignment || loading} className="text-white" />
            </div>
          </CCardBody>
        </CCard>

        {submissions ? (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Assignment Submissions - {submissions?.assignment?.title || ''}</strong>
              <div>
                {submissions?.assignment?.isIALinked ? (
                  <CBadge color="info">
                    IA Linked {submissions?.assignment?.maxMarks !== null && submissions?.assignment?.maxMarks !== undefined ? `| Max ${submissions.assignment.maxMarks}` : ''}
                  </CBadge>
                ) : (
                  <CBadge color="warning">Not IA Linked</CBadge>
                )}
              </div>
            </CCardHeader>
            <CCardBody>
              <CTable bordered hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Reg No</CTableHeaderCell>
                    <CTableHeaderCell>Name</CTableHeaderCell>
                    <CTableHeaderCell>Submitted At</CTableHeaderCell>
                    <CTableHeaderCell>Score</CTableHeaderCell>
                    <CTableHeaderCell>Remarks</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {(submissions?.students || []).map((s) => {
                    const row = scoreRows.find((x) => String(x.studentId) === String(s.studentId)) || {}
                    return (
                      <CTableRow key={s.studentId}>
                        <CTableDataCell>{s.registerNumber}</CTableDataCell>
                        <CTableDataCell>{s.firstName}</CTableDataCell>
                        <CTableDataCell>{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '-'}</CTableDataCell>
                        <CTableDataCell>
                          <CFormInput
                            size="sm"
                            value={row.score ?? ''}
                            onChange={(e) => setScoreCell(s.studentId, 'score', e.target.value)}
                            disabled={!submissions?.assignment?.isIALinked}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <CFormInput
                            size="sm"
                            value={row.scoreRemarks ?? ''}
                            onChange={(e) => setScoreCell(s.studentId, 'scoreRemarks', e.target.value)}
                            disabled={!submissions?.assignment?.isIALinked}
                          />
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })}
                  {!submissions?.students?.length ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center text-medium-emphasis">No students found for this assignment scope</CTableDataCell>
                    </CTableRow>
                  ) : null}
                </CTableBody>
              </CTable>
              <div className="d-flex justify-content-end gap-2">
                <ArpButton label="Close" icon="cancel" color="secondary" onClick={() => setSubmissions(null)} />
                <ArpButton label="Save Marks" icon="save" color="primary" onClick={saveScores} disabled={saving || !submissions?.assignment?.isIALinked} />
              </div>
            </CCardBody>
          </CCard>
        ) : null}

        <CModal visible={modalOpen} onClose={() => setModalOpen(false)} size="lg">
          <CModalHeader><CModalTitle>{editingId ? 'Edit Assignment' : 'Add Assignment'}</CModalTitle></CModalHeader>
          <CModalBody>
            <CRow className="g-3">
              <CCol md={3}><CFormLabel>Title</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>Description</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>Assignment Date</CFormLabel></CCol>
              <CCol md={3}><CFormInput type="date" value={form.assignmentDate} onChange={(e) => setForm((p) => ({ ...p, assignmentDate: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>Last Date</CFormLabel></CCol>
              <CCol md={3}><CFormInput type="date" value={form.lastDate} onChange={(e) => setForm((p) => ({ ...p, lastDate: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>Upload File</CFormLabel></CCol>
              <CCol md={3}><CFormInput type="file" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></CCol>
              <CCol md={3}><CFormLabel>Instruction Remarks</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.instructionRemarks} onChange={(e) => setForm((p) => ({ ...p, instructionRemarks: e.target.value }))} /></CCol>
              <CCol md={3}><CFormLabel>Allow Late Submission</CFormLabel></CCol>
              <CCol md={3} className="d-flex align-items-center"><CFormCheck checked={form.allowLateSubmission} onChange={(e) => setForm((p) => ({ ...p, allowLateSubmission: e.target.checked }))} /></CCol>
              <CCol md={3}><CFormLabel>IA Linked</CFormLabel></CCol>
              <CCol md={3} className="d-flex align-items-center"><CFormCheck checked={form.isIALinked} onChange={(e) => setForm((p) => ({ ...p, isIALinked: e.target.checked }))} /></CCol>
              {form.isIALinked ? (
                <>
                  <CCol md={3}><CFormLabel>CIA Assessment Code</CFormLabel></CCol>
                  <CCol md={3}><CFormSelect value={form.ciaComputationId} onChange={(e) => setForm((p) => ({ ...p, ciaComputationId: e.target.value, iaComponentLabel: '' }))} disabled={Boolean(mappedCiaComputationId)}><option value="">Select</option>{ciaAssessmentCodeOptions.map((x) => <option key={x.id} value={x.id}>{x.ciaAssessmentCode}</option>)}</CFormSelect></CCol>
                  <CCol md={3}><CFormLabel>IA Component Label</CFormLabel></CCol>
                  <CCol md={3}>
                    <CFormSelect value={form.iaComponentLabel} onChange={(e) => setForm((p) => ({ ...p, iaComponentLabel: e.target.value }))}>
                      <option value="">Select</option>
                      {iaComponentOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                    </CFormSelect>
                  </CCol>
                  <CCol md={3}><CFormLabel>Max Marks</CFormLabel></CCol>
                  <CCol md={3}><CFormInput type="number" value={form.maxMarks} onChange={(e) => setForm((p) => ({ ...p, maxMarks: e.target.value }))} /></CCol>
                </>
              ) : null}
            </CRow>
          </CModalBody>
          <CModalFooter>
            <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={() => setModalOpen(false)} />
            <ArpButton label={saving ? 'Saving...' : 'Save'} icon="save" color="primary" onClick={saveAssignment} disabled={saving} />
          </CModalFooter>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default Assignments
