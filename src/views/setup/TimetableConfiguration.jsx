import React, { useMemo, useState } from 'react'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormCheck, CFormInput, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

/**
 * TimetableConfiguration.jsx (ARP CoreUI React Pro Standard) - v3
 * Row Action behavior:
 *  - ONLY one circle icon per row
 *  - Last row shows "+" (add)
 *  - Other rows show "delete" (trash)
 */

const createRow = (overrides = {}) => ({
  shiftId: '',
  shiftName: '',
  timeFrom: '',
  timeTo: '',
  nomenclature: '',
  isInterval: false,
  priority: '',
  ...overrides,
})

export default function TimetableConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [shiftRows, setShiftRows] = useState([createRow()])

  const [rows, setRows] = useState([
    { id: 1, timetableName: 'Morning Shift', shifts: 6, status: 'Active' },
    { id: 2, timetableName: 'Evening Shift', shifts: 4, status: 'Active' },
  ])

  const addRowBelow = (index) => {
    setShiftRows((prev) => {
      const next = [...prev]
      next.splice(index + 1, 0, createRow())
      return next
    })
  }

  const removeRowAt = (index) => {
    setShiftRows((prev) => {
      if (prev.length <= 1) return prev
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }

  const updateRow = (index, key, value) => {
    setShiftRows((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [key]: value }
      return next
    })
  }

  const onAddNew = () => {
    setIsEdit(true)
    setSelectedId(null)
    setShiftRows([createRow()])
  }

  const onCancel = () => {
    setIsEdit(false)
    setShiftRows([createRow()])
  }

  const onSave = (e) => {
    e.preventDefault()
    if (!isEdit) return
    const next = {
      id: Date.now(),
      timetableName: `Timetable ${Date.now()}`,
      shifts: shiftRows.length,
      status: 'Active',
    }
    setRows((prev) => [next, ...prev])
    setSelectedId(next.id)
    setIsEdit(false)
    setShiftRows([createRow()])
  }

  const selectedRow = rows.find((r) => String(r.id) === String(selectedId)) || null

  const onView = () => selectedRow && alert(`Timetable: ${selectedRow.timetableName}`)
  const onEdit = () => selectedRow && setIsEdit(true)
  const onDelete = () => {
    if (!selectedRow) return
    setRows((prev) => prev.filter((r) => String(r.id) !== String(selectedRow.id)))
    setSelectedId(null)
  }

  const columns = useMemo(
    () => [
      { key: 'timetableName', label: 'Timetable Name', sortable: true },
      { key: 'shifts', label: 'No. of Shifts', sortable: true, width: 140, align: 'center', sortType: 'number' },
      { key: 'status', label: 'Status', sortable: true, width: 120, align: 'center' },
    ],
    [],
  )

  const headerActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>TIMETABLE CONFIGURATION</strong>
            <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Shift Master</strong></CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSave}>
              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: 68, textAlign: 'center' }}>Action</th>
                      <th>Shift Id</th>
                      <th>Shift Name</th>
                      <th>Time From</th>
                      <th>Time To</th>
                      <th>Nomenclature</th>
                      <th>Is Interval</th>
                      <th>Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftRows.map((r, idx) => {
                      const isLastRow = idx === shiftRows.length - 1
                      const icon = isLastRow ? 'add' : 'delete'
                      const color = isLastRow ? 'success' : 'danger'
                      const title = isLastRow ? 'Add Row' : 'Delete Row'
                      const onClick = isLastRow ? () => addRowBelow(idx) : () => removeRowAt(idx)

                      return (
                        <tr key={idx}>
                          <td className="text-center">
                            <ArpIconButton icon={icon} color={color} title={title} onClick={onClick} disabled={!isEdit || (!isLastRow && shiftRows.length <= 1)} />
                          </td>
                          <td><CFormInput value={r.shiftId} onChange={(e)=>updateRow(idx,'shiftId',e.target.value)} disabled={!isEdit}/></td>
                          <td><CFormInput value={r.shiftName} onChange={(e)=>updateRow(idx,'shiftName',e.target.value)} disabled={!isEdit}/></td>
                          <td><CFormInput type="time" value={r.timeFrom} onChange={(e)=>updateRow(idx,'timeFrom',e.target.value)} disabled={!isEdit}/></td>
                          <td><CFormInput type="time" value={r.timeTo} onChange={(e)=>updateRow(idx,'timeTo',e.target.value)} disabled={!isEdit}/></td>
                          <td>
                            <CFormSelect value={r.nomenclature} onChange={(e)=>updateRow(idx,'nomenclature',e.target.value)} disabled={!isEdit}>
                              <option value="">Select</option>
                              <option value="Lecture">Lecture</option>
                              <option value="Lab">Lab</option>
                              <option value="Break">Break</option>
                            </CFormSelect>
                          </td>
                          <td className="text-center"><CFormCheck checked={!!r.isInterval} onChange={(e)=>updateRow(idx,'isInterval',e.target.checked)} disabled={!isEdit}/></td>
                          <td><CFormInput type="number" value={r.priority} onChange={(e)=>updateRow(idx,'priority',e.target.value)} disabled={!isEdit}/></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <ArpButton label="Save" icon="save" color="success" type="submit" disabled={!isEdit}/>
                <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel}/>
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        <ArpDataTable
          title="TIMETABLE LIST"
          rows={rows}
          columns={columns}
          headerActions={headerActions}
          selection={{ type:'radio', selected:selectedId, onChange:(v)=>setSelectedId(v), key:'id', headerLabel:'Select', width:60, name:'timetableSelect' }}
          pageSizeOptions={[5,10,20,50]}
          defaultPageSize={10}
          searchable
          rowKey="id"
        />
      </CCol>
    </CRow>
  )
}
