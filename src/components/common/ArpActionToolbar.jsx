import React from 'react'
import { CButton } from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload, cilSearch } from '@coreui/icons'

/**
 * ARP normalized toolbar row:
 * - Right aligned
 * - Single row (wraps only on very small widths)
 * - Standard sizes + spacing
 *
 * Usage:
 * <CCardHeader className="d-flex justify-content-between align-items-center">
 *   <span>Academic Selection</span>
 *   <ArpActionToolbar onSearch={...} onReset={...} onAddNew={...} />
 * </CCardHeader>
 */
const ArpActionToolbar = ({
  onSearch,
  onReset,
  onAddNew,
  showSearch = true,
  showReset = true,
  showAddNew = true,
  searchText = 'Search',
  resetText = 'Reset',
  addNewText = 'Add New',
  size = 'md', // 'sm' | 'md' | 'lg'
  disabledSearch = false,
  disabledReset = false,
  disabledAddNew = false,
  className = '',
}) => {
  return (
    <div
      className={[
        // Keeps it right aligned in any parent
        'd-flex align-items-center justify-content-end',
        // Prevent odd wrapping; still wraps gracefully on tiny screens
        'flex-wrap gap-2',
        className,
      ].join(' ')}
    >
      {showSearch && (
        <CButton
          color="primary"
          variant="solid"
          size={size}
          disabled={disabledSearch}
          onClick={onSearch}
          className="d-inline-flex align-items-center gap-2"
        >
          <CIcon icon={cilSearch} />
          <span>{searchText}</span>
        </CButton>
      )}

      {showReset && (
        <CButton
          color="warning"
          variant="outline"
          size={size}
          disabled={disabledReset}
          onClick={onReset}
          className="d-inline-flex align-items-center gap-2"
        >
          <CIcon icon={cilReload} />
          <span>{resetText}</span>
        </CButton>
      )}

      {showAddNew && (
        <CButton
          color="success"
          variant="solid"
          size={size}
          disabled={disabledAddNew}
          onClick={onAddNew}
          className="d-inline-flex align-items-center gap-2"
        >
          <CIcon icon={cilPlus} />
          <span>{addNewText}</span>
        </CButton>
      )}
    </div>
  )
}

export default ArpActionToolbar
