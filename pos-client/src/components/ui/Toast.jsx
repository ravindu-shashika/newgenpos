import React, { useState, useCallback } from 'react';
import { apiSuccessMessage, apiErrorMessage } from '../../services/apiMessages';

/**
 * Toast — a self-dismissing notification.
 * useToast() — hook to manage toast state.
 *
 * Usage:
 *   const { toast, showToast, showApiSuccess, showApiError } = useToast();
 *   showToast('Saved!');
 *   showApiSuccess(res, 'Saved!');
 *   showApiError(err, 'Save failed.');
 *   <Toast toast={toast} />
 */
export function useToast(duration = 3000) {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), duration);
  }, [duration]);

  const showApiSuccess = useCallback(
    (response, fallback = 'Saved successfully.') => {
      showToast(apiSuccessMessage(response, fallback), 'success');
    },
    [showToast],
  );

  const showApiError = useCallback(
    (err, fallback = 'Request failed.') => {
      showToast(apiErrorMessage(err, fallback), 'error');
    },
    [showToast],
  );

  return { toast, showToast, showApiSuccess, showApiError };
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`ui-toast ${toast.type || 'success'}`}>{toast.msg}</div>
  );
}
