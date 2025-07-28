import React from 'react';
import TextField from '@mui/material/TextField';

const Input = ({ value, onChange, placeholder, type = 'text', label, ...props }) => (
  <TextField
    type={type}
    value={value}
    onChange={onChange}
    label={label || placeholder}
    variant="outlined"
    fullWidth
    {...props}
  />
);

export default Input;
