# Kinect Self-Hosted - 5 Minute Setup

Get your private relationship manager running in minutes, not hours.

## 🚀 One-Line Install

```bash
curl -sSL https://raw.githubusercontent.com/kinect/self-hosted/main/install.sh | bash
```

**That's it!** Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Requirements

- **Docker** installed ([get it here](https://docs.docker.com/get-docker/))
- **1GB** free disk space
- **Any modern browser** (Chrome, Firefox, Safari, Edge)
- **5 minutes** of your time

---

## ⚡ Quick Start Steps

### 1. Install & Start (2 minutes)
```bash
# Download and run installer
curl -sSL https://get.kinect.app | bash

# Or with Docker directly
docker run -d -p 3000:3000 -v kinect-data:/data kinect/self-hosted
```

### 2. Setup Account (1 minute)
1. Go to [http://localhost:3000](http://localhost:3000)
2. Follow the setup wizard
3. Create your admin account
4. Configure preferences (optional)

### 3. Add Contacts (2 minutes)
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
# Creates encrypted backup in ./backups/
```

### Update Kinect
```bash
cd kinect
./scripts/update.sh
# Updates to latest version safely
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
# Check if everything is working
./scripts/validate-install.sh
```

### Get Logs
```bash
# See what's happening
docker-compose -f docker-compose.selfhosted.yml logs -f
```

---

## 📞 Support Options

| Issue Type | Where to Get Help |
|------------|-------------------|
| **Setup Problems** | [GitHub Issues](https://github.com/kinect/self-hosted/issues) |
| **Feature Questions** | [Documentation Wiki](https://github.com/kinect/self-hosted/wiki) |
| **General Discussion** | [GitHub Discussions](https://github.com/kinect/self-hosted/discussions) |
| **Security Issues** | security@kinect.app |

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
# Export from existing service
# Import to Kinect using setup wizard
# Validate data integrity
# Cancel old service
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

**Questions?** Open an issue on [GitHub](https://github.com/kinect/self-hosted) or check the [full documentation](SELFHOSTED-DEPLOYMENT.md).