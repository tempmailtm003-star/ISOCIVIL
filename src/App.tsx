import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { LiveIncidentMap } from './components/LiveIncidentMap';
import { ActiveIncidentsTable } from './components/ActiveIncidentsTable';
import { ResourceOverview } from './components/ResourceOverview';
import { CommunicationCenter } from './components/CommunicationCenter';
import { ActivityFeed } from './components/ActivityFeed';
import { NearbyUnitsPanel } from './components/NearbyUnitsPanel';
import { IncidentModal, AddIncidentModal, AddResourceModal, EquipmentInspectionModal } from './components/Modals';
import { RadioCallModal } from './components/RadioCallModal';
import { LoginScreen } from './components/LoginScreen';
import {
  IncidentsView,
  ResourceManagementView,
  FullSecureChatView,
  HospitalsView,
  DepartmentsView,
  AlertsView,
  AnnouncementsView,
  VideoConferenceView,
  ReportsAnalyticsView,
  UsersView,
  SettingsView,
  IncidentHistoryView,
  ManualView
} from './components/Views';
import { Incident, ResourceItem, Vehicle, ChatChannel, AppNotification, RadioCallSession, RadioTransmission, EmergencySanctuary, ChatMessage, EquipmentInspectionRecord } from './types';
import { CHENNAI_HOSPITALS } from './data/hospitalsData';
import { INITIAL_MESSAGES, DEFAULT_CHANNELS } from './components/CommunicationCenter';
import { playRadioChirp, playRadioStatic, playRadioCallTone, speakTacticalRadio } from './utils/tacticalUtils';
import { socket, connectSocket, disconnectSocket } from './socket';
import { generateRoadWaypoints, fetchOSRMRoute, findClosestWaypointIndex } from './utils/roadRouter';
import { useTheme } from './context/ThemeContext';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Multi-Vehicle Collision Reported',
    message: 'Major multi-vehicle accident on Guindy highway. Emergency response units dispatched.',
    time: '10:32 AM',
    timestamp: Date.now() - 15 * 60 * 1000,
    type: 'Incident',
    priority: 'High',
    incidentId: 'INC-2026-014',
    isRead: false
  },
  {
    id: 'notif-2',
    title: 'Unit FS-12 Dispatched to Kilpauk',
    message: 'Fire engine FS-12 assigned and en route to commercial structural fire at Kilpauk.',
    time: '10:35 AM',
    timestamp: Date.now() - 12 * 60 * 1000,
    type: 'Dispatch',
    priority: 'High',
    incidentId: 'INC-2026-015',
    unitId: 'FE-12',
    isRead: false
  },
  {
    id: 'notif-3',
    title: 'Kilpauk Fire Incident Secured',
    message: 'Structural fire at Kilpauk successfully contained and secured by FE-12. Scene cleared.',
    time: '10:42 AM',
    timestamp: Date.now() - 5 * 60 * 1000,
    type: 'Resolution',
    priority: 'Medium',
    incidentId: 'INC-2026-015',
    unitId: 'FE-12',
    isRead: false
  },
  {
    id: 'notif-4',
    title: 'Ambulance Green Corridor Activated',
    message: 'Guindy Highway to Rajiv Gandhi GH corridor open for priority trauma transit.',
    time: '10:12 AM',
    timestamp: Date.now() - 35 * 60 * 1000,
    type: 'Broadcast',
    priority: 'Medium',
    isRead: true
  }
];


const INCIDENT_LOCATIONS = [
  { name: 'Anna Nagar West, Chennai', lat: 13.0878, lng: 80.2184, type: 'Fire', desc: 'Commercial transformer fire with heavy smoke' },
  { name: 'Guindy Flyover Intersection, Chennai', lat: 13.0067, lng: 80.2206, type: 'Accident', desc: 'Multiple vehicle pileup. Rapid emergency cordon required.' },
  { name: 'T. Nagar Ranganathan St, Chennai', lat: 13.0418, lng: 80.2341, type: 'Medical', desc: 'Critical cardiac resuscitation and emergency stabilization' },
  { name: 'Mylapore Tank Area, Chennai', lat: 13.0336, lng: 80.2685, type: 'Fire', desc: 'Roof fire in residential apartment block' },
  { name: 'Velachery Bypass Road, Chennai', lat: 12.9815, lng: 80.2180, type: 'Accident', desc: 'Vehicle breakdown blocking central lane' },
  { name: 'Besant Nagar Beach, Chennai', lat: 12.9996, lng: 80.2730, type: 'Medical', desc: 'Possible drowning incident, CPR required' },
  { name: 'Nungambakkam High Road, Chennai', lat: 13.0610, lng: 80.2450, type: 'Accident', desc: 'Pedestrian struck by two-wheeler' },
  { name: 'Tambaram Railway Station, Chennai', lat: 12.9248, lng: 80.1103, type: 'Security', desc: 'Suspicious package reported on platform 2' },
  { name: 'OMR IT Expressway, Chennai', lat: 12.9038, lng: 80.2285, type: 'Fire', desc: 'Server room fire in IT park' },
  { name: 'Adyar Signal, Chennai', lat: 13.0064, lng: 80.2575, type: 'Accident', desc: 'Bus collision with auto rickshaw' }
];

const generateRandomIncidents = (count = 4) => {
  const incidents = [];
  const usedLocations = new Set();
  
  while (incidents.length < count && usedLocations.size < INCIDENT_LOCATIONS.length) {
    const locIdx = Math.floor(Math.random() * INCIDENT_LOCATIONS.length);
    if (!usedLocations.has(locIdx)) {
      usedLocations.add(locIdx);
      const chosen = INCIDENT_LOCATIONS[locIdx];
      const newIncId = `INC-2026-0${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 1000)}`;
      
      incidents.push({
        id: newIncId,
        type: chosen.type,
        location: chosen.name,
        lat: chosen.lat,
        lng: chosen.lng,
        priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
        dispatch: 'Pending Dispatch',
        status: 'In Progress',
        time: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: chosen.desc
      });
    }
  }
  return incidents;
};

const INITIAL_INCIDENTS = generateRandomIncidents(4);


