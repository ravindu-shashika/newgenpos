import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { faChevronDown, faEllipsisVertical } from '@fortawesome/free-solid-svg-icons';
import SafeFontAwesomeIcon from '../SafeFontAwesomeIcon';
import { cleanActionLabel, resolveActionIcon } from './actionMenuHelpers';

/**
 * ActionMenu — dropdown row actions with Font Awesome icons.
 *
 * Items support:
 *   { label: 'Edit', onClick, danger? }
 *   { action: 'edit', label: 'Edit', onClick }  // explicit icon
 *   { icon: faCustom, label: 'Custom', onClick }
 */
function ActionMenuItemContent({ item }) {
  const icon = resolveActionIcon(item);
  const text = cleanActionLabel(item.label) || item.label;

  return (
    <>
      <span
        className={`ui-action-item-icon${item.danger ? ' danger' : ''}`}
        aria-hidden="true"
      >
        {icon ? (
          <SafeFontAwesomeIcon icon={icon} fixedWidth />
        ) : (
          <span className="ui-action-item-dot" />
        )}
      </span>
      <span className="ui-action-item-label">{text}</span>
    </>
  );
}

export function ActionMenu({ id, openId, setOpenId, items = [], triggerLabel = 'Actions' }) {
  const isOpen = openId === id;
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    const updatePos = () => {
      if (isOpen && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setPos({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right,
        });
      }
    };

    updatePos();

    if (isOpen) {
      window.addEventListener('scroll', updatePos, true);
      window.addEventListener('resize', updatePos);
    }
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [isOpen]);

  const menuItemStyle = (danger) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--ui-surface2)',
    color: danger ? 'var(--ui-debit)' : 'var(--ui-ink)',
    cursor: 'pointer',
    fontFamily: 'var(--ui-font)',
    fontSize: '0.78rem',
    fontWeight: danger ? 500 : 400,
    padding: '9px 14px',
    textAlign: 'left',
    textDecoration: 'none',
    transition: 'background 0.12s',
  });

  return (
    <div className="ui-action-wrap">
      <button
        ref={btnRef}
        type="button"
        className="ui-action-btn"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          setOpenId(isOpen ? null : id);
        }}
      >
        <SafeFontAwesomeIcon icon={faEllipsisVertical} className="ui-action-btn-icon" />
        <span>{triggerLabel}</span>
        <SafeFontAwesomeIcon icon={faChevronDown} className="ui-action-btn-caret" />
      </button>

      {isOpen && createPortal(
        <div
          className="ui-action-menu-portal"
          role="menu"
          style={{
            position: 'fixed',
            top: pos.top,
            right: pos.right,
            background: 'var(--ui-surface)',
            border: '1px solid var(--ui-border)',
            borderRadius: 'var(--ui-radius)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            minWidth: 176,
            zIndex: 9999,
            overflow: 'hidden',
            fontFamily: 'var(--ui-font)',
            fontSize: '0.78rem',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) =>
            item.divider ? (
              <hr
                key={i}
                style={{ margin: 0, border: 'none', borderTop: '1px solid var(--ui-border)' }}
              />
            ) : item.to ? (
              <Link
                key={i}
                to={item.to}
                className="ui-action-menu-item"
                style={menuItemStyle(item.danger)}
                role="menuitem"
                onClick={() => setOpenId(null)}
              >
                <ActionMenuItemContent item={item} />
              </Link>
            ) : item.href ? (
              <a
                key={i}
                href={item.href}
                className="ui-action-menu-item"
                style={menuItemStyle(item.danger)}
                role="menuitem"
                onClick={() => setOpenId(null)}
              >
                <ActionMenuItemContent item={item} />
              </a>
            ) : (
              <button
                key={i}
                type="button"
                className="ui-action-menu-item"
                style={menuItemStyle(item.danger)}
                role="menuitem"
                onClick={() => {
                  setOpenId(null);
                  item.onClick?.();
                }}
              >
                <ActionMenuItemContent item={item} />
              </button>
            )
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
