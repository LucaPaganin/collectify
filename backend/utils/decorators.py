"""Utility decorators for error handling and logging."""
import traceback
import functools
from flask import current_app, jsonify, request
from models import db

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
