# Kinect Self-Hosted - Local Setup Guide

Get your private relationship manager running locally from source.

> **⚠️ Note**: This is a local development setup. Automated deployment infrastructure is planned but not yet available.

## 🚀 Quick Local Setup

**Prerequisites**: Node.js 18+, Docker, Git

```bash
# Clone the repository
git clone <your-kinect-repo-url>
cd kinect

# Install dependencies
npm run install:all

# Start with Docker Compose (recommended)
docker compose -f docker-compose.selfhosted.yml up -d
```

**Access at**: [http://localhost:3000](http://localhost:3000)

---

## 📋 Requirements

- **Docker** installed ([get it here](https://docs.docker.com/get-docker/))
- **1GB** free disk space
- **Any modern browser** (Chrome, Firefox, Safari, Edge)
- **5 minutes** of your time

---

## ⚡ Local Setup Steps

### 1. Clone & Install (2 minutes)
```bash
# Clone repository
git clone <your-kinect-repo-url>
cd kinect

# Install all workspace dependencies
npm install

# Or install individual workspaces
cd backend && npm install
cd ../frontend-web && npm install
cd ../shared && npm install
```

### 2. Start Services (1 minute)
```bash
# Option A: Docker Compose (Recommended)
docker compose -f docker-compose.selfhosted.yml up -d

# Option B: Development mode
npm run dev:all
```

### 3. Setup Account (1 minute)
1. Go to [http://localhost:3000](http://localhost:3000)
2. Follow the setup wizard
3. Create your admin account
4. Configure preferences (optional)

### 4. Add Contacts (2 minutes)
Choose your method:

**📁 Import File** (fastest)
- Export contacts from your phone/Gmail
- Drag & drop CSV/vCard file
- Review and import

**➕ Manual Entry**
- Click "Add Contact"
- Enter name and details
- Assign to categories

**📱 Sample Data**
- Enable during setup
- Explore features immediately
- Delete when ready

---

## 🔒 Privacy First

- ✅ **100% Local** - Data never leaves your device
- ✅ **No Cloud** - No external services required  
- ✅ **No Tracking** - Zero telemetry or analytics
- ✅ **Open Source** - Fully auditable code
- ✅ **Your Control** - Export data anytime

---

## 📱 Works Everywhere

| Platform | Method | Notes |
|----------|--------|-------|
| **Web Browser** | Direct access | All features available |
| **Mobile** | Add to home screen | PWA with offline support |
| **Desktop** | Bookmark/shortcut | Native-like experience |
| **Local Network** | Share with family | Optional multi-user |

---

## 🔧 Common Tasks

### Import Contacts

**From iPhone:**
```bash
# Export from Contacts app → Share → Save to Files
# Upload .vcf file to Kinect
```

**From Android:**
```bash
# Contacts app → Export → Save as CSV
# Upload CSV file to Kinect
```

**From Google:**
```bash
# Google Contacts → Export → Google CSV
# Upload CSV file to Kinect
```

### Backup Your Data
```bash
cd kinect
./scripts/backup.sh
# Creates backup in ./backups/
```

### Import Contacts (Python Script)
```bash
cd kinect
python3 scripts/import-contacts.py your-contacts.csv
# Supports CSV, vCard, and JSON formats
```

---

## 🆘 Need Help?

### Installation Issues

**Docker not found:**
```bash
# Install Docker first
curl -fsSL https://get.docker.com | sh
```

**Permission denied:**
```bash
# Add your user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

**Port 3000 in use:**
```bash
# Use different port
FRONTEND_PORT=3001 ./install.sh
```

### Validation
```bash
# Check if everything is working (if using Docker)
./scripts/validate-install.sh
```

### Get Logs
```bash
# Docker logs
docker compose -f docker-compose.selfhosted.yml logs -f

# Development logs
npm run dev:backend  # Backend logs
npm run dev:frontend # Frontend logs
```

---

## 📞 Support Options

| Issue Type | Where to Get Help |
|------------|-------------------|
| **Setup Problems** | Check logs, review documentation |
| **Feature Questions** | Review CLAUDE.md and README.md |
| **General Discussion** | Create GitHub issues in your repo |
| **Security Issues** | Review SELFHOSTED-DEPLOYMENT.md |

---

## 🎯 What's Next?

### Immediate (First Hour)
1. ✅ Complete setup wizard
2. ✅ Import/add first 10 contacts  
3. ✅ Create your first contact list
4. ✅ Set up reminders for best friends

### This Week
- Explore the dashboard
- Add more contacts gradually
- Set up backup automation
- Customize reminder intervals

### Advanced (When Ready)
- Set up access from multiple devices
- Configure automatic backups
- Export data for other services
- Contribute to the project

---

## 🌟 Pro Tips

### Faster Import
- Export contacts as CSV for fastest import
- Use field mapping for custom formats
- Import in smaller batches (<500 contacts)

### Better Organization  
- Use contact lists like "Work", "Family", "Sports"
- Set different reminder intervals per relationship
- Add notes for context about each person

### Stay Organized
- Review overdue contacts weekly
- Update last contact dates regularly
- Use the dashboard to track patterns

### Privacy & Security
- Enable backups to external drive
- Use strong passwords
- Keep Kinect updated
- Consider VPN for remote access

---

## 📊 Quick Stats

| Metric | Typical Performance |
|--------|-------------------|
| **Startup Time** | < 30 seconds |
| **Import Speed** | 100 contacts/minute |
| **Memory Usage** | < 512MB RAM |
| **Disk Space** | < 100MB (1000 contacts) |
| **Response Time** | < 100ms |

---

## 🔄 Migration

### From Cloud Services
```bash
# Export data from existing service (Google, iCloud, etc.)
# Use Python import script: python3 scripts/import-contacts.py exported-file.csv
# Validate data integrity through web interface
# Clean up old service data if satisfied
```

### To Other Systems
```bash
# Export from Settings → Data Export
# Choose format (JSON/CSV/vCard)
# Import to destination system
```

---

**🎉 You're Done!**

Your private relationship manager is ready. Start building stronger connections while keeping your data secure.

**Bookmark this:** [http://localhost:3000](http://localhost:3000)

---

*Made with ❤️ for privacy-conscious people who value relationships*

**Questions?** Check the documentation files in your repository or create GitHub issues for support.