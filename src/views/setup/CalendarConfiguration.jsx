import React, { useEffect, useMemo, useRef, useState } from 'react'
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
  CRow,
  CSpinner,
} from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'
import api from '../../services/apiClient'

const initialForm = {
  academicYearId: '',
  semesterPattern: '',
}

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

export default function CalendarConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [rows, setRows] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dayRows, setDayRows] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [daySaving, setDaySaving] = useState(false)
  const [isDayEdit, setIsDayEdit] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState(null)
  const [dayForm, setDayForm] = useState({
    dayOrder: '',
    event: '',
    iqacNote: '',
    isHoliday: false,
  })
  const [filters, setFilters] = useState({
    date: '',
    day: '',
    dayOrder: '',
    isHoliday: '',
  })

  const fileRef = useRef(null)

  const selectedRow = useMemo(
    () => rows.find((r) => String(r.id) === String(selectedId)) || null,
    [rows, selectedId],
  )
  const selectedDayRow = useMemo(
    () => dayRows.find((r) => String(r.id) === String(selectedDayId)) || null,
    [dayRows, selectedDayId],
  )

  const showMessage = (type, text) => {
    setMessage({ type, text })
    window.clearTimeout(showMessage._t)
    showMessage._t = window.setTimeout(() => setMessage(null), 4500)
  }

  const loadDetailRows = async (uploadId) => {
    if (!uploadId) {
      setDayRows([])
      return
    }
    setDetailLoading(true)
    try {
      const res = await api.get(`/api/setup/calendar/${uploadId}`)
      const data = res?.data?.data
      const items = Array.isArray(data?.days) ? data.days : []
      setDayRows(items)
      setSelectedDayId(items[0]?.id || null)
      setIsDayEdit(false)
    } catch (e) {
      setDayRows([])
      setSelectedDayId(null)
      showMessage('danger', e?.response?.data?.error || 'Failed to load calendar detail rows')
    } finally {
      setDetailLoading(false)
    }
  }

  const loadAcademicYears = async () => {
    try {
      const res = await api.get('/api/setup/academic-year')
      setAcademicYears(unwrapList(res))
    } catch {
      setAcademicYears([])
      showMessage('danger', 'Failed to load academic years')
    }
  }

  const loadRows = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/setup/calendar')
      setRows(unwrapList(res))
    } catch (e) {
      setRows([])
      showMessage('danger', e?.response?.data?.error || 'Failed to load calendar uploads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAcademicYears()
    loadRows()
  }, [])

  useEffect(() => {
    if (selectedId) loadDetailRows(selectedId)
    else setDayRows([])
  }, [selectedId])

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setIsEdit(true)
    setSelectedId(null)
    setSelectedFile(null)
    if (fileRef.current) fileRef.current.value = ''
    setForm(initialForm)
  }

  const onCancel = () => {
    setIsEdit(false)
    setSelectedFile(null)
    if (fileRef.current) fileRef.current.value = ''
    setForm(initialForm)
  }

  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
  }

  const onDownloadTemplate = async () => {
    if (!isEdit) return showMessage('danger', 'Click Add New and select Academic Year + Semester Pattern first.')
    if (!form.academicYearId) return showMessage('danger', 'Academic Year is required for template download')
    if (!form.semesterPattern) return showMessage('danger', 'Semester Pattern is required for template download')
    try {
      const res = await api.get('/api/setup/calendar/template', {
        params: {
          academicYearId: form.academicYearId,
          semesterPattern: form.semesterPattern,
        },
        responseType: 'blob',
      })
      downloadBlob(res.data, 'Academic_Calendar_Template.xlsx')
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to download template')
    }
  }

  const onDownloadCalendar = async () => {
    if (!selectedRow) return showMessage('danger', 'Select a calendar upload row first')
    try {
      const res = await api.get(`/api/setup/calendar/${selectedRow.id}/export`, { responseType: 'blob' })
      const ay = String(selectedRow.academicYear || 'Academic_Year').replace(/[^\w-]+/g, '_')
      const sem = String(selectedRow.semesterPattern || '')
      downloadBlob(res.data, `Academic_Calendar_${ay}_${sem}.xlsx`)
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to download academic calendar')
    }
  }

  const onImport = async () => {
    if (!isEdit) return
    if (!form.academicYearId) return showMessage('danger', 'Academic Year is required')
    if (!form.semesterPattern) return showMessage('danger', 'Semester Pattern is required')
    if (!selectedFile) return showMessage('danger', 'Choose an Excel file before save')

    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('academicYearId', form.academicYearId)
      fd.append('semesterPattern', form.semesterPattern)
      fd.append('file', selectedFile)

      const res = await api.post('/api/setup/calendar/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
        validateStatus: (status) => status >= 200 && status < 500,
      })

      const contentType = res.headers?.['content-type'] || ''
      if (contentType.includes('application/json')) {
        const text = await res.data.text()
        const data = JSON.parse(text)
        showMessage('success', data?.message || 'Calendar import completed successfully')
        const uploadedId = data?.data?.upload?.id
        setIsEdit(false)
        setSelectedFile(null)
        if (fileRef.current) fileRef.current.value = ''
        setForm(initialForm)
        await loadRows()
        if (uploadedId) {
          setSelectedId(uploadedId)
          await loadDetailRows(uploadedId)
        }
        return
      }

      if (res.status >= 400) {
        downloadBlob(res.data, 'Calendar_Import_Errors.xlsx')
        showMessage('danger', 'Import completed with errors (error report downloaded).')
        return
      }

      showMessage('success', 'Calendar import completed successfully')
      setIsEdit(false)
      setSelectedFile(null)
      if (fileRef.current) fileRef.current.value = ''
      setForm(initialForm)
      await loadRows()
    } catch {
      showMessage('danger', 'Failed to import calendar data')
    } finally {
      setImporting(false)
    }
  }

  const onView = async () => {
    if (!selectedRow) return
    try {
      const res = await api.get(`/api/setup/calendar/${selectedRow.id}`)
      const data = res?.data?.data
      const days = Array.isArray(data?.days) ? data.days : []
      setDayRows(days)
      showMessage('success', `Loaded ${days.length} calendar rows for ${data?.academicYear} ${data?.semesterPattern}`)
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to load calendar details')
    }
  }

  const onEdit = () => {
    if (!selectedRow) return
    setIsEdit(true)
    setSelectedFile(null)
    if (fileRef.current) fileRef.current.value = ''
    setForm({
      academicYearId: selectedRow.academicYearId ?? '',
      semesterPattern: selectedRow.semesterPattern ?? '',
    })
  }

  const onSearch = async () => {
    await loadRows()
    showMessage('success', 'Calendar details refreshed')
  }

  const onDelete = async () => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to delete this calendar upload record?')
    if (!ok) return
    try {
      await api.delete(`/api/setup/calendar/${selectedRow.id}`)
      showMessage('success', 'Calendar upload deleted successfully')
      setSelectedId(null)
      setDayRows([])
      await loadRows()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to delete calendar upload')
    }
  }

  const onEditDayRow = () => {
    if (!selectedDayRow) return showMessage('danger', 'Select a calendar day row to edit')
    setIsDayEdit(true)
    setDayForm({
      dayOrder: selectedDayRow.dayOrder || '',
      event: selectedDayRow.event || '',
      iqacNote: selectedDayRow.iqacNote || '',
      isHoliday: !!selectedDayRow.isHoliday,
    })
  }

  const onCancelDayEdit = () => {
    setIsDayEdit(false)
    setDayForm({
      dayOrder: '',
      event: '',
      iqacNote: '',
      isHoliday: false,
    })
  }

  const onSaveDayRow = async () => {
    if (!selectedRow || !selectedDayRow) return showMessage('danger', 'Select a calendar day row to save')
    setDaySaving(true)
    try {
      await api.put(`/api/setup/calendar/${selectedRow.id}/day/${selectedDayRow.id}`, {
        dayOrder: dayForm.dayOrder,
        event: dayForm.event,
        iqacNote: dayForm.iqacNote,
        isHoliday: dayForm.isHoliday,
      })
      showMessage('success', 'Calendar day row updated successfully')
      setIsDayEdit(false)
      await loadDetailRows(selectedRow.id)
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to update calendar row')
    } finally {
      setDaySaving(false)
    }
  }

  const columns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true, width: 160, align: 'center' },
      { key: 'semesterPattern', label: 'Semester Pattern', sortable: true, width: 140, align: 'center' },
      { key: 'rowCount', label: 'Rows', sortable: true, width: 90, align: 'center' },
      { key: 'uploadedOn', label: 'Uploaded On', sortable: true, width: 130, align: 'center' },
      { key: 'status', label: 'Status', sortable: true, width: 150, align: 'center' },
    ],
    [],
  )

  const detailColumns = useMemo(
    () => [
      { key: 'date', label: 'Date', sortable: true, width: 120, align: 'center' },
      { key: 'day', label: 'Day', sortable: true, width: 120, align: 'center' },
      { key: 'dayOrder', label: 'Day Order', sortable: true, width: 110, align: 'center' },
      {
        key: 'event',
        label: 'Event',
        sortable: true,
        width: 280,
        formatter: (item) => (String(item?.event || '').trim().toUpperCase() === 'HOLIDAY' ? '' : item?.event || ''),
      },
      { key: 'workingDay', label: 'Working Days', sortable: true, width: 120, align: 'center' },
      { key: 'iqacNote', label: 'IQAC Note', sortable: true, width: 110, align: 'center' },
    ],
    [],
  )

  const filteredDayRows = useMemo(() => {
    const dateF = String(filters.date || '').trim()
    const dayF = String(filters.day || '').trim().toLowerCase()
    const orderF = String(filters.dayOrder || '').trim().toLowerCase()
    const holidayF = String(filters.isHoliday || '').trim()

    return dayRows.filter((r) => {
      if (dateF && String(r?.date || '') !== dateF) return false
      if (dayF && !String(r?.day || '').toLowerCase().includes(dayF)) return false
      if (orderF && !String(r?.dayOrder || '').toLowerCase().includes(orderF)) return false
      if (holidayF === 'YES' && !r?.isHoliday) return false
      if (holidayF === 'NO' && r?.isHoliday) return false
      return true
    })
  }, [dayRows, filters])

  const headerActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="download" color="secondary" title="Download" onClick={onDownloadCalendar} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  const dayHeaderActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpButton label="Edit Row" icon="edit" color="info" onClick={onEditDayRow} disabled={!selectedDayId || isDayEdit} />
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        {message ? <CAlert color={message.type}>{message.text}</CAlert> : null}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>CALENDAR CONFIGURATION</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="Download Template" icon="download" color="danger" onClick={onDownloadTemplate} />
            </div>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Calendar Data to be Upload for</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={2}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYearId} onChange={onChange('academicYearId')} disabled={!isEdit}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.academicYearLabel || `${ay.academicYear}${ay.semesterCategory ? ` (${ay.semesterCategory})` : ''}`}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}>
                  <CFormLabel>Semester Pattern</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semesterPattern} onChange={onChange('semesterPattern')} disabled={!isEdit}>
                    <option value="">Select Semester Pattern</option>
                    <option value="ODD">Odd</option>
                    <option value="EVEN">Even</option>
                  </CFormSelect>
                </CCol>

                <CCol md={2} className="d-flex align-items-end">
                  <ArpButton label="Search" icon="search" color="info" onClick={onSearch} />
                </CCol>

                <CCol md={9} className="d-flex align-items-center gap-2 flex-wrap">
                  <CFormLabel className="mb-0">Upload Calendar Data</CFormLabel>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="form-control"
                    style={{ width: 280 }}
                    onChange={onFileChange}
                    disabled={!isEdit}
                  />
                  <ArpButton
                    label={importing ? 'Importing...' : 'Import Excel'}
                    icon="upload"
                    color="primary"
                    type="button"
                    onClick={onImport}
                    disabled={!isEdit || importing}
                  />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {loading ? (
          <div className="d-flex align-items-center gap-2 mb-2">
            <CSpinner size="sm" />
            <span>Loading calendar uploads...</span>
          </div>
        ) : null}

        <ArpDataTable
          title="CALENDAR DETAILS"
          rows={rows}
          columns={columns}
          loading={loading}
          headerActions={headerActions}
          selection={{
            type: 'radio',
            selected: selectedId,
            onChange: (value) => setSelectedId(value),
            key: 'id',
            headerLabel: 'Select',
            width: 60,
            name: 'calendarSelect',
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          defaultPageSize={10}
          searchable
          searchPlaceholder="Search..."
          rowKey="id"
        />

        <CCard className="mt-3">
          <CCardHeader>
            <strong>CALENDAR DAY-WISE DETAILS</strong>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3 mb-3">
              <CCol md={3}>
                <CFormLabel>Date</CFormLabel>
                <CFormInput
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value }))}
                />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Day</CFormLabel>
                <CFormInput
                  placeholder="e.g. Monday"
                  value={filters.day}
                  onChange={(e) => setFilters((p) => ({ ...p, day: e.target.value }))}
                />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Day Order</CFormLabel>
                <CFormInput
                  placeholder="e.g. I / II"
                  value={filters.dayOrder}
                  onChange={(e) => setFilters((p) => ({ ...p, dayOrder: e.target.value }))}
                />
              </CCol>
              <CCol md={3}>
                <CFormLabel>Is Holiday</CFormLabel>
                <CFormSelect
                  value={filters.isHoliday}
                  onChange={(e) => setFilters((p) => ({ ...p, isHoliday: e.target.value }))}
                >
                  <option value="">All</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </CFormSelect>
              </CCol>
            </CRow>

            <ArpDataTable
              title="ACADEMIC CALENDAR ROWS"
              rows={filteredDayRows}
              columns={detailColumns}
              loading={detailLoading}
              headerActions={dayHeaderActions}
              selection={{
                type: 'radio',
                selected: selectedDayId,
                onChange: (value) => setSelectedDayId(value),
                key: 'id',
                headerLabel: 'Select',
                width: 60,
                name: 'calendarDaySelect',
              }}
              pageSizeOptions={[10, 20, 50, 100]}
              defaultPageSize={20}
              searchable
              searchPlaceholder="Search..."
              rowKey="id"
            />

            <div className="mt-3 p-3 border rounded">
              <strong className="d-block mb-3">EDIT CALENDAR DAY ROW</strong>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Day Order</CFormLabel>
                  <CFormInput
                    value={dayForm.dayOrder}
                    onChange={(e) => setDayForm((p) => ({ ...p, dayOrder: e.target.value }))}
                    disabled={!isDayEdit}
                  />
                </CCol>
                <CCol md={5}>
                  <CFormLabel>Event</CFormLabel>
                  <CFormInput
                    value={dayForm.event}
                    onChange={(e) => setDayForm((p) => ({ ...p, event: e.target.value }))}
                    disabled={!isDayEdit}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>IQAC Note</CFormLabel>
                  <CFormInput
                    value={dayForm.iqacNote}
                    onChange={(e) => setDayForm((p) => ({ ...p, iqacNote: e.target.value }))}
                    disabled={!isDayEdit}
                  />
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Is Holiday</CFormLabel>
                  <CFormSelect
                    value={dayForm.isHoliday ? 'YES' : 'NO'}
                    onChange={(e) => setDayForm((p) => ({ ...p, isHoliday: e.target.value === 'YES' }))}
                    disabled={!isDayEdit}
                  >
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </CFormSelect>
                </CCol>
              </CRow>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <ArpButton
                  label={daySaving ? 'Saving...' : 'Save'}
                  icon="save"
                  color="success"
                  onClick={onSaveDayRow}
                  disabled={!isDayEdit || daySaving}
                />
                <ArpButton
                  label="Cancel"
                  icon="cancel"
                  color="secondary"
                  onClick={onCancelDayEdit}
                  disabled={!isDayEdit}
                />
              </div>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}
