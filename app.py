import os
import json
import sqlite3
from functools import wraps
from flask import Flask, request, jsonify, Response, send_from_directory, g, render_template

# --- App & Config ---
app = Flask(__name__, static_url_path='/static', static_folder='static', template_folder='templates')
app.config['DATABASE'] = os.path.join(app.root_path, 'collectibles.db')
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'uploads')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}


# --- Database Setup ---
def get_db():
    # Establishes a database connection for the current request context.
    if 'db' not in g:
        g.db = sqlite3.connect(app.config['DATABASE'])
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(exception):
    # Closes the database connection at the end of the request.
    db = g.pop('db', None)
    if db is not None:
        db.close()

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

# --- Security ---
def check_auth(username, password):
    """Simple basic authentication for the admin panel."""
    return username == 'admin' and password == 'password'

def authenticate():
    """Sends a 401 response that enables basic auth."""
    return Response(
        'Could not verify your access level for that URL.\n'
        'You have to login with proper credentials', 401,
        {'WWW-Authenticate': 'Basic realm="Login Required"'})

def requires_auth(f):
    # Decorator to protect routes with basic authentication.
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated

# --- Frontend Routes ---

# --- Frontend Routes with Jinja2 context ---
@app.route('/')
def index():
    # Serves the main public page using Jinja2 template inheritance.
    return render_template('index.html', page_title="My Collection")

@app.route('/admin.html')
@requires_auth
def admin():
    # Serves the protected admin page for category management using Jinja2 template inheritance.
    return render_template('admin.html', page_title="Admin Panel")

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    # Serves uploaded image files.
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# --- API: Categories (Protected) ---
@app.route('/api/categories', methods=['GET'])
def get_categories():
    # Publicly fetches all categories for filtering and forms.
    db = get_db()
    cursor = db.execute("SELECT * FROM categories ORDER BY name")
    categories = [dict(row) for row in cursor.fetchall()]
    return jsonify(categories)

