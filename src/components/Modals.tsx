import React, { useState } from 'react';
import {
  X,
  MapPin,
  Flame,
  Car,
  Stethoscope,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Radio,
  Clock,
  RotateCcw,
  Cpu,
  Sparkles,
  Sliders
} from 'lucide-react';
import { Incident, Vehicle } from '../types';
import { calculateDistanceKm, calculateEtaMinutes, playRadioChirp, getUnitStyles } from '../utils/tacticalUtils';
import { useTheme } from '../context/ThemeContext';
import { AutonomousAgentTraceTerminal, AutomatedDispatchPlan } from './AutonomousAgentTraceTerminal';

const WORKFLOW_STATUSES = [
  'In Progress',
  'Assigned',
  'Resolved',
  'Incident Reported',
  'Assess & Prioritize',
  'Dispatch',
  'Track Response',
  'Coordinate',
  'Closed'
];

interface IncidentModalProps {
  incident: Incident | null;
  vehicles?: Vehicle[];
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: any) => void;
  onDispatchVehicle?: (vehicleId: string, incidentId: string) => void;
  onRecallVehicle?: (vehicleId: string) => void;
  onOpenComms?: (incidentId: string) => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  incident,
  vehicles = [],
  onClose,
  onUpdateStatus,
  onDispatchVehicle,
  onRecallVehicle,
  onOpenComms
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'autonomous_agent' | 'tactical_details'>('autonomous_agent');

  if (!incident) return null;

  const currentIdx = Math.max(0, WORKFLOW_STATUSES.indexOf(incident.status));

  const handleExecuteAutonomousDispatch = (plan: AutomatedDispatchPlan) => {
    playRadioChirp('alert');
    if (onDispatchVehicle && plan.recommendedUnits.length > 0) {
      plan.recommendedUnits.forEach(u => {
        onDispatchVehicle(u.vehicle.id, incident.id);
      });
    }
    onUpdateStatus(incident.id, 'Dispatch');
    onClose();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Fire':
        return <Flame size={18} className={isDark ? "text-red-400" : "text-red-600"} />;
      case 'Accident':
        return <Car size={18} className={isDark ? "text-amber-400" : "text-amber-600"} />;
      case 'Medical':
        return <Stethoscope size={18} className={isDark ? "text-cyan-400" : "text-emerald-600"} />;
      default:
        return <Shield size={18} className={isDark ? "text-emerald-400" : "text-blue-600"} />;
    }
  };

  // Compute nearest vehicles for this specific incident
  const nearbyVehicles = vehicles
    .map(v => {
      const distance = calculateDistanceKm(v.lat, v.lng, incident.lat, incident.lng);
      const eta = calculateEtaMinutes(distance);
      const isAssigned = v.assignedIncidentId === incident.id;
      return { ...v, distance, eta, isAssigned };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md">
      <div className={`border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin animate-in zoom-in-95 duration-200 ${
        isDark ? 'bg-[#0a101d] border-[#223350] text-slate-100 scrollbar-thumb-slate-800' : 'bg-white border-slate-300 text-slate-900 scrollbar-thumb-slate-300'
      }`}>
        {/* Modal Header with View Selector Tabs */}
        <div className={`flex flex-wrap justify-between items-center p-3.5 sm:p-4 border-b sticky top-0 z-10 backdrop-blur-md ${
          isDark ? 'border-[#1b2a45] bg-[#080d19]/95' : 'border-slate-200 bg-white/95'
        }`}>
          <div className="flex items-center gap-2">
            <h3 className={`font-bold flex items-center gap-1.5 text-sm sm:text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <span>Incident:</span>
              <span className="text-sky-400 font-mono">{incident.id}</span>
            </h3>
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
              incident.priority === 'High'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              {incident.priority}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-[#111928] p-0.5 rounded-xl border border-[#1e2d46]">
              <button
                type="button"
                onClick={() => setActiveTab('autonomous_agent')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'autonomous_agent'
                    ? 'bg-sky-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu size={13} />
                <span>Autonomous Agent Trace</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tactical_details')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'tactical_details'
                    ? 'bg-sky-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders size={13} />
                <span>CAD Manual Dispatch</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white bg-[#15233c] hover:bg-[#1c3055]' : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Autonomous Multi-Agent Terminal View */}
          {activeTab === 'autonomous_agent' ? (
            <AutonomousAgentTraceTerminal
              incident={incident}
              vehicles={vehicles}
              onExecuteDispatch={handleExecuteAutonomousDispatch}
              onClose={onClose}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl border shadow-inner ${
                    isDark ? 'bg-[#15233c] border-blue-500/20' : 'bg-blue-50 border-blue-200'
                  }`}>
                    {getTypeIcon(incident.type)}
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{incident.type} Emergency</p>
                    <p className={`text-xs flex items-center gap-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <MapPin size={13} className="text-red-500" /> {incident.location}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black border ${
                    incident.priority === 'High'
                      ? isDark ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-red-800 bg-red-50 border-red-200'
                      : isDark ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-amber-800 bg-amber-50 border-amber-200'
                  }`}
                >
                  {incident.priority.toUpperCase()} PRIORITY
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#111c30]/60 border-[#1b2a45]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Status</p>
                  <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    {incident.status}
                  </div>
                </div>
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#111c30]/60 border-[#1b2a45]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Reported Time</p>
                  <p className={`font-bold font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{incident.time} • Live Report</p>
                </div>
                <div className={`p-3 rounded-xl border col-span-2 ${
                  isDark ? 'bg-[#111c30]/60 border-[#1b2a45]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Active Dispatch Units</p>
                  <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{incident.dispatch || 'Pending Dispatch Assignment'}</p>
                </div>
              </div>

              {/* Nearest Available Units Quick Dispatch */}
              {nearbyVehicles.length > 0 && (
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                  isDark ? 'bg-[#090e1a] border-[#1d2d47]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      <Zap size={14} className="text-amber-500" /> Nearest Proximity Response Units
                    </span>
                    <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Sorted by ETA</span>
                  </div>

                  <div className="space-y-2">
                    {nearbyVehicles.map(v => {
                      const unitStyles = getUnitStyles(v.type || v.id, isDark);
                      return (
                        <div
                          key={v.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                            isDark ? `bg-[#0e1626] ${unitStyles.borderGlow}` : 'bg-white border-slate-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] border ${unitStyles.idBadge}`}>
                              {v.id}
                            </span>
                            <div className="flex items-center gap-1">
                              {unitStyles.category === 'Fire' && <Flame size={12} className={isDark ? "text-red-400" : "text-red-600"} />}
                              {unitStyles.category === 'Police' && <Shield size={12} className={isDark ? "text-blue-400" : "text-blue-600"} />}
                              {unitStyles.category === 'Ambulance' && <Stethoscope size={12} className={isDark ? "text-emerald-400" : "text-emerald-600"} />}
                              {unitStyles.category === 'Hazmat' && <AlertTriangle size={12} className={isDark ? "text-yellow-400" : "text-amber-600"} />}
                              {unitStyles.category === 'Rescue' && <Car size={12} className={isDark ? "text-orange-400" : "text-orange-600"} />}
                              <span className={`font-bold ${isDark ? unitStyles.nameText : 'text-slate-900'}`}>{v.name}</span>
                            </div>
                            <span className="text-[11px] font-mono text-amber-500 font-bold ml-1">
                              {v.distance} km (~{v.eta} min)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {v.isAssigned ? (
                              <button
                                onClick={() => onRecallVehicle && onRecallVehicle(v.id)}
                                className={`px-2.5 py-1 border rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                                  isDark ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300'
                                }`}
                              >
                                <RotateCcw size={11} /> Recall
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (onDispatchVehicle) {
                                    playRadioChirp('transmit');
                                    onDispatchVehicle(v.id, incident.id);
                                  }
                                }}
                                className="px-3 py-1 bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-sky-300 shadow-xs cursor-pointer"
                              >
                                <Zap size={11} /> Dispatch
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Workflow Progression */}
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Workflow Progression
                </p>
                <div className={`w-full h-2 rounded-full overflow-hidden mb-3 ${isDark ? 'bg-[#151f32]' : 'bg-slate-200'}`}>
                  <div
                    className="bg-blue-500 h-full transition-all shadow-[0_0_8px_#3b82f6]"
                    style={{ width: `${Math.max(15, (currentIdx / (WORKFLOW_STATUSES.length - 1)) * 100)}%` }}
                  ></div>
                </div>

                {/* Status Change Dropdown */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isDark ? 'bg-[#111c30] border-[#1b2a45]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-xs font-medium uppercase shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Update Status:</span>
                  <select
                    value={incident.status}
                    onChange={(e) => onUpdateStatus(incident.id, e.target.value)}
                    className={`flex-1 text-xs font-semibold rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer border ${
                      isDark ? 'bg-[#090e1a] border-[#243450] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {WORKFLOW_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex justify-between items-center ${
          isDark ? 'border-[#1b2a45] bg-[#090e1a]' : 'border-slate-200 bg-slate-50'
        }`}>
          {onOpenComms ? (
            <button
              onClick={() => {
                onClose();
                onOpenComms(incident.id);
              }}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isDark ? 'bg-[#15233c] hover:bg-[#1c345a] text-blue-400 border-blue-500/30' : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
              }`}
            >
              <Radio size={14} /> Open Tactical Comms
            </button>
          ) : (
            <div></div>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-xl border border-sky-300 shadow-sm transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export const AddIncidentModal: React.FC<{
  onClose: () => void;
  onSave: (data: { type: any; location: string; priority: any }) => void;
}> = ({ onClose, onSave }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [type, setType] = useState('Fire');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('High');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    onSave({ type, location, priority });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className={`border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 ${
        isDark ? 'bg-[#0e1626] border-[#243450]' : 'bg-white border-slate-300'
      }`}>
        <div className={`flex justify-between items-center p-4 border-b ${
          isDark ? 'border-[#1b2a45] bg-[#090e1a]' : 'border-slate-200 bg-slate-50'
        }`}>
          <h3 className={`font-bold flex items-center gap-2 text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <Flame size={18} className="text-red-500" />
            Report New Emergency Incident
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white bg-[#15233c]' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Incident Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={`w-full rounded-xl p-2.5 font-bold focus:ring-1 focus:ring-blue-500 border ${
                isDark ? 'bg-[#111927] border-[#1d2a42] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="Fire">Fire Emergency</option>
              <option value="Accident">Accident / Collision</option>
              <option value="Medical">Medical Emergency</option>
              <option value="Other">Rescue / Other Hazard</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Location / Address</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Marina Beach Road, Chennai"
              className={`w-full rounded-xl p-2.5 focus:ring-1 focus:ring-blue-500 border ${
                isDark ? 'bg-[#111927] border-[#1d2a42] text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Priority Level</label>
            <div className="grid grid-cols-3 gap-2">
              {['High', 'Medium', 'Low'].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    priority === p
                      ? p === 'High'
                        ? isDark ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-sm' : 'bg-red-50 text-red-700 border-red-400'
                        : isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm' : 'bg-amber-50 text-amber-700 border-amber-400'
                      : isDark ? 'bg-[#111927] text-slate-400 border-[#1d2a42]' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 font-bold rounded-xl cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold border border-sky-300 rounded-xl shadow-sm cursor-pointer"
            >
              Log Incident
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AddResourceModal: React.FC<{
  onClose: () => void;
  onSave: (data: { type: string; station: string }) => void;
}> = ({ onClose, onSave }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [type, setType] = useState('Fire Engine');
  const [station, setStation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!station.trim()) return;
    onSave({ type, station });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <div className={`border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 ${
        isDark ? 'bg-[#0e1626] border-[#243450]' : 'bg-white border-slate-300'
      }`}>
        <div className={`flex justify-between items-center p-4 border-b ${
          isDark ? 'border-[#1b2a45] bg-[#090e1a]' : 'border-slate-200 bg-slate-50'
        }`}>
          <h3 className={`font-bold flex items-center gap-2 text-base ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            <Shield size={18} className="text-blue-500" />
            Add Response Fleet Unit
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white bg-[#15233c]' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Unit Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={`w-full rounded-xl p-2.5 font-bold focus:ring-1 focus:ring-blue-500 border ${
                isDark ? 'bg-[#111927] border-[#1d2a42] text-slate-200' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="Fire Engine">Fire Engine (FE)</option>
              <option value="Police Vehicle">Police Patrol Vehicle (PV)</option>
              <option value="Ambulance">Advanced Ambulance (AMB)</option>
              <option value="Rescue Team">Heavy Disaster Rescue (RT)</option>
              <option value="Hazmat">Hazmat Decontamination Unit (HZ)</option>
              <option value="Drone">Tactical Aerial Recon UAV (UAV)</option>
              <option value="Marine">Coastal Marine Interceptor (CGR)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Station / Base</label>
            <input
              type="text"
              required
              value={station}
              onChange={(e) => setStation(e.target.value)}
              placeholder="e.g. Central Fire Station, Guindy Precinct"
              className={`w-full rounded-xl p-2.5 focus:ring-1 focus:ring-blue-500 border ${
                isDark ? 'bg-[#111927] border-[#1d2a42] text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 font-bold rounded-xl cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold border border-sky-300 rounded-xl shadow-sm cursor-pointer"
            >
              Deploy Unit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { EquipmentInspectionModal } from './EquipmentInspectionModal';
