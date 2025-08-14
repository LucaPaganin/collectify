#!/bin/bash
# Startup script for Collectify backend

# Log all commands for debugging
set -x

echo "Starting Collectify application..."

# Run database migrations
echo "Running database migrations..."

# Initialize tables if needed
echo "Running init_all_tables.py..."
python init_all_tables.py

# # Run migrations
# echo "Running migrate_users.py..."
# python migrate_users.py

# echo "Running migrate_specifications.py..."
# python migrate_specifications.py

# echo "Running migrate_category_timestamps.py..."
# python migrate_category_timestamps.py

# Start the application
echo "Starting web server..."
gunicorn --bind=0.0.0.0:5000 --config=gunicorn_config.py app:app
