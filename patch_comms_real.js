import fs from 'fs';

let code = fs.readFileSync('src/components/CommunicationCenter.tsx', 'utf8');

if (!code.includes("import { socket }")) {
  code = code.replace("import React, { useState, useRef, useEffect } from 'react';", "import React, { useState, useRef, useEffect } from 'react';\nimport { socket } from '../socket';");
}

const receiveEffect = `
  useEffect(() => {
    const handleReceiveMsg = (data: any) => {
       const { sender, message, incidentId } = data;
       setMessages(prev => [...prev, {
          id: \`msg-\${Date.now()}\`,
          channelId: incidentId || 'inc-015',
          sender: sender,
          senderType: 'Responder',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: message
       }]);
    };
    socket.on('dispatcher:receive_message', handleReceiveMsg);
    return () => {
      socket.off('dispatcher:receive_message', handleReceiveMsg);
    }
  }, []);
`;

if (!code.includes("dispatcher:receive_message")) {
  code = code.replace("const [channelCategory, setChannelCategory] = useState<'All' | 'Incident' | 'Inter-Unit' | 'Agency'>('All');", 
    "const [channelCategory, setChannelCategory] = useState<'All' | 'Incident' | 'Inter-Unit' | 'Agency'>('All');\n" + receiveEffect);
}

const handleSendTextFix = `
  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    playRadioChirp('transmit');

    socket.emit('dispatcher:broadcast', { incidentId: activeChannelId, message: inputText.trim() });

    const newMsg: ChatMessage = {
`;

code = code.replace(/const handleSendText = \(e\?: React\.FormEvent\) => \{[\s\S]*?const newMsg: ChatMessage = \{/, handleSendTextFix);

const handleQuickStatusFix = `
  const handleQuickStatus = (status: 'EN_ROUTE' | 'ON_SCENE' | 'BACKUP_REQUESTED' | 'PATIENT_LOADED' | 'CONTAINED', label: string) => {
    playRadioChirp(status === 'BACKUP_REQUESTED' ? 'alert' : 'transmit');
    
    // Also emit over socket for responders to see
    socket.emit('dispatcher:broadcast', { incidentId: activeChannelId, message: label });
`;
code = code.replace(/const handleQuickStatus = \(status: 'EN_ROUTE' \| 'ON_SCENE' \| 'BACKUP_REQUESTED' \| 'PATIENT_LOADED' \| 'CONTAINED', label: string\) => \{\s*playRadioChirp\(status === 'BACKUP_REQUESTED' \? 'alert' : 'transmit'\);/, handleQuickStatusFix);

fs.writeFileSync('src/components/CommunicationCenter.tsx', code);
