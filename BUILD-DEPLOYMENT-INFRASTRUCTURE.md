# Building Kinect Deployment Infrastructure

This document outlines how to build the missing deployment infrastructure to enable the automated installation methods referenced in the documentation.

## 🎯 Current State

The Kinect self-hosted deployment is **ready for local use** but lacks the following infrastructure:

- ❌ Public GitHub repository (`kinect/self-hosted`)
- ❌ Docker Hub images (`kinect/self-hosted`)  
- ❌ Domain registration (`get.kinect.app`)
- ❌ Installation script hosting
- ❌ Automated release pipeline

## 🚧 Infrastructure Needed

### 1. GitHub Repository Setup

**Create public repository**: `kinect/self-hosted`

```bash
# Initialize public repository
gh repo create kinect/self-hosted --public --description "Privacy-first self-hosted relationship manager"

# Push current code
git remote add origin https://github.com/kinect/self-hosted.git
git push -u origin main

# Setup repository topics and description
gh repo edit --add-topic "relationship-management,privacy,self-hosted,docker"
```

**Required repository structure:**
```
kinect/self-hosted/
├── install.sh                    # One-line installation script
├── docker-compose.yml            # Production docker-compose
├── .github/workflows/
│   ├── build-images.yml         # Docker image builds
│   ├── release.yml              # Automated releases
│   └── test.yml                 # CI/CD testing
├── docs/
│   ├── installation.md
│   └── troubleshooting.md
└── examples/
    ├── nginx-proxy/
    └── traefik-proxy/
```

### 2. Docker Hub Publishing

**Setup Docker Hub repository**: `kinect/self-hosted`

```bash
# Login to Docker Hub
docker login

# Build and tag images
docker build -f backend/Dockerfile.selfhosted -t kinect/self-hosted:backend-latest .
docker build -f frontend-web/Dockerfile.selfhosted -t kinect/self-hosted:frontend-latest .

# Create multi-arch images
docker buildx create --name multiarch --use
docker buildx build --platform linux/amd64,linux/arm64 \
  -f backend/Dockerfile.selfhosted \
  -t kinect/self-hosted:backend-latest --push .
```

**Automated builds with GitHub Actions:**

```yaml
# .github/workflows/build-images.yml
name: Build Docker Images

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
        
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
          
      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: .
          file: backend/Dockerfile.selfhosted
          platforms: linux/amd64,linux/arm64
          push: true
          tags: kinect/self-hosted:backend-latest
          
      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: .
          file: frontend-web/Dockerfile.selfhosted
          platforms: linux/amd64,linux/arm64
          push: true
          tags: kinect/self-hosted:frontend-latest
```

### 3. Domain & Hosting Setup

**Domain registration**: `get.kinect.app`

```bash
# DNS Configuration (using Cloudflare)
# A record: get.kinect.app -> [server-ip]
# CNAME: www.get.kinect.app -> get.kinect.app
```

**Static hosting for install script**:

```nginx
# nginx config for get.kinect.app
server {
    listen 443 ssl http2;
    server_name get.kinect.app;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /var/www/kinect-install;
    
    # Main install script
    location / {
        default_type text/plain;
        add_header Content-Type "text/plain; charset=utf-8";
        try_files /install.sh =404;
    }
    
    # Version-specific scripts
    location /v1/ {
        try_files $uri /install.sh;
    }
    
    # Health check
    location /health {
        return 200 "OK";
    }
}
```

### 4. Production Install Script

**Create `/var/www/kinect-install/install.sh`:**

```bash
#!/bin/bash
# Kinect Self-Hosted Installation Script
# Usage: curl -sSL https://get.kinect.app | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }

# Configuration
REPO_URL="https://github.com/kinect/self-hosted.git"
INSTALL_DIR="${KINECT_INSTALL_DIR:-$HOME/kinect}"
COMPOSE_FILE="docker-compose.yml"

main() {
    echo "🔗 Kinect Self-Hosted Installer"
    echo "==============================="
    
    # Check requirements
    check_requirements
    
    # Install
    download_kinect
    setup_environment
    start_services
    
    print_success "Installation complete!"
    echo "Access Kinect at: http://localhost:3000"
}

check_requirements() {
    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is required but not installed"
        echo "Install from: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    # Check Docker Compose
    if ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose v2 is required"
        exit 1
    fi
    
    print_success "Requirements satisfied"
}

download_kinect() {
    print_info "Downloading Kinect..."
    
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Directory exists, updating..."
        cd "$INSTALL_DIR"
        git pull origin main
    else
        git clone "$REPO_URL" "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
    
    print_success "Download complete"
}

setup_environment() {
    print_info "Setting up environment..."
    
    # Generate secrets
    if [ ! -f .env ]; then
        cp .env.example .env
        
        # Replace placeholders with generated values
        sed -i "s/your-secret-key-here/$(openssl rand -base64 32)/" .env
        sed -i "s/your-refresh-secret-here/$(openssl rand -base64 32)/" .env
    fi
    
    print_success "Environment configured"
}

start_services() {
    print_info "Starting services..."
    
    docker compose up -d
    
    # Wait for health check
    sleep 15
    
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        print_success "Services started successfully"
    else
        print_error "Services may not be ready yet"
        echo "Check status with: docker compose logs"
    fi
}

# Run installer
main "$@"
```

