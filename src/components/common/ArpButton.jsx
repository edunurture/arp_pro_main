import React from 'react'
import PropTypes from 'prop-types'
import CIcon from '@coreui/icons-react'
import { CButton } from '@coreui/react-pro'
import {
  cilMagnifyingGlass,
  cilSend,
  cilCloudUpload,
  cilPlus,
  cilSearch,
  cilReload,
  cilCloudDownload,
  cilSave,
  cilX,
  cilPencil,
  cilTrash,
  cilPrint,
} from '@coreui/icons'

const ARP_ICON = {
  add: cilPlus,
  search: cilSearch,
  reset: cilReload,
  upload: cilCloudUpload,
  download: cilCloudDownload,
  save: cilSave,
  cancel: cilX,
  edit: cilPencil,
  delete: cilTrash,
  print: cilPrint,
  view: cilMagnifyingGlass,
  submit: cilSend,
  publish: cilCloudUpload,
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
  print: 'Print',
  view: 'View',
  submit: 'Submit',
  publish: 'Publish',
}

// CoreUI supports only these theme colors by default.
// Your ARP pages use color="purple" for Add New — map it safely here.
const COLOR_ALIASES = {
  purple: 'primary',
}

const ArpButton = ({
  label,
  icon,
  color = 'primary',
  onClick,
  disabled = false,
  className = '',
  style,
  ...rest
}) => {
  const iconSvg = ARP_ICON[icon]
  const title = DEFAULT_TITLES[icon] || label
  const isLmsRoute =
    typeof window !== 'undefined' &&
    (() => {
      const path = String(window.location?.pathname || '').toLowerCase()
      const hash = String(window.location?.hash || '').toLowerCase()
      return path.startsWith('/lms') || hash.includes('/lms')
    })()

  // 1) Normalize unsupported colors (ex: "purple")
  const normalizedColor = COLOR_ALIASES[color] || color

  // Keep the "purple" visual identity even though CoreUI doesn't have a "purple" theme color.
  // If you already have your own SCSS theme, you can remove this and set the color in CSS instead.
  const purpleStyle =
    color === 'purple'
      ? {
          backgroundColor: '#6f42c1',
          borderColor: '#6f42c1',
          ...(style || {}),
        }
      : style

  // LMS requirement: keep label/icon clearly visible on dark button backgrounds.
  const enforceLmsContrast = isLmsRoute
  const resolvedStyle = enforceLmsContrast
    ? {
        ...(purpleStyle || {}),
        color: '#fff',
      }
    : purpleStyle

  return (
    <CButton
      color={normalizedColor}
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${enforceLmsContrast ? 'text-white' : ''}`.trim()}
      style={resolvedStyle}
      {...rest}
    >
      {iconSvg && <CIcon icon={iconSvg} className="me-2" style={enforceLmsContrast ? { color: 'inherit' } : undefined} />}
      {label || title}
    </CButton>
  )
}

ArpButton.propTypes = {
  label: PropTypes.string,
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
    'print',
    'view',
    'submit',
    'publish',
  ]),
  color: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
}

export default ArpButton
