# Authentication System

Collectify uses JSON Web Tokens (JWT) for authentication, providing a stateless and secure mechanism for authenticating API requests.

## Overview

The authentication system has the following components:

1. **User Model**: Stores user credentials and role information
2. **Authentication Routes**: Handles user registration, login, and token management
3. **Token Generation**: Creates JWT tokens with user information and expiration
4. **Token Validation**: Verifies tokens on protected routes
5. **Permission Management**: Controls access based on user roles (admin vs. regular users)

## User Registration and Login

### Registration Process

1. Client submits username, email, and password to `/api/auth/register`
2. Server validates input data (required fields, duplicate username/email)
3. If valid, password is hashed using `werkzeug.security.generate_password_hash`
4. User is created in the database (first user is automatically an admin)
5. Success response is returned (201 Created)

### Login Process

1. Client submits username and password to `/api/auth/login`
2. Server validates credentials
3. If valid, a JWT token is generated containing:
   - User ID
   - Username
   - Admin status
   - Expiration time (24 hours from issuance)
4. Token is returned to the client along with user information

## JWT Token Implementation

### Token Generation

```python
token = jwt.encode({
    'user_id': user.id,
    'username': user.username,
    'is_admin': user.is_admin,
    'exp': datetime.utcnow() + timedelta(hours=24)
}, current_app.config['SECRET_KEY'], algorithm="HS256")
```

### Token Format

The token is a Base64-encoded string with three parts:
- Header: Identifies the token type and algorithm
- Payload: Contains the claims (user_id, username, is_admin, exp)
- Signature: Verifies token integrity

## Route Protection

### Token Required Decorator

The `@token_required` decorator in `utils/auth.py` protects routes that require authentication:

```python
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startsWith('Bearer '):
            token = auth_header.split(' ')[1]
            
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode token
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            
            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
        # Pass the current user to the route
        return f(current_user, *args, **kwargs)
    
    return decorated
```

### Usage in Routes

```python
@app.route('/api/protected-resource', methods=['POST'])
@token_required
def protected_route(current_user):
    # current_user is passed by the decorator
    # Route implementation...
```

## Role-Based Access Control

### Admin Required Decorator

The `@admin_required` decorator restricts routes to admin users only:

```python
def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user.is_admin:
            return jsonify({'error': 'Admin privileges required'}), 403
        return f(current_user, *args, **kwargs)
    
    return decorated
```

### Usage in Routes

```python
@app.route('/api/admin-resource', methods=['POST'])
@token_required
@admin_required
def admin_route(current_user):
    # Only admin users can access this route
    # Route implementation...
```

## Password Security

- Passwords are never stored in plain text
- Passwords are hashed using Werkzeug's `generate_password_hash` function
- Password validation uses `check_password_hash` to compare without decrypting
- Password complexity requirements are enforced on the client side

## Token Storage and Usage

### Client-Side Storage

Tokens should be stored securely on the client side:
- Browser: Use HTTP-only cookies or localStorage with caution
- Mobile apps: Use secure storage mechanisms

### Token Usage

To make authenticated requests, clients should include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Security Considerations

- Tokens expire after 24 hours to limit the impact of token theft
- All authentication endpoints are protected with rate limiting to prevent brute force attacks
- Sensitive operations (like user deletion) have additional checks beyond authentication
- HTTPS is required in production to prevent token interception

## Error Logging

Authentication failures are logged with relevant context:
- Failed login attempts (with username but without password details)
- Token validation failures
- Authorization failures (e.g., non-admin trying to access admin routes)

## Admin User Management

Administrators can manage users through the following endpoints:
- GET `/api/auth/users`: List all users
- GET `/api/auth/users/<id>`: Get user details
- PUT `/api/auth/users/<id>`: Update user information
- DELETE `/api/auth/users/<id>`: Delete a user

Special rules apply to prevent removing the last admin user or self-deletion.