### 5. Release Automation

**GitHub Actions for releases:**

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Create Release
        uses: actions/create-release@v1
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Update install script
        run: |
          # Update version in install script
          sed -i "s/VERSION=.*/VERSION=${{ github.ref }}/" install.sh
          
          # Deploy to hosting
          scp install.sh user@server:/var/www/kinect-install/
```

### 6. Documentation Website

**Create simple landing page** at `get.kinect.app`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Kinect Self-Hosted</title>
    <style>
        body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
        .hero { text-align: center; margin: 2rem 0; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>🔗 Kinect Self-Hosted</h1>
        <p>Privacy-first relationship management</p>
    </div>
    
    <h2>Quick Install</h2>
    <pre><code>curl -sSL https://get.kinect.app | bash</code></pre>
    
    <h2>What you get</h2>
    <ul>
        <li>✅ Complete privacy - your data never leaves your device</li>
        <li>✅ No external dependencies</li>
        <li>✅ Offline-capable web application</li>
        <li>✅ Contact import from major platforms</li>
    </ul>
    
    <p><a href="https://github.com/kinect/self-hosted">View on GitHub</a></p>
</body>
</html>
```

## 🎯 Implementation Priorities

### Phase 1: Basic Infrastructure (Week 1)
1. ✅ Create GitHub repository `kinect/self-hosted`
2. ✅ Setup basic CI/CD pipeline
3. ✅ Publish initial Docker images
4. ✅ Test local installation

### Phase 2: Domain & Hosting (Week 2)
1. ✅ Register `get.kinect.app` domain
2. ✅ Setup static hosting for install script
3. ✅ Create landing page
4. ✅ Test remote installation

### Phase 3: Polish & Documentation (Week 3)
1. ✅ Comprehensive documentation
2. ✅ Troubleshooting guides
3. ✅ Video tutorials
4. ✅ Community setup (Discord/Discussions)

## 🔧 Testing the Infrastructure

### Local Testing
```bash
# Test Docker builds
docker build -f backend/Dockerfile.selfhosted -t test-backend .
docker build -f frontend-web/Dockerfile.selfhosted -t test-frontend .

# Test compose setup
docker compose -f docker-compose.selfhosted.yml up -d
curl http://localhost:3000
```

### Remote Testing
```bash
# Test install script
curl -sSL https://get.kinect.app | bash

# Test Docker pulls
docker pull kinect/self-hosted:backend-latest
docker pull kinect/self-hosted:frontend-latest
```

## 📊 Monitoring & Analytics

### Essential Metrics
- Installation success rate
- Docker image pull counts
- GitHub repository stats
- Error reports from install script

### Privacy-Respecting Analytics
```javascript
// Simple, privacy-first analytics
// No personal data, just basic usage stats
{
  "install_date": "2024-01",
  "platform": "linux",
  "install_method": "curl",
  "success": true
}
```

## 🚀 Future Enhancements

### Planned Features
- **Multi-architecture support**: ARM64, x86_64
- **Package managers**: Homebrew, APT, Snap
- **Cloud templates**: AWS, DigitalOcean one-click
- **Kubernetes manifests**: Helm charts
- **Update system**: Automatic updates with rollback

### Community Features
- **Plugin system**: Custom integrations
- **Themes**: UI customization
- **Languages**: Internationalization
- **Mobile apps**: React Native builds

---

## 💡 Quick Start for Infrastructure

To begin building this infrastructure:

1. **Create organization**: `kinect` on GitHub
2. **Register domain**: `get.kinect.app`
3. **Setup hosting**: Simple VPS with nginx
4. **Build images**: Push to Docker Hub
5. **Test installation**: End-to-end validation

Total infrastructure cost: ~$20/month (domain + basic VPS)
Implementation time: ~2-3 weeks part-time

The self-hosted deployment is **production-ready** - it just needs the distribution infrastructure to make it easily accessible to users.