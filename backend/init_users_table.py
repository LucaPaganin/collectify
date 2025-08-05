"""
Initialize database tables including the users table.
This script will create any missing tables in the database.
"""

import os
import sys
import sqlite3
from werkzeug.security import generate_password_hash

def get_db_path():
    """Get the absolute path to the database file."""
    # Try standard locations
    standard_paths = [
        os.path.join(os.getcwd(), 'collectibles.db'),
        os.path.join(os.getcwd(), 'data', 'collectibles.db'),
        os.path.join(os.path.dirname(os.getcwd()), 'data', 'collectibles.db'),
        os.path.join('c:', os.sep, 'Users', 'lucap', 'git_repos', 'collectify', 'data', 'collectibles.db')
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
    db_path = get_db_path()
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if users table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if cursor.fetchone():
            print("Users table already exists.")
        else:
            print("Creating users table...")
            
            # Create users table
            cursor.execute('''
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(80) UNIQUE NOT NULL,
                email VARCHAR(120) UNIQUE NOT NULL,
                password_hash VARCHAR(128) NOT NULL,
                is_admin BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Create default admin user
            admin_username = "admin"
            admin_email = "admin@example.com"
            admin_password = "password"
            admin_password_hash = generate_password_hash(admin_password, method='pbkdf2:sha256')
            
            cursor.execute('''
            INSERT INTO users (username, email, password_hash, is_admin)
            VALUES (?, ?, ?, ?)
            ''', (admin_username, admin_email, admin_password_hash, True))
            
            print(f"Created default admin user: {admin_username} with password: {admin_password}")
        
        # Check if other tables exist and create them if needed
        # (This is just checking for key tables - a full schema setup would be more comprehensive)
        tables_to_check = ['categories', 'items', 'item_photos', 'item_urls', 'category_specifications']
        
        for table in tables_to_check:
            cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'")
            if cursor.fetchone():
                print(f"{table} table already exists.")
            else:
                print(f"Warning: {table} table does not exist. App may not function correctly.")
        
        conn.commit()
        print("Database initialization completed successfully.")
        
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    init_db()
