# Testing

Collectify uses pytest for testing the backend functionality. This document describes the testing architecture, available tests, and how to run them.

## Testing Architecture

The tests are located in the `backend/tests` directory and use pytest fixtures for setting up test environments.

### Directory Structure

```
tests/
├── __init__.py
├── conftest.py               # pytest fixtures and configuration
├── test_auth.py              # Authentication tests
├── test_categories.py        # Category API tests
├── test_frontend.py          # Frontend routes tests
├── test_items.py             # Item API tests
├── test_logging.py           # Logging tests
├── test_models.py            # Database model tests
└── test_utils.py             # Utility function tests
```

### Test Configuration

The main test configuration is in `conftest.py`, which provides fixtures used across multiple test files:

```python
@pytest.fixture
def app():
    """Create and configure a Flask app for testing."""
    app = create_app('testing')
    
    # Create a test database in memory
    with app.app_context():
        db.create_all()
        
        # Create a test admin user
        admin = User(username='admin', email='admin@example.com', is_admin=True)
        admin.set_password('password')
        db.session.add(admin)
        
        # Create a regular test user
        user = User(username='user', email='user@example.com', is_admin=False)
        user.set_password('password')
        db.session.add(user)
        
        # Create test categories
        category = Category(name='Test Category')
        db.session.add(category)
        
        db.session.commit()
    
    yield app
    
    # Clean up
    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test CLI runner for the app."""
    return app.test_cli_runner()

@pytest.fixture
def auth_headers():
    """Get auth headers for the test user."""
    return {
        'Authorization': f'Bearer {get_test_token("user")}'
    }

@pytest.fixture
def admin_auth_headers():
    """Get auth headers for the admin user."""
    return {
        'Authorization': f'Bearer {get_test_token("admin")}'
    }
```

## Test Categories

### Model Tests

Tests for database models in `test_models.py`:

- User model (password hashing, to_dict method)
- Category model (specification schema handling)
- Item model (specification values, relationships)
- Photo and URL relationships

### API Tests

Tests for API endpoints:

- Authentication (registration, login, token validation)
- Categories (CRUD operations, specification schema)
- Items (CRUD operations, filtering, photos, URLs)

### Frontend Tests

Tests for frontend routes:

- Main page rendering
- Item detail pages
- Admin page authentication

### Utility Tests

Tests for utility functions:

- Authentication decorators
- Helper functions
- Error handling

### Logging Tests

Tests for the logging system:

- Log configuration
- Error logging
- Authentication logging

## Running Tests

### Running All Tests

To run all tests:

```bash
cd backend
python -m pytest
```

### Running Specific Test Files

To run tests from a specific file:

```bash
python -m pytest tests/test_items.py
```

### Running Specific Tests

To run a specific test function:

```bash
python -m pytest tests/test_items.py::test_get_items
```

### Verbose Output

For more detailed test output:

```bash
python -m pytest -v
```

### Test Coverage

To generate a test coverage report:

```bash
python -m pytest --cov=.
```

For a detailed HTML coverage report:

```bash
python -m pytest --cov=. --cov-report=html
```

The HTML report will be generated in the `htmlcov` directory.

## Example Tests

### Testing API Endpoints

```python
def test_get_items(client):
    """Test getting all items."""
    response = client.get('/api/items')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)

def test_create_item(client, admin_auth_headers):
    """Test creating a new item."""
    response = client.post('/api/items', 
                          headers=admin_auth_headers,
                          json={
                              'name': 'Test Item',
                              'category_id': 1,
                              'brand': 'Test Brand',
                              'description': 'Test Description'
                          })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Test Item'
    assert data['brand'] == 'Test Brand'
```

### Testing Authentication

```python
def test_login(client):
    """Test user login."""
    response = client.post('/api/auth/login',
                          json={
                              'username': 'user',
                              'password': 'password'
                          })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'token' in data
    assert data['user']['username'] == 'user'

def test_protected_route(client, auth_headers):
    """Test accessing a protected route with authentication."""
    response = client.get('/api/auth/me', headers=auth_headers)
    assert response.status_code == 200
    
    # Try without authentication
    response = client.get('/api/auth/me')
    assert response.status_code == 401
```

### Testing Models

```python
def test_user_password_hashing():
    """Test password hashing and verification."""
    user = User(username='test', email='test@example.com')
    user.set_password('password')
    assert user.check_password('password')
    assert not user.check_password('wrong-password')
    
def test_item_specification_values():
    """Test item specification values handling."""
    item = Item(name='Test Item', category_id=1)
    specs = {'color': 'red', 'size': 'large'}
    item.set_specification_values(specs)
    assert item.get_specification_values() == specs
```

## Test Data

The test suite creates the following test data for use in tests:

### Users
- Admin user: username='admin', password='password', is_admin=True
- Regular user: username='user', password='password', is_admin=False

### Categories
- Test Category (id=1)

### Items
- Created during specific tests as needed

## Continuous Integration

Tests are automatically run on pull requests and pushes to the main branch using GitHub Actions. The workflow is defined in `.github/workflows/tests.yml`.

### CI Process

1. Set up Python environment
2. Install dependencies
3. Run tests with pytest
4. Generate and upload coverage report

## Writing New Tests

When adding new features, follow these guidelines for writing tests:

1. Create or update test files that match the feature's functionality
2. Use the provided fixtures for common setup tasks
3. Test both success and failure cases
4. Verify database changes when appropriate
5. Check response status codes and content
6. Aim for high test coverage of new code
