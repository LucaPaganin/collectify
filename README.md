# Collectify

A Flask application for managing collections of items with customizable specifications by category.

## Docker Setup

### Prerequisites
- Docker and Docker Compose installed on your system

### Running with Docker Compose
* Pull the image from github
  ```bash
  docker pull lucaplawliet/collectify-web
  ```

* Build and start the containers:
   ```bash
   docker-compose up -d
   ```

* Access the application:
   - Main page: http://localhost:5000
   - Admin panel: http://localhost:5000/admin.html
     - Username: admin
     - Password: password

* Stop the containers:
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
=======
Collectify is a web application designed to help you organize, manage, and view your collections efficiently. Built using Python (Flask/Django), HTML, JavaScript, and CSS, Collectify provides a modern, user-friendly interface for collection management.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Configuration](#configuration)
- [Manual Installation (Advanced)](#manual-installation-advanced)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- Add, edit, and delete items in your collection.
- Rich web interface with search and filter functionality.
- Responsive design for desktop and mobile.
- Data export and import options (e.g., CSV, JSON).
- User authentication (optional, if enabled).
- Customizable categories, tags, and properties.

---

## Prerequisites

- **Docker:**  
  Make sure Docker is installed on your Linux PC.  
  [Get Docker for Linux](https://docs.docker.com/engine/install/)

- (Optional) **Docker Compose:**  
  For managing multi-container setups (if required by your configuration).

---

## Quick Start with Docker

The recommended way to run Collectify is via Docker. This isolates dependencies and makes setup easy across different Linux systems.

### 1. Clone the Repository

```bash
git clone https://github.com/LucaPaganin/collectify.git
cd collectify
```

### 2. Build the Docker Image

```bash
docker build -t collectify:latest .
```

### 3. Run the Container

```bash
docker run -d \
  --name collectify \
  -p 5000:5000 \
  --env-file .env \
  collectify:latest
```

- The app will be available at [http://localhost:5000](http://localhost:5000).
- Adjust port mapping or volumes as needed for your environment.
- If you need to persist data, map volumes to host directories (see below).

#### Example: Running with Data Persistence

```bash
docker run -d \
  --name collectify \
  -p 5000:5000 \
  --env-file .env \
  -v $PWD/data:/app/data \
  collectify:latest
```
> This maps the container's `/app/data` directory to your local `./data` folder (change as needed based on where the app stores its data).

### 4. Stopping and Removing the Container

```bash
docker stop collectify
docker rm collectify
```

---

## Configuration

- **Environment Variables:**
  - Copy `.env.example` to `.env` and configure as needed.
    ```bash
    cp .env.example .env
    ```
  - Edit `.env` with your favorite editor.

---

## Manual Installation (Advanced)

If you prefer not to use Docker, you can run Collectify natively as follows:

1. **Set up Python and dependencies:**  
   See the original instructions in the previous README version.

2. **Install system and Python dependencies, configure environment, and run via Flask or Django.**

> **Note:** Direct/manual setup is only recommended for development or advanced users.

---

## Development

- To make code changes, you may mount your source code into the container at runtime:

  ```bash
  docker run -it --rm \
    -v $PWD:/app \
    -p 5000:5000 \
    --env-file .env \
    collectify:latest
  ```

- For frontend development, you may need to run npm commands inside the container or in your host environment.

---

## Troubleshooting

- **Docker Build Issues:**  
  Make sure your Docker version is up to date and you have network access for dependency downloads.
- **App Not Starting:**  
  Check container logs with `docker logs collectify`.
- **Database Issues:**  
  Confirm your database settings in `.env` and that any mapped data volumes are writable.

---

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to discuss proposed changes or report bugs.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Contact

For questions or support, open an issue on GitHub or contact the repository maintainer.
