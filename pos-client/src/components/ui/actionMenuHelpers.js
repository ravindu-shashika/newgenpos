import {
  faBan,
  faBarcode,
  faCheck,
  faCopy,
  faDownload,
  faEye,
  faFileInvoice,
  faHistory,
  faKey,
  faMoneyBillWave,
  faPenToSquare,
  faPlus,
  faPrint,
  faRotateLeft,
  faTrash,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';

/** Explicit action keys → Font Awesome icon. */
export const ACTION_ICONS = {
  edit: faPenToSquare,
  delete: faTrash,
  view: faEye,
  duplicate: faCopy,
  copy: faCopy,
  payment: faMoneyBillWave,
  'add-payment': faPlus,
  print: faPrint,
  approve: faCheck,
  history: faHistory,
  barcode: faBarcode,
  import: faUpload,
  export: faDownload,
  invoice: faFileInvoice,
  restore: faRotateLeft,
  cancel: faBan,
  credentials: faKey,
};

const LABEL_ICON_RULES = [
  { test: /delete/i, icon: faTrash },
  { test: /edit/i, icon: faPenToSquare },
  { test: /add payment/i, icon: faPlus },
  { test: /view payment|payment/i, icon: faMoneyBillWave },
  { test: /duplicate|copy/i, icon: faCopy },
  { test: /print barcode|print/i, icon: faPrint },
  { test: /approve/i, icon: faCheck },
  { test: /product history|history|activity log/i, icon: faHistory },
  { test: /barcode/i, icon: faBarcode },
  { test: /import/i, icon: faUpload },
  { test: /export|download/i, icon: faDownload },
  { test: /invoice|receipt|challan/i, icon: faFileInvoice },
  { test: /restore|return|undo/i, icon: faRotateLeft },
  { test: /cancel|reject|deny|deactivate/i, icon: faBan },
  { test: /credential|password|token|regenerate/i, icon: faKey },
  { test: /^view\b|\bview\b/i, icon: faEye },
];

const EMOJI_PREFIX =
  /^(?:[\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[\u2600-\u26FF])+\s*/u;

/** Strip legacy emoji prefixes from action labels (✎ Edit → Edit). */
export function cleanActionLabel(label) {
  if (typeof label !== 'string') return '';
  return label.replace(EMOJI_PREFIX, '').replace(/^[✎🗑👁📋💰➕🖨✓✔⋮▾]\s*/, '').trim();
}

/** Resolve Font Awesome icon for an ActionMenu item. */
export function resolveActionIcon(item) {
  if (!item || item.divider) return null;
  if (item.icon) return item.icon;
  if (item.action && ACTION_ICONS[item.action]) {
    return ACTION_ICONS[item.action];
  }
  const text = cleanActionLabel(item.label || '');
  for (const rule of LABEL_ICON_RULES) {
    if (rule.test.test(text)) return rule.icon;
  }
  return null;
}

/**
 * Build a standard action menu item.
 * @example actionItem('edit', 'Edit', { onClick: () => openEdit(row) })
 */
export function actionItem(action, label, options = {}) {
  return {
    action,
    label: label || action,
    icon: ACTION_ICONS[action] ?? null,
    ...options,
  };
}
