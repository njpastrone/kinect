# Kinect - Privacy-First Relationship Manager

🔒 **Self-Hosted** • 🛡️ **Error-Resilient** • 🏠 **100% Private**

## Overview

Kinect is a privacy-first, self-hosted relationship management application that helps users maintain meaningful connections with friends and loved ones. Built with enterprise-grade error handling and comprehensive user feedback systems, Kinect ensures your personal relationship data stays completely under your control.

## Core Features

### 1. Relationship Management

- Create and manage categorized contact lists (Best Friends, Friends, Acquaintances, Custom)
- Store essential contact information (name, birthday, relationship category)
- Full CRUD operations for lists and contacts

### 2. Communication Tracking

- Integration with phone call logs via API
- Automatic tracking of last contact date for each person
- Real-time synchronization of communication data

### 3. Smart Notifications

- Customizable reminder intervals per relationship category
- Default notification schedule:
  - Best Friends: 30 days
  - Friends: 90 days
  - Acquaintances: 180 days
- Push notifications when contact thresholds are exceeded

### 4. Error Handling & Reliability

- Comprehensive error boundaries with automatic retry mechanisms
- Professional form validation with clear user feedback
- Network resilience with exponential backoff and circuit breakers
- Development debugging tools for troubleshooting
- Optimistic UI updates with graceful rollback on failures

### 5. Self-Hosted Deployment

- Docker Compose configuration with health checks
- Nginx reverse proxy for API routing
- MongoDB with automatic backup capabilities
- Zero external dependencies or cloud services
- Complete data privacy and ownership

## Technical Requirements

### MVP Scope

- User authentication and account management
- Basic contact list functionality
- Phone log API integration (read-only access)
- Notification system with default intervals
- Simple, intuitive UI/UX
- Data persistence and user privacy

### Technology Stack (Implemented)

- **Backend**: Node.js/Express with TypeScript
- **Database**: MongoDB with health monitoring
- **Frontend**: React with Vite and TypeScript
- **Deployment**: Docker Compose with multi-stage builds
- **Proxy**: Nginx with security headers and compression
- **Error Handling**: React Error Boundaries with retry logic
- **State Management**: Zustand with optimistic updates
- **Authentication**: JWT-based with refresh tokens

## Project Structure

kinect/
├── backend/
│ ├── api/
│ ├── models/
│ ├── services/
│ └── config/
├── frontend-web/
│ ├── src/
│ └── public/
├── ios-app/
│ └── Kinect/
└── shared/
└── types/

## Current Status

**Production Status**: ✅ **Enterprise-Ready with Comprehensive Error Handling**

### Core Application Features

- ✅ User authentication (register, login, password reset)
- ✅ Contact management with full CRUD operations
- ✅ Contact list creation and management
- ✅ Dashboard with statistics and overdue contacts
- ✅ Professional UI/UX with responsive design
- ✅ Real-time data synchronization
- ✅ Contact-to-list bidirectional relationships

### Error Handling & User Experience

- ✅ **Form Validation**: Consistent error display with icons and accessibility
- ✅ **Network Resilience**: Automatic retry with exponential backoff
- ✅ **Error Boundaries**: Graceful failure recovery with retry options
- ✅ **Loading States**: Professional spinners and progress indicators
- ✅ **Toast Notifications**: User feedback for all operations
- ✅ **Optimistic Updates**: Immediate UI response with rollback on failure
- ✅ **Development Tools**: Debug console and error reporting

### Self-Hosted Deployment

- ✅ **Docker Compose**: Complete containerized deployment
- ✅ **Health Checks**: Automated service monitoring
- ✅ **Security**: Non-root containers, security headers, CORS configuration
- ✅ **Backup**: MongoDB backup capabilities
- ✅ **Proxy**: Nginx with compression and caching

### Complete Technology Implementation

- **Backend**: Node.js/Express with TypeScript, comprehensive error handling
- **Database**: MongoDB with Mongoose ODM and health monitoring
- **Frontend**: React with Vite, TypeScript, and error boundaries
- **Styling**: Tailwind CSS with professional loading states
- **State Management**: Zustand with optimistic updates and error handling
- **Forms**: React Hook Form with FormError components
- **Authentication**: JWT-based with bcrypt and refresh tokens
- **Error Handling**: Retry logic, circuit breakers, request deduplication
- **Deployment**: Docker with multi-stage builds and health checks
- **Proxy**: Nginx with API routing and security configuration

