# Backup & Recovery Strategy

## Overview

This document outlines the backup and recovery procedures for Kinect in production.

## Backup Components

### 1. Database (MongoDB Atlas)

#### Automatic Backups
- **Free Tier (M0)**: No automatic backups
- **Recommendation**: Upgrade to M10 for automated daily snapshots

#### Manual Backup Procedure

**Daily Backup Script:**
```bash
#!/bin/bash
# backup-mongodb.sh

# Configuration
MONGODB_URI="mongodb+srv://kinect-admin:password@kinect-production.mongodb.net"
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="kinect_backup_$DATE"

# Create backup
echo "Starting backup: $BACKUP_NAME"
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/$BACKUP_NAME"

# Compress backup
echo "Compressing backup..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
rm -rf "$BACKUP_DIR/$BACKUP_NAME"

# Keep only last 30 days of backups
echo "Cleaning old backups..."
find "$BACKUP_DIR" -name "kinect_backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_NAME.tar.gz"
```

**Restore Procedure:**
```bash
# Extract backup
tar -xzf kinect_backup_20250905_120000.tar.gz

# Restore to MongoDB Atlas
mongorestore --uri="$MONGODB_URI" --drop ./kinect_backup_20250905_120000
```

### 2. Code Repository (GitHub)

#### Automatic Backups
- GitHub provides redundant storage
- All commits are backed up automatically

#### Release Tagging
```bash
# Tag production releases
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0

# List all tags
git tag -l

# Checkout specific version
git checkout v1.0.0
```

### 3. Environment Variables

#### Backup Procedure
1. Export from Render Dashboard
2. Store securely in password manager
3. Document in secure location

#### Critical Variables to Backup:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `SMTP credentials`

## Recovery Procedures

### Scenario 1: Database Corruption

**Recovery Time Objective (RTO):** 1-2 hours
**Recovery Point Objective (RPO):** 24 hours

1. **Identify issue:**
   ```bash
   curl https://kinect-api.onrender.com/health
   ```

2. **Restore from backup:**
   ```bash
   mongorestore --uri="$MONGODB_URI" --drop ./latest_backup
   ```

3. **Verify restoration:**
   - Test API endpoints
   - Check data integrity
   - Verify user access

### Scenario 2: Service Failure

**Recovery Time Objective (RTO):** 5-10 minutes

1. **Restart service in Render:**
   - Dashboard → Service → Settings → Restart

2. **If persistent issue:**
   ```bash
   # Rollback to previous version
   git revert HEAD
   git push origin main
   ```

### Scenario 3: Complete Platform Failure

**Recovery Time Objective (RTO):** 2-4 hours

1. **Deploy to alternate platform:**
   - Use backup render.yaml
   - Configure environment variables
   - Restore database

2. **Update DNS (if custom domain):**
   - Point to new service URLs

## Backup Schedule

| Component | Frequency | Retention | Method |
|-----------|-----------|-----------|---------|
| Database | Daily | 30 days | Manual/Script |
| Code | On commit | Forever | GitHub |
| Env Vars | On change | Latest | Manual |
| Releases | On deploy | Forever | Git tags |

## Testing Procedures

### Monthly Disaster Recovery Test

1. **Create test environment:**
   ```bash
   # Clone production data to test database
   mongodump --uri="$PROD_URI" --out=test_backup
   mongorestore --uri="$TEST_URI" test_backup
   ```

2. **Test restore procedure:**
   - Restore to test environment
   - Verify data integrity
   - Test all critical functions

3. **Document results:**
   - Time to restore
   - Issues encountered
   - Process improvements

## Monitoring & Alerts

### Setup Monitoring
1. **Render Health Checks:**
   - Configured in render.yaml
   - Alerts on failure

2. **MongoDB Atlas Alerts:**
   - Login to Atlas dashboard
   - Configure alerts for:
     - High disk usage
     - Connection issues
     - Performance degradation

3. **External Monitoring:**
   - UptimeRobot (free tier)
   - Monitor: https://kinect-api.onrender.com/health

## Emergency Contacts

### Service Providers
- **Render Support:** support@render.com
- **MongoDB Atlas:** https://support.mongodb.com
- **GitHub Support:** https://support.github.com

### Escalation Path
1. Check service status pages
2. Review logs in Render dashboard
3. Contact support if needed

## Backup Validation Checklist

### Weekly
- [ ] Verify latest backup exists
- [ ] Check backup file size
- [ ] Review backup logs for errors

### Monthly
- [ ] Perform test restore
- [ ] Verify data integrity
- [ ] Update documentation

### Quarterly
- [ ] Full disaster recovery drill
- [ ] Review and update procedures
- [ ] Rotate access credentials

## Automation Recommendations

### Future Improvements
1. **Automated Daily Backups:**
   - Setup cron job on separate server
   - Store backups in S3/cloud storage
   - Email notifications on completion

2. **Backup Monitoring:**
   - Alert if backup fails
   - Monitor backup size trends
   - Automated restore testing

3. **Multi-Region Backup:**
   - Store backups in different regions
   - Implement cross-region replication

## Cost Considerations

### Current (Manual)
- Storage: Local/minimal
- Time: 15 min/day manual
- Cost: $0

### Automated Solution
- MongoDB M10: $57/month (includes backups)
- S3 Storage: ~$5/month
- Monitoring: Free tier sufficient

## Documentation Updates

Last Updated: September 5, 2025
Next Review: October 5, 2025

Keep this document updated with:
- New procedures
- Lessons learned
- Contact changes
- Tool updates