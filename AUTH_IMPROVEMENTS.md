# Authentication Improvements

This update addresses two key authentication issues:

1. **Python 3.13 Password Hashing Compatibility**
2. **Persistent User Sessions in Frontend**

## Backend Changes

### Password Hashing Fix

Python 3.13 removed support for the scrypt algorithm, causing authentication failures with the error:
```
ValueError: unsupported hash type scrypt:32768:8:1
```

We've made the following changes to fix this:

1. Modified `User.set_password()` in `models.py` to explicitly use the `pbkdf2:sha256` algorithm
2. Created database initialization scripts:
   - `init_users_table.py`: Creates the users table with an admin user
   - `init_all_tables.py`: Creates all required database tables
3. Added a new API endpoint `/api/init-admin` to create admin users with the new hashing algorithm

### Default Admin User

A default admin user has been created with:
- Username: `admin`
- Password: `password`

## Frontend Session Management

We've enhanced the frontend authentication to provide a better user experience:

1. **Session Persistence**:
   - Authentication tokens are now stored in `sessionStorage` (current session)
   - Optional storage in `localStorage` (persistent across sessions)

2. **Remember Me Feature**:
   - Added to login form and login modal
   - When checked, authentication persists across browser sessions

3. **Login Modal**:
   - Created a reusable `LoginModal` component 
   - Replaces previous redirect to login page
   - Allows inline login without losing context

4. **Authentication Flow**:
   - Checks for tokens in both `sessionStorage` and `localStorage`
   - Priority given to current session tokens

## How to Use

### For Users

1. Login with "Remember me" checked to stay logged in across browser sessions
2. Login without "Remember me" to stay logged in only for the current session
3. If you encounter authentication issues, try logging out and back in

### For Developers

1. `AuthContext.jsx` now handles both session and persistent storage
2. Use the `LoginModal` component whenever authentication is required
3. The login flow automatically handles token storage and retrieval

## Testing

1. Test login with "Remember me" checked
2. Close and reopen the browser to verify persistence
3. Test login without "Remember me" checked
4. Close and reopen the browser to verify session-only storage
