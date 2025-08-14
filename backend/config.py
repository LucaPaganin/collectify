"""Configuration module for the Flask application."""
import os
import secrets
from flask import Flask
from pathlib import Path

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__, 
                static_url_path='/static', 
                static_folder='static', 
                template_folder='templates')
    
    # Create data directory if it doesn't exist
    data_dir = Path(app.root_path) / 'data'
    data_dir.mkdir(exist_ok=True, parents=True)

    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{data_dir / 'collectibles.db'}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = str(data_dir / 'uploads')
    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
    
    # Add a secret key for JWT
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    
    # Ensure uploads directory exists
    uploads_dir = data_dir / 'uploads'
    uploads_dir.mkdir(exist_ok=True, parents=True)

    return app
