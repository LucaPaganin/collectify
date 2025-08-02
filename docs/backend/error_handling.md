# Error Handling & Logging

Collectify implements a comprehensive error handling and logging system to provide reliable error reporting, facilitate debugging, and maintain application stability.

## Logging Configuration

The logging system is configured in `app.py` and uses Python's built-in `logging` module with the following features:

### Log Rotation

```python
# Create logs directory if it doesn't exist
if not os.path.exists('logs'):
    os.mkdir('logs')

# Set up rotating file handler
file_handler = RotatingFileHandler('logs/collectify.log', maxBytes=10240000, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)
```

Key features:
- Log files are stored in the `logs` directory
- Files rotate when they reach 10MB (~10,240,000 bytes)
- 10 backup files are kept before the oldest is deleted
- Logs include timestamp, level, message, file path, and line number

## Centralized Exception Handling

### The Log Exceptions Decorator

To standardize error handling across all routes, Collectify uses a `@log_exceptions` decorator defined in `utils/decorators.py`:

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

This decorator:
1. Wraps route handler functions
2. Catches any exceptions that occur during execution
3. Rolls back database transactions to maintain data integrity
4. Logs detailed error information including traceback
5. Returns a standardized JSON error response to the client

### Usage in Routes

All route handlers are decorated with `@log_exceptions`:

```python
@app.route('/api/items', methods=['GET'])
@log_exceptions
def get_items():
    # Implementation...
```

For routes with authentication requirements, the decorator order is important:

```python
@app.route('/api/items', methods=['POST'])
@token_required
@log_exceptions
def add_item(current_user):
    # Implementation...
```

## Log Levels

The application uses standard Python logging levels:

| Level     | Purpose                                           | Example                                         |
|-----------|---------------------------------------------------|--------------------------------------------------|
| ERROR     | Critical issues that prevent functionality        | Database connection failure, unhandled exception |
| WARNING   | Non-critical issues that may indicate problems    | Invalid input data, authentication failure      |
| INFO      | Informational messages about normal operation     | User login, item created, server started        |
| DEBUG     | Detailed diagnostic information                   | Request parameters, query details               |

## Types of Logged Events

### Authentication Events
- User registration attempts (success/failure)
- Login attempts (success/failure)
- Token validation failures
- Authorization failures (accessing admin-only routes)

### Database Operations
- Database initialization
- Transaction failures
- Constraint violations

### User Management
- User creation, update, and deletion
- Role changes

### Item Operations
- Item creation, update, and deletion
- File upload errors
- Invalid specification values

### Application Lifecycle
- Application startup and shutdown
- Configuration loading
- Route registration

## Example Log Entries

```
2023-08-01 12:34:56,789 INFO: Collectify application starting up [in app.py:150]
2023-08-01 12:35:23,456 INFO: User 'admin' logged in successfully [in routes/auth.py:78]
2023-08-01 12:36:12,345 WARNING: Login failed: User 'unknown' not found [in routes/auth.py:65]
2023-08-01 12:37:45,678 ERROR: Error in add_item (/api/items): Database error: UNIQUE constraint failed [in routes/items.py:56]
```

## Client-Side Error Handling

API responses follow a consistent format for both success and error cases:

### Success Response
```json
{
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message describing the problem",
  "endpoint": "endpoint_name"
}
```

HTTP status codes are used appropriately:
- 400: Bad Request (invalid input)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error (server-side problem)

## Database Error Handling

Database errors are handled through the centralized exception system, with special attention to:

1. **Transaction Management**: All transactions are wrapped in the `@log_exceptions` decorator, ensuring automatic rollback on error
2. **Constraint Violations**: Unique constraint violations are caught and returned as 400 Bad Request responses
3. **Connection Issues**: Database connection errors are logged at the ERROR level

## Viewing Logs

To view logs in development or production:

```bash
# Display the most recent log entries
tail -f backend/logs/collectify.log

# Search for specific errors
grep "ERROR" backend/logs/collectify.log

# Filter logs for a specific endpoint
grep "/api/items" backend/logs/collectify.log
```

## Testing Error Handling

The test suite includes specific tests for error handling:

1. Tests for expected error responses from API endpoints
2. Tests for proper error logging
3. Tests for database rollback on error

These tests ensure that the error handling system works correctly and consistently across all routes.
