# Authentication Fix for Python 3.13

## Problem

In Python 3.13, the default scrypt hashing algorithm used by Werkzeug is no longer supported, resulting in the following error when trying to verify passwords:

```
ValueError: unsupported hash type scrypt:32768:8:1
```

This is because Python 3.13 removed support for the scrypt algorithm from the standard library for security reasons.

## Solution

This update includes the following changes to fix the authentication system:

1. Modified the `User.set_password` method in `models.py` to explicitly use the `pbkdf2:sha256` algorithm instead of scrypt.

2. Added a new API endpoint `/api/init-admin` to create an admin user with the new hashing algorithm.

3. Created a utility script `check_password_hashes.py` that can check and fix existing password hashes.

## How to Fix Existing Users

### Option 1: Create a New Admin User

Use the new endpoint to create a fresh admin user:

```bash
curl -X POST http://localhost:5000/api/init-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"new_admin","password":"your_password","email":"admin@example.com"}'
```

### Option 2: Run the Password Hash Utility

Run the script to check your current password hashes:

```bash
cd backend
python check_password_hashes.py
```

To fix all scrypt password hashes by converting them to SHA-256 with temporary passwords:

```bash
cd backend
python check_password_hashes.py --fix
```

This will update all scrypt hashes to use SHA-256 with temporary passwords in the format `temp_password_<user_id>`.

### Option 3: Reset All User Passwords

If you're having trouble with the other options, you can manually reset all user passwords in the database:

```sql
UPDATE users SET password_hash = 'pbkdf2:sha256:600000$g5GzgIgEI5JWBb2a$aad7e5f8c14bb0bd18a83c5df0e76fdd3416ccc4c516518d8363e7e63178b500';
```

This sets all passwords to "password".

## Long-term Solution

Moving forward, the app will use the `pbkdf2:sha256` algorithm for all new password hashes, which is well-supported in Python 3.13. The changes are backward-compatible, so existing SHA-256 hashes will continue to work.

## Technical Details

### What Changed in Python 3.13

Python 3.13 removed several cryptographic hash functions from the standard library, including scrypt, due to security concerns and to encourage the use of more modern, specialized cryptographic libraries.

### Password Hashing in Werkzeug

Werkzeug's `generate_password_hash` function uses scrypt by default, but can be configured to use other algorithms. The changes in this update explicitly set the algorithm to `pbkdf2:sha256`, which is a secure alternative that remains supported in Python 3.13.
