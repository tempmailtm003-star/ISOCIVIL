import fs from 'fs';
let code = fs.readFileSync('src/ResponderApp.tsx', 'utf8');

const VALID_UNITS = "['FE-12', 'FE-04', 'FE-09', 'FE-18', 'FE-02', 'AMB-07', 'AMB-02', 'AMB-11', 'AMB-16', 'AMB-22', 'AMB-33', 'PV-23', 'PV-12', 'PV-08', 'PV-31', 'PV-45', 'PV-52', 'SWAT-01', 'TP-19', 'RT-01', 'RT-05', 'RT-09', 'HZ-03', 'HZ-07', 'UAV-01', 'UAV-02', 'UAV-03', 'CGR-02', 'CGR-05', 'EV-01']";

const loginReplacement = `
  const VALID_UNITS = ${VALID_UNITS};
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (unitId.trim() && password.trim() === '1234') {
      if (!VALID_UNITS.includes(unitId.trim().toUpperCase())) {
         alert("Invalid Unit ID. Please enter a valid designated callsign.");
         return;
      }
      setUnitId(unitId.trim().toUpperCase());
      setIsLoggedIn(true);
    } else {
      alert("Invalid credentials. Try Unit ID (e.g., FE-12) and password '1234'");
    }
  };
`;

code = code.replace(/const handleLogin = \([\s\S]*?alert\("Invalid credentials\. Try Unit ID[\s\S]*?\}\;/m, loginReplacement.trim());

const sendMessageReplacement = `
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      socket.emit('responder:send_message', {
        sender: unitId,
        message: messageInput,
        incidentId: activeChatTab === 'incident' ? currentMission?.id : \`direct-\${unitId}\`
      });
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'You',
        text: messageInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'message',
        channelId: activeChatTab
      }]);
      setMessageInput('');
    }
  };
`;
code = code.replace(/const handleSendMessage = \([\s\S]*?setMessageInput\(''\);\s*\}\s*\};/, sendMessageReplacement.trim());

const receiveMessageReplacement = `
      socket.on('responder:receive_message', (data) => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: data.sender || 'Dispatch',
          text: data.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'message',
          channelId: (data.incidentId === 'general' || data.incidentId?.startsWith('direct-')) ? 'general' : 'incident'
        }]);
      });
`;
code = code.replace(/socket\.on\('responder:receive_message'[\s\S]*?type: 'message',\s*channelId:[\s\S]*?\}\]\);\s*\}\);/, receiveMessageReplacement.trim());

fs.writeFileSync('src/ResponderApp.tsx', code);
