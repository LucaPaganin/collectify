"""API routes for categories in the Collectify application."""
from flask import jsonify, request, current_app
from models import db, Category
from utils.auth import requires_auth, token_required
from utils.decorators import log_exceptions

def register_category_routes(app):
    """Register category API routes with the Flask application."""
    
    @app.route('/api/categories', methods=['GET'])
    @log_exceptions
    def get_categories():
        """Publicly fetches all categories for filtering and forms."""
        categories = [category.to_dict() for category in Category.query.order_by(Category.name).all()]
        return jsonify(categories)

    @app.route('/api/categories', methods=['POST'])
    @token_required
    @log_exceptions
    def add_category(current_user, *args, **kwargs):
        """Adds a new category (protected)."""
        data = request.get_json()
        if not data or not data.get('name'):
            current_app.logger.warning(f"Add category failed: Missing category name in request data")
            return jsonify({'error': 'Category name is required'}), 400
        
        # Check for duplicate name before creating
        existing = Category.query.filter_by(name=data['name']).first()
        if existing:
            current_app.logger.info(f"Add category failed: Category '{data['name']}' already exists")
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
        current_app.logger.info(f"Category '{data['name']}' created successfully with ID {new_category.id}")
        return jsonify(new_category.to_dict()), 201

    @app.route('/api/categories/<int:category_id>', methods=['PUT'])
    @token_required
    @log_exceptions
    def update_category(current_user, category_id):
        """Updates a category."""
        data = request.get_json()
        if not data or not data.get('name'):
            current_app.logger.warning(f"Update category {category_id} failed: Missing category name in request data")
            return jsonify({'error': 'Category name is required'}), 400
        
        # Check if category exists
        category = Category.query.get(category_id)
        if not category:
            current_app.logger.warning(f"Update category failed: Category ID {category_id} not found")
            return jsonify({'error': 'Category not found'}), 404
            
        # Check if new name already exists
        existing = Category.query.filter(Category.name == data['name'], Category.id != category_id).first()
        if existing:
            current_app.logger.info(f"Update category {category_id} failed: New name '{data['name']}' already exists")
            return jsonify({'error': 'Category name already exists'}), 400
        
        old_name = category.name
        # Update and save
        category.name = data['name']
        
        # Update specifications schema if provided
        if 'specifications_schema' in data:
            category.set_specifications_schema(data['specifications_schema'])
        
        db.session.commit()
        current_app.logger.info(f"Category {category_id} updated successfully: '{old_name}' -> '{category.name}'")
        return jsonify(category.to_dict())
    
    @app.route('/api/categories/<int:category_id>', methods=['DELETE'])
    @token_required
    @log_exceptions
    def delete_category(current_user, category_id):
        """Deletes a category."""
        category = Category.query.get(category_id)
        if not category:
            current_app.logger.warning(f"Delete category failed: Category ID {category_id} not found")
            return jsonify({'error': 'Category not found'}), 404
        
        category_name = category.name
        db.session.delete(category)
        db.session.commit()
        current_app.logger.info(f"Category {category_id} '{category_name}' deleted successfully")
        return jsonify({'result': 'success'}), 200

    @app.route('/api/categories/<int:category_id>/specifications_schema', methods=['GET'])
    @log_exceptions
    def get_category_specifications_schema(category_id):
        """Get specifications schema for a specific category."""
        category = Category.query.get(category_id)
        if not category:
            current_app.logger.warning(f"Get specifications schema failed: Category ID {category_id} not found")
            return jsonify({'error': 'Category not found'}), 404
        
        current_app.logger.debug(f"Retrieved specifications schema for category {category_id}")
        return jsonify(category.get_specifications_schema())

    @app.route('/api/categories/<int:category_id>/specifications_schema', methods=['PUT'])
    @token_required
    @log_exceptions
    def update_category_specifications_schema(current_user, category_id):
        """Update specifications schema for a specific category."""
        data = request.get_json()
        if data is None:
            current_app.logger.warning(f"Update specifications schema failed: Missing data in request for category {category_id}")
            return jsonify({'error': 'Specifications schema is required'}), 400
        
        category = Category.query.get(category_id)
        if not category:
            current_app.logger.warning(f"Update specifications schema failed: Category ID {category_id} not found")
            return jsonify({'error': 'Category not found'}), 404
        
        # Handle both array and dictionary formats
        category.set_specifications_schema(data)
        db.session.commit()
        
        current_app.logger.info(f"Updated specifications schema for category {category_id} '{category.name}'")
        # Return the specifications schema directly as a list
        # This matches what the tests expect
        return jsonify(category.get_specifications_schema()), 200
            
    # Add compatibility routes for tests
    @app.route('/api/categories/<int:category_id>/specifications', methods=['GET'])
    @log_exceptions
    def get_category_specifications(category_id):
        """Get specifications schema for a specific category (compatibility route)."""
        return get_category_specifications_schema(category_id)

    @app.route('/api/categories/<int:category_id>/specifications', methods=['PUT'])
    @token_required
    @log_exceptions
    def update_category_specifications(current_user, category_id):
        """Update specifications schema for a specific category (compatibility route)."""
        return update_category_specifications_schema(current_user, category_id)
