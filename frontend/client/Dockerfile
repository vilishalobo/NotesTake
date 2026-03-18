# --- Stage 1: Build the React/Vite app ---
FROM node:18-slim AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy code and build
COPY . .
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:stable-alpine

# Copy the 'dist' (Vite) or 'build' (CRA) folder to Nginx's html folder
# Note: Check if your build folder is named 'dist' or 'build'
COPY --from=build /app/client/dist /usr/share/nginx/html

# Expose port 80 (standard for web traffic)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]