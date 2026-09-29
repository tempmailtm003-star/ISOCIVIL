import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Also ensure imports exist
if (!code.includes('IncidentHistoryView')) {
  code = code.replace(/import \{[\s\S]*?\} from '\.\/components\/Views';/, (match) => {
    return match.replace("SettingsView", "SettingsView,\n  IncidentHistoryView,\n  ManualView");
  });
}

const replacement = `      case 'Incident History':
        return <IncidentHistoryView incidents={incidents} onViewIncident={setSelectedIncident} />;
      case 'Manual':
        return <ManualView />;
      case 'System Settings':
        return <SettingsView />;`;

code = code.replace(/case 'System Settings':\s*return <SettingsView \/>;/, replacement);

fs.writeFileSync('src/App.tsx', code);
