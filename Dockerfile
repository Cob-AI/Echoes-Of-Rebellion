# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app

# Install esbuild (used for building your .tsx file)
RUN npm install -g esbuild

# Copy all your project files into the container
COPY . .

# This ARG will receive the API key from Cloud Build at build time
ARG API_KEY_ARG

# Run esbuild to bundle index.tsx into bundle.js
# It replaces process.env.API_KEY with the actual key value.
# Dependencies handled by the import map in index.html are marked as external.
RUN esbuild index.tsx --bundle --outfile=dist/bundle.js \
    --define:process.env.API_KEY="\"$API_KEY_ARG\"" \
    --loader:.ts=tsx \
    --platform=browser \
    --format=esm \  # <--- ADD THIS LINE
    --external:react \
    --external:react-dom \
    --external:@google/genai

# Copy the essential HTML and JSON files to the dist folder
COPY index.html dist/index.html
COPY metadata.json dist/metadata.json
# If you have other static assets (e.g., images in a /public folder), copy them too:
# COPY public/ dist/public/

# Stage 2: Serve the built application with Nginx
FROM nginx:alpine

# Copy the built static files from the builder stage to Nginx's web server directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx will serve on port 80 by default
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
