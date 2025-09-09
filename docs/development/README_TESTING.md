# Reminder System Testing Guide

This guide shows you how to manually test the reminder system and run live demos to see reminders in action.

## 🚀 Quick Start Demo (2 minutes)

Want to see reminders working right now? Run this single command:

```bash
npm run demo:reminders
```

This will start all services, create test data, send real emails, and show you the results in your browser.

---

## 📋 Prerequisites Check

### Required Software

| Component | Version | Status Check Command |
|-----------|---------|---------------------|
| Node.js | 18+ | `node --version` |
| MongoDB | 4.4+ | `mongosh --version` or `mongo --version` |
| Docker | 20+ | `docker --version` |
| npm | 8+ | `npm --version` |

### Verify Prerequisites

```bash
# 1. Check Node.js
node --version
# Expected: v18.0.0 or higher

# 2. Check MongoDB (try both commands)
mongosh --version  # MongoDB 6.0+
# OR
mongo --version    # MongoDB 4.4-5.x

# 3. Check Docker
docker --version
# Expected: Docker version 20.0.0 or higher

# 4. Check npm
npm --version
# Expected: 8.0.0 or higher
```

### Install Dependencies

```bash
# Install project dependencies
npm install

# Install testing dependencies (if not already installed)
npm install --save-dev jest @types/jest supertest mongodb-memory-server
```

### Environment Setup

Create `.env` file if it doesn't exist:

```bash
# Copy environment template
cp .env.example .env

# Or create manually with these values:
echo "NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/kinect-dev
SMTP_HOST=localhost
SMTP_PORT=1025
JWT_SECRET=your-jwt-secret-key-here" > .env
```

---

## ⚡ Quick Demo (5 minutes)

### Step 1: Start Services

```bash
# Terminal 1: Start MailHog (email capture)
docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Terminal 2: Start MongoDB (if not running)
mongod --dbpath /usr/local/var/mongodb

# Terminal 3: Start the backend
npm run dev
```

### Step 2: Run Quick Demo

```bash
# Run the 5-minute demo
node scripts/demo-quick.js
```

Expected output:
```
🚀 KINECT REMINDER DEMO - Quick Test (5 minutes)
===============================================

✅ Services Check:
  - MongoDB: Connected
  - MailHog: Running on http://localhost:8025
  - Backend: http://localhost:3001

📝 Creating Test Data:
  - User: Sarah Johnson (sarah@example.com)
  - Contact: John Smith (35 days overdue, 30-day reminder)
  - Contact: Emma Wilson (15 days overdue, 10-day custom reminder)

📧 Triggering Reminders:
  - Processing overdue contacts...
  - Email sent to sarah@example.com
  - 2 contacts included in reminder

🌐 View Results:
  - Open: http://localhost:8025
  - Check inbox for: sarah@example.com
  - Subject: "Time to reconnect with your contacts!"

✅ Demo Complete! Check MailHog to see the actual email.
```

### Step 3: View the Email

1. Open http://localhost:8025 in your browser
2. You should see 1 email in the inbox
3. Click on the email to see:
   - Subject: "Time to reconnect with your contacts!"
   - Body showing overdue contacts with days since last contact
   - Professional HTML formatting

---

## 🔍 Interactive Testing (15 minutes)

### Step 1: Setup Test Environment

```bash
# Start all services if not running
npm run start:services

# Create comprehensive test data
node scripts/test-data-setup.js
```

This creates:
- 3 test users with different preferences
- 15 contacts with various reminder schedules
- Mix of overdue and upcoming reminders

### Step 2: Manual Reminder Testing

```bash
# Test different reminder scenarios

# 1. Process all overdue reminders
npm run test:reminders:process

# 2. Test custom reminder days
npm run test:reminders:custom

# 3. Test list-based reminders  
npm run test:reminders:lists

# 4. Test quiet hours (won't send during 10 PM - 8 AM)
npm run test:reminders:quiet-hours

# 5. Test email batching (max 5 contacts per email)
npm run test:reminders:batching
```

### Step 3: Verify Results

After each test, check:

