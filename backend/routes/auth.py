from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
import jwt
from datetime import datetime, timedelta
from functools import wraps
import traceback
from utils.decorators import log_exceptions

auth_bp = Blueprint('auth', __name__)

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

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user.is_admin:
            current_app.logger.warning(f"Authorization failed: Admin privileges required for {request.path} - User {current_user.username} (ID: {current_user.id}) is not an admin")
            return jsonify({'error': 'Admin privileges required'}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/register', methods=['POST'])
@log_exceptions
def register():
    data = request.get_json()
    
    # Check if required fields are present
    if not data or not data.get('username') or not data.get('password') or not data.get('email'):
        current_app.logger.warning("User registration failed: Missing required fields")
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if username already exists
    if User.query.filter_by(username=data['username']).first():
        current_app.logger.info(f"User registration failed: Username '{data['username']}' already exists")
        return jsonify({'error': 'Username already exists'}), 409
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        current_app.logger.info(f"User registration failed: Email '{data['email']}' already exists")
        return jsonify({'error': 'Email already exists'}), 409
    
    # Create new user
    new_user = User(
        username=data['username'],
        email=data['email'],
        is_admin=data.get('is_admin', False)  # Default to regular user
    )
    new_user.set_password(data['password'])
    
    # First user is automatically an admin
    if User.query.count() == 0:
        new_user.is_admin = True
        current_app.logger.info(f"First user '{data['username']}' created as admin")
    
    # Save to database
    db.session.add(new_user)
    db.session.commit()
    
    current_app.logger.info(f"User '{data['username']}' registered successfully with ID {new_user.id}")
    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
@log_exceptions
def login():
    data = request.get_json()
    
    # Check if required fields are present
    if not data or not data.get('username') or not data.get('password'):
        current_app.logger.warning("Login failed: Missing username or password")
        return jsonify({'error': 'Missing username or password'}), 400
    
    # Find user by username
    user = User.query.filter_by(username=data['username']).first()
    
    # Check if user exists and password is correct
    if not user:
        current_app.logger.warning(f"Login failed: User '{data['username']}' not found")
        return jsonify({'error': 'Invalid username or password'}), 401
    
    if not user.check_password(data['password']):
        current_app.logger.warning(f"Login failed: Invalid password for user '{data['username']}'")
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': user.id,
        'username': user.username,
        'is_admin': user.is_admin,
        'exp': datetime.utcnow() + timedelta(hours=24)  # Token expires after 24 hours
    }, current_app.config['SECRET_KEY'], algorithm="HS256")
    
    current_app.logger.info(f"User '{user.username}' logged in successfully")
    # Return token and user info
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_admin
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
@log_exceptions
def get_current_user(current_user):
    return jsonify(current_user.to_dict()), 200

# Admin routes

@auth_bp.route('/users', methods=['GET'])
@token_required
@admin_required
@log_exceptions
def get_all_users(current_user):
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200

@auth_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
@admin_required
@log_exceptions
def get_user(current_user, user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
@log_exceptions
def update_user(current_user, user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if not data:
        current_app.logger.warning(f"Update user failed: No data provided for user ID {user_id}")
        return jsonify({'error': 'No data provided'}), 400
    
    # Don't allow changing the last admin to non-admin
    if user.is_admin and not data.get('is_admin', True):
        admin_count = User.query.filter_by(is_admin=True).count()
        if admin_count <= 1:
            current_app.logger.warning(f"Update user failed: Attempted to remove last admin (user ID {user_id})")
            return jsonify({'error': 'Cannot remove the last admin user'}), 400
    
    # Update fields if provided
    if 'username' in data and data['username'] != user.username:
        if User.query.filter_by(username=data['username']).first():
            current_app.logger.info(f"Update user failed: Username '{data['username']}' already exists")
            return jsonify({'error': 'Username already exists'}), 409
        old_username = user.username
        user.username = data['username']
        current_app.logger.info(f"Username updated: '{old_username}' -> '{user.username}' for user ID {user_id}")
        
    if 'email' in data and data['email'] != user.email:
        if User.query.filter_by(email=data['email']).first():
            current_app.logger.info(f"Update user failed: Email '{data['email']}' already exists")
            return jsonify({'error': 'Email already exists'}), 409
        old_email = user.email
        user.email = data['email']
        current_app.logger.info(f"Email updated for user ID {user_id}")
        
    if 'password' in data:
        user.set_password(data['password'])
        current_app.logger.info(f"Password updated for user ID {user_id}")
        
    if 'is_admin' in data and user.is_admin != data['is_admin']:
        user.is_admin = data['is_admin']
        admin_status = "admin" if data['is_admin'] else "regular user"
        current_app.logger.info(f"User ID {user_id} role changed to {admin_status}")
    
    db.session.commit()
    current_app.logger.info(f"User ID {user_id} updated successfully")
    return jsonify(user.to_dict()), 200

@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
@log_exceptions
def delete_user(current_user, user_id):
    # Don't allow deleting yourself
    if current_user.id == user_id:
        current_app.logger.warning(f"Delete user failed: User {current_user.username} attempted to delete their own account")
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    user = User.query.get_or_404(user_id)
    
    # Don't allow deleting the last admin
    if user.is_admin:
        admin_count = User.query.filter_by(is_admin=True).count()
        if admin_count <= 1:
            current_app.logger.warning(f"Delete user failed: Attempted to delete the last admin user (ID: {user_id}, username: {user.username})")
            return jsonify({'error': 'Cannot delete the last admin user'}), 400
    
    username = user.username
    db.session.delete(user)
    db.session.commit()
    current_app.logger.info(f"User '{username}' (ID: {user_id}) deleted successfully by admin {current_user.username}")
    return jsonify({'message': 'User deleted successfully'}), 200
