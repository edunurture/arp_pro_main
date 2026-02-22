import React, { useEffect, useMemo, useState } from 'react'
import { CAlert, CCard, CCardBody, CCardHeader, CCol, CForm, CFormCheck, CFormInput, CFormLabel, CFormSelect, CRow } from '@coreui/react-pro'

import { ArpButton, ArpIconButton } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'
import api from '../../services/apiClient'

const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`
const letterIndex = (i) => String.fromCharCode(65 + i)

const sanitizeNumberText = (value) =>
  String(value ?? '')
    .replace(/[^\d.-]/g, '')
    .replace(/(?!^)-/g, '')

const toNullableInt = (value) => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : null
}
const toNullableNum = (value) => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}
const roundTo = (n, d = 2) => {
  const p = 10 ** d
  return Math.round((Number(n) + Number.EPSILON) * p) / p
}
const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const normalizeCredit = (credit) => {
  const n = toNullableNum(credit)
  if (n === null) return ''
  return Number.isInteger(n) ? String(Math.trunc(n)) : String(n)
}
const generateCode = ({ ciaWeight, eseWeight, credit }) => {
  const cia = toNullableInt(ciaWeight)
  const ese = toNullableInt(eseWeight)
  const c = normalizeCredit(credit)
  if (cia === null || ese === null || !c) return ''
  return `CIA${cia}+ESE${ese}+C${c}`
}

const evaluateExpression = (expression, valueMap = {}) => {
  const raw = String(expression || '').trim()
  if (!raw) return null
  let expr = raw.toUpperCase()
  const keys = Object.keys(valueMap).sort((a, b) => b.length - a.length)
  keys.forEach((k) => {
    const n = Number(valueMap[k])
    if (!Number.isFinite(n)) return
    expr = expr.replace(new RegExp(`\\b${escapeRegExp(k)}\\b`, 'g'), String(n))
  })
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) return null
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(`return (${expr})`)
    const out = Number(fn())
    return Number.isFinite(out) ? roundTo(out, 4) : null
  } catch {
    return null
  }
}

const createRow = (overrides = {}) => ({
  id: uid(),
  examination: '',
  minMarks: '0',
  maxMarks: '',
  ...overrides,
})

const createFormulaRow = (overrides = {}) => ({
  id: uid(),
  computationValue: 'Convert into',
  cacIndex: [],
  maxMarks: '',
  expression: '',
  total: '',
  ...overrides,
})

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const toBool = (v) => {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  const s = String(v ?? '').trim().toLowerCase()
  return ['true', '1', 'yes', 'y', 'on'].includes(s)
}

const extractComputeOptions = (payload = {}) => {
  const cfg = payload?.compute || payload?.rule || {}
  const opts = []
  if (toBool(cfg.totalComponents)) opts.push('Total')
  if (toBool(cfg.bestOfTwo)) opts.push('Best of Two')
  if (toBool(cfg.bestOfThree)) opts.push('Best of Three')
  if (toBool(cfg.average)) opts.push('Average')
  if (toBool(cfg.convertInto)) opts.push('Convert into')
  if (toBool(cfg.roundOff)) opts.push('Round Off')
  opts.push('Grand Total')
  return Array.from(new Set(opts))
}

const mapApiComponent = (c = {}) => ({
  id: c.id || uid(),
  cacIndex: String(c.cacIndex || '').trim(),
  examination: String(c.examination || '').trim(),
  minMarks: c.minMarks ?? '',
  maxMarks: c.maxMarks ?? '',
})

const mapApiRow = (r = {}) => {
  const components = Array.isArray(r.components) ? r.components.map(mapApiComponent) : []
  return {
    id: r.id,
    academicYearId: r.academicYearId || '',
    academicYear: String(r.academicYear || '-'),
    ciaAssessmentCode: String(r.ciaAssessmentCode || '').trim(),
    courseType: String(r.courseType || ''),
    ciaWeight: r?.pattern?.ciaWeight ?? '',
    eseWeight: r?.pattern?.eseWeight ?? '',
    totalWeight: r?.pattern?.totalWeight ?? '',
    credit: r?.pattern?.credit ?? '',
    evaluationFormula: Array.isArray(r?.pattern?.evaluationFormula) ? r.pattern.evaluationFormula : [],
    exams: components.length,
    status: r.status === false ? 'Inactive' : 'Active',
    components,
  }
}

export default function CIAComputationConfiguration() {
  const [isEdit, setIsEdit] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const [institutions, setInstitutions] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [institutionId, setInstitutionId] = useState('')
  const [academicYearId, setAcademicYearId] = useState('')
  const [courseTypeOptions, setCourseTypeOptions] = useState(['Theory', 'Practical', 'Theory+Practical'])

  const [ciaAssessmentCode, setCiaAssessmentCode] = useState('')
  const [courseType, setCourseType] = useState('Theory')
  const [ciaWeight, setCiaWeight] = useState('25')
  const [eseWeight, setEseWeight] = useState('75')
  const [totalWeight, setTotalWeight] = useState('100')
  const [credit, setCredit] = useState('4')

  const [cacRows, setCacRows] = useState([createRow()])
  const [formulaRows, setFormulaRows] = useState([createFormulaRow()])
  const [rows, setRows] = useState([])
  const [examOptions, setExamOptions] = useState([])
  const [computeValueOptions, setComputeValueOptions] = useState(['Convert into'])

  const showToast = (type, message) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 4500)
  }

  const selectedRow = rows.find((r) => String(r.id) === String(selectedId)) || null
  const formulaContribution = roundTo(formulaRows.reduce((sum, r) => sum + (toNullableNum(r.maxMarks) || 0), 0), 2)
  const ciaNum = toNullableNum(ciaWeight) || 0

  const resetForm = () => {
    setAcademicYearId('')
    setCiaAssessmentCode('')
    setCourseType('Theory')
    setCiaWeight('25')
    setEseWeight('75')
    setTotalWeight('100')
    setCredit('4')
    setCacRows([createRow()])
    setFormulaRows([createFormulaRow({ computationValue: computeValueOptions[0] || 'Convert into' })])
  }

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/api/setup/institution')
      const list = unwrapList(res)
      setInstitutions(list)
      if (!institutionId && list.length > 0) setInstitutionId(list[0].id)
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to load institutions'
      showToast('danger', msg)
    }
  }

  const loadAcademicYears = async (instId) => {
    if (!instId) return setAcademicYears([])
    try {
      const res = await api.get('/api/setup/academic-year', { params: { institutionId: instId } })
      setAcademicYears(unwrapList(res))
    } catch {
      setAcademicYears([])
    }
  }

  const loadCIAComputations = async (instId) => {
    if (!instId) return setRows([])
    setLoading(true)
    try {
      const res = await api.get('/api/setup/cia-computations', { params: { institutionId: instId } })
      setRows(unwrapList(res).map(mapApiRow))
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to load CIA computations'
      showToast('danger', msg)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const loadCourseTypes = async (instId) => {
    if (!instId) return setCourseTypeOptions(['Theory', 'Practical', 'Theory+Practical'])
    try {
      const res = await api.get('/api/setup/course', { params: { institutionId: instId } })
      const list = unwrapList(res)
      const options = Array.from(new Set(list.map((x) => String(x.courseType || '').trim()).filter(Boolean)))
      setCourseTypeOptions(options.length > 0 ? options : ['Theory', 'Practical', 'Theory+Practical'])
    } catch {
      setCourseTypeOptions(['Theory', 'Practical', 'Theory+Practical'])
    }
  }

  const loadCIAComponentExams = async (instId) => {
    if (!instId) {
      setExamOptions([])
      setComputeValueOptions(['Convert into'])
      return
    }
    try {
      const res = await api.get('/api/setup/cia-components', { params: { institutionId: instId } })
      const payload = res?.data?.data || {}
      const comps = Array.isArray(payload?.components) ? payload.components : []
      const unique = Array.from(new Set(comps.map((x) => String(x.examName || '').trim()).filter(Boolean)))
      setExamOptions(unique)
      setComputeValueOptions(extractComputeOptions(payload))
    } catch {
      setExamOptions([])
      setComputeValueOptions(['Convert into'])
    }
  }

  useEffect(() => {
    loadInstitutions()
  }, [])

  useEffect(() => {
    setSelectedId(null)
    setIsEdit(false)
    resetForm()
    loadAcademicYears(institutionId)
    loadCourseTypes(institutionId)
    loadCIAComputations(institutionId)
    loadCIAComponentExams(institutionId)
  }, [institutionId])

  useEffect(() => {
    if (!isEdit) return
    if (ciaAssessmentCode.trim()) return
    const generated = generateCode({ ciaWeight, eseWeight, credit })
    if (generated) setCiaAssessmentCode(generated)
  }, [ciaWeight, eseWeight, credit, isEdit, ciaAssessmentCode])

  useEffect(() => {
    const cia = toNullableInt(ciaWeight)
    const ese = toNullableInt(eseWeight)
    if (cia === null || ese === null) {
      setTotalWeight('')
      return
    }
    setTotalWeight(String(cia + ese))
  }, [ciaWeight, eseWeight])

  useEffect(() => {
    if (!Array.isArray(computeValueOptions) || computeValueOptions.length === 0) return
    setFormulaRows((prev) =>
      prev.map((r) => ({
        ...r,
        computationValue:
          computeValueOptions.includes(r.computationValue) ? r.computationValue : computeValueOptions[0],
      })),
    )
  }, [computeValueOptions])

  const addRowAfter = (index) => {
    setCacRows((prev) => {
      const next = [...prev]
      next.splice(index + 1, 0, createRow())
      return next
    })
  }
  const removeRowAt = (index) => {
    setCacRows((prev) => {
      if (prev.length <= 1) return prev
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }
  const updateRow = (id, key, value) => {
    setCacRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  }

  const addFormulaRow = () =>
    setFormulaRows((prev) => [...prev, createFormulaRow({ computationValue: computeValueOptions[0] || 'Convert into' })])
  const removeFormulaRow = (id) =>
    setFormulaRows((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((r) => r.id !== id)
    })
  const updateFormulaRow = (id, key, value) => {
    setFormulaRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)))
  }

  const onFormulaComputationChange = (id, value) => {
    setFormulaRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const nextVal = String(value || '')
        const upper = nextVal.trim().toUpperCase()
        if (upper === 'GRAND TOTAL') {
          return { ...r, computationValue: nextVal, cacIndex: [], expression: r.expression || '' }
        }
        if (upper === 'CONVERT INTO') {
          const selected = Array.isArray(r.cacIndex) ? r.cacIndex : []
          return { ...r, computationValue: nextVal, cacIndex: selected.length > 0 ? [selected[0]] : [] }
        }
        return { ...r, computationValue: nextVal, cacIndex: Array.isArray(r.cacIndex) ? r.cacIndex : [] }
      }),
    )
  }

  const getECI = (formulaRowIndex) => letterIndex(cacRows.length + formulaRowIndex)

  const normalizeCompValue = (v) => String(v || '').trim().toUpperCase()
  const isGrandTotal = (row) => normalizeCompValue(row.computationValue) === 'GRAND TOTAL'
  const isMultiSelectComp = (row) => {
    const v = normalizeCompValue(row.computationValue)
    return v === 'BEST OF TWO' || v === 'BEST OF THREE' || v === 'AVERAGE' || v === 'TOTAL'
  }

  const getFormulaValueMap = () => {
    const map = {}
    cacRows.forEach((r, idx) => {
      const key = letterIndex(idx)
      const v = toNullableNum(r.maxMarks)
      if (v !== null) map[key] = v
    })
    formulaRows.forEach((r, idx) => {
      if (isGrandTotal(r)) return
      const key = getECI(idx)
      const v = toNullableNum(r.maxMarks)
      if (v !== null) map[key] = v
    })
    return map
  }

  const getGrandTotalFromExpression = () => {
    const grand = formulaRows.find((r) => isGrandTotal(r))
    if (!grand) return null
    return evaluateExpression(grand.expression, getFormulaValueMap())
  }

  const formulaValidationError = () => {
    let hasGrandTotal = false
    const allowed = new Set(cacRows.map((_, idx) => letterIndex(idx)))

    for (let i = 0; i < formulaRows.length; i += 1) {
      const row = formulaRows[i]
      const rowNo = i + 1
      const v = normalizeCompValue(row.computationValue)
      const selected = Array.isArray(row.cacIndex) ? row.cacIndex.filter(Boolean) : []

      if (v === 'GRAND TOTAL') {
        hasGrandTotal = true
        if (!String(row.expression || '').trim()) return `Formula Row ${rowNo}: Expression is required for Grand Total`
        const computed = evaluateExpression(row.expression, getFormulaValueMap())
        if (computed === null) return `Formula Row ${rowNo}: Invalid expression`
        continue
      }

      if (selected.length === 0) return `Formula Row ${rowNo}: Select CAC Index`
      if (selected.some((x) => !allowed.has(String(x).toUpperCase()))) return `Formula Row ${rowNo}: Invalid CAC/ECI Index selected`
      if (v === 'CONVERT INTO' && selected.length !== 1) return `Formula Row ${rowNo}: Convert into must select exactly 1 CAC Index`
      if (v === 'BEST OF TWO' && selected.length !== 2) return `Formula Row ${rowNo}: Best of Two must select exactly 2 CAC Index`
      if (v === 'BEST OF THREE' && selected.length !== 3) return `Formula Row ${rowNo}: Best of Three must select exactly 3 CAC Index`
      if (!['CONVERT INTO', 'BEST OF TWO', 'BEST OF THREE', 'AVERAGE', 'TOTAL'].includes(v)) {
        return `Formula Row ${rowNo}: Unsupported Computation Value`
      }

      const m = toNullableNum(row.maxMarks)
      if (m === null) return `Formula Row ${rowNo}: Maximum Marks is required`
      allowed.add(getECI(i))
    }

    if (!hasGrandTotal) return 'Grand Total row is required in Evaluation Formula.'
    const grandTotal = getGrandTotalFromExpression()
    if (grandTotal === null) return 'Grand Total expression is invalid.'
    if (roundTo(grandTotal, 2) !== roundTo(ciaNum, 2)) {
      return `Grand Total (${roundTo(grandTotal, 2)}) must equal CIA Marks (${roundTo(ciaNum, 2)}).`
    }
    return ''
  }

  const onAddNew = () => {
    if (!institutionId) return showToast('danger', 'Please configure Institution first.')
    setIsEdit(true)
    setSelectedId(null)
    resetForm()
  }
  const onCancel = () => {
    setIsEdit(false)
    resetForm()
  }

  const onSave = async (e) => {
    e.preventDefault()
    if (!isEdit || !institutionId) return

    const ciaN = toNullableInt(ciaWeight)
    const eseN = toNullableInt(eseWeight)
    const totalN = toNullableInt(totalWeight)
    const creditN = toNullableNum(credit)
    if (ciaN === null || eseN === null || totalN === null || creditN === null) {
      return showToast('danger', 'CIA/ESE/Total/Credit values are required.')
    }
    if (ciaN + eseN !== totalN) return showToast('danger', 'CIA + ESE must equal Total.')

    const normalizedRows = cacRows
      .map((r, idx) => ({
        cacIndex: letterIndex(idx),
        examination: String(r.examination || '').trim(),
        minMarks: toNullableInt(r.minMarks),
        maxMarks: toNullableInt(r.maxMarks),
      }))
      .filter((r) => r.examination)

    if (normalizedRows.length === 0) return showToast('danger', 'Please select at least one Examination.')
    if (normalizedRows.some((r) => r.maxMarks === null)) return showToast('danger', 'Maximum Marks is required for all rows.')

    const normalizedFormula = formulaRows
      .map((r, idx) => ({
        evaluation: getECI(idx),
        computationValue: String(r.computationValue || 'Convert into').trim(),
        cacIndex: Array.isArray(r.cacIndex) ? r.cacIndex : [],
        maxMarks: toNullableNum(r.maxMarks),
        expression: String(r.expression || '').trim(),
        total: toNullableNum(r.total),
      }))
      .filter((r) => r.cacIndex.length > 0 || r.expression || r.maxMarks !== null || r.total !== null)

    if (normalizedFormula.length === 0) return showToast('danger', 'Please configure Evaluation Formula.')
    const formulaErr = formulaValidationError()
    if (formulaErr) return showToast('danger', formulaErr)

    const payload = {
      institutionId,
      academicYearId: academicYearId || null,
      ciaAssessmentCode: ciaAssessmentCode.trim() || generateCode({ ciaWeight, eseWeight, credit }),
      pattern: {
        courseType: courseType.trim(),
        ciaWeight: ciaN,
        eseWeight: eseN,
        totalWeight: totalN,
        credit: creditN,
        evaluationFormula: normalizedFormula,
      },
      components: normalizedRows,
    }

    setSaving(true)
    try {
      if (selectedId) {
        await api.put(`/api/setup/cia-computations/${selectedId}`, payload)
        showToast('success', 'CIA computation updated successfully.')
      } else {
        await api.post('/api/setup/cia-computations', payload)
        showToast('success', 'CIA computation created successfully.')
      }
      setIsEdit(false)
      resetForm()
      await loadCIAComputations(institutionId)
    } catch (err) {
      const details = err?.response?.data?.details
      const detailText = Array.isArray(details) ? ` ${details.join(', ')}` : details ? ` ${details}` : ''
      const msg = err?.response?.data?.error || err?.message || 'Failed to save CIA computation.'
      showToast('danger', `${msg}${detailText}`)
    } finally {
      setSaving(false)
    }
  }

  const onView = () => {
    if (!selectedRow) return
    setIsEdit(false)
    setAcademicYearId(selectedRow.academicYearId || '')
    setCiaAssessmentCode(selectedRow.ciaAssessmentCode || '')
    setCourseType(selectedRow.courseType || 'Theory')
    setCiaWeight(String(selectedRow.ciaWeight ?? '25'))
    setEseWeight(String(selectedRow.eseWeight ?? '75'))
    setTotalWeight(String(selectedRow.totalWeight ?? '100'))
    setCredit(String(selectedRow.credit ?? '4'))

    const loadedRows = (selectedRow.components || []).map((x) =>
      createRow({
        id: x.id || uid(),
        examination: x.examination || '',
        minMarks: x.minMarks ?? '',
        maxMarks: x.maxMarks ?? '',
      }),
    )
    setCacRows(loadedRows.length > 0 ? loadedRows : [createRow()])

    const loadedFormula = (selectedRow.evaluationFormula || []).map((f) =>
      createFormulaRow({
        computationValue: f.computationValue || 'Convert into',
        cacIndex: Array.isArray(f.cacIndex) ? f.cacIndex : f.cacIndex ? [String(f.cacIndex)] : [],
        maxMarks: f.maxMarks ?? '',
        expression: f.expression || '',
        total: f.total ?? '',
      }),
    )
    setFormulaRows(loadedFormula.length > 0 ? loadedFormula : [createFormulaRow()])
  }

  const onEdit = () => {
    if (!selectedRow) return
    setIsEdit(true)
    setAcademicYearId(selectedRow.academicYearId || '')
    setCiaAssessmentCode(selectedRow.ciaAssessmentCode || '')
    setCourseType(selectedRow.courseType || 'Theory')
    setCiaWeight(String(selectedRow.ciaWeight ?? '25'))
    setEseWeight(String(selectedRow.eseWeight ?? '75'))
    setTotalWeight(String(selectedRow.totalWeight ?? '100'))
    setCredit(String(selectedRow.credit ?? '4'))

    const loadedRows = (selectedRow.components || []).map((x) =>
      createRow({
        id: x.id || uid(),
        examination: x.examination || '',
        minMarks: x.minMarks ?? '',
        maxMarks: x.maxMarks ?? '',
      }),
    )
    setCacRows(loadedRows.length > 0 ? loadedRows : [createRow()])

    const loadedFormula = (selectedRow.evaluationFormula || []).map((f) =>
      createFormulaRow({
        computationValue: f.computationValue || 'Convert into',
        cacIndex: Array.isArray(f.cacIndex) ? f.cacIndex : f.cacIndex ? [String(f.cacIndex)] : [],
        maxMarks: f.maxMarks ?? '',
        expression: f.expression || '',
        total: f.total ?? '',
      }),
    )
    setFormulaRows(loadedFormula.length > 0 ? loadedFormula : [createFormulaRow()])
  }

  const onDelete = async () => {
    if (!selectedRow) return
    const ok = window.confirm('Are you sure you want to delete this computation code?')
    if (!ok) return
    try {
      await api.delete(`/api/setup/cia-computations/${selectedRow.id}`)
      showToast('success', 'CIA computation deleted successfully.')
      setSelectedId(null)
      await loadCIAComputations(institutionId)
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to delete CIA computation.'
      showToast('danger', msg)
    }
  }

  const columns = useMemo(
    () => [
      { key: 'academicYear', label: 'Academic Year', sortable: true, width: 160, align: 'center' },
      { key: 'ciaAssessmentCode', label: 'CIA Assessment Code', sortable: true, width: 190, align: 'center' },
      { key: 'courseType', label: 'Course Type', sortable: true, width: 130, align: 'center' },
      { key: 'exams', label: 'No. of Exams', sortable: true, width: 130, align: 'center', sortType: 'number' },
      { key: 'status', label: 'Status', sortable: true, width: 120, align: 'center' },
    ],
    [],
  )

  const headerActions = (
    <div className="d-flex gap-2 align-items-center">
      <ArpIconButton icon="view" color="purple" title="View Record" onClick={onView} disabled={!selectedId} />
      <ArpIconButton icon="edit" color="info" title="Edit Record" onClick={onEdit} disabled={!selectedId} />
      <ArpIconButton icon="delete" color="danger" title="Delete Record" onClick={onDelete} disabled={!selectedId} />
    </div>
  )

  const getFormulaIndexOptions = (formulaIdx) => [
    ...cacRows.map((_, idx) => letterIndex(idx)),
    ...Array.from({ length: formulaIdx }, (_, i) => getECI(i)),
  ]

  const formulaErrLive = isEdit ? formulaValidationError() : ''
  const grandTotalDisplay = getGrandTotalFromExpression()

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
            <strong>CIA Computation</strong>
            <ArpButton label="Add New" icon="add" color="purple" onClick={onAddNew} />
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>CIA Computation Code Generate for</strong>
          </CCardHeader>
          <CCardBody>
            <CForm onSubmit={onSave}>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Institution</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
                    <option value="">Select Institution</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} disabled={!isEdit}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.academicYearLabel || (x.academicYear ? `${x.academicYear}${x.semesterCategory ? ` (${x.semesterCategory})` : ''}` : x.name || x.id)}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Course Type</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={courseType} onChange={(e) => setCourseType(e.target.value)} disabled={!isEdit}>
                    {courseTypeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}><CFormLabel>CIA Assessment Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput value={ciaAssessmentCode} onChange={(e) => setCiaAssessmentCode(e.target.value)} disabled={!isEdit} />
                </CCol>

                <CCol md={2}><CFormLabel>CIA</CFormLabel><CFormInput value={ciaWeight} onChange={(e) => setCiaWeight(sanitizeNumberText(e.target.value))} disabled={!isEdit} /></CCol>
                <CCol md={2}><CFormLabel>ESE</CFormLabel><CFormInput value={eseWeight} onChange={(e) => setEseWeight(sanitizeNumberText(e.target.value))} disabled={!isEdit} /></CCol>
                <CCol md={2}><CFormLabel>Total</CFormLabel><CFormInput value={totalWeight} disabled /></CCol>
                <CCol md={2}><CFormLabel>Credit</CFormLabel><CFormInput value={credit} onChange={(e) => setCredit(sanitizeNumberText(e.target.value))} disabled={!isEdit} /></CCol>
                <CCol md={4} className="d-flex align-items-end">
                  <small className="text-muted">
                    Formula Max Sum: <strong>{formulaContribution}</strong> / CIA {ciaWeight || '-'}
                  </small>
                </CCol>

                <CCol xs={12}>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle mb-2">
                      <thead>
                        <tr>
                          <th style={{ width: 90, textAlign: 'center' }}>CAC</th>
                          <th>Name of the Examination</th>
                          <th style={{ width: 150, textAlign: 'center' }}>Min Marks</th>
                          <th style={{ width: 150, textAlign: 'center' }}>Max Marks</th>
                          <th style={{ width: 90, textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cacRows.map((r, idx) => {
                          const isLast = idx === cacRows.length - 1
                          return (
                            <tr key={r.id}>
                              <td className="text-center"><strong>{letterIndex(idx)}</strong></td>
                              <td>
                                <CFormSelect value={r.examination} onChange={(e) => updateRow(r.id, 'examination', e.target.value)} disabled={!isEdit}>
                                  <option value="">Select Examination</option>
                                  {examOptions.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                  ))}
                                </CFormSelect>
                              </td>
                              <td><CFormInput value={r.minMarks} onChange={(e) => updateRow(r.id, 'minMarks', sanitizeNumberText(e.target.value))} disabled={!isEdit} /></td>
                              <td><CFormInput value={r.maxMarks} onChange={(e) => updateRow(r.id, 'maxMarks', sanitizeNumberText(e.target.value))} disabled={!isEdit} /></td>
                              <td className="text-center">
                                <ArpIconButton
                                  icon={isLast ? 'add' : 'delete'}
                                  color={isLast ? 'success' : 'danger'}
                                  title={isLast ? 'Add Row' : 'Remove Row'}
                                  onClick={isLast ? () => addRowAfter(idx) : () => removeRowAt(idx)}
                                  disabled={!isEdit || (!isLast && cacRows.length <= 1)}
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CCol>

                <CCol xs={12}>
                  <CCard className="mb-2">
                    <CCardHeader className="d-flex justify-content-between align-items-center">
                      <strong>Evaluation Formula</strong>
                      <ArpButton label="+Add Formula Row" color="success" type="button" onClick={addFormulaRow} disabled={!isEdit} />
                    </CCardHeader>
                    <CCardBody>
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle mb-0">
                          <thead>
                            <tr>
                              <th style={{ width: 160 }}>ECI</th>
                              <th style={{ width: 170 }}>Computation Values</th>
                              <th style={{ width: 150 }}>CAC Index</th>
                              <th style={{ width: 170 }}>Maximum Marks</th>
                              <th>Expression</th>
                              <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formulaRows.map((r, idx) => (
                              <tr key={r.id}>
                                <td>
                                  <CFormInput value={getECI(idx)} disabled />
                                </td>
                                <td>
                                  <CFormSelect value={r.computationValue} onChange={(e) => onFormulaComputationChange(r.id, e.target.value)} disabled={!isEdit}>
                                    {computeValueOptions.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </CFormSelect>
                                </td>
                                <td>
                                  {isMultiSelectComp(r) ? (
                                    <div className="d-flex flex-wrap gap-2">
                                      {getFormulaIndexOptions(idx).map((opt) => {
                                        const selected = Array.isArray(r.cacIndex) ? r.cacIndex : []
                                        const checked = selected.includes(opt)
                                        return (
                                          <CFormCheck
                                            key={`${r.id}_${opt}`}
                                            label={opt}
                                            checked={checked}
                                            disabled={!isEdit || isGrandTotal(r)}
                                            onChange={(e) => {
                                              const next = e.target.checked
                                                ? Array.from(new Set([...(selected || []), opt]))
                                                : (selected || []).filter((x) => x !== opt)
                                              updateFormulaRow(r.id, 'cacIndex', next)
                                            }}
                                          />
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <CFormSelect
                                      value={Array.isArray(r.cacIndex) ? r.cacIndex[0] || '' : ''}
                                      onChange={(e) => updateFormulaRow(r.id, 'cacIndex', e.target.value ? [e.target.value] : [])}
                                      disabled={!isEdit || isGrandTotal(r)}
                                    >
                                      <option value="">Select Index</option>
                                      {getFormulaIndexOptions(idx).map((opt) => (
                                        <option key={`${r.id}_${opt}`} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </CFormSelect>
                                  )}
                                </td>
                                <td>
                                  <CFormInput
                                    value={isGrandTotal(r) ? String(grandTotalDisplay ?? '') : r.maxMarks}
                                    onChange={(e) => updateFormulaRow(r.id, 'maxMarks', sanitizeNumberText(e.target.value))}
                                    disabled={!isEdit || isGrandTotal(r)}
                                  />
                                </td>
                                <td>
                                  <CFormInput
                                    value={r.expression}
                                    onChange={(e) => updateFormulaRow(r.id, 'expression', e.target.value)}
                                    disabled={!isEdit || !isGrandTotal(r)}
                                    placeholder={isGrandTotal(r) ? 'e.g. I + J + K + D + E' : 'Enabled only for Grand Total'}
                                  />
                                </td>
                                <td className="text-center">
                                  <ArpIconButton icon="delete" color="danger" title="Remove Row" onClick={() => removeFormulaRow(r.id)} disabled={!isEdit || formulaRows.length <= 1} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CCardBody>
                  </CCard>
                </CCol>

                <CCol xs={12}>
                  <small className={formulaErrLive ? 'text-danger' : 'text-success'}>
                    Grand Total: <strong>{grandTotalDisplay ?? '-'}</strong>
                    {formulaErrLive ? ` | ${formulaErrLive}` : ''}
                  </small>
                </CCol>

                <CCol xs={12} className="d-flex justify-content-end gap-2">
                  <ArpButton label={saving ? 'Saving...' : 'Save'} icon="save" color="success" type="submit" disabled={!isEdit || saving || Boolean(formulaErrLive)} />
                  <ArpButton label="Cancel" icon="cancel" color="secondary" type="button" onClick={onCancel} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        <ArpDataTable
          title="COMPUTATION CODES"
          rows={rows}
          columns={columns}
          loading={loading}
          headerActions={headerActions}
          selection={{ type: 'radio', selected: selectedId, onChange: (value) => setSelectedId(value), key: 'id', headerLabel: 'Select', width: 60, name: 'ciaComputationSelect' }}
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
