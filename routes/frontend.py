"""Frontend routes for the Collectify application."""
import json
import os
from flask import render_template, abort, redirect, send_from_directory, request, current_app
from models import db, Item, Category, ItemUrl, ItemPhoto
from utils.auth import requires_auth
from utils.helpers import prepare_items_for_template

def register_frontend_routes(app):
    """Register frontend routes with the Flask application."""
    
    @app.route('/')
    def index():
        """Serves the main public page with items and categories for server-side rendering."""
        # Fetch categories
        categories = [c.to_dict() for c in Category.query.order_by(Category.name).all()]
        # Get items from helper function
        items = prepare_items_for_template()
        return render_template('index.html', page_title="My Collection", categories=categories, items=items)

    @app.route('/item/<int:id>')
    def view_item(id):
        """View item details page."""
        item = Item.query.get(id)
        if not item:
            abort(404)
        primary_photo_url = f"/uploads/{item.primary_photo}" if getattr(item, 'primary_photo', None) else "https://placehold.co/600x400/eee/ccc?text=No+Image"
        specifications = item.specification_values if hasattr(item, 'specification_values') else {}
        try:
            specifications = json.loads(specifications)
        except json.JSONDecodeError:
            specifications = {}
        urls = [u.url for u in getattr(item, 'urls', [])] if hasattr(item, 'urls') else []
        return render_template('view_item.html', item={
            'id': item.id,
            'name': item.name,
            'brand': item.brand,
            'category_name': item.category.name if item.category else '',
            'serial_number': item.serial_number,
            'form_factor': item.form_factor,
            'description': item.description,
            'primary_photo_url': primary_photo_url,
            'specifications': specifications,
            'urls': urls
        })

    @app.route('/admin.html')
    @requires_auth
    def admin():
        """Serves the protected admin page for category management using Jinja2 template inheritance."""
        return render_template('admin.html', page_title="Admin Panel")

    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        """Serves uploaded image files."""
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        
    @app.route('/item/<int:id>/edit', methods=['POST'])
    def edit_item_form(id):
        """Handle item edit form submissions using POST method."""
        item = Item.query.get(id)
        if not item:
            abort(404)
            
        try:
            # Validate required fields
            if not request.form.get('name'):
                # Handle error and return to form with error message
                categories = [c.to_dict() for c in Category.query.order_by(Category.name).all()]
                return render_template('index.html', 
                                      error_message="Name is required", 
                                      categories=categories,
                                      items=prepare_items_for_template())
            if not request.form.get('category_id'):
                categories = [c.to_dict() for c in Category.query.order_by(Category.name).all()]
                return render_template('index.html', 
                                      error_message="Category is required", 
                                      categories=categories,
                                      items=prepare_items_for_template())
            if not request.form.get('brand'):
                categories = [c.to_dict() for c in Category.query.order_by(Category.name).all()]
                return render_template('index.html', 
                                      error_message="Brand is required", 
                                      categories=categories,
                                      items=prepare_items_for_template())
                
            # Update basic item information
            item.category_id = request.form.get('category_id')
            item.name = request.form.get('name')
            item.brand = request.form.get('brand')
            item.serial_number = request.form.get('serial_number')
            item.form_factor = request.form.get('form_factor')
            item.description = request.form.get('description')
            
            # Handle specification values properly
            spec_values_json = request.form.get('specification_values', '{}')
            try:
                specs_dict = json.loads(spec_values_json)
                item.set_specification_values(specs_dict)
            except json.JSONDecodeError:
                item.set_specification_values({})
            
            # Update URLs: remove all existing and add new ones
            ItemUrl.query.filter_by(item_id=id).delete()
            for url in request.form.getlist('urls[]'):
                if url:
                    item.urls.append(ItemUrl(url=url))
            
            # Add new photos if any
            for file in request.files.getlist('photos[]'):
                if file and file.filename and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']:
                    filename = f"item_{id}_{file.filename}"
                    file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
                    item.photos.append(ItemPhoto(file_path=filename))
            
            db.session.commit()
            
            # Redirect back to main page with success message
            return redirect('/?success=Item+updated+successfully')
        except Exception as e:
            db.session.rollback()
            categories = [c.to_dict() for c in Category.query.order_by(Category.name).all()]
            return render_template('index.html', 
                                  error_message=f"Error updating item: {str(e)}", 
                                  categories=categories,
                                  items=prepare_items_for_template())
