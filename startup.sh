#!/bin/bash

# This is a one-time setup script that runs during App Service startup
# It should NOT run the server - Azure App Service will handle that

# Log all commands for debugging
set -x

echo "Starting Collectify application in Azure App Service..."

# Find Python in the system
echo "Looking for Python..."
PYTHON_PATH=$(which python3 || which python)
if [ -z "$PYTHON_PATH" ]; then
  # Try common locations in Azure
  for path in /usr/bin/python3 /usr/bin/python /home/site/wwwroot/env/bin/python /opt/python/latest/bin/python
  do
    if [ -f "$path" ]; then
      PYTHON_PATH=$path
      break
    fi
  done
fi

echo "Using Python at: $PYTHON_PATH"

# Print important environment variables for debugging
echo "PYTHONPATH: $PYTHONPATH"
echo "HOME: $HOME"
echo "PATH: $PATH"
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"

# Locate app directory
if [ -d "/app" ]; then
    APP_DIR="/app"
elif [ -d "/home/site/wwwroot" ]; then
    APP_DIR="/home/site/wwwroot"
else
    APP_DIR="$(pwd)"
fi

echo "Using app directory: $APP_DIR"
cd "$APP_DIR"

# Set up environment
export FLASK_APP=app.py
export FLASK_ENV=production

# Check for gunicorn
if command -v gunicorn &> /dev/null; then
    echo "Running with gunicorn..."
    gunicorn --bind=0.0.0.0:5000 app:app
else
    echo "Running with Flask development server..."
    python app.py
fi
