import { customAlphabet } from 'nanoid';
import api from './api';

const numeric8 = customAlphabet('0123456789', 8);
const numeric16 = customAlphabet('0123456789', 16);
const alphanum10 = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  10
);

/** Presets matching backend Keygen usage. */
export const CODE_PRESETS = {
  product: {
    table: 'products',
    column: 'code',
    generate: () => numeric8(),
  },
  expense_category: {
    table: 'expense_categories',
    column: 'code',
    generate: () => numeric8(),
  },
  income_category: {
    table: 'income_categories',
    column: 'code',
    generate: () => numeric8(),
  },
  coupon: {
    table: 'coupons',
    column: 'code',
    generate: () => alphanum10(),
  },
  gift_card: {
    table: 'gift_cards',
    column: 'card_no',
    generate: () => numeric16(),
  },
};

/**
 * Check whether a code already exists in the given table.
 * @returns {Promise<boolean>} true when the value is already taken
 */
export async function codeExists(table, value, exceptId = null) {
  if (!value?.trim()) return false;

  const params = { table, value: value.trim() };
  if (exceptId != null) params.except_id = exceptId;

  const res = await api.get('codes/check', { params });
  const data = res?.data ?? res;
  return Boolean(data?.exists);
}

/**
 * Generate a code locally and verify uniqueness against the database.
 */
export async function generateUniqueCode(presetKey, { exceptId = null, maxAttempts = 12 } = {}) {
  const preset = CODE_PRESETS[presetKey];
  if (!preset) {
    throw new Error(`Unknown code preset: ${presetKey}`);
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = preset.generate();
    const taken = await codeExists(preset.table, code, exceptId);
    if (!taken) return code;
  }

  throw new Error('Could not generate a unique code. Please try again.');
}

/**
 * Validate a code before save; throws when already taken.
 */
export async function assertCodeAvailable(presetKey, value, exceptId = null) {
  const preset = CODE_PRESETS[presetKey];
  if (!preset) {
    throw new Error(`Unknown code preset: ${presetKey}`);
  }

  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    throw new Error(`${preset.column} is required.`);
  }

  const taken = await codeExists(preset.table, trimmed, exceptId);
  if (taken) {
    const label = preset.column === 'card_no' ? 'Card number' : 'Code';
    throw new Error(`${label} "${trimmed}" is already in use.`);
  }

  return trimmed;
}
