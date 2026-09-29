import fs from 'fs';

const viewsContent = `
export const IncidentHistoryView: React.FC<{
  incidents: Incident[];
  onViewIncident: (inc: Incident) => void;
}> = ({ incidents, onViewIncident }) => {
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
          <h2 className="text-lg font-bold text-slate-100">Incident History</h2>
          <p className="text-xs text-slate-400">Comprehensive log of resolved and closed incidents</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search history..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[#111927] border border-[#1d2a42] text-xs text-slate-200 pl-8 pr-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 w-40 sm:w-56"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#0b101d] border border-[#172338] rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#0e1626]/80 text-slate-400 text-[11px] font-semibold uppercase tracking-wider border-b border-[#172338]">
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
          <tbody className="divide-y divide-[#151f32] text-slate-300">
            {filtered.map(inc => (
              <tr key={inc.id} className="hover:bg-[#111927]/60 transition-colors">
                <td className="px-5 py-3.5 font-mono font-medium text-slate-200">{inc.id}</td>
                <td className="px-4 py-3.5 font-medium">{inc.type}</td>
                <td className="px-5 py-3.5 text-slate-300">{inc.location}</td>
                <td className="px-4 py-3.5 text-slate-400 font-mono">
                   {inc.time} - {inc.resolvedDetails?.time || 'N/A'}
                </td>
                <td className="px-4 py-3.5 text-blue-300">
                   {inc.resolvedDetails?.responders?.join(', ') || inc.dispatch || 'N/A'}
                </td>
                <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate" title={inc.resolvedDetails?.actionSummary || inc.description}>
                   {inc.resolvedDetails?.actionSummary || inc.description || 'Resolved.'}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <button
                    onClick={() => onViewIncident(inc)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors inline-flex"
                  >
                    <Eye size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100">User Manual & Standard Operating Procedures</h2>
        <p className="text-xs text-slate-400">Complete guide to platform usage, operational procedures, and incident requirements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Platform Usage Guide */}
        <div className="bg-[#0b101d] border border-[#172338] rounded-2xl p-5 md:col-span-2">
           <h3 className="font-bold text-indigo-400 mb-4 flex items-center gap-2">
            <LayoutDashboard size={18} /> How to Use This Platform
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
             <div className="bg-[#0e1626] p-3.5 rounded-xl border border-[#1a2942]">
                <h4 className="font-bold text-slate-100 mb-2 flex items-center gap-1.5"><AlertTriangle size={14} className="text-red-400"/> Managing Incidents</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Incidents are monitored via the <strong>Dashboard</strong> or <strong>Live Tracking</strong> map. Only <i>Active</i> incidents are shown. Once all required responders arrive and complete their operations (approx. 5-10 mins), the incident automatically routes to the <strong>Incident History</strong> archive.
                </p>
             </div>
             <div className="bg-[#0e1626] p-3.5 rounded-xl border border-[#1a2942]">
                <h4 className="font-bold text-slate-100 mb-2 flex items-center gap-1.5"><Zap size={14} className="text-blue-400"/> Proximity Dispatch</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Use the <strong>Nearby Units Panel</strong> on the Dashboard. Select a target incident, and it will calculate ETA for all field vehicles. Click <strong>Dispatch Required Units</strong> to instantly automatically dispatch the optimal units based on the incident's SOP.
                </p>
             </div>
             <div className="bg-[#0e1626] p-3.5 rounded-xl border border-[#1a2942]">
                <h4 className="font-bold text-slate-100 mb-2 flex items-center gap-1.5"><MessageSquare size={14} className="text-emerald-400"/> Tactical Communications</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Go to <strong>Secure Chat</strong> to monitor encrypted comms. Use <strong>Quick Directives</strong> to instantly broadcast commands (e.g. "Expedite Route", "Request Backup") to responders on a specific incident net.
                </p>
             </div>
          </div>
        </div>

        {/* Existing SOPs */}
        <div className="bg-[#0b101d] border border-[#172338] rounded-2xl p-5">
          <h3 className="font-bold text-blue-400 mb-4 flex items-center gap-2">
            <ShieldAlert size={18} /> Incident Types & Required Responses
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="bg-[#111927] p-3 rounded-xl border border-[#1d2a42]">
              <div className="font-bold text-slate-100 mb-1">Accidents</div>
              <p className="text-xs text-slate-400 mb-2">Vehicular collisions and transport-related emergencies.</p>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold tracking-wide uppercase">1+ Ambulance</span>
                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold tracking-wide uppercase">1+ Police</span>
              </div>
            </div>
            <div className="bg-[#111927] p-3 rounded-xl border border-[#1d2a42]">
              <div className="font-bold text-slate-100 mb-1">Fires</div>
              <p className="text-xs text-slate-400 mb-2">Structural, electrical, and industrial fires.</p>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold tracking-wide uppercase">1-2+ Fire Engine</span>
                <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold tracking-wide uppercase">1+ Police</span>
              </div>
            </div>
            <div className="bg-[#111927] p-3 rounded-xl border border-[#1d2a42]">
              <div className="font-bold text-slate-100 mb-1">Medical</div>
              <p className="text-xs text-slate-400 mb-2">Health emergencies requiring immediate life support.</p>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold tracking-wide uppercase">1+ Ambulance</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0b101d] border border-[#172338] rounded-2xl p-5">
           <h3 className="font-bold text-emerald-400 mb-4 flex items-center gap-2">
            <Navigation size={18} /> Field Operations & Logic
          </h3>
          <div className="space-y-4 text-sm text-slate-300">
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
`;

let code = fs.readFileSync('src/components/Views.tsx', 'utf8');

// Also need to import LayoutDashboard, MessageSquare, ShieldAlert if not imported
if(!code.includes('LayoutDashboard')) {
   code = code.replace("import {", "import {\n  LayoutDashboard,\n  MessageSquare,\n  ShieldAlert,\n");
}

if (!code.includes('export const ManualView')) {
  fs.writeFileSync('src/components/Views.tsx', code + viewsContent);
  console.log('Appended Views');
} else {
  console.log('Already exists');
}
