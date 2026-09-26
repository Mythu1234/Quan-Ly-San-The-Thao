const fs = require('fs');
let code = fs.readFileSync('src/pages/TrangChu.tsx', 'utf8');

code = code.replace(
  /className=\{w-full text-center text-2xl tracking-widest font-mono font-black rounded-xl border  px-4 py-3 outline-none transition focus:border-emerald-500\}/,
  "className={'w-full text-center text-2xl tracking-widest font-mono font-black rounded-xl border px-4 py-3 outline-none transition focus:border-emerald-500 ' + (otpError ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-900')}"
);

fs.writeFileSync('src/pages/TrangChu.tsx', code, 'utf8');
