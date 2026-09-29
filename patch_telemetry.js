import fs from 'fs';

let code = fs.readFileSync('src/ResponderApp.tsx', 'utf8');

code = code.replace(/lat: 13\.0 \+ Math\.random\(\) \* 0\.1,/, "");
code = code.replace(/lng: 80\.2 \+ Math\.random\(\) \* 0\.1,/, "");

fs.writeFileSync('src/ResponderApp.tsx', code);

let code2 = fs.readFileSync('src/App.tsx', 'utf8');
code2 = code2.replace(/lat: telemetry\.lat,\s*lng: telemetry\.lng,/, "");
fs.writeFileSync('src/App.tsx', code2);

