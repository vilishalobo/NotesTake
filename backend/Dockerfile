# Use a stable Node.js version
FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install --production

# Copy the rest of your backend code
COPY . .

# Expose the port your app runs on (usually 5000 for APIs)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
