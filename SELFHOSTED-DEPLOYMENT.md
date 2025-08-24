# Kinect Self-Hosted - Privacy-First Deployment Guide

## 🔒 Philosophy

Kinect Self-Hosted is designed with privacy as the core principle:
- **100% Local**: All data stays on your device/network
- **No Cloud Dependencies**: Zero third-party API requirements
- **Open Source**: Fully auditable and customizable
- **Simple Setup**: One-command Docker deployment

---

## 🚀 Local Development Setup

> **⚠️ Important**: This guide covers local development setup. Automated deployment infrastructure is planned but not yet available.

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git
- MongoDB (if running natively)

### Clone and Setup

```bash
# Clone your repository
git clone <your-kinect-repo-url>
cd kinect

# Install dependencies
npm install

# Copy environment template
cp .env.selfhosted.example .env

# Start with Docker Compose
docker compose -f docker-compose.selfhosted.yml up -d
```

### Access Your Instance
Open browser to: `http://localhost:3000`

---

## 📦 Deployment Options

### Option 1: Docker Compose (Recommended)

Use the included Docker Compose configuration for local deployment.

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Local MongoDB database
  mongodb:
    image: mongo:7.0-jammy
    container_name: kinect-db
    restart: unless-stopped
    volumes:
      - ./data/db:/data/db
      - ./backups:/backups
    environment:
      - MONGO_INITDB_DATABASE=kinect
    networks:
      - kinect-network

  # Backend API
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.selfhosted
    container_name: kinect-api
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/kinect
      - JWT_SECRET=${JWT_SECRET:-auto-generated-on-first-run}
      - DATA_ENCRYPTION_KEY=${DATA_ENCRYPTION_KEY:-auto-generated}
      - SELF_HOSTED=true
      - ENABLE_TELEMETRY=false
    depends_on:
      - mongodb
    networks:
      - kinect-network
    volumes:
      - ./config:/app/config
      - ./imports:/app/imports

  # Frontend Web App
  frontend:
    build:
      context: ./frontend-web
      dockerfile: Dockerfile.selfhosted
    container_name: kinect-web
    restart: unless-stopped
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://backend:3001
      - VITE_SELF_HOSTED=true
    depends_on:
      - backend
    networks:
      - kinect-network

networks:
  kinect-network:
    driver: bridge
```

### Option 2: Native Development

For local development without Docker:

```bash
# Prerequisites installed: Node.js 18+, MongoDB 6.0+

# Install dependencies
npm install
cd backend && npm install
cd ../frontend-web && npm install
cd ../shared && npm install

# Configure environment
cp .env.selfhosted.example backend/.env
# Edit backend/.env with your settings

# Start MongoDB locally (macOS with Homebrew)
brew services start mongodb-community

# Start development servers
npm run dev:all
# Or separately:
# npm run dev:backend
# npm run dev:frontend
```

### Option 3: Build Production Images

Build your own Docker images for production deployment:

```bash
# Build backend image
docker build -f backend/Dockerfile.selfhosted -t kinect-backend:local .

# Build frontend image
docker build -f frontend-web/Dockerfile.selfhosted -t kinect-frontend:local .

# Use in custom docker-compose.yml
```

---

## 📱 Phone Data Integration

### Method 1: File Import (Simplest)

#### Contacts Import
Supports multiple formats with automatic detection:

```typescript
// Supported formats
- Google Contacts (CSV export)
- iPhone Contacts (.vcf/vCard)
- Android Contacts (CSV)
- Outlook/Exchange (CSV)
- Generic CSV with field mapping
```

**How to export contacts:**

**iPhone:**
1. Use Contacts app → Select All → Share → Save to Files
2. Or use iCloud.com → Contacts → Select All → Export vCard

**Android:**
1. Contacts app → Menu → Import/Export → Export to .vcf file
2. Google Contacts → More → Export → Google CSV

**Import in Kinect:**
1. Go to Settings → Import Data
2. Click "Import Contacts"
3. Select your export file
4. Review field mappings
5. Click Import

#### Call/Message Log Import

```typescript
// Android - SMS Backup & Restore
1. Install "SMS Backup & Restore" from Play Store
2. Backup calls/messages to XML
3. Import XML in Kinect

