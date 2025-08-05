from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
from werkzeug.security import generate_password_hash, check_password_hash

# Initialize SQLAlchemy without a specific Flask app
# (We will initialize it later with the app)
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        """Set the password hash using SHA-256 algorithm (compatible with Python 3.13)."""
        # Explicitly use sha256 instead of the default (scrypt) which is causing compatibility issues
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')
        
    def check_password(self, password):
        """Check if the provided password matches the stored hash."""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class CategorySpecification(db.Model):
    __tablename__ = 'category_specifications'

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    key = db.Column(db.String, nullable=False)
    label = db.Column(db.String)
    type = db.Column(db.String, default='text')
    placeholder = db.Column(db.String)
    display_order = db.Column(db.Integer, default=0)
    options = db.Column(db.Text)  # JSON array for select options
    min_value = db.Column(db.Float)  # For number type
    max_value = db.Column(db.Float)  # For number type
    step_value = db.Column(db.Float, default=1)  # For number type
    
    # Relationship
    category = db.relationship('Category', back_populates='specifications', lazy='joined')
    
    def to_dict(self):
        result = {
            'id': self.id,
            'key': self.key,
            'label': self.label or self.key,
            'type': self.type or 'text',
            'placeholder': self.placeholder or '',
            'display_order': self.display_order
        }
        
        # Add type-specific properties
        if self.type == 'number':
            result['min'] = self.min_value
            result['max'] = self.max_value
            result['step'] = self.step_value
        
        # Add options for select type
        if self.type == 'select' and self.options:
            result['options'] = json.loads(self.options)
        
        return result
    
    def set_options(self, options_list):
        """Set options for select type specifications"""
        if options_list:
            self.options = json.dumps(options_list)
        else:
            self.options = None
    
    def get_options(self):
        """Get options for select type specifications"""
        return json.loads(self.options) if self.options else []

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)
    specifications_schema = db.Column(db.Text)  # Legacy JSON schema for specifications - keeping for migration
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    items = db.relationship('Item', back_populates='category', lazy='joined')
    specifications = db.relationship('CategorySpecification', 
                                    back_populates='category', 
                                    lazy='joined',  # Change to eager loading for tests 
                                    order_by='CategorySpecification.display_order',
                                    cascade='all, delete-orphan')

    def to_dict(self):
        # Convert specifications to a dictionary for backward compatibility
        specs_dict = {}
        for spec in self.specifications:
            specs_dict[spec.key] = spec.to_dict()
            
        return {
            'id': self.id,
            'name': self.name,
            'specifications_schema': specs_dict,
            'specifications': [spec.to_dict() for spec in self.specifications],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def set_specifications_schema(self, schema_data):
        """
        Set specifications schema - supports both legacy dict format and new list format
        """
        # Legacy support: store original format in the legacy field
        self.specifications_schema = json.dumps(schema_data)
        
        # Clear existing specifications
        for spec in self.specifications:
            db.session.delete(spec)
        
        # Process the schema data based on its format
        if isinstance(schema_data, dict):
            # Legacy dict format
            for order, (key, spec_data) in enumerate(schema_data.items()):
                new_spec = CategorySpecification(
                    category=self,
                    key=key,
                    label=spec_data.get('label', key),
                    type=spec_data.get('type', 'text'),
                    placeholder=spec_data.get('placeholder', ''),
                    display_order=order
                )
                
                # Handle type-specific properties
                if spec_data.get('type') == 'number':
                    new_spec.min_value = spec_data.get('min')
                    new_spec.max_value = spec_data.get('max')
                    new_spec.step_value = spec_data.get('step', 1)
                
                # Handle options for select type
                if spec_data.get('type') == 'select' and 'options' in spec_data:
                    new_spec.set_options(spec_data['options'])
                
                db.session.add(new_spec)
        
        elif isinstance(schema_data, list):
            # New list format
            for i, spec_data in enumerate(schema_data):
                new_spec = CategorySpecification(
                    category=self,
                    key=spec_data.get('key'),
                    label=spec_data.get('label', spec_data.get('key')),
                    type=spec_data.get('type', 'text'),
                    placeholder=spec_data.get('placeholder', ''),
                    display_order=spec_data.get('display_order', i)
                )
                
                # Handle type-specific properties
                if spec_data.get('type') == 'number':
                    new_spec.min_value = spec_data.get('min')
                    new_spec.max_value = spec_data.get('max')
                    new_spec.step_value = spec_data.get('step', 1)
                
                # Handle options for select type
                if spec_data.get('type') == 'select' and 'options' in spec_data:
                    new_spec.set_options(spec_data['options'])
                
                db.session.add(new_spec)
    
    def get_specifications_schema(self):
        """
        Get specifications schema as a list for the API
        """
        # Convert specifications to a list format for API use
        result = [spec.to_dict() for spec in self.specifications]
        return result


class Item(db.Model):
    __tablename__ = 'items'

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    name = db.Column(db.String, nullable=False)
    specification_values = db.Column(db.Text)  # Stored as JSON string - values according to category schema
    
    # Relationships
    category = db.relationship('Category', back_populates='items', lazy='joined')
    photos = db.relationship('ItemPhoto', back_populates='item', lazy='joined', cascade='all, delete-orphan')
    urls = db.relationship('ItemUrl', back_populates='item', lazy='joined', cascade='all, delete-orphan')

    def to_dict(self):
        # Get specification values
        spec_values = json.loads(self.specification_values) if self.specification_values else {}

        # Get category specifications ordered by display_order
        ordered_specs = []
        if self.category:
            category_specs = self.category.specifications
            for spec in category_specs:
                if spec.key in spec_values:
                    ordered_specs.append({
                        'key': spec.key,
                        'label': spec.label or spec.key,
                        'value': spec_values.get(spec.key, ''),
                        'display_order': spec.display_order
                    })

        # Format photos for API compatibility with tests
        photo_list = []
        for photo in self.photos:
            photo_list.append({
                'id': photo.id,
                'filename': photo.file_path
            })

        # Format URLs for API compatibility with tests
        url_list = []
        for url in self.urls:
            url_list.append({
                'id': url.id,
                'url': url.url
            })

        # Extract legacy fields from specs if present
        brand = spec_values.get('brand', '')
        serial_number = spec_values.get('serial_number', '')
        description = spec_values.get('description', '')

        return {
            'id': self.id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'name': self.name,
            'brand': brand,
            'serial_number': serial_number,
            'description': description,
            'specification_values': spec_values,
            'ordered_specifications': ordered_specs,
            'photos': photo_list,
            'urls': url_list,
            'primary_photo': self.photos[0].file_path if self.photos else None
        }
    
    def set_specification_values(self, specs_dict):
        self.specification_values = json.dumps(specs_dict)
    
    def get_specification_values(self):
        return json.loads(self.specification_values) if self.specification_values else {}
    
    @property
    def primary_photo(self):
        """Return the file path of the primary photo, or None if no photos exist."""
        return self.photos[0].file_path if self.photos else None


class ItemPhoto(db.Model):
    __tablename__ = 'item_photos'

    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('items.id'), nullable=False)
    file_path = db.Column(db.String, nullable=False)
    filename = db.Column(db.String)  # Optional column to store original filename
    is_primary = db.Column(db.Boolean, default=False)  # Flag for primary photo
    
    # Relationship
    item = db.relationship('Item', back_populates='photos', lazy='joined')


class ItemUrl(db.Model):
    __tablename__ = 'item_urls'

    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('items.id'), nullable=False)
    url = db.Column(db.String, nullable=False)
    
    # Relationship
    item = db.relationship('Item', back_populates='urls', lazy='joined')
