# setup-https-dev.ps1
# PowerShell script to create a self-signed certificate for local HTTPS development
# and configure both the React frontend and Flask backend to use it

# Parameters
param (
    [string]$CommonName = "localhost",
    [string]$CertPath = "./certificates",
    [int]$ValidDays = 365
)

Write-Host "Setting up HTTPS for Collectify development environment..." -ForegroundColor Green
Write-Host "-------------------------------------------------------------------------" -ForegroundColor Green

# Ensure certificate directory exists
if (-not (Test-Path -Path $CertPath)) {
    Write-Host "Creating certificate directory at $CertPath..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $CertPath -Force | Out-Null
}

# File paths
$CertFilePath = Join-Path -Path $CertPath -ChildPath "server.crt"
$KeyFilePath = Join-Path -Path $CertPath -ChildPath "server.key"
$PfxFilePath = Join-Path -Path $CertPath -ChildPath "server.pfx"
$FrontendEnvFilePath = "./frontend/.env.local"
$BackendCertDir = "./backend/certificates"

# Check if certificate already exists
if (Test-Path -Path $CertFilePath) {
    Write-Host "Certificate already exists at $CertFilePath" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Exiting without overwriting certificate." -ForegroundColor Yellow
        exit
    }
}

# Generate certificate with OpenSSL (check if available first)
try {
    $opensslVersion = openssl version
    Write-Host "Using OpenSSL: $opensslVersion" -ForegroundColor Cyan
    
    # Generate private key
    Write-Host "Generating private key..." -ForegroundColor Cyan
    openssl genrsa -out $KeyFilePath 2048
    
    # Generate certificate signing request
    Write-Host "Generating certificate signing request..." -ForegroundColor Cyan
    $subj = "/C=IT/ST=Liguria/L=Genova/O=Collectify/OU=Development/CN=$CommonName"
    
    # Create a minimal openssl.cnf file if it doesn't exist
    $opensslConfigPath = Join-Path $CertPath "openssl.cnf"
    if (-not (Test-Path $opensslConfigPath)) {
        $opensslConfigContent = @"
[ req ]
default_bits = 2048
default_keyfile = server.key
distinguished_name = req_distinguished_name
req_extensions = req_ext
prompt = no

[ req_distinguished_name ]
C = IT
ST = Liguria
L = Genova
O = Collectify
OU = Development
CN = $CommonName

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = $CommonName
DNS.2 = localhost
"@
        Set-Content -Path $opensslConfigPath -Value $opensslConfigContent
        Write-Host "Created OpenSSL config file at $opensslConfigPath" -ForegroundColor Cyan
    }
    
    # Use the config file explicitly
    openssl req -new -key $KeyFilePath -out "$CertPath/server.csr" -config $opensslConfigPath
    
    # Generate self-signed certificate
    Write-Host "Generating self-signed certificate..." -ForegroundColor Cyan
    openssl x509 -req -days $ValidDays -in "$CertPath/server.csr" -signkey $KeyFilePath -out $CertFilePath -extensions req_ext -extfile $opensslConfigPath
    
    # Generate PFX file for Windows
    Write-Host "Generating PFX file..." -ForegroundColor Cyan
    openssl pkcs12 -export -out $PfxFilePath -inkey $KeyFilePath -in $CertFilePath -passout pass:collectify
    
    # Clean up CSR file
    Remove-Item -Path "$CertPath/server.csr" -Force
    
} 
catch {
    Write-Host "OpenSSL not found or error generating certificate with OpenSSL: $_" -ForegroundColor Red
    Write-Host "Falling back to PowerShell certificate generation..." -ForegroundColor Yellow

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
    
    # Try to extract private key to create key file (this is not always possible with PowerShell)
    try {
        # This is a workaround to get the private key from a PFX file
        $tempDir = Join-Path $CertPath "temp"
        if (-not (Test-Path $tempDir)) {
            New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
        }
        
        # We'll use OpenSSL just for extracting the key if available
        openssl pkcs12 -in $PfxFilePath -nocerts -out "$tempDir/temp.key" -nodes -password pass:collectify
        openssl rsa -in "$tempDir/temp.key" -out $KeyFilePath
        
        # Clean up
        Remove-Item -Path $tempDir -Recurse -Force
        Write-Host "Successfully extracted private key to $KeyFilePath" -ForegroundColor Green
    }
    catch {
        Write-Host "Could not extract private key to separate file: $_" -ForegroundColor Yellow
        Write-Host "Using PFX file for both certificate and key." -ForegroundColor Yellow
    }
}

