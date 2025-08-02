"""
test_token_auth_specifications.py - Tests for the category specifications API endpoints with token auth
"""
import json
import pytest

def test_update_category_specifications_with_token(token_auth_client, sample_category_with_specs):
    """Test updating a category's specifications schema with JWT token auth"""
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
    
    # Should return 200 OK
    assert response.status_code == 200
    
    # Verify the changes
    response = token_auth_client.get(f'/api/categories/{category_id}/specifications_schema')
    updated_specs = json.loads(response.data)
    
    assert len(updated_specs) == 2
    assert updated_specs[0]['key'] == 'weight'
    assert updated_specs[0]['label'] == 'Weight (kg)'
    assert updated_specs[1]['key'] == 'size'

def test_update_category_specifications_without_token(client, sample_category_with_specs):
    """Test updating a category's specifications schema without token (should fail)"""
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
    
    response = client.put(f'/api/categories/{category_id}/specifications_schema', 
                         data=json.dumps(new_specs),
                         content_type='application/json')
    
    # Should return 401 Unauthorized without WWW-Authenticate header
    assert response.status_code == 401
    
    # Check that the response doesn't include the WWW-Authenticate header
    assert 'WWW-Authenticate' not in response.headers
    
    # Check that the response body includes an error message
    data = json.loads(response.data)
    assert 'error' in data
