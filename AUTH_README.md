# Collectify Authentication

This document describes how to set up and use the authentication system in Collectify.

## Setting Up Authentication

1. Make sure the database is initialized:
   ```bash
   cd backend
   flask init-db
   ```

2. Run the user migration to create the users table and default admin user:
   ```bash
   flask migrate-users
   ```

3. Start the application:
   ```bash
   flask run
   ```

4. Access the admin panel at http://localhost:5000/admin

## Default Credentials

- Username: admin
- Password: password

## Environment Variables

You can customize authentication settings with the following environment variables:

- `SECRET_KEY`: Used for signing JWT tokens (a random key is generated if not provided)
- `ADMIN_PASSWORD`: Set a custom password for the default admin user (default: "password")

## Authentication Flow

1. User visits the login page at `/login`
2. User enters credentials (username and password)
3. If valid, a JWT token is generated and stored in localStorage
4. The token is included in the Authorization header for API requests
5. Protected routes check for a valid token before allowing access

## API Endpoints

- `POST /api/auth/login`: Log in with username and password
- `POST /api/auth/register`: Register a new user account
- `GET /api/auth/me`: Get the current authenticated user's information
- `GET /api/auth/users`: Get all users (admin only)
- `GET /api/auth/users/:id`: Get a specific user (admin only)
- `PUT /api/auth/users/:id`: Update a user (admin only)
- `DELETE /api/auth/users/:id`: Delete a user (admin only)

## Frontend Components

- `AuthContext`: Provides authentication state and methods to components
- `LoginPage`: Handles user login and registration
- `ProtectedRoute`: Restricts access to authenticated users

## Usage in Code

### Protecting API Routes

```python
from utils.auth import token_required, admin_required

@app.route('/api/protected-route', methods=['GET'])
@token_required
def protected_route(current_user):
    # Only authenticated users can access this
    return jsonify({'message': 'This is a protected route'})

@app.route('/api/admin-route', methods=['GET'])
@token_required
@admin_required
def admin_route(current_user):
    # Only admins can access this
    return jsonify({'message': 'This is an admin-only route'})
```

### Using the Auth Context in React

```jsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { currentUser, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <p>Please log in to view this content</p>;
  }
  
  return (
    <div>
      <p>Welcome, {currentUser.username}!</p>
      <button onClick={logout}>Log Out</button>
    </div>
  );
}
```

### Protecting Routes in React

```jsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/public" element={<PublicPage />} />
      <Route path="/protected" element={
        <ProtectedRoute>
          <ProtectedPage />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <AdminPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```
