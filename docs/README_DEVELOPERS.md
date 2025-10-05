# Developer Documentation

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm
- **MongoDB** (Atlas account or local installation)
- **Git** for version control
- **Docker** (optional, for self-hosted deployment)

### Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/njpastrone/kinect.git
cd kinect

# 2. Install dependencies for all packages
npm install

# 3. Configure environment
cp .env.atlas.example .env
# Edit .env with your MongoDB Atlas connection string

# 4. Start development servers
npm run dev:all

# 5. Access the application
# Frontend: http://localhost:5173 (Vite dev server)
# Backend: http://localhost:3001 (Express server)
```

### Environment Configuration

Create `.env` in the root directory:

```bash
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/kinect

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (Optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🏗️ Project Architecture

### Monorepo Structure

```
kinect/
├── backend/           # Node.js/Express API
├── frontend-web/      # React/TypeScript web app
├── shared/           # Shared TypeScript types
├── ios-app/          # iOS app (planned)
├── docs/             # Documentation
├── tests/            # End-to-end tests
└── scripts/          # Utility scripts
```

### Technology Decisions

**Why React + TypeScript?**
- Type safety reduces runtime errors
- Component reusability and maintainability
- Strong ecosystem and community

**Why MongoDB?**
- Flexible schema for evolving data models
- JSON-like documents match JavaScript objects
- Excellent Atlas cloud hosting

**Why Express?**
- Minimal, unopinionated framework
- Large ecosystem of middleware
- Easy to test and debug

---

## 🛠️ Development Commands

### Root Level Commands
```bash
# Development
npm run dev:all          # Start both backend and frontend
npm run dev:backend      # Backend only
npm run dev:web          # Frontend only

# Building
npm run build:all        # Build all packages
npm run build:backend    # Backend only
npm run build:web        # Frontend only

# Testing
npm run test             # Run all tests
npm run test:api         # API testing guide
npm run test:e2e         # End-to-end tests

# Database
npm run seed             # Add sample data
npm run reset-db         # Clear database

# Code Quality
npm run lint             # Lint all code
npm run format           # Format with Prettier
```

### Backend Commands
```bash
cd backend

npm run dev              # Start with nodemon
npm run build            # TypeScript compilation
npm run start            # Production start
npm run test:atlas       # Test MongoDB connection

# Reminder System Testing
node scripts/test-notification-service.js  # Test service methods
node scripts/test-manual-triggers.js       # Test API endpoints
node scripts/test-production-email.js      # Test email delivery
npm run demo:reminders                      # Full demo with MailHog
```

### Frontend Commands
```bash
cd frontend-web

npm run dev              # Vite dev server
npm run build            # Production build
npm run preview          # Preview production build
```

---

## 🧪 Testing Strategy

### Unit Testing
```bash
# Backend unit tests
cd backend && npm test

# Frontend component tests
cd frontend-web && npm test
```

### API Testing
Use the REST Client extension in VS Code:
```bash
# Open the API test collection
code tests/api/kinect.http
```

Or import into Postman:
```bash
# Import this file into Postman
tests/api/kinect.postman_collection.json
```

### End-to-End Testing
```bash
# Run with Playwright
npm run test:e2e

# Interactive mode
npm run test:e2e:ui

# Headed browser mode
npm run test:e2e:headed
```

---

## 📊 Database Schema

### Key Collections

**Users**
```typescript
interface User {
  _id: ObjectId;
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Contacts**
```typescript
interface Contact {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  category: 'bestfriend' | 'friend' | 'acquaintance';
  reminderDays: number;
  lastContactDate?: Date;
  lists: ObjectId[]; // References to ContactList
  createdAt: Date;
  updatedAt: Date;
}
```

**ContactLists**
```typescript
interface ContactList {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  color: string;
  description?: string;
  reminderDays: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔧 Code Standards

### TypeScript Configuration
- Strict mode enabled
- Path mapping for clean imports
- Consistent formatting with Prettier

### React Patterns
- Functional components with hooks
- Custom hooks for business logic
- Error boundaries for fault tolerance
- TypeScript interfaces for props

### API Patterns
- RESTful design principles
- Consistent error response format
- Middleware for common concerns
- Async/await for async operations

### Git Workflow
```bash
# Feature branch workflow
git checkout -b feature/new-feature
git commit -m "feat: add new feature"
git push origin feature/new-feature
# Create pull request
```

### Commit Message Format
```
feat: add new feature
fix: resolve bug in contact creation
docs: update API documentation
test: add unit tests for auth service
refactor: improve error handling
```

---

## 🚨 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Kill processes using required ports
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

**MongoDB connection issues:**
```bash
# Test your connection string
cd backend && npm run test:atlas
```

**Build errors:**
```bash
# Clear all dependencies and reinstall
rm -rf node_modules backend/node_modules frontend-web/node_modules
npm install
```

**TypeScript errors:**
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

---

## 🤝 Contributing

### Before Contributing
1. Read this developer documentation
2. Set up local development environment
3. Run the test suite to ensure everything works
4. Create a feature branch for your changes

### Pull Request Process
1. Ensure tests pass: `npm run test`
2. Lint code: `npm run lint`
3. Update documentation if needed
4. Create descriptive commit messages
5. Submit pull request with clear description

### Development Best Practices
- Write tests for new features
- Follow existing code patterns
- Document complex logic
- Handle errors gracefully
- Consider mobile responsive design

---

## 📚 Additional Resources

- [API Documentation](./api/) - Complete endpoint reference
- [Deployment Guide](./deployment/) - Production deployment
- [Architecture Decisions](./architecture/) - Technical decisions and rationale
- [Testing Guide](../tests/README.md) - Comprehensive testing information