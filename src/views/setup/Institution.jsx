import React, { useEffect, useState } from 'react'
import { ArpButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'
import api from '../../services/apiClient'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CImage,
  CRow,
} from '@coreui/react-pro'

const initialForm = {
  code: '',
  name: '',
  dateOfEstablishment: '',
  typeOfInstitution: '',
  category: '',
  aisheCode: '',
  address: '',
  pincode: '',
  phoneNumber: '',
  alternateMobileNumber: '',
  website: '',
  emailId: '',
  sra: '',
  institutionPermanentId: '',
  aicteRegNo: '',
  logoUrl: '',
  correspondentName: '',
  correspondentDesignation: '',
  principalName: '',
  iqacCoordinatorName: '',
  contactNumber: '',
  district: '',
  state: 'Tamil Nadu',
  country: 'India',
  nirfRanking: '',
  autonomousGranted: 'No',
  affiliatedUniversity: '',
  universityType: '',
  accreditedBy: '',
  accreditationCycle: '',
  isActive: true,
}

const typeOfInstitutionOptions = ['Affiliated', 'Autonomous']
const institutionCategoryOptions = [
  'Self - Financing',
  'Government',
  'Government - Aided',
  'Both SF & Govt. Aided',
  'Others',
]
const sraOptions = ['UGC', 'AICTE', 'MCI', 'Others']
const nirfRankingOptions = ['Top Hundred', 'Above Hundred']
const universityTypeOptions = [
  'Govt. University',
  'Central University',
  'Private University',
  'Deemed to be University',
]
const accreditedByOptions = ['NAAC', 'NBA', 'Yet to be Accredited', 'Others']
const accreditationCycleOptions = ['Cycle 1', 'Cycle 2', 'Cycle 3', 'Cycle 4', 'Cycle 5', 'Yet to be Accredited']

const toYesNo = (value) => (value ? 'Yes' : 'No')

