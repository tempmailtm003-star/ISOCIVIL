import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident } from '../types';
import { calculateDistanceKm, calculateEtaMinutes, getCompassDirection, UNIT_BASE_COORDS } from '../utils/tacticalUtils';
import { generateRoadWaypoints, fetchOSRMRoute } from '../utils/roadRouter';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Gauge, 
  Compass, 
  ShieldAlert, 
  Crosshair, 
  Plus, 
  Minus, 
  Maximize2,
  Flame
} from 'lucide-react';

interface ResponderTacticalMapProps {
  unitId: string;
  unitCoords: { lat: number; lng: number; heading?: number; speed?: number; accuracy?: number };
  incident?: Incident | null;
  status: string;
  fixedRoute?: [number, number][];
  isSimulatingMotion?: boolean;
}

// Auto-fit bounds component ensuring BOTH Unit and Incident are framed simultaneously
const AutoFitBounds: React.FC<{
  unitCoords: [number, number];
  incidentCoords?: [number, number] | null;
  routeCoords?: [number, number][];
}> = ({ unitCoords, incidentCoords, routeCoords }) => {
  const map = useMap();
  const prevIncidentKeyRef = useRef<string | null>(null);

  const fitBothInView = React.useCallback(() => {
    if (!map) return;
    try {
      if (incidentCoords && incidentCoords[0] && incidentCoords[1]) {
        // Build bounding box containing unit, incident, and all road route waypoints
        const bounds = L.latLngBounds([unitCoords, incidentCoords]);
        if (routeCoords && routeCoords.length > 0) {
          routeCoords.forEach(pt => bounds.extend(pt));
        }
        map.fitBounds(bounds, {
          padding: [55, 55],
          maxZoom: 15,
          animate: true,
          duration: 0.6
        });
      } else {
        map.setView(unitCoords, 14, { animate: true, duration: 0.6 });
      }
    } catch (e) {
      // Handled
    }
  }, [map, unitCoords[0], unitCoords[1], incidentCoords?.[0], incidentCoords?.[1], routeCoords?.length]);

  // Trigger framing upon initial mount or when incident changes
  useEffect(() => {
    const incKey = incidentCoords ? `${incidentCoords[0].toFixed(4)},${incidentCoords[1].toFixed(4)}` : 'none';
    if (incKey !== prevIncidentKeyRef.current) {
      prevIncidentKeyRef.current = incKey;
      const t = setTimeout(() => {
        fitBothInView();
      }, 80);
      return () => clearTimeout(t);
    }
  }, [incidentCoords?.[0], incidentCoords?.[1], fitBothInView]);

  return null;
};

