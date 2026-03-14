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
  CFormCheck,
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
import { lmsService } from '../../services/lmsService'
import { obeService } from '../../services/obeService'

const emptyVisionMissionRow = () => ({ vision: '', mission: '' })
const emptyStatementRow = () => ({ statement: '' })
const emptyCorrelationRow = () => ({ parameter: '', index: '', value: '' })

const TAXONOMY_LAYOUT = {
  COGNITIVE: ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'],
  PSYCHOMOTOR: ['Perception', 'SET', 'Guided Response', 'Mechanism', 'Complete Over Response', 'Adaption', 'Organization'],
  AFFECTIVE: ['Receiving', 'Responding', 'Valuing', 'Organizing', 'Internationalizing'],
}

const TAXONOMY_ROW_LAYOUT = [
  ['Remembering', 'Perception', 'Receiving'],
  ['Understanding', 'SET', 'Responding'],
  ['Applying', 'Guided Response', 'Valuing'],
  ['Analyzing', 'Mechanism', 'Organizing'],
  ['Evaluating', 'Complete Over Response', 'Internationalizing'],
  ['Creating', 'Adaption', ''],
  ['', 'Organization', ''],
]

const MAP_ASSESSMENT_TEMPLATE = [
  { key: 'enablePeoPo', label: 'PEO - PO Mapping' },
  { key: 'enableCoPo', label: 'CO - PO Mapping' },
  { key: 'enableCoPso', label: 'CO - PSO Mapping' },
  { key: 'enableDirect', label: 'Direct Assessment Method' },
  { key: 'enableIndirect', label: 'Indirect Assessment Method' },
]

const sectionLabels = {
  visionMission: 'Vision - Mission',
  peo: 'PEO',
  po: 'PO',
  pso: 'PSO',
  taxonomy: 'Taxonomy',
  correlation: 'Correlation',
  mapAssessment: 'Map & Assessment',
}

const boolStatus = (value) => (value ? 'Completed' : 'Pending')

const buildMapAssessmentRows = (policy = null) => {
  const remarks = policy?.remarks && typeof policy.remarks === 'object' ? policy.remarks : {}
  return MAP_ASSESSMENT_TEMPLATE.map((row) => ({
    ...row,
    selected: Boolean(policy?.[row.key]),
    remarks: String(remarks[row.key] ?? ''),
  }))
}

const pairVisionMissionRows = (rows = []) => {
  const visions = rows.filter((row) => row.type === 'VISION').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  const missions = rows.filter((row) => row.type === 'MISSION').sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  const maxLen = Math.max(visions.length, missions.length, 1)
  return Array.from({ length: maxLen }, (_, index) => ({
    vision: visions[index]?.statement || '',
    mission: missions[index]?.statement || '',
  }))
}

const mapStatementRows = (rows = []) =>
  rows.length ? rows.map((row) => ({ statement: row.statement || '' })) : [emptyStatementRow()]

const mapCorrelationRows = (rows = []) =>
  rows.length
    ? rows.map((row) => ({
        parameter: row.description || '',
        index: row.label || '',
        value: row.score ?? '',
      }))
    : [emptyCorrelationRow()]

const mapTaxonomySelection = (rows = []) => ({
  COGNITIVE: rows.some((row) => row.domain === 'COGNITIVE'),
  PSYCHOMOTOR: rows.some((row) => row.domain === 'PSYCHOMOTOR'),
  AFFECTIVE: rows.some((row) => row.domain === 'AFFECTIVE'),
})

const buildDefaultTaxonomyCodes = () => {
  const codes = {}
  Object.entries(TAXONOMY_LAYOUT).forEach(([domain, levels]) => {
    levels.forEach((levelName, index) => {
      codes[`${domain}:${levelName}`] = `${domain[0]}${index + 1}`
    })
  })
  return codes
}

const mapTaxonomyCodes = (rows = []) => {
  const codes = buildDefaultTaxonomyCodes()
  rows.forEach((row) => {
    if (!row?.domain || !row?.levelName) return
    codes[`${row.domain}:${row.levelName}`] = row.levelCode || codes[`${row.domain}:${row.levelName}`] || ''
  })
  return codes
}

const buildTaxonomyPayload = (selectedDomains, taxonomyCodes) => {
  const rows = []
  Object.entries(selectedDomains).forEach(([domain, selected]) => {
    if (!selected) return
    ;(TAXONOMY_LAYOUT[domain] || []).forEach((levelName, index) => {
      rows.push({
        domain,
        levelCode: String(taxonomyCodes?.[`${domain}:${levelName}`] || `${domain[0]}${index + 1}`).trim(),
        levelName,
        numericValue: index + 1,
        sortOrder: index + 1,
      })
    })
  })
  return rows
}

