# Kinect Project Context for AI Assistants

## Project Overview
Kinect is a relationship management application designed to help users maintain meaningful connections with friends and loved ones. It tracks communication patterns and sends timely reminders to encourage regular contact.

## Key Concepts
- **Relationship Categories**: Best Friends (30-day reminder), Friends (90-day reminder), Acquaintances (180-day reminder), Custom
- **Communication Tracking**: Integrates with phone call logs to automatically track last contact dates
- **Multi-platform**: Web application and iOS native app sharing a backend

## Architecture
The project follows a multi-tier architecture:
- Backend API (Node.js/Express or Python/FastAPI)
- Database layer (PostgreSQL or MongoDB)
- Web frontend (React or Vue.js)
- iOS application (Swift/SwiftUI or React Native)
- Shared types/interfaces between platforms

## Development Guidelines

### Code Organization
- Backend code goes in `/backend/` with subdirectories for api, models, services, and config
- Web frontend code goes in `/frontend-web/`
- iOS app code goes in `/ios-app/`
- Shared types and interfaces go in `/shared/`

### API Design
- RESTful API design patterns
- JWT-based authentication
- Phone log integration should be read-only
- Implement proper error handling and validation

### Database Schema
Key entities to implement:
- Users (authentication, profile)
- Contacts (name, birthday, category, last_contact_date)
- Contact Lists (user's organized groups)
- Notification Settings (per-category intervals)
- Communication Logs (phone call records)

### Security Considerations
- Encrypt sensitive data at rest
- Implement proper authentication and authorization
- Request minimal permissions for phone log access
- Follow GDPR/CCPA compliance guidelines
- Never store raw phone numbers or call content

### Testing Requirements
- Unit tests for business logic
- Integration tests for API endpoints
- UI tests for critical user flows
- Test notification scheduling logic thoroughly

### Performance Considerations
- Optimize database queries for contact list retrieval
- Implement pagination for large contact lists
- Cache frequently accessed data
- Efficient notification scheduling (batch processing)

## Common Tasks

### Adding a New Feature
1. Update the database schema if needed
2. Implement backend API endpoints
3. Add frontend components and views
4. Update iOS app if applicable
5. Write tests for new functionality
6. Update documentation

### Working with Notifications
- Use Firebase Cloud Messaging or OneSignal
- Implement batch scheduling to avoid overwhelming users
- Allow users to customize notification preferences
- Include unsubscribe/snooze options

### Integrating Phone Logs
- Request appropriate permissions on iOS
- Use CallKit framework for iOS
- Implement privacy-preserving sync mechanism
- Only store necessary metadata (timestamp, contact identifier)

## Development Commands
```bash
# Backend
npm run dev        # Start development server
npm run test       # Run tests
npm run lint       # Lint code

# Frontend
npm run start      # Start development server
npm run build      # Build for production
npm run test       # Run tests

# iOS
# Use Xcode for building and testing
```

## Important Notes
- Privacy is paramount - collect only necessary data
- User experience should be simple and intuitive
- Focus on helping users maintain meaningful connections
- Regular contact reminders should feel helpful, not intrusive
- Consider different cultural norms around communication frequency

## MVP Priorities
1. User authentication and account creation
2. Basic contact list CRUD operations
3. Phone log integration (read-only)
4. Simple notification system with default intervals
5. Clean, responsive UI for web
6. Basic iOS app with core functionality

## Future Enhancements (Post-MVP)
- Email and text message tracking
- Social media integration
- Analytics dashboard for communication patterns
- AI-powered relationship insights
- Calendar integration for birthdays and events
- Group messaging reminders
- Custom notification messages