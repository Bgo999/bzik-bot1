import { Facebook, Twitter, Linkedin, Instagram, Mail } from "lucide-react";
import { BzikCharacter } from "./BzikCharacter";
import { useState } from "react";

export const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter subscription logic
    setEmail("");
  };

  return (
    <footer className="relative border-t border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden py-16 px-4">
      {/* Top glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      {/* Background glow */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Bzik Character */}
          <div className="flex flex-col items-center md:items-start space-y-6">
            <BzikCharacter size="medium" mood="greeting" />
            <p className="font-body text-sm text-muted-foreground text-center md:text-left">
              Your clever AI business companion
            </p>
          </div>
          
          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">Resources</h3>
            <ul className="space-y-3 font-body text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">Documentation</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">API Reference</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">Tutorials</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">Case Studies</a></li>
            </ul>
          </div>
          
          {/* Company */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">Company</h3>
            <ul className="space-y-3 font-body text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">About Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1 inline-block">Contact</a></li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-foreground">Stay Updated</h3>
            <p className="font-body text-sm text-muted-foreground">
              Get the latest AI insights and Bzik updates
            </p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2 bg-background/50 border border-primary/20 rounded-lg text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-body text-sm font-medium hover:bg-primary/90 transition-all duration-300 hover:scale-105 glow-primary"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-primary/10 mt-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="font-body text-sm text-muted-foreground">
            © 2025 Bzik AI Labs. All rights reserved.
          </p>
          
          {/* Social Links with enhanced glow */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(14,230,255,0.5)] group relative"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5 relative z-10" />
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(14,230,255,0.5)] group relative"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5 relative z-10" />
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(14,230,255,0.5)] group relative"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5 relative z-10" />
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a
              href="#"
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(14,230,255,0.5)] group relative"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5 relative z-10" />
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
