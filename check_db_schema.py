import sqlite3
import os

# Find the database file
db_paths = [
    os.path.join(os.getcwd(), 'collectibles.db'),
    os.path.join(os.getcwd(), 'data', 'collectibles.db'),
    os.path.join(os.getcwd(), 'backend', 'collectibles.db'),
    os.path.join(os.getcwd(), 'backend', 'data', 'collectibles.db')
]

for db_path in db_paths:
    if os.path.exists(db_path):
        print(f"Found database at: {db_path}")
        try:
            # Connect to the database
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Get list of tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            print("Tables in the database:")
            for table in tables:
                print(f"- {table[0]}")
                
            # Check the schema for each table
            for table in tables:
                cursor.execute(f"PRAGMA table_info({table[0]});")
                columns = cursor.fetchall()
                print(f"\nSchema for table '{table[0]}':")
                for column in columns:
                    print(f"  {column[1]}: {column[2]} (nullable: {not column[3]}, primary key: {column[5]})")
            
            conn.close()
        except Exception as e:
            print(f"Error accessing database: {str(e)}")
        break
else:
    print("Database file not found in any of the expected locations")
