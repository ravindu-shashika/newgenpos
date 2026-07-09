import React, { useEffect, useState, useCallback } from 'react';
import { NavBar, SideNav, ComponentContainer, PosStockRealtimeListener } from './components';
import { Login } from './auth';
import { HashRouter, useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import PosPage from './views/backend/pos/PosPage';
import {
  flattenMenuTreeToRoutes,
  buildMenuTree,
  buildSidebarMenuTree,
  augmentMenuTreeWithSidebar,
  cookie,
} from './services';
import { isPosPathname } from './services/posApp';
import { hasToken, restoreSessionToken, clearToken, PERSISTENT_COOKIE_OPTIONS } from './services/tokenStorage';
import authStore from './stores/authStore';
import roleStore from './stores/roleStore';
import generalSettingStore from './stores/generalSettingStore';
import { useAppSelector } from './store/hooks';
import { selectAuthLoaded, selectPermissions, selectUser } from './store/authSlice';
import './App.css';

function AuthenticatedLayout({
  menuRoutes,
  menuTree,
  navCollapse,
  collapseSideBar,
  selectedComponent,
  componentName,
}) {
  return (
    <div className="app-layout">
      <PosStockRealtimeListener />
      <NavBar
        components={menuRoutes}
        selectedComponentName={selectedComponent}
        collapseSideBar={collapseSideBar}
        sideBarCollapsed={navCollapse}
      />
      <div className="app-body">
        <SideNav
          menuTree={menuTree}
          routePaths={menuRoutes}
          componentName={componentName}
          sideBarCollapsed={navCollapse}
          onNavClick={() => window.innerWidth < 992 && collapseSideBar()}
        />
        {!navCollapse && (
          <div
            className="sidebar-backdrop d-lg-none"
            onClick={collapseSideBar}
            onKeyDown={(e) => e.key === 'Escape' && collapseSideBar()}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />
        )}
        <ComponentContainer routePaths={menuRoutes} sideBarCollapsed={navCollapse} />
      </div>
    </div>
  );
}

function PosStandaloneRoutes() {
  return (
    <Routes>
      <Route path="/pos" element={<PosPage />} />
      <Route path="/pos/:draftId" element={<PosPage />} />
    </Routes>
  );
}

function AppContent({
  menuRoutes,
  menuTree,
  navCollapse,
  collapseSideBar,
  selectedComponent,
  componentName,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isPos = isPosPathname(location.pathname);
  const path = location.pathname || '/';

  useEffect(() => {
    document.body.classList.toggle('pos-standalone-mode', isPos);
    return () => document.body.classList.remove('pos-standalone-mode');
  }, [isPos]);

  // Reopen / empty hash → dashboard (not login, not blank page)
  useEffect(() => {
    if (isPos) return;
    if (path === '/' || path === '' || path === '/home' || path === '/login') {
      navigate('/dashboard', { replace: true });
    }
  }, [path, isPos, navigate]);

  if (isPos) {
    return <PosStandaloneRoutes />;
  }

  return (
    <AuthenticatedLayout
      menuRoutes={menuRoutes}
      menuTree={menuTree}
      navCollapse={navCollapse}
      collapseSideBar={collapseSideBar}
      selectedComponent={selectedComponent}
      componentName={componentName}
    />
  );
}

function App() {
  const [menuRoutes, setMenuRoutes] = useState([]);
  const [menuTree, setMenuTree] = useState([]);
  const permissions = useAppSelector(selectPermissions);
  const user = useAppSelector(selectUser);
  const authLoaded = useAppSelector(selectAuthLoaded);
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [navCollapse, setNavCollapse] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 992
  );

  const [selectedComponent, setSelectedComponent] = useState('');

  const buildMenu = useCallback(async (perms, authUser) => {
    if (!hasToken()) return;
    try {
      const [menus] = await Promise.all([
        roleStore.fetchMenuByRole(),
        generalSettingStore.fetchSetting(),
      ]);
      const roleId = authUser?.role_id ?? cookie.get('role_id');
      const setting = generalSettingStore.getSetting();
      const modules = String(setting?.modules ?? '')
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const roleOptions = { roleId: Number(roleId) || null, modules };
      const sidebarTree = buildSidebarMenuTree(perms, roleOptions);
      const dbTree = menus.length > 0 ? buildMenuTree(menus, perms) : [];
      let tree = sidebarTree.length > 0 ? sidebarTree : dbTree;
      if (sidebarTree.length > 0) {
        tree = augmentMenuTreeWithSidebar(tree, perms, roleOptions);
      }

      setMenuTree(tree);
      setMenuRoutes(flattenMenuTreeToRoutes(tree));
    } catch (err) {
      console.error('buildMenu error', err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      restoreSessionToken();
      if (!hasToken()) {
        if (!cancelled) {
          setIsAuthenticated(false);
          setSessionReady(true);
        }
        return;
      }

      const result = await authStore.fetchUser();
      if (cancelled) return;

      if (!hasToken()) {
        setIsAuthenticated(false);
        setSessionReady(true);
        return;
      }

      if (result?.user) {
        setIsAuthenticated(true);
        const u = result.user;
        if (u.id != null) cookie.set('user_id', u.id, PERSISTENT_COOKIE_OPTIONS);
        if (u.name) cookie.set('user_name', u.name, PERSISTENT_COOKIE_OPTIONS);
        const roleId = u.role_id ?? u.role?.id;
        if (roleId != null) cookie.set('role_id', roleId, PERSISTENT_COOKIE_OPTIONS);
        if (u.role?.name) cookie.set('role_name', u.role.name, PERSISTENT_COOKIE_OPTIONS);
      } else {
        authStore.clearAuth();
        clearToken();
        setIsAuthenticated(false);
      }
      setSessionReady(true);
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!authLoaded || !isAuthenticated) return;
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (hash === '/pos' || hash.startsWith('/pos/')) return;
    buildMenu(permissions, user);
  }, [authLoaded, permissions, user, buildMenu, isAuthenticated]);

  const collapseSideBar = () => {
    setNavCollapse(!navCollapse);
  };

  const componentName = (e) => {
    setSelectedComponent(e);
  };

  if (!sessionReady) {
    return (
      <div className="app-root">
        <div className="p-5 text-center text-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <HashRouter>
        {isAuthenticated ? (
          <AppContent
            menuRoutes={menuRoutes}
            menuTree={menuTree}
            navCollapse={navCollapse}
            collapseSideBar={collapseSideBar}
            selectedComponent={selectedComponent}
            componentName={componentName}
          />
        ) : (
          <Login />
        )}
      </HashRouter>
    </div>
  );
}

export default App;
