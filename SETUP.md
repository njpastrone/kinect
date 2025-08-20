# Kinect App - Setup Instructions

## Prerequisites

- Node.js 18+ and npm 9+
- MongoDB (or use Docker)
- iOS development: Xcode 14+ (for iOS app)
- Docker and Docker Compose (optional, for containerized development)

## Quick Start

### 1. Install Dependencies

```bash
# Install all dependencies for the monorepo
npm install
```

### 2. Environment Setup

Copy the example environment file for the backend:

```bash
cp backend/.env.example backend/.env
```

Update the `.env` file with your configuration:
- MongoDB connection string
- JWT secrets (generate secure random strings for production)
- API URLs

### 3. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start MongoDB and Redis with Docker Compose
docker-compose up -d mongodb redis
```

#### Option B: Local MongoDB

Ensure MongoDB is running locally on port 27017.

### 4. Build Shared Types

```bash
# Build the shared types package
npm run build:shared
```

### 5. Start Development Servers

#### All Services (Backend + Web Frontend)

```bash
npm run dev:all
```

This will start:
- Backend API on http://localhost:3001
- Web Frontend on http://localhost:5173

#### Individual Services

```bash
# Backend only
npm run dev:backend

# Web frontend only
npm run dev:web

# iOS app (requires Expo CLI)
npm run dev:ios
```

## Development Workflow

### Backend API

The backend runs on Express with TypeScript and includes:
- JWT authentication with refresh tokens
- MongoDB models for User, Contact, ContactList, and CommunicationLog
- RESTful API endpoints
- Input validation with Joi
- Error handling middleware

API endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/contacts` - Get user's contacts
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `GET /api/lists` - Get contact lists
- `POST /api/lists` - Create new list
- `GET /api/notifications/upcoming` - Get overdue contacts

### Frontend Web

React application with Vite, featuring:
- Authentication flow with protected routes
- Contact management (CRUD operations)
- Dashboard with statistics
- Responsive design with Tailwind CSS
- Form handling with React Hook Form
- State management with Zustand

### iOS App

React Native application using Expo:
- Native navigation with React Navigation
- AsyncStorage for token persistence
- Shared API service with web
- Native styling and components

## Testing

```bash
# Run tests for all packages
npm test

# Run tests for specific package
npm run test --workspace=backend
npm run test --workspace=frontend-web
```

## Building for Production

```bash
# Build all packages
npm run build:backend
npm run build:web

# Build iOS app
cd ios-app
expo build:ios
```

## Docker Development

For a fully containerized development environment:

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

## Common Issues

### MongoDB Connection Failed
- Ensure MongoDB is running
- Check connection string in `.env`
- If using Docker, wait for containers to fully start

### Port Already in Use
- Backend default: 3001
- Frontend default: 5173
- MongoDB default: 27017
- Change ports in respective config files if needed

### iOS Build Issues
- Ensure Xcode is installed and updated
- Run `cd ios-app && npx pod-install` for native dependencies
- Clear Metro cache: `npx react-native start --reset-cache`

## Code Quality

The project uses:
- ESLint for linting
- Prettier for code formatting
- Husky for pre-commit hooks
- TypeScript for type safety

Run manually:
```bash
npm run lint
npm run format
```

## Project Structure

```
kinect/
├── backend/          # Express API server
├── frontend-web/     # React web application
├── ios-app/         # React Native iOS app
├── shared/          # Shared TypeScript types
├── docker-compose.yml
└── package.json     # Monorepo root
```

## Next Steps

1. Set up push notifications (Firebase/OneSignal)
2. Implement phone log integration
3. Add comprehensive error logging
4. Set up CI/CD pipeline
5. Configure production deployment

## Support

For issues or questions, please refer to the main README or create an issue in the repository.