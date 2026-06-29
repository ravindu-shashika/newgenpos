import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'primeicons/primeicons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './index.css';
import './services/api';
import App from './App';
import 'react-toastify/dist/ReactToastify.css';
import { store } from './store';
import authStore from './stores/authStore';

authStore.bindAuthStore(store);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <App />
  </Provider>,
);
