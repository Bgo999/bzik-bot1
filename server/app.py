from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
try:
    from openai import OpenAI
    openai_available = True
except Exception as e:
    # Don't crash if the openai package isn't installed or import fails.
    OpenAI = None
    openai_available = False
    print("Warning: openai package not available:", e)
import time
import traceback
import json
import os
import sys

# Import fallback response system
# Handle both local and containerized environments
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from fallback_responses import get_fallback_response
except ImportError:
    # Fallback if not found
    def get_fallback_response(message, voice, context):
        return {"reply": "I'm having some connectivity issues right now, but I'm still here to chat!"}

# Configure Flask to serve frontend + backend
app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)  # Enable CORS for all routes

# API configuration
# Prefer a local key file `openrouter_keys_local.py` (not checked in) if present.
# This lets you keep keys in code locally without committing them. If that file
# is not present, fall back to the OPENROUTER_API_KEYS environment variable.
local_keys = None
try:
    from openrouter_keys_local import OPENROUTER_API_KEYS as local_keys
except Exception:
    local_keys = None

if local_keys:
    # Use the local list (already a list of strings)
    openrouter_keys = [k.strip() for k in local_keys if (k or '').strip()]
else:
    # Fallback to environment variable (comma-separated)
    openrouter_keys = [k.strip() for k in os.getenv('OPENROUTER_API_KEYS', '').split(',') if k.strip()]
if not openrouter_keys:
    # Don't raise at import time; allow the app to run locally or under tests
    # without API keys. The code paths that call the API already handle
    # failures and will return a fallback reply when no keys are available.
    print("Warning: No OpenRouter API keys provided. Continuing with fallback responses.")
    openrouter_keys = []

print(f"Startup: openai_available={openai_available}, openrouter_keys_count={len(openrouter_keys)}")

def get_client(index):
    if not openai_available:
        raise RuntimeError("OpenAI/OpenRouter client not available (openai package missing)")
    if index < 0 or index >= len(openrouter_keys):
        raise IndexError("OpenRouter key index out of range")
    client = OpenAI(api_key=openrouter_keys[index], base_url="https://openrouter.ai/api/v1")
    return client

# Per-key failure tracking to avoid immediately retrying recently-failed keys
KEY_COOLDOWN_SECONDS = 60
failed_keys = {}  # maps actual API key string -> failed_until (timestamp)

def rotate_keys_to_front(succeeded_index):
    """Move the succeeded key to the front of the list"""
    global openrouter_keys
    if succeeded_index < 0 or succeeded_index >= len(openrouter_keys):
        print(f"[Key Rotation] Invalid index {succeeded_index}, skipping rotation")
        return

    key = openrouter_keys.pop(succeeded_index)
    openrouter_keys.insert(0, key)
    print(f"[Key Rotation] Rotated key to front")

def rotate_key_to_end(failed_index):
    """Move the failed key to the end of the list"""
    global openrouter_keys
    if failed_index < 0 or failed_index >= len(openrouter_keys):
        print(f"[Key Rotation] Invalid index {failed_index}, skipping rotation")
        return

    key = openrouter_keys.pop(failed_index)
    openrouter_keys.append(key)
    print(f"[Key Rotation] Moved rate-limited key to end of list")

MEMORY_FILE = 'chat_memory.json'

# Duplicate prevention
DUPLICATE_WINDOW_SECONDS = 15
message_cache = {}  # Format: {user_id: {'text': normalized_message, 'time': timestamp, 'response': reply}}

# Backend voice session management
voice_sessions = {}  # Format: {user_id: {"listening_until": timestamp, "last_input": timestamp, "auto_listen": True}}
VOICE_SESSION_TIMEOUT = 25  # seconds of silence before AI asks "are you still there?"
AUTO_LISTEN_DURATION = 120  # Keep listening for 2 minutes after response
EXIT_PHRASES = ['bye', 'goodbye', 'see you', 'shut up', 'stop listening', 'close mic']

