import React, { useMemo, useState } from 'react'
import {
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

import { ArpButton, ArpIconButton } from '../../components/common'

const initialForm = {
  academicYear: '',
  semester: '',
  programmeCode: '',
  programmeName: '',
  courseName: '',
  faculty: '',
}

const PROGRAMME_NAME_MAP = {
  N6MCA: 'Master of Computer Applications (MCA)',
  N6MBA: 'Master of Business Administration (MBA)',
}

const initialModal = {
  id: null,
  date: '',
  dayOrder: '',
  day: '',
  hour: '',
  className: '',
  classLabel: '',
  link: '',
  remarks: 'Online Class Scheduled',
}

const dayName = (isoDate) => {
  if (!isoDate) return ''
  const d = new Date(`${isoDate}T00:00:00`)
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return names[d.getDay()] || ''
}

const OnlineClasses = () => {
  // Header actions
  const [isEdit, setIsEdit] = useState(false)

  // Phase 1 form
  const [form, setForm] = useState(initialForm)

  // Phase 2/3
  const [showScheduleTable, setShowScheduleTable] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit' | 'view'
  const [modal, setModal] = useState(initialModal)

  // Table rows (dummy + editable)
  const seedRows = useMemo(
    () => [
      {
        id: 1,
        date: '2026-01-10',
        dayOrder: 'I',
        day: 'Friday',
        hour: 'Hour–1',
        className: 'I BCom',
        classLabel: 'A',
        link: 'https://meet.example.com/class-1',
        remarks: 'Online Class Scheduled',
      },
      {
        id: 2,
        date: '2026-01-11',
        dayOrder: 'II',
        day: 'Saturday',
        hour: 'Hour–2',
        className: 'I BBA',
        classLabel: 'B',
        link: 'https://meet.example.com/class-2',
        remarks: 'Online Class Scheduled',
      },
      {
        id: 3,
        date: '2026-01-12',
        dayOrder: 'III',
        day: 'Sunday',
        hour: 'Hour–3',
        className: 'I BCom',
        classLabel: 'C',
        link: 'https://meet.example.com/class-3',
        remarks: 'Online Class Scheduled',
      },
      {
        id: 4,
        date: '2026-01-13',
        dayOrder: 'IV',
        day: 'Monday',
        hour: 'Hour–1',
        className: 'I BBA',
        classLabel: 'A',
        link: 'https://meet.example.com/class-4',
        remarks: 'Online Class Scheduled',
      },
      {
        id: 5,
        date: '2026-01-14',
        dayOrder: 'V',
        day: 'Tuesday',
        hour: 'Hour–4',
        className: 'I BCom',
        classLabel: 'B',
        link: 'https://meet.example.com/class-5',
        remarks: 'Online Class Scheduled',
      },
    ],
    [],
  )

  const [rows, setRows] = useState([])

  // -----------------------------
  // Header actions
  // -----------------------------
  const onAddNew = () => {
    setIsEdit(true)
    setForm(initialForm)
    setShowScheduleTable(false)
    setSelectedId(null)
    setRows([])
  }

  const onViewMode = () => {
    setIsEdit(false)
  }

  // -----------------------------
  // Phase 1 Handlers
  // -----------------------------
  const setField = (key) => (e) => {
    const value = e.target.value
    if (key === 'programmeCode') {
      setForm((p) => ({
        ...p,
        programmeCode: value,
        programmeName: PROGRAMME_NAME_MAP[value] || '',
      }))
      return
    }
    setForm((p) => ({ ...p, [key]: value }))
  }

  const onSearch = () => {
    if (!form.academicYear || !form.semester || !form.programmeCode || !form.courseName || !form.faculty) return
    setShowScheduleTable(true)
    setSelectedId(null)
    setRows(seedRows)
  }

  const onReset = () => {
    setForm(initialForm)
    setShowScheduleTable(false)
    setSelectedId(null)
    setRows([])
  }

  const onCancel = () => {
    setIsEdit(false)
    onReset()
  }

  // -----------------------------
  // Modal helpers
  // -----------------------------
  const openModal = (mode) => {
    setModalMode(mode)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModal(initialModal)
  }

  const setModalField = (key) => (e) => {
    const value = e.target.value
    if (key === 'date') {
      setModal((p) => ({ ...p, date: value, day: dayName(value) }))
      return
    }
    setModal((p) => ({ ...p, [key]: value }))
  }

  const onMakeOnlineLink = () => {
    const newLink = `https://meet.example.com/${Date.now()}`
    setModal((p) => ({ ...p, link: newLink }))
  }

  const onAdd = () => {
    if (!showScheduleTable) return
    setModal({ ...initialModal, id: null, remarks: 'Online Class Scheduled' })
    openModal('add')
  }

  const onView = () => {
    if (!selectedId) return
    const r = rows.find((x) => x.id === selectedId)
    if (!r) return
    setModal({ ...initialModal, ...r })
    openModal('view')
  }

  const onEdit = () => {
    if (!selectedId) return
    const r = rows.find((x) => x.id === selectedId)
    if (!r) return
    setModal({ ...initialModal, ...r })
    openModal('edit')
  }

  const onDelete = () => {
    if (!selectedId) return
    setRows((p) => p.filter((x) => x.id !== selectedId))
    setSelectedId(null)
  }

  const onSaveModal = () => {
    if (!modal.date || !modal.dayOrder || !modal.hour || !modal.className || !modal.classLabel) return

    if (modalMode === 'add') {
      const nextId = rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1
      setRows((p) => [
        ...p,
        {
          ...modal,
          id: nextId,
          day: modal.day || dayName(modal.date),
          remarks: modal.remarks || 'Online Class Scheduled',
        },
      ])
      closeModal()
      return
    }

    if (modalMode === 'edit') {
      setRows((p) =>
        p.map((r) =>
          r.id === modal.id
            ? {
                ...r,
                ...modal,
                day: modal.day || dayName(modal.date),
                remarks: modal.remarks || 'Online Class Scheduled',
              }
            : r,
        ),
      )
      closeModal()
    }
  }

  const modalDisabled = modalMode === 'view'
  const modalTitle =
    modalMode === 'add'
      ? 'Schedule for Online Classes'
      : modalMode === 'edit'
        ? 'Edit Online Class Schedule'
        : 'View Online Class Schedule'

  return (
    <CRow>
      <CCol xs={12}>
        {/* Header Action Card */}
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Online Classes</strong>

            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="View" icon="view" color="info" onClick={onViewMode} />
            </div>
          </CCardHeader>
        </CCard>

        {/* Phase 1: Form Card */}
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Online Courses: Course Schedule for</strong>
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                  <CFormSelect value={form.academicYear} onChange={setField('academicYear')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="2025-26">2025–26</option>
                    <option value="2026-27">2026–27</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Semester</CFormLabel>
                  <CFormSelect value={form.semester} onChange={setField('semester')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Sem-1">Sem – 1</option>
                    <option value="Sem-3">Sem – 3</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Programme Code</CFormLabel>
                  <CFormSelect value={form.programmeCode} onChange={setField('programmeCode')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="N6MCA">N6MCA</option>
                    <option value="N6MBA">N6MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme Name</CFormLabel>
                  <CFormInput value={form.programmeName} readOnly placeholder="Programme Name" />
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Course Name</CFormLabel>
                  <CFormSelect value={form.courseName} onChange={setField('courseName')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="N6MCA">N6MCA</option>
                    <option value="N6MBA">N6MBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Choose Faculty</CFormLabel>
                  <CFormSelect value={form.faculty} onChange={setField('faculty')} disabled={!isEdit}>
                    <option value="">Select</option>
                    <option value="Priya.G">Priya.G</option>
                    <option value="Sruthi.T">Sruthi.T</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <ArpButton label="Search" icon="search" color="info" onClick={onSearch} />
                <ArpButton label="Reset" icon="reset" color="warning" onClick={onReset} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} />
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        {/* Phase 2 + 3: Schedule Table */}
        {showScheduleTable && (
          <CCard className="mb-3">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Schedule for Online Classes</strong>

              <div className="d-flex align-items-center gap-2 flex-nowrap">
                <ArpIconButton icon="add" title="Add" onClick={onAdd} />
                <ArpIconButton icon="edit" title="Edit" onClick={onEdit} disabled={!selectedId} />
                <ArpIconButton icon="view" title="View" onClick={onView} disabled={!selectedId} />
                <ArpIconButton icon="delete" title="Delete" onClick={onDelete} disabled={!selectedId} />
              </div>
            </CCardHeader>

            <CCardBody>
              <CTable bordered hover responsive align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell style={{ width: 56 }}></CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 130 }}>Date</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 120 }}>Day Order</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 140 }}>Day</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 110 }}>Hour</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 160 }}>Class Name</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 110 }}>Label</CTableHeaderCell>
                    <CTableHeaderCell style={{ width: 170 }}>Online Class Link</CTableHeaderCell>
                    <CTableHeaderCell>Remarks</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>

                <CTableBody>
                  {rows.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={9} className="text-center py-4">
                        No records found
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    rows.map((r) => (
                      <CTableRow key={r.id} active={selectedId === r.id}>
                        <CTableDataCell>
                          <CFormCheck
                            type="radio"
                            name="online-class-row"
                            checked={selectedId === r.id}
                            onChange={() => setSelectedId(r.id)}
                            aria-label={`Select row ${r.id}`}
                          />
                        </CTableDataCell>

                        <CTableDataCell>{r.date}</CTableDataCell>
                        <CTableDataCell>{r.dayOrder}</CTableDataCell>
                        <CTableDataCell>{r.day}</CTableDataCell>
                        <CTableDataCell>{r.hour}</CTableDataCell>
                        <CTableDataCell>{r.className}</CTableDataCell>
                        <CTableDataCell>{r.classLabel}</CTableDataCell>

                        <CTableDataCell>
                          <div className="d-flex align-items-center gap-2">
                            <ArpIconButton
                              icon="view"
                              title="Open Link"
                              onClick={() => r.link && window.open(r.link, '_blank')}
                              disabled={!r.link}
                            />
                            <span className="text-muted small text-truncate" style={{ maxWidth: 110 }}>
                              {r.link ? 'Open' : 'N/A'}
                            </span>
                          </div>
                        </CTableDataCell>

                        <CTableDataCell>{r.remarks}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        )}

        {/* Modal: Add/Edit/View */}
        <CModal visible={modalOpen} onClose={closeModal} alignment="center" size="lg">
          <CModalHeader>
            <CModalTitle>{modalTitle}</CModalTitle>
          </CModalHeader>

          <CModalBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={6}>
                  <CFormLabel>Select Date</CFormLabel>
                  <CFormInput type="date" value={modal.date} onChange={setModalField('date')} disabled={modalDisabled} />
                </CCol>

                <CCol md={6}>
                  <CFormLabel>Choose Day Order</CFormLabel>
                  <CFormSelect value={modal.dayOrder} onChange={setModalField('dayOrder')} disabled={modalDisabled}>
                    <option value="">Select</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                    <option value="V">V</option>
                    <option value="VI">VI</option>
                  </CFormSelect>
                </CCol>

                <CCol md={6}>
                  <CFormLabel>Day</CFormLabel>
                  <CFormInput value={modal.day} readOnly disabled placeholder="Day" />
                </CCol>

                <CCol md={6}>
                  <CFormLabel>Hour</CFormLabel>
                  <CFormSelect value={modal.hour} onChange={setModalField('hour')} disabled={modalDisabled}>
                    <option value="">Select</option>
                    <option value="Hour–1">Hour–1</option>
                    <option value="Hour–2">Hour–2</option>
                    <option value="Hour–3">Hour–3</option>
                    <option value="Hour–4">Hour–4</option>
                  </CFormSelect>
                </CCol>

                <CCol md={6}>
                  <CFormLabel>Class Name</CFormLabel>
                  <CFormSelect value={modal.className} onChange={setModalField('className')} disabled={modalDisabled}>
                    <option value="">Select</option>
                    <option value="I BCom">I BCom</option>
                    <option value="I BBA">I BBA</option>
                  </CFormSelect>
                </CCol>

                <CCol md={6}>
                  <CFormLabel>Class Label</CFormLabel>
                  <CFormSelect value={modal.classLabel} onChange={setModalField('classLabel')} disabled={modalDisabled}>
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </CFormSelect>
                </CCol>

                <CCol md={6}>
                  <CFormLabel>Make Online Link</CFormLabel>
                  <div className="d-flex gap-2">
                    <ArpButton
                      label={modal.link ? 'Regenerate Link' : 'Generate Link'}
                      icon="add"
                      color="info"
                      onClick={onMakeOnlineLink}
                      disabled={modalDisabled}
                    />
                    {modal.link && (
                      <ArpButton
                        label="Open"
                        icon="view"
                        color="secondary"
                        onClick={() => window.open(modal.link, '_blank')}
                      />
                    )}
                  </div>
                </CCol>

                <CCol md={6}>
                  <CFormLabel>Remarks</CFormLabel>
                  <CFormInput value={modal.remarks} readOnly disabled />
                </CCol>

                {modal.link && (
                  <CCol xs={12}>
                    <CFormLabel>Online Link</CFormLabel>
                    <CFormInput value={modal.link} readOnly />
                  </CCol>
                )}
              </CRow>
            </CForm>
          </CModalBody>

          <CModalFooter>
            {modalMode !== 'view' ? (
              <>
                <ArpButton label="Save" icon="save" color="success" onClick={onSaveModal} />
                <ArpButton label="Reset" icon="reset" color="warning" onClick={() => setModal(initialModal)} />
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={closeModal} />
              </>
            ) : (
              <ArpButton label="Close" icon="cancel" color="secondary" onClick={closeModal} />
            )}
          </CModalFooter>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default OnlineClasses