// Tactical On-Screen Zoom and View Controllers
const TacticalMapOverlayControls: React.FC<{
  unitCoords: [number, number];
  incidentCoords?: [number, number] | null;
  routeCoords?: [number, number][];
}> = ({ unitCoords, incidentCoords, routeCoords }) => {
  const map = useMap();

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentZoom = map.getZoom();
    map.setZoom(Math.min(19, currentZoom + 0.75), { animate: true, duration: 0.45, easeLinearity: 0.15 });
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentZoom = map.getZoom();
    map.setZoom(Math.max(3, currentZoom - 0.75), { animate: true, duration: 0.45, easeLinearity: 0.15 });
  };

  const handleFitBoth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (incidentCoords && incidentCoords[0] && incidentCoords[1]) {
      const bounds = L.latLngBounds([unitCoords, incidentCoords]);
      if (routeCoords && routeCoords.length > 0) {
        routeCoords.forEach(pt => bounds.extend(pt));
      }
      map.fitBounds(bounds, {
        padding: [55, 55],
        maxZoom: 15,
        animate: true,
        duration: 0.6
      });
    } else {
      map.setView(unitCoords, 15, { animate: true, duration: 0.6 });
    }
  };

  const handleFocusUnit = (e: React.MouseEvent) => {
    e.stopPropagation();
    map.setView(unitCoords, 16, { animate: true, duration: 0.6 });
  };

  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2 pointer-events-auto">
      {/* Zoom In (+) and Zoom Out (-) Buttons */}
      <div className="flex flex-col rounded-xl overflow-hidden bg-[#090e1a]/95 backdrop-blur-md border border-blue-500/50 shadow-[0_4px_24px_rgba(0,0,0,0.8)] divide-y divide-blue-500/30">
        <button
          id="btn-responder-zoom-in"
          type="button"
          onClick={handleZoomIn}
          className="w-9 h-9 flex items-center justify-center text-cyan-300 hover:text-white hover:bg-blue-600/40 active:bg-blue-600/70 transition-all cursor-pointer group"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          <Plus size={18} className="group-hover:scale-115 transition-transform" />
        </button>
        <button
          id="btn-responder-zoom-out"
          type="button"
          onClick={handleZoomOut}
          className="w-9 h-9 flex items-center justify-center text-cyan-300 hover:text-white hover:bg-blue-600/40 active:bg-blue-600/70 transition-all cursor-pointer group"
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          <Minus size={18} className="group-hover:scale-115 transition-transform" />
        </button>
      </div>

      {/* Frame Both Unit & Incident / Recenter Controls */}
      <div className="flex flex-col rounded-xl overflow-hidden bg-[#090e1a]/95 backdrop-blur-md border border-blue-500/50 shadow-[0_4px_24px_rgba(0,0,0,0.8)] divide-y divide-blue-500/30">
        {incidentCoords && (
          <button
            id="btn-responder-fit-both"
            type="button"
            onClick={handleFitBoth}
            className="w-9 h-9 flex items-center justify-center text-emerald-400 hover:text-emerald-200 hover:bg-emerald-600/30 active:bg-emerald-600/50 transition-all cursor-pointer group"
            title="Frame Both Unit & Incident (Full Corridor)"
            aria-label="Frame Both Unit & Incident"
          >
            <Maximize2 size={16} className="group-hover:scale-115 transition-transform" />
          </button>
        )}
        <button
          id="btn-responder-focus-unit"
          type="button"
          onClick={handleFocusUnit}
          className="w-9 h-9 flex items-center justify-center text-blue-400 hover:text-blue-200 hover:bg-blue-600/30 active:bg-blue-600/50 transition-all cursor-pointer group"
          title="Recenter on My Unit"
          aria-label="Recenter on My Unit"
        >
          <Crosshair size={16} className="group-hover:scale-115 transition-transform" />
        </button>
      </div>
    </div>
  );
};

// Custom unit marker icon matching tactical styling
const createUnitMarkerIcon = (unitId: string, heading: number = 0, isEnRoute: boolean = true) => {
  const isFire = unitId.startsWith('FE');
  const isAmbulance = unitId.startsWith('AMB');
  const isPolice = unitId.startsWith('PV') || unitId.startsWith('SWAT') || unitId.startsWith('TP');
  
  const iconEmoji = isFire ? '🚒' : isAmbulance ? '🚑' : isPolice ? '🚔' : '⚡';
  const color = isFire ? '#ef4444' : isAmbulance ? '#10b981' : isPolice ? '#3b82f6' : '#f59e0b';
  const glow = isFire ? 'rgba(239, 68, 68, 0.7)' : isAmbulance ? 'rgba(16, 185, 129, 0.7)' : 'rgba(59, 130, 246, 0.7)';

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      <div style="background: #090e1a; border: 1.5px solid ${color}; color: #ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 8px; white-space: nowrap; margin-bottom: 3px; box-shadow: 0 0 14px ${glow}; letter-spacing: 0.05em;">
        ${unitId}  (YOU)
      </div>
      <div style="width: 42px; height: 42px; background: #0f172a; border: 2.5px solid ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 0 20px ${glow}; position: relative;">
        ${iconEmoji}
        <div style="position: absolute; inset: -4px; border: 2px solid ${color}; border-radius: 50%; opacity: 0.6; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      </div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${color}; margin-top: -1px;"></div>
    </div>
  `;

  return L.divIcon({
    className: 'responder-unit-pin',
    html,
    iconSize: [50, 64],
    iconAnchor: [25, 64],
    popupAnchor: [0, -64]
  });
};

// Custom incident destination marker icon matching screenshot design
const createIncidentMarkerIcon = (incident: Incident) => {
  const isFire = incident.type.toLowerCase().includes('fire');
  const isMedical = incident.type.toLowerCase().includes('accident') || incident.type.toLowerCase().includes('medical');
  
  const iconEmoji = isFire ? '🔥' : isMedical ? '🚨' : '⚠️';
  const color = isFire ? '#dc2626' : isMedical ? '#ea580c' : '#d97706';

  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
      <div style="background: #450a0a; border: 1.5px solid ${color}; color: #fecaca; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 8px; white-space: nowrap; margin-bottom: 3px; box-shadow: 0 0 16px rgba(220, 38, 38, 0.8); letter-spacing: 0.05em;">
        ${incident.id} • ${incident.type.toUpperCase()}
      </div>
      <div style="width: 44px; height: 44px; background: #1c0909; border: 2.5px solid ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 0 24px rgba(220, 38, 38, 0.9); position: relative;">
        ${iconEmoji}
        <div style="position: absolute; inset: -4px; border: 2px solid ${color}; border-radius: 50%; opacity: 0.5; animation: pulse 2s infinite;"></div>
      </div>
      <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 9px solid ${color}; margin-top: -1px;"></div>
    </div>
  `;

  return L.divIcon({
    className: 'responder-incident-pin',
    html,
    iconSize: [60, 68],
    iconAnchor: [30, 68],
    popupAnchor: [0, -68]
  });
};

