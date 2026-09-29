import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/    const targetInc = incidents\.find\(i => i\.id === incidentId\);\n\n    const targetVehicle = vehicles\.find\(v => v\.id === vehicleId\);/, "    const targetVehicle = vehicles.find(v => v.id === vehicleId);");

fs.writeFileSync('src/App.tsx', code);
