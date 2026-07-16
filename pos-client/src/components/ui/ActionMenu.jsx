import React, { useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'primereact/menu';
import { Button } from 'primereact/button';
import { cleanActionLabel, resolveActionIcon } from './actionMenuHelpers';

const PRIME_ICON_FALLBACK = {
  edit: 'pi pi-pencil',
  delete: 'pi pi-trash',
  view: 'pi pi-eye',
  print: 'pi pi-print',
  duplicate: 'pi pi-copy',
};

function resolvePrimeIcon(item) {
  if (item.action && PRIME_ICON_FALLBACK[item.action]) return PRIME_ICON_FALLBACK[item.action];
  if (item.danger) return 'pi pi-trash';
  if (resolveActionIcon(item)) return 'pi pi-cog';
  return 'pi pi-angle-right';
}

export function ActionMenu({ id, openId, setOpenId, items = [], triggerLabel = 'Actions' }) {
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const isOpen = openId === id;

  const model = useMemo(() => items.map((item, index) => {
    if (item.divider) return { separator: true, key: `sep-${index}` };
    return {
      key: `${item.label}-${index}`,
      label: cleanActionLabel(item.label) || item.label,
      icon: resolvePrimeIcon(item),
      className: item.danger ? 'text-red-500' : undefined,
      command: () => {
        setOpenId(null);
        if (item.to) navigate(item.to);
        else if (item.href) window.location.href = item.href;
        else item.onClick?.();
      },
    };
  }), [items, navigate, setOpenId]);

  return (
    <div className="ui-action-wrap">
      <Button
        type="button"
        label={triggerLabel}
        icon="pi pi-ellipsis-v"
        iconPos="right"
        severity="secondary"
        outlined
        size="small"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          menuRef.current?.toggle(e);
        }}
      />
      <Menu
        ref={menuRef}
        model={model}
        popup
        onHide={() => setOpenId(null)}
        onShow={() => setOpenId(id)}
      />
    </div>
  );
}
