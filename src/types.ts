export interface Incident {
  id: string;
  type: 'Fire' | 'Accident' | 'Medical' | 'Police' | 'Hazmat' | 'Radiation' | 'Disaster' | 'Other';
  location: string;
  lat: number;
  lng: number;
  priority: 'High' | 'Medium' | 'Low';
  dispatch: string;
  status: 'In Progress' | 'Assigned' | 'Resolved' | 'Incident Reported' | 'Assess & Prioritize' | 'Dispatch' | 'Track Response' | 'Coordinate' | 'Closed';
  time: string;
  description?: string;
  date?: string;
  requiredResponses?: { type: string; count: number }[];
  resolvedDetails?: { time: string; responders: string[]; actionSummary: string };
  hazardZone?: {
    type: 'gas_leak' | 'radiation' | 'flood' | 'chemical_spill' | 'explosion';
    radiusMeters: number;
    severityLabel: string;
    reading?: string; // e.g. "45.8 PPM Ammonia" or "18.2 mSv/h Gamma"
    windDirection?: string; // e.g. "NE @ 14 km/h"
    evacuationRadiusMeters?: number;
  };
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'Ambulance' | 'Police' | 'Fire' | 'Rescue' | 'Hazmat' | 'Drone' | 'Marine';
  station: string;
  lat: number;
  lng: number;
  baseLat?: number;
  baseLng?: number;
  status: 'Available' | 'Dispatched' | 'En Route' | 'On Scene' | 'Maintenance';
  assignedIncidentId?: string;
  driver: string;
  speed: string;
  fuel: number;
  equipment: string[];
  contactRadio: string;
  onSceneTicks?: number;
  routePath?: [number, number][];
  routeIndex?: number;
  isLiveGps?: boolean;
  gpsAccuracy?: number;
  lastGpsUpdate?: number;
  heading?: number;
  responderSocketId?: string;
  lastInspection?: EquipmentInspectionRecord;
}

export interface EmergencySanctuary {
  id: string;
  name: string;
  type: 'Refugee Relief Sanctuary' | 'Epidemic Surge Hospital' | 'Quarantine Zone' | 'Mass Evacuation Hub';
  lat: number;
  lng: number;
  capacity: number;
  occupied: number;
  supplies: {
    oxygenUnits: number;
    isolationBeds: number;
    tents: number;
    ppeKits: number;
    potableWaterLitres: number;
  };
  status: 'Active' | 'Constructing' | 'Standby';
  notes?: string;
  establishedTime: string;
  establishedBy: string;
  coverageRadiusMeters?: number;
}

export interface ResourceItem {
  id: string;
  type: string;
  station: string;
  status: 'Available' | 'Dispatched' | 'On Field' | 'Maintenance';
  incident: string;
  capacity?: number;
  total?: number;
}

export interface ActivityItem {
  id: string;
  time: string;
  text: string;
  color: 'blue' | 'red' | 'green' | 'amber' | 'purple';
}

export interface Hospital {
  id: string;
  name: string;
  city?: string;
  type: 'Government' | 'Private';
  lat: number;
  lng: number;
  capacity: number;
  availableBeds?: number;
  area?: string;
  contact?: string;
  traumaCenter?: boolean;
}

export interface PoliceStation {
  id: string;
  name: string;
  city?: string;
  division: string;
  lat: number;
  lng: number;
  personnel: number;
  contact?: string;
  vehiclesCount?: number;
}

export interface FireStation {
  id: string;
  name: string;
  city?: string;
  zone: 'Central' | 'North' | 'South' | 'West' | string;
  lat: number;
  lng: number;
  vehiclesCount: number;
  contact?: string;
  personnel?: number;
}

export interface ChatChannel {
  id: string;
  name: string;
  category: 'Incident-Tactical' | 'Inter-Unit' | 'Agency-Net';
  incidentId?: string;
  unitIds?: string[];
  description?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastTime?: string;
  isOnline?: boolean;
}

export interface ChatMessage {
  id: string | number;
  channelId: string;
  incidentId?: string;
  sender: string;
  senderId?: string;
  senderType: 'Dispatcher' | 'Police' | 'Fire' | 'Medical' | 'Rescue' | 'Responder' | string;
  time: string;
  text: string;
  type?: 'Police' | 'Fire' | 'Medical' | 'Rescue' | 'General';
  isNew?: boolean;
  isVoiceNote?: boolean;
  voiceDuration?: string;
  audioData?: string;
  tacticalStatus?: 'EN_ROUTE' | 'ON_SCENE' | 'BACKUP_REQUESTED' | 'PATIENT_LOADED' | 'CONTAINED' | 'CLEAR';
  locationTag?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  type: 'Incident' | 'Resolution' | 'Dispatch' | 'Arrival' | 'Broadcast' | 'System';
  priority: 'High' | 'Medium' | 'Low';
  incidentId?: string;
  unitId?: string;
  isRead: boolean;
}

export interface RadioTransmission {
  id: string;
  speaker: string;
  speakerType: 'Dispatcher' | 'Responder' | 'System';
  time: string;
  text: string;
  audioDuration?: string;
  signalStrength?: number;
  timestamp?: number;
  isVoiceNote?: boolean;
  voiceDuration?: string;
  audioData?: string;
}

export interface RadioCallSession {
  id: string;
  targetType: 'Unit' | 'Channel' | 'Broadcast';
  targetId: string;
  targetName: string;
  frequency: string;
  status: 'dialing' | 'connected' | 'incoming' | 'ended';
  startTime: number;
  durationSeconds: number;
  isPTTActive: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  unitType?: Vehicle['type'];
  assignedIncidentId?: string;
  station?: string;
  driver?: string;
  transmissions: RadioTransmission[];
}

export interface EquipmentCheckItem {
  id: string;
  name: string;
  category: 'Critical' | 'Safety' | 'Medical' | 'Vehicle' | 'Communication' | 'Hazmat' | 'Rescue' | 'Specialized';
  status: 'pass' | 'warning' | 'fail';
  notes?: string;
  required?: boolean;
}

export interface EquipmentInspectionRecord {
  id: string;
  vehicleId: string;
  vehicleName?: string;
  vehicleType?: string;
  inspectorName: string;
  shift: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  odometer?: number;
  fuelLevel?: number;
  overallStatus: 'passed' | 'advisory' | 'failed_grounded';
  items: EquipmentCheckItem[];
  generalNotes?: string;
}

