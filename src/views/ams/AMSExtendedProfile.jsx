import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'

import { ArpButton, ArpIconButton, ArpPagination } from '../../components/common'

const initialSSRForm = {
  manualId: '',
  criteriaNo: '',
  metricNo: '',
  inputFormat: '',
}

const initialFormA = {
  description: '',
  cay: '',
  cay1: '',
  cay2: '',
  cay3: '',
  cay4: '',
}

const initialFormB = {
  description: '',
  dataInput: '',
}

const ExtendedProfile = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [ssrForm, setSsrForm] = useState(initialSSRForm)
  const [formA, setFormA] = useState(initialFormA)
  const [formB, setFormB] = useState(initialFormB)

  const [showFormA, setShowFormA] = useState(false)
  const [showFormB, setShowFormB] = useState(false)
  const [showTable, setShowTable] = useState(false)

  // Table search/sort/pagination
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'criteria', dir: 'asc' })
  const [page, setPage] = useState(1) // 1-based
  const [pageSize, setPageSize] = useState(10)

  // Upload ref
  const uploadRef = useRef(null)

  // Demo rows (replace with API later)
  const rows = useMemo(
    () => [
      { id: 1, criteria: '1', metric: 'Metric No1', description: 'Dummy Description A' },
      { id: 2, criteria: '2', metric: 'Metric No2', description: 'Dummy Description B' },
    ],
    [],
  )

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const sortToggle = (key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
    })
  }

  const sortIndicator = (key) => {
    if (sort.key !== key) return ''
    return sort.dir === 'asc' ? ' ▲' : ' ▼'
  }

  const filteredSorted = useMemo(() => {
    const q = normalize(search)
    let data = rows

    if (q) {
      data = rows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))
    }

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) => normalize(a?.[key]).localeCompare(normalize(b?.[key])))
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [rows, search, sort])

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  const pageRows = useMemo(() => filteredSorted.slice(startIdx, endIdx), [filteredSorted, startIdx, endIdx])

  const onSSRChange = (key) => (e) => setSsrForm((p) => ({ ...p, [key]: e.target.value }))
  const onFormAChange = (key) => (e) => setFormA((p) => ({ ...p, [key]: e.target.value }))
  const onFormBChange = (key) => (e) => setFormB((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setSelectedId(null)
    setIsEdit(true)
    setShowFormA(false)
    setShowFormB(false)
    setShowTable(false)
    setSsrForm(initialSSRForm)
    setFormA(initialFormA)
    setFormB(initialFormB)
  }

  const onView = () => {
    // Phase 4: show table without hiding SSR
    setShowTable(true)
    setShowFormA(false)
    setShowFormB(false)
    setIsEdit(false)
  }

  const onSearchSSR = () => {
    // Phase 2/3: show input form based on format; SSR stays visible
    if (!ssrForm.inputFormat) return

    if (ssrForm.inputFormat === 'EP-5DI-1T') {
      setShowFormA(true)
      setShowFormB(false)
    } else if (ssrForm.inputFormat === 'EP-1DI-1T') {
      setShowFormB(true)
      setShowFormA(false)
    }
    setShowTable(false)
  }

  const onResetSSR = () => {
    setSsrForm(initialSSRForm)
    setShowFormA(false)
    setShowFormB(false)
    setShowTable(false)
  }

  const onCancelSSR = () => {
    setIsEdit(false)
    onResetSSR()
  }

  const onSaveInput = () => {
    // Hook your API save here
    setShowTable(true)
    setShowFormA(false)
    setShowFormB(false)
    setIsEdit(false)
  }

  const onUploadClick = () => uploadRef.current?.click()
  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Hook your upload handler here
    e.target.value = ''
  }

  const onDownloadTemplate = () => {
    // Adjust template path if needed
    window.open('/templates/Extended_Profile_Template.xlsx', '_blank')
  }

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>EXTENDED PROFILE (SSR)</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="View" icon="view" color="info" onClick={onView} />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD (SSR) ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Extended Profile (SSR)</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
                {/* 2 rows x 4 columns (each column = md=3) */}
                <CCol md={3}>
                  <CFormLabel>Choose Manual ID</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={ssrForm.manualId} onChange={onSSRChange('manualId')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Manual Id - 1">Manual Id - 1</option>
                    <option value="Manual Id - 2">Manual Id - 2</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose EP Criteria Number</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={ssrForm.criteriaNo} onChange={onSSRChange('criteriaNo')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Metric Number</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={ssrForm.metricNo} onChange={onSSRChange('metricNo')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Metric No1">Metric No1</option>
                    <option value="Metric No2">Metric No2</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Defined Input Data Format</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={ssrForm.inputFormat} onChange={onSSRChange('inputFormat')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="EP-5DI-1T">EP-5DI-1T</option>
                    <option value="EP-1DI-1T">EP-1DI-1T</option>
                  </CFormSelect>
                </CCol>

                {/* Buttons right aligned */}
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Search" icon="search" color="info" onClick={onSearchSSR} />
                  <ArpButton label="Reset" icon="reset" color="warning" onClick={onResetSSR} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelSSR} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= INPUT FORM A (EP-5DI-1T) ================= */}
        {showFormA && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Input to Extended Profile</strong>
            </CCardHeader>

            <CCardBody>
              <CForm>
                <CRow className="g-3">
                  {/* Row 1: 4 columns layout; col2+3+4 merged => md=9 */}
                  <CCol md={3}>
                    <CFormLabel>Metric Description</CFormLabel>
                  </CCol>
                  <CCol md={9}>
                    <CFormTextarea
                      value={formA.description}
                      onChange={onFormAChange('description')}
                      placeholder="Metric Description"
                      rows={3}
                    />
                  </CCol>

                  {/* Row 2: 6 columns => md=2 each */}
                  <CCol md={2}>
                    <CFormLabel>Year</CFormLabel>
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>CAY</CFormLabel>
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>CAY - 1</CFormLabel>
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>CAY - 2</CFormLabel>
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>CAY - 3</CFormLabel>
                  </CCol>
                  <CCol md={2}>
                    <CFormLabel>CAY - 4</CFormLabel>
                  </CCol>

                  {/* Row 3: 6 columns => label 'Number' + 5 textboxes */}
                  <CCol md={2}>
                    <CFormLabel>Number</CFormLabel>
                  </CCol>
                  <CCol md={2}>
                    <CFormInput value={formA.cay} onChange={onFormAChange('cay')} />
                  </CCol>
                  <CCol md={2}>
                    <CFormInput value={formA.cay1} onChange={onFormAChange('cay1')} />
                  </CCol>
                  <CCol md={2}>
                    <CFormInput value={formA.cay2} onChange={onFormAChange('cay2')} />
                  </CCol>
                  <CCol md={2}>
                    <CFormInput value={formA.cay3} onChange={onFormAChange('cay3')} />
                  </CCol>
                  <CCol md={2}>
                    <CFormInput value={formA.cay4} onChange={onFormAChange('cay4')} />
                  </CCol>

                  {/* Row 4: 6 columns: download label+btn, upload label+btn, col5+6 merged for Save/Reset/Cancel */}
                  <CCol md={2}>
                    <CFormLabel>Download Data Template</CFormLabel>
                  </CCol>
                  <CCol md={2}>
                    <ArpButton label="Download" icon="download" color="danger" onClick={onDownloadTemplate} />
                  </CCol>

                  <CCol md={2}>
                    <CFormLabel>Upload Data Input</CFormLabel>
                  </CCol>
                  <CCol md={2}>
                    <input ref={uploadRef} type="file" hidden onChange={onFileChange} />
                    <ArpButton label="Upload" icon="upload" color="info" onClick={onUploadClick} />
                  </CCol>

                  <CCol md={4} className="d-flex justify-content-end gap-2">
                    <ArpButton label="Save" icon="save" color="success" onClick={onSaveInput} />
                    <ArpButton label="Reset" icon="reset" color="warning" onClick={() => setFormA(initialFormA)} />
                    <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={() => setShowFormA(false)} />
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        )}

        {/* ================= INPUT FORM B (EP-1DI-1T) ================= */}
        {showFormB && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Input to Extended Profile (B)</strong>
            </CCardHeader>

            <CCardBody>
              <CForm>
                <CRow className="g-3">
                  {/* Row 1: col2+3+4 merged => md=9 */}
                  <CCol md={3}>
                    <CFormLabel>Metric Description</CFormLabel>
                  </CCol>
                  <CCol md={9}>
                    <CFormTextarea
                      value={formB.description}
                      onChange={onFormBChange('description')}
                      placeholder="Metric Description"
                      rows={3}
                    />
                  </CCol>

                  {/* Row 2: 6 columns */}
                  <CCol md={2}>
                    <CFormLabel>Data Input</CFormLabel>
                  </CCol>
                  <CCol md={2}>
                    <CFormInput value={formB.dataInput} onChange={onFormBChange('dataInput')} />
                  </CCol>

                  <CCol md={2}>
                    <CFormLabel>Download Data Template</CFormLabel>
                  </CCol>
                  <CCol md={2}>
                    <ArpButton label="Download" icon="download" color="danger" onClick={onDownloadTemplate} />
                  </CCol>

                  <CCol md={2}>
                    <CFormLabel>Upload Data Template</CFormLabel>
                  </CCol>
                  <CCol md={2}>
                    <input ref={uploadRef} type="file" hidden onChange={onFileChange} />
                    <ArpButton label="Upload" icon="upload" color="info" onClick={onUploadClick} />
                  </CCol>

                  {/* Buttons below form (right aligned) */}
                  <CCol xs={12} className="d-flex justify-content-end gap-2">
                    <ArpButton label="Save" icon="save" color="success" onClick={onSaveInput} />
                    <ArpButton label="Reset" icon="reset" color="warning" onClick={() => setFormB(initialFormB)} />
                    <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={() => setShowFormB(false)} />
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        )}

        {/* ================= TABLE CARD (Phase 4) ================= */}
        {showTable && (
          <CCard className="mb-3">
            {/* Header: keep ONE ROW toolbar like Department (Search + Page size). Icon buttons moved BEFORE table aligned LEFT. */}
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Metrics for Extended Profile</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                <CInputGroup size="sm" style={{ width: 280, flex: '0 0 auto' }}>
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
                </CInputGroup>

                <CFormSelect
                  size="sm"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{ width: 120, flex: '0 0 auto' }}
                  title="Rows per page"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </CFormSelect>
              </div>
            </CCardHeader>

            <CCardBody>
              {/* Phase 4: action icons BEFORE table aligned LEFT */}
              <div className="d-flex gap-2 align-items-center mb-2" style={{ overflowX: 'auto' }}>
                <ArpIconButton icon="download" color="danger" title="Download" onClick={onDownloadTemplate} />
                <ArpIconButton icon="view" color="purple" title="View" disabled={!selectedId} />
                <ArpIconButton icon="edit" color="info" title="Edit" disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" title="Delete" disabled={!selectedId} />
              </div>

              <CTable hover responsive align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('criteria')}>
                      EP_Criteria{sortIndicator('criteria')}
                    </CTableHeaderCell>

                    <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('metric')}>
                      EP_Metric No{sortIndicator('metric')}
                    </CTableHeaderCell>

                    <CTableHeaderCell>Description</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {pageRows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={4} className="text-center py-4">
                        No records found.
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    pageRows.map((r) => (
                      <CTableRow key={r.id}>
                        <CTableDataCell className="text-center">
                          <input
                            type="radio"
                            name="epRow"
                            checked={selectedId === r.id}
                            onChange={() => setSelectedId(r.id)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>{r.criteria}</CTableDataCell>
                        <CTableDataCell>{r.metric}</CTableDataCell>
                        <CTableDataCell>{r.description}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              <ArpPagination
                page={safePage}
                totalPages={totalPages}
                onChange={setPage}
                size="sm"
                align="end"
                prevText="Previous"
                nextText="Next"
              />
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default ExtendedProfile
