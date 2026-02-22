import React, { useEffect, useMemo, useState } from 'react'
import { CAlert, CBadge, CCard, CCardBody, CCardHeader, CCol, CForm, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import api from '../../services/apiClient'

const initialScope = {
  academicYearId: '',
  semesterCategory: '',
  chosenSemester: '',
  programmeId: '',
}

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const normalizeCodeId = (v) => String(v || '').trim()

export default function AssessmentSetupConfiguration() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [mapStatus, setMapStatus] = useState('Not Searched')
  const [mappingLocked, setMappingLocked] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState('')
  const [editingRowId, setEditingRowId] = useState('')

  const [institutions, setInstitutions] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [assessmentCodes, setAssessmentCodes] = useState([])

  const [institutionId, setInstitutionId] = useState('')
  const [scope, setScope] = useState(initialScope)
  const [rows, setRows] = useState([])
  const [originalRows, setOriginalRows] = useState([])

  const showToast = (type, message) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4500)
  }

  const computeMapStatus = (list) => {
    if (!Array.isArray(list) || list.length === 0) return 'No Courses Found'
    const mapped = list.filter((r) => String(r.selectedCIAComputationId || r.ciaComputationId || '').trim()).length
    if (mapped === 0) return 'Not Mapped'
    if (mapped === list.length) return 'Map Done'
    return `Partially Mapped (${mapped}/${list.length})`
  }

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/api/setup/institution')
      const list = unwrapList(res)
      setInstitutions(list)
      if (!institutionId && list.length > 0) setInstitutionId(list[0].id)
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to load institutions')
    }
  }

  const loadAcademicYears = async (instId) => {
    if (!instId) return setAcademicYears([])
    try {
      const res = await api.get('/api/setup/academic-year', {
        headers: { 'x-institution-id': instId },
      })
      setAcademicYears(unwrapList(res))
    } catch {
      setAcademicYears([])
    }
  }

  const loadProgrammes = async (instId) => {
    if (!instId) return setProgrammes([])
    try {
      const res = await api.get('/api/setup/programme')
      const list = unwrapList(res).filter((x) => String(x.institutionId) === String(instId))
      setProgrammes(list)
    } catch {
      setProgrammes([])
    }
  }

  const loadAssessmentCodes = async (instId) => {
    if (!instId) return setAssessmentCodes([])
    try {
      const res = await api.get('/api/setup/assessment-setup/codes', { params: { institutionId: instId } })
      setAssessmentCodes(unwrapList(res))
    } catch {
      setAssessmentCodes([])
    }
  }

  const loadMappings = async (opts = {}) => {
    const { lockAfterLoad = false } = opts
    if (!institutionId || !scope.academicYearId || !scope.semesterCategory || !scope.chosenSemester || !scope.programmeId) {
      showToast('danger', 'Select Institution, Academic Year, Semester Category, Choose Semester and Programme.')
      return
    }
    setLoading(true)
    try {
      const res = await api.get('/api/setup/assessment-setup', {
        params: {
          institutionId,
          academicYearId: scope.academicYearId,
          semesterCategory: scope.semesterCategory,
          chosenSemester: scope.chosenSemester,
          programmeId: scope.programmeId,
        },
      })
      const list = unwrapList(res).map((r) => ({
        ...r,
        selectedCIAComputationId: r.ciaComputationId || '',
      }))
      setRows(list)
      setOriginalRows(list)
      setMapStatus(computeMapStatus(list))
      setMappingLocked(lockAfterLoad)
      setSelectedRowId('')
      setEditingRowId('')
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to load course mappings')
      setRows([])
      setOriginalRows([])
      setMapStatus('Search Failed')
      setMappingLocked(false)
      setSelectedRowId('')
      setEditingRowId('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstitutions()
  }, [])

  useEffect(() => {
    setScope(initialScope)
    setRows([])
    setOriginalRows([])
    setMapStatus('Not Searched')
    setMappingLocked(false)
    setSelectedRowId('')
    setEditingRowId('')
    loadAcademicYears(institutionId)
    loadProgrammes(institutionId)
    loadAssessmentCodes(institutionId)
  }, [institutionId])

  const onSaveMappings = async () => {
    if (!institutionId) return showToast('danger', 'Institution is required')
    if (rows.length === 0) return showToast('danger', 'No rows available to save')

    const originalById = new Map(
      originalRows.map((r) => [
        String(r.courseOfferingId),
        normalizeCodeId(r.selectedCIAComputationId || r.ciaComputationId),
      ]),
    )

    const changed = rows
      .filter(
        (r) =>
          normalizeCodeId(r.selectedCIAComputationId) !==
          normalizeCodeId(originalById.get(String(r.courseOfferingId))),
      )
      .map((r) => ({
        courseOfferingId: r.courseOfferingId,
        ciaComputationId: r.selectedCIAComputationId || null,
      }))

    if (changed.length === 0) {
      setMappingLocked(true)
      setSelectedRowId('')
      setEditingRowId('')
      showToast('warning', 'No changes to save.')
      return
    }

    setSaving(true)
    try {
      setMappingLocked(true)
      await api.post('/api/setup/assessment-setup/mappings', {
        institutionId,
        mappings: changed,
      })
      showToast('success', 'Assessment mappings saved successfully.')
      await loadMappings({ lockAfterLoad: true })
      setMappingLocked(true)
    } catch (err) {
      setMappingLocked(false)
      showToast('danger', err?.response?.data?.error || 'Failed to save mappings')
    } finally {
      setSaving(false)
    }
  }

  const onCancel = () => {
    setRows(originalRows.map((r) => ({ ...r })))
    setMapStatus(computeMapStatus(originalRows))
    setSelectedRowId('')
    setEditingRowId('')
  }

  const onEditSelected = () => {
    if (!mappingLocked) return
    if (!selectedRowId) return showToast('warning', 'Select one row to edit.')
    const row = rows.find((r) => String(r.courseOfferingId) === String(selectedRowId))
    if (!row) return
    setEditingRowId(row.courseOfferingId)
  }

  const onSaveSelected = async () => {
    if (!mappingLocked) return
    if (!selectedRowId || !editingRowId || String(selectedRowId) !== String(editingRowId)) {
      return showToast('warning', 'Select and edit one row before saving.')
    }
    const row = rows.find((r) => String(r.courseOfferingId) === String(editingRowId))
    if (!row) return
    setSaving(true)
    try {
      await api.post('/api/setup/assessment-setup/mappings', {
        institutionId,
        mappings: [
          {
            courseOfferingId: row.courseOfferingId,
            ciaComputationId: row.selectedCIAComputationId || null,
          },
        ],
      })
      const synced = rows.map((r) =>
        String(r.courseOfferingId) === String(row.courseOfferingId)
          ? { ...r, ciaComputationId: r.selectedCIAComputationId || null }
          : r,
      )
      setRows(synced)
      setOriginalRows(synced)
      setMapStatus(computeMapStatus(synced))
      setEditingRowId('')
      showToast('success', 'Selected row mapping saved.')
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to save selected row')
    } finally {
      setSaving(false)
    }
  }

  const onResetSelectedMap = async () => {
    if (!mappingLocked) return
    if (!selectedRowId) return showToast('warning', 'Select one row to reset mapping.')
    setSaving(true)
    try {
      await api.post('/api/setup/assessment-setup/mappings', {
        institutionId,
        mappings: [{ courseOfferingId: selectedRowId, ciaComputationId: null }],
      })
      const synced = rows.map((r) =>
        String(r.courseOfferingId) === String(selectedRowId)
          ? { ...r, ciaComputationId: null, selectedCIAComputationId: '' }
          : r,
      )
      setRows(synced)
      setOriginalRows(synced)
      setMapStatus(computeMapStatus(synced))
      if (String(editingRowId) === String(selectedRowId)) {
        setEditingRowId('')
      }
      showToast('success', 'Selected row mapping reset.')
    } catch (err) {
      showToast('danger', err?.response?.data?.error || 'Failed to reset selected row mapping')
    } finally {
      setSaving(false)
    }
  }

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(scope.academicYearId)) || null,
    [academicYears, scope.academicYearId],
  )

  const chosenSemesterOptions = useMemo(() => {
    if (!selectedAcademicYear) return []
    const fromChosen = Array.isArray(selectedAcademicYear?.chosenSemesters)
      ? selectedAcademicYear.chosenSemesters
      : typeof selectedAcademicYear?.chosenSemesters === 'string'
        ? selectedAcademicYear.chosenSemesters.split(',')
        : []
    return [...new Set(
      fromChosen
        .map((v) => Number(String(v).trim()))
        .filter((n) => Number.isFinite(n) && n > 0),
    )].sort((a, b) => a - b)
  }, [selectedAcademicYear])

  useEffect(() => {
    const semesterCategory = String(selectedAcademicYear?.semesterCategory || '').toUpperCase()
    setScope((prev) => {
      const nextSemester = chosenSemesterOptions.some((x) => String(x) === String(prev.chosenSemester))
        ? prev.chosenSemester
        : ''
      return {
        ...prev,
        semesterCategory,
        chosenSemester: nextSemester,
      }
    })
  }, [selectedAcademicYear, chosenSemesterOptions])

  return (
    <CRow>
      <CCol xs={12}>
        {toast && (
          <CAlert color={toast.type} className="mb-3">
            {toast.message}
          </CAlert>
        )}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>CIA ASSESSMENT CODE MAP</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <CCol md={2}><CFormLabel>Institution</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
                    <option value="">Select Institution</option>
                    {institutions.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect value={scope.academicYearId} onChange={(e) => setScope((p) => ({ ...p, academicYearId: e.target.value }))}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.academicYear || x.id}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Semester Category</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect value={scope.semesterCategory} disabled>
                    <option value="">
                      {scope.academicYearId ? 'No Semester Category configured' : 'Select Academic Year'}
                    </option>
                    {scope.semesterCategory ? (
                      <option value={scope.semesterCategory}>{scope.semesterCategory}</option>
                    ) : null}
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={scope.chosenSemester}
                    onChange={(e) => setScope((p) => ({ ...p, chosenSemester: e.target.value }))}
                    disabled={!scope.academicYearId}
                  >
                    <option value="">Choose Semester</option>
                    {chosenSemesterOptions.map((s) => (
                      <option key={s} value={String(s)}>
                        {String(s)}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={2}><CFormLabel>Programme</CFormLabel></CCol>
                <CCol md={4}>
                  <CFormSelect value={scope.programmeId} onChange={(e) => setScope((p) => ({ ...p, programmeId: e.target.value }))}>
                    <option value="">Select Programme</option>
                    {programmes.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.programmeCode} - {x.programmeName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={2}><CFormLabel>Search</CFormLabel></CCol>
                <CCol md={4} className="d-flex align-items-end">
                  <ArpButton label="Search" icon="search" color="info" onClick={loadMappings} disabled={loading || saving} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <div className="d-flex flex-column">
              <strong>Course Mapping</strong>
              <small className="text-muted">Assessment Code Map Status: {mapStatus}</small>
            </div>
            <div className="d-flex gap-2">
              {!mappingLocked ? (
                <>
                  <ArpButton label={saving ? 'Saving...' : 'Save Mapping'} icon="save" color="success" onClick={onSaveMappings} disabled={saving || loading || rows.length === 0} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={onCancel} disabled={saving || loading || rows.length === 0} />
                </>
              ) : (
                <>
                  <ArpIconButton icon="edit" color="info" title="Edit Selected Row" onClick={onEditSelected} disabled={saving || loading || rows.length === 0 || !selectedRowId} />
                  <ArpIconButton icon="upload" color="success" title="Save Selected Row" onClick={onSaveSelected} disabled={saving || loading || rows.length === 0 || !selectedRowId || !editingRowId || String(selectedRowId) !== String(editingRowId)} />
                  <ArpIconButton icon="delete" color="danger" title="Reset Map for Selected Row" onClick={onResetSelectedMap} disabled={saving || loading || rows.length === 0 || !selectedRowId} />
                  <ArpButton label="Unlock" icon="cancel" color="secondary" onClick={() => { setMappingLocked(false); setSelectedRowId(''); setEditingRowId('') }} disabled={saving || loading} />
                </>
              )}
            </div>
          </CCardHeader>
          <CCardBody>
            {loading ? (
              <div className="text-muted">Loading courses...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      {mappingLocked ? <th style={{ width: 70, textAlign: 'center' }}>Select</th> : null}
                      <th style={{ width: 140, textAlign: 'center' }}>Course Code</th>
                      <th>Course Title</th>
                      <th style={{ width: 90, textAlign: 'center' }}>CIA</th>
                      <th style={{ width: 90, textAlign: 'center' }}>ESE</th>
                      <th style={{ width: 90, textAlign: 'center' }}>Total</th>
                      <th style={{ width: 90, textAlign: 'center' }}>Credit</th>
                      <th style={{ width: 120, textAlign: 'center' }}>Map Status</th>
                      <th style={{ width: 260 }}>Select CIA Assessment Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={mappingLocked ? 9 : 8} className="text-center text-muted">
                          No courses found for selected scope.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.courseOfferingId}>
                          {mappingLocked ? (
                            <td className="text-center">
                              <input
                                type="radio"
                                name="assessmentMapRow"
                                checked={String(selectedRowId) === String(r.courseOfferingId)}
                                onChange={() => {
                                  setSelectedRowId(r.courseOfferingId)
                                  if (String(editingRowId) !== String(r.courseOfferingId)) {
                                    setEditingRowId('')
                                  }
                                }}
                                disabled={saving || loading}
                              />
                            </td>
                          ) : null}
                          <td className="text-center">{r.courseCode || '-'}</td>
                          <td>{r.courseTitle || '-'}</td>
                          <td className="text-center">{r.cia ?? '-'}</td>
                          <td className="text-center">{r.ese ?? '-'}</td>
                          <td className="text-center">{r.total ?? '-'}</td>
                          <td className="text-center">{r.credit ?? '-'}</td>
                          <td className="text-center">
                            {normalizeCodeId(r.selectedCIAComputationId) ? (
                              <CBadge color="success">Mapped</CBadge>
                            ) : (
                              <CBadge color="secondary">Not Mapped</CBadge>
                            )}
                          </td>
                          <td>
                            <CFormSelect
                              value={r.selectedCIAComputationId}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((x) =>
                                    x.courseOfferingId === r.courseOfferingId
                                      ? { ...x, selectedCIAComputationId: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                              disabled={saving || loading || (mappingLocked && String(editingRowId) !== String(r.courseOfferingId))}
                            >
                              <option value="">Select CIA Assessment Code</option>
                              {assessmentCodes.map((code) => (
                                <option key={code.id} value={code.id}>
                                  {code.ciaAssessmentCode}
                                </option>
                              ))}
                            </CFormSelect>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}
