import React from 'react';
import { Message } from 'primereact/message';
import { PageLayout } from './PageLayout';

export function PermissionDenied({
  title = 'Access denied',
  message,
  action = 'access this page',
}) {
  return (
    <PageLayout title={title}>
      <Message
        severity="warn"
        className="w-full"
        text={message || `You do not have permission to ${action}.`}
      />
    </PageLayout>
  );
}

export default PermissionDenied;
