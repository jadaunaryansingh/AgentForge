# 📋 Deployment Checklist

Use this checklist to ensure a smooth deployment process.

---

## 🔧 Pre-Deployment Preparation

### Code Repository
- [ ] All code committed to Git
- [ ] `.gitignore` includes `.env` files
- [ ] No sensitive data in repository
- [ ] Code pushed to GitHub
- [ ] Repository is public or Render/Vercel has access

### Dependencies
- [ ] `apps/api/requirements.txt` is up to date
- [ ] `apps/web/package.json` includes all dependencies
- [ ] All imports work correctly
- [ ] No missing packages

### Configuration Files
- [ ] `render.yaml` created in `apps/api/`
- [ ] `vercel.json` created in `apps/web/`
- [ ] `Procfile` created in `apps/api/`
- [ ] `runtime.txt` created in `apps/api/`
- [ ] `.env.production` files created (not committed)

### Environment Variables
- [ ] All required variables documented
- [ ] Production SECRET_KEY generated
- [ ] API keys ready (Groq, Gemini)
- [ ] Database URL from Neon
- [ ] CORS origins list prepared

---

## 🚀 Backend Deployment (Render)

### Account Setup
- [ ] Render account created
- [ ] GitHub connected to Render
- [ ] Payment method added (if using paid tier)

### Service Configuration
- [ ] New Web Service created
- [ ] Repository connected
- [ ] Branch set to `main`
- [ ] Root directory set to `apps/api`
- [ ] Python runtime selected

### Build Settings
- [ ] Build command: `pip install -r requirements.txt`
- [ ] Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Python version: 3.11.0

### Environment Variables (Render)
- [ ] `DATABASE_URL` - Neon PostgreSQL connection
- [ ] `NEON_JWT_SECRET` - Neon Auth endpoint
- [ ] `SECRET_KEY` - Generated secure key
- [ ] `GROQ_API_KEY` - Groq API key
- [ ] `GROQ_MODEL` - Model name
- [ ] `GEMINI_API_KEY` - Gemini API key
- [ ] `GEMINI_MODEL` - Model name
- [ ] `REDIS_URL` - Redis connection (optional)
- [ ] `APP_ENV` - Set to `production`
- [ ] `CORS_ORIGINS` - JSON array of allowed origins

### Deployment
- [ ] Service created and deploying
- [ ] Build logs checked for errors
- [ ] Deployment successful
- [ ] Service URL noted

### Verification
- [ ] Health endpoint accessible: `/health`
- [ ] API docs accessible: `/docs`
- [ ] Database connection working
- [ ] No errors in logs

---

## 🌐 Frontend Deployment (Vercel)

### Account Setup
- [ ] Vercel account created
- [ ] GitHub connected to Vercel
- [ ] Payment method added (if using paid tier)

### Project Configuration
- [ ] New Project created
- [ ] Repository imported
- [ ] Framework detected (Vite)
- [ ] Root directory set to `apps/web`

### Build Settings
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Install command: `npm install`
- [ ] Node.js version: 18.x or higher

### Environment Variables (Vercel)
- [ ] `VITE_API_URL` - Render backend URL

### Deployment
- [ ] Project deployed
- [ ] Build logs checked for errors
- [ ] Deployment successful
- [ ] Production URL noted

### Verification
- [ ] Site loads correctly
- [ ] No console errors
- [ ] Assets loading properly
- [ ] Routing works

---

## 🔗 Integration & Testing

### CORS Configuration
- [ ] Backend CORS_ORIGINS updated with Vercel URL
- [ ] Backend redeployed with new CORS settings
- [ ] CORS errors resolved in browser console

### API Connection
- [ ] Frontend can reach backend API
- [ ] API calls return expected responses
- [ ] Error handling works correctly
- [ ] Loading states display properly

### Authentication Flow
- [ ] Registration works
- [ ] Login works
- [ ] JWT tokens generated correctly
- [ ] Protected routes work
- [ ] Logout works
- [ ] Token refresh works (if implemented)

### Database Operations
- [ ] User creation works
- [ ] Project creation works
- [ ] Architecture generation works
- [ ] Data persists correctly
- [ ] Queries perform well

