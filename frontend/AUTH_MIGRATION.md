# Authentication Migration Guide

This document provides instructions on how to migrate from the custom authentication implementation to the new react-auth-kit based authentication.

## What has been implemented

- Installed `react-auth-kit` and `@auth-kit/react-router` packages for JWT authentication and route protection
- Set up AuthProvider in App.js with cookie-based authentication
- Updated LoginPage to use react-auth-kit's authentication hooks
- Created a compatibility layer (CompatAuthContext) to support gradual migration
- Updated AdminPage to use the new authentication system
- Created utility functions in authUtils.js

## How to migrate other components

### For components that currently use useAuth():

1. Import authentication hooks from react-auth-kit:

```jsx
// Replace this:
import { useAuth } from '../context/AuthContext';
const { currentUser, isAuthenticated } = useAuth();

// With this:
import { useAuthUser, useIsAuthenticated } from 'react-auth-kit';
const auth = useAuthUser();
const isAuthenticated = useIsAuthenticated();
const currentUser = auth();
```

2. For logout functionality:

```jsx
// Replace this:
import { useAuth } from '../context/AuthContext';
const { logout } = useAuth();

// With this:
import { useSignOut } from 'react-auth-kit';
const signOut = useSignOut();
// Then replace logout() with signOut()
```

### For protected routes:

1. Replace ProtectedRoute component with RequireAuth:

```jsx
// Replace this:
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>

// With this:
import { RequireAuth } from '@auth-kit/react-router';
<RequireAuth fallbackPath="/login">
  <YourComponent />
</RequireAuth>
```

### For API requests with authentication:

1. Use the utility functions in authUtils.js:

```jsx
import { api } from '../utils/authUtils';

// Then use api instead of axios for authenticated requests
const response = await api.get('/endpoint');
```

## Benefits of react-auth-kit

- Built-in token management and secure storage
- Automatic handling of token expiration
- Easy to implement protected routes
- Support for refresh tokens
- Better security practices
- Simplified code maintenance

## Compatibility Layer

During the transition period, you can continue using the existing context API:

```jsx
import { useAuth } from '../context/AuthContext';
```

This will use the compatibility layer that wraps react-auth-kit and provides the same API. This allows for a gradual migration without breaking existing code.

## Important Notes

- JWT tokens are now stored in cookies instead of localStorage/sessionStorage
- The "Remember me" functionality sets a longer expiration time for the cookie
- For security-critical operations, it's recommended to fully migrate to the react-auth-kit API