const INITIAL_VEHICLES: Vehicle[] = [
  // Fire Engines & Specialized Fire Equipment
  {
    id: 'FE-12',
    name: 'Fire Engine 12 (Foam Tender)',
    type: 'Fire',
    station: 'Central Fire Base (Kilpauk)',
    lat: 13.0890,
    lng: 80.2320,
    status: 'Available',
    driver: 'Capt. R. Ramesh',
    speed: 'Stationary',
    fuel: 88,
    equipment: ['Hydraulic Cutter', '10,000L Foam Tender', 'Hazmat Suits', 'Thermal Imager'],
    contactRadio: 'TAC-FIRE-01'
  },
  {
    id: 'FE-04',
    name: 'Fire Engine 04 (Ladder Tender)',
    type: 'Fire',
    station: 'Anna Nagar Fire Base',
    lat: 13.0910,
    lng: 80.2150,
    status: 'Available',
    driver: 'Lieut. K. Balan',
    speed: 'Stationary',
    fuel: 74,
    equipment: ['Dry Chemical Extinguisher', '35m Hydraulic Turntable Ladder', 'Breathing Apparatus'],
    contactRadio: 'TAC-FIRE-02'
  },
  {
    id: 'FE-09',
    name: 'Fire Engine 09 (High-Pressure Tender)',
    type: 'Fire',
    station: 'Guindy Fire Station',
    lat: 13.0080,
    lng: 80.2190,
    status: 'Available',
    driver: 'Officer P. Saravanan',
    speed: 'Stationary',
    fuel: 92,
    equipment: ['High Pressure Mist System', 'Water Bowsers', 'Smoke Evacuators'],
    contactRadio: 'TAC-FIRE-09'
  },
  {
    id: 'FE-18',
    name: 'Fire Engine 18 (Industrial Tender)',
    type: 'Fire',
    station: 'Ambattur Industrial Fire Post',
    lat: 13.1140,
    lng: 80.1540,
    status: 'Available',
    driver: 'Capt. S. Muthu',
    speed: 'Stationary',
    fuel: 96,
    equipment: ['Class-D Chemical Extinguisher', 'Industrial High-Flow Monitor', 'Blast Blankets'],
    contactRadio: 'TAC-FIRE-18'
  },
  {
    id: 'FE-02',
    name: 'Fire Engine 02 (Rapid Pumper)',
    type: 'Fire',
    station: 'Mylapore Fire Station',
    lat: 13.0330,
    lng: 80.2640,
    status: 'Available',
    driver: 'Lieut. N. Dinesh',
    speed: 'Stationary',
    fuel: 85,
    equipment: ['Quick Attack Hose Reels', 'Positive Pressure Fans', 'Thermal Imaging Binoculars'],
    contactRadio: 'TAC-FIRE-03'
  },

  // Police Patrol & Quick Response Tactical Units
  {
    id: 'PV-23',
    name: 'Police Patrol 23 (Kilpauk Sector)',
    type: 'Police',
    station: 'Kilpauk Police Station',
    lat: 13.0750,
    lng: 80.2250,
    status: 'Available',
    driver: 'Officer S. Rajesh',
    speed: 'Stationary',
    fuel: 92,
    equipment: ['Tactical Cordon Spikes', 'Traffic Diverters', 'Radar Scanner', 'Automated Number Plate Recognition'],
    contactRadio: 'TAC-POLICE-04'
  },
  {
    id: 'PV-12',
    name: 'Police Patrol 12 (Guindy Highway)',
    type: 'Police',
    station: 'Guindy Police Station',
    lat: 13.0450,
    lng: 80.2100,
    status: 'Available',
    driver: 'Officer M. Vijay',
    speed: 'Stationary',
    fuel: 85,
    equipment: ['Crash Reconstruction Kit', 'First Responder Medical Pack', 'High-Vis Night Beacons'],
    contactRadio: 'TAC-POLICE-02'
  },
  {
    id: 'PV-08',
    name: 'Police Patrol 08 (T. Nagar Commercial)',
    type: 'Police',
    station: 'T. Nagar Police Station',
    lat: 13.0380,
    lng: 80.2310,
    status: 'Available',
    driver: 'Officer D. Karthik',
    speed: 'Stationary',
    fuel: 90,
    equipment: ['Crowd Control Barriers', 'Emergency Flares', 'Megaphone PA System'],
    contactRadio: 'TAC-POLICE-08'
  },
  {
    id: 'PV-31',
    name: 'Police Rapid Interceptor 31',
    type: 'Police',
    station: 'Marina Coast Police Precinct',
    lat: 13.0520,
    lng: 80.2800,
    status: 'Available',
    driver: 'Sub-Insp. V. Mani',
    speed: 'Stationary',
    fuel: 94,
    equipment: ['Pursuit Telemetry', 'Tire Deflation Devices', 'GPS Beacon Tracker'],
    contactRadio: 'TAC-POLICE-31'
  },
  {
    id: 'PV-45',
    name: 'Traffic Highway Interceptor 45',
    type: 'Police',
    station: 'Tambaram Police Division',
    lat: 12.9250,
    lng: 80.1200,
    status: 'Available',
    driver: 'Officer G. Raghavan',
    speed: 'Stationary',
    fuel: 89,
    equipment: ['Variable Message Sign Board', 'Speed Radar LiDAR', 'Emergency Tow Hitch'],
    contactRadio: 'TAC-POLICE-45'
  },

  // Ambulances & Advanced Life Support (ALS)
  {
    id: 'AMB-07',
    name: 'ALS Ambulance 07 (Trauma Mobile ICU)',
    type: 'Ambulance',
    station: 'Rajiv Gandhi Government General Hospital',
    lat: 13.0300,
    lng: 80.2450,
    status: 'Available',
    driver: 'Paramedic Dr. Priya',
    speed: 'Stationary',
    fuel: 79,
    equipment: ['Defibrillator & Pacer', 'Transport Ventilator', 'Trauma Pack Alpha', 'Blood Gas Analyzer'],
    contactRadio: 'TAC-MED-02'
  },
  {
    id: 'AMB-02',
    name: 'Advanced Ambulance 02 (Cardiac Care)',
    type: 'Ambulance',
    station: 'Apollo Hospital Base (Greams Road)',
    lat: 13.0150,
    lng: 80.2580,
    status: 'Available',
    driver: 'Paramedic A. Anand',
    speed: 'Stationary',
    fuel: 95,
    equipment: ['12-Lead ECG Telemetry', 'Oxygen Resuscitation System', 'Spinal Immobilizer', 'LUCAS CPR'],
    contactRadio: 'TAC-MED-01'
  },
  {
    id: 'AMB-11',
    name: 'Emergency Neonatal & Pediatric AMB-11',
    type: 'Ambulance',
    station: 'Institute of Child Health (Egmore)',
    lat: 13.0720,
    lng: 80.2540,
    status: 'Available',
    driver: 'Dr. Shalini Raman',
    speed: 'Stationary',
    fuel: 91,
    equipment: ['Transport Incubator', 'Pediatric Ventilator', 'Nitric Oxide Delivery System'],
    contactRadio: 'TAC-MED-11'
  },
  {
    id: 'AMB-16',
    name: 'Rapid Response Medical Bike 16',
    type: 'Ambulance',
    station: 'Adyar Trauma Station',
    lat: 13.0030,
    lng: 80.2550,
    status: 'Available',
    driver: 'First Responder R. Arvind',
    speed: 'Stationary',
    fuel: 88,
    equipment: ['AED Automatic Defibrillator', 'Airway Kit', 'Adrenaline Autoinjectors'],
    contactRadio: 'TAC-MED-16'
  },

  // Heavy Rescue & SDRF Disaster Units
  {
    id: 'RT-01',
    name: 'Heavy Disaster Rescue Unit 01',
    type: 'Rescue',
    station: 'Central Disaster Management HQ',
    lat: 13.0550,
    lng: 80.2500,
    status: 'Available',
    driver: 'Sgt. M. Devan (SDRF)',
    speed: 'Stationary',
    fuel: 82,
    equipment: ['Pneumatic Jaws of Life', 'Thermal Acoustic Life Detectors', 'Heavy Shoring Props', 'Concrete Chain Saws'],
    contactRadio: 'TAC-RESCUE-01'
  },
  {
    id: 'RT-05',
    name: 'Urban Search & Rescue Team 05',
    type: 'Rescue',
    station: 'Velachery Emergency Outpost',
    lat: 12.9810,
    lng: 80.2180,
    status: 'Available',
    driver: 'Commander T. Shankar',
    speed: 'Stationary',
    fuel: 87,
    equipment: ['Inflatable Rescue Rafts', 'Fiberglass Flood Skiffs', 'High-Output Submersible Pumps'],
    contactRadio: 'TAC-RESCUE-05'
  },
  {
    id: 'RT-09',
    name: 'Structural Collapse Heavy Shoring Unit 09',
    type: 'Rescue',
    station: 'Madhavaram Disaster Logistics Depot',
    lat: 13.1480,
    lng: 80.2310,
    status: 'Available',
    driver: 'Lieut. V. Balasubramanian',
    speed: 'Stationary',
    fuel: 93,
    equipment: ['50-Ton Telescopic Crane Boom', 'Hydraulic Trench Shoring', 'Acoustic Void Sensors'],
    contactRadio: 'TAC-RESCUE-09'
  },

  // Specialized Hazmat & Chemical Decontamination Units
  {
    id: 'HZ-03',
    name: 'Hazmat Decontamination Unit 03',
    type: 'Hazmat',
    station: 'Manali Petrochemical Response Station',
    lat: 13.1670,
    lng: 80.2600,
    status: 'Available',
    driver: 'Hazmat Specialist Dr. K. Nathan',
    speed: 'Stationary',
    fuel: 93,
    equipment: ['Multi-Gas Mass Spectrometer', 'Chemical Scrubbing Shower Tent', 'Level-A Encapsulated Suits'],
    contactRadio: 'TAC-HAZMAT-03'
  },
  {
    id: 'HZ-07',
    name: 'Bio-Chemical Rapid Response Lab 07',
    type: 'Hazmat',
    station: 'Ennore Chemical Corridor Post',
    lat: 13.2050,
    lng: 80.3200,
    status: 'Available',
    driver: 'Bio-Safety Lead Dr. Ananya Sen',
    speed: 'Stationary',
    fuel: 96,
    equipment: ['Real-Time Toxic Vapor Analyzer', 'Radiation Survey Meter', 'Neutralization Foam'],
    contactRadio: 'TAC-HAZMAT-07'
  },

  // Tactical Special Operations (SWAT / QRT / Highway / K-9)
  {
    id: 'SWAT-01',
    name: 'Tactical Quick Response (QRT 01)',
    type: 'Police',
    station: 'Vepery Commissionerate Tactical Base',
    lat: 13.0840,
    lng: 80.2600,
    status: 'Available',
    driver: 'Commandant R. Veerappan',
    speed: 'Stationary',
    fuel: 95,
    equipment: ['Armored Ballistic Hull', 'Tactical Door Breachers', 'Thermal Night Vision Scope', 'Stun Grenades'],
    contactRadio: 'TAC-SWAT-01'
  },
  {
    id: 'TP-19',
    name: 'Highway Patrol Rapid Escort 19',
    type: 'Police',
    station: 'OMR IT Corridor Traffic Precinct',
    lat: 12.9650,
    lng: 80.2450,
    status: 'Available',
    driver: 'Sub-Insp. C. Praveen',
    speed: 'Stationary',
    fuel: 92,
    equipment: ['High-Speed Green Corridor Escort', 'Crash Barrier Dispersal', 'Emergency Trauma Kit'],
    contactRadio: 'TAC-TRAFFIC-19'
  },
  {
    id: 'PV-52',
    name: 'K-9 Search & Detection Unit 52',
    type: 'Police',
    station: 'Chennai Central Railway Outpost',
    lat: 13.0825,
    lng: 80.2760,
    status: 'Available',
    driver: 'Officer G. Selvan & K9 Bruno',
    speed: 'Stationary',
    fuel: 89,
    equipment: ['Dual Scent-Tracking K9s', 'Explosive Vapor Sensor', 'Tactical Canine Harnesses'],
    contactRadio: 'TAC-POLICE-52'
  },

  // Specialized Ambulances & Hospital Emergency Response
  {
    id: 'AMB-22',
    name: 'Mobile Stroke & CT Scanner Unit 22',
    type: 'Ambulance',
    station: 'Stanley Medical College Hospital',
    lat: 13.1070,
    lng: 80.2860,
    status: 'Available',
    driver: 'Dr. G. Sundar (Neuro)',
    speed: 'Stationary',
    fuel: 90,
    equipment: ['On-Board 16-Slice CT Scanner', 'Tele-Neurology Downlink', 'Thrombolytic Infusion Pump'],
    contactRadio: 'TAC-MED-22'
  },
  {
    id: 'AMB-33',
    name: 'Mass Casualty Triage Bus 33',
    type: 'Ambulance',
    station: 'KMC Kilpauk Hospital Base',
    lat: 13.0780,
    lng: 80.2420,
    status: 'Available',
    driver: 'Chief Paramedic T. Hemalatha',
    speed: 'Stationary',
    fuel: 87,
    equipment: ['8-Stretcher High-Capacity Bay', 'Multi-Patient High-Flow Oxygen Bank', 'Triage Station Packs'],
    contactRadio: 'TAC-MED-33'
  },

  // Tactical Aerial Recon & Heavy-Lift Cargo Drones
  {
    id: 'UAV-01',
    name: 'SkyGuard Tactical Drone Unit 01',
    type: 'Drone',
    station: 'EOC Command Rooftop Base (Ripon)',
    lat: 13.0820,
    lng: 80.2740,
    status: 'Available',
    driver: 'Pilot E. Harish',
    speed: 'Stationary',
    fuel: 98,
    equipment: ['4K FLIR Thermal Zoom Gimbal', 'Laser Rangefinder', 'Emergency PA Speaker Drop', 'Night Vision IR Spotlights'],
    contactRadio: 'TAC-UAV-01'
  },
  {
    id: 'UAV-02',
    name: 'SkyGuard Night-Scan Drone 02',
    type: 'Drone',
    station: 'Anna Flyover Tactical Station',
    lat: 13.0600,
    lng: 80.2520,
    status: 'Available',
    driver: 'Pilot S. Nivetha',
    speed: 'Stationary',
    fuel: 100,
    equipment: ['Gas Sensing Sniffer Array', 'Tethered 24hr Power Cord', 'HD Wide-Angle Mapping Cam'],
    contactRadio: 'TAC-UAV-02'
  },
  {
    id: 'UAV-03',
    name: 'SkyLifter Heavy Cargo Drop Drone 03',
    type: 'Drone',
    station: 'Marina Beach Lifeguard Station',
    lat: 13.0480,
    lng: 80.2820,
    status: 'Available',
    driver: 'Pilot K. Venkatesh',
    speed: 'Stationary',
    fuel: 95,
    equipment: ['25kg Emergency Payload Winch', 'Inflatable Auto-Inflate Lifebuoy', 'First Aid Air-Drop Pod'],
    contactRadio: 'TAC-UAV-03'
  },

  // Marine & Coastal Interceptors & High-Output Support
  {
    id: 'CGR-02',
    name: 'Coastal Rescue Fast Interceptor Boat 02',
    type: 'Marine',
    station: 'Chennai Port Marine Emergency Pier',
    lat: 13.0980,
    lng: 80.2980,
    status: 'Available',
    driver: 'Capt. L. Christopher',
    speed: 'Stationary',
    fuel: 90,
    equipment: ['Marine Search Radar', 'Flotation Stretcher', 'Twin 300HP Water Jets', 'Diver Emergency Gear'],
    contactRadio: 'TAC-COAST-02'
  },
  {
    id: 'CGR-05',
    name: 'Heavy Offshore Marine Cutter 05',
    type: 'Marine',
    station: 'Chennai Port Marine Emergency Pier',
    lat: 13.0880,
    lng: 80.3080,
    status: 'Available',
    driver: 'Capt. J. Mohanraj',
    speed: 'Stationary',
    fuel: 94,
    equipment: ['Dual Fire Fighting Monitors (5000L/m)', 'Deep-Sea Sonar Array', 'Emergency Towing Hawser'],
    contactRadio: 'TAC-COAST-05'
  },
  {
    id: 'EV-01',
    name: 'Mobile High-Mast Emergency Power Unit 01',
    type: 'Rescue',
    station: 'Ripon EOC Logistics Base',
    lat: 13.0790,
    lng: 80.2710,
    status: 'Available',
    driver: 'Eng. P. Dhanasekar',
    speed: 'Stationary',
    fuel: 98,
    equipment: ['250kVA Ultra-Silent Diesel Generator', '15m High-Mast Stadium LED Floodlights', 'Emergency Distribution Boards'],
    contactRadio: 'TAC-EOC-01'
  }
];

