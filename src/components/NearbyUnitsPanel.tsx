import React, { useState } from 'react';
import {
  Car,
  Flame,
  Shield,
  Stethoscope,
  Truck,
  Navigation,
  CheckCircle2,
  Clock,
  Radio,
  Fuel,
  ArrowRight,
  Filter,
  Zap,
  MapPin,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Gauge,
  PhoneCall
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Incident, Vehicle } from '../types';
import { calculateDistanceKm, calculateEtaMinutes, playRadioChirp, getUnitStyles, getUnitCategory } from '../utils/tacticalUtils';

interface NearbyUnitsPanelProps {
  vehicles: Vehicle[];
  incidents: Incident[];
  selectedIncidentId: string;
  onSelectIncidentId: (id: string) => void;
  onDispatchVehicle: (vehicleId: string, incidentId: string) => void;
  onRecallVehicle: (vehicleId: string) => void;
  onOpenCommsWithVehicle?: (vehicleId: string) => void;
  onOpenRadioCall?: (target: { type: 'Unit' | 'Channel'; id: string; name: string; vehicle?: Vehicle }) => void;
  compact?: boolean;
}

export const NearbyUnitsPanel: React.FC<NearbyUnitsPanelProps> = ({
  vehicles,
  incidents,
  selectedIncidentId,
  onSelectIncidentId,
  onDispatchVehicle,
  onRecallVehicle,
  onOpenCommsWithVehicle,
  onOpenRadioCall,
  compact = false
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [typeFilter, setTypeFilter] = useState<'All' | 'Ambulance' | 'Police' | 'Fire' | 'Rescue' | 'Hazmat' | 'Drone' | 'Marine'>('All');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const currentIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0];

  // Calculate distance, ETA, and sort stably by proximity with deterministic tie-breaker
  const sortedVehicles = [...vehicles]
    .map(v => {
      const distance = currentIncident
        ? Number(calculateDistanceKm(v.lat, v.lng, currentIncident.lat, currentIncident.lng).toFixed(1))
        : 0;
      const eta = calculateEtaMinutes(distance);
      const isAssignedToThis = v.assignedIncidentId === currentIncident?.id;
      return {
        ...v,
        distance,
        eta,
        isAssignedToThis
      };
    })
    .filter(v => {
      const matchType = typeFilter === 'All' || v.type === typeFilter;
      // Strictly filter to Available only when toggle is on
      const matchStatus = onlyAvailable ? v.status === 'Available' : true;
      return matchType && matchStatus;
    })
    .sort((a, b) => {
      // When Available Only is OFF, keep vehicles assigned to current incident at the very top
      if (!onlyAvailable && a.isAssignedToThis !== b.isAssignedToThis) {
        return a.isAssignedToThis ? -1 : 1;
      }
      // Primary sort by distance
      const diff = a.distance - b.distance;
      if (Math.abs(diff) > 0.01) {
        return diff;
      }
      // Deterministic secondary tie-breaker by unit ID to prevent jumping/reordering
      return a.id.localeCompare(b.id);
    });

  const availableCount = vehicles.filter(v => v.status === 'Available').length;
  const dispatchedCount = vehicles.filter(v => v.status === 'Dispatched' || v.status === 'En Route').length;
  const closestUnit = sortedVehicles[0];

  const handleDispatch = (vehicleId: string) => {
    if (!currentIncident) return;
    playRadioChirp('transmit');
    onDispatchVehicle(vehicleId, currentIncident.id);
  };

  const handleRecall = (vehicleId: string) => {
    playRadioChirp('roger');
    onRecallVehicle(vehicleId);
  };

  const handleFastDispatchClosest = () => {
    if (!currentIncident) return;
    
    // Auto-dispatch required responses
    if (currentIncident.requiredResponses) {
      let dispatchedCount = 0;
      currentIncident.requiredResponses.forEach(req => {
         const needed = req.count;
         // Find available vehicles of this type closest to the incident
         const availableOfType = sortedVehicles.filter(v => v.type === req.type && v.status === 'Available');
         for (let i = 0; i < Math.min(needed, availableOfType.length); i++) {
            handleDispatch(availableOfType[i].id);
            dispatchedCount++;
         }
      });
      if (dispatchedCount > 0) return;
    }
    
    // Fallback: just dispatch the closest unit if no requirements specified or met
    if (closestUnit && closestUnit.status === 'Available') {
      handleDispatch(closestUnit.id);
    }
  };

  return (
    <div className={`flex flex-col overflow-hidden ${
      compact
        ? 'h-full bg-transparent'
        : isDark
        ? 'bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4 sm:p-5 shadow-xs'
        : 'bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs'
    }`}>
      {/* Header & Target Incident Selector */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${
              isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <Zap size={16} />
            </div>
            <div>
              <h3 className={`font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Proximity Dispatch Engine</h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Sorted by shortest ETA to active target incident
              </p>
            </div>
          </div>
        </div>

        {/* Target Incident Selector */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
          isDark ? 'bg-slate-800/80 border-slate-700/70' : 'bg-slate-50 border-slate-200'
        }`}>
          <MapPin size={13} className="text-rose-400 shrink-0" />
          <span className={`text-[10px] font-bold uppercase shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Incident:</span>
          <select
            value={currentIncident?.id || ''}
            onChange={(e) => onSelectIncidentId(e.target.value)}
            className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer max-w-[180px] truncate ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            {incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').map(inc => (
              <option key={inc.id} value={inc.id} className={isDark ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-800'}>
                {inc.id} • {inc.location} ({inc.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Summary Bar */}
      <div className={`grid grid-cols-3 gap-2 py-2.5 border-b text-center ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className={`py-1.5 px-2 rounded-xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-emerald-50/60 border-emerald-200'
        }`}>
          <span className={`text-[10px] font-medium block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Available</span>
          <span className="text-xs font-bold font-mono text-emerald-400 dark:text-emerald-300">{availableCount} Units</span>
        </div>
        <div className={`py-1.5 px-2 rounded-xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-sky-50/60 border-sky-200'
        }`}>
          <span className={`text-[10px] font-medium block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>En Route</span>
          <span className="text-xs font-bold font-mono text-sky-400 dark:text-sky-300">{dispatchedCount} Units</span>
        </div>
        <div className={`py-1.5 px-2 rounded-xl border ${
          isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-amber-50/60 border-amber-200'
        }`}>
          <span className={`text-[10px] font-medium block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Closest ETA</span>
          <span className="text-xs font-bold font-mono text-amber-400 dark:text-amber-300">
            {closestUnit ? `~${closestUnit.eta}m (${closestUnit.distance}km)` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Options */}
      <div className={`flex flex-wrap items-center justify-between gap-2 py-2.5 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className={`flex p-1 rounded-xl border gap-1 overflow-x-auto ${
          isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-100 border-slate-200'
        }`}>
          {(['All', 'Ambulance', 'Police', 'Fire', 'Rescue', 'Hazmat', 'Drone', 'Marine'] as const).map((filter) => {
            const isSelected = typeFilter === filter;
            if (filter === 'Fire') {
              return (
                <button
                  key={filter}
                  onClick={() => setTypeFilter(filter)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap border cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-rose-400 text-slate-950 shadow-xs border-rose-300 font-bold'
                        : 'bg-white text-rose-700 border border-rose-300 shadow-xs font-bold'
                      : isDark
                      ? 'text-rose-300 hover:bg-rose-950/40 hover:text-rose-100 border-rose-400/20'
                      : 'text-slate-700 hover:bg-rose-50 hover:text-rose-700 border-transparent'
                  }`}
                >
                  <Flame size={12} className={isSelected ? (isDark ? 'text-slate-950' : 'text-rose-600') : 'text-rose-400'} />
                  <span>Fire</span>
                </button>
              );
            }
            if (filter === 'Police') {
              return (
                <button
                  key={filter}
                  onClick={() => setTypeFilter(filter)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap border cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-sky-400 text-slate-950 shadow-xs border-sky-300 font-bold'
                        : 'bg-white text-sky-700 border border-sky-300 shadow-xs font-bold'
                      : isDark
                      ? 'text-sky-300 hover:bg-sky-950/40 hover:text-sky-100 border-sky-400/20'
                      : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700 border-transparent'
                  }`}
                >
                  <Shield size={12} className={isSelected ? (isDark ? 'text-slate-950' : 'text-sky-600') : 'text-sky-400'} />
                  <span>Police</span>
                </button>
              );
            }
            if (filter === 'Ambulance') {
              return (
                <button
                  key={filter}
                  onClick={() => setTypeFilter(filter)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap border cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-emerald-400 text-emerald-950 shadow-xs border-emerald-300 font-bold'
                        : 'bg-white text-emerald-700 border border-emerald-300 shadow-xs font-bold'
                      : isDark
                      ? 'text-emerald-300 hover:bg-emerald-950/40 hover:text-emerald-100 border-emerald-400/20'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border-transparent'
                  }`}
                >
                  <Stethoscope size={12} className={isSelected ? (isDark ? 'text-emerald-950' : 'text-emerald-600') : 'text-emerald-400'} />
                  <span>Ambulance</span>
                </button>
              );
            }
            return (
              <button
                key={filter}
                onClick={() => setTypeFilter(filter)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer border ${
                  isSelected
                    ? isDark
                      ? 'bg-slate-200 text-slate-900 shadow-xs font-bold border-slate-300'
                      : 'bg-white text-slate-900 border-slate-300 shadow-xs font-bold'
                    : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-transparent'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200 border-transparent'
                }`}
              >
                {filter === 'All' ? 'All Units' : filter}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer select-none ${
              onlyAvailable
                ? isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : isDark
                ? 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="rounded border-slate-400 text-emerald-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Available Only</span>
          </button>

          {closestUnit && closestUnit.status === 'Available' && (
            <button
              onClick={handleFastDispatchClosest}
              className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/30'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <Zap size={11} className="text-emerald-500 dark:text-emerald-300" /> Dispatch Required Units
            </button>
          )}
        </div>
      </div>

      {/* Vehicles Proximity List */}
      <div className="space-y-2 overflow-y-auto mt-2.5 flex-1 max-h-[460px] pr-0.5">
        {sortedVehicles.length === 0 ? (
          <div className={`p-6 text-center text-xs rounded-xl border ${
            isDark ? 'text-slate-400 bg-slate-800/40 border-slate-700/60' : 'text-slate-500 bg-slate-50 border-slate-200'
          }`}>
            No response vehicles match the active filter criteria.
          </div>
        ) : (
          sortedVehicles.map((vehicle, idx) => {
            const unitStyles = getUnitStyles(vehicle.type || vehicle.id, isDark);
            return (
              <div
                key={vehicle.id}
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  vehicle.isAssignedToThis
                    ? isDark
                      ? 'bg-slate-800/90 border-emerald-400/50 shadow-xs'
                      : 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                    : vehicle.status === 'Available'
                    ? isDark
                      ? `bg-slate-800/60 ${unitStyles.borderGlow} hover:border-slate-600`
                      : `bg-white border-slate-200 hover:border-slate-300 shadow-xs`
                    : isDark
                    ? 'bg-slate-800/30 border-slate-800 opacity-80'
                    : 'bg-slate-50 border-slate-200 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Left Unit Info */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Proximity Rank Badge */}
                    <div className={`flex flex-col items-center justify-center w-7 h-7 rounded-lg font-mono font-bold text-[11px] shrink-0 border ${
                      isDark ? 'bg-slate-800 text-emerald-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      #{idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Unit ID Chip with distinct color */}
                        <span className={`px-2 py-0.5 text-xs rounded-md border flex items-center gap-1 ${unitStyles.idBadge}`}>
                          {unitStyles.category === 'Fire' && <Flame size={12} className={isDark ? "text-rose-300" : "text-rose-600"} />}
                          {unitStyles.category === 'Police' && <Shield size={12} className={isDark ? "text-sky-300" : "text-sky-600"} />}
                          {unitStyles.category === 'Ambulance' && <Stethoscope size={12} className={isDark ? "text-emerald-300" : "text-emerald-600"} />}
                          {vehicle.id}
                        </span>

                        {/* Unit Name with colored accent */}
                        <span className={`font-bold text-xs ${isDark ? unitStyles.nameText : 'text-slate-900'}`}>
                          {vehicle.name}
                        </span>

                        <span
                          className={`px-1.5 py-0.2 text-[10px] font-semibold rounded-md border ${
                            vehicle.status === 'Available'
                              ? isDark ? 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              : vehicle.isAssignedToThis
                              ? isDark ? 'text-emerald-300 bg-emerald-500/20 border-emerald-400/40 animate-pulse' : 'text-emerald-700 bg-emerald-100 border-emerald-200 animate-pulse'
                              : isDark ? 'text-amber-300 bg-amber-500/15 border-amber-400/30' : 'text-amber-700 bg-amber-50 border-amber-200'
                          }`}
                        >
                          {vehicle.isAssignedToThis ? 'Assigned (En Route)' : vehicle.status}
                        </span>
                      </div>

                      <div className={`flex items-center gap-2.5 text-[11px] mt-1 flex-wrap ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <span>Base: <strong className={`font-normal ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{vehicle.station}</strong></span>
                        <span>•</span>
                        <span>Crew: <strong className={`font-normal ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{vehicle.driver}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Fuel size={11} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{vehicle.fuel}%</span>
                        </span>
                      </div>
                    </div>
                  </div>

                {/* Right Proximity & Actions */}
                <div className={`flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  {/* Distance & ETA Badge */}
                  <div className="text-left sm:text-right">
                    <div className="flex items-center sm:justify-end gap-1 text-xs font-mono font-bold text-amber-400 dark:text-amber-300">
                      <Navigation size={11} className="text-amber-400 dark:text-amber-300 rotate-45" />
                      <span>{vehicle.distance} km</span>
                    </div>
                    <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300 flex items-center sm:justify-end gap-1">
                      <Clock size={11} />
                      <span>~{vehicle.eta} min ETA</span>
                    </div>
                  </div>

                  {/* Dispatch / Recall / Comms / Radio Call Buttons */}
                  <div className="flex items-center gap-1.5">
                    {onOpenRadioCall && (
                      <button
                        onClick={() => onOpenRadioCall({ type: 'Unit', id: vehicle.id, name: vehicle.name, vehicle })}
                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                        title={`Start 2-Way Radio Call with ${vehicle.id}`}
                      >
                        <PhoneCall size={13} className="text-emerald-600 dark:text-emerald-300" />
                      </button>
                    )}

                    {onOpenCommsWithVehicle && (
                      <button
                        onClick={() => onOpenCommsWithVehicle(vehicle.id)}
                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                        title={`Open direct tactical comms with ${vehicle.id}`}
                      >
                        <Radio size={13} />
                      </button>
                    )}

                    {vehicle.isAssignedToThis ? (
                      <button
                        onClick={() => handleRecall(vehicle.id)}
                        className={`px-2.5 py-1 border rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs cursor-pointer ${
                          isDark ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-400/30' : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                        title="Stand down / recall vehicle"
                      >
                        <RotateCcw size={12} />
                        <span>Recall</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDispatch(vehicle.id)}
                        disabled={vehicle.status === 'Maintenance'}
                        className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-xs border ${
                          vehicle.status === 'Available'
                            ? 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950 border-emerald-300'
                            : isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                      >
                        <Zap size={12} />
                        <span>{vehicle.status === 'Available' ? 'Dispatch' : 'Reassign'}</span>
                      </button>
                    )}
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
