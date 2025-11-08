'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function ScrollIndicator() {
  const indicatorRef = useRef(null);

  useEffect(() => {
    if (!indicatorRef.current) return;

    // Bounce animation
    gsap.to(indicatorRef.current, {
      y: 10,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });

    // Hide on scroll
    const handleScroll = () => {
      if (window.scrollY > 100) {
        gsap.to(indicatorRef.current, {
          opacity: 0,
          duration: 0.3,
        });
      } else {
        gsap.to(indicatorRef.current, {
          opacity: 1,
          duration: 0.3,
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={indicatorRef}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
      onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
    >
      <span className="text-gray-400 text-sm">Scroll to explore</span>
      <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex items-start justify-center p-2">
        <div className="w-1.5 h-1.5 bg-[#4C3BCF] rounded-full" />
      </div>
    </div>
  );
}
