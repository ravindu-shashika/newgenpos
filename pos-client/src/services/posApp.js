/**
 * Open React SPA POS in a new browser tab (no sidebar/navbar shell).
 */
export function getPosAppUrl(draftId) {
  if (typeof window === 'undefined') {
    return '#/pos';
  }
  const base = `${window.location.origin}${window.location.pathname}`;
  const hash = draftId ? `#/pos/${draftId}` : '#/pos';
  return `${base}${hash}`;
}

export function openPosApp(draftId) {
  const url = getPosAppUrl(draftId);
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function isPosPathname(pathname = '') {
  return pathname === '/pos' || pathname.startsWith('/pos/');
}
