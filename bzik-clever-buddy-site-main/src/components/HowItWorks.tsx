import { useState } from "react";
import { Brain, Zap, MessageCircle } from "lucide-react";
import { BzikCharacter } from "./BzikCharacter";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: Brain,
    title: "Learn",
    description: "Bzik absorbs your product catalog, FAQs, and brand voice in seconds.",
    mood: "thinking" as const,
  },
  {
    icon: Zap,
    title: "Adapt",
    description: "Automatically adjusts tone, style, and responses to match your business personality.",
    mood: "excited" as const,
  },
  {
    icon: MessageCircle,
    title: "Talk",
    description: "Engages customers 24/7 with intelligent, human-like conversations that convert.",
    mood: "happy" as const,
  },
];

export const HowItWorks = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="font-heading text-5xl md:text-6xl font-bold gradient-text">
            How It Works
          </h2>
          <p className="font-body text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform your business communication
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={step.title}
                className={cn(
                  "relative group gradient-card p-8 rounded-2xl transition-all duration-500",
                )}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Animated border */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl border-2 border-primary/20 transition-all duration-500",
                )} />

                {/* Content */}
                <div className="relative z-10 space-y-6">
                  {/* Icon and Bzik */}
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center transition-all duration-500",
                    )}>
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    
                    {isHovered && (
                      <BzikCharacter 
                        size="small" 
                        mood={step.mood}
                        interactive={false}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div className="space-y-3">
                    <h3 className="font-heading text-2xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="font-body text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Step number */}
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <span className="font-heading text-sm font-bold text-secondary">
                      {index + 1}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
