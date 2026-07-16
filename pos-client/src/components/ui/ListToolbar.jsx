import React from 'react';
import { Toolbar } from 'primereact/toolbar';

/** Toolbar row above list tables (search, filters, etc.). */
export function ListToolbar({ children, className = '' }) {
  return (
    <Toolbar className={`ui-toolbar ${className}`.trim()} start={children} />
  );
}

/** Unified card shell for table + footer pagination. */
export function ListCard({ children, className = '' }) {
  return (
    <div className={`ui-list-card p-card p-component ${className}`.trim()}>
      {children}
    </div>
  );
}
