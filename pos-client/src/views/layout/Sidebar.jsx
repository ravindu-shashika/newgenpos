import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Link, useLocation } from 'react-router-dom';
import authStore from '../../stores/authStore';
import { buildSidebarMenuTree } from '../../services/menuBuilder';
import generalSettingStore from '../../stores/generalSettingStore';

const SECTION_ICONS = {
  Dashboard: '🏠',
  Product: '📦',
  Purchase: '🛒',
  Sale: '🧾',
  Quotation: '📄',
  Transfer: '🔁',
  Expense: '💸',
  Income: '💰',
  Booking: '📅',
  People: '👥',
  Accounting: '📑',
  HRM: '👔',
  Manufacturing: '🏭',
  WhatsApp: '💬',
  Reports: '📊',
  Settings: '⚙️',
};

function isActivePath(pathname, route) {
  if (!route) return false;
  const current = pathname.replace(/\/$/, '') || '/';
  const target = route.replace(/\/$/, '') || '/';
  if (current === target) return true;
  if (target !== '/' && current.startsWith(`${target}/`)) return true;
  if (route.includes(':')) {
    const re = new RegExp(`^${route.replace(/:[^/]+/g, '[^/]+')}$`);
    return re.test(current);
  }
  return false;
}

export default function Sidebar() {
  const auth = useSyncExternalStore(authStore.subscribe, authStore.getState, authStore.getState);
  const { pathname } = useLocation();
  const [open, setOpen] = useState(() => new Set(['Dashboard']));

  const menuTree = useMemo(() => {
    const roleId = auth.user?.role_id != null ? Number(auth.user.role_id) : null;
    const setting = generalSettingStore.getSetting?.() ?? {};
    const modules = String(setting.modules ?? '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    return buildSidebarMenuTree(auth.permissions, { roleId, modules });
  }, [auth.permissions, auth.user]);

  const toggle = (label) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  if (!menuTree.length) {
    return (
      <aside style={{ width: 260, background: '#1f2130', color: '#fff', padding: '16px 12px' }}>
        <div style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>POS Admin</div>
        <p style={{ fontSize: 13, opacity: 0.7 }}>No menu items for your role.</p>
      </aside>
    );
  }

  return (
    <aside style={{ width: 260, background: '#1f2130', color: '#fff', padding: '16px 12px', overflowY: 'auto' }}>
      <div style={{ fontWeight: 700, marginBottom: 20, fontSize: 16 }}>POS Admin</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {menuTree.map((section) => {
          const label = section.main_menu;
          const icon = SECTION_ICONS[label] ?? '•';
          const children = section.children ?? [];
          const isOpen = open.has(label);
          const sectionActive = children.some((item) =>
            isActivePath(pathname, item.sub_menu_route),
          );

          if (children.length === 1 && children[0].sub_menu_route) {
            const item = children[0];
            const active = isActivePath(pathname, item.sub_menu_route);
            return (
              <Link
                key={label}
                to={item.sub_menu_route}
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  padding: '10px 10px',
                  borderRadius: 8,
                  background: active ? '#343853' : 'transparent',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            );
          }

          return (
            <div key={label}>
              <button
                type="button"
                onClick={() => toggle(label)}
                style={{
                  width: '100%',
                  background: sectionActive ? '#343853' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  textAlign: 'left',
                  padding: '10px 10px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{icon}</span>
                  <span>{label}</span>
                </span>
                <span>{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div style={{ paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {children.map((item) => {
                    const active = isActivePath(pathname, item.sub_menu_route);
                    return (
                      <Link
                        key={`${item.sub_menu_route}-${item.sub_menu}`}
                        to={item.sub_menu_route}
                        style={{
                          color: '#fff',
                          textDecoration: 'none',
                          padding: '8px 10px',
                          borderRadius: 8,
                          background: active ? '#343853' : 'transparent',
                          fontSize: 13,
                        }}
                      >
                        {item.sub_menu}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
