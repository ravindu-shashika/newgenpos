import CookieService from './cookie';

const basePath =
    import.meta.env.VITE_APP_DEFAULT_PATH ||
    import.meta.env.VITE_API_URL ||
    'http://127.0.0.1:8000';

/**
 * Build Laravel webview/auth URL that logs in via Sanctum token and redirects to POS.
 * Legacy UI: pos-api/resources/views/backend/sale/pos.blade.php (SaleController::posSale).
 */
export function getPosLegacyUrl(draftId) {
    const token = CookieService.get('access_token');
    if (!token) return null;

    const posPath = draftId ? `/pos/${draftId}` : '/pos';
    const q = new URLSearchParams({
        token,
        redirect: posPath,
    });

    return `${basePath}/webview/auth?${q.toString()}`;
}

/** Open legacy POS in a new browser tab. Returns false when token is missing. */
export function openPosLegacy(draftId) {
    const url = getPosLegacyUrl(draftId);
    if (!url) return false;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
}

export { basePath as posLegacyBasePath };
