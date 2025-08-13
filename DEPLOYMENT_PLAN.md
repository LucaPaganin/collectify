# Collectify Azure Deployment Plan

## Overview

We've reconfigured the Collectify application to use a modern split architecture approach:

1. **Frontend** - Deployed to Azure Static Web Apps
2. **Backend** - Deployed to Azure App Service (Linux)

This approach offers several benefits:
- Better performance for serving static content
- Improved security with automatic HTTPS
- Simpler configuration for each component
- Better scalability options

## Changes Made

### 1. Frontend Configuration

- Created a config.js file to centralize environment configuration
- Updated authUtils.js to use the centralized configuration
- Set up .env.production with the backend API URL
- Configured the Static Web Apps workflow to provide environment variables

### 2. Backend Configuration

- Added CORS support with Flask-CORS package
- Configured CORS to allow requests from the Static Web App domain
- Added environment variables for CORS configuration
- Updated the backend deployment workflow to exclude frontend files

### 3. Deployment Workflows

- Updated the Static Web Apps workflow to include environment variables
- Modified the App Service workflow to focus only on backend deployment
- Removed frontend building from the backend workflow
- Added CORS configuration to backend environment settings

## Next Steps

1. **Repository Secrets:**
   - Add a `JWT_SECRET_KEY` secret in your GitHub repository

2. **Azure Configuration:**
   - Ensure the backend App Service is properly configured
   - Set the correct URL in the frontend environment variables

3. **Testing:**
   - Test authentication flows to ensure the API communication works
   - Verify CORS is properly configured
   - Test file uploads and database operations

## Rollback Plan

If issues are encountered with the new architecture:

1. Revert to using the combined deployment approach by:
   - Restoring the original workflow file
   - Re-enabling frontend building in the backend workflow
   - Reverting authUtils.js to use relative API paths

## Contact Information

If you encounter any issues with this deployment setup, please reach out to your development team for assistance.
