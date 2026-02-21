import React, { useEffect, useState } from 'react';
import { NavBar, SideNav, ComponentContainer } from './components';
import { Login } from './auth';
import { HashRouter } from 'react-router-dom';
import { routes, buildRoutesFromMenuItems, flattenMenuTreeToRoutes, buildMenuTree, cookie, api, auth } from './services';
import authStore from './stores/authStore';
import roleStore from './stores/roleStore';
import './App.css';

function App() {
  const [menuRoutes, setMenuRoutes] = useState([]);
  const [menuTree, setMenuTree] = useState([]);
  const [authState, setAuthState] = useState(authStore.getState());

  const [navCollapse, setNavCollapse] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 992
  );

  const [selectedComponent, setSelectedComponent] = useState('');

  useEffect(() => {
    let unsubscribe;
    if (cookie.get('access_token')) {
      unsubscribe = authStore.subscribe(setAuthState);
      fetchUserAndMenu();
    }
    return () => unsubscribe?.();
  }, []);

  const collapseSideBar = () => {
    setNavCollapse(!navCollapse);
  };

  const fetchUserAndMenu = async () => {
    if (!cookie.get('access_token')) return;
    try {
      await authStore.fetchUser();
      const menus = await roleStore.fetchMenuByRole();
      const permissions = authStore.getPermissions();
      let routePaths = [];
      let tree = [];
      if (menus.length > 0) {
        tree = buildMenuTree(menus, permissions);
        routePaths = flattenMenuTreeToRoutes(tree);
      }
      if (routePaths.length === 0) {
        routePaths = await routes.routes();
      }
      setMenuTree(tree);
      setMenuRoutes(routePaths);
    } catch (err) {
      console.error('fetchUserAndMenu error', err);
    }
  };

  const componentName = (e) => {
    setSelectedComponent(e);
  };

  return (
    <div className="app-root">
      <HashRouter>
        {cookie.get('access_token') ? (
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
              {/* Mobile sidebar backdrop */}
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
              <ComponentContainer
                routePaths={menuRoutes}
                sideBarCollapsed={navCollapse}
              />
            </div>
          </div>
        ) : (
          <Login />
        )}
      </HashRouter>
    </div>
  );
}

export default App;
