# Collectify Deployment Guide

This document describes the deployment architecture and setup for Collectify.

## Architecture

Collectify uses a split architecture for deployment:

1. **Frontend**: Static files deployed to Azure Static Web Apps
2. **Backend**: Python Flask API deployed to Azure App Service (Linux)

## Environment Configuration

### Frontend Environment Variables

The frontend uses the following environment variables:

- `REACT_APP_API_URL`: URL to the backend API 
  - Development: `http://localhost:5000/api`
  - Production: `https://collectify-backend.azurewebsites.net/api`

### Backend Environment Variables

The backend uses the following environment variables:

- `CORS_ORIGINS`: Comma-separated list of allowed CORS origins
  - Default: `https://black-sea-02a411d03.3.azurestaticapps.net,http://localhost:3000`

## Deployment Instructions

### Frontend Deployment

The frontend is deployed using GitHub Actions to Azure Static Web Apps. The workflow file is located at:
`.github/workflows/azure-static-web-apps-black-sea-02a411d03.yml`

The deployment process:
1. Builds the React application
2. Sets environment variables for the production build
3. Deploys the build output to Azure Static Web Apps

### Backend Deployment

The backend is deployed using GitHub Actions to Azure App Service (Linux). The workflow file is located at:
`.github/workflows/develop_collectify.yml`

The deployment process:
1. Sets up Python
2. Installs dependencies
3. Creates a zip package of the backend code
4. Deploys the zip package to Azure App Service

## Local Development

To run the application locally:

1. Start the backend:
   ```
   cd backend
   python app.py
   ```

2. Start the frontend:
   ```
   cd frontend
   npm start
   ```

The frontend will run on http://localhost:3000 and connect to the backend at http://localhost:5000/api.

## Troubleshooting

### CORS Issues

If you encounter CORS issues:
1. Ensure the frontend URL is listed in the `CORS_ORIGINS` environment variable on the backend
2. Check that the API URL in the frontend is correctly pointing to the backend
3. Verify the backend logs to see if CORS requests are being received

### Authentication Issues

If you encounter authentication issues:
1. Check the API URL in the frontend configuration
2. Ensure the JWT token is being properly passed in API requests
3. Verify the token refresh functionality is working correctly
