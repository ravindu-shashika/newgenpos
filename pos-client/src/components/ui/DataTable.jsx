import React, { useMemo } from 'react';
import { DataTable as PrimeDataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { cn } from '../../lib/cn';
import { primeSortOrder } from './primeUtils';

/**
 * DataTable — PrimeReact-backed list table (sort, selection, pagination).
 */
export function DataTable({
  columns = [],
  rows = [],
  rowKey = 'id',
  loading = false,
  emptyText = 'No records found',
  emptyIcon = '📋',
  sortCol,
  sortDir,
  onSort,
  selected,
  onToggleRow,
  onToggleAll,
  footer,
  className,
  size = 'small',
  pagination,
}) {
  const selection = useMemo(() => {
    if (!selected) return null;
    return rows.filter((row) => selected.has(row[rowKey]));
  }, [rows, selected, rowKey]);

  const handleSelectionChange = (e) => {
    if (!selected || !onToggleRow) return;
    const nextIds = new Set((e.value ?? []).map((row) => row[rowKey]));
    rows.forEach((row) => {
      const id = row[rowKey];
      const was = selected.has(id);
      const now = nextIds.has(id);
      if (was !== now) onToggleRow(id);
    });
  };

  const footerGroup = footer ? (
    <ColumnGroup>
      <Row>{footer}</Row>
    </ColumnGroup>
  ) : null;

  return (
    <div className={cn('ui-list-card p-card p-component', className)}>
      <PrimeDataTable
        value={rows}
        dataKey={rowKey}
        loading={loading}
        stripedRows
        showGridlines
        size={size === 'normal' ? undefined : size}
        emptyMessage={
          <div className="ui-empty text-center py-5 text-color-secondary">
            <div className="text-3xl mb-2 opacity-50">{emptyIcon}</div>
            {emptyText}
          </div>
        }
        sortField={sortCol}
        sortOrder={primeSortOrder(sortDir)}
        onSort={(e) => onSort?.(e.sortField)}
        selection={selection}
        onSelectionChange={handleSelectionChange}
        selectionMode={selected ? 'checkbox' : null}
        paginator={Boolean(pagination)}
        rows={pagination?.pageSize ?? 10}
        first={pagination ? (pagination.page - 1) * pagination.pageSize : 0}
        totalRecords={pagination?.totalRows ?? rows.length}
        rowsPerPageOptions={pagination?.pageSizes}
        onPage={(e) => {
          pagination?.onChange?.(e.page + 1);
          if (pagination?.onPageSize && e.rows !== pagination.pageSize) {
            pagination.onPageSize(e.rows);
          }
        }}
        paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
        className="ui-prime-table"
        footerColumnGroup={footerGroup}
      >
        {selected && (
          <Column
            selectionMode="multiple"
            headerStyle={{ width: '3rem' }}
            exportable={false}
          />
        )}
        {columns.map((col) => (
          <Column
            key={col.key}
            field={col.key}
            header={col.label}
            sortable={Boolean(col.sortable)}
            body={col.render ? (row) => col.render(row) : undefined}
            align={col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left'}
            style={col.align === 'right' ? { textAlign: 'right' } : undefined}
          />
        ))}
      </PrimeDataTable>
    </div>
  );
}
