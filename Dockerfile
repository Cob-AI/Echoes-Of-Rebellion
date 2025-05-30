# Stage 1: Build the React application using Vite
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy all your project source code into the container
COPY . .

# This ARG will receive the API key from Cloud Build at build time
ARG API_KEY_ARG

# Set the API key as an environment variable for the build process
ENV VITE_GEMINI_API_KEY=$API_KEY_ARG

# Run Vite build (npm run build)
# Vite will use VITE_GEMINI_API_KEY from the environment
RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:alpine

# Copy the entire 'dist' folder (created by npm run build) to Nginx's web server directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]