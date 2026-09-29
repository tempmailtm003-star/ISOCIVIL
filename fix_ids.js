import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/const newIncId = `INC-2026-0\${Math.floor\(Math.random\(\) \* 90\) \+ 10}`;/g, 
  "const newIncId = `INC-2026-0${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 1000)}`;");

fs.writeFileSync('src/App.tsx', code);
