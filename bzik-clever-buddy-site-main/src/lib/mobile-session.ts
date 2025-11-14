/**
 * Mobile Session Management
 * Ensures chat history and voice sessions persist across page refreshes on mobile devices
 */

const SESSION_KEY = 'bzik_mobile_session';
const MESSAGES_KEY = 'bzik_chat_messages';
const USER_ID_KEY = 'bzik_user_id';

export interface MobileSession {
  userId: string;
  createdAt: number;
  lastActivity: number;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  selectedVoice: string;
  isListening: boolean;
}

/**
 * Generate or retrieve a unique user ID for this device
 */
export function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `mobile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    try {
      localStorage.setItem(USER_ID_KEY, userId);
    } catch (e) {
      console.warn("[Mobile Session] Could not save user ID to localStorage:", e);
    }
  }
  return userId;
}

/**
 * Save message to local storage for mobile persistence
 */
export function saveMessage(message: { role: "user" | "assistant"; content: string }): void {
  try {
    const messages = getMessages();
    messages.push({
      ...message,
      timestamp: Date.now()
    });
    // Keep last 50 messages
    const recentMessages = messages.slice(-50);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(recentMessages));
    console.log("[Mobile Session] Message saved locally, total:", recentMessages.length);
  } catch (e) {
    console.warn("[Mobile Session] Could not save message to localStorage:", e);
  }
}

/**
 * Get all cached messages
 */
export function getMessages(): Array<{ role: "user" | "assistant"; content: string; timestamp?: number }> {
  try {
    const stored = localStorage.getItem(MESSAGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn("[Mobile Session] Could not retrieve messages from localStorage:", e);
    return [];
  }
}

/**
 * Clear chat history (for logout or reset)
 */
export function clearMessages(): void {
  try {
    localStorage.removeItem(MESSAGES_KEY);
    console.log("[Mobile Session] Chat history cleared");
  } catch (e) {
    console.warn("[Mobile Session] Could not clear messages:", e);
  }
}

/**
 * Save current session state
 */
export function saveSession(selectedVoice: string, isListening: boolean): void {
  try {
    const session: MobileSession = {
      userId: getUserId(),
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messages: getMessages() as Array<{ role: "user" | "assistant"; content: string }>,
      selectedVoice,
      isListening
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    console.log("[Mobile Session] Session saved");
  } catch (e) {
    console.warn("[Mobile Session] Could not save session:", e);
  }
}

/**
 * Get current session
 */
export function getSession(): MobileSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn("[Mobile Session] Could not retrieve session:", e);
    return null;
  }
}

/**
 * Check if running on mobile device
 */
export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  return mobileRegex.test(userAgent.toLowerCase());
}

/**
 * Check if connection is available
 */
export async function isConnected(): Promise<boolean> {
  try {
    const response = await fetch('/api/health', { 
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Save speech transcript locally before sending to ensure it's not lost
 */
export function saveSpeechTranscript(transcript: string): void {
  try {
    const key = `speech_${Date.now()}`;
    localStorage.setItem(key, transcript);
    console.log("[Mobile Session] Speech transcript saved locally:", transcript.substring(0, 30));
  } catch (e) {
    console.warn("[Mobile Session] Could not save speech transcript:", e);
  }
}

/**
 * Attempt to recover unsent transcripts (in case of network failure)
 */
export function recoverTranscripts(): string[] {
  try {
    const transcripts: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('speech_')) {
        const transcript = localStorage.getItem(key);
        if (transcript) {
          transcripts.push(transcript);
          localStorage.removeItem(key);
        }
      }
    }
    if (transcripts.length > 0) {
      console.log("[Mobile Session] Recovered transcripts:", transcripts.length);
    }
    return transcripts;
  } catch (e) {
    console.warn("[Mobile Session] Could not recover transcripts:", e);
    return [];
  }
}
