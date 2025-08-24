#!/bin/bash

# Kinect Self-Hosted Backup Script
# This script creates comprehensive backups of your Kinect installation

set -e

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="kinect_backup_${DATE}"
COMPOSE_FILE="docker-compose.selfhosted.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Create backup directory
mkdir -p "${BACKUP_DIR}"

echo "Starting Kinect backup: ${BACKUP_NAME}"
echo "========================================"

# Check if containers are running
if ! docker ps | grep -q kinect-db; then
    print_error "Kinect database container is not running"
    exit 1
fi

# 1. Backup MongoDB database
print_info "Backing up MongoDB database..."
docker exec kinect-db mongodump --archive="/backups/${BACKUP_NAME}.archive" --db=kinect
if [ $? -eq 0 ]; then
    print_success "Database backup completed"
else
    print_error "Database backup failed"
    exit 1
fi

# 2. Backup configuration files
print_info "Backing up configuration..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}_config.tar.gz" \
    .env* \
    docker-compose*.yml \
    config/ 2>/dev/null || true

if [ $? -eq 0 ]; then
    print_success "Configuration backup completed"
else
    print_warning "Some configuration files may be missing"
fi

# 3. Backup data directories
print_info "Backing up data directories..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}_data.tar.gz" \
    imports/ \
    exports/ \
    scripts/ 2>/dev/null || true

if [ $? -eq 0 ]; then
    print_success "Data directories backup completed"
else
    print_warning "Some data directories may be missing"
fi

# 4. Create backup manifest
print_info "Creating backup manifest..."
cat > "${BACKUP_DIR}/${BACKUP_NAME}_manifest.txt" << EOF
Kinect Backup Manifest
=====================

Backup Date: $(date)
Backup Name: ${BACKUP_NAME}
Kinect Version: $(docker exec kinect-api cat package.json | grep version | cut -d'"' -f4 2>/dev/null || echo "Unknown")

Files Included:
- ${BACKUP_NAME}.archive (MongoDB database)
- ${BACKUP_NAME}_config.tar.gz (Configuration files)
- ${BACKUP_NAME}_data.tar.gz (Data directories)

Backup Size:
$(ls -lh ${BACKUP_DIR}/${BACKUP_NAME}* | awk '{print $5 "\t" $9}')

Container Status:
$(docker ps --filter name=kinect --format "table {{.Names}}\t{{.Status}}")

Restore Instructions:
1. Stop Kinect: docker-compose -f ${COMPOSE_FILE} down
2. Restore database: docker exec -i kinect-db mongorestore --archive=/backups/${BACKUP_NAME}.archive --drop
3. Extract config: tar -xzf ${BACKUP_NAME}_config.tar.gz
4. Extract data: tar -xzf ${BACKUP_NAME}_data.tar.gz
5. Start Kinect: docker-compose -f ${COMPOSE_FILE} up -d
EOF

print_success "Backup manifest created"

# 5. Optional: Encrypt backup (if GPG is available and key is configured)
if command -v gpg >/dev/null 2>&1 && [ ! -z "$BACKUP_GPG_RECIPIENT" ]; then
    print_info "Encrypting backup files..."
    for file in "${BACKUP_DIR}/${BACKUP_NAME}"*; do
        gpg --encrypt --recipient "$BACKUP_GPG_RECIPIENT" --output "${file}.gpg" "$file"
        if [ $? -eq 0 ]; then
            rm "$file"  # Remove unencrypted version
        fi
    done
    print_success "Backup files encrypted"
fi

# 6. Cleanup old backups (keep last 30 days by default)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
print_info "Cleaning up backups older than ${RETENTION_DAYS} days..."

find "${BACKUP_DIR}" -name "kinect_backup_*" -type f -mtime +${RETENTION_DAYS} -delete
CLEANED=$(find "${BACKUP_DIR}" -name "kinect_backup_*" -type f -mtime +${RETENTION_DAYS} | wc -l)

if [ $CLEANED -gt 0 ]; then
    print_success "Cleaned up ${CLEANED} old backup files"
fi

# 7. Calculate backup size
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}"* 2>/dev/null | awk '{sum += $1} END {print sum "K"}' || echo "Unknown")
TOTAL_BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" | awk '{print $1}')

echo ""
echo "========================================"
echo -e "${GREEN}Backup completed successfully!${NC}"
echo "========================================"
echo "Backup location: ${BACKUP_DIR}"
echo "Backup name: ${BACKUP_NAME}"
echo "Backup size: ${BACKUP_SIZE}"
echo "Total backups size: ${TOTAL_BACKUP_SIZE}"
echo ""
echo "Files created:"
ls -la "${BACKUP_DIR}/${BACKUP_NAME}"* | awk '{print "  " $9 " (" $5 ")"}'
echo ""

# 8. Optional: Send notification (if configured)
if [ ! -z "$BACKUP_WEBHOOK_URL" ]; then
    curl -X POST "$BACKUP_WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -d "{\"text\":\"Kinect backup completed: ${BACKUP_NAME}\"}" \
         >/dev/null 2>&1 || true
fi

# 9. Optional: Sync to remote location
if [ ! -z "$BACKUP_REMOTE_PATH" ]; then
    print_info "Syncing backup to remote location..."
    
    if command -v rsync >/dev/null 2>&1; then
        rsync -av "${BACKUP_DIR}/${BACKUP_NAME}"* "$BACKUP_REMOTE_PATH/" || print_warning "Remote sync failed"
    elif command -v rclone >/dev/null 2>&1; then
        rclone copy "${BACKUP_DIR}/${BACKUP_NAME}"* "$BACKUP_REMOTE_PATH/" || print_warning "Remote sync failed"
    else
        print_warning "No remote sync tool available (install rsync or rclone)"
    fi
fi

echo "To restore this backup:"
echo "  ./scripts/restore.sh ${BACKUP_NAME}"
echo ""
echo "To schedule automatic backups:"
echo "  Add to crontab: 0 2 * * * /path/to/kinect/scripts/backup.sh"
echo ""