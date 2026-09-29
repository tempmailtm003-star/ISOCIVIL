import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, Circle, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  Layers,
  Navigation2,
  Car,
  Camera,
  Maximize2,
  Plus,
  Minus,
  Locate,
  MapPin,
  Clock,
  Zap,
  Radio,
  Fuel,
  ChevronRight,
  RotateCcw,
  Flame,
  Shield,
  Stethoscope,
  Building2,
  Phone,
  Bed,
  CheckCircle2,
  AlertTriangle,
  Siren,
  Users,
  Truck,
  Play,
  Pause,
  FastForward,
  Sparkles,
  X,
  RefreshCw,
  PhoneCall,
  Biohazard,
  Radiation,
  Waves,
  Wind,
  Skull,
  AlertOctagon,
  ChevronDown,
  Navigation,
  Activity,
  HeartPulse,
  Crosshair,
  Lock,
  Unlock,
  Sliders,
  Check
} from 'lucide-react';
import { Incident, Vehicle, Hospital, PoliceStation, FireStation, EmergencySanctuary } from '../types';
import { CHENNAI_HOSPITALS } from '../data/hospitalsData';
import { CHENNAI_POLICE_STATIONS, CHENNAI_FIRE_STATIONS } from '../data/stationsData';
import { calculateDistanceKm, calculateEtaMinutes, playRadioChirp } from '../utils/tacticalUtils';
import { NearbyUnitsPanel } from './NearbyUnitsPanel';
import { useTheme } from '../context/ThemeContext';

interface LiveIncidentMapProps {
  fullScreen?: boolean;
  incidents: Incident[];
  vehicles?: Vehicle[];
  hospitals?: Hospital[];
  policeStations?: PoliceStation[];
  fireStations?: FireStation[];
  selectedIncidentId?: string;
  onSelectIncidentId?: (id: string) => void;
  onViewIncident: (inc: Incident) => void;
  onDispatchVehicle?: (vehicleId: string, incidentId: string) => void;
  onRecallVehicle?: (vehicleId: string) => void;
  onOpenCommsWithVehicle?: (vehicleId: string) => void;
  onOpenRadioCall?: (target: { type: 'Unit' | 'Channel'; id: string; name: string; vehicle?: Vehicle }) => void;
  onExpandView?: () => void;
  isSimulationActive?: boolean;
  onToggleSimulation?: () => void;
  onSimulateIncident?: () => void;
  isAutoEventsActive?: boolean;
  onToggleAutoEvents?: () => void;
  isDisasterModeActive?: boolean;
  onToggleDisasterMode?: () => void;
  onTriggerDisasterScenario?: (scenarioType: string) => void;
  latestResolvedIncident?: { id: string; location: string; unitName: string; time: string } | null;
  onClearResolvedNotice?: () => void;
  sanctuaries?: EmergencySanctuary[];
  onAddSanctuary?: (sanctuary: EmergencySanctuary) => void;
  onUpdateSanctuary?: (id: string, updates: Partial<EmergencySanctuary>) => void;
  onRemoveSanctuary?: (id: string) => void;
  isHospitalSurgeActive?: boolean;
  onToggleHospitalSurge?: (active?: boolean) => void;
}

// Tactical Map Click Placement Listener for Dropping Sanctuaries anywhere
const MapClickPlacementHandler: React.FC<{
  isPlacementActive: boolean;
  onMapClick: (lat: number, lng: number) => void;
}> = ({ isPlacementActive, onMapClick }) => {
  useMapEvents({
    click(e) {
      if (isPlacementActive) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
};

// Detailed Tactical SVG Icons for Vehicles & Incidents
const FIRE_TRUCK_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="fire-truck-svg-icon">
  <!-- Top Telescopic Rescue Ladder -->
  <line x1="2.5" y1="3.5" x2="16.5" y2="3.5" stroke="#f8fafc" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="2.5" y1="5.5" x2="16.5" y2="5.5" stroke="#f8fafc" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="4.5" y1="3.5" x2="4.5" y2="5.5" stroke="#f8fafc" stroke-width="1"/>
  <line x1="8" y1="3.5" x2="8" y2="5.5" stroke="#f8fafc" stroke-width="1"/>
  <line x1="11.5" y1="3.5" x2="11.5" y2="5.5" stroke="#f8fafc" stroke-width="1"/>
  <line x1="15" y1="3.5" x2="15" y2="5.5" stroke="#f8fafc" stroke-width="1"/>
  
  <!-- High Pressure Water Cannon Turret -->
  <circle cx="16" cy="3" r="1.2" fill="#38bdf8" />
  <line x1="16" y1="3" x2="19" y2="1.5" stroke="#38bdf8" stroke-width="1.3" stroke-linecap="round" />

  <!-- Main Tender Tank & Equipment Body (Deep Emergency Red) -->
  <rect x="1" y="6.5" width="14" height="10.5" rx="1.2" fill="#dc2626" stroke="#ef4444" stroke-width="0.8" />
  
  <!-- Roll-up Shutter Compartments (Gear / Hoses) -->
  <rect x="2.5" y="8" width="4.5" height="5.5" rx="0.5" fill="#0f172a" stroke="#94a3b8" stroke-width="0.6" />
  <line x1="2.5" y1="9.8" x2="7" y2="9.8" stroke="#64748b" stroke-width="0.5" />
  <line x1="2.5" y1="11.6" x2="7" y2="11.6" stroke="#64748b" stroke-width="0.5" />

  <rect x="8" y="8" width="6" height="5.5" rx="0.5" fill="#0f172a" stroke="#94a3b8" stroke-width="0.6" />
  <line x1="8" y1="9.8" x2="14" y2="9.8" stroke="#64748b" stroke-width="0.5" />
  <line x1="8" y1="11.6" x2="14" y2="11.6" stroke="#64748b" stroke-width="0.5" />

  <!-- Heavy Cab & Windshield -->
  <path d="M15 7.5H19.5L22.8 11V17H15V7.5Z" fill="#b91c1c" stroke="#ef4444" stroke-width="0.8" />
  <path d="M16 8.5H19L21.5 11H16V8.5Z" fill="#38bdf8" opacity="0.95" />
  <circle cx="22" cy="13.5" r="0.7" fill="#fef08a" />

  <!-- Reflective Caution Diagonal Chevrons -->
  <rect x="1" y="14.2" width="14" height="1.8" fill="#facc15" />
  <line x1="3" y1="14.2" x2="4.5" y2="16" stroke="#854d0e" stroke-width="0.8" />
  <line x1="6" y1="14.2" x2="7.5" y2="16" stroke="#854d0e" stroke-width="0.8" />
  <line x1="9" y1="14.2" x2="10.5" y2="16" stroke="#854d0e" stroke-width="0.8" />
  <line x1="12" y1="14.2" x2="13.5" y2="16" stroke="#854d0e" stroke-width="0.8" />

  <!-- Heavy Duty Chassis Wheels & Hubs -->
  <circle cx="5" cy="17.5" r="2.5" fill="#090d16" stroke="#cbd5e1" stroke-width="0.9"/>
  <circle cx="5" cy="17.5" r="1" fill="#ef4444"/>
  <circle cx="18.5" cy="17.5" r="2.5" fill="#090d16" stroke="#cbd5e1" stroke-width="0.9"/>
  <circle cx="18.5" cy="17.5" r="1" fill="#ef4444"/>
</svg>
`;

const AMBULANCE_SVG = `
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
  <path d="M9 10v4" stroke="#10b981" stroke-width="2.5"/>
  <path d="M7 12h4" stroke="#10b981" stroke-width="2.5"/>
  <circle cx="7" cy="17" r="2"/>
  <circle cx="17" cy="17" r="2"/>
</svg>
`;

const POLICE_CRUISER_SVG = `
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
  <circle cx="7" cy="17" r="2"/>
  <circle cx="17" cy="17" r="2"/>
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#38bdf8" stroke="none" transform="scale(0.4) translate(15, 8)"/>
</svg>
`;

const HAZMAT_SVG = `
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10" stroke="#eab308" />
  <circle cx="12" cy="12" r="2.5" fill="#eab308" />
  <path d="M12 2a5 5 0 0 1 4.33 7.5L12 12" stroke="#eab308" />
  <path d="M12 2a5 5 0 0 0-4.33 7.5L12 12" stroke="#eab308" />
  <path d="M12 22a5 5 0 0 1-4.33-7.5L12 12" stroke="#eab308" />
</svg>
`;

const DRONE_SVG = `
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" fill="#8b5cf6" opacity="0.4" />
  <path d="m4 4 4 4" stroke="#a78bfa" />
  <path d="m20 4-4 4" stroke="#a78bfa" />
  <path d="m4 20 4-4" stroke="#a78bfa" />
  <path d="m20 20-4-4" stroke="#a78bfa" />
  <circle cx="4" cy="4" r="2" fill="#a78bfa" />
  <circle cx="20" cy="4" r="2" fill="#a78bfa" />
  <circle cx="4" cy="20" r="2" fill="#a78bfa" />
  <circle cx="20" cy="20" r="2" fill="#a78bfa" />
</svg>
`;

const MARINE_SVG = `
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 20a2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1" stroke="#06b6d4"/>
  <path d="M4 17 2 9l6 1 4-6 4 6 6-1-2 8H4z" fill="#0891b2" stroke="#06b6d4"/>
</svg>
`;

const RESCUE_SVG = `
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="7" width="20" height="14" rx="2" stroke="#f97316" />
  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke="#f97316" />
  <circle cx="12" cy="12" r="2" fill="#f97316" />
</svg>
`;

// Vehicle Marker Icon Generator with custom specialized Fire Truck Design
const createVehicleIcon = (vehicle: Vehicle, isAssigned: boolean = false) => {
  const isFire = vehicle.type === 'Fire';
  const isAmbulance = vehicle.type === 'Ambulance';
  const isPolice = vehicle.type === 'Police';
  const isHazmat = vehicle.type === 'Hazmat';
  const isDrone = vehicle.type === 'Drone';
  const isMarine = vehicle.type === 'Marine';
  const isRescue = vehicle.type === 'Rescue';

  let primaryColor = '#38bdf8';
  let glowColor = 'rgba(56, 189, 248, 0.75)';
  let haloColor = 'rgba(56, 189, 248, 0.35)';
  let svgIcon = POLICE_CRUISER_SVG;
  let customClass = 'police-vehicle-pin';

  if (isFire) {
    primaryColor = '#ef4444';
    glowColor = 'rgba(239, 68, 68, 0.85)';
    haloColor = 'rgba(239, 68, 68, 0.4)';
    svgIcon = FIRE_TRUCK_SVG;
    customClass = 'fire-truck-pin';
  } else if (isAmbulance) {
    primaryColor = '#10b981';
    glowColor = 'rgba(16, 185, 129, 0.75)';
    haloColor = 'rgba(16, 185, 129, 0.35)';
    svgIcon = AMBULANCE_SVG;
    customClass = 'ambulance-vehicle-pin';
  } else if (isHazmat) {
    primaryColor = '#eab308';
    glowColor = 'rgba(234, 179, 8, 0.75)';
    haloColor = 'rgba(234, 179, 8, 0.35)';
    svgIcon = HAZMAT_SVG;
    customClass = 'hazmat-vehicle-pin';
  } else if (isDrone) {
    primaryColor = '#8b5cf6';
    glowColor = 'rgba(139, 92, 246, 0.75)';
    haloColor = 'rgba(139, 92, 246, 0.35)';
    svgIcon = DRONE_SVG;
    customClass = 'drone-vehicle-pin';
  } else if (isMarine) {
    primaryColor = '#06b6d4';
    glowColor = 'rgba(6, 182, 212, 0.75)';
    haloColor = 'rgba(6, 182, 212, 0.35)';
    svgIcon = MARINE_SVG;
    customClass = 'marine-vehicle-pin';
  } else if (isRescue) {
    primaryColor = '#f97316';
    glowColor = 'rgba(249, 115, 22, 0.75)';
    haloColor = 'rgba(249, 115, 22, 0.35)';
    svgIcon = RESCUE_SVG;
    customClass = 'rescue-vehicle-pin';
  }

  const isEnRoute = isAssigned || vehicle.status === 'Dispatched' || vehicle.status === 'En Route';
  const isOnScene = vehicle.status === 'On Scene';
  const isLiveGps = !!vehicle.isLiveGps;

  // Custom Fire Truck HTML with solid styling & callsign badge
  if (isFire) {
    const html = `
      <div class="custom-tactical-pin fire-truck-pin ${isAssigned ? 'assigned-active' : ''} ${isEnRoute ? 'is-en-route' : ''} ${isOnScene ? 'is-on-scene' : ''} ${isLiveGps ? 'is-live-gps' : ''}" style="--primary-color: ${primaryColor}; --glow-color: ${glowColor}; --halo-color: ${haloColor};">
        <!-- Callsign Badge Tag Attached on Top -->
        <div class="vehicle-callsign-badge fire-callsign ${isOnScene ? 'bg-red-600 text-white font-black' : ''} ${isLiveGps ? 'border-cyan-400 bg-cyan-950/90 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : ''}">
          ${vehicle.id}${isOnScene ? ' • SCENE' : ''}${isLiveGps ? ' 🛰 LIVE' : ''}
        </div>
        
        <!-- Rooftop Emergency Lightbar -->
        <div class="fire-truck-roof-strobe">
          <span class="strobe-led red-led"></span>
          <span class="strobe-led amber-led"></span>
        </div>

        <!-- Fire Engine Chassis Pin Head -->
        <div class="pin-head-subtle fire-truck-head">
          <div class="pin-inner-icon">
            ${svgIcon}
          </div>
        </div>

        <!-- Base Coordinate Pointer -->
        <div class="pin-beacon-point"></div>
      </div>
    `;

    return L.divIcon({
      className: 'leaflet-tactical-marker',
      html: html,
      iconSize: [40, 48],
      iconAnchor: [20, 46],
      popupAnchor: [0, -46],
    });
  }

  // Other vehicle markers (Ambulance, Police)
  const size = 34;
  const html = `
    <div class="custom-tactical-pin vehicle-pin ${customClass} ${isAssigned ? 'assigned-active' : ''} ${isEnRoute ? 'is-en-route' : ''} ${isOnScene ? 'is-on-scene' : ''} ${isLiveGps ? 'is-live-gps' : ''}" style="--primary-color: ${primaryColor}; --glow-color: ${glowColor}; --halo-color: ${haloColor};">
      <div class="vehicle-callsign-badge ${isOnScene ? 'bg-emerald-600 text-white font-bold' : ''} ${isLiveGps ? 'border-cyan-400 bg-cyan-950/90 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.6)]' : ''}">
        ${vehicle.id}${isOnScene ? ' • SCENE' : ''}${isLiveGps ? ' 🛰 LIVE' : ''}
      </div>
      <div class="pin-head-subtle">
        <div class="pin-inner-icon">
          ${svgIcon}
        </div>
      </div>
      <div class="pin-beacon-point"></div>
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-tactical-marker',
    html: html,
    iconSize: [size, size + 12],
    iconAnchor: [size / 2, size + 10],
    popupAnchor: [0, -(size + 10)],
  });
};

