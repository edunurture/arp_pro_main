import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import {
  CCard,
  CCardHeader,
  CCardBody,
  CFormInput,
  CFormSelect,
  CSpinner,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
  CPagination,
  CPaginationItem,
} from '@coreui/react-pro'

/**
 * ArpDataTable (ARP CoreUI Pro Standard)
 * - Search + Page Size in header
 * - Sorting on column headers
 * - Loading + Empty states
 * - Pagination (CPagination size="sm")
 *
 * Columns:
 *  [
 *    { key: 'name', label: 'Name', sortable: true, width: 240, align: 'left', render: (row) => ... },
 *    ...
 *  ]
 *
 * Optional selection:
 *  selection={{
 *    type: 'radio' | 'checkbox',
 *    selected: selectedIdOrArray,
 *    onChange: (valueOrArray, row) => void,
 *    key: 'id', // defaults to rowKey
 *    headerLabel: 'Select',
 *    width: 70,
 *    name: 'arpRowSelect', // radio group name
 *    disabled: (row) => false,
 *  }}
 */
const ArpDataTable = ({
  title,
  rows = [],
  columns = [],
  scopedColumns = null,
  loading = false,
  headerActions = null,
  searchable = true,
  searchPlaceholder = 'Search...',
  defaultSearch = '',
  pageSizeOptions = [5, 10, 20, 50],
  defaultPageSize = 10,
  rowKey = 'id',
  selection = null,
  emptyText = 'No records found.',
  className = 'mb-3',
}) => {
  const safeColumns = Array.isArray(columns) ? columns : []
  const safeRows = Array.isArray(rows) ? rows : []

  const [search, setSearch] = useState(defaultSearch)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [page, setPage] = useState(1) // 1-based
  const [sort, setSort] = useState(() => {
    // pick first sortable column as default; otherwise rowKey
    const firstSortable = safeColumns.find((c) => c.sortable)
    return { key: firstSortable?.key || rowKey, dir: 'asc' }
  })

  // Reset paging when search/pageSize changes
  useEffect(() => {
    setPage(1)
  }, [search, pageSize])

  const normalize = (v) =>
    String(v ?? '')
      .toLowerCase()
      .trim()

  const filteredRows = useMemo(() => {
  const list = Array.isArray(safeRows) ? safeRows : []

  if (!search || !String(search).trim()) return list

  const q = String(search).toLowerCase()

  return list.filter((row) => JSON.stringify(row ?? {}).toLowerCase().includes(q))
}, [rows, search])

  const sortedRows = useMemo(() => {
    const { key, dir } = sort || {}
    if (!key) return filteredRows

    const col = safeColumns.find((c) => c.key === key)
    const sortType = col?.sortType || 'auto' // 'auto' | 'number' | 'string'

    const cmp = (a, b) => {
      const va = a?.[key]
      const vb = b?.[key]

      // Handle nulls
      if (va == null && vb == null) return 0
      if (va == null) return -1
      if (vb == null) return 1

      if (sortType === 'number') {
        const na = Number(va)
        const nb = Number(vb)
        if (Number.isNaN(na) && Number.isNaN(nb)) return 0
        if (Number.isNaN(na)) return -1
        if (Number.isNaN(nb)) return 1
        return na - nb
      }

      if (sortType === 'string') {
        return String(va).localeCompare(String(vb), undefined, { sensitivity: 'base' })
      }

      // auto
      const na = Number(va)
      const nb = Number(vb)
      const bothNumeric = !Number.isNaN(na) && !Number.isNaN(nb) && String(va).trim() !== '' && String(vb).trim() !== ''
      if (bothNumeric) return na - nb
      return String(va).localeCompare(String(vb), undefined, { sensitivity: 'base' })
    }

    const arr = [...(Array.isArray(filteredRows) ? filteredRows : [])].sort(cmp)
    if (dir === 'desc') arr.reverse()
    return arr
  }, [filteredRows, sort, columns])

  const total = sortedRows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [sortedRows, page, pageSize])

  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, total)

  const sortToggle = (key) => {
    const col = safeColumns.find((c) => c.key === key)
    if (!col?.sortable) return

    setSort((p) => {
      if (!p || p.key !== key) return { key, dir: 'asc' }
      return { key, dir: p.dir === 'asc' ? 'desc' : 'asc' }
    })
  }

  const sortIndicator = (key) => {
    if (sort?.key !== key) return null
    return sort.dir === 'asc' ? ' ▲' : ' ▼'
  }

  const goPage = (n) => setPage(Math.min(Math.max(1, n), totalPages))

  const renderSelectionHeader = () => {
    if (!selection) return null
    return (
      <CTableHeaderCell style={{ width: selection.width || 70 }} className="text-center">
        {selection.headerLabel || 'Select'}
      </CTableHeaderCell>
    )
  }

  const renderSelectionCell = (row) => {
    if (!selection) return null

    const selKey = selection.key || rowKey
    const value = row?.[selKey]
    const disabled = typeof selection.disabled === 'function' ? !!selection.disabled(row) : false

    if (selection.type === 'checkbox') {
      const selectedArr = Array.isArray(selection.selected) ? selection.selected : []
      const checked = selectedArr.includes(value)
      return (
        <CTableDataCell className="text-center">
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={() => {
              const next = checked ? selectedArr.filter((x) => x !== value) : [...selectedArr, value]
              selection.onChange?.(next, row)
            }}
          />
        </CTableDataCell>
      )
    }

    // default radio
    const checked = selection.selected === value
    return (
      <CTableDataCell className="text-center">
        <input
          type="radio"
          name={selection.name || 'arpRowSelect'}
          checked={checked}
          disabled={disabled}
          onChange={() => selection.onChange?.(value, row)}
        />
      </CTableDataCell>
    )
  }

  return (
    <CCard className={className || 'mb-3'}>
      <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <strong>{title}</strong>

        <div className="d-flex align-items-center gap-2 flex-nowrap">
          {searchable && (
            <CFormInput
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
              aria-label="Search"
              title="Search"
            />
          )}

          <CFormSelect
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ width: 130 }}
            title="Rows per page"
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </CFormSelect>

          {headerActions ? (
            <div className="d-flex align-items-center gap-2">{headerActions}</div>
          ) : null}
        </div>
      </CCardHeader>

      <CCardBody>
        <CTable bordered striped hover responsive className="mb-2 arp-table-compact">
          <CTableHead>
            <CTableRow>
              {renderSelectionHeader()}

              {safeColumns.map((c) => {
                const clickable = !!c.sortable
                const style = {
                  ...(c.width ? { width: c.width } : {}),
                  ...(clickable ? { cursor: 'pointer' } : {}),
                }
                const alignClass =
                  c.align === 'center'
                    ? 'text-center'
                    : c.align === 'right'
                      ? 'text-end'
                      : 'text-start'

                return (
                  <CTableHeaderCell
                    key={c.key}
                    style={style}
                    className={alignClass}
                    onClick={() => clickable && sortToggle(c.key)}
                    title={clickable ? `Sort by ${c.label}` : c.label}
                  >
                    {c.label}
                    {clickable ? sortIndicator(c.key) : null}
                  </CTableHeaderCell>
                )
              })}
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {loading ? (
              <CTableRow>
                <CTableDataCell
                  colSpan={(selection ? 1 : 0) + safeColumns.length}
                  className="text-center py-4"
                >
                  <CSpinner size="sm" className="me-2" />
                  Loading...
                </CTableDataCell>
              </CTableRow>
            ) : pageRows.length === 0 ? (
              <CTableRow>
                <CTableDataCell
                  colSpan={(selection ? 1 : 0) + safeColumns.length}
                  className="text-center py-4"
                >
                  {emptyText}
                </CTableDataCell>
              </CTableRow>
            ) : (
              pageRows.map((row) => (
                <CTableRow key={row?.[rowKey]}>
                  {renderSelectionCell(row)}

                  {safeColumns.map((c) => {
                    const alignClass =
                      c.align === 'center'
                        ? 'text-center'
                        : c.align === 'right'
                          ? 'text-end'
                          : 'text-start'
                    const cell =
                      typeof scopedColumns?.[c.key] === 'function'
                        ? scopedColumns[c.key](row)
                        : typeof c.render === 'function'
                          ? c.render(row)
                          : row?.[c.key]

                    return (
                      <CTableDataCell key={c.key} className={alignClass}>
                        {cell}
                      </CTableDataCell>
                    )
                  })}
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>

        <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
          <div className="text-body-secondary">
            Showing <strong>{showingFrom}</strong>–<strong>{showingTo}</strong> of{' '}
            <strong>{total}</strong>
          </div>

          <CPagination size="sm" aria-label="Table pagination">
            <CPaginationItem disabled={page <= 1} onClick={() => goPage(page - 1)}>
              Previous
            </CPaginationItem>

            {Array.from({ length: totalPages })
              .slice(0, 20)
              .map((_, idx) => {
                const n = idx + 1

                // If many pages, keep it clean: show 1..3, current±1, last
                if (totalPages > 9) {
                  const isEdge = n <= 2 || n > totalPages - 2
                  const isNear = Math.abs(n - page) <= 1
                  const shouldShow = isEdge || isNear

                  if (!shouldShow) {
                    // show ellipsis placeholders at boundaries
                    if (n === 3 && page > 4) {
                      return (
                        <CPaginationItem key="left-ellipsis" disabled>
                          …
                        </CPaginationItem>
                      )
                    }
                    if (n === totalPages - 2 && page < totalPages - 3) {
                      return (
                        <CPaginationItem key="right-ellipsis" disabled>
                          …
                        </CPaginationItem>
                      )
                    }
                    return null
                  }
                }

                return (
                  <CPaginationItem key={n} active={n === page} onClick={() => goPage(n)}>
                    {n}
                  </CPaginationItem>
                )
              })}

            <CPaginationItem disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
              Next
            </CPaginationItem>
          </CPagination>
        </div>
      </CCardBody>
    </CCard>
  )
}

ArpDataTable.propTypes = {
  title: PropTypes.string.isRequired,
  rows: PropTypes.arrayOf(PropTypes.object),
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      sortable: PropTypes.bool,
      sortType: PropTypes.oneOf(['auto', 'number', 'string']),
      align: PropTypes.oneOf(['left', 'center', 'right']),
      render: PropTypes.func,
    }),
  ).isRequired,
  loading: PropTypes.bool,
  headerActions: PropTypes.node,
  scopedColumns: PropTypes.objectOf(PropTypes.func),
  searchable: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  defaultSearch: PropTypes.string,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  defaultPageSize: PropTypes.number,
  rowKey: PropTypes.string,
  selection: PropTypes.shape({
    type: PropTypes.oneOf(['radio', 'checkbox']),
    selected: PropTypes.any,
    onChange: PropTypes.func,
    key: PropTypes.string,
    headerLabel: PropTypes.string,
    width: PropTypes.number,
    name: PropTypes.string,
    disabled: PropTypes.func,
  }),
  emptyText: PropTypes.string,
  className: PropTypes.string,
}



ArpDataTable.defaultProps = {
  rows: [],
  columns: [],
  scopedColumns: null,
  loading: false,
  headerActions: null,
  rowKey: 'id',
  onRowClick: null,
  onSelectionChange: null,
  selectionMode: 'single',
  selectable: false,
  selectedRowKeys: [],
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
  defaultSearch: '',
  emptyText: 'No Records Found',
  className: '',
}

export default ArpDataTable