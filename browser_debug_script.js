// FRONTEND DEBUGGING GUIDE
// Add this to your browser console to diagnose the issue

async function diagnoseBackend() {
  console.clear();
  console.log("=" .repeat(60));
  console.log("BZIK BACKEND DIAGNOSIS");
  console.log("=".repeat(60));

  const endpoints = [
    { name: "Local Flask (5000)", url: "http://localhost:5000/api/health" },
    { name: "Local Flask (5000) - chat", url: "http://localhost:5000/api/chat" },
    { name: "Local Netlify (8080)", url: "http://localhost:8080/.netlify/functions/chat" },
    { name: "Local Netlify (8081)", url: "http://localhost:8081/.netlify/functions/chat" },
    { name: "Production Netlify", url: "/.netlify/functions/chat" },
    { name: "Production Health", url: "/api/health" }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.url.includes("health") ? "GET" : "POST",
        headers: { "Content-Type": "application/json" },
        body: endpoint.url.includes("health") ? undefined : JSON.stringify({
          message: "test",
          user_id: "debug"
        })
      });
      console.log(`✓ ${endpoint.name}: ${response.status}`);
    } catch (e) {
      console.log(`✗ ${endpoint.name}: ${e.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("CURRENT ENVIRONMENT:");
  console.log("Location:", window.location.href);
  console.log("Hostname:", window.location.hostname);
  console.log("=".repeat(60));
}

// Run it
diagnoseBackend();
