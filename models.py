from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

# Initialize SQLAlchemy without a specific Flask app
# (We will initialize it later with the app)
db = SQLAlchemy()

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False, unique=True)
    specifications_schema = db.Column(db.Text)  # JSON schema for specifications
    
    # Relationship with Items (one-to-many)
    items = db.relationship('Item', back_populates='category', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'specifications_schema': json.loads(self.specifications_schema) if self.specifications_schema else {}
        }
    
    def set_specifications_schema(self, schema_dict):
        self.specifications_schema = json.dumps(schema_dict)
    
    def get_specifications_schema(self):
        return json.loads(self.specifications_schema) if self.specifications_schema else {}


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
        return {
            'id': self.id,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'name': self.name,
            'brand': self.brand,
            'serial_number': self.serial_number,
            'form_factor': self.form_factor,
            'description': self.description,
            'specification_values': json.loads(self.specification_values) if self.specification_values else {},
            'photos': [photo.file_path for photo in self.photos],
            'urls': [url.url for url in self.urls],
            'primary_photo': self.photos[0].file_path if self.photos else None
        }
    
    def set_specification_values(self, specs_dict):
        self.specification_values = json.dumps(specs_dict)
    
    def get_specification_values(self):
        return json.loads(self.specification_values) if self.specification_values else {}


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
