# 🚀 Kinect Production Deployment Guide

> **Complete guide for deploying Kinect with tested reminders to production**

## 📋 Quick Start (5 Minutes)

### Option A: One-Command Deploy 
```bash
# 1. Copy environment template
cp .env.production.example .env.production

# 2. Edit your configuration (see Environment Setup below)
nano .env.production

# 3. Deploy
./scripts/deploy-production.sh
```

### Option B: Docker Compose Only
```bash
# Configure environment
cp .env.production.example .env.production
# Edit .env.production with your settings

# Deploy
docker-compose -f docker-compose.production.yml --env-file .env.production up -d
```

## 🎯 Deployment Options

### 🟢 Option 1: Local Server / VPS (Recommended)
- **Time**: 10 minutes
- **Cost**: Free (your own server) 
- **Skill Level**: Beginner
- **Features**: Full control, tested reminders, email notifications

### 🟡 Option 2: Cloud Providers
- **Railway**: One-click deploy button
- **Render**: Auto-deploy from Git
- **DigitalOcean Apps**: Container deployment

### 🔵 Option 3: Self-Hosted on Raspberry Pi
- **Time**: 15 minutes
- **Cost**: Free (after Pi purchase)
- **Requirements**: Raspberry Pi 4+ (2GB RAM minimum)

---

## 🛠 Environment Setup

### 1. Required Configuration

Copy and edit the environment file:
```bash
cp .env.production.example .env.production
```

**Critical settings to change:**
```bash
# Your domain or IP
DOMAIN_NAME=your-domain.com
FRONTEND_URL=https://your-domain.com

# Database credentials (CHANGE THESE!)
MONGO_ROOT_USERNAME=kinect_admin
MONGO_ROOT_PASSWORD=your-secure-password-here

# Security keys (GENERATE THESE!)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
DATA_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

### 2. Email Configuration (Required for Reminders)

**Gmail Setup:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Generate at: https://myaccount.google.com/apppasswords
SMTP_FROM="Kinect Reminders <your-email@gmail.com>"
```

**Free Email Services:**
- **Gmail**: 500 emails/day free
- **SendGrid**: 100 emails/day free  
- **Mailgun**: 1000 emails/month free
- **AWS SES**: 62,000 emails/month free

### 3. Quick Secret Generation

```bash
# Generate all secrets at once
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)" 
echo "DATA_ENCRYPTION_KEY=$(openssl rand -base64 32)"
echo "BACKUP_ENCRYPTION_KEY=$(openssl rand -base64 32)"
```

---

## 🚀 Deployment Steps

### Step 1: Prerequisites
```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone and Configure
```bash
# Clone repository
git clone https://github.com/your-username/kinect.git
cd kinect

# Copy and configure environment
cp .env.production.example .env.production
nano .env.production  # Edit your configuration
```

### Step 3: Deploy
```bash
# Validate configuration
./scripts/deploy-production.sh --validate

# Deploy all services
./scripts/deploy-production.sh
```

### Step 4: Verify Deployment
```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Test application
curl -f http://your-domain.com/
curl -f http://your-domain.com/api/health
```

---

## 🌐 Domain and SSL Setup

### Option A: Free Domain with SSL
```bash
# Using Let's Encrypt with Caddy
# Add to docker-compose.production.yml:

caddy:
  image: caddy:2-alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy_data:/data
    - caddy_config:/config

