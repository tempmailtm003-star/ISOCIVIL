import React from 'react';
import { ActivityItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ActivityFeedProps {
  activities?: ActivityItem[];
  onViewAll?: () => void;
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    time: '10:41 AM',
    text: 'Police Unit PV-23 assigned to INC-2025-015',
    color: 'blue'
  },
  {
    id: '2',
    time: '10:40 AM',
    text: 'Fire Engine FE-12 reached the incident location',
    color: 'red'
  },
  {
    id: '3',
    time: '10:39 AM',
    text: 'Ambulance AMB-07 dispatched to INC-2025-014',
    color: 'green'
  },
  {
    id: '4',
    time: '10:38 AM',
    text: 'New incident reported: Fire at Kilpauk',
    color: 'red'
  },
  {
    id: '5',
    time: '10:32 AM',
    text: 'Incident INC-2025-014 assigned to Traffic Police',
    color: 'blue'
  }
];

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities = DEFAULT_ACTIVITIES, onViewAll }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const displayActivities = activities.length > 0 ? activities : DEFAULT_ACTIVITIES;

  const getDotStyle = (color: string) => {
    switch (color) {
      case 'red':
        return isDark ? 'bg-rose-400' : 'bg-rose-500';
      case 'green':
        return isDark ? 'bg-emerald-400' : 'bg-emerald-500';
      case 'amber':
        return isDark ? 'bg-amber-400' : 'bg-amber-500';
      default:
        return isDark ? 'bg-sky-400' : 'bg-sky-500';
    }
  };

  return (
    <div className={`border rounded-2xl p-4 flex flex-col transition-colors shadow-xs ${
      isDark ? 'bg-slate-900/90 border-slate-700/60' : 'bg-white border-slate-200'
    }`}>
      {/* Header */}
      <div className={`flex justify-between items-center mb-3 pb-2 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <h2 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Activity Feed</h2>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 dark:text-sky-400 light:text-sky-600 flex items-center gap-1 transition-colors cursor-pointer"
        >
          View All →
        </button>
      </div>

      {/* Timeline Items */}
      <div className="space-y-3">
        {displayActivities.slice(0, 6).map((item) => (
          <div key={item.id} className="flex items-center gap-3 text-xs">
            <span className={`w-2 h-2 rounded-full shrink-0 ${getDotStyle(item.color)}`}></span>
            <span className={`font-mono text-[11px] shrink-0 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.time}</span>
            <span className={`font-medium truncate ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
