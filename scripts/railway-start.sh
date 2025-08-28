#!/bin/sh

# Railway startup script for Kinect
# Handles Railway's specific environment and port binding

set -e

echo "🚂 Starting Kinect on Railway..."

# Set default port if not provided by Railway
export PORT=${PORT:-3000}
export NODE_ENV=production

# Railway-specific environment setup
echo "📋 Environment Configuration:"
echo "  - Port: $PORT"
echo "  - Node Environment: $NODE_ENV"

# Handle both DATABASE_URL (Railway MongoDB) and MONGODB_URI (manual config)
if [ -n "$DATABASE_URL" ]; then
    export MONGODB_URI=$DATABASE_URL
    echo "  - Database: $DATABASE_URL (Railway MongoDB)"
elif [ -n "$MONGODB_URI" ]; then
    echo "  - Database: $MONGODB_URI (Manual config)"
else
    echo "  - Database: ❌ Not configured - add MongoDB service in Railway"
    echo "  - Note: The app will start but won't work without a database"
fi

# Substitute PORT in nginx config (Railway provides dynamic port)
# Create nginx config in user-writable location using our template
envsubst '${PORT}' < /app/nginx.conf.template > /tmp/nginx.conf

# Start nginx in background with custom config
echo "🌐 Starting nginx..."
nginx -c /tmp/nginx.conf &
NGINX_PID=$!

# Wait for nginx to start
sleep 2

# Start backend API
echo "🔧 Starting backend API..."
cd /app/backend
node dist/app.js &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to be ready..."
timeout=30
while ! curl -s http://localhost:3001/health > /dev/null; do
    sleep 1
    timeout=$((timeout-1))
    if [ $timeout -eq 0 ]; then
        echo "❌ Backend failed to start within 30 seconds"
        exit 1
    fi
done

echo "✅ Backend is ready"

# Function to handle shutdown
cleanup() {
    echo "🛑 Shutting down services..."
    kill $NGINX_PID 2>/dev/null || true
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

echo "🎉 Kinect is running!"
echo "📡 Frontend available on port $PORT"
echo "🔌 Backend API available at /api"

# Keep the script running and wait for signals
wait