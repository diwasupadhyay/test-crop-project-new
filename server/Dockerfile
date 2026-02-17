FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy source files
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
