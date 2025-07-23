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
            # Check for duplicate name before creating
            existing = Category.query.filter_by(name=data['name']).first()
            if existing:
                return jsonify({'error': 'Category already exists'}), 400
                
            new_category = Category(name=data['name'])
            
            # Add specifications schema if provided
            if 'specifications_schema' in data:
                new_category.set_specifications_schema(data['specifications_schema'])
            else:
                # Default empty schema
                new_category.set_specifications_schema([])
                
            db.session.add(new_category)
            db.session.commit()
            return jsonify(new_category.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/api/categories/<int:category_id>', methods=['PUT'])
    @requires_auth
    def update_category(category_id):
        """Updates a category."""
        data = request.get_json()
        if not data or not data.get('name'):
            return jsonify({'error': 'Category name is required'}), 400
        
        # Check if category exists
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
            
        # Check if new name already exists
        existing = Category.query.filter(Category.name == data['name'], Category.id != category_id).first()
        if existing:
            return jsonify({'error': 'Category name already exists'}), 400
        
        # Update and save
        category.name = data['name']
        
        # Update specifications schema if provided
        if 'specifications_schema' in data:
            category.set_specifications_schema(data['specifications_schema'])
        
        db.session.commit()
        return jsonify(category.to_dict())
    
    @app.route('/api/categories/<int:category_id>', methods=['DELETE'])
    @requires_auth
    def delete_category(category_id):
        """Deletes a category."""
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        try:
            db.session.delete(category)
            db.session.commit()
            return jsonify({'result': 'success'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/api/categories/<int:category_id>/specifications_schema', methods=['GET'])
    def get_category_specifications_schema(category_id):
        """Get specifications schema for a specific category."""
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        return jsonify(category.get_specifications_schema())

    @app.route('/api/categories/<int:category_id>/specifications_schema', methods=['PUT'])
    @requires_auth
    def update_category_specifications_schema(category_id):
        """Update specifications schema for a specific category."""
        data = request.get_json()
        if data is None:
            return jsonify({'error': 'Specifications schema is required'}), 400
        
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Category not found'}), 404
        
        try:
            # Handle both array and dictionary formats
            category.set_specifications_schema(data)
            db.session.commit()
            
            # Return the specifications schema directly as a list
            # This matches what the tests expect
            return jsonify(category.get_specifications_schema()), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
            
    # Add compatibility routes for tests
    @app.route('/api/categories/<int:category_id>/specifications', methods=['GET'])
    def get_category_specifications(category_id):
        """Get specifications schema for a specific category (compatibility route)."""
        return get_category_specifications_schema(category_id)

    @app.route('/api/categories/<int:category_id>/specifications', methods=['PUT'])
    @requires_auth
    def update_category_specifications(category_id):
        """Update specifications schema for a specific category (compatibility route)."""
        return update_category_specifications_schema(category_id)
