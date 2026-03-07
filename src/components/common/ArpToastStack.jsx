import React from 'react'
import PropTypes from 'prop-types'
import {
  CToast,
  CToastBody,
  CToastClose,
  CToastHeader,
  CToaster,
} from '@coreui/react-pro'

const TITLE_BY_TYPE = {
  success: 'Success',
  danger: 'Action Required',
  warning: 'Attention',
  info: 'Information',
  secondary: 'Notice',
  primary: 'Notice',
}

const ArpToastStack = ({ toast, onClose, placement = 'top-end' }) => {
  if (!toast?.message) return null

  const type = String(toast.type || 'info')
  const title = toast.title || TITLE_BY_TYPE[type] || 'Notice'
  const autohide = typeof toast.autohide === 'boolean' ? toast.autohide : type === 'success'
  const delay = Number(toast.delay || (autohide ? 4500 : 0))

  return (
    <CToaster className="p-3" placement={placement}>
      <CToast
        visible
        color={type}
        className="text-white border-0 shadow"
        autohide={autohide}
        delay={delay > 0 ? delay : undefined}
        onClose={onClose}
      >
        <CToastHeader>
          <div className="fw-bold me-auto">{title}</div>
          <small>Now</small>
          <CToastClose className="ms-2" />
        </CToastHeader>
        <CToastBody className="text-white">{toast.message}</CToastBody>
      </CToast>
    </CToaster>
  )
}

ArpToastStack.propTypes = {
  toast: PropTypes.shape({
    type: PropTypes.string,
    title: PropTypes.string,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    autohide: PropTypes.bool,
    delay: PropTypes.number,
  }),
  onClose: PropTypes.func,
  placement: PropTypes.string,
}

ArpToastStack.defaultProps = {
  toast: null,
  onClose: undefined,
  placement: 'top-end',
}

export default ArpToastStack
