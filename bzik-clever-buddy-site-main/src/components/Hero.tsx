import { Button } from "@/components/ui/button";
import { Sparkles, Zap } from "lucide-react";
import { BzikCharacter } from "./BzikCharacter";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden perspective-1000">
      {/* Animated mesh background */}
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 gradient-hero opacity-30 animate-pulse-glow" />
      
      {/* Enhanced grid pattern with glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.1),transparent_70%)]" />
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8 text-center lg:text-left animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-muted/50 backdrop-blur-sm px-4 py-2 rounded-full border border-primary/30 glow-primary hover:border-primary/60 transition-all duration-300">
              <Sparkles className="w-4 h-4 text-primary animate-pulse-glow" />
              <span className="text-sm font-medium text-muted-foreground">AI-Powered Business Assistant</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight transform-3d">
              Meet <span className="gradient-text animate-shimmer">Bzik</span>
              <br />
              <span className="inline-block hover:scale-105 transition-transform duration-300">
                Your Clever Business Buddy
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl">
              AI that knows your products, learns your business, and helps instantly. Transform how you work with intelligent automation.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="group min-w-[180px]">
                Try Bzik Free
                <Zap className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="min-w-[180px]">
                See It in Action
              </Button>
            </div>
            
            <div className="flex items-center gap-8 justify-center lg:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse-glow" />
                <span>Free 14-day trial</span>
              </div>
            </div>
          </div>
          
          {/* Right: Bzik Character - Standalone Animated with 3D effects */}
          <div className="relative flex items-center justify-center min-h-[500px] perspective-1000">
            {/* Animated Bzik Character - flies on page load */}
            <div className="animate-slide-up animation-delay-300">
              <BzikCharacter size="large" flying interactive mood="greeting" />
            </div>
            
            {/* Enhanced floating glow effects with 3D parallax */}
            <div className="absolute top-1/4 -left-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse-glow parallax-slow" />
            <div className="absolute bottom-1/4 -right-8 w-40 h-40 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow animation-delay-200 parallax-fast" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse-glow animation-delay-300" />
            
            {/* Orbiting elements */}
            <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-primary rounded-full animate-rotate-3d" />
            <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-accent rounded-full animate-rotate-3d animation-delay-600" />
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
