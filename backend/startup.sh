#!/bin/bash
# Simple startup script for Azure App Service

# Log all commands for debugging
set -x

echo "Starting Collectify application..."
gunicorn --bind=0.0.0.0:5000 app:app
