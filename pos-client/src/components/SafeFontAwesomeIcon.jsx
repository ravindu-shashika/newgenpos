import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Wraps FontAwesomeIcon and guards against undefined/invalid icon.
 * Also ensures className is always a string (FontAwesomeIcon calls className.split(' ')
 * internally, which throws when className is undefined).
 */
export default function SafeFontAwesomeIcon({ icon, className, ...rest }) {
  if (icon == null || typeof icon !== 'object') {
    return null;
  }
  if (icon.prefix == null || icon.iconName == null || typeof icon.iconName !== 'string') {
    return null;
  }
  return <FontAwesomeIcon icon={icon} className={className ?? ''} {...rest} />;
}
