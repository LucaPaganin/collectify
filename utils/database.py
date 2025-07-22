"""Database initialization and management functions."""
import os
from models import db, Category

def init_db(app):
    """Initialize the database with SQLAlchemy models."""
    with app.app_context():
        # Create all tables
        db.drop_all()
        db.create_all()
        
        # Add a default category if none exist
        if not Category.query.first():
            default_category = Category(name='Uncategorized')
            db.session.add(default_category)
            db.session.commit()

def ensure_db_initialized(app):
    """Check if database needs initialization and do it if needed."""
    data_dir = os.path.join(app.root_path, 'data')
    db_path = os.path.join(data_dir, 'collectibles.db')
    needs_init = False
    
    # Ensure data directory exists
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        
    # Ensure uploads directory exists
    uploads_dir = os.path.join(data_dir, 'uploads')
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    
    if not os.path.exists(db_path):
        needs_init = True
    else:
        try:
            with app.app_context():
                # Try to query the database to check if tables exist
                Category.query.first()
        except Exception:
            needs_init = True
    
    if needs_init:
        print("[DB] Initializing database...")
        init_db(app)
        print("[DB] Database initialized.")
        return True
    
    return False
