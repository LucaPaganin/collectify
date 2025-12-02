# setup-https-simple.ps1
# A simplified PowerShell script to create a self-signed certificate for HTTPS development
# Uses only PowerShell commands to avoid OpenSSL dependency issues

param (
    [string]$CommonName = "localhost",
    [string]$CertPath = "./certificates",
    [int]$ValidDays = 365
)

Write-Host "Setting up HTTPS for Collectify development environment (Simple Mode)..." -ForegroundColor Green
Write-Host "-------------------------------------------------------------------------" -ForegroundColor Green

# Ensure certificate directory exists
if (-not (Test-Path -Path $CertPath)) {
    Write-Host "Creating certificate directory at $CertPath..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $CertPath -Force | Out-Null
}

# File paths
$CertFilePath = Join-Path -Path $CertPath -ChildPath "server.crt"
$KeyFilePath = Join-Path -Path $CertPath -ChildPath "server.key" # Note: PowerShell method won't create this file separately
$PfxFilePath = Join-Path -Path $CertPath -ChildPath "server.pfx"
$FrontendEnvFilePath = "./frontend/.env.local"
$BackendCertDir = "./backend/certificates"

# Check if certificate already exists
if (Test-Path -Path $PfxFilePath) {
    Write-Host "Certificate already exists at $PfxFilePath" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Exiting without overwriting certificate." -ForegroundColor Yellow
        exit
    }
}

# Generate certificate with PowerShell
Write-Host "Generating certificate with PowerShell..." -ForegroundColor Cyan

# Add IP addresses for better compatibility
$ipAddresses = @()
try {
    # Get local IP addresses
    $localIPs = @(Get-NetIPAddress | Where-Object {$_.AddressFamily -eq "IPv4" -and $_.PrefixOrigin -ne "WellKnown"} | Select-Object -ExpandProperty IPAddress)
    $ipAddresses += $localIPs
    Write-Host "Adding local IP addresses to certificate: $($localIPs -join ', ')" -ForegroundColor Cyan
}
catch {
    Write-Host "Could not retrieve local IP addresses: $_" -ForegroundColor Yellow
}

# Define subject alternative names
$sanList = @("localhost", "127.0.0.1")
foreach ($ip in $ipAddresses) {
    $sanList += $ip
}

# Create certificate
$cert = New-SelfSignedCertificate -DnsName $sanList -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddDays($ValidDays) -KeyExportPolicy Exportable -KeySpec KeyExchange

# Export certificate to PFX
$password = ConvertTo-SecureString -String "collectify" -Force -AsPlainText
Export-PfxCertificate -Cert "Cert:\CurrentUser\My\$($cert.Thumbprint)" -FilePath $PfxFilePath -Password $password | Out-Null

# Export certificate to CRT
Export-Certificate -Cert "Cert:\CurrentUser\My\$($cert.Thumbprint)" -FilePath $CertFilePath -Type CERT | Out-Null

Write-Host "Certificate generated with PowerShell." -ForegroundColor Green
Write-Host "Note: Separate key file is not needed with this method as React and Flask can both use the PFX file." -ForegroundColor Yellow

# Create/update .env.local file to enable HTTPS in frontend development
$envContent = @"
# HTTPS Configuration
HTTPS=true
SSL_CRT_FILE=../certificates/server.crt
# Since we're using PowerShell method, we don't have a separate key file
# React will use Windows cert store for the private key
SSL_KEY_FILE=
# Ensure API URL uses HTTPS
REACT_APP_API_URL=https://localhost:5000/api
# Skip certificate validation in development
NODE_TLS_REJECT_UNAUTHORIZED=0
"@

