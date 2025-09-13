# Running Collectify with HTTPS in VS Code

This document explains how to run both the frontend and backend with HTTPS support using VS Code.

## Prerequisites

1. Make sure you've generated certificates by running one of the setup scripts:
   ```powershell
   # Option 1: OpenSSL-based approach
   ./setup-https-dev.ps1
   
   # Option 2: PowerShell-based approach (no OpenSSL required)
   ./setup-https-simple.ps1
   ```

2. Ensure that the certificates are located in the correct folders:
   - For CRT+KEY approach: `certificates/server.crt` and `certificates/server.key`
   - For PFX approach: `certificates/server.pfx`

## Using VS Code Launch Configurations

### Option 1: Using the Debug View

1. Open the Debug view in VS Code (Ctrl+Shift+D)
2. From the dropdown menu, select one of the following:
   - **Full Stack (HTTP)** - Runs both frontend and backend with HTTP
   - **Full Stack (HTTPS)** - Runs both frontend and backend with HTTPS using CRT+KEY
   - **Full Stack (Flexible HTTPS)** - Runs both frontend and backend with HTTPS supporting both CRT+KEY and PFX
   - **Full Stack (Direct HTTPS)** - Runs both frontend and backend with HTTPS using app.py directly with environment variables
   - **Full Stack (Flask CLI HTTPS)** - Runs both frontend and backend with HTTPS using Flask CLI (recommended for development)
   - **BE: Flask (HTTP)** - Runs only the backend with HTTP
   - **BE: Flask (HTTPS)** - Runs only the backend with HTTPS using CRT+KEY
   - **BE: Flask (Flexible HTTPS)** - Runs only the backend with HTTPS supporting both CRT+KEY and PFX
   - **BE: Flask Direct (HTTPS)** - Runs only the backend with HTTPS using app.py directly with environment variables
   - **BE: Flask CLI (HTTPS)** - Runs only the backend with HTTPS using Flask CLI (recommended for development)
   - **Chrome (HTTPS)** - Opens Chrome with HTTPS support
   - **Edge (HTTPS)** - Opens Edge with HTTPS support

3. Click the green play button to start the selected configuration

### Option 2: Using VS Code Tasks

1. Open the Command Palette (Ctrl+Shift+P)
2. Type "Run Task" and select "Tasks: Run Task"
3. Choose one of the following tasks:
   - **Start Full Stack (HTTP)** - Starts both backend and frontend with HTTP
   - **Start Full Stack (HTTPS)** - Starts both backend and frontend with HTTPS
   - **Start Full Stack (Flexible HTTPS)** - Starts both backend and frontend with flexible HTTPS
   - **Start Full Stack (Direct HTTPS)** - Starts both backend and frontend with direct HTTPS
   - **Frontend: Start (HTTP)** - Starts only the frontend with HTTP
   - **Frontend: Start (HTTPS)** - Starts only the frontend with HTTPS
   - **Frontend: Start (HTTPS PFX)** - Starts only the frontend with HTTPS using PFX
   - **Backend: Start (HTTP)** - Starts only the backend with HTTP
   - **Backend: Start (HTTPS)** - Starts only the backend with HTTPS
   - **Backend: Start (Flexible HTTPS)** - Starts only the backend with flexible HTTPS
   - **Backend: Start (Flask CLI HTTPS)** - Starts only the backend with Flask CLI HTTPS

## Using npm Scripts Directly

You can also run the frontend with HTTPS directly using npm:

```bash
cd frontend
# Using CRT+KEY certificates
npm run start:https

# Using CRT+KEY with NODE_TLS_REJECT_UNAUTHORIZED=0 (helps with local development)
npm run start:https:local

# Using PFX certificate (when using setup-https-simple.ps1)
npm run start:https:pfx
```

## Using Python Directly for Backend

To run the backend with HTTPS directly:

```bash
cd backend
# Using the standard approach (requires CRT+KEY)
python run_with_https.py

# Using the flexible approach (supports both CRT+KEY and PFX)
python run_with_flexible_https.py

# Using app.py directly with environment variables
# For CRT+KEY:
$env:SSL_CERT_FILE = "../certificates/server.crt"
$env:SSL_KEY_FILE = "../certificates/server.key"
python app.py

# For PFX:
$env:SSL_PFX_FILE = "../certificates/server.pfx"
$env:SSL_PFX_PASSWORD = "collectify"
python app.py

# Using Flask CLI with HTTPS (recommended for development)
$env:FLASK_APP = "flask_https.py"
$env:FLASK_DEBUG = "1"
$env:SSL_CERT_FILE = "../certificates/server.crt"
$env:SSL_KEY_FILE = "../certificates/server.key"
python -m flask run
```

The flexible script and the direct app.py approach will automatically detect and use whichever certificate format is available.

## Starting Everything with One Command

We've created convenient scripts to start both frontend and backend with HTTPS:

```powershell
# Traditional approach (requires OpenSSL)
./start-https.ps1

# Flexible approach (works with both CRT+KEY and PFX)
./start-https-flexible.ps1

# Direct approach (using app.py with environment variables)
./start-https-direct.ps1

# Flask CLI approach (recommended for development)
./start-https-flask-cli.ps1
```

## Troubleshooting

1. **Certificate Trust Issues**: Browser warnings about untrusted certificates are normal with self-signed certificates. You may need to click "Advanced" and "Proceed anyway" (or similar) in your browser.

2. **Chrome/Edge Special Method**: For Chrome/Edge, you may need to type "thisisunsafe" while the warning page is active to bypass the certificate warning.

3. **API Connection Issues**: If the frontend has trouble connecting to the backend API, ensure both are using the same protocol (both HTTP or both HTTPS).

4. **Certificate Path Issues**: Make sure the certificates are in the correct location and properly referenced in your environment variables and scripts.

5. **Missing Certificates**: If certificates are missing, run one of the setup scripts again to generate them.

6. **OpenSSL Configuration Issues**: If you encounter OpenSSL errors like "Can't open openssl.cnf":
   - Try using the updated `setup-https-dev.ps1` which creates a local configuration file
   - Or use the alternative `setup-https-simple.ps1` which doesn't require OpenSSL at all

7. **PFX Password**: The default password for the PFX file is `collectify`. This is used by both the frontend and backend scripts.