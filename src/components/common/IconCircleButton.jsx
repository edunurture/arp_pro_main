// src/components/common/IconCircleButton.jsx
import React from 'react'
import { CButton, CTooltip } from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'

/**
 * Circle icon button.
 * Props:
 * - color: 'primary' | 'success' | 'danger' | ...
 * - icon: coreui icon (e.g., cilPencil)
 * - title: tooltip text
 */
export default function IconCircleButton({
  color = 'primary',
  icon,
  title,
  onClick,
  disabled = false,
  size = 'sm',
  className = '',
  variant = 'solid', // 'solid' | 'outline'
}) {
  const btnVariantProps = variant === 'outline' ? { variant: 'outline' } : {}

  const btn = (
    <CButton
      color={color}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={`d-inline-flex align-items-center justify-content-center rounded-circle ${className}`}
      style={{ width: 34, height: 34, padding: 0 }}
      aria-label={title}
      {...btnVariantProps}
    >
      <CIcon icon={icon} className={variant === 'outline' ? '' : 'text-white'} />
    </CButton>
  )

  return title ? (
    <CTooltip content={title} placement="top">
      <span className="d-inline-block">{btn}</span>
    </CTooltip>
  ) : (
    btn
  )
}
