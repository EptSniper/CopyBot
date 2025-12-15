FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend code
COPY backend/pg ./backend/pg
COPY .env* ./

WORKDIR /app/backend/pg

# Run migrations then start server
CMD ["sh", "-c", "node migrate.js && node server.js"]
