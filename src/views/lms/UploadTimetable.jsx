import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CPagination,
  CPaginationItem,
} from '@coreui/react-pro'
import { ArpButton, ArpIconButton, TableToolbar } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'

const initialForm = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
  programmeName: '',
  className: '',
  classLabel: '',
  status: 'Automatically Fetched',
}

const UploadTimetableConfiguration = () => {
  const [form, setForm] = useState(initialForm)
  const [showDetails, setShowDetails] = useState(false)
  const [showView, setShowView] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])

  const uploadRef = useRef(null)

  useEffect(() => {
    ;(async () => {
      try {
        setInstitutions(await lmsService.listInstitutions())
      } catch {
        setError('Failed to load institutions')
      }
    })()
  }, [])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(form.academicYearId)) || null,
    [academicYears, form.academicYearId],
  )

  const semesterOptions = useMemo(
    () => semesterOptionsFromAcademicYear(selectedAcademicYear),
    [selectedAcademicYear],
  )

  const selectedRow = useMemo(() => rows.find((x) => x.id === selectedId) || null, [rows, selectedId])

  const onChange = (key) => async (e) => {
    const value = e.target.value
    setError('')

    if (key === 'institutionId') {
      setForm((p) => ({
        ...p,
        institutionId: value,
        departmentId: '',
        programmeId: '',
        regulationId: '',
        academicYearId: '',
        batchId: '',
        semester: '',
        programmeName: '',
      }))
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      if (!value) return

      try {
        const [d, ay, b] = await Promise.all([
          lmsService.listDepartments(value),
          lmsService.listAcademicYears(value),
          lmsService.listBatches(value),
        ])
        setDepartments(d)
        setAcademicYears(ay)
        setBatches(b)
      } catch {
        setError('Failed to load institution scope')
      }
      return
    }

    if (key === 'departmentId') {
      setForm((p) => ({ ...p, departmentId: value, programmeId: '', regulationId: '', programmeName: '' }))
      setProgrammes([])
      setRegulations([])
      if (!value || !form.institutionId) return
      try {
        setProgrammes(await lmsService.listProgrammes(form.institutionId, value))
      } catch {
        setError('Failed to load programmes')
      }
      return
    }

    if (key === 'programmeId') {
      const chosen = programmes.find((x) => String(x.id) === String(value))
      setForm((p) => ({ ...p, programmeId: value, regulationId: '', programmeName: chosen?.programmeName || '' }))
      setRegulations([])
      if (!value || !form.institutionId) return
      try {
        setRegulations(await lmsService.listRegulations(form.institutionId, value))
      } catch {
        setError('Failed to load regulations')
      }
      return
    }

    setForm((p) => ({ ...p, [key]: value }))
  }

  const onSearch = async () => {
    if (!form.institutionId || !form.academicYearId) {
      setError('Select at least Institution and Academic Year')
      return
    }

    try {
      setLoading(true)
      setError('')
      const data = await lmsService.listTimetables({
        institutionId: form.institutionId,
        academicYearId: form.academicYearId,
        departmentId: form.departmentId,
        programmeId: form.programmeId,
        regulationId: form.regulationId,
        batchId: form.batchId,
        semester: form.semester,
      })

      const mapped = data.map((x) => ({
        id: x.id,
        class: `${x.programmeCode || '-'} / Sem-${x.semester || '-'}`,
        semester: x.semester ? `Sem - ${x.semester}` : '-',
        status: x.shifts > 0 ? 'Uploaded' : 'Not Uploaded',
        timetableName: x.timetableName,
        slots: x.slots || [],
      }))

      setRows(mapped)
      setShowDetails(true)
      setShowView(false)
      setSelectedId(null)
      setForm((p) => ({ ...p, status: mapped.length ? 'Timetable uploaded' : 'No timetable found' }))
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load timetable data')
    } finally {
      setLoading(false)
    }
  }

  const onReset = () => {
    setForm(initialForm)
    setRows([])
    setShowDetails(false)
    setShowView(false)
    setSelectedId(null)
    setSearch('')
    setDepartments([])
    setProgrammes([])
    setRegulations([])
    setAcademicYears([])
    setBatches([])
    setError('')
  }

  const filtered = useMemo(() => {
    const q = String(search).toLowerCase().trim()
    if (!q) return rows
    return rows.filter((r) => Object.values(r).join(' ').toLowerCase().includes(q))
  }, [rows, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const slotColumns = useMemo(() => {
    const cols = selectedRow?.slots || []
    return cols.slice(0, 6)
  }, [selectedRow])

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>UPLOAD TIMETABLE</strong>
            <ArpButton
              label="Download Template"
              icon="download"
              color="danger"
              href="/assets/templates/ARP_T09_Upload_Timetable.xlsx"
            />
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Upload Timetable For</strong>
          </CCardHeader>
          <CCardBody>
            {error ? <CAlert color="danger">{error}</CAlert> : null}
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Institution</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.institutionId} onChange={onChange('institutionId')}>
                    <option value="">Select Institution</option>
                    {institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Department</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.departmentId} onChange={onChange('departmentId')}>
                    <option value="">All Departments</option>
                    {departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeId} onChange={onChange('programmeId')}>
                    <option value="">All Programmes</option>
                    {programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Regulation</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.regulationId} onChange={onChange('regulationId')}>
                    <option value="">All Regulations</option>
                    {regulations.map((x) => <option key={x.id} value={x.id}>{x.regulationCode}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYearId} onChange={onChange('academicYearId')}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.academicYearLabel || `${x.academicYear}${x.semesterCategory ? ` (${x.semesterCategory})` : ''}`}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Batch</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.batchId} onChange={onChange('batchId')}>
                    <option value="">All Batches</option>
                    {batches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')}>
                    <option value="">All Semesters</option>
                    {semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.programmeName || '-'} disabled /></CCol>

                <CCol md={3}><CFormLabel>Status</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.status} disabled /></CCol>

                <CCol md={3}><CFormLabel>Action</CFormLabel></CCol>
                <CCol md={3} className="d-flex gap-2">
                  <ArpButton label={loading ? 'Loading...' : 'Search'} icon="search" color="primary" onClick={onSearch} disabled={loading} />
                  <ArpButton label="Upload" icon="upload" color="success" onClick={() => uploadRef.current?.click()} />
                  <input ref={uploadRef} type="file" style={{ display: 'none' }} />
                  <ArpButton label="Reset" icon="reset" color="secondary" onClick={onReset} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {showDetails && !showView && (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Timetable Details</strong>

              <TableToolbar
                search={search}
                onSearchChange={(e) => setSearch(e.target.value)}
                pageSize={pageSize}
                onPageSizeChange={(e) => setPageSize(Number(e.target.value))}
                pageSizeOptions={[5, 10, 20]}
                actions={
                  <>
                    <ArpIconButton icon="view" color="info" onClick={() => setShowView(true)} disabled={!selectedId} />
                    <ArpIconButton icon="delete" color="danger" disabled={!selectedId} />
                  </>
                }
              />
            </CCardHeader>

            <CCardBody>
              <CTable bordered hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Class</CTableHeaderCell>
                    <CTableHeaderCell>Semester</CTableHeaderCell>
                    <CTableHeaderCell>Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {pageRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell>
                        <CFormCheck type="radio" checked={selectedId === r.id} onChange={() => setSelectedId(r.id)} />
                      </CTableDataCell>
                      <CTableDataCell>{r.class}</CTableDataCell>
                      <CTableDataCell>{r.semester}</CTableDataCell>
                      <CTableDataCell>{r.status}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>

              <div className="d-flex justify-content-end mt-2">
                <CPagination size="sm">
                  <CPaginationItem disabled={safePage <= 1} onClick={() => setPage(1)}>Prev</CPaginationItem>
                  <CPaginationItem active>{safePage}</CPaginationItem>
                  <CPaginationItem disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>Next</CPaginationItem>
                </CPagination>
              </div>
            </CCardBody>
          </CCard>
        )}

        {showView && selectedRow && (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>View Timetable - {selectedRow.timetableName}</strong>
              <ArpButton label="Back" icon="arrow-left" color="secondary" onClick={() => setShowView(false)} />
            </CCardHeader>
            <CCardBody>
              <CTable bordered>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Slot</CTableHeaderCell>
                    <CTableHeaderCell>Time</CTableHeaderCell>
                    <CTableHeaderCell>Nomenclature</CTableHeaderCell>
                    <CTableHeaderCell>Shift</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {slotColumns.map((s) => (
                    <CTableRow key={s.id}>
                      <CTableDataCell>{s.priority}</CTableDataCell>
                      <CTableDataCell onClick={() => setShowModal(true)} style={{ cursor: 'pointer' }}>{s.timeFrom} - {s.timeTo}</CTableDataCell>
                      <CTableDataCell>{s.nomenclature}</CTableDataCell>
                      <CTableDataCell>{s.shiftName}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        <CModal visible={showModal} onClose={() => setShowModal(false)}>
          <CModalHeader>
            <CModalTitle>Timetable Slot Details</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <p><strong>Timetable:</strong> {selectedRow?.timetableName || '-'}</p>
            <p><strong>Total Slots:</strong> {selectedRow?.slots?.length || 0}</p>
          </CModalBody>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default UploadTimetableConfiguration
