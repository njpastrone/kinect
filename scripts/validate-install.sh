#!/bin/bash

# Kinect Self-Hosted Installation Validator
# This script verifies that all components are running correctly

set -e

# Configuration
COMPOSE_FILE="docker-compose.selfhosted.yml"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="3001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo -e "${BLUE}ℹ${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}     Kinect Installation Validation${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Variables for tracking issues
ISSUES_FOUND=0
WARNINGS_FOUND=0

log_issue() {
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    print_error "$1"
}

log_warning() {
    WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
    print_warning "$1"
}

check_docker() {
    print_info "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        log_issue "Docker is not installed or not in PATH"
        return 1
    fi
    print_success "Docker is installed: $(docker --version)"
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_issue "Docker daemon is not running"
        return 1
    fi
    print_success "Docker daemon is running"
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        print_success "Docker Compose is installed: $(docker-compose --version)"
    elif docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
        print_success "Docker Compose v2 is installed: $(docker compose version)"
    else
        log_issue "Docker Compose is not installed"
        return 1
    fi
    
    echo ""
    return 0
}

check_compose_file() {
    print_info "Checking Docker Compose configuration..."
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_issue "Docker Compose file not found: $COMPOSE_FILE"
        return 1
    fi
    print_success "Docker Compose file found"
    
    # Validate compose file syntax
    if ! $COMPOSE_CMD -f "$COMPOSE_FILE" config &> /dev/null; then
        log_issue "Docker Compose file has syntax errors"
        return 1
    fi
    print_success "Docker Compose file is valid"
    
    echo ""
    return 0
}

check_containers() {
    print_info "Checking container status..."
    
    local containers=("kinect-db" "kinect-api" "kinect-web")
    local all_running=true
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^${container}$"; then
            print_success "Container ${container} is running"
        else
            log_issue "Container ${container} is not running"
            all_running=false
        fi
    done
    
    if [ "$all_running" = false ]; then
        echo ""
        print_info "Container status:"
        docker ps --filter name=kinect --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    fi
    
    echo ""
    return 0
}

check_database() {
    print_info "Checking database connectivity..."
    
    # Check if MongoDB container is running
    if ! docker ps | grep -q kinect-db; then
        log_issue "MongoDB container is not running"
        return 1
    fi
    
    # Test database connection
    if docker exec kinect-db mongosh --eval "db.adminCommand('ping')" --quiet &> /dev/null; then
        print_success "Database is responding"
    else
        log_issue "Cannot connect to database"
        return 1
    fi
    
    # Check database exists
    if docker exec kinect-db mongosh --eval "use kinect; db.stats()" --quiet &> /dev/null; then
        print_success "Kinect database exists"
    else
        log_warning "Kinect database does not exist yet (normal for first run)"
    fi
    
    echo ""
    return 0
}

check_backend_api() {
    print_info "Checking backend API..."
    
    # Wait for API to be ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:${BACKEND_PORT}/api/health" &> /dev/null; then
            print_success "Backend API is responding"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Backend API is not responding after ${max_attempts} attempts"
            
            # Show API logs for debugging
            echo ""
            print_info "Backend API logs (last 20 lines):"
            docker logs kinect-api --tail 20 || log_warning "Cannot retrieve API logs"
            
            return 1
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    # Test API endpoints
    local endpoints=("/api/health" "/api/auth/status")
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "http://localhost:${BACKEND_PORT}${endpoint}" &> /dev/null; then
            print_success "Endpoint ${endpoint} is accessible"
        else
            log_warning "Endpoint ${endpoint} is not accessible"
        fi
    done
    
    echo ""
    return 0
}

check_frontend() {
    print_info "Checking frontend application..."
    
    # Check if frontend is accessible
    if curl -f -s "http://localhost:${FRONTEND_PORT}" &> /dev/null; then
        print_success "Frontend is accessible at http://localhost:${FRONTEND_PORT}"
    else
        log_error "Frontend is not accessible"
        
        # Show frontend logs
        echo ""
        print_info "Frontend logs (last 20 lines):"
        docker logs kinect-web --tail 20 || log_warning "Cannot retrieve frontend logs"
        
        return 1
    fi
    
    # Check if API proxy is working
    if curl -f -s "http://localhost:${FRONTEND_PORT}/api/health" &> /dev/null; then
        print_success "API proxy is working"
    else
        log_warning "API proxy may not be working correctly"
    fi
    
    echo ""
    return 0
}

check_data_directories() {
    print_info "Checking data directories..."
    
    local directories=("data/db" "config" "imports" "exports" "backups")
    
    for dir in "${directories[@]}"; do
        if [ -d "$dir" ]; then
            print_success "Directory ${dir} exists"
        else
            log_warning "Directory ${dir} does not exist"
        fi
    done
    
    # Check permissions
    if [ -w "imports" ] && [ -w "exports" ] && [ -w "backups" ]; then
        print_success "Data directories are writable"
    else
        log_warning "Some data directories may not be writable"
    fi
    
    echo ""
    return 0
}

check_configuration() {
    print_info "Checking configuration..."
    
    # Check .env file
    if [ -f ".env" ]; then
        print_success "Environment configuration file exists"
        
        # Check for important variables
        local required_vars=("JWT_SECRET" "JWT_REFRESH_SECRET")
        local missing_vars=()
        
        for var in "${required_vars[@]}"; do
            if ! grep -q "^${var}=" .env || grep -q "^${var}=change-this" .env; then
                missing_vars+=("$var")
            fi
        done
        
        if [ ${#missing_vars[@]} -eq 0 ]; then
            print_success "Security configuration looks good"
        else
            log_warning "Some security variables need to be configured: ${missing_vars[*]}"
        fi
    else
        log_warning "No .env file found (using defaults)"
    fi
    
    echo ""
    return 0
}

check_network() {
    print_info "Checking network connectivity..."
    
    # Check if containers can communicate
    if docker exec kinect-api curl -f -s http://mongodb:27017 &> /dev/null; then
        print_success "Backend can reach database"
    else
        log_error "Backend cannot reach database"
    fi
    
    # Check external connectivity (should fail for self-hosted)
    if docker exec kinect-api curl -f -s --connect-timeout 5 https://google.com &> /dev/null; then
        log_warning "Containers have external internet access (not required for self-hosted)"
    else
        print_success "Containers are properly isolated from internet"
    fi
    
    echo ""
    return 0
}

check_performance() {
    print_info "Checking performance metrics..."
    
    # Check container resource usage
    local containers=("kinect-db" "kinect-api" "kinect-web")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^${container}$"; then
            local stats=$(docker stats "$container" --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}")
            print_success "Container ${container} stats: $(echo "$stats" | tail -n 1)"
        fi
    done
    
    # Check disk usage
    local disk_usage=$(df -h . | tail -n 1 | awk '{print $5}')
    print_info "Disk usage: ${disk_usage} used"
    
    echo ""
    return 0
}

run_tests() {
    print_info "Running basic functionality tests..."
    
    # Test user creation endpoint (should work)
    local test_response
    test_response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "http://localhost:${BACKEND_PORT}/api/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}' 2>/dev/null)
    
    if [ "$test_response" = "201" ] || [ "$test_response" = "400" ]; then
        print_success "Authentication endpoint is working"
    else
        log_warning "Authentication endpoint returned unexpected response: $test_response"
    fi
    
    echo ""
    return 0
}

generate_report() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}     Validation Report${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
    
    if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
        echo -e "${GREEN}🎉 All checks passed! Kinect is running perfectly.${NC}"
        echo ""
        echo "Access your Kinect instance at:"
        echo -e "${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
    elif [ $ISSUES_FOUND -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Installation is working with ${WARNINGS_FOUND} warnings.${NC}"
        echo ""
        echo "Kinect should be accessible at:"
        echo -e "${YELLOW}http://localhost:${FRONTEND_PORT}${NC}"
        echo ""
        echo "Consider reviewing the warnings above."
    else
        echo -e "${RED}❌ Found ${ISSUES_FOUND} critical issues and ${WARNINGS_FOUND} warnings.${NC}"
        echo ""
        echo "Please fix the issues above before using Kinect."
        echo ""
        echo "For help, check:"
        echo "- Docker logs: docker-compose -f $COMPOSE_FILE logs"
        echo "- Documentation: SELFHOSTED-DEPLOYMENT.md"
    fi
    
    echo ""
    echo "System information:"
    echo "- OS: $(uname -s) $(uname -r)"
    echo "- Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
    echo "- Compose: $($COMPOSE_CMD --version | cut -d' ' -f3 | tr -d ',')"
    echo "- Containers: $(docker ps --filter name=kinect --format '{{.Names}}' | wc -l) running"
    echo ""
}

# Main execution
main() {
    print_header
    
    check_docker
    check_compose_file
    check_containers
    check_database
    check_backend_api
    check_frontend
    check_data_directories
    check_configuration
    check_network
    check_performance
    run_tests
    
    generate_report
    
    # Exit with error if critical issues found
    if [ $ISSUES_FOUND -gt 0 ]; then
        exit 1
    fi
}

# Handle interruption gracefully
trap 'echo -e "\n${YELLOW}Validation interrupted${NC}"; exit 130' INT

main "$@"