import React, { useMemo, useState } from 'react'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'
import { ArpButton, ArpDataTable, ArpIconButton } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'

const todayIso = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const addDaysIso = (isoDate, days) => {
  const dt = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(dt.getTime())) return isoDate
  dt.setDate(dt.getDate() + days)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const initialForm = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
  facultyId: '',
  classId: '',
  fromDate: todayIso(),
  toDate: addDaysIso(todayIso(), 6),
}

const initialModal = {
  mode: 'add',
  entryId: '',
  date: '',
  className: '',
  classLabel: '',
  courseCode: '',
  courseTitle: '',
  hourLabel: '',
  timeFrom: '',
  timeTo: '',
  onlinePlatform: 'GOOGLE_MEET',
  onlineMeetingLink: '',
  onlineMeetingNotes: '',
}

const platformOptions = [
  { value: 'MICROSOFT_TEAMS', label: 'Microsoft Teams' },
  { value: 'GOOGLE_MEET', label: 'Google Meet' },
  { value: 'ZOOM', label: 'Zoom' },
  { value: 'WEBEX', label: 'Cisco Webex' },
  { value: 'OTHER', label: 'Other' },
]

const modeOptions = [
  { value: 'FACULTY', label: 'Faculty Schedule Management' },
  { value: 'ADMIN', label: 'Admin Management' },
  { value: 'STUDENT', label: 'Student Portal View' },
]

const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB')
}

