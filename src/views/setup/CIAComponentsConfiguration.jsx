import React, { useMemo, useState } from 'react'
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
  CInputGroup,
  CInputGroupText,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CPagination,
  CPaginationItem,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import { ArpButton, ArpIconButton } from '../../components/common'

/**
 * Converted from cia_components.html
 * ARP Standard:
 * - 3-card layout (Header Actions → Forms → Table)
 * - Add New enables form fields
 * - Dynamic add/remove CIA components
 * - Computation options via switches
 * - Search + Page Size + Circle Action Icons in ONE row
 */

const emptyComponent = () => ({
  componentId: '',
  examType: '',
  examName: '',
})

const initialComputation = {
  total: false,
  bestOfTwo: false,
  bestOfThree: false,
  average: false,
  convertInto: false,
  roundOff: false,
}

const CIAComponentsConfiguration = () => {
  const [isEdit, setIsEdit] = useState(false)

  // Dynamic CIA components
  const [components, setComponents] = useState([emptyComponent()])

  // Computation switches
  const [comp, setComp] = useState(initialComputation)

  // Table toolbar + selection
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Sample table data (as per HTML)
  const [rows] = useState([
    {
      id: 1,
      programmeCode: 'MCA',
      programme: 'Master of Computer Applications',
      semester: '2016',
      batch: 'Yes',
      regNo: 'XXX - XXX',
      name: 'XXX - XXX',
      className: 'XXX - XXX',
      label: 'XXX - XXX',
    },
    {
      id: 2,
      programmeCode: 'M.Com',
      programme: 'Master of Commerce',
      semester: '2016',
      batch: 'No',
      regNo: 'XXX - XXX',
      name: 'XXX - XXX',
      className: 'XXX - XXX',
      label: 'XXX - XXX',
    },
  ])

  const addComponent = () => setComponents((p) => [...p, emptyComponent()])
  const removeComponent = (idx) => setComponents((p) => p.filter((_, i) => i !== idx))

  const updateComponent = (idx, key, value) => {
    setComponents((p) => p.map((c, i) => (i === idx ? { ...c, [key]: value } : c)))
  }

  const toggleComp = (key) => setComp((p) => ({ ...p, [key]: !p[key] }))

  const onAddNew = () => {
    setIsEdit(true)
    setComponents([emptyComponent()])
    setComp(initialComputation)
    setSelectedId(null)
  }

  const onCancel = () => {
    setIsEdit(false)
    setComponents([emptyComponent()])
    setComp(initialComputation)
  }

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const filtered = useMemo(() => {
    const q = normalize(search)
    if (!q) return rows
    return rows.filter((r) => Object.values(r).map(normalize).join(' ').includes(q))
  }, [rows, search])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = (safePage - 1) * pageSize
  const pageRows = filtered.slice(startIdx, startIdx + pageSize)

  return (
    <CRow>
      <CCol xs={12}>
        {/* ================= HEADER ACTION CARD ================= */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Continuous Internal Assessment (CIA) Configurations</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton
                label="Download Template"
                icon="download"
                color="danger"
                href="/assets/templates/ARP_T10_CIA_Component_Template.xlsx"
              />
            </div>
          </CCardHeader>
        </CCard>

        {/* ================= FORM CARD: CIA COMPONENTS ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Add Internal Examination Components</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              {components.map((c, idx) => (
                <CRow key={idx} className="g-3 mb-3 align-items-end">
                  <CCol md={4}>
                    <CFormLabel>Component Id</CFormLabel>
                    <CFormInput
                      value={c.componentId}
                      onChange={(e) => updateComponent(idx, 'componentId', e.target.value)}
                      disabled={!isEdit}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel>Examination Type</CFormLabel>
                    <CFormInput
                      value={c.examType}
                      onChange={(e) => updateComponent(idx, 'examType', e.target.value)}
                      disabled={!isEdit}
                    />
                  </CCol>
                  <CCol md={3}>
                    <CFormLabel>Name of the Examination</CFormLabel>
                    <CFormInput
                      value={c.examName}
                      onChange={(e) => updateComponent(idx, 'examName', e.target.value)}
                      disabled={!isEdit}
                    />
                  </CCol>
                  <CCol md={1} className="d-flex justify-content-center">
                    {idx === components.length - 1 ? (
                      <ArpButton label="" icon="add" color="success" onClick={addComponent} disabled={!isEdit} />
                    ) : (
                      <ArpButton label="" icon="delete" color="danger" onClick={() => removeComponent(idx)} disabled={!isEdit} />
                    )}
                  </CCol>
                </CRow>
              ))}
            </CForm>
          </CCardBody>
        </CCard>

        {/* ================= FORM CARD: COMPUTATION VALUES ================= */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Add Computation Values</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="mb-2">
              <CCol md={3}>Total</CCol>
              <CCol md={3}>
                <CFormCheck switch checked={comp.total} onChange={() => toggleComp('total')} disabled={!isEdit} />
              </CCol>
              <CCol md={3}>Best of Two</CCol>
              <CCol md={3}>
                <CFormCheck switch checked={comp.bestOfTwo} onChange={() => toggleComp('bestOfTwo')} disabled={!isEdit} />
              </CCol>
            </CRow>

            <CRow className="mb-2">
              <CCol md={3}>Best of Three</CCol>
              <CCol md={3}>
                <CFormCheck switch checked={comp.bestOfThree} onChange={() => toggleComp('bestOfThree')} disabled={!isEdit} />
              </CCol>
              <CCol md={3}>Average</CCol>
              <CCol md={3}>
                <CFormCheck switch checked={comp.average} onChange={() => toggleComp('average')} disabled={!isEdit} />
              </CCol>
            </CRow>

            <CRow className="mb-2">
              <CCol md={3}>Convert Into</CCol>
              <CCol md={3}>
                <CFormCheck switch checked={comp.convertInto} onChange={() => toggleComp('convertInto')} disabled={!isEdit} />
              </CCol>
              <CCol md={3}>Round Off</CCol>
              <CCol md={3}>
                <CFormCheck switch checked={comp.roundOff} onChange={() => toggleComp('roundOff')} disabled={!isEdit} />
              </CCol>
            </CRow>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <ArpButton label="Save" icon="save" color="success" disabled={!isEdit} />
              <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
            </div>
          </CCardBody>
        </CCard>

        {/* ================= TABLE CARD ================= */}
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Student Details</strong>

            <div className="d-flex align-items-center gap-2 flex-nowrap" style={{ overflowX: 'auto' }}>
              <CInputGroup size="sm" style={{ width: 280 }}>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
              </CInputGroup>

              <CFormSelect
                size="sm"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{ width: 120 }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </CFormSelect>

              <div className="d-flex gap-2 flex-nowrap">
                <ArpIconButton icon="view" color="purple" disabled={!selectedId} />
                <ArpIconButton icon="edit" color="info" disabled={!selectedId} />
                <ArpIconButton icon="delete" color="danger" disabled={!selectedId} />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Select</CTableHeaderCell>
                  <CTableHeaderCell>Program Code</CTableHeaderCell>
                  <CTableHeaderCell>Programme</CTableHeaderCell>
                  <CTableHeaderCell>Semester</CTableHeaderCell>
                  <CTableHeaderCell>Batch</CTableHeaderCell>
                  <CTableHeaderCell>Reg. No.</CTableHeaderCell>
                  <CTableHeaderCell>Name</CTableHeaderCell>
                  <CTableHeaderCell>Class</CTableHeaderCell>
                  <CTableHeaderCell>Label</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {pageRows.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell>
                      <CFormCheck
                        type="radio"
                        name="ciaSel"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{r.programmeCode}</CTableDataCell>
                    <CTableDataCell>{r.programme}</CTableDataCell>
                    <CTableDataCell>{r.semester}</CTableDataCell>
                    <CTableDataCell>{r.batch}</CTableDataCell>
                    <CTableDataCell>{r.regNo}</CTableDataCell>
                    <CTableDataCell>{r.name}</CTableDataCell>
                    <CTableDataCell>{r.className}</CTableDataCell>
                    <CTableDataCell>{r.label}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>

            <div className="d-flex justify-content-end mt-2">
              <CPagination size="sm">
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage(1)}>
                  «
                </CPaginationItem>
                <CPaginationItem
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </CPaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <CPaginationItem key={i + 1} active={safePage === i + 1} onClick={() => setPage(i + 1)}>
                    {i + 1}
                  </CPaginationItem>
                ))}
                <CPaginationItem
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
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

export default CIAComponentsConfiguration
