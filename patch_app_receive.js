import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
      const handleReceiveMessage = (data: any) => {
        const { sender, message, incidentId } = data;
        setChannels(prev => prev.map(channel => {
          // If the message is specifically for general, only update general.
          // If the message is specifically for an incident, only update that incident.
          const isTargetGeneral = incidentId === 'general';
          const isTargetIncident = channel.incidentId === incidentId || channel.id === incidentId;
          
          if ((isTargetGeneral && channel.id === 'general') || (!isTargetGeneral && isTargetIncident)) {
             return {
               ...channel,
               lastMessage: \`\${sender}: \${message}\`,
               lastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
               unreadCount: (channel.unreadCount || 0) + (channel.id !== activeChannelId ? 1 : 0)
             };
          }
          return channel;
        }));
      };
`;

code = code.replace(/const handleReceiveMessage = \([\s\S]*?return channel;\s*\}\)\);\s*\};/, replacement.trim());
fs.writeFileSync('src/App.tsx', code);
