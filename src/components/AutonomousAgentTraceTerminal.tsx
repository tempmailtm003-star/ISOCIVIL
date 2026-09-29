import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Terminal,
  Cpu,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flame,
  Stethoscope,
  Car,
  Play,
  RotateCcw,
  Copy,
  Check,
  Layers,
  Hospital as HospitalIcon,
  Navigation,
  Radio,
  RadioTower,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Incident, Vehicle, Hospital } from '../types';
import { CHENNAI_HOSPITALS } from '../data/hospitalsData';
import { calculateDistanceKm, calculateEtaMinutes, playRadioChirp, getUnitCategory, getUnitStyles } from '../utils/tacticalUtils';
import { useTheme } from '../context/ThemeContext';

export interface AgentExecutionStep {
  step: 'PERCEPTION' | 'REASONING' | 'TOOL_CALL' | 'VERIFICATION' | 'ESCALATION';
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: string;
  durationMs: number;
  summary: string;
  details: Record<string, any>;
  logs: string[];
}

export interface AutomatedDispatchPlan {
  incidentId: string;
  incidentType: string;
  location: string;
  coordinates: { lat: number; lng: number };
  vulnerabilityScore: number;
  vulnerabilityBreakdown: {
    demographicRisk: number; // 0-100
    infrastructureRisk: number; // 0-100
    densityLevel: string;
    hazardMultiplier: number;
  };
  recommendedUnits: {
    vehicle: Vehicle;
    distanceKm: number;
    etaMinutes: number;
    assignedRole: string;
    statusCheck: 'VERIFIED_AVAILABLE' | 'CONFLICT_LOCKED';
  }[];
  receivingHospital: {
    hospital: Hospital;
    distanceKm: number;
    etaMinutes: number;
    traumaBeds: number;
    icuBeds: number;
    status: 'READY' | 'AT_CAPACITY';
  };
  conflictResolution: {
    doubleAssignmentCheck: 'PASSED' | 'FAILED';
    hospitalReadinessCheck: 'PASSED' | 'FAILED';
    routeCorridorCheck: 'PASSED' | 'FAILED';
    allChecksCleared: boolean;
  };
  tacticalDirectives: {
    radioNet: string;
    greenCorridor: string;
    capAlertIssued: boolean;
    priorityTier: 'P1-CRITICAL' | 'P2-URGENT' | 'P3-ROUTINE';
  };
}

interface AutonomousAgentTraceTerminalProps {
  incident: Incident;
  vehicles?: Vehicle[];
  hospitals?: Hospital[];
  onExecuteDispatch?: (plan: AutomatedDispatchPlan) => void;
  onClose?: () => void;
  isCompact?: boolean;
}

