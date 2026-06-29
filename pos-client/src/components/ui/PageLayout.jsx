import React from 'react';
import { UI_CSS } from './tokens';

/**
 * PageLayout — wraps every admin page with the shared CSS and layout.
 *
 * <PageLayout
 *   eyebrow="Products"
 *   title="Categories"
 *   actions={<><button className="ui-btn primary">+ Add</button></>}
 * >
 *   {page content}
 * </PageLayout>
 */
export function PageLayout({ eyebrow, title, actions, children, onClick }) {
  const showHeader = Boolean(eyebrow || title || actions);

  return (
    <>
      <style>{UI_CSS}</style>
      <div className="ui-wrap" onClick={onClick}>
        {showHeader && (
          <div className="ui-header">
            <div>
              {eyebrow && <div className="ui-eyebrow">{eyebrow}</div>}
              {title && <h1 className="ui-title">{title}</h1>}
            </div>
            {actions && <div className="ui-header-actions">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </>
  );
}
