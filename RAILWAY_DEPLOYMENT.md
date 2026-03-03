# Railway Deployment Guide for Gishoma

This guide provides step-by-step instructions for deploying Gishoma to Railway, a modern cloud platform.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start (5 minutes)](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Environment Variables](#environment-variables)
5. [Database Configuration](#database-configuration)
6. [Troubleshooting](#troubleshooting)
7. [Post-Deployment](#post-deployment)

---

## Prerequisites

### Required
- Railway account ([railway.app](https://railway.app))
- Git repository with Gishoma code
- GitHub account (for GitHub integration)

### Tools
- Railway CLI (optional but recommended)
  ```bash
  npm i -g @railway/cli
  ```

---

## Quick Start

### 1. Connect GitHub Repository
1. Log in to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Connect your GitHub account (if not already connected)
5. Select the Gishoma repository
6. Railway auto-detects the project structure

### 2. Add MySQL Database
1. In your Railway project, click **"+ New Service"**
2. Search for **"MySQL"**
3. Select and add MySQL 8.0
4. Railway automatically creates DATABASE_URL environment variable

### 3. Configure Environment Variables
1. Go to your project's **Variables** tab
2. Add the required environment variables (see [Environment Variables](#environment-variables))
3. Click **Deploy**

### 4. Deploy
1. Railway automatically deploys when you push to main branch
2. Check **Deployments** tab for status
3. Once deployed, your app will have a public URL

**That's it!** 🎉

---

## Detailed Setup

### Step 1: Prepare Your Repository

```bash
# Ensure all files are committed
git add .
git commit -m "Configure for Railway deployment"
git push origin main
```

### Step 2: Create Railway Project

```bash
# Option A: Using Web Interface (Recommended)
# Visit https://railway.app/new and select "Deploy from GitHub"

# Option B: Using Railway CLI
railway login
railway init
railway up
```

### Step 3: Add Services

#### 3.1 Add MySQL Database
```bash
railway service add mysql
```

Or via web interface:
- Click **"+ New Service"**
- Select **"MySQL"**
- Accept defaults
- Connection details auto-configured in `DATABASE_URL`

#### 3.2 Add Node.js Service (Auto-detected)
Railway automatically detects Node.js and creates the service.

### Step 4: Set Environment Variables

Railway provides an environment configuration interface:

1. Navigate to your project **Variables** section
2. Add these variables:

```
NODE_ENV=production
FRONTEND_URL=https://yourdomain.railway.app
JWT_ACCESS_SECRET=<generate-strong-random-64-char-string>
JWT_REFRESH_SECRET=<generate-strong-random-64-char-string>
```

**To generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy

1. Commit configuration files to your repository
2. Push to main branch
3. Railway automatically triggers deployment
4. Monitor progress in **Deployments** tab

---

## Environment Variables

### Required Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Deployment environment | `production` |
| `JWT_ACCESS_SECRET` | JWT signing key (min 64 chars) | Generated string |
| `JWT_REFRESH_SECRET` | JWT refresh key (min 64 chars) | Generated string |
| `FRONTEND_URL` | Frontend domain URL | `https://gishoma.railway.app` |

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |
| `MAX_LOGIN_ATTEMPTS` | Brute force limit | `5` |
| `LOCKOUT_DURATION_MINUTES` | Account lockout time | `15` |
| `ENCRYPTION_KEY` | Data encryption at rest | Disabled |
| `DB_SSL` | Database SSL/TLS | `false` |

### Auto-Configured Variables

Railway automatically provides:
- `DATABASE_URL` - MySQL connection string
- `PORT` - Dynamic port assignment (default 5000)

---

## Database Configuration

### Initial Setup

Railway's MySQL service includes:
- ✅ Automatic connection URL in `DATABASE_URL`
- ✅ Auto-initialized on first deployment
- ✅ Automatic backups
- ✅ Point-in-time recovery

### First Deployment

The application automatically:
1. Initializes database schema
2. Seeds sample data (if configured)
3. Runs migrations

**To manually initialize:**
```bash
railway run npm run db:init
railway run npm run db:seed
```

### Backup Strategy

1. **Automatic backups** - Railway backs up daily
2. **Access backups** - Via Railway dashboard
3. **Export data** - Use mysqldump via Railway CLI

```bash
# Connect to database
railway connect mysql

# In MySQL shell:
# SHOW DATABASES;
# Use Gishoma;
# SHOW TABLES;
```

### Database Monitoring

Monitor database via Railway dashboard:
- Connection stats
- Query performance
- Disk usage
- Automatic scaling

---

## Deployment Architecture

```
GitHub Repository
       ↓
    (push)
       ↓
Railway CI/CD Pipeline
       ↓
   ┌─────────┬──────────┐
   ↓         ↓          ↓
Backend   Frontend   MySQL
Service   Service    Service
   ↓         ↓          ↓
Public    Static    Database
  API      Files     Storage
```

### Backend Service
- **Port:** 5000 (dynamic)
- **Build:** `npm install`
- **Start:** `node src/server.js`
- **Health check:** `/api/health` endpoint

### Frontend Service (Alternative)
- **Port:** 3000 (if deployed separately)
- **Build:** `npm run build`
- **Serve:** Static files from `dist/`

### MySQL Service
- **Port:** 3306 (internal only)
- **Version:** 8.0+
- **Connection:** Via `DATABASE_URL`

---

## Troubleshooting

### Build Fails

**Problem:** Build step times out or fails
**Solution:**
```bash
# Check build logs in Railway dashboard
# Common issues:
# 1. Missing package.json in backend/
# 2. Node version incompatibility
# 3. Memory constraints

# Increase timeout:
# Set RAILWAY_BUILD_TIMEOUT=3600 in variables
```

### Database Connection Error

**Problem:** `ECONNREFUSED` or `ER_ACCESS_DENIED_FOR_USER`
**Solution:**
```bash
# 1. Verify DATABASE_URL is set
# 2. Check MySQL service is running
# 3. Confirm database initialization

railway run npm run db:init
```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use`
**Solution:**
- Railway manages port assignment automatically
- Check that code uses `process.env.PORT || 5000`
- Confirm backend/src/server.js has correct port setup

### Frontend Not Loading

**Problem:** Frontend returns 404 errors
**Solution:**
```bash
# If hosting frontend separately:
1. Deploy frontend as separate Railway service
2. Use Dockerfile.frontend for static hosting
3. Update FRONTEND_URL to match deployed URL
4. Configure CORS in backend for frontend domain
```

### Insufficient Memory

**Problem:** Service crashes with OOM errors
**Solution:**
```bash
# Via Railway dashboard:
1. Go to service settings
2. Increase memory allocation
3. Enable auto-scaling if available

# Optimize:
- Add NODE_OPTIONS="--max-old-space-size=512"
```

### Deployment Loop

**Problem:** Service keeps restarting
**Solution:**
```bash
# 1. Check deployment logs
# 2. Verify all required env vars are set
# 3. Test locally: npm start
# 4. Common causes:
#    - Missing JWT secrets
#    - Database not initialized
#    - Node version mismatch
```

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Test health endpoint
curl https://your-app.railway.app/api/health

# Test login
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@gishoma.edu","password":"password123"}'
```

### 2. Set Up Custom Domain

1. In Railway project settings, go to **Domains**
2. Click **"Add Custom Domain"**
3. Enter your domain (e.g., `gishoma.yourdomain.com`)
4. Update DNS records as shown
5. SSL certificate auto-provisioned

### 3. Monitor Application

Railway provides real-time monitoring:
- **Metrics** - CPU, memory, request rate
- **Logs** - Application and deployment logs
- **Deployments** - Rollback and deployment history
- **Analytics** - Performance and uptime

### 4. Set Up Auto-Deployment

Already configured! Railway automatically deploys on:
- Push to main branch
- Manual trigger via dashboard
- Scheduled deployments (if configured)

### 5. Backup Strategy

**Before making changes:**
```bash
# Create database backup
railway run mysqldump -u root -p Gishoma > backup.sql

# Export to safe location
```

### 6. Scaling Configuration

Adjust resources via Railway dashboard:
- **CPU allocation** - Default 0.5, max 4
- **Memory allocation** - Default 512MB, scales as needed
- **Auto-scaling** - Available for professional plans

---

## Useful Railway Commands

```bash
# Login to Railway
railway login

# List services
railway service list

# View logs
railway logs

# Run command in deployed service
railway run npm run db:seed

# Connect to MySQL
railway connect mysql

# View environment variables
railway env

# Set environment variable
railway env set JWT_ACCESS_SECRET=your_secret_here

# Redeploy latest
railway redeploy

# Stop service
railway stop

# Restart service
railway restart
```

---

## Cost Estimation

Railway pricing (as of 2024):
- **Starter plan:** $5/month base + usage
- **Pro plan:** $20/month base + usage
- **Resources:**
  - Node.js service: ~$0.10/hour at baseline
  - MySQL: ~$10-30/month depending on usage
  - Estimated total: **$30-50/month** for small instance

### Cost Optimization
- Use Railway's resource limits
- Configure auto-scaling
- Monitor usage in dashboard
- Optimize database queries

---

## Additional Resources

- **Railway Documentation:** https://docs.railway.app
- **Railway CLI Reference:** https://docs.railway.app/cli/cli-reference
- **Deploy Examples:** https://github.com/railwayapp/examples
- **Support:** https://railway.app/support

---

## Support & Help

### Getting Help

1. **Railway Docs:** https://docs.railway.app
2. **Community:** Railway Discord channel
3. **Status Page:** https://status.railway.app
4. **Email Support:** support@railway.app (pro plan)

### Common Issues Repository

Check Railway's examples and documentation for common patterns:
- Node.js + Express deployment
- MySQL database setup
- Custom domain configuration
- Environment variable management

---

## Next Steps

After successful deployment:

1. ✅ Configure custom domain
2. ✅ Set up monitoring alerts
3. ✅ Configure automatic backups
4. ✅ Document deployment runbook
5. ✅ Set up CI/CD for testing
6. ✅ Configure staging environment

---

**Gishoma is now deployed and running on Railway!** 🚀