1. **MailHog UI** (http://localhost:8025):
   - Number of emails received
   - Email recipients and subjects
   - HTML content and formatting

2. **Console Output**:
   - Processing logs and timing
   - Number of reminders sent
   - Any errors or warnings

3. **Database State**:
   ```bash
   # Check reminder history
   npm run db:check-reminders
   
   # View contact last-contacted dates
   npm run db:view-contacts
   ```

### Step 4: Time Travel Testing

Test future reminders by manipulating dates:

```bash
# Create contacts due for reminder in different timeframes
node scripts/time-travel-setup.js

# Test scenarios:
# - Reminders due today
# - Reminders due in 7 days  
# - Reminders past due by various amounts
```

---

## 👀 Visual Confirmation

### MailHog UI Navigation

1. **Access**: http://localhost:8025
2. **Features**:
   - **Inbox**: All captured emails
   - **Search**: Filter by recipient/subject
   - **Preview**: HTML and text versions
   - **Raw**: See complete email headers
   - **Delete**: Clear test emails

### What to Look For

✅ **Successful Reminder Email**:
```
From: Kinect Reminders <noreply@kinect.app>
To: sarah@example.com  
Subject: Time to reconnect with your contacts!

Hi Sarah!

You have contacts you haven't spoken to in a while:

• John Smith - 35 days since last contact
• Emma Wilson - 15 days since last contact  

Consider reaching out to maintain your relationships!

[Unsubscribe] [Update Preferences]
```

❌ **Common Issues**:
- No emails received → Check SMTP configuration
- Wrong contact counts → Verify overdue calculations
- Missing contacts → Check batching logic (max 5)
- Duplicate emails → Verify deduplication

---

## 🧪 Test Scenarios

### Scenario 1: "Remind me about John in 7 days"

```bash
# Create contact with future reminder
node -e "
const script = require('./scripts/scenario-future-reminder.js');
script.createContactDueIn7Days('John Doe', 'john@example.com');
"

# Fast-forward 7 days (simulated)
node scripts/fast-forward-days.js 7

# Process reminders
npm run test:reminders:process

# Result: Should see John Doe in reminder email
```

### Scenario 2: "Daily reminder for best friends list"

```bash
# Setup best friends list with daily reminders
node scripts/scenario-daily-reminders.js

# Run reminder processing
npm run test:reminders:process

# Result: Best friends overdue by 1+ days get reminders
```

### Scenario 3: "What happens if server crashes?"

```bash
# Start reminder processing
npm run test:reminders:long-running &

# Kill the process mid-way
kill %1

# Restart and resume
npm run test:reminders:resume

# Result: Should resume without duplicate emails
```

### Scenario 4: "Are duplicates prevented?"

```bash
# Run reminder processing twice quickly
npm run test:reminders:process
npm run test:reminders:process

# Check MailHog - should see same number of emails
# Result: No duplicate emails sent
```

---

## 🛠️ Troubleshooting

### Issue: MailHog not receiving emails

**Symptoms**: No emails in http://localhost:8025

**Solutions**:
```bash
# 1. Check MailHog is running
docker ps | grep mailhog
# Should show running container on ports 1025:1025, 8025:8025

# 2. Restart MailHog
docker stop mailhog && docker rm mailhog
docker run -d --name mailhog -p 1025:1025 -p 8025:8025 mailhog/mailhog

# 3. Check SMTP configuration
node -e "console.log('SMTP_HOST:', process.env.SMTP_HOST || 'localhost')"
# Should output: SMTP_HOST: localhost

# 4. Test SMTP connection directly
npm run test:smtp-connection
```

### Issue: Reminders not triggering

**Symptoms**: Script runs but no emails sent

**Solutions**:
```bash
# 1. Check for overdue contacts
npm run db:count-overdue
# Should show number > 0

# 2. Verify date calculations
node scripts/debug-calculations.js
# Shows reminder threshold vs. days since contact

# 3. Check email service status
npm run test:email-service
```

### Issue: Database connection errors

**Symptoms**: MongoDB connection refused

**Solutions**:
```bash
# 1. Start MongoDB
# macOS with Homebrew:
brew services start mongodb/brew/mongodb-community

# Linux:
sudo systemctl start mongod

# 2. Check connection
mongosh "mongodb://localhost:27017/kinect-dev"

# 3. Reset database if corrupted
npm run db:reset
npm run db:seed
```

### Issue: Wrong timezone calculations

**Symptoms**: Reminders off by several hours

**Solutions**:
```bash
# 1. Check system timezone
date
# Should show your local time

# 2. Check Node.js timezone
node -e "console.log(new Date().getTimezoneOffset())"

# 3. Set explicit timezone in tests
export TZ=America/New_York
npm run test:reminders:process
```

### Issue: How to reset test data

```bash
# Complete reset (nuclear option)
npm run demo:reset

# Specific resets
npm run db:clear-contacts    # Remove test contacts
npm run db:clear-reminders   # Clear reminder history  
npm run mailhog:clear        # Clear MailHog emails
```

---

## 🎬 Complete Demo Script

### Installation & Setup

```bash
# 1. Clone and setup (if starting fresh)
git clone <repo-url>
cd kinect/backend
npm install

# 2. Start all services
npm run start:all-services

# 3. Run comprehensive demo
npm run demo:full
```

### The `demo:full` Command

This single command:
1. ✅ Checks all prerequisites
2. 🚀 Starts MongoDB, MailHog, and backend
3. 📝 Creates realistic test data
4. 📧 Triggers various reminder scenarios
5. 🌐 Opens MailHog in your browser
6. 📊 Shows real-time processing logs
7. ✅ Validates all emails were sent correctly
8. 🧹 Offers to clean up test data

### Expected Full Demo Output

```
🎬 KINECT REMINDER SYSTEM - FULL DEMO
=====================================

🔍 Prerequisites Check:
  ✅ Node.js v18.17.0
  ✅ MongoDB v6.0.0 
  ✅ Docker v24.0.0
  ✅ All npm dependencies installed

🚀 Starting Services:
  ✅ MongoDB started on :27017
  ✅ MailHog started on :1025 (SMTP) and :8025 (Web)
  ✅ Kinect backend started on :3001

📝 Creating Test Data:
  👤 User: Sarah Johnson (sarah@example.com)
  👤 User: Mike Chen (mike@example.com) 
  👤 User: Lisa Rodriguez (lisa@example.com)
  
  📱 15 contacts created with realistic reminder schedules
  📋 3 contact lists created (Best Friends, Work, Family)
  ⏰ Mix of overdue, due today, and future reminders

📧 Processing Reminders:
  🔄 Scanning 15 contacts across 3 users...
  📮 Found 7 overdue contacts requiring reminders
  ✉️  Sending to sarah@example.com (3 contacts)
  ✉️  Sending to mike@example.com (2 contacts)  
  ✉️  Sending to lisa@example.com (2 contacts)
  ✅ All emails sent successfully!

🌐 Opening MailHog UI:
  📍 http://localhost:8025
  📨 You should see 3 emails in the inbox
  👀 Click each email to see reminder content

📊 Reminder Summary:
  • Total contacts processed: 15
  • Overdue contacts found: 7
  • Emails sent: 3
  • Processing time: 1.2 seconds
  • Memory usage: 28MB

🧪 Test Scenarios Available:
  1. npm run test:future-reminders    # See 7-day advance reminders
  2. npm run test:custom-intervals    # Test 15/30/60/90 day cycles
  3. npm run test:quiet-hours        # Verify no emails 10PM-8AM
  4. npm run test:high-volume        # Process 100+ contacts
  5. npm run test:duplicate-prevention # Run twice, verify no duplicates

🎉 Demo Complete!
  
  Next steps:
  - Check http://localhost:8025 to see actual emails
  - Run individual test scenarios above
  - Try creating your own contacts with the API
  - Experiment with different reminder intervals

🧹 Cleanup:
  Run 'npm run demo:cleanup' when finished testing
```

---

## 🏭 Production Simulation

### High Volume Testing

```bash
# Create 1000+ contacts with varied reminder dates
npm run test:high-volume

# Process with production-like timing
npm run test:production-timing

# Verify performance metrics
npm run test:performance-report
```

### Cron Job Simulation

```bash
# Test actual daily cron execution
npm run test:cron-daily

# Test weekly summary emails
npm run test:cron-weekly

# Test monthly cleanup jobs
npm run test:cron-cleanup
```

### Multi-User Scenarios

```bash
# Simulate 50 users with realistic contact patterns
npm run test:multi-user

# Test concurrent processing
npm run test:concurrent-users

# Verify user isolation (no cross-user reminders)
npm run test:user-isolation
```

---

## 📦 Quick Commands Reference

| Command | Purpose | Time |
|---------|---------|------|
| `npm run demo:quick` | 5-minute basic demo | 5 min |
| `npm run demo:full` | Complete testing experience | 15 min |
| `npm run demo:reset` | Clean slate reset | 1 min |
| `npm run test:smtp` | Test email delivery only | 2 min |
| `npm run test:performance` | Load test with 1000 contacts | 3 min |
| `npm run start:services` | Start MongoDB + MailHog | 1 min |
| `npm run stop:services` | Stop all test services | 1 min |

---

## 🎯 Success Criteria

After running the demos, you should see:

✅ **In MailHog (http://localhost:8025)**:
- Professional HTML emails with contact names and days overdue
- Proper FROM/TO headers 
- Unsubscribe and preferences links
- No duplicate emails for same contacts

✅ **In Console Logs**:
- Clear processing steps and timing
- Contact counts and email confirmations  
- No error messages or warnings
- Performance metrics under thresholds

✅ **In Database**:
- Reminder history recorded correctly
- Contact last-contacted dates updated
- User preferences respected
- No data corruption or conflicts

---

This testing guide gives you multiple ways to verify the reminder system is working correctly, from quick 2-minute demos to comprehensive production simulations. Start with `npm run demo:reminders` to see it in action immediately!