import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const callEffect = `
  useEffect(() => {
    const handleCallAnswered = (data: any) => {
       setRadioSession(prev => prev ? { ...prev, isConnected: true } : prev);
       playRadioCallTone('connected');
    };
    
    const handleCallDeclined = () => {
       handleEndRadioCall();
    };

    socket.on('dispatcher:call_answered', handleCallAnswered);
    socket.on('dispatcher:call_declined', handleCallDeclined);
    socket.on('call:ended', () => {
       handleEndRadioCall();
    });

    return () => {
      socket.off('dispatcher:call_answered', handleCallAnswered);
      socket.off('dispatcher:call_declined', handleCallDeclined);
      socket.off('call:ended');
    };
  }, []);
`;
code = code.replace("  // Active Radio Call Duration Timer", callEffect + "\n  // Active Radio Call Duration Timer");

if (!code.includes("socket.emit('dispatcher:call_unit'")) {
    code = code.replace("const handleStartRadioCall = (target: {", 
      `const handleStartRadioCall = (target: {`);
      
    code = code.replace(/const newSession: RadioCallSession = \{/,
    `
    if (target.type === 'Unit') {
      socket.emit('dispatcher:call_unit', { unitId: target.id, callerName: 'ERC Command' });
    }
    const newSession: RadioCallSession = {`);
}

fs.writeFileSync('src/App.tsx', code);
