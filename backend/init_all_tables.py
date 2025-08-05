"""
Initialize all required database tables for the Collectify application.
"""

import os
import sys
from flask import Flask
from models import db, User, Category, CategorySpecification, Item, ItemPhoto, ItemUrl
from werkzeug.security import generate_password_hash
import sqlite3

def get_db_path():
    """Get the absolute path to the database file."""
    # Try standard locations
    standard_paths = [
        os.path.join(os.getcwd(), 'collectibles.db'),
        os.path.join(os.getcwd(), 'data', 'collectibles.db'),
        os.path.join(os.path.dirname(os.getcwd()), 'data', 'collectibles.db'),
        os.path.join('c:', os.sep, 'Users', 'lucap', 'git_repos', 'collectify', 'data', 'collectibles.db'),
        os.path.join('c:', os.sep, 'Users', 'lucap', 'git_repos', 'collectify', 'backend', 'collectibles.db')
    ]
    
    # Use the first one that exists
    for path in standard_paths:
        if os.path.exists(path):
            print(f"Found database at {path}")
            return path
    
    print("Could not find database. Please specify the path.")
    sys.exit(1)

def init_db():
    """Initialize the database with all necessary tables."""
    # Create a minimal Flask app for SQLAlchemy initialization
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{get_db_path()}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize SQLAlchemy with the app
    db.init_app(app)
    
    # Use app context to work with the database
    with app.app_context():
        print("Creating all database tables...")
        db.create_all()
        
        # Check if admin user exists and create if needed
        if User.query.filter_by(is_admin=True).count() == 0:
            print("Creating default admin user...")
            admin = User(
                username="admin",
                email="admin@example.com",
                is_admin=True
            )
            admin.set_password("password")
            db.session.add(admin)
            db.session.commit()
            print("Created admin user with username: admin and password: password")
        else:
            print("Admin user already exists")
        
        # Print summary of tables
        inspector = db.inspect(db.engine)
        table_names = inspector.get_table_names()
        print("\nDatabase tables:")
        for table in table_names:
            print(f"- {table}")
        
        print("\nDatabase initialization completed successfully.")

if __name__ == "__main__":
    init_db()
