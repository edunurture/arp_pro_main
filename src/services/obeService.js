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

export const obeService = {
  getConfigurationStatus: async (params = {}) =>
    toArray((await api.get('/api/setup/obe-configuration/status', { params })).data),

  getConfigurationDetail: async (regulationMapId) =>
    toObject(await api.get(`/api/setup/obe-configuration/${regulationMapId}`)),

  saveVisionMission: async (regulationMapId, rows) =>
    toObject(await api.put(`/api/setup/obe-configuration/${regulationMapId}/vision-mission`, { rows })),

  savePeos: async (regulationMapId, rows) =>
    toObject(await api.put(`/api/setup/obe-configuration/${regulationMapId}/peos`, { rows })),

  savePos: async (regulationMapId, rows) =>
    toObject(await api.put(`/api/setup/obe-configuration/${regulationMapId}/pos`, { rows })),

  savePsos: async (regulationMapId, rows) =>
    toObject(await api.put(`/api/setup/obe-configuration/${regulationMapId}/psos`, { rows })),

  saveTaxonomy: async (regulationMapId, rows) =>
    toObject(await api.put(`/api/setup/obe-configuration/${regulationMapId}/taxonomy`, { rows })),

  saveCorrelation: async (regulationMapId, rows) =>
    toObject(await api.put(`/api/setup/obe-configuration/${regulationMapId}/correlation`, { rows })),

  saveAssessmentPolicy: async (regulationMapId, payload) =>
    toObject(await api.put(`/api/setup/obe-configuration/${regulationMapId}/assessment-policy`, payload)),

  savePeoPoMappings: async (regulationMapId, rows) =>
    toObject(await api.put(`/api/setup/obe-configuration/${regulationMapId}/peo-po-mapping`, { rows })),

  getCourseOutcomeStatus: async (params = {}) =>
    toArray((await api.get('/api/setup/obe-course-outcome/status', { params })).data),

  getCourseOutcomeDetail: async (courseOfferingId) =>
    toObject(await api.get(`/api/setup/obe-course-outcome/${courseOfferingId}`)),

  saveCourseOutcomes: async (courseOfferingId, rows) =>
    toObject(await api.put(`/api/setup/obe-course-outcome/${courseOfferingId}/outcomes`, { rows })),

  saveCourseOutcomePoMapping: async (courseOfferingId, rows) =>
    toObject(await api.put(`/api/setup/obe-course-outcome/${courseOfferingId}/co-po-mapping`, { rows })),

  saveCourseOutcomePsoMapping: async (courseOfferingId, rows) =>
    toObject(await api.put(`/api/setup/obe-course-outcome/${courseOfferingId}/co-pso-mapping`, { rows })),

  saveCourseOutcomeWeightage: async (courseOfferingId, payload) =>
    toObject(await api.put(`/api/setup/obe-course-outcome/${courseOfferingId}/weightage`, payload)),
}
