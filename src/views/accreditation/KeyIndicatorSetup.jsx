import React, { useMemo, useRef, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpDataTable, ArpIconButton } from '../../components/common'

const MANUAL_IDS = ['MAN001', 'MAN002', 'MAN003']
const INST_CATEGORIES = [
  'University',
  'Arts & Science College',
  'Engineering College',
  'Health Science Institutions',
  'Deemed to be University',
  'Polytechnic',
  'ITI',
  'School',
  'Others',
]
const CRITERIA_NUMBERS = ['C001', 'C002', 'C003']

const initialForm = {
  manualId: '',
  institutionCategory: '',
  criteriaNo: '',
  keyIndicator: '',
  kiDescription: '',
  totalMetrics: '',
  totalWeightages: '',
  totalMarks: '',
}

const KeyIndicatorSetup = () => {
  const uploadRef = useRef(null)
  const tableRef = useRef(null)

  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [form, setForm] = useState(initialForm)

  const [rows, setRows] = useState([
    { id: 'C001', criteriaNo: 'C001', name: 'Teaching Learning', kis: 5, qlms: 3, qnms: 2, totalWeightage: 100 },
    { id: 'C002', criteriaNo: 'C002', name: 'Research', kis: 4, qlms: 2, qnms: 2, totalWeightage: 80 },
    { id: 'C003', criteriaNo: 'C003', name: 'Extension', kis: 3, qlms: 1, qnms: 2, totalWeightage: 60 },
  ])

  const columns = useMemo(
    () => [
      { key: 'criteriaNo', label: 'Criteria No', sortable: true, width: 120, align: 'center' },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'kis', label: 'No. of KIs', sortable: true, width: 120, align: 'center', sortType: 'number' },
      { key: 'qlms', label: 'No. of QLMs', sortable: true, width: 120, align: 'center', sortType: 'number' },
      { key: 'qnms', label: 'No. of QNMs', sortable: true, width: 120, align: 'center', sortType: 'number' },
      { key: 'totalWeightage', label: 'Total Weightage', sortable: true, width: 160, align: 'center', sortType: 'number' },
    ],
    [],
  )

  const setField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }))

  const onAddNew = () => {
    setIsEdit(true)
    setSelectedId(null)
    setForm(initialForm)
  }

  const onCancel = () => {
    setForm(initialForm)
    setIsEdit(false)
  }

  const onSave = (e) => {
    e.preventDefault()
    setIsEdit(false)
  }

  const tableActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="add" color="success" title="Add" onClick={onAddNew} />
      <ArpIconButton icon="edit" color="info" title="Edit" disabled={!selectedId} onClick={() => setIsEdit(true)} />
      <ArpIconButton icon="delete" color="danger" title="Delete" disabled={!selectedId} />
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>KEY INDICATOR SETUP</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
              <ArpButton label="Upload" icon="upload" color="info" />
              <ArpButton label="Download Template" icon="download" color="danger" />
            </div>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>ADD KEY INDICATORS</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Choose Manual ID</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.manualId} onChange={setField('manualId')} disabled={!isEdit}>
                    <option value="">Select</option>
                    {MANUAL_IDS.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        <div ref={tableRef}>
          <ArpDataTable
            title="CRITERIA AND KEY INDICATORS DETAILS"
            rows={rows}
            columns={columns}
            headerActions={tableActions}
            selection={{
              type: 'radio',
              selected: selectedId,
              onChange: (value) => setSelectedId(value),
              key: 'id',
              name: 'kiRow',
            }}
            searchable
            rowKey="id"
          />
        </div>
      </CCol>
    </CRow>
  )
}

export default KeyIndicatorSetup
