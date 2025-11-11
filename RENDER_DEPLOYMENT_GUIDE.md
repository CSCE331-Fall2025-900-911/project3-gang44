# Render Deployment Guide for Customer Kiosk

This guide will help you deploy both the frontend and backend of your customer kiosk application to Render.

## Prerequisites

- A [Render account](https://render.com) (free tier works)
- Your GitHub repository connected to Render
- Environment variables from your local `.env` files

## Deployment Steps

### Step 1: Push Your Code to GitHub

Make sure all your code changes are pushed to your GitHub repository:

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### Step 2: Create a New Blueprint on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on "New +" button in the top right
3. Select "Blueprint"
4. Connect your GitHub repository: `project3-gang44`
5. Render will automatically detect the `render.yaml` file

### Step 3: Configure Environment Variables

Render will prompt you to add the environment variables. You need to set these:

#### Backend Environment Variables

Copy these from your `customerkiosk/backend/.env` file:

```
DB_HOST=csce-315-db.engr.tamu.edu
DB_PORT=5432
DB_NAME=gang_44_db
DB_USER=gang_44
DB_PASSWORD=LKCoyz78
GOOGLE_CLIENT_ID=292199993155-eoddl3h07brh9h4bqml0c6khtd8h240f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
JWT_SECRET=your_random_secret_string_here
```

#### Frontend Environment Variables

For the frontend, you'll need to set:

```
VITE_GOOGLE_CLIENT_ID=292199993155-eoddl3h07brh9h4bqml0c6khtd8h240f.apps.googleusercontent.com
VITE_API_URL=<YOUR_BACKEND_URL>
```

**IMPORTANT**: Replace `<YOUR_BACKEND_URL>` with your backend service URL from Render.
It will look like: `https://customer-kiosk-backend.onrender.com`

### Step 4: Deploy

1. After setting all environment variables, click "Apply"
2. Render will start building and deploying both services
3. Wait for both services to show "Live" status (this may take 5-10 minutes)

### Step 5: Update Frontend API URL

1. Once the backend is deployed, copy its URL (e.g., `https://customer-kiosk-backend.onrender.com`)
2. Go to your frontend service in Render
3. Navigate to "Environment" tab
4. Update the `VITE_API_URL` variable with your backend URL
5. Save changes - this will trigger a rebuild

### Step 6: Update Google OAuth Settings (Important!)

You need to add your Render URLs to Google OAuth allowed origins:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your OAuth 2.0 Client ID
4. Add your Render frontend URL to:
   - Authorized JavaScript origins: `https://customer-kiosk-frontend.onrender.com`
   - Authorized redirect URIs: `https://customer-kiosk-frontend.onrender.com`

## Service URLs

After deployment, you'll have two services:

- **Backend API**: `https://customer-kiosk-backend.onrender.com`
- **Frontend**: `https://customer-kiosk-frontend.onrender.com`

## Alternative: Manual Deployment (If Blueprint Doesn't Work)

If the blueprint approach doesn't work, you can deploy each service manually:

### Deploy Backend Manually

1. Go to Render Dashboard
2. Click "New +" > "Web Service"
3. Connect your repository
4. Configure:
   - **Name**: `customer-kiosk-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `customerkiosk/backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add environment variables (listed above)
6. Click "Create Web Service"

### Deploy Frontend Manually

1. Go to Render Dashboard
2. Click "New +" > "Static Site"
3. Connect your repository
4. Configure:
   - **Name**: `customer-kiosk-frontend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `customerkiosk/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Add environment variables:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_API_URL` (use your backend URL)
6. Click "Create Static Site"

## Troubleshooting

### Backend Issues

- Check logs in Render dashboard
- Verify database connection details are correct
- Make sure all environment variables are set

### Frontend Issues

- Ensure `VITE_API_URL` points to your backend URL (with https://)
- Check that Google OAuth credentials include your Render URLs
- Clear browser cache and try again

### Free Tier Limitations

- Services spin down after 15 minutes of inactivity
- First request after inactivity may take 30-60 seconds (cold start)
- Consider using a service like [UptimeRobot](https://uptimerobot.com/) to ping your backend periodically

## Environment Variables Reference

### Backend (.env)
```
DB_HOST=csce-315-db.engr.tamu.edu
DB_PORT=5432
DB_NAME=gang_44_db
DB_USER=gang_44
DB_PASSWORD=LKCoyz78
GOOGLE_CLIENT_ID=292199993155-eoddl3h07brh9h4bqml0c6khtd8h240f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
JWT_SECRET=your_random_secret_string_here
PORT=10000
```

### Frontend (.env)
```
VITE_GOOGLE_CLIENT_ID=292199993155-eoddl3h07brh9h4bqml0c6khtd8h240f.apps.googleusercontent.com
VITE_API_URL=https://customer-kiosk-backend.onrender.com
```

## Post-Deployment Checklist

- [ ] Backend service is live and accessible
- [ ] Frontend service is live and accessible
- [ ] API calls from frontend to backend work
- [ ] Google OAuth login works
- [ ] Database connections work
- [ ] Can place orders successfully
- [ ] Google OAuth allowed origins updated

## Need Help?

If you encounter issues:
1. Check Render service logs
2. Verify all environment variables are set correctly
3. Ensure database is accessible from Render's IP addresses
4. Check Google OAuth configuration
