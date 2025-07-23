"""Helper functions for routes."""
from flask import request
from models import Item
from sqlalchemy import or_

def prepare_items_for_template(category_id=None):
    """Helper function to prepare items for template rendering."""
    # Query items, optionally filtered by category
    query = Item.query.order_by(Item.name)
    if category_id:
        query = query.filter(Item.category_id == category_id)
        
    # Apply search filter if present
    search_term = request.args.get('search')
    if search_term:
        # Filter by name, brand, or description containing search term
        query = query.filter(
            or_(
                Item.name.ilike(f'%{search_term}%'),
                Item.brand.ilike(f'%{search_term}%'),
                Item.description.ilike(f'%{search_term}%')
            )
        )
    
    items = []
    for it in query.all():
        d = it.to_dict()
        # Add computed fields
        d['primary_photo_url'] = f"/uploads/{it.primary_photo}" if it.primary_photo else "https://placehold.co/600x400/eee/ccc?text=No+Image"
        d['category_name'] = it.category.name if it.category else ''
        d['specification_values'] = it.get_specification_values() if hasattr(it, 'get_specification_values') else {}
        d['urls'] = [u.url for u in it.urls]
        items.append(d)
    return items
