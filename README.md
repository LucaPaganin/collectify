# Collectify

A Flask application for managing collections of items with customizable specifications by category.

## Docker Setup

### Prerequisites
- Docker and Docker Compose installed on your system

### Running with Docker Compose
1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

2. Access the application:
   - Main page: http://localhost:5000
   - Admin panel: http://localhost:5000/admin.html
     - Username: admin
     - Password: password

3. Stop the containers:
   ```bash
   docker-compose down
   ```

### Data Persistence
- Database and uploaded files are stored in a Docker volume named `collectify-data`
- Data persists between container restarts

## Development

### Running locally
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the application:
   ```bash
   python app.py
   ```

3. Access at http://localhost:5000