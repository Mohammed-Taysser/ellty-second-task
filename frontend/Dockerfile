# Use a lightweight Node image
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the frontend (Vite)
RUN yarn build

# Serve the built files using a lightweight server (e.g., serve)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the default port for nginx
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
