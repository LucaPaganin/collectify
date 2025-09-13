# HTTPS Setup for Collectify

This document explains how to set up and use HTTPS for both the frontend and backend components of Collectify. HTTPS is important for several reasons:

1. It provides a secure connection between the client and server
2. It's required for certain browser features like camera access on mobile devices
3. It prevents mixed content warnings when accessing sensitive features

## Prerequisites

- Node.js and npm for the frontend
- Python for the backend
- OpenSSL (optional - we now provide alternative methods if OpenSSL is not available)

## Quick Start with Flexible HTTPS

We've created a new flexible HTTPS setup that works with multiple certificate types and doesn't require OpenSSL:

```powershell
# Run this script to set up certificates (one-time setup)
./setup-https-simple.ps1

# Then start the application with HTTPS
./start-https-flexible.ps1

# Or use the direct approach (built into app.py)
./start-https-direct.ps1
```

These approaches will:
- Generate self-signed certificates using PowerShell (no OpenSSL required)
- Support both traditional CRT+KEY and PFX certificate formats
- Configure both frontend and backend for HTTPS
- Start all services automatically

## Frontend HTTPS Setup

The React development server can be configured to use HTTPS in several ways:

### 1. Using the Automatic Setup Script

Run one of the following commands from the project root:

```powershell
# OpenSSL-based approach
./start-https.ps1

# Flexible approach (works with both CRT+KEY and PFX)
./start-https-flexible.ps1

# Direct approach (using app.py with environment variables)
./start-https-direct.ps1
```

### 2. Manual HTTPS Configuration

If you prefer to set up HTTPS manually:

#### Option A: Using CRT+KEY Files

1. Create a `.env.local` file in the `frontend` directory with the following content:
   ```
   HTTPS=true
   SSL_CRT_FILE=../certificates/server.crt
   SSL_KEY_FILE=../certificates/server.key
   ```

2. Generate self-signed certificates using OpenSSL:
   ```
   mkdir certificates
   cd certificates
   openssl genrsa -out server.key 2048
   openssl req -new -key server.key -out server.csr -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
   openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
   ```

3. Start the React development server:
   ```
   cd frontend
   npm start
   ```

#### Option B: Using PFX Files

1. Generate a PFX certificate using PowerShell:
   ```powershell
   ./setup-https-simple.ps1
   ```

2. Start the React development server with PFX support:
   ```
   cd frontend
   npm run start:https:pfx
   ```

## Backend HTTPS Setup

The Flask backend can be configured to use HTTPS in multiple ways:

### Option A: Using the Standard HTTPS Script

```
cd backend
python run_with_https.py
```

### Option B: Using the Flexible HTTPS Script

```
cd backend
python run_with_flexible_https.py
```

The flexible script will automatically detect and use either CRT+KEY files or a PFX file, providing better compatibility across different setups.

### Option C: Using app.py Directly with Environment Variables

The `app.py` has been updated to support HTTPS directly via environment variables:

```
cd backend

# Using CRT+KEY files
$env:SSL_CERT_FILE = "../certificates/server.crt"
$env:SSL_KEY_FILE = "../certificates/server.key"
python app.py

# OR using PFX file
$env:SSL_PFX_FILE = "../certificates/server.pfx"
$env:SSL_PFX_PASSWORD = "collectify"
python app.py
```

This approach is ideal for production environments where you want to keep your certificate configuration in environment variables.

### Option D: Using Flask CLI with HTTPS Support

We've added a custom extension to Flask CLI that supports HTTPS. This is the recommended approach when using Flask's development server:

```
cd backend

# Set environment variables
$env:FLASK_APP = "flask_https.py"
$env:FLASK_DEBUG = "1"
$env:SSL_CERT_FILE = "../certificates/server.crt"
$env:SSL_KEY_FILE = "../certificates/server.key"

# Run Flask with CLI
python -m flask run
```

Or simply use our convenience script:

```
# On PowerShell
./start-https-flask-cli.ps1

# On CMD
start-https-flask-cli.bat
```