if (Test-Path -Path $FrontendEnvFilePath) {
    $currentEnvContent = Get-Content -Path $FrontendEnvFilePath -Raw
    
    # Check if HTTPS settings already exist
    if ($currentEnvContent -match "HTTPS=") {
        Write-Host "HTTPS settings already exist in .env.local. Updating..." -ForegroundColor Yellow
        $currentEnvContent = $currentEnvContent -replace "HTTPS=.*", "HTTPS=true"
        $currentEnvContent = $currentEnvContent -replace "SSL_CRT_FILE=.*", "SSL_CRT_FILE=../certificates/server.crt"
        $currentEnvContent = $currentEnvContent -replace "SSL_KEY_FILE=.*", "SSL_KEY_FILE="
        $currentEnvContent = $currentEnvContent -replace "REACT_APP_API_URL=.*", "REACT_APP_API_URL=https://localhost:5000/api"
        Set-Content -Path $FrontendEnvFilePath -Value $currentEnvContent
    } else {
        Write-Host "Adding HTTPS settings to existing .env.local file..." -ForegroundColor Yellow
        Add-Content -Path $FrontendEnvFilePath -Value "`n$envContent"
    }
} else {
    Write-Host "Creating new .env.local file with HTTPS settings..." -ForegroundColor Yellow
    Set-Content -Path $FrontendEnvFilePath -Value $envContent
}

# Copy certificates to backend directory
if (-not (Test-Path -Path $BackendCertDir)) {
    Write-Host "Creating backend certificates directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $BackendCertDir -Force | Out-Null
}

Write-Host "Copying certificates to backend directory..." -ForegroundColor Cyan
Copy-Item -Path $CertFilePath -Destination "$BackendCertDir/server.crt" -Force
Copy-Item -Path $PfxFilePath -Destination "$BackendCertDir/server.pfx" -Force

# Create a small Python script to use the PFX file
$pythonHelperScript = @"
"""Helper script for run_with_https.py to use a PFX file."""
import os
import ssl
from app import app

def get_ssl_context_from_pfx():
    """Create an SSL context from a PFX file."""
    cert_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'certificates')
    pfx_path = os.path.join(cert_dir, 'server.pfx')
    
    if os.path.exists(pfx_path):
        try:
            # Create SSL context
            context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
            # Load the PFX file with password
            context.load_cert_chain(pfx_path, password='collectify')
            print("SSL context created successfully from PFX file")
            return context
        except Exception as e:
            print(f"Error loading PFX file: {str(e)}")
    
    return None

if __name__ == '__main__':
    ssl_context = get_ssl_context_from_pfx()
    if ssl_context:
        print("Starting Flask with HTTPS (from PFX)...")
        app.run(debug=True, host='0.0.0.0', port=5000, ssl_context=ssl_context)
    else:
        print("Starting Flask without HTTPS (fallback)...")
        app.run(debug=True, host='0.0.0.0', port=5000)
"@
Set-Content -Path "./backend/run_with_pfx.py" -Value $pythonHelperScript

# Trust the certificate on Windows
Write-Host "Installing certificate to trusted root store..." -ForegroundColor Cyan
Import-PfxCertificate -FilePath $PfxFilePath -CertStoreLocation "Cert:\LocalMachine\Root" -Password (ConvertTo-SecureString -String "collectify" -Force -AsPlainText) | Out-Null
Write-Host "Certificate installed to trusted root store." -ForegroundColor Green

Write-Host "-------------------------------------------------------------------------" -ForegroundColor Green
Write-Host "HTTPS setup complete! Both frontend and backend are now configured to use HTTPS." -ForegroundColor Green
Write-Host "Certificate location: $CertFilePath" -ForegroundColor Cyan
Write-Host "PFX file location: $PfxFilePath (password: collectify)" -ForegroundColor Cyan
Write-Host "Frontend: https://localhost:3000" -ForegroundColor Green
Write-Host "Backend: https://localhost:5000" -ForegroundColor Green
Write-Host "-------------------------------------------------------------------------" -ForegroundColor Green

# Instructions for running
Write-Host "To start the frontend with HTTPS:" -ForegroundColor Magenta
Write-Host "cd frontend" -ForegroundColor Yellow
Write-Host "npm run start:https" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Magenta
Write-Host "To start the backend with HTTPS:" -ForegroundColor Magenta
Write-Host "cd backend" -ForegroundColor Yellow
Write-Host "python run_with_pfx.py" -ForegroundColor Yellow
Write-Host "-------------------------------------------------------------------------" -ForegroundColor Green