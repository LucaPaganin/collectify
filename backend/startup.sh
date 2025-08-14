#!/bin/bash
# Simple startup script for Azure App Service

# Log all commands for debugging
set -x

echo "Starting Collectify application..."
cd /app
python app.py
