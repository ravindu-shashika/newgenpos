import React from 'react';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { BtnIcon } from './BtnIcon';

export function SelectionBar({ count, onClear, label }) {
  if (!count) return null;
  return (
    <Message
      severity="info"
      className="ui-sel-bar mb-3 w-full justify-content-between"
      content={
        <div className="flex align-items-center justify-content-between gap-3 w-full">
          <span>
            {count} row{count !== 1 ? 's' : ''} selected
            {label ? ` — ${label}` : ''}
          </span>
          <Button
            type="button"
            size="small"
            severity="secondary"
            outlined
            icon={<BtnIcon icon={faTimes} />}
            label="Clear"
            onClick={onClear}
          />
        </div>
      }
    />
  );
}
