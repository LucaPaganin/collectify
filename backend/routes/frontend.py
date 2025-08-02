"""Frontend routes for the Collectify application."""
import json
import os
import traceback
from flask import render_template, abort, redirect, send_from_directory, request, current_app
from models import db, Item, Category, ItemUrl, ItemPhoto
from utils.auth import requires_auth, token_required
from utils.helpers import prepare_items_for_template
from utils.decorators import log_exceptions

def register_frontend_routes(app):
    """Register frontend routes with the Flask application."""
    
    @app.route('/')
    @log_exceptions
    def index():
        """Serves the main public page with items and categories for server-side rendering."""
        # Fetch categories
        categories = [c.to_dict() for c in Category.query.order_by(Category.name).all()]
        # Get category filter from request args
        category_id = request.args.get('category_id')
        # Get search term from request args
        search_term = request.args.get('search')
        # Get items from helper function with optional category filter and search term
        items = prepare_items_for_template(category_id=category_id, search=search_term)
        return render_template('index.html', page_title="My Collection", categories=categories, items=items)
        
    @app.route('/edit/<int:id>')
    @log_exceptions
    def edit_item(id):
        """Edit item page that redirects back to the main page with the edit modal opened."""
        # We'll redirect to the main page and use JavaScript to open the edit modal for this item
        return redirect(f'/?edit={id}')

    @app.route('/item/<int:id>')
    @log_exceptions
    def view_item(id):
        """View item details page."""
        item = Item.query.get(id)
        if not item:
            current_app.logger.warning(f"Item not found: ID {id}")
            abort(404)
            
        item_dict = item.to_dict()
        
        # Ensure we have a primary_photo_url for display
        if item.primary_photo:
            item_dict['primary_photo_url'] = f"/uploads/{item.primary_photo}"
        else:
            item_dict['primary_photo_url'] = "https://placehold.co/600x400/eee/ccc?text=No+Image"
            
        # Format URLs correctly for the template
        if item_dict.get('urls'):
            formatted_urls = []
            for url_item in item_dict['urls']:
                if isinstance(url_item, dict) and 'url' in url_item:
                    formatted_urls.append(url_item['url'])
                else:
                    formatted_urls.append(url_item)
            item_dict['urls'] = formatted_urls
            
        current_app.logger.debug(f"Viewing item: ID {id}, Name: {item.name}")
        return render_template('view_item.html', item=item_dict)

    @app.route('/admin.html')
    @token_required
    @log_exceptions
    def admin(current_user):
        """Serves the protected admin page for category management using Jinja2 template inheritance."""
        return render_template('admin.html', page_title="Admin Panel")

    @app.route('/uploads/<filename>')
    @log_exceptions
    def uploaded_file(filename):
        """Serves uploaded image files."""
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        
    @app.route('/item/<int:id>/edit', methods=['POST'])
    @log_exceptions
    def edit_item_form(id):
        """Handle item edit form submissions using POST method."""
        item = Item.query.get(id)
        if not item:
            current_app.logger.warning(f"Edit item failed: Item ID {id} not found")
            abort(404)
            
        # Validate required fields
        if not request.form.get('name'):
            current_app.logger.warning(f"Edit item {id} failed: Missing name field")
            # Handle error and return to form with error message
            categories = [c.to_dict() for c in Category.query.order_by(Category.name).all()]
            return render_template('index.html', 
                                  error_message="Name is required", 
                                  categories=categories,
                                  items=prepare_items_for_template(search=request.args.get('search')))
        if not request.form.get('category_id'):
            current_app.logger.warning(f"Edit item {id} failed: Missing category_id field")
            categories = [c.to_dict() for c in Category.query.order_by(Category.name).all()]
            return render_template('index.html', 
                                  error_message="Category is required", 
                                  categories=categories,
                                  items=prepare_items_for_template(search=request.args.get('search')))
            
        # Update basic item information
        item.category_id = request.form.get('category_id')
        item.name = request.form.get('name')
        item.brand = request.form.get('brand', '')
        item.serial_number = request.form.get('serial_number', '')
        item.form_factor = request.form.get('form_factor', '')
        item.description = request.form.get('description', '')
        
        # Handle specification values properly
        spec_values_json = request.form.get('specification_values', '{}')
        try:
            specs_dict = json.loads(spec_values_json)
            item.set_specification_values(specs_dict)
        except json.JSONDecodeError as e:
            current_app.logger.error(f"Invalid JSON for specification values: {str(e)}")
            item.set_specification_values({})
        
        # Update URLs: remove all existing and add new ones
        ItemUrl.query.filter_by(item_id=id).delete()
        for url in request.form.getlist('urls[]'):
            if url:
                item.urls.append(ItemUrl(url=url))
        
        # Add new photos if any
        photo_count = 0
        for file in request.files.getlist('photos[]'):
            if file and file.filename and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']:
                filename = f"item_{id}_{file.filename}"
                file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], filename))
                item.photos.append(ItemPhoto(file_path=filename))
                photo_count += 1
        
        db.session.commit()
        
        current_app.logger.info(f"Item {id} '{item.name}' updated successfully with {photo_count} new photos")
        # Redirect back to main page with success message
        return redirect('/?success=Item+updated+successfully')
