import React from 'react'
import PropTypes from 'prop-types'
import { CToaster } from '@coreui/react-pro'
import ArpToast from './ArpToast'

const ArpToastStack = ({ toast, onClose, placement = 'top-end' }) => {
  if (!toast?.message) return null

  return (
    <CToaster className="arp-toast-host p-3" placement={placement}>
      <ArpToast toast={toast} onClose={onClose} />
    </CToaster>
  )
}

ArpToastStack.propTypes = {
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
  placement: PropTypes.string,
}

ArpToastStack.defaultProps = {
  toast: null,
  onClose: undefined,
  placement: 'top-end',
}

export default ArpToastStack
