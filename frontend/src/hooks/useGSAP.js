'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function useGSAPAnimation(animationFn, dependencies = []) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      animationFn(gsap, ScrollTrigger);
    }, ref);

    return () => ctx.revert();
  }, dependencies);

  return ref;
}

export function useFadeIn(options = {}) {
  const {
    delay = 0,
    duration = 1,
    y = 30,
    stagger = 0,
  } = options;

  return useGSAPAnimation((gsap) => {
    gsap.from('.fade-in', {
      opacity: 0,
      y,
      duration,
      delay,
      stagger,
      ease: 'power3.out',
    });
  });
}

export function useScrollReveal(options = {}) {
  const {
    start = 'top 80%',
    end = 'bottom 20%',
    scrub = false,
  } = options;

  return useGSAPAnimation((gsap, ScrollTrigger) => {
    gsap.utils.toArray('.scroll-reveal').forEach((element) => {
      gsap.from(element, {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: {
          trigger: element,
          start,
          end,
          scrub,
          toggleActions: 'play none none reverse',
        },
      });
    });
  });
}

export function useParallax(options = {}) {
  const { speed = 0.5 } = options;

  return useGSAPAnimation((gsap, ScrollTrigger) => {
    gsap.utils.toArray('.parallax').forEach((element) => {
      gsap.to(element, {
        y: () => element.offsetHeight * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });
  });
}

export function useMagneticButton() {
  return useGSAPAnimation((gsap) => {
    const buttons = gsap.utils.toArray('.magnetic-button');

    buttons.forEach((button) => {
      const handleMouseMove = (e) => {
        const { left, top, width, height } = button.getBoundingClientRect();
        const x = (e.clientX - left - width / 2) * 0.3;
        const y = (e.clientY - top - height / 2) * 0.3;

        gsap.to(button, {
          x,
          y,
          duration: 0.3,
          ease: 'power2.out',
        });
      };

      const handleMouseLeave = () => {
        gsap.to(button, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.3)',
        });
      };

      button.addEventListener('mousemove', handleMouseMove);
      button.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        button.removeEventListener('mousemove', handleMouseMove);
        button.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  });
}
