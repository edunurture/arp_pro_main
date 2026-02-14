import React, { useEffect, useMemo, useState } from 'react'
import { ArpButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'
import api from '../../services/apiClient'

import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CAlert,
} from '@coreui/react-pro'

/**
 * ✅ IMPORTANT
 * This file assumes Vite proxy is configured in vite.config.mts:
 *  server.proxy['/api'] -> http://localhost:4000
 * So we can call relative URLs like /api/setup/institution
 */

const initialForm = {
  code: '',
  name: '',
  yearOfEstablishment: '',
  type: '',
  category: '',
  address: '',
  district: '',
  state: 'Tamil Nadu',
  pincode: '',
  affiliatedUniversity: '',
  autonomousGranted: 'No',
  isAccredited: 'No',
  accreditedBy: '',
  isActive: true,
}

// WF05 – Institution Category dropdown
const institutionCategoryOptions = [
  'Govt – University',
  'Deemed to be University',
  'Government Institution',
  'Private/Self-Financing Institution',
  'Govt – Aided Institution',
  'Others',
]

// ✅ From Prisma enum: InstitutionType (edit labels if your enum differs)
const institutionTypeOptions = [
  { value: 'ARTS_SCIENCE_COLLEGE', label: 'Arts & Science College' },
  { value: 'ENGINEERING_COLLEGE', label: 'Engineering College' },
  { value: 'HEALTH_SCIENCE_INSTITUTIONS', label: 'Health Science Institutions' },
  { value: 'DEEMED_TO_BE_UNIVERSITY', label: 'Deemed to be University' },
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'POLYTECHNIC', label: 'Polytechnic' },
  { value: 'ITI', label: 'ITI' },
  { value: 'SCHOOL', label: 'School' },
  { value: 'OTHERS', label: 'Others' },
]

// ✅ From Prisma enum: AffiliatedUniversity (edit labels if your enum differs)
const affiliatedUniversityOptions = [
  { value: 'ANNA_UNIVERSITY', label: 'Anna University' },
  { value: 'UNIVERSITY_OF_MADRAS', label: 'University of Madras' },
  { value: 'BHARATHIAR_UNIVERSITY', label: 'Bharathiar University' },
  { value: 'BHARATHIDASAN_UNIVERSITY', label: 'Bharathidasan University' },
  { value: 'ALAGAPPA_UNIVERSITY', label: 'Alagappa University' },
  { value: 'OTHERS', label: 'Others' },
]

// ✅ From Prisma enum: AccreditationBody (edit if your enum differs)
const accreditationBodyOptions = [
  { value: 'NAAC', label: 'NAAC' },
  { value: 'NBA', label: 'NBA' },
  { value: 'OTHERS', label: 'Others' },
]

const indianStates = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
]

const toYesNo = (val) => (val ? 'Yes' : 'No')
const toBool = (val) => val === 'Yes'

