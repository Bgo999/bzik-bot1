import { useState, useEffect } from "react";
import bzikIcon from "@/assets/bzik-icon.png";
import { cn } from "@/lib/utils";

interface BzikCharacterProps {
  className?: string;
  size?: "small" | "medium" | "large";
  interactive?: boolean;
  flying?: boolean;
  mood?: "happy" | "thinking" | "excited" | "greeting";
}

export const BzikCharacter = ({ 
  className, 
  size = "medium",
  interactive = true,
  flying = false,
  mood = "happy"
}: BzikCharacterProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasFlown, setHasFlown] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (flying && !hasFlown) {
      setHasFlown(true);
    }
  }, [flying, hasFlown]);

  useEffect(() => {
    if (isHovered && interactive) {
      const interval = setInterval(() => {
        setParticles(prev => [...prev, {
          id: Date.now(),
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50
        }]);
      }, 300);
      
      return () => clearInterval(interval);
    } else {
      setParticles([]);
    }
  }, [isHovered, interactive]);

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32"
  };

  const getMoodEmoji = () => {
    switch (mood) {
      case "thinking": return "🤔";
      case "excited": return "✨";
      case "greeting": return "👋";
      default: return "😊";
    }
  };

  return (
    <div
      className={cn(
        "relative perspective-1000",
        sizeClasses[size],
        className
      )}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
    >
      {/* Enhanced glow effect with multiple layers */}
      <div className={cn(
        "absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse-glow transition-all duration-500",
        isHovered && "scale-150 bg-primary/50"
      )} />
      <div className={cn(
        "absolute inset-0 bg-secondary/20 rounded-full blur-2xl animate-pulse-glow animation-delay-300",
        isHovered && "scale-125"
      )} />
      
      {/* Floating particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-accent rounded-full pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            '--tx': `${particle.x}px`,
            '--ty': `${particle.y}px`,
            animation: 'particle-float 2s ease-out forwards'
          } as React.CSSProperties}
          onAnimationEnd={() => {
            setParticles(prev => prev.filter(p => p.id !== particle.id));
          }}
        />
      ))}
      
      {/* Corner sparkles */}
      {isHovered && (
        <>
          <div className="absolute -top-2 -right-2 w-2 h-2 bg-accent rounded-full animate-ping" />
          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-secondary rounded-full animate-ping animation-delay-200" />
          <div className="absolute top-1/2 -left-3 w-1.5 h-1.5 bg-primary rounded-full animate-ping animation-delay-300" />
          <div className="absolute top-1/2 -right-3 w-1.5 h-1.5 bg-primary rounded-full animate-ping animation-delay-600" />
        </>
      )}

      {/* Character image with 3D transform */}
      <img
        src={bzikIcon}
        alt="Bzik AI Character"
        loading="lazy"
        className={cn(
          "relative z-10 w-full h-full drop-shadow-2xl transition-all duration-500 transform-3d",
          flying && !hasFlown && "animate-bzik-fly",
          interactive && "animate-float-3d cursor-pointer",
          isHovered && "scale-110 rotate-6"
        )}
      />

      {/* Mood indicator */}
      {isHovered && (
        <div className="absolute -right-8 top-0 text-4xl animate-wave">
          {getMoodEmoji()}
        </div>
      )}
      
      {/* Status ring */}
      {interactive && (
        <div className={cn(
          "absolute inset-0 rounded-full border-2 border-primary/20 transition-all duration-500",
          isHovered && "border-primary/60 scale-110 animate-glow-pulse"
        )} />
      )}
    </div>
  );
};
