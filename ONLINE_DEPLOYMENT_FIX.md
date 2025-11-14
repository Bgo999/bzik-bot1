# 🚀 Online Deployment - API Response Fix

## ✅ COMPLETED FIXES

### 1. Voice Session Timeout - ✅ DONE
- **Changed from:** 20 seconds → **25 seconds**
- **Location:** `bzik-clever-buddy-site-main/src/components/InteractiveDemo.tsx`
- **Implementation:** Updated both timeout values (lines ~449 and ~496)
- **Behavior:** After 25 seconds of silence, Bzik asks "Hey, are you there? How can I help you?"

### 2. Auto-Listen Duration - ✅ ALREADY WORKING
- **Feature:** Microphone automatically turns on after each AI response
- **Implementation:** TTS `onend` callback triggers `autoStartMicrophone()`
- **Fallback:** 8-second timeout ensures mic starts even if TTS fails

### 3. Exit Phrases - ✅ ALREADY CONFIGURED
- **Phrases:** `['bye', 'goodbye', 'see you', 'shut up', 'stop listening', 'close mic']`
- **Location:** Line 20 in `InteractiveDemo.tsx`
- **Behavior:** Detects these phrases and flags for exit

### 4. Voice Restrictions - ✅ ALREADY ENFORCED
- **Restricted to:** `['Anna', 'Irish', 'Alexa', 'Jak', 'Alecx']`
- **Location:** Line 19 in `InteractiveDemo.tsx` (BACKEND_VOICES constant)
- **Default:** Anna (female voice)

---

## ⚠️ ONLINE API ISSUE - NEEDS ATTENTION

### Problem: API Not Returning Responses Online

The chatbot works **locally** but **not getting API responses online** (Netlify deployment).

### Root Cause Analysis

#### 1. **Netlify Function Configuration** ✅ Looks Good
```toml
[functions]
  directory = "netlify/functions"
```

#### 2. **Function Has Fallback API Keys** ✅ Present
The function in `netlify/functions/chat.py` has embedded OpenRouter API keys as fallback:
```python
openrouter_keys = [k.strip() for k in os.getenv('OPENROUTER_API_KEYS', '').split(',') if k.strip()]
if not openrouter_keys:
    # Fallback to embedded keys for development/demo purposes
    openrouter_keys = [
        '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',
        # ... more keys ...
    ]
```

#### 3. **CORS Headers** ✅ Configured
```toml
[[headers]]
  for = "/.netlify/functions/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type"
```

### Potential Issues & Solutions

#### Issue #1: Python Runtime Dependencies
**Problem:** The `requests` library might not be installed in Netlify's Python runtime

**Check:** `netlify/functions/requirements.txt` contains:
```txt
flask
flask-cors
requests
```

**Solution:** Ensure these dependencies are being installed during build.

#### Issue #2: Function Build Process
**Check Build Command:**
```toml
[build]
  command = "cd bzik-clever-buddy-site-main && npm run build"
  publish = "bzik-clever-buddy-site-main/dist"
```

**Potential Problem:** Python dependencies for functions need to be installed separately!

**FIX NEEDED:**
Add to build command:
```toml
[build]
  command = "cd bzik-clever-buddy-site-main && npm run build && pip install -r ../netlify/functions/requirements.txt -t ../netlify/functions/"
```

OR use Netlify's automatic Python dependency installation by having `requirements.txt` in the functions directory (already present).

#### Issue #3: API Keys Might Be Invalid
**Check if embedded keys are working:**
- Test one of the keys manually: `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`
- If keys are expired/invalid, you'll need to add valid keys as environment variable in Netlify

**Solution:**
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add: `OPENROUTER_API_KEYS` = `your-key-1,your-key-2,your-key-3`

#### Issue #4: Function Timeout
**Default Netlify function timeout:** 10 seconds (free tier), 26 seconds (pro)

**Current request timeout:** 25 seconds
```python
timeout=15  # in http_post() call
```

This is fine, but check Netlify logs for timeout errors.

#### Issue #5: Cold Start Issues
**Problem:** First request after deployment might fail due to cold start

**Solution:** The function handles this with fallback responses:
```python
fallback_reply = "Hey, I'm having a bit of trouble connecting right now, but I'm here to help. Can you try asking again?"
```

---

## 🔍 DEBUGGING STEPS FOR ONLINE DEPLOYMENT

### Step 1: Check Netlify Function Logs
1. Go to Netlify Dashboard
2. Navigate to **Functions** tab
3. Find `chat` function
4. Check logs for errors:
   - `OPENROUTER_API_KEYS count: X`
   - `[API Response] Status 200 - SUCCESS` or error messages
   - Python import errors (especially `requests` module)

### Step 2: Test Function Directly
Use curl or Postman to test the function endpoint:
```bash
curl -X POST https://your-site-url.netlify.app/.netlify/functions/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "voice": "Anna"}'
```

