import React from 'react';
import { cn } from '../../lib/cn';

/** PageLayout — wraps every admin page with Prime-friendly spacing. */
export function PageLayout({ eyebrow, title, actions, children, onClick, className }) {
  const showHeader = Boolean(eyebrow || title || actions);

  return (
    <div
      className={cn('ui-page-layout', className)}
      onClick={onClick}
    >
      {showHeader && (
        <div className="ui-page-header">
          <div>
            {eyebrow && <div className="ui-page-eyebrow">{eyebrow}</div>}
            {title && <h1 className="ui-page-title">{title}</h1>}
          </div>
          {actions && (
            <div className="flex flex-wrap align-items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
