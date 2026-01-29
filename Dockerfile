# Multi-stage Dockerfile for Civic Notices Production Deployment

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend with production optimizations
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Install build tools for native dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for building)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build:server || true

# Remove dev dependencies
RUN npm prune --production

# Stage 3: Production image
FROM node:20-alpine

# Install production dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built frontend from stage 1
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist

# Copy backend and dependencies from stage 2
COPY --from=backend-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/server ./server
COPY --from=backend-builder --chown=nodejs:nodejs /app/package*.json ./

# Copy necessary scripts and configs
COPY --chown=nodejs:nodejs ralph-fix-database.sh ./
COPY --chown=nodejs:nodejs monitoring ./monitoring

# Make scripts executable
RUN chmod +x ralph-fix-database.sh
RUN chmod +x monitoring/*.sh || true

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 5173 5174

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5174/api/health || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start both frontend and backend
CMD ["sh", "-c", "npm run preview & npm run start:server"]