const INITIAL_RESOURCES: ResourceItem[] = [
  { id: 'FE-12', type: 'Fire Engine (Foam Tender)', station: 'Central Fire Base (Kilpauk)', status: 'Available', incident: '-' },
  { id: 'FE-04', type: 'Fire Engine (Ladder Tender)', station: 'Anna Nagar Fire Base', status: 'Available', incident: '-' },
  { id: 'FE-09', type: 'Fire Engine (High-Pressure)', station: 'Guindy Fire Station', status: 'Available', incident: '-' },
  { id: 'FE-18', type: 'Fire Engine (Industrial)', station: 'Ambattur Industrial Post', status: 'Available', incident: '-' },
  { id: 'FE-02', type: 'Fire Engine (Rapid Pumper)', station: 'Mylapore Fire Station', status: 'Available', incident: '-' },
  { id: 'AMB-07', type: 'ALS Trauma Ambulance', station: 'Rajiv Gandhi GH', status: 'Available', incident: '-' },
  { id: 'AMB-02', type: 'Cardiac Care Ambulance', station: 'Apollo Hospital Base', status: 'Available', incident: '-' },
  { id: 'AMB-11', type: 'Neonatal Care Ambulance', station: 'Institute of Child Health', status: 'Available', incident: '-' },
  { id: 'AMB-16', type: 'Rapid Response Medical Bike', station: 'Adyar Trauma Station', status: 'Available', incident: '-' },
  { id: 'AMB-22', type: 'Mobile Stroke CT Unit', station: 'Stanley Medical College Hospital', status: 'Available', incident: '-' },
  { id: 'AMB-33', type: 'Mass Casualty Triage Bus', station: 'KMC Kilpauk Hospital Base', status: 'Available', incident: '-' },
  { id: 'PV-23', type: 'Police Patrol Vehicle', station: 'Kilpauk Police Station', status: 'Available', incident: '-' },
  { id: 'PV-12', type: 'Police Patrol Vehicle', station: 'Guindy Police Station', status: 'Available', incident: '-' },
  { id: 'PV-08', type: 'Police Patrol Vehicle', station: 'T. Nagar Police Station', status: 'Available', incident: '-' },
  { id: 'PV-31', type: 'Police Pursuit Interceptor', station: 'Marina Coast Precinct', status: 'Available', incident: '-' },
  { id: 'PV-45', type: 'Traffic Highway Interceptor', station: 'Tambaram Division', status: 'Available', incident: '-' },
  { id: 'PV-52', type: 'K-9 Search & Detection Unit', station: 'Chennai Central Railway Outpost', status: 'Available', incident: '-' },
  { id: 'SWAT-01', type: 'Tactical Quick Response (QRT)', station: 'Vepery Commissionerate Base', status: 'Available', incident: '-' },
  { id: 'TP-19', type: 'Highway Patrol Rapid Escort', station: 'OMR IT Corridor Precinct', status: 'Available', incident: '-' },
  { id: 'RT-01', type: 'Heavy Disaster Rescue Unit', station: 'Central Disaster HQ', status: 'Available', incident: '-' },
  { id: 'RT-05', type: 'Urban Search & Rescue Boat', station: 'Velachery Outpost', status: 'Available', incident: '-' },
  { id: 'RT-09', type: 'Structural Collapse Shoring', station: 'Madhavaram Logistics Depot', status: 'Available', incident: '-' },
  { id: 'HZ-03', type: 'Hazmat Decontamination Unit', station: 'Manali Petrochem Station', status: 'Available', incident: '-' },
  { id: 'HZ-07', type: 'Bio-Chemical Response Lab', station: 'Ennore Chemical Post', status: 'Available', incident: '-' },
  { id: 'UAV-01', type: 'Tactical Recon Drone 01', station: 'Ripon EOC Command Base', status: 'Available', incident: '-' },
  { id: 'UAV-02', type: 'SkyGuard Night Drone 02', station: 'Anna Flyover Base', status: 'Available', incident: '-' },
  { id: 'UAV-03', type: 'SkyLifter Heavy Cargo Drone', station: 'Marina Lifeguard Station', status: 'Available', incident: '-' },
  { id: 'CGR-02', type: 'Fast Coastal Marine Boat', station: 'Chennai Port Marine Pier', status: 'Available', incident: '-' },
  { id: 'CGR-05', type: 'Offshore Marine Cutter 05', station: 'Chennai Port Marine Pier', status: 'Available', incident: '-' },
  { id: 'EV-01', type: 'Mobile Power & Lighting Mast', station: 'Ripon EOC Logistics Base', status: 'Available', incident: '-' }
];


const INITIAL_CHANNELS: ChatChannel[] = [
  ...DEFAULT_CHANNELS,
  {
    id: 'general',
    name: '🌐 ERC Citywide Broadcast',
    category: 'Agency-Net',
    unitIds: [],
    description: 'Citywide broadcast channel',
    lastMessage: 'All units hold.',
    lastTime: '10:00 AM',
    unreadCount: 0
  }
];


export default function App() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('erc_auth_authenticated') === 'true';
  });
  const [authUser, setAuthUser] = useState<string>(() => {
    return sessionStorage.getItem('erc_auth_user') || 'watchdogs';
  });

  const [currentView, setCurrentView] = useState('Dashboard');
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [resources, setResources] = useState<ResourceItem[]>(INITIAL_RESOURCES);
  const [channels, setChannels] = useState<ChatChannel[]>(INITIAL_CHANNELS);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [activeChannelId, setActiveChannelId] = useState<string>('agency-police');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showAddIncident, setShowAddIncident] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [inspectingVehicle, setInspectingVehicle] = useState<Vehicle | null>(null);

  const handleSaveVehicleInspection = (record: EquipmentInspectionRecord, updateStatusToMaintenance?: boolean) => {
    setVehicles(prev => prev.map(v => {
      if (v.id === record.vehicleId) {
        return {
          ...v,
          status: updateStatusToMaintenance ? 'Maintenance' : v.status,
          fuel: record.fuelLevel ?? v.fuel,
          lastInspection: record
        };
      }
      return v;
    }));

    if (updateStatusToMaintenance) {
      socket.emit('dispatcher:clear_directive', { unitId: record.vehicleId });
    }
  };
