import fs from 'fs';
let code = fs.readFileSync('src/ResponderApp.tsx', 'utf8');

const messagesStateReplacement = `
  const [messages, setMessages] = useState<{ id: string; sender: string; text: string; time: string; type: 'message' | 'directive'; channelId?: 'incident' | 'general' }[]>([]);
  const [activeChatTab, setActiveChatTab] = useState<'incident' | 'general'>('incident');
`;
code = code.replace(/const \[messages, setMessages\] = useState<\{ id: string; sender: string; text: string; time: string; type: 'message' \| 'directive' \}\[\]>\(\[\]\);/, messagesStateReplacement.trim());

const directiveListenerReplacement = `
      socket.on('responder:receive_directive', (data) => {
        let text = data;
        if (typeof data === 'object') {
          text = data.directive;
          if (data.incident) {
             setCurrentMission(data.incident);
             setStatus('Dispatched');
             // Also send back status update
             socket.emit('responder:update_status', { unitId, status: 'Dispatched' });
          }
        }
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'Dispatch Command',
          text: text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'directive',
          channelId: 'incident'
        }]);
      });
`;
code = code.replace(/socket\.on\('responder:receive_directive'[\s\S]*?type: 'directive'\s*\}\]\);\s*\}\);/, directiveListenerReplacement.trim());

const messageListenerReplacement = `
      socket.on('responder:receive_message', (data) => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: data.sender || 'Dispatch',
          text: data.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'message',
          channelId: data.incidentId === 'general' || !data.incidentId ? 'general' : 'incident'
        }]);
      });
`;
code = code.replace(/socket\.on\('responder:receive_message'[\s\S]*?type: 'message'\s*\}\]\);\s*\}\);/, messageListenerReplacement.trim());

fs.writeFileSync('src/ResponderApp.tsx', code);
