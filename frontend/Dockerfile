# Frontend Dockerfile for Collectify
FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy frontend source code
COPY public ./public
COPY src ./src

# Expose port 3000 for the dev server
EXPOSE 3000

# Start the development server
CMD ["npm", "start"]
