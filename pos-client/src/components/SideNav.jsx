import React, { useState, useEffect, useMemo } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { normalizeMenuPath } from '../services/routeRegistry';
import { getPosAppUrl } from '../services/posApp';
import { resolveMenuIcon } from '../services/menuIconResolver';
import SafeFontAwesomeIcon from './SafeFontAwesomeIcon';

// ─── Inline styles matching layout/Sidebar.jsx ───────────────────────────────
const S = {
  aside: {
    width: 260,
    minWidth: 260,
    background: '#1f2130',
    color: '#fff',
    padding: '16px 12px',
    overflowY: 'auto',
    minHeight: '100vh',
    flexShrink: 0,
  },
  brand: {
    fontWeight: 700,
    marginBottom: 20,
    fontSize: 16,
    color: '#fff',
    display: 'block',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  sectionBtn: {
    width: '100%',
    background: 'transparent',
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
  },
  sectionBtnHover: {
    background: 'rgba(255,255,255,0.08)',
  },
  labelWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  subList: {
    paddingLeft: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    overflow: 'hidden',
  },
  leaf: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: active ? '#fff' : 'rgba(255,255,255,0.82)',
    textDecoration: 'none',
    padding: '8px 10px',
    paddingLeft: active ? 7 : 10,
    borderRadius: 8,
    borderLeft: active ? '3px solid #9b7fd4' : '3px solid transparent',
    background: active ? '#343853' : 'transparent',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
  }),
  sectionActive: {
    background: '#343853',
    fontWeight: 600,
  },
};

function normalizePathname(pathname) {
  const raw = String(pathname || '/').replace(/^#/, '');
  let withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  withSlash = withSlash.length > 1 ? withSlash.replace(/\/$/, '') : withSlash;
  if (withSlash === '/home') return '/dashboard';
  return withSlash;
}

function menuRoute(pathURL, label = '') {
  if (!pathURL) return '';
  const base = pathURL.startsWith('/') ? pathURL : `/${pathURL}`;
  return normalizeMenuPath(base, label);
}

function matchesMenuRoute(pathname, pathURL, label = '') {
  const current = normalizePathname(pathname);
  const route = menuRoute(pathURL, label);
  if (!route) return false;
  if (current === route) return true;
  if (route.includes(':')) {
    const re = new RegExp(`^${route.replace(/:[^/]+/g, '[^/]+')}$`);
    return re.test(current);
  }
  return false;
}

function matchesMenuRouteOrPrefix(pathname, pathURL, label = '') {
  const current = normalizePathname(pathname);
  const route = menuRoute(pathURL, label);
  if (!route) return false;
  if (matchesMenuRoute(pathname, pathURL, label)) return true;
  return route !== '/' && current.startsWith(`${route}/`);
}

function pickBestActiveItem(pathname, items = []) {
  const current = normalizePathname(pathname);
  let best = null;
  let bestScore = -1;

  for (const item of items) {
    const route = menuRoute(item.path, item.label);
    if (!route) continue;

    let score = -1;
    if (current === route) {
      score = route.length * 10 + 100;
    } else if (route.includes(':')) {
      const re = new RegExp(`^${route.replace(/:[^/]+/g, '[^/]+')}$`);
      if (re.test(current)) score = route.length * 10 + 50;
    } else if (current.startsWith(`${route}/`)) {
      score = route.length * 10;
    }

    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return best;
}

function menuItemKey(item) {
  return `${menuRoute(item.path, item.label)}|${item.label || ''}`;
}

function isMenuItemActive(pathname, item, siblings = []) {
  const pool = siblings.length ? siblings : [item];
  const best = pickBestActiveItem(pathname, pool);
  if (!best) return false;
  return menuItemKey(best) === menuItemKey(item);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isPathMatch(pathname, pathURL, label = '') {
  return matchesMenuRoute(pathname, pathURL, label);
}

function getLeafItems(main, subOnly = null) {
  const items = [];
  if (!main?.children) return items;
  for (const sub of main.children) {
    if (subOnly && sub.sub_menu !== subOnly) continue;
    if (sub.children?.length) {
      sub.children.forEach((s) => {
        const path = s.second_sub_menu_route || s.route;
        if (path) {
          items.push({ path, label: s.second_sub_menu, controller: s.controller });
        }
      });
    } else {
      const path = sub.sub_menu_route || sub.route;
      if (path) {
        items.push({ path, label: sub.sub_menu, controller: sub.controller });
      }
    }
  }
  return items;
}

function getLeafPaths(main, subOnly = null) {
  return getLeafItems(main, subOnly).map((item) => item.path);
}

// ─── Font Awesome sidebar icons (SVG — no webfont dependency) ────────────────
function MenuIcon({ icon, muted = false }) {
  if (!icon?.iconName) return null;
  return (
    <SafeFontAwesomeIcon
      icon={icon}
      style={{
        fontSize: muted ? 12 : 14,
        width: 18,
        minWidth: 18,
        color: muted ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.9)',
        flexShrink: 0,
      }}
    />
  );
}

// ─── Reusable section toggle button ──────────────────────────────────────────
function SectionBtn({ icon, label, parentLabel, controller, isOpen, hasActive, onClick, mutedIcon = false }) {
  const [hovered, setHovered] = useState(false);
  const faIcon = (typeof icon === 'object' && icon?.iconName)
    ? icon
    : resolveMenuIcon({
        label,
        icon: typeof icon === 'string' ? icon : null,
        controller,
        parentLabel,
      });
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...S.sectionBtn,
        ...(hasActive ? S.sectionActive : {}),
        background: hasActive
          ? '#343853'
          : hovered
          ? 'rgba(255,255,255,0.08)'
          : 'transparent',
      }}
    >
      <span style={S.labelWrap}>
        <MenuIcon icon={faIcon} muted={mutedIcon} />
        <span>{label}</span>
      </span>
      <span style={{ fontSize: 12 }}>{isOpen ? '▾' : '▸'}</span>
    </button>
  );
}

