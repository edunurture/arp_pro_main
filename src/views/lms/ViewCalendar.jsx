import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'
import { ArpButton, useArpToast } from '../../components/common'
import api from '../../services/apiClient'
import { lmsService } from '../../services/lmsService'

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const normalizeSemesterCategory = (value) => String(value || '').toUpperCase().trim()
const holidayCellStyle = {
  backgroundColor: 'var(--cui-secondary)',
  color: '#ffffff',
}

const ViewCalendarConfiguration = () => {
  const toast = useArpToast()
  const [academicCalendarId, setAcademicCalendarId] = useState('')
  const [semesterCategory, setSemesterCategory] = useState('')
  const [status, setStatus] = useState('Automatically Fetched')
  const [showCalendar, setShowCalendar] = useState(false)

  const [uploads, setUploads] = useState([])
  const [academicCalendars, setAcademicCalendars] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const [dayOrderFilter, setDayOrderFilter] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [fromDateFilter, setFromDateFilter] = useState('')
  const [toDateFilter, setToDateFilter] = useState('')
  const [holidayFilter, setHolidayFilter] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const [uploadRows, ayRes] = await Promise.all([
          lmsService.listCalendarUploads(),
          api.get('/api/setup/academic-year', { params: { view: 'annual' } }),
        ])
        setUploads(uploadRows)
        setAcademicCalendars(unwrapList(ayRes))
      } catch {
        toast.show({
          color: 'danger',
          title: 'Calendar',
          message: 'Failed to load calendar data',
        })
      }
    })()
  }, [toast])

  const academicCalendarOptions = useMemo(
    () =>
      academicCalendars.map((ay) => ({
        id: ay.id,
        label: ay.academicYearLabel || ay.academicYear || '',
      })),
    [academicCalendars],
  )

  const selectedAcademicCalendar = useMemo(
    () => academicCalendars.find((ay) => String(ay?.id) === String(academicCalendarId)) || null,
    [academicCalendars, academicCalendarId],
  )

  const availableSemesterCategories = useMemo(() => {
    if (!academicCalendarId) return ['ODD', 'EVEN']

    const categories = []
    if (Array.isArray(selectedAcademicCalendar?.oddChosenSemesters) && selectedAcademicCalendar.oddChosenSemesters.length) {
      categories.push('ODD')
    }
    if (Array.isArray(selectedAcademicCalendar?.evenChosenSemesters) && selectedAcademicCalendar.evenChosenSemesters.length) {
      categories.push('EVEN')
    }
    if (categories.length) return categories

    const fromUploads = Array.from(
      new Set(
        uploads
          .filter((x) =>
            [selectedAcademicCalendar?.oddAcademicYearId, selectedAcademicCalendar?.evenAcademicYearId, selectedAcademicCalendar?.id]
              .map((id) => String(id || '').trim())
              .filter(Boolean)
              .includes(String(x?.academicYearId || '').trim()),
          )
          .map((x) => normalizeSemesterCategory(x?.semesterPattern))
          .filter((x) => x === 'ODD' || x === 'EVEN'),
      ),
    )
    return fromUploads.length ? fromUploads : ['ODD', 'EVEN']
  }, [academicCalendarId, selectedAcademicCalendar, uploads])

  useEffect(() => {
    if (!academicCalendarId) {
      setSemesterCategory('')
      return
    }
    if (availableSemesterCategories.length === 1) {
      setSemesterCategory(availableSemesterCategories[0])
      return
    }
    setSemesterCategory((prev) =>
      availableSemesterCategories.includes(String(prev || '').toUpperCase()) ? prev : '',
    )
  }, [academicCalendarId, availableSemesterCategories])

  const resolvedAcademicYearId = useMemo(() => {
    if (semesterCategory === 'ODD') {
      return selectedAcademicCalendar?.oddAcademicYearId || selectedAcademicCalendar?.id || ''
    }
    if (semesterCategory === 'EVEN') {
      return selectedAcademicCalendar?.evenAcademicYearId || selectedAcademicCalendar?.id || ''
    }
    return selectedAcademicCalendar?.id || ''
  }, [semesterCategory, selectedAcademicCalendar])

  const uploadCandidates = useMemo(
    () =>
      Array.from(
        new Set(
          [
            resolvedAcademicYearId,
            selectedAcademicCalendar?.oddAcademicYearId,
            selectedAcademicCalendar?.evenAcademicYearId,
            selectedAcademicCalendar?.id,
          ]
            .map((id) => String(id || '').trim())
            .filter(Boolean),
        ),
      ),
    [resolvedAcademicYearId, selectedAcademicCalendar],
  )

  const scopedUploads = useMemo(() => {
    return uploads.filter((x) => {
      if (uploadCandidates.length && !uploadCandidates.includes(String(x.academicYearId || '').trim())) return false
      if (semesterCategory && normalizeSemesterCategory(x.semesterPattern) !== normalizeSemesterCategory(semesterCategory)) return false
      return true
    })
  }, [uploads, uploadCandidates, semesterCategory])

  const dayOrderOptions = useMemo(() => {
    const set = new Set(
      rows
        .map((x) => String(x.dayOrder || '').trim())
        .filter((x) => x && x !== '-'),
    )
    return Array.from(set)
  }, [rows])

  const dayOptions = useMemo(() => {
    const set = new Set(
      rows
        .map((x) => String(x.day || '').trim())
        .filter((x) => x && x !== '-'),
    )
    return Array.from(set)
  }, [rows])

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (dayOrderFilter && String(r.dayOrder || '').trim() !== dayOrderFilter) return false
      if (dayFilter && String(r.day || '').trim() !== dayFilter) return false
      if (dateFilter && r.dateValue !== dateFilter) return false
      if (fromDateFilter && (!r.dateValue || r.dateValue < fromDateFilter)) return false
      if (toDateFilter && (!r.dateValue || r.dateValue > toDateFilter)) return false
      if (holidayFilter === 'holiday' && !r.isHoliday) return false
      if (holidayFilter === 'nonHoliday' && r.isHoliday) return false
      return true
    })
  }, [rows, dayOrderFilter, dayFilter, dateFilter, fromDateFilter, toDateFilter, holidayFilter])

  const resetFilters = () => {
    setDayOrderFilter('')
    setDayFilter('')
    setDateFilter('')
    setFromDateFilter('')
    setToDateFilter('')
    setHolidayFilter('')
  }

  const onViewCalendar = async () => {
    if (!academicCalendarId || !semesterCategory) {
      setStatus('Select Academic Calendar and Semester Category')
      setRows([])
      setShowCalendar(true)
      toast.show({
        color: 'warning',
        title: 'Calendar',
        message: 'Select Academic Calendar and Semester Category',
      })
      return
    }

    if (!scopedUploads.length) {
      setStatus('No calendar found')
      setRows([])
      setShowCalendar(true)
      toast.show({
        color: 'warning',
        title: 'Calendar',
        message: 'No calendar found for the selected Academic Year and Semester Category',
      })
      return
    }

    try {
      setLoading(true)
      const preferredUpload =
        scopedUploads.find(
          (item) =>
            String(item?.academicYearId || '').trim() === String(resolvedAcademicYearId || '').trim() &&
            normalizeSemesterCategory(item?.semesterPattern) === normalizeSemesterCategory(semesterCategory),
        ) || scopedUploads[0]
      const selected = preferredUpload
      const detail = await lmsService.getCalendarUploadById(selected.id)
      const mapped = (detail?.days || []).map((x, idx) => ({
        id: x.id || idx + 1,
        dateValue: x.date || '',
        date: x.date || '-',
        day: x.day || '-',
        dayOrder: x.dayOrder || '-',
        particulars: x.event || '-',
        workingDays: x.workingDay ?? '-',
        event: x.iqacNote || '-',
        isHoliday: Boolean(x.isHoliday),
      }))
      setRows(mapped)
      resetFilters()
      setStatus(mapped.length ? 'Calendar loaded' : 'No calendar days found')
      setShowCalendar(true)
      toast.show({
        color: mapped.length ? 'success' : 'warning',
        title: 'Calendar',
        message: mapped.length ? 'Calendar loaded successfully' : 'No calendar days found',
      })
    } catch (e) {
      const message = e?.response?.data?.error || 'Failed to load calendar details'
      setStatus('Unable to load calendar')
      setRows([])
      setShowCalendar(true)
      toast.show({
        color: 'danger',
        title: 'Calendar',
        message,
      })
    } finally {
      setLoading(false)
    }
  }

  const onReset = () => {
    setAcademicCalendarId('')
    setSemesterCategory('')
    setStatus('Automatically Fetched')
    setRows([])
    setShowCalendar(false)
    resetFilters()
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader>
            <strong>VIEW ACADEMIC CALENDAR</strong>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>View Calendar</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Calendar</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={academicCalendarId} onChange={(e) => setAcademicCalendarId(e.target.value)}>
                    <option value="">Select Academic Calendar</option>
                    {academicCalendarOptions.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Semester Category</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={semesterCategory}
                    onChange={(e) => setSemesterCategory(e.target.value)}
                    disabled={!academicCalendarId || availableSemesterCategories.length === 1}
                  >
                    <option value="">Select Semester Category</option>
                    {availableSemesterCategories.map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Status</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={status} disabled /></CCol>

                <CCol md={3}><CFormLabel>Action</CFormLabel></CCol>
                <CCol md={3}>
                  <ArpButton
                    label={loading ? 'Loading...' : 'View Calendar'}
                    icon="view"
                    color="success"
                    onClick={onViewCalendar}
                    disabled={loading}
                  />
                  <ArpButton
                    label="Reset"
                    icon="reset"
                    color="secondary"
                    className="ms-2"
                    onClick={onReset}
                  />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {showCalendar && (
          <CCard>
            <CCardHeader>
              <strong>Calendar</strong>
            </CCardHeader>
            <CCardBody>
              <CRow className="g-3 mb-3">
                <CCol md={2}>
                  <CFormLabel>Day Order Wise</CFormLabel>
                  <CFormSelect value={dayOrderFilter} onChange={(e) => setDayOrderFilter(e.target.value)}>
                    <option value="">All</option>
                    {dayOrderOptions.map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Day Wise</CFormLabel>
                  <CFormSelect value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
                    <option value="">All</option>
                    {dayOptions.map((x) => (
                      <option key={x} value={x}>{x}</option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Date Wise</CFormLabel>
                  <CFormInput
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>From Date</CFormLabel>
                  <CFormInput
                    type="date"
                    value={fromDateFilter}
                    onChange={(e) => setFromDateFilter(e.target.value)}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>To Date</CFormLabel>
                  <CFormInput
                    type="date"
                    value={toDateFilter}
                    onChange={(e) => setToDateFilter(e.target.value)}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Holiday Wise</CFormLabel>
                  <CFormSelect value={holidayFilter} onChange={(e) => setHolidayFilter(e.target.value)}>
                    <option value="">All</option>
                    <option value="holiday">Holiday Only</option>
                    <option value="nonHoliday">Non-Holiday Only</option>
                  </CFormSelect>
                </CCol>
                <CCol md={12} className="d-flex justify-content-end">
                  <ArpButton
                    label="Clear Filters"
                    icon="reset"
                    color="secondary"
                    onClick={resetFilters}
                  />
                </CCol>
              </CRow>

              <CTable bordered hover responsive>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Day</CTableHeaderCell>
                    <CTableHeaderCell>Day Order</CTableHeaderCell>
                    <CTableHeaderCell>Particulars</CTableHeaderCell>
                    <CTableHeaderCell>No. of Working Days</CTableHeaderCell>
                    <CTableHeaderCell>Event Description</CTableHeaderCell>
                    <CTableHeaderCell>Is Holiday</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredRows.length ? filteredRows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell style={r.isHoliday ? holidayCellStyle : undefined}>{r.date}</CTableDataCell>
                      <CTableDataCell style={r.isHoliday ? holidayCellStyle : undefined}>{r.day}</CTableDataCell>
                      <CTableDataCell style={r.isHoliday ? holidayCellStyle : undefined}>{r.dayOrder}</CTableDataCell>
                      <CTableDataCell style={r.isHoliday ? holidayCellStyle : undefined}>{r.particulars}</CTableDataCell>
                      <CTableDataCell style={r.isHoliday ? holidayCellStyle : undefined}>{r.workingDays}</CTableDataCell>
                      <CTableDataCell style={r.isHoliday ? holidayCellStyle : undefined}>{r.event}</CTableDataCell>
                      <CTableDataCell style={r.isHoliday ? holidayCellStyle : undefined}>{r.isHoliday ? 'Yes' : 'No'}</CTableDataCell>
                    </CTableRow>
                  )) : (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center">No calendar entries matching filters</CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default ViewCalendarConfiguration
