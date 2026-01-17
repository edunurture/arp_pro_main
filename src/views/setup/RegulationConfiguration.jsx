
import React, { useMemo, useState } from 'react'
import ArpIconButton from 'src/components/common/ArpIconButton'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CRow,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilSave, cilX, cilSearch } from '@coreui/icons'

/**
 * RegulationConfiguration (from regulation.html)
 * - "Add New" dropdown activates either Batch form or Regulation form
 * - Only active form inputs are enabled
 * - Save (Regulation) adds a row to REGULATION DETAILS table
 * - Search filters table; View/Edit/Delete enabled only when a row is selected
 */
const RegulationConfiguration = () => {
  // 'BATCH' | 'REG' | null
  const [activeForm, setActiveForm] = useState(null)

  // Batch form state
  const [batchForm, setBatchForm] = useState({
    batchName: '',
    description: '',
  })

  // Regulation form state
  const [regForm, setRegForm] = useState({
    regulationCode: '',
    regulationYear: '',
    programmeCode: '',
    description: '',
  })

  // Table rows (sample row from HTML)
  const [rows, setRows] = useState([
    {
      id: 1,
      regulationCode: 'N26',
      regulationYear: '2026',
      programme: 'MCA',
      description: 'Admitted the AY 2026',
    },
  ])

  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const onDelete = () => {}


  const onEdit = () => {}


  const onView = () => {}


  const isBatchEnabled = activeForm === 'BATCH'
  const isRegEnabled = activeForm === 'REG'

  const resetBatch = () => setBatchForm({ batchName: '', description: '' })
  const resetReg = () =>
    setRegForm({ regulationCode: '', regulationYear: '', programmeCode: '', description: '' })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [rows, search])

  const onSaveBatch = (e) => {
    e.preventDefault()
    if (!isBatchEnabled) return
    // No batch table in the original HTML; keep as form-only for now.
    resetBatch()
    setActiveForm(null)
  }

  const onSaveRegulation = (e) => {
    e.preventDefault()
    if (!isRegEnabled) return

    const programme = regForm.programmeCode
      ? regForm.programmeCode.replace(/^\d+\-/, '')
      : ''
    const year = regForm.regulationYear || ''

    setRows((prev) => [
      {
        id: Date.now(),
        regulationCode: regForm.regulationCode || '',
        regulationYear: year,
        programme,
        description: regForm.description || '',
      },
      prev,
    ])

    resetReg()
    setActiveForm(null)
  }

  const selectedRow = rows.find((r) => r.id === selectedId) || null
  const actionDisabled = !selectedRow

  return (
    <>
      {/* Header */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <div className="fw-semibold">REGULATION SETUP</div>

          <CDropdown alignment="end">
            <CDropdownToggle size="sm" color="primary">
              <CIcon icon={cilPlus} className="me-1" />
              Add New
            </CDropdownToggle>
            <CDropdownMenu>
              <CDropdownItem as="button" type="button" onClick={() => setActiveForm('BATCH')}>
                Add Batch
              </CDropdownItem>
              <CDropdownItem as="button" type="button" onClick={() => setActiveForm('REG')}>
                Add Regulation
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </CCardHeader>
      </CCard>

      {/* Forms (two half-width cards like your HTML) */}
      <CRow className="g-3 mb-3">
        {/* Batch Configuration */}
        <CCol lg={6}>
          <CCard>
            <CCardHeader>
            <strong>Batch Configuration</strong>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={onSaveBatch}>
                <CRow className="g-3">
                  <CCol md={12}>
                    <CFormInput
                      label="Name of the Batch"
                      disabled={!isBatchEnabled}
                      value={batchForm.batchName}
                      onChange={(e) => setBatchForm({ batchForm, batchName: e.target.value })}
                    />
                  </CCol>

                  <CCol md={12}>
                    <CFormTextarea
                      label="Description"
                      rows={5}
                      disabled={!isBatchEnabled}
                      value={batchForm.description}
                      onChange={(e) => setBatchForm({ batchForm, description: e.target.value })}
                    />
                  </CCol>

                  <CCol md={12} className="d-flex justify-content-end gap-2">
                    <CButton size="sm" color="success" type="submit" disabled={!isBatchEnabled}>
                      <CIcon icon={cilSave} className="me-1" /> Save
                    </CButton>
                    <CButton
                      size="sm"
                      color="secondary"
                      type="button"
                      disabled={!isBatchEnabled}
                      onClick={() => {
                        resetBatch()
                        setActiveForm(null)
                      }}
                    >
                      <CIcon icon={cilX} className="me-1" /> Cancel
                    </CButton>
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>

        {/* REGULATION SETUP */}
        <CCol lg={6}>
          <CCard>
            <CCardHeader>
            <strong>Regulation Configuration</strong>
            </CCardHeader>
            <CCardBody>
              <CForm onSubmit={onSaveRegulation}>
                <CRow className="g-3">
                  <CCol md={12}>
                    <CFormInput
                      label="Regulation Code"
                      disabled={!isRegEnabled}
                      value={regForm.regulationCode}
                      onChange={(e) => setRegForm({ regForm, regulationCode: e.target.value })}
                    />
                  </CCol>

                  <CCol md={12}>
                    <CFormSelect
                      label="Year of Regulation"
                      disabled={!isRegEnabled}
                      value={regForm.regulationYear}
                      onChange={(e) => setRegForm({ regForm, regulationYear: e.target.value })}
                    >
                      <option value="">Year of Regulation</option>
                      <option value="2025 - 2026">2025 - 2026</option>
                      <option value="2026 - 2027">2026 - 2027</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={12}>
                    <CFormSelect
                      label="Programme Code"
                      disabled={!isRegEnabled}
                      value={regForm.programmeCode}
                      onChange={(e) => setRegForm({ regForm, programmeCode: e.target.value })}
                    >
                      <option value="">Select Programme Code</option>
                      <option value="26-MBA">26-MBA</option>
                      <option value="26-MCA">26-MCA</option>
                    </CFormSelect>
                  </CCol>

                  <CCol md={12}>
                    <CFormTextarea
                      label="Description"
                      rows={2}
                      disabled={!isRegEnabled}
                      value={regForm.description}
                      onChange={(e) => setRegForm({ regForm, description: e.target.value })}
                    />
                  </CCol>

                  <CCol md={12} className="d-flex justify-content-end gap-2">
                    <CButton size="sm" color="success" type="submit" disabled={!isRegEnabled}>
                      <CIcon icon={cilSave} className="me-1" /> Save
                    </CButton>
                    <CButton
                      size="sm"
                      color="secondary"
                      type="button"
                      disabled={!isRegEnabled}
                      onClick={() => {
                        resetReg()
                        setActiveForm(null)
                      }}
                    >
                      <CIcon icon={cilX} className="me-1" /> Cancel
                    </CButton>
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* REGULATION DETAILS */}
      <CCard className="mb-3">
        <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="fw-semibold">Regulation Details</div>

          <div className="d-flex align-items-center gap-2">
            <CFormInput
              size="sm"
              placeholder="Search."
              style={{ width: 220 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <CButton size="sm" color="info" variant="outline" disabled title="Search">
              <CIcon icon={cilSearch} />
            </CButton>
            <div className="d-flex gap-2">
              <ArpIconButton icon="view" color="primary" disabled={!selectedId} onClick={onView} title="View" />
              <ArpIconButton icon="edit" color="info" disabled={!selectedId} onClick={onEdit} title="Edit" />
              <ArpIconButton icon="delete" color="danger" disabled={!selectedId} onClick={onDelete} title="Delete" />
            </div>
</div>
        </CCardHeader>

        <CCardBody>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Select</th>
                  <th>Regulation Code</th>
                  <th>Year of Regulation</th>
                  <th>Programme</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <CFormCheck
                        type="radio"
                        name="reg_select"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                      />
                    </td>
                    <td>{r.regulationCode}</td>
                    <td>{r.regulationYear}</td>
                    <td>{r.programme}</td>
                    <td>{r.description}</td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-medium-emphasis py-4">
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CCardBody>
      </CCard>
    </>
  )
}

export default RegulationConfiguration