import React from 'react';

/**
 * DataTable — ledger-style table with sortable columns, checkboxes,
 * loading & empty states.
 *
 * Props:
 *   columns        Array<{ key, label, sortable?, align?, render? }>
 *   rows           Array of row objects
 *   rowKey         field name used as React key (default 'id')
 *   loading        boolean
 *   emptyText      string
 *   emptyIcon      string (emoji)
 *   sortCol        current sort key
 *   sortDir        'asc' | 'desc'
 *   onSort         (key) => void
 *   selected       Set of ids
 *   onToggleRow    (id) => void
 *   onToggleAll    () => void
 *   footer         optional footer row <td> elements as React node
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
}) {
  const pageAllChecked =
    rows.length > 0 && rows.every((r) => selected?.has(r[rowKey]));

  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            {selected && (
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  className="ui-chk"
                  checked={pageAllChecked}
                  onChange={onToggleAll}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={
                  col.sortable
                    ? `sortable${sortCol === col.key ? ' sorted' : ''}`
                    : ''
                }
                style={{ textAlign: col.align || 'left' }}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                {col.label}
                {col.sortable && (
                  <i className="sort-icon">
                    {sortCol === col.key
                      ? sortDir === 'asc' ? '↑' : '↓'
                      : '↕'}
                  </i>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (selected ? 1 : 0)}>
                <div className="ui-loading">Loading…</div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selected ? 1 : 0)}>
                <div className="ui-empty">
                  <span className="ui-empty-icon">{emptyIcon}</span>
                  {emptyText}
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row[rowKey]}
                className={`fade-row${selected?.has(row[rowKey]) ? ' sel-row' : ''}`}
                style={{ animationDelay: `${i * 0.025}s` }}
              >
                {selected && (
                  <td onClick={() => onToggleRow(row[rowKey])}>
                    <input
                      type="checkbox"
                      className="ui-chk"
                      readOnly
                      checked={selected.has(row[rowKey])}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleRow(row[rowKey])}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={col.align === 'right' ? 'cell-num' : ''}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>

        {footer && (
          <tfoot>
            <tr>{footer}</tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
