# 🤝 Kinect - Privacy-First Relationship Manager

> **Never forget to stay in touch with the people who matter**

Kinect helps you maintain meaningful relationships by tracking communication patterns and sending gentle reminders when it's been too long since you last contacted someone.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/njpastrone/kinect)

---

## ✨ **Why Kinect?**

- **🔒 Privacy-First**: Your data stays in your MongoDB instance (Atlas or self-hosted)
- **⏰ Smart Reminders**: Customizable intervals based on relationship importance  
- **📧 Email Notifications**: Get reminded via email when it's time to reach out
- **📱 Mobile-Friendly**: Works perfectly on phones and tablets
- **🚀 Easy Deploy**: One-click deployment with Render blueprint
- **💰 Low Cost**: ~$7/month for production hosting on Render

---

## 🎯 **Perfect For**

- **Busy Professionals** who want to maintain personal relationships
- **Remote Workers** staying connected with colleagues and friends
- **Students** keeping in touch with classmates and mentors
- **Anyone** who values meaningful relationships but struggles with consistency

---

## 🚀 **Quick Start Options**

### Option 1: Deploy to Render (5 minutes)
Perfect for production deployment with automatic scaling:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/njpastrone/kinect)

1. Click "Deploy to Render"
2. Connect your GitHub account
3. Set MongoDB Atlas connection string
4. Configure email credentials (SMTP)
5. Deploy and share with friends

**Requirements:**
- MongoDB Atlas account (free tier available)
- SMTP credentials for email reminders
- ~$7/month for Render hosting

### Option 2: Local Development (5 minutes)
For developers who want to customize or contribute:

```bash
# Clone and install
git clone https://github.com/njpastrone/kinect.git
cd kinect
npm install

# Configure environment  
cp .env.atlas.example .env
# Edit .env with your MongoDB Atlas connection string

# Start all services
npm run dev:all

# Access at:
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Option 3: Production Deployment (Manual)
For full control over deployment:

```bash
# 1. Set up MongoDB Atlas cluster
# 2. Configure render.yaml with your settings
# 3. Push to GitHub
# 4. Connect GitHub repo to Render
# 5. Deploy from Blueprint (render.yaml)
```

---

## 📧 **Email Setup (Required)**

Kinect needs email access to send reminder notifications:

### Gmail (Recommended - Free)
1. **Enable 2-Factor Authentication** on your Gmail
2. **Generate App Password**:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Create password for "Mail"
   - Use this 16-character password in Kinect

### Free Email Services
- **Gmail**: 500 emails/day free
- **SendGrid**: 100 emails/day free
- **Mailgun**: 1000 emails/month free

---

## 🎉 **Key Features**

### Smart Relationship Management
- **Contact Categories**: Best Friends (30 days), Friends (90 days), Acquaintances (180 days)
- **Custom Intervals**: Set your own reminder schedules
- **Contact Lists**: Organize by groups (Work, College, Family, etc.)
- **Last Contact Tracking**: Manual logging with timestamps

### Intelligent Reminders  
- **Email Notifications**: Get reminded when it's time to reach out
- **Overdue Tracking**: See who you haven't contacted recently
- **Dashboard Overview**: Quick view of relationship health
- **Batch Processing**: Efficient reminder system

### Privacy & Security
- **Local-First**: All data encrypted and stored locally
- **No Tracking**: Zero telemetry or analytics 
- **Self-Hosted**: Complete control over your data
- **Export Anytime**: Full data portability

---

## 📱 **Screenshots**

### Dashboard
![Dashboard showing overdue contacts and recent activity](screenshots/dashboard.png)

### Contact Management  
![Contact list with categories and last contact dates](screenshots/contacts.png)

### Reminder Settings
![Customizable reminder intervals and email preferences](screenshots/settings.png)

---

## 🌍 **Deployment Options**

### 🟢 Railway (Easiest for Friend Sharing)
- **Cost**: Free tier, then $5/month
- **Setup Time**: 2 minutes
- **Best For**: Sharing with 5-20 friends
- **URL**: Professional `your-app.up.railway.app` 

### 🟡 Self-Hosted VPS
- **Cost**: $5-20/month for VPS
- **Setup Time**: 15 minutes  
- **Best For**: Complete control, unlimited users
- **Options**: DigitalOcean, Linode, Oracle Cloud (free)

### 🔵 Raspberry Pi
- **Cost**: One-time hardware cost
- **Setup Time**: 20 minutes
- **Best For**: Home lab enthusiasts
- **Performance**: Great for personal/family use

---

## 🤝 **Sharing with Friends**

### Single Shared Instance (Recommended)
1. **Deploy once** using Railway button above
2. **Share your URL** with friends  
3. **Friends create accounts** on your instance
4. **Everyone gets reminders** for their own contacts

**Pros**: Easy to maintain, professional appearance  
**Cons**: All accounts on your instance

### Individual Deployments
1. **Share this repository** with friends
2. **Each person** clicks deploy button  
3. **Everyone** gets their own private instance

**Pros**: Complete privacy and isolation  
**Cons**: Each person manages their own deployment

---

## 🎯 **Real-World Use Cases**

> *"I used to feel guilty about losing touch with college friends. Now Kinect reminds me to reach out every few months, and I've reconnected with so many people!"* - Sarah, Marketing Manager

> *"As a remote worker, Kinect helps me maintain relationships with former colleagues. The email reminders are perfect for staying professional but personal."* - Mike, Software Developer  

> *"My family is spread across the country. Kinect reminds me to call my cousins and grandparents regularly. It's strengthened our relationships significantly."* - Jessica, Teacher

---

## 🔧 **Technical Details**

### Architecture
- **Backend**: Node.js/Express with TypeScript
- **Frontend**: React with Vite and Tailwind CSS  
- **Database**: MongoDB with encryption
- **Email**: SMTP with multiple provider support
- **Deployment**: Docker with health checks

### Security
- **Data Encryption**: AES-256 for sensitive data
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configurable origins
- **Rate Limiting**: API protection
- **No Tracking**: Zero telemetry collection

### Performance
- **Optimized Builds**: Code splitting and caching
- **Database Indexing**: Fast contact lookups
- **Email Queuing**: Reliable reminder delivery
- **Health Monitoring**: Automatic error recovery

---

## 📚 **Documentation**

- **[Railway Deployment Guide](RAILWAY-DEPLOY.md)** - One-click deploy instructions
- **[Production Deployment](DEPLOYMENT.md)** - Self-hosted setup guide
- **[Development Setup](DEVELOPMENT.md)** - Local development guide
- **[API Documentation](API.md)** - REST API reference
- **[Contributing](CONTRIBUTING.md)** - How to contribute

---

## 🆘 **Support & Community**

### Getting Help
- **[GitHub Issues](https://github.com/your-username/kinect/issues)** - Bug reports and feature requests
- **[Discussions](https://github.com/your-username/kinect/discussions)** - Questions and community support
- **[Discord](https://discord.gg/your-invite)** - Real-time community chat

### Professional Support
- **Email**: support@kinect-app.com
- **Priority Support**: Available for sponsors
- **Custom Deployment**: Professional deployment assistance

---

## 🤝 **Contributing**

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Submit a pull request** with a clear description

### Development Setup
```bash
# Fork and clone
git clone https://github.com/your-username/kinect.git
cd kinect

