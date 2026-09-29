import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add socket imports
if (!code.includes('import { socket, connectSocket } from')) {
  code = code.replace("import { generateRoadWaypoints", "import { socket, connectSocket, disconnectSocket } from './socket';\nimport { generateRoadWaypoints");
}

// Inject socket effects into App component
const injectEffect = `
  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
      socket.emit('dispatcher:login');

      const handleStatusChanged = (data: any) => {
        const { unitId, status } = data;
        setVehicles(prev => prev.map(v => v.id === unitId ? { ...v, status } : v));
        setResources(prev => prev.map(r => r.id === unitId ? { ...r, status } : r));
      };
      
      const handleTelemetryUpdate = (data: any) => {
        const { unitId, telemetry } = data;
        setVehicles(prev => prev.map(v => v.id === unitId ? { 
           ...v, 
           lat: telemetry.lat, 
           lng: telemetry.lng, 
           fuel: telemetry.fuel 
        } : v));
      };

      socket.on('responder:status_changed', handleStatusChanged);
      socket.on('responder:telemetry_update', handleTelemetryUpdate);

      return () => {
        socket.off('responder:status_changed', handleStatusChanged);
        socket.off('responder:telemetry_update', handleTelemetryUpdate);
        disconnectSocket();
      };
    }
  }, [isAuthenticated]);
`;

if (!code.includes("socket.emit('dispatcher:login')")) {
  code = code.replace("const [radioSession, setRadioSession] = useState<RadioCallSession | null>(null);", "const [radioSession, setRadioSession] = useState<RadioCallSession | null>(null);\n" + injectEffect);
}

// Intercept dispatch vehicle
if (!code.includes("socket.emit('dispatcher:send_directive'")) {
  code = code.replace("const handleDispatchVehicle = (vehicleId: string, incidentId: string) => {", 
    `const handleDispatchVehicle = (vehicleId: string, incidentId: string) => {
    socket.emit('dispatcher:send_directive', {
      unitId: vehicleId,
      directive: \`DIRECTIVE: You have been dispatched to \${incidentId}. Acknowledge and proceed.\`
    });
`);
}

// Intercept start radio call (which we can use to trigger VoIP in the responder app)
// Wait, start radio call is complex.
if (!code.includes("socket.emit('dispatcher:call_unit'")) {
    code = code.replace("const handleStartRadioCall = (target: { type: 'Unit' | 'Channel'; id: string; name: string; vehicle?: Vehicle; channel?: ChatChannel }) => {",
    `const handleStartRadioCall = (target: { type: 'Unit' | 'Channel'; id: string; name: string; vehicle?: Vehicle; channel?: ChatChannel }) => {
    if (target.type === 'Unit') {
      socket.emit('dispatcher:call_unit', { unitId: target.id, callerName: 'ERC Command' });
    }
`);
}

fs.writeFileSync('src/App.tsx', code);
