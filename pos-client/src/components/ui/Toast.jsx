import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
} from 'react';
import { Toast as PrimeToast } from 'primereact/toast';
import { apiSuccessMessage, apiErrorMessage } from '../../services/apiMessages';

const ToastContext = createContext(null);

function severityForType(type) {
  if (type === 'error') return 'error';
  if (type === 'warning') return 'warn';
  if (type === 'info') return 'info';
  return 'success';
}

function useToastState(duration = 4000) {
  const toastRef = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    if (!msg) return;
    toastRef.current?.show({
      severity: severityForType(type),
      summary: String(msg),
      life: duration,
    });
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

  return { toastRef, showToast, showApiSuccess, showApiError };
}

export function ToastProvider({ children, duration = 4000 }) {
  const value = useToastState(duration);

  return (
    <ToastContext.Provider value={value}>
      <PrimeToast ref={value.toastRef} position="bottom-right" />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(duration = 4000) {
  const global = useContext(ToastContext);
  const local = useToastState(duration);
  return global ?? local;
}

/** Legacy page-level toast mount — Prime toast is global via ToastProvider. */
export function Toast() {
  return null;
}
