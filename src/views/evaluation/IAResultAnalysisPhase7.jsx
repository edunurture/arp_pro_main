import React, { useEffect, useMemo, useState } from 'react'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormLabel,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'

import { ArpButton, ArpToastStack } from '../../components/common'
import { getIAWorkflowPhase, IA_PHASE_KEYS, saveIAWorkflowPhase } from '../../services/iaWorkflowService'
import IAWorkflowScopeBanner from './IAWorkflowScopeBanner'

const PHASE_4_KEY = 'arp.evaluation.ia.phase4.publish.draft.v1'
const PHASE_6_KEY = 'arp.evaluation.ia.phase6.mark-entry.draft.v1'
const PHASE_7_KEY = 'arp.evaluation.ia.phase7.result-analysis.draft.v1'

const computeAnalysisRows = (courseRows = []) =>
  courseRows.map((course) => {
    const students = Array.isArray(course.students) ? course.students : []
    const presentStudents = students.filter((s) => s.attendanceStatus === 'PRESENT' && String(s.mark || '').trim() !== '')
    const passCount = students.filter((s) => s.result === 'PASS').length
    const failCount = students.filter((s) => s.result === 'FAIL').length
    const reappearCount = students.filter((s) => s.result === 'REAPPEAR').length
    const absentCount = students.filter((s) => s.result === 'ABSENT').length
    const malpracticeCount = students.filter((s) => s.result === 'MALPRACTICE').length
    const marks = presentStudents.map((s) => Number(s.mark || 0)).filter((n) => Number.isFinite(n))
    const total = students.length
    const average = marks.length > 0 ? (marks.reduce((a, b) => a + b, 0) / marks.length) : 0
    return {
      courseId: course.courseId,
      courseCode: course.courseCode || '-',
      courseName: course.courseName || '-',
      total,
      passCount,
      failCount,
      reappearCount,
      absentCount,
      malpracticeCount,
      highest: marks.length > 0 ? Math.max(...marks) : 0,
      lowest: marks.length > 0 ? Math.min(...marks) : 0,
      average: Number(average.toFixed(2)),
      passPercentage: total > 0 ? Number(((passCount / total) * 100).toFixed(2)) : 0,
    }
  })

