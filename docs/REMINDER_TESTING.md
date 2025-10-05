# Kinect Reminder System Testing Guide

## Overview

The Kinect reminder system sends daily automated email notifications to users about contacts they haven't spoken to recently. It also provides manual trigger controls for immediate testing and processing. This guide covers testing the reminder system in both development and production environments.

## Quick Start

### Test with Real Email (Production)

```bash
cd backend

# Step 1: Create test data for a specific user
TEST_USER_EMAIL=your-email@example.com node scripts/test-production-reminders.js

# Step 2: Send reminder email
node scripts/send-test-reminder.js
```

### Test with MailHog (Local)

```bash
# Start MailHog
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Run demo
cd backend
npm run demo:reminders

# View emails at http://localhost:8025
```

### Manual Trigger Controls (Dashboard)

The dashboard provides manual trigger controls for immediate testing:

1. **Access Dashboard**
   - Production: https://kinect-web.onrender.com/dashboard
   - Local: http://localhost:5173/dashboard

2. **Manual Trigger Options**
   - **Test Personal Reminder**: Send test email to yourself with your overdue contacts
   - **Trigger All Daily Reminders**: Process and send reminders to all users immediately

3. **Benefits**
   - Real-time testing without waiting for scheduled runs
   - Immediate feedback with toast notifications
   - Professional UI with loading states
   - No command-line tools required

### Script-Based Testing

```bash
cd backend

# Test notification service methods directly
node scripts/test-notification-service.js

# Test API endpoints with authentication
node scripts/test-manual-triggers.js

# Test production email delivery
node scripts/test-production-email.js
```

## Configuration

### Gmail SMTP Setup

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Visit https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Copy the 16-character password

3. **Configure `.env`**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # App password
   FROM_EMAIL=your-email@gmail.com
   ```

### Local Testing with MailHog

```env
SMTP_HOST=localhost
SMTP_PORT=1025
# No authentication needed for MailHog
```

## Testing Scripts

### `test-production-reminders.js`
Creates or updates contacts to be "overdue" for testing:
- Finds or creates a user account
- Sets contact `lastContactDate` to trigger reminders
- Shows which contacts are overdue

### `send-test-reminder.js`
Directly sends reminder emails:
- Bypasses Mongoose models (works with raw MongoDB)
- Sends email to specified user
- Shows detailed SMTP debugging info

### `demo-reminders.js`
Complete demo environment:
- Sets up MailHog for email capture
- Creates realistic test data
- Processes reminders
- Opens MailHog in browser

## Database Debugging

### Check Database Contents
```bash
node scripts/debug-database.js
```
Shows:
- Connected database name
- All users in the database
- Collection structure

### Search Across Databases
```bash
node scripts/check-all-databases.js
```
Searches both `test` and `kinect` databases for users.

### Migrate Users Between Databases
```bash
node scripts/migrate-user.js
```
Moves a user from `test` to `kinect` database (useful for fixing split database issues).

## Production Reminder Schedule

The production system runs reminders automatically:
- **Schedule**: Every Monday at 9 AM UTC
- **Service**: Render Cron Job (`kinect-reminders`)
- **Script**: `backend/scripts/send-reminders.js`

## Reminder Logic

Contacts are considered overdue when:
```
daysSinceLastContact > reminderThreshold
```

Default thresholds:
- **Custom per contact**: Set via `customReminderDays`
- **List default**: Inherited from contact list settings
- **System default**: 30 days

## Troubleshooting

### "User already exists" but can't find user
The user might be in a different database:
```bash
node scripts/check-all-databases.js
node scripts/migrate-user.js  # If needed
```

### Reminder processes 0 users
Check that:
1. Users exist in the correct database (`kinect` not `test`)
2. Users have overdue contacts
3. MongoDB URI points to correct database

### Email not sending
1. Verify SMTP configuration in `.env`
2. Check app password is correct (not regular password)
3. Try MailHog for local testing
4. Check spam folder

### Nodemailer errors
Ensure nodemailer is installed:
```bash
cd backend
npm install nodemailer
```

Common error: `createTransporter is not a function`
- Correct function is `createTransport` (not `createTransporter`)

### Critical: UserId Type Compatibility

**Important**: All scripts must query contacts with string userId:
```javascript
// ❌ Wrong - will find 0 contacts
const contacts = await contactsCollection.find({ userId: user._id }).toArray();

// ✅ Correct - userId is stored as String
const contacts = await contactsCollection.find({ userId: user._id.toString() }).toArray();
```

This applies to:
- `send-test-reminder.js`
- `test-production-reminders.js`
- `check-user-contacts.js`
- Any custom scripts querying contacts

## Testing Checklist

- [ ] SMTP configuration verified
- [ ] Test user created in correct database
- [ ] Contacts marked as overdue
- [ ] Email sent successfully
- [ ] Email received (check spam folder)
- [ ] Email content formatted correctly
- [ ] Links in email work properly

## Security Notes

- Never commit SMTP credentials to git
- Use app-specific passwords, not account passwords
- Keep `.env` file in `.gitignore`
- Rotate credentials regularly
- Monitor for unusual email activity