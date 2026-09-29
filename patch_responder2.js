import fs from 'fs';

let code = fs.readFileSync('src/ResponderApp.tsx', 'utf8');

// Add input state
if (!code.includes("const [messageInput, setMessageInput] = useState('');")) {
  code = code.replace("const [status, setStatus] = useState('Available');", "const [status, setStatus] = useState('Available');\n  const [messageInput, setMessageInput] = useState('');");
}

const handleSendMessage = `
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      socket.emit('responder:send_message', {
        sender: unitId,
        message: messageInput,
        incidentId: currentMission?.id
      });
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'You',
        text: messageInput,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'message'
      }]);
      setMessageInput('');
    }
  };
`;
if (!code.includes("const handleSendMessage")) {
  code = code.replace("const updateStatus = (newStatus: string) => {", handleSendMessage + "\n  const updateStatus = (newStatus: string) => {");
}

const chatInputUI = `
           <form onSubmit={handleSendMessage} className="p-2 border-t border-[#172338] bg-[#0d1322] flex gap-2">
             <input
               type="text"
               value={messageInput}
               onChange={e => setMessageInput(e.target.value)}
               placeholder="Send tactical message..."
               className="flex-1 bg-[#111927] border border-[#1d2a42] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
             />
             <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors">
               Send
             </button>
           </form>
        </div>
`;

if (!code.includes("onSubmit={handleSendMessage}")) {
  code = code.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* VoIP Call Overlay \*\/\}/, chatInputUI + "\n      </div>\n\n      {/* VoIP Call Overlay */}");
}

fs.writeFileSync('src/ResponderApp.tsx', code);
