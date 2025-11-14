# Bzik AI Deployment Checklist

Use this checklist to ensure all components are properly configured for deployment.

## ✅ Backend Setup (Server Folder)

- [x] Created `/server` folder structure
- [x] `app.py` copied with CORS enabled
  - Imports `from flask_cors import CORS`
  - Calls `CORS(app)` to enable cross-origin requests
- [x] `requirements.txt` includes all dependencies
  - `flask==2.3.3`
  - `flask-cors==4.0.0`
  - `openai==1.3.0`
  - `gunicorn==21.2.0`
- [x] `Procfile` created: `web: gunicorn app:app`
- [x] `fallback_responses.py` copied to `/server`
- [x] `.env.example` created with environment variables template
- [x] `.gitignore` configured to exclude sensitive files
- [x] `README.md` with backend-specific instructions

### Local Testing
- [ ] Navigate to `/server` folder
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux)
- [ ] Install: `pip install -r requirements.txt`
- [ ] Set API keys: `set OPENROUTER_API_KEYS=your-key` (Windows) or `export OPENROUTER_API_KEYS=your-key` (Mac/Linux)
- [ ] Run: `python app.py`
- [ ] Test: `curl http://localhost:5000/api/health`
- [ ] Result: Should return `{"ok": true, "keys": X, "openai_available": true}`

## ✅ Frontend Updates

- [x] Updated endpoint detection in `InteractiveDemo.tsx`
  - Detects local vs production environment
  - Tries Render backend first in production
  - Falls back to Netlify functions if needed
- [x] Added retry logic for failed requests
  - 3 retry attempts with exponential backoff
  - Handles network errors gracefully
  - Better error messages for users
- [x] Improved error handling
  - "Server offline" message for connection issues
  - Shows timeout messages separately
  - Network error detection and retry

## ✅ Render Deployment

### Pre-Deployment
- [ ] GitHub repository created/updated with `/server` folder
- [ ] Committed all changes: `git add .` → `git commit -m "Initial backend setup"` → `git push`
- [ ] Verified files in GitHub:
  - `server/app.py`
  - `server/requirements.txt`
  - `server/Procfile`
  - `server/fallback_responses.py`

### Render Dashboard Setup
- [ ] Created Render.com account
- [ ] Connected GitHub repository to Render
- [ ] Created new Web Service with:
  - **Name:** `bzik-ai-backend`
  - **Environment:** Python 3
  - **Build Command:** `pip install -r server/requirements.txt` (if in subdirectory)
  - **Start Command:** `cd server && gunicorn app:app` (if in subdirectory)
  - **or** `gunicorn app:app` (if running from server root)

### Environment Variables in Render
- [ ] Added `OPENROUTER_API_KEYS` (get from openrouter.ai)
  - Format: `sk-or-key1,sk-or-key2,sk-or-key3`
  - Add multiple keys for redundancy
- [ ] Added `FLASK_ENV=production`
- [ ] Added `DEBUG=false`

### Deployment
- [ ] Clicked **Deploy Web Service**
- [ ] Waited for deployment to complete (2-5 minutes)
- [ ] Verified deployment succeeded in Render logs
- [ ] Copied Render backend URL: `https://your-app-name.onrender.com`

### Post-Deployment Testing
- [ ] Tested health endpoint:
  ```bash
  curl https://your-app-name.onrender.com/api/health
  ```
- [ ] Should return: `{"ok": true, "keys": X, "openai_available": true}`
- [ ] Tested chat endpoint with curl:
  ```bash
  curl -X POST https://your-app-name.onrender.com/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"Hello!","user_id":"test","voice":"Anna"}'
  ```

## ✅ Netlify Deployment

### Pre-Deployment
- [ ] Frontend code committed to GitHub
- [ ] All files in main branch ready for deployment

