import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Volume2, Loader2, Mic, MicOff } from "lucide-react";
import { BzikCharacter } from "./BzikCharacter";
import { cn } from "@/lib/utils";
import { sanitizeForTTS } from "@/lib/tts";
import { 
  getUserId, 
  saveMessage, 
  saveSpeechTranscript,
  isMobileDevice,
  recoverTranscripts
} from "@/lib/mobile-session";

const BACKEND_VOICES = ['Anna', 'Irish', 'Alexa', 'Jak', 'Alecx'];
const EXIT_PHRASES = ['bye', 'goodbye', 'see you', 'shut up', 'stop listening', 'close mic'];

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface InteractiveDemoProps {
  mode?: "demo" | "chat";
  initialMessage?: string;
  demoActions?: Array<{ label: string; message: string }>;
  isMainChat?: boolean;
}

export function InteractiveDemo({ 
  mode = "chat",
  initialMessage = "🎉 Hi! I'm Bzik — try the demo below or pick a section to explore.",
  demoActions = [],
  isMainChat = false
}: InteractiveDemoProps) {
  const [isOpen, setIsOpen] = useState(!isMainChat);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: initialMessage }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("Anna"); // Female voice default
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [userIdRef] = useState(() => getUserId()); // Get persistent user ID for mobile
  const [isMobile] = useState(() => isMobileDevice());
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAudioTimeRef = useRef<number>(Date.now());
  const silencePromptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silencePromptSentRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastSentMessageRef = useRef<string>("");  // DUPLICATE FIX: Track last sent
  const messageSubmissionInProgressRef = useRef(false);  // DUPLICATE FIX: Prevent concurrent sends

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const sendMessageRef = useRef<(msg: string) => Promise<void>>();
  const exitPhraseDetectedRef = useRef(false);
  const endpointRef = useRef<string | null>(null); // Cache detected endpoint
  const endpointDetectionCompleteRef = useRef(false);
  const autoStartMicTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Auto-start mic timeout

  // Removed: Auto-scroll effect causing unwanted page scrolling

  // Auto-scroll within chat container to latest message
  useEffect(() => {
    // Scroll the container itself, not the page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-start microphone after bot responds (if not already listening)
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Check if last message is from assistant and we're not currently listening
      if (lastMessage.role === "assistant" && !isListeningRef.current && !isSpeakingRef.current) {
        // Wait a bit for TTS to start, then we'll auto-start mic when TTS ends
        // (TTS onend callback will handle the actual start)
        console.log("[Auto-Listen] Ready to listen after bot response");
      }
    }
  }, [isLoading, messages]);

  // Initialize endpoint detection (run once on component mount)
  useEffect(() => {
    const detectEndpoint = async () => {
      if (endpointDetectionCompleteRef.current) {
        return; // Already detected
      }

      console.log("[Endpoint Detection] Starting...");
      const hostname = window.location.hostname;
      const port = window.location.port;
      console.log(`[Endpoint Detection] Current hostname: ${hostname}, port: ${port}`);
      
      let endpoint = "/.netlify/functions/chat"; // Default production endpoint

      // Check if running locally (localhost, 127.0.0.1, or local IP 192.168.x.x, 10.0.x.x)
      const isLocalDev = hostname === 'localhost' || 
                         hostname === '127.0.0.1' || 
                         hostname.startsWith('192.168.') || 
                         hostname.startsWith('10.0.') ||
                         hostname.startsWith('10.');

      if (isLocalDev) {
        console.log("[Endpoint Detection] Detected local/dev environment");
        
        // Try Flask backend first (dev environment) - always use port 5000
        try {
          const testController = new AbortController();
          const timeoutId = setTimeout(() => testController.abort(), 3000);
          const testResponse = await fetch(`http://localhost:5000/api/health`, {
            method: "GET",
            signal: testController.signal,
            mode: 'cors'
          });
          clearTimeout(timeoutId);
          if (testResponse.ok) {
            endpoint = `http://localhost:5000/api/chat`;
            console.log("[Endpoint] ✅ Using Flask backend at http://localhost:5000");
            endpointRef.current = endpoint;
            endpointDetectionCompleteRef.current = true;
            return;
          }
        } catch (e) {
          console.log("[Endpoint Detection] Flask on localhost:5000 not available:", e.message);
        }

        // For mobile/remote IP access, also try the computer's IP with port 5000
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          try {
            const testController = new AbortController();
            const timeoutId = setTimeout(() => testController.abort(), 3000);
            const testResponse = await fetch(`http://${hostname}:5000/api/health`, {
              method: "GET",
              signal: testController.signal,
              mode: 'cors'
            });
            clearTimeout(timeoutId);
            if (testResponse.ok) {
              endpoint = `http://${hostname}:5000/api/chat`;
              console.log(`[Endpoint] ✅ Using Flask backend at http://${hostname}:5000`);
              endpointRef.current = endpoint;
              endpointDetectionCompleteRef.current = true;
              return;
            }
          } catch (e) {
            console.log(`[Endpoint Detection] Flask on ${hostname}:5000 not available:`, e.message);
          }
        }

        // Try other local ports for Netlify development server
        for (const devPort of [8081, 8080]) {
          try {
            const testController = new AbortController();
            const timeoutId = setTimeout(() => testController.abort(), 2000);
            const testResponse = await fetch(`http://localhost:${devPort}/.netlify/functions/chat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: "" }),
              signal: testController.signal,
              mode: 'cors'
            });
            clearTimeout(timeoutId);
            if (testResponse.ok || testResponse.status === 400) {
              endpoint = `http://localhost:${devPort}/.netlify/functions/chat`;
              console.log(`[Endpoint] ✅ Using Netlify at http://localhost:${devPort}`);
              endpointRef.current = endpoint;
              endpointDetectionCompleteRef.current = true;
              return;
            }
          } catch (e2) {
            console.log(`[Endpoint Detection] Port ${devPort} not available:`, e2.message);
          }
        }

        // Final fallback to Flask on localhost
        endpoint = 'http://localhost:5000/api/chat';
        console.log(`[Endpoint] Using fallback Flask endpoint: ${endpoint}`);
      } else {
        // Production environment - try Render backend first, then Netlify
        console.log(`[Endpoint Detection] Detected production environment`);
        
        // Try to reach Render backend (configure this URL in environment)
        const renderBackendUrl = (window as any).__RENDER_BACKEND_URL || '';
        if (renderBackendUrl) {
          try {
            const testController = new AbortController();
            const timeoutId = setTimeout(() => testController.abort(), 3000);
            const testResponse = await fetch(`${renderBackendUrl}/api/health`, {
              method: "GET",
              signal: testController.signal,
              mode: 'cors'
            });
            clearTimeout(timeoutId);
            if (testResponse.ok) {
              endpoint = `${renderBackendUrl}/api/chat`;
              console.log(`[Endpoint] ✅ Using Render backend at ${renderBackendUrl}`);
              endpointRef.current = endpoint;
              endpointDetectionCompleteRef.current = true;
              return;
            }
          } catch (e) {
            console.log("[Endpoint Detection] Render backend not available:", e.message);
          }
        }
        
        console.log(`[Endpoint] Using production Netlify endpoint: ${endpoint}`);
      }
      
      endpointRef.current = endpoint;
      endpointDetectionCompleteRef.current = true;
    };

    detectEndpoint().catch(err => {
      console.error("[Endpoint Detection] Error:", err);
      const hostname = window.location.hostname;
      const isLocalDev = hostname === 'localhost' || 
                         hostname === '127.0.0.1' || 
                         hostname.startsWith('192.168.') || 
                         hostname.startsWith('10.0.') ||
                         hostname.startsWith('10.');
      
      if (isLocalDev) {
        endpointRef.current = 'http://localhost:5000/api/chat';
      } else {
        endpointRef.current = "/.netlify/functions/chat";
      }
      endpointDetectionCompleteRef.current = true;
    });
  }, []);

  // Initialize speech recognition with waveform
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.language = 'en-US';

    // Setup audio visualization
    const setupAudioVisualization = async () => {
      try {
        // Ensure AudioContext exists first
        if (!audioContextRef.current) {
          try {
            const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            console.log("✅ AudioContext created, state:", audioContext.state);
          } catch (e) {
            console.warn("⚠️ AudioContext not available:", e);
            return; // Exit early if AudioContext unavailable (some mobile devices)
          }
        }
        
        // Resume context if suspended (required for some browsers after user gesture)
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          try {
            await audioContextRef.current.resume();
            console.log("✅ AudioContext resumed successfully");
          } catch (e) {
            console.warn("⚠️ Could not resume AudioContext:", e);
          }
        }
        
        const audioContext = audioContextRef.current;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        console.log("✅ Analyser created");

        console.log("🎤 Requesting microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false 
          } 
        });
        
        console.log("✅ Microphone access granted, stream:", stream);
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        microphoneRef.current = microphone;
        console.log("✅ Microphone connected to analyser");
      } catch (error: any) {
        console.error("❌ Error setting up audio visualization:", error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        
        // Provide user feedback
        if (error.name === 'NotAllowedError') {
          console.error("🔒 Microphone permission denied. User rejected the permission request.");
          // Don't show alert on mobile as it can interfere with permission prompts
          if (!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
            alert("Microphone permission denied. Please allow microphone access to use voice features.");
          }
        } else if (error.name === 'NotFoundError' || error.code === 'PERMISSION_DENIED') {
          console.error("🔍 No microphone found on this device.");
          if (!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
            alert("No microphone found. Please connect a microphone and try again.");
          }
        } else if (error.name === 'NotReadableError') {
          console.error("⚠️ Microphone is in use by another application.");
          if (!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
            alert("Microphone is in use by another application. Please close that application and try again.");
          }
        } else if (error.name === 'SecurityError') {
          console.error("🔐 Security error: HTTPS or localhost required for microphone access.");
          console.error("📱 Current URL:", window.location.origin);
        }
        
        // Log audio context state for debugging
        console.error("🎵 AudioContext details:", {
          available: !!audioContextRef.current,
          state: audioContextRef.current?.state,
          sampleRate: audioContextRef.current?.sampleRate
        });
      }
    };

    const animateWaveform = () => {
      if (!analyserRef.current || !isListeningRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Extract 16 frequency bars for richer visualization with more creativity
      const waveform = Array.from(dataArray).slice(0, 16).map((val) => {
        // Add smoothing for more gentle waves
        const normalized = val / 255;
        return Math.pow(normalized, 0.8); // Soften the curve for gentle effect
      });
      setWaveformData(waveform);

      if (isListeningRef.current) {
        animationFrameRef.current = requestAnimationFrame(animateWaveform);
      }
    };

    recognition.onstart = async () => {
      console.log("🎤 Listening started");
      setIsListening(true);
      isListeningRef.current = true;
      finalTranscriptRef.current = "";
      
      // Resume audio context if suspended (critical for mobile)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
          console.log("📊 AudioContext resumed");
        } catch (e) {
          console.warn("Could not resume AudioContext:", e);
        }
      }
      
      // Setup audio visualization
      try {
        await setupAudioVisualization();
        setTimeout(animateWaveform, 100);
      } catch (e) {
        console.warn("Audio visualization setup failed (may be normal):", e);
        // Still continue even if visualization fails
      }
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      finalTranscript = finalTranscript.trim();
      
      // Display interim results on mobile for better UX
      if (interimTranscript && !finalTranscript) {
        console.log("🎤 Interim transcript:", interimTranscript);
        setInput(interimTranscript);
      }
      
      if (finalTranscript) {
        // Check for exit phrases
        const lowerTranscript = finalTranscript.toLowerCase();
        const isExitPhrase = EXIT_PHRASES.some(phrase => lowerTranscript.includes(phrase));
        
        if (isExitPhrase) {
          console.log("🛑 Exit phrase detected:", finalTranscript);
          exitPhraseDetectedRef.current = true; // Flag for later
        }
        
        finalTranscriptRef.current = finalTranscript;
        lastAudioTimeRef.current = Date.now();
        
        // Save transcript locally on mobile before sending
        if (isMobile) {
          saveSpeechTranscript(finalTranscript);
        }
        
        // Update input field with recognized text (critical for mobile capture)
        setInput(finalTranscript);
        
        // Update chat with the recognized text
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].role === "user" && !updated[updated.length - 1].content.includes("[SENT]")) {
            updated[updated.length - 1].content = finalTranscript;
          } else if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
            updated.push({ role: "user", content: finalTranscript });
          } else if (updated.length === 0) {
            updated.push({ role: "user", content: finalTranscript });
          }
          return updated;
        });
      }
    };

    recognition.onspeechend = () => {
      console.log("🎤 Speech ended, finalTranscript:", finalTranscriptRef.current);
      
      // Reset the silence prompt flag when speech ends
      silencePromptSentRef.current = false;
      
      // Clear any pending silence prompt timeout
      if (silencePromptTimeoutRef.current) {
        clearTimeout(silencePromptTimeoutRef.current);
      }
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      // If user already said something, auto-send it after 2 seconds
      if (finalTranscriptRef.current.trim()) {
        console.log("⏱️ User spoke, auto-sending after 2 seconds of silence");
        silenceTimeoutRef.current = setTimeout(() => {
          if (sendMessageRef.current && finalTranscriptRef.current.trim()) {
            console.log("📤 Auto-sending user message:", finalTranscriptRef.current.trim());
            sendMessageRef.current(finalTranscriptRef.current.trim());
          }
        }, 2000);
      } else {
        // User hasn't said anything yet - wait 25 seconds then ask for engagement
        console.log("⏳ Waiting for user input (25 second timeout for engagement prompt)");
        silencePromptTimeoutRef.current = setTimeout(() => {
          if (isListeningRef.current && !silencePromptSentRef.current && finalTranscriptRef.current.trim() === "") {
            console.log("⏱️ 25 seconds of silence - sending engagement prompt");
            silencePromptSentRef.current = true;
            
            // Speak the prompt
            if (synthRef.current) {
              const prompt = "Hey, are you there? How can I help you?";
              const utterance = new SpeechSynthesisUtterance(prompt);
              utterance.volume = 1.0;
              utterance.rate = 1.2; // Match response speed
              utterance.pitch = 1.0;
              
              // Use the same voice selection logic
              let voices = synthRef.current.getVoices() || [];
              if (!voices || voices.length === 0) {
                voices = window.speechSynthesis.getVoices() || [];
              }
              
              const VOICE_MATCHES: Record<string, string[]> = {
                Anna: ['zira', 'anna', 'samantha', 'karen', 'female', 'google', 'wave', 'mary'],
                Irish: ['siobhan', 'irish'],
                Alexa: ['alexa', 'amazon'],
                Jak: ['jak', 'male'],
                Alecx: ['alecx']
              };
              
              const preferred = VOICE_MATCHES[selectedVoice] || [selectedVoice.toLowerCase()];
              let voiceObj = voices.find(v => {
                const ln = (v.name || '').toLowerCase();
                const lang = (v.lang || '').toLowerCase();
                return preferred.some(p => ln.includes(p) || lang.includes(p));
              });
              
              if (!voiceObj) {
                voiceObj = voices.find(v => (v.lang || '').toLowerCase().startsWith('en-us'))
                  || voices.find(v => (v.lang || '').toLowerCase().startsWith('en'))
                  || voices[0];
              }
              
              if (voiceObj) {
                utterance.voice = voiceObj;
              }
              
              utterance.onend = () => {
                console.log("🔊 Engagement prompt spoken, keeping mic open for response...");
                // After prompt finishes, DON'T stop listening - keep mic on indefinitely
                // The user can respond at any time now
                silencePromptSentRef.current = false;
              };
              
              utterance.onerror = (e) => {
                console.warn("⚠️ Engagement prompt error:", e);
                silencePromptSentRef.current = false;
              };
              
              synthRef.current.cancel();
              synthRef.current.speak(utterance);
            }
          }
        }, 25000); // 25 seconds of silence
      }
    };

    recognition.onerror = (event: any) => {
      console.error("🎤 Error:", event.error);
      setIsListening(false);
      isListeningRef.current = false;
      setWaveformData([]);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Try to send message if we have a final transcript even on error
      if (finalTranscriptRef.current.trim() && sendMessageRef.current && !messageSubmissionInProgressRef.current) {
        console.log("🎤 Sending message after recognition error:", finalTranscriptRef.current.trim());
        setTimeout(() => {
          if (finalTranscriptRef.current.trim() && sendMessageRef.current) {
            sendMessageRef.current(finalTranscriptRef.current.trim());
          }
        }, 100);
      }
    };

    recognition.onend = () => {
      console.log("🎤 Recognition ended, finalTranscript:", finalTranscriptRef.current);
      setIsListening(false);
      isListeningRef.current = false;
      setWaveformData([]);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Auto-send the message if we have a final transcript
      if (finalTranscriptRef.current.trim() && sendMessageRef.current) {
        console.log("🎤 Auto-sending message after recognition ended:", finalTranscriptRef.current.trim());
        // Use setTimeout to let the UI update first
        setTimeout(() => {
          if (finalTranscriptRef.current.trim() && sendMessageRef.current) {
            sendMessageRef.current(finalTranscriptRef.current.trim());
          }
        }, 100);
      }
    };

    recognitionRef.current = recognition;
    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {}
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to auto-start microphone
  const autoStartMicrophone = useCallback(() => {
    if (recognitionRef.current && !isListeningRef.current) {
      try {
        console.log("🎤 [Auto-Start] Starting microphone");
        finalTranscriptRef.current = "";
        setInput("");
        setWaveformData([]);
        recognitionRef.current.start();
        
        // Clear any existing timeout
        if (autoStartMicTimeoutRef.current) {
          clearTimeout(autoStartMicTimeoutRef.current);
        }
      } catch (e) {
        console.warn("[Auto-Start] Could not start recognition:", e);
      }
    }
  }, []);

  // Send message function - AGGRESSIVE DUPLICATE PREVENTION + RETRY LOGIC
  const sendMessage = useCallback(async (message: string) => {
    const trimmedMsg = message.trim();
    
    // DUPLICATE FIX: Atomic guards - exit immediately if already sending
    if (messageSubmissionInProgressRef.current) {
      console.log("[SendMessage] BLOCKED: Submission already in progress");
      return;
    }
    
    if (!trimmedMsg) {
      console.log("[SendMessage] BLOCKED: Empty message");
      return;
    }
    
    if (isLoading) {
      console.log("[SendMessage] BLOCKED: Already loading");
      return;
    }

    // DUPLICATE FIX: Mark as in-progress BEFORE any state changes
    messageSubmissionInProgressRef.current = true;
    
    // Check if this exact message was just sent
    if (lastSentMessageRef.current === trimmedMsg) {
      console.log("[SendMessage] BLOCKED: Same message sent twice in succession");
      messageSubmissionInProgressRef.current = false;
      return;
    }
    
    lastSentMessageRef.current = trimmedMsg;
    
    console.log("[SendMessage] ✅ STARTING - message:", trimmedMsg.substring(0, 30));

    // Immediately set loading state
    setIsLoading(true);
    setInput("");
    setWaveformData([]);
    setIsListening(false);
    isListeningRef.current = false;

    try {
      // DUPLICATE FIX: Add user message with atomic update and dedup check
      const messageTimestamp = Date.now();
      setMessages(prev => {
        // Check if last message is identical (prevent React renders adding duplicates)
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === "user" && lastMsg?.content === trimmedMsg) {
          console.log("[SendMessage] PREVENTED: User message duplicate in state");
          return prev;
        }
        const updated = [...prev, { role: "user" as const, content: trimmedMsg }];
        // Save to local storage on mobile
        if (isMobile) {
          saveMessage({ role: "user", content: trimmedMsg });
        }
        return updated;
      });

      // Wait for endpoint detection
      let endpoint = endpointRef.current;
      if (!endpoint) {
        console.log("[SendMessage] Waiting for endpoint detection...");
        let attempts = 0;
        while (!endpointRef.current && attempts < 30) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }
        endpoint = endpointRef.current || "/.netlify/functions/chat";
      }

      console.log("[SendMessage] Using endpoint:", endpoint);
      
      // RETRY LOGIC: Try multiple times with exponential backoff
      const maxRetries = 3;
      let lastError: Error | string = "";
      
      for (let retryAttempt = 0; retryAttempt < maxRetries; retryAttempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000);
          
          console.log(`[SendMessage] Attempt ${retryAttempt + 1}/${maxRetries}`);
          
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "X-Requested-With": "XMLHttpRequest"
            },
            body: JSON.stringify({
              message: trimmedMsg,
              user_id: userIdRef,  // Use persistent mobile user ID
              voice: selectedVoice,
              timestamp: messageTimestamp,
              _dedup_id: `${trimmedMsg}-${messageTimestamp}`,
              is_mobile: isMobile,  // Indicate mobile for backend
              is_voice_input: false
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[SendMessage] HTTP Error on attempt ${retryAttempt + 1}:`, response.status, errorText);
            lastError = `HTTP ${response.status}`;
            
            // Don't retry on 4xx errors (client errors), only on 5xx (server errors)
            if (response.status >= 400 && response.status < 500) {
              break;
            }
            
            // Wait before retrying
            if (retryAttempt < maxRetries - 1) {
              const waitTime = Math.pow(2, retryAttempt) * 1000; // Exponential backoff
              console.log(`[SendMessage] Waiting ${waitTime}ms before retry...`);
              await new Promise(r => setTimeout(r, waitTime));
            }
            continue;
          }

          const data = await response.json();
          
          if (!data.reply || data.reply.trim() === "") {
            console.error("[SendMessage] No reply in response:", data);
            lastError = "Empty response from server";
            
            // Wait before retrying
            if (retryAttempt < maxRetries - 1) {
              const waitTime = Math.pow(2, retryAttempt) * 1000;
              console.log(`[SendMessage] Waiting ${waitTime}ms before retry...`);
              await new Promise(r => setTimeout(r, waitTime));
            }
            continue;
          }

          console.log("[SendMessage] ✅ Got reply:", data.reply.substring(0, 50));
          
          // SUCCESS! Add bot response with atomic update and dedup check
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg?.role === "assistant" && lastMsg?.content === data.reply) {
              console.log("[SendMessage] PREVENTED: Assistant message duplicate in state");
              return prev;
            }
            const updated = [...prev, { role: "assistant" as const, content: data.reply }];
            // Save to local storage on mobile
            if (isMobile) {
              saveMessage({ role: "assistant", content: data.reply });
              console.log("[Mobile] Response saved locally");
            }
            return updated;
          });
          
          console.log("[SendMessage] ✅ Message added to chat");
          setIsLoading(false);

          // Speak response asynchronously
          if (data.reply) {
            console.log("[TTS] Attempting to speak:", data.reply.substring(0, 50));
            console.log("[TTS] synthRef.current:", !!synthRef.current);
            console.log("[TTS] window.speechSynthesis:", !!window.speechSynthesis);
            
            try {
              // Ensure we have speechSynthesis available
              const synthesis = synthRef.current || window.speechSynthesis;
              if (!synthesis) {
                console.error("[TTS] Speech synthesis not available!");
                return;
              }
              
              isSpeakingRef.current = true;
              const utterance = new SpeechSynthesisUtterance(data.reply);
              utterance.volume = 1.0;
              utterance.rate = 1.2;
              utterance.pitch = 1.0;

              let voices = synthesis.getVoices() || [];
              console.log("[TTS] Available voices:", voices.length);
              
              if (!voices || voices.length === 0) {
                // Try to load voices
                voices = await new Promise(resolve => {
                  const voicesReady = () => {
                    const v = synthesis.getVoices() || [];
                    console.log("[TTS] Voices loaded:", v.length);
                    resolve(v);
                  };
                  synthesis.onvoiceschanged = voicesReady;
                  const v = synthesis.getVoices() || [];
                  if (v.length > 0) {
                    resolve(v);
                  }
                });
              }

              const VOICE_MATCHES: Record<string, string[]> = {
                Anna: ['zira', 'anna', 'samantha', 'karen', 'female', 'google', 'wave', 'mary'],
                Irish: ['siobhan', 'irish'],
                Alexa: ['alexa', 'amazon'],
                Jak: ['jak', 'male'],
                Alecx: ['alecx']
              };

              const preferred = VOICE_MATCHES[selectedVoice] || [selectedVoice.toLowerCase()];
              console.log("[TTS] Looking for voice:", selectedVoice, "preferred:", preferred);
              
              let voiceObj = voices.find(v => {
                const ln = (v.name || '').toLowerCase();
                const lang = (v.lang || '').toLowerCase();
                return preferred.some(p => ln.includes(p) || lang.includes(p));
              });

              console.log("[TTS] Selected voice:", voiceObj?.name || 'default');

              if (!voiceObj) {
                voiceObj = voices.find(v => (v.lang || '').toLowerCase().startsWith('en-us'))
                  || voices.find(v => (v.lang || '').toLowerCase().startsWith('en'))
                  || voices[0];
              }

              if (voiceObj) {
                utterance.voice = voiceObj;
                console.log("[TTS] Voice set to:", voiceObj.name);
              } else {
                console.warn("[TTS] No voice found, using default");
              }

              utterance.onstart = () => {
                console.log("[TTS] Speech started");
              };

              utterance.onend = () => {
                console.log("[TTS] Speech finished, auto-starting microphone");
                isSpeakingRef.current = false;
                
                // Auto-start microphone after TTS finishes
                autoStartMicrophone();
              };

              utterance.onerror = (e) => {
                console.warn("[TTS Error]", e);
                isSpeakingRef.current = false;
                
                // Try to start microphone even if TTS failed
                console.log("🎤 [TTS Error] Auto-starting microphone after TTS error");
                autoStartMicrophone();
              };

              console.log("[TTS] Cancelling any previous speech");
              synthesis.cancel();
              
              console.log("[TTS] Speaking utterance");
              synthesis.speak(utterance);
              
              // Fallback: if TTS doesn't call onend within a reasonable time, start mic anyway
              // This handles cases where TTS might fail silently
              if (autoStartMicTimeoutRef.current) {
                clearTimeout(autoStartMicTimeoutRef.current);
              }
              autoStartMicTimeoutRef.current = setTimeout(() => {
                if (isSpeakingRef.current) {
                  console.log("🎤 [Fallback] TTS timeout - forcing microphone start");
                  autoStartMicrophone();
                }
              }, 8000); // 8 seconds - should be enough for most responses
            } catch (ttsError) {
              console.warn("[TTS Try/Catch]", ttsError);
              isSpeakingRef.current = false;
              // Start mic on error too
              autoStartMicrophone();
            }
          } else {
            console.warn("[TTS] No reply to speak");
          }
          
          // Success - exit retry loop
          messageSubmissionInProgressRef.current = false;
          return;
          
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);
          console.error(`[SendMessage] Attempt ${retryAttempt + 1} failed:`, error);
          
          // Check if it's a network error worth retrying
          if (lastError.includes("Failed to fetch") || lastError.includes("TypeError") || lastError.includes("net::")) {
            if (retryAttempt < maxRetries - 1) {
              const waitTime = Math.pow(2, retryAttempt) * 1000; // Exponential backoff
              console.log(`[SendMessage] Network error, waiting ${waitTime}ms before retry...`);
              await new Promise(r => setTimeout(r, waitTime));
              continue;
            }
          } else {
            // Non-network error, don't retry
            break;
          }
        }
      }
      
      // ALL RETRIES EXHAUSTED - Show error message
      console.error("[SendMessage] All retry attempts failed:", lastError);
      setIsLoading(false);
      
      let userFriendlyError = "Server offline. Please check your internet connection and try again.";
      if (lastError.includes("HTTP")) {
        userFriendlyError = "Server is temporarily unavailable. Please try again in a moment.";
      } else if (lastError.includes("timeout") || lastError.includes("Timeout")) {
        userFriendlyError = "Request timed out. Please try again.";
      }
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: userFriendlyError 
      }]);
    } catch (error) {
      console.error("[SendMessage] Outer catch error:", error);
      setIsLoading(false);
      const errorMsg = error instanceof Error ? error.message : "Connection error";
      const userFriendlyError = "Connection error. Please try again.";
      
      setMessages(prev => [...prev, { role: "assistant", content: userFriendlyError }]);
    } finally {
      // DUPLICATE FIX: Always clear the in-progress flag
      messageSubmissionInProgressRef.current = false;
      console.log("[SendMessage] ✅ Submission complete");
    }
  }, [selectedVoice, isLoading, autoStartMicrophone]);

  // Set ref for voice handler
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      console.warn("🎤 Speech recognition not initialized");
      alert("Speech recognition is not supported on your device or browser. Please try a different browser.");
      return;
    }

    if (isListeningRef.current) {
      console.log("🛑 Stopping microphone");
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.warn("Error stopping recognition:", e);
      }
    } else {
      try {
        console.log("▶️ Starting microphone");
        finalTranscriptRef.current = "";
        setInput("");
        setWaveformData([]);
        
        // For mobile: ensure audio context is ready with user gesture
        if (audioContextRef.current) {
          if (audioContextRef.current.state === 'suspended') {
            console.log("📊 Attempting to resume AudioContext");
            audioContextRef.current.resume().then(() => {
              console.log("✅ AudioContext resumed");
              try {
                recognitionRef.current?.start();
              } catch (e) {
                console.warn("Could not start recognition after resume:", e);
                handleMicrophoneError(e);
              }
            }).catch((e) => {
              console.warn("Could not resume AudioContext, starting recognition anyway:", e);
              try {
                recognitionRef.current?.start();
              } catch (e) {
                console.error("Could not start recognition:", e);
                handleMicrophoneError(e);
              }
            });
          } else {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.warn("Could not start:", e);
              handleMicrophoneError(e);
            }
          }
        } else {
          // No audio context yet, just start recognition
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn("Could not start (no audio context):", e);
            handleMicrophoneError(e);
          }
        }
      } catch (e) {
        console.error("Error in toggleListening:", e);
        handleMicrophoneError(e);
      }
    }
  };

  const handleMicrophoneError = (error: any) => {
    const errorName = error?.name || 'Unknown';
    let message = "Microphone error. Please check your settings and try again.";
    
    if (errorName === 'NotAllowedError') {
      message = "Microphone permission denied. Please allow microphone access in your settings.";
    } else if (errorName === 'NotFoundError') {
      message = "No microphone found on this device.";
    } else if (errorName === 'NotReadableError') {
      message = "Microphone is in use by another app. Please close it and try again.";
    } else if (errorName === 'SecurityError') {
      message = "Security error: Microphone requires HTTPS or localhost.";
    } else if (errorName === 'NetworkError') {
      message = "Network error accessing microphone. Please check your connection.";
    }
    
    console.error("📱 Microphone Error:", { name: errorName, message });
    setMessages(prev => [...prev, { role: "assistant", content: message }]);
    setIsListening(false);
    isListeningRef.current = false;
  };

  const handleSend = useCallback(() => {
    // DUPLICATE FIX: Multiple safety gates
    if (messageSubmissionInProgressRef.current) {
      console.log("[HandleSend] BLOCKED: Already sending");
      return;
    }
    
    if (!input.trim()) {
      console.log("[HandleSend] BLOCKED: Empty input");
      return;
    }
    
    if (isLoading) {
      console.log("[HandleSend] BLOCKED: Loading state");
      return;
    }

    console.log("[HandleSend] ✅ Proceeding - input:", input.substring(0, 20));
    const msg = input.trim();
    setInput(""); // Clear BEFORE calling sendMessage
    sendMessage(msg);
  }, [input, isLoading, sendMessage]);

  return (
    <div
      id="interactive-demo"
      className={cn(
        isMainChat ? "fixed inset-0 z-50 transition-all duration-500" : "w-full relative",
        isOpen && isMainChat
          ? "bg-gradient-to-br from-background via-background to-primary/5"
          : "bg-transparent"
      )}
    >
      {isOpen && (
        <div className={cn(
          "flex flex-col overflow-hidden rounded-2xl md:rounded-3xl",
          isMainChat 
            ? "h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
            : "w-11/12 sm:w-full mx-auto max-w-5xl h-[650px] sm:h-[650px] md:h-[700px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-cyan-500/50 shadow-2xl"
        )}
        style={!isMainChat ? {
          boxShadow: '0 0 40px rgba(34, 211, 238, 0.3), 0 0 20px rgba(6, 182, 212, 0.2), inset 0 0 40px rgba(34, 211, 238, 0.1)'
        } : undefined}
        >
          {/* Header with Personality and Voice controls */}
          <div className="border-b border-cyan-500/30 p-3 sm:p-6 bg-gradient-to-r from-slate-900/40 to-slate-900/20 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                <BzikCharacter mood="happy" size="small" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  Bzik
                </h2>
                <p className="text-xs sm:text-sm text-cyan-300/60">
                  {isListening ? "🎤 Listening..." : "Ready to chat"}
                </p>
              </div>
            </div>

            {/* Personality and Voice Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 w-full sm:w-auto">
              <div className="hidden md:flex items-center gap-3">
                <label className="text-xs sm:text-sm text-white font-medium">Personality:</label>
                <Select defaultValue="Friendly">
                  <SelectTrigger className="w-32 sm:w-40 h-8 sm:h-10 text-xs sm:text-sm bg-slate-800/60 border-cyan-500/30 text-white hover:bg-slate-800/80 hover:border-cyan-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-cyan-500/30">
                    <SelectItem value="Friendly">Friendly</SelectItem>
                    <SelectItem value="Professional">Professional</SelectItem>
                    <SelectItem value="Playful">Playful</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="w-24 sm:w-32 h-8 sm:h-10 text-xs sm:text-sm bg-slate-800/60 border-cyan-500/30 text-white hover:bg-slate-800/80 hover:border-cyan-500/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-cyan-500/30">
                    {BACKEND_VOICES.map(voice => (
                      <SelectItem key={voice} value={voice}>
                        {voice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isMainChat && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-cyan-300 hover:text-cyan-100 transition-colors flex-shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-3 sm:space-y-4 bg-gradient-to-b from-slate-900/40 to-slate-900/20">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-2 sm:gap-4 animate-in fade-in",
                  msg.role === "user" && "flex-row-reverse"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <BzikCharacter mood="happy" size="small" />
                  </div>
                )}
                <div
                  className={cn(
                    "px-4 sm:px-5 py-3 sm:py-3 rounded-lg sm:rounded-xl max-w-xs sm:max-w-2xl text-base sm:text-base",
                    msg.role === "user"
                      ? "bg-gradient-to-r from-cyan-500 to-cyan-400 text-white rounded-br-none sm:rounded-br-none shadow-lg shadow-cyan-500/20"
                      : "bg-slate-800/60 text-white/90 rounded-bl-none border border-cyan-500/30 backdrop-blur-sm"
                  )}
                >
                  <p className="break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <BzikCharacter mood="thinking" size="small" />
                </div>
                <div className="bg-slate-800/60 px-3 sm:px-5 py-2 sm:py-3 rounded-lg sm:rounded-xl rounded-bl-none border border-cyan-500/30 backdrop-blur-sm">
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-cyan-400" />
                </div>
              </div>
            )}

            {/* Demo actions */}
            {mode === "demo" && demoActions.length > 0 && messages.length === 1 && !isLoading && (
              <div className="flex gap-2 sm:gap-3 flex-wrap mt-4 sm:mt-6">
                {demoActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(action.message)}
                    className="px-3 sm:px-4 py-1 sm:py-2 border-2 border-cyan-500/50 rounded-lg hover:border-cyan-400 hover:bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm font-medium transition-all"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Scroll anchor - auto-scroll within chat to latest message */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-cyan-500/30 p-4 sm:p-8 bg-gradient-to-t from-slate-900/60 to-slate-900/40 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1 min-h-[56px] sm:min-h-auto">
                {/* Waveform inside input - professional audio spectrum style */}
                {isListening && waveformData.length > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center gap-0.5 sm:gap-1 pointer-events-none px-3 sm:px-6">
                    {waveformData.map((value, idx) => {
                      // Create a smooth rainbow gradient from red to green
                      const hue = (idx / waveformData.length) * 120; // Red (0) to Green (120)
                      const saturation = 100;
                      const lightness = Math.max(40, 50 + value * 20); // Brighter when louder
                      
                      return (
                        <div
                          key={idx}
                          className="flex-1 transition-all duration-75 ease-out rounded-sm"
                          style={{
                            // Full height bars that scale from center (like professional audio visualizer)
                            height: `${Math.max(4, value * 100)}%`,
                            // Smooth rainbow gradient: Red -> Yellow -> Green
                            background: `linear-gradient(180deg, 
                              hsl(${hue}, ${saturation}%, ${lightness}%) 0%,
                              hsl(${hue}, ${saturation}%, ${Math.max(30, lightness - 15)}%) 100%)`,
                            // Subtle glow that responds to frequency
                            boxShadow: `0 0 ${Math.max(4, value * 16)}px hsl(${hue}, ${saturation}%, ${lightness}%),
                                        inset 0 0 ${Math.max(2, value * 8)}px rgba(255, 255, 255, ${value * 0.3})`,
                            opacity: 0.8 + value * 0.2,
                            minWidth: '2px',
                          }}
                        />
                      );
                    })}
                  </div>
                )}
                
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !isLoading && input.trim()) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  onTouchEnd={(e) => {
                    // Mobile: ensure input stays focused after touch
                    (e.currentTarget as HTMLInputElement).focus();
                  }}
                  placeholder="Ask Bzik anything..."
                  className="w-full bg-slate-800/40 border-2 border-cyan-500/40 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 outline-none focus:border-cyan-400 focus:bg-slate-800/60 text-white placeholder:text-white/40 text-base sm:text-lg relative z-10 transition-all pr-20 sm:pr-16"
                  autoCapitalize="sentences"
                  autoCorrect="on"
                  spellCheck="true"
                />
                <button
                  onClick={toggleListening}
                  className={cn(
                    "absolute right-3 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2 rounded-full transition-all z-20 hover:scale-110",
                    isListening
                      ? "bg-red-500/30 text-red-300 hover:bg-red-500/40"
                      : "text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300"
                  )}
                  title={isListening ? "Stop listening" : "Start listening"}
                >
                  {isListening ? (
                    <MicOff className="w-6 h-6 sm:w-5 sm:h-5" />
                  ) : (
                    <Mic className="w-6 h-6 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
              <button
                onClick={handleSend}
                onTouchStart={(e) => {
                  // Mobile: prevent default touch behavior
                  if (!input.trim() || isLoading) {
                    e.preventDefault();
                  }
                }}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 disabled:opacity-50 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold p-2 sm:p-4 rounded-lg sm:rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 min-h-[40px] sm:min-h-auto flex items-center justify-center active:scale-95"
              >
                <Send className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
