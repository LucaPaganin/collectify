# Backend Architecture

The Collectify backend is built using Flask, a lightweight WSGI web application framework in Python. It follows a modular architecture to ensure maintainability and scalability.

## Directory Structure

```
backend/
├── app.py                  # Main application entry point
├── config.py               # Configuration settings
├── models.py               # Database models using SQLAlchemy
├── flask_cli.py            # CLI commands for Flask
├── gunicorn_config.py      # Production server configuration
├── requirements.txt        # Python dependencies
├── routes/                 # API route handlers
│   ├── __init__.py
│   ├── auth.py             # Authentication routes
│   ├── categories.py       # Category management routes
│   ├── frontend.py         # Frontend serving routes
│   └── items.py            # Item management routes
├── static/                 # Static files (CSS, JS, images)
├── templates/              # Jinja2 templates
├── tests/                  # Test suite
│   ├── __init__.py
│   ├── conftest.py         # Test fixtures
│   └── ...
└── utils/                  # Utility functions
    ├── __init__.py
    ├── auth.py             # Authentication utilities
    ├── database.py         # Database utilities
    ├── decorators.py       # Utility decorators
    └── helpers.py          # Helper functions
```

## Application Flow

1. **Initialization**: `app.py` creates and configures the Flask application
2. **Route Registration**: Routes from `routes/` modules are registered with the app
3. **Database Models**: SQLAlchemy models defined in `models.py` represent data entities
4. **Request Handling**: Incoming requests are routed to appropriate handler functions
5. **Response Generation**: JSON or HTML responses are generated and returned

## Core Components

### Configuration (config.py)

Contains configuration settings for different environments (development, testing, production). Settings include database URI, secret keys, and feature flags.

### Models (models.py)

Defines SQLAlchemy ORM models for database entities:
- User: Authentication and user management
- Category: Collection categories
- Item: Collection items with customizable specifications
- ItemUrl: URLs associated with items
- ItemPhoto: Photo attachments for items

### Routes

Organized by domain area:
- **auth.py**: User registration, login, token management
- **categories.py**: CRUD operations for categories and specifications
- **items.py**: CRUD operations for collection items
- **frontend.py**: Routes for serving frontend pages

### Utilities

Helper modules for common functionality:
- **auth.py**: JWT token generation and validation
- **database.py**: Database connection and transaction management
- **decorators.py**: Reusable route decorators (e.g., `@log_exceptions`, `@token_required`)
- **helpers.py**: Shared helper functions

## Authentication

Authentication is JWT-based:
1. Users register or login via `/auth/register` or `/auth/login`
2. Server validates credentials and issues a JWT token
3. Clients include token in `Authorization` header for protected routes
4. `@token_required` decorator validates the token and passes user info to route handlers

## Error Handling

The application uses a centralized error handling approach:
1. `@log_exceptions` decorator wraps route handlers
2. Exceptions are caught, logged with traceback, and converted to appropriate JSON responses
3. Database transactions are rolled back automatically on error
4. Detailed logs are stored in a rotating log file

## Database Interactions

SQLAlchemy ORM is used for database operations:
1. Models define table structure and relationships
2. Session-based transactions ensure data consistency
3. Query API provides a Pythonic interface for data retrieval
4. Relationship handling manages connected entities (e.g., items belonging to categories)

## Deployment Architecture

In production:
1. Gunicorn serves as the WSGI server
2. Nginx acts as a reverse proxy (in Docker setup)
3. Database is SQLite for simplicity (can be replaced with PostgreSQL)
4. Static files are served directly by Nginx
5. File uploads are stored in a persistent volume
