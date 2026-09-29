import fs from 'fs';
let code = fs.readFileSync('src/ResponderApp.tsx', 'utf8');

const updateStatusReplacement = `
  const updateStatus = (newStatus: string) => {
    setStatus(newStatus);
    socket.emit('responder:update_status', { unitId, status: newStatus });
    
    // Clear active mission UI if completed or available
    if (newStatus === 'Completed' || newStatus === 'Available') {
      setCurrentMission(null);
      setMessages(prev => prev.filter(m => m.channelId !== 'incident'));
      setActiveChatTab('general');
    }
  };
`;

code = code.replace(/const updateStatus = \([\s\S]*?\}\;/m, updateStatusReplacement.trim());
fs.writeFileSync('src/ResponderApp.tsx', code);
