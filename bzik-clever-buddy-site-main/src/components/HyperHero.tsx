import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap } from "lucide-react";
import { BzikCharacter } from "./BzikCharacter";
import { scrollToDemoSection } from "@/lib/scrollUtils";

export const HyperHero = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxDepth = Math.min(scrollY / 3, 300);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden perspective-1000">
      {/* Deep space animated background */}
      <div 
        className="absolute inset-0 transition-all duration-300"
        style={{
          background: `
            radial-gradient(circle at ${50 + scrollY * 0.02}% ${50 - scrollY * 0.01}%, 
              hsl(263 100% 51% / 0.15) 0%, 
              hsl(190 100% 52% / 0.1) 30%,
              hsl(225 58% 4%) 70%)
          `,
        }}
      />
      
      {/* Animated holographic grid */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(190 100% 52% / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(190 100% 52% / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          transform: `perspective(500px) rotateX(60deg) translateZ(-${parallaxDepth}px) scale(2)`,
          transformOrigin: 'center center',
        }}
      />

      {/* Floating light orbs */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-2xl animate-float-3d"
          style={{
            width: `${80 + i * 20}px`,
            height: `${80 + i * 20}px`,
            left: `${(i * 11) % 90}%`,
            top: `${(i * 17) % 80}%`,
            background: [
              'hsl(190 100% 52% / 0.15)',
              'hsl(263 100% 51% / 0.15)',
              'hsl(320 100% 57% / 0.15)'
            ][i % 3],
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${8 + i * 2}s`,
            transform: `translateZ(${-i * 10}px)`,
          }}
        />
      ))}

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content with 3D parallax */}
          <div 
            className="space-y-8 text-center lg:text-left"
            style={{
              transform: `translateZ(${parallaxDepth * 0.3}px) translateY(-${scrollY * 0.2}px)`,
              opacity: Math.max(0, 1 - scrollY * 0.002),
            }}
          >
            <div className="inline-flex items-center gap-2 bg-card/95 px-6 py-3 rounded-full border-2 border-primary/50 glow-primary">
              <Sparkles className="w-5 h-5 text-primary animate-pulse-glow" />
              <span className="text-sm font-medium text-primary">Adaptive AI Consciousness</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
              <span className="block gradient-text animate-shimmer mb-4">
                Bzik Fly
              </span>
              <span className="block text-foreground">
                Into the Future
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-foreground/90 max-w-2xl leading-relaxed">
              Dive into an AI experience that adapts, learns, and evolves with your business
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="group min-w-[200px] text-lg">
                Enter AI Space
                <Zap className="w-6 h-6 ml-2 group-hover:rotate-12 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="min-w-[200px] text-lg border-2 border-primary/50 hover:border-primary/70"
                onClick={() => scrollToDemoSection()}
              >
                Explore Demo
              </Button>
            </div>
          </div>
          
          {/* Bzik Character - 3D floating */}
          <div 
            className="relative flex items-center justify-center min-h-[600px] perspective-1000"
            style={{
              transform: `translateZ(${parallaxDepth * 0.5}px) translateY(-${scrollY * 0.4}px)`,
            }}
          >
            {/* Holographic platform */}
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `rotateX(75deg) translateZ(-100px)`,
              }}
            >
              <div className="w-80 h-80 rounded-full border-2 border-primary/30 glow-primary" />
              <div className="absolute w-64 h-64 rounded-full border-2 border-secondary/20 animate-pulse-glow" />
            </div>

            {/* Bzik Character */}
            <div className="relative z-20">
              <BzikCharacter 
                size="large" 
                flying 
                interactive 
                mood="greeting"
              />
            </div>
            
            {/* Orbital rings */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  animation: `rotate-3d ${15 + i * 5}s linear infinite`,
                  animationDelay: `${i * 2}s`
                }}
              >
                <div 
                  className="w-full h-full max-w-md max-h-md rounded-full border border-primary/20"
                  style={{
                    transform: `rotateY(${i * 60}deg) rotateX(${30 + i * 15}deg)`,
                  }}
                />
              </div>
            ))}

            {/* Energy particles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-accent animate-float-3d"
                style={{
                  left: `${(i * 45) % 100}%`,
                  top: `${(i * 37) % 100}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${4 + i}s`,
                  boxShadow: '0 0 20px hsl(320 100% 57% / 0.8)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Liquid transition to next section */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-40"
        style={{
          background: 'linear-gradient(to bottom, transparent, hsl(225 58% 4%))',
          opacity: Math.min(scrollY / 300, 1),
        }}
      />
    </section>
  );
};
