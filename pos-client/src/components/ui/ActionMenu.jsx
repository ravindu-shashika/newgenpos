import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

/**
 * ActionMenu — a dropdown action button for table rows.
 *
 * The menu renders via a React portal at document.body with position:fixed
 * so it always escapes overflow:hidden/auto containers (like the table wrapper).
 *
 * <ActionMenu
 *   id={row.id}
 *   openId={openMenu}
 *   setOpenId={setOpenMenu}
 *   items={[
 *     { label: '✎ Edit',   onClick: () => openEdit(row) },
 *     { label: '🗑 Delete', onClick: () => handleDelete(row.id), danger: true },
 *   ]}
 * />
 */
export function ActionMenu({ id, openId, setOpenId, items = [] }) {
  const isOpen  = openId === id;
  const btnRef  = useRef(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  // Recalculate position every time this specific menu opens OR on scroll/resize
  useEffect(() => {
    const updatePos = () => {
      if (isOpen && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setPos({
          top:  rect.bottom + 4,
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

  return (
    <div className="ui-action-wrap">
      <button
        ref={btnRef}
        type="button"
        className="ui-action-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpenId(isOpen ? null : id);
        }}
      >
        Action ▾
      </button>

      {isOpen && createPortal(
        <div
          style={{
            position:  'fixed',
            top:       pos.top,
            right:     pos.right,
            background:  'var(--ui-surface)',
            border:      '1px solid var(--ui-border)',
            borderRadius:'var(--ui-radius)',
            boxShadow:   '0 8px 24px rgba(0,0,0,0.14)',
            minWidth:    160,
            zIndex:      9999,
            overflow:    'hidden',
            fontFamily:  'var(--ui-mono)',
            fontSize:    '0.78rem',
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
                style={itemStyle(item.danger)}
                onClick={() => setOpenId(null)}
              >
                {item.label}
              </Link>
            ) : item.href ? (
              <a
                key={i}
                href={item.href}
                style={itemStyle(item.danger)}
                onClick={() => setOpenId(null)}
              >
                {item.label}
              </a>
            ) : (
              <button
                key={i}
                type="button"
                style={itemStyle(item.danger)}
                onClick={() => {
                  setOpenId(null);
                  item.onClick?.();
                }}
              >
                {item.label}
              </button>
            )
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

const itemStyle = (danger) => ({
  display:        'flex',
  alignItems:     'center',
  gap:            8,
  width:          '100%',
  background:     'none',
  border:         'none',
  borderBottom:   '1px solid var(--ui-surface2)',
  color:          danger ? 'var(--ui-debit)' : 'var(--ui-ink)',
  cursor:         'pointer',
  fontFamily:     'var(--ui-mono)',
  fontSize:       '0.78rem',
  fontWeight:     danger ? 500 : 400,
  padding:        '9px 14px',
  textAlign:      'left',
  textDecoration: 'none',
  transition:     'background 0.1s',
});
