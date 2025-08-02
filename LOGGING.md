# Collectify Logging Implementation

## Overview

This document describes the logging implementation in the Collectify application. The logging system is designed to capture errors, warnings, and informational events throughout the application, providing valuable troubleshooting information in case of problems.

## Logging Configuration

The main logging configuration is defined in `app.py` and includes:

- Log file location: `logs/collectify.log`
- Log rotation: 10MB max size with 10 backup files
- Formatting: Includes timestamp, log level, message, file path, and line number
- Default log level: INFO in production, DEBUG in development mode

## Log File Structure

Log entries follow this format:
```
YYYY-MM-DD HH:MM:SS,sss LEVEL: Message [in file_path:line_number]
```

For example:
```
2023-05-15 14:32:45,123 INFO: Collectify application starting up [in app.py:150]
2023-05-15 14:32:47,456 ERROR: Error creating category: Invalid name [in routes/categories.py:42]
```

## Centralized Exception Handling

To ensure consistent error logging and handling, we've implemented a centralized exception handling decorator `log_exceptions` in `utils/decorators.py`. This decorator:

1. Automatically catches exceptions in route handlers
2. Logs the exception with a detailed traceback
3. Rolls back any database changes to maintain data integrity
4. Returns a standardized JSON error response

### Using the Decorator

All API endpoint functions are decorated with `@log_exceptions` to ensure consistent error handling:

```python
@app.route('/api/items', methods=['GET'])
@log_exceptions
def get_items():
    # Function implementation...
    # No need for try/except blocks, the decorator handles exceptions
```

For protected routes, the order of decorators should be:

```python
@app.route('/api/items', methods=['POST'])
@token_required
@log_exceptions
def add_item(current_user):
    # Function implementation...
```

## Key Logged Events

### Authentication Events
- Login attempts (successful and failed)
- Token validation
- Authentication failures
- Authorization failures (admin access)

### Database Operations
- Database initialization
- Table creation
- Default data creation
- Database verification

### User Management
- User registration
- User updates
- Role changes
- User deletion

### Item Operations
- Item creation
- Item updates
- Specification changes
- File uploads

### Category Operations
- Category creation
- Category updates
- Category deletion
- Specification schema updates

### Application Lifecycle
- Application startup
- Server configuration
- Database initialization
- CLI command execution

## Customizing Logging

The default log level is INFO, which captures most important events without excessive detail. To enable more detailed logging:

1. Modify the log level in `app.py`:
   ```python
   file_handler.setLevel(logging.DEBUG)
   app.logger.setLevel(logging.DEBUG)
   ```

2. For production environments, consider keeping the level at INFO or WARNING to avoid excessive log size.

## Log File Management

Log files are stored in the `logs` directory and are automatically rotated when they reach 10MB in size. The system keeps 10 backup files before deleting the oldest logs.

To access logs:
1. Navigate to the `backend/logs` directory
2. Open `collectify.log` to view the most recent log entries
3. Rotated logs are named `collectify.log.1`, `collectify.log.2`, etc.

## Best Practices

When extending the application:
1. Use `current_app.logger` for consistent logging
2. Use the `@log_exceptions` decorator for all route handlers to ensure consistent error handling
3. Avoid manual try/except blocks in route handlers unless specialized handling is needed
4. Use appropriate log levels:
   - ERROR: For exceptions and failures
   - WARNING: For concerning but non-fatal issues
   - INFO: For normal operations and significant events
   - DEBUG: For detailed troubleshooting information
5. Include relevant context (IDs, names) in log messages
