import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace INITIAL_INCIDENTS with a function that generates random incidents
const generateIncidentsCode = `
const INCIDENT_LOCATIONS = [
  { name: 'Anna Nagar West, Chennai', lat: 13.0878, lng: 80.2184, type: 'Fire', desc: 'Commercial transformer fire with heavy smoke' },
  { name: 'Guindy Flyover Intersection, Chennai', lat: 13.0067, lng: 80.2206, type: 'Accident', desc: 'Multiple vehicle pileup. Rapid emergency cordon required.' },
  { name: 'T. Nagar Ranganathan St, Chennai', lat: 13.0418, lng: 80.2341, type: 'Medical', desc: 'Critical cardiac resuscitation and emergency stabilization' },
  { name: 'Mylapore Tank Area, Chennai', lat: 13.0336, lng: 80.2685, type: 'Fire', desc: 'Roof fire in residential apartment block' },
  { name: 'Velachery Bypass Road, Chennai', lat: 12.9815, lng: 80.2180, type: 'Accident', desc: 'Vehicle breakdown blocking central lane' },
  { name: 'Besant Nagar Beach, Chennai', lat: 12.9996, lng: 80.2730, type: 'Medical', desc: 'Possible drowning incident, CPR required' },
  { name: 'Nungambakkam High Road, Chennai', lat: 13.0610, lng: 80.2450, type: 'Accident', desc: 'Pedestrian struck by two-wheeler' },
  { name: 'Tambaram Railway Station, Chennai', lat: 12.9248, lng: 80.1103, type: 'Security', desc: 'Suspicious package reported on platform 2' },
  { name: 'OMR IT Expressway, Chennai', lat: 12.9038, lng: 80.2285, type: 'Fire', desc: 'Server room fire in IT park' },
  { name: 'Adyar Signal, Chennai', lat: 13.0064, lng: 80.2575, type: 'Accident', desc: 'Bus collision with auto rickshaw' }
];

const generateRandomIncidents = (count = 4) => {
  const incidents = [];
  const usedLocations = new Set();
  
  while (incidents.length < count && usedLocations.size < INCIDENT_LOCATIONS.length) {
    const locIdx = Math.floor(Math.random() * INCIDENT_LOCATIONS.length);
    if (!usedLocations.has(locIdx)) {
      usedLocations.add(locIdx);
      const chosen = INCIDENT_LOCATIONS[locIdx];
      const newIncId = \`INC-2026-0\${Math.floor(Math.random() * 90) + 10}\`;
      
      incidents.push({
        id: newIncId,
        type: chosen.type,
        location: chosen.name,
        lat: chosen.lat,
        lng: chosen.lng,
        priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
        dispatch: 'Pending Dispatch',
        status: 'In Progress',
        time: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: chosen.desc
      });
    }
  }
  return incidents;
};

const INITIAL_INCIDENTS = generateRandomIncidents(4);
`;

// Remove the old INITIAL_INCIDENTS block
code = code.replace(/const INITIAL_INCIDENTS: Incident\[\] = \[[\s\S]*?(?=const INITIAL_VEHICLES)/, generateIncidentsCode + "\n\n");

// Update handleSimulateTurnout to avoid duplicates
const handleSimulateTurnoutReplace = `
  const handleSimulateTurnout = () => {
    let availableLocations = INCIDENT_LOCATIONS.filter(loc => !incidents.some(inc => inc.location === loc.name));
    if (availableLocations.length === 0) {
      // If all used, allow reuse
      availableLocations = INCIDENT_LOCATIONS;
    }
    
    const chosen = availableLocations[Math.floor(Math.random() * availableLocations.length)];
    const newIncId = \`INC-2026-0\${Math.floor(Math.random() * 90) + 10}\`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newIncident: Incident = {
      id: newIncId,
      type: chosen.type as any,
      location: chosen.name,
      lat: chosen.lat,
      lng: chosen.lng,
      priority: 'High',
      dispatch: 'Pending Dispatch',
      status: 'In Progress',
      time: nowTime,
      description: chosen.desc
    };
`;

code = code.replace(/const handleSimulateTurnout = \(\) => \{[\s\S]*?const newIncident: Incident = \{[\s\S]*?description: chosen.desc\n    \};/, handleSimulateTurnoutReplace);

fs.writeFileSync('src/App.tsx', code);
