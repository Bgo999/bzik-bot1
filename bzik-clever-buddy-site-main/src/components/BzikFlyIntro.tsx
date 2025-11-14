import { useState, useEffect } from "react";
import { BzikCharacter } from "./BzikCharacter";

interface BzikFlyIntroProps {
  onComplete: () => void;
}

export const BzikFlyIntro = ({ onComplete }: BzikFlyIntroProps) => {
  const [stage, setStage] = useState<"fly" | "welcome" | "complete">("fly");

  useEffect(() => {
    // Make intro very fast for testing
    const flyTimer = setTimeout(() => setStage("welcome"), 300);
    const welcomeTimer = setTimeout(() => {
      setStage("complete");
      onComplete();
    }, 600);

    return () => {
      clearTimeout(flyTimer);
      clearTimeout(welcomeTimer);
    };
  }, [onComplete]);

  if (stage === "complete") return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Bzik Fly Animation */}
      {stage === "fly" && (
        <div className="relative">
          <BzikCharacter size="large" flying={true} interactive={false} mood="excited" />
          <h1 className="absolute -bottom-20 left-1/2 -translate-x-1/2 whitespace-nowrap font-heading text-6xl font-bold gradient-text animate-slide-up">
            Bzik Fly
          </h1>
        </div>
      )}

      {/* Welcome Animation */}
      {stage === "welcome" && (
        <div className="text-center space-y-6 animate-fade-in">
          <BzikCharacter size="large" interactive={false} mood="greeting" />
          <div className="space-y-3">
            <h2 className="font-heading text-5xl font-bold gradient-text">
              Welcome
            </h2>
            <p className="font-body text-xl text-muted-foreground">
              Ready to meet your AI companion?
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
