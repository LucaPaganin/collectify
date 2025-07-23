from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

# Initialize SQLAlchemy without a specific Flask app
# (We will initialize it later with the app)
db = SQLAlchemy()

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
    category = db.relationship('Category', back_populates='specifications')
    
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
    
    # Relationships
    items = db.relationship('Item', back_populates='category', lazy=True)
    specifications = db.relationship('CategorySpecification', 
                                    back_populates='category', 
                                    lazy=True, 
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
            'specifications': [spec.to_dict() for spec in self.specifications]
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
        Get specifications schema as a dictionary for backward compatibility
        """
        # Convert specifications to a dictionary
        result = {}
        for spec in self.specifications:
            result[spec.key] = spec.to_dict()
        return result


class Item(db.Model):
    __tablename__ = 'items'

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    name = db.Column(db.String, nullable=False)
    brand = db.Column(db.String, nullable=False)
    serial_number = db.Column(db.String)
    form_factor = db.Column(db.String)
    description = db.Column(db.Text)
    specification_values = db.Column(db.Text)  # Stored as JSON string - values according to category schema
    
    # Relationships
    category = db.relationship('Category', back_populates='items', lazy=True)
    photos = db.relationship('ItemPhoto', back_populates='item', lazy=True, cascade='all, delete-orphan')
    urls = db.relationship('ItemUrl', back_populates='item', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        # Get specification values
        spec_values = json.loads(self.specification_values) if self.specification_values else {}
        
        # Get category specifications ordered by display_order
        ordered_specs = []
        if self.category:
            # Get all specifications from the category in proper order
            category_specs = self.category.specifications
            
            # Create ordered specifications with values
            for spec in category_specs:
                if spec.key in spec_values:
                    ordered_specs.append({
                        'key': spec.key,
                        'label': spec.label or spec.key,
                        'value': spec_values.get(spec.key, ''),
                        'display_order': spec.display_order
                    })
        
        return {
            'id': self.id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'name': self.name,
            'brand': self.brand,
            'serial_number': self.serial_number,
            'form_factor': self.form_factor,
            'description': self.description,
            'specification_values': spec_values,  # Keep the original dict for backward compatibility
            'ordered_specifications': ordered_specs,  # Add the ordered specifications
            'photos': [photo.file_path for photo in self.photos],
            'urls': [url.url for url in self.urls],
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
    
    # Relationship
    item = db.relationship('Item', back_populates='photos')


class ItemUrl(db.Model):
    __tablename__ = 'item_urls'

    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('items.id'), nullable=False)
    url = db.Column(db.String, nullable=False)
    
    # Relationship
    item = db.relationship('Item', back_populates='urls')
