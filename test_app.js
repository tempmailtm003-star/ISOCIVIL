const INITIAL_CHANNELS = [
  { id: 'general', name: 'ERC Citywide Broadcast', category: 'Agency-Net', unreadCount: 0 },
  { id: 'inc-015', name: 'Downtown Chemical Spill', category: 'Incident-Tactical', incidentId: 'inc-015', unreadCount: 0 }
];

let channels = INITIAL_CHANNELS;

const handleReceiveMessage = (data) => {
  const { sender, message, incidentId } = data;
  let exists = false;
  let newChannels = channels.map(channel => {
    const isTargetGeneral = incidentId === 'general';
    const isTargetIncident = channel.incidentId === incidentId || channel.id === incidentId;
    
    if ((isTargetGeneral && channel.id === 'general') || (!isTargetGeneral && isTargetIncident)) {
       exists = true;
       return {
         ...channel,
         lastMessage: `${sender}: ${message}`,
         unreadCount: channel.unreadCount + 1
       };
    }
    return channel;
  });
  
  if (!exists && incidentId?.startsWith('direct-')) {
     const unitId = incidentId.replace('direct-', '');
     newChannels = [
       {
         id: incidentId,
         name: `📱 ${unitId} Direct Link`,
         category: 'Inter-Unit',
         unitIds: [unitId],
         description: 'Direct communications with dispatcher',
         lastMessage: `${sender}: ${message}`,
         unreadCount: 1
       },
       ...newChannels
     ];
  }
  channels = newChannels;
};

// Simulate mobile app sending direct-FE-12
handleReceiveMessage({ sender: 'FE-12', message: 'Hello', incidentId: 'direct-FE-12' });
console.log('After direct-FE-12:');
console.log(channels);

// Simulate mobile app sending undefined
handleReceiveMessage({ sender: 'FE-12', message: 'I have no incident', incidentId: undefined });
console.log('After undefined:');
console.log(channels);
