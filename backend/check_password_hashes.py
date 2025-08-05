"""
A utility script to check password hashes and update them to use SHA-256 algorithm.

To use this script:
1. Run it directly: python check_password_hashes.py
2. It will print information about password hashes in the database
3. Use the --fix flag to update all password hashes to use SHA-256: python check_password_hashes.py --fix
"""

import os
import sys
import argparse
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash, check_password_hash

def get_db_path():
    """Get the path to the database file."""
    # Check for environment variable
    db_path = os.environ.get('DATABASE_URL')
    if db_path and db_path.startswith('sqlite:///'):
        return db_path
    
    # Try standard locations
    standard_paths = [
        'sqlite:///collectibles.db',
        'sqlite:///data/collectibles.db',
        'sqlite:///../data/collectibles.db',
        'sqlite:///c:/Users/lucap/git_repos/collectify/data/collectibles.db',
        'sqlite:///c:/Users/lucap/git_repos/collectify/backend/collectibles.db'
    ]
    
    # Use the first one that exists
    for path in standard_paths:
        try:
            engine = create_engine(path)
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                print(f"Connected to database at {path}")
                return path
        except Exception as e:
            print(f"Failed to connect to {path}: {str(e)}")
    
    print("Could not find database. Please specify the path with DATABASE_URL environment variable.")
    sys.exit(1)

def check_password_hashes(db_path, fix=False):
    """Check all password hashes in the database and optionally fix them."""
    engine = create_engine(db_path)
    
    with engine.connect() as conn:
        # Check if users table exists
        try:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='users'"))
            if not result.fetchone():
                print("No 'users' table found in the database.")
                return
        except Exception as e:
            print(f"Error checking for users table: {str(e)}")
            return
        
        # Get all users
        result = conn.execute(text("SELECT id, username, password_hash FROM users"))
        users = result.fetchall()
        
        if not users:
            print("No users found in the database.")
            return
        
        print(f"Found {len(users)} users in the database.")
        
        # Check each user's password hash
        sha256_count = 0
        scrypt_count = 0
        other_count = 0
        fixed_count = 0
        
        for user in users:
            user_id, username, password_hash = user
            
            if password_hash.startswith('pbkdf2:sha256:'):
                print(f"User {username} (ID: {user_id}) has SHA-256 hash")
                sha256_count += 1
            elif password_hash.startswith('scrypt:'):
                print(f"User {username} (ID: {user_id}) has scrypt hash")
                scrypt_count += 1
                
                if fix:
                    # Create a new SHA-256 hash
                    # Since we don't know the original password, we'll use a temporary password
                    temp_password = f"temp_password_{user_id}"
                    new_hash = generate_password_hash(temp_password, method='pbkdf2:sha256')
                    
                    # Update the user's password hash
                    conn.execute(
                        text("UPDATE users SET password_hash = :hash WHERE id = :id"),
                        {"hash": new_hash, "id": user_id}
                    )
                    
                    print(f"Updated user {username} (ID: {user_id}) with temporary password: {temp_password}")
                    fixed_count += 1
            else:
                print(f"User {username} (ID: {user_id}) has unknown hash format: {password_hash[:20]}...")
                other_count += 1
        
        # Summary
        print("\nSummary:")
        print(f"- SHA-256 hashes: {sha256_count}")
        print(f"- Scrypt hashes: {scrypt_count}")
        print(f"- Other hashes: {other_count}")
        
        if fix:
            print(f"- Fixed {fixed_count} hashes")
            conn.execute(text("COMMIT"))
            print("Changes committed to database.")
            print("\nIMPORTANT: Users with updated passwords will need to use their temporary passwords.")
            print("The format of the temporary password is: temp_password_<user_id>")

def main():
    parser = argparse.ArgumentParser(description="Check and fix password hashes in the Collectify database")
    parser.add_argument('--fix', action='store_true', help='Fix password hashes by updating them to SHA-256')
    args = parser.parse_args()
    
    db_path = get_db_path()
    check_password_hashes(db_path, args.fix)

if __name__ == "__main__":
    main()
