export const IA_PHASE_KEYS = {
  phase1: 'arp.evaluation.ia.phase1.setup.draft.v2',
  phase2: 'arp.evaluation.ia.phase2.schedule.draft.v2',
  phase3: 'arp.evaluation.ia.phase3.validation.draft.v2',
  phase4: 'arp.evaluation.ia.phase4.publish.draft.v2',
  phase5: 'arp.evaluation.ia.phase5.operations.draft.v2',
  phase6: 'arp.evaluation.ia.phase6.mark-entry.draft.v2',
  phase7: 'arp.evaluation.ia.phase7.result-analysis.draft.v2',
  phase8: 'arp.evaluation.ia.phase8.internal-mark-statement.draft.v2',
}

const readJson = (key) => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.sessionStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}

export const loadIAPhaseState = () => ({
  phase1: readJson(IA_PHASE_KEYS.phase1),
  phase2: readJson(IA_PHASE_KEYS.phase2),
  phase3: readJson(IA_PHASE_KEYS.phase3),
  phase4: readJson(IA_PHASE_KEYS.phase4),
  phase5: readJson(IA_PHASE_KEYS.phase5),
  phase6: readJson(IA_PHASE_KEYS.phase6),
  phase7: readJson(IA_PHASE_KEYS.phase7),
  phase8: readJson(IA_PHASE_KEYS.phase8),
})

export const normalizeRole = (value) => {
  const v = String(value || '').trim().toLowerCase()
  if (!v) return ''
  if (v.includes('admin') || v.includes('controller')) return 'ADMIN'
  if (v.includes('dept') || v.includes('coordinator') || v.includes('hod')) return 'DEPT_COORDINATOR'
  if (v.includes('faculty') || v.includes('staff')) return 'FACULTY'
  if (v.includes('student') || v.includes('learner')) return 'STUDENT'
  return ''
}

const getRoleFromStorage = () => {
  if (typeof window === 'undefined') return ''
  const keys = ['arp.user', 'user', 'authUser', 'currentUser']
  for (const key of keys) {
    const raw = window.sessionStorage.getItem(key) || window.localStorage.getItem(key)
    if (!raw) continue
    try {
      const obj = JSON.parse(raw)
      const role = normalizeRole(obj?.role || obj?.userRole || obj?.roleCode || obj?.designation)
      if (role) return role
    } catch {
      const role = normalizeRole(raw)
      if (role) return role
    }
  }
  return ''
}

export const resolveCurrentIARole = () => {
  if (typeof window === 'undefined') return ''
  const path = String(window.location.pathname || '')
  const hash = String(window.location.hash || '')
  const hashQuery = hash.includes('?') ? hash.split('?')[1] : ''
  const p1 = new URLSearchParams(window.location.search || '')
  const p2 = new URLSearchParams(hashQuery || '')
  const fromQuery = normalizeRole(p1.get('role') || p2.get('role'))
  if (fromQuery) return fromQuery
  const fromStorage = getRoleFromStorage()
  if (fromStorage) return fromStorage

  const adminLikePath =
    path.includes('/evaluation/ia/records') ||
    path.includes('/evaluation/ia/role/admin') ||
    hash.includes('/evaluation/ia/records') ||
    hash.includes('/evaluation/ia/role/admin')

  if (adminLikePath) return 'ADMIN'
  return ''
}

export const getWorkflowStage = (state) => {
  const p1 = String(state?.phase1?.status || '').toUpperCase()
  const p2 = String(state?.phase2?.status || '').toUpperCase()
  const p3 = String(state?.phase3?.status || '').toUpperCase()
  const p4 = String(state?.phase4?.status || '').toUpperCase()
  const p5 = String(state?.phase5?.status || '').toUpperCase()
  const p6 = String(state?.phase6?.status || '').toUpperCase()
  const p7 = String(state?.phase7?.status || '').toUpperCase()
  const p8 = String(state?.phase8?.status || '').toUpperCase()

  if (p8 === 'INTERNAL_MARK_STATEMENT_COMPLETED') return 8
  if (p7 === 'IA_RESULT_ANALYSIS_COMPLETED') return 7
  if (p6 === 'READY_FOR_PHASE_7') return 6
  if (p5 === 'READY_FOR_EVALUATION_FLOW') return 5
  if (p4 === 'PUBLISHED') return 4
  if (p3 === 'READY_FOR_PHASE_4') return 3
  if (p2 === 'READY_FOR_PHASE_3') return 2
  if (p1 === 'READY_FOR_PHASE_2') return 1
  return 0
}

export const hasRequiredStage = (state, minStage) => getWorkflowStage(state) >= Number(minStage || 0)

export const getRoleDescription = (role) => {
  if (role === 'ADMIN') return 'Full IA workflow governance, publish control, and override operations.'
  if (role === 'DEPT_COORDINATOR') return 'Department-level schedule follow-up, conflict review, and day operations tracking.'
  if (role === 'FACULTY') return 'Assigned course schedule visibility and course-level exam-day actions.'
  if (role === 'STUDENT') return 'Published IA timetable and exam-day status visibility.'
  return 'Role not resolved.'
}
