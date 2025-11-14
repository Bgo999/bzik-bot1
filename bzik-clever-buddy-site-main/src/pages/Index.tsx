import React, { useState, useEffect, Suspense } from "react";
import { BzikFlyIntro } from "@/components/BzikFlyIntro";
import { HyperHero } from "@/components/HyperHero";
import { HowItWorks } from "@/components/HowItWorks";
import { Features } from "@/components/Features";
import { PartnersSection } from "@/components/PartnersSection";
import { CustomVoices } from "@/components/CustomVoices";
import { InteractiveDemo } from "@/components/InteractiveDemo";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";
import { CursorTrail } from "@/components/CursorTrail";
import { ParticleField } from "@/components/ParticleField";
import { ScrollPortal } from "@/components/ScrollPortal";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import LiveChatWidget from "@/components/LiveChatWidget";

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [scrollDepth, setScrollDepth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const depth = Math.min(window.scrollY / 2000, 1);
      setScrollDepth(depth);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Bzik Fly Intro Animation */}
      {showIntro && <BzikFlyIntro onComplete={() => setShowIntro(false)} />}

      {/* Cursor light trail */}
      {!showIntro && <CursorTrail />}

      {/* Scroll indicator dots */}
      {!showIntro && <ScrollIndicator />}

      {/* Live Chat Widget */}
      {!showIntro && <LiveChatWidget />}

      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Dynamic particle field */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <ParticleField scrollDepth={scrollDepth} count={100} />
        </div>

        {/* Hyper Hero - Entry Portal */}
        <div id="hero">
          <HyperHero />
        </div>

        {/* How It Works - Portal 1 */}
        <ScrollPortal portalId="portal-how" color="primary" className="py-24">
          <HowItWorks />
        </ScrollPortal>

        {/* Features - Portal 2 */}
        <ScrollPortal portalId="portal-features" color="secondary" className="py-20">
          <Features />
        </ScrollPortal>

        {/* Partners - Portal 3 */}
        <ScrollPortal portalId="portal-partners" color="accent" className="py-20">
          <PartnersSection />
        </ScrollPortal>

        {/* Custom Voices - Portal 4 */}
        <ScrollPortal portalId="portal-voices" color="primary" className="py-20 scroll-mt-24">
          <CustomVoices />
        </ScrollPortal>

        {/* Interactive Demo - Central Experience */}
        <section id="interactive-demo" className="py-6 sm:py-8 px-3 sm:px-4 pb-12 sm:pb-16 relative scroll-mt-20 md:scroll-mt-24">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-4 sm:mb-6 space-y-2">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text animate-shimmer">
                Experience Bzik's Mind
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                Enter the AI consciousness — interact with Bzik in real-time
              </p>
            </div>
            <div className="flex items-center justify-center px-2 sm:px-0">
              <InteractiveDemo
                mode="demo"
                initialMessage="👋 Hi! I'm Bzik — try the demo below or pick a section to explore."
                demoActions={[
                  { label: "💼 Business Features", message: "Tell me about your business features" },
                  { label: "🤖 AI Capabilities", message: "What can your AI do?" },
                  { label: "🎯 Use Cases", message: "Show me some use cases" }
                ]}
                isMainChat={false}
              />
            </div>
          </div>
        </section>

        {/* Pricing - Portal 5 */}
        <ScrollPortal portalId="portal-pricing" color="secondary" className="py-20">
          <Pricing />
        </ScrollPortal>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default Index;
