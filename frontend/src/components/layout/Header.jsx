'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="w-full bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3">
          <Image src="/images/F.png" alt="Feeta Logo" width={32} height={32} className="rounded-md" />
          <span className="text-xl font-semibold text-gray-900">Feeta</span>
        </Link>
        
        {/* Navigation - Desktop */}
        <nav className="hidden lg:flex items-center space-x-8">
          <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
            Features
          </Link>
          <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
            How It Works
          </Link>
          <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
            Pricing
          </Link>
          <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
            Testimonials
          </Link>
          <Link href="#integrations" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
            Integrations
          </Link>
          <Link href="#resources" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
            Resources
          </Link>
        </nav>
        
        {/* Auth Buttons - Desktop */}
        <div className="hidden lg:flex items-center space-x-4">
          <button className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
            Login
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Get Started Free
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 py-4">
          <nav className="flex flex-col space-y-4">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 font-medium px-6">
              Features
            </Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium px-6">
              How It Works
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium px-6">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-gray-600 hover:text-gray-900 font-medium px-6">
              Testimonials
            </Link>
            <Link href="#integrations" className="text-gray-600 hover:text-gray-900 font-medium px-6">
              Integrations
            </Link>
            <Link href="#resources" className="text-gray-600 hover:text-gray-900 font-medium px-6">
              Resources
            </Link>
            <div className="flex flex-col space-y-2 px-6 pt-4 border-t border-gray-100">
              <button className="text-gray-700 font-medium text-left">
                Login
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium">
                Get Started Free
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header
