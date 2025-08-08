import React from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  Grid, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Button 
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import styles from '../../containers/AdminPage.module.css';

const SpecificationField = ({ 
  spec, 
  index, 
  onUpdate, 
  onRemove, 
  handleDragStart, 
  handleDragEnd, 
  handleDragOver, 
  handleDrop 
}) => {
  const updateField = (field, value) => {
    onUpdate(index, field, value);
  };

  return (
    <Paper 
      key={index} 
      className={styles.specField}
      draggable
      onDragStart={(e) => handleDragStart(e, index)}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => handleDragOver(e, index)}
      onDrop={handleDrop}
      sx={{ p: 2, mb: 2 }}
    >
      <Box className={styles.specFieldHeader}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DragIndicatorIcon className={styles.dragHandle} />
          <Typography variant="subtitle1">Specification Field</Typography>
        </Box>
        <Button 
          variant="outlined" 
          color="error" 
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() => onRemove(index)}
        >
          Remove
        </Button>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Field Key (code name)"
            placeholder="e.g., weight, color, material"
            fullWidth
            value={spec.key || ''}
            onChange={(e) => updateField('key', e.target.value)}
            required
            helperText="Required. Used in code, no spaces."
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Field Label (display name)"
            placeholder="e.g., Weight, Color, Material"
            fullWidth
            value={spec.label || ''}
            onChange={(e) => updateField('label', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Field Type</InputLabel>
            <Select
              value={spec.type || 'text'}
              label="Field Type"
              onChange={(e) => updateField('type', e.target.value)}
            >
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="select">Select (dropdown)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Placeholder"
            placeholder="e.g., Enter weight in grams..."
            fullWidth
            value={spec.placeholder || ''}
            onChange={(e) => updateField('placeholder', e.target.value)}
          />
        </Grid>
        
        {/* Number type specific fields */}
        {spec.type === 'number' && (
          <>
            <Grid item xs={12} md={4}>
              <TextField
                label="Min Value"
                type="number"
                fullWidth
                value={spec.min || ''}
                onChange={(e) => updateField('min', e.target.value ? Number(e.target.value) : undefined)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Max Value"
                type="number"
                fullWidth
                value={spec.max || ''}
                onChange={(e) => updateField('max', e.target.value ? Number(e.target.value) : undefined)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Step"
                type="number"
                fullWidth
                value={spec.step || 1}
                onChange={(e) => updateField('step', e.target.value ? Number(e.target.value) : 1)}
                inputProps={{ min: 0.0001, step: 0.0001 }}
              />
            </Grid>
          </>
        )}
        
        {/* Select type specific fields */}
        {spec.type === 'select' && (
          <Grid item xs={12}>
            <TextField
              label="Options (one per line, format: value|label)"
              multiline
              rows={3}
              fullWidth
              value={spec.options ? spec.options.map(o => `${o.value}|${o.label}`).join('\n') : ''}
              onChange={(e) => {
                const options = e.target.value.split('\n')
                  .filter(line => line.trim())
                  .map(line => {
                    const parts = line.split('|');
                    const value = parts[0].trim();
                    const label = parts.length > 1 ? parts[1].trim() : value;
                    return { value, label };
                  });
                updateField('options', options);
              }}
              placeholder="red|Red Color"
              helperText="Example: red|Red Color"
            />
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default SpecificationField;