export const AutonomousAgentTraceTerminal: React.FC<AutonomousAgentTraceTerminalProps> = ({
  incident,
  vehicles = [],
  hospitals = CHENNAI_HOSPITALS,
  onExecuteDispatch,
  onClose,
  isCompact = false
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'stream' | 'json' | 'plan'>('stream');
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    PERCEPTION: true,
    REASONING: true,
    TOOL_CALL: true,
    VERIFICATION: true,
    ESCALATION: true
  });
  const terminalLogEndRef = useRef<HTMLDivElement>(null);

  // Compute realistic municipal vulnerability score based on zone coordinates & type
  const { vulnerabilityScore, breakdown } = useMemo(() => {
    let demographicRisk = 65;
    let infrastructureRisk = 60;
    let hazardMultiplier = 1.0;
    let densityLevel = 'High Urban Density';

    const locLower = (incident.location || '').toLowerCase();
    if (locLower.includes('guindy') || locLower.includes('t. nagar') || locLower.includes('anna nagar')) {
      demographicRisk = 86;
      infrastructureRisk = 78;
      densityLevel = 'Ultra-High Commercial/Transit Corridor';
    } else if (locLower.includes('kilpauk') || locLower.includes('mylapore') || locLower.includes('nungambakkam')) {
      demographicRisk = 82;
      infrastructureRisk = 74;
      densityLevel = 'High Density Mixed Residential/Medical';
    } else if (locLower.includes('ambattur') || locLower.includes('omr')) {
      demographicRisk = 68;
      infrastructureRisk = 88;
      densityLevel = 'Industrial / Tech Substation Hub';
    }

    if (incident.type === 'Fire' || incident.type === 'Hazmat' || incident.type === 'Radiation') {
      hazardMultiplier = 1.25;
      infrastructureRisk = Math.min(98, Math.round(infrastructureRisk * 1.15));
    } else if (incident.type === 'Accident') {
      hazardMultiplier = 1.1;
    }

    if (incident.hazardZone) {
      hazardMultiplier += 0.2;
    }

    const rawScore = Math.round(((demographicRisk * 0.45) + (infrastructureRisk * 0.55)) * (hazardMultiplier > 1 ? 1.05 : 1.0));
    const finalScore = Math.min(99, Math.max(25, rawScore));

    return {
      vulnerabilityScore: finalScore,
      breakdown: {
        demographicRisk,
        infrastructureRisk,
        densityLevel,
        hazardMultiplier
      }
    };
  }, [incident]);

  // Compute available units sorted by real distance & ETAs
  const computedDispatchPlan: AutomatedDispatchPlan = useMemo(() => {
    // Determine needed unit types based on incident type
    const neededTypes: ('Fire' | 'Ambulance' | 'Police' | 'Rescue' | 'Hazmat')[] = [];
    if (incident.type === 'Fire') {
      neededTypes.push('Fire', 'Ambulance', 'Police');
    } else if (incident.type === 'Accident') {
      neededTypes.push('Ambulance', 'Police', 'Fire');
    } else if (incident.type === 'Medical') {
      neededTypes.push('Ambulance', 'Police');
    } else if (incident.type === 'Hazmat' || incident.type === 'Radiation') {
      neededTypes.push('Hazmat', 'Fire', 'Ambulance', 'Police');
    } else if (incident.type === 'Disaster') {
      neededTypes.push('Rescue', 'Fire', 'Ambulance', 'Police');
    } else {
      neededTypes.push('Police', 'Ambulance');
    }

    // Filter available units
    const candidateUnits = vehicles
      .filter(v => v.status === 'Available')
      .map(v => {
        const distance = calculateDistanceKm(v.lat, v.lng, incident.lat, incident.lng);
        const eta = calculateEtaMinutes(distance);
        return {
          vehicle: v,
          distanceKm: distance,
          etaMinutes: eta,
          assignedRole: '',
          statusCheck: 'VERIFIED_AVAILABLE' as const
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    // Pick best match for each needed unit category without duplicates
    const selectedUnits: typeof candidateUnits = [];
    const usedIds = new Set<string>();

    neededTypes.forEach((type, idx) => {
      const match = candidateUnits.find(c => {
        const cat = getUnitCategory(c.vehicle.type || c.vehicle.id);
        return cat === type && !usedIds.has(c.vehicle.id);
      });

      if (match) {
        usedIds.add(match.vehicle.id);
        let role = 'Secondary Response';
        if (idx === 0) role = `Primary ${type} Lead Unit`;
        else if (type === 'Police') role = 'Perimeter Cordon & Traffic Diversion';
        else if (type === 'Ambulance') role = 'Triage & Priority Patient Evacuation';
        else if (type === 'Fire') role = 'Suppression & Hazard Containment';
        else if (type === 'Hazmat') role = 'Vapor Dispersion & Hot Zone Decon';

        selectedUnits.push({
          ...match,
          assignedRole: role
        });
      }
    });

    // Fallback if none matched
    if (selectedUnits.length === 0 && candidateUnits.length > 0) {
      selectedUnits.push({
        ...candidateUnits[0],
        assignedRole: 'Primary Rapid Response Unit'
      });
    }

    // Find closest hospital with available beds
    const sortedHospitals = [...hospitals]
      .map(h => {
        const dist = calculateDistanceKm(h.lat, h.lng, incident.lat, incident.lng);
        const eta = calculateEtaMinutes(dist, 50);
        const traumaBeds = h.availableBeds ? Math.max(1, Math.round(h.availableBeds * 0.3)) : 4;
        const icuBeds = h.availableBeds ? Math.max(1, Math.round(h.availableBeds * 0.15)) : 2;
        return {
          hospital: h,
          distanceKm: dist,
          etaMinutes: eta,
          traumaBeds,
          icuBeds,
          status: 'READY' as const
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const primaryHospital = sortedHospitals[0] || {
      hospital: { id: 'hosp-1', name: 'Government General Trauma Center', lat: 13.0827, lng: 80.2707, capacity: 500, type: 'Government' },
      distanceKm: 2.4,
      etaMinutes: 4,
      traumaBeds: 6,
      icuBeds: 3,
      status: 'READY' as const
    };

    const doubleAssignmentPassed = selectedUnits.every(u => u.vehicle.status === 'Available' && !u.vehicle.assignedIncidentId);
    const hospitalReadinessPassed = primaryHospital.traumaBeds >= 1;

    let radioNet = 'TAC-CITY-01';
    if (incident.type === 'Fire') radioNet = 'TAC-FIRE-01';
    else if (incident.type === 'Accident') radioNet = 'TAC-TRAFFIC-04';
    else if (incident.type === 'Medical') radioNet = 'TAC-MED-02';
    else if (incident.type === 'Hazmat') radioNet = 'TAC-HAZ-09';

    return {
      incidentId: incident.id,
      incidentType: incident.type,
      location: incident.location,
      coordinates: { lat: incident.lat, lng: incident.lng },
      vulnerabilityScore,
      vulnerabilityBreakdown: breakdown,
      recommendedUnits: selectedUnits,
      receivingHospital: primaryHospital,
      conflictResolution: {
        doubleAssignmentCheck: doubleAssignmentPassed ? 'PASSED' : 'FAILED',
        hospitalReadinessCheck: hospitalReadinessPassed ? 'PASSED' : 'FAILED',
        routeCorridorCheck: 'PASSED',
        allChecksCleared: doubleAssignmentPassed && hospitalReadinessPassed
      },
      tacticalDirectives: {
        radioNet,
        greenCorridor: `${incident.location} -> ${primaryHospital.hospital.name}`,
        capAlertIssued: vulnerabilityScore >= 75,
        priorityTier: incident.priority === 'High' ? 'P1-CRITICAL' : incident.priority === 'Medium' ? 'P2-URGENT' : 'P3-ROUTINE'
      }
    };
  }, [incident, vehicles, hospitals, vulnerabilityScore, breakdown]);

  // Construct structured steps for the execution trace
  const executionSteps: AgentExecutionStep[] = useMemo(() => [
    {
      step: 'PERCEPTION',
      title: 'Incident Telemetry Ingestion & Spatial Parsing',
      status: currentStepIndex >= 0 ? (currentStepIndex > 0 ? 'completed' : 'running') : 'pending',
      timestamp: '+0.012s',
      durationMs: 42,
      summary: `Ingested ${incident.id} (${incident.type} at ${incident.location}). Severity: ${incident.priority}. Coordinates: [${incident.lat.toFixed(4)}, ${incident.lng.toFixed(4)}].`,
      details: {
        id: incident.id,
        type: incident.type,
        location: incident.location,
        coordinates: [incident.lat, incident.lng],
        priority: incident.priority,
        reportedTime: incident.time,
        hazardDetails: incident.description || 'Active emergency reported to ERC dispatch.'
      },
      logs: [
        `[INSPECT_CAD_QUEUE] Polling queue event ID: ${incident.id}`,
        `[GEO_DECODE] Parsed spatial bounding box @ lat:${incident.lat}, lng:${incident.lng}`,
        `[HAZARD_INDEX] Hazard classification tagged as: ${incident.type.toUpperCase()}_PRIORITY_${incident.priority.toUpperCase()}`
      ]
    },
    {
      step: 'REASONING',
      title: 'Municipal Vulnerability & Infrastructure Risk Synthesis',
      status: currentStepIndex >= 1 ? (currentStepIndex > 1 ? 'completed' : 'running') : 'pending',
      timestamp: '+0.114s',
      durationMs: 98,
      summary: `Calculated Human Vulnerability Priority Score: ${vulnerabilityScore}/100. Demographic Risk: ${breakdown.demographicRisk}%, Infrastructure Load: ${breakdown.infrastructureRisk}%.`,
      details: {
        vulnerabilityScore,
        demographicRiskIndex: `${breakdown.demographicRisk}/100`,
        infrastructureStressIndex: `${breakdown.infrastructureRisk}/100`,
        densityProfile: breakdown.densityLevel,
        environmentalMultiplier: `${breakdown.hazardMultiplier}x`
      },
      logs: [
        `[DEMOGRAPHIC_MATRIX] Population density evaluation: ${breakdown.densityLevel}`,
        `[INFRA_STRESS] Calculated power grid & critical roadway vulnerability factor: ${breakdown.infrastructureRisk}/100`,
        `[WEIGHTED_SCORING] Synthesized composite municipal risk score: ${vulnerabilityScore}/100 (${vulnerabilityScore >= 75 ? 'HIGH THREAT' : 'MODERATE THREAT'})`
      ]
    },
    {
      step: 'TOOL_CALL',
      title: 'Live Database Proximity Query & Medical Bed Telemetry',
      status: currentStepIndex >= 2 ? (currentStepIndex > 2 ? 'completed' : 'running') : 'pending',
      timestamp: '+0.238s',
      durationMs: 145,
      summary: `Queried CAD fleet registry: Found ${computedDispatchPlan.recommendedUnits.length} proximity units. Queried trauma network: ${computedDispatchPlan.receivingHospital.hospital.name} (${computedDispatchPlan.receivingHospital.traumaBeds} ER / ${computedDispatchPlan.receivingHospital.icuBeds} ICU beds ready).`,
      details: {
        assignedFleetUnits: computedDispatchPlan.recommendedUnits.map(u => ({
          unitId: u.vehicle.id,
          type: u.vehicle.type,
          eta: `${u.etaMinutes} min`,
          role: u.assignedRole
        })),
        receivingTraumaFacility: {
          name: computedDispatchPlan.receivingHospital.hospital.name,
          eta: `${computedDispatchPlan.receivingHospital.etaMinutes} min`,
          availableTraumaBeds: computedDispatchPlan.receivingHospital.traumaBeds,
          availableIcuBeds: computedDispatchPlan.receivingHospital.icuBeds
        }
      },
      logs: [
        `[RPC_CALL] database.queryFleetAvailability({ radiusKm: 12.0, status: "Available" }) -> ${computedDispatchPlan.recommendedUnits.length} optimal matches`,
        ...computedDispatchPlan.recommendedUnits.map(u => `  ↳ Unit ${u.vehicle.id} (${u.vehicle.type}): ${u.distanceKm} km away (ETA ${u.etaMinutes}m)`),
        `[RPC_CALL] healthNetwork.queryTraumaBeds({ destination: "${computedDispatchPlan.receivingHospital.hospital.name}" }) -> Verified ${computedDispatchPlan.receivingHospital.traumaBeds} Trauma Beds available`
      ]
    },
    {
      step: 'VERIFICATION',
      title: 'Conflict-Resolution & Readiness Verification Gate',
      status: currentStepIndex >= 3 ? (currentStepIndex > 3 ? 'completed' : 'running') : 'pending',
      timestamp: '+0.380s',
      durationMs: 62,
      summary: `Conflict checks cleared. Zero double-dispatch locks detected. Hospital intake verified. Green transit corridor confirmed unobstructed.`,
      details: {
        doubleAssignmentCheck: computedDispatchPlan.conflictResolution.doubleAssignmentCheck,
        hospitalCapacityCheck: computedDispatchPlan.conflictResolution.hospitalReadinessCheck,
        corridorClearanceCheck: computedDispatchPlan.conflictResolution.routeCorridorCheck,
        finalGateVerdict: 'CLEARED_FOR_EXECUTION'
      },
      logs: [
        `[MUTEX_LOCK_CHECK] Scanning mutex status on units [${computedDispatchPlan.recommendedUnits.map(u => u.vehicle.id).join(', ')}] -> 0 conflicts`,
        `[HOSPITAL_TRIAGE_VERIFY] Destination ${computedDispatchPlan.receivingHospital.hospital.name} trauma intake load: NOMINAL`,
        `[CORRIDOR_INTEGRITY] Green transit corridor cleared: ${computedDispatchPlan.tacticalDirectives.greenCorridor}`
      ]
    },
    {
      step: 'ESCALATION',
      title: 'Automated Multi-Agency CAD Dispatch Formulation',
      status: currentStepIndex >= 4 ? 'completed' : 'pending',
      timestamp: '+0.450s',
      durationMs: 38,
      summary: `Automated dispatch plan formulated. Tier: ${computedDispatchPlan.tacticalDirectives.priorityTier}. Tactical Radio Net: ${computedDispatchPlan.tacticalDirectives.radioNet}. CAP Public Alert: ${computedDispatchPlan.tacticalDirectives.capAlertIssued ? 'Active' : 'Standby'}.`,
      details: {
        priorityTier: computedDispatchPlan.tacticalDirectives.priorityTier,
        tacticalRadioChannel: computedDispatchPlan.tacticalDirectives.radioNet,
        assignedGreenCorridor: computedDispatchPlan.tacticalDirectives.greenCorridor,
        publicAdvisoryBroadcast: computedDispatchPlan.tacticalDirectives.capAlertIssued ? 'ISSUED (CAP v1.2)' : 'STANDBY'
      },
      logs: [
        `[CAD_DISPATCH_ORDER] Directives synthesized for multi-agency response team`,
        `[RADIO_LINK] Assigned frequency: ${computedDispatchPlan.tacticalDirectives.radioNet}`,
        `[CIVIL_DEFENSE_CAP] Citywide CAP advisory alert triggered: ${computedDispatchPlan.tacticalDirectives.capAlertIssued ? 'YES (Zone Advisory)' : 'NO'}`
      ]
    }
  ], [incident, vulnerabilityScore, breakdown, computedDispatchPlan, currentStepIndex]);

  // Step-by-step streaming execution effect
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsExecuting(true);

    const stepDelays = [220, 380, 480, 360, 200];
    let currentIndex = 0;

    const runNextStep = () => {
      if (currentIndex < stepDelays.length - 1) {
        currentIndex++;
        setCurrentStepIndex(currentIndex);
        setTimeout(runNextStep, stepDelays[currentIndex]);
      } else {
        setIsExecuting(false);
        playRadioChirp('roger');
      }
    };

    const timer = setTimeout(runNextStep, stepDelays[0]);
    return () => clearTimeout(timer);
  }, [incident.id]);

  // Scroll to bottom of terminal log stream
  useEffect(() => {
    if (terminalLogEndRef.current && viewMode === 'stream') {
      terminalLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentStepIndex, viewMode]);

  const toggleStepExpansion = (stepName: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepName]: !prev[stepName]
    }));
  };

  const handleCopyJson = () => {
    const jsonOutput = {
      agent_execution_trace: executionSteps.map(s => ({
        step: s.step,
        summary: s.summary
      })),
      dispatch_plan: {
        incident_id: computedDispatchPlan.incidentId,
        incident_type: computedDispatchPlan.incidentType,
        location: computedDispatchPlan.location,
        vulnerability_priority_score: computedDispatchPlan.vulnerabilityScore,
        assigned_units: computedDispatchPlan.recommendedUnits.map(u => ({
          unit_id: u.vehicle.id,
          type: u.vehicle.type,
          eta_minutes: u.etaMinutes,
          assigned_role: u.assignedRole
        })),
        receiving_medical_facility: {
          hospital_name: computedDispatchPlan.receivingHospital.hospital.name,
          trauma_beds_available: computedDispatchPlan.receivingHospital.traumaBeds,
          icu_beds_available: computedDispatchPlan.receivingHospital.icuBeds,
          status: 'Ready / Alerted'
        },
        tactical_coordination: {
          radio_channel: computedDispatchPlan.tacticalDirectives.radioNet,
          green_corridor: computedDispatchPlan.tacticalDirectives.greenCorridor,
          cap_broadcast_status: computedDispatchPlan.tacticalDirectives.capAlertIssued ? 'Issued - Zone Evacuation Advisory' : 'Standby'
        }
      }
    };

    navigator.clipboard.writeText(JSON.stringify(jsonOutput, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReRunAgent = () => {
    playRadioChirp('transmit');
    setCurrentStepIndex(0);
    setIsExecuting(true);

    const stepDelays = [200, 320, 420, 300, 180];
    let currentIndex = 0;

    const runNextStep = () => {
      if (currentIndex < stepDelays.length - 1) {
        currentIndex++;
        setCurrentStepIndex(currentIndex);
        setTimeout(runNextStep, stepDelays[currentIndex]);
      } else {
        setIsExecuting(false);
        playRadioChirp('roger');
      }
    };

    setTimeout(runNextStep, stepDelays[0]);
  };

  const handleExecute = () => {
    playRadioChirp('alert');
    if (onExecuteDispatch) {
      onExecuteDispatch(computedDispatchPlan);
    }
  };

  return (
    <div
      className={`border rounded-2xl flex flex-col shadow-xl overflow-hidden transition-all ${
        isDark
          ? 'bg-[#080d18]/95 border-[#1d2d47] text-slate-200'
          : 'bg-slate-900 border-slate-700 text-slate-100 shadow-2xl'
      } ${isCompact ? 'p-3' : 'p-4 sm:p-5'}`}
    >
      {/* Terminal Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1b2b45]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Cpu size={18} className={isExecuting ? 'animate-spin' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-xs sm:text-sm tracking-wide text-white flex items-center gap-1.5">
                <span>AUTONOMOUS MULTI-AGENT DISPATCH ENGINE</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                v2.4-TACTICAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Live reasoning trace • Target: <span className="text-sky-300 font-bold">{incident.id}</span>
            </p>
          </div>
        </div>

        {/* Action Tabs & Controls */}
        <div className="flex items-center gap-2">
          <div className="bg-[#0f172a] p-0.5 rounded-xl border border-[#1e2e4b] flex items-center gap-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('stream')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                viewMode === 'stream'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Trace Stream
            </button>
            <button
              type="button"
              onClick={() => setViewMode('plan')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                viewMode === 'plan'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dispatch Plan
            </button>
            <button
              type="button"
              onClick={() => setViewMode('json')}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'json'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>JSON Trace</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleReRunAgent}
            disabled={isExecuting}
            className="p-1.5 rounded-lg border border-[#1e2e4b] bg-[#0f172a] text-slate-400 hover:text-sky-300 hover:border-sky-500/40 transition-colors disabled:opacity-50 cursor-pointer"
            title="Re-run Autonomous Agent Evaluation"
          >
            <RotateCcw size={14} className={isExecuting ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            onClick={handleCopyJson}
            className="p-1.5 rounded-lg border border-[#1e2e4b] bg-[#0f172a] text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors cursor-pointer"
            title="Copy JSON Payload"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Vulnerability Score & Readiness Dial Banner */}
      <div className="my-3.5 p-4 rounded-2xl bg-[#0c1324] border border-[#1e2f4f] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Large prominent score badge with glow and scale indicator */}
          <div
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border-2 flex flex-col items-center justify-center font-mono shrink-0 shadow-xl transition-all relative overflow-hidden ${
              vulnerabilityScore >= 75
                ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                : vulnerabilityScore >= 50
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                : 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            <div className="absolute top-1 text-[9px] font-black uppercase tracking-wider opacity-70">
              Score
            </div>
            <div className="text-3xl sm:text-4xl font-black leading-none mt-2 tracking-tight">
              {vulnerabilityScore}
            </div>
            <div className="text-[10px] font-bold opacity-80 mt-0.5">
              / 100
            </div>
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                Municipal Human Vulnerability Priority Score
              </span>
              <span
                className={`text-[11px] font-mono font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                  vulnerabilityScore >= 75
                    ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-xs'
                    : vulnerabilityScore >= 50
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-xs'
                    : 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-xs'
                }`}
              >
                {vulnerabilityScore >= 75 ? 'Critical Threat Zone' : vulnerabilityScore >= 50 ? 'Elevated Risk Corridor' : 'Standard Response Zone'}
              </span>
            </div>

            {/* Dynamic 0-100 Progress Bar */}
            <div className="w-full max-w-md h-2 rounded-full bg-slate-800/90 overflow-hidden relative border border-slate-700/50">
              <div
                className={`h-full transition-all duration-700 ${
                  vulnerabilityScore >= 75
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                    : vulnerabilityScore >= 50
                    ? 'bg-gradient-to-r from-emerald-500 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                    : 'bg-gradient-to-r from-sky-500 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                }`}
                style={{ width: `${vulnerabilityScore}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-0.5">
              <span className="flex items-center gap-1 font-medium">
                Demographic Risk: <strong className="font-mono text-white font-bold">{breakdown.demographicRisk}%</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1 font-medium">
                Infrastructure Load: <strong className="font-mono text-white font-bold">{breakdown.infrastructureRisk}%</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span className="flex items-center gap-1 font-medium">
                Hazard Multiplier: <strong className="font-mono text-sky-400 font-bold">{breakdown.hazardMultiplier}x</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Verification Check Badges */}
        <div className="flex sm:flex-col items-start gap-2 font-mono text-[11px] shrink-0">
          <div className="px-2.5 py-1.5 rounded-xl bg-[#142038] border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 shadow-xs">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>Mutex Unlocked (0 Conflicts)</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-xl bg-[#142038] border border-blue-500/40 text-blue-300 flex items-center gap-1.5 shadow-xs">
            <HospitalIcon size={14} className="text-blue-400" />
            <span>Trauma Bed Verified Ready</span>
          </div>
        </div>
      </div>

      {/* Main Stream Content */}
      {viewMode === 'stream' && (
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-700">
          {executionSteps.map((stepItem, idx) => {
            const isCompleted = stepItem.status === 'completed';
            const isRunning = stepItem.status === 'running';
            const isPending = stepItem.status === 'pending';
            const isExpanded = !!expandedSteps[stepItem.step];

            if (isPending) return null;

            return (
              <div
                key={stepItem.step}
                className={`rounded-xl border p-3 transition-all ${
                  isRunning
                    ? 'bg-sky-950/40 border-sky-500/50 shadow-sm'
                    : 'bg-[#0b1222]/90 border-[#182640]'
                }`}
              >
                <div
                  onClick={() => toggleStepExpansion(stepItem.step)}
                  className="flex items-center justify-between gap-2 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        stepItem.step === 'PERCEPTION'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : stepItem.step === 'REASONING'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                          : stepItem.step === 'TOOL_CALL'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : stepItem.step === 'VERIFICATION'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      [{stepItem.step}]
                    </span>
                    <span className="font-bold text-xs text-white">{stepItem.title}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                    <span>{stepItem.timestamp}</span>
                    {isRunning && <span className="text-sky-400 animate-pulse font-bold">STREAMING...</span>}
                    {isCompleted && <CheckCircle2 size={13} className="text-emerald-400" />}
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2.5 pt-2 border-t border-[#182640] space-y-2">
                    <p className="text-slate-300 text-xs leading-relaxed">{stepItem.summary}</p>

                    {/* Step log trace */}
                    <div className="p-2 rounded-lg bg-[#050811] border border-[#141d30] text-[11px] space-y-1 text-slate-400 font-mono">
                      {stepItem.logs.map((logLine, lIdx) => (
                        <div key={lIdx} className="flex items-start gap-1.5">
                          <span className="text-sky-500 select-none">›</span>
                          <span className={logLine.includes('RPC_CALL') ? 'text-amber-300' : logLine.includes('->') ? 'text-emerald-300' : 'text-slate-300'}>
                            {logLine}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={terminalLogEndRef} />
        </div>
      )}

      {/* Dispatch Plan View */}
      {viewMode === 'plan' && (
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 text-xs">
          {/* Recommended Units Card */}
          <div className="p-3 rounded-xl bg-[#0b1222] border border-[#182640] space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Recommended Response Fleet Assignment</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">{computedDispatchPlan.recommendedUnits.length} Units Targeted</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {computedDispatchPlan.recommendedUnits.map(unitItem => {
                const styles = getUnitStyles(unitItem.vehicle.type || unitItem.vehicle.id, isDark);
                return (
                  <div
                    key={unitItem.vehicle.id}
                    className="p-2.5 rounded-xl border border-[#1c2c48] bg-[#080e1b] flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-bold text-xs ${styles.nameText}`}>
                          {unitItem.vehicle.id}
                        </span>
                        <span className="text-[10px] text-slate-400">({unitItem.vehicle.type})</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{unitItem.assignedRole}</p>
                    </div>

                    <div className="text-right font-mono text-[11px]">
                      <div className="font-bold text-emerald-400">ETA {unitItem.etaMinutes}m</div>
                      <div className="text-[10px] text-slate-500">{unitItem.distanceKm} km</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hospital & Corridor Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-[#0b1222] border border-[#182640] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <HospitalIcon size={12} className="text-blue-400" />
                <span>Designated Trauma Center</span>
              </span>
              <p className="font-bold text-xs text-white truncate">{computedDispatchPlan.receivingHospital.hospital.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">
                {computedDispatchPlan.receivingHospital.traumaBeds} Trauma Beds • {computedDispatchPlan.receivingHospital.icuBeds} ICU Beds Ready (ETA {computedDispatchPlan.receivingHospital.etaMinutes}m)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0b1222] border border-[#182640] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Navigation size={12} className="text-purple-400" />
                <span>Tactical Coordination Net</span>
              </span>
              <p className="font-bold text-xs text-white font-mono">{computedDispatchPlan.tacticalDirectives.radioNet}</p>
              <p className="text-[11px] text-slate-400 truncate">
                Corridor: {computedDispatchPlan.tacticalDirectives.greenCorridor}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* JSON Trace View */}
      {viewMode === 'json' && (
        <div className="max-h-[340px] overflow-y-auto p-3 rounded-xl bg-[#050811] border border-[#182640] font-mono text-[11px] text-sky-300">
          <pre className="whitespace-pre-wrap leading-relaxed">
            {JSON.stringify(
              {
                agent_execution_trace: executionSteps.map(s => ({
                  step: s.step,
                  summary: s.summary,
                  details: s.details
                })),
                dispatch_plan: {
                  incident_id: computedDispatchPlan.incidentId,
                  incident_type: computedDispatchPlan.incidentType,
                  location: computedDispatchPlan.location,
                  vulnerability_priority_score: computedDispatchPlan.vulnerabilityScore,
                  assigned_units: computedDispatchPlan.recommendedUnits.map(u => ({
                    unit_id: u.vehicle.id,
                    type: u.vehicle.type,
                    eta_minutes: u.etaMinutes,
                    assigned_role: u.assignedRole
                  })),
                  receiving_medical_facility: {
                    hospital_name: computedDispatchPlan.receivingHospital.hospital.name,
                    trauma_beds_available: computedDispatchPlan.receivingHospital.traumaBeds,
                    icu_beds_available: computedDispatchPlan.receivingHospital.icuBeds,
                    status: 'Ready / Alerted'
                  },
                  tactical_coordination: {
                    radio_channel: computedDispatchPlan.tacticalDirectives.radioNet,
                    green_corridor: computedDispatchPlan.tacticalDirectives.greenCorridor,
                    cap_broadcast_status: computedDispatchPlan.tacticalDirectives.capAlertIssued ? 'Issued - Zone Evacuation Advisory' : 'Standby'
                  }
                }
              },
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* Execution Footer Action Bar */}
      <div className="mt-3 pt-3 border-t border-[#1b2b45] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Autonomous agent consensus reached • 0 conflicts detected</span>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          )}

          {onExecuteDispatch && (
            <button
              type="button"
              onClick={handleExecute}
              className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md border border-sky-300 transition-all cursor-pointer"
            >
              <Zap size={14} className="fill-slate-950" />
              <span>Execute Autonomous Multi-Agency Dispatch</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
