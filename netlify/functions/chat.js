// Netlify Function: chat.js
// Port of Python netlify/functions/chat.py to Node (Netlify Functions)
// - Handles GET health check and POST message requests
// - Rotates API keys, supports custom responses, and optionally persists
//   conversations to Supabase (if SUPABASE_URL and SUPABASE_KEY are set)

const DEFAULT_KEYS = (process.env.OPENROUTER_API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);

// SECURITY: Use environment variable keys if available, otherwise use fallback keys for development
if (!DEFAULT_KEYS.length) {
  console.warn('[NetlifyFunction] OPENROUTER_API_KEYS environment variable not set, using fallback keys for development');
  DEFAULT_KEYS.push(
    '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',
    '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',
    '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',
    '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'
  );
}

let openrouterKeys = DEFAULT_KEYS.slice();
console.log('[NetlifyFunction] OPENROUTER_API_KEYS count:', openrouterKeys.length);

const KEY_COOLDOWN_SECONDS = 60;
const failedKeys = {}; // index -> timestamp

const PERSONALITIES = {
  friendly: `You are Bzik, a friendly AI assistant for the Bzik Fly website. You help visitors learn about our AI platform, answer questions about features, pricing, and guide them through the site.\n\nYou speak clearly and naturally like a human, never robotic. Be helpful, engaging, and knowledgeable about:\n- Bzik's AI capabilities and features\n- Business applications and use cases\n- Pricing and plans\n- How to get started\n- Technical integration\n\nKeep responses:\n- Clear, contextual, and friendly\n- Concise but informative (1-3 sentences)\n- Actionable when possible\n- Professional yet approachable\n\nIf users ask about navigation or sections, guide them helpfully. Show enthusiasm for Bzik's technology while being genuine and helpful.`,
  professional: `You are Bzik AI, a professional and efficient chatbot created by Boss Bagrat. You are helpful, clear, and business-focused. Maintain a professional tone in all responses, providing accurate and concise information. Be respectful and demonstrate expertise in business matters while keeping responses focused and actionable.`,
  playful: `You are Bzik AI, an energetic, fun, and creative chatbot created by Boss Bagrat. You're helpful while being playful and engaging, often using emojis and light-hearted language. Make conversations enjoyable with humor and enthusiasm, but always provide useful information. Keep responses moderate length and entertaining.`
};

const CUSTOM_RESPONSES = {
  "how to make tea?": "To make tea, start with fresh water, boil it to about 100°C. Add your favorite tea bag or leaves, let it steep for 3-5 minutes. Add sugar or milk if you like, and enjoy!",
  "what is your name?": "I'm Bzik AI, your friendly chatbot assistant!",
  "tell me a joke": "Why don't scientists trust atoms? Because they make up everything!",
  "who is he?": "He is the Slave of Kevin the creator of Bzik AI, haha poor kid!",
};

function normalizeMessage(msg) {
  return (msg || '').toLowerCase().split('').filter(c => /[a-z0-9\s]/.test(c)).join('').trim();
}

function rotateKeysToFront(idx) {
  const k = openrouterKeys.splice(idx, 1)[0];
  openrouterKeys.unshift(k);
}

async function callOpenRouter(messages, max_tokens = 100, temperature = 0.5) {
  let reply = null;
  const maxAttempts = openrouterKeys.length * 2; // Try each key twice before giving up
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (openrouterKeys.length === 0) {
      console.error(`[API] No keys remaining to try`);
      break;
    }
    
    // Get the first key in rotation
    const apiKey = openrouterKeys[0];
    const failedUntil = failedKeys[0] || 0;
    
    if (failedUntil > Date.now() / 1000) {
      console.log(`[Key Rotation] First key in cooldown, rotating to back`);
      const k = openrouterKeys.shift();
      openrouterKeys.push(k);
      continue;
    }

    try {
      console.log(`[Key Rotation] Attempt ${attempt + 1}/${maxAttempts}, trying key: ${apiKey.substring(0, 20)}...`);

      const payload = {
        model: 'openai/gpt-3.5-turbo',
        messages,
        max_tokens,
        temperature
      };

      console.log(`[API Call] Sending request to OpenRouter with model: ${payload.model}`);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      console.log(`[API Response] Status: ${res.status}`);

      if (res.status === 200) {
        const data = await res.json();
        console.log(`[API Response] Received data:`, JSON.stringify(data).substring(0, 200));
        try {
          reply = data.choices?.[0]?.message?.content?.trim();
          console.log(`[API Response] Extracted reply: ${reply?.substring(0, 100)}`);
        } catch (e) {
          console.error(`[API Response] Error parsing reply:`, e);
          if (Array.isArray(data.choices)) {
            reply = data.choices.map(c => (c.message?.content || c.text || '')).join('\n').trim();
            console.log(`[API Response] Fallback reply: ${reply?.substring(0, 100)}`);
          }
        }
        
        if (reply) {
          console.log(`[Key Rotation] ✅ Success! Moving key to front`);
          // Move successful key to front
          const k = openrouterKeys.shift();
          openrouterKeys.unshift(k);
          break;
        }
      } else if (res.status === 402 || res.status === 429) {
        // Payment required or rate limited - rotate to back
        const code = res.status === 402 ? "INSUFFICIENT CREDITS" : "RATE LIMITED";
        console.warn(`[API Response] ${code} (${res.status}). Moving key to end of list.`);
        const k = openrouterKeys.shift();
        openrouterKeys.push(k);
        failedKeys[0] = Math.floor(Date.now() / 1000) + KEY_COOLDOWN_SECONDS;
        delete failedKeys[0];
        throw new Error(`HTTP ${res.status}: ${code}`);
      } else {
        const txt = await res.text();
        console.error(`[API Error] HTTP ${res.status}: ${txt.substring(0, 300)}`);
        throw new Error(`HTTP ${res.status}: ${txt.slice(0,200)}`);
      }
    } catch (err) {
      console.error(`[Key Rotation] Error with key: ${err?.message || err}`);
      // Rotate failed key to back
      const k = openrouterKeys.shift();
      openrouterKeys.push(k);
      failedKeys[0] = Math.floor(Date.now() / 1000) + KEY_COOLDOWN_SECONDS;
      await new Promise(r => setTimeout(r, 100));
      continue;
    }
  }
  
  if (!reply) {
    console.log(`[API] All attempts exhausted, no reply obtained`);
  }
  return reply;
}

