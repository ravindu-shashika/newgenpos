import React, { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
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
          ? 'col-12 component-container'
          : 'col-12 col-lg-10 component-container'
      }
    >
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        {sortedRoutes.length === 0 ? (
          <Route path="*" element={<div className="p-5 text-center">Loading Content...</div>} />
        ) : (
          sortedRoutes.map((route, index) => (
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
          ))
        )}
      </Routes>
    </div>
  );
};

export default ComponentContainer;
