/**
 * Sidebar menu icons via Font Awesome (SVG) — reliable in Vite/React.
 * Label mappings mirror legacy sidebar.blade.php dripicons sections.
 */

import {
  faGauge,
  faList,
  faCreditCard,
  faCartShopping,
  faFileLines,
  faRightLeft,
  faWallet,
  faRocket,
  faCalendarDays,
  faUsers,
  faBriefcase,
  faUserGroup,
  faComment,
  faChartPie,
  faGear,
  faPlus,
  faListUl,
  faUpload,
  faRotateLeft,
  faBarcode,
  faClipboardList,
  faSliders,
  faTriangleExclamation,
  faFolder,
  faTag,
  faBalanceScale,
  faTicket,
  faGift,
  faTruck,
  faBox,
  faFileInvoice,
  faUser,
  faHeadset,
  faBuilding,
  faArrowRightArrowLeft,
  faChartBar,
  faFilePen,
  faSitemap,
  faClipboardCheck,
  faFlag,
  faMoneyBillWave,
  faWarehouse,
  faPercent,
  faCoins,
  faLock,
  faPrint,
  faBell,
  faCloudArrowDown,
  faCopy,
  faDesktop,
  faClockRotateLeft,
  faTable,
  faChevronRight,
  faStore,
  faHouse,
} from '@fortawesome/free-solid-svg-icons';
import { SIDEBAR_MENU } from '../config/sidebarMenuConfig';

/** @type {Map<string, import('@fortawesome/fontawesome-svg-core').IconDefinition>} */
const byLabel = new Map();
/** @type {Map<string, import('@fortawesome/fontawesome-svg-core').IconDefinition>} */
const byController = new Map();
/** @type {Map<string, import('@fortawesome/fontawesome-svg-core').IconDefinition>} */
const byMainLabel = new Map();

const SECTION_FA = {
  dashboard: faGauge,
  product: faList,
  purchase: faCreditCard,
  sale: faCartShopping,
  quotation: faFileLines,
  transfer: faRightLeft,
  expense: faWallet,
  income: faRocket,
  booking: faCalendarDays,
  people: faUsers,
  accounting: faBriefcase,
  hrm: faUserGroup,
  whatsapp: faComment,
  reports: faChartPie,
  settings: faGear,
};

for (const [key, icon] of Object.entries(SECTION_FA)) {
  byMainLabel.set(key, icon);
  byLabel.set(key, icon);
}

for (const section of SIDEBAR_MENU) {
  const mainKey = section.label.trim().toLowerCase();
  const mainIcon = SECTION_FA[mainKey] || faList;
  byMainLabel.set(mainKey, mainIcon);
  byLabel.set(mainKey, mainIcon);

  for (const child of section.children || []) {
    const childKey = child.label.trim().toLowerCase();
    if (child.controller) {
      byController.set(child.controller.trim().toLowerCase(), mainIcon);
    }
    byLabel.set(childKey, mainIcon);
  }
}