const IAResultAnalysisPhase7 = () => {
  const phase4 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_4_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])

  const phase6 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_6_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])

  const [toast, setToast] = useState(null)
  const [status, setStatus] = useState('DRAFT')
  const [courseFilter, setCourseFilter] = useState('')
  const [analysisRows, setAnalysisRows] = useState(() => computeAnalysisRows(phase6.courseRows || []))
  const workflowScope = phase4.workflowScope || phase4 || {}

  const showToast = (type, message) => {
    setToast({ type, message, autohide: type === 'success', delay: 4500 })
  }

  useEffect(() => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(PHASE_7_KEY) || '{}')
      if (saved && typeof saved === 'object') {
        if (String(saved.status || '').trim()) setStatus(String(saved.status))
        if (Array.isArray(saved.analysisRows) && saved.analysisRows.length > 0) setAnalysisRows(saved.analysisRows)
      }
    } catch {
      // ignore invalid local draft
    }
  }, [])

  useEffect(() => {
    const wf = phase4.workflowScope || {}
    if (!wf.institutionId || !wf.academicYearId || !wf.chosenSemester || !wf.programmeId || !(wf.iaCycle || wf.examName)) {
      return
    }
    ;(async () => {
      try {
        const remote = await getIAWorkflowPhase(IA_PHASE_KEYS.PHASE_7_RESULT_ANALYSIS, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          programmeId: wf.programmeId || '',
          iaCycle: wf.iaCycle || wf.examName || '',
          examName: wf.examName || wf.iaCycle || '',
        })
        const payload = remote?.payload && typeof remote.payload === 'object' ? remote.payload : null
        if (!payload) return
        if (String(remote?.workflowStatus || payload.status || '').trim()) {
          setStatus(String(remote.workflowStatus || payload.status))
        }
        if (Array.isArray(payload.analysisRows) && payload.analysisRows.length > 0) {
          setAnalysisRows(payload.analysisRows)
        }
      } catch {
        // keep local/session state
      }
    })()
  }, [phase4])

  const visibleRows = useMemo(() => {
    if (!courseFilter) return analysisRows
    return analysisRows.filter((row) => String(row.courseId) === String(courseFilter))
  }, [analysisRows, courseFilter])

  const overallSummary = useMemo(() => {
    const totalStudents = analysisRows.reduce((sum, row) => sum + Number(row.total || 0), 0)
    const totalPass = analysisRows.reduce((sum, row) => sum + Number(row.passCount || 0), 0)
    const totalFail = analysisRows.reduce((sum, row) => sum + Number(row.failCount || 0), 0)
    const totalReappear = analysisRows.reduce((sum, row) => sum + Number(row.reappearCount || 0), 0)
    const totalAbsent = analysisRows.reduce((sum, row) => sum + Number(row.absentCount || 0), 0)
    const totalMalpractice = analysisRows.reduce((sum, row) => sum + Number(row.malpracticeCount || 0), 0)
    const overallPassPct = totalStudents > 0 ? Number(((totalPass / totalStudents) * 100).toFixed(2)) : 0
    return { totalStudents, totalPass, totalFail, totalReappear, totalAbsent, totalMalpractice, overallPassPct }
  }, [analysisRows])

  const persist = async (nextStatus) => {
    const payload = {
      status: nextStatus,
      analysisRows,
      summary: overallSummary,
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_7_KEY, JSON.stringify(payload))
    try {
      const wf = phase4.workflowScope || {}
      await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_7_RESULT_ANALYSIS, {
        institutionId: wf.institutionId || '',
        academicYearId: wf.academicYearId || '',
        chosenSemester: wf.chosenSemester || '',
        programmeId: wf.programmeId || '',
        examName: wf.examName || wf.iaCycle || '',
        iaCycle: wf.iaCycle || '',
        workflowStatus: nextStatus,
        versionNo: 1,
        payload: {
          workflowScope: wf,
          ...payload,
        },
      })
    } catch {
      // keep local state
    }
    setStatus(nextStatus)
  }

  const onSaveDraft = async () => {
    await persist(status === 'IA_RESULT_ANALYSIS_COMPLETED' ? 'IA_RESULT_ANALYSIS_COMPLETED' : 'DRAFT')
    showToast('success', 'Phase 7 result analysis draft saved.')
  }

  const onClosePhase7 = async () => {
    if (analysisRows.length === 0) {
      showToast('danger', 'No IA mark entry records available for result analysis.')
      return
    }
    await persist('IA_RESULT_ANALYSIS_COMPLETED')
    showToast('success', 'Phase 7 result analysis completed.')
  }

  const downloadXlsx = async () => {
    try {
      const mod = await import('xlsx')
      const XLSX = mod?.default || mod
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analysisRows), 'Course Analysis')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([overallSummary]), 'Summary')
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'IA_Result_Analysis.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      showToast('success', 'IA result analysis workbook downloaded.')
    } catch {
      showToast('danger', 'Unable to generate IA result analysis workbook.')
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <ArpToastStack toast={toast} onClose={() => setToast(null)} />
        <IAWorkflowScopeBanner scope={workflowScope} />

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT - PHASE 7 RESULT ANALYSIS</strong>
            <CBadge color={status === 'IA_RESULT_ANALYSIS_COMPLETED' ? 'success' : 'info'}>{status}</CBadge>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2}><CFormLabel>Filter by Course</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                  <option value="">All Courses</option>
                  {analysisRows.map((row) => (
                    <option key={row.courseId} value={row.courseId}>
                      {row.courseCode} - {row.courseName}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6} className="d-flex align-items-end justify-content-end gap-2">
                <CBadge color="dark">Students: {overallSummary.totalStudents}</CBadge>
                <CBadge color="success">Pass %: {overallSummary.overallPassPct}</CBadge>
                <ArpButton label="Download XLSX" icon="download" color="success" onClick={downloadXlsx} />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Course-wise Result Analysis</strong></CCardHeader>
          <CCardBody>
            <CTable responsive hover align="middle">
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Course Code</CTableHeaderCell>
                  <CTableHeaderCell>Course Name</CTableHeaderCell>
                  <CTableHeaderCell>Total</CTableHeaderCell>
                  <CTableHeaderCell>Pass</CTableHeaderCell>
                  <CTableHeaderCell>Fail</CTableHeaderCell>
                  <CTableHeaderCell>Reappear</CTableHeaderCell>
                  <CTableHeaderCell>Absent</CTableHeaderCell>
                  <CTableHeaderCell>Malpractice</CTableHeaderCell>
                  <CTableHeaderCell>Highest</CTableHeaderCell>
                  <CTableHeaderCell>Lowest</CTableHeaderCell>
                  <CTableHeaderCell>Average</CTableHeaderCell>
                  <CTableHeaderCell>Pass %</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {visibleRows.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={12} className="text-center text-muted py-4">
                      No IA result analysis rows available.
                    </CTableDataCell>
                  </CTableRow>
                ) : visibleRows.map((row) => (
                  <CTableRow key={row.courseId}>
                    <CTableDataCell>{row.courseCode}</CTableDataCell>
                    <CTableDataCell>{row.courseName}</CTableDataCell>
                    <CTableDataCell>{row.total}</CTableDataCell>
                    <CTableDataCell>{row.passCount}</CTableDataCell>
                    <CTableDataCell>{row.failCount}</CTableDataCell>
                    <CTableDataCell>{row.reappearCount}</CTableDataCell>
                    <CTableDataCell>{row.absentCount}</CTableDataCell>
                    <CTableDataCell>{row.malpracticeCount}</CTableDataCell>
                    <CTableDataCell>{row.highest}</CTableDataCell>
                    <CTableDataCell>{row.lowest}</CTableDataCell>
                    <CTableDataCell>{row.average}</CTableDataCell>
                    <CTableDataCell>{row.passPercentage}</CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader><strong>Phase 7 Actions</strong></CCardHeader>
          <CCardBody className="d-flex justify-content-end gap-2">
            <ArpButton label="Save Draft" icon="save" color="secondary" onClick={onSaveDraft} />
            <ArpButton label="Close Phase 7" icon="submit" color="success" onClick={onClosePhase7} />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default IAResultAnalysisPhase7
