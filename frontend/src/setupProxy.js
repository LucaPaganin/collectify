const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Determine the API target URL with fallbacks
  const apiTarget = process.env.API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  console.log(`[Proxy] Setting up API proxy to: ${apiTarget}`);
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error(`[Proxy Error] ${err.message}`);
        res.status(500).json({
          error: 'Proxy Error',
          message: `Could not connect to the API server at ${apiTarget}`,
          details: err.message
        });
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} ${req.url} -> ${apiTarget}${req.url}`);
      }
    })
  );
  
  // Also proxy the uploads directory
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error(`[Uploads Proxy Error] ${err.message}`);
        res.status(500).send('Error accessing uploaded file');
      }
    })
  );
};