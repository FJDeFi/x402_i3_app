# Use Node.js to run Express server
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Set environment variable for port
ENV PORT=8080

# Start the Express server
CMD ["npm", "start"]
