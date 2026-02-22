import React, { useEffect, useMemo, useRef, useState } from 'react'
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
import api from '../../services/apiClient'
import { semesterOptionsFromAcademicYear } from '../../services/lmsService'

const initialScope = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
  className: '',
  section: '',
}

const initialNewStudent = {
  registerNumber: '',
  firstName: '',
  gender: '',
}

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export default function StudentConfiguration() {
  const [scope, setScope] = useState(initialScope)
  const [newStudent, setNewStudent] = useState(initialNewStudent)
  const [isAddNew, setIsAddNew] = useState(false)
  const [message, setMessage] = useState(null)

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [classes, setClasses] = useState([])
  const [mappedSemesters, setMappedSemesters] = useState([])

  const [rows, setRows] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [previewSummary, setPreviewSummary] = useState(null)
  const [importSummary, setImportSummary] = useState(null)
  const [loadingMasters, setLoadingMasters] = useState(false)
  const [loadingRows, setLoadingRows] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [saving, setSaving] = useState(false)

  const fileRef = useRef(null)

  const showMessage = (type, text) => setMessage({ type, text })
  const scopeReady = useMemo(
    () =>
      Boolean(
        scope.institutionId &&
          scope.departmentId &&
          scope.programmeId &&
          scope.regulationId &&
          scope.academicYearId &&
          scope.batchId &&
          scope.semester &&
          scope.className &&
          scope.section,
      ),
    [scope],
  )

  const scopeParams = useMemo(
    () => ({
      institutionId: scope.institutionId,
      departmentId: scope.departmentId,
      programmeId: scope.programmeId,
      regulationId: scope.regulationId,
      academicYearId: scope.academicYearId,
      batchId: scope.batchId,
      semester: scope.semester,
      className: scope.className,
      section: scope.section,
    }),
    [scope],
  )

  const selectedRow = useMemo(
    () => rows.find((r) => String(r.configId) === String(selectedId)) || null,
    [rows, selectedId],
  )

  const loadInstitutions = async () => {
    setLoadingMasters(true)
    try {
      const res = await api.get('/api/setup/institution')
      setInstitutions(unwrapList(res))
    } catch {
      setInstitutions([])
      showMessage('danger', 'Failed to load institutions')
    } finally {
      setLoadingMasters(false)
    }
  }

  const loadDepartments = async (institutionId) => {
    try {
      const res = await api.get('/api/setup/department', { params: { institutionId } })
      setDepartments(unwrapList(res))
    } catch {
      setDepartments([])
    }
  }

  const loadProgrammes = async (institutionId, departmentId) => {
    try {
      const res = await api.get('/api/setup/programme')
      const all = unwrapList(res)
      setProgrammes(
        all.filter(
          (p) =>
            String(p.institutionId) === String(institutionId) &&
            String(p.departmentId) === String(departmentId),
        ),
      )
    } catch {
      setProgrammes([])
    }
  }

  const loadRegulations = async (institutionId, programmeId) => {
    try {
      const res = await api.get('/api/setup/regulation', {
        params: { institutionId, programmeId },
      })
      setRegulations(unwrapList(res))
    } catch {
      setRegulations([])
    }
  }

  const loadAcademicYears = async (institutionId) => {
    try {
      const res = await api.get('/api/setup/academic-year', {
        headers: { 'x-institution-id': institutionId },
      })
      setAcademicYears(unwrapList(res))
    } catch {
      setAcademicYears([])
    }
  }

  const loadBatches = async (institutionId) => {
    try {
      const res = await api.get('/api/setup/batch', { params: { institutionId } })
      setBatches(unwrapList(res))
    } catch {
      setBatches([])
    }
  }

  const loadClasses = async (institutionId, departmentId, programmeId) => {
    try {
      const res = await api.get('/api/setup/class', {
        params: { institutionId, departmentId, programmeId },
      })
      setClasses(unwrapList(res))
    } catch {
      setClasses([])
    }
  }

  const loadMappedSemesters = async ({
    institutionId,
    academicYearId,
    programmeId,
    regulationId,
    batchId,
  }) => {
    try {
      const res = await api.get('/api/setup/regulation-map', {
        params: { institutionId, academicYearId, programmeId, regulationId, batchId },
      })
      const maps = unwrapList(res).filter((m) => String(m?.status || '').toLowerCase() === 'map done')
      const sems = maps
        .map((m) => Number(m?.semester))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b)
      setMappedSemesters([...new Set(sems)])
    } catch {
      setMappedSemesters([])
    }
  }

  useEffect(() => {
    loadInstitutions()
  }, [])

  useEffect(() => {
    if (!scope.institutionId) {
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      setClasses([])
      setMappedSemesters([])
      return
    }
    setScope((s) => ({
      ...s,
      departmentId: '',
      programmeId: '',
      regulationId: '',
      academicYearId: '',
      batchId: '',
      semester: '',
      className: '',
      section: '',
    }))
    setRows([])
    setSelectedId(null)
    setIsAddNew(false)
    loadDepartments(scope.institutionId)
    loadAcademicYears(scope.institutionId)
    loadBatches(scope.institutionId)
  }, [scope.institutionId])

  useEffect(() => {
    if (!scope.institutionId || !scope.departmentId) {
      setProgrammes([])
      setRegulations([])
      setClasses([])
      setMappedSemesters([])
      return
    }
    setScope((s) => ({
      ...s,
      programmeId: '',
      regulationId: '',
      className: '',
      section: '',
    }))
    setRows([])
    setSelectedId(null)
    setIsAddNew(false)
    loadProgrammes(scope.institutionId, scope.departmentId)
  }, [scope.departmentId])

  useEffect(() => {
    if (!scope.institutionId || !scope.programmeId) {
      setRegulations([])
      setClasses([])
      setMappedSemesters([])
      return
    }
    setScope((s) => ({ ...s, regulationId: '', className: '', section: '' }))
    setRows([])
    setSelectedId(null)
    setIsAddNew(false)
    loadRegulations(scope.institutionId, scope.programmeId)
    loadClasses(scope.institutionId, scope.departmentId, scope.programmeId)
  }, [scope.programmeId])

  useEffect(() => {
    setScope((s) => ({ ...s, semester: '' }))
  }, [scope.academicYearId])

  useEffect(() => {
    if (
      !scope.institutionId ||
      !scope.programmeId ||
      !scope.regulationId ||
      !scope.academicYearId ||
      !scope.batchId
    ) {
      setMappedSemesters([])
      setScope((s) => ({ ...s, semester: '' }))
      return
    }
    loadMappedSemesters({
      institutionId: scope.institutionId,
      academicYearId: scope.academicYearId,
      programmeId: scope.programmeId,
      regulationId: scope.regulationId,
      batchId: scope.batchId,
    })
  }, [
    scope.institutionId,
    scope.programmeId,
    scope.regulationId,
    scope.academicYearId,
    scope.batchId,
  ])

  const classNameOptions = useMemo(() => {
    const map = new Map()
    classes.forEach((c) => {
      const name = String(c?.className || '').trim()
      if (name && !map.has(name)) map.set(name, name)
    })
    return Array.from(map.values())
  }, [classes])

  const sectionOptions = useMemo(() => {
    const selectedClass = String(scope.className || '').trim()
    const list = classes.filter((c) => String(c?.className || '').trim() === selectedClass)
    const map = new Map()
    list.forEach((c) => {
      const sec = String(c?.classLabel || '').trim()
      if (sec && !map.has(sec)) map.set(sec, sec)
    })
    return Array.from(map.values())
  }, [classes, scope.className])

  const semesterOptions = useMemo(() => {
    const ay = academicYears.find((x) => String(x.id) === String(scope.academicYearId))
    if (!ay) return []

    const allowedByAcademicYear = semesterOptionsFromAcademicYear(ay)
      .map((opt) => Number(opt?.value))
      .filter((n) => Number.isFinite(n) && n > 0)

    if (!allowedByAcademicYear.length) return []
    if (!mappedSemesters.length) return allowedByAcademicYear

    const allowedSet = new Set(allowedByAcademicYear)
    return [...new Set(mappedSemesters)]
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && allowedSet.has(n))
      .sort((a, b) => a - b)
  }, [mappedSemesters, academicYears, scope.academicYearId])

  const loadStudents = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete selection scope before search.')
    setLoadingRows(true)
    try {
      const res = await api.get('/api/setup/student', { params: scopeParams })
      setRows(unwrapList(res))
      setSelectedId(null)
    } catch (e) {
      setRows([])
      showMessage('danger', e?.response?.data?.error || 'Failed to load students')
    } finally {
      setLoadingRows(false)
    }
  }

  const onAddNew = () => {
    if (!scopeReady) {
      showMessage('danger', 'Complete selection scope from Institution to Section before adding.')
      return
    }
    setNewStudent(initialNewStudent)
    setSelectedId(null)
    setIsAddNew(true)
  }

  const onView = () => {
    if (!selectedRow) return
    setNewStudent({
      registerNumber: selectedRow.registerNumber || '',
      firstName: selectedRow.firstName || '',
      gender: selectedRow.gender || '',
    })
    setIsAddNew(false)
  }

  const onEdit = () => {
    if (!selectedRow) return
    setNewStudent({
      registerNumber: selectedRow.registerNumber || '',
      firstName: selectedRow.firstName || '',
      gender: selectedRow.gender || '',
    })
    setIsAddNew(true)
  }

  const onDelete = async () => {
    if (!selectedRow) return
    if (!window.confirm('Delete selected student?')) return
    try {
      await api.delete(`/api/setup/student/${selectedRow.configId}`, {
        params: scopeParams,
      })
      showMessage('success', 'Student deleted successfully')
      setSelectedId(null)
      await loadStudents()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to delete student')
    }
  }

  const onSaveNew = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete selection scope before saving.')
    if (!newStudent.registerNumber.trim()) return showMessage('danger', 'Register Number is required')
    if (!newStudent.firstName.trim()) return showMessage('danger', 'First Name is required')
    if (!newStudent.gender) return showMessage('danger', 'Gender is required')

    setSaving(true)
    try {
      await api.post('/api/setup/student', {
        ...scopeParams,
        registerNumber: newStudent.registerNumber.trim(),
        firstName: newStudent.firstName.trim(),
        gender: newStudent.gender,
      })
      showMessage('success', 'Student saved successfully')
      setIsAddNew(false)
      setNewStudent(initialNewStudent)
      await loadStudents()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to save student')
    } finally {
      setSaving(false)
    }
  }

  const onDownloadTemplate = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete selection scope from Institution to Section before downloading template.')
    try {
      const res = await api.get('/api/setup/student/template', {
        params: scopeParams,
        responseType: 'blob',
      })
      downloadBlob(res.data, 'Student_Data_Template.xlsx')
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to download template')
    }
  }

  const onExport = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete selection scope before export.')
    try {
      const res = await api.get('/api/setup/student/export', {
        params: scopeParams,
        responseType: 'blob',
      })
      downloadBlob(res.data, 'Students_Export.xlsx')
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to export students')
    }
  }

  const onPreviewImport = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete selection scope before preview.')
    const file = fileRef.current?.files?.[0]
    if (!file) return showMessage('danger', 'Choose an Excel file first.')

    setPreviewing(true)
    setPreviewSummary(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/api/setup/student/import/preview', fd, {
        params: scopeParams,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPreviewSummary(res?.data?.data || null)
      showMessage('success', 'Preview generated.')
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to preview import')
    } finally {
      setPreviewing(false)
    }
  }

  const onImport = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete selection scope before import.')
    const file = fileRef.current?.files?.[0]
    if (!file) return showMessage('danger', 'Choose an Excel file first.')

    setImporting(true)
    setImportSummary(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/api/setup/student/import', fd, {
        params: scopeParams,
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
        validateStatus: (status) => status >= 200 && status < 500,
      })

      const contentType = res.headers?.['content-type'] || ''
      if (contentType.includes('application/json')) {
        const text = await res.data.text()
        const data = JSON.parse(text)
        setImportSummary(data?.data || null)
        showMessage('success', data?.message || 'Student import completed successfully.')
        if (fileRef.current) fileRef.current.value = ''
        await loadStudents()
        return
      }

      if (res.status >= 400) {
        downloadBlob(res.data, 'Student_Import_Errors.xlsx')
        showMessage('danger', 'Import completed with errors (error sheet downloaded).')
        return
      }

      showMessage('success', 'Student import completed successfully.')
      if (fileRef.current) fileRef.current.value = ''
      await loadStudents()
    } catch {
      showMessage('danger', 'Failed to import students')
    } finally {
      setImporting(false)
    }
  }

  const onCancel = () => {
    setRows([])
    setSelectedId(null)
    setPreviewSummary(null)
    setImportSummary(null)
    setMessage(null)
    setIsAddNew(false)
    setNewStudent(initialNewStudent)
    if (fileRef.current) fileRef.current.value = ''
  }

  const columns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true, width: 130, align: 'center' },
      { key: 'academicPattern', label: 'Pattern', sortable: true, width: 100, align: 'center' },
      { key: 'semester', label: 'Semester', sortable: true, width: 90, align: 'center' },
      { key: 'programmeCode', label: 'Programme Code', sortable: true, width: 140, align: 'center' },
      { key: 'programmeName', label: 'Programme Name', sortable: true, width: 220 },
      { key: 'batch', label: 'Batch', sortable: true, width: 120, align: 'center' },
      { key: 'registerNumber', label: 'Register Number', sortable: true, width: 140, align: 'center' },
      { key: 'firstName', label: 'First Name', sortable: true, width: 150 },
      { key: 'gender', label: 'Gender', sortable: true, width: 90, align: 'center' },
      { key: 'className', label: 'Class Name', sortable: true, width: 120, align: 'center' },
      { key: 'section', label: 'Section', sortable: true, width: 90, align: 'center' },
    ],
    [],
  )

  const tableActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        {message ? <CAlert color={message.type}>{message.text}</CAlert> : null}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>STUDENTS CONFIGURATION</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="Download Template" icon="download" color="secondary" onClick={onDownloadTemplate} disabled={!scopeReady} />
              <ArpButton label="Export" icon="download" color="info" onClick={onExport} disabled={!scopeReady} />
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
                  <CCol md={2}><CFormLabel>Institution</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect value={scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, institutionId: e.target.value }))}>
                      <option value="">Select Institution</option>
                      {institutions.map((x) => (
                        <option key={x.id} value={x.id}>{x.code ? `${x.code} - ${x.name}` : x.name}</option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={2}><CFormLabel>Department</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect value={scope.departmentId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, departmentId: e.target.value }))}>
                      <option value="">Select Department</option>
                      {departments.map((x) => (
                        <option key={x.id} value={x.id}>{x.departmentCode ? `${x.departmentCode} - ${x.departmentName}` : x.departmentName}</option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={2}><CFormLabel>Programme</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect value={scope.programmeId} disabled={!scope.departmentId} onChange={(e) => setScope((s) => ({ ...s, programmeId: e.target.value }))}>
                      <option value="">Select Programme</option>
                      {programmes.map((x) => (
                        <option key={x.id} value={x.id}>{x.programmeCode ? `${x.programmeCode} - ${x.programmeName}` : x.programmeName}</option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={2}><CFormLabel>Regulation</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect value={scope.regulationId} disabled={!scope.programmeId} onChange={(e) => setScope((s) => ({ ...s, regulationId: e.target.value }))}>
                      <option value="">Select Regulation</option>
                      {regulations.map((x) => (
                        <option key={x.id} value={x.id}>{x.regulationCode}</option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={2}><CFormLabel>Academic Year</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect value={scope.academicYearId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, academicYearId: e.target.value }))}>
                      <option value="">Select Academic Year</option>
                      {academicYears.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.academicYearLabel || `${x.academicYear}${x.semesterCategory ? ` (${x.semesterCategory})` : ''}`}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={2}><CFormLabel>Batch</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect value={scope.batchId} disabled={!scope.institutionId} onChange={(e) => setScope((s) => ({ ...s, batchId: e.target.value }))}>
                      <option value="">Select Batch</option>
                      {batches.map((x) => (
                        <option key={x.id} value={x.id}>{x.batchName}</option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={2}><CFormLabel>Semester</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect value={scope.semester} disabled={!scope.academicYearId} onChange={(e) => setScope((s) => ({ ...s, semester: e.target.value }))}>
                      <option value="">Select Semester</option>
                      {semesterOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  {scope.academicYearId && scope.regulationId && scope.batchId && semesterOptions.length === 0 ? (
                    <CCol xs={12}>
                      <CAlert color="warning" className="mb-0">
                        No Regulation Map found for selected Academic Year + Programme + Regulation + Batch.
                        Configure it in Regulation Map before Student operations.
                      </CAlert>
                    </CCol>
                  ) : null}

                  <CCol md={2}><CFormLabel>Class Name</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect
                      value={scope.className}
                      disabled={!scope.institutionId || !scope.departmentId || !scope.programmeId}
                      onChange={(e) => setScope((s) => ({ ...s, className: e.target.value, section: '' }))}
                    >
                      <option value="">Select Class</option>
                      {classNameOptions.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={2}><CFormLabel>Section</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect
                      value={scope.section}
                      disabled={!scope.className}
                      onChange={(e) => setScope((s) => ({ ...s, section: e.target.value }))}
                    >
                      <option value="">Select Section</option>
                      {sectionOptions.map((sec) => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={2}><CFormLabel>Register Number</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput
                      value={newStudent.registerNumber}
                      disabled={!isAddNew}
                      onChange={(e) => setNewStudent((s) => ({ ...s, registerNumber: e.target.value }))}
                    />
                  </CCol>

                  <CCol md={2}><CFormLabel>First Name</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput
                      value={newStudent.firstName}
                      disabled={!isAddNew}
                      onChange={(e) => setNewStudent((s) => ({ ...s, firstName: e.target.value }))}
                    />
                  </CCol>

                  <CCol md={2}><CFormLabel>Gender</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect
                      value={newStudent.gender}
                      disabled={!isAddNew}
                      onChange={(e) => setNewStudent((s) => ({ ...s, gender: e.target.value }))}
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </CFormSelect>
                  </CCol>

                  <CCol xs={12} className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2 align-items-center flex-nowrap">
                      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="form-control" style={{ width: 300 }} />
                      <ArpButton
                        label={previewing ? 'Previewing...' : 'Preview Import'}
                        icon="view"
                        color="warning"
                        onClick={onPreviewImport}
                        disabled={!scopeReady || previewing}
                        className="text-nowrap"
                      />
                      <ArpButton
                        label={importing ? 'Importing...' : 'Import Excel'}
                        icon="upload"
                        color="primary"
                        onClick={onImport}
                        disabled={!scopeReady || importing}
                        className="text-nowrap"
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <ArpButton
                        label={saving ? 'Saving...' : 'Save'}
                        icon="save"
                        color="success"
                        onClick={onSaveNew}
                        disabled={!isAddNew || saving}
                      />
                      <ArpButton label={loadingRows ? 'Searching...' : 'Search'} icon="search" color="info" onClick={loadStudents} disabled={!scopeReady || loadingRows} />
                      <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
                    </div>
                  </CCol>
                </CRow>
              </CForm>
            )}
          </CCardBody>
        </CCard>

        {previewSummary ? (
          <CAlert color={previewSummary.failed > 0 ? 'warning' : 'success'}>
            Preview: Total Rows {previewSummary.total ?? 0}, Failed {previewSummary.failed ?? 0}
          </CAlert>
        ) : null}

        {importSummary ? (
          <CAlert color="info">
            Imported Rows: {importSummary.rows ?? 0}, Students Upserted: {importSummary.studentsUpserted ?? 0}, Mappings Upserted: {importSummary.mappingsUpserted ?? 0}
          </CAlert>
        ) : null}

        <ArpDataTable
          title="STUDENT DETAILS"
          rows={rows}
          columns={columns}
          loading={loadingRows}
          headerActions={tableActions}
          rowKey="configId"
          selection={{
            type: 'radio',
            selected: selectedId,
            onChange: (id) => setSelectedId(id),
            key: 'configId',
            headerLabel: 'Select',
            width: 60,
            name: 'studentRow',
          }}
          searchable
          searchPlaceholder="Search..."
          pageSizeOptions={[10, 20, 50, 100]}
          defaultPageSize={10}
        />
      </CCol>
    </CRow>
  )
}
