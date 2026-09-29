import React from 'react';
import { Flame, Ambulance, Shield, Users, PlusCircle } from 'lucide-react';
import { Vehicle } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ResourceOverviewProps {
  vehicles?: Vehicle[];
  onViewAll?: () => void;
}

export const ResourceOverview: React.FC<ResourceOverviewProps> = ({ vehicles = [], onViewAll }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const fireTotal = vehicles.filter(v => v.type === 'Fire').length || 6;
  const fireAvail = vehicles.filter(v => v.type === 'Fire' && v.status === 'Available').length;

  const ambTotal = vehicles.filter(v => v.type === 'Ambulance').length || 6;
  const ambAvail = vehicles.filter(v => v.type === 'Ambulance' && v.status === 'Available').length;

  const policeTotal = vehicles.filter(v => v.type === 'Police').length || 8;
  const policeAvail = vehicles.filter(v => v.type === 'Police' && v.status === 'Available').length;

  const rescueTotal = vehicles.filter(v => v.type === 'Rescue').length || 4;
  const rescueAvail = vehicles.filter(v => v.type === 'Rescue' && v.status === 'Available').length;

  const resources = [
    {
      name: 'Fire Engines',
      icon: Flame,
      current: fireAvail,
      total: fireTotal,
      status: fireAvail > 0 ? 'Available' : 'All Dispatched',
      barColor: 'bg-rose-400',
      iconBg: isDark ? 'text-rose-300 bg-rose-400/15 border border-rose-400/25' : 'text-rose-600 bg-rose-50 border border-rose-100'
    },
    {
      name: 'Ambulances',
      icon: Ambulance,
      current: ambAvail,
      total: ambTotal,
      status: ambAvail > 0 ? 'Available' : 'All Dispatched',
      barColor: 'bg-emerald-400',
      iconBg: isDark ? 'text-emerald-300 bg-emerald-400/15 border border-emerald-400/25' : 'text-emerald-600 bg-emerald-50 border border-emerald-100'
    },
    {
      name: 'Police Units',
      icon: Shield,
      current: policeAvail,
      total: policeTotal,
      status: policeAvail > 0 ? 'Available' : 'All Dispatched',
      barColor: 'bg-sky-400',
      iconBg: isDark ? 'text-sky-300 bg-sky-400/15 border border-sky-400/25' : 'text-sky-600 bg-sky-50 border border-sky-100'
    },
    {
      name: 'Rescue Squads',
      icon: Users,
      current: rescueAvail,
      total: rescueTotal,
      status: rescueAvail > 0 ? 'Available' : 'All Dispatched',
      barColor: 'bg-amber-300',
      iconBg: isDark ? 'text-amber-300 bg-amber-400/15 border border-amber-400/25' : 'text-amber-600 bg-amber-50 border border-amber-100'
    },
    {
      name: 'Medical Teams',
      icon: PlusCircle,
      current: Math.max(0, ambAvail * 2),
      total: ambTotal * 2,
      status: 'Active Grid',
      barColor: 'bg-teal-300',
      iconBg: isDark ? 'text-teal-300 bg-teal-400/15 border border-teal-400/25' : 'text-teal-600 bg-teal-50 border border-teal-100'
    }
  ];

  return (
    <div className={`border rounded-xl p-4 flex flex-col transition-colors ${
      isDark ? 'bg-slate-900/90 border-slate-700/60 shadow-xs' : 'bg-white border-slate-200 shadow-xs'
    }`}>
      {/* Header */}
      <div className={`flex justify-between items-center mb-3.5 pb-2 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <h2 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Resource Overview</h2>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 dark:text-sky-400 light:text-sky-600 flex items-center gap-1 transition-colors cursor-pointer"
        >
          View All →
        </button>
      </div>

      {/* Resource Rows */}
      <div className="space-y-3.5">
        {resources.map((item) => {
          const Icon = item.icon;
          const percentage = item.total > 0 ? Math.round((item.current / item.total) * 100) : 0;
          return (
            <div key={item.name} className="flex items-center gap-3 text-xs">
              <div className={`p-1.5 rounded-lg shrink-0 ${item.iconBg}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-[11px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {item.current} / {item.total}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        item.current > 0
                          ? isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : isDark ? 'text-amber-300 bg-amber-500/20 border-amber-400/30' : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700/60' : 'bg-slate-100'}`}>
                  <div
                    className={`h-full ${item.barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
