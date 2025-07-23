# Makefile for Collectify project

# Variables
PYTHON = python
PIP = pip
FLASK = flask
PYTEST = pytest
COVERAGE = coverage
FLASK_APP = app.py
GUNICORN = gunicorn

# Default target
.PHONY: help
help:
	@echo "Collectify Make Commands:"
	@echo "-----------------------"
	@echo "make install         - Install dependencies"
	@echo "make install-dev     - Install development dependencies"
	@echo "make setup-db        - Set up the database and uploads directory"
	@echo "make run             - Run the application with Flask"
	@echo "make run-debug       - Run the application with Flask in debug mode"
	@echo "make run-direct      - Run the application directly with Python"
	@echo "make run-prod        - Run the application with Gunicorn (production)"
	@echo "make gunicorn        - Run the application with Gunicorn directly"
	@echo "make gunicorn-daemon - Run Gunicorn as a background process"
	@echo "make test            - Run tests"
	@echo "make test-verbose    - Run tests with verbose output"
	@echo "make test-file       - Run tests from a specific file (usage: make test-file FILE=test_models.py)"
	@echo "make coverage        - Generate test coverage report"
	@echo "make coverage-html   - Generate HTML test coverage report"
	@echo "make lint            - Run linters"
	@echo "make clean           - Clean up files"

# Installation
install:
	$(PIP) install -r requirements.txt

install-dev:
	$(PIP) install -r requirements-test.txt

setup-db:
	@echo "Creating data directory if it doesn't exist..."
	@mkdir -p data/uploads
	$(PYTHON) init_db.py

# Running the app
run:
	$(FLASK) run

run-debug:
	$(FLASK) run --debug

run-direct:
	@echo "Running Collectify directly with Python..."
	$(PYTHON) $(FLASK_APP)

run-prod:
	@echo "Starting Collectify with Gunicorn production server..."
	$(GUNICORN) --config gunicorn_config.py app:app

gunicorn:
	$(GUNICORN) --bind=0.0.0.0:8000 app:app

gunicorn-daemon:
	$(GUNICORN) --bind=0.0.0.0:8000 --daemon app:app

gunicorn-stop:
	@echo "Stopping Gunicorn processes..."
	pkill gunicorn || echo "No Gunicorn processes found"

# Testing
test:
	$(PYTEST)

test-verbose:
	$(PYTEST) -vv

test-file:
	$(PYTEST) tests/$(FILE) -v

coverage:
	$(PYTEST) --cov=. --cov-report=term

coverage-html:
	$(PYTEST) --cov=. --cov-report=html

# Code quality
lint:
	pylint app.py models.py routes

format:
	black .

isort:
	isort .

check: lint format

# Database management
migrate:
	$(PYTHON) scripts/migrate_specifications.py

backup-db:
	@echo "Creating database backup..."
	@mkdir -p backups
	@cp data/collectibles.db backups/collectibles_$(shell date +%Y%m%d_%H%M%S).db
	@echo "Backup created in backups/ directory"

# Cleanup
clean-pyc:
	find . -name '*.pyc' -delete
	find . -name '*.pyo' -delete
	find . -name '__pycache__' -type d -exec rm -rf {} +

clean-test:
	rm -rf .pytest_cache
	rm -rf htmlcov
	rm -rf .coverage

clean-all: clean-pyc clean-test
	rm -rf dist
	rm -rf build
	rm -rf *.egg-info
	rm -rf data/test_*

clean: clean-pyc clean-test
