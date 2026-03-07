import api from './apiClient'

const unwrap = (res) => {
  if (res?.data?.data !== undefined) return res.data.data
  if (res?.data !== undefined) return res.data
  return null
}

export const IA_PHASE_KEYS = {
  PHASE_1_SETUP: 'PHASE_1_SETUP',
  PHASE_2_SCHEDULE: 'PHASE_2_SCHEDULE',
  PHASE_3_VALIDATION: 'PHASE_3_VALIDATION',
  PHASE_4_PUBLISH: 'PHASE_4_PUBLISH',
  PHASE_5_OPERATIONS: 'PHASE_5_OPERATIONS',
  PHASE_6_MARK_ENTRY: 'PHASE_6_MARK_ENTRY',
  PHASE_7_RESULT_ANALYSIS: 'PHASE_7_RESULT_ANALYSIS',
}

export const saveIAWorkflowPhase = async (phaseKey, payload) => {
  const res = await api.post(`/api/evaluation/ia-workflow/phase/${phaseKey}`, payload)
  return unwrap(res)
}

export const getIAWorkflowPhase = async (phaseKey, params) => {
  const res = await api.get(`/api/evaluation/ia-workflow/phase/${phaseKey}`, { params })
  return unwrap(res)
}

export const getIAWorkflowBundle = async (params) => {
  const res = await api.get('/api/evaluation/ia-workflow/bundle', { params })
  return unwrap(res)
}

export const getIASlotResources = async (params) => {
  const res = await api.get('/api/evaluation/ia-workflow/slot-resources', { params })
  return unwrap(res)
}

export const getIACourseResources = async (params) => {
  const res = await api.get('/api/evaluation/ia-workflow/course-resources', { params })
  return unwrap(res)
}

export const getIAOperationRoster = async (params) => {
  const res = await api.get('/api/evaluation/ia-workflow/operation-roster', { params })
  return unwrap(res)
}

export const listIAWorkflowRecords = async (params) => {
  const res = await api.get('/api/evaluation/ia-workflow/records', { params })
  return unwrap(res)
}

export const deleteIAWorkflowRecord = async (id) => {
  const res = await api.delete(`/api/evaluation/ia-workflow/record/${id}`)
  return unwrap(res)
}

export const deleteIAWorkflowBundle = async (params) => {
  const res = await api.delete('/api/evaluation/ia-workflow/bundle', { data: params })
  return unwrap(res)
}
