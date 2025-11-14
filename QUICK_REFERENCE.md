# Backend-Frontend Architecture Summary

## Quick Start

### Local Development (3 terminals)

**Terminal 1 - Backend:**
```bash
cd server
pip install -r requirements.txt
set OPENROUTER_API_KEYS=your-keys-here  # Windows
# or
export OPENROUTER_API_KEYS=your-keys-here  # Mac/Linux
python app.py
# Backend at: http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd bzik-clever-buddy-site-main
npm install
npm run dev
# Frontend at: http://localhost:5173
```

**Terminal 3 - Test:**
```bash
# Test backend health
curl http://localhost:5000/api/health

# Test chat
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Hello\",\"user_id\":\"test\",\"voice\":\"Anna\"}"
```

## File Structure

```
project-root/
├── server/                      # Python/Flask backend (deploy to Render)
│   ├── app.py                  # Main Flask application with CORS
│   ├── requirements.txt        # Python dependencies (gunicorn, flask, etc)
│   ├── Procfile               # Render deployment config
│   ├── fallback_responses.py  # Fallback responses when API keys unavailable
│   ├── .env.example           # Environment variables template
│   ├── .gitignore             # Git ignore for secrets
│   └── README.md              # Backend documentation
│
├── bzik-clever-buddy-site-main/    # React frontend (deploy to Netlify)
│   ├── src/
│   │   ├── components/
│   │   │   └── InteractiveDemo.tsx  # Main chat component (with endpoint detection + retry logic)
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── dist/                  # Build output (deployed to Netlify)
│
├── DEPLOYMENT_GUIDE.md         # Complete deployment instructions
├── DEPLOYMENT_CHECKLIST.md     # Step-by-step checklist
└── netlify.toml               # Netlify configuration

```

## API Endpoints (Backend)

All responses include CORS headers for cross-origin requests.

### POST `/api/chat` - Main chat endpoint
**Request:**
```json
{
  "message": "Hello!",
  "user_id": "user123",
  "voice": "Anna",
  "timestamp": 1234567890,
  "is_mobile": false,
  "is_voice_input": false
}
```

**Response:**
```json
{
  "reply": "Hi there! How can I help you?",
  "success": true,
  "user_id": "user123",
  "selected_voice": "Anna",
  "backend_voice": "Microsoft Zira",
  "voice_session": {
    "active": true,
    "should_listen": true,
    "time_remaining": 120
  }
}
```

### GET `/api/health` - Health check
**Response:**
```json
{
  "ok": true,
  "keys": 2,
  "openai_available": true
}
```

### POST `/api/voice/status` - Get voice session status
**Response:**
```json
{
  "active": true,
  "should_listen": true,
  "time_remaining": 45,
  "listening_until": 1234567945
}
```

### POST `/api/voice/end` - End voice session
**Response:**
```json
{
  "success": true,
  "message": "Voice session ended"
}
```

## Frontend Features

### Automatic Endpoint Detection
The frontend automatically detects the environment:

```
Local Environment (localhost/127.0.0.1):
  → Try http://localhost:5000/api/chat
  → If unavailable, try Netlify functions
  
Production Environment:
  → Try Render backend (https://api-url.onrender.com)
  → Fall back to Netlify functions if needed
```

### Retry Logic
When requests fail:
1. Try immediately
2. Wait 1 second, retry
3. Wait 2 seconds, retry
4. Wait 4 seconds, retry
5. If all fail, show "Server offline" message

### Error Handling
- Network errors → "Server offline. Check internet..."
- Timeout errors → "Request timed out. Try again..."
- HTTP errors → "Server unavailable. Try again..."
- Success → Display response immediately

## Deployment Targets

| Component | Platform | URL Pattern | Notes |
|-----------|----------|------------|-------|
| Backend | Render | `https://app-name.onrender.com` | Free tier sleeps after 15 min inactivity |
| Frontend | Netlify | `https://site-name.netlify.app` | Builds automatically from Git |

## Environment Variables

### Backend (Render)
```
OPENROUTER_API_KEYS=sk-or-key1,sk-or-key2
FLASK_ENV=production
DEBUG=false
PORT=10000  # Assigned by Render
```

### Frontend (Netlify)
```
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_ENV=production
```

## Key Technologies

### Backend
- **Flask** - Python web framework
- **flask-cors** - Cross-Origin Resource Sharing support
- **Gunicorn** - Production WSGI server
- **OpenAI** - LLM integration
- **OpenRouter** - Multiple LLM provider

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Web Speech API** - Voice input/output
- **Web Audio API** - Microphone visualization

## Deployment Steps (TL;DR)

1. **Backend:**
   - Push `/server` folder to GitHub
   - Create Render Web Service
   - Add `OPENROUTER_API_KEYS` environment variable
   - Deploy (Render auto-builds)
   - Copy backend URL

2. **Frontend:**
   - Set `VITE_BACKEND_URL` to Render URL
   - Deploy to Netlify (auto-builds from Git)
   - Test chat functionality

3. **Done!**
   - Both services are online
   - Frontend auto-detects backend
   - Retry logic handles temporary outages

## Monitoring

### Render Dashboard
- View logs: `dashboard.render.com`
- Check metrics (CPU, memory, response time)
- Monitor deployment events

### Netlify Dashboard
- View build logs: `app.netlify.com`
- Check deployment history
- View analytics

### Browser Console
- Look for `[SendMessage]` logs to see retry attempts
- Look for `[Endpoint Detection]` logs to see which backend is used
- Look for `[TTS]` logs for voice synthesis issues

## Common Commands

```bash
# Start backend locally
cd server && python app.py

# Start frontend locally
cd bzik-clever-buddy-site-main && npm run dev

# Test backend
curl http://localhost:5000/api/health

# Build frontend for deployment
npm run build

# Check if Render backend is reachable
curl https://app-name.onrender.com/api/health

# View backend logs on Render
# Use Render dashboard or CLI if configured

# View frontend logs on Netlify
# Use Netlify dashboard or CLI if configured
```

## Troubleshooting Quick Links

| Issue | Likely Cause | Solution |
|-------|-------------|----------|
| "Connection error" message | Backend not reachable | Check Render deployment, wait for cold start |
| First message takes 30+ sec | Free tier cold start | Normal, give it time to wake up |
| CORS error in console | Missing CORS headers | Verified CORS is enabled in app.py |
| No API key warning | Missing env var | Add OPENROUTER_API_KEYS to Render |
| Microphone won't start | Permission not granted | Browser permission dialog will appear |
| Chatbot not responding | Backend API keys invalid | Check OpenRouter API key validity |

## Security Notes

✅ **What's Safe:**
- CORS enabled for all origins (API doesn't expose sensitive data)
- API keys stored as environment variables (not in code)
- Rate limiting handled by OpenRouter API

⚠️ **Be Careful:**
- Never commit `.env` files with API keys
- Keep `/server/.gitignore` updated
- Regenerate API keys if accidentally exposed
- Monitor Render and Netlify dashboards for unusual activity

## Getting Help

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Check `DEPLOYMENT_CHECKLIST.md` for step-by-step checklist
3. Check browser console for error logs
4. Check Render/Netlify dashboards for service logs
5. Review error messages shown to users

---

**Ready to deploy?** Start with `DEPLOYMENT_CHECKLIST.md`
