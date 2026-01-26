import React, { useMemo, useState } from 'react'
import { ArpButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

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
} from '@coreui/react-pro'

const initialForm = {
  name: '',
  year: '',
  type: '',
  category: '',
  address: '',
  district: '',
  state: 'Tamil Nadu',
  pincode: '',
  affiliatedUniversity: '',
  autonomous: '',
  accredited: '',
  accreditedBy: '',
}

const Institution = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)

  // Table UX state (future: connect to API + real loader)
  const [loading] = useState(false)

  // Year dropdown: 2000 → current year
  const years = useMemo(() => {
    const current = new Date().getFullYear()
    const arr = []
    for (let y = 2000; y <= current; y++) arr.push(String(y))
    return arr
  }, [])

  // Sample rows (replace later with API)
  const [rows] = useState([
    {
      id: 1,
      name: 'ABC College of Arts and Science College',
      year: '2016',
      type: 'Arts and Science College',
      category: 'Private Self-Financing',
      address: 'Pollachi',
      district: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '642001',
    },
  ])

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setForm(initialForm)
    setSelectedId(null)
    setIsEdit(true)
  }

  const onEdit = () => {
    const selected = rows.find((r) => r.id === selectedId)
    if (!selected) return
    setForm((p) => ({
      ...p,
      name: selected.name || '',
      year: selected.year || '',
      type: selected.type || '',
      category: selected.category || '',
      address: selected.address || '',
      district: selected.district || '',
      state: selected.state || 'Tamil Nadu',
      pincode: selected.pincode || '',
    }))
    setIsEdit(true)
  }

  const onCancel = () => setIsEdit(false)

  const onSave = (e) => {
    e.preventDefault()
    // Later: API call
    setIsEdit(false)
  }

  const columns = useMemo(
    () => [
      { key: 'id', label: 'ID', width: 80, sortable: true, align: 'center', sortType: 'number' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'year', label: 'Year', width: 90, sortable: true, align: 'center', sortType: 'number' },
      { key: 'type', label: 'Type', sortable: true },
      { key: 'category', label: 'Category', sortable: true },
      { key: 'address', label: 'Address', sortable: true },
      { key: 'district', label: 'District', sortable: true },
      { key: 'state', label: 'State', sortable: true },
      { key: 'pincode', label: 'Pincode', width: 110, sortable: true, align: 'center', sortType: 'number' },
    ],
    [],
  )

  return (
    <>
      {/* HEADER ACTIONS */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <strong>INSTITUTION SETUP</strong>

          <div className="d-flex align-items-center gap-2">
            <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
            <ArpButton
              label="Edit"
              icon="edit"
              color="primary"
              onClick={onEdit}
              disabled={!selectedId}
              title="Edit"
            />
            <ArpButton label="Delete" icon="delete" color="danger" disabled={!selectedId} title="Delete" />
          </div>
        </CCardHeader>

        <CCardBody>
          {/* FORM */}
          <CForm onSubmit={onSave}>
            <CRow className="g-3">
              {/* Row 1 */}
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
                <CFormSelect value={form.year} onChange={onChange('year')} disabled={!isEdit}>
                  <option value="">Select</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              {/* Row 2 */}
              <CCol md={3}>
                <CFormLabel>Type of Institution</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.type} onChange={onChange('type')} disabled={!isEdit}>
                  <option value="">Select</option>
                  <option value="Arts & Science College">Arts &amp; Science College</option>
                  <option value="Engineering College">Engineering College</option>
                  <option value="Health Science Institutions">Health Science Institutions</option>
                  <option value="Deemed to be University">Deemed to be University</option>
                  <option value="University">University</option>
                  <option value="Polytechnic">Polytechnic</option>
                  <option value="ITI">ITI</option>
                  <option value="School">School</option>
                  <option value="Others">Others</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Institution Category</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput value={form.category} onChange={onChange('category')} disabled={!isEdit} />
              </CCol>

              {/* Row 3 */}
              <CCol md={3}>
                <CFormLabel>Address</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput value={form.address} onChange={onChange('address')} disabled={!isEdit} />
              </CCol>

              <CCol md={3}>
                <CFormLabel>District</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput value={form.district} onChange={onChange('district')} disabled={!isEdit} />
              </CCol>

              {/* Row 4 */}
              <CCol md={3}>
                <CFormLabel>State</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput value={form.state} onChange={onChange('state')} disabled={!isEdit} />
              </CCol>

              <CCol md={3}>
                <CFormLabel>Pincode</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormInput value={form.pincode} onChange={onChange('pincode')} disabled={!isEdit} />
              </CCol>

              {/* Row 5 */}
              <CCol md={3}>
                <CFormLabel>Affiliated University</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={form.affiliatedUniversity}
                  onChange={onChange('affiliatedUniversity')}
                  disabled={!isEdit}
                >
                  <option value="">Select</option>
                  <option value="Anna University">Anna University</option>
                  <option value="University of Madras">University of Madras</option>
                  <option value="Bharathiar University">Bharathiar University</option>
                  <option value="Bharathidasan University">Bharathidasan University</option>
                  <option value="Alagappa University">Alagappa University</option>
                  <option value="Others">Others</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Whether Autonomous Granted?</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.autonomous} onChange={onChange('autonomous')} disabled={!isEdit}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </CFormSelect>
              </CCol>

              {/* Row 6 */}
              <CCol md={3}>
                <CFormLabel>Whether Institution got accreditation?</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.accredited} onChange={onChange('accredited')} disabled={!isEdit}>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Accredited By</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect value={form.accreditedBy} onChange={onChange('accreditedBy')} disabled={!isEdit}>
                  <option value="">Select</option>
                  <option value="NAAC">NAAC</option>
                  <option value="NBA">NBA</option>
                  <option value="Others">Others</option>
                </CFormSelect>
              </CCol>

              {/* Actions */}
              <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                <ArpButton
                  label="Save"
                  icon="save"
                  color="success"
                  type="submit"
                  disabled={!isEdit}
                  title="Save"
                />
                <ArpButton
                  label="Cancel"
                  icon="cancel"
                  color="secondary"
                  type="button"
                  onClick={onCancel}
                  title="Cancel"
                />
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      {/* INSTITUTION DETAILS TABLE (ArpDataTable Standard) */}
      <ArpDataTable
        title="Institution Details"
        rows={rows}
        columns={columns}
        loading={loading}
        headerActions={null}
        selection={{
          type: 'radio',
          selected: selectedId,
          onChange: (id) => setSelectedId(id),
          key: 'id',
          headerLabel: 'Select',
          width: 60,
          name: 'institutionRow',
        }}
      />
    </>
  )
}

export default Institution
