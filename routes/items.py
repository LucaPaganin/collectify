"""API routes for items in the Collectify application."""
import os
import json
from flask import request, jsonify, current_app
from models import db, Item, ItemUrl, ItemPhoto, Category

def register_item_routes(app):
    """Register item API routes with the Flask application."""
    
    @app.route('/api/items', methods=['GET'])
    def get_items():
        """Fetches a list of all items, with optional category filtering."""
        query = Item.query.join(Item.category, isouter=True)
        
        if request.args.get('category_id'):
            query = query.filter(Item.category_id == int(request.args.get('category_id')))
        
        query = query.order_by(Item.name)
        items = [item.to_dict() for item in query.all()]
        
        return jsonify(items)

    @app.route('/api/items/<int:id>', methods=['GET'])
    def get_item(id):
        """Fetches full details for a single item."""
        item = Item.query.get(id)
        if item:
            return jsonify(item.to_dict())
        return jsonify({'error': 'Item not found'}), 404

    @app.route('/api/items', methods=['POST'])
    def add_item():
        """Adds a new item."""
        try:
            # Validate required fields
            if not request.form.get('name'):
                return jsonify({'error': 'Name is required'}), 400
            if not request.form.get('category_id'):
                return jsonify({'error': 'Category is required'}), 400
            if not request.form.get('brand'):
                return jsonify({'error': 'Brand is required'}), 400
            
            # Verify category exists
            category_id = request.form.get('category_id')
            category = Category.query.get(category_id)
            if not category:
                return jsonify({'error': 'Selected category does not exist'}), 400
                
            # Create new item
            new_item = Item(
                category_id=category_id,
                name=request.form.get('name'),
                brand=request.form.get('brand'),
                serial_number=request.form.get('serial_number'),
                form_factor=request.form.get('form_factor'),
                description=request.form.get('description')
            )
            
            # Handle specification values properly
            spec_values_json = request.form.get('specification_values', '{}')
            new_item.set_specification_values(json.loads(spec_values_json))
            
            # Add URLs
            for url in request.form.getlist('urls[]'):
                if url:
                    new_item.urls.append(ItemUrl(url=url))
            
            # Add item to session before processing photos
            db.session.add(new_item)
            db.session.flush()  # This assigns an ID without committing
            
            # Process photos
            for file in request.files.getlist('photos[]'):
                if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']:
                    filename = f"item_{new_item.id}_{file.filename}"
                    file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
                    new_item.photos.append(ItemPhoto(file_path=filename))
            
            # Commit all changes
            db.session.commit()
            return jsonify(new_item.to_dict()), 201
        
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/api/items/<int:id>', methods=['PUT'])
    def update_item(id):
        """Updates an existing item."""
        item = Item.query.get(id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        try:
            # Validate required fields
            if not request.form.get('name'):
                return jsonify({'error': 'Name is required'}), 400
            if not request.form.get('category_id'):
                return jsonify({'error': 'Category is required'}), 400
            if not request.form.get('brand'):
                return jsonify({'error': 'Brand is required'}), 400
                
            # Update basic item information
            item.category_id = request.form.get('category_id')
            item.name = request.form.get('name')
            item.brand = request.form.get('brand')
            item.serial_number = request.form.get('serial_number')
            item.form_factor = request.form.get('form_factor')
            item.description = request.form.get('description')
            
            # Handle specification values properly
            spec_values_json = request.form.get('specification_values', '{}')
            item.set_specification_values(json.loads(spec_values_json))
            
            # Update URLs: remove all existing and add new ones
            ItemUrl.query.filter_by(item_id=id).delete()
            for url in request.form.getlist('urls[]'):
                if url:
                    item.urls.append(ItemUrl(url=url))
            
            # Add new photos if any
            for file in request.files.getlist('photos[]'):
                if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']:
                    filename = f"item_{id}_{file.filename}"
                    file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
                    item.photos.append(ItemPhoto(file_path=filename))
            
            db.session.commit()
            return jsonify(item.to_dict())
        
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/api/items/<int:id>', methods=['DELETE'])
    def delete_item(id):
        """Deletes an item."""
        item = Item.query.get(id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        try:
            # Delete physical photo files
            for photo in item.photos:
                try:
                    os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], photo.file_path))
                except OSError as e:
                    print(f"Error deleting file {photo.file_path}: {e}")
            
            # Delete from database (cascade will handle related records)
            db.session.delete(item)
            db.session.commit()
            
            return jsonify({'message': 'Item deleted'})
        
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
