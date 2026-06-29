import React, { useEffect, useState, useCallback } from 'react';
import { NavBar, SideNav, ComponentContainer } from './components';
import { Login } from './auth';
import { HashRouter, useLocation, Routes, Route } from 'react-router-dom';
import PosPage from './views/backend/pos/PosPage';
import {
  flattenMenuTreeToRoutes,
  buildMenuTree,
  buildSidebarMenuTree,
  augmentMenuTreeWithSidebar,
  cookie,
} from './services';
import { isPosPathname } from './services/posApp';
import { hasToken, syncTokenFromCookie } from './services/tokenStorage';
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
  const isPos = isPosPathname(location.pathname);

  useEffect(() => {
    document.body.classList.toggle('pos-standalone-mode', isPos);
    return () => document.body.classList.remove('pos-standalone-mode');
  }, [isPos]);

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

  const [navCollapse, setNavCollapse] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 992
  );

  const [selectedComponent, setSelectedComponent] = useState('');

  const buildMenu = useCallback(async (perms, authUser) => {
    if (!hasToken() && !cookie.get('access_token')) return;
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
    syncTokenFromCookie();
    if (!hasToken() && !cookie.get('access_token')) return undefined;

    authStore.fetchUser();
    return undefined;
  }, []);

  useEffect(() => {
    if (!authLoaded) return;
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    if (hash === '/pos' || hash.startsWith('/pos/')) return;
    buildMenu(permissions, user);
  }, [authLoaded, permissions, user, buildMenu]);

  const collapseSideBar = () => {
    setNavCollapse(!navCollapse);
  };

  const componentName = (e) => {
    setSelectedComponent(e);
  };

  return (
    <div className="app-root">
      <HashRouter>
        {hasToken() || cookie.get('access_token') ? (
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
