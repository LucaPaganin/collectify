"""Gunicorn configuration for Collectify application."""
import multiprocessing

# Gunicorn settings
# Bind to 0.0.0.0:8000
bind = "0.0.0.0:8000"

# Number of worker processes
# A common formula is (2 x $num_cores) + 1
workers = multiprocessing.cpu_count() * 2 + 1

# Worker timeout in seconds
timeout = 120

# Worker class
worker_class = "sync"  # Options: sync, eventlet, gevent, tornado

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = "info"

# Process name
proc_name = "collectify"

# Graceful timeout in seconds
graceful_timeout = 30

# Maximum requests before worker restart
max_requests = 1000
max_requests_jitter = 50  # Add randomness to max_requests

# Preload application to reduce memory usage
preload_app = True

# File monitoring to auto-reload on changes (disable in production)
reload = False
