import React, { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

import {
  CCard,
  CCardHeader,
  CCardBody,
  CAlert,
  CSpinner,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormCheck,
} from '@coreui/react-pro'

/**
 * Programmes.jsx (ARP Standard) - Department.jsx Pattern
 *
 * ✅ Buttons EXACTLY like Department.jsx:
 *   Header action buttons:
 *     - Add New (ArpButton label+icon)
 *     - View/Edit/Delete (ArpIconButton)
 *
 * ✅ Excel section EXACTLY like Department.jsx:
 *   - Download Template (ArpButton)
 *   - File input (inline)
 *   - Import Excel (ArpButton)
 *
 * CRUD:
 *   GET    /api/setup/programme
 *   POST   /api/setup/programme
 *   PUT    /api/setup/programme/:id
 *   DELETE /api/setup/programme/:id
 *
 * Excel:
 *   GET    /api/setup/programme/template
 *   POST   /api/setup/programme/import
 */

const api = axios.create({ baseURL: '', headers: { 'Content-Type': 'application/json' } })

const initialForm = {
  institutionId: '',
  departmentId: '',
  programmeCode: '',
  programmeName: '',
  offeringMode: '',
  branchOfStudy: '',
  graduationCategory: '',
  yearOfIntroduction: '',
  sanctionedIntake: '',
  affiliationStatus: '',
  accreditationStatus: '',
  programmeStatus: '',
  totalSemesters: '',
  totalCredits: '',
  totalMaxMarks: '',
  isActive: true,
}

const enumOptions = {
  offeringMode: [
    { value: '', label: 'Select' },
    { value: 'REGULAR', label: 'Regular' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'DISTANCE', label: 'Distance' },
    { value: 'ONLINE', label: 'Online' },
  ],
  graduationCategory: [
    { value: '', label: 'Select' },
    { value: 'UG', label: 'UG' },
    { value: 'PG', label: 'PG' },
    { value: 'DIPLOMA', label: 'Diploma' },
    { value: 'PHD', label: 'PhD' },
    { value: 'CERTIFICATE', label: 'Certificate' },
    { value: 'OTHERS', label: 'Others' },
  ],
  affiliationStatus: [
    { value: '', label: 'Select' },
    { value: 'AFFILIATED', label: 'Affiliated' },
    { value: 'AUTONOMOUS', label: 'Autonomous' },
    { value: 'DEEMED', label: 'Deemed' },
  ],
  accreditationStatus: [
    { value: '', label: 'Select' },
    { value: 'ACCREDITED', label: 'Accredited' },
    { value: 'NOT_ACCREDITED', label: 'Not Accredited' },
    { value: 'APPLIED', label: 'Applied' },
  ],
  programmeStatus: [
    { value: '', label: 'Select' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'CLOSED', label: 'Closed' },
  ],
}

const toIntOrEmpty = (v) => (v === null || v === undefined ? '' : String(v))

const toPayload = (form) => ({
  institutionId: String(form.institutionId || '').trim(),
  departmentId: String(form.departmentId || '').trim(),
  programmeCode: String(form.programmeCode || '').trim(),
  programmeName: String(form.programmeName || '').trim(),

  offeringMode: form.offeringMode || null,
  branchOfStudy: String(form.branchOfStudy || '').trim() || null,
  graduationCategory: form.graduationCategory || null,
  yearOfIntroduction: form.yearOfIntroduction === '' ? null : Number(form.yearOfIntroduction),
  sanctionedIntake: form.sanctionedIntake === '' ? null : Number(form.sanctionedIntake),

  affiliationStatus: form.affiliationStatus || null,
  accreditationStatus: form.accreditationStatus || null,
  programmeStatus: form.programmeStatus || null,

  totalSemesters: form.totalSemesters === '' ? null : Number(form.totalSemesters),
  totalCredits: form.totalCredits === '' ? null : Number(form.totalCredits),
  totalMaxMarks: form.totalMaxMarks === '' ? null : Number(form.totalMaxMarks),

  isActive: form.isActive !== false,
})

const Programmes = () => {
  // masters
  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])

  // table
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // form
  // form mode: VIEW (disabled) | NEW | EDIT
  const [formMode, setFormMode] = useState('VIEW')
  const [form, setForm] = useState(initialForm)
  const [toast, setToast] = useState(null)

  // excel (Department.jsx pattern)
  const fileRef = useRef(null)
  const [importing, setImporting] = useState(false)

  const showToast = (type, message) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4500)
  }



  const downloadBase64Excel = (base64, filename = 'Programme_Import_Errors.xlsx') => {
    try {
      if (!base64) return
      const byteChars = atob(base64)
      const byteNumbers = new Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
      const blob = new Blob([new Uint8Array(byteNumbers)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      // ignore download errors
    }
  }

  const unwrapArray = (res) => {
    const d = res?.data

    // ARP standard: { success:true, data: [...] }
    if (d && typeof d === 'object' && Object.prototype.hasOwnProperty.call(d, 'success')) {
      const inner = d.data

      if (Array.isArray(inner)) return inner

      // Some controllers may wrap list inside an object: { data:{ rows:[...] } } etc.
      if (inner && typeof inner === 'object') {
        if (Array.isArray(inner.rows)) return inner.rows
        if (Array.isArray(inner.items)) return inner.items
        if (Array.isArray(inner.programmes)) return inner.programmes
        if (Array.isArray(inner.departments)) return inner.departments
        if (Array.isArray(inner.institutions)) return inner.institutions
        if (Array.isArray(inner.data)) return inner.data
      }

      return []
    }

    // Plain array response
    return Array.isArray(d) ? d : []
  }


  const digitsOnly = (value, maxLen) => {
    const s = String(value ?? '').replace(/\D/g, '')
    return typeof maxLen === 'number' ? s.slice(0, maxLen) : s
  }

  const setNumericField = (field, value, maxLen) => {
    setForm((f) => ({ ...f, [field]: digitsOnly(value, maxLen) }))
  }

  const clampYear = (value) => {
    if (!value) return ''
    const y = Number(value)
    if (!Number.isFinite(y)) return ''
    if (y < 1900) return '1900'
    if (y > 2100) return '2100'
    return String(y)
  }


  const isFormEnabled = formMode === 'NEW' || formMode === 'EDIT'

  const resetForm = () => {
    setForm(initialForm)
    setFormMode('VIEW')
    setSelectedId(null)
  }

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/api/setup/institution')
      setInstitutions(unwrapArray(res))
    } catch {
      showToast('warning', 'Unable to load Institutions list')
    }
  }

  const loadDepartments = async () => {
    try {
      const res = await api.get('/api/setup/department')
      setDepartments(unwrapArray(res))
    } catch {
      showToast('warning', 'Unable to load Departments list')
    }
  }

  const loadProgrammes = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/setup/programme')
      setRows(unwrapArray(res))
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Failed to load Programmes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstitutions()
    loadDepartments()
    loadProgrammes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validateForm = () => {
    if (!String(form.institutionId || '').trim()) return 'Institution is required'
    if (!String(form.departmentId || '').trim()) return 'Department is required'
    if (!String(form.programmeCode || '').trim()) return 'Programme Code is required'
    if (!String(form.programmeName || '').trim()) return 'Programme Name is required'
    // Numeric validations (ARP)
    if (form.yearOfIntroduction && String(form.yearOfIntroduction).length !== 4) return 'Year of Introduction must be a 4-digit year'
    const nums = [
      ['Sanctioned Intake', form.sanctionedIntake],
      ['Total Semesters', form.totalSemesters],
      ['Total Credits', form.totalCredits],
      ['Total Max Marks', form.totalMaxMarks],
    ]
    for (const [label, v] of nums) {
      if (v === '' || v === null || v === undefined) continue
      if (!/^\d+$/.test(String(v))) return `${label} must be numbers only`
    }
    return null
  }

  // -----------------------
  // Header Actions (Department style)
  // -----------------------
  const onAddNew = () => {
    setForm(initialForm)
    setFormMode('NEW')
    setSelectedId(null)
  }

  const onView = () => {
    if (!selectedId) return showToast('warning', 'Please select a row')
    const selected = rows.find((r) => r.id === selectedId)
    if (!selected) return showToast('warning', 'Selected row not found')

    setForm({
      institutionId: selected.institutionId || '',
      departmentId: selected.departmentId || '',
      programmeCode: selected.programmeCode || '',
      programmeName: selected.programmeName || '',
      offeringMode: selected.offeringMode || '',
      branchOfStudy: selected.branchOfStudy || '',
      graduationCategory: selected.graduationCategory || '',
      yearOfIntroduction: toIntOrEmpty(selected.yearOfIntroduction),
      sanctionedIntake: toIntOrEmpty(selected.sanctionedIntake),
      affiliationStatus: selected.affiliationStatus || '',
      accreditationStatus: selected.accreditationStatus || '',
      programmeStatus: selected.programmeStatus || '',
      totalSemesters: toIntOrEmpty(selected.totalSemesters),
      totalCredits: toIntOrEmpty(selected.totalCredits),
      totalMaxMarks: toIntOrEmpty(selected.totalMaxMarks),
      isActive: selected.isActive !== false,
    })

    setFormMode('VIEW')

    setFormMode('VIEW')
  }


  // Auto-load form on radio select (as requested)
  const onSelectRow = (id) => {
    setSelectedId(id)
    const selected = rows.find((r) => r.id === id)
    if (!selected) return

    setForm({
      institutionId: selected.institutionId || '',
      departmentId: selected.departmentId || '',
      programmeCode: selected.programmeCode || '',
      programmeName: selected.programmeName || '',
      offeringMode: selected.offeringMode || '',
      branchOfStudy: selected.branchOfStudy || '',
      graduationCategory: selected.graduationCategory || '',
      yearOfIntroduction: toIntOrEmpty(selected.yearOfIntroduction),
      sanctionedIntake: toIntOrEmpty(selected.sanctionedIntake),
      affiliationStatus: selected.affiliationStatus || '',
      accreditationStatus: selected.accreditationStatus || '',
      programmeStatus: selected.programmeStatus || '',
      totalSemesters: toIntOrEmpty(selected.totalSemesters),
      totalCredits: toIntOrEmpty(selected.totalCredits),
      totalMaxMarks: toIntOrEmpty(selected.totalMaxMarks),
      isActive: selected.isActive !== false,
    })

    setFormMode('VIEW') // default is view mode; click Edit icon to enable editing
  }


  const onEdit = () => {
    if (!selectedId) return showToast('warning', 'Please select a row')
    onView()
    setFormMode('EDIT')
  }

  const onDelete = async () => {
    if (!selectedId) return showToast('warning', 'Please select a row')

    const ok = window.confirm('Are you sure you want to delete this Programme?')
    if (!ok) return

    try {
      setSaving(true)
      await api.delete(`/api/setup/programme/${selectedId}`)
      showToast('success', 'Deleted successfully')
      await loadProgrammes()
      resetForm()
    } catch (e) {
      showToast('danger', e?.response?.data?.error || 'Delete failed')
    } finally {
      setSaving(false)
    }
  }

  // -----------------------
  // Save/Cancel (form)
  // -----------------------
  const onCancel = () => resetForm()

  const onSave = async (e) => {
    e.preventDefault()
    const err = validateForm()
    if (err) return showToast('danger', err)

    const payload = toPayload(form)

    try {
      setSaving(true)
      if (formMode === 'EDIT' && selectedId) {
        await api.put(`/api/setup/programme/${selectedId}`, payload)
        showToast('success', 'Updated successfully')
      } else {
        await api.post('/api/setup/programme', payload)
        showToast('success', 'Saved successfully')
      }

      await loadProgrammes()
      setFormMode('VIEW')
    } catch (e2) {
      showToast('danger', e2?.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // -----------------------
  // Excel (Department.jsx pattern)
  // -----------------------
  const downloadTemplate = async () => {
    try {
      // ✅ Backend-generated template (ARP Standard)
      const res = await api.get('/api/setup/programme/template', { responseType: 'blob' })
      const blob = new Blob([res.data], {
        type:
          res.headers?.['content-type'] ||
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Programme_Template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showToast('success', 'Template downloaded')
    } catch (e) {
      showToast(
        'danger',
        e?.response?.status === 404
          ? 'Template API not found'
          : e?.response?.data?.error || 'Failed to download template',
      )
    }
  }
      

  const onUploadClick = () => fileRef.current?.click()

  const onFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const name = String(file.name || '').toLowerCase()
    const ok = name.endsWith('.xlsx') || name.endsWith('.xls') || file.type.includes('spreadsheet')
    if (!ok) return showToast('danger', 'Please select Excel file (.xlsx / .xls)')

    const formData = new FormData()
    formData.append('file', file)

    try {
      setImporting(true)
      const res = await api.post('/api/setup/programme/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // Backend returns success:false with an error workbook (base64) when import has row errors
      if (res?.data?.success === false) {
        if (res?.data?.errorFileBase64) {
          downloadBase64Excel(res.data.errorFileBase64, res.data.errorFileName)
        }
        showToast('warning', res?.data?.error || 'Import completed with errors')
        await loadProgrammes()
        return
      }

      showToast('success', res?.data?.message || 'Import completed')
      await loadProgrammes()
    } catch (err) {
      const data = err?.response?.data
      if (data?.errorFileBase64) {
        downloadBase64Excel(data.errorFileBase64, data.errorFileName)
        showToast('warning', data?.error || 'Import completed with errors')
        await loadProgrammes()
      } else {
        showToast(
          'danger',
          err?.response?.status === 404
            ? 'Import API not available (backend missing: /api/setup/programme/import)'
            : data?.error || 'Import failed',
        )
      }
    } finally {
      setImporting(false)
    }
  }


  const columns = useMemo(
    () => [
      { key: 'programmeCode', label: 'Programme Code' },
      { key: 'programmeName', label: 'Programme Name' },
      { key: 'institution', label: 'Institution', render: (row) => row?.institution?.name || '-' },
      {
        key: 'department',
        label: 'Department',
        render: (row) => row?.department?.departmentName || '-',
      },
      { key: 'programmeStatus', label: 'Status', render: (row) => row?.programmeStatus || '-' },
      { key: 'isActive', label: 'Active', render: (row) => (row?.isActive === false ? 'No' : 'Yes') },
    ],
    [],
  )


  const tableActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  // Grid helper: md=3 label + md=3 input (2 fields per row)
  const LabelCol = ({ children }) => (
    <CCol md={3} className="d-flex align-items-center">
      <CFormLabel className="mb-0">{children}</CFormLabel>
    </CCol>
  )
  const InputCol = ({ children }) => <CCol md={3}>{children}</CCol>

  return (
    <React.Fragment>
<CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>ADD PROGRAMME</strong>

          <div className="d-flex gap-2">
            <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />

            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onFileChange} />

            <ArpButton label={importing ? "Uploading..." : "Upload"} icon="upload" color="info" onClick={onUploadClick} />
            <ArpButton label="Download Template" icon="download" color="danger" onClick={downloadTemplate} />
          </div>
        </CCardHeader>

        <CCardBody>
          {toast && (
            <CAlert color={toast.type} className="mb-3">
              {toast.message}
            </CAlert>
          )}

          <CForm onSubmit={onSave}>
            <CRow className="g-3">
              <LabelCol>Institution *</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.institutionId}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, institutionId: e.target.value }))}
                >
                  <option value="">Select</option>
                  {institutions.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Department *</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.departmentId}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                >
                  <option value="">Select</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.departmentName} ({d.departmentCode})
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Programme Code *</LabelCol>
              <InputCol>
                <CFormInput
                  value={form.programmeCode}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, programmeCode: e.target.value }))}
                />
              </InputCol>

              <LabelCol>Programme Name *</LabelCol>
              <InputCol>
                <CFormInput
                  value={form.programmeName}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, programmeName: e.target.value }))}
                />
              </InputCol>

              <LabelCol>Offering Mode</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.offeringMode}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, offeringMode: e.target.value }))}
                >
                  {enumOptions.offeringMode.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Graduation Category</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.graduationCategory}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, graduationCategory: e.target.value }))}
                >
                  {enumOptions.graduationCategory.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Branch of Study</LabelCol>
              <InputCol>
                <CFormInput
                  value={form.branchOfStudy}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, branchOfStudy: e.target.value }))}
                />
              </InputCol>

              <LabelCol>Year of Introduction</LabelCol>
              <InputCol>
                <CFormInput
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="YYYY"
                  maxLength={4}
                  value={form.yearOfIntroduction}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setNumericField('yearOfIntroduction', e.target.value, 4)}
                  onBlur={() => setForm((f) => ({ ...f, yearOfIntroduction: clampYear(f.yearOfIntroduction) }))}
                />
              </InputCol>

              <LabelCol>Sanctioned Intake</LabelCol>
              <InputCol>
                <CFormInput
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.sanctionedIntake}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setNumericField('sanctionedIntake', e.target.value)}
                />
              </InputCol>

              <LabelCol>Affiliation Status</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.affiliationStatus}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, affiliationStatus: e.target.value }))}
                >
                  {enumOptions.affiliationStatus.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Accreditation Status</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.accreditationStatus}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, accreditationStatus: e.target.value }))}
                >
                  {enumOptions.accreditationStatus.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Programme Status</LabelCol>
              <InputCol>
                <CFormSelect
                  value={form.programmeStatus}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, programmeStatus: e.target.value }))}
                >
                  {enumOptions.programmeStatus.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>

              <LabelCol>Total Semesters</LabelCol>
              <InputCol>
                <CFormInput
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.totalSemesters}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setNumericField('totalSemesters', e.target.value)}
                />
              </InputCol>

              <LabelCol>Total Credits</LabelCol>
              <InputCol>
                <CFormInput
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.totalCredits}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setNumericField('totalCredits', e.target.value)}
                />
              </InputCol>

              <LabelCol>Total Max Marks</LabelCol>
              <InputCol>
                <CFormInput
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.totalMaxMarks}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setNumericField('totalMaxMarks', e.target.value)}
                />
              </InputCol>

              <LabelCol>Active</LabelCol>
              <InputCol>
                <CFormCheck
                  label="Is Active"
                  checked={form.isActive !== false}
                 
                disabled={!isFormEnabled}
                 onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
              </InputCol>
            </CRow>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <ArpButton
                label={saving ? 'Saving...' : 'Save'}
                icon="save"
                color="success"
                type="submit"
                disabled={saving || !isFormEnabled}
              />
              <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} disabled={saving || !isFormEnabled} />
              {saving && <CSpinner size="sm" />}
            </div>
          </CForm>
        </CCardBody>
      </CCard>

            <div className="mb-3">
        <ArpDataTable
                    title="Programme Details"
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    searchable
                    searchPlaceholder="Search..."
                    pageSizeOptions={[5, 10, 20, 50]}
                    defaultPageSize={10}
                    rowKey="id"
                    headerActions={tableActions}
                    selection={{
                      type: 'radio',
                      selected: selectedId,
                      onChange: (id) => onSelectRow(id),
                      key: 'id',
                      headerLabel: 'Select',
                      width: 60,
                      name: 'programmeRow',
                    }}
                  />
      </div>
    </React.Fragment>
  )
}

export default Programmes
