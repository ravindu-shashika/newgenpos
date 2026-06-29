import { toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const alertSettings = {
  position: 'bottom-center',
  autoClose: 5000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  transition: Slide,
};

const stickyAlertSettings = {
  position: 'bottom-center',
  autoClose: false,
  hideProgressBar: true,
  closeOnClick: true,
  draggable: true,
  transition: Slide,
};

export default {
  info(msg) {
    return toast.info(msg, alertSettings);
  },

  success(msg) {
    return toast.success(msg, alertSettings);
  },

  warning(msg) {
    return toast.warning(msg, alertSettings);
  },

  error(msg) {
    return toast.error(msg, alertSettings);
  },

  info_stick(msg) {
    return toast.info(msg, stickyAlertSettings);
  },

  success_stick(msg) {
    return toast.success(msg, stickyAlertSettings);
  },

  warning_stick(msg) {
    return toast.warning(msg, stickyAlertSettings);
  },

  error_stick(msg) {
    return toast.error(msg, stickyAlertSettings);
  },
};
