# Render Deployment Guide

This guide provides step-by-step instructions for deploying the Design Document Generator to Render.

## Overview

The application consists of:
- **Frontend**: React SPA served as a static site
- **Backend**: Node.js Express API server
- **Database**: PostgreSQL database

## Prerequisites

1. A Render account (sign up at https://render.com)
2. A GitHub account with this repository
3. API keys for at least one AI provider (OpenAI, Anthropic, etc.)

## Deployment Steps

### 1. Fork or Push Repository

Ensure your code is pushed to a GitHub repository that Render can access.

### 2. Create Database

1. Log into Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `design-doc-generator-db`
   - **Database**: `design_doc_generator`
   - **User**: `design_doc_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or higher for production)
4. Click "Create Database"
5. Wait for database to be available

### 3. Deploy Using render.yaml (Recommended)

1. In Render Dashboard, click "New +" → "Blueprint"
2. Connect your GitHub repository
3. Render will detect the `render.yaml` file
4. Review the services to be created
5. Click "Apply"

### 4. Configure Environment Variables

After deployment, configure the following environment variables:

#### Backend Service (`design-doc-generator-api`):

1. Go to the backend service dashboard
2. Navigate to "Environment" tab
3. Add these variables:

```bash
# Frontend URL (update after frontend deploys)
FRONTEND_URL=https://design-doc-generator-frontend.onrender.com
ALLOWED_ORIGINS=https://design-doc-generator-frontend.onrender.com

# AI Provider Keys (add at least one)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
MISTRAL_API_KEY=...
PERPLEXITY_API_KEY=pplx-...

# Admin Configuration
ADMIN_API_KEY=<generate-secure-key>

# Supabase (if using for auth)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

#### Frontend Service (`design-doc-generator-frontend`):

1. Go to the frontend service dashboard
2. Navigate to "Environment" tab
3. Add:

```bash
# Backend API URL
VITE_API_URL=https://design-doc-generator-api.onrender.com
```

### 5. Manual Deployment (Alternative)

If you prefer to deploy services individually:

#### Deploy Database First
(Follow step 2 above)

#### Deploy Backend

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `design-doc-generator-api`
   - **Region**: Same as database
   - **Branch**: `render-rewrite` (or your branch)
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or higher)
4. Add environment variables (see step 4)
5. Click "Create Web Service"

#### Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `design-doc-generator-frontend`
   - **Region**: Same as backend
   - **Branch**: `render-rewrite` (or your branch)
   - **Root Directory**: (leave empty)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free (or higher)
4. Add environment variables (see step 4)
5. Click "Create Static Site"

### 6. Post-Deployment Setup

1. **Update CORS**: After both services deploy, update the backend's `FRONTEND_URL` and `ALLOWED_ORIGINS` with the actual frontend URL

2. **Run Database Migrations**:
   - SSH into the backend service (if available on your plan)
   - Or create a one-off job to run: `cd backend && npm run migrate`

3. **Verify Deployment**:
   - Visit backend health endpoint: `https://your-backend-url.onrender.com/health`
   - Visit frontend: `https://your-frontend-url.onrender.com`

## Monitoring & Maintenance

### Health Checks

- Backend health: `/health` endpoint
- Database status: `/api/admin/database/status` (requires admin API key)

### Logs

Access logs through Render Dashboard:
1. Go to service dashboard
2. Click "Logs" tab
3. Use filters to find specific issues

### Database Backups

For production:
1. Upgrade to a paid database plan
2. Enable automatic backups in database settings
3. Test restore procedure regularly

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `FRONTEND_URL` and `ALLOWED_ORIGINS` are correctly set
   - Check that URLs don't have trailing slashes

2. **Database Connection Failed**
   - Verify `DATABASE_URL` is automatically set by Render
   - Check database is in same region as backend
   - Ensure database is fully provisioned

3. **API Calls Failing**
   - Check `VITE_API_URL` in frontend environment
   - Verify backend is running (check health endpoint)
   - Review backend logs for errors

4. **Build Failures**
   - Check build logs in Render dashboard
   - Ensure all dependencies are in `package.json`
   - Verify Node version compatibility

### Environment Variable Issues

- Changes to environment variables require service restart
- Use Render dashboard to update variables
- Never commit sensitive keys to repository

## Performance Optimization

1. **Enable Caching**:
   - Frontend: Render automatically handles static asset caching
   - Backend: Implement Redis for session/data caching

2. **Database Optimization**:
   - Add appropriate indexes
   - Monitor slow queries
   - Consider connection pooling settings

3. **Scaling**:
   - Upgrade service plans for more resources
   - Enable auto-scaling (paid plans)
   - Monitor metrics in Render dashboard

## Security Best Practices

1. **API Keys**:
   - Rotate keys regularly
   - Use different keys for development/production
   - Never expose keys in frontend code

2. **Database**:
   - Use strong passwords
   - Enable SSL connections
   - Restrict access to known IPs (if possible)

3. **HTTPS**:
   - Render provides free SSL certificates
   - Ensure all traffic uses HTTPS
   - Set secure headers in application

## Updating the Application

1. **Automatic Deploys**:
   - Enable auto-deploy in service settings
   - Pushes to connected branch trigger deploys

2. **Manual Deploys**:
   - Use "Manual Deploy" button in dashboard
   - Select specific commit if needed

3. **Rollbacks**:
   - Use Render's deployment history
   - Click "Rollback" on previous deployment

## Cost Optimization

- Start with free tier for development
- Monitor usage in Render dashboard
- Upgrade only services that need it
- Consider:
  - Database: Upgrade for backups and better performance
  - Backend: Upgrade for more memory/CPU
  - Frontend: Usually fine on free tier

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Application Issues: Check GitHub repository issues