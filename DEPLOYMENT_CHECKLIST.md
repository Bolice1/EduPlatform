# Gishoma Railway Deployment Checklist

Use this checklist to ensure your deployment is properly configured and ready for production.

---

## Pre-Deployment ✓

### Repository Setup
- [ ] All code committed to main branch
- [ ] `.env.example` file exists with all required variables documented
- [ ] `.gitignore` includes `.env` (secrets never committed)
- [ ] Dockerfile exists and is tested locally
- [ ] `.railwayignore` configured to exclude unnecessary files
- [ ] `railway.toml` or `railway.json` configured

### Code Quality
- [ ] Backend starts successfully: `npm start`
- [ ] Frontend builds successfully: `npm run build`
- [ ] No console errors in development
- [ ] Health check endpoint working: `GET /api/health`
- [ ] Database initialization script tested: `npm run db:init`

### Environment Configuration
- [ ] `.env.example` covers all required variables
- [ ] JWT secrets documented (min 64 characters)
- [ ] Database credentials are placeholder/examples only
- [ ] No sensitive data in code or documentation
- [ ] FRONTEND_URL variable documented

---

## Railway Configuration ✓

### Account & Project
- [ ] Railway account created (railway.app)
- [ ] GitHub connected to Railway
- [ ] Repository authorized for Railway access
- [ ] Project created in Railway

### Services
- [ ] Backend service added/detected
- [ ] MySQL service added
- [ ] Services are linked (DATABASE_URL auto-configured)
- [ ] Health checks configured

### Environment Variables
Set in Railway project variables panel:

**Required:**
- [ ] `NODE_ENV=production`
- [ ] `JWT_ACCESS_SECRET` (64+ character random string)
- [ ] `JWT_REFRESH_SECRET` (64+ character random string)
- [ ] `FRONTEND_URL=https://yourdomain.railway.app`

**Optional but Recommended:**
- [ ] `BCRYPT_ROUNDS=12`
- [ ] `MAX_LOGIN_ATTEMPTS=5`
- [ ] `LOCKOUT_DURATION_MINUTES=15`

**Auto-Configured by Railway:**
- [ ] `DATABASE_URL` (visible after MySQL service added)
- [ ] `PORT` (5000 default)

---

## Database ✓

### MySQL Service
- [ ] MySQL 8.0 service deployed
- [ ] Connection pooling configured
- [ ] `DATABASE_URL` environment variable present
- [ ] Database initialization runs on deploy

### Data
- [ ] `db:init` script creates all tables
- [ ] `db:seed` script loads sample data (optional)
- [ ] Sample users available for testing:
  - [ ] superadmin@gishoma.edu / password123

### Backups
- [ ] Automatic daily backups enabled (Railway default)
- [ ] Backup retention policy understood
- [ ] Manual backup created before first production deploy

---

## Deployment Testing ✓

### Initial Deployment
- [ ] Push to main branch triggers Railway build
- [ ] Build completes without errors
- [ ] Application starts (check Deployments tab)
- [ ] No restart loops or crashes

### Health Checks
- [ ] Health endpoint responds: `GET /api/health`
- [ ] Returns: `{"status":"ok","database":"connected"}`
- [ ] Login endpoint responds: `POST /api/auth/login`
- [ ] Database queries work correctly

### Functional Testing
- [ ] Can login with demo credentials
- [ ] Dashboard loads and displays data
- [ ] Can perform basic operations (create, read, update)
- [ ] Navigation between pages works
- [ ] Real-time features work (if applicable)

---

## Security ✓

### Secrets Management
- [ ] No credentials committed to repository
- [ ] All secrets stored in Railway variables, not code
- [ ] `.env` not tracked in git
- [ ] JWT secrets are cryptographically random
- [ ] Database password is strong (not default)

### HTTPS/SSL
- [ ] HTTPS enabled (Railway auto-provides)
- [ ] Redirection from HTTP to HTTPS configured
- [ ] SSL certificate auto-renewed (Railway handles)

### Access Control
- [ ] Database only accessible from backend service
- [ ] Backend port not exposed directly
- [ ] Authentication required for all protected endpoints
- [ ] Rate limiting enabled (brute force protection)

### Data Protection
- [ ] Database backups encrypted (Railway default)
- [ ] Connection uses parameterized queries (SQL injection prevention)
- [ ] CORS configured appropriately
- [ ] Sensitive data not logged

---

## Monitoring & Logs ✓

### Logs
- [ ] Deployment logs reviewed (no errors)
- [ ] Application logs monitored for warnings
- [ ] Database logs checked for issues
- [ ] Error rate acceptable

### Metrics
- [ ] CPU usage reasonable (< 70%)
- [ ] Memory usage acceptable (< 80%)
- [ ] Request response time good (< 500ms)
- [ ] Database query performance monitored

### Alerts
- [ ] High memory alert set
- [ ] High error rate alert set
- [ ] Service down alert configured
- [ ] Contact information for alerts

---

## Post-Deployment ✓

### Domain & DNS
- [ ] Custom domain added in Railway settings
- [ ] DNS records updated (CNAME or A record)
- [ ] SSL certificate provisioned (auto)
- [ ] Domain resolves correctly

### Testing in Production
- [ ] Test with production URL
- [ ] Login test with real credentials
- [ ] Test all major features
- [ ] Check mobile responsiveness
- [ ] Test on different browsers

### Documentation
- [ ] Deployment procedure documented
- [ ] Runbook created for common tasks
- [ ] Emergency procedure documented
- [ ] Team members have access

### Monitoring Setup
- [ ] Dashboard monitoring active
- [ ] Log aggregation working
- [ ] Performance metrics collected
- [ ] Alerts configured and tested

---

## Ongoing Maintenance ✓

### Regular Tasks
- [ ] Daily: Check logs for errors
- [ ] Weekly: Review performance metrics
- [ ] Monthly: Backup audit
- [ ] Monthly: Security review

### Updates
- [ ] Node.js version kept current
- [ ] Dependencies updated regularly
- [ ] Security patches applied promptly
- [ ] Database version maintained

### Scaling
- [ ] Monitor resource usage
- [ ] Plan for growth
- [ ] Configure auto-scaling if available
- [ ] Review cost monthly

---

## Rollback Plan ✓

### In Case of Issues
- [ ] Know how to revert to previous deployment
- [ ] Previous deployment available
- [ ] Database backup exists
- [ ] Rollback procedure tested

**Quick Rollback:**
```bash
railway redeploy <previous-deployment-id>
```

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| DevOps | | | |
| Backend Developer | | | |
| System Admin | | | |

---

## Deployment Completed ✓

**Date:** _______________  
**Deployed By:** _______________  
**Production URL:** _______________  
**Notes:** 

_________________________________________________________________________

_________________________________________________________________________

---

**Next Review Date:** _______________

For issues, refer to [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) or Railway documentation.
