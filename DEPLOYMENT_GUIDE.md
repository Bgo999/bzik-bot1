# Bzik AI Backend + Frontend Deployment Guide

This guide walks you through deploying the Bzik AI chatbot with a Flask backend on Render and React frontend on Netlify.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Netlify Frontend                         │
│              (React/TypeScript/Vite App)                    │
│                bzik-clever-buddy-site-main                  │
│   Accessible at: https://bzik-ai.netlify.app               │
└──────────────────────┬──────────────────────────────────────┘
                       │ fetch("https://api.bzik-ai.onrender.com/api/chat")
                       │ Retry on failure (3 attempts with exponential backoff)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Render Backend (Python/Flask)               │
│                      /server/app.py                         │
│   Accessible at: https://api.bzik-ai.onrender.com          │
│                                                              │
│  Endpoints:                                                 │
│  - POST /api/chat         (Main chat endpoint)             │
│  - GET  /api/health       (Health check)                   │
│  - POST /api/voice/status (Voice session status)           │
│  - POST /api/voice/end    (End voice session)              │
└─────────────────────────────────────────────────────────────┘
```

## Part 1: Backend Deployment to Render.com

### Step 1: Prepare the Server Folder

The `/server` folder is ready with:
- `app.py` - Flask backend application
- `requirements.txt` - Python dependencies
- `Procfile` - Render deployment configuration
- `fallback_responses.py` - Fallback responses when API keys unavailable
- `.env.example` - Example environment variables
- `README.md` - Backend-specific documentation

### Step 2: Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up for a free account
3. Connect your GitHub repository (or use manual deployment)

### Step 3: Create a Web Service on Render

1. In Render dashboard, click **New** → **Web Service**
2. Choose **Deploy an existing repository** or upload manually
3. Configure the following:

#### Basic Settings:
- **Name:** `bzik-ai-backend` (or your preferred name)
- **Environment:** Python 3
- **Region:** Choose closest to your users (e.g., `us-east-1`)
- **Branch:** `main` (or your default branch)

#### Build & Deploy:
- **Build Command:** `pip install -r server/requirements.txt`
- **Start Command:** `cd server && gunicorn app:app`
- **Root Directory:** (leave empty or set to `.`)

**Note:** If the `/server` folder is in a subdirectory, adjust paths accordingly.

#### Environment Variables:
1. Click **Environment** tab
2. Add the following variables:

```
OPENROUTER_API_KEYS=sk-or-your-first-key,sk-or-your-second-key
FLASK_ENV=production
DEBUG=false
PORT=10000
```

Get your OpenRouter API keys from [openrouter.ai](https://openrouter.ai)

### Step 4: Deploy

1. Click **Deploy** 
2. Render will:
   - Install dependencies from `requirements.txt`
   - Build the Flask app
   - Start the service with gunicorn
   - Assign a public URL: `https://bzik-ai-backend.onrender.com`

3. Monitor logs in the Render dashboard to ensure deployment succeeds

**Note:** Free tier services sleep after 15 minutes of inactivity. Your backend might be cold-started on the first request (takes ~30 seconds). This is normal.

### Step 5: Test the Backend

Once deployed, test the health endpoint:

```bash
curl https://bzik-ai-backend.onrender.com/api/health
```

Expected response:
```json
{
  "ok": true,
  "keys": 2,
  "openai_available": true
}
```

## Part 2: Frontend Update & Netlify Deployment

### Step 1: Update Frontend Environment Variables

Update your Netlify environment to include the Render backend URL:

In `netlify.toml` or Netlify dashboard:

```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = "dist"

[build.environment]
  VITE_BACKEND_URL = "https://bzik-ai-backend.onrender.com"
  VITE_ENV = "production"
```

Or set it in Netlify dashboard:
- **Site Settings** → **Environment Variables**
- Add `VITE_BACKEND_URL = https://bzik-ai-backend.onrender.com`

### Step 2: Update Frontend Code

The frontend has been updated with:

1. **Automatic Endpoint Detection** - The app detects the environment (local vs production) and uses the appropriate backend
2. **Retry Logic** - If backend is unreachable, it retries 3 times with exponential backoff
3. **Better Error Messages** - Shows "Server offline" instead of generic errors

The InteractiveDemo component now:
- Checks for `window.__RENDER_BACKEND_URL` in production
- Falls back to Netlify functions if needed
- Retries failed requests automatically

### Step 3: Deploy to Netlify

1. Commit your changes to GitHub
2. In Netlify dashboard:
   - Click **New site from Git**
   - Connect your repo
   - Set build command: `npm run build`
   - Set publish directory: `dist` (or `bzik-clever-buddy-site-main/dist`)

3. Deploy

Your frontend will be available at: `https://bzik-ai.netlify.app`

## Part 3: Configure Local Development

### Running Locally

