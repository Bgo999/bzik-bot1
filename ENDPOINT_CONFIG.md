/**
 * FRONTEND CONFIGURATION GUIDE
 * 
 * This explains how the InteractiveDemo component selects endpoints:
 * 
 * LOCAL DEVELOPMENT:
 * 1. Tries: http://localhost:5000/api/chat (Flask backend)
 * 2. Falls back to: http://localhost:8081/.netlify/functions/chat (netlify dev)
 * 3. Falls back to: http://localhost:8080/.netlify/functions/chat (netlify dev alt)
 * 4. Falls back to: /.netlify/functions/chat (production mode)
 * 
 * PRODUCTION:
 * Uses: /.netlify/functions/chat (Netlify serverless function)
 * 
 * SOLUTION:
 * For local development, ensure ONE of these is running:
 * 
 * Option A: Flask Backend (EASIEST)
 *   cd c:\My Web Sites\Bzik.bot
 *   python app.py
 *   This runs at http://localhost:5000
 * 
 * Option B: Netlify Dev Server
 *   cd c:\My Web Sites\Bzik.bot\bzik-clever-buddy-site-main
 *   netlify dev
 *   This runs at http://localhost:8888 (frontend) + http://localhost:8081 (functions)
 * 
 * DEBUGGING:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Look for "Calling endpoint:" message
 * 4. Check that it says "Using local Flask backend" or similar
 * 5. If it says "using relative path for production", frontend can't find local backend
 * 
 */

// To manually test which endpoint works, run in browser console:
async function testEndpoints() {
  const endpoints = [
    "http://localhost:5000/api/chat",
    "http://localhost:8081/.netlify/functions/chat",
    "http://localhost:8080/.netlify/functions/chat",
    "/.netlify/functions/chat"
  ];
  
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "test" })
      });
      console.log(`${url}: ${res.status}`);
    } catch (e) {
      console.log(`${url}: ERROR - ${e.message}`);
    }
  }
}
