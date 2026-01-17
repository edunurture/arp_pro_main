import React from 'react'
import PropTypes from 'prop-types'
import CIcon from '@coreui/icons-react'
import { CTooltip } from '@coreui/react-pro'
import {
  cilPlus,
  cilMagnifyingGlass,
  cilPencil,
  cilTrash,
  cilCloudDownload,
  cilCloudUpload,
  cilPrint,
  cilChartLine,
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

// ✅ ARP Table Action Icons (CoreUI)
const ARP_TABLE_ICON = {
  add: cilPlus,
  view: cilMagnifyingGlass,
  edit: cilPencil,
  delete: cilTrash,
  download: cilCloudDownload,
  upload: cilCloudUpload,
  print: cilPrint,
  chart: cilChartLine,
}

const DEFAULT_TITLES = {
  add: 'Add New',
  view: 'View',
  edit: 'Edit',
  delete: 'Delete',
  download: 'Download',
  upload: 'Upload',
  print: 'Print',
  chart: 'Chart',
}

export default function ArpIconButton({
  // icon keys: add | view | edit | delete | download | upload | print | chart
  icon,
  color = 'primary',
  size = 40,
  onClick,
  title,
  disabled = false,
  className = '',
}) {
  const isBootstrapColor = BS_COLORS.has(color)

  const style =
    color === 'purple' && !isBootstrapColor
      ? { backgroundColor: FALLBACK_BG.purple, borderColor: FALLBACK_BG.purple }
      : undefined

  const iconSvg = ARP_TABLE_ICON[icon]
  const tip = title || DEFAULT_TITLES[icon]

  const btn = (
    <button
      type="button"
      className={[
        'btn',
        `btn-${isBootstrapColor ? color : 'primary'}`,
        'btn-sm',
        'rounded-circle',
        'text-white',
        className,
      ].join(' ')}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(style || {}),
      }}
      onClick={onClick}
      disabled={disabled}
      aria-label={tip}
    >
      {iconSvg ? <CIcon icon={iconSvg} size="sm" className="text-white" /> : null}
    </button>
  )

  // Disabled elements don't trigger tooltips reliably; wrap with span.
  return tip ? (
    <CTooltip content={tip} placement="top">
      <span className="d-inline-block">{btn}</span>
    </CTooltip>
  ) : (
    btn
  )
}

ArpIconButton.propTypes = {
  icon: PropTypes.oneOf(['add', 'view', 'edit', 'delete', 'download', 'upload', 'print', 'chart']).isRequired,
  color: PropTypes.string,
  size: PropTypes.number,
  onClick: PropTypes.func,
  title: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
}
