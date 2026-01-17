// src/components/common/CardShell.jsx
import React from 'react'
import { CCard, CCardHeader, CCardBody } from '@coreui/react-pro'

/**
 * Generic wrapper:
 * <CardShell title="Institution Configuration" actions={<YourButtons/>}>
 *   ...content...
 * </CardShell>
 */
export default function CardShell({ title, subtitle, actions, children, bodyClassName = '' }) {
  return (
    <CCard className="mb-3">
      <CCardHeader className="d-flex align-items-start justify-content-between">
        <div>
          <div className="fw-semibold">{title}</div>
          {subtitle ? <div className="text-medium-emphasis small mt-1">{subtitle}</div> : null}
        </div>
        {actions ? <div className="d-flex gap-2 flex-wrap">{actions}</div> : null}
      </CCardHeader>

      <CCardBody className={bodyClassName}>{children}</CCardBody>
    </CCard>
  )
}
