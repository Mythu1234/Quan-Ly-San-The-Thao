const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/TrangChu.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add lucide-react import
content = content.replace(
  "import { useState, useRef, useEffect } from 'react';",
  "import { useState, useRef, useEffect } from 'react';\nimport { Search, MapPin, Phone, Clock, Play, AlertCircle, CheckCircle2, Home, Calendar as CalendarIcon, Zap } from 'lucide-react';"
);

// 2. Replace Header Tra cuu icon
content = content.replace('<span>??</span>', '<Search className="w-3.5 h-3.5" />');

// 3. Replace Hero buttons
content = content.replace('<span>?</span>', '<Zap className="w-4 h-4" />');
content = content.replace('<span>?</span>', '<Play className="w-4 h-4 fill-current" />');

// 4. Replace Alert Icon
content = content.replace('<span className="text-base">??</span>', '<AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />');

// 5. Replace Contact Section Icons
content = content.replace('???', '<Home className="w-5 h-5" />'); // The one in the box
content = content.replace('?? <strong>Ð?a ch?:</strong>', '<MapPin className="w-3.5 h-3.5 inline mr-1 text-emerald-600" /> <strong>Ð?a ch?:</strong>');
content = content.replace('?? <strong>Hotline d?t sân:</strong>', '<Phone className="w-3.5 h-3.5 inline mr-1 text-emerald-600" /> <strong>Hotline d?t sân:</strong>');
content = content.replace('? <strong>Gi? m? c?a:</strong>', '<Clock className="w-3.5 h-3.5 inline mr-1 text-emerald-600" /> <strong>Gi? m? c?a:</strong>');

// Buttons in contact
content = content.replace('?? G?i Hotline', '<Phone className="w-3.5 h-3.5" /> G?i Hotline');
content = content.replace('??? Ch? du?ng Map', '<MapPin className="w-3.5 h-3.5" /> Ch? du?ng Map');

// 6. Replace Lookup not found icon
content = content.replace('<p className="text-base mb-1">??</p>', '<Search className="w-6 h-6 mx-auto mb-2 text-slate-400" />');

// 7. Footer icons
// Active logic is inside spans. We replace the span content.
content = content.replace('<span className="text-lg">???</span>', '<Home className="w-5 h-5 mb-0.5" />');
content = content.replace('<span className="text-lg">??</span>', '<CalendarIcon className="w-5 h-5 mb-0.5" />');
content = content.replace('<span className="text-lg">??</span>', '<Search className="w-5 h-5 mb-0.5" />');

// 8. Footer fixed class
content = content.replace(
  '<footer className="sticky bottom-0 z-40 w-full border-t border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur-md shadow-lg">',
  '<footer className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-md border-t border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur-md shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched successfully");
