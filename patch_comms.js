import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
  const handleOpenCommsWithVehicle = (vehicleId: string) => {
    // Find or create direct inter-unit channel
    const targetVehicle = vehicles.find(v => v.id === vehicleId);
    const expectedId = \`direct-\${vehicleId}\`;
    const existing = channels.find(c => c.id === expectedId);

    if (existing) {
      setActiveChannelId(existing.id);
    } else {
      const channelId = expectedId;
      const newCh: ChatChannel = {
        id: channelId,
        name: \`\${targetVehicle ? (targetVehicle.type.includes('Fire') ? '🚒' : targetVehicle.type.includes('Police') ? '🚔' : '🚑') : '📱'} \${vehicleId} Direct Link\`,
        category: 'Inter-Unit',
        unitIds: [vehicleId, 'HQ-Control'],
        description: \`Direct communications with dispatcher\`,
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
`;

code = code.replace(/const handleOpenCommsWithVehicle = \([\s\S]*?playRadioChirp\('roger'\);\s*\};/, replacement.trim());
fs.writeFileSync('src/App.tsx', code);
