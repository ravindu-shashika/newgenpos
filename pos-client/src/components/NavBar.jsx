import React from 'react';
import { auth, cookie } from '../services';
import './Styles.css';
// import { Approvals, BranchSelector, Reports } from '../views';
import { DateAndTime } from '.';
import SafeFontAwesomeIcon from './SafeFontAwesomeIcon';
import { faSignOutAlt, faUserAlt, faBars } from '@fortawesome/free-solid-svg-icons';
import { loginMain } from '../assets';

const NavBar = ({ selectedComponentName, collapseSideBar, sideBarCollapsed }) => {
  const signOut = async () => {
    auth.signOutUser();
  };

  return (
    <header className="app-navbar">
      <nav className="navbar navbar-expand-lg navbar-dark">
        <button
          type="button"
          className="navbar-toggler navbar-toggler-sidebar d-lg-none"
          onClick={() => collapseSideBar()}
          aria-label="Toggle menu"
        >
          <SafeFontAwesomeIcon icon={faBars} />
        </button>
        <a
          className="navbar-brand"
          href="#/"
          onClick={(e) => { e.preventDefault(); collapseSideBar(); }}
        >
          <img src={loginMain} alt="Logo" height="36" width="36" />
          <span className="navbar-brand-text">
            {selectedComponentName || 'Palliyaguruge'.toUpperCase()}
          </span>
        </a>
        <button
          type="button"
          className="navbar-toggler"
          data-toggle="collapse"
          data-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ml-auto align-items-center flex-wrap">
            <li className="nav-item">
              {/* <Reports /> */}
            </li>
            <li className="nav-item">
              {/* <Approvals /> */}
            </li>
            <li className="nav-item nav-item-date">
              <span className="nav-link py-2">
                <DateAndTime />
              </span>
            </li>
            <li className="nav-item nav-item-branch">
              {/* <BranchSelector /> */}
            </li>
            <li className="nav-item nav-item-user">
              <span className="nav-link py-2">
                <SafeFontAwesomeIcon icon={faUserAlt} className="mr-1" />
                <strong>{cookie.get('user_name')}</strong>
              </span>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className="nav-link btn btn-link navbar-signout"
                onClick={() => signOut()}
              >
                <SafeFontAwesomeIcon icon={faSignOutAlt} />
                <span className="d-none d-sm-inline ml-1">Sign out</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
