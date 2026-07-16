import React from 'react';
import { cn } from '../../lib/cn';

/** Cell helper classes — defined in tailwind.css @layer components. */
export const cellNumClass = 'cell-num';
export const cellPosClass = 'cell-pos';
export const cellNegClass = 'cell-neg';
export const cellTagClass = 'cell-tag';
export const cellMutedClass = 'cell-muted';

/** Rounded scroll container for tables (list pages + inline form lines). */
export function TableWrap({ children, className, embedded = false }) {
  return (
    <div
      className={cn(
        'ui-table-wrap',
        embedded && 'ui-table-wrap--embedded',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Base table — pair with TableWrap or use className="ui-table" directly. */
export function Table({ children, className, compact = false }) {
  return (
    <table className={cn('ui-table', compact && 'compact', className)}>
      {children}
    </table>
  );
}
