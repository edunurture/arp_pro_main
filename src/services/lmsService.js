import api from './apiClient'

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

const toObject = (payload) => {
  if (payload?.data?.data && typeof payload.data.data === 'object') return payload.data.data
  if (payload?.data && typeof payload.data === 'object') return payload.data
  return null
}

export const lmsService = {
  listInstitutions: async () => toArray((await api.get('/api/setup/institution')).data),

  listDepartments: async (institutionId) =>
    toArray((await api.get('/api/setup/department', { params: { institutionId } })).data),

  listProgrammes: async (institutionId, departmentId) => {
    const rows = toArray((await api.get('/api/setup/programme')).data)
    return rows.filter(
      (x) => String(x.institutionId) === String(institutionId) && String(x.departmentId) === String(departmentId),
    )
  },

  listRegulations: async (institutionId, programmeId) =>
    toArray((await api.get('/api/setup/regulation', { params: { institutionId, programmeId } })).data),

  listRegulationMaps: async (scope) =>
    toArray((await api.get('/api/setup/regulation-map', { params: scope })).data),

  listAcademicYears: async (institutionId) =>
    toArray((await api.get('/api/setup/academic-year', { headers: { 'x-institution-id': institutionId } })).data).map((x) => ({
      ...x,
      academicYearLabel:
        x?.academicYearLabel ||
        `${x?.academicYear || ''}${x?.semesterCategory ? ` (${String(x.semesterCategory).toUpperCase()})` : ''}`,
    })),

  listBatches: async (institutionId) =>
    toArray((await api.get('/api/setup/batch', { params: { institutionId } })).data),

  listAcademicCalendarPatterns: async () =>
    toArray((await api.get('/api/setup/academic-calendar-pattern')).data),

  listClasses: async ({ institutionId, departmentId, programmeId }) =>
    toArray((await api.get('/api/setup/class', { params: { institutionId, departmentId, programmeId } })).data),

  listCourseOfferings: async (scope) =>
    toArray((await api.get('/api/setup/course-offering', { params: scope })).data),

  listCourseAllotmentDetails: async (scope) =>
    toArray((await api.get('/api/setup/course-offering/allotment/details', { params: scope })).data),

  saveCourseAllotment: async (scope, payload) =>
    api.post('/api/setup/course-offering/allotment', { ...scope, ...payload }),

  updateCourseAllotment: async (scope, courseId, payload) =>
    api.put(`/api/setup/course-offering/allotment/${courseId}`, { ...scope, ...payload }),

  deleteCourseAllotment: async (scope, courseId, facultyId) =>
    api.delete(`/api/setup/course-offering/allotment/${courseId}`, { data: { ...scope, courseId, facultyId } }),

  exportCourseAllotmentDetails: async (scope) =>
    api.get('/api/setup/course-offering/allotment/export', {
      params: scope,
      responseType: 'blob',
    }),

  listStudents: async (scope) => toArray((await api.get('/api/setup/student', { params: scope })).data),
  listStudentAllotments: async (scope) =>
    toArray((await api.get('/api/setup/student-allotment', { params: scope })).data),
  listStudentAllotmentsAllCourses: async (scope) =>
    toArray((await api.get('/api/setup/student-allotment/all-courses', { params: scope })).data),
  syncStudentAllotments: async (scope, payload) =>
    api.post('/api/setup/student-allotment/sync', { ...scope, ...payload }),
  syncStudentAllotmentsAllCourses: async (scope, payload) =>
    api.post('/api/setup/student-allotment/sync-all-courses', { ...scope, ...payload }),

  listFaculties: async ({ institutionId, departmentId, academicYearId }) =>
    toArray((await api.get('/api/setup/faculty', { params: { institutionId, departmentId, academicYearId } })).data),

  listTimetables: async (scope) => toArray((await api.get('/api/setup/timetable', { params: scope })).data),

  listClassTimetableClasses: async (scope) =>
    toArray((await api.get('/api/setup/class-timetable/classes', { params: scope })).data),

  getClassTimetableByClass: async (classId, scope) =>
    toObject(await api.get(`/api/setup/class-timetable/${classId}`, { params: scope })),

  listCalendarUploads: async () => toArray((await api.get('/api/setup/calendar')).data),

  getCalendarUploadById: async (id) => toObject(await api.get(`/api/setup/calendar/${id}`)),
}

export const semesterPatternFromSemester = (semester) => {
  const n = Number(semester)
  if (!Number.isFinite(n) || n < 1) return ''
  return n % 2 === 0 ? 'EVEN' : 'ODD'
}

export const semesterOptionsFromAcademicYear = (academicYear) => {
  const chosen = academicYear?.chosenSemesters
  const maxSem = Number(academicYear?.numberOfSemesters ?? academicYear?.semesters ?? 8)
  const safeMax = Number.isFinite(maxSem) && maxSem > 0 ? maxSem : 8
  const category = String(academicYear?.semesterCategory || '').toUpperCase().trim()

  const fromArray = Array.isArray(chosen) ? chosen : []
  const fromString = String(chosen ?? '')
    .match(/\d+/g)
    ?.map((x) => Number(x)) || []

  const list = (Array.isArray(chosen) ? fromArray : fromString).map((x) => Number(x))
  const unique = Array.from(new Set(list.filter((x) => Number.isFinite(x) && x > 0))).sort((a, b) => a - b)
  if (unique.length) return unique.map((x) => ({ value: String(x), label: `Sem - ${x}` }))

  const all = Array.from({ length: safeMax }, (_, i) => i + 1)
  const byCategory =
    category === 'ODD'
      ? all.filter((x) => x % 2 === 1)
      : category === 'EVEN'
        ? all.filter((x) => x % 2 === 0)
        : all

  return byCategory.map((x) => ({ value: String(x), label: `Sem - ${x}` }))
}
