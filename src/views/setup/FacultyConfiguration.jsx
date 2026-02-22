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

const initialScope = {
  institutionId: '',
  departmentId: '',
  academicYearId: '',
}

const initialForm = {
  facultyCode: '',
  title: '',
  firstName: '',
  dateOfBirth: '',
  gender: '',
  designation: '',
  department: '',
  aadhaar: '',
  bloodGroup: '',
  mobileNumber: '',
  whatsappNumber: '',
  personalEmailId: '',
  officialEmailId: '',
  dateOfJoining: '',
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const tenDigitRegex = /^\d{10}$/
const aadhaarRegex = /^\d{12}$/
const ddmmyyyyRegex = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/

const isoToDdMmYyyy = (iso) => {
  const v = String(iso || '').trim()
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return ''
  const [y, m, d] = v.split('-')
  return `${d}/${m}/${y}`
}

const ddMmYyyyToIso = (value) => {
  const v = String(value || '').trim()
  if (!ddmmyyyyRegex.test(v)) return ''
  const [d, m, y] = v.split('/')
  return `${y}-${m}-${d}`
}

const anyDateToDdMmYyyy = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (ddmmyyyyRegex.test(raw)) return raw
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return isoToDdMmYyyy(raw.slice(0, 10))
  const dt = new Date(raw)
  if (!Number.isNaN(dt.getTime())) {
    const d = String(dt.getDate()).padStart(2, '0')
    const m = String(dt.getMonth() + 1).padStart(2, '0')
    const y = dt.getFullYear()
    return `${d}/${m}/${y}`
  }
  return ''
}

