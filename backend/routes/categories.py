"""API routes for categories in the Collectify application."""
from flask import jsonify, request, current_app
from utils.auth import requires_auth, token_required
from utils.decorators import log_exceptions
from services.category_service import CategoryService

def register_category_routes(app):
    """Register category API routes with the Flask application."""
    
    @app.route('/api/categories', methods=['GET'])
    @log_exceptions
    def get_categories():
        """Publicly fetches all categories for filtering and forms."""
        categories = CategoryService.get_all_categories()
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
        
        try:
            new_category = CategoryService.create_category(
                name=data['name'],
                specifications_schema=data.get('specifications_schema')
            )
            return jsonify(new_category.to_dict()), 201
        except ValueError as e:
            current_app.logger.info(f"Add category failed: {str(e)}")
            return jsonify({'error': str(e)}), 400

    @app.route('/api/categories/<int:category_id>', methods=['PUT'])
    @token_required
    @log_exceptions
    def update_category(current_user, category_id):
        """Updates a category."""
        data = request.get_json()
        if not data or not data.get('name'):
            current_app.logger.warning(f"Update category {category_id} failed: Missing category name in request data")
            return jsonify({'error': 'Category name is required'}), 400
        
        try:
            category = CategoryService.update_category(
                category_id=category_id,
                name=data['name'],
                specifications_schema=data.get('specifications_schema')
            )
            return jsonify(category.to_dict())
        except ValueError as e:
            current_app.logger.warning(f"Update category {category_id} failed: {str(e)}")
            status_code = 404 if 'not found' in str(e).lower() else 400
            return jsonify({'error': str(e)}), status_code
    
    @app.route('/api/categories/<int:category_id>', methods=['DELETE'])
    @token_required
    @log_exceptions
    def delete_category(current_user, category_id):
        """Deletes a category."""
        try:
            CategoryService.delete_category(category_id)
            return jsonify({'result': 'success'}), 200
        except ValueError as e:
            current_app.logger.warning(f"Delete category failed: {str(e)}")
            return jsonify({'error': str(e)}), 404

    @app.route('/api/categories/<int:category_id>/specifications_schema', methods=['GET'])
    @log_exceptions
    def get_category_specifications_schema(category_id):
        """Get specifications schema for a specific category."""
        try:
            schema = CategoryService.get_specifications_schema(category_id)
            current_app.logger.debug(f"Retrieved specifications schema for category {category_id}")
            return jsonify(schema)
        except ValueError as e:
            current_app.logger.warning(f"Get specifications schema failed: {str(e)}")
            return jsonify({'error': str(e)}), 404

    @app.route('/api/categories/<int:category_id>/specifications_schema', methods=['PUT'])
    @token_required
    @log_exceptions
    def update_category_specifications_schema(current_user, category_id):
        """Update specifications schema for a specific category."""
        data = request.get_json()
        if data is None:
            current_app.logger.warning(f"Update specifications schema failed: Missing data in request for category {category_id}")
            return jsonify({'error': 'Specifications schema is required'}), 400
        
        try:
            schema = CategoryService.update_specifications_schema(category_id, data)
            return jsonify(schema), 200
        except ValueError as e:
            current_app.logger.warning(f"Update specifications schema failed: {str(e)}")
            status_code = 404 if 'not found' in str(e).lower() else 400
            return jsonify({'error': str(e)}), status_code
            
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
