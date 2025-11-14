import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, Sparkles, Briefcase, PartyPopper } from "lucide-react";
import { BzikCharacter } from "./BzikCharacter";

export const CustomVoices = () => {
  const [activeVoice, setActiveVoice] = useState<string | null>(null);
  const [playingSample, setPlayingSample] = useState<string | null>(null);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  };

  const handlePlaySample = (voiceId: string, sample: string) => {
    setPlayingSample(voiceId);
    speakText(sample);
    // Reset playing state after speaking
    setTimeout(() => setPlayingSample(null), 2000);
  };

  const voices = [
    {
      id: "friendly",
      name: "Friendly",
      icon: Sparkles,
      description: "Warm, approachable, and conversational",
      mood: "happy" as const,
      color: "primary",
      sample: "Hey! I'm here to help make your day easier. 😊"
    },
    {
      id: "professional",
      name: "Professional",
      icon: Briefcase,
      description: "Clear, confident, and business-focused",
      mood: "thinking" as const,
      color: "secondary",
      sample: "I'm ready to assist with your business needs efficiently."
    },
    {
      id: "playful",
      name: "Playful",
      icon: PartyPopper,
      description: "Energetic, fun, and engaging",
      mood: "excited" as const,
      color: "accent",
      sample: "Woohoo! Let's make something awesome together! 🎉"
    }
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Choose How <span className="gradient-text">Bzik Speaks</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Customize Bzik's personality to match your brand's voice and style
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {voices.map((voice, index) => {
            const Icon = voice.icon;
            const isActive = activeVoice === voice.id;
            
            return (
              <Card
                key={voice.id}
                className={`
                  relative overflow-hidden border-2 transition-all duration-500
                  cursor-pointer group gradient-card
                  ${isActive 
                    ? 'border-primary' 
                    : 'border-border'
                  }
                `}
                onMouseEnter={() => setActiveVoice(voice.id)}
                onMouseLeave={() => setActiveVoice(null)}
              >
                {/* Holographic shimmer effect */}
                <div className={`
                  absolute inset-0 gradient-holographic opacity-0 transition-opacity duration-500
                  ${isActive ? 'opacity-30' : 'group-hover:opacity-20'}
                `} />
                
                <div className="relative p-8 space-y-6">
                  {/* Icon and Bzik Character */}
                  <div className="flex items-center justify-between">
                    <div className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center transform-3d
                      transition-all duration-500
                      ${isActive ? `bg-${voice.color}/20 glow-${voice.color}` : 'bg-muted'}
                      ${isActive ? 'scale-110 rotate-12' : 'group-hover:scale-110 group-hover:rotate-6'}
                    `}>
                      <Icon className={`w-8 h-8 ${isActive ? `text-${voice.color}` : 'text-muted-foreground'}`} />
                    </div>
                    
                    {isActive && (
                      <div>
                        <BzikCharacter size="small" mood={voice.mood} flying={false} />
                      </div>
                    )}
                  </div>

                  {/* Voice info */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">{voice.name}</h3>
                    <p className="text-muted-foreground">{voice.description}</p>
                  </div>

                  {/* Sample text */}
                  {isActive && (
                    <div className="bg-muted p-4 rounded-lg border border-primary/40 shadow-lg">
                      <p className="text-sm italic text-foreground/90">"{voice.sample}"</p>
                    </div>
                  )}

                  {/* Play button */}
                  {isActive && (
                    <Button
                      variant="default"
                      className="w-full group-hover:scale-105 transition-transform"
                      onClick={() => handlePlaySample(voice.id, voice.sample)}
                      disabled={!!playingSample}
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      {playingSample === voice.id ? "Playing Sample..." : "Play Sample"}
                    </Button>
                  )}
                </div>

                {/* Animated border glow */}
                {isActive && (
                  <div className="absolute inset-0 rounded-lg pointer-events-none" 
                       style={{ border: '2px solid hsl(var(--primary))' }} />
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
