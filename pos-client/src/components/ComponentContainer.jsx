import React, { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfirmDialog } from './ui/Modal';
import PlaceholderPage from '../views/PlaceholderPage';
import './Styles.css';

/** More specific paths (params + depth) should register before list routes. */
function routeSpecificity(path = '') {
  const parts = path.split('/').filter(Boolean);
  let score = parts.length * 10;
  for (const part of parts) {
    score += part.startsWith(':') ? 1 : 5;
  }
  return score;
}

const ComponentContainer = ({ routePaths, sideBarCollapsed }) => {
  const sortedRoutes = useMemo(
    () =>
      [...routePaths]
        .filter((r) => r.pathURL)
        .sort((a, b) => routeSpecificity(b.pathURL) - routeSpecificity(a.pathURL)),
    [routePaths]
  );

  return (
    <div
      className={
        sideBarCollapsed
          ? 'col-12 component-container prime-admin'
          : 'col-12 col-lg-10 component-container prime-admin'
      }
    >
        <ConfirmDialog />
        <Routes>
          {sortedRoutes.length === 0 ? (
            <Route path="*" element={<div className="p-5 text-center">Loading Content...</div>} />
          ) : (
            <>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/home" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              {sortedRoutes.map((route, index) => (
                <Route
                  key={route.pathURL || index}
                  path={route.pathURL}
                  element={
                    route.componentName
                      ? React.createElement(route.componentName, {
                          controllerName: route.controllerName ?? null,
                        })
                      : null
                  }
                />
              ))}
              <Route path="*" element={<PlaceholderPage />} />
            </>
          )}
        </Routes>
    </div>
  );
};

export default ComponentContainer;