useEffect(() => {
    if (!selectedIncidentId && incidents.length > 0) {
      setSelectedIncidentId(incidents[0].id);
    }
  }, [incidents, selectedIncidentId]);

  useEffect(() => {
    setChannels(prev => {
      const newChannels = incidents.filter(inc => !prev.some(c => c.incidentId === inc.id)).map(inc => ({
         id: `inc-${inc.id}`,
         name: `🚨 [${inc.id.split('-')[2] || inc.id}] ${inc.type} Ops`,
         category: 'Incident-Tactical' as const,
         incidentId: inc.id,
         unitIds: [],
         description: `Tactical comms for ${inc.location}`,
         lastMessage: 'Channel established.',
         lastTime: inc.time,
         unreadCount: 0
      }));
      if (newChannels.length > 0) return [...prev, ...newChannels];
      return prev;
    });
  }, [incidents]);


  // Real-Time Simulation State
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [latestResolvedNotice, setLatestResolvedNotice] = useState<{
    id: string;
    location: string;
    unitName: string;
    time: string;
  } | null>(null);

  // Tactical Radio 2-Way Call State
  const [radioSession, setRadioSession] = useState<RadioCallSession | null>(null);

  // Hospital Saturation & Emergency Refugee/Epidemic Sanctuary Management
  const [sanctuaries, setSanctuaries] = useState<EmergencySanctuary[]>([
    {
      id: 'SANC-01',
      name: 'Marina Coastal Mass Refugee & Triage Encampment',
      type: 'Refugee Relief Sanctuary',
      lat: 13.0485,
      lng: 80.2820,
      capacity: 1500,
      occupied: 620,
      supplies: {
        oxygenUnits: 60,
        isolationBeds: 180,
        tents: 220,
        ppeKits: 1600,
        potableWaterLitres: 14000
      },
      status: 'Active',
      notes: 'Initial relief corridor for coastal surge & epidemic overflow protocol.',
      establishedTime: '10:15 AM',
      establishedBy: 'ERC Command',
      coverageRadiusMeters: 450
    }
  ]);
  const [isHospitalSurgeActive, setIsHospitalSurgeActive] = useState<boolean>(false);

  const handleAddSanctuary = (newSanctuary: EmergencySanctuary) => {
    setSanctuaries(prev => [newSanctuary, ...prev]);
    setActivities(prev => [
      {
        id: `act-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'Resource',
        action: `Emergency Sanctuary Established: ${newSanctuary.name} (${newSanctuary.type}) with ${newSanctuary.capacity} capacity.`,
        unitId: newSanctuary.id,
        isRead: false
      },
      ...prev
    ]);
  };

  const handleUpdateSanctuary = (id: string, updates: Partial<EmergencySanctuary>) => {
    setSanctuaries(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleRemoveSanctuary = (id: string) => {
    setSanctuaries(prev => prev.filter(s => s.id !== id));
  };

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
      socket.emit('dispatcher:login');

      // Sync active fleet state with server
      const dispatchedList = vehicles
        .filter(v => v.status === 'Dispatched' && v.assignedIncidentId)
        .map(v => ({
          unitId: v.id,
          incident: incidents.find(i => i.id === v.assignedIncidentId),
          directive: `EMERGENCY DISPATCH: Unit ${v.id} assigned to incident ${v.assignedIncidentId}`
        }))
        .filter(item => item.incident);

      socket.emit('dispatcher:sync_fleet_state', { dispatchedUnits: dispatchedList });

      const handleStatusChanged = (data: any) => {
        const { unitId, status } = data;
        const cleanUnitId = (unitId || '').toUpperCase().trim();
        setVehicles(prev => prev.map(v => v.id.toUpperCase() === cleanUnitId ? { ...v, status } : v));
        setResources(prev => prev.map(r => r.id.toUpperCase() === cleanUnitId ? { ...r, status } : r));
      };

      const handleLocationUpdate = (data: any) => {
        const { unitId, coords, status } = data;
        if (!unitId || !coords) return;
        const cleanUnitId = (unitId || '').toUpperCase().trim();

        setVehicles(prev => prev.map(v => {
          if (v.id.toUpperCase() === cleanUnitId) {
            return {
              ...v,
              lat: coords.lat,
              lng: coords.lng,
              speed: coords.speed ? `${coords.speed} km/h` : (v.status === 'En Route' ? '45 km/h' : v.speed),
              heading: coords.heading ?? v.heading,
              gpsAccuracy: coords.accuracy ?? v.gpsAccuracy,
              isLiveGps: true,
              lastGpsUpdate: Date.now(),
              status: status || v.status
            };
          }
          return v;
        }));
      };
      
      const handleTelemetryUpdate = (data: any) => {
        const { unitId, telemetry, coords } = data;
        const cleanUnitId = (unitId || '').toUpperCase().trim();
        setVehicles(prev => prev.map(v => {
          if (v.id.toUpperCase() === cleanUnitId) {
            return {
              ...v,
              fuel: telemetry?.fuel ?? v.fuel,
              lat: coords?.lat ?? v.lat,
              lng: coords?.lng ?? v.lng,
              speed: coords?.speed ? `${coords.speed} km/h` : v.speed,
              gpsAccuracy: coords?.accuracy ?? v.gpsAccuracy,
              isLiveGps: coords ? true : v.isLiveGps,
              lastGpsUpdate: Date.now()
            };
          }
          return v;
        }));
      };

      const handleReceiveMessage = (data: any) => {
        const { sender, message, incidentId, unitId, isVoiceNote, voiceDuration, audioData, tacticalStatus, id, missionId } = data;
        
        // Don't add own echo if sent from local Dispatcher
        if (sender === 'EOC Dispatch Control' || sender === 'Dispatcher (Control)') {
          return;
        }

        playRadioChirp(isVoiceNote ? 'incoming' : 'roger');

        const effectiveUnitId = (unitId || (sender?.startsWith('FE-') || sender?.startsWith('AMB-') || sender?.startsWith('PV-') || sender?.startsWith('RT-') ? sender.split(' ')[0] : '')).toUpperCase().trim();
        const fallbackUnitId = !effectiveUnitId && incidentId?.startsWith('direct-') ? incidentId.replace('direct-', '').toUpperCase().trim() : effectiveUnitId;

        let resolvedChannelId = incidentId || (fallbackUnitId ? `direct-${fallbackUnitId}` : 'general');
        if (incidentId === 'general') resolvedChannelId = 'general';
        else if (incidentId?.startsWith('direct-')) resolvedChannelId = incidentId;
        else if (incidentId?.startsWith('inc-')) resolvedChannelId = incidentId;
        else if (incidentId) resolvedChannelId = `inc-${incidentId}`;

        const senderType = (fallbackUnitId?.startsWith('FE') || sender?.includes('FE-') || sender?.toLowerCase().includes('fire')) ? 'Fire' :
                           (fallbackUnitId?.startsWith('AMB') || sender?.includes('AMB-') || sender?.toLowerCase().includes('hospital') || sender?.toLowerCase().includes('medic')) ? 'Medical' :
                           (fallbackUnitId?.startsWith('PV') || sender?.includes('PV-') || sender?.toLowerCase().includes('police') || sender?.toLowerCase().includes('patrol')) ? 'Police' : 'Responder';

        const timeStr = data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const msgId = id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const effectiveText = message || (isVoiceNote ? 'Voice transmission received' : '');

        // Update messages state with full audio payload and cross-matching fields
        setMessages(prev => {
          if (id && prev.some(m => m.id === id)) return prev;
          return [...prev, {
            id: msgId,
            channelId: resolvedChannelId,
            incidentId: missionId || (incidentId && !incidentId.startsWith('direct-') ? incidentId : undefined),
            sender: sender || fallbackUnitId || 'Field Responder',
            senderId: fallbackUnitId || unitId || sender,
            senderType,
            time: timeStr,
            text: effectiveText,
            isVoiceNote: !!isVoiceNote,
            voiceDuration: voiceDuration || '0:04',
            audioData,
            tacticalStatus
          }];
        });

        // Add dispatch alert notification
        setNotifications(prev => [
          {
            id: `notif-${Date.now()}`,
            title: isVoiceNote ? `🎙 Radio Voice: ${fallbackUnitId || sender}` : `💬 Secure Comms: ${fallbackUnitId || sender}`,
            message: effectiveText,
            time: timeStr,
            timestamp: Date.now(),
            type: isVoiceNote ? 'Radio' : 'Incident',
            priority: tacticalStatus === 'BACKUP_REQUESTED' ? 'Critical' : 'Medium',
            read: false
          },
          ...prev.slice(0, 30)
        ]);

        setChannels(prev => {
          let exists = false;
          let updatedChannels = prev.map(channel => {
            const isTargetGeneral = resolvedChannelId === 'general' && (channel.id === 'general' || channel.id === 'citywide');
            const isTargetIncident = channel.incidentId === incidentId || 
                                     channel.id === resolvedChannelId || 
                                     channel.id === incidentId ||
                                     channel.id === missionId ||
                                     (channel.incidentId && missionId && channel.incidentId.toLowerCase().includes(missionId.toLowerCase().replace('inc-', ''))) ||
                                     (channel.incidentId && incidentId && channel.incidentId.toLowerCase().includes(incidentId.toLowerCase().replace('inc-', '')));
            const isTargetUnit = (channel.unitIds && fallbackUnitId && channel.unitIds.includes(fallbackUnitId)) || channel.id === `direct-${fallbackUnitId}`;
            const isMasterTraffic = channel.id === 'all-traffic';
            const isAgencyMatch = (channel.id === 'agency-fire' && senderType === 'Fire') ||
                                  (channel.id === 'agency-police' && senderType === 'Police') ||
                                  (channel.id === 'agency-hospitals' && senderType === 'Medical');

            if (isTargetGeneral || isTargetIncident || isTargetUnit || isMasterTraffic || isAgencyMatch) {
                if (isTargetIncident || isTargetUnit) {
                  exists = true;
                }
                const summaryText = isVoiceNote ? `🎙 ${sender || fallbackUnitId}: [Voice Note ${voiceDuration || '0:04'}]` : `${sender || fallbackUnitId}: ${effectiveText}`;
                return {
                  ...channel,
                  lastMessage: summaryText,
                  lastTime: timeStr,
                  unreadCount: (channel.unreadCount || 0) + (channel.id !== activeChannelId ? 1 : 0)
                };
            }
            return channel;
          });
          
          if (!exists && fallbackUnitId) {
             const unit = vehicles.find(v => v.id === fallbackUnitId);
             const icon = unit ? (unit.type.includes('Fire') ? '🚒' : unit.type.includes('Police') ? '🚔' : '🚑') : '📱';
             const directChannelId = `direct-${fallbackUnitId}`;
             
             // Check if channel already exists with this ID
             if (!updatedChannels.some(c => c.id === directChannelId)) {
               updatedChannels = [
                 {
                   id: directChannelId,
                   name: `${icon} ${fallbackUnitId} Direct Link`,
                   category: 'Inter-Unit',
                   unitIds: [fallbackUnitId],
                   description: `Direct communications with dispatcher and unit ${fallbackUnitId}`,
                   lastMessage: isVoiceNote ? `🎙 ${sender || fallbackUnitId}: Voice Transmission (${voiceDuration || '0:04'})` : `${sender || fallbackUnitId}: ${effectiveText}`,
                   lastTime: timeStr,
                   unreadCount: 1
                 },
                 ...updatedChannels
               ];
             }
          }
          return updatedChannels;
        });
      };

      socket.on('dispatcher:receive_message', handleReceiveMessage);
      socket.on('responder:status_changed', handleStatusChanged);
      socket.on('responder:telemetry_update', handleTelemetryUpdate);
      socket.on('responder:location_update', handleLocationUpdate);

      return () => {
        socket.off('responder:status_changed', handleStatusChanged);
        socket.off('responder:telemetry_update', handleTelemetryUpdate);
        socket.off('responder:location_update', handleLocationUpdate);
        socket.off('dispatcher:receive_message', handleReceiveMessage);
        disconnectSocket();
      };
    }
  }, [isAuthenticated]);

  const [isRadioModalOpen, setIsRadioModalOpen] = useState<boolean>(false);
  const [isRadioMinimized, setIsRadioMinimized] = useState<boolean>(false);


  useEffect(() => {
    const handleCallAnswered = (data: any) => {
       setRadioSession(prev => prev ? { ...prev, isConnected: true } : prev);
       playRadioCallTone('connected');
    };
    
    const handleCallDeclined = () => {
       handleEndRadioCall();
    };

    socket.on('dispatcher:call_answered', handleCallAnswered);
    socket.on('dispatcher:call_declined', handleCallDeclined);
    socket.on('call:ended', () => {
       handleEndRadioCall();
    });

    return () => {
      socket.off('dispatcher:call_answered', handleCallAnswered);
      socket.off('dispatcher:call_declined', handleCallDeclined);
      socket.off('call:ended');
    };
  }, []);

  // Active Radio Call Duration Timer
  useEffect(() => {
    if (!radioSession || radioSession.status !== 'connected') return;

    const timer = setInterval(() => {
      setRadioSession(prev => {
        if (!prev || prev.status !== 'connected') return prev;
        return {
          ...prev,
          durationSeconds: prev.durationSeconds + 1
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [radioSession?.status]);

  // Start Radio Call Handler
  const handleStartRadioCall = (target: {
    type: 'Unit' | 'Channel';
    id: string;
    name: string;
    vehicle?: Vehicle;
    channel?: ChatChannel;
  }) => {
    const v = target.vehicle || vehicles.find(item => item.id === target.id);
    const assignedFreq = target.type === 'Unit' ? (v?.contactRadio || 'TAC-852.125 MHz') : 'TAC-852.125 MHz';

    // Play dialing tone
    playRadioCallTone('dialing');

    
    if (target.type === 'Unit') {
      socket.emit('dispatcher:call_unit', { unitId: target.id, callerName: 'ERC Command' });
    }
    const newSession: RadioCallSession = {
      id: `call-${Date.now()}`,
      targetType: target.type,
      targetId: target.id,
      targetName: target.name,
      driver: v?.driver,
      station: v?.station,
      frequency: assignedFreq,
      status: 'dialing',
      startTime: Date.now(),
      durationSeconds: 0,
      isMuted: false,
      isSpeakerOn: true,
      isPTTActive: false,
      transmissions: []
    };

    setRadioSession(newSession);
    setIsRadioModalOpen(true);
    setIsRadioMinimized(false);

    // Simulate network repeater lock & connect after 1.2 seconds
    setTimeout(() => {
      playRadioCallTone('connected');

      let greetingText = '';
      if (target.type === 'Unit') {
        greetingText = `${target.id} (${v?.driver || 'Officer'}): Receiving loud and clear on ${assignedFreq}. Standing by for tactical instructions.`;
      } else {
        greetingText = `Repeater Net [${target.name}]: Channel open with ${target.channel?.unitIds?.length || 2} field units. Standing by.`;
      }

      setRadioSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'connected',
          transmissions: [
            {
              id: `tx-${Date.now()}`,
              speaker: target.id,
              speakerType: 'Responder',
              text: greetingText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: Date.now()
            }
          ]
        };
      });

      // Voice synthesizer tactical voice response
      speakTacticalRadio(greetingText, 'Responder');
    }, 1200);
  };

  // End Radio Call Handler
  
  const handleEndRadioCall = () => {
    if (radioSession && radioSession.targetType === 'Unit') {
       socket.emit('call:end', { targetSocketId: radioSession.targetId });
    }
    playRadioCallTone('disconnected');
    setRadioSession(null);
    setIsRadioModalOpen(false);
    setIsRadioMinimized(false);
  };


  // Toggle Mute
  const handleToggleRadioMute = () => {
    setRadioSession(prev => (prev ? { ...prev, isMuted: !prev.isMuted } : null));
  };

  // Toggle Speaker
  const handleToggleRadioSpeaker = () => {
    setRadioSession(prev => (prev ? { ...prev, isSpeakerOn: !prev.isSpeakerOn } : null));
  };

  // Send Transmission in Active Call (Dispatcher / Responder)
  const handleSendRadioTransmission = (
    text: string,
    isDispatcher = true,
    isVoiceNote = false,
    voiceDuration?: string,
    audioData?: string
  ) => {
    if (!radioSession || !text.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dispatcherTx: RadioTransmission = {
      id: `tx-${Date.now()}`,
      speaker: 'EOC Dispatch Control',
      speakerType: 'Dispatcher',
      text: text.trim(),
      time: timeStr,
      timestamp: Date.now(),
      isVoiceNote,
      voiceDuration,
      audioData
    };

    setRadioSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        transmissions: [...prev.transmissions, dispatcherTx]
      };
    });

    // Also broadcast to the target responder unit or channel via socket
    socket.emit('dispatcher:broadcast', {
      id: dispatcherTx.id,
      incidentId: radioSession.targetType === 'Unit' ? `direct-${radioSession.targetId}` : radioSession.targetId,
      message: isVoiceNote ? text.trim() : `🎙 [RADIO CALL]: ${text.trim()}`,
      sender: 'EOC Dispatch Control',
      time: timeStr,
      isVoiceNote,
      voiceDuration,
      audioData
    });

    // If Dispatcher spoke, simulate realistic Officer / Responder response over radio with voice
    if (isDispatcher) {
      setTimeout(() => {
        if (!radioSession || radioSession.status !== 'connected') return;

        let responderReply = '';
        const lower = text.toLowerCase();
        const v = vehicles.find(item => item.id === radioSession.targetId);
        const driverName = v?.driver || 'Officer';

        if (lower.includes('status') || lower.includes('eta') || lower.includes('report') || lower.includes('location') || lower.includes('where')) {
          responderReply = `${radioSession.targetId} (${driverName}): Copy Control. Current location ${v?.location || 'Sector 4'}, speed ${v?.speed || '45 km/h'}, fuel at ${v?.fuel || 85}%. Maintaining tactical position.`;
        } else if (lower.includes('cordon') || lower.includes('traffic') || lower.includes('diversion') || lower.includes('block') || lower.includes('road')) {
          responderReply = `${radioSession.targetId} (${driverName}): Roger that. Cordon established, traffic diversions active with local precinct.`;
        } else if (lower.includes('hydrant') || lower.includes('attack') || lower.includes('water') || lower.includes('pressure') || lower.includes('fire')) {
          responderReply = `${radioSession.targetId} (${driverName}): Roger. High pressure attack line deployed. Thermal imaging indicates flashover risk contained.`;
        } else if (lower.includes('green corridor') || lower.includes('hospital') || lower.includes('ambulance') || lower.includes('patient') || lower.includes('triage') || lower.includes('casualty')) {
          responderReply = `${radioSession.targetId} (${driverName}): Understood. Green corridor signal timing synchronized with Traffic Control Center. Patient stabilized.`;
        } else if (lower.includes('hazmat') || lower.includes('containment') || lower.includes('scba') || lower.includes('gas') || lower.includes('chemical')) {
          responderReply = `${radioSession.targetId} (${driverName}): SCBA Level A hazmat protocol engaged. Perimeter atmospheric sensor levels nominal.`;
        } else if (lower.includes('drone') || lower.includes('aerial') || lower.includes('scan') || lower.includes('thermal')) {
          responderReply = `${radioSession.targetId} (${driverName}): Thermal reconnaissance drone airborne. Live telemetry streaming to command console.`;
        } else if (lower.includes('acknowledge') || lower.includes('copy') || lower.includes('hello') || lower.includes('test')) {
          responderReply = `${radioSession.targetId} (${driverName}): Radio check 5 by 5, Control. Standing by for tactical orders.`;
        } else {
          responderReply = `${radioSession.targetId} (${driverName}): Copy directive: "${text.length > 60 ? text.slice(0, 57) + '...' : text}". Message acknowledged, proceeding as instructed.`;
        }

        setRadioSession(prev => {
          if (!prev) return null;
          return {
            ...prev,
            transmissions: [
              ...prev.transmissions,
              {
                id: `tx-${Date.now()}`,
                speaker: radioSession.targetId,
                speakerType: 'Responder',
                text: responderReply,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: Date.now()
              }
            ]
          };
        });

        // Trigger voice audio on speaker
        if (radioSession.isSpeakerOn) {
          speakTacticalRadio(responderReply, 'Responder');
        }
      }, 1400);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: !n.isRead } : n)));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadAlertsCount = notifications.filter(n => !n.isRead).length;

  const [activities, setActivities] = useState<any[]>([
    {
      id: 'act-1',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Police Unit PV-23 assigned to INC-2025-015',
      color: 'blue'
    },
    {
      id: 'act-2',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Fire Engine FE-12 en route to Kilpauk',
      color: 'red'
    },
    {
      id: 'act-3',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: 'Ambulance AMB-07 dispatched to INC-2025-014',
      color: 'green'
    }
  ]);

  // Real-time Vehicle Movement & Incident Resolution Simulation Engine
  useEffect(() => {
    if (!isSimulationActive) return;

    // Smooth, calibrated cadence (~500ms per waypoint step) for realistic emergency transit speed
    const intervalMs = Math.max(200, Math.floor(550 / simSpeed));

    const timer = setInterval(() => {
      setVehicles(prevVehicles => {
        let hasChanges = false;
        let resolvedIncidentId: string | null = null;
        let resolvedUnitName = '';
        let resolvedIncidentLocation = '';

        const nextVehicles = prevVehicles.map(vehicle => {
          if (!vehicle.assignedIncidentId) return vehicle;

          // Find assigned incident
          const targetInc = incidents.find(i => i.id === vehicle.assignedIncidentId);
          if (!targetInc || targetInc.status === 'Resolved' || targetInc.status === 'Closed') {
            hasChanges = true;
            return {
              ...vehicle,
              status: 'Available' as const,
              assignedIncidentId: undefined,
              routePath: undefined,
              routeIndex: 0,
              speed: 'Stationary',
              onSceneTicks: 0
            };
          }

          // If vehicle has arrived on scene or is working on scene, hold stable
          if (vehicle.status === 'On Scene') {
            return vehicle;
          }

          // If road path not yet generated, build it
          let path = vehicle.routePath;
          if (!path || path.length === 0) {
            path = generateRoadWaypoints(vehicle.lat, vehicle.lng, targetInc.lat, targetInc.lng);
          }

          const currentIndex = vehicle.routeIndex || 0;
          // Advance steadily along the fine road waypoints
          const stepAdvancement = Math.max(1, Math.round(1 * (simSpeed > 1 ? simSpeed * 0.8 : 1)));
          const nextIndex = currentIndex + stepAdvancement;

          if (nextIndex >= path.length - 1) {
            // Vehicle reaches scene!
            hasChanges = true;
            playRadioChirp('roger');
            const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            setActivities(prev => [
              {
                id: `act-${Date.now()}-${Math.random()}`,
                time: nowTime,
                text: `${vehicle.name} arrived ON SCENE at ${targetInc.location}. Operations active.`,
                color: vehicle.type === 'Fire' ? 'red' : vehicle.type === 'Ambulance' ? 'green' : 'blue'
              },
              ...prev.slice(0, 15)
            ]);

            // Add arrival notification to persistent notification log
            setNotifications(prev => [
              {
                id: `notif-arr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                title: `${vehicle.name} Arrived On Scene`,
                message: `${vehicle.name} has arrived at ${targetInc.location} for incident ${targetInc.id}. Operations active.`,
                time: nowTime,
                timestamp: Date.now(),
                type: 'Arrival',
                priority: targetInc.priority,
                incidentId: targetInc.id,
                unitId: vehicle.id,
                isRead: false
              },
              ...prev
            ]);

            return {
              ...vehicle,
              lat: targetInc.lat,
              lng: targetInc.lng,
              status: 'On Scene' as const,
              speed: '0 km/h (On Scene)',
              onSceneTicks: 1,
              routePath: path,
              routeIndex: path.length - 1
            };
          } else {
            // Advancing smoothly along road corridor
            hasChanges = true;
            const nextCoord = path[nextIndex];
            const speedKmh = 48;

            return {
              ...vehicle,
              lat: nextCoord[0],
              lng: nextCoord[1],
              status: 'En Route' as const,
              speed: `${speedKmh} km/h`,
              routePath: path,
              routeIndex: nextIndex
            };
          }
        });

        // Trigger incident resolution state updates outside the vehicle loop
        if (resolvedIncidentId) {
          const incId = resolvedIncidentId;
          const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          setIncidents(prevInc =>
            prevInc.map(inc =>
              inc.id === incId
                ? {
                    ...inc,
                    status: 'Resolved' as const,
                    description: `${inc.description || ''} [Resolved by ${resolvedUnitName}]`
                  }
                : inc
            )
          );

          setResources(prevRes =>
            prevRes.map(res =>
              res.incident === incId ? { ...res, status: 'Available', incident: '-' } : res
            )
          );

          playRadioChirp('transmit');

          setLatestResolvedNotice({
            id: incId,
            location: resolvedIncidentLocation,
            unitName: resolvedUnitName,
            time: nowTime
          });

          // Add resolved incident persistently to notifications log
          setNotifications(prev => [
            {
              id: `notif-res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              title: `Incident ${incId} Resolved & Cleared`,
              message: `Incident at ${resolvedIncidentLocation} successfully secured by ${resolvedUnitName}. Scene cleared and units returned to standby.`,
              time: nowTime,
              timestamp: Date.now(),
              type: 'Resolution',
              priority: 'Medium',
              incidentId: incId,
              unitId: resolvedUnitName,
              isRead: false
            },
            ...prev
          ]);

          setActivities(prev => [
            {
              id: `act-${Date.now()}-${Math.random()}`,
              time: nowTime,
              text: `Incident ${incId} RESOLVED by ${resolvedUnitName}. Area secured and map cleared.`,
              color: 'green'
            },
            ...prev.slice(0, 15)
          ]);
        }

        return hasChanges ? nextVehicles : prevVehicles;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulationActive, simSpeed, incidents]);

  // Quick Turnout Incident Simulation Trigger
  
  const handleSimulateTurnout = () => {
    let availableLocations = INCIDENT_LOCATIONS.filter(loc => !incidents.some(inc => inc.location === loc.name));
    if (availableLocations.length === 0) {
      // If all used, allow reuse
      availableLocations = INCIDENT_LOCATIONS;
    }
    
    const chosen = availableLocations[Math.floor(Math.random() * availableLocations.length)];
    const newIncId = `INC-2026-0${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 1000)}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newIncident: Incident = {
      id: newIncId,
      type: chosen.type as any,
      location: chosen.name,
      lat: chosen.lat,
      lng: chosen.lng,
      priority: 'High',
      dispatch: 'Pending Dispatch',
      status: 'In Progress',
      time: nowTime,
      description: chosen.desc
    };


    // Find nearest available vehicle of matching type or any available vehicle
    let bestVehicle = vehicles.find(v => v.status === 'Available' && v.type === chosen.type);
    if (!bestVehicle) {
      bestVehicle = vehicles.find(v => v.status === 'Available');
    }

    if (bestVehicle) {
      newIncident.dispatch = `${bestVehicle.type} ${bestVehicle.id}`;
      // Dispatch the vehicle
      handleDispatchVehicle(bestVehicle.id, newIncId);
    }

    setIncidents(prev => [newIncident, ...prev]);
    setSelectedIncidentId(newIncId);
    setSelectedIncident(newIncident);

    // Push notification to persistent feed
    setNotifications(prev => [
      {
        id: `notif-inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: `Emergency Reported: ${newIncId}`,
        message: `${chosen.type} incident registered at ${chosen.name}. Auto-dispatch protocol initiated.`,
        time: nowTime,
        timestamp: Date.now(),
        type: 'Incident',
        priority: 'High',
        incidentId: newIncId,
        isRead: false
      },
      ...prev
    ]);

    setActivities(prev => [
      {
        id: `act-${Date.now()}`,
        time: nowTime,
        text: `EMERGENCY REPORTED: ${chosen.type} at ${chosen.name}. Auto-dispatch triggered.`,
        color: chosen.type === 'Fire' ? 'red' : chosen.type === 'Medical' ? 'green' : 'blue'
      },
      ...prev
    ]);
  };

  const handleLoginSuccess = (user: string) => {
    setIsAuthenticated(true);
    setAuthUser(user);
    sessionStorage.setItem('erc_auth_authenticated', 'true');
    sessionStorage.setItem('erc_auth_user', user);
    playRadioChirp();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('erc_auth_authenticated');
    sessionStorage.removeItem('erc_auth_user');
  };

  const handleUpdateStatus = (id: string, newStatus: any) => {
    setIncidents(prev => prev.map(inc => (inc.id === id ? { ...inc, status: newStatus } : inc)));
    if (selectedIncident && selectedIncident.id === id) {
      setSelectedIncident({ ...selectedIncident, status: newStatus });
    }

    if (newStatus === 'Resolved' || newStatus === 'Closed') {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Clear directives for any units assigned to this incident
      vehicles.filter(v => v.assignedIncidentId === id).forEach(v => {
        socket.emit('dispatcher:clear_directive', { unitId: v.id });
        socket.emit('responder:update_status', { unitId: v.id, status: 'Available' });
      });
      setVehicles(prev => prev.map(v => v.assignedIncidentId === id ? { ...v, status: 'Available', assignedIncidentId: undefined, speed: 'Stationary' } : v));
      setResources(prev => prev.map(r => r.incident === id ? { ...r, status: 'Available', incident: '-' } : r));

      setNotifications(prev => [
        {
          id: `notif-res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: `Incident ${id} Marked as ${newStatus}`,
          message: `Dispatcher manually marked incident ${id} as ${newStatus}. Incident closed in record.`,
          time: nowTime,
          timestamp: Date.now(),
          type: 'Resolution',
          priority: 'Low',
          incidentId: id,
          isRead: false
        },
        ...prev
      ]);
    }
  };

  const handleDispatchVehicle = (vehicleId: string, incidentId: string) => {
    
    const targetInc = incidents.find(i => i.id === incidentId);
    
    socket.emit('dispatcher:send_directive', {
      unitId: vehicleId,
      directive: `DIRECTIVE: You have been dispatched to ${incidentId}. Acknowledge and proceed.`,
      incident: targetInc
    });


    const targetVehicle = vehicles.find(v => v.id === vehicleId);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let initialPath: [number, number][] | undefined = undefined;
    if (targetVehicle && targetInc) {
      initialPath = generateRoadWaypoints(
        targetVehicle.lat,
        targetVehicle.lng,
        targetInc.lat,
        targetInc.lng
      );

      // Asynchronously fetch OSRM road geometry if available
      fetchOSRMRoute(targetVehicle.lat, targetVehicle.lng, targetInc.lat, targetInc.lng).then(
        osrmPath => {
          if (osrmPath && osrmPath.length > 2) {
            setVehicles(curr =>
              curr.map(v => {
                if (v.id === vehicleId && v.assignedIncidentId === incidentId) {
                  const closestIdx = findClosestWaypointIndex(osrmPath, v.lat, v.lng);
                  return { ...v, routePath: osrmPath, routeIndex: closestIdx };
                }
                return v;
              })
            );
          }
        }
      );
    }

    // Update vehicle
    setVehicles(prev =>
      prev.map(v =>
        v.id === vehicleId
          ? {
              ...v,
              status: 'Dispatched',
              assignedIncidentId: incidentId,
              speed: '38 km/h',
              routePath: initialPath,
              routeIndex: 0
            }
          : v
      )
    );

    // Update resources list
    setResources(prev =>
      prev.map(r => (r.id === vehicleId ? { ...r, status: 'Dispatched', incident: incidentId } : r))
    );

    // Append to incident dispatch string
    setIncidents(prev =>
      prev.map(inc => {
        if (inc.id === incidentId) {
          const currentUnits = inc.dispatch || '';
          const updatedUnits = currentUnits.includes(vehicleId)
            ? currentUnits
            : currentUnits
            ? `${currentUnits}, ${vehicleId}`
            : vehicleId;
          return { ...inc, dispatch: updatedUnits };
        }
        return inc;
      })
    );

    // Add dispatch notification
    if (targetVehicle && targetInc) {
      setNotifications(prev => [
        {
          id: `notif-disp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: `${targetVehicle.name} Dispatched to ${targetInc.id}`,
          message: `${targetVehicle.name} (${targetVehicle.type}) deployed from ${targetVehicle.station} to ${targetInc.location}.`,
          time: nowTime,
          timestamp: Date.now(),
          type: 'Dispatch',
          priority: targetInc.priority,
          incidentId: targetInc.id,
          unitId: targetVehicle.id,
          isRead: false
        },
        ...prev
      ]);

      // Emit socket directive directly to the field responder terminal
      socket.emit('dispatcher:send_directive', {
        unitId: vehicleId,
        directive: `EMERGENCY DISPATCH: Unit ${vehicleId} ordered to respond immediately to ${targetInc.type} at ${targetInc.location}.`,
        incident: targetInc
      });
    }

    // Ensure incident channel exists and has unit
    const incChannelId = `inc-${incidentId.replace('INC-2026-', '').toLowerCase()}`;
    const incChan = channels.find(c => c.id === incChannelId || c.incidentId === incidentId);
    if (!incChan) {
      const newIncChannel: ChatChannel = {
        id: incChannelId,
        name: `🚨 [${incidentId}] Incident Tactical Net`,
        category: 'Incident-Tactical',
        incidentId: incidentId,
        unitIds: [vehicleId],
        description: `Tactical mission channel for ${incidentId}`,
        lastMessage: `Unit ${vehicleId} dispatched to scene.`,
        lastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount: 0
      };
      setChannels(prev => [newIncChannel, ...prev]);
    }
  };

  const handleRecallVehicle = (vehicleId: string) => {
    setVehicles(prev =>
      prev.map(v =>
        v.id === vehicleId
          ? { ...v, status: 'Available', assignedIncidentId: undefined, speed: 'Stationary' }
          : v
      )
    );

    setResources(prev =>
      prev.map(r => (r.id === vehicleId ? { ...r, status: 'Available', incident: '-' } : r))
    );

    socket.emit('dispatcher:clear_directive', { unitId: vehicleId });
    socket.emit('responder:update_status', { unitId: vehicleId, status: 'Available' });
  };

  const handleOpenCommsWithVehicle = (vehicleId: string) => {
    // Find or create direct inter-unit channel
    const targetVehicle = vehicles.find(v => v.id === vehicleId);
    const expectedId = `direct-${vehicleId}`;
    const existing = channels.find(c => c.id === expectedId);

    if (existing) {
      setActiveChannelId(existing.id);
    } else {
      const channelId = expectedId;
      const newCh: ChatChannel = {
        id: channelId,
        name: `${targetVehicle ? (targetVehicle.type.includes('Fire') ? '🚒' : targetVehicle.type.includes('Police') ? '🚔' : '🚑') : '📱'} ${vehicleId} Direct Link`,
        category: 'Inter-Unit',
        unitIds: [vehicleId, 'HQ-Control'],
        description: `Direct communications with dispatcher`,
        lastMessage: 'Direct communication link opened.',
        lastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount: 0
      };
      setChannels(prev => [newCh, ...prev]);
      setActiveChannelId(channelId);
    }

    setCurrentView('Secure Chat');
    playRadioChirp('roger');
  };

  const handleCreateChannel = (newChannel: ChatChannel) => {
    setChannels(prev => [newChannel, ...prev]);
    setActiveChannelId(newChannel.id);
  };

  const handleRemoveChannel = (channelId: string) => {
    setChannels(prev => prev.filter(c => c.id !== channelId));
    if (activeChannelId === channelId) {
      setActiveChannelId('agency-police');
    }
  };

  const handleAddIncident = ({ type, location, priority }: any) => {
    const lat = 13.04 + (Math.random() - 0.5) * 0.08;
    const lng = 80.22 + (Math.random() - 0.5) * 0.08;
    const newIncId = `INC-2026-0${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 1000)}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newInc: Incident = {
      id: newIncId,
      type,
      location,
      lat,
      lng,
      priority,
      dispatch: 'Pending Dispatch',
      status: 'In Progress',
      time: nowTime,
      description: 'Emergency reported via dispatch console.'
    };
    setIncidents([newInc, ...incidents]);
    setSelectedIncidentId(newIncId);
    setShowAddIncident(false);

    setNotifications(prev => [
      {
        id: `notif-inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: `Manual Incident Logged: ${newIncId}`,
        message: `${type} incident at ${location} registered by dispatcher. Priority: ${priority}.`,
        time: nowTime,
        timestamp: Date.now(),
        type: 'Incident',
        priority: priority,
        incidentId: newIncId,
        isRead: false
      },
      ...prev
    ]);
  };

  const handleAddResource = ({ type, station }: any) => {
    const isFire = type.includes('Fire');
    const isPolice = type.includes('Police');
    const isAmbulance = type.includes('Ambulance');
    const isHazmat = type.includes('Hazmat');
    const isDrone = type.includes('Drone') || type.includes('UAV');
    const isMarine = type.includes('Marine') || type.includes('Boat');

    const prefix = isFire
      ? 'FE'
      : isPolice
      ? 'PV'
      : isAmbulance
      ? 'AMB'
      : isHazmat
      ? 'HZ'
      : isDrone
      ? 'UAV'
      : isMarine
      ? 'CGR'
      : 'RT';

    const num = Math.floor(Math.random() * 90) + 10;
    const newResId = `${prefix}-${num}`;

    const vehicleType: Vehicle['type'] = isFire
      ? 'Fire'
      : isPolice
      ? 'Police'
      : isAmbulance
      ? 'Ambulance'
      : isHazmat
      ? 'Hazmat'
      : isDrone
      ? 'Drone'
      : isMarine
      ? 'Marine'
      : 'Rescue';

    const newVehicle: Vehicle = {
      id: newResId,
      name: `${type} ${num}`,
      type: vehicleType,
      station,
      lat: 13.04 + (Math.random() - 0.5) * 0.06,
      lng: 80.23 + (Math.random() - 0.5) * 0.06,
      status: 'Available',
      driver: 'Officer Assigned',
      speed: 'Stationary',
      fuel: 95,
      equipment: ['Standard Tactical Response Kit', 'Field Communications Array'],
      contactRadio: `TAC-${prefix}-${num}`
    };

    const newRes: ResourceItem = {
      id: newResId,
      type,
      station,
      status: 'Available',
      incident: '-'
    };

    setVehicles([newVehicle, ...vehicles]);
    setResources([newRes, ...resources]);
    setShowAddResource(false);
  };

  const handleUpdateResourceStatus = (id: string) => {
    setResources(prev =>
      prev.map(res => {
        if (res.id === id) {
          const nextStatus =
            res.status === 'Available'
              ? 'Dispatched'
              : res.status === 'Dispatched'
              ? 'Maintenance'
              : 'Available';
          const nextIncident =
            nextStatus === 'Dispatched' ? 'INC-' + Math.floor(Math.random() * 900 + 100) : '-';
          return { ...res, status: nextStatus, incident: nextIncident };
        }
        return res;
      })
    );

    setVehicles(prev =>
      prev.map(v => {
        if (v.id === id) {
          const nextStatus =
            v.status === 'Available'
              ? 'Dispatched'
              : v.status === 'Dispatched'
              ? 'Maintenance'
              : 'Available';
          return { ...v, status: nextStatus };
        }
        return v;
      })
    );
  };

  const renderViewContent = () => {
    switch (currentView) {
      case 'Dashboard':
        return (
          <div className="space-y-5">
            {/* Top KPI Cards Row */}
            <KPICards
              activeIncidentsCount={
                incidents.filter(i => i.status !== 'Resolved' && i.status !== 'Closed').length
              }
              respondersCount={vehicles.filter(v => v.status !== 'Maintenance').length * 4}
              hospitalsCount={CHENNAI_HOSPITALS.length}
              resourcesCount={vehicles.length}
              alertsCount={7}
              onViewUnits={() => setCurrentView('Resource Management')}
            />

            {/* Main Center Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column (Map + Active Incidents Table) */}
              <div className="lg:col-span-8 space-y-5">
                <LiveIncidentMap
                  incidents={incidents}
                  vehicles={vehicles}
                  selectedIncidentId={selectedIncidentId}
                  onSelectIncidentId={setSelectedIncidentId}
                  onViewIncident={setSelectedIncident}
                  onDispatchVehicle={handleDispatchVehicle}
                  onRecallVehicle={handleRecallVehicle}
                  onOpenCommsWithVehicle={handleOpenCommsWithVehicle}
                  onOpenRadioCall={handleStartRadioCall}
                  onExpandView={() => setCurrentView('Dispatch Map')}
                  isSimulationActive={isSimulationActive}
                  onToggleSimulation={() => setIsSimulationActive(prev => !prev)}
                  onSimulateIncident={handleSimulateTurnout}
                  latestResolvedIncident={latestResolvedNotice}
                  onClearResolvedNotice={() => setLatestResolvedNotice(null)}
                  sanctuaries={sanctuaries}
                  onAddSanctuary={handleAddSanctuary}
                  onUpdateSanctuary={handleUpdateSanctuary}
                  onRemoveSanctuary={handleRemoveSanctuary}
                  isHospitalSurgeActive={isHospitalSurgeActive}
                  onToggleHospitalSurge={(active) => setIsHospitalSurgeActive(prev => active !== undefined ? active : !prev)}
                />

                {/* Nearby Response Units Proximity Dispatch Engine */}
                <NearbyUnitsPanel
                  vehicles={vehicles}
                  incidents={incidents}
                  selectedIncidentId={selectedIncidentId}
                  onSelectIncidentId={setSelectedIncidentId}
                  onDispatchVehicle={handleDispatchVehicle}
                  onRecallVehicle={handleRecallVehicle}
                  onOpenCommsWithVehicle={handleOpenCommsWithVehicle}
                  onOpenRadioCall={handleStartRadioCall}
                />

                <ActiveIncidentsTable
                  incidents={incidents}
                  onViewIncident={setSelectedIncident}
                  onViewAll={() => setCurrentView('Incidents')}
                />
              </div>

              {/* Right Column (Resource Overview + Tactical Comms + Activity Feed) */}
              <div className="lg:col-span-4 space-y-5">
                <ResourceOverview
                  vehicles={vehicles}
                  onViewAll={() => setCurrentView('Resource Management')}
                />

                <CommunicationCenter
                  channels={channels}
                  activeChannelId={activeChannelId}
                  onSelectChannel={setActiveChannelId}
                  onCreateChannel={handleCreateChannel}
                  onRemoveChannel={handleRemoveChannel}
                  vehicles={vehicles}
                  incidents={incidents}
                  onOpenFullView={() => setCurrentView('Secure Chat')}
                  onOpenRadioCall={handleStartRadioCall}
                  messages={messages}
                  setMessages={setMessages}
                />

                <ActivityFeed
                  activities={activities}
                  onViewAll={() => setCurrentView('Dispatch Map')}
                />
              </div>
            </div>
          </div>
        );

      case 'Incidents':
        return (
          <IncidentsView
            incidents={incidents}
            onViewIncident={setSelectedIncident}
            onAdd={() => setShowAddIncident(true)}
          />
        );

      case 'Dispatch Map':
      case 'Live Tracking':
        return (
          <div className="h-[calc(100vh-7.5rem)]">
            <LiveIncidentMap
              fullScreen
              incidents={incidents}
              vehicles={vehicles}
              selectedIncidentId={selectedIncidentId}
              onSelectIncidentId={setSelectedIncidentId}
              onViewIncident={setSelectedIncident}
              onDispatchVehicle={handleDispatchVehicle}
              onRecallVehicle={handleRecallVehicle}
              onOpenCommsWithVehicle={handleOpenCommsWithVehicle}
              onOpenRadioCall={handleStartRadioCall}
              isSimulationActive={isSimulationActive}
              onToggleSimulation={() => setIsSimulationActive(prev => !prev)}
              onSimulateIncident={handleSimulateTurnout}
              latestResolvedIncident={latestResolvedNotice}
              onClearResolvedNotice={() => setLatestResolvedNotice(null)}
              sanctuaries={sanctuaries}
              onAddSanctuary={handleAddSanctuary}
              onUpdateSanctuary={handleUpdateSanctuary}
              onRemoveSanctuary={handleRemoveSanctuary}
              isHospitalSurgeActive={isHospitalSurgeActive}
              onToggleHospitalSurge={(active) => setIsHospitalSurgeActive(prev => active !== undefined ? active : !prev)}
            />
          </div>
        );

      case 'Resource Management':
        return (
          <ResourceManagementView
            resources={resources}
            vehicles={vehicles}
            onUpdateResourceStatus={handleUpdateResourceStatus}
            onAdd={() => setShowAddResource(true)}
            onDispatchVehicle={handleDispatchVehicle}
            onOpenCommsWithVehicle={handleOpenCommsWithVehicle}
            onOpenRadioCall={handleStartRadioCall}
            onInspectVehicle={setInspectingVehicle}
          />
        );

      case 'Hospitals':
        return (
          <HospitalsView
            isHospitalSurgeActive={isHospitalSurgeActive}
            onToggleHospitalSurge={(active) => setIsHospitalSurgeActive(prev => active !== undefined ? active : !prev)}
            sanctuaries={sanctuaries}
            onAddSanctuary={handleAddSanctuary}
            onUpdateSanctuary={handleUpdateSanctuary}
            onRemoveSanctuary={handleRemoveSanctuary}
            onNavigateToMap={() => setCurrentView('Dispatch Map')}
          />
        );

      case 'Departments':
        return <DepartmentsView />;

      case 'Alerts & Notifications':
        return (
          <AlertsView
            notifications={notifications}
            incidents={incidents}
            vehicles={vehicles}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearAll={handleClearNotifications}
            onDeleteNotification={handleDeleteNotification}
            onViewIncident={(inc) => setSelectedIncident(inc)}
          />
        );

      case 'Secure Chat':
        return (
          <FullSecureChatView
            channels={channels}
            activeChannelId={activeChannelId}
            onSelectChannel={setActiveChannelId}
            onCreateChannel={handleCreateChannel}
            onRemoveChannel={handleRemoveChannel}
            vehicles={vehicles}
            incidents={incidents}
            onOpenRadioCall={handleStartRadioCall}
            messages={messages}
            setMessages={setMessages}
          />
        );

      case 'Announcements':
        return <AnnouncementsView />;

      case 'Video Conference':
        return <VideoConferenceView />;

      case 'Reports & Analytics':
        return <ReportsAnalyticsView />;

      case 'User Management':
        return <UsersView />;

      case 'Incident History':
        return <IncidentHistoryView incidents={incidents} onViewIncident={setSelectedIncident} />;
      case 'Manual':
        return <ManualView />;
      case 'System Settings':
        return <SettingsView />;

      default:
        return (
          <div className="p-8 text-center bg-[#0b101d] border border-[#172338] rounded-2xl">
            <h3 className="text-base font-bold text-slate-200">{currentView}</h3>
            <p className="text-xs text-slate-400 mt-1">Module view is active.</p>
            <button
              onClick={() => setCurrentView('Dashboard')}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
            >
              Back to Dashboard
            </button>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`flex h-screen font-sans overflow-hidden responsive-command-bg ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Dynamic Ambient Responsive Lighting Elements */}
      <div className="responsive-ambient-orb -top-24 -left-24 w-[35vw] h-[35vw] min-w-[280px] min-h-[280px] max-w-[550px] max-h-[550px] bg-sky-500/10" />
      <div className="responsive-ambient-orb -bottom-24 -right-24 w-[35vw] h-[35vw] min-w-[280px] min-h-[280px] max-w-[550px] max-h-[550px] bg-indigo-500/10" />

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header
          currentView={currentView}
          unreadAlertsCount={unreadAlertsCount}
          onAlertsClick={() => setCurrentView('Alerts & Notifications')}
          onRadioCallClick={() => setIsRadioModalOpen(true)}
          onLogout={handleLogout}
        />

        <main className={`flex-1 overflow-y-auto p-4 sm:p-5 w-full ${
          isDark ? 'scrollbar-thin scrollbar-thumb-slate-800' : 'scrollbar-thin scrollbar-thumb-slate-300'
        }`}>
          <div key={currentView} className="w-full min-w-0 view-enter-animation">{renderViewContent()}</div>
        </main>
      </div>

      {/* Modals */}
      <IncidentModal
        incident={selectedIncident}
        vehicles={vehicles}
        onClose={() => setSelectedIncident(null)}
        onUpdateStatus={handleUpdateStatus}
        onDispatchVehicle={handleDispatchVehicle}
        onRecallVehicle={handleRecallVehicle}
        onOpenComms={(incId) => {
          const incChan = channels.find(c => c.incidentId === incId);
          if (incChan) setActiveChannelId(incChan.id);
          setCurrentView('Secure Chat');
        }}
      />

      {showAddIncident && (
        <AddIncidentModal
          onClose={() => setShowAddIncident(false)}
          onSave={handleAddIncident}
        />
      )}

      {showAddResource && (
        <AddResourceModal
          onClose={() => setShowAddResource(false)}
          onSave={handleAddResource}
        />
      )}

      {/* 2-Way Tactical Voice Radio Call Modal & Minimized Dock */}
      <RadioCallModal
        session={radioSession}
        isOpen={isRadioModalOpen || !!radioSession}
        isMinimized={isRadioMinimized}
        onToggleMinimize={() => setIsRadioMinimized(prev => !prev)}
        onCloseModal={() => setIsRadioModalOpen(false)}
        onEndCall={handleEndRadioCall}
        onToggleMute={handleToggleRadioMute}
        onToggleSpeaker={handleToggleRadioSpeaker}
        onSendTransmission={handleSendRadioTransmission}
        vehicles={vehicles}
        channels={channels}
        onStartCall={handleStartRadioCall}
      />

      {/* Pre-Shift Equipment Inspection Modal */}
      {inspectingVehicle && (
        <EquipmentInspectionModal
          vehicle={inspectingVehicle}
          unitId={inspectingVehicle.id}
          onClose={() => setInspectingVehicle(null)}
          onSave={handleSaveVehicleInspection}
        />
      )}
    </div>
  );
}
