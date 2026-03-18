# --- STAGE 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy only the backend package files first to leverage Docker caching
COPY backend/package*.json ./backend/

# Install dependencies inside the backend folder
RUN cd backend && npm install

# Copy the rest of the backend source code
COPY backend/ ./backend/

# --- STAGE 2: Run ---
FROM node:18-alpine

WORKDIR /app/backend

# Copy only the necessary files from the builder stage
COPY --from=builder /app/backend /app/backend

# Set the environment to production
ENV NODE_ENV=production

# Expose Port 5000 as confirmed by your server logs
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]