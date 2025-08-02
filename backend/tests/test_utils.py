"""
test_utils.py - Tests for utility functions
"""
import pytest
from flask import request
from utils.auth import requires_auth, check_auth, token_required
from utils.helpers import prepare_items_for_template

def test_requires_auth_decorator(client, token_auth_client):
    """Test the requires_auth decorator"""
    
    # Test unauthorized access (no auth header)
    response = client.get('/admin.html')
    assert response.status_code == 401
    assert 'WWW-Authenticate' in response.headers
    assert response.headers['WWW-Authenticate'] == 'Basic realm="Login Required"'
    
    # Test authorized access
    response = token_auth_client.get('/admin.html')
    assert response.status_code == 200
    
def test_token_required_decorator(client, token_auth_client):
    """Test the token_required decorator"""
    
    # Test unauthorized access (no token)
    response = client.post('/api/categories', 
                          data={"name": "Test Category"})
    assert response.status_code == 401
    
    # Test authorized access with token
    response = token_auth_client.post('/api/categories', 
                                    data={"name": "Test Category with Token"})
    assert response.status_code == 201

def test_check_auth_function():
    """Test the check_auth function directly"""
    # Valid credentials
    assert check_auth('admin', 'password') is True
    
    # Invalid credentials
    assert check_auth('wrong_user', 'wrong_pass') is False
    assert check_auth('admin', 'wrong_pass') is False
    assert check_auth('wrong_user', 'password') is False
    
    # Empty credentials
    assert check_auth('', '') is False

def test_prepare_items_for_template(app, sample_item):
    """Test the prepare_items_for_template helper function"""
    with app.app_context():
        # Test with no filters
        items = prepare_items_for_template()
        assert len(items) >= 1
        
        # Find our sample item in the results
        found = False
        for item in items:
            if item['id'] == sample_item.id:
                found = True
                assert 'primary_photo_url' in item
                assert item['name'] == sample_item.name
                break
        
        assert found is True
        
        # Test with category filter
        category_id = sample_item.category_id
        filtered_items = prepare_items_for_template(category_id=category_id)
        
        for item in filtered_items:
            assert item['category_id'] == category_id
        
        # Test with search filter
        search_items = prepare_items_for_template(search=sample_item.name)
        
        found = False
        for item in search_items:
            if item['id'] == sample_item.id:
                found = True
                break
        
        assert found is True
        
        # Test with combined filters
        combined_items = prepare_items_for_template(
            category_id=category_id,
            search=sample_item.name
        )
        
        for item in combined_items:
            assert item['category_id'] == category_id
        
        found = False
        for item in combined_items:
            if item['id'] == sample_item.id:
                found = True
                break
        
        assert found is True
