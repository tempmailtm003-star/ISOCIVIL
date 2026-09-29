import fs from 'fs';
let code = fs.readFileSync('src/components/CommunicationCenter.tsx', 'utf8');

const receiveReplacement = `
      const handleReceiveMsg = (data: any) => {
         const { sender, message, incidentId } = data;
         let resolvedChannelId = 'inc-015';
         if (incidentId === 'general') resolvedChannelId = 'general';
         else if (incidentId?.startsWith('direct-')) resolvedChannelId = incidentId;
         else if (incidentId?.startsWith('inc-')) resolvedChannelId = incidentId;
         else if (incidentId) resolvedChannelId = \`inc-\${incidentId}\`;
         
         setMessages(prev => [...prev, {
            id: \`msg-\${Date.now()}\`,
            channelId: resolvedChannelId,
            sender: sender,
            senderType: 'Responder',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: message
         }]);
      };
`;

code = code.replace(/const handleReceiveMsg = \([\s\S]*?\}\]\);\s*\};/, receiveReplacement.trim());
fs.writeFileSync('src/components/CommunicationCenter.tsx', code);
