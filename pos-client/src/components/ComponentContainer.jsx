import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import './Styles.css';

const ComponentContainer = ({ routePaths, sideBarCollapsed }) => {
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
        {routePaths
          .filter((r) => r.pathURL)
          .map((route, index) => (
            <Route
              key={route.pathURL || index}
              path={route.pathURL}
              element={route.componentName ? React.createElement(route.componentName) : null}
            />
          ))}
      </Routes>
    </div>
  );
};

export default ComponentContainer;
