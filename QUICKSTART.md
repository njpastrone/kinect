# Kinect Self-Hosted - Quick Start Guide

Get your private relationship manager running locally with enhanced error handling and reliability.

> **✅ Ready**: Complete self-hosted deployment with advanced error handling and user feedback.

## 🚀 Quick Local Setup

**Prerequisites**: Docker and Docker Compose ([get it here](https://docs.docker.com/get-docker/))

```bash
# Clone or navigate to your Kinect repository
cd kinect

# Start all services with Docker Compose
docker compose -f docker-compose.selfhosted.yml up -d

# Wait for services to start (about 30-60 seconds)
docker compose -f docker-compose.selfhosted.yml ps
```

**Access at**: [http://localhost:3000](http://localhost:3000)

---

## 📋 Requirements

- **Docker** and **Docker Compose** ([get it here](https://docs.docker.com/get-docker/))
- **2GB** free disk space (for Docker images and data)
- **Modern browser** (Chrome, Firefox, Safari, Edge)
- **3 minutes** setup time

---

## ⚡ Quick Setup Steps

### 1. Start Services (30-60 seconds)
```bash
# Navigate to your Kinect directory
cd kinect

# Start all services (MongoDB, Backend API, Frontend)
docker compose -f docker-compose.selfhosted.yml up -d

# Verify all services are healthy
docker compose -f docker-compose.selfhosted.yml ps
```

**Expected output:**
```
NAME         STATUS              PORTS
kinect-db    Up (healthy)        27017/tcp
kinect-api   Up (healthy)        3001/tcp
kinect-web   Up (healthy)        0.0.0.0:3000->80/tcp
```

### 2. Verify Access (30 seconds)
```bash
# Test frontend (should return HTTP 200)
curl -I http://localhost:3000

# Test nginx health endpoint
curl http://localhost:3000/health

# Test API connectivity (should return auth error)
curl http://localhost:3000/api/contacts
```

### 3. Test Error Handling Features (2 minutes)
Open [http://localhost:3000](http://localhost:3000) and test these enhanced features:

**✅ Form Validation:**
1. Click "Add Contact" 
2. Leave required fields empty and submit
3. **Expected**: Professional error messages with icons

**✅ Network Error Recovery:**
1. Create a contact successfully first
2. Disconnect your internet briefly
3. Try another operation
4. **Expected**: "Request failed. Retrying..." toasts with automatic retry

**✅ Error Boundaries:**
1. Open browser DevTools (F12) → Console
2. Type: `window.__debugErrors.testError("Test boundary")`
3. **Expected**: Error boundary shows with retry option

**✅ Development Debug Tools:**
1. In Console: `window.__debugErrors.showErrors()`
2. **Expected**: Complete error history display
3. Try: `window.__debugErrors.downloadErrorReport()`
4. **Expected**: Downloads comprehensive error report JSON

### 4. Initial Application Setup (2 minutes)
1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Register" to create your account
3. Fill out the registration form
4. **Expected**: Clear validation feedback and success notifications
5. Login with your new credentials
6. Start adding contacts with enhanced form experience

---

## 🧪 Testing the Enhanced Error Handling

### **Form Improvements**
- **Consistent Validation**: All forms show clear error messages with icons
- **Loading States**: Professional loading buttons with spinners  
- **Success Feedback**: Toast notifications confirm successful operations
- **Error Recovery**: Failed operations automatically retry with exponential backoff

### **Network Resilience**  
- **Automatic Retry**: Failed requests retry up to 3 times automatically
- **Circuit Breaker**: Prevents cascading failures during outages
- **Optimistic Updates**: Immediate UI feedback with graceful rollback on errors
- **Request Deduplication**: Prevents duplicate API calls

### **Development Tools**
- **Error Boundaries**: React errors caught gracefully with retry options
- **Debug Console**: Access via `window.__debugErrors` for error analytics  
- **Error Reports**: Downloadable JSON reports for troubleshooting
- **Stack Traces**: Detailed error context in development mode

---

## 🔒 Privacy Features

- ✅ **100% Local** - Data never leaves your device
- ✅ **No Cloud** - No external services required  
- ✅ **No Tracking** - Zero telemetry or analytics
- ✅ **Open Source** - Fully auditable code
- ✅ **Your Control** - Export data anytime

---

## 🔧 Common Tasks

### Import Contacts
**From iPhone:**
1. Contacts app → Export → Share as vCard
2. In Kinect: Settings → Import → Upload .vcf file

**From Android:**
1. Contacts app → Export → Save as CSV
2. In Kinect: Settings → Import → Upload CSV file

**From Google:**
1. Google Contacts → Export → Google CSV
2. In Kinect: Settings → Import → Upload CSV file

### Backup Your Data
```bash
cd kinect
docker compose -f docker-compose.selfhosted.yml exec mongodb mongodump --out /backups
```

---

## 🆘 Troubleshooting

### Quick Health Check
```bash
# 1. Verify all services are running and healthy
docker compose -f docker-compose.selfhosted.yml ps

# 2. Test frontend access
curl -I http://localhost:3000

# 3. Test nginx health
curl http://localhost:3000/health

# 4. Test API proxy (should return auth error, not 404)
curl http://localhost:3000/api/contacts

# 5. Check for errors in logs
docker compose -f docker-compose.selfhosted.yml logs --tail=20
```

### Service Issues

**Services not starting:**
```bash
# Check detailed logs
docker compose -f docker-compose.selfhosted.yml logs

# Rebuild and restart
docker compose -f docker-compose.selfhosted.yml down
docker compose -f docker-compose.selfhosted.yml up -d --build
```

**Frontend not accessible:**
```bash
# Check frontend container logs
docker compose -f docker-compose.selfhosted.yml logs frontend

# Restart frontend service  
docker compose -f docker-compose.selfhosted.yml restart frontend
```

**API requests failing:**
```bash
# Check backend container logs
docker compose -f docker-compose.selfhosted.yml logs backend

# Verify backend is healthy
docker compose -f docker-compose.selfhosted.yml ps backend
```

**Port 3000 already in use:**
```bash
# Check what's using the port
sudo lsof -i :3000

# Stop the conflicting service or change port in docker-compose.selfhosted.yml:
# ports:
#   - "3001:80"  # Use port 3001 instead
```

### Reset Everything (Nuclear Option)
```bash
# WARNING: This destroys all data
docker compose -f docker-compose.selfhosted.yml down -v
docker compose -f docker-compose.selfhosted.yml up -d --build
```

---

## ✅ Verified Testing Scenarios

### **Registration & Login**
1. ✅ Form validation with clear error messages
2. ✅ Loading states during submission
3. ✅ Success notifications on completion
4. ✅ Network error handling with retry

### **Contact Management**
1. ✅ Add contacts with validation feedback
2. ✅ Edit contacts with optimistic updates
3. ✅ Delete contacts with confirmation
4. ✅ Network interruption recovery

### **List Management**  
1. ✅ Create contact lists with error handling
2. ✅ Assign contacts to lists
3. ✅ Edit and delete lists safely
4. ✅ Real-time count updates

### **Dashboard & Navigation**
1. ✅ Error boundaries protect navigation
2. ✅ Graceful error recovery on data load failures
3. ✅ Loading states for all data operations
4. ✅ Toast notifications for all actions

---

## 📞 Support

| Issue Type | Solution |
|------------|----------|
| **Setup Problems** | Check service logs: `docker compose -f docker-compose.selfhosted.yml logs` |
| **Error Handling** | Use debug tools: `window.__debugErrors.showErrors()` |
| **Network Issues** | Check proxy config and service connectivity |
| **Data Problems** | Export data before troubleshooting |

---

## 🎉 Success! Your Enhanced Kinect is Ready

### 🔗 Access Your Instance
**Primary URL**: [http://localhost:3000](http://localhost:3000)

### 🛡️ What You've Achieved
- ✅ **Private & Secure**: All data stays local
- ✅ **Error-Resilient**: Automatic retry and graceful failure handling  
- ✅ **User-Friendly**: Clear feedback and professional UX
- ✅ **Developer-Ready**: Comprehensive debugging and monitoring tools
- ✅ **Production-Grade**: Docker deployment with health checks

### ⚡ Quick Commands
```bash
# Stop services
docker compose -f docker-compose.selfhosted.yml down

# Start services
docker compose -f docker-compose.selfhosted.yml up -d

# View logs
docker compose -f docker-compose.selfhosted.yml logs -f

# Health check
docker compose -f docker-compose.selfhosted.yml ps
curl http://localhost:3000/health
```

---

## 🌟 New Error Handling Features

### **User Experience Improvements**
- **Smart Retry Logic**: Automatic retry with exponential backoff
- **Professional Loading States**: Spinners and progress indicators
- **Clear Error Messages**: Accessible, actionable feedback
- **Optimistic Updates**: Instant UI feedback with rollback

### **Developer Experience** 
- **Error Boundaries**: Graceful React error handling
- **Debug Tools**: Console-accessible error analytics
- **Error Reports**: Downloadable troubleshooting data
- **Development Overlay**: Rich error information in dev mode

### **Network Resilience**
- **Circuit Breaker**: Prevents cascading failures
- **Request Deduplication**: Avoids duplicate API calls  
- **Connection Recovery**: Automatic reconnection handling
- **Timeout Management**: Smart timeout and retry policies

**Need Help?** All features are tested and working. Use the debug tools (`window.__debugErrors`) for troubleshooting.

---

*🔒 Built with privacy and reliability in mind for relationship-focused individuals*