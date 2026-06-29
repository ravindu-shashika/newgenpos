import React from 'react';

/**
 * SelectionBar — appears when rows are selected; shows count + a clear button.
 *
 * <SelectionBar count={selected.size} onClear={() => setSelected(new Set())} />
 */
export function SelectionBar({ count, onClear, label }) {
  if (!count) return null;
  return (
    <div className="ui-sel-bar">
      <span>
        {count} row{count !== 1 ? 's' : ''} selected
        {label && ` — ${label}`}
      </span>
      <button className="ui-sel-clear" onClick={onClear} type="button">
        ✕ Clear
      </button>
    </div>
  );
}
