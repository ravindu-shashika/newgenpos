import React from 'react';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Button } from './Button';
import { resolvePrimeIcon } from './primeUtils';

const SIZE_WIDTH = {
  sm: '26rem',
  md: '40rem',
  lg: '52rem',
  xl: '68rem',
  '2xl': 'min(94vw, 88rem)',
};

export function Modal({
  isOpen = true,
  title,
  onClose,
  children,
  footer,
  size = 'md',
  hideHint = true,
  headerExtra = null,
}) {
  if (!isOpen) return null;

  return (
    <Dialog
      visible
      header={
        <div className="ui-modal-header-inner">
          <span className="ui-modal-title">{title}</span>
          {headerExtra}
        </div>
      }
      onHide={onClose}
      footer={footer ? <div className="ui-modal-actions">{footer}</div> : null}
      modal
      blockScroll
      draggable={false}
      resizable={false}
      dismissableMask
      style={{ width: SIZE_WIDTH[size] ?? SIZE_WIDTH.md, maxWidth: '95vw' }}
      contentStyle={{ overflow: 'auto', maxHeight: 'calc(90vh - 11rem)' }}
      className="ui-prime-modal"
      maskClassName="ui-prime-modal-mask"
    >
      {!hideHint && (
        <p className="ui-modal-hint">
          Fields marked <span className="text-red-500">*</span> are required.
        </p>
      )}
      <div className="ui-modal-body">{children}</div>
    </Dialog>
  );
}

export function ConfirmModal({ title, message, onConfirm, onClose, danger }) {
  return (
    <Dialog
      visible
      header={title}
      onHide={onClose}
      modal
      blockScroll
      draggable={false}
      dismissableMask
      style={{ width: SIZE_WIDTH.sm, maxWidth: '95vw' }}
      className="ui-prime-modal ui-prime-modal--confirm"
      maskClassName="ui-prime-modal-mask"
      footer={
        <div className="ui-modal-actions">
          <Button variant="outline" icon="pi pi-times" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            icon={danger ? 'pi pi-trash' : 'pi pi-check'}
            type="button"
            onClick={onConfirm}
          >
            {danger ? 'Yes, Delete' : 'Confirm'}
          </Button>
        </div>
      }
    >
      <div className="ui-modal-body ui-modal-body--confirm">{message}</div>
    </Dialog>
  );
}

/** Standard modal footer — Cancel + primary action (matches page header buttons). */
export function ModalActions({
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Save',
  confirmIcon = faCheck,
  confirming = false,
  danger = false,
}) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        icon="pi pi-times"
        onClick={onCancel}
        disabled={confirming}
      >
        {cancelLabel}
      </Button>
      <Button
        type="button"
        variant={danger ? 'danger' : 'primary'}
        icon={resolvePrimeIcon(confirmIcon, danger ? 'pi pi-trash' : 'pi pi-check')}
        onClick={onConfirm}
        disabled={confirming}
        loading={confirming}
      >
        {confirmLabel}
      </Button>
    </>
  );
}

export { ConfirmDialog, confirmDialog };