1. **Start Backend:**
   ```bash
   cd server
   pip install -r requirements.txt
   export OPENROUTER_API_KEYS="your-api-keys-here"
   python app.py
   ```
   Backend runs at `http://localhost:5000`

2. **Start Frontend:**
   ```bash
   cd bzik-clever-buddy-site-main
   npm install
   npm run dev
   ```
   Frontend runs at `http://localhost:5173` (or configured port)

3. **The frontend automatically detects the local Flask backend** and uses it instead of production

### Testing the Connection

In browser console, while running locally:
```javascript
fetch('http://localhost:5000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello!', user_id: 'test', voice: 'Anna' })
})
.then(r => r.json())
.then(d => console.log(d))
```

## Part 4: Troubleshooting

### Backend Issues

**Backend shows "Failed to deploy" on Render**
- Check that `Procfile` has correct command: `web: gunicorn app:app`
- Verify `requirements.txt` has all dependencies including `gunicorn`
- Check Render logs for specific errors

**"No OpenRouter API keys provided" warning**
- Add `OPENROUTER_API_KEYS` environment variable in Render dashboard
- Multiple keys: separate with commas: `key1,key2,key3`

**Backend times out on first request**
- Free Render tier services sleep after 15 minutes
- First request will be slow (30+ seconds) as service cold-starts
- This is normal behavior

**CORS errors in browser console**
- Backend has CORS enabled for all origins
- Ensure request headers include `Content-Type: application/json`
- Check that the endpoint URL is correct

### Frontend Issues

**"Connection error. Please try again." message appears**
- Check browser console for detailed error
- Verify Render backend is deployed and running
- Check that `VITE_BACKEND_URL` environment variable is set correctly
- Try refreshing the page (backend might be waking up)

**Chatbot responds but microphone doesn't start**
- Browser might not have granted microphone permission
- Check browser's permission settings
- Reload page and grant microphone permission when prompted

**Frontend stuck loading**
- Check that frontend's endpoint detection completed
- Open browser DevTools → Console and look for `[Endpoint Detection]` logs
- If using production URL, ensure CORS is working

## Part 5: Monitoring

### Render Monitoring

1. Go to Render dashboard for your service
2. View:
   - **Metrics:** CPU, memory, response times
   - **Logs:** Real-time logs of backend activity
   - **Events:** Deployment history

### Frontend Monitoring

Netlify automatically logs:
- Build logs
- Deployment history
- Analytics

## Part 6: Advanced Configuration

### Custom Domain

1. **Render Backend:**
   - Render dashboard → Settings → Custom Domain
   - Add your domain (e.g., `api.bzik-ai.com`)
   - Update DNS records as instructed

2. **Netlify Frontend:**
   - Netlify dashboard → Domain Settings
   - Add custom domain (e.g., `bzik-ai.com`)
   - Update DNS records as instructed

### Environment-Specific Configs

**Development:**
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

**Staging:**
- Backend: `https://bzik-ai-staging.onrender.com`
- Frontend: `https://bzik-ai-staging.netlify.app`

**Production:**
- Backend: `https://bzik-ai-backend.onrender.com`
- Frontend: `https://bzik-ai.netlify.app`

### Auto-Deployment

**GitHub → Render:**
1. Connect GitHub repo in Render
2. Render automatically redeploys on push to main branch

**GitHub → Netlify:**
1. Connect GitHub repo in Netlify
2. Netlify automatically rebuilds and deploys on push to main branch

## Part 7: Security Notes

### API Keys

- **Never commit API keys** to git (use `.gitignore`)
- Use environment variables for sensitive data
- Keep `/server/.gitignore` to prevent committing `openrouter_keys_local.py`

### CORS

- Backend allows requests from any origin (`Access-Control-Allow-Origin: *`)
- This is safe because the API requires rate limiting and key management
- For production, consider restricting to known frontend domains

### Rate Limiting

- OpenRouter API handles rate limiting
- Backend automatically rotates through multiple keys
- Failed keys are temporarily deprioritized

## Summary

✅ **Backend Setup:**
- Flask app configured with CORS
- Deployed to Render with gunicorn
- Accessible at `https://bzik-ai-backend.onrender.com`

✅ **Frontend Setup:**
- Updated with automatic endpoint detection
- Retry logic for failed requests
- Better error handling and messages

✅ **Local Development:**
- Backend runs on `localhost:5000`
- Frontend auto-detects and uses local backend

✅ **Production:**
- Frontend deployed on Netlify
- Backend deployed on Render
- Both accessible from any device/network

## Next Steps

1. Deploy backend to Render
2. Note the Render backend URL
3. Update frontend environment variable
4. Deploy frontend to Netlify
5. Test the complete flow
6. Monitor logs for any issues

For support: Check logs in Render and Netlify dashboards for detailed error messages.
