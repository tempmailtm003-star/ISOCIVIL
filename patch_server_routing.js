import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const sendMessageReplacement = `
    // Responder sends message
    socket.on('responder:send_message', (data) => {
       io.to('dispatchers').emit('dispatcher:receive_message', data);
       
       // Broadcast to other responders in the same incident or general
       if (data.incidentId === 'general') {
         socket.broadcast.emit('responder:receive_message', data);
       } else {
         const targetInc = data.incidentId.replace('inc-', '');
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

code = code.replace(/\/\/ Responder sends message[\s\S]*?io\.to\('dispatchers'\)\.emit\('dispatcher:receive_message', data\);\s*\}\);/, sendMessageReplacement.trim());

const broadcastReplacement = `
    socket.on('dispatcher:broadcast', (data) => {
       const { incidentId, message } = data;
       
       if (incidentId === 'general') {
         socket.broadcast.emit('responder:receive_message', { incidentId, message, sender: 'Dispatch Command' });
       } else {
         const targetInc = incidentId.replace('inc-', '');
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

code = code.replace(/socket\.on\('dispatcher:broadcast', \([\s\S]*?\}\);/, broadcastReplacement.trim());

fs.writeFileSync('server.ts', code);
