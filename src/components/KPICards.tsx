import React from 'react';
import { AlertTriangle, Users, Building2, Car, Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface KPICardsProps {
  activeIncidentsCount?: number;
  respondersCount?: number;
  hospitalsCount?: number;
  resourcesCount?: number;
  alertsCount?: number;
  onViewUnits?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  activeIncidentsCount = 15,
  respondersCount = 128,
  hospitalsCount = 24,
  resourcesCount = 64,
  alertsCount = 7,
  onViewUnits
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. Active Incidents */}
      <div className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-700/60 hover:border-slate-600 shadow-xs' 
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Incidents</span>
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
            isDark 
              ? 'bg-rose-500/15 border-rose-400/30 text-rose-300' 
              : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}>
            <AlertTriangle size={15} />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-bold tracking-tight font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeIncidentsCount}</div>
          <div className={`text-[11px] font-medium mt-1 flex items-center gap-1 ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
            <span>↗</span> 3 new today
          </div>
        </div>
      </div>

      {/* 2. Responders Deployed */}
      <div className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-700/60 hover:border-slate-600 shadow-xs' 
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Responders Deployed</span>
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
            isDark 
              ? 'bg-sky-500/15 border-sky-400/30 text-sky-300' 
              : 'bg-sky-50 border-sky-200 text-sky-600'
          }`}>
            <Users size={15} />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-bold tracking-tight font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{respondersCount}</div>
          <button
            onClick={onViewUnits}
            className="text-[11px] font-medium text-sky-400 hover:text-sky-300 mt-1 flex items-center gap-1 transition-colors cursor-pointer"
          >
            View all units →
          </button>
        </div>
      </div>

      {/* 3. Hospitals Available */}
      <div className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-700/60 hover:border-slate-600 shadow-xs' 
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hospitals Available</span>
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
            isDark 
              ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            <Building2 size={15} />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-bold tracking-tight font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{hospitalsCount}</div>
          <div className={`text-[11px] font-medium mt-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
            78% Capacity
          </div>
        </div>
      </div>

      {/* 4. Resources On Field */}
      <div className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-700/60 hover:border-slate-600 shadow-xs' 
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Resources On Field</span>
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
            isDark 
              ? 'bg-amber-500/15 border-amber-400/30 text-amber-300' 
              : 'bg-amber-50 border-amber-200 text-amber-600'
          }`}>
            <Car size={15} />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-bold tracking-tight font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{resourcesCount}</div>
          <div className={`text-[11px] font-medium mt-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
            Vehicles & Equipments
          </div>
        </div>
      </div>

      {/* 5. Active Alerts */}
      <div className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
        isDark 
          ? 'bg-slate-900/90 border-slate-700/60 hover:border-slate-600 shadow-xs' 
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Alerts</span>
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
            isDark 
              ? 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300' 
              : 'bg-indigo-50 border-indigo-200 text-indigo-600'
          }`}>
            <Bell size={15} />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-2xl font-bold tracking-tight font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{alertsCount}</div>
          <div className={`text-[11px] font-medium mt-1 flex items-center gap-1 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
            <span>↗</span> High Priority
          </div>
        </div>
      </div>
    </div>
  );
};
