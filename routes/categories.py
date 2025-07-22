"""API routes for categories in the Collectify application."""
from flask import jsonify, request
from models import db, Category
from utils.auth import requires_auth

def register_category_routes(app):
    """Register category API routes with the Flask application."""
    
    @app.route('/api/categories', methods=['GET'])
    def get_categories():
        """Publicly fetches all categories for filtering and forms."""
        categories = [category.to_dict() for category in Category.query.order_by(Category.name).all()]
        return jsonify(categories)

    @app.route('/api/categories', methods=['POST'])
    @requires_auth
    def add_category():
        """Adds a new category (protected)."""
        data = request.get_json()
        if not data or not data.get('name'):
            return jsonify({'error': 'Category name is required'}), 400
        
        try:
            new_category = Category(name=data['name'])
            
            # Add specifications schema if provided
            if 'specifications_schema' in data:
                new_category.set_specifications_schema(data['specifications_schema'])
            else:
                # Default empty schema
                new_category.set_specifications_schema({})
                
            db.session.add(new_category)
            db.session.commit()
            return jsonify(new_category.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            # Check if this is a duplicate name error
            if "UNIQUE constraint failed" in str(e):
                return jsonify({'error': 'Category already exists'}), 409
            return jsonify({'error': str(e)}), 500

    @app.route('/api/categories/<int:id>', methods=['PUT'])
    @requires_auth
    def update_category(id):
        """Updates a category including its name and specifications schema."""
        data = request.get_json()
        if not data or not data.get('name'):
            return jsonify({'error': 'Category name is required'}), 400
        
        # Check if category exists
        category = Category.query.get(id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
            
        # Check if new name already exists
        existing = Category.query.filter(Category.name == data['name'], Category.id != id).first()
        if existing:
            return jsonify({'error': 'Category name already exists'}), 409
        
        # Update and save
        category.name = data['name']
        
        # Update specifications schema if provided
        if 'specifications_schema' in data:
            category.set_specifications_schema(data['specifications_schema'])
        
        db.session.commit()
        return jsonify(category.to_dict())

    @app.route('/api/categories/<int:id>/specifications_schema', methods=['GET'])
    def get_category_specifications_schema(id):
        """Get specifications schema for a specific category."""
        category = Category.query.get(id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        return jsonify(category.get_specifications_schema())

    @app.route('/api/categories/<int:id>/specifications_schema', methods=['PUT'])
    @requires_auth
    def update_category_specifications_schema(id):
        """Update specifications schema for a specific category."""
        data = request.get_json()
        if data is None:
            return jsonify({'error': 'Specifications schema is required'}), 400
        
        category = Category.query.get(id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        try:
            category.set_specifications_schema(data)
            db.session.commit()
            return jsonify(category.to_dict())
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
