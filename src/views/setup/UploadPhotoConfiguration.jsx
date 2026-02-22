import React, { useEffect, useRef, useState } from 'react'
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
import api from '../../services/apiClient'

const CATEGORY_OPTIONS = ['Profile Photo', 'Placement Photo', 'Event Photo', 'Achievement Photo']

const ENTITY_OPTIONS = [
  { value: 'student', label: 'Student (Register Number)' },
  { value: 'faculty', label: 'Faculty (Faculty Code)' },
]

const initialSingle = {
  entityType: 'student',
  category: '',
  idValue: '',
  file: null,
}

const initialBulk = {
  entityType: 'student',
  category: '',
  files: [],
}

const UploadPhotoConfiguration = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [institutionId, setInstitutionId] = useState('')
  const [institutions, setInstitutions] = useState([])
  const [single, setSingle] = useState(initialSingle)
  const [bulk, setBulk] = useState(initialBulk)

  const singleFileRef = useRef(null)
  const bulkFileRef = useRef(null)

  const resetForm = () => {
    setSingle(initialSingle)
    setBulk(initialBulk)
    if (singleFileRef.current) singleFileRef.current.value = ''
    if (bulkFileRef.current) bulkFileRef.current.value = ''
  }

  const onAddNew = () => setIsEdit(true)

  const onCancel = () => {
    setIsEdit(false)
    resetForm()
  }

  const loadRule = async (instId) => {
    if (!instId) return
    try {
      const res = await api.get('/api/setup/upload-photo/rule', {
        params: { institutionId: instId },
      })
      const row = res?.data?.data
      if (!row) return

      setSingle((p) => ({
        ...p,
        category: row.categoryOne || '',
        idValue: row.registerNoOption1 || '',
      }))
      setBulk((p) => ({
        ...p,
        category: row.categoryTwo || '',
      }))
    } catch {
      // keep defaults
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/setup/institution')
        const rows = Array.isArray(res?.data?.data) ? res.data.data : []
        setInstitutions(rows)
        const first = rows[0]?.id || ''
        setInstitutionId(first)
        if (first) await loadRule(first)
      } catch {
        setInstitutions([])
      }
    }
    load()
  }, [])

  const onInstitutionChange = async (e) => {
    const instId = e.target.value
    setInstitutionId(instId)
    resetForm()
    await loadRule(instId)
  }

  const onSingleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) {
      setSingle((p) => ({ ...p, file: null }))
      return
    }

    const okExt = /\.(jpg|jpeg|png)$/i.test(file.name || '')
    if (!okExt) {
      alert('Only JPG / JPEG / PNG files are allowed.')
      e.target.value = ''
      setSingle((p) => ({ ...p, file: null }))
      return
    }
    if (file.size > 40 * 1024) {
      alert('File size must be 40 KB or less.')
      e.target.value = ''
      setSingle((p) => ({ ...p, file: null }))
      return
    }

    setSingle((p) => ({ ...p, file }))
  }

  const onBulkFilesChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) {
      setBulk((p) => ({ ...p, files: [] }))
      return
    }
    if (files.length > 50) {
      alert('Only 50 images can be uploaded at a time.')
      e.target.value = ''
      setBulk((p) => ({ ...p, files: [] }))
      return
    }

    for (const f of files) {
      const okExt = /\.(jpg|jpeg|png)$/i.test(f.name || '')
      if (!okExt) {
        alert(`Invalid file type: ${f.name}. Only JPG/JPEG/PNG allowed.`)
        e.target.value = ''
        setBulk((p) => ({ ...p, files: [] }))
        return
      }
      if (f.size > 40 * 1024) {
        alert(`File too large: ${f.name}. Max size is 40 KB.`)
        e.target.value = ''
        setBulk((p) => ({ ...p, files: [] }))
        return
      }
    }

    setBulk((p) => ({ ...p, files }))
  }

  const saveRule = async (rule) => {
    await api.post('/api/setup/upload-photo/rule', {
      institutionId,
      ...rule,
    })
  }

  const onSingleSave = async (e) => {
    e.preventDefault()
    if (!isEdit) return
    if (!institutionId) return alert('Please select Institution.')
    if (!single.category || !single.idValue || !single.file) {
      return alert('Please select category, enter ID/Register Number, and choose photo.')
    }

    try {
      const fd = new FormData()
      fd.append('institutionId', institutionId)
      fd.append('entityType', single.entityType)
      fd.append('category', single.category)
      fd.append('idValue', single.idValue)
      fd.append('file', single.file)

      await api.post('/api/setup/upload-photo/file', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      await saveRule({
        categoryOne: single.category,
        registerNoOption1: single.idValue,
        fileOption1: single.file.name || null,
        categoryTwo: bulk.category || null,
        registerNoOption2: null,
        fileOption2: bulk.files.length ? `${bulk.files.length} files` : null,
      })

      alert('Single photo uploaded successfully.')
      setSingle(initialSingle)
      if (singleFileRef.current) singleFileRef.current.value = ''
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || 'Single upload failed')
    }
  }

  const onBulkSave = async (e) => {
    e.preventDefault()
    if (!isEdit) return
    if (!institutionId) return alert('Please select Institution.')
    if (!bulk.category || !bulk.files.length) {
      return alert('Please select category and choose bulk files.')
    }

    try {
      const fd = new FormData()
      fd.append('institutionId', institutionId)
      fd.append('entityType', bulk.entityType)
      fd.append('category', bulk.category)
      bulk.files.forEach((f) => fd.append('files', f))

      const res = await api.post('/api/setup/upload-photo/bulk', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const data = res?.data?.data || {}
      await saveRule({
        categoryOne: single.category || null,
        registerNoOption1: single.idValue || null,
        fileOption1: single.file?.name || null,
        categoryTwo: bulk.category,
        registerNoOption2: null,
        fileOption2: `${bulk.files.length} files`,
      })

      alert(
        `Bulk upload completed. Success: ${data.successCount || 0}, Failed: ${data.failedCount || 0}`,
      )
      setBulk(initialBulk)
      if (bulkFileRef.current) bulkFileRef.current.value = ''
    } catch (err) {
      alert(err?.response?.data?.error || err?.message || 'Bulk upload failed')
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>UPLOAD STUDENT / FACULTY PHOTO</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
            </div>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Common Scope</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="mb-2">
              <CCol md={3}>
                <CFormLabel>Institution</CFormLabel>
              </CCol>
              <CCol md={9}>
                <CFormSelect value={institutionId} onChange={onInstitutionChange} disabled={!isEdit}>
                  <option value="">Select Institution</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Single Upload (By Register Number / Faculty Code)</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSingleSave}>
              <CRow className="mb-3">
                <CCol md={3}>
                  <CFormLabel>Target</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={single.entityType}
                    onChange={(e) => setSingle((p) => ({ ...p, entityType: e.target.value }))}
                    disabled={!isEdit}
                  >
                    {ENTITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Category</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={single.category}
                    onChange={(e) => setSingle((p) => ({ ...p, category: e.target.value }))}
                    disabled={!isEdit}
                  >
                    <option value="">Select Category</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="mb-3 align-items-center">
                <CCol md={3}>
                  <CFormLabel>ID / Register Number</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    value={single.idValue}
                    onChange={(e) => setSingle((p) => ({ ...p, idValue: e.target.value }))}
                    disabled={!isEdit}
                    placeholder={single.entityType === 'student' ? 'e.g. 23MCA01' : 'e.g. FAC001'}
                  />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Photo</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <ArpButton
                    label="Choose Photo"
                    icon="upload"
                    color="primary"
                    disabled={!isEdit}
                    onClick={() => singleFileRef.current?.click()}
                  />
                  <input
                    ref={singleFileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={onSingleFileChange}
                  />
                  {single.file && <span className="ms-2 fst-italic">{single.file.name}</span>}
                </CCol>
              </CRow>

              <CRow>
                <CCol xs={12} className="d-flex justify-content-end">
                  <ArpButton label="Upload Single" icon="save" color="success" type="submit" disabled={!isEdit} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Bulk Upload (Max 50 Images)</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={onBulkSave}>
              <CRow className="mb-3">
                <CCol md={3}>
                  <CFormLabel>Target</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={bulk.entityType}
                    onChange={(e) => setBulk((p) => ({ ...p, entityType: e.target.value }))}
                    disabled={!isEdit}
                  >
                    {ENTITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Category</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={bulk.category}
                    onChange={(e) => setBulk((p) => ({ ...p, category: e.target.value }))}
                    disabled={!isEdit}
                  >
                    <option value="">Select Category</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="mb-3 align-items-center">
                <CCol md={3}>
                  <CFormLabel>Bulk Files</CFormLabel>
                </CCol>
                <CCol md={9}>
                  <ArpButton
                    label="Choose Files"
                    icon="upload"
                    color="primary"
                    disabled={!isEdit}
                    onClick={() => bulkFileRef.current?.click()}
                  />
                  <input
                    ref={bulkFileRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={onBulkFilesChange}
                  />
                  {bulk.files.length > 0 && (
                    <span className="ms-2 fst-italic">{bulk.files.length} file(s) selected</span>
                  )}
                </CCol>
              </CRow>

              <CRow>
                <CCol xs={12} className="d-flex justify-content-end">
                  <ArpButton label="Upload Bulk" icon="save" color="success" type="submit" disabled={!isEdit} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader>
            <strong>Information</strong>
          </CCardHeader>
          <CCardBody>
            <CListGroup flush>
              <CListGroupItem>
                Single Upload: Upload one image for one register number / faculty code
              </CListGroupItem>
              <CListGroupItem>
                Bulk Upload: File name must be the register number or faculty code (example: <strong>23MCA01.jpg</strong>)
              </CListGroupItem>
              <CListGroupItem>Only <strong>50</strong> images can be uploaded at a time</CListGroupItem>
              <CListGroupItem>The maximum size of each image is <strong>40 KB</strong></CListGroupItem>
              <CListGroupItem>Supported formats: <strong>JPG, JPEG, PNG</strong></CListGroupItem>
            </CListGroup>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default UploadPhotoConfiguration

