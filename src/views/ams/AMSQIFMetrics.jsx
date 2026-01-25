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
  CFormCheck,
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

/**
 * AMSQIFMetrics.jsx
 * Accreditation Management System (AMS) — Quality Indicator Frameworks (QIF) Metrics
 * CoreUI React Pro + ARP Standard (Department.jsx / ExtendedProfile.jsx pattern)
 */

const criteriaOptions = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
const keyIndicatorOptions = ['KI - 1', 'KI - 2', 'KI - 3']
const sopFormulaOptions = ['SOP', 'Formula']
const yearOfDataOptions = ['CAY', 'CAY – 1', 'CAY – 2', 'CAY – 3', 'CAY – 4', 'Five Year Data']
const yesNoOptions = ['Yes', 'No']
const docCategoryOptions = ['Document Category - 1', 'Document Category - 2', 'Document Category - 3']
const programmeOptions = ['BCA', 'MCA', 'M.Phil.', 'Ph.D.']
const fileLocationOptions = ['NAAC Server', 'Website']

// Phase 1 (QIF) form
const initialQifForm = {
  criteria: '',
  criteriaDesc: '',
  keyIndicator: '',
}

// Phase 2 (Metric row) form
const initialMetricRow = {
  metricNo: '',
  subMetricNo: '',
  metricType: '',
  description: '',
  weightage: '',
}

// Phase 4 — A (Rich Text)
const initialFormA = {
  narrative: '',
}

// Phase 5 — B
const initialFormB = {
  sopOrFormula: 'SOP',
  dataInput: '',
  responseValue: '',
}

// Phase 6 — C (1SM-5DI-1T)
const initialFormC = {
  sopOrFormula: 'SOP',
  labelId1: 'Label ID 1',
  labelId2: 'Label ID 2',
  cay: '',
  cay1: '',
  cay2: '',
  cay3: '',
  cay4: '',
  responseValue: '',
}

// Phase 7 — D (2SM-2DI-1T)
const initialFormD = {
  sopOrFormula: 'SOP',
  subMetricDesc1: 'Sub Metric Description – 1',
  input1: '',
  responseValue1: '',
  subMetricDesc2: 'Sub Metric Description – 1',
  input2: '',
  responseValue2: '',
}

// Phase 8 — E (2SM-5DI-2T)
const initialFormE = {
  sopOrFormula: 'SOP',
  subMetricDesc1: 'Sub Metric Description – 1',
  sm1_cay: '',
  sm1_cay1: '',
  sm1_cay2: '',
  sm1_cay3: '',
  sm1_cay4: '',
  subMetricDesc2: 'Sub Metric Description – 2',
  sm2_cay: '',
  sm2_cay1: '',
  sm2_cay2: '',
  sm2_cay3: '',
  sm2_cay4: '',
}

// Phase 9 — F (Additional Info Search)
const initialAdditionalSearch = {
  yearOfData: '',
  programmeWise: '',
}

// Phase 10 — Upload Additional Information rows
const newUploadRow = (id) => ({
  id,
  selected: false,
  docCategory: '',
  programme: '',
  fileLocation: '',
  fileName: '',
})

