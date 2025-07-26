"""
Migration script to convert specifications from dict to list format
and create the category_specifications table.
"""
import json
import sqlite3
from pathlib import Path

def migrate_specifications():
    # Connect to the database
    db_path = Path('data/collectibles.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if category_specifications table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='category_specifications'")
    table_exists = cursor.fetchone()
    
    # Create the table if it doesn't exist
    if not table_exists:
        print("Creating category_specifications table...")
        cursor.execute('''
        CREATE TABLE category_specifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            label TEXT,
            type TEXT DEFAULT 'text',
            placeholder TEXT,
            display_order INTEGER DEFAULT 0,
            options TEXT,
            min_value REAL,
            max_value REAL,
            step_value REAL DEFAULT 1,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )
        ''')
        conn.commit()
    
    # Fetch all categories with their specification schemas
    cursor.execute("SELECT id, name, specifications_schema FROM categories")
    categories = cursor.fetchall()
    
    # Migrate each category's specifications
    for category_id, name, schema_json in categories:
        if not schema_json:
            continue  # Skip if no schema defined
        
        try:
            # Parse the JSON schema
            schema = json.loads(schema_json)
            if not schema:  # Skip if empty schema
                continue
                
            print(f"Migrating specifications for category: {name} (ID: {category_id})")
            
            # Delete any existing specifications for this category
            cursor.execute("DELETE FROM category_specifications WHERE category_id = ?", (category_id,))
            
            # Create new specifications from the schema
            order = 0
            for key, spec_data in schema.items():
                # Default values
                label = spec_data.get('label', key)
                spec_type = spec_data.get('type', 'text')
                placeholder = spec_data.get('placeholder', '')
                
                # Handle type-specific properties
                min_value = None
                max_value = None
                step_value = 1
                if spec_type == 'number':
                    min_value = spec_data.get('min')
                    max_value = spec_data.get('max')
                    step_value = spec_data.get('step', 1)
                
                # Handle options for select type
                options_json = None
                if spec_type == 'select' and 'options' in spec_data:
                    options_json = json.dumps(spec_data['options'])
                
                # Insert the new specification
                cursor.execute('''
                INSERT INTO category_specifications 
                (category_id, key, label, type, placeholder, display_order, options, min_value, max_value, step_value) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    category_id, key, label, spec_type, placeholder, 
                    order, options_json, min_value, max_value, step_value
                ))
                
                order += 1
            
            conn.commit()
            print(f"Successfully migrated {order} specifications for category: {name}")
            
        except Exception as e:
            print(f"Error migrating specifications for category {name}: {str(e)}")
            conn.rollback()
    
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate_specifications()