export default function FacultyConfiguration() {
  const [scope, setScope] = useState(initialScope)
  const [form, setForm] = useState(initialForm)
  const [isEdit, setIsEdit] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [rows, setRows] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [message, setMessage] = useState(null)
  const [statusText, setStatusText] = useState('Faculty Data Not Uploaded')
  const [previewSummary, setPreviewSummary] = useState(null)
  const [importSummary, setImportSummary] = useState(null)
  const [loadingMasters, setLoadingMasters] = useState(false)
  const [loadingRows, setLoadingRows] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)

  const fileRef = useRef(null)

  const showMessage = (type, text) => setMessage({ type, text })
  const scopeReady = useMemo(
    () => Boolean(scope.institutionId && scope.departmentId && scope.academicYearId),
    [scope],
  )

  const scopeParams = useMemo(
    () => ({
      institutionId: scope.institutionId,
      departmentId: scope.departmentId,
      academicYearId: scope.academicYearId,
    }),
    [scope],
  )

  const tableRows = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        title: r.title || '',
        firstName: r.facultyName || '',
        dateOfBirth: anyDateToDdMmYyyy(r.dateOfBirth),
        department: departments.find((d) => String(d.id) === String(scope.departmentId))?.departmentName || '',
        aadhaar: r.aadhaar || '',
        bloodGroup: r.bloodGroup || '',
        whatsappNumber: r.whatsappNumber || '',
        personalEmailId: r.personalEmail || r.email || '',
        officialEmailId: r.officialEmail || r.email || '',
        dateOfJoining: anyDateToDdMmYyyy(r.dateOfJoining),
      })),
    [rows, departments, scope.departmentId],
  )

  const selectedRow = useMemo(
    () => rows.find((r) => String(r.id) === String(selectedId)) || null,
    [rows, selectedId],
  )

  const resetForm = () => {
    setForm(initialForm)
    setIsEdit(false)
    setEditingId(null)
  }

  const clearResults = () => {
    setRows([])
    setSelectedId(null)
    setPreviewSummary(null)
    setImportSummary(null)
    setStatusText('Faculty Data Not Uploaded')
    resetForm()
  }

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

  useEffect(() => {
    loadInstitutions()
  }, [])

  useEffect(() => {
    if (!scope.institutionId) {
      setDepartments([])
      setAcademicYears([])
      return
    }
    setScope((s) => ({ ...s, departmentId: '', academicYearId: '' }))
    clearResults()
    loadDepartments(scope.institutionId)
    loadAcademicYears(scope.institutionId)
  }, [scope.institutionId])

  useEffect(() => {
    clearResults()
  }, [scope.departmentId, scope.academicYearId])

  useEffect(() => {
    setForm((f) => ({
      ...f,
      department:
        departments.find((d) => String(d.id) === String(scope.departmentId))?.departmentName || '',
    }))
  }, [scope.departmentId, departments])

  const loadFaculties = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete selection scope before search.')
    setLoadingRows(true)
    try {
      const res = await api.get('/api/setup/faculty', { params: scopeParams })
      setRows(unwrapList(res))
      setSelectedId(null)
      setStatusText(res?.data?.meta?.status || 'Faculty Data Not Uploaded')
      resetForm()
    } catch (e) {
      setRows([])
      showMessage('danger', e?.response?.data?.error || 'Failed to load faculties')
    } finally {
      setLoadingRows(false)
    }
  }

  const onAddNew = () => {
    if (!scopeReady) return showMessage('danger', 'Complete selection scope and search before adding.')
    setSelectedId(null)
    setEditingId(null)
    setIsEdit(true)
    setForm({
      ...initialForm,
      department:
        departments.find((d) => String(d.id) === String(scope.departmentId))?.departmentName || '',
    })
  }

  const loadRowToForm = (mode) => {
    if (!selectedRow) return
    setForm({
      facultyCode: selectedRow.facultyCode || '',
      title: selectedRow.title || '',
      firstName: selectedRow.facultyName || '',
      dateOfBirth: anyDateToDdMmYyyy(selectedRow.dateOfBirth),
      gender: selectedRow.gender || '',
      designation: selectedRow.designation || '',
      department:
        departments.find((d) => String(d.id) === String(scope.departmentId))?.departmentName || '',
      aadhaar: selectedRow.aadhaar || '',
      bloodGroup: selectedRow.bloodGroup || '',
      mobileNumber: selectedRow.mobileNumber || '',
      whatsappNumber: selectedRow.whatsappNumber || '',
      personalEmailId: selectedRow.personalEmail || selectedRow.email || '',
      officialEmailId: selectedRow.officialEmail || selectedRow.email || '',
      dateOfJoining: anyDateToDdMmYyyy(selectedRow.dateOfJoining),
    })
    setEditingId(selectedRow.id)
    setIsEdit(mode === 'EDIT')
  }

  const onView = () => loadRowToForm('VIEW')
  const onEdit = () => loadRowToForm('EDIT')

  const onDelete = async () => {
    if (!selectedRow) return
    if (!window.confirm('Delete selected faculty?')) return
    try {
      await api.delete(`/api/setup/faculty/${selectedRow.id}`)
      showMessage('success', 'Faculty deleted successfully')
      setSelectedId(null)
      await loadFaculties()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to delete faculty')
    }
  }

  const onSave = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete selection scope before saving.')
    if (!form.facultyCode.trim()) return showMessage('danger', 'Faculty Code is required')
    if (!form.title.trim()) return showMessage('danger', 'Title is required')
    if (!form.firstName.trim()) return showMessage('danger', 'First Name is required')
    if (!form.dateOfBirth.trim()) return showMessage('danger', 'Date of Birth is required')
    if (!form.dateOfJoining.trim()) return showMessage('danger', 'Date of Joining is required')
    if (!form.gender) return showMessage('danger', 'Gender is required')
    if (!form.designation.trim()) return showMessage('danger', 'Designation is required')
    if (!form.mobileNumber.trim()) return showMessage('danger', 'Mobile Number is required')

    if (!tenDigitRegex.test(form.mobileNumber.trim())) {
      return showMessage('danger', 'Mobile Number must be 10 digits')
    }
    if (form.whatsappNumber.trim() && !tenDigitRegex.test(form.whatsappNumber.trim())) {
      return showMessage('danger', 'WhatsApp Number must be 10 digits')
    }
    if (form.aadhaar.trim() && !aadhaarRegex.test(form.aadhaar.trim())) {
      return showMessage('danger', 'Aadhaar must be 12 digits')
    }
    if (!ddmmyyyyRegex.test(form.dateOfBirth.trim())) {
      return showMessage('danger', 'Date of Birth must be in DD/MM/YYYY format')
    }
    if (!ddmmyyyyRegex.test(form.dateOfJoining.trim())) {
      return showMessage('danger', 'Date of Joining must be in DD/MM/YYYY format')
    }

    const personalEmail = form.personalEmailId.trim()
    const officialEmail = form.officialEmailId.trim()
    if (!personalEmail && !officialEmail) {
      return showMessage('danger', 'At least one email is required (Personal or Official)')
    }
    if (personalEmail && !emailRegex.test(personalEmail)) {
      return showMessage('danger', 'Personal Email ID is invalid')
    }
    if (officialEmail && !emailRegex.test(officialEmail)) {
      return showMessage('danger', 'Official Email ID is invalid')
    }

    setSaving(true)
    try {
      const payload = {
        ...scopeParams,
        facultyCode: form.facultyCode.trim(),
        title: form.title.trim(),
        facultyName: form.firstName.trim(),
        dateOfBirth: form.dateOfBirth.trim(),
        designation: form.designation.trim(),
        qualification: '',
        gender: form.gender || null,
        aadhaar: form.aadhaar.trim(),
        bloodGroup: form.bloodGroup.trim(),
        mobileNumber: form.mobileNumber.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        personalEmail: form.personalEmailId.trim(),
        officialEmail: form.officialEmailId.trim(),
        email: (form.officialEmailId || form.personalEmailId || '').trim(),
        dateOfJoining: form.dateOfJoining.trim(),
        experienceYears: null,
      }

      if (editingId) await api.put(`/api/setup/faculty/${editingId}`, payload)
      else await api.post('/api/setup/faculty', payload)

      showMessage('success', 'Faculty saved successfully')
      resetForm()
      await loadFaculties()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to save faculty')
    } finally {
      setSaving(false)
    }
  }

  const onDownloadTemplate = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete selection scope before downloading template.')
    try {
      const res = await api.get('/api/setup/faculty/template', {
        params: scopeParams,
        responseType: 'blob',
      })
      downloadBlob(res.data, 'Faculty_Configuration_Template.xlsx')
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to download template')
    }
  }

  const onExport = async () => {
    if (!scopeReady) return showMessage('danger', 'Complete selection scope before export.')
    try {
      const res = await api.get('/api/setup/faculty/export', {
        params: scopeParams,
        responseType: 'blob',
      })
      downloadBlob(res.data, 'Faculty_Configuration_Export.xlsx')
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to export faculties')
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
      const res = await api.post('/api/setup/faculty/import/preview', fd, {
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
      const res = await api.post('/api/setup/faculty/import', fd, {
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
        showMessage('success', data?.message || 'Faculty import completed successfully.')
        if (fileRef.current) fileRef.current.value = ''
        await loadFaculties()
        return
      }

      if (res.status >= 400) {
        downloadBlob(res.data, 'Faculty_Import_Errors.xlsx')
        showMessage('danger', 'Import completed with errors (error sheet downloaded).')
        return
      }

      showMessage('success', 'Faculty import completed successfully.')
      if (fileRef.current) fileRef.current.value = ''
      await loadFaculties()
    } catch {
      showMessage('danger', 'Failed to import faculties')
    } finally {
      setImporting(false)
    }
  }

  const onCancel = () => {
    clearResults()
    setMessage(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const columns = useMemo(
    () => [
      { key: 'facultyCode', label: 'Faculty Code', sortable: true, width: 120, align: 'center' },
      { key: 'title', label: 'Title', sortable: true, width: 90, align: 'center' },
      { key: 'firstName', label: 'First Name', sortable: true, width: 180 },
      { key: 'dateOfBirth', label: 'Date of Birth', sortable: true, width: 130, align: 'center' },
      { key: 'gender', label: 'Gender', sortable: true, width: 100, align: 'center' },
      { key: 'designation', label: 'Designation', sortable: true, width: 180 },
      { key: 'department', label: 'Department', sortable: true, width: 180 },
      { key: 'aadhaar', label: 'Aadhaar', sortable: true, width: 130, align: 'center' },
      { key: 'bloodGroup', label: 'Blood Group', sortable: true, width: 120, align: 'center' },
      { key: 'mobileNumber', label: 'Mobile Number', sortable: true, width: 140, align: 'center' },
      { key: 'whatsappNumber', label: 'WhatsApp Number', sortable: true, width: 150, align: 'center' },
      { key: 'personalEmailId', label: 'Personal Email ID', sortable: true, width: 220 },
      { key: 'officialEmailId', label: 'Official Email ID', sortable: true, width: 220 },
      { key: 'dateOfJoining', label: 'Date of Joining', sortable: true, width: 130, align: 'center' },
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
            <strong>FACULTY CONFIGURATION</strong>
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

                  <CCol md={2}><CFormLabel>Status</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput value={statusText} disabled />
                  </CCol>

                  <CCol md={2}><CFormLabel>Faculty Code</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput value={form.facultyCode} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, facultyCode: e.target.value }))} />
                  </CCol>

                  <CCol md={2}><CFormLabel>Title</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect
                      value={form.title}
                      disabled={!isEdit}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    >
                      <option value="">Select Title</option>
                      <option value="Dr">Dr</option>
                      <option value="Mr">Mr</option>
                      <option value="Ms">Ms</option>
                      <option value="Mrs">Mrs</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={2}><CFormLabel>First Name</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput value={form.firstName} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
                  </CCol>

                  <CCol md={2}><CFormLabel>Date of Birth</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput
                      type="date"
                      value={ddMmYyyyToIso(form.dateOfBirth)}
                      disabled={!isEdit}
                      onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: isoToDdMmYyyy(e.target.value) }))}
                    />
                  </CCol>

                  <CCol md={2}><CFormLabel>Gender</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormSelect value={form.gender} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={2}><CFormLabel>Designation</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput value={form.designation} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} />
                  </CCol>

                  <CCol md={2}><CFormLabel>Department</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput value={form.department} disabled />
                  </CCol>

                  <CCol md={2}><CFormLabel>Aadhaar</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={12}
                      value={form.aadhaar}
                      disabled={!isEdit}
                      onChange={(e) => setForm((f) => ({ ...f, aadhaar: e.target.value.replace(/\D/g, '') }))}
                    />
                  </CCol>

                  <CCol md={2}><CFormLabel>Blood Group</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput value={form.bloodGroup} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))} />
                  </CCol>

                  <CCol md={2}><CFormLabel>Mobile Number</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={form.mobileNumber}
                      disabled={!isEdit}
                      onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value.replace(/\D/g, '') }))}
                    />
                  </CCol>

                  <CCol md={2}><CFormLabel>WhatsApp Number</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={form.whatsappNumber}
                      disabled={!isEdit}
                      onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value.replace(/\D/g, '') }))}
                    />
                  </CCol>

                  <CCol md={2}><CFormLabel>Personal Email ID</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput value={form.personalEmailId} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, personalEmailId: e.target.value }))} />
                  </CCol>

                  <CCol md={2}><CFormLabel>Official Email ID</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput value={form.officialEmailId} disabled={!isEdit} onChange={(e) => setForm((f) => ({ ...f, officialEmailId: e.target.value }))} />
                  </CCol>

                  <CCol md={2}><CFormLabel>Date of Joining</CFormLabel></CCol>
                  <CCol md={4}>
                    <CFormInput
                      type="date"
                      value={ddMmYyyyToIso(form.dateOfJoining)}
                      disabled={!isEdit}
                      onChange={(e) => setForm((f) => ({ ...f, dateOfJoining: isoToDdMmYyyy(e.target.value) }))}
                    />
                  </CCol>

                  <CCol xs={12} className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2 align-items-center flex-nowrap">
                      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="form-control" style={{ width: 300 }} />
                      <ArpButton label={previewing ? 'Previewing...' : 'Preview Import'} icon="view" color="warning" onClick={onPreviewImport} disabled={!scopeReady || previewing} className="text-nowrap" />
                      <ArpButton label={importing ? 'Importing...' : 'Import Excel'} icon="upload" color="primary" onClick={onImport} disabled={!scopeReady || importing} className="text-nowrap" />
                    </div>
                    <div className="d-flex gap-2">
                      <ArpButton label={saving ? 'Saving...' : 'Save'} icon="save" color="success" onClick={onSave} disabled={!isEdit || saving} />
                      <ArpButton label={loadingRows ? 'Searching...' : 'Search'} icon="search" color="info" onClick={loadFaculties} disabled={!scopeReady || loadingRows} />
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
            Imported Rows: {importSummary.rows ?? 0}, Upserted: {importSummary.upserted ?? 0}
          </CAlert>
        ) : null}

        <ArpDataTable
          title="FACULTY DETAILS"
          rows={tableRows}
          columns={columns}
          loading={loadingRows}
          headerActions={tableActions}
          rowKey="id"
          selection={{
            type: 'radio',
            selected: selectedId,
            onChange: (id) => setSelectedId(id),
            key: 'id',
            headerLabel: 'Select',
            width: 60,
            name: 'facultyRow',
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
