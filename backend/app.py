"""Main entry point for the Collectify application."""
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

# Initialize the database with our app
db.init_app(app)

# Register all routes
register_frontend_routes(app)
register_category_routes(app)
register_item_routes(app)
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Using Flask's event system instead of before_first_request (which is removed in Flask 3.x)
# This will run when the first request is received
def initialize_database():
    """Initialize the database before the first request if needed."""
    with app.app_context():
        # Ensure the database is initialized
        print("[DB] Ensuring database is initialized...")
        ensure_db_initialized(app)
        
        # Create default admin user if no users exist
        if User.query.count() == 0:
            print("[DB] Creating default admin user...")
            admin = User(
                username="admin",
                email="admin@example.com",
                is_admin=True
            )
            admin.set_password("password")
            db.session.add(admin)
            db.session.commit()
    
# Register CLI commands
register_commands(app)

# --- Main Execution ---
if __name__ == '__main__':
    ensure_db_initialized(app)  # Check if DB needs initialization
    
    # Get the local IP address to display in the welcome message
    import socket
    def get_local_ip():
        try:
            # Get the local hostname
            hostname = socket.gethostname()
            # Get the local IP address
            local_ip = socket.gethostbyname(hostname)
            return local_ip
        except Exception:
            return "your_local_IP"
    
    local_ip = get_local_ip()
    
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
    app.run(debug=True, host='0.0.0.0', port=5000)
