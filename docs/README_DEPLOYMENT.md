# Deployment Guide

## 🚀 Production Deployment Options

### Option 1: Render (Recommended for Production)

**Perfect for**: Production applications, automatic scaling, professional URLs

#### One-Click Deploy
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/njpastrone/kinect)

#### Manual Setup
1. **Create MongoDB Atlas Cluster**
   ```bash
   # Create free cluster at mongodb.com/atlas
   # Get connection string: mongodb+srv://user:pass@cluster.mongodb.net/kinect
   ```

2. **Deploy to Render**
   ```bash
   # Fork repository to your GitHub
   # Connect GitHub repo to Render
   # Use render.yaml blueprint for automatic setup
   ```

3. **Configure Environment Variables**
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kinect
   JWT_SECRET=your-super-secure-jwt-secret
   JWT_REFRESH_SECRET=your-super-secure-refresh-secret
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```

4. **Setup Email Service**
   ```bash
   # Gmail App Password (recommended)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```

#### Services Created
- **Backend API**: `kinect-api` (Node.js service)
- **Frontend**: `kinect-web` (Static site)
- **Automated Reminders**: Internal cron jobs (Daily email reminders at 9 AM UTC)

#### Monitoring
- **Health Checks**: `/health` endpoint monitoring
- **Logs**: Centralized logging in Render dashboard
- **Alerts**: Email notifications on deployment failures

---

### Option 2: Self-Hosted Docker

**Perfect for**: Complete control, self-hosting, cost optimization

#### Quick Start
```bash
# Clone repository
git clone https://github.com/njpastrone/kinect.git
cd kinect

# Start all services
docker compose -f docker-compose.selfhosted.yml up -d

# Access at http://localhost:3000
```

#### Services
- **Frontend**: Nginx + React (port 3000)
- **Backend**: Node.js/Express API
- **Database**: MongoDB with persistent storage
- **Monitoring**: Health check endpoints

#### Configuration
```yaml
# docker-compose.selfhosted.yml
services:
  kinect-web:
    build: 
      context: .
      dockerfile: frontend-web/Dockerfile.selfhosted
    ports:
      - "3000:80"
    depends_on:
      - kinect-api

  kinect-api:
    build: 
      context: .
      dockerfile: backend/Dockerfile.selfhosted
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://kinect-db:27017/kinect
    depends_on:
      - kinect-db

  kinect-db:
    image: mongo:latest
    volumes:
      - kinect-data:/data/db
```

#### Production Hardening
```bash
# SSL/TLS with Let's Encrypt
# Update nginx.selfhosted.conf with SSL configuration
# Setup automatic certificate renewal

# Backup Strategy
# Automated MongoDB backups
# Data volume snapshots
```

---

### Option 3: Manual VPS Deployment

**Perfect for**: Full control, custom configurations

#### Server Requirements
- **OS**: Ubuntu 20.04+ or similar
- **RAM**: 1GB minimum, 2GB recommended
- **Storage**: 10GB minimum
- **Node.js**: Version 18+
- **MongoDB**: Version 5.0+

#### Setup Process
```bash
# 1. Server Setup
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs npm mongodb nginx

# 2. Clone and Configure
git clone https://github.com/njpastrone/kinect.git
cd kinect
npm install
npm run build:all

# 3. Environment Configuration
cp .env.production.example .env
# Edit .env with production values

# 4. Process Management
npm install -g pm2
pm2 start backend/dist/app.js --name kinect-api
pm2 startup
pm2 save

# 5. Nginx Configuration
sudo cp scripts/nginx.production.conf /etc/nginx/sites-available/kinect
sudo ln -s /etc/nginx/sites-available/kinect /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. SSL Certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Core Configuration
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/kinect

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-64-chars-minimum
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-64-chars-minimum

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Email Service (for reminders)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
SMTP_FROM="Kinect <noreply@your-domain.com>"
```

### Optional Configuration

```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Session Configuration
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE=604800000    # 7 days

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
HEALTH_CHECK_TOKEN=your-health-check-token
```

---

## 📊 Database Setup

