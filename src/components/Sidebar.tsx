import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Layers,
  MapPin,
  Building2,
  Building,
  Bell,
  MessageSquare,
  Megaphone,
  Video,
  BarChart3,
  History,
  Users,
  Settings,
  Activity,
  LogOut
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  unreadAlertsCount?: number;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onLogout }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const operations = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Incidents', icon: AlertTriangle },
    { name: 'Resource Management', icon: Layers },
    { name: 'Dispatch Map', icon: MapPin },
    { name: 'Hospitals', icon: Building2 },
    { name: 'Departments', icon: Building },
    { name: 'Alerts & Notifications', icon: Bell },
  ];

  const communication = [
    { name: 'Secure Chat', icon: MessageSquare },
    { name: 'Announcements', icon: Megaphone },
    { name: 'Video Conference', icon: Video },
  ];

  const reports = [
    { name: 'Reports & Analytics', icon: BarChart3 },
    { name: 'Incident History', icon: History },
  ];

  const settings = [
    { name: 'User Management', icon: Users },
    { name: 'System Settings', icon: Settings },
    { name: 'Manual', icon: History },
  ];

  const renderNavGroup = (title: string, items: { name: string; icon: any }[]) => (
    <div className="mb-5 px-3">
      <p className={`text-[10px] font-bold uppercase tracking-wider px-3 mb-1.5 font-mono ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}>
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setCurrentView(item.name)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                isActive
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold shadow-xs'
                    : 'bg-blue-50 text-blue-700 border border-blue-200/90 font-bold shadow-xs'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
              }`}
            >
              <Icon size={16} className={isActive ? (isDark ? 'text-blue-400' : 'text-blue-600') : (isDark ? 'text-slate-400' : 'text-slate-500')} />
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className={`w-64 border-r flex flex-col shrink-0 h-screen select-none ${
      isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
    }`}>
      {/* Brand Header */}
      <div className={`p-4 sm:p-5 border-b flex items-center gap-3 ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
          isDark 
            ? 'bg-rose-500/20 border border-rose-400/30 text-rose-300'
            : 'bg-rose-50 border border-rose-200 text-rose-600 shadow-xs'
        }`}>
          <Activity size={20} />
        </div>
        <div>
          <h1 className={`font-bold text-sm tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            ERC Command
          </h1>
          <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Emergency Coordination
          </p>
        </div>
      </div>

      {/* Nav List */}
      <div className={`flex-1 overflow-y-auto py-3.5 ${
        isDark ? 'scrollbar-thin scrollbar-thumb-slate-800' : 'scrollbar-thin scrollbar-thumb-slate-300'
      }`}>
        {renderNavGroup('OPERATIONS', operations)}
        {renderNavGroup('COMMUNICATION', communication)}
        {renderNavGroup('REPORTS', reports)}
        {renderNavGroup('SETTINGS', settings)}
      </div>

      {/* User Profile */}
      <div className={`p-3.5 border-t flex items-center justify-between gap-2 ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/80'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="watchdogs"
            className={`w-8 h-8 rounded-full object-cover border shrink-0 ${
              isDark ? 'border-slate-700' : 'border-slate-300'
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>watchdogs</p>
            <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lead Commander</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className={`text-[10px] font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>Authorized</span>
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className={`p-2 rounded-lg border border-transparent transition-colors ${
              isDark 
                ? 'text-slate-400 hover:text-rose-300 hover:bg-rose-500/15'
                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
            }`}
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
};
