# Multi-stage Dockerfile for VoxForm AI
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root and client package files
COPY package.json ./
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copy client source code and build
COPY client/ ./client/
RUN cd client && npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy root and server package files
COPY package.json ./
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy server code
COPY server/ ./server/

# Copy built frontend from builder stage
COPY --from=builder /app/client/dist ./client/dist

# Expose port (default 5000 or $PORT on Render/Cloud Run)
EXPOSE 5000

# Start server
CMD ["node", "server/src/index.js"]