const ObeConfiguration = () => {
  const toast = useArpToast()
  const [institutions, setInstitutions] = useState([])
  const [institutionId, setInstitutionId] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [academicYears, setAcademicYears] = useState([])
  const [rows, setRows] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [showConfiguration, setShowConfiguration] = useState(false)
  const [loadingMasters, setLoadingMasters] = useState(false)
  const [loadingRows, setLoadingRows] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [message, setMessage] = useState(null)
  const [pageSize, setPageSize] = useState(10)
  const [activeAccordion, setActiveAccordion] = useState('')
  const [savingKey, setSavingKey] = useState('')

  const [visionMissionRows, setVisionMissionRows] = useState([emptyVisionMissionRow()])
  const [visionMissionLocked, setVisionMissionLocked] = useState(false)
  const [peoRows, setPeoRows] = useState([emptyStatementRow()])
  const [peoLocked, setPeoLocked] = useState(false)
  const [poRows, setPoRows] = useState([emptyStatementRow()])
  const [poLocked, setPoLocked] = useState(false)
  const [psoRows, setPsoRows] = useState([emptyStatementRow()])
  const [psoLocked, setPsoLocked] = useState(false)
  const [taxonomySelection, setTaxonomySelection] = useState({ COGNITIVE: false, PSYCHOMOTOR: false, AFFECTIVE: false })
  const [taxonomyCodes, setTaxonomyCodes] = useState(buildDefaultTaxonomyCodes())
  const [taxonomyLocked, setTaxonomyLocked] = useState(false)
  const [correlationRows, setCorrelationRows] = useState([emptyCorrelationRow()])
  const [correlationLocked, setCorrelationLocked] = useState(false)
  const [mapAssessmentRows, setMapAssessmentRows] = useState(buildMapAssessmentRows())
  const [mapAssessmentLocked, setMapAssessmentLocked] = useState(false)

  const showToast = (type, text) => {
    if (!text) return
    toast.show({ type, message: text, autohide: type === 'success', delay: 4500 })
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
        const text = error?.response?.data?.message || 'Failed to load academic years.'
        setMessage({ type: 'danger', text })
        showToast('danger', text)
      } finally {
        setLoadingMasters(false)
      }
    }
    loadMasters()
  }, [])

  const handleInstitutionChange = async (nextInstitutionId) => {
    setInstitutionId(nextInstitutionId)
    setAcademicYearId('')
    setAcademicYears([])
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

  const statusColumns = useMemo(
    () => [
      { key: 'regulation', label: 'Regulation', sortable: true },
      { key: 'programme', label: 'Programme', sortable: true },
      { key: 'visionMission', label: 'Vision - Mission' },
      { key: 'peo', label: 'PEO' },
      { key: 'po', label: 'PO' },
      { key: 'pso', label: 'PSO' },
      { key: 'taxonomy', label: 'Taxonomy' },
      { key: 'correlation', label: 'Correlation' },
      { key: 'mapAssessment', label: 'Map & Assessment' },
    ],
    [],
  )

  const academicYearOptions = useMemo(() => {
    const uniqueYears = new Map()
    academicYears.forEach((year) => {
      const yearText = String(year?.academicYear || '').trim()
      if (!yearText || uniqueYears.has(yearText)) return
      uniqueYears.set(yearText, {
        id: year.id,
        label: yearText,
      })
    })
    return Array.from(uniqueYears.values())
  }, [academicYears])

  const resetEditorState = () => {
    setVisionMissionRows([emptyVisionMissionRow()])
    setVisionMissionLocked(false)
    setPeoRows([emptyStatementRow()])
    setPeoLocked(false)
    setPoRows([emptyStatementRow()])
    setPoLocked(false)
    setPsoRows([emptyStatementRow()])
    setPsoLocked(false)
    setTaxonomySelection({ COGNITIVE: false, PSYCHOMOTOR: false, AFFECTIVE: false })
    setTaxonomyCodes(buildDefaultTaxonomyCodes())
    setTaxonomyLocked(false)
    setCorrelationRows([emptyCorrelationRow()])
    setCorrelationLocked(false)
    setMapAssessmentRows(buildMapAssessmentRows())
    setMapAssessmentLocked(false)
    setActiveAccordion('')
  }

  const syncStatusRow = (configDetail) => {
    const completion = configDetail?.completion || {}
    const regulationMapId = configDetail?.context?.regulationMapId
    if (!regulationMapId) return

    setRows((prev) =>
      prev.map((row) =>
        row.id === regulationMapId
          ? {
              ...row,
              visionMission: boolStatus(completion.visionMission),
              peo: boolStatus(completion.peo),
              po: boolStatus(completion.po),
              pso: boolStatus(completion.pso),
              taxonomy: boolStatus(completion.taxonomy),
              correlation: boolStatus(completion.correlation),
              mapAssessment: boolStatus(completion.mapAssessment),
              configurationStatus: configDetail?.status || row.configurationStatus,
            }
          : row,
      ),
    )
  }

  const refreshStatusRows = async (nextSelectedId = selectedId) => {
    if (!institutionId || !academicYearId) return
    try {
      const data = await obeService.getConfigurationStatus({ institutionId, academicYearId })
      setRows(data)
      if (nextSelectedId && !data.some((row) => row.id === nextSelectedId)) {
        setSelectedId(data[0]?.id || null)
      }
    } catch (error) {
      const text = error?.response?.data?.message || 'Failed to refresh OBE configuration status.'
      setMessage({ type: 'danger', text })
      showToast('danger', text)
    }
  }

  const refreshDetailFromServer = async (regulationMapId = selectedId) => {
    if (!regulationMapId) return
    try {
      const latest = await obeService.getConfigurationDetail(regulationMapId)
      applyDetail(latest)
    } catch (error) {
      const text = error?.response?.data?.message || 'Failed to refresh OBE configuration detail.'
      setMessage({ type: 'danger', text })
      showToast('danger', text)
    }
  }

  const refreshAfterSave = async (regulationMapId = selectedId) => {
    await refreshStatusRows(regulationMapId)
    await refreshDetailFromServer(regulationMapId)
  }

  const seedFormsFromDetail = (configDetail) => {
    const sections = configDetail?.sections || {}
    const completion = configDetail?.completion || {}

    setVisionMissionRows(pairVisionMissionRows(sections.visionMission || []))
    setVisionMissionLocked(Boolean(completion.visionMission))
    setPeoRows(mapStatementRows(sections.peos || []))
    setPeoLocked(Boolean(completion.peo))
    setPoRows(mapStatementRows(sections.pos || []))
    setPoLocked(Boolean(completion.po))
    setPsoRows(mapStatementRows(sections.psos || []))
    setPsoLocked(Boolean(completion.pso))
    setTaxonomySelection(mapTaxonomySelection(sections.taxonomy || []))
    setTaxonomyCodes(mapTaxonomyCodes(sections.taxonomy || []))
    setTaxonomyLocked(Boolean(completion.taxonomy))
    setCorrelationRows(mapCorrelationRows(sections.correlation || []))
    setCorrelationLocked(Boolean(completion.correlation))
    setMapAssessmentRows(buildMapAssessmentRows(sections.assessmentPolicy))
    setMapAssessmentLocked(Boolean(completion.mapAssessment))
    setActiveAccordion('')
  }

  const applyDetail = (configDetail) => {
    setDetail(configDetail)
    seedFormsFromDetail(configDetail)
    syncStatusRow(configDetail)
  }

  const loadStatus = async () => {
    if (!academicYearId) {
      const text = 'Select an academic year to search.'
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
      const data = await obeService.getConfigurationStatus({ institutionId, academicYearId })
      setRows(data)
      if (data.length) {
        setMessage(null)
      } else {
        const text = 'No OBE configuration rows found.'
        setMessage({ type: 'warning', text })
        showToast('warning', text)
      }
    } catch (error) {
      setRows([])
      const text = error?.response?.data?.message || 'Failed to load OBE configuration status.'
      setMessage({ type: 'danger', text })
      showToast('danger', text)
    } finally {
      setLoadingRows(false)
    }
  }

  const resetFilters = () => {
    setAcademicYearId('')
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
      const data = await obeService.getConfigurationDetail(selectedId)
      applyDetail(data)
      setShowConfiguration(true)
      setMessage(null)
    } catch (error) {
      const text = error?.response?.data?.message || 'Failed to load OBE configuration detail.'
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
    } finally {
      setSavingKey('')
    }
  }

  const saveVisionMission = async () =>
    withSaveState('visionMission', async () => {
      const prepared = []
      for (let index = 0; index < visionMissionRows.length; index += 1) {
        const row = visionMissionRows[index]
        const vision = row.vision.trim()
        const mission = row.mission.trim()
        if (!vision && !mission) continue
        if (!vision || !mission) {
          const text = `Both vision and mission are required for row ${index + 1}.`
          setMessage({ type: 'warning', text })
          showToast('warning', text)
          return
        }
        prepared.push(
          { code: `V${prepared.length + 1}`, type: 'VISION', statement: vision, sortOrder: prepared.length + 1 },
          { code: `M${prepared.length + 1}`, type: 'MISSION', statement: mission, sortOrder: prepared.length + 1 },
        )
      }

      const data = await obeService.saveVisionMission(selectedId, prepared)
      applyDetail(data)
      await refreshAfterSave(selectedId)
      setVisionMissionLocked(true)
      const text = 'Vision and mission statements saved successfully.'
      setMessage({ type: 'success', text })
      showToast('success', text)
    })

  const saveStatementSection = async (key, rowsState, serviceMethod, successText) =>
    withSaveState(key, async () => {
      const prepared = rowsState
        .map((row, index) => ({ code: `${key.toUpperCase()}${index + 1}`, statement: row.statement.trim(), sortOrder: index + 1 }))
        .filter((row) => row.statement)

      const data = await serviceMethod(selectedId, prepared)
      applyDetail(data)
      await refreshAfterSave(selectedId)
      setMessage({ type: 'success', text: successText })
      showToast('success', successText)
    })

  const saveTaxonomy = async () =>
    withSaveState('taxonomy', async () => {
      const data = await obeService.saveTaxonomy(selectedId, buildTaxonomyPayload(taxonomySelection, taxonomyCodes))
      applyDetail(data)
      await refreshAfterSave(selectedId)
      setTaxonomyLocked(true)
      const text = 'Taxonomy configuration saved successfully.'
      setMessage({ type: 'success', text })
      showToast('success', text)
    })

  const saveCorrelation = async () =>
    withSaveState('correlation', async () => {
      const prepared = []
      for (let index = 0; index < correlationRows.length; index += 1) {
        const row = correlationRows[index]
        const parameter = row.parameter.trim()
        const label = row.index.trim()
        const scoreValue = String(row.value).trim()
        if (!parameter && !label && !scoreValue) continue
        if (!label || !scoreValue) {
          const text = `Index and value are required for correlation row ${index + 1}.`
          setMessage({ type: 'warning', text })
          showToast('warning', text)
          return
        }
        const score = Number(scoreValue)
        if (!Number.isFinite(score)) {
          const text = `Value must be numeric for correlation row ${index + 1}.`
          setMessage({ type: 'warning', text })
          showToast('warning', text)
          return
        }
        prepared.push({
          label,
          score,
          description: parameter || null,
          sortOrder: index + 1,
        })
      }

      const data = await obeService.saveCorrelation(selectedId, prepared)
      applyDetail(data)
      await refreshAfterSave(selectedId)
      setCorrelationLocked(true)
      const text = 'Correlation configuration saved successfully.'
      setMessage({ type: 'success', text })
      showToast('success', text)
    })

  const saveMapAssessment = async () =>
    withSaveState('mapAssessment', async () => {
      const payload = {
        enablePeoPo: Boolean(mapAssessmentRows.find((row) => row.key === 'enablePeoPo')?.selected),
        enableCoPo: Boolean(mapAssessmentRows.find((row) => row.key === 'enableCoPo')?.selected),
        enableCoPso: Boolean(mapAssessmentRows.find((row) => row.key === 'enableCoPso')?.selected),
        enableDirect: Boolean(mapAssessmentRows.find((row) => row.key === 'enableDirect')?.selected),
        enableIndirect: Boolean(mapAssessmentRows.find((row) => row.key === 'enableIndirect')?.selected),
        remarks: mapAssessmentRows.reduce((acc, row) => ({ ...acc, [row.key]: row.remarks.trim() }), {}),
      }

      const data = await obeService.saveAssessmentPolicy(selectedId, payload)
      applyDetail(data)
      await refreshAfterSave(selectedId)
      setMapAssessmentLocked(true)
      const text = 'Map and assessment configuration saved successfully.'
      setMessage({ type: 'success', text })
      showToast('success', text)
    })

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
            <strong>OBE Configuration</strong>
          </CCardHeader>
          <CCardBody>
            <CForm
              onSubmit={(e) => {
                e.preventDefault()
                loadStatus()
              }}
            >
              <CRow className="g-3 align-items-center">
                <CCol md={2}>
                  <CFormLabel className="mb-0">Institution</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect value={institutionId} onChange={(e) => handleInstitutionChange(e.target.value)}>
                    <option value="">Select</option>
                    {institutions.map((institution) => (
                      <option key={institution.id} value={institution.id}>
                        {institution.institutionName || institution.name || institution.id}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormLabel className="mb-0">Academic Year</CFormLabel>
                </CCol>
                <CCol md={2}>
                  <CFormSelect value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} disabled={!institutionId}>
                    <option value="">Select</option>
                    {academicYearOptions.map((year) => (
                      <option key={year.id} value={year.id}>
                        {year.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3} className="d-flex justify-content-end gap-2">
                  <ArpButton
                    label="Search"
                    icon="search"
                    color="primary"
                    type="submit"
                    disabled={loadingMasters || loadingRows}
                  />
                  <ArpButton
                    label="Reset"
                    icon="reset"
                    color="secondary"
                    type="button"
                    onClick={resetFilters}
                    disabled={loadingMasters}
                  />
                </CCol>
              </CRow>
            </CForm>
            {loadingMasters && (
              <div className="mt-3 d-flex align-items-center gap-2">
                <CSpinner size="sm" />
                <span>Loading academic years...</span>
              </div>
            )}
          </CCardBody>
        </CCard>

        <ArpDataTable
          title="OBE Configuration"
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
            name: 'obeConfigSelect',
          }}
          emptyText="No records found."
          defaultPageSize={pageSize}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          headerActions={
            <ArpButton
              label="Configuration"
              icon="add"
              color="purple"
              type="button"
              onClick={loadDetail}
              disabled={!selectedId || loadingDetail}
              title="Add OBE Configuration"
            />
          }
        />

        {showConfiguration && detail && (
          <CCard className="mb-3">
            <CCardHeader>
              <strong>OBE Configuration Detail</strong>
            </CCardHeader>
            <CCardBody>
              {loadingDetail ? (
                <div className="d-flex align-items-center gap-2">
                  <CSpinner size="sm" />
                  <span>Loading configuration detail...</span>
                </div>
              ) : (
                <>
                  <CRow className="g-3 mb-3">
                    <CCol md={3}>
                      <strong>Academic Year:</strong> {detail.context?.academicYear || ''}
                    </CCol>
                    <CCol md={3}>
                      <strong>Programme:</strong> {detail.context?.programmeName || ''}
                    </CCol>
                    <CCol md={3}>
                      <strong>Regulation:</strong> {detail.context?.regulationCode || ''}
                    </CCol>
                    <CCol md={3}>
                      <strong>Status:</strong> {detail.status || ''}
                    </CCol>
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
                          <CTableDataCell>{sectionLabels[key] || key}</CTableDataCell>
                          <CTableDataCell>{value ? 'Completed' : 'Pending'}</CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>

                  <CAccordion activeItemKey={activeAccordion} onChange={(key) => setActiveAccordion(key || '')}>
                    <CAccordionItem itemKey="visionMission">
                      <CAccordionHeader>OBE Vision / Mission Statement Entry</CAccordionHeader>
                      <CAccordionBody>
                        <CTable bordered responsive>
                          <CTableHead color="light">
                            <CTableRow>
                              <CTableHeaderCell>Vision Statement</CTableHeaderCell>
                              <CTableHeaderCell>Mission Statement</CTableHeaderCell>
                              <CTableHeaderCell style={{ width: 100 }}>Action</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {visionMissionRows.map((row, index) => (
                              <CTableRow key={`vm-${index + 1}`}>
                                <CTableDataCell>
                                  <CFormTextarea
                                    rows={2}
                                    value={row.vision}
                                    disabled={visionMissionLocked}
                                    onChange={(e) =>
                                      setVisionMissionRows((prev) =>
                                        prev.map((item, idx) => (idx === index ? { ...item, vision: e.target.value } : item)),
                                      )
                                    }
                                  />
                                </CTableDataCell>
                                <CTableDataCell>
                                  <CFormTextarea
                                    rows={2}
                                    value={row.mission}
                                    disabled={visionMissionLocked}
                                    onChange={(e) =>
                                      setVisionMissionRows((prev) =>
                                        prev.map((item, idx) => (idx === index ? { ...item, mission: e.target.value } : item)),
                                      )
                                    }
                                  />
                                </CTableDataCell>
                                <CTableDataCell className="text-center">
                                  <CButton
                                    color={index === visionMissionRows.length - 1 ? 'primary' : 'danger'}
                                    className="text-white"
                                    disabled={visionMissionLocked}
                                    onClick={() =>
                                      index === visionMissionRows.length - 1
                                        ? setVisionMissionRows((prev) => [...prev, emptyVisionMissionRow()])
                                        : setVisionMissionRows((prev) => prev.filter((_, idx) => idx !== index))
                                    }
                                  >
                                    {index === visionMissionRows.length - 1 ? '+' : '-'}
                                  </CButton>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <ArpButton
                            label="Edit"
                            icon="edit"
                            color="info"
                            onClick={() => setVisionMissionLocked(false)}
                            disabled={savingKey === 'visionMission'}
                          />
                          <ArpButton
                            label="Save"
                            icon="save"
                            color="success"
                            onClick={saveVisionMission}
                            disabled={savingKey === 'visionMission' || visionMissionLocked}
                          />
                          <ArpButton
                            label="Cancel"
                            icon="cancel"
                            color="secondary"
                            onClick={() => {
                              seedFormsFromDetail(detail)
                              setVisionMissionLocked(Boolean(detail.completion?.visionMission))
                            }}
                            disabled={savingKey === 'visionMission'}
                          />
                        </div>

                      </CAccordionBody>
                    </CAccordionItem>
                    <CAccordionItem itemKey="peo">
                      <CAccordionHeader>Programme Educational Objectives (PEOs) Form</CAccordionHeader>
                      <CAccordionBody>
                        <CTable bordered responsive>
                          <CTableHead color="light">
                            <CTableRow>
                              <CTableHeaderCell style={{ width: 120 }}>Index</CTableHeaderCell>
                              <CTableHeaderCell>PEO Statement</CTableHeaderCell>
                              <CTableHeaderCell style={{ width: 100 }}>Action</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {peoRows.map((row, index) => (
                              <CTableRow key={`peo-${index + 1}`}>
                                <CTableDataCell>{`PEO${index + 1}`}</CTableDataCell>
                                <CTableDataCell>
                                  <CFormTextarea
                                    rows={2}
                                    value={row.statement}
                                    disabled={peoLocked}
                                    onChange={(e) =>
                                      setPeoRows((prev) =>
                                        prev.map((item, idx) => (idx === index ? { ...item, statement: e.target.value } : item)),
                                      )
                                    }
                                  />
                                </CTableDataCell>
                                <CTableDataCell className="text-center">
                                  <CButton
                                    color={index === peoRows.length - 1 ? 'primary' : 'danger'}
                                    className="text-white"
                                    disabled={peoLocked}
                                    onClick={() =>
                                      index === peoRows.length - 1
                                        ? setPeoRows((prev) => [...prev, emptyStatementRow()])
                                        : setPeoRows((prev) => prev.filter((_, idx) => idx !== index))
                                    }
                                  >
                                    {index === peoRows.length - 1 ? '+' : '-'}
                                  </CButton>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <ArpButton
                            label="Edit"
                            icon="edit"
                            color="info"
                            onClick={() => setPeoLocked(false)}
                            disabled={savingKey === 'peo'}
                          />
                          <ArpButton
                            label="Save"
                            icon="save"
                            color="success"
                            onClick={() => saveStatementSection('peo', peoRows, obeService.savePeos, 'PEO saved successfully.')}
                            disabled={savingKey === 'peo' || peoLocked}
                          />
                          <ArpButton
                            label="Cancel"
                            icon="cancel"
                            color="secondary"
                            onClick={() => {
                              seedFormsFromDetail(detail)
                              setPeoLocked(Boolean(detail.completion?.peo))
                            }}
                            disabled={savingKey === 'peo'}
                          />
                        </div>
                      </CAccordionBody>
                    </CAccordionItem>

                    <CAccordionItem itemKey="po">
                      <CAccordionHeader>Programme Outcomes (POs) Form</CAccordionHeader>
                      <CAccordionBody>
                        <CTable bordered responsive>
                          <CTableHead color="light">
                            <CTableRow>
                              <CTableHeaderCell style={{ width: 120 }}>Index</CTableHeaderCell>
                              <CTableHeaderCell>PO Statement</CTableHeaderCell>
                              <CTableHeaderCell style={{ width: 100 }}>Action</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {poRows.map((row, index) => (
                              <CTableRow key={`po-${index + 1}`}>
                                <CTableDataCell>{`PO${index + 1}`}</CTableDataCell>
                                <CTableDataCell>
                                  <CFormTextarea
                                    rows={2}
                                    value={row.statement}
                                    disabled={poLocked}
                                    onChange={(e) =>
                                      setPoRows((prev) =>
                                        prev.map((item, idx) => (idx === index ? { ...item, statement: e.target.value } : item)),
                                      )
                                    }
                                  />
                                </CTableDataCell>
                                <CTableDataCell className="text-center">
                                  <CButton
                                    color={index === poRows.length - 1 ? 'primary' : 'danger'}
                                    className="text-white"
                                    disabled={poLocked}
                                    onClick={() =>
                                      index === poRows.length - 1
                                        ? setPoRows((prev) => [...prev, emptyStatementRow()])
                                        : setPoRows((prev) => prev.filter((_, idx) => idx !== index))
                                    }
                                  >
                                    {index === poRows.length - 1 ? '+' : '-'}
                                  </CButton>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <ArpButton
                            label="Edit"
                            icon="edit"
                            color="info"
                            onClick={() => setPoLocked(false)}
                            disabled={savingKey === 'po'}
                          />
                          <ArpButton
                            label="Save"
                            icon="save"
                            color="success"
                            onClick={() => saveStatementSection('po', poRows, obeService.savePos, 'PO saved successfully.')}
                            disabled={savingKey === 'po' || poLocked}
                          />
                          <ArpButton
                            label="Cancel"
                            icon="cancel"
                            color="secondary"
                            onClick={() => {
                              seedFormsFromDetail(detail)
                              setPoLocked(Boolean(detail.completion?.po))
                            }}
                            disabled={savingKey === 'po'}
                          />
                        </div>
                      </CAccordionBody>
                    </CAccordionItem>

                    <CAccordionItem itemKey="pso">
                      <CAccordionHeader>Programme Specific Outcomes (PSO) Entry</CAccordionHeader>
                      <CAccordionBody>
                        <CTable bordered responsive>
                          <CTableHead color="light">
                            <CTableRow>
                              <CTableHeaderCell style={{ width: 120 }}>Index</CTableHeaderCell>
                              <CTableHeaderCell>PSO Statement</CTableHeaderCell>
                              <CTableHeaderCell style={{ width: 100 }}>Action</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {psoRows.map((row, index) => (
                              <CTableRow key={`pso-${index + 1}`}>
                                <CTableDataCell>{`PSO${index + 1}`}</CTableDataCell>
                                <CTableDataCell>
                                  <CFormTextarea
                                    rows={2}
                                    value={row.statement}
                                    disabled={psoLocked}
                                    onChange={(e) =>
                                      setPsoRows((prev) =>
                                        prev.map((item, idx) => (idx === index ? { ...item, statement: e.target.value } : item)),
                                      )
                                    }
                                  />
                                </CTableDataCell>
                                <CTableDataCell className="text-center">
                                  <CButton
                                    color={index === psoRows.length - 1 ? 'primary' : 'danger'}
                                    className="text-white"
                                    disabled={psoLocked}
                                    onClick={() =>
                                      index === psoRows.length - 1
                                        ? setPsoRows((prev) => [...prev, emptyStatementRow()])
                                        : setPsoRows((prev) => prev.filter((_, idx) => idx !== index))
                                    }
                                  >
                                    {index === psoRows.length - 1 ? '+' : '-'}
                                  </CButton>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <ArpButton
                            label="Edit"
                            icon="edit"
                            color="info"
                            onClick={() => setPsoLocked(false)}
                            disabled={savingKey === 'pso'}
                          />
                          <ArpButton
                            label="Save"
                            icon="save"
                            color="success"
                            onClick={() => saveStatementSection('pso', psoRows, obeService.savePsos, 'PSO saved successfully.')}
                            disabled={savingKey === 'pso' || psoLocked}
                          />
                          <ArpButton
                            label="Cancel"
                            icon="cancel"
                            color="secondary"
                            onClick={() => {
                              seedFormsFromDetail(detail)
                              setPsoLocked(Boolean(detail.completion?.pso))
                            }}
                            disabled={savingKey === 'pso'}
                          />
                        </div>
                      </CAccordionBody>
                    </CAccordionItem>
                    <CAccordionItem itemKey="taxonomy">
                      <CAccordionHeader>Taxonomy Configuration Entry</CAccordionHeader>
                      <CAccordionBody>
                        <CRow className="g-3 mb-3">
                          <CCol md={4}>
                            <div className="d-flex align-items-center gap-2">
                              <span>Choose Domain</span>
                              <CFormCheck
                                label="Cognitive"
                                checked={taxonomySelection.COGNITIVE}
                                disabled={taxonomyLocked}
                                onChange={(e) => setTaxonomySelection((prev) => ({ ...prev, COGNITIVE: e.target.checked }))}
                              />
                            </div>
                          </CCol>
                          <CCol md={4}>
                            <div className="d-flex align-items-center gap-2">
                              <span>Choose Domain</span>
                              <CFormCheck
                                label="Psychomotor"
                                checked={taxonomySelection.PSYCHOMOTOR}
                                disabled={taxonomyLocked}
                                onChange={(e) => setTaxonomySelection((prev) => ({ ...prev, PSYCHOMOTOR: e.target.checked }))}
                              />
                            </div>
                          </CCol>
                          <CCol md={4}>
                            <div className="d-flex align-items-center gap-2">
                              <span>Choose Domain</span>
                              <CFormCheck
                                label="Affective"
                                checked={taxonomySelection.AFFECTIVE}
                                disabled={taxonomyLocked}
                                onChange={(e) => setTaxonomySelection((prev) => ({ ...prev, AFFECTIVE: e.target.checked }))}
                              />
                            </div>
                          </CCol>
                        </CRow>

                        <CTable bordered responsive>
                          <CTableBody>
                            {TAXONOMY_ROW_LAYOUT.map((row, index) => (
                              <CTableRow key={`taxonomy-${index + 1}`}>
                                {row.map((label, innerIndex) => {
                                  const domainKey = ['COGNITIVE', 'PSYCHOMOTOR', 'AFFECTIVE'][innerIndex]
                                  const value = label ? taxonomyCodes[`${domainKey}:${label}`] || '' : ''
                                  const domainEnabled = Boolean(taxonomySelection[domainKey])
                                  return (
                                    <React.Fragment key={`${domainKey}-${label || 'empty'}-${index + 1}`}>
                                      <CTableHeaderCell>{label || ''}</CTableHeaderCell>
                                      <CTableDataCell>
                                        <CFormInput
                                          value={value}
                                          disabled={!label || taxonomyLocked || !domainEnabled}
                                          onChange={(e) =>
                                            label
                                              ? setTaxonomyCodes((prev) => ({
                                                  ...prev,
                                                  [`${domainKey}:${label}`]: e.target.value,
                                                }))
                                              : undefined
                                          }
                                        />
                                      </CTableDataCell>
                                    </React.Fragment>
                                  )
                                })}
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <ArpButton
                            label="Edit"
                            icon="edit"
                            color="info"
                            onClick={() => setTaxonomyLocked(false)}
                            disabled={savingKey === 'taxonomy'}
                          />
                          <ArpButton
                            label="Save"
                            icon="save"
                            color="success"
                            onClick={saveTaxonomy}
                            disabled={savingKey === 'taxonomy' || taxonomyLocked}
                          />
                          <ArpButton
                            label="Cancel"
                            icon="cancel"
                            color="secondary"
                            onClick={() => {
                              seedFormsFromDetail(detail)
                              setTaxonomyLocked(Boolean(detail.completion?.taxonomy))
                            }}
                            disabled={savingKey === 'taxonomy'}
                          />
                        </div>
                      </CAccordionBody>
                    </CAccordionItem>

                    <CAccordionItem itemKey="correlation">
                      <CAccordionHeader>Correlation Configuration Entry</CAccordionHeader>
                      <CAccordionBody>
                        <CTable bordered responsive>
                          <CTableHead color="light">
                            <CTableRow>
                              <CTableHeaderCell>Parameter</CTableHeaderCell>
                              <CTableHeaderCell>Index</CTableHeaderCell>
                              <CTableHeaderCell>Value</CTableHeaderCell>
                              <CTableHeaderCell style={{ width: 100 }}>Action</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {correlationRows.map((row, index) => (
                              <CTableRow key={`correlation-${index + 1}`}>
                                <CTableDataCell>
                                  <CFormInput
                                    value={row.parameter}
                                    disabled={correlationLocked}
                                    onChange={(e) =>
                                      setCorrelationRows((prev) =>
                                        prev.map((item, idx) => (idx === index ? { ...item, parameter: e.target.value } : item)),
                                      )
                                    }
                                  />
                                </CTableDataCell>
                                <CTableDataCell>
                                  <CFormInput
                                    value={row.index}
                                    disabled={correlationLocked}
                                    onChange={(e) =>
                                      setCorrelationRows((prev) =>
                                        prev.map((item, idx) => (idx === index ? { ...item, index: e.target.value } : item)),
                                      )
                                    }
                                  />
                                </CTableDataCell>
                                <CTableDataCell>
                                  <CFormInput
                                    value={row.value}
                                    disabled={correlationLocked}
                                    onChange={(e) =>
                                      setCorrelationRows((prev) =>
                                        prev.map((item, idx) => (idx === index ? { ...item, value: e.target.value } : item)),
                                      )
                                    }
                                  />
                                </CTableDataCell>
                                <CTableDataCell className="text-center">
                                  <CButton
                                    color={index === correlationRows.length - 1 ? 'primary' : 'danger'}
                                    className="text-white"
                                    disabled={correlationLocked}
                                    onClick={() =>
                                      index === correlationRows.length - 1
                                        ? setCorrelationRows((prev) => [...prev, emptyCorrelationRow()])
                                        : setCorrelationRows((prev) => prev.filter((_, idx) => idx !== index))
                                    }
                                  >
                                    {index === correlationRows.length - 1 ? '+' : '-'}
                                  </CButton>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <ArpButton
                            label="Edit"
                            icon="edit"
                            color="info"
                            onClick={() => setCorrelationLocked(false)}
                            disabled={savingKey === 'correlation'}
                          />
                          <ArpButton
                            label="Save"
                            icon="save"
                            color="success"
                            onClick={saveCorrelation}
                            disabled={savingKey === 'correlation' || correlationLocked}
                          />
                          <ArpButton
                            label="Cancel"
                            icon="cancel"
                            color="secondary"
                            onClick={() => {
                              seedFormsFromDetail(detail)
                              setCorrelationLocked(Boolean(detail.completion?.correlation))
                            }}
                            disabled={savingKey === 'correlation'}
                          />
                        </div>
                      </CAccordionBody>
                    </CAccordionItem>

                    <CAccordionItem itemKey="mapAssessment">
                      <CAccordionHeader>Map &amp; Assessment Configuration Entry</CAccordionHeader>
                      <CAccordionBody>
                        <CTable bordered responsive>
                          <CTableHead color="light">
                            <CTableRow>
                              <CTableHeaderCell style={{ width: 100 }}>Select</CTableHeaderCell>
                              <CTableHeaderCell>Parameters</CTableHeaderCell>
                              <CTableHeaderCell>Remarks</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {mapAssessmentRows.map((row) => (
                              <CTableRow key={row.key}>
                                <CTableDataCell className="text-center">
                                  <CFormCheck
                                    checked={row.selected}
                                    disabled={mapAssessmentLocked}
                                    onChange={(e) =>
                                      setMapAssessmentRows((prev) =>
                                        prev.map((item) =>
                                          item.key === row.key ? { ...item, selected: e.target.checked } : item,
                                        ),
                                      )
                                    }
                                  />
                                </CTableDataCell>
                                <CTableDataCell>{row.label}</CTableDataCell>
                                <CTableDataCell>
                                  <CFormInput
                                    value={row.remarks}
                                    disabled={mapAssessmentLocked}
                                    onChange={(e) =>
                                      setMapAssessmentRows((prev) =>
                                        prev.map((item) =>
                                          item.key === row.key ? { ...item, remarks: e.target.value } : item,
                                        ),
                                      )
                                    }
                                  />
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                        <div className="d-flex justify-content-end gap-2 mt-3">
                          <ArpButton
                            label="Edit"
                            icon="edit"
                            color="info"
                            onClick={() => setMapAssessmentLocked(false)}
                            disabled={savingKey === 'mapAssessment'}
                          />
                          <ArpButton
                            label="Save"
                            icon="save"
                            color="success"
                            onClick={saveMapAssessment}
                            disabled={savingKey === 'mapAssessment' || mapAssessmentLocked}
                          />
                          <ArpButton
                            label="Cancel"
                            icon="cancel"
                            color="secondary"
                            onClick={() => {
                              seedFormsFromDetail(detail)
                              setMapAssessmentLocked(Boolean(detail.completion?.mapAssessment))
                            }}
                            disabled={savingKey === 'mapAssessment'}
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

export default ObeConfiguration
