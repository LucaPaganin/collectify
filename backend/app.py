"""Main entry point for the Collectify application."""
import os
import logging
from logging.handlers import RotatingFileHandler
from config import create_app
from models import db, User
from utils.database import ensure_db_initialized

# Register CLI commandsontend import register_frontend_routes
from routes.categories import register_category_routes
from routes.items import register_item_routes
from routes.auth import auth_bp
from routes.admin_init import register_routes as register_admin_init_routes
from routes.static_routes import register_static_routes
from flask_cli import register_commands
from flask_cors import CORS
from utils.ssl_utils import get_ssl_context
import sys
import socket

# Create the Flask application
app = create_app()

# Configure CORS for all routes - permissive configuration
cors_origins = os.environ.get('CORS_ORIGINS', '*')
app.logger.info(f"Configuring permissive CORS with allowed origins: {cors_origins}")
CORS(app, 
     resources={r"/*": {
         "origins": cors_origins.split(","),
         "allow_headers": "*",
         "expose_headers": "*",
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
     }}, 
     send_wildcard=True)

def log_startup_info():
    """Log startup information on first request."""
    local_ip = get_local_ip()
    protocol = "https" if use_https else "http"
    
    app.logger.info("=" * 50)
    app.logger.info("Collectify application is now handling requests")
    app.logger.info(f"Protocol: {protocol.upper()}")
    app.logger.info(f"Local Access: {protocol}://127.0.0.1:5000")
    app.logger.info(f"LAN Access: {protocol}://{local_ip}:5000")
    app.logger.info(f"HTTPS is {'ENABLED' if use_https else 'DISABLED'}")
    app.logger.info("=" * 50)


def log_startup_info():
    """Log startup information on first request."""
    local_ip = get_local_ip()
    protocol = "https" if use_https else "http"
    
    app.logger.info("=" * 50)
    app.logger.info("Collectify application is running")
    app.logger.info(f"Protocol: {protocol.upper()}")
    app.logger.info(f"Local Access: {protocol}://127.0.0.1:5000")
    app.logger.info(f"LAN Access: {protocol}://{local_ip}:5000")
    app.logger.info(f"HTTPS is {'ENABLED' if use_https else 'DISABLED'}")
    app.logger.info("=" * 50)

def get_local_ip():
    try:
        # Get the local hostname
        hostname = socket.gethostname()
        # Get the local IP address
        local_ip = socket.gethostbyname(hostname)
        return local_ip
    except Exception as e:
        app.logger.warning(f"Could not determine local IP: {str(e)}")
        return "your_local_IP"




# Configure logging
if not app.debug:
    # Ensure logs directory exists
    if not os.path.exists('logs'):
        os.mkdir('logs')
    
    # Configure file handler with rotation (10MB max size, keep 10 backup files)
    file_handler = RotatingFileHandler('logs/collectify.log', maxBytes=10485760, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
    ))
    file_handler.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    
    # Also log to stderr
    app.logger.setLevel(logging.INFO)
    app.logger.info('Collectify startup')

# Initialize the database with our app
db.init_app(app)

# Register all routes
# register_frontend_routes(app)
register_category_routes(app)
register_item_routes(app)
register_admin_init_routes(app)
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Register static routes
register_static_routes(app)

# Print information about the environment
app.logger.info(f"Python version: {sys.version}")
app.logger.info(f"Python executable: {sys.executable}")
app.logger.info(f"Current directory: {os.getcwd()}")
app.logger.info(f"Static folder: {app.static_folder}")

# Determine HTTPS status early to ensure proper logging in all execution modes
ssl_context = get_ssl_context()
use_https = ssl_context is not None or os.environ.get('FLASK_HTTPS', '0').lower() in ('1', 'true', 'yes')
protocol = "https" if use_https else "http"
app.logger.info(f"Server protocol: {protocol.upper()}")
app.logger.info(f"HTTPS enabled: {use_https}")

# Using Flask's event system instead of before_first_request (which is removed in Flask 3.x)
# This will run when the first request is received
with app.app_context():
    # Ensure the database is initialized
    log_startup_info()
    app.logger.info("[DB] Ensuring database is initialized...")
    ensure_db_initialized(app)
    
    # Create default admin user if no users exist
    if User.query.count() == 0:
        app.logger.info("[DB] Creating default admin user...")
        admin = User(
            username="admin",
            email="admin@example.com",
            is_admin=True
        )
        admin.set_password("password")
        db.session.add(admin)
        db.session.commit()
        app.logger.info("[DB] Default admin user created successfully")

# Register CLI commands
register_commands(app)

# --- Main Execution ---
if __name__ == '__main__':
    # Ensure DB is initialized
    with app.app_context():
        ensure_db_initialized(app)
    
    # Get the local IP address to display in the welcome message
    local_ip = get_local_ip()
    
    # Use the previously determined protocol from earlier in the file
    app.logger.info("Collectify application starting up")
    app.logger.info(f"Protocol: {protocol.upper()}")
    app.logger.info(f"HTTPS enabled: {use_https}")
    
    print("===================================================")
    print(" collectify is running!")
    print(" ")
    print("   Local Access:")
    print(f"   Public view: {protocol}://127.0.0.1:5000")
    print(f"   Admin panel: {protocol}://127.0.0.1:5000/admin.html")
    print(" ")
    print("   LAN Access:")
    print(f"   Public view: {protocol}://{local_ip}:5000")
    print(f"   Admin panel: {protocol}://{local_ip}:5000/admin.html")
    print(" ")
    print("   Admin user:  admin")
    print("   Admin pass:  password")
    print(" ")
    print(f"   {'HTTPS' if use_https else 'HTTP'} mode enabled")
    print("   To stop the server, press CTRL+C")
    print("===================================================")
    
    app.logger.info(f"Collectify server started at {protocol}://{local_ip}:5000")
    app.run(
        debug=True, 
        host='0.0.0.0', 
        port=5000, 
        ssl_context='adhoc'
        # ssl_context=ssl_context
    )
