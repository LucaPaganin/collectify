import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import styles from './ApiConnectivityWarning.module.css';

const ApiConnectivityWarning = ({ apiStatus, apiUrl }) => {
  const [dismissed, setDismissed] = useState(false);

  const isHttpsMismatch = useMemo(() => {
    return (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      typeof apiUrl === 'string' &&
      apiUrl.startsWith('http:')
    );
  }, [apiUrl]);

  const fallbackHttpUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return window.location.href.replace('https:', 'http:');
  }, []);

  if (!apiStatus?.checked || apiStatus?.connected || dismissed) {
    return null;
  }

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className={styles.overlay} role="alert">
      <Box className={styles.alertWrapper}>
        <Alert
          severity="error"
          variant="filled"
          action={(
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button color="inherit" variant="contained" size="small" onClick={handleRetry}>
                Retry Connection
              </Button>
              <Button color="inherit" variant="outlined" size="small" onClick={handleDismiss}>
                Dismiss
              </Button>
            </Stack>
          )}
        >
          <AlertTitle>API Connection Error</AlertTitle>
          <Typography component="span">
            Unable to connect to the API server at{' '}
            <Typography component="code" sx={{ fontSize: '0.9em' }}>
              {apiUrl}
            </Typography>
          </Typography>

          {isHttpsMismatch && (
            <Box className={styles.mismatchBox}>
              <Typography fontWeight={600} gutterBottom>
                Mixed Content Issue
              </Typography>
              <Typography variant="body2" gutterBottom>
                You are accessing the frontend over HTTPS, but the API is configured for HTTP. Try one of these solutions:
              </Typography>
              <Typography component="ol" variant="body2" sx={{ pl: 2, my: 0 }}>
                <li>Configure the backend to use HTTPS as well.</li>
                <li>
                  Access the frontend using HTTP instead:
                  {' '}
                  <Link className={styles.helpLink} href={fallbackHttpUrl} target="_blank" rel="noopener">
                    {fallbackHttpUrl}
                  </Link>
                </li>
              </Typography>
            </Box>
          )}

          {apiStatus?.suggestedUrl && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Try accessing the app using this URL instead:{' '}
              <Link
                className={styles.helpLink}
                href={apiStatus.suggestedUrl.replace('/api', '')}
                target="_blank"
                rel="noopener"
              >
                {apiStatus.suggestedUrl.replace('/api', '')}
              </Link>
            </Typography>
          )}
        </Alert>
      </Box>
    </div>
  );
};

ApiConnectivityWarning.propTypes = {
  apiStatus: PropTypes.shape({
    checked: PropTypes.bool,
    connected: PropTypes.bool,
    suggestedUrl: PropTypes.string
  }).isRequired,
  apiUrl: PropTypes.string.isRequired
};

export default ApiConnectivityWarning;