This approach is compatible with Flask's recommended way of launching the development server using `python -m flask run` while still providing HTTPS support.

## Full Application HTTPS

To run both frontend and backend with HTTPS, use one of our convenient scripts:

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

## Certificate Generation Options

We now provide multiple ways to generate SSL certificates:

### Option A: OpenSSL-based (Traditional)

```powershell
./setup-https-dev.ps1
```

This script uses OpenSSL to generate traditional CRT+KEY certificate files.

### Option B: PowerShell-based (Simple)

```powershell
./setup-https-simple.ps1
```

This script uses PowerShell's certificate tools to generate a PFX file, which works with our flexible HTTPS setup.

## Handling Certificate Warnings

Since we're using self-signed certificates, browsers will display security warnings. Here's how to handle them:

1. When you access the application, you'll see a security warning
2. Click "Advanced" and then "Proceed to localhost (unsafe)"
3. You might need to do this for both the frontend and backend URLs

For Chrome on Android, you may need to type "thisisunsafe" while on the warning page to proceed.

## Camera Access with HTTPS

Using HTTPS should resolve camera access issues on mobile devices that require a secure context. If you're still experiencing issues:

1. Ensure both frontend and backend are using HTTPS
2. Check that there are no mixed content warnings in the browser console
3. Make sure the device has camera permissions enabled for the browser
4. Try using different browsers if available

## Troubleshooting

### API Connection Issues with HTTPS

If you see API connection errors after switching to HTTPS:

1. Check that both frontend and backend are using the same protocol (both HTTP or both HTTPS)
2. Verify that the API URL in the frontend configuration matches the protocol of the backend
3. Check the browser console for mixed content warnings

### Certificate Generation Failures

If certificate generation fails:

#### OpenSSL Issues

1. If you see "Can't open openssl.cnf" errors, try using our improved script:
   ```powershell
   ./setup-https-dev.ps1
   ```
   This script will create a local OpenSSL configuration file.

2. If OpenSSL continues to cause issues, use our alternative approach:
   ```powershell
   ./setup-https-simple.ps1
   ```
   This script uses PowerShell's certificate tools instead of OpenSSL.

#### PowerShell Certificate Issues

1. Make sure you're running PowerShell as an administrator
2. Check if PowerShell's execution policy allows running scripts
3. If you get permission errors, try:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Browser Security Restrictions

Some browsers have strict security policies for local development:

1. For Chrome, you can use the `--ignore-certificate-errors` flag when launching for testing
2. For Firefox, you can add a security exception for the self-signed certificate
3. For Safari, you may need to enable developer options to allow self-signed certificates

## Using VS Code with HTTPS

VS Code debugging has been configured to support HTTPS:

1. Open the "Run and Debug" panel
2. Select one of the following configurations:
   - **Full Stack (HTTPS)** - Uses the run_with_https.py script
   - **Full Stack (Flexible HTTPS)** - Uses the run_with_flexible_https.py script
   - **Full Stack (Direct HTTPS)** - Uses app.py directly with environment variables
   - **Full Stack (Flask CLI HTTPS)** - Uses Flask CLI with HTTPS support
3. Press F5 to start debugging

This will launch both the backend and frontend with HTTPS support.

If you prefer using VS Code tasks, we've also added dedicated tasks:
- **Backend: Start (HTTPS)** - Uses the run_with_https.py script
- **Backend: Start (Flexible HTTPS)** - Uses the run_with_flexible_https.py script 
- **Backend: Start (Flask CLI HTTPS)** - Uses Flask CLI with HTTPS support

## Camera Component Improvements

The camera component has been updated to provide better error handling and user feedback regarding HTTPS requirements:

1. It detects when the application is running without HTTPS and warns users about potential camera access issues
2. It provides device-specific troubleshooting suggestions
3. It handles different types of camera errors with appropriate messages

By following this guide, you should be able to set up and use HTTPS successfully for both development and testing of the Collectify application.