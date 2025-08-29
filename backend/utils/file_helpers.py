"""Utility functions for file operations."""
import os
import re
import uuid
from datetime import datetime

def sanitize_filename(filename):
    """
    Sanitize a filename to make it URL-safe by:
    1. Removing any path components
    2. Removing special characters
    3. Replacing spaces with underscores
    4. Adding a timestamp to ensure uniqueness
    
    Returns the sanitized filename.
    """
    # Get just the filename (no path)
    filename = os.path.basename(filename)
    
    # Get the extension
    name, ext = os.path.splitext(filename)
    
    # Remove special characters and replace spaces with underscores
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[\s]+', '_', name)
    
    # Add timestamp for uniqueness (format: YYYYMMDD_HHMMSS)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Add a short UUID fragment for extra uniqueness
    short_uuid = str(uuid.uuid4())[:8]
    
    # Combine components (keeping the original extension)
    sanitized_filename = f"{name}_{timestamp}_{short_uuid}{ext}"
    
    return sanitized_filename