# Install dependencies
npm install
cd backend && npm install  
cd ../frontend-web && npm install
cd ../shared && npm install

# Start development servers
npm run dev:all
```

---

## 📄 **License**

MIT License - feel free to use Kinect for personal or commercial projects.

---

## 🎯 **Roadmap**

### Current Features ✅
- Contact management and categorization
- Email reminder system  
- Multi-user support
- Self-hosted deployment
- Railway one-click deploy

### Coming Soon 🚧
- **Mobile Apps**: Native iOS and Android apps
- **Calendar Integration**: Sync with Google Calendar/Outlook
- **Social Media**: Track interactions across platforms
- **Advanced Analytics**: Relationship insights and trends
- **Team Features**: Shared contacts for organizations

### Community Requests 💡
- **SMS Reminders**: Text message notifications
- **Slack/Discord Bots**: Reminders in team chat
- **API Webhooks**: Integration with other tools
- **Bulk Import**: CSV/vCard contact import

---

## 🌟 **Why We Built Kinect**

In our hyper-connected digital world, it's paradoxically easy to lose touch with the people who matter most. Social media gives us the illusion of connection, but meaningful relationships require intentional, consistent effort.

Kinect was born from the frustration of:
- Forgetting to check in with old friends
- Losing touch with former colleagues  
- Feeling guilty about neglected relationships
- Struggling to maintain work-life relationship balance

**Our mission**: Make it effortless to maintain meaningful relationships by removing the mental overhead of tracking and remembering to reach out.

---

## 🚀 **Ready to Get Started?**

### For Personal Use:
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/kinect-self-hosted)

### For Developers:
```bash
git clone https://github.com/your-username/kinect.git
cd kinect && npm install && npm run dev:all
```

### Questions?
Join our [Discord community](https://discord.gg/your-invite) or [start a discussion](https://github.com/your-username/kinect/discussions).

---

**Never lose touch again.** 🤝