"""
test_frontend.py - Tests for the frontend routes
"""
import pytest
from bs4 import BeautifulSoup

def test_index_route(client, sample_item):
    """Test the main index route"""
    response = client.get('/')
    
    # Check response status
    assert response.status_code == 200
    
    # Parse the HTML content
    soup = BeautifulSoup(response.data, 'html.parser')
    
    # Check if the page contains expected elements
    assert soup.title.text == 'My Collection | Collectify'
    
    # Check if the item is displayed on the page
    item_names = [h5.text for h5 in soup.select('.card-title')]
    assert sample_item.name in item_names
    
    # Check for navigation and search elements
    assert soup.find(id='searchBox') is not None
    assert soup.find(id='categorySelect') is not None

def test_index_route_with_category_filter(client, sample_item):
    """Test the index route with category filter"""
    category_id = sample_item.category_id
    
    response = client.get(f'/?category_id={category_id}')
    assert response.status_code == 200
    
    # Parse the HTML content
    soup = BeautifulSoup(response.data, 'html.parser')
    
    # Check if the item is displayed on the page
    item_names = [h5.text for h5 in soup.select('.card-title')]
    assert sample_item.name in item_names
    
    # Check if the category filter is selected
    category_select = soup.find(id='categorySelect')
    selected_option = category_select.find('option', selected=True)
    assert selected_option['value'] == str(category_id)

def test_index_route_with_search_filter(client, sample_item):
    """Test the index route with search filter"""
    search_term = sample_item.name
    
    response = client.get(f'/?search={search_term}')
    assert response.status_code == 200
    
    # Parse the HTML content
    soup = BeautifulSoup(response.data, 'html.parser')
    
    # Check if the item is displayed on the page
    item_names = [h5.text for h5 in soup.select('.card-title')]
    assert sample_item.name in item_names
    
    # Check if the search box contains the search term
    search_box = soup.find(id='searchBox')
    assert search_box['value'] == search_term

def test_view_item_route(client, sample_item):
    """Test the view_item route"""
    item_id = sample_item.id
    
    response = client.get(f'/item/{item_id}')
    assert response.status_code == 200
    
    # Parse the HTML content
    soup = BeautifulSoup(response.data, 'html.parser')
    
    # Check if the page contains the item details
    assert sample_item.name in soup.text
    assert sample_item.brand in soup.text
    
    # Check for expected page structure
    assert soup.find('img') is not None  # Should have an image
    assert soup.find('h1') is not None   # Should have a heading

def test_view_nonexistent_item(client):
    """Test viewing an item that doesn't exist"""
    response = client.get('/item/9999')
    assert response.status_code == 404

def test_admin_route_unauthenticated(client):
    """Test accessing admin route without authentication"""
    response = client.get('/admin.html')
    assert response.status_code == 401

def test_admin_route_authenticated(auth_client):
    """Test accessing admin route with authentication"""
    response = auth_client.get('/admin.html')
    assert response.status_code == 200
    
    # Parse the HTML content
    soup = BeautifulSoup(response.data, 'html.parser')
    
    # Check if the page contains expected admin elements
    assert 'Admin' in soup.title.text
    assert soup.find(id='categoryModal') is not None
    assert soup.find(id='specsModal') is not None  # Changed from specificationModal to specsModal

def test_static_files(client):
    """Test that static files are served correctly"""
    # Test CSS file
    response = client.get('/static/style.css')
    assert response.status_code == 200
    assert response.content_type == 'text/css; charset=utf-8'
    
    # Test JavaScript file
    response = client.get('/static/app-bootstrap.js')
    assert response.status_code == 200
    assert 'javascript' in response.content_type.lower()  # Accept either 'application/javascript' or 'text/javascript'

def test_uploaded_files(client, sample_item, app, sample_photo_file):
    """Test that uploaded files are served correctly"""
    # Create a test file in the uploads directory
    import os
    from models import db, ItemPhoto
    
    test_file_name = "test_upload.jpg"
    
    with app.app_context():
        # Add a photo to the sample item - using file_path which is the required field
        photo = ItemPhoto(
            item_id=sample_item.id,
            file_path=test_file_name,
            filename=test_file_name,  # Optional original filename
            is_primary=True
        )
        db.session.add(photo)
        db.session.commit()
        
        # Create the actual file
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], test_file_name)
        with open(upload_path, 'wb') as f:
            f.write(b'test file content')
    
    # Test accessing the file
    response = client.get('/uploads/' + test_file_name)
    assert response.status_code == 200
    assert response.data == b'test file content'
