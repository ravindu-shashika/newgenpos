import React, { useState, useCallback } from 'react';

/**
 * Toast — a self-dismissing notification.
 * useToast() — hook to manage toast state.
 *
 * Usage:
 *   const { toast, showToast } = useToast();
 *   showToast('Saved!');
 *   showToast('Error!', 'error');
 *   <Toast toast={toast} />
 */
export function useToast(duration = 3000) {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), duration);
  }, [duration]);

  return { toast, showToast };
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`ui-toast ${toast.type || 'success'}`}>{toast.msg}</div>
  );
}
