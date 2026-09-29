import React, { useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  ShieldAlert,
 

  Filter,
  Plus,
  Download,
  Building2,
  BellRing,
  UserPlus,
  Settings,
  Trash2,
  Power,
  BarChart3,
  Clock,
  Activity,
  Flame,
  Car,
  Stethoscope,
  Shield,
  CheckCircle2,
  Wrench,
  Video,
  Megaphone,
  Radio,
  Play,
  Pause,
 
  Search,
  Eye,
  Zap,
  ArrowRightLeft,
  Navigation,
  Fuel,
  Lock,
  Mic,
  Send,
  Bed,
  Phone,
  PhoneCall,
  MapPin,
  AlertTriangle,
  HeartPulse,
  Unlock,
  Sliders,
  X,
  Check,
  Crosshair,
  Sun,
  Moon,
  Palette,
  Monitor,
  ClipboardCheck,
  Cpu
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Incident, ResourceItem, Vehicle, ChatChannel, ChatMessage, Hospital, PoliceStation, FireStation, AppNotification, EmergencySanctuary } from '../types';
import { CHENNAI_HOSPITALS } from '../data/hospitalsData';
import { CHENNAI_POLICE_STATIONS, CHENNAI_FIRE_STATIONS } from '../data/stationsData';
import { calculateDistanceKm, calculateEtaMinutes, playRadioChirp, getUnitStyles, getUnitCategory } from '../utils/tacticalUtils';
import { CommunicationCenter } from './CommunicationCenter';

