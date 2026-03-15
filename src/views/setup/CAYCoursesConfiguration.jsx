import React, { useEffect, useMemo, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormLabel,
  CFormSelect,
  CRow,
  CSpinner,
} from '@coreui/react-pro'
import { ArpButton, useArpToast } from '../../components/common'
import ArpDataTable from '../../components/common/ArpDataTable'
import api from '../../services/apiClient'

const initialScope = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semesterPattern: '',
  semester: '',
}

const unwrapList = (res) => {
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res?.data)) return res.data
  return []
}

const toCourseRow = (r) => ({
  id: r.id,
  courseCode: r.courseCode || '',
  courseTitle: r.courseTitle || '',
  courseType: r.courseType || '',
  credits: r.credits ?? '',
  semesterPattern: r.semesterPattern || '',
  semester: r.semester ?? '',
})

const parseChosenSemesters = (value) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(value.map((v) => Number(v)).filter((n) => Number.isFinite(n))),
    ).sort((a, b) => a - b)
  }

  const txt = String(value ?? '').trim()
  if (!txt) return []

  return Array.from(
    new Set(
      txt
        .split(',')
        .map((x) => Number(String(x).trim()))
        .filter((n) => Number.isFinite(n)),
    ),
  ).sort((a, b) => a - b)
}

const filterBySemesterPattern = (list, semesterPattern) => {
  const pattern = String(semesterPattern || '').toUpperCase()
  if (pattern === 'ODD') return list.filter((n) => Number(n) % 2 === 1)
  if (pattern === 'EVEN') return list.filter((n) => Number(n) % 2 === 0)
  return list
}

