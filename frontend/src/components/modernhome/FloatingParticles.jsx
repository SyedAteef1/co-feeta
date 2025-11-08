'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function FloatingParticles({ count = 20 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const particles = containerRef.current.querySelectorAll('.particle');

    particles.forEach((particle, i) => {
      // Random starting position
      gsap.set(particle, {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        scale: Math.random() * 0.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
      });

      // Floating animation
      gsap.to(particle, {
        x: `+=${Math.random() * 200 - 100}`,
        y: `+=${Math.random() * 200 - 100}`,
        duration: Math.random() * 10 + 10,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.1,
      });

      // Opacity pulse
      gsap.to(particle, {
        opacity: Math.random() * 0.3 + 0.2,
        duration: Math.random() * 3 + 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    });
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="particle absolute w-2 h-2 rounded-full bg-[#4C3BCF]"
          style={{
            filter: 'blur(1px)',
            boxShadow: '0 0 10px rgba(76, 59, 207, 0.5)',
          }}
        />
      ))}
    </div>
  );
}
