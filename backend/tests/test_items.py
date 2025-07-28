"""
test_items.py - Tests for the item API endpoints
"""
import os
import json
import io
import pytest
from werkzeug.datastructures import FileStorage

def test_get_items(client, sample_item):
    """Test getting all items"""
    response = client.get('/api/items')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) >= 1
    
    # Check if our sample item is in the response
    found = False
    for item in data:
        if item['id'] == sample_item.id:
            found = True
            assert item['name'] == sample_item.name
            assert item['brand'] == sample_item.brand
            break
    
    assert found is True

def test_get_items_by_category(client, sample_item):
    """Test getting items filtered by category"""
    category_id = sample_item.category_id
    
    response = client.get(f'/api/items?category_id={category_id}')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert isinstance(data, list)
    
    # All items should be from the specified category
    for item in data:
        assert item['category_id'] == category_id

def test_get_item_by_id(client, sample_item):
    """Test getting a specific item by ID"""
    response = client.get(f'/api/items/{sample_item.id}')
    assert response.status_code == 200
    
    item = json.loads(response.data)
    assert item['id'] == sample_item.id
    assert item['name'] == sample_item.name
    assert item['brand'] == sample_item.brand
    
    # Check for related data
    assert 'category_name' in item
    assert 'urls' in item
    assert 'specification_values' in item

def test_get_nonexistent_item(client):
    """Test getting an item that doesn't exist"""
    response = client.get('/api/items/9999')
    assert response.status_code == 404

def test_create_item_unauthenticated(client, sample_category):
    """Test creating an item without authentication (should fail)"""
    data = {
        'name': 'Test Item',
        'category_id': sample_category.id,
        'brand': 'Test Brand'
    }
    
    response = client.post('/api/items', 
                          data=json.dumps(data),
                          content_type='application/json')
    
    # Should return 401 Unauthorized
    assert response.status_code == 401

def test_create_item_authenticated(auth_client, sample_category_with_specs):
    """Test creating an item with authentication"""
    category_id = sample_category_with_specs.id
    
    # Create a test item with some specification values
    data = {
        'name': 'New Test Item',
        'category_id': category_id,
        'brand': 'New Brand',
        'description': 'A new test item description',
        'specification_values': json.dumps({
            'weight': '15.5',
            'color': 'Green',
            'material': 'plastic'
        }),
        'urls': json.dumps([
            {'url': 'https://example.com/new-item'}
        ])
    }
    
    response = auth_client.post('/api/items', data=data)
    assert response.status_code == 201
    
    created_item = json.loads(response.data)
    assert created_item['name'] == 'New Test Item'
    assert created_item['brand'] == 'New Brand'
    assert created_item['category_id'] == category_id
    
    # Check that specification values were saved
    assert 'specification_values' in created_item
    assert created_item['specification_values']['weight'] == '15.5'
    assert created_item['specification_values']['color'] == 'Green'
    
    # Check that URL was saved
    assert 'urls' in created_item
    assert len(created_item['urls']) == 1
    assert created_item['urls'][0]['url'] == 'https://example.com/new-item'

def test_create_item_with_photo(auth_client, sample_category, app):
    """Test creating an item with a photo"""
    category_id = sample_category.id
    
    # Create a test image
    test_image = io.BytesIO(b'test image content')
    test_image.name = 'test_image.jpg'
    
    data = {
        'name': 'Item With Photo',
        'category_id': category_id,
        'brand': 'Photo Brand',
        'photos[]': (test_image, 'test_image.jpg')
    }
    
    response = auth_client.post('/api/items', 
                              data=data,
                              content_type='multipart/form-data')
    
    assert response.status_code == 201
    
    created_item = json.loads(response.data)
    assert created_item['name'] == 'Item With Photo'
    
    # Check that photo was saved
    assert 'photos' in created_item
    assert len(created_item['photos']) == 1
    
    # Verify the photo file exists in the upload directory
    photo_path = os.path.join(app.config['UPLOAD_FOLDER'], created_item['photos'][0]['filename'])
    assert os.path.exists(photo_path)