### Netlify Setup
- [ ] Created Netlify account
- [ ] Connected GitHub repository
- [ ] Created new site from Git
- [ ] **Build Settings:**
  - Build Command: `npm run build` (or `cd bzik-clever-buddy-site-main && npm run build`)
  - Publish Directory: `dist` (or `bzik-clever-buddy-site-main/dist`)

### Environment Variables (if needed)
- [ ] Added `VITE_BACKEND_URL` with Render URL
  - Value: `https://your-app-name.onrender.com`
- [ ] Added `VITE_ENV=production`

### Deployment
- [ ] Triggered deployment (automatic or manual)
- [ ] Waited for build to complete (2-3 minutes)
- [ ] Verified deployment succeeded

### Post-Deployment Testing
- [ ] Visited frontend URL: `https://your-site.netlify.app`
- [ ] Opened browser DevTools → Console
- [ ] Look for `[Endpoint Detection]` logs
- [ ] Should show: `Using production endpoint` or Render URL
- [ ] Tested chat functionality
- [ ] Sent test message to verify connection to backend
- [ ] Checked voice response is working

## ✅ Connection Testing

### From Frontend to Backend
- [ ] Open browser console (F12 → Console tab)
- [ ] Send test message in chatbot
- [ ] Check console logs for:
  - `[SendMessage] Using endpoint: https://...`
  - Network request to backend in Network tab
  - Response received and displayed

### Error Scenarios
- [ ] If backend is unreachable:
  - Should show: "Server offline. Please check your internet connection..."
  - Should retry automatically (check Network tab for multiple attempts)
  - After 3 retries, shows user-friendly error message

- [ ] If backend has API key issues:
  - Should show: "Server is temporarily unavailable..."
  - Backend logs show key rotation happening
  - Falls back to fallback responses

## ✅ Final Verification

- [ ] **Local Development:**
  - [ ] `npm start` in frontend folder works
  - [ ] `python app.py` in server folder works
  - [ ] Frontend auto-detects and uses localhost:5000
  - [ ] Chat works end-to-end locally

- [ ] **Production:**
  - [ ] Frontend deployed on Netlify
  - [ ] Backend deployed on Render
  - [ ] Frontend URL loads without errors
  - [ ] Chat works end-to-end in production
  - [ ] Messages are sent to Render backend
  - [ ] Responses are received and displayed
  - [ ] Voice responses work
  - [ ] Microphone activates automatically

- [ ] **Monitoring:**
  - [ ] Can access Render dashboard to view logs
  - [ ] Can access Netlify dashboard to view logs
  - [ ] Errors are being logged for troubleshooting

## 🚀 You're Ready!

Once all checkboxes are complete:
1. Your Flask backend is running on Render
2. Your React frontend is running on Netlify
3. The chatbot works online with persistent connection
4. Users won't see "Connection error" messages
5. Retry logic handles temporary backend issues
6. Both services auto-scale and handle traffic

## 📝 Important URLs

**Replace these with your actual URLs:**

| Component | URL |
|-----------|-----|
| Frontend | `https://your-site.netlify.app` |
| Backend | `https://your-app-name.onrender.com` |
| Backend Health | `https://your-app-name.onrender.com/api/health` |
| Backend Chat | `https://your-app-name.onrender.com/api/chat` |

## 🆘 Troubleshooting

**Issue:** Backend shows "Connection refused" in frontend
- **Solution:** Verify Render deployment is complete and backend URL is correct in frontend environment variables

**Issue:** First chat message takes 30+ seconds
- **Solution:** Render free tier sleeps services. First request wakes the service. This is normal.

**Issue:** "No OpenRouter API keys provided" warning in backend logs
- **Solution:** Add `OPENROUTER_API_KEYS` environment variable in Render dashboard

**Issue:** CORS error in browser console
- **Solution:** CORS is enabled. Check that request is POST with `Content-Type: application/json` header.

**Issue:** Backend keeps failing
- **Solution:** Check Render logs for specific errors. Common issues: missing dependencies, invalid Procfile, key rotation failures.

For more detailed troubleshooting, see `DEPLOYMENT_GUIDE.md`.
