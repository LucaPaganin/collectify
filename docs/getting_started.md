# Getting Started with Collectify

This guide will help you set up your development environment and start working with Collectify.

## Prerequisites

- Python 3.9+ (for backend)
- Node.js 14+ (for frontend)
- SQL database (SQLite for development, PostgreSQL for production)
- Git

## Installation

### Clone the Repository

```bash
git clone https://github.com/LucaPaganin/collectify.git
cd collectify
```

### Backend Setup

1. Create and activate a virtual environment:

```bash
cd backend
python -m venv .venv
# On Windows
.venv\Scripts\activate
# On Unix/MacOS
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up the database:

```bash
python flask_cli.py init-db
```

4. Run the development server:

```bash
python flask_cli.py run
```

The backend API will be available at http://localhost:5000.

### Frontend Setup

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

The frontend development server will be available at http://localhost:3000.

## Docker Setup (Alternative)

For a simpler setup, you can use Docker:

```bash
docker-compose up -d
```

This will start both the backend and frontend services, with the application accessible at http://localhost:5000.

## Development Workflow

1. Make your code changes
2. Run tests:
   - Backend: `cd backend && python -m pytest`
   - Frontend: `cd frontend && npm test`
3. Submit a pull request following the [Git Workflow](developer_guides/git_workflow.md)

## Configuration

Configuration options are stored in:
- Backend: `backend/config.py`
- Frontend: `frontend/src/config.js`

See the [Configuration Documentation](backend/configuration.md) for more details.

## Next Steps

- Review the [Backend Architecture](backend/architecture.md)
- Explore the [Frontend Structure](frontend/structure.md)
- Learn about [Adding New Features](developer_guides/adding_features.md)