### MongoDB Atlas (Cloud)
```bash
# 1. Create account at mongodb.com/atlas
# 2. Create new cluster (free tier available)
# 3. Create database user
# 4. Whitelist IP addresses (0.0.0.0/0 for development)
# 5. Get connection string
```

### Self-Hosted MongoDB
```bash
# Installation
sudo apt install mongodb

# Configuration
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
> use kinect
> db.createUser({
    user: "kinect-admin",
    pwd: "secure-password",
    roles: ["readWrite"]
  })
```

---

## 📧 Email Service Setup

### Gmail (Recommended)
```bash
# 1. Enable 2-Factor Authentication
# 2. Generate App Password
#    - Google Account → Security → App passwords
#    - Select "Mail" → Generate
# 3. Use 16-character password in SMTP_PASS
```

### SendGrid (Alternative)
```bash
# 1. Create account at sendgrid.com
# 2. Create API key
# 3. Update environment:
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

---

## 🔍 Health Checks & Monitoring

### Health Check Endpoints
```bash
# Backend API Health
curl https://your-api-domain.com/health
# Expected: {"status":"OK","timestamp":"..."}

# Database Connection
curl https://your-api-domain.com/health/db
# Expected: {"status":"connected","response_time":"5ms"}
```

### Monitoring Setup
```bash
# Application Monitoring
# - Uptime monitoring (UptimeRobot, Pingdom)
# - Error tracking (Sentry)
# - Performance monitoring (New Relic)

# Infrastructure Monitoring
# - Server metrics (CPU, memory, disk)
# - Database metrics (connections, queries)
# - Network metrics (response times, errors)
```

### Log Management
```bash
# Production Logs Location
# Docker: docker logs kinect-api
# PM2: pm2 logs kinect-api
# Systemd: journalctl -u kinect-api

# Log Rotation
# Automatic rotation configured for production
# Retain 30 days of logs by default
```

---

## 🚨 Troubleshooting

### Common Deployment Issues

**Port conflicts:**
```bash
# Check port usage
sudo netstat -tulpn | grep :3001
sudo lsof -i :3001

# Kill conflicting processes
sudo kill -9 $(sudo lsof -t -i:3001)
```

**Database connection issues:**
```bash
# Test MongoDB connection
mongo "mongodb://user:pass@host:port/database"

# Check MongoDB service
sudo systemctl status mongodb
```

**SSL Certificate issues:**
```bash
# Test certificate
openssl s_client -connect your-domain.com:443

# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
```

### Performance Optimization
```bash
# Node.js Process Optimization
NODE_OPTIONS="--max-old-space-size=1024"
PM2_INSTANCES=2

# Database Indexing
# Ensure proper indexes are created for queries
# Monitor slow queries and optimize

# Nginx Optimization
# Enable gzip compression
# Set up caching headers
# Optimize buffer sizes
```

---

## 🔄 Backup & Recovery

### Database Backup
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="/backups/$DATE"
tar -czf "/backups/kinect_backup_$DATE.tar.gz" "/backups/$DATE"
rm -rf "/backups/$DATE"

# Schedule with cron
0 2 * * * /path/to/backup-script.sh
```

### Application Backup
```bash
# Code backup (version controlled via Git)
git push origin main

# Environment and configuration backup
tar -czf config_backup.tar.gz .env nginx.conf pm2.json

# Media and uploads backup
tar -czf uploads_backup.tar.gz public/uploads/
```

### Disaster Recovery
```bash
# Complete restoration process
# 1. Restore application code from Git
# 2. Restore database from backup
# 3. Restore configuration files
# 4. Update DNS if needed
# 5. Test all functionality
```

---

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balancer configuration (Nginx, HAProxy)
- Database replication setup
- Session store externalization (Redis)
- File storage separation (S3, CDN)

### Performance Optimization
- Database query optimization
- Application-level caching
- CDN setup for static assets
- Image optimization and compression

### Cost Optimization
- Resource monitoring and right-sizing
- Automated scaling policies
- Reserved instance pricing
- Database connection pooling