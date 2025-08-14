"""
Migration script to add created_at column to the categories table.
"""
import sqlite3
from pathlib import Path

def migrate_category_timestamps():
    # Connect to the database
    db_path = Path('data/collectibles.db')
    if not db_path.exists():
        db_path = Path('collectibles.db')
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if the categories table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'")
    categories_table_exists = cursor.fetchone()
    
    if not categories_table_exists:
        print("Categories table doesn't exist. Skipping migration.")
        conn.close()
        return
    
    # Check if the created_at column already exists
    cursor.execute("PRAGMA table_info(categories)")
    columns = cursor.fetchall()
    created_at_exists = any(column[1] == 'created_at' for column in columns)
    
    if not created_at_exists:
        print("Adding created_at column to categories table...")
        try:
            # SQLite doesn't support ADD COLUMN with DEFAULT CURRENT_TIMESTAMP
            # We need to add the column first, then update existing rows
            cursor.execute("ALTER TABLE categories ADD COLUMN created_at TIMESTAMP")
            
            # Update existing rows with current timestamp
            cursor.execute("UPDATE categories SET created_at = CURRENT_TIMESTAMP")
            
            conn.commit()
            print("Successfully added created_at column to categories table")
        except Exception as e:
            print(f"Error adding created_at column: {str(e)}")
            conn.rollback()
    else:
        print("created_at column already exists in categories table. Skipping.")
    
    conn.close()
    print("Category timestamp migration complete!")

if __name__ == "__main__":
    migrate_category_timestamps()
