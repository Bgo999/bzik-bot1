import { useState, useEffect } from "react";
import { BzikCharacter } from "./BzikCharacter";
import { X } from "lucide-react";
import { Button } from "./ui/button";

export const WelcomeChatBubble = ({ onOpenChat }: { onOpenChat: () => void }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [message, setMessage] = useState("");

  const fullMessage = "Hi! I'm Bzik 🤖. I can help you with your products, answer questions, or give a demo. What do you want to explore first?";

  useEffect(() => {
    // Show bubble after 2 seconds
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Typing animation
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullMessage.length) {
        setMessage(fullMessage.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-end gap-4 animate-scale-in">
      {/* Chat Bubble */}
      <div className="relative max-w-md">
        <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-2xl gradient-card">
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mb-4">
            {message}
            {isTyping && (
              <span className="inline-block w-1 h-4 ml-1 bg-primary animate-pulse" />
            )}
          </div>

          {!isTyping && (
            <div className="flex gap-2">
              <Button 
                variant="hero" 
                size="sm"
                onClick={onOpenChat}
              >
                Let's Chat!
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                Maybe Later
              </Button>
            </div>
          )}
        </div>

        {/* Triangle pointer */}
        <div className="absolute -right-3 bottom-8 w-0 h-0 border-l-[12px] border-l-primary/20 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent" />
      </div>

      {/* Bzik Character */}
      <BzikCharacter size="medium" />
    </div>
  );
};
