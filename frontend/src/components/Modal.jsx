import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from './Button';

const Modal = ({ show, title, children, onClose }) => (
  <Dialog open={show} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>{title}</DialogTitle>
    <DialogContent dividers>{children}</DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="secondary">Close</Button>
    </DialogActions>
  </Dialog>
);

export default Modal;
