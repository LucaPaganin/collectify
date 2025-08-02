"""Silent authentication utilities for the application."""
import os
from functools import wraps
from flask import request, jsonify

def check_auth(username, password):
    """Simple basic authentication check."""
    return username == os.getenv('ADMIN_USERNAME', 'admin') and password == os.getenv('ADMIN_PASSWORD', 'password')

def silent_requires_auth(f):
    """Decorator to protect routes with basic authentication but without prompting."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            # Return unauthorized without WWW-Authenticate header
            return jsonify({'error': 'Unauthorized access'}), 401
        return f(*args, **kwargs)
    return decorated
