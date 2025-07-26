"""Configuration module for the Flask application."""
import os
from flask import Flask

def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__, 
                static_url_path='/static', 
                static_folder='static', 
                template_folder='templates')
    
    # Create data directory if it doesn't exist
    data_dir = os.path.join(app.root_path, 'data')
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(data_dir, 'collectibles.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(data_dir, 'uploads')
    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
    
    # Ensure uploads directory exists
    uploads_dir = os.path.join(data_dir, 'uploads')
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    
    return app
