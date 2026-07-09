/**
 * Spatie wildcard permission matching for the React SPA.
 * Generic "base.*" grants base, base-action, and base.action.
 */

export const WILDCARD_TOKEN = '*';
export const PART_DELIMITER = '.';
export const SUBPART_DELIMITER = ',';
export const DOT_WILDCARD_SUFFIX = '.*';

/** Modules that use a single permission instead of controller-action pairs. */
export const MODULE_SINGLE_PERMISSION = {
  role: 'role_permission',
  smstemplates: 'role_permission',
  tables: 'role_permission',
  printers: 'role_permission',
  // Settings modules use one Spatie permission for view + save (legacy Blade @can).
  pos_setting: 'pos_setting',
  'pos-settings': 'pos_setting',
  hrm_setting: 'hrm_setting',
  'hrm-settings': 'hrm_setting',
  reward_point_setting: 'reward_point_setting',
  'reward-point-settings': 'reward_point_setting',
  sms_setting: 'sms_setting',
  'sms-settings': 'sms_setting',
  general_setting: 'general_setting',
  'general-settings': 'general_setting',
};

/**
 * Menu / route controller slug → Spatie permission prefix (menus.txt vs permissions.txt).
 * When they differ, list pages and forms resolve add/edit/delete against these bases.
 */
export const CONTROLLER_PERMISSION_BASE = {
  categories: 'category',
  category: 'category',
  adjustments: 'adjustment',
  adjustment: 'adjustment',
  qty_adjustment: 'adjustment',
  'stock-counts': 'stock_count',
  stock_count: 'stock_count',
  stock_counts: 'stock-counts',
  quotations: 'quotes',
  quotes: 'quotations',
  'purchase-returns': 'purchase-return',
  'return-purchase': 'purchase-return',
  'return-sale': 'returns',
  returns: 'returns',
  'packing-slips': 'packing_slip_challan',
  packing_slip: 'packing_slip_challan',
  challans: 'packing_slip_challan',
  challan: 'packing_slip_challan',
  'money-transfers': 'money-transfer',
  'balance-sheets': 'balance-sheet',
  'account-statements': 'account-statement',
  accounts: 'account',
  income_categories: 'income-categories',
  expense_categories: 'expense-categories',
  'customer-groups': 'customer_group',
  customer_groups: 'customer_group',
  warehouses: 'warehouse',
  warehouse: 'warehouse',
  'leave-types': 'leave-type',
  leave_types: 'leave-type',
  payrolls: 'payroll',
  departments: 'department',
  holidays: 'holiday',
  'role-permissions': 'role_permission',
  'sms-templates': 'create_sms',
  'custom-fields': 'custom_field',
  'discount-plans': 'discount_plan',
  discounts: 'discount',
  'general-settings': 'general_setting',
  'pos-settings': 'pos_setting',
  'hrm-settings': 'hrm_setting',
  'sms-settings': 'sms_setting',
  'barcode-settings': 'barcode_setting',
  languages: 'language_setting',
  'invoice-settings': 'invoice_setting',
  'reward-point-settings': 'reward_point_setting',
  'payment-gateways': 'payment_gateway_setting',
  'backup-database': 'backup_database',
  couriers: 'courier',
  courier: 'courier',
  'gift-cards': 'gift_card',
  gift_card: 'gift_card',
  coupons: 'coupon',
  coupon: 'coupon',
  brands: 'brand',
  brand: 'brand',
  units: 'unit',
  unit: 'unit',
  taxes: 'tax',
  tax: 'tax',
  currencies: 'currency',
  currency: 'currency',
  pos: 'sales',
  'installment-plans': 'sales',
  printers: 'role_permission',
  tables: 'role_permission',
  'damage-stock': 'damage-stock',
  exchange: 'exchange',
  delivery: 'delivery',
  notifications: 'all_notification',
  'activity-logs': 'reports',
};

/** All permission name prefixes to check for a menu/route controller. */
export function permissionBasesForController(controller) {
  if (!controller) return [];
  const c = String(controller).toLowerCase();
  const bases = new Set([c]);
  const hyphen = c.replace(/_/g, '-');
  const underscore = c.replace(/-/g, '_');
  bases.add(hyphen);
  bases.add(underscore);
  for (const key of [c, hyphen, underscore]) {
    const mapped = CONTROLLER_PERMISSION_BASE[key];
    if (mapped) bases.add(mapped);
  }
  return [...bases];
}

export function isDotWildcard(permission) {
  return typeof permission === 'string' && permission.endsWith(DOT_WILDCARD_SUFFIX);
}

export function dotWildcardBase(permission) {
  if (!isDotWildcard(permission)) return null;
  return permission.slice(0, -DOT_WILDCARD_SUFFIX.length);
}

function permissionBase(name) {
  const dash = name.indexOf('-');
  if (dash > 0) return name.slice(0, dash);
  const dot = name.indexOf('.');
  if (dot > 0) return name.slice(0, dot);
  return name;
}

/**
 * Generic ".*" check: granted "base.*" covers required permission.
 * Examples:
 *   role_permission.* → role_permission, role_permission.view
 *   products.* → products, products-add, products.index
 */
export function dotWildcardCovers(granted, required) {
  const base = dotWildcardBase(granted);
  if (!base || !required) return false;
  if (required === base) return true;
  if (required.startsWith(`${base}-`)) return true;
  if (required.startsWith(`${base}.`)) return true;
  return permissionBase(required) === base;
}

/** User holds an explicit "base.*" wildcard. */
export function userHoldsDotWildcard(permissions, baseName) {
  if (!Array.isArray(permissions) || !baseName) return false;
  return permissions.some((p) => isDotWildcard(p) && dotWildcardBase(p) === baseName);
}

