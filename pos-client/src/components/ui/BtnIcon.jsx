import React from 'react';
import SafeFontAwesomeIcon from '../SafeFontAwesomeIcon';

/**
 * Icon slot for ui-btn / Bootstrap .btn — keeps spacing and alignment consistent.
 *
 * <button className="ui-btn primary">
 *   <BtnIcon icon={faPlus} /> Add item
 * </button>
 */
export function BtnIcon({ icon, spin = false, className = '' }) {
  if (!icon) return null;
  return (
    <SafeFontAwesomeIcon
      icon={icon}
      spin={spin}
      fixedWidth
      className={`ui-btn-icon${className ? ` ${className}` : ''}`}
    />
  );
}
