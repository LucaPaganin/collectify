"""Main entry point for the Collectify application."""
from config import create_app
from models import db
from utils.database import ensure_db_initialized
from routes.frontend import register_frontend_routes
from routes.categories import register_category_routes
from routes.items import register_item_routes

# Create the Flask application
app = create_app()

# Initialize the database with our app
db.init_app(app)

# Register all routes
register_frontend_routes(app)
register_category_routes(app)
register_item_routes(app)

# --- Main Execution ---
if __name__ == '__main__':
    ensure_db_initialized(app)  # Check if DB needs initialization
    print("===================================================")
    print(" collectify is running!")
    print(" ")
    print("   Public view: http://127.0.0.1:5000")
    print("   Admin panel: http://127.0.0.1:5000/admin.html")
    print("   Admin user:  admin")
    print("   Admin pass:  password")
    print(" ")
    print("   To stop the server, press CTRL+C")
    print("===================================================")
    app.run(debug=True, host='0.0.0.0')
