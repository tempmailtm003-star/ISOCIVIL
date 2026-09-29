import fs from 'fs';
let code = fs.readFileSync('src/ResponderApp.tsx', 'utf8');

const tabStateRegex = /const \[activeChatTab, setActiveChatTab\] = useState\<'incident' \| 'direct'\>\('incident'\);/;
code = code.replace(tabStateRegex, "const [activeChatTab, setActiveChatTab] = useState<'incident' | 'direct' | 'general'>('incident');");

const tabJSX = `
           <div className="flex border-b border-[#172338] bg-[#0d1322] overflow-x-auto scrollbar-none">
             <button 
               onClick={() => setActiveChatTab('incident')}
               className={\`shrink-0 p-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors \${activeChatTab === 'incident' ? 'text-amber-400 border-b-2 border-amber-500 bg-[#111927]' : 'text-slate-400 hover:bg-[#111927]'}\`}
             >
               <Radio size={14} /> Tactical Net
             </button>
             <button 
               onClick={() => setActiveChatTab('direct')}
               className={\`shrink-0 p-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors \${activeChatTab === 'direct' ? 'text-blue-400 border-b-2 border-blue-500 bg-[#111927]' : 'text-slate-400 hover:bg-[#111927]'}\`}
             >
               <LogOut size={14} className="rotate-180" /> Direct Link
             </button>
             <button 
               onClick={() => setActiveChatTab('general')}
               className={\`shrink-0 p-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors \${activeChatTab === 'general' ? 'text-purple-400 border-b-2 border-purple-500 bg-[#111927]' : 'text-slate-400 hover:bg-[#111927]'}\`}
             >
               <Globe size={14} /> Citywide
             </button>
           </div>
`;

code = code.replace(/<div className="flex border-b border-\[#172338\] bg-\[#0d1322\]">[\s\S]*?<\/button>\s*<\/div>/, tabJSX.trim());

const formJSX = `
           <form onSubmit={handleSendMessage} className="p-2 border-t border-[#172338] bg-[#0d1322] flex gap-2">
             <input
               type="text"
               value={messageInput}
               onChange={e => setMessageInput(e.target.value)}
               placeholder={activeChatTab === 'general' ? 'Citywide broadcasts are read-only...' : "Send tactical message..."}
               disabled={activeChatTab === 'general'}
               className="flex-1 bg-[#111927] border border-[#1d2a42] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
             />
             <button type="submit" disabled={activeChatTab === 'general'} className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-colors">
               Send
             </button>
           </form>
`;

code = code.replace(/<form onSubmit=\{handleSendMessage\} className="p-2 border-t border-\[#172338\] bg-\[#0d1322\] flex gap-2">[\s\S]*?<\/form>/, formJSX.trim());

code = code.replace(/import \{.*?\} from 'lucide-react';/, (match) => match.replace('}', ', Globe }'));

fs.writeFileSync('src/ResponderApp.tsx', code);