// Emergency Sanctuary & Epidemic Overflow Facility Node Icon Generator
const createSanctuaryIcon = (sanctuary: EmergencySanctuary) => {
  const isEpidemic = sanctuary.type.includes('Epidemic') || sanctuary.type.includes('Quarantine');
  const primaryColor = isEpidemic ? '#a855f7' : '#06b6d4';
  const glowColor = isEpidemic ? 'rgba(168, 85, 247, 0.7)' : 'rgba(6, 182, 212, 0.7)';

  const occupancyRatio = sanctuary.capacity > 0 ? (sanctuary.occupied / sanctuary.capacity) : 0;
  const isHighOccupancy = occupancyRatio > 0.8;

  const svgIcon = isEpidemic ? `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f3e8ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" stroke="#c084fc"/>
      <path d="m4.93 4.93 4.24 4.24"/>
      <path d="m14.83 9.17 4.24-4.24"/>
      <path d="m14.83 14.83 4.24 4.24"/>
      <path d="m9.17 14.83-4.24 4.24"/>
      <circle cx="12" cy="12" r="3" fill="#a855f7"/>
    </svg>
  ` : `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e0f2fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 21h18"/>
      <path d="M4 21 12 4l8 17"/>
      <path d="M12 4v17"/>
      <path d="M8 21v-4a4 4 0 0 1 8 0v4"/>
    </svg>
  `;

  const html = `
    <div class="custom-tactical-pin sanctuary-tactical-pin" style="--primary-color: ${primaryColor}; --glow-color: ${glowColor};">
      <div class="vehicle-callsign-badge ${isHighOccupancy ? 'bg-amber-950/95 text-amber-300 border-amber-500' : 'bg-purple-950/95 text-purple-200 border-purple-500'} font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center gap-1 border">
        <span>🏕 ${sanctuary.id}</span>
        <span class="${isHighOccupancy ? 'text-amber-400' : 'text-cyan-300'} font-black">${sanctuary.occupied}/${sanctuary.capacity}</span>
      </div>
      
      <div class="pin-head-subtle" style="background: #090d16; border: 2px solid ${primaryColor}; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px ${glowColor};">
        <div class="pin-inner-icon flex items-center justify-center">
          ${svgIcon}
        </div>
      </div>

      <div class="pin-beacon-point" style="border-top-color: ${primaryColor};"></div>
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-tactical-marker',
    html: html,
    iconSize: [42, 50],
    iconAnchor: [21, 48],
    popupAnchor: [0, -48],
  });
};

// Interactive Leaflet Map Zoom & Location Controller Component
const MapControls: React.FC<{
  mapCenter: [number, number];
  primaryIncident?: Incident;
  panTarget?: [number, number] | null;
}> = ({ mapCenter, primaryIncident, panTarget }) => {
  const map = useMap();

  React.useEffect(() => {
    if (panTarget && typeof panTarget[0] === 'number' && typeof panTarget[1] === 'number' && !isNaN(panTarget[0]) && !isNaN(panTarget[1])) {
      map.setView(panTarget, 15, { animate: true, duration: 0.5 });
    }
  }, [panTarget, map]);

  const handleSmoothZoom = (delta: number) => {
    const currentZoom = map.getZoom();
    const nextZoom = Math.max(3, Math.min(19, currentZoom + delta));
    map.setZoom(nextZoom, {
      animate: true,
      duration: 0.45,
      easeLinearity: 0.15
    });
  };

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`absolute right-4 bottom-6 z-[500] flex flex-col gap-1.5 backdrop-blur-md p-1.5 rounded-xl border shadow-2xl pointer-events-auto transition-colors ${
      isDark ? 'bg-[#0b101d]/95 border-[#1d2a42]' : 'bg-white/95 border-slate-200 shadow-lg'
    }`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleSmoothZoom(0.75);
        }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
          isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title="Zoom In"
        aria-label="Zoom In"
      >
        <Plus size={16} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleSmoothZoom(-0.75);
        }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
          isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <Minus size={16} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (primaryIncident) {
            map.flyTo([primaryIncident.lat, primaryIncident.lng], 14, { animate: true, duration: 0.6 });
          } else {
            map.flyTo(mapCenter, 12, { animate: true, duration: 0.6 });
          }
        }}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
          isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title={primaryIncident ? `Center on Incident ${primaryIncident.id}` : 'Reset to City Center'}
        aria-label="Center Map"
      >
        <Locate size={15} />
      </button>
    </div>
  );
};

// Marker Icon Factory for Incidents (Refined Tactical Pin Marker with Subtle Outward Wave)
const createTacticalIcon = (type: string, priority?: string, incidentId?: string) => {
  let primaryColor = '#38bdf8';
  let glowColor = 'rgba(56, 189, 248, 0.45)';
  let haloColor = 'rgba(56, 189, 248, 0.25)';
  let tagBg = '#071529';
  let tagBorder = '#38bdf8';
  let tagText = '#bae6fd';
  let svgIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  if (type === 'Fire') {
    primaryColor = '#ef4444';
    glowColor = 'rgba(239, 68, 68, 0.5)';
    haloColor = 'rgba(239, 68, 68, 0.25)';
    tagBg = '#250606';
    tagBorder = '#ef4444';
    tagText = '#fee2e2';
    svgIcon = `<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
  } else if (type === 'Accident') {
    primaryColor = '#f59e0b';
    glowColor = 'rgba(245, 158, 11, 0.5)';
    haloColor = 'rgba(245, 158, 11, 0.25)';
    tagBg = '#241404';
    tagBorder = '#f59e0b';
    tagText = '#fef3c7';
    svgIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
  } else if (type === 'Medical' || type === 'Ambulance') {
    primaryColor = '#10b981';
    glowColor = 'rgba(16, 185, 129, 0.5)';
    haloColor = 'rgba(16, 185, 129, 0.25)';
    tagBg = '#042216';
    tagBorder = '#10b981';
    tagText = '#d1fae5';
    svgIcon = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`;
  } else if (type === 'Police') {
    primaryColor = '#3b82f6';
    glowColor = 'rgba(59, 130, 246, 0.5)';
    haloColor = 'rgba(59, 130, 246, 0.25)';
    tagBg = '#0b1930';
    tagBorder = '#3b82f6';
    tagText = '#dbeafe';
    svgIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  } else if (type === 'Hazmat') {
    primaryColor = '#c084fc';
    glowColor = 'rgba(192, 132, 252, 0.65)';
    haloColor = 'rgba(192, 132, 252, 0.35)';
    tagBg = '#270c36';
    tagBorder = '#c084fc';
    tagText = '#f3e8ff';
    svgIcon = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.5"/><path d="M6.5 6.5a8 8 0 0 1 11 0"/><path d="M5 14.5a8 8 0 0 0 7 5.5 8 8 0 0 0 7-5.5"/><line x1="12" y1="2" x2="12" y2="4.5"/></svg>`;
  } else if (type === 'Radiation') {
    primaryColor = '#facc15';
    glowColor = 'rgba(250, 204, 21, 0.75)';
    haloColor = 'rgba(250, 204, 21, 0.4)';
    tagBg = '#261b02';
    tagBorder = '#facc15';
    tagText = '#fef08a';
    svgIcon = `<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="2.5"/><path d="M12 2a10 10 0 0 0-4.33.99l2.87 4.97a4.5 4.5 0 0 1 2.92 0l2.87-4.97A10 10 0 0 0 12 2z"/><path d="M3.34 7a10 10 0 0 0 0 10l4.97-2.87a4.5 4.5 0 0 1 0-4.26L3.34 7z"/><path d="M15.69 14.13a4.5 4.5 0 0 1-2.92 1.68l2.87 4.98A10 10 0 0 0 20.66 17l-4.97-2.87z"/></svg>`;
  } else if (type === 'Disaster') {
    primaryColor = '#fb923c';
    glowColor = 'rgba(251, 146, 60, 0.65)';
    haloColor = 'rgba(251, 146, 60, 0.35)';
    tagBg = '#2c0f02';
    tagBorder = '#fb923c';
    tagText = '#ffedd5';
    svgIcon = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M20 12v8H4v-8"/><path d="m4 12 8-8 8 8"/><circle cx="12" cy="13" r="2"/></svg>`;
  }

  const isHighPriority = priority === 'High';
  const pulseSpeed = isHighPriority ? '3.2s' : '4.2s';
  const size = 38;

  const html = `
    <div class="custom-tactical-pin incident-pin ${isHighPriority ? 'high-priority-incident' : ''}" style="--primary-color: ${primaryColor}; --glow-color: ${glowColor}; --halo-color: ${haloColor}; --pulse-speed: ${pulseSpeed};">
      ${incidentId ? `<div class="incident-callsign-tag" style="background: ${tagBg}; border-color: ${tagBorder}; color: ${tagText};">${incidentId}</div>` : ''}
      <div class="bold-beacon-ring"></div>
      ${isHighPriority ? '<div class="bold-beacon-ring beacon-outer"></div>' : ''}
      <div class="pin-head-bold incident-head">
        <div class="pin-inner-icon">
          ${svgIcon}
        </div>
      </div>
      <div class="pin-beacon-point"></div>
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-tactical-marker',
    html: html,
    iconSize: [size, size + 14],
    iconAnchor: [size / 2, size + 10],
    popupAnchor: [0, -(size + 10)],
  });
};

// Facility Fixed Base Node Icons for Hospitals, Police Stations, and Fire Stations
const createHospitalIcon = (hospital: Hospital) => {
  const isGov = hospital.type === 'Government';
  const primaryColor = isGov ? '#10b981' : '#06b6d4';
  const glowColor = isGov ? 'rgba(16, 185, 129, 0.6)' : 'rgba(6, 182, 212, 0.6)';

  const svgIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 21H21" stroke="#cbd5e1" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M5 21V5C5 3.9 5.9 3 7 3H17C18.1 3 19 3.9 19 5V21" fill="#042f2e" stroke="#10b981" stroke-width="1.4"/>
      <!-- Emergency Cross on Building -->
      <rect x="10" y="7" width="4" height="10" rx="1" fill="#10b981"/>
      <rect x="7" y="10" width="10" height="4" rx="1" fill="#10b981"/>
    </svg>
  `;

  const html = `
    <div class="station-facility-node hospital-facility-node" style="--primary-color: ${primaryColor}; --glow-color: ${glowColor};">
      <!-- Fixed Facility Header Badge -->
      <div class="facility-station-pill hospital-pill">HOSPITAL</div>
      
      <!-- Facility Architectural Building Base -->
      <div class="facility-building-base">
        ${svgIcon}
      </div>

      <!-- Facility Foundation Anchor -->
      <div class="facility-anchor-base"></div>
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-tactical-marker',
    html: html,
    iconSize: [36, 42],
    iconAnchor: [18, 40],
    popupAnchor: [0, -40],
  });
};

// Police Station Marker Generator (Fortified Command Shield)
const createPoliceStationIcon = (station: PoliceStation) => {
  const primaryColor = '#3b82f6';
  const glowColor = 'rgba(59, 130, 246, 0.6)';

  const svgIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Police Precinct Headquarters Fortified Badge -->
      <path d="M12 2L20 5V11C20 16.5 16.6 20.8 12 22C7.4 20.8 4 16.5 4 11V5L12 2Z" fill="#0f1f38" stroke="#3b82f6" stroke-width="1.5"/>
      <!-- Star Badge in Center -->
      <polygon points="12,6.5 13.5,9.8 17.2,10.2 14.5,12.7 15.2,16.4 12,14.6 8.8,16.4 9.5,12.7 6.8,10.2 10.5,9.8" fill="#60a5fa"/>
    </svg>
  `;

  const html = `
    <div class="station-facility-node police-facility-node" style="--primary-color: ${primaryColor}; --glow-color: ${glowColor};">
      <div class="facility-station-pill police-pill">POLICE HQ</div>
      <div class="facility-building-base">
        ${svgIcon}
      </div>
      <div class="facility-anchor-base"></div>
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-tactical-marker',
    html: html,
    iconSize: [36, 42],
    iconAnchor: [18, 40],
    popupAnchor: [0, -40],
  });
};

// Fire Station Marker Generator (Fire Base Command Garage)
const createFireStationIcon = (station: FireStation) => {
  const primaryColor = '#f97316';
  const glowColor = 'rgba(249, 115, 22, 0.6)';

  const svgIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Fire Station Fortress Base -->
      <path d="M4 21V7L12 3L20 7V21" fill="#2d1306" stroke="#f97316" stroke-width="1.5"/>
      <!-- Station Garage Roller Bay Doors -->
      <rect x="7" y="11" width="10" height="10" rx="1" fill="#1e293b" stroke="#f97316" stroke-width="0.8"/>
      <line x1="7" y1="14" x2="17" y2="14" stroke="#64748b" stroke-width="0.7"/>
      <line x1="7" y1="17" x2="17" y2="17" stroke="#64748b" stroke-width="0.7"/>
      <!-- Station Alarm Bell -->
      <circle cx="12" cy="7.5" r="1.8" fill="#facc15"/>
    </svg>
  `;

  const html = `
    <div class="station-facility-node fire-facility-node" style="--primary-color: ${primaryColor}; --glow-color: ${glowColor};">
      <div class="facility-station-pill fire-pill">FIRE BASE</div>
      <div class="facility-building-base">
        ${svgIcon}
      </div>
      <div class="facility-anchor-base"></div>
    </div>
  `;

  return L.divIcon({
    className: 'leaflet-tactical-marker',
    html: html,
    iconSize: [36, 42],
    iconAnchor: [18, 40],
    popupAnchor: [0, -40],
  });
};

