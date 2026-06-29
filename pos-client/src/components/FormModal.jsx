import React from 'react';
import styles from './FormModal.module.css';

const FormModal = (props) => {
  const modalWidth = props.width ? `${props.width}` : '90%';
  const modalHeight = props.height ? `${props.height}` : 'fit-content';

  return props.modalState === false ? null : (
    <div
      className={styles.modal}
      tabIndex="-1"
      role="dialog"
      aria-labelledby="formModalTitle"
    >
      <div
        className={styles.modalContent}
        style={{ width: modalWidth, height: modalHeight }}
      >
        <div className={styles.modalHeader}>
          <h5 id="formModalTitle">
            {props.moduleName}
          </h5>
          <button
            type="button"
            className={styles.close}
            onClick={() => props.toggleFormModal()}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
};

export default FormModal;
