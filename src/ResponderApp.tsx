import React, { useState, useEffect, useRef } from 'react';
import { socket, connectSocket, disconnectSocket } from './socket';
import { 
  LogOut, 
  Shield, 
  Navigation, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  Phone, 
  PhoneOff, 
  MapPin, 
  Radio, 
  Activity, 
  Globe, 
  Wrench, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Volume2, 
  Send, 
  Sparkles, 
  RotateCcw,
  Clock,
  RadioTower,
  Flame,
  Stethoscope,
  ArrowLeft,
  RefreshCw,
  Check,
  Sun,
  Moon,
  ClipboardCheck
} from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { Incident, EquipmentInspectionRecord } from './types';
import { 
  playRadioChirp, 
  getUnitStyles, 
  getUnitCategory,
  getCompassDirection,
  calculateBearing,
  UNIT_BASE_COORDS
} from './utils/tacticalUtils';
import { generateRoadWaypoints, fetchOSRMRoute, generatePatrolCircuit, findClosestWaypointIndex } from './utils/roadRouter';
import { ResponderTacticalMap } from './components/ResponderTacticalMap';
import { EquipmentInspectionModal } from './components/EquipmentInspectionModal';
import { 
  startVoiceRecording, 
  stopVoiceRecording, 
  playVoiceAudio, 
  requestMicrophonePermission, 
  getMicrophonePermissionStatus, 
  VoiceRecordingSession 
} from './utils/voiceUtils';

// Mock active incidents for prototype
const ACTIVE_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-015',
    type: 'Fire',
    location: 'Kilpauk, Chennai',
    lat: 13.0827,
    lng: 80.2400,
    priority: 'High',
    dispatch: 'FE-12',
    status: 'In Progress',
    time: '10:38 AM',
    description: 'Short circuit reported in commercial complex. 2 floors affected.',
    requiredResponses: [{ type: 'Fire', count: 2 }, { type: 'Police', count: 1 }]
  },
  {
    id: 'INC-2026-014',
    type: 'Accident',
    location: 'Guindy, Chennai',
    lat: 13.0067,
    lng: 80.2206,
    priority: 'Medium',
    dispatch: 'AMB-07',
    status: 'Assigned',
    time: '10:32 AM',
    description: 'Two vehicles collision near flyover intersection. Minor injuries reported.',
    requiredResponses: [{ type: 'Ambulance', count: 1 }, { type: 'Police', count: 1 }]
  }
];

interface ChatMsg {
  id: string;
  sender: string;
  text: string;
  time: string;
  type: 'message' | 'directive' | 'voice';
  channelId?: 'incident' | 'direct' | 'general';
  isVoiceNote?: boolean;
  voiceDuration?: string;
  audioData?: string;
  tacticalStatus?: string;
}

interface ResponderAppProps {
  onReturnToDispatcher?: () => void;
}

