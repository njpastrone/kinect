#!/bin/bash

# Kinect Self-Hosted Restore Script
# This script restores Kinect from a backup

set -e

# Configuration
BACKUP_DIR="./backups"
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

# Usage
usage() {
    echo "Usage: $0 <backup_name> [options]"
    echo ""
    echo "Options:"
    echo "  --database-only    Restore only the database"
    echo "  --config-only      Restore only configuration files"
    echo "  --dry-run          Show what would be restored without doing it"
    echo "  --force            Skip confirmation prompts"
    echo ""
    echo "Available backups:"
    ls -1 "${BACKUP_DIR}" | grep -E "kinect_backup_[0-9]{8}_[0-9]{6}" | sort -r | head -10
    echo ""
    exit 1
}

# Parse arguments
BACKUP_NAME=""
DATABASE_ONLY=false
CONFIG_ONLY=false
DRY_RUN=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --database-only)
            DATABASE_ONLY=true
            shift
            ;;
        --config-only)
            CONFIG_ONLY=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            if [ -z "$BACKUP_NAME" ]; then
                BACKUP_NAME="$1"
            else
                echo "Unknown option: $1"
                usage
            fi
            shift
            ;;
    esac
done

# Validate arguments
if [ -z "$BACKUP_NAME" ]; then
    echo "Error: Backup name required"
    usage
fi

# Check if backup exists
DATABASE_BACKUP="${BACKUP_DIR}/${BACKUP_NAME}.archive"
CONFIG_BACKUP="${BACKUP_DIR}/${BACKUP_NAME}_config.tar.gz"
DATA_BACKUP="${BACKUP_DIR}/${BACKUP_NAME}_data.tar.gz"
MANIFEST_FILE="${BACKUP_DIR}/${BACKUP_NAME}_manifest.txt"

# Check for encrypted backups
if [ ! -f "$DATABASE_BACKUP" ] && [ -f "${DATABASE_BACKUP}.gpg" ]; then
    if command -v gpg >/dev/null 2>&1; then
        print_info "Decrypting backup files..."
        gpg --decrypt "${DATABASE_BACKUP}.gpg" > "$DATABASE_BACKUP"
        gpg --decrypt "${CONFIG_BACKUP}.gpg" > "$CONFIG_BACKUP" 2>/dev/null || true
        gpg --decrypt "${DATA_BACKUP}.gpg" > "$DATA_BACKUP" 2>/dev/null || true
        print_success "Backup files decrypted"
    else
        print_error "Backup is encrypted but GPG is not available"
        exit 1
    fi
fi

# Validate backup files exist
if [ ! -f "$DATABASE_BACKUP" ]; then
    print_error "Database backup not found: $DATABASE_BACKUP"
    exit 1
fi

echo "Kinect Restore"
echo "=============="
echo "Backup: ${BACKUP_NAME}"
echo ""

# Show manifest if available
if [ -f "$MANIFEST_FILE" ]; then
    echo "Backup Information:"
    echo "==================="
    cat "$MANIFEST_FILE"
    echo ""
fi

# Show what will be restored
echo "Restore Plan:"
echo "============="

if [ "$CONFIG_ONLY" = true ]; then
    echo "- Configuration files only"
elif [ "$DATABASE_ONLY" = true ]; then
    echo "- Database only"
else
    echo "- Database (${DATABASE_BACKUP})"
    [ -f "$CONFIG_BACKUP" ] && echo "- Configuration files (${CONFIG_BACKUP})"
    [ -f "$DATA_BACKUP" ] && echo "- Data directories (${DATA_BACKUP})"
fi

echo ""

# Confirmation
if [ "$FORCE" = false ]; then
    read -p "This will overwrite current data. Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Restore cancelled"
        exit 1
    fi
fi

if [ "$DRY_RUN" = true ]; then
    echo "DRY RUN - No changes will be made"
    exit 0
fi

# Create backup of current state
print_info "Creating backup of current state..."
CURRENT_BACKUP="pre_restore_$(date +%Y%m%d_%H%M%S)"
./scripts/backup.sh >/dev/null 2>&1 || print_warning "Failed to backup current state"

# Stop Kinect services
print_info "Stopping Kinect services..."
docker-compose -f "$COMPOSE_FILE" down || print_warning "Services may not have been running"

# Wait for containers to stop
sleep 5

# Restore based on options
if [ "$CONFIG_ONLY" = false ]; then
    # Restore database
    print_info "Restoring database..."
    
    # Start only MongoDB for restore
    docker-compose -f "$COMPOSE_FILE" up -d mongodb
    
    # Wait for MongoDB to be ready
    print_info "Waiting for database to be ready..."
    sleep 10
    
    # Restore database
    docker exec -i kinect-db mongorestore --archive=/backups/$(basename "$DATABASE_BACKUP") --drop --db=kinect
    
    if [ $? -eq 0 ]; then
        print_success "Database restored successfully"
    else
        print_error "Database restore failed"
        exit 1
    fi
fi

if [ "$DATABASE_ONLY" = false ]; then
    # Restore configuration
    if [ -f "$CONFIG_BACKUP" ]; then
        print_info "Restoring configuration files..."
        
        # Backup current .env if it exists
        [ -f .env ] && cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        
        tar -xzf "$CONFIG_BACKUP" || print_warning "Failed to restore some configuration files"
        print_success "Configuration files restored"
    fi
    
    # Restore data directories
    if [ -f "$DATA_BACKUP" ]; then
        print_info "Restoring data directories..."
        tar -xzf "$DATA_BACKUP" || print_warning "Failed to restore some data directories"
        print_success "Data directories restored"
    fi
fi

# Start all services
print_info "Starting Kinect services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be ready
print_info "Waiting for services to start..."
sleep 15

# Health check
print_info "Checking service health..."
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    print_success "Frontend service is healthy"
else
    print_warning "Frontend service may not be ready yet"
fi

if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    print_success "Backend service is healthy"
else
    print_warning "Backend service may not be ready yet"
fi

# Cleanup temporary files
if [ -f "${DATABASE_BACKUP}" ] && [ -f "${DATABASE_BACKUP}.gpg" ]; then
    rm "${DATABASE_BACKUP}" "${CONFIG_BACKUP}" "${DATA_BACKUP}" 2>/dev/null || true
fi

echo ""
echo "========================================"
echo -e "${GREEN}Restore completed successfully!${NC}"
echo "========================================"
echo "Kinect should be available at: http://localhost:3000"
echo ""
echo "Pre-restore backup created: ${CURRENT_BACKUP}"
echo "Check logs with: docker-compose -f ${COMPOSE_FILE} logs -f"
echo ""

# Optional: Send notification
if [ ! -z "$BACKUP_WEBHOOK_URL" ]; then
    curl -X POST "$BACKUP_WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -d "{\"text\":\"Kinect restore completed: ${BACKUP_NAME}\"}" \
         >/dev/null 2>&1 || true
fi