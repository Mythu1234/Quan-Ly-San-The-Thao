const fs = require('fs');
let code = fs.readFileSync('src/pages/TrangChu.tsx', 'utf8');

code = code.replace(/<span>🔎<\/span>/g, '<Search className="w-4 h-4" />');
code = code.replace(/<span>⚡<\/span>/g, '<Zap className="w-4 h-4" />');
code = code.replace(/<span>▶<\/span>/g, '<Play className="w-4 h-4 fill-current" />');
code = code.replace(/<span className="text-base">⚠️<\/span>/g, '<AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />');
code = code.replace(/🏟️/g, '<Home className="w-5 h-5" />');
code = code.replace(/📍/g, '<MapPin className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />');
code = code.replace(/📞/g, '<Phone className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />');
code = code.replace(/⏰/g, '<Clock className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />');
code = code.replace(/🗺️/g, '<MapPin className="w-3.5 h-3.5 inline mr-1" />');
code = code.replace(/<p className="text-base mb-1">🔍<\/p>/g, '<Search className="w-6 h-6 mx-auto mb-2 text-slate-400" />');
code = code.replace(/<span className="text-lg"><Home className="w-5 h-5" \/><\/span>/g, '<Home className="w-5 h-5 mb-0.5" />');
code = code.replace(/<span className="text-lg">📅<\/span>/g, '<CalendarIcon className="w-5 h-5 mb-0.5" />');
code = code.replace(/<span className="text-lg">🔎<\/span>/g, '<Search className="w-5 h-5 mb-0.5" />');
code = code.replace(/<span className="text-lg">dY"\.<\/span>/g, '<CalendarIcon className="w-5 h-5 mb-0.5" />'); // just in case

fs.writeFileSync('src/pages/TrangChu.tsx', code, 'utf8');