export const LiveIncidentMap: React.FC<LiveIncidentMapProps> = ({
  fullScreen = false,
  incidents,
  vehicles = [],
  hospitals = CHENNAI_HOSPITALS,
  policeStations = CHENNAI_POLICE_STATIONS,
  fireStations = CHENNAI_FIRE_STATIONS,
  selectedIncidentId,
  onSelectIncidentId,
  onViewIncident,
  onDispatchVehicle,
  onRecallVehicle,
  onOpenCommsWithVehicle,
  onOpenRadioCall,
  onExpandView,
  isSimulationActive = true,
  onToggleSimulation,
  onSimulateIncident,
  isAutoEventsActive = true,
  onToggleAutoEvents,
  isDisasterModeActive = false,
  onToggleDisasterMode,
  onTriggerDisasterScenario,
  latestResolvedIncident,
  onClearResolvedNotice,
  sanctuaries = [],
  onAddSanctuary,
  onUpdateSanctuary,
  onRemoveSanctuary,
  isHospitalSurgeActive = false,
  onToggleHospitalSurge
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTraffic, setShowTraffic] = useState(false);
  const [showUnits, setShowUnits] = useState(false);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showCCTV, setShowCCTV] = useState(false);
  const [showNearbyDrawer, setShowNearbyDrawer] = useState(false);
  const [showCallout, setShowCallout] = useState(fullScreen);
  const [showDisasterDropdown, setShowDisasterDropdown] = useState(false);
  const [panTarget, setPanTarget] = useState<[number, number] | null>(null);

  // Sanctuary & Epidemic Overflow State
  const [isPlacementModeActive, setIsPlacementModeActive] = useState<boolean>(false);
  const [showSanctuaryModal, setShowSanctuaryModal] = useState<boolean>(false);
  const [selectedSanctuary, setSelectedSanctuary] = useState<EmergencySanctuary | null>(null);

  // Form State for creating a customizable sanctuary location
  const [newSanctuaryForm, setNewSanctuaryForm] = useState<{
    name: string;
    type: EmergencySanctuary['type'];
    lat: number;
    lng: number;
    capacity: number;
    occupied: number;
    oxygenUnits: number;
    isolationBeds: number;
    tents: number;
    ppeKits: number;
    potableWaterLitres: number;
    notes: string;
    coverageRadiusMeters: number;
  }>({
    name: 'Jawaharlal Nehru Stadium Epidemic Surge Hub',
    type: 'Epidemic Surge Hospital',
    lat: 13.0835,
    lng: 80.2740,
    capacity: 2500,
    occupied: 0,
    oxygenUnits: 150,
    isolationBeds: 400,
    tents: 350,
    ppeKits: 5000,
    potableWaterLitres: 35000,
    notes: 'Citywide epidemic surge relief station with triaged ICU tents and negative-pressure quarantine cubicles.',
    coverageRadiusMeters: 600
  });

  // Calculate Citywide Hospital Saturation
  const totalHospitalCapacity = hospitals.reduce((acc, h) => acc + (h.capacity || 0), 0);
  const availableHospitalBeds = isHospitalSurgeActive ? 0 : hospitals.reduce((acc, h) => acc + (h.availableBeds ?? Math.round((h.capacity || 1000) * 0.15)), 0);
  const hospitalSaturationPercent = totalHospitalCapacity > 0 
    ? (isHospitalSurgeActive ? 100 : Math.round(((totalHospitalCapacity - availableHospitalBeds) / totalHospitalCapacity) * 100))
    : 85;
  const isHospitalsFullyUsedUp = isHospitalSurgeActive || availableHospitalBeds <= 0 || hospitalSaturationPercent >= 98;

  const handleMapClickForSanctuary = (lat: number, lng: number) => {
    setNewSanctuaryForm(prev => ({
      ...prev,
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5))
    }));
    setIsPlacementModeActive(false);
    setShowSanctuaryModal(true);
    playRadioChirp('roger');
  };

  const handleCreateSanctuarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddSanctuary) return;

    const created: EmergencySanctuary = {
      id: `SANC-0${(sanctuaries.length + 1).toString().padStart(2, '0')}`,
      name: newSanctuaryForm.name.trim() || 'Custom Emergency Relief Sanctuary',
      type: newSanctuaryForm.type,
      lat: newSanctuaryForm.lat,
      lng: newSanctuaryForm.lng,
      capacity: Number(newSanctuaryForm.capacity) || 1000,
      occupied: Number(newSanctuaryForm.occupied) || 0,
      supplies: {
        oxygenUnits: Number(newSanctuaryForm.oxygenUnits) || 50,
        isolationBeds: Number(newSanctuaryForm.isolationBeds) || 100,
        tents: Number(newSanctuaryForm.tents) || 150,
        ppeKits: Number(newSanctuaryForm.ppeKits) || 1000,
        potableWaterLitres: Number(newSanctuaryForm.potableWaterLitres) || 10000
      },
      status: 'Active',
      notes: newSanctuaryForm.notes,
      establishedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      establishedBy: 'EOC Incident Commander',
      coverageRadiusMeters: Number(newSanctuaryForm.coverageRadiusMeters) || 500
    };

    onAddSanctuary(created);
    setShowSanctuaryModal(false);
    playRadioChirp('alert');
  };

  // Manual toggle overrides for facility layers (all off by default)
  const [overrideHospitals, setOverrideHospitals] = useState<boolean>(false);
  const [overrideFireStations, setOverrideFireStations] = useState<boolean>(false);
  const [overridePoliceStations, setOverridePoliceStations] = useState<boolean>(false);
  const [overrideDisasterLayer, setOverrideDisasterLayer] = useState<boolean>(false);

  // Basemap Tile Layer Style (100% Free & No API Key Required)
  const [mapStyle, setMapStyle] = useState<'osm_dark' | 'esri_dark' | 'satellite' | 'osm_street'>('osm_dark');
  const [showStyleDropdown, setShowStyleDropdown] = useState<boolean>(false);

  // Epicenter coordinates (Chennai)
  const mapCenter: [number, number] = [13.065, 80.235];

  const primaryIncident = incidents.find(i => i.id === selectedIncidentId) || incidents.find(i => i.id === 'INC-2025-015') || incidents[0];

  // Dispatched or En Route vehicle groups
  const dispatchedVehicles = vehicles.filter(
    v => v.status === 'Dispatched' || v.status === 'En Route' || v.status === 'On Scene' || !!v.assignedIncidentId
  );

  const activeAmbulances = vehicles.filter(
    v => v.type === 'Ambulance' && (v.status === 'Dispatched' || v.status === 'En Route' || v.status === 'On Scene' || !!v.assignedIncidentId)
  );
  const hasActiveAmbulance = activeAmbulances.length > 0;

  const activeFireUnits = vehicles.filter(
    v => v.type === 'Fire' && (v.status === 'Dispatched' || v.status === 'En Route' || v.status === 'On Scene' || !!v.assignedIncidentId)
  );
  const hasActiveFireUnit = activeFireUnits.length > 0;

  const activePoliceUnits = vehicles.filter(
    v => v.type === 'Police' && (v.status === 'Dispatched' || v.status === 'En Route' || v.status === 'On Scene' || !!v.assignedIncidentId)
  );
  const hasActivePoliceUnit = activePoliceUnits.length > 0;

  // Layer Visibility (Off by default unless toggled or filter tab selected)
  const isHospitalsVisible = overrideHospitals || activeFilter === 'Hospitals';
  const isFireStationsVisible = overrideFireStations || activeFilter === 'Fire Stations';
  const isPoliceStationsVisible = overridePoliceStations || activeFilter === 'Police Stations';

  const [showResolvedArchive, setShowResolvedArchive] = useState(false);

  // Filtered Incidents (Auto-clears resolved incidents from map radar!)
  const filteredIncidents = showIncidents ? incidents.filter((inc) => {
    if (activeFilter === 'Hospitals' || activeFilter === 'Fire Stations' || activeFilter === 'Police Stations') return false;
    // Hide resolved / closed incidents from active tactical map unless archive toggle is enabled
    if (!showResolvedArchive && (inc.status === 'Resolved' || inc.status === 'Closed')) {
      return false;
    }
    if (activeFilter === 'Dispatched Units') {
      const isAssignedToAny = vehicles.some(v => v.assignedIncidentId === inc.id && (v.status === 'Dispatched' || v.status === 'En Route' || v.status === 'On Scene'));
      return isAssignedToAny || inc.id === primaryIncident?.id;
    }
    let matchesFilter = activeFilter === 'All' || inc.type === activeFilter;
    if (activeFilter === 'Disasters & Hazmat') {
      matchesFilter = inc.type === 'Hazmat' || inc.type === 'Radiation' || inc.type === 'Disaster';
    }
    const matchesSearch = !searchQuery || inc.location.toLowerCase().includes(searchQuery.toLowerCase()) || inc.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch && typeof inc?.lat === 'number' && typeof inc?.lng === 'number' && !isNaN(inc.lat) && !isNaN(inc.lng);
  }) : [];

  // Filtered Response Vehicles
  const isUnitsVisible = showUnits || activeFilter === 'Dispatched Units';
  const displayedVehicles = isUnitsVisible ? vehicles.filter(v => {
    if (activeFilter === 'Dispatched Units') {
      const isDispatched = v.status === 'Dispatched' || v.status === 'En Route' || v.status === 'On Scene' || !!v.assignedIncidentId;
      if (!isDispatched) return false;
      if (!searchQuery) return true;
      return (
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.station.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.assignedIncidentId && v.assignedIncidentId.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (!searchQuery) return true;
    return (
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.station.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) : [];

  // Filtered Hospitals
  const displayedHospitals = isHospitalsVisible ? hospitals.filter((h) => {
    if (activeFilter !== 'All' && activeFilter !== 'Hospitals' && activeFilter !== 'Medical') return false;
    if (!searchQuery) return true;
    return (
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.area && h.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
      h.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) : [];

  // Filtered Police Stations
  const displayedPoliceStations = isPoliceStationsVisible ? policeStations.filter((p) => {
    if (activeFilter !== 'All' && activeFilter !== 'Police Stations' && activeFilter !== 'Police') return false;
    if (!searchQuery) return true;
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.division.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) : [];

  // Filtered Fire Stations
  const displayedFireStations = isFireStationsVisible ? fireStations.filter((f) => {
    if (activeFilter !== 'All' && activeFilter !== 'Fire Stations' && activeFilter !== 'Fire') return false;
    if (!searchQuery) return true;
    return (
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.zone.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) : [];

  // Active Vehicle Response Routes along roads
  const activeRoutes = vehicles
    .filter(v => v.assignedIncidentId && (v.status === 'Dispatched' || v.status === 'En Route'))
    .map(v => {
      const targetInc = incidents.find(i => i.id === v.assignedIncidentId);
      if (!targetInc) return null;

      let positions: [number, number][];
      if (v.routePath && v.routePath.length > 0) {
        const remainingWaypoints = v.routePath.slice(v.routeIndex || 0);
        positions = [[v.lat, v.lng], ...remainingWaypoints];
      } else {
        const midLat = (v.lat + targetInc.lat) / 2 + (v.lat > targetInc.lat ? 0.004 : -0.004);
        const midLng = (v.lng + targetInc.lng) / 2 + (v.lng > targetInc.lng ? -0.003 : 0.003);
        positions = [
          [v.lat, v.lng] as [number, number],
          [midLat, midLng] as [number, number],
          [targetInc.lat, targetInc.lng] as [number, number]
        ];
      }

      return {
        vehicleId: v.id,
        vehicleType: v.type,
        positions,
        color: v.type === 'Fire' ? '#ff4d4f' : v.type === 'Ambulance' ? '#10b981' : '#38bdf8'
      };
    })
    .filter(Boolean);

  // Hospital Emergency Corridors (Incident -> Closest Trauma Center)
  const hospitalCorridors = activeAmbulances
    .map(amb => {
      const targetInc = incidents.find(i => i.id === amb.assignedIncidentId);
      if (!targetInc) return null;
      let closestHosp: Hospital | null = null;
      let minDis = Infinity;
      hospitals.forEach(h => {
        const d = calculateDistanceKm(targetInc.lat, targetInc.lng, h.lat, h.lng);
        if (d < minDis) {
          minDis = d;
          closestHosp = h;
        }
      });
      if (!closestHosp) return null;
      const midLat = (targetInc.lat + (closestHosp as Hospital).lat) / 2 + 0.002;
      const midLng = (targetInc.lng + (closestHosp as Hospital).lng) / 2 - 0.002;
      return {
        ambId: amb.id,
        ambName: amb.name,
        incident: targetInc,
        hospital: closestHosp as Hospital,
        distanceKm: minDis,
        positions: [
          [targetInc.lat, targetInc.lng] as [number, number],
          [midLat, midLng] as [number, number],
          [(closestHosp as Hospital).lat, (closestHosp as Hospital).lng] as [number, number]
        ]
      };
    })
    .filter(Boolean);

  return (
    <div className={`rounded-2xl flex flex-col overflow-hidden relative ${fullScreen ? 'h-full' : 'h-[560px]'} ${
      isDark
        ? 'bg-[#0b101d] border border-[#223554] shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
        : 'bg-white border border-slate-200 shadow-sm'
    }`}>
      {/* Top Header & Tactical Radar Filter Bar (Naturally flows above map canvas) */}
      <div className={`p-2.5 sm:p-3 border-b flex flex-wrap gap-2.5 justify-between items-center shrink-0 z-20 ${
        isDark ? 'border-[#223554] bg-[#0a0f1d] shadow-md' : 'border-slate-200 bg-white shadow-xs'
      }`}>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className={`font-bold text-sm flex items-center gap-2 ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>
            Live Tactical Command Map
          </h2>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/50 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            RADAR ACTIVE
          </span>

          {/* Real-time Movement Simulation HUD */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs border ${
            isDark ? 'bg-[#0e1626] border-[#1b2b46]' : 'bg-slate-50 border-slate-200'
          }`}>
            <button
              onClick={onToggleSimulation}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                isSimulationActive
                  ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
              title={isSimulationActive ? 'Pause real-time unit movement' : 'Resume real-time unit movement'}
            >
              {isSimulationActive ? <Pause size={10} /> : <Play size={10} />}
              <span>{isSimulationActive ? 'LIVE SIM' : 'PAUSED'}</span>
            </button>

            {/* Auto Incident Generation Toggle */}
            {onToggleAutoEvents && (
              <button
                onClick={onToggleAutoEvents}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                  isAutoEventsActive
                    ? isDark ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]' : 'bg-cyan-100 text-cyan-800 border-cyan-300'
                    : isDark ? 'bg-[#121927] text-slate-400 border-slate-700 hover:text-slate-200' : 'bg-white text-slate-600 border-slate-300 hover:text-slate-900'
                }`}
                title="Automatically trigger realistic random emergencies when operations are low to keep command center eventful"
              >
                <RefreshCw size={10} className={isAutoEventsActive ? (isDark ? 'animate-spin-slow text-cyan-400' : 'animate-spin-slow text-cyan-600') : 'text-slate-400'} />
                <span>Auto-Spawn: {isAutoEventsActive ? 'ON' : 'OFF'}</span>
              </button>
            )}

            {/* Instant Incident Simulation Trigger */}
            {onSimulateIncident && (
              <button
                onClick={() => {
                  playRadioChirp('transmit');
                  onSimulateIncident();
                }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all shadow-xs border ${
                  isDark
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                }`}
                title="Spawn an emergency and dispatch nearest responder immediately"
              >
                <Sparkles size={11} className={isDark ? 'text-amber-400' : 'text-amber-600'} />
                <span>Random Incident</span>
              </button>
            )}
          </div>

          {/* Dedicated Disaster & Special Cases Mode Toggle */}
          {onToggleDisasterMode && (
            <div className="relative">
              <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${
                isDark ? 'bg-[#1a1306] border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]' : 'bg-amber-50/80 border-amber-300'
              }`}>
                <button
                  onClick={onToggleDisasterMode}
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                    isDisasterModeActive
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-black shadow-[0_0_10px_#eab308]'
                      : isDark ? 'bg-amber-950/60 text-amber-300 hover:bg-amber-900/60' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                  title="Toggle CBRN / Gas / Radiation / Disaster Operations Mode"
                >
                  <Radiation size={12} className={isDisasterModeActive ? 'animate-spin-slow' : (isDark ? 'text-amber-400' : 'text-amber-600')} />
                  <span>☢️ CBRN / DISASTER MODE: {isDisasterModeActive ? 'ON' : 'OFF'}</span>
                </button>

                {onTriggerDisasterScenario && (
                  <button
                    onClick={() => setShowDisasterDropdown(!showDisasterDropdown)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 ${
                      isDark ? 'text-amber-300 hover:text-white bg-amber-900/40 hover:bg-amber-800/60' : 'text-amber-800 hover:text-amber-950 bg-amber-200/70 hover:bg-amber-200'
                    }`}
                    title="Deploy specialized CBRN / Gas / Radiation / Flood scenarios"
                  >
                    <span>Scenarios</span>
                    <ChevronDown size={11} />
                  </button>
                )}
              </div>

              {/* Disaster Scenarios Dropdown Menu */}
              {showDisasterDropdown && onTriggerDisasterScenario && (
                <div className={`absolute left-0 top-full mt-1.5 w-72 rounded-xl shadow-2xl z-[999] p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150 border ${
                  isDark ? 'bg-[#0d121f] border-amber-500/50 text-slate-200' : 'bg-white border-amber-300 text-slate-800'
                }`}>
                  <div className={`px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border-b flex items-center justify-between ${
                    isDark ? 'text-amber-400 border-amber-500/20' : 'text-amber-700 border-amber-200'
                  }`}>
                    <span>Deploy Disaster Scenario</span>
                    <button onClick={() => setShowDisasterDropdown(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                  </div>

                  <button
                    onClick={() => {
                      onTriggerDisasterScenario('gas_leak');
                      setShowDisasterDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg border border-transparent transition-colors flex items-start gap-2 text-xs group ${
                      isDark ? 'hover:bg-purple-950/40 hover:border-purple-500/40' : 'hover:bg-purple-50 hover:border-purple-200'
                    }`}
                  >
                    <Biohazard size={15} className="text-purple-500 shrink-0 mt-0.5 group-hover:animate-pulse" />
                    <div>
                      <div className={`font-bold ${isDark ? 'text-purple-200' : 'text-purple-900'}`}>☣️ Toxic Ammonia Gas Leak</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Manali Petrochemical Corridor • 68.5 PPM Plume</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onTriggerDisasterScenario('radiation_spike');
                      setShowDisasterDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg border border-transparent transition-colors flex items-start gap-2 text-xs group ${
                      isDark ? 'hover:bg-yellow-950/40 hover:border-yellow-500/40' : 'hover:bg-yellow-50 hover:border-yellow-200'
                    }`}
                  >
                    <Radiation size={15} className="text-yellow-500 shrink-0 mt-0.5 group-hover:animate-spin-slow" />
                    <div>
                      <div className={`font-bold ${isDark ? 'text-yellow-200' : 'text-yellow-900'}`}>☢️ Port Radiation Spike Breach</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Chennai Harbor Gate 4 • 42.8 mSv/h Gamma Cordon</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onTriggerDisasterScenario('flash_flood');
                      setShowDisasterDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg border border-transparent transition-colors flex items-start gap-2 text-xs group ${
                      isDark ? 'hover:bg-blue-950/40 hover:border-blue-500/40' : 'hover:bg-blue-50 hover:border-blue-200'
                    }`}
                  >
                    <Waves size={15} className="text-cyan-500 shrink-0 mt-0.5 group-hover:animate-bounce" />
                    <div>
                      <div className={`font-bold ${isDark ? 'text-cyan-200' : 'text-cyan-900'}`}>🌊 Adyar Flash Flood Surge</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Kotturpuram Basin • 3.2m Water Inundation</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onTriggerDisasterScenario('chemical_tanker');
                      setShowDisasterDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg border border-transparent transition-colors flex items-start gap-2 text-xs group ${
                      isDark ? 'hover:bg-emerald-950/40 hover:border-emerald-500/40' : 'hover:bg-emerald-50 hover:border-emerald-200'
                    }`}
                  >
                    <AlertOctagon size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className={`font-bold ${isDark ? 'text-emerald-200' : 'text-emerald-900'}`}>🧪 Hydrochloric Acid Tanker Rupture</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Madhavaram Highway Depot • Acid Fume Cloud</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onTriggerDisasterScenario('boiler_explosion');
                      setShowDisasterDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg border border-transparent transition-colors flex items-start gap-2 text-xs group ${
                      isDark ? 'hover:bg-orange-950/40 hover:border-orange-500/40' : 'hover:bg-orange-50 hover:border-orange-200'
                    }`}
                  >
                    <Flame size={15} className="text-orange-500 shrink-0 mt-0.5 group-hover:animate-pulse" />
                    <div>
                      <div className={`font-bold ${isDark ? 'text-orange-200' : 'text-orange-900'}`}>💥 Boiler Detonation & Collapse</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ambattur Industrial Estate Phase II</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex p-1 rounded-xl border gap-1 overflow-x-auto max-w-full ${
            isDark ? 'bg-[#0e1626] border-[#1b2b46]' : 'bg-slate-100 border-slate-200'
          }`}>
            {(['All', 'Dispatched Units', 'Fire', 'Medical', 'Police', 'Disasters & Hazmat', 'Hospitals', 'Fire Stations', 'Police Stations'] as const).map((f) => {
              const isDispatched = f === 'Dispatched Units';
              return (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                    activeFilter === f
                      ? f === 'Disasters & Hazmat'
                        ? isDark ? 'bg-amber-600 text-white shadow-sm font-bold' : 'bg-white text-amber-900 border border-amber-400 shadow-xs font-bold'
                        : isDispatched
                        ? isDark
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] font-bold'
                          : 'bg-white text-blue-900 border border-blue-400 shadow-xs font-bold'
                        : isDark
                        ? 'bg-blue-600 text-white shadow-sm font-bold'
                        : 'bg-white text-slate-900 border border-slate-400 shadow-xs font-bold'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200 font-semibold'
                  }`}
                >
                  {isDispatched ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Dispatched Units ({dispatchedVehicles.length})</span>
                    </>
                  ) : f === 'Disasters & Hazmat' ? (
                    '☢️ Disasters & CBRN'
                  ) : f === 'All' ? (
                    <span>All Units</span>
                  ) : (
                    f
                  )}
                </button>
              );
            })}
          </div>

          {/* Toggle Resolved Incident Archive */}
          <button
            onClick={() => setShowResolvedArchive(!showResolvedArchive)}
            className={`px-2 py-1 text-xs font-semibold rounded-xl border transition-all ${
              showResolvedArchive
                ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                : isDark ? 'bg-[#0e1626] text-slate-400 border-[#1b2b46] hover:text-slate-200' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Toggle cleared/resolved incident markers on map"
          >
            {showResolvedArchive ? 'Showing Resolved' : 'Active Only'}
          </button>

          <div className="relative">
            <Search size={13} className={`absolute left-2.5 top-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search station, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-7 pr-3 py-1 rounded-xl text-xs focus:outline-none focus:border-blue-500 w-32 sm:w-40 border ${
                isDark
                  ? 'bg-[#0e1626] border-[#1b2b46] text-slate-200 placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Basemap Style Switcher (100% Free - No API Keys Required) */}
          <div className="relative">
            <button
              onClick={() => setShowStyleDropdown(!showStyleDropdown)}
              className={`px-2 py-1 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-all ${
                isDark
                  ? 'bg-[#0e1626] border-[#1b2b46] text-slate-300 hover:text-white hover:border-slate-500'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400'
              }`}
              title="Select Tactical Basemap Layer (No API Key Required)"
            >
              <Layers size={13} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
              <span className="hidden sm:inline text-[11px]">
                {mapStyle === 'osm_dark' ? 'Tactical Dark' : mapStyle === 'esri_dark' ? 'ESRI Canvas' : mapStyle === 'satellite' ? 'Satellite' : 'Street'}
              </span>
              <ChevronDown size={11} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
            </button>

            {showStyleDropdown && (
              <div className={`absolute right-0 top-full mt-1.5 w-48 rounded-xl shadow-2xl z-[999] p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 border ${
                isDark ? 'bg-[#0d121f] border-[#243450]' : 'bg-white border-slate-200 shadow-lg'
              }`}>
                <div className={`px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border-b ${
                  isDark ? 'text-slate-400 border-[#1b2b46]' : 'text-slate-600 border-slate-200'
                }`}>
                  Tactical Basemap (Free)
                </div>
                <button
                  onClick={() => {
                    setMapStyle('osm_dark');
                    setShowStyleDropdown(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    mapStyle === 'osm_dark'
                      ? 'bg-blue-600 text-white font-bold'
                      : isDark ? 'text-slate-300 hover:bg-[#162238]' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">🌙 Tactical Dark (OSM)</span>
                  {mapStyle === 'osm_dark' && <Check size={12} />}
                </button>
                <button
                  onClick={() => {
                    setMapStyle('esri_dark');
                    setShowStyleDropdown(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    mapStyle === 'esri_dark'
                      ? 'bg-blue-600 text-white font-bold'
                      : isDark ? 'text-slate-300 hover:bg-[#162238]' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">🏢 ESRI Dark Canvas</span>
                  {mapStyle === 'esri_dark' && <Check size={12} />}
                </button>
                <button
                  onClick={() => {
                    setMapStyle('satellite');
                    setShowStyleDropdown(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    mapStyle === 'satellite'
                      ? 'bg-blue-600 text-white font-bold'
                      : isDark ? 'text-slate-300 hover:bg-[#162238]' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">🛰️ Satellite Imagery</span>
                  {mapStyle === 'satellite' && <Check size={12} />}
                </button>
                <button
                  onClick={() => {
                    setMapStyle('osm_street');
                    setShowStyleDropdown(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    mapStyle === 'osm_street'
                      ? 'bg-blue-600 text-white font-bold'
                      : isDark ? 'text-slate-300 hover:bg-[#162238]' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5">🗺️ OpenStreetMap</span>
                  {mapStyle === 'osm_street' && <Check size={12} />}
                </button>
              </div>
            )}
          </div>

          {onExpandView && !fullScreen && (
            <button
              onClick={onExpandView}
              className={`p-1 px-2 text-xs font-bold rounded-xl flex items-center gap-1 transition-all border ${
                isDark
                  ? 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/40 text-blue-300'
                  : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700'
              }`}
              title="Expand to Fullscreen Tactical Map"
            >
              <Maximize2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Tactical Sanctuary Placement Active Banner */}
      {isPlacementModeActive && (
        <div className="absolute top-20 left-4 right-4 z-[996] bg-gradient-to-r from-purple-950/95 via-indigo-950/95 to-purple-950/95 backdrop-blur-md border-2 border-purple-500 p-3 rounded-xl flex items-center justify-between shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs text-purple-100">
            <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-400 flex items-center justify-center text-purple-300 shrink-0 animate-bounce">
              <Crosshair size={16} />
            </div>
            <div>
              <div className="font-black text-white text-sm flex items-center gap-1.5">
                <span>🎯 TACTICAL SANCTUARY PLACEMENT MODE ACTIVE</span>
              </div>
              <p className="text-[11px] text-purple-200">
                Click anywhere on the tactical map to drop a new customizable Refugee / Epidemic Surge Encampment.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsPlacementModeActive(false);
                setShowSanctuaryModal(true);
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow"
            >
              Manual Coordinates
            </button>
            <button
              onClick={() => setIsPlacementModeActive(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Latest Incident Resolved Banner Alert (Solid & Clear) */}
      {latestResolvedIncident && (
        <div className="absolute top-16 left-4 right-4 z-[995] bg-emerald-950/95 backdrop-blur-md border border-emerald-500/50 p-2.5 rounded-xl flex items-center justify-between shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          <div className="flex items-center gap-2.5 text-xs text-emerald-200">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_8px_#10b981]">
              <CheckCircle2 size={14} />
            </div>
            <div>
              <span className="font-bold text-white">INCIDENT RESOLVED & CLEARED: </span>
              <span>
                <strong>{latestResolvedIncident.id}</strong> at {latestResolvedIncident.location} successfully secured by <strong>{latestResolvedIncident.unitName}</strong> at {latestResolvedIncident.time}. Map updated.
              </span>
            </div>
          </div>
          {onClearResolvedNotice && (
            <button
              onClick={onClearResolvedNotice}
              className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-800/40"
              title="Dismiss notification"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Map Canvas (Direct clean flex-child) */}
      <div className="flex-1 relative z-10 w-full h-full min-h-0">
        <MapContainer
          center={mapCenter}
          zoom={12}
          zoomSnap={0.25}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={180}
          wheelDebounceTime={15}
          zoomAnimation={true}
          zoomAnimationThreshold={12}
          inertia={true}
          inertiaDeceleration={2400}
          inertiaMaxSpeed={1600}
          easeLinearity={0.18}
          scrollWheelZoom={true}
          className="w-full h-full"
          zoomControl={false}
        >
          {/* Map Click Listener for Dropping Sanctuaries */}
          <MapClickPlacementHandler
            isPlacementActive={isPlacementModeActive}
            onMapClick={handleMapClickForSanctuary}
          />

          {/* Active Leaflet Map Controls (Zoom In, Zoom Out, Recenter, Focus Target) */}
          <MapControls mapCenter={mapCenter} primaryIncident={primaryIncident} panTarget={panTarget} />

          {/* Free & Open Basemaps - Zero API Key Warnings or Watermarks */}
          {mapStyle === 'osm_dark' && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="tactical-midnight-tiles"
              maxZoom={19}
            />
          )}

          {mapStyle === 'esri_dark' && (
            <>
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                maxZoom={16}
              />
              <TileLayer
                attribution='&copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                maxZoom={16}
                opacity={0.8}
              />
            </>
          )}

          {mapStyle === 'satellite' && (
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
          )}

          {mapStyle === 'osm_street' && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {/* Dynamic Tactical Navigation Routes */}
          {(showTraffic || activeFilter === 'Dispatched Units') && activeRoutes.map((route, idx) => (
            <Polyline
              key={`route-${idx}`}
              positions={route!.positions}
              pathOptions={{
                color: route!.color,
                weight: activeFilter === 'Dispatched Units' ? 4 : 3.5,
                dashArray: '6, 8',
                opacity: 0.95
              }}
            />
          ))}

          {/* Emergency Hospital Corridor Lines */}
          {(showTraffic || activeFilter === 'Dispatched Units') && hospitalCorridors.map((corridor, idx) => (
            <Polyline
              key={`corridor-${idx}`}
              positions={corridor!.positions}
              pathOptions={{
                color: '#06b6d4',
                weight: 2.5,
                dashArray: '4, 6',
                opacity: 0.85
              }}
            />
          ))}

          {/* Response Vehicles on Map */}
          {displayedVehicles.map((v) => {
            const isAssigned = v.assignedIncidentId === primaryIncident?.id;
            const distance = primaryIncident ? calculateDistanceKm(v.lat, v.lng, primaryIncident.lat, primaryIncident.lng) : 0;
            const eta = calculateEtaMinutes(distance);
            const isFire = v.type === 'Fire';
            const isLiveGps = !!v.isLiveGps;

            return (
              <React.Fragment key={v.id}>
                {/* Live GPS Telemetry Accuracy Ring */}
                {isLiveGps && (
                  <Circle
                    center={[v.lat, v.lng]}
                    radius={Math.min(120, Math.max(30, v.gpsAccuracy || 40))}
                    pathOptions={{
                      color: '#06b6d4',
                      weight: 1.5,
                      dashArray: '3, 4',
                      fillColor: '#06b6d4',
                      fillOpacity: 0.12
                    }}
                  />
                )}

                <Marker
                  position={[v.lat, v.lng]}
                  icon={createVehicleIcon(v, isAssigned)}
                >
                  <Popup className="custom-popup" closeButton={false}>
                    <div className="p-3 w-64 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-100">{v.name}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            isFire 
                              ? 'text-red-400 bg-red-500/15 border-red-500/30' 
                              : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                          }`}>
                            {v.id}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          v.status === 'Available' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-blue-400 bg-blue-500/15 border-blue-500/30'
                        }`}>
                          {v.assignedIncidentId ? 'En Route' : v.status}
                        </span>
                      </div>

                      {/* Live GPS Telemetry Indicator */}
                      {isLiveGps && (
                        <div className="bg-cyan-950/40 border border-cyan-500/30 px-2 py-1 rounded-lg flex items-center justify-between text-[10px] text-cyan-300 font-mono">
                          <span className="flex items-center gap-1">
                            <Navigation size={11} className="text-cyan-400" />
                            <span>🛰 Live GPS Active</span>
                          </span>
                          <span className="text-cyan-200 font-bold">
                            {v.lat.toFixed(4)}, {v.lng.toFixed(4)}
                          </span>
                        </div>
                      )}

                      {isFire && (
                        <div className="bg-red-950/40 border border-red-500/30 px-2 py-1 rounded-lg flex items-center justify-between text-[11px] text-red-300 font-medium">
                          <span className="flex items-center gap-1">
                            <Flame size={12} className="text-red-400" />
                            Heavy Foam/Water Tender
                          </span>
                          <span className="text-[10px] font-mono text-red-200">10,000L</span>
                        </div>
                      )}

                      <div className="space-y-1 text-slate-300">
                        <p className="text-[11px] text-slate-400">Base: <strong className="text-slate-200">{v.station}</strong></p>
                        <p className="text-[11px] text-slate-400">Crew / Lead: <strong className="text-slate-200">{v.driver}</strong></p>
                        {v.equipment && v.equipment.length > 0 && (
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Gear: <span className="text-slate-300">{v.equipment.join(' • ')}</span>
                          </p>
                        )}
                        {primaryIncident && (
                          <div className="bg-[#090e1a] p-2 rounded-lg border border-[#1a2942] flex justify-between items-center text-[11px] font-mono">
                            <span className="text-amber-400 font-bold">{distance} km away</span>
                            <span className="text-emerald-400 font-bold">~{eta} min ETA</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
                          {onOpenRadioCall && (
                            <button
                              onClick={() => onOpenRadioCall({ type: 'Unit', id: v.id, name: v.name, vehicle: v })}
                              className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 rounded-lg text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1 transition-colors"
                              title={`Radio Call ${v.id}`}
                            >
                              <PhoneCall size={11} className="text-emerald-400" />
                              <span>Call</span>
                            </button>
                          )}
                          {onOpenCommsWithVehicle && (
                            <button
                              onClick={() => onOpenCommsWithVehicle(v.id)}
                              className="px-2 py-1 bg-[#15233c] hover:bg-[#1f3458] text-blue-400 rounded-lg text-[11px] font-bold border border-blue-500/30 flex items-center gap-1 transition-colors"
                              title={`Chat with ${v.id}`}
                            >
                              <Radio size={11} /> Comms
                            </button>
                          )}
                        </div>

                        {isAssigned ? (
                          <button
                            onClick={() => onRecallVehicle && onRecallVehicle(v.id)}
                            className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-[11px] font-bold border border-red-500/30 flex items-center gap-1"
                          >
                            <RotateCcw size={11} /> Recall
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (primaryIncident && onDispatchVehicle) {
                                playRadioChirp('transmit');
                                onDispatchVehicle(v.id, primaryIncident.id);
                              }
                            }}
                            className="px-3 py-1 bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg text-[11px] font-bold border border-sky-300 shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Zap size={11} /> Dispatch
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* Hospital Markers */}
          {displayedHospitals.map((h) => {
            const distance = primaryIncident ? calculateDistanceKm(h.lat, h.lng, primaryIncident.lat, primaryIncident.lng) : 0;
            const eta = calculateEtaMinutes(distance);

            return (
              <Marker
                key={h.id}
                position={[h.lat, h.lng]}
                icon={createHospitalIcon(h)}
              >
                <Popup className="custom-popup" closeButton={false}>
                  <div className="p-3 w-64 space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-1.5 border-b border-slate-700/60 pb-2">
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 mb-0.5">
                          <Building2 size={11} />
                          <span>{h.id}</span>
                        </div>
                        <h4 className="font-bold text-white text-xs leading-snug">{h.name}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                        h.type === 'Government'
                          ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/40'
                          : 'text-cyan-400 bg-cyan-500/15 border-cyan-500/40'
                      }`}>
                        {h.type}
                      </span>
                    </div>

                    <div className="space-y-1.5 bg-[#090e1a] p-2 rounded-xl border border-[#1b2b46]">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Bed size={12} className="text-blue-400" /> Total Capacity:
                        </span>
                        <strong className="text-white font-mono">{h.capacity} Beds</strong>
                      </div>
                      {h.availableBeds && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Available Beds:</span>
                          <strong className="text-emerald-400 font-mono">{h.availableBeds} Available</strong>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                        <span>Area:</span>
                        <span className="text-slate-300 font-medium">{h.area || 'Metro'}</span>
                      </div>
                    </div>

                    {primaryIncident && (
                      <div className="bg-[#0c1626] px-2.5 py-1.5 rounded-lg border border-blue-500/20 flex justify-between items-center text-[11px] font-mono">
                        <span className="text-amber-300 font-bold">{distance} km from incident</span>
                        <span className="text-emerald-400 font-bold">~{eta} min ETA</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                      {h.contact && (
                        <a
                          href={`tel:${h.contact}`}
                          className="px-2.5 py-1 bg-[#132035] hover:bg-[#1c3050] text-emerald-400 rounded-lg text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1"
                        >
                          <Phone size={11} /> Call ER
                        </a>
                      )}
                      <button
                        onClick={() => {
                          playRadioChirp('alert');
                          alert(`Ambulance route to ${h.name} alerted (${h.capacity} beds). ER trauma bay prepped.`);
                        }}
                        className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-lg text-[11px] font-bold border border-cyan-500/40 flex items-center gap-1 ml-auto"
                      >
                        <CheckCircle2 size={11} /> Route Amb
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Police Station Markers */}
          {displayedPoliceStations.map((p) => {
            const distance = primaryIncident ? calculateDistanceKm(p.lat, p.lng, primaryIncident.lat, primaryIncident.lng) : 0;
            const eta = calculateEtaMinutes(distance);

            return (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={createPoliceStationIcon(p)}
              >
                <Popup className="custom-popup" closeButton={false}>
                  <div className="p-3 w-64 space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-1.5 border-b border-slate-700/60 pb-2">
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-blue-400 mb-0.5">
                          <Shield size={11} />
                          <span>{p.id} • {p.division} Div</span>
                        </div>
                        <h4 className="font-bold text-white text-xs leading-snug">{p.name}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border text-blue-400 bg-blue-500/15 border-blue-500/40 shrink-0">
                        Precinct
                      </span>
                    </div>

                    <div className="space-y-1.5 bg-[#090e1a] p-2 rounded-xl border border-[#1b2b46]">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Users size={12} className="text-blue-400" /> Personnel (Est.):
                        </span>
                        <strong className="text-white font-mono">{p.personnel} Officers</strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Car size={12} className="text-blue-400" /> Patrol Fleet:
                        </span>
                        <strong className="text-blue-300 font-mono">{p.vehiclesCount || 8} Units</strong>
                      </div>
                    </div>

                    {primaryIncident && (
                      <div className="bg-[#0c1626] px-2.5 py-1.5 rounded-lg border border-blue-500/20 flex justify-between items-center text-[11px] font-mono">
                        <span className="text-amber-300 font-bold">{distance} km to incident</span>
                        <span className="text-emerald-400 font-bold">~{eta} min response</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                      {p.contact && (
                        <a
                          href={`tel:${p.contact}`}
                          className="px-2.5 py-1 bg-[#132035] hover:bg-[#1c3050] text-blue-400 rounded-lg text-[11px] font-bold border border-blue-500/30 flex items-center gap-1"
                        >
                          <Phone size={11} /> Hotline
                        </a>
                      )}
                      <button
                        onClick={() => {
                          playRadioChirp('alert');
                          alert(`Tactical dispatch alert sent to ${p.name}. Perimeter backup requested.`);
                        }}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-[11px] font-bold border border-blue-500/40 flex items-center gap-1 ml-auto"
                      >
                        <Shield size={11} /> Request Patrol
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Fire Station Markers */}
          {displayedFireStations.map((f) => {
            const distance = primaryIncident ? calculateDistanceKm(f.lat, f.lng, primaryIncident.lat, primaryIncident.lng) : 0;
            const eta = calculateEtaMinutes(distance);

            return (
              <Marker
                key={f.id}
                position={[f.lat, f.lng]}
                icon={createFireStationIcon(f)}
              >
                <Popup className="custom-popup" closeButton={false}>
                  <div className="p-3 w-64 space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-1.5 border-b border-slate-700/60 pb-2">
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-red-400 mb-0.5">
                          <Flame size={11} />
                          <span>{f.id} • {f.zone} Zone</span>
                        </div>
                        <h4 className="font-bold text-white text-xs leading-snug">{f.name}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border text-red-400 bg-red-500/15 border-red-500/40 shrink-0">
                        Fire Station
                      </span>
                    </div>

                    <div className="space-y-1.5 bg-[#090e1a] p-2 rounded-xl border border-[#1b2b46]">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Truck size={12} className="text-red-400" /> Vehicles/Engines:
                        </span>
                        <strong className="text-white font-mono">{f.vehiclesCount} Engines</strong>
                      </div>
                      {f.personnel && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Users size={12} className="text-red-400" /> Personnel:
                          </span>
                          <strong className="text-red-300 font-mono">{f.personnel} Firefighters</strong>
                        </div>
                      )}
                    </div>

                    {primaryIncident && (
                      <div className="bg-[#0c1626] px-2.5 py-1.5 rounded-lg border border-red-500/20 flex justify-between items-center text-[11px] font-mono">
                        <span className="text-amber-300 font-bold">{distance} km to incident</span>
                        <span className="text-emerald-400 font-bold">~{eta} min ETA</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                      {f.contact && (
                        <a
                          href={`tel:${f.contact}`}
                          className="px-2.5 py-1 bg-[#132035] hover:bg-[#1c3050] text-red-400 rounded-lg text-[11px] font-bold border border-red-500/30 flex items-center gap-1"
                        >
                          <Phone size={11} /> Control
                        </a>
                      )}
                      <button
                        onClick={() => {
                          playRadioChirp('alert');
                          alert(`Water tender & foam engine requested from ${f.name}. Emergency turnout signaled.`);
                        }}
                        className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-[11px] font-bold border border-red-500/40 flex items-center gap-1 ml-auto"
                      >
                        <Flame size={11} /> Turnout Engine
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Emergency Sanctuaries & Epidemic Surge Overflow Encampments */}
          {sanctuaries.map((s) => {
            const distance = primaryIncident ? calculateDistanceKm(s.lat, s.lng, primaryIncident.lat, primaryIncident.lng) : 0;
            const eta = calculateEtaMinutes(distance);
            const occupancyRatio = s.capacity > 0 ? (s.occupied / s.capacity) : 0;
            const occupancyPercent = Math.round(occupancyRatio * 100);

            return (
              <React.Fragment key={`sanctuary-${s.id}`}>
                {/* Sanctuary Radius Boundary Circle */}
                <Circle
                  center={[s.lat, s.lng]}
                  radius={s.coverageRadiusMeters || 500}
                  pathOptions={{
                    color: s.type.includes('Epidemic') ? '#a855f7' : '#06b6d4',
                    weight: 1.5,
                    dashArray: '5, 6',
                    fillColor: s.type.includes('Epidemic') ? '#c084fc' : '#22d3ee',
                    fillOpacity: 0.12
                  }}
                />

                <Marker
                  position={[s.lat, s.lng]}
                  icon={createSanctuaryIcon(s)}
                >
                  <Popup className="custom-popup" closeButton={false}>
                    <div className="p-3 w-72 space-y-2.5 text-xs">
                      <div className="flex items-start justify-between gap-1.5 border-b border-slate-700/60 pb-2">
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-mono text-purple-400 mb-0.5">
                            <MapPin size={11} />
                            <span>{s.id} • {s.establishedTime}</span>
                          </div>
                          <h4 className="font-bold text-white text-xs leading-snug">{s.name}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border text-purple-300 bg-purple-500/20 border-purple-500/40 shrink-0">
                          {s.type}
                        </span>
                      </div>

                      <div className="space-y-1.5 bg-[#090e1a] p-2 rounded-xl border border-[#1b2b46]">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Total Capacity:</span>
                          <strong className="text-white font-mono">{s.capacity.toLocaleString()} Beds / Units</strong>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Current Occupancy:</span>
                          <strong className={`${occupancyPercent > 80 ? 'text-amber-400' : 'text-cyan-400'} font-mono`}>
                            {s.occupied.toLocaleString()} ({occupancyPercent}%)
                          </strong>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${occupancyPercent > 80 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                            style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                          />
                        </div>

                        {s.supplies && (
                          <div className="pt-1.5 border-t border-slate-800 grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono">
                            <div>🫁 O₂ Units: <span className="text-white font-bold">{s.supplies.oxygenUnits}</span></div>
                            <div>🛌 Iso Beds: <span className="text-white font-bold">{s.supplies.isolationBeds}</span></div>
                            <div>⛺ Tents: <span className="text-white font-bold">{s.supplies.tents}</span></div>
                            <div>🦺 PPE: <span className="text-white font-bold">{s.supplies.ppeKits}</span></div>
                            <div className="col-span-2">💧 Water: <span className="text-white font-bold">{s.supplies.potableWaterLitres.toLocaleString()} L</span></div>
                          </div>
                        )}
                        {s.notes && (
                          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800/60">
                            "{s.notes}"
                          </p>
                        )}
                      </div>

                      {primaryIncident && (
                        <div className="bg-[#0c1626] px-2.5 py-1.5 rounded-lg border border-purple-500/20 flex justify-between items-center text-[11px] font-mono">
                          <span className="text-amber-300 font-bold">{distance} km to incident</span>
                          <span className="text-emerald-400 font-bold">~{eta} min ETA</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => {
                            if (onUpdateSanctuary) {
                              const add = Math.min(50, s.capacity - s.occupied);
                              onUpdateSanctuary(s.id, { occupied: s.occupied + add });
                              playRadioChirp('roger');
                            }
                          }}
                          disabled={s.occupied >= s.capacity}
                          className="px-2 py-1 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-lg text-[10px] font-bold border border-cyan-500/30 disabled:opacity-50"
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
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[10px] font-bold"
                        >
                          -50 Discharged
                        </button>
                        {onRemoveSanctuary && (
                          <button
                            onClick={() => {
                              if (confirm(`Decommission emergency sanctuary ${s.name}?`)) {
                                onRemoveSanctuary(s.id);
                              }
                            }}
                            className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-[10px] font-bold border border-red-500/30 ml-auto"
                          >
                            Decommission
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* Interactive Disaster & CBRN Hazard Zones & Dispersion Plumes */}
          {filteredIncidents.map((inc) => {
            const isSpecialHazard = inc.type === 'Hazmat' || inc.type === 'Radiation' || inc.type === 'Disaster' || !!inc.hazardZone;
            if (!isSpecialHazard) return null;

            const coreRadius = inc.hazardZone?.radiusMeters || (inc.type === 'Radiation' ? 850 : inc.type === 'Hazmat' ? 1200 : 1600);
            const evacRadius = Math.round(coreRadius * 2.2);

            const strokeColor = inc.type === 'Radiation' ? '#facc15' : inc.type === 'Hazmat' ? '#c084fc' : '#fb923c';
            const fillColor = inc.type === 'Radiation' ? '#eab308' : inc.type === 'Hazmat' ? '#a855f7' : '#ea580c';

            return (
              <React.Fragment key={`hazard-zone-${inc.id}`}>
                {/* Outer Evacuation Perimeter Cordon */}
                <Circle
                  center={[inc.lat, inc.lng]}
                  radius={evacRadius}
                  pathOptions={{
                    color: strokeColor,
                    weight: 1.5,
                    dashArray: '6, 8',
                    fillColor: fillColor,
                    fillOpacity: 0.06
                  }}
                >
                  <Tooltip sticky className="tactical-zone-tooltip">
                    <span className="font-mono text-[10px] text-slate-200">
                      {inc.id} Evacuation Cordon: {(evacRadius / 1000).toFixed(1)}km
                    </span>
                  </Tooltip>
                </Circle>

                {/* Inner Core Immediate Danger / Exclusion Zone */}
                <Circle
                  center={[inc.lat, inc.lng]}
                  radius={coreRadius}
                  pathOptions={{
                    color: strokeColor,
                    weight: 2.2,
                    fillColor: fillColor,
                    fillOpacity: 0.22
                  }}
                >
                  <Tooltip permanent direction="top" className="tactical-zone-tooltip">
                    <span className="font-mono font-bold text-[10px] text-white">
                      {inc.type === 'Radiation' ? '☢️' : inc.type === 'Hazmat' ? '☣️' : '⚠️'} {inc.hazardZone?.reading || (inc.type === 'Radiation' ? '42.8 mSv/h Radiation Cordon' : inc.type === 'Hazmat' ? '68.5 PPM Gas Plume' : 'Inundation Zone')}
                    </span>
                  </Tooltip>
                </Circle>
              </React.Fragment>
            );
          })}

          {/* Incident Hazard Target Markers on Map */}
          {filteredIncidents.map((inc) => {
            const isSpecialHazard = inc.type === 'Hazmat' || inc.type === 'Radiation' || inc.type === 'Disaster' || !!inc.hazardZone;

            return (
              <Marker
                key={inc.id}
                position={[inc.lat, inc.lng]}
                icon={createTacticalIcon(inc.type, inc.priority, inc.id)}
              >
                <Popup className="custom-popup" closeButton={false}>
                  <div className="p-3 w-72 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isSpecialHazard ? 'bg-amber-400 animate-ping' : 'bg-red-500 animate-ping'}`}></span>
                        <span className="font-mono font-bold text-xs tracking-wider uppercase text-slate-200">{inc.id}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        inc.priority === 'High' ? 'text-red-400 bg-red-500/20 border-red-500/50 animate-pulse' : 'text-amber-400 bg-amber-500/15 border-amber-500/40'
                      }`}>
                        {inc.priority} PRIORITY
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-1.5">
                        {inc.type === 'Fire' && <Flame size={14} className="text-red-400" />}
                        {inc.type === 'Accident' && <AlertTriangle size={14} className="text-amber-400" />}
                        {inc.type === 'Medical' && <Stethoscope size={14} className="text-emerald-400" />}
                        {inc.type === 'Police' && <Shield size={14} className="text-blue-400" />}
                        {inc.type === 'Hazmat' && <Biohazard size={14} className="text-purple-400 animate-pulse" />}
                        {inc.type === 'Radiation' && <Radiation size={14} className="text-yellow-400 animate-spin-slow" />}
                        {inc.type === 'Disaster' && <Waves size={14} className="text-orange-400" />}
                        <span>{inc.type} Emergency</span>
                      </div>
                      <div className="text-xs text-slate-300 mt-1.5 flex items-start gap-1.5">
                        <MapPin size={13} className="text-red-400 shrink-0 mt-0.5" />
                        <span className="leading-snug font-medium">{inc.location}</span>
                      </div>

                      {/* Specialized Hazard Zone Telemetry Box */}
                      {isSpecialHazard && (
                        <div className="mt-2 bg-[#171020] border border-purple-500/40 rounded-lg p-2 text-xs space-y-1 text-slate-200">
                          <div className="flex items-center justify-between text-[11px] text-amber-300 font-mono font-bold">
                            <span>{inc.type === 'Radiation' ? '☢️ DOSIMETER READING:' : inc.type === 'Hazmat' ? '☣️ GAS DETECTOR:' : '🌊 INUNDATION:'}</span>
                            <span className="text-white bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/40">{inc.hazardZone?.reading || 'Active Dispersion'}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="flex items-center gap-1"><Wind size={10} className="text-cyan-400" /> Atmospheric Wind:</span>
                            <span className="font-mono text-slate-200">{inc.hazardZone?.windDirection || 'NE @ 16 km/h'}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Evacuation Perimeter:</span>
                            <span className="font-mono text-purple-300 font-bold">{inc.hazardZone?.radiusMeters ? `${inc.hazardZone.radiusMeters * 2}m` : '1.8 km Cordon'}</span>
                          </div>
                        </div>
                      )}

                      {inc.description && (
                        <p className="text-[11px] text-slate-300 mt-1.5 bg-[#080d1a] p-2 rounded-lg border border-[#1b2a45] leading-relaxed">
                          {inc.description}
                        </p>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-slate-500" />
                          {inc.time}
                        </span>
                        <span className="text-[10px] font-mono text-blue-400 font-bold">{inc.status}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      {fullScreen && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onSelectIncidentId) onSelectIncidentId(inc.id);
                            setShowNearbyDrawer(true);
                          }}
                          className="text-xs text-amber-400 font-bold hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-lg border border-amber-500/30 transition-all cursor-pointer select-none"
                          title="Open Proximity Dispatch Console for this incident"
                        >
                          <Zap size={12} /> Dispatch Nearby
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onViewIncident(inc)}
                        className={`${fullScreen ? 'px-3' : 'w-full'} text-xs text-white font-bold flex items-center justify-center gap-1 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-all cursor-pointer`}
                      >
                        {fullScreen ? 'Details' : 'Incident Details'}
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Left Floating Map Toolbar with Working Layer Toggles */}
        <div className={`absolute left-4 top-4 z-[500] flex flex-col gap-1.5 backdrop-blur-md p-1.5 rounded-2xl border shadow-xl transition-colors ${
          isDark 
            ? 'bg-[#0b101d]/95 border-[#1d2a42]' 
            : 'bg-white/95 border-slate-200 shadow-lg'
        }`}>
          {/* Nearby Proximity Drawer Trigger */}
          <button
            onClick={() => setShowNearbyDrawer(!showNearbyDrawer)}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all cursor-pointer ${
              showNearbyDrawer 
                ? isDark 
                  ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40 shadow-xs' 
                  : 'text-amber-800 bg-amber-50 border border-amber-300 font-semibold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Toggle Nearby Units Proximity Console"
          >
            <Zap size={15} />
            <span className="text-[9px] font-medium mt-0.5">Nearby</span>
          </button>

          {/* Traffic & Navigation Routes */}
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all cursor-pointer ${
              showTraffic 
                ? isDark 
                  ? 'text-blue-400 bg-blue-500/20 border border-blue-500/40 shadow-xs' 
                  : 'text-blue-800 bg-blue-50 border border-blue-300 font-semibold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Toggle Response Routes & Corridors"
          >
            <Navigation2 size={15} />
            <span className="text-[9px] font-medium mt-0.5">Routes</span>
          </button>

          {/* Response Units */}
          <button
            onClick={() => setShowUnits(!showUnits)}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all cursor-pointer ${
              showUnits 
                ? isDark 
                  ? 'text-blue-400 bg-blue-500/20 border border-blue-500/40 shadow-xs' 
                  : 'text-blue-800 bg-blue-50 border border-blue-300 font-semibold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Toggle Vehicles & Responders"
          >
            <Car size={15} />
            <span className="text-[9px] font-medium mt-0.5">Units</span>
          </button>

          {/* Hospitals Toggle */}
          <button
            onClick={() => setOverrideHospitals(!isHospitalsVisible)}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all relative cursor-pointer ${
              isHospitalsVisible
                ? isDark
                  ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : 'text-emerald-800 bg-emerald-50 border border-emerald-300 font-semibold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Toggle Hospitals"
          >
            <Building2 size={15} />
            <span className="text-[9px] font-medium mt-0.5">Hospitals</span>
          </button>

          {/* Fire Stations Toggle */}
          <button
            onClick={() => setOverrideFireStations(!isFireStationsVisible)}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all relative cursor-pointer ${
              isFireStationsVisible
                ? isDark
                  ? 'text-red-400 bg-red-500/20 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                  : 'text-red-800 bg-red-50 border border-red-300 font-semibold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Toggle Fire Stations"
          >
            <Flame size={15} />
            <span className="text-[9px] font-medium mt-0.5">Fire Stn</span>
          </button>

          {/* Police Stations Toggle */}
          <button
            onClick={() => setOverridePoliceStations(!isPoliceStationsVisible)}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all relative cursor-pointer ${
              isPoliceStationsVisible
                ? isDark
                  ? 'text-blue-400 bg-blue-500/20 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                  : 'text-blue-800 bg-blue-50 border border-blue-300 font-semibold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Toggle Police Stations"
          >
            <Shield size={15} />
            <span className="text-[9px] font-medium mt-0.5">Police Stn</span>
          </button>

          {/* Disaster & CBRN Hazard Zones Layer Toggle */}
          <button
            onClick={() => {
              if (onToggleDisasterMode) onToggleDisasterMode();
              else setOverrideDisasterLayer(!overrideDisasterLayer);
            }}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all relative cursor-pointer ${
              isDisasterModeActive || overrideDisasterLayer
                ? isDark
                  ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                  : 'text-amber-800 bg-amber-50 border border-amber-300 font-semibold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Toggle Disaster, Radiation & Hazmat Hazard Plumes"
          >
            <Radiation size={15} className={isDisasterModeActive ? 'animate-spin-slow' : ''} />
            <span className="text-[9px] font-medium mt-0.5">Disaster</span>
          </button>

          {/* CCTV Cameras Toggle */}
          <button
            onClick={() => setShowCCTV(!showCCTV)}
            className={`flex flex-col items-center justify-center w-12 h-11 rounded-xl transition-all cursor-pointer ${
              showCCTV 
                ? isDark 
                  ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40 shadow-xs' 
                  : 'text-amber-800 bg-amber-50 border border-amber-300 font-semibold shadow-xs'
                : isDark ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Toggle CCTV Cameras"
          >
            <Camera size={15} />
            <span className="text-[9px] font-medium mt-0.5">CCTV</span>
          </button>
        </div>

        {/* Overlay Primary Incident Callout */}
        {showCallout && primaryIncident && !showNearbyDrawer && (
          <div className={`absolute right-6 top-6 z-[500] w-64 backdrop-blur-xl rounded-2xl p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 transition-colors border ${
            isDark 
              ? 'bg-[#0d1322]/95 border-[#24334f] text-slate-100 shadow-[0_10px_35px_rgba(0,0,0,0.7)]' 
              : 'bg-white/95 border-slate-200 text-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.15)]'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-bold text-xs flex items-center gap-1.5 ${
                primaryIncident.type === 'Fire' ? (isDark ? 'text-red-400' : 'text-red-600') :
                primaryIncident.type === 'Medical' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') :
                primaryIncident.type === 'Police' ? (isDark ? 'text-blue-400' : 'text-blue-600') :
                primaryIncident.type === 'Accident' ? (isDark ? 'text-amber-400' : 'text-amber-600') :
                (isDark ? 'text-purple-400' : 'text-purple-600')
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  primaryIncident.type === 'Fire' ? 'bg-red-500' :
                  primaryIncident.type === 'Medical' ? 'bg-emerald-500' :
                  primaryIncident.type === 'Police' ? 'bg-blue-500' :
                  primaryIncident.type === 'Accident' ? 'bg-amber-500' :
                  'bg-purple-500'
                }`}></span>
                {primaryIncident.type} Incident Active
              </h3>
              <button
                onClick={() => setShowCallout(false)}
                className={`text-xs font-bold px-1 transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="mt-2.5 space-y-1.5">
              <p className={`text-xs font-semibold flex items-center gap-1.5 ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                <MapPin size={13} className={`shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                <span className="truncate">{primaryIncident.location}</span>
              </p>
              <p className={`text-[11px] font-mono ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {primaryIncident.time} • High Priority
              </p>
              <p className={`text-xs leading-relaxed p-2.5 rounded-xl border font-normal ${
                isDark 
                  ? 'text-slate-200 bg-[#070b14]/80 border-[#1a263d]' 
                  : 'text-slate-700 bg-slate-50 border-slate-200'
              }`}>
                {primaryIncident.description || 'Emergency response active.'}
              </p>
            </div>

            <div className="mt-3 flex gap-2">
              {fullScreen && (
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectIncidentId) onSelectIncidentId(primaryIncident.id);
                    setShowNearbyDrawer(true);
                  }}
                  className="flex-1 py-1.5 px-2.5 bg-sky-400 hover:bg-sky-300 active:bg-sky-500 text-slate-950 font-bold text-xs rounded-xl border border-sky-300 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap size={13} /> Dispatch Nearby
                </button>
              )}
              <button
                type="button"
                onClick={() => onViewIncident(primaryIncident)}
                className={`${fullScreen ? 'px-3' : 'w-full'} py-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer`}
              >
                {fullScreen ? 'Details' : 'View Incident Details'}
              </button>
            </div>
          </div>
        )}

        {/* Slide-out Nearby Units Dispatch Drawer inside Map (Optimized Size & Ergonomics) */}
        {showNearbyDrawer && (
          <div className="absolute right-4 top-4 bottom-4 z-[600] w-96 sm:w-[440px] max-w-[94vw] bg-[#090e1a]/98 backdrop-blur-xl border border-[#243450] rounded-2xl shadow-[0_12px_45px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col animate-in slide-in-from-right-10 duration-200">
            <div className="p-3.5 border-b border-[#1b2a45] flex justify-between items-center bg-[#070b14]">
              <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <Zap size={15} className="text-amber-400" />
                Proximity Dispatch Console
              </span>
              <button
                onClick={() => setShowNearbyDrawer(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1 px-2 rounded-lg bg-[#111a2d] hover:bg-slate-800 transition-colors"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NearbyUnitsPanel
                compact
                vehicles={vehicles}
                incidents={incidents}
                selectedIncidentId={selectedIncidentId || primaryIncident?.id || ''}
                onSelectIncidentId={(id) => onSelectIncidentId && onSelectIncidentId(id)}
                onDispatchVehicle={(vId, incId) => onDispatchVehicle && onDispatchVehicle(vId, incId)}
                onRecallVehicle={(vId) => onRecallVehicle && onRecallVehicle(vId)}
                onOpenCommsWithVehicle={onOpenCommsWithVehicle}
                onOpenRadioCall={onOpenRadioCall}
              />
            </div>
          </div>
        )}

        {/* Dedicated Dispatched Units Fleet HUD when Dispatched Units tab is active */}
        {activeFilter === 'Dispatched Units' && (
          <div className="absolute right-4 top-4 z-[500] w-80 sm:w-96 max-h-[calc(100%-80px)] overflow-y-auto bg-[#0d1322]/95 backdrop-blur-xl border border-blue-500/40 rounded-2xl p-3 shadow-[0_12px_40px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-95 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#223554] pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚡ Dispatched Fleet Radar</span>
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-1.5 py-0.2 rounded font-mono text-[10px]">
                    {dispatchedVehicles.length} Units Active
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setActiveFilter('All')}
                className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700"
                title="Return to All"
              >
                ✕
              </button>
            </div>

            {dispatchedVehicles.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                <p className="font-semibold text-slate-300">No units currently dispatched.</p>
                <p className="text-[11px] text-slate-500 mt-1">Select an active emergency incident on the map to deploy engines or ambulances.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dispatchedVehicles.map(v => {
                  const targetInc = incidents.find(i => i.id === v.assignedIncidentId);
                  const distance = targetInc ? calculateDistanceKm(v.lat, v.lng, targetInc.lat, targetInc.lng) : 0;
                  const eta = calculateEtaMinutes(distance);
                  const isFire = v.type === 'Fire';
                  const isAmb = v.type === 'Ambulance';

                  return (
                    <div
                      key={v.id}
                      className="bg-[#080d19] border border-[#1b2b45] hover:border-blue-500/50 rounded-xl p-2.5 space-y-2 transition-all shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">{v.name}</span>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                              isFire ? 'text-red-400 bg-red-500/15 border-red-500/30' :
                              isAmb ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' :
                              'text-blue-400 bg-blue-500/15 border-blue-500/30'
                            }`}>
                              {v.id}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">Crew Lead: <span className="text-slate-200">{v.driver}</span> • {v.station}</p>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border text-emerald-300 bg-emerald-500/20 border-emerald-500/50 animate-pulse shrink-0">
                          {v.status === 'On Scene' ? 'ON SCENE' : 'EN ROUTE'}
                        </span>
                      </div>

                      {/* Mission Incident Assignment */}
                      <div className="bg-[#0e1628] p-2 rounded-lg border border-[#1d2d48] text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="font-semibold text-slate-300">Target Assignment:</span>
                          <span className="font-mono text-blue-400 font-bold">{v.assignedIncidentId || 'General Patrol'}</span>
                        </div>
                        {targetInc && (
                          <p className="text-[11px] font-medium text-slate-200 truncate flex items-center gap-1">
                            <MapPin size={11} className="text-red-400 shrink-0" />
                            {targetInc.location}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 font-semibold mt-1 pt-1 border-t border-slate-800">
                          <span>{distance} km away</span>
                          <span className="text-emerald-400">ETA ~{eta} min</span>
                          <span className="text-cyan-400">Speed: {v.speed ? `${v.speed} km/h` : '58 km/h'}</span>
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center justify-between gap-1.5 pt-0.5">
                        <button
                          onClick={() => setPanTarget([v.lat, v.lng])}
                          className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                          title="Focus map on this unit"
                        >
                          <Locate size={10} /> Focus
                        </button>

                        {onOpenRadioCall && (
                          <button
                            onClick={() => onOpenRadioCall({ type: 'Unit', id: v.id, name: v.name, vehicle: v })}
                            className="px-2 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                            title={`Radio Call ${v.id}`}
                          >
                            <PhoneCall size={10} className="text-emerald-400" /> Radio
                          </button>
                        )}

                        {onOpenCommsWithVehicle && (
                          <button
                            onClick={() => onOpenCommsWithVehicle(v.id)}
                            className="px-2 py-1 bg-[#15233c] hover:bg-[#1f3458] text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                            title={`Direct Comms ${v.id}`}
                          >
                            <Radio size={10} /> Comms
                          </button>
                        )}

                        {onRecallVehicle && (
                          <button
                            onClick={() => onRecallVehicle(v.id)}
                            className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors ml-auto"
                            title="Recall unit to home station"
                          >
                            <RotateCcw size={10} /> Recall
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customizable Emergency Sanctuary & Epidemic Overflow Encampment Modal */}
      {showSanctuaryModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-purple-500/50 rounded-2xl w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-gradient-to-r from-purple-950/80 via-[#150f28] to-[#0b101d] border-b border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/60 flex items-center justify-center text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                  <HeartPulse size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">Deploy Emergency Relief Sanctuary</h3>
                  <p className="text-[11px] text-purple-300/80 mt-1">
                    Authorized Epidemic & Refugee Overflow Encampment Zone
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSanctuaryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSanctuarySubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Sanctuary Designation & Name
                </label>
                <input
                  type="text"
                  required
                  value={newSanctuaryForm.name}
                  onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, name: e.target.value })}
                  placeholder="e.g. Jawaharlal Nehru Stadium Epidemic Surge Hub"
                  className="w-full bg-[#070b14] border border-[#1e2c47] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Facility Protocol Type
                  </label>
                  <select
                    value={newSanctuaryForm.type}
                    onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, type: e.target.value as any })}
                    className="w-full bg-[#070b14] border border-[#1e2c47] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Epidemic Surge Hospital">Epidemic Surge Hospital</option>
                    <option value="Refugee Relief Sanctuary">Refugee Relief Sanctuary</option>
                    <option value="Quarantine Zone">Quarantine Zone</option>
                    <option value="Mass Evacuation Hub">Mass Evacuation Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
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
                    className="w-full bg-[#070b14] border border-[#1e2c47] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newSanctuaryForm.lat}
                    onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, lat: Number(e.target.value) })}
                    className="w-full bg-[#070b14] border border-[#1e2c47] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newSanctuaryForm.lng}
                    onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, lng: Number(e.target.value) })}
                    className="w-full bg-[#070b14] border border-[#1e2c47] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Coverage Perimeter Radius ({newSanctuaryForm.coverageRadiusMeters} meters)
                </label>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={newSanctuaryForm.coverageRadiusMeters}
                  onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, coverageRadiusMeters: Number(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

              <div className="p-3 bg-[#070b14] rounded-xl border border-purple-500/20 space-y-2.5">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                  📦 Initial Medical & Humanitarian Stock
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400">Oxygen Units (Cylinders/PSA):</label>
                    <input
                      type="number"
                      value={newSanctuaryForm.oxygenUnits}
                      onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, oxygenUnits: Number(e.target.value) })}
                      className="w-full bg-[#0c1322] border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Isolation/ICU Cubicles:</label>
                    <input
                      type="number"
                      value={newSanctuaryForm.isolationBeds}
                      onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, isolationBeds: Number(e.target.value) })}
                      className="w-full bg-[#0c1322] border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Shelter Tents (Units):</label>
                    <input
                      type="number"
                      value={newSanctuaryForm.tents}
                      onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, tents: Number(e.target.value) })}
                      className="w-full bg-[#0c1322] border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Potable Water Tank (Litres):</label>
                    <input
                      type="number"
                      value={newSanctuaryForm.potableWaterLitres}
                      onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, potableWaterLitres: Number(e.target.value) })}
                      className="w-full bg-[#0c1322] border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tactical Notes & Operational Instructions
                </label>
                <textarea
                  rows={2}
                  value={newSanctuaryForm.notes}
                  onChange={(e) => setNewSanctuaryForm({ ...newSanctuaryForm, notes: e.target.value })}
                  placeholder="Deployment instructions for triage teams..."
                  className="w-full bg-[#070b14] border border-[#1e2c47] focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSanctuaryModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Establish Tactical Sanctuary</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Leaflet Custom Tactical Styles */}
      <style>{`
        .leaflet-container { background: #070a12 !important; z-index: 10 !important; }
        .leaflet-tactical-marker {
          background: transparent !important;
          border: none !important;
          pointer-events: auto !important;
        }

        .leaflet-tactical-marker:hover,
        .leaflet-marker-icon:hover {
          z-index: 99999 !important;
        }

        @keyframes subtle-beacon-expand {
          0% { transform: scale(0.92); opacity: 0.35; }
          100% { transform: scale(1.32); opacity: 0; }
        }

        @keyframes bold-beacon-pulse {
          0% { transform: scale(0.9); opacity: 0.45; }
          40% { opacity: 0.22; }
          100% { transform: scale(1.45); opacity: 0; }
        }

        .custom-tactical-pin {
          position: relative;
          width: 38px;
          height: 46px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          transform-origin: bottom center;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease;
          pointer-events: auto;
          will-change: transform;
        }

        /* Persistent Hitbox to prevent hover flutter/bounce when lifting */
        .custom-tactical-pin::before {
          content: '';
          position: absolute;
          top: -20px;
          bottom: -20px;
          left: -20px;
          right: -20px;
          z-index: 1;
          pointer-events: auto;
        }

        .leaflet-tactical-marker:hover .custom-tactical-pin {
          transform: translateY(-5px) scale(1.12);
          filter: drop-shadow(0 6px 14px var(--glow-color));
          z-index: 9999;
        }

        /* Callsign Tag Attached to Incident */
        .incident-callsign-tag {
          position: absolute;
          top: -14px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 8.5px;
          font-weight: 900;
          padding: 1.5px 5px;
          border-radius: 4px;
          border: 1.5px solid;
          white-space: nowrap;
          box-shadow: 0 0 10px var(--glow-color), 0 3px 6px rgba(0, 0, 0, 0.85);
          z-index: 10;
          letter-spacing: 0.05em;
        }

        /* Subtle & Calibrated Outward Beacon Rings for Incidents */
        .bold-beacon-ring {
          position: absolute;
          top: 0px;
          left: 0px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid var(--primary-color);
          box-shadow: 0 0 6px var(--halo-color);
          pointer-events: none;
          animation: bold-beacon-pulse var(--pulse-speed, 3.8s) cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
        }

        .bold-beacon-ring.beacon-outer {
          animation-delay: 1.5s;
          border-width: 1px;
        }

        /* Bold Pin Head for Incidents */
        .pin-head-bold {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #08111e;
          border: 2px solid var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px var(--glow-color), inset 0 0 4px var(--glow-color);
          z-index: 5;
        }

        .incident-pin.high-priority-incident .pin-head-bold {
          animation: high-priority-strobe 2.4s infinite alternate ease-in-out;
        }

        @keyframes high-priority-strobe {
          0% { box-shadow: 0 0 8px var(--glow-color), inset 0 0 4px var(--glow-color); }
          100% { box-shadow: 0 0 14px var(--glow-color), inset 0 0 6px var(--glow-color); }
        }

        .pin-inner-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-color);
          filter: drop-shadow(0 0 4px var(--glow-color));
        }

        .pin-beacon-point {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 9px solid var(--primary-color);
          margin-top: -2px;
          z-index: 4;
          filter: drop-shadow(0 3px 6px var(--glow-color));
        }

        /* Vehicle Pin Specifics */
        .custom-tactical-pin.vehicle-pin {
          width: 34px;
          height: 40px;
        }

        .vehicle-callsign-badge {
          position: absolute;
          top: -12px;
          background: #090f1d;
          color: #38bdf8;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 8px;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 4px;
          border: 1px solid #1e2e4a;
          white-space: nowrap;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.85);
          z-index: 5;
          letter-spacing: 0.04em;
        }

        .vehicle-callsign-badge.fire-callsign {
          background: #200707;
          color: #fef08a;
          border-color: #ef4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
        }

        .subtle-beacon-ring {
          position: absolute;
          top: 0px;
          left: 0px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid var(--primary-color);
          pointer-events: none;
          animation: subtle-beacon-expand var(--pulse-speed, 2.8s) ease-out infinite;
        }

        .pin-head-subtle {
          position: relative;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #0a1120;
          border: 2px solid var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px var(--glow-color);
          z-index: 5;
        }

        /* Specialized Fire Truck Pin Head */
        .custom-tactical-pin.fire-truck-pin {
          width: 44px;
          height: 48px;
        }

        .pin-head-subtle.fire-truck-head {
          width: 40px;
          height: 34px;
          border-radius: 8px;
          background: linear-gradient(180deg, #240a0a 0%, #110404 100%);
          border: 2px solid #ef4444;
          box-shadow: 0 0 14px rgba(239, 68, 68, 0.85), inset 0 0 8px rgba(239, 68, 68, 0.45);
          padding: 1px;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .leaflet-tactical-marker:hover .fire-truck-pin .pin-head-subtle.fire-truck-head,
        .fire-truck-pin:hover .pin-head-subtle.fire-truck-head {
          border-color: #fca5a5;
          box-shadow: 0 0 22px rgba(239, 68, 68, 1), inset 0 0 12px rgba(239, 68, 68, 0.7);
        }

        /* Rooftop Emergency Lightbar Strobe */
        .fire-truck-roof-strobe {
          position: absolute;
          top: -2px;
          display: flex;
          gap: 4px;
          z-index: 6;
        }

        .strobe-led {
          width: 6px;
          height: 3px;
          border-radius: 2px;
        }

        .strobe-led.red-led {
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
          animation: strobe-flash-red 0.55s infinite alternate ease-in-out;
        }

        .strobe-led.amber-led {
          background: #f59e0b;
          box-shadow: 0 0 8px #f59e0b;
          animation: strobe-flash-amber 0.55s infinite alternate-reverse ease-in-out;
        }

        @keyframes strobe-flash-red {
          0%, 25% { opacity: 1; transform: scale(1.25); filter: brightness(1.4); }
          50%, 100% { opacity: 0.15; transform: scale(0.85); filter: brightness(0.7); }
        }

        @keyframes strobe-flash-amber {
          0%, 25% { opacity: 0.15; transform: scale(0.85); filter: brightness(0.7); }
          50%, 100% { opacity: 1; transform: scale(1.25); filter: brightness(1.4); }
        }

        /* ==========================================================================
           TACTICAL INCIDENT HAZARD TARGET MARKERS (ACTIVE EMERGENCY ZONES)
           ========================================================================== */
        .tactical-incident-target {
          position: relative;
          width: 44px;
          height: 52px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          transform-origin: bottom center;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease;
          pointer-events: auto;
          will-change: transform;
        }

        .tactical-incident-target::before {
          content: '';
          position: absolute;
          top: -20px;
          bottom: -20px;
          left: -20px;
          right: -20px;
          z-index: 1;
          pointer-events: auto;
        }

        .leaflet-tactical-marker:hover .tactical-incident-target {
          transform: translateY(-5px) scale(1.12);
          filter: drop-shadow(0 6px 14px var(--glow-color));
          z-index: 9999;
        }

        /* Active Incident Emergency Floating Tag */
        .incident-floating-tag {
          position: absolute;
          top: -14px;
          background: #150606;
          color: #fef08a;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 8px;
          font-weight: 900;
          padding: 1.5px 5px;
          border-radius: 4px;
          border: 1px solid var(--primary-color);
          white-space: nowrap;
          box-shadow: 0 0 10px var(--glow-color), 0 3px 6px rgba(0,0,0,0.9);
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 3px;
          letter-spacing: 0.05em;
        }

        .fire-incident-hazard .incident-floating-tag {
          background: #250606;
          border-color: #ef4444;
          color: #fee2e2;
        }

        .accident-incident-hazard .incident-floating-tag {
          background: #251404;
          border-color: #f59e0b;
          color: #fef3c7;
        }

        .medical-incident-hazard .incident-floating-tag {
          background: #042116;
          border-color: #10b981;
          color: #d1fae5;
        }

        .tag-pulse-dot {
          width: 4.5px;
          height: 4.5px;
          border-radius: 50%;
          background: var(--primary-color);
          box-shadow: 0 0 6px var(--primary-color);
          animation: tag-pulse-anim 0.8s infinite alternate;
        }

        @keyframes tag-pulse-anim {
          0% { opacity: 0.3; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1.3); }
        }

        /* Active Concentric Sonar Shockwaves (Subtle & Non-distracting) */
        .incident-sonar-shockwave {
          position: absolute;
          top: 0px;
          left: 0px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid var(--primary-color);
          box-shadow: 0 0 4px var(--halo-color);
          pointer-events: none;
          opacity: 0;
          animation: incident-shockwave-pulse 3.6s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
        }

        .incident-sonar-shockwave.wave-2 {
          animation-delay: 1.8s;
        }

        @keyframes incident-shockwave-pulse {
          0% { transform: scale(0.85); opacity: 0.4; }
          50% { opacity: 0.18; }
          100% { transform: scale(1.36); opacity: 0; }
        }

        /* Target Crosshair Reticle Brackets [ ⬢ ] */
        .reticle-corner {
          position: absolute;
          width: 7px;
          height: 7px;
          border-color: var(--primary-color);
          z-index: 5;
          pointer-events: none;
          filter: drop-shadow(0 0 4px var(--glow-color));
        }

        .reticle-tl { top: 0px; left: 0px; border-top: 2px solid; border-left: 2px solid; }
        .reticle-tr { top: 0px; right: 0px; border-top: 2px solid; border-right: 2px solid; }
        .reticle-bl { bottom: 8px; left: 0px; border-bottom: 2px solid; border-left: 2px solid; }
        .reticle-br { bottom: 8px; right: 0px; border-bottom: 2px solid; border-right: 2px solid; }

        /* Incident Hazard Target Core */
        .incident-hazard-core {
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: radial-gradient(circle, #240a0a 0%, #0d0303 100%);
          border: 2px solid var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 16px var(--glow-color), inset 0 0 10px var(--glow-color);
          z-index: 4;
        }

        .accident-incident-hazard .incident-hazard-core {
          background: radial-gradient(circle, #281404 0%, #0d0601 100%);
        }

        .medical-incident-hazard .incident-hazard-core {
          background: radial-gradient(circle, #05261b 0%, #02120d 100%);
        }

        /* Ground Target Down-Arrow */
        .incident-target-arrow {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid var(--primary-color);
          margin-top: -1px;
          z-index: 3;
          filter: drop-shadow(0 3px 6px var(--glow-color));
        }

        /* ==========================================================================
           FACILITY FIXED BASE NODES (STABLE INFRASTRUCTURE: HOSPITALS / POLICE / FIRE)
           ========================================================================== */
        .station-facility-node {
          position: relative;
          width: 36px;
          height: 42px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          transform-origin: bottom center;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease;
          pointer-events: auto;
          will-change: transform;
        }

        .station-facility-node::before {
          content: '';
          position: absolute;
          top: -16px;
          bottom: -16px;
          left: -16px;
          right: -16px;
          z-index: 1;
          pointer-events: auto;
        }

        .leaflet-tactical-marker:hover .station-facility-node {
          transform: translateY(-4px) scale(1.1);
          filter: drop-shadow(0 6px 12px var(--glow-color));
          z-index: 9999;
        }

        .facility-station-pill {
          position: absolute;
          top: -11px;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 7.5px;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 3px;
          white-space: nowrap;
          z-index: 6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.85);
          letter-spacing: 0.05em;
        }

        .facility-station-pill.hospital-pill {
          background: #042f2e;
          color: #a7f3d0;
          border: 1px solid #10b981;
        }

        .facility-station-pill.police-pill {
          background: #0f1f38;
          color: #93c5fd;
          border: 1px solid #3b82f6;
        }

        .facility-station-pill.fire-pill {
          background: #2d1306;
          color: #fed7aa;
          border: 1px solid #f97316;
        }

        .facility-building-base {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #0a1120;
          border: 2px solid var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          box-shadow: 0 0 10px var(--glow-color), inset 0 0 4px var(--glow-color);
        }

        .hospital-facility-node .facility-building-base {
          background: #051a1a;
          border-color: #10b981;
        }

        .police-facility-node .facility-building-base {
          background: #081427;
          border-color: #3b82f6;
        }

        .fire-facility-node .facility-building-base {
          background: #1f0d05;
          border-color: #f97316;
        }

        .facility-anchor-base {
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 6px solid var(--primary-color);
          margin-top: -1px;
          z-index: 1;
        }

        /* Subtle beacon pulse for vehicles */
        .subtle-beacon-ring {
          position: absolute;
          top: 1px;
          left: 1px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: transparent;
          border: 1.5px solid var(--primary-color);
          animation: subtle-beacon-expand var(--pulse-speed) cubic-bezier(0.1, 0.4, 0.8, 1) infinite;
          pointer-events: none;
          box-shadow: 0 0 8px var(--glow-color);
        }

        .vehicle-pin .subtle-beacon-ring {
          width: 30px;
          height: 30px;
        }

        .pin-head-subtle {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #09101d;
          border: 2px solid var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-color);
          z-index: 2;
          box-shadow: 0 0 12px var(--glow-color), inset 0 0 6px var(--glow-color);
        }

        .vehicle-pin .pin-head-subtle {
          width: 28px;
          height: 28px;
          border-radius: 9px;
          border: 2px solid var(--primary-color);
          box-shadow: 0 0 10px var(--glow-color), inset 0 0 4px var(--glow-color);
        }

        .hospital-pin .pin-head-subtle,
        .police-station-pin .pin-head-subtle,
        .fire-station-pin .pin-head-subtle {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          border: 2px solid var(--primary-color);
          box-shadow: 0 0 12px var(--glow-color), inset 0 0 5px var(--glow-color);
        }

        .custom-tactical-pin.assigned-active .pin-head-subtle {
          border-width: 2.5px;
          box-shadow: 0 0 16px var(--glow-color), inset 0 0 8px var(--glow-color);
        }

        .pin-inner-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pin-beacon-point {
          width: 0;
          height: 0;
          border-left: 4.5px solid transparent;
          border-right: 4.5px solid transparent;
          border-top: 7px solid var(--primary-color);
          margin-top: -1px;
          z-index: 1;
          filter: drop-shadow(0 2px 4px var(--glow-color));
        }

        .custom-popup .leaflet-popup-content-wrapper {
          background-color: rgba(11, 16, 29, 0.98);
          backdrop-filter: blur(18px);
          color: #f8fafc;
          border-radius: 14px;
          border: 1.5px solid #2d4368;
          box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.9), 0 0 15px rgba(56, 189, 248, 0.15);
          padding: 0;
        }

        .custom-popup .leaflet-popup-content {
          margin: 0;
          line-height: normal;
        }

        .custom-popup .leaflet-popup-tip {
          background-color: rgba(11, 16, 29, 0.98);
          border: 1.5px solid #2d4368;
        }

        .leaflet-control-attribution {
          background-color: rgba(9, 13, 22, 0.85) !important;
          color: #64748b !important;
          font-size: 10px !important;
        }
      `}</style>
    </div>
  );
};
