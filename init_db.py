import os
from app import app, get_db


def init_db():
    # Initializes the database using the schema.sql file.
    with app.app_context():
        db = get_db()
        # The schema is now embedded to avoid file I/O issues in some environments
        schema_sql = """
            DROP TABLE IF EXISTS item_photos;
            DROP TABLE IF EXISTS item_urls;
            DROP TABLE IF EXISTS items;
            DROP TABLE IF EXISTS categories;
            
            CREATE TABLE categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            );
            
            CREATE TABLE items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER,
                name TEXT NOT NULL,
                brand TEXT,
                serial_number TEXT,
                form_factor TEXT,
                description TEXT,
                specifications TEXT, -- Storing a JSON object for extensibility
                FOREIGN KEY (category_id) REFERENCES categories(id)
            );
            
            CREATE TABLE item_photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER,
                file_path TEXT NOT NULL,
                FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
            );
            
            CREATE TABLE item_urls (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_id INTEGER,
                url TEXT NOT NULL,
                FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
            );
        """
        db.executescript(schema_sql)
        # Add a default category if none exist
        cursor = db.execute("SELECT COUNT(id) FROM categories")
        if cursor.fetchone()[0] == 0:
            db.execute("INSERT INTO categories (name) VALUES (?)", ('Uncategorized',))
            db.commit()



if __name__ == "__main__":
    # Ensure upload folder exists
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    init_db()
    print("Database initialized.")
