import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import authStore from '../stores/authStore';
import msg from './alerts';
import { getServerBase } from './api';
import { getToken } from './tokenStorage';

let echoInstance = null;

function reverbEnabled() {
  const enabled = import.meta.env.VITE_REVERB_ENABLED;
  return enabled === true || enabled === 'true' || enabled === '1';
}

function resolveWarehouseId(user) {
  const id = user?.warehouse_id ?? user?.warehouseId;
  if (id != null && id !== '') return Number(id);
  return null;
}

export function startAdminStockRealtime() {
  if (!reverbEnabled()) return null;
  if (echoInstance) return echoInstance;

  const key = import.meta.env.VITE_REVERB_APP_KEY;
  const host = import.meta.env.VITE_REVERB_HOST || '127.0.0.1';
  const port = Number(import.meta.env.VITE_REVERB_PORT || 8080);
  const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
  const user = authStore.getUser();
  const warehouseId = resolveWarehouseId(user);

  if (!key || !warehouseId) return null;

  window.Pusher = Pusher;

  const appRoot = getServerBase();
  echoInstance = new Echo({
    broadcaster: 'reverb',
    key,
    wsHost: host,
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${appRoot}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${getToken() || ''}`,
        Accept: 'application/json',
      },
    },
  });

  echoInstance
    .private(`admin.warehouse.${warehouseId}`)
    .listen('.pos.stock.updated', (payload) => {
      const reason = payload?.reason || 'stock';
      const reference = payload?.reference ? ` (${payload.reference})` : '';
      msg.info(`Stock updated: ${reason}${reference}. POS terminals notified.`);
    });

  return echoInstance;
}

export function stopAdminStockRealtime() {
  if (!echoInstance) return;
  try {
    echoInstance.disconnect();
  } catch (_) {
    /* ignore */
  }
  echoInstance = null;
}
