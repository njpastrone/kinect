# Kinect MVP Testing Checklist

This document outlines comprehensive testing procedures for the Kinect relationship management app MVP.

## 🚀 Quick Start Testing

### Demo Environment Setup

- [ ] Navigate to `http://localhost:5173`
- [ ] Login with demo credentials: `demo.active@kinect.app` / `demo123`
- [ ] Verify demo mode banner appears
- [ ] Start guided tour (should auto-start for first-time users)
- [ ] Complete tour to understand all features

### Seed Data Verification

- [ ] Run `npm run seed` to populate database
- [ ] Verify 3 demo users created (active, moderate, minimal profiles)
- [ ] Verify contact lists created for each user
- [ ] Verify contacts with varied "last contact" dates
- [ ] Verify communication logs generated

## 👤 User Authentication Testing

### Registration Flow

- [ ] **Valid Registration**
  - Navigate to registration page
  - Enter valid email, password, first name, last name
  - Verify successful registration and auto-login
  - Expected: User created, JWT tokens received, redirected to dashboard

- [ ] **Invalid Registration Cases**
  - Try duplicate email → Expected: 409 error "User already exists"
  - Try invalid email format → Expected: 400 validation error
  - Try short password (< 6 chars) → Expected: 400 validation error
  - Try empty required fields → Expected: 400 validation error

### Login Flow

- [ ] **Valid Login**
  - Enter correct email/password
  - Verify successful login and redirect to dashboard
  - Expected: JWT tokens stored, user data loaded

- [ ] **Invalid Login Cases**
  - Wrong email → Expected: 401 "Invalid credentials"
  - Wrong password → Expected: 401 "Invalid credentials"
  - Empty fields → Expected: 400 validation error

### Token Management

- [ ] **Token Refresh**
  - Wait for access token to near expiration (or force expire)
  - Make API request to trigger auto-refresh
  - Expected: New access token received automatically

- [ ] **Session Persistence**
  - Login, close browser, reopen
  - Expected: User remains logged in
  - Clear localStorage, refresh
  - Expected: Redirected to login page

## 📋 Contact List Management

### CRUD Operations

- [ ] **Create Contact List**
  - Click "New List" button
  - Enter name, description, choose color
  - Save and verify list appears in sidebar
  - Expected: List created with correct properties

- [ ] **Edit Contact List**
  - Click edit on existing list
  - Modify name, description, color
  - Save changes and verify updates
  - Expected: Changes persist across page refresh

- [ ] **Delete Contact List**
  - Delete list with no contacts → Expected: Immediate deletion
  - Delete list with contacts → Expected: Confirmation dialog
  - Confirm deletion → Expected: List and associated contacts removed

### List Organization

- [ ] **Drag and Drop Reordering** (if implemented)
  - Drag lists to reorder
  - Expected: New order persists after refresh

- [ ] **Contact Count Display**
  - Verify each list shows correct contact count
  - Add/remove contacts and verify count updates

## 👥 Contact Management

### Contact Creation

- [ ] **Complete Contact**
  - Fill all fields: name, phone, email, birthday, category, notes
  - Choose contact list
  - Save and verify all data appears correctly
  - Expected: Contact created with all information

- [ ] **Minimal Contact**
  - Fill only required fields (first name, last name, category)
  - Expected: Contact created successfully

- [ ] **Invalid Contact Data**
  - Try empty first name → Expected: Validation error
  - Try empty last name → Expected: Validation error
  - Try invalid email format → Expected: Validation error
  - Try invalid category → Expected: Validation error

### Contact Viewing

- [ ] **Contact List Display**
  - Verify contacts show in chosen list
  - Check contact card displays: name, category, last contact date
  - Verify reminder badges show correct status (overdue/due soon/recent)

- [ ] **Contact Details**
  - Click on contact to view full details
  - Verify all information displays correctly
  - Check birthday formatting and upcoming birthday indicators

### Contact Editing

- [ ] **Update Contact Information**
  - Edit name, phone, email, category
  - Change contact list
  - Update reminder settings
  - Expected: All changes save and display correctly

- [ ] **Move Between Lists**
  - Move contact from one list to another
  - Expected: Contact appears in new list, removed from old list

### Contact Deletion

- [ ] **Delete Contact**
  - Delete contact → Expected: Confirmation dialog
  - Confirm deletion → Expected: Contact removed from all lists
  - Associated communication logs should be deleted

## ⏰ Reminder System

### Reminder Calculation

- [ ] **Category-Based Reminders**
  - Best Friends: Check 30-day reminder threshold
  - Friends: Check 90-day reminder threshold
  - Acquaintances: Check 180-day reminder threshold
  - Expected: Correct reminder states based on last contact date

