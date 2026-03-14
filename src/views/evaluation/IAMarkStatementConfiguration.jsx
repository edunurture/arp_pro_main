import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
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

import api from '../../services/apiClient'
import { ArpButton, useArpToast } from '../../components/common'
import { getIAMarkStatementConfig, saveIAMarkStatementConfig } from '../../services/iaWorkflowService'

const DEFAULT_COLUMNS = [
  ['serial_no', 'S.No.', 1, true],
  ['register_no', 'Register No.', 2, true],
  ['student_name', 'Student Name', 3, true],
  ['internal_total', 'Internal Total', 90, true],
  ['result', 'Result', 91, true],
  ['remarks', 'Remarks', 92, true],
]

const buildDefaultColumns = (availableComponentColumns = []) => [
  ...DEFAULT_COLUMNS.slice(0, 3),
  ...availableComponentColumns.map((column, index) => [
    column.columnKey,
    column.columnLabel,
    10 + index,
    true,
  ]),
  ...DEFAULT_COLUMNS.slice(3),
]

const buildDefaultConfig = (institutionId = '', availableComponentColumns = []) => ({
  institutionId,
  configName: 'Default Internal Assessment Mark Statement',
  roundingRule: 'DECIMAL',
  decimalPlaces: 2,
  absentIndicator: 'AB',
  signatureTitle: 'Controller of Examination',
  signatureName: '',
  showPageNumber: true,
  pageNumberAlignment: 'CENTER',
  availableComponentColumns,
  columns: buildDefaultColumns(availableComponentColumns).map(([columnKey, columnLabel, displayOrder, isEnabled]) => ({
    columnKey,
    columnLabel,
    displayOrder,
    isEnabled,
  })),
})

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const normalizeConfig = (config = {}, institutionId = '') => {
  const availableComponentColumns = Array.isArray(config.availableComponentColumns) ? config.availableComponentColumns : []
  const base = buildDefaultConfig(institutionId, availableComponentColumns)
  const byKey = new Map((Array.isArray(config.columns) ? config.columns : []).map((row) => [String(row.columnKey || '').trim().toLowerCase(), row]))
  return {
    ...base,
    ...config,
    institutionId: config.institutionId || institutionId || '',
    columns: buildDefaultColumns(availableComponentColumns).map(([columnKey, columnLabel, displayOrder, isEnabled]) => {
      const row = byKey.get(columnKey.toLowerCase()) || {}
      return {
        columnKey,
        columnLabel: row.columnLabel || columnLabel,
        displayOrder: Number.isFinite(Number(row.displayOrder)) ? Number(row.displayOrder) : displayOrder,
        isEnabled: row.isEnabled === undefined ? isEnabled : Boolean(row.isEnabled),
      }
    }).sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder)),
  }
}

