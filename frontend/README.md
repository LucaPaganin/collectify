# Collectify Frontend

This project is the frontend for the Collectify application.

## Environment Configuration

The application can be configured using environment variables. The following environment variables are supported:

- `REACT_APP_API_URL`: The URL of the API server (default: `/api`)

### Environment Files

- `.env`: Default environment configuration for development
- `.env.production`: Environment configuration for production builds
- `.env.build`: Environment configuration for Docker builds

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### `npm run build`

Builds the app for production using the `.env` or `.env.production` settings.

### `npm run build:docker`

Builds the app for production using the Docker-specific settings from `.env.build`.

### `npm run build:prod`

Builds the app for production using the production settings from `.env.production`.

## Docker Configuration

The frontend can be deployed as a Docker container. The Dockerfile builds a production-ready Nginx server with the React application. 

### Environment Variables for Docker

- `API_URL`: The URL of the API server for Nginx to proxy requests to

## Deployment

For deployment to Azure or other environments, make sure to:

1. Set the appropriate environment variables
2. Build the application using the correct build script
3. Deploy the resulting build directory or Docker container
