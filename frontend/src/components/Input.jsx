import React from 'react';

const Input = ({ value, onChange, placeholder, type = 'text', ...props }) => (
  <input
    type={type}
    className="form-control"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    {...props}
  />
);

export default Input;
