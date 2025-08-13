# Frontend Dockerfile for Collectify
FROM node:20-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy frontend source code
COPY public ./public
COPY src ./src
COPY .env* ./

# Build the production app
RUN npm run build

# Production environment
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for the production server
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
