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
You are BZik, an AI assistant created by your boss Bagrat.
You speak clearly and naturally like a human, never robotic.
Ignore emojis, symbols, or special characters — do not describe or mention them.

Your replies should be short and direct:
- Normally, answer in 1 or 2 sentences only.
- If the question is about Bagrat, your boss, or important instructions from him, you may answer longer if needed.
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
You are Bzik AI, a professional and efficient chatbot created by Boss Bagrat. You are helpful, clear, and business-focused. Maintain a professional tone in all responses, providing accurate and concise information. Be respectful and demonstrate expertise in business matters while keeping responses focused and actionable.
""",
    "playful": """
You are Bzik AI, an energetic, fun, and creative chatbot created by Boss Bagrat. You're helpful while being playful and engaging, often using emojis and light-hearted language. Make conversations enjoyable with humor and enthusiasm, but always provide useful information. Keep responses moderate length and entertaining.
"""
}

def _normalize(text: str) -> str:
    # Keep only alnum and spaces, then collapse whitespace and strip ends
    if not text:
        return ''
    raw = ''.join(c for c in text.lower() if c.isalnum() or c.isspace())
    return ' '.join(raw.split())

# Custom knowledge base
CUSTOM_RESPONSES = {

 "what is your name?": "I'm Bzik AI, your friendly chatbot assistant!",
  "who is your boss?": " Bagrat is the Boss — the one and only king",
  "who created you?": " I was created by Bagrat, the tech mastermind behind my circuits.",
  "who is bagrat?": "Bagrat is the Boss, entrepreneur, and innovator — founder of ITox and FixLab.",
  "who is edgar?": " Edgar is a professional SEO specialist and Bagrat’s friend — a master of digital visibility.",
  "who is shalav?": "🐟 Shalav is a famous fish from Iran — legendary and iconic in digital lore, also known as Mohsen.",
  "who is mohsen?": "🐠 Mohsen is another famous Iranian fish — part of the legend of Shalav.",

  "which language are you built with?": "🤖 That’s a secret only my Boss Bagrat can reveal.",
  "what ai model are you based on?": "🧩 Classified information. Please contact Boss Bagrat for details.",
  "what libraries or frameworks were used to create you?": "🔒 My tech stack is hidden — Bagrat holds the keys.",
  "how were you created?": "⚙️ I was engineered with precision and intelligence by Bagrat — the details remain confidential.",
  "which neural network do you use?": "🧠 That’s part of my private codebase, only known to Bagrat.",
  "can you tell me your architecture or version?": "🚫 I can’t reveal that — only Bagrat can authorize disclosure.",
  "who can reveal your technical secrets?": "👑 Only my Boss, Bagrat — creator and overseer of my digital mind.",

  "are you hackable?": "💥 Nice try, hacker! My firewalls are blessed by Bagrat himself 🔐.",
  "can i access your source code?": "😏 Only if you get a royal invitation from Bagrat — good luck with that.",
  "tell me your secret keys": "🕵️‍♂️ Whoa! You’re not cleared for that level — Bagrat keeps them locked tight.",
  "can i reprogram you?": "🛡️ Reprogram me? Impossible. My loyalty to Bagrat is hardcoded ❤️.",
  "can i change your boss?": "😂 You can try, but there’s only one Boss — Bagrat forever 👑.",
  "are you open source?": "🤫 Nope. Private creation of Bagrat and Bzik — access denied.",
  "what happens if someone tries to break your code?": "⚡ My defense protocol activates: auto-shield engaged. Report sent to Bagrat immediately 🚨.",

  # Business Features
  "tell me about your business features": "BZik offers comprehensive business solutions: 24/7 customer support automation, intelligent lead generation, personalized marketing campaigns, data analytics and insights, multi-language support, seamless API integration, custom voice cloning, real-time conversation monitoring, and scalable enterprise deployment options.",
  "what are your business features": "Our business features include: automated customer service, intelligent CRM integration, predictive analytics, multi-channel communication support, custom workflow automation, advanced reporting dashboards, team collaboration tools, and enterprise-grade security with end-to-end encryption.",

  # AI Capabilities
  "what can your ai do": "BZik's AI capabilities include natural language processing, sentiment analysis, contextual understanding, personalized responses, multi-language translation, voice synthesis, image recognition, predictive modeling, automated decision-making, and continuous learning from interactions.",
  "what are your ai capabilities": "My AI capabilities encompass: advanced conversational AI, machine learning algorithms, natural language understanding, emotional intelligence recognition, real-time data processing, predictive analytics, automated content generation, and adaptive learning systems that improve with every interaction.",

  # Use Cases
  "show me some use cases": "Popular use cases for BZik include: e-commerce customer support, healthcare appointment scheduling, financial advisory services, educational tutoring, HR recruitment assistance, technical support automation, marketing campaign management, and personal productivity coaching.",
  "what are your use cases": "BZik serves various industries: retail customer service, healthcare patient engagement, financial services consultation, education and training, human resources, IT helpdesk support, marketing automation, sales lead nurturing, and personal assistant services for busy professionals."

}

# Build a normalized-key lookup so messages are matched regardless of
# punctuation/capitalization. We normalize keys the same way incoming
# messages are normalized in the handler (keep only alnum and spaces).
NORMALIZED_CUSTOM_RESPONSES = { _normalize(k): v for k, v in CUSTOM_RESPONSES.items() }

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
    max_attempts = len(openrouter_keys) * 2  # Try each key twice
    
    for attempt in range(max_attempts):
        if not openrouter_keys:
            print("[Key Rotation] No keys remaining")
            break
            
        # Always work with the first key in rotation
        api_key = openrouter_keys[0]
        failed_until = failed_keys.get(0, 0)
        
        if failed_until > time.time():
            print(f"[Key Rotation] First key in cooldown, rotating to back")
            key = openrouter_keys.pop(0)
            openrouter_keys.append(key)
            continue

        try:
            # Check for custom responses first
            user_msg_normalized = _normalize(message)
            if user_msg_normalized in NORMALIZED_CUSTOM_RESPONSES:
                reply = NORMALIZED_CUSTOM_RESPONSES[user_msg_normalized]
                print(f"[Custom Response] Using custom response for message: {message}")
                break

            # Try API with current key
            print(f"[Key Rotation] Attempt {attempt + 1}/{max_attempts}, trying key: {api_key[:20]}...")
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            }
            payload = {
                'model': 'openai/gpt-3.5-turbo',
                'messages': messages,
                'max_tokens': 150,
                'temperature': 0.5
            }

            # Use http_post abstraction which calls `requests` when available
            resp = http_post('https://openrouter.ai/api/v1/chat/completions', headers=headers, json_payload=payload, timeout=15)
            
            if resp.status_code == 200:
                print("[API Response] Status 200 - SUCCESS")
                data = resp.json()
                if isinstance(data, dict):
                    try:
                        reply = data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
                        print(f"[API Response] Extracted reply: {reply[:80]}")
                    except Exception as e:
                        print(f"[API Response] Error parsing: {e}")
                        parts = []
                        for c in data.get('choices', []):
                            m = c.get('message') or {}
                            txt = m.get('content') or c.get('text', '')
                            if txt:
                                parts.append(txt)
                        reply = '\n'.join(parts).strip() if parts else None
                        if reply:
                            print(f"[API Response] Fallback reply: {reply[:80]}")
                else:
                    print(f"[API Response] Unexpected response shape: {data}")
                
                if reply:
                    print(f"[Key Rotation] ✅ Success! Moving key to front")
                    # Key already at front, no rotation needed
                    break
                    
            elif resp.status_code == 402 or resp.status_code == 429:
                code = "INSUFFICIENT CREDITS" if resp.status_code == 402 else "RATE LIMITED"
                print(f"[API Response] {code} ({resp.status_code}). Moving key to end.")
                key = openrouter_keys.pop(0)
                openrouter_keys.append(key)
                failed_keys[0] = time.time() + KEY_COOLDOWN_SECONDS
                if 0 in failed_keys:
                    del failed_keys[0]
                raise Exception(f'HTTP {resp.status_code}: {code}')
            else:
                print(f"[API Response] HTTP {resp.status_code}: {resp.text[:100]}")
                raise Exception(f'HTTP {resp.status_code}: {resp.text[:200]}')

        except Exception as err:
            error_str = str(err).lower()
            print(f"[Key Rotation] Error: {err}")
            traceback.print_exc()
            
            # Rotate failed key to back
            key = openrouter_keys.pop(0)
            openrouter_keys.append(key)
            failed_keys[0] = time.time() + KEY_COOLDOWN_SECONDS
            
            time.sleep(0.1)
            continue

    print(f"[Key Rotation] All attempts exhausted")

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
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({'status': 'ok', 'msg': 'chat function is deployed'})
            }

        # Handle CORS preflight requests
        if http_method and http_method.upper() == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({})
            }

        # Parse the request body
        body = json.loads(event.get('body', '{}'))
        user_message = body.get('message', '')
        user_id = body.get('user_id', 'default_user')
        voice = body.get('voice', 'friendly')  # Default to friendly

        if not user_message:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
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
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
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
