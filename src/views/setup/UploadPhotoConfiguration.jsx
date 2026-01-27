import React, { useRef, useState } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormInput,
  CListGroup,
  CListGroupItem,
} from '@coreui/react-pro'
import { ArpButton } from '../../components/common'

/**
 * Converted from upload_photo.html
 * ARP Standard:
 * - 3-card layout (Header → Form → Information)
 * - Add New enables form fields
 * - Upload buttons trigger hidden file inputs
 * - Selected file name shown beside Upload button
 */

const initialForm = {
  category1: '',
  category2: '',
  regNo1: '',
  regNo2: '',
  file1: null,
  file2: null,
}

const UploadPhotoConfiguration = () => {
  const [isEdit, setIsEdit] = useState(false)

  const [form, setForm] = useState(initialForm)

  const fileRef1 = useRef(null)
  const fileRef2 = useRef(null)

  const onAddNew = () => {
    setIsEdit(true)
  }

  const onCancel = () => {
    setIsEdit(false)
    setForm(initialForm)
    if (fileRef1.current) fileRef1.current.value = ''
    if (fileRef2.current) fileRef2.current.value = ''
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!isEdit) return

    // Minimal validation (extend with API validation as needed)
    if (!form.category1 || !form.regNo1 || !form.file1) {
      alert('Please select Category 1, enter Registration No. 1, and upload Photo 1 (<= 40 KB).')
      return
    }

    // Hook API submit here
    alert('Saved successfully (demo).')
    onCancel()
  }

  const onChange = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }))
  }

  const onFileChange = (key) => (e) => {
    const file = e.target.files && e.target.files[0]

    if (!file) {
      setForm((p) => ({ ...p, [key]: null }))
      return
    }

    // Validate extension
    const okExt = /\.(jpg|jpeg|png)$/i.test(file.name || '')
    if (!okExt) {
      alert('Only JPG / JPEG / PNG files are allowed.')
      e.target.value = ''
      setForm((p) => ({ ...p, [key]: null }))
      return
    }

    // Validate size (<= 40 KB)
    const maxBytes = 40 * 1024
    if (file.size > maxBytes) {
      alert('File size must be 40 KB or less.')
      e.target.value = ''
      setForm((p) => ({ ...p, [key]: null }))
      return
    }

    setForm((p) => ({ ...p, [key]: file }))
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>UPLOAD STUDENT / FACULTY PHOTO</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton
                label="Download Template"
                icon="download"
                color="danger"
                href="/assets/datatemplates/Data_Template1.xlsx"
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Upload Student / Faculty Photo</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSave}>
              {/* Row 1 */}
              <CRow className="mb-3">
                <CCol md={3}><CFormLabel>Category</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect disabled={!isEdit} value={form.category1} onChange={onChange('category1')}>
                    <option value="">Select Category</option>
                    <option>Profile Photo</option>
                    <option>Placement Photo</option>
                    <option>Event Photo</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Category</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect disabled={!isEdit} value={form.category2} onChange={onChange('category2')}>
                    <option value="">Select Category</option>
                    <option>Profile Photo</option>
                    <option>Achievement Photo</option>
                    <option>Event Photo</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Row 2 */}
              <CRow className="mb-3">
                <CCol md={3}><CFormLabel>ID / Register Number</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect disabled={!isEdit} value={form.regNo1} onChange={onChange('regNo1')}>
                    <option value="">Select ID / Register Number</option>
                    <option>N26MBA</option>
                    <option>N27MCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>ID / Register Number</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect disabled={!isEdit} value={form.regNo2} onChange={onChange('regNo2')}>
                    <option value="">Select ID / Register Number</option>
                    <option>N26MBA</option>
                    <option>N27MCA</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* Row 3 */}
              <CRow className="mb-3 align-items-center">
                <CCol md={3}><CFormLabel>Upload Photo</CFormLabel></CCol>
                <CCol md={3}>
                  <ArpButton
                    label="Upload"
                    icon="upload"
                    color="primary"
                    disabled={!isEdit}
                    onClick={() => fileRef1.current?.click()}
                  />
                  <input
                    ref={fileRef1}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={onFileChange('file1')}
                  />
                  {form.file1 && (
                    <span className="ms-2 fst-italic">{form.file1.name}</span>
                  )}
                </CCol>

                <CCol md={3}><CFormLabel>Upload Photo</CFormLabel></CCol>
                <CCol md={3}>
                  <ArpButton
                    label="Upload"
                    icon="upload"
                    color="primary"
                    disabled={!isEdit}
                    onClick={() => fileRef2.current?.click()}
                  />
                  <input
                    ref={fileRef2}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={onFileChange('file2')}
                  />
                  {form.file2 && (
                    <span className="ms-2 fst-italic">{form.file2.name}</span>
                  )}
                </CCol>
              </CRow>

              <CRow className="mt-3">
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= INFORMATION CARD ================= */}
        <CCard>
          <CCardHeader>
            <strong>Information</strong>
          </CCardHeader>
          <CCardBody>
            <CListGroup flush>
              <CListGroupItem>Only <strong>50</strong> images can be uploaded at a time</CListGroupItem>
              <CListGroupItem>The maximum size of an image must not exceed <strong>40 KB</strong></CListGroupItem>
              <CListGroupItem>The image format must be <strong>JPEG</strong></CListGroupItem>
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default UploadPhotoConfiguration
