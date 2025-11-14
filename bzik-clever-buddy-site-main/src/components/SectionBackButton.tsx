import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionBackButtonProps {
  isVisible: boolean;
  onBack: () => void;
  sectionLabel?: string;
}

export const SectionBackButton: React.FC<SectionBackButtonProps> = ({
  isVisible,
  onBack,
  sectionLabel
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed top-24 left-6 z-[9998] transition-all duration-300",
      isAnimating ? "animate-in slide-in-from-left-4" : ""
    )}>
      <Button
        onClick={onBack}
        variant="outline"
        size="sm"
        className="bg-background/95 backdrop-blur-md border-primary/40 shadow-lg hover:bg-primary/10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Tour{sectionLabel ? ` (${sectionLabel})` : ''}
      </Button>
    </div>
  );
};