// iPhone - Requires backup extraction
1. Create iTunes/Finder backup
2. Use iMazing or iExplorer to extract call history
3. Export as CSV
4. Import in Kinect
```

### Method 2: Companion Sync App

Lightweight mobile app for automatic syncing over local WiFi:

```typescript
// React Native companion app features
- Connects to your self-hosted instance
- Syncs contacts and call logs
- Works only on local network
- No internet required
- Available on F-Droid and self-signed APK
```

**Setup:**
1. Install Kinect Sync from F-Droid
2. Scan QR code from web interface
3. Grant permissions for contacts/calls
4. Sync automatically when on same WiFi

### Method 3: Browser-Based Access (PWA)

Modern browsers can access some phone features:

```javascript
// Progressive Web App capabilities
- Install to home screen
- Access contacts (Chrome on Android)
- Local notifications
- Offline functionality
- Camera for QR scanning
```

---

## 🔐 Security & Privacy

### Data Encryption

All sensitive data is encrypted at rest:

```typescript
// Automatic encryption for:
- Contact phone numbers
- Personal notes
- Communication history
- User credentials

// Encryption configuration
{
  algorithm: 'aes-256-gcm',
  keyDerivation: 'pbkdf2',
  iterations: 100000,
  saltLength: 32
}
```

### Network Security

```nginx
# Nginx configuration for HTTPS (optional)
server {
    listen 443 ssl http2;
    server_name kinect.local;
    
    ssl_certificate /etc/nginx/ssl/self-signed.crt;
    ssl_certificate_key /etc/nginx/ssl/self-signed.key;
    
    # Only allow local network
    allow 192.168.0.0/16;
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    allow 127.0.0.1;
    deny all;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

### Backup & Recovery

Automated backup system:

```bash
# Backup script (runs daily via cron)
#!/bin/bash
# /scripts/backup.sh

BACKUP_DIR="/backups/kinect"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup MongoDB
docker exec kinect-db mongodump --out /backups/dump_${DATE}

# Backup uploaded files
tar -czf ${BACKUP_DIR}/files_${DATE}.tar.gz /data/uploads

# Encrypt backup (optional)
gpg --encrypt --recipient your@email.com ${BACKUP_DIR}/dump_${DATE}.tar.gz

# Keep only last 30 days
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +30 -delete
```

---

## 🛠️ Configuration

### Environment Variables

```bash
# .env.selfhosted
# Core Settings
NODE_ENV=production
PORT=3001
FRONTEND_PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/kinect
DB_ENCRYPTION=true

# Security
JWT_SECRET=generate-strong-secret-here
JWT_EXPIRE=7d
SESSION_SECRET=another-strong-secret
DATA_ENCRYPTION_KEY=32-character-encryption-key

# Features
ENABLE_TELEMETRY=false
ENABLE_ANALYTICS=false
ENABLE_ERROR_REPORTING=false
ALLOW_REGISTRATION=true
MAX_IMPORT_SIZE=50MB

# Local Network
BIND_ADDRESS=0.0.0.0  # Change to 127.0.0.1 for localhost only
CORS_ORIGIN=http://localhost:3000

# Notifications (local only)
ENABLE_DESKTOP_NOTIFICATIONS=true
NOTIFICATION_CHECK_INTERVAL=3600000  # 1 hour

# Import/Export
IMPORT_DIRECTORY=./imports
EXPORT_DIRECTORY=./exports
BACKUP_DIRECTORY=./backups
```

### Feature Flags

```javascript
// config/features.json
{
  "selfHosted": true,
  "cloudSync": false,
  "oauth": false,
  "pushNotifications": false,
  "emailNotifications": false,
  "phoneIntegration": "import",  // import | companion | none
  "analytics": false,
  "telemetry": false,
  "autoUpdate": true,
  "encryption": true,
  "localBackup": true
}
```

---

## 📲 Import Templates

### CSV Template for Contacts

```csv
# contacts_template.csv
Name,Phone,Email,Birthday,Category,Last Contact,Notes
John Doe,+1234567890,john@email.com,1990-01-15,Friend,2024-01-20,College friend
Jane Smith,+0987654321,jane@email.com,1985-05-20,Best Friend,2024-01-25,Work colleague
```

### JSON Template for Advanced Import

```json
{
  "version": "1.0",
  "contacts": [
    {
      "name": "John Doe",
      "phones": [
        {"type": "mobile", "number": "+1234567890", "primary": true}
      ],
      "emails": ["john@email.com"],
      "birthday": "1990-01-15",
      "category": "Friend",
      "lists": ["College Friends", "Sports Team"],
      "lastContact": "2024-01-20T10:30:00Z",
      "communicationLog": [
        {"date": "2024-01-20T10:30:00Z", "type": "call", "duration": 300}
      ]
    }
  ]
}
```

---

## 🔄 Update Process

### Automatic Updates

```bash
# Enable auto-update in docker-compose.yml
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 86400 kinect-web kinect-api
```

### Manual Updates

```bash
# Update script
#!/bin/bash
# /scripts/update.sh

echo "Backing up current data..."
./scripts/backup.sh

echo "Pulling latest version..."
docker-compose pull

echo "Stopping services..."
docker-compose down

echo "Starting updated services..."
docker-compose up -d

echo "Running migrations..."
docker exec kinect-api npm run migrate

echo "Update complete!"
```

---

## 🏠 Home Network Setup

### Local DNS (Optional)

Make Kinect accessible at `kinect.local`:

```bash
# Using Pi-hole or local DNS
# Add to /etc/hosts or DNS server
192.168.1.100  kinect.local
```

### Reverse Proxy with Tailscale

Access your instance securely from anywhere:

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Share Kinect on Tailnet
tailscale serve https / http://localhost:3000

# Access from any device on Tailnet
https://kinect.your-tailnet.ts.net
```

---

## 📊 System Requirements

### Minimum Requirements
- **CPU**: 1 core
- **RAM**: 512MB
- **Storage**: 1GB
- **OS**: Linux, macOS, Windows 10+, or Docker-capable NAS

### Recommended for 1000+ contacts
- **CPU**: 2 cores
- **RAM**: 2GB
- **Storage**: 5GB
- **Network**: Gigabit LAN for sync

---

## 🐛 Troubleshooting

### Common Issues

**Cannot connect to MongoDB:**
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Check logs
docker logs kinect-db

# Restart MongoDB
docker restart kinect-db
```

**Import fails with large files:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Or in Docker
environment:
  - NODE_OPTIONS=--max-old-space-size=4096
```

**Notifications not working:**
```javascript
// Check browser permissions
Notification.requestPermission().then(permission => {
  console.log('Permission:', permission);
});
```

---

## 🤝 Community

### Contributing
- GitHub: https://github.com/kinect/self-hosted
- Issues: Report bugs and request features
- Discussions: Share setups and tips

### Support Channels
- Documentation Wiki
- Discord Community
- Matrix Room: #kinect:matrix.org

### Export/Migration

Export your data anytime:

```bash
# Full export
docker exec kinect-api npm run export -- --format=json --output=/exports/full-backup.json

# Migrate to cloud version
1. Export data as JSON
2. Create account on cloud version
3. Import JSON file
4. All relationships and history preserved
```

---

## 📄 License

MIT License - Use freely, modify as needed, contribute back!

---

## 🎯 Roadmap

### Current Features
- ✅ Contact management
- ✅ Reminder system
- ✅ Import/Export
- ✅ Local notifications
- ✅ Docker deployment
- ✅ Data encryption

### Planned Features
- [ ] CalDAV/CardDAV sync
- [ ] WebDAV backup
- [ ] Nextcloud integration
- [ ] Home Assistant integration
- [ ] Telegram bot interface
- [ ] CLI management tool

---

## ⚡ Performance Tips

1. **Use SQLite for <100 contacts** - Lighter than MongoDB
2. **Enable Redis caching** for faster dashboards
3. **Use nginx** for static file serving
4. **Scheduled imports** during off-hours
5. **Periodic database cleanup** of old logs

---

This self-hosted version prioritizes your privacy while maintaining full functionality. No data ever leaves your control!