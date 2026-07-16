import React from 'react';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { InputText } from 'primereact/inputtext';

/** Modern search field for list page toolbars. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
  ...props
}) {
  return (
    <IconField iconPosition="left" className={`ui-search-field ${className}`.trim()}>
      <InputIcon className="pi pi-search ui-search-icon" />
      <InputText
        type="search"
        className="ui-search-input w-full"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </IconField>
  );
}
