import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  CAlert,
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react-pro'

import { ArpButton, ArpToastStack } from '../../components/common'
import api from '../../services/apiClient'
import { IA_PHASE_KEYS, getIACourseResources, saveIAWorkflowPhase } from '../../services/iaWorkflowService'
import IAWorkflowScopeBanner from './IAWorkflowScopeBanner'

const PHASE_1_KEY = 'arp.evaluation.ia.phase1.setup.draft.v1'
const PHASE_3_KEY = 'arp.evaluation.ia.phase3.validation.draft.v1'
const PHASE_4_KEY = 'arp.evaluation.ia.phase4.publish.draft.v1'

const IAPublishPhase4 = () => {
  const phase1 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_1_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])
  const phase3 = useMemo(() => {
    try {
      return JSON.parse(window.sessionStorage.getItem(PHASE_3_KEY) || '{}')
    } catch {
      return {}
    }
  }, [])

  const phase3Ready = String(phase3.status || '') === 'READY_FOR_PHASE_4'

  const [toast, setToast] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const previewFrameRef = useRef(null)
  const [institutionMeta, setInstitutionMeta] = useState({})
  const [academicYearLabel, setAcademicYearLabel] = useState('')
  const [programmeMap, setProgrammeMap] = useState({})
  const [courseMetaById, setCourseMetaById] = useState({})
  const [courseMetaByCode, setCourseMetaByCode] = useState({})
  const [status, setStatus] = useState('DRAFT')
  const [publishForm, setPublishForm] = useState({
    versionNo: '1',
    publishDate: '',
    effectiveFrom: '',
    publishMode: 'PORTAL',
    notifyStudents: true,
    notifyFaculty: true,
    notifyDepartments: true,
    notifyAdmin: true,
    freezeAfterPublish: true,
    changeReason: '',
    signatoryName: '',
    signatoryDesignation: 'Authorized Signatory (Examination)',
    principalName: '',
    principalDesignation: 'Principal',
    officialSealText: 'Official Seal',
    reportPaperSize: 'A4',
  })

  const slots = Array.isArray(phase3.slots) ? phase3.slots : []
  const courses = Array.isArray(phase3.courses) ? phase3.courses : []
  const slotById = useMemo(
    () => Object.fromEntries(slots.map((slot) => [slot.id, slot])),
    [slots],
  )

  const pendingConflicts = useMemo(
    () => courses.filter((x) => String(x.conflict || '').trim()).length,
    [courses],
  )

  const workflowScope = phase3.workflowScope || {}
  const institutionId = workflowScope?.institutionId || phase1?.institutionId || ''
  const academicYearId = workflowScope?.academicYearId || phase1?.academicYearId || ''

  useEffect(() => {
    if (!institutionId) {
      setInstitutionMeta({})
      return
    }
    ;(async () => {
      try {
        const res = await api.get('/api/setup/institution')
        const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []
        const row = list.find((x) => String(x.id) === String(institutionId)) || {}
        setInstitutionMeta(row)
      } catch {
        setInstitutionMeta({})
      }
    })()
  }, [institutionId])

  useEffect(() => {
    if (!institutionId || !academicYearId) {
      setCourseMetaById({})
      setCourseMetaByCode({})
      return
    }
    ;(async () => {
      try {
        const scopeProgrammeId = workflowScope?.programmeId || phase1?.programmeScopeKey || phase1?.programmeId || ''
        const list = await getIACourseResources({
          institutionId,
          academicYearId,
          programmeId: scopeProgrammeId,
          scopeMode: phase1?.scopeMode || 'SINGLE',
          programmeIds: Array.isArray(phase1?.programmeIds) ? phase1.programmeIds.join(',') : '',
          chosenSemester: workflowScope?.chosenSemester || phase1?.chosenSemester || '',
        })
        const rows = Array.isArray(list) ? list : []
        const byId = {}
        const byCode = {}
        rows.forEach((r) => {
          const meta = {
            programmeId: String(r.programmeId || '').trim(),
            programmeCode: String(r.programmeCode || '').trim(),
            programmeName: String(r.programmeName || '').trim(),
            semester: r.semester || r.semesterNumber || '',
            courseCode: String(r.courseCode || '').trim(),
          }
          if (r.id) byId[String(r.id)] = meta
          if (meta.courseCode) byCode[meta.courseCode] = meta
        })
        setCourseMetaById(byId)
        setCourseMetaByCode(byCode)
      } catch {
        setCourseMetaById({})
        setCourseMetaByCode({})
      }
    })()
  }, [
    institutionId,
    academicYearId,
    workflowScope?.programmeId,
    workflowScope?.chosenSemester,
    phase1?.scopeMode,
    phase1?.programmeScopeKey,
    phase1?.programmeId,
    phase1?.programmeIds,
    phase1?.chosenSemester,
  ])

  useEffect(() => {
    if (!institutionId || !academicYearId) {
      setAcademicYearLabel('')
      return
    }
    ;(async () => {
      try {
        const res = await api.get('/api/setup/academic-year', {
          headers: { 'x-institution-id': institutionId },
        })
        const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []
        const row = list.find((x) => String(x.id) === String(academicYearId)) || {}
        const label = row?.academicYearLabel || row?.academicYear || ''
        setAcademicYearLabel(String(label || ''))
      } catch {
        setAcademicYearLabel('')
      }
    })()
  }, [institutionId, academicYearId])

  useEffect(() => {
    if (!institutionId) {
      setProgrammeMap({})
      return
    }
    ;(async () => {
      try {
        const res = await api.get('/api/setup/programme')
        const list = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : []
        const scoped = list.filter((x) => String(x.institutionId) === String(institutionId))
        const map = Object.fromEntries(
          scoped.map((x) => [
            String(x.id),
            {
              programmeCode: String(x.programmeCode || '').trim(),
              programmeName: String(x.programmeName || '').trim(),
            },
          ]),
        )
        setProgrammeMap(map)
      } catch {
        setProgrammeMap({})
      }
    })()
  }, [institutionId])

  const reportRows = useMemo(() => {
    const sessionOrder = { FN: 1, AN: 2 }
    return courses
      .map((course) => {
        const slot = slotById[course.slotId] || {}
        const metaById = courseMetaById[String(course.id || '')] || {}
        const metaByCode = courseMetaByCode[String(course.code || '').trim()] || {}
        const resolvedProgrammeId = String(
          course.programmeId ||
          metaById.programmeId ||
          metaByCode.programmeId ||
          '',
        ).trim()
        const fallbackProgramme = programmeMap[resolvedProgrammeId] || {}
        const programmeCode = String(
          course.programmeCode ||
          metaById.programmeCode ||
          metaByCode.programmeCode ||
          fallbackProgramme.programmeCode ||
          '',
        ).trim()
        const programmeName = String(
          course.programmeName ||
          metaById.programmeName ||
          metaByCode.programmeName ||
          fallbackProgramme.programmeName ||
          '',
        ).trim()
        return {
          id: course.id,
          code: course.code || '-',
          name: course.name || '-',
          programmeDisplay:
            programmeCode && programmeName
              ? `${programmeCode} - ${programmeName}`
              : programmeCode || programmeName || '-',
          semester:
            course.semester ||
            metaById.semester ||
            metaByCode.semester ||
            workflowScope?.chosenSemester ||
            phase1?.chosenSemester ||
            '-',
          students: Number(course.students || 0),
          date: slot.date || '',
          session: slot.session || '',
          time: slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : '-',
          venue: slot.venue || '-',
          sortSession: Number(sessionOrder[String(slot.session || '').toUpperCase()] || 99),
          sortStart: String(slot.startTime || ''),
        }
      })
      .sort((a, b) => {
        if (a.date !== b.date) return String(a.date).localeCompare(String(b.date))
        if (a.sortSession !== b.sortSession) return a.sortSession - b.sortSession
        return String(a.sortStart).localeCompare(String(b.sortStart))
      })
  }, [
    courses,
    slotById,
    workflowScope?.chosenSemester,
    phase1?.chosenSemester,
    programmeMap,
    courseMetaById,
    courseMetaByCode,
  ])

  const showToast = (type, message) => {
    setToast({
      type,
      message,
      autohide: type === 'success',
      delay: 4500,
    })
  }

  const setField = (key, value) => {
    setPublishForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSaveDraft = () => {
    const payload = {
      ...publishForm,
      status: 'DRAFT',
      snapshot: { slots, courses },
      updatedAt: new Date().toISOString(),
    }
    window.sessionStorage.setItem(PHASE_4_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        const wf = phase3.workflowScope || {}
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_4_PUBLISH, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          programmeId: wf.programmeId || '',
          examName: wf.examName || wf.iaCycle || '',
          iaCycle: wf.iaCycle || '',
          workflowStatus: 'DRAFT',
          versionNo: Number(publishForm.versionNo || 1),
          payload: {
            workflowScope: wf,
            ...payload,
          },
        })
      } catch {
        // Retain local draft when API save fails.
      }
    })()
    setStatus('DRAFT')
    showToast('success', 'Phase 4 draft saved.')
  }

  const onPublish = () => {
    if (!phase3Ready) {
      showToast('danger', 'Phase 3 is not ready for publishing.')
      return
    }
    if (pendingConflicts > 0) {
      showToast('danger', 'Resolve conflicts before publishing.')
      return
    }
    if (!String(publishForm.publishDate || '').trim() || !String(publishForm.effectiveFrom || '').trim()) {
      showToast('danger', 'Publish Date and Effective From are required.')
      return
    }

    const payload = {
      ...publishForm,
      status: 'PUBLISHED',
      publishedAt: new Date().toISOString(),
      snapshot: { slots, courses },
    }
    window.sessionStorage.setItem(PHASE_4_KEY, JSON.stringify(payload))
    ;(async () => {
      try {
        const wf = phase3.workflowScope || {}
        await saveIAWorkflowPhase(IA_PHASE_KEYS.PHASE_4_PUBLISH, {
          institutionId: wf.institutionId || '',
          academicYearId: wf.academicYearId || '',
          chosenSemester: wf.chosenSemester || '',
          programmeId: wf.programmeId || '',
          examName: wf.examName || wf.iaCycle || '',
          iaCycle: wf.iaCycle || '',
          workflowStatus: 'PUBLISHED',
          versionNo: Number(publishForm.versionNo || 1),
          payload: {
            workflowScope: wf,
            ...payload,
          },
        })
      } catch {
        // Retain local published state when API save fails.
      }
    })()
    setStatus('PUBLISHED')
    showToast('success', 'IA schedule published successfully.')
  }

  const onRepublish = () => {
    const nextVersion = String(Number(publishForm.versionNo || '1') + 1)
    setPublishForm((prev) => ({
      ...prev,
      versionNo: nextVersion,
      changeReason: '',
    }))
    setStatus('DRAFT')
    showToast('info', `Prepared version ${nextVersion} for republish.`)
  }

  const escapeHtml = (input) =>
    String(input ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const formatDateDDMMYYYY = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return '-'
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) return `${m[3]}-${m[2]}-${m[1]}`
    return raw
  }

  const buildReportHtml = ({ includeToolbar = true } = {}) => {
    const instituteName = institutionMeta?.name || workflowScope?.institutionName || phase1?.institutionName || workflowScope?.institutionId || phase1?.institutionId || 'Institution'
    const examName = workflowScope?.examName || workflowScope?.iaCycle || phase1?.examName || phase1?.iaCycle || '-'
    const ay = academicYearLabel || workflowScope?.academicYearLabel || workflowScope?.academicYearName || phase1?.academicYearLabel || workflowScope?.academicYearId || phase1?.academicYearId || '-'
    const publishDate = formatDateDDMMYYYY(publishForm.publishDate)
    const pageSize = String(publishForm.reportPaperSize || 'A4').toUpperCase()
    const rowsHtml = reportRows.length === 0
      ? '<tr><td colspan="10" style="text-align:center;padding:14px;color:#6b7280;">No schedule rows available.</td></tr>'
      : reportRows
        .map((row, idx) => `
          <tr>
            <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${idx + 1}</td>
            <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(row.code)}</td>
            <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(row.name)}</td>
            <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(row.programmeDisplay)}</td>
            <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${escapeHtml(row.semester)}</td>
            <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${escapeHtml(row.date || '-')}</td>
            <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${escapeHtml(row.session || '-')}</td>
            <td style="border:1px solid #d1d5db;padding:6px;text-align:center;">${escapeHtml(row.time)}</td>
            <td style="border:1px solid #d1d5db;padding:6px;">${escapeHtml(row.venue)}</td>
            <td style="border:1px solid #d1d5db;padding:6px;text-align:right;">${row.students}</td>
          </tr>
        `)
        .join('')

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>IA_Examination_Schedule</title>
  <style>
    @page { size: ${escapeHtml(pageSize)} portrait; margin: 10mm; }
    body { font-family: Arial, sans-serif; margin: 20px; color:#111827; counter-reset: page 1; }
    .meta { margin: 2px 0; font-size: 13px; }
    .title { text-align:center; font-size: 20px; font-weight: 700; margin-bottom: 6px; }
    .subtitle { text-align:center; font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .meta-center { text-align:center; margin: 2px 0; font-size: 13px; }
    .meta-right { text-align:right; margin: 2px 0; font-size: 13px; }
    .meta-left { margin: 2px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { border:1px solid #9ca3af; background:#f3f4f6; padding:6px; text-align:left; }
    .sig-wrap { margin-top: 38px; display:flex; justify-content:space-between; gap:24px; }
    .sig { width:32%; text-align:center; font-size: 12px; }
    .line { border-top:1px solid #374151; margin: 30px 0 6px; }
    .toolbar { margin-bottom: 14px; display:flex; gap:8px; }
    .btn { border:1px solid #4b5563; background:#fff; padding:6px 10px; cursor:pointer; border-radius:4px; }
    .page-number {
      position: fixed;
      bottom: 2mm;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 11px;
      color: #374151;
    }
    .page-number:after {
      content: "Page " counter(page);
    }
    @media print {
      .toolbar { display:none; }
      body { margin: 10mm; }
    }
  </style>
</head>
  <body>
  ${includeToolbar ? '<div class="toolbar"><button class="btn" onclick="window.print()">Print</button><button class="btn" onclick="window.close()">Close</button></div>' : ''}
  <div class="title">${escapeHtml(instituteName)}</div>
  <div class="subtitle">Internal Assessment Examination Schedule</div>
  <div class="meta-center"><strong>Examination:</strong> ${escapeHtml(examName)}</div>
  <div class="meta-center"><strong>Academic Year:</strong> ${escapeHtml(ay)}</div>
  <div class="meta-right"><strong>Publish Date:</strong> ${escapeHtml(publishDate)}</div>
  <table style="margin-top:10px;">
    <thead>
      <tr>
        <th style="width:50px;text-align:center;">S.No</th>
        <th style="width:120px;">Course Code</th>
        <th>Course Name</th>
        <th style="width:180px;">Programme</th>
        <th style="width:85px;text-align:center;">Semester</th>
        <th style="width:110px;">Date</th>
        <th style="width:80px;">Session</th>
        <th style="width:120px;">Time</th>
        <th style="width:110px;">Venue</th>
        <th style="width:80px;text-align:right;">Strength</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="sig-wrap">
    <div class="sig">
      <div class="line"></div>
      <div><strong>${escapeHtml(publishForm.signatoryName || ' ')}</strong></div>
      <div>${escapeHtml(publishForm.signatoryDesignation || 'Authorized Signatory (Examination)')}</div>
    </div>
    <div class="sig">
      <div class="line"></div>
      <div><strong>${escapeHtml(publishForm.principalName || ' ')}</strong></div>
      <div>${escapeHtml(publishForm.principalDesignation || 'Principal')}</div>
    </div>
    <div class="sig">
      <div class="line"></div>
      <div><strong>${escapeHtml(publishForm.officialSealText || 'Official Seal')}</strong></div>
      <div>Institution Seal</div>
    </div>
  </div>
  <div class="page-number"></div>
</body>
</html>`
  }

  const onPrintFromPreview = () => {
    const frame = previewFrameRef.current
    const frameWindow = frame?.contentWindow
    if (!frameWindow) {
      showToast('danger', 'Preview is not ready for printing.')
      return
    }
    frameWindow.focus()
    frameWindow.print()
  }

  const openReportPreview = (autoPrint = false) => {
    const html = buildReportHtml({ includeToolbar: false })
    setPreviewHtml(html)
    setPreviewOpen(true)
    if (autoPrint) {
      window.setTimeout(() => onPrintFromPreview(), 300)
    }
  }

  const downloadDoc = () => {
    const html = buildReportHtml({ includeToolbar: false })
    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `IA_Examination_Schedule_V${publishForm.versionNo || '1'}.doc`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    showToast('success', 'DOC report downloaded.')
  }

  const downloadXlsx = async () => {
    try {
      const mod = await import('xlsx')
      const XLSX = mod?.default || mod
      const rows = reportRows.map((row, idx) => ({
        'S.No': idx + 1,
        'Course Code': row.code,
        'Course Name': row.name,
        Programme: row.programmeDisplay,
        Semester: row.semester,
        Date: row.date || '-',
        Session: row.session || '-',
        Time: row.time,
        Venue: row.venue,
        Strength: row.students,
      }))
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: 'No schedule rows available' }])
      XLSX.utils.book_append_sheet(wb, ws, 'IA Schedule')
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `IA_Examination_Schedule_V${publishForm.versionNo || '1'}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      showToast('success', 'XLSX report downloaded.')
    } catch {
      showToast('danger', 'Unable to generate XLSX report.')
    }
  }

  const downloadPdf = () => {
    openReportPreview(true)
    showToast('info', 'Preview opened. Use Print dialog -> Save as PDF.')
  }

  return (
    <CRow>
      <CCol xs={12}>
        <ArpToastStack toast={toast} onClose={() => setToast(null)} />
        <IAWorkflowScopeBanner scope={workflowScope} />
        {!phase3Ready ? (
          <CAlert color="warning" className="mb-3">
            Phase 3 is not submitted yet. Complete conflict validation (`READY_FOR_PHASE_4`) before publish.
          </CAlert>
        ) : null}

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>INTERNAL ASSESSMENT - PHASE 4 PUBLISH</strong>
            <div className="d-flex gap-2">
              <CBadge color={phase3Ready ? 'success' : 'warning'}>
                Phase 3: {phase3Ready ? 'READY' : 'PENDING'}
              </CBadge>
              <CBadge color={status === 'PUBLISHED' ? 'success' : 'secondary'}>
                {status}
              </CBadge>
              <CBadge color={pendingConflicts > 0 ? 'danger' : 'success'}>
                Pending Conflicts: {pendingConflicts}
              </CBadge>
            </div>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={2}><CFormLabel>Version No.</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput
                  value={publishForm.versionNo}
                  onChange={(e) => setField('versionNo', e.target.value)}
                />
              </CCol>
              <CCol md={2}><CFormLabel>Publish Date *</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput
                  type="date"
                  value={publishForm.publishDate}
                  onChange={(e) => setField('publishDate', e.target.value)}
                />
              </CCol>
              <CCol md={2}><CFormLabel>Effective From *</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput
                  type="date"
                  value={publishForm.effectiveFrom}
                  onChange={(e) => setField('effectiveFrom', e.target.value)}
                />
              </CCol>
              <CCol md={2}><CFormLabel>Publish Mode</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={publishForm.publishMode}
                  onChange={(e) => setField('publishMode', e.target.value)}
                >
                  <option value="PORTAL">Portal</option>
                  <option value="PORTAL_EMAIL">Portal + Email</option>
                  <option value="PORTAL_EMAIL_SMS">Portal + Email + SMS</option>
                </CFormSelect>
              </CCol>
              <CCol md={2}><CFormLabel>Change Reason</CFormLabel></CCol>
              <CCol md={10}>
                <CFormInput
                  value={publishForm.changeReason}
                  onChange={(e) => setField('changeReason', e.target.value)}
                  placeholder="Mandatory when republishing with new version."
                />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader><strong>Publish Audience and Controls</strong></CCardHeader>
          <CCardBody>
            <CRow className="g-3">
              <CCol md={3}>
                <CFormCheck
                  label="Notify Students"
                  checked={publishForm.notifyStudents}
                  onChange={(e) => setField('notifyStudents', e.target.checked)}
                />
              </CCol>
              <CCol md={3}>
                <CFormCheck
                  label="Notify Faculty"
                  checked={publishForm.notifyFaculty}
                  onChange={(e) => setField('notifyFaculty', e.target.checked)}
                />
              </CCol>
              <CCol md={3}>
                <CFormCheck
                  label="Notify Departments"
                  checked={publishForm.notifyDepartments}
                  onChange={(e) => setField('notifyDepartments', e.target.checked)}
                />
              </CCol>
              <CCol md={3}>
                <CFormCheck
                  label="Notify Admin"
                  checked={publishForm.notifyAdmin}
                  onChange={(e) => setField('notifyAdmin', e.target.checked)}
                />
              </CCol>
              <CCol md={3}>
                <CFormCheck
                  label="Freeze After Publish"
                  checked={publishForm.freezeAfterPublish}
                  onChange={(e) => setField('freezeAfterPublish', e.target.checked)}
                />
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Final Timetable Snapshot</strong>
            <CBadge color="info">Courses: {courses.length}</CBadge>
          </CCardHeader>
          <CCardBody>
            <CTable responsive hover align="middle">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Course Code</CTableHeaderCell>
                    <CTableHeaderCell>Course Name</CTableHeaderCell>
                    <CTableHeaderCell>Programme</CTableHeaderCell>
                    <CTableHeaderCell>Semester</CTableHeaderCell>
                    <CTableHeaderCell>Students</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Session</CTableHeaderCell>
                  <CTableHeaderCell>Time</CTableHeaderCell>
                  <CTableHeaderCell>Venue</CTableHeaderCell>
                  <CTableHeaderCell>Status</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {courses.length === 0 ? (
                  <CTableRow>
                    <CTableDataCell colSpan={10} className="text-center text-muted py-4">
                      No validated schedule found.
                    </CTableDataCell>
                  </CTableRow>
                ) : (
                  courses.map((course) => {
                    const slot = slotById[course.slotId]
                    const metaById = courseMetaById[String(course.id || '')] || {}
                    const metaByCode = courseMetaByCode[String(course.code || '').trim()] || {}
                    const resolvedProgrammeId = String(
                      course.programmeId ||
                      metaById.programmeId ||
                      metaByCode.programmeId ||
                      '',
                    ).trim()
                    const fallbackProgramme = programmeMap[resolvedProgrammeId] || {}
                    const programmeCode = String(
                      course.programmeCode ||
                      metaById.programmeCode ||
                      metaByCode.programmeCode ||
                      fallbackProgramme.programmeCode ||
                      '',
                    ).trim()
                    const programmeName = String(
                      course.programmeName ||
                      metaById.programmeName ||
                      metaByCode.programmeName ||
                      fallbackProgramme.programmeName ||
                      '',
                    ).trim()
                    const resolvedSemester =
                      course.semester ||
                      metaById.semester ||
                      metaByCode.semester ||
                      workflowScope?.chosenSemester ||
                      phase1?.chosenSemester ||
                      '-'
                    return (
                      <CTableRow key={course.id}>
                        <CTableDataCell>{course.code}</CTableDataCell>
                        <CTableDataCell>{course.name}</CTableDataCell>
                        <CTableDataCell>
                          {programmeCode && programmeName
                            ? `${programmeCode} - ${programmeName}`
                            : programmeCode || programmeName || '-'}
                        </CTableDataCell>
                        <CTableDataCell>{resolvedSemester}</CTableDataCell>
                        <CTableDataCell>{course.students}</CTableDataCell>
                        <CTableDataCell>{slot?.date || '-'}</CTableDataCell>
                        <CTableDataCell>{slot?.session || '-'}</CTableDataCell>
                        <CTableDataCell>
                          {slot ? `${slot.startTime} - ${slot.endTime}` : '-'}
                        </CTableDataCell>
                        <CTableDataCell>{slot?.venue || '-'}</CTableDataCell>
                        <CTableDataCell>
                          {course.conflict ? (
                            <CBadge color="danger">{course.conflict}</CBadge>
                          ) : (
                            <CBadge color="success">Ready</CBadge>
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    )
                  })
                )}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>

        <CCard className="mb-3">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>Examination Schedule Report</strong>
            <CBadge color="dark">Statutory Noticeboard Format</CBadge>
          </CCardHeader>
          <CCardBody>
            <CRow className="g-3 mb-3">
              <CCol md={2}><CFormLabel>Signatory Name</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput
                  value={publishForm.signatoryName}
                  onChange={(e) => setField('signatoryName', e.target.value)}
                  placeholder="Authorized Signatory Name"
                />
              </CCol>
              <CCol md={2}><CFormLabel>Signatory Designation</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput
                  value={publishForm.signatoryDesignation}
                  onChange={(e) => setField('signatoryDesignation', e.target.value)}
                />
              </CCol>
              <CCol md={2}><CFormLabel>Principal Name</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput
                  value={publishForm.principalName}
                  onChange={(e) => setField('principalName', e.target.value)}
                  placeholder="Principal Name"
                />
              </CCol>
              <CCol md={2}><CFormLabel>Principal Designation</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput
                  value={publishForm.principalDesignation}
                  onChange={(e) => setField('principalDesignation', e.target.value)}
                />
              </CCol>
              <CCol md={2}><CFormLabel>Official Seal Text</CFormLabel></CCol>
              <CCol md={4}>
                <CFormInput
                  value={publishForm.officialSealText}
                  onChange={(e) => setField('officialSealText', e.target.value)}
                  placeholder="Official Seal"
                />
              </CCol>
              <CCol md={2}><CFormLabel>Paper Size</CFormLabel></CCol>
              <CCol md={4}>
                <CFormSelect
                  value={publishForm.reportPaperSize}
                  onChange={(e) => setField('reportPaperSize', e.target.value)}
                >
                  <option value="A4">A4</option>
                  <option value="LEGAL">Legal</option>
                  <option value="LETTER">Letter</option>
                  <option value="A3">A3</option>
                </CFormSelect>
              </CCol>
            </CRow>
            <div className="d-flex gap-2 flex-wrap">
              <ArpButton label="Preview / Print" icon="view" color="info" onClick={() => openReportPreview(false)} />
              <ArpButton label="Download PDF" icon="print" color="secondary" onClick={downloadPdf} />
              <ArpButton label="Download DOC" icon="download" color="primary" onClick={downloadDoc} />
              <ArpButton label="Download XLSX" icon="download" color="success" onClick={downloadXlsx} />
            </div>
            <small className="text-muted d-block mt-2">
              PDF download uses browser print option. Select "Save as PDF" in the print dialog.
            </small>
          </CCardBody>
        </CCard>

        <CCard>
          <CCardHeader><strong>Phase 4 Actions</strong></CCardHeader>
          <CCardBody className="d-flex justify-content-end gap-2">
            <ArpButton label="Save Draft" icon="save" color="secondary" onClick={onSaveDraft} />
            <ArpButton label="Republish (Next Version)" icon="edit" color="warning" onClick={onRepublish} />
            <ArpButton label="Publish Schedule" icon="publish" color="success" onClick={onPublish} />
          </CCardBody>
        </CCard>

        <CModal size="xl" visible={previewOpen} onClose={() => setPreviewOpen(false)}>
          <CModalHeader>
            <CModalTitle>Examination Schedule Preview</CModalTitle>
          </CModalHeader>
          <CModalBody style={{ minHeight: 520 }}>
            <iframe
              ref={previewFrameRef}
              title="IA Examination Schedule Preview"
              srcDoc={previewHtml}
              style={{ width: '100%', height: '68vh', border: '1px solid #d1d5db' }}
            />
          </CModalBody>
          <CModalFooter className="d-flex justify-content-end gap-2">
            <ArpButton label="Print" icon="print" color="secondary" onClick={onPrintFromPreview} />
            <ArpButton label="Close" icon="cancel" color="dark" onClick={() => setPreviewOpen(false)} />
          </CModalFooter>
        </CModal>
      </CCol>
    </CRow>
  )
}

export default IAPublishPhase4
