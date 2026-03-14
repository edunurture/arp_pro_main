import React, { useMemo } from 'react'
import PropTypes from 'prop-types'
import { CToast, CToastBody, CToastClose, CToastHeader } from '@coreui/react-pro'

const TITLE_BY_VARIANT = {
  success: 'Success',
  danger: 'Action Required',
  warning: 'Attention',
  info: 'Information',
  secondary: 'Notice',
  primary: 'Notice',
}

export const normalizeToast = (toast) => {
  if (!toast) return null

  const variant = String(toast.variant || toast.type || toast.color || 'info')
  const autohide = typeof toast.autohide === 'boolean' ? toast.autohide : variant === 'success'
  const delay = Number(toast.delay ?? (autohide ? 5000 : 0))
  const parsedCreatedAt =
    typeof toast.createdAt === 'string' ? new Date(toast.createdAt).getTime() : toast.createdAt
  const createdAt = Number.isFinite(parsedCreatedAt) ? parsedCreatedAt : Date.now()

  return {
    id: toast.id || `arp-toast-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    variant,
    title: toast.title || TITLE_BY_VARIANT[variant] || 'Notice',
    message: toast.message,
    autohide,
    delay,
    createdAt,
  }
}

const ArpToast = ({ toast, onClose }) => {
  const normalizedToast = useMemo(() => normalizeToast(toast), [toast])

  if (!normalizedToast?.message) return null

  const { variant, title, message, autohide, delay } = normalizedToast

  return (
    <CToast
      visible
      color={variant}
      autohide={autohide}
      delay={delay > 0 ? delay : undefined}
      onClose={onClose}
      className="arp-toast border-0 shadow"
    >
      <CToastHeader className="arp-toast__header">
        <div className="fw-bold me-auto">{title}</div>
        <small className="arp-toast__timestamp">Now</small>
        <CToastClose className="arp-toast__close ms-2" />
      </CToastHeader>
      <CToastBody className="arp-toast__body">{message}</CToastBody>
    </CToast>
  )
}

ArpToast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    type: PropTypes.string,
    variant: PropTypes.string,
    color: PropTypes.string,
    title: PropTypes.string,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    autohide: PropTypes.bool,
    delay: PropTypes.number,
    createdAt: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  onClose: PropTypes.func,
}

ArpToast.defaultProps = {
  toast: null,
  onClose: undefined,
}

export default ArpToast
