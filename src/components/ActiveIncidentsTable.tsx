import React from 'react';
import { Eye, Flame, Car, Stethoscope, Shield, AlertTriangle, Radio, Biohazard, Radiation, Waves, AlertOctagon, Cpu, Zap } from 'lucide-react';
import { Incident } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ActiveIncidentsTableProps {
  incidents: Incident[];
  onViewIncident: (inc: Incident) => void;
  onViewAll?: () => void;
}

const getIncidentTypeIcon = (type: string, isDark: boolean) => {
  switch (type) {
    case 'Fire':
      return <Flame size={14} className={isDark ? "text-rose-300" : "text-rose-600"} />;
    case 'Accident':
      return <Car size={14} className={isDark ? "text-amber-300" : "text-amber-600"} />;
    case 'Medical':
      return <Stethoscope size={14} className={isDark ? "text-teal-300" : "text-teal-600"} />;
    case 'Police':
      return <Shield size={14} className={isDark ? "text-sky-300" : "text-sky-600"} />;
    case 'Hazmat':
      return <Biohazard size={14} className={isDark ? "text-purple-300 animate-pulse" : "text-purple-600 animate-pulse"} />;
    case 'Radiation':
      return <Radiation size={14} className={isDark ? "text-yellow-300 animate-spin-slow" : "text-amber-600 animate-spin-slow"} />;
    case 'Disaster':
      return <Waves size={14} className={isDark ? "text-orange-300" : "text-orange-600"} />;
    default:
      return <AlertOctagon size={14} className={isDark ? "text-emerald-300" : "text-emerald-600"} />;
  }
};

const getPriorityBadge = (priority: string, isDark: boolean) => {
  switch (priority) {
    case 'High':
      return isDark ? 'text-rose-300 bg-rose-500/20 border-rose-400/35' : 'text-rose-700 bg-rose-50 border-rose-200';
    case 'Medium':
      return isDark ? 'text-amber-300 bg-amber-500/20 border-amber-400/35' : 'text-amber-700 bg-amber-50 border-amber-200';
    case 'Low':
      return isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/35' : 'text-emerald-700 bg-emerald-50 border-emerald-200';
    default:
      return isDark ? 'text-slate-300 bg-slate-500/20 border-slate-400/35' : 'text-slate-700 bg-slate-100 border-slate-200';
  }
};

const getStatusBadge = (status: string, isDark: boolean) => {
  switch (status) {
    case 'In Progress':
      return isDark ? 'text-sky-300 bg-sky-500/20 border-sky-400/35' : 'text-sky-700 bg-sky-50 border-sky-200';
    case 'Assigned':
      return isDark ? 'text-indigo-300 bg-indigo-500/20 border-indigo-400/35' : 'text-indigo-700 bg-indigo-50 border-indigo-200';
    case 'Resolved':
      return isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/35' : 'text-emerald-700 bg-emerald-50 border-emerald-200';
    default:
      return isDark ? 'text-slate-300 bg-slate-800 border-slate-700' : 'text-slate-700 bg-slate-100 border-slate-300';
  }
};

export const ActiveIncidentsTable: React.FC<ActiveIncidentsTableProps> = ({
  incidents,
  onViewIncident,
  onViewAll
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`border rounded-xl overflow-hidden flex flex-col transition-colors ${
      isDark ? 'bg-slate-900/90 border-slate-700/60 shadow-xs' : 'bg-white border-slate-200 shadow-xs'
    }`}>
      {/* Header */}
      <div className={`p-4 border-b flex justify-between items-center ${
        isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50/70'
      }`}>
        <h2 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Active Incidents</h2>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 dark:text-sky-400 light:text-sky-600 flex items-center gap-1 transition-colors cursor-pointer"
        >
          View All →
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className={`text-[11px] font-semibold uppercase tracking-wider border-b ${
            isDark ? 'bg-slate-800/70 text-slate-400 border-slate-700/60' : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            <tr>
              <th className="px-5 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Reported Time</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-800'}`}>
            {incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').slice(0, 5).map((inc) => (
              <tr key={inc.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                <td className={`px-5 py-3.5 font-mono font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{inc.id}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 font-medium">
                    {getIncidentTypeIcon(inc.type, isDark)}
                    <span>{inc.type}</span>
                  </div>
                </td>
                <td className={`px-5 py-3.5 font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{inc.location}</td>
                <td className={`px-4 py-3.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{inc.time}</td>
                <td className="px-4 py-3.5">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getPriorityBadge(inc.priority, isDark)}`}>
                    {inc.priority}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getStatusBadge(inc.status, isDark)}`}>
                    {inc.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => onViewIncident(inc)}
                      className={`px-2 py-1 rounded-lg transition-colors inline-flex items-center gap-1 text-[11px] font-bold border cursor-pointer ${
                        isDark 
                          ? 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border-sky-500/30' 
                          : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                      }`}
                      title="Run Autonomous Multi-Agent Dispatch Evaluation"
                    >
                      <Cpu size={12} className="text-sky-400" />
                      <span>Agent Trace</span>
                    </button>
                    <button
                      onClick={() => onViewIncident(inc)}
                      className={`p-1.5 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="View Incident Details"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
