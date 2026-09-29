import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const replaceDirective = `
    const targetInc = incidents.find(i => i.id === incidentId);
    
    socket.emit('dispatcher:send_directive', {
      unitId: vehicleId,
      directive: \`DIRECTIVE: You have been dispatched to \${incidentId}. Acknowledge and proceed.\`,
      incident: targetInc
    });
`;

code = code.replace(/socket\.emit\('dispatcher:send_directive', \{\s*unitId: vehicleId,\s*directive: `DIRECTIVE: You have been dispatched to \$\{incidentId\}\. Acknowledge and proceed\.`\s*\}\);/, replaceDirective);

fs.writeFileSync('src/App.tsx', code);
