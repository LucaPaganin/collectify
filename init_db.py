import os
import sqlite3
from flask import g


def get_db(app):
    # Establishes a database connection for the current request context.
    if 'db' not in g:
        g.db = sqlite3.connect(app.config['DATABASE'])
        g.db.row_factory = sqlite3.Row
    return g.db


def init_db(app):
    # Initializes the database using the schema.sql file.
    with app.app_context():
        db = get_db(app)
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


def ensure_db_initialized(app):
    """Check if database exists and initialize it if needed"""
    if not os.path.exists(app.config['DATABASE']):
        # Ensure upload folder exists
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
        init_db(app)
        print("Database initialized.")
        return True
    return False


if __name__ == "__main__":
    # This allows running the script directly to initialize the database
    from flask import Flask
    app = Flask(__name__)
    app.config['DATABASE'] = os.path.join(os.path.dirname(__file__), 'collectibles.db')
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    ensure_db_initialized(app)
    print("Database initialized.")