const norm = (value) => String(value || '').trim()
const isDisplayableImageSrc = (value) => /^(data:image\/|https?:\/\/|blob:)/i.test(String(value || '').trim())
const getRawMsg = (error) =>
  String(error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Save failed')
const safeMsg = (raw) => {
  const text = String(raw || '')
  if (text.length > 220) return 'Save failed. Please verify input values and try again.'
  return text
}

const Institution = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [errors, setErrors] = useState({})

  const columns = [
    { key: 'code', label: 'Institution Code' },
    { key: 'name', label: 'Institution Name' },
    { key: 'typeOfInstitution', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'district', label: 'District' },
    { key: 'state', label: 'State' },
    { key: 'phoneNumber', label: 'Phone' },
    { key: 'emailId', label: 'Email' },
  ]

  const showToast = (type, message) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4500)
  }

  const mapApiRowToForm = (row) => ({
    code: row?.code ?? '',
    name: row?.name ?? '',
    dateOfEstablishment: row?.dateOfEstablishment ? String(row.dateOfEstablishment).slice(0, 10) : '',
    typeOfInstitution: row?.typeOfInstitution ?? '',
    category: row?.category ?? '',
    aisheCode: row?.aisheCode ?? '',
    address: row?.address ?? '',
    pincode: row?.pincode ?? '',
    phoneNumber: row?.phoneNumber ?? '',
    alternateMobileNumber: row?.alternateMobileNumber ?? '',
    website: row?.website ?? '',
    emailId: row?.emailId ?? '',
    sra: row?.sra ?? '',
    institutionPermanentId: row?.institutionPermanentId ?? '',
    aicteRegNo: row?.aicteRegNo ?? '',
    logoUrl: row?.logoUrl ?? '',
    correspondentName: row?.correspondentName ?? '',
    correspondentDesignation: row?.correspondentDesignation ?? '',
    principalName: row?.principalName ?? '',
    iqacCoordinatorName: row?.iqacCoordinatorName ?? '',
    contactNumber: row?.contactNumber ?? '',
    district: row?.district ?? '',
    state: row?.state ?? 'Tamil Nadu',
    country: row?.country ?? 'India',
    nirfRanking: row?.nirfRanking ?? '',
    autonomousGranted: toYesNo(row?.autonomousGranted),
    affiliatedUniversity: row?.affiliatedUniversity ?? '',
    universityType: row?.universityType ?? '',
    accreditedBy: row?.accreditedByLabel ?? row?.accreditedBy ?? '',
    accreditationCycle: row?.accreditationCycle ?? '',
    isActive: row?.isActive ?? true,
  })

  const buildPayloadForApi = () => {
    const accreditedBy = norm(form.accreditedBy)
    const isAccredited = Boolean(accreditedBy) && accreditedBy !== 'Yet to be Accredited'
    const accreditedByEnum = ['NAAC', 'NBA', 'OTHERS'].includes(accreditedBy.toUpperCase())
      ? accreditedBy.toUpperCase()
      : null

    return {
      name: norm(form.name),
      dateOfEstablishment: norm(form.dateOfEstablishment) || null,
      typeOfInstitution: norm(form.typeOfInstitution) || null,
      category: norm(form.category) || null,
      aisheCode: norm(form.aisheCode) || null,
      address: norm(form.address) || null,
      pincode: norm(form.pincode) || null,
      phoneNumber: norm(form.phoneNumber) || null,
      alternateMobileNumber: norm(form.alternateMobileNumber) || null,
      website: norm(form.website) || null,
      emailId: norm(form.emailId) || null,
      sra: norm(form.sra) || null,
      institutionPermanentId: norm(form.institutionPermanentId) || null,
      aicteRegNo: norm(form.aicteRegNo) || null,
      logoUrl: norm(form.logoUrl) || null,
      correspondentName: norm(form.correspondentName) || null,
      correspondentDesignation: norm(form.correspondentDesignation) || null,
      principalName: norm(form.principalName) || null,
      iqacCoordinatorName: norm(form.iqacCoordinatorName) || null,
      contactNumber: norm(form.contactNumber) || null,
      district: norm(form.district) || null,
      state: norm(form.state) || null,
      country: norm(form.country) || null,
      nirfRanking: norm(form.nirfRanking) || null,
      autonomousGranted: form.autonomousGranted === 'Yes',
      affiliatedUniversity: norm(form.affiliatedUniversity) || null,
      universityType: norm(form.universityType) || null,
      isAccredited,
      accreditedBy: accreditedByEnum,
      accreditedByLabel: accreditedBy || null,
      accreditationCycle: norm(form.accreditationCycle) || null,
      isActive: form.isActive !== false,
    }
  }

  const validateForm = () => {
    const nextErrors = {}
    if (!norm(form.name)) nextErrors.name = 'Institution Name is required'
    if (!norm(form.dateOfEstablishment)) nextErrors.dateOfEstablishment = 'Date of Establishment is required'
    if (norm(form.pincode) && !/^\d{6}$/.test(norm(form.pincode))) nextErrors.pincode = 'Pincode must be 6 digits'
    if (norm(form.phoneNumber) && !/^\d{10}$/.test(norm(form.phoneNumber))) nextErrors.phoneNumber = 'Phone Number must be 10 digits'
    if (norm(form.alternateMobileNumber) && !/^\d{10}$/.test(norm(form.alternateMobileNumber))) {
      nextErrors.alternateMobileNumber = 'Alternate Mobile Number must be 10 digits'
    }
    if (norm(form.contactNumber) && !/^\d{10}$/.test(norm(form.contactNumber))) {
      nextErrors.contactNumber = 'Contact Number must be 10 digits'
    }
    if (norm(form.emailId) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm(form.emailId))) {
      nextErrors.emailId = 'Enter a valid Email ID'
    }
    if (!norm(form.accreditedBy)) nextErrors.accreditedBy = 'Accredited By is required'
    if (!norm(form.accreditationCycle)) nextErrors.accreditationCycle = 'Cycle is required'
    return nextErrors
  }

  const mapServerErrorToField = (message) => {
    const msg = String(message || '').toLowerCase()
    if (msg.includes('institution name')) return { name: 'Institution Name is required' }
    if (msg.includes('date of establishment')) return { dateOfEstablishment: 'Date of Establishment is required' }
    if (msg.includes('pincode')) return { pincode: 'Pincode is invalid' }
    if (msg.includes('phone')) return { phoneNumber: 'Phone Number is invalid' }
    if (msg.includes('alternate mobile')) return { alternateMobileNumber: 'Alternate Mobile Number is invalid' }
    if (msg.includes('contact number')) return { contactNumber: 'Contact Number is invalid' }
    if (msg.includes('email')) return { emailId: 'Email ID is invalid' }
    if (msg.includes('accredited')) return { accreditedBy: 'Accredited By is invalid' }
    if (msg.includes('cycle')) return { accreditationCycle: 'Cycle is invalid' }
    return {}
  }

  const loadInstitutions = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/setup/institution')
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
      setRows(list)
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load data'
      showToast('danger', msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstitutions()
  }, [])

  const onAddNew = () => {
    setForm(initialForm)
    setSelectedId(null)
    setLogoPreview('')
    setErrors({})
    setIsEdit(true)
  }

  const onEdit = () => {
    if (!selectedId) return
    const selected = rows.find((row) => row.id === selectedId)
    if (!selected) return
    setForm(mapApiRowToForm(selected))
    setLogoPreview(isDisplayableImageSrc(selected?.logoUrl) ? selected.logoUrl : '')
    setErrors({})
    setIsEdit(true)
  }

  const onCancel = () => {
    setForm(initialForm)
    setLogoPreview('')
    setErrors({})
    setIsEdit(false)
  }

  const onSave = async (event) => {
    event.preventDefault()
    const clientErrors = validateForm()
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length > 0) {
      return showToast('danger', 'Please fix the highlighted fields')
    }

    setSaving(true)
    try {
      const payload = buildPayloadForApi()
      if (selectedId) {
        await api.put(`/api/setup/institution/${selectedId}`, payload)
      } else {
        await api.post('/api/setup/institution', payload)
      }
      showToast('success', 'Saved successfully')
      setIsEdit(false)
      await loadInstitutions()
    } catch (error) {
      const raw = getRawMsg(error)
      const msg = safeMsg(raw)
      const serverFieldErrors = mapServerErrorToField(raw)
      if (Object.keys(serverFieldErrors).length) setErrors((prev) => ({ ...prev, ...serverFieldErrors }))
      showToast('danger', msg)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!selectedId) return
    if (!window.confirm('Delete this record?')) return

    try {
      await api.delete(`/api/setup/institution/${selectedId}`)
      showToast('success', 'Deleted successfully')
      setSelectedId(null)
      await loadInstitutions()
    } catch (error) {
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Delete failed'
      showToast('danger', msg)
    }
  }

  const onRowSelect = (id) => {
    setSelectedId(id)
    const row = rows.find((item) => item.id === id)
    if (row) {
      setForm(mapApiRowToForm(row))
      setLogoPreview(isDisplayableImageSrc(row?.logoUrl) ? row.logoUrl : '')
    }
  }

  const onChange = (key) => (event) => {
    const value = event?.target?.value ?? ''
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const onLogoUpload = (event) => {
    const file = event?.target?.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('danger', 'Please upload an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('danger', 'Logo size must be less than 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setLogoPreview(dataUrl)
      setForm((prev) => ({ ...prev, logoUrl: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>INSTITUTION SETUP</strong>
          <div className="d-flex gap-2">
            <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
            <ArpButton label="Edit" icon="edit" color="primary" onClick={onEdit} disabled={!selectedId} />
            <ArpButton label="Delete" icon="delete" color="danger" onClick={onDelete} disabled={!selectedId} />
          </div>
        </CCardHeader>

        <CCardBody>
          {toast && <CAlert color={toast.type}>{toast.message}</CAlert>}
          <CForm onSubmit={onSave}>
            <CRow className="g-3">
              <CCol md={3}><CFormLabel>Institution Code</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.code} disabled /></CCol>

              <CCol md={3}><CFormLabel>Name of the Institution</CFormLabel></CCol>
              <CCol md={3}>
                <CFormInput value={form.name} onChange={onChange('name')} disabled={!isEdit} invalid={!!errors.name} />
                {errors.name ? <CFormFeedback invalid>{errors.name}</CFormFeedback> : null}
              </CCol>

              <CCol md={3}><CFormLabel>Date of Establishment</CFormLabel></CCol>
              <CCol md={3}>
                <CFormInput
                  type="date"
                  value={form.dateOfEstablishment}
                  onChange={onChange('dateOfEstablishment')}
                  disabled={!isEdit}
                  invalid={!!errors.dateOfEstablishment}
                />
                {errors.dateOfEstablishment ? <CFormFeedback invalid>{errors.dateOfEstablishment}</CFormFeedback> : null}
              </CCol>

              <CCol md={3}><CFormLabel>Type of the Institution</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.typeOfInstitution} onChange={onChange('typeOfInstitution')} disabled={!isEdit}>
                  <option value="">Select Type</option>
                  {typeOfInstitutionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Institution Category</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.category} onChange={onChange('category')} disabled={!isEdit}>
                  <option value="">Select Category</option>
                  {institutionCategoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>AISHE Code</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.aisheCode} onChange={onChange('aisheCode')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>Address</CFormLabel></CCol>
              <CCol md={3}><CFormTextarea rows={2} value={form.address} onChange={onChange('address')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>Pincode</CFormLabel></CCol>
              <CCol md={3}>
                <CFormInput value={form.pincode} onChange={onChange('pincode')} disabled={!isEdit} invalid={!!errors.pincode} />
                {errors.pincode ? <CFormFeedback invalid>{errors.pincode}</CFormFeedback> : null}
              </CCol>

              <CCol md={3}><CFormLabel>Phone Number</CFormLabel></CCol>
              <CCol md={3}>
                <CFormInput
                  value={form.phoneNumber}
                  onChange={onChange('phoneNumber')}
                  disabled={!isEdit}
                  invalid={!!errors.phoneNumber}
                />
                {errors.phoneNumber ? <CFormFeedback invalid>{errors.phoneNumber}</CFormFeedback> : null}
              </CCol>

              <CCol md={3}><CFormLabel>Alternate Mobile Number</CFormLabel></CCol>
              <CCol md={3}>
                <CFormInput
                  value={form.alternateMobileNumber}
                  onChange={onChange('alternateMobileNumber')}
                  disabled={!isEdit}
                  invalid={!!errors.alternateMobileNumber}
                />
                {errors.alternateMobileNumber ? <CFormFeedback invalid>{errors.alternateMobileNumber}</CFormFeedback> : null}
              </CCol>

              <CCol md={3}><CFormLabel>Website</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.website} onChange={onChange('website')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>Email ID</CFormLabel></CCol>
              <CCol md={3}>
                <CFormInput value={form.emailId} onChange={onChange('emailId')} disabled={!isEdit} invalid={!!errors.emailId} />
                {errors.emailId ? <CFormFeedback invalid>{errors.emailId}</CFormFeedback> : null}
              </CCol>

              <CCol md={3}><CFormLabel>SRA</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.sra} onChange={onChange('sra')} disabled={!isEdit}>
                  <option value="">Select SRA</option>
                  {sraOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Institution Permanent ID</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.institutionPermanentId} onChange={onChange('institutionPermanentId')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>AICTE Reg. No</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.aicteRegNo} onChange={onChange('aicteRegNo')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>Upload Logo</CFormLabel></CCol>
              <CCol md={3}>
                <CFormInput type="file" accept="image/*" onChange={onLogoUpload} disabled={!isEdit} />
                {logoPreview ? <CImage src={logoPreview} width={56} height={56} className="mt-2 border" /> : null}
              </CCol>

              <CCol md={3}><CFormLabel>Name of the Correspondent</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.correspondentName} onChange={onChange('correspondentName')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>Correspondent Designation</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.correspondentDesignation} onChange={onChange('correspondentDesignation')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>Name of the Principal</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.principalName} onChange={onChange('principalName')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>Name of IQAC Coordinator / Director</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.iqacCoordinatorName} onChange={onChange('iqacCoordinatorName')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>Contact Number</CFormLabel></CCol>
              <CCol md={3}>
                <CFormInput
                  value={form.contactNumber}
                  onChange={onChange('contactNumber')}
                  disabled={!isEdit}
                  invalid={!!errors.contactNumber}
                />
                {errors.contactNumber ? <CFormFeedback invalid>{errors.contactNumber}</CFormFeedback> : null}
              </CCol>

              <CCol md={3}><CFormLabel>District</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.district} onChange={onChange('district')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>State</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.state} onChange={onChange('state')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>Country</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.country} onChange={onChange('country')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>NIRF Ranking</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.nirfRanking} onChange={onChange('nirfRanking')} disabled={!isEdit}>
                  <option value="">Select Ranking</option>
                  {nirfRankingOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Autonomous Status</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.autonomousGranted} onChange={onChange('autonomousGranted')} disabled={!isEdit}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Affiliating University</CFormLabel></CCol>
              <CCol md={3}><CFormInput value={form.affiliatedUniversity} onChange={onChange('affiliatedUniversity')} disabled={!isEdit} /></CCol>

              <CCol md={3}><CFormLabel>Type of the University</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.universityType} onChange={onChange('universityType')} disabled={!isEdit}>
                  <option value="">Select University Type</option>
                  {universityTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Accredited By</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.accreditedBy} onChange={onChange('accreditedBy')} disabled={!isEdit} invalid={!!errors.accreditedBy}>
                  <option value="">Select Accreditation</option>
                  {accreditedByOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </CFormSelect>
                {errors.accreditedBy ? <CFormFeedback invalid>{errors.accreditedBy}</CFormFeedback> : null}
              </CCol>

              <CCol md={3}><CFormLabel>Cycle</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect
                  value={form.accreditationCycle}
                  onChange={onChange('accreditationCycle')}
                  disabled={!isEdit}
                  invalid={!!errors.accreditationCycle}
                >
                  <option value="">Select Cycle</option>
                  {accreditationCycleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </CFormSelect>
                {errors.accreditationCycle ? <CFormFeedback invalid>{errors.accreditationCycle}</CFormFeedback> : null}
              </CCol>

              <CCol xs={12} className="d-flex justify-content-end gap-2">
                <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit || saving} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      <ArpDataTable
        title="Institution Details"
        rows={rows}
        columns={columns}
        loading={loading}
        selection={{
          type: 'radio',
          selected: selectedId,
          onChange: onRowSelect,
          key: 'id',
        }}
        scrollable
      />
    </>
  )
}

export default Institution
