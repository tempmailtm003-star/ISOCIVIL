import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/socket\.broadcast\.emit\('responder:receive_message', \{ incidentId, message \}\);/, "socket.broadcast.emit('responder:receive_message', { incidentId, message, sender: 'Dispatch Command' });");
fs.writeFileSync('server.ts', code);
