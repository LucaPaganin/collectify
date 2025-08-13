#!/bin/bash

# Log all commands
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

# Set up environment
export PYTHONPATH=$PYTHONPATH:$(pwd)
export FLASK_APP=app.py
export FLASK_ENV=production

# Install pip if needed
if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
    echo "Installing pip..."
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    $PYTHON_PATH get-pip.py
    rm get-pip.py
fi

# Find pip again
PIP_PATH=$(which pip3 || which pip)
echo "Using pip at: $PIP_PATH"

# Install wfastcgi
echo "Installing wfastcgi..."
$PYTHON_PATH -m pip install wfastcgi
$PYTHON_PATH -m wfastcgi.install --add-to-path

# Ensure dependencies are installed
echo "Installing dependencies..."
$PYTHON_PATH -m pip install -r requirements.txt

# Initialize database
echo "Initializing database..."
mkdir -p data
$PYTHON_PATH init_all_tables.py

# Install gunicorn
echo "Installing Gunicorn..."
$PYTHON_PATH -m pip install gunicorn

# Start Gunicorn
echo "Starting Gunicorn..."
$PYTHON_PATH -m gunicorn --bind=0.0.0.0:${PORT:-8000} --workers=4 app:app
