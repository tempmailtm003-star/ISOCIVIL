import React, { useState, useMemo } from 'react';
import {
  X,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Flame,
  Stethoscope,
  Car,
  Fuel,
  Radio,
  Sparkles,
  RotateCcw,
  Clock,
  Gauge,
  UserCheck,
  FileText,
  Check,
  Wrench,
  Zap,
  Info
} from 'lucide-react';
import { Vehicle, EquipmentCheckItem, EquipmentInspectionRecord } from '../types';
import { getUnitCategory, getUnitStyles, playRadioChirp } from '../utils/tacticalUtils';
import { useTheme } from '../context/ThemeContext';

interface EquipmentInspectionModalProps {
  vehicle?: Partial<Vehicle> | null;
  unitId?: string;
  onClose: () => void;
  onSave: (record: EquipmentInspectionRecord, updateStatusToMaintenance?: boolean) => void;
}

const SHIFT_OPTIONS = [
  'Shift Alpha (Morning 06:00 - 14:00)',
  'Shift Bravo (Afternoon 14:00 - 22:00)',
  'Shift Charlie (Night 22:00 - 06:00)',
  'Emergency Tactical 24h Deployment'
];

export const getDefaultEquipmentList = (unitType: string): EquipmentCheckItem[] => {
  const cat = getUnitCategory(unitType);

  // Universal Base Equipment
  const baseItems: EquipmentCheckItem[] = [
    {
      id: 'base-1',
      name: 'Emergency Siren & 360° Tactical Lightbar',
      category: 'Critical',
      status: 'pass',
      required: true
    },
    {
      id: 'base-2',
      name: 'Tactical Dual-Band Radio & Roof Antenna Link',
      category: 'Communication',
      status: 'pass',
      required: true
    },
    {
      id: 'base-3',
      name: 'Onboard MDT / Tactical Terminal & GPS Beacon',
      category: 'Communication',
      status: 'pass',
      required: true
    },
    {
      id: 'base-4',
      name: 'Braking System, ABS & Emergency Parking Brake',
      category: 'Critical',
      status: 'pass',
      required: true
    },
    {
      id: 'base-5',
      name: 'Tire Tread Depth, Wheel Lugs & Pressure Balance',
      category: 'Vehicle',
      status: 'pass'
    },
    {
      id: 'base-6',
      name: 'Engine Oil, Coolant & Transmission Fluid Levels',
      category: 'Vehicle',
      status: 'pass'
    },
    {
      id: 'base-7',
      name: 'Dry Chemical / ABC Vehicle Fire Extinguisher (Charged)',
      category: 'Safety',
      status: 'pass',
      required: true
    },
    {
      id: 'base-8',
      name: 'High-Visibility Traffic Vests & LED Flare Wands',
      category: 'Safety',
      status: 'pass'
    }
  ];

  // Domain Specific Equipment
  let domainItems: EquipmentCheckItem[] = [];

  switch (cat) {
    case 'Fire':
      domainItems = [
        {
          id: 'fire-1',
          name: '10,000L High-Pressure Water/Foam Pump & Discharge Valves',
          category: 'Critical',
          status: 'pass',
          required: true
        },
        {
          id: 'fire-2',
          name: 'Hydraulic Extrication Rescue Cutters & Spreaders (Jaws of Life)',
          category: 'Rescue',
          status: 'pass',
          required: true
        },
        {
          id: 'fire-3',
          name: '4x SCBA Packs (300 Bar Full Air Cylinders & Masks)',
          category: 'Critical',
          status: 'pass',
          required: true
        },
        {
          id: 'fire-4',
          name: 'Thermal Imaging Camera (TIC) & Spare Battery Packs',
          category: 'Specialized',
          status: 'pass'
        },
        {
          id: 'fire-5',
          name: 'Attack Hose Reels, Fog Nozzles & Hydrant Wrenches',
          category: 'Rescue',
          status: 'pass'
        },
        {
          id: 'fire-6',
          name: 'Positive Pressure Smoke Ventilation Fan (PPV)',
          category: 'Specialized',
          status: 'pass'
        }
      ];
      break;

    case 'Ambulance':
      domainItems = [
        {
          id: 'amb-1',
          name: 'Biphasic Defibrillator / 12-Lead ECG Monitor & AED Pads',
          category: 'Critical',
          status: 'pass',
          required: true
        },
        {
          id: 'amb-2',
          name: 'Main & Portable Medical Oxygen Cylinders (2000+ PSI)',
          category: 'Critical',
          status: 'pass',
          required: true
        },
        {
          id: 'amb-3',
          name: 'Electric Suction Unit & Adult/Pediatric Intubation Kit',
          category: 'Medical',
          status: 'pass',
          required: true
        },
        {
          id: 'amb-4',
          name: 'Hydraulic Roll-In Stretcher & Spine Board / Cervical Collars',
          category: 'Medical',
          status: 'pass'
        },
        {
          id: 'amb-5',
          name: 'Advanced Trauma Resuscitation Bag & IV Fluid Warmers',
          category: 'Medical',
          status: 'pass'
        },
        {
          id: 'amb-6',
          name: 'Controlled Medication Vault & Cold Chain Insulin / Vials',
          category: 'Safety',
          status: 'pass'
        }
      ];
      break;

    case 'Police':
      domainItems = [
        {
          id: 'pol-1',
          name: 'Level-IV Ballistic Shields & Body Armor Sets',
          category: 'Critical',
          status: 'pass',
          required: true
        },
        {
          id: 'pol-2',
          name: 'Dual-Lens Dashcam & Officer Bodycam Dock Synchronization',
          category: 'Communication',
          status: 'pass',
          required: true
        },
        {
          id: 'pol-3',
          name: 'Tactical Spike Strips & Emergency Cordon Tape',
          category: 'Safety',
          status: 'pass'
        },
        {
          id: 'pol-4',
          name: 'Calibrated Breathalyzer & Rapid Narcotics Field Drug Test Kit',
          category: 'Specialized',
          status: 'pass'
        },
        {
          id: 'pol-5',
          name: 'Non-Lethal Defense Gear (Pepper Streamers & Baton)',
          category: 'Safety',
          status: 'pass'
        },
        {
          id: 'pol-6',
          name: 'Searchlight Spotlight & Megaphone Loudhailer',
          category: 'Specialized',
          status: 'pass'
        }
      ];
      break;

    case 'Hazmat':
      domainItems = [
        {
          id: 'haz-1',
          name: '4-Gas Multigas Air Quality Detector (Calibrated & Zeroed)',
          category: 'Critical',
          status: 'pass',
          required: true
        },
        {
          id: 'haz-2',
          name: 'Level-A Fully Encapsulated Vapor Protective Chemical Suits',
          category: 'Critical',
          status: 'pass',
          required: true
        },
        {
          id: 'haz-3',
          name: 'Rapid Decontamination Inflatable Shelter & Neutralizing Agent',
          category: 'Hazmat',
          status: 'pass'
        },
        {
          id: 'haz-4',
          name: 'Digital Radiation Dosimeters & Geiger-Müller Survey Probe',
          category: 'Specialized',
          status: 'pass',
          required: true
        },
        {
          id: 'haz-5',
          name: 'Chemical Spill Containment Booms, Magnetic Tank Plugs & Sorbents',
          category: 'Hazmat',
          status: 'pass'
        }
      ];
      break;

    case 'Rescue':
      domainItems = [
        {
          id: 'res-1',
          name: 'High-Pressure Pneumatic Heavy Lifting Air Bags (20 Ton)',
          category: 'Critical',
          status: 'pass',
          required: true
        },
        {
          id: 'res-2',
          name: 'Confined Space Aluminum Tripod & Fall Arrest Retrieval Winch',
          category: 'Rescue',
          status: 'pass',
          required: true
        },
        {
          id: 'res-3',
          name: 'Heavy Rotary Rescue Saw with Diamond Concrete Cutting Blades',
          category: 'Rescue',
          status: 'pass'
        },
        {
          id: 'res-4',
          name: 'Acoustic Collapse Search Sensor & Optical Borescope Camera',
          category: 'Specialized',
          status: 'pass'
        },
        {
          id: 'res-5',
          name: 'Static Kernmantle Life Safety Ropes, Pulleys & Harnesses',
          category: 'Safety',
          status: 'pass'
        }
      ];
      break;

    case 'Drone':
      domainItems = [
        {
          id: 'uav-1',
          name: 'Carbon-Fiber Propeller Blades (No Micro-Fractures or Warping)',
          category: 'Critical',
          status: 'pass',
          required: true
        },
        {
          id: 'uav-2',
          name: 'High-Resolution 4K Optical & FLIR Thermal Gimbal Camera',
          category: 'Specialized',
          status: 'pass',
          required: true
        },
        {
          id: 'uav-3',
          name: '4x Smart High-Capacity Flight Batteries (100% Charged & Balanced)',
          category: 'Critical',
          status: 'pass',
          required: true
        },
        {
          id: 'uav-4',
          name: 'Long-Range Encrypted C2 Command Link & Failsafe Return-to-Home',
          category: 'Communication',
          status: 'pass',
          required: true
        },
        {
          id: 'uav-5',
          name: 'Ground Control Station (GCS) Touchscreen & High-Gain Antennas',
          category: 'Communication',
          status: 'pass'
        }
      ];
      break;

    default:
      domainItems = [
        {
          id: 'gen-1',
          name: 'Heavy Duty Tow Straps & Shackle Winch System',
          category: 'Vehicle',
          status: 'pass'
        },
        {
          id: 'gen-2',
          name: 'Multi-Tool Mechanical Field Toolkit & Jumper Pack',
          category: 'Vehicle',
          status: 'pass'
        }
      ];
      break;
  }

  return [...baseItems, ...domainItems];
};

