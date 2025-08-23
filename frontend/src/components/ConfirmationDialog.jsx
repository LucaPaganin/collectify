import React from 'react';
import Button from './Button';
import Modal from './Modal';

/**
 * A generic confirmation dialog component
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether to show the dialog
 * @param {string} props.title - Dialog title
 * @param {string|JSX.Element} props.message - Dialog message (can be string or JSX)
 * @param {string} props.confirmLabel - Label for the confirm button
 * @param {string} props.cancelLabel - Label for the cancel button
 * @param {Function} props.onConfirm - Function to call when confirmed
 * @param {Function} props.onCancel - Function to call when canceled
 * @param {Function} props.onClose - Function to call when dialog is closed (if different from onCancel)
 */
const ConfirmationDialog = ({ 
  show, 
  title, 
  message, 
  confirmLabel = 'Confirm', 
  cancelLabel = 'Cancel',
  onConfirm, 
  onCancel,
  onClose
}) => {
  // Use onClose if provided, otherwise fall back to onCancel
  const handleClose = onClose || onCancel;
  
  return (
    <Modal show={show} title={title} onClose={handleClose}>
      <div className="py-2">
        {typeof message === 'string' ? <p>{message}</p> : message}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button 
            variant="secondary" 
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button 
            variant="primary" 
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;