const OnlineClasses = () => {
  const [mode, setMode] = useState('FACULTY')
  const [form, setForm] = useState(initialForm)

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [faculties, setFaculties] = useState([])
  const [classes, setClasses] = useState([])

  const [rows, setRows] = useState([])
  const [selectedManageId, setSelectedManageId] = useState(null)
  const [studentRows, setStudentRows] = useState([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modal, setModal] = useState(initialModal)

  const scope = useMemo(
    () => ({
      institutionId: form.institutionId,
      departmentId: form.departmentId,
      programmeId: form.programmeId,
      regulationId: form.regulationId,
      academicYearId: form.academicYearId,
      batchId: form.batchId,
      semester: form.semester,
    }),
    [form],
  )

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(form.academicYearId)) || null,
    [academicYears, form.academicYearId],
  )
  const semesterOptions = useMemo(() => semesterOptionsFromAcademicYear(selectedAcademicYear), [selectedAcademicYear])

  React.useEffect(() => {
    ;(async () => {
      try {
        setInstitutions(await lmsService.listInstitutions())
      } catch {
        setError('Failed to load institutions')
      }
    })()
  }, [])

  const resetGrid = () => {
    setRows([])
    setSelectedManageId(null)
    setStudentRows([])
  }

  const onChange = (key) => async (e) => {
    const value = e.target.value
    setError('')
    setInfo('')

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
        facultyId: '',
        classId: '',
      }))
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      setFaculties([])
      setClasses([])
      resetGrid()
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
      setForm((p) => ({ ...p, departmentId: value, programmeId: '', regulationId: '', facultyId: '', classId: '' }))
      setProgrammes([])
      setRegulations([])
      setFaculties([])
      setClasses([])
      resetGrid()
      if (!value || !form.institutionId) return
      try {
        setProgrammes(await lmsService.listProgrammes(form.institutionId, value))
      } catch {
        setError('Failed to load programmes')
      }
      return
    }

    if (key === 'programmeId') {
      setForm((p) => ({ ...p, programmeId: value, regulationId: '', classId: '' }))
      setRegulations([])
      setClasses([])
      resetGrid()
      if (!value || !form.institutionId) return
      try {
        const [regs, cls] = await Promise.all([
          lmsService.listRegulations(form.institutionId, value),
          lmsService.listClasses({ institutionId: form.institutionId, departmentId: form.departmentId, programmeId: value }),
        ])
        setRegulations(regs)
        setClasses(cls)
      } catch {
        setError('Failed to load regulations/classes')
      }
      return
    }

    if (key === 'academicYearId') {
      setForm((p) => ({ ...p, academicYearId: value, semester: '', facultyId: '' }))
      setFaculties([])
      resetGrid()
      if (!form.institutionId || !form.departmentId || !value) return
      try {
        setFaculties(
          await lmsService.listFaculties({
            institutionId: form.institutionId,
            departmentId: form.departmentId,
            academicYearId: value,
          }),
        )
      } catch {
        setError('Failed to load faculties')
      }
      return
    }

    setForm((p) => ({ ...p, [key]: value }))
  }

  const validateScope = () => {
    if (!form.institutionId || !form.departmentId || !form.programmeId || !form.regulationId) {
      setError('Select Institution, Department, Programme and Regulation')
      return false
    }
    if (!form.academicYearId || !form.batchId || !form.semester) {
      setError('Select Academic Year, Batch and Semester')
      return false
    }
    if (mode !== 'STUDENT' && !form.facultyId) {
      setError('Select faculty for schedule conversion')
      return false
    }
    if (mode === 'STUDENT' && !form.classId) {
      setError('Select class for student portal view')
      return false
    }
    if (!form.fromDate || !form.toDate) {
      setError('Select from/to dates')
      return false
    }
    if (form.fromDate > form.toDate) {
      setError('From date must be less than or equal to To date')
      return false
    }
    return true
  }

  const searchManageRows = async () => {
    const payload = await lmsService.getFacultyLectureSchedule(scope, {
      facultyId: form.facultyId,
      view: 'dateRange',
      fromDate: form.fromDate,
      toDate: form.toDate,
    })
    const list = (Array.isArray(payload) ? payload : []).map((x, idx) => ({
      ...x,
      __rowKey: `${x.id || 'row'}::${x.sessionDate || idx}::${idx}`,
    }))
    setRows(list)
    setSelectedManageId(null)
    if (!list.length) setInfo('No lecture schedule rows found in selected range')
  }

  const searchStudentRows = async () => {
    const payload = await lmsService.getStudentOnlineClasses(scope, {
      classId: form.classId,
      fromDate: form.fromDate,
      toDate: form.toDate,
    })
    const list = Array.isArray(payload) ? payload : []
    setStudentRows(list)
    if (!list.length) setInfo('No online class links available for selected filters')
  }

  const onSearch = async (e) => {
    e?.preventDefault?.()
    setError('')
    setInfo('')
    if (!validateScope()) return

    try {
      setLoading(true)
      resetGrid()
      if (mode === 'STUDENT') await searchStudentRows()
      else await searchManageRows()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load online class data')
    } finally {
      setLoading(false)
    }
  }

  const openModal = async (row, modalMode) => {
    setError('')
    const base = {
      mode: modalMode,
      entryId: row.id,
      date: row.sessionDate,
      className: row.className || '',
      classLabel: row.classLabel || '',
      courseCode: row.courseCode || '',
      courseTitle: row.courseTitle || '',
      hourLabel: row.hourLabel || '',
      timeFrom: row.timeFrom || '',
      timeTo: row.timeTo || '',
      onlinePlatform: row.onlinePlatform || 'GOOGLE_MEET',
      onlineMeetingLink: row.onlineMeetingLink || '',
      onlineMeetingNotes: row.onlineMeetingNotes || '',
    }

    if (modalMode !== 'add') {
      try {
        const saved = await lmsService.getOnlineClassSession(row.id, scope, {
          facultyId: form.facultyId,
          date: row.sessionDate,
        })
        setModal({
          ...base,
          onlinePlatform: saved?.onlinePlatform || base.onlinePlatform,
          onlineMeetingLink: saved?.onlineMeetingLink || base.onlineMeetingLink,
          onlineMeetingNotes: saved?.onlineMeetingNotes || base.onlineMeetingNotes,
        })
      } catch {
        setModal(base)
      }
    } else {
      setModal(base)
    }
    setModalOpen(true)
  }

  const onModalChange = (key) => (e) => setModal((p) => ({ ...p, [key]: e.target.value }))

  const closeModal = () => {
    setModalOpen(false)
    setModal(initialModal)
  }

  const onSaveOnlineClass = async () => {
    setError('')
    if (!modal.entryId || !modal.date) {
      setError('Invalid lecture slot selected')
      return
    }
    if (!modal.onlineMeetingLink) {
      setError('Meeting link is required')
      return
    }
    try {
      setSaving(true)
      await lmsService.saveOnlineClassSession(modal.entryId, scope, {
        facultyId: form.facultyId,
        date: modal.date,
        onlinePlatform: modal.onlinePlatform,
        onlineMeetingLink: modal.onlineMeetingLink,
        onlineMeetingNotes: modal.onlineMeetingNotes,
      })
      closeModal()
      await searchManageRows()
      setInfo('Online class schedule saved successfully')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save online class')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteOnlineClass = async (row) => {
    setError('')
    setInfo('')
    const ok = window.confirm('Delete online class link for this lecture hour?')
    if (!ok) return
    try {
      setSaving(true)
      await lmsService.deleteOnlineClassSession(row.id, scope, {
        facultyId: form.facultyId,
        date: row.sessionDate,
      })
      await searchManageRows()
      setInfo('Online class removed successfully')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete online class')
    } finally {
      setSaving(false)
    }
  }

  const selectedManageRow = useMemo(
    () => rows.find((x) => String(x.__rowKey) === String(selectedManageId)) || null,
    [rows, selectedManageId],
  )

  const hasOnlineClass = (row) => !!row?.isOnlineClass && !!row?.onlineMeetingLink

  const onAddSelected = () => {
    if (!selectedManageRow) return
    openModal(selectedManageRow, 'add')
  }

  const onEditSelected = () => {
    if (!selectedManageRow || !hasOnlineClass(selectedManageRow)) return
    openModal(selectedManageRow, 'edit')
  }

  const onViewSelected = () => {
    if (!selectedManageRow || !hasOnlineClass(selectedManageRow)) return
    openModal(selectedManageRow, 'view')
  }

  const onDeleteSelected = () => {
    if (!selectedManageRow || !hasOnlineClass(selectedManageRow)) return
    onDeleteOnlineClass(selectedManageRow)
  }

  const manageColumns = useMemo(
    () => [
      { key: 'sessionDate', label: 'Date', sortable: true, width: 130, render: (r) => formatDate(r.sessionDate) },
      {
        key: 'hourLabel',
        label: 'Hour',
        sortable: true,
        width: 190,
        render: (r) => `H${r.hourLabel || '-'} (${r.timeFrom || '--'} - ${r.timeTo || '--'})`,
      },
      {
        key: 'className',
        label: 'Class',
        sortable: true,
        width: 180,
        render: (r) => `${r.className || '-'}${r.classLabel ? ` (${r.classLabel})` : ''}`,
      },
      {
        key: 'courseCode',
        label: 'Course',
        sortable: true,
        width: 280,
        render: (r) => `${r.courseCode || '-'}${r.courseTitle ? ` - ${r.courseTitle}` : ''}`,
      },
      {
        key: 'isOnlineClass',
        label: 'Status',
        sortable: true,
        width: 190,
        render: (r) => (hasOnlineClass(r) ? 'Online Scheduled' : 'Physical / Not Converted'),
      },
      { key: 'onlinePlatform', label: 'Platform', sortable: true, width: 140, render: (r) => r.onlinePlatform || '-' },
      {
        key: 'onlineMeetingLink',
        label: 'Meeting Link',
        sortable: false,
        width: 160,
        render: (r) =>
          r.onlineMeetingLink ? (
            <a href={r.onlineMeetingLink} target="_blank" rel="noreferrer">
              Open Link
            </a>
          ) : (
            '-'
          ),
      },
    ],
    [rows, selectedManageId],
  )

  const manageActions = (
    <div className="d-flex gap-2">
      <ArpIconButton
        icon="add"
        color="success"
        title="Add Online Class For Selected Row"
        onClick={onAddSelected}
        disabled={!selectedManageRow || saving}
      />
      <ArpIconButton
        icon="edit"
        color="warning"
        title="Edit Selected Online Class"
        onClick={onEditSelected}
        disabled={!selectedManageRow || !hasOnlineClass(selectedManageRow) || saving}
      />
      <ArpIconButton
        icon="view"
        color="info"
        title="View Selected Online Class"
        onClick={onViewSelected}
        disabled={!selectedManageRow || !hasOnlineClass(selectedManageRow)}
      />
      <ArpIconButton
        icon="delete"
        color="danger"
        title="Delete Selected Online Class"
        onClick={onDeleteSelected}
        disabled={!selectedManageRow || !hasOnlineClass(selectedManageRow) || saving}
      />
    </div>
  )

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader className="fw-semibold">Online Classes Management</CCardHeader>
        <CCardBody>
          <CForm onSubmit={onSearch}>
            <CRow className="g-3">
              <CCol md={3}><CFormLabel>Mode</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={mode} onChange={(e) => setMode(e.target.value)}>
                  {modeOptions.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Institution</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.institutionId} onChange={onChange('institutionId')}>
                  <option value="">Select Institution</option>
                  {institutions.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Department</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.departmentId} onChange={onChange('departmentId')}>
                  <option value="">Select Department</option>
                  {departments.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.departmentName}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Programme</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.programmeId} onChange={onChange('programmeId')}>
                  <option value="">Select Programme</option>
                  {programmes.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.programmeCode} - {x.programmeName}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Regulation</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.regulationId} onChange={onChange('regulationId')}>
                  <option value="">Select Regulation</option>
                  {regulations.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.regulationCode}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.academicYearId} onChange={onChange('academicYearId')}>
                  <option value="">Select Academic Year</option>
                  {academicYears.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.academicYearLabel || x.academicYear}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Batch</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.batchId} onChange={onChange('batchId')}>
                  <option value="">Select Batch</option>
                  {batches.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.batchName}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}><CFormLabel>Semester</CFormLabel></CCol>
              <CCol md={3}>
                <CFormSelect value={form.semester} onChange={onChange('semester')}>
                  <option value="">Select Semester</option>
                  {semesterOptions.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              {mode === 'STUDENT' ? (
                <>
                  <CCol md={3}><CFormLabel>Class</CFormLabel></CCol>
                  <CCol md={3}>
                    <CFormSelect value={form.classId} onChange={onChange('classId')}>
                      <option value="">Select Class</option>
                      {classes.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.className} {x.classLabel ? `(${x.classLabel})` : ''}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                </>
              ) : (
                <>
                  <CCol md={3}><CFormLabel>Faculty</CFormLabel></CCol>
                  <CCol md={3}>
                    <CFormSelect value={form.facultyId} onChange={onChange('facultyId')}>
                      <option value="">Select Faculty</option>
                      {faculties.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.facultyCode || '-'} {x.facultyName || x.firstName ? `- ${x.facultyName || x.firstName}` : ''}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                </>
              )}

              <CCol md={3}><CFormLabel>From Date</CFormLabel></CCol>
              <CCol md={3}>
                <CFormInput type="date" value={form.fromDate} onChange={onChange('fromDate')} />
              </CCol>

              <CCol md={3}><CFormLabel>To Date</CFormLabel></CCol>
              <CCol md={3}>
                <CFormInput type="date" value={form.toDate} onChange={onChange('toDate')} />
              </CCol>

              <CCol md={3}><CFormLabel>Action</CFormLabel></CCol>
              <CCol md={3} className="d-flex gap-2">
                <ArpButton
                  type="submit"
                  color="primary"
                  disabled={loading || saving}
                  icon="search"
                  label={loading ? 'Loading...' : 'Search'}
                />
                <ArpButton
                  color="secondary"
                  type="button"
                  icon="reset"
                  label="Reset"
                  onClick={() => {
                    setForm(initialForm)
                    resetGrid()
                    setInfo('')
                    setError('')
                  }}
                />
              </CCol>
            </CRow>
          </CForm>

          {error ? <CAlert color="danger" className="mt-3 mb-0">{error}</CAlert> : null}
          {info ? <CAlert color="info" className="mt-3 mb-0">{info}</CAlert> : null}
        </CCardBody>
      </CCard>

      <CCard>
        <CCardHeader className="fw-semibold">
          {mode === 'STUDENT' ? 'Student Online Classes and Links' : 'Faculty Online Class Schedule Conversion'}
        </CCardHeader>
        <CCardBody>
          {mode === 'STUDENT' ? (
            <CTable responsive bordered hover small align="middle">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Hour</CTableHeaderCell>
                  <CTableHeaderCell>Course</CTableHeaderCell>
                  <CTableHeaderCell>Faculty</CTableHeaderCell>
                  <CTableHeaderCell>Platform</CTableHeaderCell>
                  <CTableHeaderCell>Meeting Link</CTableHeaderCell>
                  <CTableHeaderCell>Notes</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {studentRows.map((row, idx) => (
                  <CTableRow key={`${row.classTimetableEntryId}-${row.sessionDate}-${idx}`}>
                    <CTableDataCell>{formatDate(row.sessionDate)}</CTableDataCell>
                    <CTableDataCell>
                      H{row.hourLabel || '-'} ({row.timeFrom || '--'} - {row.timeTo || '--'})
                    </CTableDataCell>
                    <CTableDataCell>
                      {row.courseCode || '-'} {row.courseTitle ? `- ${row.courseTitle}` : ''}
                    </CTableDataCell>
                    <CTableDataCell>{row.facultyName || '-'}</CTableDataCell>
                    <CTableDataCell>{row.onlinePlatform || 'OTHER'}</CTableDataCell>
                    <CTableDataCell>
                      {row.onlineMeetingLink ? (
                        <a href={row.onlineMeetingLink} target="_blank" rel="noreferrer">
                          Join Class
                        </a>
                      ) : (
                        '-'
                      )}
                    </CTableDataCell>
                    <CTableDataCell>{row.onlineMeetingNotes || '-'}</CTableDataCell>
                  </CTableRow>
                ))}
                {!studentRows.length ? (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center text-medium-emphasis py-4">
                      No online classes found
                    </CTableDataCell>
                  </CTableRow>
                ) : null}
              </CTableBody>
            </CTable>
          ) : (
            <ArpDataTable
              title="Faculty Online Class Schedule Conversion"
              rows={rows}
              columns={manageColumns}
              rowKey="__rowKey"
              loading={loading}
              searchable
              searchPlaceholder="Search schedule..."
              pageSizeOptions={[5, 10, 20]}
              defaultPageSize={10}
              headerActions={manageActions}
              emptyText="No lecture rows found"
              selection={{
                type: 'radio',
                selected: selectedManageId,
                onChange: setSelectedManageId,
                key: '__rowKey',
                headerLabel: 'Select',
                width: 60,
                name: 'onlineClassSelect',
              }}
            />
          )}
        </CCardBody>
      </CCard>

      <CModal visible={modalOpen} onClose={closeModal} size="lg" alignment="center">
        <CModalHeader>
          <CModalTitle>
            {modal.mode === 'view' ? 'View Online Class' : modal.mode === 'edit' ? 'Edit Online Class' : 'Add Online Class'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CRow className="g-3">
            <CCol md={4}>
              <CFormLabel>Date</CFormLabel>
              <CFormInput value={formatDate(modal.date)} readOnly />
            </CCol>
            <CCol md={8}>
              <CFormLabel>Course</CFormLabel>
              <CFormInput value={`${modal.courseCode || ''} ${modal.courseTitle ? `- ${modal.courseTitle}` : ''}`} readOnly />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Class</CFormLabel>
              <CFormInput value={`${modal.className || ''} ${modal.classLabel ? `(${modal.classLabel})` : ''}`} readOnly />
            </CCol>
            <CCol md={6}>
              <CFormLabel>Hour</CFormLabel>
              <CFormInput value={`H${modal.hourLabel || '-'} (${modal.timeFrom || '--'} - ${modal.timeTo || '--'})`} readOnly />
            </CCol>

            <CCol md={4}>
              <CFormLabel>Platform</CFormLabel>
              <CFormSelect
                value={modal.onlinePlatform}
                onChange={onModalChange('onlinePlatform')}
                disabled={modal.mode === 'view'}
              >
                {platformOptions.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={8}>
              <CFormLabel>Meeting Link</CFormLabel>
              <CFormInput
                value={modal.onlineMeetingLink}
                onChange={onModalChange('onlineMeetingLink')}
                placeholder="https://..."
                readOnly={modal.mode === 'view'}
              />
            </CCol>
            <CCol md={12}>
              <CFormLabel>Notes</CFormLabel>
              <CFormTextarea
                rows={3}
                value={modal.onlineMeetingNotes}
                onChange={onModalChange('onlineMeetingNotes')}
                readOnly={modal.mode === 'view'}
              />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <ArpButton color="secondary" variant="outline" type="button" label="Close" onClick={closeModal} />
          {modal.mode !== 'view' ? (
            <ArpButton
              color="primary"
              type="button"
              disabled={saving}
              label={saving ? 'Saving...' : 'Save'}
              onClick={onSaveOnlineClass}
            />
          ) : null}
        </CModalFooter>
      </CModal>
    </>
  )
}

export default OnlineClasses
