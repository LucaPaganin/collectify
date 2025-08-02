# API Documentation

This document outlines the RESTful API endpoints provided by the Collectify backend.

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication

Protected endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Error Responses

Error responses follow this format:

```json
{
  "error": "Error message describing the problem",
  "endpoint": "endpoint_name"
}
```

HTTP status codes:
- 400: Bad Request - Invalid input data
- 401: Unauthorized - Missing or invalid token
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource not found
- 500: Internal Server Error - Server-side error

## Endpoints

### Authentication

#### Register User

- **URL:** `/auth/register`
- **Method:** `POST`
- **Auth Required:** No
- **Description:** Register a new user
- **Request Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "is_admin": boolean (optional)
  }
  ```
- **Success Response:**
  - **Code:** 201
  - **Content:** `{ "message": "User registered successfully" }`
- **Error Responses:**
  - 400: Missing required fields
  - 409: Username or email already exists

#### Login

- **URL:** `/auth/login`
- **Method:** `POST`
- **Auth Required:** No
- **Description:** Authenticate user and get token
- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Success Response:**
  - **Code:** 200
  - **Content:**
    ```json
    {
      "token": "jwt_token_string",
      "user": {
        "id": integer,
        "username": "string",
        "email": "string",
        "is_admin": boolean
      }
    }
    ```
- **Error Responses:**
  - 400: Missing username or password
  - 401: Invalid username or password

#### Get Current User

- **URL:** `/auth/me`
- **Method:** `GET`
- **Auth Required:** Yes
- **Description:** Get current user information
- **Success Response:**
  - **Code:** 200
  - **Content:** User object

### User Management (Admin Only)

#### Get All Users

- **URL:** `/auth/users`
- **Method:** `GET`
- **Auth Required:** Yes (Admin)
- **Description:** Get all users
- **Success Response:**
  - **Code:** 200
  - **Content:** Array of user objects

#### Get User

- **URL:** `/auth/users/<user_id>`
- **Method:** `GET`
- **Auth Required:** Yes (Admin)
- **Description:** Get specific user by ID
- **Success Response:**
  - **Code:** 200
  - **Content:** User object

#### Update User

- **URL:** `/auth/users/<user_id>`
- **Method:** `PUT`
- **Auth Required:** Yes (Admin)
- **Description:** Update user information
- **Request Body:**
  ```json
  {
    "username": "string" (optional),
    "email": "string" (optional),
    "password": "string" (optional),
    "is_admin": boolean (optional)
  }
  ```
- **Success Response:**
  - **Code:** 200
  - **Content:** Updated user object
- **Error Responses:**
  - 400: No data provided or attempting to remove last admin
  - 409: Username or email already exists

#### Delete User

- **URL:** `/auth/users/<user_id>`
- **Method:** `DELETE`
- **Auth Required:** Yes (Admin)
- **Description:** Delete a user
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "message": "User deleted successfully" }`
- **Error Responses:**
  - 400: Cannot delete your own account or the last admin

### Categories

#### Get All Categories

- **URL:** `/categories`
- **Method:** `GET`
- **Auth Required:** No
- **Description:** Get all categories
- **Success Response:**
  - **Code:** 200
  - **Content:** Array of category objects

#### Add Category

- **URL:** `/categories`
- **Method:** `POST`
- **Auth Required:** Yes
- **Description:** Create a new category
- **Request Body:**
  ```json
  {
    "name": "string",
    "description": "string" (optional)
  }
  ```
- **Success Response:**
  - **Code:** 201
  - **Content:** Created category object
- **Error Responses:**
  - 400: Missing category name or category already exists

#### Update Category

- **URL:** `/categories/<category_id>`
- **Method:** `PUT`
- **Auth Required:** Yes
- **Description:** Update a category
- **Request Body:**
  ```json
  {
    "name": "string" (optional),
    "description": "string" (optional)
  }
  ```
- **Success Response:**
  - **Code:** 200
  - **Content:** Updated category object
- **Error Responses:**
  - 404: Category not found
  - 400: Category name already exists

#### Delete Category

