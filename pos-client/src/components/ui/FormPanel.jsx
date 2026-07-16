import React from 'react';
import { Panel } from 'primereact/panel';
import { cn } from '../../lib/cn';

/** Card section for forms — PrimeReact Panel. */
export function FormPanel({ title, children, className }) {
  return (
    <Panel
      header={title}
      toggleable={false}
      className={cn('ui-form-panel mb-4', className)}
    >
      <div className="flex flex-column gap-3">{children}</div>
    </Panel>
  );
}
