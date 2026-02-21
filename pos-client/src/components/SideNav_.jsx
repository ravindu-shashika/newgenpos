import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Styles.css';

const SideNav = ({ routePaths, componentName, sideBarCollapsed }) => {
  return (
    <div
      className="col-sm-2 sidenavdiv"
      style={sideBarCollapsed ? { display: 'none' } : null}
    >
      <nav className="d-none d-md-block bg-dark sidebar">
        <div className="sidebar-sticky">
          <ul className="nav flex-column">
            {routePaths.map((route, index) => {
              return (
                <li className="nav-item" key={index}>
                  <NavLink
                    exact
                    to={route.pathURL}
                    className="nav-link"
                    activeClassName="active"
                    onClick={() => componentName(route.name)}
                  >
                    {route.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default SideNav;
