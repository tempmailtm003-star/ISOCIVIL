import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const responderSendsMessage = `
    // Responder sends message
    socket.on('responder:send_message', (data) => {
       io.to('dispatchers').emit('dispatcher:receive_message', data);
       
       // Broadcast to other responders in the same incident or general
       if (data.incidentId === 'general') {
         socket.broadcast.emit('responder:receive_message', data);
       } else if (data.incidentId?.startsWith('direct-')) {
         // Direct messages from responder to dispatcher don't get broadcasted to other units
       } else {
         const targetInc = data.incidentId?.replace('inc-', '') || data.incidentId;
         for (const [uid, directiveInfo] of activeDirectives.entries()) {
           if (uid !== data.sender && directiveInfo.incident && directiveInfo.incident.id === targetInc) {
             const res = responders.get(uid);
             if (res) {
               io.to(res.socketId).emit('responder:receive_message', data);
             }
           }
         }
       }
    });
`;

code = code.replace(/\/\/ Responder sends message[\s\S]*?io\.to\('dispatchers'\)\.emit\('dispatcher:receive_message', data\);\s*[\s\S]*?\}\s*\}\s*\n\s*\}\s*\}\);/, responderSendsMessage.trim());

const dispatcherBroadcast = `
    socket.on('dispatcher:broadcast', (data) => {
       const { incidentId, message } = data;
       
       if (incidentId === 'general') {
         socket.broadcast.emit('responder:receive_message', { incidentId, message, sender: 'Dispatch Command' });
       } else if (incidentId?.startsWith('direct-')) {
         const targetUnit = incidentId.replace('direct-', '');
         const res = responders.get(targetUnit);
         if (res) {
           io.to(res.socketId).emit('responder:receive_message', { incidentId, message, sender: 'Dispatch Command' });
         }
       } else {
         const targetInc = incidentId?.replace('inc-', '') || incidentId;
         for (const [uid, directiveInfo] of activeDirectives.entries()) {
           if (directiveInfo.incident && directiveInfo.incident.id === targetInc) {
             const res = responders.get(uid);
             if (res) {
               io.to(res.socketId).emit('responder:receive_message', { incidentId, message, sender: 'Dispatch Command' });
             }
           }
         }
       }
    });
`;

code = code.replace(/socket\.on\('dispatcher:broadcast', \([\s\S]*?\}\);/m, dispatcherBroadcast.trim());

fs.writeFileSync('server.ts', code);
