import React, { useEffect, useMemo, useState } from 'react'
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
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'
import { ArpButton } from '../../components/common'
import { lmsService, semesterPatternFromSemester } from '../../services/lmsService'

const ViewCalendarConfiguration = () => {
  const [academicYearId, setAcademicYearId] = useState('')
  const [semester, setSemester] = useState('')
  const [status, setStatus] = useState('Automatically Fetched')
  const [showCalendar, setShowCalendar] = useState(false)

  const [uploads, setUploads] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        setUploads(await lmsService.listCalendarUploads())
      } catch {
        setError('Failed to load calendar uploads')
      }
    })()
  }, [])

  const academicYearOptions = useMemo(() => {
    const map = new Map()
    uploads.forEach((x) => {
      if (!map.has(x.academicYearId)) map.set(x.academicYearId, x.academicYear)
    })
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }))
  }, [uploads])

  const filteredUploads = useMemo(() => {
    const pattern = semesterPatternFromSemester(semester)
    return uploads.filter((x) => {
      if (academicYearId && String(x.academicYearId) !== String(academicYearId)) return false
      if (pattern && String(x.semesterPattern) !== pattern) return false
      return true
    })
  }, [uploads, academicYearId, semester])

  const onViewCalendar = async () => {
    if (!filteredUploads.length) {
      setStatus('No calendar found')
      setRows([])
      setShowCalendar(true)
      return
    }

    try {
      setLoading(true)
      setError('')
      const selected = filteredUploads[0]
      const detail = await lmsService.getCalendarUploadById(selected.id)
      const mapped = (detail?.days || []).map((x, idx) => ({
        id: x.id || idx + 1,
        date: x.date || '-',
        day: x.day || '-',
        dayOrder: x.dayOrder || '-',
        particulars: x.event || '-',
        workingDays: x.workingDay ?? '-',
        event: x.iqacNote || '-',
      }))
      setRows(mapped)
      setStatus(mapped.length ? 'Calendar loaded' : 'No calendar days found')
      setShowCalendar(true)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load calendar details')
    } finally {
      setLoading(false)
    }
  }

  const onReset = () => {
    setAcademicYearId('')
    setSemester('')
    setStatus('Automatically Fetched')
    setRows([])
    setShowCalendar(false)
    setError('')
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader>
            <strong>VIEW CALENDAR</strong>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>View Calendar</strong>
          </CCardHeader>
          <CCardBody>
            {error ? <CAlert color="danger">{error}</CAlert> : null}
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)}>
                    <option value="">Select Academic Year</option>
                    {academicYearOptions.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={semester} onChange={(e) => setSemester(e.target.value)}>
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((x) => (
                      <option key={x} value={x}>{`Sem - ${x}`}</option>
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
              <CTable bordered hover responsive>
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Select</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Day</CTableHeaderCell>
                    <CTableHeaderCell>Day Order</CTableHeaderCell>
                    <CTableHeaderCell>Particulars</CTableHeaderCell>
                    <CTableHeaderCell>No. of Working Days</CTableHeaderCell>
                    <CTableHeaderCell>Event Description</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {rows.map((r) => (
                    <CTableRow key={r.id}>
                      <CTableDataCell>
                        <CFormCheck type="radio" name="calSel" />
                      </CTableDataCell>
                      <CTableDataCell>{r.date}</CTableDataCell>
                      <CTableDataCell>{r.day}</CTableDataCell>
                      <CTableDataCell>{r.dayOrder}</CTableDataCell>
                      <CTableDataCell>{r.particulars}</CTableDataCell>
                      <CTableDataCell>{r.workingDays}</CTableDataCell>
                      <CTableDataCell>{r.event}</CTableDataCell>
                    </CTableRow>
                  ))}
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