@app.route('/api/categories', methods=['POST'])
@requires_auth
def add_category():
    # Adds a new category (protected).
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400
    try:
        db = get_db()
        cursor = db.execute("INSERT INTO categories (name) VALUES (?)", (data['name'],))
        db.commit()
        return jsonify({'id': cursor.lastrowid, 'name': data['name']}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Category already exists'}), 409


@app.route('/api/categories/<int:id>', methods=['PUT'])
@requires_auth
def update_category(id):
    # Renames a category and updates all related items.
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400
    db = get_db()
    # Check if new name already exists
    cursor = db.execute("SELECT id FROM categories WHERE name = ? AND id != ?", (data['name'], id))
    if cursor.fetchone():
        return jsonify({'error': 'Category name already exists'}), 409
    db.execute("UPDATE categories SET name = ? WHERE id = ?", (data['name'], id))
    db.commit()
    return jsonify({'id': id, 'name': data['name']})

# --- API: Items (Public) ---
def get_full_item_details(item_id):
    # Helper function to fetch all data for a single item.
    db = get_db()
    item_cursor = db.execute(
        "SELECT i.*, c.name as category_name FROM items i LEFT JOIN categories c ON i.category_id = c.id WHERE i.id = ?",
        (item_id,)
    )
    row = item_cursor.fetchone()
    if not row:
        return None
    item = dict(row)

    photos_cursor = db.execute("SELECT file_path FROM item_photos WHERE item_id = ?", (item_id,))
    item['photos'] = [p_row['file_path'] for p_row in photos_cursor.fetchall()]

    urls_cursor = db.execute("SELECT url FROM item_urls WHERE item_id = ?", (item_id,))
    item['urls'] = [u_row['url'] for u_row in urls_cursor.fetchall()]
    
    item['specifications'] = json.loads(item['specifications']) if item.get('specifications') else {}
        
    return item

@app.route('/api/items', methods=['GET'])
def get_items():
    # Fetches a list of all items, with optional category filtering.
    db = get_db()
    query = "SELECT i.id, i.name, i.brand, c.name as category_name FROM items i LEFT JOIN categories c ON i.category_id = c.id"
    params = []
    if request.args.get('category_id'):
        query += " WHERE i.category_id = ?"
        params.append(int(request.args.get('category_id')))
    query += " ORDER BY i.name"
    
    items = [dict(row) for row in db.execute(query, params).fetchall()]

    for item in items:
        photo_cursor = db.execute("SELECT file_path FROM item_photos WHERE item_id = ? LIMIT 1", (item['id'],))
        primary_photo = photo_cursor.fetchone()
        item['primary_photo'] = primary_photo['file_path'] if primary_photo else None

    return jsonify(items)

@app.route('/api/items/<int:id>', methods=['GET'])
def get_item(id):
    # Fetches full details for a single item.
    item = get_full_item_details(id)
    if item:
        return jsonify(item)
    return jsonify({'error': 'Item not found'}), 404

@app.route('/api/items', methods=['POST'])
def add_item():
    # Adds a new item (now public).
    db = get_db()
    cursor = db.execute(
        "INSERT INTO items (category_id, name, brand, serial_number, form_factor, description, specifications) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (request.form.get('category_id'), request.form.get('name'), request.form.get('brand'), request.form.get('serial_number'), request.form.get('form_factor'), request.form.get('description'), request.form.get('specifications', '{}'))
    )
    item_id = cursor.lastrowid

    for url in request.form.getlist('urls[]'):
        if url: db.execute("INSERT INTO item_urls (item_id, url) VALUES (?, ?)", (item_id, url))
            
    for file in request.files.getlist('photos[]'):
        if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']:
            filename = f"item_{item_id}_{file.filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            db.execute("INSERT INTO item_photos (item_id, file_path) VALUES (?, ?)", (item_id, filename))

    db.commit()
    return jsonify(get_full_item_details(item_id)), 201

@app.route('/api/items/<int:id>', methods=['PUT'])
def update_item(id):
    # Updates an existing item (now public).
    db = get_db()
    if not db.execute("SELECT id FROM items WHERE id = ?", (id,)).fetchone():
        return jsonify({'error': 'Item not found'}), 404

    db.execute(
        "UPDATE items SET category_id=?, name=?, brand=?, serial_number=?, form_factor=?, description=?, specifications=? WHERE id = ?",
        (request.form.get('category_id'), request.form.get('name'), request.form.get('brand'), request.form.get('serial_number'), request.form.get('form_factor'), request.form.get('description'), request.form.get('specifications', '{}'), id)
    )
    
    db.execute("DELETE FROM item_urls WHERE item_id = ?", (id,))
    for url in request.form.getlist('urls[]'):
        if url: db.execute("INSERT INTO item_urls (item_id, url) VALUES (?, ?)", (id, url))

    for file in request.files.getlist('photos[]'):
        if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']:
            filename = f"item_{id}_{file.filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            db.execute("INSERT INTO item_photos (item_id, file_path) VALUES (?, ?)", (id, filename))

    db.commit()
    return jsonify(get_full_item_details(id))

@app.route('/api/items/<int:id>', methods=['DELETE'])
def delete_item(id):
    # Deletes an item (now public).
    db = get_db()
    photo_cursor = db.execute("SELECT file_path FROM item_photos WHERE item_id = ?", (id,))
    for row in photo_cursor.fetchall():
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], row['file_path']))
        except OSError as e:
            print(f"Error deleting file {row['file_path']}: {e}")

    db.execute("DELETE FROM item_photos WHERE item_id = ?", (id,))
    db.execute("DELETE FROM item_urls WHERE item_id = ?", (id,))
    db.execute("DELETE FROM items WHERE id = ?", (id,))
    db.commit()
    
    return jsonify({'message': 'Item deleted'})

# --- Main Execution ---
if __name__ == '__main__':
    # Ensure upload folder exists
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
        
    # Initialize DB
    init_db()
    
    print("===================================================")
    print(" collectible_app is running!")
    print(" ")
    print("   Public view: http://127.0.0.1:5000")
    print("   Admin panel: http://127.0.0.1:5000/admin.html")
    print("   Admin user:  admin")
    print("   Admin pass:  password")
    print(" ")
    print("   To stop the server, press CTRL+C")
    print("===================================================")
    app.run(debug=True, host='0.0.0.0')
