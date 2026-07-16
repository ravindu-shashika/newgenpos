import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PageLayout } from '../components/ui';

const PAGE_HINTS = {
  '/setting/mail_setting': {
    title: 'Mail settings',
    eyebrow: 'Settings',
    hint: 'SMTP and email delivery configuration will be available here.',
  },
  '/setting/payment-gateways/list': {
    title: 'Payment gateways',
    eyebrow: 'Settings',
    hint: 'Connect Stripe, PayPal, and other payment providers from this screen.',
  },
  '/sales/sale_by_csv': {
    title: 'Import sales by CSV',
    eyebrow: 'Sales',
    hint: 'Bulk import sales from a spreadsheet — migration in progress.',
  },
  '/sale/import-csv': {
    title: 'Import sales by CSV',
    eyebrow: 'Sales',
    hint: 'Bulk import sales from a spreadsheet — migration in progress.',
  },
};

export default function PlaceholderPage({ controllerName }) {
  const { pathname } = useLocation();
  const meta = PAGE_HINTS[pathname] || {};
  const title = meta.title || 'Page in progress';
  const eyebrow = meta.eyebrow || 'Admin';

  return (
    <PageLayout eyebrow={eyebrow} title={title}>
      <div className="ui-form-card" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div className="ui-empty-icon" aria-hidden>⧗</div>
        <p style={{ fontSize: '0.92rem', color: 'var(--ui-muted)', marginBottom: 12 }}>
          {meta.hint || 'This screen is registered in the menu but the React view is still being migrated.'}
        </p>
        <p className="ui-form-hint" style={{ marginBottom: 0 }}>
          <strong>{pathname}</strong>
          {controllerName ? ` · ${controllerName}` : ''}
        </p>
        <div className="ui-form-footer" style={{ justifyContent: 'center', borderTop: 'none', paddingTop: 8 }}>
          <Link to="/dashboard" className="ui-btn primary">Back to dashboard</Link>
        </div>
      </div>
    </PageLayout>
  );
}