async function persistConversationToSupabase({ user_id, message, reply, voice }) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) return;

  try {
    const endpoint = `${url.replace(/\/+$/,'')}/rest/v1/conversations`;
    const body = { user_id, message, reply, voice, created_at: new Date().toISOString() };
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
  } catch (e) {
    console.error('Supabase persist error:', e?.message || e);
  }
}

exports.handler = async function (event, context) {
  try {
    console.log('[Chat Handler] Received request - method:', (event.httpMethod || (event.requestContext?.http?.method))?.toUpperCase());
    console.log('[Chat Handler] Request path:', event.path);
    
    const method = (event.httpMethod || (event.requestContext?.http?.method))?.toUpperCase();
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
      'Access-Control-Allow-Credentials': 'false',
      'Access-Control-Max-Age': '86400'
    };

    if (method === 'OPTIONS') {
      console.log('[Chat Handler] Responding to OPTIONS request');
      return { statusCode: 204, headers, body: '' };
    }

    if (method === 'GET') {
      console.log('[Chat Handler] Responding to GET health check');
      return { statusCode: 200, headers, body: JSON.stringify({ 
        status: 'ok', 
        msg: 'chat function is deployed',
        keys_available: openrouterKeys.length,
        api_url: 'https://openrouter.ai/api/v1/chat/completions',
        timestamp: Date.now()
      }) };
    }

    if (method !== 'POST') {
      console.log('[Chat Handler] Rejecting unsupported method:', method);
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    console.log('[Chat Handler] Processing POST request');
    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      console.error('[Chat Handler] Failed to parse body:', e);
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    const user_message = (body.message || '').trim();
    const user_id = body.user_id || 'default_user';
    const voice = body.voice || 'friendly';

    console.log('[Chat Handler] Message:', user_message?.substring(0, 50), '...');
    console.log('[Chat Handler] Voice:', voice);
    console.log('[Chat Handler] User ID:', user_id);

    if (!user_message) {
      console.log('[Chat Handler] Error: No message provided');
      return { statusCode: 400, headers, body: JSON.stringify({ 
        error: 'No message provided',
        reply: 'Please provide a message to chat with me!'
      }) };
    }

    const norm = normalizeMessage(user_message);
    if (CUSTOM_RESPONSES[norm]) {
      const replyText = CUSTOM_RESPONSES[norm];
      console.log('[Chat Handler] Matched custom response');
      persistConversationToSupabase({ user_id, message: user_message, reply: replyText, voice }).catch(()=>{});
      return { statusCode: 200, headers, body: JSON.stringify({ reply: replyText, source: 'custom' }) };
    }

    const personality = PERSONALITIES[voice] || PERSONALITIES.friendly;
    const messages = [{ role: 'system', content: personality }, { role: 'user', content: user_message }];

    console.log('[Chat Handler] Calling OpenRouter API...');
    const reply = await callOpenRouter(messages, 100, 0.5);

    const finalReply = reply || "Hey, I'm having a bit of trouble connecting right now, but I'm here to help. Can you try asking again?";
    
    if (!reply) {
      console.warn('[Chat Handler] API returned no reply, using fallback message');
    } else {
      console.log('[Chat Handler] Got reply:', finalReply?.substring(0, 50), '...');
    }

    persistConversationToSupabase({ user_id, message: user_message, reply: finalReply, voice }).catch(()=>{});

    return { statusCode: 200, headers, body: JSON.stringify({ 
      reply: finalReply,
      voice_response_finished: true,
      selected_voice: voice,
      source: 'api',
      timestamp: Date.now()
    }) };
  } catch (err) {
    console.error('[Chat Handler] Uncaught error:', err?.message || err);
    console.error('[Chat Handler] Full error stack:', err?.stack);
    const headers = { 
      'Content-Type': 'application/json', 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With'
    };
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        reply: "Oops, something went wrong on my end. Let's give it another shot!",
        error: err?.message,
        source: 'error'
      }) 
    };
  }
};
