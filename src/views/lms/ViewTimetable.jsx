import React, { useEffect, useMemo, useState } from 'react'
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
  CInputGroup,
  CInputGroupText,
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
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import { ArpButton } from '../../components/common'
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
  classId: '',
}

const ViewTimetableConfiguration = () => {
  const [form, setForm] = useState(initialForm)
  const [showTimetable, setShowTimetable] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [classes, setClasses] = useState([])
  const [classTimetable, setClassTimetable] = useState(null)
  const [dayMode, setDayMode] = useState('DAY_PATTERN')
  const [dayOptionsMap, setDayOptionsMap] = useState(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])

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

  const timetable = useMemo(() => rows[0] || null, [rows])
  const classEntries = useMemo(() => classTimetable?.entries || [], [classTimetable])
  const hasClassEntries = classEntries.length > 0

  const dayLabel = useMemo(() => (dayMode === 'DAY_ORDER_PATTERN' ? 'Day Order' : 'Day'), [dayMode])

  const filteredClassEntries = useMemo(() => {
    const q = String(search).toLowerCase().trim()
    if (!q) return classEntries
    return classEntries.filter((x) => Object.values(x).join(' ').toLowerCase().includes(q))
  }, [classEntries, search])

  const filteredSlots = useMemo(() => {
    const slots = timetable?.slots || []
    const q = String(search).toLowerCase().trim()
    if (!q) return slots
    return slots.filter((x) => Object.values(x).join(' ').toLowerCase().includes(q))
  }, [timetable, search])

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
        classId: '',
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
      setForm((p) => ({
        ...p,
        departmentId: value,
        programmeId: '',
        regulationId: '',
        programmeName: '',
        classId: '',
      }))
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
      setForm((p) => ({
        ...p,
        programmeId: value,
        regulationId: '',
        programmeName: chosen?.programmeName || '',
        classId: '',
      }))
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
      const scope = {
        institutionId: form.institutionId,
        academicYearId: form.academicYearId,
        departmentId: form.departmentId,
        programmeId: form.programmeId,
        regulationId: form.regulationId,
        batchId: form.batchId,
        semester: form.semester,
      }
      const [data, classRows, patterns] = await Promise.all([
        lmsService.listTimetables(scope),
        lmsService.listClassTimetableClasses(scope),
        lmsService.listAcademicCalendarPatterns(),
      ])
      setRows(data)
      setClasses(classRows)
      const hasSelectedClass = classRows.some((x) => String(x.classId) === String(form.classId))
      const classId = hasSelectedClass ? form.classId : classRows[0]?.classId || ''
      setForm((p) => ({ ...p, classId }))

      const ayPatterns = patterns.filter((x) => String(x?.academicYearId || '') === String(form.academicYearId))
      const sourcePatterns = ayPatterns.length ? ayPatterns : patterns
      const dayPatternRow = sourcePatterns.find((x) =>
        normalizePattern(x?.calendarPattern).includes('DAY_PATTERN'),
      )
      if (dayPatternRow) {
        const dayNames = String(dayPatternRow.day || '')
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean)
        const mapped = new Map(dayNames.map((name, idx) => [idx + 1, name]))
        setDayMode('DAY_PATTERN')
        setDayOptionsMap(mapped)
      } else {
        const orderRow = sourcePatterns.find((x) => normalizePattern(x?.calendarPattern).includes('DAY_ORDER'))
        const min = Number(orderRow?.minimumDayOrder || 1)
        const max = Number(orderRow?.maxDayOrder || Math.max(min, 6))
        const mapped = new Map()
        for (let i = min; i <= max; i += 1) mapped.set(i, String(i))
        setDayMode('DAY_ORDER_PATTERN')
        setDayOptionsMap(mapped)
      }

      if (!ayPatterns.length) {
        setError('No Calendar Pattern found for selected Academic Year. Showing fallback Day Order mode.')
      }
      setShowTimetable(true)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      if (!showTimetable || !form.classId) {
        setClassTimetable(null)
        return
      }
      try {
        const scope = {
          institutionId: form.institutionId,
          academicYearId: form.academicYearId,
          departmentId: form.departmentId,
          programmeId: form.programmeId,
          regulationId: form.regulationId,
          batchId: form.batchId,
          semester: form.semester,
        }
        const data = await lmsService.getClassTimetableByClass(form.classId, scope)
        setClassTimetable(data)
      } catch {
        setClassTimetable(null)
      }
    })()
  }, [
    showTimetable,
    form.classId,
    form.institutionId,
    form.academicYearId,
    form.departmentId,
    form.programmeId,
    form.regulationId,
    form.batchId,
    form.semester,
  ])

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>VIEW TIMETABLE</strong>
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
            <strong>View Timetable</strong>
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

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')}>
                    <option value="">All Semesters</option>
                    {semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.programmeName || '-'} disabled /></CCol>

                <CCol md={3}><CFormLabel>Class</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.classId}
                    onChange={onChange('classId')}
                    disabled={!classes.length}
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.classId} value={c.classId}>
                        {c.className} {c.classLabel || ''}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Action</CFormLabel></CCol>
                <CCol md={3}>
                  <ArpButton
                    label={loading ? 'Loading...' : 'Search'}
                    icon="search"
                    color="primary"
                    onClick={onSearch}
                    disabled={loading}
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {showTimetable && timetable && (
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div className="d-flex gap-3 flex-wrap">
                <strong>{timetable.academicYear || '-'}</strong>
                <strong>{timetable.programmeCode || '-'}</strong>
                <strong>{timetable.semester ? `Sem - ${timetable.semester}` : '-'}</strong>
              </div>
            </CCardHeader>

            <CCardBody>
              <CInputGroup size="sm" className="mb-2" style={{ maxWidth: 280 }}>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </CInputGroup>

              <CTable bordered responsive>
                <CTableHead>
                  <CTableRow>
                    {hasClassEntries ? (
                      <>
                        <CTableHeaderCell>{dayLabel}</CTableHeaderCell>
                        <CTableHeaderCell>Slot</CTableHeaderCell>
                        <CTableHeaderCell>Time</CTableHeaderCell>
                        <CTableHeaderCell>Course</CTableHeaderCell>
                        <CTableHeaderCell>Faculty</CTableHeaderCell>
                        <CTableHeaderCell>Room</CTableHeaderCell>
                        <CTableHeaderCell>Type</CTableHeaderCell>
                      </>
                    ) : (
                      <>
                        <CTableHeaderCell>Slot</CTableHeaderCell>
                        <CTableHeaderCell>Shift</CTableHeaderCell>
                        <CTableHeaderCell>Time</CTableHeaderCell>
                        <CTableHeaderCell>Nomenclature</CTableHeaderCell>
                      </>
                    )}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {hasClassEntries
                    ? filteredClassEntries.map((s) => (
                        <CTableRow key={s.id}>
                          <CTableDataCell>
                            {dayOptionsMap.get(Number(s.dayOrder || s.dayOfWeek)) ||
                              (dayMode === 'DAY_ORDER_PATTERN'
                                ? `${Number(s.dayOrder || s.dayOfWeek)}`
                                : `Day ${Number(s.dayOfWeek)}`)}
                          </CTableDataCell>
                          <CTableDataCell>{s.slot?.priority ?? '-'}</CTableDataCell>
                          <CTableDataCell
                            onClick={() => {
                              setSelectedSlot(s)
                              setShowModal(true)
                            }}
                            className="text-primary"
                            style={{ cursor: 'pointer' }}
                          >
                            {s.slot?.timeFrom || '-'} - {s.slot?.timeTo || '-'}
                          </CTableDataCell>
                          <CTableDataCell>
                            {(s.courseCode || '-') + (s.courseTitle ? ` - ${s.courseTitle}` : '')}
                          </CTableDataCell>
                          <CTableDataCell>
                            {(s.facultyCode || '-') + (s.facultyName ? ` - ${s.facultyName}` : '')}
                          </CTableDataCell>
                          <CTableDataCell>{s.roomNumber || '-'}</CTableDataCell>
                          <CTableDataCell>{s.periodType || '-'}</CTableDataCell>
                        </CTableRow>
                      ))
                    : filteredSlots.map((s) => (
                        <CTableRow key={s.id}>
                          <CTableDataCell>{s.priority}</CTableDataCell>
                          <CTableDataCell>{s.shiftName}</CTableDataCell>
                          <CTableDataCell
                            onClick={() => {
                              setSelectedSlot(s)
                              setShowModal(true)
                            }}
                            className="text-primary"
                            style={{ cursor: 'pointer' }}
                          >
                            {s.timeFrom} - {s.timeTo}
                          </CTableDataCell>
                          <CTableDataCell>{s.nomenclature}</CTableDataCell>
                        </CTableRow>
                      ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        <CModal visible={showModal} onClose={() => setShowModal(false)}>
          <CModalHeader>
            <CModalTitle>Class Activity</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {hasClassEntries ? (
              <>
                <p>
                  <strong>{dayLabel}:</strong>{' '}
                  {dayOptionsMap.get(Number(selectedSlot?.dayOrder || selectedSlot?.dayOfWeek)) ||
                    (dayMode === 'DAY_ORDER_PATTERN'
                      ? `${Number(selectedSlot?.dayOrder || selectedSlot?.dayOfWeek || 0)}`
                      : `Day ${Number(selectedSlot?.dayOfWeek || 0)}`)}
                </p>
                <p><strong>Time:</strong> {selectedSlot ? `${selectedSlot?.slot?.timeFrom || '-'} - ${selectedSlot?.slot?.timeTo || '-'}` : '-'}</p>
                <p><strong>Course:</strong> {(selectedSlot?.courseCode || '-') + (selectedSlot?.courseTitle ? ` - ${selectedSlot?.courseTitle}` : '')}</p>
                <p><strong>Faculty:</strong> {(selectedSlot?.facultyCode || '-') + (selectedSlot?.facultyName ? ` - ${selectedSlot?.facultyName}` : '')}</p>
                <p><strong>Room:</strong> {selectedSlot?.roomNumber || '-'}</p>
                <p><strong>Type:</strong> {selectedSlot?.periodType || '-'}</p>
              </>
            ) : (
              <>
                <p><strong>Shift:</strong> {selectedSlot?.shiftName || '-'}</p>
                <p><strong>Time:</strong> {selectedSlot ? `${selectedSlot.timeFrom} - ${selectedSlot.timeTo}` : '-'}</p>
                <p><strong>Nomenclature:</strong> {selectedSlot?.nomenclature || '-'}</p>
              </>
            )}
          </CModalBody>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default ViewTimetableConfiguration
  const normalizePattern = (value) =>
    String(value || '')
      .toUpperCase()
      .replace(/[\s-]+/g, '_')
      .trim()
