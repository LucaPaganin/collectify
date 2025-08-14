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
from flask_cors import CORS
import sys

# Create the Flask application
app = create_app()

# Configure CORS for all routes - permissive configuration
cors_origins = os.environ.get('CORS_ORIGINS', '*')
app.logger.info(f"Configuring permissive CORS with allowed origins: {cors_origins}")
CORS(app, 
     resources={r"/*": {
         "origins": "*",
         "allow_headers": "*",
         "expose_headers": "*",
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         "supports_credentials": True
     }}, 
     send_wildcard=True)

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
app.logger.info('Configuring static folder for app')

# In Linux App Service, the static folder is relative to the application root
app.logger.info('Linux App Service detected')
static_folder_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
app.logger.info(f'Setting static folder path to: {static_folder_path}')

app.static_folder = static_folder_path
app.static_url_path = '/static'  # Explicit URL path for static files
app.logger.info(f'Static folder set to: {static_folder_path}')
app.logger.info(f'Static URL path set to: {app.static_url_path}')

# List static folder contents for debugging
try:
    app.logger.info("Listing static folder contents:")
    if os.path.exists(static_folder_path):
        for root, dirs, files in os.walk(static_folder_path):
            relative_path = os.path.relpath(root, static_folder_path)
            app.logger.info(f"Directory: {relative_path}")
            for file in files:
                app.logger.info(f"  - {os.path.join(relative_path, file)}")
    else:
        app.logger.warning(f"Static folder {static_folder_path} does not exist!")
except Exception as e:
    app.logger.error(f"Error listing static folder: {str(e)}")

# Configure Flask to serve static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static_files(path):
    app.logger.debug(f"Received request for path: {path}")
    
    if path.startswith('api/'):
        app.logger.debug(f"API route detected, skipping static file handling")
        # Let Flask handle API routes
        return abort(404)
    
    try:
        # Check if file exists in static folder
        static_path = os.path.join(app.static_folder, path)
        app.logger.debug(f"Looking for file at: {static_path}")
        
        if os.path.exists(static_path) and os.path.isfile(static_path):
            app.logger.debug(f"Found static file: {static_path}, serving directly")
            return send_from_directory(app.static_folder, path)
        
        # If we're looking for index.html directly, serve it
        if path == '' or path == 'index.html':
            app.logger.debug(f"Serving index.html from {app.static_folder}")
            return send_from_directory(app.static_folder, 'index.html')
            
        # For other paths, check if we need to serve a specific file type differently
        if path.endswith('.js'):
            js_path = os.path.join(app.static_folder, 'js', os.path.basename(path))
            app.logger.debug(f"Looking for JS file at: {js_path}")
            if os.path.exists(js_path):
                app.logger.debug(f"Serving JS file: {js_path}")
                return send_from_directory(os.path.join(app.static_folder, 'js'), os.path.basename(path))
                
        elif path.endswith('.css'):
            css_path = os.path.join(app.static_folder, 'css', os.path.basename(path))
            app.logger.debug(f"Looking for CSS file at: {css_path}")
            if os.path.exists(css_path):
                app.logger.debug(f"Serving CSS file: {css_path}")
                return send_from_directory(os.path.join(app.static_folder, 'css'), os.path.basename(path))
        
        # Log the attempted path and fall back to index.html
        app.logger.debug(f"Static file not found: {static_path}, serving index.html instead")
        return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        app.logger.error(f"Error serving static file for path {path}: {str(e)}")
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
    
# Add CORS headers to all responses
@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', os.getenv('CORS_ORIGIN', '*'))
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,X-API-KEY')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Expose-Headers', 'Content-Length,Content-Range')
    return response

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
