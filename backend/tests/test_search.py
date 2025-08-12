"""
test_search.py - Tests for the search functionality in the items API endpoint
"""
import json
import pytest

def test_search_items_by_name(client, app):
    """Test searching items by name"""
    with app.app_context():
        # Create multiple items with different names for testing search
        from models import db, Item
        
        # Create some test items with different names
        test_items = [
            Item(name="Resistor 10K", category_id=1),
            Item(name="Capacitor 100uF", category_id=1),
            Item(name="Blue LED", category_id=1),
            Item(name="Transistor BC547", category_id=1),
            Item(name="Arduino Resistor Shield", category_id=1)
        ]
        
        for item in test_items:
            db.session.add(item)
        
        db.session.commit()
        
        # Test exact match search
        response = client.get('/api/items?search=Blue LED')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]['name'] == "Blue LED"
        
        # Test partial match search
        response = client.get('/api/items?search=Resistor')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 2
        names = [item['name'] for item in data]
        assert "Resistor 10K" in names
        assert "Arduino Resistor Shield" in names
        
        # Test case-insensitive search
        response = client.get('/api/items?search=resistor')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 2
        
        # Test search with no results
        response = client.get('/api/items?search=XYZ123')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 0

def test_combined_search_and_category_filter(client, app):
    """Test combining search by name with category filtering"""
    with app.app_context():
        # Create multiple items across different categories
        from models import db, Item, Category
        
        # Create test categories
        categories = [
            Category(name="Electronic Components"),
            Category(name="Tools")
        ]
        
        for category in categories:
            db.session.add(category)
        
        db.session.flush()
        
        # Get category IDs
        electronic_cat_id = categories[0].id
        tools_cat_id = categories[1].id
        
        # Create test items in different categories
        test_items = [
            Item(name="Soldering Iron", category_id=tools_cat_id),
            Item(name="Screwdriver Set", category_id=tools_cat_id),
            Item(name="Digital Multimeter", category_id=tools_cat_id),
            Item(name="Resistor Pack", category_id=electronic_cat_id),
            Item(name="Capacitor Assortment", category_id=electronic_cat_id),
            Item(name="Digital Logic Analyzer", category_id=electronic_cat_id)
        ]
        
        for item in test_items:
            db.session.add(item)
        
        db.session.commit()
        
        # Test search within a category
        response = client.get(f'/api/items?search=Digital&category_id={electronic_cat_id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 1
        assert data[0]['name'] == "Digital Logic Analyzer"
        assert data[0]['category_id'] == electronic_cat_id
        
        # Test search across all categories
        response = client.get('/api/items?search=Digital')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 2
        names = [item['name'] for item in data]
        assert "Digital Multimeter" in names
        assert "Digital Logic Analyzer" in names
        
        # Test category filter only
        response = client.get(f'/api/items?category_id={tools_cat_id}')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) == 3
        for item in data:
            assert item['category_id'] == tools_cat_id

def test_search_with_special_characters(client, app):
    """Test searching with special characters and edge cases"""
    with app.app_context():
        from models import db, Item
        
        # Create items with special characters
        test_items = [
            Item(name="Item with % symbol", category_id=1),
            Item(name="Item with _ underscore", category_id=1),
            Item(name="Item with (parentheses)", category_id=1),
            Item(name="Item with 'quotes'", category_id=1)
        ]
        
        for item in test_items:
            db.session.add(item)
        
        db.session.commit()
        
        # Test search with special characters
        response = client.get('/api/items?search=%')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) >= 1
        assert any("% symbol" in item['name'] for item in data)
        
        # Test search with parentheses
        response = client.get('/api/items?search=(parentheses)')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) >= 1
        assert any("(parentheses)" in item['name'] for item in data)
        
        # Test search with quotes
        response = client.get('/api/items?search=quotes')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data) >= 1
        assert any("'quotes'" in item['name'] for item in data)

def test_search_pagination_order(client, app):
    """Test that search results are properly ordered"""
    with app.app_context():
        from models import db, Item
        
        # Create items with names in non-alphabetical order
        test_items = [
            Item(name="Zebra", category_id=1),
            Item(name="Apple", category_id=1),
            Item(name="Banana", category_id=1),
            Item(name="Xylophone", category_id=1)
        ]
        
        for item in test_items:
            db.session.add(item)
        
        db.session.commit()
        
        # Test all items are returned in correct order
        response = client.get('/api/items')
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Find our test items in the results
        test_item_results = [item for item in data if item['name'] in 
                            ["Zebra", "Apple", "Banana", "Xylophone"]]
        
        # Verify items are returned in alphabetical order
        names = [item['name'] for item in test_item_results]
        sorted_names = sorted(names)
        assert names == sorted_names
