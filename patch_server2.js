import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const updatedStatus = `
    // Responder status update
    socket.on('responder:update_status', (data) => {
      const { unitId, status } = data;
      const res = responders.get(unitId) || { socketId: socket.id, telemetry: null };
      res.status = status;
      responders.set(unitId, res);
      io.to('dispatchers').emit('responder:status_changed', { unitId, status });
    });
    
    // Responder sends message
    socket.on('responder:send_message', (data) => {
       io.to('dispatchers').emit('dispatcher:receive_message', data);
    });
`;

code = code.replace(/\/\/ Responder status update[\s\S]*?\}\);/, updatedStatus);

// Also fix responder:login emitting responder:status instead of responder:status_changed
code = code.replace(/io\.to\('dispatchers'\)\.emit\('responder:status'/g, "io.to('dispatchers').emit('responder:status_changed'");

fs.writeFileSync('server.ts', code);
