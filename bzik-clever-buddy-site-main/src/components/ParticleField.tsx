import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface ParticleFieldProps {
  count?: number;
  scrollDepth?: number;
}

export const ParticleField = ({ count = 80, scrollDepth = 0 }: ParticleFieldProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setDimensions({ width, height });
      setIsMobile(width < 768); // Mobile breakpoint
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Initialize particles with mobile optimization
    if (particlesRef.current.length === 0) {
      const colors = ['#0EE6FF', '#5A00FF', '#FF00C8'];
      const particleCount = isMobile ? Math.min(count / 3, 25) : count; // Reduce particles on mobile
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * (isMobile ? 0.3 : 0.5), // Slower movement on mobile
        vy: (Math.random() - 0.5) * (isMobile ? 0.3 : 0.5),
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Particle density based on scroll depth
      const density = 1 + scrollDepth * 2;

      particlesRef.current.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx * density;
        particle.y += particle.vy * density;

        // Wrap around screen
        if (particle.x < 0) particle.x = dimensions.width;
        if (particle.x > dimensions.width) particle.x = 0;
        if (particle.y < 0) particle.y = dimensions.height;
        if (particle.y > dimensions.height) particle.y = 0;

        // Draw particle with glow
        ctx.shadowBlur = 10 + scrollDepth * 10;
        ctx.shadowColor = particle.color;
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity * (1 + scrollDepth * 0.5);
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (1 + scrollDepth * 0.3), 0, Math.PI * 2);
        ctx.fill();

        // Draw connections (skip on mobile for performance)
        if (!isMobile) {
          particlesRef.current.slice(i + 1).forEach(otherParticle => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 120) {
              ctx.strokeStyle = particle.color;
              ctx.globalAlpha = (1 - distance / 120) * 0.2 * (1 + scrollDepth * 0.3);
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
            }
          });
        }
      });

      ctx.shadowBlur = 0;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [dimensions, count, scrollDepth, isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
};