const SUB_LABEL_PATTERNS = [
  [/\bpos\b/i, faStore],
  [/\b(add|create)\b/i, faPlus],
  [/\blist\b/i, faListUl],
  [/\bimport\b/i, faUpload],
  [/\breturn\b/i, faRotateLeft],
  [/\bexchange\b/i, faArrowRightArrowLeft],
  [/\bbarcode\b/i, faBarcode],
  [/\bstock count\b/i, faClipboardList],
  [/\badjustment\b/i, faSliders],
  [/\bdamage\b/i, faTriangleExclamation],
  [/\bcategory\b/i, faFolder],
  [/\bbrand\b/i, faTag],
  [/\bunit\b/i, faBalanceScale],
  [/\bcoupon\b/i, faTicket],
  [/\bgift card\b/i, faGift],
  [/\bdelivery\b/i, faTruck],
  [/\bcourier\b/i, faTruck],
  [/\bpacking\b/i, faBox],
  [/\bchallan\b/i, faFileInvoice],
  [/\bcustomer\b/i, faUser],
  [/\bsupplier\b/i, faBuilding],
  [/\buser\b/i, faUser],
  [/\bagent\b/i, faHeadset],
  [/\bbiller\b/i, faUserGroup],
  [/\baccount\b/i, faBriefcase],
  [/\btransfer\b/i, faRightLeft],
  [/\bbalance\b/i, faChartBar],
  [/\bstatement\b/i, faFilePen],
  [/\bdepartment\b/i, faSitemap],
  [/\bemployee\b/i, faUser],
  [/\battendance\b/i, faClipboardCheck],
  [/\bholiday\b/i, faCalendarDays],
  [/\bleave\b/i, faFlag],
  [/\bpayroll\b/i, faMoneyBillWave],
  [/\breport\b/i, faChartPie],
  [/\bprofit\b/i, faChartPie],
  [/\bwarehouse\b/i, faWarehouse],
  [/\btax\b/i, faPercent],
  [/\bcurrency\b/i, faCoins],
  [/\brole\b/i, faLock],
  [/\bprinter\b/i, faPrint],
  [/\bnotification\b/i, faBell],
  [/\bbackup\b/i, faCloudArrowDown],
  [/\bsetting\b/i, faGear],
  [/\bwhatsapp\b/i, faComment],
  [/\btemplate\b/i, faCopy],
  [/\bsms\b/i, faComment],
  [/\bdiscount\b/i, faTag],
  [/\bcash register\b/i, faDesktop],
  [/\bactivity\b/i, faClockRotateLeft],
  [/\bexpense\b/i, faWallet],
  [/\bincome\b/i, faRocket],
  [/\bbooking\b/i, faCalendarDays],
  [/\btable\b/i, faTable],
];

const DRIP_HINTS = {
  'dripicons-meter': faGauge,
  'dripicons-list': faList,
  'dripicons-card': faCreditCard,
  'dripicons-cart': faCartShopping,
  'dripicons-document': faFileLines,
  'dripicons-export': faRightLeft,
  'dripicons-wallet': faWallet,
  'dripicons-rocket': faRocket,
  'dripicons-calendar': faCalendarDays,
  'dripicons-user': faUsers,
  'dripicons-briefcase': faBriefcase,
  'dripicons-user-group': faUserGroup,
  'dripicons-message': faComment,
  'dripicons-document-remove': faChartPie,
  'dripicons-gear': faGear,
};

function matchSubLabelIcon(label) {
  if (!label) return null;
  for (const [pattern, icon] of SUB_LABEL_PATTERNS) {
    if (pattern.test(label)) return icon;
  }
  return null;
}

function iconFromStringHint(hint) {
  if (!hint || typeof hint !== 'string') return null;
  const trimmed = hint.trim().toLowerCase();
  if (DRIP_HINTS[trimmed]) return DRIP_HINTS[trimmed];
  if (trimmed.includes('dripicons-meter')) return faGauge;
  if (trimmed.includes('dripicons-list')) return faList;
  if (trimmed.includes('dripicons-cart')) return faCartShopping;
  if (trimmed.includes('dripicons-gear')) return faGear;
  if (trimmed.includes('pi-home')) return faHouse;
  if (trimmed.includes('pi-box')) return faList;
  if (trimmed.includes('pi-shopping-cart')) return faCartShopping;
  if (trimmed.includes('pi-cog')) return faGear;
  return null;
}

/**
 * @param {{ label?: string, icon?: string|null, controller?: string|null, parentLabel?: string|null }} opts
 * @returns {import('@fortawesome/fontawesome-svg-core').IconDefinition}
 */
export function resolveMenuIcon({ label, icon, controller, parentLabel } = {}) {
  if (icon && typeof icon === 'object' && icon.iconName) return icon;

  const fromHint = iconFromStringHint(typeof icon === 'string' ? icon : null);
  if (fromHint) return fromHint;

  const labelKey = label?.trim().toLowerCase();
  if (labelKey && byLabel.has(labelKey)) return byLabel.get(labelKey);

  const controllerKey = controller?.trim().toLowerCase();
  if (controllerKey && byController.has(controllerKey)) return byController.get(controllerKey);

  const subIcon = matchSubLabelIcon(label);
  if (subIcon) return subIcon;

  const parentKey = parentLabel?.trim().toLowerCase();
  if (parentKey && byMainLabel.has(parentKey)) return byMainLabel.get(parentKey);

  return faChevronRight;
}

export function isRenderableMenuIcon(icon) {
  return icon != null && typeof icon === 'object' && icon.iconName != null;
}
