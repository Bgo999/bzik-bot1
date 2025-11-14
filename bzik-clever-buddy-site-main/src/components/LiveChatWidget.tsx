import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Minimize2, Send, Mic, MicOff } from "lucide-react";
import { BzikCharacter } from "./BzikCharacter";
import { cn } from "@/lib/utils";
import { scrollToDemoSection } from "@/lib/scrollUtils";

type Message = { role: "assistant" | "user"; content: string };

const LiveChatWidget: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoInput, setDemoInput] = useState("");
  const [demoMessages, setDemoMessages] = useState<Message[]>([
    { role: "assistant", content: "Welcome to the demo! Try asking me a question about business. I'm ready to help! 🚀" },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const lastMessageTimeRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    synthRef.current = window.speechSynthesis || null;
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      const r = new SpeechRecognition();
      r.continuous = false;
      r.interimResults = false;
      r.lang = "en-US";
      r.onstart = () => setIsListening(true);
      r.onend = () => setIsListening(false);
      r.onerror = () => setIsListening(false);
      r.onresult = (ev: any) => {
        // Process only the most recent final result for faster response
        const lastResult = ev.results[ev.results.length - 1];
        if (lastResult && lastResult.isFinal) {
          let transcript = lastResult[0].transcript.trim();
          if (transcript) {
            const text = transcript.toLowerCase();

            // Check for exit phrases
            const endPhrases = ["bye", "goodbye", "see you", "see ya", "shut up", "shush", "stop talking"];
            if (endPhrases.some(p => text.includes(p))) {
              setSessionEnded(true);
              setInput("");
              r.stop();
              speakText("Alright, see you next time 👋");
              return;
            }

            // Command word detection for instant activation
            const commandWords = ['hey bzik', 'bzik', 'listen', 'wake up', 'start listening'];
            let processedTranscript = transcript;
            for (const command of commandWords) {
              if (text.startsWith(command)) {
                processedTranscript = transcript.substring(command.length).trim();
                processedTranscript = processedTranscript.replace(/^[,.\s]+/, '');
                break;
              }
            }

            // Process immediately if there's content
            if (processedTranscript) {
              // Send message directly from voice input without setting input field
              setTimeout(() => sendMessage(processedTranscript, 'voice'), 100);
            }
          }
        }
      };
      recognitionRef.current = r;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, demoMessages]);

  const speakText = (text: string, onEnd?: () => void) => {
    if (!synthRef.current || !text) {
      onEnd?.();
      return;
    }
    synthRef.current.cancel();
    // Stop recognition while AI is speaking to avoid conflicts
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    const voices = synthRef.current.getVoices();
    if (voices.length) u.voice = voices.find((v) => v.lang?.includes("en-US")) || voices[0];
    u.onend = () => {
      // Add a small delay to ensure recognition has fully stopped before restarting
      setTimeout(() => {
        if (!sessionEnded && recognitionRef.current && !isListening) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn('Failed to restart recognition:', e);
          }
        }
      }, 100);
      onEnd?.();
    };
    synthRef.current.speak(u);
  };

  const toggleListening = () => {
    const r = recognitionRef.current;
    if (!r) {
      alert("Speech recognition is not supported in your browser. Please try using a modern browser like Chrome, Firefox, or Edge.");
      return;
    }
    try {
      if (isListening) r.stop();
      else {
        // Check if we need to request microphone permission
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
              // Permission granted, start recognition
              r.start();
            })
            .catch((err) => {
              console.error('Microphone permission denied:', err);
              alert('Microphone access is required for voice input. Please allow microphone access and try again.');
            });
        } else {
          // Fallback for older browsers
          r.start();
        }
      }
    } catch (e) {
      console.warn(e);
      let errorMessage = 'Failed to start speech recognition.';
      if (e.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
      } else if (e.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please check your microphone connection.';
      } else if (e.name === 'NotSupportedError') {
        errorMessage = 'Speech recognition is not supported in this browser.';
      }
      alert(errorMessage);
    }
  };

  const sendMessage = async (message: string, source: 'manual' | 'voice' = 'manual') => {
    if (!message.trim() || isLoading) return;

    // Prevent rapid-fire messages (less than 1 second apart)
    const now = Date.now();
    if (now - lastMessageTimeRef.current < 1000) {
      console.log('Ignoring rapid message:', message);
      return;
    }
    lastMessageTimeRef.current = now;

    const userMessage = message.trim();

    // Prevent duplicate messages from voice input when input field also triggers
    if (source === 'voice') {
      setInput(""); // Clear input for voice messages
    } else if (source === 'manual' && input.trim() !== userMessage) {
      // For manual input, only proceed if the current input matches the message
      return;
    }

    setInput(""); // Clear input for all sources
    setIsLoading(true);
    setMessages((p) => [...p, { role: "user", content: userMessage }]);
    synthRef.current?.cancel();
    try {
      // Use the proxied API endpoint for development, Netlify function for production
      const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
      let endpoint = isProduction ? '/.netlify/functions/chat' : '/api/chat';
      
      let res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, user_id: "live_chat_user" }),
      }).catch(() => null);
      
      // If local fetch failed, try direct Flask connection
      if (!res && !isProduction) {
        endpoint = 'http://localhost:5000/api/chat';
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage, user_id: "live_chat_user" }),
        });
      }
      
      if (!res) {
        throw new Error("No response from server");
      }
      
      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((p) => [...p, { role: "assistant", content: data.reply }]);
        speakText(data.reply);
      } else {
        // Handle different error cases more specifically
        let errorMessage = "Sorry, something went wrong.";
        if (res.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again in a moment.";
        } else if (res.status >= 500) {
          errorMessage = "Server temporarily unavailable. Please try again.";
        } else if (res.status >= 400) {
          errorMessage = "Request error. Please check your input and try again.";
        } else if (!res.ok) {
          errorMessage = `Connection failed (status: ${res.status})`;
        } else {
          errorMessage = "Received incomplete response from server";
        }
        setMessages((p) => [...p, { role: "assistant", content: errorMessage }]);
        setTimeout(() => speakText(errorMessage), 300);
      }
    } catch (err) {
      console.error(err);
      const fallback = "Sorry, I'm having trouble connecting.";
      setMessages((p) => [...p, { role: "assistant", content: fallback }]);
      setTimeout(() => speakText(fallback), 300);
    } finally {
      setIsLoading(false);
    }
  };

  const sendDemoMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    const userMessage = message.trim();
    setDemoInput("");
    setIsLoading(true);
    setDemoMessages((p) => [...p, { role: "user", content: userMessage }]);
    synthRef.current?.cancel();
    try {
      // Use the proxied API endpoint for development, Netlify function for production
      const isProduction = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
      let endpoint = isProduction ? '/.netlify/functions/chat' : '/api/chat';
      
      let res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, user_id: "demo_user_widget" }),
      }).catch(() => null);
      
      // If local fetch failed, try direct Flask connection
      if (!res && !isProduction) {
        endpoint = 'http://localhost:5000/api/chat';
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage, user_id: "demo_user_widget" }),
        });
      }
      
      if (!res) {
        throw new Error("No response from server");
      }
      
      const data = await res.json();
      if (res.ok && data.reply) {
        setDemoMessages((p) => [...p, { role: "assistant", content: data.reply }]);
        setTimeout(() => speakText(data.reply), 300);
      } else {
        // Handle different error cases more specifically
        let errorMessage = "Sorry, something went wrong.";
        if (res.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again in a moment.";
        } else if (res.status >= 500) {
          errorMessage = "Server temporarily unavailable. Please try again.";
        } else if (res.status >= 400) {
          errorMessage = "Request error. Please check your input and try again.";
        } else if (!res.ok) {
          errorMessage = `Connection failed (status: ${res.status})`;
        } else {
          errorMessage = "Received incomplete response from server";
        }
        setDemoMessages((p) => [...p, { role: "assistant", content: errorMessage }]);
        setTimeout(() => speakText(errorMessage), 300);
      }
    } catch (err) {
      console.error(err);
      const fallback = "Sorry, I'm having trouble connecting.";
      setDemoMessages((p) => [...p, { role: "assistant", content: fallback }]);
      setTimeout(() => speakText(fallback), 300);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = () => {
    scrollToDemoSection();
    setShowGreeting(false);
    setMessages([{ role: "assistant", content: "Great choice! Try asking Bzik anything about your business! 🚀" }]);
    setTimeout(() => speakText("Great choice! Try asking Bzik anything about your business!"), 300);
  };

  const handleTourClick = () => {
    setShowGreeting(false);
    setShowTourList(true);
    setTimeout(() => speakText("Let me be your guide! I'll show you the main sections."), 200);
  };

  // Quick list of site sections to offer as a tour from the live chat
  const tourSections = [
    { id: 'hero', label: 'Home', emoji: '🏠', description: 'Overview, main hero and quick intro.', narrator: "Welcome to Bzik's home — here you'll find a quick overview and the main call to action. I'll point out the highlights." },
    { id: 'portal-how', label: 'How It Works', emoji: '⚙️', description: 'Learn how Bzik works and how to integrate it.', narrator: 'This section explains how Bzik processes information and connects to your tools. I can walk you through integration steps.' },
    { id: 'portal-features', label: 'Features', emoji: '✨', description: 'See key features and what Bzik can do for your business.', narrator: 'Here are the key features: conversational AI, custom voices, and integrations. Ask me to expand on any feature.' },
    { id: 'portal-partners', label: 'Partners', emoji: '🤝', description: 'Meet our partners and integrations.', narrator: 'Meet our partners and integrations — these are services that make Bzik more powerful in production.' },
    { id: 'portal-voices', label: 'Custom Voices', emoji: '🎙️', description: 'Try different AI voice personalities and demos.', narrator: 'In Custom Voices you can audition different TTS personalities and choose one that fits your brand.' },
    { id: 'portal-pricing', label: 'Pricing', emoji: '💳', description: 'Review plans and pricing tiers.', narrator: 'Pricing lays out the plans and limits — if you want a recommendation I can suggest the best plan for your use case.' },
    { id: 'interactive-demo', label: 'Demo', emoji: '🎮', description: 'Open the interactive demo with mic and TTS controls.', narrator: 'The demo is a hands-on chat environment where you can try Bzik with mic and voice — enjoy!' },
  ];

  const handleTourSectionClick = (sectionId: string, label?: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      // Compute a precise scroll target so the section top aligns under the
      // top chrome (sticky header). We pick a top padding to account for
      // fixed headers/navigation bars.
      try {
        const rect = el.getBoundingClientRect();
        const absoluteTop = window.scrollY + rect.top;
        const topPadding = 80; // room for top chrome
        const target = Math.max(0, absoluteTop - topPadding);
        window.scrollTo({ top: target, behavior: 'smooth' });
      } catch (err) {
        // Fallback to scrollIntoView if something goes wrong
        try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* ignore */ }
      }
    }
    // If the selected section is the interactive demo, use the demo entry flow
    const sec = tourSections.find((t) => t.id === sectionId);
    const descriptionText = sec?.description ?? '';
    const narratorText = sec?.narrator ?? `${label}${descriptionText ? `. ${descriptionText}` : ''}`;

  // Close the greeting and ensure the live chat shows the assistant narrator message
  setShowGreeting(false);
  // Record which section was selected so we can offer a Back control
  setSelectedSection(sectionId);
  // Hide the plain tour list while viewing a section
  setShowTourList(false);

    // If this is the demo, reuse the demo click handler which also announces and scrolls
    if (sectionId === 'interactive-demo') {
      handleDemoClick();
      return;
    }

    // Add a narrator assistant message to the chat and speak it aloud
    if (narratorText) {
      setMessages((p) => [...p, { role: 'assistant', content: narratorText }] );
      // Keep a slight delay so the message renders before speaking
      setTimeout(() => speakText(narratorText), 180);
    }
  };

  // Selected section state so we can show a Back button and return to tour list
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const [showTourList, setShowTourList] = useState(false);
  const [firstOpen, setFirstOpen] = useState(true);

  const portalContent = (
    <>
      {isOpen && (
        <div className="fixed bottom-10 left-6 z-[9999]">
          <div className={cn(
            "bg-card border-2 border-primary/40 rounded-2xl shadow-2xl transition-all duration-300 backdrop-blur-md",
            isMinimized ? "w-80 h-16" : "w-80 sm:w-96 h-[400px] sm:h-[500px]"
          )}>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-primary/20 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-foreground">Live Chat</h3>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)} className="h-8 w-8 p-0">
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 w-8 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex flex-col h-[340px] sm:h-[440px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {showGreeting ? (
                    <div className="flex gap-3">
                      <BzikCharacter size="small" />
                      <div className="bg-muted/90 border border-primary/30 p-3 rounded-xl max-w-[80%] break-words">
                        <p className="text-sm">👋 Hi! I'm Bzik, your AI guide! Would you like a tour or try the demo?</p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="hero" onClick={handleTourClick}>Take Tour</Button>
                          <Button size="sm" variant="outline" onClick={handleDemoClick}>Try Demo</Button>
                        </div>
                      </div>
                    </div>
                  ) : demoMode ? (
                    demoMessages.map((m, i) => (
                      <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                        {m.role === "assistant" && <BzikCharacter size="small" mood="excited" />}
                        <div className={cn("p-3 rounded-xl max-w-[80%] break-words", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/90 border border-primary/30")}>{m.content}</div>
                      </div>
                    ))
                  ) : (
                    // If there are no messages beyond the initial greeting and the greeting was dismissed,
                    // show a helpful list of site sections the user can jump to for a guided tour.
                    !showGreeting && messages.length <= 1 ? (
                      // Show the plain tour sections list (no two-card intro)
                        <div className="space-y-2">
                          <div className="text-sm text-muted-foreground mb-2">Choose a section to jump to:</div>
                          <div className="grid grid-cols-1 gap-2">
                            {tourSections.map((s) => (
                              <div key={s.id} className="p-2 rounded-md bg-card/50 border border-primary/10">
                                <div className="flex items-start gap-3">
                                  <div className="text-2xl leading-none">{s.emoji}</div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <div className="font-medium text-sm">{s.label}</div>
                                      <Button size="sm" variant="outline" onClick={() => { handleTourSectionClick(s.id, s.label); }} className="ml-2">Go</Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">{s.description}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                    ) : (
                      messages.map((m, i) => (
                        <div key={i} className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                          {m.role === "assistant" && <BzikCharacter size="small" />}
                          <div className={cn("p-3 rounded-xl max-w-[80%] break-words", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/90 border border-primary/30")}>{m.content}</div>
                        </div>
                      ))
                    )
                  )}
                  {/* Back to tour control - shown when a section was selected via tour */}
                  {selectedSection && (
                    <div className="p-2">
                      <Button size="sm" variant="ghost" onClick={() => {
                        // Clear the assistant narrator messages and show the tour list again
                        setSelectedSection(null);
                        setMessages([]);
                        setShowTourList(true);
                        setShowGreeting(false);
                      }}>← Back to tour</Button>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-primary/20 p-4">
                  {demoMode ? (
                    <div className="flex gap-2">
                      <Input value={demoInput} onChange={(e) => setDemoInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendDemoMessage(demoInput)} placeholder="Try asking about business..." />
                      <Button onClick={() => sendDemoMessage(demoInput)} size="sm" variant="hero"><Send className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage(input, 'manual')} placeholder={isListening ? "Listening..." : "Type your message..."} />
                      <Button onClick={toggleListening} variant="outline" size="sm">{isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</Button>
                      <Button onClick={() => sendMessage(input, 'manual')} size="sm" variant="hero"><Send className="w-4 h-4" /></Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isOpen && (
        <div className="fixed bottom-10 left-6 z-[9999]">
          <Button onClick={() => { setIsOpen(true); setFirstOpen(false); setSessionEnded(false); }} aria-label="Open live chat" className="rounded-full w-16 h-16 shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground">
            <MessageCircle className="w-8 h-8" />
          </Button>
        </div>
      )}
    </>
  );

  // return the JSX for this widget (wrapper will portal it)
  return portalContent;
};

// Export a client-only portal wrapper as the default export
const Wrapper: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted) return null;
  return createPortal(<LiveChatWidget />, document.body);
};

export default Wrapper;
