// src/services/courseService.js (cache-bust WITHOUT custom headers to avoid CORS preflight issues)
import api from './apiClient'

// Supports: {success:true,data:[...]}, {data:[...]}, or raw [...]
const unwrap = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

export const courseService = {
  // ✅ Cache-bust using query param only (safe with CORS)
  list: async (params = {}) => {
    const res = await api.get('/api/setup/course', {
      params: { ...params, ts: Date.now() },
    })
    return unwrap(res.data)
  },

  create: async (payload) => {
    const res = await api.post('/api/setup/course', payload)
    return res.data
  },

  update: async (id, payload) => {
    const res = await api.put(`/api/setup/course/${id}`, payload)
    return res.data
  },

  remove: async (id) => {
    const res = await api.delete(`/api/setup/course/${id}`)
    return res.data
  },

  downloadTemplate: async () => {
    const res = await api.get(`/api/setup/course/template?ts=${Date.now()}`, { responseType: 'blob' })
    return { data: res.data, contentType: res.headers?.['content-type'] }
  },

  exportExcel: async (params = {}) => {
    const res = await api.get(`/api/setup/course/export?ts=${Date.now()}`, { params, responseType: 'blob' })
    return { data: res.data, contentType: res.headers?.['content-type'] }
  },

  importExcel: async (file, scope) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('institutionId', scope?.institutionId || '')
    fd.append('departmentId', scope?.departmentId || '')
    fd.append('programmeId', scope?.programmeId || '')
    fd.append('regulationId', scope?.regulationId || '')

    const res = await api.post('/api/setup/course/import', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
