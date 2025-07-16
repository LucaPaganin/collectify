import os
from flask import Flask
from models import db, Category, Item, ItemPhoto, ItemUrl


def init_db(app):
    """Initialize the database with SQLAlchemy models"""
    with app.app_context():
        # Create all tables
        db.drop_all()
        db.create_all()
        
        # Add default categories
        categories = [
            Category(name='Uncategorized'),
            Category(name='Vinyl Records'),
            Category(name='Action Figures'),
            Category(name='Trading Cards'),
            Category(name='Comics'),
            Category(name='Stamps')
        ]
        db.session.add_all(categories)
        db.session.commit()


def ensure_db_initialized(app):
    """Check if database needs initialization and do it if needed"""
    db_path = os.path.join(app.root_path, 'collectibles.db')
    if not os.path.exists(db_path):
        # Ensure upload folder exists
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
        init_db(app)
        print("Database initialized.")
        return True
    return False


if __name__ == "__main__":
    # This allows running the script directly to initialize the database
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'collectibles.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    
    # Initialize the SQLAlchemy extension with our Flask app
    db.init_app(app)
    
    # Initialize the database
    with app.app_context():
        db.drop_all()
        db.create_all()
        
        # Add sample categories with specification schemas
        vinyl_specs = {
            "diameter": {
                "type": "select",
                "label": "Diameter",
                "placeholder": "Select record size",
                "options": [
                    {"value": "7", "label": "7\" (45 RPM Single)"},
                    {"value": "10", "label": "10\" (EP/LP)"},
                    {"value": "12", "label": "12\" (LP)"}
                ]
            },
            "rpm": {
                "type": "select",
                "label": "RPM",
                "options": [
                    {"value": "33.3", "label": "33 1/3 RPM"},
                    {"value": "45", "label": "45 RPM"},
                    {"value": "78", "label": "78 RPM"}
                ]
            },
            "condition": {
                "type": "select",
                "label": "Condition",
                "options": [
                    {"value": "mint", "label": "Mint"},
                    {"value": "near_mint", "label": "Near Mint"},
                    {"value": "very_good", "label": "Very Good"},
                    {"value": "good", "label": "Good"},
                    {"value": "fair", "label": "Fair"},
                    {"value": "poor", "label": "Poor"}
                ]
            },
            "release_year": {
                "type": "number",
                "label": "Release Year",
                "min": 1900,
                "max": 2025
            }
        }
        
        action_figure_specs = {
            "height": {
                "type": "number",
                "label": "Height (cm)",
                "placeholder": "Height in centimeters",
                "min": 0,
                "step": 0.1
            },
            "articulation_points": {
                "type": "number",
                "label": "Articulation Points",
                "placeholder": "Number of articulation points",
                "min": 0
            },
            "material": {
                "type": "text",
                "label": "Material",
                "placeholder": "e.g., Plastic, Die-cast"
            },
            "condition": {
                "type": "select",
                "label": "Condition",
                "options": [
                    {"value": "sealed", "label": "Sealed in Box"},
                    {"value": "mint", "label": "Mint"},
                    {"value": "complete", "label": "Complete"},
                    {"value": "loose", "label": "Loose"},
                    {"value": "damaged", "label": "Damaged"}
                ]
            }
        }
        
        uncategorized = Category(name='Uncategorized')
        uncategorized.set_specifications_schema({})
        
        vinyl_records = Category(name='Vinyl Records')
        vinyl_records.set_specifications_schema(vinyl_specs)
        
        action_figures = Category(name='Action Figures')
        action_figures.set_specifications_schema(action_figure_specs)
        
        categories = [
            uncategorized,
            vinyl_records,
            action_figures,
            Category(name='Trading Cards'),
            Category(name='Comics'),
            Category(name='Stamps')
        ]
        db.session.add_all(categories)
        db.session.commit()
        
    print("Database initialized with sample categories.")