- [ ] **Custom Reminder Intervals**
  - Set custom reminder for specific contact
  - Verify custom setting overrides category default
  - Expected: Custom interval used for reminder calculation

### Reminder Display

- [ ] **Status Badges**
  - Red badge: Contact overdue (past reminder threshold)
  - Yellow badge: Contact due soon (within 7 days of threshold)
  - Green badge: Recently contacted (well within threshold)
  - Expected: Correct color coding based on status

- [ ] **Dashboard Summary**
  - Verify dashboard shows counts for each reminder status
  - Check "Upcoming Reminders" section shows contacts due soon
  - Expected: Accurate counts and prioritized contact list

## 📞 Communication Tracking

### Manual Contact Logging

- [ ] **Log Communication**
  - Select contact → Click "Log Contact"
  - Choose type: Phone Call, Text, Email, In Person, Other
  - Add notes
  - Expected: Last contact date updates, log entry created

- [ ] **Communication History**
  - View contact details → Check communication log
  - Verify all logged interactions appear chronologically
  - Check interaction types and notes display correctly

### Phone Integration (Mock)

- [ ] **Mock Phone Sync**
  - Trigger phone sync via dev tools or API
  - Expected: New communication logs created
  - Expected: Contact last contact dates updated

- [ ] **Bulk Phone Sync**
  - Run bulk sync for 30 days
  - Expected: Multiple logs created across different contacts
  - Expected: Realistic communication patterns

## 📊 Dashboard Analytics

### Summary Statistics

- [ ] **Contact Counts**
  - Total contacts
  - Contacts by status (overdue, due soon, recent)
  - Contacts by category
  - Expected: Accurate counts that update with changes

- [ ] **Communication Metrics**
  - Average days between contact
  - Longest gap without contact
  - This month's contacts
  - Expected: Calculations match actual data

### Visual Indicators

- [ ] **Progress Indicators**
  - Relationship health meters
  - Category breakdowns
  - Expected: Visual representations match data

## 🔍 Search and Filtering

### Search Functionality

- [ ] **Contact Search**
  - Search by first name
  - Search by last name
  - Search by phone number
  - Search by email
  - Expected: Relevant results returned

### Filtering Options

- [ ] **Filter by Category**
  - Filter contacts by Best Friend, Friend, Acquaintance
  - Expected: Only contacts of selected category shown

- [ ] **Filter by List**
  - Select specific contact list
  - Expected: Only contacts from that list shown

- [ ] **Filter by Status**
  - Show only overdue contacts
  - Show only contacts due soon
  - Expected: Filtered results match criteria

## ⚙️ Settings and Preferences

### Notification Settings

- [ ] **Default Reminder Intervals**
  - Modify default intervals for each category
  - Create new contact and verify new defaults applied
  - Expected: New intervals used for reminder calculations

- [ ] **Notification Preferences**
  - Toggle email notifications on/off
  - Toggle push notifications on/off
  - Expected: Settings persist and affect notification behavior

### Profile Settings

- [ ] **User Profile**
  - Update first name, last name
  - Change password
  - Expected: Changes save and appear immediately

## 📱 Responsive Design Testing

### Mobile Experience

- [ ] **Phone Layout (375px)**
  - Navigation collapses to hamburger menu
  - Contact cards stack vertically
  - All buttons remain accessible
  - Text remains readable

- [ ] **Tablet Layout (768px)**
  - Sidebar remains visible
  - Contact grid adjusts to available space
  - Forms remain usable

### Touch Interactions

- [ ] **Touch Targets**
  - All buttons are at least 44px touch target
  - Swipe gestures work on mobile (if implemented)
  - Pinch to zoom disabled on forms

## 🔐 Security Testing

### Authentication Security

- [ ] **Protected Routes**
  - Access `/contacts` without login → Expected: Redirect to login
  - Access `/dashboard` without login → Expected: Redirect to login
  - Invalid JWT token → Expected: Logout and redirect

- [ ] **Data Privacy**
  - User can only see their own contacts
  - API calls include proper authorization headers
  - Expected: No data leakage between users

### Input Validation

- [ ] **XSS Prevention**
  - Try entering `<script>alert('xss')</script>` in text fields
  - Expected: Script tags escaped/sanitized

- [ ] **SQL Injection Prevention**
  - Try entering `'; DROP TABLE users; --` in search
  - Expected: Query executed safely without SQL injection

## 🚫 Error Handling

### Network Errors

- [ ] **Offline Behavior**
  - Disconnect network, try to perform actions
  - Expected: Appropriate error messages displayed
  - Reconnect → Expected: App recovers gracefully

- [ ] **Server Errors**
  - Mock 500 server error responses
  - Expected: User-friendly error messages
  - Retry mechanisms work when applicable

### Validation Errors

- [ ] **Form Validation**
  - Submit forms with invalid data
  - Expected: Clear error messages
  - Field-level validation provides immediate feedback

