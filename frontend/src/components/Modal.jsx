import React from 'react';
import { Modal as BSModal } from 'react-bootstrap';

const Modal = ({ show, title, children, onClose }) => (
  <BSModal show={show} onHide={onClose} centered>
    <BSModal.Header closeButton>
      <BSModal.Title>{title}</BSModal.Title>
    </BSModal.Header>
    <BSModal.Body>{children}</BSModal.Body>
    <BSModal.Footer>
      <button className="btn btn-secondary" onClick={onClose}>Close</button>
    </BSModal.Footer>
  </BSModal>
);

export default Modal;
