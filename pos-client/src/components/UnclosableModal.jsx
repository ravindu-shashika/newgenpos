import React from 'react';
import styles from './UnclosableModal.module.css';

const FormModal = (props) => {
  return props.modalState === false ? null : (
    <div
      className={styles.modal}
      tabIndex="-1"
      role="dialog"
      aria-labelledby="formModalTitle"
    >
      <div className={styles.modalContent}>
        {/* <div className={styles.modalHeader}>
          <span
            className={styles.close}
            onClick={() => props.toggleFormModal()}
          >
            &times;
          </span>
          <h5 className="h4" id="formModalTitle">
            {props.moduleName}
          </h5>
        </div> */}
        {props.children}
      </div>
    </div>
  );
};

export default FormModal;
