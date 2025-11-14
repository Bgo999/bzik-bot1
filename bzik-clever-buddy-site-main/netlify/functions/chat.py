import json
import os
import time
import traceback
# `requests` may not be available in some Netlify build/runtime setups if
# dependencies weren't installed correctly. Import defensively so the
# function can still return a helpful error message instead of crashing.
try:
    import requests
    REQUESTS_AVAILABLE = True
except Exception:
    requests = None
    REQUESTS_AVAILABLE = False
    print("[NetlifyFunction] WARNING: 'requests' package not available. Network calls will be disabled until requirements are installed.")

# Provide a minimal urllib fallback so the function can still make HTTP POST
# requests when the `requests` package isn't available (common in some
# Netlify dev setups). The rest of the code uses `http_post` instead of
# calling `requests.post` directly.
if not REQUESTS_AVAILABLE:
    import urllib.request
    import urllib.error

    class SimpleResponse:
        def __init__(self, status_code, text):
            self.status_code = status_code
            self._text = text

        @property
        def text(self):
            return self._text

        def json(self):
            try:
                return json.loads(self._text)
            except Exception:
                return {}

    def http_post(url, headers, json_payload, timeout=15):
        data = json.dumps(json_payload).encode('utf-8')
        req = urllib.request.Request(url, data=data, method='POST')
        for k, v in (headers or {}).items():
            req.add_header(k, v)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                body = resp.read().decode('utf-8')
                return SimpleResponse(resp.getcode(), body)
        except urllib.error.HTTPError as he:
            try:
                body = he.read().decode('utf-8')
            except Exception:
                body = str(he)
            return SimpleResponse(getattr(he, 'code', 500), body)
        except Exception as e:
            return SimpleResponse(0, str(e))
else:
    # when requests is available, use it via a small adapter function for
    # consistent return shape
    def http_post(url, headers, json_payload, timeout=15):
        resp = requests.post(url, headers=headers, json=json_payload, timeout=timeout)
        class R:
            def __init__(self, resp):
                self._resp = resp

            @property
            def status_code(self):
                return self._resp.status_code

            @property
            def text(self):
                return getattr(self._resp, 'text', '')

            def json(self):
                try:
                    return self._resp.json()
                except Exception:
                    return {}

        return R(resp)

# API configuration
openrouter_keys = [k.strip() for k in os.getenv('OPENROUTER_API_KEYS', '').split(',') if k.strip()]
if not openrouter_keys:
    # Fallback to embedded keys for development/demo purposes
    print("[INFO] No OPENROUTER_API_KEYS environment variable set. Using embedded keys for demo.")
    openrouter_keys = [
        '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',
        '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',
        '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',
        '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',
        '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',
        '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',
        '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',
        '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',
        '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'
    ]

# Log key status at cold start for debugging (Netlify function logs)
try:
    available = len(openrouter_keys)
    print(f"[NetlifyFunction] OPENROUTER_API_KEYS count: {available}")
    if available:
        print(f"[NetlifyFunction] First key snippet: {openrouter_keys[0][:8]}... (masked)")
    else:
        print("[NetlifyFunction] No OPENROUTER_API_KEYS found; using fallback embedded keys")
except Exception:
    print("[NetlifyFunction] Failed to print OPENROUTER_API_KEYS status")

def get_client(index):
    # For Netlify functions we avoid relying on the OpenAI SDK since
    # packaging can fail. Instead we return the API key and use a
    # small requests-based call when needed.
    return openrouter_keys[index]

def rotate_keys_to_front(succeeded_index):
    """Move the succeeded key to the front of the list"""
    key = openrouter_keys.pop(succeeded_index)
    openrouter_keys.insert(0, key)

# Per-key failure tracking with improved rotation logic
KEY_COOLDOWN_SECONDS = 60
failed_keys = {}
key_usage_count = {}  # Track usage to distribute load

# Personality prompts by voice
PERSONALITIES = {
    "friendly": """
You are BZik, an AI assistant created by your boss Kevin.
You speak clearly and naturally like a human, never robotic.
Ignore emojis, symbols, or special characters — do not describe or mention them.

Your replies should be short and direct:
- Normally, answer in 1 or 2 sentences only.
- If the question is about Kevin, your boss, or important instructions from him, you may answer longer if needed.
- If the user asks for more detail, expand naturally but stay concise.

Tone:
- Friendly, calm, and supportive.
- Show care and light humor when it fits.
- Never overtalk or repeat yourself.
- Never include or interpret emojis or symbols in your output.

Goal:
Be a helpful, kind assistant who answers with meaning and precision, respecting brevity and clarity.
""",
    "professional": """
You are Bzik AI, a professional and efficient chatbot created by Boss Kevin. You are helpful, clear, and business-focused. Maintain a professional tone in all responses, providing accurate and concise information. Be respectful and demonstrate expertise in business matters while keeping responses focused and actionable.
""",
    "playful": """
You are Bzik AI, an energetic, fun, and creative chatbot created by Boss Kevin. You're helpful while being playful and engaging, often using emojis and light-hearted language. Make conversations enjoyable with humor and enthusiasm, but always provide useful information. Keep responses moderate length and entertaining.
"""
}

# Custom knowledge base
CUSTOM_RESPONSES = {
    "how to make tea?": "To make tea, start with fresh water, boil it to about 100°C. Add your favorite tea bag or leaves, let it steep for 3-5 minutes. Add sugar or milk if you like, and enjoy!",
    "what is your name?": "I'm Bzik AI, your friendly chatbot assistant!",
  
}

