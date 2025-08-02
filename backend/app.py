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
from flask_cli import register_commands

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
app.register_blueprint(auth_bp, url_prefix='/api/auth')

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
