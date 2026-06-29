import React, { useMemo } from 'react';

/**
 * FormField — a labelled input / select / textarea / file / checkbox.
 *
 * <FormField label="Name" required error={errors.name}>
 *   <input className="ui-input" ... />
 * </FormField>
 *
 * FormRow — a grid wrapper.
 * FormSection — a section divider inside a form grid.
 */
export function FormField({ label, required, error, children, span2 }) {
  return (
    <div className={`ui-field${span2 ? ' span2' : ''}`}>
      {label && (
        <label className="ui-label">
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {error && <span className="ui-field-error">{error}</span>}
    </div>
  );
}

export function FormRow({ children, cols = 2 }) {
  const gridClass =
    cols === 1 ? ' full'
    : cols === 2 ? ' two'
    : cols === 3 ? ' three'
    : cols === 4 ? ' four'
    : '';
  return (
    <div className={`ui-form-grid${gridClass}`}>
      {children}
    </div>
  );
}

export function FormSection({ label, title, children }) {
  const heading = label || title;
  return (
    <div className="ui-section">
      {heading && <div className="ui-section-divider">{heading}</div>}
      {children}
    </div>
  );
}

/** Convenience wrappers for the most common inputs */

export function TextInput({
  value,
  onChange,
  name,
  placeholder,
  required,
  autoComplete,
  type = "text",
  onKeyDown,
  inputRef,
}) {
  return (
    <input
      ref={inputRef}
      type={type}
      className="ui-input"
      name={name}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      required={required}
      autoComplete={autoComplete}
    />
  );
}

export function NumberInput({ value, onChange, name, step = 'any', min, placeholder, required, disabled }) {
  return (
    <input
      type="number"
      className="ui-input"
      name={name}
      value={value}
      onChange={onChange}
      step={step}
      min={min}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  );
}

export function SelectInput({ value, onChange, name, children, options, required, placeholder }) {
  const normalizedOptions = useMemo(() => {
    if (!options?.length) return options;
    const seen = new Set();
    return options.filter((o) => {
      const key = String(o.value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [options]);

  return (
    <select className="ui-select-field" name={name} value={value} onChange={onChange} required={required}>
      {placeholder && <option value="">{placeholder}</option>}
      {normalizedOptions ? normalizedOptions.map((o, i) => (
        <option key={o.key ?? `${String(o.value)}-${i}`} value={o.value}>{o.label}</option>
      )) : children}
    </select>
  );
}

export function TextareaInput({ value, onChange, name, rows = 3, required, placeholder }) {
  return (
    <textarea
      className="ui-textarea"
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      required={required}
      placeholder={placeholder}
    />
  );
}

export function FileInput({ name, onChange, accept, inputRef }) {
  return (
    <input
      type="file"
      className="ui-input"
      name={name}
      onChange={onChange}
      accept={accept}
      ref={inputRef}
      style={{ cursor: 'pointer', padding: '5px 11px' }}
    />
  );
}

export function CheckboxInput({ label, name, checked, onChange, disabled }) {
  return (
    <label className="ui-checkbox-row">
      <input type="checkbox" name={name} checked={checked} onChange={onChange} disabled={disabled} />
      {label}
    </label>
  );
}