const Institution = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState(null)

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    const arr = []
    for (let y = 1950; y <= current; y++) arr.push(String(y))
    return arr.reverse()
  }, [])

  const columns = [
    { key: 'code', label: 'Institution Code' },
    { key: 'name', label: 'Institution Name' },
    { key: 'yearOfEstablishment', label: 'Year' },
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'district', label: 'District' },
    { key: 'state', label: 'State' },
    { key: 'pincode', label: 'Pincode' },
  ]

  const showToast = (type, message) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4500)
  }

  const mapApiRowToForm = (row) => ({
    code: row?.code ?? '',
    name: row?.name ?? '',
    yearOfEstablishment: row?.yearOfEstablishment ?? '',
    type: row?.type ?? '',
    category: row?.category ?? '',
    address: row?.address ?? '',
    district: row?.district ?? '',
    state: row?.state ?? 'Tamil Nadu',
    pincode: row?.pincode ?? '',
    affiliatedUniversity: row?.affiliatedUniversity ?? '',
    autonomousGranted: toYesNo(row?.autonomousGranted),
    isAccredited: toYesNo(row?.isAccredited),
    accreditedBy: row?.accreditedBy ?? '',
    isActive: row?.isActive ?? true,
  })

  const buildPayloadForApi = () => {
    const payload = {
      name: form.name?.trim(),
      yearOfEstablishment: form.yearOfEstablishment ? Number(form.yearOfEstablishment) : null,
      type: form.type || null,
      category: form.category || null,
      address: form.address?.trim() || null,
      district: form.district?.trim() || null,
      state: form.state || 'Tamil Nadu',
      pincode: form.pincode || '',
      affiliatedUniversity: form.affiliatedUniversity || null,
      autonomousGranted: toBool(form.autonomousGranted),
      isAccredited: toBool(form.isAccredited),
      accreditedBy: toBool(form.isAccredited) ? form.accreditedBy || null : null,
      isActive: form.isActive !== false,
    }
    return payload
  }

  const validateForm = () => {
    if (!form.name?.trim()) return 'Institution Name is required'
    if (!form.yearOfEstablishment) return 'Year of Establishment is required'
    if (!/^[0-9]{6}$/.test(String(form.pincode || ''))) return 'Pincode must be 6 digits'
    if (form.isAccredited === 'Yes' && !form.accreditedBy) return 'Please select Accredited By'
    return null
  }

  const loadInstitutions = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/setup/institution')
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : []
      setRows(list)
    } catch (err) {
      console.error('Institution load error:', err)
      const msg =
        err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load data'
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
    setIsEdit(true)
  }

  const onEdit = () => {
    if (!selectedId) return
    const selected = rows.find((r) => r.id === selectedId)
    if (!selected) return
    setForm(mapApiRowToForm(selected))
    setIsEdit(true)
  }

  const onCancel = () => {
    setForm(initialForm)
    setIsEdit(false)
  }

  const onSave = async (e) => {
    e.preventDefault()

    const err = validateForm()
    if (err) return showToast('danger', err)

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
      console.error('Institution save error:', error)
      const msg =
        error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Save failed'
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
      console.error('Institution delete error:', error)
      const msg =
        error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Delete failed'
      showToast('danger', msg)
    }
  }

  const onRowSelect = (id) => {
    setSelectedId(id)
    const row = rows.find((r) => r.id === id)
    if (row) setForm(mapApiRowToForm(row)) // WF18: view selected record in form
  }

  const onChange = (key) => (e) => {
    const value = e?.target?.value
    setForm((p) => {
      const next = { ...p, [key]: value }
      // WF13: AccreditedBy enabled only when isAccredited = Yes
      if (key === 'isAccredited' && value !== 'Yes') next.accreditedBy = ''
      return next
    })
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
              <CCol md={3}>
                <CFormLabel>Institution Code</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput value={form.code} disabled />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Institution Name</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput value={form.name} onChange={onChange('name')} disabled={!isEdit} />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Year of Establishment</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.yearOfEstablishment} onChange={onChange('yearOfEstablishment')} disabled={!isEdit}>
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Type of Institution</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.type} onChange={onChange('type')} disabled={!isEdit}>
                  <option value="">Select Type of Institution</option>
                  {institutionTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Institution Category</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.category} onChange={onChange('category')} disabled={!isEdit}>
                  <option value="">Select Institution Category</option>
                  {institutionCategoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Address</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormTextarea value={form.address} onChange={onChange('address')} disabled={!isEdit} rows={2} />
              </CCol>

              <CCol md={3}>
                <CFormLabel>District</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput value={form.district} onChange={onChange('district')} disabled={!isEdit} />
              </CCol>

              <CCol md={3}>
                <CFormLabel>State</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.state} onChange={onChange('state')} disabled={!isEdit}>
                  <option value="">Select State</option>
                  {indianStates.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Pincode</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput value={form.pincode} onChange={onChange('pincode')} disabled={!isEdit} />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Affiliated University</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.affiliatedUniversity} onChange={onChange('affiliatedUniversity')} disabled={!isEdit}>
                  <option value="">Select Affiliated University</option>
                  {affiliatedUniversityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Whether Autonomous Granted?</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.autonomousGranted} onChange={onChange('autonomousGranted')} disabled={!isEdit}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Whether Institution got accreditation?</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.isAccredited} onChange={onChange('isAccredited')} disabled={!isEdit}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Accredited By</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={form.accreditedBy}
                  onChange={onChange('accreditedBy')}
                  disabled={!isEdit || form.isAccredited !== 'Yes'}
                >
                  <option value="">Select Accredited By</option>
                  {accreditationBodyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </CFormSelect>
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
