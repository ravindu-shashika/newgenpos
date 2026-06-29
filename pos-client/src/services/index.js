export { default as msg } from './alerts';
export { default as api } from './api';
export { defaultPath, posApiPath, posApi, signOut, getServerBase, brandImageUrl } from './api';
export { default as routes, buildRoutesFromMenuItems, flattenMenuTreeToRoutes } from './routes';
export {
  buildMenuTree,
  buildSidebarMenuTree,
  augmentMenuTreeWithSidebar,
  hasPermission as hasMenuPermission,
  hasExactPermission,
} from './menuBuilder';
export {
  ROUTE_REGISTRY,
  MENU_PATH_ALIASES,
  EXTRA_SPA_ROUTES,
  normalizeMenuPath,
  resolveRouteComponent,
} from './routeRegistry';
export { default as auth } from './auth';
export { default as cookie } from './cookie';
export { getToken, setToken, clearToken, hasToken } from './tokenStorage';
export { getPosLegacyUrl, openPosLegacy, posLegacyBasePath } from './posLegacy';
export { getPosAppUrl, openPosApp, isPosPathname } from './posApp';
export { default as txt } from './txt';
export { default as print } from './print';
export { default as roundup } from './roundup';
export { default as cal } from './cal';
export {
  getRolePermissions,
  fetchMenuByRole,
} from './roleMenuApi';
export {
  CODE_PRESETS,
  codeExists,
  generateUniqueCode,
  assertCodeAvailable,
} from './codeGenerator';

// ─── Stores ───────────────────────────────────────────────────────────────────
export { default as generalSettingStore } from '../stores/generalSettingStore';
export { default as usePermissions, useGeneralSetting, resolvePermissions } from '../stores/usePermissions';
