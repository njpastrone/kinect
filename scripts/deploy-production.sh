#!/bin/bash

# =====================================================
# Kinect Production Deployment Script
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="kinect"
BACKUP_DIR="./backups/pre-deployment"
ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.production.yml"

echo -e "${GREEN}🚀 Starting Kinect Production Deployment${NC}"
echo "=================================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Environment file $ENV_FILE not found. Please copy .env.production.example to $ENV_FILE and configure it."
    fi
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker compose file $COMPOSE_FILE not found."
    fi
    
    print_status "Prerequisites check passed ✓"
}

# Validate environment configuration
validate_environment() {
    print_status "Validating environment configuration..."
    
    source "$ENV_FILE"
    
    # Check required variables
    required_vars=(
        "DOMAIN_NAME"
        "FRONTEND_URL"
        "MONGO_ROOT_USERNAME"
        "MONGO_ROOT_PASSWORD"
        "JWT_SECRET"
        "JWT_REFRESH_SECRET"
        "DATA_ENCRYPTION_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Required environment variable $var is not set in $ENV_FILE"
        fi
    done
    
    # Check if secrets are still default values
    if [[ "$JWT_SECRET" == *"CHANGE_ME"* ]]; then
        print_error "JWT_SECRET is still set to default value. Please generate a secure secret."
    fi
    
    if [[ "$MONGO_ROOT_PASSWORD" == *"CHANGE_ME"* ]]; then
        print_error "MONGO_ROOT_PASSWORD is still set to default value. Please set a secure password."
    fi
    
    print_status "Environment validation passed ✓"
}

# Create backup
create_backup() {
    if [ -d "data" ] || [ -d "backups" ]; then
        print_status "Creating backup of existing data..."
        
        mkdir -p "$BACKUP_DIR"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        
        if [ -d "data" ]; then
            cp -r data "$BACKUP_DIR/data_$TIMESTAMP" || print_warning "Could not backup data directory"
        fi
        
        if [ -d "backups" ] && [ "$(ls -A backups)" ]; then
            cp -r backups "$BACKUP_DIR/backups_$TIMESTAMP" || print_warning "Could not backup backups directory"
        fi
        
        print_status "Backup created at $BACKUP_DIR ✓"
    fi
}

# Build and start services
deploy_services() {
    print_status "Building and starting production services..."
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    # Build custom images
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    
    # Start core services
    print_status "Starting database..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d mongodb
    
    # Wait for database
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Start backend
    print_status "Starting backend API..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d backend
    
    # Wait for backend
    print_status "Waiting for backend to be ready..."
    sleep 15
    
    # Start frontend
    print_status "Starting frontend..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d frontend
    
    print_status "Core services deployed ✓"
}

# Health checks
perform_health_checks() {
    print_status "Performing health checks..."
    
    # Check if containers are running
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        print_error "Some containers are not running. Check with: docker-compose -f $COMPOSE_FILE ps"
    fi
    
    # Wait for services to be fully ready
    print_status "Waiting for services to be fully ready..."
    sleep 30
    
    # Check backend health
    source "$ENV_FILE"
    BACKEND_URL="http://localhost:3001"
    if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
        print_status "Backend health check passed ✓"
    else
        print_warning "Backend health check failed. Service may still be starting..."
    fi
    
    # Check frontend
    FRONTEND_PORT="${FRONTEND_PORT:-80}"
    if curl -f "http://localhost:$FRONTEND_PORT/" > /dev/null 2>&1; then
        print_status "Frontend health check passed ✓"
    else
        print_warning "Frontend health check failed. Service may still be starting..."
    fi
}

# Start optional services
deploy_optional_services() {
    print_status "Starting optional services..."
    
    source "$ENV_FILE"
    
    # Start backup service if enabled
    if [[ "${ENABLE_BACKUPS}" == "true" ]]; then
        print_status "Starting backup service..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile backup up -d backup
    fi
    
    # Start monitoring if enabled
    if [[ "${ENABLE_MONITORING}" == "true" ]]; then
        print_status "Starting monitoring..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile monitoring up -d monitoring
    fi
    
    # Start auto-updater if enabled
    if [[ "${ENABLE_AUTO_UPDATES}" == "true" ]]; then
        print_status "Starting auto-updater..."
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile auto-update up -d watchtower
    fi
}

# Display final information
show_deployment_info() {
    source "$ENV_FILE"
    
    echo ""
    echo "=================================================="
    echo -e "${GREEN}🎉 Kinect Production Deployment Complete!${NC}"
    echo "=================================================="
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: ${FRONTEND_URL}"
    echo "   Backend Health: ${FRONTEND_URL}/api/health"
    echo ""
    echo "📊 Management Commands:"
    echo "   View logs:       docker-compose -f $COMPOSE_FILE logs -f"
    echo "   Stop services:   docker-compose -f $COMPOSE_FILE down"
    echo "   Restart:         docker-compose -f $COMPOSE_FILE restart"
    echo "   Status:          docker-compose -f $COMPOSE_FILE ps"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   Backend shell:   docker exec -it kinect-api-prod bash"
    echo "   Database shell:  docker exec -it kinect-db-prod mongosh"
    echo "   View frontend:   docker logs kinect-web-prod"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Test the application at ${FRONTEND_URL}"
    echo "   2. Create your first user account"
    echo "   3. Configure reminder email settings"
    echo "   4. Set up regular backups"
    echo ""
    
    if [[ "${ENABLE_AUTO_UPDATES}" != "true" ]]; then
        echo "💡 Tip: Enable auto-updates by setting ENABLE_AUTO_UPDATES=true in $ENV_FILE"
    fi
    
    echo "📚 Documentation: ./DEPLOYMENT.md"
    echo "🆘 Support: https://github.com/your-repo/kinect/issues"
    echo ""
}

# Main deployment flow
main() {
    check_prerequisites
    validate_environment
    create_backup
    deploy_services
    perform_health_checks
    deploy_optional_services
    show_deployment_info
}

# Handle script arguments
case "${1:-}" in
    "--help"|"-h")
        echo "Kinect Production Deployment Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --validate     Only validate environment configuration"
        echo "  --backup       Create backup only"
        echo ""
        echo "Prerequisites:"
        echo "  1. Copy .env.production.example to .env.production"
        echo "  2. Fill in all required values in .env.production"
        echo "  3. Ensure Docker and Docker Compose are installed"
        echo ""
        exit 0
        ;;
    "--validate")
        check_prerequisites
        validate_environment
        print_status "Validation complete ✓"
        exit 0
        ;;
    "--backup")
        create_backup
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1. Use --help for usage information."
        ;;
esac