### AI Features
- [ ] Groq API calls work
- [ ] Gemini API calls work
- [ ] Requirements extraction works
- [ ] Graph planning works
- [ ] Diagram generation works
- [ ] Code generation works

---

## 🎨 Custom Domain (Optional)

### Backend Domain
- [ ] Custom domain purchased
- [ ] DNS records configured
- [ ] Domain added in Render
- [ ] SSL certificate issued
- [ ] Domain verified and working

### Frontend Domain
- [ ] Custom domain purchased
- [ ] DNS records configured
- [ ] Domain added in Vercel
- [ ] SSL certificate issued
- [ ] Domain verified and working

### Update References
- [ ] Backend CORS updated with custom domain
- [ ] Frontend API URL updated with custom domain
- [ ] Both services redeployed

---

## 📊 Monitoring & Maintenance

### Logging
- [ ] Render logs accessible
- [ ] Vercel logs accessible
- [ ] Error tracking set up (optional)
- [ ] Performance monitoring set up (optional)

### Backups
- [ ] Database backup strategy in place
- [ ] Neon automatic backups enabled
- [ ] Code backed up in GitHub

### Documentation
- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Troubleshooting guide created

### Performance
- [ ] Backend response times acceptable
- [ ] Frontend load times acceptable
- [ ] Database queries optimized
- [ ] Assets optimized and cached

---

## 🐛 Post-Deployment Testing

### Functional Testing
- [ ] All pages load correctly
- [ ] All forms submit correctly
- [ ] All buttons work
- [ ] Navigation works
- [ ] Search works (if applicable)

### User Flows
- [ ] New user registration flow
- [ ] Existing user login flow
- [ ] Create project flow
- [ ] Generate architecture flow
- [ ] Export functionality

### Edge Cases
- [ ] Invalid input handling
- [ ] Network error handling
- [ ] Authentication errors
- [ ] Rate limiting (if implemented)
- [ ] Large data handling

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### Device Testing
- [ ] Desktop
- [ ] Tablet
- [ ] Mobile

---

## 🔐 Security Checklist

### Secrets Management
- [ ] No secrets in code repository
- [ ] Environment variables properly secured
- [ ] API keys rotated if exposed
- [ ] Database credentials secure

### Authentication
- [ ] JWT tokens properly signed
- [ ] Token expiration configured
- [ ] Refresh tokens implemented (if needed)
- [ ] Password hashing working

### API Security
- [ ] CORS properly configured
- [ ] Rate limiting considered
- [ ] Input validation in place
- [ ] SQL injection prevention
- [ ] XSS prevention

### HTTPS
- [ ] Backend uses HTTPS
- [ ] Frontend uses HTTPS
- [ ] Mixed content warnings resolved

---

## 📈 Performance Optimization

### Backend
- [ ] Database queries optimized
- [ ] Connection pooling configured
- [ ] Caching implemented (if needed)
- [ ] Response compression enabled

### Frontend
- [ ] Assets minified
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading used
- [ ] CDN configured (Vercel handles this)

---

## 🎉 Launch Checklist

### Final Verification
- [ ] All features working in production
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Monitoring active

### Communication
- [ ] Team notified of deployment
- [ ] Users notified (if applicable)
- [ ] Documentation updated
- [ ] Support team briefed

### Rollback Plan
- [ ] Previous version tagged in Git
- [ ] Rollback procedure documented
- [ ] Database migration rollback plan
- [ ] Emergency contacts listed

---

## 📞 Support Contacts

### Services
- **Render Support**: https://render.com/docs/support
- **Vercel Support**: https://vercel.com/support
- **Neon Support**: https://neon.tech/docs/introduction/support

### Documentation
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Quick Deploy**: `QUICK_DEPLOY.md`
- **API Docs**: `https://your-api.onrender.com/docs`

---

## ✅ Deployment Complete!

Once all items are checked:

🎊 **Congratulations!** Your AgentForge application is live!

- **Frontend**: https://agentforge.vercel.app
- **Backend**: https://agentforge-api.onrender.com
- **API Docs**: https://agentforge-api.onrender.com/docs

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Version**: 1.0.0
