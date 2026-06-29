import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  faArchive,
  faBars,
  faBell,
  faChevronDown,
  faCog,
  faExchangeAlt,
  faExpand,
  faPlus,
  faPowerOff,
  faUser,
  faVial,
} from '@fortawesome/free-solid-svg-icons';
import { auth, api } from '../services';
import authStore from '../stores/authStore';
import SafeFontAwesomeIcon from './SafeFontAwesomeIcon';

const QUICK_ADD_ITEMS = [
  { label: 'Add Category', permission: 'category', to: '/category' },
  { label: 'Add Product', permission: 'products-add', to: '/products/create' },
  { label: 'Add Purchase', permission: 'purchases-add', to: '/purchases/create' },
  { label: 'Add Sale', permission: 'sales-add', to: '/sales/create' },
  { label: 'Add Expense', permission: 'expenses-add', to: '/expenses' },
  { label: 'Add Quotation', permission: 'quotes-add', to: '/quotations/create' },
  { label: 'Add Transfer', permission: 'transfers-add', to: '/transfers/create' },
  { label: 'Add Return', permission: 'returns-add', to: '/return-sale' },
  { label: 'Add Purchase Return', permission: 'purchase-return-add', to: '/return-purchase/create' },
  { label: 'Add User', permission: 'users-add', to: '/user' },
  { label: 'Add Customer', permission: 'customers-add', to: '/customer' },
  { label: 'Add Biller', permission: 'billers-add', to: '/biller' },
  { label: 'Add Supplier', permission: 'suppliers-add', to: '/supplier' },
];

function useClickOutside(ref, onClose, enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, onClose, enabled]);
}

