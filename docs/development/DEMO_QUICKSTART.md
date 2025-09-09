# 🚀 Quick Start - See Reminders Working in 2 Minutes

**Just want to see it work?** Run these commands:

```bash
# Navigate to the backend directory first
cd backend

# Then run the demo
npm run demo:reminders
```

**Or use the quick demo:**
```bash
cd backend
npm run demo:quick
```

This will:
- ✅ Check prerequisites automatically
- 🐳 Start MailHog in Docker
- 🗄️ Connect to MongoDB
- 👤 Create a test user (Sarah Johnson)
- 📱 Create overdue contacts (John Smith, Emma Wilson, etc.)
- 📧 Send actual reminder email
- 🌐 Open MailHog in your browser to see the email

---

## Quick Commands Reference

| What you want to do | Command | Time |
|---------------------|---------|------|
| **See it working NOW** | `npm run demo:reminders` | 2 min |
| Quick 5-min test | `npm run demo:quick` | 5 min |
| Create test data only | `npm run test:setup-data` | 1 min |
| Clean everything up | `npm run demo:cleanup` | 30 sec |
| View test emails | Open http://localhost:8025 | - |
| Check what contacts exist | `npm run db:view-contacts` | 10 sec |
| Run all unit tests | `npm test` | 30 sec |

---

## Prerequisites (One-time Setup)

```bash
# 1. Check you have everything
node --version    # Need v18+
docker --version  # Any recent version
mongosh --version # Or mongo --version

# 2. If missing MongoDB:
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb
# Windows: Download from mongodb.com

# 3. If missing Docker:
# macOS: brew install docker or download Docker Desktop
# Ubuntu: sudo apt install docker.io
# Windows: Download Docker Desktop
```

---

## What You'll See

After running `npm run demo:reminders`:

```
🎬 KINECT REMINDER SYSTEM - LIVE DEMO
=====================================

🔍 Checking Prerequisites...
  ✅ Node.js: v18.17.0
  ✅ Docker: Docker version 24.0.0
  ✅ MongoDB: v6.0.0

🚀 Starting Services...
  ✅ MailHog: Running on ports 1025 (SMTP) and 8025 (Web)
  ✅ MongoDB: Connected and ready
  ✅ SMTP: MailHog ready to receive emails

📝 Creating Test Data...
  👤 User: Sarah Johnson (sarah.johnson@example.com)
  📱 John Smith: 15 days overdue (45 days since contact, 30-day threshold)
  📱 Emma Wilson: 5 days overdue (25 days since contact, 20-day threshold)
  📱 Michael Brown: 40 days overdue (100 days since contact, 60-day threshold)
  ✅ Created 5 contacts, 3 are overdue

📧 Processing Reminders...
  🔍 Found 3 overdue contacts
  ✅ Email sent to sarah.johnson@example.com
  📮 Message ID: <abc123@kinect.app>
  📊 Included 3 overdue contacts

🌐 Opening MailHog in Browser...
  🌐 URL: http://localhost:8025
  ✅ Browser opened automatically

🎉 Demo Complete!
⏱️  Total time: 3 seconds

What you should see:
  🌐 MailHog opened in your browser
  📧 Professional reminder email in the inbox
  👥 List of overdue contacts with days since last contact
  🎨 Beautiful HTML formatting with your name
```

**In your browser at http://localhost:8025:**
- 1 email from "Kinect Reminders"
- Subject: "Time to reconnect with your contacts!"
- Professional HTML email listing overdue contacts
- Each contact shows days since last contact
- Unsubscribe and preferences links

---

## Common Issues & Fixes

### "MongoDB not running"
```bash
# macOS
brew services start mongodb-community

# Linux  
sudo systemctl start mongod

# Or start manually
mongod --dbpath /tmp/mongodb-data --fork
```

### "Docker not found"
```bash
# Install Docker Desktop or:
# macOS: brew install --cask docker
# Linux: sudo apt install docker.io
# Then start Docker Desktop
```

### "MailHog not receiving emails"
```bash
# Restart MailHog
npm run stop:services
npm run start:services

# Or manually:
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
```

### "Port already in use"
```bash
# Kill whatever is using the port
lsof -ti:8025 | xargs kill -9
lsof -ti:1025 | xargs kill -9

# Then retry
npm run demo:reminders
```

### "No emails showing up"
1. Check http://localhost:8025 is loading
2. Run `npm run demo:cleanup` then `npm run demo:reminders`
3. Check console for error messages

---

## Next Steps After Demo

### 1. Explore Different Scenarios
```bash
# Test different reminder intervals
npm run demo:quick

# Create more complex test data
npm run test:setup-data

# See what contacts were created
npm run db:view-contacts
```

### 2. Modify and Re-run
Edit `scripts/demo-reminders.js` to:
- Change contact names
- Adjust reminder days
- Add more contacts
- Change email content

Then run `npm run demo:reminders` again.

### 3. Integration with Real System
- Check `src/services/notification.service.simple.ts` for production code
- Run `npm test` to see comprehensive test suite
- Read `README_TESTING.md` for detailed testing guide

### 4. Cleanup
```bash
# When done testing
npm run demo:cleanup

# This removes:
# - Test database data
# - Docker containers
# - Temporary files
```

---

## Troubleshooting Checklist

If the demo fails, check these in order:

- [ ] Node.js installed and v18+ (`node --version`)
- [ ] Docker running (`docker ps` should work)
- [ ] MongoDB running (`mongosh --eval "db.version()"`)
- [ ] No other services on ports 1025, 8025, 27017
- [ ] In the `/backend` directory (`ls package.json` should work)
- [ ] Run `npm install` to ensure dependencies installed

Still not working? Run with debug info:
```bash
DEBUG=* npm run demo:reminders
```

---

## What This Tests

This demo validates:
- ✅ **Core reminder logic**: Custom vs list vs default reminder days
- ✅ **Email delivery**: SMTP connection and HTML email generation
- ✅ **Database operations**: Creating users/contacts, querying overdue
- ✅ **Date calculations**: Days since last contact vs reminder thresholds
- ✅ **System integration**: All components working together
- ✅ **Error handling**: Graceful failures and helpful error messages

The demo uses the exact same code that runs in production, so if it works here, the real system will work!