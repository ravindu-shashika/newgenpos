/**
 * Read user-facing success/error text from API responses.
 * Works with axios responses and errors thrown by services/api.js.
 */

function pickString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function apiSuccessMessage(response, fallback = 'Saved successfully.') {
  const data = response?.data;
  return (
    pickString(data?.message, data?.msg, data?.success) || fallback
  );
}

export function apiErrorMessage(err, fallback = 'Request failed.') {
  if (!err) return fallback;
  if (typeof err === 'string' && err.trim()) return err.trim();

  const direct = pickString(err.message);
  const data = err.response?.data ?? (err.errors ? { errors: err.errors } : null);

  const fromPayload = pickString(
    data?.message,
    data?.msg,
    data?.error,
    typeof data?.success === 'string' ? data.success : null,
  );

  if (fromPayload) return fromPayload;

  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).flat().find((v) => typeof v === 'string' && v.trim());
    if (first) return first.trim();
  }

  if (direct && direct !== 'Request failed') return direct;

  return fallback;
}