export const ResponderTacticalMap: React.FC<ResponderTacticalMapProps> = ({
  unitId,
  unitCoords,
  incident,
  status,
  fixedRoute,
  isSimulatingMotion = false
}) => {
  const [routeCoords, setRouteCoords] = React.useState<[number, number][]>(fixedRoute || []);
  const cleanUnitId = (unitId || '').toUpperCase().trim();
  const baseStation = UNIT_BASE_COORDS[cleanUnitId];

  const currentSpeed = isSimulatingMotion ? (unitCoords.speed || 48) : 0;

  const distanceKm = useMemo(() => {
    if (!incident) return null;
    return Number(calculateDistanceKm(unitCoords.lat, unitCoords.lng, incident.lat, incident.lng).toFixed(2));
  }, [unitCoords.lat, unitCoords.lng, incident]);

  const etaMinutes = useMemo(() => {
    if (distanceKm === null) return null;
    const effectiveSpeed = currentSpeed > 0 ? currentSpeed : 45;
    return Math.max(1, calculateEtaMinutes(distanceKm, effectiveSpeed));
  }, [distanceKm, currentSpeed]);

  // Use fixedRoute if provided directly, otherwise compute route ONCE when incident ID changes
  useEffect(() => {
    if (fixedRoute && fixedRoute.length > 0) {
      setRouteCoords(fixedRoute);
      return;
    }

    if (!incident) {
      setRouteCoords([]);
      return;
    }

    let isCancelled = false;
    const initialWaypoints = generateRoadWaypoints(unitCoords.lat, unitCoords.lng, incident.lat, incident.lng);
    setRouteCoords(initialWaypoints);

    fetchOSRMRoute(unitCoords.lat, unitCoords.lng, incident.lat, incident.lng).then(osrmPath => {
      if (!isCancelled && osrmPath && osrmPath.length > 2) {
        setRouteCoords(osrmPath);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [incident?.id, fixedRoute]);

  const unitMarkerIcon = useMemo(() => {
    return createUnitMarkerIcon(unitId, unitCoords.heading, status === 'En Route');
  }, [unitId, unitCoords.heading, status]);

  const incidentMarkerIcon = useMemo(() => {
    return incident ? createIncidentMarkerIcon(incident) : null;
  }, [incident]);

  const center: [number, number] = useMemo(() => {
    if (incident) {
      return [
        (unitCoords.lat + incident.lat) / 2,
        (unitCoords.lng + incident.lng) / 2
      ];
    }
    return [unitCoords.lat, unitCoords.lng];
  }, [unitCoords.lat, unitCoords.lng, incident]);

  const headingDegree = unitCoords.heading ?? 0;
  const compassDir = getCompassDirection(headingDegree);

  return (
    <div className="bg-[#0b101d] border border-blue-500/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col space-y-0">
      {/* Map Header HUD */}
      <div className="bg-[#090e1a] border-b border-[#1a263d] p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            {incident ? <Navigation size={14} className="animate-spin-slow" /> : <Crosshair size={14} className="animate-pulse" />}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>{incident ? 'Tactical Navigation & Corridor Guidance' : 'Tactical Field Map & Area Patrol'}</span>
              <span className={`gps-lock-banner text-[10px] font-mono px-2 py-0.5 rounded border ${
                incident 
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {incident ? 'ACTIVE CORRIDOR' : 'PATROL / GPS LOCK'}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              {incident 
                ? `Direct shortest street corridor to ${incident.location} (${incident.id})`
                : `Active Sector: ${baseStation?.stationName || 'Chennai Metro Zone'} • GPS Lock Active`}
            </p>
          </div>
        </div>

        {/* Live Metrics Pills */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {incident && (
            <>
              <div className="bg-[#111927] border border-[#1e2e4a] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-emerald-400">
                <Clock size={12} />
                <span>ETA: <strong className="text-white">{etaMinutes} min</strong></span>
              </div>
              <div className="bg-[#111927] border border-[#1e2e4a] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-cyan-400">
                <MapPin size={12} />
                <span>DIST: <strong className="text-white">{distanceKm} km</strong></span>
              </div>
            </>
          )}
          {!incident && (
            <>
              <div className="bg-[#111927] border border-[#1e2e4a] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-cyan-400">
                <Compass size={12} />
                <span>{headingDegree}° {compassDir}</span>
              </div>
              <div className="bg-[#111927] border border-[#1e2e4a] px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-emerald-400">
                <Gauge size={12} />
                <span>{currentSpeed} km/h</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="h-80 sm:h-96 md:h-[420px] w-full relative z-0">
        <MapContainer
          center={center}
          zoom={incident ? 13 : 14}
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
          {/* Automatically frame BOTH Unit and Incident in view */}
          <AutoFitBounds
            unitCoords={[unitCoords.lat, unitCoords.lng]}
            incidentCoords={incident ? [incident.lat, incident.lng] : null}
            routeCoords={routeCoords}
          />

          {/* On-Map Tactical Zoom In (+), Zoom Out (-), and Frame Buttons */}
          <TacticalMapOverlayControls
            unitCoords={[unitCoords.lat, unitCoords.lng]}
            incidentCoords={incident ? [incident.lat, incident.lng] : null}
            routeCoords={routeCoords}
          />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="tactical-midnight-tiles"
            maxZoom={19}
          />

          {/* Standby Patrol Radius Ring when undispatched */}
          {!incident && (
            <Circle
              center={[unitCoords.lat, unitCoords.lng]}
              radius={600}
              pathOptions={{
                color: '#38bdf8',
                fillColor: '#0284c7',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '6, 6'
              }}
            />
          )}

          {/* Tactical Route Polyline when dispatched */}
          {incident && routeCoords.length > 0 && (
            <>
              {/* Outer Cyan Glow Corridor */}
              <Polyline
                positions={routeCoords}
                pathOptions={{
                  color: '#06b6d4',
                  weight: 8,
                  opacity: 0.38,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
              {/* Inner High-Contrast Directional Dashed Line */}
              <Polyline
                positions={routeCoords}
                pathOptions={{
                  color: '#38bdf8',
                  weight: 4.5,
                  opacity: 0.95,
                  dashArray: '8, 8',
                  lineCap: 'round'
                }}
              />
            </>
          )}

          {/* Unit Current Position Marker */}
          <Marker position={[unitCoords.lat, unitCoords.lng]} icon={unitMarkerIcon}>
            <Popup>
              <div className="text-xs p-1">
                <p className="font-bold text-slate-900">{unitId} (You)</p>
                <p className="text-slate-600">Status: {status}</p>
                <p className="text-slate-600">Heading: {headingDegree}° {compassDir}</p>
                <p className="text-slate-600">Speed: {currentSpeed} km/h</p>
                {baseStation && <p className="text-slate-500 text-[10px] mt-1">Station: {baseStation.stationName}</p>}
              </div>
            </Popup>
          </Marker>

          {/* Destination Incident Marker when dispatched */}
          {incident && incidentMarkerIcon && (
            <Marker position={[incident.lat, incident.lng]} icon={incidentMarkerIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <p className="font-bold text-red-600">{incident.id} - {incident.type}</p>
                  <p className="text-slate-800 font-semibold">{incident.location}</p>
                  <p className="text-slate-600">{incident.description}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Turn-By-Turn / Routing Footnote Banner */}
      <div className="bg-[#090e1a] border-t border-[#1a263d] p-2.5 px-3.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldAlert size={14} className={incident ? 'text-amber-400' : 'text-emerald-400'} />
          <span>
            {incident ? (
              <>Shortest Corridor: <strong className="text-cyan-300">{baseStation?.stationName || 'Unit Base'} ➔ {incident.location}</strong> • Emergency beacons active</>
            ) : (
              <>Unit Sector Status: <strong className="text-emerald-400">Standby / Available</strong> • Ready for immediate EOC dispatch deployment</>
            )}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
          {incident 
            ? `Destination: ${incident.lat.toFixed(4)}° N, ${incident.lng.toFixed(4)}° E` 
            : `Base GPS: ${unitCoords.lat.toFixed(4)}° N, ${unitCoords.lng.toFixed(4)}° E`}
        </div>
      </div>
    </div>
  );
};
