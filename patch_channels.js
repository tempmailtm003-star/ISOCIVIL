import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const replaceChannels = `
const INITIAL_CHANNELS: ChatChannel[] = [
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
`;

code = code.replace(/const INITIAL_CHANNELS: ChatChannel\[\] = \[[\s\S]*?\];/m, replaceChannels);

const generateChannelsEffect = `
  useEffect(() => {
    // Generate channels for all incidents if they don't exist
    const newChannels = incidents.filter(inc => !channels.some(c => c.incidentId === inc.id)).map(inc => ({
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
    
    if (newChannels.length > 0) {
      setChannels(prev => [...prev, ...newChannels]);
      // If we don't have an active channel besides general, set to first incident
      if (activeChannelId === 'inc-015' && newChannels.length > 0) {
         setActiveChannelId(newChannels[0].id);
      }
    }
  }, [incidents, channels, activeChannelId]);
`;

code = code.replace("const [showAddResource, setShowAddResource] = useState(false);", "const [showAddResource, setShowAddResource] = useState(false);\n" + generateChannelsEffect);

fs.writeFileSync('src/App.tsx', code);
