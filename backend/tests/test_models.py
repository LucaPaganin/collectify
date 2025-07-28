"""
test_models.py - Tests for the Collectify models
"""
import json
import pytest
from models import Category, Item, ItemPhoto, ItemUrl, CategorySpecification

def test_category_creation(app):
    """Test creating a Category"""
    with app.app_context():
        # Create a new category
        category = Category(name="Test Category")
        assert category.name == "Test Category"
        assert category.id is None  # Not yet saved to DB
        
        # Save to DB
        from models import db
        db.session.add(category)
        db.session.commit()
        
        # Verify ID is assigned
        assert category.id is not None
        
        # Verify can be retrieved
        retrieved = Category.query.get(category.id)
        assert retrieved.name == "Test Category"

def test_category_to_dict(sample_category):
    """Test Category.to_dict() method"""
    category_dict = sample_category.to_dict()
    assert category_dict["id"] == sample_category.id
    assert category_dict["name"] == sample_category.name
    assert "created_at" in category_dict
    assert "specifications_schema" in category_dict

def test_category_specifications(app):
    """Test Category specifications schema handling"""
    with app.app_context():
        category = Category(name="Electronics")
        
        # Define a specifications schema
        specs = [
            {
                "key": "voltage",
                "label": "Voltage",
                "type": "number",
                "display_order": 0
            },
            {
                "key": "manufacturer",
                "label": "Manufacturer",
                "type": "text",
                "display_order": 1
            }
        ]
        
        # Set specifications schema
        category.set_specifications_schema(specs)
        
        # Save to DB
        from models import db
        db.session.add(category)
        db.session.commit()
        
        # Retrieve and verify
        retrieved = Category.query.get(category.id)
        retrieved_specs = retrieved.get_specifications_schema()
        
        assert len(retrieved_specs) == 2
        assert retrieved_specs[0]["key"] == "voltage"
        assert retrieved_specs[1]["key"] == "manufacturer"

def test_item_creation(app, sample_category):
    """Test creating an Item"""
    with app.app_context():
        item = Item(
            category_id=sample_category.id,
            name="Test Item",
            brand="Test Brand",
            description="Test Description"
        )
        
        from models import db
        db.session.add(item)
        db.session.commit()
        
        assert item.id is not None
        assert item.category_id == sample_category.id
        assert item.name == "Test Item"

def test_item_with_specifications(app, sample_category_with_specs):
    """Test Item with specifications"""
    with app.app_context():
        # Create item
        item = Item(
            category_id=sample_category_with_specs.id,
            name="Test Item With Specs",
            brand="Test Brand"
        )
        
        # Set specification values
        spec_values = {
            "weight": "10.5",
            "color": "Blue",
            "material": "metal"
        }
        item.set_specification_values(spec_values)
        
        # Save to DB
        from models import db
        db.session.add(item)
        db.session.commit()
        
        # Retrieve and verify
        retrieved = Item.query.get(item.id)
        retrieved_values = retrieved.get_specification_values()
        
        assert retrieved_values["weight"] == "10.5"
        assert retrieved_values["color"] == "Blue"
        assert retrieved_values["material"] == "metal"

def test_item_urls(app, sample_category):
    """Test Item URLs relationship"""
    with app.app_context():
        # Create item
        item = Item(
            category_id=sample_category.id,
            name="Item with URLs",
            brand="URL Brand"
        )
        
        # Add URLs
        item.urls.append(ItemUrl(url="https://example.com/item1"))
        item.urls.append(ItemUrl(url="https://example.com/item2"))
        
        # Save to DB
        from models import db
        db.session.add(item)
        db.session.commit()
        
        # Retrieve and verify
        retrieved = Item.query.get(item.id)
        assert len(retrieved.urls) == 2
        assert retrieved.urls[0].url == "https://example.com/item1"
        assert retrieved.urls[1].url == "https://example.com/item2"

def test_item_photos(app, sample_category, sample_photo_file):
    """Test Item Photos relationship"""
    with app.app_context():
        # Create item
        item = Item(
            category_id=sample_category.id,
            name="Item with Photos",
            brand="Photo Brand"
        )
        
        # Save to get an ID
        from models import db
        db.session.add(item)
        db.session.commit()
        
        # Create a photo
        photo = ItemPhoto(
            item_id=item.id,
            file_path="test_photo.jpg",  # Required field
            filename="test_photo.jpg",   # Optional field
            is_primary=True
        )
        
        db.session.add(photo)
        db.session.commit()
        
        # Retrieve and verify
        retrieved = Item.query.get(item.id)
        assert len(retrieved.photos) == 1
        assert retrieved.photos[0].filename == "test_photo.jpg"
        assert retrieved.photos[0].is_primary is True
        
        # Test primary photo relationship
        assert retrieved.primary_photo == "test_photo.jpg"

def test_item_to_dict(sample_item):
    """Test Item.to_dict() method"""
    item_dict = sample_item.to_dict()
    
    # Check basic fields
    assert item_dict["id"] == sample_item.id
    assert item_dict["name"] == "Test Item"
    assert item_dict["brand"] == "Test Brand"
    assert item_dict["serial_number"] == "ABC123"
    
    # Check related data
    assert "category_name" in item_dict
    assert "urls" in item_dict
    assert len(item_dict["urls"]) == 1
    assert item_dict["urls"][0]["url"] == "https://example.com/test"
    
    # Check specification values
    assert "specification_values" in item_dict
    assert item_dict["specification_values"]["weight"] == "5"
    assert item_dict["specification_values"]["color"] == "Red"

def test_specification_ordering(app):
    """Test that specifications maintain their display order"""
    with app.app_context():
        category = Category(name="Ordered Specs")
        
        # Define specifications in non-sequential order
        specs = [
            {"key": "third", "label": "Third", "display_order": 2},
            {"key": "first", "label": "First", "display_order": 0},
            {"key": "second", "label": "Second", "display_order": 1}
        ]
        
        category.set_specifications_schema(specs)
        
        from models import db
        db.session.add(category)
        db.session.commit()
        
        # Retrieve and check order
        retrieved = Category.query.get(category.id)
        ordered_specs = retrieved.get_specifications_schema()
        
        assert ordered_specs[0]["key"] == "first"
        assert ordered_specs[1]["key"] == "second" 
        assert ordered_specs[2]["key"] == "third"
