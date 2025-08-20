# Kinect Testing Suite

This directory contains comprehensive testing tools and documentation for the Kinect relationship management app MVP.

## 🚀 Quick Start

### 1. Setup Demo Environment
```bash
# Install dependencies (if not already done)
npm install

# Seed database with demo data
npm run seed

# Start the demo environment
npm run demo
```

### 2. Login and Explore
- Navigate to `http://localhost:5173`
- Login with demo credentials: `demo.active@kinect.app` / `demo123`
- Follow the guided tour to understand all features

## 📁 Directory Structure

```
tests/
├── api/                          # API testing collections
│   ├── kinect.postman_collection.json  # Postman collection
│   └── kinect.http                      # REST Client file
├── e2e/                          # End-to-end tests
│   ├── userJourneys.spec.ts            # Main E2E test suite
│   ├── global-setup.ts                 # Test environment setup
│   └── global-teardown.ts              # Test cleanup
├── TEST_CHECKLIST.md             # Manual testing checklist
└── README.md                     # This file
```

## 🛠️ Available Testing Tools

### 1. Demo Mode
- **Purpose**: Interactive demo with realistic data
- **Access**: Login with demo credentials
- **Features**:
  - Guided tour for new users
  - Sample data showcasing all features
  - Contextual notifications explaining features
  - Reset functionality to restore demo state

### 2. API Testing
Choose your preferred tool:

#### Option A: Postman
```bash
# Import collection
1. Open Postman
2. Import tests/api/kinect.postman_collection.json
3. Set environment variables (dev/staging/prod)
4. Run collection or individual requests
```

#### Option B: VS Code REST Client
```bash
# Prerequisites
1. Install "REST Client" extension in VS Code
2. Open tests/api/kinect.http
3. Click "Send Request" above any request
4. Environment variables are auto-managed
```

#### Option C: Command Line
```bash
# Quick API test
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo.active@kinect.app","password":"demo123"}'
```

### 3. End-to-End Testing
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test userJourneys.spec.ts

# Run specific test
npx playwright test -g "should login with demo credentials"
```

### 4. Developer Tools
Available in development mode:

#### Frontend Dev Tools Panel
- **Toggle**: Click 🛠️ icon in top-left corner
- **Features**:
  - Time travel (simulate future dates)
  - API call logging and inspection
  - Bulk data generation
  - Debug information display
  - Data export/import

#### Backend Dev APIs
```bash
# Sync mock phone logs
POST /api/dev/sync-phone-logs

# Bulk sync (30 days)
POST /api/dev/bulk-sync-phone-logs
{"days": 30}

# Start auto-sync
POST /api/dev/start-auto-sync
{"intervalMinutes": 60}
```

### 5. Database Management
```bash
# Populate with demo data
npm run seed

# Clear all data
npm run reset-db

# Reset and seed in one command
cd backend && npm run reset-and-seed
```

## 🎯 Testing Scenarios

### Authentication Flow
- [x] Valid login with demo credentials
- [x] Invalid credentials error handling
- [x] Token refresh mechanism
- [x] Session persistence
- [x] Logout functionality

### Contact Management
- [x] Create contacts with all fields
- [x] Edit existing contacts
- [x] Delete contacts with confirmation
- [x] View contact details and history
- [x] Move contacts between lists

### Contact Lists
- [x] Create new lists
- [x] Edit list properties
- [x] Delete lists (with/without contacts)
- [x] Filter contacts by list
- [x] List organization

### Reminder System
- [x] Category-based reminder calculations
- [x] Custom reminder intervals
- [x] Status badge accuracy (overdue/due soon/recent)
- [x] Dashboard reminder summary
- [x] Reminder updates after logging contact

### Communication Tracking
- [x] Manual communication logging
- [x] Communication history display
- [x] Mock phone sync integration
- [x] Last contact date updates

### Search and Filtering
- [x] Search by name, phone, email
- [x] Filter by category
- [x] Filter by list
- [x] Filter by reminder status

### Responsive Design
- [x] Mobile viewport (375px)
- [x] Tablet viewport (768px)
- [x] Touch interactions
- [x] Navigation adaptation

## 📊 Demo Data Profiles

The seed script creates 3 demo users with different usage patterns:

### 1. Alex Johnson (demo.active@kinect.app)
- **Profile**: Active user
- **Data**: 6 lists, ~18 contacts
- **Pattern**: Varied reminder states, recent activity
- **Use Case**: Demonstrates full app capabilities

### 2. Sarah Chen (demo.moderate@kinect.app)  
- **Profile**: Moderate user
- **Data**: 4 lists, ~12 contacts
- **Pattern**: Some overdue contacts, mixed activity
- **Use Case**: Shows typical user behavior

### 3. Mike Rodriguez (demo.minimal@kinect.app)
- **Profile**: Minimal user
- **Data**: 2 lists, ~7 contacts
- **Pattern**: Many overdue, infrequent usage
- **Use Case**: Tests low-engagement scenarios

## 🔧 Configuration

### Environment Variables
```bash
# Backend API URL
VITE_API_URL=http://localhost:3001/api