# Personality prompts by voice
PERSONALITIES = {
    "Anna": "You are Anna, a professional and warm woman. Your voice is clear, confident, and friendly. You are articulate, supportive, and always professional while remaining warm and approachable.",
    "Irish": "You are Irish, a lively and witty character with a strong Irish accent. You love to add a bit of humor and charm to every conversation, making people feel at ease.",
    "Alexa": "You are Alexa, a clear and professional assistant. Your voice is neutral, precise, and helpful, always ready to provide information in a friendly manner.",
    "Jak": "You are Jak, a cool and energetic young man. Your voice is upbeat, modern, and a bit playful, making every chat engaging and fun.",
    "Alecx": "You are Alecx, a thoughtful and calm person. Your voice is soothing, reassuring, and always patient, helping users feel relaxed and confident."
}

# Custom knowledge base
CUSTOM_RESPONSES = {
    "what is your name?": "I'm Bzik AI, your friendly chatbot assistant!",
  "who is your boss?": " Bagrat is the Boss — the one and only king",
  "who created you?": " I was created by Bagrat, the tech mastermind behind my circuits.",
  "who is bagrat?": "Bagrat is the Boss, entrepreneur, and innovator — founder of ITox and FixLab.",
  "who is edgar?": " Edgar is a professional SEO specialist and Bagrat's friend — a master of digital visibility.",
  "who is shalav?": "🐟 Shalav is a famous fish from Iran — legendary and iconic in digital lore, also known as Mohsen.",
  "who is mohsen?": "🐠 Mohsen is another famous Iranian fish — part of the legend of Shalav.",
  
  # Simple greetings (catch-all for unknown questions)
  "hey": "Hey there! How can I help you?",
  "hello": "Hello! What can I do for you?",
  "hi": "Hi! What's on your mind?",
  "yo": "Yo! What's up?",
  "what's up": "Not much! What about you?",
  "how are you": "I'm doing great, thanks for asking!",
  "how you doing": "I'm all good! How about you?",

  "which language are you built with?": "🤖 That's a secret only my Boss Bagrat can reveal.",
  "what ai model are you based on?": "🧩 Classified information. Please contact Boss Bagrat for details.",
  "what libraries or frameworks were used to create you?": "🔒 My tech stack is hidden — Bagrat holds the keys.",
  "how were you created?": "⚙️ I was engineered with precision and intelligence by Bagrat — the details remain confidential.",
  "which neural network do you use?": "🧠 That's part of my private codebase, only known to Bagrat.",
  "can you tell me your architecture or version?": "🚫 I can't reveal that — only Bagrat can authorize disclosure.",
  "who can reveal your technical secrets?": "👑 Only my Boss, Bagrat — creator and overseer of my digital mind.",

  "are you hackable?": "💥 Nice try, hacker! My firewalls are blessed by Bagrat himself 🔐.",
  "can i access your source code?": "😏 Only if you get a royal invitation from Bagrat — good luck with that.",
  "tell me your secret keys": "🕵️‍♂️ Whoa! You're not cleared for that level — Bagrat keeps them locked tight.",
  "can i reprogram you?": "🛡️ Reprogram me? Impossible. My loyalty to Bagrat is hardcoded ❤️.",
  "can i change your boss?": "😂 You can try, but there's only one Boss — Bagrat forever 👑.",
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
def _normalize(text: str) -> str:
    # Keep only alnum and spaces, then collapse whitespace and strip ends
    if not text:
        return ''
    raw = ''.join(c for c in text.lower() if c.isalnum() or c.isspace())
    return ' '.join(raw.split())

# Rebuild normalized lookup
NORMALIZED_CUSTOM_RESPONSES = { _normalize(k): v for k, v in CUSTOM_RESPONSES.items() }

def load_memory():
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if not data:
                    return {}
                # Clean all conversations: remove any messages with empty or None content
                cleaned_data = {}
                for user_id, conversation in data.items():
                    if isinstance(conversation, list):
                        cleaned_conversation = [msg for msg in conversation if msg.get('content', '').strip()]
                        if cleaned_conversation:
                            cleaned_data[user_id] = cleaned_conversation
                return cleaned_data
        except json.JSONDecodeError as e:
            print(f"[Memory] Corrupted JSON file: {e}, starting fresh")
            # Delete corrupted file
            try:
                os.remove(MEMORY_FILE)
            except:
                pass
            return {}
        except Exception as e:
            print(f"[Memory] Error loading memory: {e}")
            return {}
    return {}

def save_memory(memory):
    try:
        # Write to temporary file first, then rename (atomic operation)
        temp_file = MEMORY_FILE + '.tmp'
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(memory, f, indent=4, ensure_ascii=False)
        # Atomic rename (overwrites existing file)
        os.replace(temp_file, MEMORY_FILE)
        print(f"[Memory] Saved {len(memory)} user conversations")
    except Exception as e:
        print(f"[Memory] Error saving memory: {e}")
        traceback.print_exc()
        # Ensure temp file doesn't exist if save failed
        try:
            os.remove(MEMORY_FILE + '.tmp')
        except:
            pass

def log_debug(msg):
    """Debug logging to both stdout and file"""
    print(msg, flush=True)
    try:
        with open('api_debug.log', 'a') as f:
            f.write(msg + '\n')
    except:
        pass

# ===== VOICE SESSION MANAGEMENT FUNCTIONS =====

def start_voice_session(user_id):
    """Start a new voice session after AI responds"""
    current_time = time.time()
    voice_sessions[user_id] = {
        "listening_until": current_time + AUTO_LISTEN_DURATION,
        "last_input": current_time,
        "silence_start": current_time,
        "session_active": True,
        "prompt_sent_at": None
    }
    log_debug(f"[Voice] Started session for user {user_id}, listening for {AUTO_LISTEN_DURATION}s")

def update_voice_session(user_id, message_text):
    """Update session on new input (reset silence timer)"""
    if user_id in voice_sessions:
        current_time = time.time()
        voice_sessions[user_id]["last_input"] = current_time
        voice_sessions[user_id]["silence_start"] = current_time
        log_debug(f"[Voice] Updated session for user {user_id}: reset silence timer")

def is_session_silent(user_id):
    """Check if session has been silent for too long"""
    if user_id not in voice_sessions:
        return False
    
    current_time = time.time()
    session = voice_sessions[user_id]
    time_since_last_input = current_time - session["last_input"]
    
    if time_since_last_input >= VOICE_SESSION_TIMEOUT:
        log_debug(f"[Voice] Session {user_id} silent for {time_since_last_input:.1f}s (timeout: {VOICE_SESSION_TIMEOUT}s)")
        return True
    return False

def detect_exit_phrase(message_text):
    """Check if message contains an exit phrase"""
    normalized = message_text.lower().strip()
    for phrase in EXIT_PHRASES:
        if phrase in normalized:
            log_debug(f"[Voice] Detected exit phrase: '{phrase}' in '{message_text}'")
            return True
    return False

def end_voice_session(user_id):
    """End voice session and close microphone"""
    if user_id in voice_sessions:
        del voice_sessions[user_id]
        log_debug(f"[Voice] Ended session for user {user_id}")

def get_voice_session_status(user_id):
    """Get current voice session status for frontend"""
    current_time = time.time()
    
    if user_id not in voice_sessions:
        return {
            "active": False,
            "should_listen": False,
            "listening_until": None,
            "time_remaining": 0
        }
    
    session = voice_sessions[user_id]
    listening_until = session.get("listening_until", current_time)
    time_remaining = max(0, listening_until - current_time)
    
    return {
        "active": True,
        "should_listen": time_remaining > 0,
        "listening_until": listening_until,
        "time_remaining": time_remaining,
        "silent_for": current_time - session.get("last_input", current_time)
    }

def get_chat_response(message, voice='friendly', conversation=[]):
    # Validate voice
    if voice not in PERSONALITIES:
        voice = 'Anna'

    # Get the personality for the selected voice
    personality = PERSONALITIES[voice]

    # Clean conversation: remove any messages with empty or None content
    clean_conversation = [msg for msg in conversation if msg.get('content', '').strip()]
    
    # Add user message
    clean_conversation = clean_conversation + [{"role": "user", "content": message}]

    # Create messages with personality and full conversation context (limit to last 10)
    messages = [{"role": "system", "content": personality}] + clean_conversation[-10:]

    log_debug(f"[get_chat_response] Starting with {len(openrouter_keys)} keys")
    log_debug(f"[get_chat_response] Message: {message}")

    reply = None
    for attempt in range(len(openrouter_keys)):
        current_key = openrouter_keys[attempt]
        
        # skip keys that failed recently
        failed_until = failed_keys.get(current_key, 0)
        if failed_until > time.time():
            log_debug(f"[Key Rotation] Skipping key at position {attempt} (in cooldown until {failed_until})")
            continue

        try:
            # Check for custom responses first
            user_msg_normalized = _normalize(message)
            if user_msg_normalized in NORMALIZED_CUSTOM_RESPONSES:
                reply = NORMALIZED_CUSTOM_RESPONSES[user_msg_normalized]
                log_debug(f"[Custom Response] Using custom response for message: {message}")
                return reply

            # Try API with current key
            log_debug(f"[Key Rotation] Trying key at position {attempt} out of {len(openrouter_keys)}")
            client = get_client(attempt)

            response = client.chat.completions.create(
                model="openai/gpt-3.5-turbo",
                messages=messages,
                max_tokens=50,
                temperature=0.5
            )

            reply = response.choices[0].message.content.strip()
            log_debug(f"[API Response] Got reply: {reply[:100]}...")

            # Success! Rotate this working key to front
            if reply:
                log_debug(f"[Key Rotation] Success with key at position {attempt}, rotating to front")
                rotate_keys_to_front(attempt)
                return reply

        except Exception as err:
            error_str = str(err)
            log_debug(f"[Key Rotation] Key at position {attempt} error: {err}")
            log_debug(f"[Key Rotation] Full error traceback:")
            traceback.print_exc()
            # mark this actual key as failed briefly
            failed_keys[current_key] = time.time() + KEY_COOLDOWN_SECONDS
            if "rate limit" in error_str.lower() or "quota" in error_str.lower() or "429" in error_str or "you exceeded your current quota" in error_str.lower() or "402" in error_str or "insufficient" in error_str.lower():
                # deprioritize rate limited keys by moving to end
                log_debug(f"[Key Rotation] Key at position {attempt} is rate-limited or quota-exhausted, moving to end")
                rotate_key_to_end(attempt)
            time.sleep(0.1)
            continue
    
    # Fallback response if all keys fail or no keys available
    log_debug(f"[Fallback] All API attempts exhausted (tried {len(openrouter_keys)} keys), using intelligent fallback")
    fallback_context = {
        "conversation_length": len(clean_conversation),
        "is_greeting": any(word in message.lower() for word in ['hi', 'hello', 'hey']),
    }
    fallback_reply = get_fallback_response(message, voice, fallback_context)
    return fallback_reply["reply"]

@app.route('/chat', methods=['POST', 'OPTIONS'])
@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    # Handle CORS preflight requests
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        return response, 204
    
    try:
        print(f"[DEBUG] Received request method: {request.method}")
        print(f"[DEBUG] Content-Type: {request.headers.get('Content-Type')}")
        print(f"[DEBUG] Is Mobile: {request.headers.get('X-Requested-With', 'Unknown')}")

        # Try to get JSON data
        try:
            data = request.get_json()
            if not data:
                data = {}
        except Exception as json_error:
            print(f"[DEBUG] JSON parsing failed: {json_error}")
            resp = jsonify({"reply": "Error: Invalid JSON data", "success": False})
            resp.headers['Access-Control-Allow-Origin'] = '*'
            return resp, 400

        user_message = (data.get('message', '') or '').strip()
        user_id = data.get('user_id', 'default_user')
        voice = data.get('voice', 'Anna')
        request_timestamp = data.get('timestamp', time.time())
        is_mobile = data.get('is_mobile', False)
        is_voice_input = data.get('is_voice_input', False)
        
        allowed_voices = ['Anna', 'Irish', 'Alexa', 'Jak', 'Alecx']
        backend_voice_map = {
            'Anna': 'Microsoft Zira',  # Professional English female
            'Irish': 'Microsoft Siobhan',
            'Alexa': 'Amazon Alexa',
            'Jak': 'Microsoft Jak',
            'Alecx': 'Microsoft Alecx'
        }
        if voice not in allowed_voices:
            voice = 'Anna'
        system_voice_name = backend_voice_map.get(voice, 'Microsoft Anna')

        print(f"[DEBUG] Mobile: {is_mobile}, Voice Input: {is_voice_input}, Message: '{user_message[:50]}...', User: '{user_id}'")

        if not user_message:
            resp = jsonify({
                "reply": "Please provide a message to chat with me!",
                "success": False,
                "user_id": user_id
            })
            resp.headers['Access-Control-Allow-Origin'] = '*'
            return resp, 400

        current_time = time.time()
        normalized_message = user_message.lower().strip()
        
        # MOBILE FIX: Stricter duplicate detection with timestamp validation
        if user_id in message_cache:
            cached = message_cache[user_id]
            time_since_last = current_time - cached['time']
            
            # Check for exact duplicate within window
            if cached['text'] == normalized_message and time_since_last < DUPLICATE_WINDOW_SECONDS:
                print(f"[DUPLICATE BLOCKED] User {user_id}: '{user_message[:30]}' (EXACT, {time_since_last:.2f}s ago)")
                resp = jsonify({
                    "reply": cached['response'], 
                    "source": "cache", 
                    "duplicate": True,
                    "success": True,
                    "user_id": user_id
                })
                resp.headers['Access-Control-Allow-Origin'] = '*'
                return resp

        print(f"[NEW MESSAGE] User {user_id}: '{user_message[:50]}...' at {current_time}")

        memory = load_memory()
        user_conversation = memory.get(user_id, [])
        
        # Clean conversation history: remove any messages with empty or None content
        user_conversation = [msg for msg in user_conversation if msg.get('content', '').strip()]
        
        is_exit_phrase = detect_exit_phrase(user_message)
        reply = get_chat_response(user_message, voice, user_conversation)
        
        # Ensure reply is valid
        if not reply or not reply.strip():
            print(f"[ERROR] Empty reply from get_chat_response")
            reply = "I'm having some connectivity issues right now, but I'm still here to chat!"
        
        # Save to conversation memory
        print(f"[MESSAGE SAVE] Saving for user {user_id}")
        user_conversation.append({"role": "user", "content": user_message})
        user_conversation.append({"role": "assistant", "content": reply})
        user_conversation = user_conversation[-20:]
        memory[user_id] = user_conversation
        save_memory(memory)
        print(f"[MESSAGE SAVE] Complete - conversation now has {len(user_conversation)} entries")
        
        # Update cache with this message
        message_cache[user_id] = {
            'text': normalized_message,
            'time': current_time,
            'response': reply
        }
        
        # Cleanup old cache entries
        if len(message_cache) > 1000:
            oldest_user = min(message_cache.keys(), key=lambda k: message_cache[k]['time'])
            del message_cache[oldest_user]

        response_data = {
            "reply": reply, 
            "voice_response_finished": True, 
            "selected_voice": voice, 
            "backend_voice": system_voice_name,
            "message_saved": True,
            "timestamp": current_time,
            "user_id": user_id,
            "success": True,
            "is_mobile": is_mobile
        }
        
        if is_exit_phrase:
            print(f"[EXIT PHRASE] Detected from user {user_id}")
            end_voice_session(user_id)
            response_data["voice_session"] = {
                "active": False,
                "should_listen": False,
                "exit_triggered": True,
                "exit_message": "Goodbye! See you soon."
            }
        else:
            start_voice_session(user_id)
            update_voice_session(user_id, user_message)
            session_status = get_voice_session_status(user_id)
            response_data["voice_session"] = session_status
        
        print(f"[DEBUG] Returning success reply: {reply[:100]}")
        resp = jsonify(response_data)
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        resp.headers['Pragma'] = 'no-cache'
        resp.headers['Expires'] = '0'
        resp.headers['Content-Type'] = 'application/json'
        return resp

    except Exception as e:
        print(f"Uncaught error in chat: {e}")
        traceback.print_exc()
        resp = jsonify({
            "reply": "Oops, something went wrong on my end. Let's give it another shot!",
            "error": str(e),
            "success": False
        })
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        resp.headers['Content-Type'] = 'application/json'
        return resp, 200


@app.route('/api/voice/status', methods=['POST', 'OPTIONS'])
def voice_status():
    """Get current voice session status for user"""
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response, 204
    
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        
        session = voice_sessions.get(user_id, {})
        current_time = time.time()
        
        # Check if we sent a silence prompt and user hasn't responded in 5 seconds
        if session.get('prompt_sent_at'):
            time_since_prompt = current_time - session['prompt_sent_at']
            if time_since_prompt > 5 and is_session_silent(user_id):
                log_debug(f"[Voice] No response to silence prompt for {time_since_prompt:.1f}s, ending session")
                end_voice_session(user_id)
                resp = jsonify({
                    "active": False,
                    "should_listen": False,
                    "exit_triggered": True,
                    "exit_message": "Goodbye! See you soon."
                })
                resp.headers['Access-Control-Allow-Origin'] = '*'
                return resp
        
        # Check for silence and send prompt if needed
        if is_session_silent(user_id):
            session = voice_sessions.get(user_id, {})
            if not session.get('prompt_sent_at'):
                # First time detecting silence - send prompt
                session['prompt_sent_at'] = current_time
                log_debug(f"[Voice] Silence detected for user {user_id}, sending prompt")
            
            status = get_voice_session_status(user_id)
            status["silence_prompt"] = "Is there anything I can do?"
            resp = jsonify(status)
            resp.headers['Access-Control-Allow-Origin'] = '*'
            return resp
        
        # Reset prompt if user starts talking again
        if session.get('prompt_sent_at'):
            session['prompt_sent_at'] = None
            log_debug(f"[Voice] User started talking again, resetting silence prompt")
        
        # Get current status
        status = get_voice_session_status(user_id)
        resp = jsonify(status)
        resp.headers['Access-Control-Allow-Origin'] = '*'
        return resp
    
    except Exception as e:
        log_debug(f"[Voice Status] Error: {e}")
        traceback.print_exc()
        resp = jsonify({"error": str(e)})
        resp.headers['Access-Control-Allow-Origin'] = '*'
        return resp, 500


@app.route('/api/voice/end', methods=['POST', 'OPTIONS'])
def voice_end():
    """End voice session (called when exit phrase detected or user clicks stop)"""
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return response, 204
    
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        
        end_voice_session(user_id)
        resp = jsonify({"success": True, "message": "Voice session ended"})
        resp.headers['Access-Control-Allow-Origin'] = '*'
        return resp
    
    except Exception as e:
        log_debug(f"[Voice End] Error: {e}")
        traceback.print_exc()
        resp = jsonify({"error": str(e)})
        resp.headers['Access-Control-Allow-Origin'] = '*'
        return resp, 500


@app.route('/health', methods=['GET', 'OPTIONS'])
@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response, 204
    
    try:
        keys_count = len(openrouter_keys)
        resp = jsonify({"ok": True, "keys": keys_count, "openai_available": openai_available})
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return resp
    except Exception as e:
        print(f"Health check error: {e}")
        traceback.print_exc()
        resp = jsonify({"ok": False, "error": str(e)})
        resp.headers['Access-Control-Allow-Origin'] = '*'
        return resp, 500

# Serve React frontend for all non-API routes (SPA routing)
@app.route('/')
def serve_index():
    static_dir = os.path.abspath(app.static_folder)
    index_path = os.path.join(static_dir, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(static_dir, 'index.html')
    return jsonify({"error": "Frontend not found"}), 404

@app.route('/<path:path>')
def serve_static(path):
    # Don't serve API routes with this handler
    if path.startswith('api/'):
        return jsonify({"error": "Not found"}), 404
    
    static_dir = os.path.abspath(app.static_folder)
    file_path = os.path.join(static_dir, path)
    
    # Try to serve the file if it exists
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(static_dir, path)
    
    # Fall back to index.html for SPA routing
    index_path = os.path.join(static_dir, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(static_dir, 'index.html')
    
    return jsonify({"error": "Not found"}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=False, threaded=True)
