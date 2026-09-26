const fs = require('fs');
let code = fs.readFileSync('src/pages/TrangChu.tsx', 'utf8');

// Replace the malformed section
const malformed = \            </div>
              <div className="flex justify-between text-slate-700">
                <span>Pickleball (Sân PB 02)</span>
                <span className="text-emerald-600 font-bold">14:00 - 15:30 (Hôm nay)</span>
              </div>
            </div>\;

code = code.replace(/<\/div>\s*<div className="flex justify-between text-slate-700">[\s\S]*?14:00 - 15:30 \(Hôm nay\)<\/span>\s*<\/div>\s*<\/div>/, "");

fs.writeFileSync('src/pages/TrangChu.tsx', code, 'utf8');
