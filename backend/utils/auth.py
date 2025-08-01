"""Authentication utilities for the application."""
import os
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, Response, jsonify, current_app
from models import User, db

# Keep the basic auth for compatibility
def check_auth(username, password):
    """Simple basic authentication for the admin panel."""
    return username == os.getenv('ADMIN_USERNAME', 'admin') and password == os.getenv('ADMIN_PASSWORD', 'password')

def authenticate():
    """Sends a 401 response that enables basic auth."""
    return Response(
        'Could not verify your access level for that URL.\n'
        'You have to login with proper credentials', 401,
        {'WWW-Authenticate': 'Basic realm="Login Required"'})

def requires_auth(f):
    """Decorator to protect routes with basic authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated

# JWT Authentication
def token_required(f):
    """Decorator to require a valid JWT token for API access."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if token is in the headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        
        try:
            # Decode the token
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data.get('user_id')
            
            # Check if user exists
            current_user = User.query.get(current_user_id)
            
            if not current_user:
                return jsonify({'error': 'User not found!'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token!'}), 401
            
        # Pass the current user to the route
        return f(current_user, *args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator to require admin privileges for API access."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if token is in the headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        
        try:
            # Decode the token
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data.get('user_id')
            
            # Check if user exists and is admin
            current_user = User.query.get(current_user_id)
            
            if not current_user:
                return jsonify({'error': 'User not found!'}), 401
                
            if not current_user.is_admin:
                return jsonify({'error': 'Admin privileges required!'}), 403
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token!'}), 401
            
        # Pass the current user to the route
        return f(current_user, *args, **kwargs)
    
    return decorated

def generate_token(user, expires_in=86400):
    """Generate a JWT token for the given user.
    
    Args:
        user (User): The user object
        expires_in (int): Token expiration time in seconds (default: 24 hours)
        
    Returns:
        str: The JWT token
    """
    # Set expiration time
    exp_time = datetime.utcnow() + timedelta(seconds=expires_in)
    
    # Create the payload
    payload = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_admin,
        'exp': exp_time.timestamp()
    }
    
    # Generate the token
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm="HS256")
    
    return token
