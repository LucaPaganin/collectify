# Collectify

Collectify is a web application designed to help you organize, manage, and view your collections efficiently. Built using Python (Flask), React, and Docker, Collectify provides a modern, user-friendly interface for collection management.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker](#quick-start-with-docker)
- [Configuration](#configuration)
- [Development](#development)
- [Logging](#logging)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Features

- Add, edit, and delete items in your collection.
- Rich web interface with search and filter functionality.
- Responsive design for desktop and mobile.
- Data export and import options (e.g., CSV, JSON).
- User authentication with JWT tokens for API security.
- Role-based access control (admin vs regular users).
- Customizable categories, tags, and properties.
- Comprehensive error logging with automatic log rotation.

---

## Prerequisites

- **Docker:**  
  Make sure Docker is installed on your system.  
  [Get Docker](https://docs.docker.com/get-docker/)

- (Optional) **Node.js & Python:**  
  Required only if you plan to run the application locally without Docker.

---

## TL;DR

If you just want to get started quickly, you can use the Docker Compose setup. This will start the frontend and backend containers, and you can access the application at `http://localhost:80`. The steps are
- create .env file in the repo folder copying .env.example
- run `docker-compose up -d --build`
- after the command finishes, open http://localhost:80 in your browser
- login with username `admin` and password `password`

## Quick Start with Docker

The recommended way to run Collectify is via Docker. This isolates dependencies and makes setup easy.

### 1. Clone the Repository

```bash
git clone https://github.com/LucaPaganin/collectify.git
cd collectify
```

### 2. Run with Docker Compose

```bash
docker-compose up -d --build
```

- The frontend will be available at [http://localhost:80](http://localhost:80).
- The backend API will be available at [http://localhost:5000](http://localhost:5000).

### 3. Authentication

The application includes a secure authentication system:

- Default admin credentials:
  - Username: `admin`
  - Password: `password`

---

## Configuration

- **Environment Variables:**
  - Copy `.env.example` to `.env` and configure as needed.
    ```bash
    cp .env.example .env
    ```
  - Key environment variables:
    - `SECRET_KEY`: Used for JWT token encryption.
    - `ADMIN_PASSWORD`: Custom password for admin user.
    - `FLASK_ENV`: Set to "development" or "production".

---

## Development

### Project Structure
- **Frontend**: React application in `frontend/`
- **Backend**: Flask application in `backend/`
- **Database**: SQLite (default), data stored in `backend/instance/` or `backend/data/` depending on config.

### Running Locally

#### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # Linux/Mac
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the application:
   ```bash
   python app.py
   ```
   The backend API runs on `http://localhost:5000`.

#### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
   The application runs on `http://localhost:3000`.

### HTTPS Setup
For local development, especially when testing features requiring secure contexts (like camera access), see the [HTTPS Setup Guide](docs/https-setup.md).

---

## Logging

Collectify includes a comprehensive logging system.

- **Log Location:** `backend/logs/collectify.log`
- **Log Rotation:** Automatic rotation at 10MB.
- **Log Format:** `YYYY-MM-DD HH:MM:SS,sss LEVEL: Message [in file_path:line_number]`

---

## Troubleshooting

- **Docker Build Issues:**  
  Ensure Docker is running and you have internet access.
- **App Not Starting:**  
  Check container logs: `docker-compose logs -f`.
- **Database Issues:**  
  Verify `.env` configuration.

---

## Contributing

Contributions are welcome! Please submit a pull request or open an issue.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Contact

For questions or support, open an issue on GitHub.
