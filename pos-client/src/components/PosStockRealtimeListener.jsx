import { useEffect } from 'react';
import { startAdminStockRealtime, stopAdminStockRealtime } from '../services/realtime';
import { hasToken } from '../services/tokenStorage';

export default function PosStockRealtimeListener() {
  useEffect(() => {
    if (!hasToken()) return undefined;
    startAdminStockRealtime();
    return () => stopAdminStockRealtime();
  }, []);

  return null;
}
