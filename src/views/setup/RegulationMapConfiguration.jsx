import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { CCard, CCardBody, CCardHeader, CCol, CForm, CFormLabel, CFormSelect, CRow, CSpinner } from '@coreui/react-pro'

import { ArpButton, ArpIconButton, useArpToast } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'

const initialForm = {
  academicYearId: '',
  programmeId: '',
  batchId: '',
  regulationId: '',
}

const unwrapList = (res) => res?.data?.data ?? res?.data ?? []

const extractYearStart = (value) => {
  const match = String(value ?? '').trim().match(/(19|20)\d{2}/)
  return match ? Number(match[0]) : null
}

const buildAcademicYearLabel = (startYear) => `${startYear} - ${startYear + 1}`

const deriveBatchCoverage = ({ batchName, totalSemesters, academicYears }) => {
  const selectedAcademicYear = (Array.isArray(academicYears) ? academicYears : [])[0] || null
  return deriveAcademicYearCoverage({ batchName, totalSemesters, selectedAcademicYear })
}

const deriveAcademicYearCoverage = ({ batchName, totalSemesters, selectedAcademicYear }) => {
  const batchStartYear = extractYearStart(batchName)
  const academicYearStart = extractYearStart(selectedAcademicYear?.academicYear)
  const maxSemesters = Number(totalSemesters)

  if (!batchStartYear) return { rows: [], error: 'Unable to derive semester plan from Admission Batch' }
  if (!academicYearStart) return { rows: [], error: 'Select Academic Year' }
  if (!Number.isFinite(maxSemesters) || maxSemesters < 1) return { rows: [], error: 'Programme total semesters is not configured' }

  const rows = []
  const oddSemester = (academicYearStart - batchStartYear) * 2 + 1
  const evenSemester = oddSemester + 1

  if (selectedAcademicYear?.oddAcademicYearId && oddSemester >= 1 && oddSemester <= maxSemesters) {
    rows.push({ semester: oddSemester, academicYear: selectedAcademicYear.academicYear, semesterCategory: 'ODD' })
  }
  if (selectedAcademicYear?.evenAcademicYearId && evenSemester >= 1 && evenSemester <= maxSemesters) {
    rows.push({ semester: evenSemester, academicYear: selectedAcademicYear.academicYear, semesterCategory: 'EVEN' })
  }

  if (!rows.length) return { rows: [], error: 'Selected Academic Year does not align with the Admission Batch for this programme' }
  return { rows, error: '' }
}

