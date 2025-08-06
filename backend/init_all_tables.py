"""
Initialize all required database tables for the Collectify application.

This script creates all necessary database tables for the Collectify app
and sets up a default admin user if one doesn't exist.

Usage:
    python init_all_tables.py

Configuration:
    COLLECTIFY_DB_PATH: Environment variable to specify the database path.
    If not provided, a default path will be used based on the script location.

Example:
    COLLECTIFY_DB_PATH=/path/to/my/db.sqlite python init_all_tables.py
"""

import os
import sys
from pathlib import Path
from flask import Flask
from models import db, User, Category, CategorySpecification, Item, ItemPhoto, ItemUrl
from werkzeug.security import generate_password_hash
import sqlite3

def get_db_path():
    """Get the absolute path to the database file."""
    # Check for environment variable first
    db_path = os.environ.get('COLLECTIFY_DB_PATH')
    if db_path and os.path.exists(db_path):
        print(f"Using database path from environment variable: {db_path}")
        return db_path
    
    # Default path based on script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'backend' else script_dir
    
    # Standard locations relative to detected base directory
    data_dir = os.path.join(base_dir, 'data')
    default_path = os.path.join(data_dir, 'collectibles.db')
    
    # Create data directory if it doesn't exist
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        print(f"Created data directory at {data_dir}")
    
    print(f"Using default database path: {default_path}")
    return default_path

def init_db():
    """Initialize the database with all necessary tables."""
    # Create a minimal Flask app for SQLAlchemy initialization
    app = Flask(__name__)
    db_path = get_db_path()
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
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
    # You can override the database path using the COLLECTIFY_DB_PATH environment variable
    # Example: COLLECTIFY_DB_PATH=/custom/path/collectify.db python init_all_tables.py
    init_db()
