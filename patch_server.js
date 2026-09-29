import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

const updateStatusReplacement = `
    // Clear directive if status is completed
    socket.on('responder:update_status', (data) => {
      const { unitId, status } = data;
      const res = responders.get(unitId) || { socketId: socket.id, telemetry: null };
      res.status = status;
      responders.set(unitId, res);
      io.to('dispatchers').emit('responder:status_changed', { unitId, status });
    });
`;

code = code.replace(/\/\/ Clear directive if status is completed[\s\S]*?io\.to\('dispatchers'\)\.emit\('responder:status_changed', \{ unitId, status \}\);\s*\}\);/, updateStatusReplacement.trim());

fs.writeFileSync('server.ts', code);
