import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * CoursesConfiguration.jsx (ARP CoreUI React Pro Standard - VERIFIED JSX)
 *
 * ✅ Card 1: Course Configuration (Scope Filter)
 * ✅ Card 2: Add / View Course Details (Form)
 * ✅ Card 3: Records of Course Details (ArpDataTable)
 * ✅ Upload: Download Template + Import Excel + Download Error Report (xlsx)
 *
 * Backend endpoints expected:
 * - /api/setup/institution
 * - /api/setup/department
 * - /api/setup/programme
 * - /api/setup/regulation
 * - /api/setup/regulation-map  (for semesters; adjust if needed)
 * - /api/setup/course (+ /template, /import, /export)
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
})

const initialScope = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  semesterPattern: '', // ODD/EVEN
  semester: '', // number string
}

const initialCourseForm = {
  coursePart: '',
  courseType: '',
  courseCode: '',
  courseTitle: '',
  sanctionedIntake: '',
  credits: '',
  lectureTheoryHours: '',
  tutorialHours: '',
  practicalHours: '',
  totalHours: '',
  totalUnits: '',
  totalCIA: '',
  minimumCIA: '',
  totalESE: '',
  minimumESE: '',
  totalMarks: '',
  minimumPassMark: '',
  status: 'ACTIVE', // ACTIVE/INACTIVE
  isCommon: 'NO', // YES/NO (UI)
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

function asNumberOrNull(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function unwrapList(res) {
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.data?.data)) return res.data.data
  return []
}

