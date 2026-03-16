import React, { useEffect, useMemo, useRef, useState } from 'react'
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
} from '@coreui/react-pro'
import { ArpButton, ArpDataTable, ArpIconButton, useArpToast } from '../../components/common'
import { lmsService, semesterOptionsFromAcademicYear } from '../../services/lmsService'

const initialForm = {
  institutionId: '',
  departmentId: '',
  programmeId: '',
  regulationId: '',
  academicYearId: '',
  batchId: '',
  semester: '',
  courseOfferingId: '',
  programmeName: '',
  semesterCategory: '',
  status: 'Course Allotment not done',
}

const makeDraftRowId = () => `draft::${Date.now()}::${Math.random().toString(36).slice(2, 8)}`

const CourseAllotmentConfiguration = () => {
  const toast = useArpToast()
  const [form, setForm] = useState(initialForm)
  const [showDetails, setShowDetails] = useState(false)
  const [rows, setRows] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [faculties, setFaculties] = useState([])
  const [savingAllotment, setSavingAllotment] = useState(false)
  const [allotmentLocked, setAllotmentLocked] = useState(false)

  const [institutions, setInstitutions] = useState([])
  const [departments, setDepartments] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [regulations, setRegulations] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [regulationMaps, setRegulationMaps] = useState([])
  const [batches, setBatches] = useState([])
  const lastToastKeyRef = useRef('')

  const showToast = (type, message, options = {}) => {
    toast.show({
      type,
      message,
      autohide: type === 'success',
      delay: 4500,
      ...options,
    })
  }

  useEffect(() => {
    ;(async () => {
      try {
        const rowsData = await lmsService.listInstitutions()
        setInstitutions(rowsData)
      } catch {
        setError('Failed to load institutions')
      }
    })()
  }, [])

  const selectedAcademicYear = useMemo(
    () => academicYears.find((x) => String(x.id) === String(form.academicYearId)) || null,
    [academicYears, form.academicYearId],
  )

  const filteredBatches = useMemo(() => {
    if (!form.regulationId) return batches
    const ids = new Set(
      regulationMaps
        .filter((x) => String(x.regulationId) === String(form.regulationId))
        .map((x) => x.batchId),
    )
    return batches.filter((x) => ids.has(x.id))
  }, [batches, regulationMaps, form.regulationId])

  const semesterCategoryOptions = useMemo(() => {
    if (!selectedAcademicYear) return []

    const options = []
    if (Array.isArray(selectedAcademicYear?.oddChosenSemesters) && selectedAcademicYear.oddChosenSemesters.length > 0) {
      options.push('ODD')
    }
    if (Array.isArray(selectedAcademicYear?.evenChosenSemesters) && selectedAcademicYear.evenChosenSemesters.length > 0) {
      options.push('EVEN')
    }
    if (options.length === 0) {
      const totalSemesters = Number(selectedAcademicYear?.semesters)
      if (Number.isFinite(totalSemesters) && totalSemesters > 0) {
        options.push('ODD', 'EVEN')
      }
    }
    return options
  }, [selectedAcademicYear])

  const semesterOptions = useMemo(
    () => {
      const category = String(form.semesterCategory || '').toUpperCase().trim()
      const fromMap = regulationMaps
        .filter((x) => !form.regulationId || String(x.regulationId) === String(form.regulationId))
        .filter((x) => !form.batchId || String(x.batchId) === String(form.batchId))
        .map((x) => Number(x.semester))
        .filter((x) => Number.isFinite(x) && x > 0)
        .filter((x) => (category === 'ODD' ? x % 2 === 1 : category === 'EVEN' ? x % 2 === 0 : true))

      const unique = Array.from(new Set(fromMap)).sort((a, b) => a - b)
      if (unique.length) return unique.map((x) => ({ value: String(x), label: `Sem - ${x}` }))

      return semesterOptionsFromAcademicYear(selectedAcademicYear, category)
    },
    [regulationMaps, form.regulationId, form.batchId, form.semesterCategory, selectedAcademicYear],
  )

  const scopeReadyForTemplate = useMemo(
    () =>
      Boolean(
        form.institutionId &&
          form.academicYearId &&
          form.programmeId &&
          form.regulationId &&
          form.semester,
      ),
    [form.institutionId, form.academicYearId, form.programmeId, form.regulationId, form.semester],
  )

  const selectedRow = useMemo(
    () => rows.find((r) => String(r.id) === String(selectedId)) || null,
    [rows, selectedId],
  )

  const totalAllocatedHours = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const value = Number(row?.hoursAllocated)
        return Number.isFinite(value) && value > 0 ? sum + value : sum
      }, 0),
    [rows],
  )

  useEffect(() => {
    setForm((p) => {
      const nextCategory = semesterCategoryOptions.includes(p.semesterCategory)
        ? p.semesterCategory
        : semesterCategoryOptions[0] || ''
      const allowedSemesters = semesterOptions.map((x) => String(x.value))
      const nextSemester = allowedSemesters.includes(String(p.semester)) ? p.semester : ''
      if (p.semesterCategory === nextCategory && String(p.semester || '') === String(nextSemester || '')) return p
      return { ...p, semesterCategory: nextCategory, semester: nextSemester }
    })
  }, [semesterCategoryOptions, semesterOptions])

  useEffect(() => {
    ;(async () => {
      if (!form.institutionId || !form.departmentId || !form.academicYearId) {
        setFaculties([])
        return
      }
      try {
        const list = await lmsService.listFaculties({
          institutionId: form.institutionId,
          departmentId: '',
          academicYearId: form.academicYearId,
        })
        setFaculties(list)
      } catch {
        setFaculties([])
      }
    })()
  }, [form.institutionId, form.departmentId, form.academicYearId])

  const loadRegulationMapScope = async (institutionId, academicYearId, programmeId) => {
    if (!institutionId || !academicYearId || !programmeId) {
      setRegulations([])
      setBatches([])
      setRegulationMaps([])
      return
    }
    const selectedYear = academicYears.find((x) => String(x.id) === String(academicYearId)) || null
    const academicYearIds = [selectedYear?.oddAcademicYearId, selectedYear?.evenAcademicYearId].filter(Boolean)
    const mapped = await lmsService.listRegulationMaps({
      institutionId,
      ...(academicYearIds.length ? { academicYearIds } : { academicYearId }),
      programmeId,
    })
    setRegulationMaps(mapped)

    const regMap = new Map()
    const batchMap = new Map()
    mapped.forEach((x) => {
      if (x.regulationId) regMap.set(String(x.regulationId), { id: x.regulationId, regulationCode: x.regulationCode || '-' })
      if (x.batchId) batchMap.set(String(x.batchId), { id: x.batchId, batchName: x.batch || '-' })
    })

    setRegulations(Array.from(regMap.values()))
    setBatches(Array.from(batchMap.values()))
  }

  const loadCoursesForScope = async (scope) => {
    const required = ['institutionId', 'academicYearId', 'programmeId', 'regulationId', 'semester']
    if (required.some((k) => !scope[k])) {
      setCourses([])
      setForm((p) => ({ ...p, status: 'Course Allotment not done' }))
      return []
    }

    const data = await lmsService.listCourseOfferings({
      institutionId: scope.institutionId,
      academicYearId: scope.academicYearId,
      programmeId: scope.programmeId,
      regulationId: scope.regulationId,
      batchId: scope.batchId,
      semester: scope.semester,
    })

    const mapped = data.map((x, idx) => ({
      id: x.id,
      courseId: x.courseId,
      code: x.course?.courseCode || '-',
      name: x.course?.courseTitle || '-',
      fid: '-',
      fname: '-',
      chapters: x.course?.totalUnits ?? '-',
      hours: x.course?.totalHours ?? '-',
      order: x.courseOrder ?? idx + 1,
    }))

    setCourses(mapped)
    setForm((p) => ({ ...p, status: 'Course Allotment not done' }))
    if (!mapped.length) {
      const toastKey = ['no-offerings', scope.academicYearId, scope.programmeId, scope.regulationId, scope.batchId, scope.semester]
        .map((x) => String(x || 'ALL'))
        .join('::')
      setError(
        scope.batchId
          ? 'No course offerings are available for the selected Admission Batch and semester. Complete Setup -> CAY Courses for this scope first.'
          : 'No course offerings are available for the selected scope.',
      )
      if (scope.batchId && lastToastKeyRef.current !== toastKey) {
        lastToastKeyRef.current = toastKey
        showToast(
          'warning',
          'No CAY course offerings are available for this Admission Batch and semester. Please complete Setup -> CAY Courses first, then return to Course Allotment.',
          { autohide: false },
        )
      }
    } else {
      setError('')
      lastToastKeyRef.current = ''
    }
    return mapped
  }

  const buildAllocationRows = (courseRows = [], detailRows = []) => {
    const facultyById = new Map(faculties.map((faculty) => [String(faculty.id), faculty]))
    const groupedDetails = new Map()

    detailRows.forEach((row) => {
      const key = String(row.courseId || '')
      const list = groupedDetails.get(key) || []
      list.push(row)
      groupedDetails.set(key, list)
    })

    const rowsList = []
    courseRows.forEach((course, index) => {
      const detailList = groupedDetails.get(String(course.courseId || '')) || []
      if (!detailList.length) {
        rowsList.push({
          id: `course::${course.id || index + 1}`,
          courseId: course.courseId || '',
          courseOfferingId: course.id || '',
          courseCode: course.code || '-',
          courseName: course.name || '-',
          courseDisplay: `${course.code || '-'} - ${course.name || '-'}`,
          totalChapters: Number(course.chapters),
          totalHours: Number(course.hours),
          allocationDepartmentId: form.departmentId || '',
          facultySearch: '',
          facultyId: '',
          facultyCode: '',
          facultyName: '',
          originalFacultyId: '',
          chaptersAllocated: '',
          hoursAllocated: '',
          statusLabel: 'Pending',
          persisted: false,
        })
        return
      }

      detailList.forEach((detail, detailIndex) => {
        const faculty = facultyById.get(String(detail.facultyId || '')) || null
        rowsList.push({
          id: detail.id || `${detail.courseId || course.courseId}::${detail.facultyId || detailIndex + 1}`,
          courseId: detail.courseId || course.courseId || '',
          courseOfferingId: detail.courseOfferingId || course.id || '',
          courseCode: detail.code || course.code || '-',
          courseName: detail.name || course.name || '-',
          courseDisplay: `${detail.code || course.code || '-'} - ${detail.name || course.name || '-'}`,
          totalChapters: Number(course.chapters),
          totalHours: Number(course.hours),
          allocationDepartmentId: faculty?.departmentId || form.departmentId || '',
          facultySearch: '',
          facultyId: detail.facultyId || '',
          facultyCode: detail.fid === '-' ? faculty?.facultyCode || '' : detail.fid || '',
          facultyName: detail.fname === '-' ? faculty?.facultyName || '' : detail.fname || '',
          originalFacultyId: detail.facultyId || '',
          chaptersAllocated: detail.chapters === '-' ? '' : String(detail.chapters || ''),
          hoursAllocated: detail.hours === '-' ? '' : String(detail.hours || ''),
          statusLabel: detail.facultyId ? 'Allotment Done' : 'Pending',
          persisted: Boolean(detail.facultyId),
        })
      })
    })

    return rowsList
  }

  const getDepartmentFaculties = (departmentId, query = '') => {
    const q = String(query || '').trim().toLowerCase()
    return faculties.filter((faculty) => {
      const matchesDepartment = !departmentId || String(faculty.departmentId) === String(departmentId)
      if (!matchesDepartment) return false
      if (!q) return true
      return `${faculty.facultyCode || ''} ${faculty.facultyName || ''}`.toLowerCase().includes(q)
    })
  }

  const getMaxAllocatableValue = (row, fieldKey, totalKey) => {
    const total = Number(row?.[totalKey])
    if (!Number.isFinite(total) || total < 1) return 0
    const current = Number(row?.[fieldKey])
    const otherTotal = rows
      .filter((item) => String(item.courseId) === String(row.courseId) && String(item.id) !== String(row.id))
      .reduce((sum, item) => {
        const value = Number(item?.[fieldKey])
        return Number.isFinite(value) && value > 0 ? sum + value : sum
      }, 0)
    const allowance = total - otherTotal
    const effective = Number.isFinite(current) && current > 0 ? Math.max(current, allowance) : allowance
    return effective > 0 ? effective : 0
  }

  const buildNumericOptions = (maxValue) =>
    Array.from({ length: Math.max(0, maxValue) }, (_, index) => String(index + 1))

  const updateAllocationRow = (rowId, updater) => {
    setRows((prev) =>
      prev.map((row) => {
        if (String(row.id) !== String(rowId)) return row
        const next = typeof updater === 'function' ? updater(row) : { ...row, ...updater }
        return {
          ...next,
          statusLabel: next.facultyId ? 'Allotment Done' : 'Pending',
        }
      }),
    )
  }

  const onChange = (key) => async (e) => {
    const value = e.target.value
    setError('')
    setSuccess('')

    if (key === 'institutionId') {
      setForm((p) => ({
        ...p,
        institutionId: value,
        departmentId: '',
        programmeId: '',
        regulationId: '',
        academicYearId: '',
        batchId: '',
        semester: '',
        courseOfferingId: '',
        programmeName: '',
        semesterCategory: '',
        status: 'Course Allotment not done',
      }))
      setDepartments([])
      setProgrammes([])
      setRegulations([])
      setAcademicYears([])
      setRegulationMaps([])
      setBatches([])
      setCourses([])
      setRows([])
      if (!value) return
      try {
        const [d, ay] = await Promise.all([lmsService.listDepartments(value), lmsService.listAcademicYears(value)])
        setDepartments(d)
        setAcademicYears(ay)
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
        batchId: '',
        semester: '',
        courseOfferingId: '',
        programmeName: '',
      }))
      setProgrammes([])
      setRegulations([])
      setRegulationMaps([])
      setBatches([])
      setCourses([])
      setRows([])
      if (!value || !form.institutionId) return
      try {
        const p = await lmsService.listProgrammes(form.institutionId, value)
        setProgrammes(p)
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
        batchId: '',
        semester: '',
        courseOfferingId: '',
        programmeName: chosen?.programmeName || '',
      }))
      setRegulations([])
      setRegulationMaps([])
      setBatches([])
      setCourses([])
      setRows([])
      if (!value || !form.institutionId || !form.academicYearId) return
      try {
        await loadRegulationMapScope(form.institutionId, form.academicYearId, value)
      } catch {
        setError('Failed to load regulation map scope')
      }
      return
    }

    if (key === 'academicYearId') {
      setForm((p) => ({
        ...p,
        academicYearId: value,
        regulationId: '',
        batchId: '',
        semester: '',
        courseOfferingId: '',
        semesterCategory: '',
      }))
      setRegulations([])
      setRegulationMaps([])
      setBatches([])
      setCourses([])
      setRows([])
      if (!value || !form.institutionId || !form.programmeId) return
      try {
        await loadRegulationMapScope(form.institutionId, value, form.programmeId)
      } catch {
        setError('Failed to load regulation map scope')
      }
      return
    }

    if (key === 'semesterCategory') {
      setForm((p) => ({ ...p, semesterCategory: value, semester: '', courseOfferingId: '' }))
      setCourses([])
      setRows([])
      return
    }

    if (key === 'regulationId') {
      setForm((p) => ({ ...p, regulationId: value, batchId: '', semester: '', courseOfferingId: '' }))
      setCourses([])
      setRows([])
      return
    }

    if (key === 'batchId' || key === 'semester') {
      setForm((p) => ({ ...p, [key]: value, courseOfferingId: '' }))
      setRows([])
      return
    }

    setForm((p) => ({ ...p, [key]: value }))
  }

  useEffect(() => {
    ;(async () => {
      try {
        await loadCoursesForScope(form)
      } catch {
        setCourses([])
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.institutionId, form.academicYearId, form.programmeId, form.regulationId, form.batchId, form.semester])

  const onSearch = async () => {
    if (!form.institutionId || !form.academicYearId || !form.programmeId || !form.regulationId || !form.semester) {
      setError('Select Institution, Department, Programme, Regulation, Academic Year and Semester')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')
      const mapped = await loadCoursesForScope(form)
      const details = await lmsService.listCourseAllotmentDetails(buildImportScope())
      const detailRows = details.map((x, idx) => ({
        id: x.id || `${x.courseId || idx + 1}::${x.facultyId || ''}`,
        courseId: x.courseId || '',
        courseOfferingId: x.courseOfferingId || '',
        code: x.courseCode || '-',
        name: x.courseName || '-',
        fid: x.facultyCode || '-',
        fname: x.facultyName || '-',
        facultyId: x.facultyId || '',
        chapters: x.chaptersAllocated ?? '-',
        hours: x.hoursAllocated ?? '-',
        commonCourse: Boolean(x.commonCourse),
        commonScheduleName: x.commonScheduleName || '',
      }))
      const chosenCourse = form.courseOfferingId
        ? mapped.find((x) => String(x.id) === String(form.courseOfferingId))
        : null
      const scopedCourses = chosenCourse ? mapped.filter((x) => String(x.id) === String(chosenCourse.id)) : mapped
      const scopedDetails = chosenCourse
        ? detailRows.filter((x) => String(x.courseId) === String(chosenCourse.courseId))
        : detailRows
      const list = buildAllocationRows(scopedCourses, scopedDetails)
      setRows(list)
      const hasAllotment = list.some((x) => x.persisted)
      setForm((p) => ({ ...p, status: hasAllotment ? 'Course Allotment done' : 'Course Allotment not done' }))
      setAllotmentLocked(hasAllotment)
      setShowDetails(true)
      setSelectedId(null)
      if (!mapped.length) setForm((p) => ({ ...p, status: 'Course Allotment not done' }))
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load course allotment')
    } finally {
      setLoading(false)
    }
  }

  const onReset = () => {
    setForm(initialForm)
    setShowDetails(false)
    setRows([])
    setCourses([])
    setSelectedId(null)
    setSuccess('')
    setDepartments([])
    setProgrammes([])
    setRegulations([])
    setRegulationMaps([])
    setAcademicYears([])
    setBatches([])
    setError('')
    setAllotmentLocked(false)
  }

  const onAddNew = () => {
    setForm(initialForm)
    setRows([])
    setCourses([])
    setShowDetails(false)
    setSelectedId(null)
    setError('')
    setSuccess('')
    setAllotmentLocked(false)
  }

  const downloadBufferAsFile = (buffer, filename, contentType) => {
    const blob = new Blob([buffer], {
      type: contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  const filenameFromContentDisposition = (headerValue, fallback) => {
    const txt = String(headerValue || '')
    const m = txt.match(/filename="?([^"]+)"?/i)
    return (m && m[1]) || fallback
  }

  const parseApiErrorMessage = async (e, fallback) => {
    const data = e?.response?.data
    if (!data) return fallback
    try {
      if (typeof Blob !== 'undefined' && data instanceof Blob) {
        const txt = await data.text()
        const j = txt ? JSON.parse(txt) : null
        return j?.error || j?.message || txt || fallback
      }
      if (data instanceof ArrayBuffer) {
        const txt = new TextDecoder('utf-8').decode(data)
        const j = txt ? JSON.parse(txt) : null
        return j?.error || j?.message || txt || fallback
      }
      if (typeof data === 'string') {
        try {
          const j = JSON.parse(data)
          return j?.error || j?.message || fallback
        } catch {
          return data || fallback
        }
      }
      if (typeof data === 'object') return data?.error || data?.message || fallback
      return fallback
    } catch {
      return fallback
    }
  }

  const buildImportScope = () => ({
    institutionId: form.institutionId,
    academicYearId: form.academicYearId,
    programmeId: form.programmeId,
    regulationId: form.regulationId,
    batchId: form.batchId,
    semester: form.semester,
  })

  const onAddAllocation = () => {
    if (allotmentLocked) {
      setError('Click Edit to modify saved course allotment records')
      return
    }
    if (!selectedRow?.courseId) {
      setError('Select one course row before adding another allocation row')
      return
    }
    setError('')
    setSuccess('')
    const nextRow = {
      id: makeDraftRowId(),
      courseId: selectedRow.courseId,
      courseOfferingId: selectedRow.courseOfferingId,
      courseCode: selectedRow.courseCode,
      courseName: selectedRow.courseName,
      courseDisplay: selectedRow.courseDisplay,
      totalChapters: selectedRow.totalChapters,
      totalHours: selectedRow.totalHours,
      allocationDepartmentId: selectedRow.allocationDepartmentId || form.departmentId || '',
      facultySearch: '',
      facultyId: '',
      facultyCode: '',
      facultyName: '',
      originalFacultyId: '',
      chaptersAllocated: '',
      hoursAllocated: '',
      statusLabel: 'Pending',
      persisted: false,
    }
    setRows((prev) => [...prev, nextRow])
    setSelectedId(nextRow.id)
  }

  const onDeleteAllocation = async () => {
    if (allotmentLocked) {
      setError('Click Edit to modify saved course allotment records')
      return
    }
    if (!selectedRow) {
      setError('Select one row to delete')
      return
    }

    if (!selectedRow.persisted) {
      setRows((prev) => prev.filter((row) => String(row.id) !== String(selectedRow.id)))
      setSelectedId(null)
      setSuccess('Allocation row removed')
      return
    }

    if (!selectedRow.courseId || !selectedRow.facultyId) return
    if (!window.confirm('Delete selected course allotment?')) return
    try {
      setError('')
      setSuccess('')
      await lmsService.deleteCourseAllotment(buildImportScope(), selectedRow.courseId, selectedRow.facultyId)
      setSuccess('Course allotment deleted successfully')
      await onSearch()
    } catch (e) {
      const msg = await parseApiErrorMessage(e, 'Failed to delete course allotment')
      setError(msg)
    }
  }

  const saveAllocationRow = async (row) => {
    if (!row) {
      setError('Select one row to save')
      return
    }
    if (!row.facultyId) {
      setError('Select faculty')
      return
    }
    if (!row.allocationDepartmentId) {
      setError('Select department for the chosen row')
      return
    }
    const chapters = String(row.chaptersAllocated || '').trim()
    const hours = String(row.hoursAllocated || '').trim()
    if (!chapters) {
      setError('Choose chapters for the selected row')
      return
    }
    if (!hours) {
      setError('Choose hours for the selected row')
      return
    }
    const maxChapters = getMaxAllocatableValue(row, 'chaptersAllocated', 'totalChapters')
    const maxHours = getMaxAllocatableValue(row, 'hoursAllocated', 'totalHours')
    if (Number(chapters) > maxChapters) {
      setError(`Chapters exceed allowed limit (${maxChapters}) for this course`)
      return
    }
    if (Number(hours) > maxHours) {
      setError(`Hours exceed allowed limit (${maxHours}) for this course`)
      return
    }
    try {
      setSavingAllotment(true)
      setError('')
      setSuccess('')
      const scope = buildImportScope()
      if (row.persisted) {
        await lmsService.updateCourseAllotment(scope, row.courseId, {
          courseId: row.courseId,
          facultyId: row.facultyId,
          originalFacultyId: row.originalFacultyId || row.facultyId,
          chaptersAllocated: chapters,
          hoursAllocated: hours,
        })
      } else {
        await lmsService.saveCourseAllotment(scope, {
          courseId: row.courseId,
          facultyId: row.facultyId,
          chaptersAllocated: chapters,
          hoursAllocated: hours,
        })
      }
      return { ok: true }
    } catch (e) {
      const msg = await parseApiErrorMessage(e, 'Failed to save course allotment')
      return { ok: false, message: msg }
    } finally {
    }
  }

  const onSaveAllocation = async () => {
    if (allotmentLocked) {
      setError('Click Edit to update saved course allotment records')
      return
    }
    const rowsToSave = rows.filter((row) => row.facultyId && row.chaptersAllocated && row.hoursAllocated)
    if (!rowsToSave.length) {
      setError('Enter at least one complete course allotment row before saving')
      return
    }
    setSavingAllotment(true)
    setError('')
    setSuccess('')
    for (const row of rowsToSave) {
      const result = await saveAllocationRow(row)
      if (!result?.ok) {
        setError(result?.message || 'Failed to save course allotment')
        setSavingAllotment(false)
        return
      }
    }
    setSuccess('Course allotment records saved successfully')
    setForm((p) => ({ ...p, status: 'Course Allotment done' }))
    setAllotmentLocked(true)
    await onSearch()
    setSavingAllotment(false)
  }

  const onEditAllotment = () => {
    setError('')
    setSuccess('')
    setAllotmentLocked(false)
  }

  const allocationColumns = useMemo(
    () => [
      {
        key: 'courseDisplay',
        label: 'Course Code / Course Name',
        sortable: true,
        width: 220,
        render: (row) => (
          <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.35 }}>
            {row.courseDisplay}
          </div>
        ),
      },
      {
        key: 'chaptersAllocated',
        label: 'Chapters',
        width: 150,
        render: (row) => {
          const maxValue = getMaxAllocatableValue(row, 'chaptersAllocated', 'totalChapters')
          const options = buildNumericOptions(maxValue)
          return (
            <CFormSelect
              size="sm"
              value={row.chaptersAllocated || ''}
              disabled={allotmentLocked || savingAllotment}
              onChange={(e) => updateAllocationRow(row.id, { chaptersAllocated: e.target.value })}
            >
              <option value="">Choose Chapters</option>
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </CFormSelect>
          )
        },
      },
      {
        key: 'hoursAllocated',
        label: 'Hours',
        width: 150,
        render: (row) => {
          const maxValue = getMaxAllocatableValue(row, 'hoursAllocated', 'totalHours')
          const options = buildNumericOptions(maxValue)
          return (
            <CFormSelect
              size="sm"
              value={row.hoursAllocated || ''}
              disabled={allotmentLocked || savingAllotment}
              onChange={(e) => updateAllocationRow(row.id, { hoursAllocated: e.target.value })}
            >
              <option value="">Choose Hours</option>
              {options.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </CFormSelect>
          )
        },
      },
      {
        key: 'allocationDepartmentId',
        label: 'Department',
        width: 220,
        render: (row) => (
          <CFormSelect
            size="sm"
            value={row.allocationDepartmentId || ''}
            disabled={allotmentLocked || savingAllotment}
            onChange={(e) =>
              updateAllocationRow(row.id, {
                allocationDepartmentId: e.target.value,
                facultySearch: '',
                facultyId: '',
                facultyCode: '',
                facultyName: '',
                originalFacultyId: row.persisted ? row.originalFacultyId : '',
                persisted: false,
              })
            }
          >
            <option value="">Select Department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.departmentName}
              </option>
            ))}
          </CFormSelect>
        ),
      },
      {
        key: 'facultyId',
        label: 'Faculty',
        width: 340,
        render: (row) => {
          const options = getDepartmentFaculties(row.allocationDepartmentId, row.facultySearch)
          return (
            <div>
              <CFormInput
                size="sm"
                className="mb-1"
                placeholder="Search faculty"
                value={row.facultySearch || ''}
                disabled={allotmentLocked || savingAllotment}
                onChange={(e) => updateAllocationRow(row.id, { facultySearch: e.target.value })}
              />
              <CFormSelect
                size="sm"
                value={row.facultyId || ''}
                disabled={allotmentLocked || savingAllotment}
                onChange={(e) => {
                  const nextFaculty = faculties.find((faculty) => String(faculty.id) === String(e.target.value)) || null
                  updateAllocationRow(row.id, {
                    facultyId: e.target.value,
                    facultyCode: nextFaculty?.facultyCode || '',
                    facultyName: nextFaculty?.facultyName || '',
                  })
                }}
              >
                <option value="">Select Faculty</option>
                {options.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.facultyCode} - {faculty.facultyName}
                  </option>
                ))}
              </CFormSelect>
            </div>
          )
        },
      },
      {
        key: 'statusLabel',
        label: 'Status',
        width: 140,
        render: (row) => row.statusLabel || 'Pending',
      },
    ],
    [allotmentLocked, departments, faculties, rows, savingAllotment],
  )

  const onExportAllotments = async () => {
    if (!scopeReadyForTemplate) {
      setError('Select scope to download course allotment details')
      return
    }
    try {
      setError('')
      setSuccess('')
      const scope = buildImportScope()
      const res = await lmsService.exportCourseAllotmentDetails(scope)
      const filename = filenameFromContentDisposition(
        res?.headers?.['content-disposition'],
        `Course_Allotment_Details_Sem_${scope.semester}.xlsx`,
      )
      downloadBufferAsFile(res.data, filename, res?.headers?.['content-type'])
    } catch (e) {
      const msg = await parseApiErrorMessage(e, 'Failed to export course allotment details')
      setError(msg)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>COURSE ALLOTMENT</strong>
            <div className="d-flex gap-2">
              <ArpButton label="AddNew" icon="add" color="purple" onClick={onAddNew} />
            </div>
          </CCardHeader>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader>
            <strong>Course Allotment</strong>
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

                <CCol md={3}><CFormLabel>Admission Batch</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.batchId} onChange={onChange('batchId')}>
                    <option value="">All Admission Batches</option>
                    {filteredBatches.map((x) => <option key={x.id} value={x.id}>{x.batchName}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Programme Name</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.programmeName || '-'} disabled /></CCol>

                <CCol md={3}><CFormLabel>Semester Category</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semesterCategory} onChange={onChange('semesterCategory')} disabled={!form.academicYearId}>
                    <option value="">{form.academicYearId ? 'Select Semester Category' : 'Select Academic Year'}</option>
                    {semesterCategoryOptions.map((x) => <option key={x} value={x}>{x}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Choose Semester</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.semester} onChange={onChange('semester')}>
                    <option value="">Select Semester</option>
                    {semesterOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Courses</CFormLabel></CCol>
                <CCol md={3}>
                  <CFormSelect value={form.courseOfferingId} onChange={onChange('courseOfferingId')}>
                    <option value="">All Courses</option>
                    {courses.map((x) => <option key={x.id} value={x.id}>{x.code} - {x.name}</option>)}
                  </CFormSelect>
                </CCol>

                <CCol md={3}><CFormLabel>Status of Course Allotment</CFormLabel></CCol>
                <CCol md={3}><CFormInput value={form.status} disabled /></CCol>

                <CCol md={3}><CFormLabel>Action</CFormLabel></CCol>
                <CCol md={3} className="d-flex gap-2">
                  <ArpButton
                    type="button"
                    label={loading ? 'Loading...' : 'Search'}
                    icon="search"
                    color="primary"
                    onClick={onSearch}
                    disabled={loading}
                  />
                  <ArpButton type="button" label="Reset" icon="reset" color="secondary" onClick={onReset} />
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>

        {showDetails && (
          <ArpDataTable
            title="Course Allocation Details"
            rows={rows}
            columns={allocationColumns}
            rowKey="id"
            searchable
            searchPlaceholder="Search course, faculty or status"
            defaultPageSize={10}
            pageSizeOptions={[5, 10, 20, 50]}
            emptyText="No course allocation rows available for selected scope."
            selection={{
              type: 'radio',
              selected: selectedId,
              onChange: (value) => setSelectedId(value),
              key: 'id',
              name: 'courseAllocationRow',
              headerLabel: 'Select',
            }}
            headerActions={
              <>
                <div className="text-body-secondary small me-2">
                  Total Hours Allocated: <strong>{totalAllocatedHours}</strong>
                </div>
                <ArpIconButton icon="add" color="success" onClick={onAddAllocation} disabled={allotmentLocked} title="Add allocation row" />
                <ArpIconButton icon="edit" color="warning" onClick={onEditAllotment} disabled={!allotmentLocked} title="Edit saved allotments" />
                <ArpButton
                  type="button"
                  label={savingAllotment ? 'Saving...' : 'Save Course Allotment'}
                  icon="save"
                  color="success"
                  onClick={onSaveAllocation}
                  disabled={savingAllotment || allotmentLocked}
                />
                <ArpIconButton icon="delete" color="danger" onClick={onDeleteAllocation} disabled={!selectedId || allotmentLocked} title="Delete selected row" />
                <ArpIconButton icon="download" color="secondary" onClick={onExportAllotments} title="Export allotment details" />
              </>
            }
          />
        )}
      </CCol>
    </CRow>
  )
}

export default CourseAllotmentConfiguration