## Getting Started

### 🚀 Recommended: Self-Hosted Deployment (5 minutes)

**Complete Docker-based setup with all error handling features:**

```bash
# Clone and start services
git clone <repository-url>
cd kinect
docker compose -f docker-compose.selfhosted.yml up -d

# Access at http://localhost:3000
```

**See [QUICKSTART.md](QUICKSTART.md) for detailed testing instructions and feature verification.**

### 🛠️ Development Setup (for contributors)

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn
- Docker (for self-hosted deployment)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd kinect
```

2. **Install dependencies**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend-web
npm install

# Shared types
cd ../shared
npm install
```

3. **Environment Setup**

```bash
# Backend - create .env file
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

4. **Start Development Servers**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend-web
npm run dev
```

5. **Access the Application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Database Management

```bash
# Development seeding
cd backend
npm run seed    # Add sample data
npm run reset   # Reset database

# Docker deployment backup
docker compose -f docker-compose.selfhosted.yml exec mongodb mongodump --out /backups
```

## Privacy & Security

### 🔒 Privacy-First Architecture
- **100% Self-Hosted**: All data stays on your infrastructure
- **No Cloud Dependencies**: No external services required
- **Zero Telemetry**: No tracking, analytics, or data collection
- **Open Source**: Fully auditable codebase
- **Data Ownership**: Complete control over your relationship data

### 🛡️ Security Features
- **Container Security**: Non-root user execution
- **Network Isolation**: Services run in isolated Docker network
- **Security Headers**: Comprehensive HTTP security headers
- **Authentication**: JWT with refresh tokens and bcrypt hashing
- **CORS Protection**: Configured for secure cross-origin requests

## Error Handling & Reliability

### 🔧 User Experience
- **Smart Retry Logic**: Automatic retry with exponential backoff
- **Error Boundaries**: React components gracefully handle failures
- **Form Validation**: Clear, accessible error messages with icons
- **Loading States**: Professional progress indicators
- **Toast Notifications**: Real-time feedback for all operations

### 🧰 Developer Tools
- **Debug Console**: `window.__debugErrors` for error analytics
- **Error Reports**: Downloadable error data for troubleshooting
- **Development Overlay**: Rich error information in dev mode
- **Health Monitoring**: Service health checks and status endpoints

### 🌐 Network Resilience
- **Circuit Breakers**: Prevent cascading failures
- **Request Deduplication**: Avoid duplicate API calls
- **Optimistic Updates**: Immediate UI feedback with rollback
- **Connection Recovery**: Automatic reconnection handling

## Testing the Application

### Quick Verification
```bash
# Start services
docker compose -f docker-compose.selfhosted.yml up -d

# Test health endpoints
curl http://localhost:3000/health        # Frontend
curl http://localhost:3000/api/health    # Backend

# Check all services are healthy
docker compose -f docker-compose.selfhosted.yml ps
```

### Feature Testing
1. **Form Validation**: Submit empty forms to see error handling
2. **Network Resilience**: Disconnect internet during operations
3. **Error Boundaries**: Use `window.__debugErrors.testError("test")` in console
4. **Debug Tools**: Access `window.__debugErrors.showErrors()` for error history

**Complete testing scenarios available in [QUICKSTART.md](QUICKSTART.md)**

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │    Database     │
│   (React)       │    │   (Node.js)      │    │   (MongoDB)     │
│                 │    │                  │    │                 │
│ • Error Bounds  │◄──►│ • Error Handling │◄──►│ • Health Checks │
│ • Retry Logic   │    │ • Rate Limiting  │    │ • Backup Ready  │
│ • Toast Notify  │    │ • JWT Auth       │    │ • Data Privacy  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                          ┌──────────────────┐
                          │     Nginx        │
                          │   (Proxy)        │
                          │                  │
                          │ • API Routing    │
                          │ • Security Headers│
                          │ • Compression    │
                          └──────────────────┘
```

## What Makes This Special

🏠 **Truly Self-Hosted**: No cloud services, no external dependencies  
🔒 **Privacy-First**: Your data never leaves your infrastructure  
🛡️ **Enterprise-Grade**: Comprehensive error handling and reliability  
🎯 **User-Focused**: Clear feedback and professional UX  
🚀 **Production-Ready**: Docker deployment with health monitoring  
🧰 **Developer-Friendly**: Rich debugging tools and clear documentation

---

*Built for individuals who value privacy and reliability in their personal relationship management.*
