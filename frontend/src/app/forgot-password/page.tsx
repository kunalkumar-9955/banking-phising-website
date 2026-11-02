'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email address');
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      // Firebase throws for invalid email / user not found
      const msg = err instanceof Error ? err.message : 'Failed to send reset email';
      if (msg.includes('user-not-found') || msg.includes('invalid-email')) {
        setError('No account found with this email address.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero grid-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="relative w-12 h-12 transition-transform group-hover:scale-110">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl rotate-45" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            PhishGuard AI
          </span>
        </Link>

        <div className="glass-card p-8 neon-glow">

          {!sent ? (
            <>
              <div className="text-center mb-8">
                <div className="text-4xl mb-3">🔑</div>
                <h2 className="text-2xl font-bold text-white mb-1">Forgot Password?</h2>
                <p className="text-gray-400 text-sm">
                  Enter your email and we&apos;ll send you a reset link via Firebase.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-5 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="neon-input pl-10"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  id="forgot-password-btn"
                  className="w-full neon-btn neon-btn-filled py-3 disabled:opacity-60 transition-all hover:scale-[1.01]"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                      Sending reset email...
                    </div>
                  ) : '📧 Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-6xl mb-5 animate-bounce">📬</div>
              <h2 className="text-2xl font-bold text-white mb-3">Check Your Email!</h2>
              <p className="text-gray-400 text-sm mb-2">
                A password reset link has been sent to:
              </p>
              <p className="text-cyan-400 font-mono text-sm mb-6">{email}</p>
              <p className="text-gray-500 text-xs mb-6">
                Click the link in the email to reset your password. Check your spam folder if you don&apos;t see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="neon-btn text-sm px-4 py-2"
              >
                Send again
              </button>
            </div>
          )}

          <p className="text-center text-gray-500 text-sm mt-6">
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
