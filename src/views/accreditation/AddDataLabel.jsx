import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CPagination,
  CPaginationItem,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'

import { ArpButton, ArpIconButton } from '../../components/common'

// ---------- Helpers ----------
const normalize = (v) =>
  String(v ?? '')
    .toLowerCase()
    .trim()

const initialSopForm = {
  cay: '',
}

const initialInputForm = {
  inputId: '',
  noOfInputs: '',
  type: '',
  description: '',
}

const initialLabelForm = {
  labelId: '',
  description: '',
  top: '',
  bottom: '',
}

// ---------- Page ----------
const AddDataLabel = () => {
  const tableRef = useRef(null)

  // Step (maps to HTML phases)
  // 1: Status of Manuals, 2: Manual Config, 3: SOP, 4: Input Types, 5: Label Types
  const [step, setStep] = useState(1)

  // Global edit toggle (Form Card enabled only when user clicks Add/Edit actions)
  const [isEdit, setIsEdit] = useState(false)

  // Manual rows (Phase 2 table in HTML)
  const [manualRows] = useState([
    {
      id: 'M001',
      manualId: 'M001',
      institutionCategory: 'Engineering',
      monthYear: 'June 2026',
      sopCay: 'CAY-1',
      inputTypes: '5',
      label: 'Yes',
    },
    {
      id: 'M002',
      manualId: 'M002',
      institutionCategory: 'Arts & Science',
      monthYear: 'June 2026',
      sopCay: 'CAY-2',
      inputTypes: '4',
      label: 'No',
    },
    {
      id: 'M003',
      manualId: 'M003',
      institutionCategory: 'Management',
      monthYear: 'June 2026',
      sopCay: 'CAY-3',
      inputTypes: '6',
      label: 'Yes',
    },
  ])
  const [selectedManualId, setSelectedManualId] = useState(null)

  // Derived selected manual
  const selectedManual = useMemo(
    () => manualRows.find((m) => m.id === selectedManualId) || null,
    [manualRows, selectedManualId],
  )

  // SOP form (Phase 4 in HTML)
  const [sopForm, setSopForm] = useState(initialSopForm)

  // Input types table (Phase 5 in HTML)
  const [inputRows, setInputRows] = useState([
    { id: 'I001', inputId: 'I001', noOfInputs: '5', type: 'Text', description: 'Marks' },
    { id: 'I002', inputId: 'I002', noOfInputs: '3', type: 'Number', description: 'Weightages' },
    { id: 'I003', inputId: 'I003', noOfInputs: '4', type: 'Date', description: 'Schedule' },
  ])
  const [selectedInputId, setSelectedInputId] = useState(null)
  const [inputForm, setInputForm] = useState(initialInputForm)

  // Label types table (Phase 6 in HTML)
  const [labelRows, setLabelRows] = useState([
    { id: 'L001', labelId: 'L001', description: 'Total Marks', top: 'Yes', bottom: 'No' },
    { id: 'L002', labelId: 'L002', description: 'Total Weightages', top: 'Yes', bottom: 'Yes' },
    { id: 'L003', labelId: 'L003', description: 'Optional Metrics', top: 'No', bottom: 'Yes' },
  ])
  const [selectedLabelId, setSelectedLabelId] = useState(null)
  const [labelForm, setLabelForm] = useState(initialLabelForm)

  // Table UX (Card 3)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'manualId', dir: 'asc' })
  const [page, setPage] = useState(1) // 1-based
  const [pageSize, setPageSize] = useState(10)
  const [loading] = useState(false)

  // ---------- Header actions ----------
  const scrollToTable = () => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const onViewManuals = () => {
    setStep(1)
    setIsEdit(false)
    scrollToTable()
  }

  // Phase-2 (+) in HTML: reveals remaining phases
  const onAddFlow = () => {
    if (!selectedManualId) return
    setStep(2)
    setIsEdit(false)
    scrollToTable()
  }

  // ---------- Common sort/search/paging ----------
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

  // Pick which dataset is displayed in Table Card based on step
  const tableDataset = useMemo(() => {
    if (step <= 2) return { kind: 'manuals', rows: manualRows }
    if (step === 4) return { kind: 'inputs', rows: inputRows }
    if (step === 5) return { kind: 'labels', rows: labelRows }
    // Step 3 (SOP) still shows manuals list in HTML context; keep manual list here.
    return { kind: 'manuals', rows: manualRows }
  }, [step, manualRows, inputRows, labelRows])

  // Default sort key per dataset
  useEffect(() => {
    setSearch('')
    setPage(1)
    if (tableDataset.kind === 'manuals') setSort({ key: 'manualId', dir: 'asc' })
    if (tableDataset.kind === 'inputs') setSort({ key: 'inputId', dir: 'asc' })
    if (tableDataset.kind === 'labels') setSort({ key: 'labelId', dir: 'asc' })
  }, [tableDataset.kind])

  const filteredSorted = useMemo(() => {
    const q = normalize(search)
    let data = tableDataset.rows

    if (q) {
      data = tableDataset.rows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))
    }

    const { key, dir } = sort || {}
    if (!key) return data

    const sorted = [...data].sort((a, b) =>
      normalize(a?.[key]).localeCompare(normalize(b?.[key]), undefined, { sensitivity: 'base' }),
    )
    return dir === 'asc' ? sorted : sorted.reverse()
  }, [tableDataset.rows, search, sort])

  // Reset to page 1 when search/pageSize changes
  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const total = filteredSorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)

  const pageRows = useMemo(
    () => filteredSorted.slice(startIdx, endIdx),
    [filteredSorted, startIdx, endIdx],
  )

  // Keep page in range if totalPages shrinks
  useEffect(() => {
    if (page !== safePage) setPage(safePage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages])

  // ---------- Form Card content handlers ----------
  const canEditStep = step === 3 || step === 4 || step === 5

  const onFormCancel = () => {
    // Mirrors HTML: cancel hides that phase card; here we step back safely
    setIsEdit(false)
    if (step === 3) setStep(2)
    if (step === 4) setStep(3)
    if (step === 5) setStep(4)
  }

  // SOP
  const onSopChange = (k) => (e) => setSopForm((p) => ({ ...p, [k]: e.target.value }))
  const onSopSave = (e) => {
    e.preventDefault()
    setIsEdit(false)
    setStep(4)
    scrollToTable()
  }

  // Input Types CRUD (simple local demo)
  const onInputChange = (k) => (e) => setInputForm((p) => ({ ...p, [k]: e.target.value }))
  const loadInputToForm = (row) => {
    setInputForm({
      inputId: row?.inputId || '',
      noOfInputs: row?.noOfInputs || '',
      type: row?.type || '',
      description: row?.description || '',
    })
  }
  const onInputAdd = () => {
    setIsEdit(true)
    setInputForm(initialInputForm)
    setSelectedInputId(null)
  }
  const onInputView = () => {
    const r = inputRows.find((x) => x.id === selectedInputId)
    if (!r) return
    loadInputToForm(r)
    setIsEdit(false)
  }
  const onInputEdit = () => {
    const r = inputRows.find((x) => x.id === selectedInputId)
    if (!r) return
    loadInputToForm(r)
    setIsEdit(true)
  }
  const onInputDelete = () => {
    if (!selectedInputId) return
    const next = inputRows.filter((x) => x.id !== selectedInputId)
    setInputRows(next)
    setSelectedInputId(next[0]?.id ?? null)
  }
  const onInputSave = (e) => {
    e.preventDefault()
    if (!inputForm.inputId || !inputForm.noOfInputs || !inputForm.type || !inputForm.description) return

    setInputRows((prev) => {
      const exists = prev.find((x) => x.id === inputForm.inputId)
      if (exists) {
        return prev.map((x) =>
          x.id === inputForm.inputId
            ? { ...x, ...inputForm, id: inputForm.inputId }
            : x,
        )
      }
      return [{ ...inputForm, id: inputForm.inputId }, ...prev]
    })
    setSelectedInputId(inputForm.inputId)
    setIsEdit(false)
  }

  // Label Types CRUD (simple local demo)
  const onLabelChange = (k) => (e) => setLabelForm((p) => ({ ...p, [k]: e.target.value }))
  const loadLabelToForm = (row) => {
    setLabelForm({
      labelId: row?.labelId || '',
      description: row?.description || '',
      top: row?.top || '',
      bottom: row?.bottom || '',
    })
  }
  const onLabelAdd = () => {
    setIsEdit(true)
    setLabelForm(initialLabelForm)
    setSelectedLabelId(null)
  }
  const onLabelView = () => {
    const r = labelRows.find((x) => x.id === selectedLabelId)
    if (!r) return
    loadLabelToForm(r)
    setIsEdit(false)
  }
  const onLabelEdit = () => {
    const r = labelRows.find((x) => x.id === selectedLabelId)
    if (!r) return
    loadLabelToForm(r)
    setIsEdit(true)
  }
  const onLabelDelete = () => {
    if (!selectedLabelId) return
    const next = labelRows.filter((x) => x.id !== selectedLabelId)
    setLabelRows(next)
    setSelectedLabelId(next[0]?.id ?? null)
  }
  const onLabelSave = (e) => {
    e.preventDefault()
    if (!labelForm.labelId || !labelForm.description || !labelForm.top || !labelForm.bottom) return

    setLabelRows((prev) => {
      const exists = prev.find((x) => x.id === labelForm.labelId)
      if (exists) {
        return prev.map((x) =>
          x.id === labelForm.labelId
            ? { ...x, ...labelForm, id: labelForm.labelId }
            : x,
        )
      }
      return [{ ...labelForm, id: labelForm.labelId }, ...prev]
    })
    setSelectedLabelId(labelForm.labelId)
    setIsEdit(false)
  }

  // ---------- Card 2 renderer ----------
  const formTitle = useMemo(() => {
    if (step === 2) return 'Manual Configuration'
    if (step === 3) return 'Add SOP'
    if (step === 4) return 'Add Data Input Data Format Types'
    if (step === 5) return 'Add Label Format Types'
    return 'Add SOP | CAY | Input Data Formats | Label Descriptions'
  }, [step])

  const goNext = () => {
    if (step === 2) setStep(3)
    else if (step === 3) setStep(4)
    else if (step === 4) setStep(5)
    scrollToTable()
  }

  // Step 2 is read-only summary in HTML
  const renderFormBody = () => {
    if (!selectedManual) {
      return <div className="text-medium-emphasis">Please select a Manual in the table.</div>
    }

    // Step 2: Manual Configuration (read-only)
    if (step === 2) {
      return (
        <>
          <CTable hover responsive align="middle" className="mb-0">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell>Manual ID</CTableHeaderCell>
                <CTableHeaderCell>Month &amp; Year</CTableHeaderCell>
                <CTableHeaderCell>Institution Category</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow>
                <CTableDataCell>{selectedManual.manualId}</CTableDataCell>
                <CTableDataCell className="text-center">{selectedManual.monthYear}</CTableDataCell>
                <CTableDataCell>{selectedManual.institutionCategory}</CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <div className="d-flex justify-content-end mt-2">
            <ArpButton label="Next" icon="add" color="primary" onClick={goNext} title="Next" />
          </div>
        </>
      )
    }

    // Step 3: SOP
    if (step === 3) {
      return (
        <CForm onSubmit={onSopSave}>
          <CRow className="g-3">
            <CCol md={3}>
              <CFormLabel>Upload SOP Document</CFormLabel>
            </CCol>
            <CCol md={3}>
              <ArpButton
                label="View"
                icon="view"
                color="info"
                type="button"
                disabled={!selectedManualId}
                title="View SOP"
              />
            </CCol>

            <CCol md={3}>
              <CFormLabel>Choose CAY</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormSelect value={sopForm.cay} onChange={onSopChange('cay')} disabled={!isEdit} required>
                <option value="">CAY</option>
                {['CAY - 1', 'CAY - 2', 'CAY - 3', 'CAY - 4'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
              <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} title="Save" />
              <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onFormCancel} title="Cancel" />
            </CCol>
          </CRow>
        </CForm>
      )
    }

    // Step 4: Input Types form
    if (step === 4) {
      return (
        <CForm onSubmit={onInputSave}>
          <CRow className="g-3">
            <CCol md={3}>
              <CFormLabel>Input ID</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormInput value={inputForm.inputId} onChange={onInputChange('inputId')} disabled={!isEdit} required />
            </CCol>

            <CCol md={3}>
              <CFormLabel>No. of Inputs</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormInput
                type="number"
                min={0}
                value={inputForm.noOfInputs}
                onChange={onInputChange('noOfInputs')}
                disabled={!isEdit}
                required
              />
            </CCol>

            <CCol md={3}>
              <CFormLabel>Type</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormSelect value={inputForm.type} onChange={onInputChange('type')} disabled={!isEdit} required>
                <option value="">Select</option>
                {['Text', 'Number', 'Date', 'File', 'Dropdown'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={3}>
              <CFormLabel>Description</CFormLabel>
            </CCol>
            <CCol md={3}>
              <CFormInput value={inputForm.description} onChange={onInputChange('description')} disabled={!isEdit} required />
            </CCol>

            <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
              <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} title="Save" />
              <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onFormCancel} title="Cancel" />
            </CCol>
          </CRow>
        </CForm>
      )
    }

    // Step 5: Label Types form
    return (
      <CForm onSubmit={onLabelSave}>
        <CRow className="g-3">
          <CCol md={3}>
            <CFormLabel>Label ID</CFormLabel>
          </CCol>
          <CCol md={3}>
            <CFormInput value={labelForm.labelId} onChange={onLabelChange('labelId')} disabled={!isEdit} required />
          </CCol>

          <CCol md={3}>
            <CFormLabel>Description</CFormLabel>
          </CCol>
          <CCol md={3}>
            <CFormInput value={labelForm.description} onChange={onLabelChange('description')} disabled={!isEdit} required />
          </CCol>

          <CCol md={3}>
            <CFormLabel>Top</CFormLabel>
          </CCol>
          <CCol md={3}>
            <CFormSelect value={labelForm.top} onChange={onLabelChange('top')} disabled={!isEdit} required>
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </CFormSelect>
          </CCol>

          <CCol md={3}>
            <CFormLabel>Bottom</CFormLabel>
          </CCol>
          <CCol md={3}>
            <CFormSelect value={labelForm.bottom} onChange={onLabelChange('bottom')} disabled={!isEdit} required>
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </CFormSelect>
          </CCol>

          <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
            <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} title="Save" />
            <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onFormCancel} title="Cancel" />
          </CCol>
        </CRow>
      </CForm>
    )
  }

  // ---------- Table actions based on dataset ----------
  const tableSelection = useMemo(() => {
    if (tableDataset.kind === 'manuals') return { selectedId: selectedManualId, setSelectedId: setSelectedManualId }
    if (tableDataset.kind === 'inputs') return { selectedId: selectedInputId, setSelectedId: setSelectedInputId }
    return { selectedId: selectedLabelId, setSelectedId: setSelectedLabelId }
  }, [tableDataset.kind, selectedManualId, selectedInputId, selectedLabelId])

  const onTableView = () => {
    if (tableDataset.kind === 'manuals') {
      // Keep selection; move to config card
      if (!selectedManualId) return
      setStep(2)
      setIsEdit(false)
      return
    }
    if (tableDataset.kind === 'inputs') return onInputView()
    return onLabelView()
  }

  const onTableEdit = () => {
    if (tableDataset.kind === 'manuals') {
      // In HTML "Edit" is present; here it enables SOP step for editing
      if (!selectedManualId) return
      setStep(3)
      setIsEdit(true)
      return
    }
    if (tableDataset.kind === 'inputs') return onInputEdit()
    return onLabelEdit()
  }

  const onTableAdd = () => {
    if (tableDataset.kind === 'manuals') {
      // Same as + button behavior: open configuration flow
      return onAddFlow()
    }
    if (tableDataset.kind === 'inputs') return onInputAdd()
    return onLabelAdd()
  }

  const onTableDelete = () => {
    if (tableDataset.kind === 'manuals') return
    if (tableDataset.kind === 'inputs') return onInputDelete()
    return onLabelDelete()
  }

  // Enable edit mode based on actions: for SOP/Input/Label steps, user must click Edit/Add
  useEffect(() => {
    if (step === 3 || step === 4 || step === 5) {
      // keep isEdit as-is (controlled via table/header actions)
      return
    }
    setIsEdit(false)
  }, [step])

  // Header right buttons: expose "View Manuals" and a contextual "Add"
  const headerAddDisabled = !selectedManualId
  const headerAddTitle = selectedManualId ? 'Start Configuration Flow' : 'Select a Manual first'

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>ADD DATA LABEL</strong>

            <div className="d-flex gap-2">
              <ArpButton
                label="View Manuals"
                icon="view"
                color="primary"
                onClick={onViewManuals}
                title="View All Manuals"
              />
              <ArpButton
                label="Add"
                icon="add"
                color="purple"
                onClick={onAddFlow}
                disabled={headerAddDisabled}
                title={headerAddTitle}
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>{formTitle}</strong>

            {/* Contextual quick actions (kept minimal; main actions are in table) */}
            <div className="d-flex gap-2">
              {canEditStep ? (
                <ArpButton
                  label={isEdit ? 'Editing' : 'Edit'}
                  icon="edit"
                  color="info"
                  type="button"
                  disabled={!selectedManualId || (step === 4 && !selectedInputId && !isEdit) || (step === 5 && !selectedLabelId && !isEdit)}
                  onClick={() => setIsEdit(true)}
                  title="Enable Form"
                />
              ) : null}
              {step === 2 ? (
                <ArpButton label="Next" icon="add" color="primary" type="button" onClick={goNext} title="Next" />
              ) : null}
            </div>
          </CCardHeader>

          <CCardBody>{renderFormBody()}</CCardBody>
        </CCard>

        {/* ================= TABLE CARD ================= */}
        <CCard className="mb-3" ref={tableRef}>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>
              {tableDataset.kind === 'manuals'
                ? 'Status of Manuals'
                : tableDataset.kind === 'inputs'
                  ? 'Add Data Input Data Format Types'
                  : 'Add Label Format Types'}
            </strong>

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

              <div className="d-flex gap-2 align-items-center flex-nowrap" style={{ flex: '0 0 auto' }}>
                <ArpIconButton
                  icon="add"
                  color="success"
                  title={tableDataset.kind === 'manuals' ? 'Add' : 'Add New'}
                  onClick={onTableAdd}
                  disabled={tableDataset.kind === 'manuals' ? !selectedManualId : false}
                />
                <ArpIconButton icon="view" color="purple" title="View" onClick={onTableView} disabled={!tableSelection.selectedId} />
                <ArpIconButton icon="edit" color="info" title="Edit" onClick={onTableEdit} disabled={!tableSelection.selectedId} />
                <ArpIconButton
                  icon="delete"
                  color="danger"
                  title="Delete"
                  onClick={onTableDelete}
                  disabled={!tableSelection.selectedId || tableDataset.kind === 'manuals'}
                />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell style={{ width: 60 }}>Select</CTableHeaderCell>

                  {/* Manuals */}
                  {tableDataset.kind === 'manuals' ? (
                    <>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('manualId')}>
                        Manual ID{sortIndicator('manualId')}
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('institutionCategory')}>
                        Institution Category{sortIndicator('institutionCategory')}
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('monthYear')}>
                        Month &amp; Year{sortIndicator('monthYear')}
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('sopCay')}>
                        SOP CAY{sortIndicator('sopCay')}
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('inputTypes')}>
                        Input Types{sortIndicator('inputTypes')}
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('label')}>
                        Label{sortIndicator('label')}
                      </CTableHeaderCell>
                    </>
                  ) : null}

                  {/* Inputs */}
                  {tableDataset.kind === 'inputs' ? (
                    <>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('inputId')}>
                        Input ID{sortIndicator('inputId')}
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('noOfInputs')}>
                        No. of Inputs{sortIndicator('noOfInputs')}
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('type')}>
                        Type{sortIndicator('type')}
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('description')}>
                        Description{sortIndicator('description')}
                      </CTableHeaderCell>
                    </>
                  ) : null}

                  {/* Labels */}
                  {tableDataset.kind === 'labels' ? (
                    <>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('labelId')}>
                        Label ID{sortIndicator('labelId')}
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('description')}>
                        Description{sortIndicator('description')}
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('top')}>
                        Top{sortIndicator('top')}
                      </CTableHeaderCell>
                      <CTableHeaderCell style={{ cursor: 'pointer' }} onClick={() => sortToggle('bottom')}>
                        Bottom{sortIndicator('bottom')}
                      </CTableHeaderCell>
                    </>
                  ) : null}
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {loading ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center py-4">
                      <CSpinner size="sm" className="me-2" />
                      Loading...
                    </CTableDataCell>
                  </CTableRow>
                ) : pageRows.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center py-4">
                      No records found.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell className="text-center">
                        <input
                          type="radio"
                          name="gridRow"
                          checked={tableSelection.selectedId === r.id}
                          onChange={() => tableSelection.setSelectedId(r.id)}
                        />
                      </CTableDataCell>

                      {tableDataset.kind === 'manuals' ? (
                        <>
                          <CTableDataCell>{r.manualId}</CTableDataCell>
                          <CTableDataCell>{r.institutionCategory}</CTableDataCell>
                          <CTableDataCell className="text-center">{r.monthYear}</CTableDataCell>
                          <CTableDataCell className="text-center">{r.sopCay}</CTableDataCell>
                          <CTableDataCell className="text-center">{r.inputTypes}</CTableDataCell>
                          <CTableDataCell className="text-center">{r.label}</CTableDataCell>
                        </>
                      ) : null}

                      {tableDataset.kind === 'inputs' ? (
                        <>
                          <CTableDataCell>{r.inputId}</CTableDataCell>
                          <CTableDataCell className="text-center">{r.noOfInputs}</CTableDataCell>
                          <CTableDataCell className="text-center">{r.type}</CTableDataCell>
                          <CTableDataCell>{r.description}</CTableDataCell>
                        </>
                      ) : null}

                      {tableDataset.kind === 'labels' ? (
                        <>
                          <CTableDataCell>{r.labelId}</CTableDataCell>
                          <CTableDataCell>{r.description}</CTableDataCell>
                          <CTableDataCell className="text-center">{r.top}</CTableDataCell>
                          <CTableDataCell className="text-center">{r.bottom}</CTableDataCell>
                        </>
                      ) : null}
                    </CTableRow>
                  ))
                )}
              </CTableBody>
            </CTable>

            {/* Pagination */}
            <div className="d-flex justify-content-end mt-2">
              <CPagination size="sm" className="mb-0">
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage(1)}>
                  «
                </CPaginationItem>
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ‹
                </CPaginationItem>

                {Array.from({ length: totalPages })
                  .slice(Math.max(0, safePage - 3), Math.min(totalPages, safePage + 2))
                  .map((_, i) => {
                    const pageNumber = Math.max(1, safePage - 2) + i
                    if (pageNumber > totalPages) return null
                    return (
                      <CPaginationItem
                        key={pageNumber}
                        active={pageNumber === safePage}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </CPaginationItem>
                    )
                  })}

                <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  ›
                </CPaginationItem>
                <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>
                  »
                </CPaginationItem>
              </CPagination>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default AddDataLabel
