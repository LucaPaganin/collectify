"""API routes for items in the Collectify application."""
from flask import request, jsonify, current_app
from utils.auth import requires_auth, token_required
from utils.decorators import log_exceptions
from services.item_service import ItemService

def register_item_routes(app):
    """Register item API routes with the Flask application."""
    
    @app.route('/api/items', methods=['GET'])
    @log_exceptions
    def get_items():
        """Fetches a list of all items, with optional search and category filtering."""
        try:
            category_id = None
            if request.args.get('category_id'):
                try:
                    category_id = int(request.args.get('category_id'))
                    app.logger.info(f"Filtering by category_id: {category_id}")
                except ValueError:
                    app.logger.warning(f"Invalid category_id parameter: {request.args.get('category_id')}")
                    return jsonify({'error': 'Invalid category ID format'}), 400
            
            search_term = request.args.get('search')
            items = ItemService.get_items(category_id=category_id, search_term=search_term)
            
            app.logger.info(f"Returning {len(items)} items")
            return jsonify([item.to_dict() for item in items])
        except Exception as e:
            app.logger.error(f"Error fetching items: {str(e)}")
            return jsonify({'error': 'Internal server error'}), 500

    @app.route('/api/items/<int:id>', methods=['GET'])
    @log_exceptions
    def get_item(id):
        """Fetches full details for a single item."""
        item = ItemService.get_item_by_id(id)
        if item:
            return jsonify(item.to_dict())
        return jsonify({'error': 'Item not found'}), 404

    @app.route('/api/items', methods=['POST'])
    @token_required
    @log_exceptions
    def add_item(current_user):
        """Adds a new item."""
        # Handle both JSON and form data
        is_json = request.is_json
        data = request.get_json() if is_json else request.form
        files = request.files if not is_json else None
        
        try:
            new_item = ItemService.create_item(data, files)
            return jsonify(new_item.to_dict()), 201
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @app.route('/api/items/<int:id>', methods=['PUT'])
    @token_required
    @log_exceptions
    def update_item(current_user, id):
        """Updates an existing item."""
        # Handle both JSON and form data
        is_json = request.is_json
        data = request.get_json() if is_json else request.form
        files = request.files if not is_json else None
        
        try:
            item = ItemService.update_item(id, data, files)
            return jsonify(item.to_dict())
        except ValueError as e:
            status_code = 404 if 'not found' in str(e).lower() else 400
            return jsonify({'error': str(e)}), status_code

    @app.route('/api/items/<int:id>', methods=['DELETE'])
    @token_required
    @log_exceptions
    def delete_item(current_user, id):
        """Deletes an item."""
        try:
            ItemService.delete_item(id)
            return jsonify({'message': 'Item deleted'})
        except ValueError as e:
            return jsonify({'error': str(e)}), 404
            
    @app.route('/api/items/<int:id>/urls', methods=['POST'])
    @token_required
    @log_exceptions
    def add_item_url(current_user, id):
        """Adds a URL to an item."""
        data = request.get_json()
        if not data or not data.get('url'):
            return jsonify({'error': 'URL is required'}), 400
        
        try:
            url = ItemService.add_item_url(id, data['url'])
            return jsonify({'id': url.id, 'url': url.url}), 201
        except ValueError as e:
            return jsonify({'error': str(e)}), 404
    
    @app.route('/api/items/<int:id>/urls/<int:url_id>', methods=['DELETE'])
    @token_required
    @log_exceptions
    def delete_item_url(current_user, id, url_id):
        """Deletes a URL from an item."""
        try:
            ItemService.delete_item_url(id, url_id)
            return jsonify({'result': 'success'}), 200
        except ValueError as e:
            return jsonify({'error': str(e)}), 404
    
    @app.route('/api/items/<int:id>/photos', methods=['POST'])
    @token_required
    @log_exceptions
    def add_item_photo(current_user, id):
        """Adds a photo to an item."""
        if 'photos[]' not in request.files:
            return jsonify({'error': 'No photo provided'}), 400
            
        file = request.files['photos[]']
        try:
            photo = ItemService.add_item_photo(id, file)
            return jsonify({'id': photo.id, 'filename': photo.file_path}), 201
        except ValueError as e:
            status_code = 404 if 'not found' in str(e).lower() else 400
            return jsonify({'error': str(e)}), status_code
