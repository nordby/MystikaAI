# Multi-stage build for MISTIKA Server
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Build stage
FROM base AS build
COPY . .
RUN npm ci
RUN npm run build || echo "No build script found"

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk upgrade --no-cache

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mistika -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=deps --chown=mistika:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=mistika:nodejs /app/src ./src
COPY --from=build --chown=mistika:nodejs /app/package*.json ./
COPY --from=build --chown=mistika:nodejs /app/.env.example ./.env.example

# Create necessary directories
RUN mkdir -p uploads logs backups && \
    chown -R mistika:nodejs uploads logs backups

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { \
        host: 'localhost', \
        port: process.env.PORT || 3001, \
        path: '/health', \
        timeout: 5000 \
    }; \
    const req = http.request(options, (res) => { \
        if (res.statusCode === 200) { \
            process.exit(0); \
        } else { \
            process.exit(1); \
        } \
    }); \
    req.on('error', () => process.exit(1)); \
    req.on('timeout', () => process.exit(1)); \
    req.end();"

# Switch to non-root user
USER mistika

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/app.js"]

# Labels for metadata
LABEL maintainer="MISTIKA Team"
LABEL version="1.0.0"
LABEL description="MISTIKA Tarot Server API"
LABEL org.opencontainers.image.source="https://github.com/your-org/mistika"
LABEL org.opencontainers.image.documentation="https://docs.mystika.systems.cv"
LABEL org.opencontainers.image.vendor="MISTIKA"
LABEL org.opencontainers.image.licenses="MIT"