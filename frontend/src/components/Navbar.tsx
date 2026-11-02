'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    const savedTheme = (localStorage.getItem('phishguard_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('phishguard_theme', nextTheme);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'glass-card py-3' : 'py-5 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg rotate-45 group-hover:rotate-[135deg] transition-transform duration-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              PhishGuard AI
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">How It Works</a>
            <a href="#stats" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">Stats</a>
            <a href="#testimonials" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">Testimonials</a>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="neon-btn text-sm px-3 py-2"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {user ? (
              <Link href="/dashboard" className="neon-btn neon-btn-filled text-sm">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="neon-btn text-sm">
                  Log In
                </Link>
                <Link href="/register" className="neon-btn neon-btn-filled text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-cyan-400 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-800">
            <div className="flex flex-col gap-3 pt-4">
              <a href="#features" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors" onClick={() => setMobileOpen(false)}>Features</a>
              <a href="#how-it-works" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors" onClick={() => setMobileOpen(false)}>How It Works</a>
              <a href="#stats" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors" onClick={() => setMobileOpen(false)}>Stats</a>
              <div className="flex gap-3 pt-3">
                {user ? (
                  <Link href="/dashboard" className="neon-btn neon-btn-filled text-sm w-full">Dashboard</Link>
                ) : (
                  <>
                    <Link href="/login" className="neon-btn text-sm flex-1">Log In</Link>
                    <Link href="/register" className="neon-btn neon-btn-filled text-sm flex-1">Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
