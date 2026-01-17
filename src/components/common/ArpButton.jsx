import React from 'react'
import PropTypes from 'prop-types'
import CIcon from '@coreui/icons-react'
import { CTooltip } from '@coreui/react-pro'
import {
  cilPlus,
  cilSearch,
  cilReload,
  cilCloudUpload,
  cilCloudDownload,
  cilSave,
  cilX,
  cilPencil,
  cilTrash,
} from '@coreui/icons'

const BS_COLORS = new Set([
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'light',
  'dark',
])

const FALLBACK_BG = {
  purple: '#6f42c1',
}

// ✅ ARP Standard Icons (CoreUI)
const ARP_ICON = {
  add: cilPlus,
  search: cilSearch,
  reset: cilReload,
  upload: cilCloudUpload,
  download: cilCloudDownload,
  save: cilSave,
  cancel: cilX,
  edit: cilPencil, // ✅ added
  delete: cilTrash, // ✅ added
}

const DEFAULT_TITLES = {
  add: 'Add New',
  search: 'Search',
  reset: 'Reset',
  upload: 'Upload',
  download: 'Download',
  save: 'Save',
  cancel: 'Cancel',
  edit: 'Edit',
  delete: 'Delete',
}

export default function ArpButton({
  label,
  // icon keys: add | upload | download | save | cancel | edit | delete
  icon,
  color = 'primary',
  size = 'sm',
  type = 'button',
  disabled = false,
  onClick,
  title,
  className = '',
}) {
  const isBootstrapColor = BS_COLORS.has(color)

  // Purple fallback (Bootstrap doesn't include btn-purple by default)
  const style =
    color === 'purple' && !isBootstrapColor
      ? { backgroundColor: FALLBACK_BG.purple, borderColor: FALLBACK_BG.purple }
      : undefined

  const iconSvg = icon ? ARP_ICON[icon] : null
  const tip = title || (icon ? DEFAULT_TITLES[icon] : undefined)

  const btn = (
    <button
      type={type}
      className={[
        'btn',
        `btn-${isBootstrapColor ? color : 'primary'}`,
        `btn-${size}`,
        'text-white',
        className,
      ].join(' ')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        ...(style || {}),
      }}
      disabled={disabled}
      onClick={onClick}
      aria-label={tip || label}
    >
      {iconSvg ? <CIcon icon={iconSvg} size="sm" className="text-white" /> : null}
      <span>{label}</span>
    </button>
  )

  return tip ? (
    <CTooltip content={tip} placement="top">
      <span className="d-inline-block">{btn}</span>
    </CTooltip>
  ) : (
    btn
  )
}

ArpButton.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.oneOf([
    'add',
    'search',
    'reset',
    'upload',
    'download',
    'save',
    'cancel',
    'edit',
    'delete',
  ]),
  color: PropTypes.string,
  size: PropTypes.string,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  title: PropTypes.string,
  className: PropTypes.string,
}
