'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

// Particle component
function Particles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${10 + Math.random() * 20}s`,
            animationDelay: `${Math.random() * 10}s`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            background: i % 3 === 0 ? '#00f5ff' : i % 3 === 1 ? '#8b5cf6' : '#0080ff',
          }}
        />
      ))}
    </div>
  );
}

// Animated Counter
function Counter({ end, label, suffix = '' }: { end: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          let start = 0;
          const duration = 2000;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent counter-value">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-400 mt-2 text-sm">{label}</div>
    </div>
  );
}

// Radar Component
function ThreatRadar() {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80">
      {/* Rings */}
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border border-cyan-500/20"
          style={{
            inset: `${i * 15}%`,
          }}
        />
      ))}
      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full neon-glow" />
      {/* Sweep */}
      <div className="absolute inset-0 radar-sweep">
        <div
          className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left"
          style={{
            background: 'linear-gradient(90deg, rgba(0,245,255,0.8), transparent)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 origin-left"
          style={{
            width: '50%',
            height: '50%',
            background: 'conic-gradient(from 0deg, rgba(0,245,255,0.15), transparent 60deg)',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
            transformOrigin: '0 0',
          }}
        />
      </div>
      {/* Threat dots */}
      {[
        { x: 30, y: 25, color: '#ff3366', delay: '0s' },
        { x: 70, y: 35, color: '#ff6b35', delay: '1s' },
        { x: 55, y: 70, color: '#ff3366', delay: '2s' },
        { x: 25, y: 60, color: '#00ff88', delay: '0.5s' },
        { x: 75, y: 65, color: '#ff6b35', delay: '1.5s' },
      ].map((dot, i) => (
        <div key={i} className="absolute" style={{ left: `${dot.x}%`, top: `${dot.y}%` }}>
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: dot.color, animationDelay: dot.delay }}
          />
          <div
            className="absolute inset-0 w-2 h-2 rounded-full pulse-ring"
            style={{ background: dot.color, animationDelay: dot.delay }}
          />
        </div>
      ))}
    </div>
  );
}

// Typing Effect
function TypingText({ texts }: { texts: string[] }) {
  const [currentText, setCurrentText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const text = texts[textIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(text.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
        if (charIndex + 1 === text.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setCurrentText(text.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
        if (charIndex <= 1) {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % texts.length);
        }
      }
    }, isDeleting ? 30 : 80);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, texts]);

  return (
    <span className="text-cyan-400">
      {currentText}
      <span className="typing-cursor" />
    </span>
  );
}

// Features data
const features = [
  {
    icon: '🛡️',
    title: 'URL Analysis',
    desc: 'Deep inspection of URL structure, domain patterns, and suspicious indicators.',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: '🔒',
    title: 'SSL Verification',
    desc: 'Certificate validation, issuer verification, and expiry monitoring.',
    gradient: 'from-blue-500 to-purple-500',
  },
  {
    icon: '🧠',
    title: 'AI Classification',
    desc: 'Associative Classification with Apriori algorithm for intelligent detection.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: '📊',
    title: 'Risk Scoring',
    desc: 'Comprehensive risk assessment with detailed confidence metrics.',
    gradient: 'from-pink-500 to-red-500',
  },
  {
    icon: '🌐',
    title: 'Domain Intelligence',
    desc: 'WHOIS lookup, DNS records, domain age verification, and hosting analysis.',
    gradient: 'from-green-500 to-cyan-500',
  },
  {
    icon: '⚡',
    title: 'Real-Time Scanning',
    desc: 'Instant results with live content analysis and behavior detection.',
    gradient: 'from-orange-500 to-yellow-500',
  },
];

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Bank IT Manager',
    text: 'PhishGuard AI has saved our organization from multiple phishing attempts. The detection accuracy is remarkable.',
    avatar: 'RK',
  },
  {
    name: 'Priya Sharma',
    role: 'Cybersecurity Analyst',
    text: 'The associative classification approach is innovative. We integrated the API into our security pipeline.',
    avatar: 'PS',
  },
  {
    name: 'Amit Patel',
    role: 'FinTech CTO',
    text: 'Best phishing detection tool we have used. The explainable AI feature helps our team understand threats.',
    avatar: 'AP',
  },
];

export default function LandingPage() {
  const [scanExample, setScanExample] = useState('');
  const exampleUrl = 'https://secure-banklogin.suspicious-domain.com/verify';

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= exampleUrl.length) {
        setScanExample(exampleUrl.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen gradient-hero grid-bg">
      <Particles />
      <Navbar />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center"
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-6 text-xs font-medium">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400">AI Engine Active</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">v1.0</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-white">Protect Your </span>
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Banking Identity
                </span>
                <br />
                <span className="text-white">from </span>
                <TypingText texts={['Phishing Threats', 'Fake Websites', 'Cyber Attacks', 'Online Fraud']} />
              </h1>

              <p className="text-lg text-gray-400 mb-8 max-w-lg leading-relaxed">
                AI-Powered Real-Time Detection of Fraudulent E-Banking Websites using
                <span className="text-cyan-400 font-medium"> Associative Classification</span> algorithms.
              </p>

              <div className="flex flex-wrap gap-4 mb-10">
                <Link href="/register" className="neon-btn neon-btn-filled text-base px-8 py-3">
                  Get Started Free →
                </Link>
                <a href="#how-it-works" className="neon-btn text-base px-8 py-3">
                  Learn More
                </a>
              </div>

              {/* Trusted by */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['RK', 'PS', 'AP', 'SK'].map((init, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold border-2 border-gray-900"
                    >
                      {init}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-400">
                  Trusted by <span className="text-white font-semibold">10,000+</span> users
                </div>
              </div>
            </div>

            {/* Right - Radar */}
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl" />
              <ThreatRadar />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Scanner Demo */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-8 neon-glow">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Try the Scanner</h3>
              <p className="text-gray-400 text-sm">Paste any URL to check if it&apos;s safe</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={scanExample}
                  readOnly
                  className="neon-input font-mono text-sm pr-10"
                  placeholder="Enter website URL..."
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
              </div>
              <Link href="/register" className="neon-btn neon-btn-filled whitespace-nowrap">
                Scan Now
              </Link>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Detected: <span className="text-red-400 font-medium">Phishing Site</span> — Confidence: 94.7%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4">
              Advanced Phishing Detection
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Multi-layered analysis using machine learning, domain intelligence, and behavioral patterns.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div key={i} className="glass-card-hover p-6 group">
                <div className="text-3xl mb-4">{feat.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                <div className={`h-1 w-12 bg-gradient-to-r ${feat.gradient} rounded-full mt-4 group-hover:w-full transition-all duration-500`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4">
              Three Steps to Safety
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Paste URL', desc: 'Enter any suspicious banking website URL into our scanner.', icon: '🔗' },
              { step: '02', title: 'AI Analysis', desc: 'Our engine extracts 25+ features and runs Associative Classification.', icon: '🧠' },
              { step: '03', title: 'Get Results', desc: 'Receive instant classification with risk score and detailed explanation.', icon: '📊' },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="text-6xl font-bold text-cyan-500/10 mb-4">{item.step}</div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/4 -right-4 text-cyan-500/30 text-3xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 px-4">
        <div className="max-w-5xl mx-auto glass-card p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Counter end={50000} label="URLs Scanned" suffix="+" />
            <Counter end={98} label="Detection Accuracy" suffix="%" />
            <Counter end={15000} label="Threats Blocked" suffix="+" />
            <Counter end={10000} label="Active Users" suffix="+" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3">
              What Users Say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card-hover p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">{t.name}</div>
                    <div className="text-gray-500 text-xs">{t.role}</div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex gap-1 mt-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Protect Your Banking?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Start scanning suspicious URLs now. Free to use, powered by advanced AI.
          </p>
          <Link href="/register" className="neon-btn neon-btn-filled text-lg px-10 py-4">
            Get Started Now →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="font-bold text-white">PhishGuard AI</span>
              </div>
              <p className="text-gray-500 text-sm">AI-powered phishing detection for e-banking websites.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Product</h4>
              <div className="flex flex-col gap-2">
                <a href="#features" className="text-gray-500 text-sm hover:text-cyan-400 transition-colors">Features</a>
                <a href="#" className="text-gray-500 text-sm hover:text-cyan-400 transition-colors">API</a>
                <a href="#" className="text-gray-500 text-sm hover:text-cyan-400 transition-colors">Pricing</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Resources</h4>
              <div className="flex flex-col gap-2">
                <a href="#" className="text-gray-500 text-sm hover:text-cyan-400 transition-colors">Documentation</a>
                <a href="#" className="text-gray-500 text-sm hover:text-cyan-400 transition-colors">Blog</a>
                <a href="#" className="text-gray-500 text-sm hover:text-cyan-400 transition-colors">Security Tips</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Contact</h4>
              <div className="flex flex-col gap-2">
                <span className="text-gray-500 text-sm">support@phishguard.ai</span>
                <span className="text-gray-500 text-sm">GitHub</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-600 text-sm">
            © 2026 PhishGuard AI. All rights reserved. Built with ❤️ for cybersecurity.
          </div>
        </div>
      </footer>
    </div>
  );
}
