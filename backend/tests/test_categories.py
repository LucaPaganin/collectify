"""
test_categories.py - Tests for the category API endpoints
"""
import json
import pytest

def test_get_categories_unauthenticated(client):
    """Test getting categories without authentication"""
    response = client.get('/api/categories')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert isinstance(data, list)

def test_get_categories_authenticated(token_auth_client):
    """Test getting categories with authentication"""
    response = token_auth_client.get('/api/categories')
    assert response.status_code == 200
    
    data = json.loads(response.data)
    assert isinstance(data, list)

def test_create_category_unauthenticated(client):
    """Test creating a category without authentication (should fail)"""
    response = client.post('/api/categories', 
                          data=json.dumps({'name': 'Test Category'}),
                          content_type='application/json')
    
    # Should return 401 Unauthorized
    assert response.status_code == 401

def test_create_category(token_auth_client):
    """Test creating a category with authentication"""
    # Create a new category
    response = token_auth_client.post('/api/categories', 
                              data=json.dumps({'name': 'New Test Category'}),
                              content_type='application/json')
    
    assert response.status_code == 201
    
    data = json.loads(response.data)
    assert data['name'] == 'New Test Category'
    assert 'id' in data
    
    # Verify it was actually created
    response = token_auth_client.get('/api/categories')
    categories = json.loads(response.data)
    
    found = False
    for category in categories:
        if category['name'] == 'New Test Category':
            found = True
            break
    
    assert found is True

def test_create_category_duplicate_name(token_auth_client):
    """Test creating a category with a duplicate name (should fail)"""
    # Create the first category
    response = token_auth_client.post('/api/categories', 
                              data=json.dumps({'name': 'Unique Category'}),
                              content_type='application/json')
    
    assert response.status_code == 201
    
    # Try to create another with the same name
    response = token_auth_client.post('/api/categories', 
                              data=json.dumps({'name': 'Unique Category'}),
                              content_type='application/json')
    
    # Should return 400 Bad Request
    assert response.status_code == 400

def test_update_category(token_auth_client):
    """Test updating a category"""
    # First create a category
    response = token_auth_client.post('/api/categories', 
                              data=json.dumps({'name': 'Category To Update'}),
                              content_type='application/json')
    
    assert response.status_code == 201
    category_id = json.loads(response.data)['id']
    
    # Now update it
    response = token_auth_client.put(f'/api/categories/{category_id}', 
                             data=json.dumps({'name': 'Updated Category Name'}),
                             content_type='application/json')
    
    assert response.status_code == 200
    updated_category = json.loads(response.data)
    assert updated_category['name'] == 'Updated Category Name'
    assert updated_category['id'] == category_id

def test_update_nonexistent_category(token_auth_client):
    """Test updating a category that doesn't exist"""
    response = token_auth_client.put('/api/categories/9999', 
                             data=json.dumps({'name': 'This Should Fail'}),
                             content_type='application/json')
    
    # Should return 404 Not Found
    assert response.status_code == 404

def test_delete_category(token_auth_client):
    """Test deleting a category"""
    # First create a category
    response = token_auth_client.post('/api/categories', 
                              data=json.dumps({'name': 'Category To Delete'}),
                              content_type='application/json')
    
    assert response.status_code == 201
    category_id = json.loads(response.data)['id']
    
    # Now delete it
    response = token_auth_client.delete(f'/api/categories/{category_id}')
    
    assert response.status_code == 200
    
    # Verify it was actually deleted
    response = token_auth_client.get('/api/categories')
    categories = json.loads(response.data)
    
    for category in categories:
        assert category['id'] != category_id

def test_delete_nonexistent_category(token_auth_client):
    """Test deleting a category that doesn't exist"""
    response = token_auth_client.delete('/api/categories/9999')
    
    # Should return 404 Not Found
    assert response.status_code == 404

def test_get_category_specifications(token_auth_client, sample_category_with_specs):
    """Test getting a category's specifications schema"""
    category_id = sample_category_with_specs.id
    response = token_auth_client.get(f'/api/categories/{category_id}/specifications_schema')
    
    assert response.status_code == 200
    specs = json.loads(response.data)
    
    assert len(specs) == 3
    assert specs[0]['key'] == 'weight'
    assert specs[1]['key'] == 'color'
    assert specs[2]['key'] == 'material'

def test_update_category_specifications(token_auth_client, sample_category_with_specs):
    """Test updating a category's specifications schema"""
    category_id = sample_category_with_specs.id
    
    # New specification schema
    new_specs = [
        {
            "key": "weight",
            "label": "Weight (kg)",
            "type": "number",
            "display_order": 0
        },
        {
            "key": "size",
            "label": "Size",
            "type": "text",
            "display_order": 1
        }
    ]
    
    response = token_auth_client.put(f'/api/categories/{category_id}/specifications_schema', 
                             data=json.dumps(new_specs),
                             content_type='application/json')
    
    assert response.status_code == 200
    
    # Verify the changes
    response = token_auth_client.get(f'/api/categories/{category_id}/specifications_schema')
    updated_specs = json.loads(response.data)
    
    assert len(updated_specs) == 2
    assert updated_specs[0]['key'] == 'weight'
    assert updated_specs[0]['label'] == 'Weight (kg)'
    assert updated_specs[1]['key'] == 'size'
