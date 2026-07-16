import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import './prime-admin.css';
import './tailwind.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './index.css';
import { initAppEnv } from './config/appEnv';
import './services/api';
import App from './App';
import 'react-toastify/dist/ReactToastify.css';
import { store } from './store';
import authStore from './stores/authStore';

config.autoAddCss = false;

initAppEnv();

authStore.bindAuthStore(store);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