export default function RegulationMapConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  const [institutionId, setInstitutionId] = useState('')
  const [form, setForm] = useState(initialForm)

  const [academicYears, setAcademicYears] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [batches, setBatches] = useState([])
  const [regulations, setRegulations] = useState([])
  const [rows, setRows] = useState([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useArpToast()

  const selectedProgramme = useMemo(
    () => programmes.find((x) => String(x.id) === String(form.programmeId)) || null,
    [programmes, form.programmeId],
  )
  const selectedBatch = useMemo(
    () => batches.find((x) => String(x.id) === String(form.batchId)) || null,
    [batches, form.batchId],
  )
  const selectedRow = useMemo(
    () => rows.find((row) => String(row.id) === String(selectedId)) || null,
    [rows, selectedId],
  )
  const selectedAcademicYear = useMemo(
    () => academicYears.find((row) => String(row.id) === String(form.academicYearId)) || null,
    [academicYears, form.academicYearId],
  )

  const derivedCoverage = useMemo(
    () =>
      deriveBatchCoverage({
        batchName: selectedBatch?.batchName,
        totalSemesters: selectedProgramme?.totalSemesters,
        academicYears: selectedAcademicYear ? [selectedAcademicYear] : [],
      }),
    [selectedBatch, selectedProgramme, selectedAcademicYear],
  )

  const applicableRegulationMeta = useMemo(() => {
    const batchStartYear = extractYearStart(selectedBatch?.batchName)
    if (!batchStartYear || !form.programmeId) return null
    const options = regulations
      .filter((regulation) => String(regulation.programmeId) === String(form.programmeId) && regulation.isActive !== false)
      .filter((regulation) => Number.isFinite(Number(regulation.regulationYear)))
      .sort((left, right) => Number(left.regulationYear) - Number(right.regulationYear))
    if (!options.length) return null

    let applicable = null
    options.forEach((regulation) => {
      if (Number(regulation.regulationYear) <= batchStartYear) applicable = regulation
    })
    if (!applicable) applicable = options[0]
    return {
      batchStartYear,
      applicable,
      isSelected:
        applicable && form.regulationId ? String(applicable.id) === String(form.regulationId) : false,
    }
  }, [selectedBatch, regulations, form.programmeId, form.regulationId])

  const showToast = (type, message) => {
    toast.show({
      type,
      message,
      autohide: type === 'success',
      delay: 3500,
    })
  }

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const loadInstitutionId = async () => {
    const res = await axios.get('/api/setup/institution')
    const list = unwrapList(res)
    const first = Array.isArray(list) ? list[0] : null
    return first?.id || ''
  }

  const loadAcademicYears = async (instId) => {
    const res = await axios.get('/api/setup/academic-year', {
      headers: instId ? { 'x-institution-id': instId } : undefined,
      params: { view: 'annual' },
    })
    setAcademicYears(Array.isArray(unwrapList(res)) ? unwrapList(res) : [])
  }

  const loadProgrammes = async (instId) => {
    const res = await axios.get('/api/setup/programme', {
      params: instId ? { institutionId: instId } : undefined,
    })
    setProgrammes(Array.isArray(unwrapList(res)) ? unwrapList(res) : [])
  }

  const loadBatches = async (instId) => {
    const res = await axios.get('/api/setup/batch', { params: instId ? { institutionId: instId } : undefined })
    setBatches(Array.isArray(unwrapList(res)) ? unwrapList(res) : [])
  }

  const loadRegulations = async (instId) => {
    const res = await axios.get('/api/setup/regulation', {
      params: instId ? { institutionId: instId } : undefined,
    })
    setRegulations(Array.isArray(unwrapList(res)) ? unwrapList(res) : [])
  }

  const loadMappings = async (params = {}) => {
    setLoading(true)
    try {
      const res = await axios.get('/api/setup/regulation-map', { params })
      const list = unwrapList(res)
      setRows(Array.isArray(list) ? list : [])
    } catch (e) {
      showToast('danger', e?.response?.data?.error || e.message || 'Failed to load mappings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const instId = await loadInstitutionId()
        setInstitutionId(instId)
        await Promise.all([
          loadAcademicYears(instId),
          loadProgrammes(instId),
          loadBatches(instId),
          loadRegulations(instId),
        ])
        await loadMappings(instId ? { institutionId: instId } : {})
      } catch (e) {
        showToast('danger', e?.response?.data?.error || e.message || 'Failed to initialize')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const onAddNew = () => {
    setIsEdit(true)
    setSelectedId(null)
    setForm(initialForm)
  }

  const onCancel = () => {
    setIsEdit(false)
    setSelectedId(null)
    setForm(initialForm)
    if (institutionId) loadMappings({ institutionId })
  }

  const onSearch = async () => {
    const params = {
      ...(institutionId ? { institutionId } : {}),
      ...(selectedAcademicYear
        ? {
            academicYearIds: [selectedAcademicYear.oddAcademicYearId, selectedAcademicYear.evenAcademicYearId]
              .filter(Boolean)
              .join(','),
          }
        : {}),
      ...(form.programmeId ? { programmeId: form.programmeId } : {}),
      ...(form.batchId ? { batchId: form.batchId } : {}),
      ...(form.regulationId ? { regulationId: form.regulationId } : {}),
    }
    await loadMappings(params)
  }

  const onSave = async (override = false) => {
    if (!institutionId) return showToast('danger', 'Institution is required')
    if (!form.academicYearId) return showToast('danger', 'Academic Year is required')
    if (!form.programmeId) return showToast('danger', 'Programme is required')
    if (!form.batchId) return showToast('danger', 'Admission Batch is required')
    if (!form.regulationId) return showToast('danger', 'Regulation is required')
    if (derivedCoverage.error) return showToast('danger', derivedCoverage.error)

    setSaving(true)
    try {
      const res = await axios.post('/api/setup/regulation-map', {
        institutionId,
        academicYearId: form.academicYearId,
        programmeId: form.programmeId,
        batchId: form.batchId,
        regulationId: form.regulationId,
        override,
      })

      const mapped = res?.data?.mappedSemesters || []
      const message = override ? 'Batch regulation mapping updated with override' : 'Batch regulation mapping saved successfully'
      showToast('success', mapped.length ? `${message} (${mapped.length} semesters)` : message)
      setIsEdit(false)
      setSelectedId(null)
      setForm(initialForm)
      await loadMappings(institutionId ? { institutionId } : {})
    } catch (e) {
      const status = e?.response?.status
      const msg = e?.response?.data?.error || e.message || 'Save failed'
      if (status === 409) {
        const blocked = e?.response?.data?.blockedSemesters
        const expectedRegulationCode = e?.response?.data?.expectedRegulationCode
        const expectedRegulationYear = e?.response?.data?.expectedRegulationYear
        const extra = Array.isArray(blocked) && blocked.length
          ? `\nBlocked Semesters: ${blocked.map((n) => `Sem-${n}`).join(', ')}`
          : expectedRegulationCode
            ? `\nExpected Regulation: ${expectedRegulationCode} (${expectedRegulationYear ?? '-'})`
            : ''
        const ok = window.confirm(`${msg}${extra}\n\nDo you want to override and force update?`)
        if (ok) return await onSave(true)
        showToast('warning', msg)
        return
      }
      showToast('danger', msg)
    } finally {
      setSaving(false)
    }
  }

  const onView = () => {
    if (!selectedRow) return
    setForm({
      academicYearId:
        academicYears.find((row) => String(row.academicYear || '') === String(selectedRow.academicYears?.[0] || '').replace(/\s+\((ODD|EVEN)\)\s*$/, ''))?.id || '',
      programmeId: selectedRow.programmeId || '',
      batchId: selectedRow.batchId || '',
      regulationId: selectedRow.regulationId || '',
    })
    setIsEdit(false)
  }

  const onEdit = () => {
    if (!selectedRow) return
    setForm({
      academicYearId:
        academicYears.find((row) => String(row.academicYear || '') === String(selectedRow.academicYears?.[0] || '').replace(/\s+\((ODD|EVEN)\)\s*$/, ''))?.id || '',
      programmeId: selectedRow.programmeId || '',
      batchId: selectedRow.batchId || '',
      regulationId: selectedRow.regulationId || '',
    })
    setIsEdit(true)
  }

  const onDelete = async (override = false) => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to unmap this regulation from the selected batch?')
    if (!ok) return

    setSaving(true)
    try {
      await axios.delete(`/api/setup/regulation-map/${selectedRow.id}`, { params: { override } })
      showToast('success', override ? 'Batch regulation unmapped with override' : 'Batch regulation unmapped successfully')
      setSelectedId(null)
      setForm(initialForm)
      await loadMappings(institutionId ? { institutionId } : {})
    } catch (e) {
      const status = e?.response?.status
      const msg = e?.response?.data?.error || e.message || 'Delete failed'
      if (status === 409) {
        const ok2 = window.confirm(`${msg}\n\nDo you want to override and force unmap?`)
        if (ok2) return await onDelete(true)
        showToast('warning', msg)
        return
      }
      showToast('danger', msg)
    } finally {
      setSaving(false)
    }
  }

  const columns = useMemo(
    () => [
      { key: 'regulationCode', label: 'Regulation Code', sortable: true, width: 140, align: 'center' },
      { key: 'programmeCode', label: 'Programme Code', sortable: true, width: 140, align: 'center' },
      { key: 'programme', label: 'Programme', sortable: true, width: 220 },
      { key: 'batch', label: 'Admission Batch', sortable: true, width: 160, align: 'center' },
      {
        key: 'mappedSemesters',
        label: 'Mapped Semesters',
        sortable: false,
        render: (row) => (Array.isArray(row?.mappedSemesters) ? row.mappedSemesters.map((semester) => `Sem-${semester}`).join(', ') : '-'),
      },
      {
        key: 'academicYears',
        label: 'Academic Year Terms',
        sortable: false,
        render: (row) => (Array.isArray(row?.academicYears) ? row.academicYears.join(', ') : '-'),
      },
      { key: 'status', label: 'Status', sortable: true, width: 120, align: 'center' },
    ],
    [],
  )

  const headerActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View" onClick={onView} disabled={!selectedId || saving} />
      <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEdit} disabled={!selectedId || saving} />
      <ArpIconButton icon="delete" color="danger" title="Unmap" onClick={() => onDelete(false)} disabled={!selectedId || saving} />
    </div>
  )

  const formDisabled = !isEdit || saving || loading

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>REGULATIONS MAP CONFIGURATIONS</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} title="Add New" disabled={saving || loading} />
            </div>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Map Regulation to Admitted Batch</strong>
            {(loading || saving) && (
              <div className="d-flex align-items-center gap-2">
                <CSpinner size="sm" />
                <span className="text-muted">{saving ? 'Saving...' : 'Loading...'}</span>
              </div>
            )}
          </CCardHeader>

          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYearId} onChange={onChange('academicYearId')} disabled={formDisabled}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map((academicYear) => (
                      <option key={academicYear.id} value={academicYear.id}>
                        {academicYear.academicYearLabel || academicYear.academicYear}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeId} onChange={onChange('programmeId')} disabled={formDisabled}>
                    <option value="">Select Programme</option>
                    {programmes.map((programme) => (
                      <option key={programme.id} value={programme.id}>
                        {programme.programmeCode} - {programme.programmeName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Admission Batch</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.batchId} onChange={onChange('batchId')} disabled={formDisabled}>
                    <option value="">Select Admission Batch</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.batchName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Regulation Code</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={form.regulationId} onChange={onChange('regulationId')} disabled={formDisabled}>
                    <option value="">Select Regulation Code</option>
                    {regulations
                      .filter((regulation) => (form.programmeId ? String(regulation.programmeId) === String(form.programmeId) : true))
                      .map((regulation) => (
                        <option key={regulation.id} value={regulation.id}>
                          {regulation.regulationCode}
                        </option>
                      ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Applicable Regulation</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={applicableRegulationMeta?.applicable?.id || ''} disabled>
                    <option value="">
                      {applicableRegulationMeta?.applicable
                        ? `${applicableRegulationMeta.applicable.regulationCode} (${applicableRegulationMeta.applicable.regulationYear})`
                        : 'Select Programme and Admission Batch'}
                    </option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Derived Semester Coverage</CFormLabel>
                </CCol>
                <CCol md={9}>
                  <CFormSelect value="" disabled>
                    <option value="">
                      {derivedCoverage.error ||
                        (derivedCoverage.rows.length
                          ? derivedCoverage.rows.map((row) => `Sem-${row.semester}`).join(', ')
                          : 'Select Programme and Admission Batch')}
                    </option>
                  </CFormSelect>
                </CCol>

                {derivedCoverage.rows.length ? (
                  <CCol xs={12}>
                    <div className="text-info">
                      Batch-wise regulation scope: {derivedCoverage.rows.map((row) => `Sem-${row.semester} / ${row.academicYear} (${row.semesterCategory})`).join(', ')}.
                    </div>
                  </CCol>
                ) : null}

                {applicableRegulationMeta?.applicable ? (
                  <CCol xs={12}>
                    <div className={applicableRegulationMeta.isSelected ? 'text-success' : 'text-warning'}>
                      Admission year {applicableRegulationMeta.batchStartYear} is expected to follow Regulation{' '}
                      {applicableRegulationMeta.applicable.regulationCode} ({applicableRegulationMeta.applicable.regulationYear}).
                      {!applicableRegulationMeta.isSelected
                        ? ' Override only for arrears, withdrawal, lateral entry, credit transfer, or approved academic exceptions.'
                        : ''}
                    </div>
                  </CCol>
                ) : null}

                {derivedCoverage.error ? (
                  <CCol xs={12}>
                    <div className="text-danger">{derivedCoverage.error}</div>
                  </CCol>
                ) : null}

                <CCol xs={12}>
                  <div className="text-muted">
                    A regulation is mapped batch-wise for the full curriculum span of the admitted students. Any downstream curriculum operation should apply only to this mapped batch scope.
                  </div>
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Search" icon="search" color="primary" type="button" onClick={onSearch} disabled={saving || loading} title="Search" />
                  <ArpButton label="Save" icon="save" color="success" type="button" onClick={() => onSave(false)} disabled={!isEdit || saving || loading} title="Save" />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} disabled={saving || loading} title="Cancel" />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        <ArpDataTable
          title="STATUS OF MAP REGULATION"
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
            name: 'mapRegSelect',
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          defaultPageSize={10}
          searchable
          searchPlaceholder="Search..."
          rowKey="id"
        />
      </CCol>
    </CRow>
  )
}
