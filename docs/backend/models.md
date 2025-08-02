# Database Models

Collectify uses SQLAlchemy as an ORM (Object Relational Mapper) to interact with the database. The models are defined in `models.py`.

## Database Schema

Below is the database schema diagram showing the relationships between tables:

```
+----------------+       +----------------+       +----------------+
|     User       |       |    Category    |       |      Item      |
+----------------+       +----------------+       +----------------+
| id             |       | id             |       | id             |
| username       |       | name           |       | name           |
| email          |       | description    |       | category_id    |
| password_hash  |       | spec_schema    |       | brand          |
| is_admin       |       |                |       | serial_number  |
+----------------+       +----------------+       | form_factor    |
                                 ^                | description    |
                                 |                | spec_values    |
                                 |                | primary_photo  |
                                 +----------------+                |
                                                  +----------------+
                                                          |
                    +-----------------------------------+
                    |                                   |
          +-----------------+                 +-----------------+
          |    ItemPhoto    |                 |     ItemUrl     |
          +-----------------+                 +-----------------+
          | id              |                 | id              |
          | item_id         |                 | item_id         |
          | file_path       |                 | url             |
          +-----------------+                 +-----------------+
```

## Model Definitions

### User

Represents a user of the application.

#### Fields

| Field         | Type         | Description                               |
|---------------|--------------|-------------------------------------------|
| id            | Integer      | Primary key                               |
| username      | String(80)   | Unique username                           |
| email         | String(120)  | Unique email address                      |
| password_hash | String(128)  | Hashed password                           |
| is_admin      | Boolean      | Whether the user has admin privileges     |

#### Methods

- `set_password(password)`: Hashes and sets the password
- `check_password(password)`: Verifies a password against the hash
- `to_dict()`: Returns a dictionary representation of the user

### Category

Represents a collection category.

#### Fields

| Field         | Type         | Description                               |
|---------------|--------------|-------------------------------------------|
| id            | Integer      | Primary key                               |
| name          | String(100)  | Category name                             |
| description   | Text         | Category description                      |
| spec_schema   | Text         | JSON specification schema                 |
| items         | Relationship | One-to-many relationship with Item        |

#### Methods

- `get_specifications_schema()`: Returns the parsed specification schema
- `set_specifications_schema(schema)`: Updates the specification schema
- `to_dict()`: Returns a dictionary representation of the category

### Item

Represents an item in a collection.

#### Fields

| Field              | Type         | Description                               |
|--------------------|--------------|-------------------------------------------|
| id                 | Integer      | Primary key                               |
| name               | String(100)  | Item name                                 |
| category_id        | Integer      | Foreign key to Category                   |
| brand              | String(100)  | Item brand                                |
| serial_number      | String(100)  | Item serial number                        |
| form_factor        | String(100)  | Item form factor                          |
| description        | Text         | Item description                          |
| spec_values        | Text         | JSON specification values                 |
| primary_photo      | String(255)  | Path to primary photo                     |
| category           | Relationship | Many-to-one relationship with Category    |
| photos             | Relationship | One-to-many relationship with ItemPhoto   |
| urls               | Relationship | One-to-many relationship with ItemUrl     |

#### Methods

- `get_specification_values()`: Returns the parsed specification values
- `set_specification_values(values)`: Updates the specification values
- `to_dict()`: Returns a dictionary representation of the item

### ItemPhoto

Represents a photo associated with an item.

#### Fields

| Field         | Type         | Description                               |
|---------------|--------------|-------------------------------------------|
| id            | Integer      | Primary key                               |
| item_id       | Integer      | Foreign key to Item                       |
| file_path     | String(255)  | Path to the photo file                    |
| item          | Relationship | Many-to-one relationship with Item        |

#### Methods

- `to_dict()`: Returns a dictionary representation of the photo

### ItemUrl

Represents a URL associated with an item.

#### Fields

| Field         | Type         | Description                               |
|---------------|--------------|-------------------------------------------|
| id            | Integer      | Primary key                               |
| item_id       | Integer      | Foreign key to Item                       |
| url           | String(500)  | URL string                                |
| item          | Relationship | Many-to-one relationship with Item        |

#### Methods

- `to_dict()`: Returns a dictionary representation of the URL

## Relationships

- Category has many Items (one-to-many)
- Item belongs to one Category (many-to-one)
- Item has many ItemPhotos (one-to-many)
- Item has many ItemUrls (one-to-many)

## JSON Fields

Both Category and Item models use JSON-serialized fields stored as text in the database:

- `Category.spec_schema`: Defines the specifications that items in this category can have
- `Item.spec_values`: Stores the values for the specifications defined in the category's schema

## Primary Photo Management

Items can have multiple photos, but one is designated as the primary photo. The `primary_photo` field stores the file path of the designated primary photo, which is used for display in list views.

## Database Initialization

The database is initialized using the `init_db()` function in `flask_cli.py`, which:

1. Creates all tables based on the model definitions
2. Creates a default admin user if no users exist
3. Creates sample categories if none exist
