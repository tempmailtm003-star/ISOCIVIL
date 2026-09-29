import fs from 'fs';
let code = fs.readFileSync('src/ResponderApp.tsx', 'utf8');

const updateStatusReplacement = `
  const updateStatus = (newStatus: string) => {
    setStatus(newStatus);
    socket.emit('responder:update_status', { unitId, status: newStatus });
    
    // Clear active mission UI if completed or available
    if (newStatus === 'Completed' || newStatus === 'Available') {
      setCurrentMission(null);
    }
  };
`;

code = code.replace(/const updateStatus = \([\s\S]*?\}\;/m, updateStatusReplacement.trim());

// We also need to add color coding to messages in the tactical net.
// Dispatch messages: text-blue-400 / bg-blue-500/10
// Other Dept messages: text-purple-400 / bg-purple-500/10
// You messages: text-emerald-400 / bg-emerald-500/10

code = code.replace(
  /<div key=\{msg.id\} className=\{`p-2\.5 rounded-xl border text-xs \$\{msg\.type === 'directive' \? 'bg-amber-500\/10 border-amber-500\/30' : 'bg-\[#111927\] border-\[#1d2a42\]'\}`\}>/g,
  `<div key={msg.id} className={\`p-2.5 rounded-xl border text-xs \${
    msg.type === 'directive' ? 'bg-amber-500/10 border-amber-500/30' : 
    msg.sender === 'You' ? 'bg-emerald-500/10 border-emerald-500/30' :
    msg.sender.toLowerCase().includes('dispatch') || msg.sender === 'ERC Command' ? 'bg-blue-500/10 border-blue-500/30' :
    'bg-purple-500/10 border-purple-500/30'
  }\`}>`
);

code = code.replace(
  /<span className=\{`font-bold \$\{msg\.type === 'directive' \? 'text-amber-400' : 'text-blue-400'\}`\}>\{msg\.sender\}<\/span>/g,
  `<span className={\`font-bold \${
    msg.type === 'directive' ? 'text-amber-400' : 
    msg.sender === 'You' ? 'text-emerald-400' :
    msg.sender.toLowerCase().includes('dispatch') || msg.sender === 'ERC Command' ? 'text-blue-400' :
    'text-purple-400'
  }\`}>{msg.sender}</span>`
);


fs.writeFileSync('src/ResponderApp.tsx', code);
