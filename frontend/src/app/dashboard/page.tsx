'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { scanApi } from '@/lib/api';

// ─── Animated Counter ──────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display.toLocaleString()}{suffix}</span>;
}

// ─── Sidebar ───────────────────────────────────────────────────────────────
function Sidebar({ active, onNavigate, user, onLogout, collapsed, onToggle }: {
  active: string;
  onNavigate: (p: string) => void;
  user: { name: string; email: string; role: string; avatar?: string } | null;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const menuItems = [
    { id: 'scanner',  label: 'URL Scanner',   icon: '🔍', desc: 'Analyze URLs' },
    { id: 'history',  label: 'Scan History',  icon: '📋', desc: 'Past scans' },
    { id: 'reports',  label: 'Reports',       icon: '📊', desc: 'Analytics' },
    { id: 'settings', label: 'Settings',      icon: '⚙️', desc: 'Profile' },
  ];

  return (
    <aside className={`relative flex flex-col min-h-screen transition-all duration-300 border-r border-cyan-500/10
      ${collapsed ? 'w-20' : 'w-64'}
    `} style={{ background: 'linear-gradient(180deg, #0d0d2b 0%, #0a0a1f 100%)' }}>

      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

      {/* Logo */}
      <div className={`flex items-center gap-3 p-5 border-b border-cyan-500/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="relative w-9 h-9 flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl rotate-45 opacity-90" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-xl border border-cyan-400/30 animate-ping opacity-40" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-bold text-white text-sm leading-tight">PhishGuard</div>
            <div className="text-cyan-400 text-xs font-semibold tracking-widest">AI</div>
          </div>
        )}
        <button onClick={onToggle} className="ml-auto text-gray-600 hover:text-cyan-400 transition-colors">
          <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* System Status */}
      {!collapsed && (
        <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-lg border border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">AI Engine Active</span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 group relative overflow-hidden
              ${active === item.id
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              } ${collapsed ? 'justify-center' : ''}
            `}
          >
            {active === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-full" />
            )}
            <span className="text-base">{item.icon}</span>
            {!collapsed && (
              <div className="text-left">
                <div className="font-medium leading-tight">{item.label}</div>
                <div className="text-xs opacity-50">{item.desc}</div>
              </div>
            )}
            {active === item.id && !collapsed && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
            )}
          </button>
        ))}

        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-purple-400 hover:bg-purple-500/10 transition-all border border-purple-500/20 mt-4 ${collapsed ? 'justify-center' : ''}`}
          >
            <span>👑</span>
            {!collapsed && <span className="font-medium">Admin Panel</span>}
          </Link>
        )}
      </nav>

      {/* User */}
      <div className={`p-4 border-t border-cyan-500/10 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0a0a1f]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border border-transparent hover:border-red-500/20"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </>
        ) : (
          <button onClick={onLogout} className="text-red-400 hover:text-red-300 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── Stats Card ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, suffix, color, delay }: {
  icon: string; label: string; value: number; suffix?: string; color: string; delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  const colorMap: Record<string, string> = {
    cyan: 'border-cyan-500/20 shadow-cyan-500/10',
    green: 'border-green-500/20 shadow-green-500/10',
    orange: 'border-orange-500/20 shadow-orange-500/10',
    red: 'border-red-500/20 shadow-red-500/10',
  };
  const textMap: Record<string, string> = {
    cyan: 'text-cyan-400', green: 'text-green-400', orange: 'text-orange-400', red: 'text-red-400',
  };

  return (
    <div className={`glass-card p-5 border shadow-lg transition-all duration-700 ${colorMap[color]}
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl mb-1">{icon}</div>
          <div className={`text-2xl font-bold ${textMap[color]}`}>
            {visible ? <AnimatedNumber value={value} suffix={suffix} /> : '0'}
          </div>
          <div className="text-xs text-gray-500 mt-1">{label}</div>
        </div>
        <div className={`w-2 h-2 rounded-full ${textMap[color].replace('text-', 'bg-')} animate-pulse mt-1`} />
      </div>
    </div>
  );
}

// ─── URL Scanner ────────────────────────────────────────────────────────────
type ScanResultData = {
  status?: 'legitimate' | 'suspicious' | 'phishing';
  confidence?: number;
  risk_score?: number;
  threat_level?: string;
  url?: string;
  features?: Array<{ name: string; value: string; risk_level: string; description: string }>;
  domain_info?: Record<string, unknown>;
  ssl_info?: Record<string, unknown>;
  association_rules?: Array<{ antecedent: string[]; consequent: string; confidence: number; support: number }>;
};

function URLScanner({ token }: { token: string }) {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { label: 'Extracting URL features', icon: '🔗' },
    { label: 'Checking SSL certificate', icon: '🔒' },
    { label: 'Analyzing domain data', icon: '🌐' },
    { label: 'Running AI classification', icon: '🧠' },
    { label: 'Generating report', icon: '📊' },
  ];

  const handleScan = async () => {
    if (!url.trim()) return;
    setScanning(true);
    setResult(null);
    setScanProgress(0);
    setCurrentStep(0);

    const progressInterval = setInterval(() => {
      setScanProgress((p) => {
        const next = p + Math.random() * 12;
        setCurrentStep(Math.floor((Math.min(next, 90) / 90) * steps.length));
        if (next >= 90) { clearInterval(progressInterval); return 90; }
        return next;
      });
    }, 350);

    try {
      const data = await scanApi.scanUrl(token, url);
      clearInterval(progressInterval);
      setScanProgress(100);
      setCurrentStep(steps.length);
      setTimeout(() => setResult(data), 600);
    } catch (err) {
      clearInterval(progressInterval);
      setScanProgress(0);
      alert(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const statusConfig = {
    legitimate: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', glow: '0 0 30px rgba(0,255,136,0.15)', emoji: '✅', label: 'LEGITIMATE' },
    suspicious:  { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', glow: '0 0 30px rgba(255,107,53,0.15)', emoji: '⚠️', label: 'SUSPICIOUS' },
    phishing:    { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', glow: '0 0 30px rgba(255,51,102,0.2)', emoji: '🚨', label: 'PHISHING' },
  };

  const cfg = result ? (statusConfig[result.status as keyof typeof statusConfig] || statusConfig.suspicious) : null;

  return (
    <div className="space-y-6">

      {/* Scanner Card */}
      <div className="glass-card p-6 border border-cyan-500/10 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Phishing Detection Engine</h2>
            <p className="text-gray-500 text-xs">Powered by Associative Classification AI</p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Model Ready</span>
          </div>
        </div>

        {/* Input Row */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4-4a4 4 0 01-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !scanning && handleScan()}
              className="neon-input neon-input-icon font-mono text-sm"
              placeholder="https://suspicious-banking-site.com/login"
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
          <button
            onClick={handleScan}
            disabled={scanning || !url.trim()}
            className="neon-btn neon-btn-filled px-7 disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
          >
            {scanning ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Scanning</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm">Analyze</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Examples */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-xs text-gray-600">Try:</span>
          {['https://google.com', 'https://paypal-secure-login.tk/account', 'https://www.sbi.co.in'].map((ex) => (
            <button key={ex} onClick={() => setUrl(ex)}
              className="text-xs text-cyan-500/70 hover:text-cyan-400 font-mono transition-colors border-b border-dashed border-cyan-500/30 hover:border-cyan-400">
              {ex}
            </button>
          ))}
        </div>

        {/* Progress */}
        {scanning && (
          <div className="mt-6 p-4 bg-black/20 rounded-xl border border-cyan-500/10">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span className="font-medium">Analyzing threat indicators...</span>
              <span className="text-cyan-400 font-mono">{Math.round(scanProgress)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${scanProgress}%`,
                  background: 'linear-gradient(90deg, #00f5ff, #0080ff, #8b5cf6)',
                  boxShadow: '0 0 12px rgba(0,245,255,0.5)'
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {steps.map((step, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-500
                  ${i < currentStep ? 'text-green-400' : i === currentStep ? 'text-cyan-400' : 'text-gray-700'}`}>
                  <span>{i < currentStep ? '✓' : i === currentStep ? '⟳' : '○'}</span>
                  <span>{step.icon} {step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      {result && cfg && (
        <div className="space-y-4 animate-fadeIn">
          {/* Main Result */}
          <div className={`glass-card p-6 border ${cfg.border} relative overflow-hidden`}
            style={{ boxShadow: cfg.glow }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${cfg.color.replace('text-', '').replace('-400', '')}, transparent)` }} />

            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className={`text-5xl`}>{cfg.emoji}</div>
                <div>
                  <div className={`text-xs font-bold tracking-widest mb-1 ${cfg.color}`}>{cfg.label}</div>
                  <div className="text-xl font-bold text-white">
                    {result.status === 'legitimate' ? 'Website is Safe' :
                     result.status === 'suspicious' ? 'Proceed with Caution' : 'Phishing Detected!'}
                  </div>
                  <div className="text-gray-400 text-xs mt-1 font-mono truncate max-w-xs">{result.url as string}</div>
                </div>
              </div>

              {/* Scores */}
              <div className="md:ml-auto flex gap-6">
                <div className="text-center">
                  <div className={`text-3xl font-bold font-mono ${cfg.color}`}>
                    {(result.confidence as number)?.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Confidence</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold font-mono ${
                    (result.risk_score as number) < 30 ? 'text-green-400' :
                    (result.risk_score as number) < 60 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {(result.risk_score as number)?.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Risk Score</div>
                </div>
              </div>
            </div>

            {/* Risk Bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>Risk Level</span>
                <span>{(result.risk_score as number)?.toFixed(0)}/100</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1500"
                  style={{
                    width: `${result.risk_score}%`,
                    background: (result.risk_score as number) < 30
                      ? 'linear-gradient(90deg, #00ff88, #00e07a)'
                      : (result.risk_score as number) < 60
                      ? 'linear-gradient(90deg, #ff9f43, #ff6b35)'
                      : 'linear-gradient(90deg, #ff3366, #ff1744)',
                    boxShadow: '0 0 8px currentColor'
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-green-400">Safe</span>
                <span className="text-orange-400">Moderate</span>
                <span className="text-red-400">Critical</span>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          {(result.features as Array<{name: string; value: string; risk_level: string; description: string}>)?.length > 0 && (
            <div className="glass-card p-6 border border-cyan-500/10">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-lg">🧠</span>
                <h3 className="font-bold text-white">Explainable AI — Feature Analysis</h3>
                <span className="ml-auto text-xs text-gray-500">{(result.features as Array<unknown>).length} indicators checked</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {(result.features as Array<{name: string; value: string; risk_level: string; description: string}>).map((feat, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]
                    ${feat.risk_level === 'danger' ? 'bg-red-500/5 border-red-500/20' :
                      feat.risk_level === 'warning' ? 'bg-orange-500/5 border-orange-500/20' :
                      'bg-green-500/5 border-green-500/20'}`}>
                    <div className="text-sm mt-0.5 flex-shrink-0">
                      {feat.risk_level === 'danger' ? '🔴' : feat.risk_level === 'warning' ? '🟡' : '🟢'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white truncate">{feat.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono flex-shrink-0
                          ${feat.risk_level === 'danger' ? 'bg-red-500/20 text-red-400' :
                            feat.risk_level === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-green-500/20 text-green-400'}`}>
                          {feat.value}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{feat.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Domain + SSL */}
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: '🌐 Domain Info', data: result.domain_info as Record<string, string> },
              { title: '🔒 SSL Certificate', data: result.ssl_info as Record<string, string> },
            ].map(({ title, data }) => (
              <div key={title} className="glass-card p-5 border border-cyan-500/10">
                <h3 className="text-sm font-bold text-white mb-4">{title}</h3>
                <div className="space-y-2">
                  {Object.entries(data || {}).slice(0, 6).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-gray-800/50">
                      <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-gray-300 font-mono">{String(val).substring(0, 24)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Website Preview */}
          {result.url && (
            <div className="glass-card p-6 border border-cyan-500/10">
              <div className="flex items-center gap-2 mb-4">
                <span>🌍</span>
                <h3 className="text-sm font-bold text-white">Website Preview</h3>
              </div>
              <div className="h-[360px] overflow-hidden rounded-3xl border border-gray-800 bg-black">
                <iframe
                  src={String(result.url)}
                  title="Website preview"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  className="w-full h-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Preview uses an iframe sandbox. Some websites may block embedded views for security.
              </p>
            </div>
          )}

          {/* Association Rules */}
          {(result.association_rules as Array<Record<string, unknown>>)?.length > 0 && (
            <div className="glass-card p-5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-4">
                <span>📐</span>
                <h3 className="text-sm font-bold text-white">Association Rules Matched</h3>
                <span className="ml-auto text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                  {(result.association_rules as Array<unknown>).length} rules
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left py-2 pr-4">Rule Pattern</th>
                      <th className="text-left py-2 pr-4">Classification</th>
                      <th className="text-right py-2 pr-4">Confidence</th>
                      <th className="text-right py-2">Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.association_rules as Array<{antecedent: string[]; consequent: string; confidence: number; support: number}>).slice(0, 5).map((rule, i) => (
                      <tr key={i} className="border-b border-gray-800/40 hover:bg-white/2">
                        <td className="py-2 pr-4 font-mono text-cyan-400/80">{rule.antecedent?.join(' ∧ ')}</td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded text-xs
                            ${rule.consequent === 'phishing' ? 'bg-red-500/20 text-red-400' :
                              rule.consequent === 'suspicious' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-green-500/20 text-green-400'}`}>
                            {rule.consequent}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right text-white font-mono">{(rule.confidence * 100).toFixed(1)}%</td>
                        <td className="py-2 text-right text-gray-500 font-mono">{(rule.support * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Scan History ──────────────────────────────────────────────────────────
function ScanHistory({ token }: { token: string }) {
  const [scans, setScans] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scanApi.getHistory(token).then((d) => setScans(d.scans || [])).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const statusCfg: Record<string, string> = {
    phishing: 'bg-red-500/10 text-red-400 border-red-500/30',
    suspicious: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    legitimate: 'bg-green-500/10 text-green-400 border-green-500/30',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="p-2 bg-cyan-500/10 rounded-lg text-base">📋</span>
          Scan History
        </h2>
        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">{scans.length} records</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="glass-card p-4">
              <div className="skeleton h-4 w-3/4 rounded mb-2" />
              <div className="skeleton h-3 w-1/3 rounded" />
            </div>
          ))}
        </div>
      ) : scans.length === 0 ? (
        <div className="glass-card p-16 text-center border border-dashed border-gray-700">
          <div className="text-5xl mb-4 opacity-50">🔍</div>
          <h3 className="text-white font-semibold mb-2">No scans yet</h3>
          <p className="text-gray-600 text-sm">Scan a URL to see your history here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scans.map((scan, i) => (
            <div key={scan.id as string} className="glass-card-hover p-4 flex items-center gap-4"
              style={{ animationDelay: `${i * 50}ms` }}>
              <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold flex-shrink-0 ${statusCfg[scan.status as string] || statusCfg.legitimate}`}>
                {scan.status === 'phishing' ? '🚨' : scan.status === 'suspicious' ? '⚠️' : '✅'} {String(scan.status).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-200 font-mono truncate">{scan.url as string}</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {new Date(scan.created_at as string).toLocaleString()} ·{' '}
                  <span className="text-gray-500">{(scan.confidence as number)?.toFixed(1)}% confidence</span>
                </div>
              </div>
              <div className="text-xs text-gray-600 font-mono">{(scan.risk_score as number)?.toFixed(0)}<span className="text-gray-700">/100</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Reports ────────────────────────────────────────────────────────────────
function Reports({ token }: { token: string }) {
  const [scans, setScans] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scanApi.getHistory(token, 1, 100).then((d) => setScans(d.scans || [])).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const total = scans.length;
  const phishing = scans.filter(s => s.status === 'phishing').length;
  const suspicious = scans.filter(s => s.status === 'suspicious').length;
  const legitimate = scans.filter(s => s.status === 'legitimate').length;
  const avgRisk = total > 0 ? scans.reduce((a, s) => a + ((s.risk_score as number) || 0), 0) / total : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <span className="p-2 bg-cyan-500/10 rounded-lg text-base">📊</span>
        <h2 className="text-xl font-bold text-white">Reports & Analytics</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="glass-card p-6"><div className="skeleton h-8 w-16 rounded mb-2" /><div className="skeleton h-4 w-20 rounded" /></div>)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon="🔍" label="Total Scans"    value={total}      color="cyan"   delay={0} />
            <StatCard icon="✅" label="Legitimate"     value={legitimate} color="green"  delay={100} />
            <StatCard icon="⚠️" label="Suspicious"    value={suspicious} color="orange" delay={200} />
            <StatCard icon="🚨" label="Phishing Found" value={phishing}   color="red"    delay={300} />
          </div>

          {total > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Breakdown Bar */}
              <div className="glass-card p-6 border border-cyan-500/10">
                <h3 className="text-sm font-semibold text-white mb-4">Detection Breakdown</h3>
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex mb-3">
                  <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${(legitimate/total)*100}%` }} />
                  <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${(suspicious/total)*100}%` }} />
                  <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${(phishing/total)*100}%` }} />
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" />{((legitimate/total)*100).toFixed(0)}% Safe</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-full" />{((suspicious/total)*100).toFixed(0)}% Suspicious</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full" />{((phishing/total)*100).toFixed(0)}% Phishing</span>
                </div>
              </div>

              {/* Avg Risk */}
              <div className="glass-card p-6 border border-cyan-500/10">
                <h3 className="text-sm font-semibold text-white mb-4">Average Risk Score</h3>
                <div className="text-4xl font-bold font-mono mb-3"
                  style={{ color: avgRisk < 30 ? '#00ff88' : avgRisk < 60 ? '#ff9f43' : '#ff3366' }}>
                  {avgRisk.toFixed(1)}<span className="text-xl text-gray-600">/100</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${avgRisk}%`, background: avgRisk < 30 ? '#00ff88' : avgRisk < 60 ? '#ff9f43' : '#ff3366' }} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────
function Settings({ user, token, onUpdate }: {
  user: Record<string, unknown>; token: string; onUpdate: (u: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState(user?.name as string || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await (await import('@/lib/api')).authApi.updateProfile(token, { name });
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <span className="p-2 bg-cyan-500/10 rounded-lg text-base">⚙️</span>
        <h2 className="text-xl font-bold text-white">Profile Settings</h2>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Avatar */}
        <div className="glass-card p-6 border border-cyan-500/10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white">
            {(user?.name as string)?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-white font-semibold">{user?.name as string}</div>
            <div className="text-gray-500 text-sm">{user?.email as string}</div>
            <span className="text-xs px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full mt-1 inline-block capitalize">
              {user?.role as string}
            </span>
          </div>
        </div>

        <div className="glass-card p-6 border border-cyan-500/10 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="neon-input" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email Address</label>
            <input type="email" value={user?.email as string || ''} readOnly className="neon-input opacity-50 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Account Role</label>
            <input type="text" value={user?.role as string || 'user'} readOnly className="neon-input opacity-50 cursor-not-allowed capitalize" />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="neon-btn neon-btn-filled disabled:opacity-50 flex items-center gap-2">
            {saving ? (
              <><div className="w-3.5 h-3.5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />Saving...</>
            ) : saved ? (
              <><span>✅</span> Saved!</>
            ) : (
              <><span>💾</span> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, token, isLoading, logout, updateUser } = useAuth();
  const router = useRouter();
  const [activePage, setActivePage] = useState('scanner');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [scanStats] = useState({ total: 0, safe: 0, threats: 0, accuracy: 97.3 });

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user, router]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/');
  }, [logout, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-cyan-400/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-2 border border-cyan-400/30 rounded-full animate-ping" />
          </div>
          <div>
            <div className="text-white font-semibold text-center">Initializing PhishGuard</div>
            <div className="text-gray-500 text-xs text-center mt-1">Loading AI engine...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !token) return null;

  return (
    <div className="min-h-screen flex" style={{ background: '#070718' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar mobile */}
      <div className={`fixed md:hidden inset-y-0 left-0 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar active={activePage} onNavigate={(p) => { setActivePage(p); setSidebarOpen(false); }}
          user={user} onLogout={handleLogout} collapsed={false} onToggle={() => {}} />
      </div>

      {/* Sidebar desktop */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar active={activePage} onNavigate={setActivePage} user={user}
          onLogout={handleLogout} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-cyan-500/10"
          style={{ background: 'rgba(7,7,24,0.95)', backdropFilter: 'blur(12px)' }}>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div>
            <h1 className="text-base font-bold text-white">
              {activePage === 'scanner'  && '🔍 URL Scanner'}
              {activePage === 'history'  && '📋 Scan History'}
              {activePage === 'reports'  && '📊 Reports'}
              {activePage === 'settings' && '⚙️ Settings'}
            </h1>
            <p className="text-xs text-gray-500">
              Welcome back, <span className="text-cyan-400">{user.name}</span>
            </p>
          </div>

          {/* Quick stats */}
          <div className="ml-auto hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 border border-gray-800 rounded-xl">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">AI:</span>
              <span className="text-xs text-cyan-400 font-mono">{scanStats.accuracy}% accuracy</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 border border-gray-800 rounded-xl">
              <span className="text-xs text-gray-400">🛡️</span>
              <span className="text-xs text-gray-400">Protection:</span>
              <span className="text-xs text-green-400 font-bold">ACTIVE</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {activePage === 'scanner'  && <URLScanner token={token} />}
            {activePage === 'history'  && <ScanHistory token={token} />}
            {activePage === 'reports'  && <Reports token={token} />}
            {activePage === 'settings' && (
              <Settings
                user={user as unknown as Record<string, unknown>}
                token={token}
                onUpdate={(u) => updateUser(u as unknown as Parameters<typeof updateUser>[0])}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