# Enable dev tools in production
VITE_ENABLE_DEV_TOOLS=true

# Demo mode auto-login
VITE_DEMO_AUTO_LOGIN=true
```

### Playwright Configuration
- **Browsers**: Chrome, Firefox, Safari, Mobile
- **Parallel**: Yes (except CI)
- **Retries**: 2x on CI, 0x local
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On retry

## 🐛 Debugging

### Common Issues

#### 1. Tests Failing - Database Not Seeded
```bash
# Solution: Manually seed database
npm run seed
```

#### 2. API Tests Failing - Wrong Environment
```bash
# Solution: Check base URL
echo $BASE_URL  # Should be http://localhost:5173
echo $API_URL   # Should be http://localhost:3001/api
```

#### 3. E2E Tests Timing Out
```bash
# Solution: Increase timeout or check services
npx playwright test --timeout=60000
```

#### 4. Demo Mode Not Working
```bash
# Check localStorage
localStorage.getItem('demoMode')  # Should be 'true'
localStorage.getItem('user')      # Should contain demo user
```

### Debug Tools

#### Browser DevTools
- Network tab: Check API requests/responses  
- Console: Look for JavaScript errors
- Application tab: Inspect localStorage

#### Playwright Debug
```bash
# Debug specific test
npx playwright test --debug -g "test name"

# Inspect element selectors
npx playwright codegen localhost:5173
```

#### Backend Logs
```bash
# View API logs
npm run dev:backend
# Look for request/response logs in terminal
```

## 📈 Performance Testing

### Metrics to Monitor
- Page load time < 3 seconds
- Search results < 500ms
- API response time < 200ms
- Memory usage stable
- No memory leaks

### Load Testing
```bash
# Generate bulk test data
# Via dev tools panel or API
POST /api/dev/generate-bulk-contacts
{"count": 100}

# Test with large datasets
npm run test:e2e -- --grep "performance"
```

## ✅ Test Coverage Goals

### Core Features (Must Pass)
- [x] User authentication (login/logout)
- [x] Contact CRUD operations
- [x] Contact list management
- [x] Reminder calculations
- [x] Dashboard statistics
- [x] Basic search/filtering

### Enhanced Features (Should Pass)
- [x] Demo mode with guided tour
- [x] Mobile responsive design
- [x] Phone sync simulation
- [x] Developer tools
- [x] Error handling

### Advanced Features (Nice to Have)
- [ ] Bulk operations
- [ ] Advanced analytics
- [ ] Data export/import
- [ ] Notification scheduling
- [ ] Offline functionality

## 🔄 Continuous Integration

### GitHub Actions Integration
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test:e2e
        env:
          BASE_URL: http://localhost:5173
          API_URL: http://localhost:3001/api
```

### Test Reports
- HTML: `playwright-report/index.html`
- JSON: `test-results.json`
- JUnit: `test-results.xml`

## 📝 Test Maintenance

### Adding New Tests
1. **API Tests**: Add requests to `kinect.http` or Postman collection
2. **E2E Tests**: Add scenarios to `userJourneys.spec.ts`
3. **Manual Tests**: Update `TEST_CHECKLIST.md`

### Updating Test Data
1. Modify `backend/src/scripts/seed.ts`
2. Run `npm run seed` to apply changes
3. Update test expectations if needed

### Test Cleanup
```bash
# Remove old test artifacts
rm -rf test-results/
rm -rf playwright-report/
rm test-results.json
rm test-results.xml
```

## 🤝 Contributing

### Before Submitting Tests
1. Run full test suite locally
2. Check test coverage for new features  
3. Update documentation if needed
4. Follow naming conventions

### Test Naming
- **E2E**: `should [action] [expected outcome]`
- **API**: `[method] [endpoint] - [scenario]`
- **Manual**: `[Feature] - [Test Case]`

---

**For questions or issues with the testing suite, please open an issue in the repository.**