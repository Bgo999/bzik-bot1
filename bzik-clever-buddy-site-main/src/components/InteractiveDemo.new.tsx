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

const voiceModes = [
  { id: "friendly", label: "Friendly", mood: "happy" as const },
  { id: "professional", label: "Professional", mood: "thinking" as const },
  { id: "playful", label: "Playful", mood: "excited" as const },
];

const ttsVoices = [
  { id: "Anna", label: "Anna" },
  { id: "Kate", label: "Kate" },
  { id: "Zoe", label: "Zoe" },
  { id: "Alex", label: "Alex" },
  { id: "Samantha", label: "Samantha" },
];

export const InteractiveDemo = React.memo(() => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I'm Bzik. Ask me anything about your business!" }
  ]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setInput(""); // Clear input
    setIsLoading(true);

    // Stop any current speech
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    // Add user message immediately
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      // Use Netlify functions endpoint
      let endpoint = '/.netlify/functions/chat';
      
      // Try local backend if available during development
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
          const testController = new AbortController();
          const testTimeoutId = setTimeout(() => testController.abort(), 2000);
          const testResponse = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: '' }),
            signal: testController.signal
          });
          clearTimeout(testTimeoutId);
          if (testResponse.ok) {
            endpoint = 'http://localhost:5000/chat';
          }
        } catch (e) {
          // Use Netlify functions fallback
          endpoint = '/.netlify/functions/chat';
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, user_id: 'demo_user', voice: aiVoice })
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      speakText(data.reply);
    } catch (error) {
      console.error('Error:', error);
      const fallback = "Hey, I'm having a bit of trouble right now, but I'm here. Let's try again.";
      setMessages(prev => [...prev, { role: "assistant", content: fallback }]);
      speakText(fallback);
    } finally {
      setIsLoading(false);
    }
  };
  const [input, setInput] = useState("");
  const [voice, setVoice] = useState("friendly");
  const [aiVoice, setAiVoice] = useState("friendly");
  const [ttsVoice, setTtsVoice] = useState("Anna");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [alwaysListening, setAlwaysListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Function to handle text-to-speech
  const speakText = useCallback((text: string) => {
    if (synthRef.current && text) {
      // Cancel any current speech
      synthRef.current.cancel();

      // Stop mic while speaking to prevent feedback
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      // Use the selected TTS voice
      const voices = synthRef.current.getVoices();
      let selectedVoice = voices.find(voice =>
        voice.name.toLowerCase().includes(ttsVoice.toLowerCase()) ||
        voice.name.toLowerCase().includes(ttsVoice.toLowerCase().split(' ')[0])
      );

      // Fallback to a suitable voice if the exact match isn't found
      if (!selectedVoice) {
        selectedVoice = voices.find(voice =>
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('karen') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('alex')
        ) || voices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => {
        console.log('TTS utterance.onend fired');

        // Restart microphone after speech ends with a small delay
        if (recognitionRef.current && alwaysListening) {
          console.log('🎙️ Restarting mic after speech...');
          try {
            setTimeout(() => {
              if (!isListening) {
                recognitionRef.current.start();
                setIsListening(true);
              }
            }, 150);
          } catch (error) {
            console.error('❌ Failed to restart mic:', error);
          }
        }
      };

      synthRef.current.speak(utterance);
    }
  }, [isListening, ttsVoice, alwaysListening]);

  const handleVoiceChange = (newVoice: string) => {
    setTtsVoice(newVoice);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 800);
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const currentMood = voiceModes.find(v => v.id === aiVoice)?.mood || "happy";

  // Auto-scroll function
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const scrollOptions = {
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth' as ScrollBehavior
      };
      chatContainerRef.current.scrollTo(scrollOptions);
    }
  }, []);

  useEffect(() => {
    // Scroll when messages change
    scrollToBottom();
    
    // Scroll again after a short delay to ensure all content is loaded
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages, scrollToBottom]);

  // ... rest of your component code ...

  return (
    <div 
      id="interactive-demo"
      className="relative bg-card/95 backdrop-blur-md border-2 border-primary/40 rounded-3xl overflow-hidden shadow-holographic"
      style={{
        transform: `scale(${0.95 + scrollDepth * 0.05})`,
        boxShadow: `0 0 ${40 + scrollDepth * 60}px hsl(190 100% 52% / ${0.2 + scrollDepth * 0.3})`
      }}
    >
      <div className="absolute inset-0 gradient-holographic opacity-5 pointer-events-none" />
      
      <div className="relative z-10 p-6 border-b border-primary/20 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Personality:</span>
            <Select value={aiVoice} onValueChange={setAiVoice}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voiceModes.map(voiceMode => (
                  <SelectItem key={voiceMode.id} value={voiceMode.id}>
                    {voiceMode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            <Select value={ttsVoice} onValueChange={handleVoiceChange}>
              <SelectTrigger
                className={cn(
                  "w-32 transition-all duration-300",
                  isAnimating && "animate-bounce bg-blue-100 border-blue-300 text-blue-800 shadow-blue-200"
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ttsVoices.map(voiceOption => (
                  <SelectItem key={voiceOption.id} value={voiceOption.id}>
                    {voiceOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div 
        ref={chatContainerRef}
        className="relative z-10 p-6 md:p-8 space-y-4 md:space-y-6 h-[300px] md:h-[500px] overflow-y-auto messages-container scroll-smooth"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={cn(
              "flex gap-4 animate-slide-up",
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 mt-2">
                <BzikCharacter 
                  size="small" 
                  interactive={false} 
                  mood={currentMood}
                />
              </div>
            )}
            <div 
              className={cn(
                "max-w-[70%] p-5 rounded-2xl transition-all duration-500",
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-muted/90 border border-primary/30 text-foreground'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 animate-slide-up">
            <BzikCharacter size="small" interactive={false} mood="thinking" />
            <div className="bg-muted/90 border border-primary/30 p-5 rounded-2xl">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse animation-delay-200" />
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse animation-delay-300" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="relative z-10 border-t border-primary/20 p-6 bg-card/80 backdrop-blur-sm">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Ask Bzik anything..."}
            className={cn(
              "flex-1 bg-muted/50 border-2 border-primary/30 rounded-2xl px-6 py-4 focus:outline-none focus:border-primary glow-primary transition-all text-lg",
              isListening && "border-blue-500 glow-blue-500 ring-4 ring-blue-400/20"
            )}
          />
          <Button
            onClick={toggleListening}
            variant="outline"
            size="lg"
            className={cn(
              "px-4 transition-colors",
              isListening && "bg-red-500 hover:bg-red-600 border-red-500 text-white"
            )}
            title={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 animate-pulse" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
          <Button
            onClick={handleSend}
            variant="hero"
            size="lg"
            className="px-8"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
});