# Create/update .env.local file to enable HTTPS in frontend development
$envContent = @"
# HTTPS Configuration
HTTPS=true
SSL_CRT_FILE=../certificates/server.crt
SSL_KEY_FILE=../certificates/server.key
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
        $currentEnvContent = $currentEnvContent -replace "SSL_KEY_FILE=.*", "SSL_KEY_FILE=../certificates/server.key"
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
Copy-Item -Path $KeyFilePath -Destination "$BackendCertDir/server.key" -Force

# Trust the certificate on Windows
if ($IsWindows -or [System.Environment]::OSVersion.Platform -eq "Win32NT") {
    Write-Host "Installing certificate to trusted root store..." -ForegroundColor Cyan
    Import-PfxCertificate -FilePath $PfxFilePath -CertStoreLocation "Cert:\LocalMachine\Root" -Password (ConvertTo-SecureString -String "collectify" -Force -AsPlainText) | Out-Null
    Write-Host "Certificate installed to trusted root store." -ForegroundColor Green
} else {
    Write-Host "Certificate trust must be manually configured on this operating system." -ForegroundColor Yellow
    Write-Host "On macOS, you can use: sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CertFilePath" -ForegroundColor Yellow
    Write-Host "On Linux, the process varies by distribution." -ForegroundColor Yellow
}

Write-Host "-------------------------------------------------------------------------" -ForegroundColor Green
Write-Host "HTTPS setup complete! Both frontend and backend are now configured to use HTTPS." -ForegroundColor Green
Write-Host "Certificate location: $CertFilePath" -ForegroundColor Cyan
Write-Host "Private key location: $KeyFilePath" -ForegroundColor Cyan
Write-Host "PFX file location: $PfxFilePath (password: collectify)" -ForegroundColor Cyan
Write-Host "Frontend: https://localhost:3000" -ForegroundColor Green
Write-Host "Backend: https://localhost:5000" -ForegroundColor Green
Write-Host "-------------------------------------------------------------------------" -ForegroundColor Green

# Create .env.local-template with instructions
$templatePath = "./frontend/.env.local-template"
$templateContent = @"
# HTTPS Configuration for Collectify
# Copy this file to .env.local to enable HTTPS for the frontend

# Enable HTTPS
HTTPS=true

# Certificate paths (relative to frontend directory)
SSL_CRT_FILE=../certificates/server.crt
SSL_KEY_FILE=../certificates/server.key

# Ensure API URL uses HTTPS
REACT_APP_API_URL=https://localhost:5000/api

# Skip certificate validation in development
NODE_TLS_REJECT_UNAUTHORIZED=0
"@
Set-Content -Path $templatePath -Value $templateContent
Write-Host "Created template file at $templatePath" -ForegroundColor Cyan

# Instructions for adding certificate trust exceptions in different browsers
Write-Host "Browser Security Notes:" -ForegroundColor Magenta
Write-Host "1. Chrome/Edge: You may need to type 'thisisunsafe' on the warning page" -ForegroundColor Magenta
Write-Host "2. Firefox: Click 'Advanced' and 'Accept the Risk and Continue'" -ForegroundColor Magenta
Write-Host "3. Safari: Click 'Show Details' and 'visit this website'" -ForegroundColor Magenta
Write-Host "4. Mobile browsers: Certificate acceptance procedures vary by device" -ForegroundColor Magenta
Write-Host "-------------------------------------------------------------------------" -ForegroundColor Green