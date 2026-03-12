# Vercel Deployment Fix Guide - Qena Market

## Problem Analysis

The deployment failure with exit code 127 was caused by several configuration issues:

1. **Incorrect build command** - The root `vercel.json` was not properly configured for a monorepo
2. **Missing backend build in root build script** - Backend wasn't being compiled before deployment
3. **Serverless function entry point** - Backend API wasn't properly set up as a Vercel serverless function
4. **Workspace configuration** - Root `package.json` declared workspaces but didn't handle the build correctly

## Solutions Applied

### 1. Updated Root `package.json`

**Changes:**
- Modified `vercel-build` script to build frontend and prepare backend for deployment
- Removed workspace declaration (Vercel doesn't handle npm workspaces well)
- Added proper build sequence

```json
"vercel-build": "npm run build && cd backend && npm install && npx prisma generate"
```

### 2. Updated Root `vercel.json`

**Changes:**
- Simplified configuration for monorepo structure
- Added proper rewrites for API routes and SPA fallback
- Removed complex build configuration (let package.json handle it)

```json
{
  "version": 2,
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/api/index.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3. Updated Backend `package.json`

**Changes:**
- Added `vercel-build` script that compiles TypeScript and generates Prisma client
- Ensured Node.js version requirement is `>=18`

```json
"vercel-build": "tsc && npx prisma generate"
```

### 4. Updated Backend `vercel.json`

**Changes:**
- Configured serverless function at `api/index.ts`
- Set proper runtime and memory allocation
- Added build configuration for Vercel Node builder

```json
{
  "version": 2,
  "name": "qena-market-backend",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/index.ts": {
      "runtime": "nodejs18.x",
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node",
      "config": {
        "includeFiles": [
          "dist/**",
          "prisma/**"
        ]
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ]
}
```

### 5. Updated Backend `src/index.ts`

**Changes:**
- Modified production check to exclude Vercel environment
- Ensures app exports correctly for serverless deployment

```typescript
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  // Start server only in local development
}
```

## Environment Variables Required on Vercel

### Frontend Environment Variables
Set these in Vercel Project Settings → Environment Variables:

```
VITE_API_URL=https://your-deployment-url.vercel.app/api
```

### Backend Environment Variables
Set these in Vercel Project Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-deployment-url.vercel.app
NODE_ENV=production
PORT=3000
```

## Deployment Steps

### Step 1: Push Changes to GitHub

```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

### Step 2: Configure Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project "qena-market"
3. Go to **Settings** → **Environment Variables**
4. Add all required environment variables (see list above)

### Step 3: Redeploy on Vercel

**Option A: Automatic (Recommended)**
- Push changes to GitHub
- Vercel will automatically detect and deploy

**Option B: Manual Redeploy**
1. Go to Vercel Dashboard
2. Select your project
3. Click **Deployments**
4. Click **Redeploy** on the latest deployment
5. Or use Vercel CLI:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

### Step 4: Verify Deployment

1. **Check Frontend:**
   - Visit `https://your-deployment-url.vercel.app`
   - Should load the React application

2. **Check Backend API:**
   - Visit `https://your-deployment-url.vercel.app/api/health`
   - Should return: `{"success": true, "message": "الخادم يعمل بشكل طبيعي", ...}`

3. **Check Logs:**
   - Go to Vercel Dashboard
   - Select project
   - Click **Deployments**
   - Click on the latest deployment
   - Check **Logs** for any errors

## Troubleshooting

### Issue: "npm run build exited with 127"

**Solution:**
- Ensure all environment variables are set in Vercel
- Check that `vercel-build` script exists in root `package.json`
- Verify backend build completes successfully

### Issue: API Routes Return 404

**Solution:**
- Ensure `/api/` routes are being rewritten to `/backend/api/index.ts`
- Check that backend `dist/` folder is created during build
- Verify `backend/api/index.ts` exports the Express app

### Issue: Database Connection Fails

**Solution:**
- Verify `DATABASE_URL` is set correctly in Vercel environment variables
- Ensure database is accessible from Vercel's IP range
- Check Prisma migrations have been run: `npx prisma migrate deploy`

### Issue: CORS Errors

**Solution:**
- Update `FRONTEND_URL` environment variable in backend
- Ensure CORS configuration in `backend/src/index.ts` includes your Vercel domain
- Check that `Access-Control-Allow-Origin` header is set correctly

## File Structure After Fix

```
qena-market/
├── package.json (updated)
├── vercel.json (updated)
├── vite.config.ts
├── src/ (React frontend)
│   ├── App.tsx
│   ├── main.tsx
│   └── ...
├── backend/
│   ├── package.json (updated)
│   ├── vercel.json (updated)
│   ├── api/
│   │   └── index.ts (serverless entry point)
│   ├── src/
│   │   ├── index.ts (updated)
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma
│   └── dist/ (generated during build)
└── ...
```

## Build Process Flow

1. **Vercel receives push to main branch**
2. **Runs `npm run vercel-build`** (from root `package.json`)
3. **Frontend build:**
   - Runs `tsc -b && vite build`
   - Outputs to `dist/` folder
4. **Backend preparation:**
   - Installs dependencies: `cd backend && npm install`
   - Generates Prisma client: `npx prisma generate`
5. **Vercel detects serverless function** at `backend/api/index.ts`
6. **Builds backend function:**
   - Compiles TypeScript to `dist/`
   - Bundles with dependencies
   - Creates serverless function
7. **Deployment complete:**
   - Frontend served from `dist/`
   - API routes handled by backend serverless function

## Performance Optimization

### Recommended Settings in Vercel

1. **Memory Allocation:**
   - Backend function: 1024 MB (current setting)
   - Can increase to 3008 MB if needed for heavy operations

2. **Max Duration:**
   - Backend function: 60 seconds (current setting)
   - Suitable for most API operations

3. **Caching:**
   - Enable caching for static assets in frontend
   - Set appropriate cache headers in backend

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to GitHub
   - Use `.env.example` for documentation
   - Rotate JWT secrets regularly

2. **CORS Configuration:**
   - Only allow your frontend domain
   - Update `FRONTEND_URL` for each environment

3. **Rate Limiting:**
   - Already configured in backend
   - Adjust limits based on usage patterns

4. **Database Security:**
   - Use strong passwords
   - Restrict database access to Vercel IPs
   - Enable SSL connections

## Monitoring and Logging

1. **Vercel Analytics:**
   - Monitor deployment frequency
   - Track build times
   - Check error rates

2. **Backend Logs:**
   - Check Vercel Deployments → Logs
   - Look for database connection errors
   - Monitor API response times

3. **Error Tracking:**
   - Set up error tracking service (e.g., Sentry)
   - Monitor production errors
   - Set up alerts for critical issues

## Next Steps

1. ✅ Push changes to GitHub
2. ✅ Set environment variables in Vercel
3. ✅ Redeploy project
4. ✅ Verify deployment
5. ✅ Monitor logs for errors
6. ✅ Test API endpoints
7. ✅ Test frontend functionality
8. ✅ Set up monitoring and alerts

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## Rollback Instructions

If deployment fails, you can rollback to previous version:

1. Go to Vercel Dashboard
2. Select project
3. Click **Deployments**
4. Find previous successful deployment
5. Click **Promote to Production**

Or revert Git changes:
```bash
git revert HEAD
git push origin main
```