export default function CAYCoursesConfiguration() {
  const [scope, setScope] = useState(initialScope)

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])

  const [loadingMasters, setLoadingMasters] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useArpToast()

  const [availableCourses, setAvailableCourses] = useState([])
  const [offeredCourses, setOfferedCourses] = useState([])
  const [savedOfferedCourseIds, setSavedOfferedCourseIds] = useState([])

  const [selectedAvailable, setSelectedAvailable] = useState([])
  const [selectedOffered, setSelectedOffered] = useState([])

  const scopeReady = useMemo(
    () =>
      Boolean(
        scope.institutionId &&
          scope.departmentId &&
          scope.programmeId &&
          scope.regulationId &&
          scope.academicYearId &&
          scope.semesterPattern &&
          scope.semester,
      ),
    [scope],
  )

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(scope.academicYearId)) || null,
    [academicYears, scope.academicYearId],
  )

  const selectedAcademicYearTermId = useMemo(() => {
    if (!selectedAcademicYear) return ''
    const pattern = String(scope.semesterPattern || '').toUpperCase()
    if (pattern === 'ODD') return selectedAcademicYear.oddAcademicYearId || selectedAcademicYear.id || ''
    if (pattern === 'EVEN') return selectedAcademicYear.evenAcademicYearId || selectedAcademicYear.id || ''
    return ''
  }, [selectedAcademicYear, scope.semesterPattern])

  const academicYearSemesterOptions = useMemo(() => {
    if (!selectedAcademicYear) return []
    const pattern = String(scope.semesterPattern || '').toUpperCase()
    let list =
      pattern === 'ODD'
        ? parseChosenSemesters(selectedAcademicYear.oddChosenSemesters)
        : pattern === 'EVEN'
          ? parseChosenSemesters(selectedAcademicYear.evenChosenSemesters)
          : [
              ...parseChosenSemesters(selectedAcademicYear.oddChosenSemesters),
              ...parseChosenSemesters(selectedAcademicYear.evenChosenSemesters),
            ]
    if (!list.length) return []
    list = filterBySemesterPattern(list, scope.semesterPattern)
    return list.map((n) => ({ value: String(n), label: String(n) }))
  }, [selectedAcademicYear, scope.semesterPattern])

  const semesterOptions = academicYearSemesterOptions

  const showMessage = (type, text) =>
    toast.show({
      type,
      message: text,
      autohide: type === 'success',
      delay: 3500,
    })

  const clearCourseSelections = () => {
    setAvailableCourses([])
    setOfferedCourses([])
    setSavedOfferedCourseIds([])
    setSelectedAvailable([])
    setSelectedOffered([])
  }

  const onCancelScopeAction = () => {
    setScope(initialScope)
    setDepartments([])
    setProgrammes([])
    setRegulations([])
    setAcademicYears([])
    setBatches([])
    clearCourseSelections()
  }

  const loadInstitutions = async () => {
    setLoadingMasters(true)
    try {
      const res = await api.get('/api/setup/institution')
      setInstitutions(unwrapList(res))
    } catch (e) {
      setInstitutions([])
      showMessage('danger', e?.response?.data?.message || 'Failed to load institutions')
    } finally {
      setLoadingMasters(false)
    }
  }

  const loadDepartments = async (institutionId) => {
    try {
      const res = await api.get('/api/setup/department', { params: { institutionId } })
      setDepartments(unwrapList(res))
    } catch (e) {
      setDepartments([])
      showMessage('danger', e?.response?.data?.message || 'Failed to load departments')
    }
  }

  const loadProgrammes = async (institutionId, departmentId) => {
    try {
      const res = await api.get('/api/setup/programme')
      const list = unwrapList(res)
      const filtered = list.filter(
        (p) =>
          String(p.institutionId) === String(institutionId) &&
          String(p.departmentId) === String(departmentId),
      )
      setProgrammes(filtered)
    } catch (e) {
      setProgrammes([])
      showMessage('danger', e?.response?.data?.message || 'Failed to load programmes')
    }
  }

  const loadRegulations = async (institutionId, programmeId) => {
    try {
      const res = await api.get('/api/setup/regulation', { params: { institutionId, programmeId } })
      setRegulations(unwrapList(res))
    } catch (e) {
      setRegulations([])
      showMessage('danger', e?.response?.data?.message || 'Failed to load regulations')
    }
  }

  const loadAcademicYears = async (institutionId) => {
    try {
      const res = await api.get('/api/setup/academic-year', {
        params: { view: 'annual', institutionId },
        headers: { 'x-institution-id': institutionId },
      })
      setAcademicYears(unwrapList(res))
    } catch (e) {
      setAcademicYears([])
      showMessage('danger', e?.response?.data?.message || 'Failed to load academic years')
    }
  }

  const loadBatches = async (institutionId) => {
    try {
      const res = await api.get('/api/setup/batch', { params: { institutionId } })
      setBatches(unwrapList(res))
    } catch (e) {
      setBatches([])
      showMessage('danger', e?.response?.data?.message || 'Failed to load batches')
    }
  }

  const getMappedSemestersForScope = async () => {
    if (
      !scope.institutionId ||
      !scope.programmeId ||
      !scope.regulationId ||
      !scope.batchId ||
      !selectedAcademicYearTermId
    ) {
      return []
    }

    try {
      const res = await api.get('/api/setup/regulation-map', {
        params: {
          institutionId: scope.institutionId,
          academicYearId: selectedAcademicYearTermId,
          programmeId: scope.programmeId,
          regulationId: scope.regulationId,
          batchId: scope.batchId,
        },
      })

      return Array.from(
        new Set(
          unwrapList(res)
            .flatMap((row) =>
              Array.isArray(row.mappedSemesters)
                ? row.mappedSemesters
                : row.semester !== undefined && row.semester !== null
                  ? [row.semester]
                  : [],
            )
            .map((n) => Number(n))
            .filter((n) => Number.isFinite(n)),
        ),
      ).sort((a, b) => a - b)
    } catch {
      return []
    }
  }

  const validateSelectedSemester = async () => {
    if (!scope.batchId) return true
    const chosenSemester = Number(scope.semester)
    if (!Number.isFinite(chosenSemester)) return false

    const mappedSemesters = await getMappedSemestersForScope()
    if (!mappedSemesters.length) {
      showMessage('danger', 'No Regulation Map found for the selected Academic Year, Batch, Programme, and Regulation.')
      return false
    }

    if (!mappedSemesters.includes(chosenSemester)) {
      showMessage(
        'danger',
        `Selected semester is not mapped for this batch in the selected academic year. Allowed semester(s): ${mappedSemesters.join(', ')}.`,
      )
      return false
    }

    return true
  }

  useEffect(() => {
    loadInstitutions()
  }, [])

  useEffect(() => {
    if (!scope.institutionId) {
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      return
    }
    setScope((s) => ({
      ...s,
      departmentId: '',
      programmeId: '',
      regulationId: '',
      academicYearId: '',
      batchId: '',
      semesterPattern: '',
      semester: '',
    }))
    clearCourseSelections()
    loadDepartments(scope.institutionId)
    loadAcademicYears(scope.institutionId)
    loadBatches(scope.institutionId)
  }, [scope.institutionId])

  useEffect(() => {
    if (!scope.institutionId || !scope.departmentId) {
      setProgrammes([])
      setRegulations([])
      return
    }
    setScope((s) => ({
      ...s,
      programmeId: '',
      regulationId: '',
      batchId: '',
      semesterPattern: '',
      semester: '',
    }))
    clearCourseSelections()
    loadProgrammes(scope.institutionId, scope.departmentId)
  }, [scope.departmentId])

  useEffect(() => {
    if (!scope.institutionId || !scope.programmeId) {
      setRegulations([])
      return
    }
    setScope((s) => ({ ...s, regulationId: '', semesterPattern: '', semester: '' }))
    clearCourseSelections()
    loadRegulations(scope.institutionId, scope.programmeId)
  }, [scope.programmeId])

  const loadScopeCourses = async () => {
    if (!scopeReady) {
      showMessage('danger', 'Please complete Institution, Department, Programme, Regulation, Academic Year, Pattern, and Semester.')
      return
    }
    if (!selectedAcademicYearTermId) {
      showMessage('danger', 'Selected Academic Year term is not configured for the chosen pattern.')
      return
    }
    if (!(await validateSelectedSemester())) {
      clearCourseSelections()
      return
    }
    setLoadingCourses(true)
    try {
      const res = await api.get('/api/setup/course', {
        params: {
          institutionId: scope.institutionId,
          departmentId: scope.departmentId,
          programmeId: scope.programmeId,
          regulationId: scope.regulationId,
          semesterPattern: scope.semesterPattern,
          semester: scope.semester,
        },
      })
      const rows = unwrapList(res).map(toCourseRow)
      let offered = []
      try {
        const offeredRes = await api.get('/api/setup/course-offering', {
          params: {
            institutionId: scope.institutionId,
            academicYearId: selectedAcademicYearTermId,
            programmeId: scope.programmeId,
            regulationId: scope.regulationId,
            ...(scope.batchId ? { batchId: scope.batchId } : {}),
            semester: scope.semester,
          },
        })
        offered = unwrapList(offeredRes)
          .map((x) => ({
            ...toCourseRow(x.course || {}),
            id: x.courseId,
            courseOrder: x.courseOrder ?? null,
          }))
          .filter((x) => x.id)
      } catch (offErr) {
        showMessage(
          'warning',
          offErr?.response?.data?.error || 'Master courses loaded, but existing CAY offerings could not be loaded.',
        )
      }

      const offeredIds = new Set(offered.map((x) => x.id))
      setAvailableCourses(rows.filter((x) => !offeredIds.has(x.id)))
      setOfferedCourses(offered)
      setSavedOfferedCourseIds(Array.from(offeredIds))
      setSelectedAvailable([])
      setSelectedOffered([])
      showMessage('success', `Loaded ${rows.length} master course(s). ${offered.length} already mapped as CAY offerings.`)
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || e?.response?.data?.message || 'Failed to load courses for selected scope')
    } finally {
      setLoadingCourses(false)
    }
  }

  const addSelectedCourses = () => {
    if (!selectedAvailable.length) return
    const selectedSet = new Set(selectedAvailable)
    const toAdd = availableCourses.filter((r) => selectedSet.has(r.id))
    const existing = new Set(offeredCourses.map((r) => r.id))
    const merged = [...offeredCourses, ...toAdd.filter((r) => !existing.has(r.id))]
    setOfferedCourses(merged)
    setAvailableCourses((prev) => prev.filter((r) => !selectedSet.has(r.id)))
    setSelectedAvailable([])
  }

  const addAllCourses = () => {
    if (!availableCourses.length) return
    const existing = new Set(offeredCourses.map((r) => r.id))
    const toAdd = availableCourses.filter((r) => !existing.has(r.id))
    setOfferedCourses((prev) => [...prev, ...toAdd])
    setAvailableCourses([])
    setSelectedAvailable([])
  }

  const removeSelectedCourses = () => {
    if (!selectedOffered.length) return
    const selectedSet = new Set(selectedOffered)
    const removed = offeredCourses.filter((r) => selectedSet.has(r.id))
    setOfferedCourses((prev) => prev.filter((r) => !selectedSet.has(r.id)))
    setSavedOfferedCourseIds((prev) => prev.filter((id) => !selectedSet.has(id)))
    setAvailableCourses((prev) => {
      const existing = new Set(prev.map((r) => r.id))
      return [...prev, ...removed.filter((r) => !existing.has(r.id))]
    })
    setSelectedOffered([])
  }

  const onSaveCayCourses = async () => {
    if (!scopeReady) {
      showMessage('danger', 'Please select full scope before saving.')
      return
    }
    if (!offeredCourses.length) {
      showMessage('danger', 'Add at least one offered course.')
      return
    }
    if (!(await validateSelectedSemester())) {
      return
    }

    setSaving(true)
    try {
      const payload = {
        institutionId: scope.institutionId,
        departmentId: scope.departmentId,
        programmeId: scope.programmeId,
        regulationId: scope.regulationId,
        academicYearId: selectedAcademicYearTermId,
        ...(scope.batchId ? { batchId: scope.batchId } : {}),
        semesterPattern: scope.semesterPattern,
        semester: Number(scope.semester),
        courses: offeredCourses.map((c, idx) => ({
          courseId: c.id,
          courseOrder: idx + 1,
        })),
      }

      await api.post('/api/setup/course-offering', payload)
      showMessage('success', 'CAY course offerings saved successfully.')
      await loadScopeCourses()
    } catch (e) {
      showMessage('danger', e?.response?.data?.error || e?.response?.data?.message || 'Failed to save CAY course offerings.')
    } finally {
      setSaving(false)
    }
  }

  const onSaveAllCourses = async () => {
    if (!offeredCourses.length) {
      showMessage('danger', 'No offered courses available to save.')
      return
    }
    await onSaveCayCourses()
  }

  const columns = [
    { key: 'courseCode', label: 'Course Code', sortable: true },
    { key: 'courseTitle', label: 'Course Title', sortable: true },
    { key: 'courseType', label: 'Course Type', sortable: true },
    { key: 'credits', label: 'Credits', sortable: true, sortType: 'number', align: 'center' },
    { key: 'semesterPattern', label: 'Pattern', sortable: true, align: 'center' },
    { key: 'semester', label: 'Semester', sortable: true, sortType: 'number', align: 'center' },
    {
      key: 'saveStatus',
      label: 'Save Status',
      sortable: false,
      align: 'center',
      render: (row) => (savedOfferedCourseIds.includes(row.id) ? 'Saved' : 'Pending'),
    },
  ]

  return (
    <div>
      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>CAY Courses Configuration</strong>
        </CCardHeader>
        <CCardBody>
          {loadingMasters ? (
            <div className="d-flex align-items-center gap-2">
              <CSpinner size="sm" />
              <span>Loading masters...</span>
            </div>
          ) : (
            <CForm>
              <CRow className="g-3">
                <CCol md={3}>
                  <CFormLabel>Institution</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={scope.institutionId}
                    onChange={(e) => setScope((s) => ({ ...s, institutionId: e.target.value }))}
                  >
                    <option value="">Select Institution</option>
                    {institutions.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.code ? `${x.code} - ${x.name}` : x.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Department</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={scope.departmentId}
                    onChange={(e) => setScope((s) => ({ ...s, departmentId: e.target.value }))}
                    disabled={!scope.institutionId}
                  >
                    <option value="">Select Department</option>
                    {departments.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.departmentCode
                          ? `${x.departmentCode} - ${x.departmentName}`
                          : x.departmentName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Programme</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={scope.programmeId}
                    onChange={(e) => setScope((s) => ({ ...s, programmeId: e.target.value }))}
                    disabled={!scope.departmentId}
                  >
                    <option value="">Select Programme</option>
                    {programmes.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.programmeCode
                          ? `${x.programmeCode} - ${x.programmeName}`
                          : x.programmeName}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Regulation</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={scope.regulationId}
                    onChange={(e) => setScope((s) => ({ ...s, regulationId: e.target.value }))}
                    disabled={!scope.programmeId}
                  >
                    <option value="">Select Regulation</option>
                    {regulations.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.regulationCode || x.name || 'Regulation'}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

              <CCol md={3}>
                <CFormLabel>Academic Year</CFormLabel>
              </CCol>
              <CCol md={3}>
                  <CFormSelect
                    value={scope.academicYearId}
                    onChange={(e) => setScope((s) => ({ ...s, academicYearId: e.target.value }))}
                    disabled={!scope.institutionId}
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.academicYearLabel || x.academicYear}
                      </option>
                    ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Admission Batch</CFormLabel>
              </CCol>
              <CCol md={3}>
                <CFormSelect
                  value={scope.batchId}
                  onChange={(e) => setScope((s) => ({ ...s, batchId: e.target.value }))}
                  disabled={!scope.institutionId}
                >
                  <option value="">All Batches</option>
                  {batches.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.batchName}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={3}>
                <CFormLabel>Academic Pattern</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={scope.semesterPattern}
                    onChange={(e) => setScope((s) => ({ ...s, semesterPattern: e.target.value }))}
                    disabled={!scope.regulationId || !scope.academicYearId}
                  >
                    <option value="">Select Pattern</option>
                    <option value="ODD">ODD</option>
                    <option value="EVEN">EVEN</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}>
                  <CFormLabel>Semester</CFormLabel>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={scope.semester}
                    onChange={(e) => setScope((s) => ({ ...s, semester: e.target.value }))}
                    disabled={!scope.semesterPattern}
                  >
                    <option value="">Select Semester</option>
                    {semesterOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol xs={12} className="d-flex justify-content-end gap-2 mt-2">
                  <ArpButton
                    color="info"
                    icon="search"
                    label={loadingCourses ? 'Searching...' : 'Search'}
                    onClick={loadScopeCourses}
                    disabled={loadingCourses || !scopeReady}
                  />
                  <ArpButton
                    color="secondary"
                    icon="cancel"
                    label="Cancel"
                    onClick={onCancelScopeAction}
                  />
                </CCol>
              </CRow>
            </CForm>
          )}
        </CCardBody>
      </CCard>

      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>Available Master Courses</strong>
          <div className="d-flex gap-2">
            <ArpButton
              color="secondary"
              icon="add"
              label="Pick All Courses"
              onClick={addAllCourses}
              disabled={!availableCourses.length}
            />
            <ArpButton
              color="primary"
              icon="add"
              label="Add Selected"
              onClick={addSelectedCourses}
              disabled={!selectedAvailable.length}
            />
          </div>
        </CCardHeader>
        <CCardBody>
          <ArpDataTable
            title="Master Course List"
            rows={availableCourses}
            columns={columns}
            loading={loadingCourses}
            rowKey="id"
            selection={{
              type: 'checkbox',
              selected: selectedAvailable,
              onChange: (ids) => setSelectedAvailable(ids),
              key: 'id',
              headerLabel: 'Pick',
              width: 60,
            }}
          />
        </CCardBody>
      </CCard>

      <CCard className="mb-3">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <strong>CAY Offered Courses</strong>
          <div className="d-flex gap-2">
            <ArpButton
              color="primary"
              icon="save"
              label={saving ? 'Saving...' : 'Save All Courses'}
              onClick={onSaveAllCourses}
              disabled={saving || !offeredCourses.length}
            />
            <ArpButton
              color="success"
              icon="save"
              label={saving ? 'Saving...' : 'Save CAY Courses'}
              onClick={onSaveCayCourses}
              disabled={saving || !offeredCourses.length}
            />
            <ArpButton
              color="danger"
              icon="delete"
              label="Remove Selected"
              onClick={removeSelectedCourses}
              disabled={!selectedOffered.length}
            />
          </div>
        </CCardHeader>
        <CCardBody>
          <div className="mb-2 text-muted">
            Saved Records: {savedOfferedCourseIds.length} / Current Offered Rows: {offeredCourses.length}
          </div>
          <ArpDataTable
            title="Current Academic Year Course Offerings"
            rows={offeredCourses}
            columns={columns}
            loading={false}
            rowKey="id"
            selection={{
              type: 'checkbox',
              selected: selectedOffered,
              onChange: (ids) => setSelectedOffered(ids),
              key: 'id',
              headerLabel: 'Pick',
              width: 60,
            }}
            emptyText="No courses selected for CAY offering yet."
          />
        </CCardBody>
      </CCard>
    </div>
  )
}