function NavDropdown({ id, trigger, children, align = 'right', className = '' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const close = useCallback(() => setOpen(false), []);

  useClickOutside(wrapRef, close, open);

  return (
    <li className={`nav-item nav-dropdown ${className}`.trim()} ref={wrapRef} id={id}>
      <button
        type="button"
        className="nav-link dropdown-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
      </button>
      {open && (
        <ul
          className={align === 'left' ? 'dropdown-menu show' : 'right-sidebar show'}
          onClick={close}
          onKeyDown={(event) => event.key === 'Escape' && close()}
        >
          {children}
        </ul>
      )}
    </li>
  );
}

const NavBar = ({ selectedComponentName, collapseSideBar }) => {
  const location = useLocation();
  const isPos = location.pathname === '/pos' || location.pathname.startsWith('/pos/');

  const [authState, setAuthState] = useState(authStore.getState());
  const [bootstrap, setBootstrap] = useState(null);

  useEffect(() => authStore.subscribe(setAuthState), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api.get('navbar/bootstrap');
        const data = res?.data ?? res;
        if (cancelled) return;
        setBootstrap(data);
        const nextTheme = data?.theme === 'dark' ? 'dark' : 'light';
        document.body.classList.toggle('dark-mode', nextTheme === 'dark');
      } catch (err) {
        console.error('navbar/bootstrap error', err);
      }
    };

    if (!isPos) {
      load();
    }

    return () => {
      cancelled = true;
    };
  }, [isPos]);

  const user = authState.user;
  const userName = user?.name || bootstrap?.user?.name || 'User';
  const roleId = Number(user?.role_id ?? bootstrap?.user?.role_id ?? 99);
  const userId = user?.id ?? bootstrap?.user?.id;

  const can = useCallback((permission) => authStore.can(permission), [authState.permissions]);

  const quickAddItems = useMemo(
    () => QUICK_ADD_ITEMS.filter((item) => can(item.permission)),
    [can, authState.permissions]
  );

  const alerts = bootstrap?.alerts ?? { qty: 0, dso: 0, expiry: 0, reminders: 0 };
  const reminderItems = bootstrap?.reminder_items ?? [];
  const expiryDays = bootstrap?.expiry_alert_days ?? 0;
  const hasQtyAlertPerm = can('product-qty-alert');
  const totalNotifications = alerts.qty + alerts.dso + alerts.reminders;
  const badgeCount =
    hasQtyAlertPerm && totalNotifications > 0
      ? totalNotifications + alerts.expiry
      : totalNotifications;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      return;
    }
    document.exitFullscreen?.();
  };

  const signOut = async () => {
    await auth.signOutUser();
  };

  if (isPos) {
    return null;
  }

  const siteTitle = selectedComponentName || bootstrap?.site_title || 'SalePro POS';

  return (
    <div className="app-navbar">
      <header className="container-fluid">
        <nav className="navbar">
          <button
            type="button"
            id="toggle-btn"
            className="menu-btn navbar-toggler-sidebar"
            onClick={() => collapseSideBar()}
            aria-label="Toggle menu"
          >
            <SafeFontAwesomeIcon icon={faBars} />
          </button>

          <ul className="nav-menu list-unstyled d-flex flex-md-row align-items-md-center">
            {quickAddItems.length > 0 && (
              <NavDropdown
                align="left"
                className="d-none d-lg-block"
                trigger={<SafeFontAwesomeIcon icon={faPlus} />}
              >
                {quickAddItems.map((item) => (
                  <li key={item.to} className="dropdown-item">
                    <Link to={item.to} onClick={(event) => event.stopPropagation()}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </NavDropdown>
            )}

            <li className="nav-item d-none d-lg-block">
              <button
                type="button"
                id="btnFullscreen"
                className="nav-link icon-btn"
                title="Full Screen"
                onClick={toggleFullscreen}
              >
                <SafeFontAwesomeIcon icon={faExpand} />
              </button>
            </li>

            {roleId <= 2 && (
              <li className="nav-item">
                <Link to="/cash-register" className="nav-link icon-btn" title="Cash Register List">
                  <SafeFontAwesomeIcon icon={faArchive} />
                </Link>
              </li>
            )}

            <NavDropdown
              id="notification-icon"
              trigger={
                <>
                  <SafeFontAwesomeIcon icon={faBell} />
                  {badgeCount > 0 && (
                    <span className="badge badge-danger notification-number">{badgeCount}</span>
                  )}
                </>
              }
            >
              {totalNotifications === 0 && alerts.expiry === 0 ? (
                <li className="notifications text-center">
                  <span className="text-muted">No notifications available</span>
                </li>
              ) : (
                <>
                  {alerts.qty > 0 && (
                    <li className="notifications">
                      <Link to="/report/product_quantity_alert">
                        {alerts.qty} product exceeds alert quantity
                      </Link>
                    </li>
                  )}
                  {alerts.dso > 0 && (
                    <li className="notifications">
                      <Link to="/report/daily-sale-objective">
                        {alerts.dso} product could not fulfill daily sale objective
                      </Link>
                    </li>
                  )}
                  {alerts.expiry > 0 && (
                    <li className="notifications">
                      <Link to="/report/product-expiry">
                        {alerts.expiry} product will expire within {expiryDays} days
                      </Link>
                    </li>
                  )}
                  {reminderItems.map((item) => (
                    <li key={item.id} className="notifications">
                      {item.document_name ? (
                        <a
                          href={`${window.location.origin}/documents/notification/${item.document_name}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.message}
                        </a>
                      ) : (
                        <span>{item.message}</span>
                      )}
                    </li>
                  ))}
                </>
              )}
            </NavDropdown>

            <li className="nav-item d-none d-lg-block">
              <button
                type="button"
                className="nav-link icon-btn"
                title="Logout"
                onClick={signOut}
              >
                <SafeFontAwesomeIcon icon={faPowerOff} />
              </button>
            </li>

            <NavDropdown
              trigger={
                <>
                  <SafeFontAwesomeIcon icon={faUser} />
                  <span className="navbar-user-name">{userName}</span>
                  <SafeFontAwesomeIcon icon={faChevronDown} size="xs" />
                </>
              }
            >
              <li>
                <Link to={userId ? `/user/profile/${userId}` : '/user-profile'}>
                  <SafeFontAwesomeIcon icon={faUser} /> Profile
                </Link>
              </li>
              {can('general_setting') && (
                <li>
                  <Link to="/general-settings">
                    <SafeFontAwesomeIcon icon={faCog} /> Settings
                  </Link>
                </li>
              )}
              <li>
                <Link to={`/my-transactions/${year}/${month}`}>
                  <SafeFontAwesomeIcon icon={faExchangeAlt} /> My Transaction
                </Link>
              </li>
              {roleId !== 5 && (
                <li>
                  <Link to={`/holidays/my-holiday/${year}/${month}`}>
                    <SafeFontAwesomeIcon icon={faVial} /> My Holiday
                  </Link>
                </li>
              )}
              <li>
                <button type="button" className="dropdown-signout" onClick={signOut}>
                  <SafeFontAwesomeIcon icon={faPowerOff} /> Logout
                </button>
              </li>
            </NavDropdown>
          </ul>

          <Link to="/home" className="navbar-brand d-lg-none">
            <span className="navbar-brand-text">{siteTitle}</span>
          </Link>
        </nav>
      </header>
    </div>
  );
};

export default NavBar;
