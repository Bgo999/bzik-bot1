// Netlify Function: chat.js
// Port of Python netlify/functions/chat.py to Node (Netlify Functions)
// - Handles GET health check and POST message requests
// - Rotates API keys, supports custom responses, and optionally persists
//   conversations to Supabase (if SUPABASE_URL and SUPABASE_KEY are set)

const DEFAULT_KEYS = (process.env.OPENROUTER_API_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
// If no env var provided, fallback to embedded keys (copied from original python file)
const FALLBACK_KEYS = [
    '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',
    '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',
    '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',
    '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',
    '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',
    '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',
    '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',
    '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'
];

let openrouterKeys = DEFAULT_KEYS.length ? DEFAULT_KEYS.slice() : FALLBACK_KEYS.slice();
console.log('[NetlifyFunction] OPENROUTER_API_KEYS count:', openrouterKeys.length);

const KEY_COOLDOWN_SECONDS = 60;
const failedKeys = {}; // index -> timestamp

const PERSONALITIES = {
  friendly: `You are Bzik, a friendly AI assistant for the Bzik Fly website. You help visitors learn about our AI platform, answer questions about features, pricing, and guide them through the site.\n\nYou speak clearly and naturally like a human, never robotic. Be helpful, engaging, and knowledgeable about:\n- Bzik's AI capabilities and features\n- Business applications and use cases\n- Pricing and plans\n- How to get started\n- Technical integration\n\nKeep responses:\n- Clear, contextual, and friendly\n- Concise but informative (1-3 sentences)\n- Actionable when possible\n- Professional yet approachable\n\nIf users ask about navigation or sections, guide them helpfully. Show enthusiasm for Bzik's technology while being genuine and helpful.`,
  professional: `You are Bzik AI, a professional and efficient chatbot created by Boss Kevin. You are helpful, clear, and business-focused. Maintain a professional tone in all responses, providing accurate and concise information. Be respectful and demonstrate expertise in business matters while keeping responses focused and actionable.`,
  playful: `You are Bzik AI, an energetic, fun, and creative chatbot created by Boss Kevin. You're helpful while being playful and engaging, often using emojis and light-hearted language. Make conversations enjoyable with humor and enthusiasm, but always provide useful information. Keep responses moderate length and entertaining.`
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
  for (let attempt = 0; attempt < openrouterKeys.length; attempt++) {
    const failedUntil = failedKeys[attempt] || 0;
    if (failedUntil > Date.now() / 1000) {
      console.log(`[Key Rotation] Skipping key ${attempt} until ${failedUntil}`);
      continue;
    }

    try {
      const apiKey = openrouterKeys[attempt];
      console.log(`[Key Rotation] Trying key ${attempt} out of ${openrouterKeys.length}`);

      const payload = {
        model: 'deepseek/deepseek-chat',
        messages,
        max_tokens,
        temperature
      };

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 200) {
        const data = await res.json();
        try {
          reply = data.choices?.[0]?.message?.content?.trim();
        } catch (e) {
          if (Array.isArray(data.choices)) {
            reply = data.choices.map(c => (c.message?.content || c.text || '')).join('\n').trim();
          }
        }
      } else {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt.slice(0,200)}`);
      }

      if (reply) {
        console.log(`[Key Rotation] Success with key ${attempt}, rotating to front`);
        rotateKeysToFront(attempt);
        break;
      }
    } catch (err) {
      console.error(`[Key Rotation] Key ${attempt} error:`, err?.message || err);
      failedKeys[attempt] = Math.floor(Date.now() / 1000) + KEY_COOLDOWN_SECONDS;
      const errStr = (err?.message || '').toLowerCase();
      if (errStr.includes('rate limit') || errStr.includes('quota') || errStr.includes('429')) {
        if (attempt < openrouterKeys.length - 1) {
          const k = openrouterKeys.splice(attempt, 1)[0];
          openrouterKeys.push(k);
        }
      }
      await new Promise(r => setTimeout(r, 100));
      continue;
    }
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
    const method = (event.httpMethod || (event.requestContext?.http?.method))?.toUpperCase();
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (method === 'OPTIONS') {
      return { statusCode: 204, headers, body: '' };
    }

    if (method === 'GET') {
      return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok', msg: 'chat function is deployed' }) };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const user_message = body.message || '';
    const user_id = body.user_id || 'default_user';
    const voice = body.voice || 'friendly';

    if (!user_message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No message provided' }) };
    }

    const norm = normalizeMessage(user_message);
    if (CUSTOM_RESPONSES[norm]) {
      const replyText = CUSTOM_RESPONSES[norm];
      persistConversationToSupabase({ user_id, message: user_message, reply: replyText, voice }).catch(()=>{});
      return { statusCode: 200, headers, body: JSON.stringify({ reply: replyText }) };
    }

    const personality = PERSONALITIES[voice] || PERSONALITIES.friendly;
    const messages = [{ role: 'system', content: personality }, { role: 'user', content: user_message }];

    const reply = await callOpenRouter(messages, 100, 0.5);

    const finalReply = reply || "Hey, I'm having a bit of trouble connecting right now, but I'm here to help. Can you try asking again?";

    persistConversationToSupabase({ user_id, message: user_message, reply: finalReply, voice }).catch(()=>{});

    return { statusCode: 200, headers, body: JSON.stringify({ reply: finalReply }) };
  } catch (err) {
    console.error('Uncaught error in chat handler:', err?.message || err);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reply: "Oops, something went wrong on my end. Let's give it another shot!" }) };
  }
};
