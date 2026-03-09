import React, { useState, useEffect } from 'react';
import { api, auth, msg } from '../services';
import {
  isMobile,
  browserName,
  browserVersion,
  mobileVendor,
  mobileModel,
  osName,
  osVersion,
} from 'react-device-detect';
import { ToastContainer } from 'react-toastify';
import { loginMain } from '../assets';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    email: '',
    password: '',
    branch: '',
    url: 'www.koobiya.com',
    device_name: isMobile
      ? `${browserName} ${browserVersion} on ${mobileVendor} ${mobileModel} (${osName} ${osVersion})`
      : `${browserName} ${browserVersion} on ${osName} ${osVersion}`,
  });

  const [branchList, setBranchList] = useState([]);
  const [currentBranch, setCurrentBranch] = useState({ id: '', code: '', name: '' });

 
  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await auth.doUserLogin(credentials);

    if (response.status == 200 && response.data.status == 200) {
      msg.success(response.data.message || 'Login successful');
      await auth.handleLoginSuccess(response);
      window.location.reload();
    } else if (response.status == 200 && (response.data.status == 409 || response.data.status == 401)) {
      msg.warning(response.data.message);
    } else if (response.status == 200 && response.data.status == 500) {
      response.data.error?.map((err) => {
        msg.error(err);
      });
    } else {
      msg.error('Something Went Wrong...');
    }
  };

  const handleValueChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="login-page">
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <section className="login-form-section">
        <div className="login-card">
          <div className="login-logo-wrap">
            <img src={loginMain} alt="Logo" />
          </div>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to Cloth Shop Management</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                name="username"
                id="username"
                value={credentials.username}
                onChange={handleValueChange}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>
            <div className="field-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                name="password"
                id="password"
                value={credentials.password}
                onChange={handleValueChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" className="login-submit">
              Sign in
            </button>
          </form>

          <footer className="login-footer">
            <small>© 2026 KOOBIYA TEXTILES.</small>
            <small>
              All rights reserved. · <a href="#">Terms of use</a>
            </small>
          </footer>
        </div>
      </section>

      <section className="login-brand-section">
        <div className="login-brand-inner">
          <img src={loginMain} alt="" aria-hidden height="100" width="100" />
          <h2 className="login-brand-title">Clothes</h2>
          <p className="login-brand-tagline">Shop Management System</p>
          <p className="login-brand-credit">
            Powered by{' '}
            <a href={credentials.url} target="_blank" rel="noopener noreferrer">
              NEWGENIDEAS
            </a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;
