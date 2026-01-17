// src/components/common/FormRow.jsx
import React from 'react'
import { CCol, CRow, CFormLabel } from '@coreui/react-pro'

/**
 * Usage:
 * <FormRow
 *   leftLabel="Institution Name"
 *   leftControl={<CFormInput ... />}
 *   rightLabel="Year"
 *   rightControl={<CFormSelect ... />}
 * />
 */
export default function FormRow({
  leftLabel,
  leftControl,
  rightLabel,
  rightControl,
  leftLabelMd = 3,
  leftControlMd = 3,
  rightLabelMd = 3,
  rightControlMd = 3,
  className = 'mb-2',
}) {
  return (
    <CRow className={`g-3 ${className}`}>
      <CCol md={leftLabelMd}>
        {leftLabel ? <CFormLabel className="mb-0">{leftLabel}</CFormLabel> : null}
      </CCol>
      <CCol md={leftControlMd}>{leftControl}</CCol>

      <CCol md={rightLabelMd}>
        {rightLabel ? <CFormLabel className="mb-0">{rightLabel}</CFormLabel> : null}
      </CCol>
      <CCol md={rightControlMd}>{rightControl}</CCol>
    </CRow>
  )
}
