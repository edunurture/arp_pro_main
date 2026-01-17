import React from 'react'
import PropTypes from 'prop-types'
import {
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CFormSelect,
  CBadge,
} from '@coreui/react-pro'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilClock } from '@coreui/icons'

/**
 * ARP table toolbar (single-row):
 * Search box + Page size selector + optional timer badge + optional action buttons.
 */
export default function TableToolbar({
  search,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
  timerText,
  actions,
  className = '',
}) {
  return (
    <div
      className={`d-flex align-items-center gap-2 flex-nowrap ${className}`}
      style={{ overflowX: 'auto' }}
    >
      <CInputGroup size="sm" style={{ width: 260, minWidth: 220 }}>
        <CInputGroupText>
          <CIcon icon={cilSearch} />
        </CInputGroupText>
        <CFormInput placeholder="Search..." value={search} onChange={onSearchChange} />
      </CInputGroup>

      <CFormSelect
        size="sm"
        value={pageSize}
        onChange={onPageSizeChange}
        style={{ width: 120, minWidth: 120 }}
        aria-label="Page size"
      >
        {pageSizeOptions.map((n) => (
          <option key={n} value={n}>
            {n} / page
          </option>
        ))}
      </CFormSelect>

      {timerText ? (
        <CBadge
          color="secondary"
          className="d-inline-flex align-items-center gap-1"
          style={{ height: 28 }}
        >
          <CIcon icon={cilClock} />
          <span>{timerText}</span>
        </CBadge>
      ) : null}

      {actions ? <div className="d-flex gap-2">{actions}</div> : null}
    </div>
  )
}

TableToolbar.propTypes = {
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  pageSize: PropTypes.number.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  timerText: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
}
