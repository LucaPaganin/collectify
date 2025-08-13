#!/bin/bash

# This is a one-time setup script that runs during App Service startup
# It should NOT run the server - Azure App Service will handle that

# Log all commands for debugging
set -x

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

# Set up environment - these are only for this script, not for the app service
export PYTHONPATH=$PYTHONPATH:$(pwd)
export FLASK_APP=app.py
export FLASK_ENV=production
export PATH=$PATH:/home/.local/bin

# Ensure dependencies are installed
echo "Installing dependencies..."
$PYTHON_PATH -m pip install -r requirements.txt

# Initialize database
echo "Initializing database..."
mkdir -p data
$PYTHON_PATH init_all_tables.py

# Install gunicorn (for Azure to use)
echo "Installing Gunicorn..."
$PYTHON_PATH -m pip install gunicorn

echo "Setup completed successfully. Azure App Service will now start the application."
# Do NOT start the server here - Azure App Service will handle that