export const EquipmentInspectionModal: React.FC<EquipmentInspectionModalProps> = ({
  vehicle,
  unitId,
  onClose,
  onSave
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const effectiveUnitId = (unitId || vehicle?.id || 'FE-12').toUpperCase().trim();
  const effectiveType = vehicle?.type || (effectiveUnitId.startsWith('FE') ? 'Fire' : effectiveUnitId.startsWith('AMB') ? 'Ambulance' : effectiveUnitId.startsWith('PV') || effectiveUnitId.startsWith('SWAT') ? 'Police' : 'Fire');
  const unitCategory = getUnitCategory(effectiveType || effectiveUnitId);
  const unitStyles = getUnitStyles(effectiveType || effectiveUnitId, isDark);

  const [inspectorName, setInspectorName] = useState(vehicle?.driver || 'Officer in Charge');
  const [selectedShift, setSelectedShift] = useState(SHIFT_OPTIONS[0]);
  const [odometer, setOdometer] = useState<number>(24850);
  const [fuelLevel, setFuelLevel] = useState<number>(vehicle?.fuel ?? 92);
  const [items, setItems] = useState<EquipmentCheckItem[]>(() => getDefaultEquipmentList(effectiveType || effectiveUnitId));
  const [generalNotes, setGeneralNotes] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [autoGroundOnFail, setAutoGroundOnFail] = useState<boolean>(true);

  // Compute stats
  const totalCount = items.length;
  const passCount = items.filter(i => i.status === 'pass').length;
  const warningCount = items.filter(i => i.status === 'warning').length;
  const failCount = items.filter(i => i.status === 'fail').length;
  const readinessPercent = Math.round((passCount / totalCount) * 100);

  // Overall suggested status
  const overallVerdict: 'passed' | 'advisory' | 'failed_grounded' = useMemo(() => {
    const criticalFailed = items.some(i => i.required && i.status === 'fail');
    if (failCount >= 2 || criticalFailed) {
      return 'failed_grounded';
    }
    if (warningCount > 0 || failCount === 1) {
      return 'advisory';
    }
    return 'passed';
  }, [items, failCount, warningCount]);

  const handleSetItemStatus = (itemId: string, newStatus: 'pass' | 'warning' | 'fail') => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return { ...item, status: newStatus };
        }
        return item;
      })
    );
  };

  const handleSetItemNotes = (itemId: string, notes: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return { ...item, notes };
        }
        return item;
      })
    );
  };

  const handlePassAll = () => {
    playRadioChirp('roger');
    setItems(prev => prev.map(item => ({ ...item, status: 'pass' })));
  };

  const handleReset = () => {
    playRadioChirp('disconnect');
    setItems(getDefaultEquipmentList(effectiveType || effectiveUnitId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playRadioChirp(overallVerdict === 'failed_grounded' ? 'alert' : 'roger');

    const record: EquipmentInspectionRecord = {
      id: `INSP-${Date.now()}-${effectiveUnitId}`,
      vehicleId: effectiveUnitId,
      vehicleName: vehicle?.name || `${effectiveUnitId} Emergency Unit`,
      vehicleType: effectiveType,
      inspectorName: inspectorName.trim() || 'Duty Officer',
      shift: selectedShift,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      odometer,
      fuelLevel,
      overallStatus: overallVerdict,
      items,
      generalNotes: generalNotes.trim()
    };

    const shouldGround = autoGroundOnFail && overallVerdict === 'failed_grounded';
    onSave(record, shouldGround);
    onClose();
  };

  // Categories present in current checklist
  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map(i => i.category)));
    return ['All', ...cats];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategoryFilter === 'All') return items;
    return items.filter(i => i.category === activeCategoryFilter);
  }, [items, activeCategoryFilter]);

  const getTypeIcon = () => {
    switch (unitCategory) {
      case 'Fire':
        return <Flame size={18} className="text-red-400" />;
      case 'Ambulance':
        return <Stethoscope size={18} className="text-emerald-400" />;
      case 'Police':
        return <Shield size={18} className="text-blue-400" />;
      default:
        return <Car size={18} className="text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div
        className={`border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden ${
          isDark
            ? 'bg-[#0b1220] border-[#1f2e4a] text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex justify-between items-center px-4 py-3 sm:px-5 sm:py-3.5 border-b shrink-0 ${
            isDark ? 'border-[#1b2a45] bg-[#070b14]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shadow-xs ${
                isDark ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
              }`}
            >
              <ClipboardCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-sm sm:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Pre-Shift Equipment Inspection
                </h3>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {effectiveUnitId}
                </span>
              </div>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Record fleet operational readiness & safety checks before deployment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white bg-[#131e33] hover:bg-[#1a2b4a]'
                : 'text-slate-500 hover:text-slate-900 bg-slate-200/70 hover:bg-slate-300'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Top Quick Status Banner */}
          <div
            className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
              overallVerdict === 'passed'
                ? isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : overallVerdict === 'advisory'
                ? isDark
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
                : isDark
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {overallVerdict === 'passed' && <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />}
              {overallVerdict === 'advisory' && <AlertTriangle size={20} className="text-amber-400 shrink-0" />}
              {overallVerdict === 'failed_grounded' && <XCircle size={20} className="text-rose-400 shrink-0" />}
              <div>
                <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>
                    {overallVerdict === 'passed' && 'Fully Cleared for Active Duty'}
                    {overallVerdict === 'advisory' && 'Deployable with Advisory Items'}
                    {overallVerdict === 'failed_grounded' && 'Critical Failure — Vehicle Grounded'}
                  </span>
                </div>
                <div className="text-[11px] opacity-90">
                  {readinessPercent}% Readiness Score ({passCount} Pass, {warningCount} Warning, {failCount} Fail)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePassAll}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles size={13} />
                <span>Pass All Items</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className={`p-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
                title="Reset Checklist"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Officer & Vehicle Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Inspector / Call Sign
              </label>
              <div className="relative">
                <UserCheck size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  required
                  value={inspectorName}
                  onChange={e => setInspectorName(e.target.value)}
                  placeholder="Officer Name"
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-medium border focus:ring-1 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-[#111a2e] border-[#1d2b45] text-slate-200'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Assigned Shift
              </label>
              <select
                value={selectedShift}
                onChange={e => setSelectedShift(e.target.value)}
                className={`w-full py-1.5 px-2 rounded-xl text-xs font-medium border focus:ring-1 focus:ring-blue-500 ${
                  isDark
                    ? 'bg-[#111a2e] border-[#1d2b45] text-slate-200'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {SHIFT_OPTIONS.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Odometer / Hours
              </label>
              <div className="relative">
                <Gauge size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="number"
                  value={odometer}
                  onChange={e => setOdometer(Number(e.target.value))}
                  placeholder="KM"
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-mono border focus:ring-1 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-[#111a2e] border-[#1d2b45] text-slate-200'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>Fuel / Battery Level</span>
                <span className="font-mono text-blue-400 font-bold">{fuelLevel}%</span>
              </label>
              <div className="flex items-center gap-2 pt-1">
                <Fuel size={13} className={fuelLevel > 40 ? 'text-emerald-400' : 'text-amber-400'} />
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={fuelLevel}
                  onChange={e => setFuelLevel(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Checklist Filter Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-400">
                <ClipboardCheck size={13} className="text-blue-400" />
                <span>Verification Checklist</span>
                <span className="text-[10px] font-normal lowercase text-slate-500">
                  ({items.length} safety items)
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-none pb-0.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors cursor-pointer shrink-0 ${
                      activeCategoryFilter === cat
                        ? 'bg-blue-500 text-slate-950 font-bold'
                        : isDark
                        ? 'bg-[#121c30] text-slate-400 hover:text-white border border-[#1b2b46]'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist Items Container */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredItems.map(item => {
                const isItemPass = item.status === 'pass';
                const isItemWarning = item.status === 'warning';
                const isItemFail = item.status === 'fail';

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isItemFail
                        ? isDark
                          ? 'bg-rose-950/30 border-rose-500/40'
                          : 'bg-rose-50 border-rose-200'
                        : isItemWarning
                        ? isDark
                          ? 'bg-amber-950/30 border-amber-500/40'
                          : 'bg-amber-50 border-amber-200'
                        : isDark
                        ? 'bg-[#0f172a]/70 border-[#1a2740] hover:border-slate-700'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold text-xs truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {item.name}
                          </span>
                          {item.required && (
                            <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                              Critical
                            </span>
                          )}
                          <span className={`text-[9px] uppercase px-1 py-0.2 rounded font-mono ${
                            isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Status Toggle Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSetItemStatus(item.id, 'pass')}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                            isItemPass
                              ? 'bg-emerald-500 text-emerald-950 shadow-xs'
                              : isDark
                              ? 'bg-[#152238] text-slate-400 hover:text-emerald-300 border border-[#213352]'
                              : 'bg-slate-100 text-slate-500 hover:text-emerald-700 border border-slate-200'
                          }`}
                          title="Operational / Passed"
                        >
                          <Check size={12} />
                          <span>Pass</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetItemStatus(item.id, 'warning')}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                            isItemWarning
                              ? 'bg-amber-400 text-amber-950 shadow-xs'
                              : isDark
                              ? 'bg-[#152238] text-slate-400 hover:text-amber-300 border border-[#213352]'
                              : 'bg-slate-100 text-slate-500 hover:text-amber-700 border border-slate-200'
                          }`}
                          title="Minor Advisory / Usable"
                        >
                          <AlertTriangle size={12} />
                          <span>Warn</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetItemStatus(item.id, 'fail')}
                          className={`px-2 py-1 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                            isItemFail
                              ? 'bg-rose-500 text-rose-950 shadow-xs'
                              : isDark
                              ? 'bg-[#152238] text-slate-400 hover:text-rose-300 border border-[#213352]'
                              : 'bg-slate-100 text-slate-500 hover:text-rose-700 border border-slate-200'
                          }`}
                          title="Inoperable / Failed"
                        >
                          <XCircle size={12} />
                          <span>Fail</span>
                        </button>
                      </div>
                    </div>

                    {/* Defect note input if not passed */}
                    {(isItemWarning || isItemFail) && (
                      <div className="mt-2 pt-2 border-t border-dashed border-slate-700/50">
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={e => handleSetItemNotes(item.id, e.target.value)}
                          placeholder={`Specify defect or observation for ${item.name}...`}
                          className={`w-full px-2.5 py-1 rounded-lg text-[11px] border focus:ring-1 focus:ring-blue-500 ${
                            isDark
                              ? 'bg-[#111a2e] border-slate-700 text-slate-200 placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* General Inspection Remarks & Grounding Option */}
          <div className="space-y-2 pt-1 border-t border-slate-800/60">
            <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <FileText size={12} />
              <span>Shift Handover Remarks & Defect Summary</span>
            </label>
            <textarea
              rows={2}
              value={generalNotes}
              onChange={e => setGeneralNotes(e.target.value)}
              placeholder="e.g. Clean interior sanitized; secondary oxygen bottle refilled; slight squeak on rear passenger door latch noted for maintenance."
              className={`w-full p-2.5 rounded-xl text-xs border focus:ring-1 focus:ring-blue-500 ${
                isDark
                  ? 'bg-[#111a2e] border-[#1d2b45] text-slate-200 placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />

            {overallVerdict === 'failed_grounded' && (
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                  isDark
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <input
                  type="checkbox"
                  id="autoGroundCheck"
                  checked={autoGroundOnFail}
                  onChange={e => setAutoGroundOnFail(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="autoGroundCheck" className="cursor-pointer font-medium leading-tight">
                  Automatically set unit status to <strong className="uppercase">Maintenance</strong> and lock from active CAD dispatch.
                </label>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={`pt-2 flex items-center gap-2 border-t ${isDark ? 'border-[#1b2a45]' : 'border-slate-200'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 font-bold rounded-xl text-xs transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
                overallVerdict === 'failed_grounded'
                  ? 'bg-rose-500 hover:bg-rose-400 text-rose-950 border border-rose-400'
                  : overallVerdict === 'advisory'
                  ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 border border-amber-300'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-emerald-950 border border-emerald-300'
              }`}
            >
              <ClipboardCheck size={14} />
              <span>
                {overallVerdict === 'failed_grounded'
                  ? 'Sign Off as Grounded (Maintenance)'
                  : overallVerdict === 'advisory'
                  ? 'Sign Off with Advisories'
                  : 'Complete & Sign Off Inspection'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