- **URL:** `/categories/<category_id>`
- **Method:** `DELETE`
- **Auth Required:** Yes
- **Description:** Delete a category
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "message": "Category deleted successfully" }`
- **Error Responses:**
  - 404: Category not found
  - 400: Cannot delete category with items

#### Get Category Specifications Schema

- **URL:** `/categories/<category_id>/specifications_schema`
- **Method:** `GET`
- **Auth Required:** No
- **Description:** Get specifications schema for a category
- **Success Response:**
  - **Code:** 200
  - **Content:** Array of specification objects
- **Error Responses:**
  - 404: Category not found

#### Update Category Specifications Schema

- **URL:** `/categories/<category_id>/specifications_schema`
- **Method:** `PUT`
- **Auth Required:** Yes
- **Description:** Update specifications schema for a category
- **Request Body:** Array of specification objects
- **Success Response:**
  - **Code:** 200
  - **Content:** Updated specification schema
- **Error Responses:**
  - 404: Category not found
  - 400: Missing specification schema

### Items

#### Get Items

- **URL:** `/items`
- **Method:** `GET`
- **Auth Required:** No
- **Description:** Get all items, optionally filtered by category
- **Query Parameters:**
  - `category_id`: Filter items by category
- **Success Response:**
  - **Code:** 200
  - **Content:** Array of item objects

#### Get Item

- **URL:** `/items/<item_id>`
- **Method:** `GET`
- **Auth Required:** No
- **Description:** Get a specific item by ID
- **Success Response:**
  - **Code:** 200
  - **Content:** Item object
- **Error Responses:**
  - 404: Item not found

#### Add Item

- **URL:** `/items`
- **Method:** `POST`
- **Auth Required:** Yes
- **Description:** Create a new item
- **Request Body:**
  ```json
  {
    "name": "string",
    "category_id": integer,
    "brand": "string" (optional),
    "serial_number": "string" (optional),
    "form_factor": "string" (optional),
    "description": "string" (optional),
    "specification_values": {
      "spec_key1": "value1",
      "spec_key2": "value2"
    } (optional),
    "urls": ["string", "string"] (optional)
  }
  ```
- **Success Response:**
  - **Code:** 201
  - **Content:** Created item object
- **Error Responses:**
  - 400: Missing required fields or invalid data
  - 404: Category not found

#### Update Item

- **URL:** `/items/<item_id>`
- **Method:** `PUT`
- **Auth Required:** Yes
- **Description:** Update an item
- **Request Body:** Same as Add Item, all fields optional
- **Success Response:**
  - **Code:** 200
  - **Content:** Updated item object
- **Error Responses:**
  - 404: Item not found
  - 400: Invalid data

#### Delete Item

- **URL:** `/items/<item_id>`
- **Method:** `DELETE`
- **Auth Required:** Yes
- **Description:** Delete an item
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "message": "Item deleted successfully" }`
- **Error Responses:**
  - 404: Item not found

#### Upload Photo

- **URL:** `/items/<item_id>/photos`
- **Method:** `POST`
- **Auth Required:** Yes
- **Description:** Upload a photo for an item
- **Request Body:** Form data with `photo` file
- **Success Response:**
  - **Code:** 201
  - **Content:** Photo object
- **Error Responses:**
  - 404: Item not found
  - 400: No file provided or invalid file type

#### Set Primary Photo

- **URL:** `/items/<item_id>/primary_photo/<photo_id>`
- **Method:** `PUT`
- **Auth Required:** Yes
- **Description:** Set a photo as the primary photo for an item
- **Success Response:**
  - **Code:** 200
  - **Content:** Updated item object
- **Error Responses:**
  - 404: Item or photo not found

#### Delete Photo

- **URL:** `/items/<item_id>/photos/<photo_id>`
- **Method:** `DELETE`
- **Auth Required:** Yes
- **Description:** Delete a photo from an item
- **Success Response:**
  - **Code:** 200
  - **Content:** `{ "message": "Photo deleted successfully" }`
- **Error Responses:**
  - 404: Item or photo not found
