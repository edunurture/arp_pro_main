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

export const academicsService = {
  listMentors: async (filters = {}) =>
    toArray((await api.get('/api/setup/mentor-mentee/mentors', { params: filters })).data),

  createMentor: async (payload = {}) =>
    api.post('/api/setup/mentor-mentee/mentors', payload),

  updateMentor: async (id, payload = {}) =>
    api.put(`/api/setup/mentor-mentee/mentors/${id}`, payload),

  listMentees: async (filters = {}) =>
    toArray((await api.get('/api/setup/mentor-mentee/mentees', { params: filters })).data),

  createMentee: async (payload = {}) =>
    api.post('/api/setup/mentor-mentee/mentees', payload),

  updateMentee: async (id, payload = {}) =>
    api.put(`/api/setup/mentor-mentee/mentees/${id}`, payload),

  listStudentsForMentee: async (scope = {}, classId) =>
    toArray((await api.get('/api/setup/mentor-mentee/students-for-mentee', { params: { ...scope, classId } })).data),

  createMenteesFromStudents: async (payload = {}) =>
    api.post('/api/setup/mentor-mentee/mentees/bulk-from-students', payload),

  assignMentor: async (payload = {}) =>
    api.post('/api/setup/mentor-mentee/allocations', payload),

  listSessions: async (filters = {}) =>
    toArray((await api.get('/api/setup/mentor-mentee/sessions', { params: filters })).data),

  createSession: async (payload = {}) =>
    api.post('/api/setup/mentor-mentee/sessions', payload),

  escalateSession: async (id, escalation) =>
    api.post(`/api/setup/mentor-mentee/sessions/${id}/escalate`, { escalation }),

  getSummaryReport: async () =>
    toObject(await api.get('/api/setup/mentor-mentee/reports/summary')),

  listEventCategories: async () =>
    toArray((await api.get('/api/setup/academic-events/categories')).data),

  listAcademicEvents: async (filters = {}) =>
    toArray((await api.get('/api/setup/academic-events', { params: filters })).data),

  getAcademicEventById: async (id) =>
    toObject(await api.get(`/api/setup/academic-events/${id}`)),

  createAcademicEvent: async (payload = {}) =>
    api.post('/api/setup/academic-events', payload),

  updateAcademicEvent: async (id, payload = {}) =>
    api.put(`/api/setup/academic-events/${id}`, payload),

  deleteAcademicEvent: async (id) =>
    api.delete(`/api/setup/academic-events/${id}`),

  listAcademicEventDocuments: async (id) =>
    toArray((await api.get(`/api/setup/academic-events/${id}/documents`)).data),

  createAcademicEventDocument: async (id, payload = {}) => {
    const fd = new FormData()
    Object.entries(payload || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      if (k === 'file') return
      fd.append(k, v)
    })
    if (payload?.file) fd.append('file', payload.file)
    return api.post(`/api/setup/academic-events/${id}/documents`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteAcademicEventDocument: async (id, docId) =>
    api.delete(`/api/setup/academic-events/${id}/documents/${docId}`),
}
