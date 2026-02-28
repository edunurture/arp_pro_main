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

  listAssessmentCodes: async (institutionId) =>
    toArray((await api.get('/api/setup/assessment-setup/codes', { params: { institutionId } })).data),

  listAssessmentMappings: async (params = {}) =>
    toArray((await api.get('/api/setup/assessment-setup', { params })).data),

  listCIAComputations: async (institutionId) =>
    toArray((await api.get('/api/setup/cia-computations', { params: { institutionId } })).data),

  getCIAComponentsConfig: async (institutionId) =>
    toObject(await api.get('/api/setup/cia-components', { params: { institutionId } })),

  listAcademicCalendarPatterns: async () =>
    toArray((await api.get('/api/setup/academic-calendar-pattern')).data),

  listClasses: async ({ institutionId, departmentId, programmeId }) =>
    toArray((await api.get('/api/setup/class', { params: { institutionId, departmentId, programmeId } })).data),

  listCourseOfferings: async (scope) =>
    toArray((await api.get('/api/setup/course-offering', { params: scope })).data),

  listCourseAllotmentDetails: async (scope) =>
    toArray((await api.get('/api/setup/course-offering/allotment/details', { params: scope })).data),

  listCourseAllotmentHistory: async (scope, courseId) =>
    toArray((await api.get('/api/setup/course-offering/allotment/history', { params: { ...scope, courseId } })).data),

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
    toArray((await api.get('/api/setup/faculty', { params: { institutionId, departmentId, academicYearId } })).data).map((x) => ({
      ...x,
      firstName: x?.firstName || x?.facultyName || '',
      facultyName: x?.facultyName || x?.firstName || '',
      departmentName: x?.department?.departmentName || '',
    })),

  listTimetables: async (scope) => toArray((await api.get('/api/setup/timetable', { params: scope })).data),

  listClassTimetableClasses: async (scope) =>
    toArray((await api.get('/api/setup/class-timetable/classes', { params: scope })).data),

  getFacultyLectureScopes: async (params = {}) =>
    toArray((await api.get('/api/setup/class-timetable/faculty-scopes', { params })).data),

  getClassTimetableByClass: async (classId, scope) =>
    toObject(await api.get(`/api/setup/class-timetable/${classId}`, { params: scope })),

  getFacultyTimetableView: async (facultyId, scope) =>
    toArray((await api.get('/api/setup/class-timetable/faculty-view', { params: { ...scope, facultyId } })).data),

  getFacultyLectureSchedule: async (scope, filters = {}) =>
    toArray((await api.get('/api/setup/class-timetable/lecture-schedule/faculty', { params: { ...scope, ...filters } })).data),

  getSyllabusCompletionSummary: async (scope, filters = {}) =>
    (await api.get('/api/setup/class-timetable/syllabus-completion/summary', { params: { ...scope, ...filters } })).data,

  getSyllabusCompletionSessions: async (courseOfferingId, scope, filters = {}) =>
    (
      await api.get(`/api/setup/class-timetable/syllabus-completion/${courseOfferingId}/sessions`, {
        params: { ...scope, ...filters },
      })
    ).data,

  createSyllabusRecoverySession: async (courseOfferingId, scope, payload = {}) =>
    (
      await api.post(`/api/setup/class-timetable/syllabus-completion/${courseOfferingId}/recovery-session`, {
        ...scope,
        ...payload,
      })
    ).data,

  getLectureSession: async (entryId, scope, params = {}) =>
    toObject(await api.get(`/api/setup/class-timetable/lecture-schedule/${entryId}/session`, { params: { ...scope, ...params } })),

  upsertLectureSession: async (entryId, scope, payload = {}) =>
    api.patch(`/api/setup/class-timetable/lecture-schedule/${entryId}/session`, { ...scope, ...payload }),

  deleteLectureSession: async (entryId, scope, payload = {}) =>
    api.delete(`/api/setup/class-timetable/lecture-schedule/${entryId}/session`, { data: { ...scope, ...payload } }),

  getOnlineClassSession: async (entryId, scope, params = {}) =>
    toObject(await api.get(`/api/setup/class-timetable/online-classes/${entryId}/session`, { params: { ...scope, ...params } })),

  saveOnlineClassSession: async (entryId, scope, payload = {}) =>
    api.put(`/api/setup/class-timetable/online-classes/${entryId}/session`, { ...scope, ...payload }),

  deleteOnlineClassSession: async (entryId, scope, payload = {}) =>
    api.delete(`/api/setup/class-timetable/online-classes/${entryId}/session`, { data: { ...scope, ...payload } }),

  getStudentOnlineClasses: async (scope, params = {}) =>
    toArray((await api.get('/api/setup/class-timetable/online-classes/student', { params: { ...scope, ...params } })).data),

  triggerLectureAttendancePlaceholder: async (entryId, scope, payload = {}) =>
    api.post(`/api/setup/class-timetable/lecture-schedule/${entryId}/attendance-placeholder`, { ...scope, ...payload }),

  getLectureAttendanceRoster: async (entryId, scope, params = {}) =>
    toObject(
      await api.get(`/api/setup/class-timetable/attendance/${entryId}/roster`, {
        params: { ...scope, ...params },
      }),
    ),

  saveLectureAttendance: async (entryId, scope, payload = {}) =>
    api.put(`/api/setup/class-timetable/attendance/${entryId}/roster`, { ...scope, ...payload }),

  getAttendanceCourseWiseReport: async (scope, params = {}) =>
    toObject(
      await api.get('/api/setup/class-timetable/attendance/reports/course-wise', {
        params: { ...scope, ...params },
      }),
    ),

  getAttendanceClassWiseReport: async (scope, params = {}) =>
    toObject(
      await api.get('/api/setup/class-timetable/attendance/reports/class-wise', {
        params: { ...scope, ...params },
      }),
    ),

  getAttendanceCourseReport: async (scope, params = {}) =>
    toObject(
      await api.get('/api/setup/class-timetable/attendance/reports/course', {
        params: { ...scope, ...params },
      }),
    ),

  listClassAdjustments: async (scope, filters = {}) =>
    toArray((await api.get('/api/setup/class-timetable/adjustments', { params: { ...scope, ...filters } })).data),

  createClassAdjustment: async (scope, payload) =>
    api.post('/api/setup/class-timetable/adjustments', { ...scope, ...payload }),

  deleteClassAdjustment: async (id, scope) =>
    api.delete(`/api/setup/class-timetable/adjustments/${id}`, { data: { ...scope } }),

  listActivityCategories: async () =>
    toArray((await api.get('/api/setup/activities/categories')).data),

  listActivities: async (scope, filters = {}) =>
    toArray((await api.get('/api/setup/activities', { params: { ...scope, ...filters } })).data),

  listActivityLectureSlots: async (scope, filters = {}) =>
    toArray((await api.get('/api/setup/activities/lecture-slots', { params: { ...scope, ...filters } })).data),

  listActivitySpecialHourSlots: async (scope) =>
    toArray((await api.get('/api/setup/activities/special-hour-slots', { params: scope })).data),

  convertLectureToActivity: async (scope, payload = {}) =>
    api.post('/api/setup/activities/convert-lecture', { ...scope, ...payload }),

  createSpecialHourActivity: async (scope, payload = {}) =>
    api.post('/api/setup/activities/special-hour', { ...scope, ...payload }),

  updateActivity: async (id, scope, payload = {}) =>
    api.put(`/api/setup/activities/${id}`, { ...scope, ...payload }),

  deleteActivity: async (id, scope) =>
    api.delete(`/api/setup/activities/${id}`, { data: { ...scope } }),

  listActivityEvidences: async (id, scope) =>
    toArray((await api.get(`/api/setup/activities/${id}/evidences`, { params: { ...scope } })).data),

  createActivityEvidence: async (id, scope, payload = {}) => {
    const fd = new FormData()
    Object.entries({ ...scope, ...payload }).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      if (k === 'file') return
      fd.append(k, v)
    })
    if (payload?.file) fd.append('file', payload.file)
    return api.post(`/api/setup/activities/${id}/evidences`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteActivityEvidence: async (id, evidenceId, scope) =>
    api.delete(`/api/setup/activities/${id}/evidences/${evidenceId}`, { data: { ...scope } }),

  getActivityNaac231Report: async (scope, filters = {}) =>
    toObject(await api.get('/api/setup/activities/reports/naac-231', { params: { ...scope, ...filters } })),

  listLearnerCategories: async () =>
    toArray((await api.get('/api/setup/learner-activities/categories')).data),

  createLearnerCategory: async (payload = {}) =>
    api.post('/api/setup/learner-activities/categories', payload),

  updateLearnerCategory: async (id, payload = {}) =>
    api.put(`/api/setup/learner-activities/categories/${id}`, payload),

  deleteLearnerCategory: async (id) =>
    api.delete(`/api/setup/learner-activities/categories/${id}`),

  listStudentCategorizations: async (scope, filters = {}) =>
    toArray((await api.get('/api/setup/learner-activities/student-categorizations', { params: { ...scope, ...filters } })).data),

  saveStudentCategorizations: async (scope, payload = {}) =>
    api.post('/api/setup/learner-activities/student-categorizations', { ...scope, ...payload }),

  listLearnerProgrammes: async (scope, filters = {}) =>
    toArray((await api.get('/api/setup/learner-activities/programmes', { params: { ...scope, ...filters } })).data),

  createLearnerProgramme: async (scope, payload = {}) => {
    const fd = new FormData()
    Object.entries({ ...scope, ...payload }).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      if (k === 'file') return
      fd.append(k, v)
    })
    if (payload?.file) fd.append('file', payload.file)
    return api.post('/api/setup/learner-activities/programmes', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  updateLearnerProgramme: async (id, scope, payload = {}) => {
    const fd = new FormData()
    Object.entries({ ...scope, ...payload }).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      if (k === 'file') return
      fd.append(k, v)
    })
    if (payload?.file) fd.append('file', payload.file)
    return api.put(`/api/setup/learner-activities/programmes/${id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteLearnerProgramme: async (id, scope, payload = {}) =>
    api.delete(`/api/setup/learner-activities/programmes/${id}`, { data: { ...scope, ...payload } }),

  listCalendarUploads: async () => toArray((await api.get('/api/setup/calendar')).data),

  getCalendarUploadById: async (id) => toObject(await api.get(`/api/setup/calendar/${id}`)),

  downloadCourseContentsTemplate: async (courseOfferingId) =>
    api.get('/api/setup/course-contents/template', { params: { courseOfferingId }, responseType: 'blob' }),

  listCourseContents: async (scope = {}) =>
    toArray((await api.get('/api/setup/course-contents', { params: scope })).data),

  importCourseContents: async ({ courseOfferingId, facultyId, file }) => {
    const fd = new FormData()
    fd.append('courseOfferingId', courseOfferingId)
    fd.append('facultyId', facultyId)
    fd.append('file', file)
    return api.post('/api/setup/course-contents/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    })
  },

  getCourseContentById: async (id) => toObject(await api.get(`/api/setup/course-contents/${id}`)),

  updateCourseContent: async (id, payload) => api.put(`/api/setup/course-contents/${id}`, payload),

  deleteCourseContent: async (id) => api.delete(`/api/setup/course-contents/${id}`),

  saveCoursePlan: async (courseContentId, payload) =>
    api.post(`/api/setup/course-contents/${courseContentId}/plan`, payload),

  submitCoursePlan: async (courseContentId, facultyId) =>
    api.post(`/api/setup/course-contents/${courseContentId}/plan/submit`, { facultyId }),

  forwardCoursePlan: async (courseContentId, facultyId, target) =>
    api.post(`/api/setup/course-contents/${courseContentId}/plan/forward`, { facultyId, target }),

  exportCourseContent: async (id, format = 'xlsx', type = 'both') =>
    api.get(`/api/setup/course-contents/${id}/export`, {
      params: { format, type },
      responseType: 'blob',
    }),

  getCourseContentsDashboardStatus: async (params = {}) =>
    toArray((await api.get('/api/setup/course-contents/dashboard/status', { params })).data),

  downloadCourseMaterialsTemplate: async (params = {}) =>
    api.get('/api/setup/course-materials/template', { params, responseType: 'blob' }),

  listCourseMaterials: async (scope = {}) =>
    toArray((await api.get('/api/setup/course-materials', { params: scope })).data),

  getCourseMaterialByCourseContentId: async (courseContentId) =>
    toObject(await api.get(`/api/setup/course-materials/${courseContentId}`)),

  saveCourseMaterialItem: async (courseContentId, payload = {}) => {
    const fd = new FormData()
    Object.entries(payload || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      if (k === 'file') return
      fd.append(k, v)
    })
    if (payload?.file) fd.append('file', payload.file)
    return api.post(`/api/setup/course-materials/${courseContentId}/items`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteCourseMaterialItem: async (itemId, facultyId) =>
    api.delete(`/api/setup/course-materials/items/${itemId}`, { data: { facultyId } }),

  exportCourseMaterials: async (courseContentId) =>
    api.get(`/api/setup/course-materials/${courseContentId}/export`, { responseType: 'blob' }),

  listAssignments: async (scope = {}, filters = {}) =>
    toArray((await api.get('/api/setup/assignments', { params: { ...scope, ...filters } })).data),

  createAssignment: async (scope = {}, payload = {}) => {
    const fd = new FormData()
    Object.entries({ ...scope, ...payload }).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      if (k === 'file') return
      fd.append(k, v)
    })
    if (payload?.file) fd.append('file', payload.file)
    return api.post('/api/setup/assignments', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  updateAssignment: async (id, scope = {}, payload = {}) => {
    const fd = new FormData()
    Object.entries({ ...scope, ...payload }).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      if (k === 'file') return
      fd.append(k, v)
    })
    if (payload?.file) fd.append('file', payload.file)
    return api.put(`/api/setup/assignments/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  deleteAssignment: async (id, scope = {}) =>
    api.delete(`/api/setup/assignments/${id}`, { data: { ...scope } }),

  getAssignmentSubmissions: async (id) =>
    toObject(await api.get(`/api/setup/assignments/${id}/submissions`)),

  saveAssignmentScores: async (id, payload = {}) =>
    api.post(`/api/setup/assignments/${id}/scores`, payload),
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
