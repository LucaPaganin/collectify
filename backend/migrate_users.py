"""
Migration script to create the users table and add the default admin user.
"""
import sqlite3
from pathlib import Path
from werkzeug.security import generate_password_hash
import os

def migrate_users():
    # Connect to the database
    db_path = Path('data/collectibles.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if users table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    table_exists = cursor.fetchone()
    
    # Create the table if it doesn't exist
    if not table_exists:
        print("Creating users table...")
        cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        conn.commit()
        
        # Create default admin user
        print("Creating default admin user...")
        admin_password = os.environ.get('ADMIN_PASSWORD', 'password')
        password_hash = generate_password_hash(admin_password)
        
        cursor.execute('''
        INSERT INTO users (username, email, password_hash, is_admin) 
        VALUES (?, ?, ?, ?)
        ''', ('admin', 'admin@example.com', password_hash, True))
        
        conn.commit()
        print("Default admin user created: username=admin, password=password (or environment variable ADMIN_PASSWORD)")
    else:
        print("Users table already exists.")
    
    conn.close()
    print("User migration complete!")

if __name__ == "__main__":
    migrate_users()