function buildIndex(index, parts, permission) {
  if (parts.length === 0) {
    index[''] = true;
    return index;
  }

  const part = parts.shift();
  if (!part) {
    throw new Error(`Invalid wildcard permission: ${permission}`);
  }

  if (!part.includes(SUBPART_DELIMITER)) {
    index[part] = buildIndex(index[part] ?? {}, [...parts], permission);
  }

  for (const subPart of part.split(SUBPART_DELIMITER)) {
    if (!subPart) {
      throw new Error(`Invalid wildcard permission: ${permission}`);
    }
    index[subPart] = buildIndex(index[subPart] ?? {}, [...parts], permission);
  }

  return index;
}

function checkIndex(permissionParts, index) {
  if (index[''] === true) return true;
  if (permissionParts.length === 0) return false;

  const first = permissionParts.shift();

  if (index[first] && checkIndex([...permissionParts], index[first])) {
    return true;
  }

  if (index[WILDCARD_TOKEN] && checkIndex([...permissionParts], index[WILDCARD_TOKEN])) {
    return true;
  }

  return false;
}

export function buildWildcardIndex(permissions) {
  const index = {};
  for (const permission of permissions) {
    if (!permission || typeof permission !== 'string') continue;
    if (!permission.includes(PART_DELIMITER) && !permission.includes(SUBPART_DELIMITER)) {
      continue;
    }
    buildIndex(index, permission.split(PART_DELIMITER), permission);
  }
  return index;
}

export function spatieImplies(index, requiredPermission) {
  if (!requiredPermission) return false;
  return checkIndex(requiredPermission.split(PART_DELIMITER), index);
}

/** Hyphen wildcard: products-* matches products-add. */
export function hyphenWildcardMatch(granted, required) {
  if (granted === WILDCARD_TOKEN) return true;
  if (granted === required) return true;
  if (granted.endsWith('-*')) {
    const prefix = granted.slice(0, -1);
    return required.startsWith(prefix);
  }
  return false;
}

/** Controller holds a wildcard: products.*, products-*, mapped base.*, or role_permission.*. */
export function controllerWildcardHeld(permissions, controller) {
  if (!Array.isArray(permissions) || !controller) return false;

  for (const base of permissionBasesForController(controller)) {
    if (permissions.some((p) => p === WILDCARD_TOKEN || p === `${base}.*` || p === `${base}-*`)) {
      return true;
    }
    if (userHoldsDotWildcard(permissions, base)) return true;

    const single = MODULE_SINGLE_PERMISSION[base];
    if (single && userHoldsDotWildcard(permissions, single)) return true;
  }

  return false;
}

/**
 * True when any granted permission implies the required permission.
 * @param {string[]} grantedList
 * @param {string} required
 */
export function permissionImplies(grantedList, required) {
  if (!required || !Array.isArray(grantedList)) return false;
  if (grantedList.includes(required)) return true;

  const dotIndex = buildWildcardIndex(grantedList);

  if (spatieImplies(dotIndex, required)) return true;

  const asDots = required.replace(/-/g, '.');
  if (asDots !== required && spatieImplies(dotIndex, asDots)) return true;

  for (const granted of grantedList) {
    if (!granted) continue;
    if (hyphenWildcardMatch(granted, required)) return true;
    if (dotWildcardCovers(granted, required)) return true;
  }

  return false;
}

export function hasAnyPermission(grantedList, ...required) {
  return required.flat().some((name) => permissionImplies(grantedList, name));
}

/**
 * Menu visibility: user may see a controller module when they hold .view, .index (list), or .* / -*.
 * Single-permission modules (brand, unit, …) match the exact permission name.
 */
export function canViewController(grantedList, controller) {
  if (!controller || !Array.isArray(grantedList)) return false;
  if (controller === 'dashboard') return true;

  if (controllerWildcardHeld(grantedList, controller)) return true;

  for (const base of permissionBasesForController(controller)) {
    const single = MODULE_SINGLE_PERMISSION[base];
    if (single) {
      if (permissionImplies(grantedList, single) || permissionImplies(grantedList, `${single}.*`)) {
        return true;
      }
    }

    for (const c of [base, base.replace(/_/g, '-'), base.replace(/-/g, '_')]) {
      const viewChecks = [
        `${c}.view`,
        `${c}-view`,
        `${c}.index`,
        `${c}-index`,
        `${c}.*`,
        `${c}-*`,
      ];
      for (const required of viewChecks) {
        if (permissionImplies(grantedList, required)) return true;
      }
      if (permissionImplies(grantedList, c)) return true;
    }
  }

  return false;
}

/** Controller/module access — any action or wildcard under the controller. */
export function hasControllerAccess(grantedList, controller) {
  if (!controller || !Array.isArray(grantedList)) return false;

  if (controllerWildcardHeld(grantedList, controller)) return true;

  for (const base of permissionBasesForController(controller)) {
    const single = MODULE_SINGLE_PERMISSION[base];
    if (single && permissionImplies(grantedList, single)) return true;

    for (const variant of [base, base.replace(/_/g, '-'), base.replace(/-/g, '_')]) {
      if (permissionImplies(grantedList, variant)) return true;

      for (const granted of grantedList) {
        if (granted.startsWith(`${variant}-`) || granted.startsWith(`${variant}.`)) {
          return true;
        }
        if (dotWildcardCovers(granted, `${variant}-index`)) return true;
        if (hyphenWildcardMatch(granted, `${variant}-index`)) return true;
      }
    }
  }

  return false;
}
