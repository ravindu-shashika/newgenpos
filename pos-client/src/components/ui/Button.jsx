import React from 'react';
import { Button as PrimeButton } from 'primereact/button';
import { primeButtonProps } from './primeUtils';

/**
 * Button — PrimeReact wrapper (legacy ui-btn class names still supported in views).
 */
export function Button({
  children,
  variant = 'secondary',
  size,
  icon,
  iconPos = 'left',
  iconOnly = false,
  className,
  type = 'button',
  loading = false,
  disabled,
  onClick,
  ...props
}) {
  const primeProps = primeButtonProps(variant);
  const legacyClass = [
    'ui-btn',
    variant,
    size === 'sm' ? 'sm' : '',
    size === 'lg' ? 'lg' : '',
    iconOnly ? 'icon-only' : '',
    className,
  ].filter(Boolean).join(' ');

  const label = typeof children === 'string' ? children : undefined;

  return (
    <PrimeButton
      type={type}
      label={label}
      icon={icon}
      iconPos={iconPos}
      className={legacyClass}
      size={size === 'sm' ? 'small' : size === 'lg' ? 'large' : undefined}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      {...primeProps}
      {...props}
    >
      {typeof children !== 'string' ? children : undefined}
    </PrimeButton>
  );
}
