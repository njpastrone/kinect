# Simplified Railway Dockerfile for Kinect
# This avoids workspace complexity and husky issues

FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ curl git

WORKDIR /app

# Build shared package
COPY shared/package*.json ./shared/
WORKDIR /app/shared
RUN npm ci --ignore-scripts
COPY shared/ ./
RUN npm run build

# Build backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --ignore-scripts
COPY backend/ ./
RUN npm run build

# Build frontend
WORKDIR /app/frontend-web
COPY frontend-web/package*.json ./
RUN npm ci --ignore-scripts
COPY frontend-web/ ./

# Set build args for frontend
ARG VITE_API_URL=/api
ARG VITE_SELF_HOSTED=true
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SELF_HOSTED=$VITE_SELF_HOSTED

RUN npm run build

# Production stage
FROM node:20-alpine

# Install runtime dependencies
RUN apk add --no-cache curl nginx

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S kinect -u 1001

WORKDIR /app

# Copy shared package
COPY --from=builder --chown=kinect:nodejs /app/shared/dist ./shared/dist
COPY --from=builder --chown=kinect:nodejs /app/shared/package.json ./shared/

# Copy backend
COPY --from=builder --chown=kinect:nodejs /app/backend/dist ./backend/dist
COPY --from=builder --chown=kinect:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=kinect:nodejs /app/backend/package.json ./backend/

# Copy frontend build
COPY --from=builder --chown=kinect:nodejs /app/frontend-web/dist ./frontend-web/dist

# Copy nginx config
COPY --chown=kinect:nodejs nginx.railway.conf /etc/nginx/nginx.conf

# Copy startup script
COPY --chown=kinect:nodejs scripts/railway-start.sh ./start.sh
RUN chmod +x ./start.sh

# Create required directories
RUN mkdir -p /app/uploads /app/backups /app/logs /tmp && \
    chown -R kinect:nodejs /app /tmp

# Switch to non-root user
USER kinect

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:$PORT/health || exit 1

# Start the app
CMD ["./start.sh"]