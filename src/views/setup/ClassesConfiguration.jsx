import React, { useMemo, useRef, useState, useEffect } from 'react'
import { ArpButton, ArpIconButton } from '../../components/common'
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
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CPagination,
  CPaginationItem,
} from '@coreui/react-pro'

const initialForm = {
  className: '',
  classLabel: '',
  department: '',
  programme: '',
  semester: '',
  strength: '',
  roomNumber: '',
  capacity: '',
  buildingName: '',
  blockLabel: '',
}

export default function ClassesConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)

  // Table UX state (same pattern as Institution)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1) // 1-based

  // Upload input ref
  const fileRef = useRef(null)

  // Template download URL (adjust to your actual public path)
  const TEMPLATE_URL = '/templates/ARP_T03_Classes_Template.xlsx'

  // Sample rows (replace with API later)
  const [rows, setRows] = useState([
    {
      id: 1,
      classLabel: 'I-MCA',
      department: 'Computer Applications',
      programme: 'MCA',
      semester: 'Sem-I',
      strength: 57,
      roomNumber: 'A101',
      capacity: 60,
      block: 'A-Block',
    },
    {
      id: 2,
      classLabel: 'II-MCA',
      department: 'Computer Applications',
      programme: 'MCA',
      semester: 'Sem-I',
      strength: 58,
      roomNumber: 'A102',
      capacity: 60,
      block: 'A-Block',
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
      classLabel: selected.classLabel || '',
      department: selected.department || '',
      programme: selected.programme || '',
      semester: selected.semester || '',
      strength: selected.strength ?? '',
      roomNumber: selected.roomNumber || '',
      capacity: selected.capacity ?? '',
      blockLabel: selected.block || '',
    }))
    setIsEdit(true)
  }

  const onCancel = () => setIsEdit(false)

  const onSave = (e) => {
    e.preventDefault()
    if (!isEdit) return

    const newRow = {
      id: selectedId ?? Date.now(),
      classLabel: form.classLabel || '—',
      department: form.department || '—',
      programme: form.programme || '—',
      semester: form.semester || '—',
      strength: form.strength || '—',
      roomNumber: form.roomNumber || '—',
      capacity: form.capacity || '—',
      block: form.blockLabel || '—',
    }

    // If editing existing, replace; else add new
    setRows((prev) => {
      const exists = prev.some((r) => r.id === newRow.id)
      return exists ? prev.map((r) => (r.id === newRow.id ? newRow : r)) : [newRow, ...prev]
    })

    setSelectedId(newRow.id)
    setIsEdit(false)
    setForm(initialForm)
  }

  // Upload / Download
  const onUploadClick = () => fileRef.current?.click()

  const onFileSelected = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    console.log('Selected file:', file.name)
    e.target.value = ''
  }

  const onDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = TEMPLATE_URL
    link.download = 'ARP_T03_Classes_Template.xlsx'
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  // Filter
  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const filtered = useMemo(() => {
    const q = normalize(search)
    if (!q) return rows
    return rows.filter((r) => {
      const hay = [
        r.id,
        r.classLabel,
        r.department,
        r.programme,
        r.semester,
        r.strength,
        r.roomNumber,
        r.capacity,
        r.block,
      ]
        .map(normalize)
        .join(' ')
      return hay.includes(q)
    })
  }, [rows, search])

  // Pagination (same style as Institution)
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIdx = total === 0 ? 0 : (safePage - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)

  const pageRows = useMemo(() => filtered.slice(startIdx, endIdx), [filtered, startIdx, endIdx])

  // Reset paging when search/pageSize changes
  useEffect(() => setPage(1), [search, pageSize])

  // Keep page in range if totalPages shrinks
  useEffect(() => {
    if (page !== safePage) setPage(safePage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages])

  return (
    <CRow>
      <CCol xs={12}>
        {/* HEADER ACTIONS (same layout style as Institution) */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>CLASSES SETUP</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" />
              <ArpButton label="Edit" icon="edit" color="primary" onClick={onEdit} disabled={!selectedId} title="Edit" />
              <ArpButton label="Upload" icon="upload" color="info" onClick={onUploadClick} title="Upload" />
              <ArpButton label="Download Template" icon="download" color="danger" onClick={onDownloadTemplate} title="Download Template" />
            </div>

            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onFileSelected} />
          </CCardHeader>
        </CCard>

        {/* FORM CARD */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Classes Configuration</strong>
          </CCardHeader>

          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Name of the Class</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.className} onChange={onChange('className')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Class Label</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.classLabel} onChange={onChange('classLabel')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Select Department</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.department} onChange={onChange('department')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Management">Management</option>
                    <option value="Computer Applications">Computer Applications</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Select Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programme} onChange={onChange('programme')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="MBA">MBA</option>
                    <option value="MCA">MCA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Sem-1">Sem-1</option>
                    <option value="Sem-3">Sem-3</option>
                    <option value="Sem-5">Sem-5</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Strength of the Students</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput type="number" min={0} value={form.strength} onChange={onChange('strength')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Classroom Number</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.roomNumber} onChange={onChange('roomNumber')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Maximum Capacity</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput type="number" min={0} value={form.capacity} onChange={onChange('capacity')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Name of the Building</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.buildingName} onChange={onChange('buildingName')} disabled={!isEdit} />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Block Label</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormInput value={form.blockLabel} onChange={onChange('blockLabel')} disabled={!isEdit} />
                </CCol>

                {/* Actions */}
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} title="Save" />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} title="Cancel" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {/* TABLE CARD */}
        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Classes Details</strong>

            <div className="d-flex align-items-center gap-2">
              <CFormInput
                size="sm"
                placeholder="Search..."
                style={{ width: 220 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <CFormSelect
                size="sm"
                style={{ width: 110 }}
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                title="Page size"
              >
                {[5, 10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </CFormSelect>

              <div className="d-flex gap-2">
                <ArpIconButton icon="view" color="primary" disabled={!selectedId} onClick={() => console.log('view', selectedId)} title="View" />
                <ArpIconButton icon="edit" color="info" disabled={!selectedId} onClick={onEdit} title="Edit" />
                <ArpIconButton
                  icon="delete"
                  color="danger"
                  disabled={!selectedId}
                  onClick={() => {
                    if (!selectedId) return
                    setRows((prev) => prev.filter((r) => r.id !== selectedId))
                    setSelectedId(null)
                  }}
                  title="Delete"
                />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            <CTable hover responsive align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell style={{ width: 90 }}>Select</CTableHeaderCell>
                  <CTableHeaderCell>Class Label</CTableHeaderCell>
                  <CTableHeaderCell>Department</CTableHeaderCell>
                  <CTableHeaderCell>Programme</CTableHeaderCell>
                  <CTableHeaderCell>Semester</CTableHeaderCell>
                  <CTableHeaderCell>Strength</CTableHeaderCell>
                  <CTableHeaderCell>Room Number</CTableHeaderCell>
                  <CTableHeaderCell>Capacity</CTableHeaderCell>
                  <CTableHeaderCell>Block</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {pageRows.map((r) => (
                  <CTableRow key={r.id}>
                    <CTableDataCell>
                      <CFormCheck
                        type="radio"
                        name="classSelect"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{r.classLabel}</CTableDataCell>
                    <CTableDataCell>{r.department}</CTableDataCell>
                    <CTableDataCell>{r.programme}</CTableDataCell>
                    <CTableDataCell>{r.semester}</CTableDataCell>
                    <CTableDataCell>{r.strength}</CTableDataCell>
                    <CTableDataCell>{r.roomNumber}</CTableDataCell>
                    <CTableDataCell>{r.capacity}</CTableDataCell>
                    <CTableDataCell>{r.block}</CTableDataCell>
                  </CTableRow>
                ))}

                {pageRows.length === 0 && (
                  <CTableRow>
                    <CTableDataCell colSpan={9} className="text-center text-muted py-4">
                      No records found
                    </CTableDataCell>
                  </CTableRow>
                )}
              </CTableBody>
            </CTable>

            {/* Pagination */}
            <div className="d-flex justify-content-end mt-3">
              <CPagination size="sm" className="mb-0">
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage(1)}>
                  «
                </CPaginationItem>
                <CPaginationItem disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  ‹
                </CPaginationItem>

                <CPaginationItem active>{safePage}</CPaginationItem>

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
