import React from 'react';
import { Paginator } from 'primereact/paginator';
import { cn } from '../../lib/cn';

/**
 * Pagination — PrimeReact paginator wrapper (legacy separate usage).
 */
export function Pagination({
  page,
  totalPages,
  pageSize,
  totalRows,
  onChange,
  pageSizes,
  onPageSize,
  embedded = false,
  className,
}) {
  const safePage = Math.min(page, Math.max(1, totalPages));
  const first = totalRows === 0 ? 0 : (safePage - 1) * pageSize;

  return (
    <Paginator
      className={cn('ui-pagination-bar', embedded && 'ui-pagination--embedded', className)}
      first={first}
      rows={pageSize}
      totalRecords={totalRows}
      rowsPerPageOptions={pageSizes}
      onPageChange={(e) => {
        onChange(Math.floor(e.first / e.rows) + 1);
        if (onPageSize && e.rows !== pageSize) onPageSize(e.rows);
      }}
      template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
    />
  );
}