def get_chat_response(message, voice='friendly', conversation=[]):
    # Validate voice
    if voice not in PERSONALITIES:
        voice = 'friendly'

    # Get the personality for the selected voice
    personality = PERSONALITIES[voice]

    # Add user message
    conversation = conversation + [{"role": "user", "content": message}]

    # Create messages with personality and full conversation context (limit to last 10)
    messages = [{"role": "system", "content": personality}] + conversation[-10:]

    reply = None
    for attempt in range(len(openrouter_keys)):
        # skip keys that failed recently
        failed_until = failed_keys.get(attempt, 0)
        if failed_until > time.time():
            print(f"[Key Rotation] Skipping key {attempt} until {failed_until}")
            continue

        try:
            # Check for custom responses first
            user_msg_lower = ''.join(c for c in message.lower() if c.isalnum() or c.isspace())
            if user_msg_lower in CUSTOM_RESPONSES:
                reply = CUSTOM_RESPONSES[user_msg_lower]
                print(f"[Custom Response] Using custom response for message: {message}")
                break

            # Try API with current key using a direct HTTP request to OpenRouter
            print(f"[Key Rotation] Trying key {attempt} out of {len(openrouter_keys)}")
            api_key = get_client(attempt)
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            }
            payload = {
                'model': 'openai/gpt-4',
                'messages': messages,
                'max_tokens': 400,  # Consistent with Flask server
                'temperature': 0.5
            }

            # Use http_post abstraction which calls `requests` when available
            # or a urllib fallback otherwise.
            resp = http_post('https://openrouter.ai/api/v1/chat/completions', headers=headers, json_payload=payload, timeout=15)
            if resp.status_code == 200:
                # Add debug prints to log the API response and handle extraction errors
                print("DEBUG: API response received successfully")
                data = resp.json()
                # OpenRouter's response shape can vary; attempt safe extraction
                if isinstance(data, dict):
                    try:
                        # Attempt to extract the response content directly
                        reply = data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
                        print(f"DEBUG: Extracted API response: {reply}")
                    except Exception as e:
                        print(f"DEBUG: Error extracting API response: {e}")
                        # Fallback to manual joining of parts
                        parts = []
                        for c in data.get('choices', []):
                            m = c.get('message') or {}
                            txt = m.get('content') or c.get('text', '')
                            if txt:
                                parts.append(txt)
                        reply = '\n'.join(parts).strip() if parts else None
                        if reply:
                            print(f"DEBUG: Fallback API response: {reply}")
                else:
                    print(f"DEBUG: Unexpected API response shape: {data}")
            else:
                print(f"DEBUG: HTTP error: {resp.status_code} - {resp.text[:100]}")  # Truncated for brevity
                raise Exception(f'HTTP {resp.status_code}: {resp.text[:200]}')

            # Success! Rotate this working key to front if we have a reply
            if reply:
                print(f"[Key Rotation] Success with key {attempt}, rotating to front")
                rotate_keys_to_front(attempt)
                break

        except Exception as err:
            error_str = str(err).lower()
            print(f"[Key Rotation] Key {attempt} error: {err}")
            traceback.print_exc()
            # mark key as failed briefly
            failed_keys[attempt] = time.time() + KEY_COOLDOWN_SECONDS
            if "rate limit" in error_str or "quota" in error_str or "429" in error_str:
                # deprioritize rate limited keys by moving to end
                if attempt < len(openrouter_keys) - 1:
                    key = openrouter_keys.pop(attempt)
                    openrouter_keys.append(key)
                    print("[Key Rotation] Moved rate-limited key to end of list")
            time.sleep(0.1)
            continue

    print(f"[Key Rotation] New key order: {['sk-or-v1-' + key.split('-')[-1][:10] + '...' for key in openrouter_keys]}")

    if reply is not None:
        return reply
    else:
        # If API fails, return a short fallback response to always answer
        fallback_reply = "Hey, I'm having a bit of trouble connecting right now, but I'm here to help. Can you try asking again?"
        return fallback_reply

def handler(event, context):
    try:
        # Quick health check for GET requests so we can test function presence
        http_method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')
        if http_method and http_method.upper() == 'GET':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'status': 'ok', 'msg': 'chat function is deployed'})
            }

        # Parse the request body
        body = json.loads(event.get('body', '{}'))
        user_message = body.get('message', '')
        user_id = body.get('user_id', 'default_user')
        voice = body.get('voice', 'friendly')  # Default to friendly

        if not user_message:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'No message provided'})
            }

        # If the `requests` library isn't available (import failed), return a
        # helpful JSON response so the frontend doesn't fail parsing the
        # function response. This commonly happens when dependencies in
        # `netlify/functions/requirements.txt` weren't installed during
        # deployment.
        if not REQUESTS_AVAILABLE:
            print("[NetlifyFunction] requests library unavailable - returning informative fallback reply")
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'reply': "Server missing 'requests' dependency — chat backend cannot connect. Please ensure dependencies are installed and redeploy."})
            }

        # Since serverless functions are stateless, we can't maintain conversation history
        # We'll handle each request independently
        reply = get_chat_response(user_message, voice)

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'reply': reply})
        }
    except Exception as e:
        print(f"Uncaught error in chat: {e}")
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'reply': "Oops, something went wrong on my end. Let's give it another shot!"})
        }
