import os
import json
import logging
from models import db, Item, ItemUrl, ItemPhoto, Category
from utils.file_helpers import sanitize_filename
from flask import current_app

logger = logging.getLogger(__name__)

class ItemService:
    @staticmethod
    def get_items(category_id=None, search_term=None):
        """Fetch items with optional filtering."""
        query = Item.query.join(Item.category, isouter=True)
        
        if category_id:
            query = query.filter(Item.category_id == category_id)
            logger.info(f"Filtering by category_id: {category_id}")
            
        if search_term:
            logger.info(f"Searching for term: {search_term}")
            search_pattern = f"%{search_term}%"
            query = query.filter(Item.name.ilike(search_pattern))
            
        query = query.order_by(Item.name)
        return query.all()

    @staticmethod
    def get_item_by_id(item_id):
        """Fetch a single item by ID."""
        return Item.query.get(item_id)

    @staticmethod
    def create_item(data, files=None):
        """Create a new item."""
        # Validate required fields
        if not data.get('name'):
            raise ValueError('Name is required')
        if not data.get('category_id'):
            raise ValueError('Category is required')
        
        # Verify category exists
        category_id = data.get('category_id')
        category = Category.query.get(category_id)
        if not category:
            raise ValueError('Selected category does not exist')
            
        # Create new item
        new_item = Item(
            category_id=category_id,
            name=data.get('name')
        )
        
        # Set optional fields
        if data.get('brand'):
            new_item.brand = data.get('brand')
        if data.get('serial_number'):
            new_item.serial_number = data.get('serial_number')
        if data.get('form_factor'):
            new_item.form_factor = data.get('form_factor')
        if data.get('description'):
            new_item.description = data.get('description')
        
        # Handle specification values
        spec_values_json = data.get('specification_values', '{}')
        if isinstance(spec_values_json, str):
            new_item.set_specification_values(json.loads(spec_values_json))
        else:
            new_item.set_specification_values(spec_values_json)
        
        # Add URLs
        ItemService._process_urls(new_item, data.get('urls'))
        
        # Add item to session to get ID
        db.session.add(new_item)
        db.session.flush()
        
        # Process photos
        if files:
            ItemService._process_photos(new_item, files.getlist('photos[]'))
        
        db.session.commit()
        db.session.refresh(new_item)
        return new_item

    @staticmethod
    def update_item(item_id, data, files=None):
        """Update an existing item."""
        item = ItemService.get_item_by_id(item_id)
        if not item:
            raise ValueError('Item not found')
        
        # Update fields if provided
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
        
        # Handle specification values
        if data.get('specification_values') is not None:
            spec_values_json = data.get('specification_values')
            if isinstance(spec_values_json, str):
                item.set_specification_values(json.loads(spec_values_json))
            else:
                item.set_specification_values(spec_values_json)
        
        # Update URLs if provided
        if data.get('urls') is not None:
            ItemUrl.query.filter_by(item_id=item_id).delete()
            ItemService._process_urls(item, data.get('urls'))
        
        # Process photos
        if files and files.getlist('photos[]'):
            ItemService._process_photos(item, files.getlist('photos[]'))
        
        db.session.commit()
        db.session.refresh(item)
        return item

    @staticmethod
    def delete_item(item_id):
        """Delete an item and its photos."""
        item = ItemService.get_item_by_id(item_id)
        if not item:
            raise ValueError('Item not found')
        
        # Delete physical photo files
        for photo in item.photos:
            try:
                os.remove(os.path.join(current_app.config['UPLOAD_FOLDER'], photo.file_path))
            except OSError as e:
                logger.warning(f"Error deleting file {photo.file_path}: {e}")
        
        db.session.delete(item)
        db.session.commit()
        return True

    @staticmethod
    def add_item_url(item_id, url_string):
        """Add a URL to an item."""
        item = ItemService.get_item_by_id(item_id)
        if not item:
            raise ValueError('Item not found')
            
        if not url_string:
            raise ValueError('URL is required')
            
        url = ItemUrl(item_id=item_id, url=url_string)
        db.session.add(url)
        db.session.commit()
        return url

    @staticmethod
    def delete_item_url(item_id, url_id):
        """Delete a URL from an item."""
        item = ItemService.get_item_by_id(item_id)
        if not item:
            raise ValueError('Item not found')
            
        url = ItemUrl.query.get(url_id)
        if not url or url.item_id != item_id:
            raise ValueError('URL not found for this item')
            
        db.session.delete(url)
        db.session.commit()
        return True

    @staticmethod
    def add_item_photo(item_id, file):
        """Add a photo to an item."""
        item = ItemService.get_item_by_id(item_id)
        if not item:
            raise ValueError('Item not found')
            
        if not file:
            raise ValueError('No photo provided')
            
        if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']:
            # Sanitize filename for URL safety
            safe_filename = sanitize_filename(file.filename)
            # Prefix with item ID for organization
            filename = f"item_{item_id}_{safe_filename}"
            
            # Save the file
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Create database record
            photo = ItemPhoto(item_id=item_id, file_path=filename)
            db.session.add(photo)
            db.session.commit()
            
            logger.info(f"Photo uploaded: {filename}")
            return photo
        else:
            raise ValueError('Invalid file format')

    @staticmethod
    def _process_urls(item, urls_data):
        """Helper to process URLs from various input formats."""
        if not urls_data:
            return

        # Handle JSON string
        if isinstance(urls_data, str):
            try:
                urls_data = json.loads(urls_data)
            except json.JSONDecodeError:
                # If not JSON, treat as single URL if it looks like one, or ignore
                pass

        # Handle list
        if isinstance(urls_data, list):
            for url_obj in urls_data:
                if isinstance(url_obj, dict) and url_obj.get('url'):
                    item.urls.append(ItemUrl(url=url_obj.get('url')))
                elif isinstance(url_obj, str):
                    item.urls.append(ItemUrl(url=url_obj))

    @staticmethod
    def _process_photos(item, photo_files):
        """Helper to process and save photo files."""
        for file in photo_files:
            if file and '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']:
                # Sanitize filename for URL safety
                safe_filename = sanitize_filename(file.filename)
                # Prefix with item ID for organization
                filename = f"item_{item.id}_{safe_filename}"
                
                # Save the file
                file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                
                item.photos.append(ItemPhoto(file_path=filename))
                logger.info(f"Photo uploaded: {filename}")
