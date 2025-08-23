import React, { useEffect } from 'react';
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
  
  // Debug visibility state changes
  useEffect(() => {
    if (show) {
      console.log('ConfirmationDialog shown:', { title, message });
    } else {
      console.log('ConfirmationDialog hidden');
    }
  }, [show, title, message]);
  
  // Wrap callback functions to add logging
  const handleConfirm = () => {
    console.log('ConfirmationDialog: Confirm button clicked');
    if (onConfirm) onConfirm();
  };
  
  const handleCancel = () => {
    console.log('ConfirmationDialog: Cancel button clicked');
    if (onCancel) onCancel();
  };
  
  const handleCloseDialog = () => {
    console.log('ConfirmationDialog: Close button clicked');
    if (handleClose) handleClose();
  };
  
  return (
    <Modal show={show} title={title} onClose={handleCloseDialog} hideCloseButton={true}>
      <div className="py-2">
        {typeof message === 'string' ? <p>{message}</p> : message}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <Button 
            variant="secondary" 
            onClick={handleCancel}
          >
            {cancelLabel}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;