export default function CoursesConfiguration() {
  // Loading states
  const [loadingMasters, setLoadingMasters] = useState(false)
  const [loadingTable, setLoadingTable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)

  // Alerts
  const [toast, setToast] = useState(null) // {type, message}

  // Masters
  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [semesters, setSemesters] = useState([]) // [{value,label}]

  // Scope
  const [scope, setScope] = useState(initialScope)

  // UI toggles
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState('ADD') // ADD | EDIT | VIEW
  const [showTable, setShowTable] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  // Course form
  const [editingId, setEditingId] = useState(null)
  const [courseForm, setCourseForm] = useState(initialCourseForm)

  // Table rows
  const [rows, setRows] = useState([])
  const [selectedId, setSelectedId] = useState('')


  // Import file
  const [importFile, setImportFile] = useState(null)

  const showMessage = (type, message) => {
    setToast({ type, message })
    window.clearTimeout(window.__arpToastTimer)
    window.__arpToastTimer = window.setTimeout(() => setToast(null), 3500)
  }

  const scopeReady = useMemo(() => {
    return Boolean(
      scope.institutionId &&
        scope.departmentId &&
        scope.programmeId &&
        scope.regulationId &&
        scope.semesterPattern &&
        scope.semester,
    )
  }, [scope])

  const resetCourseForm = () => {
    setEditingId(null)
    setCourseForm(initialCourseForm)
    setFormMode('ADD')
  }

  // -------------------------
  // Masters loaders
  // -------------------------
  const loadInstitutions = async () => {
    setLoadingMasters(true)
    try {
      const res = await api.get('/api/setup/institution')
      setInstitutions(unwrapList(res))
    } catch (e) {
      console.error(e)
      setInstitutions([])
      showMessage('danger', e?.response?.data?.message || 'Failed to load institutions')
    } finally {
      setLoadingMasters(false)
    }
  }

  const loadDepartments = async (institutionId) => {
    setLoadingMasters(true)
    try {
      const res = await api.get('/api/setup/department', {
        params: institutionId ? { institutionId } : {},
      })
      setDepartments(unwrapList(res))
    } catch (e) {
      console.error(e)
      setDepartments([])
      showMessage('danger', e?.response?.data?.message || 'Failed to load departments')
    } finally {
      setLoadingMasters(false)
    }
  }

  const loadProgrammes = async (institutionId, departmentId) => {
    setLoadingMasters(true)
    try {
      const params = {}
      if (institutionId) params.institutionId = institutionId
      if (departmentId) params.departmentId = departmentId

      const res = await api.get('/api/setup/programme', { params })
      const list = unwrapList(res)
      // ✅ Enforce ARP rule: show ONLY programmes of selected department (fallback even if backend returns all)
      const filtered = departmentId ? list.filter((p) => String(p.departmentId) === String(departmentId)) : list
      setProgrammes(filtered)
    } catch (e) {
      console.error(e)
      setProgrammes([])
      showMessage('danger', e?.response?.data?.message || 'Failed to load programmes')
    } finally {
      setLoadingMasters(false)
    }
  }

  const loadRegulations = async (institutionId, programmeId) => {
    setLoadingMasters(true)
    try {
      const params = {}
      if (institutionId) params.institutionId = institutionId
      if (programmeId) params.programmeId = programmeId

      const res = await api.get('/api/setup/regulation', { params })
      setRegulations(unwrapList(res))
    } catch (e) {
      console.error(e)
      setRegulations([])
      showMessage('danger', e?.response?.data?.message || 'Failed to load regulations')
    } finally {
      setLoadingMasters(false)
    }
  }

  const loadSemestersFromRegulationMap = async (
    institutionId,
    programmeId,
    regulationId,
    semesterPattern,
  ) => {
    // Master loader rule: always try/catch/finally
    if (!institutionId || !programmeId || !regulationId || !semesterPattern) {
      setSemesters([])
      return
    }

    setLoadingMasters(true)
    try {
      const res = await api.get('/api/setup/regulation-map', {
        params: { institutionId, programmeId, regulationId, semesterPattern },
      })

      const list = unwrapList(res)
      const distinct = Array.from(
        new Set(list.map((x) => Number(x.semester)).filter((n) => Number.isFinite(n))),
      ).sort((a, b) => a - b)

      setSemesters(distinct.map((n) => ({ value: String(n), label: String(n) })))
    } catch (e) {
      console.error(e)
      setSemesters([])
      // Keep UI usable even if regulation-map is missing
      showMessage('danger', e?.response?.data?.message || 'Failed to load semesters')
    } finally {
      setLoadingMasters(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadInstitutions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
// Cascade: institution -> departments
  useEffect(() => {
    const run = async () => {
      if (!scope.institutionId) {
          setDepartments([])
          setProgrammes([])
          setRegulations([])
          setSemesters([])
          return
        }
      await loadDepartments(scope.institutionId)
    }
// Reset downstream
    setScope((s) => ({
      ...s,
      departmentId: '',
      programmeId: '',
      regulationId: '',
      semesterPattern: '',
      semester: '',
    }))
    setShowTable(false)
    setRows([])
    setShowUpload(false)
    setShowForm(false)
    resetCourseForm()

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.institutionId])

  // Cascade: department -> programmes
  useEffect(() => {
    const run = async () => {
      if (!scope.institutionId || !scope.departmentId) {
          setProgrammes([])
          setRegulations([])
          setSemesters([])
          return
        }
      await loadProgrammes(scope.institutionId, scope.departmentId)
    }
setScope((s) => ({
      ...s,
      programmeId: '',
      regulationId: '',
      semesterPattern: '',
      semester: '',
    }))
    setShowTable(false)
    setRows([])
    setShowUpload(false)
    setShowForm(false)
    resetCourseForm()

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.departmentId])

  // Cascade: programme -> regulations
  useEffect(() => {
    const run = async () => {
      if (!scope.institutionId || !scope.programmeId) {
          setRegulations([])
          setSemesters([])
          return
        }
      await loadRegulations(scope.institutionId, scope.programmeId)
    }
setScope((s) => ({
      ...s,
      regulationId: '',
      semesterPattern: '',
      semester: '',
    }))
    setShowTable(false)
    setRows([])
    setShowUpload(false)
    setShowForm(false)
    resetCourseForm()

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.programmeId])

  // Cascade: regulation/pattern -> semesters
  useEffect(() => {
    loadSemestersFromRegulationMap(scope.institutionId, scope.programmeId, scope.regulationId, scope.semesterPattern)
    setScope((s) => ({ ...s, semester: '' }))
    setShowTable(false)
    setRows([])
    setShowUpload(false)
    setShowForm(false)
    resetCourseForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope.regulationId, scope.semesterPattern])

  // -------------------------
  // Courses API
  // -------------------------
  const loadCourses = async () => {
    try {
      setLoadingTable(true)
      const params = {
        institutionId: scope.institutionId,
        departmentId: scope.departmentId,
        programmeId: scope.programmeId,
        regulationId: scope.regulationId,
        semesterPattern: scope.semesterPattern,
        semester: scope.semester,
      }
      const res = await api.get('/api/setup/course', { params })

            setRows(unwrapList(res)) // ✅ ARP: supports interceptor/non-interceptor
      setShowTable(true)
    } catch (e) {
      console.error(e)
      showMessage('danger', e?.response?.data?.message || 'Failed to load courses')
    } finally {
      setLoadingTable(false)
    }
  }


  const validateBeforeSave = () => {
    if (!scopeReady) return 'Please select Institution, Department, Programme, Regulation, Academic Pattern and Semester.'
    if (!courseForm.coursePart.trim()) return 'Part of the Course is required.'
    if (!courseForm.courseType.trim()) return 'Course Type is required.'
    if (!courseForm.courseCode.trim()) return 'Course Code is required.'
    if (!courseForm.courseTitle.trim()) return 'Course Title is required.'
    return null
  }

  const buildPayloadFromForm = () => {
    const payload = {
      institutionId: scope.institutionId,
      departmentId: scope.departmentId,
      programmeId: scope.programmeId,
      regulationId: scope.regulationId,
      semesterPattern: scope.semesterPattern,
      semester: Number(scope.semester),

      coursePart: courseForm.coursePart.trim(),
      courseType: courseForm.courseType.trim(),
      courseCode: courseForm.courseCode.trim(),
      courseTitle: (
          typeof courseForm.courseTitle === 'string'
            ? courseForm.courseTitle.trim()
            : String(courseForm.courseTitle?.label || courseForm.courseTitle?.name || '').trim()
        ),

      sanctionedIntake: asNumberOrNull(courseForm.sanctionedIntake),
      credits: asNumberOrNull(courseForm.credits),

      lectureTheoryHours: asNumberOrNull(courseForm.lectureTheoryHours),
      tutorialHours: asNumberOrNull(courseForm.tutorialHours),
      practicalHours: asNumberOrNull(courseForm.practicalHours),
      totalHours: asNumberOrNull(courseForm.totalHours),
      totalUnits: asNumberOrNull(courseForm.totalUnits),

      totalCIA: asNumberOrNull(courseForm.totalCIA),
      minimumCIA: asNumberOrNull(courseForm.minimumCIA),
      totalESE: asNumberOrNull(courseForm.totalESE),
      minimumESE: asNumberOrNull(courseForm.minimumESE),

      totalMarks: asNumberOrNull(courseForm.totalMarks),
      minimumPassMark: asNumberOrNull(courseForm.minimumPassMark),

      status: courseForm.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      isCommon: String(courseForm.isCommon).toUpperCase() === 'YES',
    }

    Object.keys(payload).forEach((k) => {
      if (payload[k] === null) delete payload[k]
    })
    return payload
  }

  const onSave = async () => {
    const msg = validateBeforeSave()
    if (msg) {
      showMessage('danger', msg)
      return
    }

    try {
      setSaving(true)
      const payload = buildPayloadFromForm()

      if (editingId) {
        await api.put(`/api/setup/course/${editingId}`, payload)
        showMessage('success', 'Course updated successfully')
      } else {
        await api.post('/api/setup/course', payload)
        showMessage('success', 'Course saved successfully')
      }

      await loadCourses()
      setShowForm(false)
      resetCourseForm()
    } catch (e) {
      console.error(e)
      if (e?.response?.status === 409) {
        showMessage('danger', 'Duplicate Course Code for the selected Regulation.')
      } else {
        showMessage('danger', e?.response?.data?.message || 'Failed to save course')
      }
    } finally {
      setSaving(false)
    }
  }

  const onCancel = () => {
    setShowForm(false)
    resetCourseForm()
  }

  const onAddNewCourse = () => {
    if (!scopeReady) {
      showMessage('danger', 'Select scope first (Institution → Department → Programme → Regulation → Academic Pattern → Semester).')
      return
    }
    setShowUpload(false)
    setShowForm(true)
    setFormMode('ADD')
    setEditingId(null)
    setCourseForm(initialCourseForm)
  }

  const onViewCourses = async () => {
    if (!scopeReady) {
      showMessage('danger', 'Select scope first (Institution → Department → Programme → Regulation → Academic Pattern → Semester).')
      return
    }
    setShowUpload(false)
    await loadCourses()
  }

  const onUploadCourses = () => {
    if (!scopeReady) {
      showMessage('danger', 'Scope is mandatory to upload courses.')
      return
    }
    setShowUpload(true)
    setShowForm(false)
  }

  const onDeleteRow = async (row) => {
    const ok = window.confirm(`Delete course ${row.courseCode}?`)
    if (!ok) return
    try {
      await api.delete(`/api/setup/course/${row.id}`)
      showMessage('success', 'Course deleted successfully')
      await loadCourses()
    } catch (e) {
      console.error(e)
      showMessage('danger', e?.response?.data?.message || 'Failed to delete course')
    }
  }

  const openRowInForm = (row, mode) => {
    setShowUpload(false)
    setShowForm(true)
    setFormMode(mode)
    setEditingId(row.id)

    setCourseForm({
      coursePart: row.coursePart || '',
      courseType: row.courseType || '',
      courseCode: row.courseCode || '',
      courseTitle: row.courseTitle || '',
      sanctionedIntake: row.sanctionedIntake ?? '',
      credits: row.credits ?? '',
      lectureTheoryHours: row.lectureTheoryHours ?? '',
      tutorialHours: row.tutorialHours ?? '',
      practicalHours: row.practicalHours ?? '',
      totalHours: row.totalHours ?? '',
      totalUnits: row.totalUnits ?? '',
      totalCIA: row.totalCIA ?? '',
      minimumCIA: row.minimumCIA ?? '',
      totalESE: row.totalESE ?? '',
      minimumESE: row.minimumESE ?? '',
      totalMarks: row.totalMarks ?? '',
      minimumPassMark: row.minimumPassMark ?? '',
      status: row.status || 'ACTIVE',
      isCommon: row.isCommon ? 'YES' : 'NO',
    })
  }

  // -------------------------
  // Excel
  // -------------------------
  const downloadTemplate = async () => {
    if (!scopeReady) {
      showMessage('danger', 'Scope is mandatory for template download.')
      return
    }
    try {
      const res = await api.get('/api/setup/course/template', {
        params: {
          institutionId: scope.institutionId,
          departmentId: scope.departmentId,
          programmeId: scope.programmeId,
          regulationId: scope.regulationId,
          semesterPattern: scope.semesterPattern,
          semester: scope.semester,
        },
        responseType: 'blob',
      })
      downloadBlob(res.data, 'Course_Data_Template.xlsx')
      showMessage('success', 'Template downloaded')
    } catch (e) {
      console.error(e)
      showMessage('danger', e?.response?.data?.message || 'Failed to download template')
    }
  }

  const exportCourses = async () => {
    if (!scopeReady) {
      showMessage('danger', 'Select scope first to export.')
      return
    }
    try {
      const res = await api.get('/api/setup/course/export', {
        params: {
          institutionId: scope.institutionId,
          departmentId: scope.departmentId,
          programmeId: scope.programmeId,
          regulationId: scope.regulationId,
          semesterPattern: scope.semesterPattern,
          semester: scope.semester,
        },
        responseType: 'blob',
      })
      downloadBlob(res.data, 'Courses_Export.xlsx')
    } catch (e) {
      console.error(e)
      showMessage('danger', 'Failed to export courses')
    }
  }

  const importExcel = async () => {
    if (!scopeReady) {
      showMessage('danger', 'Scope is mandatory for import.')
      return
    }
    if (!importFile) {
      showMessage('danger', 'Choose an Excel file to import.')
      return
    }

    try {
      setImporting(true)
      const fd = new FormData()
      fd.append('file', importFile)

      const res = await api.post('/api/setup/course/import', fd, {
        params: {
          institutionId: scope.institutionId,
          departmentId: scope.departmentId,
          programmeId: scope.programmeId,
          regulationId: scope.regulationId,
          semesterPattern: scope.semesterPattern,
          semester: scope.semester,
        },
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
        validateStatus: (status) => status >= 200 && status < 500,
      })

      const contentType = res.headers?.['content-type'] || ''

      if (contentType.includes('application/json')) {
        const text = await res.data.text()
        const data = JSON.parse(text)
        showMessage('success', data.message || 'Import completed successfully')
        setImportFile(null)
        await loadCourses()
        setShowTable(true)
        return
      }

      if (res.status >= 400) {
        downloadBlob(res.data, 'Course_Import_Errors.xlsx')
        showMessage('danger', 'Import completed with errors (error sheet downloaded)')
        return
      }

      if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
        downloadBlob(res.data, 'Course_Import_Result.xlsx')
        showMessage('success', 'Import completed')
        setImportFile(null)
        await loadCourses()
        return
      }

      showMessage('success', 'Import completed')
      setImportFile(null)
      await loadCourses()
    } catch (e) {
      console.error(e)
      showMessage('danger', 'Failed to import excel')
    } finally {
      setImporting(false)
    }
  }

  // -------------------------
  // Table
  // -------------------------
  const columns = useMemo(
    () => [
      { key: 'courseCode', label: 'Course Code' },
      { key: 'courseTitle', label: 'Course Title' },
      { key: 'coursePart', label: 'Part' },
      { key: 'courseType', label: 'Type' },
      { key: 'credits', label: 'Credits' },
      { key: 'totalHours', label: 'Total Hours' },
      { key: 'totalCIA', label: 'Total CIA' },
      { key: 'totalESE', label: 'Total ESE' },
      { key: 'status', label: 'Status' },
    ],
    [],
  )


  const selectedRow = useMemo(() => {
    if (!Array.isArray(rows) || !selectedId) return null
    return rows.find((r) => r?.id === selectedId) || null
  }, [rows, selectedId])

  const onViewSelected = () => {
    if (!selectedRow) return
    openRowInForm(selectedRow, 'VIEW')
  }

  const onEditSelected = () => {
    if (!selectedRow) return
    openRowInForm(selectedRow, 'EDIT')
  }

  const onDeleteSelected = async () => {
    if (!selectedRow) return
    await onDeleteRow(selectedRow)
    setSelectedId('')
  }

  const tableActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onViewSelected} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEditSelected} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDeleteSelected} disabled={!selectedId} />
      <ArpIconButton icon="download" title="Download" onClick={exportCourses} disabled={!Array.isArray(rows) || rows.length === 0} />
    </div>
  )

  // -------------------------
  // UI
  // -------------------------
  return (
    <div>
      {toast?.message ? (
        <CAlert color={toast.type} className="mb-3">
          {toast.message}
        </CAlert>
      ) : null}

      {/* Card 1 */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex align-items-center justify-content-between">
          <div className="fw-semibold">Course Configuration</div>

          <div className="d-flex gap-2">
            <ArpButton
              color="success"
              icon="add"
              label="Add New Course"
              onClick={onAddNewCourse}
              disabled={!scopeReady}
            />
            <ArpButton
              color="info"
              icon="view"
              label="View Courses"
              onClick={onViewCourses}
              disabled={!scopeReady}
            />
            <ArpButton
              color="warning"
              icon="upload"
              label="Upload Courses"
              onClick={onUploadCourses}
              disabled={!scopeReady}
            />
          </div>
        </CCardHeader>

        <CCardBody>
          {loadingMasters ? (
            <div className="d-flex align-items-center gap-2">
              <CSpinner size="sm" />
              <span>Loading masters...</span>
            </div>
          ) : (
            <CForm>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={3}>
                  <CFormLabel>Institution</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={scope.institutionId}
                    onChange={(e) => setScope((s) => ({ ...s, institutionId: e.target.value }))}
                  >
                    <option value="">Select Institution</option>
                    {institutions.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.code ? `${x.code} - ${x.name}` : x.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Department</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={scope.departmentId}
                    onChange={(e) => setScope((s) => ({ ...s, departmentId: e.target.value }))}
                    disabled={!scope.institutionId}
                  >
                    <option value="">Select Department</option>
                    {departments.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.departmentCode
                          ? `${x.departmentCode} - ${x.departmentName}`
                          : x.departmentName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={scope.programmeId}
                    onChange={(e) => setScope((s) => ({ ...s, programmeId: e.target.value }))}
                    disabled={!scope.departmentId}
                  >
                    <option value="">Select Programme</option>
                    {programmes.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.programmeCode
                          ? `${x.programmeCode} - ${x.programmeName}`
                          : x.programmeName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Regulation</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={scope.regulationId}
                    onChange={(e) => setScope((s) => ({ ...s, regulationId: e.target.value }))}
                    disabled={!scope.programmeId}
                  >
                    <option value="">Select Regulation</option>
                    {regulations.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.regulationCode ? `${x.regulationCode}` : x.name || 'Regulation'}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Academic Pattern</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={scope.semesterPattern}
                    onChange={(e) => setScope((s) => ({ ...s, semesterPattern: e.target.value }))}
                    disabled={!scope.regulationId}
                  >
                    <option value="">Select Pattern</option>
                    <option value="ODD">ODD</option>
                    <option value="EVEN">EVEN</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={scope.semester}
                    onChange={(e) => setScope((s) => ({ ...s, semester: e.target.value }))}
                    disabled={!scope.semesterPattern}
                  >
                    <option value="">Select Semester</option>
                    {semesters.length ? (
                      semesters.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                      </>
                    )}
                  </CFormSelect>
                </CCol>
              </CRow>
            </CForm>
          )}
        </CCardBody>
      </CCard>

      {/* Card 2 */}
      {showForm ? (
        <CCard className="mb-3">
          <CCardHeader className="d-flex align-items-center justify-content-between">
            <div className="fw-semibold">Add / View Course Details</div>
            <div className="small text-muted">
              {formMode === 'VIEW' ? 'View' : formMode === 'EDIT' ? 'Edit' : 'Add'}
            </div>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                {/* Row 1 */}
                <CCol md={3}>
                  <CFormLabel>Part of the Course</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    placeholder="I/II/III/IV/V"
                    value={courseForm.coursePart}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, coursePart: e.target.value }))}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Course Type</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    placeholder="Theory / Practical"
                    value={courseForm.courseType}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, courseType: e.target.value }))}
                  />
                </CCol>

                {/* Row 2 */}
                <CCol md={3}>
                  <CFormLabel>Course Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={courseForm.courseCode}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, courseCode: e.target.value }))}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Course Title</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    placeholder="Course Name / Title"
                    value={courseForm.courseTitle}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, courseTitle: e.target.value }))}
                  />
                </CCol>

                {/* Row 3 */}
                <CCol md={3}>
                  <CFormLabel>Sanction Intake</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.sanctionedIntake}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) =>
                      setCourseForm((f) => ({ ...f, sanctionedIntake: e.target.value }))
                    }
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Total Credits</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.credits}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, credits: e.target.value }))}
                  />
                </CCol>

                {/* Row 4 */}
                <CCol md={3}>
                  <CFormLabel>Lecture / Theory Hours</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.lectureTheoryHours}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) =>
                      setCourseForm((f) => ({ ...f, lectureTheoryHours: e.target.value }))
                    }
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Tutorial Hours</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.tutorialHours}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) =>
                      setCourseForm((f) => ({ ...f, tutorialHours: e.target.value }))
                    }
                  />
                </CCol>

                {/* Row 5 */}
                <CCol md={3}>
                  <CFormLabel>Practical Hours</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.practicalHours}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) =>
                      setCourseForm((f) => ({ ...f, practicalHours: e.target.value }))
                    }
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Total Hours</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.totalHours}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, totalHours: e.target.value }))}
                  />
                </CCol>

                {/* Row 6 */}
                <CCol md={3}>
                  <CFormLabel>Total Units / Modules</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.totalUnits}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, totalUnits: e.target.value }))}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Total CIA Marks</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.totalCIA}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, totalCIA: e.target.value }))}
                  />
                </CCol>

                {/* Row 7 */}
                <CCol md={3}>
                  <CFormLabel>Minimum CIA Marks</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.minimumCIA}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, minimumCIA: e.target.value }))}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Total ESE Marks</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.totalESE}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, totalESE: e.target.value }))}
                  />
                </CCol>

                {/* Row 8 */}
                <CCol md={3}>
                  <CFormLabel>Minimum ESE Marks</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.minimumESE}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, minimumESE: e.target.value }))}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Total Marks</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.totalMarks}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, totalMarks: e.target.value }))}
                  />
                </CCol>

                {/* Row 9 */}
                <CCol md={3}>
                  <CFormLabel>Minimum Pass Marks</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    type="number"
                    value={courseForm.minimumPassMark}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) =>
                      setCourseForm((f) => ({ ...f, minimumPassMark: e.target.value }))
                    }
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Course Status</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={courseForm.status}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">In-Active</option>
                  </CFormSelect>
                </CCol>

                {/* Row 10 */}
                <CCol md={3}>
                  <CFormLabel>Is Common Course</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={courseForm.isCommon}
                    disabled={formMode === 'VIEW'}
                    onChange={(e) => setCourseForm((f) => ({ ...f, isCommon: e.target.value }))}
                  >
                    <option value="NO">No</option>
                    <option value="YES">Yes</option>
                  </CFormSelect>
                </CCol>

                <CCol md={6} className="d-flex justify-content-end align-items-end gap-2">
                  {formMode === 'VIEW' ? null : (
                    <ArpButton
                      color="success"
                      icon="save"
                      label={saving ? 'Saving...' : 'Save'}
                      onClick={onSave}
                      disabled={saving}
                    />
                  )}
                  <ArpButton color="secondary" icon="cancel" label="Cancel" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      ) : null}

      {/* Upload */}
      {showUpload ? (
        <CCard className="mb-3">
          <CCardHeader className="d-flex align-items-center justify-content-between">
            <div className="fw-semibold">Upload Courses</div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3 align-items-end">
              <CCol md={3}>
                <ArpButton
                  color="info"
                  icon="download"
                  label="Download Template"
                  onClick={downloadTemplate}
                  disabled={!scopeReady}
                />
              </CCol>

              <CCol md={6}>
                <CFormLabel className="mb-0">Choose File</CFormLabel>
                <CFormInput
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
              </CCol>

              <CCol md={3} className="d-flex justify-content-end">
                <ArpButton
                  color="warning"
                  icon="upload"
                  label={importing ? 'Importing...' : 'Import Excel'}
                  onClick={importExcel}
                  disabled={!importFile || importing || !scopeReady}
                />
              </CCol>
            </CRow>

            <CAlert color="info" className="mt-3 mb-0">
              Scope is mandatory for import (Institution, Department, Programme, Regulation,
              Academic Pattern, Semester). If any row has error, an Excel error report will be
              downloaded.
            </CAlert>
          </CCardBody>
        </CCard>
      ) : null}

      {/* Card 3 */}
      {showTable ? (
        <CCard className="mb-3">
          <CCardHeader className="d-flex align-items-center justify-content-between">
            <div className="fw-semibold">Records of Course Details</div>
          </CCardHeader>
          <CCardBody>
            {loadingTable ? (
              <div className="d-flex align-items-center gap-2">
                <CSpinner size="sm" />
                <span>Loading courses...</span>
              </div>
            ) : (
              <ArpDataTable
                title="Records of Course Details"
                rows={rows}
                loading={loadingTable}
                columns={columns}
                rowKey="id"
                headerActions={tableActions}
                selection={{
                  type: 'radio',
                  selected: selectedId,
                  onChange: (id) => setSelectedId(id),
                  key: 'id',
                  headerLabel: 'Select',
                  width: 60,
                  name: 'courseRow',
                }}
              />
            )}
          </CCardBody>
        </CCard>
      ) : null}
    </div>
  )
}
