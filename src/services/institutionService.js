import api from './apiClient'

export const institutionApi = {
  list: async () => (await api.get('/api/setup/institution')).data,
  get: async (id) => (await api.get(`/api/setup/institution/${id}`)).data,
  create: async (payload) => (await api.post('/api/setup/institution', payload)).data,
  update: async (id, payload) => (await api.put(`/api/setup/institution/${id}`, payload)).data,
  remove: async (id) => (await api.delete(`/api/setup/institution/${id}`)).data,
}
