import React from 'react';

/**
 * Modal — base modal with dark-header matching the design system.
 *
 * <Modal title="Add Item" onClose={...} footer={<>...</>}>
 *   {body content}
 * </Modal>
 *
 * ConfirmModal — pre-built destructive confirmation dialog.
 */
export function Modal({ isOpen = true, title, onClose, children, footer, size, hideHint = true, headerExtra = null }) {
  if (!isOpen) return null;
  const sizeClass = size === 'sm' ? ' sm' : size === 'lg' ? ' lg' : '';
  return (
    <div
      className="ui-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`ui-modal-box${sizeClass}`} onClick={(e) => e.stopPropagation()}>
        <div className="ui-modal-head">
          <h5>{title}</h5>
          <div className="d-flex align-items-center gap-2">
            {headerExtra}
            <button className="ui-modal-close" onClick={onClose} type="button" aria-label="Close">
              ✕
            </button>
          </div>
        </div>
        <div className="ui-modal-body">
          {!hideHint && (
            <p className="ui-modal-hint">
              Fields marked <span style={{ color: 'var(--ui-debit)' }}>*</span> are required.
            </p>
          )}
          {children}
        </div>
        {footer && <div className="ui-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ title, message, onConfirm, onClose, danger }) {
  return (
    <div
      className="ui-modal-overlay"
    >
      <div className="ui-modal-box sm">
        <div className="ui-modal-head">
          <h5>{title}</h5>
          <button className="ui-modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        <div className="ui-modal-body">{message}</div>
        <div className="ui-modal-foot">
          <button className="ui-btn ghost sm" onClick={onClose} type="button">
            <i className="fa fa-times ui-btn-icon" /> Cancel
          </button>
          <button
            className={`ui-btn sm ${danger ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            type="button"
          >
            <i className={`fa ${danger ? 'fa-trash' : 'fa-check'} ui-btn-icon`} />
            {danger ? 'Yes, Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
