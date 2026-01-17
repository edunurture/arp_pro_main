import React, { useMemo, useState } from 'react'
import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CRow,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSave, cilX, cilPencil, cilTrash, cilSearch } from '@coreui/icons'

const AcademicYearConfiguration = () => {
  /* ---------------- form activation ---------------- */
  const [activeForm, setActiveForm] = useState(null) // 'AY' | 'CAL' | null

  /* ---------------- Academic Year form ---------------- */
  const [ayForm, setAyForm] = useState({
    academicYear: '',
    academicPattern: '',
    startDate: '',
    endDate: '',
    semesters: '',
  })

  /* ---------------- Calendar Pattern form ---------------- */
  const [calForm, setCalForm] = useState({
    academicYear: '',
    calendarPattern: '',
    minDayOrder: '',
    day: '',
  })

  /* ---------------- table data (sample) ---------------- */
  const [ayRows, setAyRows] = useState([])
  const [calRows, setCalRows] = useState([])

  /* ---------------- selection & search ---------------- */
  const [aySearch, setAySearch] = useState('')
  const [calSearch, setCalSearch] = useState('')
  const [selectedAyId, setSelectedAyId] = useState(null)
  const [selectedCalId, setSelectedCalId] = useState(null)

  /* ---------------- helpers ---------------- */
  const isAyEnabled = activeForm === 'AY'
  const isCalEnabled = activeForm === 'CAL'

  const resetAy = () =>
    setAyForm({
      academicYear: '',
      academicPattern: '',
      startDate: '',
      endDate: '',
      semesters: '',
    })

  const resetCal = () =>
    setCalForm({
      academicYear: '',
      calendarPattern: '',
      minDayOrder: '',
      day: '',
    })

  const ayFiltered = useMemo(() => {
    const q = aySearch.toLowerCase()
    return ayRows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)))
  }, [ayRows, aySearch])

  const calFiltered = useMemo(() => {
    const q = calSearch.toLowerCase()
    return calRows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)))
  }, [calRows, calSearch])

  /* ---------------- save handlers ---------------- */
  const saveAcademicYear = (e) => {
    e.preventDefault()
    if (!isAyEnabled) return

    setAyRows((prev) => [{ id: Date.now(), ...ayForm }, ...prev])
    resetAy()
    setActiveForm(null)
  }

  const saveCalendarPattern = (e) => {
    e.preventDefault()
    if (!isCalEnabled) return

    setCalRows((prev) => [{ id: Date.now(), ...calForm }, ...prev])
    resetCal()
    setActiveForm(null)
  }

  /* ==================================================== */
  return (
    <>
      {/* Header */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div className="fw-semibold">Academic Year Configuration</div>

          <CDropdown alignment="end">
            <CDropdownToggle size="sm" color="primary">
              <CIcon icon={cilPlus} className="me-1" />
              Add New
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem
                as="button"
                type="button"
                onClick={() => setActiveForm('AY')}
              >
                Add Academic Year
              </CDropdownItem>
              <CDropdownItem
                as="button"
                type="button"
                onClick={() => setActiveForm('CAL')}
              >
                Add Calendar Pattern
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </CCardHeader>
      </CCard>

      {/* Forms */}
      <CRow className="g-3 mb-3">
        {/* Academic Year */}
        <CCol lg={6}>
          <CCard>
            <CCardHeader>Academic Year Setup</CCardHeader>
            <CCardBody>
              <CForm onSubmit={saveAcademicYear}>
                <CRow className="g-3">
                  <CCol md={12}>
                    <CFormSelect
                      disabled={!isAyEnabled}
                      value={ayForm.academicYear}
                      onChange={(e) => setAyForm({ ...ayForm, academicYear: e.target.value })}
                    >
                      <option value="">Academic Year</option>
                      <option>2026 - 2027</option>
                      <option>2025 - 2026</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={12}>
                    <CFormSelect
                      disabled={!isAyEnabled}
                      value={ayForm.academicPattern}
                      onChange={(e) => setAyForm({ ...ayForm, academicPattern: e.target.value })}
                    >
                      <option value="">Academic Pattern</option>
                      <option>Odd - Semester</option>
                      <option>Even - Semester</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={6}>
                    <CFormInput
                      type="date"
                      disabled={!isAyEnabled}
                      value={ayForm.startDate}
                      onChange={(e) => setAyForm({ ...ayForm, startDate: e.target.value })}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormInput
                      type="date"
                      disabled={!isAyEnabled}
                      value={ayForm.endDate}
                      onChange={(e) => setAyForm({ ...ayForm, endDate: e.target.value })}
                    />
                  </CCol>

                  <CCol md={12}>
                    <CFormInput
                      disabled={!isAyEnabled}
                      placeholder="Semesters"
                      value={ayForm.semesters}
                      onChange={(e) => setAyForm({ ...ayForm, semesters: e.target.value })}
                    />
                  </CCol>
                </CRow>

                <div className="text-end mt-3">
                  <CButton type="submit" size="sm" color="success" disabled={!isAyEnabled} className="text-white">
                    <CIcon icon={cilSave} className="me-1" /> Save
                  </CButton>{' '}
                  <CButton
                    size="sm"
                    color="secondary"
                    className="text-white"
                    disabled={!isAyEnabled}
                    onClick={() => {
                      resetAy()
                      setActiveForm(null)
                    }}
                  >
                    <CIcon icon={cilX} className="me-1" /> Cancel
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Calendar Pattern */}
        <CCol lg={6}>
          <CCard>
            <CCardHeader>Academic Calendar Pattern Setup</CCardHeader>
            <CCardBody>
              <CForm onSubmit={saveCalendarPattern}>
                <CRow className="g-3">
                  <CCol md={12}>
                    <CFormSelect
                      disabled={!isCalEnabled}
                      value={calForm.academicYear}
                      onChange={(e) => setCalForm({ ...calForm, academicYear: e.target.value })}
                    >
                      <option value="">Academic Year</option>
                      <option>2026 - 2027</option>
                      <option>2025 - 2026</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={12}>
                    <CFormSelect
                      disabled={!isCalEnabled}
                      value={calForm.calendarPattern}
                      onChange={(e) => setCalForm({ ...calForm, calendarPattern: e.target.value })}
                    >
                      <option value="">Calendar Pattern</option>
                      <option>Day Order</option>
                      <option>Day</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={6}>
                    <CFormInput
                      disabled={!isCalEnabled}
                      placeholder="Min Day Order"
                      value={calForm.minDayOrder}
                      onChange={(e) => setCalForm({ ...calForm, minDayOrder: e.target.value })}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormSelect
                      disabled={!isCalEnabled}
                      value={calForm.day}
                      onChange={(e) => setCalForm({ ...calForm, day: e.target.value })}
                    >
                      <option value="">Select Day</option>
                      <option>Monday</option>
                      <option>Tuesday</option>
                    </CFormSelect>
                  </CCol>
                </CRow>

                <div className="text-end mt-3">
                  <CButton type="submit" size="sm" color="success" disabled={!isCalEnabled} className="text-white">
                    <CIcon icon={cilSave} className="me-1" /> Save
                  </CButton>{' '}
                  <CButton
                    size="sm"
                    color="secondary"
                    className="text-white"
                    disabled={!isCalEnabled}
                    onClick={() => {
                      resetCal()
                      setActiveForm(null)
                    }}
                  >
                    <CIcon icon={cilX} className="me-1" /> Cancel
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Tables */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between">
          Academic Year Details
          <CFormInput
            size="sm"
            placeholder="Search..."
            style={{ width: 200 }}
            value={aySearch}
            onChange={(e) => setAySearch(e.target.value)}
          />
        </CCardHeader>
        <CCardBody>
          <table className="table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Academic Year</th>
                <th>Pattern</th>
                <th>Start</th>
                <th>End</th>
                <th>Semesters</th>
              </tr>
            </thead>
            <tbody>
              {ayFiltered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <CFormCheck
                      type="radio"
                      name="ay"
                      checked={selectedAyId === r.id}
                      onChange={() => setSelectedAyId(r.id)}
                    />
                  </td>
                  <td>{r.academicYear}</td>
                  <td>{r.academicPattern}</td>
                  <td>{r.startDate}</td>
                  <td>{r.endDate}</td>
                  <td>{r.semesters}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CCardBody>
      </CCard>
    </>
  )
}

export default AcademicYearConfiguration
