import React, { useMemo } from 'react';
import { cn } from '../../lib/cn';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import Select from 'react-select';

export const inputClass = 'ui-input w-full';
export const selectClass = 'ui-select-field w-full';
export const textareaClass = 'ui-textarea w-full';

function optionLabel(children) {
  if (children == null) return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  return React.Children.toArray(children)
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
    .join('')
    .trim();
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  span2,
  spanFull,
  className,
}) {
  return (
    <div
      className={cn(
        'ui-field flex flex-column gap-1',
        spanFull && 'col-span-full',
        span2 && 'col-span-2',
        className,
      )}
    >
      {label && (
        <label className="ui-label font-medium text-sm">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && <small className="ui-field-error text-red-500">{error}</small>}
      {hint && !error && <small className="text-color-secondary">{hint}</small>}
    </div>
  );
}

export function FormRow({ children, cols = 2, className }) {
  const colsClass =
    cols === 1 ? 'full'
    : cols === 2 ? 'two'
    : cols === 3 ? 'three'
    : cols === 4 ? 'four'
    : '';

  return (
    <div className={cn('ui-form-grid', colsClass, className)}>
      {children}
    </div>
  );
}

export function FormSection({ label, title, children, className }) {
  const heading = label || title;
  return (
    <div className={cn('ui-section p-panel p-component', className)}>
      {heading && <div className="ui-section-divider p-panel-header">{heading}</div>}
      <div className="p-panel-content p-4">{children}</div>
    </div>
  );
}

export function FormHint({ children, className }) {
  return <p className={cn('ui-form-hint text-sm text-color-secondary m-0 mb-3', className)}>{children}</p>;
}

export function FormSubheading({ children, className }) {
  return <div className={cn('ui-form-subheading font-semibold mb-3 pb-2 border-bottom-1 surface-border', className)}>{children}</div>;
}

export function FormShell({ children, className, ...props }) {
  return (
    <form className={cn('ui-form-shell flex flex-column gap-4', className)} {...props}>
      {children}
    </form>
  );
}

export function FormActions({ children, className, align = 'end' }) {
  return (
    <div
      className={cn(
        'ui-form-footer flex flex-wrap gap-2 pt-3 border-top-1 surface-border',
        align === 'start' && 'justify-content-start',
        align === 'between' && 'justify-content-between',
        align === 'end' && 'justify-content-end',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function InlineField({ children, action, className }) {
  return (
    <div className={cn('ui-inline-field flex align-items-center gap-2', className)}>
      <div className="ui-inline-field-main flex-1 min-w-0">{children}</div>
      {action && <div className="ui-inline-field-action flex-shrink-0">{action}</div>}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  name,
  placeholder,
  required,
  autoComplete,
  type = 'text',
  onKeyDown,
  inputRef,
  readOnly,
  disabled,
  className,
  error,
}) {
  return (
    <InputText
      ref={inputRef}
      type={type}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      required={required}
      autoComplete={autoComplete}
      readOnly={readOnly}
      disabled={disabled}
      className={cn(inputClass, error && 'p-invalid', className)}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  onBlur,
  name,
  step = 'any',
  min,
  max,
  placeholder,
  required,
  disabled,
  readOnly,
  className,
  error,
  title,
}) {
  const parsed = value === '' || value == null ? null : Number(value);
  const input = (
    <InputNumber
      inputId={name}
      name={name}
      value={Number.isNaN(parsed) ? null : parsed}
      onValueChange={(e) => {
        onChange?.({
          target: {
            name,
            value: e.value ?? '',
          },
        });
      }}
      onBlur={onBlur}
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      className={cn('w-full', error && 'p-invalid', className)}
      inputClassName={inputClass}
      useGrouping={false}
    />
  );

  if (!title) return input;
  return (
    <span className="w-full d-block" title={title}>
      {input}
    </span>
  );
}

export function SelectInput({
  value,
  onChange,
  name,
  children,
  options,
  required,
  placeholder,
  disabled,
  className,
  error,
  isSearchable = true,
}) {
  const normalizedOptions = useMemo(() => {
    const dedupe = (list) => {
      const seen = new Set();
      return list.filter((o) => {
        const key = String(o.value ?? '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    if (options?.length) {
      return dedupe(
        options.map((o) => ({
          label: o.label,
          value: o.value == null ? '' : o.value,
        })),
      );
    }

    const fromChildren = [];
    React.Children.forEach(children, (child) => {
      if (!child?.props) return;
      fromChildren.push({
        label: optionLabel(child.props.children),
        value: child.props.value == null ? '' : child.props.value,
      });
    });
    return dedupe(fromChildren);
  }, [options, children]);

  const selected = useMemo(() => {
    if (value == null || value === '') {
      // Prefer empty-value placeholder option when present (e.g. "Select brand…")
      return normalizedOptions.find((o) => String(o.value) === '') || null;
    }
    return normalizedOptions.find((o) => String(o.value) === String(value)) || null;
  }, [normalizedOptions, value]);

  const selectStyles = useMemo(() => ({
    control: (base, state) => ({
      ...base,
      minHeight: 42,
      borderRadius: 6,
      borderColor: error ? '#f87171' : state.isFocused ? 'var(--color-ui-accent, #2563eb)' : '#94a3b8',
      boxShadow: state.isFocused
        ? error
          ? '0 0 0 3px rgba(220,38,38,0.12)'
          : '0 0 0 3px rgba(37,99,235,0.15)'
        : '0 1px 2px rgba(15,23,42,0.04)',
      backgroundColor: disabled ? '#f8fafc' : '#fff',
      '&:hover': {
        borderColor: error ? '#f87171' : '#64748b',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '2px 10px',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#94a3b8',
      fontSize: '0.875rem',
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: '0.875rem',
      color: '#0f172a',
    }),
    input: (base) => ({
      ...base,
      fontSize: '0.875rem',
      margin: 0,
      padding: 0,
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({
      ...base,
      color: '#64748b',
      padding: '6px 10px',
    }),
    clearIndicator: (base) => ({
      ...base,
      padding: '6px 4px',
    }),
    menu: (base) => ({
      ...base,
      zIndex: 40,
      borderRadius: 8,
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 10050,
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.875rem',
      backgroundColor: state.isSelected
        ? 'var(--color-ui-accent, #2563eb)'
        : state.isFocused
          ? '#eff6ff'
          : '#fff',
      color: state.isSelected ? '#fff' : '#0f172a',
      cursor: 'pointer',
    }),
  }), [disabled, error]);

  return (
    <Select
      inputId={name ? `select-${name}` : undefined}
      name={name}
      value={selected}
      options={normalizedOptions}
      onChange={(opt) => onChange?.({ target: { name, value: opt?.value ?? '' } })}
      placeholder={placeholder || 'Select…'}
      isDisabled={disabled}
      isClearable={!required}
      isSearchable={isSearchable}
      className={cn('ui-react-select w-full', error && 'ui-react-select--error', className)}
      classNamePrefix="ui-react-select"
      styles={selectStyles}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      menuPosition="fixed"
      filterOption={(option, rawInput) => {
        const q = String(rawInput || '').trim().toLowerCase();
        if (!q) return true;
        return String(option.label || '').toLowerCase().includes(q)
          || String(option.value ?? '').toLowerCase().includes(q);
      }}
    />
  );
}

export function TextareaInput({
  value,
  onChange,
  name,
  rows = 3,
  required,
  placeholder,
  disabled,
  className,
  error,
}) {
  return (
    <InputTextarea
      name={name}
      value={value ?? ''}
      onChange={onChange}
      rows={rows}
      required={required}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(textareaClass, error && 'p-invalid', className)}
      autoResize
    />
  );
}

export function FileInput({ name, onChange, accept, inputRef, className, disabled }) {
  return (
    <input
      ref={inputRef}
      type="file"
      className={cn(inputClass, className)}
      name={name}
      accept={accept}
      disabled={disabled}
      onChange={onChange}
    />
  );
}

export function CheckboxInput({ label, name, checked, onChange, disabled, className }) {
  return (
    <div className={cn('ui-checkbox-row flex align-items-center gap-2', className)}>
      <Checkbox
        inputId={name}
        name={name}
        checked={Boolean(checked)}
        onChange={(e) => onChange?.({ target: { name, checked: e.checked, type: 'checkbox' } })}
        disabled={disabled}
        className="shrink-0"
      />
      {label && (
        <label htmlFor={name} className="cursor-pointer mb-0 leading-snug">
          {label}
        </label>
      )}
    </div>
  );
}
