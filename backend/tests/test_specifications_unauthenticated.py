"""
test_specifications_unauthenticated.py - Tests for the category specifications API endpoints
"""
import json
import pytest

def test_update_category_specifications_unauthenticated(client, sample_category_with_specs):
    """Test updating a category's specifications schema without authentication (should fail but not prompt)"""
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
