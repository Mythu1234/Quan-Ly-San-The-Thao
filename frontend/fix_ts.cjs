const fs = require('fs');
let code = fs.readFileSync('src/pages/TrangChu.tsx', 'utf8');
code = code.replace(/const CheckIcon = \(\) => \([\s\S]*?<\/svg>\n\);/, '');
code = code.replace(/const getAvailableCourts = \(sportId, date, time\) => \{/, 'const getAvailableCourts = (sportId: string, date: string, time: string) => {');
fs.writeFileSync('src/pages/TrangChu.tsx', code, 'utf8');
