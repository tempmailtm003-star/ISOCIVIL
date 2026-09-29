import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/case 'Manual':\s*return <ManualView \/>;/, `case 'Incident History':
        return <IncidentHistoryView incidents={incidents} onViewIncident={setSelectedIncident} />;
      case 'Manual':
        return <ManualView />;`);
fs.writeFileSync('src/App.tsx', code);