const AMSQIFMetrics = () => {
  // ARP standard states
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // Phase 1 / Phase 2 state
  const [qifForm, setQifForm] = useState(initialQifForm)
  const [metricRow, setMetricRow] = useState(initialMetricRow)

  // Phase visibility
  const [showKeyIndicatorBlock, setShowKeyIndicatorBlock] = useState(false) // Phase 2
  const [showPhase3Cards, setShowPhase3Cards] = useState(false) // Phase 3 (A..F)
  const [showAdditionalUpload, setShowAdditionalUpload] = useState(false) // Phase 10A
  const [showAdditionalView, setShowAdditionalView] = useState(false) // Phase 10B

  // Phase 4..8 forms
  const [formA, setFormA] = useState(initialFormA)
  const [formB, setFormB] = useState(initialFormB)
  const [formC, setFormC] = useState(initialFormC)
  const [formD, setFormD] = useState(initialFormD)
  const [formE, setFormE] = useState(initialFormE)

  // Phase 9 search
  const [additionalSearch, setAdditionalSearch] = useState(initialAdditionalSearch)

  // Upload Additional Information dynamic rows
  const [uploadRows, setUploadRows] = useState([newUploadRow(1)])

  // View Additional Information table controls (ARP standard)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'docCategory', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Upload refs (templates)
  const uploadTemplateRef = useRef(null)
  const uploadDataTemplateRef = useRef(null)

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  // ---------- Dummy helpers to simulate dependent fields ----------
  const metricCatalog = useMemo(
    () => ({
      'Metric Number - 1': {
        subMetrics: ['Sub Metric - 1', 'Sub Metric - 2'],
        metricType: 'Metric Type - A',
        description: 'Metric Description for Metric Number - 1',
        weightage: '10',
      },
      'Metric Number - 2': {
        subMetrics: ['Sub Metric - 1', 'Sub Metric - 2', 'Sub Metric - 3'],
        metricType: 'Metric Type - B',
        description: 'Metric Description for Metric Number - 2',
        weightage: '15',
      },
    }),
    [],
  )

  useEffect(() => {
    // Auto-populate placeholders when Metric No changes (disabled fields)
    const meta = metricCatalog?.[metricRow.metricNo]
    if (!meta) {
      setMetricRow((p) => ({ ...p, subMetricNo: '', metricType: '', description: '', weightage: '' }))
      return
    }

    setMetricRow((p) => ({
      ...p,
      subMetricNo: p.subMetricNo && meta.subMetrics.includes(p.subMetricNo) ? p.subMetricNo : '',
      metricType: meta.metricType,
      description: meta.description,
      weightage: meta.weightage,
    }))
  }, [metricRow.metricNo, metricCatalog])

  // ---------- Sorting helpers ----------
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

  // ---------- View Additional Information dummy rows ----------
  const viewRows = useMemo(
    () => [
      { id: 1, docCategory: 'Document Category - 1', programme: 'BCA', fileLocation: 'NAAC Server', fileLog: 'file_01.pdf' },
      { id: 2, docCategory: 'Document Category - 2', programme: 'MCA', fileLocation: 'Website', fileLog: 'file_02.xlsx' },
      { id: 3, docCategory: 'Document Category - 1', programme: 'Ph.D.', fileLocation: 'NAAC Server', fileLog: 'file_03.docx' },
      { id: 4, docCategory: 'Document Category - 3', programme: 'M.Phil.', fileLocation: 'Website', fileLog: 'file_04.pdf' },
      { id: 5, docCategory: 'Document Category - 2', programme: 'BCA', fileLocation: 'NAAC Server', fileLog: 'file_05.xlsx' },
    ],
    [],
  )

  const filteredSorted = useMemo(() => {
    const q = normalize(search)
    let data = viewRows

    if (q) data = viewRows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) => normalize(a?.[key]).localeCompare(normalize(b?.[key])))
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [viewRows, search, sort])

  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)

  const pageRows = useMemo(() => filteredSorted.slice(startIdx, endIdx), [filteredSorted, startIdx, endIdx])

  // ---------- Change handlers ----------
  const onQifChange = (key) => (e) => setQifForm((p) => ({ ...p, [key]: e.target.value }))
  const onMetricChange = (key) => (e) => setMetricRow((p) => ({ ...p, [key]: e.target.value }))

  const onFormAChange = (key) => (e) => setFormA((p) => ({ ...p, [key]: e.target.value }))
  const onFormBChange = (key) => (e) => setFormB((p) => ({ ...p, [key]: e.target.value }))
  const onFormCChange = (key) => (e) => setFormC((p) => ({ ...p, [key]: e.target.value }))
  const onFormDChange = (key) => (e) => setFormD((p) => ({ ...p, [key]: e.target.value }))
  const onFormEChange = (key) => (e) => setFormE((p) => ({ ...p, [key]: e.target.value }))

  const onAdditionalSearchChange = (key) => (e) => setAdditionalSearch((p) => ({ ...p, [key]: e.target.value }))

  // ---------- Header actions ----------
  const onAddNew = () => {
    setIsEdit(true)
    setSelectedId(null)

    setQifForm(initialQifForm)
    setMetricRow(initialMetricRow)

    setShowKeyIndicatorBlock(false)
    setShowPhase3Cards(false)
    setShowAdditionalUpload(false)
    setShowAdditionalView(false)

    setFormA(initialFormA)
    setFormB(initialFormB)
    setFormC(initialFormC)
    setFormD(initialFormD)
    setFormE(initialFormE)

    setAdditionalSearch(initialAdditionalSearch)
    setUploadRows([newUploadRow(1)])
  }

  const onView = () => {
    setIsEdit(false)
    setShowKeyIndicatorBlock(true)
  }

  // ---------- Phase 1 buttons ----------
  const onSearchQIF = () => {
    // Search with any one input -> show Key Indicator block (Phase 2)
    const anyFilled = Boolean(qifForm.criteria || qifForm.criteriaDesc || qifForm.keyIndicator)
    if (!anyFilled) return
    setShowKeyIndicatorBlock(true)
  }

  const onResetQIF = () => {
    setQifForm(initialQifForm)
    setMetricRow(initialMetricRow)
    setShowKeyIndicatorBlock(false)
    setShowPhase3Cards(false)
    setShowAdditionalUpload(false)
    setShowAdditionalView(false)
  }

  const onCancelQIF = () => {
    setQifForm(initialQifForm)
    setMetricRow(initialMetricRow)
    setShowKeyIndicatorBlock(false)
    setShowPhase3Cards(false)
    setShowAdditionalUpload(false)
    setShowAdditionalView(false)
    setIsEdit(false)
    setSelectedId(null)
  }

  // ---------- Phase 2 "+" action ----------
  const onAddData = () => {
    // Phase 3: Show cards A..F sequentially (displayed in order below)
    setShowPhase3Cards(true)
    setShowAdditionalUpload(false)
    setShowAdditionalView(false)
    setAdditionalSearch(initialAdditionalSearch)
  }

  // ---------- Form action helpers ----------
  const onSaveStub = () => {
    // Hook your API here
    setIsEdit(false)
  }

  const onResetAllPhase3 = () => {
    setFormA(initialFormA)
    setFormB(initialFormB)
    setFormC(initialFormC)
    setFormD(initialFormD)
    setFormE(initialFormE)
  }

  const onCancelPhase3 = () => {
    setShowPhase3Cards(false)
    setShowAdditionalUpload(false)
    setShowAdditionalView(false)
    setAdditionalSearch(initialAdditionalSearch)
  }

  // ---------- Downloads / Uploads ----------
  const onDownloadDataTemplate = () => {
    window.open('/templates/QIF_Data_Template.xlsx', '_blank')
  }
  const onUploadDataTemplateClick = () => uploadDataTemplateRef.current?.click()

  const onDownloadDocTemplate = () => {
    window.open('/templates/QIF_Document_Template.xlsx', '_blank')
  }
  const onUploadDocTemplateClick = () => uploadTemplateRef.current?.click()

  // ---------- Phase 9 / Phase 10 ----------
  const onSearchAdditionalInfo = () => {
    // Phase 10: show upload + view blocks
    const anyFilled = Boolean(additionalSearch.yearOfData || additionalSearch.programmeWise)
    if (!anyFilled) return
    setShowAdditionalUpload(true)
    setShowAdditionalView(true)
  }

  const onResetAdditionalInfo = () => {
    setAdditionalSearch(initialAdditionalSearch)
    setUploadRows([newUploadRow(1)])
    setShowAdditionalUpload(false)
    setShowAdditionalView(false)
  }

  const onCancelAdditionalInfo = () => {
    setAdditionalSearch(initialAdditionalSearch)
    setUploadRows([newUploadRow(1)])
    setShowAdditionalUpload(false)
    setShowAdditionalView(false)
  }

  // ---------- Upload rows add/remove ----------
  const addUploadRow = (rowId) => {
    setUploadRows((prev) => {
      // Add after the clicked row
      const idx = prev.findIndex((r) => r.id === rowId)
      const nextId = Math.max(...prev.map((r) => r.id)) + 1
      const next = [...prev]
      next.splice(idx + 1, 0, newUploadRow(nextId))
      return next
    })
  }

  const removeUploadRow = (rowId) => {
    setUploadRows((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((r) => r.id !== rowId)
    })
  }

  const onUploadRowChange = (rowId, key) => (e) => {
    const value = e?.target?.value ?? ''
    setUploadRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)))
  }

  // ---------- View table action placeholders ----------
  const onViewRow = () => {
    // Hook your view action here
  }
  const onEditRow = () => {
    // Hook your edit action here
  }
  const onDeleteRow = () => {
    // Hook your delete action here
  }

  // ---------- Render helpers ----------
  const renderPhaseToolbar = (value, onChange) => (
    <div className="d-flex align-items-center gap-2 flex-nowrap justify-content-end" style={{ overflowX: 'auto' }}>
      <CFormSelect size="sm" value={value} onChange={onChange} style={{ width: 140 }}>
        {sopFormulaOptions.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </CFormSelect>

      <ArpIconButton icon="view" color="info" tooltip="View" onClick={() => {}} />
      <ArpIconButton icon="download" color="danger" tooltip="Download Data Template" onClick={onDownloadDataTemplate} />
      <ArpIconButton icon="upload" color="success" tooltip="Upload Data Template" onClick={onUploadDataTemplateClick} />
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        {/* CARD A — Header Action Card */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>QUALITY INDICATOR FRAMEWORKS (QIF)</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="View" icon="view" color="info" onClick={onView} />
            </div>
          </CCardHeader>
        </CCard>

        {/* CARD B — Phase 1: QIF Form */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Quality Indicator Frameworks (QIF)</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3 align-items-center">
                <CCol md={2}>
                  <CFormLabel>Choose Criteria</CFormLabel>
                </CCol>
                <CCol md={2}>
                  <CFormSelect value={qifForm.criteria} onChange={onQifChange('criteria')} disabled={!isEdit}>
                    <option value="">Select</option>
                    {criteriaOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormInput
                    placeholder="<Criteria Description>"
                    value={qifForm.criteriaDesc}
                    onChange={onQifChange('criteriaDesc')}
                    disabled
                  />
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Key Indicator</CFormLabel>
                </CCol>
                <CCol md={2}>
                  <CFormSelect value={qifForm.keyIndicator} onChange={onQifChange('keyIndicator')} disabled={!isEdit}>
                    <option value="">Select Key Indicator</option>
                    {keyIndicatorOptions.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Search" icon="search" color="info" onClick={onSearchQIF} />
                  <ArpButton label="Reset" icon="reset" color="warning" onClick={onResetQIF} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelQIF} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* CARD C — Phase 2: Key Indicator | Total Weightage */}
        {showKeyIndicatorBlock && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>Key Indicator | Total Weightage</strong>
            </CCardHeader>

            <CCardBody>
              <CForm>
                <CRow className="g-3">
                  <CCol xs={12}>
                    <CTable bordered hover responsive className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell scope="col">M. No.</CTableHeaderCell>
                          <CTableHeaderCell scope="col">S. M. No.</CTableHeaderCell>
                          <CTableHeaderCell scope="col">M. Type</CTableHeaderCell>
                          <CTableHeaderCell scope="col">Description</CTableHeaderCell>
                          <CTableHeaderCell scope="col">Weightage</CTableHeaderCell>
                          <CTableHeaderCell scope="col" className="text-center">
                            Action
                          </CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>

                      <CTableBody>
                        <CTableRow>
                          <CTableDataCell style={{ minWidth: 180 }}>
                            <CFormSelect value={metricRow.metricNo} onChange={onMetricChange('metricNo')} disabled={!isEdit}>
                              <option value="">Select Metric Number</option>
                              {Object.keys(metricCatalog).map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </CFormSelect>
                          </CTableDataCell>

                          <CTableDataCell style={{ minWidth: 180 }}>
                            <CFormSelect
                              value={metricRow.subMetricNo}
                              onChange={onMetricChange('subMetricNo')}
                              disabled={!isEdit || !metricRow.metricNo}
                            >
                              <option value="">Select Sub Metric Number</option>
                              {(metricCatalog?.[metricRow.metricNo]?.subMetrics || []).map((sm) => (
                                <option key={sm} value={sm}>
                                  {sm}
                                </option>
                              ))}
                            </CFormSelect>
                          </CTableDataCell>

                          <CTableDataCell style={{ minWidth: 160 }}>
                            <CFormInput placeholder="<Metric Type>" value={metricRow.metricType} disabled />
                          </CTableDataCell>

                          <CTableDataCell style={{ minWidth: 260 }}>
                            <CFormInput placeholder="<Metric Description>" value={metricRow.description} disabled />
                          </CTableDataCell>

                          <CTableDataCell style={{ minWidth: 140 }}>
                            <CFormInput placeholder="<Metric Weightage>" value={metricRow.weightage} disabled />
                          </CTableDataCell>

                          <CTableDataCell className="text-center" style={{ minWidth: 90 }}>
                            <ArpIconButton
                              icon="add"
                              color="success"
                              tooltip="Add Data"
                              onClick={onAddData}
                              disabled={!isEdit}
                            />
                          </CTableDataCell>
                        </CTableRow>
                      </CTableBody>
                    </CTable>
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        )}

        {/* Phase 3 cards (A..F) */}
        {showPhase3Cards && (
          <>
            {/* Phase 4 — A. Key Indicator | Total Weightage (Rich Text) */}
            <CCard className="mb-3">
              <CCardHeader>
                <strong>A. Key Indicator | Total Weightage</strong>
              </CCardHeader>
              <CCardBody>
                <CForm>
                  <CRow className="g-3">
                    <CCol xs={12}>
                      {/* Rich Text Editor placeholder (use CKEditor/other editor if installed) */}
                      <CFormTextarea
                        rows={8}
                        placeholder="Enter narrative..."
                        value={formA.narrative}
                        onChange={onFormAChange('narrative')}
                        disabled={!isEdit}
                      />
                    </CCol>

                    <CCol xs={12} className="d-flex justify-content-end gap-2">
                      <ArpButton label="Save" icon="save" color="success" onClick={onSaveStub} disabled={!isEdit} />
                      <ArpButton label="Reset" icon="reset" color="warning" onClick={() => setFormA(initialFormA)} disabled={!isEdit} />
                      <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelPhase3} />
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>

            {/* Phase 5 — B. Key Indicator | Total Weightage */}
            <CCard className="mb-3">
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <strong>B. Key Indicator | Total Weightage</strong>
                {renderPhaseToolbar(formB.sopOrFormula, (e) => setFormB((p) => ({ ...p, sopOrFormula: e.target.value })))}
              </CCardHeader>
              <CCardBody>
                <CForm>
                  <CRow className="g-3 align-items-center">
                    <CCol md={2}>
                      <CFormLabel>Data Input</CFormLabel>
                    </CCol>
                    <CCol md={4}>
                      <CFormInput value={formB.dataInput} onChange={onFormBChange('dataInput')} disabled={!isEdit} />
                    </CCol>

                    <CCol md={2}>
                      <CFormLabel>Response Value</CFormLabel>
                    </CCol>
                    <CCol md={4}>
                      <CFormInput placeholder="<Response Value>" value={formB.responseValue} onChange={onFormBChange('responseValue')} disabled />
                    </CCol>

                    <CCol xs={12} className="d-flex justify-content-end gap-2">
                      <ArpButton label="Save" icon="save" color="success" onClick={onSaveStub} disabled={!isEdit} />
                      <ArpButton label="Reset" icon="reset" color="warning" onClick={() => setFormB(initialFormB)} disabled={!isEdit} />
                      <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelPhase3} />
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>

            {/* Phase 6 — C. Key Indicator | Total Weightage (1SM-5DI-1T) */}
            <CCard className="mb-3">
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <strong>C. Key Indicator | Total Weightage (1SM-5DI-1T)</strong>
                {renderPhaseToolbar(formC.sopOrFormula, (e) => setFormC((p) => ({ ...p, sopOrFormula: e.target.value })))}
              </CCardHeader>
              <CCardBody>
                <CForm>
                  <CRow className="g-3">
                    <CCol xs={12}>
                      <CTable bordered hover responsive className="mb-0">
                        <CTableHead>
                          <CTableRow>
                            <CTableHeaderCell scope="col">{formC.labelId1}</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY – 1</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY – 2</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY – 3</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY – 4</CTableHeaderCell>
                            <CTableHeaderCell scope="col">Response Value</CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          <CTableRow>
                            <CTableDataCell>{formC.labelId2}</CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formC.cay} onChange={onFormCChange('cay')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formC.cay1} onChange={onFormCChange('cay1')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formC.cay2} onChange={onFormCChange('cay2')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formC.cay3} onChange={onFormCChange('cay3')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formC.cay4} onChange={onFormCChange('cay4')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formC.responseValue} onChange={onFormCChange('responseValue')} disabled={!isEdit} />
                            </CTableDataCell>
                          </CTableRow>
                        </CTableBody>
                      </CTable>
                    </CCol>

                    <CCol xs={12} className="d-flex justify-content-end gap-2">
                      <ArpButton label="Save" icon="save" color="success" onClick={onSaveStub} disabled={!isEdit} />
                      <ArpButton label="Reset" icon="reset" color="warning" onClick={() => setFormC(initialFormC)} disabled={!isEdit} />
                      <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelPhase3} />
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>

            {/* Phase 7 — D. Key Indicator | Total Weightage (2SM-2DI-1T) */}
            <CCard className="mb-3">
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <strong>D. Key Indicator | Total Weightage (2SM-2DI-1T)</strong>
                {renderPhaseToolbar(formD.sopOrFormula, (e) => setFormD((p) => ({ ...p, sopOrFormula: e.target.value })))}
              </CCardHeader>
              <CCardBody>
                <CForm>
                  <CRow className="g-3 align-items-center">
                    <CCol md={4}>
                      <CFormLabel>{formD.subMetricDesc1}</CFormLabel>
                    </CCol>
                    <CCol md={4}>
                      <CFormInput value={formD.input1} onChange={onFormDChange('input1')} disabled={!isEdit} />
                    </CCol>
                    <CCol md={4}>
                      <CFormInput placeholder="Response Value" value={formD.responseValue1} onChange={onFormDChange('responseValue1')} disabled={!isEdit} />
                    </CCol>

                    <CCol md={4}>
                      <CFormLabel>{formD.subMetricDesc2}</CFormLabel>
                    </CCol>
                    <CCol md={4}>
                      <CFormInput value={formD.input2} onChange={onFormDChange('input2')} disabled={!isEdit} />
                    </CCol>
                    <CCol md={4}>
                      <CFormInput value={formD.responseValue2} onChange={onFormDChange('responseValue2')} disabled={!isEdit} />
                    </CCol>

                    <CCol xs={12} className="d-flex justify-content-end gap-2">
                      <ArpButton label="Save" icon="save" color="success" onClick={onSaveStub} disabled={!isEdit} />
                      <ArpButton label="Reset" icon="reset" color="warning" onClick={() => setFormD(initialFormD)} disabled={!isEdit} />
                      <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelPhase3} />
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>

            {/* Phase 8 — E. Key Indicator | Total Weightage (2SM-5DI-2T) */}
            <CCard className="mb-3">
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <strong>E. Key Indicator | Total Weightage (2SM-5DI-2T)</strong>
                {renderPhaseToolbar(formE.sopOrFormula, (e) => setFormE((p) => ({ ...p, sopOrFormula: e.target.value })))}
              </CCardHeader>
              <CCardBody>
                <CForm>
                  <CRow className="g-3">
                    <CCol xs={12}>
                      <CTable bordered hover responsive className="mb-0">
                        <CTableBody>
                          <CTableRow>
                            <CTableDataCell colSpan={7}>
                              <strong>{formE.subMetricDesc1}</strong>
                            </CTableDataCell>
                          </CTableRow>

                          <CTableRow>
                            <CTableHeaderCell scope="col">Label ID 1</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY – 1</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY – 2</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY – 3</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY – 4</CTableHeaderCell>
                            <CTableHeaderCell scope="col"> </CTableHeaderCell>
                          </CTableRow>

                          <CTableRow>
                            <CTableDataCell>Label ID 2</CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formE.sm1_cay} onChange={onFormEChange('sm1_cay')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formE.sm1_cay1} onChange={onFormEChange('sm1_cay1')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formE.sm1_cay2} onChange={onFormEChange('sm1_cay2')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formE.sm1_cay3} onChange={onFormEChange('sm1_cay3')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formE.sm1_cay4} onChange={onFormEChange('sm1_cay4')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell />
                          </CTableRow>

                          <CTableRow>
                            <CTableDataCell colSpan={7}>
                              <strong>{formE.subMetricDesc2}</strong>
                            </CTableDataCell>
                          </CTableRow>

                          <CTableRow>
                            <CTableHeaderCell scope="col">Label ID 1</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY – 1</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY – 2</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY – 3</CTableHeaderCell>
                            <CTableHeaderCell scope="col">CAY – 4</CTableHeaderCell>
                            <CTableHeaderCell scope="col"> </CTableHeaderCell>
                          </CTableRow>

                          <CTableRow>
                            <CTableDataCell>Label ID 2</CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formE.sm2_cay} onChange={onFormEChange('sm2_cay')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formE.sm2_cay1} onChange={onFormEChange('sm2_cay1')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formE.sm2_cay2} onChange={onFormEChange('sm2_cay2')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formE.sm2_cay3} onChange={onFormEChange('sm2_cay3')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell>
                              <CFormInput value={formE.sm2_cay4} onChange={onFormEChange('sm2_cay4')} disabled={!isEdit} />
                            </CTableDataCell>
                            <CTableDataCell />
                          </CTableRow>
                        </CTableBody>
                      </CTable>
                    </CCol>

                    <CCol xs={12} className="d-flex justify-content-end gap-2">
                      <ArpButton label="Save" icon="save" color="success" onClick={onSaveStub} disabled={!isEdit} />
                      <ArpButton label="Reset" icon="reset" color="warning" onClick={() => setFormE(initialFormE)} disabled={!isEdit} />
                      <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelPhase3} />
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>

            {/* Phase 9 — F. Add Additional Information */}
            <CCard className="mb-3">
              <CCardHeader>
                <strong>F. Add Additional Information</strong>
              </CCardHeader>
              <CCardBody>
                <CForm>
                  <CRow className="g-3 align-items-center">
                    <CCol md={2}>
                      <CFormLabel>Choose Year of Data</CFormLabel>
                    </CCol>
                    <CCol md={2}>
                      <CFormSelect value={additionalSearch.yearOfData} onChange={onAdditionalSearchChange('yearOfData')} disabled={!isEdit}>
                        <option value="">Select Year of Data</option>
                        {yearOfDataOptions.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>

                    <CCol md={2}>
                      <CFormLabel>Programme Wise Data?</CFormLabel>
                    </CCol>
                    <CCol md={2}>
                      <CFormSelect value={additionalSearch.programmeWise} onChange={onAdditionalSearchChange('programmeWise')} disabled={!isEdit}>
                        <option value="">Select Yes (Or) No</option>
                        {yesNoOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>

                    <CCol md={4} className="d-flex justify-content-end gap-2">
                      <ArpButton label="Search" icon="search" color="info" onClick={onSearchAdditionalInfo} disabled={!isEdit} />
                      <ArpButton label="Reset" icon="reset" color="warning" onClick={onResetAdditionalInfo} disabled={!isEdit} />
                      <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelAdditionalInfo} />
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>

            {/* Phase 10A — Upload Additional Information */}
            {showAdditionalUpload && (
              <CCard className="mb-3">
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <strong>Upload Additional Information</strong>

                  <div className="d-flex align-items-center gap-2 flex-nowrap justify-content-end" style={{ overflowX: 'auto' }}>
                    <CFormSelect size="sm" style={{ width: 180 }}>
                      <option value="">Document Category</option>
                      {docCategoryOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </CFormSelect>

                    <ArpIconButton icon="download" color="danger" tooltip="Download Document Template" onClick={onDownloadDocTemplate} />
                    <ArpIconButton icon="view" color="info" tooltip="View" onClick={() => {}} />
                  </div>
                </CCardHeader>

                <CCardBody>
                  <CForm>
                    <CRow className="g-3">
                      <CCol xs={12}>
                        <CTable bordered hover responsive className="mb-0">
                          <CTableHead>
                            <CTableRow>
                              <CTableHeaderCell scope="col">Select</CTableHeaderCell>
                              <CTableHeaderCell scope="col">Document Category</CTableHeaderCell>
                              <CTableHeaderCell scope="col">Choose Programme</CTableHeaderCell>
                              <CTableHeaderCell scope="col">Select File Location</CTableHeaderCell>
<CTableHeaderCell scope="col">Upload Document</CTableHeaderCell>
                              <CTableHeaderCell scope="col" className="text-center">
                                Action
                              </CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>

                          <CTableBody>
                            {uploadRows.map((r, idx) => {
                              const isLast = idx === uploadRows.length - 1
                              return (
                                <CTableRow key={r.id}>
                                  <CTableDataCell style={{ width: 80 }}>
                                    <CFormCheck type="radio" name="uploadRowSelect" />
                                  </CTableDataCell>

                                  <CTableDataCell style={{ minWidth: 220 }}>
                                    <CFormSelect value={r.docCategory} onChange={onUploadRowChange(r.id, 'docCategory')} disabled={!isEdit}>
                                      <option value="">Select Document Category</option>
                                      {docCategoryOptions.map((d) => (
                                        <option key={d} value={d}>
                                          {d}
                                        </option>
                                      ))}
                                    </CFormSelect>
                                  </CTableDataCell>

                                  <CTableDataCell style={{ minWidth: 180 }}>
                                    <CFormSelect value={r.programme} onChange={onUploadRowChange(r.id, 'programme')} disabled={!isEdit}>
                                      <option value="">Select Programme</option>
                                      {programmeOptions.map((p) => (
                                        <option key={p} value={p}>
                                          {p}
                                        </option>
                                      ))}
                                    </CFormSelect>
                                  </CTableDataCell>

                                  <CTableDataCell style={{ minWidth: 170 }}>
                                    <CFormSelect value={r.fileLocation} onChange={onUploadRowChange(r.id, 'fileLocation')} disabled={!isEdit}>
                                      <option value="">Select</option>
                                      {fileLocationOptions.map((f) => (
                                        <option key={f} value={f}>
                                          {f}
                                        </option>
                                      ))}
                                    </CFormSelect>
                                  </CTableDataCell>
<CTableDataCell style={{ width: 170 }}>
                                    <ArpButton label="Upload" icon="upload" color="info" onClick={onUploadDocTemplateClick} />
                                  </CTableDataCell>

                                  <CTableDataCell className="text-center" style={{ width: 90 }}>
                                    {isLast ? (
                                      <ArpIconButton
                                        icon="add"
                                        color="success"
                                        tooltip="Add Row"
                                        onClick={() => addUploadRow(r.id)}
                                        disabled={!isEdit}
                                      />
                                    ) : (
                                      <ArpIconButton
                                        icon="delete"
                                        color="danger"
                                        tooltip="Remove Row"
                                        onClick={() => removeUploadRow(r.id)}
                                        disabled={!isEdit}
                                      />
                                    )}
                                  </CTableDataCell>
                                </CTableRow>
                              )
                            })}
                          </CTableBody>
                        </CTable>
                      </CCol>

                      <CCol xs={12} className="d-flex justify-content-end gap-2">
                        <ArpButton label="Save" icon="save" color="success" onClick={onSaveStub} disabled={!isEdit} />
                        <ArpButton
                          label="Reset"
                          icon="reset"
                          color="warning"
                          onClick={() => setUploadRows([newUploadRow(1)])}
                          disabled={!isEdit}
                        />
                        <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelPhase3} />
                      </CCol>
                    </CRow>
                  </CForm>

                  {/* Hidden upload inputs */}
                  <input ref={uploadTemplateRef} type="file" style={{ display: 'none' }} onChange={() => {}} />
                  <input ref={uploadDataTemplateRef} type="file" style={{ display: 'none' }} onChange={() => {}} />
                </CCardBody>
              </CCard>
            )}

            {/* Phase 10B — View Additional Information table (Department.jsx style header row) */}
            {showAdditionalView && (
              <CCard className="mb-3">
                <CCardHeader className="d-flex justify-content-between align-items-center">
                  <strong>View Additional Information</strong>

                  <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
                    <CInputGroup size="sm" style={{ width: 260 }}>
                      <CInputGroupText>
                        <CIcon icon={cilSearch} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </CInputGroup>

                    <CFormSelect
                      size="sm"
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      style={{ width: 90 }}
                    >
                      {[5, 10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </CFormSelect>

                    <CFormSelect size="sm" style={{ width: 180 }}>
                      <option value="">Document Category</option>
                      {docCategoryOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </CFormSelect>

                    <ArpIconButton icon="download" color="danger" tooltip="Download Document Template" onClick={onDownloadDocTemplate} />
                    <ArpIconButton icon="view" color="info" tooltip="View" onClick={onViewRow} disabled={!selectedId} />
                    <ArpIconButton icon="delete" color="danger" tooltip="Delete" onClick={onDeleteRow} disabled={!selectedId} />
                  </div>
                </CCardHeader>

                <CCardBody>
                  <CTable hover responsive bordered className="mb-2">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell style={{ width: 80 }}>Select</CTableHeaderCell>
                        <CTableHeaderCell role="button" onClick={() => sortToggle('docCategory')}>
                          Document Category{sortIndicator('docCategory')}
                        </CTableHeaderCell>
                        <CTableHeaderCell role="button" onClick={() => sortToggle('programme')}>
                          Programme{sortIndicator('programme')}
                        </CTableHeaderCell>
                        <CTableHeaderCell role="button" onClick={() => sortToggle('fileLocation')}>
                          File Location{sortIndicator('fileLocation')}
                        </CTableHeaderCell>
                        <CTableHeaderCell role="button" onClick={() => sortToggle('fileLog')}>
                          File Log{sortIndicator('fileLog')}
                        </CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {pageRows.length === 0 ? (
                        <CTableRow>
                          <CTableDataCell colSpan={5} className="text-center text-medium-emphasis">
                            No records found
                          </CTableDataCell>
                        </CTableRow>
                      ) : (
                        pageRows.map((r) => (
                          <CTableRow key={r.id} active={selectedId === r.id}>
                            <CTableDataCell>
                              <CFormCheck type="radio" name="viewAdditionalSelect" checked={selectedId === r.id} onChange={() => setSelectedId(r.id)} />
                            </CTableDataCell>
                            <CTableDataCell>{r.docCategory}</CTableDataCell>
                            <CTableDataCell>{r.programme}</CTableDataCell>
                            <CTableDataCell>{r.fileLocation}</CTableDataCell>
                            <CTableDataCell>{r.fileLog}</CTableDataCell>
                          </CTableRow>
                        ))
                      )}
                    </CTableBody>
                  </CTable>

                  <ArpPagination
                    size="sm"
                    align="end"
                    page={safePage}
                    totalPages={totalPages}
                    onChange={setPage}
                    prevText="Previous"
                    nextText="Next"
                  />
                </CCardBody>
              </CCard>
            )}

            {/* Convenience footer buttons for phase 3 group */}
            <CCard className="mb-3">
              <CCardBody className="d-flex justify-content-end gap-2">
                <ArpButton label="Reset All" icon="reset" color="warning" onClick={onResetAllPhase3} disabled={!isEdit} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancelPhase3} />
              </CCardBody>
            </CCard>
          </>
        )}
      </CCol>
    </CRow>
  )
}

export default AMSQIFMetrics