export default function IAMarkStatementConfiguration() {
  const toast = useArpToast()
  const [saving, setSaving] = useState(false)
  const [institutions, setInstitutions] = useState([])
  const [institutionId, setInstitutionId] = useState('')
  const [config, setConfig] = useState(buildDefaultConfig())

  const showToast = (type, message) => toast.show({ type, message, autohide: type === 'success', delay: 4500 })

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/api/setup/institution')
        const rows = unwrapList(res)
        setInstitutions(rows)
        if (rows.length > 0) setInstitutionId(String(rows[0].id))
      } catch {
        showToast('danger', 'Failed to load institutions.')
      }
    })()
  }, [])

  useEffect(() => {
    if (!institutionId) return
    ;(async () => {
      try {
        const data = await getIAMarkStatementConfig({ institutionId })
        setConfig(normalizeConfig(data || {}, institutionId))
      } catch {
        setConfig(buildDefaultConfig(institutionId))
        showToast('warning', 'Using default mark statement configuration.')
      }
    })()
  }, [institutionId])

  const sortedColumns = useMemo(
    () => [...(Array.isArray(config.columns) ? config.columns : [])].sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder)),
    [config.columns],
  )

  const updateColumn = (columnKey, patch) => {
    setConfig((prev) => ({
      ...prev,
      columns: (prev.columns || []).map((column) =>
        String(column.columnKey) === String(columnKey) ? { ...column, ...patch } : column,
      ),
    }))
  }

  const onSave = async () => {
    if (!institutionId) {
      showToast('danger', 'Select institution.')
      return
    }
    setSaving(true)
    try {
      const payload = normalizeConfig({ ...config, institutionId }, institutionId)
      const saved = await saveIAMarkStatementConfig(payload)
      setConfig(normalizeConfig(saved || payload, institutionId))
      showToast('success', 'Mark statement configuration saved.')
    } catch {
      showToast('danger', 'Unable to save mark statement configuration.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader><strong>Internal Assessment Mark Statement Configuration</strong></CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormLabel>Institution</CFormLabel>
                <CFormSelect value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
                  <option value="">Select</option>
                  {institutions.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
                </CFormSelect>
              </CCol>
              <CCol md={3}>
                <CFormLabel>Configuration Name</CFormLabel>
                <CFormInput value={config.configName || ''} onChange={(e) => setConfig((prev) => ({ ...prev, configName: e.target.value }))} />
              </CCol>
              <CCol md={2}>
                <CFormLabel>Rounding Rule</CFormLabel>
                <CFormSelect value={config.roundingRule || 'DECIMAL'} onChange={(e) => setConfig((prev) => ({ ...prev, roundingRule: e.target.value }))}>
                  <option value="DECIMAL">Decimal</option>
                  <option value="ROUND">Rounded</option>
                  <option value="INTEGER">Integer Only</option>
                </CFormSelect>
              </CCol>
              <CCol md={2}>
                <CFormLabel>Decimal Places</CFormLabel>
                <CFormInput type="number" min="0" max="4" value={config.decimalPlaces ?? 2} onChange={(e) => setConfig((prev) => ({ ...prev, decimalPlaces: e.target.value }))} />
              </CCol>
              <CCol md={2}>
                <CFormLabel>Absent Indicator</CFormLabel>
                <CFormInput value={config.absentIndicator || ''} onChange={(e) => setConfig((prev) => ({ ...prev, absentIndicator: e.target.value }))} />
              </CCol>

              <CCol md={4}>
                <CFormLabel>Signature Title</CFormLabel>
                <CFormInput value={config.signatureTitle || ''} onChange={(e) => setConfig((prev) => ({ ...prev, signatureTitle: e.target.value }))} />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Signature Name</CFormLabel>
                <CFormInput value={config.signatureName || ''} onChange={(e) => setConfig((prev) => ({ ...prev, signatureName: e.target.value }))} />
              </CCol>
              <CCol md={2} className="d-flex align-items-end">
                <CFormCheck label="Show Page Number" checked={Boolean(config.showPageNumber)} onChange={(e) => setConfig((prev) => ({ ...prev, showPageNumber: e.target.checked }))} />
              </CCol>
              <CCol md={2}>
                <CFormLabel>Page Number Alignment</CFormLabel>
                <CFormSelect value={config.pageNumberAlignment || 'CENTER'} onChange={(e) => setConfig((prev) => ({ ...prev, pageNumberAlignment: e.target.value }))}>
                  <option value="CENTER">Center</option>
                </CFormSelect>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Column Configuration</strong>
            <ArpButton label={saving ? 'Saving...' : 'Save Configuration'} icon="save" color="primary" onClick={onSave} disabled={saving || !institutionId} />
          </CCardHeader>
          <CCardBody>
            <CTable bordered hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{ width: 90 }}>Enable</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: 200 }}>Column Key</CTableHeaderCell>
                  <CTableHeaderCell>Column Label</CTableHeaderCell>
                  <CTableHeaderCell style={{ width: 120 }}>Display Order</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {sortedColumns.map((column) => (
                  <CTableRow key={column.columnKey}>
                    <CTableDataCell>
                      <CFormCheck checked={Boolean(column.isEnabled)} onChange={(e) => updateColumn(column.columnKey, { isEnabled: e.target.checked })} />
                    </CTableDataCell>
                    <CTableDataCell>{column.columnKey}</CTableDataCell>
                    <CTableDataCell>
                      <CFormInput value={column.columnLabel || ''} onChange={(e) => updateColumn(column.columnKey, { columnLabel: e.target.value })} />
                    </CTableDataCell>
                    <CTableDataCell>
                      <CFormInput type="number" min="1" max="99" value={column.displayOrder} onChange={(e) => updateColumn(column.columnKey, { displayOrder: e.target.value })} />
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}
