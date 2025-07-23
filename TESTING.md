# Collectify Testing Guide

This document explains how to run the test suite for the Collectify application.

## Test Coverage

The test suite covers the following components:

- Database models (Category, Item, ItemPhoto, ItemUrl, CategorySpecification)
- API endpoints for categories and items
- Frontend routes
- Authentication mechanisms
- Utility functions

## Setup

Before running the tests, make sure to install the required testing dependencies:

```bash
pip install -r requirements-test.txt
```

## Running Tests

### Run All Tests

To run the entire test suite with coverage reporting:

```bash
pytest
```

This will run all tests and generate a coverage report.

### Run Specific Tests

To run tests from a specific file:

```bash
pytest tests/test_models.py
```

To run a specific test function:

```bash
pytest tests/test_models.py::test_category_creation
```

### Test Categories

- Model Tests: Tests for database models and relationships
- API Tests: Tests for the API endpoints
- Frontend Tests: Tests for the frontend routes
- Utility Tests: Tests for utility functions

## Coverage Reports

The test suite is configured to generate coverage reports in both terminal and HTML formats:

- Terminal report: Displayed after running the tests
- HTML report: Generated in the `htmlcov` directory

To view the HTML coverage report:

1. Run the tests with `pytest`
2. Open `htmlcov/index.html` in a web browser

## Continuous Integration

The test suite is designed to run in CI environments. Key configurations:

- Tests use an in-memory SQLite database
- File operations are isolated to a temporary directory
- No external services are required

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all dependencies are installed with `pip install -r requirements-test.txt`

2. **Database Errors**: If you see database-related errors, check if any tests are modifying the real database instead of the test database

3. **File Permission Issues**: If you see file permission errors in the tests that involve file uploads, check the permissions of your temp directory

### Debugging Tests

For more verbose output when running tests:

```bash
pytest -v
```

For even more detailed debugging information:

```bash
pytest -vv --capture=no
```

## Extending the Test Suite

When adding new features to the application:

1. Create corresponding test files in the `tests` directory
2. Follow the existing test patterns
3. Run the full test suite to ensure no regressions

## Test Environment

The tests use:

- In-memory SQLite database
- Temporary file storage for uploads
- Mocked authentication
