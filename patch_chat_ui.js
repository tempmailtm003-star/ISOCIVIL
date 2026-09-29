import fs from 'fs';
let code = fs.readFileSync('src/ResponderApp.tsx', 'utf8');

const handleSendMessageReplacement = `
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      socket.emit('responder:send_message', {
        sender: unitId,
        message: messageInput,
        incidentId: activeChatTab === 'incident' ? currentMission?.id : 'general'
      });
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'You',
        text: messageInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'message',
        channelId: activeChatTab
      }]);
      setMessageInput('');
    }
  };
`;
code = code.replace(/const handleSendMessage = \([\s\S]*?setMessageInput\(''\);\s*\}\s*\};/, handleSendMessageReplacement.trim());


const chatUIReplacement = `
        {/* Live Chat / Directives */}
        <div className="bg-[#0b101d] border border-[#172338] rounded-2xl flex flex-col h-72 overflow-hidden shadow-lg">
           <div className="flex border-b border-[#172338] bg-[#0d1322]">
             <button 
               onClick={() => setActiveChatTab('incident')}
               className={\`flex-1 p-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors \${activeChatTab === 'incident' ? 'text-amber-400 border-b-2 border-amber-500 bg-[#111927]' : 'text-slate-400 hover:bg-[#111927]'}\`}
             >
               <Radio size={14} /> Tactical Net
             </button>
             <button 
               onClick={() => setActiveChatTab('general')}
               className={\`flex-1 p-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors \${activeChatTab === 'general' ? 'text-blue-400 border-b-2 border-blue-500 bg-[#111927]' : 'text-slate-400 hover:bg-[#111927]'}\`}
             >
               <LogOut size={14} className="rotate-180" /> Direct Link
             </button>
           </div>
           
           <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {messages.filter(m => m.channelId === activeChatTab).length === 0 ? (
                 <div className="text-center text-slate-500 text-xs mt-10">
                   {activeChatTab === 'incident' ? 'Secure channel established. Awaiting dispatch.' : 'Direct dispatch channel open.'}
                 </div>
              ) : (
                 messages.filter(m => m.channelId === activeChatTab).map(msg => (
`;

code = code.replace(/\{\/\* Live Chat \/ Directives \*\/\}[\s\S]*?messages\.map\(msg => \(/, chatUIReplacement.trim());

fs.writeFileSync('src/ResponderApp.tsx', code);
