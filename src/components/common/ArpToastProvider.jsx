import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { CToaster } from '@coreui/react-pro'
import ArpToast, { normalizeToast } from './ArpToast'

const ArpToastContext = createContext(null)

export const ArpToastProvider = ({
  children,
  placement = 'top-end',
  className = 'p-3',
  maxVisible = 4,
}) => {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((toastId) => {
    setToasts((currentToasts) => currentToasts.filter((item) => item.id !== toastId))
  }, [])

  const clear = useCallback(() => {
    setToasts([])
  }, [])

  const show = useCallback(
    (toastInput) => {
      const normalizedToast = normalizeToast(toastInput)
      if (!normalizedToast?.message) return null

      setToasts((currentToasts) => {
        const nextToasts = [...currentToasts, normalizedToast]
        return nextToasts.slice(-Math.max(1, maxVisible))
      })

      return normalizedToast.id
    },
    [maxVisible],
  )

  const api = useMemo(
    () => ({
      show,
      dismiss,
      clear,
      success: (message, options = {}) => show({ ...options, message, variant: 'success' }),
      error: (message, options = {}) => show({ ...options, message, variant: 'danger' }),
      warning: (message, options = {}) => show({ ...options, message, variant: 'warning' }),
      info: (message, options = {}) => show({ ...options, message, variant: 'info' }),
      notify: (message, options = {}) => show({ ...options, message, variant: 'primary' }),
    }),
    [clear, dismiss, show],
  )

  return (
    <ArpToastContext.Provider value={api}>
      {children}
      <CToaster className={`arp-toast-host ${className}`.trim()} placement={placement}>
        {toasts.map((toast) => (
          <ArpToast key={toast.id} toast={toast} onClose={() => dismiss(toast.id)} />
        ))}
      </CToaster>
    </ArpToastContext.Provider>
  )
}

ArpToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
  placement: PropTypes.string,
  className: PropTypes.string,
  maxVisible: PropTypes.number,
}

ArpToastProvider.defaultProps = {
  placement: 'top-end',
  className: 'p-3',
  maxVisible: 4,
}

export const useArpToast = () => {
  const context = useContext(ArpToastContext)

  if (!context) {
    throw new Error('useArpToast must be used within an ArpToastProvider')
  }

  return context
}

export default ArpToastProvider
