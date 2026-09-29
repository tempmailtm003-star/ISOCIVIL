import fs from 'fs';
let code = fs.readFileSync('src/components/CommunicationCenter.tsx', 'utf8');

const regex = /channelId: incidentId \? \(incidentId\.startsWith\('inc-'\) \? incidentId : \`inc-\$\{incidentId\}\`\) : 'inc-015',/;
code = code.replace(regex, "channelId: incidentId === 'general' ? 'general' : (incidentId ? (incidentId.startsWith('inc-') ? incidentId : `inc-${incidentId}`) : 'inc-015'),");

fs.writeFileSync('src/components/CommunicationCenter.tsx', code);
