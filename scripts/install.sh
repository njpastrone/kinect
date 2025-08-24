#!/bin/bash

# Kinect Self-Hosted Local Installation Script
# This script sets up Kinect with Docker Compose from local source

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
INSTALL_DIR="${KINECT_INSTALL_DIR:-$(pwd)}"  # Use current directory by default
COMPOSE_FILE="docker-compose.selfhosted.yml"

# Note: This script is designed to run from within the Kinect repository
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: This script must be run from the Kinect repository root"
    echo "Make sure $COMPOSE_FILE exists in the current directory"
    exit 1
fi

# Functions
print_header() {
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}     Kinect Self-Hosted Installation${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

check_requirements() {
    echo "Checking system requirements..."
    
    # Check for Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo "Please install Docker from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker found: $(docker --version)"
    
    # Check for Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        # Check for docker compose (v2)
        if ! docker compose version &> /dev/null; then
            print_error "Docker Compose is not installed"
            echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
            exit 1
        fi
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    print_success "Docker Compose found"
    
    # Check for Git (optional)
    if command -v git &> /dev/null; then
        print_success "Git found: $(git --version)"
        USE_GIT=true
    else
        print_warning "Git not found, will download as archive"
        USE_GIT=false
    fi
    
    # Check available ports
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 3000 is already in use"
        read -p "Use alternative port? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter port number (e.g., 3001): " ALT_PORT
            export FRONTEND_PORT=$ALT_PORT
        else
            exit 1
        fi
    fi
    
    echo ""
}

setup_kinect() {
    echo "Setting up Kinect from local source..."
    
    # We're already in the correct directory (repository root)
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the Kinect repository root?"
        exit 1
    fi
    
    print_success "Kinect source verified in $INSTALL_DIR"
    echo ""
}

generate_secrets() {
    echo "Generating secure secrets..."
    
    # Check if .env already exists
    if [ -f .env ]; then
        print_warning ".env file exists, backing up to .env.backup"
        cp .env .env.backup
    fi
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    DATA_ENCRYPTION_KEY=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    
    # Create .env file
    cat > .env << EOF
# Kinect Self-Hosted Configuration
# Generated on $(date)

# Security (auto-generated, do not share!)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
DATA_ENCRYPTION_KEY=${DATA_ENCRYPTION_KEY}
SESSION_SECRET=${SESSION_SECRET}

# Network
FRONTEND_PORT=${FRONTEND_PORT:-3000}
BACKEND_PORT=3001

# Features
ALLOW_REGISTRATION=true
ENABLE_TELEMETRY=false
ENABLE_ANALYTICS=false
SELF_HOSTED=true

# Database
MONGODB_URI=mongodb://mongodb:27017/kinect

# Paths (Docker volumes)
CONFIG_PATH=./config
IMPORT_PATH=./imports
EXPORT_PATH=./exports
BACKUP_PATH=./backups
EOF
    
    print_success "Configuration file created"
    echo ""
}

create_directories() {
    echo "Creating data directories..."
    
    mkdir -p data/db
    mkdir -p config
    mkdir -p imports
    mkdir -p exports
    mkdir -p backups
    mkdir -p scripts
    
    # Set appropriate permissions
    chmod 755 data config imports exports backups scripts
    
    print_success "Data directories created"
    echo ""
}

create_helper_scripts() {
    echo "Creating helper scripts..."
    
    # Create backup script
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash
# Kinect Backup Script

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/kinect_backup_${DATE}"

echo "Starting backup..."

# Backup MongoDB
docker exec kinect-db mongodump --archive="${BACKUP_FILE}.archive" --db=kinect

# Backup configuration
tar -czf "${BACKUP_FILE}_config.tar.gz" config/ .env

# Backup imports/exports
tar -czf "${BACKUP_FILE}_data.tar.gz" imports/ exports/

echo "Backup completed: ${BACKUP_FILE}"

# Clean old backups (keep last 30 days)
find ${BACKUP_DIR} -name "*.archive" -mtime +30 -delete
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +30 -delete
EOF
    chmod +x scripts/backup.sh
    
    # Create update script
    cat > scripts/update.sh << 'EOF'
#!/bin/bash
# Kinect Update Script

echo "Checking for updates..."

# Backup before update
./scripts/backup.sh

# Pull latest images
docker-compose -f docker-compose.selfhosted.yml pull

# Restart services
docker-compose -f docker-compose.selfhosted.yml down
docker-compose -f docker-compose.selfhosted.yml up -d

echo "Update completed!"
EOF
    chmod +x scripts/update.sh
    
    # Create import script
    cat > scripts/import-contacts.sh << 'EOF'
#!/bin/bash
# Contact Import Helper

if [ $# -eq 0 ]; then
    echo "Usage: $0 <import-file>"
    echo "Supported formats: .csv, .vcf, .json"
    exit 1
fi

FILE=$1
FILENAME=$(basename "$FILE")
IMPORT_DIR="./imports"

# Copy file to imports directory
cp "$FILE" "$IMPORT_DIR/$FILENAME"

# Notify user
echo "File copied to import directory"
echo "Please go to http://localhost:3000/settings/import to complete import"
EOF
    chmod +x scripts/import-contacts.sh
    
    print_success "Helper scripts created"
    echo ""
}

start_services() {
    echo "Starting Kinect services..."
    
    # Start with docker-compose
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    echo "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if docker ps | grep -q kinect-web; then
        print_success "Frontend service started"
    else
        print_error "Frontend service failed to start"
    fi
    
    if docker ps | grep -q kinect-api; then
        print_success "Backend service started"
    else
        print_error "Backend service failed to start"
    fi
    
    if docker ps | grep -q kinect-db; then
        print_success "Database service started"
    else
        print_error "Database service failed to start"
    fi
    
    echo ""
}

create_desktop_shortcut() {
    # Optional: Create desktop shortcut for easy access
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        DESKTOP_FILE="$HOME/.local/share/applications/kinect.desktop"
        cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Kinect
Comment=Relationship Management System
Icon=$INSTALL_DIR/icon.png
Exec=xdg-open http://localhost:${FRONTEND_PORT:-3000}
Categories=Office;Network;
Terminal=false
EOF
        chmod +x "$DESKTOP_FILE"
        print_success "Desktop shortcut created"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        print_warning "To create a macOS shortcut, add http://localhost:${FRONTEND_PORT:-3000} to your bookmarks"
    fi
}

print_completion() {
    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}     Installation Complete!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "Kinect is now running at:"
    echo -e "${GREEN}http://localhost:${FRONTEND_PORT:-3000}${NC}"
    echo ""
    echo "Default credentials:"
    echo "  Username: admin"
    echo "  Password: changeme (change on first login)"
    echo ""
    echo "Useful commands:"
    echo "  Start:   cd $INSTALL_DIR && $COMPOSE_CMD -f $COMPOSE_FILE up -d"
    echo "  Stop:    cd $INSTALL_DIR && $COMPOSE_CMD -f $COMPOSE_FILE down"
    echo "  Backup:  cd $INSTALL_DIR && ./scripts/backup.sh"
    echo "  Update:  cd $INSTALL_DIR && ./scripts/update.sh"
    echo "  Logs:    cd $INSTALL_DIR && $COMPOSE_CMD -f $COMPOSE_FILE logs -f"
    echo ""
    echo "Import contacts:"
    echo "  ./scripts/import-contacts.sh <your-contacts.csv>"
    echo ""
    echo "Documentation: See SELFHOSTED-DEPLOYMENT.md and QUICKSTART.md"
    echo ""
}

# Main installation flow
main() {
    print_header
    check_requirements
    setup_kinect
    generate_secrets
    create_directories
    create_helper_scripts
    start_services
    create_desktop_shortcut
    print_completion
}

# Handle errors
trap 'print_error "Installation failed! Check the error messages above."; exit 1' ERR

# Run main installation
main