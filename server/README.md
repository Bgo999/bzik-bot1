# Bzik AI Backend

Production-ready Flask backend for the Bzik AI chatbot. Designed for deployment on Render.com.

## Setup

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables (optional, uses fallback responses if not set)
export OPENROUTER_API_KEYS="your-api-key-1,your-api-key-2"

# Run locally
python app.py
```

The backend will be available at `http://localhost:5000`

### Production Deployment (Render.com)

1. **Create a new Web Service on Render**
   - Connect your GitHub repository (or upload source)
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`

2. **Configure Environment Variables**
   - Add `OPENROUTER_API_KEYS` with your API keys (comma-separated)
   - Add `PORT=10000` (Render assigns dynamic ports)

3. **Deploy**
   - Render will automatically build and deploy your app
   - Your backend will be available at `https://<your-app-name>.onrender.com`

## API Endpoints

### POST `/api/chat`
Send a message and get a response from the AI.

**Request:**
```json
{
  "message": "Hello!",
  "user_id": "user123",
  "voice": "Anna",
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
  "voice_session": {
    "active": true,
    "should_listen": true,
    "time_remaining": 120
  }
}
```

### GET `/api/health`
Health check endpoint for monitoring.

**Response:**
```json
{
  "ok": true,
  "keys": 2,
  "openai_available": true
}
```

### POST `/api/voice/status`
Get current voice session status.

### POST `/api/voice/end`
End a voice session.

## CORS Support

CORS is enabled for all origins. The backend can be safely called from any frontend domain.

## Files

- `app.py` - Main Flask application
- `requirements.txt` - Python dependencies
- `Procfile` - Render deployment configuration
- `fallback_responses.py` - Fallback responses when API keys unavailable

## Architecture

- **API Key Rotation**: Automatically rotates through multiple OpenRouter API keys
- **Rate Limit Handling**: Gracefully handles rate limits and quota exhaustion
- **Conversation Memory**: Maintains per-user conversation history in `chat_memory.json`
- **Duplicate Prevention**: Prevents duplicate messages within a 15-second window
- **Voice Sessions**: Tracks voice chat sessions with timeout and auto-listen logic

## Troubleshooting

**"No OpenRouter API keys provided"**
- Add `OPENROUTER_API_KEYS` environment variable with comma-separated API keys
- Without keys, the backend will return fallback responses

**CORS errors**
- CORS is enabled for all origins. Ensure your frontend is sending `Content-Type: application/json`

**Connection timeout from frontend**
- Verify the Render backend URL is correct
- Check that Render deployment is active
- Review Render logs for any errors