function isPosMenuItem(pathURL, controller, label) {
  if (controller === 'pos') return true;
  if (label && /^pos$/i.test(String(label).trim())) return true;
  const route = normalizeMenuPath(pathURL || '', label);
  return route === '/pos' || /\/pos$/i.test(String(pathURL || ''));
}

// ─── Leaf link (avoids NavLink className function for simple paths) ────────────
function LeafLink({ to, children, onClick, openInNewTab, controller, label, siblings = [] }) {
  const { pathname } = useLocation();
  const posItem = openInNewTab || isPosMenuItem(to, controller, label);
  const item = { path: to, label, controller };
  const active = posItem
    ? matchesMenuRoute(pathname, '/pos', 'POS')
    : isMenuItemActive(pathname, item, siblings.length ? siblings : [item]);
  const [hovered, setHovered] = useState(false);
  const style = {
    ...S.leaf(active),
    background: active ? '#343853' : hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
  };

  if (posItem) {
    return (
      <a
        href={getPosAppUrl()}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={style}
        title="Open POS in new tab"
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={style}
    >
      {children}
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const SideNav = ({
  menuTree = [],
  routePaths = [],
  componentName,
  sideBarCollapsed,
  onNavClick,
}) => {
  const location = useLocation();
  const pathname = location.pathname || (location.hash && location.hash.replace('#', '')) || '';

  const [openMains, setOpenMains] = useState(() => new Set(['Dashboard']));
  const [openSubs, setOpenSubs]   = useState(() => new Set());

  // Auto-expand on navigation
  useEffect(() => {
    if (menuTree?.length) {
      for (const main of menuTree) {
        const mainItems = getLeafItems(main);
        if (mainItems.some((item) => matchesMenuRouteOrPrefix(pathname, item.path, item.label))) {
          setOpenMains((prev) => new Set(prev).add(main.main_menu));
          for (const sub of main.children || []) {
            const subItems = getLeafItems(main, sub.sub_menu);
            if (subItems.some((item) => matchesMenuRouteOrPrefix(pathname, item.path, item.label)) && sub.children?.length) {
              setOpenSubs((prev) => new Set(prev).add(`${main.main_menu}|${sub.sub_menu}`));
            }
          }
          break;
        }
      }
      return;
    }
    if (routePaths?.length) {
      for (const r of routePaths) {
        const group = r.group ?? 'N/A';
        if (group !== 'N/A' && matchesMenuRouteOrPrefix(pathname, r.pathURL, r.name)) {
          setOpenMains((prev) => new Set(prev).add(group));
          break;
        }
      }
    }
  }, [pathname, menuTree, routePaths]);

  const toggleMain = (name) =>
    setOpenMains((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const toggleSub = (mainName, subName) => {
    const key = `${mainName}|${subName}`;
    setOpenSubs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleNavClick = (name) => {
    if (typeof componentName === 'function') componentName(name);
    if (typeof onNavClick === 'function') onNavClick();
  };

  // ── Tree menu ──────────────────────────────────────────────────────────────
  const renderTreeMenu = () => (
    <nav style={S.nav}>
      {menuTree.map((main) => {
        const leafSiblings = getLeafItems(main);
        const singleLeaf =
          main.children?.length === 1 &&
          !main.children[0].children?.length &&
          main.children[0].sub_menu_route;

        if (singleLeaf) {
          const sub = main.children[0];
          return (
            <LeafLink
              key={main.main_menu}
              to={sub.sub_menu_route}
              controller={sub.controller}
              openInNewTab={sub.openInNewTab}
              label={sub.sub_menu}
              siblings={leafSiblings}
              onClick={() => handleNavClick(main.main_menu)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MenuIcon icon={resolveMenuIcon({ label: main.main_menu, icon: main.main_menu_icon })} />
                {main.main_menu}
              </span>
            </LeafLink>
          );
        }

        const isOpen   = openMains.has(main.main_menu);
        const hasActive = leafSiblings.some((item) =>
          matchesMenuRouteOrPrefix(pathname, item.path, item.label),
        );
        return (
          <div key={main.main_menu}>
          <SectionBtn
              icon={main.main_menu_icon}
              label={main.main_menu}
              isOpen={isOpen}
              hasActive={hasActive}
              onClick={() => toggleMain(main.main_menu)}
            />
            {isOpen && (
              <div style={S.subList}>
                {(main.children || []).map((sub) => {
                  const hasSecond = sub.children?.length > 0;
                  const subKey    = `${main.main_menu}|${sub.sub_menu}`;
                  const subOpen   = openSubs.has(subKey);
                  const subItems  = getLeafItems(main, sub.sub_menu);
                  const subActive = subItems.some((item) =>
                    matchesMenuRouteOrPrefix(pathname, item.path, item.label),
                  );
                  const subSiblings = subItems;

                  if (hasSecond) {
                    return (
                      <div key={subKey}>
                        <SectionBtn
                          label={sub.sub_menu}
                          icon={sub.sub_menu_icon}
                          controller={sub.controller}
                          parentLabel={main.main_menu}
                          mutedIcon
                          isOpen={subOpen}
                          hasActive={subActive}
                          onClick={() => toggleSub(main.main_menu, sub.sub_menu)}
                        />
                        {subOpen && (
                          <div style={{ ...S.subList, paddingLeft: 20 }}>
                            {sub.children.map((second) => {
                              const pathURL = second.second_sub_menu_route || second.route;
                              if (!pathURL) return null;
                              return (
                                <LeafLink
                                  key={pathURL}
                                  to={pathURL}
                                  label={second.second_sub_menu}
                                  controller={second.controller}
                                  siblings={subSiblings}
                                  onClick={() => handleNavClick(second.second_sub_menu)}
                                >
                                  <MenuIcon
                                    icon={resolveMenuIcon({
                                      label: second.second_sub_menu,
                                      icon: second.second_sub_menu_icon,
                                      controller: second.controller,
                                      parentLabel: main.main_menu,
                                    })}
                                    muted
                                  />
                                  {second.second_sub_menu}
                                </LeafLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  const pathURL = sub.sub_menu_route || sub.route;
                  if (!pathURL) return null;
                  return (
                    <LeafLink
                      key={`${pathURL}-${sub.sub_menu}`}
                      to={pathURL}
                      controller={sub.controller}
                      openInNewTab={sub.openInNewTab}
                      label={sub.sub_menu}
                      siblings={leafSiblings}
                      onClick={() => handleNavClick(sub.sub_menu)}
                    >
                      <MenuIcon
                        icon={resolveMenuIcon({
                          label: sub.sub_menu,
                          icon: sub.sub_menu_icon,
                          controller: sub.controller,
                          parentLabel: main.main_menu,
                        })}
                        muted
                      />
                      {sub.sub_menu}
                    </LeafLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  // ── Flat/grouped menu ──────────────────────────────────────────────────────
  const groupedRoutes = useMemo(() => {
    const list = Array.isArray(routePaths) ? routePaths : [];
    const byGroup = {};
    const ungrouped = [];
    list.forEach((r) => {
      const group = r.group ?? 'N/A';
      if (group === 'N/A') ungrouped.push(r);
      else {
        if (!byGroup[group]) byGroup[group] = [];
        byGroup[group].push(r);
      }
    });
    return { byGroup: Object.entries(byGroup), ungrouped };
  }, [routePaths]);

  const renderFlatMenu = () => {
    const { byGroup, ungrouped } = groupedRoutes;
    return (
      <nav style={S.nav}>
        {ungrouped.map((r, i) => (
          <LeafLink
            key={r.pathURL || i}
            to={r.pathURL}
            label={r.name}
            controller={r.controllerName}
            siblings={[{ path: r.pathURL, label: r.name, controller: r.controllerName }]}
            onClick={() => handleNavClick(r.name)}
          >
            <MenuIcon icon={resolveMenuIcon({ label: r.name, icon: r.icon, controller: r.controller })} muted />
            {r.name}
          </LeafLink>
        ))}
        {byGroup.map(([groupName, items]) => {
          const isOpen  = openMains.has(groupName);
          const flatSiblings = items.map((r) => ({ path: r.pathURL, label: r.name, controller: r.controllerName }));
          const hasActive = items.some((r) => matchesMenuRouteOrPrefix(pathname, r.pathURL, r.name));
          return (
            <div key={groupName}>
              <SectionBtn
                icon={items[0]?.icon}
                label={groupName}
                isOpen={isOpen}
                hasActive={hasActive}
                onClick={() => toggleMain(groupName)}
              />
              {isOpen && (
                <div style={S.subList}>
                  {items.map((r, idx) => (
                    <LeafLink
                      key={r.pathURL || idx}
                      to={r.pathURL}
                      label={r.name}
                      controller={r.controllerName}
                      siblings={flatSiblings}
                      onClick={() => handleNavClick(r.name)}
                    >
                      <MenuIcon icon={resolveMenuIcon({ label: r.name, icon: r.icon, controller: r.controller, parentLabel: groupName })} muted />
                      {r.name}
                    </LeafLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  };

  // ── Pick renderer ──────────────────────────────────────────────
  const useTree = menuTree?.length > 0;
  const useFlat = !useTree && routePaths?.length > 0;
  const content = useTree
    ? renderTreeMenu()
    : useFlat
      ? renderFlatMenu()
      : <p style={{ fontSize: 13, opacity: 0.7, padding: 8 }}>No menu items for your role.</p>;

  // ── Responsive sidebar ──────────────────────────────────────────────
  // Desktop (≥992px): sidebar always in document flow; collapsed = width 0
  // Mobile  (<992px):  sidebar is position:fixed overlay; collapses off-screen left
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 992;

  const asideStyle = {
    ...S.aside,
    // mobile: fixed overlay
    ...(isMobile ? {
      position: 'fixed',
      top: 60,
      left: 0,
      bottom: 0,
      zIndex: 1025,
      transform: sideBarCollapsed ? 'translateX(-100%)' : 'translateX(0)',
      transition: 'transform 0.25s ease',
      boxShadow: sideBarCollapsed ? 'none' : '4px 0 20px rgba(0,0,0,0.3)',
    } : {
      // desktop: collapse to 0 width
      width: sideBarCollapsed ? 0 : 260,
      minWidth: sideBarCollapsed ? 0 : 260,
      overflow: 'hidden',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      padding: sideBarCollapsed ? 0 : '16px 12px',
    }),
  };

  return (
    <>
      <aside style={asideStyle}>
        {!sideBarCollapsed && (
          <>
            <span style={S.brand}>POS Admin</span>
            {content}
          </>
        )}
      </aside>

      {/* Mobile backdrop */}
      {isMobile && !sideBarCollapsed && (
        <div
          onClick={() => typeof onNavClick === 'function' && onNavClick()}
          style={{
            position: 'fixed',
            inset: 0,
            top: 60,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 1024,
          }}
        />
      )}
    </>
  );
};

export default SideNav;
