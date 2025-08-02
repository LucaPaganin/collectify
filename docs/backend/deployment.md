# Deployment

This document outlines the process for deploying the Collectify application to production environments.

## Deployment Options

Collectify can be deployed in several ways:

1. **Docker Deployment**: The recommended approach, using Docker and Docker Compose
2. **Manual Deployment**: Setting up the components individually on a server
3. **Cloud Platform Deployment**: Deploying to platforms like Heroku, AWS, or Azure

## Docker Deployment

### Prerequisites

- Docker Engine (20.10+)
- Docker Compose (2.0+)
- Git

### Deployment Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/LucaPaganin/collectify.git
   cd collectify
   ```

2. Configure environment variables by creating a `.env` file:
   ```
   SECRET_KEY=your-secret-key
   FLASK_ENV=production
   DATABASE_URL=sqlite:///collectify.db
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=secure-password
   ADMIN_EMAIL=admin@example.com
   ```

3. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

4. Initialize the database (first time only):
   ```bash
   docker-compose exec web python flask_cli.py init-db
   ```

5. Access the application at `http://your-server-ip:5000`

### Docker Compose Configuration

The `docker-compose.yml` file defines the services required for the application:

```yaml
version: '3'

services:
  web:
    image: lucaplawliet/collectify-web:latest
    # Alternatively, build from source:
    # build: .
    ports:
      - "5000:5000"
    volumes:
      - collectify-data:/app/data
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - FLASK_ENV=${FLASK_ENV}
      - DATABASE_URL=${DATABASE_URL}
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
    restart: unless-stopped

volumes:
  collectify-data:
```

### Updating the Application

To update the application:

```bash
# Pull the latest image
docker pull lucaplawliet/collectify-web:latest

# Restart the containers
docker-compose down
docker-compose up -d
```

## Manual Deployment

### Prerequisites

- Python 3.9+
- Nginx or Apache
- SQLite (or PostgreSQL/MySQL for larger deployments)
- Git

### Deployment Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/LucaPaganin/collectify.git
   cd collectify
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   pip install gunicorn  # Production WSGI server
   ```

4. Set environment variables:
   ```bash
   export SECRET_KEY="your-secret-key"
   export FLASK_ENV="production"
   export DATABASE_URL="sqlite:///collectify.db"
   ```

5. Initialize the database:
   ```bash
   python flask_cli.py init-db
   ```

6. Configure Gunicorn:
   Create a file `gunicorn_config.py`:
   ```python
   bind = "127.0.0.1:8000"
   workers = 4
   threads = 2
   timeout = 120
   errorlog = "logs/gunicorn-error.log"
   accesslog = "logs/gunicorn-access.log"
   loglevel = "info"
   ```

7. Start the application with Gunicorn:
   ```bash
   gunicorn -c gunicorn_config.py "app:create_app('production')"
   ```

8. Configure Nginx as a reverse proxy:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /static {
           alias /path/to/collectify/static;
       }

       location /uploads {
           alias /path/to/collectify/uploads;
       }
   }
   ```

9. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

### Setting Up a Systemd Service

For automatic startup and management, create a systemd service:

1. Create a file `/etc/systemd/system/collectify.service`:
   ```ini
   [Unit]
   Description=Collectify Gunicorn daemon
   After=network.target

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/path/to/collectify
   Environment="PATH=/path/to/collectify/venv/bin"
   Environment="SECRET_KEY=your-secret-key"
   Environment="FLASK_ENV=production"
   Environment="DATABASE_URL=sqlite:///collectify.db"
   ExecStart=/path/to/collectify/venv/bin/gunicorn -c gunicorn_config.py "app:create_app('production')"
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

2. Start and enable the service:
   ```bash
   sudo systemctl start collectify
   sudo systemctl enable collectify
   ```

## Cloud Platform Deployment

### Heroku Deployment

1. Install the Heroku CLI and log in:
   ```bash
   heroku login
   ```

2. Create a new Heroku app:
   ```bash
   heroku create collectify-app
   ```

3. Add a `Procfile` to the repository:
   ```
   web: gunicorn "app:create_app('production')"
   ```

4. Configure environment variables:
   ```bash
   heroku config:set SECRET_KEY="your-secret-key"
   heroku config:set FLASK_ENV="production"
   ```

5. Push the code to Heroku:
   ```bash
   git push heroku main
   ```

6. Initialize the database:
   ```bash
   heroku run python flask_cli.py init-db
   ```

### AWS Elastic Beanstalk Deployment

1. Install the EB CLI:
   ```bash
   pip install awsebcli
   ```

2. Initialize the EB application:
   ```bash
   eb init -p python-3.9 collectify
   ```

3. Create an environment:
   ```bash
   eb create collectify-env
   ```

4. Configure environment variables:
   ```bash
   eb setenv SECRET_KEY="your-secret-key" FLASK_ENV="production"
   ```

5. Deploy the application:
   ```bash
   eb deploy
   ```

## Security Considerations

When deploying to production, consider the following security measures:

1. **Use HTTPS**: Configure SSL/TLS for encrypted connections
2. **Secure Secrets**: Use environment variables or a secrets manager for sensitive information
3. **Database Security**: Use strong passwords and limit access to the database
4. **Regular Updates**: Keep dependencies and the application up to date
5. **Backup Strategy**: Implement regular backups of the database and uploads
6. **Monitoring**: Set up monitoring and alerting for application health

## Scaling Considerations

For larger deployments, consider these scaling options:

1. **Database**: Move from SQLite to PostgreSQL or MySQL
2. **Load Balancing**: Use a load balancer for distributing traffic across multiple instances
3. **Caching**: Implement Redis or Memcached for caching
4. **Content Delivery**: Use a CDN for static assets
5. **Container Orchestration**: Use Kubernetes for managing multiple containers
