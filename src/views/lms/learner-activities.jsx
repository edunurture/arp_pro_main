import React, { useMemo, useState } from 'react'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react-pro'
import { ArpButton, ArpDataTable, ArpIconButton } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'

const initialScope = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
}

const initialProgrammeForm = {
  learnerCategoryId: '',
  programmeDateFrom: '',
  programmeDateTo: '',
  title: '',
  description: '',
  remarks: '',
  status: 'SCHEDULED',
  file: null,
}

const LabelCol = ({ children }) => (
  <CCol md={3} className="d-flex align-items-center">
    <CFormLabel className="mb-0">{children}</CFormLabel>
  </CCol>
)
const InputCol = ({ children }) => <CCol md={3}>{children}</CCol>

const LearnerActivities = () => {
  const [scope, setScope] = useState(initialScope)
  const [classId, setClassId] = useState('')
  const [facultyId, setFacultyId] = useState('')
  const [assessmentName, setAssessmentName] = useState('')
  const [categorizedOn, setCategorizedOn] = useState(new Date().toISOString().slice(0, 10))

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [classes, setClasses] = useState([])
  const [faculties, setFaculties] = useState([])

  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState({ id: '', code: '', name: '' })

  const [studentRows, setStudentRows] = useState([])
  const [programmesRows, setProgrammesRows] = useState([])
  const [selectedProgrammeId, setSelectedProgrammeId] = useState(null)
  const [reportRows, setReportRows] = useState([])
  const [reportCategoryId, setReportCategoryId] = useState('')

  const [programmeModalOpen, setProgrammeModalOpen] = useState(false)
  const [programmeModalMode, setProgrammeModalMode] = useState('NEW')
  const [programmeForm, setProgrammeForm] = useState(initialProgrammeForm)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(scope.academicYearId)) || null,
    [academicYears, scope.academicYearId],
  )
  const semesterOptions = useMemo(() => semesterOptionsFromAcademicYear(selectedAcademicYear), [selectedAcademicYear])

  const scopeReady = useMemo(
    () =>
      Boolean(
        scope.institutionId &&
          scope.departmentId &&
          scope.programmeId &&
          scope.regulationId &&
          scope.academicYearId &&
          scope.batchId &&
          scope.semester,
      ),
    [scope],
  )

  React.useEffect(() => {
    ;(async () => {
      try {
        const [ins, cats] = await Promise.all([lmsService.listInstitutions(), lmsService.listLearnerCategories()])
        setInstitutions(ins)
        setCategories(cats)
      } catch {
        setError('Failed to load learner activities masters')
      }
    })()
  }, [])

  const setCleanState = () => {
    setInfo('')
    setError('')
  }

  const loadProgrammes = async () => {
    if (!scopeReady || !classId) return
    const rows = await lmsService.listLearnerProgrammes(scope, { classId, facultyId: facultyId || undefined })
    setProgrammesRows(Array.isArray(rows) ? rows : [])
    setSelectedProgrammeId(null)
  }

  const onScopeChange = (key) => async (e) => {
    const value = e.target.value
    setCleanState()

    if (key === 'institutionId') {
      setScope({ ...initialScope, institutionId: value })
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      setClasses([])
      setFaculties([])
      setClassId('')
      setFacultyId('')
      setStudentRows([])
      setProgrammesRows([])
      if (!value) return
      try {
        const [d, ay, b] = await Promise.all([
          lmsService.listDepartments(value),
          lmsService.listAcademicYears(value),
          lmsService.listBatches(value),
        ])
        setDepartments(d)
        setAcademicYears(ay)
        setBatches(b)
      } catch {
        setError('Failed to load institution scope')
      }
      return
    }

    if (key === 'departmentId') {
      setScope((p) => ({ ...p, departmentId: value, programmeId: '', regulationId: '' }))
      setProgrammes([])
      setRegulations([])
      setClasses([])
      setFaculties([])
      setClassId('')
      setFacultyId('')
      if (!value || !scope.institutionId) return
      try {
        const prg = await lmsService.listProgrammes(scope.institutionId, value)
        setProgrammes(prg)
      } catch {
        setError('Failed to load department scope')
      }
      return
    }

    if (key === 'programmeId') {
      setScope((p) => ({ ...p, programmeId: value, regulationId: '' }))
      setRegulations([])
      setClasses([])
      setClassId('')
      if (!value || !scope.institutionId) return
      try {
        const [regs, cls] = await Promise.all([
          lmsService.listRegulations(scope.institutionId, value),
          lmsService.listClasses({ institutionId: scope.institutionId, departmentId: scope.departmentId, programmeId: value }),
        ])
        setRegulations(regs)
        setClasses(cls)
      } catch {
        setError('Failed to load programme scope')
      }
      return
    }

    if (key === 'academicYearId') {
      setScope((p) => ({ ...p, academicYearId: value, semester: '' }))
      setFaculties([])
      setFacultyId('')
      if (!value || !scope.institutionId || !scope.departmentId) return
      try {
        setFaculties(
          await lmsService.listFaculties({
            institutionId: scope.institutionId,
            departmentId: scope.departmentId,
            academicYearId: value,
          }),
        )
      } catch {
        setError('Failed to load faculty list')
      }
      return
    }

    setScope((p) => ({ ...p, [key]: value }))
  }

  const loadStudentCategorizations = async () => {
    setCleanState()
    if (!scopeReady || !classId || !facultyId) {
      setError('Select complete scope, class and faculty')
      return
    }
    setLoading(true)
    try {
      const rows = await lmsService.listStudentCategorizations(scope, { classId, facultyId })
      setStudentRows(Array.isArray(rows) ? rows : [])
      await loadProgrammes()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load student categorizations')
    } finally {
      setLoading(false)
    }
  }

  const setStudentValue = (studentId, key, value) => {
    setStudentRows((prev) => prev.map((row) => (row.studentId === studentId ? { ...row, [key]: value } : row)))
  }

  const saveCategorizations = async () => {
    setCleanState()
    if (!scopeReady || !classId || !facultyId) {
      setError('Select complete scope, class and faculty')
      return
    }
    const payloadRows = studentRows
      .filter((x) => x.learnerCategoryId)
      .map((x) => ({
        studentId: x.studentId,
        learnerCategoryId: x.learnerCategoryId,
        assessmentScore: x.assessmentScore ?? '',
        remarks: x.remarks ?? '',
      }))
    if (!payloadRows.length) {
      setError('Assign learner category for at least one student')
      return
    }

    setSaving(true)
    try {
      await lmsService.saveStudentCategorizations(scope, {
        classId,
        facultyId,
        assessmentName,
        categorizedOn,
        studentCategories: payloadRows,
      })
      setInfo('Student categorizations saved successfully')
      await loadStudentCategorizations()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save student categorizations')
    } finally {
      setSaving(false)
    }
  }

  const onAddCategory = () => {
    setCategoryForm({ id: '', code: '', name: '' })
    setCategoryModalOpen(true)
  }

  const onEditCategory = () => {
    const row = categories.find((x) => String(x.id) === String(selectedCategoryId))
    if (!row) return
    setCategoryForm({ id: row.id, code: row.code || '', name: row.name || '' })
    setCategoryModalOpen(true)
  }

  const onSaveCategory = async () => {
    setCleanState()
    const payload = { code: categoryForm.code, name: categoryForm.name }
    if (!payload.code || !payload.name) {
      setError('Category code and name are required')
      return
    }
    setSaving(true)
    try {
      if (categoryForm.id) await lmsService.updateLearnerCategory(categoryForm.id, payload)
      else await lmsService.createLearnerCategory(payload)
      setCategoryModalOpen(false)
      setCategories(await lmsService.listLearnerCategories())
      setInfo('Learner category saved')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save learner category')
    } finally {
      setSaving(false)
    }
  }

  const onDeleteCategory = async () => {
    if (!selectedCategoryId) return
    if (!window.confirm('Delete selected learner category?')) return
    setSaving(true)
    try {
      await lmsService.deleteLearnerCategory(selectedCategoryId)
      setCategories(await lmsService.listLearnerCategories())
      setSelectedCategoryId(null)
      setInfo('Learner category deleted')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete learner category')
    } finally {
      setSaving(false)
    }
  }

  const selectedProgramme = useMemo(
    () => programmesRows.find((x) => String(x.id) === String(selectedProgrammeId)) || null,
    [programmesRows, selectedProgrammeId],
  )

  const reportCategoryName = useMemo(
    () => categories.find((x) => String(x.id) === String(reportCategoryId))?.name || '',
    [categories, reportCategoryId],
  )

  const reportTitle = useMemo(
    () =>
      `Learner Category-wise Student List${reportCategoryName ? ` - ${reportCategoryName}` : ''}${assessmentName ? ` (${assessmentName})` : ''}`,
    [reportCategoryName, assessmentName],
  )

  const openProgrammeModal = (mode) => {
    if (mode === 'NEW') {
      setProgrammeForm(initialProgrammeForm)
      setProgrammeModalMode('NEW')
      setProgrammeModalOpen(true)
      return
    }
    if (!selectedProgramme) return
    setProgrammeForm({
      learnerCategoryId: selectedProgramme.learnerCategoryId || '',
      programmeDateFrom: selectedProgramme.programmeDateFrom || '',
      programmeDateTo: selectedProgramme.programmeDateTo || '',
      title: selectedProgramme.title || '',
      description: selectedProgramme.description || '',
      remarks: selectedProgramme.remarks || '',
      status: selectedProgramme.status || 'SCHEDULED',
      file: null,
    })
    setProgrammeModalMode(mode)
    setProgrammeModalOpen(true)
  }

  const saveProgramme = async () => {
    setCleanState()
    if (!scopeReady || !classId || !facultyId) return setError('Select complete scope, class and faculty')
    if (!programmeForm.learnerCategoryId || !programmeForm.programmeDateFrom || !programmeForm.title) {
      return setError('Programme date, learner category and title are required')
    }

    setSaving(true)
    try {
      const payload = { ...programmeForm, classId, facultyId }
      if (programmeModalMode === 'EDIT' && selectedProgramme) {
        await lmsService.updateLearnerProgramme(selectedProgramme.id, scope, payload)
      } else {
        await lmsService.createLearnerProgramme(scope, payload)
      }
      setProgrammeModalOpen(false)
      await loadProgrammes()
      setInfo('Learner programme saved')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save learner programme')
    } finally {
      setSaving(false)
    }
  }

  const deleteProgramme = async () => {
    if (!selectedProgramme) return
    if (!window.confirm('Delete selected learner programme?')) return
    setSaving(true)
    try {
      await lmsService.deleteLearnerProgramme(selectedProgramme.id, scope, { facultyId })
      await loadProgrammes()
      setInfo('Learner programme deleted')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete learner programme')
    } finally {
      setSaving(false)
    }
  }

  const downloadProgrammeDocument = () => {
    setCleanState()
    if (!selectedProgramme) return
    if (!selectedProgramme.supportDocPath) {
      setError('No document available for selected programme')
      return
    }
    const a = document.createElement('a')
    a.href = selectedProgramme.supportDocPath
    a.download = selectedProgramme.supportDocName || 'learner-programme-document'
    a.target = '_blank'
    a.rel = 'noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setInfo(`Document download started: ${selectedProgramme.supportDocName || 'learner-programme-document'}`)
  }

  const loadCategoryWiseStudents = async () => {
    setCleanState()
    if (!scopeReady || !classId || !facultyId) return setError('Select complete scope, class and faculty')
    const targetCategoryId = reportCategoryId || selectedProgramme?.learnerCategoryId || ''
    if (!targetCategoryId) return setError('Select learner category or select a programme row first')
    setLoading(true)
    try {
      const rows = await lmsService.listStudentCategorizations(scope, { classId, facultyId })
      const filtered = (Array.isArray(rows) ? rows : []).filter(
        (r) => String(r.learnerCategoryId || '') === String(targetCategoryId),
      )
      setReportRows(filtered)
      setReportCategoryId(targetCategoryId)
      if (!filtered.length) setInfo('No students found for selected learner category')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load learner category-wise students')
    } finally {
      setLoading(false)
    }
  }

  const safeCell = (v) => String(v ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const getReportTableHtml = () => `
    <html>
      <head>
        <title>${safeCell(reportTitle)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h2 { margin: 0 0 4px; }
          .meta { margin: 0 0 12px; color: #555; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #cfcfcf; padding: 8px; font-size: 12px; text-align: left; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h2>${safeCell(reportTitle)}</h2>
        <div class="meta">Generated On: ${new Date().toLocaleString()}</div>
        <table>
          <thead>
            <tr>
              <th>Register No</th>
              <th>Student Name</th>
              <th>Learner Category</th>
              <th>Assessment Score</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${reportRows
              .map(
                (r) => `
                  <tr>
                    <td>${safeCell(r.registerNumber)}</td>
                    <td>${safeCell(r.firstName)}</td>
                    <td>${safeCell(r.learnerCategoryName)}</td>
                    <td>${safeCell(r.assessmentScore)}</td>
                    <td>${safeCell(r.remarks)}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const exportReportXlsx = async () => {
    if (!reportRows.length) return setError('No learner category-wise students to export')
    try {
      const mod = await import('exceljs')
      const ExcelJS = mod.default || mod
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Learner Category Students')
      ws.addRow([reportTitle])
      ws.mergeCells(1, 1, 1, 5)
      ws.getRow(1).font = { bold: true, size: 12 }
      ws.addRow(['Register No', 'Student Name', 'Learner Category', 'Assessment Score', 'Remarks'])
      ws.getRow(2).font = { bold: true }
      reportRows.forEach((r) =>
        ws.addRow([r.registerNumber || '', r.firstName || '', r.learnerCategoryName || '', r.assessmentScore ?? '', r.remarks || '']),
      )
      ws.columns = [{ width: 18 }, { width: 28 }, { width: 24 }, { width: 18 }, { width: 34 }]
      const buf = await wb.xlsx.writeBuffer()
      downloadBlob(
        new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `Learner_Category_Students_${new Date().toISOString().slice(0, 10)}.xlsx`,
      )
    } catch {
      setError('Failed to export XLSX')
    }
  }

  const exportReportDoc = () => {
    if (!reportRows.length) return setError('No learner category-wise students to export')
    const html = getReportTableHtml()
    downloadBlob(new Blob([html], { type: 'application/msword' }), `Learner_Category_Students_${new Date().toISOString().slice(0, 10)}.doc`)
  }

  const openPrintWindow = () => {
    if (!reportRows.length) return null
    const w = window.open('', '_blank', 'width=1024,height=768')
    if (!w) return null
    w.document.write(getReportTableHtml())
    w.document.close()
    return w
  }

  const printReport = () => {
    const w = openPrintWindow()
    if (!w) return setError('Pop-up blocked. Allow pop-ups to print')
    w.focus()
    w.print()
  }

  const exportReportPdf = () => {
    const w = openPrintWindow()
    if (!w) return setError('Pop-up blocked. Allow pop-ups to save PDF')
    w.focus()
    w.print()
    setInfo('Use "Save as PDF" in the print dialog to download PDF')
  }

  const studentColumns = useMemo(
    () => [
      { key: 'registerNumber', label: 'Register No', sortable: true, width: 160 },
      { key: 'firstName', label: 'Student Name', sortable: true, width: 220 },
      {
        key: 'learnerCategoryId',
        label: 'Learner Category',
        width: 220,
        render: (r) => (
          <CFormSelect
            size="sm"
            value={r.learnerCategoryId || ''}
            onChange={(e) => setStudentValue(r.studentId, 'learnerCategoryId', e.target.value)}
          >
            <option value="">Select</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </CFormSelect>
        ),
      },
      {
        key: 'assessmentScore',
        label: 'Score',
        width: 120,
        render: (r) => (
          <CFormInput
            size="sm"
            value={r.assessmentScore ?? ''}
            onChange={(e) => setStudentValue(r.studentId, 'assessmentScore', e.target.value)}
          />
        ),
      },
      {
        key: 'remarks',
        label: 'Remarks',
        width: 250,
        render: (r) => (
          <CFormInput size="sm" value={r.remarks ?? ''} onChange={(e) => setStudentValue(r.studentId, 'remarks', e.target.value)} />
        ),
      },
    ],
    [categories],
  )

  const programmeColumns = useMemo(
    () => [
      { key: 'programmeDateFrom', label: 'From', sortable: true, width: 120 },
      { key: 'programmeDateTo', label: 'To', sortable: true, width: 120 },
      { key: 'learnerCategoryName', label: 'Learner Category', sortable: true, width: 210 },
      { key: 'title', label: 'Title', sortable: true, width: 240 },
      { key: 'description', label: 'Description', sortable: false, width: 260, render: (r) => r.description || '-' },
      {
        key: 'supportDocName',
        label: 'Document',
        width: 200,
        render: (r) =>
          r.supportDocPath ? (
            <a href={r.supportDocPath} target="_blank" rel="noreferrer">
              {r.supportDocName || 'View'}
            </a>
          ) : (
            '-'
          ),
      },
      {
        key: 'status',
        label: 'Status',
        width: 130,
        render: (r) => <CBadge color={String(r.status || '').toUpperCase() === 'COMPLETED' ? 'success' : 'info'}>{r.status}</CBadge>,
      },
    ],
    [],
  )

  const categoryColumns = useMemo(
    () => [
      { key: 'code', label: 'Code', sortable: true, width: 180 },
      { key: 'name', label: 'Name', sortable: true, width: 280 },
      { key: 'isDefault', label: 'Type', sortable: false, width: 120, render: (r) => (r.isDefault ? 'Default' : 'Custom') },
    ],
    [],
  )

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader>
            <strong>Learner Activities - Scope Selection</strong>
          </CCardHeader>
          <CCardBody>
            <CForm>
              <CRow className="g-3">
                <LabelCol>Institution</LabelCol>
                <InputCol><CFormSelect value={scope.institutionId} onChange={onScopeChange('institutionId')}><option value="">Select</option>{institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</CFormSelect></InputCol>
                <LabelCol>Department</LabelCol>
                <InputCol><CFormSelect value={scope.departmentId} onChange={onScopeChange('departmentId')}><option value="">Select</option>{departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}</CFormSelect></InputCol>
                <LabelCol>Programme</LabelCol>
                <InputCol><CFormSelect value={scope.programmeId} onChange={onScopeChange('programmeId')}><option value="">Select</option>{programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode} - {x.programmeName}</option>)}</CFormSelect></InputCol>
                <LabelCol>Regulation</LabelCol>
                <InputCol><CFormSelect value={scope.regulationId} onChange={onScopeChange('regulationId')}><option value="">Select</option>{regulations.map((x) => <option key={x.id} value={x.id}>{x.regulationCode}</option>)}</CFormSelect></InputCol>
                <LabelCol>Academic Year</LabelCol>
                <InputCol><CFormSelect value={scope.academicYearId} onChange={onScopeChange('academicYearId')}><option value="">Select</option>{academicYears.map((x) => <option key={x.id} value={x.id}>{x.academicYearLabel || x.academicYear}</option>)}</CFormSelect></InputCol>
                <LabelCol>Batch</LabelCol>
                <InputCol><CFormSelect value={scope.batchId} onChange={onScopeChange('batchId')}><option value="">Select</option>{batches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}</CFormSelect></InputCol>
                <LabelCol>Semester</LabelCol>
                <InputCol><CFormSelect value={scope.semester} onChange={onScopeChange('semester')}><option value="">Select</option>{semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</CFormSelect></InputCol>
                <LabelCol>Class</LabelCol>
                <InputCol><CFormSelect value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Select</option>{classes.map((x) => <option key={x.id} value={x.id}>{x.className} {x.classLabel ? `(${x.classLabel})` : ''}</option>)}</CFormSelect></InputCol>
                <LabelCol>Faculty</LabelCol>
                <InputCol><CFormSelect value={facultyId} onChange={(e) => setFacultyId(e.target.value)}><option value="">Select</option>{faculties.map((x) => <option key={x.id} value={x.id}>{x.facultyCode} - {x.facultyName}</option>)}</CFormSelect></InputCol>
                <LabelCol>Assessment Name</LabelCol>
                <InputCol><CFormInput value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)} placeholder="CIA 1 / Mid Test" /></InputCol>
                <LabelCol>Categorized On</LabelCol>
                <InputCol><CFormInput type="date" value={categorizedOn} onChange={(e) => setCategorizedOn(e.target.value)} /></InputCol>
              </CRow>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <ArpButton label="Load Students" icon="search" color="primary" onClick={loadStudentCategorizations} disabled={loading} />
                {loading && <CSpinner size="sm" />}
              </div>
            </CForm>
          </CCardBody>
        </CCard>

        {error ? <CAlert color="danger">{error}</CAlert> : null}
        {info ? <CAlert color="info">{info}</CAlert> : null}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Learner Categories</strong>
            <div className="d-flex gap-2">
              <ArpIconButton icon="add" color="purple" title="Add New" onClick={onAddCategory} />
              <ArpIconButton icon="edit" color="info" title="Edit" onClick={onEditCategory} disabled={!selectedCategoryId} />
              <ArpIconButton icon="delete" color="danger" title="Delete" onClick={onDeleteCategory} disabled={!selectedCategoryId} />
            </div>
          </CCardHeader>
          <CCardBody>
            <ArpDataTable
              rows={categories}
              columns={categoryColumns}
              rowKey="id"
              searchable
              defaultPageSize={5}
              pageSizeOptions={[5, 10, 20]}
              selection={{
                type: 'radio',
                selected: selectedCategoryId,
                onChange: (id) => setSelectedCategoryId(id),
                key: 'id',
                headerLabel: 'Select',
                width: 70,
                name: 'learnerCategorySelect',
              }}
            />
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Phase 1 - Student Categorization</strong>
            <ArpButton label="Save Categorization" icon="save" color="success" onClick={saveCategorizations} disabled={saving || loading} />
          </CCardHeader>
          <CCardBody>
            <ArpDataTable
              rows={studentRows}
              columns={studentColumns}
              rowKey="studentId"
              searchable
              searchPlaceholder="Search student..."
              defaultPageSize={10}
              pageSizeOptions={[10, 20, 50]}
              loading={loading}
              emptyText="No students found for selected class/scope"
            />
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Phase 2 - Special Programme Management</strong>
            <div className="d-flex gap-2">
              <ArpIconButton icon="add" color="purple" title="Add New" onClick={() => openProgrammeModal('NEW')} />
              <ArpIconButton icon="view" color="purple" title="View" onClick={() => openProgrammeModal('VIEW')} disabled={!selectedProgramme} />
              <ArpIconButton icon="edit" color="info" title="Edit" onClick={() => openProgrammeModal('EDIT')} disabled={!selectedProgramme} />
              <ArpIconButton
                icon="download"
                color="secondary"
                title="Download Document"
                onClick={downloadProgrammeDocument}
                disabled={!selectedProgramme || !selectedProgramme.supportDocPath}
              />
              <ArpIconButton icon="delete" color="danger" title="Delete" onClick={deleteProgramme} disabled={!selectedProgramme} />
            </div>
          </CCardHeader>
          <CCardBody>
            <ArpDataTable
              rows={programmesRows}
              columns={programmeColumns}
              rowKey="id"
              searchable
              searchPlaceholder="Search programme..."
              defaultPageSize={10}
              pageSizeOptions={[10, 20, 50]}
              selection={{
                type: 'radio',
                selected: selectedProgrammeId,
                onChange: (id) => setSelectedProgrammeId(id),
                key: 'id',
                headerLabel: 'Select',
                width: 70,
                name: 'learnerProgrammeSelect',
              }}
              emptyText="No learner programmes found"
            />
          </CCardBody>
        </CCard>

        <CCard className="mt-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Learner Category-wise Student List</strong>
            <div className="d-flex gap-2">
              <ArpButton label="Load List" icon="search" color="primary" onClick={loadCategoryWiseStudents} />
              <ArpButton label="XLSX" icon="download" color="secondary" onClick={exportReportXlsx} disabled={!reportRows.length} />
              <ArpButton label="DOC" icon="download" color="secondary" onClick={exportReportDoc} disabled={!reportRows.length} />
              <ArpButton label="PDF" icon="download" color="secondary" onClick={exportReportPdf} disabled={!reportRows.length} />
              <ArpButton label="Print" icon="print" color="secondary" onClick={printReport} disabled={!reportRows.length} />
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3 mb-3">
              <LabelCol>Learner Category</LabelCol>
              <InputCol>
                <CFormSelect value={reportCategoryId} onChange={(e) => setReportCategoryId(e.target.value)}>
                  <option value="">Select</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </CFormSelect>
              </InputCol>
            </CRow>
            <ArpDataTable
              rows={reportRows}
              rowKey="studentId"
              columns={[
                { key: 'registerNumber', label: 'Register No', sortable: true, width: 170 },
                { key: 'firstName', label: 'Student Name', sortable: true, width: 240 },
                { key: 'learnerCategoryName', label: 'Learner Category', sortable: true, width: 220 },
                { key: 'assessmentScore', label: 'Assessment Score', sortable: true, width: 150, render: (r) => r.assessmentScore ?? '-' },
                { key: 'remarks', label: 'Remarks', sortable: false, width: 260, render: (r) => r.remarks || '-' },
              ]}
              searchable
              searchPlaceholder="Search student in learner category list..."
              defaultPageSize={10}
              pageSizeOptions={[10, 20, 50]}
              loading={loading}
              emptyText="No learner category-wise students found"
            />
          </CCardBody>
        </CCard>

        <CModal visible={categoryModalOpen} onClose={() => setCategoryModalOpen(false)}>
          <CModalHeader><CModalTitle>{categoryForm.id ? 'Edit' : 'Add'} Learner Category</CModalTitle></CModalHeader>
          <CModalBody>
            <CRow className="g-3">
              <LabelCol>Code</LabelCol>
              <InputCol><CFormInput value={categoryForm.code} onChange={(e) => setCategoryForm((p) => ({ ...p, code: e.target.value }))} /></InputCol>
              <LabelCol>Name</LabelCol>
              <InputCol><CFormInput value={categoryForm.name} onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))} /></InputCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <ArpButton label="Save" icon="save" color="success" onClick={onSaveCategory} disabled={saving} />
            <ArpButton label="Cancel" icon="cancel" color="secondary" onClick={() => setCategoryModalOpen(false)} />
          </CModalFooter>
        </CModal>

        <CModal visible={programmeModalOpen} onClose={() => setProgrammeModalOpen(false)} size="lg">
          <CModalHeader><CModalTitle>{programmeModalMode === 'NEW' ? 'Add' : programmeModalMode === 'EDIT' ? 'Edit' : 'View'} Learner Programme</CModalTitle></CModalHeader>
          <CModalBody>
            <CRow className="g-3">
              <LabelCol>Learner Category</LabelCol>
              <InputCol><CFormSelect value={programmeForm.learnerCategoryId} disabled={programmeModalMode === 'VIEW'} onChange={(e) => setProgrammeForm((p) => ({ ...p, learnerCategoryId: e.target.value }))}><option value="">Select</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</CFormSelect></InputCol>
              <LabelCol>Programme From</LabelCol>
              <InputCol><CFormInput type="date" value={programmeForm.programmeDateFrom} disabled={programmeModalMode === 'VIEW'} onChange={(e) => setProgrammeForm((p) => ({ ...p, programmeDateFrom: e.target.value }))} /></InputCol>
              <LabelCol>Programme To</LabelCol>
              <InputCol><CFormInput type="date" value={programmeForm.programmeDateTo} disabled={programmeModalMode === 'VIEW'} onChange={(e) => setProgrammeForm((p) => ({ ...p, programmeDateTo: e.target.value }))} /></InputCol>
              <LabelCol>Status</LabelCol>
              <InputCol><CFormSelect value={programmeForm.status} disabled={programmeModalMode === 'VIEW'} onChange={(e) => setProgrammeForm((p) => ({ ...p, status: e.target.value }))}><option value="SCHEDULED">Scheduled</option><option value="COMPLETED">Completed</option><option value="POSTPONED">Postponed</option></CFormSelect></InputCol>
              <LabelCol>Title</LabelCol>
              <InputCol><CFormInput value={programmeForm.title} disabled={programmeModalMode === 'VIEW'} onChange={(e) => setProgrammeForm((p) => ({ ...p, title: e.target.value }))} /></InputCol>
              <LabelCol>Description</LabelCol>
              <InputCol><CFormInput value={programmeForm.description} disabled={programmeModalMode === 'VIEW'} onChange={(e) => setProgrammeForm((p) => ({ ...p, description: e.target.value }))} /></InputCol>
              <LabelCol>Remarks</LabelCol>
              <InputCol><CFormInput value={programmeForm.remarks} disabled={programmeModalMode === 'VIEW'} onChange={(e) => setProgrammeForm((p) => ({ ...p, remarks: e.target.value }))} /></InputCol>
              <LabelCol>Document</LabelCol>
              <InputCol><CFormInput type="file" disabled={programmeModalMode === 'VIEW'} onChange={(e) => setProgrammeForm((p) => ({ ...p, file: e.target.files?.[0] || null }))} /></InputCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            {programmeModalMode !== 'VIEW' ? (
              <ArpButton label="Save" icon="save" color="success" onClick={saveProgramme} disabled={saving} />
            ) : null}
            <ArpButton label="Close" icon="cancel" color="secondary" onClick={() => setProgrammeModalOpen(false)} />
          </CModalFooter>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default LearnerActivities
