import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { scrollToDemoSection } from "@/lib/scrollUtils";

const sections = [
  { id: "hero", label: "Home", description: 'Overview and quick intro' },
  { id: "portal-how", label: "How It Works", description: 'Integration and workflow overview' },
  { id: "portal-features", label: "Features", description: 'Key AI and business features' },
  { id: "portal-partners", label: "Partners", description: 'Partners and integrations' },
  { id: "portal-voices", label: "Voices", description: 'Custom TTS voices and demos' },
  { id: "interactive-demo", label: "Demo", description: 'Hands-on interactive demo' },
  { id: "portal-pricing", label: "Pricing", description: 'Plans and pricing tiers' },
];

export const ScrollIndicator = () => {
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      sections.forEach((section, index) => {
        const element = document.getElementById(section.id);
        if (element) {
          const { top, bottom } = element.getBoundingClientRect();
          const absoluteTop = top + window.scrollY;
          const absoluteBottom = bottom + window.scrollY;
          
          if (scrollPosition >= absoluteTop && scrollPosition <= absoluteBottom) {
            setActiveSection(index);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (index: number) => {
    const element = document.getElementById(sections[index].id);
    if (!element) return;

    // Special handling for demo section to ensure full visibility
    if (sections[index].id === 'interactive-demo') {
      // Calculate position to show the entire demo section with proper padding
      const rect = element.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top;
      const viewportHeight = window.innerHeight;
      const elementHeight = rect.height;

      scrollToDemoSection();
    } else {
      // Standard scroll behavior for other sections with header offset
      const rect = element.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top;
      const topPadding = 80; // room for fixed header/navigation
      const target = Math.max(0, absoluteTop - topPadding);
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  };

  return (
    <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-50 flex-col gap-4">
      {sections.map((section, index) => (
        <button
          key={section.id}
          onClick={() => scrollToSection(index)}
          className="group relative"
          aria-label={`Go to ${section.label}`}
        >
          {/* Dot */}
          <div
            className={cn(
              "w-3 h-3 rounded-full border-2 transition-all duration-300",
              activeSection === index
                ? "bg-primary border-primary scale-150 glow-primary"
                : "bg-transparent border-muted-foreground/50 hover:border-primary hover:scale-125"
            )}
          />
          
          {/* Label on hover */}
          <span className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap bg-card/95 backdrop-blur-sm px-3 py-1 rounded-lg text-sm border border-primary/30 pointer-events-none">
            {section.label}
          </span>
        </button>
      ))}
    </div>
  );
};
