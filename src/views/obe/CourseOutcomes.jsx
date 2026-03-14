import React, { useEffect, useMemo, useState } from 'react'
import {
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'
import { ArpButton, ArpDataTable, useArpToast } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'
import { obeService } from '../../services/obeService'

const emptyCoRow = (index) => ({ code: `CO${index}`, statement: '' })
const emptyMappingRow = (courseOutcomeCode = '', targetCode = '', correlationLabel = '', correlationScore = '') => ({
  courseOutcomeCode,
  targetCode,
  correlationLabel,
  correlationScore,
})

const statusColumns = [
  { key: 'courseCode', label: 'Course Code', sortable: true },
  { key: 'courseName', label: 'Course Name', sortable: true },
  { key: 'courseOutcomes', label: 'Course Outcomes' },
  { key: 'coPoMapping', label: 'CO - PO Mapping' },
  { key: 'coPsoMapping', label: 'CO - PSO Mapping' },
  { key: 'attainmentWeightage', label: 'CO Attainment Weightage' },
]

const completionLabels = {
  courseOutcomes: 'Course Outcomes',
  coPoMapping: 'CO - PO Mapping',
  coPsoMapping: 'CO - PSO Mapping',
  attainmentWeightage: 'CO Attainment Weightage',
}

const WEIGHTAGE_LEVELS = [
  { level: 'L', index: '1', field: 'lowThreshold', maxMarkField: 'lowMaxMarkThreshold' },
  { level: 'M', index: '2', field: 'mediumThreshold', maxMarkField: 'mediumMaxMarkThreshold' },
  { level: 'H', index: '3', field: 'highThreshold', maxMarkField: 'highMaxMarkThreshold' },
]

const mapOutcomeRows = (rows = []) =>
  rows.length
    ? rows.map((row, index) => ({
        code: row.code || `CO${index + 1}`,
        statement: row.statement || '',
      }))
    : [emptyCoRow(1)]

const mapMappingRows = (rows = [], fallbackTargetCode = '', fallbackCorrelationLabel = '') =>
  rows.length
    ? rows.map((row) => ({
        courseOutcomeCode: row.courseOutcomeCode || '',
        targetCode: row.targetCode || '',
        correlationLabel: row.correlationLabel || '',
        correlationScore: row.correlationScore ?? '',
      }))
    : []

const getMatrixCellScore = (rows = [], courseOutcomeCode, targetCode) => {
  const match = rows.find(
    (row) =>
      String(row.courseOutcomeCode || '').trim() === String(courseOutcomeCode || '').trim() &&
      String(row.targetCode || '').trim() === String(targetCode || '').trim(),
  )
  if (!match) return ''
  return match.correlationScore !== '' && match.correlationScore !== undefined && match.correlationScore !== null
    ? String(match.correlationScore)
    : ''
}

const upsertMatrixCell = (rows = [], courseOutcomeCode, targetCode, scoreValue = '', correlationOptions = []) => {
  const normalizedScore = String(scoreValue || '').trim()
  const filtered = rows.filter(
    (row) =>
      !(
        String(row.courseOutcomeCode || '').trim() === String(courseOutcomeCode || '').trim() &&
        String(row.targetCode || '').trim() === String(targetCode || '').trim()
      ),
  )

  if (!normalizedScore) return filtered

  const selectedCorrelation = correlationOptions.find((option) => String(option.score) === normalizedScore)
  return [
    ...filtered,
    {
      courseOutcomeCode,
      targetCode,
      correlationLabel: selectedCorrelation?.label || '',
      correlationScore: Number(normalizedScore),
    },
  ]
}

const buildProgrammeOptions = (rows = []) => {
  const map = new Map()
  rows.forEach((row) => {
    if (!row?.programmeId || map.has(row.programmeId)) return
    map.set(row.programmeId, {
      id: row.programmeId,
      code: row.programmeCode || '',
      name: row.programme || '',
    })
  })
  return Array.from(map.values())
}

const CourseOutcomes = () => {
  const toast = useArpToast()
  const [institutions, setInstitutions] = useState([])
  const [institutionId, setInstitutionId] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [academicYears, setAcademicYears] = useState([])
  const [regulationMaps, setRegulationMaps] = useState([])
  const [programmeId, setProgrammeId] = useState('')
  const [semester, setSemester] = useState('')

  const [rows, setRows] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [showConfiguration, setShowConfiguration] = useState(false)
  const [loadingMasters, setLoadingMasters] = useState(false)
  const [loadingScopeOptions, setLoadingScopeOptions] = useState(false)
  const [loadingRows, setLoadingRows] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [savingKey, setSavingKey] = useState('')
  const [message, setMessage] = useState(null)
  const [pageSize, setPageSize] = useState(10)
  const [activeAccordion, setActiveAccordion] = useState('')

  const [coRows, setCoRows] = useState([emptyCoRow(1)])
  const [coLocked, setCoLocked] = useState(false)
  const [coPoRows, setCoPoRows] = useState([])
  const [coPoLocked, setCoPoLocked] = useState(false)
  const [coPsoRows, setCoPsoRows] = useState([])
  const [coPsoLocked, setCoPsoLocked] = useState(false)
  const [weightage, setWeightage] = useState({
    lowThreshold: '',
    mediumThreshold: '',
    highThreshold: '',
    lowMaxMarkThreshold: '',
    mediumMaxMarkThreshold: '',
    highMaxMarkThreshold: '',
  })
  const [weightageLocked, setWeightageLocked] = useState(false)

  const showToast = (type, text) => {
    if (!text) return
    toast.show({ type, message: text, autohide: type === 'success', delay: 4500 })
  }

  const resetEditorState = () => {
    setCoRows([emptyCoRow(1)])
    setCoLocked(false)
    setCoPoRows([])
    setCoPoLocked(false)
    setCoPsoRows([])
    setCoPsoLocked(false)
    setWeightage({
      lowThreshold: '',
      mediumThreshold: '',
      highThreshold: '',
      lowMaxMarkThreshold: '',
      mediumMaxMarkThreshold: '',
      highMaxMarkThreshold: '',
    })
    setWeightageLocked(false)
    setActiveAccordion('')
  }

  useEffect(() => {
    const loadMasters = async () => {
      setLoadingMasters(true)
      try {
        const institutionRows = await lmsService.listInstitutions()
        setInstitutions(institutionRows)
        const firstInstitutionId = institutionRows?.[0]?.id || ''
        setInstitutionId(firstInstitutionId)
        if (firstInstitutionId) {
          const years = await lmsService.listAcademicYears(firstInstitutionId)
          setAcademicYears(years)
        }
      } catch (error) {
        const text = error?.response?.data?.message || 'Failed to load course outcome masters.'
        setMessage({ type: 'danger', text })
        showToast('danger', text)
      } finally {
        setLoadingMasters(false)
      }
    }
    loadMasters()
  }, [])

  useEffect(() => {
    const loadScopeOptions = async () => {
      if (!institutionId || !academicYearId) {
        setRegulationMaps([])
        return
      }
      setLoadingScopeOptions(true)
      try {
        const data = await lmsService.listRegulationMaps({ institutionId, academicYearId })
        setRegulationMaps(data)
      } catch (error) {
        const text = error?.response?.data?.message || 'Failed to load programme and semester options.'
        setMessage({ type: 'danger', text })
        showToast('danger', text)
      } finally {
        setLoadingScopeOptions(false)
      }
    }
    loadScopeOptions()
  }, [institutionId, academicYearId])

  const programmeOptions = useMemo(() => buildProgrammeOptions(regulationMaps), [regulationMaps])
  const selectedAcademicYear = useMemo(
    () => academicYears.find((year) => String(year.id) === String(academicYearId)) || null,
    [academicYears, academicYearId],
  )
  const semesterOptions = useMemo(() => semesterOptionsFromAcademicYear(selectedAcademicYear), [selectedAcademicYear])

  useEffect(() => {
    if (!programmeId || !selectedAcademicYear) {
      setSemester('')
      return
    }
    if (semester && !semesterOptions.some((option) => String(option.value) === String(semester))) {
      setSemester('')
    }
  }, [programmeId, selectedAcademicYear, semester, semesterOptions])

  const syncStatusRow = (configDetail) => {
    const completion = configDetail?.completion || {}
    const courseOfferingId = configDetail?.context?.courseOfferingId
    if (!courseOfferingId) return

    setRows((prev) =>
      prev.map((row) =>
        row.id === courseOfferingId
          ? {
              ...row,
              courseOutcomes: completion.courseOutcomes ? 'Completed' : 'Pending',
              coPoMapping: completion.coPoMapping ? 'Completed' : 'Pending',
              coPsoMapping: completion.coPsoMapping ? 'Completed' : 'Pending',
              attainmentWeightage: completion.attainmentWeightage ? 'Completed' : 'Pending',
            }
          : row,
      ),
    )
  }

  const seedFromDetail = (configDetail) => {
    const sections = configDetail?.sections || {}
    const completion = configDetail?.completion || {}
    const masterPos = configDetail?.masters?.pos || []
    const masterPsos = configDetail?.masters?.psos || []
    const masterCorrelations = configDetail?.masters?.correlations || []

    setCoRows(mapOutcomeRows(sections.outcomes || []))
    setCoLocked(Boolean(completion.courseOutcomes))
    setCoPoRows(mapMappingRows(sections.coPoMappings || [], masterPos[0]?.code || '', masterCorrelations[0]?.label || ''))
    setCoPoLocked(Boolean(completion.coPoMapping))
    setCoPsoRows(mapMappingRows(sections.coPsoMappings || [], masterPsos[0]?.code || '', masterCorrelations[0]?.label || ''))
    setCoPsoLocked(Boolean(completion.coPsoMapping))
    setWeightage({
      lowThreshold:
        sections.weightage?.lowThreshold !== null && sections.weightage?.lowThreshold !== undefined
          ? String(sections.weightage.lowThreshold)
          : '',
      mediumThreshold:
        sections.weightage?.mediumThreshold !== null && sections.weightage?.mediumThreshold !== undefined
          ? String(sections.weightage.mediumThreshold)
          : '',
      highThreshold:
        sections.weightage?.highThreshold !== null && sections.weightage?.highThreshold !== undefined
          ? String(sections.weightage.highThreshold)
          : '',
      lowMaxMarkThreshold:
        sections.weightage?.lowMaxMarkThreshold !== null && sections.weightage?.lowMaxMarkThreshold !== undefined
          ? String(sections.weightage.lowMaxMarkThreshold)
          : '',
      mediumMaxMarkThreshold:
        sections.weightage?.mediumMaxMarkThreshold !== null && sections.weightage?.mediumMaxMarkThreshold !== undefined
          ? String(sections.weightage.mediumMaxMarkThreshold)
          : '',
      highMaxMarkThreshold:
        sections.weightage?.highMaxMarkThreshold !== null && sections.weightage?.highMaxMarkThreshold !== undefined
          ? String(sections.weightage.highMaxMarkThreshold)
          : '',
    })
    setWeightageLocked(Boolean(completion.attainmentWeightage))
    setActiveAccordion('')
  }

  const applyDetail = (configDetail) => {
    setDetail(configDetail)
    seedFromDetail(configDetail)
    syncStatusRow(configDetail)
  }

  const refreshStatusRows = async (nextSelectedId = selectedId) => {
    if (!institutionId || !academicYearId || !programmeId || !semester) return
    try {
      const data = await obeService.getCourseOutcomeStatus({
        institutionId,
        academicYearId,
        programmeId,
        semester: Number(semester),
      })
      setRows(data)
      if (nextSelectedId && !data.some((row) => row.id === nextSelectedId)) {
        setSelectedId(data[0]?.id || null)
      }
    } catch (error) {
      const text = error?.response?.data?.message || 'Failed to refresh course outcome status.'
      setMessage({ type: 'danger', text })
      showToast('danger', text)
    }
  }

  const refreshDetailFromServer = async (courseOfferingId = selectedId) => {
    if (!courseOfferingId) return
    try {
      const latest = await obeService.getCourseOutcomeDetail(courseOfferingId)
      applyDetail(latest)
    } catch (error) {
      const text = error?.response?.data?.message || 'Failed to refresh course outcome detail.'
      setMessage({ type: 'danger', text })
      showToast('danger', text)
    }
  }

  const refreshAfterSave = async (courseOfferingId = selectedId) => {
    await refreshStatusRows(courseOfferingId)
    await refreshDetailFromServer(courseOfferingId)
  }

  const handleInstitutionChange = async (nextInstitutionId) => {
    setInstitutionId(nextInstitutionId)
    setAcademicYearId('')
    setAcademicYears([])
    setRegulationMaps([])
    setProgrammeId('')
    setSemester('')
    setRows([])
    setSelectedId(null)
    setDetail(null)
    setShowConfiguration(false)
    resetEditorState()
    setMessage(null)

    if (!nextInstitutionId) return

    setLoadingMasters(true)
    try {
      const years = await lmsService.listAcademicYears(nextInstitutionId)
      setAcademicYears(years)
    } catch (error) {
      const text = error?.response?.data?.message || 'Failed to load academic years.'
      setMessage({ type: 'danger', text })
      showToast('danger', text)
    } finally {
      setLoadingMasters(false)
    }
  }

  const handleAcademicYearChange = (nextAcademicYearId) => {
    setAcademicYearId(nextAcademicYearId)
    setProgrammeId('')
    setSemester('')
    setRows([])
    setSelectedId(null)
    setDetail(null)
    setShowConfiguration(false)
    resetEditorState()
    setMessage(null)
  }

  const loadStatus = async () => {
    if (!institutionId || !academicYearId || !programmeId || !semester) {
      const text = 'Select institution, academic year, programme, and semester to search.'
      setMessage({ type: 'warning', text })
      showToast('warning', text)
      return
    }

    setLoadingRows(true)
    setSelectedId(null)
    setDetail(null)
    setShowConfiguration(false)
    resetEditorState()

    try {
      const data = await obeService.getCourseOutcomeStatus({
        institutionId,
        academicYearId,
        programmeId,
        semester: Number(semester),
      })
      setRows(data)
      if (data.length) {
        setMessage(null)
      } else {
        const text = 'No course offerings found for the selected scope.'
        setMessage({ type: 'warning', text })
        showToast('warning', text)
      }
    } catch (error) {
      setRows([])
      const text = error?.response?.data?.message || 'Failed to load course outcome status.'
      setMessage({ type: 'danger', text })
      showToast('danger', text)
    } finally {
      setLoadingRows(false)
    }
  }

  const resetFilters = () => {
    setAcademicYearId('')
    setRegulationMaps([])
    setProgrammeId('')
    setSemester('')
    setRows([])
    setSelectedId(null)
    setDetail(null)
    setShowConfiguration(false)
    resetEditorState()
    setMessage(null)
  }

  const loadDetail = async () => {
    if (!selectedId) return
    setLoadingDetail(true)
    try {
      const data = await obeService.getCourseOutcomeDetail(selectedId)
      applyDetail(data)
      setShowConfiguration(true)
      setMessage(null)
    } catch (error) {
      const text = error?.response?.data?.message || 'Failed to load course outcome detail.'
      setMessage({ type: 'danger', text })
      showToast('danger', text)
    } finally {
      setLoadingDetail(false)
    }
  }

  const withSaveState = async (key, work) => {
    setSavingKey(key)
    try {
      await work()
    } catch (error) {
      const text =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Failed to save course outcome configuration.'
      setMessage({ type: 'danger', text })
      showToast('danger', text)
    } finally {
      setSavingKey('')
    }
  }

  const saveCourseOutcomes = async () =>
    withSaveState('outcomes', async () => {
      const prepared = []
      for (let index = 0; index < coRows.length; index += 1) {
        const row = coRows[index]
        const code = String(row.code || `CO${index + 1}`).trim()
        const statement = row.statement.trim()
        if (!statement) continue
        prepared.push({ code, statement, sortOrder: index + 1 })
      }

      const data = await obeService.saveCourseOutcomes(selectedId, prepared)
      applyDetail(data)
      await refreshAfterSave(selectedId)
      setCoLocked(true)
      const text = 'Course outcomes saved successfully.'
      setMessage({ type: 'success', text })
      showToast('success', text)
    })

  const saveMappingSection = async (key, rowsState, serviceMethod, successText) =>
    withSaveState(key, async () => {
      const prepared = []
      for (let index = 0; index < rowsState.length; index += 1) {
        const row = rowsState[index]
        const courseOutcomeCode = String(row.courseOutcomeCode || '').trim()
        const targetCode = String(row.targetCode || '').trim()
        const correlationLabel = String(row.correlationLabel || '').trim()
        const correlationScore =
          row.correlationScore !== '' && row.correlationScore !== undefined && row.correlationScore !== null
            ? Number(row.correlationScore)
            : undefined
        if (!courseOutcomeCode && !targetCode && !correlationLabel && correlationScore === undefined) continue
        if (!courseOutcomeCode || !targetCode || (!correlationLabel && correlationScore === undefined)) {
          const text = `All mapping fields are required for row ${index + 1}.`
          setMessage({ type: 'warning', text })
          showToast('warning', text)
          return
        }
        prepared.push({ courseOutcomeCode, targetCode, correlationLabel, correlationScore })
      }

      const data = await serviceMethod(selectedId, prepared)
      applyDetail(data)
      await refreshAfterSave(selectedId)
      setMessage({ type: 'success', text: successText })
      showToast('success', successText)
    })

  const saveWeightage = async () =>
    withSaveState('weightage', async () => {
      const lowThreshold = Number(weightage.lowThreshold)
      const mediumThreshold = Number(weightage.mediumThreshold)
      const highThreshold = Number(weightage.highThreshold)
      const lowMaxMarkThreshold = Number(weightage.lowMaxMarkThreshold)
      const mediumMaxMarkThreshold = Number(weightage.mediumMaxMarkThreshold)
      const highMaxMarkThreshold = Number(weightage.highMaxMarkThreshold)

      if (
        !Number.isFinite(lowThreshold) ||
        !Number.isFinite(mediumThreshold) ||
        !Number.isFinite(highThreshold) ||
        !Number.isFinite(lowMaxMarkThreshold) ||
        !Number.isFinite(mediumMaxMarkThreshold) ||
        !Number.isFinite(highMaxMarkThreshold)
      ) {
        const text = 'All threshold values must be numeric.'
        setMessage({ type: 'warning', text })
        showToast('warning', text)
        return
      }

      if (!(lowThreshold < mediumThreshold && mediumThreshold < highThreshold)) {
        const text = 'L, M and H threshold values must be in ascending order.'
        setMessage({ type: 'warning', text })
        showToast('warning', text)
        return
      }

      const data = await obeService.saveCourseOutcomeWeightage(selectedId, {
        lowThreshold,
        mediumThreshold,
        highThreshold,
        lowMaxMarkThreshold,
        mediumMaxMarkThreshold,
        highMaxMarkThreshold,
      })
      applyDetail(data)
      await refreshAfterSave(selectedId)
      setWeightageLocked(true)
      const text = 'Course outcome attainment weightage saved successfully.'
      setMessage({ type: 'success', text })
      showToast('success', text)
    })

  const coCodeOptions = coRows.map((row, index) => row.code || `CO${index + 1}`)
  const poOptions = detail?.masters?.pos || []
  const psoOptions = detail?.masters?.psos || []
  const correlationOptions = detail?.masters?.correlations || []
  const correlationScoreOptions = useMemo(
    () =>
      [...correlationOptions]
        .sort((a, b) => Number(a.score) - Number(b.score))
        .map((option) => ({ value: String(option.score), label: String(option.score) })),
    [correlationOptions],
  )

  return (
    <CRow>
      <CCol xs={12}>
        {message && (
          <CAlert color={message.type} dismissible onClose={() => setMessage(null)}>
            {message.text}
          </CAlert>
        )}

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Course Outcomes</strong>
          </CCardHeader>
          <CCardBody>
            <CForm
              onSubmit={(e) => {
                e.preventDefault()
                loadStatus()
              }}
            >
              <CRow className="g-3 align-items-end">
                <CCol md={3}>
                  <CFormLabel>Institution</CFormLabel>
                  <CFormSelect value={institutionId} onChange={(e) => handleInstitutionChange(e.target.value)}>
                    <option value="">Select</option>
                    {institutions.map((institution) => (
                      <option key={institution.id} value={institution.id}>
                        {institution.institutionName || institution.name || institution.id}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Academic Year</CFormLabel>
                  <CFormSelect value={academicYearId} onChange={(e) => handleAcademicYearChange(e.target.value)} disabled={!institutionId}>
                    <option value="">Select</option>
                    {academicYears.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.academicYearLabel || year.academicYear}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Programme</CFormLabel>
                  <CFormSelect value={programmeId} onChange={(e) => setProgrammeId(e.target.value)} disabled={!academicYearId || loadingScopeOptions}>
                    <option value="">Select</option>
                    {programmeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.code ? `${option.code} - ${option.name}` : option.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Semester</CFormLabel>
                  <CFormSelect value={semester} onChange={(e) => setSemester(e.target.value)} disabled={!programmeId || loadingScopeOptions}>
                    <option value="">Select</option>
                    {semesterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>
              <CRow className="g-3 align-items-center mt-1">
                <CCol md={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label="Search" icon="search" color="primary" type="submit" disabled={loadingMasters || loadingRows} />
                  <ArpButton label="Reset" icon="reset" color="secondary" type="button" onClick={resetFilters} disabled={loadingMasters} />
                </CCol>
              </CRow>
            </CForm>
            {(loadingMasters || loadingScopeOptions) && (
              <div className="mt-3 d-flex align-items-center gap-2">
                <CSpinner size="sm" />
                <span>Loading scope data...</span>
              </div>
            )}
          </CCardBody>
        </CCard>

        <ArpDataTable
          title="Status of CO Configurations"
          rows={rows}
          columns={statusColumns}
          rowKey="id"
          loading={loadingRows}
          selection={{
            type: 'radio',
            selected: selectedId,
            onChange: (value) => setSelectedId(value),
            key: 'id',
            headerLabel: 'Select',
            name: 'courseOutcomeSelect',
          }}
          emptyText="No records found."
          defaultPageSize={pageSize}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          headerActions={
            <ArpButton
              label="CO Configuration"
              icon="add"
              color="purple"
              type="button"
              onClick={loadDetail}
              disabled={!selectedId || loadingDetail}
              title="Open Course Outcome Configuration"
            />
          }
        />

        {showConfiguration && detail && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>CO Configuration</strong>
            </CCardHeader>
            <CCardBody>
              {loadingDetail ? (
                <div className="d-flex align-items-center gap-2">
                  <CSpinner size="sm" />
                  <span>Loading course outcome detail...</span>
                </div>
              ) : (
                <>
                  <CRow className="g-3 mb-3">
                    <CCol md={3}><strong>Academic Year:</strong> {detail.context?.academicYear || ''}</CCol>
                    <CCol md={3}><strong>Programme:</strong> {detail.context?.programmeName || ''}</CCol>
                    <CCol md={3}><strong>Semester:</strong> {detail.context?.semester || ''}</CCol>
                    <CCol md={3}><strong>Course:</strong> {detail.context?.courseCode || ''} - {detail.context?.courseName || ''}</CCol>
                  </CRow>

                  <CTable bordered responsive className="mb-4">
                    <CTableHead color="light">
                      <CTableRow>
                        <CTableHeaderCell>Section</CTableHeaderCell>
                        <CTableHeaderCell>Completion</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {Object.entries(detail.completion || {}).map(([key, value]) => (
                        <CTableRow key={key}>
                          <CTableDataCell>{completionLabels[key] || key}</CTableDataCell>
                          <CTableDataCell>{value ? 'Completed' : 'Pending'}</CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>

                  <CAccordion activeItemKey={activeAccordion} onChange={(key) => setActiveAccordion(key || '')}>
                    <CAccordionItem itemKey="outcomes">
                      <CAccordionHeader>Add Course Outcomes</CAccordionHeader>
                      <CAccordionBody>
                        <div className="mb-3 text-body-secondary">On successful completion of this course, students will be able to:</div>
                        <CTable bordered responsive>
                          <CTableHead color="light">
                            <CTableRow>
                              <CTableHeaderCell style={{ width: 120 }}>Index</CTableHeaderCell>
                              <CTableHeaderCell>CO Statement</CTableHeaderCell>
                              <CTableHeaderCell style={{ width: 100 }}>Action</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {coRows.map((row, index) => (
                              <CTableRow key={`co-${index + 1}`}>
                                <CTableDataCell>{row.code || `CO${index + 1}`}</CTableDataCell>
                                <CTableDataCell>
                                  <CFormTextarea
                                    rows={2}
                                    value={row.statement}
                                    disabled={coLocked}
                                    onChange={(e) =>
                                      setCoRows((prev) =>
                                        prev.map((item, idx) =>
                                          idx === index ? { ...item, code: item.code || `CO${idx + 1}`, statement: e.target.value } : item,
                                        ),
                                      )
                                    }
                                  />
                                </CTableDataCell>
                                <CTableDataCell className="text-center">
                                  <CButton
                                    color={index === coRows.length - 1 ? 'primary' : 'danger'}
                                    className="text-white"
                                    disabled={coLocked}
                                    onClick={() =>
                                      index === coRows.length - 1
                                        ? setCoRows((prev) => [...prev, emptyCoRow(prev.length + 1)])
                                        : setCoRows((prev) =>
                                            prev.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, code: `CO${idx + 1}` })),
                                          )
                                    }
                                  >
                                    {index === coRows.length - 1 ? '+' : '-'}
                                  </CButton>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <ArpButton label="Edit" icon="edit" color="info" onClick={() => setCoLocked(false)} disabled={savingKey === 'outcomes'} />
                          <ArpButton label="Save" icon="save" color="success" onClick={saveCourseOutcomes} disabled={savingKey === 'outcomes' || coLocked} />
                          <ArpButton
                            label="Cancel"
                            icon="cancel"
                            color="secondary"
                            onClick={() => {
                              seedFromDetail(detail)
                              setCoLocked(Boolean(detail.completion?.courseOutcomes))
                            }}
                            disabled={savingKey === 'outcomes'}
                          />
                        </div>
                      </CAccordionBody>
                    </CAccordionItem>
                    <CAccordionItem itemKey="coPo">
                      <CAccordionHeader>CO - PO Mapping</CAccordionHeader>
                      <CAccordionBody>
                        <div className="mb-3 text-body-secondary">3 - Strong, 2 - Medium, 1 - Low</div>
                        <CTable bordered responsive>
                          <CTableHead color="light">
                            <CTableRow>
                              <CTableHeaderCell>CO</CTableHeaderCell>
                              {poOptions.map((option) => (
                                <CTableHeaderCell key={option.code}>{option.code}</CTableHeaderCell>
                              ))}
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {coCodeOptions.map((coCode) => (
                              <CTableRow key={`co-po-${coCode}`}>
                                <CTableDataCell>{coCode}</CTableDataCell>
                                {poOptions.map((option) => (
                                  <CTableDataCell key={`${coCode}-${option.code}`}>
                                    <CFormSelect
                                      value={getMatrixCellScore(coPoRows, coCode, option.code)}
                                      disabled={coPoLocked}
                                      onChange={(e) =>
                                        setCoPoRows((prev) =>
                                          upsertMatrixCell(prev, coCode, option.code, e.target.value, correlationOptions),
                                        )
                                      }
                                    >
                                      <option value="">Select</option>
                                      {correlationScoreOptions.map((scoreOption) => (
                                        <option key={scoreOption.value} value={scoreOption.value}>
                                          {scoreOption.label}
                                        </option>
                                      ))}
                                    </CFormSelect>
                                  </CTableDataCell>
                                ))}
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <ArpButton label="Edit" icon="edit" color="info" onClick={() => setCoPoLocked(false)} disabled={savingKey === 'coPo'} />
                          <ArpButton label="Save" icon="save" color="success" onClick={() => saveMappingSection('coPo', coPoRows, obeService.saveCourseOutcomePoMapping, 'CO - PO mapping saved successfully.')} disabled={savingKey === 'coPo' || coPoLocked} />
                          <ArpButton
                            label="Cancel"
                            icon="cancel"
                            color="secondary"
                            onClick={() => {
                              seedFromDetail(detail)
                              setCoPoLocked(Boolean(detail.completion?.coPoMapping))
                            }}
                            disabled={savingKey === 'coPo'}
                          />
                        </div>
                      </CAccordionBody>
                    </CAccordionItem>
                    <CAccordionItem itemKey="coPso">
                      <CAccordionHeader>CO - PSO Mapping</CAccordionHeader>
                      <CAccordionBody>
                        <div className="mb-3 text-body-secondary">3 - Strong, 2 - Medium, 1 - Low</div>
                        <CTable bordered responsive>
                          <CTableHead color="light">
                            <CTableRow>
                              <CTableHeaderCell>CO</CTableHeaderCell>
                              {psoOptions.map((option) => (
                                <CTableHeaderCell key={option.code}>{option.code}</CTableHeaderCell>
                              ))}
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {coCodeOptions.map((coCode) => (
                              <CTableRow key={`co-pso-${coCode}`}>
                                <CTableDataCell>{coCode}</CTableDataCell>
                                {psoOptions.map((option) => (
                                  <CTableDataCell key={`${coCode}-${option.code}`}>
                                    <CFormSelect
                                      value={getMatrixCellScore(coPsoRows, coCode, option.code)}
                                      disabled={coPsoLocked}
                                      onChange={(e) =>
                                        setCoPsoRows((prev) =>
                                          upsertMatrixCell(prev, coCode, option.code, e.target.value, correlationOptions),
                                        )
                                      }
                                    >
                                      <option value="">Select</option>
                                      {correlationScoreOptions.map((scoreOption) => (
                                        <option key={scoreOption.value} value={scoreOption.value}>
                                          {scoreOption.label}
                                        </option>
                                      ))}
                                    </CFormSelect>
                                  </CTableDataCell>
                                ))}
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <ArpButton label="Edit" icon="edit" color="info" onClick={() => setCoPsoLocked(false)} disabled={savingKey === 'coPso'} />
                          <ArpButton label="Save" icon="save" color="success" onClick={() => saveMappingSection('coPso', coPsoRows, obeService.saveCourseOutcomePsoMapping, 'CO - PSO mapping saved successfully.')} disabled={savingKey === 'coPso' || coPsoLocked} />
                          <ArpButton
                            label="Cancel"
                            icon="cancel"
                            color="secondary"
                            onClick={() => {
                              seedFromDetail(detail)
                              setCoPsoLocked(Boolean(detail.completion?.coPsoMapping))
                            }}
                            disabled={savingKey === 'coPso'}
                          />
                        </div>
                      </CAccordionBody>
                    </CAccordionItem>
                    <CAccordionItem itemKey="weightage">
                      <CAccordionHeader>CO Attainment Weightage</CAccordionHeader>
                      <CAccordionBody>
                        <CTable bordered responsive>
                          <CTableHead color="light">
                            <CTableRow>
                              <CTableHeaderCell style={{ width: 160 }}>Correlation Level</CTableHeaderCell>
                              <CTableHeaderCell style={{ width: 160 }}>Correlation Index</CTableHeaderCell>
                              <CTableHeaderCell>Description</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {WEIGHTAGE_LEVELS.map((row) => (
                              <CTableRow key={row.level}>
                                <CTableDataCell>{row.level}</CTableDataCell>
                                <CTableDataCell>{row.index}</CTableDataCell>
                                <CTableDataCell>
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <CFormInput
                                      style={{ width: 100 }}
                                      value={weightage[row.field]}
                                      disabled={weightageLocked}
                                      onChange={(e) => setWeightage((prev) => ({ ...prev, [row.field]: e.target.value }))}
                                    />
                                    <span>% and above students scoring more than</span>
                                    <CFormInput
                                      style={{ width: 100 }}
                                      value={weightage[row.maxMarkField]}
                                      disabled={weightageLocked}
                                      onChange={(e) => setWeightage((prev) => ({ ...prev, [row.maxMarkField]: e.target.value }))}
                                    />
                                    <span>% of maximum marks in the relevant COs</span>
                                  </div>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <ArpButton label="Edit" icon="edit" color="info" onClick={() => setWeightageLocked(false)} disabled={savingKey === 'weightage'} />
                          <ArpButton label="Save" icon="save" color="success" onClick={saveWeightage} disabled={savingKey === 'weightage' || weightageLocked} />
                          <ArpButton
                            label="Cancel"
                            icon="cancel"
                            color="secondary"
                            onClick={() => {
                              seedFromDetail(detail)
                              setWeightageLocked(Boolean(detail.completion?.attainmentWeightage))
                            }}
                            disabled={savingKey === 'weightage'}
                          />
                        </div>
                      </CAccordionBody>
                    </CAccordionItem>
                  </CAccordion>
                </>
              )}
            </CCardBody>
          </CCard>
        )}
      </CCol>
    </CRow>
  )
}

export default CourseOutcomes
