# Kinect - Stay Connected App

## Overview

Kinect is a relationship management application that helps users maintain meaningful connections with friends and loved ones by tracking communication patterns and sending timely reminders.

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

### 4. Platform Support

- Web application (responsive design)
- iOS native application
- Shared backend infrastructure

## Technical Requirements

### MVP Scope

- User authentication and account management
- Basic contact list functionality
- Phone log API integration (read-only access)
- Notification system with default intervals
- Simple, intuitive UI/UX
- Data persistence and user privacy

### Technology Stack (Recommended)

- **Backend**: Node.js/Express or Python/FastAPI
- **Database**: PostgreSQL or MongoDB
- **Frontend Web**: React or Vue.js
- **iOS**: Swift/SwiftUI or React Native
- **API Integration**: RESTful API for phone logs
- **Authentication**: JWT-based auth
- **Notifications**: Push notification service (Firebase/OneSignal)

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

**MVP Status**: ✅ **Core Features Complete**

### Working Features

- ✅ User authentication (register, login, password reset)
- ✅ Contact management with full CRUD operations
- ✅ Contact list creation and management
- ✅ Dashboard with statistics and overdue contacts
- ✅ Professional UI/UX with responsive design
- ✅ Real-time data synchronization
- ✅ Contact-to-list bidirectional relationships

### Technology Stack (Implemented)

- **Backend**: Node.js/Express with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Frontend Web**: React with Vite and TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form
- **Authentication**: JWT-based with bcrypt

## Getting Started

### Quick Options

**🚀 Self-Hosted Deployment**: See [QUICKSTART.md](QUICKSTART.md) for Docker-based setup
**🛠️ Development Setup**: Continue below for local development

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
- Backend API: http://localhost:5000

### Database Seeding

```bash
cd backend
npm run seed    # Add sample data
npm run reset   # Reset database
```

## Privacy & Security

- Minimal data collection (only necessary contact info)
- Encrypted data storage
- User consent for phone log access
- GDPR/CCPA compliance considerations
