import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, Eye, EyeOff, CheckCircle2, Radio, Activity, KeyRound, Zap } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  const handleAutoLogin = () => {
    setError(null);
    setUsername('watchdogs');
    setPassword('guruchan');
    setIsLoading(true);
    setIsAutoLoggingIn(true);

    setTimeout(() => {
      setIsLoading(false);
      setAuthSuccess(true);
      setTimeout(() => {
        onLoginSuccess('watchdogs');
      }, 600);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Please enter commander callsign and passkey... Enter valid credentials.');
      return;
    }

    setIsLoading(true);

    // Validate credentials: name: watchdogs | password: guruchan
    setTimeout(() => {
      if (trimmedUser.toLowerCase() === 'watchdogs' && trimmedPass === 'guruchan') {
        setIsLoading(false);
        setAuthSuccess(true);
        setTimeout(() => {
          onLoginSuccess(trimmedUser);
        }, 800);
      } else {
        setIsLoading(false);
        setError('Invalid commander callsign / security passkey... Enter valid credentials.');
      }
    }, 700);
  };

  return (
    <div className="login-screen-forced-dark dark theme-dark min-h-screen bg-[#070b14] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none text-slate-100">
      {/* Tactical Grid & Radar Background Elements */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Ambient Lighting Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="login-card relative z-10 w-full max-w-md bg-[#0a0f1d]/95 backdrop-blur-xl border border-[#1e2c45] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Top Security Clearance Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-amber-500 to-blue-500" />

        <div className="p-7 sm:p-9">
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-3">
              <div className="login-logo-box w-16 h-16 rounded-2xl bg-[#0e172a] border-2 border-[#253859] flex items-center justify-center text-red-500 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
                <Activity size={32} className="animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0a0f1d] rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </span>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-blue-400" />
              <h1 className="text-xl font-bold tracking-tight text-slate-100">
                ERC Tactical Command
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Emergency Response & Incident Management System
            </p>

            <div className="login-badge mt-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111c30] border border-[#203456] text-[11px] text-blue-300 font-mono">
              <Radio size={12} className="text-emerald-400 animate-pulse" />
              <span>DEFCON-2 • SECURE ACCESS GATEWAY</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-400 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Notification */}
          {authSuccess && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center gap-2.5 text-emerald-300 text-xs font-mono">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>Clearance Verified. Initializing Tactical Console...</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Callsign Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Commander Callsign / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter commander callsign"
                  autoComplete="username"
                  disabled={isLoading || authSuccess}
                  className="w-full bg-[#080d19] border border-[#1d2b45] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 transition-all outline-none font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Security Passkey / Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passkey"
                  autoComplete="current-password"
                  disabled={isLoading || authSuccess}
                  className="w-full bg-[#080d19] border border-[#1d2b45] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-600 transition-all outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading || authSuccess}
              className={`w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                authSuccess
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950 border border-emerald-300 shadow-emerald-400/30'
                  : 'bg-sky-400 hover:bg-sky-300 text-slate-950 border border-sky-300 shadow-sky-400/30 active:scale-[0.98]'
              }`}
            >
              {isLoading && !isAutoLoggingIn ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authorizing Clearance...</span>
                </>
              ) : authSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Access Granted</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Authorize & Enter Console</span>
                </>
              )}
            </button>

            {/* 1-Click Auto Login Button */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1d2b45]" />
              </div>
              <span className="relative bg-[#0a0f1d] px-2.5 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Instant Access
              </span>
            </div>

            <button
              id="btn-one-click-auto-login"
              type="button"
              onClick={handleAutoLogin}
              disabled={isLoading || authSuccess}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-blue-500/15 hover:from-emerald-500/25 hover:via-cyan-500/25 hover:to-blue-500/25 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 hover:text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] active:scale-[0.98] cursor-pointer group"
              title="Instantly sign in with pre-configured Watchdogs commander clearance"
            >
              {isAutoLoggingIn ? (
                <>
                  <span className="w-4 h-4 border-2 border-emerald-300/30 border-t-emerald-300 rounded-full animate-spin" />
                  <span>Authenticating Auto Login...</span>
                </>
              ) : (
                <>
                  <Zap size={15} className="text-amber-400 group-hover:scale-110 transition-transform animate-pulse" />
                  <span>1-Click Auto Login</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center border-t border-[#1d2b45] pt-4">
             <a href="#responder" className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-center gap-1.5 transition-colors">
                <Radio size={14} />
                Access Field Responder Terminal
             </a>
          </div>
        </div>

        {/* Footer Security Notice */}
        <div className="py-2.5 px-6 bg-[#060913] border-t border-[#141e33] flex items-center justify-between text-[10px] text-slate-500">
          <span>256-BIT TACTICAL ENCRYPTION</span>
          <span>NODE: CHENNAI-ERC-01</span>
        </div>
      </div>
    </div>
  );
};
