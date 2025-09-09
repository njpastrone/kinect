# 🤝 Kinect - Intelligent Contact Relationship Manager

> **Never forget to stay in touch with the people who matter**

A privacy-first relationship management application that helps you maintain meaningful connections through smart reminders and intelligent contact organization.

![Live Demo](https://kinect-web.onrender.com) • [View Source Code](https://github.com/njpastrone/kinect)

---

## 🌟 Overview

Kinect is a modern web application designed to solve a common problem: staying consistently connected with friends, family, and professional contacts. By tracking communication patterns and providing gentle reminders, it helps users maintain meaningful relationships without the mental overhead.

**Key Innovation**: Smart reminder intervals based on relationship importance (Best Friends: 30 days, Friends: 90 days, Acquaintances: 180 days) with customizable preferences.

---

## ✨ Key Features

### 🎯 **Smart Relationship Management**
- **Intelligent Categories**: Automatic reminder intervals based on relationship closeness
- **Custom Lists**: Organize contacts by context (Work, College, Family, etc.)
- **Last Contact Tracking**: Manual logging with timestamps and notes

### 📧 **Proactive Communication**
- **Email Reminders**: Get notified when it's time to reach out
- **Overdue Tracking**: Dashboard view of relationships needing attention
- **Batch Processing**: Efficient weekly reminder system

### 🔒 **Privacy & Security**
- **Data Ownership**: Your data in your MongoDB instance (Atlas or self-hosted)
- **No Tracking**: Zero analytics or user behavior monitoring
- **Export Anytime**: Complete data portability
- **Encrypted Storage**: All sensitive data encrypted at rest

### 📱 **Modern User Experience**
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Real-time Updates**: Live data synchronization
- **Error Recovery**: Comprehensive error handling with retry mechanisms
- **Accessibility**: WCAG 2.1 AA compliant

---

## 🚀 Live Demo

**[Try Kinect Live](https://kinect-web.onrender.com)**

```
Demo Credentials:
Email: demo@kinect.app
Password: demo123

Features to explore:
• Dashboard with relationship insights
• Add and organize contacts
• Create custom contact lists
• View reminder settings
```

---

## 💻 Technology Stack

### **Frontend**
- **React 18** with TypeScript for type-safe development
- **Tailwind CSS** for responsive, utility-first styling
- **Vite** for fast development and optimized builds
- **Zustand** for lightweight state management

### **Backend**
- **Node.js/Express** with TypeScript
- **MongoDB/Mongoose** for flexible document storage
- **JWT Authentication** with refresh token rotation
- **Comprehensive Testing** with Jest and Supertest

### **Infrastructure**
- **Render** for production deployment with auto-scaling
- **MongoDB Atlas** for managed database hosting
- **Docker** for consistent local development
- **GitHub Actions** for CI/CD (planned)

### **Developer Experience**
- **ESLint + Prettier** for code consistency
- **Husky** for pre-commit hooks
- **TypeScript** across the full stack
- **Comprehensive error handling** and logging

---

## 📊 Project Highlights

### **Architecture & Design**
- **Clean Architecture**: Separation of concerns with service layers
- **API-First Design**: RESTful endpoints with comprehensive error handling
- **Component-Driven UI**: Reusable React components with TypeScript interfaces
- **Database Design**: Optimized MongoDB schemas with proper indexing

### **Quality & Reliability**
- **Error Boundaries**: Graceful failure handling with user-friendly messages
- **Retry Logic**: Automatic recovery from network failures
- **Form Validation**: Client and server-side validation with real-time feedback
- **Performance**: Optimized bundle size and lazy loading

### **Production Ready**
- **Health Checks**: Monitoring endpoints for service status
- **Logging**: Structured logging for debugging and monitoring
- **Security**: CORS, helmet, rate limiting, and input sanitization
- **Scalability**: Stateless design ready for horizontal scaling

---

## 🎬 Screenshots

### Dashboard - Relationship Overview
![Dashboard showing overdue contacts and relationship health metrics](docs/assets/dashboard-preview.png)

### Contact Management - Smart Organization
![Contact list with categories, last contact dates, and quick actions](docs/assets/contacts-preview.png)

### Mobile Experience - Responsive Design
![Mobile-optimized interface showing touch-friendly interactions](docs/assets/mobile-preview.png)

---

## 🚀 Quick Start

### **One-Click Deploy**
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/njpastrone/kinect)

### **Local Development**
```bash
# Clone and setup
git clone https://github.com/njpastrone/kinect.git
cd kinect
npm install

# Configure environment
cp .env.atlas.example .env
# Add your MongoDB connection string

# Start development servers
npm run dev:all

# Access at:
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### **Self-Hosted Docker**
```bash
# Start all services
docker compose -f docker-compose.selfhosted.yml up -d

# Access at http://localhost:3000
```

---

## 🏗️ Development Process

This project showcases modern full-stack development practices:

- **Test-Driven Development**: Core features developed with comprehensive test coverage
- **Iterative Design**: User feedback incorporated through multiple design iterations
- **Performance Optimization**: Bundle analysis and optimization for production deployment
- **Accessibility Focus**: Keyboard navigation, screen reader support, and semantic HTML
- **Documentation**: Comprehensive developer and user documentation

---

## 📈 Future Enhancements

- **Calendar Integration**: Sync with Google Calendar for birthday reminders
- **Mobile App**: Native iOS/Android applications
- **Advanced Analytics**: Relationship health scoring and trends
- **Social Integration**: Import contacts from social media platforms
- **Team Features**: Shared contact lists for organizations

---

## 🤝 Contact & Connect

**Portfolio**: [Your Portfolio URL]  
**LinkedIn**: [Your LinkedIn Profile]  
**GitHub**: [@njpastrone](https://github.com/njpastrone)  
**Email**: [Your Professional Email]

---

## 📄 Documentation

- **[Developer Setup](docs/development/)** - Local development and contribution guide
- **[Deployment Guide](docs/deployment/)** - Production deployment instructions
- **[API Documentation](docs/api/)** - Complete API reference
- **[Architecture Guide](docs/architecture/)** - System design and decisions

---

*Built with ❤️ by Nicolo Pastrone • Open to new opportunities*