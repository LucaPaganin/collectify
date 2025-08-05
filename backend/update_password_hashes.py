"""
Script to update existing password hashes to use pbkdf2:sha256 instead of scrypt.
This is needed because of compatibility issues with scrypt in Python 3.13.

Warning: This script will reset all user passwords to 'password123'.
In a production environment, you would want to:
1. Notify users of the change
2. Generate random temporary passwords for each user
3. Email those temporary passwords to users
4. Force users to change their password on next login
"""

import os
import sys
from flask import Flask
from models import db, User

# Create a minimal Flask app to initialize database connection
app = Flask(__name__)
# Use the absolute path to the database
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, '..', 'data', 'collectibles.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

with app.app_context():
    # Get all users
    users = User.query.all()
    
    if not users:
        print("No users found in the database.")
        sys.exit(0)
    
    # Update each user's password hash
    for user in users:
        # For this example, we'll reset all passwords to 'password123'
        # In a real application, you'd want to handle this more securely
        user.set_password('password123')
        print(f"Updated password hash for user: {user.username}")
    
    # Commit changes
    db.session.commit()
    
    print("\nAll user password hashes have been updated to use pbkdf2:sha256.")
    print("All passwords have been reset to 'password123'.")
    print("Please have users change their passwords immediately.")
