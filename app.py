import os
import json
from functools import wraps
from flask import Flask, request, jsonify, Response, send_from_directory, render_template
from flask_sqlalchemy import SQLAlchemy
from models import db, Category, Item, ItemPhoto, ItemUrl

# --- App & Config ---
app = Flask(__name__, static_url_path='/static', static_folder='static', template_folder='templates')

# Create data directory if it doesn't exist
data_dir = os.path.join(app.root_path, 'data')
if not os.path.exists(data_dir):
    os.makedirs(data_dir)

app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(data_dir, 'collectibles.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(data_dir, 'uploads')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

# Initialize the SQLAlchemy extension with our Flask app
db.init_app(app)


# --- Database Setup ---
def init_db():
    """Initialize the database with SQLAlchemy models"""
    with app.app_context():
        # Create all tables
        db.drop_all()
        db.create_all()
        
        # Add a default category if none exist
        if not Category.query.first():
            default_category = Category(name='Uncategorized')
            db.session.add(default_category)
            db.session.commit()

def ensure_db_initialized():
    """Check if database needs initialization and do it if needed"""
    data_dir = os.path.join(app.root_path, 'data')
    db_path = os.path.join(data_dir, 'collectibles.db')
    needs_init = False
    
    # Ensure data directory exists
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        
    # Ensure uploads directory exists
    uploads_dir = os.path.join(data_dir, 'uploads')
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    
    if not os.path.exists(db_path):
        needs_init = True
    else:
        try:
            with app.app_context():
                # Try to query the database to check if tables exist
                Category.query.first()
        except Exception:
            needs_init = True
    
    if needs_init:
        print("[DB] Initializing database...")
        init_db()
        print("[DB] Database initialized.")
        return True
    
    return False

# --- Security ---
def check_auth(username, password):
    """Simple basic authentication for the admin panel."""
    return username == os.getenv('ADMIN_USERNAME') and password == os.getenv('ADMIN_PASSWORD')

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
    categories = [category.to_dict() for category in Category.query.order_by(Category.name).all()]
    return jsonify(categories)

@app.route('/api/categories', methods=['POST'])
@requires_auth
def add_category():
    # Adds a new category (protected).
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400
    
    try:
        new_category = Category(name=data['name'])
        
        # Add specifications schema if provided
        if 'specifications_schema' in data:
            new_category.set_specifications_schema(data['specifications_schema'])
        else:
            # Default empty schema
            new_category.set_specifications_schema({})
            
        db.session.add(new_category)
        db.session.commit()
        return jsonify(new_category.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        # Check if this is a duplicate name error
        if "UNIQUE constraint failed" in str(e):
            return jsonify({'error': 'Category already exists'}), 409
        return jsonify({'error': str(e)}), 500


@app.route('/api/categories/<int:id>', methods=['PUT'])
@requires_auth
def update_category(id):
    # Updates a category including its name and specifications schema
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Category name is required'}), 400
    
    # Check if category exists
    category = Category.query.get(id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
        
    # Check if new name already exists
    existing = Category.query.filter(Category.name == data['name'], Category.id != id).first()
    if existing:
        return jsonify({'error': 'Category name already exists'}), 409
    
    # Update and save
    category.name = data['name']
    
    # Update specifications schema if provided
    if 'specifications_schema' in data:
        category.set_specifications_schema(data['specifications_schema'])
    
    db.session.commit()
    return jsonify(category.to_dict())

@app.route('/api/categories/<int:id>/specifications_schema', methods=['GET'])
def get_category_specifications_schema(id):
    # Get specifications schema for a specific category
    category = Category.query.get(id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    return jsonify(category.get_specifications_schema())

@app.route('/api/categories/<int:id>/specifications_schema', methods=['PUT'])
@requires_auth
def update_category_specifications_schema(id):
    # Update specifications schema for a specific category
    data = request.get_json()
    if data is None:
        return jsonify({'error': 'Specifications schema is required'}), 400
    
    category = Category.query.get(id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    
    try:
        category.set_specifications_schema(data)
        db.session.commit()
        return jsonify(category.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# --- API: Items (Public) ---
@app.route('/api/items', methods=['GET'])
def get_items():
    # Fetches a list of all items, with optional category filtering.
    query = Item.query.join(Item.category, isouter=True)
    
    if request.args.get('category_id'):
        query = query.filter(Item.category_id == int(request.args.get('category_id')))
    
    query = query.order_by(Item.name)
    items = [item.to_dict() for item in query.all()]
    
    return jsonify(items)

@app.route('/api/items/<int:id>', methods=['GET'])
def get_item(id):
    # Fetches full details for a single item.
    item = Item.query.get(id)
    if item:
        return jsonify(item.to_dict())
    return jsonify({'error': 'Item not found'}), 404

@app.route('/api/items', methods=['POST'])
def add_item():
    # Adds a new item (now public).
    try:
        # Validate required fields
        if not request.form.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        if not request.form.get('category_id'):
            return jsonify({'error': 'Category is required'}), 400
        if not request.form.get('brand'):
            return jsonify({'error': 'Brand is required'}), 400
        
        # Verify category exists
        category_id = request.form.get('category_id')
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Selected category does not exist'}), 400
            
        # Create new item
        new_item = Item(
            category_id=category_id,
            name=request.form.get('name'),
            brand=request.form.get('brand'),
            serial_number=request.form.get('serial_number'),
            form_factor=request.form.get('form_factor'),
            description=request.form.get('description')
        )
        
        # Handle specification values properly
        spec_values_json = request.form.get('specification_values', '{}')
        new_item.set_specification_values(json.loads(spec_values_json))
        
        # Add URLs
        for url in request.form.getlist('urls[]'):
            if url:
                new_item.urls.append(ItemUrl(url=url))
        
        # Add item to session before processing photos
        db.session.add(new_item)
        db.session.flush()  # This assigns an ID without committing
        
        # Process photos
        for file in request.files.getlist('photos[]'):
            if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']:
                filename = f"item_{new_item.id}_{file.filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                new_item.photos.append(ItemPhoto(file_path=filename))
        
        # Commit all changes
        db.session.commit()
        return jsonify(new_item.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/items/<int:id>', methods=['PUT'])
def update_item(id):
    # Updates an existing item (now public).
    item = Item.query.get(id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    try:
        # Validate required fields
        if not request.form.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        if not request.form.get('category_id'):
            return jsonify({'error': 'Category is required'}), 400
        if not request.form.get('brand'):
            return jsonify({'error': 'Brand is required'}), 400
            
        # Update basic item information
        item.category_id = request.form.get('category_id')
        item.name = request.form.get('name')
        item.brand = request.form.get('brand')
        item.serial_number = request.form.get('serial_number')
        item.form_factor = request.form.get('form_factor')
        item.description = request.form.get('description')
        
        # Handle specification values properly
        spec_values_json = request.form.get('specification_values', '{}')
        item.set_specification_values(json.loads(spec_values_json))
        
        # Update URLs: remove all existing and add new ones
        ItemUrl.query.filter_by(item_id=id).delete()
        for url in request.form.getlist('urls[]'):
            if url:
                item.urls.append(ItemUrl(url=url))
        
        # Add new photos if any
        for file in request.files.getlist('photos[]'):
            if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']:
                filename = f"item_{id}_{file.filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                item.photos.append(ItemPhoto(file_path=filename))
        
        db.session.commit()
        return jsonify(item.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/items/<int:id>', methods=['DELETE'])
def delete_item(id):
    # Deletes an item (now public).
    item = Item.query.get(id)
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    try:
        # Delete physical photo files
        for photo in item.photos:
            try:
                os.remove(os.path.join(app.config['UPLOAD_FOLDER'], photo.file_path))
            except OSError as e:
                print(f"Error deleting file {photo.file_path}: {e}")
        
        # Delete from database (cascade will handle related records)
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Item deleted'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# --- Main Execution ---
if __name__ == '__main__':
    ensure_db_initialized()  # Call local function to check if DB needs initialization
    print("===================================================")
    print(" collectify is running!")
    print(" ")
    print("   Public view: http://127.0.0.1:5000")
    print("   Admin panel: http://127.0.0.1:5000/admin.html")
    print("   Admin user:  admin")
    print("   Admin pass:  password")
    print(" ")
    print("   To stop the server, press CTRL+C")
    print("===================================================")
    app.run(debug=True, host='0.0.0.0')
