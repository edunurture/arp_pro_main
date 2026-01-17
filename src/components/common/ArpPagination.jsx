import React, { useMemo } from 'react'
import { CPagination, CPaginationItem } from '@coreui/react-pro'

/**
 * ArpPagination (CoreUI Pro)
 *
 * Props:
 * - page: number (1-based)
 * - totalPages: number (>=1)
 * - onChange: (nextPage:number) => void
 * - size: 'sm' | 'md' | 'lg' (default 'sm')
 * - align: 'start' | 'center' | 'end' (default 'end')
 * - showPrevNext: boolean (default true)
 * - prevText / nextText: string
 * - maxButtons: number | null
 *      - null => show all pages (simple)
 *      - number => show a window with ellipses (recommended if many pages)
 */
const ArpPagination = ({
  page,
  totalPages,
  onChange,
  size = 'sm',
  align = 'end',
  showPrevNext = true,
  prevText = 'Previous',
  nextText = 'Next',
  maxButtons = null,
  className = '',
  ariaLabel = 'Page navigation',
}) => {
  const safeTotal = Math.max(1, Number(totalPages) || 1)
  const safePage = Math.min(Math.max(1, Number(page) || 1), safeTotal)

  const justifyClass =
    align === 'start'
      ? 'justify-content-start'
      : align === 'center'
        ? 'justify-content-center'
        : 'justify-content-end'

  const goTo = (p) => {
    const next = Math.min(Math.max(1, p), safeTotal)
    if (next !== safePage) onChange?.(next)
  }

  const pageItems = useMemo(() => {
    // Simple mode: show all page numbers
    if (!maxButtons || maxButtons < 5 || safeTotal <= maxButtons) {
      return Array.from({ length: safeTotal }, (_, i) => i + 1)
    }

    // Windowed mode with ellipses
    const windowSize = maxButtons
    const half = Math.floor(windowSize / 2)

    let start = safePage - half
    let end = safePage + half

    if (start < 1) {
      start = 1
      end = windowSize
    }
    if (end > safeTotal) {
      end = safeTotal
      start = safeTotal - windowSize + 1
    }

    const items = []

    // Always show 1
    items.push(1)

    // Left ellipsis
    if (start > 2) items.push('...l')

    // Middle window (exclude 1 and total)
    for (let p = Math.max(2, start); p <= Math.min(safeTotal - 1, end); p++) {
      items.push(p)
    }

    // Right ellipsis
    if (end < safeTotal - 1) items.push('...r')

    // Always show last
    if (safeTotal > 1) items.push(safeTotal)

    return items
  }, [safePage, safeTotal, maxButtons])

  return (
    <div className={`d-flex ${justifyClass} mt-2 ${className}`}>
      <CPagination size={size} className="mb-0" aria-label={ariaLabel}>
        {showPrevNext && (
          <CPaginationItem disabled={safePage <= 1} onClick={() => goTo(safePage - 1)}>
            {prevText}
          </CPaginationItem>
        )}

        {pageItems.map((it, idx) => {
          if (typeof it === 'string' && it.startsWith('...')) {
            return (
              <CPaginationItem key={`${it}-${idx}`} disabled>
                …
              </CPaginationItem>
            )
          }

          const p = Number(it)
          return (
            <CPaginationItem key={p} active={p === safePage} onClick={() => goTo(p)}>
              {p}
            </CPaginationItem>
          )
        })}

        {showPrevNext && (
          <CPaginationItem disabled={safePage >= safeTotal} onClick={() => goTo(safePage + 1)}>
            {nextText}
          </CPaginationItem>
        )}
      </CPagination>
    </div>
  )
}

export default ArpPagination
