# Utilities

The Collectify backend includes several utility modules that provide common functionality used across different parts of the application. These utilities are organized in the `utils` directory.

## Directory Structure

```
utils/
├── __init__.py
├── auth.py         # Authentication utilities
├── database.py     # Database helper functions
├── decorators.py   # Reusable decorators
└── helpers.py      # General helper functions
```

## Authentication Utilities (auth.py)

The `auth.py` module provides functions and decorators for handling authentication and authorization.

### token_required Decorator

```python
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
        if not token:
            current_app.logger.warning(f"Authentication failed: Token is missing for {request.path}")
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode token
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            
            if not current_user:
                current_app.logger.warning(f"Authentication failed: Invalid token - user not found for {request.path}")
                return jsonify({'error': 'Invalid token'}), 401
                
        except jwt.ExpiredSignatureError:
            current_app.logger.warning(f"Authentication failed: Token expired for {request.path}")
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError as e:
            current_app.logger.warning(f"Authentication failed: Invalid token for {request.path} - {str(e)}")
            return jsonify({'error': 'Invalid token'}), 401
            
        # Pass the current user to the route
        return f(current_user, *args, **kwargs)
    
    return decorated
```

This decorator:
1. Extracts the JWT token from the Authorization header
2. Verifies the token's signature and expiration
3. Loads the user from the database based on the user_id in the token
4. Passes the user object to the decorated function

### admin_required Decorator

```python
def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user.is_admin:
            current_app.logger.warning(f"Authorization failed: Admin privileges required for {request.path} - User {current_user.username} (ID: {current_user.id}) is not an admin")
            return jsonify({'error': 'Admin privileges required'}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated
```

This decorator:
1. Checks if the current user has admin privileges
2. Returns a 403 Forbidden response if the user is not an admin
3. Otherwise, allows the request to proceed

## Database Utilities (database.py)

The `database.py` module provides helper functions for database operations.

### get_or_404

```python
def get_or_404(model, id, message=None):
    """
    Get a database object by ID or return a 404 error.
    
    Args:
        model: The SQLAlchemy model class
        id: The primary key ID to look up
        message: Optional custom error message
        
    Returns:
        The database object if found
        
    Raises:
        NotFound: If the object doesn't exist
    """
    obj = model.query.get(id)
    if obj is None:
        message = message or f"{model.__name__} not found"
        current_app.logger.warning(f"Database lookup failed: {message} (ID: {id})")
        abort(404, description=message)
    return obj
```

### commit_or_rollback

```python
def commit_or_rollback():
    """
    Commit the current database session or roll it back on error.
    
    Returns:
        True if the commit was successful, False otherwise
    """
    try:
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Database commit failed: {str(e)}\n{traceback.format_exc()}")
        return False
```

## Decorators (decorators.py)

The `decorators.py` module provides reusable decorators that can be applied to route handlers.

### log_exceptions Decorator

```python
def log_exceptions(f):
    """
    Decorator that catches exceptions in route handlers and logs them properly.
    
    This decorator wraps Flask route handlers to provide consistent error logging
    and response formatting. It logs the exception with a traceback and returns
    a JSON error response. It also handles database rollback if an exception occurs.
    
    Args:
        f: The route handler function to decorate
        
    Returns:
        A wrapped function that handles exceptions
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            # Roll back any database changes
            db.session.rollback()
            
            # Get detailed error information
            error_details = traceback.format_exc()
            endpoint = request.endpoint
            
            # Log the error with traceback
            current_app.logger.error(
                f"Error in {endpoint} ({request.path}): {str(e)}\n{error_details}"
            )
            
            # Return a JSON error response
            response = {
                'error': str(e),
                'endpoint': endpoint,
            }
            
            # Determine appropriate status code
            status_code = 500
            if hasattr(e, 'code') and isinstance(e.code, int):
                status_code = e.code
                
            return jsonify(response), status_code
            
    return decorated
```

## Helper Functions (helpers.py)

The `helpers.py` module provides general-purpose helper functions used throughout the application.

### prepare_items_for_template

```python
def prepare_items_for_template(category_id=None, search=None):
    """
    Prepare items for template rendering with filtering options.
    
    Args:
        category_id: Optional category ID to filter by
        search: Optional search term to filter items
        
    Returns:
        List of item dictionaries with formatted data
    """
    # Start with a base query
    query = Item.query.join(Item.category, isouter=True)
    
    # Apply category filter if provided
    if category_id:
        query = query.filter(Item.category_id == int(category_id))
    
    # Apply search filter if provided
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Item.name.ilike(search_term),
                Item.brand.ilike(search_term),
                Item.serial_number.ilike(search_term),
                Item.description.ilike(search_term)
            )
        )
    
    # Execute query and convert to dictionaries
    items = [item.to_dict() for item in query.order_by(Item.name).all()]
    
    # Process each item for template display
    for item in items:
        # Add primary photo URL for display
        if item.get('primary_photo'):
            item['primary_photo_url'] = f"/uploads/{item['primary_photo']}"
        else:
            item['primary_photo_url'] = "https://placehold.co/600x400/eee/ccc?text=No+Image"
        
        # Format specification values for display
        if item.get('specification_values'):
            item['formatted_specs'] = format_specifications(item['specification_values'])
    
    return items
```

### format_specifications

```python
def format_specifications(spec_values):
    """
    Format specification values for display.
    
    Args:
        spec_values: Dictionary of specification values
        
    Returns:
        List of formatted specification strings
    """
    if not spec_values or not isinstance(spec_values, dict):
        return []
    
    formatted = []
    for key, value in spec_values.items():
        # Skip empty values
        if not value:
            continue
        
        # Format the key with title case and spaces
        formatted_key = key.replace('_', ' ').title()
        
        # Format the value based on type
        if isinstance(value, bool):
            formatted_value = "Yes" if value else "No"
        elif isinstance(value, (int, float)):
            formatted_value = str(value)
        else:
            formatted_value = str(value)
        
        formatted.append(f"{formatted_key}: {formatted_value}")
    
    return formatted
```

### allowed_file

```python
def allowed_file(filename):
    """
    Check if a filename has an allowed extension.
    
    Args:
        filename: The filename to check
        
    Returns:
        True if the file extension is allowed, False otherwise
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']
```

## Usage Examples

### Authentication Decorators

```python
@app.route('/api/protected-resource', methods=['POST'])
@token_required
@log_exceptions
def protected_route(current_user):
    # current_user is automatically provided by the decorator
    # Implementation...
```

### Database Utilities

```python
@app.route('/api/items/<int:item_id>', methods=['GET'])
@log_exceptions
def get_item(item_id):
    # Get the item or return 404 if not found
    item = get_or_404(Item, item_id, "Item not found")
    return jsonify(item.to_dict())
```

### Helper Functions

```python
@app.route('/')
def index():
    # Get category filter from request args
    category_id = request.args.get('category_id')
    # Get search term from request args
    search_term = request.args.get('search')
    # Get items from helper function with optional category filter and search term
    items = prepare_items_for_template(category_id=category_id, search=search_term)
    return render_template('index.html', items=items)
```
