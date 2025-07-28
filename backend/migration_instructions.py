"""
Migration Deployment Helper
This script provides instructions for the migration process.
"""

print("""
===================================================
Collectify Specification Migration Instructions
===================================================

To migrate your existing specifications data to the new format,
follow these steps:

1. Make sure you have a backup of your database first:
   - Copy data/collectibles.db to data/collectibles.db.bak

2. Run the migration script:
   python migrate_specifications.py

3. Restart the application:
   python app.py

4. Verify that your categories and specifications are displayed correctly.

The migration process will convert your existing specifications from
a dictionary structure to an ordered list format, which allows for
drag-and-drop reordering in the admin interface.

===================================================
""")
