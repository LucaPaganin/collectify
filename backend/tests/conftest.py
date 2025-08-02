"""
conftest.py - Pytest configuration and fixtures for Collectify tests
"""
import os
import sys
import shutil
import pytest
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import app as flask_app
from models import db, Category, Item, ItemUrl, ItemPhoto, CategorySpecification, User
from config import create_app
from utils.auth import generate_token

@pytest.fixture
def app():
    """Flask application fixture with test configuration"""
    # Import the route registration functions
    from routes.frontend import register_frontend_routes
    from routes.categories import register_category_routes
    from routes.items import register_item_routes
    
    # Create test config
    test_app = create_app()
    
    # Configure app for testing
    test_app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'UPLOAD_FOLDER': str(Path(test_app.root_path) / 'test_uploads'),
        'WTF_CSRF_ENABLED': False  # Disable CSRF for tests
    })
    
    # Create test uploads directory
    test_uploads_dir = Path(test_app.config['UPLOAD_FOLDER'])
    if not test_uploads_dir.exists():
        test_uploads_dir.mkdir(parents=True)
    
    # Register all routes - important for tests to find the endpoints
    register_frontend_routes(test_app)
    register_category_routes(test_app)
    register_item_routes(test_app)
    
    # Set up application context
    with test_app.app_context():
        # Create all database tables
        db.init_app(test_app)
        db.create_all()
        
        # Provide the application for testing
        yield test_app
        
        # Clean up: drop all tables
        db.session.remove()
        db.drop_all()
    
    # Clean up: remove test uploads directory
    if test_uploads_dir.exists():
        shutil.rmtree(test_uploads_dir)

@pytest.fixture
def client(app):
    """Flask test client"""
    return app.test_client()

@pytest.fixture
def token_auth_client(app, client):
    """Authenticated test client with JWT token"""
    with app.app_context():
        # Create a test admin user
        admin = User(
            username="testadmin",
            email="testadmin@example.com",
            is_admin=True
        )
        admin.set_password("password")
        db.session.add(admin)
        db.session.commit()
        
        # Generate a token for this user
        token = generate_token(admin)
        
        # Create token auth header
        auth_headers = {'Authorization': f'Bearer {token}'}
        
        # Return a client that will include these headers in all requests
        class TokenAuthClient:
            def get(self, *args, **kwargs):
                headers = kwargs.get('headers', {})
                headers.update(auth_headers)
                kwargs['headers'] = headers
                return client.get(*args, **kwargs)
                
            def post(self, *args, **kwargs):
                headers = kwargs.get('headers', {})
                headers.update(auth_headers)
                kwargs['headers'] = headers
                return client.post(*args, **kwargs)
                
            def put(self, *args, **kwargs):
                headers = kwargs.get('headers', {})
                headers.update(auth_headers)
                kwargs['headers'] = headers
                return client.put(*args, **kwargs)
                
            def delete(self, *args, **kwargs):
                headers = kwargs.get('headers', {})
                headers.update(auth_headers)
                kwargs['headers'] = headers
                return client.delete(*args, **kwargs)
        
        return TokenAuthClient()

@pytest.fixture
def auth_client(client):
    """Authenticated test client with admin credentials"""
    # Create Basic Auth header with default admin credentials
    credentials = {'Authorization': 'Basic YWRtaW46cGFzc3dvcmQ='}  # admin:password in Base64
    
    # Return a client that will include these headers in all requests
    class AuthClient:
        def get(self, *args, **kwargs):
            headers = kwargs.get('headers', {})
            headers.update(credentials)
            kwargs['headers'] = headers
            return client.get(*args, **kwargs)
            
        def post(self, *args, **kwargs):
            headers = kwargs.get('headers', {})
            headers.update(credentials)
            kwargs['headers'] = headers
            return client.post(*args, **kwargs)
            
        def put(self, *args, **kwargs):
            headers = kwargs.get('headers', {})
            headers.update(credentials)
            kwargs['headers'] = headers
            return client.put(*args, **kwargs)
            
        def delete(self, *args, **kwargs):
            headers = kwargs.get('headers', {})
            headers.update(credentials)
            kwargs['headers'] = headers
            return client.delete(*args, **kwargs)
    
    return AuthClient()

@pytest.fixture
def sample_category(app):
    """Create a sample category for testing"""
    with app.app_context():
        category = Category(name="Test Category")
        db.session.add(category)
        db.session.commit()
        
        # Get the category ID
        category_id = category.id
        
        # Return a fresh copy of the category to avoid detached instance issues
        fresh_category = Category.query.get(category_id)
        assert fresh_category is not None, f"Failed to retrieve category with ID {category_id}"
        return fresh_category

@pytest.fixture
def sample_category_with_specs(app):
    """Create a sample category with specifications for testing"""
    with app.app_context():
        category = Category(name="Test Category with Specs")
        
        # Add specifications in list format
        specs = [
            {
                "key": "weight",
                "label": "Weight",
                "type": "number",
                "placeholder": "Enter weight in kg",
                "display_order": 0,
                "min": 0,
                "max": 1000,
                "step": 0.1
            },
            {
                "key": "color",
                "label": "Color",
                "type": "text",
                "placeholder": "Enter color",
                "display_order": 1
            },
            {
                "key": "material",
                "label": "Material",
                "type": "select",
                "placeholder": "Select material",
                "display_order": 2,
                "options": [
                    {"value": "wood", "label": "Wood"},
                    {"value": "metal", "label": "Metal"},
                    {"value": "plastic", "label": "Plastic"}
                ]
            }
        ]
        
        category.set_specifications_schema(specs)
        db.session.add(category)
        db.session.commit()
        
        # Get the ID before returning (to avoid detached instance issues)
        category_id = category.id
        category_name = category.name
        
        # Create a fresh instance to avoid detached instance errors
        fresh_category = Category.query.get(category_id)
        assert fresh_category is not None, f"Failed to retrieve category with ID {category_id}"
        return fresh_category

@pytest.fixture
def sample_item(app, sample_category_with_specs):
    """Create a sample item for testing"""
    with app.app_context():
        # Get a fresh copy of sample_category to avoid detached instance issues
        category_id = sample_category_with_specs.id
        category = Category.query.get(category_id)
        
        item = Item(
            category_id=category.id,
            name="Test Item",
            brand="Test Brand",
            serial_number="ABC123",
            form_factor="Test Form Factor",
            description="This is a test item"
        )
        
        # Add specification values
        item.set_specification_values({
            "weight": "5",
            "color": "Red",
            "material": "wood"
        })
        
        # Add a URL
        item.urls.append(ItemUrl(url="https://example.com/test"))
        
        db.session.add(item)
        db.session.commit()
        
        # Get the item ID
        item_id = item.id
        
        # Return a fresh copy of the item to avoid detached instance issues
        fresh_item = Item.query.get(item_id)
        assert fresh_item is not None, f"Failed to retrieve item with ID {item_id}"
        return fresh_item

@pytest.fixture
def sample_photo_file(app):
    """Create a sample photo file for testing using a real image from img folder"""
    import io
    from pathlib import Path
    
    # Use a real image file from the img folder
    img_path = Path(__file__).parent.parent / 'img' / 'resistors.jpeg'
    
    # Read the file and create a file-like object
    with open(img_path, 'rb') as image_file:
        file_content = image_file.read()
    
    # Create a BytesIO object to simulate an uploaded file
    file = io.BytesIO(file_content)
    file.name = 'resistors.jpeg'
    file.seek(0)
    
    return file
