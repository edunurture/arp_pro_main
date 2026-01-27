import React, { useMemo, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'/**
 * AcademicYearConfiguration.jsx (ARP CoreUI React Pro Standard)
 * - Strict 3-card layout: Header Action Card + Form Card + Table Card(s)
 * - Uses ArpDataTable for Search + Page Size + Sorting + Pagination + Selection (no manual logic)
 * - Uses ArpButton / ArpIconButton only (no direct @coreui/icons imports)
 * - Demo rows only. Hook API where indicated.
 */

const initialAyForm = {
  academicYear: '',
  academicPattern: '',
  startDate: '',
  endDate: '',
  semesters: '',
}

const initialCalForm = {
  academicYear: '',
  calendarPattern: '',
  minDayOrder: '',
  day: '',
}

export default function AcademicYearConfiguration() {
  // ARP mandatory state pattern
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null) // used for whichever table is active in edit/view actions

  // local mode for which form is active
  const [mode, setMode] = useState(null) // 'AY' | 'CAL' | null
  const [editingId, setEditingId] = useState(null)

  // forms
  const [ayForm, setAyForm] = useState(initialAyForm)
  const [calForm, setCalForm] = useState(initialCalForm)

  // table selections (separate, but still keep selectedId updated for ARP action disable behavior)
  const [selectedAyId, setSelectedAyId] = useState(null)
  const [selectedCalId, setSelectedCalId] = useState(null)

  // demo rows (replace with API later)
  const [ayRows, setAyRows] = useState([
    // Example:
    // { id: 'AY-2025', academicYear: '2025 - 2026', academicPattern: 'Odd - Semester', startDate: '2025-06-01', endDate: '2026-05-31', semesters: '2' },
  ])
  const [calRows, setCalRows] = useState([
    // Example:
    // { id: 'CAL-2025-DO', academicYear: '2025 - 2026', calendarPattern: 'Day Order', minDayOrder: '6', day: '' },
  ])

  const isAyMode = mode === 'AY'
  const isCalMode = mode === 'CAL'

  const resetForm = () => {
    setAyForm(initialAyForm)
    setCalForm(initialCalForm)
    setEditingId(null)
    setIsEdit(false)
    setMode(null)
  }

  const startAddAy = () => {
    setMode('AY')
    setIsEdit(true)
    setEditingId(null)
    setAyForm(initialAyForm)
  }

  const startAddCal = () => {
    setMode('CAL')
    setIsEdit(true)
    setEditingId(null)
    setCalForm(initialCalForm)
  }

  const onCancel = () => {
    // ARP: Cancel restores view mode
    resetForm()
  }

  const upsertRow = (rows, row) => {
    const idx = rows.findIndex((r) => String(r.id) === String(row.id))
    if (idx === -1) return [row, ...rows]
    const next = [...rows]
    next[idx] = row
    return next
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!isEdit || !mode) return

    if (mode === 'AY') {
      const id = editingId ?? `AY-${Date.now()}`
      const row = { id, ...ayForm }
      // Hook your API save here
      setAyRows((prev) => upsertRow(prev, row))
      setSelectedAyId(id)
      setSelectedId(id)
    }

    if (mode === 'CAL') {
      const id = editingId ?? `CAL-${Date.now()}`
      const row = { id, ...calForm }
      // Hook your API save here
      setCalRows((prev) => upsertRow(prev, row))
      setSelectedCalId(id)
      setSelectedId(id)
    }

    resetForm()
  }

  /* =========================
     TABLE CONFIGS (ArpDataTable)
  ========================== */

  const ayColumns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true },
      { key: 'academicPattern', label: 'Academic Pattern', sortable: true },
      { key: 'startDate', label: 'Start Date', sortable: true, width: 140, align: 'center' },
      { key: 'endDate', label: 'End Date', sortable: true, width: 140, align: 'center' },
      { key: 'semesters', label: 'Semesters', sortable: true, width: 110, align: 'center', sortType: 'number' },
    ],
    [],
  )

  const calColumns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true },
      { key: 'calendarPattern', label: 'Calendar Pattern', sortable: true },
      { key: 'minDayOrder', label: 'Min Day Order', sortable: true, width: 140, align: 'center', sortType: 'number' },
      { key: 'day', label: 'Day', sortable: true, width: 160 },
    ],
    [],
  )

  // Action handlers (demo)
  const onViewAy = () => {
    if (!selectedAyId) return
    const row = ayRows.find((r) => String(r.id) === String(selectedAyId))
    if (!row) return
    setMode('AY')
    setIsEdit(false)
    setEditingId(String(row.id))
    setAyForm({
      academicYear: row.academicYear ?? '',
      academicPattern: row.academicPattern ?? '',
      startDate: row.startDate ?? '',
      endDate: row.endDate ?? '',
      semesters: row.semesters ?? '',
    })
  }

  const onEditAy = () => {
    if (!selectedAyId) return
    const row = ayRows.find((r) => String(r.id) === String(selectedAyId))
    if (!row) return
    setMode('AY')
    setIsEdit(true)
    setEditingId(String(row.id))
    setAyForm({
      academicYear: row.academicYear ?? '',
      academicPattern: row.academicPattern ?? '',
      startDate: row.startDate ?? '',
      endDate: row.endDate ?? '',
      semesters: row.semesters ?? '',
    })
  }

  const onDeleteAy = () => {
    if (!selectedAyId) return
    // Hook your API delete here
    setAyRows((prev) => prev.filter((r) => String(r.id) !== String(selectedAyId)))
    setSelectedAyId(null)
    if (String(selectedId) === String(selectedAyId)) setSelectedId(null)
    resetForm()
  }

  const onViewCal = () => {
    if (!selectedCalId) return
    const row = calRows.find((r) => String(r.id) === String(selectedCalId))
    if (!row) return
    setMode('CAL')
    setIsEdit(false)
    setEditingId(String(row.id))
    setCalForm({
      academicYear: row.academicYear ?? '',
      calendarPattern: row.calendarPattern ?? '',
      minDayOrder: row.minDayOrder ?? '',
      day: row.day ?? '',
    })
  }

  const onEditCal = () => {
    if (!selectedCalId) return
    const row = calRows.find((r) => String(r.id) === String(selectedCalId))
    if (!row) return
    setMode('CAL')
    setIsEdit(true)
    setEditingId(String(row.id))
    setCalForm({
      academicYear: row.academicYear ?? '',
      calendarPattern: row.calendarPattern ?? '',
      minDayOrder: row.minDayOrder ?? '',
      day: row.day ?? '',
    })
  }

  const onDeleteCal = () => {
    if (!selectedCalId) return
    // Hook your API delete here
    setCalRows((prev) => prev.filter((r) => String(r.id) !== String(selectedCalId)))
    setSelectedCalId(null)
    if (String(selectedId) === String(selectedCalId)) setSelectedId(null)
    resetForm()
  }

  const ayHeaderActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onViewAy} disabled={!selectedAyId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEditAy} disabled={!selectedAyId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDeleteAy} disabled={!selectedAyId} />
    </div>
  )

  const calHeaderActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onViewCal} disabled={!selectedCalId} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEditCal} disabled={!selectedCalId} />
      <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDeleteCal} disabled={!selectedCalId} />
    </div>
  )

  return (
    <>
      {/* ===================== A) HEADER ACTION CARD ===================== */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>ACADEMIC YEAR CONFIGURATION</strong>

          <div className="d-flex gap-2">
            <ArpButton label="Add Academic Year" icon="add" color="purple" onClick={startAddAy} />
            <ArpButton label="Add Calendar Pattern" icon="add" color="info" onClick={startAddCal} />
          </div>
        </CCardHeader>
      </CCard>

      {/* ===================== B) FORM CARD ===================== */}
      <CCard className="mb-3">
        <CCardHeader>
          <strong>
            {mode === 'AY' ? 'Academic Year Setup' : mode === 'CAL' ? 'Academic Calendar Pattern Setup' : 'Configuration'}
          </strong>
        </CCardHeader>

        <CCardBody>
          {!mode ? (
            <div className="text-medium-emphasis">
              Click <strong>Add Academic Year</strong> or <strong>Add Calendar Pattern</strong> to begin.
            </div>
          ) : (
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                {/* ================= AY FORM ================= */}
                {isAyMode && (
                  <>
                    <CCol md={3}>
                      <CFormLabel>Academic Year</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormSelect
                        value={ayForm.academicYear}
                        onChange={(e) => setAyForm((p) => ({ ...p, academicYear: e.target.value }))}
                        disabled={!isEdit}
                      >
                        <option value="">Select</option>
                        <option>2026 - 2027</option>
                        <option>2025 - 2026</option>
                        <option>2024 - 2025</option>
                      </CFormSelect>
                    </CCol>

                    <CCol md={3}>
                      <CFormLabel>Academic Pattern</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormSelect
                        value={ayForm.academicPattern}
                        onChange={(e) => setAyForm((p) => ({ ...p, academicPattern: e.target.value }))}
                        disabled={!isEdit}
                      >
                        <option value="">Select</option>
                        <option>Odd - Semester</option>
                        <option>Even - Semester</option>
                      </CFormSelect>
                    </CCol>

                    <CCol md={3}>
                      <CFormLabel>Start Date</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="date"
                        value={ayForm.startDate}
                        onChange={(e) => setAyForm((p) => ({ ...p, startDate: e.target.value }))}
                        disabled={!isEdit}
                      />
                    </CCol>

                    <CCol md={3}>
                      <CFormLabel>End Date</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        type="date"
                        value={ayForm.endDate}
                        onChange={(e) => setAyForm((p) => ({ ...p, endDate: e.target.value }))}
                        disabled={!isEdit}
                      />
                    </CCol>

                    <CCol md={3}>
                      <CFormLabel>Semesters</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        placeholder="Semesters"
                        value={ayForm.semesters}
                        onChange={(e) => setAyForm((p) => ({ ...p, semesters: e.target.value }))}
                        disabled={!isEdit}
                        inputMode="numeric"
                      />
                    </CCol>

                    <CCol md={6} />
                  </>
                )}

                {/* ================= CAL FORM ================= */}
                {isCalMode && (
                  <>
                    <CCol md={3}>
                      <CFormLabel>Academic Year</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormSelect
                        value={calForm.academicYear}
                        onChange={(e) => setCalForm((p) => ({ ...p, academicYear: e.target.value }))}
                        disabled={!isEdit}
                      >
                        <option value="">Select</option>
                        <option>2026 - 2027</option>
                        <option>2025 - 2026</option>
                        <option>2024 - 2025</option>
                      </CFormSelect>
                    </CCol>

                    <CCol md={3}>
                      <CFormLabel>Calendar Pattern</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormSelect
                        value={calForm.calendarPattern}
                        onChange={(e) => setCalForm((p) => ({ ...p, calendarPattern: e.target.value }))}
                        disabled={!isEdit}
                      >
                        <option value="">Select</option>
                        <option>Day Order</option>
                        <option>Day</option>
                      </CFormSelect>
                    </CCol>

                    <CCol md={3}>
                      <CFormLabel>Min Day Order</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormInput
                        placeholder="Min Day Order"
                        value={calForm.minDayOrder}
                        onChange={(e) => setCalForm((p) => ({ ...p, minDayOrder: e.target.value }))}
                        disabled={!isEdit}
                        inputMode="numeric"
                      />
                    </CCol>

                    <CCol md={3}>
                      <CFormLabel>Day</CFormLabel>
                    </CCol>
                    <CCol md={3}>
                      <CFormSelect
                        value={calForm.day}
                        onChange={(e) => setCalForm((p) => ({ ...p, day: e.target.value }))}
                        disabled={!isEdit || calForm.calendarPattern !== 'Day'}
                        title={calForm.calendarPattern !== 'Day' ? 'Select Calendar Pattern = Day to enable' : undefined}
                      >
                        <option value="">Select</option>
                        <option>Monday</option>
                        <option>Tuesday</option>
                        <option>Wednesday</option>
                        <option>Thursday</option>
                        <option>Friday</option>
                        <option>Saturday</option>
                      </CFormSelect>
                    </CCol>
                  </>
                )}

                {/* ================= BUTTONS (ARP) ================= */}
                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  {isEdit && (
                    <ArpButton
                      label={editingId ? 'Update' : 'Save'}
                      icon="save"
                      color="success"
                      type="submit"
                    />
                  )}
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          )}
        </CCardBody>
      </CCard>

      {/* ===================== C) TABLE CARD (DETAILS) ===================== */}
      <div className="mb-3">
        <ArpDataTable
          title="ACADEMIC YEAR DETAILS"
          rows={ayRows}
          columns={ayColumns}
          loading={false}
          headerActions={ayHeaderActions}
          selection={{
            type: 'radio',
            selected: selectedAyId,
            onChange: (value) => {
              setSelectedAyId(value)
              setSelectedId(value)
            },
            key: 'id',
            headerLabel: 'Select',
            width: 60,
            name: 'ayRow',
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          defaultPageSize={10}
          searchable
          searchPlaceholder="Search..."
          rowKey="id"
        />
      </div>

      <div className="mb-3">
        <ArpDataTable
          title="ACADEMIC CALENDAR PATTERN DETAILS"
          rows={calRows}
          columns={calColumns}
          loading={false}
          headerActions={calHeaderActions}
          selection={{
            type: 'radio',
            selected: selectedCalId,
            onChange: (value) => {
              setSelectedCalId(value)
              setSelectedId(value)
            },
            key: 'id',
            headerLabel: 'Select',
            width: 60,
            name: 'calRow',
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          defaultPageSize={10}
          searchable
          searchPlaceholder="Search..."
          rowKey="id"
        />
      </div>
    </>
  )
}
