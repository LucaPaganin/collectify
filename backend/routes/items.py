"""API routes for items in the Collectify application."""
import os
import json
from flask import request, jsonify, current_app
from models import db, Item, ItemUrl, ItemPhoto, Category
from utils.auth import requires_auth, token_required
from utils.decorators import log_exceptions

def register_item_routes(app):
    """Register item API routes with the Flask application."""
    
    @app.route('/api/items', methods=['GET'])
    @log_exceptions
    def get_items():
        """Fetches a list of all items, with optional search and category filtering."""
        query = Item.query.join(Item.category, isouter=True)
        
        # Filter by category if requested
        if request.args.get('category_id'):
            try:
                category_id = int(request.args.get('category_id'))
                query = query.filter(Item.category_id == category_id)
                app.logger.info(f"Filtering by category_id: {category_id}")
            except ValueError:
                # Handle invalid category_id parameter
                app.logger.warning(f"Invalid category_id parameter: {request.args.get('category_id')}")
                return jsonify({'error': 'Invalid category ID format'}), 400
        
        # Text search if requested
        if request.args.get('search'):
            search_term = request.args.get('search')
            app.logger.info(f"Searching for term: {search_term}")
            search_pattern = f"%{search_term}%"
            query = query.filter(Item.name.ilike(search_pattern))
        
        query = query.order_by(Item.name)
        items = [item.to_dict() for item in query.all()]
        
        app.logger.info(f"Returning {len(items)} items")
        return jsonify(items)

    @app.route('/api/items/<int:id>', methods=['GET'])
    @log_exceptions
    def get_item(id):
        """Fetches full details for a single item."""
        item = Item.query.get(id)
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
        
        # Validate required fields - only name and category_id are required
        if not data.get('name'):
            return jsonify({'error': 'Name is required'}), 400
        if not data.get('category_id'):
            return jsonify({'error': 'Category is required'}), 400
        
        # Verify category exists
        category_id = data.get('category_id')
        category = Category.query.get(category_id)
        if not category:
            return jsonify({'error': 'Selected category does not exist'}), 400
            
        # Create new item with only required fields
        new_item = Item(
            category_id=category_id,
            name=data.get('name')
        )
        
        # Set optional fields if provided
        if data.get('brand'):
            new_item.brand = data.get('brand')
        if data.get('serial_number'):
            new_item.serial_number = data.get('serial_number')
        if data.get('form_factor'):
            new_item.form_factor = data.get('form_factor')
        if data.get('description'):
            new_item.description = data.get('description')
        
        # Handle specification values properly
        spec_values_json = data.get('specification_values', '{}')
        if isinstance(spec_values_json, str):
            new_item.set_specification_values(json.loads(spec_values_json))
        else:
            # Already a dict/JSON object
            new_item.set_specification_values(spec_values_json)
        
        # Add URLs
        if is_json and data.get('urls'):
            # JSON format
            urls = data.get('urls')
            if isinstance(urls, list):
                for url_obj in urls:
                    if isinstance(url_obj, dict) and url_obj.get('url'):
                        new_item.urls.append(ItemUrl(url=url_obj.get('url')))
                    elif isinstance(url_obj, str):
                        new_item.urls.append(ItemUrl(url=url_obj))
        elif not is_json:
            # Form data - handle both array and JSON string in 'urls' field
            if data.get('urls'):
                try:
                    # Try to parse as JSON string
                    urls_data = json.loads(data.get('urls'))
                    if isinstance(urls_data, list):
                        for url_obj in urls_data:
                            if isinstance(url_obj, dict) and url_obj.get('url'):
                                new_item.urls.append(ItemUrl(url=url_obj.get('url')))
                            elif isinstance(url_obj, str):
                                new_item.urls.append(ItemUrl(url=url_obj))
                except json.JSONDecodeError:
                    # Not a JSON string, handle as regular form data
                    pass
            
            # Also check for form array notation
            for url in request.form.getlist('urls[]'):
                if url:
                    new_item.urls.append(ItemUrl(url=url))
        
        # Add item to session before processing photos
        db.session.add(new_item)
        db.session.flush()  # This assigns an ID without committing
        
        # Process photos
        if files:
            for file in files.getlist('photos[]'):
                if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']:
                    filename = f"item_{new_item.id}_{file.filename}"
                    file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
                    new_item.photos.append(ItemPhoto(file_path=filename))
        
        # Commit all changes
        db.session.commit()
        
        # Ensure a fresh instance for the response
        db.session.refresh(new_item)
        return jsonify(new_item.to_dict()), 201

    @app.route('/api/items/<int:id>', methods=['PUT'])
    @token_required
    @log_exceptions
    def update_item(current_user, id):
        """Updates an existing item."""
        item = Item.query.get(id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        # Handle both JSON and form data
        is_json = request.is_json
        data = request.get_json() if is_json else request.form
        files = request.files if not is_json else None
        
        # Only validate and update fields that are provided
        if data.get('name'):
            item.name = data.get('name')
        if data.get('category_id'):
            item.category_id = data.get('category_id')
        if data.get('brand'):
            item.brand = data.get('brand')
        if data.get('serial_number') is not None:
            item.serial_number = data.get('serial_number')
        if data.get('form_factor') is not None:
            item.form_factor = data.get('form_factor')
        if data.get('description') is not None:
            item.description = data.get('description')
        
        # Handle specification values if provided
        if data.get('specification_values') is not None:
            spec_values_json = data.get('specification_values')
            if isinstance(spec_values_json, str):
                item.set_specification_values(json.loads(spec_values_json))
            else:
                # Already a dict/JSON object
                item.set_specification_values(spec_values_json)
        
        # Update URLs if provided
        if is_json and data.get('urls') is not None:
            # JSON format - replace all URLs
            ItemUrl.query.filter_by(item_id=id).delete()
            urls = data.get('urls')
            if isinstance(urls, list):
                for url_obj in urls:
                    if isinstance(url_obj, dict) and url_obj.get('url'):
                        item.urls.append(ItemUrl(url=url_obj.get('url')))
                    elif isinstance(url_obj, str):
                        item.urls.append(ItemUrl(url=url_obj))
        elif not is_json and 'urls[]' in request.form:
            # Form data - replace all URLs
            ItemUrl.query.filter_by(item_id=id).delete()
            for url in request.form.getlist('urls[]'):
                if url:
                    item.urls.append(ItemUrl(url=url))
        
        # Process photos if provided
        if files and files.getlist('photos[]'):
            for file in files.getlist('photos[]'):
                if file and file.filename and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']:
                    filename = f"item_{id}_{file.filename}"
                    file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
                    item.photos.append(ItemPhoto(file_path=filename))
        
        db.session.commit()
        
        # Ensure a fresh instance for the response
        db.session.refresh(item)
        return jsonify(item.to_dict())

    @app.route('/api/items/<int:id>', methods=['DELETE'])
    @token_required
    @log_exceptions
    def delete_item(current_user, id):
        """Deletes an item."""
        item = Item.query.get(id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        # Delete physical photo files
        for photo in item.photos:
            try:
                os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], photo.file_path))
            except OSError as e:
                current_app.logger.warning(f"Error deleting file {photo.file_path}: {e}")
        
        # Delete from database (cascade will handle related records)
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Item deleted'})
            
    @app.route('/api/items/<int:id>/urls', methods=['POST'])
    @token_required
    @log_exceptions
    def add_item_url(current_user, id):
        """Adds a URL to an item."""
        item = Item.query.get(id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
            
        data = request.get_json()
        if not data or not data.get('url'):
            return jsonify({'error': 'URL is required'}), 400
            
        url = ItemUrl(item_id=id, url=data['url'])
        db.session.add(url)
        db.session.commit()
        
        return jsonify({'id': url.id, 'url': url.url}), 201
    
    @app.route('/api/items/<int:id>/urls/<int:url_id>', methods=['DELETE'])
    @token_required
    @log_exceptions
    def delete_item_url(current_user, id, url_id):
        """Deletes a URL from an item."""
        item = Item.query.get(id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
            
        url = ItemUrl.query.get(url_id)
        if not url or url.item_id != id:
            return jsonify({'error': 'URL not found for this item'}), 404
            
        db.session.delete(url)
        db.session.commit()
        return jsonify({'result': 'success'}), 200
    
    @app.route('/api/items/<int:id>/photos', methods=['POST'])
    @token_required
    @log_exceptions
    def add_item_photo(current_user, id):
        """Adds a photo to an item."""
        item = Item.query.get(id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
            
        if 'photos[]' not in request.files:
            return jsonify({'error': 'No photo provided'}), 400
            
        file = request.files['photos[]']
        if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']:
            filename = f"item_{id}_{file.filename}"
            file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
            
            photo = ItemPhoto(item_id=id, file_path=filename)
            db.session.add(photo)
            db.session.commit()
            
            return jsonify({'id': photo.id, 'filename': filename}), 201
        else:
            return jsonify({'error': 'Invalid file format'}), 400
