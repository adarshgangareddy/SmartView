import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { IoTBackground } from '../components/IoTBackground';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('smartcontrol_remembered_email') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return Boolean(localStorage.getItem('smartcontrol_remembered_email'));
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    document.title = 'SmartControl — IoT Operations Platform';
  }, []);

  const sanitizeError = (err) => {
    const rawMsg = (err?.message || '').toLowerCase();

    // Network / connectivity issues
    if (
      rawMsg.includes('network') ||
      rawMsg.includes('failed to fetch') ||
      rawMsg.includes('econnrefused') ||
      rawMsg.includes('timeout') ||
      rawMsg.includes('connection') ||
      rawMsg.includes('unable to connect')
    ) {
      return 'Unable to connect. Please try again.';
    }

    // Invalid credentials
    if (
      rawMsg.includes('invalid') ||
      rawMsg.includes('credential') ||
      rawMsg.includes('password') ||
      rawMsg.includes('unauthorized') ||
      rawMsg.includes('401')
    ) {
      return 'Invalid email or password.';
    }

    // Rate limiting
    if (rawMsg.includes('too many') || rawMsg.includes('rate limit') || rawMsg.includes('429')) {
      return 'Too many login attempts. Please try again in a few minutes.';
    }

    // Generic fallback - prevents exposing DB errors, stack traces, Supabase/MQTT errors
    return 'Something went wrong. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setError('');
    setInfoMessage('');
    setIsLoading(true);

    try {
      await login(email.trim(), password);

      // Handle remember me safely (store email only, never password)
      try {
        if (rememberMe) {
          localStorage.setItem('smartcontrol_remembered_email', email.trim());
        } else {
          localStorage.removeItem('smartcontrol_remembered_email');
        }
      } catch {
        // Ignore localStorage quota or privacy restrictions
      }

      navigate('/dashboard');
    } catch (err) {
      setError(sanitizeError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setError('');
    setInfoMessage('Please contact your system administrator or IT operations team to reset your enterprise credentials.');
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Subtle IoT telemetry & network canvas background */}
      <IoTBackground />

      <main className="w-full max-w-[420px] relative z-10 my-auto">
        {/* Production Brand Header */}
        <header className="text-center mb-6">
          {/* Minimal IoT Platform Logo Mark */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900/90 border border-slate-700/80 mb-3 shadow-md shadow-black/40 ring-1 ring-white/5">
            <svg
              className="w-6 h-6 text-emerald-400"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M16 6 L26 12 L26 24 L16 28 L6 24 L6 12 Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-30"
              />
              <path
                d="M16 6 L16 16 M26 12 L16 16 M26 24 L16 16 M16 28 L16 16 M6 24 L16 16 M6 12 L16 16"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-60"
              />
              <circle cx="16" cy="6" r="1.8" fill="#34d399" />
              <circle cx="26" cy="12" r="1.8" fill="#38bdf8" />
              <circle cx="26" cy="24" r="1.8" fill="#34d399" />
              <circle cx="16" cy="28" r="1.8" fill="#38bdf8" />
              <circle cx="6" cy="24" r="1.8" fill="#34d399" />
              <circle cx="6" cy="12" r="1.8" fill="#38bdf8" />
              <circle cx="16" cy="16" r="3" fill="#10b981" />
              <circle cx="16" cy="16" r="4.5" stroke="#34d399" strokeWidth="1" className="opacity-70" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            SmartControl
          </h1>
          <p className="text-xs font-medium tracking-wider text-slate-400 mt-1 uppercase font-mono">
            IoT Operations Platform
          </p>
        </header>

        {/* Login Card */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/80 backdrop-blur-sm ring-1 ring-white/5">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-200">
              Sign in to your account
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
            {/* Error State */}
            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="flex-1 leading-relaxed">{error}</span>
                <button
                  type="button"
                  onClick={() => setError('')}
                  aria-label="Dismiss error"
                  className="text-rose-400 hover:text-rose-200 p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Information Notice (e.g. Forgot Password) */}
            {infoMessage && (
              <div
                role="status"
                className="p-3 rounded-lg bg-slate-950/80 border border-slate-700/80 text-slate-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
              >
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="flex-1 leading-relaxed">{infoMessage}</span>
                <button
                  type="button"
                  onClick={() => setInfoMessage('')}
                  aria-label="Dismiss message"
                  className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Work email field */}
            <div>
              <label
                htmlFor="work-email"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Work email
              </label>
              <div className="relative">
                <Mail
                  className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="work-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  enterKeyHint="next"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="you@company.com"
                  className="w-full bg-slate-950/90 border border-slate-700/90 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/80 focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  enterKeyHint="done"
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your password"
                  className="w-full bg-slate-950/90 border border-slate-700/90 rounded-lg pl-10 pr-11 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/80 focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none focus:text-slate-200 p-1 rounded transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between pt-1">
              <label
                htmlFor="remember-me"
                className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                <input
                  id="remember-me"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-colors"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-slate-400 hover:text-emerald-400 focus:outline-none focus:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-emerald-950/40 hover:shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed select-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>SIGN IN</span>
              )}
            </button>
          </form>
        </section>

        {/* Minimal Footer */}
        <footer className="text-center mt-6 text-xs text-slate-500 select-none">
          © 2026 SmartControl
        </footer>
      </main>
    </div>
  );
};
