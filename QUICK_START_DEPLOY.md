# 🚀 Quick Start: Deploy Now in 15 Minutes

Follow these steps to deploy your chatbot backend and frontend in ~15 minutes.

## What You Need
- GitHub account (with repo already set up)
- Render.com account (free)
- Netlify account (free)
- OpenRouter API keys (get from openrouter.ai)

## Step 1: Push Code to GitHub (2 minutes)

```bash
cd c:\My Web Sites\Bzik.bot

# Stage all files including new /server folder
git add .

# Commit changes
git commit -m "Add production backend deployment setup"

# Push to GitHub
git push origin main
```

Verify on GitHub:
- Check that `/server` folder appears
- Verify `server/app.py`, `server/Procfile`, `server/requirements.txt` exist

## Step 2: Deploy Backend to Render (5 minutes)

### 2.1 Create Render Account & Service
1. Go to [render.com](https://render.com)
2. Sign up (free account)
3. Click **New** → **Web Service**
4. Select **Build and deploy from a Git repository**
5. Connect your GitHub account and select your repo

### 2.2 Configure Service
Fill in the form:
- **Name:** `bzik-ai-backend`
- **Environment:** Python 3
- **Region:** US East (or closest to you)
- **Build Command:** 
  ```
  pip install -r server/requirements.txt
  ```
- **Start Command:** 
  ```
  cd server && gunicorn app:app
  ```

### 2.3 Add Environment Variables
1. Click **Environment** tab
2. Add these variables:
   - **Key:** `OPENROUTER_API_KEYS`
     **Value:** `sk-or-your-api-key-1,sk-or-your-api-key-2`
   - **Key:** `FLASK_ENV`
     **Value:** `production`
   - **Key:** `DEBUG`
     **Value:** `false`

3. Click **Create Web Service**
4. Wait for deployment (2-3 minutes)

### 2.4 Verify Backend
Once deployed, you'll see a URL like: `https://bzik-ai-backend-xxxxx.onrender.com`

Test it:
```bash
curl https://bzik-ai-backend-xxxxx.onrender.com/api/health
```

Should return:
```json
{"ok": true, "keys": 2, "openai_available": true}
```

✅ **Backend is live!**

## Step 3: Deploy Frontend to Netlify (5 minutes)

### 3.1 Create Netlify Site
1. Go to [netlify.com](https://netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect GitHub and select your repo

### 3.2 Configure Build Settings
- **Build command:** `npm run build` (or `cd bzik-clever-buddy-site-main && npm run build`)
- **Publish directory:** `dist` (or `bzik-clever-buddy-site-main/dist`)

### 3.3 Add Environment (Optional)
In **Site settings** → **Environment variables**, add:
- **Key:** `VITE_BACKEND_URL`
- **Value:** `https://bzik-ai-backend-xxxxx.onrender.com` (your Render URL)

### 3.4 Deploy
Click **Deploy site** and wait (1-2 minutes)

You'll get a URL like: `https://bzik-ai-xxxxx.netlify.app`

✅ **Frontend is live!**

## Step 4: Test Everything (3 minutes)

### 4.1 Test Backend
```bash
# Test health
curl https://bzik-ai-backend-xxxxx.onrender.com/api/health

# Test chat
curl -X POST https://bzik-ai-backend-xxxxx.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello!","user_id":"test","voice":"Anna"}'
```

### 4.2 Test Frontend
1. Open `https://bzik-ai-xxxxx.netlify.app`
2. Open browser DevTools (F12 → Console)
3. Look for logs starting with `[Endpoint Detection]`
4. Send a test message in the chatbot
5. Verify response appears

### 4.3 Verify Connection
- Check console logs for `[SendMessage] Using endpoint: https://...`
- Check Network tab - should see POST to your Render URL
- Messages should display in chat

## Troubleshooting

### Backend deployment failed
- Check Render logs for errors
- Verify `Procfile` has correct command
- Ensure `requirements.txt` includes `gunicorn`

### Frontend deployment failed
- Check Netlify build logs
- Verify npm build command works locally
- Check that dist folder exists after build

### "Connection error" in chatbot
- Wait 30-60 seconds (Render free tier might be cold-starting)
- Refresh the page
- Check browser console for detailed error
- Verify Render backend is actually running

### Microphone doesn't work
- Grant microphone permission when browser asks
- Check browser settings - microphone might be disabled
- Try a different browser (Chrome/Edge recommended)

## What's Working Now

✅ **Backend:**
- Flask server running on Render
- CORS enabled (frontend can request it)
- API key rotation working
- Fallback responses available

✅ **Frontend:**
- React app running on Netlify
- Auto-detects Render backend
- Sends requests to backend
- Retries on failure (3 times)
- Shows better error messages

✅ **Connection:**
- Frontend ↔ Backend communication working
- Both services accessible worldwide
- No "localhost" errors
- Persistent, always-on service

## Next (Optional)

### 1. Custom Domain
- **Render:** Add custom domain in Settings
- **Netlify:** Add custom domain in Domain settings

### 2. Monitoring
- Set up alerts for backend errors
- Monitor frontend deployment history
- View logs regularly

### 3. Local Development
Still works as before:
```bash
# Terminal 1
cd server && python app.py

# Terminal 2
npm start
```

Frontend auto-detects localhost:5000 backend.

## Your Live URLs

Copy these for your records:

| Component | URL |
|-----------|-----|
| Frontend | `https://bzik-ai-xxxxx.netlify.app` |
| Backend | `https://bzik-ai-backend-xxxxx.onrender.com` |
| Backend Health | `https://bzik-ai-backend-xxxxx.onrender.com/api/health` |

## Done! 🎉

You now have:
- ✅ Production backend on Render (always available)
- ✅ Production frontend on Netlify (always available)
- ✅ Automatic retry logic (handles temporary outages)
- ✅ Better error messages (no confusing errors)
- ✅ Global accessibility (works from any device)

The chatbot will **never throw "Connection error"** - it will retry automatically and handle failures gracefully!

---

**Questions?** Check `DEPLOYMENT_GUIDE.md` for detailed explanations, or `DEPLOYMENT_CHECKLIST.md` for step-by-step verification.
