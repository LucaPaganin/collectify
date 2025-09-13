# HTTPS Setup for Local Development

This document describes how to set up HTTPS for local development in the Collectify project.

## Why HTTPS for Local Development?

Certain browser features require a secure context (HTTPS) to work properly, including:

- Camera access (getUserMedia)
- Geolocation
- Service Workers
- Many other modern web APIs

Using HTTPS locally helps ensure your development environment closely matches production, reducing the chance of unexpected issues when deploying.

## Setting Up HTTPS

### Automated Setup (Recommended)

1. Run the provided PowerShell script:

```powershell
# From the project root
./setup-https-dev.ps1
```

This script will:
- Generate a self-signed certificate for localhost
- Configure the React development server to use HTTPS
- Install the certificate to your trusted root store (on Windows)
- Create/update necessary environment files

### Manual Setup

If the script doesn't work for your environment, you can perform these steps manually:

1. **Generate a self-signed certificate**:

   Using OpenSSL:
   ```bash
   mkdir -p frontend/cert
   openssl genrsa -out frontend/cert/localhost.key 2048
   openssl req -new -key frontend/cert/localhost.key -out frontend/cert/localhost.csr -subj "/C=US/ST=State/L=City/O=Collectify/OU=Development/CN=localhost"
   openssl x509 -req -days 365 -in frontend/cert/localhost.csr -signkey frontend/cert/localhost.key -out frontend/cert/localhost.crt
   ```

2. **Configure React to use HTTPS**:

   Create or update `frontend/.env.local`:
   ```
   HTTPS=true
   SSL_CRT_FILE=./cert/localhost.crt
   SSL_KEY_FILE=./cert/localhost.key
   ```

3. **Trust the certificate** (platform-specific):

   - **Windows**: Double-click the .crt file and install it to the "Trusted Root Certification Authorities" store
   - **macOS**: `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain frontend/cert/localhost.crt`
   - **Linux**: Varies by distribution

## Accessing the Application

After setup, start the frontend as usual:

```bash
cd frontend
npm start
```

The application will now be available at:
- https://localhost:3000

## Handling Certificate Warnings

Even with trusted certificates, browsers may show warnings. Here's how to bypass them:

- **Chrome/Edge**: Type "thisisunsafe" anywhere on the warning page
- **Firefox**: Click "Advanced" and then "Accept the Risk and Continue"
- **Safari**: Click "Show Details" then "visit this website"

## Troubleshooting

1. **Certificate not trusted**: 
   - Ensure you've installed the certificate to your system's trusted root store
   - Check that the certificate was generated correctly

2. **React server won't start with HTTPS**:
   - Verify paths in `.env.local` are correct
   - Check that certificate files have proper permissions

3. **Camera still not working**:
   - Ensure you're accessing the site via HTTPS
   - Check browser permissions for the camera
   - Try a different browser to isolate the issue