import React from 'react';
import { useLocation } from 'react-router-dom';

const PlaceholderPage = ({ controllerName }) => {
  const { pathname } = useLocation();

  return (
    <div style={{ padding: 48, textAlign: 'center', color: '#555' }}>
      <h2 style={{ marginBottom: 12 }}>Page in migration</h2>
      <p style={{ marginBottom: 8 }}>
        <strong>{pathname}</strong>
        {controllerName ? ` (${controllerName})` : ''}
      </p>
      <p style={{ fontSize: 14 }}>
        This screen exists in the Laravel sidebar but the React view is not wired yet.
      </p>
    </div>
  );
};

export default PlaceholderPage;
