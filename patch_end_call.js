import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const endCall = `
  const handleEndRadioCall = () => {
    if (radioSession && radioSession.targetType === 'Unit') {
       socket.emit('call:end', { targetSocketId: radioSession.targetId });
    }
    playRadioCallTone('disconnected');
    setRadioSession(null);
    setIsRadioModalOpen(false);
    setIsRadioMinimized(false);
  };
`;

code = code.replace(/const handleEndRadioCall = \(\) => \{[\s\S]*?setIsRadioMinimized\(false\);\s*\};/, endCall);
fs.writeFileSync('src/App.tsx', code);
