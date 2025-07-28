"""Database initialization and management functions."""
import os
from models import db, Category

def init_db(app, drop_all=False):
    """Initialize the database with SQLAlchemy models.
    
    Args:
        app: Flask application instance
        drop_all: Whether to drop all tables before creating new ones (default: False)
    """
    with app.app_context():
        # Drop all tables if requested (for testing/development)
        if drop_all:
            print("[DB] Dropping all tables...")
            db.drop_all()
        
        # Create all tables
        print("[DB] Creating all tables...")
        db.create_all()
        
        # Add a default category if none exist
        if not Category.query.first():
            print("[DB] Adding default category...")
            default_category = Category(name='Uncategorized')
            db.session.add(default_category)
            db.session.commit()
            print("[DB] Default category added.")

def ensure_db_initialized(app):
    """Check if database needs initialization and do it if needed."""
    data_dir = os.path.join(app.root_path, 'data')
    db_path = os.path.join(data_dir, 'collectibles.db')
    needs_init = False
    
    # Ensure data directory exists
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print(f"[DB] Created data directory: {data_dir}")
        
    # Ensure uploads directory exists
    uploads_dir = os.path.join(data_dir, 'uploads')
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
        print(f"[DB] Created uploads directory: {uploads_dir}")
    
    if not os.path.exists(db_path):
        print(f"[DB] Database file not found at: {db_path}")
        needs_init = True
    else:
        try:
            with app.app_context():
                # Try to query the database to check if tables exist
                Category.query.first()
                print(f"[DB] Database verified at: {db_path}")
        except Exception as e:
            print(f"[DB] Error verifying database: {str(e)}")
            needs_init = True
    
    if needs_init:
        print("[DB] Initializing database...")
        # Initialize without dropping tables for safety
        init_db(app, drop_all=False)
        print("[DB] Database initialized successfully.")
        return True
    
    return False
