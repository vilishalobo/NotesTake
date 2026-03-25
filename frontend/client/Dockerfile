# --- Stage 1: Build the React/Vite app ---
FROM node:18-slim AS build
WORKDIR /app

# 1. Install dependencies
# Since you are in 'client', package.json is right here
COPY package*.json ./
RUN npm install

# 2. Copy the rest of the source code
COPY . .

# 3. Build the project
# This creates /app/dist
RUN npm run build

# It prints every folder name so we can see where the files went
RUN ls -la /app

# # --- Stage 2: Serve with Nginx ---
# FROM nginx:stable-alpine

# # 4. Copy the build output
# # We point to /app/dist (no 'client' in the middle!)
# COPY --from=build /app/build /usr/share/nginx/html

# # 5. Expose port 80
# EXPOSE 5000

# CMD ["nginx", "-g", "daemon off;"]

# Stage 2: Serve
FROM nginx:stable-alpine
# Copy your custom config file
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy your build files
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]