export const IncidentsView: React.FC<{
  incidents: Incident[];
  onViewIncident: (inc: Incident) => void;
  onAdd: () => void;
}> = ({ incidents, onViewIncident, onAdd }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [filterType, setFilterType] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = incidents.filter(i => {
    if (i.status === 'Resolved' || i.status === 'Closed') return false;
    const matchType = filterType === 'All' || i.type === filterType;
    const matchSearch =
      !search ||
      i.location.toLowerCase().includes(search.toLowerCase()) ||
      i.id.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>All Emergency Incidents</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Manage real-time dispatch and workflow tracking</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 w-40 sm:w-56 border ${
                isDark ? 'bg-[#111927] border-[#1d2a42] text-slate-200' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
              }`}
            />
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Plus size={15} /> New Incident
          </button>
        </div>
      </div>

      <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors ${
        isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className={`p-3 border-b flex gap-2 overflow-x-auto ${
          isDark ? 'border-[#172338] bg-[#0d1322]/50' : 'border-slate-200 bg-slate-50'
        }`}>
          {['All', 'Fire', 'Medical', 'Accident', 'Other'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filterType === type
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                  : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className={`text-[11px] font-semibold uppercase tracking-wider border-b ${
            isDark ? 'bg-[#0e1626]/80 text-slate-400 border-[#172338]' : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}>
            <tr>
              <th className="px-5 py-3.5">ID</th>
              <th className="px-4 py-3.5">Type</th>
              <th className="px-5 py-3.5">Location</th>
              <th className="px-4 py-3.5">Reported Time</th>
              <th className="px-4 py-3.5">Priority</th>
              <th className="px-4 py-3.5">Workflow Status</th>
              <th className="px-4 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#151f32] text-slate-300' : 'divide-slate-200 text-slate-800'}`}>
            {filtered.map(inc => (
              <tr key={inc.id} className={`transition-colors ${isDark ? 'hover:bg-[#111927]/60' : 'hover:bg-slate-50'}`}>
                <td className={`px-5 py-3.5 font-mono font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{inc.id}</td>
                <td className="px-4 py-3.5 font-medium">{inc.type}</td>
                <td className={`px-5 py-3.5 font-medium ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{inc.location}</td>
                <td className={`px-4 py-3.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{inc.time}</td>
                <td className="px-4 py-3.5">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                      inc.priority === 'High'
                        ? isDark ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-red-800 bg-red-50 border-red-200'
                        : isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-amber-800 bg-amber-50 border-amber-200'
                    }`}
                  >
                    {inc.priority}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                    isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
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
                      className={`p-1.5 rounded-lg transition-colors inline-flex cursor-pointer ${
                        isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="View Details"
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

export const ResourceManagementView: React.FC<{
  resources: any[];
  vehicles?: Vehicle[];
  onUpdateResourceStatus: (id: string) => void;
  onAdd: () => void;
  onDispatchVehicle?: (vehicleId: string, incidentId: string) => void;
  onOpenCommsWithVehicle?: (vehicleId: string) => void;
  onOpenRadioCall?: (target: { type: 'Unit' | 'Channel'; id: string; name: string; vehicle?: Vehicle }) => void;
  onInspectVehicle?: (vehicle: Vehicle) => void;
}> = ({ resources, vehicles = [], onUpdateResourceStatus, onAdd, onDispatchVehicle, onOpenCommsWithVehicle, onOpenRadioCall, onInspectVehicle }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Fire', 'Ambulance', 'Police', 'Rescue', 'Hazmat', 'Drone', 'Marine', 'Maintenance'];

  const filteredVehicles = vehicles.filter(v => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Maintenance') return v.status === 'Maintenance';
    return v.type.toLowerCase().includes(activeFilter.toLowerCase());
  });

  const availableCount = vehicles.filter(v => v.status === 'Available').length;
  const dispatchedCount = vehicles.filter(v => v.status === 'Dispatched' || v.status === 'En Route' || v.status === 'On Scene').length;
  const totalCount = vehicles.length;
  const maintenanceCount = vehicles.filter(v => v.status === 'Maintenance').length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Emergency Response Fleet & Resources</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Live operational status, proximity telemetry, and dispatch assignment</p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenRadioCall && (
            <button
              onClick={() => onOpenRadioCall({ type: 'Unit', id: vehicles[0]?.id || 'FE-12', name: vehicles[0]?.name || 'Fire Engine', vehicle: vehicles[0] })}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors border cursor-pointer ${
                isDark 
                  ? 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-700'
              }`}
            >
              <PhoneCall size={14} className={isDark ? "text-emerald-400" : "text-white"} />
              <span>Radio Dispatch Call</span>
            </button>
          )}
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Plus size={15} /> Add Fleet Unit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveFilter('All')}
          className={`border rounded-2xl p-4 flex items-center justify-between shadow-xs cursor-pointer transition-all ${
            isDark 
              ? 'bg-[#0b101d] border-[#172338] hover:border-emerald-500/40' 
              : 'bg-white border-slate-200 hover:border-emerald-400'
          }`}
          title="Click to view all available units"
        >
          <div>
            <p className={`text-[11px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Available Units</p>
            <p className={`text-2xl font-black mt-1 font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {availableCount}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
            <CheckCircle2 size={22} />
          </div>
        </div>
        <div className={`border rounded-2xl p-4 flex items-center justify-between shadow-xs ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className={`text-[11px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Dispatched / En Route</p>
            <p className={`text-2xl font-black mt-1 font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {dispatchedCount}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600 border border-blue-200'}`}>
            <Zap size={22} />
          </div>
        </div>
        <div 
          onClick={() => setActiveFilter('All')}
          className={`border rounded-2xl p-4 flex items-center justify-between shadow-xs cursor-pointer transition-all ${
            isDark 
              ? 'bg-[#0b101d] border-[#172338] hover:border-purple-500/40' 
              : 'bg-white border-slate-200 hover:border-purple-400'
          }`}
          title="Click to view full fleet"
        >
          <div>
            <p className={`text-[11px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Field Fleet</p>
            <p className={`text-2xl font-black mt-1 font-mono ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{totalCount}</p>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600 border border-purple-200'}`}>
            <Activity size={22} />
          </div>
        </div>
        <div 
          onClick={() => setActiveFilter('Maintenance')}
          className={`border rounded-2xl p-4 flex items-center justify-between shadow-xs cursor-pointer transition-all ${
            activeFilter === 'Maintenance'
              ? isDark 
                ? 'bg-amber-950/40 border-amber-500/60 ring-2 ring-amber-500/30' 
                : 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/50'
              : isDark 
              ? 'bg-[#0b101d] border-[#172338] hover:border-amber-500/40' 
              : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
          title="Click to filter units Under Maintenance"
        >
          <div>
            <p className={`text-[11px] font-semibold uppercase ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Under Maintenance</p>
            <p className={`text-2xl font-black mt-1 font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{maintenanceCount}</p>
          </div>
          <div className={`p-3 rounded-xl border ${
            isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-600 border-amber-200'
          }`}>
            <Wrench size={22} />
          </div>
        </div>
      </div>

      {/* Fleet Table */}
      <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors ${
        isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        {/* Selection of units row - pure white bg with black outline buttons in light mode */}
        <div className={`p-3 border-b flex gap-2 overflow-x-auto ${
          isDark ? 'border-[#172338] bg-[#0d1322]/50' : 'border-slate-200 bg-white'
        }`}>
          {filters.map(f => {
            const isSelected = activeFilter === f;
            if (f === 'Fire') {
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isDark
                      ? isSelected
                        ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)] border border-red-500'
                        : 'text-red-400 hover:bg-red-950/40 hover:text-red-200 border border-red-500/20'
                      : isSelected
                      ? 'bg-white text-red-700 border-2 border-red-600 shadow-xs font-bold'
                      : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <Flame size={13} className={isDark ? (isSelected ? 'text-white' : 'text-red-400') : (isSelected ? 'text-red-600' : 'text-slate-700')} />
                  <span>Fire Engines</span>
                </button>
              );
            }
            if (f === 'Police') {
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isDark
                      ? isSelected
                        ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)] border border-blue-500'
                        : 'text-blue-400 hover:bg-blue-950/40 hover:text-blue-200 border border-blue-500/20'
                      : isSelected
                      ? 'bg-white text-blue-700 border-2 border-blue-600 shadow-xs font-bold'
                      : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <Shield size={13} className={isDark ? (isSelected ? 'text-white' : 'text-blue-400') : (isSelected ? 'text-blue-600' : 'text-slate-700')} />
                  <span>Police Patrol</span>
                </button>
              );
            }
            if (f === 'Ambulance') {
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isDark
                      ? isSelected
                        ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] border border-emerald-500'
                        : 'text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-200 border border-emerald-500/20'
                      : isSelected
                      ? 'bg-white text-emerald-700 border-2 border-emerald-600 shadow-xs font-bold'
                      : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <Stethoscope size={13} className={isDark ? (isSelected ? 'text-white' : 'text-emerald-400') : (isSelected ? 'text-emerald-600' : 'text-slate-700')} />
                  <span>Ambulances</span>
                </button>
              );
            }
            if (f === 'Maintenance') {
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isDark
                      ? isSelected
                        ? 'bg-amber-700 text-white shadow-[0_0_12px_rgba(217,119,6,0.5)] border border-amber-500'
                        : 'text-amber-400 hover:bg-amber-950/40 hover:text-amber-200 border border-amber-500/30'
                      : isSelected
                      ? 'bg-white text-amber-700 border-2 border-amber-600 shadow-xs font-bold'
                      : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <Wrench size={13} className={isDark ? (isSelected ? 'text-white' : 'text-amber-400') : (isSelected ? 'text-amber-600' : 'text-slate-700')} />
                  <span>Under Maintenance ({maintenanceCount})</span>
                </button>
              );
            }
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isDark
                    ? isSelected
                      ? 'bg-blue-600 text-white shadow-sm border border-blue-500 font-bold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                    : isSelected
                    ? 'bg-white text-slate-900 border-2 border-slate-900 shadow-xs font-bold'
                    : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 font-medium'
                }`}
              >
                {f === 'All' ? 'All Units' : f}
              </button>
            );
          })}
        </div>

        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className={`text-[11px] font-semibold uppercase tracking-wider border-b ${
            isDark ? 'bg-[#0e1626]/80 text-slate-400 border-[#172338]' : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}>
            <tr>
              <th className="px-5 py-3.5">Unit ID & Name</th>
              <th className="px-4 py-3.5">Type</th>
              <th className="px-5 py-3.5">Station Base</th>
              <th className="px-4 py-3.5">Crew / Driver</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Assigned Incident</th>
              <th className="px-4 py-3.5 text-center">Tactical Action</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#151f32] text-slate-300' : 'divide-slate-200 text-slate-800'}`}>
            {filteredVehicles.map(v => {
              const unitStyles = getUnitStyles(v.type || v.id, isDark);
              return (
                <tr key={v.id} className={`transition-colors ${isDark ? 'hover:bg-[#111927]/60' : 'hover:bg-slate-50'}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs border ${unitStyles.idBadge}`}>
                        {v.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {unitStyles.category === 'Fire' && <Flame size={13} className={isDark ? "text-red-400 shrink-0" : "text-red-600 shrink-0"} />}
                        {unitStyles.category === 'Police' && <Shield size={13} className={isDark ? "text-blue-400 shrink-0" : "text-blue-600 shrink-0"} />}
                        {unitStyles.category === 'Ambulance' && <Stethoscope size={13} className={isDark ? "text-emerald-400 shrink-0" : "text-emerald-600 shrink-0"} />}
                        {unitStyles.category === 'Hazmat' && <AlertTriangle size={13} className={isDark ? "text-yellow-400 shrink-0" : "text-amber-600 shrink-0"} />}
                        {unitStyles.category === 'Drone' && <Navigation size={13} className={isDark ? "text-violet-400 shrink-0" : "text-purple-600 shrink-0"} />}
                        {unitStyles.category === 'Marine' && <Zap size={13} className={isDark ? "text-cyan-400 shrink-0" : "text-cyan-600 shrink-0"} />}
                        {unitStyles.category === 'Rescue' && <Car size={13} className={isDark ? "text-orange-400 shrink-0" : "text-orange-600 shrink-0"} />}
                        <span className={`font-semibold ${isDark ? unitStyles.nameText : 'text-slate-900'}`}>{v.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${unitStyles.badge}`}>
                      {v.type}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{v.station}</td>
                  <td className={`px-4 py-3.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{v.driver}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                        v.status === 'Available'
                          ? isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-800 bg-emerald-50 border-emerald-300'
                          : v.status === 'Maintenance'
                          ? isDark ? 'text-slate-400 bg-slate-500/10 border-slate-500/30' : 'text-amber-800 bg-amber-50 border-amber-300'
                          : isDark ? 'text-blue-400 bg-blue-500/15 border-blue-500/30' : 'text-blue-800 bg-blue-50 border-blue-300'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                    {v.assignedIncidentId || '-'}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {onOpenRadioCall && (
                        <button
                          onClick={() => onOpenRadioCall({ type: 'Unit', id: v.id, name: v.name, vehicle: v })}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark 
                              ? 'text-emerald-400 hover:bg-emerald-950/60 border-emerald-500/30' 
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                          }`}
                          title={`Radio Call ${v.id}`}
                        >
                          <PhoneCall size={13} />
                        </button>
                      )}
                      {onOpenCommsWithVehicle && (
                        <button
                          onClick={() => onOpenCommsWithVehicle(v.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark 
                              ? 'text-blue-400 hover:bg-[#15233c] border-blue-500/20' 
                              : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
                          }`}
                          title="Open Direct Text Comms"
                        >
                          <Radio size={13} />
                        </button>
                      )}
                      {onInspectVehicle && (
                        <button
                          onClick={() => onInspectVehicle(v)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark 
                              ? 'text-sky-400 hover:bg-sky-950/60 border-sky-500/30' 
                              : 'text-sky-700 bg-sky-50 hover:bg-sky-100 border-sky-300'
                          }`}
                          title="Pre-Shift Equipment Inspection"
                        >
                          <ClipboardCheck size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => onUpdateResourceStatus(v.id)}
                        className={`px-2.5 py-1 font-bold rounded-lg border text-[11px] transition-all flex items-center gap-1 cursor-pointer ${
                          v.status === 'Maintenance'
                            ? isDark 
                              ? 'bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border-amber-500/40' 
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                            : isDark 
                            ? 'bg-[#15233c] hover:bg-[#1c3055] text-blue-300 border-blue-500/20' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                        title={v.status === 'Maintenance' ? 'Unit is in Maintenance. Click to restore or cycle status.' : 'Cycle unit status (Available -> Dispatched -> Maintenance)'}
                      >
                        {v.status === 'Maintenance' && <Wrench size={11} className={isDark ? "text-amber-400" : "text-amber-600"} />}
                        <span>{v.status === 'Maintenance' ? 'In Maint (Cycle)' : 'Cycle Status'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const FullSecureChatView: React.FC<{
  channels: ChatChannel[];
  activeChannelId: string;
  onSelectChannel: (id: string) => void;
  onCreateChannel: (channel: ChatChannel) => void;
  onRemoveChannel?: (channelId: string) => void;
  vehicles: Vehicle[];
  incidents: Incident[];
  onOpenRadioCall?: (target: { type: 'Unit' | 'Channel'; id: string; name: string; vehicle?: Vehicle; channel?: ChatChannel }) => void;
  messages?: ChatMessage[];
  onSendMessage?: (msg: ChatMessage) => void;
  setMessages?: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}> = ({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  onRemoveChannel,
  vehicles,
  incidents,
  onOpenRadioCall,
  messages,
  onSendMessage,
  setMessages
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];
  const targetIncident = incidents.find(i => i.id === activeChannel?.incidentId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <Radio size={20} className={isDark ? "text-sky-400" : "text-sky-600"} />
            Tactical Mission Communications & Inter-Unit Comms
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Encrypted incident-specific tactical radio nets, direct vehicle-to-vehicle private links, and voice notes
          </p>
        </div>

        {onOpenRadioCall && (
          <button
            onClick={() => onOpenRadioCall({ type: 'Channel', id: activeChannel?.id || 'agency-police', name: activeChannel?.name || 'Tactical Net', channel: activeChannel })}
            className="px-3.5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs flex items-center gap-2 border border-sky-300 shadow-sm transition-all cursor-pointer"
          >
            <PhoneCall size={14} />
            <span>Launch Tactical Radio Call</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 8 Columns: Main Comms Console */}
        <div className="lg:col-span-8">
          <CommunicationCenter
            channels={channels}
            activeChannelId={activeChannelId}
            onSelectChannel={onSelectChannel}
            onCreateChannel={onCreateChannel}
            onRemoveChannel={onRemoveChannel}
            vehicles={vehicles}
            incidents={incidents}
            onOpenRadioCall={onOpenRadioCall}
            messages={messages}
            onSendMessage={onSendMessage}
            setMessages={setMessages}
          />
        </div>

        {/* Right 4 Columns: Live Channel Participants & Telemetry */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Channel Details */}
          <div className={`border rounded-2xl p-4 shadow-sm space-y-3 transition-colors ${
            isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex items-center justify-between border-b pb-2.5 ${
              isDark ? 'border-[#172338]' : 'border-slate-200'
            }`}>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Channel Telemetry</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                isDark ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' : 'text-sky-700 bg-sky-50 border-sky-300'
              }`}>
                P25 PHASE II
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className={`p-2.5 rounded-xl border space-y-1 ${
                isDark ? 'bg-[#090e1a] border-[#1a2942]' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Net Name</span>
                <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{activeChannel?.name}</p>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{activeChannel?.description}</p>
              </div>

              {targetIncident && (
                <div className={`p-2.5 rounded-xl border space-y-1 ${
                  isDark ? 'bg-[#090e1a] border-[#1a2942]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Linked Incident</span>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-red-600 font-mono">{targetIncident.id}</span>
                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{targetIncident.location}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unit Participants on this Net */}
          <div className={`border rounded-2xl p-4 shadow-sm space-y-3 transition-colors ${
            isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
          }`}>
            <h3 className={`text-xs font-bold flex items-center justify-between ${
              isDark ? 'text-slate-200' : 'text-slate-900'
            }`}>
              <span>Connected Responders</span>
              <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {vehicles.filter(v => v.status === 'Dispatched' || v.status === 'Available').length} Active
              </span>
            </h3>

            <div className={`space-y-2 max-h-72 overflow-y-auto scrollbar-thin ${
              isDark ? 'scrollbar-thumb-slate-800' : 'scrollbar-thumb-slate-300'
            }`}>
              {vehicles.slice(0, 8).map(v => {
                const unitStyles = getUnitStyles(v.type || v.id, isDark);
                return (
                  <div
                    key={v.id}
                    className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between text-xs ${
                      isDark ? 'bg-[#090e1a]' : 'bg-white hover:bg-slate-50'
                    } ${unitStyles.borderGlow}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${unitStyles.dot} animate-pulse`}></span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded border ${unitStyles.idBadge}`}>
                            {v.id}
                          </span>
                          <span className={`font-bold ${unitStyles.nameText}`}>{v.name}</span>
                        </div>
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{v.driver} • {v.station}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onOpenRadioCall && (
                        <button
                          onClick={() => onOpenRadioCall({ type: 'Unit', id: v.id, name: v.name, vehicle: v })}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isDark
                              ? 'bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-white border-sky-400/30'
                              : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300 shadow-2xs'
                          }`}
                          title={`Radio Call ${v.id}`}
                        >
                          <PhoneCall size={12} />
                        </button>
                      )}
                      <div className="text-right">
                        <span className={`text-[10px] font-mono block font-bold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>98% Sig</span>
                        <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{v.fuel}% Fuel</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HospitalsView: React.FC<{
  isHospitalSurgeActive?: boolean;
  onToggleHospitalSurge?: (active?: boolean) => void;
  sanctuaries?: EmergencySanctuary[];
  onAddSanctuary?: (sanctuary: EmergencySanctuary) => void;
  onUpdateSanctuary?: (id: string, updates: Partial<EmergencySanctuary>) => void;
  onRemoveSanctuary?: (id: string) => void;
  onNavigateToMap?: () => void;
}> = ({
  isHospitalSurgeActive = false,
  onToggleHospitalSurge,
  sanctuaries = [],
  onAddSanctuary,
  onUpdateSanctuary,
  onRemoveSanctuary,
  onNavigateToMap
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [filter, setFilter] = useState<'All' | 'Government' | 'Private'>('All');
  const [search, setSearch] = useState('');
  const [showSanctuaryModal, setShowSanctuaryModal] = useState(false);

  // New sanctuary form state
  const [newSanctuaryForm, setNewSanctuaryForm] = useState({
    name: 'Chennai Port Epidemic Surge Encampment',
    type: 'Epidemic Surge Hospital' as EmergencySanctuary['type'],
    capacity: 1200,
    lat: 13.0827,
    lng: 80.2707,
    coverageRadiusMeters: 650,
    oxygenUnits: 450,
    isolationBeds: 280,
    tents: 120,
    ppeKits: 3500,
    potableWaterLitres: 25000,
    notes: 'Established under Epidemic Overflow Protocol for emergency mass triage.'
  });

  const totalBeds = CHENNAI_HOSPITALS.reduce((acc, h) => acc + h.capacity, 0);
  const baseAvailable = CHENNAI_HOSPITALS.reduce((acc, h) => acc + (h.availableBeds || 0), 0);
  const availableBeds = isHospitalSurgeActive ? 0 : baseAvailable;
  const isHospitalsFullyUsedUp = isHospitalSurgeActive || availableBeds === 0;
  const saturationPercent = isHospitalsFullyUsedUp ? 100 : Math.round(((totalBeds - availableBeds) / totalBeds) * 100);

  const govtCount = CHENNAI_HOSPITALS.filter(h => h.type === 'Government').length;
  const privateCount = CHENNAI_HOSPITALS.filter(h => h.type === 'Private').length;

  const filteredHospitals = CHENNAI_HOSPITALS.filter(h => {
    const matchesType = filter === 'All' || h.type === filter;
    const matchesSearch =
      !search ||
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.area && h.area.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const handleCreateSanctuarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddSanctuary) return;

    const newSanctuary: EmergencySanctuary = {
      id: `SANC-${Date.now().toString().slice(-4)}`,
      name: newSanctuaryForm.name.trim(),
      type: newSanctuaryForm.type,
      lat: Number(newSanctuaryForm.lat),
      lng: Number(newSanctuaryForm.lng),
      capacity: Number(newSanctuaryForm.capacity),
      occupied: 0,
      supplies: {
        oxygenUnits: Number(newSanctuaryForm.oxygenUnits),
        isolationBeds: Number(newSanctuaryForm.isolationBeds),
        tents: Number(newSanctuaryForm.tents),
        ppeKits: Number(newSanctuaryForm.ppeKits),
        potableWaterLitres: Number(newSanctuaryForm.potableWaterLitres)
      },
      status: 'Active',
      notes: newSanctuaryForm.notes.trim(),
      establishedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      establishedBy: 'State Health Disaster Cell',
      coverageRadiusMeters: Number(newSanctuaryForm.coverageRadiusMeters)
    };

    onAddSanctuary(newSanctuary);
    setShowSanctuaryModal(false);
    playRadioChirp('roger');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <Building2 size={20} className="text-emerald-600 dark:text-cyan-400" />
            Hospital Saturation Network & Emergency Overflow Control
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Citywide hospital ICU/ER bed capacity, real-time epidemic saturation monitoring, and disaster sanctuary deployment
          </p>
        </div>
      </div>

      {/* Hospital Saturation Network & Epidemic Overflow Protocol Console */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isHospitalsFullyUsedUp
          ? isDark
            ? 'bg-gradient-to-br from-[#1a0f28] via-[#120a1f] to-[#0b101d] border-purple-500/60 shadow-lg'
            : 'bg-purple-50 border-purple-300 shadow-sm'
          : isDark
          ? 'bg-[#0b101d] border-[#172338]'
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b ${
          isDark ? 'border-[#1f2e47]' : 'border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isHospitalsFullyUsedUp ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
              <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <span>Citywide Hospital Saturation Grid</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-black border ${
                  isHospitalsFullyUsedUp
                    ? 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/50'
                    : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                }`}>
                  {saturationPercent}% SATURATED
                </span>
              </h3>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {availableBeds.toLocaleString()} of {totalBeds.toLocaleString()} total verified hospital beds currently available.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Surge simulation toggle */}
            {onToggleHospitalSurge && (
              <button
                onClick={() => onToggleHospitalSurge()}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isHospitalSurgeActive
                    ? 'bg-purple-700 hover:bg-purple-600 text-white border-purple-500 shadow-sm'
                    : isDark
                    ? 'bg-[#15233c] text-slate-300 border-slate-700 hover:bg-[#1f3458] hover:text-white'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
                title={isHospitalSurgeActive ? 'Return hospitals to normal capacity' : 'Simulate 100% citywide hospital saturation to test emergency refugee sanctuary overflow'}
              >
                <Activity size={13} className={isHospitalSurgeActive ? 'text-purple-200 animate-pulse' : 'text-amber-500'} />
                <span>{isHospitalSurgeActive ? 'Normalize Capacity' : '⚡ Simulate Epidemic Surge (100%)'}</span>
              </button>
            )}

            {/* Deploy Sanctuary Button (Unlocked only when hospitals are 100% full) */}
            <button
              onClick={() => {
                if (!isHospitalsFullyUsedUp) {
                  alert("🔒 Protocol Locked: Emergency refugee/epidemic sanctuaries can only be authorized once the citywide hospital network is 100% fully used up. Click 'Simulate Epidemic Surge' to saturate all beds and unlock sanctuary placement.");
                  return;
                }
                setShowSanctuaryModal(true);
                playRadioChirp('transmit');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                isHospitalsFullyUsedUp
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                  : isDark
                  ? 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-500 border border-slate-300 cursor-not-allowed'
              }`}
              title={isHospitalsFullyUsedUp ? 'Deploy a custom relief/epidemic sanctuary' : 'Locked: Hospitals must be 100% saturated first'}
            >
              {isHospitalsFullyUsedUp ? <Unlock size={13} className="text-white" /> : <Lock size={13} />}
              <span>🏕 Establish Emergency Sanctuary</span>
              {sanctuaries.length > 0 && (
                <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px] font-mono text-white">
                  {sanctuaries.length} Active
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Saturation Progress Bar */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>City Hospital Network Saturation Meter</span>
            <span className={`font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {isHospitalsFullyUsedUp ? '100% (CRITICAL SATURATION)' : `${saturationPercent}% Occupied`}
            </span>
          </div>
          <div className={`w-full h-3 rounded-full overflow-hidden p-0.5 border ${
            isDark ? 'bg-[#080d18] border-[#1b2b46]' : 'bg-slate-200 border-slate-300'
          }`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHospitalsFullyUsedUp
                  ? 'bg-gradient-to-r from-amber-500 via-red-500 to-purple-600 animate-pulse'
                  : saturationPercent > 80
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
              style={{ width: `${saturationPercent}%` }}
            />
          </div>
          <div className={`flex justify-between items-center text-[10px] font-mono pt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            <span>0% (Empty)</span>
            <span>50% (Normal Operations)</span>
            <span>85% (High Alert)</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">100% (Epidemic Overflow Triggered)</span>
          </div>
        </div>

        {isHospitalsFullyUsedUp && (
          <div className={`mt-3.5 p-3 rounded-xl border flex items-center justify-between text-xs ${
            isDark ? 'bg-purple-950/40 border-purple-500/40 text-purple-200' : 'bg-purple-100 border-purple-300 text-purple-900'
          }`}>
            <div className="flex items-center gap-2">
              <HeartPulse size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
              <span>
                <strong>EPIDEMIC OVERFLOW PROTOCOL ACTIVE:</strong> City medical centers saturated. Emergency relief sanctuaries and surge isolation encampments are authorized.
              </span>
            </div>
            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-lg text-xs font-bold shrink-0 ml-2 border border-emerald-300 shadow-xs cursor-pointer"
              >
                View on Tactical Map →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active Deployed Sanctuaries Section */}
      {sanctuaries.length > 0 && (
        <div className={`border rounded-2xl p-4 shadow-md space-y-3 ${
          isDark ? 'bg-[#0b101d] border-purple-500/30' : 'bg-white border-purple-200'
        }`}>
          <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-[#1f2e47]' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Active Deployed Sanctuaries & Overflow Encampments ({sanctuaries.length})
              </h3>
            </div>
            <span className={`text-[11px] font-mono font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
              Total Surge Capacity: {sanctuaries.reduce((acc, s) => acc + s.capacity, 0).toLocaleString()} Beds
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sanctuaries.map((s) => {
              const occPercent = s.capacity > 0 ? Math.round((s.occupied / s.capacity) * 100) : 0;
              return (
                <div
                  key={s.id}
                  className={`border p-3.5 rounded-xl space-y-2.5 transition-all ${
                    isDark ? 'bg-[#070b14] border-purple-500/30 hover:border-purple-500/60' : 'bg-slate-50 border-slate-200 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">{s.id} • {s.establishedTime}</span>
                      <h4 className={`font-bold text-xs leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.name}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                      isDark ? 'text-purple-300 bg-purple-500/20 border-purple-500/40' : 'text-purple-800 bg-purple-50 border-purple-300'
                    }`}>
                      {s.type}
                    </span>
                  </div>

                  <div className={`space-y-1 p-2 rounded-lg border text-xs ${
                    isDark ? 'bg-[#090f1e] border-[#18263e]' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex justify-between text-[11px]">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Occupancy:</span>
                      <strong className={`font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{s.occupied} / {s.capacity} ({occPercent}%)</strong>
                    </div>
                    <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div
                        className={`h-full ${occPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, occPercent)}%` }}
                      />
                    </div>
                    {s.supplies && (
                      <div className={`pt-1 text-[10px] grid grid-cols-2 gap-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        <div>🫁 O₂: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.supplies.oxygenUnits}</span></div>
                        <div>🛌 Iso: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.supplies.isolationBeds}</span></div>
                        <div>⛺ Tents: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.supplies.tents}</span></div>
                        <div>💧 Water: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.supplies.potableWaterLitres.toLocaleString()}L</span></div>
                      </div>
                    )}
                  </div>

                  <div className={`pt-1 flex items-center justify-between gap-1.5 border-t ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}>
                    <button
                      onClick={() => {
                        if (onUpdateSanctuary) {
                          const add = Math.min(50, s.capacity - s.occupied);
                          onUpdateSanctuary(s.id, { occupied: s.occupied + add });
                          playRadioChirp('roger');
                        }
                      }}
                      disabled={s.occupied >= s.capacity}
                      className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-lg text-[10px] font-bold border border-emerald-300 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      +50 Inflow
                    </button>
                    <button
                      onClick={() => {
                        if (onUpdateSanctuary) {
                          onUpdateSanctuary(s.id, { occupied: Math.max(0, s.occupied - 50) });
                          playRadioChirp('roger');
                        }
                      }}
                      disabled={s.occupied <= 0}
                      className="px-2.5 py-1 bg-orange-300 hover:bg-orange-200 text-orange-950 rounded-lg text-[10px] font-bold border border-orange-300 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      -50 Discharged
                    </button>
                    {onRemoveSanctuary && (
                      <button
                        onClick={() => {
                          if (confirm(`Decommission sanctuary ${s.name}?`)) {
                            onRemoveSanctuary(s.id);
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border ml-auto transition-colors ${
                          isDark ? 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border-red-500/30' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300'
                        }`}
                      >
                        Decommission
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className={`border rounded-2xl p-4 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
          <p className={`text-[11px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Verified Hospitals</p>
          <p className={`text-2xl font-black mt-1 font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{CHENNAI_HOSPITALS.length}</p>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{govtCount} Govt • {privateCount} Private</p>
        </div>
        <div className={`border rounded-2xl p-4 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
          <p className={`text-[11px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Bed Capacity</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{totalBeds.toLocaleString()}</p>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Across all facilities</p>
        </div>
        <div className={`border rounded-2xl p-4 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
          <p className={`text-[11px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Available ICU / ER Beds</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{availableBeds.toLocaleString()}</p>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-emerald-500/80' : 'text-emerald-600'}`}>Live emergency capacity</p>
        </div>
        <div className={`border rounded-2xl p-4 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
          <p className={`text-[11px] font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Trauma Centers</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">15 / 15</p>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-amber-500/80' : 'text-amber-600'}`}>Level-1 trauma equipped</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border p-3 rounded-2xl ${
        isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
      }`}>
        <div className={`flex gap-1.5 p-1 rounded-xl border ${
          isDark ? 'bg-[#111927] border-[#1f2e47]' : 'bg-slate-100 border-slate-200'
        }`}>
          {(['All', 'Government', 'Private'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === t
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t} {t === 'All' ? `(${CHENNAI_HOSPITALS.length})` : t === 'Government' ? `(${govtCount})` : `(${privateCount})`}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search hospital or area..."
            className={`w-full text-xs rounded-xl pl-9 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 border ${
              isDark
                ? 'bg-[#111927] text-slate-200 placeholder-slate-500 border-[#1f2e47]'
                : 'bg-white text-slate-900 placeholder-slate-400 border-slate-300'
            }`}
          />
        </div>
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHospitals.map(h => {
          const occPct = isHospitalSurgeActive ? 100 : (h.availableBeds ? Math.round(((h.capacity - h.availableBeds) / h.capacity) * 100) : 85);
          const currentFree = isHospitalSurgeActive ? 0 : (h.availableBeds || 0);

          return (
            <div
              key={h.id}
              className={`border rounded-2xl p-4 shadow-sm transition-all flex flex-col justify-between ${
                isDark ? 'bg-[#0b101d] border-[#172338] hover:border-[#2a3f65]' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-2 rounded-xl ${
                        h.type === 'Government'
                          ? isDark ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDark ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' : 'bg-teal-50 text-teal-700 border border-teal-200'
                      }`}
                    >
                      <Building2 size={18} />
                    </div>
                    <div>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{h.id}</span>
                      <h3 className={`font-bold text-sm leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{h.name}</h3>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                      h.type === 'Government'
                        ? isDark ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' : 'text-emerald-800 bg-emerald-50 border-emerald-300'
                        : isDark ? 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' : 'text-teal-800 bg-teal-50 border-teal-300'
                    }`}
                  >
                    {h.type}
                  </span>
                </div>

                <div className={`space-y-1.5 text-xs mb-3 p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#070b14] text-slate-300 border-[#17243a]' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Bed size={12} className="text-emerald-600 dark:text-emerald-400" /> Total Capacity:
                    </span>
                    <strong className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{h.capacity} Beds</strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Available Beds:</span>
                    <strong className={`${currentFree === 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'} font-mono`}>
                      {currentFree} Free {currentFree === 0 && '(Saturated)'}
                    </strong>
                  </div>
                  <div className={`flex justify-between items-center text-[10px] pt-1 border-t ${
                    isDark ? 'text-slate-500 border-slate-800' : 'text-slate-500 border-slate-200'
                  }`}>
                    <span>Coordinates:</span>
                    <span className="font-mono">
                      {h.lat.toFixed(4)}, {h.lng.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 text-xs mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <MapPin size={13} className="text-amber-500 shrink-0" />
                  <span>{h.area || 'Chennai Metropolitan'}</span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[11px]">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Occupancy Rate</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{occPct}%</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#151f32]' : 'bg-slate-200'}`}>
                    <div
                      className={`h-full ${
                        occPct >= 100
                          ? 'bg-red-500'
                          : occPct > 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      } rounded-full`}
                      style={{ width: `${occPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between gap-2 ${
                isDark ? 'border-[#172338]' : 'border-slate-200'
              }`}>
                {h.contact && (
                  <a
                    href={`tel:${h.contact}`}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                      isDark ? 'bg-[#132035] hover:bg-[#1a2e4c] text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    <Phone size={12} /> Contact ER
                  </a>
                )}
                <button
                  onClick={() => {
                    playRadioChirp('alert');
                    alert(`Ambulance triage link requested for ${h.name} (${h.capacity} beds). Hospital ER dashboard notified.`);
                  }}
                  className="flex-1 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-emerald-300 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 size={12} /> Triage Link
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sanctuary Builder Modal dialog inside Hospital View */}
      {showSanctuaryModal && (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
          isDark ? 'bg-slate-950/80 backdrop-blur-sm' : 'bg-slate-900/40 backdrop-blur-xs'
        }`}>
          <div className={`border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#0b101d] border-purple-500/50 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'bg-gradient-to-r from-purple-950/80 via-[#150f28] to-[#0b101d] border-purple-500/30' : 'bg-purple-50 border-purple-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-sm ${
                  isDark ? 'bg-purple-500/20 border-purple-400/60 text-purple-300' : 'bg-purple-100 border-purple-300 text-purple-800'
                }`}>
                  <HeartPulse size={18} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>Deploy Emergency Relief Sanctuary</h3>
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-purple-300/80' : 'text-purple-700'}`}>
                    Authorized Epidemic & Refugee Overflow Encampment Zone
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSanctuaryModal(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSanctuarySubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Sanctuary Designation & Name
                </label>
                <input
                  type="text"
                  required
                  value={newSanctuaryForm.name}
                  onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, name: e.target.value })}
                  placeholder="e.g. Jawaharlal Nehru Stadium Epidemic Surge Hub"
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                    isDark
                      ? 'bg-[#070b14] border-[#1e2c47] text-white placeholder-slate-500 focus:border-purple-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-purple-600'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Facility Protocol Type
                  </label>
                  <select
                    value={newSanctuaryForm.type}
                    onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, type: e.target.value as any })}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                      isDark ? 'bg-[#070b14] border-[#1e2c47] text-white focus:border-purple-500' : 'bg-white border-slate-300 text-slate-900 focus:border-purple-600'
                    }`}
                  >
                    <option value="Epidemic Surge Hospital">Epidemic Surge Hospital</option>
                    <option value="Refugee Relief Sanctuary">Refugee Relief Sanctuary</option>
                    <option value="Quarantine Zone">Quarantine Zone</option>
                    <option value="Mass Evacuation Hub">Mass Evacuation Hub</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Target Bed / Person Capacity
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="20000"
                    step="50"
                    required
                    value={newSanctuaryForm.capacity}
                    onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, capacity: Number(e.target.value) })}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none border ${
                      isDark ? 'bg-[#070b14] border-[#1e2c47] text-white focus:border-purple-500' : 'bg-white border-slate-300 text-slate-900 focus:border-purple-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newSanctuaryForm.lat}
                    onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, lat: Number(e.target.value) })}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none border ${
                      isDark ? 'bg-[#070b14] border-[#1e2c47] text-white focus:border-purple-500' : 'bg-white border-slate-300 text-slate-900 focus:border-purple-600'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newSanctuaryForm.lng}
                    onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, lng: Number(e.target.value) })}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none border ${
                      isDark ? 'bg-[#070b14] border-[#1e2c47] text-white focus:border-purple-500' : 'bg-white border-slate-300 text-slate-900 focus:border-purple-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Coverage Perimeter Radius ({newSanctuaryForm.coverageRadiusMeters} meters)
                </label>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={newSanctuaryForm.coverageRadiusMeters}
                  onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, coverageRadiusMeters: Number(e.target.value) })}
                  className="w-full accent-purple-600"
                />
              </div>

              <div className={`p-3 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-[#070b14] border-purple-500/20' : 'bg-purple-50 border-purple-200'
              }`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                  isDark ? 'text-purple-300' : 'text-purple-900'
                }`}>
                  📦 Initial Medical & Humanitarian Stock
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Oxygen Units (Cylinders/PSA):</label>
                    <input
                      type="number"
                      value={newSanctuaryForm.oxygenUnits}
                      onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, oxygenUnits: Number(e.target.value) })}
                      className={`w-full rounded-lg p-1.5 text-xs font-mono border ${
                        isDark ? 'bg-[#0c1322] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Isolation/ICU Cubicles:</label>
                    <input
                      type="number"
                      value={newSanctuaryForm.isolationBeds}
                      onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, isolationBeds: Number(e.target.value) })}
                      className={`w-full rounded-lg p-1.5 text-xs font-mono border ${
                        isDark ? 'bg-[#0c1322] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Shelter Tents (Units):</label>
                    <input
                      type="number"
                      value={newSanctuaryForm.tents}
                      onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, tents: Number(e.target.value) })}
                      className={`w-full rounded-lg p-1.5 text-xs font-mono border ${
                        isDark ? 'bg-[#0c1322] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Potable Water Tank (Litres):</label>
                    <input
                      type="number"
                      value={newSanctuaryForm.potableWaterLitres}
                      onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, potableWaterLitres: Number(e.target.value) })}
                      className={`w-full rounded-lg p-1.5 text-xs font-mono border ${
                        isDark ? 'bg-[#0c1322] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Tactical Notes & Operational Instructions
                </label>
                <textarea
                  rows={2}
                  value={newSanctuaryForm.notes}
                  onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, notes: e.target.value })}
                  placeholder="Deployment instructions for triage teams..."
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                    isDark
                      ? 'bg-[#070b14] border-[#1e2c47] text-white placeholder-slate-500 focus:border-purple-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-purple-600'
                  }`}
                />
              </div>

              <div className={`pt-3 border-t flex items-center justify-end gap-2 ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setShowSanctuaryModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-xl text-xs font-bold border border-emerald-300 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  <span>Establish Tactical Sanctuary</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const DepartmentsView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'All' | 'Police' | 'Fire' | 'Medical'>('All');
  const [search, setSearch] = useState('');

  const depts = [
    {
      name: 'Police Command & Tactical',
      category: 'Police',
      icon: Shield,
      head: 'Chief Inspector R. Verma',
      activeUnits: 30,
      hotline: '100 / Direct #442',
      color: 'blue'
    },
    {
      name: 'Fire & Rescue HQ',
      category: 'Fire',
      icon: Flame,
      head: 'Fire Marshal S. Sundaram',
      activeUnits: 18,
      hotline: '101 / Direct #443',
      color: 'red'
    },
    {
      name: 'Health & EMS Services',
      category: 'Medical',
      icon: Stethoscope,
      head: 'Dr. A. Meenakshi',
      activeUnits: 25,
      hotline: '108 / Direct #444',
      color: 'emerald'
    },
    {
      name: 'Traffic Enforcement Center',
      category: 'Police',
      icon: Car,
      head: 'Comm. K. Swaminathan',
      activeUnits: 16,
      hotline: '103 / Direct #445',
      color: 'cyan'
    }
  ];

  const filteredPolice = CHENNAI_POLICE_STATIONS.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.division.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFire = CHENNAI_FIRE_STATIONS.filter(f =>
    !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.zone.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHospitals = CHENNAI_HOSPITALS.filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) || (h.area && h.area.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Emergency Response Departments & Stations</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Coordinated command heads, police precincts, fire stations, and medical networks</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className={`absolute left-2.5 top-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search station or zone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-7 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 w-44 sm:w-56 border ${
                isDark ? 'bg-[#0e1626] border-[#1b2b46] text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 shadow-xs'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Command Heads Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {depts.map(d => {
          const Icon = d.icon;
          return (
            <div key={d.name} className={`border rounded-2xl p-4 shadow-sm transition-colors ${
              isDark ? 'bg-[#0b101d] border-[#172338] hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex items-center gap-3 mb-2.5">
                <div className={`p-2.5 rounded-xl border ${
                  d.color === 'red' ? (isDark ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200') :
                  d.color === 'emerald' ? (isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200') :
                  d.color === 'cyan' ? (isDark ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200') :
                  (isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200')
                }`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className={`font-bold text-xs truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{d.name}</h3>
                  <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{d.head}</p>
                </div>
              </div>
              <div className={`pt-2 border-t flex justify-between items-center text-[11px] ${
                isDark ? 'border-[#172338]' : 'border-slate-200'
              }`}>
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  Fleet: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{d.activeUnits} units</strong>
                </span>
                <span className={`font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{d.hotline}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Station Category Tabs */}
      <div className={`flex p-1 rounded-xl border w-fit gap-1 ${
        isDark ? 'bg-[#0e1626] border-[#1b2b46]' : 'bg-slate-100 border-slate-200'
      }`}>
        <button
          onClick={() => setActiveTab('All')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'All'
              ? 'bg-blue-600 text-white shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Stations ({filteredPolice.length + filteredFire.length + filteredHospitals.length})
        </button>
        <button
          onClick={() => setActiveTab('Police')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'Police'
              ? 'bg-blue-600 text-white shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield size={13} className={activeTab === 'Police' ? 'text-white' : 'text-blue-400'} />
          Police Stations ({filteredPolice.length})
        </button>
        <button
          onClick={() => setActiveTab('Fire')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'Fire'
              ? 'bg-blue-600 text-white shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame size={13} className={activeTab === 'Fire' ? 'text-white' : 'text-red-400'} />
          Fire Stations ({filteredFire.length})
        </button>
        <button
          onClick={() => setActiveTab('Medical')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'Medical'
              ? 'bg-blue-600 text-white shadow-sm'
              : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 size={13} className={activeTab === 'Medical' ? 'text-white' : 'text-emerald-400'} />
          Trauma Hospitals ({filteredHospitals.length})
        </button>
      </div>

      {/* Police Stations Section */}
      {(activeTab === 'All' || activeTab === 'Police') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-blue-400" />
            <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Police Stations & Precincts ({filteredPolice.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredPolice.map(p => (
              <div key={p.id} className={`border rounded-2xl p-4 shadow-sm transition-all flex flex-col justify-between ${
                isDark ? 'bg-[#0b101d] border-[#172338] hover:border-blue-500/40' : 'bg-white border-slate-200 hover:border-blue-300'
              }`}>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-mono text-blue-500 mb-0.5">{p.id} • {p.division} Division</div>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{p.name}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                      isDark ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' : 'text-blue-700 bg-blue-50 border-blue-200'
                    }`}>
                      Precinct
                    </span>
                  </div>

                  <div className={`mt-3 space-y-1.5 p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#090e1a] border-[#16243a]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Personnel:</span>
                      <strong className={`font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{p.personnel} Officers</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Patrol Vehicles:</span>
                      <strong className={`font-mono ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>{p.vehiclesCount || 8} Active Units</strong>
                    </div>
                    <div className={`flex justify-between items-center text-[10px] pt-1 border-t ${
                      isDark ? 'text-slate-400 border-[#131d2e]' : 'text-slate-500 border-slate-200'
                    }`}>
                      <span>Coordinates:</span>
                      <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                <div className={`pt-3 mt-3 border-t flex items-center justify-between gap-2 text-xs ${
                  isDark ? 'border-[#172338]' : 'border-slate-200'
                }`}>
                  {p.contact && (
                    <a
                      href={`tel:${p.contact}`}
                      className={`px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1 ${
                        isDark ? 'bg-[#132035] hover:bg-[#1c3050] text-blue-300 border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                      }`}
                    >
                      <Phone size={11} /> {p.contact}
                    </a>
                  )}
                  <button
                    onClick={() => {
                      playRadioChirp('alert');
                      alert(`Tactical dispatch link opened with ${p.name}.`);
                    }}
                    className="px-2.5 py-1 bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg font-bold border border-sky-300 transition-colors ml-auto flex items-center gap-1 cursor-pointer"
                  >
                    <Shield size={11} /> Alert Station
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fire Stations Section */}
      {(activeTab === 'All' || activeTab === 'Fire') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-red-400" />
            <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Fire & Rescue Stations ({filteredFire.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredFire.map(f => (
              <div key={f.id} className={`border rounded-2xl p-4 shadow-sm transition-all flex flex-col justify-between ${
                isDark ? 'bg-[#0b101d] border-[#172338] hover:border-red-500/40' : 'bg-white border-slate-200 hover:border-red-300'
              }`}>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-mono text-red-500 mb-0.5">{f.id} • {f.zone} Zone</div>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{f.name}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                      isDark ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-red-700 bg-red-50 border-red-200'
                    }`}>
                      Fire Base
                    </span>
                  </div>

                  <div className={`mt-3 space-y-1.5 p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#090e1a] border-[#16243a]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Engines / Vehicles:</span>
                      <strong className={`font-mono ${isDark ? 'text-red-400' : 'text-red-600'}`}>{f.vehiclesCount} Tender Engines</strong>
                    </div>
                    {f.personnel && (
                      <div className="flex justify-between items-center">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Firefighters:</span>
                        <strong className={`font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{f.personnel} Personnel</strong>
                      </div>
                    )}
                    <div className={`flex justify-between items-center text-[10px] pt-1 border-t ${
                      isDark ? 'text-slate-400 border-[#131d2e]' : 'text-slate-500 border-slate-200'
                    }`}>
                      <span>Coordinates:</span>
                      <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{f.lat.toFixed(4)}, {f.lng.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                <div className={`pt-3 mt-3 border-t flex items-center justify-between gap-2 text-xs ${
                  isDark ? 'border-[#172338]' : 'border-slate-200'
                }`}>
                  {f.contact && (
                    <a
                      href={`tel:${f.contact}`}
                      className={`px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1 ${
                        isDark ? 'bg-[#132035] hover:bg-[#1c3050] text-red-300 border-red-500/30' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                      }`}
                    >
                      <Phone size={11} /> {f.contact}
                    </a>
                  )}
                  <button
                    onClick={() => {
                      playRadioChirp('alert');
                      alert(`Turnout bell signaled to ${f.name} (${f.vehiclesCount} engines on standby).`);
                    }}
                    className="px-2.5 py-1 bg-rose-400 hover:bg-rose-300 text-rose-950 rounded-lg font-bold border border-rose-300 transition-colors ml-auto flex items-center gap-1 cursor-pointer"
                  >
                    <Flame size={11} /> Signal Turnout
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospitals Section */}
      {(activeTab === 'All' || activeTab === 'Medical') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-emerald-400" />
            <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Receiving Trauma & Hospital Network ({filteredHospitals.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredHospitals.map(h => (
              <div key={h.id} className={`border rounded-2xl p-4 shadow-sm transition-all flex flex-col justify-between ${
                isDark ? 'bg-[#0b101d] border-[#172338] hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-300'
              }`}>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-mono text-emerald-500 mb-0.5">{h.id} • {h.area || 'Metro'}</div>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{h.name}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                      h.type === 'Government'
                        ? (isDark ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200')
                        : (isDark ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' : 'text-cyan-700 bg-cyan-50 border-cyan-200')
                    }`}>
                      {h.type}
                    </span>
                  </div>

                  <div className={`mt-3 space-y-1.5 p-2.5 rounded-xl border text-xs ${
                    isDark ? 'bg-[#090e1a] border-[#16243a]' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Total Bed Capacity:</span>
                      <strong className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{h.capacity} Beds</strong>
                    </div>
                    {h.availableBeds && (
                      <div className="flex justify-between items-center">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Available Beds:</span>
                        <strong className={`font-mono ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{h.availableBeds} Free</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`pt-3 mt-3 border-t flex items-center justify-between gap-2 text-xs ${
                  isDark ? 'border-[#172338]' : 'border-slate-200'
                }`}>
                  {h.contact && (
                    <a
                      href={`tel:${h.contact}`}
                      className={`px-2.5 py-1 rounded-lg font-bold border flex items-center gap-1 ${
                        isDark ? 'bg-[#132035] hover:bg-[#1c3050] text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <Phone size={11} /> Contact ER
                    </a>
                  )}
                  <button
                    onClick={() => {
                      playRadioChirp('alert');
                      alert(`ER trauma bay triage link confirmed with ${h.name}.`);
                    }}
                    className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-lg font-bold border border-emerald-300 transition-colors ml-auto flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 size={11} /> Triage Route
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AnnouncementsView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [broadcasts, setBroadcasts] = useState([
    {
      id: 'BC-2025-08',
      title: '🚨 EMERGENCY ROAD CLOSURE & HAZMAT CORDON',
      zone: 'Kilpauk & Central Arterial Sector',
      severity: 'Extreme',
      time: '10:35 AM',
      date: '13 May 2025',
      channels: ['Cell Broadcast SMS', 'Highway VMS Boards', 'Public Siren Array', 'Traffic FM Radio'],
      reach: '420,000 Citizens',
      body: 'Civilian traffic prohibited on Poonamallee High Road from Kilpauk to Ega Theatre due to active commercial structural fire response. Emergency green corridor enforced for Fire and EMS units. Follow alternate diversion via EVR Periyar Salai.',
      author: 'ERC Incident Command — CP Verma'
    },
    {
      id: 'BC-2025-07',
      title: '🚑 AMBULANCE GREEN CORRIDOR IN EFFECT',
      zone: 'Guindy Highway to Rajiv Gandhi GH',
      severity: 'Severe',
      time: '10:12 AM',
      date: '13 May 2025',
      channels: ['Highway VMS Boards', 'Traffic Signals Control', 'City Mobile Alert'],
      reach: '180,000 Commuters',
      body: 'Priority medical green transit corridor activated along Anna Salai inbound. All motorists are instructed to yield left and clear central fast lanes immediately.',
      author: 'EMS Logistics Command'
    },
    {
      id: 'BC-2025-06',
      title: '⚠️ MONSOON INUNDATION & HIGH TIDE ADVISORY',
      zone: 'Marina Beach, Adyar & South Coastal Belt',
      severity: 'Advisory',
      time: '08:45 AM',
      date: '13 May 2025',
      channels: ['City Mobile Alert', 'Radio Broadcast'],
      reach: '650,000 Citizens',
      body: 'Heavy water logging alert near Adyar bridge and lower Marina loop road. Pumping tenders stationed. Citizens advised to exercise caution and avoid underpasses.',
      author: 'Chennai Disaster Management Authority'
    }
  ]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newZone, setNewZone] = useState('All Chennai Metro');
  const [newSeverity, setNewSeverity] = useState<'Extreme' | 'Severe' | 'Advisory' | 'Notice'>('Severe');
  const [newBody, setNewBody] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['Cell Broadcast SMS', 'Highway VMS Boards', 'City Mobile Alert']);
  const [sirenPlaying, setSirenPlaying] = useState(false);

  const toggleChannel = (ch: string) => {
    if (selectedChannels.includes(ch)) {
      setSelectedChannels(selectedChannels.filter(c => c !== ch));
    } else {
      setSelectedChannels([...selectedChannels, ch]);
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newBody) return;

    playRadioChirp('alert');
    const newBc = {
      id: `BC-2025-0${broadcasts.length + 9}`,
      title: newTitle,
      zone: newZone,
      severity: newSeverity,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: '13 May 2025',
      channels: selectedChannels,
      reach: newZone === 'All Chennai Metro' ? '1,200,000 Citizens' : '350,000 Citizens',
      body: newBody,
      author: 'ERC Dispatch Officer on Duty'
    };

    setBroadcasts([newBc, ...broadcasts]);
    setShowNewModal(false);
    setNewTitle('');
    setNewBody('');
    alert(`Emergency Public Broadcast "${newTitle}" transmitted across ${selectedChannels.length} public channels!`);
  };

  const handleTestSiren = () => {
    playRadioChirp('alert');
    setSirenPlaying(true);
    setTimeout(() => setSirenPlaying(false), 3000);
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header Bar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-[#172338]' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              <Megaphone size={20} />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Public Warning & Emergency Broadcasts</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Official CAP (Common Alerting Protocol) Broadcaster • City sirens, cell SMS, & highway signs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTestSiren}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              sirenPlaying
                ? 'bg-red-600 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-bounce'
                : isDark
                ? 'bg-[#15233c] hover:bg-[#1f3458] text-amber-300 border-amber-500/30'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
            }`}
          >
            <BellRing size={14} className={sirenPlaying ? 'animate-spin' : ''} />
            <span>{sirenPlaying ? 'Siren Warning Active...' : 'Test Siren Array'}</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Issue Emergency Broadcast</span>
          </button>
        </div>
      </div>

      {/* Broadcast Quick Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => {
            setNewTitle('🚨 EVACUATION NOTICE: INDUSTRIAL HAZMAT SPILL');
            setNewZone('Kilpauk & Central Commercial Sector');
            setNewSeverity('Extreme');
            setNewBody('Immediate evacuation ordered within 500m of Kilpauk junction due to hazardous smoke. Proceed south towards EVR Periyar Salai.');
            setShowNewModal(true);
          }}
          className={`border p-3.5 rounded-2xl cursor-pointer transition-all ${
            isDark
              ? 'bg-[#0b101d] border-red-500/30 hover:border-red-500/60 hover:bg-[#10182a]'
              : 'bg-red-50/50 border-red-200 hover:border-red-300 hover:bg-red-50'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            <AlertTriangle size={12} /> Rapid Preset
          </span>
          <h4 className={`font-bold text-xs mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Hazardous / Structural Evacuation</h4>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Dispatches siren towers and emergency cell broadcast</p>
        </div>

        <div
          onClick={() => {
            setNewTitle('⛔ EMERGENCY ROAD DIVERSION & GREEN CORRIDOR');
            setNewZone('Anna Salai & Guindy Arterial');
            setNewSeverity('Severe');
            setNewBody('Major traffic diversion in place for multi-vehicle emergency response. Public transit vehicles rerouted.');
            setShowNewModal(true);
          }}
          className={`border p-3.5 rounded-2xl cursor-pointer transition-all ${
            isDark
              ? 'bg-[#0b101d] border-amber-500/30 hover:border-amber-500/60 hover:bg-[#10182a]'
              : 'bg-amber-50/50 border-amber-200 hover:border-amber-300 hover:bg-amber-50'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
            <Car size={12} /> Rapid Preset
          </span>
          <h4 className={`font-bold text-xs mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Arterial Highway Road Closure</h4>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Updates dynamic highway VMS boards & traffic radio</p>
        </div>

        <div
          onClick={() => {
            setNewTitle('🚑 PRIORITY MEDICAL TRANSIT ALERT');
            setNewZone('Central Trauma Hospital Corridor');
            setNewSeverity('Severe');
            setNewBody('Critical trauma patient transport in progress to RGGGH. Clear left lane on Poonamallee High Road.');
            setShowNewModal(true);
          }}
          className={`border p-3.5 rounded-2xl cursor-pointer transition-all ${
            isDark
              ? 'bg-[#0b101d] border-emerald-500/30 hover:border-emerald-500/60 hover:bg-[#10182a]'
              : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            <Stethoscope size={12} /> Rapid Preset
          </span>
          <h4 className={`font-bold text-xs mt-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Green Corridor Traffic Priority</h4>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Alerts incoming traffic and smart signals</p>
        </div>
      </div>

      {/* Broadcast Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Active City Broadcasts ({broadcasts.length})</h3>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real-time CAP Public Feed</span>
        </div>

        <div className="space-y-3.5">
          {broadcasts.map(bc => (
            <div
              key={bc.id}
              className={`border rounded-2xl p-4 sm:p-5 shadow-sm transition-all ${
                isDark
                  ? (bc.severity === 'Extreme'
                      ? 'bg-[#0b101d] border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                      : bc.severity === 'Severe'
                      ? 'bg-[#0b101d] border-amber-500/40'
                      : 'bg-[#0b101d] border-[#172338]')
                  : (bc.severity === 'Extreme'
                      ? 'bg-white border-red-300 shadow-sm'
                      : bc.severity === 'Severe'
                      ? 'bg-white border-amber-300 shadow-sm'
                      : 'bg-white border-slate-200 shadow-sm')
              }`}
            >
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
                isDark ? 'border-[#172338]' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`font-mono text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{bc.id}</span>
                  <h4 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{bc.title}</h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                      bc.severity === 'Extreme'
                        ? (isDark ? 'bg-red-500/15 text-red-400 border-red-500/40 animate-pulse' : 'bg-red-100 text-red-700 border-red-300')
                        : bc.severity === 'Severe'
                        ? (isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/40' : 'bg-amber-100 text-amber-800 border-amber-300')
                        : (isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/40' : 'bg-blue-100 text-blue-700 border-blue-300')
                    }`}
                  >
                    {bc.severity}
                  </span>
                </div>

                <div className={`flex items-center gap-3 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>{bc.date} • {bc.time}</span>
                  <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>|</span>
                  <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{bc.reach}</span>
                </div>
              </div>

              <div className={`mt-3 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <p>{bc.body}</p>
              </div>

              <div className={`mt-3.5 pt-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
                isDark ? 'border-[#172338]' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Broadcasted Via:</span>
                  {bc.channels.map(ch => (
                    <span key={ch} className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${
                      isDark ? 'bg-[#090e1a] text-slate-300 border-[#1a2942]' : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {ch}
                    </span>
                  ))}
                </div>

                <div className={`flex items-center gap-2 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>Zone: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{bc.zone}</strong></span>
                  <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
                  <span>Authorizer: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{bc.author}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Broadcast Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
            isDark ? 'bg-[#0b101d] border-[#223554]' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-4 border-b flex justify-between items-center ${
              isDark ? 'border-[#172338] bg-[#070b14]' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2">
                <Megaphone size={16} className={isDark ? 'text-red-400' : 'text-red-600'} />
                <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Issue Emergency Public Broadcast (CAP)</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className={`text-xs font-bold p-1 rounded-lg ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublish} className="p-5 space-y-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Broadcast Title / Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🚨 EMERGENCY TRAFFIC DIVERSION: KILPAUK SECTOR"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 border font-medium focus:outline-none focus:border-red-500 ${
                    isDark ? 'bg-[#080d18] border-[#1b2b46] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Target Geographic Zone</label>
                  <select
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:border-blue-500 ${
                      isDark ? 'bg-[#080d18] border-[#1b2b46] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="All Chennai Metro">All Chennai Metro Area</option>
                    <option value="Kilpauk & Central Commercial Sector">Kilpauk & Central Commercial Sector</option>
                    <option value="Anna Salai & Guindy Arterial">Anna Salai & Guindy Arterial</option>
                    <option value="North Zone / Port Corridor">North Zone / Port Corridor</option>
                    <option value="South Coast & OMR IT Corridor">South Coast & OMR IT Corridor</option>
                    <option value="West Zone / Ambattur Industrial">West Zone / Ambattur Industrial</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Severity / Urgency Level</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className={`w-full rounded-xl px-3 py-2 border font-bold focus:outline-none focus:border-red-500 ${
                      isDark ? 'bg-[#080d18] border-[#1b2b46] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Extreme">Extreme (Immediate Threat / Evacuate)</option>
                    <option value="Severe">Severe (Major Action Required)</option>
                    <option value="Advisory">Advisory (Traffic / Weather Caution)</option>
                    <option value="Notice">Notice (Community Information)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Public Broadcast Message Body</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide precise instructions, diverted routes, affected perimeters, and safety instructions for citizens..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className={`w-full rounded-xl p-3 border leading-relaxed focus:outline-none focus:border-blue-500 ${
                    isDark ? 'bg-[#080d18] border-[#1b2b46] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Dispatched Public Channels</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'Cell Broadcast SMS',
                    'Highway VMS Boards',
                    'Public Siren Array',
                    'Traffic FM Radio',
                    'City Mobile Alert',
                    'Smart Signal Displays'
                  ].map(ch => {
                    const isSelected = selectedChannels.includes(ch);
                    return (
                      <button
                        type="button"
                        key={ch}
                        onClick={() => toggleChannel(ch)}
                        className={`p-2 rounded-xl border text-left text-[11px] font-medium transition-all ${
                          isSelected
                            ? isDark ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold' : 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                            : isDark ? 'bg-[#080d18] border-[#1b2b46] text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`pt-3 border-t flex justify-end gap-2 ${isDark ? 'border-[#172338]' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className={`px-4 py-2 rounded-xl font-bold transition-colors ${
                    isDark ? 'bg-[#15233c] hover:bg-[#1e3254] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  <span>Transmit City Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AlertsView: React.FC<{
  notifications: AppNotification[];
  incidents?: Incident[];
  vehicles?: Vehicle[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  onViewIncident?: (inc: Incident) => void;
}> = ({
  notifications,
  incidents = [],
  vehicles = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onDeleteNotification,
  onViewIncident
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [filter, setFilter] = useState<'All' | 'Unread' | 'Resolutions' | 'Incidents' | 'Dispatches' | 'System'>('All');
  const [search, setSearch] = useState('');

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const resolutionCount = notifications.filter(n => n.type === 'Resolution').length;
  const incidentCount = notifications.filter(n => n.type === 'Incident').length;
  const dispatchCount = notifications.filter(n => n.type === 'Dispatch' || n.type === 'Arrival').length;
  const systemCount = notifications.filter(n => n.type === 'System' || n.type === 'Broadcast').length;

  const filtered = notifications.filter(n => {
    let matchesCategory = true;
    if (filter === 'Unread') matchesCategory = !n.isRead;
    else if (filter === 'Resolutions') matchesCategory = n.type === 'Resolution';
    else if (filter === 'Incidents') matchesCategory = n.type === 'Incident';
    else if (filter === 'Dispatches') matchesCategory = n.type === 'Dispatch' || n.type === 'Arrival';
    else if (filter === 'System') matchesCategory = n.type === 'System' || n.type === 'Broadcast';

    const matchesSearch =
      !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase()) ||
      (n.incidentId && n.incidentId.toLowerCase().includes(search.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5 w-full min-w-0">
      {/* Header and Controls */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
        isDark ? 'border-[#172338]' : 'border-slate-200'
      }`}>
        <div>
          <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <BellRing size={20} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
            Alerts & Operational Notification Feed
          </h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Real-time tactical alerts, incident resolutions, unit deployments, and field milestones
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
              }`}
            >
              <CheckCircle2 size={14} />
              <span>Mark All Read ({unreadCount})</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#15233c] hover:bg-[#1f3458] text-slate-300 hover:text-white border border-[#223554]'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Trash2 size={13} />
              <span>Clear Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`border rounded-2xl p-3.5 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
          <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Alerts Logged</span>
          <span className={`text-xl font-bold font-mono mt-0.5 block ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{notifications.length}</span>
          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Continuous operation log</span>
        </div>

        <div className={`border rounded-2xl p-3.5 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
          <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Unread Notifications</span>
          <span className={`text-xl font-bold font-mono mt-0.5 block ${unreadCount > 0 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
            {unreadCount}
          </span>
          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Requires dispatcher check</span>
        </div>

        <div className={`border rounded-2xl p-3.5 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
          <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Resolved Incidents</span>
          <span className={`text-xl font-bold font-mono mt-0.5 block ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{resolutionCount}</span>
          <span className={`text-[10px] ${isDark ? 'text-emerald-500/80' : 'text-emerald-600'}`}>Archived & secured</span>
        </div>

        <div className={`border rounded-2xl p-3.5 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
          <span className={`text-[10px] uppercase font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Dispatch Updates</span>
          <span className={`text-xl font-bold font-mono mt-0.5 block ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{dispatchCount}</span>
          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Fleet telemetry events</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border p-3 rounded-2xl ${
        isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'All', label: `All (${notifications.length})` },
              { id: 'Unread', label: `Unread (${unreadCount})` },
              { id: 'Resolutions', label: `Resolved (${resolutionCount})` },
              { id: 'Incidents', label: `Incidents (${incidentCount})` },
              { id: 'Dispatches', label: `Dispatches (${dispatchCount})` },
              { id: 'System', label: `System (${systemCount})` }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-60">
          <Search size={13} className={`absolute left-3 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <input
            type="text"
            placeholder="Search notification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-blue-500 border ${
              isDark
                ? 'bg-[#0e1626] border-[#1b2b46] text-slate-200 placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className={`border rounded-2xl p-10 text-center space-y-2 ${
            isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
          }`}>
            <BellRing size={32} className={`mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            <h3 className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>No Notifications in this Category</h3>
            <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              All system updates, emergency reports, vehicle dispatches, and resolved incidents will be persistently listed here.
            </p>
          </div>
        ) : (
          filtered.map(item => {
            const targetIncident = incidents.find(i => i.id === item.incidentId);

            // Determine visual theme based on notification type
            let iconBox = isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-200';
            let IconComponent = BellRing;
            let typeBadge = isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200';

            if (item.type === 'Resolution') {
              iconBox = isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200';
              IconComponent = CheckCircle2;
              typeBadge = isDark ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
            } else if (item.type === 'Incident') {
              iconBox = isDark ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-red-50 text-red-600 border-red-200';
              IconComponent = AlertTriangle;
              typeBadge = isDark ? 'bg-red-500/10 text-red-300 border-red-500/40' : 'bg-red-50 text-red-700 border-red-200';
            } else if (item.type === 'Dispatch') {
              iconBox = isDark ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200';
              IconComponent = Car;
              typeBadge = isDark ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40' : 'bg-cyan-50 text-cyan-700 border-cyan-200';
            } else if (item.type === 'Arrival') {
              iconBox = isDark ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200';
              IconComponent = MapPin;
              typeBadge = isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200';
            } else if (item.type === 'Broadcast') {
              iconBox = isDark ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200';
              IconComponent = Megaphone;
              typeBadge = isDark ? 'bg-purple-500/10 text-purple-300 border-purple-500/40' : 'bg-purple-50 text-purple-700 border-purple-200';
            }

            return (
              <div
                key={item.id}
                className={`border rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row gap-3.5 sm:items-start transition-all shadow-sm ${
                  isDark
                    ? (!item.isRead
                        ? 'border-blue-500/50 bg-[#0d1527]/90 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                        : 'bg-[#0b101d] border-[#172338] hover:border-slate-700')
                    : (!item.isRead
                        ? 'border-blue-300 bg-blue-50/60 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300')
                }`}
              >
                {/* Left Type Icon Box */}
                <div className={`p-2.5 rounded-xl border shrink-0 w-fit ${iconBox}`}>
                  <IconComponent size={20} />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${typeBadge}`}>
                        {item.type}
                      </span>
                      <h4 className={`font-bold text-sm ${
                        !item.isRead
                          ? isDark ? 'text-white font-black' : 'text-slate-900 font-bold'
                          : isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      )}
                    </div>

                    <div className={`flex items-center gap-2 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Clock size={12} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                      <span>{item.time}</span>
                    </div>
                  </div>

                  <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {item.message}
                  </p>

                  {/* Attached Target Incident / Unit Metadata & Actions */}
                  <div className={`mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
                    isDark ? 'border-[#172338]' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.incidentId && (
                        <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                          isDark ? 'text-slate-400 bg-[#080e1a] border-[#1a2942]' : 'text-slate-600 bg-slate-100 border-slate-200'
                        }`}>
                          Ref: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{item.incidentId}</strong>
                        </span>
                      )}

                      {item.unitId && (
                        <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                          isDark ? 'text-slate-400 bg-[#080e1a] border-[#1a2942]' : 'text-slate-600 bg-slate-100 border-slate-200'
                        }`}>
                          Unit: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{item.unitId}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      {targetIncident && onViewIncident && (
                        <button
                          onClick={() => onViewIncident(targetIncident)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isDark
                              ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40'
                              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <Eye size={12} />
                          <span>View Incident Dossier</span>
                        </button>
                      )}

                      <button
                        onClick={() => onMarkAsRead(item.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-[#132035] hover:bg-[#1b2f4f] text-slate-300 border-[#1e3252]'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                        title={item.isRead ? 'Mark as unread' : 'Mark as read'}
                      >
                        {item.isRead ? 'Mark Unread' : 'Mark Read'}
                      </button>

                      <button
                        onClick={() => onDeleteNotification(item.id)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isDark ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const VideoConferenceView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const cameras = [
    { name: 'CCTV-01 • Kilpauk Junction', area: 'Commercial Zone', status: 'Live 1080p', color: 'border-red-500/40' },
    { name: 'CCTV-02 • Anna Nagar Roundtana', area: 'Main Arterial', status: 'Live 1080p', color: 'border-blue-500/40' },
    { name: 'CCTV-03 • Vadapalani Flyover', area: 'Express Corridor', status: 'Live 1080p', color: 'border-blue-500/40' },
    { name: 'CCTV-04 • Guindy Highway', area: 'Highway Inbound', status: 'Live 1080p', color: 'border-amber-500/40' }
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Live CCTV & Video Surveillance Grid</h2>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Real-time tactical junction camera feeds</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cameras.map(c => (
          <div
            key={c.name}
            className={`border rounded-2xl overflow-hidden shadow-sm flex flex-col ${
              isDark ? `bg-[#0b101d] ${c.color}` : 'bg-white border-slate-200'
            }`}
          >
            <div className={`h-44 relative flex items-center justify-center ${isDark ? 'bg-[#070a12]' : 'bg-slate-900'}`}>
              <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1.5 shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> REC
              </div>
              <div className="absolute top-3 right-3 bg-slate-900/80 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                {c.status}
              </div>
              <Video size={36} className="text-slate-600" />
            </div>
            <div className={`p-3.5 border-t flex justify-between items-center text-xs ${
              isDark ? 'bg-[#0a0f1d] border-[#172338]' : 'bg-slate-50 border-slate-200'
            }`}>
              <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{c.name}</span>
              <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{c.area}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ReportsAnalyticsView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Reports & Operational Analytics</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Response time analytics and incident metrics</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`border rounded-2xl p-5 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            <BarChart3 size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} /> Incidents by Category
          </h3>
          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Fire Emergencies</span>
                <span className={`font-mono font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>45%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#151f32]' : 'bg-slate-100'}`}>
                <div className="h-full bg-red-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Medical Emergencies</span>
                <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>30%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#151f32]' : 'bg-slate-100'}`}>
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Traffic Collisions</span>
                <span className={`font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>15%</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#151f32]' : 'bg-slate-100'}`}>
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            <Clock size={16} className={isDark ? 'text-amber-400' : 'text-amber-600'} /> Average Response Times
          </h3>
          <div className={`flex items-end justify-around h-36 border-b pb-2 ${isDark ? 'border-[#172338]' : 'border-slate-200'}`}>
            <div className="flex flex-col items-center gap-1.5">
              <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>4.2m</span>
              <div className="w-10 bg-red-500 rounded-t-lg h-24"></div>
              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>High</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>8.5m</span>
              <div className="w-10 bg-amber-500 rounded-t-lg h-16"></div>
              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Medium</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className={`text-[11px] font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>14.1m</span>
              <div className="w-10 bg-blue-500 rounded-t-lg h-10"></div>
              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const UsersView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>User & Personnel Management</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Dispatch officers and field response personnel</p>
        </div>
      </div>
      <div className={`border rounded-2xl overflow-hidden shadow-sm ${
        isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
      }`}>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className={`text-[11px] font-semibold uppercase tracking-wider border-b ${
            isDark ? 'bg-[#0e1626]/80 text-slate-400 border-[#172338]' : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            <tr>
              <th className="px-5 py-3.5">Name</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-4 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#151f32] text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
            {[
              { name: 'Gurucharan V', role: 'System Admin', status: 'Online' },
              { name: 'Field Unit F5-12', role: 'Fire Responder', status: 'Online' },
              { name: 'Hospital Liaison Team', role: 'EMS Coordinator', status: 'Online' }
            ].map(u => (
              <tr key={u.name} className={`transition-colors ${isDark ? 'hover:bg-[#111927]/60' : 'hover:bg-slate-50'}`}>
                <td className={`px-5 py-3.5 font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{u.name}</td>
                <td className={`px-5 py-3.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{u.role}</td>
                <td className="px-4 py-3.5">
                  <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span> {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const SettingsView: React.FC = () => {
  const { theme, setTheme, isDark, isLight } = useTheme();
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [audioSirens, setAudioSirens] = useState(true);
  const [radioSounds, setRadioSounds] = useState(true);
  const [tacticalCorridors, setTacticalCorridors] = useState(true);

  return (
    <div className="space-y-6 w-full min-w-0">
      <div>
        <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>System Settings & Visual Appearance</h2>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Configure command console theme, dispatch automation, and notification preferences</p>
      </div>

      {/* Theme Selector Section */}
      <div className={`border rounded-2xl p-5 space-y-4 shadow-sm ${
        isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
      }`}>
        <div className={`flex items-center gap-2.5 pb-3 border-b ${
          isDark ? 'border-[#172338]' : 'border-slate-200'
        }`}>
          <Palette size={18} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Display Theme & Operational Mode</h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Select the display mode optimized for your operating environment</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Dark Mode Option Card */}
          <div
            onClick={() => setTheme('dark')}
            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
              isDark
                ? 'bg-[#111927] border-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.2)]'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 shadow-sm">
                <Moon size={18} />
              </div>
              {isDark ? (
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-bold font-mono flex items-center gap-1">
                  <Check size={10} /> ACTIVE
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-medium">Select</span>
              )}
            </div>

            <div className="space-y-1 mb-3">
              <h4 className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Tactical Dark Mode (Night Ops)</h4>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Refers to current tactical design. Low-glare midnight palette with neon tactical radar tiles, tailored for night response.
              </p>
            </div>

            {/* Visual Preview Miniature */}
            <div className="bg-[#070c18] border border-[#1b2a45] rounded-lg p-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]"></span>
              <span className="text-[9px] font-mono text-slate-300">INC-2026-014 • Guindy Crash</span>
              <span className="ml-auto text-[9px] font-mono text-emerald-400 font-bold">LIVE</span>
            </div>
          </div>

          {/* Light Mode Option Card */}
          <div
            onClick={() => setTheme('light')}
            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
              isLight
                ? isDark ? 'bg-slate-100 border-blue-500' : 'bg-blue-50/50 border-blue-600 shadow-sm'
                : isDark ? 'bg-[#070b14] border-[#1d2a42] hover:border-slate-600 opacity-80 hover:opacity-100' : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-amber-500 shadow-sm">
                <Sun size={18} />
              </div>
              {isLight ? (
                <span className="px-2 py-0.5 rounded-md bg-blue-100 border border-blue-300 text-blue-700 text-[10px] font-bold font-mono flex items-center gap-1">
                  <Check size={10} /> ACTIVE
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-medium">Select</span>
              )}
            </div>

            <div className="space-y-1 mb-3">
              <h4 className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Tactical Light Mode (Daytime Ops)</h4>
              <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                High-contrast daylight theme with crisp slate surfaces and bright street map tiles for maximum sunlight legibility.
              </p>
            </div>

            {/* Visual Preview Miniature */}
            <div className="bg-white border border-slate-200 rounded-lg p-2 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span className="text-[9px] font-mono text-slate-800 font-medium">INC-2026-014 • Guindy Crash</span>
              <span className="ml-auto text-[9px] font-mono text-emerald-600 font-bold">LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Automation Settings */}
      <div className={`border rounded-2xl p-5 space-y-4 shadow-sm text-xs ${
        isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
      }`}>
        <h3 className={`text-sm font-bold pb-2 border-b ${
          isDark ? 'text-slate-100 border-[#172338]' : 'text-slate-900 border-slate-200'
        }`}>Automation & Alert Configuration</h3>
        
        <div className={`flex justify-between items-center py-2 border-b ${
          isDark ? 'border-[#172338]' : 'border-slate-200'
        }`}>
          <div>
            <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Auto-Dispatch Proximity Algorithm</p>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Automatically routes the closest available vehicle to high-priority events</p>
          </div>
          <div 
            onClick={() => setAutoDispatch(!autoDispatch)}
            className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${autoDispatch ? 'bg-sky-500' : 'bg-slate-300'}`}
          >
            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all shadow ${autoDispatch ? 'right-1' : 'left-1'}`}></div>
          </div>
        </div>

        <div className={`flex justify-between items-center py-2 border-b ${
          isDark ? 'border-[#172338]' : 'border-slate-200'
        }`}>
          <div>
            <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Audio Siren Alarms for High Priority</p>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Triggers auditory sirens and voice warnings on critical incoming alerts</p>
          </div>
          <div 
            onClick={() => setAudioSirens(!audioSirens)}
            className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${audioSirens ? 'bg-sky-500' : 'bg-slate-300'}`}
          >
            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all shadow ${audioSirens ? 'right-1' : 'left-1'}`}></div>
          </div>
        </div>

        <div className={`flex justify-between items-center py-2 border-b ${
          isDark ? 'border-[#172338]' : 'border-slate-200'
        }`}>
          <div>
            <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Tactical Radio Sound FX & Chirps</p>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Play Push-to-Talk squeaks and radio static when receiving voice transmissions</p>
          </div>
          <div 
            onClick={() => setRadioSounds(!radioSounds)}
            className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${radioSounds ? 'bg-sky-500' : 'bg-slate-300'}`}
          >
            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all shadow ${radioSounds ? 'right-1' : 'left-1'}`}></div>
          </div>
        </div>

        <div className="flex justify-between items-center py-2">
          <div>
            <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>Live Green Emergency Corridors</p>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Auto-calculate traffic preemption and fastest hospital transit routes</p>
          </div>
          <div 
            onClick={() => setTacticalCorridors(!tacticalCorridors)}
            className={`w-9 h-5 rounded-full relative cursor-pointer transition-colors ${tacticalCorridors ? 'bg-sky-500' : 'bg-slate-300'}`}
          >
            <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all shadow ${tacticalCorridors ? 'right-1' : 'left-1'}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const IncidentHistoryView: React.FC<{
  incidents: Incident[];
  onViewIncident: (inc: Incident) => void;
}> = ({ incidents, onViewIncident }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  
  const history = incidents.filter(i => i.status === 'Resolved' || i.status === 'Closed');
  const filtered = history.filter(i =>
    !search ||
    i.location.toLowerCase().includes(search.toLowerCase()) ||
    i.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Incident History</h2>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Comprehensive log of resolved and closed incidents</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search history..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`text-xs pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 w-40 sm:w-56 border ${
                isDark ? 'bg-[#111927] border-[#1d2a42] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>
        </div>
      </div>

      <div className={`border rounded-2xl overflow-hidden shadow-sm ${
        isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
      }`}>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className={`text-[11px] font-semibold uppercase tracking-wider border-b ${
            isDark ? 'bg-[#0e1626]/80 text-slate-400 border-[#172338]' : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            <tr>
              <th className="px-5 py-3.5">ID</th>
              <th className="px-4 py-3.5">Type</th>
              <th className="px-5 py-3.5">Location</th>
              <th className="px-4 py-3.5">Time Frame</th>
              <th className="px-4 py-3.5">Responders</th>
              <th className="px-4 py-3.5">Summary</th>
              <th className="px-4 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-[#151f32] text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
            {filtered.map(inc => (
              <tr key={inc.id} className={`transition-colors ${isDark ? 'hover:bg-[#111927]/60' : 'hover:bg-slate-50'}`}>
                <td className={`px-5 py-3.5 font-mono font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{inc.id}</td>
                <td className="px-4 py-3.5 font-medium">{inc.type}</td>
                <td className={`px-5 py-3.5 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{inc.location}</td>
                <td className={`px-4 py-3.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                   {inc.time} - {inc.resolvedDetails?.time || 'N/A'}
                </td>
                <td className={`px-4 py-3.5 ${isDark ? 'text-blue-300' : 'text-blue-600 font-medium'}`}>
                   {inc.resolvedDetails?.responders?.join(', ') || inc.dispatch || 'N/A'}
                </td>
                <td className={`px-4 py-3.5 max-w-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`} title={inc.resolvedDetails?.actionSummary || inc.description}>
                   {inc.resolvedDetails?.actionSummary || inc.description || 'Resolved.'}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <button
                    onClick={() => onViewIncident(inc)}
                    className={`p-1.5 rounded-lg transition-colors inline-flex cursor-pointer ${
                      isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className={`px-5 py-8 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No incident history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ManualView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>User Manual & Standard Operating Procedures</h2>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Complete guide to platform usage, operational procedures, and incident requirements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Platform Usage Guide */}
        <div className={`border rounded-2xl p-5 md:col-span-2 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
           <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
            <LayoutDashboard size={18} /> How to Use This Platform
          </h3>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
             <div className={`p-3.5 rounded-xl border ${
               isDark ? 'bg-[#0e1626] border-[#1a2942]' : 'bg-slate-50 border-slate-200'
             }`}>
                <h4 className={`font-bold mb-2 flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  <AlertTriangle size={14} className={isDark ? 'text-red-400' : 'text-red-600'}/> Managing Incidents
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Incidents are monitored via the <strong>Dashboard</strong> or <strong>Dispatch Map</strong>. Only <i>Active</i> incidents are shown. Once all required responders arrive and complete their operations (approx. 5-10 mins), the incident automatically routes to the <strong>Incident History</strong> archive.
                </p>
             </div>
             <div className={`p-3.5 rounded-xl border ${
               isDark ? 'bg-[#0e1626] border-[#1a2942]' : 'bg-slate-50 border-slate-200'
             }`}>
                <h4 className={`font-bold mb-2 flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  <Zap size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'}/> Proximity Dispatch
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Use the <strong>Nearby Units Panel</strong> on the Dashboard. Select a target incident, and it will calculate ETA for all field vehicles. Click <strong>Dispatch Required Units</strong> to instantly automatically dispatch the optimal units based on the incident's SOP.
                </p>
             </div>
             <div className={`p-3.5 rounded-xl border ${
               isDark ? 'bg-[#0e1626] border-[#1a2942]' : 'bg-slate-50 border-slate-200'
             }`}>
                <h4 className={`font-bold mb-2 flex items-center gap-1.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  <MessageSquare size={14} className={isDark ? 'text-emerald-400' : 'text-emerald-600'}/> Tactical Communications
                </h4>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Go to <strong>Secure Chat</strong> to monitor encrypted comms. Use <strong>Quick Directives</strong> to instantly broadcast commands (e.g. "Expedite Route", "Request Backup") to responders on a specific incident net.
                </p>
             </div>
          </div>
        </div>

        {/* Existing SOPs */}
        <div className={`border rounded-2xl p-5 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            <ShieldAlert size={18} /> Incident Types & Required Responses
          </h3>
          <div className="space-y-4 text-sm">
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#111927] border-[#1d2a42]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Accidents</div>
              <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Vehicular collisions and transport-related emergencies.</p>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase border ${
                  isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-200'
                }`}>1+ Ambulance</span>
                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase border ${
                  isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>1+ Police</span>
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#111927] border-[#1d2a42]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Fires</div>
              <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Structural, electrical, and industrial fires.</p>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase border ${
                  isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-700 border-red-200'
                }`}>1-2+ Fire Engine</span>
                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase border ${
                  isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>1+ Police</span>
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${
              isDark ? 'bg-[#111927] border-[#1d2a42]' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Medical</div>
              <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Health emergencies requiring immediate life support.</p>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase border ${
                  isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-700 border-green-200'
                }`}>1+ Ambulance</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-sm ${
          isDark ? 'bg-[#0b101d] border-[#172338]' : 'bg-white border-slate-200'
        }`}>
           <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
            <Navigation size={18} /> Field Operations & Logic
          </h3>
          <div className={`space-y-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
             <p className="leading-relaxed">
               <strong>Unit Constraints:</strong> Vehicles can only be assigned to a single active incident at a time. A unit must complete its current assignment or be manually recalled before it can be dispatched elsewhere.
             </p>
             <p className="leading-relaxed">
               <strong>Automated Scene Resolution:</strong> The backend simulation strictly enforces time on scene. An incident will NOT resolve until the precisely required combination of vehicles arrives and remains on-scene for the minimum required duration.
             </p>
             <p className="leading-relaxed">
               <strong>Sync Integrity:</strong> Live clocks and automated background tasks are synced to global standard time, preventing synchronization drift during complex field ops.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
