"""Test the application's logging functionality."""
import os
import sys
import pytest
import logging
from app import app
from datetime import datetime

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_logging_configuration(client):
    """Test that the logging is properly configured."""
    # Check that logs directory exists
    assert os.path.exists('logs'), "Logs directory should exist"
    
    # Check that the log file exists
    assert os.path.exists('logs/collectify.log'), "Log file should exist"
    
    # Test that we can log a message
    test_message = f"Test log message at {datetime.now().isoformat()}"
    app.logger.info(test_message)
    
    # Check if the message is in the log file
    with open('logs/collectify.log', 'r') as log_file:
        log_content = log_file.read()
        assert test_message in log_content, "Test message should be in log file"

def test_error_logging(client):
    """Test that errors are properly logged."""
    # Force an error by requesting a non-existent item
    response = client.get('/api/items/99999')
    assert response.status_code == 404, "Should return 404 for non-existent item"
    
    # Check that the error was logged
    with open('logs/collectify.log', 'r') as log_file:
        log_content = log_file.read()
        assert "Item not found: ID 99999" in log_content, "Error message should be in log file"
        
def test_authentication_logging(client):
    """Test that authentication attempts are logged."""
    # Try to access a protected route without authentication
    response = client.get('/api/auth/me')
    assert response.status_code == 401, "Should return 401 for unauthenticated request"
    
    # Check that the authentication failure was logged
    with open('logs/collectify.log', 'r') as log_file:
        log_content = log_file.read()
        assert "Authentication failed: Token is missing" in log_content, "Authentication failure should be logged"
        
    # Try to login with invalid credentials
    response = client.post('/api/auth/login', json={
        'username': 'nonexistent',
        'password': 'wrongpassword'
    })
    assert response.status_code == 401, "Should return 401 for invalid credentials"
    
    # Check that the login failure was logged
    with open('logs/collectify.log', 'r') as log_file:
        log_content = log_file.read()
        assert "Login failed: User 'nonexistent' not found" in log_content, "Login failure should be logged"
