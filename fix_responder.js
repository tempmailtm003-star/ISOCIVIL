import fs from 'fs';

let code = fs.readFileSync('src/ResponderApp.tsx', 'utf8');

code = code.replace(/<form onSubmit=\{handleSendMessage\} className="p-2 border-t/, "</div>\n           <form onSubmit={handleSendMessage} className=\"p-2 border-t");

fs.writeFileSync('src/ResponderApp.tsx', code);
