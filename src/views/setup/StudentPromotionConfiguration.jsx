import React, { useEffect, useMemo, useState } from 'react'
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
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'

import { ArpButton, useArpToast } from '../../components/common'
import api from '../../services/apiClient'

const initialSource = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
}

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

export default function StudentPromotionConfiguration() {
  const toast = useArpToast()
  const [source, setSource] = useState(initialSource)
  const [targetAcademicYearId, setTargetAcademicYearId] = useState('')
  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [mappedSemesters, setMappedSemesters] = useState([])
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingMasters, setLoadingMasters] = useState(false)

  const showMessage = (type, message) =>
    toast.show({ type, message, autohide: type === 'success', delay: 3500 })

  const sourceReady = useMemo(
    () =>
      Boolean(
        source.institutionId &&
          source.departmentId &&
          source.programmeId &&
          source.regulationId &&
          source.academicYearId &&
          source.batchId &&
          source.semester,
      ),
    [source],
  )

  const loadInstitutions = async () => {
    setLoadingMasters(true)
    try {
      const res = await api.get('/api/setup/institution')
      setInstitutions(unwrapList(res))
    } catch (e) {
      setInstitutions([])
      showMessage('danger', e?.response?.data?.error || 'Failed to load institutions')
    } finally {
      setLoadingMasters(false)
    }
  }

  const loadMappedSemesters = async ({ institutionId, academicYearId, programmeId, regulationId, batchId }) => {
    try {
      const res = await api.get('/api/setup/regulation-map', {
        params: { institutionId, academicYearId, programmeId, regulationId, batchId },
      })
      const maps = unwrapList(res).filter((m) => String(m?.status || '').toLowerCase() === 'map done')
      const sems = maps
        .map((m) => Number(m?.semester))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b)
      setMappedSemesters([...new Set(sems)])
    } catch {
      setMappedSemesters([])
    }
  }

  useEffect(() => {
    loadInstitutions()
  }, [])

  useEffect(() => {
    if (!source.institutionId) {
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      return
    }
    ;(async () => {
      try {
        const [d, ay, b] = await Promise.all([
          api.get('/api/setup/department', { params: { institutionId: source.institutionId } }),
          api.get('/api/setup/academic-year', { headers: { 'x-institution-id': source.institutionId } }),
          api.get('/api/setup/batch', { params: { institutionId: source.institutionId } }),
        ])
        setDepartments(unwrapList(d))
        setAcademicYears(unwrapList(ay))
        setBatches(unwrapList(b))
      } catch {
        showMessage('danger', 'Failed to load institution scope')
      }
    })()
  }, [source.institutionId])

  useEffect(() => {
    if (!source.institutionId || !source.departmentId) {
      setProgrammes([])
      return
    }
    ;(async () => {
      try {
        const res = await api.get('/api/setup/programme')
        const list = unwrapList(res).filter(
          (p) =>
            String(p.institutionId) === String(source.institutionId) &&
            String(p.departmentId) === String(source.departmentId),
        )
        setProgrammes(list)
      } catch {
        setProgrammes([])
      }
    })()
  }, [source.institutionId, source.departmentId])

  useEffect(() => {
    if (!source.institutionId || !source.programmeId) {
      setRegulations([])
      return
    }
    ;(async () => {
      try {
        const res = await api.get('/api/setup/regulation', {
          params: { institutionId: source.institutionId, programmeId: source.programmeId },
        })
        setRegulations(unwrapList(res))
      } catch {
        setRegulations([])
      }
    })()
  }, [source.institutionId, source.programmeId])

  useEffect(() => {
    if (!source.institutionId || !source.programmeId || !source.regulationId || !source.academicYearId || !source.batchId) {
      setMappedSemesters([])
      return
    }
    loadMappedSemesters(source)
  }, [source.institutionId, source.programmeId, source.regulationId, source.academicYearId, source.batchId])

  const onPreview = async () => {
    if (!sourceReady) return showMessage('danger', 'Complete source scope before preview.')
    if (!targetAcademicYearId) return showMessage('danger', 'Select target Academic Year.')
    setLoading(true)
    try {
      const res = await api.get('/api/setup/student/promotion/preview', {
        params: { ...source, targetAcademicYearId },
      })
      const data = res?.data?.data || null
      const initialRows = Array.isArray(data?.rows)
        ? data.rows.map((row) => ({
            ...row,
            action: row.defaultAction || 'PROMOTE',
            targetClassId: row.promoteClassId || row.retainClassId || '',
          }))
        : []
      setPreview({ ...data, rows: initialRows })
    } catch (e) {
      setPreview(null)
      showMessage('danger', e?.response?.data?.error || 'Failed to preview promotion')
    } finally {
      setLoading(false)
    }
  }

  const onApply = async () => {
    if (!preview?.rows?.length) return showMessage('danger', 'Preview students before applying promotion.')
    setSaving(true)
    try {
      await api.post('/api/setup/student/promotion/apply', {
        ...source,
        targetAcademicYearId,
        rows: preview.rows.map((row) => ({
          sourceConfigId: row.sourceConfigId,
          studentId: row.studentId,
          action: row.action,
          targetClassId: row.targetClassId,
        })),
      })
      showMessage('success', 'Student promotion processed successfully')
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || 'Failed to apply promotion')
    } finally {
      setSaving(false)
    }
  }

  const updateRow = (studentId, patch) => {
    setPreview((prev) => ({
      ...prev,
      rows: (prev?.rows || []).map((row) => {
        if (String(row.studentId) !== String(studentId)) return row
        const next = { ...row, ...patch }
        if (patch.action) {
          next.targetClassId =
            patch.action === 'RETAIN'
              ? row.retainClassId || row.sourceClassId || ''
              : row.promoteClassId || ''
        }
        return next
      }),
    }))
  }

  const classOptionsForRow = (row) => {
    const semester = row.action === 'RETAIN' ? row.retainSemester : row.promoteSemester
    return (preview?.classes || []).filter((x) => {
      const className = String(x.className || '').toUpperCase()
      const expectedYear = Math.ceil(Number(semester) / 2)
      const roman = ['I', 'II', 'III', 'IV', 'V', 'VI']
      return className.startsWith(`${roman[expectedYear - 1] || expectedYear} `)
    })
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader>
            <strong>STUDENT PROMOTION / MIGRATION</strong>
          </CCardHeader>
          <CCardBody>
            {loadingMasters ? (
              <div className="d-flex align-items-center gap-2"><CSpinner size="sm" /><span>Loading masters...</span></div>
            ) : (
              <CForm>
                <CRow className="g-3">
                  <CCol md={3}><CFormLabel>Institution</CFormLabel><CFormSelect value={source.institutionId} onChange={(e) => setSource((s) => ({ ...initialSource, institutionId: e.target.value }))}><option value="">Select Institution</option>{institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</CFormSelect></CCol>
                  <CCol md={3}><CFormLabel>Department</CFormLabel><CFormSelect value={source.departmentId} disabled={!source.institutionId} onChange={(e) => setSource((s) => ({ ...s, departmentId: e.target.value, programmeId: '', regulationId: '', academicYearId: '', batchId: '', semester: '' }))}><option value="">Select Department</option>{departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}</CFormSelect></CCol>
                  <CCol md={3}><CFormLabel>Programme</CFormLabel><CFormSelect value={source.programmeId} disabled={!source.departmentId} onChange={(e) => setSource((s) => ({ ...s, programmeId: e.target.value, regulationId: '', academicYearId: '', batchId: '', semester: '' }))}><option value="">Select Programme</option>{programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode} - {x.programmeName}</option>)}</CFormSelect></CCol>
                  <CCol md={3}><CFormLabel>Regulation</CFormLabel><CFormSelect value={source.regulationId} disabled={!source.programmeId} onChange={(e) => setSource((s) => ({ ...s, regulationId: e.target.value, academicYearId: '', batchId: '', semester: '' }))}><option value="">Select Regulation</option>{regulations.map((x) => <option key={x.id} value={x.id}>{x.regulationCode}</option>)}</CFormSelect></CCol>
                  <CCol md={3}><CFormLabel>Source Academic Year</CFormLabel><CFormSelect value={source.academicYearId} disabled={!source.institutionId} onChange={(e) => setSource((s) => ({ ...s, academicYearId: e.target.value, semester: '' }))}><option value="">Select Academic Year</option>{academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}</CFormSelect></CCol>
                  <CCol md={3}><CFormLabel>Admission Batch</CFormLabel><CFormSelect value={source.batchId} disabled={!source.institutionId} onChange={(e) => setSource((s) => ({ ...s, batchId: e.target.value, semester: '' }))}><option value="">Select Admission Batch</option>{batches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}</CFormSelect></CCol>
                  <CCol md={3}><CFormLabel>Source Semester</CFormLabel><CFormSelect value={source.semester} disabled={!mappedSemesters.length} onChange={(e) => setSource((s) => ({ ...s, semester: e.target.value }))}><option value="">Select Semester</option>{mappedSemesters.map((x) => <option key={x} value={x}>{`Sem - ${x}`}</option>)}</CFormSelect></CCol>
                  <CCol md={3}><CFormLabel>Target Academic Year</CFormLabel><CFormSelect value={targetAcademicYearId} disabled={!source.institutionId} onChange={(e) => setTargetAcademicYearId(e.target.value)}><option value="">Select Target Academic Year</option>{academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}</CFormSelect></CCol>
                  <CCol xs={12}>
                    <CAlert color="info" className="mb-0">
                      Use this module only after Student Configuration and Class Setup are completed. `Promote` moves the student to the semester derived from target Academic Year + Admission Batch. `Retain` keeps the same semester and lets the student redo that term in the target Academic Year.
                    </CAlert>
                  </CCol>
                  <CCol xs={12} className="d-flex justify-content-end gap-2">
                    <ArpButton label={loading ? 'Previewing...' : 'Preview'} icon="search" color="info" onClick={onPreview} disabled={loading || !sourceReady || !targetAcademicYearId} />
                    <ArpButton label={saving ? 'Applying...' : 'Apply Migration'} icon="save" color="success" onClick={onApply} disabled={saving || !preview?.rows?.length} />
                  </CCol>
                </CRow>
              </CForm>
            )}
          </CCardBody>
        </CCard>

        {preview ? (
          <CCard>
            <CCardHeader>
              <strong>Promotion Preview</strong>
            </CCardHeader>
            <CCardBody>
              <div className="mb-3">
                <CFormInput
                  value={`Source ${preview.source?.academicYear || '-'} Sem-${preview.source?.semester || '-'} -> Target ${preview.target?.academicYear || '-'} | Promote Semester ${preview.target?.promotedSemester || '-'}`}
                  disabled
                />
              </div>
              {!preview.target?.promoteRegulationMapAvailable ? <CAlert color="warning">Target regulation map is missing for the promoted semester.</CAlert> : null}
              <div className="table-responsive">
                <CTable bordered hover small>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Register No</CTableHeaderCell>
                      <CTableHeaderCell>Name</CTableHeaderCell>
                      <CTableHeaderCell>Source</CTableHeaderCell>
                      <CTableHeaderCell>Action</CTableHeaderCell>
                      <CTableHeaderCell>Target Semester</CTableHeaderCell>
                      <CTableHeaderCell>Target Class</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {preview.rows.map((row) => (
                      <CTableRow key={row.studentId}>
                        <CTableDataCell>{row.registerNumber}</CTableDataCell>
                        <CTableDataCell>{row.firstName}</CTableDataCell>
                        <CTableDataCell>{`${row.sourceClassName} ${row.sourceClassLabel ? `(${row.sourceClassLabel})` : ''} / Sem-${row.sourceSemester}`}</CTableDataCell>
                        <CTableDataCell style={{ minWidth: 140 }}>
                          <CFormSelect value={row.action} onChange={(e) => updateRow(row.studentId, { action: e.target.value })}>
                            <option value="PROMOTE">Promote</option>
                            <option value="RETAIN">Retain</option>
                          </CFormSelect>
                        </CTableDataCell>
                        <CTableDataCell>{row.action === 'RETAIN' ? `Sem-${row.retainSemester}` : `Sem-${row.promoteSemester}`}</CTableDataCell>
                        <CTableDataCell style={{ minWidth: 220 }}>
                          <CFormSelect value={row.targetClassId} onChange={(e) => updateRow(row.studentId, { targetClassId: e.target.value })}>
                            <option value="">Select Class</option>
                            {classOptionsForRow(row).map((cls) => (
                              <option key={cls.id} value={cls.id}>{cls.className} {cls.classLabel ? `(${cls.classLabel})` : ''}</option>
                            ))}
                          </CFormSelect>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>
            </CCardBody>
          </CCard>
        ) : null}
      </CCol>
    </CRow>
  )
}
