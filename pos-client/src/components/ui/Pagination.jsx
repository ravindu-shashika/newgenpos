import React from 'react';

/**
 * Pagination — page buttons + "showing X–Y of N" text.
 *
 * Props:
 *   page        current page (1-based)
 *   totalPages  total number of pages
 *   pageSize    current rows per page
 *   totalRows   total record count
 *   onChange    (page: number) => void
 *   pageSizes   optional array of page-size options
 *   onPageSize  optional (size: number) => void
 */
export function Pagination({
  page,
  totalPages,
  pageSize,
  totalRows,
  onChange,
  pageSizes,
  onPageSize,
}) {
  const safePage = Math.min(page, Math.max(1, totalPages));
  const from = totalRows === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalRows);

  const pageNums = () => {
    const nums = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= safePage - 2 && i <= safePage + 2))
        nums.push(i);
      else if (nums[nums.length - 1] !== '…')
        nums.push('…');
    }
    return nums;
  };

  return (
    <div className="ui-pagination">
      <span>
        Showing {from}–{to} of {totalRows}
        {pageSizes && onPageSize && (
          <select
            className="ui-select"
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            style={{ marginLeft: 12, fontSize: '0.72rem', padding: '3px 8px' }}
          >
            {pageSizes.map((n) => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </select>
        )}
      </span>

      <div className="ui-page-btns">
        <button
          className="ui-page-btn"
          disabled={safePage === 1}
          onClick={() => onChange(safePage - 1)}
        >
          ‹
        </button>

        {pageNums().map((n, i) =>
          n === '…' ? (
            <span key={i} style={{ padding: '4px 2px', color: 'var(--ui-muted)', fontSize: '0.72rem' }}>
              …
            </span>
          ) : (
            <button
              key={i}
              className={`ui-page-btn${n === safePage ? ' cur' : ''}`}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          )
        )}

        <button
          className="ui-page-btn"
          disabled={safePage >= totalPages}
          onClick={() => onChange(safePage + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
