"""Main entry point for the Collectify application."""
import os
import logging
from logging.handlers import RotatingFileHandler
from config import create_app
from models import db, User
from utils.database import ensure_db_initialized
from routes.frontend import register_frontend_routes
from routes.categories import register_category_routes
from routes.items import register_item_routes
from routes.auth import auth_bp
from routes.admin_init import register_routes as register_admin_init_routes
from flask_cli import register_commands
from flask import send_from_directory, abort
import sys

# Create the Flask application
app = create_app()

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
register_frontend_routes(app)
register_category_routes(app)
register_item_routes(app)
register_admin_init_routes(app)
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Set static folder for Azure App Service
# Check if we're running in Azure by looking for WEBSITE_SITE_NAME env var
if os.environ.get('WEBSITE_SITE_NAME'):
    app.logger.info('Running in Azure App Service, configuring static folder')
    # In Azure, we're storing static files in the /static directory
    static_folder_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
    app.static_folder = static_folder_path
    app.logger.info(f'Static folder set to: {static_folder_path}')

# Configure Flask to serve static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static_files(path):
    if path.startswith('api/'):
        # Let Flask handle API routes
        return abort(404)
    
    try:
        # Check if file exists in static folder
        static_path = os.path.join(app.static_folder, path)
        if os.path.exists(static_path) and os.path.isfile(static_path):
            app.logger.debug(f"Serving static file: {static_path}")
            return send_from_directory(app.static_folder, path)
        
        # Log the attempted path and actual location
        app.logger.debug(f"Static file not found: {static_path}, serving index.html instead")
        
        # Serve index.html for all other routes (SPA support)
        return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        app.logger.error(f"Error serving static file: {str(e)}")
        return f"Error serving static file: {str(e)}", 500

# Print information about the environment
app.logger.info(f"Python version: {sys.version}")
app.logger.info(f"Python executable: {sys.executable}")
app.logger.info(f"Current directory: {os.getcwd()}")
app.logger.info(f"Static folder: {app.static_folder}")
app.logger.info(f"Environment variables: {dict(os.environ)}")

# Using Flask's event system instead of before_first_request (which is removed in Flask 3.x)
# This will run when the first request is received
with app.app_context():
    # Ensure the database is initialized
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
    import socket
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
    
    local_ip = get_local_ip()
    
    app.logger.info("Collectify application starting up")
    
    print("===================================================")
    print(" collectify is running!")
    print(" ")
    print("   Local Access:")
    print(f"   Public view: http://127.0.0.1:5000")
    print(f"   Admin panel: http://127.0.0.1:5000/admin.html")
    print(" ")
    print("   LAN Access:")
    print(f"   Public view: http://{local_ip}:5000")
    print(f"   Admin panel: http://{local_ip}:5000/admin.html")
    print(" ")
    print("   Admin user:  admin")
    print("   Admin pass:  password")
    print(" ")
    print("   To stop the server, press CTRL+C")
    print("===================================================")
    
    app.logger.info(f"Collectify server started at http://{local_ip}:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
