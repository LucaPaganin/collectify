"""
A simple route handler to create an admin user with the SHA-256 hashing algorithm.
This is a workaround for the password hashing compatibility issue in Python 3.13.
"""

from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash
from models import db, User

admin_init_bp = Blueprint('admin_init', __name__)

@admin_init_bp.route('/init-admin', methods=['POST'])
def init_admin():
    """Create an admin user with the SHA-256 hashing algorithm."""
    # Check if we already have an admin user
    if User.query.filter_by(is_admin=True).first():
        return jsonify({'error': 'Admin user already exists'}), 400
    
    data = request.get_json()
    
    # Check required fields
    if not data or not data.get('username') or not data.get('password') or not data.get('email'):
        return jsonify({'error': 'Missing required fields (username, password, email)'}), 400
    
    # Create the admin user
    admin_user = User(
        username=data['username'],
        email=data['email'],
        is_admin=True
    )
    
    # Use the SHA-256 hashing algorithm explicitly
    admin_user.password_hash = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    # Save to database
    db.session.add(admin_user)
    db.session.commit()
    
    return jsonify({
        'message': 'Admin user created successfully',
        'user': {
            'id': admin_user.id,
            'username': admin_user.username,
            'email': admin_user.email,
            'is_admin': admin_user.is_admin
        }
    }), 201

def register_routes(app):
    """Register the admin initialization routes with the Flask app."""
    app.register_blueprint(admin_init_bp, url_prefix='/api')
