import { DottedSurface } from '../ui/dotted-surface';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-black overflow-hidden">
      <DottedSurface />
      {/* Animated Starfield Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-purple-800/20 to-black"></div>
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>
      
      {/* Purple Glow Effects */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
      {/* Book A Demo Button */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-20">
        <button className="bg-white text-gray-900 px-6 py-3 rounded-2xl font-medium shadow-lg">
          Book A Demo
        </button>
      </div>
      
      {/* 3D Megaphone - Left */}
      <div className="absolute left-8 top-1/2 transform -translate-y-1/2 z-10">
        <div className="w-48 h-32 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl transform rotate-12 shadow-2xl opacity-90"></div>
        <div className="absolute -top-2 -left-2 w-16 h-8 bg-gradient-to-r from-blue-300 to-cyan-300 rounded-lg transform rotate-45"></div>
      </div>
      
      {/* 3D Speech Bubble - Right */}
      <div className="absolute right-8 top-1/2 transform -translate-y-1/2 z-10">
        <div className="w-56 h-40 bg-gradient-to-r from-purple-300 to-pink-300 rounded-3xl shadow-2xl opacity-90"></div>
        <div className="absolute bottom-0 left-8 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-purple-300"></div>
      </div>
      
      {/* Curved Line at Bottom */}
      <div className="absolute bottom-0 left-0 w-full h-32 z-5">
        <svg className="w-full h-full" viewBox="0 0 1200 200" fill="none">
          <path d="M0 100 Q600 50 1200 100 L1200 200 L0 200 Z" fill="url(#gradient)" />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <h1 className="text-8xl lg:text-9xl font-bold text-white text-center leading-tight mb-12">
          Move Faster.
          <br />
          Execute
          <br />
          Smarter
        </h1>
        
        <p className="text-xl text-white/90 text-center max-w-2xl mb-8">
          Say goodbye to endless meetings and unclear tasks. Feeta transforms chaos into seamless execution
        </p>
        
        <p className="text-sm text-white/60 text-center">
          Trusted by the world's most productive teams
        </p>
      </div>
    </section>
  )
}

export default HeroSection
