import {
  faCheck,
  faSave,
  faTimes,
  faTrash,
  faPlus,
  faUpload,
  faDownload,
} from '@fortawesome/free-solid-svg-icons';

/** Map shared Button variants to PrimeReact Button props. */
export function primeButtonProps(variant = 'secondary') {
  switch (variant) {
    case 'primary':
      return {};
    case 'success':
      return { severity: 'success' };
    case 'danger':
      return { severity: 'danger' };
    case 'warning':
      return { severity: 'warning' };
    case 'info':
      return { severity: 'info' };
    case 'secondary':
      return { severity: 'secondary' };
    case 'ghost':
      return { severity: 'secondary', outlined: true };
    case 'outline':
    case 'outline-primary':
      return { outlined: true };
    case 'link':
      return { link: true };
    default:
      return { severity: 'secondary' };
  }
}

export function primeSortOrder(sortDir) {
  if (sortDir === 'asc') return 1;
  if (sortDir === 'desc') return -1;
  return 0;
}

const FA_TO_PI = {
  [faTimes]: 'pi pi-times',
  [faCheck]: 'pi pi-check',
  [faSave]: 'pi pi-save',
  [faTrash]: 'pi pi-trash',
  [faPlus]: 'pi pi-plus',
  [faUpload]: 'pi pi-upload',
  [faDownload]: 'pi pi-download',
};

export function resolvePrimeIcon(icon, fallback = 'pi pi-check') {
  if (typeof icon === 'string') return icon;
  return FA_TO_PI[icon] ?? fallback;
}
