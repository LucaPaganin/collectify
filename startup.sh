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

# Print important environment variables for debugging
echo "PYTHONPATH: $PYTHONPATH"
echo "HOME: $HOME"
echo "PATH: $PATH"

# Set up environment
export PYTHONPATH=$PYTHONPATH:/home/site/wwwroot
export FLASK_APP=app.py
export FLASK_ENV=production
export FLASK_DEBUG=1
export PATH=$PATH:/home/.local/bin

# Show the current directory structure
echo "Printing site directory structure..."
find /home/site -type d | sort

# Check if we're running from package
if [ "$WEBSITE_RUN_FROM_PACKAGE" == "1" ]; then
    echo "Running from package mode detected (WEBSITE_RUN_FROM_PACKAGE=1)"
    echo "App files are in the wwwroot directory, but not directly accessible:"
    ls -la /home/site/wwwroot || echo "Cannot list wwwroot"
else
    echo "Standard deployment mode detected"
    echo "App directory contents:"
    ls -la || echo "Cannot list current directory"
fi

# Ensure dependencies are installed
echo "Installing dependencies..."
$PYTHON_PATH -m pip install --upgrade pip
$PYTHON_PATH -m pip install -r requirements.txt
$PYTHON_PATH -m pip install gunicorn

# Initialize database
echo "Initializing database..."
mkdir -p /home/data
touch /home/data/collectibles.db
export COLLECTIFY_DB_PATH=/home/data/collectibles.db
$PYTHON_PATH init_all_tables.py || echo "Failed to initialize database, but continuing..."

echo "Setup completed successfully. Azure App Service will now start the application."
# Do NOT start the server here - Azure App Service will handle that
