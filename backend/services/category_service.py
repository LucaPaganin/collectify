from models import db, Category, CategorySpecification
import json
import logging

logger = logging.getLogger(__name__)

class CategoryService:
    @staticmethod
    def get_all_categories():
        """Fetch all categories ordered by name."""
        return [category.to_dict() for category in Category.query.order_by(Category.name).all()]

    @staticmethod
    def get_category_by_id(category_id):
        """Fetch a single category by ID."""
        return Category.query.get(category_id)

    @staticmethod
    def get_category_by_name(name):
        """Fetch a single category by name."""
        return Category.query.filter_by(name=name).first()

    @staticmethod
    def create_category(name, specifications_schema=None):
        """Create a new category."""
        # Check for duplicate name
        if CategoryService.get_category_by_name(name):
            raise ValueError(f"Category '{name}' already exists")
            
        new_category = Category(name=name)
        
        # Add specifications schema if provided
        if specifications_schema is not None:
            new_category.set_specifications_schema(specifications_schema)
        else:
            new_category.set_specifications_schema([])
            
        db.session.add(new_category)
        db.session.commit()
        logger.info(f"Category '{name}' created successfully with ID {new_category.id}")
        return new_category

    @staticmethod
    def update_category(category_id, name=None, specifications_schema=None):
        """Update an existing category."""
        category = CategoryService.get_category_by_id(category_id)
        if not category:
            raise ValueError("Category not found")
            
        if name:
            # Check if new name already exists for a different category
            existing = Category.query.filter(Category.name == name, Category.id != category_id).first()
            if existing:
                raise ValueError("Category name already exists")
            
            old_name = category.name
            category.name = name
            logger.info(f"Category {category_id} updated: '{old_name}' -> '{name}'")
        
        if specifications_schema is not None:
            category.set_specifications_schema(specifications_schema)
            logger.info(f"Updated specifications schema for category {category_id}")
        
        db.session.commit()
        return category

    @staticmethod
    def delete_category(category_id):
        """Delete a category."""
        category = CategoryService.get_category_by_id(category_id)
        if not category:
            raise ValueError("Category not found")
        
        category_name = category.name
        db.session.delete(category)
        db.session.commit()
        logger.info(f"Category {category_id} '{category_name}' deleted successfully")
        return True

    @staticmethod
    def get_specifications_schema(category_id):
        """Get specifications schema for a category."""
        category = CategoryService.get_category_by_id(category_id)
        if not category:
            raise ValueError("Category not found")
        
        return category.get_specifications_schema()

    @staticmethod
    def update_specifications_schema(category_id, schema_data):
        """Update specifications schema for a category."""
        if schema_data is None:
            raise ValueError("Specifications schema is required")
            
        category = CategoryService.get_category_by_id(category_id)
        if not category:
            raise ValueError("Category not found")
        
        category.set_specifications_schema(schema_data)
        db.session.commit()
        logger.info(f"Updated specifications schema for category {category_id}")
        return category.get_specifications_schema()
