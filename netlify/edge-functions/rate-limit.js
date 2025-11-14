// Netlify Edge Function for Rate Limiting
// Provides distributed rate limiting for API endpoints

const RATE_LIMITS = {
  // API endpoints - stricter limits
  '/.netlify/functions/chat': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    blockDurationMs: 5 * 60 * 1000, // 5 minute block
  },
  '/.netlify/functions/': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute for other functions
    blockDurationMs: 2 * 60 * 1000, // 2 minute block
  },
  // Default for other paths
  default: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 500, // 500 requests per minute
    blockDurationMs: 60 * 1000, // 1 minute block
  }
};

// Simple in-memory store (in production, use Redis or similar)
const requestCounts = new Map();
const blockedIPs = new Map();

function getClientIP(request) {
  // Get real IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfIP = request.headers.get('cf-connecting-ip');

  return cfIP || realIP || (forwarded ? forwarded.split(',')[0].trim() : null) || 'unknown';
}

function getRateLimitConfig(path) {
  if (path.startsWith('/.netlify/functions/chat')) {
    return RATE_LIMITS['/.netlify/functions/chat'];
  }
  if (path.startsWith('/.netlify/functions/')) {
    return RATE_LIMITS['/.netlify/functions/'];
  }
  return RATE_LIMITS.default;
}

function isBlocked(clientIP) {
  const blockInfo = blockedIPs.get(clientIP);
  if (!blockInfo) return false;

  if (Date.now() > blockInfo.until) {
    blockedIPs.delete(clientIP);
    return false;
  }

  return true;
}

function recordRequest(clientIP, path) {
  const key = `${clientIP}:${path}`;
  const now = Date.now();
  const config = getRateLimitConfig(path);

  let requestInfo = requestCounts.get(key);
  if (!requestInfo || (now - requestInfo.windowStart) > config.windowMs) {
    requestInfo = {
      count: 0,
      windowStart: now
    };
  }

  requestInfo.count++;

  // Check if limit exceeded
  if (requestInfo.count > config.maxRequests) {
    blockedIPs.set(clientIP, {
      until: now + config.blockDurationMs,
      reason: `Rate limit exceeded: ${requestInfo.count}/${config.maxRequests} requests in ${config.windowMs}ms`
    });
    return false; // Block the request
  }

  requestCounts.set(key, requestInfo);
  return true; // Allow the request
}

function cleanOldEntries() {
  const now = Date.now();

  // Clean old request counts
  for (const [key, info] of requestCounts.entries()) {
    if ((now - info.windowStart) > 300000) { // 5 minutes
      requestCounts.delete(key);
    }
  }

  // Clean expired blocks
  for (const [ip, blockInfo] of blockedIPs.entries()) {
    if (now > blockInfo.until) {
      blockedIPs.delete(ip);
    }
  }
}

export default async (request, context) => {
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance per request
    cleanOldEntries();
  }

  const clientIP = getClientIP(request);
  const url = new URL(request.url);
  const path = url.pathname;

  // Skip rate limiting for static assets and health checks
  if (path.startsWith('/assets/') ||
      path.startsWith('/favicon') ||
      path === '/robots.txt' ||
      path === '/sitemap.xml' ||
      (path === '/' && request.method === 'GET')) {
    return context.next();
  }

  // Check if IP is blocked
  if (isBlocked(clientIP)) {
    const blockInfo = blockedIPs.get(clientIP);
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((blockInfo.until - Date.now()) / 1000)
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((blockInfo.until - Date.now()) / 1000).toString(),
        'X-RateLimit-Blocked': 'true',
        'X-RateLimit-Reason': blockInfo.reason
      }
    });
  }

  // Record and check the request
  if (!recordRequest(clientIP, path)) {
    const config = getRateLimitConfig(path);
    const blockInfo = blockedIPs.get(clientIP);
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(config.blockDurationMs / 1000)
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil(config.blockDurationMs / 1000).toString(),
        'X-RateLimit-Blocked': 'true',
        'X-RateLimit-Reason': blockInfo.reason
      }
    });
  }

  // Add rate limit headers to response
  const config = getRateLimitConfig(path);
  const key = `${clientIP}:${path}`;
  const requestInfo = requestCounts.get(key) || { count: 0 };

  const response = await context.next();

  // Clone the response to add headers
  const newResponse = new Response(response.body, response);

  // Add rate limit headers
  newResponse.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  newResponse.headers.set('X-RateLimit-Remaining', Math.max(0, config.maxRequests - requestInfo.count).toString());
  newResponse.headers.set('X-RateLimit-Reset', new Date(requestInfo.windowStart + config.windowMs).toISOString());
  newResponse.headers.set('X-RateLimit-Window', config.windowMs.toString());

  return newResponse;
};

export const config = {
  path: ['/.netlify/functions/*', '/api/*']
};
