import React, { useState, useEffect } from 'react';
import { Activity, Bell, Calendar, Menu, LogOut, Shield, PhoneCall, Radio, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  currentView: string;
  unreadAlertsCount?: number;
  onToggleSidebar?: () => void;
  onAlertsClick?: () => void;
  onRadioCallClick?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, unreadAlertsCount = 0, onToggleSidebar, onAlertsClick, onRadioCallClick, onLogout }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setDateStr(now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={`h-16 border-b flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 transition-colors ${
      isDark ? 'bg-[#0f172a] border-slate-800/80' : 'bg-white border-slate-200'
    }`}>
      {/* Left Title & Status */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`md:hidden p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="text-rose-500 flex items-center justify-center">
            <Activity size={22} />
          </div>
          <div>
            <h1 className={`text-sm sm:text-base font-bold tracking-tight flex items-center gap-2 ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {currentView}
            </h1>
            <p className={`text-[11px] font-normal hidden sm:block ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Emergency operations center overview
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Selector Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
            isDark 
              ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700' 
              : 'bg-slate-100 text-amber-600 border-slate-200 hover:bg-slate-200'
          }`}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} theme`}
        >
          {isDark ? <Moon size={14} className="text-amber-400" /> : <Sun size={14} className="text-amber-500" />}
          <span className="hidden sm:inline">
            {isDark ? 'Dark' : 'Light'}
          </span>
        </button>

        {/* Tactical 2-Way Radio Call Launcher */}
        {onRadioCallClick && (
          <button
            onClick={onRadioCallClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isDark
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
            title="Launch 2-Way Tactical Radio Voice Call"
          >
            <PhoneCall size={14} />
            <span className="hidden sm:inline">Radio</span>
          </button>
        )}

        {/* System Status */}
        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
          isDark 
            ? 'bg-slate-800/50 border-slate-800 text-slate-300' 
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-medium text-[11px]">System Active</span>
        </div>

        {/* Notifications */}
        <button
          onClick={onAlertsClick}
          className={`relative p-2 rounded-lg border transition-colors ${
            isDark 
              ? 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border-slate-700' 
              : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
          }`}
          title={unreadAlertsCount > 0 ? `${unreadAlertsCount} Unread Notifications` : 'Notifications & Alerts'}
        >
          <Bell size={16} />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
              {unreadAlertsCount > 99 ? '99+' : unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Date & Time */}
        <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono ${
          isDark 
            ? 'text-slate-300 bg-slate-800/50 border-slate-700/60' 
            : 'text-slate-700 bg-slate-50 border-slate-200'
        }`}>
          <Calendar size={13} className={isDark ? "text-slate-400" : "text-slate-500"} />
          <span className="font-medium">{dateStr || 'Today'}</span>
          <span className={isDark ? "text-slate-600" : "text-slate-300"}>|</span>
          <span className="font-semibold">{timeStr}</span>
        </div>

        {/* Field Responder Terminal Link */}
        <button
          onClick={() => { window.location.hash = '#responder'; }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs ${
            isDark
              ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40'
              : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600'
          }`}
          title="Open Field Responder Mobile Terminal"
        >
          <Radio size={14} className="text-white shrink-0" />
          <span className="text-white font-semibold whitespace-nowrap">Field Terminal</span>
        </button>

        {/* User Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              isDark 
                ? 'text-slate-400 hover:text-rose-400 border-slate-800 hover:bg-rose-500/10 hover:border-rose-500/30' 
                : 'text-slate-600 hover:text-rose-600 border-slate-200 hover:bg-rose-50 hover:border-rose-200'
            }`}
            title="Log out"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};