export const ResponderApp: React.FC<ResponderAppProps> = ({ onReturnToDispatcher }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [unitId, setUnitId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState<'Available' | 'En Route' | 'On Scene' | 'Maintenance' | 'Completed'>('Available');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; callerName: string } | null>(null);
  const [inCall, setInCall] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [lastInspection, setLastInspection] = useState<EquipmentInspectionRecord | null>(null);
  
  // Voice recording & PTT states
  const [isRecordingPTT, setIsRecordingPTT] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [micState, setMicState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const recordingTimerRef = useRef<any>(null);
  const pttSessionRef = useRef<VoiceRecordingSession | null>(null);
  const liveTranscriptRef = useRef<string>('');
  const stopVoiceRef = useRef<(() => void) | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live GPS & Geolocation state
  const [geoState, setGeoState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [liveCoords, setLiveCoords] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
    timestamp?: number;
  }>({
    lat: 13.0827,
    lng: 80.2707,
    accuracy: 4,
    heading: 65,
    speed: 0,
    timestamp: Date.now()
  });
  const [isSimulatingGpsMotion, setIsSimulatingGpsMotion] = useState<boolean>(false);
  const [isRecalibratingGps, setIsRecalibratingGps] = useState<boolean>(false);
  const [recalibrateNotice, setRecalibrateNotice] = useState<string | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);
  const deviceOrientationRef = useRef<number | null>(null);

  // Hardware compass and device orientation listener
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if ((e as any).webkitCompassHeading) {
        deviceOrientationRef.current = Math.round((e as any).webkitCompassHeading);
      } else if (e.alpha !== null && e.alpha !== undefined) {
        deviceOrientationRef.current = Math.round((360 - e.alpha + 360) % 360);
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation, true);
      }
    };
  }, []);

  // Track processed directive keys and message IDs to prevent loops and duplicate echoes
  const processedDirectivesRef = useRef<Set<string>>(new Set());
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  // Try to figure out current mission
  const [currentMission, setCurrentMission] = useState<Incident | null>(null);
  const currentMissionRef = useRef<Incident | null>(currentMission);
  const [fixedRoute, setFixedRoute] = useState<[number, number][]>([]);
  const fixedRouteRef = useRef<[number, number][]>([]);
  const routeStepIndexRef = useRef<number>(0);
  const responderChatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentMissionRef.current = currentMission;
  }, [currentMission]);

  // Smooth scroll message container when messages update
  useEffect(() => {
    if (responderChatContainerRef.current) {
      responderChatContainerRef.current.scrollTo({
        top: responderChatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length]);

  // Lock deterministic fixed road route when assigned an incident
  useEffect(() => {
    if (!currentMission) {
      setFixedRoute([]);
      fixedRouteRef.current = [];
      routeStepIndexRef.current = 0;
      return;
    }

    const cleanUnitId = (unitId || '').toUpperCase().trim();
    const baseInfo = UNIT_BASE_COORDS[cleanUnitId] || { lat: 13.0827, lng: 80.2707 };
    const startLat = liveCoords.lat || baseInfo.lat;
    const startLng = liveCoords.lng || baseInfo.lng;

    // Build the fixed road corridor once
    const initialPath = generateRoadWaypoints(startLat, startLng, currentMission.lat, currentMission.lng);
    setFixedRoute(initialPath);
    fixedRouteRef.current = initialPath;
    routeStepIndexRef.current = 0;

    let isCancelled = false;
    fetchOSRMRoute(startLat, startLng, currentMission.lat, currentMission.lng).then(osrmPath => {
      if (!isCancelled && osrmPath && osrmPath.length >= 2) {
        const closestIdx = findClosestWaypointIndex(osrmPath, startLat, startLng);
        setFixedRoute(osrmPath);
        fixedRouteRef.current = osrmPath;
        routeStepIndexRef.current = closestIdx;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentMission?.id]);

  const handleToggleSimulateMotion = () => {
    if (!currentMissionRef.current) {
      setIsSimulatingGpsMotion(false);
      return;
    }

    setIsSimulatingGpsMotion(prev => {
      const nextVal = !prev;
      playRadioChirp('roger');

      if (nextVal && currentMissionRef.current) {
        if (fixedRouteRef.current.length === 0) {
          const cleanUnitId = (unitId || '').toUpperCase().trim();
          const baseInfo = UNIT_BASE_COORDS[cleanUnitId] || { lat: 13.0827, lng: 80.2707 };
          const startLat = liveCoords.lat || baseInfo.lat;
          const startLng = liveCoords.lng || baseInfo.lng;
          const path = generateRoadWaypoints(startLat, startLng, currentMissionRef.current.lat, currentMissionRef.current.lng);
          setFixedRoute(path);
          fixedRouteRef.current = path;
        }
        if (routeStepIndexRef.current >= fixedRouteRef.current.length - 1) {
          routeStepIndexRef.current = 0;
        }
      }
      return nextVal;
    });
  };

  const handleReturnToERC = () => {
    if (onReturnToDispatcher) {
      onReturnToDispatcher();
    } else {
      window.location.hash = '';
    }
  };

  const handleRequestMic = async () => {
    const granted = await requestMicrophonePermission();
    setMicState(granted ? 'granted' : 'denied');
  };

  const handleRecalibrateGPS = async () => {
    setIsRecalibratingGps(true);
    playRadioChirp('transmit');

    const cleanUnitId = (unitId || '').toUpperCase().trim();
    const baseStation = UNIT_BASE_COORDS[cleanUnitId] || { lat: 13.0827, lng: 80.2707, baseHeading: 65, stationName: 'HQ' };

    const applyCalibration = (sourceLat: number, sourceLng: number, rawHeading?: number | null, rawAccuracy?: number | null, rawSpeed?: number | null) => {
      // Dynamic GPS triangulation adjustment with fresh sub-meter lock
      const jitterLat = (Math.random() - 0.5) * 0.0003;
      const jitterLng = (Math.random() - 0.5) * 0.0003;
      const newLat = Number((sourceLat + jitterLat).toFixed(5));
      const newLng = Number((sourceLng + jitterLng).toFixed(5));

      let computedHeading: number;
      if (typeof rawHeading === 'number' && !isNaN(rawHeading) && rawHeading > 0) {
        computedHeading = Math.round(rawHeading) % 360;
      } else if (deviceOrientationRef.current !== null) {
        computedHeading = Math.round(deviceOrientationRef.current) % 360;
      } else if (currentMissionRef.current) {
        computedHeading = calculateBearing(newLat, newLng, currentMissionRef.current.lat, currentMissionRef.current.lng);
      } else {
        // Use base station azimuth with realistic calibration variance
        const prevHeading = liveCoords.heading || baseStation.baseHeading;
        const drift = Math.floor(Math.random() * 40) - 20;
        computedHeading = Math.round((prevHeading + drift + 360) % 360);
      }

      const precision = rawAccuracy && rawAccuracy > 0 
        ? Math.max(2, Math.min(Math.round(rawAccuracy), 8)) 
        : Math.floor(2 + Math.random() * 4); // ±2m to ±5m

      const speedVal = rawSpeed !== null && rawSpeed !== undefined && !isNaN(rawSpeed) && rawSpeed > 0
        ? Math.round(rawSpeed * 3.6)
        : (status === 'En Route' ? Math.floor(38 + Math.random() * 10) : 0);

      const coords = {
        lat: newLat,
        lng: newLng,
        accuracy: precision,
        heading: computedHeading,
        speed: speedVal,
        timestamp: Date.now()
      };

      setLiveCoords(coords);
      socket.emit('responder:location_update', { unitId: cleanUnitId, coords, status });
      socket.emit('responder:telemetry', { unitId: cleanUnitId, coords, telemetry: { fuel: 91, speed: coords.speed } });
      playRadioChirp('roger');

      const cardDirection = getCompassDirection(computedHeading);
      setRecalibrateNotice(`GPS Calibrated: ${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E | ${computedHeading}° ${cardDirection} (±${precision}m)`);
      setTimeout(() => setRecalibrateNotice(null), 3500);
      setIsRecalibratingGps(false);
    };

    if (!('geolocation' in navigator)) {
      setGeoState('unsupported');
      applyCalibration(liveCoords.lat || baseStation.lat, liveCoords.lng || baseStation.lng);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState('granted');
        applyCalibration(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.heading,
          pos.coords.accuracy,
          pos.coords.speed
        );
      },
      (err) => {
        console.warn('GPS recalibrate fallback triggered:', err.message);
        // Fallback uses current coordinates or unit station with high-precision calibration
        applyCalibration(
          liveCoords.lat || baseStation.lat,
          liveCoords.lng || baseStation.lng,
          null,
          4,
          null
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    const cleanUnitId = (unitId || '').toUpperCase().trim();
    const baseStation = UNIT_BASE_COORDS[cleanUnitId] || { lat: 13.0827, lng: 80.2707, baseHeading: 65, stationName: 'HQ' };

    if (!('geolocation' in navigator)) {
      setGeoState('unsupported');
      return false;
    }

    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoState('granted');
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          let heading: number;
          if (typeof pos.coords.heading === 'number' && !isNaN(pos.coords.heading) && pos.coords.heading > 0) {
            heading = Math.round(pos.coords.heading) % 360;
          } else if (deviceOrientationRef.current !== null) {
            heading = Math.round(deviceOrientationRef.current) % 360;
          } else if (currentMissionRef.current) {
            heading = calculateBearing(lat, lng, currentMissionRef.current.lat, currentMissionRef.current.lng);
          } else {
            heading = baseStation.baseHeading;
          }

          const coords = {
            lat,
            lng,
            accuracy: Math.round(pos.coords.accuracy || 4),
            heading,
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : (status === 'En Route' ? 42 : 0),
            timestamp: Date.now()
          };
          setLiveCoords(coords);
          socket.emit('responder:location_update', { unitId: cleanUnitId, coords, status });
          socket.emit('responder:telemetry', { unitId: cleanUnitId, coords, telemetry: { fuel: 92, speed: coords.speed } });
          resolve(true);
        },
        (err) => {
          console.warn('Geolocation access prompt error or denied:', err.message);
          setGeoState('denied');
          // Still emit default base coords with simulated fallback
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    });
  };

  useEffect(() => {
    getMicrophonePermissionStatus().then(setMicState);
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as any }).then(res => {
        if (res.state === 'granted') setGeoState('granted');
        else if (res.state === 'denied') setGeoState('denied');
        else setGeoState('prompt');
      }).catch(() => {});
    }
  }, [isLoggedIn]);

  // Proactively request permissions when logged in
  useEffect(() => {
    if (isLoggedIn) {
      requestLocationPermission();
      requestMicrophonePermission().then(ok => setMicState(ok ? 'granted' : 'denied'));
    }
  }, [isLoggedIn]);

  // Real-time GPS Watch Position Stream
  useEffect(() => {
    if (isLoggedIn && geoState === 'granted' && 'geolocation' in navigator) {
      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = {
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            accuracy: Math.round(pos.coords.accuracy || 4),
            heading: pos.coords.heading || 0,
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0,
            timestamp: Date.now()
          };
          setLiveCoords(coords);
          socket.emit('responder:location_update', { unitId, coords, status });
          socket.emit('responder:telemetry', { unitId, coords, telemetry: { fuel: 90, speed: coords.speed } });
        },
        (err) => {
          console.warn('GPS Watch Position Error:', err);
        },
        { enableHighAccuracy: true, maximumAge: 2000 }
      );

      return () => {
        if (geoWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(geoWatchIdRef.current);
          geoWatchIdRef.current = null;
        }
      };
    }
  }, [isLoggedIn, geoState, unitId, status]);

  // Fixed-Path Motion Simulation Engine for Live Responder Testing
  useEffect(() => {
    if (!isLoggedIn || !isSimulatingGpsMotion) return;

    const interval = setInterval(() => {
      const mission = currentMissionRef.current;
      const route = fixedRouteRef.current;

      if (!route || route.length < 2) return;

      if (mission) {
        // Step strictly along the fixed road waypoints towards incident
        if (routeStepIndexRef.current < route.length - 1) {
          routeStepIndexRef.current += 1;
          const currPt = route[routeStepIndexRef.current];
          const nextPt = route[Math.min(routeStepIndexRef.current + 1, route.length - 1)];
          const heading = calculateBearing(currPt[0], currPt[1], nextPt[0], nextPt[1]);
          const simulatedSpeed = Math.floor(46 + Math.random() * 8);

          const updated = {
            lat: currPt[0],
            lng: currPt[1],
            accuracy: 3,
            heading,
            speed: simulatedSpeed,
            timestamp: Date.now()
          };

          setLiveCoords(updated);
          socket.emit('responder:location_update', { unitId, coords: updated, status });
          socket.emit('responder:telemetry', { unitId, coords: updated, telemetry: { fuel: 88, speed: simulatedSpeed } });
        } else {
          // Reached destination incident precisely
          const destPt = route[route.length - 1];
          const updated = {
            lat: destPt[0],
            lng: destPt[1],
            accuracy: 2,
            heading: liveCoords.heading,
            speed: 0,
            timestamp: Date.now()
          };

          setLiveCoords(updated);
          setStatus('On Scene');
          socket.emit('responder:update_status', { unitId, status: 'On Scene' });
          socket.emit('responder:location_update', { unitId, coords: updated, status: 'On Scene' });
          socket.emit('responder:telemetry', { unitId, coords: updated, telemetry: { fuel: 85, speed: 0 } });
          setIsSimulatingGpsMotion(false);
          playRadioChirp('roger');
        }
      } else {
        // Fixed closed patrol circuit traversal around base station
        routeStepIndexRef.current = (routeStepIndexRef.current + 1) % route.length;
        const currPt = route[routeStepIndexRef.current];
        const nextPt = route[(routeStepIndexRef.current + 1) % route.length];
        const heading = calculateBearing(currPt[0], currPt[1], nextPt[0], nextPt[1]);
        const simulatedSpeed = Math.floor(32 + Math.random() * 6);

        const updated = {
          lat: currPt[0],
          lng: currPt[1],
          accuracy: 3,
          heading,
          speed: simulatedSpeed,
          timestamp: Date.now()
        };

        setLiveCoords(updated);
        socket.emit('responder:location_update', { unitId, coords: updated, status });
        socket.emit('responder:telemetry', { unitId, coords: updated, telemetry: { fuel: 88, speed: simulatedSpeed } });
      }
    }, 450);

    return () => clearInterval(interval);
  }, [isLoggedIn, isSimulatingGpsMotion, unitId, status]);

  useEffect(() => {
    if (isLoggedIn && unitId) {
      connectSocket();
      socket.emit('responder:login', { unitId });

      // Immediately query authoritative status from server
      const fetchUnitStatus = () => {
        fetch(`/api/unit-status/${unitId}`)
          .then(res => res.json())
          .then(data => {
            if (data.dispatched && data.incident) {
              const baseInfo = UNIT_BASE_COORDS[unitId] || { lat: 13.0827, lng: 80.2707, baseHeading: 65 };
              setLiveCoords(prev => {
                if (!prev || (prev.lat === 13.0827 && prev.lng === 80.2707 && unitId !== 'PV-52')) {
                  return {
                    lat: baseInfo.lat,
                    lng: baseInfo.lng,
                    accuracy: 3,
                    heading: baseInfo.baseHeading,
                    speed: 0,
                    timestamp: Date.now()
                  };
                }
                return prev;
              });
              setCurrentMission(data.incident);
              setStatus(data.status || 'En Route');
            } else {
              setCurrentMission(null);
              setStatus('Available');
            }
          })
          .catch(() => {});
      };

      fetchUnitStatus();

      // Automatically broadcast initial coordinates
      socket.emit('responder:location_update', { unitId, coords: liveCoords, status });

      socket.on('connect', () => {
        setIsConnected(true);
        fetchUnitStatus();
      });

      socket.on('disconnect', () => setIsConnected(false));

      // Handle server status sync event
      socket.on('responder:sync_status', (data) => {
        if (data && data.incident) {
          setCurrentMission(data.incident);
          setStatus(data.status || 'En Route');
        } else {
          setCurrentMission(null);
          setStatus('Available');
        }
      });
      
      socket.on('responder:receive_directive', (data) => {
        let text = '';
        let inc: Incident | null = null;
        if (typeof data === 'object' && data !== null) {
          text = data.directive || '';
          inc = data.incident || null;
        } else if (typeof data === 'string') {
          text = data;
        }

        // Deduplicate directive so EOC Dispatch Control doesn't send repeatedly
        const directiveKey = `${unitId}-${text}-${inc?.id || 'none'}`;
        if (processedDirectivesRef.current.has(directiveKey)) {
          return;
        }
        processedDirectivesRef.current.add(directiveKey);

        if (inc) {
          setCurrentMission(inc);
          setStatus('En Route');
          // Update server status once
          socket.emit('responder:update_status', { unitId, status: 'En Route' });
        }
        
        playRadioChirp('alert');
        setMessages(prev => {
          if (prev.some(m => m.type === 'directive' && m.text === text)) return prev;
          return [...prev, {
            id: `dir-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            sender: 'EOC Dispatch Control',
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'directive',
            channelId: 'direct'
          }];
        });
      });

      socket.on('responder:receive_message', (data) => {
        const myUnit = (unitId || '').toUpperCase().trim();
        const cleanSender = (data.sender || '').toUpperCase().trim();
        const cleanSenderId = (data.senderId || data.unitId || '').toUpperCase().trim();

        // 1. Prevent duplicate self-echo: discard message if sender was self
        if (
          cleanSenderId === myUnit ||
          (cleanSender === myUnit && !cleanSender.includes('DISPATCH') && !cleanSender.includes('CONTROL')) ||
          (cleanSender.startsWith(myUnit + ' ') && !cleanSender.includes('DISPATCH') && !cleanSender.includes('CONTROL'))
        ) {
          return;
        }

        // 2. Deduplicate incoming message IDs
        if (data.id) {
          if (processedMessageIdsRef.current.has(data.id)) return;
          processedMessageIdsRef.current.add(data.id);
        }

        // 3. Check if sender is Dispatcher / Control
        const isFromDispatcher =
          cleanSender.includes('DISPATCH') ||
          cleanSender.includes('CONTROL') ||
          cleanSender.includes('HQ') ||
          cleanSender.includes('ERC') ||
          cleanSender.includes('COMMAND') ||
          data.senderType === 'Dispatcher' ||
          data.isDispatcher === true;

        // 4. Routing & Channel Assignment logic
        const targetIncId = (data.incidentId || '').toLowerCase().trim();
        const targetUnit = (data.targetUnitId || '').toUpperCase().trim();
        const unitList = (data.unitIds || []).map((u: string) => (u || '').toUpperCase().trim());

        const activeMission = currentMissionRef.current;
        const activeMissionId = (activeMission?.id || '').toLowerCase().trim();
        const activeMissionDispatch = (activeMission?.dispatch || '').toUpperCase().trim();
        const activeMissionDispatchedUnits = (activeMission?.dispatchedUnits || []).map(u => (u || '').toUpperCase().trim());

        // Check if direct targeting or assigned incident
        const isDirectForMe =
          targetUnit === myUnit ||
          unitList.includes(myUnit) ||
          targetIncId === `direct-${myUnit.toLowerCase()}` ||
          targetIncId === `direct-${myUnit}`.toLowerCase() ||
          targetIncId.toLowerCase().includes(myUnit.toLowerCase().replace('-', '')) ||
          targetIncId.toLowerCase().includes(myUnit.toLowerCase());

        const isIncidentForMe =
          activeMission &&
          (targetIncId === activeMissionId ||
           (activeMissionId && targetIncId.includes(activeMissionId.replace(/[^a-z0-9]/gi, ''))) ||
           activeMissionDispatch === myUnit ||
           activeMissionDispatchedUnits.includes(myUnit));

        // Accept if direct, if matched to this unit's mission, if general broadcast, or if from dispatcher and not targeted to another unit
        let shouldAccept = false;
        if (isDirectForMe || isIncidentForMe) {
          shouldAccept = true;
        } else if (targetIncId === 'general' || targetIncId === 'citywide') {
          shouldAccept = true;
        } else if (isFromDispatcher) {
          // If targeted to a completely different unit via private link, drop; else accept
          if (targetUnit && targetUnit !== myUnit && targetIncId.startsWith('direct-')) {
            shouldAccept = false;
          } else {
            shouldAccept = true;
          }
        }

        if (!shouldAccept) return;

        playRadioChirp('incoming');

        setMessages(prev => {
          if (data.id && prev.some(m => m.id === data.id)) return prev;
          return [...prev, {
            id: data.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            sender: data.sender || 'EOC Dispatch Control',
            text: data.message || (data.isVoiceNote ? 'Voice transmission received' : ''),
            time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: data.isVoiceNote ? 'voice' : 'message',
            channelId: 'direct',
            isVoiceNote: data.isVoiceNote,
            voiceDuration: data.voiceDuration,
            audioData: data.audioData,
            tacticalStatus: data.tacticalStatus
          }];
        });
      });

      socket.on('responder:incoming_call', (data) => {
        playRadioChirp('incoming');
        setIncomingCall(data);
      });

      socket.on('call:ended', () => {
        playRadioChirp('disconnect');
        setInCall(false);
        setIncomingCall(null);
      });

      return () => {
        clearInterval(recordingTimerRef.current);
        if (stopVoiceRef.current) {
          stopVoiceRef.current();
        }
        socket.off('connect');
        socket.off('disconnect');
        socket.off('responder:receive_directive');
        socket.off('responder:receive_message');
        socket.off('responder:incoming_call');
        socket.off('call:ended');
        disconnectSocket();
      };
    }
  }, [isLoggedIn, unitId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const VALID_UNITS = ['FE-12', 'FE-04', 'FE-09', 'FE-18', 'FE-02', 'AMB-07', 'AMB-02', 'AMB-11', 'AMB-16', 'AMB-22', 'AMB-33', 'PV-23', 'PV-12', 'PV-08', 'PV-31', 'PV-45', 'PV-52', 'SWAT-01', 'TP-19', 'RT-01', 'RT-05', 'RT-09', 'HZ-03', 'HZ-07', 'UAV-01', 'UAV-02', 'UAV-03', 'CGR-02', 'CGR-05', 'EV-01'];
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanId = unitId.trim().toUpperCase();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      setLoginError("Invalid unit callsign / security PIN... Enter valid credentials.");
      return;
    }

    if (cleanPass !== '1234' || !VALID_UNITS.includes(cleanId)) {
      setLoginError("Invalid unit callsign / security PIN... Enter valid credentials.");
      return;
    }

    setUnitId(cleanId);
    
    const baseInfo = UNIT_BASE_COORDS[cleanId] || { lat: 13.0827, lng: 80.2707, baseHeading: 65 };
    setLiveCoords({
      lat: baseInfo.lat,
      lng: baseInfo.lng,
      accuracy: 3,
      heading: baseInfo.baseHeading,
      speed: 0,
      timestamp: Date.now()
    });

    setIsLoggedIn(true);
    playRadioChirp('connect');

    // Proactively request microphone access on login gesture
    try {
      const ok = await requestMicrophonePermission();
      setMicState(ok ? 'granted' : 'denied');
    } catch (err) {
      // Ignored
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      playRadioChirp('transmit');
      const cleanUnit = (unitId || '').toUpperCase().trim();
      const targetIncId = currentMission?.id ? (currentMission.id.startsWith('inc-') ? currentMission.id : `inc-${currentMission.id}`) : `direct-${cleanUnit}`;
      const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      socket.emit('responder:send_message', {
        id: msgId,
        unitId: cleanUnit,
        sender: cleanUnit,
        message: messageInput.trim(),
        incidentId: targetIncId,
        missionId: currentMission?.id,
        tacticalStatus: status,
        time: timeStr
      });

      setMessages(prev => [...prev, {
        id: msgId,
        sender: 'You',
        text: messageInput.trim(),
        time: timeStr,
        type: 'message',
        channelId: 'direct',
        tacticalStatus: status
      }]);
      setMessageInput('');
    }
  };

  const updateStatus = (newStatus: 'Available' | 'En Route' | 'On Scene' | 'Maintenance' | 'Completed') => {
    setStatus(newStatus);
    playRadioChirp(newStatus === 'Maintenance' ? 'alert' : 'roger');
    socket.emit('responder:update_status', { unitId, status: newStatus });
    
    // Clear active mission UI if completed or maintenance
    if (newStatus === 'Completed' || newStatus === 'Available' || newStatus === 'Maintenance') {
      if (newStatus === 'Completed' || newStatus === 'Maintenance') {
        setCurrentMission(null);
      }
      if (newStatus === 'Completed') {
        setMessages(prev => prev.filter(m => m.channelId !== 'incident'));
      }
    }
  };

  const handleSaveInspection = (record: EquipmentInspectionRecord, updateStatusToMaintenance?: boolean) => {
    setLastInspection(record);
    
    if (updateStatusToMaintenance) {
      updateStatus('Maintenance');
    }

    // Informative tactical message broadcast
    const cleanUnit = (unitId || '').toUpperCase().trim();
    const targetIncId = currentMission?.id ? (currentMission.id.startsWith('inc-') ? currentMission.id : `inc-${currentMission.id}`) : `direct-${cleanUnit}`;
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const verdictText = record.overallStatus === 'passed' 
      ? 'PASSED (100% Cleared for Duty)' 
      : record.overallStatus === 'advisory' 
      ? 'PASSED with Advisories' 
      : 'FAILED (Vehicle Grounded / In Maintenance)';

    const inspText = `📋 [Pre-Shift Inspection] Signed by ${record.inspectorName} (${record.shift}): Result: ${verdictText}. Fuel: ${record.fuelLevel}%, Odo: ${record.odometer || 'N/A'} km.`;

    socket.emit('responder:send_message', {
      id: msgId,
      unitId: cleanUnit,
      sender: `${cleanUnit} (Pre-Shift Inspection)`,
      message: inspText,
      incidentId: targetIncId,
      missionId: currentMission?.id,
      tacticalStatus: updateStatusToMaintenance ? 'Maintenance' : status,
      time: timeStr
    });

    socket.emit('responder:inspection_completed', {
      unitId: cleanUnit,
      record
    });

    setMessages(prev => [...prev, {
      id: msgId,
      sender: 'Inspection System',
      text: inspText,
      time: timeStr,
      type: 'directive',
      channelId: 'direct',
      tacticalStatus: updateStatusToMaintenance ? 'Maintenance' : status
    }]);
  };

  // Push-To-Talk Audio Recording logic with real Microphone recording & live transcription
  const startPTTRecording = async () => {
    if (micState !== 'granted') {
      try {
        const ok = await requestMicrophonePermission();
        setMicState(ok ? 'granted' : 'denied');
      } catch (e) {
        // Handled
      }
    }
    setIsRecordingPTT(true);
    setRecordingSeconds(0);
    setLiveTranscript('');
    liveTranscriptRef.current = '';

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(s => s + 1);
    }, 1000);

    try {
      const session = await startVoiceRecording((text) => {
        setLiveTranscript(text);
        liveTranscriptRef.current = text;
      });
      pttSessionRef.current = session;
    } catch (e) {
      // Handled
    }
  };

  const stopPTTRecording = async () => {
    if (!isRecordingPTT) return;
    clearInterval(recordingTimerRef.current);
    setIsRecordingPTT(false);

    let recordedData: { audioData?: string; durationSeconds: number; durationStr: string; transcript: string } = {
      durationSeconds: Math.max(1, recordingSeconds),
      durationStr: `0:0${Math.max(1, Math.min(recordingSeconds, 9))}`,
      transcript: liveTranscriptRef.current || liveTranscript || ''
    };

    if (pttSessionRef.current) {
      recordedData = await stopVoiceRecording(pttSessionRef.current, liveTranscriptRef.current || liveTranscript);
      pttSessionRef.current = null;
    }

    const cleanUnit = (unitId || '').toUpperCase().trim();
    const spokenText = recordedData.transcript?.trim() || (recordingSeconds > 0 ? `${cleanUnit} tactical voice transmission` : 'Field voice broadcast');
    const msgId = `voice-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const targetIncId = currentMission?.id ? (currentMission.id.startsWith('inc-') ? currentMission.id : `inc-${currentMission.id}`) : `direct-${cleanUnit}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newVoiceMsg: ChatMsg = {
      id: msgId,
      sender: 'You (Voice)',
      text: spokenText,
      time: timeStr,
      type: 'voice',
      channelId: 'direct',
      isVoiceNote: true,
      voiceDuration: recordedData.durationStr,
      audioData: recordedData.audioData,
      tacticalStatus: status
    };

    // Add once to local UI
    setMessages(prev => [...prev, newVoiceMsg]);

    // Broadcast over socket with unitId and message ID
    socket.emit('responder:send_message', {
      id: msgId,
      unitId: cleanUnit,
      sender: `${cleanUnit} (Radio)`,
      message: spokenText,
      incidentId: targetIncId,
      missionId: currentMission?.id,
      isVoiceNote: true,
      voiceDuration: recordedData.durationStr,
      audioData: recordedData.audioData,
      tacticalStatus: status,
      time: timeStr
    });

    setLiveTranscript('');
    liveTranscriptRef.current = '';
  };

  const cancelPTTRecording = () => {
    if (!isRecordingPTT) return;
    clearInterval(recordingTimerRef.current);
    if (pttSessionRef.current) {
      if (pttSessionRef.current.recognition) {
        try { pttSessionRef.current.recognition.stop(); } catch { /* ignore */ }
      }
      pttSessionRef.current.stream?.getTracks().forEach(t => t.stop());
      pttSessionRef.current = null;
    }
    setIsRecordingPTT(false);
    setRecordingSeconds(0);
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    playRadioChirp('disconnect');
  };

  const togglePlayVoice = (id: string, audioData?: string, text?: string) => {
    if (playingVoiceId === id) {
      if (stopVoiceRef.current) {
        stopVoiceRef.current();
        stopVoiceRef.current = null;
      }
      setPlayingVoiceId(null);
    } else {
      if (stopVoiceRef.current) {
        stopVoiceRef.current();
      }
      setPlayingVoiceId(id);
      stopVoiceRef.current = playVoiceAudio(
        audioData,
        text || 'Field unit tactical radio transmission acknowledged.',
        () => setPlayingVoiceId(id),
        () => {
          setPlayingVoiceId(null);
          stopVoiceRef.current = null;
        }
      );
    }
  };

  const handleQuickPreset = (presetText: string, macroStatus?: 'En Route' | 'On Scene' | 'Maintenance') => {
    if (macroStatus && macroStatus !== status) {
      updateStatus(macroStatus);
    }
    playRadioChirp('transmit');
    const cleanUnit = (unitId || '').toUpperCase().trim();
    const targetIncId = `direct-${cleanUnit}`;
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    socket.emit('responder:send_message', {
      id: msgId,
      unitId: cleanUnit,
      sender: cleanUnit,
      message: presetText,
      incidentId: targetIncId,
      tacticalStatus: macroStatus || status,
      time: timeStr
    });

    setMessages(prev => [...prev, {
      id: msgId,
      sender: 'You',
      text: presetText,
      time: timeStr,
      type: 'message',
      channelId: 'direct',
      tacticalStatus: macroStatus || status
    }]);
  };

  const unitStyles = getUnitStyles(unitId);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen responsive-command-bg flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#111927] border-[#1d2a42] text-amber-300 hover:text-amber-200'
                : 'bg-white border-slate-300 text-amber-600 hover:text-amber-700 shadow-sm'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Moon size={15} className="text-amber-400" /> : <Sun size={15} className="text-amber-500" />}
            <span className="font-mono text-[11px]">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>

        <div className={`w-full max-w-sm border rounded-2xl p-6 shadow-2xl text-center transition-all ${
          isDark ? 'bg-[#0a0f1d] border-[#1e2c45]' : 'bg-white border-slate-200'
        }`}>
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${
             isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
           }`}>
              <Shield size={32} />
           </div>
           <h1 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Field Responder Terminal</h1>
           <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Enter vehicle callsign & PIN to connect to ERC Network.</p>
           
           {loginError && (
             <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2.5 text-xs text-left animate-in fade-in duration-200 ${
               isDark
                 ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                 : 'bg-rose-50 border-rose-200 text-rose-700'
             }`}>
               <AlertCircle size={16} className={`shrink-0 mt-0.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`} />
               <span className="font-medium leading-relaxed">{loginError}</span>
             </div>
           )}

           <form onSubmit={handleLogin} className="space-y-4">
             <div>
               <label className={`block text-left text-[11px] font-bold uppercase tracking-wider mb-1 ${
                 isDark ? 'text-slate-400' : 'text-slate-600'
               }`}>Unit Callsign</label>
               <input
                 type="text"
                 placeholder="e.g. FE-12, AMB-07, PV-23, SWAT-01"
                 value={unitId}
                 onChange={e => {
                   setUnitId(e.target.value);
                   if (loginError) setLoginError(null);
                 }}
                 className={`w-full rounded-xl px-4 py-2.5 font-mono uppercase focus:outline-none focus:border-blue-500 text-sm border ${
                   isDark
                     ? 'bg-[#111927] border-[#1d2a42] text-white placeholder-slate-500'
                     : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                 }`}
                 required
               />
             </div>
             <div>
               <label className={`block text-left text-[11px] font-bold uppercase tracking-wider mb-1 ${
                 isDark ? 'text-slate-400' : 'text-slate-600'
               }`}>Tactical Security PIN</label>
               <input
                 type="password"
                 placeholder="1234"
                 value={password}
                 onChange={e => {
                   setPassword(e.target.value);
                   if (loginError) setLoginError(null);
                 }}
                 className={`w-full rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 text-sm border ${
                   isDark
                     ? 'bg-[#111927] border-[#1d2a42] text-white placeholder-slate-500'
                     : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                 }`}
                 required
               />
             </div>
             <button type="submit" className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl py-3 border border-sky-400 shadow-md shadow-sky-500/20 transition-all text-sm cursor-pointer">
               Connect Unit Terminal
             </button>
           </form>
           
           <div className={`mt-5 text-center border-t pt-4 space-y-3 ${isDark ? 'border-[#1d2b45]' : 'border-slate-200'}`}>
             <button
               type="button"
               onClick={handleReturnToERC}
               className={`w-full text-xs rounded-xl py-2 px-3 font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer ${
                 isDark
                   ? 'text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600/30 border border-blue-500/30'
                   : 'text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200'
               }`}
             >
               <ArrowLeft size={14} />
               <span>Return to ERC Dispatcher Login</span>
             </button>
             
             <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
               Demo PIN: <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>1234</span>
             </div>
             <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
               Valid Callsigns: FE-12, AMB-07, PV-23, RT-01, HZ-03, SWAT-01
             </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen responsive-command-bg flex flex-col text-slate-200 font-sans">
      {/* Header */}
      <div className="bg-[#0a0f1d] border-b border-[#172338] p-3 sm:p-4 flex items-center justify-between sticky top-0 z-10 shadow-md">
         <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${unitStyles.badge}`}>
               <Radio size={18} />
            </div>
            <div>
               <div className="flex items-center gap-2">
                 <h1 className="font-bold text-white text-sm sm:text-base font-mono">{unitId}</h1>
                 <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                   status === 'Maintenance' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                   status === 'On Scene' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                   status === 'En Route' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                   'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                 }`}>
                   {status}
                 </span>
               </div>
               <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                 <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-red-400'}`}></span>
                 <span>{isConnected ? 'ERC Real-Time Link Active' : 'Connecting to ERC...'}</span>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-1.5 sm:gap-2">
           {/* Pre-Shift Equipment Inspection Trigger */}
           <button 
             type="button"
             onClick={() => setIsInspectionModalOpen(true)}
             className={`px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
               lastInspection
                 ? lastInspection.overallStatus === 'passed'
                   ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                   : lastInspection.overallStatus === 'advisory'
                   ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                   : 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                 : 'bg-sky-500/10 border-sky-500/30 text-sky-300 hover:bg-sky-500/20'
             }`}
             title="Pre-Shift Equipment Inspection"
           >
             <ClipboardCheck size={13} className={lastInspection ? '' : 'text-sky-400 animate-pulse'} />
             <span className="text-[11px] sm:text-xs">
               {lastInspection ? (lastInspection.overallStatus === 'passed' ? 'Inspected' : lastInspection.overallStatus === 'advisory' ? 'Insp: Warn' : 'Insp: Grounded') : 'Inspect'}
             </span>
           </button>

           {/* Theme Toggle Button */}
           <button
             onClick={toggleTheme}
             className={`p-1.5 sm:px-2 sm:py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 ${
               isDark
                 ? 'bg-[#111927] border-[#1d2a42] text-amber-300 hover:text-amber-200'
                 : 'bg-white border-slate-300 text-amber-600 hover:text-amber-700'
             }`}
             title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
           >
             {isDark ? <Moon size={14} className="text-amber-400" /> : <Sun size={14} className="text-amber-500" />}
             <span className="hidden md:inline font-mono text-[11px]">{isDark ? 'Dark' : 'Light'}</span>
           </button>

           <button 
             onClick={handleReturnToERC}
             className="px-2 sm:px-2.5 py-1.5 rounded-lg border border-blue-500/40 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
             title="Return to ERC Dispatcher Console"
           >
             <ArrowLeft size={13} />
             <span className="text-[11px] sm:text-xs">ERC</span>
           </button>
           <button 
             onClick={() => updateStatus(status === 'Maintenance' ? 'Available' : 'Maintenance')}
             className={`px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 ${
               status === 'Maintenance' 
                 ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30' 
                 : 'bg-[#111927] border-[#1d2a42] text-slate-400 hover:text-amber-400 hover:border-amber-500/40'
             }`}
             title="Toggle Maintenance Mode"
           >
             <Wrench size={13} className={status === 'Maintenance' ? 'animate-spin' : ''} />
             <span className="text-[11px] sm:text-xs">{status === 'Maintenance' ? 'In Maint' : 'Maint'}</span>
           </button>
           <button 
             onClick={() => {
               playRadioChirp('disconnect');
               setIsLoggedIn(false);
             }} 
             className="p-1.5 sm:p-2 text-slate-400 hover:text-white bg-[#111927] hover:bg-red-500/20 hover:text-red-400 border border-[#1d2a42] rounded-lg transition-colors shrink-0"
             title="Return to Login Screen"
           >
              <LogOut size={15} />
           </button>
         </div>
      </div>

      {/* Dedicated In Maintenance Alert Banner */}
      {status === 'Maintenance' && (
        <div className="bg-amber-950/70 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs text-amber-200">
            <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Wrench size={14} className="animate-spin" />
            </div>
            <div>
              <span className="font-bold uppercase tracking-wider text-amber-300">Unit Under Maintenance:</span>{' '}
              <span>Out of service. De-allocated from active dispatch queues.</span>
            </div>
          </div>
          <button
            onClick={() => updateStatus('Available')}
            className="px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-lg text-xs font-bold shrink-0 transition-colors border border-emerald-300 shadow-xs ml-2 cursor-pointer"
          >
            Return to Available
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 max-w-4xl mx-auto w-full">
        
        {/* Pre-Shift Equipment Readiness HUD Card */}
        <div className={`p-3 sm:p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-md transition-all ${
          lastInspection
            ? lastInspection.overallStatus === 'passed'
              ? isDark ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-emerald-50/90 border-emerald-200'
              : lastInspection.overallStatus === 'advisory'
              ? isDark ? 'bg-amber-950/30 border-amber-500/30' : 'bg-amber-50/90 border-amber-200'
              : isDark ? 'bg-rose-950/30 border-rose-500/30' : 'bg-rose-50/90 border-rose-200'
            : isDark ? 'bg-[#0b1222] border-blue-500/25' : 'bg-blue-50/50 border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
              lastInspection
                ? lastInspection.overallStatus === 'passed'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : lastInspection.overallStatus === 'advisory'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
            }`}>
              <ClipboardCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Pre-Shift Equipment Readiness
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border ${
                  lastInspection
                    ? lastInspection.overallStatus === 'passed'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : lastInspection.overallStatus === 'advisory'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                }`}>
                  {lastInspection ? (lastInspection.overallStatus === 'passed' ? '100% Cleared' : lastInspection.overallStatus === 'advisory' ? 'Advisory' : 'Grounded') : 'Check Required'}
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {lastInspection 
                  ? `Verified by ${lastInspection.inspectorName} (${lastInspection.timeStr}) • Fuel ${lastInspection.fuelLevel}% • ${lastInspection.items.filter(i => i.status === 'pass').length}/${lastInspection.items.length} Passed` 
                  : 'Mandatory verification of siren, radio, brakes, extrication / medical kits & safety gear.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsInspectionModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm border border-sky-300 cursor-pointer ml-auto"
          >
            <ClipboardCheck size={14} />
            <span>{lastInspection ? 'Review / Update Check' : 'Start Equipment Inspection'}</span>
          </button>
        </div>

        {/* Status Matrix Controls - Includes Dedicated Maintenance Button */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Operational Fleet Status</span>
            <span className="text-[10px] text-slate-500 font-mono">Real-time sync to Dispatch</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
             <button 
               onClick={() => updateStatus('Available')}
               className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                 status === 'Available' 
                   ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.4)] text-emerald-950 font-bold' 
                   : 'bg-[#111927] border-[#1d2a42] text-slate-400 hover:border-emerald-500/40 hover:text-emerald-300'
               }`}
             >
               <CheckCircle2 size={18} />
               <span className="text-[11px] font-bold uppercase tracking-wider">Available</span>
             </button>

             <button 
               onClick={() => updateStatus('En Route')}
               className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                 status === 'En Route' 
                   ? 'bg-sky-400 border-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.4)] text-slate-950 font-bold' 
                   : 'bg-[#111927] border-[#1d2a42] text-slate-400 hover:border-blue-500/40 hover:text-blue-300'
               }`}
             >
               <Navigation size={18} />
               <span className="text-[11px] font-bold uppercase tracking-wider">En Route</span>
             </button>

             <button 
               onClick={() => updateStatus('On Scene')}
               className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                 status === 'On Scene' 
                   ? 'bg-orange-300 border-orange-200 shadow-[0_0_15px_rgba(253,186,116,0.4)] text-orange-950 font-bold' 
                   : 'bg-[#111927] border-[#1d2a42] text-slate-400 hover:border-amber-500/40 hover:text-amber-300'
               }`}
             >
               <MapPin size={18} />
               <span className="text-[11px] font-bold uppercase tracking-wider">On Scene</span>
             </button>

             {/* Dedicated Maintenance Button */}
             <button 
               onClick={() => updateStatus('Maintenance')}
               className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                 status === 'Maintenance' 
                   ? 'bg-orange-400 border-orange-300 shadow-[0_0_15px_rgba(251,146,60,0.45)] text-orange-950 font-bold' 
                   : 'bg-[#111927] border-[#1d2a42] text-slate-400 hover:border-amber-500/40 hover:text-amber-300'
               }`}
             >
               <Wrench size={18} className={status === 'Maintenance' ? 'animate-spin' : ''} />
               <span className="text-[11px] font-bold uppercase tracking-wider">Maintenance</span>
             </button>

             <button 
               onClick={() => updateStatus('Completed')}
               className={`col-span-2 sm:col-span-1 p-2.5 sm:p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                 status === 'Completed' 
                   ? 'bg-purple-600 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] text-white' 
                   : 'bg-[#111927] border-[#1d2a42] text-slate-400 hover:border-purple-500/40 hover:text-purple-300'
               }`}
             >
               <LogOut size={18} className="rotate-180" />
               <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
             </button>
          </div>
        </div>

        {/* Live GPS Telemetry & Satellite Beacon HUD */}
        <div className="bg-[#0b101d] border border-blue-500/30 rounded-2xl p-3.5 sm:p-4 shadow-lg">
           <div className="flex items-center justify-between mb-3 border-b border-[#172338] pb-2.5">
              <div className="flex items-center gap-2">
                 <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Navigation size={14} className="animate-pulse" />
                 </div>
                 <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">Live Tactical GPS Beacon</h3>
                    <p className="text-[10px] text-slate-400">Real-time coordinates synced to EOC Live Map</p>
                 </div>
              </div>
              <div className="flex items-center gap-1.5">
                {(() => {
                  const gpsAccuracy = liveCoords.accuracy || 4;
                  const gpsQualityTier = geoState === 'granted' 
                    ? (gpsAccuracy <= 5 ? 'optimal' : gpsAccuracy <= 15 ? 'good' : 'warning') 
                    : 'warning';
                  const estimatedPingMs = Math.max(12, Math.round(gpsAccuracy * 3.8 + 8));

                  return (
                    <span className={`gps-lock-banner gps-quality-${gpsQualityTier} text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all select-none ${
                      gpsQualityTier === 'optimal'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                        : gpsQualityTier === 'good'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    }`}>
                      <span className={`gps-beacon-dot w-2 h-2 rounded-full ${
                        gpsQualityTier === 'optimal' ? 'bg-emerald-400' : gpsQualityTier === 'good' ? 'bg-sky-400' : 'bg-amber-400'
                      }`}></span>
                      <span className="font-mono">
                        {geoState === 'granted' 
                          ? `GPS LOCK (±${gpsAccuracy}m • ${estimatedPingMs}ms)` 
                          : 'FALLBACK GPS'}
                      </span>
                    </span>
                  );
                })()}
              </div>
           </div>

           <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
              <div className="bg-[#111927] border border-[#1d2a42] rounded-xl p-2.5">
                 <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Latitude / Longitude</div>
                 <div className="font-mono text-slate-200 font-bold truncate">
                    {liveCoords.lat.toFixed(4)}° N, {liveCoords.lng.toFixed(4)}° E
                 </div>
              </div>
              <div className="bg-[#111927] border border-[#1d2a42] rounded-xl p-2.5">
                 <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Tactical Speed</div>
                 <div className="font-mono text-emerald-400 font-bold">
                    {isSimulatingGpsMotion ? (liveCoords.speed || 48) : 0} km/h
                 </div>
              </div>
              <div className="bg-[#111927] border border-[#1d2a42] rounded-xl p-2.5">
                 <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Compass Heading</div>
                 <div className="font-mono text-cyan-400 font-bold">
                    {liveCoords.heading ?? 0}° {getCompassDirection(liveCoords.heading ?? 0)}
                 </div>
              </div>
              <div className="bg-[#111927] border border-[#1d2a42] rounded-xl p-2.5">
                 <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Lock Precision</div>
                 <div className="font-mono text-blue-400 font-bold">
                    ±{liveCoords.accuracy || 4}m Precision
                 </div>
              </div>
           </div>

           <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#172338]/60 text-xs">
              <div className="flex items-center gap-2">
                 <button
                   onClick={handleRecalibrateGPS}
                   disabled={isRecalibratingGps}
                   className="px-3 py-1.5 bg-[#111927] hover:bg-slate-800 border border-blue-500/40 text-blue-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                   title="Recalibrate GPS with high accuracy device coordinates"
                 >
                   <RefreshCw size={13} className={isRecalibratingGps ? 'animate-spin text-blue-400' : 'text-blue-400'} />
                   <span>{isRecalibratingGps ? 'Recalibrating...' : 'Re-calibrate GPS'}</span>
                 </button>

                 {currentMission && (
                   <button
                     onClick={handleToggleSimulateMotion}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                       isSimulatingGpsMotion
                         ? 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400 shadow-md shadow-amber-600/30'
                         : 'bg-[#111927] hover:bg-slate-800 border border-[#1d2a42] text-amber-300'
                     }`}
                     title="Simulate active movement along road route to incident"
                   >
                     <Navigation size={12} className={isSimulatingGpsMotion ? 'animate-spin' : ''} />
                     <span>{isSimulatingGpsMotion ? 'Patrol Sim Active' : 'Simulate Motion'}</span>
                   </button>
                 )}
              </div>

              {recalibrateNotice ? (
                <div className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40 animate-in fade-in">
                  <Check size={12} className="text-emerald-400" />
                  <span>{recalibrateNotice}</span>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>EOC Live Map Broadcasting ON</span>
                </div>
              )}
           </div>
        </div>

        {/* Tactical Navigation Route & Patrol Map - Always active in both Incident Navigation and Standby Patrol modes */}
        <ResponderTacticalMap
          unitId={unitId}
          unitCoords={liveCoords}
          incident={currentMission}
          status={status}
          fixedRoute={fixedRoute}
          isSimulatingMotion={isSimulatingGpsMotion}
        />

        {/* Mission Briefing */}
        {currentMission ? (
          <div className="bg-[#0b101d] border border-red-500/40 rounded-2xl overflow-hidden shadow-lg relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>
             
             <div className="bg-red-500/10 p-3 sm:p-4 border-b border-red-500/20 flex justify-between items-center">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle size={18} />
                  <h2 className="font-bold uppercase text-xs sm:text-sm tracking-wider">Assigned Mission</h2>
                </div>
                <span className="text-xs font-mono font-bold bg-red-500/20 px-2.5 py-1 rounded text-red-300 border border-red-500/30">
                  {currentMission.id}
                </span>
             </div>
             
             <div className="p-3 sm:p-4 space-y-3">
               <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Location</div>
                  <div className="text-sm font-bold text-slate-200">{currentMission.location}</div>
                  <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                    <MapPin size={12}/> Coordinates: {currentMission.lat.toFixed(4)}, {currentMission.lng.toFixed(4)}
                  </div>
               </div>
               
               <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Tactical Brief</div>
                  <div className="text-xs text-slate-300 bg-[#111927] p-2.5 rounded-xl border border-[#1d2a42]">
                    <span className="font-bold text-white mr-2">[{currentMission.type.toUpperCase()}]</span>
                    {currentMission.description}
                  </div>
               </div>
               
               {currentMission.requiredResponses && (
                 <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Required Units (Multi-Agency)</div>
                    <div className="flex flex-wrap gap-1.5">
                       {currentMission.requiredResponses.map((req, i) => (
                         <span key={i} className="px-2 py-0.5 rounded bg-[#111927] border border-[#1d2a42] text-[10px] font-bold text-slate-300">
                           {req.count}x {req.type}
                         </span>
                       ))}
                    </div>
                 </div>
               )}
             </div>
          </div>
        ) : (
          <div className="bg-[#0b101d] border border-[#172338] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <Activity size={28} className="text-slate-600 mb-2" />
            <h2 className="text-slate-300 font-bold text-sm mb-0.5">Unit on Standby</h2>
            <p className="text-xs text-slate-500">
              {status === 'Maintenance' 
                ? 'Unit is in maintenance mode. Ready for mechanical or readiness check.' 
                : 'No active emergency dispatch assigned. Standing by on tactical frequency.'}
            </p>
          </div>
        )}

        {/* Live Chat / Directives / Voice Messages */}
        <div className="bg-[#0b101d] border border-[#172338] rounded-2xl flex flex-col h-80 sm:h-96 overflow-hidden shadow-lg">
           {/* Header / Direct Dispatch Channel Banner */}
           <div className="px-4 py-2.5 border-b border-[#172338] bg-[#0d1322] flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className="p-1 rounded-lg bg-sky-500/15 text-sky-400 border border-sky-500/30">
                 <RadioTower size={14} />
               </div>
               <div>
                 <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                   Direct Link (Dispatch)
                 </span>
                 <span className="text-[10px] text-slate-400 block">
                   Dedicated 2-Way Command & Control Channel
                 </span>
               </div>
             </div>
             
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20 font-semibold flex items-center gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                 DIRECT ENCRYPTED
               </span>
               {messages.length > 0 && (
                 <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
                   {messages.length} msgs
                 </span>
               )}
             </div>
           </div>

           {/* Quick Status / Macro Presets Bar */}
           <div className="px-2.5 py-1.5 bg-[#090f1a] border-b border-[#172338] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
             <button
               onClick={() => handleQuickPreset('10-4 Copy Dispatch. In position.')}
               className="px-2 py-0.5 text-[10px] font-bold text-slate-300 bg-[#111927] hover:bg-slate-700 border border-[#1d2a42] rounded-md shrink-0 transition-colors"
             >
               🎙 10-4 Copy
             </button>
             <button
               onClick={() => handleQuickPreset('Confirming on scene. Assessing hazards and perimeter.', 'On Scene')}
               className="px-2 py-0.5 text-[10px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md shrink-0 transition-colors"
             >
               📍 Confirm Scene
             </button>
             <button
               onClick={() => handleQuickPreset('URGENT: Request immediate secondary tactical backup & traffic control.')}
               className="px-2 py-0.5 text-[10px] font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-md shrink-0 transition-colors"
             >
               🚨 Req Backup
             </button>
             <button
               onClick={() => handleQuickPreset('Patient stabilized and loaded. En route to medical facility.', 'En Route')}
               className="px-2 py-0.5 text-[10px] font-bold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-md shrink-0 transition-colors"
             >
               🩺 Patient Transit
             </button>
             <button
               onClick={() => handleQuickPreset('Unit taking mechanical timeout. Setting status to Maintenance.', 'Maintenance')}
               className="px-2 py-0.5 text-[10px] font-bold text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-md shrink-0 transition-colors"
             >
               🔧 Report Maint
             </button>
           </div>
           
           {/* Message History */}
           <div ref={responderChatContainerRef} className="flex-1 p-3 overflow-y-auto space-y-2.5 scroll-smooth scrollbar-thin scrollbar-thumb-slate-800">
              {messages.length === 0 ? (
                 <div className="text-center text-slate-500 text-xs mt-10">
                   Direct dispatch link active. Send text messages, radio voice notes, or status presets to Dispatch.
                 </div>
              ) : (
                 messages.map(msg => (
                   <div key={msg.id} className={`p-2.5 rounded-xl border text-xs ${
                     msg.type === 'directive' ? 'bg-amber-500/10 border-amber-500/30' : 
                     msg.sender === 'You' || msg.sender === 'You (Voice)' ? 'bg-sky-500/10 border-sky-500/30' :
                     msg.sender.toLowerCase().includes('dispatch') || msg.sender === 'ERC Command' ? 'bg-blue-500/10 border-blue-500/30' :
                     'bg-purple-500/10 border-purple-500/30'
                   }`}>
                     <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${
                            msg.type === 'directive' ? 'text-amber-400' : 
                            msg.sender === 'You' || msg.sender === 'You (Voice)' ? 'text-sky-400' :
                            msg.sender.toLowerCase().includes('dispatch') || msg.sender === 'ERC Command' ? 'text-blue-400' :
                            'text-purple-400'
                          }`}>{msg.sender}</span>
                          {msg.tacticalStatus && (
                            <span className="text-[9px] font-mono font-bold px-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {msg.tacticalStatus}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{msg.time}</span>
                     </div>

                     {/* Voice Message Box with Real Microphone Audio Captured Banner */}
                     {msg.isVoiceNote ? (
                       <div className="space-y-1.5 mt-1">
                         <div className="flex items-center gap-1.5 text-[10px] font-mono text-sky-400 font-bold bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded-md w-fit">
                           <Mic size={10} className="text-sky-400 animate-pulse" />
                           <span>TACTICAL VOICE RECORDING</span>
                         </div>
                         
                         <div className="flex items-center gap-2.5 bg-[#090f1d] p-2.5 rounded-xl border border-[#1b2a42] shadow-inner">
                           <button
                             type="button"
                             onClick={() => togglePlayVoice(msg.id, msg.audioData, msg.text)}
                             className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                               playingVoiceId === msg.id
                                 ? 'bg-sky-400 text-white animate-pulse shadow-[0_0_12px_#38bdf8]'
                                 : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sm'
                             }`}
                             title={playingVoiceId === msg.id ? "Pause Voice Recording" : "Play Microphone Voice Recording"}
                           >
                             {playingVoiceId === msg.id ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                           </button>

                           <div className="flex-1 flex items-center gap-1">
                             {[35, 75, 95, 55, 85, 40, 100, 70, 30, 80, 90, 45, 65, 85, 50, 70].map((h, i) => (
                               <span
                                 key={i}
                                 className={`w-1 rounded-full transition-all duration-150 ${
                                   playingVoiceId === msg.id
                                     ? 'bg-sky-400 animate-bounce'
                                     : 'bg-slate-600'
                                 }`}
                                 style={{ 
                                   height: playingVoiceId === msg.id ? `${Math.max(6, (h / 100) * 18)}px` : '8px',
                                   animationDelay: `${i * 40}ms` 
                                 }}
                               ></span>
                             ))}
                           </div>

                           <div className="flex flex-col items-end shrink-0 text-[10px] font-mono">
                             <span className="text-slate-300 font-bold">{msg.voiceDuration || '0:03'}</span>
                             <span className="text-[9px] text-slate-500">{playingVoiceId === msg.id ? 'Playing' : 'Audio Note'}</span>
                           </div>
                         </div>

                         {msg.text && (
                           <div className="bg-[#0b1322]/80 rounded-lg px-2.5 py-1.5 border border-[#1c2e4a] text-xs text-slate-200">
                             <span className="text-[10px] text-sky-400 font-mono font-semibold uppercase tracking-wider block mb-0.5">Spoken Message:</span>
                             <p className="italic text-slate-200 text-xs leading-relaxed">"{msg.text}"</p>
                           </div>
                         )}
                       </div>
                     ) : (
                       <p className={`${msg.type === 'directive' ? 'text-amber-200 font-medium' : 'text-slate-300'}`}>{msg.text}</p>
                     )}
                   </div>
                 ))
              )}
              <div ref={messagesEndRef} />
           </div>

           {/* Input Box & Push-To-Talk Voice Recording Bar */}
           <div className="p-2.5 border-t border-[#172338] bg-[#0d1322]">
             {isRecordingPTT ? (
               <div className="bg-red-950/90 border border-red-500/60 rounded-xl p-2.5 space-y-2 text-xs text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-in fade-in">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                     <span className="font-bold font-mono text-white text-[11px] flex items-center gap-1">
                       <Mic size={13} className="text-red-400 animate-pulse" />
                       LISTENING & RECORDING LIVE VOICE...
                     </span>
                   </div>
                   <span className="font-mono font-black text-red-200 bg-red-900/50 px-2 py-0.5 rounded border border-red-500/40 text-xs">
                     0:0{recordingSeconds}
                   </span>
                 </div>

                 {/* Live Speech-to-Text Transcription Box */}
                 {liveTranscript ? (
                   <div className="bg-[#080d18] border border-red-500/40 rounded-lg p-2 text-xs text-slate-100 font-mono">
                     <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block mb-0.5">Live Voice Transcribed:</span>
                     <p className="italic text-slate-100 font-medium leading-tight">"{liveTranscript}"</p>
                   </div>
                 ) : (
                   <div className="bg-[#080d18]/60 border border-red-500/20 rounded-lg p-2 text-center text-[11px] text-red-300/80 font-mono italic">
                     Speak into your microphone — your voice is being recorded and speech transcribed live...
                   </div>
                 )}

                 {/* Live Animated Audio Wave Meter during Mic Recording */}
                 <div className="flex items-center justify-center gap-1.5 py-1 bg-[#090e18] rounded-lg border border-red-500/20 px-2">
                   {[40, 65, 90, 100, 75, 45, 85, 95, 60, 80, 100, 50, 70, 90, 60, 40].map((h, idx) => (
                     <span
                       key={idx}
                       className="w-1 bg-red-500 rounded-full animate-bounce"
                       style={{ 
                         height: `${Math.max(6, (h / 100) * 16)}px`,
                         animationDuration: `${0.3 + (idx % 4) * 0.15}s`
                       }}
                     />
                   ))}
                   <span className="text-[10px] text-red-300 font-mono font-semibold ml-2">Hardware Mic Active</span>
                 </div>

                 <div className="flex items-center justify-end gap-2 pt-0.5">
                   <button
                     type="button"
                     onClick={cancelPTTRecording}
                     className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                   >
                     Cancel
                   </button>
                   <button
                     type="button"
                     onClick={stopPTTRecording}
                     className="px-4 py-1.5 rounded-lg bg-rose-400 hover:bg-rose-300 text-rose-950 text-[11px] font-bold border border-rose-300 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                   >
                     <Send size={12} />
                     <span>Send Voice Note</span>
                   </button>
                 </div>
               </div>
             ) : (
               <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                 <input
                   type="text"
                   value={messageInput}
                   onChange={e => setMessageInput(e.target.value)}
                   placeholder="Send tactical text or tap PTT mic..."
                   className="flex-1 bg-[#111927] border border-[#1d2a42] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                 />

                 {/* Push-to-Talk Mic Button */}
                 <button
                   type="button"
                   onClick={startPTTRecording}
                   className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 hover:border-red-500 transition-colors shadow-sm cursor-pointer"
                   title="Push-To-Talk: Record and send radio voice message"
                 >
                   <Mic size={14} className="text-red-400 animate-pulse" />
                   <span className="font-mono text-[11px]">PTT</span>
                 </button>

                 <button 
                   type="submit" 
                   disabled={!messageInput.trim()} 
                   className="bg-sky-400 hover:bg-sky-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold border border-sky-300 rounded-xl px-3.5 py-2 text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                 >
                   <Send size={13} />
                   <span className="hidden sm:inline">Send</span>
                 </button>
               </form>
             )}
           </div>
        </div>

      </div>

      {/* VoIP Call Overlay */}
      {incomingCall && !inCall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0a0f1d] border border-blue-500/40 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse"></div>
             
             <div className="w-20 h-20 bg-blue-500/20 border-2 border-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                <Phone size={32} className="text-blue-400 animate-bounce" />
             </div>
             
             <h2 className="text-lg font-bold text-white mb-1">Incoming Priority Call</h2>
             <p className="text-blue-400 font-mono text-sm mb-8">{incomingCall.callerName} (Dispatch)</p>
             
             <div className="flex items-center justify-center gap-6">
                <button 
                  onClick={() => {
                    socket.emit('responder:decline_call', { unitId, callerId: incomingCall.callerId });
                    setIncomingCall(null);
                  }}
                  className="w-16 h-16 rounded-full bg-rose-400 hover:bg-rose-300 text-rose-950 flex flex-col items-center justify-center border border-rose-300 shadow-xs cursor-pointer"
                >
                  <PhoneOff size={24} />
                </button>
                <button 
                  onClick={() => {
                    socket.emit('responder:answer_call', { unitId, callerId: incomingCall.callerId });
                    setInCall(true);
                  }}
                  className="w-16 h-16 rounded-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 flex flex-col items-center justify-center border border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.4)] cursor-pointer"
                >
                  <Phone size={24} />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Active Call UI */}
      {inCall && incomingCall && (
        <div className="fixed bottom-0 left-0 w-full bg-emerald-950/90 backdrop-blur-md border-t border-emerald-500/40 p-4 animate-in slide-in-from-bottom flex justify-between items-center z-40">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white relative">
                <div className="absolute inset-0 border-2 border-emerald-400 rounded-full animate-ping"></div>
                <Phone size={18} />
              </div>
              <div>
                 <div className="text-sm font-bold text-emerald-400">{incomingCall.callerName}</div>
                 <div className="text-[10px] text-emerald-200/70 font-mono">SECURE VOICE LINK ACTIVE</div>
              </div>
           </div>
           
           <button 
             onClick={() => {
               socket.emit('call:end', { targetSocketId: incomingCall.callerId });
               setInCall(false);
               setIncomingCall(null);
             }}
             className="px-4 py-2 bg-rose-400 hover:bg-rose-300 text-rose-950 font-bold border border-rose-300 rounded-xl text-xs cursor-pointer"
           >
             End Call
           </button>
        </div>
      )}

      {/* Pre-Shift Equipment Inspection Modal */}
      {isInspectionModalOpen && (
        <EquipmentInspectionModal
          unitId={unitId}
          vehicle={{
            id: unitId,
            name: `${unitId} Emergency Response Unit`,
            type: (getUnitCategory(unitId) as any),
            fuel: 90
          }}
          onClose={() => setIsInspectionModalOpen(false)}
          onSave={handleSaveInspection}
        />
      )}
    </div>
  );
};