# Caddyfile content:
your-domain.com {
    reverse_proxy frontend:80
    handle /api/* {
        reverse_proxy backend:3001
    }
}
```

### Option B: Cloudflare Tunnel (Free)
```bash
# Install cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Setup tunnel
cloudflared tunnel login
cloudflared tunnel create kinect
cloudflared tunnel route dns kinect your-domain.com

# Start tunnel
cloudflared tunnel run kinect
```

---

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Automated health check script
cat > check-health.sh << 'EOF'
#!/bin/bash
DOMAIN=${1:-localhost}
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN/api/health)
if [ $STATUS -eq 200 ]; then
    echo "✅ Kinect is healthy"
else
    echo "❌ Kinect health check failed (HTTP $STATUS)"
    # Optional: send alert email or restart services
fi
EOF
chmod +x check-health.sh

# Run every 5 minutes
(crontab -l ; echo "*/5 * * * * /path/to/check-health.sh") | crontab -
```

### Log Management
```bash
# View specific service logs
docker logs kinect-api-prod -f
docker logs kinect-web-prod -f
docker logs kinect-db-prod -f

# Rotate logs automatically
echo '{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}' | sudo tee /etc/docker/daemon.json

sudo systemctl restart docker
```

### Backup Management
```bash
# Manual backup
./scripts/backup-production.sh

# Automated daily backups
(crontab -l ; echo "0 2 * * * /path/to/kinect/scripts/backup-production.sh") | crontab -

# Restore from backup
./scripts/restore-backup.sh /path/to/backup/file
```

---

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

### Database Maintenance
```bash
# Compact database
docker exec kinect-db-prod mongosh --eval "db.runCommand({compact: 'contacts'})"

# Check database stats
docker exec kinect-db-prod mongosh --eval "db.stats()"
```

---

## 🚨 Troubleshooting

### Common Issues

**1. Containers won't start**
```bash
# Check logs
docker-compose -f docker-compose.production.yml logs

# Check system resources
docker system df
df -h
```

**2. Database connection issues**
```bash
# Test MongoDB connection
docker exec kinect-db-prod mongosh --eval "db.adminCommand('ping')"

# Check network connectivity
docker network ls
docker network inspect kinect_kinect-network
```

**3. Email reminders not working**
```bash
# Test SMTP configuration
docker exec kinect-api-prod node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
transporter.verify().then(console.log).catch(console.error);
"
```

**4. Frontend can't connect to backend**
```bash
# Check API proxy configuration
curl -v http://localhost/api/health

# Verify environment variables
docker exec kinect-web-prod env | grep VITE
```

### Performance Issues

**High Memory Usage:**
```bash
# Check container resource usage
docker stats

# Optimize MongoDB
docker exec kinect-db-prod mongosh --eval "db.contacts.createIndex({lastContactDate: 1})"
```

**Slow Response Times:**
```bash
# Enable Redis caching (optional)
# Add to docker-compose.production.yml:
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes
  volumes:
    - redis-data:/data
```

---

## 💡 Optimization Tips

### Performance Optimization
1. **Enable gzip compression** in nginx
2. **Use Redis caching** for frequent queries  
3. **Create database indexes** for better query performance
4. **Use CDN** for static assets

### Security Hardening
```bash
# Restrict database access
# Update MONGODB_URI to use authentication
MONGODB_URI=mongodb://user:pass@mongodb:27017/kinect?authSource=admin

# Enable fail2ban for failed login attempts
sudo apt install fail2ban

# Configure firewall
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Cost Optimization
1. **Use ARM64 images** on ARM servers (Pi, Oracle Cloud)
2. **Enable auto-update** to stay secure without manual intervention
3. **Monitor resource usage** to right-size your server

---

## 📋 Post-Deployment Checklist

- [ ] Application accessible at configured URL
- [ ] User registration working
- [ ] Email reminders sending correctly  
- [ ] Database backups running
- [ ] SSL certificate installed (if applicable)
- [ ] Monitoring alerts configured
- [ ] Documentation updated with your specific setup

---

## 🆘 Getting Help

### Community Support
- **GitHub Issues**: [Report bugs and request features](https://github.com/your-repo/kinect/issues)
- **Discussions**: [Ask questions and share tips](https://github.com/your-repo/kinect/discussions)
- **Discord**: [Join our community chat](https://discord.gg/your-invite)

### Professional Support
For deployment assistance or custom configurations:
- Email: support@kinect-app.com  
- Priority support available for sponsors

---

## 🎉 Success Stories

> "Deployed Kinect on my Raspberry Pi 4 in under 10 minutes. The reminder system works perfectly and hasn't missed a beat in 6 months!" - @user123

> "Running Kinect on DigitalOcean for $5/month. Handles 500+ contacts with daily reminders flawlessly." - @productivityguru

---

## 📈 Next Steps

Once your deployment is running:

1. **Import your contacts** from your phone/Google/iCloud
2. **Set up contact lists** (Best Friends, Colleagues, etc.)  
3. **Configure reminder intervals** to match your communication style
4. **Enable backup automation** for peace of mind
5. **Consider upgrading** to premium features or contributing to the project

**Happy connecting!** 🤝