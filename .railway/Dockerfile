# Railway-specific Dockerfile to force Node 20
# This file takes precedence over Dockerfile.railway

FROM node:20-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git python3 make g++ curl

# Disable husky git hooks in Docker environment
ENV HUSKY=0

# Copy root package files and TypeScript config
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy and build shared package first
COPY shared/ ./shared/
RUN cd shared && npm ci --ignore-scripts && npm run build

# Build backend
COPY backend/ ./backend/
RUN cd backend && npm ci --ignore-scripts && npm run build

# Build frontend
COPY frontend-web/ ./frontend-web/
RUN cd frontend-web && npm ci --ignore-scripts

# Set build-time environment variables for frontend build
ARG VITE_API_URL=/api
ARG VITE_SELF_HOSTED=true
ARG VITE_RAILWAY_DEPLOYMENT=true

RUN cd frontend-web && npm run build

# Production stage
FROM node:20-alpine AS production

# Install production system dependencies
RUN apk add --no-cache curl nginx gettext

# Disable husky git hooks in production
ENV HUSKY=0

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S kinect -u 1001

# Set working directory
WORKDIR /app

# Copy built shared package
COPY --from=base --chown=kinect:nodejs /app/shared/dist ./shared/dist
COPY --from=base --chown=kinect:nodejs /app/shared/package.json ./shared/

# Copy built backend with dependencies
COPY --from=base --chown=kinect:nodejs /app/backend ./backend

# Copy built frontend
COPY --from=base --chown=kinect:nodejs /app/frontend-web/dist ./frontend-web/dist

# Copy Railway-specific nginx configuration
COPY nginx.railway.conf /etc/nginx/nginx.conf

# Copy startup script
COPY scripts/railway-start.sh ./start.sh
RUN chmod +x ./start.sh && chown kinect:nodejs ./start.sh

# Create necessary directories
RUN mkdir -p /app/uploads /app/backups /app/logs && \
    chown -R kinect:nodejs /app/uploads /app/backups /app/logs

# Switch to non-root user
USER kinect

# Expose Railway's dynamic port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# Start the application
CMD ["./start.sh"]