def test_update_item(auth_client, sample_item):
    """Test updating an item"""
    item_id = sample_item.id
    
    # Update data
    data = {
        'name': 'Updated Item Name',
        'brand': 'Updated Brand',
        'description': 'Updated description'
    }
    
    response = auth_client.put(f'/api/items/{item_id}', 
                             data=data)
    
    assert response.status_code == 200
    
    updated_item = json.loads(response.data)
    assert updated_item['id'] == item_id
    assert updated_item['name'] == 'Updated Item Name'
    assert updated_item['brand'] == 'Updated Brand'
    assert updated_item['description'] == 'Updated description'

def test_update_item_specifications(auth_client, sample_item):
    """Test updating an item's specification values"""
    item_id = sample_item.id
    
    # Update specification values
    data = {
        'specification_values': json.dumps({
            'weight': '20.5',
            'color': 'Yellow'
        })
    }
    
    response = auth_client.put(f'/api/items/{item_id}', data=data)
    assert response.status_code == 200
    
    updated_item = json.loads(response.data)
    assert updated_item['specification_values']['weight'] == '20.5'
    assert updated_item['specification_values']['color'] == 'Yellow'

def test_update_nonexistent_item(auth_client):
    """Test updating an item that doesn't exist"""
    data = {'name': 'This Should Fail'}
    
    response = auth_client.put('/api/items/9999', data=data)
    assert response.status_code == 404

def test_delete_item(auth_client, sample_item):
    """Test deleting an item"""
    item_id = sample_item.id
    
    response = auth_client.delete(f'/api/items/{item_id}')
    assert response.status_code == 200
    
    # Verify it was actually deleted
    response = auth_client.get(f'/api/items/{item_id}')
    assert response.status_code == 404

def test_delete_nonexistent_item(auth_client):
    """Test deleting an item that doesn't exist"""
    response = auth_client.delete('/api/items/9999')
    assert response.status_code == 404

def test_add_item_url(auth_client, sample_item):
    """Test adding a URL to an item"""
    item_id = sample_item.id
    
    data = {'url': 'https://example.com/added-url'}
    
    response = auth_client.post(f'/api/items/{item_id}/urls', 
                              data=json.dumps(data),
                              content_type='application/json')
    
    assert response.status_code == 201
    
    # Verify URL was added
    response = auth_client.get(f'/api/items/{item_id}')
    item = json.loads(response.data)
    
    # Find the newly added URL
    found = False
    for url in item['urls']:
        if url['url'] == 'https://example.com/added-url':
            found = True
            break
    
    assert found is True

def test_delete_item_url(auth_client, sample_item):
    """Test deleting a URL from an item"""
    item_id = sample_item.id
    
    # Get the first URL's ID
    response = auth_client.get(f'/api/items/{item_id}')
    item = json.loads(response.data)
    url_id = item['urls'][0]['id']
    
    # Delete the URL
    response = auth_client.delete(f'/api/items/{item_id}/urls/{url_id}')
    assert response.status_code == 200
    
    # Verify URL was deleted
    response = auth_client.get(f'/api/items/{item_id}')
    updated_item = json.loads(response.data)
    
    # Make sure the URL is no longer in the list
    for url in updated_item['urls']:
        assert url['id'] != url_id

def test_add_item_photo(auth_client, sample_item, app):
    """Test adding a photo to an item"""
    item_id = sample_item.id
    
    # Create a test image
    test_image = io.BytesIO(b'new photo content')
    
    data = {'photos[]': (test_image, 'new_photo.jpg')}
    
    response = auth_client.post(f'/api/items/{item_id}/photos', 
                              data=data,
                              content_type='multipart/form-data')
    
    assert response.status_code == 201
    
    # Verify photo was added
    response = auth_client.get(f'/api/items/{item_id}')
    item = json.loads(response.data)
    
    # Find the new photo
    found = False
    for photo in item['photos']:
        if 'new_photo.jpg' in photo['filename']:
            found = True
            
            # Verify the file exists in the upload directory
            photo_path = os.path.join(app.config['UPLOAD_FOLDER'], photo['filename'])
            assert os.path.exists(photo_path)
            break
    
    assert found is True
