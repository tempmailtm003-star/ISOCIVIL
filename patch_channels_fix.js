import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
  useEffect(() => {
    setChannels(prev => {
      const newChannels = incidents.filter(inc => !prev.some(c => c.incidentId === inc.id)).map(inc => ({
         id: \`inc-\${inc.id}\`,
         name: \`🚨 [\${inc.id.split('-')[2]}] \${inc.type} Ops\`,
         category: 'Incident-Tactical' as const,
         incidentId: inc.id,
         unitIds: [],
         description: \`Tactical comms for \${inc.location}\`,
         lastMessage: 'Channel established.',
         lastTime: inc.time,
         unreadCount: 0
      }));
      if (newChannels.length > 0) return [...prev, ...newChannels];
      return prev;
    });
  }, [incidents]);

  useEffect(() => {
    if (activeChannelId === 'inc-015' && channels.length > 1) {
      const incChan = channels.find(c => c.category === 'Incident-Tactical');
      if (incChan) setActiveChannelId(incChan.id);
    }
  }, [channels, activeChannelId]);
`;

code = code.replace(/useEffect\(\(\) => \{\s*\/\/ Generate channels[\s\S]*?\}, \[incidents, channels, activeChannelId\]\);/, replacement.trim());

// We should also initialize selectedIncidentId correctly, as INC-2025-015 is gone.
code = code.replace(/const \[selectedIncidentId, setSelectedIncidentId\] = useState<string>\('INC-2025-015'\);/, "const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');");

// And set initial selected incident to the first one available
const selectedIncidentFix = `
  useEffect(() => {
    if (!selectedIncidentId && incidents.length > 0) {
      setSelectedIncidentId(incidents[0].id);
    }
  }, [incidents, selectedIncidentId]);
`;

code = code.replace("const [showAddResource, setShowAddResource] = useState(false);", "const [showAddResource, setShowAddResource] = useState(false);\n" + selectedIncidentFix.trim());


fs.writeFileSync('src/App.tsx', code);
