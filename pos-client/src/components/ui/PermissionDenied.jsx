import React from 'react';
import { PageLayout } from './PageLayout';

/**
 * Shown when the user opens a route without the required permission.
 * @param {{ title?: string, message?: string, action?: string }} props
 */
export function PermissionDenied({
  title = 'Access denied',
  message,
  action = 'access this page',
}) {
  return (
    <PageLayout title={title}>
      <div className="ui-card" style={{ padding: 24, maxWidth: 560 }}>
        <p className="text-muted" style={{ margin: 0 }}>
          {message || `You do not have permission to ${action}.`}
        </p>
      </div>
    </PageLayout>
  );
}

export default PermissionDenied;
