import { useEffect, useState } from "react";

interface Trail {
  x: number;
  y: number;
  id: number;
}

export const CursorTrail = () => {
  const [trails, setTrails] = useState<Trail[]>([]);

  useEffect(() => {
    let animationFrame: number;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newTrail = {
        x: e.clientX,
        y: e.clientY,
        id: Date.now() + Math.random()
      };
      
      setTrails(prev => [...prev.slice(-15), newTrail]);
    };

    const animate = () => {
      setTrails(prev => prev.filter(trail => Date.now() - trail.id < 800));
      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {trails.map((trail, index) => (
        <div
          key={trail.id}
          className="absolute w-2 h-2 rounded-full bg-primary/40 blur-sm"
          style={{
            left: trail.x,
            top: trail.y,
            transform: 'translate(-50%, -50%)',
            opacity: (index / trails.length) * 0.5,
            transition: 'opacity 0.3s ease-out'
          }}
        />
      ))}
    </div>
  );
};
