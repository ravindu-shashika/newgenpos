import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Styles.css';

/**
 * Check if current pathname matches a route (supports param routes e.g. /edit/:id).
 */
function isPathMatch(pathname, pathURL) {
  if (!pathURL) return false;
  const path = pathname.replace(/^#/, '') || '/';
  const route = pathURL.startsWith('/') ? pathURL : `/${pathURL}`;
  if (route.includes(':')) {
    const prefix = route.split(':')[0];
    return path === route || (prefix && path.startsWith(prefix));
  }
  return path === route || path.startsWith(route + '/');
}

/**
 * Collect all leaf route paths from tree for a main (and optionally a sub) to detect active.
 */
function getLeafPaths(main, subOnly = null) {
  const paths = [];
  if (!main?.children) return paths;
  for (const sub of main.children) {
    if (subOnly && sub.sub_menu !== subOnly) continue;
    if (sub.children?.length) {
      sub.children.forEach((s) => {
        if (s.second_sub_menu_route) paths.push(s.second_sub_menu_route);
      });
    } else if (sub.sub_menu_route) {
      paths.push(sub.sub_menu_route);
    }
  }
  return paths;
}

const SideNav = ({
  menuTree = [],
  routePaths = [],
  componentName,
  sideBarCollapsed,
  onNavClick,
}) => {
  const location = useLocation();
  const pathname = location.pathname || (location.hash && location.hash.replace('#', '')) || '';

  // State-based collapse: which main and which main+sub are open
  const [openMains, setOpenMains] = useState(() => new Set());
  const [openSubs, setOpenSubs] = useState(() => new Set());

  // When pathname changes, open the main (and sub) that contain this route
  useEffect(() => {
    if (menuTree?.length) {
      for (const main of menuTree) {
        const mainPaths = getLeafPaths(main);
        const mainActive = mainPaths.some((p) => isPathMatch(pathname, p));
        if (mainActive) {
          setOpenMains((prev) => new Set(prev).add(main.main_menu));
          for (const sub of main.children || []) {
            const subPaths = getLeafPaths(main, sub.sub_menu);
            const subActive = subPaths.some((p) => isPathMatch(pathname, p));
            if (subActive && sub.children?.length) {
              setOpenSubs((prev) => new Set(prev).add(`${main.main_menu}|${sub.sub_menu}`));
            }
          }
          break;
        }
      }
      return;
    }
    // Flat menu: open group that contains current path
    const list = Array.isArray(routePaths) ? routePaths : [];
    for (const r of list) {
      const group = r.group ?? 'N/A';
      if (group !== 'N/A' && isPathMatch(pathname, r.pathURL)) {
        setOpenMains((prev) => new Set(prev).add(group));
        break;
      }
    }
  }, [pathname, menuTree, routePaths]);

  const toggleMain = (name) => {
    setOpenMains((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleSub = (mainName, subName) => {
    const key = `${mainName}|${subName}`;
    setOpenSubs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleNavClick = (name) => {
    if (typeof componentName === 'function') componentName(name);
    if (typeof onNavClick === 'function') onNavClick();
  };

  // ---- Tree-based menu (main → sub → second sub) ----
  const renderTreeMenu = () => {
    if (!menuTree?.length) return null;
    return (
      <ul className="nav flex-column sidebar-nav">
        {menuTree.map((main) => {
          const mainOpen = openMains.has(main.main_menu);
          const mainPaths = getLeafPaths(main);
          const mainActive = mainPaths.some((p) => isPathMatch(pathname, p));
          return (
            <li key={main.main_menu} className="nav-item sidebar-main-item">
              <button
                type="button"
                className={`nav-link sidebar-main-link ${mainActive ? 'active' : ''}`}
                onClick={() => toggleMain(main.main_menu)}
                aria-expanded={mainOpen}
                aria-controls={`sidebar-main-${main.main_menu.replace(/\s/g, '-')}`}
              >
                <span className="sidebar-main-label">{main.main_menu}</span>
                <span className={`sidebar-toggle ${mainOpen ? 'open' : ''}`} aria-hidden>▼</span>
              </button>
              <div
                id={`sidebar-main-${main.main_menu.replace(/\s/g, '-')}`}
                className={`sidebar-collapse-content ${mainOpen ? 'show' : ''}`}
                role="region"
              >
                {(main.children || []).map((sub) => {
                  const hasSecond = sub.children?.length > 0;
                  const subKey = `${main.main_menu}|${sub.sub_menu}`;
                  const subOpen = openSubs.has(subKey);
                  const subPaths = getLeafPaths(main, sub.sub_menu);
                  const subActive = subPaths.some((p) => isPathMatch(pathname, p));

                  if (hasSecond) {
                    return (
                      <div key={subKey} className="sidebar-sub-group">
                        <button
                          type="button"
                          className={`nav-link sidebar-sub-link ${subActive ? 'active' : ''}`}
                          onClick={() => toggleSub(main.main_menu, sub.sub_menu)}
                          aria-expanded={subOpen}
                        >
                          <span>{sub.sub_menu}</span>
                          <span className={`sidebar-toggle small ${subOpen ? 'open' : ''}`}>▼</span>
                        </button>
                        <div className={`sidebar-collapse-content sub ${subOpen ? 'show' : ''}`}>
                          {sub.children.map((second) => {
                            const pathURL = second.second_sub_menu_route || second.route;
                            if (!pathURL) return null;
                            return (
                              <NavLink
                                key={pathURL + second.second_sub_menu}
                                to={pathURL}
                                className={({ isActive }) =>
                                  `nav-link sidebar-leaf${isActive ? ' active' : ''}`
                                }
                                onClick={() => handleNavClick(second.second_sub_menu)}
                              >
                                {second.second_sub_menu}
                              </NavLink>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  const pathURL = sub.sub_menu_route || sub.route;
                  if (!pathURL) return null;
                  return (
                    <NavLink
                      key={pathURL}
                      to={pathURL}
                      className={({ isActive }) =>
                        `nav-link sidebar-leaf${isActive ? ' active' : ''}`
                      }
                      onClick={() => handleNavClick(sub.sub_menu)}
                    >
                      {sub.sub_menu}
                    </NavLink>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  // ---- Flat/grouped menu (when no tree: routePaths grouped by group) ----
  const groupedRoutes = useMemo(() => {
    const list = Array.isArray(routePaths) ? routePaths : [];
    const byGroup = {};
    const ungrouped = [];
    list.forEach((r) => {
      const group = r.group ?? 'N/A';
      if (group === 'N/A') {
        ungrouped.push(r);
      } else {
        if (!byGroup[group]) byGroup[group] = [];
        byGroup[group].push(r);
      }
    });
    return { byGroup: Object.entries(byGroup), ungrouped };
  }, [routePaths]);

  const renderFlatMenu = () => {
    const { byGroup, ungrouped } = groupedRoutes;
    const hasGroups = byGroup.length > 0;

    return (
      <ul className="nav flex-column sidebar-nav">
        {ungrouped.map((route, index) => (
          <li className="nav-item" key={route.pathURL || index}>
            <NavLink
              to={route.pathURL}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => handleNavClick(route.name)}
            >
              {route.name}
            </NavLink>
          </li>
        ))}
        {hasGroups &&
          byGroup.map(([groupName, items]) => {
            const groupId = groupName.replace(/\s/g, '-');
            const isOpen = openMains.has(groupName);
            const hasActive = items.some((r) => isPathMatch(pathname, r.pathURL));
            return (
              <li key={groupId} className="nav-item sidebar-main-item">
                <button
                  type="button"
                  className={`nav-link sidebar-main-link ${hasActive ? 'active' : ''}`}
                  onClick={() => toggleMain(groupName)}
                  aria-expanded={isOpen}
                >
                  <span className="sidebar-main-label">{groupName}</span>
                  <span className={`sidebar-toggle ${isOpen ? 'open' : ''}`}>▼</span>
                </button>
                <div className={`sidebar-collapse-content ${isOpen ? 'show' : ''}`}>
                  {items.map((row, idx) => (
                    <NavLink
                      key={row.pathURL || idx}
                      to={row.pathURL}
                      className={({ isActive }) => `nav-link sidebar-leaf${isActive ? ' active' : ''}`}
                      onClick={() => handleNavClick(row.name)}
                    >
                      {row.name}
                    </NavLink>
                  ))}
                </div>
              </li>
            );
          })}
      </ul>
    );
  };

  const useTree = menuTree?.length > 0;
  const content = useTree ? renderTreeMenu() : renderFlatMenu();

  return (
    <div
      className={`sidenav-wrap ${sideBarCollapsed ? 'sidebar-collapsed' : 'sidebar-open'}`}
      aria-hidden={sideBarCollapsed}
    >
      <nav className="sidebar">
        <div className="sidebar-sticky">{content}</div>
      </nav>
    </div>
  );
};

export default SideNav;