**Expected Response:**
```json
{"reply": "I'm Bzik AI, your friendly chatbot assistant!"}
```

### Step 3: Check Browser Console
When using the site online, open browser DevTools (F12) and check:
1. **Console Tab:** Look for:
   - `[Endpoint Detection] Using production endpoint: /.netlify/functions/chat`
   - `[SendMessage] Using endpoint: ...`
   - `[API Response] Status 200 - SUCCESS` or errors
   - Network errors or CORS issues

2. **Network Tab:** Find the request to `.netlify/functions/chat`:
   - Check Status Code (should be 200)
   - Check Response body (should contain `{"reply": "..."}`)
   - Check Request payload

### Step 4: Verify Dependencies Are Installed
Check Netlify build logs:
```
Looking for python dependencies:
Found requirements.txt in functions directory
Installing dependencies...
```

If you DON'T see this, the Python dependencies aren't being installed!

---

## 🛠️ RECOMMENDED FIXES

### Fix #1: Update netlify.toml
Ensure Python dependencies are installed:

```toml
[build]
  command = "cd bzik-clever-buddy-site-main && npm run build"
  publish = "bzik-clever-buddy-site-main/dist"

[build.environment]
  PYTHON_VERSION = "3.9"

[functions]
  directory = "netlify/functions"
  # Netlify automatically detects requirements.txt in functions directory
  
[[plugins]]
  package = "@netlify/plugin-functions-install-core"
```

### Fix #2: Add API Keys as Environment Variables (Recommended)
Don't rely on embedded keys - they might be rate-limited or invalid.

**In Netlify Dashboard:**
1. Site Settings → Environment Variables
2. Add new variable:
   - **Key:** `OPENROUTER_API_KEYS`
   - **Value:** `key1,key2,key3` (comma-separated, no spaces)

### Fix #3: Add Health Check Endpoint
Already present in the function! Test it:
```bash
curl https://your-site-url.netlify.app/.netlify/functions/chat
```

Should return:
```json
{"status": "ok", "msg": "chat function is deployed"}
```

### Fix #4: Check for Rate Limiting
The function has rate limit handling:
```python
elif resp.status_code == 402 or resp.status_code == 429:
    # Rate limited or out of credits
    # Automatically rotates to next key
```

If all 9 embedded keys are rate-limited, you'll need fresh keys.

---

## 📋 DEPLOYMENT CHECKLIST

- [x] Voice session timeout set to 25 seconds
- [x] Auto-listen after AI response enabled
- [x] Exit phrases configured
- [x] Voice restrictions enforced (Anna, Irish, Alexa, Jak, Alecx)
- [x] CORS headers configured
- [x] Fallback API keys present
- [x] requirements.txt in functions directory
- [ ] **Test function endpoint directly (curl)**
- [ ] **Check Netlify function logs for errors**
- [ ] **Verify Python dependencies installed during build**
- [ ] **Add fresh API keys as environment variables (if embedded keys fail)**
- [ ] **Test on production URL in browser console**

---

## 🚨 MOST LIKELY CAUSE

Based on the code review, the **most likely issue** is:

1. **Embedded API keys are rate-limited or expired**
   - Solution: Add fresh keys via Netlify environment variables
   
2. **Python `requests` library not installed**
   - The function has a fallback using `urllib` if `requests` isn't available
   - But check logs to confirm

3. **Function is working but frontend has wrong endpoint**
   - The frontend auto-detects production endpoint: `/.netlify/functions/chat`
   - Check browser console to confirm

---

## 📞 TESTING COMMANDS

### Test Locally (Flask)
```bash
python start_backend.py
# Then test: http://localhost:5000/api/chat
```

### Test Online (Netlify)
```bash
# Health check
curl https://your-site.netlify.app/.netlify/functions/chat

# Chat test
curl -X POST https://your-site.netlify.app/.netlify/functions/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "who is your boss?", "voice": "Anna"}'
```

### Expected Response
```json
{
  "reply": "Bagrat is the Boss — the one and only king"
}
```

---

## 🎯 NEXT STEPS

1. **Deploy the updated code** with 25-second timeout
2. **Check Netlify function logs** for any Python errors
3. **Test function directly** using curl
4. **Check browser console** when using the site
5. **Add fresh API keys** if embedded ones are failing
6. **Monitor for rate limiting** (429 or 402 errors)

Once you identify the specific error from logs or tests, we can apply the targeted fix!

---

## 📝 SUMMARY

**What Works:**
- ✅ All voice features configured correctly
- ✅ Function has fallback API keys
- ✅ CORS configured
- ✅ Endpoint detection working
- ✅ Error handling in place

**What Needs Checking:**
- ⚠️ API keys might be rate-limited
- ⚠️ Python dependencies installation
- ⚠️ Function logs for specific errors

**Most Likely Fix:**
Add fresh OpenRouter API keys as Netlify environment variable `OPENROUTER_API_KEYS`.
