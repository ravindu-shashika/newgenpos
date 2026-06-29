import React from 'react';
import styles from './AlertDialog.module.css';

const AlertDialog = ({
  showAlert,
  showClose,
  closeBtnText,
  showOk,
  okBtnText,
  header,
  body,
  clickOk,
  clockClose,
}) => {
  return showAlert ? (
    <div
      className={styles.modal}
      tabIndex="-1"
      role="dialog"
      aria-labelledby="formModalTitle"
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h5 className="h4" id="formModalTitle">
            {header}
          </h5>
        </div>
        <div className={styles.modalBody}>
          <p className="font-weight-bold">{body}</p>
        </div>
        <div className={styles.modalFooter}></div>
      </div>
    </div>
  ) : null;
};

export default AlertDialog;