### Edge Cases

- [ ] **Large Data Sets**
  - Create 100+ contacts
  - Expected: App remains responsive
  - Pagination works correctly

- [ ] **Special Characters**
  - Use names with accents, emojis, special characters
  - Expected: Characters display correctly throughout app

## 🎭 Demo Mode Testing

### Demo Features

- [ ] **Auto-Login**
  - Demo mode auto-logs in with demo account
  - Expected: Seamless experience for new users

- [ ] **Guided Tour**
  - Tour starts automatically for first-time users
  - All tour steps work correctly
  - Tour can be skipped and restarted
  - Expected: Educational and smooth experience

- [ ] **Sample Data**
  - Demo account has realistic sample data
  - Variety of contact types and reminder states
  - Expected: Showcases all app features effectively

### Demo Notifications

- [ ] **Contextual Tips**
  - Demo notifications appear for key actions
  - Tips explain what's happening behind the scenes
  - Expected: Educational without being intrusive

## 🔧 Developer Tools Testing

### Dev Panel Features

- [ ] **Time Travel**
  - Enable time travel mode
  - Jump to future dates
  - Verify reminder calculations update
  - Reset to current date
  - Expected: Accurate simulation of date changes

- [ ] **API Logging**
  - Make API calls and verify they appear in logs
  - Check request/response data is captured
  - Clear logs functionality works
  - Expected: Complete API call history

- [ ] **Data Generation**
  - Generate bulk contacts (5, 10)
  - Expected: Realistic test data created

- [ ] **Phone Sync Simulation**
  - Trigger mock phone sync
  - Expected: Communication logs created

## 📈 Performance Testing

### Load Testing

- [ ] **Large Contact Lists**
  - Create 200+ contacts
  - Navigate through app
  - Expected: Smooth performance, under 2s page loads

- [ ] **Search Performance**
  - Search with 200+ contacts
  - Expected: Results appear within 500ms

### Memory Usage

- [ ] **Memory Leaks**
  - Navigate through app extensively
  - Monitor browser memory usage
  - Expected: Memory usage remains stable

## 🌐 Browser Compatibility

### Modern Browsers

- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)

### Mobile Browsers

- [ ] **iOS Safari**
- [ ] **Android Chrome**

## 🔄 Data Persistence

### Local Storage

- [ ] **Settings Persistence**
  - Change settings, refresh page
  - Expected: Settings maintained

- [ ] **Session Persistence**
  - Login, close tab, reopen
  - Expected: User remains logged in

### Database Consistency

- [ ] **CRUD Operations**
  - Create, read, update, delete operations
  - Expected: Database reflects all changes
  - No orphaned records after deletions

## ✅ Acceptance Criteria

### Core Features (Must Have)

- [ ] User can register and login
- [ ] User can create and manage contact lists
- [ ] User can add, edit, and delete contacts
- [ ] User can see reminder status for each contact
- [ ] User can manually log communication with contacts
- [ ] Dashboard shows overview of relationship health

### Enhanced Features (Should Have)

- [ ] Search and filter contacts
- [ ] Demo mode with guided tour
- [ ] Responsive design for mobile
- [ ] Phone sync simulation
- [ ] Settings and preferences

### Nice to Have Features

- [ ] Bulk operations
- [ ] Data export/import
- [ ] Advanced analytics
- [ ] Notification scheduling
- [ ] Custom reminder messages

## 🐛 Known Issues

Document any known issues or limitations:

1. **Phone Integration**: Currently simulated, not real phone integration
2. **Notifications**: Toast notifications only, no email/push notifications
3. **Offline Mode**: Limited offline functionality
4. **Data Export**: Basic JSON export, no advanced formats

## 🎯 Test Scenarios Priority

### P0 - Critical (Must work)

- User authentication flow
- Basic contact CRUD operations
- Reminder calculation and display
- Dashboard functionality

### P1 - Important (Should work)

- Search and filtering
- Communication logging
- Settings management
- Mobile responsiveness

### P2 - Nice to have (Could work)

- Demo mode features
- Developer tools
- Advanced analytics
- Bulk operations

## 📝 Test Execution Notes

### Before Testing

1. Run `npm run seed` to populate test data
2. Use demo credentials for consistent testing
3. Clear browser cache between test runs
4. Test in incognito mode to avoid cache issues

### During Testing

- Take screenshots of any issues
- Note exact steps to reproduce problems
- Record browser console errors
- Test both happy path and error cases

### After Testing

- Document all findings
- Categorize issues by severity
- Create GitHub issues for bugs
- Update test cases based on findings

---

**Last Updated**: 2024-01-XX  
**Test Environment**: Development  
**Tested By**: [Your Name]  
**Test Data**: Demo seed data
