  'use client';

  import { useState, useEffect, useRef } from 'react';
  import Image from 'next/image';
  import { useRouter } from 'next/navigation';
  import { gsap } from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';
  import SmartDelegationVisual from '@/components/modernhome/SmartDelegationVisual';
  import { DottedSurface } from '@/components/ui/dotted-surface';

  gsap.registerPlugin(ScrollTrigger);

  function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="bg-gradient-to-br from-[#4C3BCF]/10 via-black/50 to-black/50 border border-gray-800/30 rounded-2xl overflow-hidden backdrop-blur-sm">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-900/10 transition-colors"
        >
          <span className="text-lg font-medium text-white">{question}</span>
          <svg
            className={`w-5 h-5 text-white transition-transform duration-300 flex-shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isOpen && (
          <div className="px-6 pb-6 text-left">
            <p className="text-gray-400 leading-relaxed text-left">{answer}</p>
          </div>
        )}
      </div>
    );
  }

  export default function ModernHome() {
    const router = useRouter();
    const [currentCase, setCurrentCase] = useState(0);
    const [typedText, setTypedText] = useState('');
    const [showOutput, setShowOutput] = useState(false);
    const [visibleItems, setVisibleItems] = useState(0);
    const [activeFeature, setActiveFeature] = useState(null);
    const [contextualPhase, setContextualPhase] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    
    // Refs for scroll animations
    const heroRef = useRef(null);
    const trustRef = useRef(null);
    const servicesRef = useRef(null);
    const visibilityRef = useRef(null);
    const delegationRef = useRef(null);
    const guidanceRef = useRef(null);

    const benefitsRef = useRef(null);
    const faqRef = useRef(null);
    const ctaRef = useRef(null);

    // Scroll to services section
    const scrollToServices = () => {
      servicesRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Navigate to demo page
    const navigateToDemo = () => {
      setIsNavigating(true);
      setTimeout(() => {
        router.push('/book-demo');
      }, 500);
    };

    const useCases = [
      {
        input: 'Integrate Stripe payment gateway and launch product today',
        output: [
          { text: 'Setup Stripe API integration', assignees: ['Syed Ateef'], deadline: 'Dec 20' },
          { text: 'Design payment UI mockups', assignees: ['Syed Suhail'], deadline: 'Dec 21' },
          { text: 'Build payment frontend', assignees: ['Md Tousif'], deadline: 'Dec 22' },
          { text: 'Test payment flow', assignees: ['Kasim'], deadline: 'Dec 23' }
        ]
      },
      {
        input: 'Build user dashboard with analytics',
        output: [
          { text: 'Design dashboard UI', assignees: ['Syed Suhail'], deadline: 'Dec 18' },
          { text: 'Build dashboard components', assignees: ['Md Tousif'], deadline: 'Dec 20' },
          { text: 'Create analytics API', assignees: ['Syed Ateef'], deadline: 'Dec 21' },
          { text: 'Test dashboard features', assignees: ['Kasim'], deadline: 'Dec 22' }
        ]
      },
      {
        input: 'Fix bugs and improve performance',
        output: [
          { text: 'Optimize database queries', assignees: ['Syed Ateef'], deadline: 'Dec 19' },
          { text: 'Fix UI rendering issues', assignees: ['Md Tousif'], deadline: 'Dec 20' },
          { text: 'Run performance tests', assignees: ['Kasim'], deadline: 'Dec 21' },
          { text: 'Update design system', assignees: ['Syed Suhail'], deadline: 'Dec 22' }
        ]
      }
    ];

    useEffect(() => {
      let typingInterval;
      let outputTimeout;
      let itemIntervals = [];
      let cycleTimeout;
      
      const startTyping = () => {
        const currentText = useCases[currentCase].input;
        let charIndex = 0;
        
        setTypedText('');
        setShowOutput(false);
        setVisibleItems(0);
        
        typingInterval = setInterval(() => {
          if (charIndex < currentText.length) {
            setTypedText(currentText.slice(0, charIndex + 1));
            charIndex++;
          } else {
            clearInterval(typingInterval);
            outputTimeout = setTimeout(() => {
              setShowOutput(true);
              
              useCases[currentCase].output.forEach((_, idx) => {
                const itemTimeout = setTimeout(() => {
                  setVisibleItems(idx + 1);
                }, idx * 600);
                itemIntervals.push(itemTimeout);
              });
              
              const totalAnimationTime = useCases[currentCase].output.length * 600 + 3000;
              cycleTimeout = setTimeout(() => {
                setCurrentCase((prev) => (prev + 1) % useCases.length);
              }, totalAnimationTime);
            }, 500);
          }
        }, 50);
      };

      startTyping();

      return () => {
        clearInterval(typingInterval);
        clearTimeout(outputTimeout);
        clearTimeout(cycleTimeout);
        itemIntervals.forEach(clearTimeout);
      };
    }, [currentCase]);

    // GSAP Scroll Animations - Unified fade-up animation
    useEffect(() => {
      // Universal animation function
      const animateElements = (elements, trigger) => {
        if (elements) {
          gsap.fromTo(elements, 
            { opacity: 0, y: 50 },
            { 
              opacity: 1, 
              y: 0, 
              duration: 0.8, 
              stagger: 0.2,
              ease: "power2.out",
              scrollTrigger: {
                trigger: trigger,
                start: "top 80%",
                toggleActions: "play none none reverse"
              }
            }
          );
        }
      };

      // Apply same animation to all sections
      animateElements(heroRef.current?.children, heroRef.current);
      animateElements(trustRef.current?.children, trustRef.current);
      animateElements(servicesRef.current?.querySelectorAll('.animate-on-scroll'), servicesRef.current);
      animateElements(visibilityRef.current?.querySelectorAll('.animate-on-scroll'), visibilityRef.current);
      animateElements(delegationRef.current?.querySelectorAll('.animate-on-scroll'), delegationRef.current);
      animateElements([guidanceRef.current?.querySelector('.guidance-content'), guidanceRef.current?.querySelector('.guidance-visual')], guidanceRef.current);

      animateElements(benefitsRef.current?.querySelectorAll('.benefit-card'), benefitsRef.current);
      animateElements(faqRef.current?.querySelectorAll('.faq-item'), faqRef.current);
      animateElements(ctaRef.current?.children, ctaRef.current);

      // Specific animations for visual elements in "What Feeta Delivers" sections
      
      // Services Section - Window interface elements
      const servicesWindow = servicesRef.current?.querySelector('.bg-gradient-to-br.from-gray-900.to-black');
      if (servicesWindow) {
        gsap.fromTo(servicesWindow.querySelectorAll('.w-2\\.5.h-2\\.5'), 
          { scale: 0, opacity: 0 },
          { 
            scale: 1, 
            opacity: 1, 
            duration: 0.5, 
            stagger: 0.1,
            scrollTrigger: {
              trigger: servicesRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse"
            }
          }
        );
        
        gsap.fromTo(servicesWindow.querySelectorAll('.bg-gray-800\\/40'), 
          { opacity: 0, x: -20 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.6, 
            stagger: 0.1,
            delay: 0.3,
            scrollTrigger: {
              trigger: servicesRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Visibility Section - Dashboard elements
      const visibilitySection = visibilityRef.current;
      if (visibilitySection) {
        // Animate the entire visual container first
        gsap.fromTo(visibilitySection.querySelector('.w-full.h-\\[400px\\]'), 
          { opacity: 0, scale: 0.95 },
          { 
            opacity: 1, 
            scale: 1, 
            duration: 0.8,
            scrollTrigger: {
              trigger: visibilityRef.current,
              start: "top 75%",
              toggleActions: "play none none reverse"
            }
          }
        );
        
        // Animate window controls
        gsap.fromTo(visibilitySection.querySelectorAll('.w-2\\.5.h-2\\.5.rounded-full'), 
          { scale: 0, opacity: 0 },
          { 
            scale: 1, 
            opacity: 1, 
            duration: 0.4, 
            stagger: 0.1,
            delay: 0.3,
            scrollTrigger: {
              trigger: visibilityRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse"
            }
          }
        );
        
        // Animate AI summary card
        gsap.fromTo(visibilitySection.querySelectorAll('[class*="bg-[#4C3BCF]/10"]'), 
          { opacity: 0, y: -20 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.6,
            delay: 0.5,
            scrollTrigger: {
              trigger: visibilityRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse"
            }
          }
        );
        
        // Animate status cards
        gsap.fromTo(visibilitySection.querySelectorAll('[class*="bg-green-500/10"], [class*="bg-blue-500/10"], [class*="bg-red-500/10"]'), 
          { opacity: 0, x: -30 },
          { 
            opacity: 1, 
            x: 0, 
            duration: 0.5, 
            stagger: 0.15,
            delay: 0.8,
            scrollTrigger: {
              trigger: visibilityRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Delegation Section - SmartDelegationVisual elements
      const delegationVisual = delegationRef.current?.querySelector('.animate-on-scroll');
      if (delegationVisual) {
        gsap.fromTo(delegationVisual.querySelectorAll('div'), 
          { opacity: 0, scale: 0.9 },
          { 
            opacity: 1, 
            scale: 1, 
            duration: 0.6, 
            stagger: 0.1,
            delay: 0.3,
            scrollTrigger: {
              trigger: delegationRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Guidance Section - Chat interface elements
      const guidanceChat = guidanceRef.current?.querySelector('.guidance-visual');
      if (guidanceChat) {
        gsap.fromTo(guidanceChat.querySelectorAll('.bg-red-500\\/10, .bg-\\[\\#4C3BCF\\]\\/10, .bg-green-500\\/10, .bg-gray-900\\/60'), 
          { opacity: 0, y: 15 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.5, 
            stagger: 0.2,
            delay: 0.5,
            scrollTrigger: {
              trigger: guidanceRef.current,
              start: "top 70%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }

      // Cleanup
      return () => {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      };
    }, []);

    // Contextual Support Animation Loop
    useEffect(() => {
      const contextualLoop = () => {
        setContextualPhase(0); // Show question
        setTimeout(() => setContextualPhase(1), 2000); // Show thinking
        setTimeout(() => setContextualPhase(2), 4000); // Show response
        setTimeout(() => setContextualPhase(3), 7000); // Show solution
        setTimeout(() => setContextualPhase(4), 10000); // Show code
      };

      contextualLoop();
      const interval = setInterval(contextualLoop, 12000);
      
      return () => clearInterval(interval);
    }, []);

    return (
      <>
        <style jsx global>{`
          @font-face {
            font-family: 'CustomFont';
            src: url('/fonts/_Xms-HUzqDCFdgfMm4S9DQ.woff2') format('woff2');
            font-weight: 400;
            font-style: normal;
          }
          @font-face {
            font-family: 'CustomFont';
            src: url('/fonts/vQyevYAyHtARFwPqUzQGpnDs.woff2') format('woff2');
            font-weight: 600;
            font-style: normal;
          }
          @font-face {
            font-family: 'CustomFont';
            src: url('/fonts/7AHDUZ4A7LFLVFUIFSARGIWCRQJHISQP.woff2') format('woff2');
            font-weight: 900;
            font-style: normal;
          }
          body {
            font-family: 'CustomFont', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          h1, h2, h3, h4, h5, h6 {
            font-weight: 900 !important;
            line-height: 1.15 !important;
            letter-spacing: -0.02em !important;
          }
          a, button {
            outline: none !important;
          }
          a:focus, button:focus {
            outline: none !important;
            box-shadow: none !important;
          }
          @keyframes moveToCenter {
            0% { opacity: 0; }
            20% { opacity: 0.6; }
            80% { opacity: 0.6; }
            100% { transform: translateX(calc(50vw - 50%)); opacity: 0; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(76, 59, 207, 0.3); }
            50% { box-shadow: 0 0 40px rgba(76, 59, 207, 0.6); }
          }
          
          .floating-element {
            animation: float 3s ease-in-out infinite;
          }
          
          .glow-effect {
            animation: glow 2s ease-in-out infinite;
          }
          
          .parallax-slow {
            will-change: transform;
          }
          
          .parallax-fast {
            will-change: transform;
          }
          
          /* Smooth scrolling for better animation experience */
          html {
            scroll-behavior: smooth;
          }
          
          /* Enhanced hover effects */
          .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .hover-lift:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }
          
          /* Custom scrollbar for better UX */
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          
          /* Mobile First Media Queries */
          @media (max-width: 768px) {
            .mobile-nav {
              position: fixed;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100vh;
              background: rgba(0, 0, 0, 0.95);
              backdrop-filter: blur(10px);
              transition: left 0.3s ease;
              z-index: 50;
            }
            .mobile-nav.open {
              left: 0;
            }
          }
          
          @media (max-width: 640px) {
            .benefits-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            .benefit-card {
              padding: 1rem;
            }
            .benefit-title {
              font-size: 1rem;
              line-height: 1.3;
            }
            .benefit-text {
              font-size: 0.75rem;
              line-height: 1.4;
            }
            .cta-section {
              padding: 1.5rem;
              margin-top: 2rem;
              margin-bottom: 2rem;
            }
            .cta-title {
              font-size: 1.5rem;
              line-height: 1.2;
            }
            .cta-text {
              font-size: 0.875rem;
            }
            .footer-content {
              flex-direction: column;
              text-align: center;
              gap: 2rem;
            }
          }
        `}</style>
      <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: 'CustomFont, sans-serif' }}>

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between md:justify-between px-4 sm:px-8 lg:px-20 py-6">
          <div className="flex items-center gap-3 mx-auto md:mx-0">
            <Image src="/Images/F2.png" alt="Feeta Logo" width={32} height={32} className="rounded-md" />
            <div className="text-2xl font-extrabold">Feeta AI</div>
          </div>
          <div className="hidden md:flex items-center gap-4 lg:gap-8">
            <a href="#" className="hover:text-[#4C3BCF] transition-colors focus:outline-none">Home</a>
            <a href="#" className="hover:text-[#4C3BCF] transition-colors focus:outline-none">About</a>
            <a href="#" className="hover:text-[#4C3BCF] transition-colors focus:outline-none">Blog</a>
            <a href="#" className="hover:text-[#4C3BCF] transition-colors focus:outline-none">Contact</a>
            <button 
              onClick={() => router.push('/login')} 
              className="bg-transparent border border-gray-700 hover:border-[#4C3BCF] px-6 py-2 rounded-lg transition-colors focus:outline-none hover:text-[#4C3BCF]"
            >
              Login
            </button>
            <button onClick={navigateToDemo} className="bg-[#4C3BCF] hover:bg-[#4C3BCF]/80 px-6 py-2 rounded-lg transition-colors focus:outline-none">
              Book a call
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <main ref={heroRef} className="relative flex flex-col items-center justify-center text-center px-4 sm:px-8 mt-10 sm:mt-20 pb-16 sm:pb-32 overflow-hidden">
          <DottedSurface />

          {/* Purple Glow Effect - Hero Only */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[150px] parallax-slow" style={{ backgroundColor: 'rgba(0, 11, 88, 0.3)' }} />

          <div className="relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#4C3BCF]/20 border border-[#4C3BCF]/30 rounded-full px-4 py-1.5 mb-8">
            <span className="bg-[#4C3BCF] text-white text-xs font-semibold -ml-3.5 px-6 -my-1.5 py-1.5 rounded-full">New</span>
            <span className="text-sm">The AI Operational Co-Pilot</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-5xl mb-6">
            Your Team’s Execution, On Autopilot
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-3xl mb-10 text-center mx-auto">
          From founders to product managers, Feeta turns intent into clear tasks, smart delegation, and real-time progress—without meetings, micromanagement, or chaos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={navigateToDemo}
              className="bg-[#4C3BCF] hover:bg-[#4C3BCF]/80 px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 text-sm floating-element hover:scale-105 hover:shadow-lg hover:shadow-[#4C3BCF]/30"
            >
              Get in touch
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </button>
            <button 
              onClick={scrollToServices}
              className="bg-[#0a0a0a] border border-gray-700 hover:border-gray-600 px-5 py-2 rounded-lg font-medium transition-all duration-300 text-sm floating-element hover:scale-105"
            >
              View services
            </button>
          </div>
          </div>
        </main>

        {/* Trust Section */}
        <section ref={trustRef} className="relative z-10 mt-16 sm:mt-32 px-4 sm:px-8">
          <p className="text-center text-gray-400 text-lg mb-12 font-medium">Integrate tools like</p>
          <div className="relative overflow-hidden max-w-6xl mx-auto">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
            <div className="flex animate-scroll gap-8">
              <div className="flex items-center gap-3 flex-shrink-0 px-6 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <Image src="/Images/slack.png" alt="Slack" width={32} height={32} className="object-contain" />
                <span className="text-white font-medium">Slack</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 px-6 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <Image src="/Images/jira.png" alt="Jira" width={32} height={32} className="object-contain" />
                <span className="text-white font-medium">Jira</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 px-6 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <Image src="/Images/asana.png" alt="Asana" width={32} height={32} className="object-contain" />
                <span className="text-white font-medium">Asana</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 px-6 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <Image src="/Images/github.png" alt="GitHub" width={32} height={32} className="object-contain" />
                <span className="text-white font-medium">GitHub</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 px-6 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <Image src="/Images/google-calendar.png" alt="Calendar" width={32} height={32} className="object-contain" />
                <span className="text-white font-medium">Calendar</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 px-6 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <Image src="/Images/slack.png" alt="Slack" width={32} height={32} className="object-contain" />
                <span className="text-white font-medium">Slack</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 px-6 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <Image src="/Images/jira.png" alt="Jira" width={32} height={32} className="object-contain" />
                <span className="text-white font-medium">Jira</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 px-6 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <Image src="/Images/asana.png" alt="Asana" width={32} height={32} className="object-contain" />
                <span className="text-white font-medium">Asana</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 px-6 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <Image src="/Images/github.png" alt="GitHub" width={32} height={32} className="object-contain" />
                <span className="text-white font-medium">GitHub</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 px-6 py-3 bg-gray-900/50 rounded-lg border border-gray-800">
                <Image src="/Images/google-calendar.png" alt="Calendar" width={32} height={32} className="object-contain" />
                <span className="text-white font-medium">Calendar</span>
              </div>
            </div>
          </div>
        </section>

        {/* Our Services Section */}
        <section ref={servicesRef} className="relative z-10 mt-16 sm:mt-32 px-4 sm:px-8">
          <div className="text-center mb-12 animate-on-scroll">
            <span className="inline-block bg-[#0a0a0a] border border-gray-700 px-5 py-2 rounded-lg text-sm text-white">What Feeta Delivers</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center max-w-4xl mx-auto mb-6 animate-on-scroll">
            AI Operational Co-Pilot: Stop<br />
            Managing Tasks, Start Leading.
          </h2>
          
          <p className="text-center text-gray-400 text-base sm:text-lg max-w-3xl mx-auto mb-10 sm:mb-20 animate-on-scroll">
          Feeta bridges the gap between intent and execution—helping founders, managers, and teams clarify tasks, automate delegation, and stay aligned without friction.
          </p>

          {/* Feature Card */}
          <div className="max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center animate-on-scroll">
            {/* Left Side - Outer Container */}
            <div className="w-full h-[300px] sm:h-[400px] border border-gray-800 rounded-2xl bg-black/20 p-4 sm:p-6 flex items-start justify-center overflow-hidden order-2 lg:order-1">
              {/* Window Interface with Fade */}
              <div className="relative w-full max-w-sm">
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden">
                {/* Window Header */}
                <div className="bg-gray-900/80 border-b border-gray-800 px-3 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs text-gray-400 ml-2">Feeta AI</span>
                </div>

                {/* Window Content */}
                <div className="p-5">
                  {/* Input Box Inside Window */}
                  <div className="bg-gray-800/60 rounded-2xl p-3 border border-gray-700/50 mb-4">
                    <p className="text-sm text-white min-h-[20px]">
                      {typedText}
                      {typedText && <span className="inline-block w-0.5 h-4 bg-[#4C3BCF] ml-1 animate-pulse" />}
                    </p>
                  </div>

                  {/* AI Processing */}
                  {!showOutput && typedText.length === useCases[currentCase].input.length && (
                    <div className="flex items-center justify-center my-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#4C3BCF] rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-[#4C3BCF] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-[#4C3BCF] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  )}

                  {/* Task List - Matching Reference Image */}
                  {showOutput && (
                    <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden scrollbar-hide">
                      {useCases[currentCase].output.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`transition-all duration-500 ${idx < visibleItems ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        >
                          <div className="bg-gray-800/40 rounded-xl px-3 py-2.5 border border-gray-700/30 flex items-center justify-between group hover:bg-gray-800/60 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-7 h-7 bg-gray-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white font-medium">{item.text}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {item.assignees.map((assignee, aIdx) => (
                                    <span key={aIdx} className="text-xs text-gray-500">
                                      {assignee}{aIdx < item.assignees.length - 1 ? ',' : ''}
                                    </span>
                                  ))}
                                  {item.deadline && (
                                    <span className="text-xs text-[#4C3BCF] ml-1">• {item.deadline}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="w-4 h-4 rounded border-2 border-gray-600 flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </div>
                {/* Bottom Fade Effect */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none rounded-b-2xl" />
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="order-1 lg:order-2">
              <div className="inline-block bg-[#0a0a0a] border border-gray-700 rounded-lg px-5 py-2 mb-6">
                <span className="text-sm text-white">Clarity Engine</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
                Intent to Action
              </h3>
              
              <p className="text-gray-400 text-base sm:text-lg mb-8">
  Feeta transforms vague goals into precise, validated plans through intelligent dialogue. It ensures your ideas are fully understood before work begins—eliminating guesswork, misalignment, and costly rework.       </p>

              <div className="flex flex-wrap gap-2 sm:gap-4">
                <button className="bg-[#0a0a0a] border border-gray-700 hover:border-gray-600 px-5 py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105 hover:bg-gray-800">
  Clear Briefs
                </button>
                <button className="bg-[#0a0a0a] border border-gray-700 hover:border-gray-600 px-5 py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105 hover:bg-gray-800">
                  Smart Validation
                </button>
                <button className="bg-[#0a0a0a] border border-gray-700 hover:border-gray-600 px-5 py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105 hover:bg-gray-800">
                  Zero Rework       
                        </button>
              </div>
            </div>
          </div>
        </section>
  {/**this is the swap */}

  <section ref={visibilityRef} className="relative z-10 mt-16 sm:mt-32 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Side - Content */}
            <div className="animate-on-scroll order-1 lg:order-1">
              <div className="inline-block bg-[#0a0a0a] border border-gray-700 rounded-lg px-5 py-2 mb-8">
                <span className="text-sm text-white font-medium">Visibility Hub</span>
              </div>
              
              <h3 className="text-5xl font-bold mb-7 leading-tight tracking-tight">
                Real-Time Oversight
              </h3>
              
              <p className="text-gray-400 text-lg mb-10 leading-relaxed">
  Feeta replaces daily stand-ups and manual reporting with automated updates and concise AI summaries. You see exactly what’s done, what’s blocked, and what’s next—without chasing anyone for status.            </p>

              <div className="flex flex-wrap gap-3">
                <button className="bg-[#0a0a0a] border border-gray-700 hover:border-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
  Instant Reports
                </button>
                <button className="bg-[#0a0a0a] border border-gray-700 hover:border-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  AI Summaries
                </button>
                <button className="bg-[#0a0a0a] border border-gray-700 hover:border-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
                  Full Visibility
                </button>
              </div>
            </div>

            {/* Right Side - AI Dashboard */}
            <div className="w-full h-[300px] sm:h-[400px] border border-gray-800 rounded-2xl bg-black/20 p-4 sm:p-6 flex items-start justify-center overflow-hidden animate-on-scroll order-2 lg:order-2">
              <div className="relative w-full max-w-sm">
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="bg-gray-900/80 border-b border-gray-800 px-3 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-gray-400 ml-2">Feeta Overview</span>
                  </div>
                  <div className="p-5">
                    <div className="bg-[#4C3BCF]/10 rounded-xl p-3 border border-[#4C3BCF]/30 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-[#4C3BCF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span className="text-xs text-[#4C3BCF] font-semibold">AI Daily Summary</span>
                      </div>
                      <p className="text-xs text-gray-300">3 tasks completed, 2 in progress</p>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden scrollbar-hide">
                      <div className="bg-green-500/10 rounded-xl px-3 py-2.5 border border-green-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium">API Integration</p>
                            <span className="text-xs text-green-400">Done</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-500/10 rounded-xl px-3 py-2.5 border border-blue-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium">UI Components</p>
                            <span className="text-xs text-blue-400">In Progress</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-red-500/10 rounded-xl px-3 py-2.5 border border-red-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium">Database Setup</p>
                            <span className="text-xs text-red-400">Blocked</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-500/10 rounded-xl px-3 py-2.5 border border-green-500/30">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium">Testing Phase</p>
                            <span className="text-xs text-green-400">Done</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none rounded-b-2xl" />
              </div>
            </div>
          </div>
        </section>



        {/* Engineering & Execution Support Section */}
        <section ref={delegationRef} className="relative z-10 mt-16 sm:mt-32 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Side - Smart Delegation Visual */}
            <div className="animate-on-scroll order-2 lg:order-1">
              <SmartDelegationVisual activeFeature={activeFeature} />
            </div>

            {/* Right Side - Content */}
            <div className="animate-on-scroll order-1 lg:order-2">
              <div className="inline-block bg-[#0a0a0a] border border-gray-700 rounded-lg px-5 py-2 mb-8">
                <span className="text-sm text-white font-medium">Smart Delegation</span>
              </div>
              
              <h3 className="text-5xl font-bold mb-7 leading-tight tracking-tight">
              Automated Delegation & Tracking
              </h3>
              
              <p className="text-gray-400 text-lg mb-10 leading-relaxed">
  Feeta takes high-level objectives and breaks them into actionable sub-tasks—assigning each to the right person based on skill, workload, and timing. Progress syncs automatically from Slack, Jira, and other tools, keeping everyone aligned without micromanagement.
              </p>

              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setActiveFeature(activeFeature === 'auto-assign' ? null : 'auto-assign')}
                  className={`border px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFeature === 'auto-assign' 
                      ? 'bg-[#4C3BCF] border-[#4C3BCF] text-white shadow-lg shadow-[#4C3BCF]/30' 
                      : 'bg-[#0a0a0a] border-gray-700 hover:border-[#4C3BCF]/50'
                  }`}
                >
  Auto-Assign
                </button>
                <button 
                  onClick={() => setActiveFeature(activeFeature === 'balanced' ? null : 'balanced')}
                  className={`border px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFeature === 'balanced' 
                      ? 'bg-[#4C3BCF] border-[#4C3BCF] text-white shadow-lg shadow-[#4C3BCF]/30' 
                      : 'bg-[#0a0a0a] border-gray-700 hover:border-[#4C3BCF]/50'
                  }`}
                >
  Balanced Workloads
                </button>
                <button 
                  onClick={() => setActiveFeature(activeFeature === 'sync' ? null : 'sync')}
                  className={`border px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeFeature === 'sync' 
                      ? 'bg-[#4C3BCF] border-[#4C3BCF] text-white shadow-lg shadow-[#4C3BCF]/30' 
                      : 'bg-[#0a0a0a] border-gray-700 hover:border-[#4C3BCF]/50'
                  }`}
                >
  Live Sync
                </button>
              </div>
            </div>
          </div>
        </section>

        
        {/* The Feeta Advantage Section */}
        <section ref={guidanceRef} className="relative z-10 mt-16 sm:mt-32 px-4 sm:px-8">
          <div className="max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Side - Content */}
            <div className="guidance-content order-1 lg:order-1">
              <div className="inline-block bg-[#0a0a0a] border border-gray-700 rounded-lg px-5 py-2 mb-8">
                <span className="text-sm text-white font-medium">Contextual Support</span>
              </div>
              
              <h3 className="text-5xl font-bold mb-7 leading-tight tracking-tight">
                Intelligent Developer Guidance
              </h3>
              
              <p className="text-gray-400 text-lg mb-10 leading-relaxed">
  When your team hits a roadblock, Feeta offers contextual technical guidance drawn from project history—helping developers solve issues quickly without creating dependency or technical debt.</p>

              <div className="flex flex-wrap gap-3">
                <button className="bg-[#0a0a0a] border border-gray-700 hover:border-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
  Context-Aware
                </button>
                <button className="bg-[#0a0a0a] border border-gray-700 hover:border-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
  Lightweight Help
                </button>
                <button className="bg-[#0a0a0a] border border-gray-700 hover:border-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
  Faster Delivery
                </button>
              </div>
            </div>

            {/* Right Side - Contextual Support Visual */}
            <div className="w-full h-[300px] sm:h-[400px] border border-gray-800 rounded-2xl bg-black/20 p-4 sm:p-6 flex items-start justify-center overflow-hidden guidance-visual order-2 lg:order-2">
              <div className="relative w-full max-w-sm">
                <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden">
                  {/* Window Header */}
                  <div className="bg-gray-900/80 border-b border-gray-800 px-3 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-gray-400 ml-2">Feeta Assistant</span>
                  </div>

                  {/* Chat Interface */}
                  <div className="p-5 space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
                    {/* Developer Question */}
                    <div className={`bg-red-500/10 rounded-2xl p-3 border border-red-500/30 transition-all duration-700 ${
                      contextualPhase >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">D</span>
                        </div>
                        <span className="text-xs text-red-400">Developer - Payment Error</span>
                      </div>
                      <p className="text-xs text-white mb-2">Integrated NMI payment gateway but it's not working at all</p>
                      <div className="bg-black/40 rounded p-2 font-mono text-xs text-red-300">
                        Error: Authentication failed - Invalid credentials
                      </div>
                    </div>

                    {/* AI Thinking */}
                    {contextualPhase === 1 && (
                      <div className="flex items-center justify-center my-3 transition-all duration-500 opacity-100">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-[#4C3BCF] rounded-full animate-pulse" />
                          <div className="w-1.5 h-1.5 bg-[#4C3BCF] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                          <div className="w-1.5 h-1.5 bg-[#4C3BCF] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <span className="text-xs text-gray-400 ml-2">Checking credentials...</span>
                      </div>
                    )}

                    {/* AI Analysis */}
                    {contextualPhase >= 2 && (
                      <div className={`bg-[#4C3BCF]/10 rounded-2xl p-3 border border-[#4C3BCF]/30 transition-all duration-700 ${
                        contextualPhase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-[#4C3BCF] rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          <span className="text-xs text-[#4C3BCF] font-semibold">Feeta AI</span>
                        </div>
                        <p className="text-xs text-gray-300 mb-2">Found the issue! You're using the secret key as token key. Let me explain the correct setup.</p>
                      </div>
                    )}

                    {/* Solution */}
                    {contextualPhase >= 3 && (
                      <div className={`bg-green-500/10 rounded-2xl p-3 border border-green-500/30 transition-all duration-700 ${
                        contextualPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}>
                        <div className="text-xs text-green-400 font-semibold mb-2">NMI Credential Setup:</div>
                        <div className="space-y-1 text-xs text-gray-300">
                          <p>• Secret Key = Private Key (server-side only)</p>
                          <p>• Token Key = Public Key (client-side)</p>
                          <p>• Never expose secret key in frontend</p>
                          <p>• Use environment variables properly</p>
                        </div>
                      </div>
                    )}

                    {/* Code Implementation */}
                    {contextualPhase >= 4 && (
                      <div className={`bg-gray-900/60 rounded-xl p-3 border border-gray-800/30 transition-all duration-700 ${
                        contextualPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}>
                        <div className="text-xs text-gray-400 mb-2">Correct Setup:</div>
                        <div className="bg-black/60 rounded p-2 font-mono text-xs space-y-1">
                          <div><span className="text-gray-500">// .env file</span></div>
                          <div><span className="text-blue-400">NMI_SECRET_KEY</span><span className="text-gray-400">=</span><span className="text-green-400">your_private_key</span></div>
                          <div><span className="text-blue-400">NMI_TOKEN_KEY</span><span className="text-gray-400">=</span><span className="text-green-400">your_public_key</span></div>
                          <div><span className="text-gray-500">// Use secret key server-side only</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Bottom Fade Effect */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none rounded-b-2xl" />
              </div>
            </div>
          </div>
        </section>



        {/* Benefits Section */}
        <section ref={benefitsRef} className="relative z-10 mt-16 sm:mt-32 px-4 sm:px-8 pb-16 sm:pb-32">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-block bg-[#0a0a0a] border border-gray-700 rounded-lg px-5 py-2 mb-8 animate-on-scroll">
              <span className="text-sm text-white font-medium">Benefits</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight animate-on-scroll">
              AI Co-Pilot Results
            </h2>
            
            <p className="text-gray-400 text-sm sm:text-base lg:text-xl mb-6 sm:mb-16 animate-on-scroll px-4">
              Transform chaos into seamless execution
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Benefit 1 */}
              <div className="benefit-card bg-gradient-to-br from-[#4C3BCF]/40 via-black to-black border border-gray-800/50 rounded-2xl p-8 text-left hover:border-[#4C3BCF]/30 transition-all duration-300 hover-lift">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 leading-tight">Task Clarity Without<br />Endless Back-and-Forth</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-light">
                  Feeta's Clarity Engine validates every brief before work begins, ensuring your team understands exactly what needs to be done. This eliminates costly rework cycles and prevents the miscommunication that derails timelines and budgets.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="benefit-card bg-gradient-to-br from-[#4C3BCF]/40 via-black to-black border border-gray-800/50 rounded-2xl p-8 text-left hover:border-[#4C3BCF]/30 transition-all duration-300 hover-lift">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 leading-tight">Time Savings Through<br />Automated Oversight</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-light">
                  Stop wasting hours on status meetings and manual follow-ups. Feeta automatically tracks progress across all your tools and delivers AI-generated summaries, giving you instant visibility without the administrative overhead.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="benefit-card bg-gradient-to-br from-[#4C3BCF]/40 via-black to-black border border-gray-800/50 rounded-2xl p-8 text-left hover:border-[#4C3BCF]/30 transition-all duration-300 hover-lift">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 leading-tight">No Bottlenecks, Just<br />Continuous Flow</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-light">
                  Feeta's intelligent delegation system assigns tasks based on real workload data and skill sets, preventing team burnout and ensuring balanced distribution. Work flows smoothly without you becoming the operational bottleneck.
                </p>
              </div>

              {/* Benefit 4 - Rework & Failure Cost Reduction */}
              <div className="bg-gradient-to-br from-[#4C3BCF]/40 via-black to-black border border-gray-800/50 rounded-2xl p-8 text-left hover:border-[#4C3BCF]/30 transition-all duration-300 benefit-card hover-lift">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 leading-tight">Rework & Failure Cost<br />Reduction</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-light">
                  Poor communication causes 80% of project professionals to spend over half their time on rework. Feeta stops this waste, protecting your limited financial runway
                </p>
              </div>

              {/* Benefit 5 - Trust & Accountability */}
              <div className="bg-gradient-to-br from-[#4C3BCF]/40 via-black to-black border border-gray-800/50 rounded-2xl p-8 text-left hover:border-[#4C3BCF]/30 transition-all duration-300 benefit-card hover-lift">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 leading-tight">Trust & Accountability (Not<br />Guesswork)</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-light">
                  Delegation is based on data, not gut feeling. Automated reporting provides clear, synthesized visibility without the morale-killing effects of micromanagement
                </p>
              </div>

              {/* Benefit 6 - Shield Against Founder Burnout */}
              <div className="bg-gradient-to-br from-[#4C3BCF]/40 via-black to-black border border-gray-800/50 rounded-2xl p-8 text-left hover:border-[#4C3BCF]/30 transition-all duration-300 benefit-card hover-lift">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-6">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3 leading-tight">Shield Against Founder Burnout</h3>
                <p className="text-gray-400 text-sm leading-relaxed font-light">
                  By offloading operational friction and delegation stress, Feeta directly counteracts the conditions that lead to founder burnout, cited as a reason for 9% of startup failures
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section ref={faqRef} className="relative z-10 mt-16 sm:mt-32 px-4 sm:px-8 pb-16 sm:pb-32">
          {/* Purple Blur Background Effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4C3BCF]/20 rounded-full blur-3xl parallax-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#4C3BCF]/15 rounded-full blur-3xl parallax-fast" />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-block bg-[#0a0a0a] border border-gray-700 rounded-lg px-5 py-2 mb-8 animate-on-scroll">
              <span className="text-sm text-white font-medium">FAQs</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6 leading-tight animate-on-scroll">
              We've Got the Answers<br />
              You're Looking For
            </h2>
            
            <p className="text-gray-400 text-base sm:text-lg mb-10 sm:mb-16 animate-on-scroll">
              Quick answers to your AI automation questions.
            </p>

            {/* FAQ Items */}
            <div className="space-y-4">
              <div className="faq-item">
                <FAQItem 
                  question="How does Feeta solve the Founder's Execution Gap?"
                  answer="Feeta automates the operational friction between your high-level intent and your team's execution. It guarantees clarity for every task, intelligently delegates work, and eliminates time wasted on manual follow-up and status meetings. This frees up leaders to focus on strategic work instead of becoming the operational bottleneck"
                />
              </div>
              <div className="faq-item">
                <FAQItem 
                  question="How quickly can we start using Feeta?"
                  answer="Feeta is designed as an AI Operational Layer that integrates seamlessly with your existing tools like Slack and Jira. There is no lengthy implementation or custom development required. You can start automating the delegation and follow-up loop immediately after a quick setup."
                />
              </div>
              <div className="faq-item">
                <FAQItem 
                  question="What makes Feeta different from project management tools?"
                  answer="Traditional project management tools are passive repositories that require manual updates. Feeta is an active AI co-pilot that proactively clarifies requirements, intelligently delegates tasks, automates status tracking, and provides synthesized reports—eliminating the manual overhead that bogs down founders."
                />
              </div>
              <div className="faq-item">
                <FAQItem 
                  question="Is Feeta suitable for non-technical teams?"
                  answer="Absolutely. While Feeta includes a Contextual Coding Assistant for development teams, its core workflow automation and task delegation features benefit any team. The natural language interface makes it accessible to everyone, regardless of technical background."
                />
              </div>
              <div className="faq-item">
                <FAQItem 
                  question="How does Feeta ensure data security?"
                  answer="Feeta follows industry-standard security practices including end-to-end encryption, secure API integrations, and compliance with data protection regulations. Your sensitive business data never leaves your control, and we provide detailed audit logs for full transparency."
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section ref={ctaRef} className="relative z-10 mt-8 sm:mt-24 px-4 sm:px-8 pb-8 sm:pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="cta-section bg-black rounded-3xl p-6 sm:p-16 text-center relative overflow-hidden">
              {/* Purple Glow - Top Left */}
              <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#4C3BCF]/40 rounded-full blur-[100px] parallax-slow" />
              {/* Purple Glow - Bottom Right */}
              <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#4C3BCF]/40 rounded-full blur-[100px] parallax-fast" />
              
              <div className="relative z-10">
                <h2 className="cta-title text-2xl sm:text-3xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                  Start Scaling
                </h2>
                
                <p className="cta-text text-gray-300 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8">
                  See the AI Co-Pilot in action
                </p>

                <button onClick={navigateToDemo} className="bg-[#4C3BCF] hover:bg-[#4C3BCF]/80 px-5 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto transition-all duration-300 text-sm floating-element hover:scale-105 hover:shadow-lg hover:shadow-[#4C3BCF]/30">
                  Book Your Personalized Demo
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-gray-800 pt-8 sm:pt-16 pb-8 px-4 sm:px-8 overflow-hidden">
          {/* Purple Glow from top */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[300px] bg-[#4C3BCF]/20 rounded-full blur-[150px] pointer-events-none" />
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-8 lg:gap-0 mb-8 sm:mb-16">
              {/* Left - Brand */}
              <div className="max-w-md w-full lg:w-auto">
                <div className="flex items-center gap-3 mb-4">
                  <Image src="/Images/F2.png" alt="Feeta Logo" width={32} height={32} className="rounded-md" />
                  <h3 className="text-2xl font-extrabold">Feeta AI</h3>
                </div>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                  AI Operational Co-Pilot: Guaranteed<br />
                  Clarity, Flawless Execution.
                </p>
                <div>
                  <p className="text-white font-medium mb-3">Join our newsletter</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="name@email.com"
                      className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 flex-1 focus:outline-none focus:border-[#4C3BCF]"
                    />
                    <button className="bg-[#4C3BCF] hover:bg-[#4C3BCF]/80 px-6 py-2 rounded-lg text-sm font-medium transition-colors">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>

              {/* Right - Links, Socials */}
              <div className="flex flex-col sm:flex-row gap-8 sm:gap-16 w-full lg:w-auto">
                {/* Links */}
                <div>
                  <h4 className="text-white font-semibold mb-4">Links</h4>
                  <ul className="space-y-3">
                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Services</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Process</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Founder Success</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Benefits</a></li>
                  </ul>
                </div>

                {/* Socials */}
                <div>
                  <h4 className="text-white font-semibold mb-4">Socials</h4>
                  <ul className="space-y-3">
                    <li><a href="https://www.instagram.com/5yed_ateef/#" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">Instagram</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Facebook</a></li>
                    <li><a href="https://www.linkedin.com/in/syed-ateef-quadri-v-4a55ab318/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">Linkedin</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Twitter</a></li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
          
          {/* Bottom Bar - Full Width */}
          <div className="border-t border-gray-800 mt-16 -mx-8">
            <div className="max-w-7xl mx-auto px-8 pt-8 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Made with ❤️ by <span className="text-white">Syed Ateef</span></p>
            </div>
          </div>
        </footer>

        {/* Loading Overlay */}
        {isNavigating && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-[#4C3BCF]/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-[#4C3BCF] rounded-full animate-spin"></div>
              </div>
              <p className="text-white text-sm">Loading...</p>
            </div>
          </div>
        )}
      </div>
      </>
    );
  }
