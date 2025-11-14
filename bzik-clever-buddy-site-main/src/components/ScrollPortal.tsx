import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollPortalProps {
  children: ReactNode;
  portalId: string;
  color?: "primary" | "secondary" | "accent";
  className?: string;
}

export const ScrollPortal = ({ 
  children, 
  portalId, 
  color = "primary",
  className 
}: ScrollPortalProps) => {
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const element = document.getElementById(portalId);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate scroll progress for this portal
      const elementTop = rect.top;
      const elementHeight = rect.height;
      
      // Portal becomes active when entering viewport
      if (elementTop < windowHeight && elementTop > -elementHeight) {
        setIsActive(true);
        // Calculate how far through the portal we are (0 to 1)
        const scrollProgress = Math.max(0, Math.min(1, 
          (windowHeight - elementTop) / (windowHeight + elementHeight)
        ));
        setProgress(scrollProgress);
      } else {
        setIsActive(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [portalId]);

  const colorMap = {
    primary: 'hsl(190 100% 52%)',
    secondary: 'hsl(263 100% 51%)',
    accent: 'hsl(320 100% 57%)'
  };

  return (
    <div 
      id={portalId}
      className={cn(
        "relative overflow-hidden transition-all duration-1000",
        className
      )}
      style={{       transform: `scale(${0.98 + progress * 0.02})`,
        opacity: isActive ? 1 : 0.5,
      }}
    >
      {/* Content - clean and readable */}
      <div className="relative z-10">
        {children}
      </div>
      
    </div>
  );
};
