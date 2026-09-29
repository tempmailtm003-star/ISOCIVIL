import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
      const handleReceiveMessage = (data: any) => {
        const { sender, message, incidentId } = data;
        setChannels(prev => {
          let exists = false;
          let newChannels = prev.map(channel => {
            const isTargetGeneral = incidentId === 'general';
            const isTargetIncident = incidentId && (channel.incidentId === incidentId || channel.id === incidentId);
            
            if ((isTargetGeneral && channel.id === 'general') || (!isTargetGeneral && isTargetIncident)) {
               exists = true;
               return {
                 ...channel,
                 lastMessage: \`\${sender}: \${message}\`,
                 lastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                 unreadCount: (channel.unreadCount || 0) + (channel.id !== activeChannelId ? 1 : 0)
               };
            }
            return channel;
          });
          
          if (!exists && incidentId?.startsWith('direct-')) {
             const unitId = incidentId.replace('direct-', '');
             const unit = vehicles.find(v => v.id === unitId);
             newChannels = [
               {
                 id: incidentId,
                 name: \`\${unit ? (unit.type.includes('Fire') ? '🚒' : unit.type.includes('Police') ? '🚔' : '🚑') : '📱'} \${unitId} Direct Link\`,
                 category: 'Inter-Unit',
                 unitIds: [unitId],
                 description: 'Direct communications with dispatcher',
                 lastMessage: \`\${sender}: \${message}\`,
                 lastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                 unreadCount: 1
               },
               ...newChannels
             ];
          }
          return newChannels;
        });
      };
`;

code = code.replace(/const handleReceiveMessage = \([\s\S]*?return newChannels;\s*\}\)\);\s*\};/, replacement.trim());
fs.writeFileSync('src/App.tsx', code);
