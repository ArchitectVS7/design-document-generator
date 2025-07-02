# Render Deployment Human Tasks

This document lists all the manual tasks that need to be completed by a human operator to deploy the Design Document Generator on Render.

## Pre-Deployment Checklist

- [ ] Ensure you have a Render account (https://render.com)
- [ ] Ensure you have pushed the `render-rewrite` branch to GitHub
- [ ] Have at least one AI provider API key ready (OpenAI, Anthropic, etc.)

## 1. Database Setup

1. [ ] Log into Render Dashboard
2. [ ] Click "New +" → "PostgreSQL"
3. [ ] Configure with these exact settings:
   - **Name**: `design-doc-generator-db`
   - **Database**: `design_doc_generator`  
   - **User**: `design_doc_user`
   - **Region**: Oregon (or your preferred region)
   - **Plan**: Free (or Starter for production)
4. [ ] Click "Create Database"
5. [ ] Wait for database to show "Available" status (may take 5-10 minutes)
6. [ ] Copy the Internal Database URL for later use

## 2. Deploy Services via Blueprint

1. [ ] In Render Dashboard, click "New +" → "Blueprint"
2. [ ] Connect your GitHub repository containing the `render-rewrite` branch
3. [ ] Render should auto-detect the `render.yaml` file
4. [ ] Review the services to be created:
   - Backend API Service
   - Frontend Static Site
   - Environment Groups
5. [ ] Click "Apply"
6. [ ] Wait for initial deployment (10-15 minutes)

## 3. Configure Backend Environment Variables

1. [ ] Navigate to the backend service (`design-doc-generator-api`)
2. [ ] Go to "Environment" tab
3. [ ] Add these required variables:

### Required API Keys (add at least one):
- [ ] `OPENAI_API_KEY` = `sk-...` (if using OpenAI)
- [ ] `ANTHROPIC_API_KEY` = `sk-ant-...` (if using Anthropic) 
- [ ] `GOOGLE_API_KEY` = `...` (if using Google)
- [ ] `MISTRAL_API_KEY` = `...` (if using Mistral)
- [ ] `PERPLEXITY_API_KEY` = `pplx-...` (if using Perplexity)

### Admin Configuration:
- [ ] `ADMIN_API_KEY` = (generate a secure 32+ character key)

### Frontend URL (after frontend deploys):
- [ ] `FRONTEND_URL` = `https://design-doc-generator-frontend.onrender.com`
- [ ] `ALLOWED_ORIGINS` = `https://design-doc-generator-frontend.onrender.com`

### Optional Supabase (if using for auth):
- [ ] `SUPABASE_URL` = `https://xxxx.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = `eyJ...`

4. [ ] Click "Save Changes"
5. [ ] Service will auto-restart

## 4. Configure Frontend Environment Variables

1. [ ] Navigate to the frontend service (`design-doc-generator-frontend`)
2. [ ] Go to "Environment" tab
3. [ ] Add:
   - [ ] `VITE_API_URL` = `https://design-doc-generator-api.onrender.com`
4. [ ] Click "Save Changes"
5. [ ] Trigger manual deploy to rebuild with new env vars

## 5. Update Backend CORS Settings

1. [ ] Return to backend service environment variables
2. [ ] Update with actual frontend URL:
   - [ ] `FRONTEND_URL` = (copy from frontend service URL)
   - [ ] `ALLOWED_ORIGINS` = (same as FRONTEND_URL)
3. [ ] Save and let service restart

## 6. Database Migration

### Option A: One-Off Job (Recommended)
1. [ ] In backend service, go to "Jobs" tab
2. [ ] Click "New Job"
3. [ ] Configure:
   - Command: `cd backend && npm run migrate`
   - Run once immediately
4. [ ] Click "Create Job"
5. [ ] Monitor logs for successful migration

### Option B: SSH (if available on your plan)
1. [ ] SSH into backend service
2. [ ] Run: `cd backend && npm run migrate`
3. [ ] Verify tables created successfully

## 7. Verification Tests

### Backend Health Check:
1. [ ] Visit: `https://[your-backend-url].onrender.com/health`
2. [ ] Verify response shows:
   - status: "healthy"
   - database status: "connected"

### API Status Check:
1. [ ] Visit: `https://[your-backend-url].onrender.com/api/status`
2. [ ] Verify successful response with version info

### Frontend Loading:
1. [ ] Visit: `https://[your-frontend-url].onrender.com`
2. [ ] Verify the application loads without errors
3. [ ] Open browser console and check for any errors

### API Connection Test:
1. [ ] In the frontend, try to create a new configuration
2. [ ] Verify API calls succeed (check Network tab)

## 8. Production Readiness (Optional)

### Upgrade Services:
- [ ] Consider upgrading database to Starter plan for:
  - Automated backups
  - Better performance
  - More connections

- [ ] Consider upgrading backend to Starter plan for:
  - More memory/CPU
  - Zero downtime deploys
  - Better performance

### Security:
- [ ] Rotate all API keys
- [ ] Set up monitoring alerts
- [ ] Enable 2FA on Render account
- [ ] Review and tighten CORS settings if needed

### Performance:
- [ ] Enable auto-scaling (paid plans)
- [ ] Set up CDN for frontend assets
- [ ] Configure caching headers

## Troubleshooting Checklist

If deployment fails:

### Database Connection Issues:
- [ ] Verify DATABASE_URL is set correctly
- [ ] Check database is in same region as backend
- [ ] Ensure database is fully provisioned
- [ ] Check logs for SSL connection errors

### CORS Errors:
- [ ] Verify FRONTEND_URL has no trailing slash
- [ ] Ensure ALLOWED_ORIGINS matches exactly
- [ ] Check browser console for specific CORS error
- [ ] Try hard refresh (Ctrl+Shift+R)

### Build Failures:
- [ ] Check build logs in Render dashboard
- [ ] Verify all dependencies in package.json
- [ ] Check Node.js version compatibility
- [ ] Look for missing environment variables

### API Call Failures:
- [ ] Verify VITE_API_URL is set correctly
- [ ] Check backend service is running
- [ ] Review API logs for errors
- [ ] Test health endpoint directly

## Post-Deployment Monitoring

Set up regular checks:
- [ ] Monitor service health daily
- [ ] Check error logs weekly
- [ ] Review database metrics
- [ ] Monitor API response times
- [ ] Set up uptime monitoring (e.g., UptimeRobot)

## Support Resources

- Render Documentation: https://render.com/docs
- Render Status Page: https://status.render.com
- Community Forum: https://community.render.com
- Support Ticket: Dashboard → Help → Contact Support