import React, { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
} from '@coreui/react-pro'
import { ArpButton, ArpDataTable, useArpToast } from '../../components/common'
import { classMatchesSemester, deriveAdmissionSemester, deriveStudyYearFromSemester, lmsService } from '../../services/lmsService'

const initialForm = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  semesterCategory: '',
  batchId: '',
  semester: '',
  programmeName: '',
  classId: '',
  className: '',
  classLabel: '',
  courseCode: '',
  courseName: '',
  status: 'Automatically Fetched',
}

const StudentAllotmentConfiguration = () => {
  const toast = useArpToast()
  const [allotmentMode, setAllotmentMode] = useState('COURSE_WISE')
  const [form, setForm] = useState(initialForm)
  const [showDetails, setShowDetails] = useState(false)
  const [rows, setRows] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detailsLocked, setDetailsLocked] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [batches, setBatches] = useState([])
  const [classes, setClasses] = useState([])
  const [offerings, setOfferings] = useState([])

  useEffect(() => {
    ;(async () => {
      try {
        setInstitutions(await lmsService.listInstitutions())
      } catch {
        setError('Failed to load institutions')
      }
    })()
  }, [])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(form.academicYearId)) || null,
    [academicYears, form.academicYearId],
  )

  const selectedBatch = useMemo(
    () => batches.find((x) => String(x.id) === String(form.batchId)) || null,
    [batches, form.batchId],
  )

  const selectedProgramme = useMemo(
    () => programmes.find((x) => String(x.id) === String(form.programmeId)) || null,
    [programmes, form.programmeId],
  )

  const semesterCategoryOptions = useMemo(() => {
    const out = []
    if (selectedAcademicYear?.oddAcademicYearId) out.push('ODD')
    if (selectedAcademicYear?.evenAcademicYearId) out.push('EVEN')
    if (!out.length && selectedAcademicYear?.semesterCategory) {
      out.push(String(selectedAcademicYear.semesterCategory).toUpperCase())
    }
    return out
  }, [selectedAcademicYear])

  const effectiveSemesterCategory = useMemo(
    () => form.semesterCategory || String(selectedAcademicYear?.semesterCategory || '').toUpperCase().trim(),
    [form.semesterCategory, selectedAcademicYear],
  )

  const derivedSemesterMeta = useMemo(
    () =>
      deriveAdmissionSemester({
        academicYear: selectedAcademicYear?.academicYear,
        semesterCategory: effectiveSemesterCategory,
        batchName: selectedBatch?.batchName,
        totalSemesters: selectedProgramme?.totalSemesters,
      }),
    [selectedAcademicYear, effectiveSemesterCategory, selectedBatch, selectedProgramme],
  )

  const eligibleClasses = useMemo(() => {
    if (!form.semester) return classes
    const filtered = classes.filter((c) => classMatchesSemester(c?.className, form.semester))
    return filtered.length ? filtered : classes
  }, [classes, form.semester])

  const derivedStudyYear = useMemo(() => deriveStudyYearFromSemester(form.semester), [form.semester])

  const classLabelOptions = useMemo(() => {
    const values = Array.from(new Set(eligibleClasses.map((x) => String(x.classLabel || '').trim()).filter(Boolean)))
    return values.sort()
  }, [eligibleClasses])

  useEffect(() => {
    if (!form.academicYearId || !form.batchId) return
    if (derivedSemesterMeta.error) {
      toast.show({
        color: 'warning',
        title: 'Attention',
        message: derivedSemesterMeta.error,
        delay: 5000,
      })
      return
    }
    if (derivedSemesterMeta.semester) {
      toast.show({
        color: 'info',
        title: 'Derived Semester',
        message: `Academic Year ${selectedAcademicYear?.academicYear} (${effectiveSemesterCategory}) + Admission Batch ${selectedBatch?.batchName} = Semester ${derivedSemesterMeta.semester}. Choose Year ${deriveStudyYearFromSemester(derivedSemesterMeta.semester)} classes only.`,
        delay: 4500,
      })
    }
  }, [
    toast,
    form.academicYearId,
    form.batchId,
    derivedSemesterMeta.error,
    derivedSemesterMeta.semester,
    selectedAcademicYear,
    selectedBatch,
    effectiveSemesterCategory,
  ])

  useEffect(() => {
    const nextSemester = derivedSemesterMeta.semester || ''
    setForm((p) => (p.semester === nextSemester ? p : { ...p, semester: nextSemester }))
  }, [derivedSemesterMeta.semester])

  const onChange = (key) => async (e) => {
    const value = e.target.value
    setError('')
    setSuccess('')

    if (key === 'allotmentMode') {
      setAllotmentMode(value)
      if (value === 'ALL_COURSES') {
        setForm((p) => ({ ...p, courseCode: '', courseName: 'All Courses' }))
      } else {
        setForm((p) => ({ ...p, courseName: '' }))
      }
      setDetailsLocked(false)
      return
    }

    if (key === 'institutionId') {
      setForm((p) => ({
        ...p,
        institutionId: value,
        departmentId: '',
        programmeId: '',
        regulationId: '',
        academicYearId: '',
        semesterCategory: '',
        batchId: '',
        semester: '',
        classId: '',
        className: '',
        classLabel: '',
        courseCode: '',
        courseName: '',
        programmeName: '',
      }))
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setBatches([])
      setClasses([])
      setOfferings([])
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
      setForm((p) => ({
        ...p,
        departmentId: value,
        programmeId: '',
        regulationId: '',
        classId: '',
        className: '',
        classLabel: '',
        courseCode: '',
        courseName: '',
        programmeName: '',
      }))
      setProgrammes([])
      setRegulations([])
      setClasses([])
      setOfferings([])
      if (!value || !form.institutionId) return

      try {
        setProgrammes(await lmsService.listProgrammes(form.institutionId, value))
      } catch {
        setError('Failed to load programmes')
      }
      return
    }

    if (key === 'programmeId') {
      const chosen = programmes.find((x) => String(x.id) === String(value))
      setForm((p) => ({
        ...p,
        programmeId: value,
        regulationId: '',
        classId: '',
        className: '',
        classLabel: '',
        courseCode: '',
        courseName: '',
        programmeName: chosen?.programmeName || '',
      }))
      setRegulations([])
      setClasses([])
      setOfferings([])
      if (!value || !form.institutionId || !form.departmentId) return

      try {
        const [r, c] = await Promise.all([
          lmsService.listRegulations(form.institutionId, value),
          lmsService.listClasses({ institutionId: form.institutionId, departmentId: form.departmentId, programmeId: value }),
        ])
        setRegulations(r)
        setClasses(c)
      } catch {
        setError('Failed to load programme scope')
      }
      return
    }

    if (key === 'academicYearId') {
      const chosen = academicYears.find((x) => String(x.id) === String(value))
      const nextCategory = chosen?.oddAcademicYearId ? 'ODD' : chosen?.evenAcademicYearId ? 'EVEN' : ''
      setForm((p) => ({
        ...p,
        academicYearId: value,
        semesterCategory: nextCategory,
        semester: '',
      }))
      return
    }

    if (key === 'semesterCategory') {
      setForm((p) => ({ ...p, semesterCategory: value, semester: '' }))
      return
    }

    if (key === 'classId') {
      const chosen = eligibleClasses.find((x) => String(x.id) === String(value))
      setForm((p) => ({ ...p, classId: value, className: chosen?.className || '', classLabel: chosen?.classLabel || '' }))
      return
    }

    if (key === 'courseCode') {
      const chosen = offerings.find((x) => String(x.course?.courseCode) === String(value))
      setForm((p) => ({ ...p, courseCode: value, courseName: chosen?.course?.courseTitle || '' }))
      return
    }

    setForm((p) => ({ ...p, [key]: value }))
  }

  useEffect(() => {
    ;(async () => {
      if (!form.institutionId || !form.academicYearId || !form.programmeId || !form.regulationId || !form.semester) {
        setOfferings([])
        return
      }
      try {
        const data = await lmsService.listCourseOfferings({
          institutionId: form.institutionId,
          academicYearId: form.academicYearId,
          semesterCategory: effectiveSemesterCategory,
          programmeId: form.programmeId,
          regulationId: form.regulationId,
          batchId: form.batchId,
          semester: form.semester,
        })
        setOfferings(data)
      } catch {
        setOfferings([])
      }
    })()
  }, [form.institutionId, form.academicYearId, form.programmeId, form.regulationId, form.batchId, form.semester])

  const onSearch = async () => {
                    if (!form.institutionId || !form.departmentId || !form.programmeId || !form.regulationId || !form.academicYearId || !form.batchId || !form.semester) {
      setError('Select full scope: Institution, Department, Programme, Regulation, Academic Year and Admission Batch')
      return
    }
    if (derivedSemesterMeta.error) {
      setError(derivedSemesterMeta.error)
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      const data = await lmsService.listStudents({
        institutionId: form.institutionId,
        departmentId: form.departmentId,
        programmeId: form.programmeId,
        regulationId: form.regulationId,
        academicYearId: form.academicYearId,
        semesterCategory: effectiveSemesterCategory,
        batchId: form.batchId,
        semester: form.semester,
        className: form.className,
        section: form.classLabel,
      })

      let allotmentSet = new Set()
      const scope = {
        institutionId: form.institutionId,
        departmentId: form.departmentId,
        programmeId: form.programmeId,
        regulationId: form.regulationId,
        academicYearId: form.academicYearId,
        semesterCategory: effectiveSemesterCategory,
        batchId: form.batchId,
        semester: form.semester,
      }
      if (allotmentMode === 'COURSE_WISE' && form.courseCode) {
        const allotments = await lmsService.listStudentAllotments({
          ...scope,
          courseCode: form.courseCode,
        })
        allotmentSet = new Set(allotments.map((x) => String(x.studentId)))
      }
      if (allotmentMode === 'ALL_COURSES') {
        const allotments = await lmsService.listStudentAllotmentsAllCourses(scope)
        allotmentSet = new Set(allotments.map((x) => String(x.studentId)))
      }

      const mapped = data
        .map((x) => ({
          id: x.id,
          studentId: x.studentId,
          batch: x.batch || '-',
          regNo: x.registerNumber,
          name: x.firstName,
          selected: allotmentSet.has(String(x.studentId)),
        }))

      setRows(mapped)
      setShowDetails(true)
      setDetailsLocked(allotmentMode === 'ALL_COURSES' && allotmentSet.size > 0)
      const allSelected = mapped.length > 0 && mapped.every((x) => x.selected)
      setSelectAll(allSelected)
      setForm((p) => ({
        ...p,
        status: !mapped.length
          ? 'No students found'
          : allotmentMode === 'COURSE_WISE' && form.courseCode
            ? 'Student allotment loaded'
            : allotmentMode === 'ALL_COURSES'
              ? 'Students loaded for all courses'
              : 'Students loaded',
      }))
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const onReset = () => {
    setAllotmentMode('COURSE_WISE')
    setForm(initialForm)
    setShowDetails(false)
    setRows([])
    setSelectAll(false)
    setDetailsLocked(false)
    setDepartments([])
    setProgrammes([])
    setRegulations([])
    setAcademicYears([])
    setBatches([])
    setClasses([])
    setOfferings([])
    setError('')
    setSuccess('')
  }

  const onAllotment = async () => {
    if (allotmentMode === 'COURSE_WISE' && !form.courseCode) {
      setError('Select Course Code to save student allotment')
      return
    }
    const selectedStudentIds = rows.filter((x) => x.selected).map((x) => x.studentId)
    if (derivedSemesterMeta.error) {
      setError(derivedSemesterMeta.error)
      return
    }
    if (!rows.length) {
      setError('No students found for the selected Admission Batch and derived semester')
      return
    }
    if (!selectedStudentIds.length) {
      setError('Select at least one student before saving allotment')
      return
    }
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const scope = {
        institutionId: form.institutionId,
        departmentId: form.departmentId,
        programmeId: form.programmeId,
        regulationId: form.regulationId,
        academicYearId: form.academicYearId,
        semesterCategory: effectiveSemesterCategory,
        batchId: form.batchId,
        semester: form.semester,
      }

      if (allotmentMode === 'ALL_COURSES') {
        const ok = window.confirm('Apply selected students to all courses in this scope?')
        if (!ok) return
        await lmsService.syncStudentAllotmentsAllCourses(scope, {
          studentIds: selectedStudentIds,
        })
      } else {
        await lmsService.syncStudentAllotments(scope, {
          courseCode: form.courseCode,
          studentIds: selectedStudentIds,
        })
      }
      setSuccess(
        allotmentMode === 'ALL_COURSES'
          ? 'Student allotment saved successfully for all courses'
          : 'Student allotment saved successfully',
      )
      setForm((p) => ({
        ...p,
        status: selectedStudentIds.length
          ? allotmentMode === 'ALL_COURSES'
            ? 'Student allotment done for all courses'
            : 'Student allotment done'
          : 'No students allotted',
      }))
      if (allotmentMode === 'ALL_COURSES') {
        setDetailsLocked(true)
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save student allotment')
    } finally {
      setSaving(false)
    }
  }

  const toggleSelectAll = () => {
    if (detailsLocked) return
    const next = !selectAll
    setSelectAll(next)
    setRows((p) => p.map((r) => ({ ...r, selected: next })))
  }

  const toggleRow = (id) => {
    if (detailsLocked) return
    setRows((p) => p.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r)))
  }

  useEffect(() => {
    setSelectAll(rows.length > 0 && rows.every((r) => r.selected))
  }, [rows])

  const selectedRowIds = useMemo(
    () => rows.filter((r) => r.selected).map((r) => r.id),
    [rows],
  )

  const detailColumns = useMemo(
    () => [
      { key: 'batch', label: 'Batch', sortable: true, width: 140 },
      { key: 'regNo', label: 'Register Number', sortable: true, width: 180 },
      { key: 'name', label: 'Student Name', sortable: true, width: 240 },
    ],
    [],
  )

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader>
            <strong>STUDENT ALLOTMENT</strong>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Student Allotment</strong>
          </CCardHeader>
          <CCardBody>
            {error ? <CAlert color="danger">{error}</CAlert> : null}
            {success ? <CAlert color="success">{success}</CAlert> : null}
            <CForm>
              <CRow className="g-3">
                <CCol md={3}><CFormLabel>Institution</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.institutionId} onChange={onChange('institutionId')}>
                    <option value="">Select Institution</option>
                    {institutions.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Department</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.departmentId} onChange={onChange('departmentId')}>
                    <option value="">Select Department</option>
                    {departments.map((x) => <option key={x.id} value={x.id}>{x.departmentName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.programmeId} onChange={onChange('programmeId')}>
                    <option value="">Select Programme Code</option>
                    {programmes.map((x) => <option key={x.id} value={x.id}>{x.programmeCode}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Regulation</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.regulationId} onChange={onChange('regulationId')}>
                    <option value="">Select Regulation</option>
                    {regulations.map((x) => <option key={x.id} value={x.id}>{x.regulationCode}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Academic Year</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.academicYearId} onChange={onChange('academicYearId')}>
                    <option value="">Select Academic Year</option>
                    {academicYears.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.academicYearLabel || `${x.academicYear}${x.semesterCategory ? ` (${x.semesterCategory})` : ''}`}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Admission Batch</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.batchId} onChange={onChange('batchId')}>
                    <option value="">Select Admission Batch</option>
                    {batches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Semester Category</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semesterCategory} onChange={onChange('semesterCategory')} disabled={!form.academicYearId}>
                    <option value="">{form.academicYearId ? 'Select Semester Category' : 'Select Academic Year'}</option>
                    {semesterCategoryOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Derived Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormInput
                    value={form.semester ? `Sem - ${form.semester}` : ''}
                    placeholder="Select Academic Year, Semester Category and Admission Batch"
                    disabled
                  />
                </CCol>
                <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.programmeName || '-'} disabled /></CCol>

                <CCol md={3}><CFormLabel>Class Name</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.classId} onChange={onChange('classId')}>
                    <option value="">Select Class Name</option>
                    {eligibleClasses.map((x) => <option key={x.id} value={x.id}>{x.className} {x.classLabel ? `- ${x.classLabel}` : ''}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Select Class Label</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.classLabel} onChange={onChange('classLabel')}>
                    <option value="">Select Class Label</option>
                    {classLabelOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Allotment Scope</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={allotmentMode} onChange={onChange('allotmentMode')}>
                    <option value="COURSE_WISE">Course Wise</option>
                    <option value="ALL_COURSES">All Courses</option>
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Course Code</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={form.courseCode}
                    onChange={onChange('courseCode')}
                    disabled={allotmentMode === 'ALL_COURSES'}
                  >
                    <option value="">Select Course Code</option>
                    {offerings.map((x) => (
                      <option key={x.id} value={x.course?.courseCode || ''}>{x.course?.courseCode || '-'}</option>
                    ))}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Course Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={allotmentMode === 'ALL_COURSES' ? 'All Courses' : form.courseName || '-'} disabled /></CCol>

                <CCol md={3}><CFormLabel>Status</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.status} disabled /></CCol>

                <CCol md={3}><CFormLabel>Action</CFormLabel></CCol>
                <CCol md={3} className="d-flex gap-2 justify-content-end">
                  <ArpButton label={loading ? 'Loading...' : 'Search'} icon="search" color="primary" onClick={onSearch} disabled={loading} />
                  <ArpButton label="Reset" icon="reset" color="secondary" onClick={onReset} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {showDetails ? (
          <ArpDataTable
            title="Student Allotment Details"
            rows={rows}
            columns={detailColumns}
            rowKey="id"
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            searchPlaceholder="Search by Register Number or Name"
            selection={{
              type: 'checkbox',
              selected: selectedRowIds,
              onChange: (selectedIds) => {
                if (detailsLocked) return
                const nextSet = new Set(selectedIds)
                setRows((prev) => prev.map((row) => ({ ...row, selected: nextSet.has(row.id) })))
              },
              key: 'id',
              headerLabel: 'Enrollment',
              width: 110,
              disabled: () => detailsLocked,
            }}
            headerActions={(
              <>
                <CFormCheck
                  label="Select All Students"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  disabled={detailsLocked}
                />
                <ArpButton
                  label={saving ? 'Saving...' : allotmentMode === 'ALL_COURSES' ? 'Allot to All Courses' : 'Allotment'}
                  icon="check"
                  color="success"
                  onClick={onAllotment}
                  disabled={saving || detailsLocked}
                />
                {allotmentMode === 'ALL_COURSES' ? (
                  <ArpButton
                    label="Edit"
                    icon="edit"
                    color="warning"
                    onClick={() => {
                      setDetailsLocked(false)
                      setError('')
                      setSuccess('Edit mode enabled. Update student selections and save again.')
                    }}
                    disabled={!detailsLocked}
                  />
                ) : null}
                <ArpButton label="Reset" icon="reset" color="secondary" onClick={onReset} />
                <ArpButton label="Cancel" icon="cancel" color="danger" onClick={() => setShowDetails(false)} />
              </>
            )}
          />
        ) : null}
      </CCol>
    </CRow>
  )
}

export default StudentAllotmentConfiguration
